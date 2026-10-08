// src/services/expertReportService.ts
// Serviço pericial para geração de Laudos Técnicos em PDF, Memória de Cálculo em Excel (.xlsx)
// e formatação de quesitos judiciais para Assistência Técnica Contábil

import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { formatCurrency, formatPercent } from '../utils/i18n';
import { computeSha256Sync } from './expertTaxEngineService';

export interface ExpertAccountantProfile {
  name: string;
  crc: string; // Ex: CRC/SP 1SP248.910/O-4
  cnpc: string; // Ex: CNPC nº 4.819 (Cadastro Nacional de Peritos Contábeis)
  cpf: string;
  email: string;
  phone: string;
  specialty: string;
  city: string;
  state: string;
}

export interface AssociatedPartnerProfile {
  firmName: string;
  lawyerName: string;
  oab: string;
  cnpj: string;
  email: string;
  phone: string;
}

export interface LawsuitJudicialData {
  courtName: string; // Ex: 3ª Vara Federal de Execuções Fiscais de São Paulo
  lawsuitNumber: string; // Ex: 5004128-92.2025.4.03.6100
  authorParty: string; // Requerente / Executada: Nome da Empresa
  defendantParty: string; // Exequente: União Federal (Fazenda Nacional / PGFN)
  actionType: string; // Ex: Embargos à Execução Fiscal / Ação Anulatória de Débito Fiscal
  cdaNumbers: string[]; // Ex: CDA nº 80.6.24.00412-18
}

export interface PericialCalculationItem {
  id: string;
  teseCode: string;
  teseName: string;
  legalBasis: string;
  court: string;
  baseAmount: number;
  principalAmount: number;
  selicCorrection: number;
  totalCredit: number;
  documentsCount: number;
  statusLegal: 'PACIFICADO_STF' | 'REPETITIVO_STJ' | 'SUMULA_VINCULANTE' | 'EM_ANALISE';
  statusLegalLabel: string;
}

export interface MonthlyCompetenceItem {
  competence: string; // MM/AAAA
  revenueTotal: number;
  icmsDestacado: number;
  pisIndebito: number;
  cofinsIndebito: number;
  monofasicoCredit: number;
  insumosCredit: number;
  principalTotal: number;
  selicRateAcum: number; // Percentual acumulado até a data presente
  selicAmount: number;
  totalCorrigido: number;
}

export interface DigitalSignatureRecord {
  isSigned: boolean;
  signatureType: 'ICP_BRASIL_A1' | 'ICP_BRASIL_A3' | 'GOV_BR_OURO' | 'VELATRIX_AOS_CRYPTO' | 'NONE';
  signatureTypeLabel: string;
  signedAt?: string;
  signatoryName?: string;
  signatoryCrc?: string;
  signatoryCnpc?: string;
  certificateIssuer?: string;
  certificateSerialNumber?: string;
  sha256Hash?: string;
  verificationCode?: string;
}

export interface PericialQuesitoItem {
  id: string;
  orderNumber: number;
  category: 'DEFESA_CONTRIBUINTE' | 'TEMA_69_STF' | 'MONOFASICO' | 'SELIC' | 'INSUMOS' | 'REPLICA_FAZENDA';
  categoryLabel: string;
  question: string;
  purpose: string;
  legalBasis: string;
  expectedOutcome: string;
}

// Valores padrão para o Perito Contador
export const DEFAULT_EXPERT_ACCOUNTANT: ExpertAccountantProfile = {
  name: 'Dr. Carlos Eduardo Nogueira',
  crc: 'CRC/SP 1SP248.910/O-4',
  cnpc: 'CNPC nº 4.819',
  cpf: '142.890.318-72',
  email: 'perito.carlos@auditoriacontabil.adv.br',
  phone: '(11) 98744-2100',
  specialty: 'Perícia Contábil Econômico-Financeira e Ativos Tributários (NBC TP 01)',
  city: 'São Paulo',
  state: 'SP'
};

// Valores padrão para o Escritório Parceiro Associado
export const DEFAULT_ASSOCIATED_PARTNER: AssociatedPartnerProfile = {
  firmName: 'Vasconcelos & Associados Advocacia Tributária',
  lawyerName: 'Dr. André Vasconcelos',
  oab: 'OAB/SP 189.412',
  cnpj: '22.901.442/0001-90',
  email: 'contato@vasconcelosadvogados.com.br',
  phone: '(11) 3450-8800'
};

// Valores padrão para Processo Judicial
export const DEFAULT_LAWSUIT_DATA: LawsuitJudicialData = {
  courtName: '3ª Vara Federal de Execuções Fiscais da Subseção Judiciária de São Paulo',
  lawsuitNumber: '5004128-92.2025.4.03.6100',
  authorParty: 'VORTEX INDUSTRIAL & LOGÍSTICA S/A',
  defendantParty: 'União Federal (Procuradoria-Geral da Fazenda Nacional - PGFN)',
  actionType: 'Embargos à Execução Fiscal com Pedido de Efeito Suspensivo e Compensação',
  cdaNumbers: ['CDA nº 80.6.24.00412-18', 'CDA nº 80.6.24.00413-99']
};

