import React, { useState, useMemo } from 'react';
import { 
  StrategicHub, 
  MicroAgentDefinition, 
  RouterDispatchResult 
} from '../../types/autonomousSwarm';
import { getMicroAgentsByHub } from '../../data/swarmHubsCatalog';
import { swarmRouter } from '../../services/swarmRouterService';
import { PgfnCapagDiagnosisCard } from './PgfnCapagDiagnosisCard';
import { SalaoParceiroContractCard } from './SalaoParceiroContractCard';
import { 
  X, 
  Search, 
  Zap, 
  Cpu, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  DollarSign,
  Scale,
  Scissors
} from 'lucide-react';

interface StrategicHubDetailModalProps {
  hub: StrategicHub;
  onClose: () => void;
  onDispatchEvent: (result: RouterDispatchResult) => void;
}

export const StrategicHubDetailModal: React.FC<StrategicHubDetailModalProps> = ({
  hub,
  onClose,
  onDispatchEvent
}) => {
  const allAgents = useMemo(() => getMicroAgentsByHub(hub.id), [hub.id]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [executingAgentId, setExecutingAgentId] = useState<string | null>(null);
  const [simulateTimeout, setSimulateTimeout] = useState<boolean>(false);
  const [latestDispatch, setLatestDispatch] = useState<RouterDispatchResult | null>(null);
  const [showSpecializedModule, setShowSpecializedModule] = useState<boolean>(false);

  const filteredAgents = useMemo(() => {
    return allAgents.filter(agent => {
      if (selectedSubCategory !== 'all' && agent.subCategory !== selectedSubCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = agent.name.toLowerCase().includes(q);
        const matchesCode = agent.codeName.toLowerCase().includes(q);
        const matchesDesc = agent.description.toLowerCase().includes(q);
        const matchesKw = agent.triggerKeywords.some(k => k.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesDesc && !matchesKw) {
          return false;
        }
      }
      return true;
    });
  }, [allAgents, selectedSubCategory, searchQuery]);

  const activeCount = allAgents.filter(a => a.status === 'ACTIVE' || a.runtimeMode === 'CONTAINER_WARM').length;
  const standbyCount = allAgents.length - activeCount;

  const handleTestAgent = (agent: MicroAgentDefinition) => {
    setExecutingAgentId(agent.id);

    setTimeout(async () => {
      const result = await swarmRouter.dispatchEvent({
        title: `Simulação de Evento Operacional via Barramento ERP: ${agent.name}`,
        description: `Disparo manual sob demanda para teste de integridade e quórum do trabalhador ${agent.codeName}.`,
        sourceSystem: 'ERP_TOTVS',
        payload: {
          microAgentId: agent.id,
          subCategory: agent.subCategory,
          timestamp: new Date().toISOString()
        },
        forceTimeoutFailure: simulateTimeout
      });

      setLatestDispatch(result);
      onDispatchEvent(result);
      setExecutingAgentId(null);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{ backgroundColor: `${hub.color}15`, borderColor: `${hub.color}40`, color: hub.color }}
            >
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {hub.code}
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cluster Saudável
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {hub.name}
              </h2>
              <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
                {hub.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar Sub-Swarm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hub Aggregated Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-950/60 border-b border-slate-800/80 shrink-0 text-xs">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Total Especialistas</span>
            <span className="text-lg font-bold text-white font-mono">{allAgents.length}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Micro-agentes</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Instâncias Ativas</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">{activeCount}</span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">Warm Containers</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Serverless Standby</span>
            <span className="text-lg font-bold text-cyan-400 font-mono">{standbyCount}</span>
            <span className="text-[10px] text-cyan-400/80 block mt-0.5">Lazy Load Sob Demanda</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Throughput Eventos</span>
            <span className="text-lg font-bold text-slate-200 font-mono">
              {hub.eventsProcessedCount.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Disparos no barramento</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Economia Gerada</span>
            <span className="text-lg font-bold text-emerald-400 font-mono truncate block">
              R$ {(hub.totalEconomyBrl / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">R$ {hub.totalEconomyBrl.toLocaleString('pt-BR')}</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[11px]">Sangria Mitigada</span>
            <span className="text-lg font-bold text-rose-400 font-mono truncate block">
              R$ {(hub.totalBleedMitigatedBrl / 1000).toFixed(1)}k
            </span>
            <span className="text-[10px] text-rose-400/80 block mt-0.5">Bloqueios & Travas</span>
          </div>
        </div>

        {/* Dispatch Feedback / Live Log Banner (if just triggered) */}
        {latestDispatch && (
          <div className={`p-3.5 mx-4 mt-4 rounded-xl border text-xs flex items-start justify-between gap-3 ${
            latestDispatch.executionStatus === 'REDIRECTED_TO_CORE_MASTER'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : latestDispatch.executionStatus === 'MULTI_SIG_TRIGGERED'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {latestDispatch.executionStatus === 'REDIRECTED_TO_CORE_MASTER' ? (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block text-[13px]">
                  {latestDispatch.executionStatus === 'REDIRECTED_TO_CORE_MASTER'
                    ? 'Fallback Acionado: Redirecionado ao Velatrix Core Master (Human-In-The-Loop)'
                    : 'Ação Autônoma Concluída e Gravada no Ledger SHA-256'}
                </span>
                <div className="font-mono text-[11px] mt-1 text-slate-300 bg-slate-950/50 px-2 py-1 rounded">
                  {latestDispatch.formattedLiveLog}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400 font-mono">
                  <span>Hash: {latestDispatch.ledgerHash.slice(0, 18)}...</span>
                  <span>Latência: {latestDispatch.executionTimeMs}ms</span>
                  <span>Modo: {latestDispatch.runtimeMode}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setLatestDispatch(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Controls: Search, Category Filter, and Fallback Simulation Toggle */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, UF, SKU ou NCM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                checked={simulateTimeout}
                onChange={(e) => setSimulateTimeout(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/20"
              />
              <span className="text-[11px] flex items-center gap-1 text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Simular Timeout ➔ Fallback Core (HITL)
              </span>
            </label>

            <span className="text-xs text-slate-400 font-mono">
              Mostrando {filteredAgents.length} de {allAgents.length}
            </span>
          </div>
        </div>

        {/* Banner para HUB-01-FISCAL e HUB-07-HR */}
        {hub.code === 'HUB-01-FISCAL' && (
          <div className="px-4 py-2.5 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-emerald-300">
              <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Módulo Especializado:</strong> Diagnóstico PGFN/CAPAG (Transação Excepcional com até 70% de desconto)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSpecializedModule(!showSpecializedModule)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer"
            >
              {showSpecializedModule ? 'Ocultar Diagnóstico' : 'Abrir Diagnóstico PGFN'}
            </button>
          </div>
        )}

        {hub.code === 'HUB-07-HR' && (
          <div className="px-4 py-2.5 bg-blue-950/40 border-b border-blue-500/30 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-blue-300">
              <Scissors className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                <strong>Módulo Especializado:</strong> Motor de Contrato da Lei do Salão Parceiro (Lei 13.352/2016)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowSpecializedModule(!showSpecializedModule)}
              className="px-2.5 py-1 rounded-lg bg-blue-500 text-slate-950 font-bold hover:bg-blue-400 transition-colors shrink-0 cursor-pointer"
            >
              {showSpecializedModule ? 'Ocultar Contrato' : 'Abrir Motor de Contrato'}
            </button>
          </div>
        )}

        {showSpecializedModule && hub.code === 'HUB-01-FISCAL' && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 max-h-[60vh] overflow-y-auto">
            <PgfnCapagDiagnosisCard />
          </div>
        )}

        {showSpecializedModule && hub.code === 'HUB-07-HR' && (
          <div className="p-4 bg-slate-950 border-b border-slate-800 max-h-[60vh] overflow-y-auto">
            <SalaoParceiroContractCard />
          </div>
        )}

        {/* Subcategories Filter Bar */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setSelectedSubCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSubCategory === 'all'
                ? 'bg-cyan-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Todos ({allAgents.length})
          </button>
          {hub.subCategories.map(subCat => {
            const count = allAgents.filter(a => a.subCategory === subCat).length;
            const isSelected = selectedSubCategory === subCat;
            return (
              <button
                key={subCat}
                onClick={() => setSelectedSubCategory(subCat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {subCat} ({count})
              </button>
            );
          })}
        </div>

        {/* Micro-Agents Scrollable Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredAgents.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum micro-agente localizado com os filtros atuais.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedSubCategory('all'); }}
                className="mt-2 text-xs text-cyan-400 underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredAgents.map(agent => {
                const isWarm = agent.runtimeMode === 'CONTAINER_WARM' || agent.status === 'ACTIVE';
                const isExecuting = executingAgentId === agent.id;

                return (
                  <div
                    key={agent.id}
                    className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between bg-slate-900/80 hover:bg-slate-800/90 ${
                      isWarm ? 'border-slate-700/80 hover:border-cyan-500/50' : 'border-slate-800/80 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Card Top: CodeName & Runtime Mode Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {agent.codeName}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isWarm 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isWarm ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
                          {isWarm ? 'WARM CONTAINER' : 'SERVERLESS STANDBY'}
                        </span>
                      </div>

                      {/* Agent Name & Subcategory */}
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {agent.name}
                      </h3>
                      <span className="text-[11px] text-cyan-400/90 font-medium block mt-0.5">
                        {agent.subCategory}
                      </span>

                      {/* Description */}
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {agent.description}
                      </p>

                      {/* Trigger Keywords Tags */}
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {agent.triggerKeywords.slice(0, 3).map((kw, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-800/60 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Bottom: Performance Stats & Test Trigger */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <div className="space-y-0.5 font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Latência: {agent.avgLatencyMs}ms</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Acerto: {agent.successRatePct}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTestAgent(agent)}
                        disabled={isExecuting}
                        className={`px-3 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                          isExecuting
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold active:scale-95'
                        }`}
                      >
                        {isExecuting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>Executando...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Testar Ação</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              Arquitetura de Sub-Swarm: Instanciação Serverless & Warm Containers com Roteamento por Barramento de Eventos.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            Fechar Sub-Swarm
          </button>
        </div>

      </div>
    </div>
  );
};
