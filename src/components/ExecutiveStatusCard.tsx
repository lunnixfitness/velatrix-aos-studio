import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Activity, 
  ArrowUpRight, 
  TrendingDown, 
  TrendingUp,
  Radio, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Building2, 
  ChevronRight, 
  Zap,
  DollarSign
} from 'lucide-react';
import { SupportedCurrency, SupportedLanguage, formatCurrency } from '../utils/i18n';

export interface AutonomousAgentActionLog {
  id: string;
  timestamp: string;
  agentName: string;
  agentRole: 'FISCAL' | 'SUPPLY' | 'IOT' | 'FINANCE' | 'TREASURY' | 'LEGAL';
  action: string;
  impactValue: string;
  impactType: 'savings' | 'blocked' | 'sla' | 'optimized';
}

export interface ExecutiveStatusCardProps {
  zScore: number;
  cashFlow: number;
  sangriaTotal: number;
  protectedCapital?: number;
  capitalDeltaMonth?: number;
  netMarginPct?: number;
  tenantName?: string;
  currency?: SupportedCurrency;
  language?: SupportedLanguage;
  onNavigateToDiagnosis?: () => void;
  onNavigateToGraphHealth?: () => void;
  className?: string;
}

const INITIAL_AGENT_LOGS: AutonomousAgentActionLog[] = [
  {
    id: 'log-1',
    timestamp: '20:36:01',
    agentName: 'AGENTE FISCAL',
    agentRole: 'FISCAL',
    action: 'Corrigiu NCM divergente na NF-e #4021 com split de ICMS-ST',
    impactValue: 'Economia: R$ 4.200,00',
    impactType: 'savings'
  },
  {
    id: 'log-2',
    timestamp: '20:34:15',
    agentName: 'AGENTE SUPPLY',
    agentRole: 'SUPPLY',
    action: 'Bloqueou boleto duplicado de frete via barramento D+0 SEFAZ',
    impactValue: 'Economia: R$ 18.000,00',
    impactType: 'blocked'
  },
  {
    id: 'log-3',
    timestamp: '20:10:00',
    agentName: 'AGENTE IOT',
    agentRole: 'IOT',
    action: 'Disparou alerta preventivo de câmara fria CD-02 e acionou técnico',
    impactValue: 'Ação em 3 min',
    impactType: 'sla'
  },
  {
    id: 'log-4',
    timestamp: '19:48:22',
    agentName: 'AGENTE TREASURY',
    agentRole: 'TREASURY',
    action: 'Arbitragem de spread cambial e aplicação automática de CDI a 103.5%',
    impactValue: 'Rendimento: +R$ 1.850,00',
    impactType: 'optimized'
  }
];

/**
 * Painel de Governança Autônoma & Status Financeiro Executivo do VELATRIX AOS.
 * - Header de Governança com Tenant e Status Online em Tempo Real
 * - Banner Executivo de Altman Z-Score e Grau de Risco de Insolvência
 * - Grid de 3 Cards: Capital Protegido (+12%), Caixa Projetado (30D) e Sangria Detectada
 * - Live Log das Últimas Ações dos Agentes Autônomos com Telemetria e Economia Gerada
 */
