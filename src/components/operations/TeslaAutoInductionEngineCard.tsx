import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Sparkles, 
  ChevronRight,
  TrendingUp,
  RotateCw,
  Gauge,
  Building2,
  Database
} from 'lucide-react';
import { TenantProfile, SupportedCurrency, SupportedLanguage } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { secureId } from '../../lib/demoMode';

interface TeslaAutoInductionEngineCardProps {
  tenantProfile?: TenantProfile;
  currency?: SupportedCurrency;
  language?: SupportedLanguage;
  onAddAuditRecord?: (record: any) => void;
  onNavigateToDejavu?: () => void;
}

interface AutonomousAction {
  id: string;
  timestamp: string;
  bottleneck: string;
  autoMitigation: string;
  torqueApplied: string;
  ebitdaPreserved: number;
  status: 'EXECUTED' | 'MONITORING';
  agent: string;
}

const SECTOR_DEFAULT_ACTIONS: Record<string, AutonomousAction[]> = {
  manufacturing: [
    {
      id: 'act_mfg_01',
      timestamp: 'Há 2 min',
      bottleneck: 'Fila de Autorização SEFAZ SP (Latência 4.8s / 320 NF-e represadas)',
      autoMitigation: 'Auto-Indução acionou chaveamento assíncrono para contingência DPEC/SCAN sem travar expedição fabril',
      torqueApplied: '+34% Throughput',
      ebitdaPreserved: 42000,
      status: 'EXECUTED',
      agent: 'Fiscal Resonance Agent'
    },
    {
      id: 'act_mfg_02',
      timestamp: 'Há 8 min',
      bottleneck: 'Gargalo em Doca de Recebimento de Aço/Bobinas (SLA D+1 em risco)',
      autoMitigation: 'Redistribuição autônoma de 6 carretas para Cross-Docking secundário com liberação telemétrica',
      torqueApplied: 'Zero Horas de Espera',
      ebitdaPreserved: 18500,
      status: 'EXECUTED',
      agent: 'Fleet Telemetry Swarm'
    },
    {
      id: 'act_mfg_03',
      timestamp: 'Há 21 min',
      bottleneck: 'Concorrência de Conciliação em Lote (1.450 duplicatas simultâneas no ERP)',
      autoMitigation: 'Auto-indução instanciou 8 threads paralelas com algoritmo de hashing harmônico sem lock no ERP',
      torqueApplied: '-82% Tempo de Fechamento',
      ebitdaPreserved: 31000,
      status: 'EXECUTED',
      agent: 'Ledger Harmonizer Agent'
    }
  ],
  healthcare: [
    {
      id: 'act_hc_01',
      timestamp: 'Há 3 min',
      bottleneck: 'Lote de 280 Guias TISS com Risco de Glosa Imediata por Divergência de Código TUSS',
      autoMitigation: 'Motor de Auto-Indução reescreveu de-para semântico e revalidou com regras de operadoras em 400ms',
      torqueApplied: '0% de Glosa Administrativa',
      ebitdaPreserved: 68000,
      status: 'EXECUTED',
      agent: 'Health TISS Guard Agent'
    },
    {
      id: 'act_hc_02',
      timestamp: 'Há 12 min',
      bottleneck: 'Estoque Crítico de OPME & Fármacos de UTI com Descasamento Físico-Contábil',
      autoMitigation: 'Conciliação telemétrica RFID em tempo real liberando consignados para cirurgias eletivas sem travar sala',
      torqueApplied: '+100% Disponibilidade Leitos',
      ebitdaPreserved: 45000,
      status: 'EXECUTED',
      agent: 'Pharma Inventory Swarm'
    },
    {
      id: 'act_hc_03',
      timestamp: 'Há 29 min',
      bottleneck: 'Pico de Emissão de Faturamento Hospitalar Noturno (MV/Tasy)',
      autoMitigation: 'Auto-indução absorveu carga distribuindo requisições em 12 nós virtuais sem degradação do PEP',
      torqueApplied: '-74% Latência de Prontuário',
      ebitdaPreserved: 29000,
      status: 'EXECUTED',
      agent: 'Clinical Core Harmonizer'
    }
  ],
  retail: [
    {
      id: 'act_ret_01',
      timestamp: 'Há 1 min',
      bottleneck: 'Sobrecarga de Checkout Omnichannel (Pico de 4.800 carrinhos/min)',
      autoMitigation: 'Chaveamento dinâmico de adquirentes com menor latência e roteamento em cascata inteligente',
      torqueApplied: '+99.8% Taxa de Conversão',
      ebitdaPreserved: 54000,
      status: 'EXECUTED',
      agent: 'Omni Checkout Engine'
    },
    {
      id: 'act_ret_02',
      timestamp: 'Há 9 min',
      bottleneck: 'Ruptura de Estoque em 14 Lojas Físicas de Alto Giro (Curva A)',
      autoMitigation: 'Auto-indução disparou ordens de transferência entre CDs regionais com roteirização last-mile instantânea',
      torqueApplied: '-60% Tempo de Reposição',
      ebitdaPreserved: 37500,
      status: 'EXECUTED',
      agent: 'Retail Flow Master'
    },
    {
      id: 'act_ret_03',
      timestamp: 'Há 24 min',
      bottleneck: 'Divergência de Conciliação de Vendas PIX & Cartões no Fechamento de Caixa',
      autoMitigation: 'Validação automática de extratos bancários D+0 com clearing instantâneo sem intervenção de tesoureiro',
      torqueApplied: '100% Conciliado D+0',
      ebitdaPreserved: 22000,
      status: 'EXECUTED',
      agent: 'PIX Settlement Guard'
    }
  ],
  services: [
    {
      id: 'act_srv_01',
      timestamp: 'Há 4 min',
      bottleneck: 'Fechamento Mensal de 420 Contratos Recorrentes com Cláusulas Complexas de SLA',
      autoMitigation: 'Auto-indução realizou apuração volumétrica automatizada e emitiu NFS-e com retenções fiscais calculadas',
      torqueApplied: '-90% Tempo de Faturamento',
      ebitdaPreserved: 38000,
      status: 'EXECUTED',
      agent: 'Contract Billing Agent'
    },
    {
      id: 'act_srv_02',
      timestamp: 'Há 15 min',
      bottleneck: 'Pico de Utilização de Servidores Cloud com Risco de Estouro de Orçamento OPEX',
      autoMitigation: 'Desligamento autônomo de instâncias ociosas e consolidação de cargas de trabalho em instâncias reservadas',
      torqueApplied: '-32% Custo de Nuvem',
      ebitdaPreserved: 19500,
      status: 'EXECUTED',
      agent: 'Cloud FinOps Swarm'
    },
    {
      id: 'act_srv_03',
      timestamp: 'Há 32 min',
      bottleneck: 'Concorrência em Base de Conhecimento e APIs de Integração de Clientes Enterprise',
      autoMitigation: 'Clusterização vetorial de consultas com cache semântico de resposta ultrarrápida (sub-50ms)',
      torqueApplied: '+180% Capacidade de Resposta',
      ebitdaPreserved: 26000,
      status: 'EXECUTED',
      agent: 'Semantic Gateway Swarm'
    }
  ],
  agribusiness: [
    {
      id: 'act_agri_01',
      timestamp: 'Há 2 min',
      bottleneck: 'Fila de 45 Carretas de Grãos na Balança Rodoviária de Entrada do Silo',
      autoMitigation: 'Leitura OCR de ticket de pesagem e conciliação telemétrica de umidade disparando emissão de NF de entrada em 3s',
      torqueApplied: '-70% Tempo de Pátio',
      ebitdaPreserved: 48000,
      status: 'EXECUTED',
      agent: 'Agro Silo Telemetry'
    },
    {
      id: 'act_agri_02',
      timestamp: 'Há 11 min',
      bottleneck: 'Oscilação Brusca de Cotação na CBOT durante Fixação de Contratos de Barter',
      autoMitigation: 'Execução autônoma de hedge cambial/commodity e trava de CPR física via assinatura Multi-Sig',
      torqueApplied: '100% Margem Travada',
      ebitdaPreserved: 72000,
      status: 'EXECUTED',
      agent: 'Commodity Hedge Swarm'
    },
    {
      id: 'act_agri_03',
      timestamp: 'Há 28 min',
      bottleneck: 'Alerta de Manutenção Preditiva em 4 Colheitadeiras durante Janela Crítica de Colheita',
      autoMitigation: 'Reescalonamento telemétrico de frentes de colheita e envio expresso de peças pelo centro de distribuição',
      torqueApplied: 'Zero Horas de Plantação Parada',
      ebitdaPreserved: 34000,
      status: 'EXECUTED',
      agent: 'Field Machinery Master'
    }
  ],
  logistics: [
    {
      id: 'act_log_01',
      timestamp: 'Há 3 min',
      bottleneck: 'Bloqueio de Emissão de MDF-e por Divergência de RNTRC e Seguro Carga',
      autoMitigation: 'Auto-Indução sincronizou apólice ativa com averbação automática da seguradora em 1.2s',
      torqueApplied: 'Zero Retenção em Barreira',
      ebitdaPreserved: 39000,
      status: 'EXECUTED',
      agent: 'MDF-e Logistics Guard'
    },
    {
      id: 'act_log_02',
      timestamp: 'Há 14 min',
      bottleneck: 'Desvio de Rota com Consumo Excessivo de Combustível em Frota Pesada',
      autoMitigation: 'Recálculo dinâmico de trajeto via telemetria CAN-Bus evitando pedágios sem perda de prazo de entrega',
      torqueApplied: '-14% Custo Diesel/Km',
      ebitdaPreserved: 28500,
      status: 'EXECUTED',
      agent: 'Fleet Telemetry Swarm'
    },
    {
      id: 'act_log_03',
      timestamp: 'Há 35 min',
      bottleneck: 'Sobrecarga de Cross-Docking em Centro de Distribuição Metropolitano',
      autoMitigation: 'Roteamento autônomo de descargas para docas secundárias com leitura RFID contínua de paletes',
      torqueApplied: '+45% Throughput de Docas',
      ebitdaPreserved: 31000,
      status: 'EXECUTED',
      agent: 'Dock Routing Engine'
    }
  ],
  construction: [
    {
      id: 'act_const_01',
      timestamp: 'Há 5 min',
      bottleneck: 'Atraso na Aprovação de Boletim de Medição de Empreiteiro no Canteiro Principal',
      autoMitigation: 'Cruzamento fotogramétrico de avanço físico por drone com memorial descritivo liberando faturamento',
      torqueApplied: '-85% Ciclo de Medição',
      ebitdaPreserved: 41000,
      status: 'EXECUTED',
      agent: 'Construction Audit Drone'
    },
    {
      id: 'act_const_02',
      timestamp: 'Há 16 min',
      bottleneck: 'Flutuação de Preço do Cimento e Aço Estrutural com Risco de Estouro de Orçamento',
      autoMitigation: 'Disparo de cotação spot em 8 fornecedores com compra programada Just-in-Time garantindo tabela antiga',
      torqueApplied: '-8.5% Custo de Matéria-Prima',
      ebitdaPreserved: 53000,
      status: 'EXECUTED',
      agent: 'Material Procurement Swarm'
    },
    {
      id: 'act_const_03',
      timestamp: 'Há 38 min',
      bottleneck: 'Conflito de Licenças Ambientais e Protocolos de Segurança do Trabalho (NR-18)',
      autoMitigation: 'Validação automática de ASOs e fichas de EPI no ERP antes da entrada na catraca da obra',
      torqueApplied: '100% Conformidade Legal',
      ebitdaPreserved: 25000,
      status: 'EXECUTED',
      agent: 'Safety Compliance Agent'
    }
  ],
  energy: [
    {
      id: 'act_nrg_01',
      timestamp: 'Há 2 min',
      bottleneck: 'Alerta de Corte de Geração (Curtailment) pelo ONS no Parque Solar',
      autoMitigation: 'Auto-Indução acionou banco de baterias BESS e redirecionou excedente para autoprodutores no ACL',
      torqueApplied: 'Zero Desperdício de Energia',
      ebitdaPreserved: 62000,
      status: 'EXECUTED',
      agent: 'Grid Dispatch Optimizer'
    },
    {
      id: 'act_nrg_02',
      timestamp: 'Há 13 min',
      bottleneck: 'Divergência de Apuração de Medição de Energia na CCEE (Horário de Ponta)',
      autoMitigation: 'Reconciliação quântica de telemetria SCADA com SCDE evitando penalidades no MCP',
      torqueApplied: '100% Conformidade CCEE',
      ebitdaPreserved: 47000,
      status: 'EXECUTED',
      agent: 'CCEE Settlement Master'
    },
    {
      id: 'act_nrg_03',
      timestamp: 'Há 31 min',
      bottleneck: 'Superaquecimento em Inversor Central de 2.5MW com Risco de Queima',
      autoMitigation: 'Redistribuição autônoma de carga de strings fotovoltaicas e acionamento de refrigeração forçada',
      torqueApplied: 'Zero Downtime',
      ebitdaPreserved: 36000,
      status: 'EXECUTED',
      agent: 'Substation Invariant Guard'
    }
  ]
};

