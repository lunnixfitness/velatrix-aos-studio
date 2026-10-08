import React from 'react';
import {
  Building,
  ShieldAlert,
  TrendingUp,
  Percent,
  Lock,
  Scale,
  Activity,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Layers,
  FileText
} from 'lucide-react';
import { PatrimonialAnalysisResult } from '../../types/patrimonial';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

interface PatrimonialGovernanceCardProps {
  analysis: PatrimonialAnalysisResult;
  currency: SupportedCurrency;
  language: SupportedLanguage;
  companyName: string;
}

export const PatrimonialGovernanceCard: React.FC<PatrimonialGovernanceCardProps> = ({
  analysis,
  currency,
  language,
  companyName
}) => {
  const { rating, ratingScore, riskLevel, solvency, capitalStructure, profitability, assetAllocation, alerts, aosDirectives } = analysis;

  const getRatingColor = (r: string) => {
    if (r === 'AAA' || r === 'AA' || r === 'A') return 'text-emerald-400 border-emerald-500/60 bg-emerald-950/80';
    if (r === 'BBB' || r === 'BB') return 'text-amber-300 border-amber-500/60 bg-amber-950/80';
    return 'text-rose-400 border-rose-500/60 bg-rose-950/80';
  };

  return (
    <div className="bg-slate-900/90 border border-cyan-900/50 rounded-2xl p-6 shadow-2xl space-y-6">
      
      {/* Header do Módulo 5 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/15 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              5. Governança Patrimonial &amp; Estrutura de Capital (Balanço &amp; Solvência)
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Análise de Solvência de Longo Prazo, Alavancagem, Rentabilidade de Capital (ROE/ROIC) e Valor Patrimonial Real (NAV)
          </p>
        </div>

        {/* Rating Score Badge */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0 font-mono">
          <div className="text-left lg:text-right">
            <span className="text-[10px] text-slate-400 uppercase block font-bold">Rating Patrimonial</span>
            <span className="text-xs text-slate-300 font-bold">Score: {ratingScore}/100</span>
          </div>
          <div className={`px-3.5 py-1.5 rounded-xl border font-black text-base sm:text-lg flex items-center gap-2 shadow-lg ${getRatingColor(rating)}`}>
            <span>{rating}</span>
            <span className="text-[10px] uppercase font-bold opacity-80">({riskLevel})</span>
          </div>
        </div>
      </div>

      {/* Grid de 4 Blocos de Indicadores Financeiros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Bloco 1: Solvência & Liquidez */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200">Solvência &amp; Liquidez</h4>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              solvency.liquidezCorrente >= 1.3 ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
            }`}>
              {solvency.liquidezCorrente >= 1.3 ? 'Equilibrada' : 'Atenção CP'}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Liquidez Corrente (LC):</span>
              <strong className={solvency.liquidezCorrente >= 1.2 ? 'text-emerald-400' : 'text-amber-400'}>
                {solvency.liquidezCorrente.toFixed(2)}x
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Liquidez Seca (LS):</span>
              <strong className="text-slate-200">{solvency.liquidezSeca.toFixed(2)}x</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Liquidez Geral (LG):</span>
              <strong className="text-slate-200">{solvency.liquidezGeral.toFixed(2)}x</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Cap. Giro Líquido:</span>
              <strong className="text-cyan-300 font-bold">
                {formatCurrency(solvency.capitalGiroLiquido, currency, language)}
              </strong>
            </div>
          </div>
        </div>

        {/* Bloco 2: Estrutura de Capital & Dívida */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200">Estrutura de Capital</h4>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
              capitalStructure.dividaLiquidaSobreEbitda <= 2.5 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
            }`}>
              {capitalStructure.dividaLiquidaSobreEbitda <= 2.5 ? 'Controlada' : 'Alavancada'}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Dívida Líq. / EBITDA:</span>
              <strong className={capitalStructure.dividaLiquidaSobreEbitda <= 2.5 ? 'text-emerald-400' : 'text-rose-400'}>
                {capitalStructure.dividaLiquidaSobreEbitda.toFixed(2)}x
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Endividamento Geral:</span>
              <strong className="text-slate-200">{(capitalStructure.endividamentoGeral * 100).toFixed(1)}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Composição Curto Prazo:</span>
              <strong className={capitalStructure.composicaoEndividamentoCP > 60 ? 'text-rose-400' : 'text-amber-400'}>
                {capitalStructure.composicaoEndividamentoCP.toFixed(1)}%
              </strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Cobertura Juros (ICJ):</span>
              <strong className="text-cyan-300 font-bold">{capitalStructure.coberturaJurosICJ.toFixed(2)}x</strong>
            </div>
          </div>
        </div>

        {/* Bloco 3: Rentabilidade & Retorno */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--vx-neon-green)]" />
              <h4 className="text-xs font-mono font-bold text-slate-200">Retorno sobre Capital</h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300">
              ROE: {profitability.roe.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">ROIC (Retorno Investido):</span>
              <strong className="text-[var(--vx-neon-green)]">{profitability.roic.toFixed(1)}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">ROE (Retorno sobre PL):</span>
              <strong className="text-emerald-400">{profitability.roe.toFixed(1)}%</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">ROA (Retorno sobre Ativo):</span>
              <strong className="text-slate-200">{profitability.roa.toFixed(1)}%</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Margem Líquida:</span>
              <strong className="text-cyan-300 font-bold">{profitability.margemLiquida.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        {/* Bloco 4: NAV Real & Contingências */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-violet-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200">Patrimônio Real (NAV)</h4>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-violet-950 text-violet-300">
              Auditado
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">PL Contábil:</span>
              <strong className="text-slate-200">
                {formatCurrency(assetAllocation.patrimonioLiquidoContabil, currency, language)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">NAV Tangível Ajustado:</span>
              <strong className="text-cyan-300 font-bold">
                {formatCurrency(assetAllocation.patrimonioLiquidoAjustadoNAV, currency, language)}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Ativos Gravados:</span>
              <strong className={assetAllocation.indiceAtivosGravados > 40 ? 'text-amber-400' : 'text-slate-300'}>
                {assetAllocation.indiceAtivosGravados.toFixed(1)}% do Imob.
              </strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Contingências Mapeadas:</span>
              <strong className="text-rose-400 font-bold">
                {formatCurrency(assetAllocation.totalContingenciasMapeadas, currency, language)}
              </strong>
            </div>
          </div>
        </div>

      </div>

      {/* Tabela de Alertas Patrimoniais Mapeados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Alertas de Vulnerabilidade Patrimonial &amp; Ações AOS</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {alerts.length} Pontos de Atenção
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-2.5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    alert.severity === 'CRÍTICO' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <h5 className="text-xs font-bold text-slate-200 font-mono">
                    {alert.title}
                  </h5>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                  alert.severity === 'CRÍTICO'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {alert.severity}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">{alert.metric}:</span>
                <span className="text-rose-300 font-bold">{alert.currentValue} <span className="text-slate-500 font-normal">(Meta: {alert.benchmark})</span></span>
              </div>

              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                {alert.riskDescription}
              </p>

              <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-900/40 text-[11px] font-mono text-cyan-300 space-y-0.5">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Diretriz AOS:</span>
                </span>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  {alert.aosRemediation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parecer Executivo de Governança Patrimonial */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-950 to-cyan-950/30 border border-cyan-900/40 space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--vx-neon)]" />
          <h4 className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wider">
            Diretrizes Executivas de Governança &amp; Desalavancagem para o CFO:
          </h4>
        </div>
        <ul className="space-y-1.5 pt-1">
          {aosDirectives.map((directive, idx) => (
            <li key={idx} className="text-xs text-slate-300 font-mono flex items-start gap-2">
              <span className="text-[var(--vx-neon)] font-bold shrink-0">[{idx + 1}]</span>
              <span>{directive}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};
