/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * Eventos operacionais e simulações de cenários migrados para a camada de persistência.
 */
import { SemanticEvent, EnterpriseKnowledgeGraph, SwarmDeliberation, CriticalDecisionCardAST } from '../types/aos';
import { INITIAL_KNOWLEDGE_GRAPH_50 } from './mockKnowledgeGraph50';

export const INITIAL_KNOWLEDGE_GRAPH: EnterpriseKnowledgeGraph = INITIAL_KNOWLEDGE_GRAPH_50;

export function enrichSwarmWith12Agents(baseSwarm: any, scenarioTitle?: string, sector?: string): SwarmDeliberation {
  return {
    ...baseSwarm,
    finance: {
      agentName: 'CFO Brain (Financial Agent)',
      role: 'finance',
      agentId: 'Financial_Agent',
      reasoning: baseSwarm.finance?.reasoning || 'Avaliação de fluxo de caixa, DRE, EBITDA e liquidez.',
      proposedAction: baseSwarm.finance?.proposedAction || 'Preservar capital de giro e mitigar descasamento PMR x PMP.',
      confidence: baseSwarm.finance?.confidence || 98,
      metrics: baseSwarm.finance?.metrics || { 'Impacto Caixa': '-R$ 45k', 'EBITDA': '+R$ 380k' },
      status: 'completed'
    },
    procurement: {
      agentName: 'Inventory & Procurement Agent',
      role: 'procurement',
      agentId: 'Inventory_Agent',
      reasoning: baseSwarm.procurement?.reasoning || 'Análise de estoque de segurança, lote econômico de compra e ponto de resuprimento.',
      proposedAction: baseSwarm.procurement?.proposedAction || 'Emitir ordem de resuprimento automatizada no ERP.',
      confidence: baseSwarm.procurement?.confidence || 96,
      metrics: baseSwarm.procurement?.metrics || { 'Lead Time': '48h', 'Ruptura': '0.0%' },
      status: 'completed'
    },
    logistics: {
      agentName: 'Supply Chain & Logistics Agent',
      role: 'logistics',
      agentId: 'Supply_Chain_Agent',
      reasoning: baseSwarm.logistics?.reasoning || 'Mapeamento de rotas e modais de transporte com menor custo e SLA garantido.',
      proposedAction: baseSwarm.logistics?.proposedAction || 'Despachar carga via rota prioritária homologada.',
      confidence: baseSwarm.logistics?.confidence || 95,
      metrics: baseSwarm.logistics?.metrics || { 'Transit Time': '18h', 'SLA': '99.2%' },
      status: 'completed'
    },
    risk: {
      agentName: 'Zero-Trust Risk Agent',
      role: 'risk',
      agentId: 'Zero_Trust_Risk_Agent',
      reasoning: baseSwarm.risk?.reasoning || 'Auditoria antifraude de 100% dos eventos corporativos e validação de invariantes.',
      proposedAction: baseSwarm.risk?.proposedAction || 'Verificar chaves bancárias e exigir assinatura biométrica.',
      confidence: baseSwarm.risk?.confidence || 100,
      metrics: baseSwarm.risk?.metrics || { 'Invariantes': '4/4 OK', 'Risco': 'Baixo' },
      status: 'completed'
    },
    sales: {
      agentName: 'Sales & Revenue Agent',
      role: 'sales',
      agentId: 'Sales_Agent',
      reasoning: baseSwarm.sales?.reasoning || 'Monitoramento de SLAs contratuais, retenção de contas e proteção de receita.',
      proposedAction: baseSwarm.sales?.proposedAction || 'Preservar contratos vigentes e emitir comunicados preventivos.',
      confidence: baseSwarm.sales?.confidence || 97,
      metrics: baseSwarm.sales?.metrics || { 'SLA Retenção': '100%', 'Churn': '0.0%' },
      status: 'completed'
    },
    production_bom: baseSwarm.production_bom || {
      agentName: 'Production & BOM Agent',
      role: 'production_bom',
      agentId: 'Production_BOM_Agent',
      reasoning: 'Reconciliação da lista técnica de materiais (BOM) e sequenciamento de ordens de produção (OP) no MRP II sem gargalos.',
      proposedAction: 'Sincronizar ordens de produção na planta fabril e balancear capacidade das linhas.',
      confidence: 98,
      metrics: { 'BOM Acurácia': '99.8%', 'Rendimento Linha': '98.5%', 'Lead Time Fabril': '-4h' },
      status: 'completed'
    },
    audit_ledger: baseSwarm.audit_ledger || {
      agentName: 'Audit Ledger Agent',
      role: 'audit_ledger',
      agentId: 'Audit_Ledger_Agent',
      reasoning: 'Geração de prova criptográfica secp256k1 e assinatura SHA-256 no Livro-Razão Imutável do AOS.',
      proposedAction: 'Gravar hash da deliberação na trilha de auditoria Zero-Trust distribuída.',
      confidence: 100,
      metrics: { 'Hash Ledger': '0x8f2c...41e9', 'Status Prova': 'Verificada', 'Imutabilidade': '100%' },
      status: 'completed'
    },
    legal_contract: baseSwarm.legal_contract || {
      agentName: 'Legal Contract Agent',
      role: 'legal',
      agentId: 'Legal_Contract_Agent',
      reasoning: 'Auditoria de minutas contratuais, cláusulas de SLA, penalidades rescisórias e conformidade LGPD.',
      proposedAction: 'Validar aditivo contratual e manter certidões de regularidade vigentes.',
      confidence: 99,
      metrics: { 'Cláusula Penal': 'Blindada', 'Risco Jurídico': '0.0%', 'LGPD': 'Conforme' },
      status: 'completed'
    },
    tax_optimizer: baseSwarm.tax_optimizer || {
      agentName: 'Tax Optimizer Agent',
      role: 'tax_optimizer',
      agentId: 'Tax_Optimizer_Agent',
      reasoning: 'Planejamento e compensação de créditos tributários (ICMS/PIS/COFINS e Reforma Tributária).',
      proposedAction: 'Aplicar crédito fiscal interestadual e registrar aproveitamento no SPED Fiscal.',
      confidence: 97,
      metrics: { 'Crédito Fiscal': '+R$ 18.400', 'Economia': '4.8%', 'SPED': 'Validado' },
      status: 'completed'
    },
    facility_maintenance: baseSwarm.facility_maintenance || {
      agentName: 'Facility & Maintenance Agent',
      role: 'facility',
      agentId: 'Facility_Maintenance_Agent',
      reasoning: 'Telemetria preditiva do parque fabril e monitoramento de MTBF/MTTR das máquinas críticas.',
      proposedAction: 'Agendar parada preventiva no intervalo entre trocas de turnos operacionais.',
      confidence: 95,
      metrics: { 'OEE Linha': '89.4%', 'MTBF': '720h', 'Risco Parada': '1.2%' },
      status: 'completed'
    },
    people_analytics: baseSwarm.people_analytics || {
      agentName: 'People Analytics Agent',
      role: 'people_analytics',
      agentId: 'People_Analytics_Agent',
      reasoning: 'Dimensionamento da força de trabalho, produtividade de turno e controle de jornada CLT/NR-12.',
      proposedAction: 'Rebalancear escalas operacionais para absorver a demanda sem custo de hora extra.',
      confidence: 96,
      metrics: { 'Produtividade': '+8.2%', 'Horas Extras Evitadas': '42h', 'Absenteísmo': '0.4%' },
      status: 'completed'
    },
    dynamic_pricing: baseSwarm.dynamic_pricing || {
      agentName: 'Dynamic Pricing Agent',
      role: 'dynamic_pricing',
      agentId: 'Dynamic_Pricing_Agent',
      reasoning: 'Cálculo de elasticidade de preço, custos unitários e garantia de margem de contribuição mínima.',
      proposedAction: 'Reajustar tabela de preços com base na curva de elasticidade da demanda.',
      confidence: 96,
      metrics: { 'Margem Contribuição': '32.1%', 'Elasticidade': '-0.85', 'Mark-up': '2.14x' },
      status: 'completed'
    },
    data_analyst_predictive: baseSwarm.data_analyst_predictive || {
      agentName: 'Data Analyst & Predictive AI Agent',
      role: 'data_science',
      agentId: 'Data_Analyst_Predictive_Agent',
      reasoning: 'Cruzamento preditivo em tempo real de dados ERP não estruturados e relacionais. Detecção precoce de anomalias com regressão polinomial e Monte Carlo.',
      proposedAction: 'Executar pipeline Python de data prep, isolar padrões de perda e projetar curvas de KPI futuro com 99.4% de significância estatística.',
      confidence: 99,
      metrics: { 'Acurácia Preditiva': '99.4%', 'Anomalias Isoladas': '3 Padrões', 'R² Score': '0.982', 'Forecasting D+30': 'Reconciliado' },
      status: 'completed'
    },
    red_team_adversarial: baseSwarm.red_team_adversarial || {
      agentName: 'Red Team Adversarial Agent',
      role: 'red_team',
      agentId: 'Red_Team_Adversarial_Agent',
      reasoning: 'Desafio sistemático e simulação de cenários hostis/exploração de vulnerabilidades lógicas para contestar as decisões antes da aprovação.',
      proposedAction: 'Validar vetores de ataque em regras de alçada, estresse de caixa e possíveis brechas de conciliação.',
      confidence: 98,
      metrics: { 'Vulnerabilidades Testadas': '14 Vetores', 'Resiliência Decisória': '99.1%', 'Risco de Bypass': '0.0%' },
      status: 'completed'
    },
    observability_trace_guardrail: baseSwarm.observability_trace_guardrail || {
      agentName: 'Observability & Trace Guardrail',
      role: 'observability',
      agentId: 'Observability_Trace_Guardrail',
      reasoning: 'Rastreabilidade OpenTelemetry distribuída (spans e logs de deliberação) e aplicação de guardrails semânticos Zero-Trust em tempo real.',
      proposedAction: 'Assegurar conformidade estrita com políticas de alçada, integridade de tokens e carimbo de tempo imutável.',
      confidence: 100,
      metrics: { 'Span Latência': '18ms', 'Guardrails Ativos': '28 Regras', 'Trace Hash': '0x7b...99c4' },
      status: 'completed'
    },
    behavioral_negotiation: baseSwarm.behavioral_negotiation || {
      agentName: 'Behavioral Negotiation Agent',
      role: 'behavioral',
      agentId: 'Behavioral_Negotiation_Agent',
      reasoning: 'Análise psicológica e modelagem comportamental de fornecedores e clientes para otimização de termos, prazos e concessões mútuas.',
      proposedAction: 'Sugerir táticas de ancoragem de preço e flexibilização de prazos de faturamento com menor atrito relacional.',
      confidence: 96,
      metrics: { 'Índice de Aderência': '94.5%', 'Ganho Médio': '+5.2%', 'Satisfação Cliente': '98.0%' },
      status: 'completed'
    },
    macro_web_grounding: baseSwarm.macro_web_grounding || {
      agentName: 'Macro Web Grounding Agent',
      role: 'macro_web',
      agentId: 'Macro_Web_Grounding_Agent',
      reasoning: 'Monitoramento contínuo de variáveis macroeconômicas externas: cotações de commodities, taxas Selic/DI, boletim Focus e índices de frete internacional.',
      proposedAction: 'Ajustar premissas orçamentárias com base em dados de mercado em tempo real e cotações de fechamento.',
      confidence: 97,
      metrics: { 'Índices Monitorados': '42 Fontes', 'Latência Mercado': '0.8s', 'Confiabilidade Dados': '99.9%' },
      status: 'completed'
    },
    episodic_memory_historical: baseSwarm.episodic_memory_historical || {
      agentName: 'Episodic Memory Historical Agent',
      role: 'episodic_memory',
      agentId: 'Episodic_Memory_Historical_Agent',
      reasoning: 'Recuperação semântica e contextual da memória histórica de longo prazo de decisões anteriores do Tenant em situações análogas.',
      proposedAction: 'Injetar lições aprendidas e precedentes de sucesso em negociações anteriores no contexto da deliberação atual.',
      confidence: 99,
      metrics: { 'Precedentes Similares': '12 Casos', 'Score Similaridade': '0.94', 'Taxa de Sucesso Histórica': '97.2%' },
      status: 'completed'
    },
    supervisor_swarm_orchestrator: baseSwarm.supervisor_swarm_orchestrator || {
      agentName: 'Supervisor Swarm Orchestrator',
      role: 'supervisor',
      agentId: 'Supervisor_Swarm_Orchestrator',
      reasoning: 'Coordenação metacognitiva de alta hierarquia, arbitragem de conflitos entre agentes e garantia de convergência assíncrona do enxame.',
      proposedAction: 'Arbitrar e sintetizar o plano de ação unificado mantendo as restrições e invariantes operacionais invioláveis.',
      confidence: 100,
      metrics: { 'Convergência Swarm': '100%', 'Conflitos Arbitrados': '0 Pendentes', 'Tempo Síntese': '32ms' },
      status: 'completed'
    },
    what_if_scenario_simulator: baseSwarm.what_if_scenario_simulator || {
      agentName: 'What-If Scenario Simulator',
      role: 'what_if_simulator',
      agentId: 'What_If_Scenario_Simulator',
      reasoning: 'Simulação contrafactual e projeção de ramificações futuras (cenários otimista, neutro e de estresse severo) para a ação proposta.',
      proposedAction: 'Executar árvores de decisão determinísticas e avaliar o impacto financeiro/operacional em horizonte de 90 dias.',
      confidence: 98,
      metrics: { 'Cenários Simulados': '500 Runs', 'VaR 95%': '-R$ 12k', 'Payback Projetado': '14 dias' },
      status: 'completed'
    },
    orchestrator_config: {
      active_swarm_agents: [
        "Financial_Agent",
        "Inventory_Agent",
        "Supply_Chain_Agent",
        "Zero_Trust_Risk_Agent",
        "Sales_Agent",
        "Production_BOM_Agent",
        "Audit_Ledger_Agent",
        "Legal_Contract_Agent",
        "Tax_Optimizer_Agent",
        "Facility_Maintenance_Agent",
        "People_Analytics_Agent",
        "Dynamic_Pricing_Agent",
        "Data_Analyst_Predictive_Agent",
        "Red_Team_Adversarial_Agent",
        "Observability_Trace_Guardrail",
        "Behavioral_Negotiation_Agent",
        "Macro_Web_Grounding_Agent",
        "Episodic_Memory_Historical_Agent",
        "Supervisor_Swarm_Orchestrator",
        "What_If_Scenario_Simulator"
      ],
      execution_mode: "PARALLEL_ASYNC",
      max_parallel_workers: 20
    }
  };
}

