import React from 'react';
import { TrendingUp, ShieldCheck, Zap, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

export interface ExecutiveKpis {
  ebitdaPreservedBrl: number;
  ebitdaGainPercent: number;
  slaTierAGuarantee: string;
  tacticalResolutionCostBrl: number;
  tacticalCostRatePercent: number;
  freeCashBalanceBrl: number;
  cashFlowCoverage: number;
}

interface ExecutiveKpiGridProps {
  kpis: ExecutiveKpis;
  language: SupportedLanguage;
  currency: SupportedCurrency;
  contextTitle?: string;
}

export const ExecutiveKpiGrid: React.FC<ExecutiveKpiGridProps> = ({
  kpis,
  language,
  currency,
  contextTitle = 'Indicadores de Preservação de Capital & Liquidez (D+0)'
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--vx-neon)] animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            {contextTitle}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--vx-neon)] bg-[var(--vx-neon)]/10 px-2 py-0.5 rounded border border-[var(--vx-neon)]/30 self-start sm:self-auto">
          Métricas Calculadas em Tempo Real
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: EBITDA Preservado */}
        <div 
          id="kpi-ebitda-preservado"
          className="bg-slate-950/90 p-4 rounded-xl border border-emerald-500/40 hover:border-emerald-400 transition-all space-y-1.5 shadow-lg shadow-emerald-950/30"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400">
              EBITDA PRESERVADO
            </span>
            <div className="p-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-[var(--vx-neon-green)] drop-shadow-[0_0_8px_rgba(0,230,118,0.25)]">
            +{formatCurrency(kpis.ebitdaPreservedBrl, currency, language)}
          </div>
          <div className="text-[10px] font-mono text-emerald-300/90 pt-1 border-t border-emerald-950/80 flex items-center justify-between">
            <span>Margem Recuperada:</span>
            <strong className="font-bold">+{kpis.ebitdaGainPercent.toFixed(1)}%</strong>
          </div>
        </div>

        {/* KPI 2: SLA Contratual Tier-A */}
        <div 
          id="kpi-sla-contratual-tier-a"
          className="bg-slate-950/90 p-4 rounded-xl border border-sky-500/40 hover:border-sky-400 transition-all space-y-1.5 shadow-lg shadow-sky-950/30"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-sky-400">
              SLA CONTRATUAL TIER-A
            </span>
            <div className="p-1 rounded-md bg-sky-500/10 border border-sky-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-sky-300 truncate" title={kpis.slaTierAGuarantee}>
            {kpis.slaTierAGuarantee}
          </div>
          <div className="text-[10px] font-mono text-sky-400/90 pt-1 border-t border-sky-950/80 flex items-center justify-between">
            <span>Risco de Multa/Churn:</span>
            <strong className="font-bold text-emerald-400">0.0%</strong>
          </div>
        </div>

        {/* KPI 3: Custo de Resolução Tática */}
        <div 
          id="kpi-custo-resolucao-tatica"
          className="bg-slate-950/90 p-4 rounded-xl border border-amber-500/40 hover:border-amber-400 transition-all space-y-1.5 shadow-lg shadow-amber-950/30"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-300">
              CUSTO DE RESOLUÇÃO TÁTICA
            </span>
            <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-300">
            -{formatCurrency(kpis.tacticalResolutionCostBrl, currency, language)}
          </div>
          <div className="text-[10px] font-mono text-amber-400/90 pt-1 border-t border-amber-950/80 flex items-center justify-between">
            <span>Alocação Spot &amp; Hedging:</span>
            <strong className="font-bold">{kpis.tacticalCostRatePercent}% do risco</strong>
          </div>
        </div>

        {/* KPI 4: Saldo Caixa Livre */}
        <div 
          id="kpi-saldo-caixa-livre"
          className="bg-slate-950/90 p-4 rounded-xl border border-teal-500/40 hover:border-teal-400 transition-all space-y-1.5 shadow-lg shadow-teal-950/30"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-300">
              SALDO CAIXA LIVRE
            </span>
            <div className="p-1 rounded-md bg-teal-500/10 border border-teal-500/30">
              <Wallet className="w-3.5 h-3.5 text-teal-400" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-teal-300">
            {formatCurrency(kpis.freeCashBalanceBrl, currency, language)}
          </div>
          <div className="text-[10px] font-mono text-teal-400/90 pt-1 border-t border-teal-950/80 flex items-center justify-between">
            <span>Cobertura de Liquidez:</span>
            <strong className="font-bold">{kpis.cashFlowCoverage.toFixed(1)}x D+0</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
