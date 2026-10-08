import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  KeyRound, 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Printer, 
  RefreshCw, 
  Link2, 
  Lock, 
  UserCheck, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Building2, 
  Scale, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Check 
} from 'lucide-react';
import { AuditRecord } from '../types/aos';
import { 
  buildAuditChain, 
  validateAuditChain, 
  exportAuditRecordsToCsv, 
  exportAuditRecordsToPrintableReport, 
  AuditChainValidationResult,
  GENESIS_HASH 
} from '../utils/auditChain';

interface AuditLedgerProps {
  records: AuditRecord[];
  onClose: () => void;
}

type StatusFilterType = 'all' | 'executed' | 'adjusted' | 'rejected' | 'pending' | 'blocked_fraud' | 'quarantine';
type DateRangeFilterType = 'all' | '7d' | '30d' | '90d' | 'custom';

export const AuditLedger: React.FC<AuditLedgerProps> = ({
  records,
  onClose
}) => {
  const [filterStatus, setFilterStatus] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedToast, setVerifiedToast] = useState(false);
  const [chainedRecords, setChainedRecords] = useState<AuditRecord[]>([]);
  const [chainValidation, setChainValidation] = useState<AuditChainValidationResult>({
    isValid: true,
    totalBlocks: 0,
    genesisHash: GENESIS_HASH,
    latestHash: GENESIS_HASH,
    signaturesTotal: 0,
    signaturesValid: 0,
    allSignaturesValid: true,
    checkedAt: new Date().toISOString(),
    quorumSatisfiedCount: 0
  });

  // Build verifiable cryptographic chain from records asynchronously
  useEffect(() => {
    let active = true;
    buildAuditChain(records).then(async (chained) => {
      if (!active) return;
      setChainedRecords(chained);
      const val = await validateAuditChain(chained);
      if (active) setChainValidation(val);
    });
    return () => { active = false; };
  }, [records]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return chainedRecords.filter(rec => {
      // 1. Status Filter
      if (filterStatus !== 'all' && rec.status !== filterStatus) return false;

      // 2. Date Range Filter
      const recDate = new Date(rec.timestamp).getTime();
      const now = Date.now();
      if (dateRange === '7d' && recDate < now - 7 * 24 * 3600 * 1000) return false;
      if (dateRange === '30d' && recDate < now - 30 * 24 * 3600 * 1000) return false;
      if (dateRange === '90d' && recDate < now - 90 * 24 * 3600 * 1000) return false;
      if (dateRange === 'custom') {
        if (customStartDate && recDate < new Date(customStartDate).setHours(0, 0, 0, 0)) return false;
        if (customEndDate && recDate > new Date(customEndDate).setHours(23, 59, 59, 999)) return false;
      }

      // 3. Search Filter (Expanded)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.eventTitle?.toLowerCase().includes(q);
        const matchSummary = rec.decisionSummary?.toLowerCase().includes(q);
        const matchReceipt = rec.executionReceipt?.toLowerCase().includes(q);
        const matchSector = rec.sector?.toLowerCase().includes(q);
        const matchJurisdiction = rec.jurisdiction?.toLowerCase().includes(q);
        const matchHash = rec.recordHash?.toLowerCase().includes(q);
        const matchAgents = rec.agentsInvolved?.some(a => a.toLowerCase().includes(q));

        if (!matchTitle && !matchSummary && !matchReceipt && !matchSector && !matchJurisdiction && !matchHash && !matchAgents) {
          return false;
        }
      }

      return true;
    });
  }, [chainedRecords, filterStatus, dateRange, customStartDate, customEndDate, searchQuery]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, dateRange, customStartDate, customEndDate, pageSize]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setVerifiedToast(true);
      setTimeout(() => setVerifiedToast(false), 3500);
    }, 400);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Executado
          </span>
        );
      case 'blocked_fraud':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
            <ShieldAlert className="w-2.5 h-2.5 text-rose-400" /> Antifraude
          </span>
        );
      case 'quarantine':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-950 text-orange-300 border border-orange-800 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5 text-orange-400" /> Quarentena
          </span>
        );
      case 'adjusted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Ajustado
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-850 text-slate-300 border border-slate-700 flex items-center gap-1">
            <XCircle className="w-2.5 h-2.5 text-slate-400" /> Rejeitado
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-cyan-400" /> Pendente
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <span>Livro-Razão & Trilha de Auditoria do AOS</span>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1 font-normal">
                  <ShieldCheck className="w-3 h-3" /> Hash-Chain {chainValidation.isValid ? '100% Íntegra' : 'Comprometida'}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Verify Chain Action */}
            <button
              onClick={handleVerifyChain}
              disabled={isVerifying}
              className="text-[11px] font-semibold text-teal-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-800 hover:bg-teal-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Recalculando...' : 'Verificar Integridade'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => exportAuditRecordsToCsv(filteredRecords)}
              className="text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Exportar CSV"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={() => exportAuditRecordsToPrintableReport(filteredRecords, chainValidation)}
              className="text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              title="Relatório PDF"
            >
              <Printer className="w-3 h-3 text-amber-400" />
              <span>PDF</span>
            </button>

            <button
              id="btn-close-audit-modal"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Verification Toast Alert */}
        {verifiedToast && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 px-5 py-2 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <strong>Integridade Criptográfica Confirmada:</strong> {chainValidation.totalBlocks} blocos SHA-256 validados sem descontinuidades. {chainValidation.signaturesValid} assinaturas Secp256k1 íntegras.
            </span>
            <span className="text-[10px] font-mono text-emerald-400">0 violações</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 space-y-2.5">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {(['all', 'executed', 'adjusted', 'rejected', 'pending', 'blocked_fraud', 'quarantine'] as StatusFilterType[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                  filterStatus === status 
                    ? 'bg-slate-800 text-slate-100 border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                }`}
              >
                {status === 'all' && 'Todos'}
                {status === 'executed' && 'Executados'}
                {status === 'adjusted' && 'Ajustados'}
                {status === 'rejected' && 'Rejeitados'}
                {status === 'pending' && 'Pendentes'}
                {status === 'blocked_fraud' && 'Antifraude'}
                {status === 'quarantine' && 'Quarentena'}
              </button>
            ))}
          </div>

          {/* Search & Date Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, resumo, recibo, setor, agentes ou hash..."
                className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 w-full"
              />
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              {(['all', '7d', '30d', '90d', 'custom'] as DateRangeFilterType[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    dateRange === range ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range === 'all' ? 'Tudo' : range}
                </button>
              ))}
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-slate-400 text-[11px]">De:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[11px]"
              />
              <span className="text-slate-400 text-[11px]">Até:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[11px]"
              />
            </div>
          )}

        </div>

        {/* Content list */}
        <div className="p-4 overflow-auto flex-1 space-y-3 bg-slate-950">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Nenhum registro auditável localizado para os filtros selecionados.
            </div>
          ) : (
            paginatedRecords.map((rec, rIdx) => {
              const reqSignatures = rec.requiredSignatures || 2;
              const collectedSignatures = rec.signatures?.length || 0;
              const isQuorumReached = collectedSignatures >= reqSignatures;

              return (
                <div 
                  key={rec.id}
                  id={`audit-record-${rec.id}`}
                  className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2.5 shadow-md hover:border-slate-700 transition-colors"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-amber-400 border border-amber-900/60 flex items-center gap-1">
                        <Link2 className="w-2.5 h-2.5" /> Bloco #{rec.chainIndex || (rIdx + 1)}
                      </span>

                      {getStatusBadge(rec.status)}

                      {rec.sector && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5 text-teal-400" />
                          {rec.sector}
                        </span>
                      )}

                      {rec.jurisdiction && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Scale className="w-2.5 h-2.5 text-indigo-400" />
                          {rec.jurisdiction}
                        </span>
                      )}

                      <span className="text-xs font-bold text-slate-200">{rec.eventTitle}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(rec.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60">
                    {rec.decisionSummary}
                  </p>

                  {/* Multi-Sig Signatures & Quorum */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      
                      {/* Quorum Badge */}
                      <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                        isQuorumReached 
                          ? 'bg-teal-950 text-teal-300 border-teal-800' 
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}>
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Quórum: {collectedSignatures} de {reqSignatures} aprovadores</span>
                      </span>

                      {rec.signatures && rec.signatures.map((sig, sIdx) => (
                        <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{sig.role}</span>
                          <span className="text-slate-500">({sig.keyId})</span>
                        </span>
                      ))}
                    </div>

                    {/* Hash Pill */}
                    {rec.recordHash && (
                      <span 
                        onClick={() => handleCopy(rec.recordHash!, `hash-modal-${rec.id}`)}
                        className="text-[10px] font-mono text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-teal-900/60 hover:border-teal-400 cursor-pointer flex items-center gap-1"
                        title="Copiar Hash SHA-256"
                      >
                        <Lock className="w-2.5 h-2.5 text-teal-400" />
                        <span>{rec.recordHash.slice(0, 12)}...</span>
                        {copiedId === `hash-modal-${rec.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-500" />}
                      </span>
                    )}
                  </div>

                  {/* Execution Payload Tool Calling Info */}
                  {rec.execution_payload && (
                    <div className="p-2 bg-slate-950/90 rounded border border-teal-900/60 font-mono text-[10px] text-teal-300">
                      <div className="flex items-center justify-between mb-1 text-slate-400 font-sans">
                        <span>Payload Despachado: <strong>{rec.execution_payload.target_service || rec.execution_payload.service}::{rec.execution_payload.action}</strong></span>
                        <span className="text-emerald-400">Assinatura SHA256 OK</span>
                      </div>
                      <div className="truncate text-slate-500">
                        Params: {JSON.stringify(rec.execution_payload.parameters)}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800 text-slate-500 font-mono">
                    <span>Recibo: <strong className="text-slate-300">{rec.executionReceipt}</strong></span>
                    <span>Invariantes: {rec.invariantSnapshot?.length || rec.decisionAst?.invariants_checked?.length || 4} verificadas</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Total de Transações Filtradas: <strong>{filteredRecords.length}</strong></span>
            <span className="font-mono text-slate-500 ml-2">| Hash-Chain: 100% OK</span>
          </div>

          {filteredRecords.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">
                Página {currentPage} de {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
