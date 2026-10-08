import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  ShieldAlert, 
  FileDown, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp, 
  Cpu, 
  Layers, 
  Sparkles, 
  Lock, 
  Building2, 
  Flame,
  Check
} from 'lucide-react';
import { SectorRiskProfile } from './taxonomy';
import { SupportedLanguage, SupportedCurrency } from '../../types/aos';
import { formatCurrency } from '../../utils/i18n';
import { 
  generateAgentActionPlanPdf, 
  AgentActionItem, 
  AgentActionPlanPdfData 
} from '../../services/agentActionPlanPdfService';

interface AgentActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSector: SectorRiskProfile;
  displayCompany: {
    name: string;
    cnpj: string;
    annualRevenue: number;
    dailyVolume: string;
    ebitdaMargin: number;
  };
  scaledAnnualLoss: number;
  scaledDowntimeCost: number;
  singleIncidentLossManual: number;
  estimatedSavings: number;
  ebitdaGainPercent: number;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const AgentActionPlanModal: React.FC<AgentActionPlanModalProps> = ({
  isOpen,
  onClose,
  currentSector,
  displayCompany,
  scaledAnnualLoss,
  scaledDowntimeCost,
  singleIncidentLossManual,
  estimatedSavings,
  ebitdaGainPercent,
  language,
  currency
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const threeYearsInactionLoss = scaledAnnualLoss * 3;

  // Helper to extract orchestrated agent name directly from currentSector to guarantee 100% synchronization
  const getOrchestratedAgentName = (index: number, fallback: string): string => {
    return currentSector.predictiveResolution?.agentsOrchestrated?.[index] || fallback;
  };

  // Sector-specific tailored concrete agent action plans
  const getSectorAgentActionItems = (): AgentActionItem[] => {
    const rawKey = (currentSector.sectorKey || '').toLowerCase().trim();

    if (rawKey === 'manufacturing' || rawKey === 'industry') {
      return [
        {
          id: 'mfg-1',
          name: getOrchestratedAgentName(0, 'Agente de Compras & Hedge Cambial'),
          role: 'Prevenção de Ruptura de BOM & Trava Cambial',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Ruptura Crítica de BOM',
          specificAction: `Monitora a árvore de materiais (BOM) em conexão com o ERP da ${displayCompany.name}. Ao detectar atraso de fornecedores asiáticos, trava contrato de câmbio futuro instantaneamente e despacha PO para fornecedor homologado reserva em 850ms.`,
          invariant: 'Zero Desabastecimento de Linha • Câmbio Travado na Margem Alvo'
        },
        {
          id: 'mfg-2',
          name: getOrchestratedAgentName(1, 'Agente de Logística & Roteirização'),
          role: 'Orquestração de Frotas & Lead Time',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Paradas Fabris Não Programadas',
          specificAction: `Rastreia fretes de insumos via telemetria IoT ativa. Ao identificar congestionamento portuário ou rodoviário, remaneja fretes para transportadoras homologadas sem fila de descarga no chão de fábrica da ${displayCompany.name}.`,
          invariant: 'SLA de Abastecimento Fabril <= 45 min'
        },
        {
          id: 'mfg-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Liquidez D+0 & Governança de Caixa Fabril',
          targetVulnerability: 'Descasamento de Caixa em Parada Operacional',
          specificAction: `Autoriza pagamentos táticos e liquidações instantâneas respeitando rigorosamente o Working Capital Buffer e as travas de covenants bancários da empresa.`,
          invariant: 'Working Capital Buffer >= R$ 2.5M'
        },
        {
          id: 'mfg-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Compliance ISO 9001 / IATF 16949 & Qualidade',
          targetVulnerability: 'Refugo & Não Conformidade de Lotes',
          specificAction: `Verifica certificados de matéria-prima e lotes de peças substitutas antes do acionamento na linha, garantindo 100% de conformidade com normas industriais.`,
          invariant: 'Certificação de Qualidade = 100% Homologada'
        },
        {
          id: 'mfg-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Validação SEFAZ & Prevenção de Retenção',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Exposição Fiscal & Multas SPED',
          specificAction: `Valida em milissegundos o enquadramento de NCM, alíquotas de ICMS-ST e SPED das cargas que chegam à ${displayCompany.name}, eliminando retenções em postos fiscais de fronteira.`,
          invariant: 'Divergência Fiscal = R$ 0,00 • Validação NF-e < 300ms'
        },
        {
          id: 'mfg-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Negociação de Emergência Spot de Insumos',
          targetVulnerability: 'Custo de Peças Spot & Inflação de Insumos',
          specificAction: `Executa leilão reverso automatizado entre fornecedores Tier-1 em 650ms, obtendo suprimento emergencial com desconto médio de 14.2% frente à tabela spot manual.`,
          invariant: 'Preço Spot <= 112% do Custo Orçado'
        },
        {
          id: 'mfg-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Resiliência Fabril & Alta Disponibilidade',
          targetVulnerability: 'Parada Total de Linha de Montagem',
          specificAction: `Executa failover automático de ordens de produção para linhas paralelas sem interrupção de turnos, registrando snapshot imutável no Grafo de Conhecimento.`,
          invariant: 'RTO < 60s • Zero Perda de Lotes em Andamento'
        }
      ];
    }

    if (rawKey === 'logistics' || rawKey === 'transport') {
      return [
        {
          id: 'log-1',
          name: getOrchestratedAgentName(0, 'Agente de Roteirização & Frota'),
          role: 'Mitigação de Gargalos & Tráfego Last-Mile',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Gargalos em Rodovias & Empty Miles',
          specificAction: `Cruza telemetria dos caminhões e sensores de tráfego, recalculando rotas e redistribuindo cargas para evitar janelas de atraso no Last-Mile da ${displayCompany.name}.`,
          invariant: 'Janela Last-Mile >= 99.8% Cumprida'
        },
        {
          id: 'log-2',
          name: getOrchestratedAgentName(1, 'Agente de Logística Multimodal'),
          role: 'Contratação Autônoma de Capacidade & Transbordo',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Ruptura de Frota Terceirizada & Quebra de SLA',
          specificAction: `Dispara contratação spot automatizada de transportadoras parceiras com checagem de GR (Gerenciamento de Risco) em < 5 minutos para cobrir veículos avariados.`,
          invariant: 'GR Aprovado 100% • Teto Frete <= Margem Alvo'
        },
        {
          id: 'log-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Liquidação e Split de Fretes & Adiantamentos',
          targetVulnerability: 'Parada de Frotistas por Falta de Saldo',
          specificAction: `Libera vales-pedágio e adiantamento de diesel via split bancário automatizado apenas para veículos com rota homologada e checklist aprovado.`,
          invariant: 'Saldo Livre D+0 Protegido'
        },
        {
          id: 'log-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Auditoria de Tempos de Docas e Demurrage',
          targetVulnerability: 'Multas por Atraso de Descarga',
          specificAction: `Audita telemetria de entrada e saída nos centros de distribuição de clientes, gerando laudos automáticos para contestar cobranças indevidas de estadia.`,
          invariant: 'Multas de Estadia Contestadas = 0% de Perda'
        },
        {
          id: 'log-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Emissão de MDF-e e CT-e em Contingência',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Retenções Fiscais e Multas de Barreira',
          specificAction: `Emite e encerra MDF-e e CT-e instantaneamente com chave Secp256k1 integrada à SEFAZ, liberando carretas nas balanças em menos de 10 segundos.`,
          invariant: 'Tempo de Emissão Fiscal < 1.2s'
        },
        {
          id: 'log-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Leilão Reverso de Frete Spot e Diesel',
          targetVulnerability: 'Inflação de Frete Spot em Picos de Demanda',
          specificAction: `Abre leilão reverso entre frotistas homologados em 300ms, travando os melhores valores de tabela com aprovação automática de gerenciamento de risco.`,
          invariant: 'Frete Spot <= 108% da Tabela ANTT'
        },
        {
          id: 'log-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Plano de Contingência de CDs e Hubs',
          targetVulnerability: 'Sobrecarga de Cross-Docking & Ransomware no TMS',
          specificAction: `Transfere automaticamente o fluxo de triagem para hubs secundários homologados em caso de lentidão nos equipamentos do CD principal ou instabilidade de TMS.`,
          invariant: 'Taxa de Ocupação do Hub <= 88% • RTO < 15 min'
        }
      ];
    }

    if (rawKey === 'retail' || rawKey === 'ecommerce') {
      return [
        {
          id: 'ret-1',
          name: getOrchestratedAgentName(0, 'Agente de Pricing & Demanda'),
          role: 'Proteção de Margem Bruta & Reposição Dinâmica',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Ruptura Fantasma em Dias de Pico',
          specificAction: `Cruza a velocidade de venda nos canais digitais e físicos da ${displayCompany.name}, orquestrando remanejamento entre CDs antes do esgotamento de SKUs de alta conversão.`,
          invariant: 'Zero Ruptura de SKUs Classe A'
        },
        {
          id: 'ret-2',
          name: getOrchestratedAgentName(1, 'Agente de Logística Omnichannel'),
          role: 'Sincronização de CDs e Ship-from-Store',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Custo Oculto de Avarias e Logística Reversa',
          specificAction: `Roteiriza entregas a partir da loja física mais próxima ou CD integrado, agilizando a triagem da logística reversa para evitar obsolescência de estoque.`,
          invariant: 'Triagem de Logística Reversa < 24h'
        },
        {
          id: 'ret-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Otimização de Capital de Giro & Antecipação',
          targetVulnerability: 'Custo Excessivo de Desconto de Duplicatas',
          specificAction: `Negocia taxas de antecipação automáticas apenas quando estritamente necessário para pagamento de compras estratégicas com desconto.`,
          invariant: 'Custo Médio de Capital <= CDI + 1.2%'
        },
        {
          id: 'ret-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Compliance com Código de Defesa do Consumidor & LGPD',
          targetVulnerability: 'Processos por Atraso de Entrega e Desvio de Dados',
          specificAction: `Audita prazos de entrega prometidos e dados de pagamento criptografados, emitindo estornos e notificações proativas para evitar litígios no Procon.`,
          invariant: 'Reclamações Críticas no Procon = ZERO'
        },
        {
          id: 'ret-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Emissão Fiscal de Cupom & NFC-e em Picos',
          targetVulnerability: 'Travamento de PDV por Queda SEFAZ',
          specificAction: `Garante a emissão assíncrona de NFC-e em modo de contingência durante eventos de pico (Black Friday), sem filas nos caixas ou no checkout online da ${displayCompany.name}.`,
          invariant: 'Uptime de Emissão de Vendas = 100%'
        },
        {
          id: 'ret-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Compra Spot de Reposição de SKUs Campeões',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Erosão de Margem por Descontos Descoordenados',
          specificAction: `Dispara leilões reversos relâmpago com distribuidores atacadistas para recompor SKUs em vias de esgotamento mantendo a margem líquida positiva.`,
          invariant: 'Margem Bruta Mínima >= 22%'
        },
        {
          id: 'ret-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Failover de Adquirentes e Gateways de Pagamento',
          targetVulnerability: 'Queda do Gateway Principal de Pagamento',
          specificAction: `Redireciona tentativas de pagamento recusadas por instabilidade para gateways de backup em 400ms, recuperando até 18% das vendas em risco de abandono de carrinho.`,
          invariant: 'Disponibilidade de Checkout = 99.99%'
        }
      ];
    }

    if (rawKey === 'healthcare' || rawKey === 'health' || rawKey === 'pharma') {
      return [
        {
          id: 'hea-1',
          name: getOrchestratedAgentName(0, 'Agente de Cadeia Fria & Farmácia'),
          role: 'Telemetria IoT & Proteção de Medicamentos Termolábeis',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Descarte de Insumos por Variação Térmica',
          specificAction: `Monitora sensores IoT de temperatura em câmaras frias 24/7. Ao detectar variação de 0.5°C além do limite na ${displayCompany.name}, despacha transferência para câmara backup em < 5 minutos.`,
          invariant: 'Temperatura Mantida entre +2°C e +8°C'
        },
        {
          id: 'hea-2',
          name: getOrchestratedAgentName(1, 'Agente de Faturamento TISS'),
          role: 'Auditoria Prévia de Prontuários e Eliminação de Glosas',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Glosas Hospitalares por Divergência TISS',
          specificAction: `Valida itens prescritos, guias de autorização TISS e prontuários eletrônicos antes do envio às operadoras de saúde, eliminando glosas administrativas e técnicas.`,
          invariant: 'Taxa de Glosas Aceitas <= 1.0%'
        },
        {
          id: 'hea-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Liquidez para Folha e Insumos Vitais Hospitalares',
          targetVulnerability: 'Travamento de Contas a Receber e Descompasso de Caixa',
          specificAction: `Projeta o fluxo de repasses de convênios e programa pagamentos prioritários de fornecedores críticos de gases medicinais e insumos vitais.`,
          invariant: 'Fundo de Reserva Emergencial Mantido'
        },
        {
          id: 'hea-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório & ANVISA'),
          role: 'Auditoria de Protocolos ANVISA & Privacidade LGPD/HIPAA',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Vazamento de Prontuários & Multas ANVISA',
          specificAction: `Audita digitalmente registros de esterilização, rastreabilidade de OPME e registros de prontuários com criptografia de ponta a ponta.`,
          invariant: 'Score de Risco Sanitário = ZERO_DEFECTS'
        },
        {
          id: 'hea-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Tributação de Serviços de Saúde & Deduções Hospitalares',
          targetVulnerability: 'Glosa Fiscal de Serviços Médicos Terceirizados',
          specificAction: `Aplica as regras fiscais de equiparação hospitalar e retenções na fonte de PIS/COFINS/CSLL/ISS para o corpo clínico terceirizado.`,
          invariant: 'Divergência Fiscal em Saúde = R$ 0,00'
        },
        {
          id: 'hea-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Abastecimento Emergencial de OPME e Medicamentos',
          targetVulnerability: 'Falta de Órteses e Próteses em Cirurgias',
          specificAction: `Cruza a escala cirúrgica com o estoque físico, disparando cotações com distribuidores homologados com 48h de antecedência.`,
          invariant: 'Cirurgias sem Atraso por Falta de Insumo = 100%'
        },
        {
          id: 'hea-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Continuidade de Prontuários e Sistemas de UTI',
          targetVulnerability: 'Indisponibilidade de Sistemas Clínicos e Prontuário Eletrônico',
          specificAction: `Garante a replicação em tempo real de dados clínicos e prescrições médicas em nós locais offline-first caso haja queda de link de internet.`,
          invariant: 'Acesso a Prontuários Críticos = 100% Ininterrupto'
        }
      ];
    }

    if (rawKey === 'real_estate' || rawKey === 'incorporacao') {
      return [
        {
          id: 're-1',
          name: getOrchestratedAgentName(0, 'Agente de Revenue Ops & Real Estate'),
          role: 'Validação de VGV & Fechamento Comercial',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Travamento de Liquidação de VGV por Burocracia',
          specificAction: `Integra os sistemas de CRM de vendas aos bancos financiadores e cartórios digitais da ${displayCompany.name}, acelerando a liquidação de unidades e VGV.`,
          invariant: 'Tempo de Liquidação de VGV reduzido em 80%'
        },
        {
          id: 're-2',
          name: getOrchestratedAgentName(1, 'Agente de Due Diligence Notarial'),
          role: 'Validação de Matrículas e Ônus Reais no RGI',
          targetVulnerability: 'Insegurança em Matrículas de Imóveis & Pendências Vintenárias',
          specificAction: `Consulta automaticamente certidões vintenárias, distribuições cíveis e matrículas em cartórios digitais (e-Notariado) antes de qualquer fechamento imobiliário.`,
          invariant: 'Risco Registral = Zero Ônus Ocultos'
        },
        {
          id: 're-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria Escrow'),
          role: 'Custódia Escrow & Split Automatizado de Comissões CRECI',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Disputas de Split de Corretagem CRECI e Fraude',
          specificAction: `Executa split de comissões de corretagem e comanda a liberação de parcelas de contas Escrow bancárias vinculadas às certidões do RGI.`,
          invariant: 'Liquidação Condicionada a Registro em RGI'
        },
        {
          id: 're-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Compliance da Lei do Distrato & Patrimônio de Afetação',
          targetVulnerability: 'Passivo Jurídico por Rescisão Contratual',
          specificAction: `Aplica as regras de retenção conforme patrimônio de afetação em caso de desistência de compradores, blindando o fluxo financeiro da SPE.`,
          invariant: 'Adequação Plena à Lei 13.786/2018'
        },
        {
          id: 're-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Regime Especial de Tributação (RET) & Segregação de SPEs',
          targetVulnerability: 'Tributação Incorreta de Recebíveis Imobiliários',
          specificAction: `Valida a alíquota unificada do RET (4%) para cada empreendimento e assegura a segregação contábil entre Sociedades de Propósito Específico.`,
          invariant: 'Apropriação Fiscal do RET = 100% Homologada'
        },
        {
          id: 're-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Cotação de Aço, Concreto e Insumos de Canteiro',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Atraso de Cronograma Físico-Financeiro por Falta de Insumos',
          specificAction: `Monitora o cronograma físico-financeiro das obras, disparando leilão reverso de aço e cimento nos momentos de menor cotação.`,
          invariant: 'Desvio de Orçamento de Obra <= 1.5%'
        },
        {
          id: 're-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Replanejamento de Etapas Construtivas e Habite-se',
          targetVulnerability: 'Atrasos no Habite-se e Entrega de Chaves',
          specificAction: `Reorganiza o caminho crítico da obra ao detectar atrasos em empreiteiros de acabamento, preservando a data contratual de entrega de chaves.`,
          invariant: 'Atraso na Entrega de Chaves = 0 Dias'
        }
      ];
    }

    if (rawKey === 'services' || rawKey === 'tech_saas' || rawKey === 'saas' || rawKey === 'fintech') {
      return [
        {
          id: 'saas-1',
          name: getOrchestratedAgentName(0, 'Agente de Revenue Ops & NRR'),
          role: 'Proteção de ARR, Combate ao Churn & Billing Inteligente',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Churn de Clientes Tier-A por Quebra de SLA',
          specificAction: `Monitora métricas de NRR, uso de produto e falhas de cobrança de cartão/faturas de clientes Enterprise da ${displayCompany.name}, acionando retentativas inteligentes e prevenindo perda involuntária de receita recorrente.`,
          invariant: 'Taxa de Retenção Líquida (NRR) >= 115% • Churn Involuntário <= 0.8%'
        },
        {
          id: 'saas-2',
          name: getOrchestratedAgentName(1, 'Agente de Segurança Zero-Trust'),
          role: 'Proof of Intent Gate & Prevenção de Fraudes em Contas/PIX',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Tentativas de Engenharia Social para Alteração de PIX/Conta',
          specificAction: `Intercepta solicitações de troca de domicílio bancário ou transferências suspeitas no Proof of Intent Gate, exigindo assinatura criptográfica Secp256k1 e confirmação out-of-band antes da liberação.`,
          invariant: 'Desvio Financeiro por Engenharia Social = ZERO'
        },
        {
          id: 'saas-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Gestão de Runway, Liquidez D+0 & Queima de Caixa',
          targetVulnerability: 'Descompasso entre CAC, LTV e Runway Operacional',
          specificAction: `Modela o Runway da ${displayCompany.name} em tempo real, monitorando a queima de caixa (burn rate) e autorizando pagamentos com base em previsibilidade de recebíveis recorrentes.`,
          invariant: 'Runway Mínimo Assegurado >= 18 Meses'
        },
        {
          id: 'saas-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Auditoria de Acessos Privilegiados, LGPD & SOC 2',
          targetVulnerability: 'Vazamento de Bases de Dados & Não Conformidade LGPD/SOC 2',
          specificAction: `Audita acessos a bases de dados de clientes em tempo real, bloqueando tentativas de exfiltração de dados e registrando logs imutáveis para certificações de segurança.`,
          invariant: 'Incidentes Críticos de Segurança = ZERO'
        },
        {
          id: 'saas-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Cálculo de ISS Municipal, Retenções Federais & NFS-e',
          targetVulnerability: 'Bitributação de Software em Múltiplos Municípios & Glosas Fiscais',
          specificAction: `Aplica as regras fiscais de retenção na fonte (PIS/COFINS/CSLL/IRRF/ISS) em contratos corporativos B2B, emitindo NFS-e sem risco de bitributação interestadual.`,
          invariant: 'Divergência Fiscal em Cobrança B2B = R$ 0,00'
        },
        {
          id: 'saas-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Otimização de Custos de Cloud (AWS/GCP/Azure) e Squads',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Sobrecarga de Squads & Atraso de Entregas Críticas',
          specificAction: `Executa balanceamento dinâmico de instâncias na nuvem e capacidade de engenharia, disparando contratações pontuais de ferramentas com desconto negociado.`,
          invariant: 'Custo de Cloud / Receita <= 12% • Alocação de Squads >= 92%'
        },
        {
          id: 'saas-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Uptime de 99.99%, Failover Multi-Região & RPO Zero',
          targetVulnerability: 'Multas por Indisponibilidade de Sistema e Queda de Servidores',
          specificAction: `Redireciona o tráfego da plataforma para zonas de disponibilidade secundárias em < 3 segundos em caso de instabilidade, mantendo o SLA Enterprise sem interrupção para os usuários.`,
          invariant: 'Uptime SLA >= 99.99% • RTO < 3s • RPO = 0'
        }
      ];
    }

    if (rawKey === 'agribusiness' || rawKey === 'agro') {
      return [
        {
          id: 'agro-1',
          name: getOrchestratedAgentName(0, 'Agente de Hedge de Commodities'),
          role: 'Trava de Derivativos, Câmbio USD/BRL e Cotação CBOT',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Descasamento de Barter e Flutuação Cambial USD/BRL',
          specificAction: `Cruza cotações de soja/milho na CBOT e dólar futuro, disparando travas automáticas de hedge cambial no momento exato em que a margem da safra da ${displayCompany.name} atinge a meta.`,
          invariant: 'Margem Líquida da Safra Travada em D+0'
        },
        {
          id: 'agro-2',
          name: getOrchestratedAgentName(1, 'Agente de Logística Agro'),
          role: 'Orquestração de Frotas e Janelas nos Portos de Santos/Paranaguá',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Estadia Excessiva de Navios e Carretas (Demurrage)',
          specificAction: `Sincroniza o despacho das carretas nos silos do interior com a prontidão de atracação dos navios nos portos, zerando filas e custos de demurrage.`,
          invariant: 'Zero Demurrage Portuário • Janela de Descarga Assegurada'
        },
        {
          id: 'agro-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria'),
          role: 'Liquidação de ACC/ACE & Gestão de Crédito de Safra',
          targetVulnerability: 'Custo de Rolagem de Dívida de Safra & Juros de Barter',
          specificAction: `Liquida operações de ACC/ACE com os recebíveis de exportação nos prazos contratuais, evitando multas e juros de rolagem bancária.`,
          invariant: 'Liquidação de ACC/ACE em D+0'
        },
        {
          id: 'agro-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório'),
          role: 'Compliance Ambiental, Rastreabilidade de Origem & CPRs',
          targetVulnerability: 'Embargos Ambientais & Inadimplência de Cédulas de Produto Rural',
          specificAction: `Cruza dados de CAR (Cadastro Ambiental Rural) e averbações de CPR com imagens de satélite antes da liberação de adiantamentos de barter.`,
          invariant: 'Conformidade Socioambiental = 100%'
        },
        {
          id: 'agro-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Compliance Fiscal'),
          role: 'Compliance de ICMS Agro, Diferimento & Funrural',
          targetVulnerability: 'Retenções e Não Cumprimento de Diferimento de ICMS',
          specificAction: `Valida as regras de isenção e diferimento de ICMS na emissão de notas de produtor rural e trânsito interestadual de grãos.`,
          invariant: 'Divergência Fiscal Agro = R$ 0,00'
        },
        {
          id: 'agro-6',
          name: getOrchestratedAgentName(5, 'Agente de Procurement & Leilão Reverso'),
          role: 'Leilão Reverso de Frete Rodoviário e Fertilizantes',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Perda de Qualidade por Umidade e Quebra Técnica de Peso',
          specificAction: `Abre leilão reverso entre transportadoras homologadas para escoamento rápido de silos em alerta de aeração, preservando o padrão de exportação.`,
          invariant: 'Teto de Frete <= Tabela Agro • Qualidade Preservada'
        },
        {
          id: 'agro-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Disaster Recovery'),
          role: 'Rotas Rodoferroviárias de Contingência na Safra',
          targetVulnerability: 'Bloqueio de Rodovias de Escoamento de Safra',
          specificAction: `Transfere o transbordo para modais ferroviários parceiros ao detectar bloqueios ou desmoronamentos nas principais rotas de escoamento.`,
          invariant: 'SLA de Escoamento Contratual 99.5% Cumprido'
        }
      ];
    }

    if (rawKey === 'construction' || rawKey === 'civil_construction' || rawKey === 'obras') {
      return [
        {
          id: 'const-1',
          name: getOrchestratedAgentName(0, 'Agente de Cronograma Físico-Financeiro & BIM'),
          role: 'Controle de Caminho Crítico & Avanço de Canteiro',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Paralisação de Concretagem & Descompasso de Insumos',
          specificAction: `Cruza o modelo BIM e telemetria de canteiros da ${displayCompany.name}, sincronizando pedidos de concreto e aço com o cronograma físico para evitar descontinuidade de equipes.`,
          invariant: 'Desvio de Caminho Crítico de Obra <= 0.5%'
        },
        {
          id: 'const-2',
          name: getOrchestratedAgentName(1, 'Agente de Suprimentos & Leilão de Aço/Concreto'),
          role: 'Negociação Automatizada de Insumos Pesados',
          targetVulnerability: 'Inflação de Cimento e Aço em Picos de Obra',
          specificAction: `Abre leilão reverso com usinas siderúrgicas e concreteiras homologadas em 400ms, assegurando entregas nos horários exatos de concretagem.`,
          invariant: 'Custo de Insumos <= Orçamento Base SINAPI'
        },
        {
          id: 'const-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria & Medição de Empreiteiros'),
          role: 'Liquidação de Medições Físicas & Gestão de Caixa de Obra',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Fraudes e Divergências em Medições de Empreiteiros',
          specificAction: `Libera pagamentos de subempreiteiros condicionados à validação fotogramétrica do avanço físico e conferência de guias trabalhistas quitadas.`,
          invariant: 'Pagamento 100% Vinculado a Medição Física Auditada'
        },
        {
          id: 'const-4',
          name: getOrchestratedAgentName(3, 'Agente de Segurança do Trabalho & NRs'),
          role: 'Auditoria de NRs, EPIs e Conformidade Legal',
          targetVulnerability: 'Embargos de Canteiro por Não Conformidade Trabalhista',
          specificAction: `Monitora checklists de segurança e documentação de integração de funcionários terceirizados, prevenindo autuações e paralisações da fiscalização.`,
          invariant: 'Score de Segurança do Trabalho = ZERO_EMBARGOS'
        },
        {
          id: 'const-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & Retenções Previdenciárias INSS/CPRB'),
          role: 'Compliance de CNO, DISO e Emissão de CND para Habite-se',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Retenções Fiscais de INSS (CPRB) & Embargos de CNO/DISO',
          specificAction: `Valida em tempo real as guias de recolhimento de INSS de mão de obra de cada canteiro, garantindo a emissão célere de CND para obtenção de Habite-se.`,
          invariant: 'Divergência de INSS de Obra = R$ 0,00'
        },
        {
          id: 'const-6',
          name: getOrchestratedAgentName(5, 'Agente de Gestão de Canteiro & Equipamentos'),
          role: 'Telemetria de Máquinas Pesadas e Prevenção de Ociosidade',
          targetVulnerability: 'Custo Oculto de Locação de Guindastes e Maquinário Ocioso',
          specificAction: `Rastreia horímetros e utilização de equipamentos locados, desmobilizando maquinário imediatamente ao término da etapa programada.`,
          invariant: 'Ociosidade de Maquinário Pesado <= 3%'
        },
        {
          id: 'const-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Licenciamento Ambiental'),
          role: 'Gestão de Licenças e Mitigação de Embargos',
          targetVulnerability: 'Paralisação de Obra por Vencimento de Licenças Ambientais',
          specificAction: `Monitora prazos de condicionantes ambientais e licenças de instalação (LI/LO), renovando certidões automaticamente com 90 dias de antecedência.`,
          invariant: 'Licenciamento Ambiental 100% Válido e Vigente'
        }
      ];
    }

    if (rawKey === 'energy' || rawKey === 'utilities' || rawKey === 'ccee') {
      return [
        {
          id: 'en-1',
          name: getOrchestratedAgentName(0, 'Agente de Despacho Energético & Previsão PLD'),
          role: 'Modelagem Preditiva de Carga & Preço Horário',
          targetVulnerability: currentSector.vulnerabilities[0]?.title || 'Desbalanceamento de Lastro & Exposição ao PLD Horário',
          specificAction: `Cruza dados de geração, telemetria de consumo de clientes livres e previsão climática, recalculando o balanço energético da ${displayCompany.name} a cada 15 minutos.`,
          invariant: 'Exposição a Desbalanço de Lastro <= 0.2%'
        },
        {
          id: 'en-2',
          name: getOrchestratedAgentName(1, 'Agente de Contratos Bilaterais & CCEE'),
          role: 'Registro e Validação de Contratos no MCP',
          targetVulnerability: 'Glosas e Penalidades em Liquidação Financeira na CCEE',
          specificAction: `Valida e registra contratos de compra e venda de energia na CCEE dentro dos prazos regulatórios, eliminando penalidades de descontinuidade de lastro.`,
          invariant: 'Registro CCEE em D+0 • Zero Multas por Perda de Prazo'
        },
        {
          id: 'en-3',
          name: getOrchestratedAgentName(2, 'Agente de Tesouraria & Garantias Financeiras'),
          role: 'Gestão de Garantias e Aporte na CCEE',
          targetVulnerability: 'Execução de Garantias Financeiras por Inadimplência',
          specificAction: `Calcula e monitora em tempo real o montante de garantia financeira exigido pela CCEE, aportando cartas de fiança ou títulos com antecedência.`,
          invariant: 'Garantia CCEE 100% Coberta'
        },
        {
          id: 'en-4',
          name: getOrchestratedAgentName(3, 'Agente de Risco Regulatório & ANEEL/ONS'),
          role: 'Compliance de DEC/FEC, ONS e Resoluções Normativas',
          targetVulnerability: currentSector.vulnerabilities[1]?.title || 'Desarme de Linhas e Penalidades Regulatórias da ANEEL',
          specificAction: `Audita índices de qualidade do fornecimento e ordens de despacho do ONS, contestando compensações indevidas de DEC/FEC geradas por eventos externos.`,
          invariant: 'Compensações Indevidas Contestadas = 0% de Perda'
        },
        {
          id: 'en-5',
          name: getOrchestratedAgentName(4, 'Agente de Tax & ICMS Energia / PIS-COFINS'),
          role: 'Tributação de TUSD/TUST e Créditos Fiscais',
          targetVulnerability: currentSector.vulnerabilities[2]?.title || 'Bitributação de ICMS na TUSD/TUST e Créditos PIS/COFINS',
          specificAction: `Aplica a jurisprudência tributária consolidada para segregação de ICMS sobre demanda de transmissão e distribuição, assegurando o creditamento integral de PIS/COFINS.`,
          invariant: 'Creditamento Fiscal de Energia 100% Homologado'
        },
        {
          id: 'en-6',
          name: getOrchestratedAgentName(5, 'Agente de Hedge Energético & Leilão Spot'),
          role: 'Trava de Posições Spot e Swaps Energéticos',
          targetVulnerability: 'Prejuízo por Picos Súbitos de PLD Horário',
          specificAction: `Executa operações de hedge e swap de energia no mercado livre em milissegundos assim que o PLD atinge patamares de alerta, protegendo a margem de comercialização.`,
          invariant: 'Margem de Comercialização Travada'
        },
        {
          id: 'en-7',
          name: getOrchestratedAgentName(6, 'Agente de Continuity & Contingência de Subestação'),
          role: 'Failover e Ilhamento Autônomo de Redes',
          targetVulnerability: 'Apagão em Subestações e Perda de Conexão à Rede Básica',
          specificAction: `Comanda o religamento automático e manobras de carga para circuitos redundantes em subestações em menos de 80ms após detecção de curto-circuito.`,
          invariant: 'Tempo de Restabelecimento de Carga < 100ms'
        }
      ];
    }

    // Dynamic fallback for any custom or dynamically loaded sector:
    // It creates tailored items using the sector's own name, orchestrated agents, and vulnerabilities.
    // IT NEVER DEFAULTS TO AGRIBUSINESS.
    return (currentSector.predictiveResolution?.agentsOrchestrated || [
      'Agente Especialista de Operações',
      'Agente de Inteligência Tática',
      'Agente de Tesouraria & Liquidez',
      'Agente de Risco Regulatório & Compliance',
      'Agente de Tax & Eficiência Fiscal',
      'Agente de Procurement & Leilão Reverso',
      'Agente de Continuity & Disaster Recovery'
    ]).map((agentName, idx) => {
      const vuln = currentSector.vulnerabilities[idx % currentSector.vulnerabilities.length];
      return {
        id: `custom-agent-${idx + 1}`,
        name: agentName,
        role: `Orquestração Especializada em ${currentSector.name}`,
        targetVulnerability: vuln?.title || `Vulnerabilidade Operacional ${idx + 1}`,
        specificAction: `Atua continuamente sobre os fluxos operacionais e sistemas da ${displayCompany.name}, aplicando inteligência preditiva para prevenir perdas financeiras e garantir resiliência em ${currentSector.name}.`,
        invariant: `SLA de Atuação em ${currentSector.name} >= 99.8% • Tolerância a Falhas = 0`
      };
    });
  };

  const agentActionItems = getSectorAgentActionItems();

  const handleGeneratePdf = () => {
    setIsDownloadingPdf(true);
    setDownloadSuccess(false);

    try {
      const pdfData: AgentActionPlanPdfData = {
        company: displayCompany,
        sector: currentSector,
        agents: agentActionItems,
        financialRisk: {
          annualBleedBrl: scaledAnnualLoss,
          downtimeDailyCostBrl: scaledDowntimeCost,
          singleIncidentLossManualBrl: singleIncidentLossManual,
          threeYearsInactionLossBrl: threeYearsInactionLoss,
          ebitdaPreservedBrl: estimatedSavings,
          ebitdaGainPercent: ebitdaGainPercent
        },
        language,
        currency
      };

      generateAgentActionPlanPdf(pdfData);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating Agent Action Plan PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div 
      id="modal-agent-action-plan-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
    >
      <div 
        id="modal-agent-action-plan-card"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/40 flex items-center justify-center">
              <Bot className="w-5 h-5 text-[var(--vx-neon)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 font-mono tracking-wide">
                  Plano de Ação Prática dos Agentes
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {agentActionItems.length} Especialistas Ativos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Atuação direta nas dores e vulnerabilidades de {displayCompany.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-generate-action-plan-pdf-top"
              onClick={handleGeneratePdf}
              disabled={isDownloadingPdf}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>PDF Gerado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-slate-950" />
                  <span>Gerar PDF do Plano</span>
                </>
              )}
            </button>

            <button
              id="btn-close-action-plan-modal"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Section 1: Financial Risk Summary of NOT Having AOS (Cost of Inaction) */}
          <div 
            id="panel-financial-inaction-risk"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-950 to-slate-950 border border-rose-900/50 shadow-xl space-y-3.5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-950/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
                    Resumo do Risco Financeiro de Não Ter a Solução (Custo da Inação)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    O que a {displayCompany.name} continuará perdendo enquanto operar com deliberações manuais:
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800/40 self-start sm:self-auto">
                Risco Crítico Identificado
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Box 1: Sangria Anual */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-900/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Sangria de Capital Anual
                </span>
                <div className="text-base sm:text-lg font-black font-mono text-rose-400">
                  -{formatCurrency(scaledAnnualLoss, currency, language)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Perdas invisíveis por ineficiência e quebra de processos
                </p>
              </div>

              {/* Box 2: Prejuízo por Incidente */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-900/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Prejuízo Oculto por Incidente
                </span>
                <div className="text-base sm:text-lg font-black font-mono text-amber-300">
                  -{formatCurrency(singleIncidentLossManual, currency, language)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Custo acumulado por evento crítico sem contenção autônoma
                </p>
              </div>

              {/* Box 3: Custo Diário de Paralisação */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-900/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  Custo Diário de Paralisação
                </span>
                <div className="text-base sm:text-lg font-black font-mono text-rose-300">
                  -{formatCurrency(scaledDowntimeCost, currency, language)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Ociosidade da operação e multas contratuais por dia
                </p>
              </div>

              {/* Box 4: Prejuízo Projetado em 3 Anos */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-rose-500/40 space-y-1 bg-gradient-to-b from-rose-950/30 to-slate-950">
                <span className="text-[10px] font-mono uppercase text-rose-300 block font-bold">
                  Prejuízo em 3 Anos Sem AOS
                </span>
                <div className="text-base sm:text-lg font-black font-mono text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]">
                  -{formatCurrency(threeYearsInactionLoss, currency, language)}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center justify-between pt-1 border-t border-rose-950">
                  <span>Com AOS:</span>
                  <span>+{formatCurrency(estimatedSavings, currency, language)}/ano</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Concrete Practical Actions of Each Agent */}
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[var(--vx-neon)]" />
                <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                  Atuação Específica dos Agentes no Setor: {currentSector.name}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Ações concretas mapeadas para a estrutura da empresa
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {agentActionItems.map((agent, index) => (
                <div
                  key={agent.id}
                  id={`agent-action-card-${index + 1}`}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        0{index + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-slate-100 font-mono">
                          {agent.name}
                        </h4>
                        <p className="text-[10px] font-mono text-amber-400">
                          {agent.role}
                        </p>
                      </div>
                    </div>

                    <div className="self-start sm:self-auto">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                        Dor Atacada: <strong className="text-rose-400 font-normal">{agent.targetVulnerability}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Practical Action Description */}
                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-300 font-mono uppercase">
                      <ArrowRight className="w-3 h-3 text-[var(--vx-neon)]" />
                      <span>O que este agente vai fazer na empresa:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed pl-4.5">
                      {agent.specificAction}
                    </p>
                  </div>

                  {/* Invariant / Safety Constraint */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Invariante de Segurança:</span>
                      <strong className="text-emerald-400">{agent.invariant}</strong>
                    </div>
                    <span className="text-slate-500">
                      Zero-GUI • Sub-segundo • Multi-Sig
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            <span>Diagnóstico gerado para: </span>
            <strong className="text-slate-200">{displayCompany.name}</strong>
            <span className="text-slate-500 font-mono"> • {formatCurrency(displayCompany.annualRevenue, currency, language)}/ano</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-close-action-plan-modal-footer"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>

            <button
              id="btn-generate-action-plan-pdf-footer"
              onClick={handleGeneratePdf}
              disabled={isDownloadingPdf}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon-green)] via-teal-400 to-[var(--vx-neon)] hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>PDF do Plano Baixado!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-slate-950" />
                  <span>Gerar PDF do Plano de Ação</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
