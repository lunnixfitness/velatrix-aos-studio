import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  Building2, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Filter, 
  Search, 
  Plus, 
  Download, 
  Sparkles, 
  Share2, 
  Wallet, 
  ShieldCheck, 
  CreditCard, 
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Fingerprint,
  Eye,
  FileText,
  Copy,
  Scale,
  Shield,
  Layers,
  ArrowRight,
  Info,
  X,
  Receipt,
  GraduationCap,
  FileDown,
  UserPlus,
  Landmark,
  QrCode,
  Link2
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { SharedTenantTaxData, TenantTaxRecoveryBridge } from '../../services/tenantTaxRecoveryBridge';
import { 
  RevenueShieldService, 
  RevenueShieldState
} from '../../services/revenueShieldService';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { 
  PartnerPortfolioService, 
  AutomatedSplitEvent 
} from '../../services/partnerPortfolioService';
import { 
  PartnerGrowthService, 
  PartnerAuditedClient, 
  PartnerProfile 
} from '../../services/partnerGrowthService';
import { 
  generateWhiteLabelPartnerDossierPdf, 
  generatePartnerSuccessFeeContractPdf 
} from '../../services/pdfReportService';
import { UnifiedTenantService } from '../../services/unifiedTenantService';
import { TaxRecoveryDocPreviewModal, TaxDocPreviewType } from './TaxRecoveryDocPreviewModal';
import { RevenueShieldPaymentModal } from './RevenueShieldPaymentModal';
import { PartnerPayoutAccountForm } from './PartnerPayoutAccountForm';
import { PartnerWhiteLabelKitModal } from './PartnerWhiteLabelKitModal';
import { PartnerAcademySection } from './PartnerAcademySection';
import { CustomSplitDealModal, CustomSplitDealData } from './CustomSplitDealModal';
import { SimulatedSplitPaymentModal } from './SimulatedSplitPaymentModal';
import { 
  SplitPaymentSimulationService, 
  SplitPaymentCharge 
} from '../../services/splitPaymentSimulationService';
import { AuditRecord, NavigationTab } from '../../types/aos';

export type OperationCategory = 'RECUPERACAO_TRIBUTARIA_PONTUAL' | 'ASSINATURA_SAAS_RECORRENTE';

export interface PartnerClientLead {
  id: string;
  companyName: string;
  cnpj: string;
  sector: string;
  regime: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real';
  operationType: OperationCategory;
  operationTitle: string;
  annualRevenue: number;
  grossAmount: number; // Valor Bruto da Operação
  partnerSplitPct: number; // 70% ou 0%
  partnerSplitAmount: number; // Valor R$ Parte do Parceiro
  velatrixSplitPct: number; // 30% ou 100%
  velatrixSplitAmount: number; // Valor R$ Parte Velatrix
  funnelStage: 'PERICIA_D0' | 'PROTOCOLADO_RFB' | 'TRANSACAO_PGFN' | 'HOMOLOGADO' | 'COMPENSADO_LIQUIDADO';
  funnelStageLabel: string;
  lastUpdate: string;
  proofHash?: string;
  notes?: string;
}

