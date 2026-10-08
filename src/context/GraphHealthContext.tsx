import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TenantProfile, EnterpriseKnowledgeGraph, SupportedLanguage, SupportedCurrency } from '../types/aos';
import { secureId, secureInt } from '../lib/demoMode';

export type HeartbeatState = 'active' | 'idle' | 'stale';

export interface ConnectorHealthItem {
  id: string;
  name: string;
  category: 'erp' | 'fiscal' | 'iot' | 'banking' | 'market' | 'ocr' | 'energy';
  protocol: string;
  status: 'connected' | 'syncing' | 'receiving_stream' | 'standby' | 'stale';
  lastPingSecondsAgo: number;
  latencyMs: number;
  throughputMsgSec: number;
  uptimePercent: number;
  description: string;
}

export interface TerminalEventLog {
  id: string;
  timestamp: string;
  tenantName: string;
  action: string;
  connectorSource: string;
  category: 'node_update' | 'edge_reconciled' | 'tension_check' | 'telemetry_ping' | 'ocr_extract' | 'diagnosis_run';
  severity: 'nominal' | 'alert' | 'info';
}

export interface GraphHealthContextType {
  heartbeatState: HeartbeatState;
  setHeartbeatState: (state: HeartbeatState) => void;
  heartbeatMode: 'auto' | 'manual';
  setHeartbeatMode: (mode: 'auto' | 'manual') => void;
  timeSinceLastIngestion: number;
  setTimeSinceLastIngestion: React.Dispatch<React.SetStateAction<number>>;
  staleThresholdSeconds: number;
  setStaleThresholdSeconds: React.Dispatch<React.SetStateAction<number>>;
  
  // Telemetry
  nodesPerSecond: number;
  setNodesPerSecond: React.Dispatch<React.SetStateAction<number>>;
  eventsLastMinute: number;
  setEventsLastMinute: React.Dispatch<React.SetStateAction<number>>;
  throughputMbps: number;
  setThroughputMbps: React.Dispatch<React.SetStateAction<number>>;
  totalNodesIndexed: number;
  setTotalNodesIndexed: React.Dispatch<React.SetStateAction<number>>;
  activeEdgesCount: number;
  setActiveEdgesCount: React.Dispatch<React.SetStateAction<number>>;
  reconciliationLatencyMs: number;
  setReconciliationLatencyMs: React.Dispatch<React.SetStateAction<number>>;
  velocityHistory: number[];
  
  // Logs & Connectors
  eventLogs: TerminalEventLog[];
  connectors: ConnectorHealthItem[];
  
  // Actions
  triggerDiagnosisIngestion: (companyName: string, sectorName: string, zScore: number, customNodesCount?: number) => void;
  addCustomEventLog: (log: Omit<TerminalEventLog, 'id' | 'timestamp'>) => void;
  pingConnector: (connectorId: string) => void;
  clearLogs: () => void;
  resetHeartbeat: () => void;
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
  }
];

const GraphHealthContext = createContext<GraphHealthContextType | undefined>(undefined);

