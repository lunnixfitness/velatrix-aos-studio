import jsPDF from 'jspdf';
import { SupportedLanguage, SupportedCurrency } from '../types/aos';
import { formatCurrency } from '../utils/i18n';
import { SectorRiskProfile } from '../components/diagnosis/taxonomy';

export interface AgentActionItem {
  id: string;
  name: string;
  role: string;
  specificAction: string;
  targetVulnerability: string;
  invariant: string;
}

export interface AgentActionPlanPdfData {
  company: {
    name: string;
    cnpj: string;
    annualRevenue: number;
    dailyVolume: string;
    ebitdaMargin: number;
  };
  sector: SectorRiskProfile;
  agents: AgentActionItem[];
  financialRisk: {
    annualBleedBrl: number;
    downtimeDailyCostBrl: number;
    singleIncidentLossManualBrl: number;
    threeYearsInactionLossBrl: number;
    ebitdaPreservedBrl: number;
    ebitdaGainPercent: number;
  };
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const generateAgentActionPlanPdf = (data: AgentActionPlanPdfData): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // Styling Palette
  const navyBg: [number, number, number] = [7, 10, 19];
  const cardDark: [number, number, number] = [15, 23, 42];
  const primaryCyan: [number, number, number] = [0, 242, 255];
  const amberAccent: [number, number, number] = [255, 122, 0];
  const emeraldGreen: [number, number, number] = [0, 230, 118];
  const roseRed: [number, number, number] = [239, 68, 68];
  const textLight: [number, number, number] = [241, 245, 249];
  const textMuted: [number, number, number] = [148, 163, 184];

  let currentY = margin;

  // --- 1. HEADER BANNER ---
  doc.setFillColor(...navyBg);
  doc.roundedRect(margin, currentY, contentWidth, 26, 3, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('VELATRIX', margin + 6, currentY + 11);

  // Tagline
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...amberAccent);
  doc.text('SISTEMA OPERACIONAL AUTÔNOMO (AOS)', margin + 40, currentY + 9);

  doc.setFontSize(7.5);
  doc.setTextColor(...primaryCyan);
  doc.text('PLANO DE AÇÃO DO ENXAME DE AGENTES & RISCO DE INAÇÃO EXECUTIVA', margin + 40, currentY + 15);

  // Badge Confidential
  doc.setFillColor(...roseRed);
  doc.roundedRect(pageWidth - margin - 44, currentY + 6, 38, 6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('CONFIDENCIAL C-LEVEL', pageWidth - margin - 42, currentY + 10);

  // Timestamp
  const now = new Date();
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`EMISSÃO: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`, margin + 6, currentY + 22);
  doc.text('GOVERNANÇA: SECP256K1 MULTI-SIG 7/7', pageWidth - margin - 58, currentY + 22);

  currentY += 31;

