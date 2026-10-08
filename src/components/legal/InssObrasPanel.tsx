import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  HardHat, 
  Calculator, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Layers, 
  Clock, 
  FileSpreadsheet, 
  Plus, 
  Search, 
  Filter, 
  Hash, 
  Copy, 
  Award, 
  Check, 
  ChevronRight, 
  Scale, 
  ArrowUpRight, 
  Sliders, 
  Lock, 
  XCircle, 
  Calendar, 
  Percent, 
  Users, 
  FileCheck 
} from 'lucide-react';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { 
  CnoMatricula, 
  InvoiceRetentionItem, 
  IndirectAfferenceSimulation, 
  DeclaratoryIntegrationRecord, 
  InssObrasDossierPericial,
  ConstructionWorkType,
  ConstructionStandard
} from '../../types/inssObras';
import { 
  CUB_REGIONAL_TABLE, 
  RMT_PERCENTAGE_TABLE, 
  loadCnoListFromStorage, 
  saveCnoListToStorage, 
  loadInvoicesFromStorage, 
  saveInvoicesToStorage, 
  DEFAULT_DECLARATORY_RECORDS,
  calculateIndirectAfference,
  calculateInvoiceRetention,
  generateInssObrasDossier
} from '../../services/inssObrasService';
import { generateInssObrasPericialPdf } from '../../services/pdfReportService';
import { secureInt } from '../../lib/demoMode';

interface InssObrasPanelProps {
  onBackToDashboard?: () => void;
  onNavigateTab?: (tab: any) => void;
  onAddAuditRecord?: (record: any) => void;
}

type SubTabType = 
  | 'visao_geral_cno' 
  | 'calculadora_retencao' 
  | 'restituicao_compensacao' 
  | 'afericao_indireta_sero' 
  | 'integracao_declaratoria' 
  | 'dossie_pericial';

