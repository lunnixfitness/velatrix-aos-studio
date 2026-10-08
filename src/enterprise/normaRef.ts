/**
 * VELATRIX AOS · Enterprise · Base normativa local (Ferramenta 2 · P11).
 *
 * Toda citação legal em laudo/petição precisa existir aqui e estar vigente na data
 * de referência. Percentuais legais (multas etc.) vivem em `parametros`, nunca no código.
 * O seed abaixo é o mínimo para os testes; a base real é mantida pelo jurídico
 * (IN RFB, Soluções de Consulta COSIT, Temas STF/STJ) e versionada.
 */
export type NormaTipo = 'LEI' | 'LC' | 'CTN' | 'EC' | 'IN_RFB' | 'SC_COSIT' | 'TEMA_STF' | 'TEMA_STJ';

export interface NormaRef {
  id: string; // chave canônica, ex.: LEI:9430:1996
  tipo: NormaTipo;
  numero: string;
  ano?: number;
  ementa: string;
  vigenciaInicio: string; // AAAA-MM-DD
  vigenciaFim?: string;
  parametros?: Record<string, number>;
  observacao?: string;
}

export function normaKey(tipo: NormaTipo, numero: string | number, ano?: number): string {
  const n = String(numero).replace(/\D/g, '').replace(/^0+/, '');
  if (tipo === 'CTN') return 'CTN';
  if (tipo === 'TEMA_STF' || tipo === 'TEMA_STJ') return `${tipo}:${n}`;
  return `${tipo}:${n}:${ano ?? ''}`;
}

function fullYear(a: string): number {
  const y = Number(a);
  return a.length === 2 ? (y > 50 ? 1900 + y : 2000 + y) : y;
}

export interface Citacao { texto: string; key: string; }

/** Extrai citações normativas de um texto em português. */
export function extrairCitacoes(texto: string): Citacao[] {
  const out: Citacao[] = [];
  const push = (m: RegExpMatchArray, key: string) => out.push({ texto: m[0], key });
  for (const m of texto.matchAll(/\bLei\s+Complementar\s+(?:n[º°o.]?\s*)?([\d.]+)\s*\/\s*(\d{2,4})/gi)) push(m, normaKey('LC', m[1], fullYear(m[2])));
  for (const m of texto.matchAll(/\bLei\s+(?!Complementar)(?:n[º°o.]?\s*)?([\d.]+)\s*\/\s*(\d{2,4})/gi)) push(m, normaKey('LEI', m[1], fullYear(m[2])));
  for (const m of texto.matchAll(/\bIN\s+RFB\s+(?:n[º°o.]?\s*)?([\d.]+)\s*\/\s*(\d{2,4})/gi)) push(m, normaKey('IN_RFB', m[1], fullYear(m[2])));
  for (const m of texto.matchAll(/\bSolu[çc][ãa]o\s+de\s+Consulta\s+(?:COSIT\s+)?(?:n[º°o.]?\s*)?([\d.]+)\s*\/\s*(\d{2,4})/gi)) push(m, normaKey('SC_COSIT', m[1], fullYear(m[2])));
  for (const m of texto.matchAll(/\b(?:EC|Emenda\s+Constitucional)\s+(?:n[º°o.]?\s*)?(\d+)\s*\/\s*(\d{2,4})/gi)) push(m, normaKey('EC', m[1], fullYear(m[2])));
  for (const m of texto.matchAll(/\bTema\s+(?:n[º°o.]?\s*)?(\d+)(?:\s+(?:do|da)\s+(STF|STJ))?/gi)) {
    const corte = (m[2] || 'STF').toUpperCase();
    push(m, normaKey(corte === 'STJ' ? 'TEMA_STJ' : 'TEMA_STF', m[1]));
  }
  for (const m of texto.matchAll(/\bCTN\b|C[óo]digo\s+Tribut[áa]rio\s+Nacional/gi)) push(m, 'CTN');
  return out;
}

export class NormaRegistry {
  private map = new Map<string, NormaRef>();
  constructor(normas: NormaRef[]) { for (const n of normas) this.map.set(n.id, n); }
  get(id: string): NormaRef | undefined { return this.map.get(id); }
  vigente(id: string, dataRef: string): boolean {
    const n = this.map.get(id);
    if (!n) return false;
    return n.vigenciaInicio <= dataRef && (!n.vigenciaFim || dataRef <= n.vigenciaFim);
  }
  parametro(id: string, nome: string): number {
    const v = this.map.get(id)?.parametros?.[nome];
    if (v === undefined) throw new Error(`Parâmetro ${nome} ausente em ${id}`);
    return v;
  }
  all(): NormaRef[] { return [...this.map.values()]; }
}

/**
 * Seed mínimo. ATENÇÃO: conteúdo jurídico deve ser revisado pelo responsável técnico.
 * Lei 9.430/96 art. 44: 75% de ofício; qualificada 100% (redação da Lei 14.689/2023),
 * 150% na reincidência. Tema 736/STF: multa isolada de 50% por compensação não
 * homologada declarada inconstitucional — NÃO é risco a sinalizar.
 */
export const NORMAS_SEED: NormaRef[] = [
  { id: 'CTN', tipo: 'CTN', numero: '5172', ano: 1966, ementa: 'Código Tributário Nacional (art. 168: prazo de 5 anos para restituição)', vigenciaInicio: '1967-01-01', parametros: { prazoRestituicaoAnos: 5 } },
  { id: 'LEI:9430:1996', tipo: 'LEI', numero: '9430', ano: 1996, ementa: 'Legislação tributária federal; art. 44 (multas de ofício); art. 74 (compensação)', vigenciaInicio: '1997-01-01', parametros: { multaOficioPct: 75, multaQualificadaPct: 100, multaQualificadaReincidenciaPct: 150 } },
  { id: 'LEI:14689:2023', tipo: 'LEI', numero: '14689', ano: 2023, ementa: 'Altera art. 44 da Lei 9.430/96 (multa qualificada)', vigenciaInicio: '2023-09-21' },
  { id: 'LEI:9250:1995', tipo: 'LEI', numero: '9250', ano: 1995, ementa: 'Art. 39 §4: SELIC acumulada sobre restituição/compensação + 1% no mês', vigenciaInicio: '1996-01-01', parametros: { acrescimoMesCompensacaoPct: 1 } },
  { id: 'EC:113:2021', tipo: 'EC', numero: '113', ano: 2021, ementa: 'Art. 3º: SELIC única para atualização e juros em condenações da Fazenda Pública', vigenciaInicio: '2021-12-09' },
  { id: 'TEMA_STF:736', tipo: 'TEMA_STF', numero: '736', ementa: 'Inconstitucionalidade da multa isolada de 50% por compensação não homologada (art. 74 §17 Lei 9.430/96)', vigenciaInicio: '2023-03-17' },
];
