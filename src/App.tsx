import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Cpu, Scale, CheckCircle2, Sparkles, AlertCircle, Layers } from 'lucide-react';
import { ConsoleShell } from './components/console/ConsoleShell';
import { EsteiraShell } from './components/esteiras/EsteiraShell';
import { ModuleTabsShell } from './components/console/ModuleTabsShell';
import { ConnectHealthPanel } from './components/enterprise/ConnectHealthPanel';
import { GuardrailPanel } from './components/enterprise/GuardrailPanel';
import { ZdrPanel } from './components/enterprise/ZdrPanel';
import { VerifySealPanel } from './components/enterprise/VerifySealPanel';
import { VelatrixHomeView } from './components/home/VelatrixHomeView';
import { EnterpriseHubView, isEnterpriseToolId } from './components/enterprise/EnterpriseHubView';
import { AosSidebar } from './components/AosSidebar';
import { AosHeader } from './components/AosHeader';
import { ModuleSkeleton } from './components/console/ModuleSkeleton';
import { EventStreamBar } from './components/EventStreamBar';
import { SemanticGraphViewer } from './components/SemanticGraphViewer';
import { AgentSwarmDeliberation } from './components/AgentSwarmDeliberation';
import { ZeroGuiCardRenderer } from './components/ZeroGuiCardRenderer';
import { AstJsonInspector } from './components/AstJsonInspector';
import { AuditLedger } from './components/AuditLedger';
import { EdgeMultimodalIngestion, MultimodalIngestResult } from './components/EdgeMultimodalIngestion';
import { FeedbackLoopManager } from './components/FeedbackLoopManager';
import { TeslaAutoInductionEngineCard } from './components/operations/TeslaAutoInductionEngineCard';
import { VelatrixAosHeroCyberBrain } from './components/operations/VelatrixAosHeroCyberBrain';
import { AosJourneyStepper } from './components/AosJourneyStepper';
import { ExpressDiagnosisCard } from './components/diagnosis/ExpressDiagnosisCard';
import { GpsTelemetryCard } from './components/telemetry/GpsTelemetryCard';
import { AskAosModal } from './components/search/AskAosModal';
import { VelatrixLoginScreen } from './components/auth/VelatrixLoginScreen';
import { useAuth } from './context/AuthContext';
import { CentralAuditReportService } from './services/centralAuditReportService';
import { ExecutiveStatusCard } from './components/ExecutiveStatusCard';
import { PgfnCapagDiagnosisCard } from './components/operations/PgfnCapagDiagnosisCard';
import { SalaoParceiroContractCard } from './components/operations/SalaoParceiroContractCard';
import { INITIAL_DEFAULT_WHATSAPP_CONFIG } from './components/governance/WhatsAppGovernanceCard';
import './services/registry';
import { 
  EnterpriseKnowledgeGraph, 
  SemanticEvent, 
  SwarmDeliberation, 
  CriticalDecisionCardAST, 
  AuditRecord,
  BusinessPreferenceLearned,
  NavigationTab,
  TenantProfile,
  GovernanceSettings,
  IndustrySector,
  SupportedLanguage,
  SupportedCurrency
} from './types/aos';
import { INITIAL_KNOWLEDGE_GRAPH, PRESET_SCENARIOS, ScenarioDefinition } from './data/mockScenarios';
import { processAosEvent, simulateTensionEvent } from './services/aosEngine';
import { TRANSLATIONS } from './utils/i18n';
import { secureId } from './lib/demoMode';
import { iniciarTelemetria, encerrarTelemetria, rastrearTela } from './services/telemetriaClient';

// Code-Splitting: Módulos de abas carregados sob demanda via React.lazy
const NovoLaudoIntakeView = lazy(() => import('./components/esteiras/NovoLaudoIntakeView').then(m => ({ default: m.NovoLaudoIntakeView })));
const CentralAuditReportsView = lazy(() => import('./components/reports/CentralAuditReportsView').then(m => ({ default: m.CentralAuditReportsView })));
const PipelineHubView = lazy(() => import('./components/pipelines/PipelineHubView').then(m => ({ default: m.PipelineHubView })));
const DetailedDreWaterfallCard = lazy(() => import('./components/operations/DetailedDreWaterfallCard').then(m => ({ default: m.DetailedDreWaterfallCard })));
const AutonomousSwarmHub = lazy(() => import('./components/operations/AutonomousSwarmHub').then(m => ({ default: m.AutonomousSwarmHub })));
const LegalTaxRecoveryPanel = lazy(() => import('./components/legal/LegalTaxRecoveryPanel').then(m => ({ default: m.LegalTaxRecoveryPanel })));
const PericiaEsteiraView = lazy(() => import('./components/esteiras/PericiaEsteiraView').then(m => ({ default: m.PericiaEsteiraView })));
const InssHubView = lazy(() => import('./components/esteiras/InssHubView').then(m => ({ default: m.InssHubView })));
const InssObrasPanel = lazy(() => import('./components/legal/InssObrasPanel').then(m => ({ default: m.InssObrasPanel })));
const PrecatorioEnterpriseRunnerView = lazy(() => import('./components/esteiras/PrecatorioEnterpriseRunnerView').then(m => ({ default: m.PrecatorioEnterpriseRunnerView })));
const UnifiedDiagnosisView = lazy(() => import('./components/diagnosis/UnifiedDiagnosisView').then(m => ({ default: m.UnifiedDiagnosisView })));
const MotorPericialView = lazy(() => import('./components/cognitive/MotorPericialView').then(m => ({ default: m.MotorPericialView })));
const LiquidityPredictiveOracleCard = lazy(() => import('./components/oracle/LiquidityPredictiveOracleCard').then(m => ({ default: m.LiquidityPredictiveOracleCard })));
const CounterfactualOraclePanel = lazy(() => import('./components/oracle/CounterfactualOraclePanel').then(m => ({ default: m.CounterfactualOraclePanel })));
const ContractLabView = lazy(() => import('./components/construct/ContractLabView').then(m => ({ default: m.ContractLabView })));
const LeituraAutosPanel = lazy(() => import('./components/autos/LeituraAutosPanel').then(m => ({ default: m.LeituraAutosPanel })));
const VectorKnowledgeStoreView = lazy(() => import('./components/VectorKnowledgeStoreView').then(m => ({ default: m.VectorKnowledgeStoreView })));
const EscudoEdgeView = lazy(() => import('./components/security/EscudoEdgeView').then(m => ({ default: m.EscudoEdgeView })));
const GovernmentAndBaasHub = lazy(() => import('./components/connectors/GovernmentAndBaasHub').then(m => ({ default: m.GovernmentAndBaasHub })));
const PartnerPortalView = lazy(() => import('./components/legal/PartnerPortalView').then(m => ({ default: m.PartnerPortalView })));
const ErpConnectorConfig = lazy(() => import('./components/ErpConnectorConfig').then(m => ({ default: m.ErpConnectorConfig })));
const WebhooksInspectorView = lazy(() => import('./components/connectors/WebhooksInspectorView').then(m => ({ default: m.WebhooksInspectorView })));
const GpsTelemetryDashboard = lazy(() => import('./components/telemetry/GpsTelemetryDashboard').then(m => ({ default: m.GpsTelemetryDashboard })));
const AstJsonView = lazy(() => import('./components/governance/AstJsonView').then(m => ({ default: m.AstJsonView })));
const ConstructLabPanel = lazy(() => import('./components/construct/ConstructLabPanel').then(m => ({ default: m.ConstructLabPanel })));
const AuditTrailView = lazy(() => import('./components/AuditTrailView').then(m => ({ default: m.AuditTrailView })));
const GraphHealthWorkspace = lazy(() => import('./components/graph-health/GraphHealthWorkspace').then(m => ({ default: m.GraphHealthWorkspace })));
const LlmEngineView = lazy(() => import('./components/governance/LlmEngineView').then(m => ({ default: m.LlmEngineView })));
const ObservabilityView = lazy(() => import('./components/governance/ObservabilityView').then(m => ({ default: m.ObservabilityView })));
const NeuralCoreView = lazy(() => import('./components/governance/NeuralCoreView').then(m => ({ default: m.NeuralCoreView })));
const GovernancePanel = lazy(() => import('./components/GovernancePanel').then(m => ({ default: m.GovernancePanel })));
const OnboardingWizard = lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
const SuperAdminDashboard = lazy(() => import('./components/superadmin/SuperAdminDashboard').then(m => ({ default: m.SuperAdminDashboard })));
const VelatrixOfficeDashboard = lazy(() => import('./components/office/VelatrixOfficeDashboard').then(m => ({ default: m.VelatrixOfficeDashboard })));
const AosRoadmapRolloutHub = lazy(() => import('./components/roadmap/AosRoadmapRolloutHub').then(m => ({ default: m.AosRoadmapRolloutHub })));
const AutonomousPipelineFlow = lazy(() => import('./components/AutonomousPipelineFlow').then(m => ({ default: m.AutonomousPipelineFlow })));
const DejaVuIntrusionPanel = lazy(() => import('./components/dejavu/DejaVuIntrusionPanel').then(m => ({ default: m.DejaVuIntrusionPanel })));
const AdminAnalyticsPanel = lazy(() => import('./components/superadmin/AdminAnalyticsPanel').then(m => ({ default: m.AdminAnalyticsPanel })));
const ApiKeysConfigView = lazy(() => import('./components/config/ApiKeysConfigView').then(m => ({ default: m.ApiKeysConfigView })));




