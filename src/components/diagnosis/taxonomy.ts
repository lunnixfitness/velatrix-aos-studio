import React from 'react';
import { 
  Building2, 
  ShoppingBag, 
  HeartPulse, 
  Briefcase, 
  Wheat, 
  Truck,
  Layers,
  HardHat,
  Zap,
  Car
} from 'lucide-react';

export interface SectorRiskProfile {
  sectorKey: string;
  name: string;
  subName: string;
  icon: React.ComponentType<any>;
  color: string;
  borderColor: string;
  bgLight: string;
  defaultCompany: {
    name: string;
    cnpj: string;
    annualRevenueBrl: number;
    dailyVolume: string;
    declaredEbitdaMarginPercent: number;
    workingCapitalBrl: number;
    totalAssetsBrl: number;
    retainedEarningsBrl: number;
    totalLiabilitiesBrl: number;
  };
  surgicalTriggerQuestion: {
    pt: string;
    en: string;
    es: string;
  };
  vulnerabilities: {
    category: string;
    title: string;
    description: string;
    dailyCostBrl: number;
    frequencyDaysPerYear: number;
    impactLabel: string;
  }[];
  lossMath: {
    downtimeDailyCostBrl: number;
    leakageRatePercent: number;
    operationalInefficiencyPercent: number;
    slaTierGuarantee: string;
    tacticalCostRate: number;
    manualIncidentLossDays: number;
    workingCapitalRatio: number;
  };
  predictiveResolution: {
    graphAction: string;
    agentsOrchestrated: string[];
    scenarioToInject: string;
    recoveryHours: string;
    ebitdaProtectionPercent: string;
  };
}

export function FactoryIcon(props: any) {
  return React.createElement(Layers, props);
}

export function AutoPartsIcon(props: any) {
  return React.createElement(Car, props);
}

