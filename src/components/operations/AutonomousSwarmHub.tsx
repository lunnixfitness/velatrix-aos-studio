import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Network, 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Database, 
  Hash, 
  Play, 
  FileText, 
  Layers, 
  Activity, 
  Sparkles, 
  Scale, 
  DollarSign, 
  Lock, 
  KeyRound, 
  Copy, 
  Check, 
  SlidersHorizontal, 
  Server, 
  ExternalLink, 
  Thermometer, 
  Truck, 
  Ban, 
  Flame, 
  Filter, 
  Download, 
  Info,
  ArrowRight,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { 
  AutonomousAgentId, 
  AutonomousWorkerStatus, 
  ErpCommunicationRoute, 
  SwarmLiveLog, 
  DeadLetterQueueItem, 
  StressTestScenario,
  PipelinePhase,
  StrategicHub,
  RouterDispatchResult
} from '../../types/autonomousSwarm';
import { authFetch as fetch } from '../../services/authClient';
import { 
  STRATEGIC_HUBS, 
  ALL_300_MICRO_AGENTS 
} from '../../data/swarmHubsCatalog';
import { fetchStrategicHubs } from '../../services/dataService';
import { swarmRouter } from '../../services/swarmRouterService';
import { StrategicHubDetailModal } from './StrategicHubDetailModal';
import { SwarmEventRouterSimulatorModal } from './SwarmEventRouterSimulatorModal';
import { PgfnCapagDiagnosisCard } from './PgfnCapagDiagnosisCard';
import { SalaoParceiroContractCard } from './SalaoParceiroContractCard';
import { 
  INITIAL_AUTONOMOUS_WORKERS, 
  ERP_COMMUNICATION_ROUTES, 
  INITIAL_SWARM_LOGS, 
  SWARM_STRESS_SCENARIOS, 
  INITIAL_DEAD_LETTER_QUEUE, 
  runAutonomousPipeline, 
  getCurrentTimeFormatted,
  PipelineExecutionResult
} from '../../services/autonomousSwarmService';
import { GovernanceSettings, EnterpriseKnowledgeGraph, TenantProfile, SupportedLanguage, SupportedCurrency } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { GENESIS_HASH } from '../../utils/auditChain';
import { hashCanonical } from '../../shared/crypto/hash';

interface AutonomousSwarmHubProps {
  tenantProfile?: TenantProfile;
  governanceSettings?: GovernanceSettings;
  knowledgeGraph?: EnterpriseKnowledgeGraph;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onRecordAudit?: (receipt: string, summary: string, hash: string) => void;
  onAddAuditRecord?: (record: any) => void;
  onBackToDashboard?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

type SwarmSubTab = 'workers' | 'specialized_legal' | 'erp_routes' | 'stress_tests' | 'live_logs' | 'dlq';

const DEFAULT_GOVERNANCE_SETTINGS: GovernanceSettings = {
  maxAutonomousBudgetBrl: 25000,
  multiSigQuorumCount: 2,
  strictProofOfIntent: true,
  autoQuarantineSuspiciousEvents: true,
  fiscalJurisdiction: 'BR',
  approvers: [
    { id: 'appr_1', roleName: 'CEO / Diretoria Executiva', holderName: 'Diretoria Executiva', email: 'c-level@velatrix.com', keyId: '0xCE01...889A', requiredForCritical: true, active: true },
    { id: 'appr_2', roleName: 'CFO / Diretoria Financeira', holderName: 'Diretoria Financeira', email: 'cfo@velatrix.com', keyId: '0xCF02...441B', requiredForCritical: true, active: true }
  ],
  invariants: []
};

export const AutonomousSwarmHub: React.FC<AutonomousSwarmHubProps> = ({
  tenantProfile,
  governanceSettings = DEFAULT_GOVERNANCE_SETTINGS,
  knowledgeGraph,
  language = 'pt',
  currency = 'BRL',
  onRecordAudit,
  onAddAuditRecord,
  onBackToDashboard,
  onNavigateToTab
}) => {
  // State
  const [activeSubTab, setActiveSubTab] = useState<SwarmSubTab>('workers');
  const [workers, setWorkers] = useState<AutonomousWorkerStatus[]>(INITIAL_AUTONOMOUS_WORKERS);
  const [logs, setLogs] = useState<SwarmLiveLog[]>(INITIAL_SWARM_LOGS);
  const [dlqItems, setDlqItems] = useState<DeadLetterQueueItem[]>(INITIAL_DEAD_LETTER_QUEUE);
  const [selectedRouteAgent, setSelectedRouteAgent] = useState<AutonomousAgentId>('agent-fiscal');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [replayingItemId, setReplayingItemId] = useState<string | null>(null);
  const [isReplayingAll, setIsReplayingAll] = useState(false);

  // Filter state for live logs
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchLogQuery, setSearchLogQuery] = useState<string>('');

