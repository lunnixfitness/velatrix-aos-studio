import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  DollarSign, 
  History, 
  ShieldAlert, 
  ShieldCheck,
  Zap, 
  Sparkles, 
  Terminal, 
  Lock, 
  Sliders, 
  AlertCircle,
  Cpu,
  Layers,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Users,
  Cable
} from 'lucide-react';
import { SuperAdminTenantManager } from './SuperAdminTenantManager';
import { SuperAdminGeoDashboard } from './SuperAdminGeoDashboard';
import { SuperAdminFinancialHealth } from './SuperAdminFinancialHealth';
import { SuperAdminAuditTrail } from './SuperAdminAuditTrail';
import { SuperAdminAgentChecklist } from './SuperAdminAgentChecklist';
import { ErpConnectionManagerPanel } from './ErpConnectionManagerPanel';
import { GovernancePanel } from '../GovernancePanel';
import { TenantUserManagementPanel } from '../governance/TenantUserManagementPanel';
import { useAuth } from '../../context/AuthContext';
import { VELATRIX_PLAN_TIERS } from '../../data/planFeatures';
import { ALL_200_AGENTS } from '../../data/agentSwarm200Data';
import { 
  GovernanceSettings, 
  SupportedLanguage, 
  SupportedCurrency, 
  FiscalJurisdiction 
} from '../../types/aos';

export type SuperAdminSubTab = 'tenants' | 'erp_connections' | 'users_iam' | 'governance_risk' | 'agents_checklist' | 'geo_map' | 'financial' | 'audit_trail';

interface SuperAdminDashboardProps {
  onReturnToTenant: () => void;
  initialGovernanceSettings?: GovernanceSettings;
  onSaveGovernanceSettings?: (settings: GovernanceSettings) => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  fiscalJurisdiction?: FiscalJurisdiction;
  onChangeJurisdiction?: (jur: FiscalJurisdiction) => void;
  onAddAuditRecord?: (record: any) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onReturnToTenant,
  initialGovernanceSettings,
  onSaveGovernanceSettings,
  language = 'pt',
  currency = 'BRL',
  fiscalJurisdiction = 'BR',
  onChangeJurisdiction,
  onAddAuditRecord
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SuperAdminSubTab>('tenants');
  const { tenantsList, activeTenant, currentUserRole, setCurrentUserRole } = useAuth();

  return (
    <div id="super-admin-root" className="min-h-screen bg-[var(--vx-deep)] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* PROTOTYPE FIXED NOTICE BANNER */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <span>PROTÓTIPO — DADOS SIMULADOS</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                Velatrix Super-Admin v2.4 (Sandbox Frontend)
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Painel de governança multi-tenant e alocação de nós semânticos com simulação determinística de chamadas de infraestrutura.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToTenant}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 hover:text-white hover:border-[var(--vx-neon)] transition-colors cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-4 h-4 text-[var(--vx-neon)]" />
            <span>Voltar ao Tenant ({activeTenant.name.split(' ')[0]})</span>
          </button>
        </div>
      </div>

      {/* SUPER-ADMIN HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Painel Super-Admin Velatrix AOS
              <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-violet-500/20 text-violet-300 border border-violet-500/40">
                ROLE: super_admin
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Gestão Multi-Tenant · Alçadas de Segurança · Matriz de 4 Planos Oficiais Velatrix
          </p>
        </div>

        {/* Global Cluster Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">{tenantsList.length} Tenants Provisionados</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-[var(--vx-neon)]">
            Cloud Run Cluster: 100% Saudável
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800/80">
        <button
          onClick={() => setActiveSubTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'tenants'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Manager & Alçadas ({tenantsList.length})</span>
        </button>

        <button
          id="btn-subtab-erp-connections"
          onClick={() => setActiveSubTab('erp_connections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'erp_connections'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Cable className="w-4 h-4 text-cyan-400" />
          <span>Conectores ERP & Webhooks</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            TOTVS / SAP
          </span>
        </button>

        <button
          id="btn-subtab-users-iam"
          onClick={() => setActiveSubTab('users_iam')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'users_iam'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4 text-blue-400" />
          <span>Gestão de Usuários & Convites (IAM)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
            RBAC
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('governance_risk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'governance_risk'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Painel de Governança & Risco</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/40">
            Multi-Sig & Invariantes
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('agents_checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'agents_checklist'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Cpu className="w-4 h-4 text-[var(--vx-neon)]" />
          <span>Checklist de Execução de Agentes ({ALL_200_AGENTS.length})</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-violet-500/20 text-violet-300 border border-violet-500/40">
            11 Enxames
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('geo_map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'geo_map'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Dashboard Geográfico (Mapa LatAm)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('financial')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'financial'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Saúde Financeira & Consumo Gemini</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit_trail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'audit_trail'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 shadow-lg shadow-[var(--vx-neon)]/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Trilha de Auditoria Imutável</span>
        </button>
      </div>

      {/* SUB-TAB CONTENTS */}
      <div className="pt-2">
        {activeSubTab === 'tenants' && <SuperAdminTenantManager />}
        {activeSubTab === 'erp_connections' && <ErpConnectionManagerPanel />}
        {activeSubTab === 'users_iam' && (
          <TenantUserManagementPanel
            onAddAuditRecord={onAddAuditRecord}
          />
        )}
        {activeSubTab === 'governance_risk' && (
          <GovernancePanel
            initialSettings={initialGovernanceSettings}
            onSaveSettings={onSaveGovernanceSettings || (() => {})}
            onBackToDashboard={() => setActiveSubTab('tenants')}
            language={language}
            currency={currency}
            fiscalJurisdiction={fiscalJurisdiction}
            onChangeJurisdiction={onChangeJurisdiction}
          />
        )}
        {activeSubTab === 'agents_checklist' && <SuperAdminAgentChecklist />}
        {activeSubTab === 'geo_map' && <SuperAdminGeoDashboard />}
        {activeSubTab === 'financial' && <SuperAdminFinancialHealth />}
        {activeSubTab === 'audit_trail' && <SuperAdminAuditTrail />}
      </div>

    </div>
  );
};
