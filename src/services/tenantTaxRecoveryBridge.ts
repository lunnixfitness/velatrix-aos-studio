// src/services/tenantTaxRecoveryBridge.ts
// Motor de compartilhamento de dados e pré-varredura tributária entre Diagnóstico e Defesa Fiscal

import { computeSha256Sync } from './expertTaxEngineService';
import type { ParsedSpedResult } from '../utils/documentParsers';
import { generateSectorSpecificTheses } from './sectorThesesService';
import { secureInt } from '../lib/demoMode';

export type TaxRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real';

export type TaxRiskScore = 'VERDE' | 'AMARELO' | 'VERMELHO';

export interface IngestedDocumentSummary {
  id: string;
  name: string;
  type: 'OFX' | 'DRE' | 'SPED' | 'XML_BATCH' | 'CONTRACT' | 'ECD' | 'ECF' | 'DCTF' | 'ESOCIAL' | 'REINF' | 'OTHER';
  typeLabel: string;
  size: string;
  uploadedAt: string;
  status: 'valid' | 'parsing' | 'error';
  summary?: string;
}

export interface PreliminaryTaxTeseEstimate {
  id: string;
  code: string;
  title: string;
  court: string;
  estimatedCredit: number;
  documentsAnalyzed: number;
  percentageOfTotal: number;
  riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO';
  riskScore: TaxRiskScore;
  riskScoreLabel: string;
  eligibleRegimes: TaxRegime[];
  status: 'PRE_ANALISADO' | 'HABILITADO_RFB' | 'EM_COMPENSACAO' | 'PROVA_CALCULADA' | 'LAUDO_PRONTO' | 'EM_ANALISE_RISCO';
  statusLabel: string;
  jurisprudence: string;
  description: string;
  category: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PREVIDENCIARIO' | 'INSUMOS_PIS_COFINS' | 'SIMPLES_SEGREGACAO';
  actionProtocol: string;
  isRealData?: boolean;
  realCreditInFile?: number;
  sourceDocument?: string;
}

export interface PreliminaryTaxScanResult {
  scanId: string;
  scannedAt: string;
  status: 'completed' | 'pending';
  totalEstimatedCredits: number;
  totalDocumentsScanned: number;
  totalPeriodsMonths: number;
  activeRegime: TaxRegime;
  hashSha256: string;
  teses: PreliminaryTaxTeseEstimate[];
  disclaimer: string;
  isRealData?: boolean;
  spedFileName?: string;
  realCreditsInFile?: number;
  monthsCovered?: number;
  parsedSpedData?: ParsedSpedResult;
}

export interface SharedTenantTaxData {
  companyName: string;
  cnpj: string;
  sectorKey: string;
  sectorName: string;
  taxRegime: TaxRegime;
  annualRevenue: number;
  monthlyRevenue: number;
  ebitdaMargin: number;
  dailyVolume: string;
  activeErp: string;
  erpConnected: boolean;
  cdaNumber?: string;
  processNumber?: string;
  documents: IngestedDocumentSummary[];
  preliminaryScan: PreliminaryTaxScanResult;
  lastSyncTimestamp: string;
}

const STORAGE_KEY = 'velatrix_shared_tenant_tax_bridge_v1';

