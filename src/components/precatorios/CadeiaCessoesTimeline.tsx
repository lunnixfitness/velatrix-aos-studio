import React from 'react';
import { GitCommit, ShieldCheck, ArrowDown, Copy, Check } from 'lucide-react';
import { CessaoLedgerNode } from '../../types/precatorios';
import { formatShortSha256 } from '../../shared/upload/sha256Store';

interface CadeiaCessoesTimelineProps {
  hashesEncadeados: CessaoLedgerNode[];
}

export const CadeiaCessoesTimeline: React.FC<CadeiaCessoesTimelineProps> = ({
  hashesEncadeados
}) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const copyHash = (hash: string, idx: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!hashesEncadeados || hashesEncadeados.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 font-mono text-xs text-center">
        — nenhuma cessão registrada nesta cadeia —
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
        <GitCommit className="w-4 h-4 text-cyan-400" />
        Cadeia Imutável de Custódia Notarial (Merkle-like Ledger)
      </div>

      <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:to-emerald-500">
        {hashesEncadeados.map((node, idx) => (
          <div key={node.sequencia} className="relative group">
            {/* Dot indicador */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-950 border-2 border-cyan-400 flex items-center justify-center">
              <span className="text-[9px] font-mono text-cyan-300 font-bold">{node.sequencia}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 transition-colors space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">
                    Elo #{node.sequencia} — {node.documentoPayload?.tipo || 'Cessão Notarial Registrada'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-mono font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> ÍNTEGRO
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(node.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Signatário / Autoridade: <span className="text-cyan-300 font-semibold">{node.assinadoPor}</span>
              </div>

              {/* Hashes encadeados */}
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-[10px] font-mono">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Previous Hash (n-1):</span>
                  <span className="truncate max-w-[200px]" title={node.previousHash}>
                    {node.previousHash === 'GENESIS_PRECAT_001_ROOT' || node.previousHash === 'GENESIS_CESSAO_ROOT'
                      ? node.previousHash
                      : formatShortSha256(node.previousHash)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-emerald-400">
                  <span className="font-bold">Current Hash (n):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold truncate max-w-[200px]" title={node.currentHash}>
                      {formatShortSha256(node.currentHash)}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyHash(node.currentHash, idx)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                      title="Copiar Hash Completo"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