export const TeslaAutoInductionEngineCard: React.FC<TeslaAutoInductionEngineCardProps> = ({
  tenantProfile,
  currency = 'BRL',
  language = 'pt',
  onAddAuditRecord,
  onNavigateToDejavu
}) => {
  const currentSector = tenantProfile?.sector || 'manufacturing';
  const tenantName = tenantProfile?.name || 'Empresa Ativa';
  const connectedErp = tenantProfile?.connectedErp || 'SAP S/4HANA & Protheus';

  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(true);
  const [loadLevel, setLoadLevel] = useState<number>(76); // % of current transactional load
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [inductionTorque, setInductionTorque] = useState<number>(98.8); // %
  
  // Initialize actions based on active tenant sector
  const [actionsList, setActionsList] = useState<AutonomousAction[]>(() => {
    return SECTOR_DEFAULT_ACTIONS[currentSector] || SECTOR_DEFAULT_ACTIONS.manufacturing;
  });

  // Re-sync actions when sector changes
  useEffect(() => {
    if (SECTOR_DEFAULT_ACTIONS[currentSector]) {
      setActionsList(SECTOR_DEFAULT_ACTIONS[currentSector]);
    }
  }, [currentSector]);

  // Simulate dynamic load fluctuations (Tesla induction field)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSimulatingSpike) {
        setLoadLevel(prev => {
          const delta = (Math.random() - 0.48) * 3;
          return Math.min(95, Math.max(62, Math.round(prev + delta)));
        });
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isSimulatingSpike]);

  const handleSimulateLoadSpike = () => {
    setIsSimulatingSpike(true);
    setLoadLevel(98);
    setInductionTorque(99.9);

    const spikeTemplates: Record<string, { bottleneck: string; mitigation: string; torque: string; ebitda: number }> = {
      manufacturing: {
        bottleneck: `Sobrecarga de Ingestão de Faturas & Ordens de Produção no ${connectedErp.split(' ')[0]} (+150% pico)`,
        mitigation: 'Motor Auto-Induzido absorveu choque: escalou 16 sub-agentes semânticos e priorizou Curva A',
        torque: '+142% Torque Mitigatório',
        ebitda: 65000
      },
      healthcare: {
        bottleneck: `Pico de Entrada de 850 Pacientes de Emergência & Solicitações Cirúrgicas (+180% pico)`,
        mitigation: 'Auto-Indução provisionou 12 instâncias TISS/TUSS e garantiu autorização hospitalar em D+0',
        torque: '+165% Torque Assistencial',
        ebitda: 82000
      },
      retail: {
        bottleneck: `Surto de Pedidos Promocionais Flash (+210% no Checkout Omnichannel)`,
        mitigation: 'Auto-Indução balanceou 3 adquirentes e preveniu timeouts de estoque em tempo real',
        torque: '+190% Conversão de Caixa',
        ebitda: 78000
      },
      agribusiness: {
        bottleneck: `Pico de Descarga em Safra com 120 Carretas Simultâneas no Pátio`,
        mitigation: 'Auto-Indução paralelizou pesagens e emissão de NF de grãos sem fila física',
        torque: '+135% Vazão Logística',
        ebitda: 91000
      },
      logistics: {
        bottleneck: `Sobrecarga Noturna de 3.200 CTe / MDF-e para Liberação de Frotas Interestaduais`,
        mitigation: 'Auto-Indução ativou barramento distribuído e eliminou retenção em postos fiscais',
        torque: '+150% Agilidade de Frota',
        ebitda: 68000
      },
      services: {
        bottleneck: `Pico de Requisições de APIs Enterprise & Fechamento de Timesheets (+140%)`,
        mitigation: 'Auto-Indução distribuiu microsserviços e blindou latência contratual de SLA',
        torque: '+130% Disponibilidade',
        ebitda: 49000
      },
      construction: {
        bottleneck: `Aporte Simultâneo de 45 Notas de Insumos Críticos de Concreto e Aço`,
        mitigation: 'Auto-Indução validou especificações técnicas com BIM e liberou pagamento sem glosas',
        torque: '+140% Eficiência de Obra',
        ebitda: 58000
      },
      energy: {
        bottleneck: `Pico de Sobretensão na Subestação com Alerta de Penalidade ONS`,
        mitigation: 'Auto-Indução modulou inversores e armazenou 4.8 MWh em baterias sem corte de receita',
        torque: '+175% Estabilidade Elétrica',
        ebitda: 89000
      }
    };

    const template = spikeTemplates[currentSector] || spikeTemplates.manufacturing;

    setTimeout(() => {
      const newAction: AutonomousAction = {
        id: `act_ind_${Date.now()}`,
        timestamp: 'Agora mesmo',
        bottleneck: template.bottleneck,
        autoMitigation: template.mitigation,
        torqueApplied: template.torque,
        ebitdaPreserved: template.ebitda,
        status: 'EXECUTED',
        agent: 'Tesla Induction Master'
      };

      setActionsList(prev => [newAction, ...prev.slice(0, 4)]);
      setIsSimulatingSpike(false);
      setLoadLevel(81);
      setInductionTorque(98.9);

      if (onAddAuditRecord) {
        onAddAuditRecord({
          id: `audit_ind_${Date.now()}`,
          timestamp: new Date().toISOString(),
          decisionType: 'AUTONOMOUS_LOAD_INDUCTION_REACTION',
          description: `Auto-Indução Operacional Tesla (${tenantName}): Absorção de pico de carga transacional (+150%) com proteção de ${formatCurrency(template.ebitda, currency as SupportedCurrency, language as SupportedLanguage)} em EBITDA.`,
          agentsInvolved: ['Tesla Induction Master', 'Fiscal Resonance Agent', 'Autonomous Swarm'],
          status: 'COMMITTED',
          merkleHash: `0xTeslaInd_${secureId('', 4).toUpperCase()}`
        });
      }
    }, 1200);
  };

  const totalPreserved = actionsList.reduce((acc, a) => acc + a.ebitdaPreserved, 0);

  return (
    <div id="card-tesla-auto-induction-engine" className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 shadow-xl transition-all space-y-4">
      
      {/* Header with Tesla Badge and Tenant Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                Motor de Eficiência Operacional Auto-Induzido
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 uppercase">
                Princípio de Tesla
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {tenantProfile?.sectorLabel || currentSector}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tenant: <strong className="text-slate-200">{tenantName}</strong> ({tenantProfile?.cnpj || '54.218.990/0001-44'}) • Conexão: <span className="text-cyan-400 font-mono">{connectedErp}</span>. Quanto maior a carga de dados, maior o contra-torque autônomo gerado.
            </p>
          </div>
        </div>

        {/* Mode Toggle & Load Simulator */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsAutonomousMode(!isAutonomousMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isAutonomousMode 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-900/30' 
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isAutonomousMode ? 'bg-[var(--vx-neon-green)] animate-ping' : 'bg-amber-400'}`} />
            <span>{isAutonomousMode ? 'Auto-Indução: ATIVA' : 'Supervisionado'}</span>
          </button>
          
          <button
            onClick={handleSimulateLoadSpike}
            disabled={isSimulatingSpike}
            className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Simular pico de sobrecarga operacional de +150% para ver o motor auto-induzido amortecer gargalos instantaneamente"
          >
            {isSimulatingSpike ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
            ) : (
              <RotateCw className="w-3.5 h-3.5" />
            )}
            <span>Simular Pico (+150%)</span>
          </button>

          {onNavigateToDejavu && (
            <button
              onClick={onNavigateToDejavu}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Ir para o Radar de Anomalias e Déjà Vu"
            >
              <span>CyberSpy & Déjà Vu ➔</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Gauges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Metric 1: Eficiência de Auto-Indução */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Eficiência Auto-Induzida
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-cyan-300 font-mono tracking-tight">
                {inductionTorque.toFixed(1)}%
              </span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 inline mr-0.5" />
                Nominal
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Campo magnético operacional ativo
            </span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Gauge className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Carga Transacional em Tempo Real */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Carga Transacional ({connectedErp.split(' ')[0]})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-100 font-mono tracking-tight">
                {loadLevel}%
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {(loadLevel * 124).toLocaleString('pt-BR')} ops/min
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  loadLevel > 90 ? 'bg-rose-500' : loadLevel > 75 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${loadLevel}%` }}
              />
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: EBITDA Preservado por Auto-Ações */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              EBITDA Preservado ({tenantName.split(' ')[0]})
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[var(--vx-neon-green)] font-mono tracking-tight">
                {formatCurrency(totalPreserved, currency as SupportedCurrency, language as SupportedLanguage)}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono block">
              {actionsList.length} mitigações instantâneas
            </span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-[var(--vx-neon-green)] border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Live Feed: Ações Autônomas Tomadas pelo Motor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
            Ações de Mitigação Auto-Induzidas em Tempo Real ({tenantProfile?.sectorLabel || currentSector})
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Zero Intervenção Manual Humana • Ledger Ativo
          </span>
        </div>

        <div className="space-y-2">
          {actionsList.map((action) => (
            <div 
              key={action.id}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[var(--vx-neon-green)]" />
                    {action.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {action.timestamp}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    • Agente: {action.agent}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/60 px-1.5 rounded border border-amber-800/60">
                    {action.torqueApplied}
                  </span>
                </div>
                <p className="text-slate-300 font-medium text-[11px]">
                  <strong className="text-slate-100">{action.bottleneck}</strong> ➔ {action.autoMitigation}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase block font-mono">Margem Salva</span>
                  <span className="font-mono font-black text-[var(--vx-neon-green)] text-xs">
                    +{formatCurrency(action.ebitdaPreserved, currency as SupportedCurrency, language as SupportedLanguage)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
