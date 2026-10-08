import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Server,
  Network,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileCheck2,
  Scale,
  Zap,
  DollarSign,
  Briefcase,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  ArrowRight,
  Send,
  Eye,
  SlidersHorizontal,
  Activity,
  Cpu,
  Download,
  Building2,
  Clock,
  Fingerprint
} from 'lucide-react';
import {
  GovConnectorService,
  INITIAL_CERTIFICATES,
  INITIAL_PROXIES,
  INITIAL_ECAC_DECLARATIONS,
  INITIAL_FISCAL_SITUATION,
  INITIAL_PERDCOMPS,
  INITIAL_PGFN_DEBTS,
  INITIAL_CAPAG_HISTORY,
  INITIAL_DET_NOTIFICATIONS,
  INITIAL_SEFAZ_BATCHES,
  INITIAL_BAAS_CONFIG,
  INITIAL_SUBCONF_ACCOUNTS,
  INITIAL_SPLIT_INSTRUCTIONS,
  INITIAL_GOV_AUDIT_LOGS
} from '../../services/govClientService';
import {
  CertificateVaultRecord,
  GovProxyAuthorization,
  PerDcompReceipt,
  BaasSubaccount,
  BaasSplitChargeInstruction,
  GovAuditLedgerEntry,
  MtlsTestResult,
  BaasProvider,
  VaultProvider
} from '../../types/integrationConnectors';
import { SupportedLanguage, SupportedCurrency, TenantProfile } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { VelatrixLogo } from '../VelatrixLogo';

interface GovernmentAndBaasHubProps {
  tenantProfile: TenantProfile;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onBackToDashboard?: () => void;
  onNavigateToPartnerPortal?: () => void;
  onNavigateToTaxRecovery?: () => void;
}

type HubTab = 'vault_a1' | 'rfb_pgfn' | 'det_sefaz' | 'baas_split' | 'security_lgpd';

