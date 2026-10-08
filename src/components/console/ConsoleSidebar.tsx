import React from 'react';
import {
  Zap,
  Target,
  Scale,
  History,
  Activity,
  Sparkles,
  Cpu,
  Layers,
  Users,
  Briefcase,
  Bot,
  Calculator,
  HardHat,
  FileCheck,
  FilePlus,
  FileCode2,
  ShieldCheck,
  ShieldAlert,
  Network,
  Database,
  Navigation,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import {
  NavigationTab,
  TenantProfile,
  ServiceWorkMode
} from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { VelatrixLogo } from '../VelatrixLogo';

export interface ConsoleSidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  tenantProfile: TenantProfile;
  auditCount: number;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItemDef {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeStyle?: 'default' | 'accent' | 'crit';
  dotLive?: boolean;
}

interface NavGroupDef {
  title: string;
  items: NavItemDef[];
}

/**
 * Seções do menu enxuto (etapa 1). Um item do menu abre uma seção com sub-abas
 * (renderizadas no ConsoleShell). Nada foi removido: as telas continuam as mesmas.
 */
export const NAV_SECTIONS: Partial<Record<NavigationTab, { label: string; tabs: { id: NavigationTab; label: string }[] }>> = {
  governance_settings: {
    label: 'Configurações',
    tabs: [
      { id: 'governance_settings', label: 'Usuários' },
      { id: 'erp_connector_config', label: 'Integrações' },
      { id: 'webhooks', label: 'Webhooks' },
      { id: 'split_api', label: 'Pagamentos & Gov' },
      { id: 'onboarding_wizard', label: 'Primeiros passos' },
    ],
  },
  // P23: Super Admin (só Velatrix) — essenciais primeiro; o resto agrupado como "Lab ·".
  super_admin: {
    label: 'Super Admin',
    tabs: [
      { id: 'super_admin', label: 'Tenants' },
      { id: 'admin_analytics', label: 'Analytics ao vivo' },
      { id: 'llm_engine', label: 'IA · LLM' },
      { id: 'observability', label: 'Observability' },
      { id: 'roadmap_rollout_hub', label: 'Roadmap' },
      { id: 'architecture_engineering', label: 'Lab · Arquitetura' },
      { id: 'vector_knowledge_store', label: 'Lab · Base RAG' },
      { id: 'autonomous_swarm_brain', label: 'Lab · Enxame' },
      { id: 'graph_health_workspace', label: 'Lab · Saúde do Grafo' },
      { id: 'neural_core', label: 'Lab · Neural Core' },
      { id: 'deja_vu_detection', label: 'Lab · Threat Ingestion' },
      { id: 'ast_json', label: 'Lab · AST JSON' },
      { id: 'construct_lab', label: 'Lab · Construct Lab' },
      { id: 'velatrix_office', label: 'Lab · Escritório Velatrix' },
      { id: 'legacy_dashboard', label: 'Lab · Painel técnico' },
    ],
  },
};

/** Telas que abrem a partir de um item do menu (para destacar o item certo). */
const NAV_PARENT: Partial<Record<NavigationTab, NavigationTab>> = {
  legal_tax_recovery: 'esteiras_laudos_hub',
  pericia: 'esteiras_laudos_hub',
  inss: 'esteiras_laudos_hub',
  inss_obras: 'esteiras_laudos_hub',
  precatoria: 'esteiras_laudos_hub',
  express_diagnosis: 'esteiras_laudos_hub',
  risk_engine_diagnosis: 'esteiras_laudos_hub',
  dre_waterfall: 'esteiras_laudos_hub',
  oraculo_liquidez: 'esteiras_laudos_hub',
  motor_pericial: 'esteiras_laudos_hub',
  escudo_edge: 'esteiras_laudos_hub',
  contract_lab: 'esteiras_laudos_hub',
  leitura_autos: 'esteiras_laudos_hub',
  ent_hitl: 'ent_hub',
  ent_risk_shield: 'ent_hub',
  ent_guardrail: 'ent_hub',
  ent_jurimetria: 'ent_hub',
  ent_connect: 'ent_hub',
  ent_zdr: 'ent_hub',
  ent_verify_seal: 'ent_hub',
  ent_conflict: 'ent_hub',
  ent_packages: 'ent_hub',
};

export const navSectionOf = (tab: NavigationTab): NavigationTab | undefined => {
  for (const [key, section] of Object.entries(NAV_SECTIONS)) {
    if (section && section.tabs.some((t) => t.id === tab)) return key as NavigationTab;
  }
  return NAV_PARENT[tab];
};

export const ConsoleSidebar: React.FC<ConsoleSidebarProps> = ({
  currentTab,
  onSelectTab,
  tenantProfile,
  auditCount,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const {
    isTabAllowed,
    activeWorkMode,
    setActiveWorkMode,
    activeTenant
  } = useAuth();

  // Enabled services for active tenant
  const enabledServices = activeTenant?.enabledServices || ['operational', 'tax_recovery'];
  const hasOperationalService = enabledServices.includes('operational');
  const hasTaxRecoveryService = enabledServices.includes('tax_recovery');
  const hasBothServices = hasOperationalService && hasTaxRecoveryService;

  // Work Mode categorization (identical to AosSidebar)
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
    'risk_engine_diagnosis',
    'oraculo_liquidez',
    'contract_lab',
    'escudo_edge',
    'webhooks',
    'ast_json',
    'llm_engine',
    'observability',
    'neural_core'
  ].includes(tabId);

  const isTaxRecoveryTab = (tabId: NavigationTab) => [
    'legal_tax_recovery',
    'inss_obras',
    'partner_portal',
    'express_diagnosis',
    'novo_laudo',
    'motor_pericial',
    'pericia',
    'inss',
    'precatoria',
    'split_api'
  ].includes(tabId);

  const isUniversalTab = (tabId: NavigationTab) => [
    'governance_settings',
    // Menu enxuto (etapa 1): visíveis em qualquer modo de trabalho
    'operational_dashboard', 'novo_laudo', 'audit_ledger_view', 'erp_connector_config', 'llm_engine', 'webhooks', 'split_api', 'partner_portal',
    'ent_hub', 'ent_connect', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_zdr', 'ent_hitl', 'ent_verify_seal', 'ent_conflict', 'ent_packages', 'leitura_autos',
    'super_admin',
  'admin_analytics',
    'velatrix_office',
    'central_laudos',
    'esteiras_laudos_hub',
    'architecture_engineering',
    'onboarding_wizard'
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

  const isItemVisible = (id: NavigationTab) => {
    const section = NAV_SECTIONS[id];
    // P24: a seção Super Admin só aparece para quem tem a aba 'super_admin' (não basta ter uma sub-aba técnica).
    if (section) return id === 'super_admin' ? isTabAllowed('super_admin') : section.tabs.some((t) => isTabAllowed(t.id));
    return isTabAllowed(id) && isTabInMode(id);
  };

  const handleNavClick = (tabId: NavigationTab) => {
    const section = NAV_SECTIONS[tabId];
    const target = section ? (section.tabs.find((t) => isTabAllowed(t.id))?.id ?? tabId) : tabId;
    onSelectTab(target);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const handleWorkModeChange = (mode: ServiceWorkMode) => {
    setActiveWorkMode(mode);
    if (mode === 'tax_recovery' && isOperationalTab(currentTab) && !isUniversalTab(currentTab)) {
      onSelectTab('esteiras_laudos_hub');
    } else if (mode === 'operational' && (currentTab === 'legal_tax_recovery' || currentTab === 'inss_obras' || currentTab === 'partner_portal')) {
      onSelectTab('operational_dashboard');
    }
  };

  // 8 Canonical Groups corresponding to Mock Navigation and all NavigationTabs
  const groups: NavGroupDef[] = [
    {
      title: 'Trabalho',
      items: [
        { id: 'operational_dashboard', label: 'Início', icon: Zap },
        { id: 'novo_laudo', label: 'Novo Laudo', icon: FilePlus },
        { id: 'esteiras_laudos_hub', label: 'Central de Esteiras', icon: Layers },
        { id: 'central_laudos', label: 'Central de Laudos', icon: FileCheck },
        { id: 'ent_hub', label: 'Central Enterprise', icon: ShieldCheck }
      ]
    },
    {
      title: 'Escritório',
      items: [
        { id: 'partner_portal', label: 'Correspondentes & Parcerias', icon: Briefcase },
        { id: 'audit_ledger_view', label: 'Auditoria', icon: History }
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'governance_settings', label: 'Configurações', icon: Users },
        { id: 'super_admin', label: 'Super Admin', icon: ShieldAlert }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Sidebar Element */}
      <aside
        id="console-sidebar"
        className={`fixed md:sticky top-0 left-0 h-screen md:h-full bg-canvas border-r border-hairline z-40 flex flex-col justify-between transition-all duration-200 select-none ${
          isMobileOpen
            ? 'translate-x-0 w-[264px] shadow-2xl'
            : '-translate-x-full md:translate-x-0 ' + (isCollapsed ? 'md:w-[72px]' : 'md:w-[264px]')
        }`}
      >
        {/* Header / Brand in Sidebar (Mobile Only or Collapsed View) */}
        <div className="p-3 border-b border-hairline flex items-center justify-between md:hidden">
          <VelatrixLogo size="sm" variant="horizontal" theme="light" />
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-md text-ink-mute hover:text-ink hover:bg-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Profile Card & Work Mode Switcher */}
        {(!isCollapsed || isMobileOpen) ? (
          <div className="mx-3 mt-3 mb-2 p-3 bg-surface border border-hairline rounded-lg">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1">
              Tenant ativo
            </div>
            <div className="font-semibold text-[13px] text-ink truncate leading-snug">
              {tenantProfile.name}
            </div>
            <div className="text-[11px] text-ink-mute truncate mt-0.5">
              ERP: {tenantProfile.connectedErp.split(' ')[0]} · {tenantProfile.sectorLabel}
            </div>

            {/* Segmented Mode Switcher */}
            <div className="mt-2.5 pt-2 border-t border-hairline">
              {hasBothServices ? (
                <div className="flex bg-canvas border border-hairline p-0.5 rounded-md gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('operational')}
                    className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded transition-colors cursor-pointer text-center ${
                      activeWorkMode === 'operational'
                        ? 'bg-ink text-[#FFFFFF] font-semibold shadow-xs'
                        : 'text-ink-mute hover:text-ink'
                    }`}
                  >
                    Operacional
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('tax_recovery')}
                    className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded transition-colors cursor-pointer text-center ${
                      activeWorkMode === 'tax_recovery'
                        ? 'bg-ink text-[#FFFFFF] font-semibold shadow-xs'
                        : 'text-ink-mute hover:text-ink'
                    }`}
                  >
                    Tributário
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWorkModeChange('both')}
                    className={`flex-1 py-1 px-1.5 text-[11px] font-medium rounded transition-colors cursor-pointer text-center ${
                      activeWorkMode === 'both'
                        ? 'bg-ink text-[#FFFFFF] font-semibold shadow-xs'
                        : 'text-ink-mute hover:text-ink'
                    }`}
                  >
                    Ambos
                  </button>
                </div>
              ) : (
                <div className="text-[11px] font-mono font-medium text-accent bg-accent-soft px-2 py-1 rounded border border-hairline flex items-center justify-between">
                  <span className="truncate">
                    {hasOperationalService ? 'Modo Operacional' : 'Modo Tributário'}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed Mini Indicator */
          <div className="py-3 px-2 border-b border-hairline flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-1.5 rounded-md bg-surface hover:bg-surface-hover border border-hairline text-ink-mute hover:text-ink cursor-pointer"
              title="Expandir menu lateral"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Group Items Area */}
        <div className="flex-1 py-1 overflow-y-auto scrollbar-none space-y-3">
          {groups.map((group) => {
            const visibleItems = group.items.filter(item => isItemVisible(item.id));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-0.5">
                {(!isCollapsed || isMobileOpen) ? (
                  <div className="px-4 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
                    {group.title}
                  </div>
                ) : (
                  <div className="h-px bg-hairline my-2 mx-3" />
                )}

                {visibleItems.map((item) => {
                  const isActive = currentTab === item.id || navSectionOf(currentTab) === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`console-nav-${item.id}`}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-1.5 text-[13px] font-medium transition-colors border-l-2 cursor-pointer text-left ${
                        isActive
                          ? 'text-accent bg-accent-tint border-l-accent-bright font-semibold'
                          : 'border-l-transparent text-ink-mute hover:text-ink hover:bg-surface'
                      } ${isCollapsed && !isMobileOpen ? 'justify-center px-0' : ''}`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-ink-mute'}`} />
                        {(!isCollapsed || isMobileOpen) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {(!isCollapsed || isMobileOpen) && (
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.dotLive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0 animate-pulse" />
                          )}
                          {item.badge !== undefined && (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-medium ${
                                item.badgeStyle === 'crit'
                                  ? 'bg-crit-soft text-crit font-semibold'
                                  : isActive
                                  ? 'bg-accent-soft text-accent font-semibold'
                                  : 'bg-surface text-ink-soft border border-hairline'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer with Live Dot and Version */}
        <div className="mt-auto px-4 py-3 border-t border-hairline text-[11px] text-ink-soft flex items-center justify-between bg-canvas">
          {(!isCollapsed || isMobileOpen) ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-good shrink-0" />
                <span className="font-medium text-ink-mute">Neural Core</span>
              </div>
              <span className="font-mono text-ink-soft">AOS v4.8</span>
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="hidden md:inline-flex p-1 rounded hover:bg-surface text-ink-soft hover:text-ink cursor-pointer"
                title="Recolher menu"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center py-0.5">
              <span className="w-2 h-2 rounded-full bg-good" title="Neural Core · AOS v4.8" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
