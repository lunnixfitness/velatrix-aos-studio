import React, { useState, useMemo } from 'react';
import {
  Brain,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Zap,
  Activity,
  CheckCircle2,
  TrendingUp,
  History,
  Building2,
  Filter,
  ArrowRight,
  Sparkles,
  Lock,
  RefreshCw,
  Sliders,
  DollarSign,
  Layers,
  FileCheck,
  FileX
} from 'lucide-react';
import { TenantProfile, AuditRecord } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { sha256Hex } from '../../shared/crypto/hash';
import { secureInt } from '../../lib/demoMode';

export interface FiscalPatternMatchEvent {
  id: string;
  nfeNumber: string;
  ncm: string;
  cfopEmitted: string;
  cfopCorrect: string;
  productDescription: string;
  historicalRecoveryDate: string;
  previousProcessId: string;
  estimatedTaxLeakage: number;
  detectionLatencyMs: number;
  status: 'BLOCKED_AT_ERP' | 'FLAGGED_PREVENTIVE' | 'AUTO_CORRECTED';
  timestamp: string;
  riskReason: string;
}

export interface SupplierXmlAuditRecord {
  id: string;
  supplierName: string;
  supplierCnpj: string;
  xmlKey: string;
  productDescription: string;
  xmlNcmReceived: string;
  certifiedMonofasicoNcm: string;
  tamperingType: 'NCM_ALTERED_TO_GENERIC' | 'WRONG_CST_PIS_COFINS' | 'ICMS_ST_UNLINKED';
  discrepancyImpact: number;
  supplierComplianceScore: number;
  status: 'ALERT_ISSUED' | 'DISPUTE_OPEN' | 'HOMOLOGATED_REVERSION';
  timestamp: string;
}

export interface PreservedCashTimelineEvent {
  id: string;
  date: string;
  module: 'PATTERN_MATCH_60M' | 'SUPPLIER_XML_GUARD' | 'NCM_CFOP_INTERCEPTOR' | 'ERP_EDGE_SHIELD';
  title: string;
  codeRef: string;
  preservedValue: number;
  dreImpactCategory: 'DEDUCOES_TRIBUTARIAS' | 'SG_A_REVERSION' | 'EBITDA_PRESERVATION';
  status: 'PRESERVED';
}

const INITIAL_PATTERN_MATCHES: FiscalPatternMatchEvent[] = [
  {
    id: 'pat-ncm-8708',
    nfeNumber: 'NF-e 000.419.821 (Pré-Emissão ERP)',
    ncm: '8708.29.99',
    cfopEmitted: '5.102 (Tributação Integral Ordinária)',
    cfopCorrect: '5.405 (Monofásico PIS/COFINS - Venda de Autopeças ST)',
    productDescription: 'Filtro Separador de Água e Combustível Blindado Industrial',
    historicalRecoveryDate: 'Processo PER-DCOMP 2023.09.441 (Recuperado: R$ 84.120,00)',
    previousProcessId: 'PER-DCOMP 00.4.23.009841-52',
    estimatedTaxLeakage: 7850.40,
    detectionLatencyMs: 0.84,
    status: 'BLOCKED_AT_ERP',
    timestamp: 'Há 4 minutos',
    riskReason: 'Reincidência Crítica: O mesmo NCM foi objeto de restituição tributária homologada nos 60 meses. Emissão como 5.102 geraria pagamento duplicado no DAS.'
  },
  {
    id: 'pat-ncm-3004',
    nfeNumber: 'NF-e 000.419.819 (Pré-Emissão ERP)',
    ncm: '3004.90.99',
    cfopEmitted: '5.101 (Venda de Produção sem Dedução)',
    cfopCorrect: '5.401 (Alíquota Zero / Monofásico Farma)',
    productDescription: 'Solução Antisséptica Tópica Hospitalar Frasco 1000ml',
    historicalRecoveryDate: 'Habilitação RFB 2024.01.192 (Tema 69 / Monofásico)',
    previousProcessId: 'HABILITACAO-RFB-2024-SP',
    estimatedTaxLeakage: 14220.00,
    detectionLatencyMs: 0.62,
    status: 'AUTO_CORRECTED',
    timestamp: 'Há 22 minutos',
    riskReason: 'NCM de produto com alíquota zero nas saídas de varejo/distribuição. Código CST 04 injetado automaticamente antes do envio à SEFAZ.'
  },
  {
    id: 'pat-ncm-2202',
    nfeNumber: 'NF-e 000.419.810 (Pré-Emissão ERP)',
    ncm: '2202.10.00',
    cfopEmitted: '5.102 (Revenda de Mercadorias)',
    cfopCorrect: '5.405 (Bebidas Frias Monofásicas - Art. 58 Lei 10.833)',
    productDescription: 'Lote Isotônico Eletrolítico Frutas Cítricas 500ml',
    historicalRecoveryDate: 'Auditoria Administrativa e-CAC 2022.11',
    previousProcessId: 'AUD-ECAC-2022-BEBIDAS',
    estimatedTaxLeakage: 5190.15,
    detectionLatencyMs: 0.77,
    status: 'BLOCKED_AT_ERP',
    timestamp: 'Há 1 hora',
    riskReason: 'Regime especial de bebidas frias: PIS/COFINS já recolhidos na indústria/fabricante. Venda sem segregação acarretaria bitributação.'
  }
];

