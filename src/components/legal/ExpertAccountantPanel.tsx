import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  Scale,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Download,
  Copy,
  Check,
  Building2,
  UserCheck,
  ShieldCheck,
  Fingerprint,
  FileCheck,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Lock,
  Percent,
  Calculator,
  KeyRound,
  ShieldAlert,
  HelpCircle,
  Hash,
  Layers,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';
import { UnifiedTenantService } from '../../services/unifiedTenantService';
import {
  ExpertAccountantProfile,
  AssociatedPartnerProfile,
  LawsuitJudicialData,
  PericialCalculationItem,
  MonthlyCompetenceItem,
  DigitalSignatureRecord,
  PericialQuesitoItem,
  DEFAULT_EXPERT_ACCOUNTANT,
  DEFAULT_ASSOCIATED_PARTNER,
  DEFAULT_LAWSUIT_DATA,
  DEFAULT_PERICIAL_ITEMS,
  DEFAULT_QUESITOS_LIST,
  generate60MonthsCompetences,
  exportPericialCalculationToExcel,
  generateTechnicalReportPdf,
  exportQuesitosToTxt
} from '../../services/expertReportService';
import { computeSha256Sync } from '../../services/expertTaxEngineService';
import { secureId, secureInt } from '../../lib/demoMode';

interface ExpertAccountantPanelProps {
  tenantData: SharedTenantTaxData;
  onNavigateToCalculoPericial?: () => void;
  onNavigateToTimeline60M?: () => void;
  onOpenDocPreview?: (type: any) => void;
}

