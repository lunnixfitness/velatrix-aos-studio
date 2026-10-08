import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Activity, 
  FileCode2, 
  History, 
  CheckCircle2, 
  Layers, 
  Building2, 
  Sliders, 
  Compass, 
  Zap, 
  Lock, 
  Globe, 
  Coins, 
  Landmark, 
  Menu, 
  Target, 
  ShieldAlert, 
  ToggleLeft, 
  ToggleRight,
  LogOut,
  User
} from 'lucide-react';
import { 
  EnterpriseKnowledgeGraph, 
  IndustrySector, 
  NavigationTab, 
  TenantProfile, 
  SupportedLanguage, 
  SupportedCurrency, 
  FiscalJurisdiction 
} from '../types/aos';
import { SectorRegulatoryBadge } from './SectorRegulatoryBadge';
import { TRANSLATIONS, getComplianceBadgeText } from '../utils/i18n';
import { VelatrixLogo } from './VelatrixLogo';
import { useAuth } from '../context/AuthContext';

interface AosHeaderProps {
  graph: EnterpriseKnowledgeGraph;
  activeEngine: 'gemini-3.8-flash' | 'gemini-3.7-flash' | 'local_neural_engine';
  currentSector?: IndustrySector;
  onSelectSector?: (sector: IndustrySector) => void;
  isProcessing: boolean;
  onOpenAstViewer: () => void;
  onOpenAuditLog: () => void;
  auditCount: number;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  tenantProfile?: TenantProfile;
  language?: SupportedLanguage;
  setLanguage?: (lang: SupportedLanguage) => void;
  currency?: SupportedCurrency;
  setCurrency?: (curr: SupportedCurrency) => void;
  fiscalJurisdiction?: FiscalJurisdiction;
  onOpenMobileMenu?: () => void;
  onOpenAskAos?: () => void;
}

