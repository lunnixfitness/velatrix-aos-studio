export type PlanTier = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'REGULATED';

export interface PlanFeatureConfig {
  id: PlanTier;
  name: string;
  badge: string;
  monthlyPriceBrl: number;
  monthlyPriceLabel: string;
  description: string;
  tagline: string;
  maxErpConnectors: number; // -1 for unlimited
  erpConnectorsLabel: string;
  fiscalJurisdictionsCount: number; // 1, 2, or 3 (multi)
  fiscalJurisdictionsLabel: string;
  maxGraphNodes: number; // 5000 or -1 (unlimited)
  graphNodesLabel: string;
  agentsCount: number; // 3, 6, 12, or 20
  agentsCountLabel: string;
  activeAgents: string[];
  maxZeroGuiApprovers: number; // 5 or -1 (unlimited)
  zeroGuiApproversLabel: string;
  multimodalIngestion: boolean; // OCR/audio
  riskPropagationEngine: boolean; // Continuous Tension Bridges
  iotColdChainTelemetry: boolean; // ColdChain / IoT
  airGappedDeployment: boolean; // On-prem / Air-gapped
  hsmHardwareSecurity: boolean; // HSM crypto
  redTeamAdversarial: boolean; // Red Team continuous validation
  immutableAuditLedger: boolean;
  slaSupport: string;
  slaBadge: string;
  colorScheme: {
    accent: string;
    border: string;
    bg: string;
    text: string;
  };
}

