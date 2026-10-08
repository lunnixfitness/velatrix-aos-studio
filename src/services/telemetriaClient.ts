/**
 * VELATRIX AOS · Analytics de Uso · coletor do navegador
 *
 * Envia SOMENTE: id técnico da tela aberta, início/fim de sessão, heartbeat de presença
 * (só com a aba visível) e ações nomeadas por id. Nada de conteúdo, DOM, digitação ou documentos.
 * Lotes a cada 10 s (≤ 50 eventos), fetch keepalive no pagehide.
 */
import { authFetch, getSessionToken } from './authClient';

type TipoEv = 'sessao_inicio' | 'tela' | 'heartbeat' | 'sessao_fim' | 'acao';
interface Ev { tipo: TipoEv; ts: number; tela?: string; acao?: string; dispositivo?: 'desktop' | 'mobile'; }

const URL_EVENTOS = '/api/v1/telemetria/eventos';
const CHAVE_SESSAO = 'velatrix_telemetria_sessao';
const FLUSH_MS = 10_000;
const HEARTBEAT_MS = 30_000;
const MAX_FILA = 500;
const MAX_LOTE = 50;

let fila: Ev[] = [];
let sessaoId: string | null = null;
let telaAtual: string | null = null;
let ativo = false;
let tFlush: ReturnType<typeof setInterval> | undefined;
let tHb: ReturnType<typeof setInterval> | undefined;
let enviando = false;

const dispositivo = (): 'desktop' | 'mobile' =>
  typeof window !== 'undefined' && window.matchMedia?.('(max-width: 768px)').matches ? 'mobile' : 'desktop';

function novoId(): string {
  try { if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().replace(/-/g, ''); } catch { /* fallback */ }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

function enfileirar(e: Omit<Ev, 'ts'>): void {
  if (!ativo) return;
  fila.push({ ...e, ts: Date.now() });
  if (fila.length > MAX_FILA) fila.splice(0, fila.length - MAX_FILA); // offline prolongado: descarta o mais antigo
}

async function flush(keepalive = false): Promise<void> {
  if (enviando || !fila.length || !sessaoId || !getSessionToken()) return;
  enviando = true;
  const lote = fila.splice(0, MAX_LOTE);
  try {
    const r = await authFetch(URL_EVENTOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessaoId, eventos: lote }),
      keepalive,
    });
    // 5xx/429: devolve à fila; 4xx de validação: descarta (não insiste em lote inválido).
    if (r.status >= 500 || r.status === 429) fila = lote.concat(fila).slice(-MAX_FILA);
  } catch {
    fila = lote.concat(fila).slice(-MAX_FILA);
  } finally {
    enviando = false;
  }
}

function aoMudarVisibilidade(): void {
  if (document.visibilityState === 'hidden') void flush(true);
  else enfileirar({ tipo: 'heartbeat', tela: telaAtual ?? undefined });
}
function aoSairDaPagina(): void { void flush(true); }

/** Inicia a coleta (chamar após login). Idempotente. */
export function iniciarTelemetria(): void {
  if (ativo || typeof window === 'undefined' || !getSessionToken()) return;
  ativo = true;
  try {
    sessaoId = sessionStorage.getItem(CHAVE_SESSAO);
    if (!sessaoId) { sessaoId = novoId(); sessionStorage.setItem(CHAVE_SESSAO, sessaoId); }
  } catch { sessaoId = sessaoId ?? novoId(); }
  enfileirar({ tipo: 'sessao_inicio', dispositivo: dispositivo() });
  if (telaAtual) enfileirar({ tipo: 'tela', tela: telaAtual });
  tFlush = setInterval(() => void flush(), FLUSH_MS);
  tHb = setInterval(() => {
    if (document.visibilityState === 'visible') enfileirar({ tipo: 'heartbeat', tela: telaAtual ?? undefined });
  }, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', aoMudarVisibilidade);
  window.addEventListener('pagehide', aoSairDaPagina);
  void flush();
}

/** Encerra a coleta (logout). Envia sessao_fim com keepalive. */
export function encerrarTelemetria(): void {
  if (!ativo) return;
  enfileirar({ tipo: 'sessao_fim' });
  void flush(true);
  ativo = false;
  if (tFlush) clearInterval(tFlush);
  if (tHb) clearInterval(tHb);
  document.removeEventListener('visibilitychange', aoMudarVisibilidade);
  window.removeEventListener('pagehide', aoSairDaPagina);
  try { sessionStorage.removeItem(CHAVE_SESSAO); } catch { /* ignore */ }
  sessaoId = null;
  telaAtual = null;
}

/** Registra a tela/módulo aberto (id técnico da aba, ex.: 'leitura_autos'). */
export function rastrearTela(tela: string): void {
  if (!/^[a-z0-9_]{1,48}$/.test(tela) || tela === telaAtual) return;
  telaAtual = tela;
  enfileirar({ tipo: 'tela', tela });
}

/** Ação nomeada por id técnico (ex.: 'loas.calcular'). Nunca passe dados do caso aqui. */
export function rastrearAcao(acao: string): void {
  if (!/^[a-z0-9_.:-]{1,64}$/.test(acao)) return;
  enfileirar({ tipo: 'acao', acao });
}
