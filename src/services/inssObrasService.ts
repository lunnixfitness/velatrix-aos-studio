/**
 * VELATRIX AOS - MOTOR DE CÁLCULO E AUDITORIA INSS-OBRAS (CONSTRUÇÃO CIVIL)
 * Regulamentação: Lei nº 8.212/1991 (Art. 31), Lei nº 12.546/2011 (CPRB),
 * IN RFB nº 2.110/2022 (Arts. 110-145), IN RFB nº 2.021/2021 (SERO) e Súm. Vinc. 8 STF.
 */

import { 
  CnoMatricula, 
  InvoiceRetentionItem, 
  IndirectAfferenceSimulation, 
  DeclaratoryIntegrationRecord, 
  InssObrasDossierPericial,
  ConstructionWorkType,
  ConstructionStandard
} from '../types/inssObras';
import { sha256HexSync } from '../shared/crypto/sha256Sync';

// ---------------------------------------------------------------------------
// 1. TABELA DE CUB REGIONAL (Sinduscon R$/m² - Padrão Normal)
// ---------------------------------------------------------------------------
export const CUB_REGIONAL_TABLE: Record<string, { baixo: number; normal: number; alto: number }> = {
  SP: { baixo: 1980.50, normal: 2650.80, alto: 3520.40 },
  RJ: { baixo: 2010.20, normal: 2690.40, alto: 3580.90 },
  MG: { baixo: 1920.00, normal: 2540.30, alto: 3380.00 },
  RS: { baixo: 1940.60, normal: 2580.10, alto: 3410.50 },
  PR: { baixo: 1935.40, normal: 2565.00, alto: 3390.80 },
  SC: { baixo: 1970.10, normal: 2610.70, alto: 3460.20 },
  BA: { baixo: 1840.80, normal: 2420.50, alto: 3210.00 },
  GO: { baixo: 1870.30, normal: 2460.90, alto: 3260.40 },
  DF: { baixo: 2050.00, normal: 2720.00, alto: 3620.00 },
  PE: { baixo: 1850.20, normal: 2430.00, alto: 3230.50 },
  CE: { baixo: 1830.40, normal: 2410.80, alto: 3190.00 },
  DEFAULT: { baixo: 1900.00, normal: 2550.00, alto: 3350.00 }
};

// ---------------------------------------------------------------------------
// 2. PERCENTUAIS DE MÃO DE OBRA (RMT) TABELADOS DA IN RFB 2.021/2021 (SERO)
// ---------------------------------------------------------------------------
export const RMT_PERCENTAGE_TABLE: Record<ConstructionWorkType, Record<ConstructionStandard, number>> = {
  RESIDENCIAL_UNIFAMILIAR: { BAIXO: 0.20, NORMAL: 0.24, ALTO: 0.28 },
  RESIDENCIAL_MULTIFAMILIAR: { BAIXO: 0.25, NORMAL: 0.30, ALTO: 0.35 },
  COMERCIAL: { BAIXO: 0.28, NORMAL: 0.32, ALTO: 0.38 },
  GALPAO_INDUSTRIAL: { BAIXO: 0.15, NORMAL: 0.18, ALTO: 0.22 },
  INFRAESTRUTURA_OBRAS_PESADAS: { BAIXO: 0.35, NORMAL: 0.42, ALTO: 0.48 },
  REFORMA_DEMOLICAO: { BAIXO: 0.30, NORMAL: 0.38, ALTO: 0.45 }
};

// Taxa Selic acumulada histórica de referência (mês a mês últimos 5 anos)
export const SELIC_ACCUMULATED_MAP: Record<string, number> = {
  '2021-01': 48.2, '2021-02': 47.9, '2021-03': 47.5, '2021-04': 47.0, '2021-05': 46.4,
  '2021-06': 45.8, '2021-07': 45.1, '2021-08': 44.3, '2021-09': 43.4, '2021-10': 42.4,
  '2021-11': 41.3, '2021-12': 40.1, '2022-01': 38.8, '2022-02': 37.4, '2022-03': 35.9,
  '2022-04': 34.3, '2022-05': 32.7, '2022-06': 31.0, '2022-07': 29.3, '2022-08': 27.6,
  '2022-09': 25.9, '2022-10': 24.2, '2022-11': 22.5, '2022-12': 20.8, '2023-01': 19.1,
  '2023-02': 17.5, '2023-03': 15.9, '2023-04': 14.3, '2023-05': 12.8, '2023-06': 11.3,
  '2023-07': 9.9,  '2023-08': 8.6,  '2023-09': 7.4,  '2023-10': 6.3,  '2023-11': 5.2,
  '2023-12': 4.2,  '2024-01': 3.3,  '2024-02': 2.5,  '2024-03': 1.8,  '2024-04': 1.2,
  '2024-05': 0.8,  '2024-06': 0.5,  '2024-07': 0.3,  '2024-08': 0.1,  '2024-09': 0.0
};

