import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Mail,
  RefreshCw,
  Eye,
  Copy,
  Check,
  X,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Send,
  Building2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Code2,
  FileCode,
  Layers,
  Percent,
  Receipt
} from 'lucide-react';
import { NfseItem, NfseEventLog, NfseSummaryMetrics, NfseOperationType } from '../../types/nfse';
import { NfseService } from '../../services/nfseService';
import { generateNfseDanfsePdf } from '../../services/pdfReportService';

interface NfseManagementSectionProps {
  onRecordAudit?: (employee: string, role: string, actionType: any, summary: string, details: string) => void;
}

export const NfseManagementSection: React.FC<NfseManagementSectionProps> = ({ onRecordAudit }) => {
  // State
  const [items, setItems] = useState<NfseItem[]>(() => NfseService.getAllNfse());
  const [eventLogs, setEventLogs] = useState<NfseEventLog[]>(() => NfseService.getEventLogs());
  const [metrics, setMetrics] = useState<NfseSummaryMetrics>(() => NfseService.getSummaryMetrics());
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modals & Drawers
  const [selectedItemForJson, setSelectedItemForJson] = useState<NfseItem | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isReemittingId, setIsReemittingId] = useState<string | null>(null);
  const [isSendingEmailId, setIsSendingEmailId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Simulation Form
  const [simForm, setSimForm] = useState({
    clientName: 'AgroSul Cooperativa Agroindustrial',
    cnpj: '09.481.204/0001-33',
    grossAmountBrl: 150000,
    operationType: 'TAX_RECOVERY_SUCCESS_FEE' as NfseOperationType,
    partnerSplitPct: 40,
    partnerName: 'Medeiros & Castro Consultoria Tributária'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  const refreshData = () => {
    setItems(NfseService.getAllNfse());
    setEventLogs(NfseService.getEventLogs());
    setMetrics(NfseService.getSummaryMetrics());
  };

  // Handler: Download PDF DANFSE
  const handleDownloadDanfse = (item: NfseItem) => {
    try {
      generateNfseDanfsePdf(item);
      showToast(`DANFSE oficial (${item.nfseNumber}) baixado em PDF com sucesso.`);
      if (onRecordAudit) {
        onRecordAudit(
          'Ana Beatriz Souza',
          'Contador',
          'PRE_INVOICE_GENERATED',
          `DANFSE ${item.nfseNumber} exportado`,
          `Baixou o espelho DANFSE em PDF da nota ${item.nfseNumber} referente ao cliente "${item.clientName}".`
        );
      }
    } catch (err: any) {
      showToast('Erro ao gerar DANFSE em PDF', 'error');
    }
  };

  // Handler: Download XML ABRASF
  const handleDownloadXml = (item: NfseItem) => {
    try {
      NfseService.downloadNfseXml(item);
      showToast(`XML ABRASF (${item.nfseNumber}) baixado com sucesso.`);
      if (onRecordAudit) {
        onRecordAudit(
          'Ana Beatriz Souza',
          'Contador',
          'PRE_INVOICE_GENERATED',
          `XML ABRASF ${item.nfseNumber} exportado`,
          `Baixou o XML oficial da nota fiscal ${item.nfseNumber} para conformidade contábil.`
        );
      }
    } catch (err) {
      showToast('Erro ao gerar XML da NFS-e', 'error');
    }
  };

  // Handler: Resend Email
  const handleResendEmail = (item: NfseItem) => {
    setIsSendingEmailId(item.id);
    setTimeout(() => {
      const result = NfseService.resendNfseEmail(item.id);
      setIsSendingEmailId(null);
      if (result.success) {
        showToast(result.message);
        refreshData();
        if (onRecordAudit) {
          onRecordAudit(
            'Ana Beatriz Souza',
            'Contador',
            'PRE_INVOICE_GENERATED',
            `Reenvio de NFS-e por e-mail (${item.nfseNumber})`,
            `Disparou e-mail com DANFSE e XML para o tomador "${item.clientName}" (${item.tomadorEmail}).`
          );
        }
      } else {
        showToast(result.message, 'error');
      }
    }, 800);
  };

  // Handler: Manual Re-emission
  const handleManualReemit = (item: NfseItem) => {
    setIsReemittingId(item.id);
    setTimeout(() => {
      const result = NfseService.manualReemit(item.id);
      setIsReemittingId(null);
      if (result.success) {
        showToast(result.message);
        refreshData();
        if (onRecordAudit) {
          onRecordAudit(
            'Ana Beatriz Souza',
            'Contador',
            'PRE_INVOICE_GENERATED',
            `Reemissão manual de NFS-e (${item.id})`,
            `Executou saneamento cadastral e reemitiu a NFS-e de "${item.clientName}".`
          );
        }
      } else {
        showToast(result.message, 'error');
      }
    }, 1000);
  };

  // Handler: Simulate Payment Liquidation Trigger
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newItem = NfseService.triggerPaymentLiquidation({
        clientName: simForm.clientName,
        cnpj: simForm.cnpj,
        grossAmountBrl: Number(simForm.grossAmountBrl) || 100000,
        operationType: simForm.operationType,
        partnerSplitPct: simForm.operationType === 'TAX_RECOVERY_SUCCESS_FEE' ? simForm.partnerSplitPct : 0,
        partnerName: simForm.partnerName
      });

      refreshData();
      setIsSimulateModalOpen(false);
      showToast(`Pagamento liquidado! NFS-e ${newItem.nfseNumber} emitida sobre a base líquida de R$ ${newItem.velatrixRetainedAmountBrl.toLocaleString('pt-BR')}.`);

      if (onRecordAudit) {
        onRecordAudit(
          'Sistema Autônomo Velatrix AOS',
          'Contador',
          'PRE_INVOICE_GENERATED',
          `Gatilho de liquidação e emissão de NFS-e (${newItem.nfseNumber})`,
          `Emissão automática executada após liquidação bancária para "${newItem.clientName}". Tipo: ${newItem.operationType}. Base Retida: R$ ${newItem.velatrixRetainedAmountBrl.toLocaleString('pt-BR')}.`
        );
      }
    } catch (err: any) {
      showToast('Falha ao processar simulação de pagamento', 'error');
    }
  };

  // Filtered Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cnpj.includes(searchTerm) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nfseNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || item.operationType === filterType;
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div id="nfse-module-root" className="space-y-5 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in shadow-xl ${
          feedbackToast.type === 'success'
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
            : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackToast.message}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER WITH TRIGGER ACTION */}
      <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold">
              MÓDULO FISCAL & NFS-e
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Sincronizado SEFAZ / Paulistana D+0
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
            <FileText className="w-4 h-4 text-[var(--vx-neon)]" />
            Emissão de Notas Fiscais de Serviços Eletrônicas (NFS-e)
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl">
            Gatilho autônomo pós-liquidação financeira. Em operações com split de parceiro, a NFS-e da Velatrix incide <strong>estritamente sobre a parcela líquida retida</strong>, garantindo blindagem e conformidade tributária.
          </p>
        </div>

        {/* Trigger Button: Simulate Payment Liquidation */}
        <button
          id="btn-simulate-nfse-liquidation"
          onClick={() => setIsSimulateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--vx-neon)] to-cyan-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Simular Liquidação &amp; Disparar NFS-e</span>
        </button>
      </div>

      {/* (1.1) DASHBOARD SUPERIOR (4 CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Faturado no Mês (Valor Bruto) */}
        <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Total Faturado no Mês</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalGrossBilledBrl)}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <span>Base Líquida Velatrix:</span>
              <strong className="text-cyan-300 font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalVelatrixNetBrl)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Total de NFS-e Emitidas */}
        <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-emerald-900/40 space-y-2 shadow-lg bg-gradient-to-b from-emerald-950/15 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-300">Total de NFS-e Emitidas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-2 tabular-nums">
              <span>{metrics.totalEmittedCount} Notas</span>
              <span className="text-xs font-normal text-emerald-300/80">Homologadas</span>
            </div>
            <div className="text-[10px] text-emerald-400/80 font-mono">
              Volume Tributado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metrics.totalEmittedValueBrl)}
            </div>
          </div>
        </div>

        {/* Card 3: Notas Pendentes / Rejeitadas */}
        <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Pendentes &amp; Rejeitadas</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold font-mono text-amber-400">{metrics.pendingCount}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
                Processando
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold font-mono text-rose-400">{metrics.rejectedCount}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                Rejeitada
              </span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400">
            {metrics.rejectedCount > 0 ? '⚠️ Requer reemissão manual com saneamento.' : 'Fluxo 100% nominal.'}
          </div>
        </div>

        {/* Card 4: Próximo Lote de Fechamento */}
        <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-slate-800 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Próximo Lote de Fechamento</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-xl font-bold font-mono text-purple-300">
              {metrics.nextClosingBatchDate}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate" title={metrics.nextClosingBatchName}>
              {metrics.nextClosingBatchName}
            </div>
          </div>
        </div>

      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--vx-deep)] p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, CNPJ, ID ou nº da NFS-e..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="SAAS_SUBSCRIPTION">Licenciamento SaaS (100% Velatrix)</option>
            <option value="TAX_RECOVERY_SUCCESS_FEE">Success Fee (Com Split de Parceiro)</option>
          </select>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="EMITIDA">Emitida</option>
            <option value="PROCESSANDO">Processando</option>
            <option value="REJEITADA">Rejeitada</option>
          </select>
        </div>
      </div>

      {/* (1.1) TABELA PRINCIPAL DE NFS-e */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-950/60">
                <th className="py-3.5 px-4">ID Operação</th>
                <th className="py-3.5 px-4">Cliente / Tomador</th>
                <th className="py-3.5 px-4">Data Pagamento</th>
                <th className="py-3.5 px-4">Valor Bruto</th>
                <th className="py-3.5 px-4">Valor Retido Velatrix (Base NFS-e)</th>
                <th className="py-3.5 px-4">Nº da NFS-e</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações Fiscais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 font-mono text-xs">
                    Nenhuma operação de NFS-e localizada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const isSaaS = item.operationType === 'SAAS_SUBSCRIPTION';
                  const isEmitted = item.status === 'EMITIDA';
                  const isProcessing = item.status === 'PROCESSANDO';
                  const isRejected = item.status === 'REJEITADA';

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      
                      {/* ID da Operação */}
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300 text-[11px]">
                        {item.id}
                        <span className={`block text-[9px] font-mono mt-0.5 ${isSaaS ? 'text-blue-400' : 'text-amber-400'}`}>
                          {isSaaS ? 'SaaS Recorrente' : 'Success Fee'}
                        </span>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-200 block text-xs">{item.clientName}</strong>
                        <span className="text-[10px] font-mono text-slate-400">{item.cnpj}</span>
                      </td>

                      {/* Data de Pagamento */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px]">
                        {item.paymentDate}
                      </td>

                      {/* Valor Bruto */}
                      <td className="py-3.5 px-4 font-mono text-slate-200 tabular-nums">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.grossAmountBrl)}
                      </td>

                      {/* Valor Retido Velatrix */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-emerald-400 tabular-nums text-xs">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl)}
                        </div>
                        {item.partnerSplitPct > 0 ? (
                          <div className="text-[9px] text-amber-300 font-mono mt-0.5">
                            Split {item.partnerSplitPct}% Parceiro: -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.partnerSplitAmountBrl)}
                          </div>
                        ) : (
                          <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                            100% Cota Velatrix
                          </div>
                        )}
                      </td>

                      {/* Número da NFS-e */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span className={`block font-bold ${isEmitted ? 'text-slate-100' : isProcessing ? 'text-amber-300' : 'text-rose-400'}`}>
                          {item.nfseNumber}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Cód: {item.verificationCode}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1 w-fit ${
                          isEmitted
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : isProcessing
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-rose-950 text-rose-300 border-rose-800'
                        }`}>
                          {isEmitted && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {isProcessing && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                          {isRejected && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                          <span>{item.status}</span>
                        </span>
                        {item.rejectionReason && (
                          <span className="text-[9px] text-rose-400 line-clamp-1 mt-0.5 block max-w-xs" title={item.rejectionReason}>
                            {item.rejectionReason}
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          
                          {/* Ver JSON Municipal */}
                          <button
                            onClick={() => setSelectedItemForJson(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer transition-colors"
                            title="Visualizar retorno JSON da SEFAZ Municipal / Prefeitura"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Download PDF DANFSE */}
                          <button
                            onClick={() => handleDownloadDanfse(item)}
                            className="px-2 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 hover:text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                            title="Baixar DANFSE oficial em PDF"
                          >
                            <Download className="w-3 h-3 text-cyan-400" />
                            <span>PDF</span>
                          </button>

                          {/* Download XML ABRASF */}
                          <button
                            onClick={() => handleDownloadXml(item)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Baixar XML oficial padrão ABRASF"
                          >
                            <FileCode className="w-3 h-3 text-emerald-400" />
                            <span>XML</span>
                          </button>

                          {/* Reenviar E-mail */}
                          <button
                            onClick={() => handleResendEmail(item)}
                            disabled={isSendingEmailId === item.id}
                            className="px-2 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-700/60 text-sky-300 hover:text-white font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                            title="Reenviar documentação por e-mail para o cliente"
                          >
                            <Mail className={`w-3 h-3 ${isSendingEmailId === item.id ? 'animate-bounce' : ''}`} />
                            <span>{isSendingEmailId === item.id ? '...' : 'E-mail'}</span>
                          </button>

                          {/* Botão de Reemissão Manual (em caso de rejeição ou processando) */}
                          {(isRejected || isProcessing) && (
                            <button
                              onClick={() => handleManualReemit(item)}
                              disabled={isReemittingId === item.id}
                              className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-mono font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-amber-950/40"
                              title="Reemitir e forçar autorização manual na SEFAZ"
                            >
                              <RefreshCw className={`w-3 h-3 ${isReemittingId === item.id ? 'animate-spin' : ''}`} />
                              <span>{isReemittingId === item.id ? 'Reemitindo...' : 'Reemitir'}</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* (1.1) PAINEL ADMINISTRATIVO DE EVENTOS & RETRANSMISSÃO */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider">
                Trilha Administrativa de Eventos &amp; Webhooks SEFAZ
              </h3>
              <p className="text-[11px] text-slate-400">
                Log de conciliação bancária, quórum de split e autorizações de RPS em tempo real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Atualizar Logs</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {eventLogs.map(log => (
            <div key={log.id} className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.2 rounded ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : log.status === 'WARNING'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {log.eventType}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">{log.nfseId}</span>
                  <span className="text-[10px] font-mono text-slate-500">[{log.source}]</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {log.description}
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* (1.1) MODAL INSPETOR DE RESPOSTA JSON DA PREFEITURA / SEFAZ */}
      {selectedItemForJson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-cyan-500/40 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Retorno SEFAZ / Prefeitura SP — {selectedItemForJson.nfseNumber}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Protocolo: {selectedItemForJson.municipalResponse.protocolo} · Cliente: {selectedItemForJson.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemForJson(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Summary Banner */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">CÓDIGO DE RETORNO:</span>
                <span className="text-emerald-400 font-bold">{selectedItemForJson.municipalResponse.codigoRetorno}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">AMBIENTE:</span>
                <span className="text-cyan-300 font-bold">{selectedItemForJson.municipalResponse.ambienteEmissao}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">DIGEST SHA-256:</span>
                <span className="text-slate-300 text-[10px] truncate max-w-[140px] block" title={selectedItemForJson.municipalResponse.xmlDigestSha256}>
                  {selectedItemForJson.municipalResponse.xmlDigestSha256.substring(0, 16)}...
                </span>
              </div>
            </div>

            {/* Split Rule Note */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1">
              <strong className="font-mono text-amber-300 block">Demostrativo de Base Tributária &amp; Split:</strong>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] mt-1">
                <div>
                  <span className="text-slate-400 block text-[9px]">VALOR BRUTO:</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedItemForJson.grossAmountBrl)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">REPASSE PARCEIRO:</span>
                  <span className="text-amber-300">
                    {selectedItemForJson.partnerSplitPct}% ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedItemForJson.partnerSplitAmountBrl)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">BASE NFS-E VELATRIX:</span>
                  <span className="text-emerald-400 font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedItemForJson.velatrixRetainedAmountBrl)}
                  </span>
                </div>
              </div>
            </div>

            {/* Raw JSON Code Block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Payload JSON Integral da SEFAZ:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedItemForJson, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedJson ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-72 leading-relaxed">
                {JSON.stringify(selectedItemForJson, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <a
                href={selectedItemForJson.municipalResponse.linkVerificacaoPrefeitura}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Consultar no Portal da Prefeitura</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <button
                onClick={() => setSelectedItemForJson(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* (1.2) MODAL DE SIMULAÇÃO DE GATILHO DE LIQUIDAÇÃO & EMISSÃO */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Simular Liquidação &amp; Disparar NFS-e Autônoma
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Demonstração do gatilho contábil com aplicação da regra de split de parceiro.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
              
              {/* Operation Type Selection */}
              <div>
                <label className="block text-slate-300 font-mono mb-1.5 font-bold">
                  Tipo de Operação &amp; Faturamento:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimForm(prev => ({ ...prev, operationType: 'SAAS_SUBSCRIPTION' }))}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      simForm.operationType === 'SAAS_SUBSCRIPTION'
                        ? 'bg-cyan-950/60 border-cyan-500 text-white ring-1 ring-cyan-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <strong className="block text-xs text-cyan-300">1. Licenciamento SaaS</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Recorrente Mensal • 100% Velatrix • Alíquota ISS 2%
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimForm(prev => ({ ...prev, operationType: 'TAX_RECOVERY_SUCCESS_FEE' }))}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      simForm.operationType === 'TAX_RECOVERY_SUCCESS_FEE'
                        ? 'bg-amber-950/60 border-amber-500 text-white ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <strong className="block text-xs text-amber-300">2. Success Fee Fiscal</strong>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Recuperação Tributária • Com Split Parceiro • ISS 5%
                    </span>
                  </button>
                </div>
              </div>

              {/* Client & CNPJ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Razão Social do Cliente:</label>
                  <input
                    type="text"
                    value={simForm.clientName}
                    onChange={e => setSimForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-mono mb-1">CNPJ do Tomador:</label>
                  <input
                    type="text"
                    value={simForm.cnpj}
                    onChange={e => setSimForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Gross Amount */}
              <div>
                <label className="block text-slate-400 font-mono mb-1">Valor Bruto Liquidado (R$):</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={simForm.grossAmountBrl}
                  onChange={e => setSimForm(prev => ({ ...prev, grossAmountBrl: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Partner Split Options (Visible when TAX_RECOVERY_SUCCESS_FEE) */}
              {simForm.operationType === 'TAX_RECOVERY_SUCCESS_FEE' && (
                <div className="p-3.5 bg-slate-950 rounded-xl border border-amber-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      Regra de Split com Escritório Parceiro:
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {simForm.partnerSplitPct}% Parceiro / {100 - simForm.partnerSplitPct}% Velatrix
                    </span>
                  </div>

                  <div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={simForm.partnerSplitPct}
                      onChange={e => setSimForm(prev => ({ ...prev, partnerSplitPct: Number(e.target.value) }))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>10% (Comissão Básica)</span>
                      <span>40% (Escritório Co-autor)</span>
                      <span>60% (Parceiro Estratégico)</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-mono text-[10px] mb-1">Nome do Escritório Parceiro:</label>
                    <input
                      type="text"
                      value={simForm.partnerName}
                      onChange={e => setSimForm(prev => ({ ...prev, partnerName: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Live Calculation Preview */}
              {(() => {
                const partnerAmt = simForm.operationType === 'TAX_RECOVERY_SUCCESS_FEE'
                  ? (simForm.grossAmountBrl * simForm.partnerSplitPct) / 100
                  : 0;
                const netVelatrix = simForm.grossAmountBrl - partnerAmt;
                const issRate = simForm.operationType === 'SAAS_SUBSCRIPTION' ? 2.0 : 5.0;
                const issAmt = (netVelatrix * issRate) / 100;

                return (
                  <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-1.5 font-mono text-xs">
                    <strong className="text-cyan-300 block text-xs">Prévia do Cálculo de Emissão:</strong>
                    <div className="flex justify-between text-slate-300">
                      <span>Valor Bruto do Cliente:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(simForm.grossAmountBrl)}</span>
                    </div>
                    {partnerAmt > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>(-) Split Parceiro ({simForm.partnerSplitPct}%):</span>
                        <span>-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partnerAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-400 font-bold border-t border-cyan-800/60 pt-1">
                      <span>(=) BASE DE CÁLCULO NFS-E VELATRIX:</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netVelatrix)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>ISS Municipal ({issRate}%):</span>
                      <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(issAmt)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Form Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSimulateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold cursor-pointer shadow-lg shadow-cyan-950/40 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirmar Liquidação &amp; Emitir</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
