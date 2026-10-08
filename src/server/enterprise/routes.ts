/**
 * VELATRIX AOS · Enterprise · Rotas HTTP (P19/P20).
 *
 * /api/enterprise/*  — HITL (P12), Guardrail (P11), Ledger encadeado, Selo do laudo (P10/P13/P17).
 *
 * Regras que o servidor impõe (nunca o browser):
 *  - tenantId e ator vêm SEMPRE da sessão (multiTenantAuthMiddleware), nunca do body/query.
 *  - payloadHash e guardrail são calculados no servidor a partir do payload recebido.
 *  - revisão só vale para o hash ATUAL; aprovação exige revisão do hash atual + guardrail APROVADO.
 *  - permissão approve:<esteira>, registro profissional, step-up (senha real) e 4 olhos via hitl.aprovar().
 *  - payload recalculado pelo agente zera aprovações coletadas (4 olhos sobre o conteúdo novo).
 *  - execução idempotente, com trava em processo contra execução concorrente.
 *  - toda transição gera entrada no Audit Ledger encadeado por tenant.
 */
import type { Express, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { SERVER_USERS, verifyPassword, type AuthenticatedRequest } from '../auth/serverAuth';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import {
  AGENTES_ENXAME,
  aprovar,
  devolver,
  executar,
  registrarRevisao,
  rejeitar,
  transicionar,
  type Aprovador,
  type ExternalAction,
  type WorkItem,
  type WorkItemStatus,
} from '../../enterprise/hitl';
import type { Esteira, Flag } from '../../enterprise/riskShield';
import { verificarTexto, type GuardrailResultado } from '../../enterprise/guardrail';
import { NormaRegistry, NORMAS_SEED } from '../../enterprise/normaRef';
import { ESTEIRAS, ROLE_APPROVE, podeAprovarEsteira } from '../../enterprise/approvalPolicy';
import { DEMO_SEED, valorExposto } from '../../enterprise/demoSeed';
import { computeLaudoSeal, enterpriseStore, type LaudoSealRecord, type StoredWorkItem } from './store';
import { hashCanonicalSync } from './hashSync';
import { validateAndComputeReportHash } from '../../services/reportEmissionGuardService';
import type { StandardizedAuditReport } from '../../types/standardizedPipeline';

// ───────── domínio ─────────

const TIPOS: readonly WorkItem['tipo'][] = ['GERAR_LAUDO_FINAL', 'EXPORTAR_PACOTE_PROTOCOLO'];
const FLAGS: readonly Flag[] = ['GREEN', 'YELLOW', 'RED', 'NAO_AVALIADO'];
const STATUSES: readonly WorkItemStatus[] = ['DRAFT', 'READY_FOR_REVIEW', 'APPROVED', 'EXECUTING', 'DONE', 'REJECTED', 'FAILED'];

type Registro = NonNullable<Aprovador['registroProfissional']>;
const CONSELHOS: readonly Registro['conselho'][] = ['OAB', 'CRC', 'CREA', 'CORECON', 'CNPC'];

/** ENTERPRISE_REGISTROS='{"email@x.com":{"conselho":"CRC","numero":"SP-123456/O-7"}}' */
function loadRegistros(): Record<string, Registro> {
  const raw = process.env.ENTERPRISE_REGISTROS;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, Registro>;
    const out: Record<string, Registro> = {};
    for (const [email, r] of Object.entries(parsed)) {
      if (r && CONSELHOS.includes(r.conselho) && typeof r.numero === 'string' && r.numero.trim()) out[email.toLowerCase()] = r;
    }
    return out;
  } catch {
    console.error('[enterprise] ENTERPRISE_REGISTROS inválido (JSON) — ignorado');
    return {};
  }
}
const REGISTROS = loadRegistros();

const normas = new NormaRegistry(NORMAS_SEED);

// Step-up e anti-bruteforce em memória: janela de 5 min, perder no restart é o comportamento seguro.
const stepUps = new Map<string, string>(); // userId → ISO
const stepUpFalhas = new Map<string, { n: number; desde: number }>();
const STEPUP_MAX_FALHAS = 5;
const STEPUP_JANELA_BLOQUEIO_MS = 15 * 60 * 1000;

