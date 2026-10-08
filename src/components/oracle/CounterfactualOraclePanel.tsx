import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  BarChart3, 
  PieChart, 
  DollarSign, 
  Building2, 
  Truck, 
  Users, 
  FileText, 
  Zap, 
  ArrowRight,
  Info,
  Calendar,
  Layers,
  HeartPulse,
  ShoppingBag,
  Briefcase,
  Wheat,
  HardHat
} from 'lucide-react';
import { TenantProfile, SupportedCurrency, FiscalJurisdiction } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { PartnerPortfolioService } from '../../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from '../common/PartnerPortfolioScopeSelector';
import { LiquidityPredictiveOracleCard } from './LiquidityPredictiveOracleCard';
import { secureId } from '../../lib/demoMode';

interface DecisionScenario {
  id: string;
  title: string;
  category: 'EXPANSION' | 'FLEET' | 'CREDIT' | 'WORKING_CAPITAL' | 'LOGISTICS';
  icon: React.ComponentType<any>;
  description: string;
  financialParameters: {
    capexImmediate: number;
    monthlyOpexDelta: number;
    revenueDeltaPct: number;
    debtDelta: number;
  };
  altmanZBaseline: number;
  altmanZProjected: number;
  riskCategory: 'SAFE' | 'GREY' | 'DISTRESS';
  cashFlowProjection: {
    m0: number;
    m6: number;
    m12: number;
    m24: number;
  };
  baselineCashFlow: {
    m0: number;
    m6: number;
    m12: number;
    m24: number;
  };
  aiVerdictSummary: string;
  recommendedSafeguards: string[];
}

