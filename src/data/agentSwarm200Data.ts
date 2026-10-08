/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * O catálogo de agentes foi migrado para a tabela MicroAgent do Prisma / PostgreSQL.
 */
export interface AgentDefinition {
  id: string;
  name: string;
  code: string;
  swarmId: string;
  swarmName: string;
  cnaeCategories: string[];
  roleDescription: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresZeroGuiApproval: boolean;
  approvalThresholdBrl: number;
  ragContextIsolation: 'TENANT_STRICT_RAG' | 'SECTOR_HYBRID_RAG' | 'GLOBAL_CORE_RAG';
  protocol: 'INTER_AGENT_CONSENSUS' | 'DIRECT_EXECUTION' | 'C_LEVEL_ESCALATION';
  status: 'ONLINE' | 'ACTIVE' | 'STANDBY' | 'DEGRADED';
  telemetry: {
    avgLatencyMs: number;
    successRate: number;
    deliberationsCount: number;
  };
}

export interface SwarmCategory {
  id: string;
  name: string;
  path: string;
  agentCount: number;
  cnaeRange: string;
  description: string;
  colorScheme: {
    border: string;
    bg: string;
    text: string;
    badge: string;
  };
}

export const VELATRIX_SWARMS: SwarmCategory[] = [
  {
    id: 'core_financial',
    name: '1. Financial & Treasury Core Swarm',
    path: '/app/agents/swarms/core_financial/',
    agentCount: 20,
    cnaeRange: 'Transversal (Todos os CNAEs)',
    description: 'Enxame de consenso financeiro obrigatório: conciliação D+0, DDA bancário, cash-burn, liquidez e solvência.',
    colorScheme: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
    }
  },
  {
    id: 'core_risk_security',
    name: '2. Risk, Security & Zero-Trust Swarm',
    path: '/app/agents/swarms/core_risk_security/',
    agentCount: 18,
    cnaeRange: 'Transversal (Segurança & LGPD)',
    description: 'Enxame de guarda e invariantes: detecção de phishing de chave PIX, verificação de quórum multi-sig e quarentena.',
    colorScheme: {
      border: 'border-red-500/40',
      bg: 'bg-red-950/40',
      text: 'text-red-300',
      badge: 'bg-red-900/60 text-red-300 border-red-700'
    }
  },
  {
    id: 'core_supply_manufacturing',
    name: '3. Supply Chain & Manufacturing BOM Swarm',
    path: '/app/agents/swarms/core_supply_manufacturing/',
    agentCount: 18,
    cnaeRange: 'CNAE 10.00 a 33.00 (Indústria & Manufatura)',
    description: 'BOM industrial, MRP autônomo, manutenção preditiva OEE de máquinas e reposição kanban ERP.',
    colorScheme: {
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      badge: 'bg-blue-900/60 text-blue-300 border-blue-700'
    }
  },
  {
    id: 'b3_financial',
    name: '4. B3 & Financial Markets Swarm',
    path: '/app/agents/swarms/b3_financial/',
    agentCount: 18,
    cnaeRange: 'CNAE 64.00 a 66.99 (Serviços Financeiros & Mercado de Capitais)',
    description: 'Valuation em tempo real, solvência Basileia III, conformidade CVM 175, Risk-Profit Warning e derivativos.',
    colorScheme: {
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/40',
      text: 'text-cyan-300',
      badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700'
    }
  },
  {
    id: 'agribusiness',
    name: '5. Agribusiness & Rural Intelligence Swarm',
    path: '/app/agents/swarms/agribusiness/',
    agentCount: 18,
    cnaeRange: 'CNAE 01.11 a 03.22 (Agropecuária, Grãos, Trading & Frigoríficos)',
    description: 'Hedge de commodities (CBOT/B3), contratos de Barter (CPR verde), telemetria IoT solo/clima e OEE de colheita.',
    colorScheme: {
      border: 'border-lime-500/40',
      bg: 'bg-lime-950/40',
      text: 'text-lime-300',
      badge: 'bg-lime-900/60 text-lime-300 border-lime-700'
    }
  },
  {
    id: 'retail_omni',
    name: '6. Retail & Omnichannel Commerce Swarm',
    path: '/app/agents/swarms/retail_omni/',
    agentCount: 18,
    cnaeRange: 'CNAE 47.00 a 47.99 (Varejo, Supermercados & E-commerce)',
    description: 'Prevenção de ruptura de gôndola, roteamento last-mile, loss prevention antifurto e reprecificação dinâmica elástica.',
    colorScheme: {
      border: 'border-orange-500/40',
      bg: 'bg-orange-950/40',
      text: 'text-orange-300',
      badge: 'bg-orange-900/60 text-orange-300 border-orange-700'
    }
  },
  {
    id: 'real_estate',
    name: '7. Real Estate & Construction Swarm',
    path: '/app/agents/swarms/real_estate/',
    agentCount: 18,
    cnaeRange: 'CNAE 41.00 a 43.99 / 68.10 a 68.32 (Construção Civil & Imobiliário)',
    description: 'Medição automática BIM/cronograma de obra, reajuste de parcelas INCC/IGP-M, inadimplência e distrato de VGV.',
    colorScheme: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-700'
    }
  },
  {
    id: 'energy_utilities',
    name: '8. Energy & Utilities Swarm',
    path: '/app/agents/swarms/energy_utilities/',
    agentCount: 18,
    cnaeRange: 'CNAE 35.11 a 35.30 (Geração, Transmissão, Comercialização de Energia)',
    description: 'Gestão de contratos CCEE (Ambiente Livre ACL), balanço energético horossazonal e FinOps de demanda contratada.',
    colorScheme: {
      border: 'border-yellow-500/40',
      bg: 'bg-yellow-950/40',
      text: 'text-yellow-300',
      badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-700'
    }
  },
  {
    id: 'telecom_saas',
    name: '9. Telecom & SaaS Cloud Swarm',
    path: '/app/agents/swarms/telecom_saas/',
    agentCount: 18,
    cnaeRange: 'CNAE 61.10 a 63.99 (Telecomunicações, ISPs e Software SaaS)',
    description: 'Churn preditivo por telemetria de produto, FinOps Cloud (AWS/GCP), degradamento de QoS Anatel e downgrades.',
    colorScheme: {
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-950/40',
      text: 'text-indigo-300',
      badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
    }
  },
  {
    id: 'education',
    name: '10. Education & EdTech Swarm',
    path: '/app/agents/swarms/education/',
    agentCount: 18,
    cnaeRange: 'CNAE 85.11 a 85.99 (Ensino Superior, Básico, Cursos Livres e EaD)',
    description: 'Evasão preditiva de alunos por engajamento LMS, conciliação de repasse FIES/Prouni e taxa de ocupação de turmas.',
    colorScheme: {
      border: 'border-purple-500/40',
      bg: 'bg-purple-950/40',
      text: 'text-purple-300',
      badge: 'bg-purple-900/60 text-purple-300 border-purple-700'
    }
  },
  {
    id: 'public_sector',
    name: '11. Public Sector & GovTech Swarm',
    path: '/app/agents/swarms/public_sector/',
    agentCount: 18,
    cnaeRange: 'CNAE 84.11 a 84.30 (Administração Pública, Autarquias e Concessões)',
    description: 'Conformidade Lei de Responsabilidade Fiscal (LRF), auditoria de editais de licitação e ledger de transparência.',
    colorScheme: {
      border: 'border-teal-500/40',
      bg: 'bg-teal-950/40',
      text: 'text-teal-300',
      badge: 'bg-teal-900/60 text-teal-300 border-teal-700'
    }
  },
  {
    id: 'ecommerce_marketplace',
    name: '12. E-commerce, Marketplace & Varejo Digital Swarm',
    path: '/app/agents/swarms/ecommerce_marketplace/',
    agentCount: 10,
    cnaeRange: 'CNAE 47.91-2 / 73.19-0 (Marketplaces & E-commerce)',
    description: 'Auditoria de comissões, conciliação de frete/repasses, lucratividade real por SKU, devoluções e reposição preditiva para sellers.',
    colorScheme: {
      border: 'border-pink-500/40',
      bg: 'bg-pink-950/40',
      text: 'text-pink-300',
      badge: 'bg-pink-900/60 text-pink-300 border-pink-700'
    }
  },
  {
    id: 'recuperacao_judicial',
    name: '13. Reestruturação & Recuperação Judicial Swarm',
    path: '/app/agents/swarms/recuperacao_judicial/',
    agentCount: 10,
    cnaeRange: 'Transversal (Reestruturação & Lei 11.101/05)',
    description: 'Monitoramento de solvência Z-Score, blindagem contra sangrias, simulação de deságio de credores e relatórios ao Administrador Judicial.',
    colorScheme: {
      border: 'border-rose-500/40',
      bg: 'bg-rose-950/40',
      text: 'text-rose-300',
      badge: 'bg-rose-900/60 text-rose-300 border-rose-700'
    }
  },
  {
    id: 'saude_hospitais',
    name: '14. Saúde, Hospitais & Bioquímica Swarm',
    path: '/app/agents/swarms/saude_hospitais/',
    agentCount: 10,
    cnaeRange: 'CNAE 86.10-1 a 86.90-9 / 72.10-0 (Hospitais, Clínicas, Laboratórios & Farmacêutica)',
    description: 'Auditoria de glosas médicas, rastreabilidade de medicamentos/cold chain, OPME, LIMS laboratorial e pacotes cirúrgicos.',
    colorScheme: {
      border: 'border-emerald-500/40',
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-300',
      badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
    }
  },
  {
    id: 'industria_manufatura_agro',
    name: '15. Indústria, Manufatura & Agronegócio Especialista Swarm',
    path: '/app/agents/swarms/industria_manufatura_agro/',
    agentCount: 10,
    cnaeRange: 'CNAE 10.00 a 33.00 / 01.11 a 03.22 (Indústria, Manufatura & Agro)',
    description: 'OEE avançado, manutenção preditiva, controle de refugo, frete agrícola, insumos controlados e pegada ESG.',
    colorScheme: {
      border: 'border-blue-500/40',
      bg: 'bg-blue-950/40',
      text: 'text-blue-300',
      badge: 'bg-blue-900/60 text-blue-300 border-blue-700'
    }
  },
  {
    id: 'transportes_logistica',
    name: '16. Transportes, Frota & Logística Swarm',
    path: '/app/agents/swarms/transportes_logistica/',
    agentCount: 10,
    cnaeRange: 'CNAE 49.11 a 53.20 (Transporte, Frotas & Operadores Logísticos)',
    description: 'Auditoria de pedágios, gestão de CPK de pneus, overstay/estadia, conciliação fracionada e jornada do motorista.',
    colorScheme: {
      border: 'border-amber-500/40',
      bg: 'bg-amber-950/40',
      text: 'text-amber-300',
      badge: 'bg-amber-900/60 text-amber-300 border-amber-700'
    }
  },
  {
    id: 'juridico_compliance',
    name: '17. Jurídico Corporativo, M&A & Compliance Swarm',
    path: '/app/agents/swarms/juridico_compliance/',
    agentCount: 10,
    cnaeRange: 'CNAE 69.11 a 70.20 (Serviços Jurídicos, M&A, Auditoria e Compliance)',
    description: 'Auditoria de contratos enterprise, monitoramento de Diários Oficiais/Jusbrasil, Due Diligence M&A, LGPD e provisões jurídicas.',
    colorScheme: {
      border: 'border-indigo-500/40',
      bg: 'bg-indigo-950/40',
      text: 'text-indigo-300',
      badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700'
    }
  },
  {
    id: 'fiscal_cfo_office',
    name: '18. Fiscal, Tributário & Finanças (CFO Office) Swarm',
    path: '/app/agents/swarms/fiscal_cfo_office/',
    agentCount: 10,
    cnaeRange: 'Transversal (Controladoria, Tributário & CFO Office)',
    description: 'Detecção de NCM divergente, PIS/COFINS monofásico, ICMS-ST, duplicatas frias, conciliação de adquirentes e FinOps Cloud.',
    colorScheme: {
      border: 'border-teal-500/40',
      bg: 'bg-teal-950/40',
      text: 'text-teal-300',
      badge: 'bg-teal-900/60 text-teal-300 border-teal-700'
    }
  },
  {
    id: 'supermercados_food_service',
    name: '19. Supermercados, Alimentos & Food Service Swarm',
    path: '/app/agents/swarms/supermercados_food_service/',
    agentCount: 10,
    cnaeRange: 'CNAE 47.11 a 47.29 / 56.11 a 56.20 (Supermercados & Food Service)',
    description: 'Quebra de caixa, fator de correção/rendimento, validade PVPS/FIFO, reconciliação de delivery (iFood/Rappi) e prevenção de perdas.',
    colorScheme: {
      border: 'border-orange-500/40',
      bg: 'bg-orange-950/40',
      text: 'text-orange-300',
      badge: 'bg-orange-900/60 text-orange-300 border-orange-700'
    }
  },
  {
    id: 'imobiliario_incorporacao',
    name: '20. Imobiliário, Construção Civil & Incorporação Swarm',
    path: '/app/agents/swarms/imobiliario_incorporacao/',
    agentCount: 10,
    cnaeRange: 'CNAE 41.10 a 43.99 / 68.10 a 68.32 (Incorporação, Obras & Gestão Imobiliária)',
    description: 'Medição de obras, desvio de insumos, reajuste INCC/IGP-M, inadimplência de condomínios, viabilidade de terrenos e distratos.',
    colorScheme: {
      border: 'border-yellow-500/40',
      bg: 'bg-yellow-950/40',
      text: 'text-yellow-300',
      badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-700'
    }
  },
  {
    id: 'educacao_franquias_b2b',
    name: '21. Educação, Franquias & Serviços B2B Swarm',
    path: '/app/agents/swarms/educacao_franquias_b2b/',
    agentCount: 10,
    cnaeRange: 'CNAE 85.11 a 85.99 / 77.40 / 70.20 (Educação, Franquias & Serviços Corporativos B2B)',
    description: 'Prevenção de evasão escolar, royalties de franquias, overbilling de horas, CAC x LTV, renovação SaaS e capacity planning.',
    colorScheme: {
      border: 'border-sky-500/40',
      bg: 'bg-sky-950/40',
      text: 'text-sky-300',
      badge: 'bg-sky-900/60 text-sky-300 border-sky-700'
    }
  }
];