export default function App() {
  const { 
    isAuthenticated, 
    activeTenant, 
    setActiveTenant, 
    currentUserRole, 
    setCurrentUserRole,
    isTabAllowed,
    getDefaultTab,
    hasPermission,
    isPartner,
    isSuperAdmin
  } = useAuth();

  // Localization and Currency State
  const [language, setLanguage] = useState<SupportedLanguage>('pt');
  const [currency, setCurrency] = useState<SupportedCurrency>('BRL');

  // Navigation & Layout State
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => getDefaultTab());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // RBAC Tab Protection Effect: Automatically redirect if currentTab is forbidden for the current role
  useEffect(() => {
    if (isAuthenticated && !isTabAllowed(currentTab)) {
      const fallbackTab = getDefaultTab();
      setCurrentTab(fallbackTab);
    }
  }, [currentUserRole, currentTab, isAuthenticated, isTabAllowed, getDefaultTab]);

  // Analytics de uso: só metadados de navegação (id da tela + horário). Sem conteúdo de tela.
  useEffect(() => {
    if (isAuthenticated) iniciarTelemetria();
    else encerrarTelemetria();
  }, [isAuthenticated]);
  useEffect(() => {
    if (isAuthenticated) rastrearTela(currentTab);
  }, [isAuthenticated, currentTab]);

  // Global Navigation Listener for seamless cross-module redirection and route sanitization
  useEffect(() => {
    // Redirecionamento explícito: se a rota ou hash for /billing, direcionar para /operacional
    const checkBillingUrl = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/billing') || hash.includes('billing')) {
        setCurrentTab('operational_dashboard');
      }
    };
    checkBillingUrl();
    window.addEventListener('popstate', checkBillingUrl);

    const handleNav = (e: CustomEvent<NavigationTab>) => {
      if (e.detail) {
        setCurrentTab(e.detail);
      }
    };
    window.addEventListener('velatrix:navigate_tab' as any, handleNav as EventListener);
    return () => {
      window.removeEventListener('popstate', checkBillingUrl);
      window.removeEventListener('velatrix:navigate_tab' as any, handleNav as EventListener);
    };
  }, []);

  // Tenant State synced with AuthContext activeTenant
  const currentTenant = activeTenant;
  const setCurrentTenant = (tenant: TenantProfile) => setActiveTenant(tenant);

  // Governance Settings State
  const [governanceSettings, setGovernanceSettings] = useState<GovernanceSettings>({
    maxAutonomousBudgetBrl: 25000,
    multiSigQuorumCount: 2,
    strictProofOfIntent: true,
    autoQuarantineSuspiciousEvents: true,
    fiscalJurisdiction: 'BR',
    approvers: [
      {
        id: 'appr_1',
        roleName: 'CEO (Chief Executive Officer)',
        holderName: 'Roberto Albuquerque',
        email: 'ceo@empresa.com.br',
        keyId: 'secp256k1::0x7F4A...E19B',
        requiredForCritical: true,
        active: true
      },
      {
        id: 'appr_2',
        roleName: 'CFO (Chief Financial Officer)',
        holderName: 'Mariana Duarte',
        email: 'cfo@empresa.com.br',
        keyId: 'secp256k1::0x2C9B...884A',
        requiredForCritical: true,
        active: true
      },
      {
        id: 'appr_3',
        roleName: 'COO (Diretor de Operações)',
        holderName: 'Carlos Eduardo Mendes',
        email: 'coo@empresa.com.br',
        keyId: 'secp256k1::0x9A8F...6A12',
        requiredForCritical: false,
        active: true
      },
      {
        id: 'appr_4',
        roleName: 'Compliance & DPO Officer',
        holderName: 'Helena Fontes',
        email: 'compliance@empresa.com.br',
        keyId: 'secp256k1::0x4E11...33F0',
        requiredForCritical: false,
        active: true
      }
    ],
    invariants: [
      {
        id: 'inv_cash_min',
        name: 'Saldo_Caixa_Minimo (Colchão de Liquidez)',
        description: 'Bloqueia despachos táticos que reduzam o caixa livre projetado abaixo do limiar estipulado pelo conselho.',
        enabled: true,
        type: 'currency',
        value: 2000000,
        unit: 'BRL',
        category: 'treasury'
      },
      {
        id: 'inv_sla_min',
        name: 'SLA_Compliance_TierA_Minimo',
        description: 'Exige que qualquer plano tático mantenha o cumprimento dos contratos de clientes estratégicos.',
        enabled: true,
        type: 'percentage',
        value: 98.0,
        unit: '%',
        category: 'risk'
      },
      {
        id: 'inv_stock_days',
        name: 'Estoque_Seguranca_Minimo',
        description: 'Garante que os insumos críticos não fiquem abaixo da cobertura de dias de operação.',
        enabled: true,
        type: 'number',
        value: 15,
        unit: 'dias',
        category: 'logistics'
      },
      {
        id: 'inv_max_spot_discount',
        name: 'Desconto_Maximo_Spot_Sem_CFO',
        description: 'Limite máximo de desconto ou bonificação que o Agente de Vendas pode conceder para retenção.',
        enabled: true,
        type: 'percentage',
        value: 7.5,
        unit: '%',
        category: 'treasury'
      },
      {
        id: 'inv_proof_intent_bank',
        name: 'Bloqueio_Troca_Conta_Nao_Homologada',
        description: 'Dispara quarentena instantânea se houver solicitação de alteração de domicílio bancário ou PIX por canal não assinado.',
        enabled: true,
        type: 'boolean',
        value: true,
        unit: 'Zero-Trust Gate',
        category: 'security'
      }
    ],
    whatsappAlertConfig: INITIAL_DEFAULT_WHATSAPP_CONFIG
  });

  // Core AOS State
  const [graph, setGraph] = useState<EnterpriseKnowledgeGraph>(INITIAL_KNOWLEDGE_GRAPH);
  const [currentEvent, setCurrentEvent] = useState<SemanticEvent | null>(PRESET_SCENARIOS[0].event);
  const [swarm, setSwarm] = useState<SwarmDeliberation>(PRESET_SCENARIOS[0].swarm);
  const [ast, setAst] = useState<CriticalDecisionCardAST>(PRESET_SCENARIOS[0].ast);
  const [activeEngine, setActiveEngine] = useState<'gemini-3.8-flash' | 'gemini-3.7-flash' | 'local_neural_engine'>('gemini-3.8-flash');
  const [isProcessing, setIsProcessing] = useState(false);

  // Module 6: Feedback Loop & Business Preferences Learned State
  const [learnedPreferences, setLearnedPreferences] = useState<BusinessPreferenceLearned[]>([
    {
      id: 'pref_1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      parameterName: 'Margem Mínima Clientes Tier-A',
      oldValue: '18.0%',
      newValue: '12.0%',
      reason: 'Instrução executiva para priorizar volume e retenção de contratos âncora.',
      sourceInstruction: 'Ajustar margem mínima para 12% em contratos Tier-A',
      status: 'active'
    }
  ]);

  // Modals & UI Viewers
  const [isAstModalOpen, setIsAstModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAskAosModalOpen, setIsAskAosModalOpen] = useState(false);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cenário inicial só após autenticação (/api/aos/process exige Bearer token)
  useEffect(() => {
    if (isAuthenticated) handleSelectScenario(PRESET_SCENARIOS[0], { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Keyboard shortcut for Ask AOS
  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAskAosModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSwitchSector = async (sector: IndustrySector) => {
    let targetScenario = PRESET_SCENARIOS.find(s => s.ast.sector_context?.sector === sector);
    if (!targetScenario) {
      if (sector === 'healthcare') targetScenario = PRESET_SCENARIOS.find(s => s.id === 'healthcare_coldchain');
      else if (sector === 'services') targetScenario = PRESET_SCENARIOS.find(s => s.id === 'services_capacity_crunch');
      else if (sector === 'retail') targetScenario = PRESET_SCENARIOS.find(s => s.id === 'b2b_demand_surge');
      else targetScenario = PRESET_SCENARIOS[0];
    }
    if (targetScenario) {
      handleSelectScenario(targetScenario, { silent: true });
    }
  };

  // P23: execuções automáticas (login, troca de tenant) são silenciosas — o toast de cenário
  // industrial não deve aparecer para o escritório; só quando alguém escolhe um cenário.
  const handleSelectScenario = async (scenario: ScenarioDefinition, opts?: { silent?: boolean }) => {
    setIsProcessing(true);
    setCurrentEvent(scenario.event);

    try {
      const result = await processAosEvent(scenario.event.title, graph);
      setGraph(result.graph);
      setSwarm(result.swarm);
      setAst(result.ast);
      setActiveEngine(result.source);
      if (!opts?.silent) showToast(language === 'pt' 
        ? `Evento "${scenario.badge}" processado pelo Barramento Semântico!`
        : `Event "${scenario.badge}" processed by the Semantic Bus!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAuditRecord = (record: AuditRecord) => {
    setAuditRecords(prev => [record, ...prev]);
  };

  const handleSubmitCustomEvent = async (eventText: string, rawPayload?: Record<string, any>) => {
    setIsProcessing(true);
    
    // Create local semantic event object for display
    const customEvt: SemanticEvent = {
      id: `evt_custom_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: rawPayload?.sefaz_key ? 'OCR SEFAZ NF-e' : 'Manual Injection / Document OCR',
      title: eventText.length > 50 ? `${eventText.slice(0, 47)}...` : eventText,
      description: eventText,
      category: 'supply_chain',
      severity: /urgente|crise|parada|quebra|greve|ransomware|bloqueio|fraude/i.test(eventText) ? 'Critical' : 'High',
      metricsAffected: [
        { name: 'Impacto Operacional', current: 'Nominal', projected: 'Em Avaliação', delta: 'Pendente', negativeImpact: true }
      ],
      rawPayload: rawPayload
    };
    setCurrentEvent(customEvt);

    try {
      const result = await processAosEvent(eventText, graph);
      setGraph(result.graph);
      setSwarm(result.swarm);
      setAst(result.ast);
      setActiveEngine(result.source);

      // Advance event status out of "Em Avaliação (Pendente)" to coherent resolved status
      setCurrentEvent(prev => {
        if (!prev) return prev;
        const mainKpi = result.ast.kpis?.[0];
        const secondaryKpi = result.ast.kpis?.[1];
        const primaryAction = result.ast.suggested_actions?.[0]?.label || result.ast.actions?.[0]?.label || 'Ação Recomendada';
        
        return {
          ...prev,
          metricsAffected: [
            { 
              name: mainKpi?.label || 'Impacto Operacional', 
              current: 'Analisado pelo Enxame', 
              projected: mainKpi?.value || 'Mitigado', 
              delta: 'Resolvido', 
              negativeImpact: mainKpi?.impact === 'negative' 
            },
            { 
              name: secondaryKpi?.label || 'Decisão Proposta', 
              current: 'Consenso Atingido', 
              projected: primaryAction.length > 35 ? `${primaryAction.slice(0, 32)}...` : primaryAction, 
              delta: 'Encaminhado para Aprovação', 
              negativeImpact: false 
            }
          ]
        };
      });

      showToast(language === 'pt'
        ? '✓ Documento/Evento processado com sucesso pelo Enxame de Agentes!'
        : '✓ Document/Event successfully processed by the Agent Swarm!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao processar evento.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustParameters = async (instruction: string) => {
    setIsProcessing(true);
    showToast(language === 'pt'
      ? `Recalculando decisão com instrução: "${instruction}"...`
      : `Recalculating decision with instruction: "${instruction}"...`);

    // Record learning in Feedback Loop
    const newPref: BusinessPreferenceLearned = {
      id: `pref_${Date.now()}`,
      timestamp: new Date().toISOString(),
      parameterName: instruction.length > 30 ? instruction.slice(0, 27) + '...' : instruction,
      oldValue: 'Parâmetro Padrão',
      newValue: 'Ajuste Executivo',
      reason: `Instrução humana absorvida pelo AOS: "${instruction}". Estado semântico reconfigurado.`,
      sourceInstruction: instruction,
      status: 'active'
    };

    setLearnedPreferences(prev => [newPref, ...prev]);

    try {
      const result = await processAosEvent(currentEvent?.description || 'Ajuste de Parâmetros', graph, instruction);
      setGraph(result.graph);
      setSwarm(result.swarm);
      setAst(result.ast);
      setActiveEngine(result.source);
      showToast(language === 'pt'
        ? `[Grafo Atualizado]: Preferência registrada por instrução executiva!`
        : `[Graph Updated]: Preference saved by executive command!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Tension Bridge Simulation Handler
  const handleSimulateTension = async (tensionBridge: any) => {
    setIsProcessing(true);
    showToast(language === 'pt'
      ? `⚡ Conflito detectado: [${tensionBridge.sourceCode}] vs [${tensionBridge.targetCode}]! Acionando Enxame...`
      : `⚡ Tension Conflict: [${tensionBridge.sourceCode}] vs [${tensionBridge.targetCode}]! Triggering Swarm...`);

    const tensionEvt: SemanticEvent = {
      id: `evt_tension_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'AOS Neural Tension Monitor',
      title: `⚡ Tensão: ${tensionBridge.sourceCode} vs ${tensionBridge.targetCode}`,
      description: tensionBridge.tensionDescription,
      category: 'treasury',
      severity: tensionBridge.severity === 'Critical' ? 'Critical' : 'High',
      metricsAffected: [
        { name: 'Nó Origem', current: tensionBridge.sourceCode, projected: 'Alerta/Crítico', delta: 'Disparado', negativeImpact: true },
        { name: 'Nó Destino', current: tensionBridge.targetCode, projected: 'Conflito', delta: 'Tensão Ativa', negativeImpact: true }
      ]
    };
    setCurrentEvent(tensionEvt);

    try {
      const result = await simulateTensionEvent(tensionBridge, graph);
      setGraph(result.graph);
      setSwarm(result.swarm);
      setAst(result.ast);
      setActiveEngine(result.source);
      showToast(language === 'pt'
        ? `✓ Enxame de 12 Agentes deliberou a resolução consensual com sucesso!`
        : `✓ 12-Agent Swarm successfully resolved the operational tension!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Edge Multimodal Ingestion Handler
  const handleMultimodalIngest = (res: MultimodalIngestResult) => {
    // 1. Add new node to semantic graph
    setGraph(prev => {
      const newNode = {
        id: res.graphNodeAdded.id,
        label: res.graphNodeAdded.label,
        category: (res.category === 'invoice' || res.category === 'boleto' ? 'treasury' : 'customers') as any,
        metricValue: res.graphNodeAdded.metricValue,
        metricLabel: res.graphNodeAdded.metricLabel,
        status: 'nominal' as const,
        x: 50,
        y: 85,
        description: res.reconciliationImpact.summary
      };

      const newEdge = {
        id: `e_mm_${Date.now()}`,
        source: res.graphNodeAdded.id,
        target: 'node_cash',
        label: 'Reconciliação Borda',
        status: 'nominal' as const
      };

      return {
        ...prev,
        nodes: [...prev.nodes.filter(n => n.id !== res.graphNodeAdded.id), newNode],
        edges: [...prev.edges, newEdge],
        lastReconciled: new Date().toISOString()
      };
    });

    // 2. Create semantic event for the ingested document
    const docEvent: SemanticEvent = {
      id: `evt_doc_${Date.now()}`,
      timestamp: new Date().toISOString(),
      source: 'OCR Borda SEFAZ',
      title: `[OCR Borda] ${res.title}`,
      description: `${res.extractedData.origin}: ${res.reconciliationImpact.summary}`,
      category: res.category === 'invoice' || res.category === 'boleto' ? 'treasury' : 'customers',
      severity: 'Medium',
      metricsAffected: [
        { name: 'Caixa / Tesouraria', current: 'R$ 8.42M', projected: res.reconciliationImpact.treasuryImpact, delta: 'Reconciliado', negativeImpact: false },
        { name: 'SLA Operacional', current: '98%', projected: res.reconciliationImpact.slaImpact, delta: 'Protegido', negativeImpact: false }
      ]
    };
    setCurrentEvent(docEvent);

    showToast(`✓ Documento "${res.title}" extraído e reconciliado no Grafo Semântico!`);
  };

  const handleApproveMultiSig = (approvedAst: CriticalDecisionCardAST) => {
    const isSuspectedFraud = approvedAst.security_guard?.status === 'SUSPECTED_FRAUD';
    
    // Register audit entry with execution payload
    const newRecord: AuditRecord = {
      id: `rec_${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: currentEvent?.id || 'evt_general',
      eventTitle: currentEvent?.title || 'Decisão Operacional AOS',
      sector: approvedAst.sector_context?.sector || currentTenant.sector,
      agentsInvolved: [
        'CFO Financial', 
        'Inventory', 
        'Supply Chain', 
        'Zero-Trust Risk', 
        'Sales & Revenue', 
        'Production & BOM', 
        'Audit Ledger', 
        'Legal Contract', 
        'Tax Optimizer', 
        'Facility Maint.', 
        'People Analytics', 
        'Dynamic Pricing'
      ],
      decisionSummary: approvedAst.summary,
      decisionAst: approvedAst,
      execution_payload: approvedAst.execution_payload,
      status: isSuspectedFraud ? 'blocked_fraud' : 'executed',
      requiredSignatures: isSuspectedFraud ? 1 : 3,
      signatures: isSuspectedFraud ? [
        { role: 'Proof of Intent AI Guard', keyId: '0x00A1...FF', signedAt: new Date().toISOString(), verified: true }
      ] : [
        { role: 'CEO Executive Key', keyId: '0x7f4a...e1', signedAt: new Date().toISOString(), verified: true },
        { role: 'CFO Treasury Key', keyId: '0x2c9b...88', signedAt: new Date().toISOString(), verified: true },
        { role: 'AOS Autonomous Node', keyId: '0x9a8f...6a', signedAt: new Date().toISOString(), verified: true }
      ],
      executionReceipt: `TX-AOS-${secureId('', 4).toUpperCase()}`,
      invariantSnapshot: approvedAst.invariants_checked
    };

    setAuditRecords(prev => [newRecord, ...prev]);

    if (!isSuspectedFraud) {
      setGraph(prev => ({
        ...prev,
        healthIndex: Math.min(100, prev.healthIndex + 14),
        nodes: prev.nodes.map(n => ({
          ...n,
          status: 'optimized'
        }))
      }));

      showToast(language === 'pt'
        ? '✓ Assinatura Multi-Sig confirmada! Payload emitido para o serviço de destino.'
        : '✓ Multi-Sig signature confirmed! Payload dispatched to destination service.');
    } else {
      showToast(language === 'pt'
        ? '🛡️ Quarentena preventiva acionada! Disparo financeiro bloqueado com sucesso.'
        : '🛡️ Preventive quarantine triggered! Fraudulent payout successfully blocked.');
    }
  };

  // Onboarding Completion Handler
  const handleCompleteOnboarding = (tenant: TenantProfile) => {
    setCurrentTenant(tenant);
    handleSwitchSector(tenant.sector);
    
    const bootstrapAudit: AuditRecord = {
      id: `rec_boot_${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: 'evt_tenant_provisioning',
      eventTitle: `Bootstrap de Tenant: ${tenant.name}`,
      sector: tenant.sector,
      agentsInvolved: ['AOS Multi-Tenant Gateway', 'ERP Discovery Connector', 'Proof of Intent Seed', 'Motor Fiscal BR'],
      decisionSummary: `Organização ${tenant.name} (${tenant.cnpj}) provisionada com sucesso. Conectores vinculados: ${tenant.connectedChannels.join(', ')}. Padrão regulatório: ${tenant.regulatoryStandard}.`,
      decisionAst: ast,
      status: 'executed',
      requiredSignatures: 1,
      signatures: [
        { role: 'Tenant Administrator', keyId: 'secp256k1::0xADMIN...BOOT', signedAt: new Date().toISOString(), verified: true }
      ],
      executionReceipt: `TX-BOOTSTRAP-${tenant.slug.toUpperCase()}`,
      invariantSnapshot: ['Tenant_Data_Isolation_RLS = OK', 'Proof_Of_Intent_Seed = OK', 'Motor_Fiscal_SPED_NFE = OK']
    };

    setAuditRecords(prev => [bootstrapAudit, ...prev]);
    setCurrentTab('operational_dashboard');
    showToast(language === 'pt'
      ? `🚀 Empresa "${tenant.name}" provisionada! Grafo e agentes configurados para ${tenant.sectorLabel}.`
      : `🚀 Enterprise "${tenant.name}" provisioned! Graph and agents initialized for ${tenant.sectorLabel}.`);
  };

  // Governance Settings Handler
  const handleSaveGovernance = (newSettings: GovernanceSettings) => {
    setGovernanceSettings(newSettings);
    showToast(language === 'pt'
      ? '✓ Novas diretrizes de governança e limites fiscais/autonomia salvas!'
      : '✓ New governance guidelines and fiscal/autonomy limits saved!');
  };

  const handleInjectScenarioByName = async (scenarioName: string) => {
    let matchedScenario = PRESET_SCENARIOS.find(s => 
      s.event.title.toLowerCase().includes(scenarioName.toLowerCase()) || 
      s.badge.toLowerCase().includes(scenarioName.toLowerCase()) ||
      s.id.toLowerCase().includes(scenarioName.toLowerCase())
    );

    if (matchedScenario) {
      setCurrentTab('operational_dashboard');
      handleSelectScenario(matchedScenario);
    } else {
      setCurrentTab('operational_dashboard');
      handleSubmitCustomEvent(scenarioName);
    }
  };

  // 0. Render Corporate Authentication Screen if not logged in
  if (!isAuthenticated) {
    return (
      <VelatrixLoginScreen
        onLoginSuccess={() => {
          const defaultRoleTab = getDefaultTab();
          setCurrentTab(defaultRoleTab);
          setToastMessage('Terminal autenticado com sucesso. Bem-vindo ao Velatrix AOS.');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    );
  }

  return (
    <ConsoleShell
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      tenantProfile={currentTenant}
      auditCount={auditRecords.length + 3}
      onOpenAstViewer={() => setIsAstModalOpen(true)}
      onOpenAskAos={() => setIsAskAosModalOpen(true)}
      onOpenRiskSimulator={() => setCurrentTab('risk_engine_diagnosis')}
    >
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 bg-ink text-canvas border border-hairline px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-4 duration-200">
          <Sparkles className="w-4 h-4 text-accent-bright shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic View Router */}
      <div className="flex-1 pb-16 md:pb-8 bg-canvas">
        <Suspense fallback={<ModuleSkeleton />}>

          {/* VIEW NOVO LAUDO: INTAKE & EMISSÃO DE LAUDO PERICIAL */}
          {currentTab === 'novo_laudo' && (
            <div className="py-2">
              <NovoLaudoIntakeView
                tenantProfile={currentTenant}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onReportCreated={(report) => {
                  CentralAuditReportService.saveReport(report);
                  setCurrentTab('central_laudos');
                }}
              />
            </div>
          )}

          {/* VIEW PERÍCIA JUDICIAL: ESTEIRA ESPECIALIZADA MULTI-CONSELHO */}
          {currentTab === 'pericia' && (
            <div className="py-2">
              <EsteiraShell esteira="PERICIA_JUDICIAL">
              <PericiaEsteiraView
                tenantId={currentTenant.id}
                tenantName={currentTenant.name}
                tenantCnpj={currentTenant.cnpj}
                onBack={() => setCurrentTab('operational_dashboard')}
                onReportGenerated={(report) => {
                  CentralAuditReportService.saveReport(report);
                  setCurrentTab('central_laudos');
                }}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW ESPECIALISTA INSS: PREVIDENCIÁRIO & OBRAS */}
          {currentTab === 'inss' && (
            <div className="py-2">
              <EsteiraShell esteira="INSS">
              <InssHubView
                tenantProfile={currentTenant}
                onNavigateTab={setCurrentTab}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW PRECATÓRIA ENTERPRISE: CESSÕES & LIQUIDAÇÃO */}
          {currentTab === 'precatoria' && (
            <div className="py-2">
              <EsteiraShell esteira="PRECATORIA">
              <PrecatorioEnterpriseRunnerView
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW MOTOR PERICIAL 60M: RECONSTITUIÇÃO CRONOLÓGICA & SELIC */}
          {currentTab === 'motor_pericial' && (
            <div className="py-2">
              <MotorPericialView
                tenantProfile={currentTenant}
                currency={currency}
                onNavigateTab={setCurrentTab}
              />
            </div>
          )}

          {/* VIEW ORÁCULO DE LIQUIDEZ PREDITIVO */}
          {currentTab === 'oraculo_liquidez' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8 space-y-4">
              <LiquidityPredictiveOracleCard
                tenantProfile={currentTenant}
              />
            </div>
          )}

          {/* VIEW CONTRACT LAB: 9 AGENTES MULTI-DISCIPLINARES */}
          {currentTab === 'contract_lab' && (
            <div className="py-2">
              <ContractLabView />
            </div>
          )}

          {/* P25 · LEITURA DE AUTOS (500+ páginas, citação por página) */}
          {currentTab === 'leitura_autos' && (
            <div className="py-2 mx-auto w-full max-w-7xl px-4 lg:px-8">
              <LeituraAutosPanel />
            </div>
          )}

          {/* VIEW ESCUDO EDGE AI: INGESTÃO MULTIMODAL & OCR */}
          {currentTab === 'escudo_edge' && (
            <div className="py-2">
              <EscudoEdgeView
                isProcessing={isProcessing}
                onIngestComplete={handleMultimodalIngest}
              />
            </div>
          )}

          {/* VIEW SPLIT DE PAGAMENTO API: GOV & BAAS */}
          {currentTab === 'split_api' && (
            <div className="py-2">
              <GovernmentAndBaasHub
                tenantProfile={currentTenant}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

          {/* VIEW WEBHOOKS INSPECTOR: AUDITORIA DE CARGAS ÚTEIS */}
          {currentTab === 'webhooks' && (
            <div className="py-2">
              <WebhooksInspectorView
                tenantProfile={currentTenant}
              />
            </div>
          )}

          {/* VIEW AST JSON: ZERO-GUI DECISION CARD & ÁRVORE SINTÁTICA */}
          {currentTab === 'ast_json' && (
            <div className="py-2">
              <AstJsonView
                ast={ast}
                onApproveMultiSig={() => ast && handleApproveMultiSig(ast)}
                onAdjustParameters={(p) => handleAdjustParameters(typeof p === 'string' ? p : JSON.stringify(p))}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* VIEW LLM ENGINE: ORQUESTRAÇÃO DE MODELOS FUNDACIONAIS */}
          {/* ─── P17 · CENTRAL ENTERPRISE · CONFIANÇA (hub + deep-link por ferramenta) ─── */}
          {(currentTab === 'ent_hub' || isEnterpriseToolId(currentTab)) && (
            <div className="py-2">
              <EnterpriseHubView key={currentTab} initialTool={isEnterpriseToolId(currentTab) ? currentTab : null} />
            </div>
          )}


          {currentTab === 'llm_engine' && (
            <div className="py-2">
              <ModuleTabsShell baseLabel="Modelo ativo" tabs={[{ id: 'guardrail', label: 'Guardrail anti-alucinação', render: () => <GuardrailPanel /> }, { id: 'zdr', label: 'Confidencialidade & ZDR', render: () => <ZdrPanel /> }]}>
              <LlmEngineView
                activeEngine={(governanceSettings as any)?.activeEngine || 'Gemini 3.7 Flash'}
              />
              </ModuleTabsShell>
            </div>
          )}

          {/* VIEW OBSERVABILIDADE: EVENT STREAM & APRENDIZADO */}
          {currentTab === 'observability' && (
            <div className="py-2">
              <ObservabilityView
                currentEvent={currentEvent}
                onSelectScenario={handleSelectScenario}
                onSubmitCustomEvent={handleSubmitCustomEvent}
                isProcessing={isProcessing}
                language={language}
                currency={currency}
                onOpenDiagnosisSimulator={() => setCurrentTab('risk_engine_diagnosis')}
                learnedPreferences={learnedPreferences}
                onResetPreferences={() => setLearnedPreferences([])}
              />
            </div>
          )}

          {/* VIEW NEURAL CORE: NÚCLEO CIBERNÉTICO & SWARM HUB */}
          {currentTab === 'neural_core' && (
            <div className="py-2">
              <NeuralCoreView
                tenantProfile={currentTenant}
                governanceSettings={governanceSettings}
                knowledgeGraph={graph}
                onAddAuditRecord={handleAddAuditRecord}
                onNavigateTab={setCurrentTab}
              />
            </div>
          )}

          {/* VIEW 0.25: CÉREBRO DO ENXAME DE AGENTES AUTÔNOMOS (VELATRIX AOS) */}
          {currentTab === 'autonomous_swarm_brain' && (
            <div className="py-2">
              <AutonomousSwarmHub
                tenantProfile={currentTenant}
                governanceSettings={governanceSettings}
                knowledgeGraph={graph}
                onAddAuditRecord={handleAddAuditRecord}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

          {/* VIEW DRE WATERFALL: CASCATA DRE COMPLETA & SEGREGAÇÃO EXTRAORDINÁRIA */}
          {currentTab === 'dre_waterfall' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8 space-y-4">
              <DetailedDreWaterfallCard
                currency={currency}
                language={language}
                companyName={currentTenant?.name}
                onAddAuditRecord={handleAddAuditRecord}
                onOpenFullView={() => setCurrentTab('dre_waterfall')}
              />
            </div>
          )}

          {/* VIEW 0.3: ROADMAP DE LANÇAMENTO & EXECUÇÃO [FASE 1 ──► FASE 2] */}
          {currentTab === 'roadmap_rollout_hub' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8">
              <AosRoadmapRolloutHub
                tenantProfile={currentTenant}
                currency={currency}
                fiscalJurisdiction={governanceSettings.fiscalJurisdiction}
                onNavigateTab={setCurrentTab}
                onAddAuditRecord={handleAddAuditRecord}
              />
            </div>
          )}

          {/* VIEW 0.4A: ORÁCULO DE PREVISIBILIDADE CONTRAFACTUAL (MONTE CARLO D+24) */}
          {currentTab === 'counterfactual_oracle' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8">
              <CounterfactualOraclePanel
                tenantProfile={currentTenant}
                currency={currency}
                fiscalJurisdiction={governanceSettings.fiscalJurisdiction}
                onAddAuditRecord={handleAddAuditRecord}
              />
            </div>
          )}

          {/* VIEW 0.4B: CONSTRUCT LAB (AGENT TRAINING STUDIO NO-CODE) */}
          {currentTab === 'construct_lab' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8">
              <ConstructLabPanel
                tenantProfile={currentTenant}
                onAddAuditRecord={handleAddAuditRecord}
              />
            </div>
          )}

          {/* VIEW 0.4C: MODO DÉJÀ VU (DETECÇÃO DE INTRUSÃO & ANOMALIAS DUPLICADAS) */}
          {currentTab === 'deja_vu_detection' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8">
              <DejaVuIntrusionPanel
                tenantProfile={currentTenant}
                onAddAuditRecord={handleAddAuditRecord}
              />
            </div>
          )}

          {/* VIEW 0.4D: PAINEL DE DEFESA & RECUPERAÇÃO FISCAL JURÍDICA (PGFN / 5 ANOS / SISBAJUD) */}
          {currentTab === 'legal_tax_recovery' && (
            <div className="py-2">
              <EsteiraShell esteira="RECUPERACAO_TRIBUTARIA">
              <LegalTaxRecoveryPanel
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateToOracle={() => setCurrentTab('counterfactual_oracle')}
                onNavigateTab={setCurrentTab}
                onAddAuditRecord={handleAddAuditRecord}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW 0.4D-2: MÓDULO INSS-OBRAS (CONSTRUÇÃO CIVIL & OBRAS PESADAS - LEI 8.212/91 & IN 2.110/22) */}
          {currentTab === 'inss_obras' && (
            <div className="py-2">
              <EsteiraShell esteira="INSS_OBRAS">
              <InssObrasPanel
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateTab={setCurrentTab}
                onAddAuditRecord={handleAddAuditRecord}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW 0.4D-3: CENTRAL DE LAUDOS E AUDITORIA PADRONIZADA (RISCO & ROI, CYBERSPY, FISCAL) */}
          {currentTab === 'central_laudos' && (
            <div className="py-2">
              <ModuleTabsShell baseLabel="Laudos" tabs={[{ id: 'verificar', label: 'Verificar autenticidade', render: () => <VerifySealPanel /> }]}>
              <CentralAuditReportsView
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateToTab={(tab) => setCurrentTab(tab as NavigationTab)}
              />
              </ModuleTabsShell>
            </div>
          )}

          {/* VIEW 0.4D-4: CENTRAL DE ESTEIRAS MULTI-SEGMENTO & OPERAÇÃO DE LAUDOS OFICIAIS */}
          {currentTab === 'esteiras_laudos_hub' && (
            <div className="py-4 max-w-7xl w-full mx-auto px-4 lg:px-8">
              <PipelineHubView
                  onOpenModule={(tab) => setCurrentTab(tab)}
                tenantId={currentTenant.id}
                tenantName={currentTenant.name}
                tenantCnpj={currentTenant.cnpj}
                onOpenReport={(rep) => {
                  CentralAuditReportService.saveReport(rep);
                }}
              />
            </div>
          )}

          {/* VIEW 0.4E: PORTAL DE PARCEIROS & SPLIT TRIBUTÁRIO (ISOLADO / RBAC PARCEIRO) */}
          {currentTab === 'partner_portal' && (
            <div className="py-2">
              <PartnerPortalView
                onBackToDashboard={() => setCurrentTab(getDefaultTab())}
                onNavigateTab={setCurrentTab}
                onAddAuditRecord={handleAddAuditRecord}
              />
            </div>
          )}

          {/* VIEW 0.5: CENTRAL DE TRABALHO / SAÚDE DO GRAFO AOS (HEARTBEAT & INGESTÃO D+0) */}
          {currentTab === 'graph_health_workspace' && (
            <div className="py-2">
              <GraphHealthWorkspace
                tenantProfile={currentTenant}
                graph={graph}
                language={language}
                currency={currency}
                onNavigateToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateToErpConnector={() => setCurrentTab('erp_connector_config')}
              />
            </div>
          )}

          {/* VIEW 0.8 & VIEW 1: DIAGNÓSTICO INTEGRAL & PROPOSTA AOS (UNIFICADO) */}
          {(currentTab === 'express_diagnosis' || currentTab === 'risk_engine_diagnosis') && (
            <div className="py-2">
              <EsteiraShell esteira="DIAGNOSTICO">
              <UnifiedDiagnosisView
                language={language}
                currency={currency}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateTab={setCurrentTab}
                onAddAuditRecord={handleAddAuditRecord}
                onInjectScenario={handleInjectScenarioByName}
              />
              </EsteiraShell>
            </div>
          )}

          {/* VIEW 1.5: CONFIGURAÇÃO DE CONECTOR ERP & WEBHOOK GATEWAY */}
          {currentTab === 'erp_connector_config' && (
            <div className="py-2">
              <ModuleTabsShell baseLabel="Conectores ERP & Webhook" tabs={[{ id: 'connect', label: 'Velatrix Connect · Saúde', render: () => <ConnectHealthPanel /> }]}>
              <ErpConnectorConfig
                tenantProfile={currentTenant}
                language={language}
                currency={currency}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onOpenVectorStore={() => setCurrentTab('vector_knowledge_store')}
                onInjectTestScenario={(scenarioName) => {
                  handleInjectScenarioByName(scenarioName);
                  setCurrentTab('operational_dashboard');
                }}
              />
              </ModuleTabsShell>
            </div>
          )}

          {/* VIEW 1.7: BARRAMENTO VETORIAL RAG & INJEÇÃO DE CONTEXTO */}
          {currentTab === 'vector_knowledge_store' && (
            <div className="py-2">
              <VectorKnowledgeStoreView
                tenantProfile={currentTenant}
                language={language}
                currency={currency}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

          {/* VIEW 2: ONBOARDING WIZARD VIEW (With TOTVS, Linx, Senior, Bling, SAP) */}
          {currentTab === 'onboarding_wizard' && (
            <div className="py-6">
              <OnboardingWizard
                onCompleteOnboarding={handleCompleteOnboarding}
                onCancel={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

          {/* VIEW 3: GOVERNANCE & RISK PANEL (SUPER-ADMIN & TENANT-ADMIN) */}
          {currentTab === 'governance_settings' && (
            currentUserRole === 'super_admin' ? (
              <div className="py-2">
                <SuperAdminDashboard
                  onReturnToTenant={() => setCurrentTab('operational_dashboard')}
                  initialGovernanceSettings={governanceSettings}
                  onSaveGovernanceSettings={handleSaveGovernance}
                  language={language}
                  currency={currency}
                  fiscalJurisdiction={governanceSettings.fiscalJurisdiction}
                  onChangeJurisdiction={(jur) => setGovernanceSettings(prev => ({ ...prev, fiscalJurisdiction: jur }))}
                  onAddAuditRecord={handleAddAuditRecord}
                />
              </div>
            ) : currentUserRole === 'tenant_admin' ? (
              <div className="py-2 max-w-7xl mx-auto px-4 lg:px-8">
                <GovernancePanel
                  initialSettings={governanceSettings}
                  onSaveSettings={handleSaveGovernance}
                  onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                  language={language}
                  currency={currency}
                  fiscalJurisdiction={governanceSettings.fiscalJurisdiction}
                  onChangeJurisdiction={(jur) => setGovernanceSettings(prev => ({ ...prev, fiscalJurisdiction: jur }))}
                  onAddAuditRecord={handleAddAuditRecord}
                  onNavigateTab={setCurrentTab}
                />
              </div>
            ) : (
              <div className="py-6 max-w-xl mx-auto text-center space-y-3">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-300 text-xs">
                  Acesso ao Painel de Governança & Gestão de Membros é restrito exclusivamente aos papéis Super-Admin e Administrador do Tenant.
                </div>
                <button
                  onClick={() => setCurrentTab(getDefaultTab())}
                  className="px-4 py-2 bg-[var(--vx-neon)] text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Voltar à Minha Área Homologada
                </button>
              </div>
            )
          )}

          {/* VIEW CONFIGURAÇÕES DE APIS: COFRE DE INTEGRAÇÕES ZERO-TRUST */}
          {currentTab === 'api_keys_config' && (
            <div className="py-2">
              <ApiKeysConfigView
                tenantProfile={currentTenant}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
                onNavigateToTab={(tab) => setCurrentTab(tab as NavigationTab)}
              />
            </div>
          )}

          {/* VIEW 3.8: ARQUITETURA & ENGENHARIA (END-TO-END PIPELINE) */}
          {currentTab === 'architecture_engineering' && (
            <main className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30 text-[var(--vx-neon)]">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                      Arquitetura & Engenharia do AOS
                    </h1>
                    <p className="text-xs text-slate-400 font-mono">
                      Fluxo Operacional de Ponta a Ponta (FastAPI, pgvector 768-dim, AST JSON & Gemini 3.7 Flash)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('operational_dashboard')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                >
                  ← Voltar ao Dashboard
                </button>
              </div>

              <AutonomousPipelineFlow
                onOpenVectorStore={() => setCurrentTab('vector_knowledge_store')}
                onOpenAstViewer={() => setIsAstModalOpen(true)}
                onOpenErpConfig={() => setCurrentTab('erp_connector_config')}
              />
            </main>
          )}

          {/* VIEW 4: AUDIT TRAIL / LEDGER FULL VIEW */}
          {currentTab === 'audit_ledger_view' && (
            <div className="py-6">
              <AuditTrailView
                records={auditRecords}
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

        {/* SUPER ADMIN · ANALYTICS DE USO AO VIVO (somente super_admin) */}
        {currentTab === 'admin_analytics' && isSuperAdmin && (
          <div className="py-2">
            <AdminAnalyticsPanel />
          </div>
        )}

          {/* VIEW 4.5: SUPER-ADMIN VELATRIX DASHBOARD (MULTI-TENANT GOVERNANCE) */}
          {currentTab === 'super_admin' && (
            <div className="py-2">
              <SuperAdminDashboard
                onReturnToTenant={() => setCurrentTab('operational_dashboard')}
                initialGovernanceSettings={governanceSettings}
                onSaveGovernanceSettings={handleSaveGovernance}
                language={language}
                currency={currency}
                fiscalJurisdiction={governanceSettings.fiscalJurisdiction}
                onChangeJurisdiction={(jur) => setGovernanceSettings(prev => ({ ...prev, fiscalJurisdiction: jur }))}
              />
            </div>
          )}

          {/* VIEW 4.8: ESCRITÓRIO VELATRIX (GESTÃO INTERNA MULTI-PAPÉIS) */}
          {currentTab === 'velatrix_office' && (
            <div className="py-2">
              <VelatrixOfficeDashboard
                onNavigateToSuperAdminTenantManager={() => setCurrentTab('super_admin')}
              />
            </div>
          )}

          {/* VIEW 4.9: GPS & TELEMETRIA LOGÍSTICA (MAPA COMPLETO & CENTRO DE CONTROLE) */}
          {currentTab === 'gps_telemetry' && (
            <div className="py-2">
              <GpsTelemetryDashboard
                onBackToDashboard={() => setCurrentTab('operational_dashboard')}
              />
            </div>
          )}

          {/* VIEW 5: OPERATIONAL DASHBOARD (MAIN ZERO-GUI VIEW) */}
          {currentTab === 'operational_dashboard' && (
            <div className="py-2">
              <VelatrixHomeView onNavigate={(tab) => setCurrentTab(tab)} />
            </div>
          )}

          {/* Painel técnico antigo (antigo Início): disponível no Super Admin */}
          {currentTab === 'legacy_dashboard' && (() => {
            const currentSeverity = ast?.tension_analysis?.severity || currentEvent?.severity || 'Nominal';
            const hasViolations = (ast?.invariants_checked || []).some(inv => typeof inv === 'string' && (inv.includes('VIOLADA') || inv.includes('FALHA') || inv.includes('SUSPECTED')));
            
            let currentZScore = 3.45;
            let currentSangria = 0;
            let currentCashFlow = 4850000;

            if (currentSeverity === 'Critical' || hasViolations) {
              currentZScore = 1.48;
              currentSangria = 420000;
              currentCashFlow = 1920000;
            } else if (currentSeverity === 'High') {
              currentZScore = 2.42;
              currentSangria = 85000;
              currentCashFlow = 3280000;
            } else if (currentSeverity === 'Medium') {
              currentZScore = 2.85;
              currentSangria = 22000;
              currentCashFlow = 4100000;
            }

            return (
              <main className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
                
                {/* Section Hero: Cérebro Cibernético 3D Velatrix AOS com HUDs Flutuantes */}
                <VelatrixAosHeroCyberBrain
                  onNavigate={(tab) => setCurrentTab(tab)}
                  activeTab={currentTab}
                />

                {/* Section 0: Jornada do AOS (Visual Pipeline Compacto de 6 Etapas) */}
                <AosJourneyStepper
                  isProcessing={isProcessing}
                  language={language}
                />

                {/* Section 0.2: Roadmap Rollout Quick Bar [FASE 1: GO-LIVE HOJE] ──► [FASE 2: UPDATE V2.0] */}
                <div 
                  onClick={() => setCurrentTab('roadmap_rollout_hub')}
                  className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-cyan-500/50 shadow-lg cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-200 font-mono uppercase tracking-tight">
                          [FASE 1: GO-LIVE HOJE] ──► [FASE 2: UPDATE V2.0]
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                          PROD LIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        • <strong className="text-slate-200">Fase 1:</strong> ZeroVision Digital (PIX/ERP Lock) & Alerta Fail-Safe WhatsApp &nbsp;|&nbsp; • <strong className="text-slate-200">Fase 2:</strong> C-Level Panic Lockdown (SOS) & OCR Canhotos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-cyan-400 group-hover:underline flex items-center gap-1">
                      Simular & Explorar Fases ➔
                    </span>
                  </div>
                </div>

                {/* Section 0.3: Quick Tools Launcher (Oráculo, Construct Lab, Modo Déjà Vu, Defesa Fiscal) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Tool 0: Defesa & Recuperação Fiscal Jurídica */}
                  <div 
                    onClick={() => setCurrentTab('legal_tax_recovery')}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:scale-105 transition-transform">
                        <Scale className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        R$ 1.84M 5 Anos
                      </span>
                    </div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300 transition-colors">
                      Defesa & Recuperação Fiscal
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      Créditos retroativos (Tema 69/118), Transação PGFN (65% desconto) e Blindagem Sisbajud.
                    </p>
                  </div>

                  {/* Tool 1: Oráculo Contrafactual */}
                  <div 
                    onClick={() => setCurrentTab('counterfactual_oracle')}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        Monte Carlo 10k
                      </span>
                    </div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300 transition-colors">
                      Oráculo Contrafactual
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      Simule o impacto de 50 contratações, frota elétrica ou empréstimo no Z-Score e fluxo D+24.
                    </p>
                  </div>

                  {/* Tool 2: Construct Lab */}
                  <div 
                    onClick={() => setCurrentTab('construct_lab')}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 group-hover:scale-105 transition-transform">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        No-Code Trainer
                      </span>
                    </div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300 transition-colors">
                      Construct Lab
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      Digite regras de negócio em português natural e implante novos agentes no Enxame em segundos.
                    </p>
                  </div>

                  {/* Tool 3: Modo Déjà Vu */}
                  <div 
                    onClick={() => setCurrentTab('deja_vu_detection')}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 group-hover:scale-105 transition-transform">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                        Glitch D+0
                      </span>
                    </div>
                    <strong className="text-xs font-bold text-slate-200 block group-hover:text-rose-300 transition-colors">
                      Modo Déjà Vu
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                      Detecção de notas espelho, telemetria GPS quântica impossível e boletos com linha adulterada.
                    </p>
                  </div>

                </div>

                {/* Section 1: Event Stream & Injector Bar (With OCR & File Upload) */}
                <EventStreamBar
                  currentEvent={currentEvent}
                  onSelectScenario={handleSelectScenario}
                  onSubmitCustomEvent={handleSubmitCustomEvent}
                  isProcessing={isProcessing}
                  language={language}
                  currency={currency}
                  onOpenDiagnosisSimulator={() => setCurrentTab('risk_engine_diagnosis')}
                />

                {/* Section 1.5: Executive Financial Status Card (Altman Z-Score & Sangria) */}
                <ExecutiveStatusCard
                  zScore={currentZScore}
                  cashFlow={currentCashFlow}
                  sangriaTotal={currentSangria}
                  protectedCapital={1250000}
                  capitalDeltaMonth={12}
                  netMarginPct={18.4}
                  tenantName={currentTenant?.name || 'Indústria X'}
                  currency={currency}
                  language={language}
                  onNavigateToDiagnosis={() => setCurrentTab('risk_engine_diagnosis')}
                  onNavigateToGraphHealth={() => setCurrentTab('graph_health_workspace')}
                />

                {/* Section 1.6: Cascata DRE Completa & Análise Vertical com Segregação Extraordinária */}
                <DetailedDreWaterfallCard
                  currency={currency}
                  language={language}
                  companyName={currentTenant?.name}
                  onAddAuditRecord={handleAddAuditRecord}
                  onOpenFullView={() => setCurrentTab('dre_waterfall')}
                />

                {/* Section 1.7: Módulo PGFN/CAPAG (Transação Excepcional de Dívida Ativa) */}
                <PgfnCapagDiagnosisCard
                  currency={currency}
                  language={language}
                  companyName={currentTenant.name}
                  cnpj={currentTenant.cnpj}
                  onAddAuditRecord={handleAddAuditRecord}
                  onNavigateToTaxRecovery={() => setCurrentTab('legal_tax_recovery')}
                />

                {/* Section 1.75: Motor de Contrato da Lei do Salão Parceiro (Lei 13.352/2016) */}
                <SalaoParceiroContractCard
                  currency={currency}
                  language={language}
                  onAddAuditRecord={handleAddAuditRecord}
                />

                {/* Section 1.8: Motor de Eficiência Operacional Auto-Induzido (Princípio de Tesla) */}
                <TeslaAutoInductionEngineCard
                  tenantProfile={currentTenant}
                  currency={currency}
                  language={language}
                  onAddAuditRecord={handleAddAuditRecord}
                  onNavigateToDejavu={() => setCurrentTab('deja_vu_detection')}
                />

                {/* Section 2: Zero-GUI On-Demand Decision Card (Highest Priority) */}
                <ZeroGuiCardRenderer
                  ast={ast}
                  onApproveMultiSig={handleApproveMultiSig}
                  onAdjustParameters={handleAdjustParameters}
                  isProcessing={isProcessing}
                />

                {/* Section 2.5: Diagnóstico Express (Camada Mínima de Dados D+0) */}
                <ExpressDiagnosisCard
                  onOpenFullExpressDiagnosis={() => setCurrentTab('express_diagnosis')}
                  language={language}
                  currency={currency}
                />

                {/* Section 3: GPS & Telemetria Logística (Card Compacto com Abertura Sob Demanda) */}
                <GpsTelemetryCard
                  onOpenFullView={() => setCurrentTab('gps_telemetry')}
                />

                {/* Section 4: Module 7 - Edge Multimodal Ingestion (OCR Borda / Boletos / NF-e / WhatsApp) */}
                <EdgeMultimodalIngestion
                  onIngestComplete={handleMultimodalIngest}
                  isProcessing={isProcessing}
                />

                {/* Section 5: Module 6 - Feedback Loop & Continuous Business Learning */}
                <FeedbackLoopManager
                  preferences={learnedPreferences}
                  onResetPreferences={() => setLearnedPreferences([])}
                />

                {/* Section 6: Semantic Knowledge Graph & Agent Swarm Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Semantic Knowledge Graph (Live State of Company) */}
                  <div className="lg:col-span-6 flex flex-col">
                    <SemanticGraphViewer
                      graph={graph}
                      isProcessing={isProcessing}
                      onRefreshGraph={() => handleSelectScenario(PRESET_SCENARIOS[0])}
                      onSimulateTension={handleSimulateTension}
                      onSelectNodeEvent={(node) => {
                        showToast(`Nó [${node.nodeCode || node.label}] selecionado. Telemetria: ${node.metricValue}`);
                      }}
                    />
                  </div>

                  {/* Parallel Agentic Swarm Deliberation Room */}
                  <div className="lg:col-span-6 flex flex-col">
                    <AgentSwarmDeliberation
                      swarm={swarm}
                      isProcessing={isProcessing}
                    />
                  </div>

                </div>

              </main>
            );
          })()}

        </Suspense>
        </div>

      {/* AST JSON Inspector Modal */}
      {isAstModalOpen && (
        <AstJsonInspector
          ast={ast}
          onClose={() => setIsAstModalOpen(false)}
        />
      )}

      {/* Audit Ledger Modal (Quick access) */}
      {isAuditModalOpen && (
        <AuditLedger
          records={auditRecords}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}

      {/* Global Ask AOS Omnibar / Cross-Domain Search Modal */}
      {isAskAosModalOpen && (
        <AskAosModal
          isOpen={isAskAosModalOpen}
          onClose={() => setIsAskAosModalOpen(false)}
          onNavigateTab={(tab) => {
            setCurrentTab(tab);
            setIsAskAosModalOpen(false);
          }}
        />
      )}

    </ConsoleShell>
  );
}
