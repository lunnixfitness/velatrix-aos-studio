import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Building2, 
  Landmark, 
  Lock, 
  ArrowUpRight, 
  Sliders, 
  Zap, 
  FileSpreadsheet, 
  KeyRound, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Check,
  Search,
  Percent,
  Calendar,
  Layers,
  HelpCircle,
  ArrowRight,
  Shield,
  Filter,
  CheckSquare,
  AlertCircle,
  Activity,
  Cpu,
  Fingerprint,
  FileCheck,
  Database,
  Users,
  Bell,
  Award,
  Calculator,
  HardHat
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { 
  TenantTaxRecoveryBridge, 
  SharedTenantTaxData,
  PreliminaryTaxScanResult,
  TaxRegime,
  MockTenantPresetId
} from '../../services/tenantTaxRecoveryBridge';
import { ProceduralKitSection } from './ProceduralKitSection';
import { CrossAuditSpedEditorSection } from './CrossAuditSpedEditorSection';
import { CorrespondentesPanel } from './CorrespondentesPanel'; // P23: substitui o split Velatrix × parceiro
import { NcmTaxMonitorPanel } from './NcmTaxMonitorPanel';
import { ValueProofBenchmarkPanel } from './ValueProofBenchmarkPanel';
import { LgpdBankingComplianceCard } from '../governance/LgpdBankingComplianceCard';
import { AntiCircumventionMonitoringPanel } from './AntiCircumventionMonitoringPanel';
import { RevenueShieldPaymentModal } from './RevenueShieldPaymentModal';
import { ExclusivityAgreementModal } from './ExclusivityAgreementModal';
import { RevenueShieldService, RevenueShieldState } from '../../services/revenueShieldService';
import { generateLegalTaxDossierPdf } from '../../services/pdfReportService';
import { ExpertTaxCalculationEngine } from './ExpertTaxCalculationEngine';
import { TaxRecoveryDocPreviewModal, TaxDocPreviewType } from './TaxRecoveryDocPreviewModal';
import { FiscalChronologicalTimeline60M } from './FiscalChronologicalTimeline60M';
import { ExpertAccountantPanel } from './ExpertAccountantPanel';
import { InssObrasPanel } from './InssObrasPanel';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { UnifiedTenantService } from '../../services/unifiedTenantService';
import { 
  PartnerPortfolioService, 
  PartnerPortfolioClient 
} from '../../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from '../common/PartnerPortfolioScopeSelector';

import { AuditRecord } from '../../types/aos';

