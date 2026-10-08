-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN_VELATRIX', 'ADVOGADO_PARCEIRO', 'CONTADOR_PARCEIRO', 'OPERADOR');

-- CreateEnum
CREATE TYPE "StatusTenant" AS ENUM ('NORMAL', 'ALERTA_CONECTOR', 'CLUSTER_INATIVO', 'SUSPENSO_SOS', 'ACTIVE', 'WARNING', 'SUSPENDED', 'SHADOW_MODE');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('LEAD', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED');

-- CreateEnum
CREATE TYPE "LeadOrigin" AS ENUM ('LANDING_PAGE', 'MAPS_MANUAL', 'INDICACAO_PARCEIRO');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('LUCRO_REAL', 'LUCRO_PRESUMIDO', 'SIMPLES_NACIONAL', 'BIFASICO', 'PLURIFASICO');

-- CreateEnum
CREATE TYPE "ReportClassification" AS ENUM ('RESUMO_EXECUTIVO_PRELIMINAR', 'LAUDO_PERICIAL_COMPLETO');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDENTE', 'EM_PROCESSAMENTO', 'LIQUIDADO', 'FALHA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('PIX_CNPJ', 'PIX_CPF', 'PIX_EMAIL', 'PIX_TELEFONE', 'PIX_ALEATORIA', 'TED', 'CONTA_BANCARIA');

-- CreateEnum
CREATE TYPE "NfseStatus" AS ENUM ('EMITIDA', 'PROCESSANDO', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "NfseOperationType" AS ENUM ('SAAS_SUBSCRIPTION', 'TAX_RECOVERY_SUCCESS_FEE');

-- CreateEnum
CREATE TYPE "HubHealthStatus" AS ENUM ('HEALTHY', 'DEGRADED', 'WARNING');

-- CreateEnum
CREATE TYPE "AgentExecutionStatus" AS ENUM ('IDLE', 'LISTENING', 'ANALYZING', 'EXECUTING', 'BLOCKED_HUMAN_IN_THE_LOOP', 'FALLBACK_DLQ', 'SUCCESS', 'ACTIVE', 'STANDBY_ON_DEMAND');

-- CreateEnum
CREATE TYPE "AgentRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AgentRuntimeMode" AS ENUM ('SERVERLESS_COLD', 'CONTAINER_WARM', 'STANDBY_ON_DEMAND', 'CONTAINER_SPAWNING');

-- CreateEnum
CREATE TYPE "LedgerStatus" AS ENUM ('EXECUTED', 'ADJUSTED', 'REJECTED', 'PENDING', 'BLOCKED_FRAUD', 'QUARANTINE');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "nomeEmpresa" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "status" "StatusTenant" NOT NULL DEFAULT 'NORMAL',
    "conectorERP" TEXT NOT NULL,
    "mrr" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
    "tokensConsumedMonthly" BIGINT NOT NULL DEFAULT 0,
    "consumoGeminiGb" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "agentesAtivos" INTEGER NOT NULL DEFAULT 0,
    "chaveApiHash" TEXT,
    "sector" TEXT,
    "sectorLabel" TEXT,
    "city" TEXT,
    "state" TEXT,
    "connectedChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enabledServices" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "shadowModeExpiresAt" TIMESTAMP(3),
    "trialExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerOffice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "oabOrCrc" TEXT NOT NULL,
    "primaryLawyerOrAccountant" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "brandPrimaryColor" TEXT NOT NULL DEFAULT '#4F46E5',
    "brandSecondaryColor" TEXT NOT NULL DEFAULT '#06B6D4',
    "logoUrl" TEXT,
    "defaultSplitPct" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "defaultVelatrixPct" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "pixKeyType" TEXT,
    "pixKey" TEXT,
    "bankCode" TEXT,
    "bankName" TEXT,
    "agency" TEXT,
    "accountNumber" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerOffice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "department" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "oabOrCrc" TEXT,
    "registrationNumber" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT,
    "partnerOfficeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "sectorLabel" TEXT,
    "stage" "LeadStage" NOT NULL DEFAULT 'LEAD',
    "origem" "LeadOrigin" NOT NULL DEFAULT 'LANDING_PAGE',
    "responsibleName" TEXT,
    "estimatedMrrBrl" DECIMAL(12,2),
    "cnae" TEXT,
    "regimeTributarioEstimado" TEXT,
    "tesesAplicaveis" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scoreAderencia" INTEGER,
    "faixaCreditoEstimado" TEXT,
    "dataDiagnostico" TIMESTAMP(3),
    "autoDiagnosticoCompleto" BOOLEAN NOT NULL DEFAULT false,
    "lastContactDate" TIMESTAMP(3),
    "notes" TEXT,
    "tenantId" TEXT,
    "partnerOfficeId" TEXT,
    "assignedUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProspectLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxCalculationCase" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partnerOfficeId" TEXT,
    "authorUserId" TEXT,
    "taxRegime" "TaxRegime" NOT NULL,
    "tese" TEXT NOT NULL,
    "teseTitle" TEXT NOT NULL,
    "teseLegalBasis" TEXT,
    "protocolDate" TIMESTAMP(3) NOT NULL,
    "consolidationDate" TIMESTAMP(3) NOT NULL,
    "prescribedCutoffDate" TIMESTAMP(3) NOT NULL,
    "reportClassification" "ReportClassification" NOT NULL DEFAULT 'LAUDO_PERICIAL_COMPLETO',
    "readinessPercentage" DECIMAL(5,2) NOT NULL,
    "totalGrossAnalyzed" DECIMAL(14,2) NOT NULL,
    "totalExcludedTaxAmount" DECIMAL(14,2) NOT NULL,
    "totalPrincipalCredit" DECIMAL(14,2) NOT NULL,
    "totalSelicInterest" DECIMAL(14,2) NOT NULL,
    "totalUpdatedCredit" DECIMAL(14,2) NOT NULL,
    "prescribedPrincipalBlocked" DECIMAL(14,2) NOT NULL,
    "totalItemsProcessed" INTEGER NOT NULL DEFAULT 0,
    "validItemsCount" INTEGER NOT NULL DEFAULT 0,
    "prescribedItemsBlocked" INTEGER NOT NULL DEFAULT 0,
    "divergencesXmlSpedCount" INTEGER NOT NULL DEFAULT 0,
    "conservativeSavingsProtected" DECIMAL(14,2) NOT NULL DEFAULT 0.0,
    "auditHashSha256" TEXT NOT NULL,
    "canonicalPayloadJson" JSONB,
    "syntheticMonthlyData" JSONB,
    "complianceAlerts" JSONB,
    "status" TEXT NOT NULL DEFAULT 'CALCULADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxCalculationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SplitDeal" (
    "id" TEXT NOT NULL,
    "dealCode" TEXT NOT NULL,
    "dealTitle" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partnerOfficeId" TEXT NOT NULL,
    "taxCalculationCaseId" TEXT,
    "estimatedBenefitAmount" DECIMAL(14,2) NOT NULL,
    "successFeePercent" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "totalSuccessFeeAmount" DECIMAL(14,2) NOT NULL,
    "partnerSplitPercent" DECIMAL(5,2) NOT NULL DEFAULT 70.00,
    "partnerSplitAmount" DECIMAL(14,2) NOT NULL,
    "velatrixSplitPercent" DECIMAL(5,2) NOT NULL DEFAULT 30.00,
    "velatrixSplitAmount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "splitWebhookUrl" TEXT,
    "contractDocHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SplitDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "payoutNumber" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "partnerOfficeId" TEXT NOT NULL,
    "splitDealId" TEXT,
    "taxCalculationCaseId" TEXT,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "partnerAmount" DECIMAL(14,2) NOT NULL,
    "velatrixAmount" DECIMAL(14,2) NOT NULL,
    "method" "PayoutMethod" NOT NULL DEFAULT 'PIX_CNPJ',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDENTE',
    "escrowAccountIspb" TEXT,
    "destinationPixKeyMasked" TEXT,
    "destinationBank" TEXT,
    "transactionId" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "proofHashSha256" TEXT,
    "receiptUrl" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfseRecord" (
    "id" TEXT NOT NULL,
    "nfseNumber" TEXT,
    "rpsNumber" TEXT,
    "rpsSerie" TEXT,
    "verificationCode" TEXT,
    "tenantId" TEXT NOT NULL,
    "partnerOfficeId" TEXT,
    "splitDealId" TEXT,
    "payoutId" TEXT,
    "taxCalculationCaseId" TEXT,
    "operationType" "NfseOperationType" NOT NULL DEFAULT 'TAX_RECOVERY_SUCCESS_FEE',
    "operationDescription" TEXT NOT NULL,
    "cnae" TEXT,
    "itemListaServico" TEXT,
    "grossAmountBrl" DECIMAL(14,2) NOT NULL,
    "partnerSplitPct" DECIMAL(5,2) NOT NULL,
    "partnerSplitAmountBrl" DECIMAL(14,2) NOT NULL,
    "velatrixRetainedAmountBrl" DECIMAL(14,2) NOT NULL,
    "issRatePct" DECIMAL(5,2) NOT NULL,
    "issAmountBrl" DECIMAL(10,2) NOT NULL,
    "status" "NfseStatus" NOT NULL DEFAULT 'PROCESSANDO',
    "emissionDate" TIMESTAMP(3),
    "municipalProtocol" TEXT,
    "municipalDigestSha256" TEXT,
    "prefeitura" TEXT,
    "rejectionReason" TEXT,
    "rawMunicipalResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NfseRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StrategicHub" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "accentBg" TEXT,
    "borderAccent" TEXT,
    "iconName" TEXT NOT NULL,
    "totalAgentsCount" INTEGER NOT NULL DEFAULT 0,
    "activeAgentsCount" INTEGER NOT NULL DEFAULT 0,
    "standbyAgentsCount" INTEGER NOT NULL DEFAULT 0,
    "eventsProcessedCount" BIGINT NOT NULL DEFAULT 0,
    "totalEconomyBrl" DECIMAL(16,2) NOT NULL DEFAULT 0.0,
    "totalBleedMitigatedBrl" DECIMAL(16,2) NOT NULL DEFAULT 0.0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 20,
    "healthStatus" "HubHealthStatus" NOT NULL DEFAULT 'HEALTHY',
    "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StrategicHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroAgent" (
    "id" TEXT NOT NULL,
    "codeName" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "triggerKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "erpEndpoint" TEXT,
    "status" "AgentExecutionStatus" NOT NULL DEFAULT 'ACTIVE',
    "runtimeMode" "AgentRuntimeMode" NOT NULL DEFAULT 'CONTAINER_WARM',
    "riskLevel" "AgentRiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "processedEventsCount" BIGINT NOT NULL DEFAULT 0,
    "mitigatedBleedBrl" DECIMAL(16,2) NOT NULL DEFAULT 0.0,
    "generatedEconomyBrl" DECIMAL(16,2) NOT NULL DEFAULT 0.0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 20,
    "successRatePct" DECIMAL(5,2) NOT NULL DEFAULT 99.5,
    "requiresMultiSigThresholdBrl" DECIMAL(14,2),
    "lastHeartbeat" TIMESTAMP(3),
    "sampleActionDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwarmLiveLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "hubId" TEXT,
    "agentId" TEXT,
    "agentName" TEXT NOT NULL,
    "actionTitle" TEXT NOT NULL,
    "resultSummary" TEXT NOT NULL,
    "rawFormattedLog" TEXT NOT NULL,
    "economyBrl" DECIMAL(14,2),
    "bleedPreventedBrl" DECIMAL(14,2),
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "status" TEXT NOT NULL DEFAULT 'CONFORME',
    "targetEntity" TEXT,
    "erpEndpoint" TEXT,
    "erpResponseCode" INTEGER,
    "requiresMultiSig" BOOLEAN NOT NULL DEFAULT false,
    "ledgerHash" TEXT NOT NULL,
    "previousLedgerHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwarmLiveLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLedgerEntry" (
    "id" TEXT NOT NULL,
    "chainIndex" BIGINT,
    "tenantId" TEXT,
    "userId" TEXT,
    "eventId" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "sector" TEXT,
    "jurisdiction" TEXT DEFAULT 'BR',
    "agentsInvolved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "decisionSummary" TEXT NOT NULL,
    "decisionAstJson" JSONB,
    "executionPayloadJson" JSONB,
    "status" "LedgerStatus" NOT NULL DEFAULT 'EXECUTED',
    "signatures" JSONB,
    "executionReceipt" TEXT,
    "invariantSnapshot" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recordHash" TEXT NOT NULL,
    "previousRecordHash" TEXT NOT NULL,
    "requiredSignatures" INTEGER NOT NULL DEFAULT 1,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CyberSpyThreat" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoAmeaca" TEXT NOT NULL,
    "nivelRisco" TEXT NOT NULL,
    "detalhes" JSONB NOT NULL,
    "bloqueado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyberSpyThreat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_cnpj_key" ON "Tenant"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_chaveApiHash_key" ON "Tenant"("chaveApiHash");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOffice_cnpj_key" ON "PartnerOffice"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerOffice_email_key" ON "PartnerOffice"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectLead_cnpj_key" ON "ProspectLead"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "TaxCalculationCase_caseNumber_key" ON "TaxCalculationCase"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SplitDeal_dealCode_key" ON "SplitDeal"("dealCode");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_payoutNumber_key" ON "Payout"("payoutNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StrategicHub_code_key" ON "StrategicHub"("code");

-- CreateIndex
CREATE UNIQUE INDEX "MicroAgent_codeName_key" ON "MicroAgent"("codeName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectLead" ADD CONSTRAINT "ProspectLead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectLead" ADD CONSTRAINT "ProspectLead_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectLead" ADD CONSTRAINT "ProspectLead_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCalculationCase" ADD CONSTRAINT "TaxCalculationCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCalculationCase" ADD CONSTRAINT "TaxCalculationCase_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxCalculationCase" ADD CONSTRAINT "TaxCalculationCase_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDeal" ADD CONSTRAINT "SplitDeal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDeal" ADD CONSTRAINT "SplitDeal_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SplitDeal" ADD CONSTRAINT "SplitDeal_taxCalculationCaseId_fkey" FOREIGN KEY ("taxCalculationCaseId") REFERENCES "TaxCalculationCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_splitDealId_fkey" FOREIGN KEY ("splitDealId") REFERENCES "SplitDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_taxCalculationCaseId_fkey" FOREIGN KEY ("taxCalculationCaseId") REFERENCES "TaxCalculationCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRecord" ADD CONSTRAINT "NfseRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRecord" ADD CONSTRAINT "NfseRecord_partnerOfficeId_fkey" FOREIGN KEY ("partnerOfficeId") REFERENCES "PartnerOffice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRecord" ADD CONSTRAINT "NfseRecord_splitDealId_fkey" FOREIGN KEY ("splitDealId") REFERENCES "SplitDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRecord" ADD CONSTRAINT "NfseRecord_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NfseRecord" ADD CONSTRAINT "NfseRecord_taxCalculationCaseId_fkey" FOREIGN KEY ("taxCalculationCaseId") REFERENCES "TaxCalculationCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroAgent" ADD CONSTRAINT "MicroAgent_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "StrategicHub"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwarmLiveLog" ADD CONSTRAINT "SwarmLiveLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwarmLiveLog" ADD CONSTRAINT "SwarmLiveLog_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "StrategicHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwarmLiveLog" ADD CONSTRAINT "SwarmLiveLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "MicroAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLedgerEntry" ADD CONSTRAINT "AuditLedgerEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLedgerEntry" ADD CONSTRAINT "AuditLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CyberSpyThreat" ADD CONSTRAINT "CyberSpyThreat_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

