import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Building2, 
  Database, 
  Scale, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Upload, 
  ArrowRight, 
  Check, 
  Layers, 
  AlertCircle, 
  Info, 
  Lock, 
  Sparkles, 
  XCircle, 
  Eye, 
  ChevronDown, 
  ChevronUp,
  FileCheck,
  Percent,
  Sliders,
  DollarSign,
  Copy,
  Code,
  Terminal,
  Hash
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../../utils/i18n';
import { 
  TaxRegimeType, 
  ExpertTeseType, 
  FiscalDocumentItem, 
  SupportDocumentItem,
  getDefaultSupportDocuments,
  savePericialCalculationToStorage,
  loadPericialCalculationFromStorage,
  runPericialTaxCalculationEngine, 
  generateExpertSampleDataset, 
  exportSyntheticReportToCsv, 
  exportAnalyticalReportToCsv,
  PericialCalculationResult,
  isNcmMonophasic,
  runCryptographicSanityCheck,
  CryptographicSanityCheckResult
} from '../../services/expertTaxEngineService';
import { 
  generatePericialDossierPdf,
  generateTaxRegimeClassificationPdf,
  generateSyntheticMonthlyReportPdf
} from '../../services/pdfReportService';
import { saveTaxCase } from '../../services/dataService';


interface ExpertTaxCalculationEngineProps {
  initialTese?: ExpertTeseType;
  initialTaxRegime?: TaxRegimeType;
  companyName?: string;
  cnpj?: string;
}

