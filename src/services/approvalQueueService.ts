/**
 * VELATRIX AOS · P20 · Fila de Aprovação (Human-in-the-Loop) — cliente da API do servidor.
 *
 * O servidor (/api/enterprise, src/server/enterprise/routes.ts) é a fonte de verdade:
 * hash do payload, guardrail, permissões, step-up (senha real), 4 olhos, execução e selo.
 * Este módulo só busca, envia comandos e mantém um snapshot para a UI (useSyncExternalStore).
 * Nada de WorkItem fica no navegador além do cache em memória desta aba.
 */
import { aprovacoesNecessarias, POLITICA_PADRAO, type WorkItem } from '../enterprise/hitl.ts';
import { hashCanonicalBrowser } from '../enterprise/canonicalJson.ts';
import type { GuardrailResultado } from '../enterprise/guardrail.ts';
import { formatBRL } from '../enterprise/deterministicEngine.ts';
import type { WorkItemPayload } from '../enterprise/demoSeed.ts';
import { authFetch } from './authClient';
import { IS_DEMO_MODE } from '../lib/demoMode';

export type { Metrica, WorkItemPayload } from '../enterprise/demoSeed.ts';

export interface EventoTrilha { em: string; tipo: string; ator: string; hash: string; prevHash: string; seq: number; }

export interface SealResultado {
  laudoId: string;
  versao: number;
  selo: string;
  emitidoEmUTC: string;
  signatario: { userId: string; nome: string; registroClasse: string };
}
export interface PacoteResultado { manifesto: Record<string, unknown>; manifestoHash: string; transmitido: boolean; }

export interface QueueEntry {
  item: WorkItem;
  ref?: string;
  payload: WorkItemPayload;
  payloadRevisado?: WorkItemPayload;
  guardrail?: GuardrailResultado;
  trilha?: EventoTrilha[];
  resultadoExecucao?: { resumo: string; hash?: string; carimbo: string };
  criadoEm: string;
  atualizadoEm: string;
}

type ItemDTO = WorkItem & {
  ref?: string;
  payload: WorkItemPayload;
  payloadRevisado?: WorkItemPayload;
  guardrail?: GuardrailResultado;
  resultado?: SealResultado | PacoteResultado;
  criadoEm: string;
  atualizadoEm: string;
  trilha?: Array<{ em: string; tipo: string; ator: string; hash: string; prevHash: string; seq: number }>;
};

const BASE = '/api/enterprise';

// ───────── HTTP ─────────

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function api<T>(path: string, init?: { method?: string; body?: unknown; idempotencyKey?: string }): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init?.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init?.idempotencyKey) headers['Idempotency-Key'] = init.idempotencyKey;
  const res = await authFetch(BASE + path, {
    method: init?.method ?? (init?.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

// ───────── Store (snapshot da UI) ─────────

let entries: QueueEntry[] = [];
let ready = false;
let erro: string | null = null;
let carregando: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => { entries = [...entries]; listeners.forEach((l) => l()); };

export function subscribe(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; }
export function getSnapshot(): QueueEntry[] { return entries; }
export function isReady(): boolean { return ready; }
export function getErro(): string | null { return erro; }
export function necessarias(item: WorkItem): number { return aprovacoesNecessarias(item, POLITICA_PADRAO); }

function resultadoParaUI(r: ItemDTO['resultado']): QueueEntry['resultadoExecucao'] {
  if (!r) return undefined;
  if ('selo' in r) {
    return {
      resumo: `Laudo ${r.laudoId} selado (v${r.versao}) · signatário ${r.signatario.nome} · ${r.signatario.registroClasse}`,
      hash: r.selo,
      carimbo: 'sem carimbo do tempo (ACT não configurada)',
    };
  }
  return { resumo: 'Manifesto do pacote de protocolo gerado — o profissional protocola', hash: r.manifestoHash, carimbo: 'n/a' };
}

function toEntry(d: ItemDTO, anterior?: QueueEntry): QueueEntry {
  const { ref, payload, payloadRevisado, guardrail, resultado, criadoEm, atualizadoEm, trilha, ...item } = d;
  return {
    item: item as WorkItem,
    ref,
    payload,
    payloadRevisado,
    guardrail,
    resultadoExecucao: resultadoParaUI(resultado),
    // trilha só vem no detalhe; preserva a já carregada se o item não mudou
    trilha: trilha ?? (anterior && anterior.atualizadoEm === atualizadoEm ? anterior.trilha : undefined),
    criadoEm,
    atualizadoEm,
  };
}

function upsert(d: ItemDTO): QueueEntry {
  const i = entries.findIndex((e) => e.item.id === d.id);
  const e = toEntry(d, i >= 0 ? entries[i] : undefined);
  if (i >= 0) entries[i] = e; else entries = [e, ...entries];
  emit();
  return e;
}

export async function recarregar(): Promise<void> {
  const lista = await api<ItemDTO[]>('/work-items?limit=200');
  const antigos = new Map(entries.map((e) => [e.item.id, e]));
  entries = lista.map((d) => toEntry(d, antigos.get(d.id)));
  erro = null;
  emit();
}

/** Carrega a fila do servidor. Em modo demonstração, cria os exemplos na primeira vez (idempotente no servidor). */
export function inicializar(): Promise<void> {
  if (ready) return Promise.resolve();
  if (carregando) return carregando;
  carregando = (async () => {
    try {
      await recarregar();
      if (entries.length === 0 && IS_DEMO_MODE) {
        await api('/demo/seed', { body: {} });
        await recarregar();
      }
    } catch (e) {
      erro = (e as Error).message;
    } finally {
      ready = true;
      carregando = null;
      emit();
    }
  })();
  return carregando;
}

export async function carregarTrilha(id: string): Promise<void> {
  upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}`));
}

// ───────── Diff do que mudou desde a revisão ─────────
export function diffDesdeRevisao(e: QueueEntry): Array<{ campo: string; antes: string; depois: string }> {
  if (!e.payloadRevisado) return [];
  const out: Array<{ campo: string; antes: string; depois: string }> = [];
  const a = e.payloadRevisado, b = e.payload;
  const mapA = new Map((a.metricas ?? []).map((m) => [m.rotulo, m.valor]));
  for (const m of b.metricas ?? []) if (mapA.get(m.rotulo) !== m.valor) out.push({ campo: m.rotulo, antes: mapA.get(m.rotulo) ?? '—', depois: m.valor });
  const memA = new Map((a.memoriaCalculo ?? []).map((l) => [l.linha, l.valorCentavos]));
  for (const l of b.memoriaCalculo ?? []) if (memA.get(l.linha) !== l.valorCentavos) out.push({ campo: 'Memória · ' + l.linha, antes: memA.has(l.linha) ? formatBRL(memA.get(l.linha)!) : '—', depois: formatBRL(l.valorCentavos) });
  if (a.textoLaudo !== b.textoLaudo) out.push({ campo: 'Texto do laudo', antes: 'versão revisada', depois: 'texto alterado' });
  return out;
}

// ───────── Ações (o servidor decide; aqui só enviamos) ─────────

function achar(id: string): QueueEntry {
  const e = entries.find((x) => x.item.id === id);
  if (!e) throw new Error('WorkItem não encontrado');
  return e;
}

/** Hash do conteúdo que ESTA tela está exibindo — o servidor só aceita se for o atual. */
const hashExibido = (e: QueueEntry) => hashCanonicalBrowser(e.payload);

export async function revisar(id: string): Promise<void> {
  const e = achar(id);
  upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}/review`, { body: { hashExibido: await hashExibido(e) } }));
}

