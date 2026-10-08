export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type SupportedLanguage = 'pt' | 'en' | 'es';
export type SupportedCurrency = 'BRL' | 'USD' | 'EUR';
export type FiscalJurisdiction = 'BR' | 'US' | 'EU' | 'BR_FEDERAL_SEFAZ' | string;

export interface SemanticEvent {
  id: string;
  timestamp: string;
  source: 'Supplier EDI' | 'IoT Fleet Tracker' | 'Bank Webhook' | 'B2B CRM Pipeline' | 'Port Customs Gateway' | 'Manual Injection' | 'Market FX Feed' | 'WhatsApp Ingestion' | 'IoT ColdChain Sensor' | 'Jira Enterprise & PSA Gateway' | string;
  title: string;
  description: string;
  category: 'supply_chain' | 'treasury' | 'logistics' | 'customers' | 'production' | 'regulatory';
  severity: SeverityLevel;
  metricsAffected: {
    name: string;
    current: string;
    projected: string;
    delta: string;
    negativeImpact: boolean;
  }[];
  rawPayload?: Record<string, any>;
}

export type GraphNodeCategory = 
  | 'treasury' 
  | 'fiscal' 
  | 'customers' 
  | 'supply_chain' 
  | 'production' 
  | 'risk' 
  | 'logistics';

export interface GraphNode {
  id: string;
  nodeCode?: string; // e.g. NO_01_RESERVA_EMERGENCIA
  label: string;
  category: GraphNodeCategory;
  categoryNumber?: 1 | 2 | 3 | 4 | 5 | 6;
  categoryName?: string;
  metricValue: string;
  metricLabel: string;
  status: 'nominal' | 'alert' | 'critical' | 'optimized';
  x: number;
  y: number;
  description: string;
  erpBridge?: string; // e.g. 'TOTVS Protheus / Open Finance BACEN'
  tensionRule?: string; // e.g. 'Monitorar se caixa D+0 fica abaixo de 15 dias de OPEX'
  tensionConnectedNodeIds?: string[];
  trend?: 'up' | 'down' | 'stable';
  telemetry?: {
    currentVal: string;
    threshold: string;
    lastReconciledMs: number;
    syncedSystem: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  status: 'nominal' | 'strained' | 'severed' | 're-routed';
  activePulse?: boolean;
  isTensionBridge?: boolean;
}

export interface GraphTensionBridge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceCode: string;
  targetCode: string;
  tensionTitle: string;
  tensionDescription: string;
  severity: SeverityLevel;
  triggerCondition: string;
  recommendedResolution: string;
  isTriggered: boolean;
  simulatedScenarioTitle?: string;
}

export interface EnterpriseKnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tensionBridges?: GraphTensionBridge[];
  lastReconciled: string;
  healthIndex: number; // 0 - 100
  activeTensionCount?: number;
  erpSyncStatus?: {
    system: string;
    status: 'connected' | 'syncing' | 'healthy';
    latencyMs: number;
  }[];
}

export type SwarmAgentId = 
  | 'Financial_Agent'
  | 'Inventory_Agent'
  | 'Supply_Chain_Agent'
  | 'Zero_Trust_Risk_Agent'
  | 'Sales_Agent'
  | 'Production_BOM_Agent'
  | 'Audit_Ledger_Agent'
  | 'Legal_Contract_Agent'
  | 'Tax_Optimizer_Agent'
  | 'Facility_Maintenance_Agent'
  | 'People_Analytics_Agent'
  | 'Dynamic_Pricing_Agent'
  | 'Data_Analyst_Predictive_Agent'
  | 'Red_Team_Adversarial_Agent'
  | 'Observability_Trace_Guardrail'
  | 'Behavioral_Negotiation_Agent'
  | 'Macro_Web_Grounding_Agent'
  | 'Episodic_Memory_Historical_Agent'
  | 'Supervisor_Swarm_Orchestrator'
  | 'What_If_Scenario_Simulator';

export interface SwarmOrchestratorConfig {
  active_swarm_agents: SwarmAgentId[];
  execution_mode: 'PARALLEL_ASYNC';
  max_parallel_workers: number;
}

export interface SwarmAgentOutput {
  agentName: string;
  role: 'procurement' | 'finance' | 'logistics' | 'sales' | 'risk' | 'revenue_ops' | 'tax_compliance' | 'legal' | 'tax_optimizer' | 'facility' | 'people_analytics' | 'dynamic_pricing' | 'production_bom' | 'audit_ledger' | 'data_science' | 'red_team' | 'observability' | 'behavioral' | 'macro_web' | 'episodic_memory' | 'supervisor' | 'what_if_simulator' | string;
  agentId?: SwarmAgentId | string;
  reasoning: string;
  proposedAction: string;
  confidence: number;
  metrics: Record<string, string>;
  status: 'idle' | 'deliberating' | 'completed';
}

