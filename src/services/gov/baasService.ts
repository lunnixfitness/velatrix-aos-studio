/**
 * VELATRIX AOS V2 - SERVIÇO DE BANKING-AS-A-SERVICE (BAAS) & SPLIT DE HONORÁRIOS
 * Gestão de subcontas judiciais/tributárias e split automático 50/50 via Asaas/Stark/Celcoin.
 */

import {
  BaasConfig,
  BaasSubaccount,
  BaasSplitChargeInstruction,
  BaasProvider,
} from '../../types/integrationConnectors';
import {
  saveBaasSubaccount,
  getBaasSubaccountsSync,
  listBaasSubaccounts,
} from '../../server/repositories/partnerRepository';
import {
  saveBaasSplitCharge,
  getBaasSplitChargesSync,
  listBaasSplitCharges,
  settleBaasSplitChargeSync,
} from '../../server/repositories/splitRepository';
import { AuditLedgerService } from './auditLedgerService';
import { secureRandomUUID } from './cryptoUtils';

export const INITIAL_BAAS_CONFIG: BaasConfig = {
  provider: 'ASAAS',
  environment: 'PRODUCTION',
  clientId: 'velatrix_baas_prod_sa_east_1',
  apiKeyMasked: 'prod_sec_************************************8912',
  webhookSecretMasked: 'whsec_**********************************4f2a',
  webhookEndpointUrl: 'https://velatrix.ai/api/v1/baas/webhook/settlement',
  mtlsMutualCertConfigured: true,
  pixInstantSettlementActive: true,
  bacenDirectRouting: true
};