const inflight = new Set<string>(); // tenant|workItemId em execução

// ───────── infra HTTP ─────────

class HttpError extends Error {
  constructor(readonly httpStatus: number, message: string) {
    super(message);
  }
}

interface Ctx {
  tenantId: string;
  userId: string;
  role: string;
  email?: string;
}

function ctxOf(req: AuthenticatedRequest): Ctx {
  if (!req.tenantId || !req.userId) throw new HttpError(401, 'sessão inválida ou expirada');
  return { tenantId: req.tenantId, userId: req.userId, role: req.userRole ?? '', email: req.userEmail };
}

type Handler = (req: AuthenticatedRequest, c: Ctx) => unknown | Promise<unknown>;

function route(fn: Handler) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const out = await fn(req, ctxOf(req));
      res.setHeader('Cache-Control', 'no-store');
      res.json(out);
    } catch (e) {
      const status = typeof (e as { httpStatus?: unknown })?.httpStatus === 'number' ? (e as { httpStatus: number }).httpStatus : 500;
      if (status >= 500) console.error('[enterprise]', e);
      res.status(status).json({ error: status >= 500 ? 'erro interno' : (e as Error).message });
    }
  };
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

const bodyOf = (req: AuthenticatedRequest): Record<string, unknown> => (isPlainObject(req.body) ? req.body : {});

function str(v: unknown, campo: string, max = 2000): string {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `${campo} obrigatório`);
  if (v.length > max) throw new HttpError(400, `${campo} excede ${max} caracteres`);
  return v.trim();
}

function oneOf<T extends string>(v: unknown, lista: readonly T[], campo: string): T {
  if (typeof v !== 'string' || !lista.includes(v as T)) throw new HttpError(400, `${campo} inválido`);
  return v as T;
}

function hex64(v: unknown, campo: string): string {
  if (typeof v !== 'string' || !/^[0-9a-f]{64}$/.test(v)) throw new HttpError(400, `${campo} deve ser SHA-256 hex (64)`);
  return v;
}

function hashOrThrow(v: unknown, campo: string): string {
  try {
    return hashCanonicalSync(v);
  } catch (e) {
    throw new HttpError(400, `${campo} não canonicalizável: ${(e as Error).message}`);
  }
}

function mustGet(c: Ctx, id: string): StoredWorkItem {
  const s = enterpriseStore.getWorkItem(c.tenantId, id);
  if (!s) {
    if (enterpriseStore.hasWorkItemAnyTenant(id)) throw new HttpError(403, 'item pertence a outro tenant');
    throw new HttpError(404, 'item não encontrado');
  }
  return s;
}

function exigirPermissao(c: Ctx, esteira: Esteira): void {
  if (!podeAprovarEsteira(c.role, esteira)) throw new HttpError(403, `sem permissão approve:${esteira}`);
}

function registroDe(c: Pick<Ctx, 'userId' | 'email'>): Registro | undefined {
  const r = c.email ? REGISTROS[c.email.toLowerCase()] : undefined;
  if (r) return r;
  // Demo: registro fictício explícito. Laudos em demo já saem com marca d'água e sem validade.
  return IS_DEMO_MODE ? { conselho: 'CRC', numero: `DEMO-${c.userId}` } : undefined;
}

function aprovadorDe(c: Ctx): Aprovador {
  return {
    userId: c.userId,
    permissoes: (ROLE_APPROVE[c.role] ?? []).map((e) => `approve:${e}`),
    registroProfissional: registroDe(c),
    ultimoStepUpEm: stepUps.get(c.userId),
    isAgente: false,
  };
}

const nomeDe = (userId: string): string => SERVER_USERS.find((u) => u.id === userId)?.name ?? userId;

function ledger(tenantId: string, actorId: string, tipo: string, item: WorkItem) {
  return enterpriseStore.appendLedger(tenantId, { tipo, refId: item.id, actorId, payloadHash: item.payloadHash });
}

