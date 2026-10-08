/**
 * Padronização Arquitetural de Entrada, Esteira (Stepper) e Laudos do Velatrix AOS
 */

export type PipelineStage = 'RECEBIDO' | 'PROCESSANDO' | 'VALIDANDO' | 'PRONTO' | 'BLOQUEADO' | string;

// ============================================================================
// MUDANÇA 1, 3 & 5 — TIPOS DO MÓDULO DE PERÍCIA (V2.0.0)
// ============================================================================

export type PericiaKind = 'judicial' | 'arbitral' | 'contratual';

export type PericiaDominio = 'contabil' | 'engenharia' | 'medico' | 'multidisciplinar';

export type ConselhoProfissional = 'CRC' | 'CREA' | 'CRM';

export const DOMINIO_CONSELHOS_MAP: Record<PericiaDominio, ConselhoProfissional[]> = {
  contabil: ['CRC'],
  engenharia: ['CREA'],
  medico: ['CRM'],
  multidisciplinar: ['CRC', 'CREA', 'CRM']
};

export interface ArquivoCustodia {
  filename: string;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
}

export type EstagioStatus =
  | 'pendente'
  | 'em_andamento'
  | 'aguardando'
  | 'em_impugnacao'
  | 'concluido'
  | 'bloqueado'
  | 'skipped';

export interface PericiaEstagio {
  id: string;
  numero: string;
  label: string;
  actorRole: string;
  slaHoras: number;
  startedAt?: string;
  completedAt?: string;
  dependeDe?: string;
  status: EstagioStatus;
  isTerminal?: boolean;
  requiredArtifacts?: { key: string; label: string; required: boolean }[];
}

export interface PericiaPipelineBase {
  kind: PericiaKind;
  dominio: PericiaDominio;
  estagios: PericiaEstagio[];
  responsavelTecnico: {
    nome: string;
    conselho: ConselhoProfissional;
    registro: string;
  };
  custodiaArquivos: Record<string, ArquivoCustodia>;
}

export interface PericiaJudicial extends PericiaPipelineBase {
  kind: 'judicial';
  cnj: string | null;
  juizo: string | null;
  vara?: string | null;
  statusHonorarios?: 'proposta_apresentada' | 'em_impugnacao' | 'homologado' | 'deposito_realizado';
}

export interface PericiaArbitral extends PericiaPipelineBase {
  kind: 'arbitral';
  camara: string | null;
  procedimento: string | null;
  arbitroPresidente?: string | null;
}

export interface PericiaContratual extends PericiaPipelineBase {
  kind: 'contratual';
  contratante: string | null;
  clausulaCompromissoria: string | null;
  objetoContrato?: string | null;
}

export type PericiaPipeline = PericiaJudicial | PericiaArbitral | PericiaContratual;

// ============================================================================
// ESPECIALISTA INSS — AUDITORIA & CÁLCULO PREVIDENCIÁRIO (V2.0.0)
// ============================================================================
export type TipoBeneficio = 'programado' | 'incapacidade' | 'isencao_ir_doenca' | 'pensao_morte';

export type InssConselhoProfissional = 'OAB' | 'CRC' | 'CRM';

export const BENEFICIO_CONSELHOS_MAP: Record<TipoBeneficio, InssConselhoProfissional[]> = {
  programado: ['OAB', 'CRC'],
  incapacidade: ['OAB', 'CRM', 'CRC'],
  isencao_ir_doenca: ['OAB', 'CRM'],
  pensao_morte: ['OAB', 'CRC']
};

export const BENEFICIO_LABELS: Record<TipoBeneficio, string> = {
  programado: 'Benefício Programado (Aposentadorias por Idade / Tempo / Regras de Transição)',
  incapacidade: 'Benefício por Incapacidade (Auxílio por Incapacidade Temporária / Permanente / BPC-LOAS)',
  isencao_ir_doenca: 'Isenção de Imposto de Renda por Moléstia Grave (Lei 7.713/88)',
  pensao_morte: 'Pensão por Morte & Auxílio-Reclusão (EC 103/2019)'
};


export interface ServiceInputContract {
  serviceId: string;
  serviceName: string;
  category: string; // Aberto, referenciando o id do segmento
  requiredInputs: {
    key: string;
    label: string;
    description: string;
    type: 'file' | 'api_connection' | 'cnpj' | 'field' | 'external_process';
    formats?: string[];
  }[];
  optionalInputs: {
    key: string;
    label: string;
    description: string;
    type: 'file' | 'api_connection' | 'field' | 'external_process';
    formats?: string[];
  }[];
  forbidEstimatedDataInFinalReport: boolean; // Sempre true para laudos finais oficiais
  validationRules: {
    ruleId: string;
    description: string;
    errorReasonIfNotMet: string;
  }[];
}

