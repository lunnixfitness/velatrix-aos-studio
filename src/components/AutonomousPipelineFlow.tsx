import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Sparkles, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Fingerprint, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ArrowDown,
  FileCode, 
  Server, 
  Zap, 
  Layers, 
  RefreshCw, 
  MessageSquare, 
  Mail, 
  Webhook, 
  Scan,
  Lock,
  Radio,
  Check,
  Copy,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { VelatrixLogo } from './VelatrixLogo';

interface AutonomousPipelineFlowProps {
  onOpenVectorStore?: () => void;
  onOpenAstViewer?: () => void;
  onOpenErpConfig?: () => void;
}

export const AutonomousPipelineFlow: React.FC<AutonomousPipelineFlowProps> = ({
  onOpenVectorStore,
  onOpenAstViewer,
  onOpenErpConfig
}) => {
  // Simulator State
  const [activeBranch, setActiveBranch] = useState<'low_risk' | 'high_risk'>('high_risk');
  const [currentStep, setCurrentStep] = useState<number>(4); // 1 to 6
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [biometricApproved, setBiometricApproved] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Active inputs
  const [selectedInputChannel, setSelectedInputChannel] = useState<'whatsapp' | 'webhook' | 'email' | 'ocr'>('whatsapp');

  const runSimulation = (branch: 'low_risk' | 'high_risk') => {
    setActiveBranch(branch);
    setIsSimulating(true);
    setCurrentStep(1);
    setBiometricApproved(false);

    const stepIntervals = [300, 700, 1100, 1500, 1900];

    stepIntervals.forEach((time, index) => {
      setTimeout(() => {
        setCurrentStep(index + 2);
        if (index === stepIntervals.length - 1) {
          setIsSimulating(false);
          if (branch === 'low_risk') {
            setBiometricApproved(true);
          }
        }
      }, time);
    });
  };

  const handleApproveBiometric = () => {
    setBiometricApproved(true);
    setCurrentStep(6);
  };

  const sampleZeroGuiPayload = {
    pipeline_version: "4.8",
    architecture_flow: "VELATRIX_AUTONOMOUS_OPERATING_SYSTEM",
    event_ingress: {
      channel: selectedInputChannel.toUpperCase(),
      source_id: selectedInputChannel === 'whatsapp' ? "ZAPI_WHATSAPP_+5511988220011" : "SEFAZ_NFE_WEBHOOK_GW",
      timestamp: "2026-08-18T10:21:05Z"
    },
    retriever_pgvector: {
      injected_vectors: ["vec_doc_001 (tax_law)", "vec_doc_003 (zero_gui_approval)"],
      similarity_score: 0.94,
      latency_ms: 12
    },
    gemini_decision: {
      model: "models/gemini-3.8-flash",
      tool_called: activeBranch === 'low_risk' ? "execute_direct_rest_erp" : "generate_zero_gui_card_ast",
      risk_classification: activeBranch === 'low_risk' ? "LOW_RISK_UNDER_CAP" : "HIGH_RISK_CRITICAL_EXPOSURE",
      autonomous_budget_cap: "R$ 25.000,00",
      estimated_amount: activeBranch === 'low_risk' ? "R$ 4.200,00" : "R$ 148.500,00"
    },
    execution_outcome: {
      target_erp: "TOTVS Protheus REST / ADVPL v12.1.33",
      requires_biometric_ceo: activeBranch === 'high_risk',
      biometric_status: biometricApproved ? "VERIFIED_ECDSA_SECP256K1" : "PENDING_SWIPE",
      rest_endpoint: "POST /api/v1/production-orders/reroute-and-settle",
      receipt_hash: "0x8F9B2C4E910A4C882190B7E390A4C8129801BC"
    }
  };

  return (
    <div className="bg-slate-900/95 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-6 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#FF7A00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <VelatrixLogo variant="capsule" />
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 flex items-center gap-1">
              <Workflow className="w-3 h-3 text-[var(--vx-neon)]" />
              ARQUITETURA & PIPELINE DE EXECUÇÃO
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Zero-GUI & pgvector
            </span>
          </div>

          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            Fluxo Operacional de Ponta a Ponta (End-to-End Execution Pipeline)
          </h2>
          <p className="text-xs text-slate-300">
            Mapeamento em tempo real do evento multimodal até a chamada REST autenticada no ERP via Gemini 3.7 Flash e pgvector.
          </p>
        </div>

        {/* Action Controls / Interactive Branch Selector */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => runSimulation('low_risk')}
            disabled={isSimulating}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              activeBranch === 'low_risk'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-950/60'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Simular: Ação de Baixo Risco (Auto REST)</span>
          </button>

          <button
            onClick={() => runSimulation('high_risk')}
            disabled={isSimulating}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
              activeBranch === 'high_risk'
                ? 'bg-gradient-to-r from-amber-500 to-[#FF7A00] text-slate-950 font-black shadow-lg shadow-amber-950/60'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Simular: Ação de Alto Risco (Zero-GUI + CEO)</span>
          </button>
        </div>
      </div>

      {/* VISUAL ARCHITECTURE FLOW GRAPH */}
      <div className="relative z-10 space-y-6">
        
        {/* TOP ROW: STAGE 1, 2, 3 & 4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* STEP 1: ENTRADA MULTIMODAL */}
          <div className={`p-4 rounded-xl border transition-all duration-300 relative ${
            currentStep >= 1 
              ? 'bg-slate-950 border-[var(--vx-neon)]/60 shadow-lg shadow-[var(--vx-neon)]/10' 
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-[var(--vx-neon)] bg-[var(--vx-neon)]/10 px-2 py-0.5 rounded border border-[var(--vx-neon)]/30">
                ESTÁGIO 1
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--vx-neon)] animate-pulse" />
            </div>

            <h3 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
              Entrada Multimodal
            </h3>
            <p className="text-[11px] text-slate-400 mb-3 leading-snug">
              Captura em tempo real por múltiplos canais corporativos:
            </p>

            {/* Channels selection pills */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setSelectedInputChannel('whatsapp')}
                className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedInputChannel === 'whatsapp' ? 'bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <MessageSquare className="w-3 h-3 text-[var(--vx-neon-green)]" /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setSelectedInputChannel('webhook')}
                className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedInputChannel === 'webhook' ? 'bg-cyan-500/20 text-[var(--vx-neon)] border border-cyan-500/40 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Webhook className="w-3 h-3 text-[var(--vx-neon)]" /> Webhook
              </button>
              <button
                type="button"
                onClick={() => setSelectedInputChannel('email')}
                className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedInputChannel === 'email' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Mail className="w-3 h-3 text-amber-400" /> E-mail
              </button>
              <button
                type="button"
                onClick={() => setSelectedInputChannel('ocr')}
                className={`px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                  selectedInputChannel === 'ocr' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <Scan className="w-3 h-3 text-purple-400" /> OCR / NF-e
              </button>
            </div>
          </div>

          {/* STEP 2: MIDDLEWARE FASTAPI & GATEWAY */}
          <div className={`p-4 rounded-xl border transition-all duration-300 relative ${
            currentStep >= 2 
              ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/10' 
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                ESTÁGIO 2
              </span>
              <Server className="w-3.5 h-3.5 text-amber-400" />
            </div>

            <h3 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              Middleware FastAPI
            </h3>
            <p className="text-[11px] text-slate-400 mb-2 leading-snug">
              Gateway de autenticação mTLS, normalização de payload e acoplamento ao Barramento Semântico.
            </p>
            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Auth:</span>
                <span className="text-emerald-400 font-bold">mTLS / Secp256k1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Latência:</span>
                <span className="text-[var(--vx-neon)] font-bold">&lt; 8 ms</span>
              </div>
            </div>
          </div>

          {/* STEP 3: EMBEDDINGS & RETRIEVER PGVECTOR */}
          <div className={`p-4 rounded-xl border transition-all duration-300 relative ${
            currentStep >= 3 
              ? 'bg-slate-950 border-[var(--vx-neon-green)]/60 shadow-lg shadow-emerald-500/10' 
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-[var(--vx-neon-green)] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                ESTÁGIO 3
              </span>
              <Database className="w-3.5 h-3.5 text-[var(--vx-neon-green)]" />
            </div>

            <h3 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[var(--vx-neon-green)]" />
              Embeddings & Retriever (pgvector)
            </h3>
            <p className="text-[11px] text-slate-400 mb-2 leading-snug">
              Recuperação RAG de políticas corporativas, leis fiscais e SOPs com score de similaridade &gt; 90%.
            </p>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400 truncate">Vetor Injetado:</span>
              <span className="text-amber-400 font-bold shrink-0">vec_doc_003</span>
            </div>
          </div>

          {/* STEP 4: SYSTEM INSTRUCTIONS GEMINI + FUNCTION CALLING */}
          <div className={`p-4 rounded-xl border transition-all duration-300 relative ${
            currentStep >= 4 
              ? 'bg-slate-950 border-purple-500/60 shadow-lg shadow-purple-500/10' 
              : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                ESTÁGIO 4
              </span>
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <h3 className="text-xs font-black text-white mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Gemini 3.7 + Contexto
            </h3>
            <p className="text-[11px] text-slate-400 mb-2 leading-snug">
              Deliberação pelo Enxame de Agentes e seleção de ferramenta (Function Calling).
            </p>

            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Classificação:</span>
              <span className={`font-bold ${activeBranch === 'low_risk' ? 'text-[var(--vx-neon-green)]' : 'text-rose-400'}`}>
                {activeBranch === 'low_risk' ? 'Baixo Risco' : 'Alto Risco'}
              </span>
            </div>
          </div>

        </div>

        {/* BIFURCATION LEVEL: FUNCTION CALLING DECISION BRANCHES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* BRANCH A: AÇÃO DE BAIXO RISCO (AUTO-EXECUTE REST) */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
            activeBranch === 'low_risk'
              ? 'bg-slate-950 border-emerald-500/70 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/40'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[var(--vx-neon-green)] font-mono text-xs font-bold">
                  A
                </span>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Ramo 1: Ação de Baixo Risco (Autônoma)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-[var(--vx-neon-green)] border border-emerald-500/30">
                Alçada &lt; R$ 25.000
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Quando a invariante de caixa e o teto orçamentário estão respeitados, o VELATRIX <strong>dispara diretamente a chamada REST na API do ERP</strong> sem interrupção humana.
              </p>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>POST /api/v1/erp/inventory/adjust</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Payload autenticado via chave de API e emitido recibo auditável no Ledger.
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300">
                <span>Resultado:</span>
                <span className="font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-[var(--vx-neon-green)]" />
                  Executado no ERP em 842ms
                </span>
              </div>
            </div>
          </div>

          {/* BRANCH B: AÇÃO DE ALTO RISCO (ZERO-GUI JSON PAYLOAD + CEO BIOMETRIC APPROVAL) */}
          <div className={`p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
            activeBranch === 'high_risk'
              ? 'bg-slate-950 border-amber-500/70 shadow-xl shadow-amber-950/40 ring-1 ring-amber-500/40'
              : 'bg-slate-950/40 border-slate-800 opacity-60'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
                  B
                </span>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Ramo 2: Ação de Alto Risco (Zero-GUI On-Demand)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Alçada &gt; R$ 25.000 / Anomalia
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                O modelo gera o <strong>Payload AST Zero-GUI (JSON)</strong> e encaminha notificação executiva de alta prioridade para o CEO.
              </p>

              {/* CEO Biometric Action Box */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-amber-400" />
                    Aprovação Biométrica do CEO (Swipe / FaceID)
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    biometricApproved ? 'bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {biometricApproved ? 'ASSINATURA VERIFICADA' : 'AGUARDANDO BIOMETRIA'}
                  </span>
                </div>

                {!biometricApproved ? (
                  <button
                    onClick={handleApproveBiometric}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-[#FF7A00] to-orange-500 text-slate-950 font-black text-xs hover:opacity-90 transition-all shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4 text-slate-950" />
                    <span>Deslizar para Assinar (Aprovação Biométrica Multi-Sig)</span>
                  </button>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-[11px] font-mono flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[var(--vx-neon-green)]" />
                      Assinado com Chave Secp256k1 (CEO)
                    </span>
                    <span className="text-slate-400 text-[10px]">Chave: 0x7F4A...E19B</span>
                  </div>
                )}
              </div>

              {/* Execution in ERP after Biometrics */}
              <div className="flex items-center justify-between text-[11px] font-mono p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-slate-400">Disparo Autenticado no ERP:</span>
                <span className={`font-bold ${biometricApproved ? 'text-[var(--vx-neon-green)]' : 'text-slate-500'}`}>
                  {biometricApproved ? 'POST /production-orders/re-route (200 OK)' : 'Bloqueado até Biometria'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM: LIVE JSON PAYLOAD TELEMETRY INSPECTOR */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                Payload de Telemetria do Pipeline (JSON Zero-GUI)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(sampleZeroGuiPayload, null, 2));
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedPayload ? <Check className="w-3 h-3 text-[var(--vx-neon-green)]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copiado' : 'Copiar JSON'}</span>
              </button>

              {onOpenVectorStore && (
                <button
                  type="button"
                  onClick={onOpenVectorStore}
                  className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Database className="w-3 h-3" />
                  <span>Ver pgvector</span>
                </button>
              )}

              {onOpenAstViewer && (
                <button
                  type="button"
                  onClick={onOpenAstViewer}
                  className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[var(--vx-neon)] text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileCode className="w-3 h-3" />
                  <span>Inspecionar AST</span>
                </button>
              )}
            </div>
          </div>

          <pre className="text-[11px] font-mono text-emerald-400 bg-slate-900/90 p-3 rounded-lg overflow-x-auto max-h-48 leading-relaxed border border-slate-800/80">
            {JSON.stringify(sampleZeroGuiPayload, null, 2)}
          </pre>
        </div>

      </div>
    </div>
  );
};
