/**
 * VELATRIX AOS · P29 · Serviço da esteira LOAS (orquestração)
 *
 * Regras de escala (2.000 advogados):
 *  - Escritas síncronas só validam, gravam e enfileiram; o trabalho pesado vai
 *    para a FilaJusta (fairness tenant → advogado) e responde 202.
 *  - Leituras usam cursor e agregados pré-computados.
 *  - Notificação ao advogado via outbox → SSE (uma conexão por usuário).
 *  - Protocolo passa por GatewayProtocolo (rate limit + breaker + dedup).
 *
 * Dependências injetadas para teste (calculadora, drafter, fila, gateway).
 */
import type { CasoLoas, ResultadoCalculoLoas } from '../../loas/tipos.ts';
import { aprovar, aprovacaoValida, ErroAprovacao, type Senioridade } from '../../loas/aprovacao.ts';
import { validarSignatario, ErroAssinatura, type SignerProvider, type AdvogadoProcuracao } from '../../loas/assinatura.ts';
import type { Minuta, EntradaMinuta } from '../../loas/drafter.ts';
import type { LoasRepository, RegistroCaso, EstagioLoas, FiltroCasos, PaginaCasos, PainelAgregado } from './repositorio.ts';
import { ErroRepositorio } from './repositorio.ts';
import type { GatewayProtocolo, PedidoProtocolo, EstadoCircuito } from './tribunal.ts';
import { ErroTribunal } from './tribunal.ts';
import type { HubSse } from './webhookSse.ts';
import { DedupEventos } from './webhookSse.ts';
import { validarNovoCaso, validarCompetencia, ErroValidacao } from './validacao.ts';

export interface CtxLoas { tenantId: string; userId: string; papel?: string; }

/**
 * Alçada derivada do PAPEL DA SESSÃO (nunca do corpo da requisição).
 * Ajustável por tenant no futuro (tabela de alçadas).
 */
export const SENIORIDADE_POR_PAPEL: Readonly<Record<string, Senioridade>> = {
  super_admin: 'SOCIO',
  tenant_admin: 'SOCIO',
  c_level_approver: 'SENIOR',
  cfo_executive: 'SENIOR',
  operator: 'JUNIOR',
  parceiro_tributario: 'ESTAGIARIO',
};
export const senioridadeDe = (papel?: string): Senioridade => SENIORIDADE_POR_PAPEL[papel ?? ''] ?? 'ESTAGIARIO';

export interface FilaLike {
  enfileirar<T>(tenantId: string, userId: string, tarefa: () => Promise<T>, chave?: string): Promise<T>;
}

export interface DepsLoas {
  repo: LoasRepository;
  fila: FilaLike;
  gateway: GatewayProtocolo;
  hub?: HubSse;
  calcular: (caso: CasoLoas, competencia: string) => ResultadoCalculoLoas;
  gerarMinuta: (e: EntradaMinuta) => Minuta;
  versaoRegras: string;
  tesesAtivas: () => EntradaMinuta['teses'];
  retentativa: <T>(fn: () => Promise<T>) => Promise<T>;
  signer: SignerProvider;
  agora?: () => Date;
}

/**
 * O cliente só INDICA o que protocolar. Aprovação e assinatura são do servidor:
 * a aprovação vem do registro (emitida na sessão do aprovador) e a assinatura
 * é feita pelo SignerProvider para o signatário constituído.
 */
export interface ItemLote {
  casoId: string;
  anexosHash: string;
  tribunal: string;
  sistema: PedidoProtocolo['sistema'];
  arquivos: PedidoProtocolo['arquivos'];
  signatarioId: string;
}

type StatusItem = 'PENDENTE' | 'PROTOCOLADO' | 'DUPLICADO' | 'FALHA';
export interface EstadoLote {
  loteId: string;
  tenantId: string;
  criadoPor: string;
  criadoEm: string;
  itens: Array<{ casoId: string; status: StatusItem; numeroProcesso?: string; erro?: string }>;
}

