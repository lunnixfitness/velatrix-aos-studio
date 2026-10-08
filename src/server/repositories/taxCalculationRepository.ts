import { prisma, isPrismaActive } from '../../lib/prisma';
import { PerDcompReceipt } from '../../types/integrationConnectors';
import { secureId } from '../../lib/demoMode';
import { exigirDemoOuFalhar } from '../http/erroBanco';

export interface TaxCalculationCaseDto {
  id: string;
  caseNumber: string;
  tenantId: string;
  partnerOfficeId?: string;
  authorUserId?: string;
  taxRegime: string;
  tese: string;
  teseTitle: string;
  teseLegalBasis?: string;
  protocolDate: string;
  consolidationDate: string;
  prescribedCutoffDate: string;
  reportClassification?: string;
  readinessPercentage: number;
  totalGrossAnalyzed: number;
  totalExcludedTaxAmount: number;
  totalPrincipalCredit: number;
  totalSelicInterest: number;
  totalUpdatedCredit: number;
  prescribedPrincipalBlocked: number;
  totalItemsProcessed: number;
  validItemsCount: number;
  prescribedItemsBlocked: number;
  divergencesXmlSpedCount?: number;
  conservativeSavingsProtected?: number;
  auditHashSha256: string;
  canonicalPayloadJson?: any;
  syntheticMonthlyData?: any;
  complianceAlerts?: any;
  status: string;
  createdAt: string;
}

// Initial demo case to ensure immediate data presence
const inMemoryTaxCases: TaxCalculationCaseDto[] = [
  {
    id: 'case_t69_nexus_01',
    caseNumber: 'PROC-2026-T69-0941',
    tenantId: 'tenant_nexus_01',
    partnerOfficeId: 'partner_adv_vasconcelos',
    taxRegime: 'LUCRO_REAL',
    tese: 'TEMA_69_STF_ICMS_PIS_COFINS',
    teseTitle: 'Exclusão do ICMS destacado da base do PIS/COFINS (Tema 69/STF)',
    teseLegalBasis: 'RE 574.706/PR - Tema 69 STF e Parecer SEI nº 7698/2021/ME',
    protocolDate: '2026-08-15T00:00:00.000Z',
    consolidationDate: '2026-08-18T00:00:00.000Z',
    prescribedCutoffDate: '2021-08-15T00:00:00.000Z',
    reportClassification: 'LAUDO_PERICIAL_COMPLETO',
    readinessPercentage: 100,
    totalGrossAnalyzed: 18450000.0,
    totalExcludedTaxAmount: 2398500.0,
    totalPrincipalCredit: 221861.25,
    totalSelicInterest: 64339.76,
    totalUpdatedCredit: 286201.01,
    prescribedPrincipalBlocked: 14200.0,
    totalItemsProcessed: 1420,
    validItemsCount: 1395,
    prescribedItemsBlocked: 25,
    divergencesXmlSpedCount: 3,
    conservativeSavingsProtected: 8420.5,
    auditHashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'CALCULADO',
    createdAt: new Date().toISOString(),
  },
];

