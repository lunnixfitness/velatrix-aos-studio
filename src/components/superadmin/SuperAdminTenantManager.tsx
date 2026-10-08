import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Sparkles, 
  Search, 
  Plus, 
  Settings2, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  Clock, 
  PowerOff, 
  Cpu, 
  Layers, 
  Check, 
  X,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  Gift,
  Calendar
} from 'lucide-react';
import { TenantProfile } from '../../types/aos';
import { PlanTier, VELATRIX_PLAN_TIERS } from '../../data/planFeatures';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminTenantManager: React.FC = () => {
  const { 
    tenantsList, 
    activeTenant, 
    setActiveTenant, 
    updateTenantPlan, 
    toggleTenantFeatureFlag, 
    activateShadowMode, 
    engageKillSwitch, 
    disengageKillSwitch, 
    provisionTenant,
    grantTrialAccess
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal States
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedTenantForFlags, setSelectedTenantForFlags] = useState<TenantProfile | null>(null);
  
  // Two-Step Kill-Switch Modal State
  const [killSwitchModalTenant, setKillSwitchModalTenant] = useState<TenantProfile | null>(null);
  const [killSwitchReason, setKillSwitchReason] = useState('');
  const [killSwitchSecondApprover, setKillSwitchSecondApprover] = useState('ciso@velatrix.ai');
  const [killSwitchStep, setKillSwitchStep] = useState<1 | 2>(1);
  const [killSwitchConfirmationText, setKillSwitchConfirmationText] = useState('');

  // Shadow Mode Modal State
  const [shadowModalTenant, setShadowModalTenant] = useState<TenantProfile | null>(null);
  const [shadowDays, setShadowDays] = useState(14);
  const [shadowReason, setShadowReason] = useState('Auditoria preventiva de conciliação ADVPL');

  // Provision Form State
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantCnpj, setNewTenantCnpj] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<PlanTier>('PROFESSIONAL');
  const [newTenantErp, setNewTenantErp] = useState('TOTVS Protheus (REST / Webhook)');
  const [newTenantSector, setNewTenantSector] = useState<any>('manufacturing');
  const [newTenantCity, setNewTenantCity] = useState('São Paulo');
  const [newTenantState, setNewTenantState] = useState('SP');

  // Trial Form State
  const [trialCompanyName, setTrialCompanyName] = useState('');
  const [trialCompanyCnpj, setTrialCompanyCnpj] = useState('');
  const [trialPlan, setTrialPlan] = useState<PlanTier>('PROFESSIONAL');
  const [trialDays, setTrialDays] = useState<7 | 14 | 30>(14);
  const [trialSector, setTrialSector] = useState('manufacturing');
  const [trialErp, setTrialErp] = useState('TOTVS Protheus (Sandbox)');

  // Filtered tenants
  const filteredTenants = tenantsList.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cnpj.includes(searchTerm) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.connectedErp.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filterPlan === 'ALL' || t.planTier === filterPlan;
    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleOpenKillSwitch = (tenant: TenantProfile) => {
    setKillSwitchModalTenant(tenant);
    setKillSwitchStep(1);
    setKillSwitchReason('');
    setKillSwitchConfirmationText('');
  };

  const handleConfirmKillSwitch = () => {
    if (!killSwitchModalTenant) return;
    if (killSwitchStep === 1) {
      if (!killSwitchReason.trim()) {
        alert('Por favor, informe a justificativa de segurança.');
        return;
      }
      setKillSwitchStep(2);
      return;
    }

    if (killSwitchStep === 2) {
      if (killSwitchConfirmationText.trim().toUpperCase() !== 'CONFIRMAR SUSPENSAO') {
        alert('Digite exatamente "CONFIRMAR SUSPENSAO" para autorizar a ação.');
        return;
      }
      engageKillSwitch(killSwitchModalTenant.id, killSwitchReason, killSwitchSecondApprover);
      setKillSwitchModalTenant(null);
    }
  };

  const handleConfirmShadowMode = () => {
    if (!shadowModalTenant) return;
    activateShadowMode(shadowModalTenant.id, shadowDays, shadowReason);
    setShadowModalTenant(null);
  };

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantCnpj) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    provisionTenant({
      name: newTenantName,
      cnpj: newTenantCnpj,
      planTier: newTenantPlan,
      connectedErp: newTenantErp,
      sector: newTenantSector,
      sectorLabel: newTenantSector === 'manufacturing' ? 'Indústria & Manufatura' : 'Agronegócio & Trading',
      location: {
        city: newTenantCity,
        state: newTenantState,
        lat: -23.5505,
        lng: -46.6333
      }
    });

    setIsProvisionModalOpen(false);
    setNewTenantName('');
    setNewTenantCnpj('');
  };

  const handleCreateTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialCompanyName || !trialCompanyCnpj) {
      alert('Preencha os campos obrigatórios do Trial.');
      return;
    }

    grantTrialAccess({
      name: trialCompanyName,
      cnpj: trialCompanyCnpj,
      planTier: trialPlan,
      connectedErp: trialErp,
      sector: trialSector as any,
      sectorLabel: trialSector === 'manufacturing' ? 'Indústria & Manufatura' : trialSector === 'logistics' ? 'Logística & Frota' : 'Saúde & Farmacêutica'
    }, trialDays);

    setIsTrialModalOpen(false);
    setTrialCompanyName('');
    setTrialCompanyCnpj('');
  };

  return (
    <div className="space-y-6">
      
      {/* Action Bar & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[var(--vx-deep)] p-4 rounded-xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 w-full lg:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por Tenant, CNPJ, ERP ou ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/50 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={e => setFilterPlan(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/40 cursor-pointer"
          >
            <option value="ALL">Todos os Planos ({tenantsList.length})</option>
            {(Object.keys(VELATRIX_PLAN_TIERS) as PlanTier[]).map(tierKey => (
              <option key={tierKey} value={tierKey}>
                {VELATRIX_PLAN_TIERS[tierKey].name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/40 cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="active">Ativo (Nominal)</option>
            <option value="trial">Acesso Trial / POC</option>
            <option value="expired">Trial Expirado</option>
            <option value="warning">Alerta</option>
            <option value="shadow_mode">Shadow Mode (14d)</option>
            <option value="suspended">Suspenso (Kill-Switch)</option>
          </select>

          {/* Grant Trial Access Button */}
          <button
            id="btn-grant-trial-access-superadmin"
            onClick={() => setIsTrialModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 font-bold text-xs transition-all shadow-md cursor-pointer"
            title="Conceder Acesso Trial sem cobrança (7, 14 ou 30 dias)"
          >
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>Conceder Acesso Trial</span>
          </button>

          {/* Provision Button */}
          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--vx-neon)] text-slate-950 font-bold text-xs hover:bg-[var(--vx-neon)]/90 transition-all shadow-md shadow-[var(--vx-neon)]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provisionar Novo Tenant</span>
          </button>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-[var(--vx-deep)] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Tenant / CNPJ</th>
                <th className="py-3 px-3">Plano Vigente</th>
                <th className="py-3 px-3">Status Operacional</th>
                <th className="py-3 px-3">Conector ERP</th>
                <th className="py-3 px-3">ARR / MRR Estimado</th>
                <th className="py-3 px-3">Consumo Gemini</th>
                <th className="py-3 px-4 text-right">Ações de Alçada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum tenant encontrado para os critérios de busca.
                  </td>
                </tr>
              ) : (
                filteredTenants.map(tenant => {
                  const planKey = (tenant.planTier || 'STARTER') as PlanTier;
                  const planConfig = VELATRIX_PLAN_TIERS[planKey] || VELATRIX_PLAN_TIERS.STARTER;
                  const isCurrentActiveInSession = activeTenant.id === tenant.id;

                  return (
                    <tr 
                      key={tenant.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isCurrentActiveInSession ? 'bg-[var(--vx-neon)]/5' : ''
                      }`}
                    >
                      {/* Tenant Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[var(--vx-neon)] font-bold text-xs shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 flex items-center gap-1.5">
                              <span>{tenant.name}</span>
                              {isCurrentActiveInSession && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] rounded border border-[var(--vx-neon)]/40 font-semibold">
                                  Sessão Ativa
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                              <span>CNPJ: {tenant.cnpj}</span>
                              <span>·</span>
                              <span className="text-slate-400">{tenant.location?.city}/{tenant.location?.state}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Plan Dropdown Selector */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <select
                            value={tenant.planTier || 'STARTER'}
                            onChange={e => updateTenantPlan(tenant.id, e.target.value as PlanTier)}
                            className={`text-xs px-2.5 py-1 rounded-md font-semibold border focus:outline-none cursor-pointer ${planConfig.colorScheme.bg} ${planConfig.colorScheme.border} ${planConfig.colorScheme.text}`}
                          >
                            {(Object.keys(VELATRIX_PLAN_TIERS) as PlanTier[]).map(tierKey => (
                              <option key={tierKey} value={tierKey} className="bg-slate-900 text-slate-200">
                                {VELATRIX_PLAN_TIERS[tierKey].name} ({VELATRIX_PLAN_TIERS[tierKey].monthlyPriceLabel})
                              </option>
                            ))}
                          </select>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {planConfig.agentsCount} Agentes · {planConfig.slaBadge}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {tenant.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Nominal
                          </span>
                        )}
                        {tenant.status === 'trial' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                              <Gift className="w-3 h-3 text-emerald-400" /> Trial ({tenant.trialDurationDays || 14}d)
                            </span>
                            {tenant.trialExpiresAt && (
                              <span className="block text-[9px] text-slate-400 font-mono">
                                Expira: {new Date(tenant.trialExpiresAt).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        )}
                        {tenant.status === 'expired' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/40 font-mono">
                              <Clock className="w-3 h-3 text-red-400" /> Expirado
                            </span>
                            <span className="block text-[9px] text-red-400/80 font-mono">
                              Trial encerrado
                            </span>
                          </div>
                        )}
                        {tenant.status === 'warning' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" /> Alerta Conector
                          </span>
                        )}
                        {tenant.status === 'shadow_mode' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                            <Eye className="w-3 h-3" /> Shadow Mode (14d)
                          </span>
                        )}
                        {tenant.status === 'suspended' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <PowerOff className="w-3 h-3" /> Suspenso (Kill-Switch)
                          </span>
                        )}
                      </td>

                      {/* ERP Connector */}
                      <td className="py-3.5 px-3">
                        <span className="text-slate-300 font-medium block truncate max-w-[160px]" title={tenant.connectedErp}>
                          {tenant.connectedErp}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {tenant.connectedChannels?.length || 0} canais ativos
                        </span>
                      </td>

                      {/* Financial (MRR / ARR) */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="font-bold text-slate-200">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(tenant.mrrBrl || planConfig.monthlyPriceBrl)}/mês
                        </div>
                        <div className="text-[10px] text-slate-400">
                          ARR: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format((tenant.mrrBrl || planConfig.monthlyPriceBrl) * 12)}
                        </div>
                      </td>

                      {/* Tokens Gemini */}
                      <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-[var(--vx-neon)]" />
                          <span>{((tenant.tokensConsumedMonthly || 1200000) / 1000000).toFixed(2)}M /mês</span>
                        </div>
                        <div className="w-24 bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                          <div 
                            className="bg-[var(--vx-neon)] h-full rounded-full"
                            style={{ width: `${Math.min(100, ((tenant.tokensConsumedMonthly || 1200000) / 15000000) * 100)}%` }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Impersonate / Select Tenant */}
                          <button
                            onClick={() => setActiveTenant(tenant)}
                            title="Alternar dashboard para este Tenant"
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                              isCurrentActiveInSession
                                ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border-[var(--vx-neon)]/40'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{isCurrentActiveInSession ? 'Ativo' : 'Ver'}</span>
                          </button>

                          {/* Feature Flags */}
                          <button
                            onClick={() => setSelectedTenantForFlags(tenant)}
                            title="Gerenciar Feature Flags"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-[var(--vx-neon)] hover:border-slate-700 transition-colors cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Shadow Mode Toggle */}
                          <button
                            onClick={() => setShadowModalTenant(tenant)}
                            title="Ativar Shadow Mode (14 dias)"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Kill Switch (Modal 2-step) */}
                          {tenant.status === 'suspended' ? (
                            <button
                              onClick={() => disengageKillSwitch(tenant.id, 'Reativação solicitada via Super-Admin')}
                              title="Reativar Tenant"
                              className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenKillSwitch(tenant)}
                              title="Executar Kill-Switch (Exige 2 Aprovadores)"
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
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

      {/* MODAL: Provision New Tenant */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Provisionar Novo Tenant Corporativo</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Alocação de nó semântico isolado no cluster Velatrix</p>
                </div>
              </div>
              <button 
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razão Social / Nome da Empresa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Grupo Votorantim S/A"
                  value={newTenantName}
                  onChange={e => setNewTenantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newTenantCnpj}
                    onChange={e => setNewTenantCnpj(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plano Inicial *</label>
                  <select
                    value={newTenantPlan}
                    onChange={e => setNewTenantPlan(e.target.value as PlanTier)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50 cursor-pointer font-semibold"
                  >
                    {(Object.keys(VELATRIX_PLAN_TIERS) as PlanTier[]).map(tierKey => (
                      <option key={tierKey} value={tierKey}>
                        {VELATRIX_PLAN_TIERS[tierKey].name} ({VELATRIX_PLAN_TIERS[tierKey].monthlyPriceLabel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Conector ERP Primário</label>
                <select
                  value={newTenantErp}
                  onChange={e => setNewTenantErp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50 cursor-pointer"
                >
                  <option value="TOTVS Protheus (ADVPL / REST / Webhook)">TOTVS Protheus V12</option>
                  <option value="SAP S/4HANA Cloud (OData v4)">SAP S/4HANA Cloud</option>
                  <option value="SAP ECC 6.0 (RFC / BAPI)">SAP ECC 6.0</option>
                  <option value="Senior Mega ERP (REST Gateway)">Senior Mega ERP</option>
                  <option value="Oracle Fusion Cloud ERP">Oracle Fusion Cloud</option>
                  <option value="ContaAzul Open API">ContaAzul API</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Cidade Sede</label>
                  <input
                    type="text"
                    value={newTenantCity}
                    onChange={e => setNewTenantCity(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">UF</label>
                  <input
                    type="text"
                    value={newTenantState}
                    onChange={e => setNewTenantState(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-[var(--vx-neon)]/50 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--vx-neon)] text-slate-950 font-bold hover:bg-[var(--vx-neon)]/90 transition-colors cursor-pointer"
                >
                  Concluir Provisionamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Grant Trial Access (7, 14, 30 days) */}
      {isTrialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Conceder Acesso Trial (Sem Cobrança)</h3>
                  <p className="text-[11px] text-emerald-400 font-mono">PROTÓTIPO — DADOS SIMULADOS · Degustação Operacional</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTrialModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTrial} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
                <p className="text-[11px] leading-relaxed">
                  Concede acesso temporário com permissões completas de orquestração. Não gera cobrança real e o status mudará automaticamente para <strong>Expirado</strong> ao término do período.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Razão Social / Nome da Empresa Prospect *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Frigorífico Estrela D'Oeste S/A"
                  value={trialCompanyName}
                  onChange={e => setTrialCompanyName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={trialCompanyCnpj}
                    onChange={e => setTrialCompanyCnpj(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duração do Trial *</label>
                  <select
                    value={trialDays}
                    onChange={e => setTrialDays(Number(e.target.value) as 7 | 14 | 30)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-emerald-300 font-bold focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    <option value={7}>7 Dias de Degustação</option>
                    <option value={14}>14 Dias (Recomendado)</option>
                    <option value={30}>30 Dias (POC Estendida)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plano a Degustar</label>
                  <select
                    value={trialPlan}
                    onChange={e => setTrialPlan(e.target.value as PlanTier)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    {(['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as PlanTier[]).map(tierKey => (
                      <option key={tierKey} value={tierKey}>
                        {VELATRIX_PLAN_TIERS[tierKey].name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Setor Econômico</label>
                  <select
                    value={trialSector}
                    onChange={e => setTrialSector(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    <option value="manufacturing">Indústria & Manufatura</option>
                    <option value="logistics">Logística & Transportes</option>
                    <option value="healthcare">Saúde & Farmacêutica</option>
                    <option value="retail">Varejo & E-commerce</option>
                    <option value="agro">Agronegócio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Conector ERP / Sandbox</label>
                <input
                  type="text"
                  value={trialErp}
                  onChange={e => setTrialErp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTrialModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors cursor-pointer shadow-lg shadow-emerald-950/50"
                >
                  Ativar Acesso Trial ({trialDays} Dias)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Feature Flags Overrides */}
      {selectedTenantForFlags && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[var(--vx-neon)]" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Matriz de Feature Flags Individuais</h3>
                  <p className="text-[11px] text-slate-400">{selectedTenantForFlags.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTenantForFlags(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { key: 'multimodalIngestion', label: 'Ingestão Multimodal (OCR / Áudio)', minPlan: 'Professional' },
                { key: 'riskPropagationEngine', label: 'Motor de Propagação de Tensão Contínua', minPlan: 'Professional' },
                { key: 'iotColdChainTelemetry', label: 'Telemetria IoT / Sensores de Cadeia Fria', minPlan: 'Enterprise' },
                { key: 'redTeamAdversarial', label: 'Validação Red Team Adversarial Contínua', minPlan: 'Enterprise' },
                { key: 'airGappedDeployment', label: 'Isolamento Air-Gapped / On-Premise', minPlan: 'Regulated' },
                { key: 'hsmHardwareSecurity', label: 'Chaves Criptográficas HSM FIPS 140-3', minPlan: 'Regulated' }
              ].map(({ key, label, minPlan }) => {
                const planKey = (selectedTenantForFlags.planTier || 'STARTER') as PlanTier;
                const defaultEnabled = VELATRIX_PLAN_TIERS[planKey]?.[key as any] ?? false;
                const overrideVal = selectedTenantForFlags.featureFlagOverrides?.[key];
                const isCurrentlyActive = overrideVal !== undefined ? overrideVal : defaultEnabled;

                return (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                    <div>
                      <div className="font-semibold text-slate-200">{label}</div>
                      <div className="text-[10px] text-slate-400">
                        Nativo no plano: <span className="text-[var(--vx-neon)]">{minPlan}</span> · {overrideVal !== undefined ? '(Override manual ativo)' : '(Padrão do plano)'}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleTenantFeatureFlag(selectedTenantForFlags.id, key, !isCurrentlyActive)}
                      className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${
                        isCurrentlyActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isCurrentlyActive ? 'HABILITADO' : 'DESABILITADO'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTenantForFlags(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Shadow Mode Activation */}
      {shadowModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-slate-800 pb-3">
              <Eye className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">Ativar Shadow Mode (Modo Observador)</h3>
                <p className="text-[10px] text-slate-400">{shadowModalTenant.name}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-slate-400">
                O Shadow Mode permite que o AOS ingira eventos do ERP e delibere decisões em tempo real <strong>sem gravar ordens de compra ou pagamentos</strong>, validando a assertividade antes da automação plena.
              </p>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Duração do Período de Validação</label>
                <select
                  value={shadowDays}
                  onChange={e => setShadowDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                >
                  <option value={7}>7 Dias de Validação</option>
                  <option value={14}>14 Dias (Padrão Recomendado)</option>
                  <option value={30}>30 Dias (Auditoria Estendida)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">Justificativa da Auditoria</label>
                <input
                  type="text"
                  value={shadowReason}
                  onChange={e => setShadowReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setShadowModalTenant(null)}
                className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmShadowMode}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors cursor-pointer"
              >
                Confirmar Shadow Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Two-Step Kill Switch */}
      {killSwitchModalTenant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl ring-1 ring-rose-500/20">
            
            {/* Header */}
            <div className="flex items-center gap-2.5 text-rose-400 border-b border-slate-800 pb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Kill-Switch de Emergência — Etapa {killSwitchStep} de 2
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Isolamento Imediato de Tenant & Revogação de Alçadas
                </p>
              </div>
            </div>

            {/* Step 1: Reason and Approver */}
            {killSwitchStep === 1 && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Atenção Crítica:</strong>
                      O Kill-Switch suspenderá imediatamente todos os conectores ERP, webhooks bancários e tomadas de decisão autônomas do tenant <strong>{killSwitchModalTenant.name}</strong>.
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    1. Motivo Formal do Isolamento / Incidente *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Ex: Detecção de anomalia crítica no conector bancário com divergência de chaves de conciliação..."
                    value={killSwitchReason}
                    onChange={e => setKillSwitchReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    2. Segundo Aprovador Obrigatório (Quórum Multi-Sig)
                  </label>
                  <input
                    type="email"
                    value={killSwitchSecondApprover}
                    onChange={e => setKillSwitchSecondApprover(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-rose-500/50 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Explicit Confirmation Typing */}
            {killSwitchStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400">Tenant: <strong className="text-slate-200">{killSwitchModalTenant.name}</strong></div>
                  <div className="text-slate-400">Motivo: <span className="text-rose-300">{killSwitchReason}</span></div>
                  <div className="text-slate-400">Co-Aprovador: <span className="text-slate-200 font-mono">{killSwitchSecondApprover}</span></div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Digite exatamente <span className="text-rose-400 font-mono font-bold">CONFIRMAR SUSPENSAO</span> para autorizar o isolamento:
                  </label>
                  <input
                    type="text"
                    value={killSwitchConfirmationText}
                    onChange={e => setKillSwitchConfirmationText(e.target.value)}
                    placeholder="CONFIRMAR SUSPENSAO"
                    className="w-full bg-slate-900 border border-rose-500/40 rounded-lg p-2.5 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-400 text-center tracking-wider"
                  />
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setKillSwitchModalTenant(null)}
                className="px-3.5 py-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-2">
                {killSwitchStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setKillSwitchStep(1)}
                    className="px-3 py-2 rounded-lg text-slate-300 bg-slate-800 cursor-pointer"
                  >
                    Voltar
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmKillSwitch}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  {killSwitchStep === 1 ? 'Avançar para Confirmação Multi-Sig' : 'EXECUTAR KILL-SWITCH'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
