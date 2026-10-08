/**
 * VELATRIX AOS · Leitura de Autos (P26) — Guardrail de citação.
 *
 * Regra: nenhum fato extraído pela IA vale sem um trecho LITERAL da página citada.
 * O LLM só aponta; quem confirma é este código determinístico, comparando o trecho
 * com o texto real da página (camada de texto do PDF ou OCR). Não há "quase igual":
 * a comparação é exata depois de normalizar só o que é ruído tipográfico
 * (acentos, caixa, espaços, aspas, travessões, hifenização de quebra de linha).
 *
 * Puro: sem IO, roda no navegador, no servidor e nos testes.
 */

export type CampoFato =
  | 'parte_autora' | 'parte_re' | 'advogado' | 'juizo' | 'numero_processo'
  | 'pedido' | 'valor' | 'data' | 'prazo' | 'decisao' | 'fundamento_legal' | 'outro';

export const CAMPOS_FATO: readonly CampoFato[] = [
  'parte_autora', 'parte_re', 'advogado', 'juizo', 'numero_processo',
  'pedido', 'valor', 'data', 'prazo', 'decisao', 'fundamento_legal', 'outro',
];

export interface Fato {
  campo: CampoFato;
  /** Valor normalizado (ex.: "R$ 1.250.000,00", "12/03/2024", "João da Silva"). */
  valor: string;
  /** Página (1-based) onde o trecho aparece. */
  pagina: number;
  /** Cópia literal do texto da página que sustenta o fato. */
  trecho: string;
}

export type StatusCitacao =
  | 'CONFERE'
  | 'PAGINA_FORA_DO_ESCOPO'
  | 'TRECHO_CURTO'
  | 'TRECHO_NAO_ENCONTRADO'
  | 'VALOR_DIVERGE'
  | 'DATA_DIVERGE';

export interface FatoVerificado extends Fato {
  status: StatusCitacao;
}

export const TRECHO_MIN_CHARS = 12;
export const TRECHO_MAX_CHARS = 600;

/** Tipografia → forma canônica, numa tabela só (1 passada de regex em vez de 5). */
const TROCA: Record<string, string> = {
  '\u201c': '"', '\u201d': '"', '\u201e': '"', '\u00ab': '"', '\u00bb': '"',
  '\u2018': "'", '\u2019': "'", '\u00b4': "'", '`': "'",
  '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-', '\u2015': '-', '\u2212': '-',
  '\u00a0': ' ',
};
const RE_TIPOGRAFIA = /[\u0300-\u036f\u201c\u201d\u201e\u00ab\u00bb\u2018\u2019\u00b4`\u2010-\u2015\u2212\u00a0]/g;

/**
 * Normalização só de ruído tipográfico — nunca de conteúdo.
 * Perf (teste de carga P27): era 55% da CPU do servidor; agora 4 passadas em vez de 9.
 * Equivalência com a versão anterior provada em teste com textos aleatórios.
 */
export function normalizarParaCitacao(s: string): string {
  return s
    .replace(/(\p{L})-\s*\r?\n\s*(\p{L})/gu, '$1$2') // "execu-\nção" → "execução"
    .normalize('NFD')
    .replace(RE_TIPOGRAFIA, (c) => TROCA[c] ?? '') // acentos (combinantes) somem; aspas/travessões/nbsp padronizam
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ───────────────────────── valores e datas ─────────────────────────

const RE_BRL = /-?\s*R\$\s*-?\s*\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|-?\s*R\$\s*-?\s*\d+(?:,\d{1,2})?/g;

export function brlParaCentavos(s: string): number | null {
  const m = s.match(/(-)?\s*R\$\s*(-)?\s*([\d.]+)(?:,(\d{1,2}))?/);
  if (!m) return null;
  const reais = Number(m[3].replace(/\./g, ''));
  if (!Number.isFinite(reais)) return null;
  const v = reais * 100 + (m[4] ? Number(m[4].padEnd(2, '0')) : 0);
  return m[1] || m[2] ? -v : v;
}

export function centavosNoTexto(s: string): number[] {
  return [...s.matchAll(RE_BRL)].map((m) => brlParaCentavos(m[0])).filter((v): v is number => v !== null);
}

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/** Datas do texto como 'AAAA-MM-DD'. Aceita 12/03/2024, 12.03.2024 e "12 de março de 2024". */
export function datasNoTexto(s: string): string[] {
  const n = normalizarParaCitacao(s);
  const out: string[] = [];
  const iso = (d: number, m: number, a: number) =>
    d >= 1 && d <= 31 && m >= 1 && m <= 12 && a >= 1900 && a <= 2100
      ? `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      : null;
  for (const m of n.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g)) {
    const v = iso(+m[1], +m[2], +m[3]);
    if (v) out.push(v);
  }
  for (const m of n.matchAll(/\b(\d{1,2})o? de (janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (\d{4})\b/g)) {
    const v = iso(+m[1], MESES[m[2]], +m[3]);
    if (v) out.push(v);
  }
  return out;
}