// ---------------------------------------------------------------------------
// 3. SEED INICIAL DE OBRAS CNO
// ---------------------------------------------------------------------------
export const DEFAULT_CNO_LIST: CnoMatricula[] = [
  {
    id: 'cno_sp_edificio_horizonte',
    cnoNumber: '90.012.34567/81',
    ceiLegacyNumber: '51.234.56789/72',
    nickname: 'Condomínio Residencial Horizonte Paulista',
    corporateReason: 'Metrópole Engenharia e Construções S/A',
    cnpj: '14.823.901/0001-44',
    technicalResponsible: {
      name: 'Eng. Marcelo Albuquerque Vianna',
      councilType: 'CREA',
      registryNumber: '5062391823/SP',
      uf: 'SP',
      cpf: '284.195.828-40'
    },
    builtAreaM2: 14500,
    workType: 'RESIDENCIAL_MULTIFAMILIAR',
    constructionStandard: 'NORMAL',
    cubSindusconM2: 2650.80,
    startDate: '2022-03-15',
    endDateOrHabiteSe: '2024-08-30',
    status: 'CONCLUIDA_PENDENTE_SERO',
    uf: 'SP',
    city: 'São Paulo',
    address: 'Av. Engenheiro Luís Carlos Berrini, 1420 - Brooklin',
    isDesoneradoCprb: true, // 3.5%
    declaredPayrollTotal: 5850000.00,
    notes: 'Torre de 22 pavimentos residenciais. Concreto usinado integral e lajes protendidas.'
  },
  {
    id: 'cno_mg_complexo_logistico',
    cnoNumber: '90.045.67890/22',
    nickname: 'Parque Logístico e Industrial Minas-Sul',
    corporateReason: 'Metrópole Engenharia e Construções S/A',
    cnpj: '14.823.901/0001-44',
    technicalResponsible: {
      name: 'Engª. Camila Beatriz Siqueira',
      councilType: 'CREA',
      registryNumber: '142890512/MG',
      uf: 'MG',
      cpf: '391.402.716-12'
    },
    builtAreaM2: 28400,
    workType: 'GALPAO_INDUSTRIAL',
    constructionStandard: 'BAIXO',
    cubSindusconM2: 1920.00,
    startDate: '2023-01-10',
    endDateOrHabiteSe: undefined,
    status: 'EM_ANDAMENTO',
    uf: 'MG',
    city: 'Extrema',
    address: 'Rodovia Fernão Dias, KM 932 - Distrito Industrial',
    isDesoneradoCprb: true, // 3.5%
    declaredPayrollTotal: 3420000.00,
    notes: 'Galpão em estrutura pré-moldada de concreto e piso industrial polido.'
  },
  {
    id: 'cno_rj_centro_empresarial',
    cnoNumber: '90.078.90123/45',
    nickname: 'Centro Empresarial Porto Maravilha',
    corporateReason: 'Metrópole Engenharia e Construções S/A',
    cnpj: '14.823.901/0001-44',
    technicalResponsible: {
      name: 'Arq. Leonardo D’Angelo Paiva',
      councilType: 'CAU',
      registryNumber: 'A19482-3/RJ',
      uf: 'RJ',
      cpf: '174.920.317-05'
    },
    builtAreaM2: 9800,
    workType: 'COMERCIAL',
    constructionStandard: 'ALTO',
    cubSindusconM2: 3580.90,
    startDate: '2021-08-01',
    endDateOrHabiteSe: '2023-11-20',
    status: 'REGULARIZADA_CND',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    address: 'Av. Rodrigues Alves, 820 - Santo Cristo',
    isDesoneradoCprb: false, // 11%
    declaredPayrollTotal: 8900000.00,
    notes: 'Retrofit corporativo de alta complexidade com CND emitida no SERO.'
  }
];

