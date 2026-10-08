import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { IS_DEMO_MODE } from './demoMode';

const isBrowser = typeof window !== 'undefined';
const DB_URL_KEY = ['DATABASE', 'URL'].join('_');
const rawDbUrl = (!isBrowser && typeof process !== 'undefined')
  ? String((process.env as any)?.[DB_URL_KEY] || '').trim()
  : '';

// Check if a real, valid database URL is configured
export const isPrismaActive = Boolean(
  !isBrowser &&
  rawDbUrl &&
  rawDbUrl !== '' &&
  !rawDbUrl.includes('localhost:5432/velatrix_aos') &&
  !rawDbUrl.includes('127.0.0.1:5432/velatrix_aos')
);

function createInMemoryPrismaProxy(): PrismaClient {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      if (prop === '$transaction') {
        return async (cb: any) => (typeof cb === 'function' ? cb(prisma) : cb);
      }
      if (prop === '$on') {
        return () => {};
      }
      return new Proxy({}, {
        get(_modelTarget, method: string) {
          return async (args: any) => {
            if (method.startsWith('findMany')) return [];
            if (method.startsWith('find') || method === 'delete') return null;
            if (method === 'count') return 0;
            if (method === 'upsert') return (args && (args.create || args.update)) || {};
            if (method === 'create' || method === 'update') return (args && args.data) || {};
            return null;
          };
        }
      });
    }
  };
  return new Proxy({}, handler) as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let prismaInstance: PrismaClient;

/**
 * P-BE2 · Fim do mock silencioso.
 * O Proxy em memória só existe em DEMO_MODE. Fora de demo, servidor sem DATABASE_URL
 * válido (ou com falha de inicialização do driver) é erro fatal de boot.
 */
function falhaFatalSemBanco(motivo: string, causa?: unknown): never {
  const erro = new Error(`[Prisma] ${motivo} — fora de DEMO_MODE o banco é obrigatório (configure DATABASE_URL ou DEMO_MODE=true).`);
  (erro as any).cause = causa;
  throw erro;
}

if (!isPrismaActive) {
  if (!isBrowser && !IS_DEMO_MODE) {
    falhaFatalSemBanco('DATABASE_URL ausente ou inválido');
  }
  // DEMO_MODE (ou bundle do browser): Proxy em memória, sem tentativas de conexão
  prismaInstance = globalForPrisma.prisma ?? createInMemoryPrismaProxy();
} else {
  try {
    // Pool dimensionado por instância: (instâncias × max) ≤ max_connections do Postgres (ou use PgBouncer).
    const pool = new pg.Pool({
      connectionString: rawDbUrl,
      max: Number(process.env.PG_POOL_MAX || 20),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS || 15_000),
    });
    pool.on('error', (err) => {
      console.warn('[Prisma pg.Pool background notice]:', err.message);
    });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({
      adapter,
      log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });
    // Intercept error events to prevent raw 'prisma:error' stderr emissions
    (client as any).$on('error', (e: any) => {
      console.warn('[Prisma Client Database notice]:', e?.message || e);
    });
    prismaInstance = globalForPrisma.prisma ?? client;
  } catch (err) {
    if (!IS_DEMO_MODE) falhaFatalSemBanco('Falha ao inicializar o driver Postgres', err);
    console.warn('[Prisma Initialization] DEMO_MODE: fallback para modo em memória:', err);
    prismaInstance = createInMemoryPrismaProxy();
  }
}

export const prisma = prismaInstance;

if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Multi-Tenancy Row-Level Isolation Helper
import { createTenantPrismaClient } from './tenantMiddleware';
export { createTenantPrismaClient } from './tenantMiddleware';

/**
 * Retorna uma instância do Prisma Client com escopo restrito e blindagem row-level
 * para o CNPJ/Tenant ID fornecido, impedindo qualquer vazamento cruzado de dados.
 */
export function getTenantPrisma(tenantCnpjOrId: string): PrismaClient {
  return createTenantPrismaClient(prisma, tenantCnpjOrId) as PrismaClient;
}

export default prisma;

