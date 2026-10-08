// src/services/partnerPortfolioService.ts
/**
 * Velatrix AOS - Partner Portfolio & Automated Split Service (RLS por Carteira)
 * 
 * Regras de Arquitetura:
 * 1. RLS por Carteira: Usuários com papel 'parceiro_operacional' (ou 'parceiro_tributario')
 *    possuem escopo PARTNER_PORTFOLIO_ONLY e só podem visualizar e operar sobre os CNPJs
 *    vinculados ao seu partnerId. Registros internos de outros tenants ou empresas fora da carteira
 *    são estritamente ocultados.
 * 2. Gatilho Automático de Split: Quando uma etapa faturável é concluída nos módulos operacionais
 *    (Diagnóstico concluído com crédito apurado, Defesa/Recurso protocolado, Crédito homologado ou liquidado),
 *    o sistema gera automaticamente um evento de comissão com rastreabilidade total (caso, % aplicado, valor resultante),
 *    sem interferir nas regras manuais já cadastradas.
 */

import { UserRole } from '../types/aos';
import { isPartnerPortfolioScope } from '../types/rbac';
import { TenantTaxRecoveryBridge, SharedTenantTaxData, TaxRegime } from './tenantTaxRecoveryBridge';
import { PartnerGrowthService, PartnerAuditedClient } from './partnerGrowthService';
import { computeSha256Sync } from './expertTaxEngineService';
import { AuditRecord } from '../types/aos';
import { UnifiedTenantService } from './unifiedTenantService';

export interface PartnerPortfolioClient {
  id: string;
  partnerId: string;
  cnpj: string;
  cleanCnpj: string;
  companyName: string;
  tradeName?: string;
  sectorKey: string;
  sectorName: string;
  segment?: string;
  taxRegime: TaxRegime;
  annualRevenue: number;
  monthlyRevenue: number;
  ebitdaMargin: number;
  dailyVolume: string;
  activeErp: string;
  estimatedCredits: number;
  successFeeEstimated: number;
  partnerSharePct: number;
  partnerShareAmount: number;
  velatrixSharePct: number;
  velatrixShareAmount: number;
  status: 'AUDITADO_D0' | 'DOSSIE_GERADO' | 'CONTRATO_ENVIADO' | 'PROTOCOLADO' | 'HOMOLOGADO' | 'LIQUIDADO';
  statusLabel: string;
  lastUpdate: string;
  opportunitySummary: string;
  proofHash: string;
}

export type BillableMilestoneKey = 
  | 'DIAGNOSTICO_CREDITO'
  | 'DEFESA_PROTOCOLADA'
  | 'CREDITO_HOMOLOGADO'
  | 'CREDITO_LIQUIDADO'
  | 'AUDITORIA_CRUZADA'
  | 'CONTRATO_ASSINADO';

export interface AutomatedSplitEvent {
  id: string;
  partnerId: string;
  partnerName: string;
  companyName: string;
  cnpj: string;
  milestoneKey: BillableMilestoneKey;
  milestoneTitle: string;
  milestoneDescription: string;
  caseId: string;
  caseTitle: string;
  grossCreditBase: number;
  successFeePercent: number; // e.g. 20%
  grossFeeAmount: number; // Sucesso apurado (R$)
  partnerSplitPct: number; // e.g. 70%
  partnerSplitAmount: number; // R$ Parceiro
  velatrixSplitPct: number; // e.g. 30%
  velatrixSplitAmount: number; // R$ Velatrix
  ruleApplied: string;
  proofHash: string;
  timestamp: string;
  funnelStage: 'PERICIA_D0' | 'PROTOCOLADO_RFB' | 'TRANSACAO_PGFN' | 'HOMOLOGADO' | 'COMPENSADO_LIQUIDADO';
  funnelStageLabel: string;
  triggerSourceModule: string;
  notes?: string;
}

const STORAGE_KEY_AUTOMATED_SPLITS = 'velatrix_automated_splits_v1';
const STORAGE_KEY_ACTIVE_PORTFOLIO_CLIENT = 'velatrix_active_partner_client_id_v1';