const SECTOR_SCENARIOS_MAP: Record<string, DecisionScenario[]> = {
  manufacturing: [
    {
      id: 'mfg_hire_50_operators',
      title: 'Contratar 50 Operadores de Linha & Técnicos CNC',
      category: 'EXPANSION',
      icon: Users,
      description: 'Expansão do 2º e 3º turno da fábrica para atender carteira acumulada de pedidos OEM de autopeças.',
      financialParameters: {
        capexImmediate: 280000,
        monthlyOpexDelta: 395000,
        revenueDeltaPct: 18.2,
        debtDelta: 0
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.82,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 12120000, m6: 11500000, m12: 14100000, m24: 19400000 },
      aiVerdictSummary: 'Aumento temporário do custo fixo fabril no primeiro semestre (vale de liquidez no M6), com payback em 10 meses e aceleração de produção.',
      recommendedSafeguards: [
        'Condicionar 40% das admissões ao fechamento firme dos contratos OEM',
        'Manter estoque regulador de matéria-prima (aço/alumínio) para 45 dias',
        'Auditoria contínua de eficiência OEE > 82% no chão de fábrica'
      ]
    },
    {
      id: 'mfg_buy_robot_cells',
      title: 'Adquirir Ilha Robótica & Prensas Automatizadas (20 Células)',
      category: 'FLEET',
      icon: Layers,
      description: 'Automatização do setor de estamparia pesada com sensores IoT e telemetria preditiva de vibração.',
      financialParameters: {
        capexImmediate: 4500000,
        monthlyOpexDelta: -210000,
        revenueDeltaPct: 9.5,
        debtDelta: 11000000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.38,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 7900000, m6: 9200000, m12: 12400000, m24: 18200000 },
      aiVerdictSummary: 'Geração de expressiva economia em refugo e paradas não-programadas (OPEX -R$ 210k/mês), porém a amortização do maquinário exige disciplina de tesouraria.',
      recommendedSafeguards: [
        'Estruturar linha de financiamento BNDES Finame com carência de 12 meses',
        'Contrato SLA de assistência técnica com disponibilidade garantida de 99.5%',
        'Seguro integral contra paradas operacionais e sinistros mecânicos'
      ]
    },
    {
      id: 'mfg_take_loan_5m',
      title: 'Tomar Empréstimo BNDES / Finame Estruturado (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Captação de capital de giro de longo prazo para modernização de ferramentaria e estoques estratégicos.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 82000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.24,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 17400000, m6: 16300000, m12: 15100000, m24: 14100000 },
      aiVerdictSummary: 'Expansão imediata da liquidez de curto prazo, porém o serviço da dívida exige aplicação em projetos com TIR superior ao custo de capital.',
      recommendedSafeguards: [
        'Alocar saldo não utilizado em instrumentos com liquidez D+0 e rendimento > 100% CDI',
        'Trava contratual contra uso em pagamento de dividendos ou passivos trabalhistas',
        'Renegociação automática se o spread bancário recuar mais de 50 bps'
      ]
    },
    {
      id: 'mfg_expand_hub',
      title: 'Inaugurar Hub Avançado de Peças & Cross-Docking (Suape/PE)',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Abertura de centro de distribuição regional para fornecimento Just-in-Time a montadoras do Nordeste.',
      financialParameters: {
        capexImmediate: 3200000,
        monthlyOpexDelta: 165000,
        revenueDeltaPct: 22.0,
        debtDelta: 2200000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 3.39,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 9200000, m6: 11100000, m12: 15600000, m24: 21800000 },
      aiVerdictSummary: 'Cenário de forte expansão de margem com incentivos fiscais estaduais (PRODEPE) e redução de penalidades por atraso na entrega.',
      recommendedSafeguards: [
        'Aproveitamento integral de créditos tributários de ICMS interestadual',
        'Contrato BTS com carência de 6 meses de locação',
        'Conexão telemétrica direta ao AOS Consensus Swarm'
      ]
    },
    {
      id: 'mfg_extend_steel_terms',
      title: 'Alongar Prazos de Matéria-Prima & Siderurgia (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Renegociação com usinas e distribuidores de aço para equalizar o Ciclo Financeiro ao recebimento das montadoras.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 48000,
        revenueDeltaPct: -1.2,
        debtDelta: 0
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 3.31,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 12400000, m6: 15900000, m12: 17400000, m24: 19300000 },
      aiVerdictSummary: 'Preservação de liquidez operacional (+R$ 3.5M retidos em caixa no D+90), aliviando a dependência de antecipações bancárias caras.',
      recommendedSafeguards: [
        'Concentrar renegociação nos 15 maiores fornecedores Curva A',
        'Monitorar índice de ruptura de estoque (SLA > 98%)',
        'Oferecer programa de Risco Sacado com taxas subsidiadas'
      ]
    }
  ],
  healthcare: [
    {
      id: 'health_hire_50_nurses',
      title: 'Contratar 50 Enfermeiros Especialistas & Farmacêuticos Clínicos',
      category: 'EXPANSION',
      icon: Users,
      description: 'Abertura de 3 novas alas de UTI e ampliação do pronto-atendimento hospitalar 24 horas.',
      financialParameters: {
        capexImmediate: 320000,
        monthlyOpexDelta: 420000,
        revenueDeltaPct: 21.0,
        debtDelta: 0
      },
      altmanZBaseline: 3.10,
      altmanZProjected: 2.76,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 11800000, m6: 12600000, m12: 13800000, m24: 16200000 },
      cashFlowProjection: { m0: 11480000, m6: 10800000, m12: 13600000, m24: 18800000 },
      aiVerdictSummary: 'Expansão imediata de leitos e capacidade cirúrgica, com maturação financeira após o credenciamento de novas operadoras de saúde.',
      recommendedSafeguards: [
        'Auditoria prévia de glosas hospitalares com meta de rejeição < 1.8%',
        'Contratação escalonada atrelada à taxa de ocupação dos leitos (> 78%)',
        'Trava de horas extras com dimensionamento de escala automatizado'
      ]
    },
    {
      id: 'health_buy_ambulances',
      title: 'Comprar 20 UTIs Móveis com Telemetria e Cadeia Fria Euro-6',
      category: 'FLEET',
      icon: Truck,
      description: 'Renovação da frota de resgate e transporte de quimioterápicos com validação térmica Anvisa RDC 430.',
      financialParameters: {
        capexImmediate: 3900000,
        monthlyOpexDelta: -160000,
        revenueDeltaPct: 11.5,
        debtDelta: 9500000
      },
      altmanZBaseline: 3.10,
      altmanZProjected: 2.41,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 11800000, m6: 12600000, m12: 13800000, m24: 16200000 },
      cashFlowProjection: { m0: 7900000, m6: 9100000, m12: 12200000, m24: 17400000 },
      aiVerdictSummary: 'Redução substancial de perda térmica de medicamentos biológicos e aumento no faturamento de remoções inter-hospitalares de alta complexidade.',
      recommendedSafeguards: [
        'Monitoramento IoT contínuo da temperatura (-20°C a +8°C) em tempo real',
        'Plano de leasing operacional com manutenção preventiva inclusa',
        'Seguro de responsabilidade civil para transporte de pacientes críticos'
      ]
    },
    {
      id: 'health_take_loan_5m',
      title: 'Tomar Linha de Crédito Finep / Saúde Estruturada (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Reforço de tesouraria para absorver o ciclo de 90 a 120 dias de recebimento de convênios médicos e SUS.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 78000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.10,
      altmanZProjected: 2.30,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 11800000, m6: 12600000, m12: 13800000, m24: 16200000 },
      cashFlowProjection: { m0: 16800000, m6: 15600000, m12: 14400000, m24: 13500000 },
      aiVerdictSummary: 'Amortecimento essencial para o descasamento de liquidez de glosas e repasses hospitalares, demandando gestão ágil de contas a receber.',
      recommendedSafeguards: [
        'Vincular o crédito à antecipação seletiva de faturas de planos AAA',
        'Trava de conciliação de XMLs TISS/TUSS com o AOS Déjà Vu',
        'Manter taxa pré-fixada com spread bancário protegido'
      ]
    },
    {
      id: 'health_expand_pharma_hub',
      title: 'Centro de Distribuição Climatizado Farma & OPMs (Anvisa RDC 430)',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Hub logístico com geradores redundantes e câmara fria automatizada para distribuição de próteses e biológicos.',
      financialParameters: {
        capexImmediate: 3400000,
        monthlyOpexDelta: 175000,
        revenueDeltaPct: 25.0,
        debtDelta: 2400000
      },
      altmanZBaseline: 3.10,
      altmanZProjected: 3.35,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 11800000, m6: 12600000, m12: 13800000, m24: 16200000 },
      cashFlowProjection: { m0: 8400000, m6: 10400000, m12: 15100000, m24: 21200000 },
      aiVerdictSummary: 'Ganhos substanciais de escala em compras centralizadas de OPME e redução drástica de vencimento de medicamentos de alto custo.',
      recommendedSafeguards: [
        'Validação contínua de qualificação térmica com sensores IoT calibrados',
        'Contrato BTS com seguro de contingência elétrica 24h',
        'Integração direta com o sistema de rastreabilidade de medicamentos SNCM'
      ]
    },
    {
      id: 'health_extend_supplier_terms',
      title: 'Alongar Pagamento de Laboratórios & OPMs (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Adequação dos prazos de insumos hospitalares ao prazo médio de liquidação dos convênios de saúde.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 42000,
        revenueDeltaPct: -1.0,
        debtDelta: 0
      },
      altmanZBaseline: 3.10,
      altmanZProjected: 3.25,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 11800000, m6: 12600000, m12: 13800000, m24: 16200000 },
      cashFlowProjection: { m0: 11800000, m6: 15100000, m12: 16700000, m24: 18700000 },
      aiVerdictSummary: 'Recomposição do Capital de Giro Hospitalar com retenção de R$ 3.3M em caixa livre para investimentos assistenciais.',
      recommendedSafeguards: [
        'Garantir cumprimento rigoroso de SLAs de entrega de medicamentos de urgência',
        'Oferecer portal de antecipação voluntária aos fornecedores parceiros',
        'Auditoria periódica de estoques virtuais consignados'
      ]
    }
  ],
  retail: [
    {
      id: 'ret_hire_50_sales',
      title: 'Contratar 50 Vendedores B2B & Analistas Omnichannel',
      category: 'EXPANSION',
      icon: Users,
      description: 'Expansão da equipe comercial interna e consultores de vendas para novas praças de franquias e grandes redes.',
      financialParameters: {
        capexImmediate: 220000,
        monthlyOpexDelta: 360000,
        revenueDeltaPct: 20.5,
        debtDelta: 0
      },
      altmanZBaseline: 3.18,
      altmanZProjected: 2.85,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 13200000, m6: 14000000, m12: 15200000, m24: 17900000 },
      cashFlowProjection: { m0: 12980000, m6: 12200000, m12: 15100000, m24: 20800000 },
      aiVerdictSummary: 'Aceleração consistente do faturamento e vendas a prazo com rápido equilíbrio financeiro a partir do 7º mês.',
      recommendedSafeguards: [
        'Comissão atrelada à margem de contribuição e liquidação efetiva das faturas',
        'Regras no-code no Construct Lab para travas automáticas de crédito',
        'Revisão quinzenal da carteira de inadimplência (Overdue > 15d)'
      ]
    },
    {
      id: 'ret_buy_delivery_fleet',
      title: 'Adquirir Frota de 20 Vans Elétricas para Entrega Same-Day',
      category: 'FLEET',
      icon: Truck,
      description: 'Eletrificação da logística last-mile em capitais para corte de frete e aumento da velocidade de entrega.',
      financialParameters: {
        capexImmediate: 3600000,
        monthlyOpexDelta: -175000,
        revenueDeltaPct: 9.8,
        debtDelta: 8800000
      },
      altmanZBaseline: 3.18,
      altmanZProjected: 2.45,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 13200000, m6: 14000000, m12: 15200000, m24: 17900000 },
      cashFlowProjection: { m0: 9600000, m6: 10800000, m12: 13700000, m24: 19200000 },
      aiVerdictSummary: 'Redução drástica no custo por pacote entregue e elevação do NPS de clientes com entregas no mesmo dia.',
      recommendedSafeguards: [
        'Instalação de estações de recarga rápida nas docas de sorting',
        'Monitoramento telemétrico de rotas urbanas e velocidade',
        'Financiamento atrelado a metas sustentáveis ESG com desconto em juros'
      ]
    },
    {
      id: 'ret_take_loan_5m',
      title: 'Linha de Crédito para Antecipação de Recebíveis (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Estruturação de linha rotativa para suportar picos sazonais (Black Friday, Dia das Mães e Natal).',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 89000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.18,
      altmanZProjected: 2.29,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 13200000, m6: 14000000, m12: 15200000, m24: 17900000 },
      cashFlowProjection: { m0: 18200000, m6: 17100000, m12: 15800000, m24: 14600000 },
      aiVerdictSummary: 'Garante fôlego no capital de giro durante a montagem de estoques sazonais, exigindo giro rápido de mercadorias.',
      recommendedSafeguards: [
        'Trava de liquidação automática no encerramento de cada campanha sazonal',
        'Controle de margem mínima líquida após incidência dos juros da linha',
        'Auditoria diária de conciliação de adquirentes e cartões'
      ]
    },
    {
      id: 'ret_expand_fulfillment_hub',
      title: 'Expansão de Hub Fulfillment Automatizado de Alta Velocidade',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Centro de distribuição com esteiras inteligentes e separação robotizada para integrar e-commerce e lojas.',
      financialParameters: {
        capexImmediate: 3800000,
        monthlyOpexDelta: 185000,
        revenueDeltaPct: 26.5,
        debtDelta: 2600000
      },
      altmanZBaseline: 3.18,
      altmanZProjected: 3.48,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 13200000, m6: 14000000, m12: 15200000, m24: 17900000 },
      cashFlowProjection: { m0: 9400000, m6: 11800000, m12: 16900000, m24: 23600000 },
      aiVerdictSummary: 'Aumento expressivo na capacidade de expedição diária de pedidos (+35.000 pacotes/dia) e diluição de custo fixo.',
      recommendedSafeguards: [
        'Aproveitamento de benefícios fiscais interestaduais de e-commerce',
        'Contratos de locação com flexibilidade para expansão modular',
        'Integração em tempo real de estoques entre lojas físicas e e-commerce'
      ]
    },
    {
      id: 'ret_extend_vendor_terms',
      title: 'Alongar Prazos de Indústria & Fornecedores Curva A (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Estender o prazo de pagamento de revenda, financiando o estoque com o capital dos próprios fabricantes.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 52000,
        revenueDeltaPct: -1.4,
        debtDelta: 0
      },
      altmanZBaseline: 3.18,
      altmanZProjected: 3.36,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 13200000, m6: 14000000, m12: 15200000, m24: 17900000 },
      cashFlowProjection: { m0: 13200000, m6: 16900000, m12: 18400000, m24: 20400000 },
      aiVerdictSummary: 'Alívio substancial na necessidade de capital de giro com retenção de R$ 3.7M em caixa livre.',
      recommendedSafeguards: [
        'Manter acordos de bonificação comercial (rebates) ativos',
        'Monitorar taxa de giro de estoque (mínimo 6 giros anuais)',
        'Garantir reposição rápida em itens de alto giro (Curva A)'
      ]
    }
  ],
  services: [
    {
      id: 'srv_hire_50_consultants',
      title: 'Contratar 50 Consultores Seniores & Engenheiros AI',
      category: 'EXPANSION',
      icon: Users,
      description: 'Formação de squads dedicados a novos contratos corporativos Enterprise de transformação digital e compliance.',
      financialParameters: {
        capexImmediate: 200000,
        monthlyOpexDelta: 450000,
        revenueDeltaPct: 23.0,
        debtDelta: 0
      },
      altmanZBaseline: 3.25,
      altmanZProjected: 2.88,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 10500000, m6: 11200000, m12: 12300000, m24: 14800000 },
      cashFlowProjection: { m0: 10300000, m6: 9800000, m12: 12500000, m24: 17500000 },
      aiVerdictSummary: 'Geração de receita de alto valor agregado com margem bruta superior a 42%, absorvendo o ramp-up de onboarding em 8 meses.',
      recommendedSafeguards: [
        'Alocação mínima de 80% do time em projetos faturáveis (billable rate)',
        'Contratos com cláusula de retenção e SLA de entrega contínua',
        'Monitoramento de turnover e banco de talentos qualificado'
      ]
    },
    {
      id: 'srv_buy_cloud_infra',
      title: 'Aquisição de Clusters GPU & Infraestrutura Privada de Servidores',
      category: 'FLEET',
      icon: Zap,
      description: 'Substituição de instâncias de nuvem pública por hardware proprietário de alta performance amortizado em 3 anos.',
      financialParameters: {
        capexImmediate: 2900000,
        monthlyOpexDelta: -140000,
        revenueDeltaPct: 7.5,
        debtDelta: 6500000
      },
      altmanZBaseline: 3.25,
      altmanZProjected: 2.58,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 10500000, m6: 11200000, m12: 12300000, m24: 14800000 },
      cashFlowProjection: { m0: 7600000, m6: 8700000, m12: 11200000, m24: 15600000 },
      aiVerdictSummary: 'Corte definitivo no custo mensal de nuvem (OPEX reduzido em R$ 140k/mês) com controle total de segurança de dados.',
      recommendedSafeguards: [
        'Certificação Tier III do datacenter de co-location',
        'Contrato de redundância e disaster recovery ativo',
        'Seguro cibernético contra indisponibilidade de infraestrutura'
      ]
    },
    {
      id: 'srv_take_loan_5m',
      title: 'Financiamento Finep de Inovação & P&D de Software (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Captação de recursos com taxas subsidiadas para desenvolvimento de propriedade intelectual proprietária.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 72000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.25,
      altmanZProjected: 2.40,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 10500000, m6: 11200000, m12: 12300000, m24: 14800000 },
      cashFlowProjection: { m0: 15500000, m6: 14400000, m12: 13300000, m24: 12400000 },
      aiVerdictSummary: 'Acelera o ciclo de lançamento de produtos proprietários, reduzindo a dependência de serviços manuais com ganhos de escala.',
      recommendedSafeguards: [
        'Registro de patentes e marcas nos órgãos competentes',
        'Acompanhamento rigoroso dos marcos de entrega exigidos pelo edital',
        'Gestão de capital de giro sem desvio de finalidade'
      ]
    },
    {
      id: 'srv_expand_regional_hub',
      title: 'Abertura de Filial Regional & Centro de Excelência (Sul/Sudeste)',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Implantação de escritório estratégico para atendimento presencial e suporte a contas Enterprise.',
      financialParameters: {
        capexImmediate: 2100000,
        monthlyOpexDelta: 130000,
        revenueDeltaPct: 18.5,
        debtDelta: 1500000
      },
      altmanZBaseline: 3.25,
      altmanZProjected: 3.44,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 10500000, m6: 11200000, m12: 12300000, m24: 14800000 },
      cashFlowProjection: { m0: 8400000, m6: 9900000, m12: 13600000, m24: 18800000 },
      aiVerdictSummary: 'Consolidação de presença regional com aumento no fechamento de contratos de longo prazo (LTV alto e baixo churn).',
      recommendedSafeguards: [
        'Contrato flexível de espaço corporativo com cláusula de rescisão reduzida',
        'Metas claras de receita para a nova unidade no D+180',
        'Alinhamento cultural e de governança com a matriz'
      ]
    },
    {
      id: 'srv_extend_partner_terms',
      title: 'Alongar Prazos de Licenças & Subcontratados (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Equalizar o repasse a parceiros de tecnologia e terceirizados ao prazo de pagamento dos clientes.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 35000,
        revenueDeltaPct: -0.8,
        debtDelta: 0
      },
      altmanZBaseline: 3.25,
      altmanZProjected: 3.40,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 10500000, m6: 11200000, m12: 12300000, m24: 14800000 },
      cashFlowProjection: { m0: 10500000, m6: 13400000, m12: 14700000, m24: 16500000 },
      aiVerdictSummary: 'Reorganização do fluxo de caixa com eliminação do descasamento financeiro de contratos corporativos.',
      recommendedSafeguards: [
        'Alinhamento contratual no momento da assinatura do projeto principal',
        'Manutenção de relacionamento transparente com parceiros-chave',
        'Monitoramento de SLA dos terceiros homologados'
      ]
    }
  ],
  agribusiness: [
    {
      id: 'agri_hire_50_field_techs',
      title: 'Contratar 50 Agrônomos & Operadores de Colheitadeiras RTK',
      category: 'EXPANSION',
      icon: Users,
      description: 'Expansão da equipe técnica de campo para safra de grãos e manejo integrado em 45.000 hectares.',
      financialParameters: {
        capexImmediate: 310000,
        monthlyOpexDelta: 410000,
        revenueDeltaPct: 22.5,
        debtDelta: 0
      },
      altmanZBaseline: 3.05,
      altmanZProjected: 2.72,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 14500000, m6: 15200000, m12: 16800000, m24: 19500000 },
      cashFlowProjection: { m0: 14190000, m6: 13300000, m12: 16700000, m24: 22800000 },
      aiVerdictSummary: 'Aumento substancial da produtividade por hectare (sacas/ha) e redução de perdas na colheita mecanizada.',
      recommendedSafeguards: [
        'Contratação com bonificação atrelada ao rendimento da colheita',
        'Treinamento operacional obrigatório em pilotagem de precisão',
        'Hedge cambial e de commodities contra volatilidade de preços internacionais'
      ]
    },
    {
      id: 'agri_buy_harvesters',
      title: 'Aquisição de 10 Colheitadeiras com Telemetria Satelital Integrada',
      category: 'FLEET',
      icon: Truck,
      description: 'Modernização do maquinário agrícola pesado com sensores de umidade e consumo inteligente de diesel.',
      financialParameters: {
        capexImmediate: 5200000,
        monthlyOpexDelta: -230000,
        revenueDeltaPct: 12.0,
        debtDelta: 12500000
      },
      altmanZBaseline: 3.05,
      altmanZProjected: 2.32,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 14500000, m6: 15200000, m12: 16800000, m24: 19500000 },
      cashFlowProjection: { m0: 9300000, m6: 10600000, m12: 14300000, m24: 21100000 },
      aiVerdictSummary: 'Queda de 18% no consumo de combustível e diminuição das perdas de grãos na plataforma, com amortização alinhada às safras.',
      recommendedSafeguards: [
        'Financiamento Moderfrota com carência e pagamento semestral pós-safra',
        'Seguro agrícola completo contra sinistros climáticos e quebra de máquina',
        'Manutenção preventiva telemétrica CAN-Bus antes do início do plantio'
      ]
    },
    {
      id: 'agri_take_loan_cpr',
      title: 'Emissão de Cédula de Produto Rural (CPR Financeira - R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Captação no mercado de capitais para travamento de custos de fertilizantes, sementes e defensivos.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 85000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.05,
      altmanZProjected: 2.22,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 14500000, m6: 15200000, m12: 16800000, m24: 19500000 },
      cashFlowProjection: { m0: 19500000, m6: 18200000, m12: 16900000, m24: 15500000 },
      aiVerdictSummary: 'Garante compras antecipadas de insumos com desconto comercial de até 15%, protegendo a margem contra oscilações do dólar.',
      recommendedSafeguards: [
        'Realização simultânea de hedge na B3/CBOT para trava de preço da safra',
        'Garantia de penhor agrícola auditada por satélite',
        'Auditoria contínua do fluxo de caixa da propriedade'
      ]
    },
    {
      id: 'agri_expand_silo',
      title: 'Construção de Silo Graneleiro Próprio & Transbordo Ferroviário',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Capacidade estática de armazenagem de 50.000 toneladas para evitar fretes spot punitivos no pico de safra.',
      financialParameters: {
        capexImmediate: 4600000,
        monthlyOpexDelta: 195000,
        revenueDeltaPct: 28.0,
        debtDelta: 3500000
      },
      altmanZBaseline: 3.05,
      altmanZProjected: 3.42,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 14500000, m6: 15200000, m12: 16800000, m24: 19500000 },
      cashFlowProjection: { m0: 9900000, m6: 12400000, m12: 18100000, m24: 25800000 },
      aiVerdictSummary: 'Eliminação da vulnerabilidade de escoamento e possibilidade de estocar produção para venda na entressafra com ágio de mercado.',
      recommendedSafeguards: [
        'Controle automatizado de aeração e termometria do silo',
        'Licenciamento ambiental e seguro patrimonial das instalações',
        'Contratos de frete ferroviário dedicados com antecedência'
      ]
    },
    {
      id: 'agri_extend_barter_terms',
      title: 'Renegociar Contratos de Barter & Defensivos (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Alongamento de vencimentos de insumos para liquidação na data exata do recebimento da safra (D+0).',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 55000,
        revenueDeltaPct: -1.6,
        debtDelta: 0
      },
      altmanZBaseline: 3.05,
      altmanZProjected: 3.22,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 14500000, m6: 15200000, m12: 16800000, m24: 19500000 },
      cashFlowProjection: { m0: 14500000, m6: 18200000, m12: 20100000, m24: 22600000 },
      aiVerdictSummary: 'Equalização perfeita entre o ciclo biológico da cultura e o fluxo financeiro de desembolso de caixa.',
      recommendedSafeguards: [
        'Fixação de paridade de troca (sacas por tonelada de insumo)',
        'Monitoramento agronômico da área vinculada ao barter',
        'Registro de alienação fiduciária em cartório competente'
      ]
    }
  ],
  logistics: [
    {
      id: 'log_hire_50_drivers',
      title: 'Contratar 50 Motoristas Mopp & Operadores de Empilhadeiras',
      category: 'EXPANSION',
      icon: Users,
      description: 'Absorção de novas linhas dedicadas para transporte de produtos químicos e fármacos refrigerados.',
      financialParameters: {
        capexImmediate: 260000,
        monthlyOpexDelta: 390000,
        revenueDeltaPct: 19.5,
        debtDelta: 0
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.79,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 12140000, m6: 11450000, m12: 14000000, m24: 19100000 },
      aiVerdictSummary: 'Aumento da capacidade de tração e cumprimento de SLAs contratuais rigorosos com margem preservada.',
      recommendedSafeguards: [
        'Treinamento em direção defensiva e certificação Mopp atualizada',
        'Controle de jornada telemétrico em conformidade com a Lei do Motorista',
        'Bônus atrelado à economia de combustível e ausência de sinistros'
      ]
    },
    {
      id: 'log_buy_electric_fleet',
      title: 'Comprar 20 Cavalos Mecânicos Euro-6 com Telemetria Integrada',
      category: 'FLEET',
      icon: Truck,
      description: 'Renovação da frota pesada para redução de consumo de diesel e pedágios automáticos em corredores logísticos.',
      financialParameters: {
        capexImmediate: 4200000,
        monthlyOpexDelta: -190000,
        revenueDeltaPct: 8.2,
        debtDelta: 10300000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.35,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 8200000, m6: 9400000, m12: 12100000, m24: 17500000 },
      aiVerdictSummary: 'Economia operacional líquida considerável de combustível com pressão na cobertura de juros a curto prazo.',
      recommendedSafeguards: [
        'Financiamento via Finame BNDES com taxa pré-fixada',
        'Desmobilização de caminhões antigos nos primeiros 60 dias',
        'Monitoramento 24h via GPS & Telemetria do AOS'
      ]
    },
    {
      id: 'log_take_loan_5m',
      title: 'Tomar Empréstimo de Capital de Giro BNDES (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Suporte de tesouraria para adiantamentos de frete e diesel contra recebíveis de grandes embarcadores.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 85000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 2.21,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 17400000, m6: 16200000, m12: 14900000, m24: 13800000 },
      aiVerdictSummary: 'Aumento imediato de liquidez preventiva para absorver prazos longos de pagamento de frete.',
      recommendedSafeguards: [
        'Aplicação de saldos em CDI D+0',
        'Trava de conciliação de CT-e com o ERP TMS',
        'Cobrança autônoma de overstay em docas'
      ]
    },
    {
      id: 'log_expand_hub',
      title: 'Expansão de Centro de Distribuição Nordeste (Suape/PE)',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Abertura de hub logístico com cross-docking refrigerado de 10.000 m² para atender Norte/Nordeste com SLA D+1.',
      financialParameters: {
        capexImmediate: 3100000,
        monthlyOpexDelta: 160000,
        revenueDeltaPct: 24.0,
        debtDelta: 2000000
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 3.42,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 9300000, m6: 11200000, m12: 15900000, m24: 22400000 },
      aiVerdictSummary: 'Cenário altamente favorável com aceleração de faturamento e ganhos fiscais estaduais.',
      recommendedSafeguards: [
        'Aproveitamento de crédito de ICMS na entrada do ativo',
        'Contrato BTS com carência mínima de 90 dias',
        'Conexão instantânea do galpão ao Enxame de Agentes'
      ]
    },
    {
      id: 'log_extend_fuel_terms',
      title: 'Alongar Prazo de Fornecedores de Combustível & Pneus (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Renegociação com distribuidoras de diesel e recapadoras para estender o ciclo financeiro.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 45000,
        revenueDeltaPct: -1.5,
        debtDelta: 0
      },
      altmanZBaseline: 3.14,
      altmanZProjected: 3.28,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 12400000, m6: 13100000, m12: 14200000, m24: 16800000 },
      cashFlowProjection: { m0: 12400000, m6: 15800000, m12: 17200000, m24: 19100000 },
      aiVerdictSummary: 'Melhora imediata no Capital de Giro Líquido (+R$ 3.4M retidos em caixa no D+90).',
      recommendedSafeguards: [
        'Limitar o alongamento aos maiores fornecedores homologados',
        'Monitorar índice de abastecimento e SLA dos postos parceiros',
        'Oferecer programa de risco sacado'
      ]
    }
  ],
  construction: [
    {
      id: 'const_hire_50_engineers',
      title: 'Contratar 50 Engenheiros de Obra & Mestres de Estruturas',
      category: 'EXPANSION',
      icon: Users,
      description: 'Mobilização de frentes simultâneas de trabalho para 4 novos empreendimentos de infraestrutura pesada.',
      financialParameters: {
        capexImmediate: 290000,
        monthlyOpexDelta: 430000,
        revenueDeltaPct: 24.0,
        debtDelta: 0
      },
      altmanZBaseline: 2.98,
      altmanZProjected: 2.65,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 15800000, m6: 16400000, m12: 17900000, m24: 21500000 },
      cashFlowProjection: { m0: 15510000, m6: 14200000, m12: 17800000, m24: 24600000 },
      aiVerdictSummary: 'Garante execução dentro do cronograma físico-financeiro com liberação ágil das medições de obra.',
      recommendedSafeguards: [
        'Vincular pagamentos de subempreiteiros às medições validadas pelo cliente',
        'Controle diário de segurança do trabalho (Zero Acidentes / NR-18)',
        'Monitoramento de avanço físico via imagens de satélite e drones'
      ]
    },
    {
      id: 'const_buy_heavy_equipment',
      title: 'Aquisição de Escavadeiras Hidráulicas & Guindastes Pesados',
      category: 'FLEET',
      icon: HardHat,
      description: 'Substituição de maquinário locado por frota própria com redução expressiva do custo unitário por metro cúbico.',
      financialParameters: {
        capexImmediate: 5800000,
        monthlyOpexDelta: -260000,
        revenueDeltaPct: 10.5,
        debtDelta: 13000000
      },
      altmanZBaseline: 2.98,
      altmanZProjected: 2.25,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 15800000, m6: 16400000, m12: 17900000, m24: 21500000 },
      cashFlowProjection: { m0: 10000000, m6: 11400000, m12: 15200000, m24: 22800000 },
      aiVerdictSummary: 'Redução expressiva do custo de locação de terceiros, exigindo alta taxa de ocupação dos equipamentos.',
      recommendedSafeguards: [
        'Financiamento com carência de 18 meses durante a fase inicial das obras',
        'Telemetria de horímetro para controle rigoroso de manutenção',
        'Seguro de riscos de engenharia e máquinas pesadas'
      ]
    },
    {
      id: 'const_take_loan_5m',
      title: 'Financiamento à Produção / Plano Empresário (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Crédito estruturado para assegurar compra antecipada de aço, cimento e pré-moldados.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 88000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 2.98,
      altmanZProjected: 2.15,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 15800000, m6: 16400000, m12: 17900000, m24: 21500000 },
      cashFlowProjection: { m0: 20800000, m6: 19400000, m12: 18100000, m24: 16600000 },
      aiVerdictSummary: 'Evita atrasos no canteiro de obras causados por falta de liquidez entre os ciclos de medição e repasse.',
      recommendedSafeguards: [
        'Conta vinculada e patrimônio de afetação em cada canteiro',
        'Auditoria independente de engenharia a cada medição',
        'Travamento de preços com fornecedores na assinatura do crédito'
      ]
    },
    {
      id: 'const_expand_concrete_plant',
      title: 'Central de Usinagem de Concreto & Pré-Moldados Própria',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Verticalização da produção de concreto usinado para garantia de entrega e redução de desperdício.',
      financialParameters: {
        capexImmediate: 4100000,
        monthlyOpexDelta: 170000,
        revenueDeltaPct: 26.0,
        debtDelta: 2800000
      },
      altmanZBaseline: 2.98,
      altmanZProjected: 3.32,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 15800000, m6: 16400000, m12: 17900000, m24: 21500000 },
      cashFlowProjection: { m0: 11700000, m6: 13900000, m12: 19300000, m24: 27200000 },
      aiVerdictSummary: 'Controle total da qualidade e cronograma da estrutura com ganho de margem de 8% sobre a obra civil.',
      recommendedSafeguards: [
        'Laboratório interno de controle de cura e resistência (MPa)',
        'Contrato de fornecimento contínuo de agregados e cimento a granel',
        'Reaproveitamento de água e resíduos da usina'
      ]
    },
    {
      id: 'const_extend_materials_terms',
      title: 'Alongar Prazos de Fornecedores de Cimento e Aço (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Adequação dos vencimentos de materiais pesados ao cronograma de desembolso das medições.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 60000,
        revenueDeltaPct: -1.8,
        debtDelta: 0
      },
      altmanZBaseline: 2.98,
      altmanZProjected: 3.18,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 15800000, m6: 16400000, m12: 17900000, m24: 21500000 },
      cashFlowProjection: { m0: 15800000, m6: 19600000, m12: 21800000, m24: 24500000 },
      aiVerdictSummary: 'Reorganização do Capital de Giro com retenção de R$ 3.8M em caixa livre para o canteiro de obras.',
      recommendedSafeguards: [
        'Garantir cumprimento rigoroso dos cronogramas de entrega',
        'Proteção de preços contra reajustes do IGP-M / INCC',
        'Homologação de múltiplos distribuidores siderúrgicos'
      ]
    }
  ],
  energy: [
    {
      id: 'nrg_hire_50_engineers',
      title: 'Contratar 50 Eletrotécnicos de Alta Tensão & Analistas de PPA',
      category: 'EXPANSION',
      icon: Users,
      description: 'Expansão das equipes de operação e manutenção (O&M) para novos parques solares e eólicos.',
      financialParameters: {
        capexImmediate: 300000,
        monthlyOpexDelta: 440000,
        revenueDeltaPct: 25.0,
        debtDelta: 0
      },
      altmanZBaseline: 3.30,
      altmanZProjected: 2.95,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 16200000, m6: 17100000, m12: 18900000, m24: 22600000 },
      cashFlowProjection: { m0: 15900000, m6: 15100000, m12: 19200000, m24: 26400000 },
      aiVerdictSummary: 'Garante disponibilidade de geração superior a 98.8% e cumprimento das metas de despacho no Mercado Livre.',
      recommendedSafeguards: [
        'Certificação de segurança NR-10 e NR-35 para trabalho em altura',
        'Contratos PPA de longo prazo com cláusula take-or-pay',
        'Monitoramento preditivo de inversores e turbinas'
      ]
    },
    {
      id: 'nrg_buy_bess_batteries',
      title: 'Aquisição de Transformadores de Alta Tensão & Baterias BESS',
      category: 'FLEET',
      icon: Zap,
      description: 'Implantação de sistema de armazenamento de energia em baterias de lítio para arbitragem de ponta.',
      financialParameters: {
        capexImmediate: 6200000,
        monthlyOpexDelta: -280000,
        revenueDeltaPct: 14.0,
        debtDelta: 14000000
      },
      altmanZBaseline: 3.30,
      altmanZProjected: 2.60,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 16200000, m6: 17100000, m12: 18900000, m24: 22600000 },
      cashFlowProjection: { m0: 10000000, m6: 11800000, m12: 16200000, m24: 24200000 },
      aiVerdictSummary: 'Capacidade de comercializar energia nos horários de pico (PLD elevado), gerando receita adicional consistente.',
      recommendedSafeguards: [
        'Garantia de retenção de carga de baterias por 10 anos',
        'Financiamento via debêntures verdes incentivadas',
        'Sistema automatizado de controle de temperatura e supressão de incêndio'
      ]
    },
    {
      id: 'nrg_take_loan_debentures',
      title: 'Emissão de Debêntures Incentivadas de Infraestrutura (R$ 5.000.000)',
      category: 'CREDIT',
      icon: DollarSign,
      description: 'Captação de recursos isentos de IR para implantação de linhas de transmissão e conexão à subestação.',
      financialParameters: {
        capexImmediate: -5000000,
        monthlyOpexDelta: 75000,
        revenueDeltaPct: 0,
        debtDelta: 5000000
      },
      altmanZBaseline: 3.30,
      altmanZProjected: 2.50,
      riskCategory: 'GREY',
      baselineCashFlow: { m0: 16200000, m6: 17100000, m12: 18900000, m24: 22600000 },
      cashFlowProjection: { m0: 21200000, m6: 20100000, m12: 19100000, m24: 18000000 },
      aiVerdictSummary: 'Custo de captação vantajoso (IPCA + spread moderado) com amortização de longo prazo conectada à receita contratada.',
      recommendedSafeguards: [
        'Auditoria contínua de compliance ambiental e licenças Aneel',
        'Trava de receita em conta reserva de serviço da dívida',
        'Manutenção de rating corporativo A+'
      ]
    },
    {
      id: 'nrg_expand_smart_grid_hub',
      title: 'Centro de Operação de Geração (CCO) 24h & Smart Grid SCADA',
      category: 'LOGISTICS',
      icon: Building2,
      description: 'Hub centralizado de despacho com telemetria SCADA em tempo real e inteligência artificial preditiva.',
      financialParameters: {
        capexImmediate: 3700000,
        monthlyOpexDelta: 155000,
        revenueDeltaPct: 22.0,
        debtDelta: 2100000
      },
      altmanZBaseline: 3.30,
      altmanZProjected: 3.55,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 16200000, m6: 17100000, m12: 18900000, m24: 22600000 },
      cashFlowProjection: { m0: 12500000, m6: 14800000, m12: 20400000, m24: 28500000 },
      aiVerdictSummary: 'Otimização autônoma do despacho de energia e mitigação de penalidades por corte de geração (curtailment).',
      recommendedSafeguards: [
        'Conectividade satelital redundante e link de fibra ótica dedicado',
        'Proteção cibernética contra ataques a infraestruturas críticas (OT/ICS)',
        'Integração direta com o ONS e CCEE'
      ]
    },
    {
      id: 'nrg_extend_om_terms',
      title: 'Alongamento de Contratos O&M & Suprimentos Elétricos (D+30 ➔ D+90)',
      category: 'WORKING_CAPITAL',
      icon: Sliders,
      description: 'Reescalonamento de pagamentos para balanceamento perfeito com o ciclo de liquidação financeira da CCEE.',
      financialParameters: {
        capexImmediate: 0,
        monthlyOpexDelta: 48000,
        revenueDeltaPct: -1.0,
        debtDelta: 0
      },
      altmanZBaseline: 3.30,
      altmanZProjected: 3.46,
      riskCategory: 'SAFE',
      baselineCashFlow: { m0: 16200000, m6: 17100000, m12: 18900000, m24: 22600000 },
      cashFlowProjection: { m0: 16200000, m6: 19800000, m12: 22100000, m24: 25100000 },
      aiVerdictSummary: 'Reorganização do Capital de Giro com retenção de R$ 3.6M em caixa livre sem comprometer os SLAs de manutenção.',
      recommendedSafeguards: [
        'Exigência de tempo de resposta < 2h para contingências em campo',
        'Contratos com bônus de performance atrelado ao fator de capacidade',
        'Auditoria periódica do inventário de sobressalentes'
      ]
    }
  ]
};

