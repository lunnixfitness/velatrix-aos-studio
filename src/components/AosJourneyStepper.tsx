import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Network, 
  ShieldCheck, 
  Fingerprint, 
  Sparkles, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  X, 
  Zap, 
  Check, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { SupportedLanguage } from '../types/aos';

export interface JourneyStepDef {
  id: 'ingestion' | 'analysis' | 'invariants' | 'deliberation' | 'execution' | 'ledger';
  stepNumber: number;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  description: string;
  techBadge: string;
  colorClass: string;
  badgeBg: string;
}

export const JOURNEY_STEPS: JourneyStepDef[] = [
  {
    id: 'ingestion',
    stepNumber: 1,
    label: 'Ingestão do Evento',
    shortLabel: '1. Ingestão',
    subtitle: 'Barramento de Eventos de Negócios',
    icon: Radio,
    description: 'Recebe eventos operacionais em tempo real via Webhook ERP (TOTVS, SAP, Linx), mensageria segura corporativa (WhatsApp, E-mail), OCR multimodal de borda (boletos/NFs) ou barramento assíncrono.',
    techBadge: 'Latência < 40ms • HMAC-SHA256 • Zero-Trust Gate',
    colorClass: 'text-cyan-400 border-cyan-500/40',
    badgeBg: 'bg-cyan-950/60 text-cyan-300'
  },
  {
    id: 'analysis',
    stepNumber: 2,
    label: 'Análise Especializada',
    shortLabel: '2. Agente & Grafo',
    subtitle: 'Consulta ao Grafo Semântico AOS',
    icon: Network,
    description: 'O enxame de agentes especializados (Financeiro, Fiscal, Logístico, Vendas, Jurídico) avalia a situação cruzando o Grafo Semântico corporativo e a base vetorial RAG para medir o impacto sistêmico.',
    techBadge: 'Embeddings pgvector • Graph RAG Hiperdimensional • Context Window Real-Time',
    colorClass: 'text-cyan-400 border-cyan-500/40',
    badgeBg: 'bg-cyan-950/60 text-cyan-300'
  },
  {
    id: 'invariants',
    stepNumber: 3,
    label: 'Invariantes & Compliance',
    shortLabel: '3. Invariantes',
    subtitle: 'Zero-Leak Guard & Regras de Negócio',
    icon: ShieldCheck,
    description: 'O Zero-Leak Guard audita deterministicamente o plano de ação contra limites inegociáveis estipulados pelo conselho (colchão de liquidez mínimo, margem operacional, SLAs contratuais e antifraude).',
    techBadge: '0 Violações Toleradas • Invariantes Determinísticas • Proof-of-Intent Gate',
    colorClass: 'text-cyan-400 border-cyan-500/40',
    badgeBg: 'bg-slate-800 text-slate-200'
  },
  {
    id: 'deliberation',
    stepNumber: 4,
    label: 'Quórum Multi-Sig',
    shortLabel: '4. Quórum Multi-Sig',
    subtitle: 'Deliberação Human-in-the-Loop em Ações Críticas',
    icon: Fingerprint,
    description: 'Para ações de alto risco ou acima do teto orçamentário autônomo (ex: R$ 25k), o AOS sintetiza um Card Zero-GUI sob demanda exigindo quórum de aprovação com chaves criptográficas Secp256k1 de executivos.',
    techBadge: 'Secp256k1 Multi-Sig • Zero-GUI On-Demand • Quórum 2 de 4 Aprovadores C-Level',
    colorClass: 'text-amber-400 border-amber-500/40',
    badgeBg: 'bg-amber-950/60 text-amber-300'
  },
  {
    id: 'execution',
    stepNumber: 5,
    label: 'Execução Autônoma',
    shortLabel: '5. Execução',
    subtitle: 'Despacho Direto nos ERPs e Conectores',
    icon: Sparkles,
    description: 'Despacho automático do payload homologado via APIs nativas de ERPs (TOTVS ADVPL, SAP RFC/REST, Linx, Bling, Senior) ou triggers bancários (PIX, TED, SPB) sem navegação manual em telas legadas.',
    techBadge: 'REST / SOAP / ADVPL RPC • Idempotência 100% • Rollback Transacional Seguro',
    colorClass: 'text-cyan-400 border-cyan-500/40',
    badgeBg: 'bg-cyan-950/60 text-cyan-300'
  },
  {
    id: 'ledger',
    stepNumber: 6,
    label: 'Registro no Ledger',
    shortLabel: '6. Registro Ledger',
    subtitle: 'Hash-Chain Criptográfica Imutável',
    icon: Lock,
    description: 'Emissão de recibo auditável de execução contendo o hash criptográfico SHA-256 encadeado no Livro-Razão (Hash-Chain), com todas as assinaturas digitais, invariantes testadas e agentes deliberantes.',
    techBadge: 'SHA-256 Merkle/Hash-Chain • Imutabilidade Forense • Exportação Oficial CVM/BACEN/SEFAZ',
    colorClass: 'text-cyan-400 border-cyan-500/40',
    badgeBg: 'bg-slate-800 text-slate-200'
  }
];

interface AosJourneyStepperProps {
  isProcessing?: boolean;
  language?: SupportedLanguage;
}