export const DEFAULT_PARTNER_PORTFOLIO_CLIENTS: PartnerPortfolioClient[] = [
  {
    id: 'cli-01',
    partnerId: 'partner_adv_vasconcelos',
    cnpj: '33.041.260/0001-88',
    cleanCnpj: '33041260000188',
    companyName: 'Vortex Logística & Manufatura S.A.',
    tradeName: 'Vortex Brasil',
    sectorKey: 'manufacturing',
    sectorName: 'Manufatura & Indústria Pesada',
    taxRegime: 'lucro_real',
    annualRevenue: 54000000,
    monthlyRevenue: 4500000,
    ebitdaMargin: 16.5,
    dailyVolume: '18.400 volumes/dia',
    activeErp: 'TOTVS Protheus (Enterprise Connector)',
    estimatedCredits: 2485000.00,
    successFeeEstimated: 497000.00,
    partnerSharePct: 70,
    partnerShareAmount: 347900.00,
    velatrixSharePct: 30,
    velatrixShareAmount: 149100.00,
    status: 'HOMOLOGADO',
    statusLabel: 'Homologado RFB (DCOMP Pronto)',
    lastUpdate: 'Hoje, 10:14',
    opportunitySummary: 'Tema 69 STF (Exclusão do ICMS da base do PIS/COFINS) e créditos sobre fretes de insumos.',
    proofHash: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d'
  },
  {
    id: 'cli-02',
    partnerId: 'partner_adv_vasconcelos',
    cnpj: '12.840.119/0001-44',
    cleanCnpj: '12840119000144',
    companyName: 'Rede Farma Mais Distribuição Ltda',
    tradeName: 'Farma Mais Distribuidora',
    sectorKey: 'retail',
    sectorName: 'Varejo Farmacêutico & Distribuição',
    taxRegime: 'simples_nacional',
    annualRevenue: 8400000,
    monthlyRevenue: 700000,
    ebitdaMargin: 14.2,
    dailyVolume: '6.200 caixas/dia',
    activeErp: 'Senior Sistemas / Sapiens ERP',
    estimatedCredits: 390000.00,
    successFeeEstimated: 78000.00,
    partnerSharePct: 70,
    partnerShareAmount: 54600.00,
    velatrixSharePct: 30,
    velatrixShareAmount: 23400.00,
    status: 'LIQUIDADO',
    statusLabel: 'Crédito Compensado / Liquidado',
    lastUpdate: 'Ontem, 16:30',
    opportunitySummary: 'Segregação de receitas monofásicas PIS/COFINS (Lei 10.147/00) recolhidas indevidamente no PGDAS-D.',
    proofHash: '0x12840119000144d088120fae9310842bbda748201a019488bca7791240182910'
  },
  {
    id: 'cli-03',
    partnerId: 'partner_adv_vasconcelos',
    cnpj: '04.112.980/0001-02',
    cleanCnpj: '04112980000102',
    companyName: 'Clínica Santa Helena Diagnósticos',
    tradeName: 'Santa Helena Medicina Diagnóstica',
    sectorKey: 'healthcare',
    sectorName: 'Serviços Médicos & Saúde Suplementar',
    taxRegime: 'lucro_presumido',
    annualRevenue: 18200000,
    monthlyRevenue: 1516666,
    ebitdaMargin: 22.0,
    dailyVolume: '850 exames/dia',
    activeErp: 'Tasy Philips / Oracle NetSuite',
    estimatedCredits: 820000.00,
    successFeeEstimated: 164000.00,
    partnerSharePct: 70,
    partnerShareAmount: 114800.00,
    velatrixSharePct: 30,
    velatrixShareAmount: 49200.00,
    status: 'CONTRATO_ENVIADO',
    statusLabel: 'Em Transação PGFN (Edital)',
    lastUpdate: 'Há 2 dias',
    opportunitySummary: 'Redução da base presumida de IRPJ (32% para 8%) e CSLL (32% para 12%) conforme Lei 9.249/95 e RDC 50 Anvisa.',
    proofHash: '0x04112980000102d033910cbe77912401829104c917b2288e10fae9310842bbda'
  },
  {
    id: 'cli-04',
    partnerId: 'partner_adv_vasconcelos',
    cnpj: '45.992.301/0001-77',
    cleanCnpj: '45992301000177',
    companyName: 'TransGlobal Transportes & Frota S.A.',
    tradeName: 'TransGlobal Logística Pesada',
    sectorKey: 'logistics',
    sectorName: 'Transporte Rodoviário de Cargas',
    taxRegime: 'lucro_real',
    annualRevenue: 72000000,
    monthlyRevenue: 6000000,
    ebitdaMargin: 12.8,
    dailyVolume: '3.400 CTEs/mês',
    activeErp: 'SAP S/4HANA Logistics',
    estimatedCredits: 3120000.00,
    successFeeEstimated: 624000.00,
    partnerSharePct: 70,
    partnerShareAmount: 436800.00,
    velatrixSharePct: 30,
    velatrixShareAmount: 187200.00,
    status: 'AUDITADO_D0',
    statusLabel: 'Auditado em D+0 (Pronto p/ Dossiê)',
    lastUpdate: 'Hoje, 08:00',
    opportunitySummary: 'Créditos extemporâneos de PIS/COFINS sobre óleo diesel, lubrificantes, pedágios e leasing mercantil de frotas pesadas.',
    proofHash: '0x45992301000177d099214ae812d46e01a87b32091c77f24d9c0e5b742aa39f94'
  },
  {
    id: 'cli-vanguarda',
    partnerId: 'partner_adv_vasconcelos',
    cnpj: '25.369.321/0001-23',
    cleanCnpj: '25369321000123',
    companyName: 'Grupo Vanguarda Alimentos S/A',
    tradeName: 'Vanguarda Alimentos',
    sectorKey: 'agribusiness',
    sectorName: 'Alimentos & Agroindústria',
    taxRegime: 'lucro_real',
    annualRevenue: 68000000,
    monthlyRevenue: 5666666,
    ebitdaMargin: 18.4,
    dailyVolume: '22.000 un/dia',
    activeErp: 'TOTVS Protheus (Enterprise Connector)',
    estimatedCredits: 2940000.00,
    successFeeEstimated: 588000.00,
    partnerSharePct: 70,
    partnerShareAmount: 411600.00,
    velatrixSharePct: 30,
    velatrixShareAmount: 176400.00,
    status: 'AUDITADO_D0',
    statusLabel: 'Auditado D+0 (Perícia Inicial)',
    lastUpdate: 'Hoje, 09:30',
    opportunitySummary: 'Subvenções para Investimento (Tema 1182 STJ) e créditos extemporâneos de insumos agroindustriais.',
    proofHash: '0x25369321000123d088120fae9310842bbda748201a019488bca7791240182910'
  }
];