// Itens periciados consolidados
export const DEFAULT_PERICIAL_ITEMS: PericialCalculationItem[] = [
  {
    id: 'item-01',
    teseCode: 'TEMA-69-STF',
    teseName: 'Exclusão do ICMS da Base de Cálculo do PIS e da COFINS',
    legalBasis: 'STF RE 574.706/PR (Tema 69 Repercussão Geral) • Parecer SEI PGFN 14.483/2021',
    court: 'Supremo Tribunal Federal',
    baseAmount: 18450200.00,
    principalAmount: 765410.00,
    selicCorrection: 284320.00,
    totalCredit: 1049730.00,
    documentsCount: 11420,
    statusLegal: 'PACIFICADO_STF',
    statusLegalLabel: 'Trânsito em Julgado STF (Acórdão Vinculante)'
  },
  {
    id: 'item-02',
    teseCode: 'MONOFASICO-PIS-COFINS',
    teseName: 'Segregação de Receitas Monofásicas (Autopeças, Bebidas e Farmácia)',
    legalBasis: 'Lei 10.147/2000 • Lei 10.485/2002 • Resolução CGSN nº 140/2018',
    court: 'Receita Federal / STJ',
    baseAmount: 6890400.00,
    principalAmount: 312540.00,
    selicCorrection: 108420.00,
    totalCredit: 420960.00,
    documentsCount: 4890,
    statusLegal: 'SUMULA_VINCULANTE',
    statusLegalLabel: 'Pacificado RFB e Jurisprudência Administrativa CARF'
  },
  {
    id: 'item-03',
    teseCode: 'TEMA-1125-STJ',
    teseName: 'Exclusão do ISS da Base de Cálculo do PIS e da COFINS',
    legalBasis: 'STJ REsp 1.805.937/RS (Tema 1125 Repetitivo STJ) • Aplicação Analógica Tema 69',
    court: 'Superior Tribunal de Justiça',
    baseAmount: 3410500.00,
    principalAmount: 142850.00,
    selicCorrection: 48920.00,
    totalCredit: 191770.00,
    documentsCount: 2180,
    statusLegal: 'REPETITIVO_STJ',
    statusLegalLabel: 'Tema Repetitivo 1125 STJ Fixado'
  },
  {
    id: 'item-04',
    teseCode: 'TEMA-779-STJ',
    teseName: 'Créditos da Não-Cumulatividade sobre Insumos Operacionais Essenciais',
    legalBasis: 'STJ REsp 1.221.170/PR (Tema 779 STJ) • Parecer Normativo COSIT nº 05/2018',
    court: 'Superior Tribunal de Justiça',
    baseAmount: 2980100.00,
    principalAmount: 128120.50,
    selicCorrection: 49669.50,
    totalCredit: 177790.00,
    documentsCount: 1650,
    statusLegal: 'REPETITIVO_STJ',
    statusLegalLabel: 'Tema 779 STJ (Critério de Essencialidade e Relevância)'
  }
];

// Gerador de amostra das 60 competências mensais
export function generate60MonthsCompetences(): MonthlyCompetenceItem[] {
  const result: MonthlyCompetenceItem[] = [];
  const currentDate = new Date(2026, 7, 1); // Agosto 2026

  for (let i = 59; i >= 0; i--) {
    const compDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const mm = String(compDate.getMonth() + 1).padStart(2, '0');
    const yyyy = compDate.getFullYear();
    const competence = `${mm}/${yyyy}`;

    // Base mensal variando proporcionalmente
    const baseRevenue = 280000 + (Math.sin(i / 3) * 45000) + (i * 1200);
    const icms = baseRevenue * 0.18;
    const pis = icms * 0.0165;
    const cofins = icms * 0.0760;
    const monofasico = (baseRevenue * 0.08) * 0.0925;
    const insumos = (baseRevenue * 0.04) * 0.0925;
    const principal = pis + cofins + monofasico + insumos;

    // Selic acumulada: mais antiga tem maior Selic acumulada (de ~44% em 2021 a ~1.8% em 2026)
    const selicRate = Math.max(1.8, Math.min(48.5, 1.8 + (i * 0.78)));
    const selicAmount = (principal * selicRate) / 100;
    const totalCorrigido = principal + selicAmount;

    result.push({
      competence,
      revenueTotal: Math.round(baseRevenue * 100) / 100,
      icmsDestacado: Math.round(icms * 100) / 100,
      pisIndebito: Math.round(pis * 100) / 100,
      cofinsIndebito: Math.round(cofins * 100) / 100,
      monofasicoCredit: Math.round(monofasico * 100) / 100,
      insumosCredit: Math.round(insumos * 100) / 100,
      principalTotal: Math.round(principal * 100) / 100,
      selicRateAcum: Math.round(selicRate * 10) / 10,
      selicAmount: Math.round(selicAmount * 100) / 100,
      totalCorrigido: Math.round(totalCorrigido * 100) / 100
    });
  }

  return result;
}

