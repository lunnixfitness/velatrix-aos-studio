import React, { useState } from 'react';
import { FileCheck, Sparkles, Copy, Check, DollarSign, Calendar, TrendingDown } from 'lucide-react';
import { PropostaCessaoTerm } from '../../types/precatorios';
import { formatShortSha256 } from '../../shared/upload/sha256Store';

interface PropostaCessaoCardProps {
  proposta: PropostaCessaoTerm;
  onAceitarProposta?: (propostaId: string) => void;
  readOnly?: boolean;
}

export const PropostaCessaoCard: React.FC<PropostaCessaoCardProps> = ({
  proposta,
  onAceitarProposta,
  readOnly = false
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyHash = () => {
    navigator.clipboard.writeText(proposta.hashSha256Termo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Termo de Proposta de Cessão Vinculante
          </div>
          <h4 className="text-base font-bold text-white mt-0.5">
            {proposta.numeroOficio}
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
          ID: {proposta.propostaId}
        </span>
      </div>

      {/* Grid de Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Valor de Face (SELIC EC 113)</span>
          <span className="text-base font-bold text-slate-100 font-mono mt-1 block">
            R$ {proposta.valorFaceAtualizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[10px] font-mono text-amber-400 uppercase block flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Deságio Comercial
          </span>
          <span className="text-base font-bold text-amber-300 font-mono mt-1 block">
            {proposta.desagioPercentual.toFixed(2)}%
          </span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Líquido ao Credor
          </span>
          <span className="text-base font-bold text-emerald-300 font-mono mt-1 block">
            R$ {proposta.valorLiquidoCredor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Métricas Financeiras e VPL */}
      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>VPL Projetado da Operação:</span>
          <span className="text-slate-200 font-bold">R$ {proposta.vplCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Taxa Desconto Anual:</span>
          <span className="text-slate-200 font-bold">{proposta.taxaDescontoAplicadaAa}% a.a.</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-cyan-400" /> Expectativa de Liquidação:</span>
          <span className="text-cyan-300 font-bold">{proposta.expectativaMeses} meses</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Validade da Proposta:</span>
          <span className="text-amber-300 font-bold">{proposta.validadeData}</span>
        </div>
      </div>

      {/* Hash SHA-256 e Assinatura */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[9px] font-bold">
            SHA-256
          </span>
          <span className="truncate max-w-[200px]" title={proposta.hashSha256Termo}>
            {formatShortSha256(proposta.hashSha256Termo)}
          </span>
          <button
            type="button"
            onClick={copyHash}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {!readOnly && onAceitarProposta && (
          <button
            type="button"
            onClick={() => onAceitarProposta(proposta.propostaId)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Formalizar Aceite & Escritura</span>
          </button>
        )}
      </div>
    </div>
  );
};
