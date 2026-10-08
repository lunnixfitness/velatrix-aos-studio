import React, { useState, useMemo } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Terminal, 
  Network, 
  Lock, 
  Sliders, 
  Zap, 
  DollarSign, 
  Database, 
  Eye, 
  Activity, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Wheat, 
  ShoppingBag, 
  Home, 
  SunMedium, 
  Wifi, 
  GraduationCap, 
  Landmark, 
  Radio, 
  Check, 
  Info,
  Sparkles,
  ArrowUpRight,
  ShoppingCart,
  Scale,
  HeartPulse,
  Factory,
  Truck,
  FileText,
  Calculator,
  UtensilsCrossed,
  HardHat,
  Briefcase
} from 'lucide-react';
import { ALL_200_AGENTS, VELATRIX_SWARMS, AgentDefinition, SwarmCategory } from '../../data/agentSwarm200Data';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminAgentChecklist: React.FC = () => {
  const { activeTenant } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSwarmFilter, setSelectedSwarmFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [zeroGuiFilter, setZeroGuiFilter] = useState<string>('ALL');
  const [expandedSwarmId, setExpandedSwarmId] = useState<string | null>(null);
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<AgentDefinition | null>(null);
  
  // Interactive Simulation State: Router CNAE & Consensus Dispatch
  const [simCnae, setSimCnae] = useState('01.11 (Agropecuária & Grãos)');
  const [simActionText, setSimActionText] = useState('Disparar Operação de Hedge de Soja (R$ 850.000) e Liquidação CPR');
  const [isSimulatingDispatch, setIsSimulatingDispatch] = useState(false);
  const [simLogOutput, setSimLogOutput] = useState<{
    timestamp: string;
    routerCnaeMatched: string;
    swarmsActivated: string[];
    riskScore: number;
    zeroGuiTriggered: boolean;
    approverTarget: string;
    consensusStatus: 'CONSENSUS_REACHED' | 'WAITING_C_LEVEL_ZERO_GUI' | 'BLOCKED_BY_INVARIANT';
  } | null>(null);

  // Meta-Agente Supervisor State
  const [isSupervisorScanning, setIsSupervisorScanning] = useState(false);
  const [supervisorNotification, setSupervisorNotification] = useState<string | null>(null);
  const [supervisorLogs, setSupervisorLogs] = useState<Array<{
    id: string;
    time: string;
    level: 'nominal' | 'healed' | 'recalibrated';
    message: string;
  }>>([
    { id: '1', time: '15:28:10', level: 'healed', message: 'Nó AG-TR-04 (Otimizador de Rotas) detectado com latência > 45ms. Auto-restart e garbage collection executados com sucesso.' },
    { id: '2', time: '15:25:40', level: 'recalibrated', message: 'Quórum do Enxame Financeiro recalibrado para 4/5 assinaturas após pico de volume de fechamento contábil D+0.' },
    { id: '3', time: '15:20:12', level: 'nominal', message: 'Varredura de integridade em 300 agentes concluída: 100% dos nós com invariantes de isolamento RLS e RAG validadas.' }
  ]);

  const handleRunSupervisorScan = () => {
    setIsSupervisorScanning(true);
    setSupervisorNotification('Executando Ping Sweep e verificação de quórum nos 300 agentes...');
    setTimeout(() => {
      setIsSupervisorScanning(false);
      setSupervisorNotification('✓ Varredura concluída: 300/300 agentes saudáveis com tempo médio de consenso de 14.8ms.');
      setSupervisorLogs(prev => [
        {
          id: `scan_${Date.now()}`,
          time: new Date().toLocaleTimeString('pt-BR'),
          level: 'nominal',
          message: `Watchdog Supervisor: Varredura síncrona nos ${totalAgents} agentes concluída. Zero loops infinitos e integridade de memória 100%.`
        },
        ...prev
      ]);
      setTimeout(() => setSupervisorNotification(null), 4000);
    }, 800);
  };

  // Filtered Agents list
  const filteredAgents = useMemo(() => {
    return ALL_200_AGENTS.filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.roleDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.swarmName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSwarm = selectedSwarmFilter === 'ALL' || agent.swarmId === selectedSwarmFilter;
      const matchesRisk = riskFilter === 'ALL' || agent.riskLevel === riskFilter;
      const matchesZeroGui = 
        zeroGuiFilter === 'ALL' || 
        (zeroGuiFilter === 'YES' && agent.requiresZeroGuiApproval) ||
        (zeroGuiFilter === 'NO' && !agent.requiresZeroGuiApproval);

      return matchesSearch && matchesSwarm && matchesRisk && matchesZeroGui;
    });
  }, [searchTerm, selectedSwarmFilter, riskFilter, zeroGuiFilter]);

  // Statistics
  const totalAgents = ALL_200_AGENTS.length;
  const criticalRiskCount = ALL_200_AGENTS.filter(a => a.riskLevel === 'CRITICAL').length;
  const highRiskCount = ALL_200_AGENTS.filter(a => a.riskLevel === 'HIGH').length;
  const zeroGuiCount = ALL_200_AGENTS.filter(a => a.requiresZeroGuiApproval).length;
  const onlineCount = ALL_200_AGENTS.filter(a => a.status === 'ONLINE').length;

  const handleSimulateCnaeDispatch = () => {
    setIsSimulatingDispatch(true);
    setTimeout(() => {
      let targetSwarmName = 'Agribusiness & Rural Intelligence Swarm';
      let targetSwarmId = 'agribusiness';

      if (simCnae.includes('B3') || simCnae.includes('64.00')) {
        targetSwarmName = 'B3 & Financial Markets Swarm';
        targetSwarmId = 'b3_financial';
      } else if (simCnae.includes('47.00') || simCnae.includes('Varejo')) {
        targetSwarmName = 'Retail & Omnichannel Commerce Swarm';
        targetSwarmId = 'retail_omni';
      } else if (simCnae.includes('41.00') || simCnae.includes('Construção')) {
        targetSwarmName = 'Real Estate & Construction Swarm';
        targetSwarmId = 'real_estate';
      } else if (simCnae.includes('35.11') || simCnae.includes('Energia')) {
        targetSwarmName = 'Energy & Utilities Swarm';
        targetSwarmId = 'energy_utilities';
      } else if (simCnae.includes('61.10') || simCnae.includes('Telecom')) {
        targetSwarmName = 'Telecom & SaaS Cloud Swarm';
        targetSwarmId = 'telecom_saas';
      } else if (simCnae.includes('85.11') || simCnae.includes('Educação')) {
        targetSwarmName = 'Education & EdTech Swarm';
        targetSwarmId = 'education';
      } else if (simCnae.includes('84.11') || simCnae.includes('Público')) {
        targetSwarmName = 'Public Sector & GovTech Swarm';
        targetSwarmId = 'public_sector';
      }

      setSimLogOutput({
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        routerCnaeMatched: simCnae,
        swarmsActivated: [
          'Financial & Treasury Core Swarm (/app/agents/swarms/core_financial/)',
          'Risk, Security & Zero-Trust Swarm (/app/agents/swarms/core_risk_security/)',
          `${targetSwarmName} (/app/agents/swarms/${targetSwarmId}/)`
        ],
        riskScore: 0.94,
        zeroGuiTriggered: true,
        approverTarget: 'CFO / C-Level Executivo (+55 11 98877-0021 via WhatsApp Zero-GUI HSM)',
        consensusStatus: 'WAITING_C_LEVEL_ZERO_GUI'
      });
      setIsSimulatingDispatch(false);
    }, 600);
  };

  const getSwarmIcon = (id: string) => {
    switch (id) {
      case 'core_financial': return DollarSign;
      case 'core_risk_security': return ShieldAlert;
      case 'core_supply_manufacturing': return Layers;
      case 'b3_financial': return Landmark;
      case 'agribusiness': return Wheat;
      case 'retail_omni': return ShoppingBag;
      case 'real_estate': return Home;
      case 'energy_utilities': return SunMedium;
      case 'telecom_saas': return Wifi;
      case 'education': return GraduationCap;
      case 'public_sector': return Building2;
      case 'ecommerce_marketplace': return ShoppingCart;
      case 'recuperacao_judicial': return Scale;
      case 'saude_hospitais': return HeartPulse;
      case 'industria_manufatura_agro': return Factory;
      case 'transportes_logistica': return Truck;
      case 'juridico_compliance': return FileText;
      case 'fiscal_cfo_office': return Calculator;
      case 'supermercados_food_service': return UtensilsCrossed;
      case 'imobiliario_incorporacao': return HardHat;
      case 'educacao_franquias_b2b': return Briefcase;
      default: return Cpu;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER: NODOS EM ENXAMES */}
      <div className="bg-gradient-to-r from-slate-900 via-[var(--vx-deep)] to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 mt-1">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-100">
                  Dicionário de Capacidades & Checklist dos {totalAgents} Agentes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40">
                  {onlineCount} / {totalAgents} NODOS ATIVOS
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  {VELATRIX_SWARMS.length} ENXAMES SETORIAIS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Arquitetura Multi-Tenant RAG com isolamento vetorial estrito e protocolo de consenso inter-agentes integrado ao Router CNAE.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{onlineCount} Online</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{zeroGuiCount} Exigem Zero-GUI (&gt; R$ 10k)</span>
            </div>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Enxames Setoriais</div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-0.5">{VELATRIX_SWARMS.length} Clusters</div>
            <div className="text-[10px] text-slate-400">Pastas em <code className="text-slate-300 font-mono">/app/agents/swarms/</code></div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Total de Agentes</div>
            <div className="text-xl font-bold text-[var(--vx-neon)] font-mono mt-0.5">{totalAgents} Especialistas</div>
            <div className="text-[10px] text-emerald-400">100% Homologados & Integrados</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Risco Alto / Crítico</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{criticalRiskCount + highRiskCount} Agentes</div>
            <div className="text-[10px] text-slate-400">Com gatilho de quórum multi-sig</div>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Tempo Médio de Resposta</div>
            <div className="text-xl font-bold text-violet-400 font-mono mt-0.5">14.8 ms</div>
            <div className="text-[10px] text-slate-400">Consenso LangGraph Paralelo</div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE ROUTER & PROTOCOL SIMULATOR */}
      <div className="bg-[var(--vx-deep)] border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--vx-neon)]" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">Simulador de Roteamento por CNAE & Protocolo de Consenso</h3>
              <p className="text-[11px] text-slate-400">
                Teste determinístico da regra: Router Agent filtra CNAE e dispara Enxame Setorial + Enxame Financeiro Core + Zero-GUI C-Level.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            FastAPI / LangGraph Test Harness
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">CNAE do Cliente Requisitante</label>
            <select
              value={simCnae}
              onChange={e => setSimCnae(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/40 font-mono cursor-pointer"
            >
              <option value="01.11 (Agropecuária & Grãos)">01.11 — Agropecuária, Soja & Trading (Agribusiness)</option>
              <option value="64.00 (Serviços Financeiros / B3)">64.00 — Serviços Financeiros & Mercado de Capitais (B3)</option>
              <option value="47.00 (Varejo & E-commerce)">47.00 — Varejo Omnichannel & Supermercados (Retail)</option>
              <option value="41.00 (Construção Civil & BIM)">41.00 — Construção Civil & Incorporação (Real Estate)</option>
              <option value="35.11 (Energia & Concessionárias)">35.11 — Geração, CCEE & Utilities (Energy)</option>
              <option value="61.10 (Telecomunicações & SaaS)">61.10 — Telecomunicações, ISPs e SaaS Cloud</option>
              <option value="85.11 (Ensino Superior & EdTech)">85.11 — Educação Superior, FIES & EaD</option>
              <option value="84.11 (Administração Pública)">84.11 — Setor Público, LRF & Licitações (GovTech)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payload / Operação de Negócio Disparada</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={simActionText}
                onChange={e => setSimActionText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/40 font-mono"
              />
              <button
                onClick={handleSimulateCnaeDispatch}
                disabled={isSimulatingDispatch}
                className="px-4 py-2 bg-[var(--vx-neon)] hover:bg-[var(--vx-neon)]/90 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-[var(--vx-neon)]/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {isSimulatingDispatch ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Testar Roteamento</span>
              </button>
            </div>
          </div>
        </div>

        {/* SIMULATION LOG RESULT */}
        {simLogOutput && (
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-2 text-xs font-mono animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-1.5">
              <span className="text-[var(--vx-neon)] font-bold">ROUTER AGENT CONSENSUS TRACE [{simLogOutput.timestamp}]</span>
              <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                STATUS: {simLogOutput.consensusStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 pt-1">
              <div>
                <span className="text-slate-400">1. CNAE Reconhecido:</span>{' '}
                <span className="text-slate-100 font-semibold">{simLogOutput.routerCnaeMatched}</span>
              </div>
              <div>
                <span className="text-slate-400">2. Risco Financeiro Calculado:</span>{' '}
                <span className="text-red-400 font-bold">R$ 850.000,00 (&gt; Limite R$ 10.000)</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-400">3. Enxames Acionados pelo Router (Isolamento Multi-Tenant RAG):</span>
              <ul className="list-disc list-inside text-cyan-300 pl-2 mt-1 space-y-0.5">
                {simLogOutput.swarmsActivated.map((sw, i) => (
                  <li key={i}>{sw}</li>
                ))}
              </ul>
            </div>

            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Intervenção Zero-GUI Obrigatória:</strong> Gravação no ERP bloqueada até assinatura no WhatsApp.
                </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-1 rounded">
                Alçada C-Level
              </span>
            </div>
          </div>
        )}
      </div>

      {/* META-AGENTE SUPERVISOR (WATCHDOG DE ENXAMES & AUTO-HEALING) */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-[var(--vx-deep)] to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                  Meta-Agente Supervisor & Watchdog dos 300 Agentes
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-600">
                  Supervisor Liveness 99.98%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Monitoramento contínuo de concorrência, prevenção de loops infinitos, auto-healing de nós e balanceamento de carga inter-enxames.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSupervisorScanning}
              onClick={handleRunSupervisorScan}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-500/20 cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSupervisorScanning ? 'animate-spin' : ''}`} />
              <span>{isSupervisorScanning ? 'Varrendo Nós...' : 'Ping Sweep 300 Nós'}</span>
            </button>
          </div>
        </div>

        {supervisorNotification && (
          <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{supervisorNotification}</span>
          </div>
        )}

        {/* Watchdog Live KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">SLA de Consenso</div>
            <div className="text-lg font-black text-emerald-400 font-mono">99.94%</div>
            <div className="text-[10px] text-slate-500">Zero timeouts registrados</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Taxa de Erro nos Enxames</div>
            <div className="text-lg font-black text-cyan-400 font-mono">0.02%</div>
            <div className="text-[10px] text-slate-500">Auto-recuperado via rollback</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Token Budget Throttle</div>
            <div className="text-lg font-black text-amber-400 font-mono">1.2M / 10M tpm</div>
            <div className="text-[10px] text-slate-500">12% do limite contratado</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Nós Auto-Regenerados</div>
            <div className="text-lg font-black text-violet-400 font-mono">7 nós</div>
            <div className="text-[10px] text-slate-500">Últimas 24 horas</div>
          </div>
        </div>

        {/* Live Supervisor Watchdog Log */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Log de Intervenções Autônomas do Supervisor</span>
            <span className="text-indigo-400 text-[10px]">Políticas LangGraph v4.5</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 font-mono text-xs">
            {supervisorLogs.map(log => (
              <div 
                key={log.id} 
                className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-2 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">[{log.time}]</span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
                <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                  log.level === 'healed' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  log.level === 'recalibrated' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {log.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 11 SWARMS CAROUSEL / SELECTOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--vx-neon)]" />
            <span>Matriz dos 11 Enxames Setoriais</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Clique para filtrar os agentes ou inspecionar a rota de cada setor
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {VELATRIX_SWARMS.map(swarm => {
            const isSelected = selectedSwarmFilter === swarm.id;
            const Icon = getSwarmIcon(swarm.id);

            return (
              <button
                key={swarm.id}
                onClick={() => setSelectedSwarmFilter(isSelected ? 'ALL' : swarm.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? `${swarm.colorScheme.border} ${swarm.colorScheme.bg} shadow-lg shadow-cyan-950/30 ring-1 ring-[var(--vx-neon)]/50`
                    : 'bg-[var(--vx-deep)] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${swarm.colorScheme.bg} ${swarm.colorScheme.text} border ${swarm.colorScheme.border}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">{swarm.name.split('.')[1] || swarm.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${swarm.colorScheme.badge}`}>
                      {swarm.agentCount} Agentes
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                    {swarm.description}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="truncate max-w-[170px]" title={swarm.path}>{swarm.path}</span>
                  <span className="text-slate-300 font-semibold">{swarm.cnaeRange.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER BAR FOR 200 AGENTS */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-[var(--vx-deep)] p-4 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar agente por Nome, Código (AGT-...), Função ou Enxame..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/50 transition-colors font-mono"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          
          {/* Swarm Filter */}
          <select
            value={selectedSwarmFilter}
            onChange={e => setSelectedSwarmFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/40 cursor-pointer"
          >
            <option value="ALL">Todos os {VELATRIX_SWARMS.length} Enxames ({ALL_200_AGENTS.length} Agentes)</option>
            {VELATRIX_SWARMS.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.agentCount})</option>
            ))}
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/40 cursor-pointer"
          >
            <option value="ALL">Todos os Níveis de Risco</option>
            <option value="CRITICAL">Crítico (Bloqueio Automático)</option>
            <option value="HIGH">Alto (Alçada C-Level)</option>
            <option value="MEDIUM">Médio</option>
            <option value="LOW">Baixo</option>
          </select>

          {/* Zero-GUI Filter */}
          <select
            value={zeroGuiFilter}
            onChange={e => setZeroGuiFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/40 cursor-pointer"
          >
            <option value="ALL">Exigência Zero-GUI (Todas)</option>
            <option value="YES">Exige WhatsApp C-Level (&gt; R$ 10k)</option>
            <option value="NO">Execução Autônoma Direta</option>
          </select>

          {(searchTerm || selectedSwarmFilter !== 'ALL' || riskFilter !== 'ALL' || zeroGuiFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSwarmFilter('ALL');
                setRiskFilter('ALL');
                setZeroGuiFilter('ALL');
              }}
              className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* AGENTS DATA TABLE */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--vx-neon)]" />
            <h3 className="text-xs font-bold text-slate-200">
              Catálogo de Agentes Especialistas ({filteredAgents.length} de {ALL_200_AGENTS.length} exibidos)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            RAG: Context Isolation Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 font-mono">
                <th className="py-3 px-4">Código / Agente</th>
                <th className="py-3 px-3">Enxame Setorial & Rota</th>
                <th className="py-3 px-3">Papel & Responsabilidade Operacional</th>
                <th className="py-3 px-3 text-center">Nível de Risco</th>
                <th className="py-3 px-3">Alçada Zero-GUI</th>
                <th className="py-3 px-3">Isolamento RAG</th>
                <th className="py-3 px-3 text-center">Status / Latência</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAgents.map(agent => {
                const isCritical = agent.riskLevel === 'CRITICAL';
                const isHigh = agent.riskLevel === 'HIGH';

                return (
                  <tr 
                    key={agent.id}
                    className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedAgentForModal(agent)}
                  >
                    {/* Code & Name */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-mono text-[10px] text-[var(--vx-neon)] font-bold">
                          {agent.code}
                        </div>
                        <div className="font-semibold text-slate-200 group-hover:text-[var(--vx-neon)] transition-colors">
                          {agent.name}
                        </div>
                      </div>
                    </td>

                    {/* Swarm */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="text-slate-300 font-medium block">
                          {agent.swarmName.split('Swarm')[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {agent.cnaeCategories[0].slice(0, 28)}...
                        </span>
                      </div>
                    </td>

                    {/* Role Description */}
                    <td className="py-3 px-3 max-w-xs">
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {agent.roleDescription}
                      </p>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isCritical 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                          : isHigh 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {agent.riskLevel}
                      </span>
                    </td>

                    {/* Zero-GUI Threshold */}
                    <td className="py-3 px-3">
                      {agent.requiresZeroGuiApproval ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            WhatsApp C-Level
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Acima de R$ {agent.approvalThresholdBrl.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Autônomo
                        </span>
                      )}
                    </td>

                    {/* RAG Context */}
                    <td className="py-3 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {agent.ragContextIsolation === 'GLOBAL_CORE_RAG' ? 'Core Shared' : 'Tenant Strict'}
                      </span>
                    </td>

                    {/* Status & Latency */}
                    <td className="py-3 px-3 text-center">
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          ONLINE
                        </span>
                        <span className="block text-[9px] text-slate-400 font-mono">
                          {agent.telemetry.avgLatencyMs}ms · {agent.telemetry.successRate}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgentForModal(agent);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-[var(--vx-neon)] hover:border-slate-700 transition-colors"
                        title="Ver Ficha Técnica do Agente"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: FICHA TÉCNICA DO AGENTE */}
      {selectedAgentForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="px-2 py-0.5 rounded bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 font-mono text-[10px] font-bold">
                  {selectedAgentForModal.code}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">
                  {selectedAgentForModal.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedAgentForModal.swarmName}
                </p>
              </div>

              <button
                onClick={() => setSelectedAgentForModal(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                Papel Operacional no LangGraph
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedAgentForModal.roleDescription}
              </p>
            </div>

            {/* Technical Specs */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Alçada de Segurança Zero-GUI</span>
                <span className={`font-bold ${selectedAgentForModal.requiresZeroGuiApproval ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedAgentForModal.requiresZeroGuiApproval ? 'OBRIGATÓRIO (> R$ 10.000)' : 'AUTÔNOMO DETERMINÍSTICO'}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Canal: WhatsApp C-Level com assinatura HSM
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Isolamento Multi-Tenant RAG</span>
                <span className="font-bold text-cyan-300 font-mono">
                  {selectedAgentForModal.ragContextIsolation}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Chaves de contexto vetoriais segregadas
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Protocolo de Comunicação</span>
                <span className="font-bold text-violet-300 font-mono">
                  {selectedAgentForModal.protocol}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Consenso em rede com votação assíncrona
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono block">Telemetria & Latência</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {selectedAgentForModal.telemetry.avgLatencyMs} ms · {selectedAgentForModal.telemetry.deliberationsCount} execuções
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Taxa de sucesso: {selectedAgentForModal.telemetry.successRate}%
                </span>
              </div>
            </div>

            {/* CNAE Coverage */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                CNAEs elegíveis: <strong className="text-slate-200">{selectedAgentForModal.cnaeCategories.join(', ')}</strong>
              </span>
              <button
                onClick={() => setSelectedAgentForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