export const InssObrasPanel: React.FC<InssObrasPanelProps> = ({
  onBackToDashboard,
  onNavigateTab,
  onAddAuditRecord
}) => {
  // Estado de dados
  const [cnoList, setCnoList] = useState<CnoMatricula[]>(loadCnoListFromStorage());
  const [selectedCnoId, setSelectedCnoId] = useState<string>(cnoList[0]?.id || 'cno_sp_edificio_horizonte');
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('visao_geral_cno');
  const [invoices, setInvoices] = useState<InvoiceRetentionItem[]>(loadInvoicesFromStorage());
  const [declaratoryRecords] = useState<DeclaratoryIntegrationRecord[]>(DEFAULT_DECLARATORY_RECORDS);
  
  // UI states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isNewCnoModalOpen, setIsNewCnoModalOpen] = useState<boolean>(false);
  const [isPerdcompModalOpen, setIsPerdcompModalOpen] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  // Form State para Calculadora Interativa de Retenção
  const [calcGross, setCalcGross] = useState<number>(IS_DEMO_MODE ? 300000 : 0);
  const [calcHasContractClause, setCalcHasContractClause] = useState<boolean>(true);
  const [calcMaterialsDeclared, setCalcMaterialsDeclared] = useState<number>(IS_DEMO_MODE ? 180000 : 0);
  const [calcMaterialsProven, setCalcMaterialsProven] = useState<number>(IS_DEMO_MODE ? 180000 : 0);
  const [calcEquipmentDeclared, setCalcEquipmentDeclared] = useState<number>(0);
  const [calcHasHeavyEquipment, setCalcHasHeavyEquipment] = useState<boolean>(false);
  const [calcIsCprb, setCalcIsCprb] = useState<boolean>(true);

  // Form State para Nova Obra CNO
  const [newCnoForm, setNewCnoForm] = useState<Partial<CnoMatricula>>({
    cnoNumber: '',
    nickname: '',
    corporateReason: 'Metrópole Engenharia e Construções S/A',
    cnpj: '14.823.901/0001-44',
    builtAreaM2: 5000,
    workType: 'RESIDENCIAL_MULTIFAMILIAR',
    constructionStandard: 'NORMAL',
    uf: 'SP',
    city: 'São Paulo',
    address: '',
    startDate: new Date().toISOString().slice(0, 10),
    isDesoneradoCprb: true,
    declaredPayrollTotal: 1200000,
    technicalResponsible: {
      name: '',
      councilType: 'CREA',
      registryNumber: '',
      uf: 'SP',
      cpf: ''
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Obra ativa selecionada
  const activeCno = useMemo(() => {
    return cnoList.find(c => c.id === selectedCnoId) || cnoList[0];
  }, [cnoList, selectedCnoId]);

  // Notas vinculadas à obra ativa
  const activeInvoices = useMemo(() => {
    return invoices.filter(i => i.cnoId === activeCno.id);
  }, [invoices, activeCno]);

  // Simulação de aferição indireta da obra ativa
  const simulation = useMemo<IndirectAfferenceSimulation>(() => {
    return calculateIndirectAfference(activeCno);
  }, [activeCno]);

  // Dossiê pericial compilado
  const dossier = useMemo<InssObrasDossierPericial>(() => {
    return generateInssObrasDossier({
      cno: activeCno,
      invoices: activeInvoices,
      simulation
    });
  }, [activeCno, activeInvoices, simulation]);

  // Resultado da calculadora interativa
  const liveRetentionResult = useMemo(() => {
    return calculateInvoiceRetention({
      grossValue: calcGross,
      hasContractMaterialsClause: calcHasContractClause,
      materialsDeclared: calcMaterialsDeclared,
      materialsProven: calcMaterialsProven,
      equipmentDeclared: calcEquipmentDeclared,
      hasHeavyEquipmentProof: calcHasHeavyEquipment,
      isDesoneradaCprb: calcIsCprb,
      competenceMonth: '2024-04'
    });
  }, [
    calcGross, 
    calcHasContractClause, 
    calcMaterialsDeclared, 
    calcMaterialsProven, 
    calcEquipmentDeclared, 
    calcHasHeavyEquipment, 
    calcIsCprb
  ]);

  // Handlers
  const handleSaveNewCno = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCnoForm.cnoNumber || !newCnoForm.nickname) {
      showToast('Preencha ao menos o número da CNO e o nome da obra.');
      return;
    }

    const standard = (newCnoForm.constructionStandard || 'NORMAL') as ConstructionStandard;
    const standardKey = standard.toLowerCase() as 'baixo' | 'normal' | 'alto';
    const uf = newCnoForm.uf || 'SP';
    const cubDefault = (CUB_REGIONAL_TABLE[uf] || CUB_REGIONAL_TABLE.DEFAULT)[standardKey];

    const newObj: CnoMatricula = {
      id: `cno_${Date.now()}`,
      cnoNumber: newCnoForm.cnoNumber,
      ceiLegacyNumber: newCnoForm.ceiLegacyNumber,
      nickname: newCnoForm.nickname,
      corporateReason: newCnoForm.corporateReason || 'Empresa Construtora',
      cnpj: newCnoForm.cnpj || '14.823.901/0001-44',
      technicalResponsible: {
        name: newCnoForm.technicalResponsible?.name || 'Engenheiro Responsável',
        councilType: newCnoForm.technicalResponsible?.councilType || 'CREA',
        registryNumber: newCnoForm.technicalResponsible?.registryNumber || '12345/SP',
        uf: newCnoForm.technicalResponsible?.uf || uf,
        cpf: newCnoForm.technicalResponsible?.cpf || '000.000.000-00'
      },
      builtAreaM2: Number(newCnoForm.builtAreaM2) || 1000,
      workType: (newCnoForm.workType || 'RESIDENCIAL_MULTIFAMILIAR') as ConstructionWorkType,
      constructionStandard: standard,
      cubSindusconM2: cubDefault,
      startDate: newCnoForm.startDate || new Date().toISOString().slice(0, 10),
      endDateOrHabiteSe: newCnoForm.endDateOrHabiteSe,
      status: 'EM_ANDAMENTO',
      uf,
      city: newCnoForm.city || 'São Paulo',
      address: newCnoForm.address || 'Endereço da Obra',
      isDesoneradoCprb: newCnoForm.isDesoneradoCprb ?? true,
      declaredPayrollTotal: Number(newCnoForm.declaredPayrollTotal) || 0,
      notes: newCnoForm.notes || 'Cadastrada via Módulo INSS-Obras Velatrix.'
    };

    const updated = [newObj, ...cnoList];
    setCnoList(updated);
    saveCnoListToStorage(updated);
    setSelectedCnoId(newObj.id);
    setIsNewCnoModalOpen(false);
    showToast(`Matrícula CNO ${newObj.cnoNumber} vinculada com sucesso!`);
  };

  const handleAddLiveInvoiceToAudited = () => {
    const newItem: InvoiceRetentionItem = {
      id: `inv_custom_${Date.now()}`,
      cnoId: activeCno.id,
      cnoNumber: activeCno.cnoNumber,
      invoiceNumber: `NFS-e SIM-${secureInt(100000, 999999)}`,
      issueDate: new Date().toISOString().slice(0, 10),
      competenceMonth: new Date().toISOString().slice(0, 7),
      serviceDescription: 'Serviços especializados de engenharia e construção civil com materiais e equipamentos',
      providerName: 'Prestador de Serviços e Subempreitada Construtora',
      providerCnpj: '00.000.000/0001-99',
      grossValue: calcGross,
      hasContractClauseForMaterials: calcHasContractClause,
      materialsDeclaredInInvoice: calcMaterialsDeclared,
      materialsProvenFiscalReceipts: calcMaterialsProven,
      equipmentDeclaredInInvoice: calcEquipmentDeclared,
      hasHeavyEquipmentProof: calcHasHeavyEquipment,
      deductibleMaterialsAllowed: liveRetentionResult.deductibleMaterials,
      deductibleEquipmentAllowed: liveRetentionResult.deductibleEquipment,
      effectiveLaborBaseCalculated: liveRetentionResult.effectiveLaborBase,
      retentionRateApplied: 11.0,
      retentionRateDue: liveRetentionResult.retentionRateDue,
      retentionWithheldPaid: calcGross * 0.11,
      retentionWithheldDue: liveRetentionResult.retentionDue,
      excessWithheldIndebito: liveRetentionResult.excessIndebito,
      selicRateAccumulatedPct: 4.5,
      selicInterestBrl: liveRetentionResult.excessIndebito * 0.045,
      totalUpdatedIndebito: liveRetentionResult.excessIndebito * 1.045,
      complianceStatus: liveRetentionResult.status,
      legalNotes: liveRetentionResult.notes
    };

    const updated = [newItem, ...invoices];
    setInvoices(updated);
    saveInvoicesToStorage(updated);
    showToast(`Nota Fiscal adicionada à memória analítica da obra ${activeCno.nickname}.`);
  };

  const handleExportPdf = () => {
    generateInssObrasPericialPdf({
      dossier,
      cno: activeCno,
      invoices: activeInvoices,
      simulation
    });
    showToast('Laudo Pericial Oficial de INSS-Obras gerado em PDF com sucesso.');
  };

  const handleExportCsv = () => {
    const headers = [
      'CNO',
      'Obra',
      'Nota Fiscal',
      'Competencia',
      'Prestador',
      'Valor Bruto (R$)',
      'Materiais Dedutiveis (R$)',
      'Equipamentos Dedutiveis (R$)',
      'Base Mao de Obra (R$)',
      'Aliquota Aplicada (%)',
      'Aliquota Devida (%)',
      'Retencao Paga (R$)',
      'Retencao Devida (R$)',
      'Indebito Principal (R$)',
      'SELIC Acumulada (%)',
      'Juros SELIC (R$)',
      'Total Atualizado (R$)',
      'Status',
      'Fundamentacao Legal'
    ];

    const rows = activeInvoices.map(i => [
      `"${i.cnoNumber}"`,
      `"${activeCno.nickname}"`,
      `"${i.invoiceNumber}"`,
      `"${i.competenceMonth}"`,
      `"${i.providerName}"`,
      i.grossValue.toFixed(2),
      i.deductibleMaterialsAllowed.toFixed(2),
      i.deductibleEquipmentAllowed.toFixed(2),
      i.effectiveLaborBaseCalculated.toFixed(2),
      i.retentionRateApplied.toFixed(2),
      i.retentionRateDue.toFixed(2),
      i.retentionWithheldPaid.toFixed(2),
      i.retentionWithheldDue.toFixed(2),
      i.excessWithheldIndebito.toFixed(2),
      i.selicRateAccumulatedPct.toFixed(2),
      i.selicInterestBrl.toFixed(2),
      i.totalUpdatedIndebito.toFixed(2),
      `"${i.complianceStatus}"`,
      `"${i.legalNotes.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `INSS_OBRAS_ANALITICO_${activeCno.cnoNumber.replace(/\D/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha Analítica de INSS-Obras exportada em CSV/Excel.');
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(dossier.auditHashSha256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
    showToast('Hash SHA-256 probatório copiado para a área de transferência.');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-2 sm:px-4 py-3">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500/95 text-slate-950 font-bold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-amber-300 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* AVISO LEGAL MANDATÓRIO PERMANENTE */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-lg px-3.5 py-2 flex items-center justify-between text-[11px] text-amber-300">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Aviso Legal Probatório:</strong> Esta ferramenta é uma estimativa sujeita a comprovação documental e homologação, não constituindo garantia de recuperação nem aconselhamento jurídico/tributário.
          </span>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 shrink-0 font-bold">
          Lei 8.212/91 & IN RFB 2.110/22
        </span>
      </div>

      {/* CABEÇALHO DO MÓDULO E SELETOR DE CNO */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  INSS-Obras • Construção Civil & Obras Pesadas
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CNO / SERO / DCTFWeb
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Retenção 11% vs. 3,5% (CPRB), Dedução de Materiais (Art. 121 IN 2.110/22), Aferição Indireta SERO e Laudo Pericial com Hash SHA-256.
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO DO TOPO */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewCnoModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nova Obra (CNO)</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Laudo Pericial (PDF)</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel/CSV</span>
            </button>
          </div>
        </div>

        {/* BARRA DA OBRA ATIVA COM SWITCHER */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Obra Ativa:
            </span>
            <select
              value={selectedCnoId}
              onChange={(e) => setSelectedCnoId(e.target.value)}
              className="bg-slate-900 text-amber-300 font-bold text-xs border border-amber-500/40 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
            >
              {cnoList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cnoNumber} — {c.nickname} ({c.city}/{c.uf})
                </option>
              ))}
            </select>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              activeCno.status === 'REGULARIZADA_CND'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : activeCno.status === 'CONCLUIDA_PENDENTE_SERO'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              {activeCno.status.replace(/_/g, ' ')}
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {activeCno.builtAreaM2.toLocaleString('pt-BR')} m²
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              CUB {activeCno.uf}: R$ {activeCno.cubSindusconM2.toFixed(2)}/m²
            </span>

            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              activeCno.isDesoneradoCprb
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            }`}>
              {activeCno.isDesoneradoCprb ? 'CPRB 3,5% (Desonerada)' : 'INSS 11% (Padrão)'}
            </span>
          </div>

          <div className="text-right text-xs font-mono text-slate-400">
            <span>RT: <strong className="text-slate-200">{activeCno.technicalResponsible.name}</strong> ({activeCno.technicalResponsible.councilType} {activeCno.technicalResponsible.registryNumber})</span>
          </div>
        </div>
      </div>

      {/* CARDS DE IMPACTO FINANCEIRO DA OBRA SELECIONADA */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 uppercase font-mono block">Custo Estimado da Obra</span>
          <span className="text-lg font-bold text-slate-100 font-mono mt-0.5 block">
            R$ {(simulation.totalEstimatedCost / 1000000).toFixed(2)}M
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeCno.builtAreaM2.toLocaleString('pt-BR')} m² × R$ {simulation.cubValue.toFixed(0)}/m²
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] text-amber-400 uppercase font-mono block">RMT Mínima SERO (RFB)</span>
          <span className="text-lg font-bold text-amber-300 font-mono mt-0.5 block">
            R$ {(simulation.finalAdjustedRmtBase / 1000).toFixed(0)}k
          </span>
          <span className="text-[10px] text-amber-500/80 font-mono">
            Com abatimento de concreto/subemp.
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[11px] text-emerald-400 uppercase font-mono block">Indébito Retenção Apurado</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block">
            R$ {(dossier.totalExcessWithheldPrincipal / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-emerald-500/80 font-mono">
            {activeInvoices.length} notas auditadas
          </span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-xl p-3 bg-gradient-to-br from-emerald-950/20 to-slate-900/80">
          <span className="text-[11px] text-emerald-300 uppercase font-mono block">Crédito Total c/ SELIC</span>
          <span className="text-lg font-bold text-emerald-300 font-mono mt-0.5 block">
            R$ {dossier.totalIndebitoUpdatedRecovery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            Passível de PER/DCOMP Web
          </span>
        </div>
      </div>

      {/* SUB-ABAS DE NAVEGAÇÃO INTERNA */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('visao_geral_cno')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'visao_geral_cno'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Visão Geral & Cadastro CNO</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calculadora_retencao')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'calculadora_retencao'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md shadow-amber-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Retenção NFS-e (11% / 3,5%)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('restituicao_compensacao')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'restituicao_compensacao'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Restituição & Compensação (SELIC)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('afericao_indireta_sero')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'afericao_indireta_sero'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Aferição Indireta (SERO/CNO)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('integracao_declaratoria')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'integracao_declaratoria'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md shadow-purple-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Integração eSocial x DCTFWeb</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dossie_pericial')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dossie_pericial'
              ? 'bg-emerald-500/25 text-[var(--vx-neon)] border border-cyan-500/50 shadow-md shadow-cyan-950/30'
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
          <span>Dossiê Pericial & SHA-256</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 1: VISÃO GERAL & CADASTRO CNO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'visao_geral_cno' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                Matrículas CNO/CEI do Tenant ({cnoList.length} Obras Registradas)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Conforme Instrução Normativa RFB nº 2.021/2021
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cnoList.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCnoId(c.id)}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    selectedCnoId === c.id
                      ? 'bg-slate-800/90 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {c.cnoNumber}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {c.uf}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 mt-1 line-clamp-1">
                    {c.nickname}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                    {c.address} - {c.city}/{c.uf}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Área: {c.builtAreaM2.toLocaleString('pt-BR')} m²</span>
                    <span className="text-amber-400 font-bold">{c.isDesoneradoCprb ? '3,5% CPRB' : '11% INSS'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FICHA DETALHADA DA OBRA SELECIONADA */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Ficha Técnica Cadastral e de Engenharia: {activeCno.nickname}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">DADOS CADASTRAIS CNO</span>
                <p className="text-slate-200"><strong>CNO:</strong> {activeCno.cnoNumber}</p>
                {activeCno.ceiLegacyNumber && (
                  <p className="text-slate-400"><strong>CEI Legada:</strong> {activeCno.ceiLegacyNumber}</p>
                )}
                <p className="text-slate-300"><strong>CNPJ Matriz:</strong> {activeCno.cnpj}</p>
                <p className="text-slate-300"><strong>Status:</strong> {activeCno.status}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">ENGENHARIA & PADRÃO</span>
                <p className="text-slate-200"><strong>Área Total:</strong> {activeCno.builtAreaM2.toLocaleString('pt-BR')} m²</p>
                <p className="text-slate-300"><strong>Tipo:</strong> {activeCno.workType.replace(/_/g, ' ')}</p>
                <p className="text-slate-300"><strong>Padrão:</strong> {activeCno.constructionStandard}</p>
                <p className="text-amber-300"><strong>CUB {activeCno.uf}:</strong> R$ {activeCno.cubSindusconM2.toFixed(2)}/m²</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">RESPONSÁVEL TÉCNICO</span>
                <p className="text-slate-200"><strong>Nome:</strong> {activeCno.technicalResponsible.name}</p>
                <p className="text-slate-300"><strong>Registro:</strong> {activeCno.technicalResponsible.councilType} {activeCno.technicalResponsible.registryNumber}</p>
                <p className="text-slate-400"><strong>CPF RT:</strong> {activeCno.technicalResponsible.cpf}</p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">CRONOGRAMA & ENQUADRAMENTO</span>
                <p className="text-slate-200"><strong>Início:</strong> {activeCno.startDate}</p>
                <p className="text-slate-300"><strong>Habite-se / Fim:</strong> {activeCno.endDateOrHabiteSe || 'Em execução'}</p>
                <p className="text-emerald-400"><strong>Regime:</strong> {activeCno.isDesoneradoCprb ? 'Desoneração 3,5% CPRB' : 'Retenção 11% INSS'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 2: CALCULADORA DE RETENÇÃO NFS-e (11% / 3,5%) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'calculadora_retencao' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  Simulador e Validador de Retenção de Serviços de Construção Civil
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Art. 31 da Lei nº 8.212/91, Art. 121/122 da IN RFB 2.110/2022 e Lei 12.546/2011 (CPRB).
                </p>
              </div>
              <button
                onClick={handleAddLiveInvoiceToAudited}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Salvar Nota no Dossiê da Obra</span>
              </button>
            </div>

            {/* FORMULÁRIO DE SIMULAÇÃO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-amber-300 uppercase font-mono block">
                  1. Valores da Nota Fiscal (NFS-e)
                </span>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Valor Bruto da Nota Fiscal (R$):
                  </label>
                  <input
                    type="number"
                    value={calcGross}
                    onChange={(e) => setCalcGross(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="calcContractClause"
                    checked={calcHasContractClause}
                    onChange={(e) => setCalcHasContractClause(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="calcContractClause" className="text-xs text-slate-300 cursor-pointer">
                    Previsão Contratual de Materiais (Art. 121, § 1º)
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Materiais Destacados na Nota (R$):
                  </label>
                  <input
                    type="number"
                    value={calcMaterialsDeclared}
                    onChange={(e) => setCalcMaterialsDeclared(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Materiais c/ Notas Fiscais de Compra Comprovadas (R$):
                  </label>
                  <input
                    type="number"
                    value={calcMaterialsProven}
                    onChange={(e) => setCalcMaterialsProven(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs font-bold text-amber-300 uppercase font-mono block">
                  2. Equipamentos & Enquadramento
                </span>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="calcHeavyEquip"
                    checked={calcHasHeavyEquipment}
                    onChange={(e) => setCalcHasHeavyEquipment(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
                  />
                  <label htmlFor="calcHeavyEquip" className="text-xs text-slate-300 cursor-pointer">
                    Emprego de Equipamentos Pesados (Art. 122)
                  </label>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">
                    Equipamentos/Maquinário Destacado (R$):
                  </label>
                  <input
                    type="number"
                    value={calcEquipmentDeclared}
                    onChange={(e) => setCalcEquipmentDeclared(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 mt-3">
                  <label className="text-[11px] text-slate-400 block mb-1 font-bold">
                    Opção Tributária da Empresa Prestadora:
                  </label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="cprbOption"
                        checked={calcIsCprb}
                        onChange={() => setCalcIsCprb(true)}
                        className="text-amber-500"
                      />
                      <span>CPRB 3,5% (Desonerada Lei 12.546)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-200">
                      <input
                        type="radio"
                        name="cprbOption"
                        checked={!calcIsCprb}
                        onChange={() => setCalcIsCprb(false)}
                        className="text-amber-500"
                      />
                      <span>INSS 11% (Padrão Lei 8.212)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* CARD DE RESULTADOS DO CÁLCULO */}
              <div className="bg-slate-950 p-3.5 rounded-lg border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase font-mono block mb-2">
                    3. Diagnóstico e Bases Legais Apuradas
                  </span>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Dedução Legal de Materiais:</span>
                      <span className="text-emerald-400 font-bold">
                        - R$ {liveRetentionResult.deductibleMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Dedução de Equipamentos:</span>
                      <span className="text-emerald-400 font-bold">
                        - R$ {liveRetentionResult.deductibleEquipment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Base Efetiva de Mão de Obra:</span>
                      <span className="text-cyan-300 font-bold">
                        R$ {liveRetentionResult.effectiveLaborBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Alíquota Aplicável:</span>
                      <span className="text-amber-300 font-bold">{liveRetentionResult.retentionRateDue}%</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Retenção Efetivamente Devida:</span>
                      <span className="text-slate-100 font-bold">
                        R$ {liveRetentionResult.retentionDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-rose-400">Retenção Se Retido 11% Bruto:</span>
                      <span className="text-rose-400 font-bold">
                        R$ {(calcGross * 0.11).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded bg-emerald-950/30 border border-emerald-500/40 text-center">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono block">Indébito / Economia na Fonte</span>
                  <span className="text-base font-bold text-emerald-300 font-mono">
                    R$ {liveRetentionResult.excessIndebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 3: RESTITUIÇÃO & COMPENSAÇÃO (SELIC ACUMULADA) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'restituicao_compensacao' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Memória Analítica de Retenções a Maior e Atualização SELIC
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apuração dos últimos 60 meses com base na Súmula Vinculante 8 do STF e IN RFB 2.110/2022.
                </p>
              </div>

              <button
                onClick={() => setIsPerdcompModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Gerar Minuta PER/DCOMP Web</span>
              </button>
            </div>

            {/* TABELA ANALÍTICA */}
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Nota Fiscal</th>
                    <th className="py-2.5 px-2">Competência</th>
                    <th className="py-2.5 px-3">Prestador</th>
                    <th className="py-2.5 px-2 text-right">Valor Bruto</th>
                    <th className="py-2.5 px-2 text-right">Mat./Equip. Deduzidos</th>
                    <th className="py-2.5 px-2 text-right">Base Líquida MO</th>
                    <th className="py-2.5 px-2 text-right">Retido</th>
                    <th className="py-2.5 px-2 text-right">Devido</th>
                    <th className="py-2.5 px-2 text-right text-emerald-400 font-bold">Indébito Princ.</th>
                    <th className="py-2.5 px-2 text-right">SELIC %</th>
                    <th className="py-2.5 px-3 text-right text-emerald-300 font-bold">Total Atualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {activeInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-2 text-slate-400">{inv.competenceMonth}</td>
                      <td className="py-2.5 px-3 text-slate-300 truncate max-w-[160px]" title={inv.providerName}>
                        {inv.providerName}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-300">
                        R$ {inv.grossValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">
                        R$ {(inv.deductibleMaterialsAllowed + inv.deductibleEquipmentAllowed).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-cyan-300">
                        R$ {inv.effectiveLaborBaseCalculated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-rose-300">
                        R$ {inv.retentionWithheldPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-300">
                        R$ {inv.retentionWithheldDue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-400 font-bold">
                        R$ {inv.excessWithheldIndebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-2 text-right text-slate-400">
                        {inv.selicRateAccumulatedPct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-300 font-bold">
                        R$ {inv.totalUpdatedIndebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950 font-bold border-t border-slate-700 text-xs text-slate-100">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-slate-300 uppercase">Totais Acumulados</td>
                    <td className="py-2.5 px-2 text-right text-slate-200">
                      R$ {dossier.totalGrossAnalyzed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-300">
                      R$ {dossier.totalMaterialsDeductedLegal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={3}></td>
                    <td className="py-2.5 px-2 text-right text-emerald-400">
                      R$ {dossier.totalExcessWithheldPrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-400">SELIC</td>
                    <td className="py-2.5 px-3 text-right text-emerald-300 text-sm">
                      R$ {dossier.totalIndebitoUpdatedRecovery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 4: AFERIÇÃO INDIRETA (SERO / IN RFB 2.021/2021) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'afericao_indireta_sero' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Calculadora de Aferição Indireta SERO & Simulação de Risco de ARO
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confronto entre a tabela da IN RFB 2.021/2021 e a base de folha de pagamento declarada pela construtora.
                </p>
              </div>
              <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                simulation.riskStatus === 'REGULARIZADO_DISPENSADO'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {simulation.riskStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* BLOCO DE CÁLCULO DA AFERIÇÃO INDIRETA */}
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
                <span className="text-xs font-bold text-cyan-300 uppercase block mb-1">
                  1. Memória de Aferição Indireta (SERO/RFB)
                </span>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Área Construída Cadastrada:</span>
                  <span className="text-slate-200 font-bold">{activeCno.builtAreaM2.toLocaleString('pt-BR')} m²</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">CUB Sinduscon ({activeCno.uf} - {activeCno.constructionStandard}):</span>
                  <span className="text-slate-200 font-bold">R$ {simulation.cubValue.toFixed(2)} / m²</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Custo Total Estimado da Obra:</span>
                  <span className="text-slate-100 font-bold">
                    R$ {simulation.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Percentual de RMT (Tabela IN 2.021):</span>
                  <span className="text-amber-300 font-bold">{(simulation.standardLaborPct * 100).toFixed(0)}%</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Base Bruta de RMT Exigida:</span>
                  <span className="text-slate-200 font-bold">
                    R$ {simulation.baseEstimatedRmt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-800 text-emerald-400">
                  <span>(-) Dedução Concreto Usinado (Art. 34 - 5%):</span>
                  <span className="font-bold">- R$ {simulation.readyMixConcreteDeduction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {simulation.precastStructuresDeduction > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-800 text-emerald-400">
                    <span>(-) Dedução Pré-Moldados / Pré-Fabricados:</span>
                    <span className="font-bold">- R$ {simulation.precastStructuresDeduction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 border-b border-slate-800 text-emerald-400">
                  <span>(-) Subempreitadas com Retenção na CNO:</span>
                  <span className="font-bold">- R$ {simulation.subcontractsWithRetentionDeduction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between py-1.5 pt-2 border-t border-slate-700 text-sm font-bold text-cyan-300">
                  <span>RMT Líquida Final Aferida pela RFB:</span>
                  <span>R$ {simulation.finalAdjustedRmtBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* BLOCO DE CONFRONTO E ANÁLISE DE RISCO */}
              <div className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 flex flex-col justify-between font-mono text-xs">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-amber-300 uppercase block mb-1">
                    2. Confronto com a Folha de Pagamento Declarada
                  </span>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Remuneração Declarada no eSocial/GFIP:</span>
                    <span className="text-slate-100 font-bold">
                      R$ {simulation.totalDeclaredLaborBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">RMT Mínima Exigida no SERO:</span>
                    <span className="text-cyan-300 font-bold">
                      R$ {simulation.finalAdjustedRmtBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Saldo Declaratório (Sobra ou Déficit):</span>
                    <span className={`font-bold ${simulation.fiscalDeficitOrSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulation.fiscalDeficitOrSurplus >= 0 ? '+' : ''}
                      R$ {simulation.fiscalDeficitOrSurplus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Estimativa de ARO Complementar:</span>
                    <span className={`font-bold ${simulation.estimatedAroComplementary === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      R$ {simulation.estimatedAroComplementary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-bold block mb-1">PARECER DE AUDITORIA SERO:</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {simulation.legalGuidance}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 5: INTEGRAÇÃO DECLARATÓRIA (eSocial x DCTFWeb x NFS-e) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'integracao_declaratoria' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  Cruzamento Declaratório de Obrigações Acessórias Previdenciárias
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confronto de eventos S-1000, S-1005, S-1200, S-1280 (eSocial) com DCTFWeb e NFS-e tomadas.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {declaratoryRecords.map((rec) => (
                <div key={rec.id} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 font-mono">
                        Competência {rec.competenceMonth}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        • CNO: {rec.cnoNumber} ({rec.workNickname})
                      </span>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      rec.status === 'CONCILIADO'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : rec.status === 'RETENCAO_NAO_APROVEITADA'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {rec.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono py-1">
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 block text-[10px]">S-1200 Remuneração</span>
                      <span className="text-slate-200 font-bold">R$ {rec.s1200RemunerationTotal.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 block text-[10px]">DCTFWeb Retenção</span>
                      <span className="text-slate-200 font-bold">R$ {rec.dctfWebRetentionDeclaredBrl.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 block text-[10px]">Retenção Efetiva Notas</span>
                      <span className="text-rose-400 font-bold">R$ {rec.nfsRetentionWithheldBrl.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded">
                      <span className="text-slate-500 block text-[10px]">Divergência / Crédito</span>
                      <span className="text-emerald-400 font-bold">R$ {rec.retentionDifferenceBrl.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="text-xs bg-slate-900/50 p-2.5 rounded border border-slate-800 text-slate-300">
                    <p><strong>Diagnóstico:</strong> {rec.diagnosticSummary}</p>
                    <p className="text-amber-400/90 mt-1"><strong>Ação Recomendada:</strong> {rec.actionRequired}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ABA 6: DOSSIÊ PERICIAL & LAUDO COM HASH SHA-256 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'dossie_pericial' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl">
            {/* CABEÇALHO DO LAUDO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold">
                  Documento Pericial Probatório • FIPS 180-4
                </span>
                <h2 className="text-base font-bold text-slate-100 mt-1">
                  Laudo Pericial Técnico-Contábil de INSS-Obras (CNO {activeCno.cnoNumber})
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Protocolo: {dossier.protocolId} • Emitido em {dossier.emissionDate}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Laudo Oficial (PDF)</span>
                </button>
              </div>
            </div>

            {/* ASSINATURA CRIPTOGRÁFICA SHA-256 */}
            <div className="my-4 p-3.5 rounded-lg bg-slate-950 border border-cyan-500/40 font-mono text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5 font-bold">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Hash Criptográfico SHA-256 de Autenticidade (Imutável):
                </span>
                <button
                  onClick={handleCopyHash}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHash ? 'Copiado!' : 'Copiar Hash'}</span>
                </button>
              </div>
              <div className="p-2 rounded bg-slate-900 text-amber-300 break-all font-mono text-[11px] select-all border border-slate-800">
                {dossier.auditHashSha256}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Calculado sobre o payload canônico de auditoria de notas fiscais, enquadramento CNO e aferição SERO.
              </span>
            </div>

            {/* FUNDAMENTAÇÃO LEGAL LINHA A LINHA */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                Fundamentação Jurídica e Normativa Expressa
              </h3>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                {dossier.legalBasisSummary.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PARECER CONCLUSIVO */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono mb-2">
                Parecer Técnico Conclusivo do Assistente
              </h3>
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                {dossier.technicalConclusion}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{dossier.expertName} • {dossier.expertRegistry}</span>
                <span>Assinatura Digital ICP-Brasil / Padrão Velatrix AOS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CADASTRO DE NOVA MATRÍCULA CNO */}
      {isNewCnoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                Cadastrar Nova Obra (Matrícula CNO)
              </h3>
              <button
                onClick={() => setIsNewCnoModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewCno} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Matrícula CNO (Ex: 90.012.34567/89) *</label>
                  <input
                    type="text"
                    required
                    placeholder="90.000.00000/00"
                    value={newCnoForm.cnoNumber}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, cnoNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Apelido / Nome da Obra *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Residencial Vista Verde"
                    value={newCnoForm.nickname}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, nickname: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Tipo de Obra</label>
                  <select
                    value={newCnoForm.workType}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, workType: e.target.value as ConstructionWorkType })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="RESIDENCIAL_MULTIFAMILIAR">Residencial Multifamiliar</option>
                    <option value="RESIDENCIAL_UNIFAMILIAR">Residencial Unifamiliar</option>
                    <option value="COMERCIAL">Edifício Comercial / Corporativo</option>
                    <option value="GALPAO_INDUSTRIAL">Galpão Industrial / Logístico</option>
                    <option value="INFRAESTRUTURA_OBRAS_PESADAS">Infraestrutura / Obras Pesadas</option>
                    <option value="REFORMA_DEMOLICAO">Reforma / Demolição</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Padrão Construtivo</label>
                  <select
                    value={newCnoForm.constructionStandard}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, constructionStandard: e.target.value as ConstructionStandard })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="NORMAL">Normal (Padrão de Mercado)</option>
                    <option value="BAIXO">Baixo (Popular / Galpão Simples)</option>
                    <option value="ALTO">Alto (Acabamento Superior)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Área Construída (m²)</label>
                  <input
                    type="number"
                    value={newCnoForm.builtAreaM2}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, builtAreaM2: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">UF da Obra (para CUB Sinduscon)</label>
                  <select
                    value={newCnoForm.uf}
                    onChange={(e) => setNewCnoForm({ ...newCnoForm, uf: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="SP">SP - São Paulo</option>
                    <option value="RJ">RJ - Rio de Janeiro</option>
                    <option value="MG">MG - Minas Gerais</option>
                    <option value="RS">RS - Rio Grande do Sul</option>
                    <option value="PR">PR - Paraná</option>
                    <option value="SC">SC - Santa Catarina</option>
                    <option value="BA">BA - Bahia</option>
                    <option value="GO">GO - Goiás</option>
                    <option value="DF">DF - Distrito Federal</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Responsável Técnico (Nome)</label>
                  <input
                    type="text"
                    placeholder="Ex: Eng. João da Silva"
                    value={newCnoForm.technicalResponsible?.name}
                    onChange={(e) => setNewCnoForm({
                      ...newCnoForm,
                      technicalResponsible: {
                        ...newCnoForm.technicalResponsible!,
                        name: e.target.value
                      }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Registro Profissional (CREA / CAU)</label>
                  <input
                    type="text"
                    placeholder="Ex: CREA 506239/SP"
                    value={newCnoForm.technicalResponsible?.registryNumber}
                    onChange={(e) => setNewCnoForm({
                      ...newCnoForm,
                      technicalResponsible: {
                        ...newCnoForm.technicalResponsible!,
                        registryNumber: e.target.value
                      }
                    })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="newCprbCheck"
                  checked={newCnoForm.isDesoneradoCprb}
                  onChange={(e) => setNewCnoForm({ ...newCnoForm, isDesoneradoCprb: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                />
                <label htmlFor="newCprbCheck" className="text-slate-200 cursor-pointer">
                  Construtora é optante da Desoneração da Folha CPRB (Alíquota reduzida de 3,5% - Lei 12.546/11)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCnoModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Salvar Matrícula CNO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MINUTA PER/DCOMP WEB */}
      {isPerdcompModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Minuta de Instrução PER/DCOMP Web • Retenção Previdenciária de Obras
              </h3>
              <button
                onClick={() => setIsPerdcompModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 text-slate-300">
              <p><strong>DECLARANTE:</strong> {activeCno.corporateReason} (CNPJ: {activeCno.cnpj})</p>
              <p><strong>CNO DA OBRA:</strong> {activeCno.cnoNumber} — {activeCno.nickname}</p>
              <p><strong>TIPO DE CRÉDITO:</strong> Retenção Lei nº 9.711/98 e Art. 31 da Lei 8.212/91 (Código de Receita 2631)</p>
              <p><strong>VALOR TOTAL DO INDÉBITO PRINCIPAL:</strong> R$ {dossier.totalExcessWithheldPrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>CORREÇÃO PELA TAXA SELIC:</strong> R$ {dossier.totalSelicCorrection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-emerald-400 text-sm">
                <strong>VALOR TOTAL DO PEDIDO DE RESTITUIÇÃO / COMPENSAÇÃO:</strong> R$ {dossier.totalIndebitoUpdatedRecovery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p><strong>FUNDAMENTO JURÍDICO NA DCTFWeb:</strong></p>
                <p>1. Art. 121 da IN RFB 2.110/2022: Dedução obrigatória do custo de materiais com previsão contratual e notas fiscais de compra anexadas.</p>
                <p>2. Art. 7º e 8º da Lei 12.546/2011: Retenção limitada à alíquota de 3,5% em decorrência da opção da construtora pela CPRB.</p>
                <p>3. Súmula Vinculante 8 do STF: Decadência e prescrição restritas ao prazo de 5 anos.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
                  showToast('Dados canônicos da minuta copiados!');
                }}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                Copiar JSON Canônico
              </button>
              <button
                onClick={() => setIsPerdcompModalOpen(false)}
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Fechar Minuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
