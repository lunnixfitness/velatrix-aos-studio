/**
 * VELATRIX AOS V2 - COFRE DE CERTIFICADOS DIGITAIS A1 & PROCURAÇÕES (VAULT A1)
 * Custódia segura de certificados digitais e-CNPJ/e-CPF ICP-Brasil com AWS KMS / HashiCorp Vault.
 */

import { sha256Hex, hashCanonical } from '../../shared/crypto/hash';
import {
  CertificateVaultRecord,
  GovProxyAuthorization,
  VaultProvider,
} from '../../types/integrationConnectors';
import {
  saveVaultCertificate,
  getVaultCertificatesSync,
  listVaultCertificates,
} from '../../server/repositories/tenantRepository';
import { AuditLedgerService } from './auditLedgerService';
import { secureRandomUUID } from './cryptoUtils';

export const INITIAL_CERTIFICATES: CertificateVaultRecord[] = [
  {
    id: 'cert_vault_01',
    alias: 'Certificado Matriz Nexus Indústria A1',
    ownerType: 'CLIENT',
    ownerName: 'Nexus Indústria & Manufatura S/A',
    cnpjCpf: '18.492.301/0001-84',
    serialNumber: '7A8F:9021:B43C:5519:E092',
    issuerCN: 'AC SERPRO RFB v5',
    thumbprintSha256: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    validFrom: '2025-11-10T00:00:00Z',
    validUntil: '2026-11-10T23:59:59Z',
    daysRemaining: 55,
    status: 'VALID',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:102115117989:key/velatrix-vault-a1-nexus-prod',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-16T11:15:00Z',
    auditHash: '0x3a4f89b1c2d3e4f506172839405a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3'
  },
  {
    id: 'cert_vault_02',
    alias: 'Dr. Leonardo Vasconcelos (OAB/SP 241.809)',
    ownerType: 'PARTNER_LAWYER',
    ownerName: 'Vasconcelos & Prado Advogados Tributaristas',
    cnpjCpf: '32.189.440/0001-92',
    oabCrcNumber: 'OAB/SP 241.809',
    serialNumber: '4B11:9C82:EE10:7743:A881',
    issuerCN: 'AC Certisign Multipla v10',
    thumbprintSha256: '3e4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef01',
    validFrom: '2026-01-15T00:00:00Z',
    validUntil: '2027-01-15T23:59:59Z',
    daysRemaining: 121,
    status: 'VALID',
    keyVaultProvider: 'HASHICORP_VAULT',
    kmsKeyIdArn: 'vault:secret/data/partners/oab-sp-241809/a1_key',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-15T18:40:22Z',
    auditHash: '0x8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7'
  },
  {
    id: 'cert_vault_03',
    alias: 'Dra. Claudia Meirelles (CRC/SP 1SP298711)',
    ownerType: 'PARTNER_ACCOUNTANT',
    ownerName: 'Meirelles Perícias & Auditoria Contábil',
    cnpjCpf: '44.901.222/0001-30',
    oabCrcNumber: 'CRC/SP 1SP298711',
    serialNumber: '11C0:F938:A234:65BC:3321',
    issuerCN: 'AC Soluti Multipla v5',
    thumbprintSha256: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    validFrom: '2026-03-01T00:00:00Z',
    validUntil: '2027-03-01T23:59:59Z',
    daysRemaining: 166,
    status: 'VALID',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:102115117989:key/velatrix-vault-crc-meirelles',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-14T09:12:00Z',
    auditHash: '0x445566778899aabbccddeeff00112233445566778899aabbccddeeff0011223'
  }
];