const INITIAL_SUPPLIER_XMLS: SupplierXmlAuditRecord[] = [
  {
    id: 'sup-xml-001',
    supplierName: 'Distribuidora Petromax Filtros e Fluidos S.A.',
    supplierCnpj: '08.412.981/0001-44',
    xmlKey: '3526 0808 4129 8100 0144 5500 1000 8129 1812 9018 2910',
    productDescription: 'Elemento Filtrante Ar Motor Pesado Série X',
    xmlNcmReceived: '8421.99.99 (Equipamento Geral - Alíquota Plena)',
    certifiedMonofasicoNcm: '8421.23.00 / 8708.29.99 (Autopeça Monofásica)',
    tamperingType: 'NCM_ALTERED_TO_GENERIC',
    discrepancyImpact: 12450.00,
    supplierComplianceScore: 58,
    status: 'ALERT_ISSUED',
    timestamp: 'Hoje às 08:30'
  },
  {
    id: 'sup-xml-002',
    supplierName: 'BioFarma Distribuição e Logística Hospitalar Ltda',
    supplierCnpj: '14.981.203/0002-19',
    xmlKey: '3526 0814 9812 0300 0219 5500 2000 1928 3719 0281 9912',
    productDescription: 'Gel Lubrificante Urológico Estéril 50g',
    xmlNcmReceived: '3004.90.99 (Com CST 01 Tributado Integral)',
    certifiedMonofasicoNcm: '3004.90.99 (CST 04 Alíquota Zero)',
    tamperingType: 'WRONG_CST_PIS_COFINS',
    discrepancyImpact: 8910.00,
    supplierComplianceScore: 72,
    status: 'DISPUTE_OPEN',
    timestamp: 'Ontem às 16:45'
  },
  {
    id: 'sup-xml-003',
    supplierName: 'Indústria Química Brasil Clean ME',
    supplierCnpj: '22.810.192/0001-05',
    xmlKey: '3526 0822 8101 9200 0105 5500 1000 3918 2019 1102 9182',
    productDescription: 'Desinfetante Hospitalar Alto Nível Cloro Ativo',
    xmlNcmReceived: '3808.94.19 (Sem destaque de ICMS-ST)',
    certifiedMonofasicoNcm: '3808.94.19 (Com MVA 42% ICMS-ST)',
    tamperingType: 'ICMS_ST_UNLINKED',
    discrepancyImpact: 6380.00,
    supplierComplianceScore: 84,
    status: 'HOMOLOGATED_REVERSION',
    timestamp: 'Ontem às 11:15'
  }
];