export class ErroLoas extends Error {
  readonly httpStatus: number;
  constructor(httpStatus: number, msg: string) { super(msg); this.httpStatus = httpStatus; this.name = 'ErroLoas'; }
}

const ORDEM: Record<EstagioLoas, number> = { CAPTURA: 0, DIAGNOSTICO: 1, ESTRATEGIA: 2, EXECUCAO: 3, ENTREGA: 4 };
const avancar = (atual: EstagioLoas, alvo: EstagioLoas): EstagioLoas => (ORDEM[alvo] > ORDEM[atual] ? alvo : atual);

export const MAX_ITENS_LOTE = 200;

export class ServicoLoas {
  private readonly d: DepsLoas;
  private readonly lotes = new Map<string, EstadoLote>();
  private readonly calculos = new Map<string, ResultadoCalculoLoas>();   // tenant|caso → último cálculo
  private readonly processoParaCaso = new Map<string, { tenantId: string; casoId: string }>();
  private readonly dedupWebhook = new DedupEventos();
  private seqLote = 0;
  private dispatcher: ReturnType<typeof setInterval> | undefined;

  constructor(deps: DepsLoas) { this.d = deps; }

  private agora(): Date { return this.d.agora?.() ?? new Date(); }

  private exigir(ctx: CtxLoas, casoId: string): RegistroCaso {
    const r = this.d.repo.obter(ctx.tenantId, casoId);
    if (!r) throw new ErroLoas(404, 'Caso não encontrado.');
    return r;
  }

  /** Atualiza com retry em conflito de versão (concorrência entre workers). */
  private atualizar(ctx: CtxLoas, casoId: string, patch: (r: RegistroCaso) => Parameters<LoasRepository['atualizar']>[3], tipoEvento: string, dados: unknown): RegistroCaso {
    for (let i = 0; i < 3; i++) {
      const r = this.exigir(ctx, casoId);
      try {
        return this.d.repo.atualizar(ctx.tenantId, casoId, r.versao, patch(r), {
          tipo: tipoEvento, casoId, advogadoId: r.caso.advogadoResponsavelId, dados,
        });
      } catch (e) {
        if (!(e instanceof ErroRepositorio && e.httpStatus === 409 && /versão/.test(e.message))) throw e;
      }
    }
    throw new ErroLoas(409, 'Conflito persistente de versão.');
  }

  // ───────────── casos ─────────────

  criarCaso(ctx: CtxLoas, body: unknown): RegistroCaso {
    const base = validarNovoCaso(body);
    const em = this.agora().toISOString();
    const caso: CasoLoas = { ...base, tenantId: ctx.tenantId, advogadoResponsavelId: ctx.userId, estagio: 'CAPTURA', versaoRegras: this.d.versaoRegras };
    return this.d.repo.criar(ctx.tenantId, { caso, estagio: 'CAPTURA', criadoEm: em, atualizadoEm: em, versao: 1 }, {
      tipo: 'caso.criado', casoId: caso.id, advogadoId: ctx.userId, dados: { id: caso.id },
    });
  }

  listar(ctx: CtxLoas, filtro: FiltroCasos): PaginaCasos { return this.d.repo.listar(ctx.tenantId, filtro); }

  obter(ctx: CtxLoas, casoId: string): RegistroCaso & { ultimoCalculo?: ResultadoCalculoLoas } {
    return { ...this.exigir(ctx, casoId), ultimoCalculo: this.calculos.get(`${ctx.tenantId}|${casoId}`) };
  }

  // ───────────── diagnóstico / estratégia ─────────────

  calcular(ctx: CtxLoas, casoId: string, body: unknown): ResultadoCalculoLoas {
    const competencia = validarCompetencia((body as { competencia?: unknown } | null)?.competencia);
    const r = this.exigir(ctx, casoId);
    let res: ResultadoCalculoLoas;
    try { res = this.d.calcular(r.caso, competencia); }
    catch (e) { throw new ErroLoas(422, (e as Error).message); } // ex.: competência sem salário mínimo cadastrado
    this.calculos.set(`${ctx.tenantId}|${casoId}`, res);
    this.atualizar(ctx, casoId, (x) => ({ ultimoCalculoHash: res.hash, estagio: avancar(x.estagio, 'DIAGNOSTICO') }), 'caso.calculado',
      { hash: res.hash, elegivel: res.elegivelCriterioObjetivo, pendencias: res.pendencias.length });
    return res;
  }