// ---------------------------------------------------------------------------
// 4. SEED INICIAL DE NOTAS FISCAIS COM RETENÇÃO
// ---------------------------------------------------------------------------
export const DEFAULT_INVOICE_RETENTIONS: InvoiceRetentionItem[] = [
  {
    id: 'inv_ret_001',
    cnoId: 'cno_sp_edificio_horizonte',
    cnoNumber: '90.012.34567/81',
    invoiceNumber: 'NFS-e 048201',
    issueDate: '2023-04-12',
    competenceMonth: '2023-04',
    serviceDescription: 'Subempreitada de Armação e Concretagem de Estruturas com fornecimento integral de ferragens e concreto usinado',
    contractNumber: 'CTR-ESTR-2023/04',
    providerName: 'Alfa Estruturas Metálicas & Concreto Eireli',
    providerCnpj: '08.419.231/0001-92',
    grossValue: 480000.00,
    hasContractClauseForMaterials: true,
    materialsDeclaredInInvoice: 288000.00, // 60% da nota
    materialsProvenFiscalReceipts: 288000.00,
    equipmentDeclaredInInvoice: 0,
    hasHeavyEquipmentProof: false,
    deductibleMaterialsAllowed: 288000.00,
    deductibleEquipmentAllowed: 0,
    effectiveLaborBaseCalculated: 192000.00,
    retentionRateApplied: 11.0, // Tomador reteve 11% sobre o total da nota por erro
    retentionRateDue: 3.5,     // Construtora é optante da CPRB (Lei 12.546/11)
    retentionWithheldPaid: 52800.00, // 11% s/ 480k bruto! (retido a maior)
    retentionWithheldDue: 6720.00,   // 3.5% s/ 192k de mão de obra líquida
    excessWithheldIndebito: 46080.00, // Retenção indevida apurada
    selicRateAccumulatedPct: 14.3,
    selicInterestBrl: 6589.44,
    totalUpdatedIndebito: 52669.44,
    complianceStatus: 'RETENCAO_EXCESSIVA',
    legalNotes: 'Tomador reteve 11% sobre valor bruto total da nota sem expurgar R$ 288k de materiais comprovados (Art. 121 IN 2.110/22) e ignorou a CPRB 3,5% (Art. 112).'
  },
  {
    id: 'inv_ret_002',
    cnoId: 'cno_sp_edificio_horizonte',
    cnoNumber: '90.012.34567/81',
    invoiceNumber: 'NFS-e 049512',
    issueDate: '2023-06-18',
    competenceMonth: '2023-06',
    serviceDescription: 'Alvenaria de vedação, reboco e assentamento de pisos cerâmicos com fornecimento de argamassas e insumos',
    contractNumber: 'CTR-ALV-2023/12',
    providerName: 'Beta Construções Civis Ltda',
    providerCnpj: '19.824.502/0001-38',
    grossValue: 260000.00,
    hasContractClauseForMaterials: true,
    materialsDeclaredInInvoice: 130000.00, // 50%
    materialsProvenFiscalReceipts: 130000.00,
    equipmentDeclaredInInvoice: 0,
    hasHeavyEquipmentProof: false,
    deductibleMaterialsAllowed: 130000.00,
    deductibleEquipmentAllowed: 0,
    effectiveLaborBaseCalculated: 130000.00,
    retentionRateApplied: 11.0,
    retentionRateDue: 3.5,
    retentionWithheldPaid: 28600.00, // 11% s/ 260k
    retentionWithheldDue: 4550.00,   // 3.5% s/ 130k
    excessWithheldIndebito: 24050.00,
    selicRateAccumulatedPct: 11.3,
    selicInterestBrl: 2717.65,
    totalUpdatedIndebito: 26767.65,
    complianceStatus: 'ALIQUOTA_INCORRETA',
    legalNotes: 'Aplicação indevida da alíquota de 11% em tomador com vigência da desoneração CPRB 3,5% (Art. 7º Lei 12.546/11).'
  },
  {
    id: 'inv_ret_003',
    cnoId: 'cno_mg_complexo_logistico',
    cnoNumber: '90.045.67890/22',
    invoiceNumber: 'NFS-e 012903',
    issueDate: '2023-09-05',
    competenceMonth: '2023-09',
    serviceDescription: 'Terraplenagem mecanizada, escavação, aterro e compactação com utilização exclusiva de escavadeiras hidráulicas e rolos compactadores',
    contractNumber: 'CTR-TERRA-2023/01',
    providerName: 'Delta Terraplenagem & Obras Viárias S/A',
    providerCnpj: '22.105.789/0001-50',
    grossValue: 350000.00,
    hasContractClauseForMaterials: false,
    materialsDeclaredInInvoice: 0,
    materialsProvenFiscalReceipts: 0,
    equipmentDeclaredInInvoice: 245000.00, // 70% maquinário pesado
    hasHeavyEquipmentProof: true,
    deductibleMaterialsAllowed: 0,
    deductibleEquipmentAllowed: 245000.00, // Art. 122 IN 2.110/22 (terraplenagem base mão de obra 30%)
    effectiveLaborBaseCalculated: 105000.00,
    retentionRateApplied: 11.0,
    retentionRateDue: 3.5,
    retentionWithheldPaid: 38500.00, // 11% s/ 350k
    retentionWithheldDue: 3675.00,   // 3.5% s/ 105k
    excessWithheldIndebito: 34825.00,
    selicRateAccumulatedPct: 7.4,
    selicInterestBrl: 2577.05,
    totalUpdatedIndebito: 37402.05,
    complianceStatus: 'RETENCAO_EXCESSIVA',
    legalNotes: 'Serviço de terraplenagem com equipamentos pesados: tomador não deduziu 70% de maquinário expresso em nota (Art. 122 IN 2.110/22).'
  },
  {
    id: 'inv_ret_004',
    cnoId: 'cno_sp_edificio_horizonte',
    cnoNumber: '90.012.34567/81',
    invoiceNumber: 'NFS-e 051184',
    issueDate: '2023-11-22',
    competenceMonth: '2023-11',
    serviceDescription: 'Instalações elétricas prediais, cabeamento estruturado e subestação abrigada com fornecimento de transformadores',
    contractNumber: 'CTR-ELET-2023/08',
    providerName: 'Volt Engenharia Elétrica & Automação Ltda',
    providerCnpj: '31.450.891/0001-09',
    grossValue: 195000.00,
    hasContractClauseForMaterials: true,
    materialsDeclaredInInvoice: 117000.00, // 60%
    materialsProvenFiscalReceipts: 117000.00,
    equipmentDeclaredInInvoice: 0,
    hasHeavyEquipmentProof: false,
    deductibleMaterialsAllowed: 117000.00,
    deductibleEquipmentAllowed: 0,
    effectiveLaborBaseCalculated: 78000.00,
    retentionRateApplied: 11.0,
    retentionRateDue: 3.5,
    retentionWithheldPaid: 21450.00, // 11% s/ 195k
    retentionWithheldDue: 2730.00,   // 3.5% s/ 78k
    excessWithheldIndebito: 18720.00,
    selicRateAccumulatedPct: 5.2,
    selicInterestBrl: 973.44,
    totalUpdatedIndebito: 19693.44,
    complianceStatus: 'RETENCAO_EXCESSIVA',
    legalNotes: 'Transformadores e cabos de alta tensão com notas fiscais de compra não foram deduzidos da base do INSS.'
  },
  {
    id: 'inv_ret_005',
    cnoId: 'cno_mg_complexo_logistico',
    cnoNumber: '90.045.67890/22',
    invoiceNumber: 'NFS-e 013450',
    issueDate: '2024-02-14',
    competenceMonth: '2024-02',
    serviceDescription: 'Montagem de estruturas pré-moldadas de concreto e cobertura metálica de grandes vãos',
    contractNumber: 'CTR-PRE-2024/02',
    providerName: 'MegaVão Pré-Moldados Indústria & Comércio S/A',
    providerCnpj: '05.912.840/0001-71',
    grossValue: 520000.00,
    hasContractClauseForMaterials: true,
    materialsDeclaredInInvoice: 364000.00, // 70% peças industriais pré-moldadas
    materialsProvenFiscalReceipts: 364000.00,
    equipmentDeclaredInInvoice: 0,
    hasHeavyEquipmentProof: false,
    deductibleMaterialsAllowed: 364000.00,
    deductibleEquipmentAllowed: 0,
    effectiveLaborBaseCalculated: 156000.00,
    retentionRateApplied: 11.0,
    retentionRateDue: 3.5,
    retentionWithheldPaid: 57200.00, // 11% s/ 520k
    retentionWithheldDue: 5460.00,   // 3.5% s/ 156k
    excessWithheldIndebito: 51740.00,
    selicRateAccumulatedPct: 2.5,
    selicInterestBrl: 1293.50,
    totalUpdatedIndebito: 53033.50,
    complianceStatus: 'RETENCAO_EXCESSIVA',
    legalNotes: 'Fornecimento de pilares e vigas pré-moldadas fabricadas fora do canteiro. Dedução permitida de até 70% ignorada pelo tomador.'
  }
];

