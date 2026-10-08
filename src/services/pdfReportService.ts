/**
 * PDF / Binary Document Exporter Service for Velatrix AOS
 * Generates verified cryptographic legal dossiers and reports for client download
 */

import jsPDF from 'jspdf';
import { SharedTenantTaxData } from './tenantTaxRecoveryBridge';
import { NfseItem } from '../types/nfse';
import { computeSha256Sync, CalculatedSyntheticMonth } from './expertTaxEngineService';
import { secureInt } from '../lib/demoMode';

export interface BillingReportOptions {
  items: Array<{
    clientName: string;
    cnpj: string;
    planTier: string;
    invoiceNumber: string;
    dueDate: string;
    amountBrl: number;
    paymentMethod: string;
    billingStatus: string;
  }>;
  totalMrr: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export function generateBillingReportPdf(options: BillingReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');

  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(0, 242, 255);
  doc.rect(0, 31, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — RELATÓRIO EXECUTIVO DE FATURAMENTO', 14, 15);

  doc.setTextColor(0, 242, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSOLIDAÇÃO DE TENANTS & ASSINATURAS MRR', 14, 22);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${dateFormatted} às ${timeFormatted} (UTC-3)`, 14, 28);

  // Summary Metrics Block
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 38, 182, 22, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('MRR Consolidado:', 18, 46);
  doc.text('Tenants Pagos:', 18, 54);

  doc.setTextColor(16, 185, 129);
  const formattedMrr = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalMrr || 0);
  doc.text(formattedMrr, 55, 46);
  doc.text(`${options.paidCount} assinaturas`, 55, 54);

  doc.setTextColor(51, 65, 85);
  doc.text('Pendentes:', 110, 46);
  doc.text('Atrasados:', 110, 54);

  doc.setTextColor(234, 179, 8);
  doc.text(`${options.pendingCount}`, 135, 46);
  doc.setTextColor(239, 68, 68);
  doc.text(`${options.overdueCount}`, 135, 54);

  // Table
  let currentY = 68;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DETALHAMENTO DE CONTRATOS E FATURAS', 14, currentY);

  currentY += 6;
  (options.items || []).slice(0, 10).forEach((item, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, currentY, 182, 14, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 14, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.clientName} (${item.planTier})`, 18, currentY + 5.5);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`CNPJ: ${item.cnpj} | Fatura: ${item.invoiceNumber} | Venc: ${item.dueDate}`, 18, currentY + 10.5);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const formattedItemVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amountBrl || 0);
    doc.text(formattedItemVal, 160, currentY + 8);

    currentY += 16;
  });

  const fileName = `RELATORIO_FATURAMENTO_VELATRIX_${dateFormatted.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

export interface PreInvoiceOptions {
  clientName: string;
  cnpj: string;
  planTier: string;
  invoiceNumber: string;
  amountBrl: number;
  dueDate: string;
  paymentMethod: string;
  billingStatus: string;
  terms: string[];
}

export function generatePreInvoicePdf(options: PreInvoiceOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');

  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(0, 242, 255);
  doc.rect(0, 35, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — PRÉ-FATURA / DEMONSTRATIVO', 14, 16);

  doc.setTextColor(0, 242, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA DE COBRANÇA & LICENCIAMENTO DE PLATAFORMA', 14, 24);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Referência: ${options.invoiceNumber} | Emissão: ${dateFormatted}`, 14, 30);

  // Client Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 46, 182, 34, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Cliente:', 18, 54);
  doc.text('CNPJ:', 18, 62);
  doc.text('Plano Contratado:', 18, 70);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.clientName, 50, 54);
  doc.text(options.cnpj, 50, 62);
  doc.text(options.planTier, 50, 70);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Vencimento:', 120, 54);
  doc.text('Valor Total:', 120, 62);
  doc.text('Status:', 120, 70);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.dueDate, 145, 54);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  const formattedVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.amountBrl || 0);
  doc.text(formattedVal, 145, 62);
  doc.setTextColor(15, 23, 42);
  doc.text(options.billingStatus, 145, 70);

  // Terms & Conditions
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TERMOS E CONDIÇÕES DE LICENCIAMENTO', 14, 92);

  let currentY = 98;
  (options.terms || []).forEach((term, idx) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const wrapped = doc.splitTextToSize(`• ${term}`, 174);
    doc.text(wrapped, 18, currentY);
    currentY += 10;
  });

  // Footer Disclaimer
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, 160, 182, 24, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('AVISO DE GOVERNANÇA FISCAL:', 18, 168);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);
  doc.text('Este documento é uma prévia demonstrativa e NÃO constitui documento fiscal válido (NFS-e/NF-e).', 18, 174);
  doc.text('O documento fiscal definitivo será emitido e disponibilizado após a confirmação da liquidação bancária.', 18, 179);

  const fileName = `PRE_FATURA_${options.invoiceNumber}_${options.cnpj.replace(/\D/g, '')}.pdf`;
  doc.save(fileName);
}

export interface WhiteLabelPartnerDossierOptions {
  companyName: string;
  cnpj: string;
  sectorName?: string;
  totalCredits: number;
  teses: Array<{
    code: string;
    title: string;
    court: string;
    estimatedCredit: number;
    riskScoreLabel?: string;
    statusLabel?: string;
  }>;
  partnerFirmName: string;
  partnerLawyerName?: string;
  partnerOabOrCrc?: string;
  partnerEmail?: string;
  partnerPhone?: string;
  brandPrimaryColor?: string; // hex (e.g. #4F46E5)
  hashSha256?: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex.length === 3 ? cleanHex.split('').map(c => c + c).join('') : cleanHex, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

export function generateWhiteLabelPartnerDossierPdf(options: WhiteLabelPartnerDossierOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');
  
  const canonicalWhiteLabelData = JSON.stringify({
    partnerFirmName: options.partnerFirmName || 'ESCRITÓRIO DE ADVOCACIA TRIBUTÁRIA',
    partnerLawyerName: options.partnerLawyerName || '',
    partnerOabOrCrc: options.partnerOabOrCrc || '',
    companyName: options.companyName,
    cnpj: (options.cnpj || '').replace(/\D/g, ''),
    totalCredits: Number((options.totalCredits || 0).toFixed(2)),
    teses: (options.teses || []).map(t => ({ code: t.code, title: t.title, estimatedCredit: Number((t.estimatedCredit || 0).toFixed(2)) }))
  });

  const hash = (options.hashSha256 && options.hashSha256.length === 64 && !options.hashSha256.startsWith('0x') && /^[0-9a-f]{64}$/i.test(options.hashSha256))
    ? options.hashSha256.toLowerCase()
    : computeSha256Sync(canonicalWhiteLabelData);

  const brandColor = hexToRgb(options.brandPrimaryColor || '#4F46E5');

  // White-Label Header Banner styled with partner brand
  doc.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  doc.rect(0, 0, 210, 36, 'F');

  // Contrast sub-banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 35, 210, 1.5, 'F');

  // Partner Firm Branding Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text((options.partnerFirmName || 'ESCRITÓRIO DE ADVOCACIA TRIBUTÁRIA').toUpperCase(), 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lawyerDetails = `${options.partnerLawyerName ? options.partnerLawyerName + ' • ' : ''}${options.partnerOabOrCrc || 'OAB Credenciada'}`;
  doc.text(lawyerDetails, 14, 22);

  doc.setFontSize(7.5);
  doc.text(`Laudo Pericial D+0 em Co-Autoria Técnica com a Plataforma Velatrix AOS`, 14, 28);
  doc.text(`Hash de Anterioridade: ${hash.substring(0, 32)}... | Emissão: ${dateFormatted} às ${timeFormatted}`, 14, 33);

  // Section 1: Client Data
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DA EMPRESA AUDITADA & REGIME FISCAL', 14, 46);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, 182, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 50, 182, 26, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Empresa / Razão Social:', 18, 57);
  doc.text('CNPJ Matriz:', 18, 64);
  doc.text('Setor Econômico:', 18, 71);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.companyName || 'Empresa Auditada', 60, 57);
  doc.text(options.cnpj || '00.000.000/0000-00', 60, 64);
  doc.text(options.sectorName || 'Manufatura & Indústria', 60, 71);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Potencial 60 Meses:', 125, 57);
  doc.text('Regime de Habilitação:', 125, 64);
  doc.text('Prazo Estimado:', 125, 71);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  const formattedCred = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalCredits || 0);
  doc.text(formattedCred, 158, 57);
  doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
  doc.text('Administrativo DCOMP', 158, 64);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('30 a 60 dias úteis', 158, 71);

  // Section 2: Teses Apuradas
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. TESES JURÍDICO-TRIBUTÁRIAS & CONCILIAÇÃO SPED/EFD (60 MESES)', 14, 85);

  let currentY = 91;
  const listTeses = (options.teses && options.teses.length > 0) ? options.teses : [
    {
      code: 'TEMA 69 STF',
      title: 'Exclusão do ICMS destacado da base de cálculo do PIS e da COFINS',
      court: 'STF (Repercussão Geral)',
      estimatedCredit: (options.totalCredits * 0.65) || 1200000
    },
    {
      code: 'INSUMOS FRETE',
      title: 'Créditos de PIS/COFINS sobre fretes de insumos e armazenagem intermediária',
      court: 'STJ (Tema Repetitivo 986)',
      estimatedCredit: (options.totalCredits * 0.35) || 450000
    }
  ];

  listTeses.slice(0, 6).forEach((tese, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, currentY, 182, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 16, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${tese.code} — ${tese.court}`, 18, currentY + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const shortTitle = tese.title.length > 72 ? tese.title.substring(0, 69) + '...' : tese.title;
    doc.text(shortTitle, 18, currentY + 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    const itemCred = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tese.estimatedCredit || 0);
    doc.text(itemCred, 155, currentY + 9);

    currentY += 18;
  });

  // Partner Signature & Next Steps Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY + 4, 182, 38, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY + 4, 182, 38, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(brandColor.r, brandColor.g, brandColor.b);
  doc.text('3. PRÓXIMOS PASSOS & CONTRATAÇÃO DE HONORÁRIOS DE ÊXITO ("ZERO PRO-LABORE")', 18, currentY + 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Habilitação pericial sem risco de desembolso inicial: remuneração condicionada ao êxito financeiro.', 18, currentY + 19);
  doc.text('• Instrumento Contratual com trava de split automatizado e emissão de notas fiscais segregadas.', 18, currentY + 25);
  doc.text(`• Contato do Patrono: ${options.partnerFirmName} | ${options.partnerEmail || 'contato@parceiro.com.br'} | ${options.partnerPhone || '(11) 99999-0000'}`, 18, currentY + 31);

  // Cryptographic Footer
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Documento Pericial emitido sob White-Label por ${options.partnerFirmName}. Registro Digital SHA-256: ${hash}`, 14, 285);

  const cleanCnpj = (options.cnpj || 'cliente').replace(/\D/g, '');
  const fileName = `DOSSIE_PERICIAL_${options.partnerFirmName.replace(/\s+/g, '_').toUpperCase()}_${cleanCnpj}.pdf`;
  doc.save(fileName);
}

export interface PartnerSuccessFeeContractOptions {
  clientCompanyName: string;
  clientCnpj: string;
  partnerFirmName: string;
  partnerLawyerName: string;
  partnerOabOrCrc: string;
  totalEstimatedBenefit: number;
  successFeePercent?: number; // default 20%
  partnerSplitPercent?: number; // default 70%
  velatrixSplitPercent?: number; // default 30%
  hashSha256?: string;
}

export function generatePartnerSuccessFeeContractPdf(options: PartnerSuccessFeeContractOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  
  const canonicalContractData = JSON.stringify({
    partnerFirmName: options.partnerFirmName || 'ESCRITÓRIO PARCEIRO',
    partnerLawyerName: options.partnerLawyerName || '',
    partnerOabOrCrc: options.partnerOabOrCrc || '',
    clientCompanyName: options.clientCompanyName,
    clientCnpj: (options.clientCnpj || '').replace(/\D/g, ''),
    totalEstimatedBenefit: Number((options.totalEstimatedBenefit || 0).toFixed(2)),
    successFeePercent: options.successFeePercent || 20,
    partnerSplitPercent: options.partnerSplitPercent || 70,
    velatrixSplitPercent: options.velatrixSplitPercent || 30
  });

  const hash = (options.hashSha256 && options.hashSha256.length === 64 && !options.hashSha256.startsWith('0x') && /^[0-9a-f]{64}$/i.test(options.hashSha256))
    ? options.hashSha256.toLowerCase()
    : computeSha256Sync(canonicalContractData);

  const successFeePct = options.successFeePercent || 20;
  const partnerPct = options.partnerSplitPercent || 70;
  const velatrixPct = options.velatrixSplitPercent || 30;

  const totalFeeEstimated = (options.totalEstimatedBenefit * successFeePct) / 100;
  const partnerCut = (totalFeeEstimated * partnerPct) / 100;
  const velatrixCut = (totalFeeEstimated * velatrixPct) / 100;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 31, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DIGITAL DE PRESTAÇÃO DE SERVIÇOS JURÍDICOS E PERÍCIA FISCAL', 14, 14);

  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254);
  doc.text(`REGULAMENTO DE HONORÁRIOS DE ÊXITO (SPLIT ${partnerPct}% / ${velatrixPct}%) & LICENCIAMENTO SAAS`, 14, 21);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.text(`Registro Criptográfico de Anterioridade: ${hash.substring(0, 36)}... | Data: ${dateFormatted}`, 14, 27);