export const AosJourneyStepper: React.FC<AosJourneyStepperProps> = ({
  isProcessing = false
}) => {
  // Check localStorage for persisted user preference; default to true (visible, but compact and collapsed details)
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aos_journey_visible');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Selected step for expanded details (null by default as required)
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // Active processing animation step simulation
  const [processingActiveIndex, setProcessingActiveIndex] = useState<number>(-1);

  // Toggle full bar visibility
  const toggleVisibility = () => {
    setIsVisible(prev => {
      const next = !prev;
      try {
        localStorage.setItem('aos_journey_visible', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Select / deselect step
  const handleStepClick = (stepId: string) => {
    setSelectedStepId(prev => (prev === stepId ? null : stepId));
  };

  // Processing animation feedback
  useEffect(() => {
    if (isProcessing) {
      setProcessingActiveIndex(0);
      const interval = setInterval(() => {
        setProcessingActiveIndex(prev => (prev >= 5 ? 0 : prev + 1));
      }, 450);
      return () => clearInterval(interval);
    } else {
      setProcessingActiveIndex(-1);
    }
  }, [isProcessing]);

  const activeStep = JOURNEY_STEPS.find(s => s.id === selectedStepId);

  // Minimized single-line bar
  if (!isVisible) {
    return (
      <div 
        id="aos-journey-stepper-minimized"
        className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 rounded-xl px-3.5 py-2 flex items-center justify-between transition-all text-xs"
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Zap className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
          <span className="font-semibold text-slate-300">Jornada do AOS:</span>
          <span className="text-slate-500 hidden sm:inline text-[11px]">
            Como o AOS Age (Pipeline de 6 etapas autônomas)
          </span>
        </div>

        <button
          id="btn-show-aos-journey"
          onClick={toggleVisibility}
          className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--vx-neon)] hover:text-white px-2.5 py-1 rounded-lg bg-[var(--vx-neon)]/10 hover:bg-[var(--vx-neon)]/20 border border-[var(--vx-neon)]/30 transition-all cursor-pointer"
          title="Mostrar Jornada do AOS"
        >
          <Eye className="w-3 h-3" />
          <span>Mostrar Jornada do AOS</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      id="aos-journey-stepper"
      className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3 sm:p-3.5 shadow-xl space-y-2.5 transition-all"
    >
      {/* Top Header Row with Title, Quick Indicator and Hide/Show Button */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30 flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-[var(--vx-neon)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                <span>Jornada do AOS</span>
                <span className="text-[10px] text-slate-400 font-normal hidden md:inline">
                  (Como o Sistema Age em Ações Autônomas)
                </span>
              </h4>
              {isProcessing && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--vx-neon)] animate-ping" />
                  Processando Pipeline...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 hidden lg:inline">
            Clique em uma etapa para ver detalhes técnicos
          </span>
          
          <button
            id="btn-hide-aos-journey"
            onClick={toggleVisibility}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shrink-0"
            title="Ocultar Jornada do AOS"
          >
            <EyeOff className="w-3 h-3 text-slate-500" />
            <span>Ocultar Jornada</span>
          </button>
        </div>
      </div>

      {/* 6 Step Nodes / Stepper Bar (Reusing WizardProgressBar aesthetic pattern) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
        {JOURNEY_STEPS.map((step, idx) => {
          const isSelected = step.id === selectedStepId;
          const isCurrentProcessing = isProcessing && processingActiveIndex === idx;
          const IconComp = step.icon;

          return (
            <button
              key={step.id}
              id={`journey-step-btn-${step.id}`}
              onClick={() => handleStepClick(step.id)}
              className={`p-2 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-slate-950 border-[var(--vx-neon)] ring-2 ring-[var(--vx-neon)]/30 shadow-md shadow-[var(--vx-neon)]/10'
                  : isCurrentProcessing
                  ? 'bg-slate-950/90 border-[var(--vx-neon)] ring-1 ring-[var(--vx-neon)]/50 scale-[1.02]'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              {/* Header inside the pill */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[9px] font-mono font-black shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-[var(--vx-neon)] text-slate-950'
                      : isCurrentProcessing
                      ? 'bg-[var(--vx-neon)] text-slate-950 animate-pulse'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                  }`}>
                    {step.stepNumber}
                  </div>
                  <span className={`text-[11px] font-bold truncate transition-colors ${
                    isSelected 
                      ? 'text-[var(--vx-neon)]' 
                      : isCurrentProcessing 
                      ? 'text-[var(--vx-neon)]' 
                      : 'text-slate-300 group-hover:text-slate-100'
                  }`}>
                    {step.shortLabel}
                  </span>
                </div>

                <IconComp className={`w-3 h-3 shrink-0 ml-1 transition-colors ${
                  isSelected 
                    ? 'text-[var(--vx-neon)]' 
                    : isCurrentProcessing 
                    ? 'text-[var(--vx-neon)] animate-spin' 
                    : 'text-slate-500 group-hover:text-slate-300'
                }`} />
              </div>

              {/* Subtitle / Short description in small font */}
              <span className="text-[9px] text-slate-500 font-mono truncate block w-full">
                {step.subtitle}
              </span>

              {/* Active / Selected Bottom Highlight Line */}
              {isSelected && (
                <div className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-[var(--vx-neon)] rounded-full shadow-[0_0_8px_#00F2FF]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded Step Details Drawer (Only visible when user clicks a step) */}
      {activeStep && (
        <div 
          id={`journey-step-details-${activeStep.id}`}
          className="bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150 relative"
        >
          {/* Header of expanded details */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${activeStep.badgeBg} border border-current/20`}>
                <activeStep.icon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Etapa {activeStep.stepNumber}: {activeStep.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    — {activeStep.subtitle}
                  </span>
                </h5>
              </div>
            </div>

            <button
              id="btn-close-journey-step-details"
              onClick={() => setSelectedStepId(null)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Fechar detalhes"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Description text */}
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeStep.description}
          </p>

          {/* Technical badge info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900 text-[10px] font-mono">
            <span className="text-slate-400">
              Assinatura Técnica: <strong className="text-slate-200">{activeStep.techBadge}</strong>
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3 h-3" /> Homologado no AOS Core
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