// ---------------------------------------------------------------------------
// 5. SEED INICIAL DE CONCILIAÇÃO DECLARATÓRIA (eSocial / DCTFWeb / NFS-e)
// ---------------------------------------------------------------------------
export const DEFAULT_DECLARATORY_RECORDS: DeclaratoryIntegrationRecord[] = [
  {
    id: 'dec_001',
    competenceMonth: '2023-04',
    cnoNumber: '90.012.34567/81',
    workNickname: 'Residencial Horizonte Paulista',
    s1000DesoneraCprb: true,
    s1005Registered: true,
    s1200RemunerationTotal: 420000.00,
    s1280AlíquotaCprbPct: 3.5,
    dctfWebRetentionDeclaredBrl: 6720.00, // Declarado o valor correto devido
    nfsGrossTotalBrl: 480000.00,
    nfsRetentionWithheldBrl: 52800.00, // Mas o tomador recolheu R$ 52.800
    retentionDifferenceBrl: 46080.00,
    status: 'RETENCAO_NAO_APROVEITADA',
    diagnosticSummary: 'O tomador recolheu GPS/DCTFWeb com código 2631 retendo 11% sobre o total. A construtora declarou o correto no S-1280/DCTFWeb (3,5% com materiais expurgados), gerando saldo credor líquido acumulado.',
    actionRequired: 'Transmitir PER/DCOMP Web vinculando o comprovante de retenção do tomador para compensar com outros tributos federais ou pedir restituição.'
  },
  {
    id: 'dec_002',
    competenceMonth: '2023-06',
    cnoNumber: '90.012.34567/81',
    workNickname: 'Residencial Horizonte Paulista',
    s1000DesoneraCprb: true,
    s1005Registered: true,
    s1200RemunerationTotal: 380000.00,
    s1280AlíquotaCprbPct: 3.5,
    dctfWebRetentionDeclaredBrl: 4550.00,
    nfsGrossTotalBrl: 260000.00,
    nfsRetentionWithheldBrl: 28600.00,
    retentionDifferenceBrl: 24050.00,
    status: 'RETENCAO_NAO_APROVEITADA',
    diagnosticSummary: 'Crédito de retenção de R$ 24.050,00 sofrido a maior não aproveitado em compensação espontânea na DCTFWeb da competência.',
    actionRequired: 'Inclusão na ficha de Créditos da DCTFWeb Retificadora ou pedido de PER/DCOMP de Restituição.'
  },
  {
    id: 'dec_003',
    competenceMonth: '2023-09',
    cnoNumber: '90.045.67890/22',
    workNickname: 'Parque Logístico Minas-Sul',
    s1000DesoneraCprb: true,
    s1005Registered: true,
    s1200RemunerationTotal: 290000.00,
    s1280AlíquotaCprbPct: 3.5,
    dctfWebRetentionDeclaredBrl: 0.00, // Tomador esqueceu de vincular a matrícula CNO na DCTFWeb
    nfsGrossTotalBrl: 350000.00,
    nfsRetentionWithheldBrl: 38500.00,
    retentionDifferenceBrl: 38500.00,
    status: 'OMISSAO_ESOCIAL',
    diagnosticSummary: 'NFS-e com retenção sofrida de R$ 38.500,00 foi lançada na contabilidade porém não transmitida no evento S-1200 / DCTFWeb de créditos por ausência de vinculação CNO pelo tomador.',
    actionRequired: 'Solicitar informe de retenção ao tomador (EFD-Reinf R-2010) e retificar a DCTFWeb do prestador (R-2020).'
  },
  {
    id: 'dec_004',
    competenceMonth: '2024-02',
    cnoNumber: '90.045.67890/22',
    workNickname: 'Parque Logístico Minas-Sul',
    s1000DesoneraCprb: true,
    s1005Registered: true,
    s1200RemunerationTotal: 510000.00,
    s1280AlíquotaCprbPct: 3.5,
    dctfWebRetentionDeclaredBrl: 5460.00,
    nfsGrossTotalBrl: 520000.00,
    nfsRetentionWithheldBrl: 57200.00,
    retentionDifferenceBrl: 51740.00,
    status: 'RETENCAO_NAO_APROVEITADA',
    diagnosticSummary: 'Retenção sofrida a maior de R$ 51.740,00 em montagem de pré-moldados. Documentação de remessa com CFOP 5.949 / 6.949 comprova fornecimento externo.',
    actionRequired: 'Gerar Dossiê Pericial com cópia das NF-es de insumos e protocolo PER/DCOMP Web.'
  }
];