export async function listTaxCalculationCases(tenantId?: string): Promise<TaxCalculationCaseDto[]> {
  if (!isPrismaActive) {
    if (tenantId) {
      return inMemoryTaxCases.filter(c => c.tenantId === tenantId);
    }
    return inMemoryTaxCases;
  }
  try {
    const cases = await prisma.taxCalculationCase.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    if (cases && cases.length > 0) {
      return cases.map(c => ({
        id: c.id,
        caseNumber: c.caseNumber,
        tenantId: c.tenantId,
        partnerOfficeId: c.partnerOfficeId || undefined,
        authorUserId: c.authorUserId || undefined,
        taxRegime: c.taxRegime,
        tese: c.tese,
        teseTitle: c.teseTitle,
        teseLegalBasis: c.teseLegalBasis || undefined,
        protocolDate: c.protocolDate.toISOString(),
        consolidationDate: c.consolidationDate.toISOString(),
        prescribedCutoffDate: c.prescribedCutoffDate.toISOString(),
        reportClassification: c.reportClassification,
        readinessPercentage: Number(c.readinessPercentage),
        totalGrossAnalyzed: Number(c.totalGrossAnalyzed),
        totalExcludedTaxAmount: Number(c.totalExcludedTaxAmount),
        totalPrincipalCredit: Number(c.totalPrincipalCredit),
        totalSelicInterest: Number(c.totalSelicInterest),
        totalUpdatedCredit: Number(c.totalUpdatedCredit),
        prescribedPrincipalBlocked: Number(c.prescribedPrincipalBlocked),
        totalItemsProcessed: c.totalItemsProcessed,
        validItemsCount: c.validItemsCount,
        prescribedItemsBlocked: c.prescribedItemsBlocked,
        divergencesXmlSpedCount: c.divergencesXmlSpedCount,
        conservativeSavingsProtected: Number(c.conservativeSavingsProtected),
        auditHashSha256: c.auditHashSha256,
        canonicalPayloadJson: c.canonicalPayloadJson,
        syntheticMonthlyData: c.syntheticMonthlyData,
        complianceAlerts: c.complianceAlerts,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'taxCalculationRepository.listTaxCalculationCases');
    console.warn('[taxCalculationRepository.listTaxCalculationCases] Prisma fallback:', err);
  }

  if (tenantId) {
    return inMemoryTaxCases.filter(c => c.tenantId === tenantId);
  }
  return inMemoryTaxCases;
}

export async function getTaxCalculationCaseById(id: string): Promise<TaxCalculationCaseDto | null> {
  if (!isPrismaActive) {
    const found = inMemoryTaxCases.find(c => c.id === id || c.caseNumber === id || c.auditHashSha256 === id);
    return found ? { ...found } : null;
  }
  try {
    const c = await prisma.taxCalculationCase.findUnique({
      where: { id },
    });
    if (c) {
      return {
        id: c.id,
        caseNumber: c.caseNumber,
        tenantId: c.tenantId,
        partnerOfficeId: c.partnerOfficeId || undefined,
        authorUserId: c.authorUserId || undefined,
        taxRegime: c.taxRegime,
        tese: c.tese,
        teseTitle: c.teseTitle,
        teseLegalBasis: c.teseLegalBasis || undefined,
        protocolDate: c.protocolDate.toISOString(),
        consolidationDate: c.consolidationDate.toISOString(),
        prescribedCutoffDate: c.prescribedCutoffDate.toISOString(),
        reportClassification: c.reportClassification,
        readinessPercentage: Number(c.readinessPercentage),
        totalGrossAnalyzed: Number(c.totalGrossAnalyzed),
        totalExcludedTaxAmount: Number(c.totalExcludedTaxAmount),
        totalPrincipalCredit: Number(c.totalPrincipalCredit),
        totalSelicInterest: Number(c.totalSelicInterest),
        totalUpdatedCredit: Number(c.totalUpdatedCredit),
        prescribedPrincipalBlocked: Number(c.prescribedPrincipalBlocked),
        totalItemsProcessed: c.totalItemsProcessed,
        validItemsCount: c.validItemsCount,
        prescribedItemsBlocked: c.prescribedItemsBlocked,
        divergencesXmlSpedCount: c.divergencesXmlSpedCount,
        conservativeSavingsProtected: Number(c.conservativeSavingsProtected),
        auditHashSha256: c.auditHashSha256,
        canonicalPayloadJson: c.canonicalPayloadJson,
        syntheticMonthlyData: c.syntheticMonthlyData,
        complianceAlerts: c.complianceAlerts,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      };
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'taxCalculationRepository.getTaxCalculationCaseById');
    console.warn(`[taxCalculationRepository.getTaxCalculationCaseById] Prisma fallback for ${id}:`, err);
  }

  const found = inMemoryTaxCases.find(c => c.id === id || c.caseNumber === id || c.auditHashSha256 === id);
  return found || null;
}

export async function createTaxCalculationCase(data: {
  caseNumber?: string;
  tenantId?: string;
  partnerOfficeId?: string;
  authorUserId?: string;
  taxRegime: any;
  tese: string;
  teseTitle: string;
  teseLegalBasis?: string;
  protocolDate?: string | Date;
  consolidationDate?: string | Date;
  prescribedCutoffDate?: string | Date;
  reportClassification?: any;
  readinessPercentage?: number;
  totalGrossAnalyzed: number;
  totalExcludedTaxAmount: number;
  totalPrincipalCredit: number;
  totalSelicInterest: number;
  totalUpdatedCredit: number;
  prescribedPrincipalBlocked: number;
  totalItemsProcessed: number;
  validItemsCount: number;
  prescribedItemsBlocked: number;
  divergencesXmlSpedCount?: number;
  conservativeSavingsProtected?: number;
  auditHashSha256: string;
  canonicalPayloadJson?: any;
  syntheticMonthlyData?: any;
  complianceAlerts?: any;
  status?: string;
}): Promise<TaxCalculationCaseDto> {
  const generatedId = `case_${Date.now()}_${secureId('', 4)}`;
  const caseNumber = data.caseNumber || `PROC-2026-TAX-${Date.now().toString().slice(-4)}`;
  const tenantId = data.tenantId || 'tenant_nexus_01';
  const protocolDate = data.protocolDate ? new Date(data.protocolDate) : new Date();
  const consolidationDate = data.consolidationDate ? new Date(data.consolidationDate) : new Date();
  const prescribedCutoffDate = data.prescribedCutoffDate 
    ? new Date(data.prescribedCutoffDate) 
    : new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000);

  const newCaseDto: TaxCalculationCaseDto = {
    id: generatedId,
    caseNumber,
    tenantId,
    partnerOfficeId: data.partnerOfficeId || 'partner_adv_vasconcelos',
    authorUserId: data.authorUserId,
    taxRegime: String(data.taxRegime),
    tese: data.tese,
    teseTitle: data.teseTitle,
    teseLegalBasis: data.teseLegalBasis,
    protocolDate: protocolDate.toISOString(),
    consolidationDate: consolidationDate.toISOString(),
    prescribedCutoffDate: prescribedCutoffDate.toISOString(),
    reportClassification: data.reportClassification || 'LAUDO_PERICIAL_COMPLETO',
    readinessPercentage: data.readinessPercentage ?? 100,
    totalGrossAnalyzed: Number(data.totalGrossAnalyzed || 0),
    totalExcludedTaxAmount: Number(data.totalExcludedTaxAmount || 0),
    totalPrincipalCredit: Number(data.totalPrincipalCredit || 0),
    totalSelicInterest: Number(data.totalSelicInterest || 0),
    totalUpdatedCredit: Number(data.totalUpdatedCredit || 0),
    prescribedPrincipalBlocked: Number(data.prescribedPrincipalBlocked || 0),
    totalItemsProcessed: Number(data.totalItemsProcessed || 0),
    validItemsCount: Number(data.validItemsCount || 0),
    prescribedItemsBlocked: Number(data.prescribedItemsBlocked || 0),
    divergencesXmlSpedCount: Number(data.divergencesXmlSpedCount || 0),
    conservativeSavingsProtected: Number(data.conservativeSavingsProtected || 0),
    auditHashSha256: data.auditHashSha256,
    canonicalPayloadJson: data.canonicalPayloadJson,
    syntheticMonthlyData: data.syntheticMonthlyData,
    complianceAlerts: data.complianceAlerts,
    status: data.status || 'CALCULADO',
    createdAt: new Date().toISOString(),
  };

  if (isPrismaActive) {
    try {
      const created = await prisma.taxCalculationCase.create({
        data: {
          caseNumber,
          tenantId,
          partnerOfficeId: data.partnerOfficeId || 'partner_adv_vasconcelos',
          authorUserId: data.authorUserId,
          taxRegime: data.taxRegime as any,
          tese: data.tese,
          teseTitle: data.teseTitle,
          teseLegalBasis: data.teseLegalBasis,
          protocolDate,
          consolidationDate,
          prescribedCutoffDate,
          reportClassification: (data.reportClassification as any) || 'LAUDO_PERICIAL_COMPLETO',
          readinessPercentage: data.readinessPercentage ?? 100,
          totalGrossAnalyzed: data.totalGrossAnalyzed,
          totalExcludedTaxAmount: data.totalExcludedTaxAmount,
          totalPrincipalCredit: data.totalPrincipalCredit,
          totalSelicInterest: data.totalSelicInterest,
          totalUpdatedCredit: data.totalUpdatedCredit,
          prescribedPrincipalBlocked: data.prescribedPrincipalBlocked,
          totalItemsProcessed: data.totalItemsProcessed,
          validItemsCount: data.validItemsCount,
          prescribedItemsBlocked: data.prescribedItemsBlocked,
          divergencesXmlSpedCount: data.divergencesXmlSpedCount || 0,
          conservativeSavingsProtected: data.conservativeSavingsProtected || 0,
          auditHashSha256: data.auditHashSha256,
          canonicalPayloadJson: data.canonicalPayloadJson,
          syntheticMonthlyData: data.syntheticMonthlyData,
          complianceAlerts: data.complianceAlerts,
          status: data.status || 'CALCULADO',
        },
      });
      newCaseDto.id = created.id;
    } catch (err) {
      exigirDemoOuFalhar(err, 'taxCalculationRepository.createTaxCalculationCase');
      console.warn('[taxCalculationRepository.createTaxCalculationCase] Prisma fallback:', err);
    }
  }

  // Update in-memory fallback list (or replace if existing hash)
  const existingIdx = inMemoryTaxCases.findIndex(c => c.auditHashSha256 === newCaseDto.auditHashSha256);
  if (existingIdx >= 0) {
    inMemoryTaxCases[existingIdx] = newCaseDto;
  } else {
    inMemoryTaxCases.unshift(newCaseDto);
  }

  return newCaseDto;
}

// ---------------------------------------------------------
// PER/DCOMP TRANSMISSIONS PERSISTENCE (Prisma / Postgres & Memory)
// ---------------------------------------------------------

const INITIAL_PERDCOMPS_SEED: PerDcompReceipt[] = [
  {
    id: 'perdcomp_01',
    numeroControlePerDcomp: 'DCOMP-2026.09.16-9812-BR',
    reciboEntregaNumero: 'REC-RFB-DCOMP-88391204',
    dataHoraTransmissao: '2026-09-16 10:45:12',
    cnpjContribuinte: '18.492.301/0001-84',
    razaoSocial: 'Nexus Indústria & Manufatura S/A',
    tipoDocumento: 'DECLARACAO_COMPENSACAO',
    valorTotalCompensado: 148900.00,
    statusHomologacao: 'HOMOLOGADO_EXPRESSO',
    protocoloSerpro: 'SERPRO-RFB-WS-2026-118940192',
    carimboDoTempoSha256: '0xdcomp_ts_9981273645a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0'
  }
];

let inMemoryPerdcomps: PerDcompReceipt[] = [...INITIAL_PERDCOMPS_SEED];

export function getPerDcompReceiptsSync(): PerDcompReceipt[] {
  return inMemoryPerdcomps;
}

export async function listPerDcompReceipts(): Promise<PerDcompReceipt[]> {
  if (!isPrismaActive) {
    return inMemoryPerdcomps;
  }
  try {
    const cases = await prisma.taxCalculationCase.findMany({
      where: { tese: 'PER_DCOMP_FEDERAL' },
      orderBy: { createdAt: 'desc' },
    });
    if (cases && cases.length > 0) {
      for (const c of cases) {
        if (c.canonicalPayloadJson && typeof c.canonicalPayloadJson === 'object' && 'numeroControlePerDcomp' in c.canonicalPayloadJson) {
          const receipt = (c.canonicalPayloadJson as unknown) as PerDcompReceipt;
          const existing = inMemoryPerdcomps.find(p => p.id === receipt.id || p.numeroControlePerDcomp === receipt.numeroControlePerDcomp);
          if (!existing) {
            inMemoryPerdcomps.push(receipt);
          }
        }
      }
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'taxCalculationRepository.listPerDcompReceipts');
    console.warn('[taxCalculationRepository.listPerDcompReceipts] Prisma fallback:', err);
  }
  return inMemoryPerdcomps;
}

export async function savePerDcompReceipt(receipt: PerDcompReceipt): Promise<PerDcompReceipt> {
  const existingIdx = inMemoryPerdcomps.findIndex(p => p.id === receipt.id || p.numeroControlePerDcomp === receipt.numeroControlePerDcomp);
  if (existingIdx >= 0) {
    inMemoryPerdcomps[existingIdx] = receipt;
  } else {
    inMemoryPerdcomps.unshift(receipt);
  }

  if (!isPrismaActive) {
    return receipt;
  }

  try {
    await prisma.taxCalculationCase.upsert({
      where: { caseNumber: receipt.numeroControlePerDcomp },
      update: {
        status: receipt.statusHomologacao,
        canonicalPayloadJson: receipt as any,
      },
      create: {
        id: receipt.id,
        caseNumber: receipt.numeroControlePerDcomp,
        tenantId: 'tenant_nexus_01',
        taxRegime: 'LUCRO_REAL',
        tese: 'PER_DCOMP_FEDERAL',
        teseTitle: `PER/DCOMP Federal - ${receipt.numeroControlePerDcomp}`,
        protocolDate: new Date(),
        consolidationDate: new Date(),
        prescribedCutoffDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        readinessPercentage: 100,
        totalGrossAnalyzed: receipt.valorTotalCompensado,
        totalExcludedTaxAmount: receipt.valorTotalCompensado,
        totalPrincipalCredit: receipt.valorTotalCompensado,
        totalSelicInterest: 0,
        totalUpdatedCredit: receipt.valorTotalCompensado,
        prescribedPrincipalBlocked: 0,
        auditHashSha256: receipt.carimboDoTempoSha256.replace(/^0x/, '').slice(0, 64).padEnd(64, '0'),
        status: receipt.statusHomologacao,
        canonicalPayloadJson: receipt as any,
      },
    });
  } catch (err) {
    exigirDemoOuFalhar(err, 'taxCalculationRepository.savePerDcompReceipt');
    console.warn('[taxCalculationRepository.savePerDcompReceipt] Prisma fallback:', err);
  }

  return receipt;
}