export const INITIAL_PROXIES: GovProxyAuthorization[] = [
  {
    id: 'proc_serpro_01',
    outorganteCnpj: '18.492.301/0001-84',
    outorganteRazaoSocial: 'Nexus Indústria & Manufatura S/A',
    outorgadoCnpjCpf: '32.189.440/0001-92',
    outorgadoNome: 'Vasconcelos & Prado Advogados Tributaristas',
    outorgadoPapel: 'ADVOGADO_TRIBUTARIO',
    procuracaoNumero: 'PROC-ECAC-2026/099824',
    dataEmissao: '2026-01-20',
    dataValidade: '2027-01-20',
    status: 'ATIVA',
    poderesDelegados: {
      pgdasD: true,
      efdContribuicoes: true,
      efdReinf: true,
      perDcomp: true,
      dividaAtivaPgfn: true,
      dteMensagens: true,
      cndCertidoes: true
    },
    hashSerpro: '0x99281a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f'
  },
  {
    id: 'proc_serpro_02',
    outorganteCnpj: '18.492.301/0001-84',
    outorganteRazaoSocial: 'Nexus Indústria & Manufatura S/A',
    outorgadoCnpjCpf: '44.901.222/0001-30',
    outorgadoNome: 'Meirelles Perícias & Auditoria Contábil',
    outorgadoPapel: 'PERITO_CONTABIL',
    procuracaoNumero: 'PROC-ECAC-2026/104712',
    dataEmissao: '2026-03-05',
    dataValidade: '2027-03-05',
    status: 'ATIVA',
    poderesDelegados: {
      pgdasD: true,
      efdContribuicoes: true,
      efdReinf: true,
      perDcomp: true,
      dividaAtivaPgfn: false,
      dteMensagens: true,
      cndCertidoes: true
    },
    hashSerpro: '0x1029384756abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  }
];

let proxiesState: GovProxyAuthorization[] = [...INITIAL_PROXIES];

export class VaultService {
  /**
   * [MODO SIMULADO - EMULADOR DE CUSTÓDIA VAULT A1 / AWS KMS]
   * Registra certificado digital A1 ICP-Brasil no cofre de chaves.
   */
  static async registerA1Certificate(payload: {
    alias: string;
    ownerType: 'CLIENT' | 'PARTNER_LAWYER' | 'PARTNER_ACCOUNTANT';
    ownerName: string;
    cnpjCpf: string;
    oabCrcNumber?: string;
    keyVaultProvider: VaultProvider;
  }, clientIp?: string): Promise<CertificateVaultRecord> {
    const rawUuid = secureRandomUUID().replace(/-/g, '').toUpperCase();
    const id = `cert_vault_${Date.now()}_${rawUuid.substring(0, 4).toLowerCase()}`;
    const serial = `A1:${rawUuid.substring(4, 8)}:${rawUuid.substring(8, 12)}:${rawUuid.substring(12, 16)}`;
    const thumbprint = await sha256Hex(`${id}:${payload.cnpjCpf}:${Date.now()}`);
    const now = new Date();
    const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    const auditHash = await hashCanonical(payload);

    const newRecord: CertificateVaultRecord = {
      id,
      alias: payload.alias,
      ownerType: payload.ownerType,
      ownerName: payload.ownerName,
      cnpjCpf: payload.cnpjCpf,
      oabCrcNumber: payload.oabCrcNumber,
      serialNumber: serial,
      issuerCN: 'AC SERPRO RFB v5 (ICP-Brasil)',
      thumbprintSha256: thumbprint,
      validFrom: now.toISOString(),
      validUntil: expiry.toISOString(),
      daysRemaining: 365,
      status: 'VALID',
      keyVaultProvider: payload.keyVaultProvider,
      kmsKeyIdArn: payload.keyVaultProvider === 'AWS_KMS' 
        ? `arn:aws:kms:sa-east-1:102115117989:key/${id}` 
        : `vault:secret/data/certs/${id}`,
      encryptionAlgorithm: 'AES-256-GCM',
      mTLSActive: true,
      icpBrasilCompliant: true,
      lastUsedAt: now.toISOString(),
      auditHash,
      isSimulated: true
    };

    // Salva no repositório persistente (Prisma / Postgres com fallback)
    saveVaultCertificate(newRecord).catch(err => {
      console.warn('[VaultService.registerA1Certificate] Persist warning:', err);
    });

    // Registra auditoria
    AuditLedgerService.createAuditEntry({
      portalGoverno: 'RECEITA_FEDERAL_ECAC',
      endpoint: '/vault/certificates/register',
      metodoHttp: 'POST',
      cnpjConsultado: payload.cnpjCpf,
      certificadoA1Thumbprint: thumbprint,
      httpStatus: 201,
      tempoRespostaMs: 140,
      clientIp
    });

    return newRecord;
  }

  static getCertificates(): CertificateVaultRecord[] {
    return getVaultCertificatesSync();
  }

  static async listCertificates(): Promise<CertificateVaultRecord[]> {
    return listVaultCertificates();
  }

  static getProxies(): GovProxyAuthorization[] {
    return proxiesState;
  }
}

export const registerA1Certificate = VaultService.registerA1Certificate;
export const getCertificates = VaultService.getCertificates;
export const listCertificates = VaultService.listCertificates;
export const getProxies = VaultService.getProxies;
