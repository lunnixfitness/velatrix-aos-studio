/**
 * VELATRIX AOS · Enterprise · ZDR — política de LLM e redação de PII (Ferramenta 5 · P13).
 *
 * 1. Em produção só sobe com LLM_TIER=paid|vertex (API paga/Vertex com retenção zero
 *    documentada). O nível gratuito da Gemini API pode usar dados para melhorar produtos.
 * 2. Antes de qualquer LLM externo, PII vira token reversível; o mapa fica só no servidor.
 * 3. Tenant pode exigir "LLM só local": nenhum dado sai.
 * Texto de UI: "criptografia em trânsito e em repouso, com chave por cliente" — não "ponta a ponta".
 */

export type LlmTier = 'free' | 'paid' | 'vertex' | 'local';

export interface LlmPolicyInput { nodeEnv: string | undefined; llmTier: string | undefined; tenantSomenteLocal: boolean; }

export function validarPoliticaBoot(env: { NODE_ENV?: string; LLM_TIER?: string }): void {
  if (env.NODE_ENV === 'production' && env.LLM_TIER !== 'paid' && env.LLM_TIER !== 'vertex') {
    throw new Error('LLM_TIER=paid|vertex é obrigatório em produção (retenção zero). Servidor não iniciado.');
  }
}

export function provedorPermitido(p: LlmPolicyInput): { provedor: 'externo' | 'local'; alegacaoZdrPermitida: boolean } {
  if (p.tenantSomenteLocal) return { provedor: 'local', alegacaoZdrPermitida: true };
  const zdr = p.nodeEnv === 'production' && (p.llmTier === 'paid' || p.llmTier === 'vertex');
  return { provedor: 'externo', alegacaoZdrPermitida: zdr };
}

export const TEXTO_ZDR = 'Dados de clientes não são usados para treinar modelos.';
export const TEXTO_CRIPTO = 'Criptografia em trânsito e em repouso, com chave por cliente.';

// ───────── Redação de PII ─────────

export type TipoPii = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'PROCESSO' | 'CEP';

function cpfValido(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (n: number) => { let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

function cnpjValido(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (n: number) => { const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i++) s += Number(d[i]) * w[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

const PADROES: Array<{ tipo: TipoPii; re: RegExp; valida?: (m: string) => boolean }> = [
  { tipo: 'PROCESSO', re: /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g },
  { tipo: 'CNPJ', re: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, valida: (m) => cnpjValido(m.replace(/\D/g, '')) },
  { tipo: 'CPF', re: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, valida: (m) => cpfValido(m.replace(/\D/g, '')) },
  { tipo: 'EMAIL', re: /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g },
  { tipo: 'TELEFONE', re: /(?:\+55\s?)?\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b/g },
  { tipo: 'CEP', re: /\b\d{5}-\d{3}\b/g },
];

export interface Redacao { texto: string; mapa: Record<string, string>; contagem: Partial<Record<TipoPii, number>>; }

/**
 * Troca PII por tokens [[TIPO_n]]. `nomes` (partes, advogados) vêm do cadastro do caso.
 * O mapa NUNCA sai do servidor nem vai para o LLM.
 */
export function redigir(texto: string, nomes: string[] = []): Redacao {
  const mapa: Record<string, string> = {};
  const inverso = new Map<string, string>();
  const contagem: Partial<Record<TipoPii | 'NOME', number>> = {};
  const token = (tipo: string, valor: string) => {
    const existente = inverso.get(tipo + '|' + valor);
    if (existente) return existente;
    contagem[tipo as TipoPii] = (contagem[tipo as TipoPii] ?? 0) + 1;
    const t = `[[${tipo}_${contagem[tipo as TipoPii]}]]`;
    mapa[t] = valor; inverso.set(tipo + '|' + valor, t);
    return t;
  };
  let out = texto;
  for (const nome of [...nomes].filter(Boolean).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, (m) => token('NOME', m));
  }
  for (const p of PADROES) {
    out = out.replace(p.re, (m) => (p.valida && !p.valida(m) ? m : token(p.tipo, m)));
  }
  return { texto: out, mapa, contagem };
}

export function reidratar(texto: string, mapa: Record<string, string>): string {
  return texto.replace(/\[\[[A-Z]+_\d+\]\]/g, (t) => mapa[t] ?? t);
}

// ───────── Registro de subprocessadores (DPA) ─────────

export interface Subprocessador { nome: string; finalidade: string; categoriaDados: string[]; pais: string; retencao: string; baseContratual: string; }