/** Guardrail do servidor: só se o payload tiver texto redigido + memória de cálculo. */
function guardrailDe(payload: Record<string, unknown>): GuardrailResultado | undefined {
  const texto = payload.textoLaudo;
  const mem = payload.memoriaCalculo;
  if (typeof texto !== 'string' || !Array.isArray(mem)) return undefined;
  const centavos = mem.map((l) => (isPlainObject(l) && Number.isSafeInteger(l.valorCentavos) ? (l.valorCentavos as number) : NaN)).filter(Number.isFinite);
  return verificarTexto(texto, { centavos }, normas, new Date().toISOString().slice(0, 10));
}

function memoriaHashDe(payload: Record<string, unknown>, memoriaCalculo?: Record<string, unknown>): string | undefined {
  if (memoriaCalculo) return hashOrThrow(memoriaCalculo, 'memoriaCalculo');
  return Array.isArray(payload.memoriaCalculo) ? hashOrThrow(payload.memoriaCalculo, 'payload.memoriaCalculo') : undefined;
}

/** Resposta pública do item (escopada ao tenant da sessão). */
function view(s: StoredWorkItem) {
  return {
    ...s.item,
    ref: s.ref,
    payload: s.payload,
    payloadRevisado: s.payloadRevisado,
    guardrail: s.guardrail,
    resultado: s.resultado,
    criadoEm: s.criadoEm,
    atualizadoEm: s.atualizadoEm,
  };
}

// ───────── criação (usada pela rota e pelo seed demo) ─────────

export interface NovoItem {
  esteira: Esteira;
  tipo: WorkItem['tipo'];
  riscoFlag: Flag;
  valorEnvolvidoCentavos: number;
  payload: Record<string, unknown>;
  memoriaCalculo?: Record<string, unknown>;
  agente?: string;
  status: 'DRAFT' | 'READY_FOR_REVIEW';
  ref?: string;
  idempotencyKey: string;
}

export function criarItem(tenantId: string, actorId: string, n: NovoItem): StoredWorkItem {
  const agora = new Date().toISOString();
  const item: WorkItem = {
    id: randomUUID(),
    tenantId,
    esteira: n.esteira,
    tipo: n.tipo,
    status: n.status,
    payloadHash: hashOrThrow(n.payload, 'payload'),
    memoriaCalculoHash: memoriaHashDe(n.payload, n.memoriaCalculo),
    riscoFlag: n.riscoFlag,
    valorEnvolvidoCentavos: n.valorEnvolvidoCentavos,
    criadoPorAgente: n.agente,
    aprovacoes: [],
    idempotencyKey: n.idempotencyKey,
  };
  const saved = enterpriseStore.putWorkItem(tenantId, {
    item,
    ref: n.ref,
    payload: n.payload,
    memoriaCalculo: n.memoriaCalculo,
    guardrail: guardrailDe(n.payload),
    criadoEm: agora,
    atualizadoEm: agora,
  });
  ledger(tenantId, actorId, 'WI_CRIADO', item);
  return saved;
}

/** Agente recalculou: novo payload/hash, aprovações zeradas; hashRevisado fica (a UI mostra o diff). */
function recalcularItem(tenantId: string, actorId: string, s: StoredWorkItem, payload: Record<string, unknown>, valor?: number): StoredWorkItem {
  if (s.item.status !== 'DRAFT' && s.item.status !== 'READY_FOR_REVIEW') throw new HttpError(409, `não é possível alterar item em ${s.item.status}`);
  const item: WorkItem = {
    ...s.item,
    payloadHash: hashOrThrow(payload, 'payload'),
    memoriaCalculoHash: memoriaHashDe(payload, s.memoriaCalculo),
    valorEnvolvidoCentavos: valor ?? s.item.valorEnvolvidoCentavos,
    aprovacoes: [],
  };
  const saved = enterpriseStore.putWorkItem(tenantId, { ...s, item, payload, guardrail: guardrailDe(payload) });
  ledger(tenantId, actorId, 'WI_PAYLOAD_ALTERADO', item);
  return saved;
}

