import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Cpu, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  Zap, 
  Building2, 
  ShieldCheck,
  CreditCard,
  Percent
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { VELATRIX_PLAN_TIERS, PlanTier } from '../../data/planFeatures';

export const SuperAdminFinancialHealth: React.FC = () => {
  const { tenantsList } = useAuth();

  // Aggregate Financials
  const totalMrr = tenantsList.reduce((acc, t) => {
    const planKey = (t.planTier || 'STARTER') as PlanTier;
    const price = t.mrrBrl || VELATRIX_PLAN_TIERS[planKey]?.monthlyPriceBrl || VELATRIX_PLAN_TIERS.STARTER.monthlyPriceBrl;
    return acc + price;
  }, 0);

  const totalArr = totalMrr * 12;

  const totalTokens = tenantsList.reduce((acc, t) => acc + (t.tokensConsumedMonthly || 1500000), 0);
  const totalTokensMillion = (totalTokens / 1000000).toFixed(1);

  // Group by Plan
  const planDistribution = tenantsList.reduce((acc, t) => {
    const plan = t.planTier || 'STARTER';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Estimated Gemini API Cost (Simulated: $0.15 per 1M tokens approx R$ 0.85/M)
  const estimatedTokenCostBrl = (totalTokens / 1000000) * 0.85;
  const grossMarginPercent = (((totalMrr - estimatedTokenCostBrl) / totalMrr) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR Card */}
        <div className="p-4 rounded-xl bg-[var(--vx-deep)] border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">MRR Total Consolidado</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalMrr)}
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% MoM (Novos Contratos)</span>
          </div>
        </div>

        {/* ARR Card */}
        <div className="p-4 rounded-xl bg-[var(--vx-deep)] border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">ARR Projetado</span>
            <TrendingUp className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--vx-neon)] font-mono">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalArr)}
          </div>
          <div className="text-[11px] text-slate-400">
            Base anualizada com {tenantsList.length} tenants ativos
          </div>
        </div>

        {/* Gemini Tokens Consumed */}
        <div className="p-4 rounded-xl bg-[var(--vx-deep)] border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Consumo Gemini Flash</span>
            <Cpu className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-300 font-mono">
            {totalTokensMillion}M <span className="text-xs text-slate-400 font-normal">tokens/mês</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Custo Infra: ~{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedTokenCostBrl)}
          </div>
        </div>

        {/* Gross Margin */}
        <div className="p-4 rounded-xl bg-[var(--vx-deep)] border border-slate-800 shadow-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Margem Bruta Software</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {grossMarginPercent}%
          </div>
          <div className="text-[11px] text-slate-400">
            Alta eficiência de inferência Cloud Run
          </div>
        </div>

      </div>

      {/* Breakdown: Plan Revenue & Token Consumption by Tenant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Plan Breakdown Card */}
        <div className="bg-[var(--vx-deep)] p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--vx-neon)]" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Distribuição de Receita por Categoria de Plano
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Matriz Oficial Velatrix</span>
          </div>

          <div className="space-y-3">
            {(['REGULATED', 'ENTERPRISE', 'PROFESSIONAL', 'STARTER'] as PlanTier[]).map(planKey => {
              const count = planDistribution[planKey] || 0;
              const planConfig = VELATRIX_PLAN_TIERS[planKey];
              const planRevenue = count * planConfig.monthlyPriceBrl;
              const percent = totalMrr > 0 ? ((planRevenue / totalMrr) * 100).toFixed(1) : '0';

              return (
                <div key={planKey} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${planConfig.colorScheme.bg} ${planConfig.colorScheme.border} ${planConfig.colorScheme.text}`}>
                        {planConfig.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({count} {count === 1 ? 'tenant' : 'tenants'})
                      </span>
                    </div>
                    <div className="font-bold text-slate-200 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(planConfig.monthlyPriceBrl)}/mês
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-[var(--vx-neon)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span className="truncate max-w-[70%]">{planConfig.tagline}</span>
                    <span>{percent}% do MRR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gemini Token Usage by Tenant */}
        <div className="bg-[var(--vx-deep)] p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Consumo Mensal de Tokens de Inferência por Tenant
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">LLM Orchestrator Telemetry</span>
          </div>

          <div className="space-y-3">
            {tenantsList.map(tenant => {
              const tokens = tenant.tokensConsumedMonthly || 1200000;
              const tokensM = (tokens / 1000000).toFixed(2);
              const percentOfTotal = ((tokens / totalTokens) * 100).toFixed(1);

              return (
                <div key={tenant.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{tenant.name}</span>
                    <span className="font-mono text-violet-300 font-bold">{tokensM}M tokens</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full"
                      style={{ width: `${percentOfTotal}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Plano: {tenant.planTier}</span>
                    <span>{percentOfTotal}% do volume total de inferência</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