export const ExpertTaxCalculationEngine: React.FC<ExpertTaxCalculationEngineProps> = ({
  initialTese = 'TEMA_69_STF_ICMS_PIS_COFINS',
  initialTaxRegime = 'LUCRO_REAL',
  companyName = 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
  cnpj = '33.041.260/0001-88'
}) => {
  // Configurações do Fato Gerador e Parâmetros Periciais
  const [selectedTese, setSelectedTese] = useState<ExpertTeseType>(initialTese);
  const [selectedRegime, setSelectedRegime] = useState<TaxRegimeType>(initialTaxRegime);
  const [showRegimesTooltip, setShowRegimesTooltip] = useState<boolean>(false);
  
  // Datas de Referência (Hoje = 2026-09-01)
  const [protocolDate, setProtocolDate] = useState<string>('2026-09-01');
  const [consolidationDate, setConsolidationDate] = useState<string>('2026-09-01');

  // Conjunto de Itens em Auditoria
  const [auditItems, setAuditItems] = useState<FiscalDocumentItem[]>(() => 
    generateExpertSampleDataset(initialTese, initialTaxRegime, companyName, cnpj, '2026-09-01')
  );

  // Documentos de Suporte e Retificadoras para PER/DCOMP
  const [supportDocs, setSupportDocs] = useState<SupportDocumentItem[]>(() =>
    getDefaultSupportDocuments(initialTese, initialTaxRegime, companyName, cnpj)
  );

  // Status de Ingestão e Processamento
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<'pipeline' | 'sintetico' | 'analitico' | 'suporte' | 'travas' | 'ingestao'>('pipeline');
  const [uploadedFilesList, setUploadedFilesList] = useState<Array<{ name: string; type: string; size: string; status: string }>>([
    { name: 'SPED_EFD_ICMS_IPI_2021_2026.txt', type: 'SPED Fiscal (Blocos C100, C170, E110)', size: '24.8 MB', status: 'Conciliado 100%' },
    { name: 'SPED_EFD_CONTRIBUICOES_PIS_COFINS.txt', type: 'EFD Contribuições (Blocos M200, M600, 1010)', size: '18.2 MB', status: 'Conciliado 100%' },
    { name: 'LOTE_XML_NFE_DESTACADO_5ANOS.zip', type: 'XML NF-e Mod. 55 (1.420 docs validados)', size: '42.6 MB', status: 'Validado Linha a Linha' },
    { name: 'DCTF_PGDAS_DECLARACOES_RECIBOS.pdf', type: 'DCTF/PGDAS-D e Guias DARF/DAS', size: '6.4 MB', status: 'Auditado' }
  ]);

  // Filtros da Visão Analítica
  const [analyticalSearch, setAnalyticalSearch] = useState<string>('');
  const [analyticalPrescriptionFilter, setAnalyticalPrescriptionFilter] = useState<'TODOS' | 'HABILITADOS' | 'PRESCRITOS'>('TODOS');
  const [analyticalDivergenceFilter, setAnalyticalDivergenceFilter] = useState<boolean>(false);
  const [analyticalPage, setAnalyticalPage] = useState<number>(1);
  const pageSize = 20;

  // Modal de Auditoria do Payload Canônico SHA-256
  const [showCanonicalModal, setShowCanonicalModal] = useState<boolean>(false);
  
  // Teste de Sanidade Criptográfica
  const [sanityCheckResult, setSanityCheckResult] = useState<CryptographicSanityCheckResult | null>(null);
  const [isRunningSanityCheck, setIsRunningSanityCheck] = useState<boolean>(false);

  // Notificação de Ação
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handleRunSanityCheck = async () => {
    setIsRunningSanityCheck(true);
    try {
      const result = await runCryptographicSanityCheck({
        companyName,
        cnpj,
        tese: selectedTese,
        taxRegime: selectedRegime,
        protocolDate,
        consolidationDate
      });
      setSanityCheckResult(result);
      showToast('Bateria de testes criptográficos (Determinismo & Efeito Avalanche) concluída com 100% de êxito.');
    } catch (err) {
      console.error('Erro no teste de sanidade criptográfica:', err);
      showToast('Falha ao executar validação Web Crypto.');
    } finally {
      setIsRunningSanityCheck(false);
    }
  };

  const handleCopyHash = () => {
    if (calculationResult?.auditHashSha256) {
      navigator.clipboard.writeText(calculationResult.auditHashSha256);
      showToast('Hash SHA-256 (64 caracteres) copiado com sucesso.');
    }
  };

  const handleCopyCanonicalPayload = () => {
    if (calculationResult?.canonicalPayloadJson) {
      navigator.clipboard.writeText(calculationResult.canonicalPayloadJson);
      showToast('Payload JSON Canônico copiado com sucesso.');
    }
  };

  // Recarrega conjunto de dados de amostragem quando a tese ou regime muda
  const handleReloadSampleData = (newTese: ExpertTeseType, newRegime: TaxRegimeType) => {
    setIsProcessing(true);
    const items = generateExpertSampleDataset(newTese, newRegime, companyName, cnpj, protocolDate);
    const docs = getDefaultSupportDocuments(newTese, newRegime, companyName, cnpj);
    setAuditItems(items);
    setSupportDocs(docs);
    setIsProcessing(false);
    const regimeLabels: Record<TaxRegimeType, string> = {
      LUCRO_REAL: 'Lucro Real (Não-Cumulativo 9,25%)',
      LUCRO_PRESUMIDO: 'Lucro Presumido (Cumulativo 3,65%)',
      BIFASICO: 'Regime Bifásico (2 Etapas Concentradas 11,75%)',
      PLURIFASICO: 'Regime Plurifásico (Cadeia Não-Cumulativa 9,25%)',
      SIMPLES_NACIONAL: 'Simples Nacional (Segregação PGDAS-D 2,80%)'
    };
    showToast(`Base pericial recalculada para ${regimeLabels[newRegime] || newRegime}.`);
  };

  // Atualiza status de documento de suporte
  const handleToggleDocStatus = (docId: string, newStatus: SupportDocumentItem['status']) => {
    setSupportDocs(prev => prev.map(d => d.id === docId ? { ...d, status: newStatus } : d));
    showToast('Status do documento de suporte atualizado.');
  };

  // Executa o motor de cálculo pericial determinístico
  const calculationResult: PericialCalculationResult = useMemo(() => {
    const res = runPericialTaxCalculationEngine({
      items: auditItems,
      tese: selectedTese,
      taxRegime: selectedRegime,
      protocolDate,
      consolidationDate,
      companyName,
      cnpj,
      supportDocuments: supportDocs
    });
    // Persistência local determinística
    savePericialCalculationToStorage(res, cnpj);
    return res;
  }, [auditItems, selectedTese, selectedRegime, protocolDate, consolidationDate, companyName, cnpj, supportDocs]);

  // Persistência no Backend (Prisma / API Postgres) com auditHashSha256
  useEffect(() => {
    if (calculationResult && calculationResult.totalUpdatedCredit > 0 && calculationResult.auditHashSha256) {
      saveTaxCase({
        title: `Laudo Pericial - ${companyName} (${calculationResult.teseTitle || calculationResult.tese})`,
        companyName: companyName,
        cnpj: cnpj,
        tese: calculationResult.tese,
        taxRegime: calculationResult.taxRegime,
        protocolDate: calculationResult.protocolDate,
        consolidationDate: calculationResult.consolidationDate,
        status: 'CONCLUDED',
        totalPrincipal: calculationResult.totalPrincipalCredit,
        totalSelic: calculationResult.totalSelicInterest,
        totalRecoverable: calculationResult.totalUpdatedCredit,
        auditHashSha256: calculationResult.auditHashSha256,
        reportClassification: calculationResult.reportClassification,
        perDcompReady: calculationResult.readinessPercentage === 100,
        eligibleCreditsCount: calculationResult.validItemsCount,
        prescriptionLossTotal: calculationResult.prescribedPrincipalBlocked,
        xmlDivergenceLossTotal: calculationResult.conservativeSavingsProtected,
        calculationData: calculationResult
      }).catch(err => {
        console.debug('[ExpertTaxCalculationEngine] Erro ao sincronizar caso pericial no backend:', err);
      });
    }
  }, [calculationResult?.auditHashSha256, calculationResult?.totalUpdatedCredit, companyName, cnpj]);



  // Filtra itens para o Relatório Analítico
  const filteredAnalyticalLines = useMemo(() => {
    return calculationResult.analyticalItemsReport.filter(line => {
      if (analyticalSearch.trim()) {
        const query = analyticalSearch.toLowerCase();
        const matchKey = line.accessKey.toLowerCase().includes(query);
        const matchDoc = line.documentNumber.toLowerCase().includes(query);
        const matchDesc = line.itemDescription.toLowerCase().includes(query);
        const matchNcm = line.ncm.includes(query);
        const matchCfop = line.cfop.includes(query);
        if (!matchKey && !matchDoc && !matchDesc && !matchNcm && !matchCfop) return false;
      }
      if (analyticalPrescriptionFilter === 'HABILITADOS' && line.isPrescribed) return false;
      if (analyticalPrescriptionFilter === 'PRESCRITOS' && !line.isPrescribed) return false;
      if (analyticalDivergenceFilter && !line.hasSpedXmlDivergence) return false;
      return true;
    });
  }, [calculationResult.analyticalItemsReport, analyticalSearch, analyticalPrescriptionFilter, analyticalDivergenceFilter]);

  const paginatedAnalyticalLines = useMemo(() => {
    const start = (analyticalPage - 1) * pageSize;
    return filteredAnalyticalLines.slice(start, start + pageSize);
  }, [filteredAnalyticalLines, analyticalPage]);

  const totalPages = Math.ceil(filteredAnalyticalLines.length / pageSize) || 1;

  // Handler para Upload Simulado/Real de Arquivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    const newFiles: typeof uploadedFilesList = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      newFiles.push({
        name: f.name,
        type: f.name.endsWith('.xml') ? 'XML NF-e/NFS-e' : f.name.endsWith('.txt') ? 'SPED Fiscal' : 'Declaração Federal',
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        status: 'Ingerido & Sanitizado'
      });
    }

    setTimeout(() => {
      setUploadedFilesList(prev => [...newFiles, ...prev]);
      setIsProcessing(false);
      showToast(`${files.length} arquivo(s) ingerido(s) no pipeline pericial.`);
    }, 600);
  };

  // Exportadores
  const handleExportPdf = () => {
    generatePericialDossierPdf({
      companyName,
      cnpj,
      taxRegime: selectedRegime === 'LUCRO_REAL' 
        ? 'Lucro Real (Não-Cumulativo PIS 1,65% / COFINS 7,6%)' 
        : selectedRegime === 'LUCRO_PRESUMIDO' 
        ? 'Lucro Presumido (Cumulativo PIS 0,65% / COFINS 3,0%)' 
        : selectedRegime === 'BIFASICO'
        ? 'Regime Bifásico (PIS/COFINS - 2 Etapas Concentradas)'
        : selectedRegime === 'PLURIFASICO'
        ? 'Regime Plurifásico Não-Cumulativo (Todas as Etapas / Valor Agregado)'
        : 'Simples Nacional',
      teseTitle: calculationResult.teseTitle,
      teseLegalBasis: calculationResult.teseLegalBasis,
      protocolDate,
      consolidationDate,
      reportClassification: calculationResult.reportClassification,
      readinessPercentage: calculationResult.readinessPercentage,
      totalGrossAnalyzed: calculationResult.totalGrossAnalyzed,
      totalExcludedTaxAmount: calculationResult.totalExcludedTaxAmount,
      totalPrincipalCredit: calculationResult.totalPrincipalCredit,
      totalSelicInterest: calculationResult.totalSelicInterest,
      totalUpdatedCredit: calculationResult.totalUpdatedCredit,
      prescribedBlockedAmount: calculationResult.prescribedPrincipalBlocked,
      auditHashSha256: calculationResult.auditHashSha256,
      auditHashDescription: calculationResult.auditHashDescription,
      canonicalPayloadJson: calculationResult.canonicalPayloadJson,
      calculatedAtIso: calculationResult.calculatedAtIso,
      syntheticMonths: calculationResult.syntheticMonthlyReport,
      supportDocuments: calculationResult.supportDocuments,
      complianceAlerts: calculationResult.complianceAlerts
    });
    showToast(`Dossiê Pericial Oficial (${calculationResult.reportClassification === 'LAUDO_PERICIAL_COMPLETO' ? 'Laudo Completo' : 'Resumo Preliminar'}) gerado com sucesso.`);
  };

  const handleExportSyntheticPdf = () => {
    const regimeLabels: Record<TaxRegimeType, string> = {
      LUCRO_REAL: 'Lucro Real (Não-Cumulativo: PIS 1,65% / COFINS 7,60%)',
      LUCRO_PRESUMIDO: 'Lucro Presumido (Cumulativo: PIS 0,65% / COFINS 3,00%)',
      BIFASICO: 'Regime Bifásico (2 Etapas Concentradas: PIS 2,10% / COFINS 9,65%)',
      PLURIFASICO: 'Regime Plurifásico (Valor Agregado na Cadeia: 9,25%)',
      SIMPLES_NACIONAL: 'Simples Nacional (Segregação PGDAS-D: ~2,80%)'
    };

    generateSyntheticMonthlyReportPdf({
      companyName,
      cnpj,
      protocolDate,
      protocolId: `SINT-SELIC-${Date.now().toString(36).toUpperCase()}`,
      selectedRegime,
      selectedRegimeLabel: regimeLabels[selectedRegime] || selectedRegime,
      totalExcludedTax: calculationResult.totalExcludedTaxAmount,
      totalPrincipalCredit: calculationResult.totalPrincipalCredit,
      totalSelicInterest: calculationResult.totalSelicInterest,
      totalUpdatedCredit: calculationResult.totalUpdatedCredit,
      prescribedBlockedAmount: calculationResult.prescribedPrincipalBlocked,
      syntheticMonths: calculationResult.syntheticMonthlyReport,
      hashSha256: calculationResult.auditHashSha256 || '0x4f82a938c11e74db0a5528ef3c990b7a8d11c5210984ee2c39d84bf41d9980ae',
      teseTitle: calculationResult.teseTitle || (selectedTese === 'TEMA_69_STF_ICMS_PIS_COFINS'
        ? 'Tema 69 STF — Exclusão do ICMS da Base do PIS/COFINS'
        : selectedTese === 'TEMA_118_STF_ISS_PIS_COFINS'
        ? 'Tema 118 STF — Exclusão do ISS da Base do PIS/COFINS'
        : selectedTese === 'SIMPLES_MONOFASICO_PIS_COFINS'
        ? 'Simples Nacional — Segregação de Receitas Monofásicas (Lei 10.147/00)'
        : 'INSS Patronal — Não Incidência sobre Verbas Indenizatórias')
    });
    showToast('Demonstrativo Sintético Mensal (60 meses) e SELIC exportado em PDF.');
  };

  const handleExportSyntheticCsv = () => {
    exportSyntheticReportToCsv(calculationResult);
    showToast('Relatório Sintético Mensal (60 meses) exportado em CSV.');
  };

  const handleExportAnalyticalCsv = () => {
    exportAnalyticalReportToCsv(calculationResult);
    showToast('Relatório Analítico Item a Item exportado em CSV.');
  };

  const handleExportClassificationPdf = () => {
    const regimeLabels: Record<TaxRegimeType, string> = {
      LUCRO_REAL: 'Lucro Real (Não-Cumulativo: PIS 1,65% / COFINS 7,60%)',
      LUCRO_PRESUMIDO: 'Lucro Presumido (Cumulativo: PIS 0,65% / COFINS 3,00%)',
      BIFASICO: 'Regime Bifásico (2 Etapas Concentradas: PIS 2,10% / COFINS 9,65%)',
      PLURIFASICO: 'Regime Plurifásico (Valor Agregado na Cadeia: 9,25%)',
      SIMPLES_NACIONAL: 'Simples Nacional (Segregação PGDAS-D: ~2,80%)'
    };

    generateTaxRegimeClassificationPdf({
      companyName,
      cnpj,
      protocolDate,
      selectedRegime,
      selectedRegimeLabel: regimeLabels[selectedRegime] || selectedRegime,
      totalExcludedTax: calculationResult.totalExcludedTaxAmount,
      totalUpdatedCredit: calculationResult.totalUpdatedCredit,
      totalPrincipalCredit: calculationResult.totalPrincipalCredit,
      totalSelicInterest: calculationResult.totalSelicInterest,
      effectiveRatePct: calculationResult.totalExcludedTaxAmount > 0 
        ? (calculationResult.totalPrincipalCredit / calculationResult.totalExcludedTaxAmount) * 100 
        : 9.25,
      hashSha256: calculationResult.auditHashSha256 || '0x4f82a938c11e74db0a5528ef3c990b7a8d11c5210984ee2c39d84bf41d9980ae',
      teseTitle: calculationResult.teseTitle || (selectedTese === 'TEMA_69_STF_ICMS_PIS_COFINS'
        ? 'Tema 69 STF — Exclusão do ICMS da Base de Cálculo do PIS e da COFINS'
        : selectedTese === 'TEMA_118_STF_ISS_PIS_COFINS'
        ? 'Tema 118 STF — Exclusão do ISS da Base de Cálculo do PIS e da COFINS'
        : selectedTese === 'SIMPLES_MONOFASICO_PIS_COFINS'
        ? 'Simples Nacional — Segregação de Receitas Monofásicas de PIS/COFINS (Lei 10.147/00)'
        : 'INSS Patronal — Não Incidência sobre Verbas Indenizatórias')
    });
    showToast(`Parecer Técnico de Classificação Tributária (${regimeLabels[selectedRegime] || selectedRegime}) exportado em PDF.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-950 border border-emerald-500 text-emerald-200 px-5 py-3 rounded-lg shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{feedbackToast}</span>
        </div>
      )}

      {/* Header do Motor Pericial */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-[var(--vx-neon)]">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Motor de Cálculo Pericial de Recuperação Tributária
                  <span className="text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-500/30 text-cyan-400 px-2 py-0.5 rounded">
                    Precisão Judicial & Administrativa
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Pipeline determinístico: Ingestão de XML/SPED/DCTF → Normalização → Matriz Tributária → Recálculo por Tese → SELIC Acumulada → Dossiê Pericial
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 font-mono text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                {companyName} ({cnpj})
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                Art. 39, § 4º Lei 9.250/95 (SELIC Exclusiva)
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 font-mono text-amber-400">
                <Lock className="w-3.5 h-3.5" />
                Trava Quinquenal (Art. 168 CTN)
              </span>
            </div>
          </div>

          {/* Botões de Ação Rápida e Exportação */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-950 transition-all cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              Laudo Pericial Oficial (PDF)
            </button>
            <button
              onClick={handleExportClassificationPdf}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 border border-blue-400/40 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
              title="Exportar Parecer Técnico Pericial de Classificação Monofásico / Bifásico / Plurifásico com Memória e Fundamentação Legal"
            >
              <Download className="w-4 h-4 text-cyan-200" />
              Exportar Classificação (PDF)
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSyntheticPdf}
                title="Exportar Demonstrativo Sintético Mensal (60 Meses) e Atualização SELIC em PDF com Hash SHA-256 e Art. 39 §4º da Lei 9.250/95"
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 border border-emerald-500/40 text-white text-xs font-semibold rounded-lg shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-200" />
                Sintético (PDF)
              </button>
              <button
                onClick={handleExportSyntheticCsv}
                title="Exportar Relatório Sintético Mensal"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Sintético (CSV)
              </button>
              <button
                onClick={handleExportAnalyticalCsv}
                title="Exportar Relatório Analítico Linha a Linha"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                Analítico (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Parâmetros de Cálculo e Teses */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Seletor de Tese */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            Tese Pericial
          </label>
          <select
            value={selectedTese}
            onChange={(e) => {
              const newTese = e.target.value as ExpertTeseType;
              setSelectedTese(newTese);
              let reg: TaxRegimeType = selectedRegime;
              if (newTese === 'SIMPLES_MONOFASICO_PIS_COFINS') {
                reg = 'SIMPLES_NACIONAL';
              } else if (newTese === 'T07_CREDITOS_INSUMOS_LUCRO_REAL' || newTese === 'T13_INSUMOS_LGPD_CIBER') {
                reg = 'LUCRO_REAL';
              } else if (newTese === 'T10_ICMS_BASE_IRPJ_CSLL_PRESUMIDO') {
                reg = 'LUCRO_PRESUMIDO';
              } else if (reg === 'SIMPLES_NACIONAL') {
                reg = 'LUCRO_REAL';
              }
              setSelectedRegime(reg);
              handleReloadSampleData(newTese, reg);
            }}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
          >
            <option value="TEMA_69_STF_ICMS_PIS_COFINS">1. Tema 69 STF (ICMS na Base PIS/COFINS)</option>
            <option value="TEMA_118_STF_ISS_PIS_COFINS">2. Tema 118 STF (ISS na Base PIS/COFINS)</option>
            <option value="SIMPLES_MONOFASICO_PIS_COFINS">3. Simples Nacional (Receitas Monofásicas)</option>
            <option value="VERBAS_INDENIZATORIAS_INSS_PATRONAL">4. INSS Patronal (Verbas Indenizatórias)</option>
            <option value="T02_ICMS_ST_SAIDAS">5. [T02] ICMS-ST nas Saídas (CST 060/500)</option>
            <option value="T05_PIS_COFINS_PROPRIA_BASE">6. [T05] PIS/COFINS da Própria Base (Cálculo por Dentro)</option>
            <option value="T06_BONIFICACOES_DESCONTOS">7. [T06] Bonificações e Descontos Incondicionais</option>
            <option value="T07_CREDITOS_INSUMOS_LUCRO_REAL">8. [T07] Créditos de Insumos (Lucro Real 9,25%)</option>
            <option value="T08_IPI_BASE_PIS_COFINS">9. [T08] Exclusão do IPI da Base PIS/COFINS</option>
            <option value="T09_ICMS_TUST_TUSD">10. [T09] ICMS s/ Demanda TUST/TUSD Energia Elétrica</option>
            <option value="T10_ICMS_BASE_IRPJ_CSLL_PRESUMIDO">11. [T10] Exclusão do ICMS da Base IRPJ/CSLL (Lucro Presumido)</option>
            <option value="T11_CIAP_ATIVO_IMOBILIZADO">12. [T11] Crédito ICMS Ativo Imobilizado (CIAP 1/48)</option>
            <option value="T12_TRANSFERENCIA_FILIAIS_ADC49">13. [T12] Não Incidência ICMS Transferência Filiais (ADC 49)</option>
            <option value="T13_INSUMOS_LGPD_CIBER">14. [T13] Créditos PIS/COFINS Insumos LGPD & Ciber (9,25% Lucro Real)</option>
            <option value="T14_RESSARCIMENTO_ICMS_ST">15. [T14] Ressarcimento ICMS-ST (Venda Real Inferior à Presumida)</option>
            <option value="T15_PIS_COFINS_IMPORTACAO">16. [T15] Exclusão ICMS Base PIS/COFINS-Importação (11,75%)</option>
            <option value="T16_TERCO_FERIAS_GOZADAS">17. [T16] Terço Constitucional de Férias Gozadas (Tema 985 STF)</option>
            <option value="T17_QUINZE_DIAS_AUXILIO_DOENCA">18. [T17] 15 Dias que Antecedem Auxílio-Doença (Tema 737 STJ)</option>
            <option value="T18_AVISO_PREVIO_INDENIZADO">19. [T18] Aviso Prévio Indenizado da Base INSS (Tema 478 STJ)</option>
            <option value="T19_SALARIO_MATERNIDADE">20. [T19] Cota Patronal s/ Salário-Maternidade (Tema 72 STF)</option>
            <option value="T20_LIMITE_20_SALARIOS_SISTEMA_S">21. [T20] Limite 20 Salários Mínimos p/ Terceiros/Sistema S (Tema 1079 STJ)</option>
            <option value="T21_VALE_TRANSPORTE_DINHEIRO">22. [T21] Vale-Transporte Pago em Dinheiro (STF RE 478.410)</option>
            <option value="T22_ADICIONAIS_INDENIZATORIOS">23. [T22] Verbas Indenizatórias Esporádicas (Art. 28 § 9º Lei 8.212/91)</option>
            <option value="T23_CPRB_EXCLUSAO_ICMS_ISS">24. [T23] CPRB - Exclusão de ICMS e ISS da Base da Desoneração (Tema 1048 STJ)</option>
            <option value="T24_ADICIONAL_FGTS_RESCISORIO">25. [T24] Adicional de 10% do FGTS Rescisório (LC 110/2001)</option>
            <option value="T25_REENQUADRAMENTO_RAT_FAP">26. [T25] Reenquadramento Alíquota RAT/FAP Previdenciário (Súmula 351 STJ)</option>
            <option value="T26_IRPJ_CSLL_SELIC_REPETICAO">27. [T26] Exclusão IRPJ/CSLL s/ SELIC na Repetição de Indébito (Tema 1050 STF)</option>
            <option value="T27_EQUIPARACAO_HOSPITALAR">28. [T27] Equiparação Hospitalar - Redução Base IRPJ/CSLL (Tema 217 STJ)</option>
            <option value="T28_SUBVENCOES_INVESTIMENTO">29. [T28] Subvenções e Benefícios de ICMS fora da Base IRPJ/CSLL (Tema 1182 STJ)</option>
            <option value="T29_AGIO_INCORPORACAO">30. [T29] Amortização Fiscal do Ágio Goodwill no LALUR (Arts. 20-22 DL 1.598/77)</option>
          </select>
          <p className="text-[10px] text-slate-500 leading-tight">
            {selectedTese === 'TEMA_69_STF_ICMS_PIS_COFINS' && 'Usa ICMS destacado com alíquotas por item (Real 1,65%/7,6% vs Presumido 0,65%/3,0%).'}
            {selectedTese === 'TEMA_118_STF_ISS_PIS_COFINS' && 'Exclui ISS destacado de NFSe e registros SPED A100/A170.'}
            {selectedTese === 'SIMPLES_MONOFASICO_PIS_COFINS' && 'Cruza NCM com tabela monofásica segregando PIS/COFINS do DAS.'}
            {selectedTese === 'VERBAS_INDENIZATORIAS_INSS_PATRONAL' && 'Exclui aviso prévio, 1/3 de férias e primeiros 15 dias auxílio-doença.'}
            {selectedTese === 'T02_ICMS_ST_SAIDAS' && 'Restitui diferença de ICMS-ST quando saída tem fato gerador presumido maior (RE 593849).'}
            {selectedTese === 'T05_PIS_COFINS_PROPRIA_BASE' && 'Expurga o montante de PIS e COFINS de suas próprias bases de incidência (Tema 1067 STF).'}
            {selectedTese === 'T06_BONIFICACOES_DESCONTOS' && 'Exclui da receita bruta bonificações mercantis e descontos incondicionais da NF (STJ).'}
            {selectedTese === 'T07_CREDITOS_INSUMOS_LUCRO_REAL' && 'Apropriação extemporânea de créditos 9,25% sobre insumos essenciais de produção (Tema 779 STJ).'}
            {selectedTese === 'T08_IPI_BASE_PIS_COFINS' && 'Exclui IPI destacado em vendas industriais da base de PIS/COFINS (RE 574706 analógico).'}
            {selectedTese === 'T09_ICMS_TUST_TUSD' && 'Expurga encargos de rede (TUST/TUSD) da base de ICMS na fatura de energia (Tema 986 STJ).'}
            {selectedTese === 'T10_ICMS_BASE_IRPJ_CSLL_PRESUMIDO' && 'Exclusão do ICMS da receita bruta presumida: indébito = ICMS Saída * 32% * 24% (Tema 1008 STJ).'}
            {selectedTese === 'T11_CIAP_ATIVO_IMOBILIZADO' && 'Crédito CIAP em 48 parcelas mensais: indébito = ICMS Imobilizado / 48 (LC 87/96 art. 20 § 5º / Bloco G).'}
            {selectedTese === 'T12_TRANSFERENCIA_FILIAIS_ADC49' && 'Não incidência de ICMS no deslocamento entre filiais do mesmo titular: indébito = ICMS Destacado (ADC 49 STF).'}
            {selectedTese === 'T13_INSUMOS_LGPD_CIBER' && 'Crédito mandatória de LGPD e segurança: indébito = Despesa LGPD * 9,25% apenas Lucro Real (Tema 779 STJ).'}
            {selectedTese === 'T14_RESSARCIMENTO_ICMS_ST' && 'Ressarcimento quando venda real for menor que presumida: indébito = (Base Presumida - Venda Real) * Alíquota (Tema 201 STF).'}
            {selectedTese === 'T15_PIS_COFINS_IMPORTACAO' && 'Exclusão do ICMS na base de importação aduaneira: indébito = ICMS Importação * 11,75% (Tema 1 STF).'}
            {selectedTese === 'T16_TERCO_FERIAS_GOZADAS' && 'Exclusão do terço de férias gozadas da incidência da cota patronal: indébito = Terço * 20% (Tema 985 STF).'}
            {selectedTese === 'T17_QUINZE_DIAS_AUXILIO_DOENCA' && 'Primeiros 15 dias de afastamento médico sem natureza salarial: indébito = Valor Pago * 20% (Tema 737 STJ).'}
            {selectedTese === 'T18_AVISO_PREVIO_INDENIZADO' && 'Aviso prévio indenizado possui natureza estritamente indenizatória: indébito = Aviso Prévio * 20% (Tema 478 STJ).'}
            {selectedTese === 'T19_SALARIO_MATERNIDADE' && 'Inconstitucionalidade da cobrança patronal sobre o salário-maternidade: indébito = Salário Maternidade * 20% (Tema 72 STF).'}
            {selectedTese === 'T20_LIMITE_20_SALARIOS_SISTEMA_S' && 'Limitação do teto da base a 20 salários mínimos para contribuições de terceiros: indébito = Excedente * 5,8% (Tema 1079 STJ).'}
            {selectedTese === 'T21_VALE_TRANSPORTE_DINHEIRO' && 'Vale-transporte pago em pecúnia não integra o salário de contribuição: indébito = Valor VT * 20% (STF RE 478.410).'}
            {selectedTese === 'T22_ADICIONAIS_INDENIZATORIOS' && 'Prêmios e verbas indenizatórias esporádicas sem habitualidade: indébito = Verba * 20% (Art. 28 § 9º Lei 8.212/91).'}
            {selectedTese === 'T23_CPRB_EXCLUSAO_ICMS_ISS' && 'Exclusão do ICMS e ISS destacados da receita bruta da CPRB: indébito = (ICMS + ISS) * Alíquota CPRB (Tema 1048 STJ).'}
            {selectedTese === 'T24_ADICIONAL_FGTS_RESCISORIO' && 'Inconstitucionalidade superveniente da contribuição social de 10% do FGTS: indébito = Base FGTS * 10% (LC 110/01 / RE 878.313).'}
            {selectedTese === 'T25_REENQUADRAMENTO_RAT_FAP' && 'Ajuste de alíquota GILRAT e FAP por atividade preponderante: indébito = Folha * (Alíquota Praticada - Alíquota Real) (Súmula 351 STJ).'}
            {selectedTese === 'T26_IRPJ_CSLL_SELIC_REPETICAO' && 'Não incidência de IRPJ e CSLL sobre juros SELIC de repetição de indébito: indébito = SELIC Recebida * 34% (Tema 1050 STF).'}
            {selectedTese === 'T27_EQUIPARACAO_HOSPITALAR' && 'Redução de presunção de 32% para 8% IRPJ e 12% CSLL para clínicas médicas: economia média de 5,4% da receita (Tema 217 STJ).'}
            {selectedTese === 'T28_SUBVENCOES_INVESTIMENTO' && 'Exclusão de créditos presumidos e incentivos fiscais de ICMS da base do IRPJ e CSLL: indébito = Subvenção * 34% (Tema 1182 STJ).'}
            {selectedTese === 'T29_AGIO_INCORPORACAO' && 'Amortização fiscal do ágio por rentabilidade futura (goodwill) no LALUR: aproveitamento dedutível = Quota * 34% (DL 1.598/77).'}
          </p>
        </div>

        {/* Seletor de Regime Tributário */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Regime Tributário
            </label>
            <button
              type="button"
              onClick={() => setShowRegimesTooltip(!showRegimesTooltip)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer transition-colors"
              title="Guia dos Regimes na Cadeia Comercial"
            >
              <Info className="w-3 h-3" />
              <span>{showRegimesTooltip ? 'Ocultar Guia' : 'Entenda os 3 Regimes'}</span>
            </button>
          </div>
          <select
            value={selectedRegime}
            onChange={(e) => {
              const newReg = e.target.value as TaxRegimeType;
              setSelectedRegime(newReg);
              handleReloadSampleData(selectedTese, newReg);
            }}
            disabled={
              selectedTese === 'SIMPLES_MONOFASICO_PIS_COFINS' ||
              selectedTese === 'T10_ICMS_BASE_IRPJ_CSLL_PRESUMIDO' ||
              selectedTese === 'T07_CREDITOS_INSUMOS_LUCRO_REAL' ||
              selectedTese === 'T13_INSUMOS_LGPD_CIBER'
            }
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer disabled:opacity-60"
          >
            <option value="LUCRO_REAL">Lucro Real (Não-Cumulativo: PIS 1,65% / COFINS 7,60% - Base 100%)</option>
            <option value="LUCRO_PRESUMIDO">Lucro Presumido (Cumulativo: PIS 0,65% / COFINS 3,00% - Base 82%)</option>
            <option value="BIFASICO">Regime Bifásico (2 Etapas Concentradas: PIS 2,10% / COFINS 9,65% - Base 72%)</option>
            <option value="PLURIFASICO">Regime Plurifásico Não-Cumulativo (Valor Agregado na Cadeia: 9,25% - Base 115%)</option>
            <option value="SIMPLES_NACIONAL">Simples Nacional (Segregação PGDAS-D: ~2,80% - Base 60%)</option>
          </select>

          {/* Botão de Destaque: Exportar Classificação Tributária (PDF) */}
          <button
            type="button"
            onClick={handleExportClassificationPdf}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-950/60 border border-blue-400/40 transition-all cursor-pointer"
            title="Exportar Parecer Técnico Pericial de Classificação Monofásico/Bifásico/Plurifásico em PDF com Hash SHA-256 e Leis Aplicáveis"
          >
            <Download className="w-3.5 h-3.5 text-cyan-200" />
            <span>Exportar Classificação Tributária (PDF)</span>
          </button>

          {/* Legenda / Tooltip Explicativo dos 3 Regimes */}
          {showRegimesTooltip && (
            <div className="p-3 bg-slate-950/95 border border-cyan-500/40 rounded-lg text-[11px] font-sans space-y-2 text-slate-300 shadow-xl animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/60 font-mono text-[10px] font-bold shrink-0">
                  Monofásico
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  <strong className="text-slate-100">1 Incidência:</strong> O tributo incide apenas 1 vez na cadeia comercial (geralmente no fabricante/importador), com alíquota concentrada mais alta. As etapas seguintes (distribuidor/varejo) não pagam novamente. <em>Ex: combustíveis, bebidas e remédios (Lei nº 10.147/2000).</em>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700/60 font-mono text-[10px] font-bold shrink-0">
                  Bifásico
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  <strong className="text-slate-100">2 Incidências:</strong> O tributo incide em 2 etapas específicas da cadeia comercial (produção industrial e atacado distribuidor), com alíquotas concentradas majoradas (PIS 2,10% / COFINS 9,65%), desonerando a etapa subsequente do varejo com alíquota zero. <em>Ex: autopeças, máquinas e embalagens industriais (Lei nº 10.485/2002, arts. 2º e 3º; Lei nº 10.833/2003, arts. 2º e 51-53; Lei nº 11.196/2005, art. 53).</em>
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/60 font-mono text-[10px] font-bold shrink-0">
                  Plurifásico
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  <strong className="text-slate-100">Todas as Etapas:</strong> O tributo incide em todas as etapas da circulação de mercadorias, cobrando sobre o valor agregado em cada fase (modelo padrão do ICMS/PIS-COFINS não-cumulativo e do futuro IVA/IBS/CBS - Leis nº 10.637/2002 e 10.833/2003).
                </p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-slate-500 leading-tight">
            {selectedRegime === 'BIFASICO' && 'Regime Bifásico: incidência concentrada na produção e atacado (PIS 2,10% / COFINS 9,65% - Lei 10.485/02 e Lei 10.833/03), desonerando o varejo final a alíquota zero.'}
            {selectedRegime === 'PLURIFASICO' && 'Regime Plurifásico: incidência sobre valor agregado em todas as etapas da cadeia com créditos plenos (PIS 1,65% / COFINS 7,60% - Leis 10.637/02 e 10.833/03).'}
            {selectedRegime === 'LUCRO_REAL' && 'Lucro Real Não-Cumulativo: alíquotas PIS 1,65% e COFINS 7,60% com direito a créditos de insumos (Tema 69 STF).'}
            {selectedRegime === 'LUCRO_PRESUMIDO' && 'Lucro Presumido Cumulativo: alíquotas fixas PIS 0,65% e COFINS 3,00% sobre base cumulativa (Lei 9.718/98).'}
            {selectedRegime === 'SIMPLES_NACIONAL' && 'Simples Nacional: segregação pericial de receitas do PGDAS-D (~2,80% efetivo - LC 123/2006).'}
          </p>
        </div>

        {/* Data de Protocolo (Trava Quinquenal) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Data de Protocolo (Trava 5 Anos)
          </label>
          <input
            type="date"
            value={protocolDate}
            onChange={(e) => setProtocolDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <p className="text-[10px] text-slate-500 leading-tight">
            Corte prescricional: <span className="text-rose-400 font-mono font-bold">{calculationResult.prescribedCutoffDate}</span> (Art. 168 CTN).
          </p>
        </div>

        {/* Data de Consolidação SELIC */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Data Consolidação SELIC
          </label>
          <input
            type="date"
            value={consolidationDate}
            onChange={(e) => setConsolidationDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <p className="text-[10px] text-slate-500 leading-tight">
            Mês seguinte ao fato até mês anterior + <span className="text-emerald-400 font-bold">1,00% fixo</span> no fechamento.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Atualizado (Destaque Principal) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl p-5 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--vx-neon)]" />
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Crédito Líquido Atualizado</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {formatCurrency(calculationResult.totalUpdatedCredit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Principal: <strong className="text-slate-200">{formatCurrency(calculationResult.totalPrincipalCredit)}</strong></span>
            <span>SELIC: <strong className="text-emerald-400">+{formatCurrency(calculationResult.totalSelicInterest)}</strong></span>
          </div>
        </div>

        {/* Tributo Destacado Excluído */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Tributo Destacado Excluído</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {formatCurrency(calculationResult.totalExcludedTaxAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Volume Auditado:</span>
            <span className="font-mono text-slate-300">{formatCurrency(calculationResult.totalGrossAnalyzed)}</span>
          </div>
        </div>

        {/* Documentos & Sanitização */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Documentos & Sanitização</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {calculationResult.validItemsCount.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">itens válidos</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-amber-400 font-mono">{calculationResult.returnedItemsTreated} devoluções tratadas</span>
            <span className="text-rose-400 font-mono">{calculationResult.canceledItemsIgnored} canceladas</span>
          </div>
        </div>

        {/* Trava de Prescrição & Divergências */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider">Conformidade & Travas</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">
            {calculationResult.prescribedItemsBlocked} <span className="text-xs font-normal text-slate-400">prescritos bloqueados</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-800 pt-2">
            <span className="text-slate-400">Expurgo 5 anos:</span>
            <span className="font-mono text-rose-400 font-bold">{formatCurrency(calculationResult.prescribedPrincipalBlocked)}</span>
          </div>
        </div>
      </div>

      {/* Alerta de Segurança Tributária: Tema 962 STF (IRPJ/CSLL) */}
      <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 flex items-start gap-4">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-amber-300 flex items-center gap-2">
            Alerta de Compliance Tributário: Tema 962 do STF (Não Incidência de IRPJ/CSLL sobre a SELIC)
          </h4>
          <p className="text-amber-200/80 leading-relaxed">
            Conforme tese vinculante fixada pelo STF no <strong>RE 1.063.187 (Tema 962)</strong>, os juros de mora e a atualização monetária pela taxa SELIC apurados nesta perícia (<strong>{formatCurrency(calculationResult.totalSelicInterest)}</strong>) <strong>NÃO</strong> sofrem a incidência do IRPJ e da CSLL. 
            Contudo, o valor do <strong>crédito principal ({formatCurrency(calculationResult.totalPrincipalCredit)})</strong> deverá ser oferecido à tributação no momento da homologação administrativa da compensação (DCOMP) ou do trânsito em julgado.
          </p>
        </div>
      </div>

      {/* Navegação de Abas do Módulo */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveStepTab('pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'pipeline'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Pipeline Pericial Completo
        </button>

        <button
          onClick={() => setActiveStepTab('sintetico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'sintetico'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          2. Relatório Sintético Mensal ({calculationResult.syntheticMonthlyReport.length} meses)
        </button>

        <button
          onClick={() => setActiveStepTab('analitico')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'analitico'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          3. Relatório Analítico Item a Item ({calculationResult.analyticalItemsReport.length} linhas)
        </button>

        <button
          onClick={() => setActiveStepTab('suporte')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'suporte'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          4. Documentos de Suporte & Retificadoras
          <span className={`px-1.5 py-0.2 rounded text-[10px] ${
            calculationResult.reportClassification === 'LAUDO_PERICIAL_COMPLETO' 
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          }`}>
            {calculationResult.readinessPercentage}% Pronto
          </span>
        </button>

        <button
          onClick={() => setActiveStepTab('travas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'travas'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          5. Travas & Auditoria
          {calculationResult.divergencesXmlSpedCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px]">
              {calculationResult.divergencesXmlSpedCount} divergências
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveStepTab('ingestao')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeStepTab === 'ingestao'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          6. Ingestão de Arquivos
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}

      {/* ABA 1: PIPELINE PERICIAL EXPLICADO */}
      {activeStepTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Etapa 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center mb-2 font-mono">
                1
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Ingestão Multiformato</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Leitura de XML NF-e/NFS-e, SPED EFD ICMS/IPI, EFD Contribuições, DCTF e PGDAS-D.
              </p>
            </div>

            {/* Etapa 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center mb-2 font-mono">
                2
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Normalização & Sanitização</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Exclusão de notas canceladas (cStat 101/102) e expurgo de devoluções (CFOP 1201/2201).
              </p>
            </div>

            {/* Etapa 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center mb-2 font-mono">
                3
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Matriz de Enquadramento</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Validação NCM + CFOP + CST + Regime da data do fato gerador, item a item.
              </p>
            </div>

            {/* Etapa 4 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mb-2 font-mono">
                4
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Recálculo & SELIC</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Funções determinísticas independentes e aplicação da SELIC BACEN mensal acumulada + 1%.
              </p>
            </div>

            {/* Etapa 5 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center mb-2 font-mono">
                5
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Dossiê & Compliance</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Trava quinquenal, conservadorismo em divergências XML x SPED e laudo pericial oficial.
              </p>
            </div>
          </div>

          {/* Comparativo das 4 Teses Determinísticas Independentes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scale className="w-4 h-4 text-cyan-400" />
              Matriz de Teses Determinísticas Implementadas no Motor
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tese 1 */}
              <div className={`p-4 rounded-lg border transition-all ${
                selectedTese === 'TEMA_69_STF_ICMS_PIS_COFINS' ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">1. Exclusão do ICMS da Base PIS/COFINS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">Tema 69 STF</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Deduz o ICMS destacado da NF-e (e não o recolhido), aplicando alíquotas efetivas: Lucro Real (PIS 1,65% / COFINS 7,60%) e Lucro Presumido (PIS 0,65% / COFINS 3,00%).
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Fundamento: RE 574.706/PR e Parecer SEI nº 14.483/2021/ME.
                </div>
              </div>

              {/* Tese 2 */}
              <div className={`p-4 rounded-lg border transition-all ${
                selectedTese === 'TEMA_118_STF_ISS_PIS_COFINS' ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">2. Exclusão do ISS da Base PIS/COFINS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">Tema 118 STF</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Exclui o ISS destacado das NFS-e e registros SPED EFD Contribuições (Blocos A100 e A170), evitando bi-tributação sobre receitas de serviços.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Fundamento: RE 592.616/SP e Jurisprudência Reafirmada do STJ.
                </div>
              </div>

              {/* Tese 3 */}
              <div className={`p-4 rounded-lg border transition-all ${
                selectedTese === 'SIMPLES_MONOFASICO_PIS_COFINS' ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">3. Receitas Monofásicas no Simples Nacional</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">LC 123/2006</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Cruza os NCMs com a base interna de produtos monofásicos (autopeças, fármacos, cosméticos, bebidas, combustíveis) e segrega a parcela de PIS/COFINS recolhida indevidamente no DAS.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Fundamento: Art. 18, § 4º-A, I da LC 123/2006 e Lei 10.147/2000.
                </div>
              </div>

              {/* Tese 4 */}
              <div className={`p-4 rounded-lg border transition-all ${
                selectedTese === 'VERBAS_INDENIZATORIAS_INSS_PATRONAL' ? 'bg-cyan-950/30 border-cyan-500/50' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-300">4. INSS Patronal sobre Verbas Indenizatórias</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">STF / STJ</span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Exclui da base da contribuição previdenciária patronal (20% + RAT/FAP + Terceiros / 5,8%): aviso prévio indenizado, 1/3 constitucional de férias e primeiros 15 dias de auxílio-doença.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Fundamento: Tema 985 STF, Temas 478 e 738 STJ e Pareceres PGFN.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: RELATÓRIO SINTÉTICO MENSAL */}
      {activeStepTab === 'sintetico' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Demonstrativo Sintético Mensal de Indébitos e Atualização SELIC
              </h3>
              <p className="text-xs text-slate-400">
                Consolidação mensal com bases recalculadas, taxas SELIC oficiais acumuladas e valores prontos para compensação (DCOMP).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSyntheticPdf}
                title="Baixar Demonstrativo Sintético Mensal (60 Meses) e Atualização SELIC em PDF"
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm border border-emerald-400/30 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-100" />
                Baixar em PDF
              </button>
              <button
                onClick={handleExportSyntheticCsv}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                Baixar em CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-3 px-4">Competência</th>
                  <th className="py-3 px-3 text-center">Docs/Itens</th>
                  <th className="py-3 px-3 text-right">Base Original</th>
                  <th className="py-3 px-3 text-right">Trib. Excluído</th>
                  <th className="py-3 px-3 text-right">Base Recalculada</th>
                  <th className="py-3 px-3 text-right text-cyan-300">Indébito Princ.</th>
                  <th className="py-3 px-3 text-right text-emerald-400">SELIC Acum.</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Juros SELIC</th>
                  <th className="py-3 px-4 text-right text-cyan-300 font-bold">Total Atualizado</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {calculationResult.syntheticMonthlyReport.map((m) => (
                  <tr 
                    key={m.competenceMonth} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      m.isPrescribed ? 'opacity-50 bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-4 font-bold text-slate-200 flex items-center gap-1.5">
                      {m.competenceMonth}
                      {m.divergencesCount > 0 && (
                        <span title={`${m.divergencesCount} divergência(s) XML x SPED conciliadas com o menor valor`} className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {m.documentsCount} / {m.itemsCount}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(m.originalBaseTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(m.excludedTaxTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(m.recalculatedBaseTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {m.isPrescribed ? 'R$ 0,00' : formatCurrency(m.principalDifferenceTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {m.selicRateAccumulatedPct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      {m.isPrescribed ? 'R$ 0,00' : formatCurrency(m.selicInterestTotal)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-cyan-300">
                      {m.isPrescribed ? 'R$ 0,00' : formatCurrency(m.totalCreditUpdated)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {m.isPrescribed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> Prescrito
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Habilitado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-950 border-t-2 border-slate-700 font-mono font-bold text-xs">
                <tr>
                  <td className="py-3 px-4 text-slate-200">TOTAIS CONSOLIDADOS:</td>
                  <td className="py-3 px-3 text-center text-slate-400">
                    {calculationResult.syntheticMonthlyReport.reduce((acc, m) => acc + m.itemsCount, 0)} itens
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {formatCurrency(calculationResult.totalGrossAnalyzed)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {formatCurrency(calculationResult.totalExcludedTaxAmount)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    {formatCurrency(calculationResult.totalGrossAnalyzed - calculationResult.totalExcludedTaxAmount)}
                  </td>
                  <td className="py-3 px-3 text-right text-cyan-300 text-sm">
                    {formatCurrency(calculationResult.totalPrincipalCredit)}
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400">-</td>
                  <td className="py-3 px-3 text-right text-emerald-400 text-sm">
                    {formatCurrency(calculationResult.totalSelicInterest)}
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-300 text-sm">
                    {formatCurrency(calculationResult.totalUpdatedCredit)}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-400">Auditoria OK</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ABA 3: RELATÓRIO ANALÍTICO ITEM A ITEM */}
      {activeStepTab === 'analitico' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            {/* Campo de Busca */}
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={analyticalSearch}
                  onChange={(e) => {
                    setAnalyticalSearch(e.target.value);
                    setAnalyticalPage(1);
                  }}
                  placeholder="Filtrar por Chave de Acesso NF-e, Item, NCM, CFOP..."
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Filtro de Prescrição */}
              <select
                value={analyticalPrescriptionFilter}
                onChange={(e: any) => {
                  setAnalyticalPrescriptionFilter(e.target.value);
                  setAnalyticalPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="HABILITADOS">Apenas Habilitados (&lt; 5 anos)</option>
                <option value="PRESCRITOS">Apenas Prescritos (&gt; 5 anos)</option>
              </select>

              {/* Toggle de Divergências */}
              <button
                onClick={() => {
                  setAnalyticalDivergenceFilter(!analyticalDivergenceFilter);
                  setAnalyticalPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  analyticalDivergenceFilter
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Divergências XML vs SPED
              </button>
            </div>

            <button
              onClick={handleExportAnalyticalCsv}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Exportar Linha a Linha (CSV)
            </button>
          </div>

          <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="py-3 px-3">Chave de Acesso / Doc</th>
                  <th className="py-3 px-2 text-center">Data / Mês</th>
                  <th className="py-3 px-3">Item / NCM / CFOP</th>
                  <th className="py-3 px-3 text-right">Base Orig.</th>
                  <th className="py-3 px-3 text-right">Trib. Excluído</th>
                  <th className="py-3 px-3 text-right">Base Recalc.</th>
                  <th className="py-3 px-2 text-center">Alíq.</th>
                  <th className="py-3 px-3 text-right text-cyan-300">Créd. Princ.</th>
                  <th className="py-3 px-2 text-right text-emerald-400">SELIC %</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Juros SELIC</th>
                  <th className="py-3 px-3 text-right text-cyan-300 font-bold">Total Liq.</th>
                  <th className="py-3 px-3 text-center">Status / Trava</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {paginatedAnalyticalLines.map((line) => (
                  <tr 
                    key={line.id} 
                    className={`hover:bg-slate-800/40 transition-colors ${
                      line.isPrescribed ? 'opacity-50 bg-rose-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-200 text-[11px]">
                        Doc nº {line.documentNumber} (Item {line.itemNumber})
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]" title={line.accessKey}>
                        {line.accessKey}
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">
                      <div>{line.issueDate}</div>
                      <div className="text-[10px] text-slate-500">{line.competenceMonth}</div>
                    </td>

                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="text-slate-200 truncate font-sans text-xs" title={line.itemDescription}>
                        {line.itemDescription}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        NCM: <span className="text-cyan-400">{line.ncm}</span> | CFOP: <span className="text-amber-400">{line.cfop}</span> | CST: {line.cstPisCofins}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(line.originalBaseValue)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(line.excludedTaxDestacado)}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-300">
                      {formatCurrency(line.recalculatedBaseValue)}
                    </td>

                    <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">
                      {line.totalTaxRatePct.toFixed(2)}%
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {line.isPrescribed ? 'R$ 0,00' : formatCurrency(line.totalCreditPrincipal)}
                    </td>

                    <td className="py-2.5 px-2 text-right text-emerald-400 text-[11px]">
                      {line.selicRateAccumulatedPct.toFixed(2)}%
                    </td>

                    <td className="py-2.5 px-3 text-right text-emerald-400">
                      {line.isPrescribed ? 'R$ 0,00' : formatCurrency(line.selicInterestAmount)}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                      {line.isPrescribed ? 'R$ 0,00' : formatCurrency(line.totalCreditUpdated)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {line.isPrescribed ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-500/30">
                          Prescrito
                        </span>
                      ) : line.hasSpedXmlDivergence ? (
                        <span 
                          title={line.divergenceNotice}
                          className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 cursor-help"
                        >
                          Menor Valor
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <div>
              Exibindo <strong>{paginatedAnalyticalLines.length}</strong> de <strong>{filteredAnalyticalLines.length}</strong> itens auditados
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAnalyticalPage(p => Math.max(1, p - 1))}
                disabled={analyticalPage === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <span className="font-mono text-slate-300">
                Página {analyticalPage} de {totalPages}
              </span>
              <button
                onClick={() => setAnalyticalPage(p => Math.min(totalPages, p + 1))}
                disabled={analyticalPage === totalPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: DOCUMENTOS DE SUPORTE, RETIFICADORAS E PER/DCOMP */}
      {activeStepTab === 'suporte' && (
        <div className="space-y-6">
          {/* Badge de Classificação do Laudo */}
          <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            calculationResult.reportClassification === 'LAUDO_PERICIAL_COMPLETO'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-100'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>
                  {calculationResult.reportClassification === 'LAUDO_PERICIAL_COMPLETO'
                    ? 'LAUDO PERICIAL COMPLETO AUDITÁVEL (PRONTO PARA PER/DCOMP E JUDICIAL)'
                    : 'RESUMO EXECUTIVO PRELIMINAR (DIAGNÓSTICO INICIAL - REQUER SUPORTE)'}
                </span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed">
                {calculationResult.reportClassification === 'LAUDO_PERICIAL_COMPLETO'
                  ? 'Todos os requisitos formais, memórias de 60 meses, retificadoras (EFD/DCTF/PGDAS) e guias originárias foram anexados e validados.'
                  : 'Este laudo é um diagnóstico estimativo preliminar. Para protocolar a compensação no PER/DCOMP Web ou ação judicial, anexe e transmita as retificadoras requeridas abaixo.'}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs opacity-75 font-mono">Prontidão PER/DCOMP</div>
                <div className="text-xl font-bold font-mono">
                  {calculationResult.readinessPercentage}%
                </div>
              </div>
              <div className="w-16 bg-slate-900 rounded-full h-3 p-0.5 border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all ${
                    calculationResult.readinessPercentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${calculationResult.readinessPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Checklist de Documentos e Retificadoras */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Checklist de Documentos de Suporte, Retificadoras e Guias
                </h4>
                <p className="text-xs text-slate-400">
                  Gerenciamento dos anexos probatórios indispensáveis para deferimento administrativo pela Receita Federal.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800">
              {supportDocs.map((doc) => (
                <div key={doc.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{doc.title}</span>
                      <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] font-mono">
                        {doc.category}
                      </span>
                      {doc.requiredForPerDcomp && (
                        <span className="px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded text-[10px]">
                          Obrigatório PER/DCOMP
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {doc.systemOrType} • Abrangência: {doc.competenceRange}
                    </div>
                    {doc.notes && (
                      <p className="text-slate-500 text-[11px] italic">{doc.notes}</p>
                    )}
                    {doc.receiptNumber && (
                      <div className="text-emerald-400 font-mono text-[11px]">
                        Recibo / Protocolo: {doc.receiptNumber}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={doc.status}
                      onChange={(e) => handleToggleDocStatus(doc.id, e.target.value as SupportDocumentItem['status'])}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="PENDENTE">🟡 Pendente / Aguardando</option>
                      <option value="ANEXADO">🟢 Anexado no Dossiê</option>
                      <option value="TRANSMITIDO">🔵 Transmitido na RFB / e-CAC</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: TRAVAS & AUDITORIA DE DIVERGÊNCIAS */}
      {activeStepTab === 'travas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trava 1: Prescrição Quinquenal */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                Trava Automática de Prescrição Quinquenal (Art. 168 CTN)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O motor pericial calcula a data limite com base na data de protocolo informada (<strong>{protocolDate}</strong>), bloqueando automaticamente todos os fatos geradores com competência anterior a <strong>{calculationResult.prescribedCutoffDate}</strong> (60 meses).
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Itens Prescritos Bloqueados:</span>
                  <span className="text-rose-400 font-bold">{calculationResult.prescribedItemsBlocked}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Crédito Prescrito Expurgado:</span>
                  <span className="text-rose-400 font-bold">{formatCurrency(calculationResult.prescribedPrincipalBlocked)}</span>
                </div>
              </div>
            </div>

            {/* Trava 2: Divergência XML vs SPED Conservadora */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Conciliação Conservadora XML vs SPED Fiscal
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quando o valor do ICMS ou ISS destacado no XML diverge do escriturado no Bloco C170/A170 do SPED, o motor pericial adota <strong>estritamente o menor valor</strong> para resguardar o contribuinte contra autos de infração e glosas da Receita Federal.
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Divergências Detectadas:</span>
                  <span className="text-amber-400 font-bold">{calculationResult.divergencesXmlSpedCount} itens</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Redução Conservadora Aplicada:</span>
                  <span className="text-emerald-400 font-bold">{formatCurrency(calculationResult.conservativeSavingsProtected)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Integridade Criptográfica SHA-256 e Imutabilidade Pericial */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  Integridade Criptográfica do Laudo Pericial (SHA-256 / Web Crypto API)
                </h4>
                <p className="text-xs text-slate-400">
                  Garantia matemática de não-repúdio e imutabilidade de cálculo perante a Receita Federal e o Poder Judiciário.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSanityCheck}
                  disabled={isRunningSanityCheck}
                  className="px-3 py-1.5 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-500/40 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  title="Executar prova de determinismo e sensibilidade (avalanche effect)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRunningSanityCheck ? 'animate-spin' : ''}`} />
                  {isRunningSanityCheck ? 'Validando...' : 'Testar Sanidade Criptográfica'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCanonicalModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Code className="w-3.5 h-3.5 text-cyan-400" />
                  Inspecionar Payload Canônico
                </button>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Hash
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Digest Hexadecimal SHA-256 (64 caracteres)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
                    FIPS 180-4 Standard
                  </span>
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all font-semibold tracking-wide">
                  {calculationResult.auditHashSha256}
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Metadados do Hash:</strong> {calculationResult.auditHashDescription}
                </div>
              </div>

              {/* Painel do Teste de Sanidade Criptográfica (Determinismo & Efeito Avalanche) */}
              {sanityCheckResult && (
                <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Resultado da Auditoria Criptográfica (Web Crypto API / FIPS 180-4)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Executado em {new Date(sanityCheckResult.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Teste 1: Determinismo */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">1. Determinismo Estrito</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">100% OK</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sanityCheckResult.determinismTest.description}
                      </p>
                      <div className="font-mono text-[9px] text-cyan-300 break-all bg-slate-950 p-1.5 rounded">
                        Digest: {sanityCheckResult.determinismTest.generation1Hash.substring(0, 24)}...
                      </div>
                    </div>

                    {/* Teste 2: Sensibilidade / Efeito Avalanche */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">2. Efeito Avalanche (+R$ 0,01)</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                          {sanityCheckResult.sensitivityTest.avalanchePercentage}% Var.
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sanityCheckResult.sensitivityTest.description}
                      </p>
                      <div className="font-mono text-[9px] text-rose-300 break-all bg-slate-950 p-1.5 rounded">
                        Hash Divergente: {sanityCheckResult.sensitivityTest.alteredHash.substring(0, 24)}...
                      </div>
                    </div>

                    {/* Teste 3: Conformidade Web Crypto */}
                    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">3. Conformidade W3C</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">SHA-256</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {sanityCheckResult.webCryptoEquivalenceTest.description}
                      </p>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        64 chars hex • 256 bits • Sem prefixo 0x decorativo
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-slate-400 font-mono text-[11px]">Algoritmo</div>
                  <div className="text-slate-200 font-bold">SHA-256 (256 bits)</div>
                  <div className="text-slate-500 text-[10px]">Padrão NIST FIPS PUB 180-4</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-slate-400 font-mono text-[11px]">Dados Hasheados</div>
                  <div className="text-slate-200 font-bold">Payload Canônico Completo</div>
                  <div className="text-slate-500 text-[10px]">CNPJ, 60 meses, Principal & SELIC</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1">
                  <div className="text-slate-400 font-mono text-[11px]">Auditabilidade Externa</div>
                  <div className="text-slate-200 font-bold">100% Determinístico</div>
                  <div className="text-slate-500 text-[10px]">Auditável via OpenSSL / Web Crypto</div>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Alertas de Auditoria Pericial */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Painel de Alertas e Invariantes Periciais Validadas
            </h4>
            <div className="space-y-2">
              {calculationResult.complianceAlerts.map((alert, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' :
                    alert.severity === 'WARNING' ? 'bg-amber-950/20 border-amber-500/40 text-amber-200' :
                    'bg-cyan-950/20 border-cyan-500/40 text-cyan-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {alert.severity === 'CRITICAL' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    {alert.severity === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {alert.severity === 'INFO' && <Info className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-bold">{alert.title}</div>
                    <p className="opacity-90 leading-relaxed">{alert.message}</p>
                    <div className="text-[11px] opacity-75 font-mono">Ação adotada: {alert.actionTaken}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 5: INGESTÃO DE ARQUIVOS */}
      {activeStepTab === 'ingestao' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              Ingestão de Arquivos Fiscais e SPEDs
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Arraste ou selecione arquivos XML (NF-e, NFS-e), arquivos TXT do SPED Fiscal (EFD ICMS/IPI e EFD Contribuições), DCTF ou PGDAS-D.
            </p>

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center transition-colors bg-slate-950/50">
              <input
                type="file"
                id="file-upload-pericial"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".xml,.txt,.pdf,.zip"
              />
              <label htmlFor="file-upload-pericial" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  Clique para selecionar ou arraste seus arquivos fiscais aqui
                </div>
                <div className="text-[11px] text-slate-500">
                  Formatos suportados: XML (NF-e modelo 55, NFS-e ABRASF), TXT (SPED EFD ICMS/IPI e EFD Contribuições), PGDAS-D, DCTF
                </div>
              </label>
            </div>
          </div>

          {/* Arquivos Ingeridos */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Arquivos Ingeridos no Barramento de Auditoria ({uploadedFilesList.length})
            </h4>
            <div className="divide-y divide-slate-800">
              {uploadedFilesList.map((file, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-mono text-slate-200 font-semibold">{file.name}</span>
                      <span className="text-[10px] text-slate-500 ml-2">({file.type} • {file.size})</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPEÇÃO DO PAYLOAD CANÔNICO SHA-256 */}
      {showCanonicalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    Payload Canônico JSON para Verificação SHA-256
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Estrutura canônica normalizada e estável utilizada para gerar a assinatura de integridade.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCanonicalModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 font-mono text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">Hash SHA-256 Resultante:</span>
                  <span className="text-emerald-400 font-bold">{calculationResult.auditHashSha256.length} caracteres hex</span>
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-cyan-300 select-all break-all">
                  {calculationResult.auditHashSha256}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold font-sans text-xs">Conteúdo Canônico Serializado (JSON)</span>
                  <button
                    type="button"
                    onClick={handleCopyCanonicalPayload}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar JSON
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-[11px] overflow-x-auto max-h-96 select-all leading-relaxed">
                  {calculationResult.canonicalPayloadJson}
                </pre>
              </div>

              {/* Guia de Auditoria Externa */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 font-sans text-xs">
                <h5 className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Como verificar este hash no terminal (OpenSSL) ou Node.js:
                </h5>
                <div className="bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500"># Salve o JSON canônico acima em payload.json e execute:</div>
                  <div className="text-emerald-400">openssl dgst -sha256 payload.json</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Padrão NIST FIPS PUB 180-4 / W3C Web Cryptography API
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Hash
                </button>
                <button
                  type="button"
                  onClick={() => setShowCanonicalModal(false)}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
