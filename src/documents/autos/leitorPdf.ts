/**
 * VELATRIX AOS · Leitura de Autos (P25) — leitor de PDF incremental (navegador).
 *
 * Escala por desenho: o trabalho pesado (parse do PDF) roda no worker do
 * pdf.js dentro do navegador de cada advogado — 2 mil usuários = 2 mil CPUs,
 * sem carga no servidor. A thread da UI só monta strings e cede a vez a cada
 * lote, então a tela não trava nem com 500+ páginas.
 * O worker é servido pelo próprio app (sem CDN externo): LGPD e disponibilidade.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { sha256Hex } from '../../shared/crypto/hash';
import { normalizarTextoPagina, MIN_CHARS_TEXTO, type PaginaTexto } from './autosCore';

export const LIMITE_BYTES = 200 * 1024 * 1024; // 200 MB
export const LIMITE_PAGINAS = 5000;

export interface ProgressoLeitura {
  etapa: 'abrindo' | 'lendo' | 'concluido';
  pagina: number;
  total: number;
}

export interface ResultadoLeitura {
  doc: PDFDocumentProxy;
  paginas: PaginaTexto[];
  hashArquivo: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  ms: number;
}

/**
 * Libera o documento e o worker. A API mudou entre versões do pdf.js
 * (na 6.x o PDFDocumentProxy não expõe mais destroy(); fica no loadingTask).
 * Nunca lança: liberar memória não pode derrubar a leitura.
 */
export async function liberarPdf(doc: unknown): Promise<void> {
  const d = doc as { destroy?: () => unknown; loadingTask?: { destroy?: () => unknown }; cleanup?: () => unknown } | null | undefined;
  try {
    if (typeof d?.destroy === 'function') await d.destroy();
    else if (typeof d?.loadingTask?.destroy === 'function') await d.loadingTask.destroy();
    else if (typeof d?.cleanup === 'function') await d.cleanup();
  } catch { /* já liberado */ }
}

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Worker do pdf.js: tenta o arquivo servido pelo próprio app; se o servidor
 * não entregar (ex.: preview do AI Studio bloqueia /node_modules), usa a CDN
 * na MESMA versão da biblioteca. Em produção (build do Vite) o worker local
 * é empacotado e a CDN não é usada.
 */
async function carregarPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist');
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        let src = '';
        try {
          const w = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
          const url = w.default as string;
          const ok = await fetch(url, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
          if (ok) src = url;
        } catch { /* cai para a CDN */ }
        pdfjs.GlobalWorkerOptions.workerSrc = src || `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      }
      return pdfjs;
    })().catch((e) => { pdfjsPromise = null; throw e; });
  }
  return pdfjsPromise;
}

const cederVez = () => new Promise<void>((r) => setTimeout(r, 0));

interface ItemTexto { str?: string; hasEOL?: boolean }

export async function lerPdf(
  arquivo: File,
  { onProgresso, sinal, paralelo = 4 }: { onProgresso?: (p: ProgressoLeitura) => void; sinal?: AbortSignal; paralelo?: number } = {},
): Promise<ResultadoLeitura> {
  const t0 = performance.now();
  if (arquivo.size > LIMITE_BYTES) throw new Error(`Arquivo acima de ${LIMITE_BYTES / 1024 / 1024} MB.`);
  onProgresso?.({ etapa: 'abrindo', pagina: 0, total: 0 });

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const hashArquivo = await sha256Hex(bytes);
  const pdfjs = await carregarPdfjs();
  // pdf.js transfere o buffer para o worker; passamos uma cópia para manter o hash estável.
  const doc = await pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false } as any).promise;
  if (doc.numPages > LIMITE_PAGINAS) {
    await liberarPdf(doc);
    throw new Error(`Documento com ${doc.numPages} páginas excede o limite de ${LIMITE_PAGINAS}.`);
  }

  const total = doc.numPages;
  const paginas: PaginaTexto[] = new Array(total);
  let feitas = 0;

  const lerPagina = async (n: number) => {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    let texto = '';
    for (const it of tc.items as ItemTexto[]) {
      if (typeof it.str !== 'string') continue;
      texto += it.str + (it.hasEOL ? '\n' : ' ');
    }
    // Pouco ou nenhum texto: verifica se há imagem (página digitalizada → OCR na P26).
    let temImagem = false;
    if (normalizarTextoPagina(texto).length < MIN_CHARS_TEXTO) {
      const ops = await page.getOperatorList();
      const O = pdfjs.OPS as Record<string, number>;
      const img = new Set([O.paintImageXObject, O.paintInlineImageXObject, O.paintImageMaskXObject, O.paintImageXObjectRepeat].filter((x) => x !== undefined));
      temImagem = ops.fnArray.some((f: number) => img.has(f));
    }
    page.cleanup();
    paginas[n - 1] = { n, texto, temImagem, hash: await sha256Hex(normalizarTextoPagina(texto)) };
    feitas++;
  };

  for (let ini = 1; ini <= total; ini += paralelo) {
    if (sinal?.aborted) {
      await liberarPdf(doc);
      throw new DOMException('Leitura cancelada', 'AbortError');
    }
    const lote: Promise<void>[] = [];
    for (let n = ini; n < ini + paralelo && n <= total; n++) lote.push(lerPagina(n));
    await Promise.all(lote);
    onProgresso?.({ etapa: 'lendo', pagina: feitas, total });
    await cederVez();
  }

  onProgresso?.({ etapa: 'concluido', pagina: total, total });
  return { doc, paginas, hashArquivo, nomeArquivo: arquivo.name, tamanhoBytes: arquivo.size, ms: Math.round(performance.now() - t0) };
}

/** Renderiza uma página num canvas, ajustada à largura disponível. */
export async function renderizarPagina(doc: PDFDocumentProxy, n: number, canvas: HTMLCanvasElement, larguraCss: number) {
  const page = await doc.getPage(n);
  const base = page.getViewport({ scale: 1 });
  const escala = larguraCss / base.width;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vp = page.getViewport({ scale: escala * dpr });
  canvas.width = Math.floor(vp.width);
  canvas.height = Math.floor(vp.height);
  canvas.style.width = `${Math.floor(vp.width / dpr)}px`;
  canvas.style.height = `${Math.floor(vp.height / dpr)}px`;
  const tarefa = page.render({ canvas, viewport: vp });
  await tarefa.promise;
  page.cleanup();
  return () => tarefa.cancel();
}