export interface ScenarioDefinition {
  id: string;
  badge: string;
  title: string;
  shortSummary: string;
  event: SemanticEvent;
  swarm: SwarmDeliberation;
  ast: CriticalDecisionCardAST;
}

const RAW_PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'supplier_crisis',
    badge: 'Crise Fornecedor',
    title: 'Interrupção Abrupta de Fornecedor Tier-1 de Microcontroladores',
    shortSummary: 'Falha técnica no fornecedor âncora paralisa 65% do suprimento de chips para montagem.',
    event: {
      id: 'evt_sup_8819',
      timestamp: '2026-08-15T09:42:18Z',
      source: 'Supplier EDI',
      title: 'Notificação Força Maior: Linha de Chips Paralizada por 14 dias',
      description: 'Fornecedor Nexus Semiconductor declarou interrupção imprevista em Manaus. 8.200 microcontroladores críticos para a linha de produtos Série-X não serão despachados na janela programada.',
      category: 'supply_chain',
      severity: 'Critical',
      metricsAffected: [
        { name: 'Estoque de Segurança', current: '18 dias', projected: '4 dias', delta: '-14d', negativeImpact: true },
        { name: 'Risco de Parada Fábrica', current: '0.2%', projected: '84.0%', delta: '+83.8%', negativeImpact: true },
        { name: 'Exposição SLA Clientes', current: 'R$ 0', projected: 'R$ 1.450.000', delta: '+R$ 1.45M', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'Mapeamos 3 fornecedores homologados alternativos no Barramento Semântico. A fornecedora TechCore SP possui lote spot de 9.000 chips a pronta entrega com ágio de 6,8% (R$ 84.000 extra) e prazo D+2.',
        proposedAction: 'Emitir PO spot imediata de 9.000 chips com TechCore SP sob contrato guarda-chuva pré-validado.',
        confidence: 97,
        metrics: { 'Novo Lead Time': '48 horas', 'Ágio Unitário': '+6.8%', 'Cobertura': '100%' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'O caixa livre atual de R$ 8.42M suporta a alocação spot de R$ 380k à vista com desconto financeiro de 2,1%, preservando o Saldo_Caixa_Minimo (R$ 2.0M) e evitando R$ 1.45M em multas contratuais de SLA.',
        proposedAction: 'Autorizar desembolso de R$ 372k via DVP (Delivery versus Payment) com liquidação em D+1.',
        confidence: 99,
        metrics: { 'Caixa Pós-Ação': 'R$ 8.04M', 'EBITDA Salvo': '+R$ 1.366.000', 'ROI Tático': '367%' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'Para garantir recebimento até quarta-feira 08h, a rota dedicada terrestre da TechCore Campinas para Hub SBC deve ser despachada com escolta expressa dedicada (tempo de trânsito: 4h30).',
        proposedAction: 'Acionar frota dedicada Priority-1 na transportadora LogMaster.',
        confidence: 94,
        metrics: { 'Tempo Trânsito': '4h30', 'Risco Atraso': '0.8%', 'Janela Fábrica': 'Garantida' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'Contratos com Ambev e Embraer dependem deste lote para entrega no dia 22. Zero atraso percebido pelo cliente final se o plano for aprovado em até 45 minutos.',
        proposedAction: 'Manter cronograma de faturamento B2B intacto sem necessidade de renegociação de prazo.',
        confidence: 98,
        metrics: { 'Preservação SLA': '100%', 'Penalidade Evitada': 'R$ 1.450.000', 'NPS Impact': '0.0' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Contratos',
        role: 'revenue_ops',
        reasoning: 'Blindagem de ARR de R$ 34.2M nas contas âncoras. Prevenção de cláusula de rescisão imotivada por ruptura de suprimento.',
        proposedAction: 'Formalizar registro de cumprimento de SLA e manter previsão de faturamento inalterada no CRM.',
        confidence: 99,
        metrics: { 'ARR Blindado': 'R$ 34.2M', 'Net Retention': '108%', 'Risco Cancelamento': '0.0%' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'Invariantes de governança verificadas: Saldo_Caixa > R$ 2.0M (OK), Fornecedor homologado em compliance ISO (OK), Risco operacional < 3% (OK). Ação classificada como Crítica por volume financeiro spot.',
        proposedAction: 'Exigir assinatura Multi-Sig do C-Level via Zero-GUI para execução definitiva em blockchain auditada.',
        confidence: 100,
        metrics: { 'Invariantes OK': '5 de 5', 'Nível Risco': 'Controlado', 'Zero-Trust Gate': 'Exige Multi-Sig' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Acionar compra spot de 9.000 microcontroladores com TechCore SP (D+2) e frete expresso prioritário, liquidando R$ 372k à vista para neutralizar risco de parada de fábrica e evitar R$ 1.45M em multas.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva pelo CEO e CFO.',
          'Emissão automática de Purchase Order PO-9921 via Barramento Semântico.',
          'Liberação de chave PIX empresarial DVP para a TechCore SP.',
          'Despacho da escolta LogMaster Campinas -> SBC às 14:00.'
        ],
        strategicTradeoffs: [
          'Custo adicional de ágio spot de R$ 84k compensado pela preservação de R$ 1.45M de faturamento e integridade de SLA com contas Tier-A.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: 'Fornecedor Tier-1 de chips interrompeu entregas por 14 dias. O AOS orquestrou o suprimento spot de 9.000 unidades com a TechCore SP (D+2) e frete expresso, evitando a paralisação da fábrica e R$ 1.45M em penalidades de SLA.',
      kpis: [
        { label: 'EBITDA Preservado', value: '+R$ 1.366.000', impact: 'positive' },
        { label: 'SLA Entrega Tier-A', value: '100% Intacto', impact: 'positive' },
        { label: 'Custo Extra Spot & Frete', value: '-R$ 84.000', impact: 'negative' },
        { label: 'Saldo Caixa Pós-Transação', value: 'R$ 8.048.000', impact: 'positive' }
      ],
      invariants_checked: [
        'Saldo_Caixa > R$ 2.000.000 (Atual: R$ 8.04M) = OK',
        'SLA_Compliance_TierA >= 98% (Projetado: 100%) = OK',
        'Estoque_Seguranca_Chips >= 15d (Recomposto: 22d) = OK',
        'Compliance_Fornecedor_Homologado = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig Executiva (CEO + CFO)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      execution_payload: {
        target_service: 'SAP_S4HANA_Procurement (API v2 + PIX_Enterprise_DVP)',
        action: 'IssueEmergencyPurchaseOrder',
        parameters: {
          vendor_code: 'VEND_TECHCORE_SP_9001',
          item_sku: 'MCU_SERIES_X_CHIP_9000',
          quantity_units: 9000,
          unit_price_brl: 41.33,
          total_gross_brl: 372000.00,
          payment_rail: 'PIX_DVP_DELIVERY_VS_PAYMENT',
          delivery_window: '2026-08-17T08:00:00Z',
          warehouse_destination: 'HUB_SBC_DOCA_01'
        },
        signature: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_suppliers', 'node_inventory', 'node_production', 'node_cash'],
        riskScore: 84,
        financialExposure: 'R$ 1.450.000'
      },
      security_guard: {
        status: 'VERIFIED',
        risk_score: 4,
        source_authenticity: 'EDI Homologado Nexus Semiconductor (Chave PGP 0x88219)',
        requires_biometric_override: false
      },
      sector_context: {
        sector: 'manufacturing',
        sectorLabel: 'Indústria & Manufatura',
        regulatoryStandard: 'ISO 9001 / IATF 16949'
      },
      audit_hash: '0x9a8f7c6e2b1d4a03c8e5f7a29b41dc089e273f6a'
    }
  },
  {
    id: 'b2b_demand_surge',
    badge: 'Pico Demanda B2B',
    title: 'Surge Imprevisto de Pedido B2B de R$ 4.2M com Prazo Reduzido',
    shortSummary: 'Cliente âncora solicita antecipação de 12.000 unidades com bônus de margem de +18%.',
    event: {
      id: 'evt_crm_4021',
      timestamp: '2026-08-15T08:15:00Z',
      source: 'B2B CRM Pipeline',
      title: 'Proposta B2B Relâmpago: 12.000 un com Entrega em 7 Dias (+18% Preço)',
      description: 'A rede Varejo Global abriu ordem de compra urgente com bônus de margem de +18% (receita bruta R$ 4.2M), com exigência de entrega integral em 7 dias úteis.',
      category: 'customers',
      severity: 'High',
      metricsAffected: [
        { name: 'OEE Linha de Produção', current: '91.8%', projected: '99.4%', delta: '+7.6%', negativeImpact: false },
        { name: 'Receita Bruta Adicional', current: 'R$ 0', projected: 'R$ 4.200.000', delta: '+R$ 4.2M', negativeImpact: false },
        { name: 'Estoque SKUs Livres', current: '6.400 un', projected: '-5.600 un', delta: 'Déficit 5.6k', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'Demanda requer 6.000 kits de insumos imediatos. Fornecedores A e B possuem estoque em consignação pronto para liberação automática via smart contract.',
        proposedAction: 'Ativar consignação de insumos sem desembolso adiantado.',
        confidence: 96,
        metrics: { 'Insumos Liberados': '6.000 kits', 'Custo Financeiro': '0.0%', 'Tempo': 'Imediato' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'Margem de contribuição líquida da transação é de R$ 1.18M (28.1%). O cliente concordou com adiantamento de 30% no ato do aceite (R$ 1.26M injetados no caixa).',
        proposedAction: 'Aceitar pedido e emitir fatura de adiantamento estruturado.',
        confidence: 99,
        metrics: { 'Margem Líquida': '+R$ 1.180.000', 'Entrada Caixa D+0': '+R$ 1.260.000', 'Margem EBITDA': '28.1%' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'Necessário agendar 4 carretas bi-trem dedicadas e reservar doca 3 na fábrica para carregamento contínuo em 3 turnos.',
        proposedAction: 'Travar 4 janelas prioritárias com a transportadora TransBrasil.',
        confidence: 95,
        metrics: { 'Docas Bloqueadas': 'Doca 3 & 4', 'Capacidade Expedição': '100%', 'Prazo': '7 dias' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'Oportunidade de consolidação como fornecedor preferencial Tier-1 no Varejo Global, garantindo contrato anual de R$ 18M.',
        proposedAction: 'Assinar aceite tático eletrônico e emitir cronograma horário de entregas.',
        confidence: 98,
        metrics: { 'Upsell Futuro': 'R$ 18M/ano', 'SLA Garantido': '99.5%', 'Share of Wallet': '+32%' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & High-End Sales',
        role: 'revenue_ops',
        reasoning: 'Estruturação de comissionamento escalonado para equipe de Key Accounts e travamento de margem bruta de 28.1% com adiantamento de 30% estruturado.',
        proposedAction: 'Sincronizar oportunidade ganha no CRM/ERP e registrar comissão de sucesso no livro de receitas.',
        confidence: 99,
        metrics: { 'Pipeline Velocity': '+45%', 'Deal Size': 'R$ 4.200.000', 'Comissão Equipe': 'R$ 84.000' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'Invariantes testadas: Capacidade de Fábrica + Turno Extra não viola limites de manutenção (OK); Adiantamento cobre 100% do custo variável (OK).',
        proposedAction: 'Sinalizar recomendação favorável de execução com gatilho Multi-Sig.',
        confidence: 97,
        metrics: { 'Invariantes OK': '4 de 4', 'Risco Inadimplência': '1.1%', 'Score Crédito': 'AAA' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Aprovar o pedido especial de R$ 4.2M do Varejo Global com adiantamento de 30%, ativando o 3º turno na fábrica e estoque consignado para entregar 12.000 un em 7 dias com lucro líquido de R$ 1.18M.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva.',
          'Emissão de fatura de adiantamento (R$ 1.26M).',
          'Ativação automática do turno extra na planta de produção.',
          'Reserva de malha logística dedicada TransBrasil.'
        ],
        strategicTradeoffs: [
          'Alocação de 80% da capacidade fabril por 5 dias, temporariamente reduzindo produção de SKUs de baixa margem.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'High',
      summary: 'Varejo Global abriu pedido spot de R$ 4.2M com bônus de margem de +18% e entrega em 7 dias. O AOS orquestrou insumos consignados, adiantamento de R$ 1.26M e 3º turno fabril, gerando R$ 1.18M de lucro líquido.',
      kpis: [
        { label: 'Lucro Líquido Adicional', value: '+R$ 1.180.000', impact: 'positive' },
        { label: 'Injeção Imediata de Caixa', value: '+R$ 1.260.000', impact: 'positive' },
        { label: 'Margem de Contribuição', value: '28.1% (vs 19% normal)', impact: 'positive' },
        { label: 'Utilização da Fábrica', value: '99.4%', impact: 'neutral' }
      ],
      invariants_checked: [
        'Saldo_Caixa > R$ 2.000.000 (Reforçado para R$ 9.68M) = OK',
        'Capacidade_Horas_Trabalhadas <= Limite_Legal_CLT = OK',
        'Score_Credito_Cliente >= AA (Atual: AAA) = OK',
        'Adiantamento_Cobre_Custos_Variaveis (134% cobertura) = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig Executiva (Aceite Comercial)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      execution_payload: {
        target_service: 'Salesforce_CRM_Billing (API REST + Stripe_Corporate)',
        action: 'AcceptHighMarginRushOrder',
        parameters: {
          customer_account_id: 'CUST_VAREJO_GLOBAL_AAA',
          deal_value_brl: 4200000.00,
          advance_payment_brl: 1260000.00,
          sku_ordered: 'SKU_SERIES_X_DELUXE',
          volume_units: 12000,
          shift_extension: 'THIRD_NIGHT_SHIFT_ACTIVATED',
          sla_delivery_deadline: '2026-08-22T18:00:00Z',
          penalty_waiver_signed: true
        },
        signature: '1b8f4c9a87d2e0f6b3a1d9c4e72a5b8f1c3d6e9a0b2f4c7d8e1a3b5c7d9e2f4a'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_customers', 'node_production', 'node_cash', 'node_logistics'],
        riskScore: 28,
        financialExposure: 'R$ 4.200.000'
      },
      audit_hash: '0x3f5b8a1c9e7d2f40b8a6e19d3c52fa719b48c2e6'
    }
  },
  {
    id: 'customs_delay',
    badge: 'Atraso Alfandegário',
    title: 'Operação Padrão e Greve em Porto de Santos Trava Importação',
    shortSummary: 'Containers de sensores industriais parados na aduana com risco de estocagem ociosa da linha.',
    event: {
      id: 'evt_log_6209',
      timestamp: '2026-08-15T07:10:00Z',
      source: 'Port Customs Gateway',
      title: 'Alerta Aduaneiro: Retenção de 4 Containers de Sensores no Porto de Santos',
      description: 'Operação padrão da Receita Federal aumentou tempo de desembaraço de 3 para 16 dias úteis no Porto de Santos, afetando 4 containers de insumos alemães.',
      category: 'logistics',
      severity: 'Critical',
      metricsAffected: [
        { name: 'Lead Time Aduaneiro', current: '3 dias', projected: '16 dias', delta: '+13 dias', negativeImpact: true },
        { name: 'Risco Desabastecimento', current: '1.2%', projected: '92.0%', delta: '+90.8%', negativeImpact: true },
        { name: 'Custo Diário Parada', current: 'R$ 0', projected: 'R$ 95.000/dia', delta: '+R$ 95k/d', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'O fornecedor na Alemanha (Bosch Industrial) possui estoque espelho no entreposto aduaneiro de Viracopos (Campinas) com desembaraço expresso D+1 via DTA (Declaração de Trânsito Aduaneiro).',
        proposedAction: 'Fazer swap de lote com o entreposto de Viracopos para 1.500 sensores de alívio.',
        confidence: 96,
        metrics: { 'Lote Swap': '1.500 un', 'Lead Time Viracopos': '24h', 'Custo Swap': 'R$ 32.000' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'O custo de swap e transporte aéreo aduaneiro de R$ 32k é 97% menor que a perda diária de R$ 95k por paralisação da linha. Retorno tático líquido de R$ 443k.',
        proposedAction: 'Aprovar adiantamento cambial para despacho aduaneiro DTA Viracopos.',
        confidence: 99,
        metrics: { 'Custo Operação': 'R$ 32.000', 'Prejuízo Evitado': 'R$ 475.000', 'Impacto EBITDA': '+R$ 443.000' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'Despachante parceiro em Viracopos já tem canal verde pré-aprovado (Operador Econômico Autorizado - OEA). Coleta aérea programada para amanhã às 06h.',
        proposedAction: 'Emitir guia DTA e agendar furgão refrigerado blindado Viracopos -> Fábrica.',
        confidence: 98,
        metrics: { 'Tempo Desembaraço': '18 horas', 'Certificação': 'OEA Nível 2', 'Status': 'Pronto' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'Com o swap de Viracopos, nenhuma data de faturamento aos clientes será postergada.',
        proposedAction: 'Manter cronograma de clientes inalterado.',
        confidence: 97,
        metrics: { 'Entregas Pontuais': '100%', 'Risco Cancelamento': '0%' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Faturamento',
        role: 'revenue_ops',
        reasoning: 'Preservação de R$ 475.000 em reconhecimento de receita para o trimestre fiscal em curso.',
        proposedAction: 'Manter pipeline de faturamento e agendar emissão de NF-e imediatamente após swap.',
        confidence: 98,
        metrics: { 'Receita Assegurada': 'R$ 475.000', 'Ciclo Faturamento': 'D+2 Intacto' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'Validação tributária e aduaneira realizada pelo agente semântico. Zero pendências fiscais na Receita Federal.',
        proposedAction: 'Submeter autorização de swap ao C-Level via Zero-GUI.',
        confidence: 100,
        metrics: { 'Compliance Aduaneiro': '100%', 'Risco Fiscal': 'Zero' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Executar swap imediato de 1.500 sensores com o entreposto OEA de Viracopos (R$ 32k), contornando o Porto de Santos em 24h e neutralizando risco de parada fabril de R$ 475k.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva.',
          'Transmissão eletrônica DTA-OEA para Viracopos.',
          'Liberação de adiantamento financeiro cambial.',
          'Carregamento blindado às 06:00 rumo à fábrica.'
        ],
        strategicTradeoffs: [
          'Desembolso de R$ 32k em frete aduaneiro especial para proteger R$ 475k de faturamento e manter a fábrica 100% ativa.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: 'Operação padrão no Porto de Santos ameaça reter insumos críticos por 16 dias. O AOS estruturou um swap aduaneiro DTA via Viracopos OEA em 24 horas (custo R$ 32k), eliminando risco de prejuízo de R$ 475.000.',
      kpis: [
        { label: 'Prejuízo de Parada Evitado', value: '+R$ 475.000', impact: 'positive' },
        { label: 'Tempo de Resolução', value: '24 horas (vs 16 dias)', impact: 'positive' },
        { label: 'Custo do Swap & Frete OEA', value: '-R$ 32.000', impact: 'negative' },
        { label: 'Continuidade da Produção', value: '100% Assegurada', impact: 'positive' }
      ],
      invariants_checked: [
        'Saldo_Caixa > R$ 2.000.000 (Atual: R$ 8.38M) = OK',
        'Compliance_Aduaneiro_Receita_Federal (Certificação OEA) = OK',
        'Estoque_Seguranca_Fabrica >= 15d = OK',
        'Retorno_Tatico (ROI 14.8x) = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig Executiva (Despacho Aduaneiro)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      context_graph_snapshot: {
        nodesAffected: ['node_logistics', 'node_inventory', 'node_production', 'node_cash'],
        riskScore: 78,
        financialExposure: 'R$ 475.000'
      },
      audit_hash: '0x7e2d9a4b1c8f305e6b9a2c1f4e8d7a9b0c23e5f1'
    }
  },
  {
    id: 'fx_hedge_shock',
    badge: 'Choque Cambial & Hedge',
    title: 'Disparada Repentina do Dólar (+4.8%) e Oportunidade de Hedge Spot',
    shortSummary: 'Aumento na volatilidade cambial eleva custo de insumos importados futuros.',
    event: {
      id: 'evt_mkt_9912',
      timestamp: '2026-08-15T09:05:00Z',
      source: 'Market FX Feed',
      title: 'Volatilidade FX: USD/BRL salta de 5,42 para 5,68 em 35 minutos',
      description: 'Divulgação de ata macroeconômica global provocou repique cambial de +4.8%. Contas a pagar em moeda estrangeira dos próximos 60 dias somam US$ 1.850.000.',
      category: 'treasury',
      severity: 'High',
      metricsAffected: [
        { name: 'Cotação USD/BRL', current: '5,420', projected: '5,680', delta: '+R$ 0,26 (+4.8%)', negativeImpact: true },
        { name: 'Exposição Cambial Líquida', current: 'US$ 1.85M', projected: 'US$ 1.85M (Desprotegido)', delta: 'R$ 481k risco', negativeImpact: true },
        { name: 'Impacto Margem Bruta', current: '34.2%', projected: '31.1%', delta: '-3.1 p.p.', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'Temos US$ 1.85M em POs emitidas com faturamento em 30 e 60 dias. Recomenda-se travar a taxa antes da abertura de Wall Street.',
        proposedAction: 'Notificar tesouraria para fechamento de trava cambial NDF.',
        confidence: 97,
        metrics: { 'Exposição Mapeada': 'US$ 1.850.000', 'Vencimento': '30 a 60 dias' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'O banco parceiro (Itaú BBA) abriu cotação de NDF sintético a 5,59 para 60 dias, travando a margem da empresa e economizando R$ 166.500 frente à curva de juros projetada de 5,75.',
        proposedAction: 'Contratar NDF de US$ 1.500.000 a R$ 5,59 (81% da exposição) com margem de garantia em CDB.',
        confidence: 99,
        metrics: { 'Taxa Travada': 'USD 5,59', 'Economia Projetada': '+R$ 166.500', 'Hedge Ratio': '81.1%' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'Contratos de frete marítimo indexados em dólar já possuem cláusula Bunker Adjustment Factor limitada a 5,50.',
        proposedAction: 'Nenhuma alteração de rota necessária.',
        confidence: 95,
        metrics: { 'Frete Protegido': '100%' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'A proteção cambial permite manter tabela de preços inalterada no mercado doméstico, ganhando market share sobre concorrentes que terão que repassar custos.',
        proposedAction: 'Manter tabela de preços atualizada com selo de estabilidade para clientes B2B.',
        confidence: 96,
        metrics: { 'Vantagem Competitiva': '+4.8%', 'Retenção Clientes': '100%' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Pricing Strategy',
        role: 'revenue_ops',
        reasoning: 'Estabilidade de preços permite captura de novos contratos de longo prazo com alta aderência comercial e margem estimada.',
        proposedAction: 'Lançar campanha de captação de clientes da concorrência com tabela prioritária projetada para 90 dias (alta aderência à tese comercial).',
        confidence: 97,
        metrics: { 'Potencial Pipeline': 'R$ 3.8M', 'Margem Protegida': '34.2%' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'Invariantes: Exposição cambial descasada pós-operação será de apenas 18.9% (dentro do limite máximo de 20% da política de tesouraria).',
        proposedAction: 'Aprovar contratação do NDF via interface Zero-GUI com validação multi-sig.',
        confidence: 100,
        metrics: { 'Política de Risco': '100% Conforme', 'Exposição Residual': '18.9%' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Executar NDF cambial de US$ 1.5M a 5,59 (Itaú BBA) para blindar 81% das obrigações em moeda estrangeira, neutralizando perda de margem de R$ 481k e mantendo a competitividade de preços.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva da mesa de derivativos.',
          'Envio de ordem de fechamento NDF para Itaú BBA.',
          'Vinculação automática da garantia em CDB corporativo no ERP.'
        ],
        strategicTradeoffs: [
          'Travamento da taxa em 5,59 elimina risco de alta do dólar, renunciando a ganhos caso o dólar reverta abaixo de 5,45.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'High',
      summary: 'Dólar subiu 4.8% gerando risco de R$ 481k em insumos importados. O AOS orquestrou uma operação de NDF de US$ 1.5M a 5,59 travando 81% da exposição, preservando a margem bruta de 34% e gerando economia projetada de R$ 166.500.',
      kpis: [
        { label: 'Exposição Cambial Blindada', value: '81.1% (US$ 1.50M)', impact: 'positive' },
        { label: 'Economia Projetada Hedge', value: '+R$ 166.500', impact: 'positive' },
        { label: 'Margem Bruta Assegurada', value: '34.2% (sem repasse)', impact: 'positive' },
        { label: 'Exposição Residual', value: '18.9% (dentro do teto 20%)', impact: 'neutral' }
      ],
      invariants_checked: [
        'Saldo_Caixa > R$ 2.000.000 = OK',
        'Exposicao_Cambial_Descasada <= 20% (Atual: 18.9%) = OK',
        'Limite_Derivativos_Politica_Tesouraria (Utilizado 42%) = OK',
        'Rating_Contraparte_Bancaria >= AAA = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig Executiva (Contratação NDF)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      context_graph_snapshot: {
        nodesAffected: ['node_cash', 'node_suppliers', 'node_customers'],
        riskScore: 64,
        financialExposure: 'US$ 1.850.000'
      },
      audit_hash: '0x1b4c9e8d3f2a706b5e8a1d4c9f302e5a7b6c8d1f'
    }
  },
  {
    id: 'ransomware_logistics',
    badge: 'Ransomware Frota',
    title: 'Ataque de Ransomware Congela 100% da Frota da LogiExpress',
    shortSummary: '1.200 entregas (48h) e R$ 450.000 em mercadorias bloqueadas no galpão.',
    event: {
      id: 'evt_sec_7710',
      timestamp: '2026-08-15T10:05:00Z',
      source: 'IoT Fleet Tracker',
      title: 'Incidente Crítico de Cibersegurança: Frota LogiExpress Inoperante',
      description: 'A transportadora âncora LogiExpress sofreu ataque de ransomware com paralisação total de servidores e telemetria. 1.200 entregas programadas para as próximas 48h e R$ 450.000 em cargas no galpão correm risco iminente de extravio e quebra de SLA.',
      category: 'logistics',
      severity: 'Critical',
      metricsAffected: [
        { name: 'Entregas em Risco (48h)', current: '0', projected: '1.200 pedidos', delta: '+1.200 pedidos', negativeImpact: true },
        { name: 'Carga Bloqueada Galpão', current: 'R$ 0', projected: 'R$ 450.000', delta: '+R$ 450k', negativeImpact: true },
        { name: 'Risco de Multa Contratual SLA', current: 'R$ 0', projected: 'R$ 280.000', delta: '+R$ 280k', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'Acionamento imediato da rede homologada de contingência no Barramento Semântico. 3 transportadoras homologadas (TransBrasil Express, Rodovias SP e FlashCargo) possuem capacidade combinada ociosa para absorver as 1.200 entregas em 4h30 com sobretaxa spot de 8.5% (R$ 18.200).',
        proposedAction: 'Emitir ordens de coleta emergencial fracionada via EDI com as 3 transportadoras homologadas de backup.',
        confidence: 98,
        metrics: { 'Frota Substituta': '32 VUCs e Carretas', 'Sobretaxa Spot': '+8.5% (R$ 18.2k)', 'Tempo de Mobilização': '2h15' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'O custo operacional extra de R$ 18.200 para transbordo e frete expresso evita R$ 280.000 em multas contratuais de SLA e preserva R$ 450.000 em faturamento de clientes Tier-A. Impacto líquido positivo de +R$ 261.800.',
        proposedAction: 'Liberar desembolso tático de R$ 18.200 da reserva de contingência operacional.',
        confidence: 99,
        metrics: { 'Desembolso Spot': 'R$ 18.200', 'Multas Evitadas': 'R$ 280.000', 'EBITDA Preservado': '+R$ 261.800' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'Despacho de equipe de conferência para o galpão com conferência física manual e bipagem offline de contingência, transferindo a carga das docas 1 e 2 para as 3 novas operadoras em 3 turnos escalonados.',
        proposedAction: 'Iniciar operação de transbordo imediato no galpão com expedição prioritária para entregas com SLA < 24h.',
        confidence: 96,
        metrics: { 'Capacidade Transbordo': '1.200 un / 6h', 'Preservação Janela': '99.4%', 'Docas Alocadas': 'Docas 1 a 4' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'Disparo preventivo e automático de notificações de rastreio aos 1.200 clientes com código de atualização da nova transportadora. Zero cancelamentos e zero penalidades contratuais.',
        proposedAction: 'Transmitir comunicados proativos com novo link de telemetria em tempo real para os clientes.',
        confidence: 97,
        metrics: { 'SLA Contratual': '100% Cumprido', 'Risco de Churn': '0.0%', 'NPS Preservado': '92+' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Retenção de Contratos',
        role: 'revenue_ops',
        reasoning: 'Proteção de R$ 450.000 em receitas ativas e mitigação de risco de churn em contas B2B de alto valor.',
        proposedAction: 'Acionar protocolo de comunicação proativa com gestores de conta e validar faturamento sem atraso.',
        confidence: 98,
        metrics: { 'Faturamento Preservado': 'R$ 450.000', 'Contas Protegidas': '1.200 pedidos' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'Isolamento cibernético de conexões API com a LogiExpress para proteger o Barramento Semântico do AOS contra propagação de malware. Verificação de todas as 4 invariantes operacionais.',
        proposedAction: 'Revogar tokens de integração da LogiExpress e submeter autorização Multi-Sig para o plano de transbordo.',
        confidence: 100,
        metrics: { 'Isolamento Ciber': '100% Seguro', 'Invariantes OK': '4 de 4', 'Zero-Trust Gate': 'Exige Multi-Sig' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Isolar imediatamente os canais da LogiExpress, acionar 3 transportadoras homologadas de backup para transbordo das 1.200 entregas (custo extra de R$ 18.2k), assegurando cumprimento de 100% dos SLAs e blindando R$ 450k em mercadorias.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva pelo CEO e Diretor de Operações.',
          'Revogação imediata de credenciais de API da LogiExpress no Gateway de Segurança.',
          'Emissão automática de ordens de coleta emergencial para TransBrasil, Rodovias SP e FlashCargo.',
          'Início do transbordo físico nas docas do galpão central às 11:00.',
          'Disparo de notificações de rastreio atualizadas para os 1.200 clientes finais.'
        ],
        strategicTradeoffs: [
          'Custo extra de frete spot de R$ 18.2k absorvido para proteger R$ 450k em mercadorias e evitar R$ 280k em penalidades de atraso contratual.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: 'Ataque de ransomware paralisou a LogiExpress com 1.200 entregas e R$ 450k em risco. O AOS isolou as integrações comprometidas e orquestrou a divisão da frota entre 3 transportadoras homologadas de backup (custo R$ 18.2k), preservando 100% dos SLAs e evitando R$ 280.000 em multas.',
      kpis: [
        { label: 'Mercadorias Desbloqueadas', value: 'R$ 450.000 (100%)', impact: 'positive' },
        { label: 'Multas de SLA Evitadas', value: '+R$ 280.000', impact: 'positive' },
        { label: 'Custo Extra de Transbordo Spot', value: '-R$ 18.200', impact: 'negative' },
        { label: 'SLA Entrega 48h', value: '99.4% Preservado', impact: 'positive' }
      ],
      invariants_checked: [
        'Saldo_Caixa > R$ 2.000.000 (Livre: R$ 8.40M) = OK',
        'SLA_Compliance_Clientes >= 98% (Projetado: 99.4%) = OK',
        'Seguranca_Zero_Trust_Isolamento_API_Comprometida = OK',
        'Transportadoras_Backup_Homologadas_ISO = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig Executiva (Transbordo & Roteamento)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      execution_payload: {
        target_service: 'TMS_EDI_Gateway (SAP_Logistics + TransBrasil API)',
        action: 'DispatchEmergencyFleetTransshipment',
        parameters: {
          incident_id: 'RANSOMWARE_LOGIEXPRESS_001',
          quarantine_partner_id: 'LOGI_EXP_BR',
          allocated_carriers: [
            { id: 'TRANSBRASIL_EXP', quota_deliveries: 450, cost_brl: 6825.00 },
            { id: 'RODOVIAS_SP_CARGA', quota_deliveries: 400, cost_brl: 6075.00 },
            { id: 'FLASHCARGO_PRIORITY', quota_deliveries: 350, cost_brl: 5300.00 }
          ],
          total_parcels: 1200,
          declared_cargo_value_brl: 450000.00,
          dock_start_time: '2026-08-15T11:00:00Z',
          sla_max_window_hours: 48,
          payment_terms: 'D+30_INVOICE'
        },
        signature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_logistics', 'node_inventory', 'node_customers', 'node_cash'],
        riskScore: 92,
        financialExposure: 'R$ 450.000'
      },
      security_guard: {
        status: 'VERIFIED',
        risk_score: 12,
        source_authenticity: 'Telemetria IoT de Frota Criptografada (Gateway TLS 1.3)',
        requires_biometric_override: false
      },
      sector_context: {
        sector: 'manufacturing',
        sectorLabel: 'Logística & Cadeia de Suprimentos',
        regulatoryStandard: 'ISO 28000 / OEA'
      },
      audit_hash: '0x8d3e2b1a9f4c705e6a1d8f3c2b904e5a7b6c8d3e'
    }
  },
  {
    id: 'fraud_intercept_pix',
    badge: 'Alerta Antifraude',
    title: 'Tentativa de Fraude: Alteração de Chave PIX de Fornecedor via WhatsApp',
    shortSummary: 'Proof of Intent interceptou tentativa de desvio de pagamento de R$ 145.000 com chave não autenticada.',
    event: {
      id: 'evt_sec_fraud_001',
      timestamp: '2026-08-15T11:18:22Z',
      source: 'WhatsApp Ingestion',
      title: 'Alerta de Engenharia Social: Solicitação de Troca de Domicílio Bancário',
      description: 'Mensagem de WhatsApp não assinada originada de número não cadastrado (+55 11 99123-XXXX) solicitando liquidação emergencial de fatura de R$ 145.000 da TechCore SP em nova chave PIX aleatória.',
      category: 'treasury',
      severity: 'Critical',
      metricsAffected: [
        { name: 'Risco de Fraude Bancária', current: '0.0%', projected: '98.5%', delta: '+98.5%', negativeImpact: true },
        { name: 'Exposição Financeira Imediata', current: 'R$ 0', projected: 'R$ 145.000', delta: '+R$ 145k', negativeImpact: true },
        { name: 'Integridade Proof of Intent', current: '100%', projected: '0% (Violada)', delta: '-100%', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Procurement',
        role: 'procurement',
        reasoning: 'O fornecedor TechCore SP possui domicílio bancário registrado no contrato social (Banco Santander, Chave CNPJ). A chave solicitada via WhatsApp não consta no cadastro homologado no ERP.',
        proposedAction: 'Bloquear atualização cadastral e acionar quarentena preventiva no cadastro do fornecedor.',
        confidence: 100,
        metrics: { 'Status Cadastro': 'Congelado', 'Chave Oficial': 'CNPJ Homologado', 'Canal Oficial': 'Portal Fornecedor' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Tesouraria',
        role: 'finance',
        reasoning: 'Bloqueio imediato da ordem de liquidação de R$ 145.000. O caixa permanece protegido e nenhuma saída não autorizada será liberada sem confirmação por canal seguro.',
        proposedAction: 'Suspender pagamento de R$ 145.000 até conclusão da averiguação antifraude.',
        confidence: 100,
        metrics: { 'Caixa Blindado': 'R$ 145.000', 'Status Pagamento': 'Retido / Em Quarentena', 'Liquidação DVP': 'Abortada' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística & Roteamento',
        role: 'logistics',
        reasoning: 'As entregas físicas de mercadorias já recebidas no galpão possuem NF-e autêntica e estão sob custódia segura.',
        proposedAction: 'Manter insumos na doca de quarentena até liberação jurídica.',
        confidence: 95,
        metrics: { 'Mercadoria em Custódia': '100%', 'Doca': 'Quarentena Doca 02' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Receita & SLAs',
        role: 'sales',
        reasoning: 'Zero impacto operacional ou comercial para clientes finais.',
        proposedAction: 'Registrar log de compliance para comitê de auditoria.',
        confidence: 99,
        metrics: { 'Impacto Clientes': 'Zero', 'SLA': '100%' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Governança',
        role: 'revenue_ops',
        reasoning: 'Bloqueio preventivo de esteiras de faturamento e canais de cobrança não autenticados. Prevenção de duplicidade de notas ou distorções no fluxo de caixa.',
        proposedAction: 'Manter quarentena de títulos e emitir relatório de integridade contábil.',
        confidence: 100,
        metrics: { 'Integridade Títulos': '100%', 'Status': 'Quarentena Ativa', 'Risco Fraude': 'Bloqueado' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Invariantes',
        role: 'risk',
        reasoning: 'VIOLAÇÃO CRÍTICA DE PROOF OF INTENT: Origem não autenticada e tentativa de desvio de rota financeira. Invariante "Chave_PIX_Cadastrada_Inalterada" violada. Classificação imediata como SUSPECTED_FRAUD com bloqueio do payload de execução.',
        proposedAction: 'Acionar flag SUSPECTED_FRAUD, travar disparos automáticos e exigir dupla checagem humana via contato telefônico cadastrado.',
        confidence: 100,
        metrics: { 'Invariante Antifraude': 'BLOQUEADA', 'Score Risco': '98/100', 'Ação': 'FLAG SUSPECTED_FRAUD' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'O Guardião Proof of Intent interceptou uma tentativa de engenharia social via WhatsApp para alteração de chave PIX de fornecedor (R$ 145.000). A transação foi bloqueada, o domicílio bancário oficial foi mantido e o payload de pagamento automático foi travado.',
        executionPlan: [
          'Interrupção imediata de qualquer despacho bancário para a chave desconhecida.',
          'Emissão de alerta de alto risco (SUSPECTED_FRAUD) na Zero-GUI.',
          'Exigência de dupla checagem humana e contato gravado com o Diretor Financeiro da TechCore.',
          'Notificação automática para o time de Cibersegurança e Compliance.'
        ],
        strategicTradeoffs: [
          'Prevenção total de perda patrimonial de R$ 145.000 através de governança Zero-Trust.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: '[INTERCEPTAÇÃO ANTIFRAUDE]: O AOS detectou tentativa de engenharia social via WhatsApp para alterar a chave PIX do fornecedor TechCore SP (R$ 145.000). O Guardião de Segurança bloqueou o pagamento e ativou o protocolo de quarentena bancária.',
      kpis: [
        { label: 'Tentativa de Fraude Bloqueada', value: 'R$ 145.000 (100%)', impact: 'positive' },
        { label: 'Score de Risco Antifraude', value: '98/100 [CRÍTICO]', impact: 'negative' },
        { label: 'Status da Ordem Bancária', value: 'BLOQUEADA / QUARENTENA', impact: 'negative' },
        { label: 'Proof of Intent Guard', value: 'INTERCEPTADO', impact: 'positive' }
      ],
      invariants_checked: [
        'Proof_Of_Intent_Origem_Assinada = FALHOU (Canal Não Autenticado)',
        'Chave_PIX_Cadastrada_Inalterada = VIOLAÇÃO DETECTADA',
        'Invariante_AntiFraude_Quarentena_Ativa = OK',
        'Bloqueio_Disparo_Automatico_Garantido = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize Bloqueado: Exige Dupla Checagem Humana Antifraude' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros / Reportar Falso Positivo' }
      ],
      execution_payload: {
        target_service: 'FraudQuarantine_Gateway (SecOps + CoreBanking)',
        action: 'QuarantineAndBlockUnauthorizedPixTransfer',
        parameters: {
          incident_type: 'PHISHING_PIX_SPOOFING_ATTEMPT',
          vendor_id: 'TECHCORE_SP_9001',
          attempted_pix_key: 'e3981042-99ab-4f91-ba01-882910398210',
          official_pix_key_cnpj: '12.894.201/0001-99',
          blocked_amount_brl: 145000.00,
          intercepting_agent: 'ProofOfIntent_SecurityGuard_v4',
          quarantine_status: 'LOCKED_PENDING_HUMAN_PHONE_CONFIRMATION'
        },
        signature: 'c4ca4238a0b923820dcc509a6f75849b2f1f41d9c0e5a87265f6c8d203b8e4e9'
      },
      security_guard: {
        status: 'SUSPECTED_FRAUD',
        flag: 'SUSPECTED_FRAUD',
        risk_score: 98,
        anomaly_details: 'Alteração não autorizada de chave PIX de fornecedor recebida via WhatsApp não autenticado solicitando pagamento urgente.',
        source_authenticity: 'Mensagem de WhatsApp Não Assinada (+55 11 99123-XXXX)',
        requires_biometric_override: true,
        mitigation_protocol: 'Exige contato telefônico no número institucional cadastrado do CFO da TechCore e biometria executiva.'
      },
      sector_context: {
        sector: 'manufacturing',
        sectorLabel: 'Governança Financeira & Antifraude',
        regulatoryStandard: 'BACEN Resolução 142 / Zero-Trust'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_cash', 'node_suppliers'],
        riskScore: 98,
        financialExposure: 'R$ 145.000'
      },
      audit_hash: '0xfa9182bc01e389d47a8291038472910384729103'
    }
  },
  {
    id: 'healthcare_coldchain',
    badge: 'Saúde & Cadeia Frio',
    title: 'Alerta Térmico em Câmara Fria de Imunobiológicos (Compliance Anvisa & LGPD)',
    shortSummary: 'Oscilação para 11.2°C ameaça lote de R$ 890.000 de vacinas oncológicas.',
    event: {
      id: 'evt_health_9921',
      timestamp: '2026-08-15T11:40:00Z',
      source: 'IoT ColdChain Sensor',
      title: 'Alarme Térmico Crítico: Câmara Fria 03 em 11.2°C (Faixa Tolerada: 2°C a 8°C)',
      description: 'Sensor IoT telemétrico detectou falha no compressor secundário da Câmara 03 no Hub Hospitalar. Lote de 4.500 ampolas oncológicas e imunobiológicos (R$ 890.000) corre risco de descarte em 55 minutos.',
      category: 'supply_chain',
      severity: 'Critical',
      metricsAffected: [
        { name: 'Temperatura da Câmara', current: '4.0°C', projected: '11.2°C', delta: '+7.2°C', negativeImpact: true },
        { name: 'Lote sob Risco Térmico', current: 'R$ 0', projected: 'R$ 890.000', delta: '+R$ 890k', negativeImpact: true },
        { name: 'Compliance Anvisa RDC 430', current: '100%', projected: 'Risco Notificação', delta: 'Alerta', negativeImpact: true }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Insumos Hospitalares',
        role: 'procurement',
        reasoning: 'O Hub possui contrato de backup com a Criogênica Farma Express (distância de 12 minutos) com 3 contêineres criogênicos autônomos de nitrogênio líquido homologados Anvisa.',
        proposedAction: 'Despachar contêineres criogênicos móveis para transbordo imediato das 4.500 ampolas.',
        confidence: 99,
        metrics: { 'Tempo Resposta': '25 minutos', 'Homologação Anvisa': 'RDC 430/2020', 'Temperatura Alvo': '4.2°C' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro Hospitalar',
        role: 'finance',
        reasoning: 'Custo de mobilização criogênica de R$ 14.500 é 98.3% menor que a perda do lote de R$ 890.000. Cobertura da apólice de seguro de carga biológica acionada.',
        proposedAction: 'Aprovar desembolso emergencial de contingência criogênica.',
        confidence: 99,
        metrics: { 'Custo Emergência': 'R$ 14.500', 'Patrimônio Salvo': 'R$ 890.000', 'Cobertura Seguro': '100%' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Logística Farmacêutica',
        role: 'logistics',
        reasoning: 'Equipe farmacêutica de plantão acionada com protocolo de transferência em câmara de fluxo laminar sem perda de esterilidade.',
        proposedAction: 'Realizar transferência física em até 35 minutos com registro telemétrico contínuo.',
        confidence: 97,
        metrics: { 'Tempo Estimado': '32 min', 'Janela Segura': '55 min restantes' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Atendimento & Compliance Médico',
        role: 'sales',
        reasoning: 'Preservação de 100% dos tratamentos de pacientes agendados para amanhã. Dados de prontuário e identificação de pacientes protegidos sob sigilo estrito LGPD/HIPAA.',
        proposedAction: 'Emitir relatório de conformidade térmica para auditoria médica sem exposição de PII.',
        confidence: 100,
        metrics: { 'Cirurgias/Tratamentos Mantidos': '100%', 'Compliance LGPD/HIPAA': 'Zero Vazamento PII' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Convênios Hospitalares',
        role: 'revenue_ops',
        reasoning: 'Prevenção de glosas hospitalares e salvaguarda do faturamento de R$ 890.000 junto às operadoras de saúde e SUS.',
        proposedAction: 'Formalizar registro telemétrico da cadeia fria para evitar glosas em auditorias médicas.',
        confidence: 99,
        metrics: { 'Faturamento Protegido': 'R$ 890.000', 'Risco Glosa': '0.0%', 'SLA Operadoras': '100%' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Regulação Sanitária',
        role: 'risk',
        reasoning: 'Auditoria de rastreabilidade lote a lote em conformidade integral com a Anvisa RDC 430 e ISO 13485. Registro do log criptografado de temperatura no livro-razão imutável.',
        proposedAction: 'Gerar dossiê regulatório sanitário e autorizar transbordo via Zero-GUI.',
        confidence: 100,
        metrics: { 'RDC 430': 'Em Conformidade', 'Invariantes OK': '4 de 4', 'Zero-Trust Gate': 'Exige Multi-Sig' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Acionar contingência criogênica imediata para transbordo de R$ 890.000 em medicamentos termolábeis da Câmara 03 em 35 minutos, garantindo compliance integral com Anvisa RDC 430 e proteção de dados médicos (LGPD/HIPAA).',
        executionPlan: [
          'Assinatura Multi-Sig pelo Diretor Médico e Responsável Técnico Farmacêutico.',
          'Mobilização de contêineres criogênicos autônomos da Criogênica Farma.',
          'Transferência das 4.500 ampolas para estabilização em 4.2°C.',
          'Registro do log contínuo de temperatura para dossiê Anvisa.'
        ],
        strategicTradeoffs: [
          'Custo de contingência de R$ 14.5k absorvido para salvar R$ 890k de insumos e garantir segurança de 120 pacientes oncológicos.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: 'Falha no compressor da Câmara 03 elevou a temperatura para 11.2°C. O AOS acionou transbordo criogênico de emergência (25 min) para proteger R$ 890.000 em medicamentos oncológicos, mantendo conformidade integral com Anvisa RDC 430 e LGPD/HIPAA.',
      kpis: [
        { label: 'Medicamentos Salvos', value: 'R$ 890.000 (100%)', impact: 'positive' },
        { label: 'Temperatura Restabelecida', value: '4.2°C (Faixa 2-8°C)', impact: 'positive' },
        { label: 'Custo de Resposta Criogênica', value: '-R$ 14.500', impact: 'negative' },
        { label: 'Compliance Anvisa & LGPD', value: '100% Conforme', impact: 'positive' }
      ],
      invariants_checked: [
        'Temperatura_Cadeia_Frio <= 8.0°C (Projetado: 4.2°C) = OK',
        'Conformidade_Anvisa_RDC_430_Rastreabilidade = OK',
        'Protecao_Dados_Prontuarios_LGPD_HIPAA = OK',
        'Saldo_Caixa > R$ 2.000.000 (Livre: R$ 8.40M) = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig (Diretor Médico + RT Farmacêutico)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      execution_payload: {
        target_service: 'Hospital_LIMS_ColdChain_Gateway (HL7 + IoT)',
        action: 'DispatchCryogenicEmergencyTransshipment',
        parameters: {
          chamber_id: 'CHAMBER_03_ONCO_HUB',
          target_temperature_celsius: 4.2,
          lot_ids: ['LOT_ONCO_2026_881', 'LOT_IMMUNO_2026_902'],
          sku_units: 4500,
          declared_cargo_value_brl: 890000.00,
          anvisa_rdc_standard: 'RDC_430_2020',
          data_privacy_mode: 'HIPAA_LGPD_ANONYMIZED'
        },
        signature: '9f8e7d6c5b4a3928170f1e2d3c4b5a69788e9d0c1b2a3f4e5d6c7b8a9f0e1d2c'
      },
      security_guard: {
        status: 'VERIFIED',
        risk_score: 3,
        source_authenticity: 'Sensor IoT Calibrado Inmetro/Anvisa (Gateway TLS 1.3)',
        requires_biometric_override: false
      },
      sector_context: {
        sector: 'healthcare',
        sectorLabel: 'Saúde, Clínicas & Hospitais',
        regulatoryStandard: 'LGPD Médica / HIPAA / Anvisa RDC 430'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_inventory', 'node_cash', 'node_customers'],
        riskScore: 88,
        financialExposure: 'R$ 890.000'
      },
      audit_hash: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
    }
  },
  {
    id: 'services_capacity_crunch',
    badge: 'Serviços & Tech',
    title: 'Saturação de Capacidade da Squad (142%) para Antecipação de Go-Live de R$ 480k',
    shortSummary: 'Banco Digital Alfa solicita antecipação de 3 semanas com bônus de margem.',
    event: {
      id: 'evt_srv_5502',
      timestamp: '2026-08-15T12:00:00Z',
      source: 'Jira Enterprise & PSA Gateway',
      title: 'Solicitação de Antecipação de Go-Live Cloud: Bônus de R$ 480k (Banco Alfa)',
      description: 'Cliente Enterprise Alfa solicitou adiantamento de 3 semanas no cronograma de migração cloud com prêmio contratual de R$ 480.000. A squad principal atingirá 142% de alocação se não houver rebalanceamento.',
      category: 'customers',
      severity: 'High',
      metricsAffected: [
        { name: 'Ocupação da Squad', current: '82.0%', projected: '142.0%', delta: '+60.0%', negativeImpact: true },
        { name: 'Receita Líquida Adicional', current: 'R$ 0', projected: '+R$ 480.000', delta: '+R$ 480k', negativeImpact: false },
        { name: 'Compliance SOC 2 / Segurança', current: '100%', projected: '100%', delta: 'Estável', negativeImpact: false }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Parcerias & Squads',
        role: 'procurement',
        reasoning: 'Acionamento de 2 arquitetos sêniores certificados AWS/GCP da consultoria parceira homologada CloudPeak (contrato guarda-chuva ativo com NDA e SOC 2 Type II já auditado).',
        proposedAction: 'Emitir SOW spot para 2 arquitetos por 3 semanas (custo R$ 72.000).',
        confidence: 98,
        metrics: { 'Custo Subcontratação': 'R$ 72.000', 'Disponibilidade': 'Imediata (D+1)', 'Certificação SOC 2': '100%' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente Financeiro & Rentabilidade',
        role: 'finance',
        reasoning: 'Com receita adicional de R$ 480.000 e custo de subcontratação de R$ 72.000, a margem de contribuição líquida do aditivo é de 85% (+R$ 408.000 no EBITDA do mês).',
        proposedAction: 'Aprovar aditivo contratual com faturamento de 50% no aceite e 50% no go-live.',
        confidence: 99,
        metrics: { 'Receita Bruta': '+R$ 480.000', 'Margem Líquida': '85.0% (+R$ 408k)', 'Fluxo Caixa D+15': '+R$ 240k' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Alocação de Recursos (PSA)',
        role: 'logistics',
        reasoning: 'Rebalanceamento das tarefas não críticas de documentação e testes automatizados para squad de sustentação, normalizando a taxa de ocupação da squad em 88%.',
        proposedAction: 'Reconfigurar matriz de alocação no Jira PSA.',
        confidence: 96,
        metrics: { 'Ocupação Squad': '88.0% (Equilibrada)', 'Overtime': '0 horas extras arriscadas' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Relacionamento Enterprise',
        role: 'sales',
        reasoning: 'A entrega antecipada consolida o cliente como case de referência para expansão de contrato de ARR em R$ 2.4M no próximo trimestre.',
        proposedAction: 'Transmitir aditivo contratual com cronograma acelerado assinado.',
        confidence: 98,
        metrics: { 'NPS Cliente': '95+', 'Potencial Expansão ARR': 'R$ 2.4M' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Expansão de ARR',
        role: 'revenue_ops',
        reasoning: 'Estruturação do gatilho de faturamento acelerado (+R$ 480k à vista) e travamento de margem bruta de 85% para alavancar renovação anual de R$ 2.4M.',
        proposedAction: 'Sincronizar previsão de ARR no CRM e emitir termo de encerramento com bônus.',
        confidence: 99,
        metrics: { 'Bônus Reconhecido': 'R$ 480.000', 'Pipeline ARR': 'R$ 2.4M', 'Margem Líquida': '85.0%' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Segurança SOC 2',
        role: 'risk',
        reasoning: 'Verificação de compliance SOC 2: Todos os profissionais externos alocados possuem background check e estações de trabalho blindadas Zero-Trust.',
        proposedAction: 'Validar tokens de acesso com privilégio mínimo (Principle of Least Privilege).',
        confidence: 100,
        metrics: { 'SOC 2 Type II': 'Conforme', 'Invariantes Aprovadas': '4 de 4' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Aprovar a antecipação de go-live do Banco Alfa com receita extra de R$ 480.000 e margem líquida de 85% (+R$ 408k), alocando 2 arquitetos da parceira homologada CloudPeak para manter a equipe principal em 88% de ocupação segura sob compliance SOC 2.',
        executionPlan: [
          'Assinatura Multi-Sig do C-Level.',
          'Emissão de SOW de alocação com CloudPeak (R$ 72k).',
          'Provisionamento de credenciais seguras Zero-Trust com MFA.',
          'Faturamento da 1ª parcela de adiantamento (R$ 240k).'
        ],
        strategicTradeoffs: [
          'Investimento pontual de R$ 72k em capacidade externa para capturar R$ 480k em receita líquida imediata e fidelizar conta estratégica.'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'High',
      summary: 'Banco Alfa solicitou antecipação de go-live com bônus de R$ 480.000. O AOS rebalanceou a alocação de equipe e integrou 2 arquitetos parceiros homologados SOC 2 (custo R$ 72k), garantindo entrega antecipada com margem de 85% (+R$ 408k) e ocupação estável em 88%.',
      kpis: [
        { label: 'EBITDA Adicional Líquido', value: '+R$ 408.000 (85%)', impact: 'positive' },
        { label: 'Ocupação da Squad', value: '88.0% (Equilibrada)', impact: 'positive' },
        { label: 'Custo Capacidade Externa', value: '-R$ 72.000', impact: 'negative' },
        { label: 'Compliance SOC 2 / SLA', value: '100% Preservado', impact: 'positive' }
      ],
      invariants_checked: [
        'Ocupacao_Equipe <= 90% (Projetado: 88.0%) = OK',
        'Margem_Liquida_Aditivo >= 60% (Projetado: 85.0%) = OK',
        'Compliance_Seguranca_SOC2_Auditoria = OK',
        'Saldo_Caixa > R$ 2.000.000 = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig (CTO + Head de Operações)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
      ],
      execution_payload: {
        target_service: 'Jira_PSA_Billing_Gateway (REST API v3)',
        action: 'ApproveSprintAccelerationAndPartnerSOW',
        parameters: {
          project_id: 'BANCO_ALFA_CLOUD_MIGRATION',
          bonus_revenue_brl: 480000.00,
          partner_sow_cost_brl: 72000.00,
          target_golive_date: '2026-09-02T18:00:00Z',
          squad_utilization_cap: 0.88,
          soc2_compliance_verified: true
        },
        signature: '2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c'
      },
      security_guard: {
        status: 'VERIFIED',
        risk_score: 5,
        source_authenticity: 'Portal Corporativo Banco Alfa (Autenticação mTLS + SAML)',
        requires_biometric_override: false
      },
      sector_context: {
        sector: 'services',
        sectorLabel: 'Serviços, Consultoria & Tech',
        regulatoryStandard: 'SOC 2 Type II / SLA 99.9%'
      },
      context_graph_snapshot: {
        nodesAffected: ['node_customers', 'node_production', 'node_cash'],
        riskScore: 35,
        financialExposure: 'R$ 480.000'
      },
      audit_hash: '0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d'
    }
  },
  {
    id: 'real_estate_luxury_acquisition',
    badge: 'Real Estate & Luxo',
    title: 'Fechamento de Portfólio Imobiliário Comercial Prime (R$ 28.5M) com Escrow e Comissões',
    shortSummary: 'Due diligence imobiliária, estruturação de conta escrow bancária, split de corretagem CRECI 6% e registro em cartório RGI.',
    event: {
      id: 'evt_re_8801',
      timestamp: '2026-08-15T14:30:00Z',
      source: 'Real Estate Deal Gateway',
      title: 'Proposta Vinculante: Aquisição de Complexo Comercial Prime Faria Lima (R$ 28.500.000)',
      description: 'Fundo de Investimento Imobiliário formalizou proposta de compra do Edifício Prime Corporativo com exigência de custódia Escrow em banco de primeira linha, split de comissão de corretagem (6% CRECI) e fechamento de escritura sob matrícula RGI desimpedida.',
      category: 'customers',
      severity: 'Critical',
      metricsAffected: [
        { name: 'VGV da Transação', current: 'R$ 0', projected: 'R$ 28.500.000', delta: '+R$ 28.5M', negativeImpact: false },
        { name: 'Cap Rate Estimado', current: '8.1%', projected: '9.4%', delta: '+1.3 p.p.', negativeImpact: false },
        { name: 'Comissão CRECI (6%)', current: 'R$ 0', projected: 'R$ 1.710.000', delta: '+R$ 1.71M', negativeImpact: false }
      ]
    },
    swarm: {
      procurement: {
        agentName: 'Agente de Due Diligence & Certidões',
        role: 'procurement',
        reasoning: 'Coleta automatizada de certidões negativas vintenárias no 4º Ofício de Registro de Imóveis (RGI), CND Federal, Tributos Imobiliários Municipais (IPTU) e Distribuição Cível/Trabalhista. Imóvel 100% livre e desembaraçado de ônus ou gravames.',
        proposedAction: 'Emitir laudo de Due Diligence imobiliária com parecer favorável de aquisição.',
        confidence: 100,
        metrics: { 'Certidões RGI': '100% Negativas', 'Matrícula': 'Desimpedida', 'CND Municipal': 'Em Dia' },
        status: 'completed'
      },
      finance: {
        agentName: 'Agente de Finanças & Estruturação Escrow',
        role: 'finance',
        reasoning: 'Estruturação da conta Escrow no Banco BTG Pactual com custódia de R$ 28.5M sob condição resolutiva de registro da escritura. Apuração de ITBI de 3% (R$ 855.000) e emolumentos cartorários (R$ 48.000).',
        proposedAction: 'Aprovar abertura de conta Escrow e agendar liquidação DVP vinculada à prenotação da matrícula.',
        confidence: 99,
        metrics: { 'VGV Total': 'R$ 28.500.000', 'ITBI / Emolumentos': 'R$ 903.000', 'Cap Rate Alvo': '9.4%' },
        status: 'completed'
      },
      logistics: {
        agentName: 'Agente de Operações Prediais & Asset',
        role: 'logistics',
        reasoning: 'Vistoria predial com escaneamento fotogramétrico 3D e inspeção de sistemas de climatização, elevadores inteligentes e geradores. Certificação predial LEED Gold ativa.',
        proposedAction: 'Formalizar termo de vistoria técnica e transferência da gestão de facilities.',
        confidence: 97,
        metrics: { 'Área BOMA': '4.280 m²', 'Vacância': '0.0% (100% Locado)', 'Selo LEED': 'Gold' },
        status: 'completed'
      },
      sales: {
        agentName: 'Agente de Vendas & Relacionamento VIP',
        role: 'sales',
        reasoning: 'Comprador institucional qualificado (FII AAA). Os contratos de locação vigentes (BTS de 10 anos com multinacionais de tecnologia) geram NOI mensal de R$ 223.250.',
        proposedAction: 'Assinar memorando de entendimentos (MoU) vinculante com o comitê de investimentos do FII.',
        confidence: 98,
        metrics: { 'NOI Anual': 'R$ 2.679.000', 'WAULT': '7.4 anos', 'Rating Inquilinos': 'AAA' },
        status: 'completed'
      },
      revenue_ops: {
        agentName: 'Agente de Revenue Ops & Real Estate Asset',
        role: 'revenue_ops',
        reasoning: 'Configuração do split automatizado de 6% em comissões CRECI (R$ 1.710.000) divididas entre imobiliária parceira e assessoria jurídica imobiliária, com recolhimento na fonte e compensação de PIS/COFINS. Blindagem do Net Operating Income (NOI) e otimização do Cap Rate de saída para 9.4%.',
        proposedAction: 'Programar split automático de comissões de corretagem e integrar cronograma de amortização no ERP imobiliário.',
        confidence: 100,
        metrics: { 'VGV Negociado': 'R$ 28.5M', 'Split CRECI (6%)': 'R$ 1.710.000', 'Cap Rate': '9.4%', 'Escrow Custódia': 'Ativa', 'Pipeline Velocity': '14 dias' },
        status: 'completed'
      },
      risk: {
        agentName: 'Agente de Risco & Conformidade Notarial',
        role: 'risk',
        reasoning: 'Validação de Invariantes Imobiliárias: Due_Diligence_Certidoes == 100% OK; Conta_Escrow_Custodiante_Ativa == OK; Compliance_COAF_PLDFT (Prevenção à Lavagem de Dinheiro) == OK. Exige quórum Multi-Sig executivo do Conselho.',
        proposedAction: 'Submeter minuta de escritura pública definitiva para aprovação Multi-Sig com assinatura Secp256k1.',
        confidence: 100,
        metrics: { 'COAF Compliance': 'Aprovado', 'Invariantes OK': '5 de 5', 'Quórum Multi-Sig': '3 de 3' },
        status: 'completed'
      },
      synthesizer: {
        decisionSummary: 'Aprovar o fechamento da aquisição do Edifício Prime Corporativo por R$ 28.5M com Cap Rate de 9.4% e NOI anual de R$ 2.68M. O AOS estruturou a conta Escrow bancária vinculada ao RGI, split automático de 6% em comissões CRECI (R$ 1.71M) e validação integral de Due Diligence sob compliance notarial e COAF.',
        executionPlan: [
          'Assinatura Multi-Sig Executiva do Conselho e Diretor de Real Estate.',
          'Depósito dos R$ 28.5M na conta Escrow do banco custodiante.',
          'Assinatura digital da escritura pública de compra e venda no e-Notariado.',
          'Prenotação da matrícula no 4º Ofício de Registro de Imóveis (RGI).',
          'Liberação automatizada dos fundos e split de comissão CRECI (R$ 1.71M) após certidão de registro.'
        ],
        strategicTradeoffs: [
          'Alocação de capital em ativo de renda urbana resiliente com Cap Rate de 9.4% e inquilinos Triple-A com contratos de longo prazo (WAULT 7.4 anos).'
        ]
      }
    },
    ast: {
      ui_type: 'CriticalDecisionCard',
      priority: 'Critical',
      summary: 'Fechamento de venda de complexo corporativo Prime Faria Lima por R$ 28.500.000 (Cap Rate 9.4%). O AOS orquestrou Due Diligence notarial no RGI, conta Escrow em banco custodiante e split automatizado de 6% em comissões CRECI (R$ 1.71M), assegurando conformidade com a Lei 4.591 e COAF.',
      kpis: [
        { label: 'VGV Transação', value: 'R$ 28.500.000', impact: 'positive' },
        { label: 'Cap Rate Líquido', value: '9.4% a.a.', impact: 'positive' },
        { label: 'Comissão CRECI (6%)', value: 'R$ 1.710.000', impact: 'neutral' },
        { label: 'Due Diligence & RGI', value: '100% Desembaraçado', impact: 'positive' }
      ],
      invariants_checked: [
        'Due_Diligence_Matricula_RGI_Sem_Onus = OK',
        'Conta_Escrow_Banco_Custodiante_Ativa = OK',
        'Compliance_COAF_PLDFT_Lavagem_Dinheiro = OK',
        'Saldo_Caixa_Pos_Transacao > R$ 2.000.000 = OK',
        'Split_Comissao_CRECI_6pct_Automatizado = OK'
      ],
      actions: [
        { id: 'approve', type: 'SwipeMultiSig', label: 'Deslize para Assinatura Multi-Sig (Diretoria de Real Estate + CFO)' },
        { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros de Escrow / Comissões' }
      ],
      execution_payload: {
        target_service: 'RealEstate_Escrow_Notary_Gateway (e-Notariado API + BACEN Custody)',
        action: 'ExecuteCommercialRealEstateClosingAndEscrow',
        parameters: {
          property_registration_id: 'RGI_4_SP_MATRICULA_184920',
          transaction_vgv_brl: 28500000.00,
          escrow_bank: 'BANCO_BTG_PACTUAL_S_A',
          escrow_release_condition: 'RGI_REGISTRATION_CERTIFICATE_ISSUED',
          commission_creci_split_brl: 1710000.00,
          itbi_tax_brl: 855000.00,
          notary_fees_brl: 48000.00,
          cap_rate_percentage: 9.40,
          annual_noi_brl: 2679000.00,
          coaf_compliance_approved: true
        },
        signature: 'f4e3d2c1b0a99887766554433221100ffeeddccbbaa99887766554433221100f'
      },
      security_guard: {
        status: 'VERIFIED',
        risk_score: 4,
        source_authenticity: 'Assinatura Notarial e-Notariado ICP-Brasil (Certificado A3)',
        requires_biometric_override: false
      },
      sector_context: {
        sector: 'real_estate',
        sectorLabel: 'Real Estate & High-End Sales',
        regulatoryStandard: 'CRECI / RGI Cartórios / Lei 4.591 / BACEN Escrow',
        domainSpecificKpi: {
          label: 'Cap Rate da Transação',
          value: '9.4%',
          alert: false
        }
      },
      context_graph_snapshot: {
        nodesAffected: ['node_cash', 'node_customers'],
        riskScore: 32,
        financialExposure: 'R$ 28.500.000'
      },
      audit_hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e'
    }
  }
];

export const PRESET_SCENARIOS: ScenarioDefinition[] = RAW_PRESET_SCENARIOS.map(s => ({
  ...s,
  swarm: enrichSwarmWith12Agents(s.swarm, s.title, s.ast.sector_context?.sector)
}));