interface PartnerNetworkSplitPanelProps {
  tenantData?: SharedTenantTaxData;
  onNavigateTab?: (tab: NavigationTab) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const PartnerNetworkSplitPanel: React.FC<PartnerNetworkSplitPanelProps> = ({ 
  tenantData, 
  onNavigateTab,
  onAddAuditRecord 
}) => {
  const { currentUserRole } = useAuth();
  const isPartner = isPartnerPortfolioScope(currentUserRole);

  const [shieldState, setShieldState] = useState<RevenueShieldState>(() => RevenueShieldService.get());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [isCustomSplitModalOpen, setIsCustomSplitModalOpen] = useState<boolean>(false);
  const [customSplitDeals, setCustomSplitDeals] = useState<CustomSplitDealData[]>([]);
  const [isWhiteLabelModalOpen, setIsWhiteLabelModalOpen] = useState<boolean>(false);
  const [selectedWhiteLabelClient, setSelectedWhiteLabelClient] = useState<PartnerAuditedClient | null>(null);
  const [selectedOperationForDetail, setSelectedOperationForDetail] = useState<PartnerClientLead | null>(null);
  
  // Tax Recovery Document Preview Modal State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewDocType, setPreviewDocType] = useState<TaxDocPreviewType>('white_label_dossier');
  const [previewSelectedClient, setPreviewSelectedClient] = useState<PartnerAuditedClient | null>(null);

  // Partner profile
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile>(() => PartnerGrowthService.getProfile());
  const [auditedClients, setAuditedClients] = useState<PartnerAuditedClient[]>(() => PartnerGrowthService.getClients());

  // Automated split events triggered by real operational milestone deliveries
  const [automatedSplits, setAutomatedSplits] = useState<AutomatedSplitEvent[]>(() => 
    PartnerPortfolioService.getAutomatedSplits()
  );

  useEffect(() => {
    const handleNewSplit = () => {
      setAutomatedSplits(PartnerPortfolioService.getAutomatedSplits());
    };
    window.addEventListener('velatrix:automated_split_created', handleNewSplit);
    return () => {
      window.removeEventListener('velatrix:automated_split_created', handleNewSplit);
    };
  }, []);

  // Default contractual parameters formalized
  const [partnerSplitRate, setPartnerSplitRate] = useState<number>(70); // 70% Partner, 30% Velatrix
  const [successFeeRate, setSuccessFeeRate] = useState<number>(20); // 20% Success Fee sobre benefício econômico
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [copiedDealId, setCopiedDealId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'carteira' | 'cobrancas_split' | 'academy' | 'white_label' | 'regras_split' | 'conta_pix'>('carteira');

  // Automated Split Payment Simulation (Escrow D+0)
  const [simulatedCharges, setSimulatedCharges] = useState<SplitPaymentCharge[]>(() => 
    SplitPaymentSimulationService.getCharges()
  );
  const [selectedChargeForModal, setSelectedChargeForModal] = useState<SplitPaymentCharge | null>(null);
  const [isSplitPaymentModalOpen, setIsSplitPaymentModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = SplitPaymentSimulationService.subscribe((charges) => {
      setSimulatedCharges(charges);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = RevenueShieldService.subscribe((state) => {
      setShieldState(state);
    });
    return unsub;
  }, []);

  // Clients & Operations referred by the partner
  const [clients, setClients] = useState<PartnerClientLead[]>([
    {
      id: 'lead-1',
      companyName: 'Vortex Logística & Manufatura S.A.',
      cnpj: '33.041.260/0001-88',
      sector: 'Manufatura & Indústria',
      regime: 'Lucro Real',
      operationType: 'RECUPERACAO_TRIBUTARIA_PONTUAL',
      operationTitle: 'Recuperação PIS/COFINS Exclusão ICMS (Tema 69 STF) - 60 Meses',
      annualRevenue: 54000000,
      grossAmount: 497000.00, // Success fee 20% sobre R$ 2.485.000
      partnerSplitPct: 70,
      partnerSplitAmount: 347900.00, // 70%
      velatrixSplitPct: 30,
      velatrixSplitAmount: 149100.00, // 30%
      funnelStage: 'HOMOLOGADO',
      funnelStageLabel: 'Homologado RFB (DCOMP Pronto)',
      lastUpdate: 'Hoje, 10:14',
      proofHash: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d',
      notes: 'Crédito homologado perante a DRF São Paulo. Split pronto para quitação via Gateway PIX.'
    },
    {
      id: 'lead-2',
      companyName: 'Rede Farma Mais Distribuição Ltda',
      cnpj: '12.840.119/0001-44',
      sector: 'Varejo & Farmácia',
      regime: 'Simples Nacional',
      operationType: 'RECUPERACAO_TRIBUTARIA_PONTUAL',
      operationTitle: 'Monofásico PIS/COFINS Farmacêutico (Lei 10.147/00)',
      annualRevenue: 8400000,
      grossAmount: 78000.00, // Success fee 20% sobre R$ 390.000
      partnerSplitPct: 70,
      partnerSplitAmount: 54600.00, // 70%
      velatrixSplitPct: 30,
      velatrixSplitAmount: 23400.00, // 30%
      funnelStage: 'COMPENSADO_LIQUIDADO',
      funnelStageLabel: 'Crédito Compensado / Liquidado',
      lastUpdate: 'Ontem, 16:30',
      proofHash: '0x12840119000144d088120fae9310842bbda748201a019488bca7791240182910',
      notes: 'Valor liquidado via PIX diretamente na conta do parceiro credenciado.'
    },
    {
      id: 'lead-3',
      companyName: 'Clínica Santa Helena Diagnósticos',
      cnpj: '04.112.980/0001-02',
      sector: 'Saúde & Medicina',
      regime: 'Lucro Presumido',
      operationType: 'RECUPERACAO_TRIBUTARIA_PONTUAL',
      operationTitle: 'Equiparação Hospitalar IRPJ/CSLL (Lei 9.249/95)',
      annualRevenue: 18200000,
      grossAmount: 164000.00, // Success fee 20% sobre R$ 820.000
      partnerSplitPct: 70,
      partnerSplitAmount: 114800.00, // 70%
      velatrixSplitPct: 30,
      velatrixSplitAmount: 49200.00, // 30%
      funnelStage: 'TRANSACAO_PGFN',
      funnelStageLabel: 'Em Transação PGFN (Edital)',
      lastUpdate: 'Há 2 dias',
      proofHash: '0x04112980000102d033910cbe77912401829104c917b2288e10fae9310842bbda',
      notes: 'Edital PGFN protocolado com desconto de 65% em multas e juros.'
    },
    {
      id: 'lead-4',
      companyName: 'TransGlobal Transportes & Frota S.A.',
      cnpj: '45.992.301/0001-77',
      sector: 'Transporte Rodoviário',
      regime: 'Lucro Real',
      operationType: 'RECUPERACAO_TRIBUTARIA_PONTUAL',
      operationTitle: 'Créditos de Arrendamento Mercantil & Insumos de Combustível',
      annualRevenue: 72000000,
      grossAmount: 624000.00, // Success fee 20% sobre R$ 3.120.000
      partnerSplitPct: 70,
      partnerSplitAmount: 436800.00, // 70%
      velatrixSplitPct: 30,
      velatrixSplitAmount: 187200.00, // 30%
      funnelStage: 'PERICIA_D0',
      funnelStageLabel: 'Em Perícia D+0 (Varredura)',
      lastUpdate: 'Hoje, 08:00',
      proofHash: '0x45992301000177d099214ae812d46e01a87b32091c77f24d9c0e5b742aa39f94',
      notes: 'Varredura de 14.800 CT-e e SPED em andamento.'
    },
    {
      id: 'lead-5',
      companyName: 'Nexus Indústria & Manufatura S/A',
      cnpj: '18.492.301/0001-84',
      sector: 'Indústria Metalmecânica',
      regime: 'Lucro Real',
      operationType: 'ASSINATURA_SAAS_RECORRENTE',
      operationTitle: 'Plano Enterprise - Monitoramento Contínuo SPED & Escudo Fiscal D+0',
      annualRevenue: 98000000,
      grossAmount: 45000.00, // Mensalidade Recorrente
      partnerSplitPct: 0, // 0% ao parceiro (regra 100% Velatrix)
      partnerSplitAmount: 0.00,
      velatrixSplitPct: 100, // 100% Velatrix
      velatrixSplitAmount: 45000.00,
      funnelStage: 'COMPENSADO_LIQUIDADO',
      funnelStageLabel: 'Assinatura Ativa (Recorrente)',
      lastUpdate: 'Hoje, 11:30',
      proofHash: '0x18492301000184saas99412e812d46e01a87b32091c77f24d8f2a91c0e5b742aa',
      notes: 'Regra Contratual: 100% do licenciamento SaaS retido pela Velatrix para infraestrutura e tecnologia.'
    }
  ]);

  const handleNavigateToDiagnosis = (client?: PartnerAuditedClient | { cnpj?: string }) => {
    if (client && client.cnpj) {
      PartnerPortfolioService.setActiveClient(client.cnpj);
      const unified = UnifiedTenantService.setActiveTenant(client.cnpj);
      if (unified) {
        TenantTaxRecoveryBridge.syncFromTenantProfile(unified);
      }
    }
    if (onNavigateTab) {
      onNavigateTab('express_diagnosis');
    } else {
      window.dispatchEvent(new CustomEvent('velatrix:navigate_tab', { detail: 'express_diagnosis' }));
    }
  };

  const handleGenerateSplitCharge = (client: PartnerAuditedClient | PartnerClientLead | { cnpj: string; companyName?: string }) => {
    const cnpj = client.cnpj || '';
    const companyName = 'companyName' in client ? client.companyName : (client as any).companyName || 'Empresa Auditada';
    const existing = SplitPaymentSimulationService.getChargesByCnpj(cnpj);
    if (existing.length > 0) {
      setSelectedChargeForModal(existing[0]);
      setIsSplitPaymentModalOpen(true);
      return;
    }

    let feeAmount = 60000;
    let dealTitle = 'Honorários de Êxito Tributário D+0';
    let partnerPct = partnerSplitRate || 70;

    if ('estimatedRecovery60Months' in client) {
      feeAmount = client.successFeeEstimated > 0 
        ? client.successFeeEstimated 
        : Number(((client.estimatedRecovery60Months * successFeeRate) / 100).toFixed(2));
      dealTitle = `Honorários de Êxito - ${client.opportunitySummary || 'Recuperação Tributária D+0'}`;
    } else if ('grossAmount' in client) {
      feeAmount = client.grossAmount || 50000;
      dealTitle = client.operationTitle || 'Honorários de Êxito';
      partnerPct = client.partnerSplitPct || 70;
    }

    const newCharge = SplitPaymentSimulationService.createCharge({
      clientCnpj: cnpj,
      clientCompanyName: companyName,
      dealTitle,
      totalAmount: feeAmount,
      partnerSplitPct: partnerPct
    });

    setSelectedChargeForModal(newCharge);
    setIsSplitPaymentModalOpen(true);
  };

  const handleOpenDocPreview = (client: PartnerAuditedClient, docType: TaxDocPreviewType = 'white_label_dossier') => {
    setPreviewSelectedClient(client);
    setPreviewDocType(docType);
    setIsPreviewModalOpen(true);
  };

  const handleDownloadWhiteLabelDossier = (client: PartnerAuditedClient) => {
    generateWhiteLabelPartnerDossierPdf({
      companyName: client.companyName,
      cnpj: client.cnpj,
      sectorName: client.sector,
      totalCredits: client.estimatedRecovery60Months,
      partnerFirmName: partnerProfile.firmName,
      partnerLawyerName: partnerProfile.lawyerName,
      partnerOabOrCrc: partnerProfile.oabOrCrc,
      partnerEmail: partnerProfile.email,
      partnerPhone: partnerProfile.phone,
      brandPrimaryColor: partnerProfile.brandPrimaryColor,
      hashSha256: client.proofHash,
      teses: [
        {
          code: 'TEMA 69 STF',
          title: 'Exclusão do ICMS da base do PIS/COFINS dos últimos 60 meses',
          court: 'STF Repercussão Geral',
          estimatedCredit: client.estimatedRecovery60Months * 0.65
        },
        {
          code: 'CRÉDITOS INSUMOS',
          title: 'Créditos extemporâneos sobre insumos de produção e transportes',
          court: 'STJ Tema 986',
          estimatedCredit: client.estimatedRecovery60Months * 0.35
        }
      ]
    });
  };

  const handleDownloadSuccessContract = (client: PartnerAuditedClient) => {
    generatePartnerSuccessFeeContractPdf({
      clientCompanyName: client.companyName,
      clientCnpj: client.cnpj,
      partnerFirmName: partnerProfile.firmName,
      partnerLawyerName: partnerProfile.lawyerName,
      partnerOabOrCrc: partnerProfile.oabOrCrc,
      totalEstimatedBenefit: client.estimatedRecovery60Months,
      successFeePercent: 20,
      partnerSplitPercent: 70,
      velatrixSplitPercent: 30,
      hashSha256: client.proofHash
    });
  };

  // RLS Filter: Parceiro Operacional enxerga estritamente os CNPJs da sua carteira credenciada
  const portfolioFilteredClients = isPartner 
    ? clients.filter(c => PartnerPortfolioService.isCnpjInPortfolio(c.cnpj))
    : clients;

  const portfolioFilteredAuditedClients = isPartner
    ? auditedClients.filter(c => PartnerPortfolioService.isCnpjInPortfolio(c.cnpj))
    : auditedClients;

  // Filter automated splits for partner
  const portfolioAutomatedSplits = isPartner
    ? automatedSplits.filter(s => PartnerPortfolioService.isCnpjInPortfolio(s.cnpj))
    : automatedSplits;

  // Aggregate stats (considera carteira do parceiro)
  const totalGrossHonorarios = portfolioFilteredClients
    .filter(c => c.operationType === 'RECUPERACAO_TRIBUTARIA_PONTUAL')
    .reduce((acc, c) => acc + c.grossAmount, 0);

  const totalPartnerCommissionsManual = portfolioFilteredClients.reduce((acc, c) => acc + c.partnerSplitAmount, 0);
  const totalPartnerAutomatedCommissions = portfolioAutomatedSplits.reduce((acc, s) => acc + s.partnerSplitAmount, 0);
  const totalPartnerCommissions = totalPartnerCommissionsManual + totalPartnerAutomatedCommissions;

  const totalVelatrixRetained = portfolioFilteredClients.reduce((acc, c) => acc + c.velatrixSplitAmount, 0) +
    portfolioAutomatedSplits.reduce((acc, s) => acc + s.velatrixSplitAmount, 0);

  const totalLiquidatedPartner = portfolioFilteredClients
    .filter(c => c.funnelStage === 'COMPENSADO_LIQUIDADO')
    .reduce((acc, c) => acc + c.partnerSplitAmount, 0) +
    portfolioAutomatedSplits
      .filter(s => s.funnelStage === 'COMPENSADO_LIQUIDADO')
      .reduce((acc, s) => acc + s.partnerSplitAmount, 0);

  const filteredClients = portfolioFilteredClients.filter(client => {
    const matchesSearch = client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.cnpj.includes(searchQuery) ||
                          client.operationTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStageFilter === 'ALL' || client.funnelStage === selectedStageFilter;
    const matchesType = selectedTypeFilter === 'ALL' || client.operationType === selectedTypeFilter;
    return matchesSearch && matchesStage && matchesType;
  });

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(`https://app.velatrix.ai/onboarding?partner_ref=ADV-VASCONCELOS-7729`);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  // Split Escrow Charges Aggregates
  const totalVolumeEscrow = simulatedCharges.reduce((acc, c) => acc + c.totalAmount, 0);
  const totalPartnerSettledEscrow = simulatedCharges
    .filter(c => c.status === 'SPLIT_PROCESSADO')
    .reduce((acc, c) => acc + c.partnerSplitAmount, 0);
  const totalVelatrixSettledEscrow = simulatedCharges
    .filter(c => c.status === 'SPLIT_PROCESSADO')
    .reduce((acc, c) => acc + c.velatrixSplitAmount, 0);
  const pendingCharges = simulatedCharges.filter(c => c.status === 'PENDENTE');
  const totalPendingEscrow = pendingCharges.reduce((acc, c) => acc + c.totalAmount, 0);

  const renderSplitChargesSection = () => (
    <div id="section-split-payment-escrow" className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl">
      {/* Header with Title & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-bold text-white tracking-tight">
                Integração de Pagamento com Split Automático &amp; Escrow D+0
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PROTÓTIPO EM TEMPO REAL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Geração de links de cobrança de honorários de êxito com segregação de fundos na Conta Escrow. Ao confirmar recebimento, o split divide os recursos automaticamente entre parceiro e Velatrix, sem trânsito unilateral, disparando Webhook e emissão dual de NFS-e.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-nova-cobranca-escrow"
            onClick={() => {
              const defaultClient = auditedClients[0] || {
                cnpj: '33.041.260/0001-88',
                companyName: 'Vortex Logística & Manufatura S.A.'
              };
              handleGenerateSplitCharge(defaultClient);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <QrCode className="w-4 h-4 text-emerald-200" />
            <span>+ Gerar Cobrança de Êxito</span>
          </button>
        </div>
      </div>

      {/* Escrow Topology Infobar */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>FLUXO ANTI-BITRIBUTAÇÃO:</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300 flex-wrap justify-center text-center">
          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-white font-bold">1. Cliente Paga Link/PIX</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/40 text-indigo-200 font-bold">2. Conta Escrow Transitória D+0</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/40 text-emerald-200 font-bold">3. 70% Parceiro (PIX) + 30% Velatrix</span>
          <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          <span className="bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/40 text-cyan-200 font-bold">4. Emissão Dual NFS-e</span>
        </div>
        <div className="text-[11px] text-slate-500 hidden xl:block">
          Sem trânsito unilateral
        </div>
      </div>

      {/* 4 Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Volume Total Escrow
          </span>
          <div className="text-xl font-bold text-white font-mono">
            {formatCurrency(totalVolumeEscrow, 'BRL')}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            {simulatedCharges.length} cobranças geradas
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
            Repasse Parceiro Liquidado
          </span>
          <div className="text-xl font-bold text-emerald-300 font-mono">
            {formatCurrency(totalPartnerSettledEscrow, 'BRL')}
          </div>
          <span className="text-[10px] text-emerald-500 font-mono block">
            Creditado via PIX D+0
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
          <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
            Retenção Velatrix Tecnologia
          </span>
          <div className="text-xl font-bold text-cyan-300 font-mono">
            {formatCurrency(totalVelatrixSettledEscrow, 'BRL')}
          </div>
          <span className="text-[10px] text-cyan-500 font-mono block">
            Plataforma AOS &amp; Perícia
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
          <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block font-bold">
            Cobranças Pendentes
          </span>
          <div className="text-xl font-bold text-amber-300 font-mono">
            {formatCurrency(totalPendingEscrow, 'BRL')}
          </div>
          <span className="text-[10px] text-amber-500 font-mono block">
            {pendingCharges.length} aguardando pagamento
          </span>
        </div>
      </div>

      {/* Charges Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
            Cobranças Simuladas &amp; Rastreamento de Split ({simulatedCharges.length})
          </h5>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Clique em "Simular Liquidação D+0" para demonstrar o split e emissão de NFS-e
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {simulatedCharges.map((charge) => (
            <div
              key={charge.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded border border-indigo-500/30">
                    {charge.id}
                  </span>
                  
                  {charge.status === 'SPLIT_PROCESSADO' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Split Processado &amp; Liquidado D+0</span>
                    </span>
                  ) : charge.status === 'PAGO' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Pago (Processando Split)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pendente (Aguardando Pagamento)</span>
                    </span>
                  )}

                  <span className="text-xs font-mono text-slate-400">
                    Método: <strong>{charge.paymentMethod}</strong>
                  </span>
                </div>

                <div>
                  <h6 className="text-sm font-bold text-white">
                    {charge.clientCompanyName}
                  </h6>
                  <p className="text-xs text-slate-400 font-mono">
                    CNPJ {charge.clientCnpj} • {charge.dealTitle}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400 pt-1 flex-wrap">
                  <div>
                    <span className="text-slate-500">Criado:</span> {charge.createdAt}
                  </div>
                  {charge.paidAt && (
                    <div>
                      <span className="text-slate-500">Liquidado:</span>{' '}
                      <strong className="text-emerald-400">{charge.paidAt}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500">NFS-e:</span>{' '}
                    {charge.partnerNfse ? (
                      <span className="text-emerald-300 font-bold">
                        Dual 2/2 (#{charge.partnerNfse.number} + #{charge.velatrixNfse?.number})
                      </span>
                    ) : (
                      <span className="text-amber-400">Aguardando Liquidação</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Split Numbers & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                <div className="text-left sm:text-right space-y-1">
                  <div className="text-base font-black text-white font-mono">
                    {formatCurrency(charge.totalAmount, 'BRL')}
                  </div>
                  <div className="text-[11px] font-mono space-y-0.5">
                    <div className="text-emerald-400">
                      Parceiro ({charge.partnerSplitPct}%): <strong>{formatCurrency(charge.partnerSplitAmount, 'BRL')}</strong>
                    </div>
                    <div className="text-cyan-400">
                      Velatrix ({charge.velatrixSplitPct}%): <strong>{formatCurrency(charge.velatrixSplitAmount, 'BRL')}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id={`btn-open-gateway-charge-${charge.id}`}
                    onClick={() => {
                      setSelectedChargeForModal(charge);
                      setIsSplitPaymentModalOpen(true);
                    }}
                    className={`flex-1 sm:flex-initial py-2.5 px-3.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md ${
                      charge.status === 'PENDENTE'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5 text-emerald-300" />
                    <span>
                      {charge.status === 'PENDENTE' ? 'Simular Liquidação D+0' : 'Ver Gateway & NFS-e'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(charge.paymentUrl);
                      alert('Link copiado para a área de transferência!');
                    }}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
                    title="Copiar Link de Cobrança"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Portal de Parceria Tributária &amp; Crescimento</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Split
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  SaaS 100% Velatrix
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Patrono Credenciado: <strong className="text-white">{partnerProfile.firmName}</strong> ({partnerProfile.oabOrCrc})
              </p>
            </div>
          </div>

          <div className="flex items-stretch sm:items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              id="btn-nav-novo-cnpj-diagnostico"
              onClick={() => handleNavigateToDiagnosis()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              title="Acessar o módulo oficial: Diagnóstico Integral & Proposta Executiva AOS"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Novo CNPJ / Diagnóstico D+0</span>
            </button>

            <button
              onClick={() => setIsWhiteLabelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-pointer shrink-0"
            >
              <FileDown className="w-4 h-4" />
              <span>Kit de Vendas (PDF)</span>
            </button>

            <button
              id="btn-cadastrar-deal-split-personalizado"
              onClick={() => setIsCustomSplitModalOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer border border-emerald-400/40"
              title="Cadastrar Deal com Split Personalizado (configurar/negociar split entre Parceiro e Velatrix)"
            >
              <Percent className="w-4 h-4 text-emerald-200" />
              <span>Split Personalizado (Cadastrar Deal)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Item 3.4: 3 Consolidated Strategic Cards Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Meus CNPJs & Auditorias */}
        <div 
          onClick={() => setActiveTab('carteira')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-3 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
              {auditedClients.length} CNPJs AUDITADOS
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              Meus CNPJs &amp; Auditorias D+0
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento de varreduras periciais de 60 meses e funil de homologação RFB.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-emerald-400 border-t border-slate-800">
            <span>Sua Parte (Honorários Parceiro):</span>
            <strong>{formatCurrency(totalPartnerCommissions, 'BRL')}</strong>
          </div>
        </div>

        {/* Card 2: Kit de Vendas White-Label */}
        <div 
          onClick={() => {
            setSelectedWhiteLabelClient(auditedClients[0] || null);
            setIsWhiteLabelModalOpen(true);
          }}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all space-y-3 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              WHITE-LABEL PRONTO
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Kit de Vendas (Dossiê &amp; Contrato PDF)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerador de laudos periciais com a sua marca e Contrato de Êxito Digital.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-indigo-300 border-t border-slate-800">
            <span>Marca: {partnerProfile.firmName.slice(0, 20)}...</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: AOS Academy & Central de Copys */}
        <div 
          onClick={() => setActiveTab('academy')}
          className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 border border-slate-800 hover:border-purple-500/50 cursor-pointer transition-all space-y-3 group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              3 MÓDULOS + SCRIPTS
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              AOS Academy &amp; Scripts Prontos
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Treinamento de abordagem de carteira, interpretação do laudo e copys para WhatsApp/E-mail.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-between text-xs font-mono text-purple-300 border-t border-slate-800">
            <span>Acessar Trilhas &amp; Copys</span>
            <ArrowRight className="w-4 h-4 text-purple-400" />
          </div>
        </div>

      </div>

      {/* Quick Diagnostic Invite Box (Item 3.4) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Link Rápido de Convite &amp; Auto-Diagnóstico D+0</span>
            <span className="text-[11px] text-slate-400 font-mono">
              https://app.velatrix.ai/diagnostico?ref=ADV-VASCONCELOS-7729 (Vincula clientes à sua carteira)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyInviteLink}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer border border-slate-700 transition-colors shrink-0"
        >
          {isCopiedLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Copiar Link de Convite</span>
            </>
          )}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/90 p-2 rounded-2xl border border-slate-800 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('carteira')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'carteira'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Carteira &amp; Auditorias ({auditedClients.length})</span>
        </button>

        <button
          id="tab-btn-cobrancas-split"
          onClick={() => setActiveTab('cobrancas_split')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'cobrancas_split'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Cobranças &amp; Split Escrow D+0</span>
          {simulatedCharges.filter(c => c.status === 'PENDENTE').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-bold">
              {simulatedCharges.filter(c => c.status === 'PENDENTE').length} pendente
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('academy')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'academy'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>AOS Academy &amp; Copys</span>
        </button>

        <button
          onClick={() => setActiveTab('white_label')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'white_label'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileDown className="w-4 h-4" />
          <span>Kit White-Label (PDFs)</span>
        </button>

        <button
          onClick={() => setActiveTab('regras_split')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'regras_split'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Regras de Split</span>
        </button>

        <button
          onClick={() => setActiveTab('conta_pix')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'conta_pix'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Conta PIX de Split</span>
        </button>
      </div>

      {/* VIEW 1: CARTEIRA DE OPERAÇÕES COM BOTÕES DE BAIXAR DOSSIÊ E GERAR CONTRATO (Item 3.4) */}
      {activeTab === 'carteira' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Quick Audited Clients Summary Bar */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Últimos CNPJs Auditados em D+0 (Ações Rápidas)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gere instantaneamente o Dossiê com sua marca ou o Contrato de Êxito Digital com as regras de split configuradas.
                </p>
              </div>

              <button
                id="btn-partner-auditar-novo-cnpj"
                onClick={() => handleNavigateToDiagnosis()}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Acessar o módulo oficial: Diagnóstico Integral & Proposta Executiva AOS"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Auditar Novo CNPJ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {portfolioFilteredAuditedClients.map((client) => (
                <div 
                  key={client.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{client.companyName}</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">
                        {formatCurrency(client.estimatedRecovery60Months, 'BRL')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      CNPJ {client.cnpj} • {client.taxRegime} • {client.statusLabel}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => handleNavigateToDiagnosis(client)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                      title="Abrir diagnóstico oficial deste CNPJ em Diagnóstico Integral AOS"
                    >
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      <span>Diagnóstico Real D+0</span>
                    </button>

                    <button
                      type="button"
                      id={`btn-gerar-cobranca-card-${client.id}`}
                      onClick={() => handleGenerateSplitCharge(client)}
                      className="py-1.5 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm shrink-0"
                      title="Gerar Cobrança de Êxito com Split Automático Escrow D+0"
                    >
                      <QrCode className="w-3 h-3 text-emerald-400" />
                      <span>Gerar Cobrança de Êxito</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(client, 'white_label_dossier')}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Pré-visualizar e Baixar Dossiê com a marca do escritório em PDF (SHA-256 e Protocolo)"
                    >
                      <Eye className="w-3 h-3 text-indigo-200" />
                      <span>Baixar Dossiê PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDocPreview(client, 'success_contract')}
                      className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Pré-visualizar e Gerar Contrato de Êxito em PDF"
                    >
                      <FileText className="w-3 h-3 text-emerald-200" />
                      <span>Gerar Contrato</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Módulo de Cobranças de Êxito & Split Automático Escrow D+0 */}
          {renderSplitChargesSection()}

          {/* Full Operations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Filters Bar */}
            <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por razão social, CNPJ ou tese..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 w-64 sm:w-72"
                  />
                </div>

                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Todos os Tipos de Operação</option>
                  <option value="RECUPERACAO_TRIBUTARIA_PONTUAL">Recuperação Pontual (Split de Honorários)</option>
                  <option value="ASSINATURA_SAAS_RECORRENTE">Assinatura Recorrente (100% Velatrix)</option>
                </select>

                <select
                  value={selectedStageFilter}
                  onChange={(e) => setSelectedStageFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="ALL">Todos os Estágios</option>
                  <option value="PERICIA_D0">Em Perícia D+0</option>
                  <option value="TRANSACAO_PGFN">Em Transação PGFN</option>
                  <option value="HOMOLOGADO">Homologado RFB</option>
                  <option value="COMPENSADO_LIQUIDADO">Compensado / Liquidado</option>
                </select>
              </div>

              <div className="text-xs text-slate-400">
                Exibindo <strong>{filteredClients.length}</strong> de {clients.length} operações vinculadas
              </div>
            </div>

            {/* Table with Gross Amount, Partner Cut, Velatrix Cut */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[10px] font-mono">
                  <tr>
                    <th className="py-3.5 px-4">Empresa / Razão Social</th>
                    <th className="py-3.5 px-4">Tipo de Operação</th>
                    <th className="py-3.5 px-4">Valor Bruto Total</th>
                    <th className="py-3.5 px-4 bg-emerald-950/20 text-emerald-300">Parte do Parceiro (R$)</th>
                    <th className="py-3.5 px-4 bg-cyan-950/20 text-cyan-300">Parte Velatrix (R$)</th>
                    <th className="py-3.5 px-4">Status do Funil</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClients.map((client) => {
                    const isSaaS = client.operationType === 'ASSINATURA_SAAS_RECORRENTE';
                    return (
                      <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white text-sm">{client.companyName}</div>
                          <div className="text-slate-400 font-mono text-[11px] mt-0.5">{client.cnpj}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{client.operationTitle}</div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                            isSaaS
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            {isSaaS ? 'SaaS (100% Velatrix)' : 'Êxito (Split Parceiro)'}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-slate-100 text-sm">
                          {formatCurrency(client.grossAmount, 'BRL')}
                        </td>

                        {/* Partner Cut Column */}
                        <td className="py-4 px-4 bg-emerald-950/10">
                          <div className="font-bold font-mono text-emerald-400 text-sm">
                            {formatCurrency(client.partnerSplitAmount, 'BRL')}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {client.partnerSplitPct}% da operação
                          </div>
                        </td>

                        {/* Velatrix Cut Column */}
                        <td className="py-4 px-4 bg-cyan-950/10">
                          <div className="font-bold font-mono text-cyan-400 text-sm">
                            {formatCurrency(client.velatrixSplitAmount, 'BRL')}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {client.velatrixSplitPct}% da operação
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                            client.funnelStage === 'COMPENSADO_LIQUIDADO'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : client.funnelStage === 'HOMOLOGADO'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : client.funnelStage === 'TRANSACAO_PGFN'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          }`}>
                            {client.funnelStage === 'COMPENSADO_LIQUIDADO' && <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />}
                            <span>{client.funnelStageLabel}</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              id={`btn-cobranca-split-${client.id}`}
                              onClick={() => handleGenerateSplitCharge(client)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all hover:border-emerald-400"
                              title="Gerar Cobrança de Êxito com Split Automático Escrow D+0"
                            >
                              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Cobrança de Êxito</span>
                            </button>

                            <button
                              id={`btn-detalhes-split-${client.id}`}
                              onClick={() => setSelectedOperationForDetail(client)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all hover:border-indigo-500"
                              title="Visualizar card detalhado da divisão de receitas e hash fiscal"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Detalhes</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated Splits by Real Delivered Services Section */}
          <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-900/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      Gatilhos Automáticos de Split por Serviço Entregue
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Gatilho Adicional — Rastreabilidade D+0
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Comissões apuradas e vinculadas automaticamente quando uma etapa faturável real é concluída nos módulos operacionais (Diagnóstico Integral D+0, Formalização Executiva, Protocolo RFB). As regras manuais não foram alteradas.
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-slate-400 font-mono uppercase">Total Comissões Automáticas:</div>
                <div className="text-base font-bold font-mono text-emerald-400">
                  {formatCurrency(totalPartnerAutomatedCommissions, 'BRL')}
                </div>
              </div>
            </div>

            {portfolioAutomatedSplits.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2">
                <Sparkles className="w-6 h-6 text-emerald-500/50 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Nenhum evento automático registrado nesta sessão.
                </p>
                <p className="text-[11px] text-slate-500 max-w-lg mx-auto">
                  Ao concluir um diagnóstico com crédito identificado no <strong className="text-slate-300">Diagnóstico Integral AOS</strong> ou formalizar uma proposta executiva para uma empresa da sua carteira, o evento de comissão (70% Parceiro / 30% Velatrix) aparecerá aqui com hash criptográfico SHA-256 e rastreabilidade total.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {portfolioAutomatedSplits.map((event) => (
                  <div 
                    key={event.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-3 shadow-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-300">
                          {event.milestoneTitle}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {event.companyName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ({event.cnpj})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{event.timestamp}</span>
                      </div>
                    </div>

                    {/* Financial Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">Crédito Base Apurado</div>
                        <div className="text-xs font-bold font-mono text-slate-200">
                          {formatCurrency(event.grossCreditBase, 'BRL')}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">Honorário de Êxito (20%)</div>
                        <div className="text-xs font-bold font-mono text-cyan-300">
                          {formatCurrency(event.grossFeeAmount, 'BRL')}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40">
                        <div className="text-[10px] text-emerald-400 font-mono font-bold">Comissão do Parceiro (70%)</div>
                        <div className="text-xs font-bold font-mono text-emerald-300">
                          {formatCurrency(event.partnerSplitAmount, 'BRL')}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-[10px] text-slate-400 font-mono">Retenção Velatrix (30%)</div>
                        <div className="text-xs font-bold font-mono text-slate-400">
                          {formatCurrency(event.velatrixSplitAmount, 'BRL')}
                        </div>
                      </div>
                    </div>

                    {/* Traceability Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-300">Caso Gerador:</span>
                        <span className="text-indigo-300 font-mono">{event.caseTitle}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{event.ruleApplied}</span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                        <Fingerprint className="w-3 h-3 text-emerald-400" />
                        <span className="truncate max-w-[200px]" title={event.proofHash}>
                          Hash: {event.proofHash}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: COBRANÇAS DE ÊXITO & SPLIT ESCROW D+0 */}
      {activeTab === 'cobrancas_split' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {renderSplitChargesSection()}
        </div>
      )}

      {/* VIEW 2: AOS ACADEMY (Item 3.3) */}
      {activeTab === 'academy' && (
        <PartnerAcademySection />
      )}

      {/* VIEW 3: KIT WHITE-LABEL (Item 3.2) */}
      {activeTab === 'white_label' && (
        <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileDown className="w-5 h-5 text-indigo-400" />
                <span>Kit de Vendas White-Label do Escritório</span>
              </h3>
              <p className="text-xs text-slate-400">
                Gere e baixe relatórios periciais com o visual da sua marca e contratos de honorários com split pactuado.
              </p>
            </div>

            <button
              onClick={() => setIsWhiteLabelModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Abrir Painel de Customização</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditedClients.map((client) => (
              <div key={client.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{client.companyName}</h4>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                    {formatCurrency(client.estimatedRecovery60Months, 'BRL')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">CNPJ {client.cnpj} • {client.sector}</p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenDocPreview(client, 'white_label_dossier')}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Pré-visualizar Dossiê White-Label com SHA-256 e Protocolo antes do download"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-200" />
                    <span>Dossiê White-Label (PDF)</span>
                  </button>

                  <button
                    onClick={() => handleOpenDocPreview(client, 'success_contract')}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                    title="Pré-visualizar Contrato de Êxito antes de baixar"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Contrato de Êxito (PDF)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: REGRAS FORMAIS & TEXTO INFORMATIVO DA CLÁUSULA */}
      {activeTab === 'regras_split' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Rules Explanation Card */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Regulamento de Parceria Tributária B2B</h4>
                <p className="text-xs text-slate-400">
                  Estrutura contratual irrevogável para proteção de receita, governança pericial e repasse em D+0.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <h5 className="text-xs font-bold text-emerald-300 uppercase font-mono">1. Recuperação Tributária (Split por Deal)</h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para todo trabalho de apuração de créditos tributários extemporâneos (60 meses) homologados administrativamente via DCOMP ou transacionados na PGFN, o honorário líquido auferido é dividido conforme o <strong>Split Personalizado pactuado por deal</strong> entre o <strong>Parceiro Originador</strong> e a <strong>Velatrix Tecnologia</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <h5 className="text-xs font-bold text-cyan-300 uppercase font-mono">2. Assinatura SaaS Recorrente (100% Velatrix)</h5>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Todas as subscrições mensais ou anuais de software (Velatrix AOS, cruzamento SPED contínuo e monitoramento algorítmico) são de titularidade integral da <strong>Velatrix Tecnologia Ltda (100%)</strong>, destinadas à infraestrutura de servidores e inteligência artificial, <strong>sem incidência de comissão ou repasse ao parceiro</strong>.
                </p>
              </div>
            </div>

            {/* Custom Split Deals Registered */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h5 className="text-xs font-bold text-white font-mono uppercase">
                    Deals com Split Personalizado Cadastrados ({customSplitDeals.length})
                  </h5>
                </div>
                <button
                  onClick={() => setIsCustomSplitModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Novo Split</span>
                </button>
              </div>

              {customSplitDeals.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">
                    Nenhum deal com split personalizado registrado ainda. Use o botão acima ou a barra de ações para definir proporções customizadas (ex: 50/50, 60/40, 80/20) para um cliente específico.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customSplitDeals.map((deal, idx) => (
                    <div
                      key={deal.dealId || idx}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{deal.clientName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {deal.partnerPercent}% Parceiro / {deal.velatrixPercent}% Velatrix
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Parceiro: {deal.partnerName} • ID: {deal.dealId}
                          {deal.honorariosTotalEstimado ? (
                            <span className="text-emerald-400 font-bold ml-1.5">
                              • Honorários: {formatCurrency(deal.honorariosTotalEstimado, 'BRL')} (Parceiro: {formatCurrency(deal.valorParceiro || 0, 'BRL')})
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {deal.splitWebhookUrl && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(deal.splitWebhookUrl!);
                              setCopiedDealId(deal.dealId);
                              setTimeout(() => setCopiedDealId(null), 2500);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-mono flex items-center gap-1 cursor-pointer"
                          >
                            {copiedDealId === deal.dealId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copiar Link</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                          D+0 Ativo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: CONTA PIX DE LIQUIDAÇÃO */}
      {activeTab === 'conta_pix' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <PartnerPayoutAccountForm />
        </div>
      )}

      {/* MODAL 2: White-Label Kit Modal (Item 3.2) */}
      <PartnerWhiteLabelKitModal
        isOpen={isWhiteLabelModalOpen}
        onClose={() => setIsWhiteLabelModalOpen(false)}
        selectedClient={selectedWhiteLabelClient}
      />

      {/* MODAL 3: Operation Detail Card */}
      {selectedOperationForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-slate-700/80 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950/60 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedOperationForDetail.companyName}</h3>
                  <p className="text-xs text-slate-400 font-mono">CNPJ: {selectedOperationForDetail.cnpj}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedOperationForDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">VALOR BRUTO</span>
                  <strong className="text-sm font-mono text-white">
                    {formatCurrency(selectedOperationForDetail.grossAmount, 'BRL')}
                  </strong>
                </div>

                <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-400 font-mono block">PARCEIRO ({selectedOperationForDetail.partnerSplitPct}%)</span>
                  <strong className="text-sm font-mono text-emerald-400">
                    {formatCurrency(selectedOperationForDetail.partnerSplitAmount, 'BRL')}
                  </strong>
                </div>

                <div className="p-3 bg-cyan-950/40 rounded-xl border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-400 font-mono block">VELATRIX ({selectedOperationForDetail.velatrixSplitPct}%)</span>
                  <strong className="text-sm font-mono text-cyan-400">
                    {formatCurrency(selectedOperationForDetail.velatrixSplitAmount, 'BRL')}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="text-slate-400 font-mono">Hash Criptográfico de Anterioridade:</div>
                <div className="font-mono text-[11px] text-indigo-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                  {selectedOperationForDetail.proofHash}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const matchingClient: PartnerAuditedClient = auditedClients.find(c => c.cnpj === selectedOperationForDetail.cnpj) || {
                    id: selectedOperationForDetail.id,
                    companyName: selectedOperationForDetail.companyName,
                    cnpj: selectedOperationForDetail.cnpj,
                    sector: selectedOperationForDetail.sector,
                    taxRegime: selectedOperationForDetail.regime,
                    estimatedRecovery60Months: selectedOperationForDetail.grossAmount / 0.20,
                    successFeeEstimated: selectedOperationForDetail.grossAmount,
                    partnerShare70Pct: selectedOperationForDetail.partnerSplitAmount,
                    velatrixShare30Pct: selectedOperationForDetail.velatrixSplitAmount,
                    status: 'AUDITADO_D0',
                    statusLabel: selectedOperationForDetail.funnelStageLabel,
                    lastAuditDate: 'Hoje',
                    opportunitySummary: selectedOperationForDetail.operationTitle,
                    proofHash: selectedOperationForDetail.proofHash || '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d'
                  };
                  setSelectedOperationForDetail(null);
                  handleOpenDocPreview(matchingClient, 'white_label_dossier');
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                title="Abrir pré-visualização oficial com protocolo e hash SHA-256"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-200" />
                <span>Pré-visualizar Dossiê (PDF)</span>
              </button>

              <button
                onClick={() => setSelectedOperationForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <RevenueShieldPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenantData={tenantData}
        onPaymentSuccess={() => {
          setShieldState(RevenueShieldService.get());
        }}
      />

      {/* Tax Recovery & White-Label Document Preview Modal */}
      {isPreviewModalOpen && (() => {
        const baseBridgeData = tenantData || TenantTaxRecoveryBridge.get();
        const effectiveTenantData: SharedTenantTaxData = previewSelectedClient
          ? {
              ...baseBridgeData,
              companyName: previewSelectedClient.companyName,
              cnpj: previewSelectedClient.cnpj,
              sectorName: previewSelectedClient.sector,
              taxRegime: (previewSelectedClient.taxRegime === 'Simples Nacional'
                ? 'simples_nacional'
                : previewSelectedClient.taxRegime === 'Lucro Presumido'
                ? 'lucro_presumido'
                : 'lucro_real'),
              annualRevenue: previewSelectedClient.estimatedRecovery60Months * 10,
              preliminaryScan: {
                ...baseBridgeData.preliminaryScan,
                totalEstimatedCredits: previewSelectedClient.estimatedRecovery60Months,
                hashSha256: previewSelectedClient.proofHash,
                teses: [
                  {
                    ...baseBridgeData.preliminaryScan.teses[0],
                    id: 'tese-1',
                    code: 'TEMA 69 STF',
                    title: 'Exclusão do ICMS da base do PIS/COFINS (Tema 69 STF)',
                    court: 'STF (RE 574.706)',
                    estimatedCredit: previewSelectedClient.estimatedRecovery60Months * 0.65,
                    status: 'HABILITADO_RFB'
                  },
                  {
                    ...baseBridgeData.preliminaryScan.teses[1],
                    id: 'tese-2',
                    code: 'STJ TEMA 779',
                    title: 'Créditos extemporâneos sobre insumos de produção e transportes',
                    court: 'STJ (REsp 1.221.170)',
                    estimatedCredit: previewSelectedClient.estimatedRecovery60Months * 0.35,
                    status: 'HABILITADO_RFB'
                  }
                ]
              }
            }
          : baseBridgeData;

        return (
          <TaxRecoveryDocPreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => {
              setIsPreviewModalOpen(false);
              setPreviewSelectedClient(null);
            }}
            documentType={previewDocType}
            tenantData={effectiveTenantData}
            partnerData={{
              firmName: partnerProfile.firmName,
              lawyerName: partnerProfile.lawyerName,
              oabOrCrc: partnerProfile.oabOrCrc,
              email: partnerProfile.email,
              phone: partnerProfile.phone,
              brandPrimaryColor: partnerProfile.brandPrimaryColor,
              partnerSplitPercent: partnerSplitRate,
              velatrixSplitPercent: 100 - partnerSplitRate,
              successFeePercent: successFeeRate
            }}
          />
        );
      })()}

      {/* Modal de Definição de Split Personalizado (Cadastrar Deal) */}
      <CustomSplitDealModal
        isOpen={isCustomSplitModalOpen}
        onClose={() => setIsCustomSplitModalOpen(false)}
        initialPartnerName={partnerProfile.firmName || 'Vasconcelos & Associados Advocacia Tributária'}
        initialClientName={tenantData?.companyName || 'Atlas Metalmecânica & Componentes Ltda.'}
        initialEstimatedAmount={tenantData?.preliminaryScan?.totalEstimatedCredits || 1480000}
        onApplyDeal={(deal) => {
          setCustomSplitDeals((prev) => [deal, ...prev]);
          setPartnerSplitRate(deal.partnerPercent);
          if (onAddAuditRecord) {
            onAddAuditRecord({
              id: `AUD-SPLIT-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('pt-BR'),
              eventId: `evt-split-deal-${deal.dealId}`,
              eventTitle: `Cadastro de Deal com Split Personalizado (${deal.partnerPercent}/${deal.velatrixPercent}) para ${deal.clientName}`,
              agentsInvolved: ['Legal_Contract_Agent', 'Tax_Optimizer_Agent'],
              decisionSummary: `Novo Deal com Split Personalizado Cadastrado: ${deal.partnerPercent}% Parceiro / ${deal.velatrixPercent}% Velatrix para ${deal.clientName}`,
              decisionAst: {
                ui_type: 'CriticalDecisionCard',
                priority: 'High',
                summary: `Split contratual ajustado para ${deal.clientName}`,
                kpis: [
                  { label: 'Cota Parceiro', value: `${deal.partnerPercent}%`, impact: 'positive' },
                  { label: 'Cota Velatrix', value: `${deal.velatrixPercent}%`, impact: 'positive' }
                ],
                invariants_checked: ['INVARIANT_SUM_100_PERCENT', 'INVARIANT_ESCROW_SMART_SPLIT']
              },
              signatures: [
                {
                  role: 'Gestor de Parcerias',
                  keyId: deal.partnerName,
                  signedAt: new Date().toISOString(),
                  verified: true
                }
              ],
              status: 'executed',
              executionReceipt: `TX-SPLIT-DEAL-${deal.dealId.toUpperCase()}`,
              invariantSnapshot: ['INV_SPLIT_100_PCT_RULE', 'INV_AUTOMATIC_ESCROW_ROUTE'],
              recordHash: `sha256_deal_${deal.dealId}`
            });
          }
        }}
      />

      {/* Modal de Simulação de Pagamento com Split Automático Escrow D+0 */}
      <SimulatedSplitPaymentModal
        isOpen={isSplitPaymentModalOpen}
        onClose={() => setIsSplitPaymentModalOpen(false)}
        charge={selectedChargeForModal}
        onAddAuditRecord={onAddAuditRecord}
        onChargeUpdated={(updated) => {
          setSelectedChargeForModal(updated);
          setSimulatedCharges(SplitPaymentSimulationService.getCharges());
        }}
      />

    </div>
  );
};
