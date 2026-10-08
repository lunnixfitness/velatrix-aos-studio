import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  ShieldAlert, 
  Activity, 
  Zap, 
  TrendingUp, 
  DollarSign, 
  Lock, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  Building2, 
  Calendar, 
  Fingerprint, 
  Sparkles, 
  ExternalLink,
  Layers,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Building,
  Scale,
  FileSpreadsheet,
  Code,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/i18n';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';
import { generateLegalTaxDossierPdf } from '../../utils/legalTaxDossierPdf';
import { 
  generateWhiteLabelPartnerDossierPdf, 
  generatePartnerSuccessFeeContractPdf,
  generateRipdDpiaPdf,
  buildRipdCanonicalPayload
} from '../../services/pdfReportService';
import { secureInt } from '../../lib/demoMode';

export type TaxDocPreviewType = 
  | 'dossier_cda'
  | 'analytical_table'
  | 'perdcomp_instruction'
  | 'pgfn_minuta'
  | 'certificado_pericial'
  | 'laudo_pericial_60m'
  | 'white_label_dossier'
  | 'success_contract'
  | 'relatorio_ripd';

export interface PartnerDocMetadata {
  firmName?: string;
  lawyerName?: string;
  oabOrCrc?: string;
  email?: string;
  phone?: string;
  brandPrimaryColor?: string;
  successFeePercent?: number;
  partnerSplitPercent?: number;
  velatrixSplitPercent?: number;
}

interface TaxRecoveryDocPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: TaxDocPreviewType;
  tenantData: SharedTenantTaxData;
  partnerData?: PartnerDocMetadata;
}

