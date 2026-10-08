import { prisma, isPrismaActive } from '../../lib/prisma';
import { TenantProfile } from '../../types/aos';
import { INITIAL_MOCK_TENANTS } from '../../data/mockSuperAdmin';
import { CertificateVaultRecord } from '../../types/integrationConnectors';
import { exigirDemoOuFalhar } from '../http/erroBanco';
import { IS_DEMO_MODE } from '../../lib/demoMode';

/**
 * P24: o tenant jurídico de demonstração é definido em código (mockSuperAdmin.ts).
 * Bancos já populados com o seed antigo (plano PRO, rótulos industriais) não
 * devem rebaixar a demo — os campos comerciais do seed prevalecem só para ele.
 */
const DEMO_TENANT_ID = 'tenant_monteiro_law';
function aplicarSeedDemo(p: TenantProfile): TenantProfile {
  if (p.id !== DEMO_TENANT_ID) return p;
  const s = INITIAL_MOCK_TENANTS.find((x) => x.id === DEMO_TENANT_ID);
  if (!s) return p;
  return {
    ...p,
    plano: s.plano,
    planTier: s.planTier,
    sector: s.sector,
    sectorLabel: s.sectorLabel,
    mrrBrl: s.mrrBrl,
    connectedErp: s.connectedErp,
    connectedChannels: s.connectedChannels,
    regulatoryStandard: s.regulatoryStandard,
  };
}

function mapPrismaTenantToProfile(t: any): TenantProfile {
  return aplicarSeedDemo({
    id: t.id,
    name: t.nomeEmpresa,
    cnpj: t.cnpj,
    sector: (t.sector as any) || 'manufacturing',
    sectorLabel: t.sectorLabel || 'Manufatura & Automação Industrial',
    planTier: (t.plano as any) || 'PROFESSIONAL',
    status: ((t.status?.toLowerCase() as any) || 'active'),
    slug: t.slug || t.id,
    mrrBrl: Number(t.mrr || 19600),
    tokensConsumedMonthly: Number(t.tokensConsumedMonthly || 142000000),
    connectedErp: t.conectorERP || 'TOTVS Protheus',
    connectedChannels: t.connectedChannels || ['TOTVS Protheus ERP', 'Sefaz-SP NFe/CTe', 'Banco Santander API Open Finance'],
    enabledServices: t.enabledServices || ['tax_recovery', 'operational'],
    regulatoryStandard: 'Padrão Regulatório BR (SEFAZ/BACEN)',
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
    location: {
      city: t.city || 'São Paulo',
      state: t.state || 'SP',
      lat: -23.5505,
      lng: -46.6333,
    },
  });
}

export async function listTenants(): Promise<TenantProfile[]> {
  if (!isPrismaActive) {
    return [...INITIAL_MOCK_TENANTS];
  }
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { nomeEmpresa: 'asc' },
    });
    if (tenants && tenants.length > 0) {
      return tenants.map(mapPrismaTenantToProfile);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.listTenants');
    console.warn('[tenantRepository.listTenants] Prisma unreachable, using fallback datasets:', err);
  }
  return IS_DEMO_MODE ? [...INITIAL_MOCK_TENANTS] : [];
}

export async function getTenantById(id: string): Promise<TenantProfile | null> {
  if (!isPrismaActive) {
    const fallback = INITIAL_MOCK_TENANTS.find(t => t.id === id);
    return fallback ? { ...fallback } : null;
  }
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });
    if (tenant) {
      return mapPrismaTenantToProfile(tenant);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.getTenantById');
    console.warn(`[tenantRepository.getTenantById] Prisma unreachable for ${id}:`, err);
  }
  const fallback = IS_DEMO_MODE && INITIAL_MOCK_TENANTS.find(t => t.id === id);
  return fallback ? { ...fallback } : null;
}

