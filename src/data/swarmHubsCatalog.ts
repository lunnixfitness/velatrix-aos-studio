/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * Os 8 Hubs Estratégicos e os 300 Micro-Agentes agora são persistidos no PostgreSQL
 * via tabelas StrategicHub e MicroAgent do Prisma, acessados via `swarmRepository` e `dataService`.
 */
import { StrategicHub, MicroAgentDefinition, StrategicHubId } from '../types/autonomousSwarm';

export const STRATEGIC_HUBS: StrategicHub[] = [
  {
    id: 'hub-fiscal',
    name: 'HUB 1: Fiscal, Tributário & SPED',
    shortName: 'Fiscal & SPED',
    code: 'HUB-01-FISCAL',
    description: 'Auditoria de ICMS-ST para as 27 UFs, PIS/COFINS, IPI, retenções na fonte, incentivos regionais e compensação de créditos acumulados.',
    color: '#10B981', // emerald
    accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    borderAccent: 'border-emerald-500/30 hover:border-emerald-500/60',
    iconName: 'Receipt',
    totalAgentsCount: 45,
    activeAgentsCount: 14,
    standbyAgentsCount: 31,
    eventsProcessedCount: 142850,
    totalEconomyBrl: 4892400.00,
    totalBleedMitigatedBrl: 12450800.00,
    avgLatencyMs: 18,
    healthStatus: 'HEALTHY',
    subCategories: [
      'ICMS-ST Regional (27 UFs)',
      'PIS/COFINS & IPI',
      'Impostos Retidos & ISS',
      'Regimes Especiais & Incentivos',
      'SPED & Recuperação de Créditos'
    ]
  },
  {
    id: 'hub-supply',
    name: 'HUB 2: Supply Chain, Compras & Logística',
    shortName: 'Supply Chain & Compras',
    code: 'HUB-02-SUPPLY',
    description: 'Compradores autônomos por categoria de insumos, auditoria de fretes multimodais, mitigação de risco de fornecedores Tier 1/2/3 e desembaraço aduaneiro.',
    color: '#F59E0B', // amber
    accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    borderAccent: 'border-amber-500/30 hover:border-amber-500/60',
    iconName: 'Truck',
    totalAgentsCount: 50,
    activeAgentsCount: 16,
    standbyAgentsCount: 34,
    eventsProcessedCount: 98400,
    totalEconomyBrl: 3740200.00,
    totalBleedMitigatedBrl: 18900000.00,
    avgLatencyMs: 24,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Compradores Autônomos de Insumos',
      'Auditoria de Fretes Multimodais',
      'Risco de Fornecedor Tier 1/2/3',
      'Alfandegários & Balança IoT'
    ]
  },
  {
    id: 'hub-treasury',
    name: 'HUB 3: Financeiro, Tesouraria & Risk Management',
    shortName: 'Tesouraria & Finanças',
    code: 'HUB-03-TREASURY',
    description: 'Cobrança inteligente, rating preditivo, arbitragem intradiária CDI/FX, travas antifraude de boletos/contas e governança orçamentária FP&A.',
    color: '#EF4444', // red
    accentBg: 'bg-rose-500/10 dark:bg-rose-500/15',
    borderAccent: 'border-rose-500/30 hover:border-rose-500/60',
    iconName: 'DollarSign',
    totalAgentsCount: 40,
    activeAgentsCount: 12,
    standbyAgentsCount: 28,
    eventsProcessedCount: 165300,
    totalEconomyBrl: 6120500.00,
    totalBleedMitigatedBrl: 15420000.00,
    avgLatencyMs: 14,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Cobrança & Rating de Crédito',
      'Antifraude & Duplicatas Fantasma',
      'Arbitragem & Proteção Cambial',
      'Budget & FP&A Orçamentário'
    ]
  },
  {
    id: 'hub-iot-maintenance',
    name: 'HUB 4: Manutenção Preditiva, IoT & Chão de Fábrica',
    shortName: 'IoT & Manutenção Preditiva',
    code: 'HUB-04-PREDICTIVE',
    description: 'Monitoramento contínuo de telemetria de 20 tipos de ativos pesados, eficiência energética OEE, câmaras frias e cadeia de atmosfera controlada.',
    color: '#8B5CF6', // purple
    accentBg: 'bg-purple-500/10 dark:bg-purple-500/15',
    borderAccent: 'border-purple-500/30 hover:border-purple-500/60',
    iconName: 'Cpu',
    totalAgentsCount: 45,
    activeAgentsCount: 18,
    standbyAgentsCount: 27,
    eventsProcessedCount: 284100,
    totalEconomyBrl: 2950000.00,
    totalBleedMitigatedBrl: 22800000.00,
    avgLatencyMs: 12,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Preditiva por Tipo de Equipamento',
      'Eficiência Energética & OEE',
      'Cadeia do Frio & Atmosfera'
    ]
  },
  {
    id: 'hub-cyber-compliance',
    name: 'HUB 5: Cibersegurança, Fraud & Compliance',
    shortName: 'Cyber & Compliance',
    code: 'HUB-05-CYBER',
    description: 'Defesa ativa anti-ransomware (DejaVu), auditoria de privilégios e UEBA, proteção de dados LGPD/GDPR e verificação estrita de invariantes no Grafo.',
    color: '#06B6D4', // cyan
    accentBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    borderAccent: 'border-cyan-500/30 hover:border-cyan-500/60',
    iconName: 'ShieldAlert',
    totalAgentsCount: 35,
    activeAgentsCount: 15,
    standbyAgentsCount: 20,
    eventsProcessedCount: 512000,
    totalEconomyBrl: 1850000.00,
    totalBleedMitigatedBrl: 34500000.00,
    avgLatencyMs: 8,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Anti-Ransomware & Honeytokens',
      'Identidade & Privilégios (IAM/UEBA)',
      'Guardião LGPD & GDPR',
      'Validação de Invariantes do Grafo'
    ]
  },
  {
    id: 'hub-legal-regulatory',
    name: 'HUB 6: Jurídico, Contratos & Regulatório',
    shortName: 'Jurídico & Contratos',
    code: 'HUB-06-LEGAL',
    description: 'Auditoria OCR/LLM de minutas contratuais, monitoramento de diários oficiais, contingenciamento de processos trabalhistas/fiscais e governança ESG/ISO.',
    color: '#3B82F6', // blue
    accentBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    borderAccent: 'border-blue-500/30 hover:border-blue-500/60',
    iconName: 'Scale',
    totalAgentsCount: 35,
    activeAgentsCount: 10,
    standbyAgentsCount: 25,
    eventsProcessedCount: 42100,
    totalEconomyBrl: 2190000.00,
    totalBleedMitigatedBrl: 11200000.00,
    avgLatencyMs: 32,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Analistas Autônomos de Contratos',
      'Contencioso & Trabalhista',
      'ESG, Licenças Ambientais & ISO'
    ]
  },
  {
    id: 'hub-hr-personnel',
    name: 'HUB 7: Recursos Humanos & Departamento Pessoal',
    shortName: 'RH & Departamento Pessoal',
    code: 'HUB-07-HR',
    description: 'Validação preventiva de eventos do eSocial, auditoria de folha de pagamento, FGTS Digital, controle de ASOs de medicina ocupacional e gestão de EPIs/CIPA.',
    color: '#EC4899', // pink
    accentBg: 'bg-pink-500/10 dark:bg-pink-500/15',
    borderAccent: 'border-pink-500/30 hover:border-pink-500/60',
    iconName: 'UserCheck',
    totalAgentsCount: 25,
    activeAgentsCount: 8,
    standbyAgentsCount: 17,
    eventsProcessedCount: 38900,
    totalEconomyBrl: 1420000.00,
    totalBleedMitigatedBrl: 5800000.00,
    avgLatencyMs: 19,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Folha de Pagamento & eSocial',
      'Saúde, Segurança (SST) & CIPA'
    ]
  },
  {
    id: 'hub-verticals',
    name: 'HUB 8: Verticais Setoriais Especializadas',
    shortName: 'Verticais Especializadas',
    code: 'HUB-08-VERTICALS',
    description: 'Protocolos setoriais avançados para Indústria Farmacêutica (BPF/Anvisa), Indústria Automotiva (IATF 16949/PPAP) e Agronegócio (Grãos/Barter/CPR).',
    color: '#14B8A6', // teal
    accentBg: 'bg-teal-500/10 dark:bg-teal-500/15',
    borderAccent: 'border-teal-500/30 hover:border-teal-500/60',
    iconName: 'Sparkles',
    totalAgentsCount: 25,
    activeAgentsCount: 9,
    standbyAgentsCount: 16,
    eventsProcessedCount: 63400,
    totalEconomyBrl: 3200000.00,
    totalBleedMitigatedBrl: 16300000.00,
    avgLatencyMs: 22,
    healthStatus: 'HEALTHY',
    subCategories: [
      'Farma & Anvisa RDC',
      'Automotiva & IATF 16949',
      'Agronegócio, Grãos & Barter'
    ]
  }
];

