import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Zap, 
  Server, 
  RefreshCw, 
  Play, 
  Pause, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Radio, 
  Network, 
  Sliders, 
  Filter, 
  ArrowUpRight, 
  Database, 
  HardDrive, 
  Check, 
  FileText, 
  ShieldCheck, 
  Flame, 
  RadioTower, 
  Sparkles,
  ChevronRight,
  Gauge,
  Wifi,
  WifiOff,
  ArrowDown,
  ChevronsDown
} from 'lucide-react';
import { TenantProfile, EnterpriseKnowledgeGraph, SupportedLanguage, SupportedCurrency } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { useGraphHealth, HeartbeatState, ConnectorHealthItem, TerminalEventLog } from '../../context/GraphHealthContext';

export type { HeartbeatState, ConnectorHealthItem, TerminalEventLog };

interface GraphHealthWorkspaceProps {
  tenantProfile?: TenantProfile;
  graph?: EnterpriseKnowledgeGraph;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onNavigateToDashboard?: () => void;
  onNavigateToErpConnector?: () => void;
}

const INITIAL_CONNECTORS: ConnectorHealthItem[] = [
  {
    id: 'conn_rfb_sped',
    name: 'API Receita Federal / CNPJ & SPED',
    category: 'fiscal',
    protocol: 'REST / TLS 1.3 (mTLS)',
    status: 'receiving_stream',
    lastPingSecondsAgo: 2,
    latencyMs: 34,
    throughputMsgSec: 8.4,
    uptimePercent: 99.98,
    description: 'Monitoramento Contínuo de Situação Cadastral, CND e Malha Fiscal'
  },
  {
    id: 'conn_totvs_protheus',
    name: 'Conector ERP TOTVS Protheus',
    category: 'erp',
    protocol: 'REST Gateway / JSON Webhook',
    status: 'receiving_stream',
    lastPingSecondsAgo: 1,
    latencyMs: 22,
    throughputMsgSec: 14.2,
    uptimePercent: 99.99,
    description: 'Ingestão Bidirecional de Ordens de Compra, Estoque e Contas a Pagar/Receber'
  },
  {
    id: 'conn_sap_s4hana',
    name: 'Conector ERP SAP S/4HANA',
    category: 'erp',
    protocol: 'RFC Client / OData v4',
    status: 'syncing',
    lastPingSecondsAgo: 4,
    latencyMs: 48,
    throughputMsgSec: 6.8,
    uptimePercent: 99.95,
    description: 'Sincronização de Centros de Custo, BOM Industrial e Ledger Contábil'
  },
  {
    id: 'conn_iot_coldchain',
    name: 'Webhooks IoT ColdChain & Frotas',
    category: 'iot',
    protocol: 'MQTT / AWS IoT Core',
    status: 'receiving_stream',
    lastPingSecondsAgo: 3,
    latencyMs: 16,
    throughputMsgSec: 22.5,
    uptimePercent: 99.94,
    description: 'Telemetria em Tempo Real de Carga Refrigerada, GPS e Ruptura de Lacres'
  },
  {
    id: 'conn_bacen_openfinance',
    name: 'Open Finance & BACEN PIX Gateway',
    category: 'banking',
    protocol: 'OAuth2 / mTLS FAPI',
    status: 'receiving_stream',
    lastPingSecondsAgo: 2,
    latencyMs: 19,
    throughputMsgSec: 11.3,
    uptimePercent: 99.99,
    description: 'Extratos Bancários D+0, DDA Eletrônico e Validação Instantânea de Chaves PIX'
  },
  {
    id: 'conn_b3_derivatives',
    name: 'Gateway B3 / CVM Cotações & Hedge',
    category: 'market',
    protocol: 'FIX Protocol 4.4 / WebSocket',
    status: 'syncing',
    lastPingSecondsAgo: 5,
    latencyMs: 12,
    throughputMsgSec: 35.1,
    uptimePercent: 99.97,
    description: 'Feed de Preços Spot, Futuros CBOT/B3 (Soja, Milho, Boi) e Taxas DI/Dólar'
  },
  {
    id: 'conn_sefaz_nfe',
    name: 'SEFAZ NF-e 4.0 / DF-e Ingress Hub',
    category: 'fiscal',
    protocol: 'SOAP / WebService SEFAZ RS/SP',
    status: 'receiving_stream',
    lastPingSecondsAgo: 1,
    latencyMs: 29,
    throughputMsgSec: 18.0,
    uptimePercent: 99.92,
    description: 'Captura Instantânea de XMLs de NF-e, CT-e, MDF-e e Manifestação do Destinatário'
  },
  {
    id: 'conn_ocr_multimodal',
    name: 'Pipeline OCR & Documentos Multimodal',
    category: 'ocr',
    protocol: 'gRPC / Tensor Engine',
    status: 'receiving_stream',
    lastPingSecondsAgo: 4,
    latencyMs: 65,
    throughputMsgSec: 4.1,
    uptimePercent: 99.89,
    description: 'Extração Estruturada de Contratos PDF, Comprovantes Escaneados e Laudos'
  }
];

