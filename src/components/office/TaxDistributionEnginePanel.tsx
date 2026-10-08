import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Briefcase, 
  Receipt, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Plus, 
  CheckCircle2, 
  SlidersHorizontal, 
  ShieldCheck, 
  ArrowRightLeft, 
  Eye, 
  Check, 
  X,
  RefreshCw,
  Scale
} from 'lucide-react';
import { 
  TaxProfessional, 
  ProspectLead, 
  ProfessionalRole, 
  ProfessionalStatus,
  OfficeInternalAuditEntry,
  OfficeRole
} from '../../data/mockOfficeData';
import { 
  calculateTeamLoadSummary, 
  distributeWaitingQueue 
} from '../../services/leadDistributionEngine';

interface TaxDistributionEnginePanelProps {
  taxProfessionals: TaxProfessional[];
  prospects: ProspectLead[];
  onUpdateProfessionals: (updated: TaxProfessional[]) => void;
  onUpdateProspects: (updated: ProspectLead[]) => void;
  onRecordAuditLog: (
    employeeName: string,
    employeeRole: string,
    actionType: OfficeInternalAuditEntry['actionType'],
    actionSummary: string,
    details: string
  ) => void;
  onOpenReassignModal: (lead: ProspectLead) => void;
  currentUserRole: OfficeRole;
}

