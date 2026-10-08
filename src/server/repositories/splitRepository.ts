import { createHash } from 'crypto';
import { prisma, isPrismaActive } from '../../lib/prisma';
import { BaasSplitChargeInstruction } from '../../types/integrationConnectors';
import { updateBaasSubaccountBalance } from './partnerRepository';
import { secureId, secureInt } from '../../lib/demoMode';

export interface SplitDealDto {
  id: string;
  dealCode: string;
  dealTitle: string;
  tenantId: string;
  partnerOfficeId: string;
  taxCalculationCaseId?: string;
  estimatedBenefitAmount: number;
  successFeePercent: number;
  totalSuccessFeeAmount: number;
  partnerSplitPercent: number;
  partnerSplitAmount: number;
  velatrixSplitPercent: number;
  velatrixSplitAmount: number;
  status: string;
  splitWebhookUrl?: string;
  contractDocHash?: string;
  createdAt: string;
}

export interface PayoutDto {
  id: string;
  payoutNumber: string;
  tenantId: string;
  partnerOfficeId: string;
  splitDealId?: string;
  taxCalculationCaseId?: string;
  grossAmount: number;
  partnerAmount: number;
  velatrixAmount: number;
  method: string;
  status: string;
  escrowAccountIspb?: string;
  destinationPixKeyMasked?: string;
  destinationBank?: string;
  transactionId?: string;
  scheduledDate?: string;
  settledAt?: string;
  proofHashSha256?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface NfseRecordDto {
  id: string;
  nfseNumber?: string;
  rpsNumber?: string;
  rpsSerie?: string;
  verificationCode?: string;
  tenantId: string;
  partnerOfficeId?: string;
  splitDealId?: string;
  payoutId?: string;
  taxCalculationCaseId?: string;
  operationType: string;
  operationDescription: string;
  cnae?: string;
  itemListaServico?: string;
  grossAmountBrl: number;
  partnerSplitPct: number;
  partnerSplitAmountBrl: number;
  velatrixRetainedAmountBrl: number;
  issRatePct: number;
  issAmountBrl: number;
  status: string;
  emissionDate?: string;
  municipalProtocol?: string;
  municipalDigestSha256?: string;
  prefeitura?: string;
  createdAt: string;
}

// Initial demo memory store seeded with realistic data
const inMemorySplitDeals: SplitDealDto[] = [
  {
    id: 'deal_nexus_t69',
    dealCode: 'DEAL-2026-98124',
    dealTitle: 'Honorários de Êxito - Exclusão ICMS da Base PIS/COFINS (60 Meses)',
    tenantId: 'tenant_nexus_01',
    partnerOfficeId: 'partner_adv_vasconcelos',
    estimatedBenefitAmount: 945000.0,
    successFeePercent: 20.0,
    totalSuccessFeeAmount: 189000.0,
    partnerSplitPercent: 100.0,
    partnerSplitAmount: 132300.0,
    velatrixSplitPercent: 0.0,
    velatrixSplitAmount: 0.0,
    status: 'ACTIVE',
    splitWebhookUrl: 'https://api.velatrix.com.br/webhooks/escrow/split-settled',
    contractDocHash: 'sha256:7b49e2cf71a9a4d8bf901c809e2e5058728b1db6f582f041b6c0034a742ea312',
    createdAt: '2026-08-10T14:30:00.000Z',
  },
  {
    id: 'deal_cerrado_folha',
    dealCode: 'DEAL-2026-98125',
    dealTitle: 'Recuperação Previdenciária - Verbas Indenizatórias Folha de Pagamento',
    tenantId: 'tenant_agro_cerrado',
    partnerOfficeId: 'partner_adv_vasconcelos',
    estimatedBenefitAmount: 1200000.0,
    successFeePercent: 20.0,
    totalSuccessFeeAmount: 240000.0,
    partnerSplitPercent: 100.0,
    partnerSplitAmount: 168000.0,
    velatrixSplitPercent: 0.0,
    velatrixSplitAmount: 0.0,
    status: 'ACTIVE',
    contractDocHash: 'sha256:a23bf01889c31401f899e120dae22c983018e19034aa10098bc194a2b9ef182a',
    createdAt: '2026-08-12T09:15:00.000Z',
  },
];

const inMemoryPayouts: PayoutDto[] = [
  {
    id: 'payout_settled_01',
    payoutNumber: 'PAY-2026-00412',
    tenantId: 'tenant_nexus_01',
    partnerOfficeId: 'partner_adv_vasconcelos',
    splitDealId: 'deal_nexus_t69',
    grossAmount: 189000.0,
    partnerAmount: 132300.0,
    velatrixAmount: 0.0,
    method: 'PIX_CNPJ',
    status: 'LIQUIDADO_D0',
    escrowAccountIspb: 'ISPB-00360305 (Conta Transitória D+0)',
    destinationPixKeyMasked: '38.***.***/0001-77 (Vasconcelos Tax Law)',
    destinationBank: 'Banco Itaú BBA S.A. (341)',
    transactionId: 'E0036030520260818143209841289',
    scheduledDate: '2026-08-18T14:32:00.000Z',
    settledAt: '2026-08-18T14:32:04.000Z',
    proofHashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    receiptUrl: 'https://velatrix.app/escrow/receipts/PAY-2026-00412.pdf',
    createdAt: '2026-08-18T14:30:00.000Z',
  },
];

const inMemoryNfseRecords: NfseRecordDto[] = [
  {
    id: 'nfse_partner_01',
    nfseNumber: 'NFS-e 2026/0009412',
    rpsNumber: 'RPS 1824',
    rpsSerie: 'ESC',
    verificationCode: '7A9B-4C2E-89F1',
    tenantId: 'tenant_nexus_01',
    partnerOfficeId: 'partner_adv_vasconcelos',
    splitDealId: 'deal_nexus_t69',
    payoutId: 'payout_settled_01',
    operationType: 'TAX_RECOVERY_SUCCESS_FEE',
    operationDescription: 'Honorários advocatícios sobre recuperação de tributos (Exclusão ICMS PIS/COFINS)',
    cnae: '6911-7/01',
    itemListaServico: '17.14 - Advocacia',
    grossAmountBrl: 132300.0,
    partnerSplitPct: 70.0,
    partnerSplitAmountBrl: 132300.0,
    velatrixRetainedAmountBrl: 0.0,
    issRatePct: 5.0,
    issAmountBrl: 6615.0,
    status: 'EMITIDA',
    emissionDate: '2026-08-18T14:32:05.000Z',
    municipalProtocol: 'SP-2026-09812490-NFE',
    municipalDigestSha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    prefeitura: 'Prefeitura Municipal de São Paulo / SP',
    createdAt: '2026-08-18T14:32:05.000Z',
  },
  {
    id: 'nfse_velatrix_01',
    nfseNumber: 'NFS-e 2026/0008741',
    rpsNumber: 'RPS 3042',
    rpsSerie: 'TEC',
    verificationCode: 'VX88-9921-TX01',
    tenantId: 'tenant_nexus_01',
    partnerOfficeId: 'partner_adv_vasconcelos',
    splitDealId: 'deal_nexus_t69',
    payoutId: 'payout_settled_01',
    operationType: 'PLATFORM_SAAS_LICENSING',
    operationDescription: 'Licenciamento de tecnologia e processamento pericial autônomo VELATRIX AOS D+0',
    cnae: '6201-5/01',
    itemListaServico: '1.05 - Licenciamento de software',
    grossAmountBrl: 56700.0,
    partnerSplitPct: 30.0,
    partnerSplitAmountBrl: 0.0,
    velatrixRetainedAmountBrl: 0.0,
    issRatePct: 2.0,
    issAmountBrl: 1134.0,
    status: 'EMITIDA',
    emissionDate: '2026-08-18T14:32:06.000Z',
    municipalProtocol: 'SP-2026-09812491-NFE',
    municipalDigestSha256: '8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    prefeitura: 'Prefeitura Municipal de São Paulo / SP',
    createdAt: '2026-08-18T14:32:06.000Z',
  },
];

// =========================================================================
// SPLIT DEALS REPOSITORY
// =========================================================================

export async function listSplitDeals(tenantId?: string, partnerOfficeId?: string): Promise<SplitDealDto[]> {
  if (!isPrismaActive) {
    let filtered = [...inMemorySplitDeals];
    if (tenantId) filtered = filtered.filter(d => d.tenantId === tenantId);
    if (partnerOfficeId) filtered = filtered.filter(d => d.partnerOfficeId === partnerOfficeId);
    return filtered;
  }
  try {
    const deals = await prisma.splitDeal.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(partnerOfficeId ? { partnerOfficeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (deals && deals.length > 0) {
      return deals.map(d => ({
        id: d.id,
        dealCode: d.dealCode,
        dealTitle: d.dealTitle,
        tenantId: d.tenantId,
        partnerOfficeId: d.partnerOfficeId,
        taxCalculationCaseId: d.taxCalculationCaseId || undefined,
        estimatedBenefitAmount: Number(d.estimatedBenefitAmount),
        successFeePercent: Number(d.successFeePercent),
        totalSuccessFeeAmount: Number(d.totalSuccessFeeAmount),
        partnerSplitPercent: Number(d.partnerSplitPercent),
        partnerSplitAmount: Number(d.partnerSplitAmount),
        velatrixSplitPercent: Number(d.velatrixSplitPercent),
        velatrixSplitAmount: Number(d.velatrixSplitAmount),
        status: d.status,
        splitWebhookUrl: d.splitWebhookUrl || undefined,
        contractDocHash: d.contractDocHash || undefined,
        createdAt: d.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[splitRepository.listSplitDeals] Prisma fallback:', err);
  }

  let filtered = [...inMemorySplitDeals];
  if (tenantId) filtered = filtered.filter(d => d.tenantId === tenantId);
  if (partnerOfficeId) filtered = filtered.filter(d => d.partnerOfficeId === partnerOfficeId);
  return filtered;
}

export async function getSplitDealById(id: string): Promise<SplitDealDto | null> {
  if (!isPrismaActive) {
    const found = inMemorySplitDeals.find(d => d.id === id || d.dealCode === id);
    return found ? { ...found } : null;
  }
  try {
    const d = await prisma.splitDeal.findUnique({ where: { id } });
    if (d) {
      return {
        id: d.id,
        dealCode: d.dealCode,
        dealTitle: d.dealTitle,
        tenantId: d.tenantId,
        partnerOfficeId: d.partnerOfficeId,
        taxCalculationCaseId: d.taxCalculationCaseId || undefined,
        estimatedBenefitAmount: Number(d.estimatedBenefitAmount),
        successFeePercent: Number(d.successFeePercent),
        totalSuccessFeeAmount: Number(d.totalSuccessFeeAmount),
        partnerSplitPercent: Number(d.partnerSplitPercent),
        partnerSplitAmount: Number(d.partnerSplitAmount),
        velatrixSplitPercent: Number(d.velatrixSplitPercent),
        velatrixSplitAmount: Number(d.velatrixSplitAmount),
        status: d.status,
        splitWebhookUrl: d.splitWebhookUrl || undefined,
        contractDocHash: d.contractDocHash || undefined,
        createdAt: d.createdAt.toISOString(),
      };
    }
  } catch (err) {
    console.warn(`[splitRepository.getSplitDealById] Prisma fallback for ${id}:`, err);
  }

  const found = inMemorySplitDeals.find(d => d.id === id || d.dealCode === id);
  return found || null;
}

export async function createSplitDeal(data: {
  dealCode?: string;
  dealTitle: string;
  tenantId?: string;
  partnerOfficeId?: string;
  taxCalculationCaseId?: string;
  estimatedBenefitAmount: number;
  successFeePercent?: number;
  partnerSplitPercent?: number;
  status?: string;
  contractDocHash?: string;
}): Promise<SplitDealDto> {
  const generatedId = `deal_${Date.now()}_${secureId('', 4)}`;
  const dealCode = data.dealCode || `DEAL-2026-${Date.now().toString().slice(-5)}`;
  const tenantId = data.tenantId || 'tenant_nexus_01';
  const partnerOfficeId = data.partnerOfficeId || 'partner_adv_vasconcelos';
  const estBenefit = Number(data.estimatedBenefitAmount || 0);
  const successFeePct = Number(data.successFeePercent ?? 20);
  const totalSuccessFee = estBenefit * (successFeePct / 100);
  // P23: a Velatrix não participa de honorários (Lei 8.906/94, art. 34, III/IV) — 100% ao(s) profissional(is).
  const partnerSplitPct = 100;
  const velatrixSplitPct = 100 - partnerSplitPct;
  const partnerSplitAmount = totalSuccessFee * (partnerSplitPct / 100);
  const velatrixSplitAmount = totalSuccessFee * (velatrixSplitPct / 100);

  const newDeal: SplitDealDto = {
    id: generatedId,
    dealCode,
    dealTitle: data.dealTitle,
    tenantId,
    partnerOfficeId,
    taxCalculationCaseId: data.taxCalculationCaseId,
    estimatedBenefitAmount: estBenefit,
    successFeePercent: successFeePct,
    totalSuccessFeeAmount: totalSuccessFee,
    partnerSplitPercent: partnerSplitPct,
    partnerSplitAmount,
    velatrixSplitPercent: velatrixSplitPct,
    velatrixSplitAmount,
    status: data.status || 'ACTIVE',
    contractDocHash: data.contractDocHash,
    createdAt: new Date().toISOString(),
  };

  if (isPrismaActive) {
    try {
      const created = await prisma.splitDeal.create({
        data: {
          dealCode,
          dealTitle: data.dealTitle,
          tenantId,
          partnerOfficeId,
          taxCalculationCaseId: data.taxCalculationCaseId,
          estimatedBenefitAmount: estBenefit,
          successFeePercent: successFeePct,
          totalSuccessFeeAmount: totalSuccessFee,
          partnerSplitPercent: partnerSplitPct,
          partnerSplitAmount,
          velatrixSplitPercent: velatrixSplitPct,
          velatrixSplitAmount,
          status: data.status || 'ACTIVE',
          contractDocHash: data.contractDocHash,
        },
      });
      newDeal.id = created.id;
    } catch (err) {
      console.warn('[splitRepository.createSplitDeal] Prisma fallback:', err);
    }
  }

  inMemorySplitDeals.unshift(newDeal);
  return newDeal;
}

// =========================================================================
// PAYOUT REPOSITORY
// =========================================================================

export async function listPayouts(tenantId?: string, partnerOfficeId?: string): Promise<PayoutDto[]> {
  if (!isPrismaActive) {
    let filtered = [...inMemoryPayouts];
    if (tenantId) filtered = filtered.filter(p => p.tenantId === tenantId);
    if (partnerOfficeId) filtered = filtered.filter(p => p.partnerOfficeId === partnerOfficeId);
    return filtered;
  }
  try {
    const payouts = await prisma.payout.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(partnerOfficeId ? { partnerOfficeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (payouts && payouts.length > 0) {
      return payouts.map(p => ({
        id: p.id,
        payoutNumber: p.payoutNumber,
        tenantId: p.tenantId,
        partnerOfficeId: p.partnerOfficeId,
        splitDealId: p.splitDealId || undefined,
        taxCalculationCaseId: p.taxCalculationCaseId || undefined,
        grossAmount: Number(p.grossAmount),
        partnerAmount: Number(p.partnerAmount),
        velatrixAmount: Number(p.velatrixAmount),
        method: p.method,
        status: p.status,
        escrowAccountIspb: p.escrowAccountIspb || undefined,
        destinationPixKeyMasked: p.destinationPixKeyMasked || undefined,
        destinationBank: p.destinationBank || undefined,
        transactionId: p.transactionId || undefined,
        scheduledDate: p.scheduledDate?.toISOString(),
        settledAt: p.settledAt?.toISOString(),
        proofHashSha256: p.proofHashSha256 || undefined,
        receiptUrl: p.receiptUrl || undefined,
        createdAt: p.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[splitRepository.listPayouts] Prisma fallback:', err);
  }

  let filtered = [...inMemoryPayouts];
  if (tenantId) filtered = filtered.filter(p => p.tenantId === tenantId);
  if (partnerOfficeId) filtered = filtered.filter(p => p.partnerOfficeId === partnerOfficeId);
  return filtered;
}

export async function createPayout(data: {
  payoutNumber?: string;
  tenantId?: string;
  partnerOfficeId?: string;
  splitDealId?: string;
  taxCalculationCaseId?: string;
  grossAmount: number;
  partnerAmount?: number;
  velatrixAmount?: number;
  method?: string;
  status?: string;
  destinationPixKeyMasked?: string;
  destinationBank?: string;
  transactionId?: string;
  proofHashSha256?: string;
}): Promise<PayoutDto> {
  const generatedId = `pay_${Date.now()}_${secureId('', 4)}`;
  const payoutNumber = data.payoutNumber || `PAY-2026-${Date.now().toString().slice(-5)}`;
  const tenantId = data.tenantId || 'tenant_nexus_01';
  const partnerOfficeId = data.partnerOfficeId || 'partner_adv_vasconcelos';
  const grossAmount = Number(data.grossAmount || 0);
  // P23: repasse integral ao profissional; nenhuma retenção da plataforma sobre honorários.
  const partnerAmount = grossAmount;
  const velatrixAmount = 0;

  const newPayout: PayoutDto = {
    id: generatedId,
    payoutNumber,
    tenantId,
    partnerOfficeId,
    splitDealId: data.splitDealId,
    taxCalculationCaseId: data.taxCalculationCaseId,
    grossAmount,
    partnerAmount,
    velatrixAmount,
    method: data.method || 'PIX_CNPJ',
    status: data.status || 'PENDENTE',
    escrowAccountIspb: 'ISPB-00360305 (Escrow Velatrix D+0)',
    destinationPixKeyMasked: data.destinationPixKeyMasked || '38.***.***/0001-77',
    destinationBank: data.destinationBank || 'Banco Itaú BBA S.A.',
    transactionId: data.transactionId,
    proofHashSha256: data.proofHashSha256,
    createdAt: new Date().toISOString(),
  };

  if (isPrismaActive) {
    try {
      const created = await prisma.payout.create({
        data: {
          payoutNumber,
          tenantId,
          partnerOfficeId,
          splitDealId: data.splitDealId,
          taxCalculationCaseId: data.taxCalculationCaseId,
          grossAmount,
          partnerAmount,
          velatrixAmount,
          method: (data.method as any) || 'PIX_CNPJ',
          status: (data.status as any) || 'PENDENTE',
          destinationPixKeyMasked: data.destinationPixKeyMasked,
          destinationBank: data.destinationBank,
          transactionId: data.transactionId,
          proofHashSha256: data.proofHashSha256,
        },
      });
      newPayout.id = created.id;
    } catch (err) {
      console.warn('[splitRepository.createPayout] Prisma fallback:', err);
    }
  }

  inMemoryPayouts.unshift(newPayout);
  return newPayout;
}

export async function updatePayoutStatus(
  id: string,
  status: string,
  proofHashSha256?: string,
  transactionId?: string
): Promise<PayoutDto | null> {
  const settledAt = new Date().toISOString();
  if (isPrismaActive) {
    try {
      const updated = await prisma.payout.update({
        where: { id },
        data: {
          status: status as any,
          proofHashSha256: proofHashSha256 || undefined,
          transactionId: transactionId || undefined,
          settledAt: status.includes('LIQUIDADO') ? new Date() : undefined,
        },
      });
      if (updated) {
        return {
          id: updated.id,
          payoutNumber: updated.payoutNumber,
          tenantId: updated.tenantId,
          partnerOfficeId: updated.partnerOfficeId,
          grossAmount: Number(updated.grossAmount),
          partnerAmount: Number(updated.partnerAmount),
          velatrixAmount: Number(updated.velatrixAmount),
          method: updated.method,
          status: updated.status,
          proofHashSha256: updated.proofHashSha256 || undefined,
          transactionId: updated.transactionId || undefined,
          settledAt: updated.settledAt?.toISOString(),
          createdAt: updated.createdAt.toISOString(),
        };
      }
    } catch (err) {
      console.warn(`[splitRepository.updatePayoutStatus] Prisma fallback for ${id}:`, err);
    }
  }

  const idx = inMemoryPayouts.findIndex(p => p.id === id || p.payoutNumber === id);
  if (idx >= 0) {
    inMemoryPayouts[idx].status = status;
    if (proofHashSha256) inMemoryPayouts[idx].proofHashSha256 = proofHashSha256;
    if (transactionId) inMemoryPayouts[idx].transactionId = transactionId;
    if (status.includes('LIQUIDADO')) inMemoryPayouts[idx].settledAt = settledAt;
    return inMemoryPayouts[idx];
  }
  return null;
}

// =========================================================================
// NFSE REPOSITORY
// =========================================================================

export async function listNfseRecords(tenantId?: string, partnerOfficeId?: string): Promise<NfseRecordDto[]> {
  if (!isPrismaActive) {
    let filtered = [...inMemoryNfseRecords];
    if (tenantId) filtered = filtered.filter(r => r.tenantId === tenantId);
    if (partnerOfficeId) filtered = filtered.filter(r => r.partnerOfficeId === partnerOfficeId);
    return filtered;
  }
  try {
    const records = await prisma.nfseRecord.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(partnerOfficeId ? { partnerOfficeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (records && records.length > 0) {
      return records.map(r => ({
        id: r.id,
        nfseNumber: r.nfseNumber || undefined,
        rpsNumber: r.rpsNumber || undefined,
        rpsSerie: r.rpsSerie || undefined,
        verificationCode: r.verificationCode || undefined,
        tenantId: r.tenantId,
        partnerOfficeId: r.partnerOfficeId || undefined,
        splitDealId: r.splitDealId || undefined,
        payoutId: r.payoutId || undefined,
        taxCalculationCaseId: r.taxCalculationCaseId || undefined,
        operationType: r.operationType,
        operationDescription: r.operationDescription,
        cnae: r.cnae || undefined,
        itemListaServico: r.itemListaServico || undefined,
        grossAmountBrl: Number(r.grossAmountBrl),
        partnerSplitPct: Number(r.partnerSplitPct),
        partnerSplitAmountBrl: Number(r.partnerSplitAmountBrl),
        velatrixRetainedAmountBrl: Number(r.velatrixRetainedAmountBrl),
        issRatePct: Number(r.issRatePct),
        issAmountBrl: Number(r.issAmountBrl),
        status: r.status,
        emissionDate: r.emissionDate?.toISOString(),
        municipalProtocol: r.municipalProtocol || undefined,
        municipalDigestSha256: r.municipalDigestSha256 || undefined,
        prefeitura: r.prefeitura || undefined,
        createdAt: r.createdAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn('[splitRepository.listNfseRecords] Prisma fallback:', err);
  }

  let filtered = [...inMemoryNfseRecords];
  if (tenantId) filtered = filtered.filter(r => r.tenantId === tenantId);
  if (partnerOfficeId) filtered = filtered.filter(r => r.partnerOfficeId === partnerOfficeId);
  return filtered;
}

export async function createNfseRecord(data: {
  nfseNumber?: string;
  rpsNumber?: string;
  rpsSerie?: string;
  verificationCode?: string;
  tenantId?: string;
  partnerOfficeId?: string;
  splitDealId?: string;
  payoutId?: string;
  taxCalculationCaseId?: string;
  operationType?: string;
  operationDescription: string;
  cnae?: string;
  itemListaServico?: string;
  grossAmountBrl: number;
  partnerSplitPct?: number;
  partnerSplitAmountBrl?: number;
  velatrixRetainedAmountBrl?: number;
  issRatePct?: number;
  issAmountBrl?: number;
  status?: string;
  prefeitura?: string;
}): Promise<NfseRecordDto> {
  const generatedId = `nfse_${Date.now()}_${secureId('', 4)}`;
  const nfseNumber = data.nfseNumber || `NFS-e 2026/${Date.now().toString().slice(-7)}`;
  const tenantId = data.tenantId || 'tenant_nexus_01';
  const partnerOfficeId = data.partnerOfficeId || 'partner_adv_vasconcelos';
  const gross = Number(data.grossAmountBrl || 0);
  const splitPct = Number(data.partnerSplitPct ?? 70);
  const partnerSplitAmount = data.partnerSplitAmountBrl !== undefined ? Number(data.partnerSplitAmountBrl) : gross * (splitPct / 100);
  const velatrixAmount = data.velatrixRetainedAmountBrl !== undefined ? Number(data.velatrixRetainedAmountBrl) : gross * ((100 - splitPct) / 100);
  const issRate = Number(data.issRatePct ?? 5.0);
  const issAmount = data.issAmountBrl !== undefined ? Number(data.issAmountBrl) : gross * (issRate / 100);

  const newRecord: NfseRecordDto = {
    id: generatedId,
    nfseNumber,
    rpsNumber: data.rpsNumber || `RPS ${secureInt(1000, 9999)}`,
    rpsSerie: data.rpsSerie || 'ESC',
    verificationCode: data.verificationCode || `${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}`,
    tenantId,
    partnerOfficeId,
    splitDealId: data.splitDealId,
    payoutId: data.payoutId,
    taxCalculationCaseId: data.taxCalculationCaseId,
    operationType: data.operationType || 'TAX_RECOVERY_SUCCESS_FEE',
    operationDescription: data.operationDescription,
    cnae: data.cnae || '6911-7/01',
    itemListaServico: data.itemListaServico || '17.14',
    grossAmountBrl: gross,
    partnerSplitPct: splitPct,
    partnerSplitAmountBrl: partnerSplitAmount,
    velatrixRetainedAmountBrl: velatrixAmount,
    issRatePct: issRate,
    issAmountBrl: issAmount,
    status: data.status || 'EMITIDA',
    emissionDate: new Date().toISOString(),
    municipalProtocol: `SP-2026-${Date.now().toString().slice(-8)}-NFE`,
    municipalDigestSha256: 'sha256:' + createHash('sha256').update(JSON.stringify({ generatedId, data })).digest('hex'),
    prefeitura: data.prefeitura || 'Prefeitura Municipal de São Paulo / SP',
    createdAt: new Date().toISOString(),
  };

  if (isPrismaActive) {
    try {
      const created = await prisma.nfseRecord.create({
        data: {
          nfseNumber,
          rpsNumber: newRecord.rpsNumber,
          rpsSerie: newRecord.rpsSerie,
          verificationCode: newRecord.verificationCode,
          tenantId,
          partnerOfficeId,
          splitDealId: data.splitDealId,
          payoutId: data.payoutId,
          taxCalculationCaseId: data.taxCalculationCaseId,
          operationType: (data.operationType as any) || 'TAX_RECOVERY_SUCCESS_FEE',
          operationDescription: data.operationDescription,
          cnae: newRecord.cnae,
          itemListaServico: newRecord.itemListaServico,
          grossAmountBrl: gross,
          partnerSplitPct: splitPct,
          partnerSplitAmountBrl: partnerSplitAmount,
          velatrixRetainedAmountBrl: velatrixAmount,
          issRatePct: issRate,
          issAmountBrl: issAmount,
          status: (data.status as any) || 'EMITIDA',
          emissionDate: new Date(),
          municipalProtocol: newRecord.municipalProtocol,
          municipalDigestSha256: newRecord.municipalDigestSha256,
          prefeitura: newRecord.prefeitura,
        },
      });
      newRecord.id = created.id;
    } catch (err) {
      console.warn('[splitRepository.createNfseRecord] Prisma fallback:', err);
    }
  }

  inMemoryNfseRecords.unshift(newRecord);
  return newRecord;
}

// ---------------------------------------------------------
// BAAS SPLIT CHARGES PERSISTENCE (Prisma / Postgres & Memory)
// ---------------------------------------------------------

const INITIAL_SPLIT_INSTRUCTIONS_SEED: BaasSplitChargeInstruction[] = [
  {
    chargeId: 'split_chg_2026_9941',
    tenantId: 'tenant_nexus_01',
    taxCaseId: 'TEMA_69_STF_ICMS_PIS_COFINS',
    valorTotalHonorariosBrl: 29780.00,
    metodoPagamento: 'PIX_DINAMICO',
    clienteDevedor: {
      razaoSocial: 'Nexus Indústria & Manufatura S/A',
      cnpj: '18.492.301/0001-84',
      email: 'financeiro@nexusmanufatura.com.br'
    },
    splitRules: {
      partnerSubaccountId: 'subacc_oab_01',
      partnerName: 'Vasconcelos & Associados Advocacia Tributária',
      partnerPercentage: 50.0,
      partnerAmountBrl: 14890.00,
      partnerPixKey: '38192401000177',
      partnerNfseStatus: 'EMITIDA',
      velatrixSubaccountId: 'subacc_velatrix_master',
      velatrixPercentage: 50.0,
      velatrixAmountBrl: 0.00,
      velatrixNfseStatus: 'EMITIDA'
    },
    status: 'SPLIT_CONCLUIDO',
    pixPayloadQrCode: '00020126580014BR.GOV.BCB.PIX013638192401000177520400005303986540529780.005802BR5925Nexus Industria Manufatura6009Sao Paulo62070503***6304E8A9',
    dataCriacao: '2026-09-16 09:00:00',
    dataVencimento: '2026-09-20 23:59:59',
    dataLiquidacao: '2026-09-16 11:15:20',
    endToEndBacenId: 'E00038166202609161115s098172941b2',
    isSimulated: true
  }
];

let inMemorySplitCharges: BaasSplitChargeInstruction[] = [...INITIAL_SPLIT_INSTRUCTIONS_SEED];

export function getBaasSplitChargesSync(): BaasSplitChargeInstruction[] {
  return inMemorySplitCharges;
}

export function getBaasSplitChargeById(chargeId: string): BaasSplitChargeInstruction | null {
  return inMemorySplitCharges.find(c => c.chargeId === chargeId) || null;
}

export async function listBaasSplitCharges(): Promise<BaasSplitChargeInstruction[]> {
  if (!isPrismaActive) {
    return inMemorySplitCharges;
  }
  try {
    const deals = await prisma.splitDeal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    if (deals && deals.length > 0) {
      for (const deal of deals) {
        const existing = inMemorySplitCharges.find(c => c.chargeId === deal.dealCode);
        if (!existing) {
          inMemorySplitCharges.push({
            chargeId: deal.dealCode,
            tenantId: deal.tenantId,
            taxCaseId: deal.taxCalculationCaseId || 'CASE_RECOVERY',
            valorTotalHonorariosBrl: Number(deal.totalSuccessFeeAmount),
            metodoPagamento: 'PIX_DINAMICO',
            clienteDevedor: {
              razaoSocial: 'Cliente Pagador',
              cnpj: '00.000.000/0001-00',
              email: 'contato@cliente.com.br'
            },
            splitRules: {
              partnerSubaccountId: deal.partnerOfficeId,
              partnerName: 'Parceiro Credenciado',
              partnerPercentage: 50.0,
              partnerAmountBrl: Number(deal.partnerSplitAmount),
              partnerPixKey: 'parceiro@pix.com.br',
              partnerNfseStatus: deal.status === 'SPLIT_CONCLUIDO' ? 'EMITIDA' : 'PENDENTE',
              velatrixSubaccountId: 'subacc_velatrix_master',
              velatrixPercentage: 50.0,
              velatrixAmountBrl: 0, // P23
              velatrixNfseStatus: deal.status === 'SPLIT_CONCLUIDO' ? 'EMITIDA' : 'PENDENTE'
            },
            status: (deal.status as any) || 'PENDENTE_PAGAMENTO',
            dataCriacao: deal.createdAt ? deal.createdAt.toISOString() : new Date().toISOString(),
            dataVencimento: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
            isSimulated: true
          });
        }
      }
    }
  } catch (err) {
    console.warn('[splitRepository.listBaasSplitCharges] Prisma fallback:', err);
  }
  return inMemorySplitCharges;
}

export async function saveBaasSplitCharge(instruction: BaasSplitChargeInstruction): Promise<BaasSplitChargeInstruction> {
  const existingIdx = inMemorySplitCharges.findIndex(c => c.chargeId === instruction.chargeId);
  if (existingIdx >= 0) {
    inMemorySplitCharges[existingIdx] = instruction;
  } else {
    inMemorySplitCharges.unshift(instruction);
  }

  if (!isPrismaActive) {
    return instruction;
  }

  try {
    await prisma.splitDeal.upsert({
      where: { dealCode: instruction.chargeId },
      update: {
        status: instruction.status,
      },
      create: {
        id: instruction.chargeId,
        dealCode: instruction.chargeId,
        dealTitle: `Divisão de honorários entre profissionais - ${instruction.taxCaseId}`,
        tenantId: instruction.tenantId || 'tenant_nexus_01',
        partnerOfficeId: instruction.splitRules.partnerSubaccountId || 'subacc_oab_01',
        estimatedBenefitAmount: instruction.valorTotalHonorariosBrl * 5,
        successFeePercent: 20.0,
        totalSuccessFeeAmount: instruction.valorTotalHonorariosBrl,
        partnerSplitPercent: 50.0,
        partnerSplitAmount: instruction.splitRules.partnerAmountBrl,
        velatrixSplitPercent: 0.0,
        velatrixSplitAmount: instruction.splitRules.velatrixAmountBrl,
        status: instruction.status,
      },
    });
  } catch (err) {
    console.warn('[splitRepository.saveBaasSplitCharge] Prisma write fallback:', err);
  }

  return instruction;
}

export function settleBaasSplitChargeSync(chargeId: string): {
  charge: BaasSplitChargeInstruction | null;
  dualNfseTriggered: boolean;
  partnerNfseNumber: string;
  velatrixNfseNumber: string;
  bacenEndToEndId: string;
  isSimulated: boolean;
} {
  const charge = inMemorySplitCharges.find(c => c.chargeId === chargeId);
  const bacenEndToEndId = `E000381662026${Date.now()}s${secureInt(0, 99999)}`;
  const partnerNfseNumber = `NFS-E-ADV-2026-${secureInt(100000, 999999)}`;
  const velatrixNfseNumber = `NFS-E-VLX-2026-${secureInt(100000, 999999)}`;

  if (charge) {
    charge.status = 'SPLIT_CONCLUIDO';
    charge.dataLiquidacao = new Date().toISOString().replace('T', ' ').slice(0, 19);
    charge.endToEndBacenId = bacenEndToEndId;
    charge.splitRules.partnerNfseStatus = 'EMITIDA';
    charge.splitRules.velatrixNfseStatus = 'EMITIDA';
    charge.isSimulated = true;

    // Credit partner subaccount
    updateBaasSubaccountBalance(charge.splitRules.partnerSubaccountId, charge.splitRules.partnerAmountBrl).catch(() => {});
  }

  if (isPrismaActive && charge) {
    prisma.splitDeal.updateMany({
      where: { dealCode: charge.chargeId },
      data: { status: 'SPLIT_CONCLUIDO' }
    }).catch(err => console.warn('[splitRepository.settleBaasSplitChargeSync] Prisma fallback:', err));

    prisma.payout.create({
      data: {
        payoutNumber: `PAY-${charge.chargeId}`,
        tenantId: charge.tenantId || 'tenant_nexus_01',
        partnerOfficeId: charge.splitRules.partnerSubaccountId || 'subacc_oab_01',
        grossAmount: charge.valorTotalHonorariosBrl,
        partnerAmount: charge.splitRules.partnerAmountBrl,
        velatrixAmount: charge.splitRules.velatrixAmountBrl,
        method: 'PIX_CNPJ',
        status: 'LIQUIDADO',
        destinationPixKeyMasked: charge.splitRules.partnerPixKey,
        transactionId: bacenEndToEndId,
        settledAt: new Date(),
      }
    }).catch(err => console.warn('[splitRepository.settleBaasSplitChargeSync] Prisma fallback:', err));

    prisma.nfseRecord.create({
      data: {
        nfseNumber: partnerNfseNumber,
        tenantId: charge.tenantId || 'tenant_nexus_01',
        partnerOfficeId: charge.splitRules.partnerSubaccountId || 'subacc_oab_01',
        operationType: 'TAX_RECOVERY_SUCCESS_FEE',
        operationDescription: `Honorários Advocatícios/Periciais - ${charge.taxCaseId}`,
        grossAmountBrl: charge.splitRules.partnerAmountBrl,
        partnerSplitPct: 100,
        partnerSplitAmountBrl: charge.splitRules.partnerAmountBrl,
        velatrixRetainedAmountBrl: 0,
        issRatePct: 2.0,
        issAmountBrl: charge.splitRules.partnerAmountBrl * 0.02,
        status: 'EMITIDA',
        emissionDate: new Date(),
      }
    }).catch(err => console.warn('[splitRepository.settleBaasSplitChargeSync] Prisma fallback:', err));

    // P23: sem retenção da plataforma sobre honorários → não há NFS-e da Velatrix neste fluxo.
    if (Number(charge.splitRules.velatrixAmountBrl) > 0) prisma.nfseRecord.create({
      data: {
        nfseNumber: velatrixNfseNumber,
        tenantId: charge.tenantId || 'tenant_nexus_01',
        partnerOfficeId: charge.splitRules.partnerSubaccountId || 'subacc_oab_01',
        operationType: 'SAAS_SUBSCRIPTION',
        operationDescription: `Velatrix AOS (legado, desativado) - ${charge.taxCaseId}`,
        grossAmountBrl: charge.splitRules.velatrixAmountBrl,
        partnerSplitPct: 0,
        partnerSplitAmountBrl: 0,
        velatrixRetainedAmountBrl: charge.splitRules.velatrixAmountBrl,
        issRatePct: 2.0,
        issAmountBrl: charge.splitRules.velatrixAmountBrl * 0.02,
        status: 'EMITIDA',
        emissionDate: new Date(),
      }
    }).catch(err => console.warn('[splitRepository.settleBaasSplitChargeSync] Prisma fallback:', err));
  }

  return {
    charge: charge || null,
    dualNfseTriggered: true,
    partnerNfseNumber,
    velatrixNfseNumber,
    bacenEndToEndId,
    isSimulated: true,
  };
}

export async function settleBaasSplitCharge(chargeId: string): Promise<{
  charge: BaasSplitChargeInstruction | null;
  dualNfseTriggered: boolean;
  partnerNfseNumber: string;
  velatrixNfseNumber: string;
  bacenEndToEndId: string;
  isSimulated: boolean;
}> {
  return settleBaasSplitChargeSync(chargeId);
}