export const GovernmentAndBaasHub: React.FC<GovernmentAndBaasHubProps> = ({
  tenantProfile,
  language = 'pt',
  currency = 'BRL',
  onBackToDashboard,
  onNavigateToPartnerPortal,
  onNavigateToTaxRecovery
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('vault_a1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // States for interactive live actions
  const [certificates, setCertificates] = useState<CertificateVaultRecord[]>(INITIAL_CERTIFICATES);
  const [proxies, setProxies] = useState<GovProxyAuthorization[]>(INITIAL_PROXIES);
  const [perdcomps, setPerdcomps] = useState<PerDcompReceipt[]>(INITIAL_PERDCOMPS);
  const [subaccounts, setSubaccounts] = useState<BaasSubaccount[]>(INITIAL_SUBCONF_ACCOUNTS);
  const [splitCharges, setSplitCharges] = useState<BaasSplitChargeInstruction[]>(INITIAL_SPLIT_INSTRUCTIONS);
  const [auditLogs, setAuditLogs] = useState<GovAuditLedgerEntry[]>(INITIAL_GOV_AUDIT_LOGS);

  // Testing mTLS state
  const [isTestingMtls, setIsTestingMtls] = useState(false);
  const [mtlsTarget, setMtlsTarget] = useState<'RECEITA_FEDERAL_ECAC' | 'PGFN_REGULARIZE' | 'SEFAZ_NACIONAL_NFE' | 'MTE_DET'>('RECEITA_FEDERAL_ECAC');
  const [selectedCertId, setSelectedCertId] = useState<string>(certificates[0]?.id || 'cert_vault_01');
  const [mtlsResult, setMtlsResult] = useState<MtlsTestResult | null>(null);
  const [mtlsError, setMtlsError] = useState<string | null>(null);

  // PER/DCOMP Modal & Execution
  const [isTransmittingPerdcomp, setIsTransmittingPerdcomp] = useState(false);
  const [perdcompSuccessToast, setPerdcompSuccessToast] = useState<string | null>(null);
  const [perdcompError, setPerdcompError] = useState<string | null>(null);
  const [lastTransmittedReceipt, setLastTransmittedReceipt] = useState<PerDcompReceipt | null>(null);

  // Keep certificate synchronized with the active tenant profile
  useEffect(() => {
    if (tenantProfile && tenantProfile.name) {
      setCertificates(prev => {
        const updated = prev.map(c => {
          if (c.ownerType === 'CLIENT') {
            return {
              ...c,
              alias: `Certificado Matriz A1 (${tenantProfile.name.split(' ')[0]})`,
              ownerName: tenantProfile.name,
              cnpjCpf: tenantProfile.cnpj
            };
          }
          return c;
        });
        return updated;
      });
    }
  }, [tenantProfile]);

  // New Certificate Modal Form State
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [newCertAlias, setNewCertAlias] = useState('');
  const [newCertOwnerType, setNewCertOwnerType] = useState<'CLIENT' | 'PARTNER_LAWYER' | 'PARTNER_ACCOUNTANT'>('PARTNER_LAWYER');
  const [newCertOwnerName, setNewCertOwnerName] = useState('');
  const [newCertCnpjCpf, setNewCertCnpjCpf] = useState('');
  const [newCertOabCrc, setNewCertOabCrc] = useState('');
  const [newCertVaultProvider, setNewCertVaultProvider] = useState<VaultProvider>('AWS_KMS');

  // BaaS Config & Split Settlement Simulator
  const [baasProvider, setBaasProvider] = useState<BaasProvider>(INITIAL_BAAS_CONFIG.provider);
  const [baasEnv, setBaasEnv] = useState<'SANDBOX' | 'PRODUCTION'>('SANDBOX');
  const [isSettlingWebhook, setIsSettlingWebhook] = useState(false);
  const [webhookSettledResult, setWebhookSettledResult] = useState<{
    chargeId: string;
    partnerNfse: string;
    velatrixNfse: string;
    endToEnd: string;
  } | null>(null);

  // Helper Copy
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run mTLS Handshake Test (Garantia de resposta em <= 2.5s)
  const handleRunMtlsTest = async () => {
    setIsTestingMtls(true);
    setMtlsResult(null);
    setMtlsError(null);
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tempo limite da simulação mTLS atingido (2.5s).')), 2500)
      );

      const res = await Promise.race([
        GovConnectorService.testMtlsHandshake(mtlsTarget, selectedCertId),
        timeoutPromise
      ]);

      setMtlsResult(res);
      setAuditLogs(GovConnectorService.getAuditLogs());
    } catch (err: any) {
      console.error('[mTLS Handshake Exception]:', err);
      setMtlsError(err?.message || 'Erro durante a negociação mTLS. Verifique a chave privada e o status do certificado.');
    } finally {
      setIsTestingMtls(false);
    }
  };

  // Transmit Automated PER/DCOMP (Garantia de resposta em <= 1.5s)
  const handleTransmitPerdcomp = async () => {
    setIsTransmittingPerdcomp(true);
    setPerdcompError(null);
    setPerdcompSuccessToast(null);

    try {
      // Simulação rápida e segura: 1.2s
      await new Promise(r => setTimeout(r, 1200));

      const activeCnpj = tenantProfile?.cnpj || '18.492.301/0001-84';
      const activeName = tenantProfile?.name || 'Nexus Indústria & Manufatura S/A';
      const targetCert = certificates.find(c => c.id === selectedCertId) || certificates[0];

      const receipt = await GovConnectorService.transmitPerDcomp({
        id: `dcomp_req_${Date.now()}`,
        tipoCredito: 'PIS_COFINS_BASE_EXCLUSAO_ICMS',
        origemCredito: 'Art. 3º Lei 10.833 / Decisão STF Tema 69 (Exclusão ICMS)',
        periodoCreditoInicio: '2021-01',
        periodoCreditoFim: '2025-12',
        valorPrincipalCredito: 184200.00,
        taxaSelicAcumuladaPct: 24.8,
        valorJurosSelic: 45681.60,
        valorTotalCreditoAtualizado: 229881.60,
        valorCompensadoDctfWebAtual: 148900.00,
        saldoRestitivelRemanescente: 80981.60,
        debitoCompensadoDescricao: 'COFINS Não Cumulativa (Cód. 2172) - Competência 04/2026',
        periodoDebitoCompensado: '2026-04',
        certificadoThumbprint: targetCert?.thumbprintSha256 || '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
        responsavelNome: 'Dra. Mariana Duarte (CFO)',
        responsavelCpf: '194.882.018-92',
        cnpjContribuinte: activeCnpj,
        razaoSocial: activeName
      });

      setLastTransmittedReceipt(receipt);
      setPerdcomps(GovConnectorService.getPerDcomps());
      setAuditLogs(GovConnectorService.getAuditLogs());
      setPerdcompSuccessToast(`DCOMP transmitida com sucesso à RFB! Recibo: ${receipt.reciboEntregaNumero} (CNPJ: ${receipt.cnpjContribuinte})`);
      setTimeout(() => setPerdcompSuccessToast(null), 6000);
    } catch (err: any) {
      console.error('[PER/DCOMP Transmission Exception]:', err);
      setPerdcompError(err?.message || 'Falha ao assinar e transmitir PER/DCOMP. Certificado ou conexão indisponível.');
    } finally {
      setIsTransmittingPerdcomp(false);
    }
  };

  // Handle Add New Certificate
  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertAlias || !newCertOwnerName || !newCertCnpjCpf) return;

    await GovConnectorService.registerA1Certificate({
      alias: newCertAlias,
      ownerType: newCertOwnerType,
      ownerName: newCertOwnerName,
      cnpjCpf: newCertCnpjCpf,
      oabCrcNumber: newCertOabCrc || undefined,
      keyVaultProvider: newCertVaultProvider
    });

    setCertificates(GovConnectorService.getCertificates());
    setAuditLogs(GovConnectorService.getAuditLogs());
    setShowAddCertModal(false);
    setNewCertAlias('');
    setNewCertOwnerName('');
    setNewCertCnpjCpf('');
    setNewCertOabCrc('');
  };

  // Simulate BaaS Settlement Webhook
  const handleSimulateBaaSWebhook = (chargeId: string) => {
    setIsSettlingWebhook(true);
    setTimeout(() => {
      const outcome = GovConnectorService.settleSplitChargeWebhook(chargeId);
      setSplitCharges([...GovConnectorService.getSplitCharges()]);
      setSubaccounts([...GovConnectorService.getSubaccounts()]);
      setAuditLogs([...GovConnectorService.getAuditLogs()]);
      setIsSettlingWebhook(false);
      if (outcome.charge) {
        setWebhookSettledResult({
          chargeId,
          partnerNfse: outcome.partnerNfseNumber,
          velatrixNfse: outcome.velatrixNfseNumber,
          endToEnd: outcome.bacenEndToEndId
        });
      }
    }, 900);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & STATUS EXECUTIVO                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 rounded-3xl border border-cyan-500/40 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <VelatrixLogo variant="capsule" />
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-[var(--vx-neon)] border border-cyan-500/40 font-mono text-[11px] font-bold flex items-center gap-1">
                <Network className="w-3 h-3" />
                AOS V2 Integration Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                mTLS TLS 1.3 + AES-256 Ativo
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-[11px] font-bold">
                PIX & Boletos BACEN
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/60 font-mono text-[11px] font-bold flex items-center gap-1.5 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                MODO SIMULADO (SANDBOX)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Server className="w-6 h-6 text-[var(--vx-neon)]" />
              Conectores Governamentais & Infraestrutura BaaS
            </h1>
            <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
              Barramento criptográfico de alta velocidade para comunicação direta com a Receita Federal (e-CAC / SERPRO / PER/DCOMP), PGFN (REGULARIZE / CAPAG), Ministério do Trabalho (DET / eSocial), Secretarias de Fazenda Estaduais (SEFAZ NF-e) e liquidação instantânea Banking-as-a-Service com split automático de honorários no BACEN.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onNavigateToTaxRecovery && (
              <button
                type="button"
                onClick={onNavigateToTaxRecovery}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Defesa Tributária</span>
              </button>
            )}
            {onNavigateToPartnerPortal && (
              <button
                type="button"
                onClick={onNavigateToPartnerPortal}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Portal de Parceiros</span>
              </button>
            )}
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Painel Geral
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Cofre KMS/Vault:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              AES-256 (Emulado KMS)
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Canal mTLS:</span>
            <span className="text-cyan-300 font-bold">TLS 1.3 (Simulação Mútua)</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">BaaS Provider:</span>
            <span className="text-amber-400 font-bold">{baasProvider} (SANDBOX)</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Split Bacen:</span>
            <span className="text-purple-400 font-bold">50/50 (Simulado D+0)</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* AVISO DESTACADO DE MODO SIMULADO / SANDBOX                     */}
      {/* ------------------------------------------------------------- */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-950 to-amber-950/70 border-2 border-amber-500/60 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-start md:items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0 mt-0.5 md:mt-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500 text-slate-950 uppercase tracking-wide">
                AVISO DE MODO SIMULADO
              </span>
              <strong className="text-sm font-bold text-amber-300">
                SANDBOX DE HOMOLOGAÇÃO VELATRIX AOS V2 ATIVO
              </strong>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-4xl">
              Os testes de handshake <span className="text-[var(--vx-neon)] font-bold">mTLS</span>, as transmissões de <span className="text-emerald-400 font-bold">PER/DCOMP</span> e as operações de split de pagamento <span className="text-amber-400 font-bold">BaaS (Asaas / Stark Bank / Celcoin)</span> estão operando em <strong>MODO SIMULADO</strong> local. Não há conexões ativas ou cobranças reais vinculadas aos sistemas em produção da Receita Federal, PGFN, SEFAZ, MTE, AWS KMS ou instituições financeiras.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Sandbox Seguro D+0
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUB-NAVIGATION TABS                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin border-b border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('vault_a1')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'vault_a1'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-950/60'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>1. Cofre A1 & mTLS (Vault)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-950/40 text-slate-900 font-black">
            {certificates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rfb_pgfn')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'rfb_pgfn'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-lg shadow-emerald-950/60'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>2. Receita Federal & PGFN</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950/80 text-emerald-300 font-black border border-emerald-600/40">
            PER/DCOMP
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('det_sefaz')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'det_sefaz'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-950/60'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Trabalhista & SEFAZ (DET/DEC)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-950 text-purple-300 font-bold border border-purple-600/40">
            18.4K XMLs
          </span>
        </button>

        {/* P23: aba "BaaS & Split 50/50" removida — a Velatrix não participa de honorários. */}

        <button
          type="button"
          onClick={() => setActiveTab('security_lgpd')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'security_lgpd'
              ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 shadow-lg shadow-cyan-950/60'
              : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>5. Segurança & Logs LGPD</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
            Imutável
          </span>
        </button>
      </div>

      {/* PerDcomp Success Toast */}
      {perdcompSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-950 border border-emerald-500/80 text-emerald-200 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono font-bold">{perdcompSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPerdcompSuccessToast(null)}
            className="text-xs text-emerald-400 hover:text-white underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: COFRE A1 & mTLS (VAULT & PROCURAÇÕES)                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'vault_a1' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Actions: Add Certificate & mTLS Test */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* mTLS Interactive Tester Card */}
            <div className="lg:col-span-2 bg-[var(--vx-deep)] border border-cyan-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-[var(--vx-neon)] border border-cyan-500/40">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                      Testador de Handshake mTLS em Tempo Real
                    </h3>
                    <p className="text-xs text-slate-400">
                      Disparo de handshake mútuo direto aos Web Services governamentais com validação da cadeia ICP-Brasil.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  HANDSHAKE SIMULADO (SANDBOX)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    Portal de Destino do Governo:
                  </label>
                  <select
                    value={mtlsTarget}
                    onChange={(e) => setMtlsTarget(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="RECEITA_FEDERAL_ECAC">Receita Federal (e-CAC / SERPRO WS)</option>
                    <option value="PGFN_REGULARIZE">PGFN (REGULARIZE Dívida Ativa)</option>
                    <option value="SEFAZ_NACIONAL_NFE">SEFAZ Nacional (Autorizador NF-e)</option>
                    <option value="MTE_DET">MTE (Domicílio Eletrônico Trabalhista)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    Certificado Digital A1 de Origem:
                  </label>
                  <select
                    value={selectedCertId}
                    onChange={(e) => setSelectedCertId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    {certificates.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.alias} ({c.ownerType === 'CLIENT' ? 'Cliente' : 'Parceiro'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Cifra Requerida: <span className="text-cyan-400">TLS_AES_256_GCM_SHA384</span>
                </span>

                <button
                  type="button"
                  onClick={handleRunMtlsTest}
                  disabled={isTestingMtls}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isTestingMtls ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Negociando mTLS Handshake...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Executar Handshake mTLS</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mtls Test Output */}
              {mtlsError && (
                <div className="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/50 space-y-1 text-xs font-mono">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Falha na Conexão mTLS</span>
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600/80">
                      SIMULADO
                    </span>
                  </div>
                  <p className="text-red-200/90 text-[11px] leading-relaxed">{mtlsError}</p>
                </div>
              )}

              {mtlsResult && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/50 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Handshake Concluído com Sucesso (HTTP {mtlsResult.responseStatusCode})
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600/80">
                        SIMULADO
                      </span>
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Latência: <strong className="text-cyan-400">{mtlsResult.handshakeTimeMs} ms</strong>
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {mtlsResult.diagnosticMessage}
                  </p>
                  <div className="p-2 rounded-lg bg-slate-900 text-[10px] text-slate-400 space-y-0.5">
                    <div>Endpoint: <span className="text-slate-200">{mtlsResult.endpointUrl}</span></div>
                    <div>Cipher Suite: <span className="text-cyan-300">{mtlsResult.cipherSuite}</span></div>
                    <div>Thumbprint: <span className="text-slate-300 truncate block">{mtlsResult.certificateThumbprint}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* KMS / HashiCorp Vault Status Card */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Lock className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-600">
                    ENVELOPE ENCRYPTION
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                  Custódia em Cofre de Chaves
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Os arquivos A1 (.pfx) são cifrados em repouso com chaves mestras AWS KMS (HSM FIPS 140-2 Nível 3) ou HashiCorp Vault. A chave privada nunca é exposta em logs ou memória persistente.
                </p>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provedor Primário:</span>
                    <span className="text-purple-400 font-bold">AWS KMS (sa-east-1)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provedor Secundário:</span>
                    <span className="text-indigo-400 font-bold">HashiCorp Vault High-Avail</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validação LCR/OCSP:</span>
                    <span className="text-emerald-400 font-bold">A cada 30 min</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddCertModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Adicionar Certificado A1 (.pfx)</span>
              </button>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-cyan-400" />
                  Certificados Digitais A1 Custodiados ({certificates.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Certificados A1 de clientes corporativos e advogados/peritos parceiros para assinatura e mTLS governamental.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Padrão ICP-Brasil v5 / v10 Homologado
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2.5">Identificação / Alias</th>
                    <th className="pb-2.5">Tipo / Titular</th>
                    <th className="pb-2.5">CNPJ / CPF</th>
                    <th className="pb-2.5">Autoridade Certificadora</th>
                    <th className="pb-2.5">Cofre de Chave</th>
                    <th className="pb-2.5">Validade</th>
                    <th className="pb-2.5 text-right">Status mTLS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-slate-200">{cert.alias}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                          Thumb: {cert.thumbprintSha256.substring(0, 20)}...
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          cert.ownerType === 'CLIENT'
                            ? 'bg-blue-950 text-blue-300 border border-blue-600/40'
                            : cert.ownerType === 'PARTNER_LAWYER'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : 'bg-purple-950 text-purple-300 border border-purple-600/40'
                        }`}>
                          {cert.ownerType === 'CLIENT' ? 'Cliente' : cert.ownerType === 'PARTNER_LAWYER' ? 'Advogado OAB' : 'Perito CRC'}
                        </span>
                        <div className="text-[11px] text-slate-300 mt-0.5">{cert.ownerName}</div>
                      </td>
                      <td className="py-3 text-slate-300">
                        {cert.cnpjCpf}
                        {cert.oabCrcNumber && (
                          <div className="text-[10px] text-amber-400 font-bold">{cert.oabCrcNumber}</div>
                        )}
                      </td>
                      <td className="py-3 text-slate-300">{cert.issuerCN}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                          {cert.keyVaultProvider}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="text-slate-200">{cert.validUntil.substring(0, 10)}</div>
                        <div className="text-[10px] text-emerald-400 font-bold">{cert.daysRemaining} dias restantes</div>
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          mTLS Ativo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* e-CAC / SERPRO Procurações Eletrônicas */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  Gerenciador de Procurações Eletrônicas e-CAC / SERPRO
                </h3>
                <p className="text-xs text-slate-400">
                  Delegações formais outorgadas pela empresa cliente para permitir requisições tributárias e protocolo de PER/DCOMP pelo CNPJ do advogado parceiro.
                </p>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-[10px] font-mono font-bold">
                Assinatura Digital Qualificada ICP-Brasil
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proxies.map(proc => (
                <div key={proc.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 font-mono">
                      {proc.procuracaoNumero}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                      {proc.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-300">
                    <div>
                      <span className="text-slate-400">Outorgante (Cliente):</span>{' '}
                      <strong className="text-white">{proc.outorganteRazaoSocial}</strong> ({proc.outorganteCnpj})
                    </div>
                    <div>
                      <span className="text-slate-400">Outorgado (Parceiro):</span>{' '}
                      <strong className="text-amber-300">{proc.outorgadoNome}</strong> ({proc.outorgadoCnpjCpf})
                    </div>
                    <div>
                      <span className="text-slate-400">Validade:</span> {proc.dataEmissao} até {proc.dataValidade}
                    </div>
                  </div>

                  {/* Powers list */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Poderes Delegados no e-CAC:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proc.poderesDelegados.pgdasD && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                          PGDAS-D
                        </span>
                      )}
                      {proc.poderesDelegados.efdContribuicoes && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                          EFD-Contribuições
                        </span>
                      )}
                      {proc.poderesDelegados.efdReinf && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                          EFD-Reinf
                        </span>
                      )}
                      {proc.poderesDelegados.perDcomp && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 border border-emerald-600 text-emerald-300 font-bold">
                          Envio PER/DCOMP
                        </span>
                      )}
                      {proc.poderesDelegados.dividaAtivaPgfn && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-950 border border-amber-600 text-amber-300 font-bold">
                          PGFN Dívida Ativa
                        </span>
                      )}
                      {proc.poderesDelegados.cndCertidoes && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-300">
                          CND/CPEN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: RECEITA FEDERAL & PGFN (e-CAC, PER/DCOMP & REGULARIZE) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'rfb_pgfn' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Top Row: Declarations & PER/DCOMP Transmit Engine */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* PER/DCOMP Automated Transmit Box */}
            <div className="lg:col-span-1 bg-[var(--vx-deep)] border border-emerald-500/50 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      MODO SIMULADO
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                      PIPELINE 1-CLICK
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                  Transmissão Eletrônica PER/DCOMP
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Envio automatizado do Pedido Eletrônico de Restituição e Declaração de Compensação à Receita Federal com compensação imediata contra débitos correntes da DCTFWeb.
                </p>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Crédito Selecionado:</span>
                    <span className="text-emerald-400 font-bold">Tema 69 STF (ICMS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Principal + SELIC:</span>
                    <span className="text-cyan-400 font-bold">R$ 229.881,60</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Compensação Imediata:</span>
                    <span className="text-amber-400 font-bold">R$ 148.900,00</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Saldo Remanescente:</span>
                    <span className="text-purple-400 font-bold">R$ 80.981,60</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTransmitPerdcomp}
                disabled={isTransmittingPerdcomp}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/60 disabled:opacity-50"
              >
                {isTransmittingPerdcomp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Assinando e Transmitindo à RFB...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Transmitir PER/DCOMP com Certificado A1</span>
                  </>
                )}
              </button>

              {/* PER/DCOMP Error Feedback */}
              {perdcompError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-400">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Falha na Transmissão da PER/DCOMP</span>
                  </div>
                  <p className="text-[11px] text-red-200/90 leading-relaxed">{perdcompError}</p>
                </div>
              )}

              {/* PER/DCOMP Success Immediate Receipt Display */}
              {lastTransmittedReceipt && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/50 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      DCOMP Transmitida à RFB
                      <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600/80">
                        SIMULADO
                      </span>
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      {lastTransmittedReceipt.dataHoraTransmissao}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/90 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recibo RFB:</span>
                      <strong className="text-cyan-300 font-mono">{lastTransmittedReceipt.reciboEntregaNumero}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nº Controle:</span>
                      <strong className="text-slate-200 font-mono">{lastTransmittedReceipt.numeroControlePerDcomp}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contribuinte / CNPJ:</span>
                      <span className="text-slate-200">{lastTransmittedReceipt.cnpjContribuinte}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Compensação:</span>
                      <strong className="text-emerald-400">{formatCurrency(lastTransmittedReceipt.valorTotalCompensado, currency, language)}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-800">
                      Protocolo SERPRO: {lastTransmittedReceipt.protocoloSerpro}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Declarations Read by e-CAC SERPRO API */}
            <div className="lg:col-span-2 bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    Leitura Automática de Declarações e-CAC (SERPRO WS)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sincronização em tempo real de PGDAS-D, EFD-Contribuições e EFD-Reinf com detecção de créditos tributários retroativos.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-600">
                  CONEXÃO ONLINE
                </span>
              </div>

              <div className="space-y-3">
                {INITIAL_ECAC_DECLARATIONS.map((decl, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-900 border border-slate-700 text-slate-200">
                          {decl.tipo}
                        </span>
                        <span className="text-slate-400">Comp: <strong className="text-white">{decl.periodoApuracao}</strong></span>
                      </div>
                      <span className="text-emerald-400 font-bold">
                        + {formatCurrency(decl.creditoIdentificadoAos, currency, language)} Crédito AOS
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed">
                      {decl.notaTecnica}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-900">
                      <span>Recibo: {decl.reciboNumero}</span>
                      <span>Transmissão: {decl.dataTransmissao}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PER/DCOMP Receipts History */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  Recibos Oficiais PER/DCOMP Homologados ({perdcomps.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Comprovantes de transmissão eletrônica com carimbo do tempo e chave de consulta da Receita Federal.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Efeito Extintivo do Crédito Tributário
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {perdcomps.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">
                      {p.numeroControlePerDcomp}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600">
                        {p.statusHomologacao}
                      </span>
                      {p.isSimulated && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600">
                          SIMULADO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-slate-300 text-[11px]">
                    <div><span className="text-slate-500">Recibo RFB:</span> <strong className="text-white">{p.reciboEntregaNumero}</strong></div>
                    <div><span className="text-slate-500">Protocolo SERPRO:</span> {p.protocoloSerpro}</div>
                    <div><span className="text-slate-500">Valor Compensado:</span> <strong className="text-emerald-400">{formatCurrency(p.valorTotalCompensado, currency, language)}</strong></div>
                    <div><span className="text-slate-500">Data/Hora:</span> {p.dataHoraTransmissao}</div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 text-[10px] text-slate-500 truncate">
                    Hash Carimbo do Tempo: {p.carimboDoTempoSha256}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PGFN REGULARIZE & CAPAG HISTORY */}
          <div className="bg-[var(--vx-deep)] border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  PGFN REGULARIZE: Dívida Ativa da União & Histórico CAPAG
                </h3>
                <p className="text-xs text-slate-400">
                  Diagnóstico das inscrições em cobrança na Procuradoria Geral da Fazenda Nacional e cálculo de desconto pela Lei 13.988/2020.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-500 font-mono text-[11px] font-bold">
                  Rating CAPAG: C (Apto até 70% Desconto)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2.5">Inscrição CDA</th>
                    <th className="pb-2.5">Tributo</th>
                    <th className="pb-2.5">Valor Atualizado</th>
                    <th className="pb-2.5">Fase Cobrança</th>
                    <th className="pb-2.5">Desconto Projetado</th>
                    <th className="pb-2.5">Valor Pós-Transação</th>
                    <th className="pb-2.5 text-right">Parcelamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {INITIAL_PGFN_DEBTS.map((debt, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 font-bold text-slate-200">{debt.numeroInscricaoCda}</td>
                      <td className="py-3 text-slate-300">{debt.tributo}</td>
                      <td className="py-3 text-rose-400 font-bold">{formatCurrency(debt.valorAtualizadoComSelic, currency, language)}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px]">
                          {debt.faseCobranca}
                        </span>
                      </td>
                      <td className="py-3 text-emerald-400 font-bold">
                        {debt.potencialDescontoJurosMultasPct}% em juros/multas
                      </td>
                      <td className="py-3 text-cyan-300 font-bold">
                        {formatCurrency(debt.valorAposTransacaoProjetado, currency, language)}
                      </td>
                      <td className="py-3 text-right text-amber-400 font-bold">
                        Até {debt.parcelamentoMaximoMeses}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: TRABALHISTA & ESTADUAL/MUNICIPAL (DET & SEFAZ XMLs)    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'det_sefaz' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* DET - Domicílio Eletrônico Trabalhista (MTE / eSocial) */}
          <div className="bg-[var(--vx-deep)] border border-purple-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  DET: Domicílio Eletrônico Trabalhista (MTE / SIT / eSocial)
                </h3>
                <p className="text-xs text-slate-400">
                  Monitoramento contínuo de notificações, intimações e auditoria de INSS Patronal sobre verbas rescisórias e indenizatórias.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-500 font-mono text-[11px] font-bold">
                Crawler MTE Ativo D+0
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {INITIAL_DET_NOTIFICATIONS.map(notif => (
                <div key={notif.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-bold bg-purple-950 text-purple-300 border border-purple-600 text-[10px]">
                      {notif.origem}
                    </span>
                    <span className="text-rose-400 font-bold text-[11px] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Prazo: {notif.prazoRespostaDias} dias restantes
                    </span>
                  </div>

                  <h4 className="text-slate-100 font-bold text-xs">{notif.titulo}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{notif.resumoImpacto}</p>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Impacto Estimado:</span>
                      <strong className="text-amber-400">{formatCurrency(notif.valorEnvolvidoBrl, currency, language)}</strong>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Ação AOS: <span className="text-cyan-300">{notif.acaoRecomendadaAos}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEFAZ Estadual: Varredura de XMLs NF-e / NFC-e */}
          <div className="bg-[var(--vx-deep)] border border-cyan-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  SEFAZ Estadual: Varredura Contínua de XMLs de NF-e / NFC-e
                </h3>
                <p className="text-xs text-slate-400">
                  Filtro inteligente de notas fiscais com foco em NCMs de PIS/COFINS Monofásico e ICMS Substituição Tributária (ST).
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500 font-mono text-[11px] font-bold">
                18.420 XMLs Processados em 412ms
              </span>
            </div>

            {INITIAL_SEFAZ_BATCHES.map(batch => (
              <div key={batch.id} className="space-y-3 font-mono text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Total XMLs Auditados:</span>
                    <div className="text-lg font-black text-white">{batch.totalXmlsProcessados.toLocaleString()} NFs</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Crédito PIS/COFINS Monofásico:</span>
                    <div className="text-lg font-black text-emerald-400">
                      {formatCurrency(batch.creditoPisCofinsMonofasicoIdentificado, currency, language)}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400">Crédito ICMS-ST Recuperável:</span>
                    <div className="text-lg font-black text-cyan-400">
                      {formatCurrency(batch.creditoIcmsStBitributadoIdentificado, currency, language)}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase">
                    Principais NCMs Críticos Auditados na Origem
                  </h4>
                  <div className="space-y-2">
                    {batch.ncmsCriticosDetectados.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                        <div>
                          <strong className="text-amber-400 font-mono">NCM {item.ncm}</strong> - {item.descricao}
                          <div className="text-[10px] text-slate-500">
                            {item.quantidadeItens.toLocaleString()} itens | Faturamento Total: {formatCurrency(item.valorFaturadoTotal, currency, language)}
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold shrink-0 mt-1 sm:mt-0">
                          + {formatCurrency(item.tributacaoIndevidaIdentificada, currency, language)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: BAAS & SPLIT 50/50 (BACEN & EMISSÃO DUPLA NFS-e)       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'baas_split' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Provider Config & Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Provider Settings Card */}
            <div className="bg-[var(--vx-deep)] border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600">
                  BACEN DIRECT
                </span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                Provedor Banking-as-a-Service
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Integração direta com instituições de pagamento reguladas pelo Banco Central para liquidação de PIX Dinâmico e divisão no ato do recebimento.
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Instituição BaaS:</label>
                  <select
                    value={baasProvider}
                    onChange={(e) => setBaasProvider(e.target.value as BaasProvider)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="ASAAS">Asaas IP S/A (Bacen 19.540.550)</option>
                    <option value="STARK_BANK">Stark Bank S/A (Bacen 35.195.409)</option>
                    <option value="CELCOIN">Celcoin Instituição de Pagamento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Ambiente Operacional:</label>
                  <select
                    value={baasEnv}
                    onChange={(e) => setBaasEnv(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="PRODUCTION">Produção (Live Bacen SPI / CIP)</option>
                    <option value="SANDBOX">Sandbox Homologação</option>
                  </select>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] space-y-1 text-slate-400">
                  <div>Endpoint Webhook: <span className="text-slate-200 font-mono">/api/v1/baas/webhook/settlement</span></div>
                  <div>Chave Criptográfica: <span className="text-amber-400 font-mono">whsec_***8912 (AES-256)</span></div>
                </div>
              </div>
            </div>

            {/* Split 50/50 Engine Explanation */}
            <div className="lg:col-span-2 bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono text-xs font-black">
                      50% / 50%
                    </span>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono">
                      Regra de Split de Honorários & Blindagem Fiscal
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">
                    Sem Bitributação
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao liquidar o PIX ou Boleto de honorários de êxito do cliente final, a API BaaS distribui instantaneamente os valores nas subcontas correspondentes. Nenhuma das partes é bitributada sobre o montante total:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-1.5">
                    <div className="text-amber-300 font-bold flex items-center justify-between">
                      <span>50% Subconta Parceiro</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300">OAB / CRC</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Creditado direto na conta jurídica do escritório parceiro. Dispara NFS-e de honorários advocatícios ou periciais.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-1.5">
                    <div className="text-cyan-300 font-bold flex items-center justify-between">
                      <span>50% Velatrix Tecnologia</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">SaaS / Licença</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Creditado na conta Velatrix Tecnologia Ltda. Dispara NFS-e municipal referente a licenciamento de software (CNAE 6203-1/00).
                    </p>
                  </div>
                </div>
              </div>

              {webhookSettledResult && (
                <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-xs font-mono space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Webhook de Liquidação Processado com Sucesso no BACEN!
                  </div>
                  <div className="text-[11px] text-slate-200">
                    EndToEnd ID: <span className="text-cyan-300">{webhookSettledResult.endToEnd}</span>
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    NFS-e Emitidas: {webhookSettledResult.partnerNfse} | {webhookSettledResult.velatrixNfse}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subaccounts & Charges Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Subaccounts list */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  Subcontas de Liquidação BaaS ({subaccounts.length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  KYC Bacen Aprovado
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {subaccounts.map(sub => (
                  <div key={sub.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-100">{sub.holderName}</strong>
                        {sub.isSimulated && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600">
                            SIMULADO
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-400 font-bold">
                        Saldo: {formatCurrency(sub.walletBalanceBrl, currency, language)}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div>Registro: <strong className="text-amber-400">{sub.registrationCode}</strong> ({sub.holderCnpjCpf})</div>
                      <div>Chave PIX: <span className="text-slate-200">{sub.pixKey}</span></div>
                      <div>Banco: {sub.bankAccount.bankName} | Ag: {sub.bankAccount.agency} | CC: {sub.bankAccount.accountNumber}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split Charges & Simulator */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  Cobranças com Split 50/50 em Andamento
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  PIX Dinâmico + Boleto
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {splitCharges.map(charge => (
                  <div key={charge.chargeId} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{charge.chargeId}</span>
                        {charge.isSimulated && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-600">
                            SPLIT SIMULADO
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        charge.status === 'SPLIT_CONCLUIDO'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : 'bg-amber-950 text-amber-300 border border-amber-600'
                      }`}>
                        {charge.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Honorários:</span>
                      <strong className="text-white text-xs">
                        {formatCurrency(charge.valorTotalHonorariosBrl, currency, language)}
                      </strong>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-500">Parceiro (50%):</span>
                        <div className="text-amber-300 font-bold">{formatCurrency(charge.splitRules.partnerAmountBrl, currency, language)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Velatrix (50%):</span>
                        <div className="text-cyan-300 font-bold">{formatCurrency(charge.splitRules.velatrixAmountBrl, currency, language)}</div>
                      </div>
                    </div>

                    {charge.status !== 'SPLIT_CONCLUIDO' && (
                      <button
                        type="button"
                        onClick={() => handleSimulateBaaSWebhook(charge.chargeId)}
                        disabled={isSettlingWebhook}
                        className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Simular Webhook de Liquidação (Disparo Dupla NFS-e)</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: SEGURANÇA, LGPD & LOGS DE AUDITORIA IMUTÁVEIS           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security_lgpd' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-[var(--vx-deep)] border border-cyan-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Trânsito de Dados</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">TLS 1.3 Obrigatório</div>
              <p className="text-[11px] text-slate-400">
                PFS (Perfect Forward Secrecy) com curvas elípticas ECDHE e autenticação mTLS mútua em cada salto.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-[var(--vx-deep)] border border-purple-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Dados em Repouso</span>
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">AES-256-GCM Envelope</div>
              <p className="text-[11px] text-slate-400">
                Chaves mestras gerenciadas em HSM certificado FIPS 140-2 Nível 3, sem exposição de chaves privadas.
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-[var(--vx-deep)] border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Conformidade LGPD</span>
                <Scale className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-black text-white font-mono">Art. 7º II & VI</div>
              <p className="text-[11px] text-slate-400">
                Cumprimento de obrigação legal e exercício regular de direitos em processos administrativos e judiciais.
              </p>
            </div>
          </div>

          {/* Immutable Audit Ledger Table */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-cyan-400" />
                  Ledger Imutável de Chamadas Governamentais & BaaS ({auditLogs.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Registro criptográfico de cada requisição contendo timestamp, IP de origem, hash do certificado e digest do payload.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(JSON.stringify(auditLogs, null, 2), 'audit_json')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedKey === 'audit_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Trilha Pericial (JSON)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="pb-2.5">Data/Hora (UTC)</th>
                    <th className="pb-2.5">Portal / Destino</th>
                    <th className="pb-2.5">Endpoint Governamental</th>
                    <th className="pb-2.5">CNPJ Consultado</th>
                    <th className="pb-2.5">IP Origem</th>
                    <th className="pb-2.5">Latência</th>
                    <th className="pb-2.5 text-right">Hash Imutável</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 text-slate-300">{log.timestamp.substring(0, 19).replace('T', ' ')}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded font-bold bg-slate-900 border border-slate-700 text-slate-200 text-[10px]">
                          {log.portalGoverno}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 truncate max-w-xs">{log.endpoint}</td>
                      <td className="py-3 text-slate-400">{log.cnpjConsultado}</td>
                      <td className="py-3 text-slate-400">{log.clientIp}</td>
                      <td className="py-3 text-cyan-400 font-bold">{log.tempoRespostaMs} ms</td>
                      <td className="py-3 text-right">
                        <span className="text-[10px] text-emerald-400 font-mono" title={log.imutabilidadeHash}>
                          {log.imutabilidadeHash.substring(0, 14)}...
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADICIONAR CERTIFICADO A1 (.PFX)                         */}
      {/* ------------------------------------------------------------- */}
      {showAddCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--vx-deep)] border border-cyan-500/60 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase tracking-tight font-mono flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[var(--vx-neon)]" />
                Custodiar Certificado Digital A1 (.pfx)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCertModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCertificate} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Identificação / Alias Amigável:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Certificado A1 Vasconcelos & Prado 2026"
                  value={newCertAlias}
                  onChange={(e) => setNewCertAlias(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Tipo de Titular:</label>
                  <select
                    value={newCertOwnerType}
                    onChange={(e) => setNewCertOwnerType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="CLIENT">Empresa Cliente</option>
                    <option value="PARTNER_LAWYER">Advogado Parceiro (OAB)</option>
                    <option value="PARTNER_ACCOUNTANT">Perito Contábil (CRC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Cofre Criptográfico:</label>
                  <select
                    value={newCertVaultProvider}
                    onChange={(e) => setNewCertVaultProvider(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="AWS_KMS">AWS KMS (FIPS 140-2 L3)</option>
                    <option value="HASHICORP_VAULT">HashiCorp Vault</option>
                    <option value="AZURE_KEYVAULT">Azure KeyVault</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Razão Social / Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Vasconcelos Advogados Associados"
                  value={newCertOwnerName}
                  onChange={(e) => setNewCertOwnerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">CNPJ ou CPF:</label>
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0001-00"
                    value={newCertCnpjCpf}
                    onChange={(e) => setNewCertCnpjCpf(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Nº OAB ou CRC (Opcional):</label>
                  <input
                    type="text"
                    placeholder="OAB/SP 123456"
                    value={newCertOabCrc}
                    onChange={(e) => setNewCertOabCrc(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="text-cyan-400 font-bold block">Proteção em Envelope Criptográfico:</span>
                O arquivo .pfx é criptografado com AES-256-GCM antes de ser inserido no cofre. A chave privada nunca transita em texto plano.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black cursor-pointer shadow-lg shadow-cyan-950/60"
                >
                  Criptografar e Salvar no Cofre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