export interface SwarmDeliberation {
  procurement: SwarmAgentOutput;
  finance: SwarmAgentOutput;
  logistics: SwarmAgentOutput;
  sales: SwarmAgentOutput;
  risk: SwarmAgentOutput;
  revenue_ops?: SwarmAgentOutput;
  legal_contract?: SwarmAgentOutput;
  tax_optimizer?: SwarmAgentOutput;
  facility_maintenance?: SwarmAgentOutput;
  people_analytics?: SwarmAgentOutput;
  dynamic_pricing?: SwarmAgentOutput;
  production_bom?: SwarmAgentOutput;
  audit_ledger?: SwarmAgentOutput;
  data_analyst_predictive?: SwarmAgentOutput;
  red_team_adversarial?: SwarmAgentOutput;
  observability_trace_guardrail?: SwarmAgentOutput;
  behavioral_negotiation?: SwarmAgentOutput;
  macro_web_grounding?: SwarmAgentOutput;
  episodic_memory_historical?: SwarmAgentOutput;
  supervisor_swarm_orchestrator?: SwarmAgentOutput;
  what_if_scenario_simulator?: SwarmAgentOutput;
  synthesizer?: any;
  agents?: Record<string, SwarmAgentOutput>;
  consensusScore?: number;
  deliberationTimeMs?: number;
  auditHash?: string;
  orchestrator_config?: SwarmOrchestratorConfig;
}

