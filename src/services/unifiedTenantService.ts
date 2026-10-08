// src/services/unifiedTenantService.ts
/**
 * Velatrix AOS - Unified Master Tenant & Client Service (Single Source of Truth)
 * 
 * Unifica e sincroniza o contexto do Tenant/CNPJ ativo entre todos os módulos:
 * - Diagnóstico Integral & Proposta Executiva AOS
 * - Defesa & Recuperação Fiscal (incluindo dropdown "Tenant Selecionado")
 * - Perito Contábil & Laudos Periciais
 * - Cascata DRE & SPED
 * - Portal de Parceiros & Split Tributário
 * - PGFN / Transação Tributária
 * - Gestão de Usuários & IAM
 */

import { TenantProfile } from '../types/aos';
import { INITIAL_MOCK_TENANTS } from '../data/mockSuperAdmin';
import { DEMO_LAW_FIRM_TENANT_ID, DEMO_LAW_FIRM_MIGRATION_KEY } from '../data/demoLawFirm';

const STORAGE_KEY_TENANTS = 'velatrix_unified_tenants_registry_v1';
const STORAGE_KEY_ACTIVE_TENANT_ID = 'velatrix_active_tenant_id_v1';

export class UnifiedTenantService {
  private static tenants: TenantProfile[] = [];
  private static activeTenantId: string = '';
  private static listeners: Set<(tenant: TenantProfile) => void> = new Set();
  private static initialized: boolean = false;

  public static normalizeCnpj(cnpj: string): string {
    return (cnpj || '').replace(/\D/g, '');
  }

  public static initialize(): void {
    if (this.initialized) return;

    let loaded: TenantProfile[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TENANTS);
      if (stored) {
        loaded = JSON.parse(stored);
      }
    } catch {
      loaded = [];
    }

    // P22: migração única — o tenant jurídico de demo volta ao seed atual (plano, membros)
    // e passa a ser o tenant ativo, mesmo em navegadores que já tinham outro salvo.
    let migrarDemoJuridico = false;
    try {
      migrarDemoJuridico = localStorage.getItem(DEMO_LAW_FIRM_MIGRATION_KEY) !== '1';
    } catch {
      migrarDemoJuridico = false;
    }
    if (migrarDemoJuridico) loaded = loaded.filter(t => t.id !== DEMO_LAW_FIRM_TENANT_ID);

    // Merge base initial tenants with any stored custom tenants
    const tenantMap = new Map<string, TenantProfile>();
    INITIAL_MOCK_TENANTS.forEach(t => tenantMap.set(t.id, t));
    loaded.forEach(t => tenantMap.set(t.id, t));

    // P24: campos comerciais do tenant jurídico de demo vêm sempre do seed em código
    // (um registro salvo antigo não pode rebaixar o plano da demonstração).
    const seedDemo = INITIAL_MOCK_TENANTS.find(t => t.id === DEMO_LAW_FIRM_TENANT_ID);
    const salvoDemo = tenantMap.get(DEMO_LAW_FIRM_TENANT_ID);
    if (seedDemo && salvoDemo) {
      tenantMap.set(DEMO_LAW_FIRM_TENANT_ID, {
        ...salvoDemo,
        plano: seedDemo.plano,
        planTier: seedDemo.planTier,
        sector: seedDemo.sector,
        sectorLabel: seedDemo.sectorLabel,
        mrrBrl: seedDemo.mrrBrl,
        connectedErp: seedDemo.connectedErp,
        connectedChannels: seedDemo.connectedChannels,
        regulatoryStandard: seedDemo.regulatoryStandard,
      });
    }

    this.tenants = Array.from(tenantMap.values());