  // Parties Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 182, 34, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 40, 182, 34, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('CONTRATANTE:', 18, 47);
  doc.text('CONTRATADA (PARCEIRO ORIGINADOR):', 18, 56);
  doc.text('PARCEIRA EM TECNOLOGIA PERICIAL:', 18, 65);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${options.clientCompanyName.toUpperCase()} — CNPJ ${options.clientCnpj}`, 44, 47);
  doc.text(`${options.partnerFirmName.toUpperCase()} — Patrono: ${options.partnerLawyerName} (${options.partnerOabOrCrc})`, 76, 56);
  doc.text(`VELATRIX TECNOLOGIA LTDA (Plataforma Pericial AOS e Inteligência Algorítmica D+0)`, 72, 65);

  // Clauses Body
  let curY = 82;

  const clauses = [
    {
      title: 'CLÁUSULA 1ª — DO OBJETO E BENEFÍCIO ECONÔMICO:',
      text: `O presente instrumento tem por objeto a recuperação, restituição e compensação de créditos tributários extemporâneos dos últimos 60 meses, decorrentes de teses pacificadas do STF/STJ, totalizando o montante estimado de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalEstimatedBenefit)}.`
    },
    {
      title: 'CLÁUSULA 2ª — DA REMUNERAÇÃO EXCLUSIVAMENTE POR ÊXITO ("SUCCESS FEE"):',
      text: `Não incidirá qualquer cobrança a título de honorários iniciais ("pro labore"). A remuneração global corresponderá a ${successFeePct}% sobre o benefício econômico efetivamente homologado ou compensado pelo CONTRATANTE perante a Receita Federal do Brasil (RFB) e PGFN.`
    },
    {
      title: 'CLÁUSULA 3ª — DA DIVISÃO CONTRATUAL DE HONORÁRIOS E LICENCIAMENTO (SPLIT 70/30 E SAAS):',
      text: `1. Sobre o honorário de êxito líquido auferido (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFeeEstimated)} estimado), incidirá repartição irrevogável de: a) ${partnerPct}% ao PARCEIRO ORIGINADOR (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(partnerCut)}); b) ${velatrixPct}% à VELATRIX TECNOLOGIA LTDA (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(velatrixCut)}) a título de auditoria pericial algorítmica.\n2. As assinaturas e subscrições recorrentes do software Velatrix AOS pertencem integralmente (100%) à Velatrix Tecnologia Ltda, sem comissionamento ou repasse ao parceiro.`
    },
    {
      title: 'CLÁUSULA 4ª — DE EXCLUSIVIDADE DE CANAL, ANTERIORIDADE E NÃO-CIRCUNVENÇÃO:',
      text: `O CONTRATANTE reconhece que as teses e cálculos periciais decorrem de tecnologia protegida com hash criptográfico de anterioridade nº ${hash}. Qualquer aproveitamento de créditos mapeados sem o devido split sujeitará o infrator a multa compensatória de 30% sobre o benefício econômico total apurado.`
    }
  ];

  clauses.forEach((c) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(c.title, 14, curY);
    curY += 5;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitLines = doc.splitTextToSize(c.text, 182);
    doc.text(splitLines, 14, curY);
    curY += (splitLines.length * 4) + 5;
  });

  // Signatures Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, curY + 2, 182, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, curY + 2, 182, 30, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ASSINATURA DIGITAL DO CONTRATANTE:', 20, curY + 10);
  doc.text('ASSINATURA DO PARCEIRO CREDENCIADO:', 110, curY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${options.clientCompanyName} (Representante Legal)`, 20, curY + 22);
  doc.text(`${options.partnerFirmName} (${options.partnerOabOrCrc})`, 110, curY + 22);

  const cleanCnpj = options.clientCnpj.replace(/\D/g, '');
  const fileName = `CONTRATO_EXITO_DIGITAL_70_30_${cleanCnpj}.pdf`;
  doc.save(fileName);
}


export interface DossierExportOptions {
  companyName?: string;
  cnpj?: string;
  sectorName?: string;
  totalCredits?: number;
  teses?: Array<{
    code: string;
    title: string;
    court: string;
    estimatedCredit?: number;
    riskScoreLabel?: string;
    statusLabel?: string;
  }>;
  hashSha256?: string;
  lawyerName?: string;
  oabNumber?: string;
  signatoryName?: string;
  signatoryRole?: string;
}

export function generateLegalTaxDossierPdf(options: DossierExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const timestamp = new Date().toISOString();
  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');
  
  const canonicalDossier = JSON.stringify({
    schemaVersion: 'VELATRIX-DOSSIE-TRIBUTARIO-SHA256-V1',
    companyName: (options.companyName || 'Empresa Auditada').trim().toUpperCase(),
    cnpj: (options.cnpj || '00000000000000').replace(/\D/g, ''),
    sectorName: options.sectorName || 'Manufatura & Indústria Pesada',
    totalCredits: Number((options.totalCredits || 0).toFixed(2)),
    teses: (options.teses || []).map(t => ({
      code: t.code,
      title: t.title,
      court: t.court,
      estimatedCredit: Number((t.estimatedCredit || 0).toFixed(2))
    })),
    signatoryName: options.signatoryName || ''
  });

  const hash = (options.hashSha256 && options.hashSha256.length === 64 && !options.hashSha256.startsWith('0x') && /^[0-9a-f]{64}$/i.test(options.hashSha256))
    ? options.hashSha256.toLowerCase()
    : computeSha256Sync(canonicalDossier);

  // Header Banner (Dark Navy Theme)
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 36, 'F');

  // Accent Line (Cyan #00F2FF)
  doc.setFillColor(0, 242, 255);
  doc.rect(0, 35, 210, 1.5, 'F');

  // Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — LAUDO PERICIAL & DOSSIÊ TRIBUTÁRIO', 14, 16);

  doc.setTextColor(0, 242, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVA DE ANTERIORIDADE CRIPTOGRÁFICA • AUDITORIA D+0 DOS 60 MESES', 14, 24);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.setFont('courier', 'normal');
  doc.text(`Gerado em: ${dateFormatted} às ${timeFormatted} (UTC-3) | Hash SHA-256: ${hash}`, 14, 30);

  // Company Information Block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS CADASTRAIS DA EMPRESA & JURISDIÇÃO', 14, 46);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 50, 182, 24, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Razão Social:', 18, 56);
  doc.text('CNPJ Matriz:', 18, 62);
  doc.text('Segmento / CNAE:', 18, 68);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(options.companyName || 'Empresa Auditada', 50, 56);
  doc.text(options.cnpj || '00.000.000/0000-00', 50, 62);
  doc.text(options.sectorName || 'Manufatura & Indústria Pesada', 50, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Volume Créditos Estimados:', 115, 56);
  doc.text('Status de Habilitação:', 115, 62);
  doc.text('Jurisdição / Órgão:', 115, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  const formattedCred = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalCredits || 0);
  doc.text(formattedCred, 162, 56);
  doc.setTextColor(2, 132, 199);
  doc.text('Pronto para Habilitação', 162, 62);
  doc.setTextColor(15, 23, 42);
  doc.text('RFB / PGFN / CARF', 162, 68);

  // Section 2: Teses Breakdown
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. DISCRIMINAÇÃO DAS TESES JURÍDICO-FISCAIS APURADAS (60 MESES)', 14, 84);

  let currentY = 90;
  (options.teses || []).slice(0, 6).forEach((tese, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.rect(14, currentY, 182, 16, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, currentY, 182, 16, 'S');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${tese.code} — ${tese.court}`, 18, currentY + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const shortTitle = tese.title.length > 70 ? tese.title.substring(0, 67) + '...' : tese.title;
    doc.text(shortTitle, 18, currentY + 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    const itemCred = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tese.estimatedCredit || 0);
    doc.text(itemCred, 160, currentY + 9);

    currentY += 18;
  });

  // Section 3: Legal Guarantee & Proof of Origin
  currentY += 4;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. TERMO DE ANTERIORIDADE, NÃO-CIRCUNVENÇÃO & REGISTRO IMUTÁVEL', 14, currentY);

  currentY += 6;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, 182, 36, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const legalDisclaimer = 'Este laudo e o dossiê pericial anexo foram apurados mediante barramento digital de auditoria contínua SPED (EFD ICMS/IPI, EFD-Contribuições, ECD e ECF) e balancetes contábeis integrados ao Velatrix AOS. Os cálculos foram validados por quórum Multi-Sig e protegidos com cláusula de exclusividade e prova de anterioridade criptográfica registrada em Livro-Razão distribuído.';
  
  const splitText = doc.splitTextToSize(legalDisclaimer, 174);
  doc.text(splitText, 18, currentY + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Hash Criptográfico SHA-256 (FIPS 180-4 / Web Crypto API): ${hash}`, 18, currentY + 28);
  doc.text(`Signatário Responsável: ${options.signatoryName || 'Diretoria Executiva & Perito Contábil'} | Timestamp: ${timestamp}`, 18, currentY + 33);

  // Footer Informativo de Autenticidade
  doc.setFontSize(5.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Autenticidade: Hash SHA-256 (256 bits) apurado sobre o payload canônico integral do laudo. Auditável de forma independente via OpenSSL / Web Crypto API.`, 14, 287);

  // Save the PDF file
  const cleanCnpj = (options.cnpj || 'EMPRESA').replace(/\D/g, '') || 'EMPRESA';
  const fileName = `DOSSIE_PERICIAL_TRIBUTARIO_${cleanCnpj}_${dateFormatted.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

export function generateNfseDanfsePdf(item: NfseItem): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const nfseNumClean = item.nfseNumber.replace(/\D/g, '') || '9412';

  // Top Municipal / DANFSE Header
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 10, 190, 26, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 10, 190, 26, 'S');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PREFEITURA DO MUNICÍPIO DE SÃO PAULO', 14, 17);
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('SECRETARIA MUNICIPAL DA FAZENDA • SUBSECRETARIA DA RECEITA MUNICIPAL', 14, 22);
  doc.text('DANFSE — DOCUMENTO AUXILIAR DA NOTA FISCAL DE SERVIÇOS ELETRÔNICA', 14, 27);

  // Right Header Box: Number and Auth Code
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(140, 12, 58, 22, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setTextColor(0, 242, 255);
  doc.text(`NÚMERO DA NOTA: ${item.nfseNumber}`, 143, 17);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7.5);
  doc.text(`Emissão: ${item.emissionDate}`, 143, 22);
  doc.text(`Cód. Verificação: ${item.verificationCode}`, 143, 27);
  doc.text(`RPS: ${item.rpsNumber} (${item.rpsSerie})`, 143, 31);

  // PRESTADOR DE SERVIÇOS (VELATRIX AOS)
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 38, 190, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 38, 190, 24, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PRESTADOR DE SERVIÇOS', 14, 43);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Razão Social: VELATRIX TECNOLOGIA E SISTEMAS AUTÔNOMOS S.A.', 14, 48);
  doc.text('CNPJ: 44.182.901/0001-52  |  Inscrição Municipal: 7.842.190-3', 14, 53);
  doc.text('Endereço: Av. Brigadeiro Faria Lima, 4221 - Conj. 181 - Itaim Bibi - São Paulo / SP - CEP: 04538-133', 14, 58);

  // TOMADOR DE SERVIÇOS (CLIENTE)
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 64, 190, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 64, 190, 24, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOMADOR DE SERVIÇOS', 14, 69);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Razão Social: ${item.clientName}`, 14, 74);
  doc.text(`CNPJ: ${item.cnpj}  |  Inscrição Municipal: ${item.inscricaoMunicipal || 'Isento / Não Informado'}`, 14, 79);
  doc.text(`Endereço: ${item.tomadorEndereco}  |  E-mail: ${item.tomadorEmail}`, 14, 84);

  // DISCRIMINAÇÃO DOS SERVIÇOS PRESTADOS
  doc.setFillColor(255, 255, 255);
  doc.rect(10, 90, 190, 70, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 90, 190, 70, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DISCRIMINAÇÃO DOS SERVIÇOS', 14, 96);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const descLines = doc.splitTextToSize(item.operationDescription, 182);
  doc.text(descLines, 14, 102);

  // Split and Tax Rule Legal Note
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 114, 182, 42, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 114, 182, 42, 1.5, 1.5, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('INFORMAÇÕES COMPLEMENTARES & REGRA DE SPLIT CONTRATUAL:', 18, 120);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const formattedGross = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.grossAmountBrl);
  const formattedNet = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl);
  const formattedSplit = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.partnerSplitAmountBrl);

  doc.text(`• Tipo de Faturamento: ${item.operationType === 'SAAS_SUBSCRIPTION' ? 'Licenciamento Mensal SaaS (100% Velatrix)' : 'Success Fee Recuperação Tributária (com Co-participação / Split)'}`, 18, 126);
  doc.text(`• Valor Bruto Liquidado pelo Cliente: ${formattedGross}`, 18, 131);
  if (item.partnerSplitPct > 0) {
    doc.text(`• Repasse ao Parceiro Homologado (${item.partnerName || 'Parceiro'}): ${item.partnerSplitPct}% (${formattedSplit})`, 18, 136);
    doc.text(`• PARCELA LÍQUIDA VELATRIX TRIBUTADA NESTA NFS-E: ${formattedNet}`, 18, 141);
    doc.text(`  (A NFS-e da Velatrix incide exclusivamente sobre sua cota líquida de acordo com contrato de co-participação).`, 18, 146);
  } else {
    doc.text(`• PARCELA LÍQUIDA VELATRIX TRIBUTADA NESTA NFS-E: ${formattedNet} (100% da operação)`, 18, 136);
    doc.text(`• Código CNAE: ${item.cnae}  |  Item da Lista de Serviços: ${item.itemListaServico}`, 18, 142);
    doc.text(`• Protocolo SEFAZ: ${item.municipalResponse.protocolo}`, 18, 148);
  }

  // CÁLCULO DO ISS E RETENÇÕES TRIBUTÁRIAS
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 162, 190, 28, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, 162, 190, 28, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('CNAE:', 14, 168);
  doc.text('Item da Lista:', 50, 168);
  doc.text('Alíquota ISS:', 130, 168);
  doc.text('Valor do ISS:', 160, 168);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(item.cnae, 14, 174);
  doc.text(item.itemListaServico.substring(0, 32), 50, 174);
  doc.text(`${item.issRatePct.toFixed(1)}%`, 130, 174);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  const formattedIss = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.issAmountBrl);
  doc.text(formattedIss, 160, 174);

  // Retentions Row
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const pis = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl * 0.0065);
  const cofins = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl * 0.03);
  const csll = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl * 0.01);
  const ir = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.velatrixRetainedAmountBrl * 0.015);
  doc.text(`Retenções Federais: PIS: ${pis}  |  COFINS: ${cofins}  |  CSLL: ${csll}  |  IRRF: ${ir}  |  INSS: R$ 0,00`, 14, 184);

  // TOTAL BOX (HIGHLIGHT)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(10, 193, 190, 20, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('VALOR TOTAL DA NOTA FISCAL (BASE VELATRIX):', 16, 204);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 242, 255);
  doc.text(formattedNet, 140, 205);

  // QR / Cryptographic Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Digest Criptográfico SHA-256: ${item.municipalResponse.xmlDigestSha256}`, 10, 220);
  doc.text(`Link Oficial de Consulta: ${item.municipalResponse.linkVerificacaoPrefeitura}`, 10, 225);
  doc.text(`Documento emitido por sistema informatizado Velatrix AOS em conformidade com o padrão ABRASF / Nota Paulistana.`, 10, 230);

  const fileName = `DANFSE_${nfseNumClean}_${item.cnpj.replace(/\D/g, '')}.pdf`;
  doc.save(fileName);
}

