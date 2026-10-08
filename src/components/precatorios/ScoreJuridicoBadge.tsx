import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ScoreJuridicoBadgeProps {
  score: number;
  showDetails?: boolean;
  bloqueadoAutomatico?: boolean;
  motivoBloqueio?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreJuridicoBadge: React.FC<ScoreJuridicoBadgeProps> = ({
  score,
  showDetails = false,
  bloqueadoAutomatico = false,
  motivoBloqueio,
  size = 'md'
}) => {
  if (bloqueadoAutomatico || score === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/60 text-rose-300 font-mono text-xs">
        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="font-bold">SCORE: 0 / 100</span>
        <span className="text-[10px] text-rose-400 font-semibold uppercase">[BLOQUEADO]</span>
        {showDetails && motivoBloqueio && (
          <span className="text-[10px] text-rose-300/80 block mt-1">{motivoBloqueio}</span>
        )}
      </div>
    );
  }

  let colorClasses = 'bg-amber-950/50 border-amber-500/50 text-amber-300';
  let Icon = AlertTriangle;
  let label = 'MODERADO';

  if (score >= 90) {
    colorClasses = 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300';
    Icon = CheckCircle2;
    label = 'TRIPLE-A';
  } else if (score >= 75) {
    colorClasses = 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300';
    Icon = ShieldCheck;
    label = 'DOUBLE-A';
  } else if (score < 50) {
    colorClasses = 'bg-rose-950/50 border-rose-500/50 text-rose-300';
    Icon = AlertOctagon;
    label = 'ALTO RISCO';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm'
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border font-mono ${colorClasses} ${sizeClasses}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div className="flex items-baseline gap-1.5">
        <span className="font-black text-sm">{score}</span>
        <span className="text-[10px] opacity-75 font-semibold">/100</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-bold tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
};
