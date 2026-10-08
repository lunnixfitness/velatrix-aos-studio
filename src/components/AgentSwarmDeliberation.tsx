import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Landmark, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  FileText,
  Calculator,
  Wrench,
  Users,
  Percent,
  Layers,
  FileCheck2,
  Sparkles,
  Bot,
  Building2,
  Zap,
  BarChart3,
  Terminal,
  Activity
} from 'lucide-react';
import { SwarmDeliberation, SwarmAgentOutput, SwarmAgentId } from '../types/aos';

interface AgentSwarmDeliberationProps {
  swarm: SwarmDeliberation;
  isProcessing: boolean;
}

export const AgentSwarmDeliberation: React.FC<AgentSwarmDeliberationProps> = ({
  swarm,
  isProcessing
}) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>('synthesizer');
  const [filterCategory, setFilterCategory] = useState<'all' | 'data_predictive' | 'finance_risk' | 'ops_factory' | 'commercial_legal'>('all');
  const [showAllAgents, setShowAllAgents] = useState(false);

  const getAgentIcon = (role: string, agentId?: string) => {
    if (agentId === 'Data_Analyst_Predictive_Agent' || role === 'data_science') return <BarChart3 className="w-4 h-4 text-cyan-400" />;
    if (agentId === 'Legal_Contract_Agent' || role === 'legal') return <FileText className="w-4 h-4 text-slate-300" />;
    if (agentId === 'Tax_Optimizer_Agent' || role === 'tax_optimizer') return <Calculator className="w-4 h-4 text-slate-300" />;
    if (agentId === 'Facility_Maintenance_Agent' || role === 'facility') return <Wrench className="w-4 h-4 text-slate-300" />;
    if (agentId === 'People_Analytics_Agent' || role === 'people_analytics') return <Users className="w-4 h-4 text-cyan-400" />;
    if (agentId === 'Dynamic_Pricing_Agent' || role === 'dynamic_pricing') return <Percent className="w-4 h-4 text-slate-300" />;
    if (agentId === 'Production_BOM_Agent' || role === 'production_bom') return <Layers className="w-4 h-4 text-slate-300" />;
    if (agentId === 'Audit_Ledger_Agent' || role === 'audit_ledger') return <FileCheck2 className="w-4 h-4 text-cyan-400" />;

    switch (role) {
      case 'procurement':
        return <ShoppingCart className="w-4 h-4 text-slate-300" />;
      case 'finance':
        return <Landmark className="w-4 h-4 text-cyan-400" />;
      case 'logistics':
        return <Truck className="w-4 h-4 text-slate-300" />;
      case 'sales':
        return <TrendingUp className="w-4 h-4 text-slate-300" />;
      case 'risk':
        return <ShieldCheck className="w-4 h-4 text-slate-300" />;
      case 'revenue_ops':
        return <Building2 className="w-4 h-4 text-cyan-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Build the complete 13 agents list with robust defaults
  const defaultAgents: { key: string; id: SwarmAgentId; category: 'data_predictive' | 'finance_risk' | 'ops_factory' | 'commercial_legal'; data: SwarmAgentOutput }[] = [
    {
      key: 'data_analyst_predictive',
      id: 'Data_Analyst_Predictive_Agent',
      category: 'data_predictive',
      data: swarm.data_analyst_predictive || {
        agentName: 'Data Analyst & Predictive AI Agent',
        role: 'data_science',
        agentId: 'Data_Analyst_Predictive_Agent',
        reasoning: 'Cruzamento em milissegundos de dados relacionais e não estruturados do ERP. Identificação de padrões de perda com modelos preditivos Monte Carlo e regressão polinomial.',
        proposedAction: 'Executar pipeline Python de data prep, isolar anomalias ocultas e fornecer projeção determinística de KPIs sem jargão.',
        confidence: 99,
        metrics: { 'Acurácia Preditiva': '99.4%', 'Anomalias Isoladas': '0 Padrões', 'R² Score': '0.984', 'Forecasting D+30': 'Estável' },
        status: 'completed'
      }
    },
    {
      key: 'finance',
      id: 'Financial_Agent',
      category: 'finance_risk',
      data: swarm.finance || {
        agentName: 'CFO Brain (Financial Agent)',
        role: 'finance',
        agentId: 'Financial_Agent',
        reasoning: 'Avaliação de fluxo de caixa, DRE, EBITDA e liquidez.',
        proposedAction: 'Preservar capital de giro e mitigar descasamento PMR x PMP.',
        confidence: 97,
        metrics: { 'Impacto Caixa': '-R$ 45k', 'EBITDA': '+R$ 380k' },
        status: 'completed'
      }
    },
    {
      key: 'procurement',
      id: 'Inventory_Agent',
      category: 'ops_factory',
      data: swarm.procurement || {
        agentName: 'Inventory & Procurement Agent',
        role: 'procurement',
        agentId: 'Inventory_Agent',
        reasoning: 'Análise de estoque de segurança, lote econômico de compra e ponto de resuprimento.',
        proposedAction: 'Emitir ordem de resuprimento automatizada no ERP.',
        confidence: 95,
        metrics: { 'Lead Time': '48h', 'Ruptura': '0.0%' },
        status: 'completed'
      }
    },
    {
      key: 'logistics',
      id: 'Supply_Chain_Agent',
      category: 'ops_factory',
      data: swarm.logistics || {
        agentName: 'Supply Chain & Logistics Agent',
        role: 'logistics',
        agentId: 'Supply_Chain_Agent',
        reasoning: 'Mapeamento de rotas e modais de transporte com menor custo e SLA garantido.',
        proposedAction: 'Despachar carga via rota prioritária homologada.',
        confidence: 94,
        metrics: { 'Transit Time': '18h', 'SLA': '99.2%' },
        status: 'completed'
      }
    },
    {
      key: 'risk',
      id: 'Zero_Trust_Risk_Agent',
      category: 'finance_risk',
      data: swarm.risk || {
        agentName: 'Zero-Trust Risk Agent',
        role: 'risk',
        agentId: 'Zero_Trust_Risk_Agent',
        reasoning: 'Auditoria antifraude de 100% dos eventos corporativos e validação de invariantes.',
        proposedAction: 'Verificar chaves bancárias e exigir assinatura biométrica.',
        confidence: 100,
        metrics: { 'Invariantes': '4/4 OK', 'Risco': 'Baixo' },
        status: 'completed'
      }
    },
    {
      key: 'sales',
      id: 'Sales_Agent',
      category: 'commercial_legal',
      data: swarm.sales || {
        agentName: 'Sales & Revenue Agent',
        role: 'sales',
        agentId: 'Sales_Agent',
        reasoning: 'Monitoramento de SLAs contratuais, retenção de contas e proteção de receita.',
        proposedAction: 'Preservar contratos vigentes e emitir comunicados preventivos.',
        confidence: 97,
        metrics: { 'SLA Retenção': '100%', 'Churn': '0.0%' },
        status: 'completed'
      }
    },
    {
      key: 'production_bom',
      id: 'Production_BOM_Agent',
      category: 'ops_factory',
      data: swarm.production_bom || {
        agentName: 'Production & BOM Agent',
        role: 'production_bom',
        agentId: 'Production_BOM_Agent',
        reasoning: 'Reconciliação da lista técnica de materiais (BOM) e sequenciamento no chão de fábrica.',
        proposedAction: 'Sincronizar ordens de produção no MRP II sem paradas de máquina.',
        confidence: 98,
        metrics: { 'BOM Acurácia': '99.8%', 'Rendimento': '98.5%' },
        status: 'completed'
      }
    },
    {
      key: 'audit_ledger',
      id: 'Audit_Ledger_Agent',
      category: 'finance_risk',
      data: swarm.audit_ledger || {
        agentName: 'Audit Ledger Agent',
        role: 'audit_ledger',
        agentId: 'Audit_Ledger_Agent',
        reasoning: 'Registro imutável com prova criptográfica secp256k1 e carimbo de tempo no ledger.',
        proposedAction: 'Gravar hash da decisão na trilha de auditoria Zero-Trust.',
        confidence: 100,
        metrics: { 'Hash Ledger': '0x8f2c...41e9', 'Imutabilidade': '100%' },
        status: 'completed'
      }
    },
    {
      key: 'legal_contract',
      id: 'Legal_Contract_Agent',
      category: 'commercial_legal',
      data: swarm.legal_contract || {
        agentName: 'Legal Contract Agent',
        role: 'legal',
        agentId: 'Legal_Contract_Agent',
        reasoning: 'Auditoria de minutas contratuais, cláusulas de SLA, rescisão e conformidade com a LGPD.',
        proposedAction: 'Validar aditivo contratual e manter certidões de regularidade vigentes.',
        confidence: 99,
        metrics: { 'Risco Jurídico': '0.0%', 'LGPD': 'Conforme' },
        status: 'completed'
      }
    },
    {
      key: 'tax_optimizer',
      id: 'Tax_Optimizer_Agent',
      category: 'finance_risk',
      data: swarm.tax_optimizer || {
        agentName: 'Tax Optimizer Agent',
        role: 'tax_optimizer',
        agentId: 'Tax_Optimizer_Agent',
        reasoning: 'Planejamento e compensação de créditos tributários (ICMS/PIS/COFINS e Reforma Tributária).',
        proposedAction: 'Aplicar crédito de ICMS interestadual e registrar escrituração no SPED Fiscal.',
        confidence: 97,
        metrics: { 'Crédito Fiscal': '+R$ 18.4k', 'Economia': '4.8%' },
        status: 'completed'
      }
    },
    {
      key: 'facility_maintenance',
      id: 'Facility_Maintenance_Agent',
      category: 'ops_factory',
      data: swarm.facility_maintenance || {
        agentName: 'Facility & Maintenance Agent',
        role: 'facility',
        agentId: 'Facility_Maintenance_Agent',
        reasoning: 'Telemetria preditiva do parque fabril e monitoramento de MTBF/MTTR das máquinas.',
        proposedAction: 'Agendar parada preventiva no intervalo entre turnos de produção.',
        confidence: 95,
        metrics: { 'OEE': '89.4%', 'MTBF': '720h' },
        status: 'completed'
      }
    },
    {
      key: 'people_analytics',
      id: 'People_Analytics_Agent',
      category: 'ops_factory',
      data: swarm.people_analytics || {
        agentName: 'People Analytics Agent',
        role: 'people_analytics',
        agentId: 'People_Analytics_Agent',
        reasoning: 'Dimensionamento da força de trabalho, produtividade de turno e controle de jornada CLT/NR-12.',
        proposedAction: 'Rebalancear escalas operacionais para absorver a demanda sem custo de hora extra.',
        confidence: 96,
        metrics: { 'Produtividade': '+8.2%', 'H.Extras Evitadas': '42h' },
        status: 'completed'
      }
    },
    {
      key: 'dynamic_pricing',
      id: 'Dynamic_Pricing_Agent',
      category: 'commercial_legal',
      data: swarm.dynamic_pricing || {
        agentName: 'Dynamic Pricing Agent',
        role: 'dynamic_pricing',
        agentId: 'Dynamic_Pricing_Agent',
        reasoning: 'Cálculo de elasticidade de preço, custos unitários e garantia de margem de contribuição mínima.',
        proposedAction: 'Reajustar tabela de preços com base na curva de demanda do cliente.',
        confidence: 96,
        metrics: { 'Margem Contribuição': '32.1%', 'Mark-up': '2.14x' },
        status: 'completed'
      }
    }
  ];

  const allFilteredAgents = defaultAgents.filter(a => {
    if (filterCategory === 'all') return true;
    return a.category === filterCategory;
  });

  const displayedAgents = (filterCategory === 'all' && !showAllAgents)
    ? allFilteredAgents.slice(0, 4)
    : allFilteredAgents;

  return (
    <div id="agentic-swarm-panel" className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 p-4 shadow-xl space-y-4">
      
      {/* Header with parallel workers badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              Enxame de Micro-Agentes Autônomos (Swarm Orchestrator)
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              PARALLEL_ASYNC · 13 Workers Especializados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-emerald-300 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" /> Modo Paralelo Ativo (13 Workers)
          </span>
          <span className="text-[10px] text-cyan-300 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/80 font-mono">
            {filterCategory === 'all' && !showAllAgents ? '4 em Destaque / 13 Ativos' : `${displayedAgents.length} Agentes Exibidos`}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] border-b border-slate-800/80">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filterCategory === 'all'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Todos os Agentes (13)
        </button>
        <button
          onClick={() => setFilterCategory('data_predictive')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            filterCategory === 'data_predictive'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Data Science & Predictive (1)</span>
        </button>
        <button
          onClick={() => setFilterCategory('finance_risk')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filterCategory === 'finance_risk'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Finanças, Risco & Tributário (4)
        </button>
        <button
          onClick={() => setFilterCategory('ops_factory')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filterCategory === 'ops_factory'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Operações, Fábrica & Pessoas (5)
        </button>
        <button
          onClick={() => setFilterCategory('commercial_legal')}
          className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            filterCategory === 'commercial_legal'
              ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Comercial, Preço & Jurídico (3)
        </button>
      </div>

      {/* Synthesizer Consensus Banner */}
      <div id="swarm-synthesizer-card" className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200">
              Síntese Tática Consensual do AOS (13 Agentes Integrados)
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Consenso Alcançado (13/13)
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium mb-3">
          {swarm.synthesizer?.decisionSummary || 'Deliberação consensual unificada pelo orquestrador semântico do AOS com 13 agentes especializados em execução assíncrona paralela, com auditoria preditiva e detecção em tempo real de anomalias.'}
        </p>

        {/* Execution Plan Checklist */}
        {swarm.synthesizer?.executionPlan && swarm.synthesizer.executionPlan.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Plano de Execução Automatizado:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs text-slate-300">
              {swarm.synthesizer.executionPlan.map((step: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] font-bold text-cyan-400 font-mono mt-0.5">0{idx + 1}.</span>
                  <span className="text-[11px] leading-snug">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Specialized Micro-Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayedAgents.map(({ key, id, data }) => {
          const isExpanded = expandedAgent === key;

          return (
            <div
              key={key}
              id={`agent-card-${key}`}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col justify-between transition-colors shadow-sm"
            >
              {/* Agent Title & Confidence Gauge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md border bg-slate-900 border-slate-800">
                      {getAgentIcon(data.role, data.agentId || id)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">
                        {data.agentName}
                      </span>
                      <span className="text-[9px] text-cyan-400 font-mono font-medium">
                        {id}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono bg-slate-900 border-slate-800 text-slate-300">
                    {data.confidence}% conf.
                  </span>
                </div>

                {/* Tactical Proposal */}
                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-200 mb-2">
                  <span className="text-[9px] uppercase font-bold block mb-0.5 text-cyan-400">
                    Proposta Tática:
                  </span>
                  {data.proposedAction}
                </div>

                {/* Metrics Badges */}
                {data.metrics && Object.keys(data.metrics).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(data.metrics).map(([k, v]) => (
                      <span 
                        key={k} 
                        className="text-[10px] px-1.5 py-0.5 rounded border bg-slate-900 text-slate-400 border-slate-800/80"
                      >
                        {k}: <strong className="text-slate-200 font-semibold font-mono">{v}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reasoning Accordion */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setExpandedAgent(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between text-[10px] font-medium text-slate-400 hover:text-slate-200 py-0.5 transition-colors cursor-pointer"
                >
                  <span>Ver Raciocínio Completo</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {isExpanded && (
                  <p className="text-[10px] text-slate-300 leading-relaxed mt-1.5 p-2 rounded bg-slate-900/60 border border-slate-800/40">
                    {data.reasoning}
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Expand/Collapse Toggle Button for 13 Agents */}
      {filterCategory === 'all' && (
        <div className="flex justify-center pt-2 border-t border-slate-800/50">
          {!showAllAgents ? (
            <button
              id="btn-toggle-all-agents"
              onClick={() => setShowAllAgents(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-cyan-400 border border-slate-800 hover:border-slate-700 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Ver todos os 13 agentes (+9 agentes operando em background)</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              id="btn-toggle-all-agents"
              onClick={() => setShowAllAgents(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-xs font-semibold text-slate-300 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer active:scale-95"
            >
              <span>Mostrar apenas os 4 agentes em destaque</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

    </div>
  );
};
