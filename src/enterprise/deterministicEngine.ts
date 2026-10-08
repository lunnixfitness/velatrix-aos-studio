/**
 * VELATRIX AOS · Enterprise · Motor Determinístico (Ferramenta 2).
 *
 * Todo número de laudo/petição sai daqui — nunca do LLM. Valores em CENTAVOS (inteiros),
 * taxas em % ao mês. Tabelas de taxa são entrada (fonte oficial versionada), nunca
 * embutidas no código. Arredondamento: meio para cima, só no resultado final.
 */

export type Competencia = string; // 'AAAA-MM'

export function addMonths(c: Competencia, n: number): Competencia {
  const [y, m] = c.split('-').map(Number);
  const t = y * 12 + (m - 1) + n;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
}

export function monthsBetween(a: Competencia, b: Competencia): number {
  const [ya, ma] = a.split('-').map(Number);
  const [yb, mb] = b.split('-').map(Number);
  return (yb * 12 + mb) - (ya * 12 + ma);
}

export interface TaxaMensalTabela {
  fonte: string; // ex.: 'BCB SGS 4390 · baixada em 2026-09-01'
  versao: string;
  taxas: Record<Competencia, number>; // % no mês
}

export interface MemoriaLinha { competencia: Competencia; taxaPct: number; }

export interface ResultadoAtualizacao {
  principalCentavos: number;
  fatorPct: number;          // soma das taxas aplicadas (%)
  jurosCentavos: number;
  totalCentavos: number;
  memoria: MemoriaLinha[];
  fundamento: string[];      // ids NormaRef
  tabela: { fonte: string; versao: string };
}

function sumRange(tab: TaxaMensalTabela, de: Competencia, ate: Competencia): MemoriaLinha[] {
  const out: MemoriaLinha[] = [];
  if (monthsBetween(de, ate) < 0) return out;
  for (let c = de; monthsBetween(c, ate) >= 0; c = addMonths(c, 1)) {
    const t = tab.taxas[c];
    if (t === undefined) throw new Error(`Taxa ausente para ${c} na tabela ${tab.fonte} v${tab.versao}`);
    out.push({ competencia: c, taxaPct: t });
  }
  return out;
}

/**
 * Indébito tributário (Sicalc / Lei 9.250/95 art. 39 §4):
 * SELIC acumulada (soma simples) do mês SEGUINTE ao pagamento até o mês ANTERIOR à
 * compensação/restituição, mais 1% no mês da compensação.
 */
export function atualizarIndebitoSelic(
  principalCentavos: number,
  pagamento: Competencia,
  compensacao: Competencia,
  selic: TaxaMensalTabela,
  acrescimoMesPct = 1,
): ResultadoAtualizacao {
  if (!Number.isInteger(principalCentavos) || principalCentavos < 0) throw new Error('principal deve ser inteiro em centavos');
  if (monthsBetween(pagamento, compensacao) < 1) {
    return { principalCentavos, fatorPct: 0, jurosCentavos: 0, totalCentavos: principalCentavos, memoria: [], fundamento: ['LEI:9250:1995'], tabela: { fonte: selic.fonte, versao: selic.versao } };
  }
  const memoria = sumRange(selic, addMonths(pagamento, 1), addMonths(compensacao, -1));
  memoria.push({ competencia: compensacao, taxaPct: acrescimoMesPct });
  const fatorPct = round6(memoria.reduce((s, l) => s + l.taxaPct, 0));
  const jurosCentavos = Math.round((principalCentavos * fatorPct) / 100);
  return { principalCentavos, fatorPct, jurosCentavos, totalCentavos: principalCentavos + jurosCentavos, memoria, fundamento: ['LEI:9250:1995'], tabela: { fonte: selic.fonte, versao: selic.versao } };
}

/**
 * Condenação judicial da Fazenda (EC 113/2021 art. 3º): SELIC acumulada, uma única vez,
 * de `inicio` até `fim` (inclusive). Períodos anteriores a 12/2021 exigem o fator do
 * regime anterior informado explicitamente (não é inferido).
 */
export function atualizarJudicialEc113(
  valorCentavos: number,
  inicio: Competencia,
  fim: Competencia,
  selic: TaxaMensalTabela,
  fatorRegimeAnterior?: { fator: number; fonte: string },
): ResultadoAtualizacao {
  if (!Number.isInteger(valorCentavos) || valorCentavos < 0) throw new Error('valor deve ser inteiro em centavos');
  let base = valorCentavos;
  let de = inicio;
  if (monthsBetween(inicio, '2021-12') > 0) {
    if (!fatorRegimeAnterior) throw new Error('Período anterior a 12/2021 requer fator do regime anterior (manual de cálculos do tribunal)');
    base = Math.round(valorCentavos * fatorRegimeAnterior.fator);
    de = '2021-12';
  }
  const memoria = sumRange(selic, de, fim);
  const fatorPct = round6(memoria.reduce((s, l) => s + l.taxaPct, 0));
  const jurosCentavos = Math.round((base * fatorPct) / 100);
  return { principalCentavos: base, fatorPct, jurosCentavos, totalCentavos: base + jurosCentavos, memoria, fundamento: ['EC:113:2021'], tabela: { fonte: selic.fonte, versao: selic.versao } };
}

export interface NcmMonofasicoRegra { ncmPrefixo: string; vigenciaInicio: string; vigenciaFim?: string; normaId: string; }

/** NCM sujeito à tributação monofásica na data do fato gerador? */
export function ncmMonofasico(ncm: string, dataFatoGerador: string, regras: NcmMonofasicoRegra[]): NcmMonofasicoRegra | null {
  const n = ncm.replace(/\D/g, '');
  return regras.find((r) => n.startsWith(r.ncmPrefixo.replace(/\D/g, '')) && r.vigenciaInicio <= dataFatoGerador && (!r.vigenciaFim || dataFatoGerador <= r.vigenciaFim)) ?? null;
}

function round6(x: number): number { return Math.round(x * 1e6) / 1e6; }

/** Formatação BRL a partir de centavos (para laudos). */
export function formatBRL(centavos: number): string {
  const neg = centavos < 0; const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${neg ? '-' : ''}R$ ${reais},${String(abs % 100).padStart(2, '0')}`;
}