  minuta(ctx: CtxLoas, casoId: string, body: unknown): Minuta {
    const b = (body ?? {}) as Partial<Pick<EntradaMinuta, 'tesesSelecionadas' | 'juizo' | 'advogado' | 'trechosLivres'>>;
    if (!Array.isArray(b.tesesSelecionadas) || !b.juizo || !b.advogado) {
      throw new ErroValidacao([{ campo: 'tesesSelecionadas|juizo|advogado', msg: 'obrigatórios' }]);
    }
    const r = this.exigir(ctx, casoId);
    const calc = this.calculos.get(`${ctx.tenantId}|${casoId}`);
    if (!calc || calc.hash !== r.ultimoCalculoHash) throw new ErroLoas(409, 'Calcule o caso antes de gerar a minuta.');
    const m = this.d.gerarMinuta({
      caso: r.caso, calculo: calc, teses: this.d.tesesAtivas(),
      tesesSelecionadas: b.tesesSelecionadas, juizo: b.juizo, advogado: b.advogado, trechosLivres: b.trechosLivres,
    });
    this.atualizar(ctx, casoId, (x) => ({ ultimaMinutaHash: m.hash, ultimaMinutaBloqueada: m.bloqueada, aprovacao: undefined, estagio: avancar(x.estagio, m.bloqueada ? 'ESTRATEGIA' : 'EXECUCAO') }),
      m.bloqueada ? 'minuta.bloqueada' : 'minuta.gerada', { hash: m.hash, violacoes: m.violacoes.length });
    return m;
  }

  // ───────────── procuração e aprovação (servidor) ─────────────

  definirProcuracao(ctx: CtxLoas, casoId: string, body: unknown): RegistroCaso {
    const advs = (body as { advogados?: AdvogadoProcuracao[] } | null)?.advogados;
    if (!Array.isArray(advs) || advs.length === 0 || advs.length > 20
      || advs.some((a) => !a || typeof a.id !== 'string' || typeof a.oab !== 'string' || !/^\d{11}$/.test(String(a.cpf)))) {
      throw new ErroValidacao([{ campo: 'advogados', msg: '1..20 itens { id, oab, cpf(11 dígitos) }' }]);
    }
    const r = this.exigir(ctx, casoId);
    const sen = senioridadeDe(ctx.papel);
    if (r.caso.advogadoResponsavelId !== ctx.userId && sen !== 'SOCIO') throw new ErroLoas(403, 'Só o responsável pelo caso ou sócio altera a procuração.');
    // Alterar procuração invalida aprovação existente (signatários mudaram).
    return this.atualizar(ctx, casoId, () => ({ procuracao: advs.map((a) => ({ id: a.id, oab: a.oab, cpf: a.cpf })), aprovacao: undefined }),
      'procuracao.definida', { advogados: advs.length });
  }

  aprovar(ctx: CtxLoas, casoId: string, body: unknown): RegistroCaso {
    const anexosHash = (body as { anexosHash?: unknown } | null)?.anexosHash;
    if (typeof anexosHash !== 'string' || !/^[0-9a-f]{64}$/.test(anexosHash)) throw new ErroValidacao([{ campo: 'anexosHash', msg: 'SHA-256 hex' }]);
    const r = this.exigir(ctx, casoId);
    if (!r.ultimaMinutaHash) throw new ErroLoas(409, 'Gere a minuta antes de aprovar.');
    let ap;
    try {
      ap = aprovar({
        casoId, tenantId: ctx.tenantId,
        preparadoPor: { id: r.caso.advogadoResponsavelId, tenantId: ctx.tenantId, senioridade: 'JUNIOR' },
        aprovador: { id: ctx.userId, tenantId: ctx.tenantId, senioridade: senioridadeDe(ctx.papel) },
        minuta: { hash: r.ultimaMinutaHash, bloqueada: !!r.ultimaMinutaBloqueada },
        anexosHash, agora: this.agora(),
      });
    } catch (e) {
      if (e instanceof ErroAprovacao) throw new ErroLoas(e.codigo === 'MINUTA_BLOQUEADA' ? 409 : 403, e.message);
      throw e;
    }
    return this.atualizar(ctx, casoId, () => ({ aprovacao: ap }), 'caso.aprovado', { aprovadoPor: ctx.userId, hashAprovacao: ap.hashAprovacao });
  }

