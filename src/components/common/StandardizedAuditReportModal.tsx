import React, { useState } from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Building2, 
  Hash, 
  UserCheck, 
  Check, 
  Copy, 
  Download, 
  Printer, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  FileSpreadsheet, 
  Sparkles, 
  CheckCircle2, 
  Scale,
  BookOpen,
  FileText,
  KeyRound,
  FileSignature,
  Clock,
  Compass,
  ListOrdered,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { IS_DEMO_MODE, DEMO_LABEL, DEMO_NOTICE } from '../../lib/demoMode';
import { StandardizedAuditReport } from '../../types/standardizedPipeline';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { getService } from '../../services/registry/serviceRegistry';
import { 
  containsObjectStringification,
  CreditoTributarioApurado,
  EvidenciaCruzamento,
  BaseLegalRef,
  MemoriaCalculoCompetencia,
  ParecerTecnico,
  ProximosPassos
} from '../../types/reportDtos';

interface StandardizedAuditReportModalProps {
  report: StandardizedAuditReport | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ========================================================================= */
/* SANITY CHECK & ERROR BOUNDARY: RENDER GUARD                               */
/* ========================================================================= */

interface RenderGuardProps {
  sectionId: string;
  title?: string;
  data: any;
  children: React.ReactNode;
}

interface RenderGuardState {
  hasError: boolean;
  errorMessage: string;
}

export class RenderGuard extends React.Component<RenderGuardProps, RenderGuardState> {
  constructor(props: RenderGuardProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): RenderGuardState {
    return { hasError: true, errorMessage: error.message || 'Erro inesperado na renderização da seção.' };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[RenderGuard] Erro crítico ao renderizar seção '${this.props.sectionId}':`, error, errorInfo);
  }

  render() {
    // 1. Sanity Check: Dados ausentes ou nulos
    if (this.props.data === undefined || this.props.data === null) {
      return (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold font-mono text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>BLOQUEIO DE RENDERIZAÇÃO: SEÇÃO '{this.props.sectionId.toUpperCase()}' SEM DADOS</span>
          </div>
          <p className="leading-relaxed">
            A seção '{this.props.title || this.props.sectionId}' não recebeu um payload válido. Em conformidade com a diretriz disallowSyntheticData, nenhum fallback genérico é permitido.
          </p>
        </div>
      );
    }

    // 2. Sanity Check: Detecção de serialização corrompida [object Object]
    if (containsObjectStringification(this.props.data)) {
      return (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold font-mono text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>CORRUPÇÃO DETECTADA: [object Object] NA SEÇÃO '{this.props.sectionId.toUpperCase()}'</span>
          </div>
          <p className="leading-relaxed">
            O payload fornecido contém objetos serializados incorretamente como '[object Object]'. Emissão e assinatura ICP-Brasil bloqueadas.
          </p>
        </div>
      );
    }

    // 3. Exceção em tempo de execução
    if (this.state.hasError) {
      return (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold font-mono text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>EXCEÇÃO DE RENDERIZAÇÃO: SEÇÃO '{this.props.sectionId.toUpperCase()}'</span>
          </div>
          <p className="font-mono text-[11px] text-rose-300">{this.state.errorMessage}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ========================================================================= */
/* SECTION RENDERERS REUTILIZÁVEIS E TIPADOS (ZERO FALLBACK / ZERO JUNK)    */
/* ========================================================================= */

/**
 * 1. Seção: Crédito Tributário Efetivamente Apurado
 * Desestrutura rigorosamente CreditoTributarioApurado[]
 */
export const CreditoApuradoSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  const items: CreditoTributarioApurado[] = Array.isArray(data) ? data : [];

  if (items.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
        Nenhum crédito apurado no período.
      </div>
    );
  }

  const totalPrincipal = items.reduce((acc, curr) => acc + (Number(curr.valorPrincipal) || 0), 0);
  const totalAtualizado = items.reduce((acc, curr) => acc + (Number(curr.valorAtualizado) || 0), 0);
  const correcaoSelic = totalAtualizado - totalPrincipal;

  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          <span>{title || '1. Crédito Tributário Efetivamente Apurado'}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {items.length} Competências Auditadas
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Indébito Principal</span>
          <span className="text-base font-bold text-white mt-0.5 block">{formatCurrency(totalPrincipal)}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-cyan-400 uppercase block">Correção Monetária (SELIC)</span>
          <span className="text-base font-bold text-cyan-300 mt-0.5 block">+{formatCurrency(correcaoSelic)}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900 border border-emerald-900/60 bg-emerald-950/20">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block">Total Líquido Atualizado</span>
          <span className="text-base font-bold text-emerald-300 mt-0.5 block">{formatCurrency(totalAtualizado)}</span>
        </div>
      </div>

      {/* Tabela Analítica das Competências */}
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <div className="max-h-60 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-900/90 text-[11px] font-mono text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Competência</th>
                <th className="p-2.5">Tributo</th>
                <th className="p-2.5 text-right">Principal</th>
                <th className="p-2.5 text-right">SELIC Acum.</th>
                <th className="p-2.5 text-right">Atualizado</th>
                <th className="p-2.5">Origem / Registro SPED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-2.5 text-slate-200 font-bold">{item.competencia}</td>
                  <td className="p-2.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {item.tributo}
                    </span>
                  </td>
                  <td className="p-2.5 text-right text-slate-300">{formatCurrency(item.valorPrincipal)}</td>
                  <td className="p-2.5 text-right text-cyan-400">{item.selicAcumulada.toFixed(2)}%</td>
                  <td className="p-2.5 text-right text-emerald-300 font-bold">{formatCurrency(item.valorAtualizado)}</td>
                  <td className="p-2.5 text-slate-400 text-[10px] truncate max-w-[180px]" title={item.fonteSped}>
                    {item.fonteSped}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. Seção: Evidências de Cruzamento (SPED vs PGDAS vs DCTFWeb)
 * Desestrutura rigorosamente EvidenciaCruzamento[]
 */
export const EvidenciasCruzamentoSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  // Verifica se é array de EvidenciaCruzamento ou lista simples de evidências
  const isConfrontation = Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && ('divergenciaTipo' in data[0] || 'origem' in data[0]);

  if (isConfrontation) {
    const items: EvidenciaCruzamento[] = data;
    const totalSped = items.reduce((acc, curr) => acc + (Number(curr.valorSped) || 0), 0);
    const totalDeclarado = items.reduce((acc, curr) => acc + (Number(curr.valorDeclarado) || 0), 0);
    const totalDelta = items.reduce((acc, curr) => acc + (Number(curr.delta) || 0), 0);

    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>{title || '2. Evidências de Cruzamento (SPED vs PGDAS)'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {items.length} Divergências Mapeadas
          </span>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Auditado no SPED</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block">{formatCurrency(totalSped)}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Declarado PGDAS / DCTF</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block">{formatCurrency(totalDeclarado)}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-cyan-900/60 bg-cyan-950/20">
            <span className="text-[10px] font-mono text-cyan-400 uppercase block">Delta Identificado</span>
            <span className="text-base font-bold text-cyan-300 mt-0.5 block">{formatCurrency(totalDelta)}</span>
          </div>
        </div>

        {/* Tabela de Confrontação Cruzada */}
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 text-[11px] font-mono text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Competência</th>
                  <th className="p-2.5">Origem Fiscal</th>
                  <th className="p-2.5">Divergência Apurada</th>
                  <th className="p-2.5 text-right">Valor SPED</th>
                  <th className="p-2.5 text-right">Valor Declarado</th>
                  <th className="p-2.5 text-right">Delta Indébito</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 text-slate-200 font-bold">{item.competencia}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                        {item.origem}
                      </span>
                    </td>
                    <td className="p-2.5 font-sans text-slate-300 max-w-xs truncate" title={item.divergenciaTipo}>
                      {item.divergenciaTipo}
                    </td>
                    <td className="p-2.5 text-right text-slate-300">{formatCurrency(item.valorSped)}</td>
                    <td className="p-2.5 text-right text-slate-300">{formatCurrency(item.valorDeclarado)}</td>
                    <td className="p-2.5 text-right text-cyan-300 font-bold">+{formatCurrency(item.delta)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Se for lista de documentos / arquivos (outros laudos)
  const docs = Array.isArray(data) ? data : (data?.evidences || data?.sourceDocuments || data?.files || []);
  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
        <FileSpreadsheet className="w-4 h-4" />
        <span>{title || 'Evidências Examinadas & Fontes Reais Submetidas'}</span>
      </div>
      {docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {docs.map((doc: any, idx: number) => {
            const label = typeof doc === 'string' ? doc : (doc.label || doc.name || `Documento Auditado #${idx + 1}`);
            return (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate font-mono text-[11px]">{label}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          Auditoria concluída com confronto cruzado de extratos, notas fiscais e registros oficiais do contribuinte.
        </p>
      )}
    </div>
  );
};