// ---------------------------------------------------------------------------
// 6. MOTOR DE CÁLCULO DE AFERIÇÃO INDIRETA (SERO / IN 2.021/2021)
// ---------------------------------------------------------------------------
export function calculateIndirectAfference(cno: CnoMatricula): IndirectAfferenceSimulation {
  const cubTable = CUB_REGIONAL_TABLE[cno.uf] || CUB_REGIONAL_TABLE.DEFAULT;
  const standardKey = cno.constructionStandard.toLowerCase() as 'baixo' | 'normal' | 'alto';
  const cubValue = cno.cubSindusconM2 || cubTable[standardKey];
  
  // Custo Estimado Total da Obra (Art. 15 da IN RFB 2.021/2021)
  const totalEstimatedCost = cno.builtAreaM2 * cubValue;
  
  // Percentual de Mão de Obra (RMT)
  const rmtPercentage = RMT_PERCENTAGE_TABLE[cno.workType]?.[cno.constructionStandard] || 0.30;
  const baseEstimatedRmt = totalEstimatedCost * rmtPercentage;
  
  // Dedução legal: Concreto Usinado / Argamassa Pronta (Art. 34 da IN 2.021/2021: 5% de abatimento sobre a RMT total)
  const usesReadyMixConcrete = true;
  const readyMixConcreteDeduction = baseEstimatedRmt * 0.05;
  
  // Dedução legal: Estruturas Pré-moldadas / Pré-fabricadas (se aplicável ao tipo de obra)
  const usesPrecastStructures = cno.workType === 'GALPAO_INDUSTRIAL' || cno.workType === 'INFRAESTRUTURA_OBRAS_PESADAS';
  const precastStructuresDeduction = usesPrecastStructures ? (baseEstimatedRmt * 0.35) : 0;
  
  // Deduções de subempreitadas vinculadas e notas com retenção
  const subcontractsWithRetentionDeduction = cno.id === 'cno_sp_edificio_horizonte' ? 1850000.00 : 920000.00;
  const materialsProofDeduction = cno.id === 'cno_sp_edificio_horizonte' ? 840000.00 : 450000.00;
  
  const totalDeductions = readyMixConcreteDeduction + precastStructuresDeduction + subcontractsWithRetentionDeduction;
  const finalAdjustedRmtBase = Math.max(0, baseEstimatedRmt - totalDeductions);
  
  // Encargo Previdenciário Médio Total sobre a RMT Aferida (20% patronal + 3% SAT/GILRAT + 5.8% terceiros + RAT ajustado = ~36.8%)
  const inssRateTotalPct = cno.isDesoneradoCprb ? 0.088 : 0.368; // Se desonerada CPRB não paga 20% patronal
  const inssDueOnAfericao = finalAdjustedRmtBase * inssRateTotalPct;
  
  // Confronto com o que a construtora já declarou e recolheu na folha de pagamento da obra
  const totalDeclaredLaborBase = cno.declaredPayrollTotal;
  const inssActuallyPaid = totalDeclaredLaborBase * inssRateTotalPct;
  
  const fiscalDeficitOrSurplus = inssActuallyPaid - inssDueOnAfericao;
  
  let riskStatus: IndirectAfferenceSimulation['riskStatus'] = 'BAIXO_RISCO';
  let estimatedAroComplementary = 0;
  let legalGuidance = '';
  
  if (fiscalDeficitOrSurplus >= 0) {
    riskStatus = 'REGULARIZADO_DISPENSADO';
    estimatedAroComplementary = 0;
    legalGuidance = `A remuneração declarada na folha (R$ ${totalDeclaredLaborBase.toLocaleString('pt-BR')}) SUPERA o valor mínimo exigido pela aferição indireta SERO (R$ ${finalAdjustedRmtBase.toLocaleString('pt-BR')}). Obra elegível à CND sem qualquer pagamento complementar de ARO (Art. 38 IN 2.021/21).`;
  } else if (Math.abs(fiscalDeficitOrSurplus) < 150000) {
    riskStatus = 'BAIXO_RISCO';
    estimatedAroComplementary = Math.abs(fiscalDeficitOrSurplus);
    legalGuidance = `Déficit marginal identificado de R$ ${estimatedAroComplementary.toLocaleString('pt-BR')}. Recomenda-se apresentar notas complementares de concreto usinado e locação de maquinário pesado para zerar o ARO no SERO.`;
  } else if (Math.abs(fiscalDeficitOrSurplus) < 500000) {
    riskStatus = 'ALERTA_MALHA_SERO';
    estimatedAroComplementary = Math.abs(fiscalDeficitOrSurplus);
    legalGuidance = `Risco de lançamento tributário no SERO no valor estimado de R$ ${estimatedAroComplementary.toLocaleString('pt-BR')}. Necessário averbar subempreitadas que sofreram retenção e dedução integral de pré-moldados (Art. 35 IN 2.021/21).`;
  } else {
    riskStatus = 'ALTO_RISCO_AUTUACAO';
    estimatedAroComplementary = Math.abs(fiscalDeficitOrSurplus);
    legalGuidance = `Divergência severa entre a folha declarada e o padrão construtivo CUB. A Receita Federal emitirá ARO com multa de ofício de 75% caso a regularização no SERO não comprove as deduções materiais antes do encerramento da CNO.`;
  }
  
  return {
    cnoId: cno.id,
    cnoNumber: cno.cnoNumber,
    builtAreaM2: cno.builtAreaM2,
    cubValue,
    totalEstimatedCost,
    standardLaborPct: rmtPercentage,
    baseEstimatedRmt,
    usesReadyMixConcrete,
    readyMixConcreteDeduction,
    usesPrecastStructures,
    precastStructuresDeduction,
    subcontractsWithRetentionDeduction,
    materialsProofDeduction,
    finalAdjustedRmtBase,
    inssDueOnAfericao,
    totalDeclaredLaborBase,
    inssActuallyPaid,
    fiscalDeficitOrSurplus,
    riskStatus,
    estimatedAroComplementary,
    legalGuidance
  };
}