const MOCK_EVENT_TEMPLATES = [
  {
    tenant: 'Indústrias Metalúrgicas Atlas',
    actions: [
      '+1 Nó Atualizado: Contrato_Fornecedor_102 (Via OCR PDF)',
      '+2 Nós Reconciliados: BOM_Industrial_Motor_V8 -> Estoque_Chapa_Aco (Via ERP TOTVS)',
      '+1 Tensão Calculada: Invariante_LeadTime_Critico_Fornecedor_ABC (Delta: +4 dias)',
      '+1 Aresta Criada: Ordem_Producao_984 -> Centro_Custo_Usinagem (Via SAP RFC)'
    ],
    connector: 'Conector ERP TOTVS Protheus',
    category: 'node_update' as const,
    severity: 'nominal' as const
  },
  {
    tenant: 'Agropecuária Santa Bárbara',
    actions: [
      '+1 Aresta Reconciliada: Previsão_Safra_Soja -> Hedge_B3 (Via Webhook B3)',
      '+1 Telemetria Ingerida: Sensor_Solo_Pivot_03 (Umidade: 34.2% - Status: Otimizado)',
      '+1 Nó Atualizado: Contrato_Barter_CPR_Verde_901 (Via OCR PDF e Assinatura Digital)',
      '+1 Aresta de Tensão: Risco_Climático_Geada -> Posicao_Futura_BMF (Via Gateway B3)'
    ],
    connector: 'Gateway B3 / CVM Cotações & Hedge',
    category: 'edge_reconciled' as const,
    severity: 'nominal' as const
  },
  {
    tenant: 'Rede Drogaria BemEstar',
    actions: [
      '+3 Nós Ingeridos: Ruptura_Estoque_Filial_04 (Via TOTVS Protheus REST)',
      '+1 Nó Atualizado: DF-e_NFe_98214_Antibioticos (Autorizada SEFAZ-SP)',
      '+1 Aresta Reconciliada: Lote_Medicamento_Validade_D60 -> Desconto_Dinamico_PontoVenda',
      '+1 Nó Criado: Pedido_Reposicao_Emergencial_Distribuidora_Medicos'
    ],
    connector: 'SEFAZ NF-e 4.0 / DF-e Ingress Hub',
    category: 'node_update' as const,
    severity: 'nominal' as const
  },
  {
    tenant: 'Energia & Solar Alpha',
    actions: [
      '+1 Tensão Detectada: Contrato_CCEE_PLD_Horario (Via CCEE Gateway)',
      '+1 Telemetria Ingerida: Inversor_Parque_Solar_02 (Geração: 4.82 MW/h)',
      '+1 Nó Atualizado: Fatura_Demanda_Contratada_Concessionaria (Economia: R$ 42.000)',
      '+1 Aresta Reconciliada: Previsao_Irradiancia_D1 -> Despacho_Bateria_Storage'
    ],
    connector: 'Webhooks IoT ColdChain & Frotas',
    category: 'tension_check' as const,
    severity: 'alert' as const
  },
  {
    tenant: 'Construtora & Engenharia Apex',
    actions: [
      '+2 Nós Reconciliados: Medição_Obra_Torre_B -> Reajuste_INCC (Via BIM 5D)',
      '+1 Nó Atualizado: Contrato_Empreiteiro_Estrutura_Fase_3 (Via OCR PDF)',
      '+1 Tensão Verificada: Fluxo_Caixa_Patrimonio_Afetacao_SPE_402 (Conformidade 100%)',
      '+1 Nó Criado: Atestado_Qualidade_Concreto_Laje_07 (Via App Mobile Obra)'
    ],
    connector: 'Pipeline OCR & Documentos Multimodal',
    category: 'node_update' as const,
    severity: 'nominal' as const
  },
  {
    tenant: 'Logística Express Sudeste',
    actions: [
      '+1 Telemetria Ingerida: Sensor_ColdChain_Caminhao_18 (Temperatura: -18.2°C)',
      '+1 Aresta Atualizada: Rota_LastMile_Entrega_1482 -> SLA_Cliente_VIP (No Horário)',
      '+1 Nó Atualizado: Conhecimento_Transporte_CTe_4490 (Autorizado SEFAZ-MG)',
      '+1 Alerta Previsto: Manutenção_Preditiva_Freio_Carreta_09 (Vida Útil: 800 km)'
    ],
    connector: 'Webhooks IoT ColdChain & Frotas',
    category: 'telemetry_ping' as const,
    severity: 'nominal' as const
  },
  {
    tenant: 'Fintech CredVale B3',
    actions: [
      '+1 Nó Atualizado: Liquidacao_PIX_BACEN_D0 (Valor: R$ 420.000,00)',
      '+1 Validação Zero-Trust: Anti_Hijack_Chave_PIX_Fornecedor_Confiavel (Score: 99.8%)',
      '+1 Aresta Reconciliada: DDA_Bancario_Compensacao_D0 -> Conta_Tesouraria_Principal',
      '+1 Nó Atualizado: Requisito_Basileia_III_Patrimonio_Referencia (Índice: 14.8%)'
    ],
    connector: 'Open Finance & BACEN PIX Gateway',
    category: 'node_update' as const,
    severity: 'nominal' as const
  }
];

