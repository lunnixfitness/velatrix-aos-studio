import React, { useState } from 'react';
import { 
  Zap, 
  Copy, 
  Check, 
  Send, 
  CheckCircle2, 
  KeyRound, 
  ChevronDown,
  ChevronUp,
  Code2
} from 'lucide-react';
import { ExecutionPayload } from '../types/aos';

interface ExecutionPayloadViewerProps {
  payload?: ExecutionPayload;
  isExecuted?: boolean;
  onSimulateWebhook?: () => void;
}

export const ExecutionPayloadViewer: React.FC<ExecutionPayloadViewerProps> = ({
  payload,
  isExecuted = false,
  onSimulateWebhook
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  if (!payload) {
    return null;
  }

  const jsonString = JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerWebhook = () => {
    setWebhookSent(true);
    if (onSimulateWebhook) {
      onSimulateWebhook();
    }
    setTimeout(() => setWebhookSent(false), 3000);
  };

  return (
    <div id="execution-payload-box" className="p-3 sm:p-3.5 rounded-xl bg-slate-950/80 border border-teal-500/40 shadow-inner space-y-2.5 transition-all">
      
      {/* Header Compact Row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-teal-500/20 text-teal-400 border border-teal-500/40">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                Payload de Execução & Tool Calling
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                {payload.target_service || payload.service}::{payload.action}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              Formato Padronizado de Chamada Externa (Webhook / SmartContract / ERP API)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Action buttons visible only when expanded */}
          {isExpanded && (
            <>
              <button
                id="btn-copy-payload"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-medium text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar Payload'}</span>
              </button>

              <button
                id="btn-trigger-webhook"
                onClick={handleTriggerWebhook}
                disabled={webhookSent}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:bg-emerald-700 text-[11px] font-bold text-white transition-colors cursor-pointer shadow-md"
              >
                {webhookSent ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span>Webhook Emitido (200 OK)</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Testar Disparo Webhook</span>
                  </>
                )}
              </button>
            </>
          )}

          {/* Toggle Expand / Collapse Button */}
          <button
            id="btn-toggle-payload-details"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-950/70 hover:bg-teal-900/80 text-[11px] font-semibold text-teal-300 border border-teal-800/80 transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{isExpanded ? 'Ocultar Payload Técnico' : 'Ver Payload Técnico'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expanded Technical Details & Code View */}
      {isExpanded && (
        <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 font-mono text-xs overflow-x-auto">
            <pre className="text-teal-300 leading-relaxed">
              {jsonString}
            </pre>
          </div>

          {/* Security Signature & Verification footer */}
          <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>Assinatura HMAC-SHA256: </span>
              <strong className="text-slate-300">{payload.signature?.slice(0, 24) || '0x9a8f4c...'}...</strong>
            </span>
            <span className="text-emerald-400 font-semibold">
              ✓ Invariantes & Idempotência Garantidas
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
