import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  FileCode, 
  Flame, 
  TrendingUp, 
  Sparkles,
  SlidersHorizontal,
  Fingerprint,
  Zap,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { CriticalDecisionCardAST, ZeroGuiAction, SupportedLanguage, SupportedCurrency } from '../types/aos';
import { ExecutionPayloadViewer } from './ExecutionPayloadViewer';
import { ProofOfIntentGuardBanner } from './ProofOfIntentGuardBanner';
import { SectorRegulatoryBadge } from './SectorRegulatoryBadge';
import { TRANSLATIONS } from '../utils/i18n';

interface ZeroGuiCardRendererProps {
  ast: CriticalDecisionCardAST;
  onApproveMultiSig: (ast: CriticalDecisionCardAST) => void;
  onAdjustParameters: (instruction: string) => void;
  isProcessing: boolean;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
}

export const ZeroGuiCardRenderer: React.FC<ZeroGuiCardRendererProps> = ({
  ast,
  onApproveMultiSig,
  onAdjustParameters,
  isProcessing,
  language = 'pt',
  currency = 'BRL'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;

  // Swipe State
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signingStep, setSigningStep] = useState<'idle' | 'ceo_sign' | 'cfo_sign' | 'aos_consensus' | 'completed'>('idle');
  const [fraudChallengeOverridden, setFraudChallengeOverridden] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Adjustment Modal/Inline state
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [adjustText, setAdjustText] = useState('');

  // Reset signed state when AST changes
  useEffect(() => {
    setIsSigned(false);
    setSigningStep('idle');
    setSliderPos(0);
    setFraudChallengeOverridden(false);
  }, [ast.audit_hash]);

  const handleStartDrag = (clientX: number) => {
    if (isSigned || isProcessing || (ast.security_guard?.fraud_alert_active && !fraudChallengeOverridden)) return;
    setIsDragging(true);
  };

  const handleDrag = (clientX: number) => {
    if (!isDragging || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const maxX = rect.width - 56;
    const currentX = Math.max(0, Math.min(clientX - rect.left - 24, maxX));
    setSliderPos(currentX);

    if (currentX >= maxX * 0.92) {
      triggerMultiSigSignature();
    }
  };

  const handleEndDrag = () => {
    if (!isSigned) {
      setIsDragging(false);
      setSliderPos(0);
    }
  };

  const triggerMultiSigSignature = () => {
    setIsDragging(false);
    setIsSigned(true);
    if (sliderRef.current) {
      setSliderPos(sliderRef.current.getBoundingClientRect().width - 56);
    }

    setSigningStep('ceo_sign');

    setTimeout(() => {
      setSigningStep('cfo_sign');
    }, 600);

    setTimeout(() => {
      setSigningStep('aos_consensus');
    }, 1200);

    setTimeout(() => {
      setSigningStep('completed');
      onApproveMultiSig(ast);
    }, 1800);
  };

  const handleSendAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustText.trim()) return;
    onAdjustParameters(adjustText.trim());
    setAdjustText('');
    setShowAdjustPanel(false);
  };

  const isCritical = ast.priority === 'Critical';
  const swipeAction = ast.actions.find(a => a.type === 'SwipeMultiSig') || ast.actions[0];
  const isExecutionBlocked = ast.security_guard?.fraud_alert_active && !fraudChallengeOverridden;

  return (
    <div id="zero-gui-card-root" className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      
      {/* Top Header Card */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isCritical ? 'bg-rose-950/40 border-rose-900/60' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            isCritical 
              ? 'bg-rose-950/80 border-rose-800 text-rose-300' 
              : 'bg-slate-900 border-slate-700 text-cyan-400'
          }`}>
            {isCritical ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight">
                {t.decisionCardTitle || 'Card de Decisão Tática Autônoma'}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isCritical 
                  ? 'bg-rose-950 text-rose-200 border border-rose-800' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700'
              }`}>
                {ast.priority}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              AST Hash: {ast.audit_hash || '0x4e9a...'} • Requer Governança Zero-Trust
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ast.sector_context && (
            <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>{ast.sector_context.sectorLabel}</span>
              <span className="text-[9px] font-mono text-amber-300/80 border-l border-slate-600 pl-1.5">{ast.sector_context.regulatoryStandard}</span>
            </span>
          )}

          <span className="text-[11px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-700">
            AST Render: <code className="text-cyan-400 font-mono">{ast.ui_type}</code>
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 space-y-5">

        {/* Proof of Intent & Anti-Fraud Security Guard Banner */}
        <ProofOfIntentGuardBanner 
          securityGuard={ast.security_guard}
          onOverrideFraudChallenge={() => setFraudChallengeOverridden(true)}
        />
        
        {/* Executive Summary */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            {language === 'pt' ? 'Resumo Executivo' : language === 'es' ? 'Resumen Ejecutivo' : 'Executive Summary'}
          </span>
          <p className="text-sm font-medium text-slate-100 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/90">
            {ast.summary}
          </p>
        </div>

        {/* KPIs Grid */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
            {t.kpisAnalyzed || 'KPIs e Métricas Impactadas'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ast.kpis.map((kpi, idx) => {
              const isPositive = kpi.impact === 'positive';
              const isNegative = kpi.impact === 'negative';

              return (
                <div
                  key={idx}
                  id={`kpi-card-${idx}`}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isPositive 
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-100' 
                      : isNegative 
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-100' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-medium text-slate-400 truncate mb-1">
                    {kpi.label}
                  </span>
                  <div className="text-sm sm:text-base font-extrabold tracking-tight flex items-center justify-between">
                    <span>{kpi.value}</span>
                    <span className={`text-[10px] font-bold px-1 rounded ${
                      isPositive ? 'bg-emerald-900/60 text-emerald-300' : isNegative ? 'bg-rose-900/60 text-rose-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isPositive ? '▲' : isNegative ? '▼' : '●'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invariants Checked Matrix (Zero-Trust Security) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              {t.invariantsValidated || 'Invariantes de Negócio Validadas'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold font-mono">
              100% {language === 'pt' ? 'Regras Aprovadas' : language === 'es' ? 'Reglas Aprobadas' : 'Rules Passed'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ast.invariants_checked.map((invariant, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px] truncate">{invariant}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Payload & Tool Calling Module */}
        {ast.execution_payload && (
          <ExecutionPayloadViewer
            payload={ast.execution_payload}
            isExecuted={isSigned}
          />
        )}

        {/* Actions Section: SwipeMultiSig & Voice/Parameter Refinement */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          
          {/* Multi-Sig Signing Progress Animation */}
          {isSigned && signingStep !== 'idle' && (
            <div id="multisig-signing-box" className="p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-cyan-400 animate-pulse" />
                  Assinatura Criptográfica Multi-Sig em Andamento:
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {signingStep === 'completed' ? '3 de 3 Assinaturas Confirmadas' : 'Validando nós...'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded border bg-emerald-950/60 border-emerald-700 text-emerald-300">
                  ✓ CEO Key (0x7f4a...e1)
                </div>
                <div className={`p-2 rounded border ${signingStep === 'cfo_sign' || signingStep === 'aos_consensus' || signingStep === 'completed' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  {signingStep === 'ceo_sign' ? '⏳ Assinando CFO...' : '✓ CFO Key (0x2c9b...88)'}
                </div>
                <div className={`p-2 rounded border ${signingStep === 'aos_consensus' || signingStep === 'completed' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                  {signingStep === 'completed' ? '✓ AOS Consensus Core' : '⏳ Validando AOS...'}
                </div>
              </div>
            </div>
          )}

          {/* Swipe to MultiSig Interactive Slider */}
          {!isSigned && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-medium font-mono">{t.approveAndSign || 'Ação Executiva'}</span>
                {isExecutionBlocked ? (
                  <span className="text-[10px] font-mono text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Ação Bloqueada: Quarentena Antifraude Ativa
                  </span>
                ) : (
                  <span className="font-mono text-slate-500">Tipo: SwipeMultiSig</span>
                )}
              </div>

              {/* Slider Track */}
              <div
                ref={sliderRef}
                onMouseMove={(e) => isDragging && handleDrag(e.clientX)}
                onMouseUp={handleEndDrag}
                onMouseLeave={handleEndDrag}
                onTouchMove={(e) => isDragging && handleDrag(e.touches[0].clientX)}
                onTouchEnd={handleEndDrag}
                className={`relative h-14 rounded-2xl p-1.5 flex items-center select-none overflow-hidden transition-all ${
                  isExecutionBlocked
                    ? 'bg-rose-950/30 border border-rose-900/60 cursor-not-allowed opacity-75'
                    : isSigned
                    ? 'bg-emerald-950 border border-emerald-500/80 shadow-lg shadow-emerald-950/60'
                    : isCritical
                    ? 'bg-rose-950/50 border border-rose-900/80'
                    : 'bg-slate-950 border border-slate-800'
                }`}
              >
                {/* Background Fill as dragged */}
                <div
                  className={`absolute inset-0 transition-all pointer-events-none ${
                    isSigned ? 'bg-emerald-600/30' : isCritical ? 'bg-rose-600/20' : 'bg-cyan-500/20'
                  }`}
                  style={{ width: `${(sliderPos / ((sliderRef.current?.getBoundingClientRect().width || 100) - 56)) * 100}%` }}
                />

                {/* Track Guidance Text */}
                <div className="w-full text-center text-xs font-bold tracking-wide flex items-center justify-center gap-2 text-slate-300 pointer-events-none">
                  {isExecutionBlocked ? (
                    <span className="text-rose-400 flex items-center gap-1.5">
                      <Lock className="w-4 h-4" /> Desbloqueie o Desafio Antifraude acima para autorizar
                    </span>
                  ) : isSigned ? (
                    <span className="text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> {language === 'pt' ? 'Ação Despachada com Sucesso' : 'Dispatched Successfully'}
                    </span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 text-cyan-400" />
                      <span>{swipeAction?.label || (language === 'pt' ? 'Deslize para Assinar com Multi-Sig' : 'Swipe to Sign with Multi-Sig')}</span>
                    </>
                  )}
                </div>

                {/* Draggable Slider Knob */}
                {!isExecutionBlocked && (
                  <div
                    id="multisig-slider-knob"
                    onMouseDown={(e) => handleStartDrag(e.clientX)}
                    onTouchStart={(e) => handleStartDrag(e.touches[0].clientX)}
                    style={{ transform: `translateX(${sliderPos}px)` }}
                    className={`absolute left-1.5 top-1.5 w-11 h-11 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow z-10 ${
                      isSigned
                        ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/50'
                        : isCritical
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 hover:bg-rose-500'
                        : 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 hover:bg-cyan-300'
                    }`}
                  >
                    {isSigned ? (
                      <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                    ) : (
                      <ChevronRight className="w-6 h-6 stroke-[3]" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Secondary Action: Refine via Voice or Prompt */}
          <div className="flex items-center justify-between pt-1">
            <button
              id="btn-open-adjust-parameters"
              onClick={() => setShowAdjustPanel(!showAdjustPanel)}
              className="text-xs font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t.adjustParameters || 'Ajustar Diretrizes'}</span>
            </button>

            {isSigned && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {language === 'pt' ? 'Despachado' : 'Dispatched'}
              </span>
            )}
          </div>

          {/* Inline Adjust/Counter-Offer Module */}
          {showAdjustPanel && (
            <form onSubmit={handleSendAdjust} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold">{t.adjustPlaceholder || 'Instrução Tática:'}</span>
                <span className="text-[10px] text-slate-500 font-mono">Ex: &quot;Ajuste o desconto de retenção para 5%&quot;</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={adjustText}
                  onChange={(e) => setAdjustText(e.target.value)}
                  placeholder={language === 'pt' ? 'Digite seu ajuste tático...' : language === 'es' ? 'Escriba su ajuste táctico...' : 'Type your tactical adjustment...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[var(--vx-neon)]"
                />

                <button
                  type="submit"
                  disabled={!adjustText.trim() || isProcessing}
                  className="px-3 py-2 rounded-lg bg-[var(--vx-neon)] hover:bg-cyan-400 text-slate-950 text-xs font-black transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

        </div>

      </div>

    </div>
  );
};
