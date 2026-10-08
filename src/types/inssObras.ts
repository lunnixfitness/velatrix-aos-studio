/**
 * VELATRIX AOS - MÓDULO INSS-OBRAS (CONSTRUÇÃO CIVIL & OBRAS PESADAS)
 * Fundamentação: Lei nº 8.212/1991 (Art. 31), Lei nº 12.546/2011 (Art. 7º e 8º - CPRB),
 * IN RFB nº 2.110/2022 (Arts. 110 a 145), IN RFB nº 2.021/2021 (SERO / CNO) e Súmula Vinculante 8 do STF.
 */

export type ConstructionWorkType = 
  | 'RESIDENCIAL_UNIFAMILIAR'
  | 'RESIDENCIAL_MULTIFAMILIAR'
  | 'COMERCIAL'
  | 'GALPAO_INDUSTRIAL'
  | 'INFRAESTRUTURA_OBRAS_PESADAS'
  | 'REFORMA_DEMOLICAO';

export type ConstructionStandard = 'BAIXO' | 'NORMAL' | 'ALTO';

export type CnoStatus = 'EM_ANDAMENTO' | 'CONCLUIDA_PENDENTE_SERO' | 'REGULARIZADA_CND';

export interface TechnicalResponsible {
  name: string;
  councilType: 'CREA' | 'CAU';
  registryNumber: string;
  uf: string;
  cpf: string;
}

export interface CnoMatricula {
  id: string;
  cnoNumber: string; // Ex: 90.012.34567/89
  ceiLegacyNumber?: string;
  nickname: string;
  corporateReason: string;
  cnpj: string;
  technicalResponsible: TechnicalResponsible;
  builtAreaM2: number;
  workType: ConstructionWorkType;
  constructionStandard: ConstructionStandard;
  cubSindusconM2: number;
  startDate: string;
  endDateOrHabiteSe?: string;
  status: CnoStatus;
  uf: string;
  city: string;
  address: string;
  isDesoneradoCprb: boolean; // Optante Lei 12.546/2011 (alíquota 3.5%)
  declaredPayrollTotal: number;
  notes?: string;
}

export interface InvoiceRetentionItem {
  id: string;
  cnoId: string;
  cnoNumber: string;
  invoiceNumber: string;
  issueDate: string;
  competenceMonth: string; // YYYY-MM
  serviceDescription: string;
  contractNumber?: string;
  providerName: string;
  providerCnpj: string;
  grossValue: number;
  hasContractClauseForMaterials: boolean;
  materialsDeclaredInInvoice: number;
  materialsProvenFiscalReceipts: number;
  equipmentDeclaredInInvoice: number;
  hasHeavyEquipmentProof: boolean;
  
  // Base e retenção
  deductibleMaterialsAllowed: number;
  deductibleEquipmentAllowed: number;
  effectiveLaborBaseCalculated: number;
  retentionRateApplied: number; // 11 ou 3.5
  retentionRateDue: number; // 11 ou 3.5
  retentionWithheldPaid: number;
  retentionWithheldDue: number;
  excessWithheldIndebito: number;
  
  // Atualização SELIC
  selicRateAccumulatedPct: number;
  selicInterestBrl: number;
  totalUpdatedIndebito: number;
  
  // Diagnóstico
  complianceStatus: 'CONFORME' | 'RETENCAO_EXCESSIVA' | 'ALIQUOTA_INCORRETA' | 'BASE_SEM_SEGREGAÇÃO' | 'PRESCRIÇÃO_DECADENCIA';
  legalNotes: string;
}

export interface IndirectAfferenceSimulation {
  cnoId: string;
  cnoNumber: string;
  builtAreaM2: number;
  cubValue: number;
  totalEstimatedCost: number; // Area * CUB
  standardLaborPct: number; // RMT da tabela (ex: 20% a 50%)
  baseEstimatedRmt: number; // Custo * % RMT
  
  // Deduções legais conforme IN RFB 2.021/2021
  usesReadyMixConcrete: boolean; // Abate 5% da RMT
  readyMixConcreteDeduction: number;
  usesPrecastStructures: boolean; // Abate até 70% ou 50%
  precastStructuresDeduction: number;
  subcontractsWithRetentionDeduction: number; // NFS-e de subempreitada comprovadas
  materialsProofDeduction: number;
  
  finalAdjustedRmtBase: number;
  inssDueOnAfericao: number; // 36.8% (20% patronal + 3% GILRAT + 5.8% terceiros + etc)
  
  // Confronto com Folha Declarada
  totalDeclaredLaborBase: number;
  inssActuallyPaid: number;
  fiscalDeficitOrSurplus: number;
  riskStatus: 'REGULARIZADO_DISPENSADO' | 'BAIXO_RISCO' | 'ALERTA_MALHA_SERO' | 'ALTO_RISCO_AUTUACAO';
  estimatedAroComplementary: number;
  legalGuidance: string;
}

export interface DeclaratoryIntegrationRecord {
  id: string;
  competenceMonth: string; // YYYY-MM
  cnoNumber: string;
  workNickname: string;
  
  // eSocial / DCTFWeb
  s1000DesoneraCprb: boolean;
  s1005Registered: boolean;
  s1200RemunerationTotal: number;
  s1280AlíquotaCprbPct: number;
  dctfWebRetentionDeclaredBrl: number;
  
  // NFS-e Tomadas / Retenções Sofridas
  nfsGrossTotalBrl: number;
  nfsRetentionWithheldBrl: number;
  
  // Confronto
  retentionDifferenceBrl: number;
  status: 'CONCILIADO' | 'DIVERGENCIA_DCTF' | 'OMISSAO_ESOCIAL' | 'RETENCAO_NAO_APROVEITADA';
  diagnosticSummary: string;
  actionRequired: string;
}

export interface InssObrasDossierPericial {
  protocolId: string;
  emissionDate: string;
  companyName: string;
  cnpj: string;
  cnoNumber: string;
  workNickname: string;
  expertName: string;
  expertRegistry: string;
  
  // Resumo Financeiro
  totalInvoicesAudited: number;
  totalGrossAnalyzed: number;
  totalMaterialsDeductedLegal: number;
  totalExcessWithheldPrincipal: number;
  totalSelicCorrection: number;
  totalIndebitoUpdatedRecovery: number;
  
  // Aferição SERO
  afericaoIndiretaRisk: string;
  afericaoIndiretaEconomiaOuRisco: number;
  
  // Trilha Criptográfica
  auditHashSha256: string;
  canonicalJsonPayload: string;
  
  // Conclusão Técnica
  technicalConclusion: string;
  legalBasisSummary: string[];
}
