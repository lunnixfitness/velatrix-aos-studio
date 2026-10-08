import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Upload, 
  ArrowUpDown, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Cpu, 
  Sparkles, 
  FileCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Info, 
  FolderArchive,
  ArrowRight,
  Database,
  BarChart3,
  SlidersHorizontal,
  X
} from 'lucide-react';

export interface TimelineXmlInvoice {
  id: string;
  nfeNumber: string;
  series: string;
  accessKey: string;
  issueDateTime: string; // ISO format e.g. 2021-01-14T09:24:12-03:00
  issuerCnpj: string;
  recipientCnpj: string;
  recipientName: string;
  totalAmount: number;
  recoverableAmount: number;
  status: 'AUDIT_OK_RECUPERAVEL' | 'MONOPHASIC_OVERTAXED' | 'BIPHASIC_OVERTAXED' | 'PLURIPHASIC_OVERTAXED' | 'CONFORME_100' | 'DIVERGENCIA_ALIQUOTA';
  incidenceRegime: 'MONOFASICO' | 'BIFASICO' | 'PLURIFASICO';
  ncm: string;
  cfop: string;
  cstPisCofins: string;
  taxTese: string;
  legalBasis: string;
  divergenceReason?: string;
}

export interface MonthlyFiscalCompetence {
  id: string;
  year: number;
  month: number; // 1 to 12
  competenceLabel: string; // e.g. "01/2021"
  xmlCount: number;
  totalTransactedBrl: number;
  recoverableAmountBrl: number;
  statusType: 'AUDITORIA_OK_RECUPERAVEL' | 'BITRIBUTACAO_MONOFASICA' | 'INCIDENCIA_BIFASICA' | 'INCIDENCIA_PLURIFASICA' | 'CONFORME_100' | 'DIVERGENCIA_ALIQUOTA';
  statusText: string;
  badgeTone: 'emerald' | 'amber' | 'purple' | 'blue' | 'cyan' | 'rose';
  teseSummary: string;
  chainIncidence: 'MONOFASICO' | 'BIFASICO' | 'PLURIFASICO';
  divergenceReason?: string;
  sampleInvoices: TimelineXmlInvoice[];
  isPrescribed?: boolean;
}

