import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  Sparkles,
  Layers,
  Terminal
} from 'lucide-react';
import { SectorRiskProfile } from './taxonomy';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

interface StepRunSimulationProps {
  currentSector: SectorRiskProfile;
  companyName: string;
  companyCnpj: string;
  annualRevenue: number;
  dailyVolume: string;
  ebitdaMargin: number;
  isRunning: boolean;
  onBack: () => void;
  onRunDiagnosis: () => void;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

const SIMULATION_PHASES = [
  {
    phase: 1,
    title: 'Ingestão Semântica D+0',
    description: 'Injetando 148 nós semânticos e 342 arestas no Grafo de Conhecimento AOS...',
    detail: 'Conectores: ERP / SEFAZ / BACEN / Telemetria IoT'
  },
  {
    phase: 2,
    title: 'Modelagem Financeira & Solvência',
    description: 'Computando Altman Z-Score, Sangria de Margem e Prazos Médios de Liquidez...',
    detail: 'Métricas: Z-Score, EBITDA Invariants, PMP/PMR, Cash Drag'
  },
  {
    phase: 3,
    title: 'Orquestração do Enxame Multi-Agente',
    description: 'Convocando 7 agentes especialistas autônomos para auditoria de invariantes...',
    detail: 'Quórum: Compras, Logística, Tesouraria, Fiscal, Legal, Procurement, DR'
  },
  {
    phase: 4,
    title: 'Síntese Executiva & Quarentena Zero-Trust',
    description: 'Gerando árvore de decisão AST e assinaturas criptográficas Secp256k1...',
    detail: 'Payload pronto para o Raio-X Executivo C-Level e exportação PDF'
  }
];

export const StepRunSimulation: React.FC<StepRunSimulationProps> = ({
  currentSector,
  companyName,
  companyCnpj,
  annualRevenue,
  dailyVolume,
  ebitdaMargin,
  isRunning,
  onBack,
  onRunDiagnosis,
  language,
  currency
}) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Simulated animated progress loop during the 2.5s execution window
  useEffect(() => {
    if (!isRunning) {
      setCurrentPhaseIndex(0);
      setProgressPercent(0);
      return;
    }

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + 4;
        const phase = Math.min(3, Math.floor(next / 26));
        setCurrentPhaseIndex(phase);
        return next;
      });
    }, 95);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30">
            <Cpu className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
            Passo 3: Orquestração do Grafo &amp; Execução do Diagnóstico
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Revise as premissas consolidadas. Ao clicar em <strong className="text-[var(--vx-neon)]">RODAR DIAGNÓSTICO</strong>, o motor autônomo do AOS injetará os nós operacionais no Grafo de Conhecimento em tempo real e orquestrará os 7 agentes especialistas.
        </p>
      </div>

      {/* Review Box & Trigger Card */}
      <div className="bg-gradient-to-br from-slate-950 via-[var(--vx-deep)] to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Company & Sector Recap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs relative z-10">
          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-mono">EMPRESA AUDITADA</span>
            <strong className="text-slate-100 font-bold block">{companyName}</strong>
            <span className="text-[10px] text-slate-400 font-mono">{companyCnpj}</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-mono">SETOR OPERACIONAL</span>
            <strong className={`font-bold block ${currentSector.color}`}>{currentSector.name}</strong>
            <span className="text-[10px] text-slate-400 truncate block">{currentSector.subName}</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-mono">RECEITA ANUAL BASE</span>
            <strong className="text-[var(--vx-neon)] font-mono font-bold block">
              {formatCurrency(annualRevenue, currency, language)}
            </strong>
            <span className="text-[10px] text-slate-400">{dailyVolume}</span>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-0.5 font-mono">MARGEM EBITDA DECLARADA</span>
            <strong className="text-teal-300 font-mono font-bold block">{ebitdaMargin}%</strong>
            <span className="text-[10px] text-slate-400">7 Agentes Prontos</span>
          </div>
        </div>

        {/* The Main "RODAR DIAGNÓSTICO" Action Area */}
        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
          {!isRunning ? (
            <div className="space-y-4 max-w-md w-full">
              <button
                id="btn-run-diagnosis-main"
                onClick={onRunDiagnosis}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-[var(--vx-neon)] via-teal-400 to-[var(--vx-neon-green)] hover:opacity-95 text-slate-950 font-black text-sm sm:text-base tracking-wider transition-all shadow-xl shadow-[var(--vx-neon)]/25 hover:shadow-[var(--vx-neon)]/40 flex items-center justify-center gap-3 cursor-pointer group scale-100 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Play className="w-5 h-5 fill-slate-950 stroke-none" />
                </div>
                <span>RODAR DIAGNÓSTICO</span>
                <Sparkles className="w-5 h-5 text-slate-950" />
              </button>

              <p className="text-[11px] text-slate-400">
                Processamento instantâneo no Grafo Semântico D+0 • Telemetria conectada à tela Saúde do Grafo AOS
              </p>
            </div>
          ) : (
            /* Loading State (2-3s animation) */
            <div className="w-full max-w-xl space-y-5 bg-slate-950/90 border border-slate-800 p-6 rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--vx-neon)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESSANDO DIAGNÓSTICO EM TEMPO REAL...</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {Math.min(100, Math.round(progressPercent))}%
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-[var(--vx-neon)] via-teal-400 to-[var(--vx-neon-green)] transition-all duration-100 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Step Checklist */}
              <div className="space-y-2.5 text-left text-xs pt-2">
                {SIMULATION_PHASES.map((phase, idx) => {
                  const isDone = idx < currentPhaseIndex;
                  const isCurrent = idx === currentPhaseIndex;

                  return (
                    <div 
                      key={phase.phase}
                      className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isCurrent
                          ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)]/40 text-slate-100'
                          : isDone
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-50'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isCurrent ? (
                          <Loader2 className="w-4 h-4 text-[var(--vx-neon)] animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 text-[9px] font-mono flex items-center justify-center">
                            {phase.phase}
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold flex items-center gap-2">
                          <span>{phase.phase}/4 • {phase.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons Toolbar */}
      {!isRunning && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            id="btn-back-to-company-data"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar aos Dados da Empresa</span>
          </button>
        </div>
      )}
    </div>
  );
};