  // Stress test execution modal / dialog
  const [runningScenario, setRunningScenario] = useState<StressTestScenario | null>(null);
  const [executionResult, setExecutionResult] = useState<PipelineExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulateDlqFailure, setSimulateDlqFailure] = useState(false);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);

  // Multi-Sig manual signing dialog
  const [multiSigPendingResult, setMultiSigPendingResult] = useState<PipelineExecutionResult | null>(null);
  const [signaturesCollected, setSignaturesCollected] = useState<{ role: string; name: string; signedAt: string; hash: string }[]>([]);

  // 8 Strategic Hubs & Router Simulation State (300 Autonomous Agents)
  const [selectedHubForDetail, setSelectedHubForDetail] = useState<StrategicHub | null>(null);
  const [showRouterSimulator, setShowRouterSimulator] = useState<boolean>(false);
  const [hubViewMode, setHubViewMode] = useState<'8_HUBS' | 'CORE_6_WORKERS'>('8_HUBS');
  const [hubs, setHubs] = useState<StrategicHub[]>(STRATEGIC_HUBS);

  // Initial sync with backend DLQ and real-time SSE listener
  useEffect(() => {
    // 0. Fetch Strategic Hubs from persistent repository foundation
    fetchStrategicHubs()
      .then(fetchedHubs => {
        if (fetchedHubs && fetchedHubs.length > 0) {
          setHubs(fetchedHubs);
        }
      })
      .catch(err => console.warn('[Swarm] Falha ao sincronizar Hubs:', err));

    // 1. Fetch initial DLQ status from server
    fetch('/api/v1/swarm/dlq')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.items)) {
          setDlqItems(data.items);
        }
      })
      .catch(err => console.warn('[Swarm] Falha ao carregar DLQ do servidor:', err));

    // 2. Fetch recent Swarm logs from server
    fetch('/api/v1/swarm/logs?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
          setLogs(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newLogs = data.logs.filter((l: SwarmLiveLog) => !existingIds.has(l.id));
            return [...newLogs, ...prev];
          });
        }
      })
      .catch(err => console.warn('[Swarm] Falha ao carregar logs do servidor:', err));

    // 3. Connect to real-time SSE stream for Swarm Live Logs & DLQ updates
    const eventSource = new EventSource('/api/v1/swarm/logs/stream');

    eventSource.addEventListener('swarm_log', (event: MessageEvent) => {
      try {
        const incomingLog: SwarmLiveLog = JSON.parse(event.data);
        setLogs(prev => {
          if (prev.some(l => l.id === incomingLog.id)) {
            return prev.map(l => l.id === incomingLog.id ? incomingLog : l);
          }
          return [incomingLog, ...prev];
        });

        if (onRecordAudit && incomingLog.erpEndpoint) {
          onRecordAudit(
            incomingLog.erpEndpoint,
            incomingLog.rawFormattedLog,
            incomingLog.ledgerHash
          );
        }
      } catch (err) {
        console.warn('[Swarm SSE] Erro ao processar swarm_log:', err);
      }
    });

    eventSource.addEventListener('dlq_update', (event: MessageEvent) => {
      try {
        const updatedItem: DeadLetterQueueItem = JSON.parse(event.data);
        setDlqItems(prev => {
          const idx = prev.findIndex(i => i.id === updatedItem.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedItem;
            return copy;
          }
          return [updatedItem, ...prev];
        });
      } catch (err) {
        console.warn('[Swarm SSE] Erro ao processar dlq_update:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [onRecordAudit]);

  const handleRouterDispatchResult = (dispatchResult: RouterDispatchResult) => {
    const liveLog = swarmRouter.toSwarmLiveLog(dispatchResult);
    setLogs(prev => [liveLog, ...prev]);

    setHubs(prev => prev.map(h => {
      if (h.id === dispatchResult.routedHubId) {
        return {
          ...h,
          eventsProcessedCount: h.eventsProcessedCount + 1,
          totalEconomyBrl: h.totalEconomyBrl + (dispatchResult.economyGeneratedBrl || 0),
          totalBleedMitigatedBrl: h.totalBleedMitigatedBrl + (dispatchResult.bleedPreventedBrl || 0)
        };
      }
      return h;
    }));

    if (onRecordAudit) {
      onRecordAudit(
        dispatchResult.erpEndpoint || 'SWARM_ROUTER_DISPATCH',
        dispatchResult.formattedLiveLog,
        dispatchResult.ledgerHash
      );
    }
  };

  // Computed Totals (incorporating 8 Hubs or 6 Core Workers depending on view)
  const totalEconomy = useMemo(() => {
    const workersSum = workers.reduce((acc, w) => acc + w.generatedEconomyBrl, 0);
    const hubsSum = hubs.reduce((acc, h) => acc + h.totalEconomyBrl, 0);
    return hubViewMode === '8_HUBS' ? hubsSum : workersSum;
  }, [workers, hubs, hubViewMode]);

  const totalBleedMitigated = useMemo(() => {
    const workersSum = workers.reduce((acc, w) => acc + w.mitigatedBleedBrl, 0);
    const hubsSum = hubs.reduce((acc, h) => acc + h.totalBleedMitigatedBrl, 0);
    return hubViewMode === '8_HUBS' ? hubsSum : workersSum;
  }, [workers, hubs, hubViewMode]);

  const totalEventsProcessed = useMemo(() => {
    const workersSum = workers.reduce((acc, w) => acc + w.processedEventsCount, 0);
    const hubsSum = hubs.reduce((acc, h) => acc + h.eventsProcessedCount, 0);
    return hubViewMode === '8_HUBS' ? hubsSum : workersSum;
  }, [workers, hubs, hubViewMode]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAgent !== 'all') {
        const matchesAgent = log.agentId === filterAgent;
        const matchesHub = log.routedHubId === filterAgent;
        if (!matchesAgent && !matchesHub) return false;
      }
      if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
      if (searchLogQuery) {
        const q = searchLogQuery.toLowerCase();
        return (
          log.rawFormattedLog.toLowerCase().includes(q) ||
          log.targetEntity.toLowerCase().includes(q) ||
          log.ledgerHash.toLowerCase().includes(q) ||
          log.resultSummary.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filterAgent, filterSeverity, searchLogQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Run a stress test through the 6-stage pipeline
  const handleTriggerStressTest = async (scenario: StressTestScenario) => {
    setRunningScenario(scenario);
    setIsExecuting(true);
    setActivePipelineStep(1); // EVENT_INGESTION
    setExecutionResult(null);

    // Get current head hash from last log
    const lastHash = logs.length > 0 ? logs[0].ledgerHash : GENESIS_HASH;

    // Simulate animated pipeline step transitions
    await new Promise(r => setTimeout(r, 400));
    setActivePipelineStep(2); // GRAPH_CONSULT
    await new Promise(r => setTimeout(r, 450));
    setActivePipelineStep(3); // INVARIANTS_CHECK
    await new Promise(r => setTimeout(r, 450));
    setActivePipelineStep(4); // DELIBERATION_QUORUM
    await new Promise(r => setTimeout(r, 400));
    setActivePipelineStep(5); // AUTONOMOUS_EXECUTION
    await new Promise(r => setTimeout(r, 450));
    setActivePipelineStep(6); // IMMUTABLE_LEDGER

    const result = await runAutonomousPipeline(
      scenario,
      governanceSettings,
      knowledgeGraph || ({} as any),
      lastHash,
      simulateDlqFailure
    );

    setExecutionResult(result);
    setIsExecuting(false);

    // Update Logs
    setLogs(prev => [result.liveLog, ...prev]);

    // Broadcast log to backend SSE channel
    fetch('/api/v1/swarm/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.liveLog)
    }).catch(err => console.warn('Falha ao enviar log para servidor:', err));

    // If DLQ fallback
    if (result.status === 'FALLBACK_DLQ' && result.dlqItem) {
      setDlqItems(prev => [result.dlqItem!, ...prev.filter(i => i.id !== result.dlqItem!.id)]);
      // Envia para o agendador de backoff exponencial no servidor
      fetch('/api/v1/swarm/dlq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.dlqItem)
      }).catch(err => console.warn('Falha ao registrar item no agendador DLQ do servidor:', err));

      setWorkers(prev => prev.map(w => {
        if (w.agentId === scenario.agentId) {
          return {
            ...w,
            currentStatus: 'FALLBACK_DLQ',
            consecutiveErrors: w.consecutiveErrors + 1,
            lastReceipt: 'FALLBACK_DLQ_TIMEOUT_504',
            lastHeartbeat: 'Agora há pouco'
          };
        }
        return w;
      }));
    } else if (result.status === 'BLOCKED_HUMAN_IN_THE_LOOP') {
      setMultiSigPendingResult(result);
      setSignaturesCollected([
        {
          role: 'Autonomous Swarm Engine',
          name: 'Deliberação Quórum Pré-Aprovada',
          signedAt: new Date().toLocaleTimeString(),
          hash: result.ledgerHash.slice(0, 16)
        }
      ]);
      setWorkers(prev => prev.map(w => {
        if (w.agentId === scenario.agentId) {
          return {
            ...w,
            currentStatus: 'BLOCKED_HUMAN_IN_THE_LOOP',
            lastReceipt: 'AGUARDANDO_ASSINATURAS_MULTI_SIG',
            lastHeartbeat: 'Agora há pouco'
          };
        }
        return w;
      }));
    } else {
      // Success execution
      setWorkers(prev => prev.map(w => {
        if (w.agentId === scenario.agentId) {
          return {
            ...w,
            currentStatus: 'SUCCESS',
            processedEventsCount: w.processedEventsCount + 1,
            generatedEconomyBrl: w.generatedEconomyBrl + (scenario.expectedEconomyBrl || 0),
            mitigatedBleedBrl: w.mitigatedBleedBrl + (scenario.expectedBleedPreventedBrl || 0),
            lastReceipt: result.erpReceipt,
            lastHash: result.ledgerHash,
            lastHeartbeat: 'Agora há pouco',
            consecutiveErrors: 0
          };
        }
        return w;
      }));

      // Notify parent audit
      if (onRecordAudit) {
        onRecordAudit(result.erpReceipt, scenario.scenarioTitle, result.ledgerHash);
      }
    }
  };

  // Complete Multi-Sig Approval
  const handleApproveMultiSig = async () => {
    if (!multiSigPendingResult) return;

    const timeFormatted = getCurrentTimeFormatted();
    const currentHead = logs.length > 0 ? logs[0].ledgerHash : GENESIS_HASH;
    const approvalPayload = {
      prevHash: currentHead,
      type: 'MULTISIG_CHALLENGE_APPROVED_EXECUTION',
      scenarioTitle: multiSigPendingResult.scenarioTitle,
      agentId: multiSigPendingResult.agentId,
      quorumRequired: 2,
      approvers: signaturesCollected.length > 0 ? signaturesCollected : ['C-Level Operations Director (Key-0x71)', 'CFO / Treasury Master (Key-0x89)'],
      timestamp: new Date().toISOString()
    };
    const approvedHash = await hashCanonical(approvalPayload);

    const approvedLog: SwarmLiveLog = {
      id: `log_ms_approved_${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeFormatted,
      agentId: multiSigPendingResult.agentId,
      agentName: multiSigPendingResult.agentName,
      actionTitle: `Aprovação Multi-Sig Concluída: ${multiSigPendingResult.scenarioTitle}`,
      resultSummary: `Quórum de 2 assinaturas atingido (C-Level + CFO) | Ordem despachada ao ERP com sucesso`,
      rawFormattedLog: `${timeFormatted} [${multiSigPendingResult.agentName}] Ação realizada com sucesso | Ordem aprovada via Multi-Sig despachada ao ERP [STATUS_EXECUTADO]`,
      severity: 'SUCCESS',
      status: 'ORDEM_EXECUTADA',
      targetEntity: multiSigPendingResult.scenarioTitle,
      ledgerHash: approvedHash,
      previousLedgerHash: currentHead,
      erpResponseCode: 200,
      erpEndpoint: '/api/v1/erp/treasury/arbitrage-order'
    };

    setLogs(prev => [approvedLog, ...prev]);

    setWorkers(prev => prev.map(w => {
      if (w.agentId === multiSigPendingResult.agentId) {
        return {
          ...w,
          currentStatus: 'SUCCESS',
          processedEventsCount: w.processedEventsCount + 1,
          lastReceipt: 'ORDEM_MULTI_SIG_EXECUTADA_NO_ERP',
          lastHeartbeat: 'Agora há pouco'
        };
      }
      return w;
    }));

    if (onRecordAudit) {
      onRecordAudit(
        'ORDEM_MULTI_SIG_EXECUTADA_NO_ERP',
        `Aprovação Multi-Sig: ${multiSigPendingResult.scenarioTitle}`,
        approvedHash
      );
    }

    setMultiSigPendingResult(null);
    setSignaturesCollected([]);
  };

  // Replay manual de item da DLQ via endpoint real POST /api/v1/swarm/dlq/:id/retry
  const handleReplayDlqItem = async (item: DeadLetterQueueItem) => {
    setReplayingItemId(item.id);
    try {
      const res = await fetch(`/api/v1/swarm/dlq/${item.id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailure: false })
      });
      const data = await res.json();
      if (data.success && data.item) {
        setDlqItems(prev => prev.map(i => i.id === item.id ? data.item : i));
        if (data.liveLog) {
          setLogs(prev => {
            if (prev.some(l => l.id === data.liveLog.id)) {
              return prev.map(l => l.id === data.liveLog.id ? data.liveLog : l);
            }
            return [data.liveLog, ...prev];
          });
          if (onRecordAudit) {
            onRecordAudit(
              data.liveLog.erpEndpoint || item.endpoint,
              data.liveLog.rawFormattedLog,
              data.liveLog.ledgerHash
            );
          }
        }
      }
      setWorkers(prev => prev.map(w => {
        if (w.agentId === item.agentId) {
          return {
            ...w,
            currentStatus: 'SUCCESS',
            consecutiveErrors: Math.max(0, w.consecutiveErrors - 1),
            lastHeartbeat: 'Agora há pouco',
            lastReceipt: 'REPLAY_DLQ_CONFORME'
          };
        }
        return w;
      }));
    } catch (err) {
      console.error('Erro ao acionar replay manual da DLQ:', err);
    } finally {
      setReplayingItemId(null);
    }
  };

  // Replay manual em lote de todos os itens da DLQ via POST /api/v1/swarm/dlq/retry-all
  const handleReplayAllDlqItems = async () => {
    setIsReplayingAll(true);
    try {
      const res = await fetch('/api/v1/swarm/dlq/retry-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setDlqItems(data.items);
      }
    } catch (err) {
      console.error('Erro ao acionar replay total da DLQ:', err);
    } finally {
      setIsReplayingAll(false);
    }
  };

  const selectedRoute = useMemo(() => {
    return ERP_COMMUNICATION_ROUTES.find(r => r.agentId === selectedRouteAgent) || ERP_COMMUNICATION_ROUTES[0];
  }, [selectedRouteAgent]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 rounded-lg text-cyan-400">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    Cérebro Velatrix AOS: Enxame de Agentes Autônomos
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                    Swarm Intelligence
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    8 Hubs Estratégicos • 300 Agentes
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                  Arquitetura hierárquica escalável de sub-swarms roteados por barramento de eventos D+0. Orquestração em 4 etapas (Router Agent ➔ Hub Dispatcher ➔ Micro-Agent Serverless ➔ Ledger SHA-256) para até 300 trabalhadores especializados sem sobrecarga operacional.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-lg transition-all border border-slate-700 flex items-center gap-1.5"
              >
                ← Dashboard
              </button>
            )}
            <button
              onClick={() => setShowRouterSimulator(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-cyan-950/40 flex items-center gap-2 border border-cyan-400/30 active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              Simular Evento no Router Agent (300 Agentes)
            </button>
            <button
              onClick={() => {
                // Random stress test on agent-fiscal
                const fiscalScenario = SWARM_STRESS_SCENARIOS[0];
                handleTriggerStressTest(fiscalScenario);
              }}
              disabled={isExecuting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition-all border border-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              Teste de Estresse Rápido
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Economia Gerada Acumulada</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-emerald-400">
                {formatCurrency(totalEconomy, currency, language)}
              </span>
              <span className="text-[10px] text-emerald-500 font-medium">Auditado D+0</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Sangria Mitigada / Evitada</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-cyan-400">
                {formatCurrency(totalBleedMitigated, currency, language)}
              </span>
              <span className="text-[10px] text-cyan-500 font-medium">Anti-Fraude & Risco</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Total de Eventos Processados</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white font-mono">
                {totalEventsProcessed.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-slate-400">Transações no Barramento</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Dead Letter Queue (DLQ)</span>
              {dlqItems.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold font-mono ${dlqItems.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {dlqItems.length} {dlqItems.length === 1 ? 'evento' : 'eventos'}
              </span>
              <span className="text-[10px] text-slate-400">Backoff Exponencial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('workers')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'workers'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hubs & Trabalhadores do Enxame
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-[10px] rounded-full text-emerald-300 font-mono">
              8 Hubs • 300 Agentes
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('specialized_legal')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'specialized_legal'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            Serviços Jurídicos (PGFN &amp; Salão)
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-[10px] rounded-full text-emerald-300 font-mono font-bold">
              HUB-01 &amp; HUB-07
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('erp_routes')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'erp_routes'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Network className="w-4 h-4" />
            Rotas & Hooks de Comunicação ERP
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-[10px] rounded-full text-emerald-300">
              API REST
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('stress_tests')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'stress_tests'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4" />
            Testes de Estresse & Simulação
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-[10px] rounded-full text-amber-300">
              6 Cenários
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('live_logs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'live_logs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Logs (Feed Tempo Real)
            <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] rounded-full text-cyan-400 font-mono">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('dlq')}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'dlq'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            Dead Letter Queue (DLQ)
            {dlqItems.length > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-[10px] rounded-full text-slate-950 font-bold">
                {dlqItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick Ticker of Latest Log */}
        {logs.length > 0 && (
          <div className="hidden xl:flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg max-w-md truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-400 font-mono text-[11px] shrink-0">{logs[0].timeFormatted}</span>
            <span className="text-slate-300 truncate font-mono text-[11px]">{logs[0].rawFormattedLog}</span>
          </div>
        )}
      </div>

      {/* SUBTAB 1: WORKERS & 8 HUBS ESTRATÉGICOS (300 AGENTES) */}
      {activeSubTab === 'workers' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">8 Hubs Estratégicos do Enxame (300 Micro-Agentes)</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                  Hierarquia Sub-Swarm
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Arquitetura sem sobrecarga visual: os 300 micro-agentes operam em 8 Sub-Swarms roteados por eventos D+0 com lazy loading e isolamento de falha.
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
              <button
                onClick={() => setHubViewMode('8_HUBS')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  hubViewMode === '8_HUBS'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                8 Hubs Globais (300 Agentes)
              </button>
              <button
                onClick={() => setHubViewMode('CORE_6_WORKERS')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  hubViewMode === 'CORE_6_WORKERS'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                6 Agentes Core (Execução Direta)
              </button>
            </div>
          </div>

          {/* 8 STRATEGIC HUBS VIEW */}
          {hubViewMode === '8_HUBS' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hubs.map(hub => {
                return (
                  <div
                    key={hub.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 transition-all rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-cyan-950/20 hover:shadow-lg"
                  >
                    <div className="space-y-3">
                      {/* Hub Code & Status Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700/80 rounded">
                          {hub.code}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {hub.totalAgentsCount} Workers
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                          {hub.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {hub.description}
                        </p>
                      </div>

                      {/* Categories preview */}
                      <div className="flex flex-wrap gap-1">
                        {hub.subCategories.slice(0, 2).map((cat, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded truncate max-w-[140px]">
                            {cat}
                          </span>
                        ))}
                        {hub.subCategories.length > 2 && (
                          <span className="text-[9px] px-1 py-0.5 text-slate-500">
                            +{hub.subCategories.length - 2}
                          </span>
                        )}
                      </div>

                      {/* Mini Metrics */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Economia/Risco</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {formatCurrency(hub.totalEconomyBrl > 0 ? hub.totalEconomyBrl : hub.totalBleedMitigatedBrl, currency, language)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Latência Média</span>
                          <span className="font-mono text-cyan-300 font-semibold">
                            {hub.avgLatencyMs} ms
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Desdobrar Micro-Agentes (Lazy Loading) */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedHubForDetail(hub)}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-98 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-200" />
                        <span>Desdobrar {hub.totalAgentsCount} Agentes</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* MÓDULOS DE SERVIÇOS JURÍDICOS & FISCAIS ESPECIALIZADOS (PGFN & SALÃO PARCEIRO) */}
            <div className="pt-6 border-t border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Módulos de Serviços Jurídicos &amp; Fiscais Avançados</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capacidades operacionais ativas integradas ao <strong>HUB-01-FISCAL</strong> (Transação Excepcional PGFN/CAPAG) e <strong>HUB-07-HR</strong> (Contrato Salão Parceiro Lei 13.352).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('specialized_legal')}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <span>Abrir visualização isolada</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <PgfnCapagDiagnosisCard
                  currency={currency}
                  language={language}
                  companyName={tenantProfile?.name}
                  cnpj={tenantProfile?.cnpj}
                  onAddAuditRecord={onAddAuditRecord}
                  onNavigateToTaxRecovery={() => onNavigateToTab?.('legal_tax_recovery')}
                />
                <SalaoParceiroContractCard
                  currency={currency}
                  language={language}
                  onAddAuditRecord={onAddAuditRecord}
                />
              </div>
            </div>
          </div>
        )}

          {/* 6 CORE WORKERS VIEW (LEGACY/DIRECT TESTING) */}
          {hubViewMode === 'CORE_6_WORKERS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {workers.map(worker => {
                const matchedScenario = SWARM_STRESS_SCENARIOS.find(s => s.agentId === worker.agentId);

                return (
                  <div
                    key={worker.agentId}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 transition-all rounded-xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Worker Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              worker.currentStatus === 'SUCCESS' ? 'bg-emerald-400' :
                              worker.currentStatus === 'BLOCKED_HUMAN_IN_THE_LOOP' ? 'bg-amber-400' :
                              worker.currentStatus === 'FALLBACK_DLQ' ? 'bg-rose-400' :
                              'bg-cyan-400'
                            } animate-pulse`} />
                            <h3 className="text-sm font-bold text-white tracking-tight">{worker.agentName}</h3>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                            ID: {worker.codeName}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded border ${worker.bgBadge}`}>
                          {worker.currentStatus}
                        </span>
                      </div>

                      {/* Trigger and Business Rule */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gatilho de Evento:</span>
                          <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                            {worker.activeTrigger}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Último Recibo ERP:</span>
                          <span className="font-mono text-emerald-400 text-[10px] font-medium truncate max-w-[150px]" title={worker.lastReceipt}>
                            {worker.lastReceipt}
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-800/30 rounded p-2 border border-slate-800/50">
                          <span className="text-[10px] text-slate-400 block">
                            {worker.generatedEconomyBrl > 0 ? 'Economia Gerada' : 'Sangria Evitada'}
                          </span>
                          <span className="font-bold text-white font-mono text-xs mt-0.5 block">
                            {worker.generatedEconomyBrl > 0 
                              ? formatCurrency(worker.generatedEconomyBrl, currency, language)
                              : formatCurrency(worker.mitigatedBleedBrl, currency, language)
                            }
                          </span>
                        </div>

                        <div className="bg-slate-800/30 rounded p-2 border border-slate-800/50">
                          <span className="text-[10px] text-slate-400 block">Eventos Processados</span>
                          <span className="font-bold text-white font-mono text-xs mt-0.5 block">
                            {worker.processedEventsCount} op
                          </span>
                        </div>
                      </div>

                      {/* Last Ledger Hash */}
                      <div className="text-[10px] text-slate-400 flex items-center justify-between font-mono bg-slate-950/40 px-2 py-1 rounded border border-slate-800/40">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-cyan-400" />
                          Ledger Hash:
                        </span>
                        <span className="text-slate-400 truncate max-w-[140px]" title={worker.lastHash}>
                          {worker.lastHash.slice(0, 14)}...
                        </span>
                      </div>
                    </div>

                    {/* Trigger Stress Test Button for this Agent */}
                    <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => matchedScenario && handleTriggerStressTest(matchedScenario)}
                        disabled={isExecuting}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-slate-700/60 disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5 text-cyan-400" />
                        Testar Disparo Autônomo
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRouteAgent(worker.agentId);
                          setActiveSubTab('erp_routes');
                        }}
                        title="Ver Rota / Hook ERP"
                        className="p-2 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-colors border border-slate-700/40"
                      >
                        <Network className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB ESPECIAL: SERVIÇOS JURÍDICOS & FISCAIS ESPECIALIZADOS */}
      {activeSubTab === 'specialized_legal' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Módulos Jurídicos &amp; Fiscais Avançados</h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono">
                  HUB-01 &amp; HUB-07
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulador CAPAG para Transação Excepcional da Dívida Ativa da União e Gerador de Contrato de Parceria sob a Lei do Salão Parceiro (Lei 13.352/2016).
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <PgfnCapagDiagnosisCard
              currency={currency}
              language={language}
              companyName={tenantProfile?.name}
              cnpj={tenantProfile?.cnpj}
              onAddAuditRecord={onAddAuditRecord}
              onNavigateToTaxRecovery={() => onNavigateToTab?.('legal_tax_recovery')}
            />
            <SalaoParceiroContractCard
              currency={currency}
              language={language}
              onAddAuditRecord={onAddAuditRecord}
            />
          </div>
        </div>
      )}

      {/* SUBTAB 2: ROTAS & HOOKS DE COMUNICAÇÃO ERP */}
      {activeSubTab === 'erp_routes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Mapeamento Oficial de Rotas & Hooks com o ERP</h2>
              <p className="text-xs text-slate-400">
                Interfaces de comunicação bidirecional entre os Agentes Autônomos Velatrix AOS e sistemas legados (TOTVS Protheus, SAP S/4HANA, Senior, Omie).
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded font-mono">
              mTLS / Secp256k1 & Webhooks
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Agent Route Selector Sidebar */}
            <div className="lg:col-span-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block px-1 mb-2">
                Agente & Endpoint Alvo:
              </span>
              {ERP_COMMUNICATION_ROUTES.map(route => {
                const isSelected = selectedRouteAgent === route.agentId;
                return (
                  <button
                    key={route.agentId}
                    onClick={() => setSelectedRouteAgent(route.agentId)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                        {route.agentName}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded">
                        {route.httpMethod}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {route.routePath}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-emerald-400 font-mono">Status {route.successCode} OK</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-slate-400 truncate">{route.authType}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Route Technical Specification Viewer */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                      {selectedRoute.httpMethod}
                    </span>
                    <span className="text-sm font-mono font-bold text-white">
                      {selectedRoute.routePath}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedRoute.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                    Auth: {selectedRoute.authType}
                  </span>
                </div>
              </div>

              {/* Rules & Actions Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase text-cyan-400 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Regra de Negócio Executada
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedRoute.businessRule}
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Critério de Verificação de Sucesso
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {selectedRoute.successVerification}
                  </p>
                </div>
              </div>

              {/* Supported ERPs */}
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">
                  ERPs Homologados & Módulos Mapeados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedRoute.supportedErps.map(erp => (
                    <span key={erp} className="px-2.5 py-1 bg-slate-800/70 border border-slate-700/60 rounded text-xs text-slate-300 flex items-center gap-1.5">
                      <Server className="w-3 h-3 text-cyan-400" />
                      {erp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Request & Response Payloads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Payload de Requisição (Entrada):
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedRoute.sampleRequest, null, 2), 'req')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedText === 'req' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText === 'req' ? 'Copiado' : 'Copiar JSON'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-56 leading-relaxed">
                    {JSON.stringify(selectedRoute.sampleRequest, null, 2)}
                  </pre>
                </div>

                {/* Response Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Payload de Resposta (Status 200/201):
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedRoute.sampleResponse, null, 2), 'res')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedText === 'res' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText === 'res' ? 'Copiado' : 'Copiar JSON'}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
                    {JSON.stringify(selectedRoute.sampleResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TESTES DE ESTRESSE & SIMULAÇÃO */}
      {activeSubTab === 'stress_tests' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Bateria de Testes de Estresse dos Agentes</h2>
              <p className="text-xs text-slate-400">
                Injete eventos anômalos no barramento em tempo real para verificar a integridade da pipeline de ponta a ponta.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateDlqFailure}
                  onChange={e => setSimulateDlqFailure(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
                />
                <span>Simular Timeout no ERP (Dead Letter Queue Fallback)</span>
              </label>
            </div>
          </div>

          {/* Scenarios Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {SWARM_STRESS_SCENARIOS.map(scenario => {
              const worker = workers.find(w => w.agentId === scenario.agentId);

              return (
                <div
                  key={scenario.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase rounded border ${worker?.bgBadge || 'bg-slate-800'}`}>
                        {scenario.agentName}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        scenario.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        scenario.severity === 'High' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {scenario.severity}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {scenario.scenarioTitle}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {scenario.description}
                    </p>

                    <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Entidade Alvo:</span>
                        <span className="text-slate-300 font-medium truncate max-w-[170px]">{scenario.targetEntity}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Valor em Análise:</span>
                        <span className="text-white font-mono font-medium">
                          {scenario.valueBrl > 0 ? formatCurrency(scenario.valueBrl, currency, language) : 'Risco SecOps'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Governança Multi-Sig:</span>
                        <span className={scenario.requiresMultiSig ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                          {scenario.requiresMultiSig ? 'Obrigatória (> R$ 25k)' : 'Autônoma (< Teto)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTriggerStressTest(scenario)}
                    disabled={isExecuting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Disparar Teste de Estresse
                  </button>
                </div>
              );
            })}
          </div>

          {/* Active Execution Pipeline Visualization */}
          {(isExecuting || executionResult) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg">
                    <Activity className={`w-5 h-5 ${isExecuting ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Pipeline Autônoma em Execução: {runningScenario?.scenarioTitle}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {runningScenario?.agentName} • Status: {isExecuting ? 'Processando Fases...' : executionResult?.status}
                    </span>
                  </div>
                </div>

                {executionResult && (
                  <span className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                    executionResult.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                    executionResult.status === 'BLOCKED_HUMAN_IN_THE_LOOP' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {executionResult.status}
                  </span>
                )}
              </div>

              {/* 6 Step Pipeline Flow */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 pt-2">
                {[
                  { step: 1, name: '1. Ingestão Evento', icon: Zap },
                  { step: 2, name: '2. Grafo AOS', icon: Database },
                  { step: 3, name: '3. Invariantes', icon: ShieldCheck },
                  { step: 4, name: '4. Quórum Multi-Sig', icon: UserCheck },
                  { step: 5, name: '5. Execução ERP', icon: Server },
                  { step: 6, name: '6. Ledger Hash', icon: Lock }
                ].map(p => {
                  const isCurrent = activePipelineStep === p.step;
                  const isDone = activePipelineStep > p.step || (!isExecuting && executionResult);

                  return (
                    <div
                      key={p.step}
                      className={`p-3 rounded-lg border text-center transition-all flex flex-col items-center gap-1.5 ${
                        isCurrent ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/30' :
                        isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <p.icon className={`w-4 h-4 ${isCurrent ? 'animate-bounce text-cyan-400' : ''}`} />
                      <span className="text-[11px] font-bold block">{p.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Result Details */}
              {executionResult && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Live Log Emitido Oficial:
                    </span>
                    <button
                      onClick={() => copyToClipboard(executionResult.liveLog.rawFormattedLog, 'log_exec')}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedText === 'log_exec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedText === 'log_exec' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-xs text-emerald-300">
                    {executionResult.liveLog.rawFormattedLog}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Validações de Invariantes:</span>
                      <ul className="space-y-1">
                        {executionResult.invariantChecks.map((inv, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-slate-300 text-[11px]">
                            {inv.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span className="truncate">{inv.invariantName}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Ledger Cryptographic Hash:</span>
                      <span className="font-mono text-[11px] text-cyan-300 break-all block bg-slate-900 p-2 rounded border border-slate-800">
                        {executionResult.ledgerHash}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: LIVE LOGS (FEED TEMPO REAL) */}
      {activeSubTab === 'live_logs' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Feed de Ações em Tempo Real (Live Logs)</h2>
              <p className="text-xs text-slate-400 font-mono">
                Formato padrão obrigatório: [HH:MM:SS] [NOME_DO_AGENTE] Ação realizada com sucesso | Resultado / Economia Gerada
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const fullText = filteredLogs.map(l => l.rawFormattedLog).join('\n');
                  copyToClipboard(fullText, 'all_logs');
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                {copiedText === 'all_logs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'all_logs' ? 'Logs Copiados' : 'Copiar Todos os Logs'}
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="md:col-span-5">
              <input
                type="text"
                value={searchLogQuery}
                onChange={e => setSearchLogQuery(e.target.value)}
                placeholder="Buscar por agente, entidade, hash ou economia..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-4">
              <select
                value={filterAgent}
                onChange={e => setFilterAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todos os Agentes e Hubs (300 Agentes)</option>
                <optgroup label="8 Hubs Estratégicos (Sub-Swarms)">
                  {STRATEGIC_HUBS.map(hub => (
                    <option key={hub.id} value={hub.id}>
                      {hub.code} - {hub.name} ({hub.totalAgentsCount} Agentes)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="6 Agentes Core Legados">
                  <option value="agent-fiscal">Agente Fiscal & ICMS/ST</option>
                  <option value="agent-treasury">Arbitragem de Tesouraria</option>
                  <option value="agent-anti-fraud">Antifraude & Trava de Boletos</option>
                  <option value="agent-supply-resilience">Resiliência de Supply Chain</option>
                  <option value="agent-iot-telemetry">Telemetria IoT & Câmaras Frias</option>
                  <option value="agent-cyber-dejavu">CyberSpy & Lock-Down Ransomware</option>
                </optgroup>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="all">Todas as Severidades</option>
                <option value="SUCCESS">Sucesso (Verde)</option>
                <option value="WARNING">Alerta / DLQ (Amarelo)</option>
                <option value="CRITICAL">Crítico / Trava (Vermelho)</option>
              </select>
            </div>
          </div>

          {/* Logs Terminal List */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs shadow-inner">
            <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 font-bold text-slate-300">velatrix-aos-swarm.log</span>
              </div>
              <span>{filteredLogs.length} eventos registrados</span>
            </div>

            <div className="divide-y divide-slate-900 max-h-[520px] overflow-y-auto">
              {filteredLogs.map(log => {
                return (
                  <div
                    key={log.id}
                    className="p-3.5 hover:bg-slate-900/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">{log.timeFormatted}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' :
                          log.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.agentName}
                        </span>
                        <span className="text-slate-300 font-sans text-xs">
                          {log.actionTitle}
                        </span>
                      </div>

                      {/* Raw Standard Line */}
                      <p className="text-slate-400 text-[11px] leading-relaxed break-all">
                        {log.rawFormattedLog}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {log.economyBrl && (
                        <span className="text-emerald-400 font-bold text-[11px]">
                          +{formatCurrency(log.economyBrl, currency, language)}
                        </span>
                      )}
                      {log.bleedPreventedBrl && (
                        <span className="text-cyan-400 font-bold text-[11px]">
                          Evitado {formatCurrency(log.bleedPreventedBrl, currency, language)}
                        </span>
                      )}

                      <span className="text-slate-500 font-mono text-[10px] truncate max-w-[120px]" title={log.ledgerHash}>
                        {log.ledgerHash.slice(0, 10)}...
                      </span>

                      <button
                        onClick={() => copyToClipboard(log.rawFormattedLog, log.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        title="Copiar linha de log"
                      >
                        {copiedText === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Nenhum evento encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: DEAD LETTER QUEUE (DLQ) */}
      {activeSubTab === 'dlq' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Dead Letter Queue (DLQ) & Agendador com Backoff Exponencial</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Engine Servidor Real
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Processamento resiliente com retentativas automáticas no backend (1s, 2s, 4s, 8s, 16s). Ao esgotar o limite máximo, o evento é classificado como FAILED_PERMANENT com alerta crítico.
              </p>
            </div>

            <button
              onClick={handleReplayAllDlqItems}
              disabled={isReplayingAll || dlqItems.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 shrink-0 shadow-lg shadow-orange-950/30"
            >
              <RefreshCw className={`w-4 h-4 ${isReplayingAll ? 'animate-spin' : ''}`} />
              {isReplayingAll ? 'Reprocessando Todos...' : 'Replay de Todos na Fila'}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total na Fila</span>
              <span className="text-lg font-mono font-bold text-white mt-1 block">{dlqItems.length}</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Em Backoff Ativo</span>
              <span className="text-lg font-mono font-bold text-amber-300 mt-1 block">
                {dlqItems.filter(i => i.status === 'WAITING_RETRY').length}
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Falhas Definitivas</span>
              <span className="text-lg font-mono font-bold text-rose-300 mt-1 block">
                {dlqItems.filter(i => i.status === 'FAILED_PERMANENT' || i.status === 'EXHAUSTED').length}
              </span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Recuperados</span>
              <span className="text-lg font-mono font-bold text-emerald-300 mt-1 block">
                {dlqItems.filter(i => i.status === 'RESOLVED_OFFLINE' || i.status === 'RESOLVED').length}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800">
              {dlqItems.map(item => {
                const isPermanentFail = item.status === 'FAILED_PERMANENT' || item.status === 'EXHAUSTED';
                const isResolved = item.status === 'RESOLVED_OFFLINE' || item.status === 'RESOLVED';
                const isWaiting = item.status === 'WAITING_RETRY';
                const isThisReplaying = replayingItemId === item.id;

                return (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-slate-850/40 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isWaiting && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                          {isPermanentFail && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                          {isResolved && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          
                          <span className="text-xs font-bold text-white">{item.agentName}</span>
                          <span className="text-xs font-mono text-slate-400">➔ {item.endpoint}</span>

                          {/* Status Badge */}
                          {isPermanentFail && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              FAILED_PERMANENT
                            </span>
                          )}
                          {isWaiting && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              WAITING_RETRY
                            </span>
                          )}
                          {isResolved && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              RESOLVED_OFFLINE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-300/90 font-mono">
                          Causa: {item.errorReason}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">
                            Tentativas: <strong className={isPermanentFail ? 'text-rose-400' : isResolved ? 'text-emerald-400' : 'text-amber-400'}>{item.retryCount}/{item.maxRetries}</strong>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isWaiting && `Próximo backoff: ${item.nextRetryDelayMs / 1000}s`}
                            {isPermanentFail && 'Esgotado (sem mais retries automáticos)'}
                            {isResolved && 'Concluído com sucesso'}
                          </span>
                        </div>

                        <button
                          onClick={() => handleReplayDlqItem(item)}
                          disabled={isThisReplaying || isResolved}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition-all ${
                            isResolved
                              ? 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
                              : isPermanentFail
                              ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 border-rose-700/60'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isThisReplaying ? 'animate-spin text-amber-400' : isPermanentFail ? 'text-rose-400' : 'text-cyan-400'}`} />
                          {isThisReplaying ? 'Reprocessando...' : isResolved ? 'Resolvido' : isPermanentFail ? 'Replay Manual' : 'Replay Imediato'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-[11px] text-slate-400 overflow-x-auto flex items-center justify-between gap-4">
                      <span>Payload em Espera: {JSON.stringify(item.payload)}</span>
                      {item.ledgerHash && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0" title={item.ledgerHash}>
                          Hash: {item.ledgerHash.slice(0, 16)}...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {dlqItems.length === 0 && (
                <div className="p-12 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Fila de Dead Letter Vazia</h4>
                  <p className="text-xs text-slate-400">
                    Todas as comunicações com os ERPs (TOTVS, SAP, Senior) foram concluídas com sucesso.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MULTI-SIG APPROVAL MODAL */}
      {multiSigPendingResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Aprovação Multi-Sig Obrigatória (Human-In-The-Loop)
                  </h3>
                  <span className="text-xs text-amber-300">
                    Invariante de Teto Orçamentário Autônomo Excedida
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Ação Proposta:</span>
                <span className="text-white font-semibold">{multiSigPendingResult.scenarioTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor da Operação:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {formatCurrency(multiSigPendingResult.quorumResult.valueBrl, currency, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Teto Autônomo Configurado:</span>
                <span className="text-slate-300 font-mono">
                  {formatCurrency(multiSigPendingResult.quorumResult.budgetThresholdBrl, currency, language)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quórum Exigido:</span>
                <span className="text-slate-300 font-mono font-bold">
                  {multiSigPendingResult.quorumResult.quorumCountRequired} Assinaturas Autorizadas (C-Level / CFO)
                </span>
              </div>
            </div>

            {/* Collected Signatures */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Assinaturas Coletadas no Quórum:</span>
              <div className="space-y-1.5">
                {signaturesCollected.map((sig, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-white font-medium">{sig.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">{sig.signedAt} • {sig.hash}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setMultiSigPendingResult(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
              >
                Suspender Operação
              </button>
              <button
                onClick={handleApproveMultiSig}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Assinar e Despachar ao ERP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8 STRATEGIC HUBS DETAIL MODAL: Lazy Loading of Micro-Agents (Sub-Swarms) */}
      {selectedHubForDetail && (
        <StrategicHubDetailModal
          hub={selectedHubForDetail}
          onClose={() => setSelectedHubForDetail(null)}
          onDispatchEvent={handleRouterDispatchResult}
        />
      )}

      {/* SWARM EVENT ROUTER SIMULATOR MODAL: 300 Agents Event Bus Pipeline */}
      {showRouterSimulator && (
        <SwarmEventRouterSimulatorModal
          onClose={() => setShowRouterSimulator(false)}
          onDispatchEvent={handleRouterDispatchResult}
        />
      )}
    </div>
  );
};