// Brazilian States for Hub 1 (27 state micro-agents)
const BRAZIL_STATES = [
  { uf: 'SP', name: 'São Paulo', alíquota: 18, mvaPadrao: 42.5 },
  { uf: 'RJ', name: 'Rio de Janeiro', alíquota: 20, mvaPadrao: 44.0 },
  { uf: 'MG', name: 'Minas Gerais', alíquota: 18, mvaPadrao: 40.0 },
  { uf: 'RS', name: 'Rio Grande do Sul', alíquota: 17, mvaPadrao: 38.0 },
  { uf: 'PR', name: 'Paraná', alíquota: 19, mvaPadrao: 39.5 },
  { uf: 'SC', name: 'Santa Catarina', alíquota: 17, mvaPadrao: 36.0 },
  { uf: 'BA', name: 'Bahia', alíquota: 19, mvaPadrao: 41.0 },
  { uf: 'GO', name: 'Goiás', alíquota: 19, mvaPadrao: 37.5 },
  { uf: 'PE', name: 'Pernambuco', alíquota: 20.5, mvaPadrao: 43.0 },
  { uf: 'CE', name: 'Ceará', alíquota: 20, mvaPadrao: 40.0 },
  { uf: 'PA', name: 'Pará', alíquota: 19, mvaPadrao: 42.0 },
  { uf: 'MT', name: 'Mato Grosso', alíquota: 17, mvaPadrao: 45.0 },
  { uf: 'MS', name: 'Mato Grosso do Sul', alíquota: 17, mvaPadrao: 40.0 },
  { uf: 'ES', name: 'Espírito Santo', alíquota: 17, mvaPadrao: 35.0 },
  { uf: 'AM', name: 'Amazonas (ZFM)', alíquota: 20, mvaPadrao: 30.0 },
  { uf: 'RN', name: 'Rio Grande do Norte', alíquota: 18, mvaPadrao: 39.0 },
  { uf: 'PB', name: 'Paraíba', alíquota: 20, mvaPadrao: 38.0 },
  { uf: 'AL', name: 'Alagoas', alíquota: 19, mvaPadrao: 40.0 },
  { uf: 'SE', name: 'Sergipe', alíquota: 19, mvaPadrao: 39.0 },
  { uf: 'RO', name: 'Rondônia', alíquota: 17.5, mvaPadrao: 41.0 },
  { uf: 'TO', name: 'Tocantins', alíquota: 20, mvaPadrao: 42.0 },
  { uf: 'PI', name: 'Piauí', alíquota: 21, mvaPadrao: 43.0 },
  { uf: 'AC', name: 'Acre', alíquota: 19, mvaPadrao: 46.0 },
  { uf: 'AP', name: 'Amapá', alíquota: 18, mvaPadrao: 44.0 },
  { uf: 'RR', name: 'Roraima', alíquota: 20, mvaPadrao: 47.0 },
  { uf: 'MA', name: 'Maranhão', alíquota: 22, mvaPadrao: 45.0 },
  { uf: 'DF', name: 'Distrito Federal', alíquota: 20, mvaPadrao: 38.0 }
];

