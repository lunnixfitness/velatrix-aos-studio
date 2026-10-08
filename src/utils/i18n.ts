// Comprehensive Internationalization (i18n) & Regional Formatting Utility for AOS
import { SupportedLanguage, SupportedCurrency, FiscalJurisdiction } from '../types/aos';

export type { SupportedLanguage, SupportedCurrency, FiscalJurisdiction };

export const FX_RATES_TO_BRL: Record<SupportedCurrency, number> = {
  BRL: 1.0,
  USD: 5.20,
  EUR: 5.65
};

export const getLocale = (language: SupportedLanguage): string => {
  switch (language) {
    case 'es':
      return 'es-ES';
    case 'en':
      return 'en-US';
    case 'pt':
    default:
      return 'pt-BR';
  }
};

export const formatCurrency = (
  amountInBase: number,
  targetCurrency: SupportedCurrency = 'BRL',
  language: SupportedLanguage = 'pt'
): string => {
  const locale = getLocale(language);
  const rate = FX_RATES_TO_BRL[targetCurrency] || 1.0;
  const converted = amountInBase / rate;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: targetCurrency,
    maximumFractionDigits: 0
  }).format(converted);
};

export const formatNumber = (
  value: number,
  language: SupportedLanguage = 'pt',
  decimals: number = 0
): string => {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercent = (
  value: number,
  language: SupportedLanguage = 'pt',
  decimals: number = 1
): string => {
  const locale = getLocale(language);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value) + '%';
};

export const formatDate = (
  isoStringOrDate: string | Date,
  language: SupportedLanguage = 'pt',
  includeTime: boolean = true
): string => {
  const locale = getLocale(language);
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : {})
  }).format(date);
};

export const getComplianceBadgeText = (jurisdiction: FiscalJurisdiction): { title: string; subtitle: string; iconLabel: string } => {
  switch (jurisdiction) {
    case 'US':
      return {
        title: 'SOC 2 / CCPA',
        subtitle: 'Enterprise Guard',
        iconLabel: 'SOC 2 & CCPA OK'
      };
    case 'EU':
      return {
        title: 'GDPR / AI Act',
        subtitle: 'EU Reg. Compliant',
        iconLabel: 'GDPR & AI Act OK'
      };
    case 'BR':
    default:
      return {
        title: 'LGPD (Lei 13.709)',
        subtitle: 'Soberania Dados',
        iconLabel: 'LGPD OK'
      };
  }
};

