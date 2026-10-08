import { ServiceInputContract } from './standardizedPipeline';

export interface ServiceSegment {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface LegalBasisRef {
  law: string;
  article?: string;
  description: string;
}

export type ActorRoleId = 
  | 'SISTEMA'
  | 'ANALISTA_TRIBUTARIO'
  | 'ANALISTA_PREVIDENCIARIO'   // NOVO — INSS Especialista
  | 'ANALISTA_FINANCEIRO'        // NOVO — Diagnóstico Risco & ROI
  | 'ANALISTA_SEGURANCA_CISSP'   // NOVO — CyberSpy & ZeroVision
  | 'ENGENHEIRO_INFRA_REDES'     // NOVO — Conector Seguro mTLS ERP
  | 'ENGENHEIRO_CIVIL_CREA'      // NOVO — INSS-Obras (art/rrt CREA)
  | 'PERITO'
  | 'ADVOGADO_OAB'
  | 'CONTADOR_CRC'
  | 'ENGENHEIRO_CREA'            // mantido — genérico
  | 'JUIZ_EXTERNO'
  | 'AUDITOR_FISCAL';

export interface ActorRole {
  id: ActorRoleId;
  label: string;
}

export const ACTOR_LABELS: Record<ActorRoleId, string> = {
  SISTEMA: 'Autônomo (Sistema)',
  ANALISTA_TRIBUTARIO: 'Analista Tributário',
  ANALISTA_PREVIDENCIARIO: 'Analista Previdenciário',
  ANALISTA_FINANCEIRO: 'Analista Financeiro',
  ANALISTA_SEGURANCA_CISSP: 'Analista de Segurança (CISSP)',
  ENGENHEIRO_INFRA_REDES: 'Engenheiro de Infraestrutura & Redes',
  ENGENHEIRO_CIVIL_CREA: 'Engenheiro Civil (CREA)',
  PERITO: 'Perito Oficial',
  ADVOGADO_OAB: 'Advogado (OAB)',
  CONTADOR_CRC: 'Contador (CRC)',
  ENGENHEIRO_CREA: 'Engenheiro (CREA)',
  JUIZ_EXTERNO: 'Juízo / Vara',
  AUDITOR_FISCAL: 'Auditor Fiscal'
};

export type ProfessionalClass = 'CRC' | 'OAB' | 'CREA' | 'CRECI' | 'CRM' | 'CISSP';

export interface ProfessionalRegistry {
  class: ProfessionalClass;
  number: string;
  state?: string;
}

export interface ArtifactRef {
  key: string;
  label: string;
  type: 'file' | 'api_connection' | 'field' | 'external_process';
  formats?: string[];
  required: boolean;
  description?: string;
}

export interface GateValidator {
  ruleId: string;
  description: string;
  errorReasonIfNotMet: string;
}

export type PipelineStageKind = 
  | 'INTAKE'
  | 'PROCESS'
  | 'VALIDATE'
  | 'EXTERNAL_WAIT'
  | 'REVIEW'
  | 'EMIT';

export type MacroEtapaId = 'CAPTURA' | 'DIAGNOSTICO' | 'ESTRATEGIA' | 'EXECUCAO' | 'ENTREGA';

export interface PipelineStageDef {
  id: string;
  /** P30: macro-etapa padrão (opcional — inferida pela posição quando ausente). */
  macroEtapa?: MacroEtapaId;
  numero?: string;
  badge?: string;
  label: string;
  kind: PipelineStageKind;
  actorRole: ActorRoleId;
  requiredArtifacts: ArtifactRef[];
  slaHours?: number;
  slaHoras?: number;
  dependeDe?: string;
  startedAt?: string;
  isTerminal: boolean;
  description?: string;
}

export interface StageTransition {
  from: string;
  to: string;
  condition?: string;
}

export interface PipelineDefinition {
  stages: PipelineStageDef[];
  transitions: StageTransition[];
  initialStageId: string;
  terminalStageIds: string[];
}

export interface ReportSectionDef {
  id: string;
  title: string;
  renderer: string;
  required: boolean;
}

export interface SignatureSpec {
  type: 'ICP_A1' | 'ICP_A3' | 'PADES' | 'CADES';
  required: boolean;
  minSignatories: number;
}

export interface ReportSchema {
  reportType: string;
  reportTypeLabel: string;
  idPrefix: string;
  sections: ReportSectionDef[];
  signatureRequirements: SignatureSpec[];
}

export interface ServiceDefinition {
  serviceId: string;
  serviceName: string;
  segment: ServiceSegment;
  legalBasis: LegalBasisRef[];
  contract: ServiceInputContract;
  pipeline: PipelineDefinition;
  reportSchema: ReportSchema;
  responsibleClass: ProfessionalClass[];
  version: string;
  forbidEstimatedDataInFinalReport: boolean;
  allowedActorRoles?: ActorRoleId[];
}
