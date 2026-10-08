import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Briefcase, 
  ShieldCheck, 
  Layers, 
  UserCheck, 
  FileSignature, 
  Receipt, 
  Plus, 
  Search, 
  ChevronRight, 
  Sparkles, 
  Filter, 
  ArrowUpRight, 
  Send, 
  AlertCircle, 
  HardHat, 
  Database, 
  Lock, 
  Download, 
  Paperclip, 
  ExternalLink, 
  ChevronDown, 
  FileSpreadsheet, 
  Share2, 
  Mail, 
  MessageSquare, 
  X, 
  CreditCard, 
  Printer,
  History,
  Activity,
  UserPlus,
  Network,
  Cpu,
  Eye,
  LockKeyhole,
  Pencil,
  Landmark,
  Copy,
  Check,
  EyeOff,
  ShieldAlert,
  Zap,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  ArrowRightLeft,
  Scale,
  Bell
} from 'lucide-react';
import { 
  OfficeRole, 
  ProspectLead, 
  LeadOrigin,
  OnboardingProject, 
  OfficeEmployee, 
  EmployeeBankDetails,
  ClientContract, 
  BillingEntry,
  OfficeInternalAuditEntry,
  TaxProfessional,
  ProfessionalRole,
  ProfessionalStatus,
  AssignmentStatus,
  INITIAL_MOCK_PROSPECTS,
  INITIAL_MOCK_ONBOARDING_PROJECTS,
  INITIAL_MOCK_EMPLOYEES,
  INITIAL_MOCK_CONTRACTS,
  INITIAL_MOCK_INTERNAL_AUDIT_LOGS,
  INITIAL_MOCK_TAX_PROFESSIONALS
} from '../../data/mockOfficeData';
import { 
  distributeLead, 
  distributeWaitingQueue, 
  releaseLeadCapacity, 
  calculateTeamLoadSummary 
} from '../../services/leadDistributionEngine';
import { TaxDistributionEnginePanel } from './TaxDistributionEnginePanel';
import { LeadReassignmentModal } from './LeadReassignmentModal';
import { VectorStoreService } from '../../services/vectorStoreService';
import { useAuth } from '../../context/AuthContext';
import { VELATRIX_PLAN_TIERS, PlanTier } from '../../data/planFeatures';
import { generateBillingReportPdf, generatePreInvoicePdf } from '../../services/pdfReportService';
import { NfseManagementSection } from './NfseManagementSection';
import { EmployeePayrollDashboard } from './EmployeePayrollDashboard';
import { 
  fetchProspectLeads, 
  fetchTaxProfessionals,
  saveProspectLead,
  updateProspectLeadStage,
  updateProspectLead
} from '../../services/dataService';
import { secureId } from '../../lib/demoMode';


export const BRAZILIAN_BANKS = [
  '341 - Itaú Unibanco S/A',
  '001 - Banco do Brasil S/A',
  '237 - Banco Bradesco S/A',
  '033 - Banco Santander (Brasil) S/A',
  '104 - Caixa Econômica Federal',
  '260 - Nu Pagamentos S/A (Nubank)',
  '077 - Banco Inter S/A',
  '336 - Banco C6 S/A',
  '208 - Banco BTG Pactual S/A',
  '212 - Banco Original S/A',
  '756 - Sicoob / Bancoob',
  '748 - Sicredi S/A',
  'Outro Banco...'
];

interface VelatrixOfficeDashboardProps {
  onNavigateToSuperAdminTenantManager?: () => void;
}