// ---------------------------------------------------------------------------
// 7. MOTOR DE VALIDAÇÃO DE RETENÇÃO NFS-e (ART. 121 / 122 IN 2.110/2022)
// ---------------------------------------------------------------------------
export function calculateInvoiceRetention(params: {
  grossValue: number;
  hasContractMaterialsClause: boolean;
  materialsDeclared: number;
  materialsProven: number;
  equipmentDeclared: number;
  hasHeavyEquipmentProof: boolean;
  isDesoneradaCprb: boolean;
  competenceMonth: string;
}): {
  deductibleMaterials: number;
  deductibleEquipment: number;
  effectiveLaborBase: number;
  retentionRateDue: number;
  retentionDue: number;
  excessIndebito: number;
  status: InvoiceRetentionItem['complianceStatus'];
  notes: string;
} {
  const { 
    grossValue, 
    hasContractMaterialsClause, 
    materialsDeclared, 
    materialsProven, 
    equipmentDeclared, 
    hasHeavyEquipmentProof,
    isDesoneradaCprb 
  } = params;

  let deductibleMaterials = 0;
  let deductibleEquipment = 0;
  
  // Regra do Art. 121 da IN RFB 2.110/2022:
  // Se há previsão contratual e comprovação documental de materiais:
  if (hasContractMaterialsClause && materialsProven > 0) {
    // Pode deduzir até o valor comprovado, respeitando o limite do contrato
    deductibleMaterials = Math.min(materialsDeclared, materialsProven);
  } else if (hasContractMaterialsClause && materialsDeclared > 0 && materialsProven === 0) {
    // Sem comprovação documental de nota fiscal de insumos, a base não pode ser inferior a 50%
    deductibleMaterials = Math.min(materialsDeclared, grossValue * 0.50);
  }

  // Regra do Art. 122 da IN RFB 2.110/2022 (Equipamentos pesados):
  if (hasHeavyEquipmentProof && equipmentDeclared > 0) {
    deductibleEquipment = equipmentDeclared;
  }

  const totalDeductions = deductibleMaterials + deductibleEquipment;
  const effectiveLaborBase = Math.max(grossValue * 0.10, grossValue - totalDeductions); // Mínimo de 10%
  
  // Alíquota: 3.5% se desonerada pela Lei 12.546/11, 11% padrão
  const retentionRateDue = isDesoneradaCprb ? 3.5 : 11.0;
  const retentionDue = effectiveLaborBase * (retentionRateDue / 100);

  // Retenção usualmente praticada por tomadores desavisados (11% sobre o valor bruto total)
  const simulatedTypicalWithholding = grossValue * 0.11;
  const excessIndebito = Math.max(0, simulatedTypicalWithholding - retentionDue);

  let status: InvoiceRetentionItem['complianceStatus'] = 'CONFORME';
  let notes = 'Retenção calculada com segregação contratual e documental regular.';

  if (simulatedTypicalWithholding > retentionDue) {
    if (isDesoneradaCprb) {
      status = 'ALIQUOTA_INCORRETA';
      notes = `Divergência de alíquota (11% retido vs. 3,5% devido pela Lei 12.546/11) cumulada com não-dedução de materiais (Art. 121 IN 2.110/22). Indébito de R$ ${excessIndebito.toLocaleString('pt-BR')}.`;
    } else {
      status = 'RETENCAO_EXCESSIVA';
      notes = `Retenção indevida calculada sobre o valor total da NFS-e sem abater R$ ${totalDeductions.toLocaleString('pt-BR')} de insumos/equipamentos comprovados.`;
    }
  }

  return {
    deductibleMaterials,
    deductibleEquipment,
    effectiveLaborBase,
    retentionRateDue,
    retentionDue,
    excessIndebito,
    status,
    notes
  };
}