interface LegalTaxRecoveryPanelProps {
  onBackToDashboard?: () => void;
  onNavigateToOracle?: () => void;
  onNavigateTab?: (tab: any) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

interface TaxTeseItem {
  id: string;
  title: string;
  code: string;
  court: string;
  status: 'HABILITADO_RFB' | 'EM_COMPENSACAO' | 'PROVA_CALCULADA' | 'LAUDO_PRONTO';
  statusLabel: string;
  creditAmount: number;
  documentsCount: number;
  riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO';
  riskScore?: 'VERDE' | 'AMARELO' | 'VERMELHO';
  riskScoreLabel?: string;
  actionProtocol?: string;
  jurisprudence: string;
  description: string;
  nfeSampleHash: string;
}

export const LegalTaxRecoveryPanel: React.FC<LegalTaxRecoveryPanelProps> = ({
  onBackToDashboard,
  onNavigateToOracle,
  onNavigateTab,
  onAddAuditRecord
}) => {
  const { currentUserRole } = useAuth();
  const isPartner = isPartnerPortfolioScope(currentUserRole);

  // Shared tenant & diagnosis data from the Bridge
  const [tenantData, setTenantData] = useState<SharedTenantTaxData>(() => TenantTaxRecoveryBridge.get());
  const [portfolioClients, setPortfolioClients] = useState<PartnerPortfolioClient[]>(() => 
    PartnerPortfolioService.getPortfolioClients()
  );
  const [unifiedTenants, setUnifiedTenants] = useState(() => UnifiedTenantService.getAllTenants());

  useEffect(() => {
    const unsub = TenantTaxRecoveryBridge.subscribe((updated) => {
      setTenantData(updated);
    });
    return unsub;
  }, []);

  // Sync unified tenants across all platform activities
  useEffect(() => {
    const unsub = UnifiedTenantService.subscribe((tenant) => {
      setUnifiedTenants(UnifiedTenantService.getAllTenants());
      if (tenant) {
        TenantTaxRecoveryBridge.syncFromTenantProfile(tenant);
      }
    });
    return unsub;
  }, []);

  // Sync portfolio clients
  useEffect(() => {
    if (!isPartner) return;
    const unsub = PartnerPortfolioService.subscribe(() => {
      setPortfolioClients(PartnerPortfolioService.getPortfolioClients());
    });
    return unsub;
  }, [isPartner]);

  // If partner, enforce that tenant belongs to partner's portfolio
  useEffect(() => {
    if (isPartner && tenantData.cnpj) {
      if (!PartnerPortfolioService.isCnpjInPortfolio(tenantData.cnpj)) {
        const active = PartnerPortfolioService.getActiveClient();
        TenantTaxRecoveryBridge.update({
          companyName: active.companyName,
          cnpj: active.cnpj,
          sectorName: active.sectorName,
          annualRevenue: active.annualRevenue
        });
      }
    }
  }, [isPartner, tenantData.cnpj]);

  const handleSwitchTenant = (presetIdOrCnpj: string) => {
    const target = UnifiedTenantService.setActiveTenant(presetIdOrCnpj);
    if (target) {
      TenantTaxRecoveryBridge.syncFromTenantProfile(target);
    }
    if (isPartner) {
      PartnerPortfolioService.setActiveClient(presetIdOrCnpj);
    }
  };

  // Revenue Shield State & Modals
  const [shieldState, setShieldState] = useState<RevenueShieldState>(() => RevenueShieldService.get());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isExclusivityModalOpen, setIsExclusivityModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubShield = RevenueShieldService.subscribe((updated) => {
      setShieldState(updated);
    });
    return unsubShield;
  }, []);

  // Navigation tabs inside the Legal Tax Panel
  const [activeSubTab, setActiveSubTab] = useState<
    'dupla_defesa' | 'linha_tempo_60m' | 'motor_calculo_pericial' | 'perito_contabil' | 'inss_obras' | 'frente1_preventivo' | 'frente2_remediacao' | 'kit_processual' | 'auditoria_cruzada_sped' | 'pgfn_calculator' | 'partner_split' | 'ncm_monitor' | 'sisbajud' | 'value_proof' | 'dossier' | 'blindagem_receita'
  >('dupla_defesa');
  
  // Pipeline stage active view (1: Socorro Judicial, 2: Recuperação, 3: Retenção Permanente)
  const [activePipelineStage, setActivePipelineStage] = useState<1 | 2 | 3>(1);

  // Selected Front in Dupla Defesa view
  const [selectedFrente, setSelectedFrente] = useState<'frente1' | 'frente2' | 'both'>('both');

  // Risk filter state for Frente 2
  const [riskFilter, setRiskFilter] = useState<'TODOS' | 'VERDE' | 'AMARELO' | 'VERMELHO'>('TODOS');

  // Interactive PGFN Transação Simulator State
  const [cdaAmount, setCdaAmount] = useState<number>(() => {
    // Proportional to revenue if present
    const base = tenantData.annualRevenue ? Math.round(tenantData.annualRevenue * 0.059) : 3200000;
    return Math.max(800000, base);
  });
  const [capagRating, setCapagRating] = useState<'A' | 'B' | 'C' | 'D'>('D');
  const [discountPercent, setDiscountPercent] = useState<number>(65);
  const [installmentsCount, setInstallmentsCount] = useState<number>(120);
  const [selectedTeseForDetail, setSelectedTeseForDetail] = useState<TaxTeseItem | null>(null);
  const [isExportingDossier, setIsExportingDossier] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Document Preview Modal State
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState<boolean>(false);
  const [docPreviewType, setDocPreviewType] = useState<TaxDocPreviewType>('dossier_cda');

  const handleOpenDocPreview = (type: TaxDocPreviewType = 'dossier_cda') => {
    setDocPreviewType(type);
    setIsDocPreviewOpen(true);
  };
  
  // Preventive Shield Simulation States
  const [originInterceptorActive, setOriginInterceptorActive] = useState<boolean>(true);
  const [spedContinuousAuditActive, setSpedContinuousAuditActive] = useState<boolean>(true);
  const [focusRiskAlertsActive, setFocusRiskAlertsActive] = useState<boolean>(true);
  const [simulatedNfeInterception, setSimulatedNfeInterception] = useState<boolean>(false);
  const [simulatedSpedRun, setSimulatedSpedRun] = useState<boolean>(false);

  // Permanent Retention Subscription State
  const [escudoAtivoPlanActive, setEscudoAtivoPlanActive] = useState<boolean>(true);
  const [migratedToEscudoAtivo, setMigratedToEscudoAtivo] = useState<boolean>(false);

  // Dynamic Teses mapped from Bridge preliminaryScan
  const tesesList: TaxTeseItem[] = (tenantData.preliminaryScan?.teses || []).map((t) => ({
    id: t.id,
    title: t.title,
    code: t.code,
    court: t.court,
    status: (t.status === 'HABILITADO_RFB' ? 'HABILITADO_RFB' : t.status === 'EM_COMPENSACAO' ? 'EM_COMPENSACAO' : t.status === 'PROVA_CALCULADA' ? 'PROVA_CALCULADA' : 'LAUDO_PRONTO') as any,
    statusLabel: t.statusLabel,
    creditAmount: t.estimatedCredit,
    documentsCount: t.documentsAnalyzed,
    riskLevel: t.riskLevel,
    riskScore: t.riskScore || (t.riskLevel === 'BAIXO' ? 'VERDE' : t.riskLevel === 'MEDIO' ? 'AMARELO' : 'VERMELHO'),
    riskScoreLabel: t.riskScoreLabel || (t.riskLevel === 'BAIXO' ? 'Verde (Pacificado STF/STJ)' : t.riskLevel === 'MEDIO' ? 'Amarelo (Precedente Vinculante)' : 'Vermelho (Ação com Depósito)'),
    actionProtocol: t.actionProtocol || 'Compensação direta via PER/DCOMP Web e e-CAC RFB',
    jurisprudence: t.jurisprudence,
    description: t.description,
    nfeSampleHash: `0x${t.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4)}... (${t.documentsAnalyzed.toLocaleString('pt-BR')} docs auditados)`
  }));

  const filteredTeses = tesesList.filter((t) => {
    if (riskFilter === 'TODOS') return true;
    return t.riskScore === riskFilter;
  });

  const handleChangeRegime = (regime: TaxRegime) => {
    TenantTaxRecoveryBridge.runScan(
      tenantData.annualRevenue || 42000000,
      tenantData.sectorKey || 'manufacturing',
      true,
      regime
    );
  };

  // Total calculated recoverable credits (5 years / 60 months)
  const totalRecoverableCredits = tenantData.preliminaryScan?.totalEstimatedCredits || 1840250.00;

  // PGFN Calculations
  const calculatedDiscount = (cdaAmount * 0.45) * (discountPercent / 100); // Discount on interest/penalties (~45% of total CDA)
  const recalculatedDebt = Math.max(cdaAmount * 0.30, cdaAmount - calculatedDiscount);
  const estimatedMonthlyInstallment = recalculatedDebt / installmentsCount;
  const netSavings = cdaAmount - recalculatedDebt;

  const handleExportDossier = () => {
    setIsExportingDossier(true);
    setExportSuccess(false);

    try {
      generateLegalTaxDossierPdf({
        companyName: tenantData.companyName || 'Vortex Logística & Manufatura S.A.',
        cnpj: tenantData.cnpj || '33.041.260/0001-88',
        sectorName: tenantData.sectorName || 'Manufatura & Indústria Pesada',
        totalCredits: totalRecoverableCredits,
        teses: (tesesList || []).map(t => ({
          code: t.code,
          title: t.title,
          court: t.court,
          estimatedCredit: t.creditAmount,
          riskScoreLabel: t.riskScoreLabel || 'Pacificada',
          statusLabel: t.statusLabel || 'Habilitado RFB'
        })),
        hashSha256: tenantData.preliminaryScan?.hashSha256,
        signatoryName: 'Dr. Marcelo Vasconcelos Ribeiro / Rodrigo Antunes (CFO)',
        signatoryRole: 'Procurador Legal & Diretor Financeiro'
      });
    } catch (e) {
      console.error('Falha ao gerar PDF de laudo tributário:', e);
    }

    setTimeout(() => {
      setIsExportingDossier(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    }, 800);
  };

  const handleTriggerNfeInterceptionSimulation = () => {
    setSimulatedNfeInterception(true);
    setTimeout(() => {
      setSimulatedNfeInterception(false);
    }, 4500);
  };

  const handleTriggerSpedAuditSimulation = () => {
    setSimulatedSpedRun(true);
    setTimeout(() => {
      setSimulatedSpedRun(false);
    }, 3000);
  };

  const handleMigrateToEscudoAtivo = () => {
    setMigratedToEscudoAtivo(true);
    setEscudoAtivoPlanActive(true);
    setTimeout(() => {
      setActiveSubTab('frente1_preventivo');
    }, 1200);
  };

  return (
    <div id="panel-legal-tax-recovery" className="max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="Recuperação Tributária Legal & Processual"
        currentCnpj={tenantData.cnpj}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: EXACT ASCII MATCH & BRANDING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--vx-deep)] border border-emerald-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                AOS VELATRIX // DUPLA DEFESA & TAX RECOVERY ENGINE
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                ESCUDO PREVENTIVO + REMEDIAÇÃO
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                PGFN / SISPAR / SISBAJUD
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2 font-mono">
              <span>ARQUITETURA DE DUPLA DEFESA &amp; RECUPERAÇÃO FISCAL</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Sistema pericial de blindagem completa: Escudo Preventivo (Zero Litígio Futuro na Origem do SPED) e Remediação Ativa (Recuperação de Créditos de 5 Anos + Acordos PGFN).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onNavigateTab && (
              <button
                type="button"
                id="btn-back-to-diagnosis"
                onClick={() => onNavigateTab('express_diagnosis')}
                className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-xs font-mono text-[var(--vx-neon)] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Database className="w-3.5 h-3.5" />
                <span>← Diagnóstico &amp; Proposta Raio-X</span>
              </button>
            )}

            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 font-bold transition-all cursor-pointer"
              >
                Dashboard Operacional
              </button>
            )}

            <button
              id="btn-nav-linha-tempo-60m"
              type="button"
              onClick={() => setActiveSubTab('linha_tempo_60m')}
              className="px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-xs font-mono text-emerald-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Linha do Tempo 60 Meses</span>
            </button>

            <button
              id="btn-export-legal-dossier"
              type="button"
              onClick={() => handleOpenDocPreview('dossier_cda')}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-600/20"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Visualizar &amp; Baixar Dossiê Pericial</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* SHARED TENANT CONTEXT BAR & INGESTED DOCUMENTS (SPED/DRE/OFX/ERP) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2.5 border-b border-slate-850">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold font-mono text-slate-100">{tenantData.companyName}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    CNPJ: <strong className="text-slate-300">{tenantData.cnpj}</strong>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold">
                    {tenantData.sectorName}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  ERP Integrado: <strong className="text-cyan-400">{tenantData.activeErp}</strong> • Receita Auditada: <strong className="text-emerald-300">{formatCurrency(tenantData.annualRevenue, 'BRL')} / ano</strong> • Conexão: <span className="text-emerald-400">Ativa D+0</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor de Tenant / Cenário de Teste Fictício */}
              <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-lg shadow-sm">
                <span className="text-[10px] font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tenant Selecionado:
                </span>
                <select
                  id="select-tenant-dropdown"
                  value={tenantData.cnpj}
                  onChange={(e) => {
                    handleSwitchTenant(e.target.value);
                  }}
                  className="bg-slate-950 text-white font-mono text-xs border border-slate-700 rounded px-2.5 py-1 focus:border-emerald-400 focus:outline-none cursor-pointer max-w-[280px] sm:max-w-[340px]"
                >
                  {unifiedTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.cnpj}>
                      {tenant.name} ({tenant.cnpj})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sincronizado automaticamente com <strong>Diagnóstico Integral D+0</strong> (Sem re-upload)</span>
              </div>
            </div>
          </div>

          {/* Ingested Documents Shared Row */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider block">
              Documentos &amp; SPED Compartilhados do Diagnóstico:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {tenantData.documents && tenantData.documents.length > 0 ? (
                tenantData.documents.map((doc) => (
                  <div key={doc.id} className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono font-bold text-slate-200 truncate">{doc.name}</div>
                        <div className="text-[9px] font-mono text-slate-400">{doc.typeLabel} • {doc.size}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold shrink-0">
                      Auditado
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-2.5 bg-slate-900/60 rounded-lg text-xs font-mono text-slate-400">
                  Documentos SPED e DRE sincronizados automaticamente via Ingestão D+0.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* PIPELINE DE 3 ETAPAS: FUNIL DE VALOR & RETENÇÃO PERMANENTE */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="p-4 bg-slate-950/90 border border-slate-800/90 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-300 font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              PIPELINE OPERACIONAL DE ATUAÇÃO E RETENÇÃO SAAS
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Do Passivo Imediato à Blindagem Recorrente
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            {/* ETAPA 1: SOCORRO JUDICIAL */}
            <div 
              onClick={() => { setActivePipelineStage(1); setActiveSubTab('sisbajud'); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                activePipelineStage === 1 
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/30' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  [ 1. SOCORRO JUDICIAL ]
                </span>
                <span className="text-[10px] font-mono text-slate-500">D+0 Emergencial</span>
              </div>
              <strong className="text-xs font-bold text-slate-100 block">
                Auditoria do Passivo & Provas
              </strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                AOS audita o passivo de dívida ativa, emite laudo pericial da CDA e blindagem Sisbajud via Seguro Garantia para o advogado.
              </p>
              <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1 pt-1">
                <span>• Risco de Bloqueio Mitigado</span>
              </div>
            </div>

            {/* ETAPA 2: RECUPERAÇÃO */}
            <div 
              onClick={() => { setActivePipelineStage(2); setActiveSubTab('frente2_remediacao'); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                activePipelineStage === 2 
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/30' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  [ 2. RECUPERAÇÃO ]
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">R$ 1.84M + -65% PGFN</span>
              </div>
              <strong className="text-xs font-bold text-slate-100 block">
                Créditos 5 Anos & Transação
              </strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Recupera créditos acumulados (60 meses) e reduz a dívida na Justiça via Transação Excepcional com até 70% de desconto.
              </p>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1">
                <span>• Economia Total R$ 3,89M</span>
              </div>
            </div>

            {/* ETAPA 3: RETENÇÃO PERMANENTE */}
            <div 
              onClick={() => { setActivePipelineStage(3); setActiveSubTab('frente1_preventivo'); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                activePipelineStage === 3 
                  ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/30' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  [ 3. RETENÇÃO PERMANENTE ]
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">Escudo Ativo Mensal</span>
              </div>
              <strong className="text-xs font-bold text-slate-100 block">
                Transição para Escudo Ativo
              </strong>
              <p className="text-[11px] text-slate-400 leading-snug">
                Transfere o cliente para o plano mensal "Escudo Ativo" (zero litígio futuro com trava pré-emissão e auditoria contínua de SPED).
              </p>
              <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 pt-1">
                <span>• Assinatura SaaS Recorrente</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* DUPLA DEFESA: SUMMARY CARDS (FRENTE 1 VS FRENTE 2) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* FRENTE 1: ESCUDO PREVENTIVO (ZERO LITÍGIO FUTURO) */}
          <div 
            onClick={() => setActiveSubTab('frente1_preventivo')}
            className="lg:col-span-6 bg-slate-950/90 border border-cyan-500/40 hover:border-cyan-400 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                FRENTE 1: ESCUDO PREVENTIVO (Zero Litígio Futuro)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                Origem & SPED
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">├── Trava de Inconformidade Fiscal na Origem</span>
                <span className="text-emerald-400 font-bold">ATIVA (Pré-NF-e)</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">├── Auditoria Contínua de SPED / EFDS</span>
                <span className="text-cyan-400 font-bold">100% Cruzado D-1</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">└── Alerta Risco-Foco (Gargalos de Autuação)</span>
                <span className="text-amber-400 font-bold">0 Autuações</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-cyan-400 font-mono">
              <span>Blindagem em Tempo Real</span>
              <span className="group-hover:translate-x-1 transition-transform">Ver Detalhes da Frente 1 →</span>
            </div>
          </div>

          {/* FRENTE 2: REMEDIAÇÃO & RECUPERAÇÃO (PROCESSO ATIVO) */}
          <div 
            onClick={() => setActiveSubTab('frente2_remediacao')}
            className="lg:col-span-6 bg-slate-950/90 border border-emerald-500/40 hover:border-emerald-400 rounded-xl p-5 space-y-3 flex flex-col justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-400" />
                FRENTE 2: REMEDIAÇÃO & RECUPERAÇÃO (Processo Ativo)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                5 Anos / PGFN
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">├── Levantamento de Créditos Acumulados</span>
                <span className="text-emerald-400 font-bold">R$ 1.840.250,00</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">├── Cálculo de Capacidade de Pagamento (PGFN)</span>
                <span className="text-cyan-400 font-bold">CAPAG D (65% OFF)</span>
              </div>
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">└── Dossiê Pericial Automático para Defesa</span>
                <span className="text-emerald-400 font-bold">SHA-256 Pronto</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
              <span>70.840 Documentos Auditados</span>
              <span className="group-hover:translate-x-1 transition-transform">Ver Detalhes da Frente 2 →</span>
            </div>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* NAVIGATION SUB-TABS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        
        <button
          type="button"
          onClick={() => setActiveSubTab('dupla_defesa')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dupla_defesa'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Matriz Dupla Defesa & Funil</span>
        </button>

        <button
          id="subtab-linha-tempo-60m"
          type="button"
          onClick={() => setActiveSubTab('linha_tempo_60m')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'linha_tempo_60m'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-950/40'
              : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span>Linha do Tempo (60 Meses)</span>
          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
            NF-e/SPED
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('motor_calculo_pericial')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'motor_calculo_pericial'
              ? 'bg-cyan-500/25 text-[var(--vx-neon)] border border-cyan-500/60 shadow-lg shadow-cyan-950/40'
              : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-cyan-950/40 border border-cyan-500/20'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
          <span>Motor de Cálculo Pericial</span>
          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono">
            Judicial/Admin
          </span>
        </button>

        <button
          id="subtab-perito-contabil"
          type="button"
          onClick={() => setActiveSubTab('perito_contabil')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'perito_contabil'
              ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-950/40'
              : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>Perito Contábil / Assistente Técnico</span>
          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono">
            CRC/CNPC
          </span>
        </button>

        <button
          id="subtab-inss-obras"
          type="button"
          onClick={() => setActiveSubTab('inss_obras')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'inss_obras'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/60 shadow-lg shadow-amber-950/40'
              : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-500/20'
          }`}
        >
          <HardHat className="w-3.5 h-3.5 text-amber-400" />
          <span>INSS-Obras (Construção Civil)</span>
          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
            CNO / SERO
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('frente1_preventivo')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'frente1_preventivo'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Frente 1: Escudo Preventivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('frente2_remediacao')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'frente2_remediacao'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Frente 2: Teses & Regimes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('kit_processual')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'kit_processual'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Kit Processual (Petições & Procuração)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('auditoria_cruzada_sped')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'auditoria_cruzada_sped'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Auditoria Cruzada & Retificador SPED</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('pgfn_calculator')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'pgfn_calculator'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Cálculo PGFN</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('partner_split')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'partner_split'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Correspondentes & Parcerias</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ncm_monitor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'ncm_monitor'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Monitor de NCMs</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sisbajud')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'sisbajud'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Socorro Sisbajud</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('value_proof')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'value_proof'
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Prova de Resultado & Certificado</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('dossier')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dossier'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Dossiê Pericial & LGPD</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('blindagem_receita')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'blindagem_receita'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>Blindagem de Receita & Não-Circunvenção</span>
          {!shieldState.isSplitConfirmed ? (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold">
              Gate Ativo
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 font-bold">
              Split OK
            </span>
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: MATRIZ DUPLA DEFESA & FUNIL INTERATIVO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'dupla_defesa' && (
        <div className="space-y-6">
          
          {/* ASCII Structural Diagram in High-Fidelity Box */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  Estrutura Integrada do AOS Velatrix Dupla Defesa
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                Conceito de Blindagem Ponta a Ponta
              </span>
            </div>

            <div className="font-mono text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto leading-relaxed">
              <pre className="text-emerald-400 font-bold">
{`┌── FRENTE 1: ESCUDO PREVENTIVO (Zero Litígio Futuro)
│    ├── Trava de Inconformidade Fiscal na Origem
│    ├── Auditoria Contínua de SPED / EFDS antes do envio
│    └── Alerta Risco-Foco (Gargalos que geram autuação)
[ AOS VELATRIX DUPLA DEFESA ] ────┤
│
└── FRENTE 2: REMEDIAÇÃO & RECUPERAÇÃO (Processo Ativo)
     ├── Levantamento de Créditos Acumulados (5 Anos)
     ├── Cálculo de Capacidade de Pagamento (PGFN / Transação)
     └── Dossiê Pericial Automático para Defesa Judicial`}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
                <div className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Frente 1: Escudo Preventivo</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Garante que nenhuma nota com alíquota divergente, NCM desatualizado ou ICMS-ST indevido chegue ao SEFAZ/SPED, exterminando passivos futuros na raiz.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('frente1_preventivo')}
                  className="text-xs font-mono text-cyan-400 hover:underline pt-1 block cursor-pointer"
                >
                  Configurar Travas Preventivas →
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-2">
                <div className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-400" />
                  <span>Frente 2: Remediação & Recuperação</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Recupera até R$ 1,84M em créditos não aproveitados dos últimos 60 meses e estrutura transações PGFN com até 70% de desconto para parcelamento em 145x.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('frente2_remediacao')}
                  className="text-xs font-mono text-emerald-400 hover:underline pt-1 block cursor-pointer"
                >
                  Consultar Créditos e Teses →
                </button>
              </div>
            </div>
          </div>

          {/* Interactive 3-Stage Retention Funnel Callout */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  Modelo de Negócio e Retenção
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  Transição do Cliente: Do Socorro Jurídico ao Plano Mensal "Escudo Ativo"
                </h3>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Ao concluir a recuperação pericial e a transação da dívida, a empresa é transferida de um trabalho pontual para a assinatura contínua do <strong>Escudo Ativo (R$ 2.490/mês)</strong>, assegurando conformidade perene.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleMigrateToEscudoAtivo}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Migrar para "Escudo Ativo" →</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: FRENTE 1 - ESCUDO PREVENTIVO (ZERO LITÍGIO FUTURO) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'frente1_preventivo' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                FRENTE 1: ESCUDO PREVENTIVO (Zero Litígio Futuro)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Intercepção em Tempo Real
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              O Escudo Preventivo atua como uma barreira pré-fiscal entre o ERP da empresa e a SEFAZ/RFB, neutralizando inconsistências que gerariam autos de infração e glosas de crédito.
            </p>
          </div>

          {/* The 3 Core Pillars of Frente 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* PILLAR 1: Trava de Inconformidade Fiscal na Origem */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    Trava de Inconformidade na Origem
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Intercepção de XML de NF-e antes da assinatura digital. Valida NCM, alíquota de ICMS, CEST e regras interestaduais de Difal.
                </p>
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Taxa de Bloqueio:</span>
                    <span className="text-cyan-400 font-bold">100% Inconsistências</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo de Análise:</span>
                    <span className="text-emerald-400 font-bold">12ms por NF-e</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerNfeInterceptionSimulation}
                disabled={simulatedNfeInterception}
                className="w-full py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800 text-xs font-mono text-cyan-300 font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {simulatedNfeInterception ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Interceptando XML de Teste...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Testar Intercepção Pré-Emissão</span>
                  </>
                )}
              </button>
            </div>

            {/* PILLAR 2: Auditoria Contínua de SPED / EFDS antes do envio */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    Auditoria Contínua SPED / EFDS
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Varredura contínua de EFD-ICMS/IPI e EFD-Contribuições cruzando com extratos bancários e DCTFWeb antes do envio à Receita Federal.
                </p>
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Confronto Bloco 0, C e M:</span>
                    <span className="text-emerald-400 font-bold">100% Conciliado</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Malha Fina Risco:</span>
                    <span className="text-emerald-400 font-bold">0.00%</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTriggerSpedAuditSimulation}
                disabled={simulatedSpedRun}
                className="w-full py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-xs font-mono text-emerald-300 font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                {simulatedSpedRun ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditando 18 Arquivos SPED...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Rodar Auditoria Pré-Envio</span>
                  </>
                )}
              </button>
            </div>

            {/* PILLAR 3: Alerta Risco-Foco (Gargalos que geram autuação) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Alerta Risco-Foco (Autuações)
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Matriz preditiva que identifica divergências entre estoque contábil (Bloco K), créditos escriturados e faturamento presumido.
                </p>
                <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] font-mono space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span>Gargalos Monitorados:</span>
                    <span className="text-slate-200 font-bold">142 Regras RFB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status de Proteção:</span>
                    <span className="text-cyan-400 font-bold">Blindado</span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-center text-slate-400">
                Monitoramento Ativo 24/7
              </div>
            </div>

          </div>

          {/* Simulation Output Banner */}
          {simulatedNfeInterception && (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-xl space-y-2 text-xs font-mono animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Intercepção Preventiva Acionada com Sucesso:</span>
              </div>
              <p className="text-slate-300">
                [BLOQUEIO PREVENTIVO] NF-e nº 492.102 continha NCM 8471.30.12 com alíquota interestadual indevida (12% em vez de 4% de importação). O XML foi corrigido automaticamente antes da transmissão ao SEFAZ, evitando autuação de R$ 14.800,00.
              </p>
            </div>
          )}

          {simulatedSpedRun && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Auditoria de SPED Concluída:</span>
              </div>
              <p className="text-slate-300">
                SPED Fiscal e EFD-Contribuições 100% conciliados com o livro de apuração e DCTFWeb. Nenhuma inconformidade de Bloco C ou Bloco M encontrada. Arquivo liberado para assinatura e transmissão.
              </p>
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: FRENTE 2 - REMEDIAÇÃO & RECUPERAÇÃO (PROCESSO ATIVO) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'frente2_remediacao' && (
        <div className="space-y-6">
          
          {/* Header Banner */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-emerald-400" />
                    FRENTE 2: REMEDIAÇÃO & RECUPERAÇÃO (60 Meses Retroativos)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Regime: {tenantData.taxRegime.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Levantamento pericial de 60 meses retroativos aplicando teses pacificadas no STF e STJ com cálculo automatizado linha a linha.
                </p>
              </div>

              <div className="flex flex-col items-end shrink-0">
                <span className="text-[10px] font-mono uppercase text-slate-500">Crédito Total Estimado</span>
                <span className="text-xl font-mono text-emerald-400 font-black">
                  {formatCurrency(totalRecoverableCredits, 'BRL')}
                </span>
              </div>
            </div>

            {/* Regime Selector & Risk Filter Row */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Regime Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Regime Tributário:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleChangeRegime('lucro_real')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      tenantData.taxRegime === 'lucro_real'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lucro Real
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeRegime('lucro_presumido')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      tenantData.taxRegime === 'lucro_presumido'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lucro Presumido
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeRegime('simples_nacional')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      tenantData.taxRegime === 'simples_nacional'
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Simples Nacional
                  </button>
                </div>
              </div>

              {/* Risk Score Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Score de Risco:</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setRiskFilter('TODOS')}
                    className={`px-2.5 py-1 rounded-lg transition-colors ${
                      riskFilter === 'TODOS' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({tesesList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter('VERDE')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      riskFilter === 'VERDE' ? 'bg-emerald-500/30 text-emerald-300 font-bold border border-emerald-500/50' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Verde (Pacificado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter('AMARELO')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      riskFilter === 'AMARELO' ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/50' : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Amarelo (Precedente)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskFilter('VERMELHO')}
                    className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                      riskFilter === 'VERMELHO' ? 'bg-rose-500/30 text-rose-300 font-bold border border-rose-500/50' : 'text-rose-400 hover:text-rose-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Vermelho (Depósito)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Teses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeses.map((tese) => (
              <div 
                key={tese.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{tese.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 mt-0.5 block">{tese.code}</span>
                  </div>

                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase shrink-0 ${
                    tese.status === 'HABILITADO_RFB'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : tese.status === 'EM_COMPENSACAO'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {tese.statusLabel}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Crédito Pericial Apurado</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">
                      {formatCurrency(tese.creditAmount, 'BRL')}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-slate-300 space-y-1">
                    <div>{tese.documentsCount.toLocaleString('pt-BR')} Documentos</div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        tese.riskScore === 'VERDE' ? 'bg-emerald-400' : tese.riskScore === 'AMARELO' ? 'bg-amber-400' : 'bg-rose-400'
                      }`}></span>
                      <span className="font-semibold text-slate-200">{tese.riskScoreLabel}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {tese.description}
                </p>

                {/* Protocol Row */}
                <div className="p-2.5 bg-slate-900/50 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-emerald-400 font-semibold">
                    📋 Protocolo: <span className="text-slate-300 font-normal">{tese.actionProtocol}</span>
                  </div>
                  <div className="text-slate-500">
                    Jurisprudência: <span className="text-slate-400">{tese.jurisprudence}</span> ({tese.court})
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Evidência: {tese.nfeSampleHash}</span>
                  <button
                    onClick={() => setActiveSubTab('kit_processual')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Gerar Petição</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-300">
              Deseja exportar a planilha analítica ou gerar o kit de petições com a procuração e contrato de success fee?
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSubTab('kit_processual')}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Kit Processual →
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('dossier')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Dossiê Completo →
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: KIT PROCESSUAL AUTOMÁTICO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'kit_processual' && (
        <ProceduralKitSection tenantData={tenantData} />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: AUDITORIA CRUZADA & RETIFICADOR SPED */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'auditoria_cruzada_sped' && (
        <CrossAuditSpedEditorSection tenantData={tenantData} />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: CORRESPONDENTES & PARCERIAS (P23 — sem participação da Velatrix) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'partner_split' && (
        <CorrespondentesPanel />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: MONITOR DE NCMS & RADAR LEGISLATIVO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'ncm_monitor' && (
        <NcmTaxMonitorPanel 
          tenantData={tenantData} 
          onSwitchTenant={handleSwitchTenant}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: PROVA DE RESULTADO & CERTIFICADO DE BLINDAGEM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'value_proof' && (
        <ValueProofBenchmarkPanel tenantData={tenantData} />
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: CALCULADORA DE CAPACIDADE DE PAGAMENTO PGFN / SISPAR */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'pgfn_calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Controls */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                Parametrização SISPAR / PGFN
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Cálculo de Capacidade de Pagamento
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste os parâmetros conforme a Capacidade de Pagamento (CAPAG) da empresa para formular o acordo ótimo de Transação Excepcional.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">
                  Valor Total do Passivo em Dívida Ativa (CDA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={cdaAmount}
                    onChange={(e) => setCdaAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">
                  Rating CAPAG da Empresa
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setCapagRating(r);
                        if (r === 'D') setDiscountPercent(65);
                        else if (r === 'C') setDiscountPercent(50);
                        else if (r === 'B') setDiscountPercent(30);
                        else setDiscountPercent(10);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        capagRating === r
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      CAPAG {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-mono text-[10px] uppercase">
                  <span>Desconto em Juros e Multas</span>
                  <span className="text-emerald-400 font-bold">{discountPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-mono text-[10px] uppercase">
                  <span>Prazo de Parcelamento</span>
                  <span className="text-cyan-400 font-bold">{installmentsCount} meses</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="145"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Output Results */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold">
                  Resultado Consolidado da Proposta de Acordo
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  Portaria PGFN nº 6757/2022
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Passivo Original</div>
                  <div className="text-sm font-bold text-slate-200 font-mono mt-1">
                    {formatCurrency(cdaAmount, 'BRL')}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Economia Direta</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                    - {formatCurrency(netSavings, 'BRL')}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Parcela Mensal</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-1">
                    {formatCurrency(estimatedMonthlyInstallment, 'BRL')}/mês
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-300 font-bold font-mono">
                  <span>Passivo Recalculado Pós-Transação:</span>
                  <span className="text-base">{formatCurrency(recalculatedDebt, 'BRL')}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  O valor da parcela estimada ({formatCurrency(estimatedMonthlyInstallment, 'BRL')}) consome apenas 1.2% do fluxo de caixa operacional, garantindo a liquidez nos 10.000 cenários estocásticos do Oráculo.
                </p>
              </div>

              {onNavigateToOracle && (
                <button
                  type="button"
                  onClick={onNavigateToOracle}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-400 font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Validar Impacto desta Parcela no Oráculo de Caixa →</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: MONITOR SISBAJUD & SOCORRO JUDICIAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'sisbajud' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-rose-400 font-bold uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                [ 1. SOCORRO JUDICIAL ] Monitor SISBAJUD & Defesa Imediata
              </span>
              <span className="text-[10px] font-mono text-emerald-400">Barramento Sentinel Ativo</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interceptação preventiva de ordens de penhora online para substituição imediata por Seguro Garantia Judicial, evitando bloqueio de contas bancárias e colapso operacional da empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 font-mono">Execução Fiscal nº 5001284-91.2024.4.03.6100</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  DESPACHO INTERCEPTADO
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div><strong>Vara:</strong> 2ª Vara de Execuções Fiscais Federais de SP</div>
                <div><strong>Exequente:</strong> União Federal (Fazenda Nacional)</div>
                <div><strong>Valor em Risco:</strong> R$ 850.000,00</div>
              </div>
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] font-mono text-emerald-300">
                ✓ Apólice de Seguro Garantia Judicial nº 849201 protocolada preventivamente antes do bloqueio das contas bancárias.
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 font-mono">Ação Anulatória de Débito nº 1009842-14.2025.8.26.0100</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIMINAR DEFERIDA
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div><strong>Vara:</strong> 14ª Vara da Fazenda Pública de SP</div>
                <div><strong>Assunto:</strong> Suspensão de Exigibilidade de Auto de Infração ICMS-ST</div>
                <div><strong>Economia Imediata:</strong> R$ 340.000,00</div>
              </div>
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-[11px] font-mono text-cyan-300">
                ✓ Dossiê Pericial AOS utilizado como base probatória aceita integralmente pelo juízo.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: DOSSIÊ PERICIAL AUTOMÁTICO PARA DEFESA JUDICIAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'dossier' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Documentos técnicos emitidos pelo AOS prontos para download e instrução processual dos advogados:
            </p>
            <span className="text-[10px] font-mono text-slate-400">Padrão PJe / e-CAC / ICP-Brasil</span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'dossier_cda' as TaxDocPreviewType,
                name: 'Dossiê Pericial de CDA & Parecer Técnico Contábil',
                type: 'PDF Assinado (ICP-Brasil)',
                size: '4.8 MB',
                hash: 'SHA256: 0x9482f...c12e',
                status: 'PRONTO'
              },
              {
                id: 'analytical_table' as TaxDocPreviewType,
                name: 'Tabela Analítica Linha a Linha (70.840 Chaves de NF-e e EFD)',
                type: 'Planilha XLSX / CSV Auditado',
                size: '18.4 MB',
                hash: 'SHA256: 0x3b11a...998f',
                status: 'PRONTO'
              },
              {
                id: 'perdcomp_instruction' as TaxDocPreviewType,
                name: 'Arquivo de Instrução para Compensação PER/DCOMP',
                type: 'XML / Layout Receita Federal',
                size: '1.2 MB',
                hash: 'SHA256: 0x7c49e...fa01',
                status: 'PRONTO'
              },
              {
                id: 'pgfn_minuta' as TaxDocPreviewType,
                name: 'Minuta Parametrizada de Acordo de Transação SISPAR PGFN',
                type: 'DOCX / PDF Jurídico',
                size: '640 KB',
                hash: 'SHA256: 0x1f88a...229c',
                status: 'PRONTO'
              },
              {
                id: 'relatorio_ripd' as TaxDocPreviewType,
                name: 'Relatório de Impacto à Proteção de Dados (RIPD / DPIA - Art. 38 LGPD)',
                type: 'PDF Governança & Sigilo (LC 105/01 & Art. 198 CTN)',
                size: '2.4 MB',
                hash: 'SHA256: 0x8f2a9...f24d',
                status: 'PRONTO'
              }
            ].map((doc, idx) => (
              <div 
                key={idx}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{doc.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="text-slate-400">{doc.hash}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDocPreview(doc.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            ))}
          </div>

          {/* LGPD & Banking Secrecy Compliance */}
          <div className="pt-4">
            <LgpdBankingComplianceCard 
              onOpenRipdPreview={() => handleOpenDocPreview('relatorio_ripd')}
              companyName={tenantData.companyName}
              cnpj={tenantData.cnpj}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: LINHA DO TEMPO CRONOLÓGICA DE NOTAS FISCAIS (60 MESES) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'linha_tempo_60m' && (
        <div className="space-y-6">
          <FiscalChronologicalTimeline60M
            onRecordAudit={(author, role, action, target, details) => {
              if (onAddAuditRecord) {
                onAddAuditRecord({
                  id: `audit-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  eventId: 'EVT_TIMELINE_60M',
                  eventTitle: `Auditoria Cronológica 60 Meses: ${action}`,
                  decisionSummary: `${author} (${role}) realizou ${action} em ${target}. ${details || ''}`,
                  decisionAst: {
                    summary: action,
                    confidenceScore: 0.99,
                    legalSafeguards: ['Art. 168 CTN', 'Tema 69 STF', 'Lei 10.147/2000'],
                    suggestedRemediation: details || ''
                  } as any,
                  status: 'executed',
                  invariantSnapshot: [
                    'Art_168_CTN_Quinquenal_Valido',
                    'Tema_69_STF_Exclusao_ICMS_PIS_COFINS',
                    'Lei_10147_Monofasicos_Segregados',
                    'Auditoria_Cronologica_SEFAZ_dhEmi'
                  ],
                  signatures: [
                    {
                      role: role,
                      keyId: 'ECDSA-SECP256K1-AOS',
                      signedAt: new Date().toISOString(),
                      verified: true
                    }
                  ],
                  executionReceipt: `REC-60M-${Date.now()}`
                });
              }
            }}
            onNavigateToCalculoPericial={() => setActiveSubTab('motor_calculo_pericial')}
            onNavigateToSpedEditor={() => setActiveSubTab('auditoria_cruzada_sped')}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: MOTOR DE CÁLCULO PERICIAL DE RECUPERAÇÃO TRIBUTÁRIA */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'motor_calculo_pericial' && (
        <div className="space-y-6">
          <ExpertTaxCalculationEngine 
            companyName={tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A'}
            cnpj={tenantData.cnpj || '33.041.260/0001-88'}
            initialTaxRegime={tenantData.taxRegime === 'lucro_real' ? 'LUCRO_REAL' : tenantData.taxRegime === 'lucro_presumido' ? 'LUCRO_PRESUMIDO' : 'SIMPLES_NACIONAL'}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: PERITO CONTÁBIL & ASSISTENTE TÉCNICO JUDICIAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'perito_contabil' && (
        <div className="space-y-6">
          <ExpertAccountantPanel 
            tenantData={tenantData}
            onNavigateToCalculoPericial={() => setActiveSubTab('motor_calculo_pericial')}
            onNavigateToTimeline60M={() => setActiveSubTab('linha_tempo_60m')}
            onOpenDocPreview={(type) => {
              handleOpenDocPreview((type as any) || 'laudo_pericial_60m');
            }}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: INSS-OBRAS (CONSTRUÇÃO CIVIL & OBRAS PESADAS - LEI 8.212/91 & IN 2.110/22) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'inss_obras' && (
        <div className="space-y-6">
          <InssObrasPanel
            onBackToDashboard={onBackToDashboard}
            onNavigateTab={onNavigateTab}
            onAddAuditRecord={onAddAuditRecord}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB: BLINDAGEM DE RECEITA & NÃO-CIRCUNVENÇÃO (GATE & MONITOR) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'blindagem_receita' && (
        <AntiCircumventionMonitoringPanel 
          tenantData={tenantData}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
          onOpenExclusivityModal={() => setIsExclusivityModalOpen(true)}
        />
      )}

      {/* Modals for Payment Unlock & Exclusivity Agreement */}
      <RevenueShieldPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenantData={tenantData}
        onPaymentSuccess={() => {
          setShieldState(RevenueShieldService.get());
        }}
      />

      <ExclusivityAgreementModal
        isOpen={isExclusivityModalOpen}
        onClose={() => setIsExclusivityModalOpen(false)}
        tenantData={tenantData}
        onAcceptanceSaved={() => {
          setShieldState(RevenueShieldService.get());
        }}
      />

      {/* Official Tax Recovery Document Preview Modal */}
      <TaxRecoveryDocPreviewModal
        isOpen={isDocPreviewOpen}
        onClose={() => setIsDocPreviewOpen(false)}
        documentType={docPreviewType}
        tenantData={tenantData}
      />

    </div>
  );
};