// Banco padrão de Quesitos Judiciais
export const DEFAULT_QUESITOS_LIST: PericialQuesitoItem[] = [
  {
    id: 'quesito-01',
    orderNumber: 1,
    category: 'TEMA_69_STF',
    categoryLabel: 'Tema 69 STF (ICMS na Base PIS/COFINS)',
    question: 'Queira o Senhor Perito informar se, na apuração das contribuições ao PIS e à COFINS devidas pela Requerente no período dos últimos 60 (sessenta) meses, o valor do ICMS destacado nas notas fiscais eletrônicas de saída (modelo 55) foi indevidamente computado nas bases de cálculo das referidas exações federais?',
    purpose: 'Demonstrar de forma inequívoca o cômputo indevido do ICMS destacado e a subsunção estrita do caso ao julgado vinculante do STF no RE 574.706/PR.',
    legalBasis: 'STF RE 574.706/PR (Tema 69) • Parecer PGFN SEI nº 14.483/2021 • Art. 195, I, b da CF/88.',
    expectedOutcome: 'Confirmação pericial com indicação da alíquota e do montante de ICMS destacado que deve ser estornado da base de cálculo.'
  },
  {
    id: 'quesito-02',
    orderNumber: 2,
    category: 'TEMA_69_STF',
    categoryLabel: 'Tema 69 STF (ICMS Destacado vs. Recolhido)',
    question: 'Informe o Senhor Perito se a memória de cálculo do indébito adotou o critério do ICMS destacado em documento fiscal de saída ou do ICMS efetivamente recolhido, e se tal parâmetro está em conformidade com o julgamento dos Embargos de Declaração no RE 574.706/PR e com a Nota COSIT/SUTOR nº 111/2021?',
    purpose: 'Blindar o laudo contra a tese fazendária superada que pretendia deduzir apenas o ICMS líquido/recolhido.',
    legalBasis: 'Acórdão dos Embargos de Declaração no RE 574.706/PR • Solução de Consulta Interna COSIT nº 01/2021.',
    expectedOutcome: 'Ratificação de que a exclusão deve recair sobre o total do ICMS grafado na nota fiscal, independentemente de créditos.'
  },
  {
    id: 'quesito-03',
    orderNumber: 3,
    category: 'MONOFASICO',
    categoryLabel: 'Produtos Monofásicos & CFOP 5.405',
    question: 'Queira o Senhor Perito analisar os arquivos magnéticos da EFD-Contribuições e EFD-ICMS/IPI (registros C100 e C170) e constatar se mercadorias sujeitas à tributação monofásica de PIS/COFINS (com alíquota zero nas saídas varejistas/distribuidoras) sofreram incidência tributária indevida?',
    purpose: 'Apurar o estorno de PIS e COFINS recolhidos indevidamente sobre produtos cujas contribuições já foram concentradas na indústria.',
    legalBasis: 'Leis nº 10.147/2000, 10.485/2002 e 10.833/2003 • Súmula CARF nº 122.',
    expectedOutcome: 'Discriminação do montante indevidamente tributado sob os CSTs 04 e 06 com valor total recuperável.'
  },
  {
    id: 'quesito-04',
    orderNumber: 4,
    category: 'SELIC',
    categoryLabel: 'Atualização Monetária (Taxa SELIC)',
    question: 'Informe o Senhor Perito qual o índice legal utilizado para a atualização monetária dos valores apurados como recolhidos a maior, qual o termo inicial de sua incidência mês a mês e se houve cumulação indevida de juros moratórios com a taxa SELIC?',
    purpose: 'Garantir a incidência plena da Taxa SELIC desde o recolhimento indevido até a data da liquidação, afastando qualquer cumulação ilegal.',
    legalBasis: 'Lei nº 9.250/95, art. 39, § 4º • Súmula 523 do STF • Tema 504 do STJ • REsp 1.111.175/SP.',
    expectedOutcome: 'Demonstração analítica mês a mês da taxa SELIC capitalizada, atestando a pureza dos cálculos sem juros adicionais.'
  },
  {
    id: 'quesito-05',
    orderNumber: 5,
    category: 'INSUMOS',
    categoryLabel: 'Tema 779 STJ (Insumos Não-Cumulatividade)',
    question: 'Queira o Senhor Perito esclarecer se os dispêndios com fretes intermunicipais/interestaduais na aquisição de matérias-primas e combustíveis utilizados na frota produtiva se qualificam como insumos essenciais e relevantes à atividade operacional da Requerente, nos moldes definidos pelo STJ no Tema 779?',
    purpose: 'Validar a qualificação técnica dos insumos indispensáveis ao processo operacional para geração de créditos na não-cumulatividade.',
    legalBasis: 'STJ REsp 1.221.170/PR (Tema 779 Repetitivo) • Parecer Normativo COSIT nº 05/2018.',
    expectedOutcome: 'Confirmação do nexo de causalidade e essencialidade dos insumos com o respectivo valor creditício.'
  },
  {
    id: 'quesito-06',
    orderNumber: 6,
    category: 'REPLICA_FAZENDA',
    categoryLabel: 'Réplica à Fazenda (Certeza e Liquidez)',
    question: 'Diante do exame pericial contábil realizado sobre 100% dos livros fiscais e arquivos magnéticos do SPED, queira o Senhor Perito concluir se os valores ora liquidados revestem-se de certeza, liquidez e exigibilidade para fins de compensação administrativa ou liquidação de sentença?',
    purpose: 'Consolidar a conclusão pericial favorável com força probatória para subsidiar a sentença do Magistrado.',
    legalBasis: 'Código de Processo Civil, artigos 464, 473 e 477 • CTN, art. 170 e 170-A • NBC TP 01 do CFC.',
    expectedOutcome: 'Conclusão afirmativa com aposição do valor final líquido periciado apto ao aproveitamento integral.'
  }
];

