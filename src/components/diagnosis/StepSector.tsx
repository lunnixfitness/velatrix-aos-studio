import React from 'react';
import { ArrowRight, Layers, Target, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SectorRiskProfile, MULTI_SECTOR_TAXONOMY } from './taxonomy';
import { SupportedLanguage } from '../../types/aos';

interface StepSectorProps {
  selectedSectorKey: string;
  onSelectSector: (sectorKey: string) => void;
  onNext: () => void;
  language: SupportedLanguage;
}

export const StepSector: React.FC<StepSectorProps> = ({
  selectedSectorKey,
  onSelectSector,
  onNext,
  language
}) => {
  const currentSector = MULTI_SECTOR_TAXONOMY.find(s => s.sectorKey === selectedSectorKey) || MULTI_SECTOR_TAXONOMY[0];
  const IconComponent = currentSector.icon;

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30">
            <Layers className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
            Passo 1: Selecione o Setor Operacional &amp; Modelo de Negócio
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Cada setor possui sua própria árvore de vulnerabilidades operacionais, prazos de tolerância, invariantes regulatórias e dinâmicas de capital de giro. Selecione o segmento mais aderente à empresa.
        </p>
      </div>

      {/* Grid of 7 Sectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {MULTI_SECTOR_TAXONOMY.map((sec) => {
          const isSelected = sec.sectorKey === selectedSectorKey;
          const SecIcon = sec.icon;

          return (
            <button
              key={sec.sectorKey}
              id={`sector-choice-${sec.sectorKey}`}
              onClick={() => onSelectSector(sec.sectorKey)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                isSelected
                  ? `bg-slate-900 ${sec.borderColor} ring-2 ring-[var(--vx-neon)]/40 shadow-xl shadow-[var(--vx-neon)]/10`
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? sec.bgLight : 'bg-slate-900 border border-slate-800'}`}>
                    <SecIcon className={`w-5 h-5 ${sec.color}`} />
                  </div>
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full bg-[var(--vx-neon)]/15 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      SELECIONADO
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      Selecionar →
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className={`text-sm font-bold ${isSelected ? 'text-slate-100' : 'text-slate-200'}`}>
                    {sec.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                    {sec.subName}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{sec.vulnerabilities.length} Vulnerabilidades Mapeadas</span>
                <span className={sec.color}>Taxonomia AOS</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Sector Deep Dive & Confirmation Box */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${currentSector.bgLight} border ${currentSector.borderColor}`}>
              <IconComponent className={`w-5 h-5 ${currentSector.color}`} />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Setor Configurado para Simulação
              </span>
              <h3 className="text-base font-bold text-slate-100">
                {currentSector.name}
              </h3>
            </div>
          </div>

          <button
            id="btn-next-to-company-data"
            onClick={onNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-[var(--vx-neon)]/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>Avançar para Dados da Empresa</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Surgical question preview */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/90 space-y-1">
          <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-mono font-bold uppercase">
            <AlertTriangle className="w-3 h-3" />
            <span>Gatilho Cirúrgico de Dor do Setor</span>
          </div>
          <p className="text-xs text-slate-200 italic leading-relaxed">
            "{currentSector.surgicalTriggerQuestion[language] || currentSector.surgicalTriggerQuestion.pt}"
          </p>
        </div>
      </div>
    </div>
  );
};
