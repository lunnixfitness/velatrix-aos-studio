export type PartnerPayoutType = 
  | 'PIX_CNPJ' 
  | 'PIX_CPF' 
  | 'PIX_EMAIL' 
  | 'PIX_TELEFONE' 
  | 'PIX_ALEATORIA' 
  | 'CONTA_BANCARIA';

export type PayoutAccountStatus = 
  | 'pending_homologacao' 
  | 'quarantine' 
  | 'homologado' 
  | 'rejeitado' 
  | 'substituido';

export interface PayoutApprovalSignature {
  id: string;
  approverEmail: string;
  approverName: string;
  approverRole: string;
  signedAt: string;
  ipAddress: string;
  signatureHash: string;
  decision: 'APPROVED' | 'REJECTED';
  justification?: string;
}

export interface BankAccountDetails {
  bankCode: string;
  bankName: string;
  agency: string;
  accountNumber: string;
  accountType: 'CORRENTE' | 'POUPANCA' | 'PAGAMENTO';
}

export interface PartnerPayoutAccount {
  id: string;
  partnerId: string;
  tenantId: string;
  partnerName: string;
  payoutType: PartnerPayoutType;
  
  // Mascarados para exibição segura
  pixKeyMasked?: string;
  pixKeyRaw?: string; // Armazenado com criptografia simulada
  
  bankDetailsMasked?: {
    bankCode: string;
    bankName: string;
    agencyMasked: string;
    accountNumberMasked: string;
    accountType: string;
  };
  
  beneficiaryName: string;
  beneficiaryDocumentMasked: string;
  
  status: PayoutAccountStatus;
  
  quarantineExpiresAt?: string;
  createdAt: string;
  requestedBy: {
    email: string;
    name: string;
    role: string;
  };
  
  requiredQuorum: number;
  approvals: PayoutApprovalSignature[];
  
  externalValidationReceipt?: {
    provider: string;
    dictValidationStatus: 'MATCH_EXACT' | 'MATCH_PARTIAL' | 'NAME_MISMATCH' | 'FAILED';
    validatedAt: string;
    ispb: string;
  };

  auditHash: string;
}