const SECTORS_LIST = [
  { key: 'manufacturing', name: 'Manufatura & Indústria', icon: Layers },
  { key: 'healthcare', name: 'Saúde & Farma', icon: HeartPulse },
  { key: 'retail', name: 'Varejo & E-commerce', icon: ShoppingBag },
  { key: 'services', name: 'Serviços & Tecnologia', icon: Briefcase },
  { key: 'agribusiness', name: 'Agronegócio', icon: Wheat },
  { key: 'logistics', name: 'Transporte & Logística', icon: Truck },
  { key: 'construction', name: 'Construção Pesada', icon: HardHat },
  { key: 'energy', name: 'Energia & Infra', icon: Zap }
];

interface CounterfactualOraclePanelProps {
  tenantProfile: TenantProfile;
  currency?: SupportedCurrency;
  fiscalJurisdiction?: FiscalJurisdiction;
  onAddAuditRecord?: (record: any) => void;
}

interface TeslaMacroShock {
  id: string;
  title: string;
  category: 'INTEREST_RATES' | 'CLIENT_DEFAULT' | 'CURRENCY_SPIKE' | 'BLACK_SWAN';
  icon: React.ComponentType<any>;
  description: string;
  shockParameter: string;
  altmanZPostShock: number;
  cashRunwayMonthsPostShock: number;
  firstBreakPoint: {
    component: string;
    timeline: string;
    severity: 'CRITICAL' | 'HIGH';
    financialLoss: string;
    detailedCause: string;
  };
  structuralBreakSequence: Array<{
    step: number;
    timeline: string;
    entity: string;
    impact: string;
    status: 'BROKEN' | 'AT_RISK' | 'RESILIENT';
  }>;
  autonomousCountermeasures: string[];
}