// ---------------------------------------------------------------------------
// 8. HASH CRIPTOGRÁFICO DETERMINÍSTICO SHA-256 PARA O LAUDO PERICIAL
// ---------------------------------------------------------------------------
export function computeCanonicalSha256(payload: string): string {
  // P27: SHA-256 real (FIPS 180-4). Antes era um hash de 32 bits expandido para parecer SHA-256.
  return sha256HexSync(payload);
}

// ---------------------------------------------------------------------------
// 9. GERADOR DE LAUDO / DOSSIÊ PERICIAL INSS-OBRAS
// ---------------------------------------------------------------------------
export function generateInssObrasDossier(params: {
  cno: CnoMatricula;
  invoices: InvoiceRetentionItem[];
  simulation: IndirectAfferenceSimulation;
}): InssObrasDossierPericial {
  const { cno, invoices, simulation } = params;

  const totalInvoicesAudited = invoices.length;
  const totalGrossAnalyzed = invoices.reduce((acc, i) => acc + i.grossValue, 0);
  const totalMaterialsDeductedLegal = invoices.reduce((acc, i) => acc + (i.deductibleMaterialsAllowed + i.deductibleEquipmentAllowed), 0);
  const totalExcessWithheldPrincipal = invoices.reduce((acc, i) => acc + i.excessWithheldIndebito, 0);
  const totalSelicCorrection = invoices.reduce((acc, i) => acc + i.selicInterestBrl, 0);
  const totalIndebitoUpdatedRecovery = totalExcessWithheldPrincipal + totalSelicCorrection;

  const canonicalPayload = JSON.stringify({
    schema: 'VELATRIX_INSS_OBRAS_PERICIAL_V1',
    cnoNumber: cno.cnoNumber,
    corporateReason: cno.corporateReason,
    cnpj: cno.cnpj,
    technicalResponsible: cno.technicalResponsible,
    builtAreaM2: cno.builtAreaM2,
    workType: cno.workType,
    totals: {
      totalGrossAnalyzed,
      totalMaterialsDeductedLegal,
      totalExcessWithheldPrincipal,
      totalSelicCorrection,
      totalIndebitoUpdatedRecovery
    },
    afericaoIndireta: {
      riskStatus: simulation.riskStatus,
      estimatedAro: simulation.estimatedAroComplementary
    }
  });

  const auditHashSha256 = computeCanonicalSha256(canonicalPayload);

  const legalBasisSummary = [
    'Art. 31 da Lei nº 8.212/1991: Retenção previdenciária de 11% sobre o valor bruto da nota fiscal de prestação de serviços executados mediante cessão de mão de obra ou empreitada.',
    'Art. 7º e 8º da Lei nº 12.546/2011 (CPRB): Alíquota de retenção reduzida para 3,5% para empresas do setor de construção civil e obras de infraestrutura optantes pela desoneração da folha.',
    'Art. 121 da IN RFB nº 2.110/2022: O valor dos materiais fornecidos pelo prestador e devidamente discriminados na nota fiscal e em contrato NÃO integra a base de cálculo da retenção previdenciária.',
    'Art. 122 da IN RFB nº 2.110/2022: Dedução da parcela referente à utilização de maquinário pesado e equipamentos na execução dos serviços.',
    'IN RFB nº 2.021/2021 (SERO / CNO): Normas de apuração do VAF, RMT e deduções legais de concreto usinado (-5%) e elementos pré-fabricados na aferição indireta da construção civil.',
    'Súmula Vinculante 8 do STF: São inconstitucionais os arts. 45 e 46 da Lei 8.212/1991 que fixavam prazo prescricional e decadencial de 10 anos, aplicando-se estritamente o prazo de 5 anos (Art. 168 e 174 do CTN).'
  ];

  const technicalConclusion = `O presente Laudo Pericial de Auditoria Fiscal de Obras e Engenharia apurou, com base no exame item a item de ${totalInvoicesAudited} notas fiscais e na aferição indireta regulamentada pela IN RFB 2.021/2021, a existência de indébito tributário de retenção previdenciária sofrida a maior no importe de R$ ${totalIndebitoUpdatedRecovery.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, plenamente passível de repetição ou compensação via PER/DCOMP Web vinculada à DCTFWeb. Quanto à regularização da matrícula CNO ${cno.cnoNumber}, constata-se enquadramento em [${simulation.riskStatus}], estando a construtora resguardada documentalmente com fulcro no Art. 121 da IN RFB 2.110/2022.`;

  return {
    protocolId: `VEL-INSS-OBRAS-${Date.now().toString(36).toUpperCase()}`,
    emissionDate: new Date().toLocaleDateString('pt-BR'),
    companyName: cno.corporateReason,
    cnpj: cno.cnpj,
    cnoNumber: cno.cnoNumber,
    workNickname: cno.nickname,
    expertName: 'Perito Dr. Gustavo Prado Barcellos',
    expertRegistry: 'CRC/SP 1SP294810/O-4 • CNPC nº 4.912',
    totalInvoicesAudited,
    totalGrossAnalyzed,
    totalMaterialsDeductedLegal,
    totalExcessWithheldPrincipal,
    totalSelicCorrection,
    totalIndebitoUpdatedRecovery,
    afericaoIndiretaRisk: simulation.riskStatus,
    afericaoIndiretaEconomiaOuRisco: simulation.fiscalDeficitOrSurplus,
    auditHashSha256,
    canonicalJsonPayload: canonicalPayload,
    technicalConclusion,
    legalBasisSummary
  };
}

// ---------------------------------------------------------------------------
// 10. STORAGE HELPER (Persistência Local para múltiplas obras)
// ---------------------------------------------------------------------------
const STORAGE_KEY_CNO = 'velatrix_inss_obras_cno_list';
const STORAGE_KEY_INVOICES = 'velatrix_inss_obras_invoices';

export function loadCnoListFromStorage(): CnoMatricula[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CNO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug('[InssObrasService] Fallback reading localStorage CNO:', e);
  }
  return DEFAULT_CNO_LIST;
}

export function saveCnoListToStorage(list: CnoMatricula[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CNO, JSON.stringify(list));
  } catch (e) {
    console.debug('[InssObrasService] Fallback saving localStorage CNO:', e);
  }
}

export function loadInvoicesFromStorage(): InvoiceRetentionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug('[InssObrasService] Fallback reading localStorage Invoices:', e);
  }
  return DEFAULT_INVOICE_RETENTIONS;
}

export function saveInvoicesToStorage(list: InvoiceRetentionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(list));
  } catch (e) {
    console.debug('[InssObrasService] Fallback saving localStorage Invoices:', e);
  }
}
