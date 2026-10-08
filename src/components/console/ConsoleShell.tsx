import React, { useState, useEffect, useRef } from 'react';
import { IS_DEMO_MODE, DEMO_LABEL, DEMO_NOTICE } from '../../lib/demoMode';
import { ServicoIndisponivelBanner } from './ServicoIndisponivelBanner';
import {
  Search,
  FileCode2,
  AlertTriangle,
  LogOut,
  Menu,
  ChevronRight
} from 'lucide-react';
import { NavigationTab, TenantProfile } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { RBAC_ROLE_DEFINITIONS } from '../../types/rbac';
import { VelatrixLogo } from '../VelatrixLogo';
import { ConsoleSidebar, NAV_SECTIONS, navSectionOf } from './ConsoleSidebar';
import { SubTabBar } from './SubTabBar';
import { ViewAsSelector, ViewAsBanner } from './ViewAsControls';

export interface ConsoleShellProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  tenantProfile: TenantProfile;
  auditCount: number;
  onOpenAstViewer: () => void;
  onOpenAskAos: () => void;
  onOpenRiskSimulator?: () => void;
  children: React.ReactNode;
}

const TAB_BREADCRUMBS: Record<NavigationTab, { group: string; label: string }> = {
  operational_dashboard: { group: 'Trabalho', label: 'Início' },
  legacy_dashboard: { group: 'Super Admin', label: 'Painel técnico' },
  novo_laudo: { group: 'Trabalho', label: 'Novo Laudo' },
  central_laudos: { group: 'Trabalho', label: 'Central de Laudos' },
  esteiras_laudos_hub: { group: 'Trabalho', label: 'Central de Esteiras' },
  dre_waterfall: { group: 'Central de Esteiras', label: 'Cascata DRE + Vertical' },
  autonomous_swarm_brain: { group: 'Super Admin', label: 'Enxame' },
  risk_engine_diagnosis: { group: 'Comando', label: 'Diagnóstico & Proposta' },
  express_diagnosis: { group: 'Central de Esteiras', label: 'Diagnóstico' },
  legal_tax_recovery: { group: 'Central de Esteiras', label: 'Recuperação Tributária' },
  pericia: { group: 'Central de Esteiras', label: 'Perícia Judicial' },
  inss: { group: 'Central de Esteiras', label: 'Especialista INSS' },
  inss_obras: { group: 'Central de Esteiras', label: 'INSS-Obras' },
  precatoria: { group: 'Central de Esteiras', label: 'Precatória' },
  partner_portal: { group: 'Escritório', label: 'Correspondentes & Parcerias' },
  motor_pericial: { group: 'Central de Esteiras', label: 'Motor Pericial 60m' },
  oraculo_liquidez: { group: 'Central de Esteiras', label: 'Oráculo de Liquidez' },
  counterfactual_oracle: { group: 'Motores Cognitivos', label: 'Oráculo Contrafactual' },
  contract_lab: { group: 'Central de Esteiras', label: 'Contract Lab' },
  leitura_autos: { group: 'Central de Esteiras', label: 'Leitura de Autos' },
  vector_knowledge_store: { group: 'Super Admin', label: 'Base RAG' },
  escudo_edge: { group: 'Central de Esteiras', label: 'Leitura de documentos' },
  deja_vu_detection: { group: 'Super Admin', label: 'Threat Ingestion' },
  split_api: { group: 'Configurações', label: 'Pagamentos & Gov' },
  erp_connector_config: { group: 'Configurações', label: 'Integrações' },
  webhooks: { group: 'Configurações', label: 'Webhooks' },
  gps_telemetry: { group: 'Integrações', label: 'Geolocalização & Telemetria' },
  ast_json: { group: 'Super Admin', label: 'AST JSON' },
  construct_lab: { group: 'Super Admin', label: 'Construct Lab' },
  audit_ledger_view: { group: 'Escritório', label: 'Auditoria' },
  graph_health_workspace: { group: 'Super Admin', label: 'Saúde do Grafo' },
  llm_engine: { group: 'Super Admin', label: 'IA · LLM' },
  observability: { group: 'Super Admin', label: 'Observability' },
  ent_hub: { group: 'Trabalho', label: 'Central Enterprise' },
  ent_hitl: { group: 'Central Enterprise', label: 'Aprovação Humana (HITL)' },
  ent_risk_shield: { group: 'Central Enterprise', label: 'Shield de Risco' },
  ent_guardrail: { group: 'Central Enterprise', label: 'Guardrail Anti-alucinação' },
  ent_jurimetria: { group: 'Central Enterprise', label: 'Jurimetria · Decision Score' },
  ent_connect: { group: 'Central Enterprise', label: 'Velatrix Connect' },
  ent_zdr: { group: 'Central Enterprise', label: 'ZDR & Criptografia' },
  ent_verify_seal: { group: 'Central Enterprise', label: 'Verificar Selo do Laudo' },
  ent_conflict: { group: 'Central Enterprise', label: 'Conflict Check' },
  ent_packages: { group: 'Central Enterprise', label: 'Pacotes LegalOps' },
  neural_core: { group: 'Super Admin', label: 'Neural Core' },
  governance_settings: { group: 'Configurações', label: 'Usuários' },
  api_keys_config: { group: 'Configurações', label: 'APIs & Credenciais' },
  onboarding_wizard: { group: 'Configurações', label: 'Primeiros passos' },
  velatrix_office: { group: 'Super Admin', label: 'Escritório Velatrix' },
  roadmap_rollout_hub: { group: 'Super Admin', label: 'Roadmap' },
  architecture_engineering: { group: 'Super Admin', label: 'Arquitetura' },
  admin_analytics: { group: 'Super Admin', label: 'Analytics ao Vivo' },
  super_admin: { group: 'Super Admin', label: 'Tenants' }
};

