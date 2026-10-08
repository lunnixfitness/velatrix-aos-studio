/**
 * Types definition for Notas Fiscais de Serviços (NFS-e) module in Velatrix AOS
 */

export type NfseOperationType = 'SAAS_SUBSCRIPTION' | 'TAX_RECOVERY_SUCCESS_FEE';

export type NfseStatus = 'EMITIDA' | 'PROCESSANDO' | 'REJEITADA' | 'CANCELADA';

export interface MunicipalTaxDetails {
  naturezaOperacao: string;
  regimeEspecialTributacao: string;
  optanteSimplesNacional: boolean;
  incentivadorCultural: boolean;
  baseCalculoVelatrixBrl: number;
  aliquotaIss: number;
  issDevidoBrl: number;
  pisRetidoBrl: number;
  cofinsRetidoBrl: number;
  csllRetidoBrl: number;
  irrfRetidoBrl: number;
}

export interface MunicipalResponsePayload {
  protocolo: string;
  codigoRetorno: string;
  mensagemSEFAZ: string;
  dataAutorizacao: string;
  linkVerificacaoPrefeitura: string;
  xmlDigestSha256: string;
  ambienteEmissao: 'PRODUCAO' | 'HOMOLOGACAO';
  prefeitura: string;
  dadosTributarios: MunicipalTaxDetails;
  rawPayload?: any;
}

export interface NfseItem {
  id: string; // e.g. "OP-2026-9812"
  tenantId: string;
  clientName: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  tomadorEmail: string;
  tomadorEndereco: string;
  tomadorCidadeUf: string;
  
  operationType: NfseOperationType;
  operationDescription: string;
  cnae: string;
  itemListaServico: string;
  
  paymentDate: string; // e.g. "2026-08-28"
  grossAmountBrl: number; // Valor Total Pago pelo Cliente
  partnerSplitPct: number; // e.g. 0% for SaaS, 40% for tax partner
  partnerSplitAmountBrl: number;
  partnerName?: string;
  partnerCnpj?: string;
  
  velatrixRetainedAmountBrl: number; // Parcela Líquida Velatrix = Base de Cálculo NFS-e
  issRatePct: number; // e.g. 2.0% or 5.0%
  issAmountBrl: number;
  
  nfseNumber: string; // e.g. "NFS-e 2026/0009412" or "Pendente"
  rpsNumber: string;
  rpsSerie: string;
  verificationCode: string; // e.g. "8F2A-9C3E-10D4"
  status: NfseStatus;
  emissionDate: string;
  rejectionReason?: string;
  
  municipalResponse: MunicipalResponsePayload;
  transmissionEventsCount?: number;
}

export interface NfseEventLog {
  id: string;
  nfseId: string;
  timestamp: string;
  eventType: 'PAYMENT_LIQUIDATED' | 'SPLIT_CALCULATED' | 'RPS_GENERATED' | 'MUNICIPAL_TRANSMISSION' | 'SEFAZ_AUTHORIZED' | 'REJECTION_ERROR' | 'MANUAL_REEMISSION' | 'EMAIL_DISPATCHED';
  description: string;
  source: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  details?: any;
}

export interface NfseSummaryMetrics {
  totalGrossBilledBrl: number;
  totalVelatrixNetBrl: number;
  totalEmittedCount: number;
  totalEmittedValueBrl: number;
  pendingCount: number;
  rejectedCount: number;
  nextClosingBatchDate: string;
  nextClosingBatchName: string;
}
