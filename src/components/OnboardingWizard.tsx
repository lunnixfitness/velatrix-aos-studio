import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Check, 
  Loader2, 
  Sparkles, 
  Server, 
  MessageSquare, 
  Landmark, 
  Database, 
  Activity, 
  Lock, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Globe
} from 'lucide-react';
import { IndustrySector, TenantProfile, EnterpriseKnowledgeGraph, SupportedLanguage, SupportedCurrency, FiscalJurisdiction } from '../types/aos';
import { TRANSLATIONS } from '../utils/i18n';
import { VelatrixLogo } from './VelatrixLogo';

interface OnboardingWizardProps {
  onCompleteOnboarding: (tenant: TenantProfile, initialGraph?: EnterpriseKnowledgeGraph) => void;
  onCancel: () => void;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onCompleteOnboarding,
  onCancel,
  language = 'pt',
  currency = 'BRL'
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.pt;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [companyName, setCompanyName] = useState('Nexus Indústria & Manufatura S/A');
  const [cnpj, setCnpj] = useState('18.492.301/0001-84');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<FiscalJurisdiction>('BR');
  const [selectedSector, setSelectedSector] = useState<IndustrySector>('manufacturing');
  const [minCashReserve, setMinCashReserve] = useState('2000000');

  // Connectors State
  const [connectors, setConnectors] = useState({
    erp: {
      type: 'TOTVS Protheus (ADVPL / REST / Webhook)',
      connected: true,
      syncEntities: 1420,
      latency: '24ms'
    },
    whatsapp: {
      type: 'WhatsApp Business API (Z-API / Gupshup)',
      connected: true,
      verifiedNumbers: 3,
      latency: '45ms'
    },
    banking: {
      type: 'Open Finance Core Banking (Pluggy / BACEN)',
      connected: true,
      accountsLinked: 4,
      latency: '18ms'
    },
    crm: {
      type: 'HubSpot / Salesforce B2B',
      connected: false,
      syncEntities: 0,
      latency: '-'
    }
  });

  // Discovery Simulation State (Step 3)
  const [discoveryProgress, setDiscoveryProgress] = useState(0);
  const [discoveryLogs, setDiscoveryLogs] = useState<string[]>([]);
  const [discoveredNodesCount, setDiscoveredNodesCount] = useState(0);

  // Sector Presets
  const sectorPresets = [
    {
      id: 'manufacturing' as IndustrySector,
      title: language === 'pt' ? 'Indústria & Manufatura' : language === 'es' ? 'Industria y Manufactura' : 'Manufacturing & Industry',
      standard: 'ISO 9001 / IATF 16949 / OEE',
      icon: '🏭',
      description: language === 'pt' ? 'Foco em cadeia de suprimentos, manutenção preditiva, estoque de segurança e controle de paradas de linha.' : language === 'es' ? 'Enfoque en cadena de suministro, mantenimiento predictivo y control de producción.' : 'Focus on supply chain continuity, predictive maintenance, safety stock and line stoppage mitigation.'
    },
    {
      id: 'retail' as IndustrySector,
      title: language === 'pt' ? 'Varejo & E-Commerce Omnichannel' : language === 'es' ? 'Comercio Minorista y E-Commerce' : 'Retail & Omnichannel Commerce',
      standard: 'PCI-DSS / SLA B2C / NPS',
      icon: '🛒',
      description: language === 'pt' ? 'Foco em gestão de demanda, conciliação de recebíveis, fulfillment de pedidos e prevenção de churn.' : language === 'es' ? 'Enfoque en gestión de demanda, conciliación de pagos y fulfillment de pedidos.' : 'Focus on real-time demand peaks, payment gateway reconciliation, order fulfillment and churn prevention.'
    },
    {
      id: 'healthcare' as IndustrySector,
      title: language === 'pt' ? 'Saúde, Farma & Hospitais' : language === 'es' ? 'Salud, Farma y Hospitales' : 'Healthcare, Pharma & Life Sciences',
      standard: 'ANVISA RDC / FDA 21 CFR / HIPAA',
      icon: '🏥',
      description: language === 'pt' ? 'Foco em cadeia de frio de medicamentos, rastreabilidade de lotes, esterilização e prontuário seguro.' : language === 'es' ? 'Enfoque en cadena de frío de fármacos, trazabilidad de lotes y normativas médicas.' : 'Focus on pharmaceutical cold chain integrity, batch track-and-trace, sterile supplies and regulatory audits.'
    },
    {
      id: 'services' as IndustrySector,
      title: language === 'pt' ? 'Serviços Corporativos & B2B Tech' : language === 'es' ? 'Servicios Corporativos y B2B Tech' : 'Corporate Services & B2B Tech',
      standard: 'SOC 2 Type II / SLA 99.99%',
      icon: '🏢',
      description: language === 'pt' ? 'Foco em faturamento recorrente (MRR), alocação de squads, margem por projeto e acordos de nível de serviço.' : language === 'es' ? 'Enfoque en facturación recurrente (MRR), asignación de equipos y márgenes de proyectos.' : 'Focus on recurring billing (MRR), squad capacity allocation, project gross margins and stringent enterprise SLAs.'
    }
  ];

