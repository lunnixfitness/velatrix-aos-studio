import React from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  Clock 
} from 'lucide-react';
import { BusinessPreferenceLearned } from '../types/aos';

interface FeedbackLoopManagerProps {
  preferences: BusinessPreferenceLearned[];
  onResetPreferences: () => void;
}

export const FeedbackLoopManager: React.FC<FeedbackLoopManagerProps> = ({
  preferences,
  onResetPreferences
}) => {
  if (preferences.length === 0) {
    return null;
  }

  return (
    <div id="feedback-loop-panel" className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <span>Módulo de Aprendizado & Feedback Loop Ativo</span>
              <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                {preferences.length} {preferences.length === 1 ? 'Diretriz Aprendida' : 'Diretrizes Aprendidas'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              O AOS absorveu os ajustes executivos e atualizou permanentemente o estado semântico de regras de negócio.
            </p>
          </div>
        </div>

        <button
          onClick={onResetPreferences}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition-colors cursor-pointer border border-slate-700"
          title="Restaurar parâmetros padrão do sistema"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Resetar Aprendizado</span>
        </button>
      </div>

      {/* Preferences Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {preferences.map((pref) => (
          <div 
            key={pref.id}
            id={`learned-pref-${pref.id}`}
            className="p-3 rounded-xl bg-slate-950/90 border border-amber-900/60 flex flex-col justify-between space-y-2"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> [Grafo Atualizado]
                </span>
                <span>{new Date(pref.timestamp).toLocaleTimeString('pt-BR')}</span>
              </div>

              <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <span>{pref.parameterName}:</span>
                <span className="line-through text-slate-500 text-[11px]">{pref.oldValue}</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
                <span className="text-amber-300 font-bold bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                  {pref.newValue}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {pref.reason}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span className="italic truncate max-w-[240px]">
                Origem: "{pref.sourceInstruction}"
              </span>
              <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Ativa no Grafo
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