export interface CardKpi {
  label: string;
  value: string;
  delta?: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface DecisionActionOption {
  id: string;
  label: string;
  description: string;
  estimatedCost: string;
  impactScore: number;
  selected?: boolean;
  automatedSteps: string[];
}

export interface ZeroGuiAction {
  id?: string;
  type: 'SwipeMultiSig' | 'VoiceAdjust' | 'DirectApprove' | string;
  label: string;
  payload?: any;
}

export type IndustrySector = 
  | 'manufacturing' 
  | 'retail' 
  | 'healthcare' 
  | 'services' 
  | 'real_estate'
  | 'agribusiness'
  | 'construction'
  | 'energy'
  | 'logistics'
  | 'ecommerce'
  | 'financial_services';

export type VectorDocumentCategory = 
  | 'tax_law' 
  | 'supplier_policy' 
  | 'zero_gui_approval' 
  | 'SOP' 
  | 'legal_contract' 
  | 'audit_standard' 
  | string;

export interface VectorDocumentMetadata {
  tenant_id: string;
  category: VectorDocumentCategory;
  updated_at: string;
  entity_id: string;
  title: string;
  tags: string[];
  similarity_score?: number;
}

export interface VectorDocumentPayload {
  vector_id: string;
  text: string;
  metadata: VectorDocumentMetadata;
  tokens_count: number;
  status: 'active' | 'archived' | 'pending';
}

export interface SectorContextAST {
  sector: IndustrySector;
  sectorLabel: string;
  complianceStandard?: string;
  regulatoryStandard?: string;
  criticalInvariant?: string;
  domainSpecificKpi?: {
    label: string;
    value: string;
    alert: boolean;
  };
}

export interface SecurityGuardAST {
  status: 'VERIFIED' | 'SUSPECTED_FRAUD' | 'QUARANTINE_ACTIVE' | 'CHALLENGE_REQUIRED';
  threat_category?: 'NONE' | 'MAN_IN_THE_MIDDLE' | 'UNAUTHORIZED_PIX_UPDATE' | 'PHISHING_INVOICE' | 'DATA_LEAK_LGPD' | string;
  flag?: string;
  risk_score?: number;
  confidence?: number; // 0 to 1
  evidence?: string[];
  anomaly_details?: string;
  source_authenticity?: string;
  requires_biometric_override?: boolean;
  mitigation_protocol?: string;
  block_action_payload?: boolean;
  fraud_alert_active?: boolean;
}

export type ProofOfIntentSecurityCheck = SecurityGuardAST;

export interface ExecutionPayload {
  service?: 'SAP_RFC_CLIENT' | 'TOTVS_REST_GATEWAY' | 'ZAPI_WHATSAPP' | 'BACEN_PIX_INTERCEPTOR' | 'SEFAZ_NFE_GATEWAY' | 'AVALARA_SALES_TAX' | 'STRIPE_VAT_OSS' | string;
  target_service?: string;
  action?: string;
  target_id?: string;
  parameters?: Record<string, any>;
  crypto_proof_secp256k1?: string;
  signature?: string;
  [key: string]: any;
}

export interface ZeroGuiExceptionAction {
  id: string;
  label: string;
  style: 'primary' | 'danger' | 'secondary' | string;
  function_call: {
    name: string;
    args: Record<string, any>;
  };
}

export interface ZeroGuiExceptionCard {
  title: string;
  risk_level: 'HIGH' | 'CRITICAL';
  summary: string;
  impact_kpis: Array<{
    label: string;
    value: string;
  }>;
  zero_trust_check: {
    status: 'PASSED' | 'WARNING' | 'BLOCKED';
    reason: string;
  };
  actions: ZeroGuiExceptionAction[];
}

export interface ZeroGuiCardEnvelope {
  zero_gui_card: ZeroGuiExceptionCard;
}

export interface CriticalDecisionCardAST {
  id?: string;
  ui_type: 'CriticalDecisionCard';
  tenant_id?: string;
  title?: string;
  priority: SeverityLevel;
  summary: string;
  kpis: CardKpi[];
  invariants_checked: string[];
  suggested_actions?: DecisionActionOption[];
  actions?: ZeroGuiAction[];
  requires_human_approval?: boolean;
  autonomous_budget_cap_exceeded?: boolean;
  confidence_score?: number;
  reasoning_trail?: string[];
  sector_context?: SectorContextAST;
  security_guard?: SecurityGuardAST;
  execution_payload?: ExecutionPayload;
  context_graph_snapshot?: {
    nodesAffected: string[];
    riskScore: number;
    financialExposure: string;
  };
  tension_analysis?: any;
  audit_hash?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  eventId: string;
  eventTitle: string;
  sector?: IndustrySector | string;
  jurisdiction?: FiscalJurisdiction | string;
  agentsInvolved?: string[];
  decisionSummary: string;
  decisionAst?: CriticalDecisionCardAST | any;
  execution_payload?: ExecutionPayload | any;
  status: 'executed' | 'adjusted' | 'rejected' | 'pending' | 'blocked_fraud' | 'quarantine';
  signatures?: {
    role: string;
    keyId: string;
    signedAt: string;
    verified: boolean;
  }[];
  executionReceipt?: string;
  invariantSnapshot?: string[];
  recordHash?: string;
  previousRecordHash?: string;
  chainIndex?: number;
  requiredSignatures?: number;
}

export type NavigationTab = 
  | 'operational_dashboard' 
  | 'dre_waterfall'
  | 'autonomous_swarm_brain'
  | 'roadmap_rollout_hub'
  | 'counterfactual_oracle'
  | 'construct_lab'
  | 'deja_vu_detection'
  | 'legal_tax_recovery'
  | 'inss_obras'
  | 'partner_portal'
  | 'express_diagnosis'
  | 'graph_health_workspace'
  | 'risk_engine_diagnosis'
  | 'gps_telemetry'
  | 'erp_connector_config'
  | 'vector_knowledge_store'
  | 'architecture_engineering'
  | 'onboarding_wizard' 
  | 'governance_settings' 
  | 'audit_ledger_view'
  | 'super_admin'
  | 'velatrix_office'
  | 'central_laudos'
  | 'esteiras_laudos_hub'
  | 'novo_laudo'
  | 'motor_pericial'
  | 'oraculo_liquidez'
  | 'contract_lab'
  | 'pericia'
  | 'inss'
  | 'precatoria'
  | 'escudo_edge' | 'leitura_autos'
  | 'split_api'
  | 'webhooks'
  | 'ast_json'
  | 'llm_engine'
  | 'observability'
  | 'api_keys_config'
  // Enterprise · Confiança (P17)
  | 'ent_hub' | 'legacy_dashboard' | 'ent_connect' | 'ent_guardrail' | 'ent_risk_shield' | 'ent_jurimetria' | 'ent_zdr' | 'ent_hitl' | 'ent_verify_seal' | 'ent_conflict' | 'ent_packages'
  | 'admin_analytics' // Super Admin · Analytics de uso ao vivo
  | 'neural_core';

export type UserRole = 
  | 'tenant_admin' 
  | 'c_level_approver' 
  | 'operator' 
  | 'super_admin'
  | 'office_staff'
  | 'cfo_executive'
  | 'parceiro_tributario'
  | 'parceiro_operacional'
  | 'advogado_tributarista'
  | 'contador_fiscal'
  | 'perito_judicial';

export type ContractedServiceType = 'operational' | 'tax_recovery';
export type ServiceWorkMode = 'operational' | 'tax_recovery' | 'both';

export interface TenantProfile {
  id: string;
  name: string;
  slug: string;
  cnpj: string;
  razaoSocial?: string;
  plano?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  planTier?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'REGULATED';
  status?: 'active' | 'warning' | 'suspended' | 'shadow_mode' | 'trial' | 'expired';
  // Personalização White-Label por Tenant
  logoUrl?: string;
  corPrimaria?: string; // Hex da cor do cliente (ex: '#0284c7', '#4F46E5', '#0D9488')
  dominio?: string; // Subdomínio (ex: 'monteiro.velatrix.app' ou domínio próprio)
  ativoEm?: string;
  cancelacaoEm?: string;
  provedoresAtivos?: Record<string, any>;
  mrrBrl?: number;
  tokensConsumedMonthly?: number;
  jurisdiction?: FiscalJurisdiction;
  country?: string;
  sector: IndustrySector;
  sectorLabel: string;
  regulatoryStandard: string;
  connectedErp: string;
  connectedChannels: string[];
  createdAt: string;
  shadowModeExpiresAt?: string;
  trialExpiresAt?: string;
  trialDurationDays?: number;
  featureFlagOverrides?: Record<string, boolean>;
  enabledServices?: ContractedServiceType[];
  defaultWorkMode?: ServiceWorkMode;
  annualRevenue?: number;
  monthlyRevenue?: number;
  taxRegime?: 'lucro_real' | 'lucro_presumido' | 'simples_nacional';
  ebitdaMargin?: number;
  partnerId?: string;
  estimatedRecovery60Months?: number;
  successFeeEstimated?: number;
  partnerSharePct?: number;
  velatrixSharePct?: number;
  location?: {
    city: string;
    state: string;
    lat: number;
    lng: number;
  };
}

export interface BusinessInvariantConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: 'currency' | 'percentage' | 'number' | 'boolean';
  value: number | string | boolean;
  unit: string;
  category: 'treasury' | 'risk' | 'logistics' | 'security';
}

