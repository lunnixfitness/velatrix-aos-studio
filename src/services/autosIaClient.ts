/**
 * VELATRIX AOS · Leitura de Autos (P26b) — cliente das rotas /api/autos/*.
 *
 * - Sessão via authFetch (Bearer). O navegador nunca fala com o provedor de IA.
 * - 429 da FilaJusta: espera o Retry-After (com jitter) e tenta de novo — é o
 *   backpressure funcionando, não erro. Cancelável por AbortSignal.
 * - comLimite(): no máximo N chamadas simultâneas por advogado (o servidor aceita 4).
 */
import { authFetch } from './authClient';
import type { ExtracaoPeca, PecaResumo, RelatorioAutos } from '../server/autos/relatorioAutos';

export type { ExtracaoPeca, RelatorioAutos };

export class ErroAutosIa extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export interface StatusAutosIa {
  ia: string;
  ocr: boolean;
  plataforma: { emExecucao: number; pendentes: number; esperaMediaMs: number };
  escritorio: { emExecucao: number; pendentes: number };
  memoriaPendenteMB?: number;
  modoPadrao?: ModoExtracao;
  /** O servidor fixou o modo (AUTOS_MODO_FORCADO): o seletor fica travado. */
  modoForcado?: boolean;
}

export type ModoExtracao = 'economico' | 'hibrido' | 'completo';

const dormir = (ms: number, sinal?: AbortSignal) =>
  new Promise<void>((ok, falha) => {
    const t = setTimeout(ok, ms);
    sinal?.addEventListener('abort', () => { clearTimeout(t); falha(new DOMException('cancelado', 'AbortError')); }, { once: true });
  });

/** Sob backpressure (429) o cliente insiste até este prazo total, respeitando o Retry-After. */
export const PRAZO_ESPERA_MS = 5 * 60_000;

async function chamar<T>(caminho: string, corpo?: unknown, sinal?: AbortSignal): Promise<T> {
  const inicio = Date.now();
  for (let i = 0; ; i++) {
    const res = await authFetch(`/api/autos${caminho}`, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers: corpo === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
    });
    if (res.status === 429 && Date.now() - inicio < PRAZO_ESPERA_MS) {
      const seg = Math.min(60, Math.max(1, Number(res.headers.get('Retry-After')) || 2 ** Math.min(i, 5)));
      await dormir(seg * 1000 * (0.8 + Math.random() * 0.4), sinal);
      continue;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ErroAutosIa(res.status, (json as { error?: string }).error || `falha ${res.status}`);
    return json as T;
  }
}

export const statusAutosIa = (sinal?: AbortSignal) => chamar<StatusAutosIa>('/status', undefined, sinal);

export const ocrPagina = (n: number, img: { mime: string; base64: string }, sinal?: AbortSignal) =>
  chamar<{ n: number; texto: string; textoHash: string; modelo: string; cache: boolean; tokens?: { entrada: number; saida: number; estimado: boolean } }>('/ocr', { n, mime: img.mime, imagemBase64: img.base64 }, sinal);

export const extrairPeca = (
  autosHash: string,
  peca: { id: string; tipo: string; titulo?: string; paginaInicial: number; paginaFinal: number },
  paginas: { n: number; texto: string }[],
  sinal?: AbortSignal,
  modo?: ModoExtracao,
) => chamar<ExtracaoPeca & { cache: boolean }>('/extrair', { autosHash, peca, paginas, modo }, sinal);

export const gerarRelatorioAutos = (
  corpo: { autosHash: string; nomeArquivo: string; totalPaginas: number; pecas: PecaResumo[]; enviarParaRevisao?: boolean; esteira?: string },
  sinal?: AbortSignal,
) => chamar<{ relatorio: RelatorioAutos; workItem?: { id: string; ref?: string; status: string } }>('/relatorio', corpo, sinal);

/** Executa fn sobre os itens com no máximo `limite` em paralelo. Para no primeiro AbortError. */
export async function comLimite<T>(itens: T[], limite: number, fn: (item: T) => Promise<void>, sinal?: AbortSignal): Promise<void> {
  let i = 0;
  const trabalhador = async () => {
    while (i < itens.length) {
      if (sinal?.aborted) throw new DOMException('cancelado', 'AbortError');
      const item = itens[i++];
      await fn(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
}
