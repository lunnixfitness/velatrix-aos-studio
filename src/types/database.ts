/**
 * Tipos TypeScript sincronizados com o schema Prisma (PostgreSQL)
 * prisma/schema.prisma
 */

export enum StatusTenant {
  NORMAL = 'NORMAL',
  ALERTA_CONECTOR = 'ALERTA_CONECTOR',
  CLUSTER_INATIVO = 'CLUSTER_INATIVO',
  SUSPENSO_SOS = 'SUSPENSO_SOS',
}

export type TenantPlan = 'Profissional' | 'Corporation' | 'Governo & Defesa' | string;
export type ErpConnectorType = 'TOTVS Protheus' | 'SAP S/4HANA' | 'Senior ERP' | 'Oracle NetSuite' | string;

export interface TenantModel {
  id: string;
  nomeEmpresa: string;
  cnpj: string;
  plano: TenantPlan;
  status: StatusTenant;
  conectorERP: ErpConnectorType;
  mrr: number; // Decimal(10, 2)
  consumoGeminiGb: number;
  agentesAtivos: number;
  chaveApiHash: string;
  createdAt: Date | string;
  updatedAt: Date | string;

  logsAudit?: AuditLogModel[];
  threats?: CyberSpyThreatModel[];
}

export interface AuditLogModel {
  id: string;
  tenantId: string;
  acao: string;
  usuario: string;
  metadata?: Record<string, any> | null;
  createdAt: Date | string;

  tenant?: TenantModel;
}

export type CyberSpyThreatType = 'PIX_FRAUD' | 'DARK_WEB_LEAK' | 'INVENTORY_GLITCH' | string;
export type CyberSpyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CyberSpyThreatModel {
  id: string;
  tenantId: string;
  tipoAmeaca: CyberSpyThreatType;
  nivelRisco: CyberSpyRiskLevel;
  detalhes: Record<string, any>;
  bloqueado: boolean;
  createdAt: Date | string;

  tenant?: TenantModel;
}
