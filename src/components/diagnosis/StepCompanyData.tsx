import React from 'react';
import { Building2, ArrowRight, ArrowLeft, DollarSign, Activity, Layers, ShieldAlert, Sparkles } from 'lucide-react';
import { SectorRiskProfile } from './taxonomy';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

interface StepCompanyDataProps {
  currentSector: SectorRiskProfile;
  companyName: string;
  setCompanyName: (name: string) => void;
  companyCnpj: string;
  setCompanyCnpj: (cnpj: string) => void;
  customRevenue: number | '';
  setCustomRevenue: (revenue: number | '') => void;
  ebitdaMargin: number;
  setEbitdaMargin: (margin: number) => void;
  dailyVolume: string;
  setDailyVolume: (volume: string) => void;
  onBack: () => void;
  onNext: () => void;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const StepCompanyData: React.FC<StepCompanyDataProps> = ({
  currentSector,
  companyName,
  setCompanyName,
  companyCnpj,
  setCompanyCnpj,
  customRevenue,
  setCustomRevenue,
  ebitdaMargin,
  setEbitdaMargin,
  dailyVolume,
  setDailyVolume,
  onBack,
  onNext,
  language,
  currency
}) => {
  const activeRevenue = typeof customRevenue === 'number' && customRevenue > 0
    ? customRevenue
    : currentSector.defaultCompany.annualRevenueBrl;

  const activeName = companyName || currentSector.defaultCompany.name;
  const activeCnpj = companyCnpj || currentSector.defaultCompany.cnpj;
  const activeVolume = dailyVolume || currentSector.defaultCompany.dailyVolume;

  const revenuePresets = [
    { label: 'R$ 25M', value: 25000000 },
    { label: 'R$ 80M', value: 80000000 },
    { label: 'R$ 180M', value: 180000000 },
    { label: 'R$ 350M', value: 350000000 },
    { label: 'R$ 850M', value: 850000000 }
  ];

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30">
            <Building2 className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
            Passo 2: Dados da Empresa &amp; Escala Operacional
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Preencha ou ajuste os dados da organização auditada. A receita anual e a margem EBITDA determinam a proporcionalidade das sangrias ocultas e o cálculo do Altman Z-Score.
        </p>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Fields (2 cols wide on desktop) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="space-y-4">
            {/* Field 1: Company Name */}
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5">
                Razão Social / Nome da Empresa
              </label>
              <input
                id="input-company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={currentSector.defaultCompany.name}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[var(--vx-neon)] focus:ring-1 focus:ring-[var(--vx-neon)]"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Nome que constará no cabeçalho do Raio-X e no Relatório Executivo PDF.
              </span>
            </div>

            {/* Field 2: CNPJ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5">
                  CNPJ / Identificador Fiscal
                </label>
                <input
                  id="input-company-cnpj"
                  type="text"
                  value={companyCnpj}
                  onChange={(e) => setCompanyCnpj(e.target.value)}
                  placeholder={currentSector.defaultCompany.cnpj}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:border-[var(--vx-neon)]"
                />
              </div>

              <div>
                <label className="text-xs font-mono font-bold text-slate-300 block mb-1.5">
                  Volume Diário Operacional
                </label>
                <input
                  id="input-company-volume"
                  type="text"
                  value={dailyVolume}
                  onChange={(e) => setDailyVolume(e.target.value)}
                  placeholder={currentSector.defaultCompany.dailyVolume}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[var(--vx-neon)]"
                />
              </div>
            </div>

            {/* Field 3: Annual Revenue with Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-slate-300">
                  Faturamento Anual (Receita Bruta em BRL)
                </label>
                <span className="text-xs font-mono text-[var(--vx-neon)] font-black">
                  {formatCurrency(activeRevenue, currency, language)} / ano
                </span>
              </div>

              <input
                id="input-company-revenue"
                type="number"
                value={customRevenue}
                onChange={(e) => setCustomRevenue(e.target.value ? Number(e.target.value) : '')}
                placeholder={currentSector.defaultCompany.annualRevenueBrl.toString()}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[var(--vx-neon)] font-mono font-bold placeholder:text-slate-600 focus:outline-none focus:border-[var(--vx-neon)]"
              />

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500 font-mono mr-1">Atalhos:</span>
                {revenuePresets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCustomRevenue(preset.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      activeRevenue === preset.value
                        ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border-[var(--vx-neon)]/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: EBITDA Margin Slider */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <label className="font-mono font-bold text-slate-300">
                  Margem EBITDA Declarada: <span className="text-teal-300 font-bold">{ebitdaMargin}%</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Média do Setor: {currentSector.defaultCompany.declaredEbitdaMarginPercent}%
                </span>
              </div>

              <input
                type="range"
                min="5"
                max="40"
                step="0.5"
                value={ebitdaMargin}
                onChange={(e) => setEbitdaMargin(Number(e.target.value))}
                className="w-full accent-[var(--vx-neon)] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Preview Card */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-slate-400 border-b border-slate-800 pb-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
              <span>Resumo dos Parâmetros</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">Empresa</span>
                <strong className="text-slate-100 font-semibold block">{activeName}</strong>
                <span className="text-[10px] text-slate-400 font-mono">{activeCnpj}</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">Setor de Atuação</span>
                <strong className={`font-semibold block ${currentSector.color}`}>{currentSector.name}</strong>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">Faturamento Anual</span>
                <strong className="text-[var(--vx-neon)] font-mono font-bold block">
                  {formatCurrency(activeRevenue, currency, language)}
                </strong>
                <span className="text-[10px] text-slate-400">{activeVolume}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-400 font-mono font-bold text-[10px]">
              <Activity className="w-3 h-3" />
              <span>Grafo Semântico Pronto</span>
            </div>
            <p className="leading-snug">
              Pronto para orquestrar o Grafo de Conhecimento e os 7 agentes especialistas.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          id="btn-back-to-sector"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Setor</span>
        </button>

        <button
          id="btn-next-to-run-simulation"
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-[var(--vx-neon)]/20 flex items-center gap-2 cursor-pointer"
        >
          <span>Avançar para Rodar Diagnóstico</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
