import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import {
  OfficeEmployee,
  MonthlyPayrollHistory,
  EmployeePayrollRecord,
  PayrollPaymentStatus,
  INITIAL_MOCK_PAYROLL_HISTORIES
} from '../../data/mockOfficeData';
import { secureId, secureInt } from '../../lib/demoMode';

interface EmployeePayrollDashboardProps {
  currentRole: string; // e.g. 'hr' | 'accounting' | 'general_manager' | etc.
  isSuperAdmin?: boolean;
  employees: OfficeEmployee[];
  onRecordAudit?: (author: string, roleName: string, actionType: string, summary: string, details?: string) => void;
  onSwitchRole?: (roleId: string) => void;
}

export const EmployeePayrollDashboard: React.FC<EmployeePayrollDashboardProps> = ({
  currentRole,
  isSuperAdmin = false,
  employees,
  onRecordAudit,
  onSwitchRole
}) => {
  // RLS Access check: ONLY RH ('hr') and Contador ('accounting'), or SuperAdmin
  const isAuthorizedRole = currentRole === 'hr' || currentRole === 'accounting' || isSuperAdmin;

  // Local state for payroll histories (allows simulated status updates like marking as Paid)
  const [payrollHistories, setPayrollHistories] = useState<MonthlyPayrollHistory[]>(INITIAL_MOCK_PAYROLL_HISTORIES);
  const [selectedMonth, setSelectedMonth] = useState<string>('09/2026');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PayrollPaymentStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'current_payroll' | 'history'>('current_payroll');

  // Privacy masking state (matching existing office RLS logic)
  const [isPrivacyMaskActive, setIsPrivacyMaskActive] = useState<boolean>(false);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  // Modal for simulated payment receipt
  const [selectedReceipt, setSelectedReceipt] = useState<EmployeePayrollRecord | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected payroll month data
  const currentMonthData = useMemo(() => {
    return payrollHistories.find(h => h.competencyMonth === selectedMonth) || payrollHistories[0];
  }, [payrollHistories, selectedMonth]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (!currentMonthData) return [];
    return currentMonthData.records.filter(rec => {
      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        rec.employeeName.toLowerCase().includes(q) ||
        rec.roleTitle.toLowerCase().includes(q) ||
        rec.department.toLowerCase().includes(q) ||
        rec.paymentMethod.toLowerCase().includes(q) ||
        (rec.pixKey && rec.pixKey.toLowerCase().includes(q)) ||
        rec.bankName.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [currentMonthData, statusFilter, searchQuery]);

  // Dynamic metrics for the selected month
  const metrics = useMemo(() => {
    if (!currentMonthData) {
      return {
        totalPayroll: 0,
        paidCount: 0,
        paidTotal: 0,
        pendingCount: 0,
        pendingTotal: 0,
        scheduledCount: 0,
        scheduledTotal: 0,
        totalEmployees: 0,
        paidPercentage: 0
      };
    }
    const totalPayroll = currentMonthData.records.reduce((acc, r) => acc + r.netAmountBrl, 0);
    const paidRecords = currentMonthData.records.filter(r => r.status === 'Pago');
    const pendingRecords = currentMonthData.records.filter(r => r.status === 'Pendente');
    const scheduledRecords = currentMonthData.records.filter(r => r.status === 'Agendado');

    const paidTotal = paidRecords.reduce((acc, r) => acc + r.netAmountBrl, 0);
    const pendingTotal = pendingRecords.reduce((acc, r) => acc + r.netAmountBrl, 0);
    const scheduledTotal = scheduledRecords.reduce((acc, r) => acc + r.netAmountBrl, 0);

    const paidPercentage = currentMonthData.records.length > 0
      ? Math.round((paidRecords.length / currentMonthData.records.length) * 100)
      : 0;

    return {
      totalPayroll,
      paidCount: paidRecords.length,
      paidTotal,
      pendingCount: pendingRecords.length,
      pendingTotal,
      scheduledCount: scheduledRecords.length,
      scheduledTotal,
      totalEmployees: currentMonthData.records.length,
      paidPercentage
    };
  }, [currentMonthData]);

  // Action: Copy PIX key
  const handleCopyPix = (key: string, id: string) => {
    if (!key) return;
    navigator.clipboard?.writeText(key);
    setCopiedPixId(id);
    showToast(`Chave PIX copiada para a área de transferência.`);
    setTimeout(() => setCopiedPixId(null), 2000);
  };

  // Action: Mark single employee as Paid (simulated instant settlement)
  const handleSettlePayment = (recordId: string) => {
    setPayrollHistories(prev => prev.map(monthItem => {
      if (monthItem.competencyMonth !== selectedMonth) return monthItem;
      const updatedRecords = monthItem.records.map(rec => {
        if (rec.id === recordId) {
          const now = new Date();
          const day = String(now.getDate()).padStart(2, '0');
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const year = now.getFullYear();
          const todayFormatted = `${day}/${month}/${year}`;
          const mockPixTxId = `E${secureInt(10000000000000000000000000, 1e+26)}`;
          const mockReceiptHash = `0x${secureId('', 8)}${secureId('', 8)}`;

          return {
            ...rec,
            status: 'Pago' as PayrollPaymentStatus,
            actualPaymentDate: todayFormatted,
            pixTransactionId: mockPixTxId,
            receiptHash: mockReceiptHash
          };
        }
        return rec;
      });

      const newPaidCount = updatedRecords.filter(r => r.status === 'Pago').length;
      const newPendingCount = updatedRecords.filter(r => r.status === 'Pendente').length;
      const newScheduledCount = updatedRecords.filter(r => r.status === 'Agendado').length;

      return {
        ...monthItem,
        records: updatedRecords,
        paidEmployeesCount: newPaidCount,
        pendingEmployeesCount: newPendingCount,
        scheduledEmployeesCount: newScheduledCount,
        status: newPendingCount === 0 && newScheduledCount === 0 ? 'Fechado & Homologado' : 'Parcialmente Pago'
      };
    }));

    const targetRec = currentMonthData.records.find(r => r.id === recordId);
    if (targetRec && onRecordAudit) {
      onRecordAudit(
        currentRole === 'accounting' ? 'Marcos Valério' : 'Beatriz Vasconcelos',
        currentRole === 'accounting' ? 'Contador' : 'RH',
        'PAYROLL_PAYMENT_SETTLED',
        `Liquidação de pagamento: ${targetRec.employeeName}`,
        `Pagamento de R$ ${targetRec.netAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liquidado via ${targetRec.paymentMethod} para o colaborador ${targetRec.employeeName} (${targetRec.roleTitle}).`
      );
    }

    showToast(`Pagamento de ${targetRec?.employeeName || 'colaborador'} liquidado com sucesso.`);
  };

  // Action: Settle all pending/scheduled payments for this month
  const handleSettleAll = () => {
    setPayrollHistories(prev => prev.map(monthItem => {
      if (monthItem.competencyMonth !== selectedMonth) return monthItem;
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const todayFormatted = `${day}/${month}/${year}`;

      const updatedRecords = monthItem.records.map(rec => {
        if (rec.status !== 'Pago') {
          const mockPixTxId = `E${secureInt(10000000000000000000000000, 1e+26)}`;
          const mockReceiptHash = `0x${secureId('', 8)}${secureId('', 8)}`;
          return {
            ...rec,
            status: 'Pago' as PayrollPaymentStatus,
            actualPaymentDate: todayFormatted,
            pixTransactionId: mockPixTxId,
            receiptHash: mockReceiptHash
          };
        }
        return rec;
      });

      return {
        ...monthItem,
        records: updatedRecords,
        paidEmployeesCount: updatedRecords.length,
        pendingEmployeesCount: 0,
        scheduledEmployeesCount: 0,
        status: 'Fechado & Homologado',
        closingDate: todayFormatted
      };
    }));

    if (onRecordAudit) {
      onRecordAudit(
        currentRole === 'accounting' ? 'Marcos Valério' : 'Beatriz Vasconcelos',
        currentRole === 'accounting' ? 'Contador' : 'RH',
        'PAYROLL_BATCH_SETTLED',
        `Liquidação total de lote da competência ${selectedMonth}`,
        `Lote integral da folha de pagamento da competência ${selectedMonth} processado com sucesso. Todos os colaboradores marcados como homologados e pagos.`
      );
    }

    showToast(`Lote completo da competência ${selectedMonth} liquidado com sucesso!`);
  };

  // Action: Export CNAB 240 / PIX batch file
  const handleExportCnab = () => {
    if (onRecordAudit) {
      onRecordAudit(
        currentRole === 'accounting' ? 'Marcos Valério' : 'Beatriz Vasconcelos',
        currentRole === 'accounting' ? 'Contador' : 'RH',
        'PAYROLL_CNAB_EXPORTED',
        `Exportação de Remessa Bancária CNAB 240 / Lote PIX (${selectedMonth})`,
        `Arquivo de remessa gerado com ${currentMonthData.records.length} registros contábeis no total de R$ ${metrics.totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      );
    }
    showToast(`Arquivo de remessa CNAB 240 / Lote PIX da competência ${selectedMonth} exportado para conciliação contábil.`);
  };

  // RLS DENIAL: If role is not RH and not Contador
  if (!isAuthorizedRole) {
    return (
      <div id="payroll-dashboard-rls-denied" className="p-6 md:p-8 bg-[var(--vx-deep)] border border-amber-900/40 rounded-2xl shadow-2xl space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 uppercase font-bold">
                BLINDAGEM DE SIGILO &amp; RLS ATIVA
              </span>
              <span className="text-[10px] font-mono text-slate-400">LGPD Art. 7º &amp; 11</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 font-mono">
              Acesso Restrito: Dashboard de Pagamentos dos Colaboradores
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl">
              As informações de folha de pagamento, remunerações nominais, dados bancários de colaboradores e liquidações financeiras são estritamente sigilosas. Por política de governança corporativa e segurança da informação da Velatrix, este módulo é liberado com visibilidade integral exclusivamente para os papéis de <strong className="text-amber-300">RH (Recursos Humanos)</strong> e <strong className="text-amber-300">Contador</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-300 space-y-0.5">
            <div className="font-semibold text-slate-200">Seu papel atual no escritório:</div>
            <div className="font-mono text-cyan-400 uppercase font-bold">
              {currentRole}
            </div>
            <div className="text-[11px] text-slate-500">
              Para validar o funcionamento deste dashboard, você pode alternar para o papel de RH ou Contador abaixo.
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSwitchRole && (
              <>
                <button
                  id="btn-switch-role-hr"
                  onClick={() => onSwitchRole('hr')}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/50 transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Alternar para RH</span>
                </button>
                <button
                  id="btn-switch-role-accounting"
                  onClick={() => onSwitchRole('accounting')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800/60 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Landmark className="w-4 h-4" />
                  <span>Alternar para Contador</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="payroll-dashboard-container" className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 text-cyan-200 border border-cyan-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-mono animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER WITH CONTROLS & RLS BADGE */}
      <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              RLS AUTORIZADO · {currentRole === 'accounting' ? 'CONTADOR' : 'RECURSOS HUMANOS (RH)'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800">
              Competência: <strong className="text-cyan-300">{currentMonthData.competencyLabel}</strong>
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
            <Landmark className="w-5 h-5 text-cyan-400" />
            Dashboard de Pagamentos dos Colaboradores
          </h1>
          <p className="text-xs text-slate-400 max-w-3xl">
            Gestão consolidada da folha de pagamento, conciliação de remunerações nominais, dados bancários e liquidações via PIX / Transferência bancária com blindagem de sigilo RLS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          {/* Privacy Mask Toggle */}
          <button
            id="btn-toggle-privacy-mask"
            onClick={() => {
              setIsPrivacyMaskActive(!isPrivacyMaskActive);
              showToast(isPrivacyMaskActive ? 'Máscara desativada: Valores visíveis.' : 'Máscara ativada: Dados nominais ocultos para demonstração.');
            }}
            className={`px-3 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-all ${
              isPrivacyMaskActive
                ? 'bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/50'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Ocultar valores e contas para apresentação pública ou auditoria"
          >
            {isPrivacyMaskActive ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            <span>{isPrivacyMaskActive ? 'Máscara LGPD Ativa' : 'Ocultar Valores'}</span>
          </button>

          {/* Export CNAB */}
          <button
            id="btn-export-cnab"
            onClick={handleExportCnab}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Remessa CNAB / PIX</span>
          </button>

          {/* Settle All (if not all paid) */}
          {metrics.pendingCount > 0 || metrics.scheduledCount > 0 ? (
            <button
              id="btn-settle-all-batch"
              onClick={handleSettleAll}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/40 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Liquidar Lote Pendente</span>
            </button>
          ) : (
            <span className="px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Lote 100% Homologado</span>
            </span>
          )}
        </div>
      </div>

      {/* RLS SECURITY BANNER */}
      <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="text-slate-300">
            <strong className="text-cyan-300">Blindagem de Sigilo &amp; RLS Homologada:</strong> Os dados nominais de salários e credenciais PIX estão abertos para você com base no papel{' '}
            <strong className="text-white uppercase font-mono">{currentRole === 'accounting' ? 'Contador' : 'RH'}</strong> para viabilizar os pagamentos contratuais e repasses eSocial.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-900/40 border border-cyan-700 text-cyan-200 font-bold">
            Auditoria Ativa
          </span>
        </div>
      </div>

      {/* (1) SUMMARY KPI CARDS (Resumo com cards de indicadores) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total da Folha do Mês */}
        <div id="kpi-card-total-payroll" className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium">Total da Folha do Mês</span>
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-slate-100">
              {isPrivacyMaskActive
                ? 'R$ ••••••••'
                : `R$ ${metrics.totalPayroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>{currentMonthData.records.length} colaboradores na competência</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
            Competência: {currentMonthData.competencyMonth}
          </div>
        </div>

        {/* Card 2: Colaboradores Pagos */}
        <div id="kpi-card-paid-employees" className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium">Colaboradores Pagos</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {metrics.paidCount} <span className="text-xs text-slate-400 font-normal">de {metrics.totalEmployees} ({metrics.paidPercentage}%)</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Liquidado:{' '}
              <strong className="text-slate-200 font-mono">
                {isPrivacyMaskActive
                  ? 'R$ ••••••••'
                  : `R$ ${metrics.paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </strong>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.paidPercentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Pagamentos Pendentes / Agendados */}
        <div id="kpi-card-pending-payments" className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium">Pagamentos Pendentes</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {metrics.pendingCount + metrics.scheduledCount}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({metrics.scheduledCount} agendados, {metrics.pendingCount} pendente)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              A liquidar:{' '}
              <strong className="text-slate-200 font-mono">
                {isPrivacyMaskActive
                  ? 'R$ ••••••••'
                  : `R$ ${(metrics.pendingTotal + metrics.scheduledTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              </strong>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
            {metrics.pendingCount > 0 ? 'Aguardando liberação de lote' : 'Nenhum pendente crítico'}
          </div>
        </div>

        {/* Card 4: Próxima Data de Pagamento */}
        <div id="kpi-card-next-date" className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono font-medium">Próxima Data de Pagamento</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {currentMonthData.nextScheduledDate}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              5º dia útil do mês subsequente
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
            {currentMonthData.isCurrentMonth ? 'Ciclo vigente em andamento' : 'Competência consolidada'}
          </div>
        </div>
      </div>

      {/* VIEW SWITCHER & COMPETENCY SELECTION TOOLBAR */}
      <div className="bg-[var(--vx-deep)] p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Main Tabs Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-current-payroll"
            onClick={() => setActiveTab('current_payroll')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'current_payroll'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Tabela da Competência</span>
          </button>
          <button
            id="tab-payroll-history"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>(3) Histórico dos Últimos Meses</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-cyan-300 border border-slate-800">
              {payrollHistories.length}
            </span>
          </button>
        </div>

        {/* Competency Dropdown Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-400">Competência:</span>
          <select
            id="select-competency-month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            {payrollHistories.map(h => (
              <option key={h.competencyMonth} value={h.competencyMonth}>
                {h.competencyLabel} {h.isCurrentMonth ? '⭐' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* (2) VIEW 1: TABELA POR COLABORADOR */}
      {activeTab === 'current_payroll' && (
        <div id="payroll-table-section" className="space-y-3">
          {/* Table Filters & Search */}
          <div className="bg-[var(--vx-deep)] p-3 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-payroll-employees"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por colaborador, cargo, banco ou chave PIX..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Status:
              </span>
              <button
                id="filter-status-all"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({currentMonthData.records.length})
              </button>
              <button
                id="filter-status-pago"
                onClick={() => setStatusFilter('Pago')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all ${
                  statusFilter === 'Pago'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pagos ({metrics.paidCount})
              </button>
              <button
                id="filter-status-agendado"
                onClick={() => setStatusFilter('Agendado')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all ${
                  statusFilter === 'Agendado'
                    ? 'bg-blue-950 text-blue-300 border border-blue-700 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Agendados ({metrics.scheduledCount})
              </button>
              <button
                id="filter-status-pendente"
                onClick={() => setStatusFilter('Pendente')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium cursor-pointer transition-all ${
                  statusFilter === 'Pendente'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                Pendentes ({metrics.pendingCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[var(--vx-deep)] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[11px] font-mono uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Colaborador</th>
                    <th scope="col" className="px-4 py-3.5">Cargo / Departamento</th>
                    <th scope="col" className="px-4 py-3.5">Salário / Valor Líquido</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-4 py-3.5">Data do Pagamento</th>
                    <th scope="col" className="px-4 py-3.5">Método &amp; Dados Bancários</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map(record => {
                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-900/40 transition-colors font-mono"
                        >
                          {/* Colaborador */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-800/80 text-cyan-300 flex items-center justify-center font-bold text-xs shrink-0">
                                {record.employeeName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <div className="font-bold text-slate-100 font-sans">{record.employeeName}</div>
                                <div className="text-[10px] text-slate-500">{record.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Cargo & Departamento */}
                          <td className="px-4 py-3.5">
                            <div className="text-slate-200 font-sans">{record.roleTitle}</div>
                            <div className="text-[10px] text-slate-500">{record.department}</div>
                          </td>

                          {/* Salário / Valor Líquido */}
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-100 text-sm">
                              {isPrivacyMaskActive
                                ? 'R$ ••••••••'
                                : `R$ ${record.netAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            </div>
                            <div className="text-[10px] text-emerald-400">
                              Líquido Homologado
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            {record.status === 'Pago' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                Pago
                              </span>
                            )}
                            {record.status === 'Agendado' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700">
                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                Agendado
                              </span>
                            )}
                            {record.status === 'Pendente' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                Pendente
                              </span>
                            )}
                          </td>

                          {/* Data do Pagamento */}
                          <td className="px-4 py-3.5">
                            {record.status === 'Pago' ? (
                              <div>
                                <div className="text-slate-200 font-bold">{record.actualPaymentDate}</div>
                                <div className="text-[10px] text-slate-500">Efetivado</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-amber-300/90">{record.scheduledPaymentDate}</div>
                                <div className="text-[10px] text-slate-500">Data Prevista</div>
                              </div>
                            )}
                          </td>

                          {/* Método & Dados Bancários */}
                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                record.paymentMethod === 'PIX'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              }`}>
                                {record.paymentMethod}
                              </span>
                              <span className="text-[11px] text-slate-300 truncate font-sans">
                                {record.bankName}
                              </span>
                            </div>

                            {/* Bank details & PIX */}
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                              {isPrivacyMaskActive ? (
                                <span>•••••• · ••••••</span>
                              ) : (
                                <>
                                  <span>{record.accountDetails}</span>
                                  {record.pixKey && (
                                    <button
                                      id={`btn-copy-pix-${record.id}`}
                                      onClick={() => handleCopyPix(record.pixKey || '', record.id)}
                                      className="ml-1 text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 cursor-pointer"
                                      title="Copiar Chave PIX"
                                    >
                                      {copiedPixId === record.id ? (
                                        <Check className="w-3 h-3 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                      <span className="text-[9px]">PIX</span>
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          {/* Ações */}
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {record.status === 'Pago' ? (
                                <button
                                  id={`btn-view-receipt-${record.id}`}
                                  onClick={() => setSelectedReceipt(record)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                                  title="Visualizar comprovante de pagamento"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Recibo</span>
                                </button>
                              ) : (
                                <button
                                  id={`btn-settle-${record.id}`}
                                  onClick={() => handleSettlePayment(record.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-md shadow-cyan-950/40 transition-all"
                                  title="Marcar como pago e emitir comprovante simulado"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Liquidar</span>
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
        </div>
      )}

      {/* (3) VIEW 2: HISTÓRICO DE PAGAMENTOS DOS ÚLTIMOS MESES PARA CONFERÊNCIA */}
      {activeTab === 'history' && (
        <div id="payroll-history-section" className="space-y-4">
          <div className="bg-[var(--vx-deep)] p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Histórico Consolidado de Folhas de Pagamento (Conferência &amp; Auditoria)
              </h2>
              <p className="text-xs text-slate-400">
                Registro de liquidações anteriores com protocolo eSocial, hash SEFIP de homologação fiscal e conferência contábil.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-lg">
              {payrollHistories.length} competências registradas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollHistories.map((historyItem) => {
              const isSelected = selectedMonth === historyItem.competencyMonth;
              return (
                <div
                  key={historyItem.competencyMonth}
                  id={`history-card-${historyItem.competencyMonth.replace('/', '-')}`}
                  className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                    isSelected
                      ? 'bg-[var(--vx-deep)] border-cyan-600/80 shadow-xl shadow-cyan-950/30'
                      : 'bg-[var(--vx-deep)] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-slate-100">
                          {historyItem.competencyLabel}
                        </span>
                        {historyItem.isCurrentMonth && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                            Vigente
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Competência Fiscal: <strong className="font-mono text-slate-300">{historyItem.competencyMonth}</strong>
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      historyItem.status === 'Fechado & Homologado'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                        : 'bg-amber-950 text-amber-300 border border-amber-700'
                    }`}>
                      {historyItem.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-500 block">Total Folha</span>
                      <strong className="text-xs sm:text-sm font-mono text-slate-200">
                        {isPrivacyMaskActive
                          ? 'R$ ••••••••'
                          : `R$ ${historyItem.totalPayrollBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-500 block">Colaboradores</span>
                      <strong className="text-xs sm:text-sm font-mono text-emerald-400">
                        {historyItem.paidEmployeesCount} / {historyItem.totalEmployees} pagos
                      </strong>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-mono text-slate-500 block">Data Liquidação</span>
                      <strong className="text-xs font-mono text-slate-300">
                        {historyItem.closingDate || historyItem.nextScheduledDate}
                      </strong>
                    </div>
                  </div>

                  {/* Fiscal & eSocial Protocols */}
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/60 text-[10px] font-mono space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Protocolo eSocial:</span>
                      <span className="text-cyan-300 font-bold">{historyItem.eSocialProtocol || 'Pendente'}</span>
                    </div>
                    {historyItem.sefipHash && (
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Hash Cripto SEFIP:</span>
                        <span className="text-slate-400 truncate max-w-[170px]" title={historyItem.sefipHash}>
                          {historyItem.sefipHash.substring(0, 16)}...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      id={`btn-inspect-month-${historyItem.competencyMonth.replace('/', '-')}`}
                      onClick={() => {
                        setSelectedMonth(historyItem.competencyMonth);
                        setActiveTab('current_payroll');
                        showToast(`Carregada competência ${historyItem.competencyLabel}.`);
                      }}
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Inspecionar Tabela Deste Mês</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        showToast(`Relatório da folha ${historyItem.competencyMonth} gerado em formato PDF/CSV.`);
                      }}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 cursor-pointer"
                      title="Baixar espelho da folha"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECEIPT MODAL (Comprovante Simulado de Pagamento) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--vx-deep)] border border-cyan-800/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-cyan-950/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Comprovante de Pagamento de Remuneração
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Autenticação Bancária &amp; Quitação Homologada
                  </div>
                </div>
              </div>
              <button
                id="btn-close-receipt-modal"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Body */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-400 text-[11px] pb-2 border-b border-slate-800/80">
                <span>EMISSOR:</span>
                <strong className="text-slate-200">VELATRIX SOLUÇÕES TRIBUTÁRIAS S/A</strong>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>CNPJ Emissor:</span>
                <span className="text-slate-200">42.819.004/0001-92</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>FAVORECIDO:</span>
                <strong className="text-cyan-300 font-sans">{selectedReceipt.employeeName}</strong>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Cargo / Função:</span>
                <span className="text-slate-300">{selectedReceipt.roleTitle}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Método de Liquidação:</span>
                <span className="text-emerald-400 font-bold">{selectedReceipt.paymentMethod}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Instituição Destino:</span>
                <span className="text-slate-300">{selectedReceipt.bankName}</span>
              </div>

              {selectedReceipt.pixKey && (
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Chave PIX:</span>
                  <span className="text-slate-300">{selectedReceipt.pixKey}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Data da Efetivação:</span>
                <span className="text-slate-200">{selectedReceipt.actualPaymentDate || selectedReceipt.scheduledPaymentDate}</span>
              </div>

              {selectedReceipt.pixTransactionId && (
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>ID Transação (EndToEnd):</span>
                  <span className="text-slate-400 truncate max-w-[180px]">{selectedReceipt.pixTransactionId}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs text-slate-300 font-bold">VALOR LIQUIDADO:</span>
                <span className="text-base font-bold text-emerald-400 font-mono">
                  R$ {selectedReceipt.netAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {selectedReceipt.receiptHash && (
                <div className="pt-2 border-t border-slate-800/80 text-[9px] text-slate-500 break-all">
                  Hash de Autenticação Criptográfica: {selectedReceipt.receiptHash}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  window.print?.();
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