export const ConsoleShell: React.FC<ConsoleShellProps> = ({
  currentTab,
  onSelectTab,
  tenantProfile,
  auditCount,
  onOpenAstViewer,
  onOpenAskAos,
  onOpenRiskSimulator,
  children
}) => {
  const { currentUser, currentUserRole, logout, isTabAllowed, isSuperAdmin } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleDef = RBAC_ROLE_DEFINITIONS[currentUserRole];
  const breadcrumb = TAB_BREADCRUMBS[currentTab] || { group: 'Console', label: 'Módulo' };

  // Ao trocar de módulo, volta o conteúdo ao topo (senão a nova tela abre no meio).
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, [currentTab]);

  // Listen for Cmd+K / Ctrl+K shortcut to open Ask AOS Omnibar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenAskAos();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAskAos]);

  const handleRiskSimulatorClick = () => {
    if (onOpenRiskSimulator) {
      onOpenRiskSimulator();
    } else {
      onSelectTab('risk_engine_diagnosis');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-canvas text-ink flex flex-col font-sans selection:bg-accent-soft selection:text-accent">
      {/* 56px Topbar · viewport fixo (h-screen + overflow-hidden): só o <main> rola, evitando scroll duplo body+main */}
      <header className="h-[56px] shrink-0 border-b border-hairline bg-canvas sticky top-0 z-30 flex items-center justify-between px-0">
        {/* Left Branding Area (width matches sidebar) */}
        <div
          className={`h-full border-r border-hairline flex items-center px-4 transition-all duration-200 shrink-0 ${
            isSidebarCollapsed ? 'w-[72px] justify-center px-2' : 'w-[264px] justify-between'
          }`}
        >
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-md text-ink-mute hover:text-ink hover:bg-surface cursor-pointer mr-2"
            title="Abrir navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isSidebarCollapsed ? (
            <div
              onClick={() => onSelectTab('operational_dashboard')}
              className="cursor-pointer"
              title="VELATRIX · Sistema Operacional Autônomo"
            >
              <VelatrixLogo size="sm" variant="icon-only" theme="light" />
            </div>
          ) : (
            <div
              onClick={() => onSelectTab('operational_dashboard')}
              className="cursor-pointer flex items-center overflow-hidden"
              title="VELATRIX · Sistema Operacional Autônomo"
            >
              <VelatrixLogo size="sm" variant="full" theme="light" versionText="AOS v4.8" />
            </div>
          )}
        </div>

        {/* Mid Area: Breadcrumbs + Ask AOS Omnibar */}
        <div className="flex-1 flex items-center justify-between gap-4 px-4 sm:px-6 min-w-0">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="hidden xl:flex items-center gap-1.5 text-xs text-ink-mute shrink-0">
            <span
              onClick={() => onSelectTab('operational_dashboard')}
              className="hover:text-ink cursor-pointer font-medium"
            >
              Console
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
            <span className="text-ink-soft">{breadcrumb.group}</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-soft" />
            <span className="font-semibold text-ink">{breadcrumb.label}</span>
          </nav>

          {/* Ask AOS Omnibar Trigger */}
          <div
            onClick={onOpenAskAos}
            className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-hairline hover:border-hairline-strong px-3 py-1.5 rounded-md text-[13px] text-ink-mute flex-1 min-w-0 max-w-sm sm:max-w-md transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            title="Buscar processos, decisões, clientes e comandos do enxame (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-ink-soft shrink-0" />
            <span className="truncate">Buscar processos, clientes, protocolos…</span>
            <kbd className="ml-auto font-mono text-[10px] bg-canvas border border-hairline px-1.5 py-0.5 rounded text-ink-soft shrink-0">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right Area: Action Buttons + User Profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 shrink-0">
          {/* Simulador de Risco */}
          <button
            type="button"
            id="btn-topbar-risk-simulator"
            onClick={handleRiskSimulatorClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-ink-mute hover:text-ink hover:bg-surface border border-hairline rounded-md transition-colors cursor-pointer"
            title="Simulador de Risco & Tensão Operacional"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-warn shrink-0" />
            <span className="hidden xl:inline">Simulador de Risco</span>
          </button>

          {/* AST JSON Inspector Trigger — P23: só Super Admin (ferramenta técnica) */}
          {isSuperAdmin && (<button
            type="button"
            id="btn-topbar-ast-viewer"
            onClick={onOpenAstViewer}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-ink-mute hover:text-ink hover:bg-surface border border-hairline rounded-md transition-colors cursor-pointer"
            title="Inspecionar AST JSON Zero-GUI"
          >
            <FileCode2 className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="hidden md:inline">AST JSON</span>
          </button>)}

          {/* P24 · Ver como (Super Admin) */}
          <ViewAsSelector onSelectTab={onSelectTab} />

          {/* User Account Capsule */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-hairline bg-surface hover:bg-surface-hover transition-colors"
            title={`${currentUser?.name || 'Executivo'} · ${roleDef?.label || 'Diretoria'}`}
          >
            <div className="w-6 h-6 rounded-full bg-accent text-[#FFFFFF] flex items-center justify-center font-bold text-[10.5px] shrink-0">
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden xl:flex flex-col text-left leading-none">
              <span className="text-[12px] font-semibold text-ink truncate max-w-[120px]">
                {currentUser?.name || 'Executivo'}
              </span>
              <span className="text-[9.5px] text-ink-soft uppercase font-mono tracking-tight">
                {roleDef?.label || 'Diretoria'}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            id="btn-topbar-logout"
            onClick={logout}
            className="p-1.5 text-ink-mute hover:text-crit hover:bg-crit-soft border border-transparent hover:border-crit/20 rounded-md transition-colors cursor-pointer"
            title="Desconectar do Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout Area: Sidebar (264px) + Content (1fr) */}
      <div className="flex-1 flex min-w-0 min-h-0">
        <ConsoleSidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          tenantProfile={tenantProfile}
          auditCount={auditCount}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />

        {/* Content Container: Render each module inside <div className="bg-canvas"> */}
        <main ref={mainRef} className="flex-1 min-w-0 min-h-0 bg-canvas overflow-y-auto overscroll-contain">
          <ViewAsBanner onSelectTab={onSelectTab} />
          <ServicoIndisponivelBanner />
          {IS_DEMO_MODE && (
            <div
              role="note"
              className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#F1D9A8] bg-[#FFF8EA] px-4 py-1.5 text-[12px] text-[#7A4F00] sm:px-6"
            >
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#D08A00]" aria-hidden="true" />
              <strong className="shrink-0 whitespace-nowrap font-semibold">{DEMO_LABEL}</strong>
              <span className="hidden truncate sm:inline">· {DEMO_NOTICE}</span>
            </div>
          )}
          {(() => {
            const sectionKey = navSectionOf(currentTab);
            const section = sectionKey ? NAV_SECTIONS[sectionKey] : undefined;
            const tabs = section ? section.tabs.filter((t) => isTabAllowed(t.id)) : [];
            if (!section || tabs.length < 2) return null;
            return (
              <div className="border-b border-hairline bg-canvas px-4 pt-3 sm:px-6">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{section.label}</div>
                <SubTabBar
                  tabs={tabs.map((t) => ({ id: t.id, label: t.label }))}
                  activeTab={currentTab}
                  onTabChange={(id) => onSelectTab(id as NavigationTab)}
                />
              </div>
            );
          })()}
          <div className="bg-canvas min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