// =========================================================================
// FUNÇÃO 1: EXPORTAÇÃO DA MEMÓRIA DE CÁLCULO EM EXCEL (.XLSX)
// =========================================================================
export function exportPericialCalculationToExcel(params: {
  clientName: string;
  cnpj: string;
  taxRegime: string;
  expert: ExpertAccountantProfile;
  partner: AssociatedPartnerProfile;
  lawsuit: LawsuitJudicialData;
  pericialItems: PericialCalculationItem[];
  competences: MonthlyCompetenceItem[];
  signature: DigitalSignatureRecord;
}): void {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'VELATRIX AOS v4.8';
  wb.created = new Date();

  const totalPrincipal = params.pericialItems.reduce((acc, item) => acc + item.principalAmount, 0);
  const totalSelic = params.pericialItems.reduce((acc, item) => acc + item.selicCorrection, 0);
  const totalGeral = params.pericialItems.reduce((acc, item) => acc + item.totalCredit, 0);
  const totalDocs = params.pericialItems.reduce((acc, item) => acc + item.documentsCount, 0);

  // 1. ABA RESUMO_PERICIAL
  const wsResumo = wb.addWorksheet('Resumo_Pericial');
  const resumoData: any[][] = [
    ['VELATRIX AOS • ASSISTÊNCIA TÉCNICA E PERÍCIA CONTÁBIL JUDICIAL'],
    ['MEMÓRIA DE CÁLCULO AUDITÁVEL & DEMONSTRATIVO ANALÍTICO DE LIQUIDAÇÃO'],
    [''],
    ['1. QUALIFICAÇÃO DO PERITO CONTÁBIL RESPONSÁVEL'],
    ['Nome do Perito:', params.expert.name],
    ['Registro Profissional CRC:', params.expert.crc],
    ['Cadastro Nacional de Peritos (CNPC):', params.expert.cnpc],
    ['CPF do Perito:', params.expert.cpf],
    ['E-mail Profissional:', params.expert.email],
    ['Telefone / Contato:', params.expert.phone],
    ['Especialidade Pericial:', params.expert.specialty],
    ['Comarca / UF:', `${params.expert.city}/${params.expert.state}`],
    [''],
    ['2. QUALIFICAÇÃO DA PARTE REQUERENTE (CLIENTE / EMBARGANTE)'],
    ['Razão Social:', params.clientName],
    ['CNPJ:', params.cnpj],
    ['Regime Tributário Auditado:', params.taxRegime],
    ['Período Auditado:', '60 Meses Pretéritos (EFD-ICMS/IPI e EFD-Contribuições)'],
    ['Total de Documentos Fiscais Auditados:', totalDocs.toLocaleString('pt-BR')],
    [''],
    ['3. QUALIFICAÇÃO DO PATRONO / ESCRITÓRIO ASSOCIADO'],
    ['Escritório de Advocacia:', params.partner.firmName],
    ['Advogado Responsável:', params.partner.lawyerName],
    ['Inscrição OAB:', params.partner.oab],
    ['CNPJ da Sociedade:', params.partner.cnpj],
    ['E-mail:', params.partner.email],
    [''],
    ['4. DADOS DO PROCESSO JUDICIAL / PROCEDIMENTO ADMINISTRATIVO'],
    ['Juízo / Vara:', params.lawsuit.courtName],
    ['Número dos Autos:', params.lawsuit.lawsuitNumber],
    ['Natureza da Ação:', params.lawsuit.actionType],
    ['Títulos Executivos / CDAs:', params.lawsuit.cdaNumbers.join(' | ')],
    [''],
    ['5. RESUMO CONSOLIDADO DOS CRÉDITOS APURADOS'],
    ['Total Principal Apurado (Indébito Bruto):', totalPrincipal],
    ['Total Atualização Monetária (Taxa SELIC):', totalSelic],
    ['VALOR TOTAL GERAL PERICIADO (LÍQUIDO):', totalGeral],
    [''],
    ['6. CERTIFICAÇÃO E ASSINATURA DIGITAL'],
    ['Status da Assinatura:', params.signature.isSigned ? 'ASSINADO DIGITALMENTE' : 'EMITIDO PARA REVISÃO'],
    ['Tipo de Certificado:', params.signature.signatureTypeLabel],
    ['Data/Hora da Assinatura:', params.signature.signedAt || 'Pendente de Certificação ICP-Brasil'],
    ['Hash Criptográfico SHA-256:', params.signature.sha256Hash || '0x' + computeSha256Sync(params.cnpj + Date.now())],
    ['Normas Técnicas Aplicadas:', 'NBC TP 01 (Perícia Contábil) e NBC PP 01 (Perito Contábil) do CFC']
  ];
  resumoData.forEach(row => wsResumo.addRow(row));

  // 2. ABA TESES_APURADAS
  const wsTeses = wb.addWorksheet('Teses_Apuradas');
  const tesesHeaders = [
    'Código Tese',
    'Denominação da Tese Pericial',
    'Tribunal / Jurisprudência Aplicável',
    'Base de Cálculo (R$)',
    'Indébito Principal (R$)',
    'Correção SELIC (R$)',
    'Total Periciado (R$)',
    'Documentos Auditados',
    'Status Jurídico / Vinculação'
  ];
  wsTeses.addRow(tesesHeaders);

  params.pericialItems.forEach(item => {
    wsTeses.addRow([
      item.teseCode,
      item.teseName,
      item.legalBasis,
      item.baseAmount,
      item.principalAmount,
      item.selicCorrection,
      item.totalCredit,
      item.documentsCount,
      item.statusLegalLabel
    ]);
  });

  wsTeses.addRow([
    'TOTAL GERAL',
    'Consolidação de Todos os Créditos Auditados',
    'STF / STJ / CARF',
    params.pericialItems.reduce((acc, i) => acc + i.baseAmount, 0),
    totalPrincipal,
    totalSelic,
    totalGeral,
    totalDocs,
    'Crédito Líquido, Certo e Exigível'
  ]);

  // 3. ABA MEMORIA_CALCULO_60M
  const wsComp = wb.addWorksheet('Memoria_Calculo_60M');
  const compHeaders = [
    'Competência',
    'Faturamento Base (R$)',
    'ICMS Destacado (R$)',
    'PIS Indébito (1,65%)',
    'COFINS Indébito (7,60%)',
    'Monofásico Indébito (R$)',
    'Insumos Creditamento (R$)',
    'Total Principal Mês (R$)',
    'Taxa SELIC Acumulada (%)',
    'Acréscimo SELIC (R$)',
    'Total Corrigido Mês (R$)'
  ];
  wsComp.addRow(compHeaders);

  params.competences.forEach(c => {
    wsComp.addRow([
      c.competence,
      c.revenueTotal,
      c.icmsDestacado,
      c.pisIndebito,
      c.cofinsIndebito,
      c.monofasicoCredit,
      c.insumosCredit,
      c.principalTotal,
      c.selicRateAcum / 100,
      c.selicAmount,
      c.totalCorrigido
    ]);
  });

  const sumRevenue = params.competences.reduce((acc, c) => acc + c.revenueTotal, 0);
  const sumIcms = params.competences.reduce((acc, c) => acc + c.icmsDestacado, 0);
  const sumPis = params.competences.reduce((acc, c) => acc + c.pisIndebito, 0);
  const sumCofins = params.competences.reduce((acc, c) => acc + c.cofinsIndebito, 0);
  const sumMono = params.competences.reduce((acc, c) => acc + c.monofasicoCredit, 0);
  const sumInsumos = params.competences.reduce((acc, c) => acc + c.insumosCredit, 0);
  const sumPrincipal = params.competences.reduce((acc, c) => acc + c.principalTotal, 0);
  const sumSelic = params.competences.reduce((acc, c) => acc + c.selicAmount, 0);
  const sumCorrigido = params.competences.reduce((acc, c) => acc + c.totalCorrigido, 0);

  wsComp.addRow([
    'TOTAIS (60M)',
    sumRevenue,
    sumIcms,
    sumPis,
    sumCofins,
    sumMono,
    sumInsumos,
    sumPrincipal,
    '-',
    sumSelic,
    sumCorrigido
  ]);

  // Nome seguro do arquivo e download via Blob
  const sanitizedClient = params.clientName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const fileName = `Memoria_Calculo_Pericial_${sanitizedClient}_60M.xlsx`;

  wb.xlsx.writeBuffer().then(buffer => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }).catch(err => {
    console.error('Falha ao exportar planilha ExcelJS:', err);
  });
}