export const VelatrixOfficeDashboard: React.FC<VelatrixOfficeDashboardProps> = ({
  onNavigateToSuperAdminTenantManager
}) => {
  const { tenantsList, isSuperAdmin } = useAuth();

  // Role selector state
  const [currentOfficeRole, setCurrentOfficeRole] = useState<OfficeRole>('commercial');
  const [activeInternalSubTab, setActiveInternalSubTab] = useState<'main' | 'audit' | 'connectors' | 'distribution'>('main');
  const [accountingSubTab, setAccountingSubTab] = useState<'nfse' | 'billing' | 'payroll'>('nfse');

  // Motor de Distribuição & Equipe Tributária State
  const [taxProfessionals, setTaxProfessionals] = useState<TaxProfessional[]>(INITIAL_MOCK_TAX_PROFESSIONALS);
  const [activeSimulatedProfessionalId, setActiveSimulatedProfessionalId] = useState<string>('ALL'); // 'ALL' = Gestor / Todos ou ID do Profissional
  const [onlyMyLeadsFilter, setOnlyMyLeadsFilter] = useState<boolean>(false);
  const [leadForReassignment, setLeadForReassignment] = useState<ProspectLead | null>(null);
  const [lastAssignedToast, setLastAssignedToast] = useState<{
    leadName: string;
    profName: string;
    profRole: string;
    timestamp: string;
  } | null>(null);

  // Commercial Kanban State
  const [prospects, setProspects] = useState<ProspectLead[]>(INITIAL_MOCK_PROSPECTS);
  const [isLoadingOfficeData, setIsLoadingOfficeData] = useState<boolean>(false);
  const [searchTermProspect, setSearchTermProspect] = useState('');
  const [requestProvisionSuccess, setRequestProvisionSuccess] = useState<string | null>(null);

  // Sync with persistent database foundation
  useEffect(() => {
    let isMounted = true;
    setIsLoadingOfficeData(true);
    Promise.all([fetchProspectLeads(), fetchTaxProfessionals()])
      .then(([leads, profs]) => {
        if (isMounted) {
          if (leads && leads.length > 0) setProspects(leads);
          if (profs && profs.length > 0) setTaxProfessionals(profs);
        }
      })
      .catch(err => {
        console.debug('[VelatrixOfficeDashboard] Falha ao carregar dados da base persistente:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingOfficeData(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Commercial Qualification & Filter States
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [originFilter, setOriginFilter] = useState<'ALL' | 'LANDING_PAGE' | 'MAPS_MANUAL' | 'INDICACAO_PARCEIRO'>('ALL');
  const [sortByScore, setSortByScore] = useState<'DEFAULT' | 'SCORE_DESC' | 'SCORE_ASC' | 'MRR_DESC'>('DEFAULT');

  // Lead Capture & Inspection Modals State
  const [isLeadCaptureModalOpen, setIsLeadCaptureModalOpen] = useState(false);
  const [selectedLeadForInspection, setSelectedLeadForInspection] = useState<ProspectLead | null>(null);

  // New Collected Lead Form State
  const initialNewLeadForm = {
    name: '',
    cnpj: '',
    sector: 'retail',
    sectorLabel: 'Comércio Varejista',
    responsibleName: 'Guilherme Siqueira',
    estimatedMrrBrl: 18000,
    origem: 'LANDING_PAGE' as LeadOrigin,
    cnae: '4711-3/02 - Hipermercados e supermercados',
    regimeTributarioEstimado: 'Lucro Real',
    tesesAplicaveis: ['Tema 69 STF (Exclusão do ICMS da base do PIS/COFINS)', 'PIS/COFINS Monofásico (Lei 10.147/00)'],
    scoreAderencia: 88,
    faixaCreditoEstimado: 'R$ 250.000 - R$ 750.000',
    notes: 'Lead capturado automaticamente via Firestore Landing Page com diagnóstico fiscal concluído.'
  };
  const [newLeadForm, setNewLeadForm] = useState(initialNewLeadForm);

  // Onboarding Projects State
  const [onboardingProjects, setOnboardingProjects] = useState<OnboardingProject[]>(INITIAL_MOCK_ONBOARDING_PROJECTS);

  // Employees State, Add Employee & Edit Employee Modals
  const [employees, setEmployees] = useState<OfficeEmployee[]>(INITIAL_MOCK_EMPLOYEES);
  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [hrSubTab, setHrSubTab] = useState<'employees' | 'payroll'>('employees');
  
  // Add Employee Modal & Form State
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const initialNewEmployeeForm = {
    name: '',
    email: '',
    department: 'Comercial' as OfficeEmployee['department'],
    roleTitle: '',
    systemAccessRole: 'Comercial' as 'Comercial' | 'Gerente' | 'Implantação' | 'RH' | 'Advogado' | 'Contador',
    salaryBrl: 10500,
    // Dados Bancários / Recebimento
    bankName: '341 - Itaú Unibanco S/A',
    customBankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'Corrente' as 'Corrente' | 'Poupança',
    pixKey: '',
    pixKeyType: 'CPF' as 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Chave Aleatória'
  };
  const [newEmployeeForm, setNewEmployeeForm] = useState(initialNewEmployeeForm);

  // Edit Employee Modal & Form State
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<OfficeEmployee | null>(null);
  const [editEmployeeForm, setEditEmployeeForm] = useState({
    id: '',
    name: '',
    email: '',
    department: 'Comercial' as OfficeEmployee['department'],
    roleTitle: '',
    systemAccessRole: 'Comercial' as 'Comercial' | 'Gerente' | 'Implantação' | 'RH' | 'Advogado' | 'Contador',
    salaryBrl: 10500,
    status: 'Ativo' as 'Ativo' | 'Afastado',
    // Dados Bancários / Recebimento
    bankName: '341 - Itaú Unibanco S/A',
    customBankName: '',
    agency: '',
    accountNumber: '',
    accountType: 'Corrente' as 'Corrente' | 'Poupança',
    pixKey: '',
    pixKeyType: 'CPF' as 'CPF' | 'CNPJ' | 'E-mail' | 'Telefone' | 'Chave Aleatória'
  });

  // Blindagem de Sigilo & RLS Helpers:
  // Dados bancários visíveis apenas para RH e Contador (ou Super-Admin)
  const [isPrivacyMaskActive, setIsPrivacyMaskActive] = useState(false);
  const [copiedPixId, setCopiedPixId] = useState<string | null>(null);

  const canViewUnmaskedBankData = currentOfficeRole === 'hr' || currentOfficeRole === 'accounting' || isSuperAdmin;

  const handleCopyPix = (id: string, pix: string) => {
    if (!pix) return;
    navigator.clipboard.writeText(pix);
    setCopiedPixId(id);
    setTimeout(() => setCopiedPixId(null), 2000);
  };

  // Contracts State
  const [contracts, setContracts] = useState<ClientContract[]>(INITIAL_MOCK_CONTRACTS);
  const [searchContract, setSearchContract] = useState('');

  // Internal Audit Logs State
  const [internalAuditLogs, setInternalAuditLogs] = useState<OfficeInternalAuditEntry[]>(INITIAL_MOCK_INTERNAL_AUDIT_LOGS);
  const [searchAuditLog, setSearchAuditLog] = useState('');
  const [filterAuditAction, setFilterAuditAction] = useState<string>('ALL');

  // Accounting State: Pre-Invoice Modal & Exporting
  const [selectedBillForPreInvoice, setSelectedBillForPreInvoice] = useState<BillingEntry | null>(null);
  const [isExportingBillingReport, setIsExportingBillingReport] = useState(false);
  const [billingExportSuccess, setBillingExportSuccess] = useState(false);

  // Helper to record an internal audit log
  const recordAuditLog = (
    employeeName: string,
    employeeRole: string,
    actionType: OfficeInternalAuditEntry['actionType'],
    actionSummary: string,
    details: string
  ) => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const newEntry: OfficeInternalAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp,
      employeeName,
      employeeRole,
      actionType,
      actionSummary,
      details
    };
    setInternalAuditLogs(prev => [newEntry, ...prev]);

    // Automatically index internal audit event into RAG vector knowledge store
    try {
      VectorStoreService.ingestAuditEvent({
        id: newEntry.id,
        timestamp: newEntry.timestamp,
        employeeName: newEntry.employeeName,
        employeeRole: newEntry.employeeRole,
        actionType: newEntry.actionType,
        actionSummary: newEntry.actionSummary,
        details: newEntry.details
      });
    } catch (e) {
      console.warn('Auto RAG indexing failed for audit log:', e);
    }
  };

  // Move Commercial Card
  const handleMoveProspectStage = (leadId: string, newStage: ProspectLead['stage']) => {
    const lead = prospects.find(p => p.id === leadId);
    let updatedProspectsList = prospects.map(l => {
      if (l.id === leadId) {
        return { ...l, stage: newStage };
      }
      return l;
    });

    // Se o lead foi concluído/fechado, libera capacidade na carteira do profissional e reprocessa a fila de espera
    if (newStage === 'closed' && lead && lead.assignedProfessionalId) {
      const releasedProfessionals = releaseLeadCapacity(lead, taxProfessionals);
      const queueResult = distributeWaitingQueue(updatedProspectsList, releasedProfessionals);
      if (queueResult.distributedCount > 0) {
        updatedProspectsList = queueResult.updatedLeads;
        setTaxProfessionals(queueResult.updatedProfessionals);
        recordAuditLog(
          'Motor de Distribuição Velatrix',
          'Sistema',
          'LEAD_DISTRIBUTED',
          `Fila de espera processada: ${queueResult.distributedCount} lead(s) alocado(s)`,
          `A vaga liberada pela conclusão de "${lead.name}" permitiu distribuir lead(s) represados na fila de espera.`
        );
      } else {
        setTaxProfessionals(releasedProfessionals);
      }
    }

    setProspects(updatedProspectsList);

    // Persiste mudança de estágio no backend Postgres / Prisma
    updateProspectLeadStage(leadId, newStage).catch(err => {
      console.debug('[VelatrixOfficeDashboard] Stage update API fallback:', err);
    });

    if (lead) {

      const stageNames: Record<string, string> = {
        lead: 'Lead Inicial',
        proposal_sent: 'Proposta Enviada',
        negotiation: 'Em Negociação',
        closed: 'Fechado'
      };
      recordAuditLog(
        lead.responsibleName || 'Operador Comercial',
        'Comercial',
        'PROSPECT_MOVED',
        `Prospect movido para ${stageNames[newStage]}`,
        `Moveu "${lead.name}" (${lead.cnpj}) para a etapa "${stageNames[newStage]}".`
      );
    }
  };

  // Add / Save Collected Lead (Captação) com Distribuição Automática
  const handleSaveNewLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.name.trim() || !newLeadForm.cnpj.trim()) return;

    const draftLead: ProspectLead = {
      id: `prospect_${Date.now()}`,
      name: newLeadForm.name.trim(),
      cnpj: newLeadForm.cnpj.trim(),
      sector: newLeadForm.sector,
      sectorLabel: newLeadForm.sectorLabel,
      stage: 'lead',
      responsibleName: 'Aguardando Distribuição',
      estimatedMrrBrl: Number(newLeadForm.estimatedMrrBrl) || 15000,
      lastContactDate: new Date().toISOString().split('T')[0],
      notes: newLeadForm.notes,
      origem: newLeadForm.origem,
      cnae: newLeadForm.cnae,
      regimeTributarioEstimado: newLeadForm.regimeTributarioEstimado,
      tesesAplicaveis: newLeadForm.tesesAplicaveis,
      scoreAderencia: Number(newLeadForm.scoreAderencia) || 0,
      faixaCreditoEstimado: newLeadForm.faixaCreditoEstimado,
      dataDiagnostico: new Date().toLocaleString('pt-BR'),
      autoDiagnosticoCompleto: newLeadForm.origem === 'LANDING_PAGE'
    };

    // Executa Motor de Distribuição Automática de Leads (Round-Robin com Balanceamento de Carga)
    const distResult = distributeLead(draftLead, taxProfessionals);
    setTaxProfessionals(distResult.updatedProfessionals);
    const finalizedLead = distResult.updatedLead;

    setProspects(prev => [finalizedLead, ...prev]);
    setIsLeadCaptureModalOpen(false);

    // Persiste no backend Postgres / Prisma
    saveProspectLead(finalizedLead).catch(err => {
      console.debug('[VelatrixOfficeDashboard] Save new lead API fallback:', err);
    });


    if (!distResult.isWaiting && distResult.assignedTo) {
      setLastAssignedToast({
        leadName: finalizedLead.name,
        profName: distResult.assignedTo.name,
        profRole: distResult.assignedTo.role,
        timestamp: finalizedLead.assignedAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      recordAuditLog(
        'Motor de Distribuição Velatrix',
        'Sistema',
        'LEAD_DISTRIBUTED',
        `Lead distribuído: ${finalizedLead.name}`,
        `Atribuído automaticamente para ${distResult.assignedTo.name} (${distResult.assignedTo.role}) pelo algoritmo de balanceamento de carga (${distResult.assignedTo.activeLeadsCount + 1}/${distResult.assignedTo.maxCapacity}).`
      );
    } else {
      recordAuditLog(
        'Motor de Distribuição Velatrix',
        'Sistema',
        'LEAD_DISTRIBUTED',
        `Lead na Fila de Espera: ${finalizedLead.name}`,
        `Todos os profissionais da equipe tributária atingiram o limite de capacidade operacional. O lead aguarda liberação de novas vagas.`
      );
    }

    recordAuditLog(
      finalizedLead.responsibleName,
      'Comercial',
      'LEAD_CAPTURED',
      `Lead cadastrado: ${finalizedLead.name}`,
      `Cadastrou empresa "${finalizedLead.name}" (${finalizedLead.cnpj}) no módulo de Captação. Origem: ${finalizedLead.origem === 'LANDING_PAGE' ? 'Landing Page (Diagnóstico Fiscal)' : finalizedLead.origem === 'MAPS_MANUAL' ? 'Cadastro Manual (Maps/Instagram)' : 'Indicação Parceiro'}. Score de Aderência: ${finalizedLead.scoreAderencia}/100. Responsável: ${finalizedLead.responsibleName} (${finalizedLead.responsibleRole || 'Aguardando'}).`
    );

    setNewLeadForm(initialNewLeadForm);
  };

  // Score de Aderência Badge: Verde (>75), Amarelo (50-75), Cinza (<50)
  const renderScoreBadge = (score?: number, isCompact = false) => {
    if (score === undefined || score === null) {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
          <AlertCircle className={isCompact ? 'w-2.5 h-2.5 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
          <span>Sem Score</span>
        </span>
      );
    }
    if (score > 75) {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/40 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
          <Sparkles className={isCompact ? 'w-2.5 h-2.5 text-emerald-400' : 'w-3.5 h-3.5 text-emerald-400'} />
          <span>Score: {score}/100</span>
          {!isCompact && <span className="opacity-80 text-[10px] ml-0.5 font-sans font-semibold">• Alta Aderência</span>}
        </span>
      );
    }
    if (score >= 50) {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
          <Activity className={isCompact ? 'w-2.5 h-2.5 text-amber-400' : 'w-3.5 h-3.5 text-amber-400'} />
          <span>Score: {score}/100</span>
          {!isCompact && <span className="opacity-80 text-[10px] ml-0.5 font-sans font-semibold">• Média Aderência</span>}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
        <AlertCircle className={isCompact ? 'w-2.5 h-2.5 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
        <span>Score: {score}/100</span>
        {!isCompact && <span className="opacity-80 text-[10px] ml-0.5 font-sans font-semibold">• Baixa Aderência</span>}
      </span>
    );
  };

  // Selo Visual Diferenciador de Origem do Lead
  const renderOriginSeal = (origem: LeadOrigin, isCompact = false) => {
    if (origem === 'LANDING_PAGE') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-bold bg-gradient-to-r from-cyan-950/90 to-blue-950/90 text-cyan-300 border border-cyan-600/50 shadow-sm shadow-cyan-950/60 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
          <Zap className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-cyan-400 fill-cyan-400 animate-pulse`} />
          <span>Origem: Landing Page (Diagnóstico Fiscal)</span>
        </span>
      );
    }
    if (origem === 'MAPS_MANUAL') {
      return (
        <span className={`inline-flex items-center gap-1 font-mono font-medium bg-slate-900 text-slate-300 border border-slate-700/80 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
          <MapPin className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-amber-400`} />
          <span>Origem: Cadastro Manual (Maps/Instagram)</span>
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-mono font-medium bg-purple-950/80 text-purple-300 border border-purple-800/80 ${isCompact ? 'px-1.5 py-0.5 text-[9px] rounded' : 'px-2.5 py-1 text-xs rounded-lg'}`}>
        <Users className={`${isCompact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} text-purple-400`} />
        <span>Origem: Indicação Parceiro</span>
      </span>
    );
  };

  // Filtragem e Ordenação dos Prospects do Funil
  const getFilteredAndSortedProspects = (stage: ProspectLead['stage']) => {
    return prospects
      .filter(p => p.stage === stage)
      .filter(p => {
        if (!searchTermProspect) return true;
        const term = searchTermProspect.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.cnpj.includes(term) ||
          (p.cnae && p.cnae.toLowerCase().includes(term)) ||
          (p.regimeTributarioEstimado && p.regimeTributarioEstimado.toLowerCase().includes(term)) ||
          (p.tesesAplicaveis && p.tesesAplicaveis.some(t => t.toLowerCase().includes(term)))
        );
      })
      .filter(p => {
        if (originFilter === 'ALL') return true;
        return p.origem === originFilter;
      })
      .filter(p => {
        if (scoreFilter === 'ALL') return true;
        const score = p.scoreAderencia ?? 0;
        if (scoreFilter === 'HIGH') return score > 75;
        if (scoreFilter === 'MEDIUM') return score >= 50 && score <= 75;
        if (scoreFilter === 'LOW') return score < 50;
        return true;
      })
      .filter(p => {
        if (onlyMyLeadsFilter && activeSimulatedProfessionalId !== 'ALL') {
          return p.assignedProfessionalId === activeSimulatedProfessionalId;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortByScore === 'SCORE_DESC') {
          return (b.scoreAderencia ?? 0) - (a.scoreAderencia ?? 0);
        }
        if (sortByScore === 'SCORE_ASC') {
          return (a.scoreAderencia ?? 0) - (b.scoreAderencia ?? 0);
        }
        if (sortByScore === 'MRR_DESC') {
          return b.estimatedMrrBrl - a.estimatedMrrBrl;
        }
        return 0;
      });
  };

  // Renderizador do Card do Lead no Kanban (Captação e Qualificação)
  const renderLeadCard = (lead: ProspectLead) => {
    const isLanding = lead.origem === 'LANDING_PAGE';
    const isWaiting = lead.assignmentStatus === 'WAITING_DISTRIBUTION';
    const isAssignedToSimulated = activeSimulatedProfessionalId !== 'ALL' && lead.assignedProfessionalId === activeSimulatedProfessionalId;

    return (
      <div 
        key={lead.id} 
        className={`p-3 bg-slate-950 border rounded-xl space-y-2.5 transition-all shadow-sm ${
          isAssignedToSimulated
            ? 'ring-2 ring-cyan-400 border-cyan-500 bg-cyan-950/20 shadow-cyan-950/50'
            : isLanding 
            ? 'border-cyan-700/50 hover:border-cyan-500/80 bg-gradient-to-b from-cyan-950/20 via-slate-950 to-slate-950 shadow-cyan-950/20' 
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* Top: Origem Seal & Sector */}
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <div className="flex items-center gap-1">
            {renderOriginSeal(lead.origem, true)}
            {isAssignedToSimulated && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-600 font-bold flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Atribuído a você
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            {lead.sectorLabel}
          </span>
        </div>

        {/* Lead Name & Score Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <strong className="text-xs font-bold text-slate-100 leading-snug block truncate" title={lead.name}>
              {lead.name}
            </strong>
            <div className="text-[10px] font-mono text-slate-400">CNPJ: {lead.cnpj}</div>
          </div>
          <div className="flex-shrink-0">
            {renderScoreBadge(lead.scoreAderencia, true)}
          </div>
        </div>

        {/* Destaque de Qualificação Fiscal da Landing Page (quando preenchido) */}
        {(lead.cnae || lead.faixaCreditoEstimado || (lead.tesesAplicaveis && lead.tesesAplicaveis.length > 0)) && (
          <div className={`p-2 rounded-lg border text-[10px] space-y-1.5 ${
            isLanding 
              ? 'bg-cyan-950/30 border-cyan-800/60' 
              : 'bg-slate-900/70 border-slate-800/80'
          }`}>
            {lead.cnae && (
              <div className="flex items-center justify-between font-mono text-slate-300 gap-1">
                <span className="text-slate-400 text-[9px]">CNAE:</span>
                <span className="truncate text-slate-200 text-[9px]" title={lead.cnae}>
                  {lead.cnae.split(' - ')[0]}
                </span>
                {lead.regimeTributarioEstimado && (
                  <span className="text-sky-300 px-1 py-0.2 rounded bg-sky-950/80 border border-sky-800/60 text-[8px] font-bold">
                    {lead.regimeTributarioEstimado}
                  </span>
                )}
              </div>
            )}
            {lead.faixaCreditoEstimado && (
              <div className="flex items-center justify-between font-mono pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[9px]">Crédito Est.:</span>
                <span className="text-cyan-300 font-bold text-[9px]">{lead.faixaCreditoEstimado}</span>
              </div>
            )}
            {lead.tesesAplicaveis && lead.tesesAplicaveis.length > 0 && (
              <div className="pt-1 border-t border-slate-800/60 flex flex-wrap gap-1">
                {lead.tesesAplicaveis.slice(0, 2).map((tese, i) => (
                  <span key={i} className="text-[8px] font-mono px-1 py-0.5 rounded bg-slate-900 text-teal-300 border border-teal-800/50 truncate max-w-[190px]">
                    ✓ {tese}
                  </span>
                ))}
                {lead.tesesAplicaveis.length > 2 && (
                  <span className="text-[8px] font-mono text-slate-400 px-1">
                    +{lead.tesesAplicaveis.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Commercial Values */}
        <div className="flex items-center justify-between text-[11px] text-slate-300">
          <span>MRR Estimado:</span>
          <strong className="text-emerald-400 font-mono">
            R$ {lead.estimatedMrrBrl.toLocaleString('pt-BR')}
          </strong>
        </div>

        {lead.notes && (
          <div className="text-[10px] text-slate-400 italic bg-slate-900/60 p-1.5 rounded border border-slate-800/60 line-clamp-2">
            "{lead.notes}"
          </div>
        )}

        {/* Footer: Responsável, Inspecionar & Stage Navigation */}
        <div className="pt-2 border-t border-slate-800/60 space-y-2">
          {/* Status de Distribuição e Responsável Tributário */}
          {isWaiting ? (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/50 border border-amber-800/80 text-[10px] text-amber-300 font-mono">
              <span className="flex items-center gap-1 font-bold">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                Fila de Espera (Aguardando Vaga)
              </span>
              <button
                type="button"
                onClick={() => setLeadForReassignment(lead)}
                className="px-1.5 py-0.5 rounded bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-bold border border-amber-700 text-[9px] cursor-pointer"
              >
                Atribuir
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[10px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`p-1 rounded shrink-0 ${
                  lead.responsibleRole === 'Advogado' 
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {lead.responsibleRole === 'Advogado' ? <Briefcase className="w-3 h-3" /> : <Receipt className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-slate-200 truncate">{lead.responsibleName}</span>
                    {lead.responsibleRole && (
                      <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
                        lead.responsibleRole === 'Advogado' 
                          ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {lead.responsibleRole}
                      </span>
                    )}
                  </div>
                  {lead.assignedAt && (
                    <div className="text-[9px] font-mono text-slate-400">Atribuído: {lead.assignedAt}</div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeadForReassignment(lead)}
                title="Reatribuir lead para outro profissional (Override)"
                className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="font-mono text-[9px]">Status: {lead.assignmentStatus === 'ASSIGNED' ? 'Em carteira' : 'Aguardando'}</span>
            <button
              onClick={() => setSelectedLeadForInspection(lead)}
              className="text-cyan-400 hover:text-cyan-300 font-mono font-medium flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              <span>Ver Diagnóstico</span>
            </button>
          </div>

          {/* Action Buttons depending on stage */}
          <div className="flex items-center gap-1.5 pt-1">
            {lead.stage === 'lead' && (
              <button
                onClick={() => handleMoveProspectStage(lead.id, 'proposal_sent')}
                className="w-full py-1.5 px-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Avançar para Proposta</span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
              </button>
            )}
            {lead.stage === 'proposal_sent' && (
              <>
                <button
                  onClick={() => handleMoveProspectStage(lead.id, 'lead')}
                  className="px-2 py-1 rounded bg-slate-900 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={() => handleMoveProspectStage(lead.id, 'negotiation')}
                  className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-sky-300 border border-sky-800 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Negociação</span>
                  <ArrowRight className="w-3 h-3 text-sky-400" />
                </button>
              </>
            )}
            {lead.stage === 'negotiation' && (
              <>
                <button
                  onClick={() => handleMoveProspectStage(lead.id, 'proposal_sent')}
                  className="px-2 py-1 rounded bg-slate-900 text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={() => handleMoveProspectStage(lead.id, 'closed')}
                  className="flex-1 py-1 px-2 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-[10px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Fechar Venda</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                </button>
              </>
            )}
            {lead.stage === 'closed' && (
              <div className="w-full space-y-1">
                <button
                  onClick={() => handleRequestProvisioning(lead)}
                  className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Solicitar Provisionamento</span>
                </button>
                <p className="text-[8px] font-mono text-slate-500 text-center">
                  * Registra pedido de ativação Super-Admin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Request Provisioning from Commercial (Mocked Action)
  const handleRequestProvisioning = (lead: ProspectLead) => {
    recordAuditLog(
      lead.responsibleName || 'Comercial Velatrix',
      'Comercial',
      'PROVISION_REQUESTED',
      'Solicitação de provisionamento de tenant',
      `Solicitou ao Super-Admin o provisionamento do novo tenant "${lead.name}" (CNPJ: ${lead.cnpj}, MRR: R$ ${lead.estimatedMrrBrl.toLocaleString('pt-BR')}).`
    );
    setRequestProvisionSuccess(`Solicitação de provisionamento para "${lead.name}" registrada com sucesso e encaminhada ao Super-Admin.`);
    setTimeout(() => setRequestProvisionSuccess(null), 5000);
  };

  // Move Onboarding Stage
  const handleMoveOnboardingStage = (projectId: string, newStage: OnboardingProject['stage']) => {
    const proj = onboardingProjects.find(p => p.id === projectId);
    setOnboardingProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const progressMap = {
          'onboarding_started': 20,
          'connectors_configured': 55,
          'training': 80,
          'live': 100
        };
        return { ...p, stage: newStage, progressPercent: progressMap[newStage] };
      }
      return p;
    }));

    if (proj) {
      const stageNames: Record<string, string> = {
        onboarding_started: 'Onboarding Iniciado',
        connectors_configured: 'Conectores Configurados',
        training: 'Treinamento C-Level',
        live: 'Produção Live'
      };
      recordAuditLog(
        proj.leadEngineer || 'Engenheiro de Implantação',
        'Implantação',
        'ONBOARDING_STAGE_CHANGED',
        `Etapa de onboarding alterada para ${stageNames[newStage]}`,
        `Cliente "${proj.clientName}" avançou para "${stageNames[newStage]}".`
      );
    }
  };

  // Toggle Employee Status
  const handleToggleEmployeeStatus = (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const newStatus = emp.status === 'Ativo' ? 'Afastado' : 'Ativo';

    setEmployees(prev => prev.map(e => {
      if (e.id === id) {
        return { ...e, status: newStatus };
      }
      return e;
    }));

    recordAuditLog(
      'Juliana Paes Ribeiro',
      'RH',
      'EMPLOYEE_STATUS_CHANGED',
      `Status do colaborador alterado para ${newStatus}`,
      `Alterou o status funcional de "${emp.name}" (${emp.roleTitle}) para "${newStatus}".`
    );
  };

  // Create New Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeForm.name.trim() || !newEmployeeForm.email.trim()) return;

    const finalBankName = newEmployeeForm.bankName === 'Outro Banco...' && newEmployeeForm.customBankName.trim()
      ? newEmployeeForm.customBankName.trim()
      : newEmployeeForm.bankName;

    const newEmp: OfficeEmployee = {
      id: `emp_${Date.now()}`,
      name: newEmployeeForm.name.trim(),
      email: newEmployeeForm.email.trim(),
      department: newEmployeeForm.department,
      roleTitle: newEmployeeForm.roleTitle.trim() || 'Especialista',
      systemAccessRole: newEmployeeForm.systemAccessRole,
      salaryBrl: Number(newEmployeeForm.salaryBrl) || 10500,
      status: 'Ativo',
      admissionDate: new Date().toISOString().slice(0, 10),
      bankDetails: {
        bankName: finalBankName,
        agency: newEmployeeForm.agency.trim() || '0001',
        accountNumber: newEmployeeForm.accountNumber.trim() || '12345-6',
        accountType: newEmployeeForm.accountType,
        pixKey: newEmployeeForm.pixKey.trim() || newEmployeeForm.email.trim(),
        pixKeyType: newEmployeeForm.pixKeyType
      }
    };

    setEmployees(prev => [newEmp, ...prev]);
    recordAuditLog(
      'Beatriz Vasconcelos',
      'RH',
      'EMPLOYEE_CREATED',
      `Novo colaborador cadastrado (${newEmp.name})`,
      `Cadastrou "${newEmp.name}" como "${newEmp.roleTitle}" no setor "${newEmp.department}" (Salário: R$ ${newEmp.salaryBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Dados bancários registrados e blindados por RLS (${newEmp.bankDetails?.bankName}).`
    );

    setIsAddEmployeeModalOpen(false);
    setNewEmployeeForm(initialNewEmployeeForm);
  };

  // Open Edit Employee Modal
  const handleOpenEditEmployee = (emp: OfficeEmployee) => {
    const isCustomBank = emp.bankDetails?.bankName && !BRAZILIAN_BANKS.slice(0, -1).includes(emp.bankDetails.bankName);
    setEditingEmployee(emp);
    setEditEmployeeForm({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      department: emp.department,
      roleTitle: emp.roleTitle,
      systemAccessRole: (emp.systemAccessRole.includes('Comercial') ? 'Comercial' : 
                         emp.systemAccessRole.includes('Gerente') ? 'Gerente' :
                         emp.systemAccessRole.includes('Implantação') ? 'Implantação' :
                         emp.systemAccessRole.includes('RH') ? 'RH' :
                         emp.systemAccessRole.includes('Advogado') ? 'Advogado' :
                         emp.systemAccessRole.includes('Contador') ? 'Contador' : 'Comercial') as any,
      salaryBrl: emp.salaryBrl || 10500,
      status: emp.status,
      bankName: isCustomBank ? 'Outro Banco...' : (emp.bankDetails?.bankName || '341 - Itaú Unibanco S/A'),
      customBankName: isCustomBank ? (emp.bankDetails?.bankName || '') : '',
      agency: emp.bankDetails?.agency || '',
      accountNumber: emp.bankDetails?.accountNumber || '',
      accountType: emp.bankDetails?.accountType || 'Corrente',
      pixKey: emp.bankDetails?.pixKey || '',
      pixKeyType: emp.bankDetails?.pixKeyType || 'CPF'
    });
    setIsEditEmployeeModalOpen(true);
  };

  // Save Edit Employee
  const handleSaveEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editEmployeeForm) return;

    const finalBankName = editEmployeeForm.bankName === 'Outro Banco...' && editEmployeeForm.customBankName.trim()
      ? editEmployeeForm.customBankName.trim()
      : editEmployeeForm.bankName;

    const updatedEmp: OfficeEmployee = {
      ...editingEmployee,
      name: editEmployeeForm.name.trim(),
      email: editEmployeeForm.email.trim(),
      department: editEmployeeForm.department,
      roleTitle: editEmployeeForm.roleTitle.trim(),
      systemAccessRole: editEmployeeForm.systemAccessRole,
      salaryBrl: Number(editEmployeeForm.salaryBrl) || 10500,
      status: editEmployeeForm.status,
      bankDetails: {
        bankName: finalBankName,
        agency: editEmployeeForm.agency.trim() || '0001',
        accountNumber: editEmployeeForm.accountNumber.trim() || '12345-6',
        accountType: editEmployeeForm.accountType,
        pixKey: editEmployeeForm.pixKey.trim() || editEmployeeForm.email.trim(),
        pixKeyType: editEmployeeForm.pixKeyType
      }
    };

    setEmployees(prev => prev.map(emp => emp.id === updatedEmp.id ? updatedEmp : emp));

    recordAuditLog(
      'Beatriz Vasconcelos',
      'RH',
      'EMPLOYEE_STATUS_CHANGED',
      `Cadastro e dados bancários atualizados (${updatedEmp.name})`,
      `Atualizou dados cadastrais e bancários de "${updatedEmp.name}". Banco: ${updatedEmp.bankDetails?.bankName}, Agência: ${updatedEmp.bankDetails?.agency}, Conta: ${updatedEmp.bankDetails?.accountNumber}, PIX: ${updatedEmp.bankDetails?.pixKey}.`
    );

    setIsEditEmployeeModalOpen(false);
    setEditingEmployee(null);
  };

  // Toggle Contract Status
  const handleNextContractStatus = (id: string) => {
    const ctr = contracts.find(c => c.id === id);
    if (!ctr) return;

    const nextStatusMap: Record<string, ClientContract['status']> = {
      'Rascunho': 'Em Assinatura',
      'Em Assinatura': 'Assinado',
      'Assinado': 'Assinado'
    };
    const nextStatus = nextStatusMap[ctr.status] || 'Assinado';

    setContracts(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, status: nextStatus };
      }
      return c;
    }));

    recordAuditLog(
      ctr.assignedLawyer || 'Dr. Leonardo Castilho',
      'Advogado',
      'CONTRACT_STATUS_CHANGED',
      `Contrato ${ctr.contractNumber} avançou para ${nextStatus}`,
      `Atualizou o status da minuta do cliente "${ctr.clientName}" de "${ctr.status}" para "${nextStatus}".`
    );
  };

  // Derived Financials for Manager & Accounting from Super-Admin Tenants
  const totalMrr = tenantsList.reduce((acc, t) => {
    const planKey = (t.planTier || 'STARTER') as PlanTier;
    const price = t.mrrBrl || VELATRIX_PLAN_TIERS[planKey]?.monthlyPriceBrl || VELATRIX_PLAN_TIERS.STARTER.monthlyPriceBrl;
    return acc + price;
  }, 0);
  const totalArr = totalMrr * 12;

  // Billing entries generated dynamically from tenants
  const billingEntries: BillingEntry[] = tenantsList.map((t, idx) => {
    const planKey = (t.planTier || 'STARTER') as PlanTier;
    const price = t.mrrBrl || VELATRIX_PLAN_TIERS[planKey]?.monthlyPriceBrl || VELATRIX_PLAN_TIERS.STARTER.monthlyPriceBrl;
    const statuses: ('Pago' | 'Pendente' | 'Atrasado')[] = ['Pago', 'Pago', 'Pendente', 'Pago', 'Atrasado', 'Pago'];
    return {
      id: `bill_${t.id}`,
      tenantId: t.id,
      clientName: t.name,
      cnpj: t.cnpj,
      planTier: `Plano ${t.planTier || 'PROFESSIONAL'}`,
      amountBrl: price,
      dueDate: `10/${new Date().getMonth() + 1}/2026`,
      billingStatus: statuses[idx % statuses.length],
      invoiceNumber: `NF-e ${8200 + idx}`,
      paymentMethod: idx % 2 === 0 ? 'Boleto Bancário / DDA' : 'Transferência PIX / TED'
    };
  });

  // Handler: Export Full Billing Report (PDF)
  const handleExportBillingReportPdf = () => {
    try {
      setIsExportingBillingReport(true);
      const paidCount = billingEntries.filter(b => b.billingStatus === 'Pago').length;
      const pendingCount = billingEntries.filter(b => b.billingStatus === 'Pendente').length;
      const overdueCount = billingEntries.filter(b => b.billingStatus === 'Atrasado').length;

      generateBillingReportPdf({
        items: billingEntries,
        totalMrr,
        paidCount,
        pendingCount,
        overdueCount
      });

      recordAuditLog(
        'Ana Beatriz Souza',
        'Contador',
        'PRE_INVOICE_GENERATED',
        'Relatório de faturamento executivo exportado',
        `Exportou relatório consolidado de faturamento com ${billingEntries.length} tenants e MRR de R$ ${totalMrr.toLocaleString('pt-BR')}.`
      );

      setBillingExportSuccess(true);
      setTimeout(() => setBillingExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating billing report PDF:', err);
    } finally {
      setIsExportingBillingReport(false);
    }
  };

  // Handler: Export Billing CSV (Client-side)
  const handleExportBillingReportCsv = () => {
    const headers = ['Tenant / Razao Social', 'CNPJ', 'Plano', 'Fatura / NFe', 'Vencimento', 'Valor Mensal (BRL)', 'Metodo', 'Status'];
    const rows = billingEntries.map(b => [
      `"${b.clientName.replace(/"/g, '""')}"`,
      `"${b.cnpj}"`,
      `"${b.planTier}"`,
      `"${b.invoiceNumber}"`,
      `"${b.dueDate}"`,
      b.amountBrl,
      `"${b.paymentMethod}"`,
      `"${b.billingStatus}"`
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      `"TOTAL CONSOLIDADO (MRR)";"";"";"";"";${totalMrr};"";""`
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `VELATRIX_Faturamento_Consolidado_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler: Download Pre-Invoice PDF
  const handleDownloadPreInvoicePdf = (bill: BillingEntry) => {
    generatePreInvoicePdf({
      clientName: bill.clientName,
      cnpj: bill.cnpj,
      planTier: bill.planTier,
      invoiceNumber: bill.invoiceNumber,
      amountBrl: bill.amountBrl,
      dueDate: bill.dueDate,
      paymentMethod: bill.paymentMethod,
      billingStatus: bill.billingStatus,
      terms: [
        'Licenciamento mensal de plataforma de agentes autônomos Velatrix AOS.',
        'Auditoria contínua de invariantes operacionais e conciliação de conectores ERP.',
        'Aviso: Este documento é uma prévia demonstrativa e NÃO substitui a NF-e fiscal definitiva.'
      ]
    });

    recordAuditLog(
      'Ana Beatriz Souza',
      'Contador',
      'PRE_INVOICE_GENERATED',
      `Pré-fatura emitida para ${bill.clientName}`,
      `Gerou pré-fatura mockada (${bill.invoiceNumber}) no valor de R$ ${bill.amountBrl.toLocaleString('pt-BR')}.`
    );
  };

  // Handler: Share Pre-Invoice WhatsApp
  const handleSharePreInvoiceWhatsApp = (bill: BillingEntry) => {
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amountBrl);
    const text = `*PRÉ-FATURA / PROPOSTA DE COBRANÇA — VELATRIX AOS*

*Cliente:* ${bill.clientName}
*CNPJ:* ${bill.cnpj}
*Plano Contratado:* ${bill.planTier}
*Referência Fatura:* ${bill.invoiceNumber}
*Vencimento:* ${bill.dueDate}
*Valor Mensal:* *${formattedAmount}*
*Forma de Liquidação:* ${bill.paymentMethod}

⚠️ *AVISO OBRIGATÓRIO:* Documento mockado de pré-fatura / proposta comercial. *NÃO é documento fiscal válido (NF-e).* O documento fiscal definitivo será emitido pós-liquidação.

*Favor anexar manualmente o PDF da Pré-Fatura baixado no sistema a esta conversa.*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // Handler: Share Pre-Invoice Email
  const handleSharePreInvoiceEmail = (bill: BillingEntry) => {
    const formattedAmount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amountBrl);
    const subject = `Pré-Fatura de Serviços & Licenciamento AOS — ${bill.clientName} (${bill.invoiceNumber})`;
    const body = `Prezados(as) do Departamento Financeiro de ${bill.clientName},

Segue a discriminação da Pré-Fatura / Proposta de Cobrança referente à assinatura da plataforma de Inteligência Operacional Velatrix AOS:

1. DADOS DO CLIENTE
- Razão Social: ${bill.clientName}
- CNPJ: ${bill.cnpj}

2. DETALHES DA COBRANÇA
- Plano: ${bill.planTier}
- Referência: ${bill.invoiceNumber}
- Vencimento: ${bill.dueDate}
- Valor: ${formattedAmount}
- Forma de Pagamento: ${bill.paymentMethod}
- Status: ${bill.billingStatus}

AVISO OBRIGATÓRIO:
Este documento é uma prévia demonstrativa / proposta e NÃO constitui documento fiscal válido (NF-e). A Nota Fiscal de Serviços Eletrônica (NFS-e) será emitida após a liquidação bancária.

IMPORTANTE: O PDF detalhado da Pré-Fatura foi gerado pelo sistema e deve ser anexado manualmente a esta mensagem.

Atenciosamente,
Controladoria & Faturamento
Velatrix Autonomic Operating System`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const rolesConfig: { id: OfficeRole; label: string; icon: React.ComponentType<any>; description: string; badgeColor: string }[] = [
    {
      id: 'commercial',
      label: 'Comercial',
      icon: TrendingUp,
      description: 'Acesso restrito ao Funil de Vendas & Solicitação de Tenant',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
    },
    {
      id: 'manager',
      label: 'Gerente',
      icon: Layers,
      description: 'Visão Executiva Consolidada & Auditoria Interna (Somente Leitura)',
      badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800'
    },
    {
      id: 'onboarding',
      label: 'Implantação',
      icon: HardHat,
      description: 'Kanban Técnico de Setup & Conector ERP (Somente Leitura)',
      badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800'
    },
    {
      id: 'hr',
      label: 'RH',
      icon: UserCheck,
      description: 'Gestão do Quadro de Colaboradores & Auditoria Interna',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800'
    },
    {
      id: 'legal',
      label: 'Advogado',
      icon: FileSignature,
      description: 'Acesso restrito ao Repositório de Contratos & Minutas',
      badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800'
    },
    {
      id: 'accounting',
      label: 'Contador',
      icon: Receipt,
      description: 'Acesso restrito a Faturamento, Cobrança & Pré-Fatura',
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
    }
  ];

  // Can view internal audit log: Manager, HR or when Super-Admin mode is on
  const canViewInternalAudit = currentOfficeRole === 'manager' || currentOfficeRole === 'hr' || isSuperAdmin;
  // Can view ERP connectors: Onboarding or Super-Admin
  const canViewConnectors = currentOfficeRole === 'onboarding' || isSuperAdmin;

  return (
    <div id="velatrix-office-root" className="min-h-screen bg-[var(--vx-deep)] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* 1. FIXED PROTOTYPE BANNER */}
      <div className="bg-gradient-to-r from-violet-950/60 via-slate-900 to-violet-950/60 border border-violet-500/40 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40 shrink-0">
            <Building2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              <span>PROTÓTIPO — DADOS SIMULADOS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-900/80 text-violet-200 border border-violet-700 font-mono">
                Escritório Interno Velatrix
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Ambiente de gestão operacional e administrativa da equipe Velatrix com <strong>Restrição de Acesso por Papel</strong>. Selecione o papel abaixo para simular o escopo exato de permissões.
            </p>
          </div>
        </div>

        {/* Super Admin indicator or direct link if available */}
        {onNavigateToSuperAdminTenantManager && (
          <button
            onClick={onNavigateToSuperAdminTenantManager}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
            <span>Super-Admin (Exclusivo)</span>
          </button>
        )}
      </div>

      {/* 2. MOCKED ROLE SELECTOR (6 ROLES) */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Seletor de Papel do Escritório (Simulação de Acesso Restrito)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Papel Selecionado: <strong className="text-violet-300 font-bold">{rolesConfig.find(r => r.id === currentOfficeRole)?.label}</strong>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-mono">
              Visão Isolada
            </span>
          </div>
        </div>

        {/* 6 Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {rolesConfig.map(role => {
            const isActive = currentOfficeRole === role.id;
            const Icon = role.icon;

            return (
              <button
                key={role.id}
                onClick={() => {
                  setCurrentOfficeRole(role.id);
                  setActiveInternalSubTab('main');
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 relative ${
                  isActive
                    ? 'bg-gradient-to-br from-violet-950/80 to-slate-900 border-violet-500 text-white shadow-lg shadow-violet-950/40 ring-1 ring-violet-500/50'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                {isActive && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                )}
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-300' : 'text-slate-500'}`} />
                  <strong className="text-xs font-bold">{role.label}</strong>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-1">
                  {role.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contextual Sub-Navigation Bar for roles with extra sub-views (Manager/HR/Onboarding) */}
        {(canViewInternalAudit || canViewConnectors) && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs flex-wrap">
            <span className="text-[11px] text-slate-400 font-mono mr-1">Módulos do Papel:</span>
            
            <button
              onClick={() => setActiveInternalSubTab('main')}
              className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                activeInternalSubTab === 'main'
                  ? 'bg-violet-950 text-violet-200 border-violet-700'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Visão Principal ({rolesConfig.find(r => r.id === currentOfficeRole)?.label})
            </button>

            {(currentOfficeRole === 'manager' || currentOfficeRole === 'hr') && (
              <button
                onClick={() => setActiveInternalSubTab('distribution')}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeInternalSubTab === 'distribution'
                    ? 'bg-cyan-950 text-cyan-200 border-cyan-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Scale className="w-3 h-3 text-cyan-400" />
                <span>Motor de Distribuição & Equipe Tributária ({taxProfessionals.length})</span>
              </button>
            )}

            {canViewConnectors && currentOfficeRole === 'onboarding' && (
              <button
                onClick={() => setActiveInternalSubTab('connectors')}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeInternalSubTab === 'connectors'
                    ? 'bg-amber-950 text-amber-200 border-amber-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Network className="w-3 h-3 text-amber-400" />
                <span>Conectores ERP & Webhook (Leitura)</span>
              </button>
            )}

            {canViewInternalAudit && (
              <button
                onClick={() => setActiveInternalSubTab('audit')}
                className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeInternalSubTab === 'audit'
                    ? 'bg-purple-950 text-purple-200 border-purple-700'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <History className="w-3 h-3 text-purple-400" />
                <span>Auditoria Interna & Logs ({internalAuditLogs.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Request Provisioning Toast Banner */}
      {requestProvisionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{requestProvisionSuccess}</span>
          </div>
          <button
            onClick={() => setRequestProvisionSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-mono"
          >
            Fechar
          </button>
        </div>
      )}

      {/* 3. CONDITIONAL TAB RENDERING BASED ON STRICT ROLE RESTRICTION */}

      {/* SUB-VIEW: AUDITORIA INTERNA (Visível para Gerente, RH e Super-Admin) */}
      {activeInternalSubTab === 'audit' && canViewInternalAudit && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 uppercase font-bold">
                  PROTÓTIPO — DADOS SIMULADOS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  Gerente / RH / Super-Admin
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <History className="w-4 h-4 text-purple-400" />
                Auditoria Interna & Trilha de Ações do Escritório Velatrix
              </h2>
              <p className="text-xs text-slate-400">
                Registro cronológico em tempo real de movimentações no funil comercial, emissão de pré-faturas, alteração de contratos e setup de implantação.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar logs por colaborador ou ação..."
                  value={searchAuditLog}
                  onChange={e => setSearchAuditLog(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-64"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-950/60">
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Papel</th>
                    <th className="py-3 px-4">Ação Realizada</th>
                    <th className="py-3 px-4">Detalhamento da Operação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {internalAuditLogs
                    .filter(log => 
                      log.employeeName.toLowerCase().includes(searchAuditLog.toLowerCase()) ||
                      log.actionSummary.toLowerCase().includes(searchAuditLog.toLowerCase()) ||
                      log.details.toLowerCase().includes(searchAuditLog.toLowerCase()) ||
                      log.employeeRole.toLowerCase().includes(searchAuditLog.toLowerCase())
                    )
                    .map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-200">{log.employeeName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-purple-300 font-bold">
                            {log.employeeRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-cyan-300 font-medium text-[11px]">{log.actionSummary}</td>
                        <td className="py-3 px-4 text-slate-300 font-sans text-xs">{log.details}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW: CONECTOR ERP (Somente Leitura para Implantação) */}
      {activeInternalSubTab === 'connectors' && canViewConnectors && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 uppercase font-bold">
                  ACESSO SOMENTE LEITURA
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  Implantação
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <Network className="w-4 h-4 text-amber-400" />
                Conector ERP & Webhooks (Visão Técnica do Engenheiro)
              </h2>
              <p className="text-xs text-slate-400">
                Visualização do estado dos adaptadores de ingestão (TOTVS, SAP, Senior) e endpoints de webhook em telemetria.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 font-mono">TOTVS Protheus REST</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  ✓ Ativo (200 OK)
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Endpoint: <span className="text-slate-200">https://api.aos.velatrix.internal/totvs/v2</span></div>
                <div>Latência: <span className="text-emerald-400">18ms</span></div>
                <div>Último Sync: <span className="text-slate-300">Há 4 minutos</span></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-300 font-mono">SAP NetWeaver RFC / OData</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  ✓ Ativo (200 OK)
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Endpoint: <span className="text-slate-200">https://api.aos.velatrix.internal/sap/rfc</span></div>
                <div>Latência: <span className="text-emerald-400">32ms</span></div>
                <div>Último Sync: <span className="text-slate-300">Há 1 minuto</span></div>
              </div>
            </div>

            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-300 font-mono">Senior Sapiens ERP Webhook</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                  ⏳ Aguardando Homologação
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 space-y-1">
                <div>Endpoint: <span className="text-slate-200">https://webhook.velatrix.ai/senior/ingress</span></div>
                <div>Status: <span className="text-amber-400">Em setup no cliente</span></div>
                <div>Lead: <span className="text-slate-300">Lucas Menezes</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW: MOTOR DE DISTRIBUIÇÃO & EQUIPE TRIBUTÁRIA (Visível para Gerente e RH) */}
      {activeInternalSubTab === 'distribution' && (currentOfficeRole === 'manager' || currentOfficeRole === 'hr') && (
        <TaxDistributionEnginePanel
          taxProfessionals={taxProfessionals}
          prospects={prospects}
          onUpdateProfessionals={setTaxProfessionals}
          onUpdateProspects={setProspects}
          onRecordAuditLog={recordAuditLog}
          onOpenReassignModal={(lead) => setLeadForReassignment(lead)}
          currentUserRole={currentOfficeRole}
        />
      )}

      {/* TAB 1: COMERCIAL (Visualiza estritamente o Kanban com ação "Solicitar Provisionamento" e Qualificação de Leads) */}
      {currentOfficeRole === 'commercial' && activeInternalSubTab === 'main' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Quick Metrics Bar: Leads com Diagnóstico Fiscal Automático & Eficácia do Canal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Metric 1: Leads Landing Page & Score Médio */}
            <div className="p-3.5 bg-[var(--vx-deep)] border border-cyan-800/40 rounded-xl bg-gradient-to-b from-cyan-950/20 to-transparent flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5 uppercase">
                  <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  Diagnóstico Fiscal Automático
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  Landing Page
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-bold font-mono text-cyan-300">
                    {prospects.filter(p => p.origem === 'LANDING_PAGE').length}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">leads qualificados</span>
                </div>
                {(() => {
                  const lps = prospects.filter(p => p.origem === 'LANDING_PAGE');
                  const avg = lps.length > 0 ? Math.round(lps.reduce((acc, p) => acc + (p.scoreAderencia ?? 0), 0) / lps.length) : 0;
                  return (
                    <div className="text-right">
                      <div className="text-[9px] text-slate-400 font-mono">Score Médio</div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {avg}/100
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Alta Aderência (&gt;75):</span>
                <strong className="text-emerald-400 font-mono">
                  {prospects.filter(p => p.origem === 'LANDING_PAGE' && (p.scoreAderencia ?? 0) > 75).length} leads
                </strong>
              </div>
            </div>

            {/* Metric 2: Prioridade Comercial (>75 Alta Aderência) */}
            <div className="p-3.5 bg-[var(--vx-deep)] border border-emerald-900/40 rounded-xl bg-gradient-to-b from-emerald-950/15 to-transparent flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Prioridade Alta Aderência
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Score &gt; 75
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-bold font-mono text-emerald-300">
                    {prospects.filter(p => (p.scoreAderencia ?? 0) > 75).length}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">leads no topo da fila</span>
                </div>
                <button
                  onClick={() => {
                    setScoreFilter(scoreFilter === 'HIGH' ? 'ALL' : 'HIGH');
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    scoreFilter === 'HIGH' 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900'
                  }`}
                >
                  {scoreFilter === 'HIGH' ? 'Filtro Ativo ✓' : 'Filtrar >75'}
                </button>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Prontos para fechamento:</span>
                <span className="text-slate-300 font-mono">
                  {prospects.filter(p => (p.scoreAderencia ?? 0) > 75 && (p.stage === 'lead' || p.stage === 'proposal_sent')).length} em prospecção
                </span>
              </div>
            </div>

            {/* Metric 3: Origem dos Leads no Funil */}
            <div className="p-3.5 bg-[var(--vx-deep)] border border-slate-800 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5 uppercase">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  Distribuição por Canal
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {prospects.length} total
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div 
                  onClick={() => setOriginFilter(originFilter === 'LANDING_PAGE' ? 'ALL' : 'LANDING_PAGE')}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    originFilter === 'LANDING_PAGE' ? 'bg-cyan-950 border-cyan-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[8px] font-mono text-cyan-400">Landing Page</div>
                  <strong className="text-xs font-mono text-cyan-200">{prospects.filter(p => p.origem === 'LANDING_PAGE').length}</strong>
                </div>
                <div 
                  onClick={() => setOriginFilter(originFilter === 'MAPS_MANUAL' ? 'ALL' : 'MAPS_MANUAL')}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    originFilter === 'MAPS_MANUAL' ? 'bg-amber-950 border-amber-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[8px] font-mono text-amber-400">Maps Manual</div>
                  <strong className="text-xs font-mono text-amber-200">{prospects.filter(p => p.origem === 'MAPS_MANUAL').length}</strong>
                </div>
                <div 
                  onClick={() => setOriginFilter(originFilter === 'INDICACAO_PARCEIRO' ? 'ALL' : 'INDICACAO_PARCEIRO')}
                  className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                    originFilter === 'INDICACAO_PARCEIRO' ? 'bg-purple-950 border-purple-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[8px] font-mono text-purple-400">Parceiros</div>
                  <strong className="text-xs font-mono text-purple-200">{prospects.filter(p => p.origem === 'INDICACAO_PARCEIRO').length}</strong>
                </div>
              </div>
              <div className="mt-2 pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-400 text-center">
                Clique no canal acima para filtrar
              </div>
            </div>

            {/* Action Card: Botão de Cadastro de Empresa Coletada (Captação) */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 to-[var(--vx-deep)] border border-slate-800 rounded-xl flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-200 flex items-center gap-1.5 uppercase">
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                    Módulo de Captação
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                    SDR Inbound/Outbound
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cadastre empresas manuais ou visualize leads que chegam da Landing Page com diagnóstico fiscal.
                </p>
              </div>

              <button
                onClick={() => setIsLeadCaptureModalOpen(true)}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-cyan-950/40 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Cadastro de Empresa Coletada</span>
              </button>
            </div>
          </div>

          {/* Notificação Visual: Atribuição Automática Recente pelo Motor */}
          {lastAssignedToast && (
            <div className="p-3 bg-cyan-950/80 border border-cyan-500/60 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in shadow-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-900 flex items-center justify-center text-cyan-300 shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-cyan-200">Distribuição Operacional Automática:</span>{' '}
                  <strong className="text-slate-100 font-mono">"{lastAssignedToast.leadName}"</strong> foi direcionado para{' '}
                  <span className="text-cyan-300 font-bold font-mono">{lastAssignedToast.profName} ({lastAssignedToast.profRole})</span>{' '}
                  via algoritmo de menor ocupação de carteira às {lastAssignedToast.timestamp}.
                </div>
              </div>
              <button 
                onClick={() => setLastAssignedToast(null)}
                className="text-cyan-400 hover:text-cyan-200 text-xs font-mono shrink-0 cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          )}

          {/* Barra de Simulação de Persona & Filtro "Meus Leads" */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                <Scale className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simular Visão:</span>
              </div>
              <select
                value={activeSimulatedProfessionalId}
                onChange={e => {
                  const val = e.target.value;
                  setActiveSimulatedProfessionalId(val);
                  if (val === 'ALL') {
                    setOnlyMyLeadsFilter(false);
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">👁️ Visão Geral (Gestor / Todos os Leads)</option>
                {taxProfessionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.role === 'Advogado' ? '⚖️' : '📊'} {prof.name} ({prof.role}) — {prof.activeLeadsCount}/{prof.maxCapacity} leads
                  </option>
                ))}
              </select>

              {activeSimulatedProfessionalId !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setOnlyMyLeadsFilter(!onlyMyLeadsFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    onlyMyLeadsFilter
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-600 shadow-sm shadow-cyan-950'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${onlyMyLeadsFilter ? 'text-cyan-400' : 'opacity-0'}`} />
                  <span>
                    Meus Leads Atribuídos ({prospects.filter(p => p.assignedProfessionalId === activeSimulatedProfessionalId).length})
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {(() => {
                const waitCount = prospects.filter(p => p.assignmentStatus === 'WAITING_DISTRIBUTION').length;
                if (waitCount > 0) {
                  return (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono flex items-center gap-1.5 font-bold animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {waitCount} lead(s) na Fila de Espera
                    </span>
                  );
                }
                return (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fila de espera zerada
                  </span>
                );
              })()}

              <button
                onClick={() => {
                  setCurrentOfficeRole('manager');
                  setActiveInternalSubTab('distribution');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/60 text-[11px] font-mono flex items-center gap-1.5 cursor-pointer"
                title="Acessar Gestão da Fila e Capacidade Tributária (Visão Gerente)"
              >
                <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                <span>Painel da Equipe</span>
              </button>
            </div>
          </div>

          {/* Search, Filter & Sorting Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[var(--vx-deep)] p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar prospect, CNPJ, CNAE ou tese fiscal..."
                  value={searchTermProspect}
                  onChange={e => setSearchTermProspect(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Filtro: Origem do Lead */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-slate-400">Origem:</span>
                <select
                  value={originFilter}
                  onChange={e => setOriginFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Todas as Origens ({prospects.length})</option>
                  <option value="LANDING_PAGE">⚡ Landing Page (Diagnóstico Fiscal) ({prospects.filter(p => p.origem === 'LANDING_PAGE').length})</option>
                  <option value="MAPS_MANUAL">📍 Cadastro Manual (Maps/Instagram) ({prospects.filter(p => p.origem === 'MAPS_MANUAL').length})</option>
                  <option value="INDICACAO_PARCEIRO">🤝 Indicação Parceiro ({prospects.filter(p => p.origem === 'INDICACAO_PARCEIRO').length})</option>
                </select>
              </div>

              {/* Filtro: Score de Aderência */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-slate-400">Score:</span>
                <select
                  value={scoreFilter}
                  onChange={e => setScoreFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">Todos os Scores</option>
                  <option value="HIGH">🟢 Alta Aderência (&gt; 75)</option>
                  <option value="MEDIUM">🟡 Média Aderência (50 - 75)</option>
                  <option value="LOW">⚪ Baixa Aderência (&lt; 50)</option>
                </select>
              </div>

              {/* Ordenação por Score ou MRR */}
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortByScore}
                  onChange={e => setSortByScore(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="DEFAULT">Ordem Padrão (Recentes)</option>
                  <option value="SCORE_DESC">Maior Score Primeiro (Prioridade)</option>
                  <option value="SCORE_ASC">Menor Score Primeiro</option>
                  <option value="MRR_DESC">Maior MRR Estimado</option>
                </select>
              </div>

              {/* Limpar Filtros se algum estiver ativo */}
              {(searchTermProspect || originFilter !== 'ALL' || scoreFilter !== 'ALL' || sortByScore !== 'DEFAULT') && (
                <button
                  onClick={() => {
                    setSearchTermProspect('');
                    setOriginFilter('ALL');
                    setScoreFilter('ALL');
                    setSortByScore('DEFAULT');
                  }}
                  className="px-2.5 py-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Kanban Board (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Column 1: Lead */}
            <div className="bg-[var(--vx-deep)] border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 font-mono">1. Lead Inicial</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold font-mono">
                  {getFilteredAndSortedProspects('lead').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {getFilteredAndSortedProspects('lead').length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                    Nenhum lead nesta etapa com os filtros selecionados.
                  </div>
                ) : (
                  getFilteredAndSortedProspects('lead').map(lead => renderLeadCard(lead))
                )}
              </div>
            </div>

            {/* Column 2: Proposta Enviada */}
            <div className="bg-[var(--vx-deep)] border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-sky-300 font-mono">2. Proposta Enviada</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold font-mono">
                  {getFilteredAndSortedProspects('proposal_sent').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {getFilteredAndSortedProspects('proposal_sent').length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                    Nenhuma proposta enviada com os filtros selecionados.
                  </div>
                ) : (
                  getFilteredAndSortedProspects('proposal_sent').map(lead => renderLeadCard(lead))
                )}
              </div>
            </div>

            {/* Column 3: Negociação */}
            <div className="bg-[var(--vx-deep)] border border-slate-800/90 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-300 font-mono">3. Em Negociação</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold font-mono">
                  {getFilteredAndSortedProspects('negotiation').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {getFilteredAndSortedProspects('negotiation').length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                    Nenhum em negociação com os filtros selecionados.
                  </div>
                ) : (
                  getFilteredAndSortedProspects('negotiation').map(lead => renderLeadCard(lead))
                )}
              </div>
            </div>

            {/* Column 4: Fechado (Comercial faz Solicitação de Provisionamento) */}
            <div className="bg-[var(--vx-deep)] border border-emerald-900/40 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px] bg-gradient-to-b from-emerald-950/20 to-transparent">
              <div className="flex items-center justify-between px-2 py-1 bg-emerald-950/60 rounded-xl border border-emerald-800/80">
                <span className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  4. Fechado (Venda Ganha)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 font-bold font-mono">
                  {getFilteredAndSortedProspects('closed').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {getFilteredAndSortedProspects('closed').length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
                    Nenhum contrato fechado com os filtros selecionados.
                  </div>
                ) : (
                  getFilteredAndSortedProspects('closed').map(lead => renderLeadCard(lead))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: GERENTE (PAINEL SOMENTE LEITURA CONSOLIDANDO TUDO SEM BOTÕES DE AÇÃO) */}
      {currentOfficeRole === 'manager' && activeInternalSubTab === 'main' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 uppercase font-bold">
                  PAPEL: GERENTE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                  Somente Leitura Consolidado
                </span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <Layers className="w-4 h-4 text-blue-400" />
                Painel Executivo do Gerente (Consolidado 360)
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhamento integrado de vendas, esteira técnica de implantação e fluxo financeiro sem permissão de mutação direta.
              </p>
            </div>
            
            <button
              onClick={() => setActiveInternalSubTab('audit')}
              className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <History className="w-4 h-4 text-purple-400" />
              <span>Ver Auditoria Interna</span>
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            
            {/* 1. Commercial Summary */}
            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">Funil Comercial</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Leads Iniciais:</span>
                  <strong className="font-mono text-slate-100">{prospects.filter(p => p.stage === 'lead').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Propostas Enviadas:</span>
                  <strong className="font-mono text-sky-300">{prospects.filter(p => p.stage === 'proposal_sent').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Em Negociação:</span>
                  <strong className="font-mono text-amber-300">{prospects.filter(p => p.stage === 'negotiation').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Contratos Fechados:</span>
                  <strong className="font-mono text-emerald-400">{prospects.filter(p => p.stage === 'closed').length}</strong>
                </div>
              </div>
            </div>

            {/* 2. Onboarding Pipeline */}
            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">Implantações em Andamento</span>
                <HardHat className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Onboarding Iniciado:</span>
                  <strong className="font-mono">{onboardingProjects.filter(p => p.stage === 'onboarding_started').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Conectores Configurados:</span>
                  <strong className="font-mono text-cyan-300">{onboardingProjects.filter(p => p.stage === 'connectors_configured').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Treinamento C-Level:</span>
                  <strong className="font-mono text-amber-300">{onboardingProjects.filter(p => p.stage === 'training').length}</strong>
                </div>
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Tenants Operando em Produção Live:</span>
                  <strong className="font-mono text-emerald-400">{onboardingProjects.filter(p => p.stage === 'live').length}</strong>
                </div>
              </div>
            </div>

            {/* 3. Financial Recurrence */}
            <div className="p-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">Receita Recorrente</span>
                <DollarSign className="w-4 h-4 text-[var(--vx-neon)]" />
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">MRR Consolidado Super-Admin</span>
                  <strong className="text-xl text-emerald-400 font-mono font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMrr)}
                  </strong>
                </div>
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-mono">ARR Projetado (12x MRR)</span>
                  <strong className="text-base text-slate-200 font-mono font-bold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalArr)}
                  </strong>
                </div>
              </div>
            </div>

            {/* 4. Diagnóstico Fiscal Automático (Landing Page) */}
            <div className="p-4 bg-[var(--vx-deep)] border border-cyan-800/50 rounded-2xl space-y-3 bg-gradient-to-b from-cyan-950/25 to-transparent">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
                <span className="text-xs font-bold text-cyan-300 uppercase font-mono flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  Diagnóstico Fiscal Automático
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold">
                  Landing Page
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                {(() => {
                  const landingLeads = prospects.filter(p => p.origem === 'LANDING_PAGE');
                  const countLanding = landingLeads.length;
                  const avgScore = countLanding > 0 
                    ? Math.round(landingLeads.reduce((acc, p) => acc + (p.scoreAderencia ?? 0), 0) / countLanding) 
                    : 0;
                  const highAdherenceCount = landingLeads.filter(p => (p.scoreAderencia ?? 0) > 75).length;
                  const mapsCount = prospects.filter(p => p.origem === 'MAPS_MANUAL').length;
                  const partnerCount = prospects.filter(p => p.origem === 'INDICACAO_PARCEIRO').length;

                  return (
                    <>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Leads da Landing Page:</span>
                        <strong className="font-mono text-cyan-300 text-sm">{countLanding} leads</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Score Médio de Aderência:</span>
                        <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-[11px]">
                          {avgScore} / 100
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Alta Aderência (&gt;75):</span>
                        <strong className="font-mono text-emerald-300">{highAdherenceCount} leads</strong>
                      </div>
                      <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400 font-mono">
                        <span>Outros: Maps ({mapsCount}) • Indicação ({partnerCount})</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* 5. Carga da Equipe Tributária & Motor de Distribuição */}
            {(() => {
              const summary = calculateTeamLoadSummary(taxProfessionals, prospects);
              return (
                <div className="p-4 bg-[var(--vx-deep)] border border-cyan-800/40 rounded-2xl space-y-3 bg-gradient-to-br from-cyan-950/20 to-transparent flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
                      <span className="text-xs font-bold text-cyan-300 uppercase font-mono flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-cyan-400" />
                        Carga da Equipe
                      </span>
                      <button
                        onClick={() => setActiveInternalSubTab('distribution')}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 underline cursor-pointer"
                      >
                        Gerenciar
                      </button>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono mt-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Fila Ativa:</span>
                        <strong className="text-slate-100">{summary.activeInQueueCount} de {summary.totalProfessionals}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Ocupação:</span>
                        <strong className="text-emerald-400">{summary.capacityUtilizationPercent}%</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Leads em Carteira:</span>
                        <strong className="text-cyan-300">{summary.totalActiveAssigned}/{summary.totalCapacity}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Fila de Espera:</span>
                        <strong className={summary.waitingQueueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}>
                          {summary.waitingQueueCount} aguardando
                        </strong>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveInternalSubTab('distribution')}
                    className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-mono text-[10px] font-bold text-center cursor-pointer transition-colors"
                  >
                    Painel da Equipe →
                  </button>
                </div>
              );
            })()}

          </div>

          {/* Detailed Read-Only Table of Onboarding Projects */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">
              Detalhamento de Projetos de Clientes em Andamento (Somente Leitura)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Cliente / Tenant</th>
                    <th className="py-2.5 px-3">Setor</th>
                    <th className="py-2.5 px-3">ERP Conectado</th>
                    <th className="py-2.5 px-3">Etapa Atual</th>
                    <th className="py-2.5 px-3">Progresso</th>
                    <th className="py-2.5 px-3">Eng. Responsável</th>
                    <th className="py-2.5 px-3">Bloqueios / Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {onboardingProjects.map(proj => (
                    <tr key={proj.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-3 font-bold text-slate-200">{proj.clientName}</td>
                      <td className="py-3 px-3 text-slate-400">{proj.sector}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{proj.erp}</td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          proj.stage === 'live' 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}>
                          {proj.stage === 'live' ? '✓ Produção Live' : proj.stage.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--vx-neon)]" style={{ width: `${proj.progressPercent}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-slate-300">{proj.progressPercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{proj.leadEngineer}</td>
                      <td className="py-3 px-3 text-slate-400 italic">
                        {proj.activeBlockers || <span className="text-emerald-400 not-italic">Nenhum bloqueio</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: IMPLANTAÇÃO (Acesso restrito ao Kanban de Implantação + Conectores ERP em Leitura) */}
      {currentOfficeRole === 'onboarding' && activeInternalSubTab === 'main' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 uppercase font-bold">
                  PAPEL: IMPLANTAÇÃO
                </span>
                <span className="text-[10px] font-mono text-slate-400">Engenharia de Setup</span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <HardHat className="w-4 h-4 text-amber-400" />
                Kanban de Implantação Técnica & Setup de Conectores
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe o setup técnico: Onboarding Iniciado → Conectores Configurados → Treinamento → Live.
              </p>
            </div>
            
            <button
              onClick={() => setActiveInternalSubTab('connectors')}
              className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700 text-amber-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Network className="w-4 h-4 text-amber-400" />
              <span>Ver Conectores ERP</span>
            </button>
          </div>

          {/* Kanban Board (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Column 1: Onboarding Iniciado */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 min-h-[460px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300 font-mono">1. Onboarding Iniciado</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                  {onboardingProjects.filter(p => p.stage === 'onboarding_started').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {onboardingProjects.filter(p => p.stage === 'onboarding_started').map(proj => (
                  <div key={proj.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <strong className="text-xs font-bold text-slate-200 block">{proj.clientName}</strong>
                    <div className="text-[10px] font-mono text-slate-400">ERP: {proj.erp}</div>
                    <div className="text-[10px] text-slate-400">Lead: {proj.leadEngineer}</div>
                    {proj.activeBlockers && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-800/60">
                        ⚠️ {proj.activeBlockers}
                      </div>
                    )}
                    <button
                      onClick={() => handleMoveOnboardingStage(proj.id, 'connectors_configured')}
                      className="w-full mt-2 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Avançar p/ Conectores</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Conectores Configurados */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 min-h-[460px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-cyan-300 font-mono">2. Conectores Configurados</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                  {onboardingProjects.filter(p => p.stage === 'connectors_configured').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {onboardingProjects.filter(p => p.stage === 'connectors_configured').map(proj => (
                  <div key={proj.id} className="p-3 bg-slate-950 border border-cyan-900/40 rounded-xl space-y-2">
                    <strong className="text-xs font-bold text-slate-200 block">{proj.clientName}</strong>
                    <div className="text-[10px] font-mono text-cyan-300">ERP: {proj.erp} (Webhook OK)</div>
                    <div className="text-[10px] text-slate-400">Lead: {proj.leadEngineer}</div>
                    <button
                      onClick={() => handleMoveOnboardingStage(proj.id, 'training')}
                      className="w-full mt-2 py-1 px-2 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-[10px] font-bold border border-cyan-800 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Avançar p/ Treinamento</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Treinamento */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 min-h-[460px]">
              <div className="flex items-center justify-between px-2 py-1 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-amber-300 font-mono">3. Treinamento C-Level</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                  {onboardingProjects.filter(p => p.stage === 'training').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {onboardingProjects.filter(p => p.stage === 'training').map(proj => (
                  <div key={proj.id} className="p-3 bg-slate-950 border border-amber-900/40 rounded-xl space-y-2">
                    <strong className="text-xs font-bold text-slate-200 block">{proj.clientName}</strong>
                    <div className="text-[10px] font-mono text-slate-400">Progresso: {proj.progressPercent}%</div>
                    {proj.activeBlockers && (
                      <div className="text-[10px] text-amber-300 bg-amber-950/60 p-1.5 rounded border border-amber-800/60">
                        ⚠️ {proj.activeBlockers}
                      </div>
                    )}
                    <button
                      onClick={() => handleMoveOnboardingStage(proj.id, 'live')}
                      className="w-full mt-2 py-1.5 px-2 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-200 text-[10px] font-bold border border-emerald-700 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Concluir e Ligar Live</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 4: Live */}
            <div className="bg-[var(--vx-deep)] border border-emerald-900/40 rounded-2xl p-3 flex flex-col gap-3 min-h-[460px] bg-gradient-to-b from-emerald-950/20 to-transparent">
              <div className="flex items-center justify-between px-2 py-1 bg-emerald-950/60 rounded-xl border border-emerald-800/80">
                <span className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  4. Produção Live
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900 text-emerald-200 border border-emerald-700 font-mono font-bold">
                  {onboardingProjects.filter(p => p.stage === 'live').length}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {onboardingProjects.filter(p => p.stage === 'live').map(proj => (
                  <div key={proj.id} className="p-3 bg-slate-950 border border-emerald-800/60 rounded-xl space-y-2">
                    <strong className="text-xs font-bold text-slate-100 block">{proj.clientName}</strong>
                    <div className="text-[10px] font-mono text-emerald-400">✓ Operando 100% Autônomo</div>
                    <div className="text-[10px] text-slate-400 font-mono">Desde: {proj.targetLiveDate}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: RH (CADASTRO DE COLABORADOR COM MODAL + TABELA + STATUS ATIVO/AFASTADO + DASHBOARD DE PAGAMENTOS) */}
      {currentOfficeRole === 'hr' && activeInternalSubTab === 'main' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Sub-tab Navigation for RH */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setHrSubTab('employees')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                hrSubTab === 'employees'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Quadro de Colaboradores &amp; Acessos</span>
            </button>

            <button
              onClick={() => setHrSubTab('payroll')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                hrSubTab === 'payroll'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/50'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-purple-400" />
              <span>Dashboard de Pagamentos (Folha)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/90 text-purple-200 border border-purple-700">
                RH &amp; Contador
              </span>
            </button>
          </div>

          {/* Sub-view 1: Dashboard de Pagamentos dos Colaboradores */}
          {hrSubTab === 'payroll' && (
            <EmployeePayrollDashboard
              currentRole={currentOfficeRole}
              employees={employees}
              onRecordAudit={recordAuditLog}
              onSwitchRole={(roleId) => setCurrentOfficeRole(roleId as any)}
            />
          )}

          {/* Sub-view 2: Quadro Funcional de Colaboradores */}
          {hrSubTab === 'employees' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--vx-deep)] p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 uppercase font-bold">
                  PAPEL: RH
                </span>
                <span className="text-[10px] font-mono text-slate-400">Gestão de Pessoas & Acessos</span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <UserCheck className="w-4 h-4 text-purple-400" />
                Gestão de Equipe & Quadro de Colaboradores (RH)
              </h2>
              <p className="text-xs text-slate-400">
                Cadastro e controle de colaboradores, papéis de acesso e dados bancários de recebimento protegidos por Blindagem de Sigilo & RLS.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou banco..."
                  value={searchEmployee}
                  onChange={e => setSearchEmployee(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-56"
                />
              </div>

              {/* Botão de Mascaramento / Demonstração de Sigilo RLS */}
              <button
                type="button"
                onClick={() => setIsPrivacyMaskActive(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                  isPrivacyMaskActive 
                    ? 'bg-amber-950/80 border-amber-800/80 text-amber-300 hover:bg-amber-900' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                title="Alternar mascaramento de dados bancários para apresentação ou modo LGPD"
              >
                {isPrivacyMaskActive ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Modo Mascarado (LGPD)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Mascarar Dados (Demo)</span>
                  </>
                )}
              </button>

              {/* Botão Adicionar Colaborador */}
              <button
                onClick={() => setIsAddEmployeeModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-950/40 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Adicionar Colaborador</span>
              </button>
            </div>
          </div>

          {/* RLS Security Banner */}
          <div className="p-3 bg-purple-950/30 border border-purple-800/50 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="font-bold text-purple-200">Blindagem de Sigilo &amp; RLS Ativa:</span>{' '}
                <span className="text-purple-300/90">
                  Os dados bancários de recebimento (Banco, Agência, Conta e Chave PIX) estão descriptografados e visíveis porque seu papel atual é <strong className="text-white uppercase font-mono">RH</strong>. Demais papéis veem os dados estritamente mascarados (LGPD Art. 7º &amp; 11).
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-900/60 border border-purple-700 text-purple-200 font-bold shrink-0">
              RLS: RH &amp; Contador
            </span>
          </div>

          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-950/60">
                    <th className="py-3 px-4">Nome do Colaborador</th>
                    <th className="py-3 px-4">Departamento</th>
                    <th className="py-3 px-4">Cargo / Função</th>
                    <th className="py-3 px-4">Papel de Acesso</th>
                    <th className="py-3 px-4">Remuneração Base</th>
                    <th className="py-3 px-4 min-w-[260px]">Dados Bancários / Recebimento</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {employees
                    .filter(emp => 
                      emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) || 
                      emp.email.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                      (emp.bankDetails?.bankName && emp.bankDetails.bankName.toLowerCase().includes(searchEmployee.toLowerCase())) ||
                      (emp.bankDetails?.pixKey && emp.bankDetails.pixKey.toLowerCase().includes(searchEmployee.toLowerCase()))
                    )
                    .map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-200">{emp.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{emp.email}</div>
                          <div className="text-[9px] font-mono text-slate-600 mt-0.5">Adm: {emp.admissionDate}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{emp.department}</td>
                        <td className="py-3 px-4 text-slate-200 font-medium">{emp.roleTitle}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-purple-300">
                          <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800">
                            {emp.systemAccessRole}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {canViewUnmaskedBankData && !isPrivacyMaskActive ? (
                            <span className="text-emerald-300 font-bold text-xs">
                              R$ {(emp.salaryBrl || 10500).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-xs">
                              R$ ••••••••
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {canViewUnmaskedBankData && !isPrivacyMaskActive ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-medium text-slate-200">
                                <Landmark className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <span className="truncate text-slate-200 font-semibold">
                                  {emp.bankDetails?.bankName || 'Banco não informado'}
                                </span>
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-mono shrink-0">
                                  {emp.bankDetails?.accountType || 'Corrente'}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                                <span>Ag: <strong className="text-slate-200">{emp.bankDetails?.agency || '—'}</strong></span>
                                <span>Conta: <strong className="text-slate-200">{emp.bankDetails?.accountNumber || '—'}</strong></span>
                              </div>
                              {emp.bankDetails?.pixKey && (
                                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                                  <span className="text-slate-500 font-semibold">PIX ({emp.bankDetails.pixKeyType || 'Chave'}):</span>
                                  <span className="text-slate-300 truncate max-w-[130px] font-mono" title={emp.bankDetails.pixKey}>
                                    {emp.bankDetails.pixKey}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPix(emp.id, emp.bankDetails!.pixKey)}
                                    className="p-1 hover:text-white rounded cursor-pointer text-slate-400 hover:bg-slate-800 transition-colors shrink-0"
                                    title="Copiar Chave PIX"
                                  >
                                    {copiedPixId === emp.id ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-bold">
                                <Lock className="w-3 h-3" />
                                <span>Blindagem de Sigilo &amp; RLS</span>
                              </div>
                              <div className="text-[10px] font-mono text-slate-500">
                                Agência: •••• · Conta: •••••-•
                              </div>
                              <div className="text-[9px] text-slate-500 italic">
                                Visível exclusivamente para RH e Contador
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            emp.status === 'Ativo'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-800/80 text-purple-300 hover:text-white text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Editar cadastro e dados bancários do colaborador"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleToggleEmployeeStatus(emp.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                              title="Alternar entre Ativo e Afastado"
                            >
                              {emp.status === 'Ativo' ? 'Afastar' : 'Reativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

          {/* MODAL: Adicionar Colaborador com Seção de Dados Bancários / Recebimento */}
          {isAddEmployeeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[var(--vx-deep)] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Adicionar Colaborador</h3>
                      <p className="text-[11px] text-slate-400">Cadastro funcional e bancário no Escritório Velatrix</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsAddEmployeeModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
                  {/* SEÇÃO 1: DADOS CORPORATIVOS */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>1. Dados Funcionais &amp; Acesso Corporativo</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Larissa Monteiro"
                          value={newEmployeeForm.name}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">E-mail Corporativo *</label>
                        <input
                          type="email"
                          required
                          placeholder="Ex: larissa.monteiro@velatrix.ai"
                          value={newEmployeeForm.email}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Departamento</label>
                        <select
                          value={newEmployeeForm.department}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, department: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="Comercial">Comercial</option>
                          <option value="Engenharia & Implantação">Engenharia & Implantação</option>
                          <option value="Jurídico & Compliance">Jurídico & Compliance</option>
                          <option value="Financeiro & Controladoria">Financeiro & Controladoria</option>
                          <option value="Operações & RH">Operações & RH</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Cargo / Função *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Executiva de Contas Senior"
                          value={newEmployeeForm.roleTitle}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, roleTitle: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Papel de Acesso no Sistema *</label>
                        <select
                          value={newEmployeeForm.systemAccessRole}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, systemAccessRole: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-xl px-3 py-2 text-purple-300 font-bold focus:outline-none focus:border-purple-400"
                        >
                          <option value="Comercial">Comercial</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Implantação">Implantação</option>
                          <option value="RH">RH</option>
                          <option value="Advogado">Advogado</option>
                          <option value="Contador">Contador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Salário Mensal Base (R$) *</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={newEmployeeForm.salaryBrl}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, salaryBrl: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      * O novo colaborador terá acesso restrito à visão do seu papel e status "Ativo" por padrão. Salário protegido por RLS.
                    </p>
                  </div>

                  {/* SEÇÃO 2: DADOS BANCÁRIOS / RECEBIMENTO */}
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        <span>2. Dados Bancários / Recebimento</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        🔒 Blindagem RLS (RH &amp; Contador)
                      </span>
                    </div>

                    {/* Banner Informativo RLS */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-900/40 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold font-mono text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Blindagem de Sigilo &amp; Conformidade LGPD (Art. 7º &amp; 11)</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Esses dados são gravados com criptografia e somente poderão ser lidos ou alterados pelos operadores de <strong>RH</strong> e <strong>Contador</strong> para fins de repasse e folha.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Banco *</label>
                        <select
                          value={newEmployeeForm.bankName}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          {BRAZILIAN_BANKS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Tipo de Conta *</label>
                        <select
                          value={newEmployeeForm.accountType}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, accountType: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="Corrente">Corrente</option>
                          <option value="Poupança">Poupança</option>
                        </select>
                      </div>
                    </div>

                    {newEmployeeForm.bankName === 'Outro Banco...' && (
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Nome do Banco / Instituição *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 033 - Banco Santander"
                          value={newEmployeeForm.customBankName}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, customBankName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Agência (com ou sem dígito) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 0842 ou 1824-1"
                          value={newEmployeeForm.agency}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, agency: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Conta Bancária (com dígito) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 29481-3"
                          value={newEmployeeForm.accountNumber}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Tipo de Chave PIX</label>
                        <select
                          value={newEmployeeForm.pixKeyType}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, pixKeyType: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                          <option value="E-mail">E-mail</option>
                          <option value="Telefone">Telefone</option>
                          <option value="Chave Aleatória">Chave Aleatória</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Chave PIX *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 329.841.098-12 ou email@velatrix.ai"
                          value={newEmployeeForm.pixKey}
                          onChange={e => setNewEmployeeForm(prev => ({ ...prev, pixKey: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddEmployeeModalOpen(false)}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold cursor-pointer shadow-md shadow-purple-950/40 transition-all flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Salvar Colaborador &amp; Dados Bancários</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Editar Cadastro de Colaborador e Dados Bancários */}
          {isEditEmployeeModalOpen && editEmployeeForm && editingEmployee && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[var(--vx-deep)] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[92vh]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">Editar Cadastro de Colaborador</h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ID: {editingEmployee.id} · {editingEmployee.name}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsEditEmployeeModalOpen(false);
                      setEditingEmployee(null);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditEmployee} className="space-y-4 text-xs">
                  {/* SEÇÃO 1: DADOS CORPORATIVOS */}
                  <div className="space-y-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>1. Dados Funcionais &amp; Acesso Corporativo</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={editEmployeeForm.name}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">E-mail Corporativo *</label>
                        <input
                          type="email"
                          required
                          value={editEmployeeForm.email}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Departamento</label>
                        <select
                          value={editEmployeeForm.department}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, department: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="Comercial">Comercial</option>
                          <option value="Engenharia & Implantação">Engenharia & Implantação</option>
                          <option value="Jurídico & Compliance">Jurídico & Compliance</option>
                          <option value="Financeiro & Controladoria">Financeiro & Controladoria</option>
                          <option value="Operações & RH">Operações & RH</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Cargo / Função *</label>
                        <input
                          type="text"
                          required
                          value={editEmployeeForm.roleTitle}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, roleTitle: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Papel de Acesso</label>
                        <select
                          value={editEmployeeForm.systemAccessRole}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, systemAccessRole: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-purple-800/80 rounded-xl px-3 py-2 text-purple-300 font-bold focus:outline-none focus:border-purple-400"
                        >
                          <option value="Comercial">Comercial</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Implantação">Implantação</option>
                          <option value="RH">RH</option>
                          <option value="Advogado">Advogado</option>
                          <option value="Contador">Contador</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Status Funcional</label>
                        <select
                          value={editEmployeeForm.status}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, status: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-bold"
                        >
                          <option value="Ativo">Ativo (Em Operação)</option>
                          <option value="Afastado">Afastado (Licença/Inativo)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Salário Base (R$) *</label>
                        <input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={editEmployeeForm.salaryBrl}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, salaryBrl: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SEÇÃO 2: DADOS BANCÁRIOS / RECEBIMENTO */}
                  <div className="space-y-3 pt-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5" />
                        <span>2. Dados Bancários / Recebimento</span>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        🔒 Blindagem RLS (RH &amp; Contador)
                      </span>
                    </div>

                    {/* Banner Informativo RLS */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-900/40 text-[11px] text-slate-300 space-y-1">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold font-mono text-[10px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Blindagem de Sigilo &amp; Conformidade LGPD (Art. 7º &amp; 11)</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Alterações nos dados bancários serão registradas em trilha de auditoria e refletirão imediatamente para a conciliação de folha do papel <strong>Contador</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Banco *</label>
                        <select
                          value={editEmployeeForm.bankName}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, bankName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          {BRAZILIAN_BANKS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Tipo de Conta *</label>
                        <select
                          value={editEmployeeForm.accountType}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, accountType: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="Corrente">Corrente</option>
                          <option value="Poupança">Poupança</option>
                        </select>
                      </div>
                    </div>

                    {editEmployeeForm.bankName === 'Outro Banco...' && (
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Nome do Banco / Instituição *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 033 - Banco Santander"
                          value={editEmployeeForm.customBankName}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, customBankName: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Agência (com ou sem dígito) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 0842 ou 1824-1"
                          value={editEmployeeForm.agency}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, agency: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Conta Bancária (com dígito) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 29481-3"
                          value={editEmployeeForm.accountNumber}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Tipo de Chave PIX</label>
                        <select
                          value={editEmployeeForm.pixKeyType}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, pixKeyType: e.target.value as any }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="CPF">CPF</option>
                          <option value="CNPJ">CNPJ</option>
                          <option value="E-mail">E-mail</option>
                          <option value="Telefone">Telefone</option>
                          <option value="Chave Aleatória">Chave Aleatória</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-mono text-[11px] mb-1">Chave PIX *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 329.841.098-12 ou email@velatrix.ai"
                          value={editEmployeeForm.pixKey}
                          onChange={e => setEditEmployeeForm(prev => ({ ...prev, pixKey: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditEmployeeModalOpen(false);
                        setEditingEmployee(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold cursor-pointer shadow-md shadow-purple-950/40 transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Alterações</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 5: ADVOGADO (REPOSITÓRIO DE CONTRATOS POR CLIENTE COM STATUS, VIGÊNCIA E ANEXO MOCKADO) */}
      {currentOfficeRole === 'legal' && activeInternalSubTab === 'main' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--vx-deep)] p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 uppercase font-bold">
                  PAPEL: ADVOGADO
                </span>
                <span className="text-[10px] font-mono text-slate-400">Jurídico & Contratos</span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                <FileSignature className="w-4 h-4 text-rose-400" />
                Repositório Jurídico & Contratos de Clientes
              </h2>
              <p className="text-xs text-slate-400">
                Minutas, termos de confidencialidade (NDA), SLAs de resposta e contratos vinculados por Tenant.
              </p>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente ou contrato..."
                value={searchContract}
                onChange={e => setSearchContract(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contracts
              .filter(ctr => ctr.clientName.toLowerCase().includes(searchContract.toLowerCase()) || ctr.contractNumber.toLowerCase().includes(searchContract.toLowerCase()))
              .map(ctr => (
                <div key={ctr.id} className="p-4 bg-[var(--vx-deep)] border border-slate-800 hover:border-slate-700 rounded-2xl space-y-3 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block">{ctr.contractNumber}</span>
                      <strong className="text-xs font-bold text-slate-100">{ctr.clientName}</strong>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      ctr.status === 'Assinado'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : ctr.status === 'Em Assinatura'
                        ? 'bg-amber-950 text-amber-300 border-amber-800'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {ctr.status}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                    <div className="text-slate-300 text-[11px] font-medium">{ctr.planName}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Vigência: {ctr.effectiveDate} até {ctr.renewalDate}
                    </div>
                    <div className="text-[10px] text-slate-400">Advogado: {ctr.assignedLawyer}</div>
                  </div>

                  {/* Mocked Attachment Box */}
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="text-[10px] font-mono text-slate-300 truncate" title={ctr.mockAttachmentName}>
                        {ctr.mockAttachmentName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0 ml-1">
                      ({ctr.fileSizeKb} KB)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px]">
                    <button
                      onClick={() => alert(`Simulando download seguro do contrato "${ctr.mockAttachmentName}" com hash sha256 validado.`)}
                      className="text-rose-400 hover:text-rose-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Baixar PDF</span>
                    </button>

                    {ctr.status !== 'Assinado' && (
                      <button
                        onClick={() => handleNextContractStatus(ctr.id)}
                        className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 font-bold cursor-pointer"
                      >
                        Avançar Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 6: CONTADOR (FATURAMENTO, PRÉ-FATURAS & NOTAS FISCAIS DE SERVIÇOS NFS-e) */}
      {currentOfficeRole === 'accounting' && activeInternalSubTab === 'main' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Accounting Sub-Tabs Switcher */}
          <div className="bg-[var(--vx-deep)] p-2 rounded-2xl border border-slate-800 flex items-center gap-2 flex-wrap">
            <button
              id="subtab-nfse"
              onClick={() => setAccountingSubTab('nfse')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                accountingSubTab === 'nfse'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notas Fiscais de Serviços (NFS-e)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                accountingSubTab === 'nfse' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                SEFAZ / Split
              </span>
            </button>

            <button
              id="subtab-billing"
              onClick={() => setAccountingSubTab('billing')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                accountingSubTab === 'billing'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Faturamento &amp; Pré-Faturas (MRR)</span>
            </button>

            <button
              id="subtab-payroll"
              onClick={() => setAccountingSubTab('payroll')}
              className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                accountingSubTab === 'payroll'
                  ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-950/80 hover:bg-slate-900 text-slate-300 border border-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>Folha &amp; Dados Bancários (Staff)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                accountingSubTab === 'payroll' ? 'bg-slate-950 text-cyan-300' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              }`}>
                RLS Autorizado
              </span>
            </button>
          </div>

          {/* VIEW 1: NFS-E MANAGEMENT */}
          {accountingSubTab === 'nfse' && (
            <NfseManagementSection onRecordAudit={recordAuditLog} />
          )}

          {/* VIEW 2: BILLING & PRE-INVOICES */}
          {accountingSubTab === 'billing' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header with Export Action Buttons */}
              <div className="bg-[var(--vx-deep)] p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-bold">
                      PAPEL: CONTADOR
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Controladoria &amp; Faturamento</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono mt-1">
                    <Receipt className="w-4 h-4 text-cyan-400" />
                    Faturamento, Controladoria &amp; Cobrança de Tenants (Contador)
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl">
                    Controle operacional de subscrições, conciliação de faturas mensais e emissão de pré-faturas para departamentos financeiros.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  <div className="text-left md:text-right pr-2">
                    <span className="text-[10px] font-mono text-slate-400 block">MRR Total Consolidado</span>
                    <strong className="text-base font-bold text-emerald-400 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMrr)}
                    </strong>
                  </div>

                  {/* Export Full Billing Report Button */}
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-export-billing-csv"
                      onClick={handleExportBillingReportCsv}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Exportar base de faturamento em formato CSV / Planilha"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV</span>
                    </button>

                    <button
                      id="btn-export-billing-pdf"
                      onClick={handleExportBillingReportPdf}
                      disabled={isExportingBillingReport}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-950/40 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isExportingBillingReport ? 'Gerando Relatório...' : 'Exportar Relatório Completo (PDF)'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Success Banner */}
              {billingExportSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Relatório completo de faturamento gerado e baixado no navegador com sucesso!</span>
                </div>
              )}

              {/* Table */}
              <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase bg-slate-950/60">
                        <th className="py-3.5 px-4">Tenant / Razão Social</th>
                        <th className="py-3.5 px-4">CNPJ</th>
                        <th className="py-3.5 px-4">Plano Contratado</th>
                        <th className="py-3.5 px-4">Fatura / Ref.</th>
                        <th className="py-3.5 px-4">Vencimento</th>
                        <th className="py-3.5 px-4">Valor Mensal</th>
                        <th className="py-3.5 px-4">Método</th>
                        <th className="py-3.5 px-4">Status da Cobrança</th>
                        <th className="py-3.5 px-4 text-right">Ação Contábil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {billingEntries.map(bill => (
                        <tr key={bill.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-200">{bill.clientName}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{bill.cnpj}</td>
                          <td className="py-3.5 px-4 text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono">
                              {bill.planTier}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-cyan-300 text-[11px]">{bill.invoiceNumber}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">{bill.dueDate}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bill.amountBrl)}
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-slate-400">{bill.paymentMethod}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold ${
                              bill.billingStatus === 'Pago'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                : bill.billingStatus === 'Pendente'
                                ? 'bg-amber-950 text-amber-300 border-amber-800'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                            }`}>
                              {bill.billingStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedBillForPreInvoice(bill)}
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 hover:text-white font-mono font-bold text-[11px] flex items-center gap-1.5 ml-auto cursor-pointer transition-all shadow-sm"
                              title="Gerar Pré-Fatura / Proposta de Cobrança com download e compartilhamento"
                            >
                              <FileText className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Gerar Pré-Fatura</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: FOLHA DE PAGAMENTO & DADOS BANCÁRIOS (STAFF) - RLS CONCEDIDO */}
          {accountingSubTab === 'payroll' && (
            <EmployeePayrollDashboard
              currentRole={currentOfficeRole}
              employees={employees}
              onRecordAudit={recordAuditLog}
              onSwitchRole={(roleId) => setCurrentOfficeRole(roleId as any)}
            />
          )}

          {/* MODAL: Pré-Fatura / Proposta de Cobrança por Cliente */}
          {selectedBillForPreInvoice && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[var(--vx-deep)] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        Pré-Fatura & Proposta de Cobrança
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Ref: {selectedBillForPreInvoice.invoiceNumber} · {selectedBillForPreInvoice.clientName}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedBillForPreInvoice(null)}
                    className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* MANDATORY DISCLAIMER BANNER */}
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 font-bold font-mono text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>AVISO OBRIGATÓRIO: PRÉ-FATURA / PROPOSTA — NÃO É DOCUMENTO FISCAL VÁLIDO (NF-e)</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-relaxed pl-6">
                    Este documento constitui uma prévia demonstrativa para aprovação em comitês financeiros internos e provisão de caixa. A Nota Fiscal de Serviços Eletrônica (NFS-e) definitiva será gerada e transmitida à SEFAZ municipal após a compensação bancária.
                  </p>
                </div>

                {/* Client & Billing Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Sacado */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block border-b border-slate-800 pb-1">
                      Dados do Sacado / Cliente
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px]">Razão Social:</span>
                      <strong className="block text-slate-200 text-xs font-bold">{selectedBillForPreInvoice.clientName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">CNPJ:</span>
                      <span className="block font-mono text-cyan-300 text-xs">{selectedBillForPreInvoice.cnpj}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Status da Cobrança:</span>
                      <span className="block font-mono text-amber-300 text-xs font-bold">{selectedBillForPreInvoice.billingStatus}</span>
                    </div>
                  </div>

                  {/* Condições */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block border-b border-slate-800 pb-1">
                      Condições de Faturamento
                    </span>
                    <div>
                      <span className="text-slate-400 text-[11px]">Plano Contratado:</span>
                      <strong className="block text-emerald-400 text-xs font-bold">{selectedBillForPreInvoice.planTier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Data de Vencimento:</span>
                      <span className="block font-mono text-slate-200 text-xs font-bold">{selectedBillForPreInvoice.dueDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">Forma de Liquidação:</span>
                      <span className="block text-slate-300 text-xs">{selectedBillForPreInvoice.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {/* Amount Highlight */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Valor Total da Pré-Fatura</span>
                    <span className="text-[11px] text-slate-400">Assinatura mensal recorrente de agentes autônomos</span>
                  </div>
                  <strong className="text-lg font-mono font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBillForPreInvoice.amountBrl)}
                  </strong>
                </div>

                {/* Terms Box */}
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <strong className="text-slate-300 font-mono block text-xs">Termos & Condições de Ativação:</strong>
                  <p>• Acesso continuado ao Grafo de Conhecimento e orquestração de nós semânticos.</p>
                  <p>• Suporte com SLA contratual do plano e auditoria criptográfica de invariantes.</p>
                  <p>• Chave PIX Financeiro: <span className="font-mono text-slate-300">financeiro@velatrix.ai</span></p>
                </div>

                {/* Action Buttons: PDF, WhatsApp, Email */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <button
                    onClick={() => setSelectedBillForPreInvoice(null)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer transition-colors"
                  >
                    Fechar
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                    {/* WhatsApp */}
                    <button
                      onClick={() => handleSharePreInvoiceWhatsApp(selectedBillForPreInvoice)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 hover:text-emerald-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                      title="Abrir WhatsApp com mensagem pré-formatada"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Email */}
                    <button
                      onClick={() => handleSharePreInvoiceEmail(selectedBillForPreInvoice)}
                      className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-600/60 text-sky-300 hover:text-sky-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                      title="Abrir cliente de e-mail com corpo pré-preenchido"
                    >
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>E-mail</span>
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadPreInvoicePdf(selectedBillForPreInvoice)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-lg shadow-cyan-950/40"
                      title="Baixar Pré-Fatura real em PDF no navegador"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar em PDF</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: CADASTRO DE EMPRESA COLETADA (MÓDULO DE CAPTAÇÃO) */}
      {isLeadCaptureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--vx-deep)] border border-slate-700/80 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                    Cadastro de Empresa Coletada (Captação)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Módulo de Captação SDR &amp; Ingestão Automática da Landing Page Velatrix AOS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLeadCaptureModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Seletor de Origem com Prévia Visual */}
              <div className="space-y-1.5">
                <label className="block font-mono font-bold text-slate-300">
                  Origem da Coleta / Ingestão:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewLeadForm(prev => ({
                        ...prev,
                        origem: 'LANDING_PAGE',
                        scoreAderencia: 88,
                        faixaCreditoEstimado: 'R$ 150.000 a R$ 380.000',
                        cnae: '4771-7/01 - Comércio varejista de produtos farmacêuticos',
                        regimeTributarioEstimado: 'Simples Nacional',
                        tesesAplicaveis: ['Monofásicos de PIS/COFINS', 'Exclusão do ICMS da Base do PIS/COFINS']
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newLeadForm.origem === 'LANDING_PAGE'
                        ? 'bg-cyan-950/70 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono text-cyan-300">
                      <Zap className="w-3.5 h-3.5 fill-cyan-400" />
                      <span>Landing Page</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Diagnóstico fiscal automatizado via Firestore.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewLeadForm(prev => ({
                        ...prev,
                        origem: 'MAPS_MANUAL',
                        scoreAderencia: 45,
                        faixaCreditoEstimado: 'A definir em triagem pericial',
                        tesesAplicaveis: []
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newLeadForm.origem === 'MAPS_MANUAL'
                        ? 'bg-amber-950/70 border-amber-500 shadow-md shadow-amber-950/30 ring-1 ring-amber-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono text-amber-300">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Cadastro Manual</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Prospecção ativa (Google Maps / Instagram).
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewLeadForm(prev => ({
                        ...prev,
                        origem: 'INDICACAO_PARCEIRO',
                        scoreAderencia: 65,
                        faixaCreditoEstimado: 'Estimativa inicial em aberto',
                        tesesAplicaveis: ['Monofásicos de PIS/COFINS']
                      }));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newLeadForm.origem === 'INDICACAO_PARCEIRO'
                        ? 'bg-purple-950/70 border-purple-500 shadow-md shadow-purple-950/30 ring-1 ring-purple-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold font-mono text-purple-300">
                      <Users className="w-3.5 h-3.5" />
                      <span>Indicação Parceiro</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Encaminhado por parceiro contábil / jurídico.
                    </div>
                  </button>
                </div>

                {/* Selo Visual que aparecerá no Card */}
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Selo que será exibido no Card:</span>
                  {renderOriginSeal(newLeadForm.origem, false)}
                </div>
              </div>

              {/* Dados Cadastrais Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block font-mono text-slate-300 mb-1">
                    Razão Social / Nome Fantasia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Drogarias São Lucas Ltda"
                    value={newLeadForm.name}
                    onChange={e => setNewLeadForm({ ...newLeadForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-300 mb-1">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 34.567.890/0001-12"
                    value={newLeadForm.cnpj}
                    onChange={e => setNewLeadForm({ ...newLeadForm, cnpj: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-300 mb-1">
                    Setor de Atividade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Varejo Farmacêutico"
                    value={newLeadForm.sectorLabel}
                    onChange={e => setNewLeadForm({ ...newLeadForm, sectorLabel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-mono text-slate-300 mb-1">
                    MRR Estimado do Contrato (R$)
                  </label>
                  <input
                    type="number"
                    value={newLeadForm.estimatedMrrBrl}
                    onChange={e => setNewLeadForm({ ...newLeadForm, estimatedMrrBrl: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-mono text-slate-300 mb-1">
                    Responsável Comercial / SDR
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Camila SDR"
                    value={newLeadForm.responsibleName}
                    onChange={e => setNewLeadForm({ ...newLeadForm, responsibleName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Bloco de Destaque: Dados de Diagnóstico Fiscal da Landing Page */}
              <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                newLeadForm.origem === 'LANDING_PAGE'
                  ? 'bg-cyan-950/20 border-cyan-800/60'
                  : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold text-slate-200 text-xs">
                      Dados do Diagnóstico Fiscal (Landing Page Velatrix AOS)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Score de Aderência:</span>
                    {renderScoreBadge(newLeadForm.scoreAderencia, false)}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Preenchidos automaticamente quando o lead realiza o diagnóstico fiscal na Landing Page da Velatrix AOS.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-slate-300 mb-1">
                      CNAE Principal:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 4771-7/01 - Comércio de medicamentos"
                      value={newLeadForm.cnae}
                      onChange={e => setNewLeadForm({ ...newLeadForm, cnae: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-slate-300 mb-1">
                      Regime Tributário Estimado:
                    </label>
                    <select
                      value={newLeadForm.regimeTributarioEstimado}
                      onChange={e => setNewLeadForm({ ...newLeadForm, regimeTributarioEstimado: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Simples Nacional">Simples Nacional</option>
                      <option value="Lucro Presumido">Lucro Presumido</option>
                      <option value="Lucro Real">Lucro Real</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-slate-300 mb-1">
                      Score de Aderência (0 a 100):
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={newLeadForm.scoreAderencia}
                        onChange={e => setNewLeadForm({ ...newLeadForm, scoreAderencia: Number(e.target.value) })}
                        className="flex-1 accent-emerald-500 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newLeadForm.scoreAderencia}
                        onChange={e => setNewLeadForm({ ...newLeadForm, scoreAderencia: Math.min(100, Math.max(0, Number(e.target.value))) })}
                        className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-200 font-mono text-center focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      * Verde &gt;75 | Amarelo 50-75 | Cinza &lt;50 (probabilístico, sem garantia de resultado)
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-slate-300 mb-1">
                      Faixa de Crédito Estimado:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: R$ 150.000 a R$ 380.000"
                      value={newLeadForm.faixaCreditoEstimado}
                      onChange={e => setNewLeadForm({ ...newLeadForm, faixaCreditoEstimado: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Teses Fiscais Aplicáveis */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block font-mono text-slate-300 mb-1.5">
                    Teses Fiscais de Alta Aderência:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Monofásicos de PIS/COFINS',
                      'Exclusão do ICMS da Base do PIS/COFINS',
                      'Equiparação Hospitalar',
                      'Verbas Indenizatórias na Folha',
                      'ICMS-ST Ressarcimento'
                    ].map(tese => {
                      const isSelected = newLeadForm.tesesAplicaveis.includes(tese);
                      return (
                        <button
                          key={tese}
                          type="button"
                          onClick={() => {
                            setNewLeadForm(prev => ({
                              ...prev,
                              tesesAplicaveis: isSelected
                                ? prev.tesesAplicaveis.filter(t => t !== tese)
                                : [...prev.tesesAplicaveis, tese]
                            }));
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-teal-950 text-teal-300 border-teal-600 font-bold'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{tese}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Observações */}
              <div>
                <label className="block font-mono text-slate-300 mb-1">
                  Observações Comerciais / Contexto de Coleta:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Contato captado pelo formulário de diagnóstico fiscal. Empresa com 3 filiais."
                  value={newLeadForm.notes}
                  onChange={e => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsLeadCaptureModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNewLead}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-950/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar no Funil Comercial</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: INSPEÇÃO DETALHADA DE DIAGNÓSTICO FISCAL DO LEAD */}
      {selectedLeadForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--vx-deep)] border border-slate-700 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono leading-snug">
                    {selectedLeadForInspection.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>CNPJ: {selectedLeadForInspection.cnpj}</span>
                    <span>•</span>
                    <span>{selectedLeadForInspection.sectorLabel}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeadForInspection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Selos de Origem e Score em Destaque */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Origem do Lead</span>
                  {renderOriginSeal(selectedLeadForInspection.origem, false)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Score de Aderência Fiscal</span>
                  {renderScoreBadge(selectedLeadForInspection.scoreAderencia, false)}
                </div>
              </div>

              {/* Qualificação Tributária Consolidada */}
              <div className="p-4 bg-cyan-950/20 border border-cyan-800/50 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 pb-2 border-b border-cyan-900/40">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <strong className="font-mono text-cyan-300 text-xs uppercase">
                    Parâmetros Tributários &amp; Estimativa Probabilística
                  </strong>
                </div>

                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">CNAE Principal:</span>
                    <strong className="text-slate-200 text-right">{selectedLeadForInspection.cnae || 'Não informado'}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Regime Tributário:</span>
                    <strong className="text-sky-300">{selectedLeadForInspection.regimeTributarioEstimado || 'A apurar'}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">Faixa de Crédito Estimada:</span>
                    <strong className="text-emerald-400">{selectedLeadForInspection.faixaCreditoEstimado || 'Em levantamento pericial'}</strong>
                  </div>
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">MRR Comercial Estimado:</span>
                    <strong className="text-emerald-400">R$ {selectedLeadForInspection.estimatedMrrBrl.toLocaleString('pt-BR')}</strong>
                  </div>
                </div>

                {/* Teses Aplicáveis */}
                {selectedLeadForInspection.tesesAplicaveis && selectedLeadForInspection.tesesAplicaveis.length > 0 && (
                  <div className="pt-2 border-t border-cyan-900/40">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1.5">
                      Teses Fiscais Pré-Identificadas com Aderência:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLeadForInspection.tesesAplicaveis.map((tese, idx) => (
                        <span key={idx} className="px-2 py-1 rounded bg-teal-950 text-teal-300 border border-teal-700/60 font-mono text-[10px]">
                          ✓ {tese}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informações Comerciais & Atribuição de Responsável */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex justify-between items-center text-slate-300 font-mono">
                  <span className="text-slate-400">Etapa Atual no Funil:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-700 font-bold uppercase text-[10px]">
                    {selectedLeadForInspection.stage}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Profissional Responsável:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-slate-200">{selectedLeadForInspection.responsibleName}</span>
                      {selectedLeadForInspection.responsibleRole && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          selectedLeadForInspection.responsibleRole === 'Advogado' 
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {selectedLeadForInspection.responsibleRole}
                        </span>
                      )}
                    </div>
                    {selectedLeadForInspection.assignedAt && (
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Atribuído em: {selectedLeadForInspection.assignedAt}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLeadForReassignment(selectedLeadForInspection);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-800/80 font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
                    <span>Reatribuir</span>
                  </button>
                </div>

                {selectedLeadForInspection.notes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono block mb-1">Notas do Histórico:</span>
                    <p className="text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                      "{selectedLeadForInspection.notes}"
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeadForInspection(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: REATRIBUIÇÃO MANUAL COM JUSTIFICATIVA & AUDITORIA */}
      <LeadReassignmentModal
        isOpen={!!leadForReassignment}
        lead={leadForReassignment}
        professionals={taxProfessionals}
        onClose={() => setLeadForReassignment(null)}
        onSuccess={(updatedLead, updatedProfs, reason) => {
          setProspects(prev => prev.map(p => p.id === updatedLead.id ? updatedLead : p));
          setTaxProfessionals(updatedProfs);
          updateProspectLead(updatedLead.id, updatedLead).catch(err => {
            console.debug('[VelatrixOfficeDashboard] Lead reassign update fallback:', err);
          });
          if (selectedLeadForInspection?.id === updatedLead.id) {

            setSelectedLeadForInspection(updatedLead);
          }
          recordAuditLog(
            'Gestor Tributário',
            'Gerência',
            'LEAD_REASSIGNED',
            `Reatribuição: ${updatedLead.name}`,
            `Reatribuiu o lead "${updatedLead.name}" para ${updatedLead.responsibleName} (${updatedLead.responsibleRole}). Motivo: "${reason}".`
          );
        }}
        currentUserName="Gestor Tributário"
      />

    </div>
  );
};