  // ───────────── protocolo em lote ─────────────

  criarLote(ctx: CtxLoas, body: unknown): EstadoLote {
    const itens = (body as { itens?: ItemLote[] } | null)?.itens;
    if (!Array.isArray(itens) || itens.length === 0 || itens.length > MAX_ITENS_LOTE) {
      throw new ErroValidacao([{ campo: 'itens', msg: `1..${MAX_ITENS_LOTE} itens` }]);
    }
    const vistos = new Set<string>();
    // Pré-validação síncrona: nada entra na fila se o lote tiver item inválido.
    for (const it of itens) {
      if (vistos.has(it.casoId)) throw new ErroLoas(422, `Caso ${it.casoId} repetido no lote.`);
      vistos.add(it.casoId);
      const r = this.exigir(ctx, it.casoId);
      const draftHash = r.ultimaMinutaHash;
      if (!draftHash) throw new ErroLoas(409, `Caso ${it.casoId}: sem minuta.`);
      if (r.protocoladoDraftHash === draftHash) throw new ErroLoas(409, `Caso ${it.casoId} já protocolado.`);
      if (!aprovacaoValida(r.aprovacao, draftHash, it.anexosHash) || r.aprovacao?.tenantId !== ctx.tenantId || r.aprovacao?.casoId !== it.casoId) {
        throw new ErroLoas(409, `Caso ${it.casoId}: sem aprovação válida para esta minuta/anexos.`);
      }
      try {
        validarSignatario({ casoId: it.casoId, tenantId: ctx.tenantId, documentoHash: draftHash, anexosHash: it.anexosHash,
          signatarioId: it.signatarioId, procuracao: { advogados: r.procuracao ?? [] }, aprovacao: r.aprovacao });
      } catch (e) {
        if (e instanceof ErroAssinatura) throw new ErroLoas(e.httpStatus, `Caso ${it.casoId}: ${e.message}`);
        throw e;
      }
    }

    const lote: EstadoLote = {
      loteId: `LOTE-${Date.now().toString(36)}-${(++this.seqLote).toString(36)}`,
      tenantId: ctx.tenantId, criadoPor: ctx.userId, criadoEm: this.agora().toISOString(),
      itens: itens.map((i) => ({ casoId: i.casoId, status: 'PENDENTE' as StatusItem })),
    };
    this.lotes.set(lote.loteId, lote);

    itens.forEach((it, idx) => {
      const r = this.exigir(ctx, it.casoId);
      const draftHash = r.ultimaMinutaHash!;
      const tarefa = async () => {
        // Assina dentro da fila (pode envolver HSM/PSC remoto) — nunca no request.
        const ass = await this.d.signer.assinar({
          casoId: it.casoId, tenantId: ctx.tenantId, documentoHash: draftHash, anexosHash: it.anexosHash,
          signatarioId: it.signatarioId, procuracao: { advogados: r.procuracao ?? [] }, aprovacao: r.aprovacao,
        });
        const pedido: PedidoProtocolo = {
          tenantId: ctx.tenantId, casoId: it.casoId, draftHash, tribunal: it.tribunal, sistema: it.sistema,
          arquivos: it.arquivos, assinaturaEnvelope: ass.envelope, valorJuridico: ass.valorJuridico,
        };
        return this.d.retentativa(() => this.d.gateway.protocolar(pedido));
      };
      this.d.fila
        .enfileirar(ctx.tenantId, ctx.userId, tarefa, `protocolo:${ctx.tenantId}:${it.casoId}:${draftHash}`)
        .then((recibo) => {
          lote.itens[idx] = { casoId: it.casoId, status: recibo.duplicado ? 'DUPLICADO' : 'PROTOCOLADO', numeroProcesso: recibo.numeroProcesso };
          if (!recibo.duplicado) {
            this.processoParaCaso.set(recibo.numeroProcesso, { tenantId: ctx.tenantId, casoId: it.casoId });
            this.atualizar(ctx, it.casoId, (x) => ({ numeroProcesso: recibo.numeroProcesso, tribunal: it.tribunal, protocoladoDraftHash: draftHash, estagio: avancar(x.estagio, 'ENTREGA') }),
              'protocolo.concluido', { numeroProcesso: recibo.numeroProcesso, demo: recibo.demo, loteId: lote.loteId });
          }
        })
        .catch((e: unknown) => {
          lote.itens[idx] = { casoId: it.casoId, status: 'FALHA', erro: (e as Error).message };
          try {
            this.atualizar(ctx, it.casoId, () => ({}), 'protocolo.falhou', { loteId: lote.loteId, erro: (e as Error).message, retryAfterSeg: e instanceof ErroTribunal ? e.retryAfterSeg : undefined });
          } catch { /* caso removido: ignora */ }
        });
    });
    return lote;
  }

