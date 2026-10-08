import React, { useState } from 'react';
import { Calculator, Scale, ArrowRight, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { compensacaoTributariaEngine } from '../../services/precatorios/compensacaoTributariaEngine';
import { CompensacaoSimulacaoResult } from '../../types/precatorios';

interface CompensacaoSimulatorFormProps {
  valorPrecatorioPadrao?: number;
  precatorioId?: string;
}

export const CompensacaoSimulatorForm: React.FC<CompensacaoSimulatorFormProps> = ({
  valorPrecatorioPadrao = 428750.00,
  precatorioId = 'PREC-001'
}) => {
  const [valorPrecatorio, setValorPrecatorio] = useState<number>(valorPrecatorioPadrao);
  const [cnpj, setCnpj] = useState<string>('12.345.678/0001-90');
  const [razaoSocial, setRazaoSocial] = useState<string>('EMPRESA INDUSTRIAL CESSIONÁRIA S/A');
  const [debitoMensal, setDebitoMensal] = useState<number>(65000.00);
  const [resultado, setResultado] = useState<CompensacaoSimulacaoResult | null>(() => {
    return compensacaoTributariaEngine.simularCompensacao({
      precatorioId,
      valorAtualizadoPrecatorio: valorPrecatorioPadrao,
      cessionarioCnpj: '12.345.678/0001-90',
      cessionarioRazaoSocial: 'EMPRESA INDUSTRIAL CESSIONÁRIA S/A',
      debitoTributarioProjetadoMensal: 65000.00,
      debitoConsolidadoTotal: 1850000.00
    });
  });

  const handleSimular = (e: React.FormEvent) => {
    e.preventDefault();
    const res = compensacaoTributariaEngine.simularCompensacao({
      precatorioId,
      valorAtualizadoPrecatorio: valorPrecatorio,
      cessionarioCnpj: cnpj,
      cessionarioRazaoSocial: razaoSocial,
      debitoTributarioProjetadoMensal: debitoMensal,
      debitoConsolidadoTotal: debitoMensal * 24
    });
    setResultado(res);
  };

  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
          <Scale className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
            Simulador de Compensação Tributária Federal
          </div>
          <h4 className="text-sm font-bold text-white">
            Lei nº 14.973/2024 • Limite Legal de 75% por Competência Mensal
          </h4>
        </div>
      </div>

      {/* Formulário de Parâmetros */}
      <form onSubmit={handleSimular} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
            Valor de Face do Precatório (R$)
          </label>
          <input
            type="number"
            step="1000"
            value={valorPrecatorio}
            onChange={e => setValorPrecatorio(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
            CNPJ do Cessionário
          </label>
          <input
            type="text"
            value={cnpj}
            onChange={e => setCnpj(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
            Débito Mensal Projetado PGFN (R$)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="1000"
              value={debitoMensal}
              onChange={e => setDebitoMensal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Simular</span>
            </button>
          </div>
        </div>
      </form>

      {/* Resultados da Simulação */}
      {resultado && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block uppercase">Crédito Disponível</span>
              <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                R$ {resultado.creditoTributarioDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold block uppercase">Teto 75% / Mês</span>
              <span className="text-sm font-bold text-emerald-300 mt-0.5 block">
                R$ {resultado.limite75PorCentoCompetencia.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-semibold block uppercase">Amortização</span>
              <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                {resultado.tempoEsgotamentoMeses} meses
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-amber-400 font-semibold block uppercase">Economia Efetiva</span>
              <span className="text-sm font-bold text-amber-300 mt-0.5 block">
                R$ {resultado.economiaTributariaEfetiva.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs font-mono text-emerald-200/90 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Viabilidade Tributária Atestada (Lei 14.973/2024):</span>
            </div>
            <p className="text-[11px]">{resultado.parecerLegal}</p>
          </div>
        </div>
      )}
    </div>
  );
};
