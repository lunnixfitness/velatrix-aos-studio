import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { SupportedCurrency, SupportedLanguage } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { useDre } from '../../context/DreContext';

interface RecurrentVsExtraordinaryBreakdownCardProps {
  currency: SupportedCurrency;
  language: SupportedLanguage;
  estimatedSangria?: number;
  onScrollToWaterfall?: () => void;
  className?: string;
}

export const RecurrentVsExtraordinaryBreakdownCard: React.FC<RecurrentVsExtraordinaryBreakdownCardProps> = ({
  currency,
  language,
  estimatedSangria = 0,
  onScrollToWaterfall,
  className = ''
}) => {
  const { dreInput, dreResults, recurrentVsAdjusted, companyName } = useDre();

  const {
    ebitdaRecorrente,
    margemEbitdaRecorrente,
    ebitdaAjustado,
    margemEbitdaAjustada,
    deltaEbitda,
    lucroLiquidoRecorrente,
    margemLiquidaRecorrente,
    lucroLiquidoAjustado,
    margemLiquidaAjustada,
    deltaLucroLiquido,
    totalAjustesExtraordinariosBruto,
    totalAjustesExtraordinariosLiquido,
    percentualExtraordinarioSobreReceita,
    percentualExtraordinarioSobreEbitda,
    zScoreRecorrente,
    zScoreAjustado,
    deltaZScore,
    classificacaoZScoreRecorrente,
    classificacaoZScoreAjustado,
    grauDependenciaFiscal,
    diagnosticoOperacional,
    recomendacaoPropostaAos
  } = recurrentVsAdjusted;

  // Cor do badge de dependência
  const getBadgeStyle = () => {
    switch (grauDependenciaFiscal) {
      case 'CRÍTICA':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          icon: ShieldAlert,
          label: 'Dependência Fiscal Crítica (Risco de Ilusão de Caixa)'
        };
      case 'ELEVADA':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          icon: AlertTriangle,
          label: 'Dependência Fiscal Elevada (Alerta de Sustentabilidade)'
        };
      case 'MODERADA':
        return {
          bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-300',
          icon: Info,
          label: 'Dependência Fiscal Moderada'
        };
      default:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          icon: ShieldCheck,
          label: 'Operação Recorrente Autossustentável'
        };
    }
  };

  const badgeInfo = getBadgeStyle();
  const BadgeIcon = badgeInfo.icon;

  return (
    <div
      id="recurrent-vs-extraordinary-card"
      className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 ${className}`}
    >
      {/* Header com Tag de Governança Pericial */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Scale className="w-3.5 h-3.5" />
              SEGREGAÇÃO DE SOLVÊNCIA PERICIAL
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeInfo.bg}`}>
              <BadgeIcon className="w-3.5 h-3.5" />
              {badgeInfo.label}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex flex-wrap items-center gap-2">
            <span>Raio-X de Solvência: Operação Recorrente vs. Créditos Extraordinários</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({companyName})
            </span>
          </h3>
          <p className="text-xs text-slate-400 max-w-4xl leading-relaxed">
            Mapeamento analítico da <strong className="text-slate-200">saúde operacional real</strong> versus o alívio contábil temporário gerado por créditos tributários (Tema 69 STF, Tema 163 STF e atualização monetária SELIC).
          </p>
        </div>

        {onScrollToWaterfall && (
          <button
            type="button"
            onClick={onScrollToWaterfall}
            className="self-start md:self-center px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver Cascata DRE Detalhada</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid Comparativo Triplo: Recorrente vs Créditos Fiscais vs Ajustado Consolidado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        
        {/* Bloco 1: Operação Recorrente (Realidade da Rotina) */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-600 to-cyan-500" />
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              1. Operação Recorrente
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-bold">
              Rotina Pura
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-tight block">EBITDA Recorrente</span>
              <div className="text-base sm:text-lg font-black text-cyan-300">
                {formatCurrency(ebitdaRecorrente, currency, language)}
              </div>
              <span className="text-[10px] text-slate-400">
                Margem: <strong className="text-cyan-400">{margemEbitdaRecorrente.toFixed(1)}%</strong> da Rec. Líquida
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Resultado Líquido</span>
              <div className="text-base sm:text-lg font-black text-slate-200">
                {formatCurrency(lucroLiquidoRecorrente, currency, language)}
              </div>
              <span className="text-[10px] text-slate-400">
                Margem Líquida: <strong className="text-slate-300">{margemLiquidaRecorrente.toFixed(1)}%</strong>
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">Altman Z-Score Recorrente</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  zScoreRecorrente >= 2.9 ? 'bg-emerald-950 text-emerald-400' :
                  zScoreRecorrente >= 1.8 ? 'bg-amber-950 text-amber-400' : 'bg-rose-950 text-rose-400'
                }`}>
                  {classificacaoZScoreRecorrente}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-white mt-0.5">
                Z = {zScoreRecorrente.toFixed(2)}
              </div>
              <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
                Exclui fôlego transitório de teses tributárias.
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Créditos Tributários Extraordinários (Não Recorrentes) */}
        <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              2. Fôlego Extraordinário
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700 text-purple-300 font-bold">
              PER-DCOMP / STF
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60">
              <span className="text-[10px] text-purple-300/80 uppercase tracking-tight block">Créditos Tributários Brutos</span>
              <div className="text-base sm:text-lg font-black text-purple-200">
                +{formatCurrency(totalAjustesExtraordinariosBruto, currency, language)}
              </div>
              <span className="text-[10px] text-purple-300/70">
                Representa <strong className="text-purple-200">{percentualExtraordinarioSobreReceita.toFixed(1)}%</strong> da receita bruta anual
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60">
              <span className="text-[10px] text-purple-300/80 uppercase tracking-tight block">Efeito Líquido (após IR/CSLL)</span>
              <div className="text-base sm:text-lg font-black text-emerald-300">
                +{formatCurrency(totalAjustesExtraordinariosLiquido, currency, language)}
              </div>
              <span className="text-[10px] text-emerald-400/80">
                SELIC 100% isenta (Tema 962 STF)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Estorno PIS/COFINS (Tema 69):</span>
                <span className="text-purple-300 font-bold">
                  +{formatCurrency(dreResults.estornoExtraordinarioDeducoes, currency, language)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>INSS s/ Verbas (Tema 163):</span>
                <span className="text-purple-300 font-bold">
                  +{formatCurrency(dreResults.reversaoExtraordinariaInss, currency, language)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>SELIC s/ Indébito (Tema 962):</span>
                <span className="text-purple-300 font-bold">
                  +{formatCurrency(dreResults.atualizacaoSelicExtraordinaria, currency, language)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 3: Balanço Contábil Ajustado (Consolidado) */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              3. Visão Ajustada (Com Créditos)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 font-bold">
              Consolidado
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-tight block">EBITDA Ajustado</span>
              <div className="text-base sm:text-lg font-black text-emerald-300">
                {formatCurrency(ebitdaAjustado, currency, language)}
              </div>
              <span className="text-[10px] text-emerald-400">
                Margem: <strong className="text-emerald-300">{margemEbitdaAjustada.toFixed(1)}%</strong> (+{(margemEbitdaAjustada - margemEbitdaRecorrente).toFixed(1)}% cosmético)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Resultado Líquido Ajustado</span>
              <div className="text-base sm:text-lg font-black text-white">
                {formatCurrency(lucroLiquidoAjustado, currency, language)}
              </div>
              <span className="text-[10px] text-slate-400">
                Margem: <strong className="text-slate-200">{margemLiquidaAjustada.toFixed(1)}%</strong> (+{(margemLiquidaAjustada - margemLiquidaRecorrente).toFixed(1)}% de teses)
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">Altman Z-Score Ajustado</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  zScoreAjustado >= 2.9 ? 'bg-emerald-950 text-emerald-400' :
                  zScoreAjustado >= 1.8 ? 'bg-amber-950 text-amber-400' : 'bg-rose-950 text-rose-400'
                }`}>
                  {classificacaoZScoreAjustado}
                </span>
              </div>
              <div className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
                Z = {zScoreAjustado.toFixed(2)}
                <span className="text-xs font-mono font-normal text-purple-300 ml-2">
                  (+{deltaZScore.toFixed(2)} delta)
                </span>
              </div>
              <span className="text-[9px] text-slate-500 block leading-tight mt-0.5">
                Solvência contábil inflada por créditos de indébitos passados.
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Barra de Distribuição Visual do EBITDA */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-300 font-bold flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Decomposição da Formação do EBITDA (Recorrente vs. Extraordinário)
          </span>
          <span className="text-slate-400">
            {ebitdaAjustado > 0 ? (
              <>
                <strong className="text-cyan-400">{((ebitdaRecorrente / ebitdaAjustado) * 100).toFixed(1)}%</strong> Operacional • <strong className="text-purple-300">{percentualExtraordinarioSobreEbitda.toFixed(1)}%</strong> Fiscais
              </>
            ) : '100% Recorrente'}
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            style={{ width: `${Math.min(100, Math.max(0, ebitdaAjustado > 0 ? (ebitdaRecorrente / ebitdaAjustado) * 100 : 100))}%` }}
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
            title="EBITDA Operacional Recorrente"
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, percentualExtraordinarioSobreEbitda))}%` }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            title="Efeito Créditos Tributários Extraordinários"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" />
            <span>EBITDA Operacional Recorrente ({formatCurrency(ebitdaRecorrente, currency, language)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 inline-block" />
            <span>Ajustes Tributários Extraordinários (+{formatCurrency(deltaEbitda, currency, language)})</span>
          </div>
        </div>
      </div>

      {/* Diretriz Pericial de Governança para o Dimensionamento da Proposta (Etapa 3) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/40 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Salvaguarda Financeira Velatrix AOS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Anti-Inflação de Solvência
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {diagnosticoOperacional}
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px] pt-1 border-t border-slate-800/80">
              <strong className="text-cyan-300">Diretriz para a Etapa 3 (Proposta Comercial):</strong> {recomendacaoPropostaAos}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