export const GraphHealthWorkspace: React.FC<GraphHealthWorkspaceProps> = ({
  tenantProfile,
  graph,
  language = 'pt',
  currency = 'BRL',
  onNavigateToDashboard,
  onNavigateToErpConnector
}) => {
  const { activeTenant } = useAuth();
  const currentTenantName = tenantProfile?.name || activeTenant?.name || 'Indústrias Metalúrgicas Atlas';

  // Consume Global Shared Telemetry State
  const {
    heartbeatState,
    setHeartbeatState,
    heartbeatMode,
    setHeartbeatMode,
    timeSinceLastIngestion,
    setTimeSinceLastIngestion,
    staleThresholdSeconds,
    setStaleThresholdSeconds,
    nodesPerSecond,
    eventsLastMinute,
    throughputMbps,
    totalNodesIndexed,
    activeEdgesCount,
    reconciliationLatencyMs,
    velocityHistory,
    eventLogs,
    connectors,
    pingConnector,
    clearLogs,
    resetHeartbeat,
    addCustomEventLog
  } = useGraphHealth();

  // Local UI Animation & Scroll States
  const [heartbeatPulse, setHeartbeatPulse] = useState<boolean>(false);
  const [isAutoScrollActive, setIsAutoScrollActive] = useState<boolean>(true);
  const [isTerminalPaused, setIsTerminalPaused] = useState<boolean>(false);
  const [terminalFilter, setTerminalFilter] = useState<string>('all');
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  // Heartbeat pulse effect
  useEffect(() => {
    if (heartbeatState === 'stale') {
      setHeartbeatPulse(false);
      return;
    }

    const pulseInterval = setInterval(() => {
      setHeartbeatPulse(true);
      setTimeout(() => setHeartbeatPulse(false), 800);
    }, heartbeatState === 'idle' ? 3800 : 2200);

    return () => clearInterval(pulseInterval);
  }, [heartbeatState]);

  // Handle user scroll detection inside terminal
  const handleTerminalScroll = () => {
    if (!terminalContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= 35;
    setIsAutoScrollActive(isNearBottom);
  };

  // Scroll to bottom helper
  const scrollToBottom = () => {
    setIsAutoScrollActive(true);
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTo({
        top: terminalContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll terminal without affecting window viewport
  useEffect(() => {
    if (isAutoScrollActive && !isTerminalPaused && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTo({
        top: terminalContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [eventLogs, isAutoScrollActive, isTerminalPaused]);

  // Handler to force re-synchronize / recover from stale state
  const handleForceHeartbeat = () => {
    resetHeartbeat();
    const now = new Date();
    addCustomEventLog({
      tenantName: currentTenantName,
      action: '⚡ [RE-SYNC FORÇADO] Heartbeat D+0 restabelecido. Drenando fila de webhooks e reconciliando nós pendentes...',
      connectorSource: 'Velatrix AOS Core Ingress Daemon',
      category: 'node_update',
      severity: 'info'
    });
  };

  // Handler to manually set state
  const handleSetHeartbeatState = (newState: HeartbeatState) => {
    setHeartbeatState(newState);
    if (newState === 'active') {
      setTimeSinceLastIngestion(0);
    } else if (newState === 'stale') {
      setTimeSinceLastIngestion(16);
    }
  };

  // Ping a specific connector
  const handlePingConnector = (connectorId: string) => {
    pingConnector(connectorId);
    const conn = connectors.find(c => c.id === connectorId);
    if (conn) {
      addCustomEventLog({
        tenantName: currentTenantName,
        action: `✓ [PING MANUAL] Conector "${conn.name}" respondeu ACK em ${conn.latencyMs}ms. Status: SINCRONIZADO.`,
        connectorSource: conn.name,
        category: 'telemetry_ping',
        severity: 'info'
      });
    }
  };

  const isStale = heartbeatState === 'stale' || timeSinceLastIngestion >= staleThresholdSeconds;
  const filteredLogs = terminalFilter === 'all' 
    ? eventLogs 
    : eventLogs.filter(l => l.tenantName.toLowerCase().includes(terminalFilter.toLowerCase()) || l.connectorSource.toLowerCase().includes(terminalFilter.toLowerCase()));

  // SVG Chart calculation for Ingestion Speed
  const maxHistory = Math.max(...velocityHistory, 40);
  const points = velocityHistory.map((val, idx) => {
    const x = (idx / (velocityHistory.length - 1)) * 320;
    const y = 80 - (val / maxHistory) * 70;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
      
      {/* 0. PROTOTYPE SIMULATION NOTICE & TOP STATUS BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 text-[10px] font-mono font-bold uppercase">
                PROTÓTIPO — DADOS SIMULADOS
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Motor de Telemetria & Heartbeat D+0
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Monitoramento em tempo real da ingestão de nós, batimento neural e integridade dos conectores do Grafo Semântico AOS.
            </p>
          </div>
        </div>

        {/* Quick Actions / Navigation */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            onClick={handleForceHeartbeat}
            className="px-3 py-1.5 rounded-xl bg-[var(--vx-neon)]/10 hover:bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-[var(--vx-neon)]/10"
            title="Disparar pulso e forçar re-sincronização de nós"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Forçar Heartbeat</span>
          </button>

          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver Grafo Visual</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 0.1 CRITICAL STALE GRAPH BANNER (Appears if stale / ingestion interrupted) */}
      {isStale && (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-5 text-rose-100 shadow-2xl shadow-rose-950/50 animate-in fade-in duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0 animate-pulse">
                <WifiOff className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500 text-slate-950 text-[10px] font-black uppercase font-mono tracking-wider">
                    ALERTA CRÍTICO
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-rose-200 uppercase tracking-tight">
                    FALHA DE INGESTÃO (STALE GRAPH)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-rose-300 mt-1">
                  Nenhum nó semântico foi reconciliado há mais de <strong className="text-rose-100 underline">{timeSinceLastIngestion} segundos</strong>. 
                  O Grafo AOS perdeu o pulso D+0. Ações autônomas de alto risco estão em quarentena preventiva.
                </p>
              </div>
            </div>

            <button
              onClick={handleForceHeartbeat}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/30 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Restabelecer Ingestão & Re-sincronizar</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. TOP DUAL PANEL: HEARTBEAT DO GRAFO & VELOCIDADE DE INGESTÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL 1.1: HEARTBEAT DO GRAFO (CÍRCULO PULSANTE NEURAL) */}
        <div className={`lg:col-span-5 rounded-2xl p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
          isStale 
            ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20' 
            : heartbeatState === 'idle'
            ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/10'
            : 'bg-slate-900/90 border-[var(--vx-neon)]/30 shadow-lg shadow-[var(--vx-neon)]/5'
        }`}>
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${
                isStale ? 'bg-rose-500/20 text-rose-400' : heartbeatState === 'idle' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-100">
                1. Heartbeat do Grafo AOS
              </h2>
            </div>

            {/* Current State Badge */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isStale
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : heartbeatState === 'idle'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isStale ? 'bg-rose-400' : heartbeatState === 'idle' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-ping'
              }`} />
              {isStale ? 'Falha / Stale' : heartbeatState === 'idle' ? 'Ocioso / Standby' : 'Ativo / D+0'}
            </span>
          </div>

          {/* Center Graphic: Pulsing Radar / Neural Nucleus */}
          <div className="my-6 flex flex-col items-center justify-center relative py-4">
            
            {/* Ambient Background Glow */}
            <div className={`absolute w-44 h-44 rounded-full blur-2xl transition-all duration-700 ${
              isStale 
                ? 'bg-rose-600/20' 
                : heartbeatState === 'idle'
                ? 'bg-amber-500/20'
                : 'bg-[var(--vx-neon)]/20'
            }`} />

            {/* Outer Pulsing Waves */}
            <div className="relative flex items-center justify-center">
              
              {/* Outer Wave 1 */}
              <div className={`absolute rounded-full transition-all duration-1000 ${
                heartbeatPulse && !isStale
                  ? 'w-48 h-48 opacity-40 scale-110'
                  : 'w-36 h-36 opacity-10 scale-95'
              } ${
                isStale 
                  ? 'border border-rose-500' 
                  : heartbeatState === 'idle'
                  ? 'border border-amber-400'
                  : 'border border-[var(--vx-neon)]'
              }`} />

              {/* Outer Wave 2 */}
              <div className={`absolute rounded-full transition-all duration-700 ${
                heartbeatPulse && !isStale
                  ? 'w-40 h-40 opacity-60 scale-105'
                  : 'w-32 h-32 opacity-20 scale-95'
              } ${
                isStale 
                  ? 'border border-rose-500' 
                  : heartbeatState === 'idle'
                  ? 'border border-amber-400'
                  : 'border border-emerald-400'
              }`} />

              {/* Core Nucleus Button / Disc */}
              <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl relative z-10 transition-all duration-500 ${
                isStale
                  ? 'bg-slate-950 border-rose-500 text-rose-400 shadow-rose-950/80'
                  : heartbeatState === 'idle'
                  ? 'bg-slate-950 border-amber-400 text-amber-300 shadow-amber-950/60'
                  : 'bg-slate-950 border-[var(--vx-neon)] text-[var(--vx-neon)] shadow-[var(--vx-neon)]/20'
              }`}>
                <Cpu className={`w-8 h-8 transition-transform duration-300 ${
                  heartbeatPulse && !isStale ? 'scale-125 text-white' : 'scale-100'
                }`} />
                <span className="text-[10px] font-mono font-bold mt-1 tracking-wider">
                  {isStale ? '0 BPM' : heartbeatState === 'idle' ? '22 BPM' : '64 BPM'}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-slate-400">
                  {isStale ? 'PARADO' : 'NEURAL'}
                </span>
              </div>
            </div>

            {/* Subtitle / Latency details */}
            <div className="mt-4 text-center">
              <span className="text-xs font-mono text-slate-300 block">
                Última Ingestão: <strong className={isStale ? 'text-rose-400' : 'text-slate-100'}>{timeSinceLastIngestion}s atrás</strong>
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {isStale 
                  ? '⚠️ Conexão de ingestão suspensa por inatividade' 
                  : heartbeatState === 'idle'
                  ? 'Aguardando lote de transações dos ERPs'
                  : 'Fluxo contínuo D+0 ativo e reconciliado'}
              </span>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider block mb-2">
              Simulação de Estados do Heartbeat:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSetHeartbeatState('active')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  heartbeatState === 'active' && !isStale
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
                }`}
              >
                ● Ativo (Verde)
              </button>

              <button
                onClick={() => handleSetHeartbeatState('idle')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  heartbeatState === 'idle'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
                }`}
              >
                ● Ocioso (Amarelo)
              </button>

              <button
                onClick={() => handleSetHeartbeatState('stale')}
                className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                  isStale
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-900'
                }`}
              >
                ● Falha (Stale)
              </button>
            </div>
          </div>

        </div>

        {/* PANEL 1.2: VELOCIDADE DE INGESTÃO (MÉTRICAS & GRÁFICO TEMPORAL) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/10 text-[var(--vx-neon)]">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  2. Velocidade de Ingestão & Throughput
                </h2>
                <span className="text-[11px] text-slate-400">
                  Telemetria dinâmica de reconciliação em tempo real
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Taxa de Amostragem: 1s
            </span>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            
            {/* Metric 1: Nós por Segundo */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                Nós / Eventos p/ Seg
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-black font-mono ${
                  isStale ? 'text-rose-400' : 'text-[var(--vx-neon)]'
                }`}>
                  {nodesPerSecond}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">nós/s</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                {isStale ? 'Fluxo interrompido' : 'Oscilação adaptativa'}
              </span>
            </div>

            {/* Metric 2: Eventos Último Minuto */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                Eventos (Último Min)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {eventsLastMinute.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">ev/min</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Taxa de absorção nominal
              </span>
            </div>

            {/* Metric 3: Throughput MB/s */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                Vazão de Dados
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black font-mono text-cyan-300">
                  {throughputMbps}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">MB/s</span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                Compressão vetorial
              </span>
            </div>

            {/* Metric 4: Latência Reconciliação */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                Latência Grafo
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-black font-mono ${
                  reconciliationLatencyMs > 100 ? 'text-amber-400' : 'text-purple-400'
                }`}>
                  {isStale ? '--' : `${reconciliationLatencyMs}ms`}
                </span>
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">
                P95 Reconciliação
              </span>
            </div>

          </div>

          {/* Real-time SVG Sparkline / Velocity History Chart */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-neon)] animate-ping" />
                Histórico de Ingestão (Últimos 30 Segundos)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Pico: {maxHistory} nós/s
              </span>
            </div>

            {/* SVG Visualizer */}
            <div className="h-24 w-full relative">
              <svg viewBox="0 0 320 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isStale ? '#f43f5e' : '#00F2FF'} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={isStale ? '#f43f5e' : '#00F2FF'} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="20" x2="320" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="320" y2="50" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Area under curve */}
                <polygon
                  points={`0,80 ${points} 320,80`}
                  fill="url(#speedGradient)"
                />

                {/* Line */}
                <polyline
                  fill="none"
                  stroke={isStale ? '#f43f5e' : '#00F2FF'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>-30s</span>
              <span>-15s</span>
              <span>Agora (D+0)</span>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-2">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              Nós Semânticos no Grafo: <strong className="text-slate-200">{totalNodesIndexed} nós</strong>
            </span>
            <span className="flex items-center gap-1">
              <Network className="w-3.5 h-3.5 text-purple-400" />
              Pontes de Tensão Monitoradas: <strong className="text-slate-200">{activeEdgesCount} arestas</strong>
            </span>
          </div>

        </div>

      </div>

      {/* 2. FEED DE EVENTOS AO VIVO (ESTILO TERMINAL) */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Terminal Title Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {/* Window Controls Decorator */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <RadioTower className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                velatrix-aos-graph-daemon --live-stream
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                LIVE
              </span>
            </div>
          </div>

          {/* Terminal Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={terminalFilter}
                onChange={(e) => setTerminalFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-mono text-[10px] focus:outline-none cursor-pointer"
              >
                <option value="all">Todos os Tenants</option>
                <option value="Atlas">Atlas Metalúrgica</option>
                <option value="Bárbara">Santa Bárbara Agro</option>
                <option value="BemEstar">Drogaria BemEstar</option>
                <option value="Solar">Energia Solar</option>
                <option value="Apex">Apex Engenharia</option>
                <option value="Sudeste">Logística Sudeste</option>
                <option value="CredVale">Fintech CredVale</option>
              </select>
            </div>

            {/* Auto-scroll Toggle */}
            <button
              onClick={() => {
                if (!isAutoScrollActive) {
                  scrollToBottom();
                } else {
                  setIsAutoScrollActive(false);
                }
              }}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                isAutoScrollActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={isAutoScrollActive ? 'Auto-rolagem Ativada (Clique para pausar)' : 'Auto-rolagem Pausada (Clique para reativar)'}
            >
              <ChevronsDown className={`w-3.5 h-3.5 ${isAutoScrollActive ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline text-[10px]">
                Auto-rolagem: {isAutoScrollActive ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Pause / Resume Button */}
            <button
              onClick={() => setIsTerminalPaused(!isTerminalPaused)}
              className={`p-1.5 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                isTerminalPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
              }`}
              title={isTerminalPaused ? 'Retomar Stream' : 'Pausar Stream'}
            >
              {isTerminalPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[10px]">{isTerminalPaused ? 'Pausado' : 'Pausar'}</span>
            </button>

            {/* Clear Terminal Button */}
            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer"
              title="Limpar Feed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

          </div>

        </div>

        {/* Terminal Content Screen */}
        <div 
          ref={terminalContainerRef} 
          onScroll={handleTerminalScroll}
          className="relative p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-2 select-text bg-[var(--vx-deep)] scroll-smooth"
        >
          
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-600 font-mono text-xs">
              &gt; Aguardando novos pacotes de eventos...
            </div>
          ) : (
            filteredLogs.map((log) => {
              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-2 hover:bg-slate-900/60 p-1 rounded transition-colors group"
                >
                  {/* Timestamp */}
                  <span className="text-slate-500 shrink-0 select-none">
                    [{log.timestamp}]
                  </span>

                  {/* Tenant Tag (Strict format required) */}
                  <span className="text-[var(--vx-neon)] font-bold shrink-0">
                    [Grafo: {log.tenantName}]
                  </span>

                  {/* Action Description */}
                  <span className={`flex-1 break-words ${
                    log.severity === 'alert' 
                      ? 'text-amber-300' 
                      : log.severity === 'info'
                      ? 'text-purple-300 font-bold'
                      : 'text-slate-200'
                  }`}>
                    {log.action}
                  </span>

                  {/* Connector source badge */}
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 shrink-0 hidden md:inline">
                    via {log.connectorSource}
                  </span>
                </div>
              );
            })
          )}

          {/* Floating pill when user scrolled up / paused auto-scroll */}
          {!isAutoScrollActive && filteredLogs.length > 0 && (
            <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none">
              <button
                onClick={scrollToBottom}
                className="pointer-events-auto px-3 py-1.5 rounded-full bg-[var(--vx-neon)] hover:bg-[var(--vx-neon)]/90 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow-lg shadow-[var(--vx-neon)]/30 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2"
              >
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                <span>Rolagem manual • Ir para o fim</span>
              </button>
            </div>
          )}
        </div>

        {/* Terminal Status Bar */}
        <div className="bg-slate-950 border-t border-slate-900 px-4 py-2 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-rose-500' : isTerminalPaused ? 'bg-amber-500' : isAutoScrollActive ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
            <span>
              {isStale 
                ? 'DESCONECTADO (STALE)' 
                : isTerminalPaused 
                ? 'PAUSADO PELO OPERADOR' 
                : isAutoScrollActive 
                ? 'INGRESS ATIVO (AUTO-SCROLL ON)'
                : 'INGRESS ATIVO (ROLAGEM MANUAL)'}
            </span>
          </div>
          <span>Buffer: {filteredLogs.length} eventos em memória</span>
        </div>

      </div>

      {/* 3. CHECKLIST DE SAÚDE DOS CONECTORES */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                4. Checklist de Saúde dos Conectores (Ingress Pipeline)
              </h2>
              <p className="text-xs text-slate-400">
                Status e telemetria de latência das fontes de dados que alimentam o Grafo Semântico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {connectors.filter(c => c.status !== 'stale').length}/{connectors.length} Conectados
            </span>
          </div>
        </div>

        {/* Connectors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {connectors.map((connector) => {
            const isConnStale = connector.status === 'stale' || isStale || connector.lastPingSecondsAgo > 15;
            
            return (
              <div 
                key={connector.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  isConnStale
                    ? 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                    : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800/80 hover:border-slate-700 text-slate-200'
                }`}
              >
                <div>
                  
                  {/* Top Row: Title + Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-md ${
                        isConnStale ? 'bg-rose-500/20 text-rose-400' : 'bg-[var(--vx-neon)]/15 text-[var(--vx-neon)]'
                      }`}>
                        <Network className="w-3.5 h-3.5" />
                      </div>
                      <strong className="text-xs font-bold text-slate-100">
                        {connector.name}
                      </strong>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                      isConnStale
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : connector.status === 'receiving_stream'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {isConnStale 
                        ? 'Falha / Timeout' 
                        : connector.status === 'receiving_stream'
                        ? 'Recebendo Fluxo'
                        : 'Sincronizado'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-400 line-clamp-1 mb-3">
                    {connector.description}
                  </p>

                </div>

                {/* Bottom Row: Last Ping + Latency + Ping Button */}
                <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  
                  {/* Dynamic "Last update X seconds ago" */}
                  <span className={`flex items-center gap-1 ${
                    isConnStale ? 'text-rose-400 font-bold' : 'text-slate-400'
                  }`}>
                    <Clock className="w-3 h-3" />
                    última atualização há {isConnStale ? Math.max(16, connector.lastPingSecondsAgo) : connector.lastPingSecondsAgo}s
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 hidden sm:inline">
                      {connector.latencyMs}ms
                    </span>

                    <button
                      onClick={() => handlePingConnector(connector.id)}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[var(--vx-neon)] border border-slate-700 hover:border-[var(--vx-neon)]/40 text-[10px] font-bold transition-all cursor-pointer"
                      title="Disparar ping de teste no conector"
                    >
                      Ping
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Todos os conectores operam sob protocolo de isolamento de contexto (Multi-Tenant RAG & Zero-Trust).
          </span>

          {onNavigateToErpConnector && (
            <button
              onClick={onNavigateToErpConnector}
              className="text-[var(--vx-neon)] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Configurar Conectores & Webhooks</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
};
