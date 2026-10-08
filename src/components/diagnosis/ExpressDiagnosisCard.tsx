import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  UploadCloud, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Activity,
  FileCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';

interface ExpressDiagnosisCardProps {
  onOpenFullExpressDiagnosis: () => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
}

export const ExpressDiagnosisCard: React.FC<ExpressDiagnosisCardProps> = ({
  onOpenFullExpressDiagnosis,
  language = 'pt',
  currency = 'BRL'
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [quickCnpj, setQuickCnpj] = useState<string>('33.041.260/0001-88');
  const [quickRevenue, setQuickRevenue] = useState<number>(4500000);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl transition-all relative overflow-hidden">
      
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-sm">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Diagnóstico Integral &amp; Proposta Executiva AOS
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                Raio-X D+0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              CNPJ + Faturamento Bruto + Extrato Bancário 90d + DRE/Balancete ➔ Raio-X &amp; Proposta AOS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isExpanded ? 'Visualização Compacta' : 'Prévia Rápida'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            id="btn-open-full-express-diagnosis"
            onClick={onOpenFullExpressDiagnosis}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/10 cursor-pointer"
          >
            <span>Abrir Diagnóstico Express</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido sob Demanda */}
      {isExpanded && (
        <div className="pt-4 mt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-200">
          
          {/* Card 1: 4 Campos Mínimos */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Camada Obrigatória</span>
            </div>
            <ul className="text-[11px] font-mono text-slate-400 space-y-1">
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> CNPJ Formatado
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Faturamento Bruto (Mês/Ano)
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Extrato 90d (.OFX / .PDF)
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> DRE / Balancete Sintético
              </li>
            </ul>
          </div>

          {/* Card 2: Diagnóstico Gerado em Segundos */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Resultados Calculados</span>
            </div>
            <ul className="text-[11px] font-mono text-slate-400 space-y-1">
              <li className="flex items-center justify-between">
                <span>Score de Risco Global:</span>
                <strong className="text-amber-400 font-bold">58 / 100</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Altman Z-Score:</span>
                <strong className="text-emerald-400 font-bold">1.84 (Zona de Alerta)</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Alertas de Liquidez:</span>
                <strong className="text-rose-400 font-bold">Déficit NCG D+30</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Sangria Estimada:</span>
                <strong className="text-slate-200 font-bold">R$ 2.26M/ano</strong>
              </li>
            </ul>
          </div>

          {/* Card 3: Expansão Opcional de ERP */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Diagnóstico Completo (Opcional)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Conecte ERP via API Token (TOTVS, SAP, Bling, Mercado Livre) e envie lotes de SPED Fiscal / XMLs de NF-e.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenFullExpressDiagnosis}
              className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-400 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Configurar no Diagnóstico Express</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