  // --- 2. COMPANY & SECTOR CONTEXT CARD ---
  doc.setFillColor(...cardDark);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`EMPRESA: ${data.company.name.toUpperCase()}`, margin + 5, currentY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...textMuted);
  doc.text(`CNPJ: ${data.company.cnpj}  |  Setor: ${data.sector.name}  |  Volume: ${data.company.dailyVolume}`, margin + 5, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...emeraldGreen);
  doc.text(`Faturamento Anual: ${formatCurrency(data.company.annualRevenue, data.currency, data.language)}`, margin + 5, currentY + 16);
  doc.setTextColor(...primaryCyan);
  doc.text(`Margem EBITDA Declarada: ${data.company.ebitdaMargin}%`, margin + 80, currentY + 16);

  currentY += 25;

  // --- 3. FINANCIAL RISK OF INACTION (THE COST OF NOT ADOPTING AOS) ---
  doc.setFillColor(30, 15, 25);
  doc.setDrawColor(159, 18, 57);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...roseRed);
  doc.text('RESUMO DO RISCO FINANCEIRO DE NÃO TER A SOLUÇÃO (CUSTO DA INAÇÃO)', margin + 5, currentY + 6);

  const colWidth = (contentWidth - 10) / 4;

  // Box 1: Sangria Anual
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 3, currentY + 10, colWidth - 2, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('SANGRIA ANUAL ESTIMADA', margin + 5, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...roseRed);
  doc.text(`-${formatCurrency(data.financialRisk.annualBleedBrl, data.currency, data.language)}`, margin + 5, currentY + 22);
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text('Prejuízo operacional oculto', margin + 5, currentY + 29);

  // Box 2: Prejuízo por Incidente Crítico
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 3 + colWidth, currentY + 10, colWidth - 2, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('PREJUÍZO POR INCIDENTE', margin + 5 + colWidth, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(251, 146, 60);
  doc.text(`-${formatCurrency(data.financialRisk.singleIncidentLossManualBrl, data.currency, data.language)}`, margin + 5 + colWidth, currentY + 22);
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text('Deliberação manual lenta', margin + 5 + colWidth, currentY + 29);

  // Box 3: Custo Diário de Paralisação
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 3 + colWidth * 2, currentY + 10, colWidth - 2, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('CUSTO DIÁRIO PARADA', margin + 5 + colWidth * 2, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(244, 63, 94);
  doc.text(`-${formatCurrency(data.financialRisk.downtimeDailyCostBrl, data.currency, data.language)}`, margin + 5 + colWidth * 2, currentY + 22);
  doc.setFontSize(6);
  doc.setTextColor(203, 213, 225);
  doc.text('Ociosidade e multas D+0', margin + 5 + colWidth * 2, currentY + 29);

  // Box 4: Perda em 3 Anos
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin + 3 + colWidth * 3, currentY + 10, colWidth - 2, 24, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...textMuted);
  doc.text('PERDA EM 3 ANOS', margin + 5 + colWidth * 3, currentY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...roseRed);
  doc.text(`-${formatCurrency(data.financialRisk.threeYearsInactionLossBrl, data.currency, data.language)}`, margin + 5 + colWidth * 3, currentY + 22);
  doc.setFontSize(6);
  doc.setTextColor(...emeraldGreen);
  doc.text(`EBITDA +${formatCurrency(data.financialRisk.ebitdaPreservedBrl, data.currency, data.language)}`, margin + 5 + colWidth * 3, currentY + 29);

  currentY += 43;

  // --- 4. AGENTS ACTION PLAN SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...primaryCyan);
  doc.text(`PLANO DE ATUAÇÃO PRÁTICA DO ENXAME DE AGENTES NA ${data.company.name.toUpperCase()}`, margin, currentY);

  currentY += 4;

  data.agents.slice(0, 6).forEach((agent, index) => {
    // Check if we need a page break
    if (currentY > pageHeight - 32) {
      doc.addPage();
      currentY = margin;
    }

    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(30, 41, 59);
    doc.roundedRect(margin, currentY, contentWidth, 23, 1.5, 1.5, 'FD');

    // Number circle badge
    doc.setFillColor(0, 242, 255);
    doc.circle(margin + 5, currentY + 5.5, 3.2, 'F');
    doc.setTextColor(7, 10, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(`${index + 1}`, margin + 4, currentY + 7.5);

    // Agent Name & Role
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(agent.name, margin + 11, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...amberAccent);
    doc.text(`• ${agent.role}`, margin + 65, currentY + 5.5);

    // Target Vulnerability
    doc.setTextColor(...textMuted);
    doc.setFontSize(6.5);
    doc.text(`Foco na Dor: ${agent.targetVulnerability}`, margin + 11, currentY + 10);

    // Action Description (Wrapped text)
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(6.5);
    const actionLines = doc.splitTextToSize(`Ação Concreta: ${agent.specificAction}`, contentWidth - 16);
    doc.text(actionLines, margin + 11, currentY + 14.5);

    // Invariant
    doc.setTextColor(...emeraldGreen);
    doc.setFont('courier', 'bold');
    doc.setFontSize(5.5);
    doc.text(`INVARIANTE: ${agent.invariant}`, margin + 11, currentY + 21);

    currentY += 25;
  });

  // --- FOOTER ON ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(30, 41, 59);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...textMuted);
    doc.text('VELATRIX AOS • Autonomous Operating System • Documento Técnico de Proposta Executiva', margin, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 7);
  }

  // Save the PDF
  const sanitizedName = data.company.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`Plano_Acao_Agentes_VELATRIX_${sanitizedName}.pdf`);
};
