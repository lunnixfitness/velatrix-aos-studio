import { PartnerPayoutAccount, PartnerPayoutType, PayoutApprovalSignature } from '../types/partnerPayout';
import { secureId } from '../lib/demoMode';

const STORAGE_KEY = 'velatrix_partner_payout_accounts_v1';

const INITIAL_HOMOLOGATED_ACCOUNT: PartnerPayoutAccount = {
  id: 'payout_acc_vasconcelos_01',
  partnerId: 'partner_vasconcelos_adv',
  tenantId: 'tenant_nexus_01',
  partnerName: 'Vasconcelos & Associados Direito Tributário',
  payoutType: 'PIX_CNPJ',
  pixKeyMasked: '48.912.***/***1-04',
  pixKeyRaw: '48.912.384/0001-04',
  beneficiaryName: 'Vasconcelos & Associados Sociedade de Advogados',
  beneficiaryDocumentMasked: '48.912.***/***1-04',
  status: 'homologado',
  createdAt: '2026-06-15T10:00:00Z',
  requestedBy: {
    email: 'parceiro@vasconcelosadv.com.br',
    name: 'Dr. Henrique Vasconcelos',
    role: 'parceiro_tributario'
  },
  requiredQuorum: 2,
  approvals: [
    {
      id: 'sig_init_01',
      approverEmail: 'cfo@velatrix.ai',
      approverName: 'Mariana Duarte (CFO)',
      approverRole: 'cfo_executive',
      signedAt: '2026-06-15T11:30:00Z',
      ipAddress: '177.18.230.12',
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      decision: 'APPROVED',
      justification: 'Homologação inicial de contrato tributário e domicílio bancário verificado via DICT.'
    },
    {
      id: 'sig_init_02',
      approverEmail: 'admin@velatrix.ai',
      approverName: 'Marcos Vianna (SecOps Super-Admin)',
      approverRole: 'super_admin',
      signedAt: '2026-06-15T11:45:00Z',
      ipAddress: '189.40.12.99',
      signatureHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      decision: 'APPROVED',
      justification: 'Conformidade com a Invariante de Segurança e Split Bancário.'
    }
  ],
  externalValidationReceipt: {
    provider: 'Bacen DICT / SPI Gateway (Mock Orquestrado)',
    dictValidationStatus: 'MATCH_EXACT',
    validatedAt: '2026-06-15T10:05:00Z',
    ispb: '60701190' // Banco Itaú Unibanco
  },
  auditHash: '0x8f2a91bc40284e5781a9f930e42d765bc1049281'
};

