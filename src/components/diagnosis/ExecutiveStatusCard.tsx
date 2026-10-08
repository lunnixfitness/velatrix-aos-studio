import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingDown, DollarSign, Activity } from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

interface ExecutiveStatusCardProps {
  zScore: number;
  sangriaTotal: number;
  annualRevenue: number;
  cashFlowCoverage: number;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const ExecutiveStatusCard: React.FC<ExecutiveStatusCardProps> = ({
  zScore,
  sangriaTotal,
  annualRevenue,
  cashFlowCoverage,
  language,
  currency
}) => {
  // Altman Z-Score interpretation:
  // Z >= 2.99: Zona Saudável (Verde - Baixo Risco de Insolvência)
  // 1.81 <= Z < 2.99: Zona de Alerta (Amarelo - Vulnerabilidade Operacional)
  // Z < 1.81: Zona de Perigo (Vermelho - Sangria Crítica / Risco)
  const isGreen = zScore >= 2.90 && sangriaTotal / annualRevenue < 0.04;
  const isYellow = !isGreen && (zScore >= 1.81 || sangriaTotal / annualRevenue < 0.08);

  const statusConfig = isGreen
    ? {
        color: 'bg-emerald-950/40 border-emerald-500/80 text-emerald-400',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        label: 'STATUS: ZONA SAUDÁVEL (VERDE)',
        subLabel: 'Baixo risco de insolvência • Estrutura de capital resiliente',
        icon: ShieldCheck,
        zoneText: 'Zona Segura (Safe Zone)'
      }
    : isYellow
    ? {
        color: 'bg-amber-950/40 border-amber-500/80 text-amber-400',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        label: 'STATUS: ALERTA OPERACIONAL (AMARELO)',
        subLabel: 'Atenção aos prazos médios e vazamentos em cadeia de suprimentos',
        icon: AlertTriangle,
        zoneText: 'Zona de Alerta (Grey Zone)'
      }
    : {
        color: 'bg-rose-950/40 border-rose-500/80 text-rose-400',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        label: 'STATUS: SANGRIA DE CAPITAL (VERMELHO)',
        subLabel: 'Alto custo de inação • Invariantes de margem sob estresse severo',
        icon: AlertOctagon,
        zoneText: 'Zona de Perigo (Distress Zone)'
      };

  const IconComponent = statusConfig.icon;
  const sangriaPercent = ((sangriaTotal / annualRevenue) * 100).toFixed(1);

  return (
    <div className={`p-5 sm:p-6 rounded-2xl border ${statusConfig.color} backdrop-blur-md shadow-2xl relative overflow-hidden transition-all`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.badgeColor} border`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-wider text-slate-100 font-mono">
              {statusConfig.label}
            </h2>
            <p className="text-xs text-slate-300">
              {statusConfig.subLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${statusConfig.badgeColor}`}>
            {statusConfig.zoneText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        {/* Metric 1: Altman Z-Score */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">ALTMAN Z-SCORE</span>
            <Activity className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100">
            {zScore.toFixed(2)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Benchmark: &gt; 2.90</span>
            <span className={zScore >= 2.9 ? 'text-emerald-400 font-bold' : zScore >= 1.81 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
              {zScore >= 2.9 ? 'Adequado' : zScore >= 1.81 ? 'Atenção' : 'Crítico'}
            </span>
          </div>
        </div>

        {/* Metric 2: Sangria Total Estimada */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">SANGRIA DE CAPITAL / ANO</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {formatCurrency(sangriaTotal, currency, language)}
          </div>
          <div className="text-[10px] font-mono text-rose-400/80 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Impacto na Receita:</span>
            <strong className="font-bold">{sangriaPercent}% / ano</strong>
          </div>
        </div>

        {/* Metric 3: Cobertura de Fluxo de Caixa */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">COBERTURA DE CAIXA D+0</span>
            <DollarSign className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="text-2xl font-black font-mono text-teal-300">
            {cashFlowCoverage.toFixed(1)}x
          </div>
          <div className="text-[10px] font-mono text-teal-400/80 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>Buffer de Liquidez:</span>
            <span className="font-bold">{cashFlowCoverage >= 1.5 ? 'Protegido' : 'Sob Tensão'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