export const ExpertAccountantPanel: React.FC<ExpertAccountantPanelProps> = ({
  tenantData,
  onNavigateToCalculoPericial,
  onNavigateToTimeline60M,
  onOpenDocPreview
}) => {
  // =========================================================================
  // 1. ESTADOS DO MÓDULO (PERITO, PARCEIRO, PROCESSO E CÁLCULOS)
  // =========================================================================
  const [activeTab, setActiveTab] = useState<'qualificacao' | 'memoria_calculo' | 'laudo_tecnico' | 'quesitos' | 'assinatura'>('memoria_calculo');

  // Perfis Editáveis
  const [expertProfile, setExpertProfile] = useState<ExpertAccountantProfile>(() => {
    const saved = localStorage.getItem('vx_expert_accountant_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_EXPERT_ACCOUNTANT;
  });

  const [partnerProfile, setPartnerProfile] = useState<AssociatedPartnerProfile>(() => {
    const saved = localStorage.getItem('vx_associated_partner_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_ASSOCIATED_PARTNER;
  });

  const [lawsuitData, setLawsuitData] = useState<LawsuitJudicialData>(() => ({
    ...DEFAULT_LAWSUIT_DATA,
    authorParty: tenantData.companyName || DEFAULT_LAWSUIT_DATA.authorParty
  }));

  // Itens periciados e 60 competências
  const [pericialItems, setPericialItems] = useState<PericialCalculationItem[]>(() => {
    // Sincroniza dinamicamente valores com o preliminarScan do bridge se houver
    if (tenantData.preliminaryScan && tenantData.preliminaryScan.totalEstimatedCredits > 0) {
      const ratio = tenantData.preliminaryScan.totalEstimatedCredits / 1840250;
      return DEFAULT_PERICIAL_ITEMS.map(item => ({
        ...item,
        baseAmount: Math.round(item.baseAmount * ratio),
        principalAmount: Math.round(item.principalAmount * ratio),
        selicCorrection: Math.round(item.selicCorrection * ratio),
        totalCredit: Math.round(item.totalCredit * ratio)
      }));
    }
    return DEFAULT_PERICIAL_ITEMS;
  });

  const [competences, setCompetences] = useState<MonthlyCompetenceItem[]>(() => generate60MonthsCompetences());

  // Estado da Assinatura Digital
  const [signatureRecord, setSignatureRecord] = useState<DigitalSignatureRecord>(() => {
    const saved = localStorage.getItem('vx_expert_digital_signature');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      isSigned: false,
      signatureType: 'NONE',
      signatureTypeLabel: 'Não Assinado',
      sha256Hash: computeSha256Sync(tenantData.cnpj + '1840250')
    };
  });

  // Sincronização Dinâmica em Tempo Real com o Fluxo Único (UnifiedTenantService & tenantData)
  useEffect(() => {
    const handleSync = (activeTenant?: any) => {
      const company = activeTenant?.name || tenantData.companyName;
      const cnpjVal = activeTenant?.cnpj || tenantData.cnpj;
      const estimated = activeTenant?.estimatedRecovery60Months || tenantData.preliminaryScan?.totalEstimatedCredits || 1840250;

      // Sincroniza Ação Judicial
      setLawsuitData(prev => ({
        ...prev,
        authorParty: company || prev.authorParty,
        lawsuitNumber: prev.lawsuitNumber || `500${Date.now().toString().slice(-6)}-84.2025.4.03.6100`
      }));

      // Sincroniza Itens Periciados proporcionalmente
      const ratio = estimated > 0 ? estimated / 1840250 : 1;
      setPericialItems(DEFAULT_PERICIAL_ITEMS.map(item => ({
        ...item,
        baseAmount: Math.round(item.baseAmount * ratio),
        principalAmount: Math.round(item.principalAmount * ratio),
        selicCorrection: Math.round(item.selicCorrection * ratio),
        totalCredit: Math.round(item.totalCredit * ratio)
      })));

      // Atualiza hash da perícia
      setSignatureRecord(prev => ({
        ...prev,
        sha256Hash: computeSha256Sync(cnpjVal + estimated.toString())
      }));
    };

    // Sincroniza estado inicial se já houver tenant ativo
    const active = UnifiedTenantService.getActiveTenant();
    if (active) {
      handleSync(active);
    }

    const unsubscribe = UnifiedTenantService.subscribe((tenant) => {
      if (tenant) handleSync(tenant);
    });

    return () => unsubscribe();
  }, [tenantData.companyName, tenantData.cnpj, tenantData.preliminaryScan]);

  // Modal de Assinatura Digital
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [selectedSigMethod, setSelectedSigMethod] = useState<'ICP_BRASIL_A1' | 'ICP_BRASIL_A3' | 'GOV_BR_OURO' | 'VELATRIX_AOS_CRYPTO'>('ICP_BRASIL_A1');
  const [tokenPin, setTokenPin] = useState<string>('');
  const [certFileUploaded, setCertFileUploaded] = useState<string | null>(null);
  const [isSigningLoading, setIsSigningLoading] = useState<boolean>(false);

  // Modal de Edição de Dados Cadastrais
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState<boolean>(false);
  const [tempExpert, setTempExpert] = useState<ExpertAccountantProfile>(expertProfile);
  const [tempPartner, setTempPartner] = useState<AssociatedPartnerProfile>(partnerProfile);
  const [tempLawsuit, setTempLawsuit] = useState<LawsuitJudicialData>(lawsuitData);

  // Quesitos Judiciais
  const [quesitosList, setQuesitosList] = useState<PericialQuesitoItem[]>(() => {
    const saved = localStorage.getItem('vx_expert_quesitos_list');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_QUESITOS_LIST;
  });

  const [copiedQuesitos, setCopiedQuesitos] = useState<boolean>(false);
  const [isAddQuesitoOpen, setIsAddQuesitoOpen] = useState<boolean>(false);
  const [newQuesitoText, setNewQuesitoText] = useState<string>('');
  const [newQuesitoPurpose, setNewQuesitoPurpose] = useState<string>('');
  const [newQuesitoBasis, setNewQuesitoBasis] = useState<string>('');
  const [newQuesitoCategory, setNewQuesitoCategory] = useState<any>('DEFESA_CONTRIBUINTE');

  // Filtro de Competências por Ano
  const [selectedYearFilter, setSelectedYearFilter] = useState<'TODOS' | '2021' | '2022' | '2023' | '2024' | '2025' | '2026'>('TODOS');
  const [searchCompetence, setSearchCompetence] = useState<string>('');

  // Notificação de Sucesso
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Salvar no Storage
  const handleSaveProfiles = () => {
    setExpertProfile(tempExpert);
    setPartnerProfile(tempPartner);
    setLawsuitData(tempLawsuit);
    localStorage.setItem('vx_expert_accountant_profile', JSON.stringify(tempExpert));
    localStorage.setItem('vx_associated_partner_profile', JSON.stringify(tempPartner));
    setIsEditProfileModalOpen(false);
    showFeedback('Credenciais do Perito e Parceiro salvas com sucesso!');
  };

  // Totais Periciados
  const totalPrincipal = useMemo(() => pericialItems.reduce((acc, item) => acc + item.principalAmount, 0), [pericialItems]);
  const totalSelic = useMemo(() => pericialItems.reduce((acc, item) => acc + item.selicCorrection, 0), [pericialItems]);
  const totalGeral = useMemo(() => pericialItems.reduce((acc, item) => acc + item.totalCredit, 0), [pericialItems]);
  const totalDocs = useMemo(() => pericialItems.reduce((acc, item) => acc + item.documentsCount, 0), [pericialItems]);

  // Competências Filtradas
  const filteredCompetences = useMemo(() => {
    return competences.filter(c => {
      if (selectedYearFilter !== 'TODOS' && !c.competence.endsWith(selectedYearFilter)) {
        return false;
      }
      if (searchCompetence.trim() && !c.competence.includes(searchCompetence.trim())) {
        return false;
      }
      return true;
    });
  }, [competences, selectedYearFilter, searchCompetence]);

  // Execução da Assinatura Digital
  const handleExecuteDigitalSignature = () => {
    setIsSigningLoading(true);

    setTimeout(() => {
      const now = new Date();
      const signedAt = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')} (BRT)`;
      const certSerialNumber = `ICP-BR-2026-${secureInt(10000000, 99999999)}`;
      const certIssuer = selectedSigMethod === 'ICP_BRASIL_A1'
        ? 'AC SOLUTI Multipla v5 • ICP-Brasil'
        : selectedSigMethod === 'ICP_BRASIL_A3'
        ? 'AC CERTISIGN G7 • SmartCard ICP-Brasil'
        : selectedSigMethod === 'GOV_BR_OURO'
        ? 'Portal Gov.br • Selo de Confiabilidade Ouro (Decreto 10.543/2020)'
        : 'VELATRIX AOS Hardware-Secured Node • SHA-256 RFC 3161';

      const sigLabel = selectedSigMethod === 'ICP_BRASIL_A1'
        ? 'Certificado Digital ICP-Brasil A1'
        : selectedSigMethod === 'ICP_BRASIL_A3'
        ? 'Certificado Digital ICP-Brasil A3 (Token)'
        : selectedSigMethod === 'GOV_BR_OURO'
        ? 'Identidade Digital Gov.br (Ouro)'
        : 'Chave Criptográfica Velatrix AOS';

      const finalHash = computeSha256Sync(`${expertProfile.crc}|${tenantData.cnpj}|${totalGeral}|${now.toISOString()}`);

      const updatedSig: DigitalSignatureRecord = {
        isSigned: true,
        signatureType: selectedSigMethod,
        signatureTypeLabel: sigLabel,
        signedAt,
        signatoryName: expertProfile.name,
        signatoryCrc: expertProfile.crc,
        signatoryCnpc: expertProfile.cnpc,
        certificateIssuer: certIssuer,
        certificateSerialNumber: certSerialNumber,
        sha256Hash: finalHash,
        verificationCode: `LAUDO-AUT-${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}`
      };

      setSignatureRecord(updatedSig);
      localStorage.setItem('vx_expert_digital_signature', JSON.stringify(updatedSig));
      setIsSigningLoading(false);
      setIsSignatureModalOpen(false);
      showFeedback(`Laudo assinado digitalmente com sucesso via ${sigLabel}!`);
    }, 1400);
  };

  const handleRevokeSignature = () => {
    const emptySig: DigitalSignatureRecord = {
      isSigned: false,
      signatureType: 'NONE',
      signatureTypeLabel: 'Não Assinado',
      sha256Hash: computeSha256Sync(tenantData.cnpj + totalGeral + Date.now())
    };
    setSignatureRecord(emptySig);
    localStorage.removeItem('vx_expert_digital_signature');
    showFeedback('Assinatura revogada. Documento aberto para nova certificação.');
  };

  // Exportar Excel
  const handleExportExcel = () => {
    try {
      exportPericialCalculationToExcel({
        clientName: tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
        cnpj: tenantData.cnpj || '33.041.260/0001-88',
        taxRegime: tenantData.taxRegime === 'lucro_real' ? 'Lucro Real' : tenantData.taxRegime === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional',
        expert: expertProfile,
        partner: partnerProfile,
        lawsuit: lawsuitData,
        pericialItems,
        competences,
        signature: signatureRecord
      });
      showFeedback('Planilha Excel (.xlsx) da Memória de Cálculo gerada com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar arquivo Excel.');
    }
  };

  // Gerar PDF do Laudo
  const handleGeneratePdf = () => {
    try {
      generateTechnicalReportPdf({
        clientName: tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
        cnpj: tenantData.cnpj || '33.041.260/0001-88',
        taxRegime: tenantData.taxRegime === 'lucro_real' ? 'Lucro Real' : tenantData.taxRegime === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional',
        expert: expertProfile,
        partner: partnerProfile,
        lawsuit: lawsuitData,
        pericialItems,
        signature: signatureRecord
      });
      showFeedback('Laudo Pericial Contábil em PDF gerado e baixado!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar Laudo PDF.');
    }
  };

  // Copiar Quesitos Formatados
  const handleCopyQuesitos = () => {
    let text = `QUESITOS PERICIAIS DO ASSISTENTE TÉCNICO CONTÁBIL (Art. 465, § 1º, III do CPC)\n`;
    text += `Autos nº: ${lawsuitData.lawsuitNumber} • ${lawsuitData.courtName}\n`;
    text += `Requerente: ${tenantData.companyName} | Patrono: ${partnerProfile.firmName}\n`;
    text += `Assistente Técnico: ${expertProfile.name} (${expertProfile.crc} • ${expertProfile.cnpc})\n\n`;

    quesitosList.forEach((q, idx) => {
      text += `QUESITO ${idx + 1} (${q.categoryLabel}):\n"${q.question}"\n• Objetivo: ${q.purpose}\n• Fundamento Legal: ${q.legalBasis}\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedQuesitos(true);
    setTimeout(() => setCopiedQuesitos(false), 2500);
    showFeedback('Quesitos copiados para a área de transferência!');
  };

  // Exportar Quesitos em TXT
  const handleExportQuesitosTxt = () => {
    exportQuesitosToTxt({
      clientName: tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
      cnpj: tenantData.cnpj || '33.041.260/0001-88',
      expert: expertProfile,
      partner: partnerProfile,
      lawsuit: lawsuitData,
      quesitos: quesitosList
    });
    showFeedback('Arquivo de petição de quesitos (.txt) baixado!');
  };

  // Adicionar Quesito Personalizado
  const handleAddQuesito = () => {
    if (!newQuesitoText.trim()) return;

    const newQ: PericialQuesitoItem = {
      id: `quesito-custom-${Date.now()}`,
      orderNumber: quesitosList.length + 1,
      category: newQuesitoCategory,
      categoryLabel: newQuesitoCategory === 'DEFESA_CONTRIBUINTE' ? 'Defesa do Contribuinte' : newQuesitoCategory,
      question: newQuesitoText.trim(),
      purpose: newQuesitoPurpose.trim() || 'Demonstrar inconsistência na autuação fiscal ou ausência de cômputo de créditos.',
      legalBasis: newQuesitoBasis.trim() || 'Código de Processo Civil e Normas Brasileiras de Contabilidade (NBC TP 01).',
      expectedOutcome: 'Esclarecimento técnico favorável à tese da empresa contribuinte.'
    };

    const updated = [...quesitosList, newQ];
    setQuesitosList(updated);
    localStorage.setItem('vx_expert_quesitos_list', JSON.stringify(updated));
    setNewQuesitoText('');
    setNewQuesitoPurpose('');
    setNewQuesitoBasis('');
    setIsAddQuesitoOpen(false);
    showFeedback('Novo quesito pericial incluído com sucesso!');
  };

  const handleRemoveQuesito = (id: string) => {
    const updated = quesitosList.filter(q => q.id !== id);
    setQuesitosList(updated);
    localStorage.setItem('vx_expert_quesitos_list', JSON.stringify(updated));
    showFeedback('Quesito removido.');
  };

  return (
    <div id="panel-expert-accountant" className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs font-mono text-emerald-300 flex items-center justify-between shadow-lg shadow-emerald-950/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <span className="text-[10px] text-emerald-400/70 font-bold">AOS AUDIT OK</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* HEADER PRINCIPAL: MÓDULO PERITO CONTÁBIL & ASSISTENTE TÉCNICO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--vx-deep)] border-2 border-emerald-500/50 rounded-2xl p-5 lg:p-6 shadow-2xl shadow-emerald-950/20 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                MÓDULO DE PERÍCIA CONTÁBIL &amp; ASSISTÊNCIA TÉCNICA JUDICIAL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 font-bold">
                NBC TP 01 / NBC PP 01 (CFC)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold flex items-center gap-1">
                <Scale className="w-3 h-3 text-cyan-400" />
                Art. 465 e 477 do CPC
              </span>
              {signatureRecord.isSigned ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Laudo Assinado ({signatureRecord.signatureTypeLabel})
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Aguardando Assinatura ICP-Brasil
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight font-mono flex items-center gap-2">
              <span>Perito Contábil &amp; Assistente Técnico Judicial</span>
            </h1>

            <p className="text-xs text-slate-300 max-w-4xl font-mono leading-relaxed">
              Módulo especializado em liquidação de sentença, impugnação de autos de infração e elaboração de laudos periciais para embargos à execução fiscal e compensação perante a Receita Federal do Brasil.
            </p>
          </div>

          {/* Ações de Topo */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setTempExpert(expertProfile);
                setTempPartner(partnerProfile);
                setTempLawsuit(lawsuitData);
                setIsEditProfileModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Editar Qualificações</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/70 text-xs font-mono text-emerald-300 font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleGeneratePdf}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              <span>Gerar Laudo em PDF</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* CARDS TRIPLOS DE QUALIFICAÇÃO: CLIENTE • PARCEIRO • PERITO */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* CARD 1: CLIENTE (EMBARGANTE / REQUERENTE) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                Cliente / Requerente
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                {tenantData.taxRegime === 'lucro_real' ? 'Lucro Real' : tenantData.taxRegime === 'lucro_presumido' ? 'Lucro Presumido' : 'Simples Nacional'}
              </span>
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 truncate" title={tenantData.companyName}>
                {tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A'}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                CNPJ: <strong className="text-slate-200">{tenantData.cnpj || '33.041.260/0001-88'}</strong>
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                Setor: {tenantData.sectorName || 'Indústria & Manufatura'} • ERP: <span className="text-cyan-400">{tenantData.activeErp || 'TOTVS Protheus'}</span>
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Período Auditado:</span>
              <span className="text-emerald-400 font-bold">60 Meses Pretéritos</span>
            </div>
          </div>

          {/* CARD 2: PARCEIRO ASSOCIADO (ESCRITÓRIO DE ADVOCACIA) */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-indigo-400" />
                Parceiro / Advocacia
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                Patrono
              </span>
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-slate-100 truncate" title={partnerProfile.firmName}>
                {partnerProfile.firmName}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Advogado: <strong className="text-slate-200">{partnerProfile.lawyerName}</strong>
              </p>
              <p className="text-[10px] font-mono text-slate-400">
                Inscrição: <span className="text-indigo-300 font-bold">{partnerProfile.oab}</span> • CNPJ: {partnerProfile.cnpj}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Autos / Processo:</span>
              <span className="text-indigo-300 font-bold truncate max-w-[140px]" title={lawsuitData.lawsuitNumber}>
                {lawsuitData.lawsuitNumber}
              </span>
            </div>
          </div>

          {/* CARD 3: PERITO CONTÁBIL RESPONSÁVEL (ASSISTENTE TÉCNICO) */}
          <div className="p-4 bg-gradient-to-br from-[var(--vx-deep)] via-[#091E2A] to-[var(--vx-deep)] border border-emerald-500/50 rounded-xl space-y-2 shadow-lg shadow-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Perito Contador Assistente
              </span>
              <span className="text-[9px] font-mono px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                Habilitado CFC
              </span>
            </div>
            <div>
              <h3 className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                <span>{expertProfile.name}</span>
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-amber-800/80">
                  {expertProfile.crc}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-cyan-800/80">
                  {expertProfile.cnpc}
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-300 mt-1 line-clamp-1" title={expertProfile.specialty}>
                {expertProfile.specialty}
              </p>
            </div>
            <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400">Certificação:</span>
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Cadastro Nacional (CNPC)
              </span>
            </div>
          </div>

        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* BARRA DE METRICAS CONSOLIDADAS PERICIAIS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Indébito Principal (60M)</span>
            <span className="text-base sm:text-lg font-black font-mono text-slate-100">
              {formatCurrency(totalPrincipal, 'BRL')}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">Recolhimento a maior apurado</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 block">Correção Monetária (SELIC)</span>
            <span className="text-base sm:text-lg font-black font-mono text-amber-300">
              {formatCurrency(totalSelic, 'BRL')}
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">Art. 39, § 4º da Lei 9.250/95</span>
          </div>

          <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40 space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Total Periciado Líquido</span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-300">
              {formatCurrency(totalGeral, 'BRL')}
            </span>
            <span className="text-[9px] font-mono text-emerald-400/80 block">Crédito Certo e Exigível</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono uppercase text-cyan-400 block">Documentos Auditados</span>
            <span className="text-base sm:text-lg font-black font-mono text-cyan-300">
              {totalDocs.toLocaleString('pt-BR')} docs
            </span>
            <span className="text-[9px] font-mono text-slate-400 block">EFD-ICMS/IPI e EFD-Contribuições</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* ATALHOS DE INTEGRAÇÃO RÁPIDA COM O RESTANTE DO FLUXO */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Fluxo Integrado Velatrix:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToCalculoPericial && (
              <button
                type="button"
                onClick={onNavigateToCalculoPericial}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-cyan-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Calculator className="w-3 h-3" />
                <span>Abrir Motor de Cálculo Detalhado →</span>
              </button>
            )}
            {onNavigateToTimeline60M && (
              <button
                type="button"
                onClick={onNavigateToTimeline60M}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Calendar className="w-3 h-3" />
                <span>Linha do Tempo 60 Meses →</span>
              </button>
            )}
            {onOpenDocPreview && (
              <button
                type="button"
                onClick={() => onOpenDocPreview('laudo_pericial_60m')}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <FileText className="w-3 h-3" />
                <span>Dossiê &amp; Modal de Documentos →</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABAS INTERNAS DO MÓDULO PERICIAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('memoria_calculo')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'memoria_calculo'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>1. Memória de Cálculo Auditável</span>
          <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
            Excel .xlsx
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('laudo_tecnico')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'laudo_tecnico'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
          <span>2. Laudo / Parecer Técnico em PDF</span>
          <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded">
            NBC TP 01
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assinatura')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'assinatura'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Assinatura Digital do Laudo</span>
          {signatureRecord.isSigned ? (
            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded">
              Assinado
            </span>
          ) : (
            <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.2 rounded">
              Pendente
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('quesitos')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'quesitos'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-md shadow-indigo-950/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-indigo-400" />
          <span>4. Quesitos Periciais (Execução Fiscal)</span>
          <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.2 rounded">
            {quesitosList.length} formulados
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('qualificacao')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'qualificacao'
              ? 'bg-slate-800 text-slate-200 border border-slate-600'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Qualificação &amp; Autos</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONTEÚDO DA ABA 1: MEMÓRIA DE CÁLCULO AUDITÁVEL & EXPORTAÇÃO EXCEL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'memoria_calculo' && (
        <div className="space-y-6">
          
          {/* Header da Seção com Botão de Exportação Excel */}
          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Demonstrativo Analítico e Memória de Cálculo 60 Meses</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Detalhamento dos fatos geradores auditados no SPED Fiscal (EFD-ICMS/IPI e EFD-Contribuições), com segregação de monofásicos, exclusão do ICMS/ISS e recomposição pela SELIC.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-mono text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                <span>Exportar Memória em Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* TABELA SINTÉTICA DE TESES APURADAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-300 font-bold">
                1.1 Consolidação das Teses Periciadas e Indébitos Apurados:
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Total de Teses: <strong className="text-emerald-300">{pericialItems.length}</strong>
              </span>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950/90">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th className="p-3">Código / Tese Pericial</th>
                    <th className="p-3">Fundamentação Legal / Jurisprudência</th>
                    <th className="p-3 text-right">Base Auditada</th>
                    <th className="p-3 text-right">Indébito Principal</th>
                    <th className="p-3 text-right">SELIC Acumulada</th>
                    <th className="p-3 text-right">Total Periciado</th>
                    <th className="p-3 text-center">Docs</th>
                    <th className="p-3 text-center">Status Jurídico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {pericialItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-slate-100 block">{item.teseName}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{item.teseCode}</span>
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs leading-relaxed text-[11px]">
                        {item.legalBasis}
                      </td>
                      <td className="p-3 text-right text-slate-200 font-bold">
                        {formatCurrency(item.baseAmount, 'BRL')}
                      </td>
                      <td className="p-3 text-right text-slate-100 font-bold">
                        {formatCurrency(item.principalAmount, 'BRL')}
                      </td>
                      <td className="p-3 text-right text-amber-300 font-bold">
                        {formatCurrency(item.selicCorrection, 'BRL')}
                      </td>
                      <td className="p-3 text-right text-emerald-300 font-black text-sm">
                        {formatCurrency(item.totalCredit, 'BRL')}
                      </td>
                      <td className="p-3 text-center text-slate-400 text-[11px]">
                        {item.documentsCount.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold inline-block">
                          {item.statusLegalLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 font-bold text-slate-100 border-t-2 border-slate-700">
                    <td className="p-3 font-mono" colSpan={2}>
                      TOTAL GERAL CONSOLIDADO (CRÉDITO LÍQUIDO E CERTO)
                    </td>
                    <td className="p-3 text-right font-mono text-slate-200">
                      {formatCurrency(pericialItems.reduce((acc, i) => acc + i.baseAmount, 0), 'BRL')}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-100">
                      {formatCurrency(totalPrincipal, 'BRL')}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-300">
                      {formatCurrency(totalSelic, 'BRL')}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 text-base font-black">
                      {formatCurrency(totalGeral, 'BRL')}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-300">
                      {totalDocs.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                        Pronto p/ PER/DCOMP
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* TABELA ANALÍTICA MÊS A MÊS (60 COMPETÊNCIAS) */}
          <div className="space-y-3 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>1.2 Memória de Cálculo Mensal (60 Competências Auditadas):</span>
                </span>
                <p className="text-[11px] font-mono text-slate-400">
                  Evolução temporal com a respectiva taxa SELIC capitalizada mês a mês (Súmula 523 do STF).
                </p>
              </div>

              {/* Filtros de Ano e Busca */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-[11px] font-mono">
                  {(['TODOS', '2021', '2022', '2023', '2024', '2025', '2026'] as const).map(yr => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setSelectedYearFilter(yr)}
                      className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        selectedYearFilter === yr
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchCompetence}
                    onChange={(e) => setSearchCompetence(e.target.value)}
                    placeholder="Mês (ex: 03/2023)"
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950 max-h-96">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 border-b border-slate-800 shadow-sm">
                  <tr>
                    <th className="p-2.5">Competência</th>
                    <th className="p-2.5 text-right">Faturamento</th>
                    <th className="p-2.5 text-right">ICMS Destacado</th>
                    <th className="p-2.5 text-right">PIS Indébito</th>
                    <th className="p-2.5 text-right">COFINS Indébito</th>
                    <th className="p-2.5 text-right">Monofásico</th>
                    <th className="p-2.5 text-right">Insumos</th>
                    <th className="p-2.5 text-right font-bold text-slate-200">Principal Mês</th>
                    <th className="p-2.5 text-center text-amber-300">SELIC (%)</th>
                    <th className="p-2.5 text-right text-amber-300">Acréscimo SELIC</th>
                    <th className="p-2.5 text-right text-emerald-300 font-bold">Total Corrigido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {filteredCompetences.map((c) => (
                    <tr key={c.competence} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-2.5 font-bold text-slate-200">{c.competence}</td>
                      <td className="p-2.5 text-right text-slate-400">{formatCurrency(c.revenueTotal, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-400">{formatCurrency(c.icmsDestacado, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-300">{formatCurrency(c.pisIndebito, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-300">{formatCurrency(c.cofinsIndebito, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-400">{formatCurrency(c.monofasicoCredit, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-400">{formatCurrency(c.insumosCredit, 'BRL')}</td>
                      <td className="p-2.5 text-right text-slate-100 font-bold">{formatCurrency(c.principalTotal, 'BRL')}</td>
                      <td className="p-2.5 text-center text-amber-300 font-bold">{c.selicRateAcum.toFixed(1)}%</td>
                      <td className="p-2.5 text-right text-amber-300">{formatCurrency(c.selicAmount, 'BRL')}</td>
                      <td className="p-2.5 text-right text-emerald-300 font-bold">{formatCurrency(c.totalCorrigido, 'BRL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span>Exibindo <strong>{filteredCompetences.length}</strong> de 60 competências apuradas.</span>
              <span>Auditoria EFD-Contribuições: <strong className="text-emerald-400">100% Conciliada</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONTEÚDO DA ABA 2: LAUDO / PARECER TÉCNICO PERICIAL EM PDF */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'laudo_tecnico' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Laudo Pericial Contábil Judicial (Formato Formal A4)</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Estruturado nos moldes do Artigo 473 do Código de Processo Civil e das Normas Brasileiras de Contabilidade (NBC TP 01 - Perícia Contábil).
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePdf}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-mono text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>Baixar Laudo Técnico (.pdf)</span>
              </button>
            </div>
          </div>

          {/* PREVIEW FORMAL DO LAUDO TÉCNICO (SIMULAÇÃO DE FOLHA A4) */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 font-mono text-xs text-slate-300 max-w-4xl mx-auto shadow-2xl">
            
            {/* Cabeçalho do Laudo */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest block">
                JUSTIÇA FEDERAL • SEÇÃO JUDICIÁRIA DE SÃO PAULO
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-100">
                LAUDO PERICIAL CONTÁBIL E ASSISTÊNCIA TÉCNICA
              </h3>
              <p className="text-[11px] text-slate-400">
                Autos nº: <strong className="text-slate-200">{lawsuitData.lawsuitNumber}</strong> • {lawsuitData.courtName}
              </p>
              <p className="text-[10px] text-slate-500">
                Assunto: Liquidação e Exclusão do ICMS da Base de Cálculo PIS/COFINS (Tema 69 STF) e Produtos Monofásicos
              </p>
            </div>

            {/* Identificação das Partes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Requerente / Executada:</span>
                <span className="font-bold text-slate-100">{tenantData.companyName || 'VORTEX INDUSTRIAL & LOGÍSTICA S/A'}</span>
                <span className="text-slate-400 block">CNPJ: {tenantData.cnpj || '33.041.260/0001-88'}</span>
                <span className="text-slate-400 block">Patrono: {partnerProfile.firmName} ({partnerProfile.oab})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Assistente Técnico Contábil:</span>
                <span className="font-bold text-emerald-300">{expertProfile.name}</span>
                <span className="text-slate-300 block">Registro: <strong>{expertProfile.crc}</strong></span>
                <span className="text-slate-300 block">Cadastro Nacional de Peritos: <strong>{expertProfile.cnpc}</strong></span>
              </div>
            </div>

            {/* Seções Estruturadas Formais */}
            <div className="space-y-4 leading-relaxed text-slate-300 text-justify text-[11px]">
              <div>
                <h4 className="font-bold text-slate-100 text-xs uppercase text-left border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="text-cyan-400">I.</span> Objeto da Perícia
                </h4>
                <p>
                  O presente trabalho pericial tem por objetivo proceder ao exame contábil-fiscal das operações mercantis e apurações tributárias realizadas pela Requerente no período dos últimos 60 (sessenta) meses, visando quantificar os valores recolhidos a maior a título de PIS e COFINS decorrentes da indevida inclusão do ICMS destacado nas notas fiscais de saída, nos exatos termos do precedente vinculante fixado pelo Supremo Tribunal Federal no RE 574.706/PR (Tema 69), bem como apurar créditos decorrentes da tributação monofásica e insumos operacionais essenciais.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 text-xs uppercase text-left border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="text-cyan-400">II.</span> Metodologia Pericial e Procedimentos Técnicos
                </h4>
                <p>
                  Os trabalhos foram desenvolvidos com estrita observância das Normas Brasileiras de Contabilidade NBC TP 01 (Perícia Contábil) e NBC PP 01 (Perito Contábil). Utilizou-se como base documental primária 100% dos arquivos magnéticos da EFD-ICMS/IPI (Blocos C100, C170 e E110) e da EFD-Contribuições (Blocos C100, C170, M200 e M600) entregues ao Sped. A atualização monetária foi calculada com base na Taxa SELIC acumulada a partir do mês subsequente ao pagamento indevido, conforme Súmula 523 do STF e Art. 39 da Lei nº 9.250/95.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 text-xs uppercase text-left border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="text-cyan-400">III.</span> Demonstrativo Numérico Apurado
                </h4>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">1. Indébito Principal (Tema 69 STF + Monofásicos + ISS):</span>
                    <span className="font-bold text-slate-100">{formatCurrency(totalPrincipal, 'BRL')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300">2. Atualização Monetária pela Taxa SELIC (60 meses):</span>
                    <span className="font-bold text-amber-300">{formatCurrency(totalSelic, 'BRL')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                    <span className="text-emerald-400 uppercase">VALOR TOTAL DO CRÉDITO LIQUIDADO:</span>
                    <span className="text-emerald-300">{formatCurrency(totalGeral, 'BRL')}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-100 text-xs uppercase text-left border-b border-slate-800 pb-1 mb-1.5 flex items-center gap-1.5">
                  <span className="text-cyan-400">IV.</span> Conclusão Pericial
                </h4>
                <p>
                  Diante do conjunto de provas documentais e dos exames periciais realizados, este Perito Assistente Técnico conclui categoricamente que a Requerente faz jus ao crédito tributário líquido, certo e exigível de <strong>{formatCurrency(totalGeral, 'BRL')}</strong>, apto a fundamentar compensação perante a Receita Federal do Brasil ou abater execuções fiscais em curso.
                </p>
              </div>
            </div>

            {/* Box de Assinatura no Laudo */}
            <div className="pt-4 border-t-2 border-slate-800 space-y-3">
              <div className="p-4 bg-slate-900/90 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-slate-100 text-xs">{expertProfile.name}</h5>
                  <p className="text-[10px] text-slate-400">
                    Perito Contador Assistente Técnico • {expertProfile.crc} • {expertProfile.cnpc}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                    {signatureRecord.isSigned
                      ? `Certificado Digitalmente: ${signatureRecord.signatureTypeLabel} (${signatureRecord.signedAt})`
                      : 'Aguardando Assinatura Digital do Perito'}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!signatureRecord.isSigned ? (
                    <button
                      type="button"
                      onClick={() => setIsSignatureModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Assinar Laudo Digitalmente</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Autenticado ICP-Brasil
                      </span>
                      <button
                        type="button"
                        onClick={handleRevokeSignature}
                        className="text-[10px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
                      >
                        Revogar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 font-mono text-center">
                Hash Criptográfico de Integridade (SHA-256): <span className="text-slate-400 font-mono">{signatureRecord.sha256Hash}</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONTEÚDO DA ABA 3: FLUXO DE ASSINATURA DIGITAL DO LAUDO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'assinatura' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Gestão de Assinatura Digital do Laudo Pericial</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Assine com Certificado Digital ICP-Brasil (A1/A3), Identidade Gov.br (Decreto 10.543/2020) ou carimbo criptográfico com validade jurídica perante o Poder Judiciário.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!signatureRecord.isSigned ? (
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-black flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <KeyRound className="w-4 h-4 text-slate-950" />
                  <span>Iniciar Assinatura Digital</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRevokeSignature}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-700 text-xs font-mono text-slate-300 hover:text-rose-300 cursor-pointer"
                >
                  Revogar Assinatura
                </button>
              )}
            </div>
          </div>

          {/* Status Detalhado da Assinatura */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status da Certificação Digital:</span>
              </span>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Situação do Documento:</span>
                  {signatureRecord.isSigned ? (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Assinado e Válido
                    </span>
                  ) : (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      Aguardando Certificação
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Modalidade:</span>
                  <span className="text-slate-200 font-bold">{signatureRecord.signatureTypeLabel}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Signatário:</span>
                  <span className="text-slate-200">{signatureRecord.signatoryName || expertProfile.name}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Registro Profissional:</span>
                  <span className="text-amber-300 font-bold">{signatureRecord.signatoryCrc || expertProfile.crc}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Cadastro Peritos (CFC):</span>
                  <span className="text-cyan-300 font-bold">{signatureRecord.signatoryCnpc || expertProfile.cnpc}</span>
                </div>

                {signatureRecord.isSigned && (
                  <>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Data/Hora Carimbo:</span>
                      <span className="text-emerald-300 font-bold">{signatureRecord.signedAt}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Código de Verificação:</span>
                      <span className="text-cyan-400 font-bold">{signatureRecord.verificationCode}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-mono text-slate-200 font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Laudo PDF Assinado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-bold cursor-pointer"
                >
                  <span>{signatureRecord.isSigned ? 'Reassinar' : 'Assinar Agora'}</span>
                </button>
              </div>
            </div>

            {/* Informações de Validade Jurídica e ICP-Brasil */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
              <span className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Validade Jurídica e Padrões Suportados:</span>
              </span>

              <div className="space-y-2.5 text-xs font-mono text-slate-400">
                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-850 space-y-1">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span>• ICP-Brasil (Certificados A1 e A3)</span>
                    <span className="text-[10px] text-emerald-400">Padrão OAB / CFC</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Validade plena conforme Medida Provisória nº 2.200-2/2001 e Art. 441 do CPC para juntada pericial em tribunais de justiça (PJe, e-Proc, ESAJ).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-850 space-y-1">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span>• Assinatura Avançada Gov.br (Prata / Ouro)</span>
                    <span className="text-[10px] text-cyan-400">Decreto 10.543/2020</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Permite ao Perito assinar eletronicamente através de sua conta Gov.br Ouro/Prata para processos administrativos perante a Receita Federal e PGFN.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-850 space-y-1">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span>• Integridade SHA-256 e Timestamp RFC 3161</span>
                    <span className="text-[10px] text-indigo-400">Imutabilidade</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Gera digest criptográfico permanente gravado no log de auditoria do AOS, impedindo qualquer alteração superveniente dos cálculos.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400">
                Hash SHA-256 Vigente: <strong className="text-cyan-300 font-mono block mt-0.5 break-all">{signatureRecord.sha256Hash}</strong>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONTEÚDO DA ABA 4: QUESITOS PERICIAIS / EXECUÇÃO FISCAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'quesitos' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                <span>Quesitos Periciais para Execução Fiscal &amp; Embargos (CPC, Art. 465)</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Formulação estratégica de perguntas técnicas para resposta do Perito do Juízo, embasadas na jurisprudência vinculante do STF e STJ.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyQuesitos}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copiedQuesitos ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedQuesitos ? 'Copiado!' : 'Copiar Todos'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportQuesitosTxt}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar TXT</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddQuesitoOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Quesito</span>
              </button>
            </div>
          </div>

          {/* LISTA DE QUESITOS FORMULADOS */}
          <div className="space-y-3">
            {quesitosList.map((quesito, index) => (
              <div
                key={quesito.id}
                className="p-4 bg-slate-950/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl space-y-2.5 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-indigo-800 font-bold uppercase">
                      {quesito.categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(quesito.question);
                        showFeedback(`Quesito ${index + 1} copiado!`);
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuesito(quesito.id)}
                      className="text-[10px] font-mono text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-900 cursor-pointer"
                      title="Excluir quesito"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Texto do Quesito */}
                <p className="text-xs font-mono font-bold text-slate-100 leading-relaxed pl-8">
                  "{quesito.question}"
                </p>

                {/* Justificativa e Fundamentação */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-8 pt-1 text-[11px] font-mono">
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850 space-y-0.5">
                    <span className="text-[10px] uppercase text-indigo-400 font-bold block">Finalidade Processual Estratégica:</span>
                    <span className="text-slate-300 leading-relaxed">{quesito.purpose}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-850 space-y-0.5">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold block">Base Legal &amp; Jurisprudencial:</span>
                    <span className="text-slate-300 leading-relaxed">{quesito.legalBasis}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONTEÚDO DA ABA 5: QUALIFICAÇÃO & DADOS DO PROCESSO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'qualificacao' && (
        <div className="space-y-6">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-slate-300" />
                <span>Cadastro e Qualificação das Partes e Patronos</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Dados oficiais inseridos automaticamente nos laudos, petições e planilhas periciais.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempExpert(expertProfile);
                setTempPartner(partnerProfile);
                setTempLawsuit(lawsuitData);
                setIsEditProfileModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Editar Cadastros</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Perito */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Perito Contador Assistente Técnico</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Nome:</span>
                  <span className="text-slate-100 font-bold">{expertProfile.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Registro CRC:</span>
                  <span className="text-amber-300 font-bold">{expertProfile.crc}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Registro CNPC (CFC):</span>
                  <span className="text-cyan-300 font-bold">{expertProfile.cnpc}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">CPF:</span>
                  <span className="text-slate-200">{expertProfile.cpf}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">E-mail:</span>
                  <span className="text-slate-200">{expertProfile.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Telefone:</span>
                  <span className="text-slate-200">{expertProfile.phone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Comarca:</span>
                  <span className="text-slate-200">{expertProfile.city}/{expertProfile.state}</span>
                </div>
              </div>
            </div>

            {/* Parceiro & Processo */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-xs font-mono uppercase text-indigo-400 font-bold flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>Escritório Associado &amp; Dados Judiciais</span>
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Escritório:</span>
                  <span className="text-slate-100 font-bold">{partnerProfile.firmName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Advogado:</span>
                  <span className="text-slate-200 font-bold">{partnerProfile.lawyerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Inscrição OAB:</span>
                  <span className="text-indigo-300 font-bold">{partnerProfile.oab}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Autos Processuais:</span>
                  <span className="text-slate-100 font-bold">{lawsuitData.lawsuitNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-400">Juízo Competente:</span>
                  <span className="text-slate-300">{lawsuitData.courtName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Títulos (CDA):</span>
                  <span className="text-slate-300">{lawsuitData.cdaNumbers.join(', ')}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: FLUXO DE ASSINATURA DIGITAL (ICP-BRASIL / GOV.BR / AOS) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-mono text-slate-100">Assinatura Digital do Laudo Pericial</h3>
                  <span className="text-[10px] font-mono text-slate-400">Padrão ICP-Brasil • Gov.br • Validade Forense</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Seleção do Tipo de Certificado */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono text-slate-300 font-bold block">Selecione o Método de Assinatura:</span>
              
              <div className="grid grid-cols-1 gap-2 text-xs font-mono">
                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedSigMethod === 'ICP_BRASIL_A1'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="sigMethod"
                      checked={selectedSigMethod === 'ICP_BRASIL_A1'}
                      onChange={() => setSelectedSigMethod('ICP_BRASIL_A1')}
                      className="text-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">Certificado ICP-Brasil A1 (Arquivo .pfx/.p12)</span>
                      <span className="text-[10px] text-slate-400">Assinatura direta em nuvem ou repositório seguro</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                    Recomendado
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedSigMethod === 'ICP_BRASIL_A3'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="sigMethod"
                      checked={selectedSigMethod === 'ICP_BRASIL_A3'}
                      onChange={() => setSelectedSigMethod('ICP_BRASIL_A3')}
                      className="text-emerald-500"
                    />
                    <div>
                      <span className="font-bold block">Certificado ICP-Brasil A3 (Token Físico / SmartCard)</span>
                      <span className="text-[10px] text-slate-400">Integração via WebPKI / Certisign / Serpro</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                    Hardware
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedSigMethod === 'GOV_BR_OURO'
                    ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="sigMethod"
                      checked={selectedSigMethod === 'GOV_BR_OURO'}
                      onChange={() => setSelectedSigMethod('GOV_BR_OURO')}
                      className="text-cyan-500"
                    />
                    <div>
                      <span className="font-bold block">Assinatura Eletrônica Gov.br (Prata / Ouro)</span>
                      <span className="text-[10px] text-slate-400">Decreto nº 10.543/2020 para processos RFB/PGFN</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                    Gov.br
                  </span>
                </label>

                <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedSigMethod === 'VELATRIX_AOS_CRYPTO'
                    ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="sigMethod"
                      checked={selectedSigMethod === 'VELATRIX_AOS_CRYPTO'}
                      onChange={() => setSelectedSigMethod('VELATRIX_AOS_CRYPTO')}
                      className="text-indigo-500"
                    />
                    <div>
                      <span className="font-bold block">Chave Criptográfica Local Velatrix AOS</span>
                      <span className="text-[10px] text-slate-400">Carimbo de tempo RFC 3161 e hash SHA-256 imediato</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 font-bold">
                    Imediato
                  </span>
                </label>
              </div>
            </div>

            {/* Campos Específicos por Tipo */}
            {selectedSigMethod === 'ICP_BRASIL_A3' && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-slate-300 block">Senha PIN do Token A3:</span>
                <input
                  type="password"
                  value={tokenPin}
                  onChange={(e) => setTokenPin(e.target.value)}
                  placeholder="Insira o PIN do certificado A3..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] font-mono text-slate-400">Conecte o token USB à porta local antes de confirmar.</span>
              </div>
            )}

            {/* Dados que serão gravados no Laudo */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Perito Signatário:</span>
                <span className="text-slate-100 font-bold">{expertProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CRC / CNPC:</span>
                <span className="text-amber-300 font-bold">{expertProfile.crc} • {expertProfile.cnpc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor Periciado Liquidado:</span>
                <span className="text-emerald-300 font-bold">{formatCurrency(totalGeral, 'BRL')}</span>
              </div>
            </div>

            {/* Botões de Ação do Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteDigitalSignature}
                disabled={isSigningLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-mono text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSigningLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Autenticando Certificado...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 text-slate-950" />
                    <span>Confirmar Assinatura Digital</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: EDIÇÃO DE QUALIFICAÇÃO (PERITO, PARCEIRO E PROCESSO) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--vx-deep)] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Editar Dados do Perito, Parceiro e Processo Judicial</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs font-mono">
              
              {/* DADOS DO PERITO */}
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3">
                <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>1. Dados do Perito Contador Assistente</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Nome Completo:</label>
                    <input
                      type="text"
                      value={tempExpert.name}
                      onChange={(e) => setTempExpert({ ...tempExpert, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Registro CRC:</label>
                    <input
                      type="text"
                      value={tempExpert.crc}
                      onChange={(e) => setTempExpert({ ...tempExpert, crc: e.target.value })}
                      placeholder="Ex: CRC/SP 1SP248.910/O-4"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cadastro Nacional de Peritos (CNPC):</label>
                    <input
                      type="text"
                      value={tempExpert.cnpc}
                      onChange={(e) => setTempExpert({ ...tempExpert, cnpc: e.target.value })}
                      placeholder="Ex: CNPC nº 4.819"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">E-mail Profissional:</label>
                    <input
                      type="email"
                      value={tempExpert.email}
                      onChange={(e) => setTempExpert({ ...tempExpert, email: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Especialidade / Qualificação Técnica:</label>
                    <input
                      type="text"
                      value={tempExpert.specialty}
                      onChange={(e) => setTempExpert({ ...tempExpert, specialty: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS DO PARCEIRO */}
              <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5" />
                  <span>2. Escritório Parceiro Associado</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Nome do Escritório:</label>
                    <input
                      type="text"
                      value={tempPartner.firmName}
                      onChange={(e) => setTempPartner({ ...tempPartner, firmName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Advogado Responsável:</label>
                    <input
                      type="text"
                      value={tempPartner.lawyerName}
                      onChange={(e) => setTempPartner({ ...tempPartner, lawyerName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Inscrição OAB:</label>
                    <input
                      type="text"
                      value={tempPartner.oab}
                      onChange={(e) => setTempPartner({ ...tempPartner, oab: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">CNPJ da Sociedade:</label>
                    <input
                      type="text"
                      value={tempPartner.cnpj}
                      onChange={(e) => setTempPartner({ ...tempPartner, cnpj: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* DADOS DO PROCESSO */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>3. Dados do Processo / Procedimento</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Número dos Autos:</label>
                    <input
                      type="text"
                      value={tempLawsuit.lawsuitNumber}
                      onChange={(e) => setTempLawsuit({ ...tempLawsuit, lawsuitNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Vara / Juízo:</label>
                    <input
                      type="text"
                      value={tempLawsuit.courtName}
                      onChange={(e) => setTempLawsuit({ ...tempLawsuit, courtName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Natureza da Causa:</label>
                    <input
                      type="text"
                      value={tempLawsuit.actionType}
                      onChange={(e) => setTempLawsuit({ ...tempLawsuit, actionType: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveProfiles}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-mono text-xs font-black cursor-pointer shadow-md shadow-emerald-600/20"
              >
                Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: ADICIONAR NOVO QUESITO JUDICIAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isAddQuesitoOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--vx-deep)] border border-indigo-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Formular Novo Quesito Pericial</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddQuesitoOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1 font-bold">Categoria do Quesito:</label>
                <select
                  value={newQuesitoCategory}
                  onChange={(e) => setNewQuesitoCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="DEFESA_CONTRIBUINTE">Defesa do Contribuinte (Geral)</option>
                  <option value="TEMA_69_STF">Tema 69 STF (ICMS na Base PIS/COFINS)</option>
                  <option value="MONOFASICO">Produtos Monofásicos &amp; Alíquota Zero</option>
                  <option value="SELIC">Atualização Monetária &amp; Taxa SELIC</option>
                  <option value="INSUMOS">Tema 779 STJ (Insumos Essenciais)</option>
                  <option value="REPLICA_FAZENDA">Réplica à Impugnação da Fazenda Nacional</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Texto do Quesito (Pergunta ao Perito):</label>
                <textarea
                  rows={3}
                  value={newQuesitoText}
                  onChange={(e) => setNewQuesitoText(e.target.value)}
                  placeholder="Queira o Senhor Perito informar se..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Finalidade Processual / Estratégica:</label>
                <input
                  type="text"
                  value={newQuesitoPurpose}
                  onChange={(e) => setNewQuesitoPurpose(e.target.value)}
                  placeholder="Ex: Demonstrar inexistência de cumulação de juros moratórios com SELIC."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Fundamentação Legal / Jurisprudencial:</label>
                <input
                  type="text"
                  value={newQuesitoBasis}
                  onChange={(e) => setNewQuesitoBasis(e.target.value)}
                  placeholder="Ex: STF Tema 69 • Lei 9.250/95, art. 39, § 4º."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddQuesitoOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleAddQuesito}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold cursor-pointer"
              >
                Adicionar Quesito
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