export function cleanCnpjDigits(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

export const PartnerPortfolioService = {
  /**
   * Obtém a lista consolidada de clientes da carteira do parceiro
   */
  getPortfolioClients(partnerId?: string): PartnerPortfolioClient[] {
    const defaultList = DEFAULT_PARTNER_PORTFOLIO_CLIENTS;
    
    // Sincroniza também quaisquer clientes cadastrados via onboarding em PartnerGrowthService
    try {
      const growthClients: PartnerAuditedClient[] = PartnerGrowthService.getClients();
      const mergedMap = new Map<string, PartnerPortfolioClient>();

      // Insere padrões
      defaultList.forEach(c => mergedMap.set(c.cleanCnpj, c));

      // Mescla com novos cadastrados dinamicamente
      growthClients.forEach(gc => {
        const clean = cleanCnpjDigits(gc.cnpj);
        if (!mergedMap.has(clean)) {
          mergedMap.set(clean, {
            id: gc.id,
            partnerId: partnerId || 'partner_adv_vasconcelos',
            cnpj: gc.cnpj,
            cleanCnpj: clean,
            companyName: gc.companyName,
            tradeName: gc.tradeName || gc.companyName,
            sectorKey: 'manufacturing',
            sectorName: gc.sector,
            taxRegime: gc.taxRegime === 'Simples Nacional' ? 'simples_nacional' : gc.taxRegime === 'Lucro Presumido' ? 'lucro_presumido' : 'lucro_real',
            annualRevenue: (gc.estimatedRecovery60Months || 200000) * 12,
            monthlyRevenue: gc.estimatedRecovery60Months || 200000,
            ebitdaMargin: 15.0,
            dailyVolume: 'Operação sob demanda',
            activeErp: 'ERP Conectado',
            estimatedCredits: gc.estimatedRecovery60Months,
            successFeeEstimated: gc.successFeeEstimated,
            partnerSharePct: 70,
            partnerShareAmount: gc.partnerShare70Pct,
            velatrixSharePct: 30,
            velatrixShareAmount: gc.velatrixShare30Pct,
            status: gc.status,
            statusLabel: gc.statusLabel,
            lastUpdate: gc.lastAuditDate,
            opportunitySummary: gc.opportunitySummary,
            proofHash: gc.proofHash
          });
        }
      });

      return Array.from(mergedMap.values());
    } catch {
      return defaultList;
    }
  },

  /**
   * Retorna os CNPJs limpos que pertencem à carteira do parceiro
   */
  getPortfolioCnpjs(partnerId?: string): string[] {
    return this.getPortfolioClients(partnerId).map(c => c.cleanCnpj);
  },

  /**
   * Valida se um CNPJ fornecido pertence à carteira vinculada do parceiro
   */
  isCnpjInPortfolio(cnpj: string | undefined | null, partnerId?: string): boolean {
    if (!cnpj) return false;
    const clean = cleanCnpjDigits(cnpj);
    if (!clean) return false;
    const portfolioCnpjs = this.getPortfolioCnpjs(partnerId);
    return portfolioCnpjs.some(c => c === clean || clean.includes(c) || c.includes(clean));
  },

  /**
   * Obtém o cliente ativo da carteira do parceiro
   */
  getActiveClient(partnerId?: string): PartnerPortfolioClient {
    const clients = this.getPortfolioClients(partnerId);
    try {
      const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_PORTFOLIO_CLIENT);
      if (storedId) {
        const found = clients.find(c => c.id === storedId || c.cleanCnpj === storedId);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return clients[0];
  },

  /**
   * Alterna o cliente ativo da carteira e sincroniza o TenantTaxRecoveryBridge
   */
  setActiveClient(clientIdOrCnpj: string, partnerId?: string): PartnerPortfolioClient {
    const clients = this.getPortfolioClients(partnerId);
    const cleanInput = cleanCnpjDigits(clientIdOrCnpj);
    const target = clients.find(c => c.id === clientIdOrCnpj || c.cleanCnpj === cleanInput) || clients[0];

    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PORTFOLIO_CLIENT, target.id);
    } catch {
      // ignore
    }

    // Sincroniza o bridge para que todas as telas operacionais reflitam a empresa selecionada
    TenantTaxRecoveryBridge.update({
      companyName: target.companyName,
      cnpj: target.cnpj,
      sectorKey: target.sectorKey,
      sectorName: target.sectorName,
      taxRegime: target.taxRegime,
      annualRevenue: target.annualRevenue,
      monthlyRevenue: target.monthlyRevenue,
      ebitdaMargin: target.ebitdaMargin,
      dailyVolume: target.dailyVolume,
      activeErp: target.activeErp,
      erpConnected: true
    });

    // Dispara recálculo da varredura preliminar para os números do cliente
    TenantTaxRecoveryBridge.runScan(
      target.annualRevenue,
      target.sectorKey,
      true,
      target.taxRegime
    );

    // Sincroniza a autoridade central unificada de tenants (Single Source of Truth)
    try {
      UnifiedTenantService.setActiveTenant({
        cnpj: target.cnpj,
        name: target.companyName,
        annualRevenue: target.annualRevenue,
        monthlyRevenue: target.monthlyRevenue,
        sector: target.sectorKey,
        sectorLabel: target.sectorName,
        taxRegime: target.taxRegime,
        ebitdaMargin: target.ebitdaMargin,
        connectedErp: target.activeErp,
        estimatedRecovery60Months: target.estimatedCredits,
        successFeeEstimated: target.successFeeEstimated
      });
    } catch {
      // safe fallback
    }

    // Notifica ouvintes de troca de cliente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('velatrix:partner_active_client_changed', { detail: target }));
    }

    return target;
  },

  /**
   * Ingesta e reflete cliente diagnosticado D+0 diretamente na carteira de parceiros (Fluxo Único)
   */
  ingestDiagnosedClient(tenantData: {
    cnpj: string;
    companyName: string;
    sectorKey?: string;
    sectorName?: string;
    taxRegime?: TaxRegime;
    annualRevenue?: number;
    monthlyRevenue?: number;
    ebitdaMargin?: number;
    estimatedCredits?: number;
    activeErp?: string;
    partnerId?: string;
  }): PartnerPortfolioClient {
    const clean = cleanCnpjDigits(tenantData.cnpj);
    const estimated = tenantData.estimatedCredits || 2485000;
    const successFee = Math.round(estimated * 0.20);
    const partnerCut = Math.round(successFee * 0.70);
    const velatrixCut = Math.round(successFee * 0.30);

    const client: PartnerPortfolioClient = {
      id: `cli-diag-${clean.slice(0, 8)}`,
      partnerId: tenantData.partnerId || 'partner_adv_vasconcelos',
      cnpj: tenantData.cnpj,
      cleanCnpj: clean,
      companyName: tenantData.companyName,
      tradeName: tenantData.companyName,
      sectorKey: tenantData.sectorKey || 'manufacturing',
      sectorName: tenantData.sectorName || 'Indústria & Manufatura',
      taxRegime: tenantData.taxRegime || 'lucro_real',
      annualRevenue: tenantData.annualRevenue || 54000000,
      monthlyRevenue: tenantData.monthlyRevenue || (tenantData.annualRevenue ? tenantData.annualRevenue / 12 : 4500000),
      ebitdaMargin: tenantData.ebitdaMargin || 16.5,
      dailyVolume: 'Operação sob demanda',
      activeErp: tenantData.activeErp || 'ERP Integrado',
      estimatedCredits: estimated,
      successFeeEstimated: successFee,
      partnerSharePct: 70,
      partnerShareAmount: partnerCut,
      velatrixSharePct: 30,
      velatrixShareAmount: velatrixCut,
      status: 'AUDITADO_D0',
      statusLabel: 'Auditado em D+0 (Pronto p/ Dossiê)',
      lastUpdate: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      opportunitySummary: 'Diagnóstico D+0 concluído com sucesso: teses tributárias pacíficas do STF/STJ vinculadas e apuradas.',
      proofHash: computeSha256Sync(JSON.stringify({
        schema: 'PARTNER_PORTFOLIO_CLIENT_V1',
        cnpj: clean,
        companyName: tenantData.companyName,
        credits: estimated,
        timestamp: Date.now()
      }))
    };

    try {
      PartnerGrowthService.addClientFromOnboarding(tenantData.cnpj, tenantData.companyName, tenantData.sectorName);
    } catch {
      // ignore
    }

    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PORTFOLIO_CLIENT, client.id);
    } catch {
      // ignore
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('velatrix:partner_active_client_changed', { detail: client }));
    }

    return client;
  },

  /**
   * Assina notificações de mudança na carteira ou cliente ativo
   */
  subscribe(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = () => callback();
    window.addEventListener('velatrix:partner_active_client_changed' as any, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('velatrix:partner_active_client_changed' as any, handler);
      window.removeEventListener('storage', handler);
    };
  },

  /**
   * Filtro Genérico de RLS para Carteira de Parceiro
   * Se o usuário tiver papel parceiro_operacional, filtra os itens mantendo apenas os que possuem CNPJ na carteira.
   * Se for outro papel (ex: super_admin ou tenant_admin), retorna a lista original intacta.
   */
  filterItemsByPortfolio<T>(
    items: T[],
    getCnpj: (item: T) => string | undefined | null,
    role: UserRole,
    partnerId?: string
  ): T[] {
    if (!isPartnerPortfolioScope(role)) {
      return items;
    }

    const portfolioCnpjs = this.getPortfolioCnpjs(partnerId);
    return items.filter(item => {
      const rawCnpj = getCnpj(item);
      if (!rawCnpj) return false;
      const clean = cleanCnpjDigits(rawCnpj);
      return portfolioCnpjs.some(c => c === clean || clean.includes(c) || c.includes(clean));
    });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // GATILHO AUTOMÁTICO DE SPLIT POR SERVIÇO ENTREGUE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lista todos os eventos de split gerados automaticamente
   */
  getAutomatedSplits(partnerId?: string): AutomatedSplitEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AUTOMATED_SPLITS);
      if (raw) {
        const list: AutomatedSplitEvent[] = JSON.parse(raw);
        if (partnerId) {
          return list.filter(e => e.partnerId === partnerId);
        }
        return list;
      }
    } catch {
      // ignore
    }
    return [];
  },

  /**
   * Dispara um evento automático de comissão por entrega real de serviço
   * @param params Informações da etapa concluída
   * @returns O evento de split persistido e auditado
   */
  triggerAutomatedSplitEvent(params: {
    milestoneKey: BillableMilestoneKey;
    cnpj: string;
    companyName: string;
    caseId?: string;
    caseTitle?: string;
    creditAmount?: number;
    grossFeeOverride?: number;
    partnerId?: string;
    triggerSourceModule?: string;
    notes?: string;
    onAddAuditRecord?: (record: AuditRecord) => void;
  }): AutomatedSplitEvent {
    const partnerProfile = PartnerGrowthService.getProfile();
    const effectivePartnerId = params.partnerId || partnerProfile.partnerId || 'partner_adv_vasconcelos';
    const cleanCnpj = cleanCnpjDigits(params.cnpj);

    // Encontra informações do cliente na carteira ou usa os dados informados
    const portfolioClient = this.getPortfolioClients(effectivePartnerId).find(c => c.cleanCnpj === cleanCnpj);
    const company = params.companyName || portfolioClient?.companyName || 'Cliente da Carteira';
    const formattedCnpj = portfolioClient?.cnpj || params.cnpj;

    // Base de cálculo e regras de split formalizadas
    const baseCredit = params.creditAmount || portfolioClient?.estimatedCredits || 2485000;
    const successFeeRate = 20; // 20% Success Fee padrão
    const grossFee = params.grossFeeOverride || Math.round(baseCredit * (successFeeRate / 100));

    // Regra de Split do Parceiro: 70% Parceiro / 30% Velatrix (ou regra específica do contrato)
    const partnerSplitPct = 70;
    const velatrixSplitPct = 30;
    const partnerSplitAmount = Math.round(grossFee * (partnerSplitPct / 100));
    const velatrixSplitAmount = Math.round(grossFee * (velatrixSplitPct / 100));

    // Metadados do Milestone
    let milestoneTitle = '';
    let milestoneDescription = '';
    let funnelStage: AutomatedSplitEvent['funnelStage'] = 'PERICIA_D0';
    let funnelStageLabel = '';

    switch (params.milestoneKey) {
      case 'DIAGNOSTICO_CREDITO':
        milestoneTitle = 'Diagnóstico Pericial Concluído c/ Crédito Apurado';
        milestoneDescription = 'Auditoria pericial D+0 homologada com identificação conclusiva de indébito tributário.';
        funnelStage = 'PERICIA_D0';
        funnelStageLabel = 'D+0 Concluído (Crédito Mapeado)';
        break;
      case 'DEFESA_PROTOCOLADA':
        milestoneTitle = 'Petição / Defesa / Transação PGFN Protocolada';
        milestoneDescription = 'Protocolo formalizado perante o Poder Judiciário ou Procuradoria Geral da Fazenda Nacional.';
        funnelStage = 'PROTOCOLADO_RFB';
        funnelStageLabel = 'Protocolado RFB / PGFN';
        break;
      case 'CREDITO_HOMOLOGADO':
        milestoneTitle = 'Crédito Tributário Homologado RFB';
        milestoneDescription = 'Decisão definitiva da RFB com deferimento de compensação via PER/DCOMP Web.';
        funnelStage = 'HOMOLOGADO';
        funnelStageLabel = 'Homologado RFB (DCOMP Pronto)';
        break;
      case 'CREDITO_LIQUIDADO':
        milestoneTitle = 'Crédito Tributário Compensado & Liquidado em Conta';
        milestoneDescription = 'Efetiva compensação financeira homologada ou restituição creditada em conta bancária.';
        funnelStage = 'COMPENSADO_LIQUIDADO';
        funnelStageLabel = 'Compensado / Liquidado';
        break;
      case 'AUDITORIA_CRUZADA':
        milestoneTitle = 'Auditoria Cruzada & Conciliação de Livro-Razão Criptográfico';
        milestoneDescription = 'Cruzamento e certificação pericial de invariantes e trilha de auditoria com hash SHA-256.';
        funnelStage = 'PERICIA_D0';
        funnelStageLabel = 'Auditoria Pericial Concluída';
        break;
      case 'CONTRATO_ASSINADO':
        milestoneTitle = 'Contrato de Êxito / Rollout Homologado';
        milestoneDescription = 'Formalização contratual e entrada em produção das defesas tributárias integradas.';
        funnelStage = 'HOMOLOGADO';
        funnelStageLabel = 'Homologado em Produção';
        break;
    }

    const timestamp = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const eventId = `split_auto_${Date.now()}_${cleanCnpj.slice(0, 4)}`;
    const proofPayload = JSON.stringify({
      eventId,
      partnerId: effectivePartnerId,
      cnpj: cleanCnpj,
      milestoneKey: params.milestoneKey,
      grossFee,
      partnerSplitAmount,
      timestamp
    });
    const proofHash = computeSha256Sync(proofPayload);

    const newEvent: AutomatedSplitEvent = {
      id: eventId,
      partnerId: effectivePartnerId,
      partnerName: partnerProfile.lawyerName || 'Dr. Henrique Vasconcelos',
      companyName: company,
      cnpj: formattedCnpj,
      milestoneKey: params.milestoneKey,
      milestoneTitle,
      milestoneDescription,
      caseId: params.caseId || `PROC-RFB-${cleanCnpj.slice(0, 4)}-2026`,
      caseTitle: params.caseTitle || 'Tema 69 STF / Exclusão ICMS PIS-COFINS (60M)',
      grossCreditBase: baseCredit,
      successFeePercent: successFeeRate,
      grossFeeAmount: grossFee,
      partnerSplitPct,
      partnerSplitAmount,
      velatrixSplitPct,
      velatrixSplitAmount,
      ruleApplied: 'Regra Formalizada de Split: 70% Parceiro / 30% Velatrix (Êxito Tributário)',
      proofHash: `0x${proofHash}`,
      timestamp,
      funnelStage,
      funnelStageLabel,
      triggerSourceModule: params.triggerSourceModule || 'Módulo Operacional Velatrix AOS',
      notes: params.notes || `Gatilho Automático gerado por conclusão de etapa no módulo ${params.triggerSourceModule || 'operacional'}.`
    };

    // Persiste no localStorage
    const existing = this.getAutomatedSplits();
    const updated = [newEvent, ...existing.filter(e => !(e.cnpj === newEvent.cnpj && e.milestoneKey === newEvent.milestoneKey))];
    try {
      localStorage.setItem(STORAGE_KEY_AUTOMATED_SPLITS, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Registra na Trilha de Auditoria Geral (AuditRecord)
    if (params.onAddAuditRecord) {
      params.onAddAuditRecord({
        id: `audit_split_${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: partnerProfile.lawyerName || 'Parceiro Operacional',
        role: 'parceiro_operacional',
        action: 'AUTOMATED_SPLIT_COMMISSION_TRIGGERED',
        module: 'PORTAL_DE_PARCEIROS',
        entityId: newEvent.id,
        entityType: 'SPLIT_EVENT',
        summary: `Gatilho Automático de Split: ${milestoneTitle} para ${company} (${formattedCnpj}). Comissão do Parceiro: R$ ${partnerSplitAmount.toLocaleString('pt-BR')} (70% de R$ ${grossFee.toLocaleString('pt-BR')}).`,
        details: {
          caseId: newEvent.caseId,
          caseTitle: newEvent.caseTitle,
          ruleApplied: newEvent.ruleApplied,
          proofHash: newEvent.proofHash
        },
        hash: newEvent.proofHash
      } as any);
    }

    // Emite evento global para que o Portal de Parceiros e demais módulos atualizem imediatamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('velatrix:automated_split_created', { detail: newEvent }));
    }

    return newEvent;
  }
};