export const VELATRIX_PLAN_TIERS: Record<PlanTier, PlanFeatureConfig> = {
  STARTER: {
    id: 'STARTER',
    name: 'Essencial (Starter)',
    badge: 'PME & Middle Market',
    monthlyPriceBrl: 7120,
    monthlyPriceLabel: 'R$ 7.120/mês',
    description: 'Autonomia tática fundamental com 1 conector ERP, 3 agentes essenciais e aprovações executivas Zero-GUI.',
    tagline: 'Ideal para indústrias e distribuidoras que necessitam de blindagem de caixa e resuprimento automático.',
    maxErpConnectors: 1,
    erpConnectorsLabel: '1 Conector ERP Nativo (TOTVS Protheus ou SAP ECC)',
    fiscalJurisdictionsCount: 1,
    fiscalJurisdictionsLabel: 'Motor Fiscal para 1 Jurisdição (Brasil SPED/NF-e)',
    maxGraphNodes: 5000,
    graphNodesLabel: 'Grafo Semântico até 5.000 nós operacionais',
    agentsCount: 3,
    agentsCountLabel: '3 Agentes de IA (Compras, Financeiro, Compliance)',
    activeAgents: ['Financial_Agent', 'Inventory_Agent', 'Zero_Trust_Risk_Agent'],
    maxZeroGuiApprovers: 5,
    zeroGuiApproversLabel: 'Aprovação Zero-GUI para até 5 aprovadores',
    multimodalIngestion: false,
    riskPropagationEngine: false,
    iotColdChainTelemetry: false,
    airGappedDeployment: false,
    hsmHardwareSecurity: false,
    redTeamAdversarial: false,
    immutableAuditLedger: true,
    slaSupport: 'Suporte e-mail SLA 8h útil',
    slaBadge: 'SLA 8h',
    colorScheme: {
      accent: '#00F2FF',
      border: 'border-[#00F2FF]/30',
      bg: 'bg-[#00F2FF]/10',
      text: 'text-[#00F2FF]'
    }
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL',
    name: 'Profissional (Professional)',
    badge: 'Enterprise Growth',
    monthlyPriceBrl: 19600,
    monthlyPriceLabel: 'R$ 19.600/mês',
    description: 'Enxame multi-agentes com 6 especialidades, propagação de risco bidirecional, OCR multimodal e suporte 24/7.',
    tagline: 'Para corporações com múltiplos ERPs e operações fabris/logísticas de alta criticidade.',
    maxErpConnectors: 3,
    erpConnectorsLabel: 'Até 3 conectores ERP simultâneos bidirecionais',
    fiscalJurisdictionsCount: 2,
    fiscalJurisdictionsLabel: 'Motor Fiscal para 2 Jurisdições (Brasil + US Sales Tax)',
    maxGraphNodes: -1,
    graphNodesLabel: 'Grafo Semântico Ilimitado com Propagação de Tensão Contínua',
    agentsCount: 6,
    agentsCountLabel: '6 Agentes de IA com Consenso Inter-Agentes',
    activeAgents: [
      'Financial_Agent',
      'Inventory_Agent',
      'Supply_Chain_Agent',
      'Zero_Trust_Risk_Agent',
      'Sales_Agent',
      'Tax_Optimizer_Agent'
    ],
    maxZeroGuiApprovers: -1,
    zeroGuiApproversLabel: 'Aprovações Zero-GUI Ilimitadas (Multi-Sig)',
    multimodalIngestion: true,
    riskPropagationEngine: true,
    iotColdChainTelemetry: false,
    airGappedDeployment: false,
    hsmHardwareSecurity: false,
    redTeamAdversarial: false,
    immutableAuditLedger: true,
    slaSupport: 'Suporte 24/7 Dedicado SLA 1h',
    slaBadge: 'SLA 1h 24/7',
    colorScheme: {
      accent: '#10B981',
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400'
    }
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Corporativo (Enterprise)',
    badge: 'Grandes Grupos & Holdings',
    monthlyPriceBrl: 97000, // Preço base estimado para cálculo de ARR
    monthlyPriceLabel: 'Sob Consulta (Base R$ 97.000/mês)',
    description: 'Conectores ilimitados, nuvem privada dedicada (VPC/GCP), multi-jurisdição global e telemetria IoT / ColdChain.',
    tagline: 'Arquitetura elástica com telemetria de sensores de borda e orquestração de enxame de 13 micro-agentes.',
    maxErpConnectors: -1,
    erpConnectorsLabel: 'Conectores ERP Ilimitados (SAP S/4, Oracle, Protheus, Senior)',
    fiscalJurisdictionsCount: 3,
    fiscalJurisdictionsLabel: 'Multi-Jurisdição Global (Brasil + EUA + União Europeia VAT)',
    maxGraphNodes: -1,
    graphNodesLabel: 'Grafo Semântico Ilimitado com 50 Nós de Inteligência Operacional',
    agentsCount: 13,
    agentsCountLabel: '13 Micro-Agentes Autônomos (Data Science, BOM, Facility, RH, Preço)',
    activeAgents: [
      'Financial_Agent',
      'Inventory_Agent',
      'Supply_Chain_Agent',
      'Zero_Trust_Risk_Agent',
      'Sales_Agent',
      'Production_BOM_Agent',
      'Audit_Ledger_Agent',
      'Legal_Contract_Agent',
      'Tax_Optimizer_Agent',
      'Facility_Maintenance_Agent',
      'People_Analytics_Agent',
      'Dynamic_Pricing_Agent',
      'Data_Analyst_Predictive_Agent'
    ],
    maxZeroGuiApprovers: -1,
    zeroGuiApproversLabel: 'Quórum Multi-Sig Avançado com RBAC Granular',
    multimodalIngestion: true,
    riskPropagationEngine: true,
    iotColdChainTelemetry: true,
    airGappedDeployment: false,
    hsmHardwareSecurity: false,
    redTeamAdversarial: true,
    immutableAuditLedger: true,
    slaSupport: 'Engenheiro de Soluções Dedicado + SLA 15 min',
    slaBadge: 'SLA 15min',
    colorScheme: {
      accent: '#8B5CF6',
      border: 'border-violet-500/40',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400'
    }
  },
  REGULATED: {
    id: 'REGULATED',
    name: 'Governo, Defesa & Regulado',
    badge: 'Nível Militar / Air-Gapped',
    monthlyPriceBrl: 95000,
    monthlyPriceLabel: 'Sob Consulta (Base R$ 95.000/mês)',
    description: 'Instalação On-Premise Air-Gapped, chaves criptográficas HSM FIPS 140-3, Red Team adversarial e auditoria imutável.',
    tagline: 'Conformidade máxima para infraestruturas críticas, setor bancário restrito e instituições governamentais.',
    maxErpConnectors: -1,
    erpConnectorsLabel: 'Conectores Seguros Isolados via TLS Mútuo / VPN IPsec',
    fiscalJurisdictionsCount: 3,
    fiscalJurisdictionsLabel: 'Conformidade Regulatória Especial (BACEN, SEFAZ, DoD, LGPD Art. 30)',
    maxGraphNodes: -1,
    graphNodesLabel: 'Grafo Semântico Isolado em Enclave Seguro',
    agentsCount: 20,
    agentsCountLabel: '20 Camadas de Inteligência com Red Team Contínuo',
    activeAgents: [
      'Financial_Agent',
      'Inventory_Agent',
      'Supply_Chain_Agent',
      'Zero_Trust_Risk_Agent',
      'Sales_Agent',
      'Production_BOM_Agent',
      'Audit_Ledger_Agent',
      'Legal_Contract_Agent',
      'Tax_Optimizer_Agent',
      'Facility_Maintenance_Agent',
      'People_Analytics_Agent',
      'Dynamic_Pricing_Agent',
      'Data_Analyst_Predictive_Agent',
      'Red_Team_Adversarial_Agent',
      'Observability_Trace_Guardrail',
      'Behavioral_Negotiation_Agent',
      'Macro_Web_Grounding_Agent',
      'Episodic_Memory_Historical_Agent',
      'Supervisor_Swarm_Orchestrator',
      'What_If_Scenario_Simulator'
    ],
    maxZeroGuiApprovers: -1,
    zeroGuiApproversLabel: 'Assinatura Criptográfica HSM FIPS 140-3 Nível 4',
    multimodalIngestion: true,
    riskPropagationEngine: true,
    iotColdChainTelemetry: true,
    airGappedDeployment: true,
    hsmHardwareSecurity: true,
    redTeamAdversarial: true,
    immutableAuditLedger: true,
    slaSupport: 'Equipe de Resposta Rápida 24/7 On-Call < 5 min',
    slaBadge: 'SLA <5min Militar',
    colorScheme: {
      accent: '#F59E0B',
      border: 'border-amber-500/40',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400'
    }
  }
};

