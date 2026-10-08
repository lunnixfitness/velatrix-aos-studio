/**
 * VELATRIX AOS V2 - SERVIÇO DE CONECTORES GOVERNAMENTAIS & BAAS (FACADE PRINCIPAL)
 * 
 * Este arquivo atua como ponto de entrada e Facade consolidado para os módulos
 * divididos por domínio em `src/services/gov/`:
 *   - vaultService.ts (Certificados A1 e procurações)
 *   - mtlsService.ts (Handshake mTLS TLS 1.3 com órgãos federais)
 *   - ecacPgfnService.ts (e-CAC / SERPRO, PGFN REGULARIZE, PER/DCOMP)
 *   - baasService.ts (Banking-as-a-Service, Subcontas e Split 50/50)
 *   - auditLedgerService.ts (Trilha pericial de auditoria LGPD com IP real)
 * 
 * Mantém 100% de compatibilidade com a API consumida por server.ts e UI.
 */

import {
  listVaultCertificates,
} from '../server/repositories/tenantRepository';
import {
  listPerDcompReceipts,
} from '../server/repositories/taxCalculationRepository';
import {
  listBaasSubaccounts,
} from '../server/repositories/partnerRepository';
import {
  listBaasSplitCharges,
} from '../server/repositories/splitRepository';
import {
  listGovAuditEntries,
} from '../server/repositories/auditLedgerRepository';

import { VaultService } from './gov/vaultService';
import { MtlsService } from './gov/mtlsService';
import { EcacPgfnService } from './gov/ecacPgfnService';
import { BaasService } from './gov/baasService';
import { AuditLedgerService } from './gov/auditLedgerService';

import {
  CertificateVaultRecord,
  MtlsTestResult,
  PerDcompTransmissionPayload,
  PerDcompReceipt,
  BaasSubaccount,
  BaasSplitChargeInstruction,
  GovAuditLedgerEntry,
  BaasProvider,
  VaultProvider
} from '../types/integrationConnectors';

// Re-exporta todos os módulos e constantes de domínio
export * from './gov';

/**
 * Facade principal GovConnectorService
 * Delega as chamadas para os serviços especializados de cada domínio.
 */
export class GovConnectorService {
  /**
   * Sincroniza / hidrata o estado de conectores com o banco de dados Prisma/Postgres
   */
  static async hydrateFromRepositories(): Promise<void> {
    try {
      await Promise.allSettled([
        listVaultCertificates(),
        listPerDcompReceipts(),
        listBaasSubaccounts(),
        listBaasSplitCharges(),
        listGovAuditEntries(),
      ]);
    } catch (err) {
      console.warn('[GovConnectorService.hydrateFromRepositories] Falha na hidratação:', err);
    }
  }

  // --- 1. VAULT & CERTIFICADOS A1 ---
  static async registerA1Certificate(payload: {
    alias: string;
    ownerType: 'CLIENT' | 'PARTNER_LAWYER' | 'PARTNER_ACCOUNTANT';
    ownerName: string;
    cnpjCpf: string;
    oabCrcNumber?: string;
    keyVaultProvider: VaultProvider;
  }, clientIp?: string): Promise<CertificateVaultRecord> {
    return VaultService.registerA1Certificate(payload, clientIp);
  }

  static getCertificates(): CertificateVaultRecord[] {
    return VaultService.getCertificates();
  }

  // --- 2. mTLS HANDSHAKE ---
  static async testMtlsHandshake(
    targetPortal: 'RECEITA_FEDERAL_ECAC' | 'PGFN_REGULARIZE' | 'SEFAZ_NACIONAL_NFE' | 'MTE_DET',
    certId: string,
    clientIp?: string
  ): Promise<MtlsTestResult> {
    return MtlsService.testMtlsHandshake(targetPortal, certId, clientIp);
  }

  // --- 3. RECEITA FEDERAL e-CAC & PER/DCOMP ---
  static async transmitPerDcomp(payload: PerDcompTransmissionPayload, clientIp?: string): Promise<PerDcompReceipt> {
    return EcacPgfnService.transmitPerDcomp(payload, clientIp);
  }

  static getPerDcomps(): PerDcompReceipt[] {
    return EcacPgfnService.getPerDcomps();
  }

  // --- 4. BANKING-AS-A-SERVICE & SPLIT ---
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
    return BaasService.createBaasSubaccount(payload, clientIp);
  }

  static getSubaccounts(): BaasSubaccount[] {
    return BaasService.getSubaccounts();
  }

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
    return BaasService.createSplitCharge(payload, clientIp);
  }

  static getSplitCharges(): BaasSplitChargeInstruction[] {
    return BaasService.getSplitCharges();
  }

  static settleSplitChargeWebhook(chargeId: string, clientIp?: string): {
    charge: BaasSplitChargeInstruction | null;
    dualNfseTriggered: boolean;
    partnerNfseNumber: string;
    velatrixNfseNumber: string;
    bacenEndToEndId: string;
    isSimulated: boolean;
  } {
    return BaasService.settleSplitChargeWebhook(chargeId, clientIp);
  }

  // --- 5. AUDIT LEDGER (LGPD & TRILHA PERICIAL) ---
  static async createAuditEntry(
    params: {
      portalGoverno: GovAuditLedgerEntry['portalGoverno'];
      endpoint: string;
      metodoHttp: 'GET' | 'POST';
      cnpjConsultado: string;
      certificadoA1Thumbprint: string;
      httpStatus: number;
      tempoRespostaMs: number;
      clientIp?: string;
    },
    clientIpOrReq?: string | { ip?: string; headers?: Record<string, any>; socket?: { remoteAddress?: string } }
  ): Promise<GovAuditLedgerEntry> {
    return AuditLedgerService.createAuditEntry(params, clientIpOrReq);
  }

  static getAuditLogs(): GovAuditLedgerEntry[] {
    return AuditLedgerService.getAuditLogs();
  }
}

// Dispara hidratação em background na inicialização
if (typeof process !== 'undefined') {
  GovConnectorService.hydrateFromRepositories().catch(() => {});
}
