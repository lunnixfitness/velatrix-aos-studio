import React, { useState } from 'react';
import { 
  Zap, 
  Target, 
  ShieldCheck, 
  History, 
  Activity, 
  Sparkles, 
  FileCode2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Database, 
  Network, 
  ShieldAlert, 
  SlidersHorizontal, 
  Building2, 
  Users, 
  Cpu, 
  Navigation, 
  Layers,
  LogOut,
  UserCheck,
  Scale,
  Briefcase,
  Bot,
  Calculator,
  HardHat,
  FileCheck,
  KeyRound
} from 'lucide-react';
import { 
  NavigationTab, 
  TenantProfile, 
  EnterpriseKnowledgeGraph, 
  SupportedLanguage, 
  SupportedCurrency, 
  FiscalJurisdiction,
  IndustrySector,
  ServiceWorkMode
} from '../types/aos';
import { TRANSLATIONS, getComplianceBadgeText } from '../utils/i18n';
import { VelatrixLogo } from './VelatrixLogo';
import { useAuth } from '../context/AuthContext';
import { RBAC_ROLE_DEFINITIONS } from '../types/rbac';

interface AosSidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  tenantProfile: TenantProfile;
  graph: EnterpriseKnowledgeGraph;
  activeEngine: 'gemini-3.8-flash' | 'gemini-3.7-flash' | 'local_neural_engine';
  isProcessing: boolean;
  onOpenAstViewer: () => void;
  auditCount: number;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currency: SupportedCurrency;
  setCurrency: (curr: SupportedCurrency) => void;
  fiscalJurisdiction: FiscalJurisdiction;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentSector: IndustrySector;
  onSelectSector?: (sector: IndustrySector) => void;
}

