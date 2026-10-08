import { TenantProfile, AuditRecord } from '../types/aos';
import { StrategicHub, MicroAgentDefinition } from '../types/autonomousSwarm';
import { ProspectLead, TaxProfessional } from '../data/mockOfficeData';
import { INITIAL_MOCK_TENANTS } from '../data/mockSuperAdmin';
import { INITIAL_MOCK_PROSPECTS, INITIAL_MOCK_TAX_PROFESSIONALS } from '../data/mockOfficeData';
import { STRATEGIC_HUBS, ALL_300_MICRO_AGENTS } from '../data/swarmHubsCatalog';
import { DEFAULT_PARTNER_PROFILE } from './partnerGrowthService';
import { authFetch as fetch } from './authClient';

export interface PartnerOfficeInfo {
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

const DEFAULT_OFFICE: PartnerOfficeInfo = {
  id: DEFAULT_PARTNER_PROFILE.partnerId || 'partner_adv_vasconcelos',
  name: DEFAULT_PARTNER_PROFILE.firmName,
  tradeName: 'Vasconcelos Tax Law',
  cnpj: '38.192.401/0001-77',
  oabOrCrc: DEFAULT_PARTNER_PROFILE.oabOrCrc,
  primaryLawyerOrAccountant: DEFAULT_PARTNER_PROFILE.lawyerName,
  email: DEFAULT_PARTNER_PROFILE.email,
  phone: DEFAULT_PARTNER_PROFILE.phone,
  brandPrimaryColor: DEFAULT_PARTNER_PROFILE.brandPrimaryColor,
  brandSecondaryColor: DEFAULT_PARTNER_PROFILE.brandSecondaryColor,
  defaultSplitPct: 70,
  defaultVelatrixPct: 30,
  status: 'ACTIVE',
};

export async function fetchTenants(): Promise<TenantProfile[]> {
  try {
    const res = await fetch('/api/v1/data/tenants');
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchTenants] Remote API unreachable, using resilient seed cache:', err);
  }
  return [...INITIAL_MOCK_TENANTS];
}

export async function fetchPartnerOffices(): Promise<PartnerOfficeInfo[]> {
  try {
    const res = await fetch('/api/v1/data/partners');
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchPartnerOffices] Remote API unreachable, using resilient seed cache:', err);
  }
  return [DEFAULT_OFFICE];
}

export async function fetchProspectLeads(officeId?: string): Promise<ProspectLead[]> {
  try {
    const url = officeId ? `/api/v1/data/prospects?officeId=${encodeURIComponent(officeId)}` : '/api/v1/data/prospects';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchProspectLeads] Remote API unreachable, using resilient seed cache:', err);
  }
  return [...INITIAL_MOCK_PROSPECTS];
}

export async function fetchTaxProfessionals(): Promise<TaxProfessional[]> {
  try {
    const res = await fetch('/api/v1/data/professionals');
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchTaxProfessionals] Remote API unreachable, using resilient seed cache:', err);
  }
  return [...INITIAL_MOCK_TAX_PROFESSIONALS];
}

export async function fetchStrategicHubs(): Promise<StrategicHub[]> {
  try {
    const res = await fetch('/api/v1/data/hubs');
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchStrategicHubs] Remote API unreachable, using resilient seed cache:', err);
  }
  return [...STRATEGIC_HUBS];
}

export async function fetchMicroAgents(hubId?: string): Promise<MicroAgentDefinition[]> {
  try {
    const url = hubId ? `/api/v1/data/micro-agents?hubId=${encodeURIComponent(hubId)}` : '/api/v1/data/micro-agents';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchMicroAgents] Remote API unreachable, using resilient seed cache:', err);
  }
  if (hubId) {
    return ALL_300_MICRO_AGENTS.filter(a => a.hubId === hubId);
  }
  return [...ALL_300_MICRO_AGENTS];
}

export async function fetchAuditLedgerEntries(tenantId?: string): Promise<AuditRecord[]> {
  try {
    const url = tenantId ? `/api/v1/data/audit-ledger?tenantId=${encodeURIComponent(tenantId)}` : '/api/v1/data/audit-ledger';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchAuditLedgerEntries] Remote API unreachable:', err);
  }
  return [];
}

