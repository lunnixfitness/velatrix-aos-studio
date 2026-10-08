/**
 * VELATRIX AOS · Leitura de Autos (P25) — núcleo puro.
 *
 * Triagem de páginas, separação em peças processuais e blocos com âncora de
 * página. Sem React, sem IO: roda igual no navegador, no servidor e nos testes.
 * Toda informação carrega o número da página de origem — é o que permite
 * citar "p. 137" e validar citações no Guardrail.
 */

export interface PaginaTexto {
  n: number; // 1-based
  texto: string;
  hash: string; // SHA-256 do texto normalizado da página
  /** Página tem imagem (pdf.js operator list). Sem texto + com imagem = escaneada. */
  temImagem?: boolean;
}

export type TipoPagina = 'texto' | 'escaneada' | 'branco' | 'duplicada';

export interface TriagemPagina {
  n: number;
  tipo: TipoPagina;
  chars: number;
  duplicadaDe?: number;
}

/** Abaixo disso a página não tem camada de texto útil → precisa de OCR. */
export const MIN_CHARS_TEXTO = 40;
export const MIN_CHARS_CONTEUDO = 5;

export const normalizarTextoPagina = (t: string) => t.replace(/\s+/g, ' ').trim();

export function triarPaginas(paginas: PaginaTexto[]): TriagemPagina[] {
  const vistos = new Map<string, number>();
  return paginas.map((p) => {
    const chars = normalizarTextoPagina(p.texto).replace(/\s/g, '').length;
    if (chars < MIN_CHARS_CONTEUDO) return { n: p.n, tipo: p.temImagem ? 'escaneada' : 'branco', chars };
    if (chars < MIN_CHARS_TEXTO) return { n: p.n, tipo: 'escaneada', chars };
    const anterior = vistos.get(p.hash);
    if (anterior !== undefined) return { n: p.n, tipo: 'duplicada', chars, duplicadaDe: anterior };
    vistos.set(p.hash, p.n);
    return { n: p.n, tipo: 'texto', chars };
  });
}

// ─────────────────────── cabeçalhos e rodapés ───────────────────────

const assinaturaLinha = (l: string) => l.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Linhas que se repetem em ≥ 30% das páginas (cabeçalho do tribunal, rodapé
 * "Assinado eletronicamente…", "Num. … - Pág. …") são ruído para classificar e
 * pesquisar. Números viram '#' para agrupar "Pág. 1" e "Pág. 2".
 */
const ZONA_TOPO = 3;
const ZONA_BASE = 4;

/** Índices das linhas não vazias que ficam na zona de cabeçalho/rodapé da página. */
function linhasDeBorda(linhas: string[]): number[] {
  const cheias = linhas.map((l, i) => (l.trim() ? i : -1)).filter((i) => i >= 0);
  return [...new Set([...cheias.slice(0, ZONA_TOPO), ...cheias.slice(-ZONA_BASE)])];
}

/**
 * Linhas de cabeçalho/rodapé (3 primeiras e 4 últimas linhas com texto) que se
 * repetem em ≥ 30% das páginas: tribunal, "Assinado eletronicamente…",
 * "Num. … - Pág. …". Só a zona de borda é considerada — conteúdo repetido no
 * corpo (ex.: páginas de DARF com o mesmo layout) continua pesquisável.
 */
export function linhasRepetidas(paginas: PaginaTexto[], limiar = 0.3): Set<string> {
  const freq = new Map<string, number>();
  for (const p of paginas) {
    const linhas = p.texto.split(/\r?\n/);
    const vistas = new Set(linhasDeBorda(linhas).map((i) => assinaturaLinha(linhas[i])).filter((l) => l.length > 8));
    for (const l of vistas) freq.set(l, (freq.get(l) || 0) + 1);
  }
  const min = Math.max(3, Math.ceil(paginas.length * limiar));
  return new Set([...freq].filter(([, n]) => n >= min).map(([l]) => l));
}

export function limparPagina(texto: string, repetidas: Set<string>): string {
  const linhas = texto.split(/\r?\n/);
  const borda = new Set(linhasDeBorda(linhas));
  return linhas
    .filter((l, i) => {
      if (/^\s*Num\.\s*\d{5,}\s*-\s*P[áa]g\.\s*\d+\s*$/i.test(l) || /^\s*Assinado eletronicamente por:/i.test(l)) return false;
      return !(borda.has(i) && repetidas.has(assinaturaLinha(l)));
    })
    .join('\n');
}

/** Páginas sem cabeçalhos/rodapés repetidos (para classificar, blocos e índice). */
export function paginasLimpas(paginas: PaginaTexto[]): PaginaTexto[] {
  const rep = linhasRepetidas(paginas);
  return paginas.map((p) => ({ ...p, texto: limparPagina(p.texto, rep) }));
}

