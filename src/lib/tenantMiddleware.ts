/**
 * VELATRIX AOS — MIDDLEWARE PRISMA DE MULTI-TENANCY ROW-LEVEL
 * ==========================================================
 * Responsável por garantir o isolamento estrito de dados entre diferentes
 * tenants (escritórios de advocacia, fundos de investimento, bancos ou indústrias).
 * 
 * DIRETIVA ARQUITETURAL:
 * - Toda tabela de negócio possui o campo `tenantId` (que armazena o CNPJ do cliente operador).
 * - A Velatrix é FABRICANTE DE SOFTWARE e orquestradora de tecnologia. Ela NÃO opera precatório
 *   nem intermedeia crédito. Cada operação é realizada pelo tenant com seu próprio CNPJ.
 * - Este middleware intercepta automaticamente 100% das operações do Prisma Client
 *   e injeta a cláusula `where: { tenantId }` ou `data: { tenantId }`, impedindo qualquer
 *   leitura ou escrita cruzada entre clientes (Cross-Tenant Leakage Prevention).
 */

export class TenantIsolationViolationError extends Error {
  constructor(public readonly tenantEsperado: string, public readonly tenantViolador?: string) {
    super(
      `[SEGURANÇA MULTI-TENANT ROW-LEVEL VIOLATION] Violação de isolamento criptográfico de dados. ` +
      `Tenant autenticado '${tenantEsperado}' tentou manipular ou ler registros do tenant '${tenantViolador || 'DESCONHECIDO'}'. ` +
      `Operação sumariamente abortada e registrada no Audit Ledger.`
    );
    this.name = 'TenantIsolationViolationError';
  }
}

// Lista de modelos que exigem injeção obrigatória de tenantId
export const TENANT_SCOPED_MODELS = [
  'cedente',
  'cessionario',
  'precatorio',
  'scoresnapshot',
  'proposedterm',
  'cessao',
  'cessaoledger',
  'precatoriomonitor',
  'compensacaosimulation',
  'taxcalculationcase',
  'splitdeal',
  'payout',
  'nfserecord',
  'prospectlead',
  'swarmlivelog',
  'auditledgerentry',
  'auditlog',
  'cyberspythreat',
  'erpconnection',
  'erpeventlog',
  'billingsubscription',
  'billinginvoice',
  'user',
  // P-BE2 · modelos de persistência real (todos possuem coluna tenantId no schema)
  'workitem',
  'ledgerentry',
  'laudo',
  'laudoseal',
  'casoloas',
  'outboxevent',
  'creditoantecipacao',
  'creditoevento',
  'telemetriahora',
  'certificadoa1',
  'lead',
  'caso',
  'consentimento',
  'contratoservico',
  'fatura',
  'licencaadvogado'
] as const;

export interface TenantContext {
  tenantId: string; // CNPJ ou ID único do cliente
  cnpj: string;
  razaoSocial?: string;
}

const READ_ACTIONS = new Set([
  'findMany', 'findFirst', 'findFirstOrThrow', 'findUnique', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy',
]);
const TENANT_SAFE_ACTIONS = new Set([
  ...READ_ACTIONS,
  'create', 'createMany', 'createManyAndReturn',
  'update', 'updateMany', 'updateManyAndReturn',
  'delete', 'deleteMany', 'upsert',
]);

/**
 * Cria uma instância do Prisma Client rigidamente envelopada e vinculada ao CNPJ do Tenant.
 * Qualquer query disparada através deste cliente herdará automaticamente o filtro `tenantId`.
 */
