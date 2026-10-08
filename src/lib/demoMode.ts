/**
 * Velatrix AOS · Modo Demonstração
 *
 * Enquanto o Velatrix roda sem fontes de dados reais conectadas, vários painéis
 * exibem valores ilustrativos. Este módulo é a fonte única de verdade para:
 *  - o aviso global de demonstração (ConsoleShell);
 *  - impedir que laudos aleguem "100% dados reais" em ambiente de demo;
 *  - marca d'água "DEMONSTRAÇÃO · SEM VALIDADE" em todo PDF gerado com jsPDF;
 *  - geração de IDs/protocolos com CSPRNG (substitui Math.random).
 *
 * Desligar SOMENTE quando os dados vierem de fontes reais:
 *   VITE_DEMO_MODE=false   (front, build-time)
 *   DEMO_MODE=false        (servidor, runtime)
 */

function readFlag(): boolean {
  try {
    const envObj = (globalThis as any)?.process?.env;
    if (envObj) {
      const dbUrlKey = ['DATABASE', 'URL'].join('_');
      const rawDb = envObj[dbUrlKey];
      // Produção ou desenvolvimento sem banco configurado: obrigatoriamente IS_DEMO_MODE=true
      if (!rawDb || !String(rawDb).trim()) {
        return true;
      }
    }
  } catch {
    /* sem process */
  }
  try {
    const viteVal = (import.meta as any)?.env?.VITE_DEMO_MODE;
    if (viteVal !== undefined) return String(viteVal).toLowerCase() !== 'false';
  } catch {
    /* fora do Vite */
  }
  try {
    const nodeVal = (globalThis as any)?.process?.env?.DEMO_MODE;
    if (nodeVal !== undefined) return String(nodeVal).toLowerCase() !== 'false';
  } catch {
    /* sem process */
  }
  return true; // seguro por padrão: sem configuração explícita, é demonstração
}

export const IS_DEMO_MODE: boolean = readFlag();

export const DEMO_LABEL = 'Ambiente de demonstração';
export const DEMO_NOTICE =
  'Valores ilustrativos. Laudos e relatórios gerados aqui não têm validade técnica ou legal.';
export const DEMO_WATERMARK = 'DEMONSTRAÇÃO · SEM VALIDADE';

// ---------------------------------------------------------------------------
// CSPRNG helpers (Web Crypto — disponível no browser e no Node >= 19)
// ---------------------------------------------------------------------------

function randomBytes(n: number): Uint8Array {
  const arr = new Uint8Array(n);
  globalThis.crypto.getRandomValues(arr);
  return arr;
}

/** ID hexadecimal seguro. secureId('vec') → "vec_9f2c…" */
export function secureId(prefix = '', bytes = 8): string {
  const hex = Array.from(randomBytes(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
  return prefix ? prefix + '_' + hex : hex;
}

/** Inteiro uniforme em [min, max] sem viés de módulo. */
export function secureInt(min: number, max: number): number {
  const lo = Math.ceil(Math.min(min, max));
  const hi = Math.floor(Math.max(min, max));
  const range = hi - lo + 1;
  if (range <= 1) return lo;
  const limit = Math.floor(0x100000000 / range) * range;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    globalThis.crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return lo + (x % range);
}

// ---------------------------------------------------------------------------
// Marca d'água em PDFs (jsPDF) — aplicada no save()/output() de qualquer doc
// ---------------------------------------------------------------------------

let pdfPatched = false;

export function installPdfDemoWatermark(jsPDFCtor: any, GStateCtor?: any): void {
  if (!IS_DEMO_MODE || pdfPatched || !jsPDFCtor?.API) return;
  pdfPatched = true;
  const api = jsPDFCtor.API;
  const origSave = api.save;
  const origOutput = api.output;

  const stamp = (doc: any) => {
    if (!doc || doc.__vxDemoStamped) return;
    doc.__vxDemoStamped = true;
    try {
      const pages: number = doc.getNumberOfPages?.() ?? doc.internal?.getNumberOfPages?.() ?? 1;
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        const w = doc.internal.pageSize.getWidth();
        const h = doc.internal.pageSize.getHeight();
        doc.saveGraphicsState?.();
        if (GStateCtor && doc.setGState) doc.setGState(new GStateCtor({ opacity: 0.12 }));
        doc.setTextColor(180, 50, 31);
        doc.setFontSize(Math.max(28, Math.min(w, h) / 9));
        doc.text(DEMO_WATERMARK, w / 2, h / 2, { angle: 35, align: 'center', baseline: 'middle' });
        doc.restoreGraphicsState?.();
        doc.setFontSize(7);
        doc.setTextColor(180, 50, 31);
        doc.text(DEMO_LABEL + ' — ' + DEMO_NOTICE, w / 2, h - 6, { align: 'center' });
      }
    } catch (err) {
      console.warn('[DEMO] Falha ao aplicar marca d\'água no PDF:', err);
    }
  };

  api.save = function (...args: any[]) {
    stamp(this);
    return origSave.apply(this, args);
  };
  api.output = function (...args: any[]) {
    stamp(this);
    return origOutput.apply(this, args);
  };
}

/** Carrega jsPDF sob demanda e instala a marca d'água (não pesa no chunk inicial). */
export function ensurePdfDemoWatermark(): void {
  if (!IS_DEMO_MODE || pdfPatched) return;
  import('jspdf')
    .then((m: any) => installPdfDemoWatermark(m.jsPDF ?? m.default, m.GState))
    .catch((err) => console.warn('[DEMO] jsPDF indisponível para marca d\'água:', err));
}

// ---------------------------------------------------------------------------
// Integrações externas não conectadas (KYC, BaaS, gov)
// ---------------------------------------------------------------------------

export const SIMULATED_PREFIX = '[SIMULADO · integração não conectada] ';

export class IntegrationNotConfiguredError extends Error {
  readonly provider: string;
  constructor(provider: string) {
    super('Integração "' + provider + '" não está conectada. Resultados simulados só são permitidos em modo demonstração.');
    this.name = 'IntegrationNotConfiguredError';
    this.provider = provider;
  }
}

/**
 * Chamado no início de todo adapter que ainda não chama o provedor real.
 * Fora do modo demonstração, bloqueia em vez de devolver aprovação falsa
 * (ex.: KYC "VALIDADO" sem consultar o Serpro).
 */
export function assertSimulatedAllowed(provider: string): void {
  if (!IS_DEMO_MODE) throw new IntegrationNotConfiguredError(provider);
}