export const TRANSLATIONS = {
  pt: {
    // Slogans & Core Brand
    slogan: 'Sistema Operacional Autônomo',
    multiTenantLabel: 'Multi-Tenant v4.8',
    tenantDefault: 'Nexus Indústria S/A',
    zeroGuiSub: 'Zero-GUI & Proof of Intent',

    // Header & Telemetry
    healthGraph: 'Saúde do Grafo',
    nominalState: 'Nominal',
    proofOfIntent: 'Proof of Intent',
    zeroTrustOk: 'Zero-Trust OK',
    intelligence: 'Inteligência',
    deliberating: 'Deliberando...',
    multiSigActive: 'Multi-Sig Secp256k1 Ativo',
    astInspect: 'AST JSON',
    auditBadge: 'Auditoria',

    // Navigation Tabs
    dashboard: 'Dashboard Operacional',
    riskDiagnosis: 'Raio-X de Risco & ROI',
    erpConnector: 'Conector ERP & Webhook',
    onboarding: 'Onboarding de Cliente',
    governance: 'Painel de Governança & Risco',
    audit: 'Trilha de Auditoria / Ledger',

    // Event Stream Bar
    eventStream: 'Barramento de Eventos de Negócios',
    realTimeStream: 'stream em tempo real',
    injectScenario: 'Injetar Cenário:',
    eventPlaceholder: 'Descreva um evento, crise ou anexe nota fiscal/contrato...',
    attachDocument: 'Anexar Documento / OCR de Nota Fiscal',
    attachDocTitle: 'Anexar Documento & OCR',
    uploadLocalFile: 'Carregar Arquivo do Computador...',
    uploadSubtext: 'PDF, Imagem, XML ou DANFE',
    processing: 'Processando...',
    processAos: 'Processar AOS',
    ocrScanningTitle: 'Processando OCR em Borda:',
    ocrScanningSub: 'Extraindo entidades, identificadores fiscais e validando hash criptográfico...',
    source: 'Origem',
    immediateImpacts: 'Impactos Imediatos:',

    // Scenarios
    scenarios: {
      fraud: 'Interceptação Fraude PIX',
      supplier: 'Crise de Fornecedor Crítico',
      demand: 'Pico de Demanda B2B (+65%)',
      customs: 'Retenção na Alfândega Santos',
      fx: 'Volatilidade Cambial (Hedge USD)',
      ransomware: 'Ransomware na Transportadora',
      healthcare: 'Ruptura Cadeia de Frio Farma',
      services: 'Sobrecarga de Capacidade TI'
    },

    // Zero-GUI Card
    decisionCardTitle: 'Card de Decisão Tática Autônoma',
    confidenceScore: 'Grau de Confiança do Enxame',
    financialExposure: 'Exposição Financeira Estimada',
    riskScore: 'Risco Operacional',
    kpisAnalyzed: 'KPIs e Métricas Impactadas',
    invariantsValidated: 'Invariantes de Negócio Validadas',
    suggestedTactics: 'Táticas e Ações Propostas pelo Enxame',
    estimatedCost: 'Custo Estimado:',
    impactScore: 'Score de Eficácia:',
    autonomousWorkflow: 'Execução Autônoma:',
    approveAndSign: 'Assinar e Executar com Multi-Sig',
    quarantineAction: 'Acionar Quarentena Preventiva',
    adjustParameters: 'Ajustar Diretrizes / Instrução Humana',
    adjustPlaceholder: 'Ex: Priorizar margem de lucro ao invés de prazo de entrega...',
    recalculate: 'Recalcular Decisão',
    reasoningTrail: 'Trilha de Raciocínio dos Agentes:',
    humanReviewRequired: 'Requer aprovação executiva devido ao limiar de risco.',

    // Governance & Multi-Jurisdiction Tax
    governanceTitle: 'Painel de Governança, Risco & Invariantes Lógicas',
    governanceSubtitle: 'Defina as fronteiras de autonomia do AOS. O sistema nunca executará ações acima do teto de risco sem colher as assinaturas criptográficas requeridas pela política do conselho.',
    saveGuidelines: 'Salvar Diretrizes',
    backToDashboard: 'Voltar ao Dashboard',
    jurisdictionSelector: 'Jurisdição Fiscal & Compliance:',
    jurisdictionBR: 'Brasil (SPED / NF-e 4.0 / Reforma Tributária)',
    jurisdictionUS: 'Estados Unidos (US Sales Tax / IRS / SOC 2)',
    jurisdictionEU: 'União Europeia (VAT OSS / VIES / GDPR)',
    maxAutonomousBudget: 'Teto do Orçamento de Risco Autônomo',
    multiSigQuorum: 'Quórum Mínimo de Assinaturas (Multi-Sig)',
    multiSigApprovers: 'Matriz de Aprovadores Executivos (Multi-Sig Key Ring)',
    activeInvariants: 'Invariantes Lógicas Ativas do Conselho',
    threshold: 'Limiar:',
    active: 'Ativo',
    inactive: 'Inativo',
    mandatory: 'Obrigatório',
    verifiedKey: 'Verificado ✓',

    // Fiscal Modules
    taxEngineTitleBR: 'Motor Fiscal Nativo Brasil (SPED, NF-e 4.0 & Reforma)',
    taxEngineTitleUS: 'Motor Fiscal Estados Unidos (Multi-State Sales Tax & SOC 2)',
    taxEngineTitleEU: 'Motor Fiscal União Europeia (Intra-EU VAT OSS & GDPR)',
    revenueBase: 'Base de Faturamento Mensal:',
    taxCredits: 'Créditos Fiscais Reconciliados:',
    totalPayable: 'Total a Recolher:',
    auditTaxCross: 'Auditar Cruzamento Fiscal',
    nfeEmitterTab: 'Emissão NF-e 4.0',
    taxCalculationTab: 'Apuração Tributária',
    spedStatusTab: 'Módulos SPED & eSocial',
    authorized: 'AUTORIZADA',
    issuedAt: 'Emitida em:',
    recipient: 'Destinatário:',
    sefazKey: 'Chave SEFAZ:',

    // Feedback Loop & Learning
    feedbackTitle: 'Memória Evolutiva & Aprendizado Contínuo',
    feedbackSubtitle: 'Registro de parâmetros e diretrizes absorvidas de instruções humanas executivas.',
    activeLearned: 'Preferências Ativas:',

    // Audit Trail
    auditTrailTitle: 'Livro-Razão Imutável de Decisões & Ledger Criptográfico',
    auditTrailSubtitle: 'Trilha completa de eventos, votos dos agentes e assinaturas digitais Secp256k1.',
    txReceipt: 'Recibo Criptográfico:',
    signaturesCollected: 'Assinaturas Colhidas:',

    // Onboarding
    onboardingTitle: 'Onboarding da Empresa Autônoma',
    onboardingSubtitle: 'Configure seu tenant, escolha a jurisdição tributária e conectores de ERP.',
    step1: '1. Perfil Corporativo',
    step2: '2. Conectores de ERP',
    step3: '3. Barramento & IA',
    companyName: 'Razão Social / Nome da Empresa',
    companyDoc: 'CNPJ / Tax ID / EIN',
    countryJurisdiction: 'País e Jurisdição Fiscal',
    industrySector: 'Setor de Atuação',
    completeProvisioning: 'Concluir Provisionamento da Empresa',
    nextStep: 'Próxima Etapa',
    previousStep: 'Voltar',

    // Footer
    footerRights: 'VELATRIX • Sistema Operacional Autônomo — Zero-GUI Enterprise Intelligence'
  },

  en: {
    // Slogans & Core Brand
    slogan: 'Autonomous Operating System',
    multiTenantLabel: 'Multi-Tenant v4.8',
    tenantDefault: 'Nexus Manufacturing Inc.',
    zeroGuiSub: 'Zero-GUI & Proof of Intent',

    // Header & Telemetry
    healthGraph: 'Graph Health',
    nominalState: 'Nominal',
    proofOfIntent: 'Proof of Intent',
    zeroTrustOk: 'Zero-Trust OK',
    intelligence: 'Intelligence',
    deliberating: 'Deliberating...',
    multiSigActive: 'Multi-Sig Secp256k1 Active',
    astInspect: 'AST JSON',
    auditBadge: 'Audit',

    // Navigation Tabs
    dashboard: 'Operational Dashboard',
    riskDiagnosis: 'Risk & ROI Diagnosis',
    erpConnector: 'ERP & Webhook Connector',
    onboarding: 'Client Onboarding',
    governance: 'Governance & Risk Panel',
    audit: 'Audit Trail / Ledger',

    // Event Stream Bar
    eventStream: 'Enterprise Event Bus',
    realTimeStream: 'real-time stream',
    injectScenario: 'Inject Scenario:',
    eventPlaceholder: 'Describe an enterprise event, disruption, or attach an invoice/contract...',
    attachDocument: 'Attach Document / Invoice OCR',
    attachDocTitle: 'Attach Document & OCR',
    uploadLocalFile: 'Upload File from Computer...',
    uploadSubtext: 'PDF, Image, XML or Invoice',
    processing: 'Processing...',
    processAos: 'Process AOS',
    ocrScanningTitle: 'Processing Edge OCR:',
    ocrScanningSub: 'Extracting entities, tax IDs, and validating cryptographic hash...',
    source: 'Source',
    immediateImpacts: 'Immediate Impacts:',

    // Scenarios
    scenarios: {
      fraud: 'Wire Transfer / PIX Fraud Intercept',
      supplier: 'Critical Supplier Disruption',
      demand: 'B2B Demand Surge (+65%)',
      customs: 'Port Customs Clearance Delay',
      fx: 'Currency FX Shock (USD Hedge)',
      ransomware: 'Logistics Carrier Ransomware',
      healthcare: 'Pharma Cold Chain Failure',
      services: 'IT Professional Capacity Crunch'
    },

    // Zero-GUI Card
    decisionCardTitle: 'Autonomous Tactical Decision Card',
    confidenceScore: 'Swarm Consensus Confidence',
    financialExposure: 'Estimated Financial Exposure',
    riskScore: 'Operational Risk',
    kpisAnalyzed: 'Impacted KPIs & Metrics',
    invariantsValidated: 'Validated Business Invariants',
    suggestedTactics: 'Proposed Tactics & Action Plans',
    estimatedCost: 'Estimated Cost:',
    impactScore: 'Efficacy Score:',
    autonomousWorkflow: 'Autonomous Execution:',
    approveAndSign: 'Sign & Execute with Multi-Sig',
    quarantineAction: 'Trigger Preventive Quarantine',
    adjustParameters: 'Adjust Guidelines / Human Instruction',
    adjustPlaceholder: 'E.g., Prioritize profit margins over delivery deadlines...',
    recalculate: 'Recalculate Decision',
    reasoningTrail: 'Agent Swarm Reasoning Trail:',
    humanReviewRequired: 'Requires executive approval due to risk threshold.',

    // Governance & Multi-Jurisdiction Tax
    governanceTitle: 'Governance, Risk & Logical Invariants Panel',
    governanceSubtitle: 'Define the autonomy boundaries of AOS. The system will never execute actions exceeding the risk cap without required cryptographic signatures.',
    saveGuidelines: 'Save Guidelines',
    backToDashboard: 'Back to Dashboard',
    jurisdictionSelector: 'Tax Jurisdiction & Compliance:',
    jurisdictionBR: 'Brazil (SPED / NF-e 4.0 / Tax Reform)',
    jurisdictionUS: 'United States (US Sales Tax / IRS / SOC 2)',
    jurisdictionEU: 'European Union (VAT OSS / VIES / GDPR)',
    maxAutonomousBudget: 'Autonomous Risk Budget Cap',
    multiSigQuorum: 'Minimum Signature Quorum (Multi-Sig)',
    multiSigApprovers: 'Executive Approvers Matrix (Multi-Sig Key Ring)',
    activeInvariants: 'Active Board Logical Invariants',
    threshold: 'Threshold:',
    active: 'Active',
    inactive: 'Inactive',
    mandatory: 'Mandatory',
    verifiedKey: 'Verified ✓',

    // Fiscal Modules
    taxEngineTitleBR: 'Native Brazilian Tax Engine (SPED, NF-e 4.0 & Reform)',
    taxEngineTitleUS: 'United States Tax Engine (Multi-State Sales Tax & SOC 2)',
    taxEngineTitleEU: 'European Union Tax Engine (Intra-EU VAT OSS & GDPR)',
    revenueBase: 'Monthly Revenue Base:',
    taxCredits: 'Reconciled Tax Credits:',
    totalPayable: 'Total Payable:',
    auditTaxCross: 'Audit Tax Cross-Matching',
    nfeEmitterTab: 'Invoice Emission',
    taxCalculationTab: 'Tax Calculation',
    spedStatusTab: 'Compliance & Filings',
    authorized: 'AUTHORIZED',
    issuedAt: 'Issued on:',
    recipient: 'Recipient:',
    sefazKey: 'Access Key / Filing Hash:',

    // Feedback Loop & Learning
    feedbackTitle: 'Evolutionary Memory & Continuous Learning',
    feedbackSubtitle: 'Log of parameters and operational policies absorbed from executive human guidance.',
    activeLearned: 'Active Preferences:',

    // Audit Trail
    auditTrailTitle: 'Immutable Decision Ledger & Cryptographic Proof',
    auditTrailSubtitle: 'Full trail of enterprise events, agent deliberations, and Secp256k1 signatures.',
    txReceipt: 'Cryptographic Receipt:',
    signaturesCollected: 'Signatures Collected:',

    // Onboarding
    onboardingTitle: 'Autonomous Enterprise Onboarding',
    onboardingSubtitle: 'Configure your tenant, choose fiscal jurisdiction and connect ERPs.',
    step1: '1. Corporate Profile',
    step2: '2. ERP Connectors',
    step3: '3. State Bus & AI Swarm',
    companyName: 'Company Legal Name',
    companyDoc: 'Tax ID / EIN / CNPJ',
    countryJurisdiction: 'Country & Fiscal Jurisdiction',
    industrySector: 'Industry Sector',
    completeProvisioning: 'Complete Enterprise Provisioning',
    nextStep: 'Next Step',
    previousStep: 'Back',

    // Footer
    footerRights: 'VELATRIX • Sistema Operacional Autônomo — Zero-GUI Enterprise Intelligence'
  },

  es: {
    // Slogans & Core Brand
    slogan: 'Sistema Operativo Autónomo',
    multiTenantLabel: 'Multi-Tenant v4.8',
    tenantDefault: 'Nexus Industria & Manufactura S.A.',
    zeroGuiSub: 'Zero-GUI & Proof of Intent',

    // Header & Telemetry
    healthGraph: 'Salud del Grafo',
    nominalState: 'Nominal',
    proofOfIntent: 'Proof of Intent',
    zeroTrustOk: 'Zero-Trust OK',
    intelligence: 'Inteligencia',
    deliberating: 'Deliberando...',
    multiSigActive: 'Multi-Sig Secp256k1 Activo',
    astInspect: 'AST JSON',
    auditBadge: 'Auditoría',

    // Navigation Tabs
    dashboard: 'Panel Operacional',
    riskDiagnosis: 'Radiografía de Riesgo & ROI',
    erpConnector: 'Conector ERP & Webhook',
    onboarding: 'Onboarding de Cliente',
    governance: 'Panel de Gobernanza & Riesgo',
    audit: 'Pista de Auditoría / Ledger',

    // Event Stream Bar
    eventStream: 'Bus de Eventos Empresariales',
    realTimeStream: 'transmisión en tiempo real',
    injectScenario: 'Inyectar Escenario:',
    eventPlaceholder: 'Describa un evento empresarial, crisis o adjunte factura/contrato...',
    attachDocument: 'Adjuntar Documento / OCR de Factura',
    attachDocTitle: 'Adjuntar Documento y OCR',
    uploadLocalFile: 'Cargar Archivo del Ordenador...',
    uploadSubtext: 'PDF, Imagen, XML o Factura',
    processing: 'Procesando...',
    processAos: 'Procesar AOS',
    ocrScanningTitle: 'Procesando OCR en Borde:',
    ocrScanningSub: 'Extrayendo entidades, identificadores fiscales y validando hash criptográfico...',
    source: 'Origen',
    immediateImpacts: 'Impactos Inmediatos:',

    // Scenarios
    scenarios: {
      fraud: 'Interceptación Fraude Bancario / PIX',
      supplier: 'Crisis de Proveedor Crítico',
      demand: 'Pico de Demanda B2B (+65%)',
      customs: 'Retención en Aduana Portuaria',
      fx: 'Volatilidad Cambiaria (Hedge USD)',
      ransomware: 'Ransomware en Transportadora',
      healthcare: 'Ruptura Cadena de Frío Farma',
      services: 'Sobrecarga de Capacidad TI'
    },

    // Zero-GUI Card
    decisionCardTitle: 'Tarjeta de Decisión Táctica Autónoma',
    confidenceScore: 'Grado de Confianza del Enjambre',
    financialExposure: 'Exposición Financiera Estimada',
    riskScore: 'Riesgo Operacional',
    kpisAnalyzed: 'KPIs y Métricas Impactadas',
    invariantsValidated: 'Invariantes de Negocio Validadas',
    suggestedTactics: 'Tácticas y Acciones Propuestas por el Enjambre',
    estimatedCost: 'Costo Estimado:',
    impactScore: 'Score de Eficacia:',
    autonomousWorkflow: 'Ejecución Autónoma:',
    approveAndSign: 'Firmar y Ejecutar con Multi-Sig',
    quarantineAction: 'Activar Cuarentena Preventiva',
    adjustParameters: 'Ajustar Parámetros / Instrucción Humana',
    adjustPlaceholder: 'Ej: Priorizar margen de ganancia en lugar de plazo de entrega...',
    recalculate: 'Recalcular Decisión',
    reasoningTrail: 'Rastro de Razonamiento de los Agentes:',
    humanReviewRequired: 'Requiere aprobación ejecutiva debido al umbral de riesgo.',

    // Governance & Multi-Jurisdiction Tax
    governanceTitle: 'Panel de Gobernanza, Riesgo e Invariantes Lógicas',
    governanceSubtitle: 'Defina los límites de autonomía del AOS. El sistema nunca ejecutará acciones por encima del límite de riesgo sin obtener las firmas criptográficas requeridas.',
    saveGuidelines: 'Guardar Directrices',
    backToDashboard: 'Volver al Panel',
    jurisdictionSelector: 'Jurisdicción Fiscal y Cumplimiento:',
    jurisdictionBR: 'Brasil (SPED / NF-e 4.0 / Reforma Tributaria)',
    jurisdictionUS: 'Estados Unidos (US Sales Tax / IRS / SOC 2)',
    jurisdictionEU: 'Unión Europea (VAT OSS / VIES / GDPR)',
    maxAutonomousBudget: 'Límite de Presupuesto de Riesgo Autónomo',
    multiSigQuorum: 'Quórum Mínimo de Firmas (Multi-Sig)',
    multiSigApprovers: 'Matriz de Aprobadores Ejecutivos (Multi-Sig Key Ring)',
    activeInvariants: 'Invariantes Lógicas Activas del Consejo',
    threshold: 'Umbral:',
    active: 'Activo',
    inactive: 'Inactivo',
    mandatory: 'Obligatorio',
    verifiedKey: 'Verificado ✓',

    // Fiscal Modules
    taxEngineTitleBR: 'Motor Fiscal Nativo Brasil (SPED, NF-e 4.0 y Reforma)',
    taxEngineTitleUS: 'Motor Fiscal Estados Unidos (Multi-State Sales Tax & SOC 2)',
    taxEngineTitleEU: 'Motor Fiscal Unión Europea (Intra-EU VAT OSS & GDPR)',
    revenueBase: 'Base de Facturación Mensual:',
    taxCredits: 'Créditos Fiscales Reconciliados:',
    totalPayable: 'Total a Pagar:',
    auditTaxCross: 'Auditar Cruce Fiscal',
    nfeEmitterTab: 'Emisión de Facturas',
    taxCalculationTab: 'Cálculo Tributario',
    spedStatusTab: 'Módulos SPED y Fiscal',
    authorized: 'AUTORIZADA',
    issuedAt: 'Emitida en:',
    recipient: 'Destinatario:',
    sefazKey: 'Clave de Acceso / Hash:',

    // Feedback Loop & Learning
    feedbackTitle: 'Memoria Evolutiva y Aprendizaje Continuo',
    feedbackSubtitle: 'Registro de parámetros y directrices absorbidas de instrucciones humanas ejecutivas.',
    activeLearned: 'Preferencias Activas:',

    // Audit Trail
    auditTrailTitle: 'Libro Mayor Inmutable de Decisiones y Prueba Criptográfica',
    auditTrailSubtitle: 'Rastro completo de eventos empresariales, deliberaciones de agentes y firmas Secp256k1.',
    txReceipt: 'Recibo Criptográfico:',
    signaturesCollected: 'Firmas Recolectadas:',

    // Onboarding
    onboardingTitle: 'Onboarding de la Empresa Autónoma',
    onboardingSubtitle: 'Configure su tenant, elija la jurisdicción tributaria y conectores de ERP.',
    step1: '1. Perfil Corporativo',
    step2: '2. Conectores de ERP',
    step3: '3. Bus de Estado e IA',
    companyName: 'Razón Social / Nombre de la Empresa',
    companyDoc: 'Identificación Fiscal / CIF / RFC / Tax ID',
    countryJurisdiction: 'País y Jurisdicción Fiscal',
    industrySector: 'Sector de Actividad',
    completeProvisioning: 'Completar Aprovisionamiento',
    nextStep: 'Siguiente Paso',
    previousStep: 'Atrás',

    // Footer
    footerRights: 'AOS • El Sistema Operativo de la Empresa Autónoma — Zero-GUI Enterprise Intelligence'
  }
};