export async function saveAuditLedgerEntry(record: AuditRecord): Promise<AuditRecord> {
  try {
    const res = await fetch('/api/v1/data/audit-ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.saveAuditLedgerEntry] Remote API fallback:', err);
  }
  return record;
}

// =========================================================================
// TAX CASES (CASOS PERICIAIS - EXCLUSÃO ICMS PIS/COFINS TEMA 69)
// =========================================================================
export async function fetchTaxCases(tenantId?: string): Promise<any[]> {
  try {
    const url = tenantId ? `/api/v1/data/tax-cases?tenantId=${encodeURIComponent(tenantId)}` : '/api/v1/data/tax-cases';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.debug('[dataService.fetchTaxCases] Remote API fallback:', err);
  }
  return [];
}

export async function fetchTaxCaseById(id: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/v1/data/tax-cases/${encodeURIComponent(id)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug(`[dataService.fetchTaxCaseById] Remote API fallback for ${id}:`, err);
  }
  return null;
}

export async function saveTaxCase(caseData: any): Promise<any> {
  try {
    const res = await fetch('/api/v1/data/tax-cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(caseData),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.saveTaxCase] Remote API fallback:', err);
  }
  return caseData;
}

// =========================================================================
// SPLIT DEALS, PAYOUTS & DUAL NFSE RECORDS
// =========================================================================
export async function fetchSplitDeals(tenantId?: string, officeId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (officeId) params.append('officeId', officeId);
    const url = `/api/v1/data/split-deals${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.fetchSplitDeals] Remote API fallback:', err);
  }
  return [];
}

export async function saveSplitDeal(dealData: any): Promise<any> {
  try {
    const res = await fetch('/api/v1/data/split-deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dealData),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.saveSplitDeal] Remote API fallback:', err);
  }
  return dealData;
}

export async function fetchPayouts(tenantId?: string, officeId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (officeId) params.append('officeId', officeId);
    const url = `/api/v1/data/payouts${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.fetchPayouts] Remote API fallback:', err);
  }
  return [];
}

export async function savePayout(payoutData: any): Promise<any> {
  try {
    const res = await fetch('/api/v1/data/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payoutData),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.savePayout] Remote API fallback:', err);
  }
  return payoutData;
}

export async function updatePayoutStatusApi(
  id: string,
  status: string,
  proofHashSha256?: string,
  transactionId?: string
): Promise<any> {
  try {
    const res = await fetch(`/api/v1/data/payouts/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, proofHashSha256, transactionId }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug(`[dataService.updatePayoutStatusApi] Remote API fallback for ${id}:`, err);
  }
  return null;
}

export async function fetchNfseRecords(tenantId?: string, officeId?: string): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenantId', tenantId);
    if (officeId) params.append('officeId', officeId);
    const url = `/api/v1/data/nfse-records${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.fetchNfseRecords] Remote API fallback:', err);
  }
  return [];
}

export async function saveNfseRecord(nfseData: any): Promise<any> {
  try {
    const res = await fetch('/api/v1/data/nfse-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nfseData),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.saveNfseRecord] Remote API fallback:', err);
  }
  return nfseData;
}

// =========================================================================
// LEADS & PROSPECTS
// =========================================================================
export async function saveProspectLead(leadData: Partial<ProspectLead>): Promise<ProspectLead> {
  try {
    const res = await fetch('/api/v1/data/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug('[dataService.saveProspectLead] Remote API fallback:', err);
  }
  return leadData as ProspectLead;
}

export async function updateProspectLeadStage(id: string, stage: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/data/prospects/${encodeURIComponent(id)}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      const json = await res.json();
      return Boolean(json?.success);
    }
  } catch (err) {
    console.debug(`[dataService.updateProspectLeadStage] Remote API fallback for ${id}:`, err);
  }
  return true;
}

export async function updateProspectLead(id: string, updates: Partial<ProspectLead>): Promise<ProspectLead | null> {
  try {
    const res = await fetch(`/api/v1/data/prospects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) return json.data;
    }
  } catch (err) {
    console.debug(`[dataService.updateProspectLead] Remote API fallback for ${id}:`, err);
  }
  return null;
}

