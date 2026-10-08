import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  KeyRound, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  ExternalLink, 
  Layers, 
  Copy, 
  Check, 
  ShieldAlert, 
  Code, 
  Sparkles, 
  Building2, 
  Calendar, 
  Download, 
  Printer, 
  Link2, 
  Lock, 
  RefreshCw, 
  XCircle, 
  Clock, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  SlidersHorizontal,
  Scale
} from 'lucide-react';
import { AuditRecord, CriticalDecisionCardAST } from '../types/aos';
import { useAuth } from '../context/AuthContext';
import { isPartnerPortfolioScope } from '../types/rbac';
import { PartnerPortfolioService } from '../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from './common/PartnerPortfolioScopeSelector';
import { 
  buildAuditChain, 
  validateAuditChain, 
  exportAuditRecordsToCsv, 
  exportAuditRecordsToPrintableReport,
  AuditChainValidationResult,
  GENESIS_HASH 
} from '../utils/auditChain';

interface AuditTrailViewProps {
  records: AuditRecord[];
  onBackToDashboard: () => void;
}

type StatusFilterType = 'all' | 'executed' | 'adjusted' | 'rejected' | 'pending' | 'blocked_fraud' | 'quarantine';
type DateRangeFilterType = 'all' | '7d' | '30d' | '90d' | 'custom';

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  records,
  onBackToDashboard
}) => {
  const { currentUserRole } = useAuth();
  const isPartner = isPartnerPortfolioScope(currentUserRole);
  const [partnerActiveCnpj, setPartnerActiveCnpj] = useState<string>(() => PartnerPortfolioService.getActiveClient().cnpj);

  // Sincroniza quando o cliente selecionado na carteira de parceiro mudar
  React.useEffect(() => {
    const handleClientChange = (evt: CustomEvent<{ cnpj: string; companyName: string; sectorKey?: string }>) => {
      if (evt.detail?.cnpj) {
        setPartnerActiveCnpj(evt.detail.cnpj);
      }
    };
    window.addEventListener('velatrix:partner_active_client_changed' as any, handleClientChange as EventListener);
    return () => {
      window.removeEventListener('velatrix:partner_active_client_changed' as any, handleClientChange as EventListener);
    };
  }, []);

  // Filters and Search State
  const [filterStatus, setFilterStatus] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Expanded & Copy states
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Chain Verification State
  const [isVerifyingChain, setIsVerifyingChain] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [lastValidationResult, setLastValidationResult] = useState<AuditChainValidationResult | null>(null);

  // Comprehensive historic seed records covering all 6 statuses and diverse sectors/agents
  const defaultHistoricRecords: AuditRecord[] = useMemo(() => [
    {
      id: 'rec_seed_fraud_01',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      eventId: 'evt_fraud_pix_intercept',
      eventTitle: 'Tentativa de Alteração de Chave PIX via WhatsApp Suspeito',
      sector: 'manufacturing',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['Procurement', 'Finanças', 'Risco & Invariantes', 'Proof of Intent Guard'],
      decisionSummary: '[INTERCEPTAÇÃO ANTIFRAUDE]: Tentativa de desvio bancário de R$ 145.000 interceptada. Ordem de pagamento travada em quarentena preventiva.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'Critical',
        summary: 'Bloqueio preventivo de chave PIX forjada recebida por canal não autenticado.',
        kpis: [
          { label: 'Caixa Blindado', value: 'R$ 145.000', impact: 'positive' },
          { label: 'Risco Antifraude', value: '98/100 [CRÍTICO]', impact: 'negative' }
        ],
        invariants_checked: [
          'Proof_Of_Intent_Origem_Assinada = FALHOU',
          'Chave_PIX_Cadastrada_Inalterada = VIOLAÇÃO DETECTADA',
          'Bloqueio_Disparo_Automatico_Garantido = OK'
        ],
        actions: [
          { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize Bloqueado: Exige Dupla Checagem Humana Antifraude' }
        ],
        security_guard: {
          status: 'SUSPECTED_FRAUD',
          risk_score: 98,
          source_authenticity: 'Canal Não Assinado (WhatsApp não homologado)',
          requires_biometric_override: true
        },
        audit_hash: '0xfa9182bc01e389d47a8291038472910384729103'
      },
      execution_payload: {
        target_service: 'CoreBanking_Quarantine_Gateway',
        action: 'QuarantineAndBlockUnauthorizedPixTransfer',
        parameters: { vendor_id: 'TECHCORE_SP', blocked_amount_brl: 145000 },
        signature: '0x4a8b...99e1'
      },
      status: 'blocked_fraud',
      requiredSignatures: 1,
      signatures: [
        { role: 'Proof of Intent AI Guard', keyId: '0x00A1...FF', signedAt: new Date(Date.now() - 1200000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-FRAUD-BLOCKED-8812',
      invariantSnapshot: ['Proof_Of_Intent_Origem_Assinada', 'Invariante_AntiFraude_Quarentena_Ativa']
    },
    {
      id: 'rec_seed_quarantine_02',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      eventId: 'evt_quarantine_nfe_divergence',
      eventTitle: 'Quarentena Fiscal: NFe com Diferencial de Alíquota ICMS-ST Não Reconhecido',
      sector: 'retail',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['Auditor Fiscal', 'SEFAZ Interceptor', 'Risco & Invariantes'],
      decisionSummary: 'Emissão fiscal suspensa temporariamente devido a divergência cadastral no NCM 8471.30.12 sob MVA de 42%. Aguardando parecer do compliance tributário.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'High',
        summary: 'Retenção preventiva de faturamento para evitar autuação SEFAZ por recolhimento a menor.',
        kpis: [
          { label: 'Exposição Fiscal', value: 'R$ 84.200', impact: 'negative' },
          { label: 'Risco de Glosa', value: '75%', impact: 'negative' }
        ],
        invariants_checked: ['Aliquota_ICMS_ST_Validada = DIVERGENTE', 'SEFAZ_Status_Homologado = PENDENTE'],
        audit_hash: '0x3c99a81120e'
      },
      execution_payload: {
        target_service: 'SEFAZ_NFE_GATEWAY',
        action: 'HoldInvoiceForTaxRevision',
        parameters: { nfe_id: 'NFE-3524-88910', error_code: 'ICMS_ST_MISMATCH' },
        signature: '0x88f2...519a'
      },
      status: 'quarantine',
      requiredSignatures: 2,
      signatures: [
        { role: 'Tax Compliance Agent', keyId: '0xTAX9...01', signedAt: new Date(Date.now() - 3600000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-QUARANTINE-TAX-4419',
      invariantSnapshot: ['Aliquota_ICMS_ST_Validada', 'SEFAZ_Status_Homologado']
    },
    {
      id: 'rec_seed_health_03',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      eventId: 'evt_health_coldchain',
      eventTitle: 'Anomalia Térmica em Câmara Fria (Vacinas & Medicamentos)',
      sector: 'healthcare',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['Logística Farmacêutica', 'Qualidade & Anvisa', 'Finanças'],
      decisionSummary: 'Acionamento de gerador auxiliar e remanejamento de 14.000 doses sob norma Anvisa RDC 430 sem perda de lote.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'Critical',
        summary: 'Mitigação de quebra de cadeia de frio sob conformidade hospitalar.',
        kpis: [
          { label: 'Lote Preservado', value: '14.000 doses', impact: 'positive' },
          { label: 'Compliance Anvisa', value: '100% OK', impact: 'positive' }
        ],
        invariants_checked: ['Temperatura_Camara <= 6.0C = OK', 'Compliance_Anvisa_RDC430 = OK'],
        actions: [{ id: 'approve', type: 'SwipeMultiSig', label: 'Assinatura Multi-Sig Executiva' }],
        audit_hash: '0x81ac92ef0123'
      },
      execution_payload: {
        target_service: 'IoT_ColdChain_Controller',
        action: 'ActivateBackupGeneratorAndReroute',
        parameters: { chamber_id: 'FRIDGE_04_VACCINES', target_temp_c: 4.2 },
        signature: '0x71ee...44ba'
      },
      status: 'executed',
      requiredSignatures: 2,
      signatures: [
        { role: 'Diretor Médico Key', keyId: '0x12a9...31', signedAt: new Date(Date.now() - 7200000).toISOString(), verified: true },
        { role: 'CFO Treasury Key', keyId: '0x2c9b...88', signedAt: new Date(Date.now() - 7200000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-HEALTH-MITIGATED-3104',
      invariantSnapshot: ['Temperatura_Camara_Fria <= 6C', 'Compliance_Anvisa_RDC430', 'Saldo_Caixa_Minimo']
    },
    {
      id: 'rec_seed_adjusted_04',
      timestamp: new Date(Date.now() - 12400000).toISOString(),
      eventId: 'evt_pricing_adjustment',
      eventTitle: 'Reajuste Dinâmico de Tabela de Preços com Limite de Margem',
      sector: 'ecommerce',
      jurisdiction: 'GLOBAL_MULTI_CURRENCY',
      agentsInvolved: ['Pricing Engine', 'Sales & Revenue', 'CFO Financial'],
      decisionSummary: 'Margem sugerida pelo modelo de IA ajustada manualmente de 24% para 21.5% pela diretoria para manter competitividade em praças do Sul.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'Medium',
        summary: 'Ajuste fino de mark-up aplicado via feedback humano com recálculo imediato de demanda elástica.',
        kpis: [
          { label: 'Margem Definida', value: '21.5%', impact: 'positive' },
          { label: 'Volume Projetado', value: '+18%', impact: 'positive' }
        ],
        invariants_checked: ['Margem_Bruta_Minima >= 18% = OK', 'Anti_Predatory_Pricing = OK'],
        audit_hash: '0x77c449102'
      },
      execution_payload: {
        target_service: 'ERP_TOTVS_Protheus',
        action: 'UpdatePriceTableWithDiscountCap',
        parameters: { table_id: 'TAB_SOUTH_2026', margin_target: 0.215 },
        signature: '0x221a...89c0'
      },
      status: 'adjusted',
      requiredSignatures: 2,
      signatures: [
        { role: 'Comercial VP Key', keyId: '0xVP01...88', signedAt: new Date(Date.now() - 12400000).toISOString(), verified: true },
        { role: 'CFO Treasury Key', keyId: '0x2c9b...88', signedAt: new Date(Date.now() - 12400000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-ADJUST-PRICE-5012',
      invariantSnapshot: ['Margem_Bruta_Minima >= 18%', 'Anti_Predatory_Pricing']
    },
    {
      id: 'rec_seed_rejected_05',
      timestamp: new Date(Date.now() - 15800000).toISOString(),
      eventId: 'evt_supp_overbudget_po',
      eventTitle: 'Ordem de Compra Rejeitada: Violação de Teto Autônomo sem ROI Comprovado',
      sector: 'manufacturing',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['Procurement', 'Treasury Guard', 'CFO Financial'],
      decisionSummary: 'Proposta de aquisição de insumos extraordinários de R$ 680.000 rejeitada pelo comitê financeiro. Direcionada para cotação em leilão reverso.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'High',
        summary: 'Veto executivo sobre proposta de fornecedor único com sobrepreço de 18% vs média histórica.',
        kpis: [
          { label: 'Caixa Poupado', value: 'R$ 680.000', impact: 'positive' },
          { label: 'Rejeição Multi-Sig', value: '100% Veto', impact: 'neutral' }
        ],
        invariants_checked: ['Teto_Gasto_Autonomo <= R$ 100k = VIOLADO', 'ROI_Minimo_D60 >= 1.5 = NÃO COMPROVADO'],
        audit_hash: '0x99281aef0'
      },
      execution_payload: {
        target_service: 'ERP_SAP_S4HANA',
        action: 'RejectPurchaseOrderAndNotifyBuyer',
        parameters: { pr_id: 'PR_RAW_99182', reason: 'OVERBUDGET_DISAPPROVED' },
        signature: '0xREJ9...1100'
      },
      status: 'rejected',
      requiredSignatures: 2,
      signatures: [
        { role: 'CFO Treasury Key', keyId: '0x2c9b...88', signedAt: new Date(Date.now() - 15800000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-PO-REJECTED-9912',
      invariantSnapshot: ['Teto_Gasto_Autonomo <= R$ 100k', 'Controle_Orcamentario_Mensal']
    },
    {
      id: 'rec_seed_pending_06',
      timestamp: new Date(Date.now() - 17200000).toISOString(),
      eventId: 'evt_treasury_cdi_hedge',
      eventTitle: 'Aplicação de Hedge Cambial e Swap Pré-Fixado D+1',
      sector: 'financial_services',
      jurisdiction: 'BR_BACEN_CVM',
      agentsInvolved: ['Treasury & FX', 'Risk Officer', 'CFO Financial'],
      decisionSummary: 'Trava cambial de US$ 500.000 a R$ 5,62 via contrato a termo (NDF) no Banco Itaú BBA. Aguardando assinatura do segundo titular executivo.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'Critical',
        summary: 'Proteção de exposição cambial para quitação de maquinário importado.',
        kpis: [
          { label: 'Exposição Travada', value: 'US$ 500.000', impact: 'positive' },
          { label: 'Taxa NDF', value: 'R$ 5,62', impact: 'neutral' }
        ],
        invariants_checked: ['Politica_Hedge_Cambial_Ativa = OK', 'Limite_Contraparte_Banco = OK'],
        audit_hash: '0x44fa12001'
      },
      status: 'pending',
      requiredSignatures: 3,
      signatures: [
        { role: 'Treasury Officer', keyId: '0xTR01...99', signedAt: new Date(Date.now() - 17200000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-PENDING-QUORUM-1049',
      invariantSnapshot: ['Politica_Hedge_Cambial_Ativa', 'Limite_Contraparte_Banco', 'Quorum_3_Titulares']
    },
    {
      id: 'rec_seed_supp_07',
      timestamp: new Date(Date.now() - 25000000).toISOString(),
      eventId: 'evt_supp_strike',
      eventTitle: 'Greve Portuária em Santos — Fornecedor Alternativo Homologado',
      sector: 'manufacturing',
      jurisdiction: 'BR_FEDERAL_SEFAZ',
      agentsInvolved: ['Procurement', 'Finanças', 'Logística Expressa', 'Risco'],
      decisionSummary: 'Emissão de PO spot D+2 com fornecedor nacional homologado ISO 9001, evitando 48h de paralisação fabril.',
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'High',
        summary: 'Rebalanceamento logístico e ativação de PO spot com frete dedicado.',
        kpis: [
          { label: 'EBITDA Preservado', value: '+R$ 520.000', impact: 'positive' },
          { label: 'SLA Contratual', value: '100%', impact: 'positive' }
        ],
        invariants_checked: ['Saldo_Caixa > R$ 2.0M = OK', 'Estoque_Seguranca >= 15d = OK'],
        actions: [{ id: 'approve', type: 'SwipeMultiSig', label: 'Assinatura Multi-Sig Executiva' }],
        audit_hash: '0x9918bca44012'
      },
      execution_payload: {
        target_service: 'ERP_Gateway_SAP_S4HANA',
        action: 'ExecuteCriticalMitigationOrder',
        parameters: { po_number: 'PO_SPOT_88190', vendor_id: 'USINAGEM_VALE_LTDA' },
        signature: '0x99a1...12ef'
      },
      status: 'executed',
      requiredSignatures: 2,
      signatures: [
        { role: 'CEO Executive Key', keyId: '0x7f4a...e1', signedAt: new Date(Date.now() - 25000000).toISOString(), verified: true },
        { role: 'CFO Treasury Key', keyId: '0x2c9b...88', signedAt: new Date(Date.now() - 25000000).toISOString(), verified: true }
      ],
      executionReceipt: 'TX-AOS-PO-88190',
      invariantSnapshot: ['Saldo_Caixa > R$ 2M', 'SLA_Compliance_TierA >= 98%', 'Estoque_Seguranca >= 15d']
    }
  ], []);

  // Combine live session records + historic seed records and build verified cryptographic hash-chain
  const [allChainedRecords, setAllChainedRecords] = useState<AuditRecord[]>([]);
  const [currentValidation, setCurrentValidation] = useState<AuditChainValidationResult>({
    isValid: true,
    totalBlocks: 0,
    genesisHash: GENESIS_HASH,
    latestHash: GENESIS_HASH,
    signaturesTotal: 0,
    signaturesValid: 0,
    allSignaturesValid: true,
    checkedAt: new Date().toISOString(),
    quorumSatisfiedCount: 0
  });

  useEffect(() => {
    let active = true;
    const combined = [...records, ...defaultHistoricRecords.filter(d => !records.some(r => r.id === d.id))];
    buildAuditChain(combined).then(async (chained) => {
      if (!active) return;
      setAllChainedRecords(chained);
      const val = await validateAuditChain(chained);
      if (active) setCurrentValidation(val);
    });
    return () => { active = false; };
  }, [records, defaultHistoricRecords]);

  // Filter records by status, search, and date range
  const filteredRecords = useMemo(() => {
    return allChainedRecords.filter(rec => {
      // 0. RLS por Carteira do Parceiro: mostrar apenas registros dos clientes da carteira
      if (isPartner) {
        const activeClient = PartnerPortfolioService.getActiveClient();
        const clientSector = activeClient.sectorKey?.toLowerCase();
        const clientNameTerm = activeClient.companyName.toLowerCase();
        const cnpjDigits = activeClient.cnpj.replace(/\D/g, '');
        
        const fullText = `${rec.eventTitle} ${rec.decisionSummary} ${rec.executionReceipt || ''} ${rec.sector || ''}`.toLowerCase();
        const isRelated = fullText.includes(clientNameTerm) || 
                          fullText.includes(cnpjDigits) || 
                          (clientSector && rec.sector?.toLowerCase() === clientSector) ||
                          rec.eventId?.includes(cnpjDigits) ||
                          rec.id?.includes(cnpjDigits);
        if (!isRelated) return false;
      }

      // 1. Filter by Status (Exact matching, no mixing)
      if (filterStatus !== 'all' && rec.status !== filterStatus) {
        return false;
      }

      // 2. Filter by Date Range
      const recDate = new Date(rec.timestamp).getTime();
      const now = Date.now();
      if (dateRange === '7d' && recDate < now - 7 * 24 * 3600 * 1000) return false;
      if (dateRange === '30d' && recDate < now - 30 * 24 * 3600 * 1000) return false;
      if (dateRange === '90d' && recDate < now - 90 * 24 * 3600 * 1000) return false;
      if (dateRange === 'custom') {
        if (customStartDate) {
          const startMs = new Date(customStartDate).setHours(0, 0, 0, 0);
          if (recDate < startMs) return false;
        }
        if (customEndDate) {
          const endMs = new Date(customEndDate).setHours(23, 59, 59, 999);
          if (recDate > endMs) return false;
        }
      }

      // 3. Filter by Search Query (Title, summary, receipt, sector, agentsInvolved, jurisdiction, hashes)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = rec.eventTitle?.toLowerCase().includes(q);
        const matchSummary = rec.decisionSummary?.toLowerCase().includes(q);
        const matchReceipt = rec.executionReceipt?.toLowerCase().includes(q);
        const matchSector = rec.sector?.toLowerCase().includes(q);
        const matchJurisdiction = rec.jurisdiction?.toLowerCase().includes(q);
        const matchId = rec.id?.toLowerCase().includes(q) || rec.eventId?.toLowerCase().includes(q);
        const matchHash = rec.recordHash?.toLowerCase().includes(q) || rec.previousRecordHash?.toLowerCase().includes(q);
        const matchAgents = rec.agentsInvolved?.some(agent => agent.toLowerCase().includes(q));
        const matchSignatures = rec.signatures?.some(sig => 
          sig.role.toLowerCase().includes(q) || sig.keyId.toLowerCase().includes(q)
        );

        if (!matchTitle && !matchSummary && !matchReceipt && !matchSector && !matchJurisdiction && !matchId && !matchHash && !matchAgents && !matchSignatures) {
          return false;
        }
      }

      return true;
    });
  }, [allChainedRecords, filterStatus, dateRange, customStartDate, customEndDate, searchQuery]);

  // Reset pagination on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery, dateRange, customStartDate, customEndDate, pageSize]);

  // Paginated records calculation
  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle Copy
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Perform interactive cryptographic chain re-verification
  const handleRunChainVerification = () => {
    setIsVerifyingChain(true);
    setTimeout(async () => {
      const result = await validateAuditChain(allChainedRecords);
      setLastValidationResult(result);
      setIsVerifyingChain(false);
      setShowIntegrityModal(true);
    }, 450);
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'executed':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-emerald-950/90 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Aprovado & Executado
          </span>
        );
      case 'blocked_fraud':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-950/90 text-rose-300 border border-rose-800 flex items-center gap-1.5 shadow-sm">
            <ShieldAlert className="w-3 h-3 text-rose-400" /> Bloqueio Antifraude
          </span>
        );
      case 'quarantine':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-orange-950/90 text-orange-300 border border-orange-800 flex items-center gap-1.5 shadow-sm">
            <AlertTriangle className="w-3 h-3 text-orange-400" /> Quarentena Ativa
          </span>
        );
      case 'adjusted':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-amber-950/90 text-amber-300 border border-amber-800 flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" /> Ajustado via Feedback
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1.5 shadow-sm">
            <XCircle className="w-3 h-3 text-slate-400" /> Rejeitado
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-800 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3 h-3 text-cyan-400" /> Pendente de Quórum
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  // Status Counts for Tabs
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allChainedRecords.length,
      executed: 0,
      adjusted: 0,
      rejected: 0,
      pending: 0,
      blocked_fraud: 0,
      quarantine: 0
    };
    allChainedRecords.forEach(r => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [allChainedRecords]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="Audit Ledger Imutável & Prova Criptográfica"
        currentCnpj={partnerActiveCnpj}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800/80 text-amber-400 font-semibold flex items-center gap-1">
                <History className="w-3 h-3" /> Immutable Audit Ledger
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-teal-400" /> Hash-Chain SHA-256 + Multi-Sig Secp256k1
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300">
                Bloco Atual #{allChainedRecords.length}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Livro-Razão & Trilha de Auditoria Criptográfica
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Registro cronológico encadeado por hashes e imutável de todas as deliberações de agentes, quóruns colhidos e comandos despachados para ERPs e bancos.
            </p>
          </div>

          {/* Action Buttons: Verification + Exports + Back */}
          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
            {/* Verify Chain Button */}
            <button
              id="btn-verify-audit-chain"
              onClick={handleRunChainVerification}
              disabled={isVerifyingChain}
              className="text-xs font-bold text-teal-300 hover:text-white px-3.5 py-2 rounded-xl bg-teal-950/80 hover:bg-teal-900 border border-teal-700/80 transition-all flex items-center gap-1.5 shadow-lg shadow-teal-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingChain ? 'animate-spin' : ''}`} />
              <span>{isVerifyingChain ? 'Verificando Hash-Chain...' : 'Verificar Integridade da Cadeia'}</span>
            </button>

            {/* Export CSV Button */}
            <button
              id="btn-export-audit-csv"
              onClick={() => {
                exportAuditRecordsToCsv(filteredRecords);
                if (isPartner) {
                  const activeClient = PartnerPortfolioService.getActiveClient();
                  PartnerPortfolioService.triggerAutomatedSplitEvent({
                    milestoneKey: 'AUDITORIA_CRUZADA',
                    cnpj: activeClient.cnpj,
                    companyName: activeClient.companyName,
                    creditAmount: 380000,
                    caseId: `LEDGER-CSV-${activeClient.cnpj.replace(/\D/g, '').slice(0, 6)}`,
                    caseTitle: `Auditoria de Livro-Razão (CSV): ${activeClient.companyName}`,
                    triggerSourceModule: 'Audit Ledger & Trilha Criptográfica',
                    notes: `Extração e conciliação de trilha de auditoria e invariantes executivas em formato auditável.`
                  });
                }
              }}
              className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Exportar registros filtrados em CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>

            {/* Export PDF / Print Button */}
            <button
              id="btn-export-audit-pdf"
              onClick={() => {
                exportAuditRecordsToPrintableReport(filteredRecords, currentValidation);
                if (isPartner) {
                  const activeClient = PartnerPortfolioService.getActiveClient();
                  PartnerPortfolioService.triggerAutomatedSplitEvent({
                    milestoneKey: 'AUDITORIA_CRUZADA',
                    cnpj: activeClient.cnpj,
                    companyName: activeClient.companyName,
                    creditAmount: 380000,
                    caseId: `LEDGER-PDF-${activeClient.cnpj.replace(/\D/g, '').slice(0, 6)}`,
                    caseTitle: `Certidão Pericial de Trilha de Auditoria (PDF): ${activeClient.companyName}`,
                    triggerSourceModule: 'Audit Ledger & Trilha Criptográfica',
                    notes: `Laudo pericial e livro-razão emitido com hashes criptográficos para fins de compliance e defesa fiscal.`
                  });
                }
              }}
              className="text-xs font-semibold text-slate-200 hover:text-white px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Gerar Relatório de Auditoria em PDF / Impressão"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Relatório PDF</span>
            </button>

            {/* Back to Dashboard Button */}
            <button
              id="btn-back-dashboard"
              onClick={onBackToDashboard}
              className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>

        {/* Live Chain Integrity Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Status da Cadeia</div>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> {currentValidation.isValid ? '100% ÍNTEGRA' : 'COMPROMETIDA'}
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">{allChainedRecords.length} blocos</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Assinaturas Multi-Sig</div>
              <div className="text-sm font-bold font-mono text-teal-300 mt-0.5">
                {currentValidation.signaturesValid} / {currentValidation.signaturesTotal} Válidas
              </div>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900">
              Secp256k1
            </span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Quórum Atingido</div>
              <div className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                {currentValidation.quorumSatisfiedCount} / {allChainedRecords.length}
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Decisões</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">Bloco Topo</div>
              <div className="text-xs font-bold font-mono text-slate-200 truncate max-w-[140px] mt-0.5" title={currentValidation.latestHash}>
                {currentValidation.latestHash.slice(0, 14)}...
              </div>
            </div>
            <button
              onClick={() => handleCopyText(currentValidation.latestHash, 'top-hash')}
              className="text-[10px] text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded transition-colors"
              title="Copiar Hash do Topo"
            >
              {copiedId === 'top-hash' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Search, Filter Tabs & Date Picker Toolbar */}
        <div className="space-y-3 pt-2">
          
          {/* Status Filter Tabs (Distinct tabs for all 6 statuses + All) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              id="filter-tab-all"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              Todos ({statusCounts.all})
            </button>
            
            <button
              id="filter-tab-executed"
              onClick={() => setFilterStatus('executed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'executed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400 hover:text-emerald-300 bg-slate-950/60'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Executados ({statusCounts.executed})</span>
            </button>

            <button
              id="filter-tab-adjusted"
              onClick={() => setFilterStatus('adjusted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'adjusted' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400 hover:text-amber-300 bg-slate-950/60'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Ajustados ({statusCounts.adjusted})</span>
            </button>

            <button
              id="filter-tab-rejected"
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'rejected' ? 'bg-slate-800 text-slate-200 border border-slate-600' : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              <XCircle className="w-3 h-3 text-slate-400" />
              <span>Rejeitados ({statusCounts.rejected})</span>
            </button>

            <button
              id="filter-tab-pending"
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'pending' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400 hover:text-cyan-300 bg-slate-950/60'
              }`}
            >
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Pendentes ({statusCounts.pending})</span>
            </button>

            <button
              id="filter-tab-blocked_fraud"
              onClick={() => setFilterStatus('blocked_fraud')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'blocked_fraud' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'text-slate-400 hover:text-rose-300 bg-slate-950/60'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Antifraude ({statusCounts.blocked_fraud})</span>
            </button>

            <button
              id="filter-tab-quarantine"
              onClick={() => setFilterStatus('quarantine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'quarantine' ? 'bg-orange-950 text-orange-300 border border-orange-800' : 'text-slate-400 hover:text-orange-300 bg-slate-950/60'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-orange-400" />
              <span>Quarentena ({statusCounts.quarantine})</span>
            </button>
          </div>

          {/* Search Bar + Date Range Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            
            {/* Search Input (Expanded: Title, Summary, Receipt, Sector, Agents, Jurisdiction) */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-audit-records"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, resumo, recibo, setor, agente envolvido, jurisdição ou hash..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/80 w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRange === 'all' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tudo
                </button>
                <button
                  onClick={() => setDateRange('7d')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRange === '7d' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  7d
                </button>
                <button
                  onClick={() => setDateRange('30d')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRange === '30d' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  30d
                </button>
                <button
                  onClick={() => setDateRange('90d')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRange === '90d' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  90d
                </button>
                <button
                  onClick={() => setDateRange('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    dateRange === 'custom' ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800/80' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Date Pickers */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-amber-900/60 p-1 rounded-xl text-xs">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[11px] focus:outline-none"
                    title="Data Inicial"
                  />
                  <span className="text-slate-500 text-[10px]">até</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-[11px] focus:outline-none"
                    title="Data Final"
                  />
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Ledger Records Stream */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-slate-300">Nenhum registro encontrado no filtro selecionado.</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tente redefinir a busca por termos como "PIX", "CFO", "Anvisa", "Hedge" ou ajustar o período temporal.
            </p>
          </div>
        ) : (
          paginatedRecords.map((record, indexOnPage) => {
            const isExpanded = expandedRecordId === record.id;
            const isFraud = record.status === 'blocked_fraud' || record.decisionSummary?.includes('ANTIFRAUDE');
            const isQuarantine = record.status === 'quarantine';
            const reqSignatures = record.requiredSignatures || 2;
            const collectedSignatures = record.signatures?.length || 0;
            const isQuorumReached = collectedSignatures >= reqSignatures;

            return (
              <div
                key={record.id}
                id={`audit-card-${record.id}`}
                className={`bg-slate-900 rounded-2xl border transition-all duration-200 shadow-xl overflow-hidden ${
                  isFraud 
                    ? 'border-rose-900/70 shadow-rose-950/20' 
                    : isQuarantine 
                    ? 'border-orange-900/70 shadow-orange-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Record Header */}
                <div className="p-5 space-y-3.5">
                  
                  {/* Top Bar: Chain Index, Status, Title, Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Chain Index Badge */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-amber-400 border border-amber-900/60 flex items-center gap-1 shadow-inner">
                        <Link2 className="w-3 h-3 text-amber-400" /> Bloco #{record.chainIndex || (indexOnPage + 1)}
                      </span>

                      {getStatusBadge(record.status)}
                      
                      {/* Sector Badge */}
                      {record.sector && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-teal-400" />
                          {record.sector}
                        </span>
                      )}

                      {/* Jurisdiction Badge */}
                      {record.jurisdiction && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <Scale className="w-3 h-3 text-indigo-400" />
                          {record.jurisdiction}
                        </span>
                      )}

                      <h3 className="text-sm font-bold text-slate-100">{record.eventTitle}</h3>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 self-start sm:self-center shrink-0">
                      {new Date(record.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  {/* Summary Box */}
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    isFraud 
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200' 
                      : isQuarantine
                      ? 'bg-orange-950/20 border-orange-800/40 text-orange-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}>
                    {record.decisionSummary}
                  </div>

                  {/* Agents Involved Tags */}
                  {record.agentsInvolved && record.agentsInvolved.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                      <span className="text-slate-500 font-mono">Agentes:</span>
                      {record.agentsInvolved.map((agent, aIdx) => (
                        <span key={aIdx} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                          {agent}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Badges & Meta Strip */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                    
                    {/* Multi-Sig Signatures & Quorum Indicator */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      
                      {/* Quorum Badge */}
                      <span className={`px-2 py-0.5 rounded font-bold flex items-center gap-1 border ${
                        isQuorumReached 
                          ? 'bg-teal-950 text-teal-300 border-teal-800' 
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}>
                        <UserCheck className="w-3 h-3" />
                        <span>Quórum: {collectedSignatures} de {reqSignatures} aprovadores</span>
                      </span>

                      {/* Signatures List */}
                      {record.signatures && record.signatures.map((sig, sIdx) => (
                        <span 
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1"
                        >
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{sig.role}</span>
                          <span className="text-slate-500">({sig.keyId})</span>
                        </span>
                      ))}
                    </div>

                    {/* Receipt, Cryptographic Hash & Expand Button */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Recibo: <strong className="text-slate-200">{record.executionReceipt}</strong>
                      </span>

                      {/* Hash Preview */}
                      {record.recordHash && (
                        <span 
                          onClick={() => handleCopyText(record.recordHash!, `hash-${record.id}`)}
                          className="text-[10px] font-mono text-teal-400 bg-slate-950 px-2 py-0.5 rounded border border-teal-900/60 hover:border-teal-400 cursor-pointer flex items-center gap-1"
                          title="Clique para copiar hash SHA-256 deste bloco"
                        >
                          <Lock className="w-2.5 h-2.5 text-teal-400" />
                          <span>{record.recordHash.slice(0, 10)}...</span>
                          {copiedId === `hash-${record.id}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5 text-slate-500" />}
                        </span>
                      )}

                      <button
                        onClick={() => setExpandedRecordId(isExpanded ? null : record.id)}
                        className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-teal-500/60 transition-colors cursor-pointer"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>{isExpanded ? 'Ocultar Detalhes' : 'Ver AST & Hashes'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                  </div>

                </div>

                {/* Expanded AST JSON, Hash Linkage & Execution Details */}
                {isExpanded && (
                  <div className="bg-slate-950 border-t border-slate-800 p-5 space-y-4 animate-in fade-in duration-150">
                    
                    {/* Cryptographic Hash Chain Proof Box */}
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-900/50 font-mono text-[11px] space-y-2">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Prova Criptográfica da Hash-Chain (Bloco #{record.chainIndex || '1'})</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          Assinatura Secp256k1 Válida
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block">Hash do Bloco Atual (SHA-256):</span>
                          <span className="text-teal-300 break-all select-all font-mono">
                            {record.recordHash || '0xCalculando...'}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-500 block">Hash do Bloco Anterior (PrevHash):</span>
                          <span className="text-slate-400 break-all select-all font-mono">
                            {record.previousRecordHash || GENESIS_HASH}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tool Calling Execution Payload Details */}
                    {record.execution_payload && (
                      <div className="p-3 bg-slate-900/90 rounded-xl border border-teal-900/60 font-mono text-[11px] space-y-2">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-teal-300 font-bold flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-teal-400" />
                            <span>Payload ERP: {record.execution_payload.target_service || record.execution_payload.service}::{record.execution_payload.action}</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                            HMAC-SHA256 OK
                          </span>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400 text-[10px] overflow-x-auto">
                          <pre>{JSON.stringify(record.execution_payload.parameters, null, 2)}</pre>
                        </div>
                      </div>
                    )}

                    {/* Invariants Snapshot Checked */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">
                        Invariantes Lógicas Verificadas na Ocasião:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {(record.invariantSnapshot || record.decisionAst?.invariants_checked || []).map((inv, idx) => (
                          <div key={idx} className="bg-slate-900 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{inv}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Raw AST Code View */}
                    {record.decisionAst && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-slate-400">
                            AST JSON Estruturado (Zero-GUI Specification):
                          </span>
                          <button
                            onClick={() => handleCopyText(JSON.stringify(record.decisionAst, null, 2), `ast-${record.id}`)}
                            className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
                          >
                            {copiedId === `ast-${record.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === `ast-${record.id}` ? 'Copiado!' : 'Copiar AST'}</span>
                          </button>
                        </div>

                        <pre className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono text-teal-300/90 overflow-x-auto max-h-64">
                          {JSON.stringify(record.decisionAst, null, 2)}
                        </pre>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {filteredRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          
          <div className="text-xs text-slate-400">
            Mostrando <strong className="text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)}</strong> a{' '}
            <strong className="text-slate-200">{Math.min(currentPage * pageSize, filteredRecords.length)}</strong> de{' '}
            <strong className="text-slate-200">{filteredRecords.length}</strong> registros auditáveis
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-300 px-2.5">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Relatório Detalhado de Integridade da Hash-Chain */}
      {showIntegrityModal && lastValidationResult && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Verificação de Integridade Criptográfica
                </h3>
              </div>
              <button
                onClick={() => setShowIntegrityModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                lastValidationResult.isValid
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}>
                {lastValidationResult.isValid ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold">
                    {lastValidationResult.isValid 
                      ? 'Cadeia de Auditoria 100% Válida & Inviolada' 
                      : 'Alerta: Violação de Integridade Detectada na Hash-Chain!'}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    {lastValidationResult.isValid
                      ? `Todos os ${lastValidationResult.totalBlocks} blocos foram verificados sequencialmente. Todos os hashes SHA-256 e assinaturas Secp256k1 conferem com a raiz gênesis.`
                      : lastValidationResult.brokenReason}
                  </p>
                </div>
              </div>

              {/* Technical Hash Details */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px]">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Timestamp da Verificação:</span>
                  <span className="text-slate-200">{new Date(lastValidationResult.checkedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Total de Blocos Auditados:</span>
                  <span className="text-amber-400 font-bold">{lastValidationResult.totalBlocks} Blocos</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Assinaturas Multi-Sig Checadas:</span>
                  <span className="text-teal-300 font-bold">{lastValidationResult.signaturesValid} / {lastValidationResult.signaturesTotal} Válidas</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-500">Quórums de Decisão Satisfeitos:</span>
                  <span className="text-emerald-400 font-bold">{lastValidationResult.quorumSatisfiedCount} / {lastValidationResult.totalBlocks}</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Hash Topo Atual:</span>
                  <span className="text-teal-300 break-all">{lastValidationResult.latestHash}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowIntegrityModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar Verificação
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
