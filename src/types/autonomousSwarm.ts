export type AutonomousAgentId = 
  | 'agent-fiscal'
  | 'agent-treasury'
  | 'agent-anti-fraud'
  | 'agent-supply-resilience'
  | 'agent-iot-telemetry'
  | 'agent-cyber-dejavu'
  | string;

export type StrategicHubId = 
  | 'hub-fiscal'
  | 'hub-supply'
  | 'hub-treasury'
  | 'hub-iot-maintenance'
  | 'hub-cyber-compliance'
  | 'hub-legal-regulatory'
  | 'hub-hr-personnel'
  | 'hub-verticals';

export type MicroAgentRuntimeMode = 
  | 'SERVERLESS_COLD' 
  | 'CONTAINER_WARM' 
  | 'STANDBY_ON_DEMAND' 
  | 'CONTAINER_SPAWNING';

export interface MicroAgentDefinition {
  id: string;
  hubId: StrategicHubId;
  name: string;
  codeName: string;
  subCategory: string;
  description: string;
  triggerKeywords: string[];
  erpEndpoint: string;
  status: WorkerExecutionState;
  runtimeMode: MicroAgentRuntimeMode;
  processedEventsCount: number;
  mitigatedBleedBrl: number;
  generatedEconomyBrl: number;
  avgLatencyMs: number;
  lastHeartbeat: string;
  successRatePct: number;
  requiresMultiSigThresholdBrl?: number;
  sampleActionDescription?: string;
}

export interface StrategicHub {
  id: StrategicHubId;
  name: string;
  shortName: string;
  code: string;
  description: string;
  color: string;
  accentBg: string;
  borderAccent: string;
  iconName: string;
  totalAgentsCount: number;
  activeAgentsCount: number;
  standbyAgentsCount: number;
  eventsProcessedCount: number;
  totalEconomyBrl: number;
  totalBleedMitigatedBrl: number;
  avgLatencyMs: number;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'WARNING';
  subCategories: string[];
}

export interface RouterDispatchResult {
  eventId: string;
  eventTitle: string;
  timestamp: string;
  timeFormatted: string;
  routedHubId: StrategicHubId;
  routedHubName: string;
  routedAgentId: string;
  routedAgentName: string;
  subCategory: string;
  executionStatus: 'EXECUTED_SUCCESS' | 'MULTI_SIG_TRIGGERED' | 'REDIRECTED_TO_CORE_MASTER' | 'DLQ_RETRY';
  executionTimeMs: number;
  coldStartDelayMs?: number;
  runtimeMode: MicroAgentRuntimeMode;
  economyGeneratedBrl?: number;
  bleedPreventedBrl?: number;
  formattedLiveLog: string; // [HH:MM:SS] [HUB_NAME -> MICRO_AGENT] Ação Autônoma Concluída | Métrica / Economia
  ledgerHash: string;
  previousLedgerHash: string;
  invariantsChecked: { name: string; passed: boolean; details: string }[];
  requiresHumanIntervention?: boolean;
  fallbackAlert?: string;
  erpEndpoint: string;
  erpResponseCode: number;
  operatingMode?: 'SIMULATOR' | 'REAL';
  outboundDeliveryStatus?: 'PENDENTE' | 'ENVIADO' | 'NAO_APLICAVEL' | 'ERRO';
}

export type PipelinePhase = 
  | 'EVENT_INGESTION'
  | 'GRAPH_CONSULT'
  | 'INVARIANTS_CHECK'
  | 'DELIBERATION_QUORUM'
  | 'AUTONOMOUS_EXECUTION'
  | 'IMMUTABLE_LEDGER';

export type WorkerExecutionState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'ANALYZING' 
  | 'EXECUTING' 
  | 'BLOCKED_HUMAN_IN_THE_LOOP' 
  | 'FALLBACK_DLQ' 
  | 'SUCCESS'
  | 'ACTIVE'
  | 'STANDBY_ON_DEMAND';

export interface SwarmLiveLog {
  id: string;
  timestamp: string;
  timeFormatted: string; // [HH:MM:SS]
  agentId: AutonomousAgentId;
  agentName: string;
  actionTitle: string;
  resultSummary: string;
  rawFormattedLog: string; // Ex: [14:32:05] [Agente Fiscal & ICMS/ST] Ação realizada com sucesso | Ajuste de MVA aplicado [ECONOMIA_GERADA: R$ 84.520,00]
  economyBrl?: number;
  bleedPreventedBrl?: number;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  status: 
    | 'CONFORME' 
    | 'PAGAMENTO_BLOQUEADO_PREVENTIVO' 
    | 'ORDEM_EXECUTADA' 
    | 'COTACAO_DISPARADA' 
    | 'AGENDADO' 
    | 'ISOLAMENTO_ATIVO' 
    | 'DLQ_RETRY' 
    | 'FAILED_PERMANENT'
    | 'FALHA_PERMANENTE'
    | 'HUMAN_APPROVAL_REQUIRED';
  targetEntity: string;
  ledgerHash: string;
  previousLedgerHash?: string;
  routedHubId?: string;
  erpResponseCode: number;
  erpEndpoint: string;
  requiresMultiSig?: boolean;
}

export interface ErpCommunicationRoute {
  agentId: AutonomousAgentId;
  agentName: string;
  routePath: string;
  httpMethod: 'POST' | 'PUT';
  description: string;
  triggerEvent: string;
  businessRule: string;
  outputAction: string;
  successVerification: string;
  requestPayloadSchema: Record<string, any>;
  responsePayloadSchema: Record<string, any>;
  sampleRequest: Record<string, any>;
  sampleResponse: Record<string, any>;
  authType: 'mTLS Secp256k1' | 'OAuth 2.0 Bearer' | 'HMAC-SHA256 Hook';
  successCode: number;
  fallbackDlqCode: number;
  supportedErps: string[];
}

export interface AutonomousWorkerStatus {
  agentId: AutonomousAgentId;
  agentName: string;
  codeName: string;
  color: string;
  bgBadge: string;
  borderBadge: string;
  category: 'fiscal' | 'treasury' | 'anti_fraud' | 'supply_chain' | 'iot' | 'cyber_secops';
  currentStatus: WorkerExecutionState;
  processedEventsCount: number;
  mitigatedBleedBrl: number;
  generatedEconomyBrl: number;
  lastHeartbeat: string;
  activeTrigger: string;
  lastReceipt: string;
  lastHash: string;
  currentPipelinePhase: PipelinePhase;
  consecutiveErrors: number;
  successRatePct: number;
}

export interface DeadLetterQueueItem {
  id: string;
  timestamp: string;
  agentId: AutonomousAgentId;
  agentName: string;
  endpoint: string;
  payload: Record<string, any>;
  errorReason: string;
  retryCount: number;
  maxRetries: number;
  nextRetryDelayMs: number;
  lastAttemptAt: string;
  status: 'WAITING_RETRY' | 'RETRYING' | 'EXHAUSTED' | 'RESOLVED_OFFLINE' | 'FAILED_PERMANENT' | 'RESOLVED';
  ledgerHash?: string;
}

export interface StressTestScenario {
  id: string;
  agentId: AutonomousAgentId;
  agentName: string;
  scenarioTitle: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium';
  triggerEventPayload: Record<string, any>;
  expectedEconomyBrl?: number;
  expectedBleedPreventedBrl?: number;
  expectedOutcomeStatus: string;
  targetEntity: string;
  requiresMultiSig: boolean;
  valueBrl: number;
  simulatedCashBalanceBrl?: number;
  simulatedSlaCompliancePct?: number;
  isCashOutflow?: boolean;
}
