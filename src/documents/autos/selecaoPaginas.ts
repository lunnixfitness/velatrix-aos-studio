/**
 * VELATRIX AOS · Leitura de Autos (P26b) — quais páginas de cada peça vão para a IA.
 *
 * Peça pequena: vai inteira. Peça grande (ex.: laudo de 120 páginas): vão a 1ª página
 * (título, partes), as 2 últimas (dispositivo, assinatura) e as de maior score BM25 para
 * a consulta típica do tipo de peça, até o teto de páginas/caracteres da rota
 * /api/autos/extrair. Menos tokens, mesma citação de página.
 *
 * Puro: o ranqueador é injetado (no painel, IndiceBm25 dos blocos da peça).
 */
import type { Bloco, Peca, TipoPeca } from './autosCore';

export interface OpcoesSelecao {
  maxPaginas: number;
  maxChars: number;
  maxCharsPagina: number;
}

/** Espelha LIMITES de src/server/autos/servicoAutos.ts, com folga. */
export const SELECAO_PADRAO: OpcoesSelecao = { maxPaginas: 30, maxChars: 240_000, maxCharsPagina: 15_000 };

export const CONSULTA_POR_TIPO: Partial<Record<TipoPeca, string>> = {
  peticao_inicial: 'autor autora réu ré valor causa pedido requer condenação danos juros correção monetária tutela',
  peticao: 'requer pedido valor prazo juntada manifestação',
  contestacao: 'preliminar prescrição decadência improcedência impugna valor pedido',
  replica: 'impugna contestação reitera pedido valor',
  decisao: 'defiro indefiro tutela urgência prazo multa intime',
  despacho: 'intime cite prazo dias manifeste',
  sentenca: 'julgo procedente improcedente condeno honorários custas valor juros correção prazo',
  acordao: 'acordam provimento recurso reforma mantida honorários valor',
  recurso: 'recurso reforma pedido valor prazo tempestivo',
  laudo: 'quesito resposta valor apurado conclusão cálculo diferença perito',
  certidao: 'certifico prazo decorreu intimação trânsito julgado data',
  documento: 'valor total data vencimento nota fiscal contrato',
};
const CONSULTA_GERAL = 'valor data prazo pedido autor réu condenação decisão';

export interface PaginaSelecionada {
  n: number;
  texto: string;
}

export function selecionarPaginas(
  peca: Pick<Peca, 'id' | 'tipo' | 'paginaInicial' | 'paginaFinal'>,
  textos: Map<number, string>,
  rankear: (consulta: string) => { bloco: Pick<Bloco, 'paginaInicial' | 'paginaFinal'>; score: number }[],
  op: OpcoesSelecao = SELECAO_PADRAO,
): { paginas: PaginaSelecionada[]; completa: boolean } {
  const candidatas: PaginaSelecionada[] = [];
  for (let n = peca.paginaInicial; n <= peca.paginaFinal; n++) {
    const t = (textos.get(n) ?? '').trim();
    if (t.replace(/\s/g, '').length >= 5) candidatas.push({ n, texto: t.slice(0, op.maxCharsPagina) });
  }
  const total = candidatas.reduce((s, p) => s + p.texto.length, 0);
  if (candidatas.length <= op.maxPaginas && total <= op.maxChars) return { paginas: candidatas, completa: true };

  const porN = new Map(candidatas.map((p) => [p.n, p]));
  const score = new Map<number, number>();
  for (const r of rankear(CONSULTA_POR_TIPO[peca.tipo as TipoPeca] ?? CONSULTA_GERAL)) {
    for (let n = r.bloco.paginaInicial; n <= r.bloco.paginaFinal; n++) {
      if (porN.has(n)) score.set(n, (score.get(n) ?? 0) + r.score);
    }
  }
  const obrigatorias = [candidatas[0]?.n, candidatas[candidatas.length - 2]?.n, candidatas[candidatas.length - 1]?.n];
  const ordem = [
    ...obrigatorias,
    ...[...score.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([n]) => n),
  ].filter((n): n is number => n !== undefined);

  const escolhidas = new Map<number, PaginaSelecionada>();
  let chars = 0;
  for (const n of ordem) {
    if (escolhidas.size >= op.maxPaginas) break;
    const p = porN.get(n);
    if (!p || escolhidas.has(n) || chars + p.texto.length > op.maxChars) continue;
    escolhidas.set(n, p);
    chars += p.texto.length;
  }
  return { paginas: [...escolhidas.values()].sort((a, b) => a.n - b.n), completa: false };
}