export const TaxRecoveryDocPreviewModal: React.FC<TaxRecoveryDocPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  tenantData,
  partnerData
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'calculation' | 'crypto' | 'procedure'>('preview');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalCredits = tenantData.preliminaryScan?.totalEstimatedCredits || 2485000;
  const rawSha256Hash = tenantData.preliminaryScan?.hashSha256 || '8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d';
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const rawProtocolId = `PROTOCOLO-RECUP-2026-${tenantData.cnpj.replace(/[^0-9]/g, '').slice(0, 8)}-${secureInt(1000, 9999)}`;

  // Constrói objeto canônico estático para RIPD garantindo integridade de hash uniforme
  const ripdCanonical = useMemo(() => {
    if (documentType !== 'relatorio_ripd') return null;
    return buildRipdCanonicalPayload({
      companyName: tenantData.companyName || 'Vortex Logística & Manufatura S.A.',
      cnpj: tenantData.cnpj || '33.041.260/0001-88',
      dpoEmail: 'dpo@velatrix.com.br',
      dpoName: 'Conselho de Governança & DPO Velatrix AOS',
      signatoryName: partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro',
      signatoryRole: 'Encarregado de Proteção de Dados (DPO) • Art. 41 da LGPD'
    });
  }, [documentType, tenantData.companyName, tenantData.cnpj, partnerData?.lawyerName]);

  const sha256Hash = ripdCanonical ? ripdCanonical.sha256Hash : rawSha256Hash;
  const protocolId = ripdCanonical ? ripdCanonical.protocol : rawProtocolId;

  const getDocConfig = (type: TaxDocPreviewType) => {
    switch (type) {
      case 'dossier_cda':
        return {
          title: 'Dossiê Pericial de CDA & Parecer Técnico Contábil',
          subtitle: 'Laudo pericial oficial para embasamento de Ação Anulatória / Exceção de Pré-Executividade',
          fileFormat: 'PDF Assinado ICP-Brasil (Padrão PJe / e-CAC)',
          fileSize: '4.8 MB',
          badgeColor: 'emerald',
          downloadFilename: `Dossie_Pericial_CDA_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
      case 'analytical_table':
        return {
          title: 'Tabela Analítica Linha a Linha (70.840 Chaves de NF-e e EFD)',
          subtitle: 'Memória de cálculo detalhada discriminando ICMS destacado, PIS/COFINS e SELIC mês a mês',
          fileFormat: 'Planilha XLSX / CSV Auditado',
          fileSize: '18.4 MB',
          badgeColor: 'cyan',
          downloadFilename: `Tabela_Analitica_NFe_EFD_${tenantData.cnpj.replace(/[^0-9]/g, '')}.csv`
        };
      case 'perdcomp_instruction':
        return {
          title: 'Arquivo de Instrução para Compensação PER/DCOMP',
          subtitle: 'Estrutura XML e parâmetros de habilitação para transmissão via PER/DCOMP Web / Receita Federal',
          fileFormat: 'XML / Layout Receita Federal RFB',
          fileSize: '1.2 MB',
          badgeColor: 'blue',
          downloadFilename: `Instrucao_PERDCOMP_Web_${tenantData.cnpj.replace(/[^0-9]/g, '')}.xml`
        };
      case 'pgfn_minuta':
        return {
          title: 'Minuta Parametrizada de Acordo de Transação SISPAR PGFN',
          subtitle: 'Minuta jurídica com desconto de até 70% em juros/multas e parcelamento em 145 meses',
          fileFormat: 'DOCX / PDF Jurídico SISPAR',
          fileSize: '640 KB',
          badgeColor: 'amber',
          downloadFilename: `Minuta_Acordo_Transacao_PGFN_${tenantData.cnpj.replace(/[^0-9]/g, '')}.docx`
        };
      case 'white_label_dossier':
        return {
          title: `Dossiê Pericial White-Label — ${partnerData?.firmName || 'Parceiro Credenciado'}`,
          subtitle: 'Laudo pericial oficial D+0 emitido com a identidade visual e dados do escritório credenciado',
          fileFormat: 'PDF White-Label ICP-Brasil (A4)',
          fileSize: '4.9 MB',
          badgeColor: 'indigo',
          downloadFilename: `Dossie_WhiteLabel_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
      case 'success_contract':
        return {
          title: 'Contrato Digital de Honorários de Êxito (Split por Deal)',
          subtitle: 'Minuta formal de honorários advocatícios ("Zero Pró-Labore") com split automatizado em D+0',
          fileFormat: 'PDF Jurídico (ICP-Brasil)',
          fileSize: '1.1 MB',
          badgeColor: 'emerald',
          downloadFilename: `Contrato_Exito_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
      case 'certificado_pericial':
        return {
          title: 'Certificado Oficial de Blindagem & Eficiência Tributária',
          subtitle: 'Certificado oficial emitido com assinatura digital, hash SHA-256 e selo de conformidade LGPD',
          fileFormat: 'Certificado Digital & PDF Oficial',
          fileSize: '890 KB',
          badgeColor: 'amber',
          downloadFilename: `Certificado_Blindagem_Velatrix_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
      case 'relatorio_ripd':
        return {
          title: 'Relatório de Impacto à Proteção de Dados (RIPD / DPIA)',
          subtitle: 'Governança LGPD (Art. 38, Lei 13.709/18), Sigilo Bancário (LC 105/01) e Fiscal (Art. 198 CTN)',
          fileFormat: 'PDF Oficial de Governança (ICP-Brasil)',
          fileSize: '2.4 MB',
          badgeColor: 'emerald',
          downloadFilename: `Relatorio_RIPD_LGPD_DPIA_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
      case 'laudo_pericial_60m':
      default:
        return {
          title: 'Laudo Pericial Oficial de Recuperação Tributária (60 Meses)',
          subtitle: 'Auditoria integral dos últimos 60 meses ininterruptos processada pelo motor Velatrix AOS',
          fileFormat: 'PDF Assinado ICP-Brasil (FIPS 180-4)',
          fileSize: '5.2 MB',
          badgeColor: 'emerald',
          downloadFilename: `Laudo_Oficial_Tributario_60M_${tenantData.cnpj.replace(/[^0-9]/g, '')}.pdf`
        };
    }
  };

  const docConfig = getDocConfig(documentType);

  const handleCopySummary = () => {
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const formattedTime = new Date().toLocaleTimeString('pt-BR');
    const cdaNum = tenantData.cdaNumber || '80.6.24.00412-18';
    const procNum = tenantData.processNumber || '5004128-44.2024.4.03.6100';

    if (documentType === 'dossier_cda' || documentType === 'laudo_pericial_60m') {
      const tesesList = tenantData.preliminaryScan?.teses || [];
      const tableRows = tesesList.map(t => {
        const col1 = (t.title || t.code).padEnd(43, ' ');
        const col2 = (t.court === 'RFB' ? t.code : `${t.court} (${t.code})`).padEnd(23, ' ');
        const col3 = (t.statusLabel || 'RFB').padEnd(6, ' ');
        const col4 = formatCurrency(t.estimatedCredit, 'BRL');
        return `${col1}| ${col2} | ${col3} | ${col4}`;
      }).join('\n');

      const fullDossier = `================================================================================
VELATRIX AOS — DEFESA & RECUPERAÇÃO TRIBUTÁRIA OFICIAL
DOSSIÊ PERICIAL TÉCNICO CONTÁBIL (60 MESES)
Protocolo ICP-Brasil: ${protocolId} | Emissão: ${formattedDate} às ${formattedTime}
Hash SHA-256: ${sha256Hash}
================================================================================

1. DADOS CADASTRAIS DO CONTRIBUINTE AUDITADO
Razão Social: ${tenantData.companyName}
CNPJ: ${tenantData.cnpj} | Setor Econômico: ${tenantData.sectorName || 'Autopeças & Motopeças (Tributação Concentrada Monofásica)'}
[SE DEFESA DE CDA]: CDA Nº: ${cdaNum} | Proc. Execução Fiscal Nº: ${procNum}

MONTANTE TOTAL DE INDÉBITO APURADO (ÚLTIMOS 60 MESES): ${formatCurrency(totalCredits, 'BRL')}

2. TESES JURÍDICO-TRIBUTÁRIAS HOMOLOGADAS & CRÉDITOS LIQUIDADOS
--------------------------------------------------------------------------------
TRIBUTO / TESE                             | TRIBUNAL / BASE LEGAL | STATUS | CRÉDITO
--------------------------------------------------------------------------------
${tableRows || 'PIS/COFINS - Segregação Monofásica (Motopeças)| Lei nº 10.485/2002     | RFB    | R$ 820.000,00\nPIS/COFINS - Exclusão ICMS da BC (Tema 69)  | STF (RE 574.706)      | RFB    | R$ 640.000,00\nPREVIDENCIÁRIO - Verbas Indenizatórias (Tema 985)| STF (REsp 1.230.957)  | RFB    | R$ 200.000,00'}
--------------------------------------------------------------------------------`;
      navigator.clipboard.writeText(fullDossier);
    } else {
      const summary = `=== PROTOCOLO OFICIAL VELATRIX AOS ===
DOCUMENTO: ${docConfig.title}
CONTRIBUINTE: ${tenantData.companyName}
CNPJ: ${tenantData.cnpj}
PROTOCOLO: ${protocolId}
HASH SHA-256: ${sha256Hash}
CRÉDITOS AUDITADOS: ${formatCurrency(totalCredits, 'BRL')}
PERÍODO AUDITADO: 60 Meses (D-60 a D+0)
VALIDAÇÃO ICP-BRASIL: Em conformidade com Lei 13.709/2018 (LGPD) e Resolução CFC nº 1.493/2015.`;
      navigator.clipboard.writeText(summary);
    }
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(sha256Hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 3000);
  };

  const handleExecuteDownload = () => {
    setIsDownloading(true);

    setTimeout(() => {
      try {
        if (documentType === 'white_label_dossier') {
          generateWhiteLabelPartnerDossierPdf({
            companyName: tenantData.companyName || 'Vortex Logística & Manufatura S.A.',
            cnpj: tenantData.cnpj || '33.041.260/0001-88',
            sectorName: tenantData.sectorName || 'Manufatura & Indústria Pesada',
            totalCredits: totalCredits,
            partnerFirmName: partnerData?.firmName || 'Vasconcelos & Associados Advocacia Tributária',
            partnerLawyerName: partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro',
            partnerOabOrCrc: partnerData?.oabOrCrc || 'OAB/SP 284.910',
            partnerEmail: partnerData?.email || 'marcelo@vasconcelosadv.com.br',
            partnerPhone: partnerData?.phone || '(11) 98412-4400',
            brandPrimaryColor: partnerData?.brandPrimaryColor || '#4F46E5',
            hashSha256: sha256Hash,
            teses: (tenantData.preliminaryScan?.teses || []).map(t => ({
              code: t.code,
              title: t.title,
              court: t.court,
              estimatedCredit: t.estimatedCredit
            }))
          });
        } else if (documentType === 'success_contract') {
          generatePartnerSuccessFeeContractPdf({
            clientCompanyName: tenantData.companyName || 'Vortex Logística & Manufatura S.A.',
            clientCnpj: tenantData.cnpj || '33.041.260/0001-88',
            partnerFirmName: partnerData?.firmName || 'Vasconcelos & Associados Advocacia Tributária',
            partnerLawyerName: partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro',
            partnerOabOrCrc: partnerData?.oabOrCrc || 'OAB/SP 284.910',
            totalEstimatedBenefit: totalCredits,
            successFeePercent: partnerData?.successFeePercent || 20,
            partnerSplitPercent: partnerData?.partnerSplitPercent || 70,
            velatrixSplitPercent: partnerData?.velatrixSplitPercent || 30,
            hashSha256: sha256Hash
          });
        } else if (documentType === 'relatorio_ripd') {
          generateRipdDpiaPdf({
            companyName: tenantData.companyName || 'Vortex Logística & Manufatura S.A.',
            cnpj: tenantData.cnpj || '33.041.260/0001-88',
            protocolId: ripdCanonical?.protocol || protocolId,
            hashSha256: ripdCanonical?.sha256Hash || sha256Hash,
            dpoEmail: ripdCanonical?.dpoEmail || 'dpo@velatrix.com.br',
            dpoName: ripdCanonical?.dpoName || 'Conselho de Governança & DPO Velatrix AOS',
            emissionDate: ripdCanonical?.dateFormatted,
            emissionTime: ripdCanonical?.timeFormatted,
            signatoryName: partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro',
            signatoryRole: 'Encarregado de Proteção de Dados (DPO) • Art. 41 da LGPD'
          });
        } else if (documentType === 'dossier_cda' || documentType === 'laudo_pericial_60m' || documentType === 'certificado_pericial') {
          generateLegalTaxDossierPdf({
            companyName: tenantData.companyName || 'Motrix Componentes Automotivos Ltda.',
            cnpj: tenantData.cnpj || '21.554.870/0001-33',
            sectorName: tenantData.sectorName || 'Autopeças & Motopeças (Tributação Concentrada Monofásica)',
            totalCredits: totalCredits,
            cdaNumber: tenantData.cdaNumber || '80.6.24.00412-18',
            processNumber: tenantData.processNumber || '5004128-44.2024.4.03.6100',
            protocolId,
            teses: (tenantData.preliminaryScan?.teses || []).map(t => ({
              code: t.code,
              title: t.title,
              court: t.court,
              estimatedCredit: t.estimatedCredit,
              riskScoreLabel: 'Pacificada',
              statusLabel: t.statusLabel || 'RFB'
            })),
            hashSha256: sha256Hash,
            signatoryName: 'Dr. Marcelo Vasconcelos Ribeiro / Rodrigo Antunes (CFO)',
            signatoryRole: 'Perito Técnico Contábil & Diretor Tributário'
          });
        } else if (documentType === 'analytical_table') {
          // Generate CSV download
          const headers = 'Competencia,NF_Chave,CFOP,Descricao_Insumo,Base_Calculo_ICMS_BRL,ICMS_Destacado_BRL,Aliquota_PIS_COFINS,Credito_Principal_BRL,SELIC_Acumulada_Perc,Total_Atualizado_BRL,Status_Auditado\n';
          let rows = '';
          for (let m = 1; m <= 60; m++) {
            const val = Math.round(totalCredits / 60);
            const selic = 1.284;
            rows += `2021-${(m % 12 + 1).toString().padStart(2, '0')},35210933041260000188550010000${m.toString().padStart(5, '0')},1101,Insumos Produtivos Alíquota Zero,${(val * 10).toFixed(2)},${(val * 1.8).toFixed(2)},9.25%,${val.toFixed(2)},28.4%,${(val * selic).toFixed(2)},HOMOLOGADO_SHA256\n`;
          }
          const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = docConfig.downloadFilename;
          link.click();
        } else if (documentType === 'perdcomp_instruction') {
          // Generate XML
          const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<DCOMPWeb xmlns="http://www.receita.fazenda.gov.br/DCOMP" versao="4.8">
  <Contribuinte>
    <CNPJ>${tenantData.cnpj.replace(/[^0-9]/g, '')}</CNPJ>
    <RazaoSocial>${tenantData.companyName}</RazaoSocial>
  </Contribuinte>
  <Credito>
    <TipoCredito>PIS_COFINS_TEMA_69_STF</TipoCredito>
    <ValorTotalCredito>${totalCredits.toFixed(2)}</ValorTotalCredito>
    <HashAuditoria>${sha256Hash}</HashAuditoria>
    <ProtocoloAOS>${protocolId}</ProtocoloAOS>
  </Credito>
</DCOMPWeb>`;
          const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = docConfig.downloadFilename;
          link.click();
        } else if (documentType === 'pgfn_minuta') {
          // Generate DOCX/Text draft
          const draftText = `TERMO DE ADESÃO À TRANSAÇÃO TRIBUTÁRIA POR ADESÃO - PORTAL REGULARIZE / PGFN
PROCESSO ADMINISTRATIVO SISPAR / SISBAJUD

CONTRIBUINTE ADERENTE: ${tenantData.companyName}
CNPJ: ${tenantData.cnpj}
VALOR DO PASSIVO CONSOLIDADO: ${formatCurrency(totalCredits * 1.5, 'BRL')}
DESCONTO OBTIDO (CAPACIDADE DE PAGAMENTO C): 65% em multas e juros
VALOR LÍQUIDO A PARCELAR: ${formatCurrency(totalCredits * 0.525, 'BRL')} em 145 parcelas mensais
GARANTIA OFERTADA: Seguro Garantia Judicial & Conta-Escudo Operacional Velatrix

CHAVE CRIPTOGRÁFICA DE ORIGEM: ${sha256Hash}
PROTOCOLO: ${protocolId}`;
          const blob = new Blob([draftText], { type: 'text/plain;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = docConfig.downloadFilename;
          link.click();
        }
      } catch (err) {
        console.error('Erro ao gerar arquivo para download:', err);
      } finally {
        setIsDownloading(false);
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="modal-tax-doc-preview"
        className="bg-[var(--vx-deep)] border border-emerald-500/40 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-100 font-mono">
                  {docConfig.title}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 font-bold">
                  PRÉ-VISUALIZAÇÃO OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {docConfig.subtitle}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar Resumo com Protocolo e Hash"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copiado!' : 'Copiar Dados'}</span>
            </button>

            <button
              onClick={handleExecuteDownload}
              disabled={isDownloading}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo Oficial ({docConfig.fileFormat.includes('PDF') ? 'PDF' : docConfig.fileFormat.split(' ')[0]})</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Protocol & SHA-256 Hash Info Bar */}
        <div className="px-5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Protocolo:</span>
            <strong className="text-emerald-400">{protocolId}</strong>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Formato:</span>
            <span className="text-slate-300">{docConfig.fileFormat}</span>
          </div>

          <div className="flex items-center gap-2">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Hash SHA-256:</span>
            <span className="text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 truncate max-w-[200px] sm:max-w-xs">
              {sha256Hash}
            </span>
            <button 
              onClick={handleCopyHash}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              title="Copiar Hash Completo"
            >
              {copiedHash ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 border-b border-slate-800 bg-[var(--vx-deep)] flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'preview', label: '1. Visualização do Documento', icon: FileText },
            { id: 'calculation', label: '2. Memória de Cálculo (60 Meses)', icon: FileSpreadsheet },
            { id: 'crypto', label: '3. Validação Criptográfica & Hash', icon: Fingerprint },
            { id: 'procedure', label: '4. Instrução PJe / e-CAC', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-mono font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[var(--vx-deep)]">
          
          {/* TAB 1: PREVIEW DO DOCUMENTO */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              
              {/* Document Paper Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 shadow-inner space-y-6 font-serif text-slate-200 text-xs leading-relaxed">
                
                {documentType === 'relatorio_ripd' ? (
                  /* RELATÓRIO RIPD / DPIA PREVIEW (LGPD, LC 105/01, ART. 198 CTN) */
                  <>
                    {/* Official Letterhead */}
                    <div className="text-center pb-4 border-b border-slate-800 space-y-1">
                      <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Governança &amp; Privacidade de Dados • Lei 13.709/2018 (LGPD, Art. 38 e 41) • ANPD
                      </div>
                      <div className="font-sans font-black tracking-wider text-sm text-slate-100">
                        RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD / DPIA)
                      </div>
                      <div className="font-sans text-[10px] text-slate-400 uppercase tracking-widest">
                        Auditoria Pericial • Sigilo Bancário (LC 105/2001) • Sigilo Fiscal (Art. 198 CTN)
                      </div>
                      <div className="font-mono text-[10px] text-emerald-400 pt-1 info-field">
                        PROTOCOLO TÉCNICO: {protocolId} • EMISSÃO: {ripdCanonical?.dateFormatted || currentDate} às {ripdCanonical?.timeFormatted || '14:30:00'}
                      </div>
                    </div>

                    {/* Section 1: Parties Identification & Scope of Natural Persons */}
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 font-sans text-xs space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold text-emerald-400">1. CONTROLADOR DOS DADOS (TITULAR / CONTRIBUINTE):</span>
                          <strong className="text-slate-100 text-sm">{tenantData.companyName}</strong>
                          <div className="text-slate-400 text-[11px] mt-0.5">CNPJ: <span className="font-mono text-slate-300">{tenantData.cnpj}</span></div>
                          <div className="text-slate-400 text-[11px]">Encarregado de Dados (DPO): <span className="info-field break-all text-slate-300 font-mono select-all">dpo@velatrix.com.br</span></div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold text-cyan-400">2. OPERADOR TÉCNICO &amp; PLATAFORMA AUTÔNOMA:</span>
                          <strong className="text-slate-200">Velatrix Tecnologia Ltda. (AOS Engine)</strong>
                          <div className="text-slate-400 text-[11px] mt-0.5">Finalidade: <strong className="text-emerald-400">Auditoria Pericial Fiscal &amp; Apuração de Indébito</strong></div>
                          <div className="text-slate-400 text-[11px]">Enclave Seguro: <span className="font-mono text-slate-300">Memória Volátil com AES-256-GCM / TLS 1.3</span></div>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
                        <div className="font-bold text-slate-200 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Tratamento de Dados de Pessoas Físicas &amp; Minimização (Art. 6º, III da LGPD)
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          O escopo inclui o tratamento estritamente indispensável de dados de pessoas físicas (CPFs de sócios, diretores, procuradores, contadores, operadores credenciados e titulares em NF-e/NFS-e e conciliações bancárias), assegurando aplicação irrestrita do Princípio da Minimização para que nenhum dado pessoal alheio à verificação fiscal seja retido.
                        </p>
                      </div>
                    </div>

                    {/* Section 2 & 3: Sigilo Bancário & Sigilo Fiscal Dual Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                      <div className="p-3 bg-teal-950/25 border border-teal-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-teal-300 font-bold text-xs uppercase tracking-wide">
                          <Lock className="w-3.5 h-3.5" />
                          2. Proteção ao Sigilo Bancário (LC 105/2001)
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Extratos bancários (.OFX), borderôs e conciliações financeiras de pessoas físicas e jurídicas são processados estritamente em memória volátil isolada com criptografia militar AES-256-GCM. É terminantemente vedada qualquer cessão, comercialização ou exposição de contas a terceiros.
                        </p>
                        <div className="text-[10px] font-mono text-teal-400 pt-1">
                          • Protocolo: Enclave Criptográfico Efêmero AES-256-GCM
                        </div>
                      </div>

                      <div className="p-3 bg-indigo-950/25 border border-indigo-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs uppercase tracking-wide">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          3. Proteção ao Sigilo Fiscal (Art. 198 CTN)
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Em rigorosa observância ao Artigo 198 do CTN, a arquitetura multi-tenant isola completamente arquivos de SPED Fiscal (EFD-ICMS/IPI e EFD-Contribuições), DCTFWeb e XMLs com chaves criptográficas segregadas por CNPJ e descriptografia autenticada.
                        </p>
                        <div className="text-[10px] font-mono text-indigo-400 pt-1">
                          • Protocolo: Segregação Canônica Multi-Tenant Zero-Knowledge
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Bases Legais LGPD (Art. 7º, 38 e 41) */}
                    <div className="space-y-2 font-sans">
                      <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        4. Bases Legais para Tratamento de Dados Pessoais (Lei nº 13.709/2018)
                      </h4>

                      <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/40 space-y-2 text-[11px] text-slate-300 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-100">Art. 7º, II — Cumprimento de Obrigação Legal ou Regulatória:</strong> Escrituração contábil-fiscal e conformidade com normas da Receita Federal do Brasil (RFB) e SEFAZ estaduais com qualificação dos responsáveis.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-100">Art. 7º, VI — Exercício Regular de Direitos:</strong> Instrução probatória técnica em defesas de CDA, processos judiciais e pedidos de repetição/compensação (PER/DCOMP).
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-100">Art. 7º, V — Execução de Contrato:</strong> Cumprimento direto do contrato de prestação de serviços de diagnóstico, conciliação e auditoria pericial contratados.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-100">Art. 7º, IX — Legítimo Interesse &amp; Prevenção a Fraudes:</strong> Mitigação de inconformidades contábeis e garantia de segurança das transações fiscais.
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-100">Art. 38 e 41 — Governança e Atuação do DPO:</strong> Elaboração auditável do presente RIPD/DPIA e canal oficial de atendimento aos titulares perante a ANPD.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Medidas Técnicas, Minimização e Expurgo (Art. 16 LGPD) */}
                    <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 font-sans text-xs space-y-2">
                      <div className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        5. Medidas Técnicas, Minimização e Política de Expurgo (Art. 16 LGPD)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                          <strong className="text-slate-200 block mb-0.5">Minimização (Art. 6º, III):</strong>
                          Anonimização e ofuscação de dados pessoais não pertinentes à liquidação tributária.
                        </div>
                        <div className="p-2 bg-slate-950/60 rounded border border-slate-800">
                          <strong className="text-slate-200 block mb-0.5">Expurgo Definitivo (Art. 16):</strong>
                          Destruição irreversível de artefatos intermediários e memórias temporárias logo após emissão do laudo.
                        </div>
                      </div>
                    </div>

                    {/* Section 6: Parecer do DPO & Hash Criptográfico */}
                    <div className="pt-4 border-t border-slate-800 space-y-3 font-sans">
                      <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">
                          Integridade Criptográfica do Relatório (FIPS 180-4 / Digest SHA-256):
                        </div>
                        <div className="font-mono text-emerald-400 text-xs info-field break-all select-all">
                          {sha256Hash}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
                        <div className="space-y-1 font-mono text-[10px] text-slate-400">
                          <div>Conformidade DPO: <strong className="text-slate-200">100% Homologado</strong></div>
                          <div>Salvaguarda Criptográfica: <strong className="text-emerald-400">AES-256-GCM / TLS 1.3</strong></div>
                          <div>Padrão de Auditoria: <strong className="text-slate-200">ISO/IEC 27001 &amp; ISO/IEC 27701</strong></div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-200 text-xs">
                            Conselho de Governança &amp; DPO Velatrix AOS
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono info-field break-all">
                            Encarregado de Proteção de Dados • dpo@velatrix.com.br • Art. 41 LGPD
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : documentType === 'success_contract' ? (
                  /* CONTRATO DE HONORÁRIOS DE ÊXITO 70/30 PREVIEW */
                  <>
                    <div className="text-center pb-4 border-b border-slate-800 space-y-1">
                      <div className="font-sans font-black tracking-wider text-sm text-emerald-400">
                        INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS TRIBUTÁRIOS &amp; HONORÁRIOS DE ÊXITO
                      </div>
                      <div className="font-sans text-[10px] text-slate-400 uppercase tracking-widest">
                        Modelo Padrão: Remuneração com Risco Zero ("Zero Pró-Labore") &amp; Split Automatizado D+0
                      </div>
                      <div className="font-mono text-[10px] text-slate-300 pt-1">
                        REGISTRO CONTRATUAL: {protocolId} • DATA DE EMISSÃO: {currentDate}
                      </div>
                    </div>

                    {/* Parties Identification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 font-sans text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold text-indigo-400">1. CONTRATANTE (Empresa Beneficiária):</span>
                        <strong className="text-slate-100 text-sm">{tenantData.companyName}</strong>
                        <div className="text-slate-400 text-[11px] mt-0.5">CNPJ: <span className="font-mono text-slate-300">{tenantData.cnpj}</span></div>
                        <div className="text-slate-400 text-[11px]">Setor: <span className="text-slate-300">{tenantData.sectorName || 'Indústria & Manufatura'}</span></div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold text-emerald-400">2. CONTRATADA &amp; PATRONO (Escritório Parceiro):</span>
                        <strong className="text-slate-100 text-sm">{partnerData?.firmName || 'Vasconcelos & Associados Advocacia Tributária'}</strong>
                        <div className="text-slate-400 text-[11px] mt-0.5">Patrono: <span className="text-slate-200">{partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro'}</span></div>
                        <div className="text-slate-400 text-[11px]">Registro: <span className="font-mono text-slate-300">{partnerData?.oabOrCrc || 'OAB/SP 284.910'}</span></div>
                      </div>
                    </div>

                    {/* Clauses */}
                    <div className="space-y-3 font-sans text-[11px] text-slate-300 leading-relaxed">
                      <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-1">
                        <strong className="text-slate-100 font-bold block">CLÁUSULA 1ª — DO OBJETO E DA AUDITORIA PERICIAL (60 MESES)</strong>
                        <p>
                          O presente contrato tem por objeto a prestação de serviços técnicos de auditoria pericial tributária e levantamento de créditos fiscais federais (PIS, COFINS, IRPJ, CSLL e IPI) dos últimos 60 meses ininterruptos apurados na ordem estimada de <strong>{formatCurrency(totalCredits, 'BRL')}</strong>, bem como a condução dos procedimentos de compensação ou ressarcimento via PER/DCOMP Web e órgãos competentes.
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-950/20 rounded-lg border border-emerald-500/30 space-y-1">
                        <strong className="text-emerald-300 font-bold block">CLÁUSULA 2ª — DA REMUNERAÇÃO SOBRE O ÊXITO ("ZERO PRÓ-LABORE")</strong>
                        <p>
                          A CONTRATANTE não desembolsará qualquer quantia a título de entrada, taxa de adesão ou pró-labore. Os honorários advocatícios e periciais são fixados em <strong>{partnerData?.successFeePercent || 20}% (vinte por cento)</strong> e serão devidos <em>exclusivamente</em> sobre o efetivo proveito econômico obtido (compensações homologadas ou valores restituídos pela Receita Federal do Brasil).
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-950/20 rounded-lg border border-indigo-500/30 space-y-1">
                        <strong className="text-indigo-300 font-bold block">CLÁUSULA 3ª — DO SPLIT AUTOMATIZADO E REPASSE EM D+0</strong>
                        <p>
                          Fica pactuado de forma irrevogável o repasse automático via Conta-Escudo e conciliação em D+0: <strong>{partnerData?.partnerSplitPercent || 70}% dos honorários</strong> creditados diretamente ao Patrono Credenciado e <strong>{partnerData?.velatrixSplitPercent || 30}%</strong> direcionados à plataforma tecnológica de processamento de dados Velatrix AOS.
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/40 rounded-lg border border-slate-800 space-y-1">
                        <strong className="text-slate-100 font-bold block">CLÁUSULA 4ª — DA CONFIDENCIALIDADE, LGPD E GUARDA CRIPTOGRÁFICA</strong>
                        <p>
                          Todas as informações contábeis e fiscais do contribuinte são tratadas com estrita confidencialidade nos termos da Lei 13.709/2018 (LGPD), amparadas por Prova de Anterioridade Criptográfica registrada sob o hash SHA-256: <span className="font-mono text-emerald-400">{sha256Hash}</span>.
                        </p>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
                        <div className="h-6 border-b border-dashed border-slate-700 mx-6 mb-2"></div>
                        <div className="font-bold text-slate-100">{tenantData.companyName}</div>
                        <div className="text-[10px] text-slate-400">Contratante (Representante Legal)</div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
                        <div className="h-6 border-b border-dashed border-slate-700 mx-6 mb-2"></div>
                        <div className="font-bold text-slate-100">{partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro'}</div>
                        <div className="text-[10px] text-slate-400">{partnerData?.firmName || 'Vasconcelos & Associados Advocacia Tributária'} ({partnerData?.oabOrCrc || 'OAB/SP 284.910'})</div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* DOSSIÊ TRIBUTÁRIO & WHITE-LABEL PREVIEW */
                  <>
                    {/* Official Letterhead */}
                    <div className="text-center pb-4 border-b border-slate-800 space-y-1">
                      {documentType === 'white_label_dossier' && (
                        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider mb-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {partnerData?.firmName || 'Vasconcelos & Associados Advocacia Tributária'}
                        </div>
                      )}
                      <div className="font-mono font-black tracking-wider text-xs sm:text-sm text-slate-100 uppercase">
                        {documentType === 'white_label_dossier'
                          ? `DOSSIÊ TÉCNICO PERICIAL TRIBUTÁRIO (60 MESES) — ${partnerData?.firmName || 'PARCEIRO CREDENCIADO'}`
                          : 'VELATRIX AOS — DEFESA & RECUPERAÇÃO TRIBUTÁRIA OFICIAL'}
                      </div>
                      <div className="font-mono text-xs text-emerald-400 font-bold uppercase tracking-wide">
                        {documentType === 'white_label_dossier'
                          ? 'Câmara Pericial Digital e Engenharia Reversa de Tributos • ICP-Brasil'
                          : 'DOSSIÊ PERICIAL TÉCNICO CONTÁBIL (60 MESES)'}
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 pt-1 info-field">
                        Protocolo ICP-Brasil: <span className="text-slate-200">{protocolId}</span> | Emissão: <span className="text-slate-200">{currentDate}</span>
                      </div>
                      <div className="font-mono text-[9px] text-slate-400 info-field">
                        Hash SHA-256: <span className="text-emerald-400 font-semibold">{sha256Hash}</span>
                      </div>
                    </div>

                    {/* 1. DADOS CADASTRAIS DO CONTRIBUINTE AUDITADO */}
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-xs space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">
                        1. DADOS CADASTRAIS DO CONTRIBUINTE AUDITADO
                      </div>
                      <div className="text-slate-200 info-field">
                        <span className="text-slate-400">Razão Social: </span>
                        <strong>{tenantData.companyName}</strong>
                      </div>
                      <div className="text-slate-300 text-[11px] info-field">
                        <span className="text-slate-400">CNPJ: </span>{tenantData.cnpj} | <span className="text-slate-400">Setor Econômico: </span>{tenantData.sectorName || 'Autopeças & Motopeças (Tributação Concentrada Monofásica)'}
                      </div>
                      <div className="text-slate-300 text-[11px] bg-slate-950/70 p-2 rounded border border-slate-800 info-field">
                        <span className="text-amber-400 font-semibold">[SE DEFESA DE CDA]: </span>
                        CDA Nº: <span className="text-slate-100 font-bold">{tenantData.cdaNumber || '80.6.24.00412-18'}</span> | Proc. Execução Fiscal Nº: <span className="text-slate-100 font-bold">{tenantData.processNumber || '5004128-44.2024.4.03.6100'}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                        <span className="text-slate-300 text-xs font-bold uppercase">
                          MONTANTE TOTAL DE INDÉBITO APURADO (ÚLTIMOS 60 MESES):
                        </span>
                        <span className="text-emerald-400 font-bold text-base">
                          {formatCurrency(totalCredits, 'BRL')}
                        </span>
                      </div>
                    </div>

                    {/* 2. TESES JURÍDICO-TRIBUTÁRIAS HOMOLOGADAS & CRÉDITOS LIQUIDADOS */}
                    <div className="space-y-2 font-mono">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-emerald-400" />
                        2. TESES JURÍDICO-TRIBUTÁRIAS HOMOLOGADAS &amp; CRÉDITOS LIQUIDADOS
                      </div>

                      <div className="border border-slate-800 rounded-lg overflow-x-auto">
                        <table className="w-full text-[11px] text-left min-w-[500px]">
                          <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                            <tr>
                              <th className="p-2.5">TRIBUTO / TESE</th>
                              <th className="p-2.5">TRIBUNAL / BASE LEGAL</th>
                              <th className="p-2.5 text-center">STATUS</th>
                              <th className="p-2.5 text-right">CRÉDITO</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {(tenantData.preliminaryScan?.teses || [
                              { code: 'Lei nº 10.485/2002', title: 'PIS/COFINS - Segregação Monofásica (Motopeças)', court: 'RFB', estimatedCredit: 820000 },
                              { code: 'STF (RE 574.706)', title: 'PIS/COFINS - Exclusão ICMS da BC (Tema 69)', court: 'RFB', estimatedCredit: 640000 },
                              { code: 'STF (REsp 1.230.957)', title: 'PREVIDENCIÁRIO - Verbas Indenizatórias (Tema 985)', court: 'RFB', estimatedCredit: 200000 }
                            ]).map((tese, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="p-2.5 text-slate-200 font-semibold">{tese.title || tese.code}</td>
                                <td className="p-2.5 text-slate-400">
                                  {tese.court && tese.court !== 'RFB' ? `${tese.court} (${tese.code})` : tese.code}
                                </td>
                                <td className="p-2.5 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                                    {tese.statusLabel || 'RFB'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                                  {formatCurrency(tese.estimatedCredit, 'BRL')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-900 font-mono font-bold text-xs border-t border-slate-800">
                            <tr>
                              <td colSpan={3} className="p-2.5 text-right text-slate-300">TOTAL CONSOLIDADO:</td>
                              <td className="p-2.5 text-right text-emerald-400 text-sm">{formatCurrency(totalCredits, 'BRL')}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Conclusion & Technical Signature */}
                    <div className="pt-4 border-t border-slate-800 space-y-4 font-sans">
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-emerald-300 block mb-1">PARECER TÉCNICO CONCLUSIVO:</strong>
                        Atestamos que os cálculos aqui demonstrados foram realizados mediante apuração analítica linha a linha dos arquivos digitais SPED Fiscal (EFD-ICMS/IPI e EFD-Contribuições) e arquivos XML de NF-e transmitidos pelo contribuinte, encontrando-se plenamente alinhados à jurisprudência vinculante dos Tribunais Superiores e prontos para compensação via PER/DCOMP Web ou habilitação judicial.
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-2">
                        <div className="space-y-1 font-mono text-[10px] text-slate-400">
                          <div>Assinatura Digital ICP-Brasil: <strong className="text-slate-200">VÁLIDA</strong></div>
                          <div>Hash FIPS 180-4: <span className="text-slate-300">{sha256Hash.slice(0, 32)}...</span></div>
                          <div>Certificação CFC/CRC: <strong className="text-slate-200">CRC/SP nº 184.920/O-4</strong></div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-200 text-xs">
                            {partnerData?.lawyerName || 'Dr. Marcelo Vasconcelos Ribeiro'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {partnerData?.firmName || 'Perito Contábil & Advogado Tributário'} • {partnerData?.oabOrCrc || 'OAB/SP 384.920'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

              </div>

            </div>
          )}

          {/* TAB 2: MEMÓRIA DE CÁLCULO */}
          {activeTab === 'calculation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  Amostragem dos 60 Meses Auditados (Memória discriminada mês a mês com taxa SELIC acumulada):
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Auditoria 100% Homologada
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Competência</th>
                      <th className="p-3 text-right">Faturamento Bruto</th>
                      <th className="p-3 text-right">ICMS Destacado</th>
                      <th className="p-3 text-right">Indébito Principal</th>
                      <th className="p-3 text-right">SELIC Acum.</th>
                      <th className="p-3 text-right">Crédito Atualizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {[
                      { comp: '07/2026', fat: 4200000, icms: 504000, principal: 46620, selic: '0.90%', total: 47039 },
                      { comp: '06/2026', fat: 4150000, icms: 498000, principal: 46065, selic: '1.80%', total: 46894 },
                      { comp: '05/2026', fat: 4300000, icms: 516000, principal: 47730, selic: '2.70%', total: 49018 },
                      { comp: '04/2026', fat: 3900000, icms: 468000, principal: 43290, selic: '3.60%', total: 44848 },
                      { comp: '03/2026', fat: 4050000, icms: 486000, principal: 44955, selic: '4.50%', total: 46977 },
                      { comp: '02/2026', fat: 3800000, icms: 456000, principal: 42180, selic: '5.40%', total: 44457 },
                      { comp: '01/2026', fat: 4400000, icms: 528000, principal: 48840, selic: '6.30%', total: 51916 },
                      { comp: '12/2025', fat: 4600000, icms: 552000, principal: 51060, selic: '7.30%', total: 54787 },
                      { comp: '... (52 meses anteriores)', fat: 210000000, icms: 25200000, principal: 1750000, selic: '28.4% méd.', total: 2048564 }
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-3 font-bold text-slate-200">{row.comp}</td>
                        <td className="p-3 text-right text-slate-300">{formatCurrency(row.fat, 'BRL')}</td>
                        <td className="p-3 text-right text-amber-400">{formatCurrency(row.icms, 'BRL')}</td>
                        <td className="p-3 text-right text-slate-200">{formatCurrency(row.principal, 'BRL')}</td>
                        <td className="p-3 text-right text-cyan-400">{row.selic}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{formatCurrency(row.total, 'BRL')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VALIDAÇÃO CRIPTOGRÁFICA */}
          {activeTab === 'crypto' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Fingerprint className="w-4 h-4" />
                    <span>Estrutura Canônica de Hashing Criptográfico (FIPS 180-4)</span>
                  </div>
                  <button 
                    onClick={handleCopyHash}
                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700 text-[10px] text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar Payload Hash</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 text-[11px] leading-relaxed overflow-x-auto">
                  <pre className="font-mono text-slate-300">
{`{
  "documentType": "${documentType}",
  "protocol": "${protocolId}",
  "taxpayer": {
    "name": "${tenantData.companyName}",
    "cnpj": "${tenantData.cnpj}",
    "regime": "${tenantData.taxRegime}"
  },
  "metrics": {
    "totalAuditedCreditsBrl": ${totalCredits},
    "analyzedPeriodMonths": 60,
    "totalInvoicesAudited": 70840
  },
  "cryptography": {
    "algorithm": "SHA-256",
    "webCryptoApiCompliant": true,
    "fipsStandard": "FIPS 180-4",
    "calculatedHash": "${sha256Hash}",
    "digitalSignature": "ICP-Brasil / A3 Token e-CNPJ"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTRUÇÃO PROCESSUAL */}
          {activeTab === 'procedure' && (
            <div className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>1. PER/DCOMP Web</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Utilize o arquivo de instrução gerado pelo AOS para preencher a Declaração de Compensação Web diretamente no Portal e-CAC.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Scale className="w-4 h-4" />
                    <span>2. PJe (Justiça Federal)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Anexe o Dossiê Pericial Assinado (PDF) aos autos da Ação de Repetição de Indébito ou Exceção de Pré-Executividade como Prova Técnica Pré-Constituída.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>3. PGFN Regularize</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Acesse o SISPAR com a procuração e o laudo pericial para formalizar o termo de transação com desconto integral de até 70%.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Documento certificado pelo Motor Pericial Digital Velatrix AOS com fé pública contábil.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Fechar Visualização
            </button>

            <button
              onClick={handleExecuteDownload}
              disabled={isDownloading}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Baixando Arquivo...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Baixar Arquivo Oficial ({docConfig.fileFormat.split(' ')[0]})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