export interface PipelineStageState {
  currentStageId?: string;
  stage?: PipelineStage;
  progressPct: number; // 0 - 100
  blockedReason?: string;
  missingRequirements?: string[];
  stageTimestamps?: Record<string, string>;
}

export type StandardizedReportType = string;

export interface LgpdComplianceMetadata {
  isCompliant: boolean;
  dataProtectionOfficer: string;
  dataMaskingApplied: boolean;
  retentionPeriodDays: number;
  legalBasis: string; // Ex: 'Art. 7º, II, IX da Lei 13.709/2018 (Cumprimento de Obrigação Legal e Legítimo Interesse)'
  anonymizedFields: string[];
}

export interface StandardizedAuditReport {
  reportId: string; // Ex: LDO-RISK-2026-90412
  serviceId: string; // Ex: 'risk_roi_diagnosis', 'cyberspy_edge'
  serviceName: string;
  reportType: StandardizedReportType;
  reportTypeLabel: string;
  issuedAt: string; // ISO 8601
  issuedAtFormatted: string;
  
  // Metadados Comuns Obrigatórios
  tenantId: string;
  tenantName: string;
  tenantCnpj: string;
  
  lgpdCompliance: LgpdComplianceMetadata;
  auditHash: string; // SHA-256 do payload completo e das fontes reais
  
  signer: {
    name: string;
    role: string;
    credentialNumber?: string;
    signatureType: 'ICP_BRASIL_A1' | 'SECP256K1_ENCLAVE' | 'VELATRIX_AUTONOMOUS_KEY' | 'PENDENTE_ASSINATURA_ICP';
  };
  
  pipelineSnapshot: {
    verifiedRealSources: string[];
    executionTimeMs: number;
    dataSourceIntegrity: '100% REAL VERIFICADO' | 'CONEXAO_ERP_ASSINADA' | 'ARQUIVOS_AUDITADOS' | 'DEMONSTRACAO_SEM_VALIDADE';
  };

  // Corpos Específicos por Tipo de Laudo
  dominio?: PericiaDominio;
  periciaKind?: PericiaKind;
  periciaPayload?: {
    kind: PericiaKind;
    dominio: PericiaDominio;
    dadosProcedimento: Record<string, string | null>;
    custodiaArquivos: Record<string, ArquivoCustodia>;
  };
  riskRoiPayload?: {
    overallZScore: number;
    solvencyStatus: 'Z-Prime Excelente' | 'Zona Cinzenta' | 'Alerta de Insolvência Crítica';
    annualRevenueReal: number;
    monthlyRevenueReal: number;
    ebitdaMarginReal: number;
    calculatedRoiMultiplier: number; // Ex: 4.8x
    identifiedSavingsBrl: number;
    totalTaxCreditsBrl: number;
    sourceDocuments: string[];
    topVulnerabilities: string[];
    strategicRecommendations: string[];
  };

  securityThreatPayload?: {
    threatId: string;
    threatType: string;
    threatTypeLabel: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    targetEntity: string;
    channelOrigin: string; // Ex: 'Dark Web Tor Crawl', 'BACEN SPI Webhook', 'SAP S/4HANA RFC'
    status: 'ACTIVE_BLOCK' | 'OVERRIDDEN' | 'RESOLVED';
    mitigationAction: string;
    anomalySignature: string;
    rawPayloadSnippet?: string;
    resolutionNotes?: string;
    affectedCpfCnpj?: string;
  };

  fiscalRecoveryPayload?: {
    totalCreditsIdentifiedBrl: number;
    monitoredCompetencesCount: number;
    primaryTheses: string[];
    darfCompensationsBrl: number;
    pgfnCapagRating: string;
    receiptPerDcomp?: string;
  };

  // Payload Genérico para Laudos Multi-Segmento (Perícia, INSS, Obras, Precatórios, etc.)
  sectionsPayload?: Record<string, any>;

  // Auditoria e Governança de Validade do Laudo (Bugfix P1)
  status?: 'VALID' | 'INVALIDATED';
  invalidationReason?: string;
  invalidatedAt?: string;
}