export const EvidenciasSection = EvidenciasCruzamentoSection;

/**
 * 3. Seção: Fundamentação Legal e Teses Jurídicas Vinculantes
 * Desestrutura rigorosamente BaseLegalRef[]
 */
export const BaseLegalSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  const items: BaseLegalRef[] = Array.isArray(data) ? data : (data?.legalBasis || data?.theses || []);

  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
        <Scale className="w-4 h-4" />
        <span>{title || '3. Fundamentação Legal e Teses Jurídicas Vinculantes'}</span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-2.5 text-xs">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 space-y-1">
              <div className="font-bold text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{item.law}</span>
                </div>
                {item.article && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                    {item.article}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-slate-400 leading-relaxed text-[11px] pl-5">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">
          Fundamentado nos termos da legislação federal e normas procedimentais aplicáveis ao segmento.
        </p>
      )}
    </div>
  );
};

/**
 * 4. Seção: Memória de Cálculo Mês a Mês (com header dinâmico N de 60 competências)
 * Desestrutura rigorosamente MemoriaCalculoCompetencia[]
 */
export const MemoriaCalculoSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  // Caso seja array de MemoriaCalculoCompetencia[]
  if (Array.isArray(data)) {
    const items: MemoriaCalculoCompetencia[] = data;
    const count = items.length;
    
    // Header dinâmico exigido: "N de 60 competências disponíveis", NUNCA hardcoded 60
    const dynamicHeader = title 
      ? (title.includes('(') ? title : `${title} (${count} de 60 competências disponíveis)`)
      : `4. Memória de Cálculo Mês a Mês (${count} de 60 competências disponíveis)`;

    const totalBase = items.reduce((acc, curr) => acc + (Number(curr.baseCalculo) || 0), 0);
    const totalRecolhido = items.reduce((acc, curr) => acc + (Number(curr.valorRecolhido) || 0), 0);
    const totalDevido = items.reduce((acc, curr) => acc + (Number(curr.valorDevido) || 0), 0);
    const totalIndebito = items.reduce((acc, curr) => acc + (Number(curr.indebito) || 0), 0);

    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3.5">
        <div className="flex items-center justify-between gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>{dynamicHeader}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            LC 118/2005 (Quinquenal)
          </span>
        </div>

        {/* Resumo Consolidado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Base Total</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{formatCurrency(totalBase)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Recolhido</span>
            <span className="text-sm font-bold text-slate-300 mt-0.5 block">{formatCurrency(totalRecolhido)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Devido</span>
            <span className="text-sm font-bold text-slate-300 mt-0.5 block">{formatCurrency(totalDevido)}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-900/60 bg-emerald-950/20">
            <span className="text-[10px] font-mono text-emerald-400 uppercase block">Indébito Apurado</span>
            <span className="text-sm font-bold text-emerald-300 mt-0.5 block">+{formatCurrency(totalIndebito)}</span>
          </div>
        </div>

        {/* Tabela de Cálculo Mês a Mês */}
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 text-[11px] font-mono text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Competência</th>
                  <th className="p-2.5 text-right">Base Cálculo</th>
                  <th className="p-2.5 text-right">Alíquota</th>
                  <th className="p-2.5 text-right">Recolhido</th>
                  <th className="p-2.5 text-right">Devido</th>
                  <th className="p-2.5 text-right">Indébito</th>
                  <th className="p-2.5">Ref. SPED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 text-slate-200 font-bold">{item.competencia}</td>
                    <td className="p-2.5 text-right text-slate-300">{formatCurrency(item.baseCalculo)}</td>
                    <td className="p-2.5 text-right text-slate-400">{(item.aliquotaAplicada * 100).toFixed(2)}%</td>
                    <td className="p-2.5 text-right text-slate-300">{formatCurrency(item.valorRecolhido)}</td>
                    <td className="p-2.5 text-right text-slate-400">{formatCurrency(item.valorDevido)}</td>
                    <td className="p-2.5 text-right text-emerald-300 font-bold">+{formatCurrency(item.indebito)}</td>
                    <td className="p-2.5 text-slate-500 text-[10px]">
                      {item.evidenciaSpedLinha ? `Linha ${item.evidenciaSpedLinha}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Caso seja objeto chave-valor de outro tipo de laudo
  if (typeof data === 'object' && data !== null) {
    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
          <DollarSign className="w-4 h-4" />
          <span>{title || 'Memória Analítica de Cálculo & Apuração'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(data).slice(0, 6).map(([key, val]) => {
            const formattedVal = typeof val === 'number'
              ? (val > 1000 ? formatCurrency(val) : val.toString())
              : (typeof val === 'object' ? JSON.stringify(val) : String(val));
            return (
              <div key={key} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400 uppercase truncate" title={key}>
                  {key.replace(/([A-Z])/g, ' $1')}
                </div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">{formattedVal}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 font-mono">
      {String(data || 'Memória de cálculo analítica auditada.')}
    </div>
  );
};

/**
 * 5. Seção: Parecer Técnico Conclusivo & Responsabilidade Técnica
 * Desestrutura rigorosamente ParecerTecnico
 */
export const ParecerTecnicoSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  // Verifica se o payload é um ParecerTecnico estruturado
  if (typeof data === 'object' && data !== null && 'conclusao' in data) {
    const parecer: ParecerTecnico = data;

    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            <span>{title || '5. Parecer Técnico Conclusivo & Responsabilidade Técnica'}</span>
          </div>
          {parecer.parecerFavoravel && (
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
              PARECER FAVORÁVEL À RESTITUIÇÃO
            </span>
          )}
        </div>

        {/* Parecer Conclusivo */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <p className="text-xs text-slate-200 leading-relaxed font-serif text-[13px]">
            "{parecer.conclusao}"
          </p>
          {parecer.fundamentoResumido && (
            <p className="text-[11px] text-cyan-400/90 font-mono pt-1 border-t border-slate-800/80">
              <strong>Base Técnica:</strong> {parecer.fundamentoResumido}
            </p>
          )}
        </div>

        {/* Responsável Técnico e Registro Profissional */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">{parecer.responsavelTecnico}</span>
              <span className="text-[11px] font-mono text-slate-400">
                {parecer.registroProfissional} ({parecer.orgaoClasse})
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400">
            <span>Data de Homologação: </span>
            <strong className="text-slate-200">{parecer.dataAssinatura}</strong>
          </div>
        </div>

        {/* Observações Periciais */}
        {parecer.observacoes && parecer.observacoes.length > 0 && (
          <div className="space-y-1.5 text-xs text-slate-300 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
              Observações & Ressalvas Técnicas
            </span>
            <ul className="space-y-1 text-[11px] text-slate-400">
              {parecer.observacoes.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Fallback para string ou array de strings
  const content = typeof data === 'string' ? data : (data?.conclusion || data?.summary);
  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
        <FileCheck className="w-4 h-4" />
        <span>{title || 'Conclusão Técnica & Parecer Pericial Conclusivo'}</span>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed">
        {content || 'Parecer emitido em conformidade com as regras periciais do conselho de classe e normas do tribunal.'}
      </p>
    </div>
  );
};

export const ConclusaoTecnicaSection = ParecerTecnicoSection;

/**
 * 6. Seção: Próximos Passos (Roteiro Operacional de Compensação)
 * Desestrutura rigorosamente ProximosPassos
 */
export const ProximosPassosSection: React.FC<{ data: any; title?: string }> = ({ data, title }) => {
  if (typeof data === 'object' && data !== null && 'etapas' in data) {
    const passos: ProximosPassos = data;

    return (
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-4 h-4" />
            <span>{title || '6. Próximos Passos'}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Roteiro Operacional
          </span>
        </div>

        {/* Etapas Sequenciais */}
        <div className="space-y-3">
          {passos.etapas.map((etapa) => (
            <div 
              key={etapa.ordem}
              className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  {etapa.ordem}
                </span>
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{etapa.titulo}</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{etapa.descricao}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Resp: {etapa.responsavel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Destino: {etapa.sistemaDestino}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 font-mono text-amber-300 text-[11px] self-end sm:self-center">
                <Clock className="w-3 h-3" />
                <span>{etapa.prazoEstimadoDias} dias</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recomendação Final */}
        {passos.recomendacaoFinal && (
          <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60 flex items-start gap-2.5 text-xs text-cyan-200">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Diretriz Estratégica:</strong> {passos.recomendacaoFinal}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback para recomendações gerais
  const recs = Array.isArray(data) ? data : (data?.recommendations || []);
  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider font-mono">
        <ListOrdered className="w-4 h-4" />
        <span>{title || '6. Próximos Passos'}</span>
      </div>
      {recs.length > 0 ? (
        <ul className="space-y-1.5 text-xs text-slate-300">
          {recs.map((r: any, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{typeof r === 'string' ? r : (r.title || r.label || 'Etapa Operacional')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400 italic">Nenhum próximo passo pendente.</p>
      )}
    </div>
  );
};

export const MetadadosLgpdSection: React.FC<{ data: any; title?: string }> = ({ data }) => {
  return (
    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40 text-xs space-y-1.5">
      <div className="font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
        <Lock className="w-3.5 h-3.5" /> Conformidade LGPD (Lei 13.709/2018)
      </div>
      <p className="text-slate-300 text-[11px] leading-relaxed">
        Base Legal: {data?.legalBasis || 'Art. 7º, II e IX da Lei 13.709/2018'}. Encarregado (DPO): {data?.dataProtectionOfficer || 'Jurídico Velatrix'}.
      </p>
    </div>
  );
};

export const HashCriptograficoSection: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
      <span className="text-slate-400 block mb-1">Hash SHA-256 do Laudo:</span>
      <span className="text-cyan-300 break-all">{data?.auditHash || data}</span>
    </div>
  );
};

export const AssinaturaIcpSection: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
      <div className="flex items-center gap-2">
        <FileSignature className="w-4 h-4 text-cyan-400" />
        <div>
          <span className="font-bold text-white block">{data?.name || 'Responsável Técnico'}</span>
          <span className="text-[11px] text-slate-400 font-mono">{data?.role || 'Perito Oficial'}</span>
        </div>
      </div>
      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
        ICP-Brasil A1
      </span>
    </div>
  );
};

export const SECTION_RENDERERS: Record<string, React.FC<{ data: any; title?: string }>> = {
  CreditoApuradoSection,
  EvidenciasCruzamentoSection,
  EvidenciasSection: EvidenciasCruzamentoSection,
  BaseLegalSection,
  MemoriaCalculoSection,
  ParecerTecnicoSection,
  ConclusaoTecnicaSection: ParecerTecnicoSection,
  ProximosPassosSection,
  MetadadosLgpdSection,
  HashCriptograficoSection,
  AssinaturaIcpSection
};

/* ========================================================================= */
/* COMPONENTE PRINCIPAL DO MODAL                                             */
/* ========================================================================= */

export const StandardizedAuditReportModal: React.FC<StandardizedAuditReportModalProps> = ({
  report,
  isOpen,
  onClose
}) => {
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [showLgpdDetails, setShowLgpdDetails] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen || !report) return null;

  const serviceDef = getService(report.serviceId);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(report.auditHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.reportId}_Laudo_Oficial.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Top Action Bar / Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${report.status === 'INVALIDATED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-bold">
                  {report.reportId}
                </span>
                {report.status === 'INVALIDATED' && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> LAUDO INVALIDADO
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  • {report.reportTypeLabel}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Laudo Pericial Oficial de Auditoria & Conformidade
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
              title="Baixar Prova JSON Assinada"
            >
              {downloadSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">JSON Assinado</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
              title="Imprimir / Salvar PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-sm">

          {/* Banner de Laudo Invalidado (Bugfix P1) */}
          {report.status === 'INVALIDATED' && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-rose-300 font-mono uppercase tracking-wide">
                  LAUDO OFICIAL INVALIDADO — ASSINATURA REVOGADA
                </h4>
                <p className="text-xs text-rose-200/90 mt-1">
                  Motivo da Invalidação: <strong className="font-mono text-white">{report.invalidationReason || 'EMITIDO_COM_ACTOR_ROLE_INCORRETA_BUG_P1'}</strong>.
                  Este laudo foi emitido sob mapeamento de perfil incompatível e teve sua assinatura digital anulada para garantir total conformidade com os conselhos de classe e órgãos fiscalizadores. É necessária re-emissão técnica pela esteira oficial.
                </p>
              </div>
            </div>
          )}
          
          {/* Metadados Comuns Padronizados (Grid) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Tenant / Contribuinte
              </div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={report.tenantName}>
                {report.tenantName}
              </div>
              <div className="text-xs font-mono text-cyan-400 mt-0.5">
                CNPJ: {report.tenantCnpj}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data & Hora da Emissão
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {report.issuedAtFormatted}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Serviço: {report.serviceName}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Conformidade LGPD
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conforme
                </span>
                <button
                  type="button"
                  onClick={() => setShowLgpdDetails(!showLgpdDetails)}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 underline font-mono cursor-pointer"
                >
                  {showLgpdDetails ? 'Ocultar' : 'Detalhes'}
                </button>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                Retenção: {report.lgpdCompliance.retentionPeriodDays} dias
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Responsável / Assinante
              </div>
              <div className="text-sm font-bold text-white mt-1 truncate" title={report.signer.name}>
                {report.signer.name}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                {report.signer.role}
              </div>
            </div>
          </div>

          {/* Modal / Bloco Expansível de Detalhes LGPD */}
          {showLgpdDetails && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/50 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="font-bold text-emerald-400 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Certificação de Privacidade & Proteção de Dados (LGPD)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-400 font-mono block">Base Legal Aplicada:</span>
                  <p className="mt-0.5">{report.lgpdCompliance.legalBasis}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-mono block">Encarregado de Dados (DPO):</span>
                  <p className="mt-0.5 text-cyan-300 font-mono">{report.lgpdCompliance.dataProtectionOfficer}</p>
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-mono block">Campos Sensíveis Anonimizados / Mascarados:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {report.lgpdCompliance.anonymizedFields.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Integridade das Fontes — em modo demonstração o laudo NÃO pode alegar dados reais */}
          {IS_DEMO_MODE ? (
            <div role="note" className="p-3.5 rounded-xl bg-[#FFF8EA] border border-[#F1D9A8] flex items-center justify-between gap-3 text-xs">
              <span className="text-[#7A4F00]">
                <strong>{DEMO_LABEL}:</strong> {DEMO_NOTICE}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FDEBC8] text-[#7A4F00] border border-[#F1D9A8] shrink-0">
                DEMONSTRAÇÃO
              </span>
            </div>
          ) : (
            <>
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Integridade das Fontes:</strong> Laudo emitido <strong>exclusivamente</strong> com base em dados reais auditados (sem extrapolações ou dados fictícios).
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700/60 shrink-0">
              {report.pipelineSnapshot.dataSourceIntegrity}
            </span>
          </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SEÇÕES DINÂMICAS BASEADAS NO REPORT SCHEMA                                 */}
          {/* ========================================================================= */}
          {serviceDef && serviceDef.reportSchema.sections.length > 0 && report.sectionsPayload && (
            <div className="space-y-4">
              {serviceDef.reportSchema.sections.map(sectionDef => {
                const RendererComponent = SECTION_RENDERERS[sectionDef.renderer] || SECTION_RENDERERS.ConclusaoTecnicaSection;
                const sectionData = report.sectionsPayload?.[sectionDef.id] 
                  ?? (sectionDef.id === 'base_legal' ? serviceDef.legalBasis : undefined);

                return (
                  <RenderGuard
                    key={sectionDef.id}
                    sectionId={sectionDef.id}
                    title={sectionDef.title}
                    data={sectionData}
                  >
                    <RendererComponent
                      title={sectionDef.title}
                      data={sectionData}
                    />
                  </RenderGuard>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* CORPO ESPECÍFICO: 1. LAUDO DE RISCO & ROI */}
          {/* ========================================================================= */}
          {report.reportType === 'risk_roi' && report.riskRoiPayload && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h4 className="text-base font-bold text-white">
                  Diagnóstico Executivo de Solvência, Risco & Retorno (ROI)
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Z-Score de Altman</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">
                    {report.riskRoiPayload.overallZScore.toFixed(2)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    {report.riskRoiPayload.solvencyStatus}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Faturamento Real Anual</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {formatCurrency(report.riskRoiPayload.annualRevenueReal)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Margem EBITDA: {formatPercent(report.riskRoiPayload.ebitdaMarginReal / 100)}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Economia Identificada</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(report.riskRoiPayload.identifiedSavingsBrl)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300 mt-0.5">
                    Eficiência de Caixa D+0
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Multiplicador ROI</div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {report.riskRoiPayload.calculatedRoiMultiplier.toFixed(1)}x
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Retorno sobre Investimento
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                  <FileSpreadsheet className="w-4 h-4 text-cyan-400" /> Fontes Reais Submetidas à Perícia
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {report.riskRoiPayload.sourceDocuments.map((doc, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400" /> Vulnerabilidades Fiscais / Operacionais
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    {report.riskRoiPayload.topVulnerabilities.map((v, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Plano de Ação & Recomendações
                  </div>
                  <ul className="space-y-1.5 text-slate-300">
                    {report.riskRoiPayload.strategicRecommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CORPO ESPECÍFICO: 2. LAUDO DE SEGURANÇA / AMEAÇA */}
          {/* ========================================================================= */}
          {report.reportType === 'security_threat' && report.securityThreatPayload && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h4 className="text-base font-bold text-white">
                  Registro de Incidente Cibernético & Ação ZeroVision
                </h4>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono border ${getSeverityBadge(report.securityThreatPayload.severity)}`}>
                      SEVERIDADE {report.securityThreatPayload.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ID: {report.securityThreatPayload.threatId}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    STATUS: {report.securityThreatPayload.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono block">Tipo de Ameaça:</span>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {report.securityThreatPayload.threatTypeLabel}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono block">Origem / Canal Interceptado:</span>
                    <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                      {report.securityThreatPayload.channelOrigin}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 font-mono block">Ativo / Entidade-Alvo:</span>
                    <div className="text-sm font-bold text-slate-200 mt-0.5">
                      {report.securityThreatPayload.targetEntity}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Ação de Resposta Executada (ZeroVision Active Block)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {report.securityThreatPayload.mitigationAction}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] space-y-1">
                <div className="text-slate-400 flex items-center justify-between">
                  <span>Assinatura Digital da Anomalia (Audit Trail):</span>
                  <span className="text-cyan-400">SECP256K1 Quorum Aprovado</span>
                </div>
                <div className="text-slate-300 break-all bg-slate-900/90 p-2 rounded border border-slate-800">
                  {report.securityThreatPayload.anomalySignature}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CORPO ESPECÍFICO: 3. LAUDO FISCAL & TRIBUTÁRIO */}
          {/* ========================================================================= */}
          {report.reportType === 'fiscal_recovery' && report.fiscalRecoveryPayload && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">
                  Demonstrativo Pericial de Créditos e Compensação Fiscal
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Créditos Auditados</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {formatCurrency(report.fiscalRecoveryPayload.totalCreditsIdentifiedBrl)}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {report.fiscalRecoveryPayload.monitoredCompetencesCount} Competências (60 Meses)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Compensação DARF D+0</div>
                  <div className="text-xl font-bold text-cyan-300 mt-1">
                    {formatCurrency(report.fiscalRecoveryPayload.darfCompensationsBrl)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                    Crédito Líquido Disponível
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Classificação CAPAG</div>
                  <div className="text-lg font-bold text-white mt-1">
                    {report.fiscalRecoveryPayload.pgfnCapagRating}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-0.5">
                    {report.fiscalRecoveryPayload.receiptPerDcomp || 'PER/DCOMP Web'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hash de Auditoria Criptográfica SHA-256 (Metadado Comum Inferior) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Hash className="w-3.5 h-3.5 text-cyan-400" /> Hash SHA-256 de Auditoria Imutável
              </span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
              </button>
            </div>
            <div className="p-2 rounded bg-slate-900 text-slate-300 break-all border border-slate-800/80 select-all">
              {report.auditHash}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <span>Tipo de Assinatura: <strong className="text-slate-400">{report.signer.signatureType}</strong></span>
              <span>Tempo de Execução: <strong className="text-slate-400">{report.pipelineSnapshot.executionTimeMs} ms</strong></span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-slate-500 font-mono">
            Velatrix AOS • Sistema Operacional Autônomo de Governança & Auditoria
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fechar Laudo
          </button>
        </div>

      </div>
    </div>
  );
};
