/**
 * VELATRIX AOS · Enterprise · Jurimetria & Score de Decisão (Ferramenta 4 · P16).
 *
 * Toda previsão sai com intervalo, n e data dos dados. n < 30 → "dados insuficientes".
 * Nada de "data real do depósito": é uma distribuição (P10/P50/P90).
 * Sem perfil individual de juiz/perito: só estatística agregada (vara/classe/assunto).
 */

export const AMOSTRA_MINIMA = 30;
export const AVISO_JURIMETRIA = 'Estatística descritiva; não é previsão de decisão judicial.';

export function quantil(sorted: number[], p: number): number {
  if (!sorted.length) throw new Error('amostra vazia');
  const pos = (sorted.length - 1) * p;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export type Score<T> =
  | { status: 'OK'; n: number; dataBase: string; valor: T }
  | { status: 'DADOS_INSUFICIENTES'; n: number; dataBase: string; minimo: number };

/** RNG determinístico (mulberry32) para Monte Carlo reprodutível e auditável. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface HistoricoPagamento { inscricao: string; pagamento: string; } // AAAA-MM-DD

function dias(a: string, b: string): number {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86_400_000);
}
function somarDias(a: string, d: number): string {
  return new Date(Date.parse(a + 'T00:00:00Z') + d * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Score de liquidação: distribuição da data de pagamento de um precatório inscrito em
 * `inscricao`, por bootstrap (Monte Carlo) dos prazos históricos do mesmo ente/tribunal.
 */
export function scoreLiquidacao(
  historico: HistoricoPagamento[],
  inscricao: string,
  dataBase: string,
  opts: { simulacoes?: number; seed?: number } = {},
): Score<{ p10: string; p50: string; p90: string; prazosDias: { p10: number; p50: number; p90: number } }> {
  const prazos = historico.filter((h) => h.pagamento <= dataBase).map((h) => dias(h.inscricao, h.pagamento)).filter((d) => d >= 0);
  if (prazos.length < AMOSTRA_MINIMA) return { status: 'DADOS_INSUFICIENTES', n: prazos.length, dataBase, minimo: AMOSTRA_MINIMA };
  const r = rng(opts.seed ?? 42);
  const sims = opts.simulacoes ?? 10_000;
  const amostra: number[] = [];
  for (let i = 0; i < sims; i++) amostra.push(prazos[Math.floor(r() * prazos.length)]);
  amostra.sort((a, b) => a - b);
  const q = { p10: Math.round(quantil(amostra, 0.1)), p50: Math.round(quantil(amostra, 0.5)), p90: Math.round(quantil(amostra, 0.9)) };
  return { status: 'OK', n: prazos.length, dataBase, valor: { p10: somarDias(inscricao, q.p10), p50: somarDias(inscricao, q.p50), p90: somarDias(inscricao, q.p90), prazosDias: q } };
}

/** Backtest: prevê pagamentos já ocorridos usando só dados até `corte`; MAE em dias sobre o P50. */
export function backtest(historico: HistoricoPagamento[], corte: string): { n: number; maeDias: number } | { n: number; maeDias: null } {
  const treino = historico.filter((h) => h.pagamento <= corte);
  const teste = historico.filter((h) => h.inscricao <= corte && h.pagamento > corte);
  const prazos = treino.map((h) => dias(h.inscricao, h.pagamento)).sort((a, b) => a - b);
  if (prazos.length < AMOSTRA_MINIMA || !teste.length) return { n: teste.length, maeDias: null };
  const p50 = quantil(prazos, 0.5);
  const erros = teste.map((h) => Math.abs(dias(h.inscricao, h.pagamento) - p50));
  return { n: teste.length, maeDias: Math.round(erros.reduce((s, e) => s + e, 0) / erros.length) };
}

// ───────── Precificação VPL ─────────

export interface CurvaJuros { fonte: string; data: string; pontos: Array<{ anos: number; taxaAa: number }>; } // ETTJ ANBIMA, % a.a.

export function taxaNaCurva(c: CurvaJuros, anos: number): number {
  const p = [...c.pontos].sort((a, b) => a.anos - b.anos);
  if (anos <= p[0].anos) return p[0].taxaAa;
  if (anos >= p[p.length - 1].anos) return p[p.length - 1].taxaAa;
  for (let i = 1; i < p.length; i++) {
    if (anos <= p[i].anos) {
      const w = (anos - p[i - 1].anos) / (p[i].anos - p[i - 1].anos);
      return p[i - 1].taxaAa + w * (p[i].taxaAa - p[i - 1].taxaAa);
    }
  }
  return p[p.length - 1].taxaAa;
}

/**
 * VPL da cessão: valor de face descontado pela curva em cada data simulada (P10/P50/P90),
 * com deságio do tenant + prêmio pelo flag de risco. Fórmula exibida na UI:
 *   VPL(d) = Face / (1 + (taxa(t)+prêmio)/100)^t, t = anos até d;  Proposta = VPL(P50) × (1 − deságio)
 */
export function precificarCessao(
  faceCentavos: number,
  datas: { p10: string; p50: string; p90: string },
  hoje: string,
  curva: CurvaJuros,
  params: { desagioPct: number; premioRiscoPct: number },
) {
  const vpl = (d: string) => {
    const t = Math.max(0, dias(hoje, d)) / 365.25;
    const taxa = taxaNaCurva(curva, t) + params.premioRiscoPct;
    return Math.round(faceCentavos / Math.pow(1 + taxa / 100, t));
  };
  const faixa = { otimista: vpl(datas.p10), central: vpl(datas.p50), conservador: vpl(datas.p90) };
  return {
    faixa,
    propostaCentavos: Math.round(faixa.central * (1 - params.desagioPct / 100)),
    formula: 'VPL(d) = Face / (1 + (taxa_curva(t) + prêmio)/100)^t; Proposta = VPL(P50) × (1 − deságio)',
    curva: { fonte: curva.fonte, data: curva.data },
    status: 'RASCUNHO' as const, // vira WorkItem (HITL); nunca enviada direto
  };
}

/** Estatística agregada por vara/classe/assunto — nunca por pessoa. */
export function estatisticaAgregada(
  processos: Array<{ vara: string; classe: string; assunto: string; duracaoDias: number; procedente?: boolean }>,
  filtro: { vara?: string; classe?: string; assunto?: string },
  dataBase: string,
) {
  const sel = processos.filter((p) => (!filtro.vara || p.vara === filtro.vara) && (!filtro.classe || p.classe === filtro.classe) && (!filtro.assunto || p.assunto === filtro.assunto));
  if (sel.length < AMOSTRA_MINIMA) return { status: 'DADOS_INSUFICIENTES' as const, n: sel.length, dataBase, minimo: AMOSTRA_MINIMA, aviso: AVISO_JURIMETRIA };
  const dur = sel.map((p) => p.duracaoDias).sort((a, b) => a - b);
  const comDecisao = sel.filter((p) => p.procedente !== undefined);
  return {
    status: 'OK' as const, n: sel.length, dataBase, aviso: AVISO_JURIMETRIA,
    duracaoDias: { p10: Math.round(quantil(dur, 0.1)), p50: Math.round(quantil(dur, 0.5)), p90: Math.round(quantil(dur, 0.9)) },
    taxaProcedencia: comDecisao.length >= AMOSTRA_MINIMA ? comDecisao.filter((p) => p.procedente).length / comDecisao.length : null,
  };
}
