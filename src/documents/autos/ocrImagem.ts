/**
 * VELATRIX AOS · Leitura de Autos (P26b) — página escaneada → imagem para OCR (navegador).
 *
 * ~150 dpi em tons de página A4 é o ponto em que o OCR do Gemini lê carimbos e números
 * sem inflar o upload. A imagem é reduzida até caber no teto da rota /api/autos/ocr
 * (base64 ≤ 850 KB, abaixo do limite de 1 MB do express.json). O canvas é liberado no fim.
 */
import type { PDFDocumentProxy } from 'pdfjs-dist';

export const BASE64_MAX = 850_000;

export async function paginaParaImagem(doc: PDFDocumentProxy, n: number, maxBase64 = BASE64_MAX): Promise<{ mime: 'image/jpeg'; base64: string }> {
  const page = await doc.getPage(n);
  const canvas = document.createElement('canvas');
  try {
    const base = page.getViewport({ scale: 1 });
    let escala = Math.min(150 / 72, 1700 / base.width);
    for (let tentativa = 0; tentativa < 3; tentativa++) {
      const vp = page.getViewport({ scale: escala });
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext('2d');
      if (ctx) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      await page.render({ canvas, viewport: vp }).promise;
      for (const q of [0.82, 0.68, 0.55, 0.42]) {
        const url = canvas.toDataURL('image/jpeg', q);
        const base64 = url.slice(url.indexOf(',') + 1);
        if (base64.length <= maxBase64) return { mime: 'image/jpeg', base64 };
      }
      escala *= 0.7; // ainda grande: reduz a resolução e tenta de novo
    }
    throw new Error(`página ${n}: imagem não coube no limite de envio para OCR`);
  } finally {
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
  }
}