/**
 * Helper to check if a feature is enabled for a given plan
 */
export function isFeatureAvailable(
  planId: PlanTier,
  feature: keyof Pick<
    PlanFeatureConfig,
    | 'multimodalIngestion'
    | 'riskPropagationEngine'
    | 'iotColdChainTelemetry'
    | 'airGappedDeployment'
    | 'hsmHardwareSecurity'
    | 'redTeamAdversarial'
  >,
  overrides?: Record<string, boolean>
): boolean {
  if (overrides && typeof overrides[feature] === 'boolean') {
    return overrides[feature];
  }
  const plan = VELATRIX_PLAN_TIERS[planId] || VELATRIX_PLAN_TIERS.STARTER;
  return !!plan[feature];
}

/**
 * Required plan for a specific feature
 */
export function getMinimumPlanRequired(feature: string): { tier: PlanTier; name: string } {
  switch (feature) {
    case 'multimodalIngestion':
    case 'riskPropagationEngine':
      return { 
        tier: 'PROFESSIONAL', 
        name: `${VELATRIX_PLAN_TIERS.PROFESSIONAL.name} (${VELATRIX_PLAN_TIERS.PROFESSIONAL.monthlyPriceLabel})` 
      };
    case 'iotColdChainTelemetry':
      return { 
        tier: 'ENTERPRISE', 
        name: `${VELATRIX_PLAN_TIERS.ENTERPRISE.name}` 
      };
    case 'airGappedDeployment':
    case 'hsmHardwareSecurity':
      return { 
        tier: 'REGULATED', 
        name: `${VELATRIX_PLAN_TIERS.REGULATED.name}` 
      };
    default:
      return { 
        tier: 'PROFESSIONAL', 
        name: VELATRIX_PLAN_TIERS.PROFESSIONAL.name 
      };
  }
}
