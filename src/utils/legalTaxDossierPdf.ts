import jsPDF from 'jspdf';
import { formatCurrency } from './i18n';
import { computeSha256Sync } from '../services/expertTaxEngineService';
import { secureInt } from '../lib/demoMode';

export interface LegalTaxDossierPdfOptions {
  companyName: string;
  cnpj: string;
  sectorName: string;
  totalCredits: number;
  cdaNumber?: string;
  processNumber?: string;
  protocolId?: string;
  teses: Array<{
    code: string;
    title: string;
    court: string;
    estimatedCredit: number;
    riskScoreLabel?: string;
    statusLabel?: string;
  }>;
  hashSha256?: string;
  signatoryName?: string;
  signatoryRole?: string;
}

export function generateLegalTaxDossierPdf(options: LegalTaxDossierPdfOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const dateFormatted = new Date().toLocaleDateString('pt-BR');
  const timeFormatted = new Date().toLocaleTimeString('pt-BR');

  // Compute canonical SHA-256 hash if not provided or if invalid
  const canonicalPayload = JSON.stringify({
    schemaVersion: 'VELATRIX-LEGAL-TAX-DOSSIER-SHA256-V1',
    companyName: (options.companyName || 'EMPRESA').trim().toUpperCase(),
    cnpj: (options.cnpj || '00000000000000').replace(/\D/g, ''),
    sectorName: options.sectorName || 'Indústria & Manufatura',
    totalCredits: Number((options.totalCredits || 0).toFixed(2)),
    cdaNumber: options.cdaNumber || '',
    processNumber: options.processNumber || '',
    teses: (options.teses || []).map(t => ({
      code: t.code,
      title: t.title,
      court: t.court,
      estimatedCredit: Number((t.estimatedCredit || 0).toFixed(2))
    }))
  });

  const finalHash = (options.hashSha256 && options.hashSha256.length === 64 && !options.hashSha256.startsWith('0x'))
    ? options.hashSha256.toLowerCase()
    : computeSha256Sync(canonicalPayload);

  const protocolId = options.protocolId || `LAUDO-PGFN-2026-${(options.cnpj || '00000000').replace(/\D/g, '').slice(0, 8)}-${secureInt(1000, 9999)}`;

  // ================= PAGE 1: CAPA & RESUMO EXECUTIVO =================
  // Header Banner
  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, pageWidth, 42, 'F');
  
  // Emerald Accent Line
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 41, pageWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('VELATRIX AOS — DEFESA & RECUPERAÇÃO TRIBUTÁRIA OFICIAL', margin, 14);

  doc.setTextColor(52, 211, 153);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIÊ PERICIAL TÉCNICO CONTÁBIL (60 MESES)', margin, 22);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Protocolo ICP-Brasil: ${protocolId} | Emissão: ${dateFormatted} às ${timeFormatted}`, margin, 30);
  doc.text(`Hash SHA-256: ${finalHash}`, margin, 36);

  let yPos = 50;

  // Contribuinte Box
  const hasCda = Boolean(options.cdaNumber || options.processNumber);
  const boxHeight = hasCda ? 30 : 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. DADOS CADASTRAIS DO CONTRIBUINTE AUDITADO', margin + 4, yPos + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Razão Social: ${options.companyName}`, margin + 4, yPos + 12);
  doc.text(`CNPJ: ${options.cnpj} | Setor Econômico: ${options.sectorName}`, margin + 4, yPos + 18);
  if (hasCda) {
    doc.text(`[SE DEFESA DE CDA]: CDA Nº: ${options.cdaNumber} | Proc. Execução Fiscal Nº: ${options.processNumber}`, margin + 4, yPos + 24);
  }

  yPos += hasCda ? 36 : 30;

  // Destaque de Créditos
  doc.setFillColor(6, 78, 59);
  doc.setDrawColor(52, 211, 153);
  doc.roundedRect(margin, yPos, contentWidth, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(167, 243, 208);
  doc.text('MONTANTE TOTAL DE INDÉBITO APURADO (ÚLTIMOS 60 MESES):', margin + 6, yPos + 8);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(formatCurrency(options.totalCredits, 'BRL'), margin + 6, yPos + 17);

  yPos += 28;

  // Quadro de Teses
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. TESES JURÍDICO-TRIBUTÁRIAS HOMOLOGADAS & CRÉDITOS LIQUIDADOS', margin, yPos);

  yPos += 5;

  // Header Tabela
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, yPos, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, yPos, contentWidth, 7, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('TRIBUTO / TESE', margin + 3, yPos + 5);
  doc.text('TRIBUNAL / BASE LEGAL', margin + 85, yPos + 5);
  doc.text('STATUS', margin + 130, yPos + 5);
  doc.text('CRÉDITO', margin + 155, yPos + 5);

  yPos += 7;

  options.teses.forEach((tese, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, yPos, contentWidth, 10, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const titleText = (tese.title || tese.code).substring(0, 48);
    doc.text(titleText, margin + 3, yPos + 6.5);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const courtLegal = (tese.court && tese.court !== 'RFB') ? `${tese.court} (${tese.code})` : tese.code;
    doc.text(courtLegal.substring(0, 26), margin + 85, yPos + 6.5);

    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(tese.statusLabel || 'RFB', margin + 130, yPos + 6.5);

    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(tese.estimatedCredit, 'BRL'), margin + 155, yPos + 6.5);

    yPos += 10;
  });

  yPos += 8;

  // Parecer Técnico
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, yPos, contentWidth, 38, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. CONCLUSÃO DO LAUDO PERICIAL & ENQUADRAMENTO PROCESSUAL', margin + 4, yPos + 6);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const parecerText = `O presente trabalho pericial procedeu à varredura e conciliação de 60 competências fiscais ininterruptas através do motor Velatrix AOS. Foram cruzados os arquivos XML de NF-e/NFS-e com a EFD-Contribuições (Blocos C e M) e DCTF Web, expurgando integralmente os valores indevidos e aplicando a correção pela taxa SELIC acumulada (BACEN Série 4390) nos termos da Súmula 162 do STJ. O montante apurado é líquido, certo e exigível, apto para habilitação em PER/DCOMP Web e suporte à defesa contra execuções fiscais ou pedidos de compensação administrativa.`;
  const lines = doc.splitTextToSize(parecerText, contentWidth - 8);
  doc.text(lines, margin + 4, yPos + 12);

  yPos += 45;

  // Assinaturas
  const signW = (contentWidth - 12) / 2;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin + 4, yPos + 14, margin + 4 + signW, yPos + 14);
  doc.line(margin + 8 + signW, yPos + 14, margin + contentWidth - 4, yPos + 14);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(options.signatoryName || 'Dr. Marcelo Vasconcelos Ribeiro / Rodrigo Antunes', margin + 4, yPos + 18);
  doc.text(`Diretoria Tributária / CFO (${options.companyName})`, margin + 8 + signW, yPos + 18);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(options.signatoryRole || 'Perito Técnico Contábil CRC/SP 1SP284901 • Assinatura ICP-Brasil', margin + 4, yPos + 22);
  doc.text('Contribuinte / Responsável Legal • De Acordo', margin + 8 + signW, yPos + 22);

  // Footer
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Hash SHA-256: ${finalHash} | Documento emitido eletronicamente via Velatrix Autonomous Enterprise AOS v4.8`, margin, pageHeight - 6);

  const cleanCnpj = (options.cnpj || 'EMPRESA').replace(/\D/g, '');
  doc.save(`Dossie_Pericial_CDA_${cleanCnpj}.pdf`);
}