    // Determine initial active tenant
    const storedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_TENANT_ID);
    if (migrarDemoJuridico && this.tenants.some(t => t.id === DEMO_LAW_FIRM_TENANT_ID)) {
      this.activeTenantId = DEMO_LAW_FIRM_TENANT_ID;
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_TENANT_ID, DEMO_LAW_FIRM_TENANT_ID);
        localStorage.setItem(DEMO_LAW_FIRM_MIGRATION_KEY, '1');
      } catch { /* storage indisponível */ }
    } else if (storedActiveId && this.tenants.some(t => t.id === storedActiveId)) {
      this.activeTenantId = storedActiveId;
    } else {
      // Padrão: tenant jurídico de demonstração (P22) ou o primeiro disponível
      const defaultTenant = this.tenants.find(t => t.id === DEMO_LAW_FIRM_TENANT_ID) || this.tenants[0];
      this.activeTenantId = defaultTenant.id;
    }

    this.initialized = true;
  }

  public static getAllTenants(): TenantProfile[] {
    this.initialize();
    return [...this.tenants];
  }

  public static getActiveTenant(): TenantProfile {
    this.initialize();
    const active = this.tenants.find(t => t.id === this.activeTenantId);
    if (active) return active;
    return this.tenants[0] || INITIAL_MOCK_TENANTS[0];
  }

  public static getTenantById(id: string): TenantProfile | undefined {
    this.initialize();
    return this.tenants.find(t => t.id === id);
  }

  public static getTenantByCnpj(rawCnpj: string): TenantProfile | undefined {
    this.initialize();
    const clean = this.normalizeCnpj(rawCnpj);
    if (!clean) return undefined;
    return this.tenants.find(t => this.normalizeCnpj(t.cnpj) === clean);
  }

  public static registerOrUpdateTenant(data: Partial<TenantProfile> & { cnpj: string; name?: string }): TenantProfile {
    this.initialize();
    const clean = this.normalizeCnpj(data.cnpj);
    let existing = this.tenants.find(t => this.normalizeCnpj(t.cnpj) === clean || (data.id && t.id === data.id));

    if (existing) {
      Object.assign(existing, data);
    } else {
      const companyName = data.name || `Empresa Cliente ${data.cnpj}`;
      const newId = data.id || `tenant_${clean.slice(0, 8)}_${Date.now().toString(36)}`;
      existing = {
        id: newId,
        name: companyName,
        slug: data.slug || companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        cnpj: data.cnpj,
        sector: data.sector || 'manufacturing',
        sectorLabel: data.sectorLabel || 'Manufatura & Indústria',
        regulatoryStandard: data.regulatoryStandard || 'ISO 9001 / SEFAZ',
        connectedErp: data.connectedErp || 'TOTVS Protheus (Enterprise Connector)',
        connectedChannels: data.connectedChannels || ['SPED Fiscal EFD', 'WhatsApp Business'],
        enabledServices: data.enabledServices || ['operational', 'tax_recovery'],
        defaultWorkMode: data.defaultWorkMode || 'both',
        annualRevenue: data.annualRevenue || 54000000,
        monthlyRevenue: data.monthlyRevenue || 4500000,
        taxRegime: data.taxRegime || 'lucro_real',
        ebitdaMargin: data.ebitdaMargin || 16.5,
        estimatedRecovery60Months: data.estimatedRecovery60Months || 2485000,
        successFeeEstimated: data.successFeeEstimated || 497000,
        partnerSharePct: data.partnerSharePct || 70,
        velatrixSharePct: data.velatrixSharePct || 30,
        createdAt: new Date().toISOString(),
        ...data
      } as TenantProfile;
      this.tenants.push(existing);
    }

    try {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(this.tenants));
    } catch {
      // Storage quota or sandboxing safeguard
    }

    return existing;
  }

  public static setActiveTenant(target: string | (Partial<TenantProfile> & { cnpj: string; name?: string }) | TenantProfile): TenantProfile {
    this.initialize();
    let tenant: TenantProfile | undefined;

    if (typeof target === 'object' && target !== null) {
      if ('id' in target && (target as any).id) {
        tenant = this.getTenantById((target as any).id) || this.registerOrUpdateTenant(target);
      } else if ('cnpj' in target && target.cnpj) {
        tenant = this.registerOrUpdateTenant(target);
      }
    } else if (typeof target === 'string') {
      // Search by ID first, then by clean CNPJ
      tenant = this.getTenantById(target);
      if (!tenant) {
        tenant = this.getTenantByCnpj(target);
      }
      // If still not found, check if it's a CNPJ format or company name
      if (!tenant && target.includes('/')) {
        tenant = this.registerOrUpdateTenant({
          cnpj: target,
          name: 'Empresa Cliente ' + target
        });
      }
    }

    if (!tenant) {
      tenant = this.tenants[0];
    }

    this.activeTenantId = tenant.id;
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_TENANT_ID, tenant.id);
    } catch {
      // storage safeguard
    }

    // Broadcast change event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('velatrix:tenant_changed', { detail: tenant }));
    }

    // Notify listeners
    this.listeners.forEach(cb => {
      try {
        cb(tenant!);
      } catch (err) {
        console.error('Error notifying tenant listener:', err);
      }
    });

    return tenant;
  }

  public static subscribe(listener: (tenant: TenantProfile) => void): () => void {
    this.initialize();
    this.listeners.add(listener);
    // Fire immediately with current active tenant
    listener(this.getActiveTenant());
    return () => {
      this.listeners.delete(listener);
    };
  }
}