export const GraphHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heartbeatMode, setHeartbeatMode] = useState<'auto' | 'manual'>('auto');
  const [heartbeatState, setHeartbeatState] = useState<HeartbeatState>('active');
  const [timeSinceLastIngestion, setTimeSinceLastIngestion] = useState<number>(0);
  const [staleThresholdSeconds, setStaleThresholdSeconds] = useState<number>(15);
  
  const [nodesPerSecond, setNodesPerSecond] = useState<number>(28);
  const [eventsLastMinute, setEventsLastMinute] = useState<number>(1340);
  const [throughputMbps, setThroughputMbps] = useState<number>(5.2);
  const [totalNodesIndexed, setTotalNodesIndexed] = useState<number>(1842);
  const [activeEdgesCount, setActiveEdgesCount] = useState<number>(342);
  const [reconciliationLatencyMs, setReconciliationLatencyMs] = useState<number>(18);
  const [velocityHistory, setVelocityHistory] = useState<number[]>([
    22, 24, 25, 28, 30, 27, 24, 29, 33, 31, 28, 26, 25, 29, 32, 35, 30, 28, 26, 24, 27, 31, 33, 29, 26, 28, 32, 30, 27, 28
  ]);

  const [connectors, setConnectors] = useState<ConnectorHealthItem[]>(INITIAL_CONNECTORS);
  const [eventLogs, setEventLogs] = useState<TerminalEventLog[]>(() => {
    const initial: TerminalEventLog[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const pastTime = new Date(now.getTime() - i * 4000);
      const timeStr = pastTime.toTimeString().split(' ')[0];
      const template = MOCK_EVENT_TEMPLATES[i % MOCK_EVENT_TEMPLATES.length];
      const action = template.actions[i % template.actions.length];
      initial.push({
        id: `log_init_${i}`,
        timestamp: timeStr,
        tenantName: template.tenant,
        action: action,
        connectorSource: template.connector,
        category: template.category,
        severity: template.severity
      });
    }
    return initial;
  });

  // Background Telemetry Tick
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      if (heartbeatState === 'stale') {
        setTimeSinceLastIngestion(prev => prev + 1);
        setNodesPerSecond(0);
        setThroughputMbps(0);
        setReconciliationLatencyMs(999);
        setVelocityHistory(prev => [...prev.slice(1), 0]);
        setConnectors(prev => prev.map(c => ({
          ...c,
          status: 'stale',
          lastPingSecondsAgo: c.lastPingSecondsAgo + 1,
          throughputMsgSec: 0
        })));
        return;
      }

      // Normal Active/Idle Ingestion Tick
      setTimeSinceLastIngestion(prev => {
        const nextVal = prev + 1;
        if (heartbeatMode === 'auto') {
          if (nextVal >= staleThresholdSeconds) {
            setHeartbeatState('stale');
          } else if (nextVal >= 6) {
            setHeartbeatState('idle');
          } else {
            setHeartbeatState('active');
          }
        }
        return nextVal;
      });

      // Fluctuate metrics
      const randomNodes = secureInt(20, 31);
      setNodesPerSecond(randomNodes);
      setThroughputMbps(+(Math.random() * 2 + 3.8).toFixed(1));
      setReconciliationLatencyMs(secureInt(14, 23));
      setEventsLastMinute(prev => prev + secureInt(0, 2) - 1);
      setVelocityHistory(prev => [...prev.slice(1), randomNodes]);

      // Age connectors
      setConnectors(prev => prev.map(c => {
        const jitter = (Math.random() - 0.5) * 2;
        const newPing = c.lastPingSecondsAgo >= 7 ? 0 : c.lastPingSecondsAgo + 1;
        return {
          ...c,
          lastPingSecondsAgo: newPing,
          latencyMs: Math.max(8, Math.min(120, Math.round(c.latencyMs + jitter))),
          status: newPing > 6 ? 'standby' : 'receiving_stream'
        };
      }));

      // Periodic random log generation if active
      if (heartbeatState === 'active' && Math.random() > 0.6) {
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];
        const randomTemplate = MOCK_EVENT_TEMPLATES[Math.floor(Math.random() * MOCK_EVENT_TEMPLATES.length)];
        const randomAction = randomTemplate.actions[Math.floor(Math.random() * randomTemplate.actions.length)];

        setEventLogs(prev => [
          ...prev.slice(-99),
          {
            id: `log_${Date.now()}_${secureId('', 4)}`,
            timestamp: timeStr,
            tenantName: randomTemplate.tenant,
            action: randomAction,
            connectorSource: randomTemplate.connector,
            category: randomTemplate.category,
            severity: randomTemplate.severity
          }
        ]);
        setTotalNodesIndexed(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(telemetryInterval);
  }, [heartbeatState, heartbeatMode, staleThresholdSeconds]);

  // Main Action: Trigger Ingestion from Diagnosis
  const triggerDiagnosisIngestion = (
    companyName: string,
    sectorName: string,
    zScore: number,
    customNodesCount: number = 148
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // Reset ingestion timer & set active
    setTimeSinceLastIngestion(0);
    setHeartbeatState('active');
    setNodesPerSecond(46);
    setThroughputMbps(8.4);
    setTotalNodesIndexed(prev => prev + customNodesCount);
    setActiveEdgesCount(prev => prev + 24);
    setVelocityHistory(prev => [...prev.slice(1), 46]);

    // Add high-priority live log
    const newLog: TerminalEventLog = {
      id: `diag_${Date.now()}`,
      timestamp: timeStr,
      tenantName: companyName,
      action: `+${customNodesCount} Nós Semânticos Ingeridos: Diagnóstico Executado [${sectorName}]. Altman Z-Score: ${zScore.toFixed(2)} • Reconciliação D+0 Ativa`,
      connectorSource: 'Simulador de Diagnóstico AOS (C-Level Engine)',
      category: 'diagnosis_run',
      severity: zScore < 1.81 ? 'alert' : 'nominal'
    };

    setEventLogs(prev => [...prev.slice(-99), newLog]);

    // Also ping the ERP and Fiscal connectors
    setConnectors(prev => prev.map(c => {
      if (c.category === 'erp' || c.category === 'fiscal') {
        return {
          ...c,
          lastPingSecondsAgo: 0,
          status: 'receiving_stream',
          latencyMs: 14
        };
      }
      return c;
    }));
  };

  const addCustomEventLog = (log: Omit<TerminalEventLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setTimeSinceLastIngestion(0);
    setHeartbeatState('active');
    setEventLogs(prev => [
      ...prev.slice(-99),
      {
        ...log,
        id: `custom_${Date.now()}`,
        timestamp: timeStr
      }
    ]);
  };

  const pingConnector = (connectorId: string) => {
    setTimeSinceLastIngestion(0);
    setConnectors(prev => prev.map(c => {
      if (c.id === connectorId) {
        return {
          ...c,
          lastPingSecondsAgo: 0,
          latencyMs: secureInt(12, 26),
          status: 'receiving_stream'
        };
      }
      return c;
    }));
  };

  const clearLogs = () => {
    setEventLogs([]);
  };

  const resetHeartbeat = () => {
    setTimeSinceLastIngestion(0);
    setHeartbeatState('active');
    setNodesPerSecond(28);
    setThroughputMbps(4.5);
    setConnectors(prev => prev.map(c => ({
      ...c,
      status: 'receiving_stream',
      lastPingSecondsAgo: 0
    })));
  };

  return (
    <GraphHealthContext.Provider
      value={{
        heartbeatState,
        setHeartbeatState,
        heartbeatMode,
        setHeartbeatMode,
        timeSinceLastIngestion,
        setTimeSinceLastIngestion,
        staleThresholdSeconds,
        setStaleThresholdSeconds,
        nodesPerSecond,
        setNodesPerSecond,
        eventsLastMinute,
        setEventsLastMinute,
        throughputMbps,
        setThroughputMbps,
        totalNodesIndexed,
        setTotalNodesIndexed,
        activeEdgesCount,
        setActiveEdgesCount,
        reconciliationLatencyMs,
        setReconciliationLatencyMs,
        velocityHistory,
        eventLogs,
        connectors,
        triggerDiagnosisIngestion,
        addCustomEventLog,
        pingConnector,
        clearLogs,
        resetHeartbeat
      }}
    >
      {children}
    </GraphHealthContext.Provider>
  );
};

export const useGraphHealth = () => {
  const context = useContext(GraphHealthContext);
  if (!context) {
    throw new Error('useGraphHealth must be used within a GraphHealthProvider');
  }
  return context;
};
