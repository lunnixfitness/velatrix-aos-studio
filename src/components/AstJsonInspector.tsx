import React, { useState } from 'react';
import { FileCode2, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { CriticalDecisionCardAST } from '../types/aos';

interface AstJsonInspectorProps {
  ast: CriticalDecisionCardAST;
  onClose: () => void;
}

export const AstJsonInspector: React.FC<AstJsonInspectorProps> = ({
  ast,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(ast, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Zero-GUI Abstract Syntax Tree (AST JSON Puro)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Schema Validado
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-ast-json"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
            <button
              id="btn-close-ast-modal"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-4 overflow-auto flex-1 bg-slate-950 text-xs font-mono">
          <pre className="text-teal-300 leading-relaxed">
            {jsonString}
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Estrutura AST gerada dinamicamente pelo núcleo AOS</span>
          <span className="font-mono text-slate-500">ui_type: {ast.ui_type}</span>
        </div>

      </div>
    </div>
  );
};