export interface ApproverRoleConfig {
  id: string;
  roleName: string;
  holderName: string;
  email: string;
  keyId: string;
  requiredForCritical: boolean;
  active: boolean;
}

export interface WhatsAppRecipient {
  id: string;
  name: string;
  role: string;
  phone: string;
  active: boolean;
  receiveZeroTrustLockdown: boolean;
  receiveCashAnomalyAlerts: boolean;
  receivePixTamperAlerts: boolean;
  secp256k1KeyId: string;
}

export interface WhatsAppDispatchLog {
  id: string;
  timestamp: string;
  recipientName: string;
  phone: string;
  alertType: 'ZERO_TRUST_LOCKDOWN' | 'PIX_TAMPER_BLOCKED' | 'TREASURY_CASH_BREACH' | 'TAX_GLITCH_CRITICAL';
  status: 'DELIVERED' | 'READ' | 'CONFIRMED_LOCKDOWN' | 'APPROVED_HSM';
  payloadSnippet: string;
  latencyMs: number;
}

export interface WhatsAppGovernanceConfig {
  enabled: boolean;
  provider: 'meta_cloud_api' | 'zapi_enterprise' | 'evolution_api' | 'twilio_business';
  phoneNumberId: string;
  businessAccountId: string;
  webhookStatus: 'CONNECTED' | 'DEGRADED' | 'STANDBY';
  hsmTemplateId: string;
  requireTwoFactorHsmAuth: boolean;
  instantLockdownAutoDispatch: boolean;
  notifyOnPixChange: boolean;
  notifyOnCashBreach: boolean;
  notifyOnTaxGlitch: boolean;
  recipients: WhatsAppRecipient[];
  recentDispatches: WhatsAppDispatchLog[];
}

export interface GovernanceSettings {
  maxAutonomousBudgetBrl: number;
  multiSigQuorumCount: number;
  strictProofOfIntent: boolean;
  autoQuarantineSuspiciousEvents: boolean;
  fiscalJurisdiction: FiscalJurisdiction;
  approvers: ApproverRoleConfig[];
  invariants: BusinessInvariantConfig[];
  whatsappAlertConfig?: WhatsAppGovernanceConfig;
}

export interface BusinessPreferenceLearned {
  id: string;
  timestamp: string;
  parameterName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  sourceInstruction: string;
  status: 'active' | 'superseded' | 'reverted';
}

// CyberSpy Ingestion & Threat Intelligence Types
export type CyberSpyThreatType = 'DARK_WEB_LEAK' | 'FINANCIAL_SABOTAGE' | 'INVENTORY_GLITCH' | 'CREDENTIAL_STUFFING' | 'ROGUE_ERP_SCRIPT';
export type CyberSpySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CyberSpyStatus = 'ACTIVE_BLOCK' | 'OVERRIDDEN' | 'RESOLVED';

