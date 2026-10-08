import React from 'react';
import { 
  Check, 
  RotateCcw, 
  Layers, 
  Building2, 
  Play, 
  BarChart3, 
  Fingerprint, 
  Lock, 
  Sparkles,
  Info
} from 'lucide-react';

export type WizardStepId = 'sector' | 'company' | 'run' | 'result' | 'decision';

export interface WizardStepDef {
  id: WizardStepId;
  stepNumber: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<any>;
  description: string;
}

export const WIZARD_STEPS: WizardStepDef[] = [
  {
    id: 'sector',
    stepNumber: 1,
    label: 'Setor',
    shortLabel: '1. Setor',
    icon: Layers,
    description: 'Selecione o modelo operacional e taxonomia de mercado'
  },
  {
    id: 'company',
    stepNumber: 2,
    label: 'Dados da Empresa',
    shortLabel: '2. Dados',
    icon: Building2,
    description: 'Defina a razão social, CNPJ e faturamento anual'
  },
  {
    id: 'run',
    stepNumber: 3,
    label: 'Rodar Diagnóstico',
    shortLabel: '3. Simulação',
    icon: Play,
    description: 'Dispare o processamento no Grafo de Conhecimento AOS'
  },
  {
    id: 'result',
    stepNumber: 4,
    label: 'Resultado',
    shortLabel: '4. Raio-X',
    icon: BarChart3,
    description: 'Raio-X de sangria de capital, Z-Score e matemática de perdas'
  },
  {
    id: 'decision',
    stepNumber: 5,
    label: 'Decisão',
    shortLabel: '5. Governança',
    icon: Fingerprint,
    description: 'Painel Human-in-the-Loop e deliberação do Enxame Multi-Sig'
  }
];

interface WizardProgressBarProps {
  currentStep: WizardStepId;
  isDiagnosisExecuted: boolean;
  onSelectStep: (step: WizardStepId) => void;
  onResetDiagnosis: () => void;
}

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  isDiagnosisExecuted,
  onSelectStep,
  onResetDiagnosis
}) => {
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const activeStepDef = WIZARD_STEPS[currentStepIndex] || WIZARD_STEPS[0];
  
  // Progress percentage (0% to 100%)
  const progressPercent = (currentStepIndex / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Header Row: Helper explanation & "Novo Diagnóstico" Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="w-5 h-5 rounded-md bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30 flex items-center justify-center shrink-0">
            <Info className="w-3 h-3 text-[var(--vx-neon)]" />
          </div>
          <p className="leading-snug">
            <strong className="text-slate-100 font-semibold">Ordem das Ações: </strong>
            <span className="text-slate-400">
              1. Setor &gt; 2. Dados da Empresa &gt; 3. Rodar Diagnóstico &gt; 4. Resultado &gt; 5. Decisão
            </span>
          </p>
        </div>

        <button
          id="btn-new-diagnosis-reset"
          onClick={onResetDiagnosis}
          className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
          title="Reiniciar o fluxo e configurar um novo diagnóstico do zero"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
          <span>Novo Diagnóstico</span>
        </button>
      </div>

      {/* Interactive Step Pills / Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative z-10">
        {WIZARD_STEPS.map((step, idx) => {
          const isCurrent = step.id === currentStep;
          const isCompleted = idx < currentStepIndex || (isDiagnosisExecuted && idx < 3);
          const isLocked = (step.id === 'result' || step.id === 'decision') && !isDiagnosisExecuted;
          const IconComp = step.icon;

          return (
            <button
              key={step.id}
              id={`wizard-step-btn-${step.id}`}
              disabled={isLocked}
              onClick={() => onSelectStep(step.id)}
              className={`p-2.5 sm:p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-slate-950 border-[var(--vx-neon)] ring-2 ring-[var(--vx-neon)]/30 shadow-lg shadow-[var(--vx-neon)]/10 cursor-default'
                  : isCompleted
                  ? 'bg-slate-950/70 border-emerald-500/40 hover:border-emerald-500/80 cursor-pointer'
                  : isLocked
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-black ${
                    isCurrent
                      ? 'bg-[var(--vx-neon)] text-slate-950'
                      : isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : isLocked
                      ? 'bg-slate-800 text-slate-500'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNumber}
                  </div>
                  <span className={`text-[11px] font-bold truncate ${
                    isCurrent ? 'text-[var(--vx-neon)]' : isCompleted ? 'text-slate-200' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {isLocked ? (
                  <Lock className="w-3 h-3 text-slate-600 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-[var(--vx-neon)] animate-pulse" />
                ) : null}
              </div>

              <span className="text-[9px] text-slate-500 font-mono hidden sm:block truncate">
                {isLocked ? 'Disponível após rodar' : step.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">
            Etapa <strong className="text-slate-100">{currentStepIndex + 1} de {WIZARD_STEPS.length}</strong>: <span className="text-[var(--vx-neon)] font-semibold">{activeStepDef.label}</span>
          </span>
          <span className="text-slate-400 font-bold">
            {Math.round(progressPercent)}% Concluído
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div 
            className="h-full bg-gradient-to-r from-[var(--vx-neon)] via-teal-400 to-[var(--vx-neon-green)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