export async function getTenantByCnpj(cnpj: string): Promise<TenantProfile | null> {
  if (!isPrismaActive) {
    const fallback = INITIAL_MOCK_TENANTS.find(t => t.cnpj === cnpj);
    return fallback ? { ...fallback } : null;
  }
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { cnpj },
    });
    if (tenant) {
      return mapPrismaTenantToProfile(tenant);
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.getTenantByCnpj');
    console.warn(`[tenantRepository.getTenantByCnpj] Prisma unreachable for ${cnpj}:`, err);
  }
  const fallback = IS_DEMO_MODE && INITIAL_MOCK_TENANTS.find(t => t.cnpj === cnpj);
  return fallback ? { ...fallback } : null;
}

export async function upsertTenant(data: Partial<TenantProfile>): Promise<TenantProfile> {
  const id = data.id || `tenant_${Date.now()}`;
  const cnpj = data.cnpj || '00.000.000/0001-00';
  const name = data.name || 'Nova Empresa';

  if (!isPrismaActive) {
    return {
      id,
      name,
      cnpj,
      sector: data.sector || 'manufacturing',
      sectorLabel: data.sectorLabel || 'Manufatura & Automação Industrial',
      planTier: data.planTier || 'PROFESSIONAL',
      status: data.status || 'active',
      slug: data.slug || id,
      mrrBrl: data.mrrBrl || 19600,
      tokensConsumedMonthly: data.tokensConsumedMonthly || 142000000,
      connectedErp: data.connectedErp || 'TOTVS Protheus',
      connectedChannels: data.connectedChannels || [],
      enabledServices: data.enabledServices || ['tax_recovery', 'operational'],
      regulatoryStandard: 'Padrão Regulatório BR (SEFAZ/BACEN)',
      createdAt: new Date().toISOString(),
      location: data.location || {
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5505,
        lng: -46.6333,
      },
    };
  }

  try {
    const saved = await prisma.tenant.upsert({
      where: { cnpj },
      update: {
        nomeEmpresa: name,
        plano: data.planTier || 'PROFESSIONAL',
        sector: data.sector,
        sectorLabel: data.sectorLabel,
        city: data.location?.city,
        state: data.location?.state,
      },
      create: {
        id,
        nomeEmpresa: name,
        cnpj,
        plano: data.planTier || 'PROFESSIONAL',
        conectorERP: data.connectedErp || 'TOTVS Protheus',
        sector: data.sector,
        sectorLabel: data.sectorLabel,
        city: data.location?.city || 'São Paulo',
        state: data.location?.state || 'SP',
      },
    });
    return mapPrismaTenantToProfile(saved);
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.upsertTenant');
    console.warn('[tenantRepository.upsertTenant] Prisma write fallback:', err);
    return {
      id,
      name,
      cnpj,
      sector: data.sector || 'manufacturing',
      sectorLabel: data.sectorLabel || 'Manufatura & Automação Industrial',
      planTier: data.planTier || 'PROFESSIONAL',
      status: data.status || 'active',
      slug: data.slug || id,
      mrrBrl: data.mrrBrl || 19600,
      tokensConsumedMonthly: data.tokensConsumedMonthly || 142000000,
      connectedErp: data.connectedErp || 'TOTVS Protheus',
      connectedChannels: data.connectedChannels || [],
      enabledServices: data.enabledServices || ['tax_recovery', 'operational'],
      regulatoryStandard: 'Padrão Regulatório BR (SEFAZ/BACEN)',
      createdAt: new Date().toISOString(),
      location: data.location || {
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5505,
        lng: -46.6333,
      },
    };
  }
}

// ---------------------------------------------------------
// CERTIFICATES VAULT A1 PERSISTENCE (Prisma / Postgres & Memory)
// ---------------------------------------------------------