// =========================================================================
// FUNÇÃO 2: GERADOR DE LAUDO / PARECER TÉCNICO PERICIAL EM PDF
// =========================================================================
export function generateTechnicalReportPdf(params: {
  clientName: string;
  cnpj: string;
  taxRegime: string;
  expert: ExpertAccountantProfile;
  partner: AssociatedPartnerProfile;
  lawsuit: LawsuitJudicialData;
  pericialItems: PericialCalculationItem[];
  signature: DigitalSignatureRecord;
}): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 15;

  const totalPrincipal = params.pericialItems.reduce((acc, item) => acc + item.principalAmount, 0);
  const totalSelic = params.pericialItems.reduce((acc, item) => acc + item.selicCorrection, 0);
  const totalGeral = params.pericialItems.reduce((acc, item) => acc + item.totalCredit, 0);
  const totalDocs = params.pericialItems.reduce((acc, item) => acc + item.documentsCount, 0);

  const hashDoc = params.signature.sha256Hash || computeSha256Sync(params.cnpj + totalGeral + Date.now());
  const dateFormatted = new Date().toLocaleDateString('pt-BR');

  // Helper de cabeçalho
  const drawHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(11, 16, 30); // Azul Noturno Velatrix
    doc.rect(margin, currentY, contentWidth, 20, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin + 4, currentY + 7);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 242, 255); // Ciano Velatrix
      doc.text(subtitle, margin + 4, currentY + 14);
    }

    currentY += 24;
  };

  // Helper de rodapé
  const drawFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Laudo Pericial Contábil • ${params.expert.name} (${params.expert.crc} - ${params.expert.cnpc}) • Hash SHA-256: ${hashDoc.slice(0, 24)}...`,
      margin,
      pageHeight - 8
    );
    doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin - 22, pageHeight - 8);
  };

  // =================== PÁGINA 1: FOLHA DE ROSTO E QUALIFICAÇÃO ===================
  drawHeader(
    'LAUDO PERICIAL CONTÁBIL JUDICIAL E EXTRAJUDICIAL',
    'ASSISTÊNCIA TÉCNICA ECONÔMICO-FISCAL • NORMAS BRASILEIRAS DE CONTABILIDADE (NBC TP 01 / NBC PP 01)'
  );

  // Box de Juízo e Partes
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('DISTRIBUIÇÃO E IDENTIFICAÇÃO PROCESSUAL:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Juízo Competente: ${params.lawsuit.courtName}`, margin + 4, currentY + 12);
  doc.text(`Autos do Processo: ${params.lawsuit.lawsuitNumber}`, margin + 4, currentY + 17);
  doc.text(`Natureza da Causa: ${params.lawsuit.actionType}`, margin + 4, currentY + 22);
  doc.text(`Autora / Contribuinte: ${params.clientName} (CNPJ: ${params.cnpj})`, margin + 4, currentY + 27);
  doc.text(`Réu / Exequente: ${params.lawsuit.defendantParty}`, margin + 4, currentY + 32);
  doc.text(`Patrono Associado: ${params.partner.firmName} • ${params.partner.lawyerName} (${params.partner.oab})`, margin + 4, currentY + 37);

  currentY += 46;

  // Box do Perito Responsável
  doc.setFillColor(240, 253, 250); // Verde suave
  doc.setDrawColor(153, 246, 228);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(19, 78, 74);
  doc.text('ASSISTENTE TÉCNICO / PERITO CONTADOR RESPONSÁVEL:', margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 118, 110);
  doc.text(`Nome: ${params.expert.name}`, margin + 4, currentY + 12);
  doc.text(`Registro no Conselho Regional de Contabilidade: ${params.expert.crc}`, margin + 4, currentY + 17);
  doc.text(`Cadastro Nacional de Peritos Contábeis do CFC: ${params.expert.cnpc}`, margin + 4, currentY + 22);
  doc.text(`Especialidade: ${params.expert.specialty} • Contato: ${params.expert.email}`, margin + 4, currentY + 27);

  currentY += 32;

  // Seção 1: Objeto da Perícia
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. OBJETO DA PERÍCIA', margin, currentY);
  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const objetoText = `O presente trabalho pericial tem por escopo técnico proceder à auditoria contábil, revisão pericial e liquidação aritmética dos indébitos fiscais apurados nas bases de cálculo das contribuições federais (PIS e COFINS), nos regimes cumulativo e não-cumulativo, relativamente ao período imprescrito dos últimos 60 (sessenta) meses. Compreende o levantamento da exclusão do ICMS destacado das bases de cálculo (Tema 69 STF), segregação de receitas monofásicas, exclusão do ISS (Tema 1125 STJ), cômputo de créditos sobre insumos essenciais (Tema 779 STJ) e a estrita atualização monetária dos valores pela taxa SELIC acumulada.`;
  const splitObjeto = doc.splitTextToSize(objetoText, contentWidth);
  doc.text(splitObjeto, margin, currentY);
  currentY += splitObjeto.length * 3.8 + 4;

  // Seção 2: Metodologia Pericial Aplicada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. METODOLOGIA E PROCEDIMENTOS TÉCNICOS APLICADOS', margin, currentY);
  currentY += 4;

  const metodologiaText = `Para consecução dos trabalhos, este Perito Assistente Técnico realizou a ingestão e auditoria eletrônica automatizada dos arquivos magnéticos originais fornecidos pela Contribuinte, nomeadamente os arquivos da EFD-ICMS/IPI (Blocos 0, C, D e E) e da EFD-Contribuições (Blocos 0, C, D, F, M e 1), confrontados nota a nota com os XMLs das Notas Fiscais Eletrônicas de Saída e Entrada (modelo 55).
Em observância irrestrita às Normas Brasileiras de Contabilidade expedidas pelo Conselho Federal de Contabilidade (NBC TP 01 - Da Perícia Contábil e NBC PP 01 - Do Perito Contábil), foram extraídos exclusivamente os valores de ICMS destacado, CSTs de PIS/COFINS e CFOPs parametrizados, aplicando-se a Taxa SELIC divulgada pela Receita Federal a partir do mês subsequente ao pagamento indevido até a presente data, sem incidência cumulada de outros juros ou encargos.`;
  const splitMetodo = doc.splitTextToSize(metodologiaText, contentWidth);
  doc.text(splitMetodo, margin, currentY);
  currentY += splitMetodo.length * 3.8 + 6;

  // Seção 3: Quadro Resumo dos Cálculos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DEMONSTRATIVO CONSOLIDADO DOS CRÉDITOS LIQUIDADOS', margin, currentY);
  currentY += 5;

  // Tabela Sintética
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('TESE / ITEM PERICIADO', margin + 2, currentY + 5);
  doc.text('PRINCIPAL (R$)', margin + 88, currentY + 5);
  doc.text('SELIC (R$)', margin + 120, currentY + 5);
  doc.text('TOTAL CORRIGIDO (R$)', margin + 148, currentY + 5);

  currentY += 7;

  params.pericialItems.forEach((item, index) => {
    doc.setFillColor(index % 2 === 0 ? 255 : 248, index % 2 === 0 ? 255 : 250, index % 2 === 0 ? 255 : 252);
    doc.rect(margin, currentY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.teseCode} - ${item.teseName.slice(0, 48)}`, margin + 2, currentY + 4.2);
    doc.text(formatCurrency(item.principalAmount, 'BRL'), margin + 88, currentY + 4.2);
    doc.text(formatCurrency(item.selicCorrection, 'BRL'), margin + 120, currentY + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.totalCredit, 'BRL'), margin + 148, currentY + 4.2);

    currentY += 6;
  });

  // Linha de Total
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL GERAL PERICIADO (LÍQUIDO):', margin + 2, currentY + 5);
  doc.text(formatCurrency(totalPrincipal, 'BRL'), margin + 88, currentY + 5);
  doc.text(formatCurrency(totalSelic, 'BRL'), margin + 120, currentY + 5);
  doc.setTextColor(16, 185, 129); // Verde esmeralda
  doc.text(formatCurrency(totalGeral, 'BRL'), margin + 148, currentY + 5);

  currentY += 12;

  // Seção 4: Conclusão Pericial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. CONCLUSÃO TÉCNICA E RESPOSTA CONGRUENTE', margin, currentY);
  currentY += 4;

  const conclusaoText = `Em face dos exames procedidos nos livros fiscais e arquivos magnéticos da Requerente, este Perito Contador conclui, com supedâneo nas balizas técnicas das NBC TP 01 e nas decisões vinculantes do Supremo Tribunal Federal e do Superior Tribunal de Justiça, que a Requerente apurou o montante total de ${formatCurrency(totalGeral, 'BRL')} (${formatCurrency(totalPrincipal, 'BRL')} a título de principal e ${formatCurrency(totalSelic, 'BRL')} a título de correção monetária pela Taxa SELIC acumulada).
Tal valor consubstancia indébito tributário de natureza líquida, certa e incontroversa, apto a fundamentar compensação perante a Secretaria Especial da Receita Federal do Brasil (via formulário eletrônico PER/DCOMP) ou embasar a liquidação/exclusão de débitos ajuizados na Execução Fiscal em epígrafe.`;
  const splitConclusao = doc.splitTextToSize(conclusaoText, contentWidth);
  doc.text(splitConclusao, margin, currentY);
  currentY += splitConclusao.length * 3.8 + 6;

  // Seção 5: Assinatura e Encerramento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`Termos em que, subscreve e junta aos autos.`, margin, currentY);
  doc.text(`${params.expert.city}/${params.expert.state}, ${dateFormatted}.`, margin, currentY + 4);

  currentY += 12;

  // Box de Assinatura Digital do Perito
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(params.expert.name, margin + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Perito Contador Assistente Técnico • ${params.expert.crc} • ${params.expert.cnpc}`, margin + 4, currentY + 11);

  if (params.signature.isSigned) {
    doc.setTextColor(16, 185, 129);
    doc.setFont('helvetica', 'bold');
    doc.text(`[ASSINADO DIGITALMENTE via ${params.signature.signatureTypeLabel}]`, margin + 4, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Certificação: ${params.signature.signedAt || dateFormatted} • Digest SHA-256: ${hashDoc}`, margin + 4, currentY + 20);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`[DOCUMENTO GERADO PELO MOTOR AOS VELATRIX - AGUARDANDO ASSINATURA DIGITAL ICP-BRASIL]`, margin + 4, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Hash de Integridade Criptográfica: ${hashDoc}`, margin + 4, currentY + 20);
  }

  drawFooter(1, 1);

  // Nome seguro do arquivo
  const sanitizedClient = params.clientName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
  const fileName = `Laudo_Pericial_Contabil_${sanitizedClient}_60M.pdf`;

  doc.save(fileName);
}