export const MULTI_SECTOR_TAXONOMY: SectorRiskProfile[] = [
  {
    sectorKey: 'auto_parts',
    name: 'Autopeças & Motopeças',
    subName: 'Tributação Concentrada & Monofásica (Lei 10.485/02)',
    icon: AutoPartsIcon,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgLight: 'bg-cyan-950/20',
    defaultCompany: {
      name: 'Motrix Componentes Automotivos Ltda.',
      cnpj: '21.554.870/0001-33',
      annualRevenueBrl: 38400000,
      dailyVolume: '12.800 componentes / dia',
      declaredEbitdaMarginPercent: 19.2,
      workingCapitalBrl: 8500000,
      totalAssetsBrl: 32000000,
      retainedEarningsBrl: 6200000,
      totalLiabilitiesBrl: 14000000
    },
    surgicalTriggerQuestion: {
      pt: 'Na revenda de autopeças sujeitas ao regime monofásico da Lei 10.485/2002, o seu ERP está segregando as notas fiscais com CST 04 (Alíquota Zero) ou você continua recolhendo 9,25% de PIS/COFINS em duplicidade na saída?',
      en: 'In the resale of auto parts subject to the monofasic regime of Law 10,485/2002, is your ERP segregating invoices with CST 04 (Zero Rate) or are you still paying 9.25% PIS/COFINS twice on outgoing sales?',
      es: 'En la reventa de autopartes sujetas al régimen monofásico de la Ley 10.485/2002, ¿su ERP está segregando las facturas con CST 04 (Tasa Cero) o sigue pagando el 9,25% de PIS/COFINS por duplicado en la salida?'
    },
    vulnerabilities: [
      {
        category: 'Tributação Monofásica & Insumos',
        title: 'Recolhimento Indevido de PIS/COFINS Monofásico na Revenda',
        description: 'Venda de autopeças e motopeças tributadas com CST 01/51 em vez de CST 04 (alíquota zero), acumulando bitributação com a indústria.',
        dailyCostBrl: 135000,
        frequencyDaysPerYear: 30,
        impactLabel: 'Bitributação Monofásica'
      },
      {
        category: 'Substituição Tributária Estadual',
        title: 'Falta de Exclusão do ICMS-ST na Base das Contribuições (Tema 1125 STJ)',
        description: 'Não segregação do ICMS recolhido por substituição tributária nas operações de autopeças, inflando a base de cálculo.',
        dailyCostBrl: 72000,
        frequencyDaysPerYear: 24,
        impactLabel: 'ICMS-ST na Base PIS/COFINS'
      },
      {
        category: 'Usinagem & Ferramentaria',
        title: 'Créditos Extemporâneos Não Aproveitados sobre Ferramentas e Fluidos',
        description: 'Fluidos de corte, moldes e ferramentas de usinagem tratados como despesa operacional em vez de insumo não-cumulativo essencial.',
        dailyCostBrl: 48000,
        frequencyDaysPerYear: 20,
        impactLabel: 'Insumos Industriais Essenciais'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 145000,
      leakageRatePercent: 4.8,
      operationalInefficiencyPercent: 3.2,
      slaTierGuarantee: 'Tier 1 Automotivo D+0',
      tacticalCostRate: 0.12,
      manualIncidentLossDays: 18,
      workingCapitalRatio: 0.22
    },
    predictiveResolution: {
      graphAction: 'Segregação Monofásica e-CAC DCOMP D+0',
      agentsOrchestrated: ['Tax Neural Engine', 'SPED Ingestion Swarm', 'PER/DCOMP Automation'],
      scenarioToInject: 'Recuperação Monofásica Autopeças (Lei 10.485/02)',
      recoveryHours: '48h',
      ebitdaProtectionPercent: '+4.2% EBITDA'
    }
  },
  {
    sectorKey: 'manufacturing',
    name: 'Indústria & Manufatura',
    subName: 'Automotiva, Metalmecânica, Química & Bens de Capital',
    icon: FactoryIcon,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    bgLight: 'bg-amber-950/20',
    defaultCompany: {
      name: 'Nexus Indústria & Autopeças S/A',
      cnpj: '18.492.301/0001-84',
      annualRevenueBrl: 180000000,
      dailyVolume: '45.000 unidades / dia',
      declaredEbitdaMarginPercent: 18.5,
      workingCapitalBrl: 32000000,
      totalAssetsBrl: 140000000,
      retainedEarningsBrl: 28000000,
      totalLiabilitiesBrl: 65000000
    },
    surgicalTriggerQuestion: {
      pt: 'Se um fornecedor de Tier-2 na Ásia sofrer um atraso aduaneiro de 72h hoje, em quantos minutos a sua linha de montagem principal para e qual é o custo exato por hora ociosa no seu chão de fábrica?',
      en: 'If a Tier-2 supplier in Asia suffers a 72-hour customs delay today, in how many minutes does your main assembly line halt, and what is the exact idle-time cost per hour on your factory floor?',
      es: 'Si un proveedor Tier-2 en Asia sufre un retraso aduanero de 72 horas hoy, ¿en cuántos minutos se detiene su línea de ensamblaje principal y cuál es el costo exacto por hora ociosa en su planta?'
    },
    vulnerabilities: [
      {
        category: 'Cadeia de Suprimentos & Insumos',
        title: 'Ruptura Crítica de Lista de Materiais (BOM)',
        description: 'Dependência de fornecedores de peça única sem redundância telemétrica. A falta de 1 microcomponente trava 100% da produção de lotes de alto valor agregado.',
        dailyCostBrl: 185000,
        frequencyDaysPerYear: 14,
        impactLabel: 'Parada de Linha / Ruptura de Estoque'
      },
      {
        category: 'Chão de Fábrica & Execução',
        title: 'Paradas Não Programadas e Refugo por Setup Incorreto',
        description: 'Ajustes reativos de maquinário acionados após falhas de qualidade, gerando refugo de matéria-prima e ociosidade de mão de obra direta.',
        dailyCostBrl: 92000,
        frequencyDaysPerYear: 28,
        impactLabel: 'Refugo & Ociosidade Fabril'
      },
      {
        category: 'Fiscal, Compliance & Variação Cambial',
        title: 'Exposição de Câmbio em Insumos Importados & Multas SPED',
        description: 'Oscilações do dólar desprotegidas por hedge automatizado e divergências cadastrais de NCM na emissão da NF-e gerando retenções fiscais.',
        dailyCostBrl: 64000,
        frequencyDaysPerYear: 18,
        impactLabel: 'Margem Líquida Comprimida'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 280000,
      leakageRatePercent: 3.8,
      operationalInefficiencyPercent: 5.4,
      slaTierGuarantee: '99.6% Assegurado (Zero Parada Fabril)',
      tacticalCostRate: 0.082,
      manualIncidentLossDays: 2.8,
      workingCapitalRatio: 0.178
    },
    predictiveResolution: {
      graphAction: 'O Grafo Semântico do AOS recalcula instantaneamente a árvore de BOM, aciona fornecedor homologado alternativo via webhook ERP e ajusta ordem de produção em 850ms.',
      agentsOrchestrated: [
        'Agente de Compras & Hedge Cambial',
        'Agente de Logística & Roteirização',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Crise de Fornecedor Crítico',
      recoveryHours: '< 1 hora (vs 48h manuais)',
      ebitdaProtectionPercent: '+4.2% na Margem Operacional'
    }
  },
  {
    sectorKey: 'logistics',
    name: 'Logística & Transporte',
    subName: 'Transporte Rodoviário, 3PL, Armazenagem & Last-Mile',
    icon: Truck,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/40',
    bgLight: 'bg-sky-950/20',
    defaultCompany: {
      name: 'TransLogix Malha Rodoviária Nacional',
      cnpj: '24.108.552/0001-90',
      annualRevenueBrl: 120000000,
      dailyVolume: '3.200 entregas / dia',
      declaredEbitdaMarginPercent: 14.2,
      workingCapitalBrl: 18000000,
      totalAssetsBrl: 95000000,
      retainedEarningsBrl: 15000000,
      totalLiabilitiesBrl: 52000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual porcentagem do seu frete líquido é pulverizada todo mês por reprogramação manual de rotas, quebras de SLA com multas contratuais e flutuações repentinas no preço do diesel?',
      en: 'What percentage of your net freight margin is drained each month by manual route rescheduling, contractual SLA penalty breaches, and sudden diesel price spikes?',
      es: '¿Qué porcentaje de su margen neto de flete se drena cada mes por reprogramación manual de rutas, multas de SLA contractuales y alzas del diésel?'
    },
    vulnerabilities: [
      {
        category: 'Operação de Frota & Roteirização',
        title: 'Ociosidade de Retorno (Empty Miles) & Gargalos Last-Mile',
        description: 'Caminhões retornando sem carga de compensação por ausência de cruzamento preditivo de demanda inter-filiais em tempo real.',
        dailyCostBrl: 78000,
        frequencyDaysPerYear: 35,
        impactLabel: 'Queima de Margem de Frete'
      },
      {
        category: 'Contratos & Clientes',
        title: 'Penalidades por Quebra de SLA de Janela de Entrega',
        description: 'Atrasos no descarregamento em centros de distribuição gerando taxas de estadia (demurrage) e descontos forçados no frete.',
        dailyCostBrl: 45000,
        frequencyDaysPerYear: 24,
        impactLabel: 'Multas Contratuais de Clientes'
      },
      {
        category: 'Segurança da Informação & TMS',
        title: 'Ataques de Ransomware & Parada de Gate em Terminais',
        description: 'Vulnerabilidades em sistemas TMS legados paralisando a emissão de CT-e / MDF-e e gerando filas quilométricas de carretas.',
        dailyCostBrl: 140000,
        frequencyDaysPerYear: 8,
        impactLabel: 'Paralisação de Faturamento'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 165000,
      leakageRatePercent: 4.5,
      operationalInefficiencyPercent: 7.2,
      slaTierGuarantee: '99.8% Assegurado (Janela Last-Mile)',
      tacticalCostRate: 0.095,
      manualIncidentLossDays: 2.2,
      workingCapitalRatio: 0.150
    },
    predictiveResolution: {
      graphAction: 'O AOS identifica anomalias de tráfego e bloqueios de frota, reatribui cargas para transportadoras parceiras e emite MDF-e contingencial com assinatura criptográfica Secp256k1.',
      agentsOrchestrated: [
        'Agente de Roteirização & Frota',
        'Agente de Logística Multimodal',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Ransomware na Transportadora',
      recoveryHours: '12 minutos (vs 18h manuais)',
      ebitdaProtectionPercent: '+5.8% no Frete Líquido'
    }
  },
  {
    sectorKey: 'retail',
    name: 'Distribuição, Varejo & E-Commerce',
    subName: 'Omnichannel, Redes Varejistas, B2B Wholesalers & Marketplaces',
    icon: ShoppingBag,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/40',
    bgLight: 'bg-violet-950/20',
    defaultCompany: {
      name: 'OmniVarejo Brasil Distribuição S/A',
      cnpj: '09.314.887/0001-12',
      annualRevenueBrl: 240000000,
      dailyVolume: '62.000 SKUs ativos',
      declaredEbitdaMarginPercent: 12.8,
      workingCapitalBrl: 42000000,
      totalAssetsBrl: 160000000,
      retainedEarningsBrl: 31000000,
      totalLiabilitiesBrl: 98000000
    },
    surgicalTriggerQuestion: {
      pt: 'Quanto capital de giro está agora imobilizado em estoques de baixa rotação nos seus centros de distribuição enquanto seus produtos campeões sofrem ruptura de venda nos canais digitais?',
      en: 'How much working capital is currently trapped in slow-moving inventory in your warehouses while your best-selling SKUs suffer out-of-stock lost sales in digital channels?',
      es: '¿Cuánto capital de trabajo está atrapado en inventario de baja rotación mientras sus productos estrella sufren rotura de stock en canales digitales?'
    },
    vulnerabilities: [
      {
        category: 'Gestão de Estoques & CDs',
        title: 'Ruptura Fantasma (Out-of-Stock) em Dias de Pico',
        description: 'Divergência entre o inventário do ERP e o estoque físico real nas prateleiras dos CDs durante campanhas promocionais de alto tráfego.',
        dailyCostBrl: 210000,
        frequencyDaysPerYear: 16,
        impactLabel: 'Venda Perdida Irrecuperável'
      },
      {
        category: 'Logística Reversa & Devoluções',
        title: 'Custo Oculto de Avarias e Devoluções Não Processadas',
        description: 'Mercadorias devolvidas acumuladas em esteiras sem triagem automatizada, sofrendo obsolescência e depreciação contábil.',
        dailyCostBrl: 55000,
        frequencyDaysPerYear: 40,
        impactLabel: 'Depreciação de Ativo Corrente'
      },
      {
        category: 'Preços & Rentabilidade',
        title: 'Erosão de Margem por Descontos Descoordenados',
        description: 'Equipes comerciais concedendo margens excessivas em canais B2B sem validação de impacto no fluxo de caixa consolidado.',
        dailyCostBrl: 85000,
        frequencyDaysPerYear: 30,
        impactLabel: 'Diluição da Margem Bruta'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 350000,
      leakageRatePercent: 3.2,
      operationalInefficiencyPercent: 6.0,
      slaTierGuarantee: '99.7% Assegurado (Zero Ruptura em Pico)',
      tacticalCostRate: 0.075,
      manualIncidentLossDays: 2.0,
      workingCapitalRatio: 0.175
    },
    predictiveResolution: {
      graphAction: 'O AOS detecta o pico de pedidos nos canais B2B/E-commerce, orquestra remanejamento automático entre CDs e emite ordens de compra spot respeitando a Invariante de Margem Mínima.',
      agentsOrchestrated: [
        'Agente de Pricing & Demanda',
        'Agente de Logística Omnichannel',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Pico de Demanda B2B (+65%)',
      recoveryHours: 'Imediato (em tempo real)',
      ebitdaProtectionPercent: '+3.9% no GMV Realizado'
    }
  },
  {
    sectorKey: 'healthcare',
    name: 'Saúde & Hospitalar',
    subName: 'Hospitais, Redes de Diagnóstico, Farmacêuticas & Saúde Suplementar',
    icon: HeartPulse,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    bgLight: 'bg-rose-950/20',
    defaultCompany: {
      name: 'BioHospitalis Rede de Saúde & Farma S/A',
      cnpj: '33.801.442/0001-55',
      annualRevenueBrl: 310000000,
      dailyVolume: '4.800 atendimentos / dia',
      declaredEbitdaMarginPercent: 21.0,
      workingCapitalBrl: 58000000,
      totalAssetsBrl: 220000000,
      retainedEarningsBrl: 44000000,
      totalLiabilitiesBrl: 110000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual é o volume de receita retida por glosas hospitalares de operadoras e qual seria o custo reputacional e regulatório perante a ANVISA se um lote de medicamentos termossensíveis sofresse quebra de temperatura?',
      en: 'What is the volume of revenue frozen by health insurer audit rejections, and what would be the regulatory penalty if a batch of temperature-sensitive drugs suffered cold chain failure?',
      es: '¿Cuál es el volumen de ingresos bloqueados por glosas de aseguradoras y el impacto regulatorio ante ANVISA por falla en cadena de frío?'
    },
    vulnerabilities: [
      {
        category: 'Cadeia de Frio & Suprimentos Médicos',
        title: 'Descarte de Insumos Críticos por Variação Térmica',
        description: 'Falhas de sensores telemétricos em câmaras frias sem protocolo autônomo de acionamento de gerador ou remanejamento de vacinas/hemoderivados.',
        dailyCostBrl: 320000,
        frequencyDaysPerYear: 6,
        impactLabel: 'Perda Total de Lotes Críticos'
      },
      {
        category: 'Faturamento & Auditoria Médica',
        title: 'Glosas Hospitalares por Divergência de Prontuário e TISS',
        description: 'Atraso na autorização de OPME (Órteses, Próteses e Materiais Especiais) gerando descompasso de caixa de até 90 dias.',
        dailyCostBrl: 110000,
        frequencyDaysPerYear: 32,
        impactLabel: 'Travamento de Contas a Receber'
      },
      {
        category: 'Privacidade & Regulação',
        title: 'Vazamento de Prontuários (LGPD / HIPAA) e Multas ANVISA',
        description: 'Exposição de dados sensíveis de saúde por falta de quarentena criptográfica em canais de mensageria não autorizados.',
        dailyCostBrl: 190000,
        frequencyDaysPerYear: 4,
        impactLabel: 'Multas Regulatórias Graves'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 420000,
      leakageRatePercent: 4.1,
      operationalInefficiencyPercent: 8.5,
      slaTierGuarantee: '100.0% Assegurado (Cadeia de Frio Farma)',
      tacticalCostRate: 0.088,
      manualIncidentLossDays: 2.5,
      workingCapitalRatio: 0.187
    },
    predictiveResolution: {
      graphAction: 'O AOS recebe alerta de telemetria IoT da câmara fria, despacha transferência imediata de lotes para câmara de backup e emite NF-e de remessa com log de integridade auditável.',
      agentsOrchestrated: [
        'Agente de Cadeia Fria & Farmácia',
        'Agente de Faturamento TISS',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório & ANVISA',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Ruptura Cadeia de Frio Farma',
      recoveryHours: '< 15 minutos (antes da perda do lote)',
      ebitdaProtectionPercent: '+6.1% em Preservação de Ativos'
    }
  },
  {
    sectorKey: 'real_estate',
    name: 'Imobiliário, Construção & Real Estate',
    subName: 'Incorporadoras, Loteadoras, Fundos Imobiliários (FIIs) & Vendas High-End',
    icon: Building2,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    bgLight: 'bg-emerald-950/20',
    defaultCompany: {
      name: 'Vanguard Real Estate & Incorporações S/A',
      cnpj: '52.741.902/0001-38',
      annualRevenueBrl: 450000000,
      dailyVolume: 'VGV Ativo: R$ 850M',
      declaredEbitdaMarginPercent: 24.5,
      workingCapitalBrl: 95000000,
      totalAssetsBrl: 410000000,
      retainedEarningsBrl: 88000000,
      totalLiabilitiesBrl: 180000000
    },
    surgicalTriggerQuestion: {
      pt: 'Quantos milhões em comissões, taxas de escrow e juros de financiamento de obra sua empresa perde por trimestre devido à lentidão manual em certidões de RGI, cartórios e conciliação de recebíveis imobiliários?',
      en: 'How many millions in commissions, escrow custody delays, and construction loan interest does your company bleed each quarter due to manual notary and registry certificate bottlenecks?',
      es: '¿Cuántos millones en comisiones, demoras de custodia escrow e intereses de obra pierde su empresa por lentitud notarial y registral?'
    },
    vulnerabilities: [
      {
        category: 'Fechamento Comercial & Escrow',
        title: 'Travamento de Liquidação de VGV por Burocracia Notarial',
        description: 'Vendas de imóveis comerciais de alto valor travadas em bancos custodiantes por pendências em certidões vintenárias do RGI.',
        dailyCostBrl: 240000,
        frequencyDaysPerYear: 12,
        impactLabel: 'Custo de Oportunidade de Caixa'
      },
      {
        category: 'Canteiro de Obras & Suprimentos',
        title: 'Atraso de Cronograma Físico-Financeiro por Falta de Aço/Cimento',
        description: 'Multas contratuais de entrega de chaves disparadas por descompasso no fornecimento de insumos pesados para fundações e estruturas.',
        dailyCostBrl: 160000,
        frequencyDaysPerYear: 20,
        impactLabel: 'Multas de Atraso de Obra (INCC)'
      },
      {
        category: 'Comissões & Governança',
        title: 'Disputas de Split de Corretagem CRECI e Fraude em Títulos',
        description: 'Pagamento incorreto de comissões a intermediários por falta de contrato inteligente assinado criptograficamente.',
        dailyCostBrl: 70000,
        frequencyDaysPerYear: 15,
        impactLabel: 'Passivo Jurídico & Fiscal'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 480000,
      leakageRatePercent: 2.9,
      operationalInefficiencyPercent: 4.8,
      slaTierGuarantee: '100.0% Assegurado (Custódia Escrow D+0)',
      tacticalCostRate: 0.065,
      manualIncidentLossDays: 3.5,
      workingCapitalRatio: 0.211
    },
    predictiveResolution: {
      graphAction: 'O AOS valida automaticamente certidões de matrícula no RGI via e-Notariado, comanda a liberação de conta Escrow bancária e efetua o split automatizado de 6% CRECI.',
      agentsOrchestrated: [
        'Agente de Revenue Ops & Real Estate',
        'Agente de Due Diligence Notarial',
        'Agente de Tesouraria Escrow',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Fechamento de Portfólio Imobiliário Comercial Prime',
      recoveryHours: '< 24 horas (vs 45 dias manuais)',
      ebitdaProtectionPercent: '+4.5% no ROI do Empreendimento'
    }
  },
  {
    sectorKey: 'services',
    name: 'SaaS, Serviços B2B & Fintechs',
    subName: 'Empresas de Software, Consultorias Estratégicas, BPO & Bancos Digitais',
    icon: Briefcase,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    bgLight: 'bg-cyan-950/20',
    defaultCompany: {
      name: 'CloudCore Enterprise SaaS Corp',
      cnpj: '41.229.673/0001-44',
      annualRevenueBrl: 85000000,
      dailyVolume: 'ARR: R$ 85M • 420 Contas Enterprise',
      declaredEbitdaMarginPercent: 26.0,
      workingCapitalBrl: 22000000,
      totalAssetsBrl: 75000000,
      retainedEarningsBrl: 18000000,
      totalLiabilitiesBrl: 24000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual é o churn silencioso provocado por sobrecarga de capacidade da equipe técnica em contas Enterprise, e quanto da sua margem líquida é destruído por glosas de SLA e fraudes de alteração de domicílio bancário?',
      en: 'What is the silent churn caused by professional services capacity bottlenecks in Enterprise accounts, and how much EBITDA is destroyed by SLA service credits and wire fraud attempts?',
      es: '¿Cuál es el churn silencioso por sobrecarga técnica en cuentas Enterprise y cuánto EBITDA se destruye por penalidades de SLA y fraudes bancarios?'
    },
    vulnerabilities: [
      {
        category: 'Alocação de Capacidade Técnica',
        title: 'Sobrecarga de Squads & Atraso de Entregas Críticas',
        description: 'Contratos âncora parados em filas de implantação sem realocação dinâmica de consultores seniores entre projetos.',
        dailyCostBrl: 88000,
        frequencyDaysPerYear: 26,
        impactLabel: 'Atraso em Reconhecimento de Receita'
      },
      {
        category: 'Segurança & Zero-Trust',
        title: 'Tentativas de Engenharia Social para Alteração de PIX/Conta',
        description: 'Solicitações falsas de troca de conta bancária de fornecedores via e-mail ou WhatsApp burlando a checagem manual do contas a pagar.',
        dailyCostBrl: 290000,
        frequencyDaysPerYear: 3,
        impactLabel: 'Risco de Desvio Financeiro Direto'
      },
      {
        category: 'Contratos & Retenção',
        title: 'Churn de Clientes Tier-A por Quebra de SLA de Atendimento',
        description: 'Tempo de resposta superior ao contratado gerando penalidades financeiras e não renovação de contratos anuais milionários.',
        dailyCostBrl: 125000,
        frequencyDaysPerYear: 10,
        impactLabel: 'Perda de ARR Recorrente'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 210000,
      leakageRatePercent: 3.6,
      operationalInefficiencyPercent: 6.8,
      slaTierGuarantee: '99.9% Assegurado (SLA Enterprise 24/7)',
      tacticalCostRate: 0.070,
      manualIncidentLossDays: 2.4,
      workingCapitalRatio: 0.258
    },
    predictiveResolution: {
      graphAction: 'O AOS isola instantaneamente solicitações de alteração cadastral no Proof of Intent Gate, remaneja capacidade de squads via orquestrador e recalcula métricas de NRR.',
      agentsOrchestrated: [
        'Agente de Revenue Ops & NRR',
        'Agente de Segurança Zero-Trust',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Interceptação Fraude PIX',
      recoveryHours: '< 1 minuto (bloqueio criptográfico)',
      ebitdaProtectionPercent: '+5.2% na Margem EBITDA'
    }
  },
  {
    sectorKey: 'agribusiness',
    name: 'Agronegócio & Commodities',
    subName: 'Produtores de Grãos, Tradings, Cooperativas, Sucroalcooleiro & Frigoríficos',
    icon: Wheat,
    color: 'text-lime-400',
    borderColor: 'border-lime-500/40',
    bgLight: 'bg-lime-950/20',
    defaultCompany: {
      name: 'AgroSul Cooperativa & Grãos do Cerrado',
      cnpj: '61.993.441/0001-76',
      annualRevenueBrl: 520000000,
      dailyVolume: '85.000 sacas / dia • 320 caminhões',
      declaredEbitdaMarginPercent: 19.2,
      workingCapitalBrl: 110000000,
      totalAssetsBrl: 480000000,
      retainedEarningsBrl: 95000000,
      totalLiabilitiesBrl: 210000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual é o impacto no seu fluxo de caixa quando uma janela climática encurta a colheita, a fila de descarregamento no porto de Santos estoura a estadia (demurrage) e o preço da soja oscila em Chicago sem hedge automático?',
      en: 'What happens to your cash flow when weather events compress the harvest window, port line-up demurrage explodes in Santos, and commodity prices fluctuate in Chicago without automated hedge?',
      es: '¿Cuál es el impacto en su caja cuando el clima comprime la cosecha, se acumulan demoras portuarias y el precio fluctúa en Chicago sin cobertura automática?'
    },
    vulnerabilities: [
      {
        category: 'Escoamento de Safra & Portos',
        title: 'Estadia Excessiva de Navios e Carretas (Demurrage)',
        description: 'Falta de sincronização entre a liberação da colheita nos silos e o agendamento de janelas nos terminais portuários.',
        dailyCostBrl: 340000,
        frequencyDaysPerYear: 14,
        impactLabel: 'Custos Portuários Abusivos'
      },
      {
        category: 'Commodities & Câmbio',
        title: 'Descasamento de Barter e Flutuação Cambial USD/BRL',
        description: 'Venda antecipada de grãos com insumos comprados em cotação de dólar desfavorável sem trava algorítmica contínua.',
        dailyCostBrl: 220000,
        frequencyDaysPerYear: 22,
        impactLabel: 'Perda em Margem de Barter'
      },
      {
        category: 'Armazenagem & Qualidade de Grãos',
        title: 'Perda de Qualidade por Umidade e Quebra Técnica de Peso',
        description: 'Atraso no escoamento de silos com controle manual de aeração gerando depreciação no padrão de exportação.',
        dailyCostBrl: 130000,
        frequencyDaysPerYear: 18,
        impactLabel: 'Deságio Comercial na Venda'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 580000,
      leakageRatePercent: 4.8,
      operationalInefficiencyPercent: 7.9,
      slaTierGuarantee: '99.5% Assegurado (Zero Demurrage Portuário)',
      tacticalCostRate: 0.098,
      manualIncidentLossDays: 3.0,
      workingCapitalRatio: 0.212
    },
    predictiveResolution: {
      graphAction: 'O AOS cruza dados de telemetria climática, fretes rodoviários e cotações da CBOT, travando operações de hedge cambial em tempo real e orquestrando o fluxo de carretas nos terminais.',
      agentsOrchestrated: [
        'Agente de Hedge de Commodities',
        'Agente de Logística Agro',
        'Agente de Tesouraria',
        'Agente de Risco Regulatório',
        'Agente de Tax & Compliance Fiscal',
        'Agente de Procurement & Leilão Reverso',
        'Agente de Continuity & Disaster Recovery'
      ],
      scenarioToInject: 'Volatilidade Cambial (Hedge USD)',
      recoveryHours: '< 30 minutos',
      ebitdaProtectionPercent: '+6.4% de Margem Preservada'
    }
  },
  {
    sectorKey: 'construction',
    name: 'Construção Civil & Obras Pesadas',
    subName: 'Construtoras, Empreiteiras, Infraestrutura Viária & Saneamento',
    icon: HardHat,
    color: 'text-yellow-400',
    borderColor: 'border-yellow-500/40',
    bgLight: 'bg-yellow-950/20',
    defaultCompany: {
      name: 'Engenharia & Obras Estruturais do Brasil S/A',
      cnpj: '38.512.940/0001-63',
      annualRevenueBrl: 290000000,
      dailyVolume: '14 canteiros ativos • 3.400 colaboradores',
      declaredEbitdaMarginPercent: 16.8,
      workingCapitalBrl: 54000000,
      totalAssetsBrl: 210000000,
      retainedEarningsBrl: 42000000,
      totalLiabilitiesBrl: 114000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual é o impacto financeiro de atrasos de medição de empreiteiros, glosas de retenção de INSS na fonte e paralisações de concretagem por descompasso no fornecimento de aço e agregados?',
      en: 'What is the financial bleed from contractor measurement delays, mandatory INSS withholding disputes, and concrete pouring stoppages caused by steel/aggregate supply mismatches?',
      es: '¿Cuál es el impacto financiero de retrasos en medición de contratistas, retenciones de INSS y paralizaciones de colado por falta de acero?'
    },
    vulnerabilities: [
      {
        category: 'Canteiro & Cronograma Crítico',
        title: 'Paralisação de Concretagem & Descompasso de Insumos Pesados',
        description: 'Atraso na entrega de aço e cimento a granel gerando perda de caminhões betoneira e estouro do caminho crítico da obra.',
        dailyCostBrl: 230000,
        frequencyDaysPerYear: 15,
        impactLabel: 'Estouro de Cronograma Físico'
      },
      {
        category: 'Medições & Subempreiteiros',
        title: 'Fraudes e Divergências em Medições de Empreiteiros',
        description: 'Liberação manual de pagamentos de subcontratados sem validação fotogramétrica ou telemetria de avanço físico real.',
        dailyCostBrl: 95000,
        frequencyDaysPerYear: 25,
        impactLabel: 'Superfaturamento e Glosas de Obra'
      },
      {
        category: 'Fiscal & Previdenciário de Obras',
        title: 'Retenções Fiscais de INSS (CPRB) & Embargos de CNO/DISO',
        description: 'Divergências na declaração previdenciária de mão de obra direta gerando bloqueio de CND e atraso no Habite-se final.',
        dailyCostBrl: 145000,
        frequencyDaysPerYear: 10,
        impactLabel: 'Bloqueio de CND e Habite-se'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 390000,
      leakageRatePercent: 4.2,
      operationalInefficiencyPercent: 7.0,
      slaTierGuarantee: '99.7% Assegurado (Zero Atraso de Medição)',
      tacticalCostRate: 0.086,
      manualIncidentLossDays: 2.7,
      workingCapitalRatio: 0.186
    },
    predictiveResolution: {
      graphAction: 'O AOS audita o avanço físico dos canteiros via telemetria e BIM, confronta com o diário de obras digital e libera pagamentos de medição com validação de CND e INSS em 400ms.',
      agentsOrchestrated: [
        'Agente de Cronograma Físico-Financeiro & BIM',
        'Agente de Suprimentos & Leilão de Aço/Concreto',
        'Agente de Tesouraria & Medição de Empreiteiros',
        'Agente de Segurança do Trabalho & NRs',
        'Agente de Tax & Retenções Previdenciárias INSS/CPRB',
        'Agente de Gestão de Canteiro & Equipamentos',
        'Agente de Continuity & Licenciamento Ambiental'
      ],
      scenarioToInject: 'Gargalo Crítico em Canteiro de Obras',
      recoveryHours: '< 2 horas (replanejamento BIM)',
      ebitdaProtectionPercent: '+4.8% no Resultado de Obra'
    }
  },
  {
    sectorKey: 'energy',
    name: 'Energia, Utilities & Mercado Livre CCEE',
    subName: 'Geradoras, Comercializadoras de Energia, Transmissoras & Grandes Consumidores',
    icon: Zap,
    color: 'text-amber-300',
    borderColor: 'border-amber-400/40',
    bgLight: 'bg-amber-950/20',
    defaultCompany: {
      name: 'Voltix Energia & Comercializadora CCEE S/A',
      cnpj: '47.882.109/0001-22',
      annualRevenueBrl: 640000000,
      dailyVolume: 'Volume Negociado: 480 MWmédios / dia',
      declaredEbitdaMarginPercent: 22.4,
      workingCapitalBrl: 130000000,
      totalAssetsBrl: 580000000,
      retainedEarningsBrl: 115000000,
      totalLiabilitiesBrl: 240000000
    },
    surgicalTriggerQuestion: {
      pt: 'Qual é o montante de penalidades financeiras sofridas por desbalanço de lastro na CCEE, exposição a picos de PLD horário desprotegidos e multas de ultrapassagem de demanda contratada com distribuidoras?',
      en: 'What is the financial exposure from CCEE settlement imbalances, unprotected hourly PLD spot price spikes, and contracted grid demand breach penalties?',
      es: '¿Cuál es la penalidad financiera por desbalance de lastre en CCEE, picos de PLD horario y multas de demanda contratada?'
    },
    vulnerabilities: [
      {
        category: 'Mercado Livre & Liquidação CCEE',
        title: 'Desbalanceamento de Lastro & Exposição ao PLD Horário',
        description: 'Divergência entre previsão meteorológica/geração e consumo de clientes livres gerando exposição de milhões no Mercado de Curto Prazo (MCP).',
        dailyCostBrl: 410000,
        frequencyDaysPerYear: 18,
        impactLabel: 'Prejuízo por PLD Spot Desprotegido'
      },
      {
        category: 'Operação de Redes & Confiabilidade',
        title: 'Desarme de Linhas e Penalidades Regulatórias da ANEEL',
        description: 'Interrupções não programadas e violação dos limites de Duração Equivalente de Interrupção por Unidade Consumidora (DEC/FEC).',
        dailyCostBrl: 280000,
        frequencyDaysPerYear: 12,
        impactLabel: 'Multas Regulatórias ANEEL & Compensações'
      },
      {
        category: 'Fiscal & Tributação de Energia',
        title: 'Bitributação de ICMS na TUSD/TUST e Créditos PIS/COFINS',
        description: 'Divergências na apropriação de créditos de ICMS na transmissão e distribuição de energia gerando autos de infração estaduais.',
        dailyCostBrl: 160000,
        frequencyDaysPerYear: 20,
        impactLabel: 'Passivo Tributário Estadual'
      }
    ],
    lossMath: {
      downtimeDailyCostBrl: 620000,
      leakageRatePercent: 4.6,
      operationalInefficiencyPercent: 7.5,
      slaTierGuarantee: '99.98% Assegurado (Equilíbrio de Lastro CCEE)',
      tacticalCostRate: 0.092,
      manualIncidentLossDays: 3.2,
      workingCapitalRatio: 0.203
    },
    predictiveResolution: {
      graphAction: 'O AOS prevê a curva de carga horária com modelos preditivos, ajusta posições de swap no Mercado Livre de Energia e executa registros na CCEE com trava de garantia financeira em 250ms.',
      agentsOrchestrated: [
        'Agente de Despacho Energético & Previsão PLD',
        'Agente de Contratos Bilaterais & CCEE',
        'Agente de Tesouraria & Garantias Financeiras',
        'Agente de Risco Regulatório & ANEEL/ONS',
        'Agente de Tax & ICMS Energia / PIS-COFINS',
        'Agente de Hedge Energético & Leilão Spot',
        'Agente de Continuity & Contingência de Subestação'
      ],
      scenarioToInject: 'Pico de PLD Horário no Mercado Livre',
      recoveryHours: '< 5 minutos (hedge algorítmico)',
      ebitdaProtectionPercent: '+5.9% na Margem de Comercialização'
    }
  }
];