// ───────────────────────── verificação ─────────────────────────

export interface EscopoCitacao {
  /** Texto de cada página enviada (n → texto). Só estas podem ser citadas. */
  paginas: Map<number, string>;
}

/**
 * Normalização preguiçosa por página: só as páginas efetivamente citadas são normalizadas
 * (a IA recebe até 30 páginas, mas os fatos costumam citar poucas). Cache por escopo.
 */
const CACHE_NORM = new WeakMap<EscopoCitacao, Map<number, string>>();
function paginaNormalizada(escopo: EscopoCitacao, n: number): string | undefined {
  let m = CACHE_NORM.get(escopo);
  if (!m) CACHE_NORM.set(escopo, (m = new Map()));
  let v = m.get(n);
  if (v === undefined) {
    const t = escopo.paginas.get(n);
    if (t === undefined) return undefined;
    m.set(n, (v = normalizarParaCitacao(t)));
  }
  return v;
}

export function verificarFato(f: Fato, escopo: EscopoCitacao): FatoVerificado {
  if (!Number.isInteger(f.pagina) || !escopo.paginas.has(f.pagina)) return { ...f, status: 'PAGINA_FORA_DO_ESCOPO' };
  const trecho = normalizarParaCitacao(f.trecho);
  if (trecho.length < TRECHO_MIN_CHARS) return { ...f, status: 'TRECHO_CURTO' };

  // Trecho pode atravessar a quebra de página: aceita p. N + p. N+1, citado como p. N.
  const texto = paginaNormalizada(escopo, f.pagina)!;
  // Próxima página só é normalizada se o trecho não estiver inteiro na página citada.
  const proxima = texto.includes(trecho) ? undefined : paginaNormalizada(escopo, f.pagina + 1);
  const achou = texto.includes(trecho) || (!!proxima && `${texto} ${proxima}`.includes(trecho) && !proxima.includes(trecho));
  if (!achou) return { ...f, status: 'TRECHO_NAO_ENCONTRADO' };

  // O valor declarado precisa estar DENTRO do trecho citado — não basta existir na página.
  if (f.campo === 'valor') {
    const alvo = brlParaCentavos(f.valor);
    if (alvo === null || !centavosNoTexto(f.trecho).includes(alvo)) return { ...f, status: 'VALOR_DIVERGE' };
  }
  if (f.campo === 'data' || f.campo === 'prazo') {
    const alvo = datasNoTexto(f.valor);
    // Prazo pode ser "15 dias" (sem data): só exige conferência quando o valor tem data.
    if (alvo.length && !alvo.every((d) => datasNoTexto(f.trecho).includes(d))) return { ...f, status: 'DATA_DIVERGE' };
    if (f.campo === 'data' && !alvo.length) return { ...f, status: 'DATA_DIVERGE' };
  }
  return { ...f, status: 'CONFERE' };
}

export interface ResultadoGuardrailCitacao {
  status: 'APROVADO' | 'PARCIAL' | 'BLOQUEADO' | 'VAZIO';
  fatos: FatoVerificado[];
  conferidos: number;
  rejeitados: number;
}

/**
 * APROVADO: todos conferem. PARCIAL: parte confere (os rejeitados ficam visíveis,
 * marcados, e nunca entram no relatório como fato). BLOQUEADO: nenhum confere.
 * VAZIO: a IA não apontou fato algum (ex.: procuração) — não é erro.
 */
export function aplicarGuardrailCitacao(fatos: Fato[], escopo: EscopoCitacao): ResultadoGuardrailCitacao {
  const verificados = fatos.map((f) => verificarFato(f, escopo));
  const conferidos = verificados.filter((f) => f.status === 'CONFERE').length;
  const rejeitados = verificados.length - conferidos;
  const status = !verificados.length ? 'VAZIO' : conferidos === 0 ? 'BLOQUEADO' : rejeitados ? 'PARCIAL' : 'APROVADO';
  return { status, fatos: verificados, conferidos, rejeitados };
}