// Default initial state matching standard baseline
export const DEFAULT_SHARED_TENANT_TAX_DATA: SharedTenantTaxData = {
  companyName: 'Vortex Logística & Manufatura S.A.',
  cnpj: '33.041.260/0001-88',
  sectorKey: 'manufacturing',
  sectorName: 'Manufatura & Indústria Pesada',
  taxRegime: 'lucro_real',
  annualRevenue: 54000000,
  monthlyRevenue: 4500000,
  ebitdaMargin: 16.5,
  dailyVolume: '18.400 volumes/dia',
  activeErp: 'TOTVS Protheus (Enterprise Connector)',
  erpConnected: true,
  cdaNumber: '80.6.24.00192-44',
  processNumber: '5001290-12.2024.4.03.6100',
  documents: [],
  preliminaryScan: {
    scanId: 'SCAN-D0-77492',
    scannedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'completed',
    totalEstimatedCredits: 2485000.00,
    totalDocumentsScanned: 84210,
    totalPeriodsMonths: 60,
    activeRegime: 'lucro_real',
    hashSha256: computeSha256Sync(JSON.stringify({
      scanId: 'SCAN-D0-77492',
      cnpj: '33041260000188',
      taxRegime: 'lucro_real',
      totalEstimatedCredits: 2485000.00,
      totalPeriodsMonths: 60
    })),
    disclaimer: 'Estimativa preliminar gerada automaticamente — sujeita a validação por contador/advogado tributarista antes de qualquer decisão ou proposta formal.',
    teses: [
      {
        id: 'tese_tema_69',
        code: 'Tema 69 STF (RE 574.706)',
        title: 'Exclusão do ICMS da Base de Cálculo do PIS/COFINS',
        court: 'Supremo Tribunal Federal',
        estimatedCredit: 1180000.00,
        documentsAnalyzed: 48210,
        percentageOfTotal: 47.5,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'HABILITADO_RFB',
        statusLabel: 'Habilitado RFB',
        jurisprudence: 'Tese do Século pacificada em Repercussão Geral. ICMS destacado na nota não compõe faturamento.',
        description: 'Varredura de 60 meses identificando todas as notas fiscais emitidas com ICMS na base de incidência das contribuições.',
        category: 'FEDERAL',
        actionProtocol: 'PER/DCOMP Web Direto (Via Administrativa)'
      },
      {
        id: 'tese_tema_779_insumos',
        code: 'Tema 779 STJ (REsp 1.221.170)',
        title: 'Créditos Ampliados de PIS/COFINS s/ Insumos Essenciais',
        court: 'Superior Tribunal de Justiça',
        estimatedCredit: 420000.00,
        documentsAnalyzed: 14320,
        percentageOfTotal: 16.9,
        riskLevel: 'MEDIO',
        riskScore: 'AMARELO',
        riskScoreLabel: 'Precedente Vinculante / Critério de Essencialidade (STJ)',
        eligibleRegimes: ['lucro_real'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Prova Calculada',
        jurisprudence: 'Critério da essencialidade e relevância. Crédito sobre EPIs, frete entre filiais, combustíveis, embalagens e softwares produtivos.',
        description: 'Auditoria pericial de insumos operacionais indispensáveis à atividade-fim não creditados no Bloco M do SPED.',
        category: 'INSUMOS_PIS_COFINS',
        actionProtocol: 'Laudo Pericial de Engenharia Tributária + PER/DCOMP'
      },
      {
        id: 'tese_tema_1125',
        code: 'Tema 1125 STJ (REsp 1.896.678)',
        title: 'Exclusão do Difal & ICMS-ST da Base do PIS/COFINS',
        court: 'Superior Tribunal de Justiça',
        estimatedCredit: 390000.00,
        documentsAnalyzed: 19450,
        percentageOfTotal: 15.7,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Recurso Repetitivo STJ',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'EM_COMPENSACAO',
        statusLabel: 'Em Compensação',
        jurisprudence: 'Recurso Repetitivo STJ. O ICMS-ST recolhido pelo substituto tributário não integra a base do PIS/COFINS.',
        description: 'Extrapolação pericial para operações interestaduais sujeitas a substituição e diferencial de alíquota.',
        category: 'FEDERAL',
        actionProtocol: 'Compensação Administrativa no DCOMP'
      },
      {
        id: 'tese_tema_118',
        code: 'Tema 118 STF (RE 592.616)',
        title: 'Exclusão do ISS da Base de Cálculo do PIS/COFINS',
        court: 'Supremo Tribunal Federal',
        estimatedCredit: 185000.00,
        documentsAnalyzed: 3120,
        percentageOfTotal: 7.4,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Julgamento Conclusivo STF',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Prova Calculada',
        jurisprudence: 'Aplicação analógica do Tema 69. ISS é tributo municipal arrecadado para o erário e não receita bruta.',
        description: 'Memória de cálculo segregada sobre notas de prestação de serviços municipais dos últimos 5 anos.',
        category: 'MUNICIPAL',
        actionProtocol: 'Pedido de Restituição / Habilitação de Crédito'
      },
      {
        id: 'tese_verbas_indenizatorias',
        code: 'Tema 985 STF / REsp 1.230.957',
        title: 'Não Incidência Previdenciária s/ Verbas Indenizatórias',
        court: 'STF & STJ',
        estimatedCredit: 165000.00,
        documentsAnalyzed: 60,
        percentageOfTotal: 6.6,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'LAUDO_PRONTO',
        statusLabel: 'Laudo Pronto',
        jurisprudence: 'Terço constitucional de férias, aviso prévio indenizado e primeiros 15 dias de auxílio-doença sem incidência de cota patronal.',
        description: 'Confronto entre GFIP/eSocial e guias GPS recolhidas nos últimos 60 meses com retificação da DCTFWeb.',
        category: 'PREVIDENCIARIO',
        actionProtocol: 'Retificação DCTFWeb + PER/DCOMP Web'
      },
      {
        id: 'tese_tema_1067_espelho',
        code: 'Tema 1067 STJ / RE 1.233.096',
        title: 'Exclusão do PIS/COFINS de Sua Própria Base (Tese do Espelho)',
        court: 'STJ & STF (Em Debate)',
        estimatedCredit: 145000.00,
        documentsAnalyzed: 1890,
        percentageOfTotal: 5.9,
        riskLevel: 'ALTO',
        riskScore: 'VERMELHO',
        riskScoreLabel: 'Tese Estratégica / Ação Judicial com Depósito',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'EM_ANALISE_RISCO',
        statusLabel: 'Em Análise de Risco',
        jurisprudence: 'Cálculo por dentro dos tributos federais. O valor das contribuições não configura receita própria do contribuinte.',
        description: 'Mapeamento para ajuizamento de Ação Ordinária com pedido de depósito judicial preventivo.',
        category: 'FEDERAL',
        actionProtocol: 'Ajuizamento de Mandado de Segurança com Depósito'
      }
    ]
  },
  lastSyncTimestamp: new Date().toISOString()
};

// Cenário de Teste Fictício: Autopeças de Motocicleta sob Regime Concentrado Bifásico (Lei 10.485/2002, art. 3º)
export const MOTRIX_SHARED_TENANT_TAX_DATA: SharedTenantTaxData = {
  companyName: 'Motrix Componentes Automotivos Ltda.',
  cnpj: '21.554.870/0001-33',
  sectorKey: 'auto_parts',
  sectorName: 'Autopeças & Motopeças (Tributação Concentrada Monofásica)',
  cdaNumber: '80.6.24.00412-18',
  processNumber: '5004128-44.2024.4.03.6100',
  taxRegime: 'lucro_real',
  annualRevenue: 38400000,
  monthlyRevenue: 3200000,
  ebitdaMargin: 19.2,
  dailyVolume: '12.800 componentes/dia',
  activeErp: 'TOTVS Protheus (Módulo Fiscal & Manufatura)',
  erpConnected: true,
  documents: [
    {
      id: 'doc-motrix-sped-efd',
      name: 'SPED_EFD_CONTRIBUICOES_2025_MOTRIX.txt',
      type: 'SPED',
      typeLabel: 'EFD-Contribuições',
      size: '14.2 MB',
      uploadedAt: 'Hoje às 08:30',
      status: 'valid',
      summary: 'Bloco M (Apuração PIS/COFINS Bifásico Lei 10.485/2002) e Bloco C (Documentos Fiscais de Motopeças)'
    },
    {
      id: 'doc-motrix-sped-icms',
      name: 'SPED_FISCAL_ICMS_IPI_MOTRIX.txt',
      type: 'SPED',
      typeLabel: 'EFD ICMS/IPI',
      size: '22.8 MB',
      uploadedAt: 'Hoje às 08:31',
      status: 'valid',
      summary: 'Registros C100/C170 e Livro de Apuração do IPI (Motopeças NCM 8714 e 8409)'
    },
    {
      id: 'doc-motrix-dre',
      name: 'DRE_Balancete_Auditado_Motrix_2025.xlsx',
      type: 'DRE',
      typeLabel: 'DRE & Balancete',
      size: '3.4 MB',
      uploadedAt: 'Hoje às 08:32',
      status: 'valid',
      summary: 'Receita Bruta R$ 38.4M com segregação de saídas industriais e revenda de motopeças'
    }
  ],
  preliminaryScan: {
    scanId: 'SCAN-MOTRIX-98412',
    scannedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'completed',
    totalEstimatedCredits: 1660000.00,
    totalDocumentsScanned: 52140,
    totalPeriodsMonths: 60,
    activeRegime: 'lucro_real',
    hashSha256: computeSha256Sync(JSON.stringify({
      scanId: 'SCAN-MOTRIX-98412',
      cnpj: '21554870000133',
      taxRegime: 'lucro_real',
      totalEstimatedCredits: 1660000.00
    })),
    disclaimer: 'Auditoria preliminar especializada em autopeças de motocicletas sob regime concentrado bifásico (Lei 10.485/2002, art. 3º).',
    teses: [
      {
        id: 'tese_bifasico_motrix',
        code: 'Lei nº 10.485/2002',
        title: 'PIS/COFINS - Segregação Monofásica (Motopeças)',
        court: 'RFB',
        estimatedCredit: 820000.00,
        documentsAnalyzed: 28400,
        percentageOfTotal: 42.1,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Legalmente Expresso (Lei 10.485/2002)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'HABILITADO_RFB',
        statusLabel: 'Habilitado RFB',
        jurisprudence: 'Tributação concentrada incidente exclusivamente no fabricante/importador com alíquota zero na revenda (Art. 3º, § 2º). Repetição de indébito de recolhimentos indevidos na cadeia varejista/atacadista com CST 01 em vez de CST 04.',
        description: 'Varredura de 60 meses identificando vendas de autopeças de motocicleta tributadas erroneamente na revenda com alíquotas não-cumulativas de 9,25% em vez de Alíquota Zero (CST 04).',
        category: 'FEDERAL',
        actionProtocol: 'PER/DCOMP Web com retificação de EFD-Contribuições'
      },
      {
        id: 'tese_tema_69_motrix',
        code: 'STF (RE 574.706)',
        title: 'PIS/COFINS - Exclusão ICMS da BC (Tema 69)',
        court: 'RFB',
        estimatedCredit: 640000.00,
        documentsAnalyzed: 18200,
        percentageOfTotal: 32.9,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Pacificada STF (Tema 69)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'HABILITADO_RFB',
        statusLabel: 'Habilitado RFB',
        jurisprudence: 'ICMS destacado na nota fiscal de saída de motopeças não compõe a base de incidência das contribuições federais.',
        description: 'Exclusão do ICMS destacado nas notas fiscais de saída fabril e comercial de motopeças nos últimos 5 anos.',
        category: 'FEDERAL',
        actionProtocol: 'PER/DCOMP Web Administrativo'
      },
      {
        id: 'tese_verbas_motrix',
        code: 'STF (REsp 1.230.957)',
        title: 'PREVIDENCIÁRIO - Verbas Indenizatórias (Tema 985)',
        court: 'RFB',
        estimatedCredit: 200000.00,
        documentsAnalyzed: 60,
        percentageOfTotal: 10.4,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'LAUDO_PRONTO',
        statusLabel: 'Laudo Pronto',
        jurisprudence: 'Exclusão de cota patronal sobre aviso prévio indenizado, terço de férias e primeiros 15 dias de afastamento dos trabalhadores industriais.',
        description: 'Retificação da DCTFWeb e compensação de créditos previdenciários dos colaboradores da planta fabril de autopeças.',
        category: 'PREVIDENCIARIO',
        actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
      },
      {
        id: 'tese_insumos_motopeças',
        code: 'STJ (REsp 1.221.170)',
        title: 'Créditos de PIS/COFINS s/ Insumos de Fabricação (Tema 779)',
        court: 'STJ',
        estimatedCredit: 285000.00,
        documentsAnalyzed: 4200,
        percentageOfTotal: 14.6,
        riskLevel: 'MEDIO',
        riskScore: 'AMARELO',
        riskScoreLabel: 'Critério de Essencialidade (STJ)',
        eligibleRegimes: ['lucro_real'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Prova Calculada',
        jurisprudence: 'Créditos da não-cumulatividade sobre fluidos de usinagem, ferramentas de corte, moldes e embalagens protetivas de motopeças.',
        description: 'Apropriação de créditos extemporâneos sobre insumos industriais essenciais à fabricação de pastilhas, discos, correntes e pistões.',
        category: 'INSUMOS_PIS_COFINS',
        actionProtocol: 'Laudo Pericial de Engenharia + Bloco M SPED'
      }
    ]
  },
  lastSyncTimestamp: new Date().toISOString()
};

export type MockTenantPresetId = 'vortex' | 'motrix';

export const MOCK_TENANT_PRESETS: Record<MockTenantPresetId, SharedTenantTaxData> = {
  vortex: DEFAULT_SHARED_TENANT_TAX_DATA,
  motrix: MOTRIX_SHARED_TENANT_TAX_DATA
};

// Calculate dynamic tax credits based on actual annual revenue, sector, and tax regime
export function calculateDynamicPreliminaryTaxScan(
  annualRevenue: number,
  sectorKey: string = 'manufacturing',
  hasSped: boolean = true,
  taxRegime: TaxRegime = 'lucro_real',
  realSpedData?: ParsedSpedResult | null
): PreliminaryTaxScanResult {
  // SE HOUVER DADOS REAIS EXTRAÍDOS DE ARQUIVO SPED FISCAL (.TXT / EFD-CONTRIBUIÇÕES):
  if (realSpedData && realSpedData.isRealData) {
    const effectiveRegime: TaxRegime = realSpedData.taxRegime || taxRegime;
    const tc = realSpedData.thesesCredits;
    const totalRealCredits = realSpedData.totalExtrapolated60mCredits > 0 
      ? realSpedData.totalExtrapolated60mCredits 
      : realSpedData.totalRealCreditsInFile;
    const realFileCredits = realSpedData.totalRealCreditsInFile;
    const totalDocs = realSpedData.documentCount;

    const teses: PreliminaryTaxTeseEstimate[] = [
      {
        id: tc.tema69Icms.thesisId,
        code: tc.tema69Icms.code,
        title: tc.tema69Icms.title,
        court: tc.tema69Icms.court,
        estimatedCredit: tc.tema69Icms.extrapolated60mCredit,
        realCreditInFile: tc.tema69Icms.creditInFile,
        documentsAnalyzed: tc.tema69Icms.documentsAnalyzed,
        percentageOfTotal: tc.tema69Icms.percentageOfTotal,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Pacificada STF (Tema 69)',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'HABILITADO_RFB',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.tema69Icms.legalBase,
        description: `ICMS destacado excluído da base das contribuições apurado diretamente dos registros |C100|/|C170|. Base apurada: R$ ${tc.tema69Icms.baseCalculated.toLocaleString('pt-BR')} (Alíquota ${tc.tema69Icms.rateAppliedPercent.toFixed(2)}%).`,
        category: 'FEDERAL',
        actionProtocol: 'PER/DCOMP Web Direto',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      },
      {
        id: tc.tema779Insumos.thesisId,
        code: tc.tema779Insumos.code,
        title: tc.tema779Insumos.title,
        court: tc.tema779Insumos.court,
        estimatedCredit: tc.tema779Insumos.extrapolated60mCredit,
        realCreditInFile: tc.tema779Insumos.creditInFile,
        documentsAnalyzed: tc.tema779Insumos.documentsAnalyzed,
        percentageOfTotal: tc.tema779Insumos.percentageOfTotal,
        riskLevel: 'MEDIO',
        riskScore: 'AMARELO',
        riskScoreLabel: 'Critério de Essencialidade (STJ)',
        eligibleRegimes: ['lucro_real'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.tema779Insumos.legalBase,
        description: `Créditos ampliados sobre insumos operacionais essenciais (|C170| e Bloco M). Base elegível: R$ ${tc.tema779Insumos.baseCalculated.toLocaleString('pt-BR')}.`,
        category: 'INSUMOS_PIS_COFINS',
        actionProtocol: 'Laudo Pericial de Engenharia Tributária + PER/DCOMP',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      },
      {
        id: tc.tema1125IcmsSt.thesisId,
        code: tc.tema1125IcmsSt.code,
        title: tc.tema1125IcmsSt.title,
        court: tc.tema1125IcmsSt.court,
        estimatedCredit: tc.tema1125IcmsSt.extrapolated60mCredit,
        realCreditInFile: tc.tema1125IcmsSt.creditInFile,
        documentsAnalyzed: tc.tema1125IcmsSt.documentsAnalyzed,
        percentageOfTotal: tc.tema1125IcmsSt.percentageOfTotal,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Recurso Repetitivo STJ',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'EM_COMPENSACAO',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.tema1125IcmsSt.legalBase,
        description: `ICMS-ST e Diferencial de Alíquota identificados em operações interestaduais. Base: R$ ${tc.tema1125IcmsSt.baseCalculated.toLocaleString('pt-BR')}.`,
        category: 'FEDERAL',
        actionProtocol: 'Compensação Administrativa DCOMP',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      },
      {
        id: tc.tema118Iss.thesisId,
        code: tc.tema118Iss.code,
        title: tc.tema118Iss.title,
        court: tc.tema118Iss.court,
        estimatedCredit: tc.tema118Iss.extrapolated60mCredit,
        realCreditInFile: tc.tema118Iss.creditInFile,
        documentsAnalyzed: tc.tema118Iss.documentsAnalyzed,
        percentageOfTotal: tc.tema118Iss.percentageOfTotal,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Repercussão Geral STF',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.tema118Iss.legalBase,
        description: `Exclusão do ISS municipal da base das contribuições federais apurado nos registros de serviços (|A100|/|C170|). Base: R$ ${tc.tema118Iss.baseCalculated.toLocaleString('pt-BR')}.`,
        category: 'MUNICIPAL',
        actionProtocol: 'Habilitação de Crédito via PER/DCOMP',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      }
    ];

    if (tc.inssIndenizatorias.extrapolated60mCredit > 0) {
      teses.push({
        id: tc.inssIndenizatorias.thesisId,
        code: tc.inssIndenizatorias.code,
        title: tc.inssIndenizatorias.title,
        court: tc.inssIndenizatorias.court,
        estimatedCredit: tc.inssIndenizatorias.extrapolated60mCredit,
        realCreditInFile: tc.inssIndenizatorias.creditInFile,
        documentsAnalyzed: tc.inssIndenizatorias.documentsAnalyzed,
        percentageOfTotal: tc.inssIndenizatorias.percentageOfTotal,
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Jurisprudência Pacificada STF',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'LAUDO_PRONTO',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.inssIndenizatorias.legalBase,
        description: 'Auditoria de verbas indenizatórias previdenciárias não tributáveis.',
        category: 'PREVIDENCIARIO',
        actionProtocol: 'Retificação DCTFWeb + PER/DCOMP Web',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      });
    }

    if (tc.teseEspelho.extrapolated60mCredit > 0) {
      teses.push({
        id: tc.teseEspelho.thesisId,
        code: tc.teseEspelho.code,
        title: tc.teseEspelho.title,
        court: tc.teseEspelho.court,
        estimatedCredit: tc.teseEspelho.extrapolated60mCredit,
        realCreditInFile: tc.teseEspelho.creditInFile,
        documentsAnalyzed: tc.teseEspelho.documentsAnalyzed,
        percentageOfTotal: tc.teseEspelho.percentageOfTotal,
        riskLevel: 'ALTO',
        riskScore: 'VERMELHO',
        riskScoreLabel: 'Tese Estratégica STJ / Depósito Judicial',
        eligibleRegimes: ['lucro_real', 'lucro_presumido'],
        status: 'EM_ANALISE_RISCO',
        statusLabel: 'Auditado via SPED',
        jurisprudence: tc.teseEspelho.legalBase,
        description: 'Exclusão do PIS/COFINS de sua própria base (cálculo por dentro).',
        category: 'FEDERAL',
        actionProtocol: 'Mandado de Segurança com Depósito Judicial',
        isRealData: true,
        sourceDocument: realSpedData.fileName
      });
    }

    const scanPayload = JSON.stringify({
      scanId: `SCAN-SPED-REAL-${realSpedData.fileName}-${totalRealCredits}`,
      totalEstimatedCredits: totalRealCredits,
      totalDocumentsScanned: totalDocs,
      totalPeriodsMonths: 60,
      activeRegime: effectiveRegime,
      realCreditsInFile: realFileCredits,
      monthsCovered: realSpedData.monthsCovered,
      teses: teses.map(t => ({ id: t.id, code: t.code, estimatedCredit: t.estimatedCredit }))
    });

    const hashSha256 = computeSha256Sync(scanPayload);

    return {
      scanId: `SCAN-REAL-SPED-${secureInt(10000, 99999)}`,
      scannedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed',
      totalEstimatedCredits: totalRealCredits,
      totalDocumentsScanned: totalDocs,
      totalPeriodsMonths: 60,
      activeRegime: effectiveRegime,
      hashSha256,
      disclaimer: 'Estimativa preliminar gerada automaticamente — sujeita a validação por contador/advogado tributarista antes de qualquer decisão ou proposta formal.',
      teses,
      isRealData: true,
      spedFileName: realSpedData.fileName,
      realCreditsInFile: realFileCredits,
      monthsCovered: realSpedData.monthsCovered,
      parsedSpedData: realSpedData
    };
  }

  // Baseline scaling factor compared to R$ 54M/ano standard
  const baseRevenue = 54000000;
  const ratio = Math.max(0.15, annualRevenue / baseRevenue);
  const docsCountRatio = Math.max(0.2, Math.min(5, annualRevenue / baseRevenue));

  // Geração de teses altamente customizadas por setor (Autopeças, Saúde, Varejo, Logística, etc.)
  const { teses, totalEstimated, totalDocs } = generateSectorSpecificTheses(
    sectorKey,
    annualRevenue,
    taxRegime,
    ratio,
    docsCountRatio
  );

  const scanPayload = JSON.stringify({
    scanId: `SCAN-D0-${taxRegime}-${totalEstimated.toFixed(2)}`,
    totalEstimatedCredits: totalEstimated,
    totalDocumentsScanned: totalDocs,
    totalPeriodsMonths: 60,
    activeRegime: taxRegime,
    teses: teses.map(t => ({ id: t.id, code: t.code, estimatedCredit: t.estimatedCredit }))
  });

  const hashSha256 = computeSha256Sync(scanPayload);

  return {
    scanId: `SCAN-D0-${secureInt(10000, 99999)}`,
    scannedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    status: 'completed',
    totalEstimatedCredits: totalEstimated,
    totalDocumentsScanned: totalDocs,
    totalPeriodsMonths: 60,
    activeRegime: taxRegime,
    hashSha256,
    disclaimer: 'Estimativa preliminar gerada automaticamente — sujeita a validação por contador/advogado tributarista antes de qualquer decisão ou proposta formal.',
    teses
  };
}

// In-memory cache + storage persistence helper
let currentBridgeData: SharedTenantTaxData = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          ...DEFAULT_SHARED_TENANT_TAX_DATA,
          ...parsed,
          taxRegime: parsed.taxRegime || 'lucro_real'
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_SHARED_TENANT_TAX_DATA };
})();