const INITIAL_TIMELINE: PreservedCashTimelineEvent[] = [
  {
    id: 'tl-01',
    date: 'Hoje, 11:24',
    module: 'PATTERN_MATCH_60M',
    title: 'Bloqueio de Bitributação NCM 8708.29.99 (Autopeças)',
    codeRef: 'CFOP 5.102 -> 5.405 Interceptado',
    preservedValue: 7850.40,
    dreImpactCategory: 'DEDUCOES_TRIBUTARIAS',
    status: 'PRESERVED'
  },
  {
    id: 'tl-02',
    date: 'Hoje, 09:12',
    module: 'SUPPLIER_XML_GUARD',
    title: 'Reversão de NCM Adulterado por Fornecedor (Filtros)',
    codeRef: 'Petromax CNPJ 08.412.981/0001-44',
    preservedValue: 12450.00,
    dreImpactCategory: 'DEDUCOES_TRIBUTARIAS',
    status: 'PRESERVED'
  },
  {
    id: 'tl-03',
    date: 'Ontem, 17:50',
    module: 'ERP_EDGE_SHIELD',
    title: 'Prevenção de Sangria PIX com Divergência de CNPJ Titular',
    codeRef: 'Boleto Adulterado interceptado no SAP',
    preservedValue: 32500.00,
    dreImpactCategory: 'EBITDA_PRESERVATION',
    status: 'PRESERVED'
  },
  {
    id: 'tl-04',
    date: 'Ontem, 14:10',
    module: 'PATTERN_MATCH_60M',
    title: 'Correção Pré-SEFAZ NCM 3004.90.99 (Medicamentos)',
    codeRef: 'CST 04 Injetado automaticamente',
    preservedValue: 14220.00,
    dreImpactCategory: 'DEDUCOES_TRIBUTARIAS',
    status: 'PRESERVED'
  },
  {
    id: 'tl-05',
    date: '20/08/2026',
    module: 'NCM_CFOP_INTERCEPTOR',
    title: 'Trava de Duplicidade em Lote de Faturamento Simples',
    codeRef: 'Lote 18 Notas com NCMs Monofásicos',
    preservedValue: 58900.00,
    dreImpactCategory: 'DEDUCOES_TRIBUTARIAS',
    status: 'PRESERVED'
  },
  {
    id: 'tl-06',
    date: '18/08/2026',
    module: 'PATTERN_MATCH_60M',
    title: 'Reversão INSS Patronal sobre Terço Constitucional de Férias',
    codeRef: 'Tema 163 STF / eSocial S-1200',
    preservedValue: 286880.00,
    dreImpactCategory: 'SG_A_REVERSION',
    status: 'PRESERVED'
  }
];

