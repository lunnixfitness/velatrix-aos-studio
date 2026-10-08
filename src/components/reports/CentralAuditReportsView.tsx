import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileCheck, 
  Search, 
  Filter, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  Building2, 
  Calendar, 
  Eye, 
  Hash, 
  RefreshCw,
  ExternalLink,
  Sparkles,
  Lock,
  ChevronRight
} from 'lucide-react';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { StandardizedAuditReport, StandardizedReportType } from '../../types/standardizedPipeline';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { UnifiedTenantService } from '../../services/unifiedTenantService';

interface CentralAuditReportsViewProps {
  onBackToDashboard?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const CentralAuditReportsView: React.FC<CentralAuditReportsViewProps> = ({
  onBackToDashboard,
  onNavigateToTab
}) => {
  const activeTenant = UnifiedTenantService.getActiveTenant();
  const [reports, setReports] = useState<StandardizedAuditReport[]>(() => CentralAuditReportService.getAllReports(activeTenant?.id));
  const [selectedReport, setSelectedReport] = useState<StandardizedAuditReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Filtros
  const [selectedType, setSelectedType] = useState<StandardizedReportType | 'ALL'>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Assinatura em tempo real de novos laudos
  useEffect(() => {
    const unsubscribe = CentralAuditReportService.subscribe(() => {
      setReports(CentralAuditReportService.getAllReports(activeTenant?.id));
    });
    return () => unsubscribe();
  }, [activeTenant?.id]);

  // Lista de tenants para filtro rápido
  const availableTenants = useMemo(() => {
    const map = new Map<string, { name: string; cnpj: string }>();
    reports.forEach(r => {
      if (!map.has(r.tenantCnpj)) {
        map.set(r.tenantCnpj, { name: r.tenantName, cnpj: r.tenantCnpj });
      }
    });
    return Array.from(map.values());
  }, [reports]);

  // Lista filtrada
  const filteredReports = useMemo(() => {
    return CentralAuditReportService.filterReports({
      reportType: selectedType,
      tenantCnpj: tenantFilter,
      searchQuery: searchQuery
    });
  }, [reports, selectedType, tenantFilter, searchQuery]);

  // Contadores analíticos
  const stats = useMemo(() => {
    const total = reports.length;
    const riskRoi = reports.filter(r => r.reportType === 'risk_roi').length;
    const security = reports.filter(r => r.reportType === 'security_threat').length;
    const fiscal = reports.filter(r => r.reportType === 'fiscal_recovery').length;
    return { total, riskRoi, security, fiscal };
  }, [reports]);

  const handleOpenReport = (report: StandardizedAuditReport) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCopyHash = (hash: string, reportId: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(reportId);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const getReportTypeBadge = (type: StandardizedReportType) => {
    switch (type) {
      case 'risk_roi':
        return {
          label: 'Laudo de Risco & ROI',
          classes: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: TrendingUp
        };
      case 'security_threat':
        return {
          label: 'Laudo de Segurança / Ameaça',
          classes: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: ShieldAlert
        };
      case 'fiscal_recovery':
        return {
          label: 'Laudo Fiscal & Tributário',
          classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: DollarSign
        };
      default:
        return {
          label: 'Laudo de Auditoria',
          classes: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          icon: FileCheck
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300 text-slate-100">
      
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-cyan-950/70 border border-cyan-700/60 text-cyan-300">
              PADRONIZAÇÃO VELATRIX AOS
            </span>
            <span className="text-xs font-mono text-slate-400">
              Esteira & Protocolo Zero-Ficção
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-3">
            <FileCheck className="w-7 h-7 text-cyan-400" />
            Central de Laudos & Auditoria
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">
            Repositório unificado de laudos periciais emitidos por todos os serviços da plataforma (Risco & ROI, CyberSpy, Conectores ERP e Defesa Fiscal). {IS_DEMO_MODE ? 'Em modo demonstração os laudos usam dados ilustrativos e saem marcados como sem validade. ' : "Cada laudo é gerado exclusivamente com dados reais verificados e assinado criptograficamente. "}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('esteiras_laudos_hub')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Executar Esteira / Novo Laudo
            </button>
          )}

          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              ← Voltar ao Painel
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas do Repositório */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Total de Laudos</div>
            <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
            <div className="text-[11px] font-mono text-cyan-400 mt-0.5">Auditados e Assinados</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 text-cyan-400 border border-slate-700">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Risco & ROI</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">{stats.riskRoi}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">Diagnósticos D+0</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Segurança CyberSpy</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{stats.security}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">Ameaças Interceptadas</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase">Fiscais & Tributários</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.fiscal}</div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">PER/DCOMP & Teses</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Busca textual */}
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, Nome da Empresa, Serviço ou Hash..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Filtro por Tenant / Empresa */}
          <div className="min-w-[200px]">
            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="">Todos os Contribuintes / Tenants</option>
              {availableTenants.map(t => (
                <option key={t.cnpj} value={t.cnpj}>
                  {t.name} ({t.cnpj})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Abas / Pílulas de Tipo de Laudo */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tipo de Serviço:
          </span>

          {[
            { id: 'ALL', label: 'Todos os Laudos' },
            { id: 'risk_roi', label: 'Risco & ROI' },
            { id: 'security_threat', label: 'Segurança / CyberSpy' },
            { id: 'fiscal_recovery', label: 'Fiscal / Tributário' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="ml-auto text-xs font-mono text-slate-400">
            Exibindo <strong className="text-white">{filteredReports.length}</strong> laudo(s)
          </span>
        </div>
      </div>

      {/* Tabela / Grid de Laudos */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <FileCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhum laudo encontrado</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Nenhum laudo emitido corresponde aos filtros selecionados. Novos laudos são registrados automaticamente ao concluir diagnósticos ou conter incidentes no CyberSpy.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 font-mono text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">ID do Laudo</th>
                  <th className="py-3.5 px-4">Tipo & Serviço</th>
                  <th className="py-3.5 px-4">Tenant / CNPJ</th>
                  <th className="py-3.5 px-4">Data de Emissão</th>
                  <th className="py-3.5 px-4">Conformidade LGPD</th>
                  <th className="py-3.5 px-4">Hash SHA-256</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredReports.map(report => {
                  const badge = getReportTypeBadge(report.reportType);
                  const Icon = badge.icon;
                  const isCopied = copiedHashId === report.reportId;

                  return (
                    <tr 
                      key={report.reportId}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-cyan-400">
                        {report.reportId}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${badge.classes}`}>
                            <Icon className="w-3 h-3" />
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]" title={report.serviceName}>
                          {report.serviceName}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-white text-xs truncate max-w-[180px]" title={report.tenantName}>
                          {report.tenantName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {report.tenantCnpj}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{report.issuedAtFormatted}</div>
                        <div className="text-[10px] text-slate-500">
                          {report.signer.signatureType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 100% Conforme
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] truncate max-w-[120px]" title={report.auditHash}>
                            {report.auditHash.slice(0, 16)}...
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(report.auditHash, report.reportId)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                            title="Copiar Hash Completo"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReport(report)}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Laudo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal do Laudo Padronizado */}
      <StandardizedAuditReportModal
        report={selectedReport}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReport(null);
        }}
      />

    </div>
  );
};