export interface CyberSpyThreatLog {
  id: string;
  tenant_id: string;
  threat_type: CyberSpyThreatType;
  severity_level: CyberSpySeverity;
  target_entity: string; // E-mail, Chave PIX, SKU do Estoque, Usuário ERP, etc.
  triggered_by_user_id?: string;
  triggered_by_user_name?: string;
  triggered_by_user_role?: string;
  raw_payload: Record<string, any>;
  status: CyberSpyStatus;
  created_at: string;
  source_channel: 'DarkWeb API (Tor/I2P/Telegram)' | 'ERP Audit Stream (SAP/Protheus)' | 'WMS Inventory Telemetry' | 'BACEN SPI Webhook' | 'Database Change Log';
  detection_engine: 'Behavioral & Pattern Analysis Engine' | 'DarkWeb Threat Feed' | 'Inventory Variance AI' | 'Banking Anomaly Guard';
  action_summary: string;
  dispatch_channels: {
    zero_vision_active_block: boolean;
    whatsapp_sent: boolean;
    c_level_push: boolean;
    sms_sent?: boolean;
  };
  override_details?: {
    overridden_by: string;
    overridden_at: string;
    reason: string;
    multi_sig_hash: string;
  };
}

// Brazilian Fiscal Types
export interface NfeEmissionRecord {
  id: string;
  nfeNumber: string;
  series: string;
  accessKey: string;
  recipient: string;
  recipientCnpj: string;
  totalAmountBrl: number;
  icmsAmountBrl: number;
  pisCofinsAmountBrl: number;
  issuedAt: string;
  status: 'AUTORIZADA' | 'EM_PROCESSAMENTO' | 'CANCELADA' | 'REJEITADA';
  protocolSefaz: string;
}

export interface BrazilianTaxEngineState {
  monthlyRevenueBaseBrl: number;
  icmsRate: number; // percentage, e.g. 18.0
  pisRate: number; // percentage, e.g. 1.65
  cofinsRate: number; // percentage, e.g. 7.60
  ipiRate: number; // percentage, e.g. 5.0
  issRate: number; // percentage, e.g. 3.0
  taxCreditInputsBrl: number;
  reformaIbsRate: number; // IBS 17.5%
  reformaCbsRate: number; // CBS 8.8%
  spedFiscalStatus: 'TRANSMITIDO_OK' | 'EM_APURACAO' | 'PENDENTE';
  spedContribStatus: 'TRANSMITIDO_OK' | 'EM_APURACAO' | 'PENDENTE';
  esocialStatus: 'SINCRONIZADO_RFB' | 'EM_APURACAO';
  complianceStandard: 'LGPD (Lei 13.709/2018)';
  lastNfeEmissions: NfeEmissionRecord[];
}

// US Sales Tax & Compliance Types
export interface UsSalesTaxStateRecord {
  stateCode: string;
  stateName: string;
  salesTaxRate: number;
  thresholdReached: boolean;
  revenueInState: number;
  taxCollected: number;
  exemptionCertificatesCount: number;
}

export interface UsTaxEngineState {
  monthlyRevenueBaseUsd: number;
  federalTaxRate: number;
  averageSalesTaxRate: number;
  statesNexus: UsSalesTaxStateRecord[];
  soc2ComplianceStatus: 'TYPE_II_CERTIFIED' | 'ANNUAL_AUDIT_READY' | 'RE_EVALUATING';
  ccpaComplianceStatus: 'ENFORCED_ZERO_TRUST' | 'ACTIVE';
  irs1099Status: 'AUTOMATED_W9_VERIFIED' | 'PENDING_VALIDATION';
}

// European Union VAT & GDPR Types
export interface EuVatCountryRecord {
  countryCode: string;
  countryName: string;
  standardVatRate: number;
  reverseChargeApplicable: boolean;
  viesValidated: boolean;
  revenueInCountry: number;
  vatPayable: number;
}

export interface EuTaxEngineState {
  monthlyRevenueBaseEur: number;
  ossVatRateAverage: number;
  vatCountries: EuVatCountryRecord[];
  saftStatus: 'SAF_T_EXPORT_READY' | 'VALIDATING';
  gdprComplianceStatus: 'ARTICLE_30_ROPA_ACTIVE' | 'AUDIT_VERIFIED';
  euAiActClassification: 'TIER_1_MINIMAL_RISK_ENTERPRISE_SYSTEM';
}

export * from './database';
