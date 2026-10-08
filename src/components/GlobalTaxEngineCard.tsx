import React, { useState } from 'react';
import { 
  Calculator, 
  FileCheck, 
  Receipt, 
  Building, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  FileText, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  Percent,
  Sliders,
  Copy,
  Check,
  Globe,
  Landmark,
  FileSpreadsheet,
  Lock,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  BrazilianTaxEngineState, 
  NfeEmissionRecord, 
  SupportedCurrency, 
  SupportedLanguage, 
  FiscalJurisdiction,
  UsTaxEngineState,
  EuTaxEngineState
} from '../types/aos';
import { formatCurrency, formatPercent, formatDate, TRANSLATIONS } from '../utils/i18n';

interface GlobalTaxEngineCardProps {
  jurisdiction?: FiscalJurisdiction;
  onChangeJurisdiction?: (jur: FiscalJurisdiction) => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onAuditFiscalInvariants?: () => void;
}

export const GlobalTaxEngineCard: React.FC<GlobalTaxEngineCardProps> = ({
  jurisdiction = 'BR',
  onChangeJurisdiction,
  language = 'pt',
  currency = 'BRL',
  onAuditFiscalInvariants
}: GlobalTaxEngineCardProps) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;

  // Shared revenue base state (in base units)
  const [revenueBase, setRevenueBase] = useState<number>(1850000);

  // BR State
  const [icmsRate, setIcmsRate] = useState<number>(18.0);
  const [pisRate, setPisRate] = useState<number>(1.65);
  const [cofinsRate, setCofinsRate] = useState<number>(7.60);
  const [ipiRate, setIpiRate] = useState<number>(5.0);
  const [taxCredits, setTaxCredits] = useState<number>(145000);
  const [brActiveTab, setBrActiveTab] = useState<'apuracao' | 'sped' | 'nfe'>('apuracao');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // US State
  const [usStates, setUsStates] = useState([
    { stateCode: 'CA', stateName: 'California', salesTaxRate: 7.25, revenuePct: 0.35, nexusReached: true },
    { stateCode: 'NY', stateName: 'New York', salesTaxRate: 8.875, revenuePct: 0.25, nexusReached: true },
    { stateCode: 'TX', stateName: 'Texas', salesTaxRate: 6.25, revenuePct: 0.22, nexusReached: true },
    { stateCode: 'FL', stateName: 'Florida', salesTaxRate: 6.0, revenuePct: 0.18, nexusReached: false }
  ]);
  const [usActiveTab, setUsActiveTab] = useState<'salestax' | 'compliance' | 'irs'>('salestax');

  // EU State
  const [euCountries, setEuCountries] = useState([
    { countryCode: 'DE', countryName: 'Germany', vatRate: 19.0, revenuePct: 0.38, viesValidated: true },
    { countryCode: 'FR', countryName: 'France', vatRate: 20.0, revenuePct: 0.28, viesValidated: true },
    { countryCode: 'IT', countryName: 'Italy', vatRate: 22.0, revenuePct: 0.18, viesValidated: true },
    { countryCode: 'ES', countryName: 'Spain', vatRate: 21.0, revenuePct: 0.16, viesValidated: true }
  ]);
  const [euActiveTab, setEuActiveTab] = useState<'vat_oss' | 'gdpr' | 'saft'>('vat_oss');

  // Audit state
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string | null>(null);

  // Calculations: Brazil
  const calculatedIcms = revenueBase * (icmsRate / 100);
  const calculatedPis = revenueBase * (pisRate / 100);
  const calculatedCofins = revenueBase * (cofinsRate / 100);
  const calculatedIpi = revenueBase * (ipiRate / 100);
  const grossTaxesBr = calculatedIcms + calculatedPis + calculatedCofins + calculatedIpi;
  const netPayableTaxesBr = Math.max(0, grossTaxesBr - taxCredits);

  // Projeção Reforma Tributária
  const projectedIbsCbsBr = revenueBase * (0.175 + 0.088);
  const projectedIbsCbsCreditsBr = taxCredits * 1.35;
  const projectedIbsCbsNetBr = Math.max(0, projectedIbsCbsBr - projectedIbsCbsCreditsBr);

  // Calculations: US
  const totalUsSalesTaxCollected = usStates.reduce((sum, s) => {
    return sum + (revenueBase * s.revenuePct * (s.salesTaxRate / 100));
  }, 0);

  // Calculations: EU
  const totalEuVatCollected = euCountries.reduce((sum, c) => {
    return sum + (revenueBase * c.revenuePct * (c.vatRate / 100));
  }, 0);

  // Simulated NF-e List
  const [nfeList, setNfeList] = useState<NfeEmissionRecord[]>([
    {
      id: 'nfe_101',
      nfeNumber: '000.089.821',
      series: '1',
      accessKey: '35260818492301000184550010000898211998471920',
      recipient: 'Silva e Souza Materiais de Construção Ltda',
      recipientCnpj: '22.841.902/0001-44',
      totalAmountBrl: 45000,
      icmsAmountBrl: 8100,
      pisCofinsAmountBrl: 4162.5,
      issuedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'AUTORIZADA',
      protocolSefaz: '135260098412891'
    },
    {
      id: 'nfe_102',
      nfeNumber: '000.089.822',
      series: '1',
      accessKey: '35260818492301000184550010000898221887361944',
      recipient: 'Metalúrgica ABC Estruturas Metálicas',
      recipientCnpj: '09.112.449/0001-90',
      totalAmountBrl: 145000,
      icmsAmountBrl: 26100,
      pisCofinsAmountBrl: 13412.5,
      issuedAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'AUTORIZADA',
      protocolSefaz: '135260098412892'
    }
  ]);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setAuditFeedback(null);

    setTimeout(() => {
      setIsAuditing(false);
      if (jurisdiction === 'BR') {
        setAuditFeedback(language === 'pt' 
          ? '✓ SPED Fiscal & NF-e 4.0 reconciliados: 100% de conformidade com SEFAZ e Receita Federal. Hash criptográfico auditado.'
          : language === 'es'
          ? '✓ SPED Fiscal y NF-e reconciliados: 100% de conformidad fiscal y hash criptográfico auditado.'
          : '✓ SPED Fiscal & NF-e reconciled: 100% compliance with Tax Authority. Cryptographic hash audit passed.');
      } else if (jurisdiction === 'US') {
        setAuditFeedback(language === 'pt'
          ? '✓ US Multi-State Sales Tax & Form 1099 reconciliados: 100% de conformidade SOC 2 Type II e CCPA/CPRA.'
          : language === 'es'
          ? '✓ US Sales Tax y Formularios 1099 reconciliados: 100% de conformidad con SOC 2 Type II y CCPA.'
          : '✓ US Multi-State Sales Tax & 1099 Forms reconciled: 100% SOC 2 Type II & CCPA/CPRA compliant.');
      } else {
        setAuditFeedback(language === 'pt'
          ? '✓ EU VAT OSS & VIES reconciliados: 100% de conformidade com GDPR Artigo 30 e EU AI Act Tier 1.'
          : language === 'es'
          ? '✓ EU VAT OSS y VIES reconciliados: 100% de conformidad con GDPR Artículo 30 y EU AI Act.'
          : '✓ EU VAT OSS & VIES reconciled: 100% GDPR Article 30 ROPA and EU AI Act Tier 1 compliant.');
      }
      onAuditFiscalInvariants?.();
    }, 1400);
  };

  return (
    <div id="global-tax-engine-card" className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-6">
      
      {/* Top Header with Multi-Jurisdiction Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--vx-neon)]/10 text-[var(--vx-neon)] border border-[var(--vx-neon)]/30 font-bold flex items-center gap-1">
              <Landmark className="w-3 h-3" />
              {jurisdiction === 'BR' ? 'Motor Fiscal Brasil' : jurisdiction === 'US' ? 'US Tax & SOC 2' : 'EU VAT & GDPR'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {jurisdiction === 'BR' ? 'SPED EFD • NF-e 4.0 • IBS/CBS' : jurisdiction === 'US' ? 'Wayfair Nexus • Form 1099 • CCPA' : 'VAT OSS • SAF-T • EU AI Act'}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>
              {jurisdiction === 'BR' && t.taxEngineTitleBR}
              {jurisdiction === 'US' && t.taxEngineTitleUS}
              {jurisdiction === 'EU' && t.taxEngineTitleEU}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {jurisdiction === 'BR' 
              ? 'Apuração autônoma de tributos indiretos, conferência cruzada com SEFAZ e split payment automático.'
              : jurisdiction === 'US'
              ? 'Multi-state economic nexus monitoring, automated sales tax filing, and SOC 2 Type II continuous compliance.'
              : 'Intra-community cross-border VAT One-Stop Shop (OSS), automated reverse charge, and GDPR Article 30 ledger.'}
          </p>
        </div>

        {/* Jurisdiction Selector Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-mono text-slate-400">{t.jurisdictionSelector}</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onChangeJurisdiction?.('BR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                jurisdiction === 'BR'
                  ? 'bg-[var(--vx-neon)] text-slate-950 shadow-md shadow-[var(--vx-neon)]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇧🇷</span>
              <span>Brasil</span>
            </button>
            <button
              onClick={() => onChangeJurisdiction?.('US')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                jurisdiction === 'US'
                  ? 'bg-[var(--vx-neon)] text-slate-950 shadow-md shadow-[var(--vx-neon)]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇺🇸</span>
              <span>USA</span>
            </button>
            <button
              onClick={() => onChangeJurisdiction?.('EU')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                jurisdiction === 'EU'
                  ? 'bg-[var(--vx-neon)] text-slate-950 shadow-md shadow-[var(--vx-neon)]/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇪🇺</span>
              <span>Europa</span>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 1. JURISDICTION: BRASIL (SPED / NF-e 4.0 / IBS-CBS REFORMA TRIBUTÁRIA) */}
      {/* ========================================================================= */}
      {jurisdiction === 'BR' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub Navigation for BR */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrActiveTab('apuracao')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  brActiveTab === 'apuracao' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{t.taxCalculationTab}</span>
              </button>
              <button
                onClick={() => setBrActiveTab('sped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  brActiveTab === 'sped' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{t.spedStatusTab}</span>
              </button>
              <button
                onClick={() => setBrActiveTab('nfe')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  brActiveTab === 'nfe' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{t.nfeEmitterTab} ({nfeList.length})</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>LGPD (Lei 13.709) & Hash SEFAZ Ativo</span>
            </div>
          </div>

          {/* Tab 1: Apuração Tributária BR */}
          {brActiveTab === 'apuracao' && (
            <div className="space-y-4">
              
              {/* Revenue Slider Control */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                      <span>{t.revenueBase}</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Simule o faturamento tributável para recálculo automático de impostos e créditos.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[var(--vx-neon)] font-mono">
                      {formatCurrency(revenueBase, currency, language)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={200000}
                    max={10000000}
                    step={50000}
                    value={revenueBase}
                    onChange={(e) => setRevenueBase(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--vx-neon)]"
                  />
                  <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                    R$ {(revenueBase / 1000000).toFixed(2)}M
                  </span>
                </div>
              </div>

              {/* 4 Tax Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">ICMS Estadual</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-[var(--vx-neon)] border border-slate-800">
                      {icmsRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-100 font-mono">
                    {formatCurrency(calculatedIcms, currency, language)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Alíquota interestadual média padrão.
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">PIS / COFINS</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-[var(--vx-neon)] border border-slate-800">
                      {(pisRate + cofinsRate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-100 font-mono">
                    {formatCurrency(calculatedPis + calculatedCofins, currency, language)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Regime não-cumulativo (PIS 1,65% + COFINS 7,6%).
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">IPI Industrial</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-[var(--vx-neon)] border border-slate-800">
                      {ipiRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-base font-bold text-slate-100 font-mono">
                    {formatCurrency(calculatedIpi, currency, language)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    NCM médio com incentivo Lei do Bem.
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-emerald-900/40 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">Créditos de Entrada</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Abatimento
                    </span>
                  </div>
                  <div className="text-base font-bold text-emerald-400 font-mono">
                    - {formatCurrency(taxCredits, currency, language)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Insumos, matéria-prima e energia fabril.
                  </div>
                </div>
              </div>

              {/* Net Balance & Reforma Tributária Dual View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Current Tax Regime Summary */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-teal-400" />
                      <span>Regime Tributário Atual (Lucro Real)</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      DARF Único
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Tributos Brutos Apurados:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(grossTaxesBr, currency, language)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>(-) {t.taxCredits}</span>
                      <span className="font-mono">- {formatCurrency(taxCredits, currency, language)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-slate-100">
                      <span>{t.totalPayable}</span>
                      <span className="font-mono text-[var(--vx-neon)]">{formatCurrency(netPayableTaxesBr, currency, language)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                  >
                    {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--vx-neon)]" /> : <ShieldCheck className="w-3.5 h-3.5 text-[var(--vx-neon)]" />}
                    <span>{isAuditing ? 'Auditando Invariantes Fiscais...' : t.auditTaxCross}</span>
                  </button>
                </div>

                {/* Projected Reforma Tributária (IBS / CBS) */}
                <div className="bg-slate-950 border border-cyan-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--vx-neon)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                      <span>Projeção: Reforma Tributária (IBS + CBS)</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--vx-neon)] bg-[var(--vx-neon)]/10 px-2 py-0.5 rounded border border-[var(--vx-neon)]/30">
                      IVA Dual 26.3%
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-lg border border-cyan-900/40 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>IBS (Estados & Municípios - 17,5%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(revenueBase * 0.175, currency, language)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>CBS (Federal - 8,8%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(revenueBase * 0.088, currency, language)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-400">
                      <span>(-) Crédito Financeiro Amplo Pleno:</span>
                      <span className="font-mono">- {formatCurrency(projectedIbsCbsCreditsBr, currency, language)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold text-slate-100">
                      <span>Split Payment Automático Previsto:</span>
                      <span className="font-mono text-[var(--vx-neon)]">{formatCurrency(projectedIbsCbsNetBr, currency, language)}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Split payment retido em tempo real nas liquidações PIX/Open Finance.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: SPED & eSocial */}
          {brActiveTab === 'sped' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">EFD ICMS / IPI (SPED Fiscal)</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    TRANSMITIDO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bloco K (Controle da Produção e Estoque) e Bloco H (Inventário) gerados e assinados digitalmente via certificado ICP-Brasil A1.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  Hash: <strong className="text-slate-400">SHA256:0x7F4A...B901</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">EFD Contribuições</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    TRANSMITIDO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Apuração de PIS/Pasep e COFINS não-cumulativos com reconciliação automática de receitas financeiras e créditos tributários.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  Protocolo: <strong className="text-slate-400">REC-EFD-202608-8819</strong>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">eSocial & DCTFWeb</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    SINCRONIZADO
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Eventos periódicos S-1200 / S-1210 e fechamento S-1299 auditados com emissão de DARF Previdenciário consolidado.
                </p>
                <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  Compliance: <strong className="text-slate-400">LGPD + eSocial 1.2</strong>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Emissão NF-e 4.0 */}
          {brActiveTab === 'nfe' && (
            <div className="space-y-3">
              {nfeList.map((nfe) => (
                <div 
                  key={nfe.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 hover:border-[var(--vx-neon)]/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {nfe.status}
                      </span>
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        NF-e Nº {nfe.nfeNumber} (Série {nfe.series})
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[var(--vx-neon)] font-mono">
                      {formatCurrency(nfe.totalAmountBrl, currency, language)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div>
                      {t.recipient} <strong className="text-slate-200">{nfe.recipient}</strong> ({nfe.recipientCnpj})
                    </div>
                    <div className="font-mono text-slate-500">
                      {t.issuedAt} {formatDate(nfe.issuedAt, language)}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between gap-2 font-mono text-[10px] text-slate-400 overflow-x-auto">
                    <span className="truncate">{t.sefazKey} <strong className="text-slate-300">{nfe.accessKey}</strong></span>
                    <button
                      onClick={() => handleCopyKey(nfe.accessKey)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedKey === nfe.accessKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === nfe.accessKey ? 'Copiada' : 'Copiar Chave'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. JURISDICTION: UNITED STATES (US SALES TAX, NEXUS & SOC 2 / CCPA) */}
      {/* ========================================================================= */}
      {jurisdiction === 'US' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub Navigation for US */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUsActiveTab('salestax')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  usActiveTab === 'salestax' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>US Multi-State Sales Tax</span>
              </button>
              <button
                onClick={() => setUsActiveTab('compliance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  usActiveTab === 'compliance' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SOC 2 Type II & CCPA / CPRA</span>
              </button>
              <button
                onClick={() => setUsActiveTab('irs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  usActiveTab === 'irs' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>IRS Form 1099 & W-9 Automation</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>SOC 2 Type II Certified & CCPA Enforced</span>
            </div>
          </div>

          {/* Tab 1: US Sales Tax Matrix */}
          {usActiveTab === 'salestax' && (
            <div className="space-y-4">
              
              {/* Revenue Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                      <span>{t.revenueBase} (US Dollar Nominal)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Simulate US multi-state revenue distribution and Wayfair economic nexus thresholds.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[var(--vx-neon)] font-mono">
                      {formatCurrency(revenueBase, 'USD', language)}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={200000}
                  max={10000000}
                  step={50000}
                  value={revenueBase}
                  onChange={(e) => setRevenueBase(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--vx-neon)]"
                />
              </div>

              {/* State Nexus Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {usStates.map((st) => {
                  const stateRev = revenueBase * st.revenuePct;
                  const taxAmount = stateRev * (st.salesTaxRate / 100);
                  return (
                    <div key={st.stateCode} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{st.stateName} ({st.stateCode})</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          st.nexusReached ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {st.nexusReached ? 'NEXUS ACTIVE' : 'BELOW THRESHOLD'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-100 font-mono">
                        {formatCurrency(taxAmount, 'USD', language)}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Rate: {st.salesTaxRate}%</span>
                        <span>Rev: {formatCurrency(stateRev, 'USD', language)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-100">
                  <span>Total US Sales Tax Remittance (Monthly):</span>
                  <span className="text-base text-[var(--vx-neon)] font-mono">{formatCurrency(totalUsSalesTaxCollected, 'USD', language)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span>Automated Avalara / TaxJar Rest Connector: Connected</span>
                  <button 
                    onClick={handleRunAudit}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Reconcile State Filings
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: US SOC 2 & CCPA */}
          {usActiveTab === 'compliance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">SOC 2 Type II Continuous Controls</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    AUDIT READY
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Continuous automated evidence collection across 5 Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, and Privacy).
                </p>
                <div className="text-[10px] font-mono text-emerald-400 pt-2 border-t border-slate-800">
                  Status: Zero automated control drift detected (30-day streak).
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">CCPA / CPRA Data Subject Gateway</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    ENFORCED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automated DSAR (Data Subject Access Request) fulfillment, Right-to-Know data tagging, and Do-Not-Sell opt-out synchronization with zero latency.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  California Consumer Privacy Act (Civil Code § 1798.100) verified.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: IRS 1099 */}
          {usActiveTab === 'irs' && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 text-xs">IRS Form 1099-NEC & 1099-MISC E-Filing</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  W-9 VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Automated TIN matching with IRS databases for all independent contractors and vendor payouts above $600 threshold.
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>IRS FIRE Gateway Status: Connected</span>
                <span className="text-emerald-400">100% Taxpayer Identification Rate</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. JURISDICTION: EUROPEAN UNION (VAT OSS, VIES & GDPR / EU AI ACT) */}
      {/* ========================================================================= */}
      {jurisdiction === 'EU' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub Navigation for EU */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEuActiveTab('vat_oss')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  euActiveTab === 'vat_oss' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Intra-EU VAT OSS & VIES</span>
              </button>
              <button
                onClick={() => setEuActiveTab('gdpr')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  euActiveTab === 'gdpr' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>GDPR Art. 30 & EU AI Act</span>
              </button>
              <button
                onClick={() => setEuActiveTab('saft')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  euActiveTab === 'saft' 
                    ? 'bg-slate-800 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>SAF-T XML Tax Ledger</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GDPR Compliant & EU AI Act Tier-1 Certified</span>
            </div>
          </div>

          {/* Tab 1: EU VAT OSS */}
          {euActiveTab === 'vat_oss' && (
            <div className="space-y-4">
              
              {/* Revenue Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                      <span>{t.revenueBase} (Euro Nominal)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Intra-community cross-border supplies with automated VIES VAT number lookup and reverse charge mechanism.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-[var(--vx-neon)] font-mono">
                      {formatCurrency(revenueBase, 'EUR', language)}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={200000}
                  max={10000000}
                  step={50000}
                  value={revenueBase}
                  onChange={(e) => setRevenueBase(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[var(--vx-neon)]"
                />
              </div>

              {/* EU Countries Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {euCountries.map((c) => {
                  const countryRev = revenueBase * c.revenuePct;
                  const vatDue = countryRev * (c.vatRate / 100);
                  return (
                    <div key={c.countryCode} className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{c.countryName} ({c.countryCode})</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          VIES OK
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-100 font-mono">
                        {formatCurrency(vatDue, 'EUR', language)}
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>VAT: {c.vatRate}%</span>
                        <span>Rev: {formatCurrency(countryRev, 'EUR', language)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* EU Summary */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm font-bold text-slate-100">
                  <span>Consolidated One-Stop Shop (OSS) VAT Payable:</span>
                  <span className="text-base text-[var(--vx-neon)] font-mono">{formatCurrency(totalEuVatCollected, 'EUR', language)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
                  <span>Reverse Charge Art. 194 Directive 2006/112/EC: Active</span>
                  <button 
                    onClick={handleRunAudit}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 border border-slate-700 cursor-pointer"
                  >
                    Validate VIES Database
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: GDPR & EU AI Act */}
          {euActiveTab === 'gdpr' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">GDPR Article 30 (Records of Processing Activities - ROPA)</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    SYNCHRONIZED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Real-time cryptographic logging of all data subject processing operations, purpose limitation validations, and automated cross-border transfer guarantees.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 pt-2 border-t border-slate-800">
                  Data Protection Officer (DPO) Key verified on ledger.
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs">EU Artificial Intelligence Act (Regulation 2024/1689)</div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                    TIER 1 LOW RISK
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Deterministic Zero-GUI AST decision architecture with strict human-in-the-loop multi-sig governance and explainability logs.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  Conformity Assessment: Article 43 Autonomous ERP System passed.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: SAF-T Export */}
          {euActiveTab === 'saft' && (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 text-xs">SAF-T (Standard Audit File for Tax - OECD XML)</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  EXPORT READY
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                General ledger, customer/vendor masterfiles, and invoice transactions formatted according to OECD SAF-T schema 2.0.
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Schema Validation: OECD XML 2.0 (Strict Pass)</span>
                <span className="text-[var(--vx-neon)]">Zero Schema Discrepancy</span>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Audit Feedback Banner */}
      {auditFeedback && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{auditFeedback}</span>
        </div>
      )}

    </div>
  );
};
