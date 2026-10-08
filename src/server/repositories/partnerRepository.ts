import { prisma, isPrismaActive } from '../../lib/prisma';
import { ProspectLead, TaxProfessional } from '../../data/mockOfficeData';
import { INITIAL_MOCK_PROSPECTS, INITIAL_MOCK_TAX_PROFESSIONALS } from '../../data/mockOfficeData';
import { BaasSubaccount } from '../../types/integrationConnectors';
import { secureId, secureInt } from '../../lib/demoMode';
import { exigirDemoOuFalhar } from '../http/erroBanco';

export interface PartnerOfficeDto {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  oabOrCrc: string;
  primaryLawyerOrAccountant: string;
  email: string;
  phone?: string;
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  defaultSplitPct: number;
  defaultVelatrixPct: number;
  status: string;
}

const DEFAULT_OFFICE: PartnerOfficeDto = {
  id: 'partner_adv_vasconcelos',
  name: 'Vasconcelos & Associados Advocacia Tributária',
  tradeName: 'Vasconcelos Tax Law',
  cnpj: '38.192.401/0001-77',
  oabOrCrc: 'OAB/SP 284.910',
  primaryLawyerOrAccountant: 'Dr. Marcelo Vasconcelos Ribeiro',
  email: 'marcelo@vasconcelosadv.com.br',
  phone: '(11) 98412-4400',
  brandPrimaryColor: '#4F46E5',
  brandSecondaryColor: '#06B6D4',
  defaultSplitPct: 70,
  defaultVelatrixPct: 0, // P23: plataforma não participa de honorários
  status: 'ACTIVE',
};