interface DjVuFiscalPatternMemoryPanelProps {
  tenantProfile: TenantProfile;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const DjVuFiscalPatternMemoryPanel: React.FC<DjVuFiscalPatternMemoryPanelProps> = ({
  tenantProfile,
  onAddAuditRecord
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'PATTERN_MATCH' | 'SUPPLIER_XML' | 'PRESERVED_CASH_TIMELINE'>('PATTERN_MATCH');
  const [patternMatches, setPatternMatches] = useState<FiscalPatternMatchEvent[]>(INITIAL_PATTERN_MATCHES);
  const [supplierXmls, setSupplierXmls] = useState<SupplierXmlAuditRecord[]>(INITIAL_SUPPLIER_XMLS);
  const [timelineEvents, setTimelineEvents] = useState<PreservedCashTimelineEvent[]>(INITIAL_TIMELINE);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Métrica Total de Caixa Preservado
  const totalPreservedCash = useMemo(() => {
    return timelineEvents.reduce((acc, item) => acc + item.preservedValue, 0);
  }, [timelineEvents]);

  const preservedLast30Days = useMemo(() => {
    return timelineEvents.slice(0, 5).reduce((acc, item) => acc + item.preservedValue, 0);
  }, [timelineEvents]);

  const handleSimulatePatternMatch = () => {
    setIsSimulating(true);
    setTimeout(async () => {
      const randomId = secureInt(100000, 999999);
      const newEvent: FiscalPatternMatchEvent = {
        id: `pat-live-${Date.now()}`,
        nfeNumber: `NF-e 000.${randomId} (Sinal de Pré-Emissão SEFAZ)`,
        ncm: '8708.29.99',
        cfopEmitted: '5.102 (Tributação 100% Ordinária)',
        cfopCorrect: '5.405 (Monofásico PIS/COFINS)',
        productDescription: 'Kit Reparo de Bico Injetor Common Rail Diesel',
        historicalRecoveryDate: 'Histórico 60M: PER-DCOMP 00.4.23.009841-52',
        previousProcessId: 'HABILITACAO-AUTONOMIA-D0',
        estimatedTaxLeakage: 9450.00,
        detectionLatencyMs: 0.71,
        status: 'BLOCKED_AT_ERP',
        timestamp: 'Agora mesmo',
        riskReason: 'Cruzamento DjVu detectou o mesmo NCM que foi restituído pela RFB. Bloqueio disparado em 0.71ms no ERP antes da SEFAZ autorizar.'
      };

      setPatternMatches(prev => [newEvent, ...prev]);

      const newTimelineItem: PreservedCashTimelineEvent = {
        id: `tl-live-${Date.now()}`,
        date: 'Agora mesmo',
        module: 'PATTERN_MATCH_60M',
        title: 'Bloqueio Imediato DjVu NCM 8708.29.99',
        codeRef: `NF-e ${randomId} pré-emissão interceptada`,
        preservedValue: 9450.00,
        dreImpactCategory: 'DEDUCOES_TRIBUTARIAS',
        status: 'PRESERVED'
      };
      setTimelineEvents(prev => [newTimelineItem, ...prev]);

      const auditHash = await sha256Hex(`DJVU_PATTERN_${randomId}_${Date.now()}`);

      if (onAddAuditRecord) {
        onAddAuditRecord({
          id: `rec_djvu_pat_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: 'evt_djvu_pattern_match_blocked',
          eventTitle: `[DJVU MEMÓRIA FISCAL] Trava de Reincidência NCM 8708.29.99`,
          sector: tenantProfile.sector,
          jurisdiction: 'BR',
          agentsInvolved: ['DjVu Memory Engine', 'Edge AI Fiscal Guard', 'SEFAZ Interceptor'],
          decisionSummary: `Reincidência fiscal impedida em <1ms. Nota fiscal continha NCM 8708.29.99 faturada como 5.102, que gerou indébito no passado. Caixa Preservado: R$ 9.450,00.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'Critical',
            summary: 'Bloqueio preventivo de emissão incorreta no ERP antes da transmissão SEFAZ.',
            kpis: [
              { label: 'Caixa Preservado', value: 'R$ 9.450,00', impact: 'positive' },
              { label: 'Latência do Edge', value: '0.71 ms', impact: 'positive' }
            ],
            invariants_checked: [
              'Invariante_Memoria_DjVu_60M = CONFERIDO',
              'Trava_Pre_Sefaz_NCM_Monofasico = ATIVADA'
            ],
            security_guard: {
              status: 'VERIFIED',
              risk_score: 95,
              source_authenticity: 'DjVu Fiscal Pattern Engine',
              requires_biometric_override: false
            },
            audit_hash: auditHash
          },
          status: 'executed',
          requiredSignatures: 1,
          signatures: [
            { role: 'DjVu Memory Guard', keyId: `secp256k1::${auditHash.slice(0, 10)}`, signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-DJVU-NCM-${randomId}`,
          invariantSnapshot: ['Invariante_Memoria_DjVu_60M', 'Trava_Pre_Sefaz_NCM_Monofasico']
        });
      }

      setIsSimulating(false);
      setFeedbackBanner('✓ Anomalia interceptada com sucesso! Caixa preservado de R$ 9.450,00 contabilizado na DRE.');
      setTimeout(() => setFeedbackBanner(null), 5000);
    }, 900);
  };

  return (
    <div id="djvu-fiscal-pattern-memory-panel" className="space-y-6">
      
      {/* Top Banner & Caixa Preservado KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 p-5 rounded-2xl border border-emerald-500/40 shadow-xl shadow-emerald-950/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Caixa Preservado Acumulado
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              D+0 CONTÁBIL
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {formatCurrency(totalPreservedCash, 'BRL', 'pt')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Valor financeiro real impedido de ser recolhido indevidamente nas guias DARF/DAS e revertido na DRE.
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              Tempo de Resposta no Edge
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              SUB-MILISSEGUNDO
            </span>
          </div>
          <div className="text-3xl font-black text-cyan-300 font-mono tracking-tight">
            0.74 ms
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Varredura contra 60 meses de histórico antes de qualquer transmissão para o gateway da SEFAZ estadual.
          </p>
        </div>

        <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Taxa de Reincidência Bloqueada
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              100% MITIGADA
            </span>
          </div>
          <div className="text-3xl font-black text-indigo-300 font-mono tracking-tight">
            {timelineEvents.length} Anomalias
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Zero reincidência de erros previamente sanados na recuperação administrativa ou judicial.
          </p>
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Sub-Tabs Nav */}
      <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('PATTERN_MATCH')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeSubTab === 'PATTERN_MATCH'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
            }`}
          >
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>1. Pattern-Match Audit (60M Ativo)</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px]">
              {patternMatches.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('SUPPLIER_XML')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeSubTab === 'SUPPLIER_XML'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
            }`}
          >
            <FileCheck className="w-4 h-4 text-indigo-400" />
            <span>2. Auditoria de XMLs de Entrada (Fornecedores)</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px]">
              {supplierXmls.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('PRESERVED_CASH_TIMELINE')}
            className={`py-2 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 ${
              activeSubTab === 'PRESERVED_CASH_TIMELINE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-md'
                : 'text-slate-400 hover:text-slate-200 bg-slate-950/50'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>3. Linha do Tempo: Caixa Preservado</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
              {formatCurrency(totalPreservedCash, 'BRL', 'pt')}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleSimulatePatternMatch}
          disabled={isSimulating}
          className="py-2 px-3.5 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-cyan-600 to-indigo-600 text-white hover:from-cyan-500 hover:to-indigo-500 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isSimulating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
          )}
          <span>Simular Emissão com NCM Reincidente</span>
        </button>
      </div>

      {/* Sub-Tab 1: Pattern Match */}
      {activeSubTab === 'PATTERN_MATCH' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <Brain className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                Memória Fiscal D+0: Cruzamento Ativo contra o Histórico de 60 Meses
              </span>
              O módulo DjVu analisa cada requisição de faturamento em sub-milissegundo antes do envio à SEFAZ. Se a nota contiver produto cujo NCM gerou recolhimento a maior nos últimos 5 anos, o sistema cancela o código tributário errôneo (ex: 5.102) e aplica a segregação monofásica com trava preventiva.
            </div>
          </div>

          <div className="space-y-3">
            {patternMatches.map((item) => (
              <div 
                key={item.id}
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-colors shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-cyan-400" />
                      NCM: {item.ncm}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {item.productDescription}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      Latência: <strong className="text-cyan-300">{item.detectionLatencyMs}ms</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      {item.status === 'BLOCKED_AT_ERP' ? 'TRAVA DISPARADA NO ERP' : 'AUTO-CORRIGIDO'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-900 mb-3">
                  <div>
                    <span className="text-rose-400 font-bold block mb-1">
                      ⚠️ CFOP Detectado no Pedido ERP:
                    </span>
                    <span className="font-mono text-rose-200 block">{item.cfopEmitted}</span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      {item.nfeNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-400 font-bold block mb-1">
                      🛡️ Correção Automática DjVu (60M):
                    </span>
                    <span className="font-mono text-emerald-200 block">{item.cfopCorrect}</span>
                    <span className="text-[11px] text-emerald-400/80 block mt-1">
                      {item.historicalRecoveryDate}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 font-medium">{item.riskReason}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px]">Vazamento Prevenido: </span>
                    <strong className="text-emerald-300 font-mono text-sm ml-1">
                      {formatCurrency(item.estimatedTaxLeakage, 'BRL', 'pt')}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Supplier XML Audit */}
      {activeSubTab === 'SUPPLIER_XML' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                Auditoria de XMLs de Entrada: Blindagem Contra Adulteração de Fornecedores
              </span>
              Monitora se fornecedores estão faturando mercadorias com NCMs genéricos ou CSTs de tributação plena para repassar carga tributária indevida ou por cadastro desatualizado, evitando que sua empresa perca o direito ao crédito monofásico na revenda.
            </div>
          </div>

          <div className="space-y-3">
            {supplierXmls.map((item) => (
              <div 
                key={item.id}
                className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-colors shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {item.supplierName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      CNPJ: {item.supplierCnpj} • Chave XML: {item.xmlKey.slice(0, 24)}...
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300">
                      Score de Conformidade: <strong className={item.supplierComplianceScore > 70 ? 'text-emerald-400' : 'text-amber-400'}>{item.supplierComplianceScore}%</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-2">
                  <div>
                    <span className="text-rose-400 font-bold block mb-1">
                      NCM Recebido no XML do Fornecedor:
                    </span>
                    <span className="font-mono text-rose-300">{item.xmlNcmReceived}</span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Item: {item.productDescription}
                    </span>
                  </div>

                  <div>
                    <span className="text-emerald-400 font-bold block mb-1">
                      NCM Homologado na Base Velatrix DjVu:
                    </span>
                    <span className="font-mono text-emerald-300">{item.certifiedMonofasicoNcm}</span>
                    <span className="text-[11px] text-emerald-400/80 block mt-1">
                      Regime: Monofásico Obrigatório (Legislação Federal)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">
                    Tipo de Divergência: <strong className="text-amber-300">{item.tamperingType}</strong>
                  </span>
                  <span className="text-slate-300 font-mono">
                    Impacto Estimado no Crédito: <strong className="text-emerald-300 font-bold">{formatCurrency(item.discrepancyImpact, 'BRL', 'pt')}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Preserved Cash Timeline */}
      {activeSubTab === 'PRESERVED_CASH_TIMELINE' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <History className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                Linha do Tempo de Erros Bloqueados & Impacto Direto na DRE
              </span>
              Cada evento de bloqueio atua diretamente na preservação de margem líquida e EBITDA da holding, prevenindo saídas de caixa desnecessárias e retificações custosas com a Receita Federal.
            </div>
          </div>

          <div className="relative pl-6 border-l-2 border-emerald-500/30 space-y-4">
            {timelineEvents.map((event) => (
              <div key={event.id} className="relative group">
                {/* Marker Dot */}
                <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-slate-950 shadow-md shadow-emerald-500/50" />

                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 group-hover:border-emerald-500/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{event.date}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                      +{formatCurrency(event.preservedValue, 'BRL', 'pt')} PRESERVADO
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">
                    {event.title}
                  </h4>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="font-mono text-slate-300">{event.codeRef}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 text-[10px] font-mono border border-slate-800">
                      Impacto DRE: {event.dreImpactCategory}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