export class PayoutValidationGateway {
  private static getStoredAccounts(): PartnerPayoutAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([INITIAL_HOMOLOGATED_ACCOUNT]));
        return [INITIAL_HOMOLOGATED_ACCOUNT];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_HOMOLOGATED_ACCOUNT];
    }
  }

  private static saveAccounts(accounts: PartnerPayoutAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.error('Falha ao persistir contas de payout', e);
    }
  }

  public static getAccountsForPartner(partnerId: string = 'partner_vasconcelos_adv'): {
    activeHomologatedAccount: PartnerPayoutAccount | null;
    pendingQuarantineAccount: PartnerPayoutAccount | null;
    history: PartnerPayoutAccount[];
  } {
    const all = this.getStoredAccounts().filter(a => a.partnerId === partnerId || !a.partnerId);
    const activeHomologatedAccount = all.find(a => a.status === 'homologado') || null;
    const pendingQuarantineAccount = all.find(a => a.status === 'quarantine' || a.status === 'pending_homologacao') || null;
    
    return {
      activeHomologatedAccount,
      pendingQuarantineAccount,
      history: all
    };
  }

  public static maskDocument(doc: string): string {
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}.***.***-${clean.slice(9)}`;
    }
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.***/***${clean.slice(11, 12)}-${clean.slice(12)}`;
    }
    return doc.length > 6 ? `${doc.slice(0, 3)}***${doc.slice(-2)}` : '***';
  }

  public static maskPixKey(key: string, type: PartnerPayoutType): string {
    const trimmed = key.trim();
    if (type === 'PIX_EMAIL') {
      const parts = trimmed.split('@');
      if (parts.length === 2) {
        const user = parts[0];
        const domain = parts[1];
        return `${user.slice(0, 2)}***@${domain}`;
      }
    }
    if (type === 'PIX_TELEFONE') {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `(${digits.slice(0, 2)}) *****-${digits.slice(-4)}`;
      }
    }
    if (type === 'PIX_CPF' || type === 'PIX_CNPJ') {
      return this.maskDocument(trimmed);
    }
    if (trimmed.length > 8) {
      return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
    }
    return `${trimmed.slice(0, 2)}***`;
  }

  /**
   * Simula a validação externa de titularidade via DICT / SPI
   */
  public static async validateExternalTitularity(
    payoutType: PartnerPayoutType,
    keyOrData: string,
    beneficiaryName: string,
    beneficiaryDoc: string
  ): Promise<{
    isValid: boolean;
    provider: string;
    dictStatus: 'MATCH_EXACT' | 'MATCH_PARTIAL' | 'NAME_MISMATCH';
    ispb: string;
    message: string;
  }> {
    // Simula delay de rede de consulta ao DICT
    await new Promise(res => setTimeout(res, 800));

    const cleanDoc = beneficiaryDoc.replace(/\D/g, '');
    if (cleanDoc.length < 11) {
      throw new Error('Documento do titular inválido para consulta ao DICT/SPI.');
    }

    return {
      isValid: true,
      provider: 'Gateway Bacen SPI / Open Finance (Mock Interoperável)',
      dictStatus: 'MATCH_EXACT',
      ispb: '00000000',
      message: 'Titularidade e chave validadas com sucesso na infraestrutura DICT/Bacen.'
    };
  }

  /**
   * Submete uma nova solicitação de alteração/cadastro de conta para Quarentena
   */
  public static async requestAccountHomologation(params: {
    partnerId: string;
    tenantId: string;
    partnerName: string;
    payoutType: PartnerPayoutType;
    pixKeyRaw?: string;
    bankDetails?: {
      bankCode: string;
      bankName: string;
      agency: string;
      accountNumber: string;
      accountType: 'CORRENTE' | 'POUPANCA' | 'PAGAMENTO';
    };
    beneficiaryName: string;
    beneficiaryDocumentRaw: string;
    requestedBy: {
      email: string;
      name: string;
      role: string;
    };
    quorumRequired?: number;
  }): Promise<PartnerPayoutAccount> {
    const externalVal = await this.validateExternalTitularity(
      params.payoutType,
      params.pixKeyRaw || params.bankDetails?.accountNumber || '',
      params.beneficiaryName,
      params.beneficiaryDocumentRaw
    );

    const accounts = this.getStoredAccounts();

    // Data de quarentena de 48h
    const quarantineDate = new Date();
    quarantineDate.setHours(quarantineDate.getHours() + 48);

    const pixKeyMasked = params.pixKeyRaw 
      ? this.maskPixKey(params.pixKeyRaw, params.payoutType) 
      : undefined;

    const bankDetailsMasked = params.bankDetails ? {
      bankCode: params.bankDetails.bankCode,
      bankName: params.bankDetails.bankName,
      agencyMasked: params.bankDetails.agency,
      accountNumberMasked: `***${params.bankDetails.accountNumber.slice(-3)}`,
      accountType: params.bankDetails.accountType
    } : undefined;

    const newAccount: PartnerPayoutAccount = {
      id: `payout_acc_${Date.now()}_${secureId('', 4)}`,
      partnerId: params.partnerId,
      tenantId: params.tenantId,
      partnerName: params.partnerName,
      payoutType: params.payoutType,
      pixKeyMasked,
      pixKeyRaw: params.pixKeyRaw,
      bankDetailsMasked,
      beneficiaryName: params.beneficiaryName,
      beneficiaryDocumentMasked: this.maskDocument(params.beneficiaryDocumentRaw),
      status: 'quarantine',
      quarantineExpiresAt: quarantineDate.toISOString(),
      createdAt: new Date().toISOString(),
      requestedBy: params.requestedBy,
      requiredQuorum: params.quorumRequired || 2,
      approvals: [],
      externalValidationReceipt: {
        provider: externalVal.provider,
        dictValidationStatus: externalVal.dictStatus,
        validatedAt: new Date().toISOString(),
        ispb: externalVal.ispb
      },
      auditHash: `0x${secureId('', 8)}${secureId('', 8)}`
    };

    // Remove pendências anteriores em quarentena (substituídas pela mais recente)
    const updated = accounts.map(a => {
      if (a.status === 'quarantine' || a.status === 'pending_homologacao') {
        return { ...a, status: 'substituido' as const };
      }
      return a;
    });

    updated.unshift(newAccount);
    this.saveAccounts(updated);

    return newAccount;
  }

  /**
   * Assina a aprovação de uma conta em quarentena
   */
  public static signApproval(
    accountId: string,
    signer: {
      email: string;
      name: string;
      role: string;
    },
    decision: 'APPROVED' | 'REJECTED',
    justification: string = 'Assinatura digital de conformidade com os termos de repasse e liquidação bancária.'
  ): { updatedAccount: PartnerPayoutAccount; wasHomologated: boolean } {
    const accounts = this.getStoredAccounts();
    const targetIdx = accounts.findIndex(a => a.id === accountId);

    if (targetIdx === -1) {
      throw new Error('Conta para homologação não encontrada.');
    }

    const target = accounts[targetIdx];

    if (target.status !== 'quarantine' && target.status !== 'pending_homologacao') {
      throw new Error(`Esta conta não está em estado de quarentena (Status atual: ${target.status}).`);
    }

    // Verifica se este aprovador já assinou
    const alreadySigned = target.approvals.some(sig => sig.approverEmail.toLowerCase() === signer.email.toLowerCase());
    if (alreadySigned) {
      throw new Error('Você já realizou a assinatura de auditoria para esta solicitação.');
    }

    const newSignature: PayoutApprovalSignature = {
      id: `sig_${Date.now()}_${secureId('', 4)}`,
      approverEmail: signer.email,
      approverName: signer.name,
      approverRole: signer.role,
      signedAt: new Date().toISOString(),
      ipAddress: '177.45.190.88',
      signatureHash: `0x${secureId('', 8)}${secureId('', 8)}`,
      decision,
      justification
    };

    const newApprovals = [...target.approvals, newSignature];
    let newStatus: import('../types/partnerPayout').PayoutAccountStatus = target.status;
    let wasHomologated = false;

    if (decision === 'REJECTED') {
      newStatus = 'rejeitado';
    } else {
      const approvedCount = newApprovals.filter(a => a.decision === 'APPROVED').length;
      if (approvedCount >= target.requiredQuorum) {
        newStatus = 'homologado';
        wasHomologated = true;
      }
    }

    // Atualiza a lista
    let updatedAccounts = accounts.map((acc, idx) => {
      if (idx === targetIdx) {
        return {
          ...acc,
          approvals: newApprovals,
          status: newStatus
        };
      }
      // Se a conta atual foi homologada, marca a conta anterior homologada como 'substituido'
      if (wasHomologated && acc.status === 'homologado' && acc.id !== target.id) {
        return {
          ...acc,
          status: 'substituido' as const
        };
      }
      return acc;
    });

    this.saveAccounts(updatedAccounts);

    const updatedAccount = updatedAccounts.find(a => a.id === accountId)!;
    return {
      updatedAccount,
      wasHomologated
    };
  }
}