export async function listPartnerOffices(): Promise<PartnerOfficeDto[]> {
  if (!isPrismaActive) {
    return [DEFAULT_OFFICE];
  }
  try {
    const offices = await prisma.partnerOffice.findMany({
      orderBy: { name: 'asc' },
    });
    if (offices && offices.length > 0) {
      return offices.map(o => ({
        id: o.id,
        name: o.name,
        tradeName: o.tradeName || undefined,
        cnpj: o.cnpj || undefined,
        oabOrCrc: o.oabOrCrc,
        primaryLawyerOrAccountant: o.primaryLawyerOrAccountant,
        email: o.email,
        phone: o.phone || undefined,
        brandPrimaryColor: o.brandPrimaryColor,
        brandSecondaryColor: o.brandSecondaryColor,
        defaultSplitPct: Number(o.defaultSplitPct),
        defaultVelatrixPct: Number(o.defaultVelatrixPct),
        status: o.status,
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.listPartnerOffices');
    console.warn('[partnerRepository.listPartnerOffices] Prisma fallback:', err);
  }
  return [DEFAULT_OFFICE];
}

// Dynamic in-memory store fallback synced across requests
let inMemoryLeads: ProspectLead[] = [...INITIAL_MOCK_PROSPECTS];
let inMemoryProfessionals: TaxProfessional[] = [...INITIAL_MOCK_TAX_PROFESSIONALS];

export async function listProspectLeads(partnerOfficeId?: string): Promise<ProspectLead[]> {
  if (!isPrismaActive) {
    return inMemoryLeads;
  }
  try {
    const leads = await prisma.prospectLead.findMany({
      where: partnerOfficeId ? { partnerOfficeId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    if (leads && leads.length > 0) {
      return leads.map(l => ({
        id: l.id,
        name: l.name,
        cnpj: l.cnpj,
        sector: l.sector,
        sectorLabel: l.sectorLabel || l.sector,
        stage: (l.stage.toLowerCase() as any) || 'lead',
        responsibleName: l.responsibleName || 'Consultor AOS',
        estimatedMrrBrl: Number(l.estimatedMrrBrl || 0),
        lastContactDate: l.lastContactDate ? l.lastContactDate.toISOString().slice(0, 10) : '2026-09-12',
        notes: l.notes || '',
        origem: (l.origem as any) || 'LANDING_PAGE',
        cnae: l.cnae || undefined,
        regimeTributarioEstimado: l.regimeTributarioEstimado || 'Lucro Real',
        tesesAplicaveis: l.tesesAplicaveis,
        scoreAderencia: l.scoreAderencia ?? 85,
        faixaCreditoEstimado: l.faixaCreditoEstimado || 'R$ 150.000 - R$ 400.000',
        dataDiagnostico: l.dataDiagnostico ? l.dataDiagnostico.toISOString().slice(0, 10) : undefined,
        autoDiagnosticoCompleto: l.autoDiagnosticoCompleto,
        assignedProfessionalId: l.assignedUserId || undefined,
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.listProspectLeads');
    console.warn('[partnerRepository.listProspectLeads] Prisma fallback:', err);
  }
  return inMemoryLeads;
}

export async function getProspectLeadById(id: string): Promise<ProspectLead | null> {
  if (!isPrismaActive) {
    const fallback = inMemoryLeads.find(l => l.id === id || l.cnpj === id);
    return fallback ? { ...fallback } : null;
  }
  try {
    const l = await prisma.prospectLead.findUnique({
      where: { id },
    });
    if (l) {
      return {
        id: l.id,
        name: l.name,
        cnpj: l.cnpj,
        sector: l.sector,
        sectorLabel: l.sectorLabel || l.sector,
        stage: (l.stage.toLowerCase() as any) || 'lead',
        responsibleName: l.responsibleName || 'Consultor AOS',
        estimatedMrrBrl: Number(l.estimatedMrrBrl || 0),
        lastContactDate: l.lastContactDate ? l.lastContactDate.toISOString().slice(0, 10) : '2026-09-12',
        notes: l.notes || '',
        origem: (l.origem as any) || 'LANDING_PAGE',
        cnae: l.cnae || undefined,
        regimeTributarioEstimado: l.regimeTributarioEstimado || 'Lucro Real',
        tesesAplicaveis: l.tesesAplicaveis,
        scoreAderencia: l.scoreAderencia ?? 85,
        faixaCreditoEstimado: l.faixaCreditoEstimado || 'R$ 150.000 - R$ 400.000',
        dataDiagnostico: l.dataDiagnostico ? l.dataDiagnostico.toISOString().slice(0, 10) : undefined,
        autoDiagnosticoCompleto: l.autoDiagnosticoCompleto,
        assignedProfessionalId: l.assignedUserId || undefined,
      };
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.getProspectLeadById');
    console.warn(`[partnerRepository.getProspectLeadById] Prisma fallback for ${id}:`, err);
  }
  const found = inMemoryLeads.find(l => l.id === id || l.cnpj === id);
  return found ? { ...found } : null;
}

export async function createProspectLead(data: Partial<ProspectLead>): Promise<ProspectLead> {
  const generatedId = data.id || `lead_${Date.now()}_${secureId('', 4)}`;
  const cleanCnpj = data.cnpj || `${secureInt(10, 98)}.${secureInt(100, 998)}.${secureInt(100, 998)}/0001-${secureInt(10, 98)}`;
  const newLead: ProspectLead = {
    id: generatedId,
    name: data.name || 'Nova Empresa Prospect',
    tradeName: data.tradeName || data.name,
    cnpj: cleanCnpj,
    sector: data.sector || 'manufacturing',
    sectorLabel: data.sectorLabel || 'Manufatura & Indústria',
    stage: data.stage || 'lead',
    origem: data.origem || 'LANDING_PAGE',
    responsibleName: data.responsibleName || 'Aguardando Distribuição',
    estimatedMrrBrl: Number(data.estimatedMrrBrl || 0),
    lastContactDate: data.lastContactDate || new Date().toISOString().slice(0, 10),
    notes: data.notes || '',
    cnae: data.cnae,
    regimeTributarioEstimado: data.regimeTributarioEstimado || 'Lucro Real',
    tesesAplicaveis: data.tesesAplicaveis || ['TEMA_69_STF_ICMS_PIS_COFINS'],
    scoreAderencia: data.scoreAderencia ?? 88,
    faixaCreditoEstimado: data.faixaCreditoEstimado || 'R$ 200.000 - R$ 600.000',
    dataDiagnostico: data.dataDiagnostico || new Date().toISOString().slice(0, 10),
    autoDiagnosticoCompleto: data.autoDiagnosticoCompleto ?? true,
    assignmentStatus: data.assignmentStatus || 'WAITING_DISTRIBUTION',
    assignedProfessionalId: data.assignedProfessionalId,
    assignedAt: data.assignedAt,
  };

  if (!isPrismaActive) {
    inMemoryLeads.unshift(newLead);
    return newLead;
  }

  try {
    const rawStage = (newLead.stage || 'lead').toUpperCase();
    let stageEnum: any = 'LEAD';
    if (rawStage.includes('PROP')) stageEnum = 'PROPOSAL_SENT';
    else if (rawStage.includes('NEG')) stageEnum = 'NEGOTIATION';
    else if (rawStage.includes('CLOS') || rawStage.includes('FECH')) stageEnum = 'CLOSED';

    const created = await prisma.prospectLead.create({
      data: {
        name: newLead.name,
        tradeName: newLead.tradeName,
        cnpj: newLead.cnpj,
        sector: newLead.sector,
        sectorLabel: newLead.sectorLabel,
        stage: stageEnum,
        origem: (newLead.origem as any) || 'LANDING_PAGE',
        responsibleName: newLead.responsibleName,
        estimatedMrrBrl: newLead.estimatedMrrBrl,
        notes: newLead.notes,
        cnae: newLead.cnae,
        regimeTributarioEstimado: newLead.regimeTributarioEstimado,
        tesesAplicaveis: newLead.tesesAplicaveis,
        scoreAderencia: newLead.scoreAderencia,
        faixaCreditoEstimado: newLead.faixaCreditoEstimado,
        autoDiagnosticoCompleto: newLead.autoDiagnosticoCompleto,
        assignedUserId: newLead.assignedProfessionalId,
      },
    });
    newLead.id = created.id;
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.createProspectLead');
    console.warn('[partnerRepository.createProspectLead] Prisma fallback:', err);
  }

  inMemoryLeads.unshift(newLead);
  return newLead;
}

export async function updateProspectLead(id: string, updates: Partial<ProspectLead>): Promise<ProspectLead | null> {
  if (isPrismaActive) {
    try {
      const dataToUpdate: any = {};
      if (updates.stage) {
        const raw = updates.stage.toUpperCase();
        if (raw.includes('PROP')) dataToUpdate.stage = 'PROPOSAL_SENT';
        else if (raw.includes('NEG')) dataToUpdate.stage = 'NEGOTIATION';
        else if (raw.includes('CLOS') || raw.includes('FECH')) dataToUpdate.stage = 'CLOSED';
        else dataToUpdate.stage = 'LEAD';
      }
      if (updates.responsibleName !== undefined) dataToUpdate.responsibleName = updates.responsibleName;
      if (updates.assignedProfessionalId !== undefined) dataToUpdate.assignedUserId = updates.assignedProfessionalId;
      if (updates.notes !== undefined) dataToUpdate.notes = updates.notes;
      if (updates.estimatedMrrBrl !== undefined) dataToUpdate.estimatedMrrBrl = updates.estimatedMrrBrl;

      await prisma.prospectLead.update({
        where: { id },
        data: dataToUpdate,
      });
    } catch (err) {
      exigirDemoOuFalhar(err, 'partnerRepository.updateProspectLead');
      console.warn(`[partnerRepository.updateProspectLead] Prisma fallback for ${id}:`, err);
    }
  }

  const idx = inMemoryLeads.findIndex(l => l.id === id);
  if (idx >= 0) {
    inMemoryLeads[idx] = { ...inMemoryLeads[idx], ...updates };
    return inMemoryLeads[idx];
  }
  return null;
}

export async function listTaxProfessionals(): Promise<TaxProfessional[]> {
  if (!isPrismaActive) {
    return inMemoryProfessionals;
  }
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADVOGADO_PARCEIRO', 'CONTADOR_PARCEIRO'],
        },
      },
      include: {
        assignedLeads: true,
      },
    });
    if (users && users.length > 0) {
      return users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role === 'ADVOGADO_PARCEIRO' ? 'Advogado' : 'Contador',
        status: 'Disponível',
        maxCapacity: 15,
        activeLeadsCount: u.assignedLeads.length,
        activeInQueue: true,
        specialties: u.role === 'ADVOGADO_PARCEIRO'
          ? ['Tema 69 STF', 'Exclusão ICMS-ST', 'Créditos Acumulados']
          : ['SPED Fiscal', 'EFD-Contribuições', 'Reconciliação Monofásica'],
        registrationNumber: u.registrationNumber || u.oabOrCrc || 'OAB/SP 284.910',
      }));
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.listTaxProfessionals');
    console.warn('[partnerRepository.listTaxProfessionals] Prisma fallback:', err);
  }
  return inMemoryProfessionals;
}

export async function updateTaxProfessional(id: string, updates: Partial<TaxProfessional>): Promise<TaxProfessional | null> {
  const idx = inMemoryProfessionals.findIndex(p => p.id === id);
  if (idx >= 0) {
    inMemoryProfessionals[idx] = { ...inMemoryProfessionals[idx], ...updates };
    return inMemoryProfessionals[idx];
  }
  return null;
}

export async function updateProspectLeadStage(id: string, stage: 'lead' | 'proposal_sent' | 'negotiation' | 'closed'): Promise<boolean> {
  await updateProspectLead(id, { stage });
  return true;
}

// ---------------------------------------------------------
// BAAS SUBACCOUNTS PERSISTENCE (Prisma / Postgres & Memory)
// ---------------------------------------------------------

const INITIAL_SUBCONF_ACCOUNTS_SEED: BaasSubaccount[] = [
  {
    id: 'subacc_oab_01',
    provider: 'ASAAS',
    subaccountIdOnProvider: 'cus_sub_asaas_884912903',
    holderName: 'Vasconcelos & Associados Advocacia Tributária',
    holderCnpjCpf: '38.192.401/0001-77',
    holderType: 'ADVOGADO_PARCEIRO',
    registrationCode: 'OAB/SP 284.910',
    walletBalanceBrl: 74450.00,
    pixKey: '38192401000177',
    bankAccount: {
      bankCode: '033',
      bankName: 'Banco Santander (Brasil) S.A.',
      agency: '1420',
      accountNumber: '991823-4'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-08-01T09:00:00Z',
    isSimulated: true
  },
  {
    id: 'subacc_crc_02',
    provider: 'STARK_BANK',
    subaccountIdOnProvider: 'stark_acc_55192038194',
    holderName: 'Audittax Perícias & Auditoria Contábil Ltda',
    holderCnpjCpf: '24.901.819/0001-33',
    holderType: 'PERITO_CONTABIL',
    registrationCode: 'CRC/SP 1SP284560/O-2',
    walletBalanceBrl: 32180.00,
    pixKey: 'pix@audittax.com.br',
    bankAccount: {
      bankCode: '260',
      bankName: 'Nu Pagamentos S.A.',
      agency: '0001',
      accountNumber: '8839120-1'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-08-15T14:30:00Z',
    isSimulated: true
  }
];

let inMemoryBaasSubaccounts: BaasSubaccount[] = [...INITIAL_SUBCONF_ACCOUNTS_SEED];

export function getBaasSubaccountsSync(): BaasSubaccount[] {
  return inMemoryBaasSubaccounts;
}

export async function listBaasSubaccounts(): Promise<BaasSubaccount[]> {
  if (!isPrismaActive) {
    return inMemoryBaasSubaccounts;
  }
  try {
    const offices = await prisma.partnerOffice.findMany();
    if (offices && offices.length > 0) {
      // Merge with inMemoryBaasSubaccounts to keep BaaS provider metadata
      for (const off of offices) {
        const existing = inMemoryBaasSubaccounts.find(s => s.id === off.id || s.holderCnpjCpf === off.cnpj);
        if (!existing) {
          inMemoryBaasSubaccounts.push({
            id: off.id,
            provider: 'ASAAS',
            subaccountIdOnProvider: `cus_sub_${off.id}`,
            holderName: off.name,
            holderCnpjCpf: off.cnpj || '00.000.000/0000-00',
            holderType: off.oabOrCrc.includes('OAB') ? 'ADVOGADO_PARCEIRO' : 'PERITO_CONTABIL',
            registrationCode: off.oabOrCrc,
            walletBalanceBrl: 0,
            pixKey: off.pixKey || off.email,
            bankAccount: {
              bankCode: off.bankCode || '033',
              bankName: off.bankName || 'Banco Santander',
              agency: off.agency || '0001',
              accountNumber: off.accountNumber || '12345-6'
            },
            kycStatus: 'APROVADO_BACEN',
            createdAt: off.createdAt ? off.createdAt.toISOString() : new Date().toISOString(),
            isSimulated: true,
          });
        }
      }
    }
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.listBaasSubaccounts');
    console.warn('[partnerRepository.listBaasSubaccounts] Prisma fallback:', err);
  }
  return inMemoryBaasSubaccounts;
}

export async function saveBaasSubaccount(sub: BaasSubaccount): Promise<BaasSubaccount> {
  const existingIdx = inMemoryBaasSubaccounts.findIndex(s => s.id === sub.id);
  if (existingIdx >= 0) {
    inMemoryBaasSubaccounts[existingIdx] = sub;
  } else {
    inMemoryBaasSubaccounts.push(sub);
  }

  if (!isPrismaActive) {
    return sub;
  }

  try {
    await prisma.partnerOffice.upsert({
      where: { id: sub.id },
      update: {
        name: sub.holderName,
        cnpj: sub.holderCnpjCpf,
        oabOrCrc: sub.registrationCode,
        primaryLawyerOrAccountant: sub.holderName,
        pixKey: sub.pixKey,
        bankCode: sub.bankAccount.bankCode,
        bankName: sub.bankAccount.bankName,
        agency: sub.bankAccount.agency,
        accountNumber: sub.bankAccount.accountNumber,
        status: 'ACTIVE',
      },
      create: {
        id: sub.id,
        name: sub.holderName,
        tradeName: sub.holderName,
        cnpj: sub.holderCnpjCpf,
        oabOrCrc: sub.registrationCode,
        primaryLawyerOrAccountant: sub.holderName,
        email: `${sub.id.replace(/[^a-zA-Z0-9]/g, '')}@parceiro.velatrix.ai`,
        pixKey: sub.pixKey,
        bankCode: sub.bankAccount.bankCode,
        bankName: sub.bankAccount.bankName,
        agency: sub.bankAccount.agency,
        accountNumber: sub.bankAccount.accountNumber,
        defaultSplitPct: 50.0,
        defaultVelatrixPct: 0.0, // P23
        status: 'ACTIVE',
      },
    });
  } catch (err) {
    exigirDemoOuFalhar(err, 'partnerRepository.saveBaasSubaccount');
    console.warn('[partnerRepository.saveBaasSubaccount] Prisma write fallback:', err);
  }

  return sub;
}

export async function updateBaasSubaccountBalance(id: string, additionalBalance: number): Promise<void> {
  const sub = inMemoryBaasSubaccounts.find(s => s.id === id);
  if (sub) {
    sub.walletBalanceBrl += additionalBalance;
  }
}