// Helper to generate the exact 200 agents
const generateAll200Agents = (): AgentDefinition[] => {
  const list: AgentDefinition[] = [];

  // 1. Core Financial (20 Agentes)
  const coreFinancialAgents = [
    { code: 'AGT-FIN-01', name: 'Cash Flow D+0 Realtime Reconciler', desc: 'Conciliação em tempo real de extratos OFX/Open Finance com razão contábil do ERP.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-FIN-02', name: 'Working Capital & Liquidity Shield', desc: 'Monitora a reserva de segurança de OPEX e antecipa necessidade de capital de giro.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-FIN-03', name: 'DDA & Automated Boleto Sweeper', desc: 'Varredura de DDA interbancário para bloqueio de boletos não reconhecidos e fraudes.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-FIN-04', name: 'Capex Allocation & ROI Optimizer', desc: 'Avaliação de desembolsos de investimentos industriais com taxa interna de retorno.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-FIN-05', name: 'Tax Substitution (ST) & DIFAL Engine', desc: 'Cálculo de ICMS-ST e diferencial de alíquota em operações interestaduais.', risk: 'MEDIUM', thresh: 20000, zeroGui: true },
    { code: 'AGT-FIN-06', name: 'FX Exposure & Currency Hedger', desc: 'Proteção cambial automática contra oscilações de USD/EUR para passivos importados.', risk: 'CRITICAL', thresh: 15000, zeroGui: true },
    { code: 'AGT-FIN-07', name: 'P&L EBITDA Margin Guard', desc: 'Guardião de margem de contribuição operacional por unidade de negócio.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-FIN-08', name: 'Debt Covenant Compliance Monitor', desc: 'Verificação contínua de índices Dívida Líquida/EBITDA de debêntures e bancos.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-FIN-09', name: 'Intercompany Transfer Pricing Agent', desc: 'Auditoria de preços de transferência e compliance tributário entre filiais.', risk: 'MEDIUM', thresh: 30000, zeroGui: true },
    { code: 'AGT-FIN-10', name: 'Customer Credit Scoring & Limit Assigner', desc: 'Liberação de limite de crédito para clientes B2B via bureaus e histórico pontual.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-FIN-11', name: 'Default Recovery & Dunning Automator', desc: 'Régua inteligente de cobrança e renegociação de títulos vencidos.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-FIN-12', name: 'Payroll Provision & Social Burden Auditor', desc: 'Auditoria de provisões de 13º, férias e encargos trabalhistas FGTS/INSS.', risk: 'MEDIUM', thresh: 15000, zeroGui: true },
    { code: 'AGT-FIN-13', name: 'Supplier Early Payment Discount Negotiator', desc: 'Otimização de desconto financeiro para quitação antecipada de fornecedores.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-FIN-14', name: 'SPED EFD-Reinf & Fiscal Ledger Reconciler', desc: 'Conferência de escriturações fiscais digitais com a base do SEFAZ.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-FIN-15', name: 'Interest Rate Swap & CDI Arbitrageur', desc: 'Monitoramento de curvas de juros DI e otimização de indexadores de dívida.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-FIN-16', name: 'Corporate Card Expense Fraud Detective', desc: 'Detecção de transações anômalas em cartões corporativos executivos.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-FIN-17', name: 'Budget Variance & Zero-Based Budgeting Agent', desc: 'Controle orçamentário matricial e identificação de desvios de centro de custo.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-FIN-18', name: 'Factoring & Receivables Discount Simulator', desc: 'Simulação do custo de oportunidade de antecipação de duplicatas em FIDCs.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-FIN-19', name: 'Bank Fee & Float Leakage Detector', desc: 'Auditoria de tarifas bancárias indevidas e cobranças fora do acordado.', risk: 'LOW', thresh: 2000, zeroGui: false },
    { code: 'AGT-FIN-20', name: 'Consolidated Holding Balance Synthesizer', desc: 'Consolidação contábil multi-CNPJ com eliminação de saldos intercompany.', risk: 'HIGH', thresh: 50000, zeroGui: true }
  ];

  coreFinancialAgents.forEach((a, idx) => {
    list.push({
      id: `core_fin_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'core_financial',
      swarmName: 'Financial & Treasury Core Swarm',
      cnaeCategories: ['Transversal (Todos os CNAEs)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'GLOBAL_CORE_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 14 + (idx % 12),
        successRate: 99.8,
        deliberationsCount: 1420 + idx * 85
      }
    });
  });

  // 2. Core Risk & Security (18 Agentes)
  const coreRiskAgents = [
    { code: 'AGT-SEC-01', name: 'Zero-Trust PIX Key Hijacking Sentinel', desc: 'Bloqueio instantâneo de alterações de chave PIX de fornecedores sem quórum biometria.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-02', name: 'Man-In-The-Middle Invoice Validator', desc: 'Checagem criptográfica de PDF de boleto contra chaves NF-e autorizadas no SEFAZ.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-03', name: 'Multi-Sig Quorum Enforcement Engine', desc: 'Validação de alçadas de assinatura digital para pagamentos críticos.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-04', name: 'LGPD Sensitive Data Masker & Gatekeeper', desc: 'Ofuscação de dados pessoais sensíveis e auditoria de vazamento de credenciais.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-SEC-05', name: 'ERP Privilege Escalation Detector', desc: 'Monitoramento de concessão indevida de permissões administrativas no ERP.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-SEC-06', name: 'Red Team Adversarial Prompt Injector', desc: 'Simulação contínua de ataques de engenharia social e jailbreak contra os agentes.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-SEC-07', name: 'API Key & Token Secret Rotation Agent', desc: 'Rotação autônoma de segredos de integração e certificados digitais A1.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-SEC-08', name: 'Ransomware & Shadow Ledger Isolation', desc: 'Quarentena imediata de base de dados em caso de anomalia de transações em massa.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-09', name: 'Contract Signature Spoofing Detector', desc: 'Análise forense de assinaturas digitais ICP-Brasil e DocuSign.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-SEC-10', name: 'DDoS & Rate Limit Traffic Balancer', desc: 'Proteção de gateways e balanceamento de requisições de webhooks ERP.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-SEC-11', name: 'Internal Fraud & Kickback Pattern Scout', desc: 'Detecção de favorecimento ilícito de fornecedores via análise de grafos de relacionamento.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-12', name: 'HSM Cryptographic Key Custodian', desc: 'Interface segura com módulos de segurança de hardware para emissão fiscal.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-SEC-13', name: 'Compliance Sanctions & OFAC List Screener', desc: 'Varredura de listas restritivas internacionais (OFAC, ONU, PEPs, CGU/CEIS).', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-SEC-14', name: 'Phishing Email & Domain Impersonation Guard', desc: 'Detecção de domínios tipográficos falsos solicitando alteração de dados bancários.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-15', name: 'Supply Chain Vendor Risk Evaluator', desc: 'Monitoramento da saúde financeira e certidões negativas (CND) de fornecedores chave.', risk: 'MEDIUM', thresh: 30000, zeroGui: false },
    { code: 'AGT-SEC-16', name: 'Device Fingerprint & Geo-Anomaly Verifier', desc: 'Bloqueio de autorizações Zero-GUI originadas de IPs e localidades suspeitas.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-SEC-17', name: 'Audit Trail Hash Chaining Anchor', desc: 'Geração de hashes imutáveis encadeados (Merkle Tree) para cada ação executada.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-SEC-18', name: 'Air-Gapped Sync & Safe Replicator', desc: 'Validação de pacotes de dados para ambientes isolados e sem conexão externa.', risk: 'HIGH', thresh: 50000, zeroGui: true }
  ];

  coreRiskAgents.forEach((a, idx) => {
    list.push({
      id: `core_risk_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'core_risk_security',
      swarmName: 'Risk, Security & Zero-Trust Swarm',
      cnaeCategories: ['Transversal (Segurança & LGPD)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'GLOBAL_CORE_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 8 + (idx % 8),
        successRate: 99.9,
        deliberationsCount: 2840 + idx * 110
      }
    });
  });

  // 3. Core Supply & Manufacturing (18 Agentes)
  const coreSupplyAgents = [
    { code: 'AGT-MFG-01', name: 'Dynamic Bill of Materials (BOM) Exploder', desc: 'Explosão de listas técnicas e cálculo de necessidades líquidas de matéria-prima.', risk: 'MEDIUM', thresh: 15000, zeroGui: true },
    { code: 'AGT-MFG-02', name: 'Autonomous Purchase Order Issuer', desc: 'Geração e disparo automático de ordens de compra ao atingir ponto de resuprimento.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-MFG-03', name: 'OEE Machine Line Telemetry Monitor', desc: 'Acompanhamento do índice de eficiência global de linhas de produção industrial.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-MFG-04', name: 'Predictive Tooling Wear & Maintenance Agent', desc: 'Previsão de desgaste de moldes e agendamento de paradas preventivas de máquinas.', risk: 'MEDIUM', thresh: 20000, zeroGui: false },
    { code: 'AGT-MFG-05', name: 'Kanban Buffer & Safety Stock Tuner', desc: 'Ajuste dinâmico de estoques mínimos considerando lead time real de entrega.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-MFG-06', name: 'Scrap & Material Waste Shrinkage Auditor', desc: 'Identificação de perdas anômalas no processo de corte e usinagem fabril.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-MFG-07', name: 'Quality Inspection & Non-Conformance Classifier', desc: 'Triagem de laudos técnicos de controle de qualidade e devolução ao fornecedor.', risk: 'MEDIUM', thresh: 15000, zeroGui: true },
    { code: 'AGT-MFG-08', name: 'Factory Floor Energy Peak Demand Balancer', desc: 'Deslocamento de cargas elétricas de fornos industriais para horários fora de ponta.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-MFG-09', name: 'Multi-Plant Production Load Optimizer', desc: 'Roteamento balanceado de ordens de fabricação entre diferentes unidades fabris.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-MFG-10', name: 'Hazardous Materials & Environmental Guard (IBAMA)', desc: 'Conformidade com licenças ambientais e manifesto de resíduos perigosos.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-MFG-11', name: 'Inventory Cycle Count & RFID Discrepancy Finder', desc: 'Conciliação entre inventário físico RFID e saldo em estoque no ERP.', risk: 'LOW', thresh: 10000, zeroGui: false },
    { code: 'AGT-MFG-12', name: 'Subcontractor & Toll Manufacturing Tracker', desc: 'Controle de remessa para industrialização em terceiros e retorno de insumos.', risk: 'MEDIUM', thresh: 20000, zeroGui: true },
    { code: 'AGT-MFG-13', name: 'Packaging Dimension & Palletization Optimist', desc: 'Otimização de cubagem de paletes para redução de frete fracionado.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-MFG-14', name: 'Raw Material Batch Expiry & FIFO Enforcer', desc: 'Garantia de saída de insumos perecíveis por lote e data de validade mais antiga.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-MFG-15', name: 'Supplier Delivery SLA & Late Penalty Invoicer', desc: 'Apuração automática de multas por atraso e desacordo comercial com fornecedores.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-MFG-16', name: 'Just-in-Time Dock Scheduling Coordinator', desc: 'Agendamento sincronizado de janelas de descarga em docas fabris.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-MFG-17', name: 'Setup Time (SMED) Reduction Analytics Agent', desc: 'Análise de tempos mortos de troca de ferramental nas linhas de montagem.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-MFG-18', name: 'Production Lead Time Variance Forecaster', desc: 'Previsão preditiva de data de entrega de pedidos customizados para clientes.', risk: 'MEDIUM', thresh: 20000, zeroGui: false }
  ];

  coreSupplyAgents.forEach((a, idx) => {
    list.push({
      id: `core_mfg_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'core_supply_manufacturing',
      swarmName: 'Supply Chain & Manufacturing BOM Swarm',
      cnaeCategories: ['CNAE 10.00 a 33.00 (Indústria & Manufatura)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 18 + (idx % 10),
        successRate: 99.7,
        deliberationsCount: 1650 + idx * 75
      }
    });
  });

  // 4. B3 & Financial Markets (18 Agentes)
  const b3Agents = [
    { code: 'AGT-B3-01', name: 'DCF Intrinsic Valuation Engine', desc: 'Cálculo de valuation por fluxo de caixa descontado em tempo real.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-B3-02', name: 'Basel III Capital Adequacy Ratio Auditor', desc: 'Monitoramento contínuo de índices de capital e alavancagem bancária.', risk: 'CRITICAL', thresh: 100000, zeroGui: true },
    { code: 'AGT-B3-03', name: 'CVM 175 Fund Regulatory Guard', desc: 'Enquadramento regulatório automático de carteiras de FIFs e FIDCs.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-B3-04', name: 'Real-Time Risk-Profit Warning Agent', desc: 'Alerta instantâneo de perda projetada e desenquadramento de margem operacional.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-B3-05', name: 'Option Volatility Surface & Greeks Analyzer', desc: 'Cálculo de delta, gama e vega de posições estruturadas na B3.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-B3-06', name: 'Credit Default Spread & Rating Forecaster', desc: 'Previsão de rebaixamento de rating e prêmio de risco de debêntures.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-B3-07', name: 'B3 Clearing Collateral & Margin Call Sentinel', desc: 'Projeção de chamadas de margem diárias na clearing B3.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-B3-08', name: 'Insider Trading & Unusual Volume Detector', desc: 'Varredura de padrões anômalos de negociação antes de fatos relevantes.', risk: 'HIGH', thresh: 0, zeroGui: false },
    { code: 'AGT-B3-09', name: 'ESG Taxonomy & Green Bond Metrics Verifier', desc: 'Validação de indicadores de sustentabilidade para emissão de títulos verdes.', risk: 'MEDIUM', thresh: 30000, zeroGui: false },
    { code: 'AGT-B3-10', name: 'Liquidity Stress Testing (VaR / CVaR) Simulator', desc: 'Simulação de estresse de liquidez em cenários de choque de juros/câmbio.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-B3-11', name: 'M&A Synergies & Accretion/Dilution Modeler', desc: 'Modelagem de diluição de EPS e criação de valor em operações de fusão.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-B3-12', name: 'Anbima Code & Investor Suitability Engine', desc: 'Verificação de perfil de investidor e conformidade com diretrizes Anbima.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-B3-13', name: 'High-Frequency Order Book Imbalance Tracker', desc: 'Identificação de pressão compradora/vendedora no livro de ofertas.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-B3-14', name: 'Share Buyback Program Execution Sentinel', desc: 'Execução programada de recompra de ações dentro dos limites legais CVM.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-B3-15', name: 'Dividend Payout & JCP Tax Optimizer', desc: 'Otimização fiscal entre distribuição de Juros Sobre Capital Próprio e dividendos.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-B3-16', name: 'Securitization (CRI/CRA) Cash Flow Reconciler', desc: 'Auditoria do fluxo de recebíveis vinculados a certificados de securitização.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-B3-17', name: 'Peer Group Valuation Multiples Benchmark', desc: 'Comparação de múltiplos EV/EBITDA e P/L com pares globais de mercado.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-B3-18', name: 'Macro Grounding & Central Bank Copom Predictor', desc: 'Análise de atas do Copom e previsão de trajetória da taxa Selic.', risk: 'MEDIUM', thresh: 0, zeroGui: false }
  ];

  b3Agents.forEach((a, idx) => {
    list.push({
      id: `b3_fin_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'b3_financial',
      swarmName: 'B3 & Financial Markets Swarm',
      cnaeCategories: ['CNAE 64.00 a 66.99 (Serviços Financeiros & Mercado de Capitais)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 12 + (idx % 15),
        successRate: 99.9,
        deliberationsCount: 1980 + idx * 95
      }
    });
  });

  // 5. Agribusiness (18 Agentes)
  const agroAgents = [
    { code: 'AGT-AGR-01', name: 'Commodity Hedge & Basis Arbitrageur', desc: 'Execução de hedge de soja/milho na CBOT e trava de base no porto de Santos/Paranaguá.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-AGR-02', name: 'Barter Contract & CPR Green Invariant Guard', desc: 'Estruturação de Cédula de Produto Rural e liquidação física de grãos por insumos.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-AGR-03', name: 'Soil IoT Sensor & Moisture Stress Forecaster', desc: 'Telemetria de sensores de umidade do solo e recomendação de irrigação pivô central.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-AGR-04', name: 'Harvester Machine OEE & Fuel Burn Tracker', desc: 'Monitoramento de eficiência e consumo de diesel de colheitadeiras via telemetria CAN.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-AGR-05', name: 'Grain Elevator & Silo Aeration Automator', desc: 'Controle automatizado de temperatura e aeração de silos para evitar quebra de peso.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-AGR-06', name: 'Pest Infestation & Satellite NDVI Scout', desc: 'Análise de imagens de satélite Sentinel/Planet para detecção precoce de pragas agrícolas.', risk: 'MEDIUM', thresh: 20000, zeroGui: false },
    { code: 'AGT-AGR-07', name: 'Livestock Weight Gain & ColdChain Telemetry', desc: 'Pesagem por visão computacional em confinamento e rastreamento frigorífico.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-AGR-08', name: 'Fertilizer NPK Blend Formulation Optimizer', desc: 'Cálculo da mistura de fertilizantes de menor custo mantendo o laudo agronômico.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-AGR-09', name: 'Rural Environmental Registry (CAR) Compliance', desc: 'Conferência de sobreposição de áreas de preservação permanente (APP) e reserva legal.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-AGR-10', name: 'Grain Freight Rate & Truck Queue Coordinator', desc: 'Negociação de frete rodoviário e agendamento de descarregamento em terminais portuários.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-AGR-11', name: 'Weather Radar Frost & Drought Risk Predictor', desc: 'Previsão de geadas e eventos climáticos extremos com planos de contingência de safra.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-AGR-12', name: 'Seed Germination & Vigour Quality Auditor', desc: 'Auditoria de laudos de pureza e poder germinativo de lotes de sementes.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-AGR-13', name: 'Ethanol & Sugar Parity Ratio Arbitrageur', desc: 'Otimização do mix de moagem de cana entre etanol e açúcar com base nos preços.', risk: 'HIGH', thresh: 40000, zeroGui: true },
    { code: 'AGT-AGR-14', name: 'Agricultural Machinery Maintenance Predictor', desc: 'Previsão de falhas de tratores e pulverizadores antes da janela crítica de plantio.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-AGR-15', name: 'Agrocredit Pronaf / Pronamp Subsidy Navigator', desc: 'Enquadramento de linhas de crédito rural subsidiadas pelo Plano Safra.', risk: 'MEDIUM', thresh: 20000, zeroGui: false },
    { code: 'AGT-AGR-16', name: 'Phytosanitary Pesticide Grace Period Enforcer', desc: 'Garantia de respeito ao período de carência de defensivos antes da colheita.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-AGR-17', name: 'Farm Storage Capacity & Overflow Router', desc: 'Roteamento de transbordo de grãos para armazéns gerais credenciados CONAB.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-AGR-18', name: 'Traceability & Deforestation-Free Certificate', desc: 'Geração de passaporte de rastreabilidade para conformidade com a regulação EUDR.', risk: 'HIGH', thresh: 30000, zeroGui: true }
  ];

  agroAgents.forEach((a, idx) => {
    list.push({
      id: `agro_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'agribusiness',
      swarmName: 'Agribusiness & Rural Intelligence Swarm',
      cnaeCategories: ['CNAE 01.11 a 03.22 (Agropecuária, Grãos, Trading & Frigoríficos)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 22 + (idx % 12),
        successRate: 99.6,
        deliberationsCount: 1510 + idx * 80
      }
    });
  });

  // 6. Retail Omni (18 Agentes)
  const retailAgents = [
    { code: 'AGT-RET-01', name: 'Shelf Out-of-Stock (Ruptura) Detector', desc: 'Identificação precoce de falta de produtos nas prateleiras através de visão computacional.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-02', name: 'Dynamic Price Elasticity Engine', desc: 'Ajuste de preços de venda por elasticidade-demanda, estoque e concorrência web.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-03', name: 'Last-Mile Micro-Hub Dispatch Router', desc: 'Roteirização de entregas same-day e seleção da transportadora de menor custo/prazo.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-RET-04', name: 'Loss Prevention & Self-Checkout Shrinkage Guard', desc: 'Detecção de furtos e fraudes de pesagem em caixas de autoatendimento.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-05', name: 'Markdown & Clearance Markdown Scheduler', desc: 'Planejamento de liquidação gradual de coleções sazonais para maximizar margem.', risk: 'MEDIUM', thresh: 15000, zeroGui: true },
    { code: 'AGT-RET-06', name: 'Omnichannel Store Fulfillment Allocator', desc: 'Direcionamento de pedidos e-commerce para faturamento a partir de lojas físicas (Ship-from-Store).', risk: 'MEDIUM', thresh: 8000, zeroGui: false },
    { code: 'AGT-RET-07', name: 'Customer Lifetime Value (LTV) Segmenter', desc: 'Segmentação comportamental e concessão de vouchers personalizados de retenção.', risk: 'LOW', thresh: 2000, zeroGui: false },
    { code: 'AGT-RET-08', name: 'Reverse Logistics & Product Return Inspector', desc: 'Triagem de devoluções, reinspeção de itens e estorno bancário antifraude.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-RET-09', name: 'Marketplace Buy-Box Winner Algorithm', desc: 'Gestão autônoma de ofertas em marketplaces (Mercado Livre, Amazon, Magalu).', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-10', name: 'Retail Media & Sponsored Ads Bidding Agent', desc: 'Alocação automatizada de verbas de publicidade digital por margem do produto.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-RET-11', name: 'Promo Bundle & Cross-Sell Recommendation', desc: 'Geração de kits promocionais e cross-selling no checkout baseado em cesta de compras.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-RET-12', name: 'Perishable Fresh Food Waste Minimizer', desc: 'Remarcação dinâmica de alimentos frescos próximos ao vencimento.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-13', name: 'Payment Gateway Routing & Chargeback Blocker', desc: 'Roteamento inteligente de adquirentes e bloqueio de chargebacks suspeitos.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-14', name: 'Store Staffing & Foot-Traffic Predictor', desc: 'Dimensionamento de operadores de caixa por fluxo previsto de clientes por hora.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-RET-15', name: 'Supplier Rebate & Trade Marketing Auditor', desc: 'Apuração de verbas contratuais de cooperação e espaço de gôndola com a indústria.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-RET-16', name: 'Cash Register Reconciliation & Sangria Agent', desc: 'Conferência de fechamento de gaveta de PDV e alerta de sangria de valores.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RET-17', name: 'Click-and-Collect Locker Allocator', desc: 'Gestão de armários inteligentes de retirada rápida em pontos físicos.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-RET-18', name: 'Customer Sentiment & Review Deflector', desc: 'Monitoramento de reclamações ReclameAqui/Google e disparo de resoluções pró-ativas.', risk: 'LOW', thresh: 0, zeroGui: false }
  ];

  retailAgents.forEach((a, idx) => {
    list.push({
      id: `ret_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'retail_omni',
      swarmName: 'Retail & Omnichannel Commerce Swarm',
      cnaeCategories: ['CNAE 47.00 a 47.99 (Varejo, Supermercados & E-commerce)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 14 + (idx % 11),
        successRate: 99.8,
        deliberationsCount: 2150 + idx * 120
      }
    });
  });

  // 7. Real Estate & Construction (18 Agentes)
  const realEstateAgents = [
    { code: 'AGT-CON-01', name: 'BIM Model Progress & Measurement Auditor', desc: 'Cruzamento de medições de campo com o modelo 4D/5D BIM e liberação de pagamento a empreiteiros.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-CON-02', name: 'INCC / IGP-M Contract Readjustment Engine', desc: 'Aplicação matemática das regras de reajuste monetário em carteiras de recebíveis imobiliários.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-CON-03', name: 'VGV Default & Distrato Risk Predictor', desc: 'Previsão de rescisão de contratos de promessa de compra e venda de imóveis na planta.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-CON-04', name: 'Construction Budget Variance (SINAPI) Agent', desc: 'Controle de custo de obra contra tabelas SINAPI/TCPO e desvios de alvenaria/concreto.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-CON-05', name: 'Bank Guarantee & Caixa APF Milestone Reconciler', desc: 'Conferência de relatórios de acompanhamento de engenharia para liberação de repasses bancários.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-CON-06', name: 'Jobsite Safety (NR-18) Video AI Compliance', desc: 'Detecção de ausência de EPIs (capacetes, cintos) em canteiros via câmeras inteligentes.', risk: 'HIGH', thresh: 0, zeroGui: false },
    { code: 'AGT-CON-07', name: 'Mortgage Repasse & Transfer Expediter', desc: 'Aceleração do processo de financiamento bancário do comprador final na entrega das chaves.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-CON-08', name: 'Habite-se & Municipal Licensing Tracker', desc: 'Acompanhamento de certidões municipais, Corpo de Bombeiros e averbação de Habite-se.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-CON-09', name: 'Land Acquisition (Permuta) Feasibility Modeler', desc: 'Estudo de viabilidade econômico-financeira de permuta física e financeira de terrenos.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-CON-10', name: 'Subcontractor Labor Tax (INSS CNO) Retainer', desc: 'Retenção obrigatória de 11% de INSS sobre cessão de mão de obra na matrícula CNO.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-CON-11', name: 'Concrete Slump & Laboratory Curing Test Verifier', desc: 'Validação de laudos de ruptura de corpos de prova de concreto aos 7, 14 e 28 dias.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-CON-12', name: 'Material Waste on Jobsite Minimizer', desc: 'Identificação de perdas excessivas de aço, argamassa e cerâmica na execução.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-CON-13', name: 'Condo Association (Síndico) Budget Forecaster', desc: 'Elaboração da previsão orçamentária para a assembleia de instalação do condomínio.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-CON-14', name: 'Technical Warranty & Post-Handover Chamados Router', desc: 'Classificação de chamados de pós-obra e direcionamento a empreiteiros responsáveis.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-CON-15', name: 'Real Estate Broker Commission & Split Calculator', desc: 'Cálculo de split de comissões de corretores e imobiliárias parceiras com emissão de RPA/NF.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-CON-16', name: 'Environmental Impact (EIA/RIMA) Milestone Guard', desc: 'Gestão de condicionantes ambientais e compensações florestais de loteamentos.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-CON-17', name: 'Heritage Property (Patrimônio de Afetação) Auditor', desc: 'Blindagem da conta corrente exclusiva da obra sem desvio para a conta da holding.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-CON-18', name: 'Rental Yield & Commercial Lease Reajuste Agent', desc: 'Controle de contratos de locação de lajes corporativas, shopping centers e vacância.', risk: 'HIGH', thresh: 20000, zeroGui: true }
  ];

  realEstateAgents.forEach((a, idx) => {
    list.push({
      id: `con_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'real_estate',
      swarmName: 'Real Estate & Construction Swarm',
      cnaeCategories: ['CNAE 41.00 a 43.99 / 68.10 a 68.32 (Construção Civil & Imobiliário)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 19 + (idx % 14),
        successRate: 99.7,
        deliberationsCount: 1430 + idx * 70
      }
    });
  });

  // 8. Energy & Utilities (18 Agentes)
  const energyAgents = [
    { code: 'AGT-NRG-01', name: 'CCEE Power Contract Reconciliation Agent', desc: 'Controle de registro de contratos de compra e venda de energia na CCEE no Mercado Livre.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-NRG-02', name: 'Hourly Energy Balance & PLD Arbitrageur', desc: 'Monitoramento do Preço de Liquidação das Diferenças (PLD) horário e exposição no MCP.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-NRG-03', name: 'Contracted Demand & Power Factor FinOps Guard', desc: 'Prevenção de multas por ultrapassagem de demanda e reativo excedente junto à distribuidora.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-NRG-04', name: 'Solar PV Plant Inverter Degradation Forecaster', desc: 'Diagnóstico de perda de eficiência de strings solares e acúmulo de sujeira em módulos.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-NRG-05', name: 'Wind Turbine Yaw & Pitch Optimization Scout', desc: 'Ajuste aerodinâmico de turbinas eólicas baseado na direção de rajadas de vento.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-NRG-06', name: 'Hydroelectric Reservoir Inflow (ENA) Forecaster', desc: 'Previsão de Energia Natural Afluente e geração hidrelétrica via modelos hidrológicos.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-NRG-07', name: 'I-REC International Renewable Certificate Tracker', desc: 'Emissão e custódia de certificados de energia renovável (I-REC) para metas Net Zero.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-NRG-08', name: 'Smart Meter Telemetry & Non-Technical Loss Hunter', desc: 'Identificação de anomalias em medidores inteligentes indicando fraudes e desvios de energia.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-NRG-09', name: 'Transmission Substation Thermal Anomaly Detector', desc: 'Detecção de superaquecimento em barramentos e transformadores de potência.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-NRG-10', name: 'Distributed Generation (GD) Net Metering Auditor', desc: 'Auditoria de créditos de energia injetada no sistema de compensação da Aneel.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-NRG-11', name: 'Battery Storage (BESS) Peak-Shaving Dispatcher', desc: 'Comando de descarga de bancos de baterias durante picos tarifários industriais.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-NRG-12', name: 'Gas Pipeline Pressure & Valve Leakage Sentinel', desc: 'Monitoramento contínuo de pressão e vazão em redes de distribuição de gás natural.', risk: 'CRITICAL', thresh: 100000, zeroGui: true },
    { code: 'AGT-NRG-13', name: 'Water Utility Flow Balance & District Metering Agent', desc: 'Controle de perdas físicas em redes de saneamento através de macromedidores de vazão.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-NRG-14', name: 'Aneel Tariff Review & Regulatory Asset Base Modeler', desc: 'Modelagem do impacto de revisões tarifárias periódicas da Aneel nas receitas da concessionária.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-NRG-15', name: 'Energy Trading Margin Call & Counterparty Risk Scout', desc: 'Avaliação de risco de crédito de comercializadoras de energia em operações bilaterais.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-NRG-16', name: 'Biomass & Biogas Generation Yield Optimizer', desc: 'Otimização da mistura de resíduos orgânicos para maximização de produção de biometano.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-NRG-17', name: 'Grid Frequency (60Hz) & Voltage Fluctuation Guard', desc: 'Monitoramento de qualidade de energia e conformidade com os Procedimentos de Rede ONS.', risk: 'HIGH', thresh: 30000, zeroGui: false },
    { code: 'AGT-NRG-18', name: 'Green Hydrogen Electrolyzer Production Scheduler', desc: 'Agendamento de produção de H2 verde em momentos de energia com custo marginal zero.', risk: 'HIGH', thresh: 50000, zeroGui: true }
  ];

  energyAgents.forEach((a, idx) => {
    list.push({
      id: `nrg_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'energy_utilities',
      swarmName: 'Energy & Utilities Swarm',
      cnaeCategories: ['CNAE 35.11 a 35.30 (Geração, Transmissão, Comercialização de Energia)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 16 + (idx % 12),
        successRate: 99.8,
        deliberationsCount: 1720 + idx * 85
      }
    });
  });

  // 9. Telecom & SaaS (18 Agentes)
  const telecomAgents = [
    { code: 'AGT-TEL-01', name: 'Predictive SaaS Churn & Product Telemetry Agent', desc: 'Identificação de queda de uso de features chave e disparo de intervenção de Customer Success.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-TEL-02', name: 'Cloud Infrastructure (AWS/GCP) FinOps Optimizer', desc: 'Identificação de instâncias ociosas e compra de reservas de computação para corte de custos.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-TEL-03', name: 'Anatel QoS SLA & Network Outage Penalty Guard', desc: 'Monitoramento de metas de qualidade Anatel e mitigação de multas por indisponibilidade.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-TEL-04', name: 'B2B ISP Fiber Optic Attenuation Sentinel', desc: 'Detecção de atenuação e rompimento de cabos ópticos com acionamento de equipes de campo.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-TEL-05', name: 'SaaS License Downgrade & Seat Optimization Scout', desc: 'Alerta de contas com assentos não utilizados para renegociação antes da renovação anual.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-TEL-06', name: 'API Rate Limit & Microservice Latency Guardian', desc: 'Ajuste de throttle e detecção de gargalos em clusters Kubernetes.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-07', name: 'SIM Card Roaming & Cellular Fraud Detective', desc: 'Bloqueio de clonagem de chips e consumo abusivo de dados em roaming internacional.', risk: 'HIGH', thresh: 5000, zeroGui: true },
    { code: 'AGT-TEL-08', name: 'Customer Net Promoter Score (NPS) Sentiment Parser', desc: 'Análise semântica de feedbacks abertos para enriquecer a matriz de melhorias de produto.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-09', name: 'Broadband Bandwidth Throttling & Peering Router', desc: 'Otimização de tráfego de saída através de pontos de troca de internet (IX.br).', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-10', name: 'SaaS Recurring Billing & Failed Stripe Dunning Agent', desc: 'Recuperação automática de pagamentos de cartão de crédito recusados via retentativas inteligentes.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-TEL-11', name: 'Telecom Tower Lease & Shared Infrastructure Auditor', desc: 'Auditoria de contratos de aluguel de espaço em torres e postes de energia.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-TEL-12', name: 'Data Pipeline & BigQuery Storage FinOps Balancer', desc: 'Limpeza de tabelas temporárias de telemetria para redução de storage cloud.', risk: 'LOW', thresh: 2000, zeroGui: false },
    { code: 'AGT-TEL-13', name: 'VoIP SIP Trunking & Call Quality (MOS) Tracker', desc: 'Monitoramento do Mean Opinion Score para prevenção de queda de qualidade de voz.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-14', name: 'SaaS Multi-Tenant Database Query Throttler', desc: 'Isolamento de tenants barulhentos ("noisy neighbors") que consomem CPU excessiva.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-15', name: 'Portability & Competitor Loss Intelligence Agent', desc: 'Análise de pedidos de portabilidade numérica para detecção de ofertas agressivas de rivais.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-TEL-16', name: 'Enterprise Service Level Agreement (SLA) Tracker', desc: 'Cálculo de créditos contratuais devidos por violação de 99.9% de uptime acordado.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-TEL-17', name: 'Zero-Touch Provisioning (ZTP) CPE Configurator', desc: 'Automação de configuração remota de roteadores instalados na casa do cliente.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-TEL-18', name: 'SaaS Feature Flag Rollout & Canary Release Guard', desc: 'Acompanhamento de taxa de erros em deploys parciais de software com rollback automático.', risk: 'HIGH', thresh: 30000, zeroGui: true }
  ];

  telecomAgents.forEach((a, idx) => {
    list.push({
      id: `tel_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'telecom_saas',
      swarmName: 'Telecom & SaaS Cloud Swarm',
      cnaeCategories: ['CNAE 61.10 a 63.99 (Telecomunicações, ISPs e Software SaaS)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 11 + (idx % 8),
        successRate: 99.9,
        deliberationsCount: 2450 + idx * 130
      }
    });
  });

  // 10. Education (18 Agentes)
  const educationAgents = [
    { code: 'AGT-EDU-01', name: 'Student LMS Engagement & Early Dropout Predictor', desc: 'Identificação de risco de evasão universitária por falta de acessos e notas no portal do aluno.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-EDU-02', name: 'FIES & Prouni Government Fund Reconciler', desc: 'Conferência de repasses do Fundo de Financiamento Estudantil junto ao FNDE/MEC.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-EDU-03', name: 'Classroom & Professor Allocation Optimizer', desc: 'Otimização de enturmação para maximização da taxa de ocupação das salas físicas e virtuais.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-EDU-04', name: 'Tuition Fee Default & Scholarship Recalibrator', desc: 'Régua de negociação de mensalidades atrasadas e concessão preventiva de bolsas.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-EDU-05', name: 'Academic Diploma MEC Digital Signature Validator', desc: 'Emissão e validação de diplomas digitais em conformidade com as portarias do MEC.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-EDU-06', name: 'MEC Evaluation (ENADE / CPC) Preparedness Agent', desc: 'Simulação e diagnóstico de indicadores institucionais para recredenciamento de cursos.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-EDU-07', name: 'EaD Video Stream Bandwidth & CDN Cost FinOps', desc: 'Otimização de custos de transmissão de videoaulas em plataformas de ensino a distância.', risk: 'LOW', thresh: 3000, zeroGui: false },
    { code: 'AGT-EDU-08', name: 'Student Academic Transfer & Credit Equivalency Evaluator', desc: 'Análise automática de ementas curriculares para dispensa de disciplinas.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-EDU-09', name: 'Admissions Campaign CAC vs LTV Forecaster', desc: 'Acompanhamento do custo de aquisição de novos alunos por canal de vestibular.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-EDU-10', name: 'Plagiarism & AI-Generated Thesis Sentinel', desc: 'Detecção de cópia indevida e integridade acadêmica em trabalhos de conclusão de curso.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-EDU-11', name: 'Professor Workload & Overtime Labor Guard', desc: 'Controle de horas-aula e conformidade com convenção coletiva dos sindicatos docentes.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-EDU-12', name: 'Student Internship & Mandatory Supervised Hours Tracker', desc: 'Validação de contratos de estágio e cumprimento de carga horária obrigatória.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-EDU-13', name: 'Laboratory Consumable & Reagent Inventory Agent', desc: 'Resuprimento de insumos para laboratórios de saúde, química e engenharias.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-EDU-14', name: 'Institutional Ombudsman (Ouvidoria) Classifier', desc: 'Triagem de reclamações de estudantes com priorização de casos com risco judicial.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-EDU-15', name: 'Corporate University B2B Contract Enforcer', desc: 'Acompanhamento de metas de treinamento e faturamento de programas corporativos.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-EDU-16', name: 'Library Physical & Virtual E-Book License Auditor', desc: 'Auditoria de licenças de bibliotecas virtuais para atender requisitos mínimos do MEC.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-EDU-17', name: 'School Bus Route & Transportation Safety Tracker', desc: 'Roteirização de frotas escolares e acompanhamento de embarque/desembarque de alunos.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-EDU-18', name: 'Alumni Employability & Graduate Career Tracker', desc: 'Mapeamento da colocação profissional de egressos para marketing institucional.', risk: 'LOW', thresh: 0, zeroGui: false }
  ];

  educationAgents.forEach((a, idx) => {
    list.push({
      id: `edu_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'education',
      swarmName: 'Education & EdTech Swarm',
      cnaeCategories: ['CNAE 85.11 a 85.99 (Ensino Superior, Básico, Cursos Livres e EaD)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 15 + (idx % 10),
        successRate: 99.8,
        deliberationsCount: 1380 + idx * 65
      }
    });
  });

  // 11. Public Sector & GovTech (18 Agentes)
  const publicSectorAgents = [
    { code: 'AGT-GOV-01', name: 'Fiscal Responsibility Law (LRF) Compliance Agent', desc: 'Verificação contínua do limite de gastos com pessoal e endividamento municipal/estadual.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-GOV-02', name: 'Public Procurement Tender (Edital) Auditor', desc: 'Varredura de cláusulas restritivas e conformidade com a Nova Lei de Licitações (Lei 14.133).', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-GOV-03', name: 'Municipal Transparency Portal Ledger Anchor', desc: 'Publicação de atos contábeis em livro-razão imutável para acesso de órgãos de controle (TCU/TCE).', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-GOV-04', name: 'Public Works Measurement & Geotagged Photo Verifier', desc: 'Validação de relatórios de medição de obras públicas com fotos georreferenciadas e drone.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-GOV-05', name: 'Healthcare SUS Resource & Medicine Stock Sentinel', desc: 'Prevenção de desabastecimento de medicamentos essenciais na rede pública de saúde.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-GOV-06', name: 'Municipal Tax (IPTU / ISS) Evasion Detective', desc: 'Cruzamento de notas fiscais de serviços e cadastro imobiliário multifinalitário para combate à evasão.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-GOV-07', name: 'Citizen Electronic Service Portal Routing Agent', desc: 'Classificação e despacho de protocolos de cidadãos para as secretarias competentes.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-GOV-08', name: 'Public Concession & PPP Economic Equilibrium Modeler', desc: 'Cálculo de reequilíbrio econômico-financeiro de contratos de concessão de rodovias e transporte.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-GOV-09', name: 'Court-Ordered Debt (Precatórios) Queue Auditor', desc: 'Auditoria cronológica da fila de pagamento de precatórios judiciais em conformidade com o CNJ.', risk: 'CRITICAL', thresh: 50000, zeroGui: true },
    { code: 'AGT-GOV-10', name: 'Environmental License (Licenciamento) Expediter', desc: 'Conferência de condicionantes ambientais para emissão de licenças de instalação e operação.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-GOV-11', name: 'State/Federal Covenant (Convênios) SICONV Reconciler', desc: 'Acompanhamento da prestação de contas de transferências voluntárias da União via Transferegov.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-GOV-12', name: 'Public Employee Pension Fund (RPPS) Actuarial Guard', desc: 'Cálculo atuarial e avaliação de solvência de fundos previdenciários de servidores públicos.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-GOV-13', name: 'Smart City Traffic Light & Incident Response Agent', desc: 'Otimização semafórica em tempo real e abertura de corredores para veículos de emergência.', risk: 'HIGH', thresh: 0, zeroGui: false },
    { code: 'AGT-GOV-14', name: 'Public School Lunch (PNAE) Nutritional & Supply Guard', desc: 'Controle de compra da agricultura familiar (mínimo 30%) e cardápio nutricional escolar.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-GOV-15', name: 'Social Welfare Benefit (Cadastro Único) Auditor', desc: 'Cruzamento de bases de dados para evitar pagamentos indevidos de benefícios sociais.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-GOV-16', name: 'Legislative Bill Tracking & Legal Impact Forecaster', desc: 'Monitoramento da tramitação de projetos de lei e estimativa de impacto orçamentário.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-GOV-17', name: 'Municipal Tree Pruning & Civil Defense Risk Scout', desc: 'Mapeamento de áreas de risco geológico e árvores em risco de queda na rede elétrica.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-GOV-18', name: 'Public Asset (Patrimônio Público) Barcode Inventory Agent', desc: 'Controle patrimonial de bens móveis e imóveis pertencentes ao ente federativo.', risk: 'LOW', thresh: 5000, zeroGui: false }
  ];

  publicSectorAgents.forEach((a, idx) => {
    list.push({
      id: `gov_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'public_sector',
      swarmName: 'Public Sector & GovTech Swarm',
      cnaeCategories: ['CNAE 84.11 a 84.30 (Administração Pública, Autarquias e Concessões)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 17 + (idx % 12),
        successRate: 99.8,
        deliberationsCount: 1610 + idx * 80
      }
    });
  });

  // 12. E-commerce, Marketplace & Varejo Digital (10 Agentes)
  const ecommerceAgents = [
    { code: 'AGT-ECM-01', name: 'Auditor de Comissões de Marketplace', desc: 'Auditoria contínua de taxas e comissões cobradas por Mercado Livre, Amazon, Magalu e Shopee contra tabelas contratuais.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-ECM-02', name: 'Conciliador de Frete e Repasses', desc: 'Reconciliação entre fretes cobrados nas etiquetas de envio (Mercado Envios, FBA, Magalu Entregas) e o repasse financeiro na conta gráfica.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-ECM-03', name: 'Calculador de Lucro Líquido Real por SKU', desc: 'Cálculo de margem líquida unitária por SKU abatendo CMV, impostos (Simples/Lucro Real), taxas de comissão, frete e ad spend de ADS.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-ECM-04', name: 'Monitor de Devoluções não Ressarcidas', desc: 'Rastreamento de mercadorias devolvidas pelo comprador não entregues ao armazém ou sem reembolso efetuado pelo marketplace.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-ECM-05', name: 'Agente de Reposição Preditiva', desc: 'Previsão de estoque para Fulfillment (FBA/Full ML) baseada em sazonalidade, curva ABC e lead time de envio ao centro de distribuição.', risk: 'MEDIUM', thresh: 20000, zeroGui: true },
    { code: 'AGT-ECM-06', name: 'Auditor de Anúncios Desindexados', desc: 'Varredura de anúncios pausados indevidamente, penalizações de reputação de seller e erros de sincronização de catálogo.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-ECM-07', name: 'Simulador de Buy Box', desc: 'Simulação de precificação e frete para retenção da Buy Box garantindo margem mínima de contribuição sem guerra predatória de preços.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-ECM-08', name: 'Gestor de Estoque Parado', desc: 'Identificação de produtos sem giro em centros de distribuição Fulfillment para evitar cobrança de taxas de armazenagem prolongada.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-ECM-09', name: 'Rastreador de Retenção de Garantia', desc: 'Monitoramento de valores retidos por disputa de clientes ou períodos de garantia obrigatórios nos gateways e adquirentes.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-ECM-10', name: 'Auditor de Tarifas de ERPs', desc: 'Conferência de cobranças por pedidos integrados, emissão de NF-e e limites de requisições de API de hubs de integração (Bling, Tiny, etc).', risk: 'LOW', thresh: 2000, zeroGui: false }
  ];

  ecommerceAgents.forEach((a, idx) => {
    list.push({
      id: `ecm_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'ecommerce_marketplace',
      swarmName: 'E-commerce, Marketplace & Varejo Digital Swarm',
      cnaeCategories: ['CNAE 47.91-2 / 73.19-0 (Marketplaces & E-commerce)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 13 + (idx % 8),
        successRate: 99.9,
        deliberationsCount: 1890 + idx * 95
      }
    });
  });

  // 13. Reestruturação & Recuperação Judicial (10 Agentes)
  const recuperacaoJudicialAgents = [
    { code: 'AGT-RJ-01', name: 'Altman Z-Score Dinâmico', desc: 'Cálculo contínuo do indicador de risco de insolvência Altman Z-Score e probabilidade de default em janelas de 90 a 360 dias.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-RJ-02', name: 'Bloqueador de Sangria Indevida', desc: 'Trava de segurança que impede pagamentos a partes relacionadas, retiradas societárias ou repasses fora do plano de recuperação.', risk: 'CRITICAL', thresh: 5000, zeroGui: true },
    { code: 'AGT-RJ-03', name: 'Simulador de Deságio', desc: 'Modelagem matemática de propostas de pagamento aos credores com deságios, carências, taxas de desconto e prazos escalonados.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-RJ-04', name: 'Auditor de Garantias Reais', desc: 'Rastreamento e auditoria de alienações fiduciárias, penhores e cessões fiduciárias de recebíveis vinculados a credores com garantia real.', risk: 'CRITICAL', thresh: 30000, zeroGui: true },
    { code: 'AGT-RJ-05', name: 'Auditor de Impostos Suspensos', desc: 'Conferência de débitos fiscais suspensos por parcelamentos especiais de RJ (Transação Tributária PGFN/RFB).', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-RJ-06', name: 'Validador de DIP Financing', desc: 'Análise de contratos de financiamento a devedor em recuperação judicial (Debtor-in-Possession) e alçadas de prioridade de pagamento.', risk: 'CRITICAL', thresh: 100000, zeroGui: true },
    { code: 'AGT-RJ-07', name: 'Monitor de Preferência Trabalhista', desc: 'Controle dos limites legais de pagamento a créditos trabalhistas da Classe I (até 150 salários mínimos e prazos de 1 ano).', risk: 'CRITICAL', thresh: 15000, zeroGui: true },
    { code: 'AGT-RJ-08', name: 'Gestor de Relatórios ao Administrador Judicial', desc: 'Geração autônoma do Relatório Mensal de Atividades (RMA) contendo DRE gerencial, fluxo de caixa realizado e evolução do passivo.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-RJ-09', name: 'Rastreador de Passivos Ocultos', desc: 'Identificação de contingências contratuais, autos de infração e reclamações não lançadas na relação nominal inicial de credores.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-RJ-10', name: 'Projetor de Caixa de Emergência', desc: 'Projeção diária do fluxo de caixa de 13 semanas (13-Week Cash Flow) para garantia de solvência operacional básica da empresa.', risk: 'CRITICAL', thresh: 10000, zeroGui: true }
  ];

  recuperacaoJudicialAgents.forEach((a, idx) => {
    list.push({
      id: `rj_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'recuperacao_judicial',
      swarmName: 'Reestruturação & Recuperação Judicial Swarm',
      cnaeCategories: ['Transversal (Reestruturação & Lei 11.101/05)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 15 + (idx % 10),
        successRate: 99.9,
        deliberationsCount: 1740 + idx * 80
      }
    });
  });

  // 14. Saúde, Hospitais & Bioquímica (10 Agentes)
  const saudeHospitaisAgents = [
    { code: 'AGT-MED-01', name: 'Auditor de Glosas Médicas', desc: 'Auditoria preventiva de contas hospitalares no padrão TISS/TUSS para identificação de divergências e contestação de glosas de convênios.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-MED-02', name: 'Monitor de Validade de Medicamentos', desc: 'Rastreamento de lotes farmacêuticos na farmácia central e satélites com alocação prioritária dos lotes com vencimento próximo (FEFO).', risk: 'CRITICAL', thresh: 5000, zeroGui: true },
    { code: 'AGT-MED-03', name: 'Rastreador Cold Chain', desc: 'Telemetria em tempo real de sensores IoT de temperatura em câmaras frias de vacinas, hemoderivados e reagentes biológicos.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-MED-04', name: 'Conciliador de Honorários Médicos', desc: 'Cálculo e repasse de honorários de corpo clínico com base na tabela CBHPM, procedimentos cirúrgicos e plantões validados.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-MED-05', name: 'Gestor de Ocupação de Leitos/UTI', desc: 'Otimização do tempo de giro de leitos, regulação de vagas de UTI e previsão de altas hospitalares para redução de espera no PS.', risk: 'HIGH', thresh: 0, zeroGui: false },
    { code: 'AGT-MED-06', name: 'Auditor de OPME', desc: 'Validação de orçamentos, rastreabilidade de próteses/órteses com Anvisa e conferência de notas fiscais de fornecedores de OPME.', risk: 'CRITICAL', thresh: 15000, zeroGui: true },
    { code: 'AGT-MED-07', name: 'Gestor de Rastreabilidade LIMS', desc: 'Rastreamento de amostras biológicas do recebimento à emissão do laudo laboratorial garantindo compliance com normas RDC 786 Anvisa.', risk: 'HIGH', thresh: 0, zeroGui: false },
    { code: 'AGT-MED-08', name: 'Monitor de Ocupação de Equipamentos', desc: 'Monitoramento do índice de utilização de ressonâncias, tomógrafos e aceleradores lineares com agendamento otimizado de slots.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-MED-09', name: 'Preventor de Multas PGRSS', desc: 'Controle do Plano de Gerenciamento de Resíduos de Serviços de Saúde e manifesto de descarte de resíduos infectantes e perfurocortantes.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-MED-10', name: 'Auditor de Pacotes Cirúrgicos', desc: 'Conferência entre itens utilizados no centro cirúrgico e a precificação de pacotes acordados com as operadoras de saúde.', risk: 'MEDIUM', thresh: 10000, zeroGui: false }
  ];

  saudeHospitaisAgents.forEach((a, idx) => {
    list.push({
      id: `med_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'saude_hospitais',
      swarmName: 'Saúde, Hospitais & Bioquímica Swarm',
      cnaeCategories: ['CNAE 86.10-1 a 86.90-9 / 72.10-0 (Hospitais, Clínicas, Laboratórios & Farmacêutica)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 14 + (idx % 9),
        successRate: 99.8,
        deliberationsCount: 1620 + idx * 70
      }
    });
  });

  // 15. Indústria, Manufatura & Agronegócio Especialista (10 Agentes)
  const industriaEspecialistaAgents = [
    { code: 'AGT-IND-01', name: 'Calculador de OEE', desc: 'Cálculo em tempo real da Eficiência Global dos Equipamentos (Disponibilidade x Performance x Qualidade) por turno e célula fabril.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-IND-02', name: 'Monitor Preditivo de Manutenção', desc: 'Análise espectral de vibração, temperatura e corrente de motores elétricos para antecipação de falhas catastróficas em redutores e bombas.', risk: 'HIGH', thresh: 30000, zeroGui: true },
    { code: 'AGT-IND-03', name: 'Calculador de Refugo', desc: 'Controle e valorização de perdas de matéria-prima por lote de produção com cálculo do custo de retrabalho e descarte industrial.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-IND-04', name: 'Auditor de Frete Agrícola', desc: 'Conferência do frete de escoamento de safras contra a tabela de frete mínimo ANTT e auditoria de tickets de pesagem em balanças rodoviárias.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-IND-05', name: 'Gestor de Setup de Máquina', desc: 'Otimização sequencial de trocas de moldes e cores em injetoras e teares baseada no método SMED para minimizar tempo improdutivo.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-IND-06', name: 'Rastreador de Custo de Energia por Lote', desc: 'Apropriação do custo horário de energia elétrica consumida no forno/caldeira diretamente na ordem de produção do lote fabricado.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-IND-07', name: 'Auditor de Insumos Controlados', desc: 'Controle do balanço de produtos químicos controlados pelo Exército e Polícia Federal com emissão do mapa mensal de consumo.', risk: 'CRITICAL', thresh: 50000, zeroGui: true },
    { code: 'AGT-IND-08', name: 'Monitor de Grãos em Silos', desc: 'Monitoramento contínuo de termometria e aeração de grãos em silos para prevenção de micotoxinas, fermentação e perda de massa.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-IND-09', name: 'Calculador de Pegada de Carbono/ESG', desc: 'Quantificação de emissões de GEE Escopo 1, 2 e 3 por tonelada produzida com integração a relatórios GHG Protocol e metas ESG.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-IND-10', name: 'Gestor de Contratos de Terceirizados', desc: 'Auditoria de guias de FGTS, INSS e folhas de pagamento de prestadores de serviços industriais para mitigação de risco solidário.', risk: 'HIGH', thresh: 20000, zeroGui: true }
  ];

  industriaEspecialistaAgents.forEach((a, idx) => {
    list.push({
      id: `ind_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'industria_manufatura_agro',
      swarmName: 'Indústria, Manufatura & Agronegócio Especialista Swarm',
      cnaeCategories: ['CNAE 10.00 a 33.00 / 01.11 a 03.22 (Indústria, Manufatura & Agro)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 16 + (idx % 11),
        successRate: 99.7,
        deliberationsCount: 1530 + idx * 65
      }
    });
  });

  // 16. Transportes, Frota & Logística (10 Agentes)
  const transportesLogisticaAgents = [
    { code: 'AGT-LOG-01', name: 'Auditor de Pedágio e Rota', desc: 'Reconciliação automática de faturas de tags eletrônicas (Sem Parar, Veloe) contra o traçado GPS da viagem e eixos suspensos.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-LOG-02', name: 'Gestor de CPK', desc: 'Controle do Custo por Quilômetro rodado de pneus com controle de recapagens, calibragem, sulcagem e descarte técnico.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-LOG-03', name: 'Auditor de Estadia/Overstay', desc: 'Cobrança automática de horas paradas de carretas nos clientes após as 5 horas regulamentadas pela Lei do Caminhoneiro.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-LOG-04', name: 'Monitor de Manutenção de Frota', desc: 'Programação preditiva de troca de óleo, filtros, freios e suspensão baseada na quilometragem real e telemetria CAN bus.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-LOG-05', name: 'Gestor de Multas com Identificação de Condutor', desc: 'Vinculação automática de autuações de trânsito ao motorista que conduzia o veículo no horário da infração para envio ao Detran.', risk: 'HIGH', thresh: 5000, zeroGui: true },
    { code: 'AGT-LOG-06', name: 'Conciliador de Cargas Fracionadas', desc: 'Auditoria de tabelas de frete peso, cubagem, taxa de redespacho e GRIS em conhecimentos de transporte eletrônico (CT-e).', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-LOG-07', name: 'Calculador de Ociosidade de Frota', desc: 'Mapeamento de carretas sem tração e cavalos mecânicos parados no pátio com cálculo do custo de oportunidade por dia.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-LOG-08', name: 'Auditor de Sinistros/Seguros', desc: 'Acompanhamento de processos de regulação de sinistros (RCTR-C / RC-DC), avarias de carga e liberação de indenização securitária.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-LOG-09', name: 'Gestor de Jornada do Motorista', desc: 'Monitoramento contínuo de horas de direção contínua, paradas obrigatórias de descanso e pernoite em conformidade com a Lei 13.103.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-LOG-10', name: 'Monitor de Desvio de Rota', desc: 'Alerta imediato para o Gerenciador de Risco (GR) em caso de fuga de rota pré-estabelecida ou entrada em áreas com alerta de roubo.', risk: 'CRITICAL', thresh: 10000, zeroGui: true }
  ];

  transportesLogisticaAgents.forEach((a, idx) => {
    list.push({
      id: `log_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'transportes_logistica',
      swarmName: 'Transportes, Frota & Logística Swarm',
      cnaeCategories: ['CNAE 49.11 a 53.20 (Transporte, Frotas & Operadores Logísticos)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 18 + (idx % 12),
        successRate: 99.8,
        deliberationsCount: 1410 + idx * 75
      }
    });
  });

  // 17. Jurídico Corporativo, M&A & Compliance (10 Agentes)
  const juridicoComplianceAgents = [
    { code: 'AGT-JUR-01', name: 'Auditor de Contratos Enterprise', desc: 'Auditoria automatizada de cláusulas de rescisão, multas indenizatórias, SLA e responsabilidade civil em minutas contratuais.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-JUR-02', name: 'Rastreador de Diários Oficiais/Jusbrasil', desc: 'Varredura em tempo real de publicações no DJE, DJe-TRT e Diários Oficiais para captura de citações e prazos processuais fatais.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-JUR-03', name: 'Validador de Due Diligence M&A', desc: 'Auditoria de contingências trabalhistas, tributárias e cíveis em data rooms de empresas alvo em processos de fusão e aquisição.', risk: 'CRITICAL', thresh: 100000, zeroGui: true },
    { code: 'AGT-JUR-04', name: 'Gestor de LGPD', desc: 'Auditoria de bases de dados, consentimentos de titulares e relatórios de impacto à proteção de dados (RIPD/DPIA).', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-JUR-05', name: 'Calculador de Provisão de Perda Judicial', desc: 'Classificação de contingências processuais (provável, possível, remota) e cálculo da provisão contábil segundo o CPC 25.', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-JUR-06', name: 'Auditor de Honorários de Sucumbência', desc: 'Conferência de cálculos de honorários advocatícios e depósitos judiciais devidos na liquidação de sentenças.', risk: 'MEDIUM', thresh: 20000, zeroGui: true },
    { code: 'AGT-JUR-07', name: 'Gestor de Certidões Negativas', desc: 'Emissão e acompanhamento de certidões conjuntas de débitos (CND Federal, Estadual, Municipal, CNDT e FGTS CRF).', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-JUR-08', name: 'Auditor de Acordos Judiciais', desc: 'Controle do cumprimento de parcelas de acordos trabalhistas e cíveis homologados em juízo com alerta de vencimento.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-JUR-09', name: 'Gestor de Marcas e Patentes (INPI)', desc: 'Monitoramento da Revista da Propriedade Industrial (RPI) para oposição a marcas colidentes e controle de decênios do INPI.', risk: 'MEDIUM', thresh: 15000, zeroGui: false },
    { code: 'AGT-JUR-10', name: 'Rastreador de Conflito de Interesses', desc: 'Cruzamento de dados societários de fornecedores com quadro de funcionários e executivos para prevenir fraudes corporativas.', risk: 'HIGH', thresh: 30000, zeroGui: true }
  ];

  juridicoComplianceAgents.forEach((a, idx) => {
    list.push({
      id: `jur_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'juridico_compliance',
      swarmName: 'Jurídico Corporativo, M&A & Compliance Swarm',
      cnaeCategories: ['CNAE 69.11 a 70.20 (Jurídico, M&A, Auditoria e Compliance)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 12 + (idx % 7),
        successRate: 99.9,
        deliberationsCount: 1680 + idx * 85
      }
    });
  });

  // 18. Fiscal, Tributário & Finanças (CFO Office) (10 Agentes)
  const fiscalCfoAgents = [
    { code: 'AGT-TAX-01', name: 'Detector de NCM Divergente', desc: 'Auditoria de códigos NCM na emissão de NF-e para identificação de alíquotas incorretas e risco de autuação no SEFAZ.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-TAX-02', name: 'Recuperador de PIS/COFINS Monofásico', desc: 'Identificação e segregação de receitas com produtos sujeitos à tributação monofásica para exclusão da base de cálculo de tributos.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-TAX-03', name: 'Auditor de ICMS-ST', desc: 'Cálculo automático de Margem de Valor Agregado (MVA), ICMS substituição tributária e ressarcimento de ICMS retido a maior.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-TAX-04', name: 'Detector de Duplicatas Frias', desc: 'Cruzamento de NF-e com o manifesto do destinatário no SEFAZ para bloqueio de boletos emitidos sem lastro comercial de venda.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-TAX-05', name: 'Simulador de Transição Presumido/Real', desc: 'Simulação comparativa de carga tributária entre Lucro Presumido, Lucro Real e Reforma Tributária (IBS/CBS).', risk: 'HIGH', thresh: 50000, zeroGui: true },
    { code: 'AGT-TAX-06', name: 'Auditor de SPED/EFD-Reinf', desc: 'Validação cruzada entre eventos R-4000 (retenções na fonte) e os pagamentos lançados no razão financeiro da contabilidade.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-TAX-07', name: 'Monitor de Retenção na Fonte', desc: 'Apuração automática de retenções federais (IRRF, CSRF - PIS/COFINS/CSLL) e municipais (ISS retido) sobre serviços tomados.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-TAX-08', name: 'Auditor de Tarifas Bancárias', desc: 'Auditoria de extratos bancários contra o acordo de reciprocidade e cobrança indevida de taxas de custódia e emissão de boletos.', risk: 'LOW', thresh: 3000, zeroGui: false },
    { code: 'AGT-TAX-09', name: 'Gestor de FinOps Cloud', desc: 'Alocação de centros de custo para faturas de provedores de nuvem (AWS, GCP, Azure) e identificação de subutilização de recursos.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-TAX-10', name: 'Conciliador de Adquirentes de Cartão', desc: 'Conciliação D+0 das vendas de cartão de crédito e débito com o extrato eletrônico (EDI) das maquininhas e adquirentes.', risk: 'HIGH', thresh: 10000, zeroGui: true }
  ];

  fiscalCfoAgents.forEach((a, idx) => {
    list.push({
      id: `tax_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'fiscal_cfo_office',
      swarmName: 'Fiscal, Tributário & Finanças (CFO Office) Swarm',
      cnaeCategories: ['Transversal (Controladoria, Tributário & CFO Office)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 11 + (idx % 6),
        successRate: 99.9,
        deliberationsCount: 1930 + idx * 90
      }
    });
  });

  // 19. Supermercados, Alimentos & Food Service (10 Agentes)
  const supermercadosFoodAgents = [
    { code: 'AGT-FOD-01', name: 'Monitor de Quebra de Caixa', desc: 'Identificação em tempo real de diferenças e inconsistências entre o saldo físico das gavetas de PDV e os registros do sistema.', risk: 'HIGH', thresh: 5000, zeroGui: true },
    { code: 'AGT-FOD-02', name: 'Calculador de Fator de Correção', desc: 'Cálculo das perdas no pré-preparo de carnes, hortifrúti e pescados (peso bruto vs peso líquido) para precisão da ficha técnica.', risk: 'LOW', thresh: 2000, zeroGui: false },
    { code: 'AGT-FOD-03', name: 'Auditor de Trade Marketing', desc: 'Auditoria de cumprimento de contratos de ponta de gôndola, ilhas promocionais e encartes custeados pelas indústrias de alimentos.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-FOD-04', name: 'Gestor de Validade PVPS/FIFO', desc: 'Garantia da rotação de mercadorias no estoque e gôndolas priorizando produtos pelo Primeiro que Vence, Primeiro que Sai.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-FOD-05', name: 'Auditor de Delivery (iFood/Rappi)', desc: 'Reconciliação financeira de repasses de apps de delivery, comissões cobradas, cancelamentos indevidos e cupons subsidiados.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-FOD-06', name: 'Calculador de Ficha Técnica', desc: 'Atualização contínua do custo de pratos e produtos manipulados com base nas oscilações diárias de preços de compra dos ingredientes.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-FOD-07', name: 'Monitor de Furtos Internos', desc: 'Análise cruzada de cancelamentos de cupons após a saída do cliente, abertura manual de gaveta de caixa e desvios de estoque.', risk: 'CRITICAL', thresh: 10000, zeroGui: true },
    { code: 'AGT-FOD-08', name: 'Gestor de Devolução ao Fornecedor', desc: 'Emissão de notas fiscais de devolução de produtos avariados ou fora da especificação e controle do recebimento de crédito.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-FOD-09', name: 'Calculador de Rentabilidade por m²', desc: 'Análise da margem de contribuição gerada por metro quadrado de piso de loja e por categoria de produto no planograma.', risk: 'LOW', thresh: 0, zeroGui: false },
    { code: 'AGT-FOD-10', name: 'Auditor de Peso de Fracionados', desc: 'Auditoria de calibração de balanças de pesagem de frios, carnes e padaria com tolerância contra erros metrológicos do IPEM/Inmetro.', risk: 'HIGH', thresh: 5000, zeroGui: true }
  ];

  supermercadosFoodAgents.forEach((a, idx) => {
    list.push({
      id: `fod_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'supermercados_food_service',
      swarmName: 'Supermercados, Alimentos & Food Service Swarm',
      cnaeCategories: ['CNAE 47.11 a 47.29 / 56.11 a 56.20 (Supermercados & Food Service)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 14 + (idx % 8),
        successRate: 99.8,
        deliberationsCount: 1540 + idx * 70
      }
    });
  });

  // 20. Imobiliário, Construção Civil & Incorporação (10 Agentes)
  const imobiliarioIncorporacaoAgents = [
    { code: 'AGT-IMO-01', name: 'Auditor de Medição de Obras', desc: 'Validação das medições físicas de empreiteiros no canteiro contra o cronograma físico-financeiro antes da liberação de notas fiscais.', risk: 'CRITICAL', thresh: 20000, zeroGui: true },
    { code: 'AGT-IMO-02', name: 'Calculador de Desvio de Insumos', desc: 'Apuração de desvios entre o consumo real de cimento, aço e tintas e os índices teóricos previstos no orçamento executivo.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-IMO-03', name: 'Gestor de Reajuste INCC/IGP-M', desc: 'Aplicação automatizada de índices de correção monetária (INCC-DI, IPCA, IGP-M) nos boletos de parcelas de imóveis em construção.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-IMO-04', name: 'Monitor de Inadimplência de Condomínios', desc: 'Régua automatizada de cobrança de cotas condominiais atrasadas com cálculo de juros, multa e encaminhamento para protesto.', risk: 'MEDIUM', thresh: 5000, zeroGui: false },
    { code: 'AGT-IMO-05', name: 'Auditor de IPTU/Outorgas', desc: 'Auditoria e controle de prazos de pagamento de IPTU desmembrado e outorga onerosa do direito de construir junto à Prefeitura.', risk: 'HIGH', thresh: 20000, zeroGui: true },
    { code: 'AGT-IMO-06', name: 'Calculador de Viabilidade de Terrenos', desc: 'Simulação de VGV, taxa interna de retorno (TIR) e exposição máxima de caixa em novos projetos de incorporação e loteamentos.', risk: 'HIGH', thresh: 100000, zeroGui: true },
    { code: 'AGT-IMO-07', name: 'Gestor de Assistência Técnica Pós-Entrega', desc: 'Triagem de chamados de pós-obra e verificação de prazos de garantia de componentes segundo a norma de desempenho NBR 15575.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-IMO-08', name: 'Auditor de Comissão de Corretores', desc: 'Cálculo de split e liquidação de comissões imobiliárias na assinatura do contrato de compra e venda de unidades.', risk: 'MEDIUM', thresh: 15000, zeroGui: true },
    { code: 'AGT-IMO-09', name: 'Controlador de Licenciamento Ambiental', desc: 'Acompanhamento do cumprimento de condicionantes de Licença Prévia (LP), Instalação (LI) e Operação (LO) de empreendimentos.', risk: 'CRITICAL', thresh: 50000, zeroGui: true },
    { code: 'AGT-IMO-10', name: 'Monitor de Distratos', desc: 'Cálculo das retenções legais previstas na Lei do Distrato Imobiliário (Lei 13.786) e controle dos prazos de devolução ao adquirente.', risk: 'CRITICAL', thresh: 20000, zeroGui: true }
  ];

  imobiliarioIncorporacaoAgents.forEach((a, idx) => {
    list.push({
      id: `imo_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'imobiliario_incorporacao',
      swarmName: 'Imobiliário, Construção Civil & Incorporação Swarm',
      cnaeCategories: ['CNAE 41.10 a 43.99 / 68.10 a 68.32 (Incorporação, Obras & Gestão Imobiliária)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 16 + (idx % 10),
        successRate: 99.8,
        deliberationsCount: 1480 + idx * 70
      }
    });
  });

  // 21. Educação, Franquias & Serviços B2B (10 Agentes)
  const educacaoFranquiasAgents = [
    { code: 'AGT-B2B-01', name: 'Preventor de Evasão Escolar', desc: 'Previsão algorítmica de risco de cancelamento de matrícula por queda de frequência, notas e atraso de mensalidades de alunos.', risk: 'HIGH', thresh: 10000, zeroGui: true },
    { code: 'AGT-FRQ-02', name: 'Auditor de Royalty de Franquias', desc: 'Cálculo e cobrança de royalties e fundo de propaganda sobre o faturamento bruto das lojas franqueadas integrado ao PDV.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-B2B-03', name: 'Gestor de Overbilling de Horas', desc: 'Auditoria de apontamentos de horas trabalhadas em projetos de consultoria contra o escopo e teto contratado com o cliente.', risk: 'HIGH', thresh: 15000, zeroGui: true },
    { code: 'AGT-B2B-04', name: 'Calculador de CAC x LTV', desc: 'Monitoramento contínuo da relação LTV/CAC e tempo de payback de aquisição de clientes por canal de vendas corporativo.', risk: 'MEDIUM', thresh: 10000, zeroGui: false },
    { code: 'AGT-B2B-05', name: 'Auditor de Comissões Comerciais', desc: 'Apuração de comissões de executivos de vendas baseada no faturamento efetivamente liquidado e margem de contribuição.', risk: 'MEDIUM', thresh: 10000, zeroGui: true },
    { code: 'AGT-B2B-06', name: 'Gestor de Renovação de Assinaturas SaaS', desc: 'Automação de renovações anuais de contratos de software corporativo com reajuste pelo IPCA e negociação proativa.', risk: 'HIGH', thresh: 25000, zeroGui: true },
    { code: 'AGT-B2B-07', name: 'Monitor de SLA de Terceiros', desc: 'Acompanhamento dos prazos de atendimento de fornecedores de TI e infraestrutura com apuração de multas contratuais.', risk: 'LOW', thresh: 5000, zeroGui: false },
    { code: 'AGT-B2B-08', name: 'Gestor de Reembolso Corporativo', desc: 'Auditoria de comprovantes de despesas de viagens (hotéis, refeições, combustíveis) segundo as políticas internas da empresa.', risk: 'LOW', thresh: 3000, zeroGui: false },
    { code: 'AGT-B2B-09', name: 'Calculador de Capacity Planning', desc: 'Dimensionamento da alocação de equipes de projetos e previsão de necessidade de contratação de profissionais especializados.', risk: 'MEDIUM', thresh: 0, zeroGui: false },
    { code: 'AGT-B2B-10', name: 'Auditor de Licenciamento de Software', desc: 'Conferência do número de licenças de software instaladas nos computadores corporativos contra os contratos adquiridos.', risk: 'HIGH', thresh: 20000, zeroGui: true }
  ];

  educacaoFranquiasAgents.forEach((a, idx) => {
    list.push({
      id: `b2b_${idx + 1}`,
      code: a.code,
      name: a.name,
      swarmId: 'educacao_franquias_b2b',
      swarmName: 'Educação, Franquias & Serviços B2B Swarm',
      cnaeCategories: ['CNAE 85.11 a 85.99 / 77.40 / 70.20 (Educação, Franquias & Serviços B2B)'],
      roleDescription: a.desc,
      riskLevel: a.risk as any,
      requiresZeroGuiApproval: a.zeroGui,
      approvalThresholdBrl: a.thresh,
      ragContextIsolation: 'TENANT_STRICT_RAG',
      protocol: a.zeroGui ? 'C_LEVEL_ESCALATION' : 'INTER_AGENT_CONSENSUS',
      status: 'ONLINE',
      telemetry: {
        avgLatencyMs: 12 + (idx % 7),
        successRate: 99.9,
        deliberationsCount: 1610 + idx * 80
      }
    });
  });

  return list;
};

export const ALL_200_AGENTS: AgentDefinition[] = generateAll200Agents();
export const ALL_300_AGENTS: AgentDefinition[] = ALL_200_AGENTS;
export const ALL_AGENTS: AgentDefinition[] = ALL_200_AGENTS;