const INITIAL_CERTIFICATES_SEED: CertificateVaultRecord[] = [
  {
    id: 'cert_nexus_client_01',
    alias: 'Certificado e-CNPJ Nexus Manufatura (Matriz)',
    ownerType: 'CLIENT',
    ownerName: 'Nexus Indústria & Manufatura S/A',
    cnpjCpf: '18.492.301/0001-84',
    serialNumber: '7B:44:90:A1:22:DF:8C:30',
    issuerCN: 'AC SERPRO RFB v5',
    thumbprintSha256: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    validFrom: '2026-01-10T00:00:00Z',
    validUntil: '2027-01-10T23:59:59Z',
    daysRemaining: 116,
    status: 'VALID',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:992817264819:key/a1-nexus-vault-prod-01',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-16 10:45:12',
    auditHash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    isSimulated: true
  },
  {
    id: 'cert_partner_vasconcelos_02',
    alias: 'Certificado e-Advogado Dr. Marcelo Vasconcelos',
    ownerType: 'PARTNER_LAWYER',
    ownerName: 'Marcelo Vasconcelos Ribeiro',
    cnpjCpf: '102.948.182-90',
    oabCrcNumber: 'OAB/SP 284.910',
    serialNumber: '1A:88:3C:99:FF:02:44:81',
    issuerCN: 'AC OAB v4 - Certisign',
    thumbprintSha256: '3e4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef01',
    validFrom: '2025-11-01T00:00:00Z',
    validUntil: '2026-11-01T23:59:59Z',
    daysRemaining: 46,
    status: 'EXPIRING_SOON',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:992817264819:key/a1-partner-vasconcelos-02',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-16 09:12:00',
    auditHash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
    isSimulated: true
  }
];

let inMemoryCertificates: CertificateVaultRecord[] = [...INITIAL_CERTIFICATES_SEED];

export function getVaultCertificatesSync(): CertificateVaultRecord[] {
  return inMemoryCertificates;
}

export async function listVaultCertificates(): Promise<CertificateVaultRecord[]> {
  if (!isPrismaActive) {
    return inMemoryCertificates;
  }
  try {
    const logs = await prisma.auditLog.findMany({
      where: { acao: 'VAULT_A1_CERTIFICADO_CUSTODIADO' },
      orderBy: { createdAt: 'desc' }
    });
    if (logs && logs.length > 0) {
      for (const log of logs) {
        if (log.metadata && typeof log.metadata === 'object' && 'thumbprintSha256' in log.metadata) {
          const cert = (log.metadata as unknown) as CertificateVaultRecord;
          const existing = inMemoryCertificates.find(c => c.id === cert.id || c.thumbprintSha256 === cert.thumbprintSha256);
          if (!existing) {
            inMemoryCertificates.push(cert);
          }
        }
      }
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.listVaultCertificates');
    console.warn('[tenantRepository.listVaultCertificates] Prisma fallback:', err);
  }
  return inMemoryCertificates;
}

export async function saveVaultCertificate(cert: CertificateVaultRecord): Promise<CertificateVaultRecord> {
  const existingIdx = inMemoryCertificates.findIndex(c => c.id === cert.id || c.thumbprintSha256 === cert.thumbprintSha256);
  if (existingIdx >= 0) {
    inMemoryCertificates[existingIdx] = cert;
  } else {
    inMemoryCertificates.unshift(cert);
  }

  if (!isPrismaActive) {
    return cert;
  }

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: cert.ownerType === 'CLIENT' ? 'tenant_nexus_01' : (cert.oabCrcNumber || 'partner_adv_vasconcelos'),
        acao: 'VAULT_A1_CERTIFICADO_CUSTODIADO',
        usuario: cert.ownerName,
        metadata: cert as any,
      }
    });

    if (cert.ownerType === 'CLIENT') {
      await prisma.tenant.updateMany({
        where: { cnpj: cert.cnpjCpf },
        data: { chaveApiHash: cert.thumbprintSha256 }
      });
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'tenantRepository.saveVaultCertificate');
    console.warn('[tenantRepository.saveVaultCertificate] Prisma fallback:', err);
  }

  return cert;
}

