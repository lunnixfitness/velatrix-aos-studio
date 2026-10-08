import React from 'react';
import { 
  BarChart3, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  Loader2, 
  FileCheck, 
  MessageSquare, 
  Mail, 
  Flame, 
  TrendingDown, 
  ShieldCheck, 
  Coins, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';
import { SectorRiskProfile } from './taxonomy';
import { ExecutiveStatusCard } from './ExecutiveStatusCard';
import { ExecutiveKpiGrid, ExecutiveKpis } from './ExecutiveKpiGrid';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency, NavigationTab } from '../../types/aos';

interface StepResultsProps {
  currentSector: SectorRiskProfile;
  displayCompany: {
    name: string;
    cnpj: string;
    annualRevenue: number;
    dailyVolume: string;
    ebitdaMargin: number;
  };
  zScore: number;
  cashFlowCoverage: number;
  scalingFactor: number;
  scaledDailyLoss: number;
  scaledAnnualLoss: number;
  scaledDowntimeCost: number;
  estimatedSavings: number;
  netRoi: number;
  paybackMonths: string;
  freeCashBalance: number;
  workingCapitalBuffer: number;
  singleIncidentLossManual: number;
  ebitdaGainPercent: number;
  defaultTacticalCost: number;
  isGeneratingPdf: boolean;
  pdfDownloadedSuccess: boolean;
  onDownloadPdf: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
  onBack: () => void;
  onNext: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const StepResults: React.FC<StepResultsProps> = ({
  currentSector,
  displayCompany,
  zScore,
  cashFlowCoverage,
  scalingFactor,
  scaledDailyLoss,
  scaledAnnualLoss,
  scaledDowntimeCost,
  estimatedSavings,
  netRoi,
  paybackMonths,
  freeCashBalance,
  workingCapitalBuffer,
  singleIncidentLossManual,
  ebitdaGainPercent,
  defaultTacticalCost,
  isGeneratingPdf,
  pdfDownloadedSuccess,
  onDownloadPdf,
  onShareWhatsApp,
  onShareEmail,
  onBack,
  onNext,
  onNavigateTab,
  language,
  currency
}) => {
  const tacticalCostRatePercent = Math.round((currentSector.lossMath.tacticalCostRate || 0.085) * 100);

  const kpis: ExecutiveKpis = {
    ebitdaPreservedBrl: estimatedSavings,
    ebitdaGainPercent: ebitdaGainPercent,
    slaTierAGuarantee: currentSector.lossMath.slaTierGuarantee || '99.8% Assegurado',
    tacticalResolutionCostBrl: defaultTacticalCost,
    tacticalCostRatePercent: tacticalCostRatePercent,
    freeCashBalanceBrl: freeCashBalance,
    cashFlowCoverage: cashFlowCoverage
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Export Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-mono text-xs font-black">
              ✓
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              Passo 4: Resultado &amp; Raio-X de Sangria de Capital
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Diagnóstico consolidado com base na taxonomia <strong className="text-slate-200">{currentSector.name}</strong> para <strong className="text-slate-200">{displayCompany.name}</strong>.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Download PDF */}
          <button
            id="btn-download-risk-pdf-results-top"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 hover:from-[var(--vx-neon)]/90 text-slate-950 text-xs font-black transition-all shadow-lg shadow-[var(--vx-neon)]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Baixar Relatório Executivo Oficial em PDF"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Gerando PDF...</span>
              </>
            ) : pdfDownloadedSuccess ? (
              <>
                <FileCheck className="w-4 h-4 text-slate-950" />
                <span>PDF Baixado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-950" />
                <span>Baixar PDF Executivo</span>
              </>
            )}
          </button>

          {/* WhatsApp */}
          <button
            id="btn-share-whatsapp-results-top"
            onClick={onShareWhatsApp}
            className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar resumo via WhatsApp"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </button>

          {/* E-mail */}
          <button
            id="btn-share-email-results-top"
            onClick={onShareEmail}
            className="px-3 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/80 text-sky-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Compartilhar resumo via E-mail"
          >
            <Mail className="w-4 h-4 text-sky-400" />
            <span>E-mail</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive KPI Bar: EBITDA Preservado, SLA Tier-A, Custo de Resolução, Saldo Caixa Livre */}
      <ExecutiveKpiGrid 
        kpis={kpis}
        language={language}
        currency={currency}
        contextTitle="Métricas Executivas de Preservação &amp; Liquidez D+0"
      />

      {/* 3. Executive Status Card (Altman Z-Score & Capital Bleed) */}
      <ExecutiveStatusCard
        zScore={zScore}
        sangriaTotal={scaledAnnualLoss}
        annualRevenue={displayCompany.annualRevenue}
        cashFlowCoverage={cashFlowCoverage}
        language={language}
        currency={currency}
      />

      {/* 3. Section: A PERGUNTA DE DOR CIRÚRGICA */}
      <div className="bg-gradient-to-br from-rose-950/30 via-slate-900 to-slate-900 rounded-2xl border border-rose-900/60 p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
          <span className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-mono text-xs font-black">
            !
          </span>
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
            A Pergunta de Dor Cirúrgica (Gatilho C-Level)
          </h2>
        </div>

        <div className="bg-slate-950/90 border border-rose-900/50 p-4 rounded-xl relative">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-400 tracking-wider block">
                Provocação para CEO, COO e CFO:
              </span>
              <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed italic">
                "{currentSector.surgicalTriggerQuestion[language] || currentSector.surgicalTriggerQuestion.pt}"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: AS TRÊS VULNERABILIDADES DE PERDA DE CAPITAL */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-mono text-xs font-black">
              3
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Três Vulnerabilidades Críticas de Perda de Capital
            </h2>
          </div>
          <span className="text-[10px] font-mono text-amber-400">
            Vazamentos Operacionais &amp; Decisões Desconectadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {currentSector.vulnerabilities.map((vuln, idx) => {
            const scaledCost = vuln.dailyCostBrl * scalingFactor;
            const scaledAnnualVulnCost = scaledCost * vuln.frequencyDaysPerYear;
            return (
              <div 
                key={idx}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-amber-800/50">
                      Vulnerabilidade 0{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {vuln.frequencyDaysPerYear} ocorrências/ano
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-mono block">{vuln.category}</span>
                    <h3 className="text-xs font-bold text-slate-100 leading-snug">{vuln.title}</h3>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {vuln.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Prejuízo por Evento:</span>
                      <strong className="text-rose-400 font-mono font-bold">
                        {formatCurrency(scaledCost, currency, language)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Sangria Anual Estimada:</span>
                      <strong className="text-rose-300 font-mono font-bold">
                        {formatCurrency(scaledAnnualVulnCost, currency, language)}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-1">
                    {(() => {
                      const lower = (vuln.title + ' ' + vuln.category + ' ' + vuln.description).toLowerCase();
                      let label = 'Resolver no Passo 5 (Decisão)';
                      let action = onNext;

                      if (lower.includes('fraude') || lower.includes('duplicid') || lower.includes('tributár') || lower.includes('sefaz') || lower.includes('fiscal')) {
                        label = 'Investigar no Modo Déjà Vu →';
                        action = () => onNavigateTab ? onNavigateTab('deja_vu_detection') : onNext();
                      } else if (lower.includes('capital') || lower.includes('giro') || lower.includes('crédito') || lower.includes('glosa') || lower.includes('caixa') || lower.includes('alongar')) {
                        label = 'Simular no Oráculo Contrafactual →';
                        action = () => onNavigateTab ? onNavigateTab('counterfactual_oracle') : onNext();
                      } else if (lower.includes('telemetria') || lower.includes('fria') || lower.includes('frota') || lower.includes('temperatura') || lower.includes('veículo')) {
                        label = 'Ver no GPS & Telemetria IoT →';
                        action = () => onNavigateTab ? onNavigateTab('gps_telemetry') : onNext();
                      } else {
                        label = 'Mitigar no Painel de Decisão →';
                        action = onNext;
                      }

                      return (
                        <button
                          type="button"
                          onClick={action}
                          className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 hover:text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>{label}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Section: MATEMÁTICA DA PERDA SILENCIOSA (ROI DO AOS) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/20 rounded-2xl border border-teal-800/50 p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-mono text-xs font-black">
              4
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-300 font-mono">
              Matemática da Perda Silenciosa de Capital &amp; ROI do AOS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--vx-neon)] bg-[var(--vx-neon)]/10 px-2 py-0.5 rounded border border-[var(--vx-neon)]/30">
            Custo da Inação vs. Proteção do AOS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1: Custo Diário de Paralisação */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-rose-900/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Custo Diário Paralisação</span>
              <Flame className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-rose-400">
              {formatCurrency(scaledDowntimeCost, currency, language)}
            </div>
            <span className="text-[10px] text-slate-500 block">
              Por 24h de bloqueio operacional
            </span>
          </div>

          {/* Metric 2: Perda Anual Estimada (Inação) */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-rose-900/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Prejuízo Oculto Anual</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-rose-300">
              {formatCurrency(scaledAnnualLoss, currency, language)}
            </div>
            <span className="text-[10px] text-rose-400/80 font-mono block">
              {((scaledAnnualLoss / displayCompany.annualRevenue) * 100).toFixed(1)}% do faturamento drenado
            </span>
          </div>

          {/* Metric 3: Capital Recuperado pelo AOS */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-teal-800/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">Economia Projetada AOS</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-teal-300">
              {formatCurrency(estimatedSavings, currency, language)}
            </div>
            <span className="text-[10px] text-teal-400/80 font-mono block">
              82% dos incidentes prevenidos
            </span>
          </div>

          {/* Metric 4: ROI & Payback */}
          <div className="bg-slate-950/90 p-4 rounded-xl border border-[var(--vx-neon)]/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400">ROI Líquido Projetado</span>
              <Coins className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-[var(--vx-neon)]">
              +{netRoi.toFixed(0)}% ROI
            </div>
            <span className="text-[10px] text-[var(--vx-neon)]/80 font-mono block">
              Payback em {paybackMonths} meses
            </span>
          </div>
        </div>

        {/* Board-Level PDF Export Callout Card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--vx-neon)]" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                Relatório Executivo para Conselho &amp; C-Level (PDF Auditável)
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Gere um documento PDF executivo formatado com selo confidencial, tabela de sangrias de capital, payback e assinaturas Multi-Sig Secp256k1.
            </p>
          </div>
          
          <button
            id="btn-download-risk-pdf-section4"
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2.5 rounded-xl bg-[var(--vx-neon)]/10 hover:bg-[var(--vx-neon)]/20 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--vx-neon)]" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[var(--vx-neon)]" />
                <span>Exportar Resumo PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Buttons Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          id="btn-back-to-simulation"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar à Simulação</span>
        </button>

        <button
          id="btn-next-to-decision"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-[var(--vx-neon)]/20 flex items-center gap-2 cursor-pointer"
        >
          <span>Avançar para Decisão &amp; Governança</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
