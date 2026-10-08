import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sliders, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Lock, 
  DollarSign, 
  Users, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  SlidersHorizontal, 
  Info,
  Receipt,
  Landmark,
  ArrowLeft,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Terminal
} from 'lucide-react';
import { 
  GovernanceSettings, 
  BusinessInvariantConfig, 
  ApproverRoleConfig, 
  SupportedLanguage, 
  SupportedCurrency,
  FiscalJurisdiction,
  WhatsAppGovernanceConfig
} from '../types/aos';
import { GlobalTaxEngineCard } from './GlobalTaxEngineCard';
import { WhatsAppGovernanceCard, INITIAL_DEFAULT_WHATSAPP_CONFIG } from './governance/WhatsAppGovernanceCard';
import { TenantUserManagementPanel } from './governance/TenantUserManagementPanel';
import { TRANSLATIONS, formatCurrency, formatNumber } from '../utils/i18n';
import { useAuth } from '../context/AuthContext';

const INVARIANT_I18N: Record<string, { name: Record<string, string>; description: Record<string, string>; unit?: Record<string, string> }> = {
  inv_cash_min: {
      name: { pt: 'Saldo_Caixa_Minimo (Colchão de Liquidez)', es: 'Saldo_Caja_Minimo (Colchón de Liquidez)', en: 'Minimum_Cash_Reserve (Liquidity Buffer)' },
          description: { pt: 'Bloqueia despachos táticos que reduzam o caixa livre projetado abaixo do limiar estipulado pelo conselho.', es: 'Bloquea despachos tácticos que reduzcan la caja proyectada por debajo del umbral estipulado.', en: 'Blocks tactical dispatches that reduce projected free cash below the board-mandated threshold.' }
            },
              inv_sla_min: {
                  name: { pt: 'SLA_Compliance_TierA_Minimo', es: 'SLA_Cumplimiento_TierA_Minimo', en: 'SLA_Compliance_TierA_Minimum' },
                      description: { pt: 'Exige que qualquer plano tático mantenha o cumprimento dos contratos de clientes estratégicos.', es: 'Exige que cualquier plan táctico mantenga el cumplimiento de los contratos estratégicos.', en: 'Requires any tactical response to preserve SLA fulfillment for Tier-A enterprise contracts.' }
                        },
                          inv_stock_days: {
                              name: { pt: 'Estoque_Seguranca_Minimo', es: 'Inventario_Seguridad_Minimo', en: 'Minimum_Safety_Stock_Days' },
                                  description: { pt: 'Garante que os insumos críticos não fiquem abaixo da cobertura de dias de operação.', es: 'Garantiza que los insumos críticos no caigan por debajo de la cobertura de días de operación.', en: 'Guarantees that critical stock coverage never drops below operational safety limits.' },
                                      unit: { pt: 'dias', es: 'días', en: 'days' }
                                        },
                                          inv_max_spot_discount: {
                                              name: { pt: 'Desconto_Maximo_Spot_Sem_CFO', es: 'Descuento_Maximo_Spot_Sin_CFO', en: 'Max_Autonomous_Spot_Discount' },
                                                  description: { pt: 'Limite máximo de desconto ou bonificação que o Agente de Vendas pode conceder para retenção.', es: 'Límite máximo de descuento que el Agente de Ventas puede conceder para retención.', en: 'Maximum discount or commercial credit that Sales Agent can autonomously offer without CFO approval.' }
                                                    },
                                                      inv_proof_intent_bank: {
                                                          name: { pt: 'Bloqueio_Troca_Conta_Nao_Homologada', es: 'Bloqueo_Cambio_Cuenta_No_Homologada', en: 'Lock_Unverified_Bank_Account_Updates' },
                                                              description: { pt: 'Dispara quarentena instantânea se houver solicitação de alteração de domicílio bancário ou PIX por canal não assinado.', es: 'Dispara cuarentena instantánea ante solicitudes de cambio bancario por canales no firmados.', en: 'Triggers immediate zero-trust quarantine upon wire / banking destination changes received via unverified channels.' }
                                                                }
                                                                };

                                                                function getInvariantName(id: string, lang: string, fallback: string): string {
                                                                  return INVARIANT_I18N[id]?.name[lang] || fallback;
                                                                  }
                                                                  function getInvariantDescription(id: string, lang: string, fallback: string): string {
                                                                    return INVARIANT_I18N[id]?.description[lang] || fallback;
                                                                    }
                                                                    function getInvariantUnit(id: string, lang: string, fallback: string): string {
                                                                      return INVARIANT_I18N[id]?.unit?.[lang] || fallback;
                                                                      }