// ───────── executores ─────────

function executores(c: Ctx, stored: StoredWorkItem): Record<WorkItem['tipo'], ExternalAction<unknown>> {
  const laudoId = typeof stored.payload.laudoId === 'string' && stored.payload.laudoId ? stored.payload.laudoId : stored.item.id;
  return {
    GERAR_LAUDO_FINAL: {
      tipo: 'GERAR_LAUDO_FINAL',
      validate(item) {
        if (item.aprovacoes.length === 0) throw new HttpError(409, 'laudo sem aprovação registrada');
      },
      async execute(item): Promise<LaudoSealRecord> {
        // Signatário = último aprovador humano (profissional habilitado), não quem clicou "executar".
        const ultima = item.aprovacoes[item.aprovacoes.length - 1];
        const user = SERVER_USERS.find((u) => u.id === ultima.userId);
        const reg = registroDe({ userId: ultima.userId, email: user?.email });
        if (!reg) throw new HttpError(409, 'signatário sem registro profissional');
        const versao = enterpriseStore.nextSealVersion(c.tenantId, laudoId);
        const emitidoEmUTC = new Date().toISOString();
        const signatario = { userId: ultima.userId, nome: user?.name ?? ultima.userId, registroClasse: `${reg.conselho} ${reg.numero}` };
        const selo = computeLaudoSeal({ tenantId: c.tenantId, laudoId, versao, payload: stored.payload, emitidoEmUTC, signatario });
        const rec = enterpriseStore.putSeal({
          tenantId: c.tenantId,
          laudoId,
          versao,
          workItemId: item.id,
          esteira: item.esteira,
          payloadHash: item.payloadHash,
          emitidoEmUTC,
          signatario,
          selo,
        });
        enterpriseStore.appendLedger(c.tenantId, { tipo: 'SELO_EMITIDO', refId: item.id, actorId: ultima.userId, payloadHash: selo });
        return rec;
      },
    },
    EXPORTAR_PACOTE_PROTOCOLO: {
      tipo: 'EXPORTAR_PACOTE_PROTOCOLO',
      validate() {},
      async execute(item) {
        // Transmissão a portais (e-CAC, PJe, DJEN) NÃO implementada: gera só o manifesto selado do pacote.
        const geradoEmUTC = new Date().toISOString();
        const manifesto = {
          workItemId: item.id,
          ref: stored.ref,
          esteira: item.esteira,
          payloadHash: item.payloadHash,
          aprovacoes: item.aprovacoes,
          conteudo: ['peticao.pdf', 'laudo.pdf', 'memoria-de-calculo.json'],
          memoriaCalculo: stored.payload.memoriaCalculo,
          geradoEmUTC,
        };
        return { manifesto, manifestoHash: hashCanonicalSync(manifesto), transmitido: false };
      },
    },
  };
}

// ───────── rotas ─────────