export const AosHeader: React.FC<AosHeaderProps> = ({
  graph,
  activeEngine,
  currentSector = 'manufacturing',
  onSelectSector,
  isProcessing,
  onOpenAstViewer,
  onOpenAuditLog,
  auditCount,
  currentTab,
  onSelectTab,
  tenantProfile,
  language = 'pt',
  setLanguage,
  currency = 'BRL',
  setCurrency,
  fiscalJurisdiction = 'BR',
  onOpenMobileMenu,
  onOpenAskAos
}) => {
  const { currentUserRole, setCurrentUserRole, currentUser, logout } = useAuth();
  const isSuperAdmin = currentUserRole === 'super_admin';
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const safeJurisdiction: FiscalJurisdiction = (fiscalJurisdiction as FiscalJurisdiction) || 'BR';
  const complianceInfo = getComplianceBadgeText(safeJurisdiction);

  const getTabTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'operational_dashboard':
        return t.dashboard;
      case 'dre_waterfall':
        return 'Demonstração do Resultado do Exercício (DRE Completa • CPC 26 & Segregação Extraordinária)';
      case 'autonomous_swarm_brain':
        return 'Cérebro do Enxame Autônomo (Velatrix AOS Multi-Agent Swarm)';
      case 'roadmap_rollout_hub':
        return 'Roadmap de Lançamento [Fase 1 ➔ Fase 2]';
      case 'counterfactual_oracle':
        return 'Oráculo de Previsibilidade Contrafactual (Monte Carlo D+24)';
      case 'construct_lab':
        return 'Construct Lab (Agent Training Studio No-Code)';
      case 'deja_vu_detection':
        return 'Modo Déjà Vu (Detecção de Intrusão & Anomalias)';
      case 'legal_tax_recovery':
        return 'Painel de Defesa & Recuperação Fiscal Jurídica (PGFN / 5 Anos)';
      case 'inss_obras':
        return 'INSS-Obras (Construção Civil & Obras Pesadas — Lei 8.212/91 & IN RFB 2.110/2022)';
      case 'partner_portal':
        return 'Portal de Parceiros & Split Tributário (Afiliados)';
      case 'graph_health_workspace':
        return 'Central de Saúde & Heartbeat do Grafo AOS';
      case 'risk_engine_diagnosis':
        return t.riskDiagnosis || 'Raio-X de Risco & ROI';
      case 'erp_connector_config':
        return t.erpConnector || 'Conector ERP & Webhook';
      case 'vector_knowledge_store':
        return 'Barramento Vetorial RAG';
      case 'onboarding_wizard':
        return t.onboarding;
      case 'governance_settings':
        return t.governance;
      case 'api_keys_config':
        return 'Configurações de APIs · Cofre Seguro & Conexões Server-Side';
      case 'audit_ledger_view':
        return t.audit;
      case 'super_admin':
        return 'Painel Super-Admin Velatrix';
      case 'velatrix_office':
        return 'Escritório Velatrix (Gestão Interna)';
      default:
        return t.dashboard;
    }
  };

  const toggleDeveloperMode = () => {
    if (isSuperAdmin) {
      if (currentTab === 'super_admin') {
        onSelectTab('operational_dashboard');
      } else {
        onSelectTab('super_admin');
      }
    } else {
      // Non-superadmin cannot enter super-admin mode
      onSelectTab('operational_dashboard');
    }
  };

  return (
    <header id="aos-main-header" className="bg-[var(--vx-deep)]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-2.5 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Menu Button & Clear Title Hierarchy */}
        <div className="flex items-center gap-3.5 min-w-0">
          
          {/* Hamburger button for mobile / tablet */}
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            title="Abrir Menu Lateral"
          >
            <Menu className="w-5 h-5 text-[#FF7A00]" />
          </button>

          {/* Mobile Logo when Sidebar is hidden */}
          <div className="md:hidden flex items-center gap-1.5 shrink-0">
            <VelatrixLogo size="xs" variant="icon-only" />
            <span className="text-white font-bold text-xs font-sans tracking-tight">
              VELATRI<span className="text-[#FF7A00]">X</span>
            </span>
          </div>

          {/* Active View Title & Context (Desktop) */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight truncate">
                {getTabTitle(currentTab)}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-900 border border-slate-800 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00]" />
                Zero-GUI Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              <span className="text-slate-300 font-medium">{tenantProfile?.name}</span>
              <span className="text-slate-600 mx-1.5">•</span>
              <span>ERP: {tenantProfile?.connectedErp.split(' ')[0]}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Grouped Compact Badges and Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Sector Regulatory Badge (Discreet) */}
          <div className="hidden xl:block">
            <SectorRegulatoryBadge 
              currentSector={currentSector} 
              onSelectSector={onSelectSector}
              interactive={false}
            />
          </div>

          {/* Dynamic Regional Compliance Badge (Uniform enterprise style) */}
          <div id="gauge-dynamic-compliance" className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">{complianceInfo.title}:</span>
              <span className="text-[10px] font-semibold text-slate-200 font-mono">
                {complianceInfo.iconLabel}
              </span>
            </div>
          </div>

          {/* Health Index (Compact enterprise style) */}
          <div id="gauge-health-index" className="hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">{t.healthGraph}:</span>
              <span className="text-[10px] font-semibold text-slate-200 font-mono">{graph.healthIndex}%</span>
            </div>
          </div>

          {/* Wardenclyffe Data Sync (Compact indicator) */}
          <button
            id="gauge-wardenclyffe-sync"
            onClick={() => onSelectTab('erp_connector_config')}
            className="hidden 2xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-xs transition-colors cursor-pointer"
            title="Sincronização Indutiva Wireless Zero-API com ERP Legado"
          >
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
              <span className="text-[10px] font-mono text-slate-300">
                Sync <span className="text-emerald-400 font-medium">1.2ms</span>
              </span>
            </div>
          </button>

          {/* Quick Simulador de Diagnóstico CTA Button when not on Risk tab */}
          {currentTab !== 'risk_engine_diagnosis' && (
            <button
              id="btn-header-simulador-diagnostico"
              onClick={() => onSelectTab('risk_engine_diagnosis')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FF7A00]/10 hover:bg-[#FF7A00]/20 border border-[#FF7A00]/40 text-xs font-semibold text-[#FF7A00] transition-colors shadow-sm cursor-pointer"
              title="Acessar Simulador de Diagnóstico e Raio-X de Risco"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulador de Risco</span>
            </button>
          )}

          {/* Developer Mode Super-Admin Toggle Button */}
          <button
            id="btn-toggle-dev-mode"
            onClick={toggleDeveloperMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors shadow-sm cursor-pointer ${
              isSuperAdmin
                ? 'bg-slate-900 border-slate-700 text-indigo-300 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Alternar entre Visão Tenant e Painel Super-Admin"
          >
            {isSuperAdmin ? (
              <>
                <ToggleRight className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="hidden lg:inline">Super-Admin</span>
                <span className="lg:hidden text-[10px]">ADMIN</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="hidden lg:inline">Tenant</span>
                <span className="lg:hidden text-[10px]">TENANT</span>
              </>
            )}
          </button>

          {/* AST JSON Inspector */}
          <button
            id="btn-view-ast-json"
            onClick={onOpenAstViewer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition-colors shadow-sm cursor-pointer"
            title="Inspecionar AST JSON"
          >
            <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">{t.astInspect}</span>
          </button>

          {/* User Account & Logout Action */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {currentUser?.name || 'Executivo Conectado'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentUser?.role === 'super_admin' 
                  ? 'Super-Admin' 
                  : currentUser?.role === 'c_level_approver' 
                  ? 'CEO / C-Level' 
                  : currentUser?.role === 'cfo_executive'
                  ? 'CFO'
                  : 'Tenant Admin'}
              </span>
            </div>

            <button
              id="btn-header-logout"
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 text-xs font-medium text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Encerrar Sessão Segura"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