const DeveloperSuperAdminToggle: React.FC = () => {
  const { currentUserRole, setCurrentUserRole } = useAuth();
  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <button
      type="button"
      onClick={() => setCurrentUserRole(isSuperAdmin ? 'cfo_executive' : 'super_admin')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
        isSuperAdmin
          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
          : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200'
      }`}
    >
      {isSuperAdmin ? (
        <>
          <ToggleRight className="w-4 h-4 text-violet-200" />
          <span>SUPER_ADMIN ATIVO</span>
        </>
      ) : (
        <>
          <ToggleLeft className="w-4 h-4 text-slate-500" />
          <span>MODO TENANT</span>
        </>
      )}
    </button>
  );
};

interface GovernancePanelProps {
  initialSettings?: GovernanceSettings;
  onSaveSettings: (settings: GovernanceSettings) => void;
  onBackToDashboard: () => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  fiscalJurisdiction?: FiscalJurisdiction;
  onChangeJurisdiction?: (jur: FiscalJurisdiction) => void;
  onAddAuditRecord?: (record: any) => void;
  onNavigateTab?: (tab: any) => void;
}

export const GovernancePanel: React.FC<GovernancePanelProps> = ({
  initialSettings,
  onSaveSettings,
  onBackToDashboard,
  language = 'pt',
  currency = 'BRL',
  fiscalJurisdiction = 'BR',
  onChangeJurisdiction,
  onAddAuditRecord,
  onNavigateTab
}: GovernancePanelProps) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;

  const [activeJurisdiction, setActiveJurisdiction] = useState<FiscalJurisdiction>(
    fiscalJurisdiction || initialSettings?.fiscalJurisdiction || 'BR'
  );

  const handleJurisdictionChange = (newJur: FiscalJurisdiction) => {
    setActiveJurisdiction(newJur);
    onChangeJurisdiction?.(newJur);
  };

  // Default Settings State
  const [maxAutonomousBudget, setMaxAutonomousBudget] = useState(
    initialSettings?.maxAutonomousBudgetBrl || 25000
  );
  const [multiSigQuorum, setMultiSigQuorum] = useState(
    initialSettings?.multiSigQuorumCount || 2
  );
  const [strictProofOfIntent, setStrictProofOfIntent] = useState(
    initialSettings?.strictProofOfIntent ?? true
  );
  const [autoQuarantine, setAutoQuarantine] = useState(
    initialSettings?.autoQuarantineSuspiciousEvents ?? true
  );

  // Invariants list state
  const [invariants, setInvariants] = useState<BusinessInvariantConfig[]>(
    initialSettings?.invariants || [
      {
        id: 'inv_cash_min',
        name: language === 'pt' ? 'Saldo_Caixa_Minimo (Colchão de Liquidez)' : language === 'es' ? 'Saldo_Caja_Minimo (Colchón de Liquidez)' : 'Minimum_Cash_Reserve (Liquidity Buffer)',
        description: language === 'pt' ? 'Bloqueia despachos táticos que reduzam o caixa livre projetado abaixo do limiar estipulado pelo conselho.' : language === 'es' ? 'Bloquea despachos tácticos que reduzcan la caja proyectada por debajo del umbral estipulado.' : 'Blocks tactical dispatches that reduce projected free cash below the board-mandated threshold.',
        enabled: true,
        type: 'currency',
        value: 2000000,
        unit: currency,
        category: 'treasury'
      },
      {
        id: 'inv_sla_min',
        name: language === 'pt' ? 'SLA_Compliance_TierA_Minimo' : language === 'es' ? 'SLA_Cumplimiento_TierA_Minimo' : 'SLA_Compliance_TierA_Minimum',
        description: language === 'pt' ? 'Exige que qualquer plano tático mantenha o cumprimento dos contratos de clientes estratégicos.' : language === 'es' ? 'Exige que cualquier plan táctico mantenga el cumplimiento de los contratos estratégicos.' : 'Requires any tactical response to preserve SLA fulfillment for Tier-A enterprise contracts.',
        enabled: true,
        type: 'percentage',
        value: 98.0,
        unit: '%',
        category: 'risk'
      },
      {
        id: 'inv_stock_days',
        name: language === 'pt' ? 'Estoque_Seguranca_Minimo' : language === 'es' ? 'Inventario_Seguridad_Minimo' : 'Minimum_Safety_Stock_Days',
        description: language === 'pt' ? 'Garante que os insumos críticos não fiquem abaixo da cobertura de dias de operação.' : language === 'es' ? 'Garantiza que los insumos críticos no caigan por debajo de la cobertura de días de operación.' : 'Guarantees that critical stock coverage never drops below operational safety limits.',
        enabled: true,
        type: 'number',
        value: 15,
        unit: language === 'pt' ? 'dias' : language === 'es' ? 'días' : 'days',
        category: 'logistics'
      },
      {
        id: 'inv_max_spot_discount',
        name: language === 'pt' ? 'Desconto_Maximo_Spot_Sem_CFO' : language === 'es' ? 'Descuento_Maximo_Spot_Sin_CFO' : 'Max_Autonomous_Spot_Discount',
        description: language === 'pt' ? 'Limite máximo de desconto ou bonificação que o Agente de Vendas pode conceder para retenção.' : language === 'es' ? 'Límite máximo de descuento que el Agente de Ventas puede conceder para retención.' : 'Maximum discount or commercial credit that Sales Agent can autonomously offer without CFO approval.',
        enabled: true,
        type: 'percentage',
        value: 7.5,
        unit: '%',
        category: 'treasury'
      },
      {
        id: 'inv_proof_intent_bank',
        name: language === 'pt' ? 'Bloqueio_Troca_Conta_Nao_Homologada' : language === 'es' ? 'Bloqueo_Cambio_Cuenta_No_Homologada' : 'Lock_Unverified_Bank_Account_Updates',
        description: language === 'pt' ? 'Dispara quarentena instantânea se houver solicitação de alteração de domicílio bancário ou PIX por canal não assinado.' : language === 'es' ? 'Dispara cuarentena instantánea ante solicitudes de cambio bancario por canales no firmados.' : 'Triggers immediate zero-trust quarantine upon wire / banking destination changes received via unverified channels.',
        enabled: true,
        type: 'boolean',
        value: true,
        unit: 'Zero-Trust Gate',
        category: 'security'
      }
    ]
  );

  // Approvers list state
  const [approvers, setApprovers] = useState<ApproverRoleConfig[]>(
    initialSettings?.approvers || [
      {
        id: 'appr_1',
        roleName: 'CEO (Chief Executive Officer)',
        holderName: 'Roberto Albuquerque',
        email: 'ceo@empresa.com.br',
        keyId: 'secp256k1::0x7F4A...E19B',
        requiredForCritical: true,
        active: true
      },
      {
        id: 'appr_2',
        roleName: 'CFO (Chief Financial Officer)',
        holderName: 'Mariana Duarte',
        email: 'cfo@empresa.com.br',
        keyId: 'secp256k1::0x2C9B...884A',
        requiredForCritical: true,
        active: true
      },
      {
        id: 'appr_3',
        roleName: 'COO (Chief Operating Officer)',
        holderName: 'Carlos Eduardo Mendes',
        email: 'coo@empresa.com.br',
        keyId: 'secp256k1::0x9A8F...6A12',
        requiredForCritical: false,
        active: true
      },
      {
        id: 'appr_4',
        roleName: 'DPO & Compliance Officer',
        holderName: 'Helena Fontes',
        email: 'compliance@empresa.com.br',
        keyId: 'secp256k1::0x4E11...33F0',
        requiredForCritical: false,
        active: true
      }
    ]
  );

  // WhatsApp Business API Governance Config State
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppGovernanceConfig>(
    initialSettings?.whatsappAlertConfig || INITIAL_DEFAULT_WHATSAPP_CONFIG
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleInvariant = (id: string) => {
    setInvariants(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, enabled: !inv.enabled } : inv))
    );
  };

  const updateInvariantValue = (id: string, newVal: any) => {
    setInvariants(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, value: newVal } : inv))
    );
  };

  const toggleApprover = (id: string) => {
    setApprovers(prev =>
      prev.map(appr => (appr.id === id ? { ...appr, active: !appr.active } : appr))
    );
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onSaveSettings({
      maxAutonomousBudgetBrl: maxAutonomousBudget,
      multiSigQuorumCount: multiSigQuorum,
      strictProofOfIntent,
      autoQuarantineSuspiciousEvents: autoQuarantine,
      fiscalJurisdiction: activeJurisdiction,
      approvers,
      invariants,
      whatsappAlertConfig: whatsappConfig
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  return (
    <div id="governance-panel-root" className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header & Save Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 font-bold">
              Hard Governance & Risk Boundary
            </span>
            <span className="text-xs text-slate-400 font-mono">Secp256k1 Multi-Sig Invariants</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[var(--vx-neon)]" />
            <span>{t.governanceTitle}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            {t.governanceSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('api_keys_config')}
              className="px-3.5 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-bold text-cyan-300 transition-colors cursor-pointer flex items-center gap-2"
              title="Abrir aba de configurações de chaves de API e integrações"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Configurações de APIs</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-900 text-xs font-bold text-slate-300 transition-colors cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.backToDashboard}</span>
          </button>

          <button
            id="btn-save-governance"
            type="button"
            onClick={handleSave}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
              savedSuccess
                ? 'bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-300'
                : 'bg-gradient-to-r from-[var(--vx-neon)] to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-[var(--vx-neon)]/20'
            }`}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{language === 'pt' ? '✓ Diretrizes Salvas com Sucesso!' : language === 'es' ? '¡Directrices Guardadas!' : 'Guidelines Saved Successfully!'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-slate-950" />
                <span>{t.saveGuidelines}</span>
              </>
            )}
          </button>
        </div>

        {/* Floating Non-Intrusive Success Toast Overlay (Does not shift DOM layout) */}
        {savedSuccess && (
          <div className="absolute -bottom-4 left-6 right-6 md:left-auto md:right-6 md:w-auto p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              {language === 'pt' 
                ? 'Diretrizes de governança, limites fiscais e invariantes gravados no Ledger com sucesso.'
                : language === 'es'
                ? 'Directrices de gobernanza e invariantes grabados en el Ledger con éxito.'
                : 'Governance guidelines and risk invariants recorded to Ledger successfully.'}
            </span>
          </div>
        )}
      </div>

      {/* Main Governance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Autonomous Risk Cap & Multi-Sig Settings */}
        <div className="space-y-6">
          
          {/* Card 1: Risk Budget Slider */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[var(--vx-neon)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  {t.maxAutonomousBudget}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Zero-Human Gate</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--vx-neon)] font-mono">
                  {formatCurrency(maxAutonomousBudget, currency, language)}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {language === 'pt' ? 'Teto por Incidente' : language === 'es' ? 'Límite por Incidente' : 'Cap per Incident'}
                </span>
              </div>

              <input
                type="range"
                min={5000}
                max={250000}
                step={5000}
                value={maxAutonomousBudget}
                onChange={(e) => setMaxAutonomousBudget(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--vx-neon)]"
              />

              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>{formatCurrency(5000, currency, language)}</span>
                <span>{formatCurrency(100000, currency, language)}</span>
                <span>{formatCurrency(250000, currency, language)}</span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                {language === 'pt'
                  ? 'Ações de mitigação (reembolsos, spot buys, penalidades) abaixo deste teto são executadas de forma 100% autônoma pelo AOS sem requerer assinatura humana.'
                  : language === 'es'
                  ? 'Las acciones de mitigación por debajo de este límite se ejecutan de forma 100% autónoma sin requerir firma humana.'
                  : 'Mitigation actions below this threshold are executed 100% autonomously by AOS without requiring human sign-off.'}
              </p>
            </div>
          </div>

          {/* Card 2: Multi-Sig Quorum */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  {t.multiSigQuorum}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">k-of-n Multi-Sig</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setMultiSigQuorum(q)}
                    className={`flex-1 py-2.5 rounded-xl font-mono font-bold text-sm transition-all cursor-pointer ${
                      multiSigQuorum === q
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q} of 4
                  </button>
                ))}
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Strict Proof-of-Intent:</span>
                  <button
                    type="button"
                    onClick={() => setStrictProofOfIntent(!strictProofOfIntent)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      strictProofOfIntent ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {strictProofOfIntent ? t.active : t.inactive}
                  </button>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Auto-Quarentena Anti-Fraude:</span>
                  <button
                    type="button"
                    onClick={() => setAutoQuarantine(!autoQuarantine)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      autoQuarantine ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {autoQuarantine ? t.active : t.inactive}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2.5: Adaptive Thresholds AI Engine */}
          <div className="bg-[var(--vx-deep)] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Thresholds Adaptativos (IA)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                Auto-Calibração
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recalcula automaticamente limites de caixa mínimo, quóruns e tetos de autonomia com base na volatilidade de mercado (CDI, SELIC, inflação setorial e histórico D+0).
              </p>

              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">Colchão de Liquidez Dinâmico</span>
                    <span className="text-[10px] text-slate-400">Ajusta reserva conforme taxa SELIC/CDI</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    ATIVO (+12% Buffer)
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200 block">Teto Spot Anti-Volatilidade</span>
                    <span className="text-[10px] text-slate-400">Restringe descontos em períodos de alta inflação</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    AUTO (Máx 4.5%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Developer Super-Admin Access Simulator (Mock Context) */}
          <div className="bg-[var(--vx-deep)] border border-violet-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Modo Desenvolvedor / Multi-Tenant
                </h2>
              </div>
              <span className="text-[10px] font-mono text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded border border-violet-800/60">
                PROTÓTIPO
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Como este ambiente é uma simulação de frontend no AI Studio sem autenticação de rede, você pode alternar o papel do usuário para inspecionar a gestão global de Tenants, mapas e métricas financeiras.
              </p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Acesso Super-Admin</span>
                  <span className="text-[10px] text-slate-500 font-mono">Habilita a rota e menu /super-admin</span>
                </div>
                <DeveloperSuperAdminToggle />
              </div>
            </div>
          </div>

        </div>

        {/* Middle & Right Column: Invariants, Multi-Jurisdiction Tax & Key Ring */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Active Logical Invariants */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--vx-neon)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  {t.activeInvariants}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[var(--vx-neon)]">
                {invariants.filter(i => i.enabled).length} / {invariants.length} {t.active}
              </span>
            </div>

            <div className="space-y-3">
              {invariants.map((inv) => (
                <div
                  key={inv.id}
                  className={`p-4 rounded-xl border transition-all ${
                    inv.enabled 
                      ? 'bg-slate-950 border-slate-800 hover:border-[var(--vx-neon)]/40' 
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100 font-mono">{getInvariantName(inv.id, language, inv.name)}</span>
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                          inv.category === 'treasury' ? 'bg-teal-950 text-teal-300 border-teal-800' :
                          inv.category === 'security' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                          inv.category === 'risk' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                          'bg-blue-950 text-blue-300 border-blue-800'
                        }`}>
                          {inv.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-xl">
                        {getInvariantDescription(inv.id, language, inv.description)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => toggleInvariant(inv.id)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-colors cursor-pointer ${
                          inv.enabled ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {inv.enabled ? t.active : t.inactive}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{t.threshold}</span>
                    
                    {inv.type === 'boolean' ? (
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {inv.value ? 'ENFORCE_ZERO_TRUST = TRUE' : 'DISABLED'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={inv.value as number}
                          disabled={!inv.enabled}
                          onChange={(e) => updateInvariantValue(inv.id, Number(e.target.value))}
                          className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-[var(--vx-neon)] font-mono text-right focus:outline-none focus:border-[var(--vx-neon)] disabled:opacity-50"
                        />
                        <span className="text-xs font-mono text-slate-400">{getInvariantUnit(inv.id, language, inv.unit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generalized Multi-Jurisdiction Fiscal Motor Card (BR, US, EU) */}
          <div className="pt-2">
            <GlobalTaxEngineCard 
              jurisdiction={activeJurisdiction}
              onChangeJurisdiction={handleJurisdictionChange}
              language={language} 
              currency={currency} 
              onAuditFiscalInvariants={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 3500);
              }}
            />
          </div>

          {/* Multi-Sig Approvers Key Ring */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--vx-neon)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  {t.multiSigApprovers}
                </h2>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Secp256k1 Key Ring
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {approvers.map((appr) => (
                <div
                  key={appr.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    appr.active ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{appr.roleName}</span>
                        {appr.requiredForCritical && (
                          <span className="text-[9px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-800/60 px-1.5 py-0.2 rounded">
                            {t.mandatory}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1 font-medium">{appr.holderName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{appr.email}</div>
                    </div>

                    <button
                      onClick={() => toggleApprover(appr.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        appr.active ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {appr.active ? t.active : t.inactive}
                    </button>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-amber-400" /> {appr.keyId}
                    </span>
                    <span className="text-[var(--vx-neon)]">{t.verifiedKey}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* WhatsApp Business API Zero-Trust Lockdown Module */}
      <div className="pt-2">
        <WhatsAppGovernanceCard
          config={whatsappConfig}
          onChangeConfig={setWhatsappConfig}
          language={language}
        />
      </div>

      {/* Tenant User Management & RBAC Permissions Directory */}
      <div className="pt-2">
        <TenantUserManagementPanel
          onAddAuditRecord={onAddAuditRecord}
          onNavigateTab={onNavigateTab}
        />
      </div>

    </div>
  );
};