export function registerEnterpriseRoutes(app: Express): void {
  const base = '/api/enterprise';

  app.get(`${base}/health`, route((_req, c) => ({ ...enterpriseStore.stats(c.tenantId), demo: IS_DEMO_MODE })));

  app.get(
    `${base}/work-items`,
    route((req, c) => {
      const status = req.query.status ? oneOf(req.query.status, STATUSES, 'status') : undefined;
      const esteira = req.query.esteira ? oneOf(req.query.esteira, ESTEIRAS, 'esteira') : undefined;
      const limit = Number(req.query.limit ?? 100);
      return enterpriseStore.listWorkItems(c.tenantId, { status, esteira, limit: Number.isFinite(limit) ? limit : 100 }).map(view);
    }),
  );

  app.get(
    `${base}/work-items/:id`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      const trilha = enterpriseStore
        .listLedger(c.tenantId, { refId: s.item.id, limit: 500 })
        .reverse()
        .map((e) => ({ ...e, ator: nomeDe(e.actorId) }));
      return { ...view(s), memoriaCalculo: s.memoriaCalculo, trilha };
    }),
  );

  /** Cria item (humano ou agente). Sempre nasce em DRAFT/READY_FOR_REVIEW — nunca executa. Idempotente por Idempotency-Key. */
  app.post(
    `${base}/work-items`,
    route((req, c) => {
      const b = bodyOf(req);
      const hdr = req.header('idempotency-key');
      if (hdr !== undefined && !/^[\w:-]{8,100}$/.test(hdr)) throw new HttpError(400, 'Idempotency-Key inválida');
      const idempotencyKey = hdr ?? randomUUID();
      const existente = enterpriseStore.findByIdempotencyKey(c.tenantId, idempotencyKey);
      if (existente) return { ...view(existente), reutilizado: true };

      const valor = b.valorEnvolvidoCentavos;
      if (!Number.isSafeInteger(valor) || (valor as number) < 0) throw new HttpError(400, 'valorEnvolvidoCentavos deve ser inteiro ≥ 0 (centavos)');
      if (!isPlainObject(b.payload)) throw new HttpError(400, 'payload deve ser objeto');
      if (b.memoriaCalculo !== undefined && !isPlainObject(b.memoriaCalculo)) throw new HttpError(400, 'memoriaCalculo deve ser objeto');
      if (b.ref !== undefined && (typeof b.ref !== 'string' || !/^[\w-]{1,40}$/.test(b.ref))) throw new HttpError(400, 'ref inválido');

      return view(
        criarItem(c.tenantId, c.userId, {
          esteira: oneOf(b.esteira, ESTEIRAS, 'esteira'),
          tipo: oneOf(b.tipo, TIPOS, 'tipo'),
          riscoFlag: b.riscoFlag === undefined ? 'NAO_AVALIADO' : oneOf(b.riscoFlag, FLAGS, 'riscoFlag'),
          valorEnvolvidoCentavos: valor as number,
          payload: b.payload,
          memoriaCalculo: b.memoriaCalculo as Record<string, unknown> | undefined,
          agente: b.agente === undefined ? undefined : oneOf(b.agente, AGENTES_ENXAME, 'agente'),
          status: b.status === undefined ? 'DRAFT' : oneOf(b.status, ['DRAFT', 'READY_FOR_REVIEW'] as const, 'status'),
          ref: b.ref as string | undefined,
          idempotencyKey,
        }),
      );
    }),
  );

  /** Agente recalculou o conteúdo (ex.: memória de cálculo). Zera aprovações. */
  app.post(
    `${base}/work-items/:id/recalculate`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      const b = bodyOf(req);
      if (!isPlainObject(b.payload)) throw new HttpError(400, 'payload deve ser objeto');
      const valor = b.valorEnvolvidoCentavos;
      if (valor !== undefined && (!Number.isSafeInteger(valor) || (valor as number) < 0)) throw new HttpError(400, 'valorEnvolvidoCentavos inválido');
      return view(recalcularItem(c.tenantId, c.userId, s, b.payload, valor as number | undefined));
    }),
  );

  app.post(
    `${base}/work-items/:id/submit`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      const item = transicionar(s.item, 'READY_FOR_REVIEW');
      const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item });
      ledger(c.tenantId, c.userId, 'WI_SUBMETIDO', item);
      return view(saved);
    }),
  );

  /** Registra o hash que o revisor efetivamente viu — precisa ser o hash ATUAL. */
  app.post(
    `${base}/work-items/:id/review`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      exigirPermissao(c, s.item.esteira);
      const hashExibido = hex64(bodyOf(req).hashExibido, 'hashExibido');
      if (hashExibido !== s.item.payloadHash) throw new HttpError(409, 'o conteúdo mudou desde que você abriu o item — recarregue e revise de novo');
      const item = registrarRevisao(s.item, c.userId, hashExibido);
      const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item, payloadRevisado: s.payload });
      ledger(c.tenantId, c.userId, 'WI_REVISADO', item);
      return view(saved);
    }),
  );

  app.post(
    `${base}/work-items/:id/approve`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      exigirPermissao(c, s.item.esteira);
      if (s.guardrail?.status === 'BLOQUEADO') throw new HttpError(403, 'guardrail bloqueou o texto: há valor, percentual ou citação não rastreável');
      if (!s.item.hashRevisado || s.item.hashRevisado !== s.item.payloadHash) throw new HttpError(409, 'revise a versão atual antes de aprovar');
      const hashExibido = hex64(bodyOf(req).hashExibido, 'hashExibido');
      const item = aprovar(s.item, aprovadorDe(c), hashExibido, new Date());
      const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item });
      ledger(c.tenantId, c.userId, item.status === 'APPROVED' ? 'WI_APROVADO' : 'WI_APROVACAO_PARCIAL', item);
      return { ...view(saved), aprovacoesColetadas: item.aprovacoes.length };
    }),
  );

  app.post(
    `${base}/work-items/:id/return`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      exigirPermissao(c, s.item.esteira);
      const item = devolver(s.item, str(bodyOf(req).comentario, 'comentario'));
      const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item, payloadRevisado: undefined });
      ledger(c.tenantId, c.userId, 'WI_DEVOLVIDO', item);
      return view(saved);
    }),
  );

  app.post(
    `${base}/work-items/:id/reject`,
    route((req, c) => {
      const s = mustGet(c, req.params.id);
      exigirPermissao(c, s.item.esteira);
      const item = rejeitar(s.item, str(bodyOf(req).motivo, 'motivo'));
      const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item });
      ledger(c.tenantId, c.userId, 'WI_REJEITADO', item);
      return view(saved);
    }),
  );

  app.post(
    `${base}/work-items/:id/execute`,
    route(async (req, c) => {
      const s = mustGet(c, req.params.id);
      const lockKey = `${c.tenantId}|${s.item.id}`;
      if (inflight.has(lockKey)) throw new HttpError(409, 'execução já em andamento');

      // Integridade do armazenamento: payload guardado precisa bater com o hash aprovado.
      if (hashCanonicalSync(s.payload) !== s.item.payloadHash) {
        ledger(c.tenantId, c.userId, 'WI_INTEGRIDADE_VIOLADA', s.item);
        throw new HttpError(409, 'payload armazenado diverge do hash aprovado — execução bloqueada');
      }

      inflight.add(lockKey);
      try {
        if (s.item.status === 'APPROVED') {
          const executing = transicionar(s.item, 'EXECUTING');
          enterpriseStore.putWorkItem(c.tenantId, { ...s, item: executing });
          ledger(c.tenantId, c.userId, 'WI_EXECUTANDO', executing);
        }
        const action = executores(c, s)[s.item.tipo];
        try {
          const r = await executar(s.item, action, enterpriseStore.idempotencyFor(c.tenantId));
          const saved = enterpriseStore.putWorkItem(c.tenantId, { ...s, item: r.item, resultado: r.resultado });
          if (!r.reutilizado) ledger(c.tenantId, c.userId, 'WI_EXECUTADO', r.item);
          return { ...view(saved), reutilizado: r.reutilizado };
        } catch (e) {
          const failed = (e as { item?: WorkItem }).item;
          if (failed) {
            enterpriseStore.putWorkItem(c.tenantId, { ...s, item: failed });
            ledger(c.tenantId, c.userId, 'WI_FALHOU', failed);
            throw new HttpError(502, (e as Error).message);
          } else if (s.item.status === 'APPROVED') {
            // validate() falhou antes de executar: volta para APPROVED (estado real persistido).
            enterpriseStore.putWorkItem(c.tenantId, s);
          }
          throw e;
        }
      } finally {
        inflight.delete(lockKey);
      }
    }),
  );

  /** Step-up: reconfirma a senha; vale por POLITICA.stepUpJanelaMs (5 min) para aprovar. */
  app.post(
    `${base}/step-up`,
    route((req, c) => {
      const f = stepUpFalhas.get(c.userId);
      if (f && f.n >= STEPUP_MAX_FALHAS && Date.now() - f.desde < STEPUP_JANELA_BLOQUEIO_MS) throw new HttpError(429, 'muitas tentativas — aguarde 15 minutos');
      const password = str(bodyOf(req).password, 'password', 256);
      const user = SERVER_USERS.find((u) => u.id === c.userId && u.tenantId === c.tenantId && !u.disabled);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        const atual = f && Date.now() - f.desde < STEPUP_JANELA_BLOQUEIO_MS ? f : { n: 0, desde: Date.now() };
        stepUpFalhas.set(c.userId, { n: atual.n + 1, desde: atual.desde });
        // 403 (não 401): senha errada no step-up não deve derrubar a sessão no cliente.
        throw new HttpError(403, 'senha incorreta');
      }
      stepUpFalhas.delete(c.userId);
      const em = new Date().toISOString();
      stepUps.set(c.userId, em);
      enterpriseStore.appendLedger(c.tenantId, { tipo: 'STEP_UP', refId: c.userId, actorId: c.userId, payloadHash: hashCanonicalSync({ userId: c.userId, em }) });
      return { ok: true, validoAte: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
    }),
  );

  /** DEMO: cria os itens de exemplo uma vez por tenant (idempotente). Desligado fora do modo demonstração. */
  app.post(
    `${base}/demo/seed`,
    route((_req, c) => {
      if (!IS_DEMO_MODE) throw new HttpError(404, 'indisponível fora do modo demonstração');
      let criados = 0;
      for (const d of DEMO_SEED) {
        const idempotencyKey = `seed:${d.ref}:v1`;
        if (enterpriseStore.findByIdempotencyKey(c.tenantId, idempotencyKey)) continue;
        let s = criarItem(c.tenantId, `agente:${d.agente}`, {
          esteira: d.esteira,
          tipo: d.tipo,
          riscoFlag: d.riscoFlag,
          valorEnvolvidoCentavos: valorExposto(d.payload),
          payload: d.payload as unknown as Record<string, unknown>,
          agente: d.agente,
          status: 'READY_FOR_REVIEW',
          ref: d.ref,
          idempotencyKey,
        });
        if (d.payloadAposRevisao) {
          const item = registrarRevisao(s.item, 'revisor-demo', s.item.payloadHash);
          s = enterpriseStore.putWorkItem(c.tenantId, { ...s, item, payloadRevisado: s.payload });
          ledger(c.tenantId, 'revisor-demo', 'WI_REVISADO', item);
          s = recalcularItem(c.tenantId, `agente:${d.agente}`, s, d.payloadAposRevisao as unknown as Record<string, unknown>, valorExposto(d.payloadAposRevisao));
        }
        criados++;
      }
      return { criados };
    }),
  );

  app.get(
    `${base}/ledger`,
    route((req, c) => {
      const limit = Number(req.query.limit ?? 100);
      const refId = typeof req.query.refId === 'string' ? req.query.refId : undefined;
      return enterpriseStore.listLedger(c.tenantId, { refId, limit: Number.isFinite(limit) ? limit : 100 });
    }),
  );

  // Auditoria explícita: recalcula a cadeia inteira (o /health usa a verificação incremental).
  app.get(`${base}/ledger/verify`, route((_req, c) => enterpriseStore.verifyLedger(c.tenantId, { completo: true })));

  // ───────── P29 · Registro central de laudos (compartilhado pelo escritório) ─────────

  /**
   * Registra um laudo emitido. O servidor RECALCULA o auditHash (mesmo guard P28 do cliente):
   * se o conteúdo não bater com o hash enviado, recusa — o browser não consegue forjar laudo.
   */
  app.post(
    `${base}/laudos`,
    route((req, c) => {
      const b = bodyOf(req);
      if (!isPlainObject(b.report)) throw new HttpError(400, 'report obrigatório');
      const report = b.report;
      if (report.tenantId !== c.tenantId) throw new HttpError(403, 'laudo pertence a outro tenant');
      const reportId = str(report.reportId, 'reportId', 120);
      const informado = str(report.auditHash, 'auditHash', 200);
      if (enterpriseStore.getLaudo(c.tenantId, reportId)) throw new HttpError(409, 'laudo já registrado (imutável)');
      const { auditHash: _informado, ...semHash } = report;
      let recalculado: string;
      try {
        recalculado = validateAndComputeReportHash(semHash as unknown as Omit<StandardizedAuditReport, 'auditHash'>);
      } catch (e) {
        throw new HttpError(422, (e as Error).message);
      }
      if (recalculado !== informado) throw new HttpError(422, 'auditHash não confere com o conteúdo do laudo (recalculado no servidor)');
      const registradoEmUTC = new Date().toISOString();
      enterpriseStore.putLaudo(c.tenantId, {
        reportId,
        serviceId: String(report.serviceId ?? ''),
        auditHash: recalculado,
        emitidoPor: c.userId,
        registradoEmUTC,
        report,
      });
      enterpriseStore.appendLedger(c.tenantId, {
        tipo: 'LAUDO_REGISTRADO',
        refId: reportId,
        actorId: c.userId,
        payloadHash: recalculado.replace(/^0x/, ''),
      });
      return { reportId, auditHash: recalculado, registradoEmUTC };
    }),
  );

  app.get(
    `${base}/laudos`,
    route((req, c) => {
      const limit = Number(req.query.limit ?? 50);
      return enterpriseStore.listLaudos(c.tenantId, {
        limit: Number.isFinite(limit) ? limit : 50,
        serviceId: typeof req.query.serviceId === 'string' ? req.query.serviceId : undefined,
        antes: typeof req.query.antes === 'string' ? req.query.antes : undefined,
      });
    }),
  );

  app.get(
    `${base}/laudos/:id`,
    route((req, c) => {
      const l = enterpriseStore.getLaudo(c.tenantId, req.params.id);
      if (!l) {
        if (enterpriseStore.hasLaudoAnyTenant(req.params.id)) throw new HttpError(403, 'laudo pertence a outro tenant');
        throw new HttpError(404, 'laudo não encontrado neste tenant');
      }
      return l;
    }),
  );

  app.get(
    `${base}/seals/:laudoId`,
    route((req, c) => {
      const seals = enterpriseStore.getSeals(c.tenantId, req.params.laudoId);
      if (!seals.length) throw new HttpError(404, 'laudo sem selo');
      return seals;
    }),
  );

  /** Consulta por selo (hash impresso no laudo): devolve o registro se pertencer ao tenant. */
  app.get(
    `${base}/seals/by-hash/:selo`,
    route((req, c) => {
      const selo = hex64(req.params.selo, 'selo');
      const rec = enterpriseStore.findSealByHash(c.tenantId, selo);
      if (!rec) throw new HttpError(404, 'selo não encontrado neste tenant');
      return rec;
    }),
  );

  /**
   * Verifica um laudo: recalcula o selo a partir do payload apresentado + metadados gravados.
   * body: { laudoId, versao?, payload }  → ÍNTEGRO / VIOLADO com os dois hashes.
   */
  app.post(
    `${base}/seals/verify`,
    route((req, c) => {
      const b = bodyOf(req);
      const laudoId = str(b.laudoId, 'laudoId', 200);
      const seals = enterpriseStore.getSeals(c.tenantId, laudoId);
      if (!seals.length) throw new HttpError(404, 'laudo sem selo');
      const rec = b.versao === undefined ? seals[seals.length - 1] : seals.find((s) => s.versao === b.versao);
      if (!rec) throw new HttpError(404, 'versão não encontrada');
      if (!isPlainObject(b.payload)) throw new HttpError(400, 'payload deve ser objeto');
      let seloCalculado: string;
      try {
        seloCalculado = computeLaudoSeal({ ...rec, payload: b.payload });
      } catch (e) {
        throw new HttpError(400, `payload não canonicalizável: ${(e as Error).message}`);
      }
      return {
        status: seloCalculado === rec.selo ? 'INTEGRO' : 'VIOLADO',
        laudoId,
        versao: rec.versao,
        seloGravado: rec.selo,
        seloCalculado,
        emitidoEmUTC: rec.emitidoEmUTC,
        signatario: rec.signatario,
      };
    }),
  );
}