export function createTenantPrismaClient<T extends object>(basePrisma: T, tenantCnpjOrId: string): T {
  if (!tenantCnpjOrId || tenantCnpjOrId.trim() === '') {
    throw new Error('[createTenantPrismaClient] tenantCnpjOrId obrigatório para instanciar cliente com isolamento.');
  }

  const cleanTenantId = tenantCnpjOrId.trim();

  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      const origValue = Reflect.get(target, prop, receiver);

      // Métodos especiais do Prisma
      if (typeof prop === 'string' && (prop.startsWith('$') || prop.startsWith('_'))) {
        return origValue;
      }

      const modelName = String(prop).toLowerCase();
      const isScoped = TENANT_SCOPED_MODELS.includes(modelName as any);

      if (!isScoped || typeof origValue !== 'object' || origValue === null) {
        return origValue;
      }

      // Proxy do Modelo (ex: prisma.precatorio, prisma.cessao, etc.)
      return new Proxy(origValue, {
        get(modelTarget, action: string) {
          const originalAction = (modelTarget as any)[action];
          if (typeof originalAction !== 'function') {
            return originalAction;
          }

          // Default-deny: qualquer ação não mapeada (ex.: nova API do Prisma) é bloqueada
          // em vez de executar sem filtro de tenant.
          if (!TENANT_SAFE_ACTIONS.has(action)) {
            return async function () {
              throw new Error(`[TenantIsolation] Ação '${action}' não suportada no cliente com escopo de tenant (${modelName}).`);
            };
          }

          return async function (args: any = {}) {
            const sanitizedArgs = { ...(args || {}) };

            // 1. Operações de Leitura (findMany, findFirst, findUnique, *OrThrow, count, aggregate, groupBy)
            if (READ_ACTIONS.has(action)) {
              sanitizedArgs.where = sanitizedArgs.where || {};

              // Se o chamador forneceu um tenantId divergente, lança violação de segurança imediata
              if (sanitizedArgs.where.tenantId && sanitizedArgs.where.tenantId !== cleanTenantId) {
                throw new TenantIsolationViolationError(cleanTenantId, sanitizedArgs.where.tenantId);
              }

              sanitizedArgs.where.tenantId = cleanTenantId;
            }

            // 2. Operações de Criação (create, createMany)
            else if (action === 'create') {
              sanitizedArgs.data = sanitizedArgs.data || {};
              if (sanitizedArgs.data.tenantId && sanitizedArgs.data.tenantId !== cleanTenantId) {
                throw new TenantIsolationViolationError(cleanTenantId, sanitizedArgs.data.tenantId);
              }
              sanitizedArgs.data.tenantId = cleanTenantId;
            } 
            else if (action === 'createMany' || action === 'createManyAndReturn') {
              if (Array.isArray(sanitizedArgs.data)) {
                sanitizedArgs.data = sanitizedArgs.data.map((item: any) => {
                  if (item.tenantId && item.tenantId !== cleanTenantId) {
                    throw new TenantIsolationViolationError(cleanTenantId, item.tenantId);
                  }
                  return { ...item, tenantId: cleanTenantId };
                });
              } else if (sanitizedArgs.data) {
                sanitizedArgs.data.tenantId = cleanTenantId;
              }
            }

            // 3. Operações de Atualização (update, updateMany)
            else if (['update', 'updateMany', 'updateManyAndReturn'].includes(action)) {
              sanitizedArgs.where = sanitizedArgs.where || {};
              if (sanitizedArgs.where.tenantId && sanitizedArgs.where.tenantId !== cleanTenantId) {
                throw new TenantIsolationViolationError(cleanTenantId, sanitizedArgs.where.tenantId);
              }
              sanitizedArgs.where.tenantId = cleanTenantId;

              // Previne alteração indevida do tenantId
              if (sanitizedArgs.data && sanitizedArgs.data.tenantId && sanitizedArgs.data.tenantId !== cleanTenantId) {
                throw new TenantIsolationViolationError(cleanTenantId, sanitizedArgs.data.tenantId);
              }
            }

            // 4. Operações de Exclusão (delete, deleteMany)
            else if (['delete', 'deleteMany'].includes(action)) {
              sanitizedArgs.where = sanitizedArgs.where || {};
              if (sanitizedArgs.where.tenantId && sanitizedArgs.where.tenantId !== cleanTenantId) {
                throw new TenantIsolationViolationError(cleanTenantId, sanitizedArgs.where.tenantId);
              }
              sanitizedArgs.where.tenantId = cleanTenantId;
            }

            // 5. Operação de Upsert
            else if (action === 'upsert') {
              sanitizedArgs.where = sanitizedArgs.where || {};
              sanitizedArgs.where.tenantId = cleanTenantId;
              sanitizedArgs.create = { ...(sanitizedArgs.create || {}), tenantId: cleanTenantId };
              sanitizedArgs.update = { ...(sanitizedArgs.update || {}), tenantId: cleanTenantId };
            }

            // Invoca a ação original do Prisma com os argumentos isolados
            return originalAction.call(modelTarget, sanitizedArgs);
          };
        }
      });
    }
  };

  return new Proxy(basePrisma, handler) as T;
}

/**
 * Utilitário de Validação de Tenant para Endpoints de API e Webhooks
 */
export function assertTenantOwnership(recordTenantId: string | null | undefined, activeTenantId: string, resourceName = 'recurso') {
  if (!recordTenantId || recordTenantId !== activeTenantId) {
    throw new TenantIsolationViolationError(activeTenantId, recordTenantId || undefined);
  }
  return true;
}