  const handleSelectSector = (sectorId: IndustrySector) => {
    setSelectedSector(sectorId);
  };

  const toggleConnector = (key: keyof typeof connectors) => {
    setConnectors(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        connected: !prev[key].connected
      }
    }));
  };

  useEffect(() => {
    if (currentStep === 3) {
      setDiscoveryProgress(10);
      setDiscoveryLogs([`[BOOTSTRAP] Iniciando handshake com conector ${connectors.erp.type}...`]);
      setDiscoveredNodesCount(0);

      const t1 = setTimeout(() => {
        setDiscoveryProgress(28);
        setDiscoveryLogs(prev => [
          ...prev,
          `[ERP AUTODISCOVERY] Mapeadas contas contábeis e fiscais para jurisdição ${selectedJurisdiction}. Saldo de tesouraria consolidado auditado.`
        ]);
        setDiscoveredNodesCount(2);
      }, 700);

      const t2 = setTimeout(() => {
        setDiscoveryProgress(55);
        setDiscoveryLogs(prev => [
          ...prev,
          `[SUPPLIERS] Identificados 12 fornecedores Tier-1 com certificação ativa. Criando arestas de abastecimento no Grafo.`
        ]);
        setDiscoveredNodesCount(6);
      }, 1400);

      const t3 = setTimeout(() => {
        setDiscoveryProgress(82);
        setDiscoveryLogs(prev => [
          ...prev,
          `[SECURITY GUARD] Domicílios bancários e chaves homologadas indexadas na Whitelist Proof of Intent.`
        ]);
        setDiscoveredNodesCount(9);
      }, 2100);

      const t4 = setTimeout(() => {
        setDiscoveryProgress(100);
        setDiscoveryLogs(prev => [
          ...prev,
          `[AOS ONLINE] Grafo Semântico de Conhecimento inicializado com sucesso. Enxame de agentes pronto para deliberar.`
        ]);
        setDiscoveredNodesCount(12);
      }, 2800);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [currentStep, selectedJurisdiction]);

  const handleFinish = () => {
    const preset = sectorPresets.find(p => p.id === selectedSector)!;
    const profile: TenantProfile = {
      id: `tenant_${Date.now()}`,
      name: companyName,
      slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      cnpj: cnpj,
      jurisdiction: selectedJurisdiction,
      country: selectedJurisdiction === 'BR' ? 'Brasil' : selectedJurisdiction === 'US' ? 'United States' : 'European Union',
      sector: selectedSector,
      sectorLabel: preset.title,
      regulatoryStandard: preset.standard,
      connectedErp: connectors.erp.type,
      connectedChannels: (Object.values(connectors) as Array<{ type: string; connected: boolean }>)
        .filter(v => v.connected)
        .map(v => v.type),
      createdAt: new Date().toISOString()
    };

    onCompleteOnboarding(profile);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Wizard Header Banner */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <VelatrixLogo variant="capsule" />
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Multi-Tenant Provisioning
              </span>
              <span className="text-xs text-slate-400 font-mono">Setup em ~3 minutos</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {t.onboardingTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {t.onboardingSubtitle}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {t.backToDashboard}
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 pt-6 border-t border-slate-800/80">
          
          {/* Step 1 */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            currentStep === 1 
              ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)]/60 text-[var(--vx-neon)]' 
              : currentStep > 1 
              ? 'bg-slate-950 border-emerald-800/60 text-emerald-400' 
              : 'bg-slate-950/60 border-slate-800 text-slate-500'
          }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep > 1 ? 'bg-emerald-900 text-emerald-300' : currentStep === 1 ? 'bg-[var(--vx-neon)] text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}>
              {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{t.step1}</div>
              <div className="text-xs font-bold truncate">{language === 'pt' ? 'Perfil & Jurisdição' : language === 'es' ? 'Perfil y Jurisdicción' : 'Profile & Jurisdiction'}</div>
            </div>
          </div>

          {/* Step 2 */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            currentStep === 2 
              ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)]/60 text-[var(--vx-neon)]' 
              : currentStep > 2 
              ? 'bg-slate-950 border-emerald-800/60 text-emerald-400' 
              : 'bg-slate-950/60 border-slate-800 text-slate-500'
          }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep > 2 ? 'bg-emerald-900 text-emerald-300' : currentStep === 2 ? 'bg-[var(--vx-neon)] text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}>
              {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{t.step2}</div>
              <div className="text-xs font-bold truncate">{language === 'pt' ? 'Conectores & Canais' : language === 'es' ? 'Conectores y Canales' : 'Connectors & Channels'}</div>
            </div>
          </div>

          {/* Step 3 */}
          <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
            currentStep === 3 
              ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)]/60 text-[var(--vx-neon)]' 
              : 'bg-slate-950/60 border-slate-800 text-slate-500'
          }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              currentStep === 3 ? 'bg-[var(--vx-neon)] text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
            }`}>
              3
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">{t.step3}</div>
              <div className="text-xs font-bold truncate">{language === 'pt' ? 'Auto-Descoberta' : language === 'es' ? 'Auto-Descubrimiento' : 'Discovery Engine'}</div>
            </div>
          </div>

        </div>
      </div>

      {/* STEP 1: Company Profile, Fiscal Jurisdiction & Sector Selection */}
      {currentStep === 1 && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200 shadow-2xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[var(--vx-neon)]" /> {t.companyName}
              </h2>
              <p className="text-xs text-slate-400">Identificação societária, jurisdição fiscal e padrão de governança.</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">1 de 3</span>
          </div>

          {/* Country & Fiscal Jurisdiction Selection (Requirement 4 & 6) */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[var(--vx-neon)]" />
              <span>{t.countryJurisdiction}</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: 'BR' as FiscalJurisdiction,
                  flag: '🇧🇷',
                  name: 'Brasil',
                  desc: 'SPED Fiscal, NF-e 4.0, Reforma Tributária (IBS/CBS) & LGPD',
                  badge: 'LGPD OK'
                },
                {
                  id: 'US' as FiscalJurisdiction,
                  flag: '🇺🇸',
                  name: 'United States',
                  desc: 'Multi-State Sales Tax Nexus, Form 1099, SOC 2 Type II & CCPA',
                  badge: 'SOC 2 & CCPA OK'
                },
                {
                  id: 'EU' as FiscalJurisdiction,
                  flag: '🇪🇺',
                  name: 'European Union',
                  desc: 'Intra-EU VAT OSS, VIES Validation, SAF-T Ledger & GDPR',
                  badge: 'GDPR & AI Act OK'
                }
              ].map((jur) => {
                const isSelected = selectedJurisdiction === jur.id;
                return (
                  <div
                    key={jur.id}
                    onClick={() => setSelectedJurisdiction(jur.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)] ring-1 ring-[var(--vx-neon)] shadow-lg shadow-[var(--vx-neon)]/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{jur.flag}</span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-100">{jur.name}</h4>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">{jur.badge}</span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[var(--vx-neon)] bg-[var(--vx-neon)] text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                      {jur.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.companyName}</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Nexus Indústria de Precisão S/A"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-[var(--vx-neon)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">{t.companyDoc}</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00 ou EIN-998877"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-[var(--vx-neon)] transition-colors"
              />
            </div>
          </div>

          {/* Industry Sector Selection Grid */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span>{t.industrySector}</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sectorPresets.map((preset) => {
                const isSelected = selectedSector === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectSector(preset.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-[var(--vx-neon)]/10 border-[var(--vx-neon)] ring-1 ring-[var(--vx-neon)] shadow-lg shadow-[var(--vx-neon)]/10' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{preset.icon}</span>
                        <div>
                          <h3 className="text-xs font-bold text-slate-200">{preset.title}</h3>
                          <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 inline-block mt-0.5">
                            {preset.standard}
                          </span>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-[var(--vx-neon)] bg-[var(--vx-neon)] text-slate-950' : 'border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="bg-[var(--vx-neon)] hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-[var(--vx-neon)]/20 cursor-pointer"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 2: Connectors & Ingestion Channels */}
      {currentStep === 2 && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200 shadow-2xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-[var(--vx-neon)]" /> Conectores de Dados & Webhooks
              </h2>
              <p className="text-xs text-slate-400">
                O AOS se integra passivamente via APIs seguras (mTLS / HMAC) sem necessidade de reescrever seu ERP.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">2 de 3</span>
          </div>

          <div className="space-y-4">
            
            {/* ERP Connector Selection Group */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-950/80 border border-teal-800/80 flex items-center justify-center text-[var(--vx-neon)] shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <span>Conector ERP Primário Homologado</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {connectors.erp.connected ? 'Ativo' : 'Desconectado'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Selecione o ERP da sua empresa. O AOS atua como camada de inteligência e sincronização contínua.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => toggleConnector('erp')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                      connectors.erp.connected
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {connectors.erp.connected ? 'Desconectar' : 'Conectar'}
                  </button>
                </div>
              </div>

              {/* Selectable ERP List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                {[
                  {
                    id: 'totvs_protheus',
                    name: 'TOTVS Protheus',
                    spec: 'ADVPL / REST / Webhook',
                    desc: 'Líder no mercado industrial e serviços no Brasil.',
                    tag: 'Nativo BR'
                  },
                  {
                    id: 'sap_s4hana',
                    name: 'SAP S/4HANA',
                    spec: 'REST / RFC / OData v4',
                    desc: 'Padrão enterprise global e grandes corporações.',
                    tag: 'Global'
                  },
                  {
                    id: 'linx_oms',
                    name: 'Linx OMS & Retail',
                    spec: 'Linx Core API / POS',
                    desc: 'Especialista em varejo, franquias e e-commerce.',
                    tag: 'Varejo BR'
                  },
                  {
                    id: 'senior_sapiens',
                    name: 'Senior Sapiens',
                    spec: 'Senior X Platform / REST',
                    desc: 'Foco em manufatura, agronegócio e logística.',
                    tag: 'Indústria BR'
                  },
                  {
                    id: 'bling_api',
                    name: 'Bling API v3',
                    spec: 'OAuth 2.0 / Webhooks',
                    desc: 'Cloud ERP para PMEs, sellers e distribuidores.',
                    tag: 'Cloud PME'
                  },
                  {
                    id: 'netsuite_erp',
                    name: 'Oracle NetSuite',
                    spec: 'SuiteTalk / REST Web Services',
                    desc: 'ERP em nuvem com suporte multimoeda e US GAAP.',
                    tag: 'Multi-Moeda'
                  }
                ].map((erpOption) => {
                  const isSelected = connectors.erp.type.includes(erpOption.name);
                  return (
                    <div
                      key={erpOption.id}
                      onClick={() => {
                        setConnectors(prev => ({
                          ...prev,
                          erp: {
                            ...prev.erp,
                            type: `${erpOption.name} (${erpOption.spec})`,
                            connected: true,
                            syncEntities: 1420,
                            latency: '22ms'
                          }
                        }));
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-[var(--vx-neon)] shadow-lg shadow-[var(--vx-neon)]/10 ring-1 ring-[var(--vx-neon)]/50'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--vx-neon)]" />}
                          {erpOption.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {erpOption.tag}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight line-clamp-2">
                        {erpOption.desc}
                      </p>
                      <div className="text-[9px] font-mono text-[var(--vx-neon)] mt-2">
                        {erpOption.spec}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Other Channel Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* WhatsApp Connector */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">WhatsApp Business API</span>
                  </div>
                  <button
                    onClick={() => toggleConnector('whatsapp')}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      connectors.whatsapp.connected ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {connectors.whatsapp.connected ? 'Conectado' : 'Conectar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Ingestão semântica de áudios e mensagens operacionais de clientes e fornecedores.
                </p>
              </div>

              {/* Open Finance Banking */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">Open Finance Core Banking</span>
                  </div>
                  <button
                    onClick={() => toggleConnector('banking')}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      connectors.banking.connected ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {connectors.banking.connected ? 'Conectado' : 'Conectar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Leitura de extratos em tempo real, conciliação e liquidação via Proof of Intent.
                </p>
              </div>

            </div>

          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(1)}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.previousStep}</span>
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              className="bg-[var(--vx-neon)] hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-[var(--vx-neon)]/20 cursor-pointer"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: Knowledge Graph Auto-Discovery */}
      {currentStep === 3 && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200 shadow-2xl">
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-[var(--vx-neon)]" /> Auto-Descoberta & Grafo de Conhecimento
              </h2>
              <p className="text-xs text-slate-400">
                O AOS sintetiza e valida os nós e arestas de dependência a partir dos conectores configurados.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">3 de 3</span>
          </div>

          {/* Progress Bar & Telemetry */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2 font-mono">
                {discoveryProgress < 100 ? (
                  <Loader2 className="w-4 h-4 text-[var(--vx-neon)] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>
                  {discoveryProgress < 100 ? 'Sincronizando Grafo Semântico...' : 'Grafo Semântico Pronto & Validado!'}
                </span>
              </span>
              <span className="text-sm font-black text-[var(--vx-neon)] font-mono">{discoveryProgress}%</span>
            </div>

            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${discoveryProgress}%` }}
              />
            </div>

            {/* Simulated Discovery Terminal Log */}
            <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
              {discoveryLogs.map((log, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="text-[var(--vx-neon)] select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={discoveryProgress < 100}
              className="bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 border border-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.previousStep}</span>
            </button>

            <button
              id="btn-complete-onboarding"
              onClick={handleFinish}
              disabled={discoveryProgress < 100}
              className="bg-gradient-to-r from-[var(--vx-neon)] to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-[var(--vx-neon)]/20 disabled:opacity-40 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t.completeProvisioning}</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