export const ExecutiveStatusCard: React.FC<ExecutiveStatusCardProps> = ({
  zScore,
  cashFlow,
  sangriaTotal,
  protectedCapital = 1250000,
  capitalDeltaMonth = 12.4,
  netMarginPct = 18.4,
  tenantName = 'Indústria Farmacêutica X',
  currency = 'BRL',
  language = 'pt',
  onNavigateToDiagnosis,
  onNavigateToGraphHealth,
  className = ''
}) => {
  const [logs, setLogs] = useState<AutonomousAgentActionLog[]>(INITIAL_AGENT_LOGS);
  const [livePulse, setLivePulse] = useState<boolean>(true);

  // Periodic pulse effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Define a cor e o texto com base na saúde financeira
  const isGreen = zScore >= 2.99 && sangriaTotal === 0;
  const isYellow = zScore >= 1.81 && zScore < 2.99;

  const statusConfig = isGreen
    ? {
        themeBorder: 'border-slate-800',
        bannerBg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        label: 'STATUS DA OPERAÇÃO: ZONA VERDE (CAIXA PROTEGIDO E SAUDÁVEL)',
        insolvencyRisk: 'Risco de Insolvência: NULO',
        subtitle: 'Solvência sólida, sem sangria ativa e liquidez preservada.',
        icon: ShieldCheck
      }
    : isYellow
    ? {
        themeBorder: 'border-slate-800',
        bannerBg: 'bg-amber-950/20 border-amber-500/30 text-amber-300',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        label: 'STATUS DA OPERAÇÃO: ALERTA OPERACIONAL (ZONA AMARELA)',
        insolvencyRisk: 'Risco de Insolvência: MODERADO (ZONA CINZENTA)',
        subtitle: 'Atenção aos prazos médios de recebimento e concentração de estoque.',
        icon: AlertTriangle
      }
    : {
        themeBorder: 'border-rose-900/60',
        bannerBg: 'bg-rose-950/20 border-rose-500/30 text-rose-300',
        badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        label: 'STATUS DA OPERAÇÃO: SANGRIA DE CAPITAL (ZONA VERMELHA)',
        insolvencyRisk: 'Risco de Insolvência: ELEVADO',
        subtitle: 'Vazamento de margem ou quebra iminente de invariantes operacionais.',
        icon: Flame
      };

  const IconComponent = statusConfig.icon;

  const formattedCashFlow = formatCurrency(cashFlow, (currency || 'BRL') as SupportedCurrency, (language || 'pt') as SupportedLanguage);
  const formattedSangria = formatCurrency(sangriaTotal, (currency || 'BRL') as SupportedCurrency, (language || 'pt') as SupportedLanguage);
  const formattedProtectedCapital = formatCurrency(protectedCapital, (currency || 'BRL') as SupportedCurrency, (language || 'pt') as SupportedLanguage);

  return (
    <div
      id="executive-status-card"
      className={`rounded-2xl border bg-slate-900/95 backdrop-blur-xl transition-all shadow-sm p-5 sm:p-7 space-y-6 ${statusConfig.themeBorder} ${className}`}
    >
      {/* Top Header Bar: VELATRIX AOS | Painel de Governança Autônoma */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-xs">
            V
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
                VELATRIX AOS
              </span>
              <span className="text-slate-600">│</span>
              <span className="text-xs sm:text-sm font-semibold text-slate-300">
                Painel de Governança Autônoma
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>Tenant: <strong className="text-slate-200">{tenantName}</strong></span>
            </p>
          </div>
        </div>

        {/* Status Online & Quick Actions */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono font-semibold text-emerald-300 tracking-wider">
              ONLINE D+0
            </span>
          </div>

          {onNavigateToDiagnosis && (
            <button
              onClick={onNavigateToDiagnosis}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
              title="Abrir Raio-X & Simulação"
            >
              <span>Raio-X</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}

          {onNavigateToGraphHealth && (
            <button
              onClick={onNavigateToGraphHealth}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
              title="Verificar Saúde do Grafo"
            >
              <Activity className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
              <span>Grafo AOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Status Banner: 🟢 STATUS DA OPERAÇÃO: ZONA VERDE */}
      <div className={`p-4 sm:p-5 rounded-xl border ${statusConfig.bannerBg} flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border ${statusConfig.badgeBg} flex-shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-wide">
              {statusConfig.label}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
              <span className="font-semibold text-white">
                Altman Z-Score: <span className="text-[var(--vx-neon)] font-bold">{typeof zScore === 'number' ? zScore.toFixed(2) : '3.42'}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-300 font-medium">{statusConfig.insolvencyRisk}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Atualizado em Tempo Real
              </span>
            </div>
          </div>
        </div>

        <div className="sm:text-right text-xs text-slate-300/80 border-t sm:border-t-0 pt-2 sm:pt-0 border-current/20 font-sans">
          <p className="font-medium">{statusConfig.subtitle}</p>
        </div>
      </div>

      {/* 3 Metric Cards Grid: Capital Protegido | Caixa Projetado | Sangria Detectada */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: 🛡️ CAPITAL PROTEGIDO */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium tracking-wider flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              CAPITAL PROTEGIDO
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +{capitalDeltaMonth}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono mt-3 text-slate-100 tracking-tight">
            {formattedProtectedCapital}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="text-emerald-400 font-medium font-mono">+{capitalDeltaMonth}% no período</span>
            <span className="text-[11px] text-slate-500">Barramento Autônomo</span>
          </div>
        </div>

        {/* Card 2: 📈 CAIXA PROJETADO (30D) */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all group">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium tracking-wider flex items-center gap-1.5 text-slate-300">
              <Activity className="w-4 h-4 text-cyan-400" />
              CAIXA PROJETADO (30D)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-medium">
              Margem: {netMarginPct}%
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono mt-3 text-slate-100 tracking-tight">
            {formattedCashFlow}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="text-slate-300 font-mono">Margem Líquida: <strong className="text-slate-100">{netMarginPct}%</strong></span>
            <span className="text-[11px] text-slate-500">Fluxo D+30</span>
          </div>
        </div>

        {/* Card 3: ⚠️ SANGRIA DETECTADA */}
        <div className={`p-5 rounded-xl bg-slate-950/80 border transition-all group ${sangriaTotal > 0 ? 'border-rose-800/80 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'}`}>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium tracking-wider flex items-center gap-1.5 text-slate-300">
              <AlertTriangle className={`w-4 h-4 ${sangriaTotal > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
              SANGRIA DETECTADA
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${sangriaTotal > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              {sangriaTotal > 0 ? '1 Alerta Ativo' : '0 Vazamentos'}
            </span>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold font-mono mt-3 tracking-tight ${sangriaTotal > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {formattedSangria}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span className={sangriaTotal > 0 ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
              {sangriaTotal > 0 ? 'Ação preventiva requerida' : 'Operação estanque'}
            </span>
            <span className="text-[11px] text-slate-500">Zero-Leak Guard</span>
          </div>
        </div>

      </div>

      {/* Live Log of Autonomous Agent Actions: 📡 ÚLTIMAS AÇÕES DOS AGENTES AUTÔNOMOS */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-200 uppercase">
              ÚLTIMAS AÇÕES DOS AGENTES AUTÔNOMOS (LIVE LOG)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Multi-Agent Swarm
          </span>
        </div>

        {/* Logs List */}
        <div className="space-y-2 font-mono text-xs">
          {logs.map((log) => {
            const roleColor = 
              log.agentRole === 'FISCAL' ? 'text-cyan-400 bg-slate-900 border-slate-800' :
              log.agentRole === 'SUPPLY' ? 'text-slate-300 bg-slate-900 border-slate-800' :
              log.agentRole === 'IOT' ? 'text-cyan-400 bg-slate-900 border-slate-800' :
              'text-slate-300 bg-slate-900 border-slate-800';

            const impactColor = 
              log.impactType === 'savings' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
              log.impactType === 'blocked' ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' :
              log.impactType === 'sla' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
              'text-slate-300 bg-slate-800 border-slate-700';

            return (
              <div 
                key={log.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-slate-500 select-none text-[11px] font-mono mt-0.5 sm:mt-0">
                    [{log.timestamp}]
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleColor} flex-shrink-0`}>
                    {log.agentName}
                  </span>
                  <span className="text-slate-300 text-xs truncate">
                    {log.action}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${impactColor} flex items-center gap-1`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {log.impactValue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