const SECTOR_TESLA_STRESS_SHOCKS_MAP: Record<string, TeslaMacroShock[]> = {
  manufacturing: [
    {
      id: 'mfg_shock_interest_rate',
      title: 'Choque de Juros Agressivo (+450 bps / Selic 15.5% a.a.)',
      category: 'INTEREST_RATES',
      icon: TrendingUp,
      description: 'Aperto monetário violento do BACEN elevando custo da dívida pós-fixada e spreads bancários.',
      shockParameter: 'CDI +4.5% a.a. em 90 dias',
      altmanZPostShock: 1.42,
      cashRunwayMonthsPostShock: 4.8,
      firstBreakPoint: {
        component: 'Despesa Financeira Líquida & Covenants de Dívida',
        timeline: 'Mês +4',
        severity: 'CRITICAL',
        financialLoss: '-R$ 4.200.000 / ano',
        detailedCause: 'O Índice de Cobertura de Juros (ICJ) desaba de 3.4x para 0.78x. O serviço da dívida passa a consumir 84% de todo o EBITDA operacional gerado.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +2', entity: 'Capital de Giro Líquido', impact: 'Linhas de crédito rotativas (CDI+3%) atingem teto de contratação', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +4', entity: 'Serviço da Dívida', impact: 'EBITDA insuficiente para cobrir amortização + juros de debêntures', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +6', entity: 'Covenants Bancários', impact: 'Exigência de liquidação antecipada de dívida estruturada de R$ 15M', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +9', entity: 'Capex de Expansão', impact: 'Congelamento compulsório de novos maquinários e contratações', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Alongamento forçado de D+30 para D+90 via Risco Sacado subsidiado',
        'Trava automática de novos financiamentos indexados ao CDI',
        'Hedge swap pré/pós fixado disparado pelo Swarm do AOS'
      ]
    },
    {
      id: 'mfg_shock_client_default',
      title: 'Default / Inadimplência Crítica de Montadora OEM Âncora (D+90)',
      category: 'CLIENT_DEFAULT',
      icon: AlertTriangle,
      description: 'Congelamento de pagamentos ou recuperação judicial do cliente âncora (responsável por 38% da receita fabril).',
      shockParameter: 'Retenção de R$ 6.800.000 em duplicatas',
      altmanZPostShock: 1.18,
      cashRunwayMonthsPostShock: 1.9,
      firstBreakPoint: {
        component: 'Runway de Tesouraria & Folha de Pagamento Fabril',
        timeline: 'D+32 (Mês 1)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 6.800.000 retidos',
        detailedCause: 'O Prazo Médio de Recebimento (PMR) salta de 42 para 138 dias. O caixa livre zera no dia 32 caso não haja cessão fiduciária imediata.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Conciliação de Recebíveis', impact: 'Divergência de liquidação no ERP Protheus/SAP sem entrada de D+0', status: 'BROKEN' },
        { step: 2, timeline: 'D+32', entity: 'Folha de Pagamento & Encargos', impact: 'Saldo bancário líquido insuficiente para liquidar D+5 da folha da fábrica', status: 'BROKEN' },
        { step: 3, timeline: 'D+45', entity: 'Fornecedores Curva A (Aço & Polímeros)', impact: 'Atraso em compras de insumos essenciais gerando risco de paralisação', status: 'AT_RISK' },
        { step: 4, timeline: 'D+60', entity: 'Patrimônio Líquido', impact: 'Provisão compulsória de PDD (Perdas com Devedores Duvidosos)', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Execução de seguro de crédito e acionamento de garantias reais',
        'Redirecionamento autônomo da capacidade produtiva para clientes secundários',
        'Ativação de linha de antecipação pré-aprovada com quórum Multi-Sig'
      ]
    },
    {
      id: 'mfg_shock_currency_spike',
      title: 'Disparada Cambial Extrema (+28% USD/BRL a R$ 6.85)',
      category: 'CURRENCY_SPIKE',
      icon: DollarSign,
      description: 'Desvalorização cambial súbita por turbulência externa, inflacionando a Bill of Materials (BOM) de insumos importados.',
      shockParameter: 'Dólar de R$ 5.35 para R$ 6.85 em 45 dias',
      altmanZPostShock: 1.65,
      cashRunwayMonthsPostShock: 6.2,
      firstBreakPoint: {
        component: 'Margem Bruta Industrial (BOM & Matéria-Prima)',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 3.650.000 na margem anual',
        detailedCause: 'Insumos importados representam 42% do CPV. A margem bruta cai de 32.5% para 11.2% antes de qualquer repasse comercial à ponta consumidora.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Desembaraço Aduaneiro & DI', impact: 'Variação cambial na emissão da NF de importação gera sangria de ICMS', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Margem de Contribuição', impact: 'Linha de produtos principais passa a operar com margem unitária negativa', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Necessidade de Capital de Giro', impact: 'Necessidade de +R$ 5.2M para repor o mesmo volume de estoque de insumos', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +6', entity: 'Repasse a Clientes', impact: 'Renegociação de tabelas de preço com montadoras sofre resistência e cancelamentos', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Hedge cambial sintético automático (NDF / Futuros B3) disparado pelo AOS',
        'Homologação expressa de fornecedores nacionais substitutos no grafo',
        'Reajuste dinâmico de preços atrelado à cotação spot em contratos B2B'
      ]
    },
    {
      id: 'mfg_shock_black_swan',
      title: 'Choque Combinado "Black Swan" (Juros + Aço + Default OEM)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Combinação catastrófica de estresse macroeconômico e ruptura simultânea da cadeia de clientes e suprimentos industriais.',
      shockParameter: 'Juros 16% + Dólar R$ 7.00 + R$ 9.5M Default',
      altmanZPostShock: 0.82,
      cashRunwayMonthsPostShock: 1.1,
      firstBreakPoint: {
        component: 'Solvência Global & Continuidade da Planta Fabril',
        timeline: 'D+42 (Mês 1.5)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 11.400.000 / Colapso',
        detailedCause: 'Exaustão simultânea de liquidez imediata, linhas de crédito bancárias e colapso de margem. Sem protocolo de emergência, a indústria entra em insolvência técnica.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Geração de Caixa Operacional', impact: 'Fluxo diário inverte para queima líquida de R$ 180k/dia', status: 'BROKEN' },
        { step: 2, timeline: 'D+30', entity: 'Limites Bancários', impact: 'Bancos travam concessão de novos créditos industriais devido a rating C', status: 'BROKEN' },
        { step: 3, timeline: 'D+42', entity: 'Ponto de Ruptura Primário', impact: 'Incapacidade de honrar simultaneamente fornecedores e tesouraria', status: 'BROKEN' },
        { step: 4, timeline: 'D+60', entity: 'Estrutura Societária', impact: 'Necessidade de aporte de capital pelos sócios ou recuperação judicial', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Acionamento do Protocolo C-Level Panic Lockdown (Trava de saídas > R$ 10k)',
        'Moratória negociada automática de 60 dias com credores financeiros via Multi-Sig',
        'Isolamento de caixa operacional protegido pelo mecanismo de invariantes do AOS'
      ]
    }
  ],
  healthcare: [
    {
      id: 'hc_shock_tiss_denial',
      title: 'Glosa em Massa e Alongamento de Operadoras (D+60 ➔ D+150)',
      category: 'CLIENT_DEFAULT',
      icon: AlertTriangle,
      description: 'Retenção severa de repasses de convênios de saúde e planos corporativos com pico de glosas administrativas.',
      shockParameter: 'Retenção de R$ 5.400.000 em guias TISS',
      altmanZPostShock: 1.28,
      cashRunwayMonthsPostShock: 2.1,
      firstBreakPoint: {
        component: 'Ciclo de Liquidez Hospitalar & Compras de OPME',
        timeline: 'D+45 (Mês 1.5)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 5.400.000 retidos em glosas',
        detailedCause: 'O Prazo Médio de Recebimento de convênios salta de 60 para 150 dias. O hospital esgota o caixa livre para compras de próteses, órteses e materiais especiais cirúrgicos.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Faturamento TISS/TUSS', impact: 'Índice de glosa inicial atinge 28.5% por divergência cadastral de planos', status: 'BROKEN' },
        { step: 2, timeline: 'D+45', entity: 'Contas a Pagar (Consignados OPME)', impact: 'Incapacidade de honrar fornecedores de materiais cirúrgicos essenciais', status: 'BROKEN' },
        { step: 3, timeline: 'D+65', entity: 'Corpo Clínico & Honorários', impact: 'Atraso no repasse de honorários médicos gerando risco de desfalque de plantões', status: 'AT_RISK' },
        { step: 4, timeline: 'D+90', entity: 'Disponibilidade de Leitos Cirúrgicos', impact: 'Cancelamento forçado de cirurgias eletivas de alta complexidade', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Auditoria semântica automatizada de 100% das guias TISS pré-envio',
        'Cessão e securitização de recebíveis de operadoras de rating A',
        'Acionamento de câmara de desempate e conciliação ANS instantânea'
      ]
    },
    {
      id: 'hc_shock_pharma_dollar',
      title: 'Disparada em OPME & Fármacos Importados (+35% Dólar)',
      category: 'CURRENCY_SPIKE',
      icon: DollarSign,
      description: 'Alta cambial em anestésicos, contrastes e insumos biológicos importados com tabelas CMED e de operadoras congeladas.',
      shockParameter: 'CPV Hospitalar +35% sem repasse',
      altmanZPostShock: 1.55,
      cashRunwayMonthsPostShock: 5.1,
      firstBreakPoint: {
        component: 'Margem da Farmácia Central e Leitos de UTI',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 3.850.000 / ano na margem assistencial',
        detailedCause: 'Medicamentos e insumos de UTI sobem 35%, mas as diárias globais e pacotes de planos de saúde possuem reajuste anual travado.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Farmácia Hospitalar Central', impact: 'Custo de reposição de antibióticos de 3ª geração e sedativos sobe 38%', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Margem Unitária por Diária de UTI', impact: 'Leitos críticos passam a operar com margem de contribuição negativa', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Capital de Giro Farmacêutico', impact: 'Necessidade de +R$ 3.2M para manter o estoque mínimo de segurança de 45 dias', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +6', entity: 'Repactuação de Pacotes', impact: 'Operadoras recusam repasse extraordinário fora da data-base contratual', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Centralização e consolidação de compras spot de medicamentos por pool hospitalar',
        'Protocolo de substituição terapêutica por bioequivalentes e genéricos homologados',
        'Trava de margem mínima com recálculo automático de pacotes cirúrgicos'
      ]
    },
    {
      id: 'hc_shock_interest_rate',
      title: 'Choque de Juros & Custo de Equipamentos Médicos (Selic 15.5%)',
      category: 'INTEREST_RATES',
      icon: TrendingUp,
      description: 'Encarecimento do leasing de ressonância magnética, tomógrafos e financiamentos hospitalares pós-fixados.',
      shockParameter: 'CDI +4.5% a.a. em leasings hospitalares',
      altmanZPostShock: 1.62,
      cashRunwayMonthsPostShock: 5.8,
      firstBreakPoint: {
        component: 'Despesa Financeira Líquida & Leasing de Alta Complexidade',
        timeline: 'Mês +3',
        severity: 'HIGH',
        financialLoss: '-R$ 2.900.000 / ano',
        detailedCause: 'Contratos de comodato e locação de parque de diagnóstico por imagem atrelados a taxas flutuantes sufocam o resultado operacional.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1.5', entity: 'Contratos de Leasing Hospitalar', impact: 'Parcelas mensais de tomógrafos e aceleradores lineares sobem 24%', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +3', entity: 'Resultado Financeiro Líquido', impact: 'Despesas com juros superam 65% do lucro antes dos tributos (LAIR)', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +6', entity: 'Capex de Modernização', impact: 'Cancelamento da reforma do centro cirúrgico e compra de novos leitos', status: 'RESILIENT' },
        { step: 4, timeline: 'Mês +8', entity: 'Covenants com Bancos de Saúde', impact: 'Risco de quebra de limite Dívida Líquida/EBITDA > 3.0x', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Renegociação de leasings para modalidade de pay-per-use telemétrico',
        'Amortização extraordinária com recebíveis performados de alta liquidez',
        'Otimização de agendamento de exames aumentando ocupação de máquinas para 92%'
      ]
    },
    {
      id: 'hc_shock_black_swan',
      title: 'Black Swan Hospitalar (Glosas 35% + Interdição + Juros 16%)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Tempestade perfeita com bloqueio regulatório, descredenciamento de plano âncora e escalada no custo de capital.',
      shockParameter: 'Glosas 35% + Juros 16% + Perda de 40% dos Leitos',
      altmanZPostShock: 0.91,
      cashRunwayMonthsPostShock: 1.3,
      firstBreakPoint: {
        component: 'Solvência de Caixa & Continuidade de Pronto-Socorro',
        timeline: 'D+38 (Mês 1.2)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 9.200.000 / Colapso',
        detailedCause: 'Queda súbita de receita associada a custos fixos inflexíveis de UTI e folha de enfermagem leva à paralisia operacional sem socorro de liquidez.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Tesouraria Hospitalar', impact: 'Entradas de caixa diárias caem 48% enquanto folha permanece 100% rígida', status: 'BROKEN' },
        { step: 2, timeline: 'D+28', entity: 'Repasse a Médicos Plantonistas', impact: 'Atraso de plantões desencadeia fechamento temporário de pronto-atendimento', status: 'BROKEN' },
        { step: 3, timeline: 'D+38', entity: 'Abastecimento de Gases Medicinais & Oxigênio', impact: 'Fornecedores exigem pagamento à vista na entrega', status: 'BROKEN' },
        { step: 4, timeline: 'D+50', entity: 'Continuidade Assistencial', impact: 'Necessidade de intervenção administrativa ou fusão emergencial', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Ativação do Comitê de Crise Hospitalar com bloqueio de qualquer despesa discricionária',
        'Aporte de liquidez via antecipação de convênios públicos e coparticipações',
        'Blindagem dos suprimentos vitais de UTI via reserva estrita de contingência'
      ]
    }
  ],
  retail: [
    {
      id: 'ret_shock_drop_demand',
      title: 'Queda Repentina de Vendas (-25% no Varejo) com Estoque Financiado',
      category: 'CLIENT_DEFAULT',
      icon: ShoppingBag,
      description: 'Desaceleração súbita no consumo das famílias deixando estoques de alta sazonalidade financiados a juros altos.',
      shockParameter: 'Queda de 25% na receita com estoque D+90',
      altmanZPostShock: 1.35,
      cashRunwayMonthsPostShock: 2.4,
      firstBreakPoint: {
        component: 'Descasamento de Caixa com Fornecedores Curva A',
        timeline: 'D+35 (Mês 1.2)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 4.600.000 em estoque encalhado',
        detailedCause: 'O giro de estoque desacelera de 45 para 98 dias. As duplicatas com grandes indústrias vencem antes da venda final ao consumidor.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Giro de Lojas Físicas', impact: 'Tráfego de clientes em shoppings e lojas de rua cai 22%', status: 'AT_RISK' },
        { step: 2, timeline: 'D+35', entity: 'Vencimento de Fornecedores de Coleção', impact: 'Contas a pagar superam entradas de vendas à vista e parceladas', status: 'BROKEN' },
        { step: 3, timeline: 'D+60', entity: 'Margem Líquida Comercial', impact: 'Necessidade de liquidações promocionais com desconto agressivo de até 40%', status: 'BROKEN' },
        { step: 4, timeline: 'D+90', entity: 'Capacidade de Reposição', impact: 'Cancelamento de compras para a próxima temporada comercial', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Liquidação autônoma de SKUs de baixo giro em canais de marketplace parceiros',
        'Repactuação de prazos de compras com fornecedores sem juros moratórios',
        'Ajuste dinâmico de preços (Dynamic Pricing) para maximizar margem residual'
      ]
    },
    {
      id: 'ret_shock_acquirer_fees',
      title: 'Retenção de Adquirentes e Salto de Chargebacks (+180 bps)',
      category: 'INTEREST_RATES',
      icon: TrendingUp,
      description: 'Aumento das taxas MDR de adquirentes e custo de antecipação de recebíveis de cartão de crédito no e-commerce.',
      shockParameter: 'Taxa de antecipação +180 bps & MDR +1.2%',
      altmanZPostShock: 1.58,
      cashRunwayMonthsPostShock: 4.9,
      firstBreakPoint: {
        component: 'Margem Líquida do E-commerce & Antecipação de Cartões',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 2.400.000 / ano',
        detailedCause: 'Com 75% das vendas parceladas em 10x sem juros, o aumento do custo da cessão de recebíveis consome toda a margem de lucro líquido.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1', entity: 'Custo de Intercâmbio & Adquirência', impact: 'Desconto de antecipação D+2 passa de 1.1% para 2.4% ao mês', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Margem do Canal Digital', impact: 'E-commerce opera com margem de contribuição inferior a 3.5%', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Capital de Giro Livre', impact: 'Retenção forçada de recebíveis reduz o colchão de liquidez operacional', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +6', entity: 'Mix de Meios de Pagamento', impact: 'Incentivo a pagamentos PIX com cashback para reduzir dependência de cartões', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Roteamento multi-adquirente inteligente escolhendo menor taxa por bandeira',
        'Campanha autônoma de incentivo ao pagamento via PIX no checkout',
        'Negociação em leilão direto no balcão de recebíveis CERC/B3'
      ]
    },
    {
      id: 'ret_shock_freight_spike',
      title: 'Alta Agressiva de Frete Last-Mile e Combustíveis (+30%)',
      category: 'CURRENCY_SPIKE',
      icon: Truck,
      description: 'Salto no custo de entregas expressas de e-commerce e transferências entre centros de distribuição metropolitanos.',
      shockParameter: 'Custo de frete last-mile +30%',
      altmanZPostShock: 1.68,
      cashRunwayMonthsPostShock: 5.6,
      firstBreakPoint: {
        component: 'Custo Logístico Unitário por Pacote Entregue',
        timeline: 'Mês +1.5',
        severity: 'HIGH',
        financialLoss: '-R$ 1.950.000 / ano',
        detailedCause: 'O valor do frete passa a representar 18.2% do ticket médio. O repasse ao consumidor gera abandono imediato de carrinho de 42%.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Tabelas de Transportadoras Terceirizadas', impact: 'Aplicação de taxa de emergência de combustível (GRIS/Pedágio)', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +1.5', entity: 'Margem Unitária por Pedido', impact: 'Pedidos de menor valor passam a dar prejuízo unitário na entrega', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +3', entity: 'Taxa de Conversão no Checkout', impact: 'Abandono de carrinho sobe de 28% para 46% devido ao frete mais caro', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +5', entity: 'Logística Reversa', impact: 'Custo de trocas e devoluções duplica no resultado trimestral', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Consolidação de entregas por micro-hubs urbanos com inteligência telemétrica',
        'Ativação da modalidade Clique & Retire em lojas físicas parceiras',
        'Reclassificação de faixas de frete grátis apenas para pedidos de alta margem'
      ]
    },
    {
      id: 'ret_shock_black_swan',
      title: 'Black Swan Varejo (Queda de 35% + Trava de Cartões + Juros Selic 16%)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Colapso generalizado de vendas no varejo, encarecimento do capital de giro e aumento de inadimplência no crediário próprio.',
      shockParameter: 'Vendas -35% + Juros 16% + Inadimplência 18%',
      altmanZPostShock: 0.88,
      cashRunwayMonthsPostShock: 1.2,
      firstBreakPoint: {
        component: 'Alavancagem de Capital de Giro & Cobertura de Lojas',
        timeline: 'D+40 (Mês 1.3)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 8.700.000 / Colapso',
        detailedCause: 'O faturamento das lojas não cobre o aluguel mínimo, folha de vendedores e amortização de dívidas de estoque.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Fluxo de Caixa Diário de Lojas', impact: 'Faturamento diário zera margem de contribuição operacional', status: 'BROKEN' },
        { step: 2, timeline: 'D+28', entity: 'Crediário Próprio / Boletos', impact: 'Inadimplência de clientes finais atinge patamar recorde de 22%', status: 'BROKEN' },
        { step: 3, timeline: 'D+40', entity: 'Aluguéis & Condomínios de Shopping', impact: 'Inadimplência de locação gerando risco de despejo de pontos nobres', status: 'BROKEN' },
        { step: 4, timeline: 'D+55', entity: 'Continuidade da Rede', impact: 'Necessidade de fechamento emergencial de lojas deficitárias', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Encerramento antecipado de contratos de lojas deficitárias sem multas pesadas',
        'Concentração total de vendas em canais digitais de alta liquidez',
        'Blindagem de caixa via travas de saídas operacionais no ERP'
      ]
    }
  ],
  services: [
    {
      id: 'srv_shock_enterprise_churn',
      title: 'Cancelamento Simultâneo dos 3 Maiores Contratos (Churn 40%)',
      category: 'CLIENT_DEFAULT',
      icon: Briefcase,
      description: 'Rescisão imprevista de contratos de serviços gerenciados e tecnologia por corte de gastos corporativos nos clientes.',
      shockParameter: 'Perda de 40% do MRR recorrente',
      altmanZPostShock: 1.25,
      cashRunwayMonthsPostShock: 2.0,
      firstBreakPoint: {
        component: 'Cobertura de Folha de Consultores & Engenheiros Seniores',
        timeline: 'D+30 (Mês 1)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 3.800.000 em receita anual recorrente',
        detailedCause: 'A folha técnica especializada é altamente qualificada e inflexível no curto prazo. A receita recorrente cai 40% enquanto o custo de pessoal permanece idêntico.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+10', entity: 'Notificação de Rescisão de Contratos', impact: 'Aviso prévio de cancelamento sem faturamento extraordinário', status: 'AT_RISK' },
        { step: 2, timeline: 'D+30', entity: 'Margem de Contribuição por Squad', impact: 'Equipes alocadas ficam ociosas consumindo salários integrais', status: 'BROKEN' },
        { step: 3, timeline: 'D+50', entity: 'Capital de Giro Livre', impact: 'Tesouraria precisa queimar reservas para cobrir a folha de pagamento do D+5', status: 'BROKEN' },
        { step: 4, timeline: 'D+75', entity: 'Provisão de Rescisões Trabalhistas', impact: 'Custo de desligamento de equipes sênior consome R$ 1.8M adicionais', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Realocação autônoma de consultores para novas propostas comerciais no pipeline',
        'Ativação de cláusulas de fidelidade e multas rescisórias contratuais',
        'Lançamento express de pacotes de serviços de menor ticket para PMEs'
      ]
    },
    {
      id: 'srv_shock_cloud_dollar',
      title: 'Aumento de Custos de Cloud, GPUs & Licenças em Dólar (+40%)',
      category: 'CURRENCY_SPIKE',
      icon: DollarSign,
      description: 'Salto cambial na fatura da AWS/GCP/Azure e licenças de software fundamentais para entrega dos serviços de TI.',
      shockParameter: 'Custo de infraestrutura cloud +40%',
      altmanZPostShock: 1.60,
      cashRunwayMonthsPostShock: 5.2,
      firstBreakPoint: {
        component: 'Margem Bruta de Serviços Gerenciados e SaaS',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 1.650.000 / ano',
        detailedCause: 'O custo de infraestrutura tecnológica salta de 12% para 28% da receita bruta sem possibilidade de reajuste imediato em contratos anuais vigentes.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Fatura Mensal de Nuvem (USD)', impact: 'Conversão cambial eleva a despesa mensal de servidores em R$ 140k/mês', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Margem Bruta por Cliente Enterprise', impact: 'Contratos fechados com preço fixo em reais sofrem erosão de rentabilidade', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Orçamento de Pesquisa & Desenvolvimento', impact: 'Congelamento de novos desenvolvimentos para conter OPEX de servidores', status: 'RESILIENT' },
        { step: 4, timeline: 'Mês +6', entity: 'Renegociação de Contratos de Nuvem', impact: 'Compromisso de instâncias reservadas de longo prazo para obter 30% desconto', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'FinOps autônomo desligando nós ociosos e otimizando instâncias spot',
        'Indexação contratual automática com gatilho de reajuste cambial acima de 15%',
        'Migração de cargas computacionais para regiões com menor tributação'
      ]
    },
    {
      id: 'srv_shock_tax_reclassification',
      title: 'Reenquadramento Tributário Compulsório (ISS/PIS/COFINS)',
      category: 'INTEREST_RATES',
      icon: AlertTriangle,
      description: 'Alteração em alíquotas municipais de ISS ou autuação tributária por descaracterização de benefícios fiscais.',
      shockParameter: 'Aumento de carga tributária em +6.5% s/ Faturamento',
      altmanZPostShock: 1.50,
      cashRunwayMonthsPostShock: 4.7,
      firstBreakPoint: {
        component: 'Provisão de Passivo Fiscal & Contingências',
        timeline: 'Mês +4',
        severity: 'HIGH',
        financialLoss: '-R$ 2.700.000',
        detailedCause: 'A carga tributária sobre serviços salta de 8.65% para 15.15%, reduzindo instantaneamente a margem operacional de toda a empresa.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1', entity: 'Apuração Fiscal Mensal', impact: 'Guia de recolhimento de impostos salta de R$ 180k para R$ 340k/mês', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +3', entity: 'Margem EBITDA da Empresa', impact: 'Redução de 45% no resultado operacional antes das despesas financeiras', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Provisão Contábil de Risco Jurídico', impact: 'Exigência de depósito judicial para impugnar a cobrança tributária', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +8', entity: 'Estruturação Societária', impact: 'Criação de filial em município de menor alíquota para novos contratos', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Revisão contábil e compensação autônoma de créditos de PIS/COFINS acumulados',
        'Planejamento tributário com segregação de software como serviço e licenciamento',
        'Ajuste automático de propostas comerciais incluindo alíquota tributária flutuante'
      ]
    },
    {
      id: 'srv_shock_black_swan',
      title: 'Black Swan Tech (Perda de 45% MRR + Multa LGPD + Juros 16%)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Incidente de segurança com sanção regulatória, perda em massa de contas corporativas e encarecimento do crédito.',
      shockParameter: 'MRR -45% + Sanção LGPD R$ 3M + Juros 16%',
      altmanZPostShock: 0.85,
      cashRunwayMonthsPostShock: 1.0,
      firstBreakPoint: {
        component: 'Runway de Tesouraria & Solvência Societária',
        timeline: 'D+45 (Mês 1.5)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 7.500.000 / Colapso',
        detailedCause: 'O fluxo de caixa operacional torna-se violentamente negativo, esgotando todo o saldo em contas em 45 dias sem suporte de investidores.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Faturamento de Clientes Enterprise', impact: 'Bloqueio de pagamentos por auditorias de segurança de clientes', status: 'BROKEN' },
        { step: 2, timeline: 'D+30', entity: 'Retenção de Talentos & Salários', impact: 'Risco de debandada de engenheiros-chave por atraso de bônus e PLR', status: 'BROKEN' },
        { step: 3, timeline: 'D+45', entity: 'Reservas Financeiras de Emergência', impact: 'Caixa líquido atinge nível zero para operações diárias', status: 'BROKEN' },
        { step: 4, timeline: 'D+60', entity: 'Estrutura Societária', impact: 'Necessidade de aporte de emergência (down-round) ou liquidação', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Acionamento do seguro de responsabilidade cibernética e mitigação de multas',
        'Protocolo de congelamento de todos os gastos não-essenciais',
        'Reestruturação expressa do quadro societário com aporte-ponte garantido'
      ]
    }
  ],
  agribusiness: [
    {
      id: 'agri_shock_crop_failure',
      title: 'Quebra de Safra por Seca Severa (-30% Produtividade)',
      category: 'CLIENT_DEFAULT',
      icon: Wheat,
      description: 'Condições climáticas adversas frustram a produtividade das lavouras com contratos de entrega física a termo já assinados.',
      shockParameter: 'Perda de 30% da safra com CPRs travadas',
      altmanZPostShock: 1.15,
      cashRunwayMonthsPostShock: 2.2,
      firstBreakPoint: {
        component: 'Cumprimento de Contratos a Termo & CPRs Físicas',
        timeline: 'Mês +3 (Colheita)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 7.900.000 em quebra de entrega',
        detailedCause: 'A produção colhida é insuficiente para honrar os contratos de venda futura com tradings globais (washout de contratos a mercado spot).'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1', entity: 'Índice de Vegetação (NDVI por Satélite)', impact: 'Estimativa de produtividade por hectare cai de 65 para 45 sacas', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +3', entity: 'Liquidação Física de CPRs', impact: 'Falta de grãos para entregar às tradings gera multas de washout', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +5', entity: 'Crédito de Custeio Agrícola', impact: 'Bancos e cooperativas retêm concessão de novos financiamentos de plantio', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +7', entity: 'Patrimônio Imobiliário e Fazendas', impact: 'Risco de execução de hipotecas sobre a terra dada em garantia', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Acionamento imediato de apólices de seguro agrícola paramétrico por satélite',
        'Renegociação autônoma de prazos de entrega física com tradings parceiras',
        'Hedge de opções de compra no mercado futuro para cobrir déficit produtivo'
      ]
    },
    {
      id: 'agri_shock_cbot_plunge',
      title: 'Queda Abrupta nas Cotações de Grãos (CBOT -25%)',
      category: 'CURRENCY_SPIKE',
      icon: TrendingDown,
      description: 'Super-safra global nos EUA e aumento de estoques mundiais derrubam o preço da saca de soja e milho na Bolsa de Chicago.',
      shockParameter: 'Preço da saca de R$ 145 para R$ 108',
      altmanZPostShock: 1.48,
      cashRunwayMonthsPostShock: 4.5,
      firstBreakPoint: {
        component: 'Margem de Contribuição por Hectare Cultivado',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 5.200.000',
        detailedCause: 'Os custos de fertilizantes e defensivos foram contratados no pico do dólar, tornando o custo de produção por saca superior ao preço de venda spot.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Cotação na Bolsa de Chicago & Prêmio no Porto', impact: 'Preço FOB Paranaguá despenca 22% em 30 dias', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Margem Operacional da Fazenda', impact: 'A venda da safra gera prejuízo unitário de R$ 18 por saca colhida', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Quitação de Operações de Barter', impact: 'Volume de grãos pactuado não cobre o valor das faturas de químicos', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +6', entity: 'Capacidade de Investimento em Máquinas', impact: 'Cancelamento de compra de tratores e pulverizadores novos', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Armazenamento estratégico em silos próprios aguardando recuperação da base',
        'Trava de prêmio de exportação e venda fracionada nos picos intradiários',
        'Diversificação com rotação de culturas de ciclo curto de maior liquidez'
      ]
    },
    {
      id: 'agri_shock_port_embargo',
      title: 'Embargo Sanitário / Bloqueio de Exportação em Terminais Portuários',
      category: 'INTEREST_RATES',
      icon: Truck,
      description: 'Fila de navios no porto ou restrições fitossanitárias impostas por países importadores paralisando escoamento da safra.',
      shockParameter: 'Bloqueio de 60 dias no corredor de exportação',
      altmanZPostShock: 1.52,
      cashRunwayMonthsPostShock: 4.8,
      firstBreakPoint: {
        component: 'Custo de Armazenagem & Degradação de Grãos em Silos',
        timeline: 'D+45 (Mês 1.5)',
        severity: 'HIGH',
        financialLoss: '-R$ 4.300.000',
        detailedCause: 'A sobrecarga de grãos parados gera custos exorbitantes de estadia (demurrage) e risco de perda de qualidade comercial do produto.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Capacidade de Silagem Regional', impact: 'Silos cooperativos atingem 98% da capacidade máxima de estocagem', status: 'AT_RISK' },
        { step: 2, timeline: 'D+45', entity: 'Demurrage Portuário & Taxas de Permanência', impact: 'Cobrança de diárias de navios atracados consome margem da trading', status: 'BROKEN' },
        { step: 3, timeline: 'D+60', entity: 'Fluxo Financeiro de Exportação', impact: 'Adiantamento sobre Contrato de Câmbio (ACC) fica travado sem embarque', status: 'BROKEN' },
        { step: 4, timeline: 'D+80', entity: 'Venda para o Mercado Interno', impact: 'Desova de emergência para indústrias de ração locais com deságio de 25%', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Redirecionamento logístico autônomo para portos alternativos do Arco Norte',
        'Uso de silo-bolsas móveis herméticos no campo para preservar grãos sem custo de porto',
        'Hedging financeiro contra o aumento de fretes e demurrages'
      ]
    },
    {
      id: 'agri_shock_black_swan',
      title: 'Black Swan Agro (Quebra 40% + Dólar Desfavorável + Juros de Custeio 16%)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Choque devastador combinando perda massiva de produção agrícola, aumento da dívida bancária e descolamento de custos.',
      shockParameter: 'Quebra 40% + Juros 16% + Insumos +30%',
      altmanZPostShock: 0.79,
      cashRunwayMonthsPostShock: 1.0,
      firstBreakPoint: {
        component: 'Rolagem de Dívidas de Custeio Agrícola e CPRs Financeiras',
        timeline: 'Mês +3.5',
        severity: 'CRITICAL',
        financialLoss: '-R$ 14.800.000 / Colapso',
        detailedCause: 'O faturamento total da colheita não cobre os custos operacionais do plantio somados aos juros do financiamento rural.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1.5', entity: 'Fluxo de Caixa do Produtor', impact: 'Entradas da colheita sofrem queda de 52% em relação ao planejado', status: 'BROKEN' },
        { step: 2, timeline: 'Mês +3.5', entity: 'Vencimento de CPRs com Bancos e Fundos (Fiagros)', impact: 'Incapacidade de liquidar compromissos do Plano Safra', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +5', entity: 'Garantias Fiduciárias de Penhor de Safra', impact: 'Execução judicial de garantias por credores e distribuidores de insumos', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +7', entity: 'Continuidade da Operação Agrícola', impact: 'Inviabilidade de plantio da safrinha sem recuperação judicial', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Alongamento emergencial de dívidas rurais com respaldo no Manual de Crédito Rural (MCR)',
        'Cessão de créditos de carbono e ativos ambientais para reforço de liquidez',
        'Blindagem patrimonial dos imóveis rurais produtivos sob proteção do AOS'
      ]
    }
  ],
  logistics: [
    {
      id: 'log_shock_diesel_spike',
      title: 'Disparada do Óleo Diesel (+35%) sem Repasse Imediato de Frete',
      category: 'CURRENCY_SPIKE',
      icon: Truck,
      description: 'Aumento nos preços dos combustíveis pela Petrobras/mercado internacional com contratos de transporte travados por SLA.',
      shockParameter: 'Diesel +35% em 30 dias',
      altmanZPostShock: 1.38,
      cashRunwayMonthsPostShock: 3.1,
      firstBreakPoint: {
        component: 'Margem Operacional por Km Rodado & Saldo de Combustível',
        timeline: 'D+25 (Mês 0.8)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 3.750.000 / ano',
        detailedCause: 'O combustível representa 44% do custo operacional do transporte rodoviário. O gatilho de repasse da ANTT tem defasagem média de 60 dias.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+10', entity: 'Cartão de Abastecimento da Frota', impact: 'Limite diário de consumo de combustível atinge teto com 18 dias úteis', status: 'AT_RISK' },
        { step: 2, timeline: 'D+25', entity: 'Margem Líquida das Viagens', impact: 'Rotas de longa distância passam a rodar com prejuízo unitário por frete', status: 'BROKEN' },
        { step: 3, timeline: 'D+45', entity: 'Repasse para Embarcadores', impact: 'Embarcadores recusam reajuste extraordinário imediato fora da janela anual', status: 'BROKEN' },
        { step: 4, timeline: 'D+60', entity: 'Manutenção Preditiva e Pneus', impact: 'Postergação compulsória de troca de pneus e revisões pesadas', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Otimização telemétrica de rotas eliminando 100% de quilometragem ociosa',
        'Acionamento de compras de diesel por leilão spot em bases distribuidoras',
        'Gatilho automático de repasse de frete conectado diretamente à bomba no ERP'
      ]
    },
    {
      id: 'log_shock_cargo_insurance',
      title: 'Sinistro Múltiplo de Carga ou Aumento de 60% na Apólice RCTR-C',
      category: 'CLIENT_DEFAULT',
      icon: ShieldCheck,
      description: 'Onda de furtos ou acidentes em corredores logísticos críticos elevando franquias e prêmios de seguro de transporte.',
      shockParameter: 'Prêmio de seguro de carga +60% & Franquia R$ 500k',
      altmanZPostShock: 1.56,
      cashRunwayMonthsPostShock: 5.0,
      firstBreakPoint: {
        component: 'Custo Fixo de Seguros & Capital de Giro',
        timeline: 'Mês +2',
        severity: 'HIGH',
        financialLoss: '-R$ 2.800.000',
        detailedCause: 'A apólice de RCTR-C e RCF-DC encarece drasticamente, consumindo 8.5% de todo o faturamento bruto das operações de frete.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Gerenciamento de Risco (PGR)', impact: 'Exigência de escolta armada dupla para cargas de alto valor agregado', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +2', entity: 'Fatura Mensal da Seguradora', impact: 'Desembolso com seguros sobe de R$ 110k para R$ 260k por mês', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4', entity: 'Disponibilidade de Veículos Homologados', impact: 'Dificuldade de encontrar agregados com checklist aprovado pela seguradora', status: 'AT_RISK' },
        { step: 4, timeline: 'Mês +6', entity: 'Renegociação com Embarcadores', impact: 'Inclusão obrigatória da taxa de Ad-Valorem/GRIS em todas as propostas', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Monitoramento telemétrico por satélite com bloqueio automático anti-furto',
        'Roteamento autônomo evitando trechos rodoviários com alto índice de sinistro',
        'Contratação de apólice cativa fracionada com desconto por sinistralidade zero'
      ]
    },
    {
      id: 'log_shock_highway_block',
      title: 'Bloqueio de Rodovias Principais por 10 dias / Greve Geral',
      category: 'INTEREST_RATES',
      icon: AlertTriangle,
      description: 'Paralisação de eixos rodoviários estratégicos impedindo entrega de frotas e gerando multas pesadas de SLA.',
      shockParameter: 'Frota parada 10 dias + Multas contratuais',
      altmanZPostShock: 1.62,
      cashRunwayMonthsPostShock: 5.4,
      firstBreakPoint: {
        component: 'Faturamento Diário & Multas Contratuais de SLA',
        timeline: 'D+10 (Mês 0.3)',
        severity: 'HIGH',
        financialLoss: '-R$ 2.100.000',
        detailedCause: 'Caminhões retidos em barreiras geram perda imediata de faturamento diário, além de custos com diárias de motoristas e perecíveis.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+3', entity: 'Posicionamento da Frota no País', impact: '68% dos caminhões ficam retidos em pontos de interdição nas estradas', status: 'BROKEN' },
        { step: 2, timeline: 'D+10', entity: 'Contas a Receber por Fretes Concluídos', impact: 'Sem a assinatura do comprovante de entrega (POD), não há emissão de fatura', status: 'BROKEN' },
        { step: 3, timeline: 'D+20', entity: 'Custos de Diárias e Estadia de Pátio', impact: 'Gasto imprevisto com alimentação e segurança de motoristas retidos', status: 'AT_RISK' },
        { step: 4, timeline: 'D+35', entity: 'Recuperação do Fluxo Logístico', impact: 'Sobrecarga de entregas represadas gerando custos de horas extras', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Desvio preventivo de frotas em tempo real antes da chegada aos pontos de bloqueio',
        'Emissão de comprovante digital de entrega POD via blockchain na ponta móvel',
        'Cláusula de força maior aplicada automaticamente para anular multas contratuais'
      ]
    },
    {
      id: 'log_shock_black_swan',
      title: 'Black Swan Logístico (Diesel +40% + Default Embarcadores + Juros 16%)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Colapso simultâneo de custos de combustível, inadimplência dos principais clientes industriais e juros altos nos financiamentos de frota.',
      shockParameter: 'Diesel +40% + Default R$ 6M + Juros 16%',
      altmanZPostShock: 0.83,
      cashRunwayMonthsPostShock: 1.1,
      firstBreakPoint: {
        component: 'Amortização de Financiamento de Frota (Finame) & Pátio',
        timeline: 'D+35 (Mês 1.2)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 8.900.000 / Colapso',
        detailedCause: 'A transportadora não consegue gerar caixa para quitar as parcelas de leasing dos caminhões e honrar os fornecedores de combustível.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Tesouraria da Transportadora', impact: 'Falta de pagamento de fretes por clientes âncora seca o caixa disponível', status: 'BROKEN' },
        { step: 2, timeline: 'D+28', entity: 'Parcelas de Financiamento BNDES/Finame', impact: 'Atraso de mais de 30 dias gera risco de busca e apreensão de carretas', status: 'BROKEN' },
        { step: 3, timeline: 'D+35', entity: 'Crédito em Postos de Combustível', impact: 'Distribuidoras cortam o prazo de pagamento do diesel para D+0', status: 'BROKEN' },
        { step: 4, timeline: 'D+50', entity: 'Continuidade da Operação Logística', impact: 'Paralisação compulsória de 80% da frota nas garagens', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Sublocação emergencial de frotas ociosas para operações dedicadas essenciais',
        'Renegociação e carência de 90 dias nas parcelas de financiamento bancário',
        'Ativação do protocolo de salvaguarda de caixa do AOS impedindo arrestos'
      ]
    }
  ],
  construction: [
    {
      id: 'const_shock_delayed_measurement',
      title: 'Atraso Sistemático de Repasses de Medições de Obras (D+120)',
      category: 'CLIENT_DEFAULT',
      icon: HardHat,
      description: 'Atraso na liberação de recursos de órgãos públicos ou contratantes privados com canteiro de obras em plena execução.',
      shockParameter: 'Repasse represado de R$ 6.200.000 em medições',
      altmanZPostShock: 1.20,
      cashRunwayMonthsPostShock: 1.8,
      firstBreakPoint: {
        component: 'Folha de Canteiro de Obras & Locação de Maquinário',
        timeline: 'D+40 (Mês 1.3)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 6.200.000 em medições represadas',
        detailedCause: 'A folha de serventes, pedreiros e engenheiros de campo não pode ser atrasada (risco de greve imediata), enquanto a medição física fica travada na burocracia.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+20', entity: 'Aprovação de Boletim de Medição', impact: 'Fiscal do contratante aponta pendências de documentação atrasando liberação', status: 'BROKEN' },
        { step: 2, timeline: 'D+40', entity: 'Folha de Pagamento da Obra', impact: 'Caixa do consórcio insuficiente para liquidar salários e encargos trabalhistas', status: 'BROKEN' },
        { step: 3, timeline: 'D+60', entity: 'Locação de Guindastes e Escavadeiras', impact: 'Locadoras recolhem maquinário pesado por inadimplência das faturas', status: 'BROKEN' },
        { step: 4, timeline: 'D+85', entity: 'Cronograma Físico-Financeiro da Obra', impact: 'Atraso de marco contratual gerando risco de execução de multa por atraso', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Auditoria fotogramétrica com drones para aprovação automática do avanço físico',
        'Securitização de boletins de medição performados em fundos de infraestrutura (FII)',
        'Notificação extrajudicial automática de mora com cobrança de juros contratuais'
      ]
    },
    {
      id: 'const_shock_incc_surge',
      title: 'Inflação do INCC / Aço / Cimento (+28%) em Contrato Preço Fixo',
      category: 'CURRENCY_SPIKE',
      icon: Building2,
      description: 'Disparada nos custos de vergalhões de aço, cimento e concreto usinado em contratos na modalidade de preço global fechado (Lump Sum).',
      shockParameter: 'Custo de insumos estruturais +28%',
      altmanZPostShock: 1.45,
      cashRunwayMonthsPostShock: 4.2,
      firstBreakPoint: {
        component: 'Margem de Lucro da Obra & Estouro de Orçamento Global',
        timeline: 'Mês +3',
        severity: 'HIGH',
        financialLoss: '-R$ 4.900.000',
        detailedCause: 'O custo direto de construção supera o valor do contrato original. A margem da construtora vira negativa antes de 50% da conclusão da obra.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1', entity: 'Cotação de Aço Estrutural (CA-50/60)', impact: 'Siderúrgicas aplicam reajuste de 30% nas entregas programadas', status: 'AT_RISK' },
        { step: 2, timeline: 'Mês +3', entity: 'Orçamento Executivo da Engenharia', impact: 'Custo previsto para a fundação e estrutura estoura a dotação em 25%', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +5', entity: 'Pleito de Reequilíbrio Econômico-Financeiro', impact: 'Contratante resiste a conceder aditivo contratual de valor', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +7', entity: 'Rentabilidade Geral da Construtora', impact: 'Lucro de outros empreendimentos é consumido para cobrir o déficit da obra', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Engenharia de valor (Value Engineering) autônoma otimizando consumo de materiais',
        'Compra antecipada em lote com contrato futuro de fornecimento garantido',
        'Elaboração expressa de memorial técnico de pleito (Claim) com dados do AOS'
      ]
    },
    {
      id: 'const_shock_environmental_embargo',
      title: 'Embargo Ambiental ou Liminar Judicial com Paralisação por 60 dias',
      category: 'INTEREST_RATES',
      icon: AlertTriangle,
      description: 'Suspensão de alvará de construção ou exigência de condicionantes ambientais extraordinárias paralisando o canteiro de obras.',
      shockParameter: 'Canteiro paralisado 60 dias com custos fixos ativos',
      altmanZPostShock: 1.55,
      cashRunwayMonthsPostShock: 4.9,
      firstBreakPoint: {
        component: 'Custo de Mobilização & Ociosidade de Equipamentos',
        timeline: 'D+20 (Mês 0.7)',
        severity: 'HIGH',
        financialLoss: '-R$ 3.100.000',
        detailedCause: 'Os custos de mobilização, vigilância, seguros e locação de maquinários continuam correndo sem que haja qualquer avanço físico faturável.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+5', entity: 'Fiscalização Ambiental / Notificação', impact: 'Interdição cautelar dos trabalhos de terraplenagem e fundações', status: 'BROKEN' },
        { step: 2, timeline: 'D+20', entity: 'Custo de Standby Operacional', impact: 'Manutenção de equipes e máquinas paradas queima R$ 45k por dia', status: 'BROKEN' },
        { step: 3, timeline: 'D+40', entity: 'Desmobilização Parcial de Terceirizados', impact: 'Necessidade de rescisão de contratos de subempreiteiros', status: 'AT_RISK' },
        { step: 4, timeline: 'D+60', entity: 'Prorrogação de Licenças e Alvarás', impact: 'Custos advocatícios e laudos periciais para obtenção de efeito suspensivo', status: 'RESILIENT' }
      ],
      autonomousCountermeasures: [
        'Conformidade preditiva contínua de licenças ambientais e normas NR-18',
        'Desmobilização ágil de equipamentos locados para evitar cobrança de standby',
        'Acionamento de apólice de seguro de riscos de engenharia com cobertura de lucros cessantes'
      ]
    },
    {
      id: 'const_shock_black_swan',
      title: 'Black Swan Construção (Atraso Medição + Estouro INCC + Performance Bond)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Combinação catastrófica de retenção financeira de clientes, disparada nos preços de materiais e risco de execução de seguro garantia.',
      shockParameter: 'Medição travada + Insumos +35% + Risco Bond R$ 15M',
      altmanZPostShock: 0.75,
      cashRunwayMonthsPostShock: 0.9,
      firstBreakPoint: {
        component: 'Solvência do Consórcio Construtor & Patrimônio de Afetação',
        timeline: 'D+45 (Mês 1.5)',
        severity: 'CRITICAL',
        financialLoss: '-R$ 13.500.000 / Colapso',
        detailedCause: 'A empresa não suporta o déficit de caixa simultâneo e entra em risco de default contratual com execução de seguro garantia de fiel cumprimento.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Conta Corrente Vinculada ao Empreendimento', impact: 'Saldo líquido entra em terreno negativo com bloqueio de aportes', status: 'BROKEN' },
        { step: 2, timeline: 'D+30', entity: 'Notificação do Contratante de Default', impact: 'Ameaça de rescisão unilateral de contrato por abandono ou atraso crítico', status: 'BROKEN' },
        { step: 3, timeline: 'D+45', entity: 'Execução da Performance Bond', impact: 'Seguradora cobra regresso das garantias prestadas pelos sócios', status: 'BROKEN' },
        { step: 4, timeline: 'D+60', entity: 'Continuidade da Construtora', impact: 'Incapacidade de emitir novas certidões negativas (CNDs) para operar', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Mediação extrajudicial e arbitragem acelerada com mediação do AOS',
        'Cessão do contrato para construtora parceira em regime de consórcio mitigado',
        'Isolamento e proteção de ativos da holding patrimonial via invariantes'
      ]
    }
  ],
  energy: [
    {
      id: 'nrg_shock_curtailment',
      title: 'Risco Hidrológico & Corte Forçado de 35% pelo ONS (Curtailment)',
      category: 'CLIENT_DEFAULT',
      icon: Zap,
      description: 'Determinação do Operador Nacional do Sistema (ONS) de desligamento de parques solares e eólicos por gargalos de transmissão.',
      shockParameter: 'Curtailment forçado de 35% da geração',
      altmanZPostShock: 1.30,
      cashRunwayMonthsPostShock: 2.5,
      firstBreakPoint: {
        component: 'Receita Líquida de Comercialização & Contratos no ACL',
        timeline: 'Mês +1.5',
        severity: 'CRITICAL',
        financialLoss: '-R$ 5.800.000 em liquidação CCEE',
        detailedCause: 'A geradora vendeu a energia no mercado livre (PPA), mas com a geração cortada pelo ONS, precisa comprar energia no mercado de curto prazo (PLD) para honrar entregas.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+15', entity: 'Despacho de Geração Fotovoltaica/Eólica', impact: 'Comando do ONS ordena corte de 350 MW de potência instantânea', status: 'BROKEN' },
        { step: 2, timeline: 'Mês +1.5', entity: 'Liquidação Financeira na CCEE', impact: 'Necessidade de desembolso financeiro para cobrir o déficit de lastro vendido', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +3', entity: 'Índice de Cobertura do Serviço da Dívida (ICSD)', impact: 'Geração de caixa insuficiente para honrar amortização com BNDES', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +5', entity: 'Pleito Regulatório na Aneel', impact: 'Solicitação de ressarcimento por constrained-off sem data de pagamento', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Ativação de sistemas de armazenamento por bateria (BESS) absorvendo o excedente',
        'Hedge sintético de PLD/CCEE para travar preço de recompra no mercado spot',
        'Negociação de flexibilidade de entrega e modulação horária com clientes livres'
      ]
    },
    {
      id: 'nrg_shock_ccee_default',
      title: 'Inadimplência na Câmara de Comercialização (CCEE) / Default',
      category: 'INTEREST_RATES',
      icon: AlertTriangle,
      description: 'Default de comercializadoras de energia na liquidação mensal do Mercado de Curto Prazo (MCP) gerando rateio de perdas.',
      shockParameter: 'Inadimplência de R$ 4.400.000 na liquidação CCEE',
      altmanZPostShock: 1.50,
      cashRunwayMonthsPostShock: 4.4,
      firstBreakPoint: {
        component: 'Liquidação Financeira MCP (Mercado de Curto Prazo)',
        timeline: 'D+30 (Mês 1)',
        severity: 'HIGH',
        financialLoss: '-R$ 4.400.000',
        detailedCause: 'O mecanismo de rateio compulsório de inadimplência da CCEE impõe um desconto direto sobre os créditos das geradoras adimplentes.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+10', entity: 'Publicação do Relatório de Liquidação CCEE', impact: 'Apuração de inadimplência recorde de 24% entre comercializadoras', status: 'AT_RISK' },
        { step: 2, timeline: 'D+30', entity: 'Conta de Liquidação Financeira', impact: 'Crédito recebido é 35% inferior ao valor contratado da energia gerada', status: 'BROKEN' },
        { step: 3, timeline: 'D+50', entity: 'Garantias Financeiras Aportadas', impact: 'Exigência de aporte de garantia adicional para operar no próximo ciclo', status: 'BROKEN' },
        { step: 4, timeline: 'D+75', entity: 'Rating de Crédito da Geradora', impact: 'Agências de classificação de risco colocam perspectiva em observação negativa', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Análise semântica contínua de risco de crédito de contrapartes no grafo AOS',
        'Exigência de carta de fiança bancária de primeira linha para contratos bilaterais',
        'Diversificação de portfólio priorizando consumidores industriais autoprodutores'
      ]
    },
    {
      id: 'nrg_shock_substation_failure',
      title: 'Falha Crítica em Transformador Principal com Multa de Rede',
      category: 'CURRENCY_SPIKE',
      icon: Zap,
      description: 'Avaria grave em transformador elevador de 230kV com indisponibilidade de escoamento e penalidades aplicadas pela Aneel/ONS.',
      shockParameter: 'Subestação indisponível 45 dias + Multa Parcela Variável',
      altmanZPostShock: 1.60,
      cashRunwayMonthsPostShock: 5.1,
      firstBreakPoint: {
        component: 'Parcela Variável (PV) & Seguros Patrimoniais',
        timeline: 'D+15 (Mês 0.5)',
        severity: 'HIGH',
        financialLoss: '-R$ 3.200.000',
        detailedCause: 'A taxa de desconto por indisponibilidade de linha é aplicada diretamente sobre a Receita Anual Permitida (RAP), além do custo de reparo emergencial.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'D+2', entity: 'Sistema SCADA & Relés de Proteção', impact: 'Disparo de alarme de sobreaquecimento com desarme da subestação', status: 'BROKEN' },
        { step: 2, timeline: 'D+15', entity: 'Apuração de Parcela Variável (PV)', impact: 'Desconto compulsório de 20% na receita mensal de transmissão/geração', status: 'BROKEN' },
        { step: 3, timeline: 'D+30', entity: 'Compra de Transformador Substituto Spot', impact: 'Desembolso extraordinário de R$ 2.4M para reposição de ativo crítico', status: 'BROKEN' },
        { step: 4, timeline: 'D+45', entity: 'Indenização de Lucros Cessantes da Seguradora', impact: 'Processo de regulação de sinistro posterga reembolso para D+120', status: 'AT_RISK' }
      ],
      autonomousCountermeasures: [
        'Monitoramento contínuo de gases dissolvidos no óleo (DGA) e telemetria preditiva',
        'Acordo de spare part compartilhado com parques geradores vizinhos no cluster',
        'Substituição e chaveamento automático para bay reserva em menos de 10 minutos'
      ]
    },
    {
      id: 'nrg_shock_black_swan',
      title: 'Black Swan Energia (Curtailment 45% + Queda PLD + Juros 16% Debêntures)',
      category: 'BLACK_SWAN',
      icon: Sparkles,
      description: 'Crise sistêmica no setor elétrico com excesso de oferta de energia, cortes compulsórios de transmissão e explosão no custo de dívidas estruturadas.',
      shockParameter: 'Curtailment 45% + PLD Mínimo + Juros CDI+3.5%',
      altmanZPostShock: 0.78,
      cashRunwayMonthsPostShock: 1.0,
      firstBreakPoint: {
        component: 'Covenants de Dívida de Project Finance (DSCR < 1.0x)',
        timeline: 'Mês +3',
        severity: 'CRITICAL',
        financialLoss: '-R$ 12.100.000 / Colapso',
        detailedCause: 'O índice de cobertura da dívida do parque quebra o gatilho contratual de 1.20x, permitindo aos debenturistas exigir o vencimento antecipado do principal.'
      },
      structuralBreakSequence: [
        { step: 1, timeline: 'Mês +1', entity: 'EBITDA Operacional do Complexo Solar/Eólico', impact: 'Receita desaba 50% enquanto serviço da dívida pós-fixada sobe 35%', status: 'BROKEN' },
        { step: 2, timeline: 'Mês +3', entity: 'Gatilho de Covenants de Debêntures Incentivadas', impact: 'DSCR atinge 0.68x disparando notificação de default técnico pelo Trustee', status: 'BROKEN' },
        { step: 3, timeline: 'Mês +4.5', entity: 'Conta Reserva de Serviço da Dívida (DSRA)', impact: 'Banco agente consome os 6 meses de garantia para pagar juros', status: 'BROKEN' },
        { step: 4, timeline: 'Mês +6', entity: 'Continuidade da SPE (Sociedade de Propósito Específico)', impact: 'Necessidade de injeção de capital pelos patrocinadores ou reestruturação', status: 'BROKEN' }
      ],
      autonomousCountermeasures: [
        'Repactuação automática de waivers com o sindicato de debenturistas via Multi-Sig',
        'Venda de contratos de longo prazo de autoprodução para grandes indústrias',
        'Reestruturação da curva de amortização de debêntures com carência de 24 meses'
      ]
    }
  ]
};