// Generate the 60 continuous months from 01/2021 to 12/2025
function generateInitial60Months(): MonthlyFiscalCompetence[] {
  const result: MonthlyFiscalCompetence[] = [];
  const years = [2021, 2022, 2023, 2024, 2025];

  years.forEach((year) => {
    for (let m = 1; m <= 12; m++) {
      const monthStr = String(m).padStart(2, '0');
      const compLabel = `${monthStr}/${year}`;
      const compId = `comp-${year}-${monthStr}`;

      // Deterministic patterns following the user's prompt:
      // 01/2021: [ 1.450 XMLs ] ──► Auditoria OK | R$ 12.400,00 recuperáveis
      // 02/2021: [ 1.320 XMLs ] ──► Bitributação Monofásica Detectada (R$ 8.100)
      // 12/2025: [ 2.100 XMLs ] ──► Auditoria OK | 100% em conformidade
      let xmlCount = 1200 + ((year * 17 + m * 31) % 950);
      let totalTransactedBrl = xmlCount * (1200 + ((m * 137) % 800));
      let recoverableAmountBrl = 0;
      let statusType: MonthlyFiscalCompetence['statusType'] = 'CONFORME_100';
      let statusText = 'Auditoria OK | 100% em conformidade';
      let badgeTone: MonthlyFiscalCompetence['badgeTone'] = 'cyan';
      let teseSummary = 'Tributação regular apurada sem divergências tributárias.';
      let chainIncidence: MonthlyFiscalCompetence['chainIncidence'] = 'PLURIFASICO';

      if (compLabel === '01/2021') {
        xmlCount = 1450;
        recoverableAmountBrl = 12400;
        statusType = 'AUDITORIA_OK_RECUPERAVEL';
        statusText = 'Auditoria OK | R$ 12.400,00 recuperáveis';
        badgeTone = 'emerald';
        teseSummary = 'Exclusão do ICMS da base de cálculo do PIS/COFINS (Tema 69 STF)';
        chainIncidence = 'PLURIFASICO';
      } else if (compLabel === '02/2021') {
        xmlCount = 1320;
        recoverableAmountBrl = 8100;
        statusType = 'BITRIBUTACAO_MONOFASICA';
        statusText = 'Bitributação Monofásica Detectada (R$ 8.100,00)';
        badgeTone = 'amber';
        teseSummary = 'Produtos Farmacêuticos & Cosméticos tributados indevidamente na saída (Lei 10.147/2000)';
        chainIncidence = 'MONOFASICO';
      } else if (compLabel === '12/2025') {
        xmlCount = 2100;
        recoverableAmountBrl = 0;
        statusType = 'CONFORME_100';
        statusText = 'Auditoria OK | 100% em conformidade';
        badgeTone = 'cyan';
        teseSummary = 'Auditoria integral concluída com 100% de conformidade tributária.';
        chainIncidence = 'PLURIFASICO';
      } else {
        const mod = (year * 12 + m) % 5;
        if (mod === 0) {
          // Recoverable credits (Tema 69)
          const baseRec = 9500 + ((year * 7 + m * 43) % 18000);
          recoverableAmountBrl = Math.round(baseRec / 100) * 100;
          statusType = 'AUDITORIA_OK_RECUPERAVEL';
          statusText = `Auditoria OK | R$ ${recoverableAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recuperáveis`;
          badgeTone = 'emerald';
          teseSummary = 'Exclusão ICMS destacado da base de cálculo PIS/COFINS (Tema 69 STF)';
          chainIncidence = 'PLURIFASICO';
        } else if (mod === 1) {
          // Monophasic (1x na cadeia - fábrica/importador)
          const baseMono = 6200 + ((year * 5 + m * 29) % 11000);
          recoverableAmountBrl = Math.round(baseMono / 100) * 100;
          statusType = 'BITRIBUTACAO_MONOFASICA';
          statusText = `Bitributação Monofásica Detectada (R$ ${recoverableAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
          badgeTone = 'amber';
          teseSummary = 'Segregação de NCMs monofásicos (1 incidência na fabricação) recolhidos indevidamente no varejo';
          chainIncidence = 'MONOFASICO';
        } else if (mod === 2) {
          // Bifásico (2x na cadeia - indústria e atacado)
          const baseBi = 7400 + ((year * 9 + m * 37) % 12500);
          recoverableAmountBrl = Math.round(baseBi / 100) * 100;
          statusType = 'INCIDENCIA_BIFASICA';
          statusText = `Regime Bifásico Identificado (R$ ${recoverableAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
          badgeTone = 'purple';
          teseSummary = 'Tributação em 2 etapas específicas (produção + atacado) com retenção indevida no varejo isento';
          chainIncidence = 'BIFASICO';
        } else if (mod === 3) {
          // Plurifásico Não-Cumulativo (todas as etapas sobre valor agregado)
          const basePluri = 8800 + ((year * 11 + m * 19) % 14000);
          recoverableAmountBrl = Math.round(basePluri / 100) * 100;
          statusType = 'INCIDENCIA_PLURIFASICA';
          statusText = `Regime Plurifásico Não-Cumulativo (R$ ${recoverableAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`;
          badgeTone = 'blue';
          teseSummary = 'Créditos sobre valor agregado em todas as etapas da cadeia (Leis 10.637 e 10.833)';
          chainIncidence = 'PLURIFASICO';
        } else {
          // 100% Conforme
          recoverableAmountBrl = 0;
          statusType = 'CONFORME_100';
          statusText = 'Auditoria OK | 100% em conformidade';
          badgeTone = 'cyan';
          teseSummary = 'Emissão e recolhimento em estrita conformidade pericial na cadeia.';
          chainIncidence = 'PLURIFASICO';
        }
      }

      // Generate sample detailed invoices for drilldown
      const sampleInvoices: TimelineXmlInvoice[] = [];
      const sampleCount = Math.min(6, Math.max(3, Math.floor(xmlCount / 300)));
      for (let s = 1; s <= sampleCount; s++) {
        const day = String(Math.min(28, s * 4 + 1)).padStart(2, '0');
        const hour = String(8 + ((s * 3) % 10)).padStart(2, '0');
        const min = String(10 + ((s * 13) % 48)).padStart(2, '0');
        const sec = String(15 + ((s * 7) % 40)).padStart(2, '0');
        const issueDateTime = `${year}-${monthStr}-${day}T${hour}:${min}:${sec}-03:00`;
        const nfeNum = String(10000 + (year % 100) * 1000 + m * 50 + s);
        const accessKey = `35${String(year).slice(-2)}${monthStr}33041260000188550010000${nfeNum}1098472819`;
        
        let invRec = 0;
        let invStatus: TimelineXmlInvoice['status'] = 'CONFORME_100';
        let incidenceRegime: TimelineXmlInvoice['incidenceRegime'] = chainIncidence;
        let ncm = '8471.30.12';
        let cfop = '5102';
        let cst = '01';
        let taxTese = 'Tributação Regular';
        let legalBasis = 'Conformidade EFD Fiscal';
        let reason: string | undefined = undefined;

        if (statusType === 'AUDITORIA_OK_RECUPERAVEL') {
          invRec = Math.round((recoverableAmountBrl / sampleCount) * 1.05);
          invStatus = 'AUDIT_OK_RECUPERAVEL';
          incidenceRegime = 'PLURIFASICO';
          ncm = s % 2 === 0 ? '8471.30.12' : '8504.40.10';
          cfop = '5102';
          cst = '01';
          taxTese = 'Exclusão do ICMS da base do PIS/COFINS (Tema 69 STF)';
          legalBasis = 'RE 574.706 / STF com Repercussão Geral';
          reason = `ICMS destacado de R$ ${(invRec * 10.8).toFixed(2)} incluído indevidamente na apuração de PIS/COFINS.`;
        } else if (statusType === 'BITRIBUTACAO_MONOFASICA') {
          invRec = Math.round((recoverableAmountBrl / sampleCount) * 1.02);
          invStatus = 'MONOPHASIC_OVERTAXED';
          incidenceRegime = 'MONOFASICO';
          ncm = s % 2 === 0 ? '3004.90.99' : '3304.99.90';
          cfop = '5405';
          cst = '04';
          taxTese = 'Bitributação Monofásica Revenda (Lei 10.147/2000)';
          legalBasis = 'Lei 10.147/2000, Art. 1º e Lei 10.833/2003';
          reason = `Produto NCM ${ncm} sujeito a alíquota zero no varejo foi recolhido integralmente (incidência única na fábrica).`;
        } else if (statusType === 'INCIDENCIA_BIFASICA') {
          invRec = Math.round((recoverableAmountBrl / sampleCount) * 1.03);
          invStatus = 'BIPHASIC_OVERTAXED';
          incidenceRegime = 'BIFASICO';
          ncm = s % 2 === 0 ? '3923.30.00' : '2710.19.99';
          cfop = '5102';
          cst = '02';
          taxTese = 'Regime Bifásico PIS/COFINS (Produção + Atacado)';
          legalBasis = 'Art. 2º da Lei 10.833/2003 e Regimes Setoriais';
          reason = `Incidência em 2 etapas (produção e atacado). Varejo isento indevidamente tributado na operação final.`;
        } else if (statusType === 'INCIDENCIA_PLURIFASICA') {
          invRec = Math.round((recoverableAmountBrl / sampleCount) * 1.04);
          invStatus = 'PLURIPHASIC_OVERTAXED';
          incidenceRegime = 'PLURIFASICO';
          ncm = s % 2 === 0 ? '8471.30.12' : '8504.40.10';
          cfop = '5102';
          cst = '50';
          taxTese = 'Regime Plurifásico Não-Cumulativo (Valor Agregado)';
          legalBasis = 'Leis 10.637/2002 e 10.833/2003 (Modelo IVA)';
          reason = `Incidência sobre valor agregado em todas as etapas; glosa de créditos essenciais na cadeia de suprimentos.`;
        }

        sampleInvoices.push({
          id: `inv-${year}-${monthStr}-${s}`,
          nfeNumber: nfeNum,
          series: '1',
          accessKey,
          issueDateTime,
          issuerCnpj: '33.041.260/0001-88',
          recipientCnpj: `${String(10 + s).padStart(2, '0')}.894.201/0001-99`,
          recipientName: s % 2 === 0 ? 'DISTRIBUIDORA NACIONAL S/A' : 'COMERCIAL DE INSUMOS BRASIL LTDA',
          totalAmount: Math.round(totalTransactedBrl / sampleCount),
          recoverableAmount: invRec,
          status: invStatus,
          incidenceRegime,
          ncm,
          cfop,
          cstPisCofins: cst,
          taxTese,
          legalBasis,
          divergenceReason: reason
        });
      }

      result.push({
        id: compId,
        year,
        month: m,
        competenceLabel: compLabel,
        xmlCount,
        totalTransactedBrl,
        recoverableAmountBrl,
        statusType,
        statusText,
        badgeTone,
        teseSummary,
        chainIncidence,
        sampleInvoices
      });
    }
  });

  return result;
}

interface FiscalChronologicalTimeline60MProps {
  onRecordAudit?: (author: string, role: string, action: string, target: string, details?: string) => void;
  onNavigateToCalculoPericial?: () => void;
  onNavigateToSpedEditor?: () => void;
}

export const FiscalChronologicalTimeline60M: React.FC<FiscalChronologicalTimeline60MProps> = ({
  onRecordAudit,
  onNavigateToCalculoPericial,
  onNavigateToSpedEditor
}) => {
  // Master 60 Months State
  const [competences, setCompetences] = useState<MonthlyFiscalCompetence[]>(() => generateInitial60Months());
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [activeViewMode, setActiveViewMode] = useState<'timeline_tree' | 'grid_schedule'>('timeline_tree');
  
  // Filter States
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showChainGuide, setShowChainGuide] = useState<boolean>(true);
  
  // Drill-down Modal/Accordion state
  const [expandedCompetenceId, setExpandedCompetenceId] = useState<string | null>('comp-2021-01');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Upload Batch Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStepMessage, setUploadStepMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Quick Notification Toast trigger
  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3500);
  };

  // Reorder Dates Handler
  const handleReorganizeDates = () => {
    setIsReordering(true);
    triggerToast('Iniciando reorganização por data/hora de emissão (dhEmi da SEFAZ)...');

    setTimeout(() => {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      setIsReordering(false);
      triggerToast(`Ordenação cronológica concluída (${sortDirection === 'asc' ? 'Decrescente: 12/2025 ➔ 01/2021' : 'Crescente: 01/2021 ➔ 12/2025'})!`);
      
      if (onRecordAudit) {
        onRecordAudit(
          'Operador Pericial',
          'Auditor Tributário',
          'TIMELINE_DATES_REORDERED',
          '60 Meses de Notas Fiscais',
          `Reorganização automática por timestamp dhEmi executada. Sentido: ${sortDirection === 'asc' ? 'Decrescente' : 'Crescente'}. 60 competências validadas.`
        );
      }
    }, 600);
  };

  // Upload Simulation Handler
  const handleSimulateBatchUpload = (batchName: string, extraXmls: number) => {
    setIsUploading(true);
    setUploadProgress(10);
    setUploadStepMessage('Lendo pacotes XML/SPED compactados...');

    setTimeout(() => {
      setUploadProgress(35);
      setUploadStepMessage('Decodificando chaves de 44 dígitos e nós <dhEmi>...');
    }, 500);

    setTimeout(() => {
      setUploadProgress(70);
      setUploadStepMessage('Executando ordenação cronológica rigorosa por data/hora...');
    }, 1100);

    setTimeout(() => {
      setUploadProgress(90);
      setUploadStepMessage('Agrupando nas 60 competências e auditando monofásicos/Tema 69...');
    }, 1700);

    setTimeout(() => {
      setUploadProgress(100);
      setUploadStepMessage('Ordenação e apuração concluídas com sucesso!');

      // Update competence xml counts
      setCompetences((prev) => 
        prev.map((c) => ({
          ...c,
          xmlCount: c.xmlCount + Math.floor(extraXmls / 60)
        }))
      );

      setTimeout(() => {
        setIsUploading(false);
        setIsUploadModalOpen(false);
        triggerToast(`Lote "${batchName}" (+${extraXmls.toLocaleString('pt-BR')} XMLs) processado e ordenado com sucesso!`);
        if (onRecordAudit) {
          onRecordAudit(
            'Auditor Fiscal',
            'Supervisão Pericial',
            'BATCH_XML_INGESTED',
            batchName,
            `Upload de lote com ${extraXmls.toLocaleString('pt-BR')} XMLs efetuado. Ordenação automática por dhEmi e consolidação nos 60 meses finalizada.`
          );
        }
      }, 500);
    }, 2200);
  };

  // Filtered and Sorted Competences
  const displayedCompetences = useMemo(() => {
    let list = [...competences];

    // Filter by year
    if (selectedYearFilter !== 'ALL') {
      list = list.filter((c) => c.year === selectedYearFilter);
    }

    // Filter by status
    if (selectedStatusFilter === 'RECUPERAVEL') {
      list = list.filter((c) => c.statusType === 'AUDITORIA_OK_RECUPERAVEL');
    } else if (selectedStatusFilter === 'MONOPHASIC') {
      list = list.filter((c) => c.statusType === 'BITRIBUTACAO_MONOFASICA' || c.chainIncidence === 'MONOFASICO');
    } else if (selectedStatusFilter === 'BIPHASIC') {
      list = list.filter((c) => c.statusType === 'INCIDENCIA_BIFASICA' || c.chainIncidence === 'BIFASICO');
    } else if (selectedStatusFilter === 'PLURIPHASIC') {
      list = list.filter((c) => c.statusType === 'INCIDENCIA_PLURIFASICA' || c.chainIncidence === 'PLURIFASICO');
    } else if (selectedStatusFilter === 'CONFORME') {
      list = list.filter((c) => c.statusType === 'CONFORME_100');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.competenceLabel.includes(q) ||
          c.statusText.toLowerCase().includes(q) ||
          c.teseSummary.toLowerCase().includes(q) ||
          c.chainIncidence.toLowerCase().includes(q)
      );
    }

    // Sort order
    list.sort((a, b) => {
      const valA = a.year * 100 + a.month;
      const valB = b.year * 100 + b.month;
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [competences, selectedYearFilter, selectedStatusFilter, searchQuery, sortDirection]);

  // High level aggregated metrics across all 60 months
  const totalXmls = useMemo(() => competences.reduce((acc, c) => acc + c.xmlCount, 0), [competences]);
  const totalRecoverable = useMemo(() => competences.reduce((acc, c) => acc + c.recoverableAmountBrl, 0), [competences]);
  const monophasicMonthsCount = useMemo(() => competences.filter((c) => c.statusType === 'BITRIBUTACAO_MONOFASICA' || c.chainIncidence === 'MONOFASICO').length, [competences]);
  const biphasicMonthsCount = useMemo(() => competences.filter((c) => c.statusType === 'INCIDENCIA_BIFASICA' || c.chainIncidence === 'BIFASICO').length, [competences]);
  const pluriphasicMonthsCount = useMemo(() => competences.filter((c) => c.statusType === 'INCIDENCIA_PLURIFASICA' || (c.chainIncidence === 'PLURIFASICO' && c.statusType !== 'CONFORME_100')).length, [competences]);
  const conformeMonthsCount = useMemo(() => competences.filter((c) => c.statusType === 'CONFORME_100').length, [competences]);
  const creditMonthsCount = useMemo(() => competences.filter((c) => c.statusType === 'AUDITORIA_OK_RECUPERAVEL').length, [competences]);

  // Copy Access Key helper
  const handleCopyAccessKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    triggerToast('Chave de acesso de 44 dígitos copiada!');
  };

  // Export Chronological CSV
  const handleExportCsv = () => {
    const headers = ['Competência', 'Ano', 'Mês', 'Regime Cadeia', 'XMLs Auditados', 'Volume Transacionado (R$)', 'Crédito Recuperável (R$)', 'Status Auditoria', 'Tese Aplicada'];
    const rows = displayedCompetences.map(c => [
      c.competenceLabel,
      c.year,
      c.month,
      c.chainIncidence,
      c.xmlCount,
      c.totalTransactedBrl.toFixed(2),
      c.recoverableAmountBrl.toFixed(2),
      `"${c.statusText}"`,
      `"${c.teseSummary}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Linha_do_Tempo_Cronologica_60_Meses_Velatrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Relatório CSV da Linha do Tempo exportado com sucesso!');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-emerald-950/95 border border-emerald-500 text-emerald-200 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-mono animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EXACT ASCII MATCH & HERO BANNER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--vx-deep)] border-2 border-emerald-500/50 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-emerald-500/10 blur-3xl pointer-events-none -mr-16 -mt-16" />

        {/* ASCII Header Frame */}
        <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl p-3 sm:p-4 font-mono text-emerald-400 shadow-inner">
          <div className="text-[10px] sm:text-xs text-emerald-500/80 leading-tight select-none hidden md:block">
            ┌─────────────────────────────────────────────────────────────────────────────────┐<br />
            │ 📅 LINHA DO TEMPO CRONOLÓGICA DE NOTAS FISCAIS (60 MESES)                       │<br />
            ├─────────────────────────────────────────────────────────────────────────────────┤
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  LINHA DO TEMPO CRONOLÓGICA DE NOTAS FISCAIS (60 MESES)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  01/2021 ➔ 12/2025
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Ordenação estrita por data/hora de emissão da SEFAZ (<span className="font-mono text-cyan-300">&lt;dhEmi&gt;</span>), segregação monofásica e auditoria pericial da janela de 5 anos ininterruptos (Art. 168 CTN).
              </p>
            </div>

            {/* Pipeline Banner */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-xl text-[11px] font-mono shrink-0 shadow-sm">
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold flex items-center gap-1">
                <Upload className="w-3 h-3" />
                UPLOAD LOTE / SPED / XMLs
              </span>
              <span className="text-emerald-400 font-bold">──►</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" />
                ORDENAÇÃO AUTOMÁTICA POR DATA/HORA DE EMISSÃO
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls matching prompt */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-upload-lote-xmls"
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/50 transition-all"
            >
              <Upload className="w-4 h-4 text-slate-950" />
              <span>[ UPLOAD LOTE / SPED / XMLs ]</span>
            </button>

            <button
              id="btn-ver-cronograma-completo"
              type="button"
              onClick={() => setActiveViewMode(prev => prev === 'timeline_tree' ? 'grid_schedule' : 'timeline_tree')}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
                activeViewMode === 'grid_schedule'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-cyan-800/80'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>[ VER CRONOGRAMA COMPLETO DA LINHA DO TEMPO ]</span>
            </button>

            <button
              id="btn-reorganizar-datas"
              type="button"
              onClick={handleReorganizeDates}
              disabled={isReordering}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isReordering ? 'animate-spin' : ''}`} />
              <span>[ REORGANIZAR DATAS ]</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({sortDirection === 'asc' ? '01/21 ➔ 12/25' : '12/25 ➔ 01/21'})
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Exportar CSV da Linha do Tempo"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Total XMLs Processados</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-lg font-bold text-slate-100 font-mono">
                {totalXmls.toLocaleString('pt-BR')}
              </strong>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold">60 meses</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono block mt-0.5">100% indexados por dhEmi</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Crédito Total Recuperável</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-lg font-bold text-emerald-400 font-mono">
                R$ {totalRecoverable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
            <span className="text-[9px] text-emerald-500/80 font-mono block mt-0.5">{creditMonthsCount + monophasicMonthsCount} meses com indébitos</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Bitributação Monofásica</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-lg font-bold text-amber-400 font-mono">
                {monophasicMonthsCount} meses
              </strong>
              <span className="text-[10px] font-mono text-slate-400">identificados</span>
            </div>
            <span className="text-[9px] text-amber-500/80 font-mono block mt-0.5">Lei 10.147/2000 (Saída s/ PIS/COF)</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Janela Quinquenal Prescricional</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-lg font-bold text-cyan-400 font-mono">
                Art. 168 CTN
              </strong>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Válida</span>
            </div>
            <span className="text-[9px] text-cyan-400/80 font-mono block mt-0.5">01/2021 a 12/2025 protegidos</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* FILTER & SEARCH BAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--vx-deep)] p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Year Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-500 font-bold mr-1">Ano:</span>
          {(['ALL', 2021, 2022, 2023, 2024, 2025] as const).map((yr) => (
            <button
              key={String(yr)}
              type="button"
              onClick={() => setSelectedYearFilter(yr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYearFilter === yr
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {yr === 'ALL' ? 'Todos (60 Meses)' : yr}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono">
          <span className="text-[10px] uppercase text-slate-500 font-bold mr-1">Filtro Pericial:</span>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'ALL'
                ? 'bg-slate-800 text-white font-bold border border-slate-700'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos ({displayedCompetences.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('RECUPERAVEL')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'RECUPERAVEL'
                ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-600'
                : 'bg-slate-900/60 text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            Créditos Tema 69 ({creditMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('MONOPHASIC')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'MONOPHASIC'
                ? 'bg-amber-950 text-amber-300 font-bold border border-amber-600'
                : 'bg-slate-900/60 text-amber-400/80 hover:text-amber-300'
            }`}
            title="Tributo incide 1x na cadeia comercial (fabricante/importador)"
          >
            Monofásico ({monophasicMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('BIPHASIC')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'BIPHASIC'
                ? 'bg-purple-950 text-purple-300 font-bold border border-purple-600'
                : 'bg-slate-900/60 text-purple-400/80 hover:text-purple-300'
            }`}
            title="Tributo incide em 2 etapas específicas da cadeia comercial (produção + atacado)"
          >
            Bifásico ({biphasicMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('PLURIPHASIC')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'PLURIPHASIC'
                ? 'bg-blue-950 text-blue-300 font-bold border border-blue-600'
                : 'bg-slate-900/60 text-blue-400/80 hover:text-blue-300'
            }`}
            title="Tributo incide em todas as etapas da cadeia comercial sobre o valor agregado"
          >
            Plurifásico ({pluriphasicMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('CONFORME')}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
              selectedStatusFilter === 'CONFORME'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-600'
                : 'bg-slate-900/60 text-cyan-400/80 hover:text-cyan-300'
            }`}
          >
            100% Conforme ({conformeMonthsCount})
          </button>
          <button
            type="button"
            onClick={() => setShowChainGuide(prev => !prev)}
            className={`px-2 py-1 rounded-lg text-[11px] font-sans flex items-center gap-1 transition-all cursor-pointer ${
              showChainGuide 
                ? 'bg-slate-800 text-cyan-300 border border-slate-700' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-300 border border-slate-800'
            }`}
            title="Exibir guia pericial dos regimes da cadeia comercial"
          >
            <Info className="w-3 h-3 text-cyan-400" />
            <span>{showChainGuide ? 'Ocultar Guia' : 'Guia da Cadeia'}</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mês (ex: 01/2021) ou tese..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900/90 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Educational Taxonomy Guide for Monofásico, Bifásico e Plurifásico */}
      {showChainGuide && (
        <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3 font-mono text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>CLASSIFICAÇÃO PERICIAL: INCIDÊNCIA TRIBUTÁRIA NA CADEIA COMERCIAL</span>
            </span>
            <span className="text-[10px] text-slate-500">PIS/COFINS e Tributos Indiretos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Monofásico Card */}
            <div className="p-3 bg-amber-950/20 border border-amber-800/50 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-amber-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Regime Monofásico
                </strong>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700 text-amber-300 font-bold">1 Incidência</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                O tributo incide <strong>apenas 1 vez na cadeia</strong> (geralmente no fabricante ou importador), com alíquota concentrada mais alta. As etapas seguintes (distribuidor/atacado/varejo) praticam alíquota zero.
              </p>
              <div className="pt-1 text-[10px] text-amber-400/90 border-t border-amber-900/40">
                <span>Ex.: Combustíveis, bebidas, medicamentos e cosméticos (Lei 10.147/2000).</span>
              </div>
            </div>

            {/* Bifásico Card */}
            <div className="p-3 bg-purple-950/20 border border-purple-800/50 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-purple-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Regime Bifásico
                </strong>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 font-bold">2 Incidências</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                O tributo incide em <strong>2 etapas específicas da cadeia comercial</strong> (produção industrial e atacado distribuidor) com alíquotas concentradas setoriais (PIS 2,10% / COFINS 9,65%), desonerando a etapa final do varejo ao consumidor com alíquota zero.
              </p>
              <div className="pt-1 text-[10px] text-purple-400/90 border-t border-purple-900/40">
                <span>Ex.: Autopeças, máquinas e embalagens industriais (Lei nº 10.485/2002, arts. 2º e 3º; Lei nº 10.833/2003, arts. 2º e 51-53; Lei nº 11.196/2005, art. 53).</span>
              </div>
            </div>

            {/* Plurifásico Card */}
            <div className="p-3 bg-blue-950/20 border border-blue-800/50 rounded-lg space-y-1.5">
              <div className="flex items-center justify-between">
                <strong className="text-blue-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  Regime Plurifásico
                </strong>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 font-bold">Todas as Etapas</span>
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                O tributo incide em <strong>todas as etapas da circulação</strong> (fabricante ➔ atacadista ➔ varejista), cobrando sobre o valor agregado em cada fase pelo regime não-cumulativo (débito e crédito).
              </p>
              <div className="pt-1 text-[10px] text-blue-400/90 border-t border-blue-900/40">
                <span>Ex.: Mercadorias em geral no Lucro Real (Leis 10.637/02 e 10.833/03 - 9,25%).</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 1: TIMELINE PROCESSADA EM ÁRVORE (ASCII TREE STYLE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeViewMode === 'timeline_tree' && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-xs sm:text-sm font-mono font-bold text-slate-200 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">TIMELINE PROCESSADA:</span>
                <span className="text-slate-400 font-normal">
                  ({displayedCompetences.length} de 60 competências exibidas • Sentido: {sortDirection === 'asc' ? '01/2021 ➔ 12/2025' : '12/2025 ➔ 01/2021'})
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Clique em qualquer mês para abrir o drilldown com as chaves de acesso XML e memórias detalhadas de cálculo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Recuperável</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Monofásico (1x)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Bifásico (2x)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Plurifásico</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Conforme</span>
              </span>
            </div>
          </div>

          {/* Tree list */}
          <div className="space-y-2 font-mono text-xs">
            {displayedCompetences.map((comp, index) => {
              const isLast = index === displayedCompetences.length - 1;
              const branchSymbol = isLast ? '└──' : '├──';
              const isExpanded = expandedCompetenceId === comp.id;

              return (
                <div
                  key={comp.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  {/* Main Timeline Row */}
                  <div
                    onClick={() => setExpandedCompetenceId(isExpanded ? null : comp.id)}
                    className="p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      
                      {/* Tree branch connector */}
                      <span className="text-slate-600 font-bold text-sm select-none">
                        {branchSymbol}
                      </span>

                      {/* Month badge */}
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold text-xs tracking-wider">
                        {comp.competenceLabel}
                      </span>

                      {/* XML Count Bracket */}
                      <span className="px-2.5 py-0.5 rounded bg-slate-900/80 text-cyan-300 border border-cyan-800/60 text-[11px] font-semibold">
                        [ {comp.xmlCount.toLocaleString('pt-BR')} XMLs ]
                      </span>

                      {/* Arrow */}
                      <span className="text-slate-500 font-bold hidden sm:inline">
                        ──►
                      </span>

                      {/* Verdict */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        comp.statusType === 'AUDITORIA_OK_RECUPERAVEL'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : comp.statusType === 'BITRIBUTACAO_MONOFASICA'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : comp.statusType === 'INCIDENCIA_BIFASICA'
                          ? 'bg-purple-950 text-purple-300 border-purple-700'
                          : comp.statusType === 'INCIDENCIA_PLURIFASICA'
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      }`}>
                        {comp.statusType === 'AUDITORIA_OK_RECUPERAVEL' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                        {comp.statusType === 'BITRIBUTACAO_MONOFASICA' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {comp.statusType === 'INCIDENCIA_BIFASICA' && <Layers className="w-3 h-3 text-purple-400" />}
                        {comp.statusType === 'INCIDENCIA_PLURIFASICA' && <TrendingUp className="w-3 h-3 text-blue-400" />}
                        {comp.statusType === 'CONFORME_100' && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
                        <span>{comp.statusText}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-auto text-[11px]">
                      <span className="text-slate-400 hidden lg:inline truncate max-w-xs text-right">
                        {comp.teseSummary}
                      </span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800"
                      >
                        <span>{isExpanded ? 'Recolher' : 'Drilldown'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Drilldown for Competence */}
                  {isExpanded && (
                    <div className="p-4 bg-[var(--vx-deep)] border-t border-slate-800/90 rounded-b-xl space-y-4">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase block">Volume Transacionado no Mês</span>
                          <strong className="text-sm text-slate-100 font-bold font-mono">
                            R$ {comp.totalTransactedBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase block">Indébito Apurado para Restituição</span>
                          <strong className="text-sm text-emerald-400 font-bold font-mono">
                            R$ {comp.recoverableAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400 uppercase block">Fundamentação Pericial</span>
                          <span className="text-xs text-cyan-300 font-medium font-mono truncate block" title={comp.teseSummary}>
                            {comp.teseSummary}
                          </span>
                        </div>
                      </div>

                      {/* Invoice Table Drilldown */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-300 font-mono flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            Amostra de NF-es do Mês {comp.competenceLabel} (Ordenadas estritamente por dhEmi):
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {comp.sampleInvoices.length} de {comp.xmlCount} exibidas
                          </span>
                        </div>

                        <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono text-slate-400 uppercase">
                                <th className="py-2 px-3">Data/Hora Emissão (dhEmi)</th>
                                <th className="py-2 px-3">NF-e & Série</th>
                                <th className="py-2 px-3">Chave de Acesso SEFAZ (44 dígitos)</th>
                                <th className="py-2 px-3">Destinatário</th>
                                <th className="py-2 px-3">NCM / CFOP</th>
                                <th className="py-2 px-3 text-right">Valor NF-e</th>
                                <th className="py-2 px-3 text-right">Crédito Recuperável</th>
                                <th className="py-2 px-3">Status Auditoria</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                              {comp.sampleInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-900/40">
                                  <td className="py-2 px-3 text-cyan-300 font-semibold">
                                    {new Date(inv.issueDateTime).toLocaleString('pt-BR')}
                                  </td>
                                  <td className="py-2 px-3 font-bold text-slate-200">
                                    {inv.nfeNumber} / S{inv.series}
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1">
                                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]" title={inv.accessKey}>
                                        {inv.accessKey}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyAccessKey(inv.accessKey)}
                                        className="p-1 hover:text-white text-slate-500 rounded hover:bg-slate-800 transition-colors"
                                        title="Copiar Chave SEFAZ"
                                      >
                                        {copiedKey === inv.accessKey ? (
                                          <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-slate-300 truncate max-w-[140px]">
                                    {inv.recipientName}
                                  </td>
                                  <td className="py-2 px-3 text-slate-300">
                                    <span className="text-amber-300 font-bold">{inv.ncm}</span>
                                    <span className="text-slate-500 text-[10px] ml-1">({inv.cfop})</span>
                                  </td>
                                  <td className="py-2 px-3 text-right text-slate-200">
                                    R$ {inv.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2 px-3 text-right font-bold">
                                    {inv.recoverableAmount > 0 ? (
                                      <span className="text-emerald-400">
                                        R$ {inv.recoverableAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </span>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                                      inv.status === 'AUDIT_OK_RECUPERAVEL'
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                        : inv.status === 'MONOPHASIC_OVERTAXED'
                                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                                        : inv.status === 'BIPHASIC_OVERTAXED'
                                        ? 'bg-purple-950 text-purple-300 border-purple-700'
                                        : inv.status === 'PLURIPHASIC_OVERTAXED'
                                        ? 'bg-blue-950 text-blue-300 border-blue-700'
                                        : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                    }`}>
                                      {inv.status === 'AUDIT_OK_RECUPERAVEL' && 'Tema 69 STF'}
                                      {inv.status === 'MONOPHASIC_OVERTAXED' && 'Monofásico (1x)'}
                                      {inv.status === 'BIPHASIC_OVERTAXED' && 'Bifásico (2x)'}
                                      {inv.status === 'PLURIPHASIC_OVERTAXED' && 'Plurifásico'}
                                      {inv.status === 'CONFORME_100' && 'Conforme'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[11px] text-slate-400">
                            {comp.divergenceReason || comp.teseSummary}
                          </p>
                          <div className="flex items-center gap-2">
                            {onNavigateToCalculoPericial && comp.recoverableAmountBrl > 0 && (
                              <button
                                type="button"
                                onClick={onNavigateToCalculoPericial}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                              >
                                <span>Ver no Motor Pericial</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VIEW 2: CRONOGRAMA COMPLETO PANORÂMICO (GRID 60 MESES) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeViewMode === 'grid_schedule' && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-mono font-bold text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                CRONOGRAMA COMPLETO DA LINHA DO TEMPO (MATRIZ DE 60 MESES)
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Visão panorâmica dos 5 anos completos (2021 a 2025). Clique em qualquer competência mensal para abrir a auditoria.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveViewMode('timeline_tree')}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-emerald-400 border border-slate-700 cursor-pointer"
            >
              ← Voltar à Árvore Cronológica
            </button>
          </div>

          {/* Matrix by Year */}
          {[2021, 2022, 2023, 2024, 2025].map((yr) => {
            const monthsInYear = competences.filter((c) => c.year === yr).sort((a, b) => a.month - b.month);
            const yearRecoverable = monthsInYear.reduce((acc, c) => acc + c.recoverableAmountBrl, 0);
            const yearXmls = monthsInYear.reduce((acc, c) => acc + c.xmlCount, 0);

            return (
              <div key={yr} className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-mono font-black text-slate-100">{yr}</span>
                    <span className="text-xs font-mono text-slate-400">
                      ({yearXmls.toLocaleString('pt-BR')} XMLs processados)
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-slate-400">Crédito Anual Apurado: </span>
                    <strong className="text-emerald-400 font-bold">
                      R$ {yearRecoverable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                  {monthsInYear.map((mComp) => {
                    const isRec = mComp.statusType === 'AUDITORIA_OK_RECUPERAVEL';
                    const isMono = mComp.statusType === 'BITRIBUTACAO_MONOFASICA';
                    const isBi = mComp.statusType === 'INCIDENCIA_BIFASICA';
                    const isPluri = mComp.statusType === 'INCIDENCIA_PLURIFASICA';

                    return (
                      <div
                        key={mComp.id}
                        onClick={() => {
                          setExpandedCompetenceId(mComp.id);
                          setActiveViewMode('timeline_tree');
                        }}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition-all hover:scale-105 ${
                          isRec
                            ? 'bg-emerald-950/40 border-emerald-600/80 text-emerald-300 shadow-sm'
                            : isMono
                            ? 'bg-amber-950/40 border-amber-600/80 text-amber-300 shadow-sm'
                            : isBi
                            ? 'bg-purple-950/40 border-purple-600/80 text-purple-300 shadow-sm'
                            : isPluri
                            ? 'bg-blue-950/40 border-blue-600/80 text-blue-300 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-cyan-300'
                        }`}
                        title={`${mComp.competenceLabel}: ${mComp.statusText}`}
                      >
                        <span className="text-xs font-mono font-bold block">
                          {String(mComp.month).padStart(2, '0')}/{String(mComp.year).slice(-2)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {mComp.xmlCount} xmls
                        </span>
                        <span className="text-[10px] font-mono font-bold block mt-1 truncate">
                          {mComp.recoverableAmountBrl > 0 
                            ? `R$ ${(mComp.recoverableAmountBrl / 1000).toFixed(1)}k`
                            : '100% OK'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: UPLOAD LOTE / SPED / XMLs */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] border border-emerald-500/50 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            
            <button
              type="button"
              onClick={() => !isUploading && setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase font-bold">
                  INGESTÃO CRONOLÓGICA D+0
                </span>
                <span className="text-[10px] font-mono text-slate-400">SEFAZ & SPED</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Upload de Lote / SPED / Arquivos XMLs (60 Meses)
              </h2>
              <p className="text-xs text-slate-400">
                Arraste diretórios de XMLs (.xml, .zip) ou arquivos de EFD ICMS/IPI e EFD-Contribuições (.txt). O motor AOS ordenará automaticamente todos os registros por data e hora exatas de emissão (<span className="font-mono text-cyan-300">&lt;dhEmi&gt;</span>).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleSimulateBatchUpload('Lote Arrastado (Diretório XMLs)', 14200);
              }}
              className={`p-6 border-2 border-dashed rounded-xl text-center space-y-3 transition-all ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
              }`}
            >
              <FolderArchive className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="space-y-1">
                <strong className="text-xs text-slate-200 font-bold block">
                  Arraste seus pacotes ZIP ou pastas de XMLs aqui
                </strong>
                <span className="text-[11px] text-slate-400 block font-mono">
                  Suporta XMLs de NF-e, NFC-e, NFS-e e TXT do SPED Fiscal dos últimos 60 meses
                </span>
              </div>
              <label className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors">
                Selecionar Arquivos do Computador
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={() => handleSimulateBatchUpload('Lote Manual XMLs', 8400)}
                />
              </label>
            </div>

            {/* Ingestion Progress Bar */}
            {isUploading && (
              <div className="space-y-2 p-3.5 bg-slate-950 border border-emerald-500/40 rounded-xl font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    {uploadStepMessage}
                  </span>
                  <span className="text-slate-300 font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Demo Batches to Test Instantly */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
                Ou carregue um lote de demonstração pronto:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleSimulateBatchUpload('Lote 60M Farmácia & Autopeças (Monofásicos)', 18450)}
                  className="p-3 text-left bg-slate-900/80 hover:bg-slate-800 border border-amber-800/60 rounded-xl space-y-1 transition-all cursor-pointer"
                >
                  <strong className="text-amber-300 font-bold block">
                    + 18.450 XMLs Monofásicos
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    Farmacêuticos (NCM 3004) e Autopeças (NCM 8708)
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleSimulateBatchUpload('Lote 60M Indústria Geral (Tema 69 STF)', 24800)}
                  className="p-3 text-left bg-slate-900/80 hover:bg-slate-800 border border-emerald-800/60 rounded-xl space-y-1 transition-all cursor-pointer"
                >
                  <strong className="text-emerald-300 font-bold block">
                    + 24.800 XMLs Tema 69 STF
                  </strong>
                  <span className="text-[10px] text-slate-400 block">
                    Exclusão de ICMS destacado das 60 competências
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
