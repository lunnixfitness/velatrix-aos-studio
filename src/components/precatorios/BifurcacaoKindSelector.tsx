import React from 'react';
import { Sparkles, Scale, Briefcase, Users2 } from 'lucide-react';
import { PrecatorioKind, PRECATORIO_KIND_LABELS, PRECATORIO_KIND_DESCRIPTIONS } from '../../types/precatorios';

interface BifurcacaoKindSelectorProps {
  selectedKind: PrecatorioKind;
  onSelectKind: (kind: PrecatorioKind) => void;
  disabled?: boolean;
}

export const BifurcacaoKindSelector: React.FC<BifurcacaoKindSelectorProps> = ({
  selectedKind,
  onSelectKind,
  disabled = false
}) => {
  const KINDS: Array<{
    id: PrecatorioKind;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderActive: string;
    bgActive: string;
  }> = [
    {
      id: 'originacao_para_cessao',
      icon: Sparkles,
      accentColor: 'text-cyan-400',
      borderActive: 'border-cyan-500 bg-cyan-950/40 shadow-cyan-950/40',
      bgActive: 'bg-cyan-500'
    },
    {
      id: 'compensacao_tributaria',
      icon: Scale,
      accentColor: 'text-emerald-400',
      borderActive: 'border-emerald-500 bg-emerald-950/40 shadow-emerald-950/40',
      bgActive: 'bg-emerald-500'
    },
    {
      id: 'compra_para_carteira',
      icon: Briefcase,
      accentColor: 'text-purple-400',
      borderActive: 'border-purple-500 bg-purple-950/40 shadow-purple-950/40',
      bgActive: 'bg-purple-500'
    },
    {
      id: 'marketplace_p2p',
      icon: Users2,
      accentColor: 'text-amber-400',
      borderActive: 'border-amber-500 bg-amber-950/40 shadow-amber-950/40',
      bgActive: 'bg-amber-500'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Modalidade Operacional do Precatório (Discriminated Union)
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          4 Engines Ativos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KINDS.map(item => {
          const isSelected = selectedKind === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectKind(item.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? `${item.borderActive} shadow-lg ring-1 ring-white/10`
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1.5 rounded-lg bg-slate-950 border border-slate-800 ${item.accentColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  )}
                </div>

                <h5 className="text-xs font-bold text-slate-100 font-mono leading-tight">
                  {PRECATORIO_KIND_LABELS[item.id]}
                </h5>

                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  {PRECATORIO_KIND_DESCRIPTIONS[item.id]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
