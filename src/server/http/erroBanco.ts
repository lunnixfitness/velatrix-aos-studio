/**
 * P-BE2 · Fim do mock silencioso.
 *
 * Fora de DEMO_MODE, nenhum repositório pode trocar um erro de banco por dado fictício.
 * - `exigirDemoOuFalhar(err, ctx)`: chamado no topo de todo `catch` de repositório.
 *   Em DEMO_MODE apenas registra e devolve o controle (fallback continua valendo).
 *   Fora de demo relança: erro de infraestrutura de banco vira BancoIndisponivelError (→ 503),
 *   qualquer outro erro sobe como está (→ errorHandler central).
 * - `semMockForaDemo(mock, vazio)`: para retornos pós-try que entregavam semente quando a
 *   consulta voltava vazia.
 */
import { IS_DEMO_MODE } from '../../lib/demoMode.ts';

export class BancoIndisponivelError extends Error {
  readonly status = 503;
  readonly codigo = 'BANCO_INDISPONIVEL';
  constructor(contexto: string, causa?: unknown) {
    super(`Banco indisponível em ${contexto}`);
    this.name = 'BancoIndisponivelError';
    (this as any).cause = causa;
  }
}

// Códigos Prisma de conectividade/infra (P1xxx) + timeout de pool (P2024) + transação (P2028).
const CODIGOS_PRISMA_INFRA = new Set(['P1000', 'P1001', 'P1002', 'P1003', 'P1008', 'P1010', 'P1011', 'P1017', 'P2024', 'P2028']);
const NOMES_PRISMA_INFRA = new Set([
  'PrismaClientInitializationError',
  'PrismaClientRustPanicError',
  'PrismaClientUnknownRequestError',
]);
const CODIGOS_REDE = new Set(['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', '57P01', '57P03', '53300']);

export function isErroDeBanco(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: unknown; name?: unknown; errorCode?: unknown };
  const code = typeof e.code === 'string' ? e.code : typeof e.errorCode === 'string' ? e.errorCode : '';
  if (err instanceof BancoIndisponivelError) return true;
  if (CODIGOS_PRISMA_INFRA.has(code) || CODIGOS_REDE.has(code)) return true;
  return typeof e.name === 'string' && NOMES_PRISMA_INFRA.has(e.name);
}

export function exigirDemoOuFalhar(err: unknown, contexto: string): void {
  if (IS_DEMO_MODE) {
    console.warn(`[${contexto}] DEMO_MODE: usando dados de demonstração após erro:`, (err as any)?.message ?? err);
    return;
  }
  if (isErroDeBanco(err)) throw new BancoIndisponivelError(contexto, err);
  throw err;
}

/** Para catch de rotas: responde 503 BANCO_INDISPONIVEL e retorna true se o erro for de banco. */
export function responderErroBanco(
  res: { headersSent: boolean; setHeader(n: string, v: string): unknown; status(c: number): { json(b: unknown): unknown } },
  err: unknown,
): boolean {
  if (!isErroDeBanco(err)) return false;
  console.error('[BANCO_INDISPONIVEL]', (err as any)?.message, (err as any)?.cause?.message ?? '');
  if (!res.headersSent) {
    res.setHeader('Retry-After', '5');
    res.status(503).json({ erro: 'BANCO_INDISPONIVEL' });
  }
  return true;
}

/**
 * Express 4 não encaminha rejeições de handlers async ao errorHandler: sem isto, um
 * BancoIndisponivelError lançado fora de try/catch vira unhandledRejection e derruba o processo.
 * Envolve get/post/put/patch/delete/all/use da instância para repassar a rejeição a next(err).
 */
export function encaminharErrosAsync(app: any): void {
  for (const metodo of ['get', 'post', 'put', 'patch', 'delete', 'all', 'use'] as const) {
    const original = app[metodo].bind(app);
    app[metodo] = (...args: any[]) => {
      // app.get('setting') (1 arg string) é leitura de configuração, não rota.
      if (metodo === 'get' && args.length === 1 && typeof args[0] === 'string') return original(...args);
      return original(...args.map((h) => (ehHandlerSimples(h) ? envolver(h) : h)));
    };
  }
}

// Não envolve error handlers (aridade 4) nem sub-apps/routers (connect/express expõem .handle/.stack).
function ehHandlerSimples(h: unknown): h is (...a: any[]) => unknown {
  return typeof h === 'function' && h.length < 4 && !('handle' in h) && !('stack' in h);
}

function envolver(handler: (...a: any[]) => unknown) {
  const wrapped = function (this: unknown, req: any, res: any, next: (e?: unknown) => void) {
    try {
      const r = handler.call(this, req, res, next);
      if (r && typeof (r as Promise<unknown>).catch === 'function') (r as Promise<unknown>).catch(next);
      return r;
    } catch (e) {
      next(e);
    }
  };
  return wrapped;
}

export function semMockForaDemo<T>(mock: T, vazio: T): T {
  return IS_DEMO_MODE ? mock : vazio;
}