export const CounterfactualOraclePanel: React.FC<CounterfactualOraclePanelProps> = ({
  tenantProfile,
  currency = 'BRL',
  onAddAuditRecord
}) => {
  const { currentUserRole } = useAuth();
  const isPartner = isPartnerPortfolioScope(currentUserRole);

  const initialSector = tenantProfile?.sector && SECTOR_SCENARIOS_MAP[tenantProfile.sector]
    ? tenantProfile.sector
    : 'manufacturing';

  const [activeSector, setActiveSector] = useState<string>(initialSector);

  // Sincroniza com a carteira de parceiro se o cliente mudar
  useEffect(() => {
    const handlePartnerClientChanged = (evt: CustomEvent<{ cnpj: string; companyName: string; sectorKey?: string }>) => {
      if (evt.detail?.sectorKey && SECTOR_SCENARIOS_MAP[evt.detail.sectorKey]) {
        handleSelectSector(evt.detail.sectorKey);
      }
    };
    window.addEventListener('velatrix:partner_active_client_changed' as any, handlePartnerClientChanged as EventListener);
    return () => {
      window.removeEventListener('velatrix:partner_active_client_changed' as any, handlePartnerClientChanged as EventListener);
    };
  }, []);
  
  // Oracle Mode: 'STRATEGIC_MONTE_CARLO' | 'LIQUIDITY_PREDICTIVE_365' | 'TESLA_STRESS_TEST'
  const [oracleMode, setOracleMode] = useState<'STRATEGIC_MONTE_CARLO' | 'LIQUIDITY_PREDICTIVE_365' | 'TESLA_STRESS_TEST'>('STRATEGIC_MONTE_CARLO');
  
  // Scenarios and Stress Shocks calculated based on active sector
  const scenarios = useMemo(() => {
    return SECTOR_SCENARIOS_MAP[activeSector] || SECTOR_SCENARIOS_MAP.manufacturing;
  }, [activeSector]);

  const stressShocks = useMemo(() => {
    return SECTOR_TESLA_STRESS_SHOCKS_MAP[activeSector] || SECTOR_TESLA_STRESS_SHOCKS_MAP.manufacturing;
  }, [activeSector]);

  // Stress Test State
  const [selectedShockId, setSelectedShockId] = useState<string>(() => stressShocks[0]?.id || 'mfg_shock_interest_rate');
  const [shockIntensity, setShockIntensity] = useState<'MODERATE' | 'SEVERE' | 'EXTREME'>('SEVERE');
  const [activeStressNotification, setActiveStressNotification] = useState<string | null>(null);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => scenarios[0]?.id || 'mfg_hire_50_operators');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationProgress, setSimulationProgress] = useState<number>(100);
  const [simulatedIterations, setSimulatedIterations] = useState<number>(10000);
  const [marketVolatility, setMarketVolatility] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [appliedSafeguardCount, setAppliedSafeguardCount] = useState<number>(1);

  // When sector changes, select its first scenario and shock
  const handleSelectSector = (sectorKey: string) => {
    setActiveSector(sectorKey);
    const sectorScenarios = SECTOR_SCENARIOS_MAP[sectorKey] || SECTOR_SCENARIOS_MAP.manufacturing;
    setSelectedScenarioId(sectorScenarios[0]?.id || '');
    const sectorShocks = SECTOR_TESLA_STRESS_SHOCKS_MAP[sectorKey] || SECTOR_TESLA_STRESS_SHOCKS_MAP.manufacturing;
    setSelectedShockId(sectorShocks[0]?.id || '');
    handleRunMonteCarlo();
  };

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];
  const currentShock = stressShocks.find(s => s.id === selectedShockId) || stressShocks[0];

  const handleRunMonteCarlo = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 25;
      });
    }, 180);
  };

  const handleApplyStressSafeguards = () => {
    const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
    
    if (onAddAuditRecord) {
      onAddAuditRecord({
        id: `rec_stress_test_${currentShock.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventId: `STRESS-${currentShock.id.toUpperCase()}`,
        eventTitle: `[TESLA STRESS TEST] Contramedidas para ${currentShock.title}`,
        sector: tenantProfile?.sector || 'manufacturing',
        jurisdiction: 'BR',
        agentsInvolved: ['Tesla Resonance Engine', 'CFO Oracle Agent', 'Invariants Guard Swarm'],
        actionsTaken: currentShock.autonomousCountermeasures,
        financialImpact: currentShock.firstBreakPoint.financialLoss,
        merkleRoot: hash,
        signatures: [
          { role: 'CFO', signature: '0x88921B7C', timestamp: new Date().toISOString(), valid: true },
          { role: 'AOS_TESLA_STRESS_ORACLE', signature: '0x99A04B12', timestamp: new Date().toISOString(), valid: true }
        ],
        executionReceipt: `TX-STRESS-${currentShock.id.toUpperCase()}`,
        invariantSnapshot: ['Invariante_Reserva_Minima_Caixa', 'Trava_Covenants_Bancarios', 'Trava_Alavancagem_CDI']
      });
    }

    setActiveStressNotification(`✓ [Protocolo Tesla Injetado no Ledger] Salvaguardas ativas com Hash ${hash}.`);

    // Dispara Gatilho Automático de Split por Simulação e Auditoria Contrafactual
    const activeClient = PartnerPortfolioService.getActiveClient();
    PartnerPortfolioService.triggerAutomatedSplitEvent({
      milestoneKey: 'AUDITORIA_CRUZADA',
      cnpj: activeClient.cnpj,
      companyName: activeClient.companyName,
      creditAmount: 750000,
      caseId: `ORACLE-${currentShock.id.toUpperCase().slice(-6)}`,
      caseTitle: `Oráculo Contrafactual: Salvaguardas ${currentShock.title}`,
      triggerSourceModule: 'Oráculo de Previsibilidade Contrafactual',
      notes: `Auditoria de estresse e solvência patrimonial D+24 aprovada com contramedidas ativadas no ledger.`
    });

    setTimeout(() => setActiveStressNotification(null), 4500);
  };

  const formatCurrency = (val: number) => {
    return `R$ ${(val / 1000000).toFixed(2)}M`;
  };

  const getZScoreColor = (z: number) => {
    if (z >= 2.99) return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/80';
    if (z >= 1.81) return 'text-amber-400 border-amber-500/40 bg-amber-950/80';
    return 'text-rose-400 border-rose-500/40 bg-rose-950/80';
  };

  const getZScoreLabel = (z: number) => {
    if (z >= 2.99) return 'Zona Segura (Solvência Alta)';
    if (z >= 1.81) return 'Zona Cinzenta (Atenção)';
    return 'Zona de Distress (Risco Crítico)';
  };

  // Trajectory points calculation for SVG incorporating dynamic market volatility
  const volMultipliers = {
    LOW: { label: 'Baixa (5%)', sigma: 0.05, m6Spread: 0.06, m12Spread: 0.09, m24Spread: 0.12, zPenalty: 0.08, varPct: 12 },
    MEDIUM: { label: 'Média (15%)', sigma: 0.15, m6Spread: 0.14, m12Spread: 0.22, m24Spread: 0.30, zPenalty: 0.25, varPct: 30 },
    HIGH: { label: 'Alta (30%)', sigma: 0.30, m6Spread: 0.26, m12Spread: 0.40, m24Spread: 0.52, zPenalty: 0.65, varPct: 52 }
  };
  const activeVolConfig = volMultipliers[marketVolatility];

  const cf = currentScenario.cashFlowProjection;
  const bf = currentScenario.baselineCashFlow;

  const upperM6 = cf.m6 * (1 + activeVolConfig.m6Spread);
  const lowerM6 = cf.m6 * (1 - activeVolConfig.m6Spread);
  const upperM12 = cf.m12 * (1 + activeVolConfig.m12Spread);
  const lowerM12 = cf.m12 * (1 - activeVolConfig.m12Spread);
  const upperM24 = cf.m24 * (1 + activeVolConfig.m24Spread);
  const lowerM24 = cf.m24 * (1 - activeVolConfig.m24Spread);

  const dynamicZProjected = Number(Math.max(0.5, currentScenario.altmanZProjected - activeVolConfig.zPenalty).toFixed(2));
  const dynamicRiskCategory: 'SAFE' | 'GREY' | 'DISTRESS' = 
    dynamicZProjected >= 2.99 ? 'SAFE' : dynamicZProjected >= 1.81 ? 'GREY' : 'DISTRESS';

  const allVals = [
    cf.m0, cf.m6, cf.m12, cf.m24,
    bf.m0, bf.m6, bf.m12, bf.m24,
    upperM6, lowerM6, upperM12, lowerM12, upperM24, lowerM24
  ];
  const maxVal = Math.max(...allVals) * 1.15;
  const minVal = Math.min(...allVals) * 0.85;

  const getY = (val: number) => {
    const range = maxVal - minVal;
    const norm = (val - minVal) / (range || 1);
    return 180 - norm * 140; // 40px top to 180px bottom
  };

  const baselinePoints = `50,${getY(bf.m0)} 200,${getY(bf.m6)} 350,${getY(bf.m12)} 500,${getY(bf.m24)}`;
  const projectedPoints = `50,${getY(cf.m0)} 200,${getY(cf.m6)} 350,${getY(cf.m12)} 500,${getY(cf.m24)}`;
  const confidencePolygonPoints = `50,${getY(cf.m0)} 200,${getY(upperM6)} 350,${getY(upperM12)} 500,${getY(upperM24)} 500,${getY(lowerM24)} 350,${getY(lowerM12)} 200,${getY(lowerM6)} 50,${getY(cf.m0)}`;

  return (
    <div id="counterfactual-oracle-panel" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="Oráculo de Previsibilidade Contrafactual"
        currentCnpj={tenantProfile.cnpj}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-[var(--vx-neon)]/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--vx-neon)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--vx-neon)]/15 text-[var(--vx-neon)] border border-[var(--vx-neon)]/40 uppercase tracking-wider">
                Simulador Estocástico Monte Carlo (10.000 Runs)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Altman Z-Score D+24
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Segmento: {SECTORS_LIST.find(s => s.key === activeSector)?.name || 'Customizado'}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[var(--vx-neon)] animate-pulse" />
              <span>Oráculo de Previsibilidade Contrafactual</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
              Simule o impacto de decisões estratégicas de grande porte no balanço patrimonial, liquidez de caixa D+24 e risco de insolvência antes de assinar contratos.
            </p>
          </div>

          <button
            type="button"
            disabled={isSimulating}
            onClick={handleRunMonteCarlo}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--vx-neon)] to-cyan-400 hover:from-cyan-400 hover:to-[var(--vx-neon)] text-slate-950 font-black text-xs transition-all shadow-xl shadow-[var(--vx-neon)]/20 cursor-pointer flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Calculando Monte Carlo...' : 'Executar Nova Simulação (10k)'}</span>
          </button>
        </div>

        {isSimulating && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 animate-in fade-in">
            <div className="flex justify-between text-xs font-mono text-cyan-300">
              <span>Iterando trajetórias estocásticas de liquidez para {SECTORS_LIST.find(s => s.key === activeSector)?.name}...</span>
              <span>{simulationProgress}%</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-[var(--vx-neon)] h-full transition-all duration-200"
                style={{ width: `${simulationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher Tabs (Expansion Monte Carlo vs 365D Liquidity Oracle vs Tesla Stress Test) */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-[var(--vx-deep)] p-2 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setOracleMode('STRATEGIC_MONTE_CARLO')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            oracleMode === 'STRATEGIC_MONTE_CARLO'
              ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/60 shadow-lg shadow-cyan-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>1. Expansão (Monte Carlo D+24)</span>
        </button>

        <button
          type="button"
          onClick={() => setOracleMode('LIQUIDITY_PREDICTIVE_365')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            oracleMode === 'LIQUIDITY_PREDICTIVE_365'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>2. Oráculo de Liquidez (365 Dias)</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
            e-CAC DCOMP
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOracleMode('TESLA_STRESS_TEST')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 w-full ${
            oracleMode === 'TESLA_STRESS_TEST'
              ? 'bg-rose-950/80 text-rose-300 border border-rose-500 shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>3. Tesla Stress Test (Choques)</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
            Sensível ao Setor
          </span>
        </button>
      </div>

      {/* Sector Switcher Bar (Available across all Oracle modes) */}
      <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-mono text-slate-400 font-bold uppercase shrink-0 px-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
            <span>Segmento ({SECTORS_LIST.find(s => s.key === activeSector)?.name}):</span>
          </span>
          {SECTORS_LIST.map(sec => {
            const isSecActive = activeSector === sec.key;
            const SecIcon = sec.icon;
            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => handleSelectSector(sec.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isSecActive
                    ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border border-[var(--vx-neon)]/50 shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <SecIcon className="w-3.5 h-3.5" />
                <span>{sec.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeStressNotification && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/50 text-slate-200 text-xs font-mono flex items-center justify-between animate-in fade-in shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeStressNotification}</span>
          </div>
          <button onClick={() => setActiveStressNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* RENDER MODE 2: TESLA ENTERPRISE STRESS TEST */}
      {oracleMode === 'TESLA_STRESS_TEST' ? (
        <div id="tesla-stress-test-container" className="space-y-6 animate-in fade-in duration-200">
          
          {/* Stress Test Header / Controls Bar */}
          <div className="bg-[var(--vx-deep)] border border-rose-500/40 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-tight font-mono flex items-center gap-2">
                    <span>Simulação de Ruptura & Choques ({SECTORS_LIST.find(s => s.key === activeSector)?.name})</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Descubra qual nó da estrutura financeira de {SECTORS_LIST.find(s => s.key === activeSector)?.name} rompe primeiro sob estresse extremo.
                  </p>
                </div>
              </div>

              {/* Intensity Toggles */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-slate-400 mr-1 uppercase">Severidade do Choque:</span>
                {(['MODERATE', 'SEVERE', 'EXTREME'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setShockIntensity(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      shockIntensity === lvl
                        ? 'bg-rose-900 text-rose-100 border border-rose-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {lvl === 'MODERATE' ? 'Moderado (+15%)' : lvl === 'SEVERE' ? 'Severo (+30%)' : 'Extremo (+50%)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Shock Scenarios Selector Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stressShocks.map((shock) => {
                const isSelected = selectedShockId === shock.id;
                const ShockIcon = shock.icon;
                return (
                  <div
                    key={shock.id}
                    onClick={() => setSelectedShockId(shock.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-gradient-to-br from-rose-950/80 to-slate-950 border-rose-500 text-white shadow-lg shadow-rose-950/50'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-900 text-slate-400'}`}>
                          <ShockIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-rose-300 border border-rose-900/60">
                          {shock.category}
                        </span>
                      </div>
                      <strong className="text-xs font-bold text-slate-100 block line-clamp-2">
                        {shock.title}
                      </strong>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">Parâmetro:</span>
                      <span className="text-amber-400 font-bold truncate max-w-[120px]">{shock.shockParameter}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stress Results Grid: Primary Break Point & Failure Sequence */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT: FIRST BREAK POINT (O QUE QUEBRA PRIMEIRO?) - 7 Cols */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* The "First Break Point" Spotlight Card */}
              <div className="bg-gradient-to-br from-[var(--vx-deep)] via-slate-950 to-slate-950 border-2 border-rose-500/60 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600 uppercase animate-pulse">
                      Diagnóstico de Ruptura Primária
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Ruptura estimada em <strong className="text-rose-400">{currentShock.firstBreakPoint.timeline}</strong>
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Perda Estimada: {currentShock.firstBreakPoint.financialLoss}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Qual parte da estrutura financeira quebra primeiro?
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-rose-200 tracking-tight">
                    {currentShock.firstBreakPoint.component}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    {currentShock.firstBreakPoint.detailedCause}
                  </p>
                </div>

                {/* 3 Impact Key Indicators */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Altman Z Pós-Choque</span>
                    <strong className="text-base font-black text-rose-400 font-mono">
                      {currentShock.altmanZPostShock.toFixed(2)}
                    </strong>
                    <span className="text-[9px] text-rose-400/80 block font-mono">Zona de Distress</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Runway de Caixa</span>
                    <strong className="text-base font-black text-amber-400 font-mono">
                      {currentShock.cashRunwayMonthsPostShock} Meses
                    </strong>
                    <span className="text-[9px] text-amber-400/80 block font-mono">Margem Crítica</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block">Ruptura Primária</span>
                    <strong className="text-base font-black text-cyan-300 font-mono">
                      {currentShock.firstBreakPoint.timeline}
                    </strong>
                    <span className="text-[9px] text-cyan-400/80 block font-mono">Tempo de Reação</span>
                  </div>
                </div>
              </div>

              {/* Structural Break Sequence (Linha do Tempo de Falhas em Cadeia) */}
              <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Efeito Dominó da Falha (Sequência Estrutural)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">4 Estágios de Propagação</span>
                </div>

                <div className="space-y-2.5">
                  {currentShock.structuralBreakSequence.map((step) => (
                    <div 
                      key={step.step}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                          step.status === 'BROKEN'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : step.status === 'AT_RISK'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {step.step}
                        </span>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-100">{step.entity}</strong>
                            <span className="text-[10px] font-mono text-slate-400">({step.timeline})</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{step.impact}</p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 border ${
                        step.status === 'BROKEN'
                          ? 'bg-rose-950 text-rose-300 border-rose-800'
                          : step.status === 'AT_RISK'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {step.status === 'BROKEN' ? 'ROMPE' : step.status === 'AT_RISK' ? 'EM RISCO' : 'RESILIENTE'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT: AUTONOMOUS MITIGATIONS & LEDGER INJECTION - 5 Cols */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Autonomous Countermeasures Box */}
              <div className="bg-gradient-to-br from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-cyan-500/40 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-[var(--vx-neon)]" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                      Contramedidas Autônomas Tesla
                    </h3>
                    <span className="text-[10px] text-slate-400">Disparo automático para blindagem de caixa</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Ao identificar o vetor de ruptura de <strong className="text-cyan-300">{currentShock.firstBreakPoint.component}</strong>, o AOS sugere a ativação imediata das seguintes travas no ERP:
                </p>

                <div className="space-y-2">
                  {currentShock.autonomousCountermeasures.map((cm, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-900/40 flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-[var(--vx-neon-green)] shrink-0 mt-0.5" />
                      <span className="text-slate-200 font-medium leading-tight">{cm}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <button
                    type="button"
                    onClick={handleApplyStressSafeguards}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-[var(--vx-neon-green)] hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-xl shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>Injetar Salvaguardas & Gravar no Ledger de Auditoria</span>
                  </button>

                  <p className="text-[10px] font-mono text-center text-slate-400">
                    Cria bloco de auditoria imutável com prova criptográfica Secp256k1.
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>
      ) : oracleMode === 'LIQUIDITY_PREDICTIVE_365' ? (
        <LiquidityPredictiveOracleCard 
          tenantProfile={tenantProfile}
          onAddAuditRecord={onAddAuditRecord}
        />
      ) : (
        /* RENDER MODE 1: STRATEGIC MONTE CARLO EXPANSION */
        <>
          {/* Main Grid: Decision Selector (Left) & Results View (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: SCENARIO SELECTOR & VOLATILITY CONTROLS (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--vx-neon)]" />
                <span>Cenários ({SECTORS_LIST.find(s => s.key === activeSector)?.name})</span>
              </h2>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">{scenarios.length} Cenários</span>
            </div>

            <div className="space-y-2.5">
              {scenarios.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                const Icon = scenario.icon;
                return (
                  <div
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenarioId(scenario.id);
                      handleRunMonteCarlo();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border-[var(--vx-neon)] text-white shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)]' : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                          {scenario.category}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getZScoreColor(scenario.altmanZProjected)}`}>
                        Z: {scenario.altmanZProjected.toFixed(2)}
                      </span>
                    </div>

                    <strong className="text-xs font-bold block text-slate-100 line-clamp-2">
                      {scenario.title}
                    </strong>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Volatility Setting */}
            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Nível de Volatilidade de Mercado
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((vol) => (
                  <button
                    key={vol}
                    type="button"
                    onClick={() => {
                      setMarketVolatility(vol);
                      handleRunMonteCarlo();
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      marketVolatility === vol
                        ? 'bg-[var(--vx-neon)]/20 border-[var(--vx-neon)] text-[var(--vx-neon)]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {vol === 'LOW' ? 'Baixa (5%)' : vol === 'MEDIUM' ? 'Média (15%)' : 'Alta (30%)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIMULATION METRICS & TRAJECTORY GRAPH (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Top Metric Cards: Altman Z-Score & Cash Flow Delta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Altman Z-Score Baseline vs Post */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Altman Z-Score</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${getZScoreColor(dynamicZProjected)}`}>
                  {dynamicRiskCategory}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-100 font-mono">
                  {dynamicZProjected.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400 line-through">
                  {currentScenario.altmanZBaseline.toFixed(2)}
                </span>
                <span className={`text-xs font-bold font-mono ${
                  dynamicZProjected >= currentScenario.altmanZBaseline ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {dynamicZProjected >= currentScenario.altmanZBaseline ? '▲' : '▼'} 
                  {Math.abs(dynamicZProjected - currentScenario.altmanZBaseline).toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {getZScoreLabel(dynamicZProjected)} • Volatilidade {activeVolConfig.label}
              </p>
            </div>

            {/* Liquidity Valley / Peak in Month 24 */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Caixa Projetado (M24)</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  VaR 95%: {formatCurrency(lowerM24)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[var(--vx-neon)] font-mono">
                  {formatCurrency(currentScenario.cashFlowProjection.m24)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Faixa Estocástica: <strong className="text-slate-300">{formatCurrency(lowerM24)}</strong> a <strong className="text-emerald-400">{formatCurrency(upperM24)}</strong>
              </p>
            </div>

            {/* Payback / Breakeven Horizon */}
            <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-2 shadow-xl">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Impacto Imediato de Caixa</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {currentScenario.financialParameters.capexImmediate > 0 
                    ? `-R$ ${(currentScenario.financialParameters.capexImmediate / 1000000).toFixed(2)}M`
                    : `+R$ ${(Math.abs(currentScenario.financialParameters.capexImmediate) / 1000000).toFixed(2)}M`
                  }
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                CapEx / Alavancagem Inicial D+0
              </p>
            </div>

          </div>

          {/* TRAJECTORY GRAPH (SVG Simulation 0, 6, 12, 24 Months) */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--vx-neon)]" />
                  <span>Trajetória Estocástica de Caixa (M0 ➔ M24)</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Comparação da trajetória inercial vs cenário contrafactual com intervalo estocástico ({activeVolConfig.label})
                </span>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-slate-500 border-dashed" />
                  <span className="text-slate-400 text-[11px]">Inércia</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-[var(--vx-neon)] rounded-full shadow-sm shadow-[var(--vx-neon)]" />
                  <span className="text-[var(--vx-neon)] font-bold text-[11px]">Esperado (MC)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-cyan-400/40 border border-cyan-400/80 rounded-sm" />
                  <span className="text-cyan-300 text-[11px]">Banda P5%-P95%</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative w-full h-56 bg-slate-950 rounded-2xl border border-slate-900 p-2 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 550 200" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="40" y1="40" x2="520" y2="40" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="90" x2="520" y2="90" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="140" x2="520" y2="140" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="40" y1="180" x2="520" y2="180" stroke="#334155" />

                {/* Baseline Gray Dashed Line */}
                <polyline
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points={baselinePoints}
                />

                {/* Confidence Interval Funnel / Shading for Contrafactual */}
                <polygon
                  fill="url(#confidenceGradient)"
                  opacity="0.25"
                  points={confidencePolygonPoints}
                />

                {/* Upper P95 Bound Line */}
                <polyline
                  fill="none"
                  stroke="#00F2FF"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.5"
                  points={`50,${getY(cf.m0)} 200,${getY(upperM6)} 350,${getY(upperM12)} 500,${getY(upperM24)}`}
                />

                {/* Lower P5 Bound Line (VaR 95%) */}
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.6"
                  points={`50,${getY(cf.m0)} 200,${getY(lowerM6)} 350,${getY(lowerM12)} 500,${getY(lowerM24)}`}
                />

                {/* Projected Glowing Cyan Line */}
                <polyline
                  fill="none"
                  stroke="#00F2FF"
                  strokeWidth="3.5"
                  points={projectedPoints}
                />

                {/* Data Points */}
                {[
                  { x: 50, y: getY(cf.m0), label: 'M0', val: cf.m0 },
                  { x: 200, y: getY(cf.m6), label: 'M6', val: cf.m6 },
                  { x: 350, y: getY(cf.m12), label: 'M12', val: cf.m12 },
                  { x: 500, y: getY(cf.m24), label: 'M24', val: cf.m24 }
                ].map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5" fill="#00F2FF" stroke="#0f172a" strokeWidth="2" />
                    <text x={pt.x} y={pt.y - 10} fill="#e2e8f0" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {formatCurrency(pt.val)}
                    </text>
                    <text x={pt.x} y="195" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
                      {pt.label}
                    </text>
                  </g>
                ))}

                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00F2FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00F2FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Months Milestone Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 block">D+0 (Hoje)</span>
                <strong className="text-slate-200">{formatCurrency(cf.m0)}</strong>
                <span className="text-[9px] text-slate-500 block mt-0.5">Dispersão: ±0%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 block">Mês +6</span>
                <strong className={cf.m6 >= bf.m6 ? 'text-emerald-400' : 'text-amber-400'}>{formatCurrency(cf.m6)}</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ±{Math.round(activeVolConfig.m6Spread * 100)}% ({formatCurrency(lowerM6)} - {formatCurrency(upperM6)})
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 block">Mês +12</span>
                <strong className={cf.m12 >= bf.m12 ? 'text-emerald-400' : 'text-slate-200'}>{formatCurrency(cf.m12)}</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  ±{Math.round(activeVolConfig.m12Spread * 100)}% ({formatCurrency(lowerM12)} - {formatCurrency(upperM12)})
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-900">
                <span className="text-[10px] text-slate-500 block">Mês +24</span>
                <strong className={cf.m24 >= bf.m24 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(cf.m24)}</strong>
                <span className="text-[9px] text-cyan-300 block mt-0.5 font-bold">
                  ±{Math.round(activeVolConfig.m24Spread * 100)}% ({formatCurrency(lowerM24)} - {formatCurrency(upperM24)})
                </span>
              </div>
            </div>
          </div>

          {/* AI Risk Verdict & Recommended Safeguards */}
          <div className="bg-gradient-to-br from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                Parecer Contrafactual do Agente CFO & Salvaguardas
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentScenario.aiVerdictSummary}
            </p>

            {/* Volatility Sensitivity Analysis Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-slate-300">
                  Calibração Estocástica: <strong className="text-white">Volatilidade {activeVolConfig.label}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-400">
                  VaR 95% M24: <strong className="text-rose-400">{formatCurrency(lowerM24)}</strong>
                </span>
                <span className="text-slate-400">
                  P95% M24: <strong className="text-emerald-400">{formatCurrency(upperM24)}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Salvaguardas Invariantes Recomendadas para Implantação no ERP:
              </span>
              <div className="space-y-1.5">
                {currentScenario.recommendedSafeguards.map((sg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                    <span className="text-slate-200 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{sg}</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      ATIVO
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </>
  )}

    </div>
  );
};