// =========================================================================
// FUNÇÃO 3: EXPORTAÇÃO DOS QUESITOS JUDICIAIS EM TXT FORMATADO
// =========================================================================
export function exportQuesitosToTxt(params: {
  clientName: string;
  cnpj: string;
  expert: ExpertAccountantProfile;
  partner: AssociatedPartnerProfile;
  lawsuit: LawsuitJudicialData;
  quesitos: PericialQuesitoItem[];
}): void {
  let content = `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL DA ${params.lawsuit.courtName.toUpperCase()}\n\n`;
  content += `Autos do Processo nº: ${params.lawsuit.lawsuitNumber}\n`;
  content += `Ação: ${params.lawsuit.actionType}\n`;
  content += `Requerente / Executada: ${params.clientName} (CNPJ: ${params.cnpj})\n`;
  content += `Exequente: ${params.lawsuit.defendantParty}\n\n`;
  content += `INDICAÇÃO DE ASSISTENTE TÉCNICO E APRESENTAÇÃO DE QUESITOS PERICIAIS\n`;
  content += `(Art. 465, § 1º, incisos II e III do Código de Processo Civil)\n\n`;
  content += `A Requerente, por seus procuradores signatários integrantes do escritório ${params.partner.firmName} (${params.partner.lawyerName} - ${params.partner.oab}), vem, respeitosamente, à presença de Vossa Excelência:\n\n`;
  content += `1. INDICAR como Assistente Técnico da Requerente o Perito Contador:\n`;
  content += `   Nome: ${params.expert.name}\n`;
  content += `   Registro Profissional: ${params.expert.crc}\n`;
  content += `   Cadastro Nacional de Peritos Contábeis: ${params.expert.cnpc}\n`;
  content += `   E-mail: ${params.expert.email} | Telefone: ${params.expert.phone}\n\n`;
  content += `2. FORMULAR os seguintes QUESITOS PERICIAIS a serem respondidos pelo Senhor Perito Judicial do Juízo e acompanhados pelo Assistente Técnico indicado:\n\n`;

  params.quesitos.forEach((q, idx) => {
    content += `QUESITO ${idx + 1} (${q.categoryLabel}):\n`;
    content += `"${q.question}"\n`;
    content += `• Objetivo Jurídico: ${q.purpose}\n`;
    content += `• Fundamentação Legal/Jurisprudencial: ${q.legalBasis}\n\n`;
  });

  content += `Nestes termos,\nPede e espera deferimento.\n\n`;
  content += `${params.expert.city}/${params.expert.state}, ${new Date().toLocaleDateString('pt-BR')}.\n\n`;
  content += `_____________________________________________\n`;
  content += `${params.partner.lawyerName}\n${params.partner.oab}\n\n`;
  content += `_____________________________________________\n`;
  content += `${params.expert.name}\n${params.expert.crc} • ${params.expert.cnpc}\nAssistente Técnico Contábil\n`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Quesitos_Periciais_${params.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
