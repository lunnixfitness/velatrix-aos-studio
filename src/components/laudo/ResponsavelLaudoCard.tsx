/**
 * P28 — bloco único de "quem assina e o que conclui" para as esteiras.
 * Nada aqui é pré-preenchido: o laudo só sai com o conteúdo do responsável técnico.
 */
import React from 'react';
import { UserCheck, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';
import type { Conselho, ResponsavelTecnico } from '../../documents/laudo/comum';

export interface CampoTextoLaudo {
  key: string;
  label: string;
  placeholder: string;
  min: number;
  value: string;
}

interface ResponsavelLaudoCardProps {
  conselhosAceitos: readonly Conselho[];
  responsavel: ResponsavelTecnico;
  onResponsavelChange: (r: ResponsavelTecnico) => void;
  campos: CampoTextoLaudo[];
  onCampoChange: (key: string, value: string) => void;
  pendencias: string[];
  /** Números vêm do gerador sintético (só DEMO_MODE): o laudo sai DEMONSTRACAO_SEM_VALIDADE. */
  avisoDemonstracao?: boolean;
  children?: React.ReactNode;
}

const input =
  'w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-cyan-500';

export const ResponsavelLaudoCard: React.FC<ResponsavelLaudoCardProps> = ({
  conselhosAceitos,
  responsavel,
  onResponsavelChange,
  campos,
  onCampoChange,
  pendencias,
  avisoDemonstracao,
  children,
}) => (
  <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-5">
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          Responsável técnico e conteúdo do laudo
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          O sistema não redige conclusão nem presume signatário. Assinatura ICP-Brasil ocorre após a emissão.
        </p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border whitespace-nowrap ${
          pendencias.length
            ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
            : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
        }`}
      >
        {pendencias.length ? `${pendencias.length} pendência(s)` : 'Pronto para emitir'}
      </span>
    </div>

    {avisoDemonstracao && (
      <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-700/50 text-[11px] text-violet-200 flex gap-2">
        <FlaskConical className="w-4 h-4 shrink-0 text-violet-300" />
        <span>
          Modo demonstração: os números vêm do gerador sintético. O laudo sai marcado{' '}
          <span className="font-mono">DEMONSTRACAO_SEM_VALIDADE</span> e não serve como prova.
        </span>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <label className="space-y-1 md:col-span-1">
        <span className="text-[11px] font-bold text-slate-300">Nome completo</span>
        <input
          className={input}
          value={responsavel.nome}
          placeholder="Como consta no conselho"
          onChange={(e) => onResponsavelChange({ ...responsavel, nome: e.target.value })}
        />
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold text-slate-300">Conselho</span>
        <select
          className={input}
          value={responsavel.conselho}
          onChange={(e) => onResponsavelChange({ ...responsavel, conselho: e.target.value as Conselho | '' })}
        >
          <option value="">Selecione…</option>
          {conselhosAceitos.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="text-[11px] font-bold text-slate-300">Registro</span>
        <input
          className={`${input} font-mono`}
          value={responsavel.registro}
          placeholder="ex.: CRC-SP 123456/O-7"
          onChange={(e) => onResponsavelChange({ ...responsavel, registro: e.target.value })}
        />
      </label>
    </div>

    {children}

    {campos.map((c) => (
      <label key={c.key} className="block space-y-1">
        <span className="text-[11px] font-bold text-slate-300 flex justify-between">
          <span>{c.label}</span>
          {/* Verde quando atinge o mínimo; vermelho enquanto há texto abaixo do mínimo (diz quanto falta). */}
          <span className={`font-mono ${c.value.trim().length >= c.min ? 'text-emerald-400' : c.value.trim().length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
            {c.value.trim().length}/{c.min}
            {c.value.trim().length > 0 && c.value.trim().length < c.min && ` · faltam ${c.min - c.value.trim().length}`}
          </span>
        </span>
        <textarea
          className={`${input} min-h-[88px] leading-relaxed ${c.value.trim().length > 0 && c.value.trim().length < c.min ? '!border-rose-600' : ''}`}
          value={c.value}
          placeholder={c.placeholder}
          onChange={(e) => onCampoChange(c.key, e.target.value)}
        />
      </label>
    ))}

    {pendencias.length > 0 ? (
      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-700/40">
        <div className="text-xs font-bold text-amber-300 mb-1 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" /> Antes de emitir o laudo:
        </div>
        <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-100/90">
          {pendencias.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    ) : (
      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5" /> Todas as condições de emissão atendidas.
      </div>
    )}
  </div>
);