export const TaxDistributionEnginePanel: React.FC<TaxDistributionEnginePanelProps> = ({
  taxProfessionals,
  prospects,
  onUpdateProfessionals,
  onUpdateProspects,
  onRecordAuditLog,
  onOpenReassignModal,
  currentUserRole
}) => {
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Advogado' | 'Contador'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Disponível' | 'Ocupado' | 'Ausente'>('ALL');
  const [selectedProfessionalForLeads, setSelectedProfessionalForLeads] = useState<TaxProfessional | null>(null);

  // Modal Cadastro de Profissional
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProfName, setNewProfName] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');
  const [newProfRole, setNewProfRole] = useState<ProfessionalRole>('Advogado');
  const [newProfReg, setNewProfReg] = useState('');
  const [newProfCapacity, setNewProfCapacity] = useState<number>(5);
  const [newProfSpecialties, setNewProfSpecialties] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const teamSummary = calculateTeamLoadSummary(taxProfessionals, prospects);
  const waitingLeads = prospects.filter(l => l.assignmentStatus === 'WAITING_DISTRIBUTION');

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Alteração rápida de Status do profissional
  const handleStatusChange = (profId: string, newStatus: ProfessionalStatus) => {
    const prof = taxProfessionals.find(p => p.id === profId);
    if (!prof) return;

    const updated = taxProfessionals.map(p => {
      if (p.id === profId) {
        return { ...p, status: newStatus };
      }
      return p;
    });

    onUpdateProfessionals(updated);
    onRecordAuditLog(
      'Gestor Tributário',
      'Gerência',
      'PROFESSIONAL_STATUS_CHANGED',
      `Status alterado: ${prof.name}`,
      `Alterou disponibilidade de "${prof.name}" (${prof.role}) para "${newStatus}".`
    );
    showToast(`Status de ${prof.name} alterado para ${newStatus}.`);
  };

  // Toggle de participação na fila (ex: férias)
  const handleToggleQueue = (profId: string) => {
    const prof = taxProfessionals.find(p => p.id === profId);
    if (!prof) return;

    const newActiveState = !prof.activeInQueue;
    const updated = taxProfessionals.map(p => {
      if (p.id === profId) {
        return { 
          ...p, 
          activeInQueue: newActiveState,
          status: (!newActiveState ? 'Ausente' : 'Disponível') as ProfessionalStatus
        };
      }
      return p;
    });

    onUpdateProfessionals(updated);
    onRecordAuditLog(
      'Gestor Tributário',
      'Gerência',
      'PROFESSIONAL_STATUS_CHANGED',
      `Fila de distribuição: ${prof.name}`,
      `${prof.name} foi ${newActiveState ? 'incluído(a)' : 'removido(a)'} da fila de distribuição automática.`
    );
    showToast(`${prof.name} ${newActiveState ? 'ativado na' : 'desativado da'} fila.`);
  };

  // Ajuste de Capacidade Máxima
  const handleAdjustCapacity = (profId: string, delta: number) => {
    const prof = taxProfessionals.find(p => p.id === profId);
    if (!prof) return;

    const newCapacity = Math.max(1, Math.min(20, prof.maxCapacity + delta));
    const updated = taxProfessionals.map(p => {
      if (p.id === profId) {
        return { 
          ...p, 
          maxCapacity: newCapacity,
          status: (p.activeLeadsCount >= newCapacity ? 'Ocupado' : 'Disponível') as ProfessionalStatus
        };
      }
      return p;
    });

    onUpdateProfessionals(updated);
    showToast(`Capacidade de ${prof.name} ajustada para ${newCapacity} leads.`);
  };

  // Executar Distribuição da Fila de Espera
  const handleProcessWaitingQueue = () => {
    const result = distributeWaitingQueue(prospects, taxProfessionals);
    if (result.distributedCount > 0) {
      onUpdateProspects(result.updatedLeads);
      onUpdateProfessionals(result.updatedProfessionals);
      onRecordAuditLog(
        'Motor de Distribuição Velatrix',
        'Sistema',
        'LEAD_DISTRIBUTED',
        `Distribuição da Fila: ${result.distributedCount} lead(s) alocado(s)`,
        `Processou a fila de espera e atribuiu ${result.distributedCount} lead(s) a profissionais disponíveis com vagas livres.`
      );
      showToast(`Sucesso! ${result.distributedCount} lead(s) foram distribuídos da fila de espera.`);
    } else {
      showToast('Nenhuma vaga disponível no momento. Libere capacidade ou cadastre novos profissionais.');
    }
  };

  // Salvar Novo Profissional
  const handleCreateProfessional = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim() || !newProfEmail.trim()) return;

    const specialtiesList = newProfSpecialties
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const newProf: TaxProfessional = {
      id: `prof_${Date.now()}`,
      name: newProfName.trim(),
      email: newProfEmail.trim(),
      role: newProfRole,
      status: 'Disponível',
      maxCapacity: Number(newProfCapacity) || 5,
      activeLeadsCount: 0,
      activeInQueue: true,
      registrationNumber: newProfReg.trim() || (newProfRole === 'Advogado' ? 'OAB/SP 000.000' : 'CRC/SP 000000'),
      specialties: specialtiesList.length > 0 ? specialtiesList : ['Teses Tributárias em Geral']
    };

    onUpdateProfessionals([...taxProfessionals, newProf]);
    onRecordAuditLog(
      'Gestor Tributário',
      'Gerência',
      'EMPLOYEE_CREATED',
      `Novo profissional cadastrado: ${newProf.name}`,
      `Cadastrou ${newProf.name} como ${newProf.role} (${newProf.registrationNumber}) com capacidade para ${newProf.maxCapacity} leads.`
    );

    setIsAddModalOpen(false);
    setNewProfName('');
    setNewProfEmail('');
    setNewProfReg('');
    setNewProfSpecialties('');
    setNewProfCapacity(5);
    showToast(`${newProf.name} cadastrado(a) com sucesso na equipe tributária.`);

    // Se houver leads na fila de espera, tenta distribuir imediatamente
    if (waitingLeads.length > 0) {
      setTimeout(() => {
        handleProcessWaitingQueue();
      }, 500);
    }
  };

  // Filtragem dos profissionais para a lista
  const filteredProfessionals = taxProfessionals
    .filter(p => {
      if (roleFilter === 'ALL') return true;
      return p.role === roleFilter;
    })
    .filter(p => {
      if (statusFilter === 'ALL') return true;
      return p.status === statusFilter;
    });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)}
            className="text-cyan-400 hover:text-cyan-200 text-xs font-mono"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl bg-gradient-to-r from-cyan-950/20 via-slate-950 to-[var(--vx-deep)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold">
              MOTOR DE DISTRIBUIÇÃO OPERACIONAL
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
              Gerente & RH
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
            <Scale className="w-4 h-4 text-cyan-400" />
            Gestão da Equipe Tributária & Balanceamento de Carga
          </h2>
          <p className="text-xs text-slate-400">
            Distribuição automatizada round-robin com prioridade para menor taxa de ocupação entre advogados e contadores.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Cadastrar Profissional</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Equilíbrio da Capacidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Equipe Ativa */}
        <div className="p-3.5 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px] text-slate-400">Profissionais na Fila</span>
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {teamSummary.activeInQueueCount}
              <span className="text-xs text-slate-400 font-normal"> / {teamSummary.totalProfessionals}</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
              {teamSummary.lawyersCount} Adv • {teamSummary.accountantsCount} Cont
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {teamSummary.availableCount} com capacidade livre imediata
          </div>
        </div>

        {/* Card 2: Capacidade & Ocupação */}
        <div className="p-3.5 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px] text-slate-400">Ocupação da Carteira</span>
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {teamSummary.capacityUtilizationPercent}%
            </span>
            <span className="text-xs font-mono text-slate-300">
              {teamSummary.totalActiveAssigned} / {teamSummary.totalCapacity} vagas
            </span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                teamSummary.capacityUtilizationPercent > 85 
                  ? 'bg-red-500' 
                  : teamSummary.capacityUtilizationPercent > 65 
                  ? 'bg-amber-500' 
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, teamSummary.capacityUtilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Card 3: Vagas Livres */}
        <div className="p-3.5 bg-[var(--vx-deep)] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono uppercase text-[10px] text-slate-400">Vagas Disponíveis</span>
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-indigo-300">
              {Math.max(0, teamSummary.totalCapacity - teamSummary.totalActiveAssigned)}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800">
              Absorção Ativa
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            Margem para novos diagnósticos da Landing Page
          </div>
        </div>

        {/* Card 4: Fila de Espera (Gargalo) */}
        <div className={`p-3.5 rounded-xl border space-y-2 ${
          teamSummary.waitingQueueCount > 0 
            ? 'bg-amber-950/30 border-amber-800/80' 
            : 'bg-[var(--vx-deep)] border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono uppercase text-[10px] ${
              teamSummary.waitingQueueCount > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'
            }`}>
              Fila de Espera
            </span>
            <Clock className={`w-3.5 h-3.5 ${
              teamSummary.waitingQueueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500'
            }`} />
          </div>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${
              teamSummary.waitingQueueCount > 0 ? 'text-amber-300' : 'text-slate-400'
            }`}>
              {teamSummary.waitingQueueCount}
            </span>
            {teamSummary.waitingQueueCount > 0 ? (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700 font-bold">
                Aguardando Vaga
              </span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-400">
                Sem represamento
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            {teamSummary.waitingQueueCount > 0 
              ? 'Excesso de demanda sobre a capacidade' 
              : 'Fluxo em dia com a equipe'}
          </div>
        </div>
      </div>

      {/* Se houver leads na Fila de Espera, exibe banner acionável para o Gestor */}
      {waitingLeads.length > 0 && (
        <div className="p-4 bg-amber-950/40 border border-amber-700/80 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-200 font-mono">
                  {waitingLeads.length} lead(s) aguardando distribuição por capacidade da equipe
                </h4>
                <p className="text-[11px] text-amber-300/80">
                  Os profissionais disponíveis estão com suas capacidades máximas preenchidas ou ausentes.
                </p>
              </div>
            </div>
            <button
              onClick={handleProcessWaitingQueue}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Forçar Distribuição da Fila</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-amber-800/40">
            {waitingLeads.map(lead => (
              <div 
                key={lead.id} 
                className="p-2.5 bg-slate-950/90 border border-amber-900/60 rounded-xl space-y-1.5 text-xs"
              >
                <div className="flex justify-between items-start">
                  <strong className="text-slate-100 truncate block max-w-[180px]" title={lead.name}>
                    {lead.name}
                  </strong>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Fila
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">CNPJ: {lead.cnpj}</div>
                {lead.cnae && (
                  <div className="text-[10px] text-slate-300 truncate" title={lead.cnae}>
                    {lead.cnae}
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-emerald-400 font-mono font-bold">
                    R$ {lead.estimatedMrrBrl.toLocaleString('pt-BR')} MRR
                  </span>
                  <button
                    onClick={() => onOpenReassignModal(lead)}
                    className="text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Atribuir Manual</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Tax Professionals */}
      <div className="p-3 bg-[var(--vx-deep)] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px]">Filtrar por Papel:</span>
          {(['ALL', 'Advogado', 'Contador'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                roleFilter === role
                  ? 'bg-cyan-950 text-cyan-200 border-cyan-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {role === 'ALL' ? 'Todos' : role}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-mono text-[11px]">Status:</span>
          {(['ALL', 'Disponível', 'Ocupado', 'Ausente'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-violet-950 text-violet-200 border-violet-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Professionals List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredProfessionals.map(prof => {
          const loadPercent = Math.round((prof.activeLeadsCount / prof.maxCapacity) * 100);
          const isFull = prof.activeLeadsCount >= prof.maxCapacity;
          const assignedLeads = prospects.filter(l => l.assignedProfessionalId === prof.id);

          return (
            <div 
              key={prof.id}
              className={`p-4 bg-[var(--vx-deep)] border rounded-2xl space-y-3 transition-all ${
                !prof.activeInQueue 
                  ? 'border-slate-800/60 opacity-75' 
                  : isFull 
                  ? 'border-amber-800/60 shadow-sm' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header: Name, Role & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    prof.role === 'Advogado'
                      ? 'bg-indigo-950/80 border-indigo-800 text-indigo-400'
                      : 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                  }`}>
                    {prof.role === 'Advogado' ? <Briefcase className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-slate-100 block truncate" title={prof.name}>
                      {prof.name}
                    </strong>
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      {prof.registrationNumber} • {prof.role}
                    </div>
                  </div>
                </div>

                {/* Status Dropdown */}
                <select
                  value={prof.status}
                  onChange={e => handleStatusChange(prof.id, e.target.value as ProfessionalStatus)}
                  className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                    prof.status === 'Disponível'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : prof.status === 'Ocupado'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-red-950 text-red-300 border-red-800'
                  }`}
                >
                  <option value="Disponível">Disponível</option>
                  <option value="Ocupado">Ocupado</option>
                  <option value="Ausente">Ausente</option>
                </select>
              </div>

              {/* Queue Activation Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-300 font-mono">
                  Fila Automática:
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleQueue(prof.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    prof.activeInQueue
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {prof.activeInQueue ? '✓ Ativo na Fila' : '✕ Fora da Fila (Férias)'}
                </button>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[10px] font-mono">Carga de Carteira:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className={`font-mono text-xs ${
                      isFull ? 'text-amber-400' : 'text-slate-200'
                    }`}>
                      {prof.activeLeadsCount} / {prof.maxCapacity} leads
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">({loadPercent}%)</span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      loadPercent >= 100 
                        ? 'bg-amber-500' 
                        : loadPercent >= 60 
                        ? 'bg-cyan-500' 
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, loadPercent)}%` }}
                  />
                </div>

                {/* Capacity Adjuster */}
                <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                  <span>Ajustar Teto de Capacidade:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustCapacity(prof.id, -1)}
                      disabled={prof.maxCapacity <= 1}
                      className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 flex items-center justify-center font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-slate-200 font-bold">{prof.maxCapacity}</span>
                    <button
                      onClick={() => handleAdjustCapacity(prof.id, 1)}
                      disabled={prof.maxCapacity >= 20}
                      className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 flex items-center justify-center font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialties Chips */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Especialidades Tributárias:</span>
                <div className="flex flex-wrap gap-1">
                  {prof.specialties.map((spec, i) => (
                    <span 
                      key={i} 
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[200px]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer: Last assignment timestamp & View leads button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span title="Momento da última distribuição atribuída">
                  Última: {prof.lastAssignedAt ? prof.lastAssignedAt.split(' ')[1] : 'Sem registro'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProfessionalForLeads(prof)}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold hover:underline cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>Ver Carteira ({assignedLeads.length})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Leads na Carteira do Profissional Selecionado */}
      {selectedProfessionalForLeads && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] border border-cyan-800/70 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                  selectedProfessionalForLeads.role === 'Advogado'
                    ? 'bg-indigo-950 border-indigo-800 text-indigo-300'
                    : 'bg-emerald-950 border-emerald-800 text-emerald-300'
                }`}>
                  {selectedProfessionalForLeads.role === 'Advogado' ? <Briefcase className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Carteira de Leads: {selectedProfessionalForLeads.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedProfessionalForLeads.registrationNumber} • {selectedProfessionalForLeads.role} • Carga: {selectedProfessionalForLeads.activeLeadsCount}/{selectedProfessionalForLeads.maxCapacity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfessionalForLeads(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {(() => {
                const leads = prospects.filter(l => l.assignedProfessionalId === selectedProfessionalForLeads.id);
                if (leads.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 text-xs font-mono">
                      Nenhum lead atribuído atualmente a este profissional.
                    </div>
                  );
                }

                return leads.map(lead => (
                  <div 
                    key={lead.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <strong className="text-slate-100 font-mono truncate block" title={lead.name}>
                        {lead.name}
                      </strong>
                      <div className="text-[10px] font-mono text-slate-400">
                        CNPJ: {lead.cnpj} • Etapa: <span className="text-cyan-300">{lead.stage}</span>
                      </div>
                      {lead.cnae && (
                        <div className="text-[10px] text-slate-400 truncate max-w-md">
                          {lead.cnae}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-emerald-400 font-mono font-bold text-xs">
                        R$ {lead.estimatedMrrBrl.toLocaleString('pt-BR')} MRR
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProfessionalForLeads(null);
                          onOpenReassignModal(lead);
                        }}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Reatribuir</span>
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Novo Profissional Tributário */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] border border-cyan-800/70 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Cadastrar Profissional Tributário
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Integração à fila de distribuição e balanceamento de carteiras.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProfessional} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Larissa Miranda"
                  value={newProfName}
                  onChange={e => setNewProfName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">E-mail Corporativo *</label>
                  <input
                    type="email"
                    required
                    placeholder="larissa@velatrix.com.br"
                    value={newProfEmail}
                    onChange={e => setNewProfEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">Papel Especializado *</label>
                  <select
                    value={newProfRole}
                    onChange={e => setNewProfRole(e.target.value as ProfessionalRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Advogado">Advogado Tributarista</option>
                    <option value="Contador">Contador Especialista</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">
                    {newProfRole === 'Advogado' ? 'Número OAB (com UF) *' : 'Número CRC (com UF) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newProfRole === 'Advogado' ? 'OAB/SP 420.190' : 'CRC/SP 1SP123456'}
                    value={newProfReg}
                    onChange={e => setNewProfReg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-mono font-bold block">Capacidade Máxima (Leads) *</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={newProfCapacity}
                    onChange={e => setNewProfCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-mono font-bold block">
                  Especialidades Tributárias (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tema 69 STF, Monofásicos, Simples Nacional, PERSE"
                  value={newProfSpecialties}
                  onChange={e => setNewProfSpecialties(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-slate-200 font-mono text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold font-mono text-xs transition-colors shadow-lg"
                >
                  Salvar e Ativar na Fila
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regra de Governança e Linguagem Neutra */}
      <div className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl text-[10px] text-slate-400 flex items-start gap-2 font-mono">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          <strong>Diretriz Operacional & Governança:</strong> O algoritmo de distribuição round-robin ponderado tem função estritamente operacional interna para balanceamento da carga de trabalho entre advogados e contadores, baseando-se em métricas de capacidade e disponibilidade. Não constitui indicação ou garantia de resultado jurídico, tributário ou administrativo.
        </span>
      </div>
    </div>
  );
};