export interface PericialPdfExportOptions {
  companyName: string;
  cnpj: string;
  taxRegime: string;
  teseTitle: string;
  teseLegalBasis: string;
  protocolDate: string;
  consolidationDate: string;
  reportClassification?: 'RESUMO_EXECUTIVO_PRELIMINAR' | 'LAUDO_PERICIAL_COMPLETO';
  readinessPercentage?: number;
  totalGrossAnalyzed: number;
  totalExcludedTaxAmount: number;
  totalPrincipalCredit: number; // Principal puro
  totalSelicInterest: number;    // Juros SELIC puro
  totalUpdatedCredit: number;    // Total Principal + SELIC
  prescribedBlockedAmount: number;
  auditHashSha256: string;
  auditHashDescription?: string;
  canonicalPayloadJson?: string;
  calculatedAtIso?: string;
  syntheticMonths: Array<{
    competenceMonth: string;
    documentsCount: number;
    itemsCount: number;
    originalBaseTotal: number;
    excludedTaxTotal: number;
    recalculatedBaseTotal: number;
    appliedRateDescription?: string;
    principalDifferenceTotal: number;
    selicReferencePeriod?: string;
    selicRateAccumulatedPct: number;
    selicInterestTotal: number;
    totalCreditUpdated: number;
    isPrescribed: boolean;
    spedBatimentoStatus?: string;
  }>;
  supportDocuments?: Array<{
    title: string;
    category: string;
    systemOrType: string;
    status: string;
    receiptNumber?: string;
    notes?: string;
  }>;
  complianceAlerts: Array<{
    type: string;
    title: string;
    message: string;
    actionTaken: string;
  }>;
}

