import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Scale,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Calculator,
  Lock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Building,
  SlidersHorizontal,
  RefreshCw,
  HelpCircle,
  Clock,
  Check,
  X,
  Maximize2
} from 'lucide-react';
import { AuditRecord } from '../../types/aos';
import {
  DetailedDreWaterfallInput,
  DetailedDreCalculatedResults,
  NonRecurringLegalCompliance,
  HospitalEquiparationCompliance
} from '../../types/patrimonial';
import { VelatrixDreCascadeEngine } from '../../utils/dreCascadeEngine';
import { formatCurrency, SupportedCurrency, SupportedLanguage } from '../../utils/i18n';
import { useDre } from '../../context/DreContext';

interface DetailedDreWaterfallCardProps {
  initialRevenue?: number;
  currency?: SupportedCurrency;
  language?: SupportedLanguage;
  companyName?: string;
  onNavigateToTaxRecovery?: () => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
  onOpenFullView?: () => void;
  className?: string;
}

export const DetailedDreWaterfallCard: React.FC<DetailedDreWaterfallCardProps> = ({
  initialRevenue = 18400000,
  currency = 'BRL',
  language = 'pt',
  companyName,
  onNavigateToTaxRecovery,
  onAddAuditRecord,
  onOpenFullView,
  className = ''
}) => {
  // Consome a fonte única de verdade do DreContext
  const dreContext = useDre();
  const dreInput = dreContext.dreInput;
  const results = dreContext.dreResults;
  const activeCompanyName = companyName || dreContext.companyName;

  // Modos de Visualização: 'recorrente' | 'ajustado' | 'comparativo'
  const [viewMode, setViewMode] = useState<'comparativo' | 'recorrente' | 'ajustado'>('comparativo');

  // Controle de Seções Expandidas
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    receitaBruta: true,
    deducoes: true,
    custos: false,
    sga: true,
    ebitda: true,
    ebit: false,
    financeiro: true,
    impostos: true,
    resultadoLiquido: true,
    subtotalExtraordinario: true
  });

  // Modal / Drawer de Checklist de Equiparação Hospitalar
  const [showHospitalarModal, setShowHospitalarModal] = useState<boolean>(false);

  // Modal / Drawer de Detalhes de Processos e Conformidade Legal
  const [selectedComplianceModal, setSelectedComplianceModal] = useState<{
    isOpen: boolean;
    tipo: 'estorno_pis' | 'inss_patronal' | 'selic_indebito' | null;
    title: string;
    tese: string;
    compliance: NonRecurringLegalCompliance;
    valor: number;
  }>({
    isOpen: false,
    tipo: null,
    title: '',
    tese: '',
    compliance: dreInput.complianceEstornoPisCofins,
    valor: 0
  });

  // Tooltip ativo para notas legais
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleResetDefaults = () => {
    dreContext.resetToDefaults(initialRevenue);
  };

  // Atualização do Checklist de Equiparação Hospitalar
  const handleToggleHospitalarField = (field: keyof HospitalEquiparationCompliance) => {
    dreContext.updateComplianceHospitalar(field);
  };

  const handleSaveComplianceProcess = (
    tipo: 'estorno_pis' | 'inss_patronal' | 'selic_indebito',
    updatedCompliance: NonRecurringLegalCompliance
  ) => {
    const contextType = tipo === 'estorno_pis' ? 'estornoPis' : tipo === 'inss_patronal' ? 'inssPatronal' : 'selic';
    (Object.keys(updatedCompliance) as Array<keyof NonRecurringLegalCompliance>).forEach((field) => {
      dreContext.updateNonRecurringCompliance(contextType, field, updatedCompliance[field]);
    });
    setSelectedComplianceModal(prev => ({ ...prev, isOpen: false }));
  };

  // Helper para formatar percentual de Análise Vertical
  const formatAv = (pct: number) => `${pct.toFixed(1)}% AV`;

  return (
    <div id="waterfall-dre-table-section" className={`relative rounded-3xl bg-slate-950/90 border border-cyan-500/20 shadow-2xl overflow-hidden text-white font-sans ${className}`}>
      
      {/* Glow Ambient Highlights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ------------------------------------------------------------- */}
      {/* CARD HEADER: IDENTIDADE & SELETOR DE MODO                    */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 p-5 lg:p-7 border-b border-cyan-900/40 bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-[var(--vx-neon)] border border-cyan-500/40">
                <Calculator className="w-3 h-3" />
                DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO • CASCATA WATERFALL
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                PADRÃO CPC 26 / IFRS
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <ShieldCheck className="w-3 h-3" />
                ISOLAMENTO EXTRAORDINÁRIO
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Cascata DRE Completa &amp; Análise Vertical</span>
              <span className="text-xs sm:text-sm font-mono font-normal text-slate-400">
                ({activeCompanyName})
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
              Estrutura em cascata detalhada com segregação contábil estrita entre a <strong className="text-slate-200">operação recorrente</strong> e os <strong className="text-cyan-300">ajustes tributários extraordinários</strong> homologados em juízo.
            </p>
          </div>

          {/* Controls: Modos de Visualização & Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('recorrente')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'recorrente'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Recorrente
              </button>
              <button
                type="button"
                onClick={() => setViewMode('ajustado')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'ajustado'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Ajustado
              </button>
              <button
                type="button"
                onClick={() => setViewMode('comparativo')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  viewMode === 'comparativo'
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Comparativo
              </button>
            </div>

            {/* Checklist Equiparação Hospitalar Trigger */}
            <button
              type="button"
              onClick={() => setShowHospitalarModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all ${
                results.isEquiparacaoHospitalarAtiva
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-950/40'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>Equiparação Hospitalar</span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                results.isEquiparacaoHospitalarAtiva ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {results.isEquiparacaoHospitalarAtiva ? 'ATIVO (14.5%)' : 'DESATIVADO'}
              </span>
            </button>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Restaurar valores de referência"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Open Full View Button */}
            {onOpenFullView && (
              <button
                type="button"
                onClick={onOpenFullView}
                title="Expandir / Tela cheia"
                className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-[var(--vx-neon)] transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOP METRIC HIGHLIGHTS CARDS (EBITDA, LIQUIDO, EXTRAORDINARIO) */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 font-mono text-xs">
          
          {/* Receita Líquida Recorrente */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Receita Líquida (Recorrente)</span>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              {formatCurrency(results.receitaLiquidaRecorrente, currency, language)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{formatAv(results.avReceitaLiquidaRecorrente)}</span>
          </div>

          {/* EBITDA Recorrente vs Ajustado */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-tight block">EBITDA (Margem Recorrente)</span>
            <div className="text-sm sm:text-base font-bold text-[var(--vx-neon)] mt-0.5">
              {formatCurrency(results.ebitdaRecorrente, currency, language)}
            </div>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              Margem: {results.margemEbitdaRecorrente.toFixed(1)}% (Ajust: {results.margemEbitdaAjustada.toFixed(1)}%)
            </span>
          </div>

          {/* Resultado Líquido & Margem */}
          <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Resultado Líquido</span>
            <div className="text-sm sm:text-base font-bold text-white mt-0.5">
              {formatCurrency(results.resultadoLiquidoRecorrente, currency, language)}
            </div>
            <span className="text-[10px] text-cyan-300 block mt-0.5">
              Margem Líq: {results.margemLiquidaRecorrente.toFixed(1)}%
            </span>
          </div>

          {/* Subtotal de Ajustes Extraordinários Homologados */}
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 uppercase tracking-tight font-bold">Extraordinários Homologados</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/30 text-purple-200">
                {results.subtotalAjustesTributariosExtraordinarios.itensHomologadosCount}/3 OK
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-purple-200 mt-0.5">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.impactoTotalBruto, currency, language)}
            </div>
            <span className="text-[10px] text-purple-400 block mt-0.5">
              Líquido pós-IR: +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.impactoTotalLiquidoAposIr, currency, language)}
            </span>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* WATERFALL CASCADE TABLE (COM SUB-ITENS DETALHADOS)            */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 p-5 lg:p-7 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px] font-mono text-xs">
          <thead>
            <tr className="border-b border-cyan-900/50 text-[10px] text-slate-400 uppercase tracking-wider pb-2">
              <th className="py-2.5 px-3 font-bold text-slate-300">Item Contábil / Estrutura da Cascata</th>
              <th className="py-2.5 px-3 text-right font-bold text-slate-300 w-28">% AV</th>
              {viewMode !== 'ajustado' && (
                <th className="py-2.5 px-3 text-right font-bold text-slate-300 w-44">
                  Recorrente (Ordinário)
                </th>
              )}
              {viewMode !== 'recorrente' && (
                <th className="py-2.5 px-3 text-right font-bold text-cyan-300 w-48">
                  Ajustado (+Extraordinário)
                </th>
              )}
              <th className="py-2.5 px-3 text-center font-bold text-slate-300 w-32">Conformidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">

            {/* --------------------------------------------------------- */}
            {/* 1. (+) RECEITA BRUTA DE VENDAS E SERVIÇOS [100% AV]       */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-900/60 font-bold hover:bg-slate-900 transition-colors">
              <td className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSection('receitaBruta')}
                  className="flex items-center gap-2 text-white hover:text-[var(--vx-neon)] transition-colors"
                >
                  {expandedSections.receitaBruta ? (
                    <ChevronDown className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-[var(--vx-neon)]">(+)</span>
                  <span className="tracking-wide">RECEITA BRUTA DE VENDAS E SERVIÇOS</span>
                </button>
              </td>
              <td className="py-3 px-3 text-right text-slate-300">{formatAv(results.avReceitaBruta)}</td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-white font-bold">
                  {formatCurrency(results.receitaBrutaTotal, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-cyan-200 font-bold">
                  {formatCurrency(results.receitaBrutaTotal, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  BASE 100%
                </span>
              </td>
            </tr>

            {/* Sub-itens: Receita Bruta */}
            {expandedSections.receitaBruta && (
              <>
                <tr className="text-slate-300 bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 pl-9 pr-3">
                    <span className="text-slate-400">└─</span> Vendas Tributadas &amp; Serviços Faturados
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {formatAv((dreInput.vendasTributadasServicos / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2 px-3 text-right text-slate-300">
                      {formatCurrency(dreInput.vendasTributadasServicos, currency, language)}
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2 px-3 text-right text-slate-300">
                      {formatCurrency(dreInput.vendasTributadasServicos, currency, language)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center text-slate-500 text-[10px]">Ordinário</td>
                </tr>

                <tr className="text-slate-300 bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 pl-9 pr-3">
                    <span className="text-slate-400">└─</span> Vendas Monofásicas &amp; Substituição Tributária (ST)
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {formatAv((dreInput.vendasMonofasicasSt / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2 px-3 text-right text-slate-300">
                      {formatCurrency(dreInput.vendasMonofasicasSt, currency, language)}
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2 px-3 text-right text-slate-300">
                      {formatCurrency(dreInput.vendasMonofasicasSt, currency, language)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center text-slate-500 text-[10px]">PIS/COFINS monofásico</td>
                </tr>
              </>
            )}

            {/* --------------------------------------------------------- */}
            {/* 2. (-) DEDUÇÕES E IMPOSTOS SOBRE VENDAS                   */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-900/60 font-bold hover:bg-slate-900 transition-colors">
              <td className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSection('deducoes')}
                  className="flex items-center gap-2 text-white hover:text-rose-400 transition-colors"
                >
                  {expandedSections.deducoes ? (
                    <ChevronDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-rose-400">(-)</span>
                  <span className="tracking-wide">DEDUÇÕES E IMPOSTOS SOBRE VENDAS</span>
                </button>
              </td>
              <td className="py-3 px-3 text-right text-rose-300">-{formatAv(results.avDeducoesRecorrentes)}</td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-rose-400 font-bold">
                  -{formatCurrency(results.deducoesRecorrentes, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-rose-300 font-bold">
                  -{formatCurrency(results.deducoesRecorrentes - results.estornoExtraordinarioDeducoes, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                  Dedução Fiscal
                </span>
              </td>
            </tr>

            {/* Sub-itens: Deduções */}
            {expandedSections.deducoes && (
              <>
                <tr className="text-slate-300 bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 pl-9 pr-3">
                    <span className="text-slate-400">└─</span> Impostos Declarados (Simples Nacional / PIS / COFINS / ISS)
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    -{formatAv((dreInput.impostosDeclarados / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.impostosDeclarados, currency, language)}
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.impostosDeclarados, currency, language)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center text-slate-500 text-[10px]">Guia DARF / DAE</td>
                </tr>

                {/* ITEM COM REQUISITO DE CONFORMIDADE LEGAL: ESTORNO PIS/COFINS E ICMS-ST */}
                <tr className="bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-emerald-950/30 transition-colors">
                  <td className="py-2.5 pl-9 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-emerald-400 font-bold">└─ [🟢 REAJUSTE VELATRIX]:</span>
                      <span className="text-emerald-200 font-bold">Estorno e Recuperação de PIS/COFINS e ICMS-ST Indevidos (Últimos 60 Meses)</span>
                      
                      {/* Tag Obrigatória: NÃO RECORRENTE / EXTRAORDINÁRIO */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                        <Sparkles className="w-2.5 h-2.5" />
                        60 MESES • HOMOLOGADO
                      </span>

                      {/* Tooltip Legal Interativo */}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedComplianceModal({
                            isOpen: true,
                            tipo: 'estorno_pis',
                            title: 'Estorno de PIS/COFINS e ICMS-ST Indevidos',
                            tese: 'Tema 69 STF (Exclusão ICMS do PIS/COFINS) e Dupla Tributação ICMS-ST',
                            compliance: dreInput.complianceEstornoPisCofins,
                            valor: dreInput.estornoPisCofinsIcmsStIndevidos
                          })
                        }
                        className="text-cyan-400 hover:text-cyan-200 underline text-[10px] ml-1"
                      >
                        [Ver Processo / PER-DCOMP]
                      </button>
                    </div>
                    <p className="text-[10px] text-emerald-300/80 mt-0.5 pl-5">
                      {dreInput.complianceEstornoPisCofins.numeroProcessoOuPerDcomp} • {dreInput.complianceEstornoPisCofins.orgaoJulgadorOuFiscal}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-300">
                    +{formatAv((dreInput.estornoPisCofinsIcmsStIndevidos / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2.5 px-3 text-right text-slate-500 italic text-[11px]">
                      [Isolado p/ regra]
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                      +{formatCurrency(dreInput.estornoPisCofinsIcmsStIndevidos, currency, language)}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-center">
                    {results.isEstornoValido ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> HOMOLOGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> PENDENTE PROC.
                      </span>
                    )}
                  </td>
                </tr>
              </>
            )}

            {/* --------------------------------------------------------- */}
            {/* 3. (=) RECEITA LÍQUIDA                                    */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-[var(--vx-deep)] font-black border-y-2 border-cyan-500/40 text-sm">
              <td className="py-3 px-3 text-white flex items-center gap-2">
                <span className="text-[var(--vx-neon)]">(=)</span>
                <span className="tracking-wide">RECEITA LÍQUIDA</span>
              </td>
              <td className="py-3 px-3 text-right text-cyan-300">
                {viewMode === 'recorrente'
                  ? formatAv(results.avReceitaLiquidaRecorrente)
                  : formatAv(results.avReceitaLiquidaAjustada)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-white font-black">
                  {formatCurrency(results.receitaLiquidaRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-[var(--vx-neon)] font-black">
                  {formatCurrency(results.receitaLiquidaAjustada, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-[var(--vx-neon)] border border-cyan-500/50">
                  {viewMode === 'ajustado' ? 'AJUSTADA' : 'CONTÁBIL'}
                </span>
              </td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 4. (-) TOTAL DE CUSTOS (CPV/CMV)                          */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-900/60 font-bold hover:bg-slate-900 transition-colors">
              <td className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSection('custos')}
                  className="flex items-center gap-2 text-white hover:text-rose-400 transition-colors"
                >
                  {expandedSections.custos ? (
                    <ChevronDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-rose-400">(-)</span>
                  <span className="tracking-wide">TOTAL DE CUSTOS (CPV / CMV)</span>
                </button>
              </td>
              <td className="py-3 px-3 text-right text-rose-300">-{formatAv(results.avCustosCpvCmv)}</td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-rose-400 font-bold">
                  -{formatCurrency(results.custosCpvCmv, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-rose-400 font-bold">
                  -{formatCurrency(results.custosCpvCmv, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center text-slate-500 text-[10px]">Custos Diretos</td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 5. (=) LUCRO BRUTO                                        */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-950/70 font-bold text-slate-200 border-y border-slate-800">
              <td className="py-2.5 px-3 flex items-center gap-2">
                <span className="text-emerald-400">(=)</span>
                <span className="tracking-wide">LUCRO BRUTO</span>
                <span className="text-[10px] text-slate-400 ml-2">
                  (Margem Bruta: {results.margemBrutaRecorrente.toFixed(1)}%)
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-300">
                {formatAv((results.lucroBrutoRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                  {formatCurrency(results.lucroBrutoRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                  {formatCurrency(results.lucroBrutoAjustado, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center text-slate-400 text-[10px]">
                {results.margemBrutaRecorrente.toFixed(1)}% M.B.
              </td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 6. (-) DESPESAS OPERACIONAIS (SG&A)                       */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-900/60 font-bold hover:bg-slate-900 transition-colors">
              <td className="py-3 px-3">
                <button
                  type="button"
                  onClick={() => toggleSection('sga')}
                  className="flex items-center gap-2 text-white hover:text-rose-400 transition-colors"
                >
                  {expandedSections.sga ? (
                    <ChevronDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-rose-400">(-)</span>
                  <span className="tracking-wide">DESPESAS OPERACIONAIS (SG&amp;A)</span>
                </button>
              </td>
              <td className="py-3 px-3 text-right text-rose-300">-{formatAv(results.avSgaRecorrente)}</td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-rose-400 font-bold">
                  -{formatCurrency(results.sgaRecorrenteTotal, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-rose-300 font-bold">
                  -{formatCurrency(results.sgaAjustadoTotal, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center text-slate-500 text-[10px]">Despesas Gerais</td>
            </tr>

            {/* Sub-itens: SG&A */}
            {expandedSections.sga && (
              <>
                <tr className="text-slate-300 bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 pl-9 pr-3">
                    <span className="text-slate-400">└─</span> Despesas Administrativas e Pessoal
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    -{formatAv((dreInput.despesasAdministrativasPessoal / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.despesasAdministrativasPessoal, currency, language)}
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.despesasAdministrativasPessoal, currency, language)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center text-slate-500 text-[10px]">Folha &amp; Opex</td>
                </tr>

                {/* ITEM COM REQUISITO DE CONFORMIDADE LEGAL: INSS PATRONAL REVERTIDO */}
                <tr className="bg-rose-950/20 border-l-4 border-l-rose-500 hover:bg-rose-950/30 transition-colors">
                  <td className="py-2.5 pl-9 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-rose-400 font-bold">└─ [🔴 AJUSTE eSocial]:</span>
                      <span className="text-rose-200 font-bold">INSS Patronal Revertido sobre Verbas Indenizatórias</span>
                      
                      {/* Tag Obrigatória: NÃO RECORRENTE / EXTRAORDINÁRIO */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/50">
                        <Sparkles className="w-2.5 h-2.5" />
                        TEMA 163 STF • HOMOLOGADO
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedComplianceModal({
                            isOpen: true,
                            tipo: 'inss_patronal',
                            title: 'INSS Patronal Revertido (Verbas Indenizatórias)',
                            tese: 'Tema 163 STF - Terço Constitucional de Férias e Primeiros 15 Dias de Afastamento',
                            compliance: dreInput.complianceInssPatronal,
                            valor: dreInput.ajusteEsocialInssPatronalRevertido
                          })
                        }
                        className="text-cyan-400 hover:text-cyan-200 underline text-[10px] ml-1"
                      >
                        [Ver Processo / Tese]
                      </button>
                    </div>
                    <p className="text-[10px] text-rose-300/80 mt-0.5 pl-5">
                      {dreInput.complianceInssPatronal.numeroProcessoOuPerDcomp} • {dreInput.complianceInssPatronal.orgaoJulgadorOuFiscal}
                    </p>
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-300">
                    +{formatAv((dreInput.ajusteEsocialInssPatronalRevertido / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2.5 px-3 text-right text-slate-500 italic text-[11px]">
                      [Isolado p/ regra]
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2.5 px-3 text-right text-rose-300 font-bold">
                      +{formatCurrency(dreInput.ajusteEsocialInssPatronalRevertido, currency, language)}
                    </td>
                  )}
                  <td className="py-2.5 px-3 text-center">
                    {results.isInssValido ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> HOMOLOGADO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> PENDENTE PROC.
                      </span>
                    )}
                  </td>
                </tr>

                <tr className="text-slate-300 bg-slate-950/40 hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 pl-9 pr-3 flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">└─ [🟢 VELATRIX SAAS]:</span>
                    <span>Assinatura do Escudo Preventivo ERP</span>
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      SaaS D+0
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    -{formatAv((dreInput.assinaturaSaasErp / results.receitaBrutaTotal) * 100)}
                  </td>
                  {viewMode !== 'ajustado' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.assinaturaSaasErp, currency, language)}
                    </td>
                  )}
                  {viewMode !== 'recorrente' && (
                    <td className="py-2 px-3 text-right text-rose-400">
                      -{formatCurrency(dreInput.assinaturaSaasErp, currency, language)}
                    </td>
                  )}
                  <td className="py-2 px-3 text-center text-slate-500 text-[10px]">SaaS / Tech</td>
                </tr>
              </>
            )}

            {/* --------------------------------------------------------- */}
            {/* 7. (=) EBITDA | RESULTADO OPERACIONAL                     */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-[#091E3A] font-black border-y-2 border-cyan-400/60 text-sm">
              <td className="py-3 px-3 text-white flex items-center gap-2">
                <span className="text-[var(--vx-neon)]">(=)</span>
                <span className="tracking-wide">7. EBITDA | RESULTADO OPERACIONAL</span>
                <span className="text-xs font-mono font-normal text-cyan-300 ml-2">
                  [Margem EBITDA: {results.margemEbitdaRecorrente.toFixed(1)}%]
                </span>
              </td>
              <td className="py-3 px-3 text-right text-[var(--vx-neon)]">
                {formatAv((results.ebitdaRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-[var(--vx-neon)] font-black">
                  {formatCurrency(results.ebitdaRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-cyan-200 font-black">
                  {formatCurrency(results.ebitdaAjustado, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-[var(--vx-neon)] border border-cyan-400/50">
                  {results.margemEbitdaRecorrente.toFixed(1)}% MARGEM
                </span>
              </td>
            </tr>

            {/* Sub-itens operacionais e extraordinários abaixo do EBITDA */}
            <tr className="text-slate-300 hover:bg-slate-900/40 transition-colors">
              <td className="py-2.5 px-3 pl-9">
                <span className="text-slate-400">└─</span> <span className="text-rose-400 font-bold">(-)</span> Depreciação &amp; Amortização
              </td>
              <td className="py-2.5 px-3 text-right text-rose-300">
                -{formatAv((results.depreciacaoAmortizacao / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.depreciacaoAmortizacao, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.depreciacaoAmortizacao, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">Não desembolsável</td>
            </tr>

            <tr className="text-slate-300 hover:bg-slate-900/40 transition-colors">
              <td className="py-2.5 px-3 pl-9">
                <span className="text-slate-400">└─</span> <span className="text-rose-400 font-bold">(-)</span> Despesas Financeiras
              </td>
              <td className="py-2.5 px-3 text-right text-rose-300">
                -{formatAv((results.despesasFinanceiras / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.despesasFinanceiras, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.despesasFinanceiras, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">Juros bancários</td>
            </tr>

            {/* ITEM COM REQUISITO DE CONFORMIDADE LEGAL: ATUALIZAÇÃO SELIC SOBRE INDÉBITOS */}
            <tr className="bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-emerald-950/30 transition-colors">
              <td className="py-2.5 px-3 pl-9">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-emerald-400 font-bold">└─ [🟢 ATUALIZAÇÃO SELIC]:</span>
                  <span className="text-emerald-200 font-bold">
                    Rendimento Monetário sobre Indébitos Recuperados (60M)
                  </span>
                  
                  {/* Tag Obrigatória: NÃO RECORRENTE / EXTRAORDINÁRIO */}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">
                    <Sparkles className="w-2.5 h-2.5" />
                    TEMA 962 STF • ATUALIZADO
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedComplianceModal({
                        isOpen: true,
                        tipo: 'selic_indebito',
                        title: 'Atualização SELIC sobre Indébitos Tributários',
                        tese: 'Tema 962 STF (Não incidência de IRPJ/CSLL sobre juros SELIC na repetição de indébito)',
                        compliance: dreInput.complianceAtualizacaoSelic,
                        valor: dreInput.atualizacaoSelicIndebitosRecuperados
                      })
                    }
                    className="text-cyan-400 hover:text-cyan-200 underline text-[10px] ml-1"
                  >
                    [Ver PER-DCOMP / Habilitação]
                  </button>
                </div>
                <p className="text-[10px] text-emerald-300/80 mt-0.5 pl-5">
                  {dreInput.complianceAtualizacaoSelic.numeroProcessoOuPerDcomp} • {dreInput.complianceAtualizacaoSelic.orgaoJulgadorOuFiscal}
                </p>
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-300">
                +{formatAv((dreInput.atualizacaoSelicIndebitosRecuperados / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-slate-500 italic text-[11px]">
                  [Isolado p/ regra]
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                  +{formatCurrency(dreInput.atualizacaoSelicIndebitosRecuperados, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center">
                {results.isSelicValida ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 inline-flex items-center gap-1">
                    <Check className="w-3 h-3" /> HOMOLOGADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-700/60 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> PENDENTE PROC.
                  </span>
                )}
              </td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 8. (=) EBT | EARNINGS BEFORE TAXES                        */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-slate-900/80 font-bold border-y border-slate-800">
              <td className="py-2.5 px-3 flex items-center gap-2">
                <span className="text-cyan-400">(=)</span>
                <span className="tracking-wide">8. EBT | EARNINGS BEFORE TAXES (Resultado Antes dos Impostos)</span>
              </td>
              <td className="py-2.5 px-3 text-right text-cyan-300">
                {formatAv((results.ebtRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-white font-bold">
                  {formatCurrency(results.ebtRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-cyan-200 font-bold">
                  {formatCurrency(results.ebtAjustado, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center text-slate-400 text-[10px]">Base Tributável</td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 9. (-) PROVISÃO IRPJ / CSLL                               */}
            {/* --------------------------------------------------------- */}
            <tr className="text-slate-300 hover:bg-slate-900/40 transition-colors">
              <td className="py-2.5 px-3 pl-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-rose-400 font-bold">(-)</span>
                  <span className="font-bold">9. PROVISÃO IRPJ / CSLL (Ajustado por Equiparação Hospitalar se aplicável)</span>
                  {results.isEquiparacaoHospitalarAtiva ? (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      REGIME EQUIPARAÇÃO HOSPITALAR (8%/12% PRESUNÇÃO)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      ALÍQUOTA PADRÃO (34%)
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-3 text-right text-rose-300">
                -{formatAv((results.impostosLucroRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.impostosLucroRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-2.5 px-3 text-right text-rose-400">
                  -{formatCurrency(results.impostosLucroAjustado, currency, language)}
                </td>
              )}
              <td className="py-2.5 px-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowHospitalarModal(true)}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  {results.isEquiparacaoHospitalarAtiva ? '14.5% Efetivo' : '34.0% Efetivo'}
                </button>
              </td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 10. (=) LUCRO LÍQUIDO AJUSTADO                            */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 font-black border-y-2 border-emerald-500/60 text-base">
              <td className="py-3.5 px-3 text-white flex items-center gap-2">
                <span className="text-emerald-400">(=)</span>
                <span className="tracking-wide">10. LUCRO LÍQUIDO AJUSTADO</span>
                <span className="text-xs font-mono font-bold text-emerald-400 ml-2">
                  [Margem Líquida: {results.margemLiquidaRecorrente.toFixed(1)}%]
                </span>
              </td>
              <td className="py-3.5 px-3 text-right text-emerald-300 text-xs">
                {formatAv((results.resultadoLiquidoRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-3.5 px-3 text-right text-emerald-400 font-black">
                  {formatCurrency(results.resultadoLiquidoRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3.5 px-3 text-right text-emerald-300 font-black">
                  {formatCurrency(results.resultadoLiquidoAjustado, currency, language)}
                </td>
              )}
              <td className="py-3.5 px-3 text-center">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-md">
                  {results.margemLiquidaRecorrente.toFixed(1)}% M.L.
                </span>
              </td>
            </tr>

            {/* --------------------------------------------------------- */}
            {/* 11. 🌟 (=) NOPAT (NET OPERATING PROFIT AFTER TAXES)       */}
            {/* --------------------------------------------------------- */}
            <tr className="bg-gradient-to-r from-cyan-950/40 via-slate-950 to-cyan-950/40 font-bold text-cyan-200 border-b border-cyan-500/30">
              <td className="py-3 px-3 pl-6 flex items-center gap-2">
                <span className="text-[var(--vx-neon)]">🌟 (=)</span>
                <span className="font-extrabold text-white">11. NOPAT (Net Operating Profit After Taxes):</span>
                <span className="text-xs text-cyan-300">Métrica final de geração de caixa real pós-otimização do Velatrix</span>
              </td>
              <td className="py-3 px-3 text-right text-cyan-300 text-xs">
                {formatAv((results.nopatRecorrente / results.receitaBrutaTotal) * 100)}
              </td>
              {viewMode !== 'ajustado' && (
                <td className="py-3 px-3 text-right text-[var(--vx-neon)] font-bold">
                  {formatCurrency(results.nopatRecorrente, currency, language)}
                </td>
              )}
              {viewMode !== 'recorrente' && (
                <td className="py-3 px-3 text-right text-cyan-200 font-extrabold">
                  {formatCurrency(results.nopatAjustado, currency, language)}
                </td>
              )}
              <td className="py-3 px-3 text-center">
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-[var(--vx-neon)] border border-cyan-400/60">
                  CAIXA OPERACIONAL
                </span>
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTOTAL VISUAL SEPARADO: AJUSTES TRIBUTÁRIOS EXTRAORDINÁRIOS */}
      {/* REQUISITO CRÍTICO: Nunca somar sem essa separação visual clara */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 m-5 lg:m-7 p-5 rounded-2xl bg-gradient-to-b from-[var(--vx-deep)] to-[var(--vx-deep)] border-2 border-purple-500/50 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-purple-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-purple-300 uppercase tracking-wider">
                  SUBTOTAL OBRIGATÓRIO: AJUSTES TRIBUTÁRIOS EXTRAORDINÁRIOS
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  NÃO RECORRENTE • TRANSITADO EM JULGADO
                </span>
              </div>
              <p className="text-[11px] text-purple-300/70 font-mono mt-0.5">
                Valores segregados da receita operacional ordinária em estrito cumprimento às normas contábeis e fiscais.
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-purple-400 uppercase tracking-tight block">Impacto Total Bruto</span>
            <div className="text-lg font-black text-purple-200">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.impactoTotalBruto, currency, language)}
            </div>
          </div>
        </div>

        {/* 3 Colunas dos Ajustes Extraordinários Homologados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 font-mono text-xs">
          
          {/* Item 1: Estorno PIS/COFINS e ICMS-ST */}
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-bold uppercase">1. Estorno PIS/COFINS &amp; ICMS-ST</span>
              <span className="text-[9px] text-emerald-400 font-bold">100% OK</span>
            </div>
            <div className="text-sm font-bold text-white">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.estornoPisCofinsIcmsSt, currency, language)}
            </div>
            <p className="text-[10px] text-purple-300/80 truncate">
              {dreInput.complianceEstornoPisCofins.numeroProcessoOuPerDcomp}
            </p>
          </div>

          {/* Item 2: INSS Patronal Revertido */}
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-bold uppercase">2. Reversão INSS Patronal</span>
              <span className="text-[9px] text-emerald-400 font-bold">100% OK</span>
            </div>
            <div className="text-sm font-bold text-white">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.reversaoInssPatronal, currency, language)}
            </div>
            <p className="text-[10px] text-purple-300/80 truncate">
              {dreInput.complianceInssPatronal.numeroProcessoOuPerDcomp}
            </p>
          </div>

          {/* Item 3: Atualização SELIC */}
          <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-700/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 font-bold uppercase">3. Rendimento SELIC Indébitos</span>
              <span className="text-[9px] text-purple-300 font-bold">Tema 962 STF</span>
            </div>
            <div className="text-sm font-bold text-white">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.atualizacaoSelic, currency, language)}
            </div>
            <p className="text-[10px] text-purple-300/80 truncate">
              {dreInput.complianceAtualizacaoSelic.numeroProcessoOuPerDcomp}
            </p>
          </div>

        </div>

        <div className="mt-3 pt-3 border-t border-purple-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-purple-300/80">
          <div>
            <span>Impacto Líquido Preservado no Caixa (livre de tributação): </span>
            <strong className="text-purple-100">
              +{formatCurrency(results.subtotalAjustesTributariosExtraordinarios.impactoTotalLiquidoAposIr, currency, language)}
            </strong>
          </div>
          {onNavigateToTaxRecovery && (
            <button
              type="button"
              onClick={onNavigateToTaxRecovery}
              className="text-cyan-300 hover:text-cyan-100 underline flex items-center gap-1 self-start sm:self-auto"
            >
              Auditar Laudo Pericial de 60 Meses ➔
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DISCLAIMER FIXO OBRIGATÓRIO NO RODAPÉ DO CARD                 */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 px-5 lg:px-7 py-3.5 bg-slate-950 border-t border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-400 font-mono">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-300">Aviso Legal Obrigatório: </strong>
          Valores de recuperação tributária são estimativas sujeitas a comprovação documental, homologação e trânsito em julgado. Este relatório não constitui garantia de recuperação nem aconselhamento jurídico/tributário.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CHECKLIST DE ELEGIBILIDADE - EQUIPARAÇÃO HOSPITALAR    */}
      {/* REQUISITO CRÍTICO: Nunca aplicar automaticamente               */}
      {/* ------------------------------------------------------------- */}
      {showHospitalarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-2xl p-6 font-mono text-xs text-white max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Checklist de Elegibilidade: Equiparação Hospitalar</h4>
                  <span className="text-[10px] text-slate-400 block">Lei 9.249/95 art. 15 §1º III "a" • Tema 217 STJ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHospitalarModal(false)}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AVISO DE CONFORMIDADE CRÍTICO */}
            <div className="my-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-[11px] leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-300 block font-bold mb-1">
                  AVISO DE RISCO FISCAL CRÍTICO (MULTA DE 150%):
                </strong>
                A aplicação do benefício de redução da base presumida de IRPJ (de 32% para 8%) e CSLL (de 32% para 12%) só pode ser habilitada manualmente mediante comprovação documental de TODOS os requisitos cumulativos. A aplicação indevida configura infração grave com glosa fiscal da RFB e autuação qualificada.
              </div>
            </div>

            {/* Checklist de Requisitos Documentais */}
            <div className="space-y-3 my-4">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                1. Requisitos Cumulativos Obrigatórios:
              </span>

              {/* Critério 1: ANVISA */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={dreInput.complianceHospitalar.registroAnvisaAtivo}
                  onChange={() => handleToggleHospitalarField('registroAnvisaAtivo')}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <strong className="text-slate-200 block">Registro Ativo na ANVISA / Licença Sanitária</strong>
                  <span className="text-[10px] text-slate-400">
                    Alvará sanitário válido emitido pelo órgão de vigilância sanitária municipal/estadual.
                  </span>
                </div>
              </label>

              {/* Critério 2: Estrutura Cirúrgica / Internação */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={dreInput.complianceHospitalar.estruturaInternacaoCirurgicaComprovada}
                  onChange={() => handleToggleHospitalarField('estruturaInternacaoCirurgicaComprovada')}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <strong className="text-slate-200 block">Estrutura Física Compatível (RDC 50 ANVISA)</strong>
                  <span className="text-[10px] text-slate-400">
                    Comprovação de realização de procedimentos cirúrgicos ambulatoriais, internação ou exames complexos de apoio diagnóstico.
                  </span>
                </div>
              </label>

              {/* Critério 3: Sociedade Empresária */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={dreInput.complianceHospitalar.sociedadeEmpresariaComprovada}
                  onChange={() => handleToggleHospitalarField('sociedadeEmpresariaComprovada')}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <strong className="text-slate-200 block">Constituição como Sociedade Empresária (JUCESP/Junta)</strong>
                  <span className="text-[10px] text-slate-400">
                    Inscrição na Junta Comercial com organização de fatores de produção (não sociedade simples de profissionais).
                  </span>
                </div>
              </label>

              {/* Critério 4: Custos Individualizados */}
              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={dreInput.complianceHospitalar.custosHospitalaresIndividualizados}
                  onChange={() => handleToggleHospitalarField('custosHospitalaresIndividualizados')}
                  className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <strong className="text-slate-200 block">Contabilidade Segregada de Procedimentos Hospitalares</strong>
                  <span className="text-[10px] text-slate-400">
                    Demonstração contábil apartada separando consultas simples médicas (alíquota cheia 32%) de serviços cirúrgicos/hospitalares (8%).
                  </span>
                </div>
              </label>
            </div>

            {/* Termo de Responsabilidade e Chave Geral */}
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dreInput.complianceHospitalar.termoResponsabilidadeAceito}
                  onChange={() => handleToggleHospitalarField('termoResponsabilidadeAceito')}
                  className="mt-0.5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-[11px] text-cyan-200">
                  Declaro sob as penas da lei que o contribuinte preenche integralmente todos os requisitos documentais acima e assume a responsabilidade exclusiva pela opção fiscal.
                </span>
              </label>

              <div className="pt-2 border-t border-cyan-900/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Ativar Benefício no Cálculo da DRE</span>
                  <span className="text-[10px] text-slate-400">
                    Reduz alíquota efetiva de tributação sobre o lucro presumido para 14.5%
                  </span>
                </div>

                <button
                  type="button"
                  disabled={
                    !dreInput.complianceHospitalar.registroAnvisaAtivo ||
                    !dreInput.complianceHospitalar.estruturaInternacaoCirurgicaComprovada ||
                    !dreInput.complianceHospitalar.sociedadeEmpresariaComprovada ||
                    !dreInput.complianceHospitalar.custosHospitalaresIndividualizados ||
                    !dreInput.complianceHospitalar.termoResponsabilidadeAceito
                  }
                  onClick={() => {
                    handleToggleHospitalarField('habilitadoManualmente');
                    setShowHospitalarModal(false);
                  }}
                  className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                    dreInput.complianceHospitalar.habilitadoManualmente
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  {dreInput.complianceHospitalar.habilitadoManualmente
                    ? 'Desativar Equiparação'
                    : 'Habilitar Equiparação'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CONFORMIDADE LEGAL DO PROCESSO / PER-DCOMP OBRIGATÓRIO  */}
      {/* ------------------------------------------------------------- */}
      {selectedComplianceModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-950 border border-purple-500/50 shadow-2xl p-6 font-mono text-xs text-white">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-white">{selectedComplianceModal.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplianceModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Tese Tributária Vinculada</span>
                <p className="text-xs font-bold text-cyan-300">{selectedComplianceModal.tese}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Valor Contabilizado (Ajuste Extraordinário)</span>
                <p className="text-base font-black text-purple-300">
                  +{formatCurrency(selectedComplianceModal.valor, currency, language)}
                </p>
              </div>

              {/* Campo Obrigatório: Número do Processo / PER-DCOMP */}
              <div>
                <label className="text-[10px] text-slate-300 block uppercase font-bold mb-1">
                  * Número do Processo Judicial / Habilitação PER-DCOMP (Obrigatório):
                </label>
                <input
                  type="text"
                  value={selectedComplianceModal.compliance.numeroProcessoOuPerDcomp}
                  onChange={e =>
                    setSelectedComplianceModal(prev => ({
                      ...prev,
                      compliance: {
                        ...prev.compliance,
                        numeroProcessoOuPerDcomp: e.target.value
                      }
                    }))
                  }
                  placeholder="Ex: PER-DCOMP 08314.92182/2024-11 ou Proc. 5002148-77..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Órgão Julgador / Fiscal */}
              <div>
                <label className="text-[10px] text-slate-300 block uppercase font-bold mb-1">
                  Órgão Julgador ou Unidade da RFB:
                </label>
                <input
                  type="text"
                  value={selectedComplianceModal.compliance.orgaoJulgadorOuFiscal || ''}
                  onChange={e =>
                    setSelectedComplianceModal(prev => ({
                      ...prev,
                      compliance: {
                        ...prev.compliance,
                        orgaoJulgadorOuFiscal: e.target.value
                      }
                    }))
                  }
                  placeholder="Ex: TRF-3 / Delegacia da RFB"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Checkbox Trânsito em Julgado / Homologação */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedComplianceModal.compliance.hasTransitoEmJulgadoOuHomologacao}
                  onChange={e =>
                    setSelectedComplianceModal(prev => ({
                      ...prev,
                      compliance: {
                        ...prev.compliance,
                        hasTransitoEmJulgadoOuHomologacao: e.target.checked
                      }
                    }))
                  }
                  className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="text-[11px] text-slate-300 leading-tight">
                  Confirmo que há <strong>decisão judicial com trânsito em julgado</strong> ou <strong>despacho decisório de homologação</strong> emitido pela autoridade fiscal.
                </span>
              </label>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedComplianceModal(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedComplianceModal.tipo) {
                    handleSaveComplianceProcess(
                      selectedComplianceModal.tipo,
                      selectedComplianceModal.compliance
                    );
                  }
                }}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                Salvar Conformidade
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
