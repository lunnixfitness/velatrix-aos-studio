/**
 * VELATRIX AOS · Leitura de Autos (P28) — OCR local no navegador (Tesseract, zero token).
 *
 * A imagem da página NUNCA sai do computador do advogado. O navegador só baixa, uma vez,
 * os arquivos estáticos do Tesseract (worker, núcleo WASM e o modelo "por") — nenhum dado
 * dos autos vai junto. Escala como o resto da leitura: 2.000 advogados = 2.000 CPUs.
 *
 * Carregamento sob demanda (import dinâmico): quem não tem página escaneada não baixa nada.
 * Se o pacote não estiver disponível, lança OcrLocalIndisponivel e o painel usa o Gemini.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';

export class OcrLocalIndisponivel extends Error {}

interface WorkerTesseract {
  recognize(img: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number } }>;
  terminate(): Promise<unknown>;
}

/** 200 dpi: acima disso o Tesseract ganha pouco e o navegador gasta muito mais CPU/RAM. */
const DPI_OCR = 200;
const LARGURA_MAX = 2000;

let workers: Promise<WorkerTesseract>[] = [];
let proximo = 0;

/** Quantos workers: metade dos núcleos, entre 1 e 2 (o OCR é pesado; a tela não pode travar). */
const tamanhoPool = () => Math.max(1, Math.min(2, Math.floor((navigator.hardwareConcurrency || 2) / 2)));

async function criarWorker(onProgresso?: (p: number) => void): Promise<WorkerTesseract> {
  let mod: { createWorker: (lang: string, oem?: number, opts?: Record<string, unknown>) => Promise<WorkerTesseract> };
  try {
    mod = (await import('tesseract.js')) as unknown as typeof mod;
  } catch (e) {
    throw new OcrLocalIndisponivel(`tesseract.js não carregou: ${(e as Error).message}`);
  }
  try {
    return await mod.createWorker('por', 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'loading language traineddata' && typeof m.progress === 'number') onProgresso?.(m.progress);
      },
    });
  } catch (e) {
    throw new OcrLocalIndisponivel(`modelo "por" do Tesseract não carregou: ${(e as Error).message}`);
  }
}

function obterWorker(onProgresso?: (p: number) => void): Promise<WorkerTesseract> {
  if (!workers.length) {
    workers = Array.from({ length: tamanhoPool() }, () => criarWorker(onProgresso));
    // Falhou ao criar: limpa para a próxima tentativa não reaproveitar a Promise rejeitada.
    workers.forEach((w) => w.catch(() => { workers = []; }));
  }
  return workers[proximo++ % workers.length];
}

/** Página do PDF → canvas em tons de cinza a ~200 dpi (o Tesseract binariza melhor assim). */
async function renderizar(doc: PDFDocumentProxy, n: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(n);
  try {
    const base = page.getViewport({ scale: 1 });
    const escala = Math.min(DPI_OCR / 72, LARGURA_MAX / base.width);
    const vp = page.getViewport({ scale: escala });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    await page.render({ canvas, viewport: vp }).promise;
    if (ctx) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const y = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
        d[i] = d[i + 1] = d[i + 2] = y;
      }
      ctx.putImageData(img, 0, 0);
    }
    return canvas;
  } finally {
    page.cleanup();
  }
}

export interface ResultadoOcrLocal {
  texto: string;
  /** Confiança média do Tesseract (0–100). */
  confianca: number;
  ms: number;
}

export async function ocrLocal(doc: PDFDocumentProxy, n: number, onProgressoModelo?: (p: number) => void): Promise<ResultadoOcrLocal> {
  const t0 = performance.now();
  const worker = await obterWorker(onProgressoModelo);
  const canvas = await renderizar(doc, n);
  try {
    const { data } = await worker.recognize(canvas);
    return { texto: data.text ?? '', confianca: Number(data.confidence) || 0, ms: Math.round(performance.now() - t0) };
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Libera os workers (WASM + modelo ≈ dezenas de MB) quando o painel fecha. */
export async function encerrarOcrLocal(): Promise<void> {
  const ws = workers;
  workers = [];
  proximo = 0;
  await Promise.all(ws.map((w) => w.then((x) => x.terminate()).catch(() => undefined)));
}
