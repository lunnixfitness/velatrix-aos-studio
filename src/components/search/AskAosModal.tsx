import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Sparkles, 
  Command, 
  X, 
  ArrowRight, 
  Building2, 
  Truck, 
  DollarSign, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  Globe, 
  FileText,
  Activity,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_MOCK_TENANTS } from '../../data/mockSuperAdmin';
import { INITIAL_FLEET_VEHICLES, MOCK_PREDICTIVE_MAINTENANCE } from '../../data/telemetryMockData';
import { ALL_200_AGENTS } from '../../data/agentSwarm200Data';
import { VectorStoreService } from '../../services/vectorStoreService';
import { NavigationTab } from '../../types/aos';

interface AskAosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

interface SearchResultPayload {
  category: 'tenants' | 'telemetry' | 'agents' | 'finance' | 'rag_knowledge';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  details: string;
  targetTab: NavigationTab;
}

export const AskAosModal: React.FC<AskAosModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [consolidatedAnswer, setConsolidatedAnswer] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultPayload[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setConsolidatedAnswer(null);
      setResults([]);
    }
  }, [isOpen]);

  // Suggested queries
  const SUGGESTED_QUERIES = [
    'Quais clientes estão com risco alto essa semana?',
    'Existem agentes com falha ou quórum de aprovação pendente?',
  ];

  const handleRunSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    setConsolidatedAnswer(null);

    setTimeout(() => {
      const q = searchQuery.toLowerCase();
      const newResults: SearchResultPayload[] = [];
      let answerSummary = '';

      // 1. Check Tenants / Enclaves
      const matchedTenants = INITIAL_MOCK_TENANTS.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.location.state.toLowerCase().includes(q) || 
        e.location.city.toLowerCase().includes(q) || 
        e.sectorLabel.toLowerCase().includes(q) ||
        (q.includes('risco') && (e.status === 'warning' || e.status === 'shadow_mode')) ||
        (q.includes('tenant') || q.includes('cliente'))
      );

      if (matchedTenants.length > 0) {
        matchedTenants.slice(0, 3).forEach(t => {
          newResults.push({
            category: 'tenants',
            title: t.name,
            subtitle: `${t.location.city}, ${t.location.state} • Setor: ${t.sectorLabel}`,
            badge: `Plano ${t.planTier}`,
            badgeColor: t.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            details: `ERP: ${t.connectedErp} | MRR: R$ ${(t.mrrBrl).toLocaleString('pt-BR')} | Status: ${t.status.toUpperCase()}`,
            targetTab: 'super_admin'
          });
        });
      }

      // 2. Check Telemetry / GPS
      const matchedVehicles = INITIAL_FLEET_VEHICLES.filter(v => 
        v.plate.toLowerCase().includes(q) ||
        v.driverName.toLowerCase().includes(q) ||
        v.cargoDescription.toLowerCase().includes(q) ||
        (q.includes('frio') || q.includes('temperatura') || q.includes('manutenção') || q.includes('frota') || q.includes('gps') || q.includes('caminhão'))
      );

      if (matchedVehicles.length > 0) {
        matchedVehicles.slice(0, 2).forEach(v => {
          const maint = MOCK_PREDICTIVE_MAINTENANCE[v.id];
          newResults.push({
            category: 'telemetry',
            title: `Veículo ${v.plate} (${v.vehicleModel.split(' ')[0]})`,
            subtitle: `Motorista: ${v.driverName} • ${v.cargoDescription}`,
            badge: v.sensors.isTempOutOfRange ? 'Alerta Térmico' : maint ? `Risco Manutenção: ${maint.overallRiskLevel}` : 'Nominal',
            badgeColor: v.sensors.isTempOutOfRange ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
            details: `Velocidade: ${v.speedKmH} km/h | Temp: ${v.sensors.temperature}°C | Próxima revisão: ${maint?.estimatedDaysToService || 15} dias.`,
            targetTab: 'operational_dashboard'
          });
        });
      }

      // 3. Check Swarm Agents
      const matchedAgents = ALL_200_AGENTS.filter(a => 
        a.name.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.roleDescription.toLowerCase().includes(q) ||
        (q.includes('agente') || q.includes('supervisor') || q.includes('falha') || q.includes('enxame'))
      );

      if (matchedAgents.length > 0) {
        matchedAgents.slice(0, 2).forEach(a => {
          newResults.push({
            category: 'agents',
            title: `[${a.code}] ${a.name}`,
            subtitle: a.swarmName,
            badge: a.riskLevel,
            badgeColor: a.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-violet-500/20 text-violet-300 border-violet-500/40',
            details: `${a.roleDescription} (Zero-GUI: ${a.requiresZeroGuiApproval ? 'Sim' : 'Não'}).`,
            targetTab: 'super_admin'
          });
        });
      }

      // 4. Check RAG Vector Store
      const ragHits = VectorStoreService.search(searchQuery, { limit: 2 });
      ragHits.forEach(hit => {
        newResults.push({
          category: 'rag_knowledge',
          title: hit.document.metadata.title || `Doc ${hit.document.vector_id}`,
          subtitle: `Barramento RAG • Categoria: ${hit.document.metadata.category}`,
          badge: `Similaridade ${(hit.score * 100).toFixed(0)}%`,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          details: hit.document.text.slice(0, 160) + '...',
          targetTab: 'vector_knowledge_store'
        });
      });

      // Construct AI Executive Cross-Domain Answer
      if (q.includes('risco') && (q.includes('tenant') || q.includes('semana'))) {
        answerSummary = `Cruzamento em tempo real do ecossistema AOS detectou **2 tenants em faixa de atenção**: AçoNorte S/A (Manaus, AM) com score de risco de 68% devido a atrasos de cabotagem, e Biopharma Logística (SP) com oscilações térmicas em 1 carga frigorífica. Ambos estão com invariantes de caixa preservadas (Saldo > R$ 2M) e quórum Multi-Sig ativado.`;
      } else if (q.includes('frio') || q.includes('frota') || q.includes('manutenção') || q.includes('telemetria')) {
        answerSummary = `A frota monitorada possui **5 veículos ativos**: o caminhão BRA-2E19 apresentou anomalia térmica (-11.4°C vs alvo -18°C) com compressor reiniciado. No módulo de manutenção preditiva, o veículo SP-9821 está com risco CRÍTICO de pastilhas de freio (desgaste de 91%), com recomendação de recolhimento em até 2 dias.`;
      } else if (q.includes('agente') || q.includes('falha') || q.includes('supervisor')) {
        answerSummary = `O Meta-agente Supervisor monitora **300 agentes em 11 enxames**. O status geral de saúde do enxame é de **98.7%**. Apenas 4 nós apresentam latência moderada (>120ms) e 1 agente de conciliação fiscal está sob quarentena automática de segurança aguardando liberação do CFO.`;
      } else if (q.includes('caixa') || q.includes('faturamento') || q.includes('financeiro') || q.includes('liquidez')) {
        answerSummary = `A posição de liquidez global consolidada é de **R$ 2.450.000,00** no colchão de segurança, atendendo plenamente à invariante estipulada de R$ 2.0M. O faturamento mensal recorrente (ARR) dos enclaves gerenciados soma R$ 4.88M com margem líquida média de 32.4%.`;
      } else {
        answerSummary = `Consulta processada pelo Barramento Neural Velatrix AOS. Foram identificados ${newResults.length} registros correlacionados entre Enclaves de Tenants, Telemetria IoT/GPS, Barramento Vetorial RAG e Enxames de Agentes.`;
      }

      setResults(newResults);
      setConsolidatedAnswer(answerSummary);
      setIsThinking(false);
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-[var(--vx-deep)] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[var(--vx-deep)]">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRunSearch(query);
                if (e.key === 'Escape') onClose();
              }}
              placeholder="Pergunte ao Velatrix AOS (ex: 'quais tenants estão com risco alto essa semana?')..."
              className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-100 placeholder-slate-500 focus:outline-none pr-8"
            />
            {query && (
              <button 
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleRunSearch(query)}
            disabled={!query.trim() || isThinking}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isThinking ? (
              <>
                <Zap className="w-3.5 h-3.5 animate-spin" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <span>Perguntar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Results */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          
          {/* Quick Suggestions when empty */}
          {!consolidatedAnswer && !isThinking && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                <Command className="w-3.5 h-3.5 text-cyan-400" />
                <span>Consultas Rápidas Sugeridas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUERIES.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(sq);
                      handleRunSearch(sq);
                    }}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left text-xs text-slate-300 hover:text-cyan-300 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span>{sq}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Consolidated Response Box */}
          {consolidatedAnswer && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-teal-950/30 border border-cyan-500/40 shadow-xl space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase">
                    Resposta Consolidada Multi-Domínio (AOS Intelligence)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                  Cruzamento ERP + GPS + RAG + Agentes
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {consolidatedAnswer}
              </p>
            </div>
          )}

          {/* Results Grid */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Registros e Entidades Relacionadas ({results.length})</span>
                <span className="text-[10px] text-slate-500">Clique para navegar diretamente ao módulo</span>
              </div>

              <div className="space-y-2">
                {results.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      onNavigateTab(res.targetTab);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {res.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${res.badgeColor}`}>
                            {res.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {res.subtitle}
                        </p>
                        <p className="text-xs text-slate-300 line-clamp-2 pt-0.5">
                          {res.details}
                        </p>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-950/50 transition-colors shrink-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-[var(--vx-deep)] flex items-center justify-between text-[11px] text-slate-500 font-mono px-5">
          <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">ESC</kbd> para fechar</span>
          <span className="text-cyan-400">Velatrix Autonomous OS • Global Search Index</span>
        </div>
      </div>
    </div>
  );
};