export const INITIAL_SUBCONF_ACCOUNTS: BaasSubaccount[] = [
  {
    id: 'subacc_oab_01',
    provider: 'ASAAS',
    subaccountIdOnProvider: 'cus_sub_00091823',
    holderName: 'Vasconcelos & Prado Advogados Associados',
    holderCnpjCpf: '32.189.440/0001-92',
    holderType: 'ADVOGADO_PARCEIRO',
    registrationCode: 'OAB/SP 241.809',
    walletBalanceBrl: 214500.00,
    pixKey: 'financeiro@vasconcelosprado.adv.br',
    bankAccount: {
      bankCode: '341',
      bankName: 'Itaú Unibanco S/A',
      agency: '0912',
      accountNumber: '44819-2'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-01-10T14:00:00Z'
  },
  {
    id: 'subacc_crc_02',
    provider: 'ASAAS',
    subaccountIdOnProvider: 'cus_sub_00091824',
    holderName: 'Meirelles Perícias Contábeis Eireli',
    holderCnpjCpf: '44.901.222/0001-30',
    holderType: 'PERITO_CONTABIL',
    registrationCode: 'CRC/SP 1SP298711',
    walletBalanceBrl: 94200.00,
    pixKey: 'pix@meirellespericias.com.br',
    bankAccount: {
      bankCode: '033',
      bankName: 'Banco Santander Brasil',
      agency: '2100',
      accountNumber: '13009412-8'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-02-14T09:30:00Z'
  }
];

export const INITIAL_SPLIT_INSTRUCTIONS: BaasSplitChargeInstruction[] = [
  {
    chargeId: 'split_chg_2026_9941',
    tenantId: 'tenant_nexus_01',
    taxCaseId: 'CASE-REC-001',
    valorTotalHonorariosBrl: 100000.00,
    metodoPagamento: 'PIX_DINAMICO',
    clienteDevedor: {
      razaoSocial: 'Nexus Indústria & Manufatura S/A',
      cnpj: '18.492.301/0001-84',
      email: 'cfo@nexusindustria.com.br'
    },
    splitRules: {
      partnerSubaccountId: 'subacc_oab_01',
      partnerName: 'Vasconcelos & Prado Advogados Associados',
      partnerPercentage: 100.0, // P23: Velatrix não participa de honorários
      partnerAmountBrl: 100000.00,
      partnerPixKey: 'financeiro@vasconcelosprado.adv.br',
      partnerNfseStatus: 'EMITIDA',
      velatrixSubaccountId: 'subacc_velatrix_master',
      velatrixPercentage: 0.0,
      velatrixAmountBrl: 0.00,
      velatrixNfseStatus: 'EMITIDA'
    },
    status: 'SPLIT_CONCLUIDO',
    pixPayloadQrCode: '00020101021226840014br.gov.bcb.pix2562pix.velatrix.ai/qr/v2/split_chg_2026_99415204000053039865408100000.005802BR5925VELATRIX TECNOLOGIA LTDA6009SAO PAULO62070503***63048F1A',
    boletoLinhaDigitavel: '34191.79001 01043.510047 91020.150008 1 98400001000000',
    dataCriacao: '2026-09-10 11:20:00',
    dataVencimento: '2026-09-15',
    dataLiquidacao: '2026-09-12 14:22:18',
    endToEndBacenId: 'E18492301202609121422s9941824a7'
  }
];

export class BaasService {
  /**
   * [MODO SIMULADO - EMULADOR DE SUBCONTA BAAS]
   * Criação de subconta vinculada no parceiro BaaS.
   */
  static createBaasSubaccount(payload: {
    provider: BaasProvider;
    holderName: string;
    holderCnpjCpf: string;
    holderType: 'ADVOGADO_PARCEIRO' | 'PERITO_CONTABIL';
    registrationCode: string;
    pixKey: string;
    bankAccount: {
      bankCode: string;
      bankName: string;
      agency: string;
      accountNumber: string;
    };
  }, clientIp?: string): BaasSubaccount {
    const rawUuid = secureRandomUUID().replace(/-/g, '');
    const subaccInt = (parseInt(rawUuid.substring(0, 8), 16) % 90000000) + 10000000;
    const subaccount: BaasSubaccount = {
      id: `subacc_${Date.now()}_${rawUuid.substring(8, 12)}`,
      provider: payload.provider,
      subaccountIdOnProvider: `cus_sub_${subaccInt}`,
      holderName: payload.holderName,
      holderCnpjCpf: payload.holderCnpjCpf,
      holderType: payload.holderType,
      registrationCode: payload.registrationCode,
      walletBalanceBrl: 0.00,
      pixKey: payload.pixKey,
      bankAccount: payload.bankAccount,
      kycStatus: 'APROVADO_BACEN',
      createdAt: new Date().toISOString(),
      isSimulated: true
    };

    // Salva no repositório persistente (Prisma / Postgres com fallback)
    saveBaasSubaccount(subaccount).catch(err => {
      console.warn('[BaasService.createBaasSubaccount] Persist warning:', err);
    });

    AuditLedgerService.createAuditEntry({
      portalGoverno: 'BAAS_BACEN',
      endpoint: `/api/v3/subaccounts/create`,
      metodoHttp: 'POST',
      cnpjConsultado: payload.holderCnpjCpf,
      certificadoA1Thumbprint: 'baas_oauth_token_sha256',
      httpStatus: 201,
      tempoRespostaMs: 120,
      clientIp
    });

    return subaccount;
  }

  static getSubaccounts(): BaasSubaccount[] {
    return getBaasSubaccountsSync();
  }

  static async listSubaccounts(): Promise<BaasSubaccount[]> {
    return listBaasSubaccounts();
  }

  /**
   * [MODO SIMULADO - EMULADOR DE COBRANÇA E SPLIT 50/50 BAAS]
   * Emite cobrança com regras de split automático na liquidação.
   */
  static createSplitCharge(payload: {
    tenantId: string;
    taxCaseId: string;
    valorTotalHonorariosBrl: number;
    metodoPagamento: 'PIX_DINAMICO' | 'BOLETO_HIBRIDO';
    partnerSubaccountId: string;
    clienteDevedor: {
      razaoSocial: string;
      cnpj: string;
      email: string;
    };
  }, clientIp?: string): BaasSplitChargeInstruction {
    const subaccounts = getBaasSubaccountsSync();
    const partner = subaccounts.find(s => s.id === payload.partnerSubaccountId) || subaccounts[0];
    // P23: 100% dos honorários ao(s) profissional(is); a Velatrix cobra apenas licença SaaS + uso.
    const rawUuid = secureRandomUUID().replace(/-/g, '');
    const chargeId = `split_chg_${Date.now()}_${rawUuid.substring(0, 4)}`;
    const pixCrc = rawUuid.substring(4, 8).toUpperCase();
    const b1 = (parseInt(rawUuid.substring(8, 13), 16) % 90000) + 10000;
    const b2 = (parseInt(rawUuid.substring(13, 18), 16) % 90000) + 10000;

    const instruction: BaasSplitChargeInstruction = {
      chargeId,
      tenantId: payload.tenantId,
      taxCaseId: payload.taxCaseId,
      valorTotalHonorariosBrl: payload.valorTotalHonorariosBrl,
      metodoPagamento: payload.metodoPagamento,
      clienteDevedor: payload.clienteDevedor,
      splitRules: {
        partnerSubaccountId: partner.id,
        partnerName: partner.holderName,
        partnerPercentage: 100.0, // P23: Velatrix não participa de honorários
        partnerAmountBrl: payload.valorTotalHonorariosBrl,
        partnerPixKey: partner.pixKey,
        partnerNfseStatus: 'PENDENTE',
        velatrixSubaccountId: 'subacc_velatrix_master',
        velatrixPercentage: 0.0,
        velatrixAmountBrl: 0,
        velatrixNfseStatus: 'PENDENTE'
      },
      status: 'PENDENTE_PAGAMENTO',
      pixPayloadQrCode: `00020101021226840014br.gov.bcb.pix2562pix.velatrix.ai/qr/v2/${chargeId}5204000053039865408${payload.valorTotalHonorariosBrl.toFixed(2)}5802BR5925VELATRIX TECNOLOGIA LTDA6009SAO PAULO62070503***6304${pixCrc}`,
      boletoLinhaDigitavel: `34191.79001 ${b1}.510047 ${b2}.150008 1 9840000${Math.floor(payload.valorTotalHonorariosBrl)}`,
      dataCriacao: new Date().toISOString().replace('T', ' ').substring(0, 19),
      dataVencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
      isSimulated: true
    };

    // Salva no repositório persistente (Prisma / Postgres com fallback)
    saveBaasSplitCharge(instruction).catch(err => {
      console.warn('[BaasService.createSplitCharge] Persist warning:', err);
    });

    AuditLedgerService.createAuditEntry({
      portalGoverno: 'BAAS_BACEN',
      endpoint: `/api/v3/payments/split-charge`,
      metodoHttp: 'POST',
      cnpjConsultado: payload.clienteDevedor.cnpj,
      certificadoA1Thumbprint: 'baas_direct_bacen_auth',
      httpStatus: 200,
      tempoRespostaMs: 85,
      clientIp
    });

    return instruction;
  }

  static getSplitCharges(): BaasSplitChargeInstruction[] {
    return getBaasSplitChargesSync();
  }

  static async listSplitCharges(): Promise<BaasSplitChargeInstruction[]> {
    return listBaasSplitCharges();
  }

  /**
   * [MODO SIMULADO - EMULADOR DE WEBHOOK DE LIQUIDAÇÃO E DUPLA NFS-E]
   * Processa liquidação do webhook e split 50/50.
   */
  static settleSplitChargeWebhook(chargeId: string, clientIp?: string): {
    charge: BaasSplitChargeInstruction | null;
    dualNfseTriggered: boolean;
    partnerNfseNumber: string;
    velatrixNfseNumber: string;
    bacenEndToEndId: string;
    isSimulated: boolean;
  } {
    // Processa no repositório persistente (Prisma / Postgres com fallback)
    const result = settleBaasSplitChargeSync(chargeId);
    if (!result.charge) {
      return {
        charge: null,
        dualNfseTriggered: false,
        partnerNfseNumber: '',
        velatrixNfseNumber: '',
        bacenEndToEndId: '',
        isSimulated: true
      };
    }

    AuditLedgerService.createAuditEntry({
      portalGoverno: 'BAAS_BACEN',
      endpoint: '/api/v1/baas/webhook/settlement',
      metodoHttp: 'POST',
      cnpjConsultado: result.charge.clienteDevedor.cnpj,
      certificadoA1Thumbprint: 'bacen_instant_settlement_hash',
      httpStatus: 200,
      tempoRespostaMs: 44,
      clientIp
    });

    return result;
  }
}

export const createBaasSubaccount = BaasService.createBaasSubaccount;
export const getSubaccounts = BaasService.getSubaccounts;
export const listSubaccounts = BaasService.listSubaccounts;
export const createSplitCharge = BaasService.createSplitCharge;
export const getSplitCharges = BaasService.getSplitCharges;
export const listSplitCharges = BaasService.listSplitCharges;
export const settleSplitChargeWebhook = BaasService.settleSplitChargeWebhook;
