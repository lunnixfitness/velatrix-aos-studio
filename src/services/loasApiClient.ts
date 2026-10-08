/**
 * VELATRIX AOS · Cliente da API /api/v1/loas (P29)
 *
 * - Autenticação via authFetch (sessão do usuário).
 * - Toda mutação leva Idempotency-Key gerada UMA vez por ação do usuário;
 *   retentativas reutilizam a mesma chave (sem efeito duplicado).
 * - 429/503 respeitam Retry-After com teto de espera.
 * - Erros RFC 7807 viram ErroLoasApi com status e lista de campos.
 */
import { authFetch } from './authClient';
import type { CasoLoas, ResultadoCalculoLoas } from '../loas/tipos';
import type { Minuta } from '../loas/drafter';
import type { RegistroCaso, PaginaCasos, PainelAgregado, EstagioLoas } from '../server/loas/repositorio';
import type { EstadoLote, ItemLote } from '../server/loas/servicoLoas';
import type { AdvogadoProcuracao } from '../loas/assinatura';

const BASE = '/api/v1/loas';
const ESPERA_MAX_MS = 60_000;

export class ErroLoasApi extends Error {
  readonly status: number;
  readonly campos: Array<{ campo: string; msg: string }>;
  constructor(status: number, msg: string, campos: Array<{ campo: string; msg: string }> = []) {
    super(msg); this.status = status; this.campos = campos; this.name = 'ErroLoasApi';
  }
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function novaChaveIdempotencia(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function chamar<T>(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown, chave?: string): Promise<T> {
  const inicio = Date.now();
  for (let i = 0; ; i++) {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (corpo !== undefined) headers['Content-Type'] = 'application/json';
    if (metodo === 'POST') headers['Idempotency-Key'] = chave ?? novaChaveIdempotencia();
    const res = await authFetch(`${BASE}${caminho}`, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
    if ((res.status === 429 || res.status === 503 || (res.status === 409 && res.headers.get('Retry-After'))) && Date.now() - inicio < ESPERA_MAX_MS) {
      const seg = Math.min(30, Math.max(1, Number(res.headers.get('Retry-After')) || 2 ** Math.min(i, 4)));
      await dormir(seg * 1000 * (0.8 + Math.random() * 0.4));
      continue;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new ErroLoasApi(res.status, json?.title ?? json?.error ?? `HTTP ${res.status}`, json?.errors ?? []);
    return json as T;
  }
}

/** Uma chave por ação: a mesma ação re-tentada reaproveita a chave. */
const post = <T>(caminho: string, corpo: unknown) => { const k = novaChaveIdempotencia(); return chamar<T>('POST', caminho, corpo, k); };

export type RegistroComCalculo = RegistroCaso & { ultimoCalculo?: ResultadoCalculoLoas };

export const loasApi = {
  criarCaso: (caso: CasoLoas) => {
    // tenantId/advogado/estágio são definidos pelo servidor a partir da sessão.
    const { tenantId: _t, advogadoResponsavelId: _a, estagio: _e, versaoRegras: _v, ...corpo } = caso;
    // A tela guarda CPF com máscara; a API exige 11 dígitos.
    const so = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);
    return post<RegistroCaso>('/casos', { ...corpo, requerente: { ...corpo.requerente, cpf: so(corpo.requerente.cpf) } });
  },
  obterCaso: (id: string) => chamar<RegistroComCalculo>('GET', `/casos/${encodeURIComponent(id)}`),
  listarCasos: (f: { advogadoId?: string; estagio?: EstagioLoas; cursor?: string | null; limite?: number } = {}) => {
    const q = new URLSearchParams();
    if (f.advogadoId) q.set('advogadoId', f.advogadoId);
    if (f.estagio) q.set('estagio', f.estagio);
    if (f.cursor) q.set('cursor', f.cursor);
    if (f.limite) q.set('limite', String(f.limite));
    return chamar<PaginaCasos>('GET', `/casos${q.toString() ? `?${q}` : ''}`);
  },
  calcular: (id: string, competencia: string) => post<ResultadoCalculoLoas>(`/casos/${encodeURIComponent(id)}/calcular`, { competencia }),
  minuta: (id: string, corpo: { tesesSelecionadas: string[]; juizo: { orgao: string; subsecao: string }; advogado: { nome: string; oab: string }; trechosLivres?: string[] }) =>
    post<Minuta>(`/casos/${encodeURIComponent(id)}/minuta`, corpo),
  procuracao: (id: string, advogados: AdvogadoProcuracao[]) => post<RegistroCaso>(`/casos/${encodeURIComponent(id)}/procuracao`, { advogados }),
  aprovar: (id: string, anexosHash: string) => post<RegistroCaso>(`/casos/${encodeURIComponent(id)}/aprovar`, { anexosHash }),
  criarLote: (itens: ItemLote[]) => post<EstadoLote>('/lotes', { itens }),
  obterLote: (id: string) => chamar<EstadoLote>('GET', `/lotes/${encodeURIComponent(id)}`),
  painel: () => chamar<PainelAgregado & { tribunais: Record<string, string> }>('GET', '/painel'),
};

export interface EventoLoas { tipo: string; dados: Record<string, unknown>; }

/**
 * Assina o SSE /eventos usando fetch autenticado (EventSource não envia
 * Authorization). Reconecta com backoff até o AbortSignal ser acionado.
 */
export function assinarEventosLoas(onEvento: (e: EventoLoas) => void, sinal: AbortSignal): void {
  (async () => {
    for (let tentativa = 0; !sinal.aborted; tentativa++) {
      try {
        const res = await authFetch(`${BASE}/eventos`, { headers: { Accept: 'text/event-stream' }, signal: sinal });
        if (!res.ok || !res.body) throw new Error(`SSE HTTP ${res.status}`);
        tentativa = 0;
        const leitor = res.body.getReader();
        const dec = new TextDecoder();
        let buf = '';
        for (;;) {
          const { value, done } = await leitor.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let corte: number;
          while ((corte = buf.indexOf('\n\n')) >= 0) {
            const bloco = buf.slice(0, corte); buf = buf.slice(corte + 2);
            let tipo = 'message'; const dados: string[] = [];
            for (const linha of bloco.split('\n')) {
              if (linha.startsWith('event: ')) tipo = linha.slice(7);
              else if (linha.startsWith('data: ')) dados.push(linha.slice(6));
            }
            if (dados.length) { try { onEvento({ tipo, dados: JSON.parse(dados.join('\n')) }); } catch { /* evento malformado */ } }
          }
        }
      } catch { if (sinal.aborted) return; }
      await dormir(Math.min(30_000, 1000 * 2 ** Math.min(tentativa, 5)));
    }
  })();
}