// Helper to generate the exact 300 micro-agents
export function buildAllMicroAgents(): MicroAgentDefinition[] {
  const agents: MicroAgentDefinition[] = [];

  // ==========================================
  // HUB 1: FISCAL, TRIBUTÁRIO & SPED (45 AGENTES)
  // ==========================================
  
  // 1. 27 Regional ICMS-ST Agents
  BRAZIL_STATES.forEach(st => {
    agents.push({
      id: `agent-fiscal-icms-${st.uf.toLowerCase()}`,
      hubId: 'hub-fiscal',
      name: `ICMS-ST & MVA Regional (${st.uf})`,
      codeName: `AOS-FISC-${st.uf}`,
      subCategory: 'ICMS-ST Regional (27 UFs)',
      description: `Especialista nas alíquotas internas (${st.alíquota}%), pautas fiscais, protocolo interestadual e MVA Ajustada para operações com ${st.name} (${st.uf}).`,
      triggerKeywords: ['icms', 'icms-st', 'st', 'mva', st.uf.toLowerCase(), st.name.toLowerCase(), 'substituição tributária'],
      erpEndpoint: `/api/v1/erp/fiscal/icms-st/${st.uf.toLowerCase()}`,
      status: st.uf === 'SP' || st.uf === 'MG' || st.uf === 'RJ' ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: st.uf === 'SP' || st.uf === 'MG' || st.uf === 'RJ' ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: st.uf === 'SP' ? 34200 : st.uf === 'MG' ? 19800 : 4200,
      mitigatedBleedBrl: st.uf === 'SP' ? 2450000 : 820000,
      generatedEconomyBrl: st.uf === 'SP' ? 890000 : 310000,
      avgLatencyMs: 14,
      lastHeartbeat: 'Ativo via Barramento SEFAZ',
      successRatePct: 99.8,
      sampleActionDescription: `Ajuste preventivo de alíquota interna de ${st.alíquota}% e recálculo da MVA no rascunho de NF-e destinado a ${st.uf}.`
    });
  });

  // 2. PIS/COFINS & IPI (2 Agentes)
  agents.push(
    {
      id: 'agent-fiscal-piscofins',
      hubId: 'hub-fiscal',
      name: 'PIS & COFINS Não-Cumulativo',
      codeName: 'AOS-FISC-PISCOF',
      subCategory: 'PIS/COFINS & IPI',
      description: 'Validação em tempo real de créditos presumidos de PIS (1,65%) e COFINS (7,6%) sobre insumos essenciais à atividade industrial e fretes vinculados.',
      triggerKeywords: ['pis', 'cofins', 'não cumulativo', 'crédito insumos', 'base de cálculo'],
      erpEndpoint: '/api/v1/erp/fiscal/piscofins/credits',
      status: 'ACTIVE',
      runtimeMode: 'CONTAINER_WARM',
      processedEventsCount: 22800,
      mitigatedBleedBrl: 1450000,
      generatedEconomyBrl: 580000,
      avgLatencyMs: 16,
      lastHeartbeat: 'Sincronizado ERP',
      successRatePct: 99.7
    },
    {
      id: 'agent-fiscal-ipi',
      hubId: 'hub-fiscal',
      name: 'IPI & Enquadramento de Alíquotas TIPI',
      codeName: 'AOS-FISC-IPI',
      subCategory: 'PIS/COFINS & IPI',
      description: 'Checagem de alíquota IPI por NCM conforme tabela TIPI vigente, créditos na aquisição de insumos tributados e saídas isentas.',
      triggerKeywords: ['ipi', 'tipi', 'industrialização', 'crédito ipi'],
      erpEndpoint: '/api/v1/erp/fiscal/ipi/verify',
      status: 'ACTIVE',
      runtimeMode: 'CONTAINER_WARM',
      processedEventsCount: 14300,
      mitigatedBleedBrl: 620000,
      generatedEconomyBrl: 210000,
      avgLatencyMs: 15,
      lastHeartbeat: 'Ativo',
      successRatePct: 99.5
    }
  );

  // 3. Impostos Retidos & ISS (3 Agentes)
  agents.push(
    {
      id: 'agent-fiscal-iss',
      hubId: 'hub-fiscal',
      name: 'ISS & Local de Incidência (LC 116)',
      codeName: 'AOS-FISC-ISS',
      subCategory: 'Impostos Retidos & ISS',
      description: 'Auditoria de alíquota municipal de ISS (2% a 5%) e correta identificação do local da prestação conforme Art. 3º da LC 116/03.',
      triggerKeywords: ['iss', 'issqn', 'serviço tomado', 'lc 116', 'município'],
      erpEndpoint: '/api/v1/erp/fiscal/iss/withholding',
      status: 'STANDBY_ON_DEMAND',
      runtimeMode: 'STANDBY_ON_DEMAND',
      processedEventsCount: 8900,
      mitigatedBleedBrl: 340000,
      generatedEconomyBrl: 120000,
      avgLatencyMs: 18,
      lastHeartbeat: 'Pronto sob demanda',
      successRatePct: 99.6
    },
    {
      id: 'agent-fiscal-irrf',
      hubId: 'hub-fiscal',
      name: 'IRRF & Retenções Federais (CSRF)',
      codeName: 'AOS-FISC-IRRF',
      subCategory: 'Impostos Retidos & ISS',
      description: 'Trava e conferência de retenções federais (IRRF 1,5%, PIS/COFINS/CSLL 4,65%) sobre pagamentos de serviços profissionais.',
      triggerKeywords: ['irrf', 'csrf', 'retenção na fonte', 'pis cofins csll retido'],
      erpEndpoint: '/api/v1/erp/fiscal/retencoes/csrf',
      status: 'ACTIVE',
      runtimeMode: 'CONTAINER_WARM',
      processedEventsCount: 11400,
      mitigatedBleedBrl: 480000,
      generatedEconomyBrl: 180000,
      avgLatencyMs: 17,
      lastHeartbeat: 'Sincronizado',
      successRatePct: 99.8
    },
    {
      id: 'agent-fiscal-inss-ret',
      hubId: 'hub-fiscal',
      name: 'INSS Retenção 11% Cessão de Mão de Obra',
      codeName: 'AOS-FISC-INSS',
      subCategory: 'Impostos Retidos & ISS',
      description: 'Verificação da base de cálculo deduzindo materiais e equipamentos para retenção previdenciária de 11% em serviços terceirizados.',
      triggerKeywords: ['inss', 'cessão mão de obra', 'empreitada', 'retenção 11%'],
      erpEndpoint: '/api/v1/erp/fiscal/retencoes/inss',
      status: 'STANDBY_ON_DEMAND',
      runtimeMode: 'STANDBY_ON_DEMAND',
      processedEventsCount: 6500,
      mitigatedBleedBrl: 290000,
      generatedEconomyBrl: 95000,
      avgLatencyMs: 19,
      lastHeartbeat: 'Pronto sob demanda',
      successRatePct: 99.4
    }
  );

  // 4. Regimes Especiais & Incentivos (3 Agentes)
  agents.push(
    {
      id: 'agent-fiscal-sudene',
      hubId: 'hub-fiscal',
      name: 'Incentivos SUDENE & SUDAM',
      codeName: 'AOS-FISC-SUDENE',
      subCategory: 'Regimes Especiais & Incentivos',
      description: 'Monitoramento da redução de 75% do IRPJ para projetos em áreas da SUDENE/SUDAM e controle de destinação da reserva de incentivo fiscal.',
      triggerKeywords: ['sudene', 'sudam', 'redução 75%', 'reserva de lucros', 'incentivo fiscal'],
      erpEndpoint: '/api/v1/erp/fiscal/incentivos/sudene',
      status: 'STANDBY_ON_DEMAND',
      runtimeMode: 'STANDBY_ON_DEMAND',
      processedEventsCount: 4100,
      mitigatedBleedBrl: 1800000,
      generatedEconomyBrl: 720000,
      avgLatencyMs: 22,
      lastHeartbeat: 'Pronto sob demanda',
      successRatePct: 99.9
    },
    {
      id: 'agent-fiscal-tare',
      hubId: 'hub-fiscal',
      name: 'Termo de Acordo de Regime Especial (TARE)',
      codeName: 'AOS-FISC-TARE',
      subCategory: 'Regimes Especiais & Incentivos',
      description: 'Conformidade de contrapartidas fiscais e limites operacionais em TAREs firmados com Secretarias de Fazenda estaduais.',
      triggerKeywords: ['tare', 'regime especial', 'acordo fiscal', 'contrapartida'],
      erpEndpoint: '/api/v1/erp/fiscal/regimes/tare',
      status: 'STANDBY_ON_DEMAND',
      runtimeMode: 'STANDBY_ON_DEMAND',
      processedEventsCount: 2900,
      mitigatedBleedBrl: 950000,
      generatedEconomyBrl: 380000,
      avgLatencyMs: 25,
      lastHeartbeat: 'Pronto sob demanda',
      successRatePct: 99.7
    },
    {
      id: 'agent-fiscal-prodepe',
      hubId: 'hub-fiscal',
      name: 'Benefícios Regionais (PRODEPE / FOMENTAR)',
      codeName: 'AOS-FISC-REGIONAL',
      subCategory: 'Regimes Especiais & Incentivos',
      description: 'Crédito presumido e diferimento de ICMS vinculado a programas de desenvolvimento industrial (PRODEPE, FOMENTAR, PRODUZIR).',
      triggerKeywords: ['prodepe', 'fomentar', 'crédito presumido icms', 'desenvolvimento industrial'],
      erpEndpoint: '/api/v1/erp/fiscal/incentivos/regionais',
      status: 'STANDBY_ON_DEMAND',
      runtimeMode: 'STANDBY_ON_DEMAND',
      processedEventsCount: 3200,
      mitigatedBleedBrl: 1100000,
      generatedEconomyBrl: 460000,
      avgLatencyMs: 24,
      lastHeartbeat: 'Pronto sob demanda',
      successRatePct: 99.6
    }
  );

  // 5. SPED & Recuperação de Créditos (10 Agentes)
  const spedAgents = [
    { id: 'agent-fiscal-cred-rec', name: 'Recuperação de Créditos Acumulados', desc: 'Varredura e monetização de saldo credor acumulado de ICMS e PIS/COFINS via e-CredAc e PER/DCOMP.' },
    { id: 'agent-fiscal-difal', name: 'DIFAL Consumidor Final (EC 87/15)', desc: 'Cálculo automatizado de partilha de DIFAL entre estados de origem e destino para consumidor final não contribuinte.' },
    { id: 'agent-fiscal-sped-efd', name: 'Auditor EFD ICMS/IPI', desc: 'Cruzamento preventivo entre escrituração fiscal e XMLs de entrada/saída antes da transmissão à SEFAZ.' },
    { id: 'agent-fiscal-sped-ecd', name: 'Auditor Contábil Digital (ECD)', desc: 'Validação de plano de contas referencial, balancetes e partidas dobradas com regras da Receita Federal.' },
    { id: 'agent-fiscal-bloco-k', name: 'Bloco K - Produção & Estoque', desc: 'Auditoria de ordem de produção, consumo de insumos na ficha técnica e reconciliação com saldos físicos de estoque.' },
    { id: 'agent-fiscal-reintegra', name: 'REINTEGRA Exportação Industrial', desc: 'Apuração de ressarcimento de resíduos tributários na cadeia exportadora de manufaturados.' },
    { id: 'agent-fiscal-fci', name: 'FCI - Conteúdo de Importação (Res. 13/12)', desc: 'Cálculo de percentual de conteúdo importado para aplicação da alíquota interestadual de 4% de ICMS.' },
    { id: 'agent-fiscal-drawback', name: 'Drawback Suspensão & Isenção', desc: 'Controle de compromissos de exportação vinculados a insumos importados com suspensão tributária.' },
    { id: 'agent-fiscal-reinf', name: 'EFD-Reinf Previdenciária & Fiscal', desc: 'Auditoria e transmissão dos eventos R-2010/R-2020 de serviços tomados/prestados e R-4000 de retenções.' },
    { id: 'agent-fiscal-cst-matcher', name: 'Classificação NCM & CST Automatizada', desc: 'Enquadramento preditivo de NCM e Código de Situação Tributária por Similaridade e Solução de Consulta Cosit.' }
  ];

  spedAgents.forEach(sa => {
    agents.push({
      id: sa.id,
      hubId: 'hub-fiscal',
      name: sa.name,
      codeName: sa.id.toUpperCase().replace('AGENT-', 'AOS-'),
      subCategory: 'SPED & Recuperação de Créditos',
      description: sa.desc,
      triggerKeywords: [sa.name.toLowerCase(), 'sped', 'efd', 'ecd', 'fiscal', 'ncm'],
      erpEndpoint: `/api/v1/erp/fiscal/${sa.id.replace('agent-fiscal-', '')}`,
      status: sa.id === 'agent-fiscal-cred-rec' || sa.id === 'agent-fiscal-difal' ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: sa.id === 'agent-fiscal-cred-rec' ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 8400,
      mitigatedBleedBrl: 920000,
      generatedEconomyBrl: 390000,
      avgLatencyMs: 20,
      lastHeartbeat: 'Monitorando Barramento',
      successRatePct: 99.6
    });
  });

  // Total Hub 1 = 27 + 2 + 3 + 3 + 10 = 45 agents!

  // ==========================================
  // HUB 2: SUPPLY CHAIN & COMPRAS (50 AGENTES)
  // ==========================================

  // 1. 15 Compradores Autônomos por Categoria
  const procurementCategories = [
    'Metais & Ligas (Aço, Alumínio, Cobre)',
    'Polímeros, Resinas & Termoplásticos',
    'Química Fina, Solventes & Reagentes',
    'Eletrônicos, Semicondutores & PCBs',
    'Embalagens de Papelão, Filmes & Vidros',
    'Energia Elétrica (Mercado Livre ACL)',
    'Combustíveis, Diesel S10 & Lubrificantes',
    'Alimentos, Grãos & Óleos Industriais',
    'MRO & Peças Sobressalentes Críticas',
    'Serviços Terceirizados & Manutenção',
    'Hardware de TI, Cloud & Licenças',
    'Frotas, Empilhadeiras & Equipamentos',
    'Têxteis Técnicos & Fibras Sintéticas',
    'Minerais, Refratários & Cimentos',
    'Gases Industriais (Oxigênio, Nitrogênio)'
  ];

  procurementCategories.forEach((cat, idx) => {
    const slug = cat.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
    agents.push({
      id: `agent-procurement-${slug}`,
      hubId: 'hub-supply',
      name: `Comprador Autônomo: ${cat.split('(')[0].trim()}`,
      codeName: `AOS-PROC-${slug.toUpperCase().slice(0, 6)}`,
      subCategory: 'Compradores Autônomos de Insumos',
      description: `Disparo autônomo de RFQ emergencial, equalização de propostas comerciais e negociação de contratos de fornecimento para a categoria de ${cat}.`,
      triggerKeywords: ['compra', 'fornecedor', 'insumo', 'rfq', 'cotação', slug, 'pedido compra'],
      erpEndpoint: `/api/v1/erp/procurement/rfq/${slug}`,
      status: idx < 4 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 4 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 6200,
      mitigatedBleedBrl: 1150000,
      generatedEconomyBrl: 320000,
      avgLatencyMs: 25,
      lastHeartbeat: 'Cotações automáticas ativas',
      successRatePct: 99.3,
      requiresMultiSigThresholdBrl: 50000
    });
  });

  // 2. 10 Auditoria de Fretes Multimodais
  const freightModals = [
    { id: 'agent-freight-ftl', name: 'Rodoviário Lotação Completa (FTL)', desc: 'Auditoria de valor/km, peso aferido, tabela ANTT e pedágio obrigatório sem bitributação.' },
    { id: 'agent-freight-ltl', name: 'Rodoviário Carga Fracionada (LTL)', desc: 'Conferência de cubagem real, taxas de redespacho, Gris e taxa de difícil acesso (TDA).' },
    { id: 'agent-freight-rail', name: 'Ferroviário & Graneis', desc: 'Validação de taxa de tomada de vagão, tempo de carga/descarga e sobrestadia ferroviária.' },
    { id: 'agent-freight-cabotage', name: 'Marítimo Cabotagem Costeira', desc: 'Rastreamento de escala portuária, taxa de manuseio terminal (THC) e bunker surcharge.' },
    { id: 'agent-freight-sea-long', name: 'Marítimo Longo Curso (FCL/LCL)', desc: 'Conferência de frete internacional oceânico, demurrage de container e seguro de avaria grossa.' },
    { id: 'agent-freight-air-express', name: 'Aéreo Expresso & Courier', desc: 'Controle de envio emergencial de peças AOG/parada de linha com validação de SLA hora marcada.' },
    { id: 'agent-freight-air-cargo', name: 'Aéreo Carga Geral', desc: 'Validação de peso cubado IATA, taxas aeroportuárias Infraero/Concessionárias e paletização.' },
    { id: 'agent-freight-pipeline', name: 'Dutoviário & Fluidos', desc: 'Medição de vazão e faturamento contínuo de transporte por oleodutos e gasodutos.' },
    { id: 'agent-freight-multimodal', name: 'Multimodal OTM Integrado', desc: 'Conferência do Conhecimento de Transporte Multimodal (CTMC) e seguro do operador.' },
    { id: 'agent-freight-antt-table', name: 'Piso Mínimo ANTT & Vale-Pedágio', desc: 'Checagem rigorosa da tabela vinculante da ANTT para evitar multas de R$ 5.000 por frete.' }
  ];

  freightModals.forEach(fm => {
    agents.push({
      id: fm.id,
      hubId: 'hub-supply',
      name: fm.name,
      codeName: fm.id.toUpperCase().replace('AGENT-', 'AOS-'),
      subCategory: 'Auditoria de Fretes Multimodais',
      description: fm.desc,
      triggerKeywords: ['frete', 'cte', 'transporte', 'antt', 'pedágio', 'cubagem', fm.name.toLowerCase()],
      erpEndpoint: `/api/v1/erp/logistics/${fm.id.replace('agent-freight-', '')}`,
      status: fm.id === 'agent-freight-ftl' || fm.id === 'agent-freight-antt-table' ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: fm.id === 'agent-freight-ftl' ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 9400,
      mitigatedBleedBrl: 640000,
      generatedEconomyBrl: 190000,
      avgLatencyMs: 18,
      lastHeartbeat: 'Auditor CTe ativo',
      successRatePct: 99.7
    });
  });

  // 3. 15 Gestão de Risco de Fornecedor
  const supplierRiskAgents = [
    { id: 'agent-supplier-risk-t1', name: 'Risco de Fornecedor Tier-1 Crítico', desc: 'Monitoramento contínuo de solidez operacional e financeira dos fornecedores de itens de alto risco.' },
    { id: 'agent-supplier-risk-t2', name: 'Risco de Fornecedor Tier-2 Subcontratado', desc: 'Rastreabilidade dos subfornecedores de componentes para evitar estrangulamento invisível de cadeia.' },
    { id: 'agent-supplier-risk-t3', name: 'Risco de Fornecedor Tier-3 Matéria-Prima', desc: 'Monitoramento de estoques mundiais e capacidade de extração de comodities essenciais.' },
    { id: 'agent-supplier-fin-health', name: 'Saúde Financeira & Score de Falência', desc: 'Cálculo de índice Altman Z-score e endividamento de fornecedores estratégicos.' },
    { id: 'agent-supplier-labor-passives', name: 'Passivo Trabalhista & CNDT', desc: 'Varredura automática semanal de certidões trabalhistas negativas para mitigar responsabilidade subsidiária.' },
    { id: 'agent-supplier-cnd-federal', name: 'Certidões Negativas Tributárias (CND)', desc: 'Bloqueio preventivo de pagamentos a fornecedores com certidões federais ou estaduais positivadas.' },
    { id: 'agent-supplier-anti-corruption', name: 'Compliance Anticorrupção & KYC', desc: 'Checagem de listas restritivas internacionais (OFAC), PEPs e histórico de probidade.' },
    { id: 'agent-supplier-esg-audit', name: 'Auditoria ESG & Trabalho Escravo', desc: 'Varredura de lista suja do trabalho análogo à escravidão e autuações ambientais do IBAMA.' },
    { id: 'agent-supplier-news-adverse', name: 'Mídia Adversária & Notícias Críticas', desc: 'Varredura por IA em tempo real de notícias de greves, recuperação judicial e incêndios em fábricas.' },
    { id: 'agent-supplier-geopolitical', name: 'Risco Geopolítico & Sanções', desc: 'Avaliação de riscos de embargo, conflitos bélicos em rotas de navegação e novas tarifas alfandegárias.' },
    { id: 'agent-supplier-leadtime-drift', name: 'Monitor de Drift de Lead-Time', desc: 'Alerta preditivo quando o tempo médio de entrega de um fornecedor começa a atrasar progressivamente.' },
    { id: 'agent-supplier-rejection-rate', name: 'Taxa de Rejeição de Qualidade (PPM)', desc: 'Auditoria de lotes reprovados no recebimento fabril com bloqueio de novos pedidos automáticos.' },
    { id: 'agent-supplier-monopoly-risk', name: 'Dependência Econômica & Monopólio', desc: 'Alerta de fornecedores que representam mais de 40% do faturamento da nossa linha sem redundância.' },
    { id: 'agent-supplier-bcp-readiness', name: 'Plano de Continuidade de Negócios (BCP)', desc: 'Avaliação de testes de resiliência e estoque de segurança em fábrica secundária homologada.' },
    { id: 'agent-supplier-rfp-governance', name: 'Governança de Homologação RFI/RFP', desc: 'Validação de documentação técnica, ISO e compliance antes da emissão do primeiro pedido no ERP.' }
  ];

  supplierRiskAgents.forEach(sr => {
    agents.push({
      id: sr.id,
      hubId: 'hub-supply',
      name: sr.name,
      codeName: sr.id.toUpperCase().replace('AGENT-', 'AOS-'),
      subCategory: 'Risco de Fornecedor Tier 1/2/3',
      description: sr.desc,
      triggerKeywords: ['fornecedor', 'risco', 'cndt', 'cnd', 'esg', 'falência', 'tier-1', 'tier-2'],
      erpEndpoint: `/api/v1/erp/suppliers/risk/${sr.id.replace('agent-supplier-', '')}`,
      status: sr.id === 'agent-supplier-risk-t1' || sr.id === 'agent-supplier-cnd-federal' ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: sr.id === 'agent-supplier-risk-t1' ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 5100,
      mitigatedBleedBrl: 1200000,
      generatedEconomyBrl: 180000,
      avgLatencyMs: 28,
      lastHeartbeat: 'Varredura em tempo real',
      successRatePct: 99.5
    });
  });

  // 4. 10 Alfandegários e Balança IoT
  const customsAndScaleAgents = [
    { id: 'agent-customs-duimp', name: 'Desembaraço Duimp / DI Importação', desc: 'Rastreamento de parametrização e desembaraço de declarações únicas de importação na Receita Federal.' },
    { id: 'agent-customs-due', name: 'Desembaraço DU-E Exportação', desc: 'Validação de notas fiscais vinculadas e despacho de exportação para cumprimento de prazos cambiais.' },
    { id: 'agent-customs-demurrage', name: 'Prevenção de Demurrage de Containers', desc: 'Controle em tempo real de free time e despacho acelerado para evitar diárias portuárias em dólares.' },
    { id: 'agent-customs-tec-classification', name: 'Classificação Tarifária NCM/TEC', desc: 'Auditoria de alíquota do Imposto de Importação (II) e conformidade de catálogo de produtos.' },
    { id: 'agent-customs-channel-alert', name: 'Canal de Parametrização Aduaneira', desc: 'Disparo de protocolos contingenciais imediatos ao registrar parametrização em Canal Vermelho.' },
    { id: 'agent-iot-scales-inbound', name: 'Balança Rodoviária IoT Entrada', desc: 'Leitura automática por sensores de peso bruto e tara de carretas na guarita de entrada fabril.' },
    { id: 'agent-iot-scales-outbound', name: 'Balança Rodoviária IoT Saída', desc: 'Cruzamento do peso de saída com o manifesto de carga (MDF-e) para prevenir desvios de expedição.' },
    { id: 'agent-iot-rfid-yard', name: 'RFID de Pátio & Rastreamento de Carretas', desc: 'Localização automatizada de semirreboques e carretas nas docas de carga/descarga.' },
    { id: 'agent-iot-optical-cubing', name: 'Cubagem Óptica 3D Automatizada', desc: 'Medição a laser das dimensões volumétricas de paletes para maximização da taxa de ocupação da frota.' },
    { id: 'agent-customs-origin-cert', name: 'Certificado de Origem Mercosul/ALADI', desc: 'Validação de regras de preferência tarifária e conferência de certificado digital de origem.' }
  ];

  customsAndScaleAgents.forEach(cs => {
    agents.push({
      id: cs.id,
      hubId: 'hub-supply',
      name: cs.name,
      codeName: cs.id.toUpperCase().replace('AGENT-', 'AOS-'),
      subCategory: 'Alfandegários & Balança IoT',
      description: cs.desc,
      triggerKeywords: ['aduana', 'importação', 'balança', 'pesagem', 'demurrage', 'container', 'rfid'],
      erpEndpoint: `/api/v1/erp/customs/${cs.id.replace('agent-', '')}`,
      status: cs.id === 'agent-iot-scales-inbound' || cs.id === 'agent-customs-demurrage' ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: cs.id === 'agent-iot-scales-inbound' ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 7800,
      mitigatedBleedBrl: 890000,
      generatedEconomyBrl: 240000,
      avgLatencyMs: 15,
      lastHeartbeat: 'Sensores IoT online',
      successRatePct: 99.8
    });
  });

  // Total Hub 2 = 15 + 10 + 15 + 10 = 50 agents!

  // ==========================================
  // HUB 3: FINANCEIRO, TESOURARIA & RISK (40 AGENTES)
  // ==========================================

  // 1. 10 Cobrança & Rating de Crédito
  const creditAgents = [
    'Rating de Crédito Preditivo por Machine Learning',
    'Limites de Crédito Dinâmicos Baseados em Fluxo',
    'Régua de Cobrança Preventiva Automatizada (D-3 a D+3)',
    'Renegociação & Acordo de Quitação Digital em Tempo Real',
    'Consulta Bureau de Crédito (Serasa/Boa Vista API)',
    'Análise de Balanço Automatizada de Novos Clientes',
    'Risco Sacado & Cessão de Recebíveis Intercompany',
    'Seguro de Crédito à Exportação & Alertas de Sinistro',
    'Compensação de Contas a Receber / Contas a Pagar (Netting)',
    'Ajuizamento Preventivo de Títulos Vencidos sem Resposta'
  ];

  creditAgents.forEach((ca, idx) => {
    const slug = ca.split(' ')[0].toLowerCase();
    agents.push({
      id: `agent-credit-${idx + 1}`,
      hubId: 'hub-treasury',
      name: ca,
      codeName: `AOS-CRED-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Cobrança & Rating de Crédito',
      description: `Operação automatizada de gestão de risco financeiro de clientes e liquidação de recebíveis: ${ca}.`,
      triggerKeywords: ['crédito', 'cobrança', 'recebíveis', 'inadimplência', 'rating', 'serasa', 'limite'],
      erpEndpoint: `/api/v1/erp/credit/rule-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 8900,
      mitigatedBleedBrl: 850000,
      generatedEconomyBrl: 210000,
      avgLatencyMs: 16,
      lastHeartbeat: 'Sincronizado',
      successRatePct: 99.6
    });
  });

  // 2. 10 Antifraude & Duplicatas Fantasma
  const fraudAgents = [
    'Detecção de Adulteração de Código de Barras de Boletos',
    'Identificação de Notas Espelho e Notas Fiscais Clonadas',
    'Triangulação Bancária Suspeita e Contas de Passagem',
    'Detecção de Fornecedor Fantasma (Ghost Vendor Check)',
    'Trava de Alteração não Homologada de Chaves PIX',
    'Prevenção de Duplicidade de Pagamentos de Faturas',
    'Validação Criptográfica de Assinatura XML SEFAZ',
    'Interceptação de Phishing Bancário em Trânsito',
    'Auditoria de CNPJs Recém-Abertos no Quadro Societário',
    'Bloqueio de Transferências para Contas Offshore Não Cadastradas'
  ];

  fraudAgents.forEach((fa, idx) => {
    agents.push({
      id: `agent-fraud-${idx + 1}`,
      hubId: 'hub-treasury',
      name: fa,
      codeName: `AOS-FRAUD-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Antifraude & Duplicatas Fantasma',
      description: `Algoritmo preventivo com acionamento de bloqueio imediato e contingenciamento no ERP: ${fa}.`,
      triggerKeywords: ['fraude', 'antifraude', 'boleto', 'duplicata', 'fantasma', 'pix', 'golpe'],
      erpEndpoint: `/api/v1/erp/fraud/lock-${idx + 1}`,
      status: idx < 4 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 4 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 14200,
      mitigatedBleedBrl: 3200000,
      generatedEconomyBrl: 540000,
      avgLatencyMs: 9,
      lastHeartbeat: 'Defesa ativa',
      successRatePct: 99.9,
      requiresMultiSigThresholdBrl: 10000
    });
  });

  // 3. 10 Arbitragem & Mercado Financeiro
  const marketAgents = [
    'Aplicação Automática de Caixa em CDI / Selic (Sweep Account)',
    'Hedge Cambial Automatizado NDF & Futuros USD/EUR',
    'Arbitragem de Títulos Públicos Federais (LFT / NTN-B)',
    'Gestão e Otimização de Liquidez Intradiária',
    'Comparador de Spreads Bancários via Open Finance',
    'Otimização de Linhas de Capital de Giro e Financiamento',
    'Operações de Swap de Taxa de Juros (Pré x CDI)',
    'Alocação em Títulos Isentos (LCI, LCA e CRI/CRA)',
    'Cash Pooling Centralizado Multi-Empresas',
    'Monitoramento Contínuo de Covenants de Dívidas Bancárias'
  ];

  marketAgents.forEach((ma, idx) => {
    agents.push({
      id: `agent-market-${idx + 1}`,
      hubId: 'hub-treasury',
      name: ma,
      codeName: `AOS-MKT-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Arbitragem & Proteção Cambial',
      description: `Execução autônoma de operações de tesouraria com conexão via APIs bancárias homologadas: ${ma}.`,
      triggerKeywords: ['tesouraria', 'cdi', 'selic', 'hedge', 'dólar', 'câmbio', 'swap', 'investimento'],
      erpEndpoint: `/api/v1/erp/treasury/trade-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 7600,
      mitigatedBleedBrl: 980000,
      generatedEconomyBrl: 890000,
      avgLatencyMs: 14,
      lastHeartbeat: 'Open Finance conectado',
      successRatePct: 99.8,
      requiresMultiSigThresholdBrl: 100000
    });
  });

  // 4. 10 Budget & FP&A Orçamentário
  const fpaAgents = [
    'Controle Orçamentário CAPEX por Projeto de Investimento',
    'Trava de Requisições de Compra OPEX Acima do Teto Orçado',
    'Análise de Variância Orçamentária Realizado x Orçado em Tempo Real',
    'Rolling Forecast Financeiro Mensal Atualizado por IA',
    'Governança de Teto de Headcount e Folha Salarial',
    'Alocação de Custos Indiretos Baseada em Atividades (ABC)',
    'Auditoria de Relatórios de Despesas de Viagem e Reembolsos',
    'DRE Gerencial Diária Consolidada Automatizada',
    'Simulador Preditivo de Ponto de Equilíbrio (Break-Even)',
    'Análise de Margem de Contribuição Líquida por SKU'
  ];

  fpaAgents.forEach((fa, idx) => {
    agents.push({
      id: `agent-fpa-${idx + 1}`,
      hubId: 'hub-treasury',
      name: fa,
      codeName: `AOS-FPA-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Budget & FP&A Orçamentário',
      description: `Governança orçamentária e financeira em nível de centro de custo: ${fa}.`,
      triggerKeywords: ['orçamento', 'budget', 'capex', 'opex', 'fpa', 'dre', 'forecast', 'custos'],
      erpEndpoint: `/api/v1/erp/fpa/budget-${idx + 1}`,
      status: idx < 2 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 2 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 6800,
      mitigatedBleedBrl: 780000,
      generatedEconomyBrl: 340000,
      avgLatencyMs: 17,
      lastHeartbeat: 'Ativo',
      successRatePct: 99.7
    });
  });

  // Total Hub 3 = 10 + 10 + 10 + 10 = 40 agents!

  // ==========================================
  // HUB 4: MANUTENÇÃO PREDITIVA & IOT (45 AGENTES)
  // ==========================================

  // 1. 20 Preditivos por Equipamento
  const heavyAssets = [
    'Motores Trifásicos de Indução (Vibração/Aquecimento)',
    'Compressores de Parafuso Industriais (Pressão/Temperatura)',
    'Prensas Hidráulicas de Estamparia (Vazamento/Pressão)',
    'Robôs Industriais de Solda a Ponto (Repetibilidade)',
    'Pontes Rolantes & Talhas Elétricas de Carga (Freios)',
    'Bombas Centrífugas de Transferência (Cavitação)',
    'Caldeiras de Vapor Aquatubulares (Pressão/Nível)',
    'Tornos CNC de Alta Precisão (Desgaste Ferramental)',
    'Laminadores de Chapas de Aço (Espessura/Folga)',
    'Fornos de Indução Eletromagnética (Bobinas/Refratário)',
    'Esteiras Transportadoras Industriais (Tensionamento)',
    'Injetoras de Plástico Hidráulicas (Pressão Fechamento)',
    'Sopradoras de Pré-formas PET (Aquecimento Infravermelho)',
    'Centrais Hidráulicas e Unidades de Força (Óleo)',
    'Turbinas a Gás Geradoras de Energia (Vibração Eixo)',
    'Grupos Geradores Diesel de Emergência (Bateria/Óleo)',
    'Trocadores de Calor Casco-Tubos (Incrustação/Delta-T)',
    'Chillers Centrais de Água Gelada (Compressão/Gás)',
    'Misturadores Planetários Industriais (Torque/Carga)',
    'Painéis Elétricos CCM e Subestações (Termografia)'
  ];

  heavyAssets.forEach((ha, idx) => {
    const slug = ha.split(' ')[0].toLowerCase();
    agents.push({
      id: `agent-asset-${idx + 1}`,
      hubId: 'hub-iot-maintenance',
      name: ha.split('(')[0].trim(),
      codeName: `AOS-ASSET-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Preditiva por Tipo de Equipamento',
      description: `Telemetria em tempo real, análise espectral de vibração e disparo de ordens preventivas de manutenção no ERP: ${ha}.`,
      triggerKeywords: ['manutenção', 'preditiva', 'vibração', 'iot', 'falha', 'quebra', 'motor', 'compressor', slug],
      erpEndpoint: `/api/v1/erp/maintenance/asset-${idx + 1}`,
      status: idx < 6 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 6 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 18400,
      mitigatedBleedBrl: 1850000,
      generatedEconomyBrl: 420000,
      avgLatencyMs: 11,
      lastHeartbeat: 'Telemetria 24/7',
      successRatePct: 99.8
    });
  });

  // 2. 10 Eficiência Energética & OEE
  const energyAgents = [
    'Eficiência Geral de Equipamentos (OEE Linha de Produção)',
    'Monitoramento em Tempo Real kWh por Tonelada Produzida',
    'Detecção Autônoma de Fugas de Ar Comprimido',
    'Controle Preditivo de Refugo e Sucata de Matéria-Prima',
    'Otimização de Consumo de Gás Natural Fabril',
    'Reaproveitamento & Reciclagem de Água Industrial',
    'Medição de Demanda Elétrica de Ponta e Fora de Ponta',
    'Correção Automática de Fator de Potência e Energia Reativa',
    'Monitoramento do Ciclo de Vida de Óleos Hidráulicos',
    'Apuração Contínua de Emissões de CO2 Fabril'
  ];

  energyAgents.forEach((ea, idx) => {
    agents.push({
      id: `agent-energy-${idx + 1}`,
      hubId: 'hub-iot-maintenance',
      name: ea,
      codeName: `AOS-NRG-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Eficiência Energética & OEE',
      description: `Otimização contínua de insumos energéticos e métricas OEE: ${ea}.`,
      triggerKeywords: ['energia', 'kwh', 'oee', 'água', 'gás', 'refugo', 'eficiência', 'sustentabilidade'],
      erpEndpoint: `/api/v1/erp/energy/monitor-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 12200,
      mitigatedBleedBrl: 640000,
      generatedEconomyBrl: 510000,
      avgLatencyMs: 14,
      lastHeartbeat: 'Medidores online',
      successRatePct: 99.7
    });
  });

  // 3. 15 Cadeia do Frio & Atmosfera
  const coldChainAgents = [
    'Câmara Fria de Resfriados CD-01 (Carnes e Laticínios)',
    'Câmara Fria de Congelados CD-02 (-18°C a -25°C)',
    'Tanques Criogênicos de Nitrogênio Líquido (-196°C)',
    'HVAC e Filtragem HEPA de Salas Limpas Classe ISO 5',
    'Atmosfera Controlada de Maturação (CO2/O2)',
    'Umidade Relativa e Temperatura em Silos de Grãos',
    'Sensores de Temperatura em Trânsito Termoelétrico',
    'Monitoramento de Vazamento de Amônia em Refrigeração',
    'Ciclo de Degelo Inteligente de Evaporadores',
    'Controle de Portas Rápidas e Barreira Térmica Isolante',
    'Monitoramento de Gelo Seco em Cargas Farmacêuticas',
    'Sensores de Gás Etileno para Controle de Climatização',
    'Auditoria de Calibração de Dataloggers ISO 17025',
    'Cortinas de Ar Industriais em Docas Frigorificadas',
    'Pressurização Positiva em Áreas Limpas de Envase'
  ];

  coldChainAgents.forEach((ca, idx) => {
    agents.push({
      id: `agent-cold-${idx + 1}`,
      hubId: 'hub-iot-maintenance',
      name: ca,
      codeName: `AOS-COLD-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Cadeia do Frio & Atmosfera',
      description: `Prevenção de perda de carga térmica perecível e controle ambiental estrito: ${ca}.`,
      triggerKeywords: ['temperatura', 'câmara fria', 'congelado', 'frio', 'perecível', 'amônia', 'hvac'],
      erpEndpoint: `/api/v1/erp/coldchain/sensor-${idx + 1}`,
      status: idx < 4 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 4 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 22100,
      mitigatedBleedBrl: 2400000,
      generatedEconomyBrl: 380000,
      avgLatencyMs: 9,
      lastHeartbeat: 'Sensores térmicos ok',
      successRatePct: 99.9
    });
  });

  // Total Hub 4 = 20 + 10 + 15 = 45 agents!

  // ==========================================
  // HUB 5: CIBERSEGURANÇA & COMPLIANCE (35 AGENTES)
  // ==========================================

  // 1. 8 Anti-Ransomware & Honeytokens
  const cyberRansomwareAgents = [
    'Detecção de Criptografia em Massa (DejaVu Engine)',
    'Arquivos Canário & Honeytokens com Alerta Instantâneo',
    'Monitoramento e Proteção de VSS Shadow Copies',
    'Isolamento Automático de Segmento de Rede (Panic Lockdown)',
    'Kill-Switch de Processos com Alta Taxa de I/O em Disco',
    'Validação Contínua de Imutabilidade de Backups (WORM)',
    'Interceptação de Tráfego Malicioso de Comando e Controle (C2)',
    'Resposta a Incidentes Automatizada via SOAR / EDR'
  ];

  cyberRansomwareAgents.forEach((cra, idx) => {
    agents.push({
      id: `agent-cyber-sec-${idx + 1}`,
      hubId: 'hub-cyber-compliance',
      name: cra,
      codeName: `AOS-SEC-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Anti-Ransomware & Honeytokens',
      description: `Proteção perimetral e mitigação instantânea contra ameaças de sequestro de dados: ${cra}.`,
      triggerKeywords: ['ransomware', 'cyber', 'criptografia', 'canário', 'lockdown', 'backup', 'ataque'],
      erpEndpoint: `/api/v1/erp/cyber/lockdown-${idx + 1}`,
      status: idx < 4 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 4 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 38400,
      mitigatedBleedBrl: 8900000,
      generatedEconomyBrl: 450000,
      avgLatencyMs: 6,
      lastHeartbeat: 'Vigilância permanente',
      successRatePct: 99.99
    });
  });

  // 2. 9 IAM & UEBA
  const iamAgents = [
    'Análise de Comportamento Anômalo de Usuários (UEBA)',
    'Detecção de Logins Fora de Horário ou País Inesperado',
    'Revogação Instantânea de Credenciais Comprometidas',
    'Gestão de Acessos com Privilégios Elevados (PAM)',
    'Auditoria de MFA e Chaves FIDO2 Phishing-Resistant',
    'Segregação de Funções (SoD) em Módulos ERP TOTVS/SAP',
    'Desativação Imediata de Acessos de Colaboradores Desligados',
    'Higienização de Chaves SSH e Certificados SSL Órfãos',
    'Detecção e Bloqueio de Brute Force em APIs Externas'
  ];

  iamAgents.forEach((ia, idx) => {
    agents.push({
      id: `agent-iam-${idx + 1}`,
      hubId: 'hub-cyber-compliance',
      name: ia,
      codeName: `AOS-IAM-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Identidade & Privilégios (IAM/UEBA)',
      description: `Gestão de identidade corporativa e privilégios mínimos: ${ia}.`,
      triggerKeywords: ['iam', 'ueba', 'privilégio', 'senha', 'mfa', 'acesso', 'segurança', 'desligamento'],
      erpEndpoint: `/api/v1/erp/iam/auth-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 29800,
      mitigatedBleedBrl: 2100000,
      generatedEconomyBrl: 290000,
      avgLatencyMs: 8,
      lastHeartbeat: 'Ativo',
      successRatePct: 99.95
    });
  });

  // 3. 9 LGPD & GDPR
  const lgpdAgents = [
    'Anonimização & Pseudonimização Automática de Dados Sensíveis',
    'Prevenção de Vazamento de Dados em Telas e Relatórios (DLP)',
    'Portal de Atendimento a Direitos dos Titulares (DSR)',
    'Registro Eletrônico de Operações de Tratamento (ROPA)',
    'Gestão de Consentimento e Revogação de Termos de Privacidade',
    'Relatório de Impacto à Proteção de Dados (DPIA Automatizado)',
    'Varredura de CPF e Dados Médicos em Bases Não Criptografadas',
    'Bloqueio de Exportações Massivas de Cadastros de Clientes',
    'Auditoria de Transferências Internacionais de Dados Pessoais'
  ];

  lgpdAgents.forEach((la, idx) => {
    agents.push({
      id: `agent-lgpd-${idx + 1}`,
      hubId: 'hub-cyber-compliance',
      name: la,
      codeName: `AOS-LGPD-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Guardião LGPD & GDPR',
      description: `Conformidade rigorosa com a Lei Geral de Proteção de Dados: ${la}.`,
      triggerKeywords: ['lgpd', 'gdpr', 'privacidade', 'dados pessoais', 'cpf', 'anonimização', 'titular'],
      erpEndpoint: `/api/v1/erp/compliance/lgpd-${idx + 1}`,
      status: idx < 2 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 2 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 16500,
      mitigatedBleedBrl: 4500000,
      generatedEconomyBrl: 320000,
      avgLatencyMs: 10,
      lastHeartbeat: 'Guardião ativo',
      successRatePct: 99.9
    });
  });

  // 4. 9 Validação do Grafo & Invariantes
  const invariantsAgents = [
    'Validador de Invariantes de Negócio Pré-Execução ERP',
    'Checagem de Quórum Criptográfico Multi-Sig (Secp256k1)',
    'Verificador de Idempotência e Hash-Chain do Livro-Razão',
    'Auditoria da Integridade Criptográfica do Grafo de Conhecimento',
    'Detecção de Anomalias Estruturais em Relacionamentos de Nós',
    'Verificação de Limites Operacionais de Governança Corporativa',
    'Monitor de Drift em Regras e Parâmetros Decisórios',
    'Trava de Transações Circulares e Autofaturamento Intercompany',
    'Reconciliação Automatizada entre Grafo Contábil e Físico'
  ];

  invariantsAgents.forEach((iva, idx) => {
    agents.push({
      id: `agent-invariants-${idx + 1}`,
      hubId: 'hub-cyber-compliance',
      name: iva,
      codeName: `AOS-INV-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Validação de Invariantes do Grafo',
      description: `Guarda formal dos axiomas operacionais e integridade do livro-razão: ${iva}.`,
      triggerKeywords: ['invariante', 'grafo', 'governança', 'multisig', 'quórum', 'ledger', 'integridade'],
      erpEndpoint: `/api/v1/erp/governance/invariants-${idx + 1}`,
      status: 'ACTIVE',
      runtimeMode: 'CONTAINER_WARM',
      processedEventsCount: 42300,
      mitigatedBleedBrl: 6800000,
      generatedEconomyBrl: 410000,
      avgLatencyMs: 5,
      lastHeartbeat: 'Invariantes online',
      successRatePct: 99.99
    });
  });

  // Total Hub 5 = 8 + 9 + 9 + 9 = 35 agents!

  // ==========================================
  // HUB 6: JURÍDICO & CONTRATOS (35 AGENTES)
  // ==========================================

  // 1. 12 Analistas de Contratos
  const contractTypes = [
    'Contratos de Fornecimento de Longo Prazo (Take-or-Pay)',
    'Acordos de Nível de Serviço (SLA) com Clientes Tier-A',
    'Acordos de Confidencialidade e Sigilo Tecnológico (NDA)',
    'Contratos de Locação Comercial e Galpões Logísticos',
    'Contratos de Prestação de Serviços Terceirizados Fabris',
    'Termos de Exclusividade Mercadológica e Não-Competição',
    'Contratos de Fusões, Aquisições e M&A Societário',
    'Gestão de Fiança Bancária e Garantias Contratuais',
    'Prevenção de Renovação Automática Indesejada com Aviso Prévio',
    'Aplicação Correta de Índices de Reajuste (IPCA vs IGP-M)',
    'Cláusulas Penais, Multas Compensatórias e Limites (Cap)',
    'Validação de Assinaturas Digitais ICP-Brasil e e-Notariado'
  ];

  contractTypes.forEach((cta, idx) => {
    agents.push({
      id: `agent-legal-contract-${idx + 1}`,
      hubId: 'hub-legal-regulatory',
      name: cta,
      codeName: `AOS-CONTR-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Analistas Autônomos de Contratos',
      description: `Leitura analítica OCR/LLM e auditoria de minutas contratuais: ${cta}.`,
      triggerKeywords: ['contrato', 'minuta', 'cláusula', 'sla', 'nda', 'rescisão', 'reajuste', 'jurídico'],
      erpEndpoint: `/api/v1/erp/legal/contracts-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 4200,
      mitigatedBleedBrl: 1650000,
      generatedEconomyBrl: 320000,
      avgLatencyMs: 35,
      lastHeartbeat: 'OCR ativo',
      successRatePct: 99.4
    });
  });

  // 2. 11 Contencioso & Trabalhista
  const litigationAgents = [
    'Varredura Diária de Diários Oficiais de Justiça (DJe)',
    'Detecção Precoce de Novas Reclamatórias Trabalhistas',
    'Cálculo Automatizado de Provisões de Risco (CPC 25)',
    'Subsídios e Evidências para Audiências de Conciliação',
    'Controle de Prazos Processuais Fatais e Recursos',
    'Acompanhamento de Execuções Fiscais e Penhoras Online',
    'Análise Jurisprudencial de Teses Tributárias Repetitivas',
    'Auditoria de Levantamento de Depósitos Recursais Judiciais',
    'Contingenciamento de Processos Cíveis e de Relações de Consumo',
    'Gestão e Negociação de Precatórios e Créditos Judiciais',
    'Monitoramento de Liminares e Mandados de Segurança Ativos'
  ];

  litigationAgents.forEach((la, idx) => {
    agents.push({
      id: `agent-litigation-${idx + 1}`,
      hubId: 'hub-legal-regulatory',
      name: la,
      codeName: `AOS-LITIG-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Contencioso & Trabalhista',
      description: `Mitigação de passivos jurídicos contenciosos: ${la}.`,
      triggerKeywords: ['processo', 'trabalhista', 'diário oficial', 'provisão', 'cpc 25', 'audiência', 'liminar'],
      erpEndpoint: `/api/v1/erp/legal/litigation-${idx + 1}`,
      status: idx < 2 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 2 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 5100,
      mitigatedBleedBrl: 2100000,
      generatedEconomyBrl: 440000,
      avgLatencyMs: 30,
      lastHeartbeat: 'Monitor DJe online',
      successRatePct: 99.6
    });
  });

  // 3. 12 ESG, Licenças Ambientais & ISO
  const esgAgents = [
    'Controle de Validade da Licença de Operação (CETESB/IBAMA)',
    'Monitoramento de Outorgas de Uso de Água e Lançamento de Efluentes',
    'Gestão de Manifesto de Transporte de Resíduos Perigosos (MTR)',
    'Relatório Anual Obrigatório IBAMA (CTF/APP)',
    'Conformidade ISO 14001 Sistema de Gestão Ambiental',
    'Conformidade ISO 9001 Gestão da Qualidade e Não-Conformidades',
    'Conformidade ISO 27001 Segurança da Informação',
    'Auditoria de Emissões de Gases de Efeito Estufa (Escopos 1, 2 e 3)',
    'Monitoramento de Passivos e Áreas Potencialmente Contaminadas',
    'Rastreabilidade da Logística Reversa de Embalagens Pós-Consumo',
    'Conformidade com a Norma NR-12 de Segurança em Máquinas',
    'Elaboração Automatizada de Relatórios ESG Padrão GRI / SASB'
  ];

  esgAgents.forEach((ea, idx) => {
    agents.push({
      id: `agent-esg-${idx + 1}`,
      hubId: 'hub-legal-regulatory',
      name: ea,
      codeName: `AOS-ESG-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'ESG, Licenças Ambientais & ISO',
      description: `Governança socioambiental e conformidade com normas técnicas: ${ea}.`,
      triggerKeywords: ['esg', 'ibama', 'cetesb', 'licença', 'ambiental', 'iso 9001', 'iso 14001', 'resíduos'],
      erpEndpoint: `/api/v1/erp/compliance/esg-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 3900,
      mitigatedBleedBrl: 1800000,
      generatedEconomyBrl: 210000,
      avgLatencyMs: 25,
      lastHeartbeat: 'Ativo',
      successRatePct: 99.7
    });
  });

  // Total Hub 6 = 12 + 11 + 12 = 35 agents!

  // ==========================================
  // HUB 7: RECURSOS HUMANOS & DP (25 AGENTES)
  // ==========================================

  // 1. 13 Folha de Pagamento & eSocial
  const hrPayrollAgents = [
    'Eventos Iniciais e de Tabelas eSocial (S-1000 a S-1070)',
    'Eventos Não Periódicos de Admissão e Desligamento (S-2200/S-2299)',
    'Eventos Periódicos de Remuneração e Pagamentos (S-1200/S-1210)',
    'Fechamento Mensal DCTFWeb e Geração de DARF Previdenciário',
    'Auditoria Prévia de Apuração do FGTS Digital',
    'Conferência de Horas Extras, Adicional Noturno e Banco de Horas',
    'Auditoria de Enquadramento RAT / FAP para Evitar Bitributação',
    'Controle Preventivo de Férias a Vencer e Prazos em Dobro',
    'Gestão Automatizada de Adiantamentos Salariais e 13º Salário',
    'Auditoria de Descontos Legais de Benefícios (VT, VR e Plano)',
    'Prevenção de Equiparação Salarial e Desvio de Função Ilegal',
    'Cálculo e Simulação de Rescisões Contratuais e Multas rescisórias',
    'Conferência de Ofícios de Pensões Alimentícias Judiciais'
  ];

  hrPayrollAgents.forEach((hpa, idx) => {
    agents.push({
      id: `agent-hr-pay-${idx + 1}`,
      hubId: 'hub-hr-personnel',
      name: hpa,
      codeName: `AOS-HRPAY-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Folha de Pagamento & eSocial',
      description: `Conformidade trabalhista e previdenciária em tempo real: ${hpa}.`,
      triggerKeywords: ['esocial', 'folha', 'salário', 'férias', 'fgts', 'inss', 'rescisão', 'horas extras'],
      erpEndpoint: `/api/v1/erp/hr/payroll-${idx + 1}`,
      status: idx < 4 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 4 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 6800,
      mitigatedBleedBrl: 920000,
      generatedEconomyBrl: 280000,
      avgLatencyMs: 18,
      lastHeartbeat: 'eSocial integrado',
      successRatePct: 99.8
    });
  });

  // 2. 12 Saúde, Segurança do Trabalho (SST) & CIPA
  const sstAgents = [
    'Controle de Validade de ASOs (Admissional, Periódico, Demissional)',
    'Transmissão de Eventos SST eSocial (S-2210, S-2220, S-2240)',
    'Gestão de Certificados de Aprovação (CA) de EPIs Obrigatórios',
    'Comunicação de Acidente de Trabalho (CAT) Automatizada',
    'Governança do Programa de Gerenciamento de Riscos (PGR)',
    'Acompanhamento do Programa de Controle Médico (PCMSO)',
    'Laudo Técnico das Condições Ambientais do Trabalho (LTCAT)',
    'Gestão de Mandatos, Atas e Reuniões Mensais da CIPA',
    'Controle de Validade de Treinamentos de Normas (NR-10, NR-35, NR-33)',
    'Gestão de Brigada de Incêndio e Simulados Periódicos de Abandono',
    'Auditoria Ergonômica de Postos de Trabalho (NR-17)',
    'Acompanhamento de Afastamentos Previdenciários (B31 e B91)'
  ];

  sstAgents.forEach((sa, idx) => {
    agents.push({
      id: `agent-sst-${idx + 1}`,
      hubId: 'hub-hr-personnel',
      name: sa,
      codeName: `AOS-SST-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Saúde, Segurança (SST) & CIPA',
      description: `Proteção da vida, saúde do colaborador e blindagem contra autos de infração: ${sa}.`,
      triggerKeywords: ['sst', 'aso', 'epi', 'cat', 'cipa', 'pgr', 'pcmso', 'nr-10', 'nr-35', 'segurança'],
      erpEndpoint: `/api/v1/erp/hr/sst-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 5200,
      mitigatedBleedBrl: 840000,
      generatedEconomyBrl: 190000,
      avgLatencyMs: 16,
      lastHeartbeat: 'SST em dia',
      successRatePct: 99.7
    });
  });

  // Total Hub 7 = 13 + 12 = 25 agents!

  // ==========================================
  // HUB 8: VERTICAIS SETORIAIS (25 AGENTES)
  // ==========================================

  // 1. 9 Farma & Anvisa RDC
  const pharmaAgents = [
    'Boas Práticas de Fabricação Farmacêutica (BPF / Anvisa RDC 658)',
    'Rastreabilidade Unitária SNCM e Serialização Datamatrix',
    'Gestão de Estoque por Vencimento Rigoroso (FEFO Farmacêutico)',
    'Investigação Autônoma de Resultados Fora de Especificação (OOS)',
    'Controle de Mudanças e Validação de Processos Críticos',
    'Rastreabilidade Estrita de Matérias-Primas Químicas Controladas',
    'Disparo Automatizado de Protocolo de Recall Sanitário',
    'Liberação Paramétrica de Lotes de Medicamentos no ERP',
    'Monitoramento em Tempo Real de Alertas Sanitários Globais'
  ];

  pharmaAgents.forEach((pa, idx) => {
    agents.push({
      id: `agent-pharma-${idx + 1}`,
      hubId: 'hub-verticals',
      name: pa,
      codeName: `AOS-PHARMA-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Farma & Anvisa RDC',
      description: `Rigor farmacêutico de conformidade sanitária e Boas Práticas de Fabricação: ${pa}.`,
      triggerKeywords: ['farma', 'anvisa', 'rdc', 'medicamento', 'bpf', 'lote', 'validade', 'oos', 'sncm'],
      erpEndpoint: `/api/v1/erp/pharma/protocol-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 8900,
      mitigatedBleedBrl: 3200000,
      generatedEconomyBrl: 450000,
      avgLatencyMs: 18,
      lastHeartbeat: 'Certificado Anvisa BPF',
      successRatePct: 99.9
    });
  });

  // 2. 8 Automotiva & IATF 16949
  const autoAgents = [
    'Processo de Aprovação de Peças de Produção (PPAP Automotivo)',
    'Planejamento Avançado da Qualidade do Produto (APQP)',
    'Análise de Modos de Falha e Seus Efeitos (FMEA / AIAG-VDA)',
    'Controle Estatístico de Processo em Tempo Real (CEP / Cp / Cpk)',
    'Gestão de Ferramental e Troca Rápida de Ferramenta (SMED)',
    'Rastreabilidade Serial de Peças de Segurança (Safety Parts)',
    'Gestão de Não-Conformidades e Relatórios 8D Automatizados',
    'Rastreabilidade de Bobinas e Lotes de Aço Estampado'
  ];

  autoAgents.forEach((aa, idx) => {
    agents.push({
      id: `agent-auto-${idx + 1}`,
      hubId: 'hub-verticals',
      name: aa,
      codeName: `AOS-AUTO-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Automotiva & IATF 16949',
      description: `Governança dos padrões de qualidade da indústria automobilística mundial: ${aa}.`,
      triggerKeywords: ['automotiva', 'iatf', 'ppap', 'apqp', 'fmea', 'cep', '8d', 'montadora', 'peça'],
      erpEndpoint: `/api/v1/erp/auto/quality-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 7400,
      mitigatedBleedBrl: 2100000,
      generatedEconomyBrl: 390000,
      avgLatencyMs: 20,
      lastHeartbeat: 'Conformidade IATF',
      successRatePct: 99.8
    });
  });

  // 3. 8 Agronegócio, Grãos & Barter
  const agriAgents = [
    'Classificação Automática de Grãos (Umidade, Impureza e Quebrados)',
    'Gestão de Contratos de Troca e Barter (Insumos por Safra)',
    'Emissão e Registro Eletrônico de Cédula de Produto Rural (CPR)',
    'Rastreabilidade de Receituário Agronômico e Defensivos',
    'Monitoramento de Silos e Aeração Preditiva de Grãos',
    'Análise de Risco Climático e Seguro Rural Paramétrico',
    'Gestão e Projeção de Produtividade Agrícola por Talhão',
    'Rastreabilidade de Certificação Não-Transgênica (Non-GMO)'
  ];

  agriAgents.forEach((aga, idx) => {
    agents.push({
      id: `agent-agri-${idx + 1}`,
      hubId: 'hub-verticals',
      name: aga,
      codeName: `AOS-AGRI-${String(idx + 1).padStart(2, '0')}`,
      subCategory: 'Agronegócio, Grãos & Barter',
      description: `Operações no campo, originação de grãos e instrumentos financeiros do agro: ${aga}.`,
      triggerKeywords: ['agro', 'grãos', 'safra', 'soja', 'milho', 'barter', 'cpr', 'silo', 'umidade'],
      erpEndpoint: `/api/v1/erp/agri/grain-${idx + 1}`,
      status: idx < 3 ? 'ACTIVE' : 'STANDBY_ON_DEMAND' as any,
      runtimeMode: idx < 3 ? 'CONTAINER_WARM' : 'STANDBY_ON_DEMAND',
      processedEventsCount: 6100,
      mitigatedBleedBrl: 1800000,
      generatedEconomyBrl: 510000,
      avgLatencyMs: 21,
      lastHeartbeat: 'Originação ativa',
      successRatePct: 99.7
    });
  });

  // Total Hub 8 = 9 + 8 + 8 = 25 agents!

  return agents;
}

// Full 300 micro-agents singleton catalog
export const ALL_300_MICRO_AGENTS: MicroAgentDefinition[] = buildAllMicroAgents();

// Fast lookup by Hub ID
export function getMicroAgentsByHub(hubId: StrategicHubId): MicroAgentDefinition[] {
  return ALL_300_MICRO_AGENTS.filter(a => a.hubId === hubId);
}

// Fast lookup by Agent ID
export function getMicroAgentById(agentId: string): MicroAgentDefinition | undefined {
  return ALL_300_MICRO_AGENTS.find(a => a.id === agentId);
}