function baixarManifesto(ref: string, manifesto: unknown) {
  const blob = new Blob([JSON.stringify(manifesto, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pacote-protocolo-${ref}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Step-up (senha validada no servidor) → aprovação → execução, se a política de 4 olhos já estiver satisfeita. */
export async function aprovarEExecutar(id: string, senha: string): Promise<{ status: 'AGUARDANDO_SEGUNDO' | 'EXECUTADO'; mensagem: string }> {
  const e = achar(id);
  await api('/step-up', { body: { password: senha } });
  const aprovado = upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}/approve`, { body: { hashExibido: await hashExibido(e) } }));
  if (aprovado.item.status !== 'APPROVED') {
    return { status: 'AGUARDANDO_SEGUNDO', mensagem: 'Aprovação registrada. Falta o segundo aprovador (4 olhos), com outro login.' };
  }
  const exec = await api<ItemDTO & { reutilizado?: boolean }>(`/work-items/${encodeURIComponent(id)}/execute`, { body: {} });
  const final = upsert(exec);
  if (exec.resultado && 'manifesto' in exec.resultado) baixarManifesto(final.ref ?? id.slice(0, 8), exec.resultado.manifesto);
  return { status: 'EXECUTADO', mensagem: final.resultadoExecucao?.resumo ?? 'Executado.' };
}

export async function devolverItem(id: string, comentario: string): Promise<void> {
  upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}/return`, { body: { comentario } }));
}

export async function rejeitarItem(id: string, motivo: string): Promise<void> {
  upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}/reject`, { body: { motivo } }));
}

/** Reenvia o rascunho devolvido para revisão (nunca executa). */
export async function reenviarParaRevisao(id: string): Promise<void> {
  upsert(await api<ItemDTO>(`/work-items/${encodeURIComponent(id)}/submit`, { body: {} }));
}

/** Jurimetria (P16): a proposta de cessão nasce como rascunho do agente Liquidez → revisão humana. */
export async function criarPropostaCessao(d: { faceCentavos: number; vplCentralCentavos: number; propostaCentavos: number; p50: string; n: number; desagioPct: number }): Promise<string> {
  const payload: WorkItemPayload = {
    titulo: 'Proposta de cessão de precatório (rascunho)', cliente: '[CEDENTE]',
    metricas: [
      { rotulo: 'Data central de pagamento', valor: d.p50.split('-').reverse().join('/') },
      { rotulo: 'Amostra histórica', valor: `n = ${d.n}` },
      { rotulo: 'Deságio aplicado', valor: `${d.desagioPct}%` },
    ],
    memoriaCalculo: [
      { linha: 'Valor de face', valorCentavos: d.faceCentavos },
      { linha: 'VPL central', valorCentavos: d.vplCentralCentavos },
      { linha: 'Proposta', valorCentavos: d.propostaCentavos },
    ],
    textoLaudo: `Valor de face de ${formatBRL(d.faceCentavos)}, VPL central de ${formatBRL(d.vplCentralCentavos)} e proposta de ${formatBRL(d.propostaCentavos)}.`,
  };
  const criado = await api<ItemDTO>('/work-items', {
    body: {
      esteira: 'PRECATORIA', tipo: 'EXPORTAR_PACOTE_PROTOCOLO', riscoFlag: 'NAO_AVALIADO', agente: 'Liquidez',
      status: 'READY_FOR_REVIEW', valorEnvolvidoCentavos: d.faceCentavos, payload,
    },
    idempotencyKey: `cessao-${await hashCanonicalBrowser(payload).then((h) => h.slice(0, 32))}`,
  });
  upsert(criado);
  return criado.ref ?? criado.id;
}