export const AosSidebar: React.FC<AosSidebarProps> = ({
  currentTab,
  onSelectTab,
  tenantProfile,
  graph,
  activeEngine,
  isProcessing,
  onOpenAstViewer,
  auditCount,
  language,
  setLanguage,
  currency,
  setCurrency,
  fiscalJurisdiction,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  currentSector,
  onSelectSector
}) => {
  const { 
    currentUserRole, 
    currentUser, 
    isSuperAdmin, 
    isPartner, 
    isTabAllowed, 
    logout, 
    activeWorkMode, 
    setActiveWorkMode, 
    activeTenant 
  } = useAuth();
  const roleDef = RBAC_ROLE_DEFINITIONS[currentUserRole];
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  // Enabled services for current tenant
  const enabledServices = activeTenant?.enabledServices || ['operational', 'tax_recovery'];
  const hasOperationalService = enabledServices.includes('operational');
  const hasTaxRecoveryService = enabledServices.includes('tax_recovery');
  const hasBothServices = hasOperationalService && hasTaxRecoveryService;

  // Work Mode Categorization & Tab Filtering
  const isOperationalTab = (tabId: NavigationTab) => [
    'operational_dashboard',
    'dre_waterfall',
    'autonomous_swarm_brain',
    'gps_telemetry',
    'graph_health_workspace',
    'audit_ledger_view',
    'roadmap_rollout_hub',
    'counterfactual_oracle',
    'construct_lab',
    'deja_vu_detection',
    'erp_connector_config',
    'vector_knowledge_store',
    'risk_engine_diagnosis'
  ].includes(tabId);

  const isTaxRecoveryTab = (tabId: NavigationTab) => [
    'legal_tax_recovery',
    'inss_obras',
    'partner_portal',
    'express_diagnosis'
  ].includes(tabId);

  const isUniversalTab = (tabId: NavigationTab) => [
    'governance_settings',
    'api_keys_config',
    'super_admin',
    'velatrix_office',
    'central_laudos',
    'esteiras_laudos_hub'
  ].includes(tabId);

  const isTabInMode = (tabId: NavigationTab) => {
    if (isUniversalTab(tabId)) return true;
    if (activeWorkMode === 'both') {
      if (isOperationalTab(tabId) && !hasOperationalService) return false;
      if (isTaxRecoveryTab(tabId) && !hasTaxRecoveryService) return false;
      return true;
    }
    if (activeWorkMode === 'operational') return isOperationalTab(tabId) && hasOperationalService;
    if (activeWorkMode === 'tax_recovery') return isTaxRecoveryTab(tabId) && hasTaxRecoveryService;
    return true;
  };

  // 1. PRIMARY OPERATOR & TAX RECOVERY ITEMS
  const rawPrimaryNavItems: { id: NavigationTab; label: string; icon: React.ComponentType<any>; badge?: string | number; color: string }[] = [
    {
      id: 'operational_dashboard',
      label: 'Dashboard Operacional',
      icon: Zap,
      color: 'text-[var(--vx-neon)]'
    },
    {
      id: 'dre_waterfall',
      label: 'Cascata DRE Completa',
      icon: Calculator,
      badge: 'CPC 26',
      color: 'text-[var(--vx-neon)]'
    },
    {
      id: 'autonomous_swarm_brain',
      label: 'Cérebro Enxame AOS',
      icon: Bot,
      badge: '6 Agentes',
      color: 'text-cyan-400'
    },
    {
      id: 'legal_tax_recovery',
      label: 'Defesa & Recuperação Fiscal',
      icon: Scale,
      badge: '5 Anos / PGFN',
      color: 'text-emerald-400'
    },
    {
      id: 'central_laudos',
      label: 'Central de Laudos',
      icon: FileCheck,
      badge: 'Auditoria',
      color: 'text-cyan-300'
    },
    {
      id: 'esteiras_laudos_hub',
      label: 'Esteiras & Laudos Oficiais',
      icon: Layers,
      badge: '8 Serviços',
      color: 'text-indigo-400'
    },
    {
      id: 'inss_obras',
      label: 'INSS-Obras (Construção)',
      icon: HardHat,
      badge: 'CNO / SERO',
      color: 'text-amber-400'
    },
    {
      id: 'partner_portal',
      label: 'Portal de Parceiros & Split',
      icon: Briefcase,
      badge: 'Split PIX',
      color: 'text-amber-400'
    },
    {
      id: 'governance_settings',
      label: 'Gestão de Usuários & IAM',
      icon: Users,
      badge: 'RBAC',
      color: 'text-blue-400'
    },
    {
      id: 'api_keys_config',
      label: 'Configurações de APIs',
      icon: KeyRound,
      badge: 'Cofre',
      color: 'text-cyan-400'
    },
    {
      id: 'roadmap_rollout_hub',
      label: 'Roadmap & Rollout (Fase 1 ➔ 2)',
      icon: Layers,
      badge: 'PROD',
      color: 'text-amber-400'
    },
    {
      id: 'gps_telemetry',
      label: 'GPS & Telemetria Logística',
      icon: Navigation,
      badge: '5G IoT',
      color: 'text-cyan-400'
    },
    {
      id: 'graph_health_workspace',
      label: 'Saúde do Grafo AOS',
      icon: Activity,
      badge: 'Ao Vivo',
      color: 'text-emerald-400'
    },
    {
      id: 'audit_ledger_view',
      label: 'Trilha de Auditoria / Ledger',
      icon: History,
      badge: auditCount,
      color: 'text-sky-400'
    }
  ];

  // 1.5. FERRAMENTAS AUTÔNOMAS AVANÇADAS (Oráculo Contrafactual, Construct Lab, Modo Déjà Vu)
  const rawAutonomousToolItems: { id: NavigationTab; label: string; icon: React.ComponentType<any>; badge?: string | number; color: string }[] = [
    {
      id: 'counterfactual_oracle',
      label: 'Oráculo Contrafactual',
      icon: Sparkles,
      badge: 'Monte Carlo',
      color: 'text-purple-400'
    },
    {
      id: 'construct_lab',
      label: 'Construct Lab (No-Code)',
      icon: Cpu,
      badge: 'Treinador',
      color: 'text-indigo-400'
    },
    {
      id: 'deja_vu_detection',
      label: 'AOS CyberSpy & Déjà Vu',
      icon: ShieldAlert,
      badge: 'ZeroVision',
      color: 'text-rose-400'
    }
  ];

  // 2. ADVANCED / INTEGRATION ITEMS (Visible only in Developer / Super-Admin Mode)
  const rawAdvancedNavItems: { id: NavigationTab; label: string; icon: React.ComponentType<any>; badge?: string; color: string }[] = [
    {
      id: 'erp_connector_config',
      label: 'Conector ERP & Webhook',
      icon: Network,
      badge: 'Middleware',
      color: 'text-cyan-400'
    },
    {
      id: 'vector_knowledge_store',
      label: 'Barramento Vetorial RAG',
      icon: Database,
      badge: 'Contexto',
      color: 'text-amber-400'
    }
  ];

  // Filter items strictly by RBAC permissions for the active role AND current work mode
  const primaryNavItems = rawPrimaryNavItems.filter(item => isTabAllowed(item.id) && isTabInMode(item.id));
  const autonomousToolItems = rawAutonomousToolItems.filter(item => isTabAllowed(item.id) && isTabInMode(item.id));
  const advancedNavItems = rawAdvancedNavItems.filter(item => isTabAllowed(item.id) && isTabInMode(item.id));

  const handleNavClick = (tabId: NavigationTab) => {
    onSelectTab(tabId);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleWorkModeChange = (mode: ServiceWorkMode) => {
    setActiveWorkMode(mode);
    if (mode === 'tax_recovery' && (currentTab === 'operational_dashboard' || isOperationalTab(currentTab))) {
      onSelectTab('legal_tax_recovery');
    } else if (mode === 'operational' && (currentTab === 'legal_tax_recovery' || currentTab === 'inss_obras' || currentTab === 'partner_portal')) {
      onSelectTab('operational_dashboard');
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="aos-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen bg-[var(--vx-deep)] border-r border-slate-800/80 z-50 flex flex-col justify-between transition-all duration-300 shadow-2xl ${
          isMobileOpen 
            ? 'translate-x-0 w-72' 
            : '-translate-x-full md:translate-x-0 ' + (isCollapsed ? 'md:w-20' : 'md:w-68 lg:w-72')
        }`}
      >
        {/* Top Header / Branding */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-2">
          
          <div 
            onClick={() => handleNavClick('operational_dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            {isCollapsed && !isMobileOpen ? (
              <VelatrixLogo size="sm" variant="icon-only" />
            ) : (
              <VelatrixLogo size="sm" variant="full" versionText="AOS v4.8" />
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* Tenant Profile Banner & Service Mode Switcher */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="px-3 py-2.5 bg-slate-950/70 border-b border-slate-800/60 mx-3 my-2 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                Tenant Ativo
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div>
              <strong className="text-xs font-bold text-slate-200 block truncate">
                {tenantProfile.name}
              </strong>
              <span className="text-[10px] font-mono text-slate-400 block truncate">
                ERP: {tenantProfile.connectedErp.split(' ')[0]} • {tenantProfile.sectorLabel}
              </span>
            </div>

            {/* Work Mode Switcher / Indicator */}
            <div className="pt-1.5 border-t border-slate-800/60">
              <div className="text-[9px] uppercase font-mono font-bold text-slate-400 mb-1 flex items-center justify-between">
                <span>Modo de Trabalho</span>
                {hasBothServices ? (
                  <span className="text-[8px] text-emerald-400 font-mono">2 Serviços Ativos</span>
                ) : (
                  <span className="text-[8px] text-slate-400 font-mono">1 Serviço Ativo</span>
                )}
              </div>

              {hasBothServices ? (
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('operational')}
                    className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeWorkMode === 'operational'
                        ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] font-bold border border-[var(--vx-neon)]/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Modo Operacional AOS (Gestão Industrial, OEE, Manutenção, IoT)"
                  >
                    <Zap className="w-3 h-3" />
                    <span className="text-[9px] leading-tight">Operacional</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('tax_recovery')}
                    className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeWorkMode === 'tax_recovery'
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Modo Recuperação Tributária (Créditos, PGFN, Dossiê Pericial, Pareceres)"
                  >
                    <Scale className="w-3 h-3" />
                    <span className="text-[9px] leading-tight">Tributário</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('both')}
                    className={`py-1 px-1 rounded flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      activeWorkMode === 'both'
                        ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Visão Integrada (Operacional + Recuperação Tributária)"
                  >
                    <Layers className="w-3 h-3" />
                    <span className="text-[9px] leading-tight">Ambos</span>
                  </button>
                </div>
              ) : hasOperationalService ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-[10px] text-cyan-300">
                  <Zap className="w-3 h-3 text-[var(--vx-neon)] shrink-0" />
                  <span className="truncate">Modo Gestão Operacional AOS</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-[10px] text-emerald-300">
                  <Scale className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate">Modo Recuperação Tributária</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed Mode Indicator */}
        {isCollapsed && !isMobileOpen && (
          <div className="py-2 border-b border-slate-800/60 flex justify-center">
            <div 
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                activeWorkMode === 'tax_recovery'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                  : activeWorkMode === 'both'
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-400'
                  : 'bg-cyan-950/60 border-[var(--vx-neon)]/50 text-[var(--vx-neon)]'
              }`}
              title={`Modo Ativo: ${activeWorkMode === 'tax_recovery' ? 'Recuperação Tributária' : activeWorkMode === 'both' ? 'Integrado (Ambos)' : 'Operacional AOS'}`}
            >
              {activeWorkMode === 'tax_recovery' ? (
                <Scale className="w-4 h-4" />
              ) : activeWorkMode === 'both' ? (
                <Layers className="w-4 h-4" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
            </div>
          </div>
        )}

        {/* Navigation Items Area */}
        <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto scrollbar-none">
          
          {/* SECTION 1: MENU PRINCIPAL DO OPERADOR / RECUPERAÇÃO TRIBUTÁRIA */}
          <div className="space-y-1">
            <span className={`text-[9px] uppercase font-mono font-bold text-slate-500 tracking-wider block px-3 mb-1.5 ${
              isCollapsed && !isMobileOpen ? 'text-center' : ''
            }`}>
              {isCollapsed && !isMobileOpen ? '•' : activeWorkMode === 'tax_recovery' ? 'Módulos Tributários' : 'Operação Diária'}
            </span>

            {primaryNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-slate-900 to-slate-900/90 text-slate-100 border border-[var(--vx-neon)]/60 shadow-lg shadow-[var(--vx-neon)]/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                  title={item.label}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[var(--vx-neon)] shadow-sm shadow-[var(--vx-neon)]" />
                  )}

                  <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-[var(--vx-neon)]/15' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--vx-neon)]' : item.color}`} />
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                          isActive 
                            ? 'bg-[var(--vx-neon)] text-slate-950' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* SECTION 1.5: INTELIGÊNCIA AUTÔNOMA & FERRAMENTAS (ORÁCULO, CONSTRUCT LAB, DÉJÀ VU) */}
          {autonomousToolItems.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              <span className={`text-[9px] uppercase font-mono font-bold text-purple-400 tracking-wider block px-3 mb-1.5 ${
                isCollapsed && !isMobileOpen ? 'text-center' : ''
              }`}>
                {isCollapsed && !isMobileOpen ? '•' : 'Inteligência & Previsão'}
              </span>

              {autonomousToolItems.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                      isActive 
                        ? 'bg-gradient-to-r from-purple-950/90 to-slate-900 text-purple-100 border border-purple-500/80 shadow-lg shadow-purple-950/40' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    {/* Active Indicator Bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-purple-400 shadow-sm shadow-purple-400" />
                    )}

                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-purple-500/20' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : item.color}`} />
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                        <span className="truncate">{item.label}</span>
                        {item.badge !== undefined && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 ${
                            isActive 
                              ? 'bg-purple-400 text-slate-950' 
                              : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* SECTION 2: DIAGNÓSTICO UNIFICADO & PROPOSTA AOS (FERRAMENTA DEDICADA D+0) */}
          {isTabAllowed('risk_engine_diagnosis') && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1">
              <span className={`text-[9px] uppercase font-mono font-bold text-slate-500 tracking-wider block px-3 mb-1.5 ${
                isCollapsed && !isMobileOpen ? 'text-center' : ''
              }`}>
                {isCollapsed && !isMobileOpen ? '•' : 'Diagnóstico & Proposta'}
              </span>

              {/* Diagnóstico Integral & Proposta AOS (Unificado) */}
              <button
                id="btn-nav-diagnostico-unificado"
                onClick={() => handleNavClick('risk_engine_diagnosis')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                  currentTab === 'risk_engine_diagnosis' || currentTab === 'express_diagnosis'
                    ? 'bg-gradient-to-r from-cyan-950/90 via-slate-900 to-emerald-950/60 text-cyan-200 border border-[var(--vx-neon)] shadow-lg shadow-cyan-950/40'
                    : 'bg-cyan-950/20 text-cyan-300 hover:bg-cyan-950/40 hover:text-cyan-200 border border-cyan-900/40'
                }`}
                title="Diagnóstico Integral, Raio-X da Dor & Proposta de Solução AOS"
              >
                {(currentTab === 'risk_engine_diagnosis' || currentTab === 'express_diagnosis') && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-[var(--vx-neon)] shadow-sm shadow-[var(--vx-neon)]" />
                )}

                <div className={`p-1.5 rounded-lg shrink-0 ${
                  currentTab === 'risk_engine_diagnosis' || currentTab === 'express_diagnosis' 
                    ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)]' 
                    : 'bg-cyan-950/80 text-cyan-400'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>

                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                    <span className="truncate font-bold">Diagnóstico &amp; Proposta</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40">
                      Raio-X D+0
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* SECTION 3: CONFIGURAÇÕES AVANÇADAS / INTEGRAÇÃO (VISÍVEL APENAS COM MODO DESENVOLVEDOR ATIVO) */}
          {isSuperAdmin && advancedNavItems.length > 0 && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1.5 animate-in fade-in duration-200">
              {(!isCollapsed || isMobileOpen) ? (
                <button
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[9px] uppercase font-mono font-bold text-violet-400 hover:text-violet-300 tracking-wider cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3 h-3 text-violet-400" />
                    <span>Configurações Avançadas</span>
                  </span>
                  {isAdvancedOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              ) : (
                <span className="text-[9px] uppercase font-mono font-bold text-violet-400 tracking-wider block text-center">
                  •
                </span>
              )}

              {(isAdvancedOpen || isCollapsed) && (
                <div className="space-y-1 pl-0.5">
                  {advancedNavItems.map((item) => {
                    const isActive = currentTab === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        id={`nav-item-${item.id}`}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                          isActive 
                            ? 'bg-slate-900 text-slate-100 border border-violet-500/60 shadow-md shadow-violet-950/20' 
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                        }`}
                        title={item.label}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r bg-violet-400 shadow-sm shadow-violet-400" />
                        )}

                        <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? 'bg-violet-950/60' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-300' : item.color}`} />
                        </div>

                        {(!isCollapsed || isMobileOpen) && (
                          <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                            <span className="truncate text-[11px]">{item.label}</span>
                            {item.badge && (
                              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-violet-950/80 text-violet-300 border border-violet-800/60">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION 4: SUPER-ADMIN & ESCRITÓRIO VELATRIX (CONDICIONADO AO ROLE SUPER_ADMIN / DEVELOPER MODE) */}
          {isSuperAdmin && (
            <div className="pt-2 border-t border-slate-800/60 space-y-1 animate-in fade-in duration-200">
              <span className={`text-[9px] uppercase font-mono font-bold text-violet-400 tracking-wider block px-3 mb-1 ${
                isCollapsed && !isMobileOpen ? 'text-center' : ''
              }`}>
                {isCollapsed && !isMobileOpen ? '•' : 'Governança & Escritório'}
              </span>

              {/* Escritório Velatrix Tab Button */}
              {isTabAllowed('velatrix_office') && (
                <button
                  id="nav-item-velatrix_office"
                  onClick={() => handleNavClick('velatrix_office')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                    currentTab === 'velatrix_office'
                      ? 'bg-purple-950/80 text-purple-200 border border-purple-600 shadow-lg shadow-purple-950/30' 
                      : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40 border border-purple-900/30'
                  }`}
                  title="Escritório Velatrix (Gestão Interna)"
                >
                  {currentTab === 'velatrix_office' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-purple-400 shadow-sm shadow-purple-400" />
                  )}

                  <div className={`p-1.5 rounded-lg shrink-0 ${currentTab === 'velatrix_office' ? 'bg-purple-900/80' : 'bg-purple-950/60'}`}>
                    <Building2 className="w-4 h-4 text-purple-400" />
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="truncate">Escritório Velatrix</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 bg-purple-900 text-purple-200 border border-purple-700/60">
                        INTERNO
                      </span>
                    </div>
                  )}
                </button>
              )}

              {/* Super-Admin Velatrix */}
              {isTabAllowed('super_admin') && (
                <button
                  id="nav-item-super_admin"
                  onClick={() => handleNavClick('super_admin')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative group ${
                    currentTab === 'super_admin'
                      ? 'bg-violet-950/80 text-violet-200 border border-violet-600 shadow-lg shadow-violet-950/30' 
                      : 'text-violet-300/80 hover:text-violet-200 hover:bg-violet-950/40 border border-violet-900/30'
                  }`}
                  title="Super-Admin Velatrix"
                >
                  {currentTab === 'super_admin' && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-violet-400 shadow-sm shadow-violet-400" />
                  )}

                  <div className={`p-1.5 rounded-lg shrink-0 ${currentTab === 'super_admin' ? 'bg-violet-900/80' : 'bg-violet-950/60'}`}>
                    <ShieldAlert className="w-4 h-4 text-violet-400" />
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 flex items-center justify-between min-w-0 text-left">
                      <span className="truncate">Super-Admin Velatrix</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ml-1.5 shrink-0 bg-violet-900 text-violet-200 border border-violet-700/60">
                        PROTÓTIPO
                      </span>
                    </div>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Quick AST Inspector & Architecture in Sidebar */}
          {(!isCollapsed || isMobileOpen) && (isTabAllowed('architecture_engineering') || isSuperAdmin) && (
            <div className="pt-3 mt-2 border-t border-slate-800/60 space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-500 tracking-wider block px-3">
                Ferramentas de Engenharia
              </span>

              {isTabAllowed('architecture_engineering') && (
                <button
                  id="nav-item-architecture_engineering"
                  onClick={() => handleNavClick('architecture_engineering')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
                    currentTab === 'architecture_engineering'
                      ? 'bg-slate-900 text-[var(--vx-neon)] border-[var(--vx-neon)]/60 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-slate-800/60'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                  <span>Arquitetura & Engenharia</span>
                </button>
              )}

              <button
                onClick={onOpenAstViewer}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition-colors border border-slate-800/60 cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                <span>{t.astInspect} (Zero-GUI AST)</span>
              </button>
            </div>
          )}

        </div>

        {/* Bottom Telemetry & Preferences */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/90 space-y-2">
          
          {/* Health Index */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${graph.healthIndex > 80 ? 'text-[var(--vx-neon)]' : 'text-amber-400'}`} />
              {(!isCollapsed || isMobileOpen) && (
                <span className="text-[10px] text-slate-400 font-medium">{t.healthGraph}:</span>
              )}
            </div>
            <span className={`text-[11px] font-bold font-mono ${graph.healthIndex > 80 ? 'text-[var(--vx-neon)]' : 'text-amber-400'}`}>
              {graph.healthIndex}%
            </span>
          </div>

          {/* Engine Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
              {(!isCollapsed || isMobileOpen) && (
                 <span className="text-[10px] text-slate-400 font-medium">LLM Engine:</span>
              )}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              Gemini 3.7 Flash
            </span>
          </div>

          {/* User Account & Logout in Sidebar */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {currentUser?.name || 'Executivo'}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono leading-tight truncate">
                      {currentUser?.department || 'Diretoria'}
                    </span>
                  </div>
                )}
              </div>

              <button
                id="btn-sidebar-logout"
                onClick={logout}
                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 transition-colors cursor-pointer shrink-0"
                title="Desconectar do Terminal"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          </div>

        </div>

      </aside>
    </>
  );
};