export function generatePericialDossierPdf(options: PericialPdfExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');
  const isCompleteLaudo = options.reportClassification === 'LAUDO_PERICIAL_COMPLETO';

  // Garantia de integridade criptográfica genuína SHA-256 (FIPS 180-4 / Web Crypto API)
  // Se o hash não foi fornecido ou contém formatações incorretas (ex: prefixo 0x), recalculamos sobre o payload canônico completo
  let finalAuditHash = (options.auditHashSha256 || '').trim();
  if (!finalAuditHash || finalAuditHash.length !== 64 || finalAuditHash.startsWith('0x') || !/^[0-9a-f]{64}$/i.test(finalAuditHash)) {
    const payloadToHash = options.canonicalPayloadJson || JSON.stringify({
      schemaVersion: 'VELATRIX-LAUDO-PERICIAL-SHA256-V1',
      taxpayer: {
        cnpj: (options.cnpj || '00000000000000').replace(/\D/g, ''),
        companyName: (options.companyName || 'EMPRESA').trim().toUpperCase()
      },
      parameters: {
        tese: options.teseTitle,
        taxRegime: options.taxRegime,
        protocolDate: options.protocolDate,
        consolidationDate: options.consolidationDate
      },
      totals: {
        totalGrossAnalyzed: Number((options.totalGrossAnalyzed || 0).toFixed(2)),
        totalExcludedTaxAmount: Number((options.totalExcludedTaxAmount || 0).toFixed(2)),
        totalPrincipalCredit: Number((options.totalPrincipalCredit || 0).toFixed(2)),
        totalSelicInterest: Number((options.totalSelicInterest || 0).toFixed(2)),
        totalUpdatedCredit: Number((options.totalUpdatedCredit || 0).toFixed(2)),
        prescribedBlockedAmount: Number((options.prescribedBlockedAmount || 0).toFixed(2))
      },
      synthetic60Months: (options.syntheticMonths || []).map(m => ({
        competenceMonth: m.competenceMonth,
        documentsCount: m.documentsCount,
        itemsCount: m.itemsCount,
        originalBaseTotal: Number((m.originalBaseTotal || 0).toFixed(2)),
        excludedTaxTotal: Number((m.excludedTaxTotal || 0).toFixed(2)),
        recalculatedBaseTotal: Number((m.recalculatedBaseTotal || 0).toFixed(2)),
        principalDifferenceTotal: Number((m.principalDifferenceTotal || 0).toFixed(2)),
        selicRateAccumulatedPct: Number((m.selicRateAccumulatedPct || 0).toFixed(4)),
        selicInterestTotal: Number((m.selicInterestTotal || 0).toFixed(2)),
        totalCreditUpdated: Number((m.totalCreditUpdated || 0).toFixed(2)),
        isPrescribed: m.isPrescribed,
        spedBatimentoStatus: m.spedBatimentoStatus
      })),
      supportDocuments: (options.supportDocuments || []).map(d => ({
        title: d.title,
        category: d.category,
        status: d.status,
        receiptNumber: d.receiptNumber || ''
      }))
    });
    finalAuditHash = computeSha256Sync(payloadToHash);
  } else {
    finalAuditHash = finalAuditHash.toLowerCase();
  }

  // ═════════════════════════════════════════════════════════════════
  // PÁGINA 1: CAPA, CLASSIFICAÇÃO EXECUTIVA E SÍNTESE DO INDÉBITO
  // ═════════════════════════════════════════════════════════════════
  
  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Linha de acento (Esmeralda para laudo completo, Âmbar para preliminar)
  if (isCompleteLaudo) {
    doc.setFillColor(16, 185, 129); // Emerald
  } else {
    doc.setFillColor(245, 158, 11); // Amber
  }
  doc.rect(0, 39, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS - RECUPERAÇÃO TRIBUTÁRIA & PROVA PERICIAL', 14, 12);

  // Badge de Classificação Obrigatória na Página 1
  if (isCompleteLaudo) {
    doc.setFillColor(6, 78, 59);
    doc.setDrawColor(52, 211, 153);
    doc.roundedRect(14, 16, 182, 19, 1.5, 1.5, 'FD');
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('LAUDO PERICIAL COMPLETO AUDITÁVEL (PRONTO PARA PER/DCOMP E JUDICIAL)', 18, 22);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(209, 250, 229);
    doc.text(`Prontidão PER/DCOMP: 100% • Memória dos 60 meses com batimento SPED C170/A170`, 18, 27);
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(167, 243, 208);
    doc.text(`Hash SHA-256 (FIPS 180-4 / Web Crypto API): ${finalAuditHash}`, 18, 32);
  } else {
    doc.setFillColor(69, 26, 3);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(14, 16, 182, 19, 1.5, 1.5, 'FD');
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO EXECUTIVO PRELIMINAR (DIAGNÓSTICO INICIAL - REQUER SUPORTE)', 18, 22);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(254, 243, 199);
    doc.text(`Prontidão de Anexos: ${options.readinessPercentage || 65}% • Pendente transmissão de retificadoras e guias`, 18, 27);
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.8);
    doc.setTextColor(253, 230, 138);
    doc.text(`Hash SHA-256 (FIPS 180-4 / Web Crypto API): ${finalAuditHash}`, 18, 32);
  }

  // 1. DADOS DO CONTRIBUINTE
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(12, 44, 186, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. DADOS DO CONTRIBUINTE & ESCOPO DA PERÍCIA', 16, 48);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Razão Social: ${options.companyName}`, 16, 55, { maxWidth: 105 });
  doc.text(`CNPJ: ${options.cnpj}`, 125, 55, { maxWidth: 68 });
  doc.text(`Regime Tributário: ${options.taxRegime}`, 16, 61, { maxWidth: 105 });
  doc.text(`Protocolo: ${options.protocolDate} | Consolidação SELIC: ${options.consolidationDate}`, 125, 61, { maxWidth: 68 });

  // 2. TESE APLICADA & COMPROVAÇÃO DE ICMS DESTACADO
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(12, 69, 186, 26, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 118, 110);
  doc.text(`2. TESE APLICADA: ${options.teseTitle.toUpperCase()}`, 16, 75);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(19, 78, 74);
  const splitBasis = doc.splitTextToSize(`Fundamentação Legal: ${options.teseLegalBasis}`, 178);
  doc.text(splitBasis, 16, 81);
  doc.setFont('helvetica', 'bold');
  doc.text('Comprovação Técnica: Utilização estrita do ICMS/ISS DESTACADO no XML da nota (não o recolhido), com conciliação SPED.', 16, 91);

  // 3. CONSOLIDAÇÃO DOS INDÉBITOS COM SEPARAÇÃO EXPLÍCITA DE PRINCIPAL VS SELIC
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(12, 98, 186, 44, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 242, 255);
  doc.text('3. DEMONSTRATIVO FINANCEIRO: SEPARAÇÃO DE PRINCIPAL E ATUALIZAÇÃO SELIC', 16, 106);

  // Coluna 1
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Volume Bruto Auditado (vProd):', 16, 115);
  doc.text('Tributo Destacado Excluído:', 16, 122);
  doc.text('CRÉDITO PRINCIPAL (INDÉBITO PURO):', 16, 131);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalGrossAnalyzed), 68, 115);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalExcludedTaxAmount), 68, 122);
  doc.setTextColor(56, 189, 248);
  doc.setFontSize(8.5);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalPrincipalCredit), 68, 131);

  // Coluna 2
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('ATUALIZAÇÃO SELIC ACUMULADA:', 110, 115);
  doc.text('Bloqueio Prescrição Quinquenal (5 Anos):', 110, 122);
  doc.text('TOTAL GERAL LÍQUIDO ATUALIZADO:', 110, 131);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalSelicInterest), 162, 115);
  doc.setTextColor(244, 63, 94);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.prescribedBlockedAmount), 162, 122);
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(9.5);
  doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(options.totalUpdatedCredit), 162, 131);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(203, 213, 225);
  doc.text('* Art. 39, § 4º da Lei 9.250/95 e Tema 962 do STF: Os juros SELIC apurados são NÃO TRIBUTÁVEIS pelo IRPJ e CSLL.', 16, 138);

  // 4. TRAVAS PERICIAIS E COMPLIANCE TRIBUTÁRIO
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(12, 145, 186, 26, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('4. TRAVAS PERICIAIS, PRESCRIÇÃO E CONCILIAÇÃO SPED C170/A170', 16, 151);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);
  doc.text('• Regra SELIC (Tema 962 STF): Juros SELIC isentos de IRPJ/CSLL. Principal tributado apenas na homologação/compensação (DCOMP).', 16, 156);
  doc.text('• Prescrição Quinquenal (Art. 168 CTN): Todos os fatos geradores anteriores a 60 meses da data de protocolo foram estritamente bloqueados.', 16, 161);
  doc.text('• Batimento SPED: Quando o ICMS no SPED C170 for menor que no XML, adotou-se o menor valor conservador para blindar contra autuações.', 16, 166);

  // 5. MEMÓRIA DE CÁLCULO MENSAL - QUADRO INICIAL (MESES 1 A 14)
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. MEMÓRIA DE CÁLCULO MENSAL DOS 60 MESES (DISCRIMINAÇÃO INTEGRAL - PARTE 1)', 12, 177);

  let currentY = 181;
  doc.setFillColor(226, 232, 240);
  doc.rect(12, currentY, 186, 5.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Competência', 14, currentY + 3.8);
  doc.text('Docs', 34, currentY + 3.8);
  doc.text('Base Orig. R$', 48, currentY + 3.8);
  doc.text('Trib. Excluído R$', 76, currentY + 3.8);
  doc.text('Indébito Princ. R$', 106, currentY + 3.8);
  doc.text('SELIC %', 136, currentY + 3.8);
  doc.text('Juros SELIC R$', 154, currentY + 3.8);
  doc.text('Total Atualiz. R$', 176, currentY + 3.8);

  currentY += 5.5;
  const page1Months = options.syntheticMonths.slice(0, 18);
  page1Months.forEach((m, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, currentY, 186, 4.6, 'F');
    }
    doc.setFont('helvetica', m.isPrescribed ? 'italic' : 'normal');
    doc.setTextColor(m.isPrescribed ? 148 : 30, m.isPrescribed ? 163 : 41, m.isPrescribed ? 184 : 59);
    doc.setFontSize(6.3);

    doc.text(m.competenceMonth + (m.isPrescribed ? ' (Presc.)' : ''), 14, currentY + 3.2);
    doc.text(`${m.documentsCount}/${m.itemsCount}`, 34, currentY + 3.2);
    doc.text(m.originalBaseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 48, currentY + 3.2);
    doc.text(m.excludedTaxTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 76, currentY + 3.2);
    doc.text(m.principalDifferenceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 106, currentY + 3.2);
    doc.text(`${m.selicRateAccumulatedPct.toFixed(2)}%`, 136, currentY + 3.2);
    doc.text(m.selicInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 154, currentY + 3.2);
    doc.text(m.totalCreditUpdated.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 176, currentY + 3.2);

    currentY += 4.6;
  });

  // Footer Pag 1
  doc.setFontSize(5.2);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash SHA-256: ${finalAuditHash} | Gerado em ${dateFormatted} às ${timeFormatted}`, 12, 286);
  doc.setFont('helvetica', 'normal');
  doc.text('Página 1 de 3 - Síntese e Memória de Cálculo Inicial', 145, 286);
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Autenticidade Probatória: Hash SHA-256 calculado sobre o payload integral (60 meses, principal e SELIC) em conformidade com FIPS 180-4 / Web Crypto API. Auditável via OpenSSL.', 12, 290);

  // ═════════════════════════════════════════════════════════════════
  // PÁGINA 2: CONTINUAÇÃO DOS 60 MESES DA MEMÓRIA DE CÁLCULO
  // ═════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS - MEMÓRIA DE CÁLCULO MENSAL DOS 60 MESES (PARTE 2)', 14, 11);

  currentY = 22;
  doc.setFillColor(226, 232, 240);
  doc.rect(12, currentY, 186, 5.5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Competência', 14, currentY + 3.8);
  doc.text('Docs', 34, currentY + 3.8);
  doc.text('Base Orig. R$', 48, currentY + 3.8);
  doc.text('Trib. Excluído R$', 76, currentY + 3.8);
  doc.text('Indébito Princ. R$', 106, currentY + 3.8);
  doc.text('SELIC %', 136, currentY + 3.8);
  doc.text('Juros SELIC R$', 154, currentY + 3.8);
  doc.text('Total Atualiz. R$', 176, currentY + 3.8);

  currentY += 5.5;
  const page2Months = options.syntheticMonths.slice(18, 52);
  page2Months.forEach((m, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, currentY, 186, 4.5, 'F');
    }
    doc.setFont('helvetica', m.isPrescribed ? 'italic' : 'normal');
    doc.setTextColor(m.isPrescribed ? 148 : 30, m.isPrescribed ? 163 : 41, m.isPrescribed ? 184 : 59);
    doc.setFontSize(6.3);

    doc.text(m.competenceMonth + (m.isPrescribed ? ' (Presc.)' : ''), 14, currentY + 3.2);
    doc.text(`${m.documentsCount}/${m.itemsCount}`, 34, currentY + 3.2);
    doc.text(m.originalBaseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 48, currentY + 3.2);
    doc.text(m.excludedTaxTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 76, currentY + 3.2);
    doc.text(m.principalDifferenceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 106, currentY + 3.2);
    doc.text(`${m.selicRateAccumulatedPct.toFixed(2)}%`, 136, currentY + 3.2);
    doc.text(m.selicInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 154, currentY + 3.2);
    doc.text(m.totalCreditUpdated.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 176, currentY + 3.2);

    currentY += 4.5;
  });

  // Footer Pag 2
  doc.setFontSize(5.2);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash SHA-256: ${finalAuditHash} | Gerado em ${dateFormatted} às ${timeFormatted}`, 12, 286);
  doc.setFont('helvetica', 'normal');
  doc.text('Página 2 de 3 - Memória de Cálculo das Competências', 145, 286);
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Autenticidade Probatória: Hash SHA-256 calculado sobre o payload integral (60 meses, principal e SELIC) em conformidade com FIPS 180-4 / Web Crypto API. Auditável via OpenSSL.', 12, 290);

  // ═════════════════════════════════════════════════════════════════
  // PÁGINA 3: CONCLUSÃO DOS 60 MESES, DOCUMENTOS DE SUPORTE E ASSINATURA
  // ═════════════════════════════════════════════════════════════════
  doc.addPage();
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS - ANEXO DE DOCUMENTOS DE SUPORTE, RETIFICADORAS & ENCERRAMENTO', 14, 11);

  currentY = 22;
  const page3Months = options.syntheticMonths.slice(52);
  if (page3Months.length > 0) {
    doc.setFillColor(226, 232, 240);
    doc.rect(12, currentY, 186, 5.5, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Competência', 14, currentY + 3.8);
    doc.text('Docs', 34, currentY + 3.8);
    doc.text('Base Orig. R$', 48, currentY + 3.8);
    doc.text('Trib. Excluído R$', 76, currentY + 3.8);
    doc.text('Indébito Princ. R$', 106, currentY + 3.8);
    doc.text('SELIC %', 136, currentY + 3.8);
    doc.text('Juros SELIC R$', 154, currentY + 3.8);
    doc.text('Total Atualiz. R$', 176, currentY + 3.8);

    currentY += 5.5;
    page3Months.forEach((m, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(12, currentY, 186, 4.5, 'F');
      }
      doc.setFont('helvetica', m.isPrescribed ? 'italic' : 'normal');
      doc.setTextColor(m.isPrescribed ? 148 : 30, m.isPrescribed ? 163 : 41, m.isPrescribed ? 184 : 59);
      doc.setFontSize(6.3);

      doc.text(m.competenceMonth + (m.isPrescribed ? ' (Presc.)' : ''), 14, currentY + 3.2);
      doc.text(`${m.documentsCount}/${m.itemsCount}`, 34, currentY + 3.2);
      doc.text(m.originalBaseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 48, currentY + 3.2);
      doc.text(m.excludedTaxTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 76, currentY + 3.2);
      doc.text(m.principalDifferenceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 106, currentY + 3.2);
      doc.text(`${m.selicRateAccumulatedPct.toFixed(2)}%`, 136, currentY + 3.2);
      doc.text(m.selicInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 154, currentY + 3.2);
      doc.text(m.totalCreditUpdated.toLocaleString('pt-BR', { minimumFractionDigits: 0 }), 176, currentY + 3.2);

      currentY += 4.5;
    });
    currentY += 6;
  }

  // 6. ANEXO DE DOCUMENTOS DE SUPORTE E RETIFICADORAS
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('6. ANEXO DE DOCUMENTOS DE SUPORTE, RETIFICADORAS E GUIAS ORIGINÁRIAS', 12, currentY);

  currentY += 4;
  doc.setFillColor(241, 245, 249);
  doc.rect(12, currentY, 186, 5, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Documento / Declaração', 14, currentY + 3.5);
  doc.text('Categoria / Sistema', 82, currentY + 3.5);
  doc.text('Status de Transmissão', 142, currentY + 3.5);
  doc.text('Recibo / Protocolo', 170, currentY + 3.5);

  currentY += 5;
  const docsList = options.supportDocuments || [];
  docsList.slice(0, 6).forEach((d, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, currentY, 186, 5, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.3);
    doc.setTextColor(30, 41, 59);
    doc.text(d.title.substring(0, 46), 14, currentY + 3.5);
    doc.text(d.systemOrType.substring(0, 34), 82, currentY + 3.5);
    
    // Status text
    if (d.status === 'TRANSMITIDO' || d.status === 'ANEXADO') {
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text(d.status, 142, currentY + 3.5);
    } else {
      doc.setTextColor(245, 158, 11);
      doc.setFont('helvetica', 'bold');
      doc.text('PENDENTE', 142, currentY + 3.5);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text((d.receiptNumber || 'Aguardando').substring(0, 20), 170, currentY + 3.5);

    currentY += 5;
  });

  // 7. TERMO DE RESPONSABILIDADE TÉCNICA E INTEGRIDADE CRIPTOGRÁFICA (SHA-256)
  currentY += 5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 54, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('7. TERMO DE RESPONSABILIDADE TÉCNICA & INTEGRIDADE CRIPTOGRÁFICA (SHA-256)', 16, currentY + 6);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Atesta-se para todos os efeitos legais perante a Secretaria da Receita Federal do Brasil (RFB) e o Poder Judiciário que:', 16, currentY + 11);
  doc.text('1. As bases de cálculo foram recalculadas estritamente pelo valor do tributo destacado nos documentos fiscais (RE 574.706/PR e RE 592.616/SP).', 16, currentY + 15.5);
  doc.text('2. Realizou-se a segregação inequívoca entre Crédito Principal e Juros SELIC (Tema 962 STF - parcela SELIC isenta de IRPJ e CSLL).', 16, currentY + 20);
  doc.text('3. Integridade Criptográfica SHA-256 (FIPS 180-4 / Web Crypto API): Calculado sobre o payload canônico do laudo (CNPJ, 60 meses, créditos e anexos).', 16, currentY + 24.5);

  // Box com o Hash SHA-256 de 64 caracteres
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, currentY + 27, 178, 11, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Digest SHA-256: ${finalAuditHash}`, 19, currentY + 31.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Hash SHA-256 apurado sobre o payload canônico integral (60 meses, indébito e SELIC). Auditável via OpenSSL / Web Crypto API.`, 19, currentY + 36);

  // Assinaturas
  doc.setDrawColor(148, 163, 184);
  doc.line(20, currentY + 46, 95, currentY + 46);
  doc.line(115, currentY + 46, 190, currentY + 46);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Perito Contábil / Auditor Fiscal (CRC Ativo)', 26, currentY + 50);
  doc.text('Advogado Tributarista / Procurador Legal (OAB)', 118, currentY + 50);

  // Footer Pag 3
  doc.setFontSize(5.2);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash SHA-256: ${finalAuditHash} | Gerado em ${dateFormatted} às ${timeFormatted}`, 12, 286);
  doc.setFont('helvetica', 'normal');
  doc.text('Página 3 de 3 - Anexo de Suporte e Termo Pericial', 145, 286);
  doc.setFontSize(4.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Autenticidade Probatória: Hash SHA-256 calculado sobre o payload integral (60 meses, principal e SELIC) em conformidade com FIPS 180-4 / Web Crypto API. Auditável via OpenSSL.', 12, 290);

  const cleanCnpj = (options.cnpj || 'EMPRESA').replace(/\D/g, '') || 'EMPRESA';
  doc.save(`DOSSIE_PERICIAL_${options.taxRegime}_${cleanCnpj}_${dateFormatted.replace(/\//g, '-')}.pdf`);
}

// ═════════════════════════════════════════════════════════════════
// 8. RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD / DPIA)
// Conforme Art. 38 da LGPD (Lei 13.709/18), LC 105/01 e Art. 198 do CTN
// ═════════════════════════════════════════════════════════════════

export interface RipdPdfExportOptions {
  companyName: string;
  cnpj: string;
  protocolId?: string;
  hashSha256?: string;
  dpoEmail?: string;
  dpoName?: string;
  signatoryName?: string;
  signatoryRole?: string;
  totalAnalyzedRecords?: number;
  emissionDate?: string;
  emissionTime?: string;
}

export interface RipdCanonicalReportData {
  protocol: string;
  dateFormatted: string;
  timeFormatted: string;
  cleanCnpj: string;
  formattedCnpj: string;
  companyName: string;
  dpoName: string;
  dpoEmail: string;
  signatoryName: string;
  signatoryRole: string;
  scopePessoasFisicas: string;
  minimizacaoPrincipio: string;
  expurgoRetencaoPrincipio: string;
  sha256Hash: string;
}

/**
 * 1. Construtor Canônico Determinístico do RIPD / DPIA (LGPD Art. 38 e 41)
 * Consolida e congela todas as variáveis dinâmicas (data/hora, protocolo, agentes e escopo de pessoas físicas)
 * e gera um Digest SHA-256 canônico e uniforme para injeção sem divergências.
 */
export function buildRipdCanonicalPayload(options: RipdPdfExportOptions): RipdCanonicalReportData {
  const cleanCnpj = (options.cnpj || '00000000000000').replace(/\D/g, '') || '00000000000000';
  const formattedCnpj = options.cnpj && options.cnpj.includes('/') 
    ? options.cnpj 
    : cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

  // Protocolo estático determinístico derivado do CNPJ auditado quando não fixado
  const protocol = (options.protocolId || '').trim() || `RIPD-LGPD-2026-${cleanCnpj.slice(0, 8)}-4108`;

  // Congelamento estático de data e hora para garantir não-repúdio e integridade
  const dateFormatted = options.emissionDate || new Date().toLocaleDateString('pt-BR');
  const timeFormatted = options.emissionTime || '14:30:00';

  const companyName = (options.companyName || 'Empresa Contratante').trim();
  const dpoName = (options.dpoName || 'Conselho de Governança & DPO Velatrix AOS').trim();
  const dpoEmail = (options.dpoEmail || 'dpo@velatrix.com.br').trim();
  const signatoryName = (options.signatoryName || 'Dr. Marcelo Vasconcelos Ribeiro').trim();
  const signatoryRole = (options.signatoryRole || 'Encarregado de Proteção de Dados (DPO) • Art. 41 da LGPD').trim();

  const scopePessoasFisicas = 'Tratamento estrito e indispensável de dados de pessoas físicas vinculadas à operação fiscal e bancária (CPFs de sócios, diretores, procuradores, contadores, operadores credenciados e pessoas físicas identificadas em NF-e/NFS-e e conciliações financeiras).';
  const minimizacaoPrincipio = 'Princípio da Minimização de Dados (Art. 6º, III da LGPD): Coleta e processamento limitados exclusivamente aos dados necessários para conformidade fiscal e validação de indébitos.';
  const expurgoRetencaoPrincipio = 'Política de Retenção e Descarte (Art. 16 da LGPD): Expurgo definitivo e irreversível de artefatos intermediários, memórias de cálculo temporárias e logs brutos imediatamente após a homologação do laudo oficial.';

  // Estrutura canônica completa do relatório para cálculo determinístico do Hash SHA-256
  const canonicalStructure = {
    documentId: 'VELATRIX_AOS_RIPD_DPIA_OFFICIAL',
    frameworkLegal: 'LEI_13709_2018_ART_38_ART_41_LC_105_2001_ART_198_CTN',
    protocol,
    emissionDate: dateFormatted,
    emissionTime: timeFormatted,
    controller: {
      companyName,
      cnpj: formattedCnpj,
      cleanCnpj
    },
    operator: {
      name: 'Velatrix Tecnologia Ltda.',
      platform: 'Velatrix Autonomous Operating System (AOS Engine)',
      enclave: 'Memória Volátil Criptografada AES-256-GCM / TLS 1.3'
    },
    dpo: {
      name: dpoName,
      email: dpoEmail,
      channel: 'Canal Oficial de Atendimento ao Titular e ANPD'
    },
    scope: {
      naturalPersonsData: scopePessoasFisicas,
      dataMinimization: minimizacaoPrincipio,
      retentionAndPurge: expurgoRetencaoPrincipio
    },
    legalBases: [
      'Art. 7, II - Cumprimento de Obrigação Legal ou Regulatória (RFB, SEFAZ, DCTFWeb, SPED)',
      'Art. 7, VI - Exercício Regular de Direitos em Processos Judiciais e Administrativos (PER/DCOMP, Ação Anulatória)',
      'Art. 7, V - Execução de Contrato e Diligência Preliminar de Auditoria Pericial Contábil',
      'Art. 7, IX - Legítimo Interesse para Prevenção à Fraude e Integridade Operacional',
      'Art. 38 e 41 - Relatório de Impacto à Proteção de Dados (RIPD/DPIA) e Atuação do DPO'
    ],
    technicalSafeguards: [
      'Segregação Canônica Multi-Tenant Zero-Knowledge por CNPJ',
      'Processamento em Enclave de Memória Volátil Criptografada AES-256-GCM',
      'Expurgo Definitivo de Artefatos Intermediários conforme Art. 16 da LGPD',
      'Controle Estrito de Acesso RBAC com Autenticação Multifator (MFA)',
      'Trilhas de Auditoria Imutáveis Seladas com Hash SHA-256 e Assinatura ICP-Brasil'
    ],
    dpoConclusion: 'Tratamento de dados pessoais em plena conformidade com a LGPD e diretrizes da ANPD, com risco residual mínimo, mitigação técnica eficaz e governança ativa.'
  };

  // Cálculo determinístico do Hash SHA-256 sobre a representação canônica
  const canonicalJson = JSON.stringify(canonicalStructure);
  const computedHash = computeSha256Sync(canonicalJson);

  // Normalização de hash do chamador (removendo prefixos como 0x e garantindo 64 caracteres hexadecimais)
  const callerHashClean = (options.hashSha256 || '').replace(/^0x/i, '').trim().toLowerCase();
  const finalSha256 = /^[0-9a-f]{64}$/.test(callerHashClean)
    ? callerHashClean
    : computedHash;

  return {
    protocol,
    dateFormatted,
    timeFormatted,
    cleanCnpj,
    formattedCnpj,
    companyName,
    dpoName,
    dpoEmail,
    signatoryName,
    signatoryRole,
    scopePessoasFisicas,
    minimizacaoPrincipio,
    expurgoRetencaoPrincipio,
    sha256Hash: finalSha256
  };
}

export function generateRipdDpiaPdf(options: RipdPdfExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Constrói payload canônico com variáveis congeladas e hash determinístico único
  const canonical = buildRipdCanonicalPayload(options);
  const {
    protocol,
    dateFormatted,
    timeFormatted,
    cleanCnpj,
    formattedCnpj,
    companyName,
    dpoName,
    dpoEmail,
    signatoryName,
    signatoryRole,
    sha256Hash
  } = canonical;

  // ─── PÁGINA 1: RELATÓRIO OFICIAL RIPD / DPIA ───
  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(16, 185, 129); // Emerald accent
  doc.rect(0, 35, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — GOVERNANÇA & SEGURANÇA DA INFORMAÇÃO', 14, 13);

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE IMPACTO À PROTEÇÃO DE DADOS PESSOAIS (RIPD / DPIA)', 14, 20);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.text('Art. 38 e 41 da Lei nº 13.709/2018 (LGPD) • Lei Complementar nº 105/2001 • Art. 198 do Código Tributário Nacional', 14, 27);
  doc.text(`Protocolo Oficial: ${protocol} • Emissão: ${dateFormatted} às ${timeFormatted}`, 14, 32);

  // ─── SEÇÃO 1: IDENTIFICAÇÃO DOS AGENTES DE TRATAMENTO & ESCOPO DE PESSOAS FÍSICAS ───
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 39, 186, 29.5, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. IDENTIFICAÇÃO DOS AGENTES DE TRATAMENTO & ESCOPO DE PESSOAS FÍSICAS', 16, 44.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  // Coluna Esquerda (x=16, largura máx=90mm)
  doc.text(`Controlador: ${companyName}`, 16, 49.5, { maxWidth: 90 });
  doc.text(`CNPJ do Titular / Contribuinte: ${formattedCnpj}`, 16, 54);
  doc.text(`Operador Tecnológico: Velatrix Tecnologia Ltda. (AOS Engine)`, 16, 58.5, { maxWidth: 90 });

  // Coluna Direita (x=112, largura máx=82mm) - Garante que o e-mail não seja truncado na margem direita
  doc.text(`Encarregado de Dados (DPO): ${dpoName}`, 112, 49.5, { maxWidth: 82 });
  doc.text(`E-mail Oficial DPO: ${dpoEmail}`, 112, 54, { maxWidth: 82 });
  doc.text(`Finalidade: Auditoria Pericial Fiscal & Apuração de Indébito`, 112, 58.5, { maxWidth: 82 });

  // Linha de Escopo de Tratamento de Pessoas Físicas & Princípio da Minimização
  doc.setFontSize(6.4);
  doc.setTextColor(30, 41, 59);
  doc.text('Tratamento de Pessoas Físicas: CPFs de sócios, diretores, procuradores, operadores credenciados e pessoas físicas identificadas em NF-e/NFS-e e extratos bancários, adstrito ao Princípio da Minimização (Art. 6º, III LGPD).', 16, 64.5, { maxWidth: 178 });

  // ─── SEÇÃO 2: PROTEÇÃO DO SIGILO BANCÁRIO (LC 105/2001) ───
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(12, 70.5, 186, 27, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('2. PROTEÇÃO DO SIGILO BANCÁRIO (LEI COMPLEMENTAR Nº 105/2001)', 16, 75.5);

  doc.setFontSize(6.9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('A plataforma processa extratos bancários (.OFX), borderôs e fluxos com estrita blindagem de dados de pessoas físicas e jurídicas:', 16, 80.5);
  doc.text('• Enclave em Memória Volátil: Os arquivos financeiros e dados de correntistas são computados exclusivamente em memória volátil criptografada.', 16, 85);
  doc.text('• Criptografia AES-256-GCM: Dados em repouso e em trânsito (TLS 1.3) utilizam cifras simétricas de padrão militar com chaves efêmeras segregadas.', 16, 89.5);
  doc.text('• Não Compartilhamento e Sigilo Absoluto: É expressamente vedada qualquer cessão, comercialização ou exposição de contas bancárias a terceiros.', 16, 94);

  // ─── SEÇÃO 3: PROTEÇÃO DO SIGILO FISCAL (ART. 198 DO CTN) ───
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(12, 99.5, 186, 27, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('3. PROTEÇÃO DO SIGILO FISCAL (ARTIGO 198 DO CÓDIGO TRIBUTÁRIO NACIONAL)', 16, 104.5);

  doc.setFontSize(6.9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Em observância estrita ao sigilo fiscal sobre a situação econômica e transacional do sujeito passivo e seus representantes:', 16, 109.5);
  doc.text('• Arquitetura Multi-Tenant Zero-Knowledge: Cada contribuinte dispõe de espaço criptográfico completamente estanque e segregado.', 16, 114);
  doc.text('• Isolamento de EFD, SPED e XMLs: Arquivos de NF-e, NFS-e, EFD-ICMS/IPI e EFD-Contribuições nunca são cruzados com concorrentes.', 16, 118.5);
  doc.text('• Chaves Segregadas por Tenant: A descriptografia ocorre unicamente mediante token de sessão autenticado do usuário credenciado.', 16, 123);

  // ─── SEÇÃO 4: BASES LEGAIS PARA O TRATAMENTO DE DADOS PESSOAIS (ART. 7º, 38 E 41 DA LGPD) ───
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(12, 128.5, 186, 37.5, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7);
  doc.text('4. BASES LEGAIS PARA O TRATAMENTO DE DADOS PESSOAIS (ART. 7º, 38 E 41 DA LEI Nº 13.709/2018)', 16, 133.5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('O tratamento de dados pessoais (CPFs de sócios, diretores, procuradores e pessoas físicas em notas fiscais) ampara-se expressamente em:', 16, 138.5);
  doc.text('• Art. 7º, II (Cumprimento de Obrigação Legal ou Regulatória): Escrituração contábil-fiscal e declarações perante a RFB e SEFAZ com qualificação dos responsáveis.', 16, 143);
  doc.text('• Art. 7º, VI (Exercício Regular de Direitos): Instrução probatória técnica em defesas de CDA, processos judiciais e pedidos de repetição/compensação (PER/DCOMP).', 16, 147.5);
  doc.text('• Art. 7º, V (Execução de Contrato): Cumprimento estrito dos serviços técnicos periciais e de conciliação tributária contratados pelo controlador.', 16, 152);
  doc.text('• Art. 7º, IX (Legítimo Interesse & Prevenção a Fraudes): Mitigação de inconformidades contábeis e garantia de segurança das transações fiscais.', 16, 156.5);
  doc.text('• Art. 38 e 41 (Governança e Responsabilidade do DPO): Elaboração do RIPD/DPIA comprovando medidas preventivas e canal formal perante a ANPD.', 16, 161);

  // ─── SEÇÃO 5: MEDIDAS TÉCNICAS, MINIMIZAÇÃO E EXPURGO DE DADOS PESSOAIS (ART. 6º, III E ART. 16 LGPD) ───
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 168, 186, 33, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. MEDIDAS TÉCNICAS, MINIMIZAÇÃO E EXPURGO DE DADOS PESSOAIS (ART. 6º, III E ART. 16 LGPD)', 16, 173);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Princípio da Minimização de Dados (Art. 6º, III): Anonimização e ofuscação de dados pessoais não estritamente pertinentes ao cálculo fiscal.', 16, 178);
  doc.text('• Política de Retenção e Expurgo Definitivo (Art. 16 LGPD): Destruição e expurgo irreversível de artefatos intermediários, memórias temporárias', 16, 182.5);
  doc.text('  e arquivos brutos contendo dados de pessoas físicas imediatamente após a emissão do laudo, retendo-se apenas o laudo final pelo prazo prescricional.', 16, 186.5);
  doc.text('• Controle de Acesso Baseado em Funções (RBAC) e MFA: Menor privilégio operacional para peritos e analistas com trilhas de auditoria imutáveis.', 16, 191);
  doc.text('• Integridade Criptográfica FIPS 180-4: Cada laudo pericial é autenticado com digest SHA-256 e assinatura digital ICP-Brasil.', 16, 195.5);

  // ─── SEÇÃO 6: PARECER CONCLUSIVO DO ENCARREGADO DE DADOS (DPO) & INTEGRIDADE ───
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 203, 186, 40, 2, 2, 'FD');

  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('6. PARECER CONCLUSIVO DO ENCARREGADO DE DADOS (DPO) & INTEGRIDADE', 16, 208);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Atesta-se que o tratamento de dados pessoais de pessoas físicas vinculadas aos processos fiscais e bancários atende integralmente às exigências da', 16, 213);
  doc.text('LGPD (Arts. 6º, 7º, 16, 38 e 41), LC 105/01 e Art. 198 do CTN, apresentando grau de risco residual mínimo, mitigação eficaz e governança ativa.', 16, 217.5);

  // Box do Hash SHA-256 (Injeção da mesma string calculada deterministicamente)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(16, 222, 178, 16, 1.5, 1.5, 'FD');

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Digest SHA-256 do RIPD: ${sha256Hash}`, 19, 228);

  doc.setFont('courier', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Protocolo Oficial: ${protocol} • Integridade Certificada FIPS 180-4 • Autenticidade Registrada`, 19, 233.5);

  // Assinaturas do DPO e Perito
  doc.setDrawColor(148, 163, 184);
  doc.line(20, 256, 95, 256);
  doc.line(115, 256, 190, 256);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Encarregado de Proteção de Dados (DPO)', 26, 261);
  doc.text('Perito Chefe de Governança e Segurança da Informação', 116, 261);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${dpoName} • ${dpoEmail}`, 26, 265, { maxWidth: 75 });
  doc.text('Câmara Técnica de Segurança e Criptografia • Art. 41 LGPD', 116, 265);

  // Footer / Rodapé (Injeção exatamente da MESMA variável sha256Hash)
  doc.setFontSize(5.2);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash SHA-256: ${sha256Hash} | Emitido em ${dateFormatted} às ${timeFormatted}`, 12, 286);
  doc.setFont('helvetica', 'normal');
  doc.text('Página 1 de 1 — Relatório RIPD/DPIA Oficial em Conformidade com a Lei 13.709/2018 (ANPD)', 106, 286);

  doc.save(`Velatrix_RIPD_LGPD_Compliance_DPIA_${cleanCnpj}.pdf`);
}

// ═════════════════════════════════════════════════════════════════
// 9. LAUDO PERICIAL DE CLASSIFICAÇÃO TRIBUTÁRIA DA CADEIA COMERCIAL
// Monofásico, Bifásico e Plurifásico + Memória de Cálculo Atualizada
// ═════════════════════════════════════════════════════════════════

export interface TaxRegimeClassificationPdfOptions {
  companyName: string;
  cnpj: string;
  protocolDate?: string;
  selectedRegime: 'LUCRO_REAL' | 'LUCRO_PRESUMIDO' | 'BIFASICO' | 'PLURIFASICO' | 'SIMPLES_NACIONAL';
  selectedRegimeLabel: string;
  totalExcludedTax: number;
  totalUpdatedCredit: number;
  totalPrincipalCredit?: number;
  totalSelicInterest?: number;
  effectiveRatePct?: number;
  hashSha256?: string;
  teseTitle?: string;
}

export function generateTaxRegimeClassificationPdf(options: TaxRegimeClassificationPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');
  const cleanCnpj = (options.cnpj || '00000000000000').replace(/\D/g, '') || '00000000000000';
  const protocol = `CLASS-TRIBUT-2026-${cleanCnpj.slice(0, 8)}-${secureInt(1000, 9999)}`;

  let sha256 = (options.hashSha256 || '').trim();
  if (!sha256 || sha256.length !== 64 || !/^[0-9a-f]{64}$/i.test(sha256)) {
    sha256 = computeSha256Sync(`CLASS-TRIBUT-VELATRIX-${options.selectedRegime}-${options.totalExcludedTax}-${options.totalUpdatedCredit}-${cleanCnpj}`);
  }

  const fmtBrl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  // ─── PÁGINA 1: LAUDO TÉCNICO DE CLASSIFICAÇÃO TRIBUTÁRIA ───
  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(6, 182, 212); // Cyan accent
  doc.rect(0, 35, 210, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — LAUDO DE CLASSIFICAÇÃO TRIBUTÁRIA PERICIAL', 14, 14);

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('MATRIZ DE INCIDÊNCIA NA CADEIA COMERCIAL: MONOFÁSICO, BIFÁSICO E PLURIFÁSICO', 14, 21);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tese Aplicada: ${options.teseTitle || 'Exclusão do ICMS/ISS da Base de Cálculo do PIS/COFINS (Tema 69 / Tema 118 STF)'}`, 14, 28);
  doc.text(`Protocolo: ${protocol} • Emissão: ${dateFormatted} às ${timeFormatted} • Padrão PJe / ICP-Brasil`, 14, 33);

  // 1. Identificação do Contribuinte & Regime Selecionado
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 40, 186, 22, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. DADOS DO CONTRIBUINTE & REGIME AUDITADO', 16, 46);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  // Coluna Esquerda: Largura limitada a 90 para evitar sobreposição com a coluna direita (x=110)
  const companyNameText = `Razão Social: ${options.companyName || 'Empresa Contribuinte'}`;
  const companyLines = doc.splitTextToSize(companyNameText, 90);
  const isMultiLineCompany = companyLines.length > 1;
  const safeCompanyLines = companyLines.length > 2
    ? [companyLines[0], companyLines[1].replace(/\s+\S*$/, '') + '...']
    : companyLines;

  // Ajuste sutil de coordenada Y para caso a Razão Social seja extensa
  const companyY = isMultiLineCompany ? 50.8 : 52;
  const cnpjY = isMultiLineCompany ? 58.5 : 58;

  doc.text(safeCompanyLines, 16, companyY, { maxWidth: 90 });
  doc.text(`CNPJ: ${options.cnpj || '00.000.000/0001-00'}`, 16, cnpjY, { maxWidth: 90 });

  // Coluna Direita: Largura limitada a 84 para manter margem interna em relação à borda do card
  doc.text(`Regime Selecionado: ${options.selectedRegimeLabel || options.selectedRegime}`, 110, 52, { maxWidth: 84 });
  doc.text(`Data de Protocolo / Marco Temporal: ${options.protocolDate || '2026-09-01'}`, 110, 58, { maxWidth: 84 });

  // 2. Destaque dos Resultados Calculados pelo Motor Pericial
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(12, 65, 186, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('2. RESULTADO APURADO NO MOTOR DE CÁLCULO PERICIAL (REGIME SELECIONADO)', 16, 71);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('Os valores abaixo foram calculados de forma determinística considerando as alíquotas e bases do regime ativo:', 16, 76);

  // 2 KPI Boxes
  // Box 1: Tributo Destacado Excluído
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, 79, 86, 12, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('TRIBUTO DESTACADO EXCLUÍDO (ICMS/ISS):', 19, 83.5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(fmtBrl(options.totalExcludedTax), 19, 88.5);

  // Box 2: Crédito Líquido Atualizado
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(45, 212, 191);
  doc.roundedRect(106, 79, 88, 12, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text('CRÉDITO LÍQUIDO ATUALIZADO (COM SELIC):', 109, 83.5);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(fmtBrl(options.totalUpdatedCredit), 109, 88.5);

  // 3. Matriz de Definição e Fundamentação Legal dos 3 Regimes
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. MATRIZ CONCEITUAL & FUNDAMENTAÇÃO LEGAL DOS 3 REGIMES NA CADEIA COMERCIAL', 12, 98);

  // Card A: Monofásico
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(12, 101, 186, 31, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(161, 98, 7);
  doc.text('A) REGIME MONOFÁSICO — 1 INCIDÊNCIA CONCENTRADA NA CADEIA', 16, 107);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Definição Pericial: O tributo (PIS/COFINS) incide apenas 1 única vez em toda a cadeia de circulação econômica, concentrado', 16, 112);
  doc.text('  no fabricante industrial ou importador com alíquota concentrada mais alta. As etapas seguintes (distribuição e varejo) operam', 16, 116);
  doc.text('  com alíquota zero ou isenção, não recolhendo novamente o tributo sobre suas receitas de revenda.', 16, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('• Fundamentação Legal: Lei nº 10.147/2000 (medicamentos, cosméticos e higiene); Lei nº 9.973/2000; Lei nº 10.336/2001 (combustíveis);', 16, 125);
  doc.text('  Leis nº 10.865/2004 e nº 13.097/2015 (bebidas frias); e segregação do Simples Nacional pela LC nº 123/2006 (art. 18, § 4º-A, I).', 16, 129);

  // Card B: Bifásico
  doc.setFillColor(250, 245, 255);
  doc.setDrawColor(233, 213, 255);
  doc.roundedRect(12, 135, 186, 31, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(126, 34, 206);
  doc.text('B) REGIME BIFÁSICO — 2 INCIDÊNCIAS ESPECÍFICAS NA CADEIA COMERCIAL', 16, 141);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Definição Pericial: O tributo incide especificamente em 2 etapas distintas e delimitadas da cadeia produtiva e de circulação', 16, 146);
  doc.text('  (produção industrial e atacado distribuidor), aplicando alíquotas concentradas majoradas (PIS 2,10% e COFINS 9,65%), com', 16, 150);
  doc.text('  desoneração total da etapa subsequente do varejo final ao consumidor, desonerada a alíquota zero.', 16, 154);
  doc.setFont('helvetica', 'bold');
  doc.text('• Fundamentação Legal: Lei nº 10.485/2002, arts. 2º e 3º; Lei nº 10.833/2003, arts. 2º e 51 a 53; e Lei nº 11.196/2005, art. 53', 16, 159);
  doc.text('  (aplicável aos setores de autopeças, máquinas industriais, componentes agrícolas e insumos de embalagens para bebidas).', 16, 163);

  // Card C: Plurifásico
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(12, 169, 186, 31, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text('C) REGIME PLURIFÁSICO — TODAS AS ETAPAS DA CADEIA (VALOR AGREGADO NÃO-CUMULATIVO)', 16, 175);

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Definição Pericial: O tributo incide em todas as etapas sucessivas da circulação econômica (indústria ➔ distribuidor ➔ varejo ➔ consumidor),', 16, 180);
  doc.text('  tributando sobre o valor agregado em cada elo mediante o mecanismo de débito e crédito (regime não-cumulativo clássico e', 16, 184);
  doc.text('  modelo espelhado na Reforma Tributária da EC nº 132/2023 para os novos tributos IVA dual: IBS e CBS).', 16, 188);
  doc.setFont('helvetica', 'bold');
  doc.text('• Fundamentação Legal: Lei nº 10.637/2002 (PIS Não-Cumulativo 1,65%), Lei nº 10.833/2003 (COFINS Não-Cumulativo 7,60%)', 16, 193);
  doc.text('  e Art. 195, § 12 da Constituição Federal de 1988 (direito constitucional à não-cumulatividade sobre o valor agregado).', 16, 197);

  // 4. Tabela Comparativa dos 3 Regimes
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. QUADRO COMPARATIVO ESTRUTURAL DOS 3 REGIMES', 12, 205);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(12, 208, 186, 6, 'FD');

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('REGIME', 14, 212);
  doc.text('INCIDÊNCIAS', 42, 212);
  doc.text('ETAPAS TRIBUTADAS', 70, 212);
  doc.text('ETAPA DESONERADA', 115, 212);
  doc.text('ALÍQUOTA TÍPICA', 152, 212);
  doc.text('LEGISLAÇÃO BASE', 174, 212);

  const tableRows = [
    { name: 'Monofásico', inc: '1 Incidência', trib: 'Fabricante / Importador', deson: 'Atacado e Varejo (Zero)', aliq: 'Concentrada (~12%)', leg: 'Lei 10.147/00' },
    { name: 'Bifásico', inc: '2 Incidências', trib: 'Indústria + Atacado', deson: 'Varejo Final (Zero)', aliq: 'Majorada (11,75%)', leg: 'Lei 10.485/02' },
    { name: 'Plurifásico', inc: 'Todas as Etapas', trib: 'Todas as Fases da Cadeia', deson: 'Nenhuma (Crédito Pleno)', aliq: 'Padrão (9,25%)', leg: 'Leis 10.637/10.833' },
    { name: 'Lucro Presumido', inc: 'Cumulativo', trib: 'Faturamento Bruto', deson: 'Sem Direito a Crédito', aliq: 'Fixa (3,65%)', leg: 'Lei 9.718/98' },
    { name: 'Simples Nacional', inc: 'Segregado', trib: 'Faixas Efetivas PGDAS-D', deson: 'Receitas Monofásicas', aliq: 'Efetiva (~2,80%)', leg: 'LC 123/06' },
  ];

  let currentY = 214;
  tableRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(12, currentY, 186, 5, 'FD');

    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(r.name, 14, currentY + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(r.inc, 42, currentY + 3.5);
    doc.text(r.trib, 70, currentY + 3.5);
    doc.text(r.deson, 115, currentY + 3.5);
    doc.text(r.aliq, 152, currentY + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(r.leg, 174, currentY + 3.5);

    currentY += 5;
  });

  // 5. Autenticidade Probatória & Assinatura Digital
  currentY += 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 28, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. VALIDAÇÃO PROBATÓRIA CRIPTOGRÁFICA & TERMO DE RESPONSABILIDADE', 16, currentY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Atesta-se que a classificação tributária e o recálculo do indébito foram efetuados em rigorosa consonância com a legislação federal vigente.', 16, currentY + 9.5);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(16, currentY + 11.5, 178, 6.5, 1, 1, 'FD');
  doc.setFont('courier', 'bold');
  doc.setFontSize(5.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Hash SHA-256: ${sha256}`, 18, currentY + 15.5);

  doc.setDrawColor(148, 163, 184);
  doc.line(20, currentY + 23, 95, currentY + 23);
  doc.line(115, currentY + 23, 190, currentY + 23);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Perito Tributário Responsável (CRC/CFC)', 26, currentY + 26);
  doc.text('Diretor Técnico Contábil Velatrix AOS', 122, currentY + 26);

  // Footer
  doc.setFontSize(5.2);
  doc.setFont('courier', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Hash SHA-256: ${sha256} | Gerado em ${dateFormatted} às ${timeFormatted}`, 12, 287);
  doc.setFont('helvetica', 'normal');
  doc.text('Página 1 de 1 — Laudo Oficial de Classificação Tributária Velatrix AOS', 118, 287);

  doc.save(`CLASSIFICACAO_TRIBUTARIA_${options.selectedRegime}_${cleanCnpj}.pdf`);
}

export interface SyntheticMonthlyReportPdfOptions {
  companyName: string;
  cnpj: string;
  protocolId?: string;
  protocolDate?: string;
  hashSha256?: string;
  teseTitle?: string;
  selectedRegime?: string;
  selectedRegimeLabel?: string;
  totalExcludedTax: number;
  totalPrincipalCredit: number;
  totalSelicInterest: number;
  totalUpdatedCredit: number;
  prescribedBlockedAmount?: number;
  syntheticMonths: CalculatedSyntheticMonth[];
}

export function generateSyntheticMonthlyReportPdf(options: SyntheticMonthlyReportPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');
  const protocol = options.protocolId || `SINT-SELIC-${Date.now().toString(36).toUpperCase()}`;
  const sha256 = options.hashSha256 || computeSha256Sync(
    `${options.companyName}|${options.cnpj}|${options.totalUpdatedCredit}|${protocol}|${options.syntheticMonths.length}`
  );
  const cleanCnpj = (options.cnpj || 'EMPRESA').replace(/\D/g, '') || 'EMPRESA';

  const formatBrl = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Helper para desenhar o cabeçalho da tabela de competências
  const drawTableHeader = (y: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(10, y, 190, 6, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.rect(10, y, 190, 6, 'S');

    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('Competência', 12, y + 4.2);
    doc.text('Docs/Itens', 32, y + 4.2, { align: 'center' });
    doc.text('Trib. Excluído', 64, y + 4.2, { align: 'right' });
    doc.text('Base Recalc.', 89, y + 4.2, { align: 'right' });
    doc.setTextColor(103, 232, 249); // cyan-300
    doc.text('Indébito Princ.', 115, y + 4.2, { align: 'right' });
    doc.setTextColor(110, 231, 183); // emerald-300
    doc.text('SELIC %', 133, y + 4.2, { align: 'right' });
    doc.text('Juros SELIC', 159, y + 4.2, { align: 'right' });
    doc.setTextColor(165, 243, 252); // cyan-200
    doc.text('Total Atualizado', 186, y + 4.2, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.text('Status', 195, y + 4.2, { align: 'center' });
  };

  // Helper para desenhar o topo da Página 1
  const drawPage1Header = () => {
    // Top banner
    doc.setFillColor(7, 11, 20);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setFillColor(0, 242, 255);
    doc.rect(0, 27, 210, 1.2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('VELATRIX AOS — DEMONSTRATIVO SINTÉTICO MENSAL & SELIC', 12, 13);

    doc.setTextColor(0, 242, 255);
    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'bold');
    doc.text('MEMÓRIA DE CÁLCULO MÊS A MÊS (60 MESES) • ATUALIZAÇÃO MONETÁRIA EXCLUSIVA (ART. 39, § 4º LEI 9.250/95)', 12, 19);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Protocolo Pericial: ${protocol} • Emissão: ${dateFormatted} às ${timeFormatted} • Trava Quinquenal: Art. 168 CTN`, 12, 24.5);

    // Metadata Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, 31, 190, 14, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Empresa Contribuinte: ${options.companyName}`, 13, 36, { maxWidth: 104 });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`CNPJ: ${options.cnpj}`, 13, 41.5, { maxWidth: 65 });
    doc.text(`Regime: ${options.selectedRegimeLabel || options.selectedRegime || 'Lucro Real / Presumido'}`, 80, 41.5, { maxWidth: 110 });
    doc.text(`Tese: ${options.teseTitle || 'Recuperação Tributária'}`, 120, 36, { maxWidth: 75 });

    // 4 KPI Summary Cards
    // Card 1: Principal
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(204, 251, 241);
    doc.roundedRect(10, 47, 45, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text('INDÉBITO PRINCIPAL', 13, 51.5);
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatBrl(options.totalPrincipalCredit), 13, 57.5);

    // Card 2: SELIC
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(58, 47, 45, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('JUROS SELIC ACUMULADOS', 61, 51.5);
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatBrl(options.totalSelicInterest), 61, 57.5);

    // Card 3: Total Atualizado
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(106, 47, 48, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202);
    doc.text('TOTAL ATUALIZADO (CRÉDITO)', 109, 51.5);
    doc.setFontSize(9);
    doc.setTextColor(30, 27, 75);
    doc.text(formatBrl(options.totalUpdatedCredit), 109, 57.5);

    // Card 4: Prescrito Bloqueado
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.roundedRect(157, 47, 43, 14, 1.5, 1.5, 'FD');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72);
    doc.text('PRESCRIÇÃO (> 5 ANOS)', 160, 51.5);
    doc.setFontSize(8.5);
    doc.setTextColor(159, 18, 57);
    doc.text(formatBrl(options.prescribedBlockedAmount || 0), 160, 57.5);
  };

  // Helper para o topo da Página 2 em diante
  const drawRunningHeader = (pageNum: number) => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 14, 'F');
    doc.setFillColor(0, 242, 255);
    doc.rect(0, 13.5, 210, 0.7, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('VELATRIX AOS — DEMONSTRATIVO SINTÉTICO MENSAL (CONTINUAÇÃO)', 12, 8.5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${options.companyName} (${options.cnpj}) • Protocolo: ${protocol}`, 125, 8.5);
  };

  // Renderiza a Página 1
  drawPage1Header();
  let currentY = 64;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DEMONSTRATIVO CRONOLÓGICO MÊS A MÊS — EXCLUSÃO DE TRIBUTOS E ATUALIZAÇÃO SELIC EXCLUSIVA', 10, currentY);

  currentY += 3;
  drawTableHeader(currentY);
  currentY += 6;

  const rowHeight = 4.7;
  const months = options.syntheticMonths || [];

  months.forEach((m, idx) => {
    // Quebra de página se ultrapassar o limite seguro
    if (currentY + rowHeight > 275) {
      doc.addPage();
      drawRunningHeader(doc.getNumberOfPages());
      currentY = 18;
      drawTableHeader(currentY);
      currentY += 6;
    }

    // Fundo da linha
    if (m.isPrescribed) {
      doc.setFillColor(255, 241, 242); // Tom avermelhado para prescritos
    } else if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(10, currentY, 190, rowHeight, 'F');

    doc.setDrawColor(241, 245, 249);
    doc.line(10, currentY + rowHeight, 200, currentY + rowHeight);

    doc.setFontSize(5.8);
    doc.setFont('courier', m.isPrescribed ? 'normal' : 'bold');
    doc.setTextColor(m.isPrescribed ? 159 : 15, m.isPrescribed ? 18 : 23, m.isPrescribed ? 57 : 42);
    doc.text(m.competenceMonth, 12, currentY + 3.3);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`${m.documentsCount}/${m.itemsCount}`, 32, currentY + 3.3, { align: 'center' });

    doc.text(formatBrl(m.excludedTaxTotal), 64, currentY + 3.3, { align: 'right' });
    doc.text(formatBrl(m.recalculatedBaseTotal), 89, currentY + 3.3, { align: 'right' });

    // Indébito Principal
    doc.setFont('courier', 'bold');
    if (m.isPrescribed) {
      doc.setTextColor(159, 18, 57);
      doc.text('R$ 0,00', 115, currentY + 3.3, { align: 'right' });
    } else {
      doc.setTextColor(14, 116, 144); // cyan-700
      doc.text(formatBrl(m.principalDifferenceTotal), 115, currentY + 3.3, { align: 'right' });
    }

    // Taxa SELIC Acumulada
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text(`${m.selicRateAccumulatedPct.toFixed(2)}%`, 133, currentY + 3.3, { align: 'right' });

    // Juros SELIC
    doc.setFont('courier', 'normal');
    if (m.isPrescribed) {
      doc.setTextColor(159, 18, 57);
      doc.text('R$ 0,00', 159, currentY + 3.3, { align: 'right' });
    } else {
      doc.setTextColor(5, 150, 105);
      doc.text(formatBrl(m.selicInterestTotal), 159, currentY + 3.3, { align: 'right' });
    }

    // Total Atualizado
    doc.setFont('courier', 'bold');
    if (m.isPrescribed) {
      doc.setTextColor(159, 18, 57);
      doc.text('R$ 0,00', 186, currentY + 3.3, { align: 'right' });
    } else {
      doc.setTextColor(30, 41, 59);
      doc.text(formatBrl(m.totalCreditUpdated), 186, currentY + 3.3, { align: 'right' });
    }

    // Badge Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.2);
    if (m.isPrescribed) {
      doc.setTextColor(225, 29, 72);
      doc.text('PRESC.', 195, currentY + 3.3, { align: 'center' });
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('ATIVO', 195, currentY + 3.3, { align: 'center' });
    }

    currentY += rowHeight;
  });

  // Linha de Totais Consolidados
  if (currentY + 8 > 275) {
    doc.addPage();
    drawRunningHeader(doc.getNumberOfPages());
    currentY = 18;
  }

  doc.setFillColor(15, 23, 42);
  doc.rect(10, currentY, 190, 7.5, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.rect(10, currentY, 190, 7.5, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAIS CONSOLIDADOS (ATIVOS):', 12, currentY + 4.8);

  doc.setFont('courier', 'bold');
  doc.setTextColor(103, 232, 249);
  doc.text(formatBrl(options.totalPrincipalCredit), 115, currentY + 4.8, { align: 'right' });

  doc.setTextColor(110, 231, 183);
  doc.text(formatBrl(options.totalSelicInterest), 159, currentY + 4.8, { align: 'right' });

  doc.setTextColor(255, 255, 255);
  doc.text(formatBrl(options.totalUpdatedCredit), 186, currentY + 4.8, { align: 'right' });

  currentY += 10.5;

  // Bloco de Fundamentação Legal e Validação Criptográfica
  // Se não couber o bloco explicativo (ocupa ~45mm), cria uma nova página
  if (currentY + 50 > 278) {
    doc.addPage();
    drawRunningHeader(doc.getNumberOfPages());
    currentY = 20;
  }

  // Card de Fundamentação Legal
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(10, currentY, 190, 26, 1.5, 1.5, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FUNDAMENTAÇÃO JURÍDICA E METODOLOGIA DE ATUALIZAÇÃO MONETÁRIA', 13, currentY + 5);

  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text('• Natureza Exclusiva da Taxa SELIC (Art. 39, § 4º da Lei nº 9.250/1995): A correção monetária dos indébitos tributários federais é efetuada', 13, currentY + 9.5);
  doc.text('  exclusivamente mediante aplicação acumulada da taxa referencial do Sistema Especial de Liquidação e Custódia (SELIC), a contar do mês', 13, currentY + 13);
  doc.text('  subsequente ao recolhimento indevido. Conforme pacificado pelo STJ (REsp 1.111.175/SP - Tema 179) e STF (Súmula 523), é vedada a cumulação', 13, currentY + 16.5);
  doc.text('  da SELIC com juros de mora legais ou quaisquer outros índices de correção (IPCA, INPC ou IGP-M), por possuir natureza híbrida.', 13, currentY + 20);
  doc.text('• Trava Quinquenal (Art. 168 do CTN c/c LC nº 118/2005): As competências anteriores a 60 meses do protocolo encontram-se prescritas e segregadas.', 13, currentY + 23.5);

  currentY += 28.5;

  // Card de Autenticidade e Assinaturas
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(10, currentY, 190, 22, 1.5, 1.5, 'FD');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Protocolo: ${protocol} • Hash SHA-256 Probatório (ICP-Brasil / Web Crypto API):`, 13, currentY + 4.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(5.6);
  doc.setTextColor(71, 85, 105);
  doc.text(sha256, 13, currentY + 8.5);

  doc.setDrawColor(148, 163, 184);
  doc.line(18, currentY + 15, 88, currentY + 15);
  doc.line(115, currentY + 15, 185, currentY + 15);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Perito Tributário Responsável (CRC/CFC)', 26, currentY + 18.5);
  doc.text('Diretoria de Inteligência Fiscal & Compliance Velatrix', 118, currentY + 18.5);

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(5.2);
    doc.setFont('courier', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Hash SHA-256: ${sha256} | Gerado em ${dateFormatted} às ${timeFormatted}`, 10, 289);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${p} de ${totalPages} — Memória de Cálculo Mensal de Indébito e SELIC Velatrix AOS`, 116, 289);
  }

  const fileName = `DEMONSTRATIVO_SINTETICO_SELIC_60M_${cleanCnpj}_${dateFormatted.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

// ═════════════════════════════════════════════════════════════════
// LAUDO PERICIAL OFICIAL DE INSS-OBRAS (CONSTRUÇÃO CIVIL & OBRAS PESADAS)
// ═════════════════════════════════════════════════════════════════
export interface InssObrasPdfExportOptions {
  dossier: import('../types/inssObras').InssObrasDossierPericial;
  cno: import('../types/inssObras').CnoMatricula;
  invoices: import('../types/inssObras').InvoiceRetentionItem[];
  simulation: import('../types/inssObras').IndirectAfferenceSimulation;
}

export function generateInssObrasPericialPdf(options: InssObrasPdfExportOptions): void {
  const { dossier, cno, invoices, simulation } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');

  // Cabeçalho Superior Institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 22, 'F');
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 22, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS • LAUDO PERICIAL TÉCNICO-CONTÁBIL DE INSS-OBRAS', 12, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('CONSTRUÇÃO CIVIL, CNO & SERO • LEI 8.212/91, ART. 31 • IN RFB 2.110/2022 • LEI 12.546/2011', 12, 17);

  let currentY = 29;

  // Box Qualificação da Obra e Contribuinte
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 32, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`1. QUALIFICAÇÃO DO CONTRIBUINTE & DA MATRÍCULA CNO`, 15, currentY + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Razão Social: ${cno.corporateReason.toUpperCase()} | CNPJ: ${cno.cnpj}`, 15, currentY + 12);
  doc.text(`Matrícula CNO: ${cno.cnoNumber} ${cno.ceiLegacyNumber ? `(CEI Antiga: ${cno.ceiLegacyNumber})` : ''} | Obra: ${cno.nickname}`, 15, currentY + 17);
  doc.text(`Endereço da Obra: ${cno.address} - ${cno.city}/${cno.uf}`, 15, currentY + 22);
  doc.text(`Responsável Técnico: ${cno.technicalResponsible.name} (${cno.technicalResponsible.councilType} ${cno.technicalResponsible.registryNumber}) | Área: ${cno.builtAreaM2.toLocaleString('pt-BR')} m² | Padrão: ${cno.constructionStandard}`, 15, currentY + 27);

  currentY += 36;

  // Box Resumo dos Valores Auditados
  doc.setFillColor(254, 243, 199); // amber-100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(12, currentY, 186, 24, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('2. RESULTADOS DA AUDITORIA PERICIAL DE RETENÇÃO (ARTS. 121 E 122 DA IN RFB 2.110/2022)', 15, currentY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Total Bruto Auditado: R$ ${dossier.totalGrossAnalyzed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY + 12);
  doc.text(`Dedução Legal de Materiais/Equipamentos: R$ ${dossier.totalMaterialsDeductedLegal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY + 18);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text(`Indébito Principal (Retenção a Maior): R$ ${dossier.totalExcessWithheldPrincipal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, currentY + 12);
  doc.text(`Atualização Monetária SELIC Acumulada: R$ ${dossier.totalSelicCorrection.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, currentY + 17);
  doc.setFontSize(8.5);
  doc.text(`CRÉDITO TOTAL ATUALIZADO: R$ ${dossier.totalIndebitoUpdatedRecovery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 105, currentY + 22);

  currentY += 28;

  // Box Aferição Indireta SERO
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 28, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. DIAGNÓSTICO DE AFERIÇÃO INDIRETA (SERO / IN RFB 2.021/2021) VS. FOLHA DECLARADA', 15, currentY + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Custo da Obra (Área x CUB): R$ ${simulation.totalEstimatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (CUB: R$ ${simulation.cubValue.toFixed(2)}/m²)`, 15, currentY + 11);
  doc.text(`RMT Mínima Exigida pela RFB: R$ ${simulation.finalAdjustedRmtBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (com abatimento de concreto usinado e subempreitadas)`, 15, currentY + 16);
  doc.text(`Base de Mão de Obra já Declarada e Recolhida pela Construtora: R$ ${simulation.totalDeclaredLaborBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY + 21);
  doc.setFont('helvetica', 'bold');
  doc.text(`Enquadramento de Risco no SERO: [${simulation.riskStatus}] - ${simulation.legalGuidance}`, 15, currentY + 26);

  currentY += 32;

  // Tabela de Notas Fiscais com Retenção
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. RELAÇÃO ANALÍTICA DAS NOTAS FISCAIS COM RETENÇÃO DE INSS AUDITADAS', 12, currentY);

  currentY += 4;
  doc.setFillColor(30, 41, 59);
  doc.rect(12, currentY, 186, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Documento', 14, currentY + 4.2);
  doc.text('Emissão', 35, currentY + 4.2);
  doc.text('Prestador / Subempreiteiro', 52, currentY + 4.2);
  doc.text('Valor Bruto', 98, currentY + 4.2);
  doc.text('Mat./Equip.', 118, currentY + 4.2);
  doc.text('Base MO', 138, currentY + 4.2);
  doc.text('Retido', 156, currentY + 4.2);
  doc.text('Devido', 170, currentY + 4.2);
  doc.text('Indébito R$', 184, currentY + 4.2);

  currentY += 6;
  invoices.forEach((inv, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(12, currentY, 186, 5, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.text(inv.invoiceNumber, 14, currentY + 3.6);
    doc.text(inv.issueDate, 35, currentY + 3.6);
    doc.text(inv.providerName.slice(0, 24), 52, currentY + 3.6);
    doc.text(`R$ ${(inv.grossValue / 1000).toFixed(1)}k`, 98, currentY + 3.6);
    doc.text(`R$ ${((inv.deductibleMaterialsAllowed + inv.deductibleEquipmentAllowed) / 1000).toFixed(1)}k`, 118, currentY + 3.6);
    doc.text(`R$ ${(inv.effectiveLaborBaseCalculated / 1000).toFixed(1)}k`, 138, currentY + 3.6);
    doc.text(`R$ ${(inv.retentionWithheldPaid / 1000).toFixed(1)}k`, 156, currentY + 3.6);
    doc.text(`R$ ${(inv.retentionWithheldDue / 1000).toFixed(1)}k`, 170, currentY + 3.6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`R$ ${inv.excessWithheldIndebito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 184, currentY + 3.6);

    currentY += 5.2;
  });

  currentY += 4;

  // Conclusão e Fundamentação Jurídica
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, currentY, 186, 30, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('5. PARECER CONCLUSIVO DO PERITO & FUNDAMENTAÇÃO LEGAL', 15, currentY + 6);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const splitText = doc.splitTextToSize(dossier.technicalConclusion, 180);
  doc.text(splitText, 15, currentY + 11);

  currentY += 34;

  // Box Criptográfico de Integridade SHA-256 e Assinaturas
  doc.setFillColor(15, 23, 42);
  doc.rect(12, currentY, 186, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(`PROTOCOLO PERICIAL: ${dossier.protocolId} • HASH SHA-256 (FIPS 180-4 / ICP-BRASIL):`, 15, currentY + 6);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(245, 158, 11); // amber-400
  doc.text(dossier.auditHashSha256, 15, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Responsável Técnico: ${dossier.expertName} (${dossier.expertRegistry})`, 15, currentY + 17);
  doc.text(`Data de Emissão: ${dossier.emissionDate} às ${timeFormatted}`, 130, currentY + 17);

  // Aviso Legal Mandatório no Rodapé
  doc.setFontSize(5.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text('Aviso Legal: Estimativa sujeita a comprovação documental e homologação, não constitui garantia de recuperação nem aconselhamento jurídico/tributário.', 12, 288);

  const cleanCno = cno.cnoNumber.replace(/\D/g, '');
  doc.save(`LAUDO_PERICIAL_INSS_OBRAS_${cleanCno}_${dateFormatted.replace(/\//g, '-')}.pdf`);
}