// ───────────────────────────── peças ─────────────────────────────

export type TipoPeca =
  | 'peticao_inicial' | 'peticao' | 'contestacao' | 'replica' | 'decisao' | 'despacho'
  | 'sentenca' | 'acordao' | 'recurso' | 'laudo' | 'procuracao' | 'certidao' | 'documento';

export const TIPO_PECA_LABEL: Record<TipoPeca, string> = {
  peticao_inicial: 'Petição inicial',
  peticao: 'Petição',
  contestacao: 'Contestação',
  replica: 'Réplica',
  decisao: 'Decisão',
  despacho: 'Despacho',
  sentenca: 'Sentença',
  acordao: 'Acórdão',
  recurso: 'Recurso',
  laudo: 'Laudo',
  procuracao: 'Procuração',
  certidao: 'Certidão',
  documento: 'Documento',
};

export interface Peca {
  id: string;
  tipo: TipoPeca;
  titulo: string;
  paginaInicial: number;
  paginaFinal: number;
  idPje?: string;
  assinadoPor?: string;
  assinadoEm?: string;
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Regras aplicadas ao TÍTULO da peça (topo da 1ª página, já sem cabeçalho repetido). */
const REGRAS_TITULO: [TipoPeca, RegExp][] = [
  ['peticao', /^(MANIFESTACAO|PETICAO(?! INICIAL)|REQUERIMENTO|MEMORIAIS|ALEGACOES FINAIS)\b/],
  ['certidao', /\bCERTIDAO\b/],
  ['recurso', /\bCONTRARRAZOES\b|\bAPELACAO\b|\bAGRAVO\b|\bEMBARGOS\b|\bRECURSO\b/],
  ['replica', /\bREPLICA\b|IMPUGNACAO A CONTESTACAO/],
  ['contestacao', /\bCONTESTACAO\b/],
  ['acordao', /\bACORDAO\b/],
  ['sentenca', /\bSENTENCA\b/],
  ['decisao', /\bDECISAO\b/],
  ['despacho', /\bDESPACHO\b/],
  ['laudo', /\bLAUDO\b/],
  ['procuracao', /\bPROCURACAO\b|\bSUBSTABELECIMENTO\b/],
  ['documento', /^\s*(DOCUMENTOS?|ANEXOS?|NOTAS? FISCAIS?|PLANILHAS?|COMPROVANTES?|EXTRATOS?)\b/],
  ['peticao', /\bEXCELENTISSIM[OA]\b|\bMERITISSIM[OA]\b|\bMANIFESTACAO\b|\bPETICAO\b|\bREQUERIMENTO\b|\bMEMORIAIS\b/],
];

/** Fallback no corpo, quando o título não resolve. Ordem importa. */
const REGRAS_CORPO: [TipoPeca, RegExp][] = [
  ['acordao', /\bACORDAM\b/],
  ['sentenca', /\bJULGO (IM)?PROCEDENTE|\bHOMOLOGO\b.*\bACORDO\b/],
  ['laudo', /\bLAUDO (PERICIAL|TECNICO|CONTABIL)\b|\bRESPOSTA AO QUESITO\b/],
  ['decisao', /\bDEFIRO\b|\bINDEFIRO\b|\bTUTELA (DE URGENCIA|ANTECIPADA)\b/],
  ['despacho', /\bINTIME-SE\b|\bCITE-SE\b|\bVISTA A PARTE\b/],
  ['certidao', /\bCERTIFICO\b/],
  ['peticao', /\bVEM,? (MUI )?RESPEITOSAMENTE\b|\bREQUER\b/],
];

/** Cabeçalhos que, no topo da página, indicam início de nova peça (autos sem marca PJe). */
const INICIO_PECA = /^(EXCELENTISSIM[OA]|MERITISSIM[OA]|SENTENCA|DECISAO|DESPACHO|ACORDAO|CERTIDAO|PROCURACAO|SUBSTABELECIMENTO|LAUDO (PERICIAL|TECNICO|CONTABIL)|CONTESTACAO|APELACAO|EMBARGOS|AGRAVO|TERMO DE AUDIENCIA)\b/;

const PJE_NUM = /Num\.\s*(\d{5,})\s*-\s*P[áa]g\.\s*(\d+)/i;
const PJE_ASSINATURA = /Assinado eletronicamente por:\s*([^\n\r-]{3,80}?)\s*-\s*(\d{2}\/\d{2}\/\d{4})/i;

export function classificarPeca(textoInicio: string): TipoPeca {
  const t = semAcento(textoInicio).toUpperCase();
  const linhas = t.split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const l1 = linhas[0] || '';
  const candidatos = [l1, l1.length < 30 && linhas[1] ? `${l1} ${linhas[1]}` : ''].filter(Boolean);
  for (const titulo of candidatos) for (const [tipo, re] of REGRAS_TITULO) if (re.test(titulo)) return tipo;
  const corpo = t.slice(0, 2500);
  for (const [tipo, re] of REGRAS_CORPO) if (re.test(corpo)) return tipo;
  return 'documento';
}

export function segmentarPecas(paginas: PaginaTexto[]): Peca[] {
  const rep = linhasRepetidas(paginas);
  const pecas: Peca[] = [];
  let atual: (Peca & { textoInicio: string }) | null = null;

  const fechar = () => {
    if (!atual) return;
    const { textoInicio, ...p } = atual;
    p.tipo = classificarPeca(textoInicio);
    pecas.push(p);
    atual = null;
  };

  for (const pg of paginas) {
    const texto = pg.texto || '';
    const pje = texto.match(PJE_NUM);
    const idPje = pje?.[1];
    const pagPje = pje ? Number(pje[2]) : undefined;
    const limpo = limparPagina(texto, rep);
    const topo = semAcento(normalizarTextoPagina(limpo).slice(0, 220)).toUpperCase();

    const novaPorPje = !!idPje && (!atual || atual.idPje !== idPje || pagPje === 1);
    const novaPorCabecalho = !idPje && INICIO_PECA.test(topo);
    if (!atual || novaPorPje || novaPorCabecalho) {
      fechar();
      atual = {
        id: `PC-${String(pecas.length + 1).padStart(3, '0')}`,
        tipo: 'documento',
        titulo: '',
        paginaInicial: pg.n,
        paginaFinal: pg.n,
        idPje,
        textoInicio: '',
      };
    }
    const a = atual as Peca & { textoInicio: string };
    a.paginaFinal = pg.n;
    if (a.textoInicio.length < 2500 && limpo.trim()) a.textoInicio += `\n${limpo}`;
    const ass = texto.match(PJE_ASSINATURA);
    if (ass && !a.assinadoPor) {
      a.assinadoPor = ass[1].trim();
      a.assinadoEm = ass[2];
    }
  }
  fechar();

  // A primeira "petição" dos autos é a inicial.
  const primeira = pecas.find((p) => p.tipo === 'peticao');
  if (primeira && !pecas.some((p) => p.tipo === 'peticao_inicial')) primeira.tipo = 'peticao_inicial';

  for (const p of pecas) {
    const pags = p.paginaInicial === p.paginaFinal ? `p. ${p.paginaInicial}` : `pp. ${p.paginaInicial}–${p.paginaFinal}`;
    p.titulo = `${TIPO_PECA_LABEL[p.tipo]} · ${pags}${p.idPje ? ` · Id ${p.idPje}` : ''}`;
  }
  return pecas;
}

// ───────────────────────────── blocos ─────────────────────────────

export interface Bloco {
  id: string;
  pecaId: string;
  paginaInicial: number;
  paginaFinal: number;
  texto: string;
  tokensAprox: number;
}

export const tokensAprox = (s: string) => Math.ceil(s.length / 4);

/** Blocos de ~alvoTokens, sem atravessar peças, cada um com seu intervalo de páginas. */
export function gerarBlocos(paginas: PaginaTexto[], pecas: Peca[], alvoTokens = 800): Bloco[] {
  const porNumero = new Map(paginas.map((p) => [p.n, p]));
  const blocos: Bloco[] = [];
  for (const peca of pecas) {
    let buf: string[] = [];
    let ini = peca.paginaInicial;
    let fim = peca.paginaInicial;
    let tam = 0;
    const emitir = () => {
      const texto = buf.join('\n').trim();
      if (texto) {
        blocos.push({ id: `${peca.id}-B${String(blocos.filter((b) => b.pecaId === peca.id).length + 1).padStart(2, '0')}`, pecaId: peca.id, paginaInicial: ini, paginaFinal: fim, texto, tokensAprox: tokensAprox(texto) });
      }
      buf = [];
      tam = 0;
    };
    for (let n = peca.paginaInicial; n <= peca.paginaFinal; n++) {
      const pg = porNumero.get(n);
      if (!pg) continue;
      const paragrafos = pg.texto.split(/\n\s*\n|(?<=[.;:])\s*\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
      for (const par of paragrafos) {
        const t = tokensAprox(par);
        if (tam > 0 && tam + t > alvoTokens) {
          emitir();
        }
        if (tam === 0) ini = n;
        buf.push(par);
        tam += t;
        fim = n;
      }
    }
    emitir();
  }
  return blocos;
}