type BridgeListener = (data: SharedTenantTaxData) => void;
const listeners = new Set<BridgeListener>();

export const TenantTaxRecoveryBridge = {
  get(): SharedTenantTaxData {
    return currentBridgeData;
  },

  update(partial: Partial<SharedTenantTaxData>): SharedTenantTaxData {
    currentBridgeData = {
      ...currentBridgeData,
      ...partial,
      lastSyncTimestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBridgeData));
    } catch (e) {
      // ignore
    }

    listeners.forEach((listener) => {
      try {
        listener(currentBridgeData);
      } catch (err) {
        console.error('Error notifying bridge listener', err);
      }
    });

    return currentBridgeData;
  },

  subscribe(listener: BridgeListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  runScan(
    annualRevenue: number, 
    sectorKey: string = 'manufacturing', 
    hasSped: boolean = true,
    taxRegime: TaxRegime = 'lucro_real',
    realSpedData?: ParsedSpedResult | null
  ): PreliminaryTaxScanResult {
    const scan = calculateDynamicPreliminaryTaxScan(annualRevenue, sectorKey, hasSped, taxRegime, realSpedData);
    this.update({
      taxRegime: realSpedData?.taxRegime || taxRegime,
      preliminaryScan: scan
    });
    return scan;
  },

  setMockPreset(presetId: string): SharedTenantTaxData {
    if (presetId === 'motrix') {
      currentBridgeData = { ...MOTRIX_SHARED_TENANT_TAX_DATA, lastSyncTimestamp: new Date().toISOString() };
    } else if (presetId === 'vortex') {
      currentBridgeData = { ...DEFAULT_SHARED_TENANT_TAX_DATA, lastSyncTimestamp: new Date().toISOString() };
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBridgeData));
    } catch (e) {
      // ignore
    }

    listeners.forEach((listener) => {
      try {
        listener(currentBridgeData);
      } catch (err) {
        console.error('Error notifying bridge listener', err);
      }
    });

    return currentBridgeData;
  },

  syncFromTenantProfile(tenant: {
    id?: string;
    name: string;
    cnpj: string;
    sector?: string;
    sectorLabel?: string;
    annualRevenue?: number;
    monthlyRevenue?: number;
    taxRegime?: string;
    ebitdaMargin?: number;
    connectedErp?: string;
  }): SharedTenantTaxData {
    const effectiveAnnualRev = tenant.annualRevenue || 54000000;
    const effectiveSector = tenant.sector || 'manufacturing';
    const effectiveRegime = (tenant.taxRegime as TaxRegime) || 'lucro_real';

    const scan = calculateDynamicPreliminaryTaxScan(
      effectiveAnnualRev,
      effectiveSector,
      true,
      effectiveRegime,
      currentBridgeData.preliminaryScan?.parsedSpedData
    );

    currentBridgeData = {
      ...currentBridgeData,
      companyName: tenant.name,
      cnpj: tenant.cnpj,
      sectorKey: effectiveSector,
      sectorName: tenant.sectorLabel || currentBridgeData.sectorName,
      taxRegime: effectiveRegime,
      annualRevenue: effectiveAnnualRev,
      monthlyRevenue: tenant.monthlyRevenue || (effectiveAnnualRev / 12),
      ebitdaMargin: tenant.ebitdaMargin || currentBridgeData.ebitdaMargin,
      activeErp: tenant.connectedErp || currentBridgeData.activeErp,
      preliminaryScan: scan,
      lastSyncTimestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentBridgeData));
    } catch (e) {
      // ignore
    }

    listeners.forEach((listener) => {
      try {
        listener(currentBridgeData);
      } catch (err) {
        console.error('Error notifying bridge listener', err);
      }
    });

    return currentBridgeData;
  },

  getCurrentPresetId(): string {
    if (
      currentBridgeData.cnpj?.includes('21.554.870') || 
      currentBridgeData.companyName?.toLowerCase().includes('motrix')
    ) {
      return 'motrix';
    }
    return 'vortex';
  }
};

// Global event listener to keep bridge in sync with unified tenant changes
if (typeof window !== 'undefined') {
  window.addEventListener('velatrix:tenant_changed', (event: any) => {
    if (event.detail) {
      TenantTaxRecoveryBridge.syncFromTenantProfile(event.detail);
    }
  });
}