  obterLote(ctx: CtxLoas, loteId: string): EstadoLote {
    const l = this.lotes.get(loteId);
    if (!l || l.tenantId !== ctx.tenantId) throw new ErroLoas(404, 'Lote não encontrado.');
    return l;
  }

  // ───────────── webhook / acompanhamento ─────────────

  /** Chamado após verificação HMAC. Idempotente por eventId. */
  receberEventoTribunal(evento: { eventId?: string; tipo?: string; numeroProcesso?: string; dados?: unknown }): { aceito: boolean; duplicado?: boolean } {
    if (!evento?.eventId || !evento.tipo || !evento.numeroProcesso) throw new ErroValidacao([{ campo: 'eventId|tipo|numeroProcesso', msg: 'obrigatórios' }]);
    if (!/^(pericia\.(agendada|realizada)|avaliacao_social\.agendada|sentenca\.publicada|rpv\.expedida|movimentacao)$/.test(evento.tipo)) {
      throw new ErroValidacao([{ campo: 'tipo', msg: 'tipo de evento desconhecido' }]);
    }
    if (!this.dedupWebhook.registrar(evento.eventId)) return { aceito: true, duplicado: true };
    const alvo = this.processoParaCaso.get(evento.numeroProcesso);
    if (!alvo) return { aceito: false };
    const ctx = { tenantId: alvo.tenantId, userId: 'sistema:webhook' };
    this.atualizar(ctx, alvo.casoId, () => ({}), `acompanhamento.${evento.tipo}`, { numeroProcesso: evento.numeroProcesso, dados: evento.dados });
    return { aceito: true };
  }

  // ───────────── painel ─────────────

  painel(ctx: CtxLoas): PainelAgregado & { tribunais: Record<string, EstadoCircuito> } {
    return { ...this.d.repo.painel(ctx.tenantId), tribunais: this.d.gateway.saudeTribunais() };
  }

  // ───────────── outbox → SSE ─────────────

  despacharOutbox(maximo = 500): number {
    const evs = this.d.repo.drenarOutbox(maximo);
    if (this.d.hub) for (const e of evs) this.d.hub.publicar(e.tenantId, e.advogadoId, e.tipo, { casoId: e.casoId, ...(e.dados as object), seq: e.seq, em: e.em });
    return evs.length;
  }

  iniciarDispatcher(intervaloMs = 200): void {
    if (this.dispatcher) return;
    this.dispatcher = setInterval(() => { while (this.despacharOutbox() === 500) { /* drena rajadas */ } }, intervaloMs);
    (this.dispatcher as unknown as { unref?: () => void }).unref?.();
  }

  parar(): void { if (this.dispatcher) clearInterval(this.dispatcher); this.dispatcher = undefined; }
}
