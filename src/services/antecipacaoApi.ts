/**
 * VELATRIX AOS · Cliente da API /api/v1/antecipacao (Precatórios & RPVs)
 * Toda mutação leva Idempotency-Key gerada uma vez por ação do usuário.
 */
import { authFetch } from './authClient';
import type { RegistroCredito, PainelAntecipacao, CanalAceite } from '../server/antecipacao/servico';
import type { RegrasAntecipacao } from '../antecipacao/regras';
import type { ItemFormalizacao } from '../antecipacao/tipos';

const BASE = '/api/v1/antecipacao';

export class ErroAntecipacaoApi extends Error {
  readonly status: number;
  readonly campos: Array<{ campo: string; msg: string }>;
  constructor(status: number, msg: string, campos: Array<{ campo: string; msg: string }> = []) {
    super(msg); this.status = status; this.campos = campos; this.name = 'ErroAntecipacaoApi';
  }
}

const chave = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

async function chamar<T>(metodo: 'GET' | 'POST', caminho: string, corpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) headers['Content-Type'] = 'application/json';
  if (metodo === 'POST') headers['Idempotency-Key'] = chave();
  const res = await authFetch(`${BASE}${caminho}`, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ErroAntecipacaoApi(res.status, json?.title ?? `HTTP ${res.status}`, json?.errors ?? []);
  return json as T;
}

export interface CompradorPublico {
  id: string; nome: string; tipoEntidade: string; demo?: boolean;
  apetite: { tipos: string[]; esferas: string[]; naturezas: string[]; flagsAceitas: string[]; aceitaRegimeEspecial: boolean; aceitaHonorarios: boolean; ticketMinCentavos: number; ticketMaxCentavos: number; validadeOfertaDias: number };
}

export const antecipacaoApi = {
  listar: (status?: string) => chamar<RegistroCredito[]>('GET', `/creditos${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  obter: (id: string) => chamar<RegistroCredito>('GET', `/creditos/${encodeURIComponent(id)}`),
  painel: () => chamar<PainelAntecipacao>('GET', '/painel'),
  regras: () => chamar<{ regras: RegrasAntecipacao; checklist: Array<{ id: ItemFormalizacao; descricao: string; baseLegal?: string }>; demo: boolean }>('GET', '/regras'),
  compradores: () => chamar<CompradorPublico[]>('GET', '/compradores'),
  cadastrar: (corpo: unknown) => chamar<RegistroCredito>('POST', '/creditos', corpo),
  reanalisar: (id: string, corpo?: unknown) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/reanalisar`, corpo ?? {}),
  escolher: (id: string, ofertaId: string) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/escolher`, { ofertaId }),
  aprovar: (id: string, hashExibido: string) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/aprovar`, { hashExibido }),
  aceite: (id: string, canal: CanalAceite, hashApresentado: string) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/aceite`, { canal, hashApresentado }),
  checklist: (id: string, item: ItemFormalizacao, evidencia: string) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/checklist`, { item, evidencia }),
  cancelar: (id: string, motivo: string) => chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/cancelar`, { motivo }),
  pagamentoDemo: (id: string, valorCentavos: number) =>
    chamar<RegistroCredito>('POST', `/creditos/${encodeURIComponent(id)}/pagamento-demo`, { comprovante: `demo:${Date.now().toString(36)}`, valorCentavos }),
  semearDemo: () => chamar<{ criados: number }>('POST', '/demo/seed', {}),
};

// ───────── conversões de formulário (sem float para dinheiro) ─────────

/** "485.000,50" | "485000.5" | "485000" → centavos inteiros; null se inválido. */
export function reaisParaCentavos(txt: string): number | null {
  const s = txt.trim().replace(/[R$\s]/g, '');
  if (!s) return null;
  let inteiro: string, frac = '';
  if (s.includes(',')) { const [a, b = ''] = s.split(','); inteiro = a.replace(/\./g, ''); frac = b; }
  else if (/^\d+\.\d{1,2}$/.test(s)) { [inteiro, frac] = s.split('.'); }
  else inteiro = s.replace(/\./g, '');
  if (!/^\d+$/.test(inteiro) || !/^\d{0,2}$/.test(frac)) return null;
  const v = Number(inteiro) * 100 + Number((frac + '00').slice(0, 2));
  return Number.isSafeInteger(v) ? v : null;
}

/** "30" | "30,5" → bps (3000 | 3050); null se inválido. */
export function percentualParaBps(txt: string): number | null {
  const s = txt.trim().replace('%', '').replace(',', '.');
  if (!s) return 0;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(s)) return null;
  const [a, b = ''] = s.split('.');
  return Number(a) * 100 + Number((b + '00').slice(0, 2));
}

export const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const pctBps = (bps: number) => `${(bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
