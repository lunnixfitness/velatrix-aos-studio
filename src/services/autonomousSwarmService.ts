import { 
  AutonomousAgentId, 
  AutonomousWorkerStatus, 
  ErpCommunicationRoute, 
  SwarmLiveLog, 
  DeadLetterQueueItem, 
  StressTestScenario,
  PipelinePhase 
} from '../types/autonomousSwarm';
import { GovernanceSettings, EnterpriseKnowledgeGraph } from '../types/aos';
import { GENESIS_HASH } from '../utils/auditChain';
import { hashCanonical } from '../shared/crypto/hash';
import { secureId } from '../lib/demoMode';

/**
 * Canonical helper for computing a real SHA-256 hash (0x + 64 hex characters)
 * for swarm ledger events, chaining to previousLedgerHash to guarantee cryptographic immutability.
 */
export async function computeSwarmLedgerHash(
  payload: Record<string, any>,
  previousHash: string = GENESIS_HASH
): Promise<string> {
  const hex = await hashCanonical({
    prevHash: previousHash,
    ...payload
  });
  return '0x' + hex;
}

export function getCurrentTimeFormatted(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `[${h}:${m}:${s}]`;
}

// 1. Initial State of the 6 Autonomous Swarm Workers
export const INITIAL_AUTONOMOUS_WORKERS: AutonomousWorkerStatus[] = [
  {
    agentId: 'agent-fiscal',
    agentName: 'Agente Fiscal & ICMS/ST',
    codeName: 'agent-fiscal',
    color: 'emerald',
    bgBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    borderBadge: 'border-emerald-500/40',
    category: 'fiscal',
    currentStatus: 'LISTENING',
    processedEventsCount: 142,
    mitigatedBleedBrl: 0,
    generatedEconomyBrl: 418500.00,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Emissão/Recepção de NF-e / CT-e via Barramento ERP',
    lastReceipt: 'NFE_CONFORME_SEFAZ_CORRIGIDO',
    lastHash: '0x8f2a1b94c0847e19920b7a8d11c5210984ee2c39d84bf41d9980ae1192837482',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 99.8
  },
  {
    agentId: 'agent-treasury',
    agentName: 'Arbitragem de Tesouraria',
    codeName: 'agent-treasury',
    color: 'amber',
    bgBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    borderBadge: 'border-amber-500/40',
    category: 'treasury',
    currentStatus: 'LISTENING',
    processedEventsCount: 89,
    mitigatedBleedBrl: 15400.00,
    generatedEconomyBrl: 182350.00,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Atualização de Saldo em Caixa / CDI / Liquidação D+30',
    lastReceipt: 'ORDEM_APLICACAO_CDI_103_5_EXECUTADA',
    lastHash: '0x1c984ee2c39d84bf41d9980ae11928374828f2a1b94c0847e19920b7a8d11c52',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 100.0
  },
  {
    agentId: 'agent-anti-fraud',
    agentName: 'Antifraude & Trava de Boletos',
    codeName: 'agent-anti-fraud',
    color: 'rose',
    bgBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    borderBadge: 'border-rose-500/40',
    category: 'anti_fraud',
    currentStatus: 'LISTENING',
    processedEventsCount: 215,
    mitigatedBleedBrl: 895400.00,
    generatedEconomyBrl: 0,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Webhook / OCR de Ordem de Pagamento / Boleto',
    lastReceipt: 'PAGAMENTO_BLOQUEADO_PREVENTIVO_SANG_EVITADA',
    lastHash: '0x7e19920b7a8d11c5210984ee2c39d84bf41d9980ae11928374828f2a1b94c084',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 99.5
  },
  {
    agentId: 'agent-supply-resilience',
    agentName: 'Resiliência de Supply Chain',
    codeName: 'agent-supply-resilience',
    color: 'blue',
    bgBadge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    borderBadge: 'border-blue-500/40',
    category: 'supply_chain',
    currentStatus: 'LISTENING',
    processedEventsCount: 64,
    mitigatedBleedBrl: 620000.00,
    generatedEconomyBrl: 94200.00,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Alerta Força Maior / Atraso Alfandegário / Falha Tier-1',
    lastReceipt: 'COTACAO_EMERGENCIAL_FORNECEDOR_SECUNDARIO_DISPARADA',
    lastHash: '0x39d84bf41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 98.9
  },
  {
    agentId: 'agent-iot-telemetry',
    agentName: 'Telemetria IoT & Câmaras Frias',
    codeName: 'agent-iot-telemetry',
    color: 'purple',
    bgBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    borderBadge: 'border-purple-500/40',
    category: 'iot',
    currentStatus: 'LISTENING',
    processedEventsCount: 3120,
    mitigatedBleedBrl: 340000.00,
    generatedEconomyBrl: 45000.00,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Leitura de Sensores IoT (Temperatura, GPS, Vibração)',
    lastReceipt: 'OS_TECNICA_PREVENTIVA_AGENDADA_COMPRESSOR',
    lastHash: '0x9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84bf41d',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 99.9
  },
  {
    agentId: 'agent-cyber-dejavu',
    agentName: 'CyberSpy & Lock-Down Ransomware',
    codeName: 'agent-cyber-dejavu',
    color: 'red',
    bgBadge: 'bg-red-500/10 text-red-300 border-red-500/30',
    borderBadge: 'border-red-500/40',
    category: 'cyber_secops',
    currentStatus: 'LISTENING',
    processedEventsCount: 48,
    mitigatedBleedBrl: 1500000.00,
    generatedEconomyBrl: 0,
    lastHeartbeat: 'Agora há pouco (D+0)',
    activeTrigger: 'Leitura em Massa / Alteração de Arquivos / Invasão',
    lastReceipt: 'C_LEVEL_PANIC_LOCKDOWN_APIS_ISOLADAS',
    lastHash: '0x41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84b',
    currentPipelinePhase: 'IMMUTABLE_LEDGER',
    consecutiveErrors: 0,
    successRatePct: 100.0
  }
];

// 2. Mapeamento das Rotas / Hooks de Comunicação entre a API dos Agentes e o ERP
export const ERP_COMMUNICATION_ROUTES: ErpCommunicationRoute[] = [
  {
    agentId: 'agent-fiscal',
    agentName: 'Agente Fiscal & ICMS/ST',
    routePath: '/api/v1/erp/nfe/validate-icms-st',
    httpMethod: 'POST',
    description: 'Validação e retificação automática de divergências de NCM, alíquotas de ICMS-ST, MVA original vs ajustada e retenções de impostos antes do aceite fiscal no ERP.',
    triggerEvent: 'Emissão ou recepção de NF-e / CT-e via Barramento de Eventos (TOTVS Protheus / SAP S/4HANA).',
    businessRule: 'Ler XML/AST da nota fiscal, validar NCM e MVA por UF de destino. Corrigir rascunho de lançamento antes da escrituração contábil.',
    outputAction: 'Aplicação de split/ajuste de impostos e emissão de log de economia gerada.',
    successVerification: 'Status da NF-e alterado para CONFORME no ERP e inserção do log [ECONOMIA_GERADA: R$ X] no feed do AOS.',
    authType: 'mTLS Secp256k1',
    successCode: 200,
    fallbackDlqCode: 504,
    supportedErps: ['TOTVS Protheus (MATA103)', 'SAP S/4HANA (J1B1N)', 'Senior Sapiens', 'Omie API'],
    requestPayloadSchema: {
      chaveAcessoNfe: 'string (44 dígitos)',
      ncm: 'string (8 dígitos)',
      ufOrigem: 'string (2 char)',
      ufDestino: 'string (2 char)',
      valorProdutosBrl: 'number',
      aliquotaIcmsOrigem: 'number (%)',
      mvaDeclarada: 'number (%)',
      icmsStRetidoOriginal: 'number'
    },
    responsePayloadSchema: {
      statusAuditoria: "'CONFORME' | 'DIVERGENCIA_CORRIGIDA'",
      mvaCorreta: 'number (%)',
      icmsStAjustadoBrl: 'number',
      economiaGeradaBrl: 'number',
      rascunhoErpStatus: "'ESCRITURACAO_LIBERADA'",
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      chaveAcessoNfe: '35260901234567000189550010000492811982348123',
      ncm: '84713012',
      ufOrigem: 'SP',
      ufDestino: 'MG',
      valorProdutosBrl: 420000.00,
      aliquotaIcmsOrigem: 12.0,
      mvaDeclarada: 58.60,
      icmsStRetidoOriginal: 84520.00
    },
    sampleResponse: {
      statusAuditoria: 'CONFORME',
      mvaCorreta: 41.20,
      icmsStAjustadoBrl: 56320.00,
      economiaGeradaBrl: 28200.00,
      rascunhoErpStatus: 'ESCRITURACAO_LIBERADA',
      ledgerHash: '0x8f2a1b94c0847e19920b7a8d11c5210984ee2c39d84bf41d9980ae1192837482'
    }
  },
  {
    agentId: 'agent-treasury',
    agentName: 'Arbitragem de Tesouraria',
    routePath: '/api/v1/erp/treasury/arbitrage-order',
    httpMethod: 'POST',
    description: 'Execução de transferências e ordens automatizadas de aplicação de liquidez diária (CDI 103,5%) e arbitragem de spread cambial para saldo em caixa excedente.',
    triggerEvent: 'Atualização de saldo em caixa, variação do CDI/Selic ou liquidação de títulos no fluxo D+30.',
    businessRule: 'Analisar margem líquida projetada e liquidez operacional. Manter Z-Score seguro (> 2.9) e colchão de liquidez mínimo (R$ 2.0M).',
    outputAction: 'Ordem de aplicação/resgate automatizada via API bancária / Open Finance BACEN.',
    successVerification: 'Retorno do recibo da transação bancária/ERP com confirmação de taxa aplicável e saldo atualizado.',
    authType: 'mTLS Secp256k1',
    successCode: 201,
    fallbackDlqCode: 503,
    supportedErps: ['TOTVS SE1/SE2 (Finanças)', 'SAP S/4HANA (FI-TRM)', 'Open Finance SPI', 'Senior Finanças'],
    requestPayloadSchema: {
      contaOrigem: 'string',
      saldoDisponivelBrl: 'number',
      colchaoSegurancaExigidoBrl: 'number',
      valorExcedenteAlocarBrl: 'number',
      taxaCdiAlvoPct: 'number',
      horizonteDias: 'number'
    },
    responsePayloadSchema: {
      statusExecucao: "'ORDEM_EXECUTADA'",
      reciboBancarioId: 'string',
      taxaEfetivada: 'string',
      rendimentoProjetadoD30Brl: 'number',
      novoZScoreCalculado: 'number',
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      contaOrigem: 'ITAU_CORP_48291_0',
      saldoDisponivelBrl: 3450000.00,
      colchaoSegurancaExigidoBrl: 2000000.00,
      valorExcedenteAlocarBrl: 1450000.00,
      taxaCdiAlvoPct: 103.5,
      horizonteDias: 30
    },
    sampleResponse: {
      statusExecucao: 'ORDEM_EXECUTADA',
      reciboBancarioId: 'SPI-BACEN-20260911-TX884102',
      taxaEfetivada: '103.5% do CDI (Overnight)',
      rendimentoProjetadoD30Brl: 14820.00,
      novoZScoreCalculado: 3.52,
      ledgerHash: '0x1c984ee2c39d84bf41d9980ae11928374828f2a1b94c0847e19920b7a8d11c52'
    }
  },
  {
    agentId: 'agent-anti-fraud',
    agentName: 'Antifraude & Trava de Boletos',
    routePath: '/api/v1/erp/payments/preventive-block',
    httpMethod: 'POST',
    description: 'Interceptação em milissegundos e bloqueio de pagamentos com duplicidade de frete, notas espelho adulteradas ou linhas digitáveis com desvio de favorecido.',
    triggerEvent: 'Entrada de ordem de pagamento ou boleto via Webhook/OCR de fornecedor.',
    businessRule: 'Cruzar código de barras, CNPJ do emissor e chave PIX com base histórica e Grafo Vetorial. Se risco > 5%, travar preventivamente.',
    outputAction: 'Bloqueio do título no contas a pagar + notificação crítica no painel e dispatch fail-safe.',
    successVerification: 'Confirmação de status PAGAMENTO_BLOQUEADO_PREVENTIVO na API do ERP e log de sangria evitada.',
    authType: 'HMAC-SHA256 Hook',
    successCode: 200,
    fallbackDlqCode: 504,
    supportedErps: ['TOTVS SE2 (Contas a Pagar)', 'SAP S/4HANA (FB60)', 'Senior Sapiens CP', 'Omie Contas a Pagar'],
    requestPayloadSchema: {
      tituloId: 'string',
      codigoBarras: 'string (47 ou 48 dígitos)',
      cnpjEmissor: 'string (14 dígitos)',
      cnpjFavorecidoBoleto: 'string (14 dígitos)',
      chavePixOuConta: 'string',
      valorTituloBrl: 'number',
      duplicidadeFreteDetectada: 'boolean'
    },
    responsePayloadSchema: {
      statusAcao: "'PAGAMENTO_BLOQUEADO_PREVENTIVO'",
      riscoFraudePct: 'number',
      motivoBloqueio: 'string',
      sangriaEvitadaBrl: 'number',
      notificacaoPainel: 'boolean',
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      tituloId: 'CP-99412-FRETE-SP',
      codigoBarras: '341917900101043510047910201500084992100003850000',
      cnpjEmissor: '12.345.678/0001-90',
      cnpjFavorecidoBoleto: '98.765.432/0001-11',
      chavePixOuConta: 'financeiro@fornecedor-fake-sp.com',
      valorTituloBrl: 38500.00,
      duplicidadeFreteDetectada: true
    },
    sampleResponse: {
      statusAcao: 'PAGAMENTO_BLOQUEADO_PREVENTIVO',
      riscoFraudePct: 98.4,
      motivoBloqueio: 'Inconsistência de titularidade entre CNPJ do emissor e beneficiário do boleto bancário (Desvio de Cedente)',
      sangriaEvitadaBrl: 38500.00,
      notificacaoPainel: true,
      ledgerHash: '0x7e19920b7a8d11c5210984ee2c39d84bf41d9980ae11928374828f2a1b94c084'
    }
  },
  {
    agentId: 'agent-supply-resilience',
    agentName: 'Resiliência de Supply Chain',
    routePath: '/api/v1/erp/supply/emergency-rfq',
    httpMethod: 'POST',
    description: 'Disparo autônomo de cotações emergenciais e ordens de compra preventivas para fornecedores homologados secundários no Grafo AOS.',
    triggerEvent: 'Ingestão de alertas de "Força Maior", atrasos alfandegários ou paralisação de fornecedores Tier-1.',
    businessRule: 'Identificar insumos afetados (BOM), recalcular dias de estoque de segurança e acionar fornecedores secundários para zerar risco de parada.',
    outputAction: 'Disparo automático de RFQ/pedidos preventivos e emissão de alerta para o dashboard.',
    successVerification: 'Confirmação do recebimento das cotações emergenciais e recálculo atualizado do risco de parada de fábrica.',
    authType: 'OAuth 2.0 Bearer',
    successCode: 200,
    fallbackDlqCode: 504,
    supportedErps: ['TOTVS SC7 (Compras)', 'SAP MM / Ariba', 'Senior Compras', 'Oracle NetSuite Procurement'],
    requestPayloadSchema: {
      alertaTipo: "'FORCA_MAIOR' | 'GREVE_PORTO' | 'FALHA_TIER1'",
      skuInsumoCritico: 'string',
      fornecedorAfetadoId: 'string',
      diasEstoqueSegurancaRestante: 'number',
      leadTimeEmergencialDias: 'number'
    },
    responsePayloadSchema: {
      statusRequisicao: "'COTACAO_DISPARADA'",
      fornecedoresSecundariosContatados: 'number',
      riscoParadaFabricaAnterior: 'string (%)',
      riscoParadaFabricaAtualizado: 'string (%)',
      custoDeltaEstimadoBrl: 'number',
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      alertaTipo: 'FALHA_TIER1',
      skuInsumoCritico: 'SKU-MICROCONTROLADOR-STM32',
      fornecedorAfetadoId: 'FORN-TIER1-SHANGHAI-TECH',
      diasEstoqueSegurancaRestante: 3,
      leadTimeEmergencialDias: 7
    },
    sampleResponse: {
      statusRequisicao: 'COTACAO_DISPARADA',
      fornecedoresSecundariosContatados: 3,
      riscoParadaFabricaAnterior: '87.5%',
      riscoParadaFabricaAtualizado: '4.2%',
      custoDeltaEstimadoBrl: 4200.00,
      ledgerHash: '0x39d84bf41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c'
    }
  },
  {
    agentId: 'agent-iot-telemetry',
    agentName: 'Telemetria IoT & Câmaras Frias',
    routePath: '/api/v1/erp/maintenance/work-order',
    httpMethod: 'POST',
    description: 'Abertura autônoma de Ordem de Serviço (OS) de manutenção técnica preventiva em compressores e sistemas de refrigeração antes do perecimento de cargas.',
    triggerEvent: 'Leitura de sensores IoT (GPS, Temperatura, Vibração, Diagnóstico de Veículos).',
    businessRule: 'Monitorar desvios térmicos em depósitos/frotas. Identificar falhas preditivas de compressores e despachar OS antes do perecimento da carga.',
    outputAction: 'Abertura de OS técnica autônoma no sistema de manutenção/ERP.',
    successVerification: 'Mudança de status da OS para AGENDADO e notificação confirmada pela equipe técnica.',
    authType: 'OAuth 2.0 Bearer',
    successCode: 201,
    fallbackDlqCode: 504,
    supportedErps: ['TOTVS Manutenção de Ativos', 'SAP PM (Plant Maintenance)', 'Engeman', 'Senior Manutenção'],
    requestPayloadSchema: {
      sensorId: 'string',
      localInstalacao: 'string (ex: Camara_Fria_CD_02)',
      temperaturaAtualCelsius: 'number',
      temperaturaLimiteMax: 'number',
      predicaoFalhaCompressor: 'boolean',
      valorCargaArmazenadaBrl: 'number'
    },
    responsePayloadSchema: {
      statusOrdemServico: "'AGENDADO'",
      osNumero: 'string',
      prioridade: "'CRITICA_EMERGENCIAL'",
      equipeTecnicaDesignada: 'string',
      cargaProtegidaValorBrl: 'number',
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      sensorId: 'IOT-TEMP-CD02-ZONE-A',
      localInstalacao: 'Câmara Fria CD-02 (Vacinas e Perecíveis)',
      temperaturaAtualCelsius: -12.4,
      temperaturaLimiteMax: -18.0,
      predicaoFalhaCompressor: true,
      valorCargaArmazenadaBrl: 340000.00
    },
    sampleResponse: {
      statusOrdemServico: 'AGENDADO',
      osNumero: 'OS-8841-FRIO-PREVENTIVA',
      prioridade: 'CRITICA_EMERGENCIAL',
      equipeTecnicaDesignada: 'Plantão Técnico Refrigeração Industrial (Equipe Alfa)',
      cargaProtegidaValorBrl: 340000.00,
      ledgerHash: '0x9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84bf41d'
    }
  },
  {
    agentId: 'agent-cyber-dejavu',
    agentName: 'CyberSpy & Lock-Down Ransomware',
    routePath: '/api/v1/erp/security/lockdown-isolation',
    httpMethod: 'POST',
    description: 'Isolamento instantâneo de APIs operacionais (ZeroVision Digital / ERP Lock) e disparo de protocolo C-Level Panic Lockdown contra ransomwares ou sabotagens.',
    triggerEvent: 'Detecção de leitura em massa, alteração inesperada de arquivos no servidor ou tentativa de adulteração de boletos.',
    businessRule: 'Avaliar padrões anômalos que caracterizem ataque de ransomware ou alteração maliciosa. Ativar isolamento imediato das APIs operacionais.',
    outputAction: 'Executar protocolo C-Level Panic Lockdown (SCS/OCR) e isolar os nós afetados.',
    successVerification: 'Bloqueio das rotas de gravação críticas e envio de pacote de auditoria com hash criptográfico para o SecOps.',
    authType: 'mTLS Secp256k1',
    successCode: 200,
    fallbackDlqCode: 503,
    supportedErps: ['ZeroVision Gatekeeper', 'TOTVS API Gateway', 'SAP S/4HANA SecOps', 'WAF Cloudflare / AWS Shield'],
    requestPayloadSchema: {
      ameacaDetectada: 'string',
      volumeLeiturasPorMinuto: 'number',
      vetorAtaque: "'MASS_READ_ENCRYPTION' | 'PIX_TAMPERING' | 'ROGUE_ERP_SCRIPT'",
      diretoriosAfetados: 'string[]'
    },
    responsePayloadSchema: {
      statusLockdown: "'ISOLAMENTO_ATIVO'",
      rotasEscritaBloqueadas: 'string[]',
      notificacaoDiretoriaDisparada: 'boolean',
      pacoteAuditoriaHash: 'string',
      ledgerHash: 'string (0x...)'
    },
    sampleRequest: {
      ameacaDetectada: 'Padrão de Ransomware LockBit 4.0 / Alteração massiva de extensões .xlsx e .xml no ERP',
      volumeLeiturasPorMinuto: 1840,
      vetorAtaque: 'MASS_READ_ENCRYPTION',
      diretoriosAfetados: ['/protheus_data/pedidos/', '/sap/transacoes_abertas/']
    },
    sampleResponse: {
      statusLockdown: 'ISOLAMENTO_ATIVO',
      rotasEscritaBloqueadas: ['/api/v1/erp/payments/*', '/api/v1/erp/nfe/save-draft', '/api/v1/erp/bank/transfer'],
      notificacaoDiretoriaDisparada: true,
      pacoteAuditoriaHash: '0x41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84b',
      ledgerHash: '0x41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84b'
    }
  }
];

// 3. Initial Mock Live Logs in the exact requested format:
// [HH:MM:SS] [NOME_DO_AGENTE] Ação realizada com sucesso | Resultado / Economia Gerada
function createChainedInitialLogs(): SwarmLiveLog[] {
  type BaseLogEntry = Omit<SwarmLiveLog, 'timestamp' | 'ledgerHash' | 'previousLedgerHash'> & { minutesAgo: number };
  const baseEntries: BaseLogEntry[] = [
    {
      id: 'log_init_5',
      timeFormatted: '[14:08:10]',
      minutesAgo: 35,
      agentId: 'agent-supply-resilience',
      agentName: 'Resiliência de Supply Chain',
      actionTitle: 'Disparo de Cotações Emergenciais para Semicondutores Tier-1',
      resultSummary: '3 fornecedores secundários acionados | Risco Parada reduzido de 87% para 4%',
      rawFormattedLog: '[14:08:10] [Resiliência de Supply Chain] Ação realizada com sucesso | Cotações emergenciais disparadas para cobrir déficit Tier-1 [SANGRIA_EVITADA: R$ 620.000,00]',
      bleedPreventedBrl: 620000.00,
      severity: 'SUCCESS',
      status: 'COTACAO_DISPARADA',
      targetEntity: 'SKU Microcontrolador STM32',
      erpResponseCode: 200,
      erpEndpoint: '/api/v1/erp/supply/emergency-rfq'
    },
    {
      id: 'log_init_4',
      timeFormatted: '[14:23:55]',
      minutesAgo: 20,
      agentId: 'agent-iot-telemetry',
      agentName: 'Telemetria IoT & Câmaras Frias',
      actionTitle: 'Ordem de Manutenção Preventiva em Câmara Fria CD-02',
      resultSummary: 'OS-8841-FRIO agendada preventivamente | Carga Protegida: R$ 340.000,00',
      rawFormattedLog: '[14:23:55] [Telemetria IoT & Câmaras Frias] Ação realizada com sucesso | OS técnica agendada para reparo de compressor CD-02 [SANGRIA_EVITADA: R$ 340.000,00]',
      bleedPreventedBrl: 340000.00,
      severity: 'WARNING',
      status: 'AGENDADO',
      targetEntity: 'Câmara Fria CD-02',
      erpResponseCode: 201,
      erpEndpoint: '/api/v1/erp/maintenance/work-order'
    },
    {
      id: 'log_init_3',
      timeFormatted: '[14:31:40]',
      minutesAgo: 12,
      agentId: 'agent-treasury',
      agentName: 'Arbitragem de Tesouraria',
      actionTitle: 'Alocação de Saldo Excedente em Aplicação Automática CDI',
      resultSummary: 'Ordem de R$ 1.450.000,00 enviada ao banco | Rendimento Projetado: R$ 14.820,00',
      rawFormattedLog: '[14:31:40] [Arbitragem de Tesouraria] Ação realizada com sucesso | Ordem de aplicação a 103,5% do CDI executada via Open Finance [ECONOMIA_GERADA: R$ 14.820,00]',
      economyBrl: 14820.00,
      severity: 'SUCCESS',
      status: 'ORDEM_EXECUTADA',
      targetEntity: 'Conta Itaú Corp 48291',
      erpResponseCode: 201,
      erpEndpoint: '/api/v1/erp/treasury/arbitrage-order'
    },
    {
      id: 'log_init_2',
      timeFormatted: '[14:38:15]',
      minutesAgo: 5,
      agentId: 'agent-anti-fraud',
      agentName: 'Antifraude & Trava de Boletos',
      actionTitle: 'Bloqueio Preventivo de Boleto com Duplicidade de Frete',
      resultSummary: 'Título CP-99412 bloqueado preventivamente no ERP | Sangria Evitada: R$ 38.500,00',
      rawFormattedLog: '[14:38:15] [Antifraude & Trava de Boletos] Ação realizada com sucesso | Título CP-99412 bloqueado preventivamente no ERP [SANGRIA_EVITADA: R$ 38.500,00]',
      bleedPreventedBrl: 38500.00,
      severity: 'CRITICAL',
      status: 'PAGAMENTO_BLOQUEADO_PREVENTIVO',
      targetEntity: 'Título CP-99412',
      erpResponseCode: 200,
      erpEndpoint: '/api/v1/erp/payments/preventive-block'
    },
    {
      id: 'log_init_1',
      timeFormatted: '[14:41:02]',
      minutesAgo: 2,
      agentId: 'agent-fiscal',
      agentName: 'Agente Fiscal & ICMS/ST',
      actionTitle: 'Ajuste de Alíquota ICMS-ST e MVA de Rascunho NF-e',
      resultSummary: 'NF-e 00049281 ajustada para CONFORME no TOTVS | Economia Gerada: R$ 28.200,00',
      rawFormattedLog: '[14:41:02] [Agente Fiscal & ICMS/ST] Ação realizada com sucesso | NF-e 00049281 ajustada para CONFORME no TOTVS [ECONOMIA_GERADA: R$ 28.200,00]',
      economyBrl: 28200.00,
      severity: 'SUCCESS',
      status: 'CONFORME',
      targetEntity: 'NF-e 00049281 (MG)',
      erpResponseCode: 200,
      erpEndpoint: '/api/v1/erp/nfe/validate-icms-st'
    }
  ];

  const INITIAL_HASHES = [
    '0x41d9980ae11928374828f2a1b94c0847e19920b7a8d11c5210984ee2c39d84b1',
    '0x5a2e89b1c034789df872134aa89c0942e58913b7a8d11c5210984ee2c39d84b2',
    '0x6b3f9ac2d145890ef983245bb9ad1053f69024c8b9e22d6321a95ff3d40e95c3',
    '0x7c4a0bd3e256901fa094356cc0be2164a70135d9caf33e7432ba0014e51fa6d4',
    '0x8d5b1ce4f3670120b1a5467dd1cf3275b81246e0db044f8543cb1125f620b7e5'
  ];

  let prevHash = GENESIS_HASH;
  const builtLogs: SwarmLiveLog[] = [];

  for (let i = 0; i < baseEntries.length; i++) {
    const entry = baseEntries[i];
    const timestamp = new Date(Date.now() - 1000 * 60 * entry.minutesAgo).toISOString();
    const hash = INITIAL_HASHES[i % INITIAL_HASHES.length];

    const { minutesAgo: _, ...cleanEntry } = entry;
    builtLogs.push({
      ...cleanEntry,
      timestamp,
      ledgerHash: hash,
      previousLedgerHash: prevHash
    });

    prevHash = hash;
  }

  // Reverse so newest log (log_init_1) is at index 0
  return builtLogs.reverse();
}

export const INITIAL_SWARM_LOGS: SwarmLiveLog[] = createChainedInitialLogs();

// 4. Stress Test Scenarios for the 6 Autonomous Agents
export const SWARM_STRESS_SCENARIOS: StressTestScenario[] = [
  {
    id: 'stress_fiscal_1',
    agentId: 'agent-fiscal',
    agentName: 'Agente Fiscal & ICMS/ST',
    scenarioTitle: 'Auditoria D+0: NF-e Interestadual com MVA e NCM Divergentes',
    description: 'Recepção de lote de 120 NF-es da filial de MG com alíquotas de ICMS-ST calculadas com MVA inflada (58.6% em vez de 41.2%), provocando bi-tributação indevida.',
    severity: 'High',
    valueBrl: 18450.00,
    expectedEconomyBrl: 18450.00,
    expectedOutcomeStatus: 'CONFORME',
    targetEntity: 'Lote NF-e #00049301 a #00049420 (SP ➔ MG)',
    requiresMultiSig: false, // <= 25k
    triggerEventPayload: {
      loteNfeId: 'LOTE-SEFAZ-SP-MG-493',
      totalNotas: 120,
      ncmDetectado: '84713012',
      mvaAplicadaErp: 58.60,
      mvaCorretaConvConfaz: 41.20,
      baseIcmsOriginalBrl: 310000.00
    }
  },
  {
    id: 'stress_treasury_1',
    agentId: 'agent-treasury',
    agentName: 'Arbitragem de Tesouraria',
    scenarioTitle: 'Liquidação de Carteira D+30: Arbitragem de Saldo Excedente R$ 850k',
    description: 'Identificação de entrada de R$ 850.000,00 via BACEN SPI com caixa livre superior à invariante de segurança. Alocação automática em CDB 103,5% CDI com resgate diário.',
    severity: 'Medium',
    valueBrl: 850000.00,
    expectedEconomyBrl: 8750.00, // rendimento do período
    expectedOutcomeStatus: 'ORDEM_EXECUTADA',
    targetEntity: 'Conta Safra Corporate 99120',
    requiresMultiSig: true, // > 25k requires multi-sig confirmation
    triggerEventPayload: {
      contaOrigem: 'SAFRA_CORP_99120',
      saldoDisponivelBrl: 2850000.00,
      colchaoSegurancaExigidoBrl: 2000000.00,
      valorExcedenteAlocarBrl: 850000.00,
      taxaCdiAlvoPct: 103.5
    }
  },
  {
    id: 'stress_antifraud_1',
    agentId: 'agent-anti-fraud',
    agentName: 'Antifraude & Trava de Boletos',
    scenarioTitle: 'Interceptação de Boleto com Linha Digitável Alterada (Golpe do Frete)',
    description: 'Detecção de boleto falso de frete no valor de R$ 74.200,00 com código de barras apontando para conta de pessoa física em banco digital diferente da transportadora homologada.',
    severity: 'Critical',
    valueBrl: 74200.00,
    expectedBleedPreventedBrl: 74200.00,
    expectedOutcomeStatus: 'PAGAMENTO_BLOQUEADO_PREVENTIVO',
    targetEntity: 'Boleto Falso Frete #88419-SP',
    requiresMultiSig: false, // Bloqueio preventivo não necessita autorização prévia para salvar capital
    triggerEventPayload: {
      tituloId: 'CP-BOLETO-FRETE-SUSPEITO-88419',
      codigoBarras: '237917900101043510047910201500084992100007420000',
      cnpjTransportadoraReal: '04.123.456/0001-88',
      cnpjBeneficiarioBoleto: '55.987.654/0001-01',
      divergenciaNome: 'TRANSPORTES RAPIDO FRAUDE LTDA',
      valorBrl: 74200.00
    }
  },
  {
    id: 'stress_supply_1',
    agentId: 'agent-supply-resilience',
    agentName: 'Resiliência de Supply Chain',
    scenarioTitle: 'Alerta Força Maior: Atraso de 14 dias no Porto de Santos (Resina Polimérica)',
    description: 'Notificação de bloqueio aduaneiro no porto de Santos impactando insumo da linha de montagem com 2 dias de estoque. Disparo de RFQ para 2 petroquímicas nacionais no Grafo.',
    severity: 'High',
    valueBrl: 110000.00,
    expectedBleedPreventedBrl: 450000.00,
    expectedOutcomeStatus: 'COTACAO_DISPARADA',
    targetEntity: 'Insumo Resina Polimérica R-902',
    requiresMultiSig: true, // > 25k
    triggerEventPayload: {
      portoAtraso: 'Porto de Santos (Canal Vermelho)',
      skuInsumo: 'RESINA-POLIMERO-R902',
      estoqueRestanteHoras: 48,
      fornecedoresAlternativosGrafo: ['Braskem Petroquímica', 'Innovare Termoplásticos'],
      riscoParadaEstimado: '92%'
    }
  },
  {
    id: 'stress_iot_1',
    agentId: 'agent-iot-telemetry',
    agentName: 'Telemetria IoT & Câmaras Frias',
    scenarioTitle: 'Alarme Térmico: Degrau de +7°C na Câmara Fria CD-02 (Carga de R$ 520k)',
    description: 'Sensores IoT na câmara fria CD-02 registram elevação de -21°C para -14°C e vibração anômala no compressor 3. Abertura autônoma de OS técnica de manutenção emergencial.',
    severity: 'Critical',
    valueBrl: 520000.00,
    expectedBleedPreventedBrl: 520000.00,
    expectedOutcomeStatus: 'AGENDADO',
    targetEntity: 'Câmara Fria CD-02 (Depósito Central)',
    requiresMultiSig: false,
    triggerEventPayload: {
      sensorTempId: 'IOT-CD02-TEMP-SENSOR-3',
      tempAtual: -14.2,
      tempLimite: -18.0,
      vibracaoCompressorMmS: 8.4,
      cargaValorBrl: 520000.00
    }
  },
  {
    id: 'stress_cyber_1',
    agentId: 'agent-cyber-dejavu',
    agentName: 'CyberSpy & Lock-Down Ransomware',
    scenarioTitle: 'Detecção de Comportamento Anômalo: Leitura em Massa de Arquivos de Faturamento',
    description: 'Disparo de alerta SecOps por processo desconhecido lendo 2.400 arquivos de contas a pagar por minuto. Ativação imediata do protocolo C-Level Panic Lockdown com corte das APIs de gravação.',
    severity: 'Critical',
    valueBrl: 0,
    expectedBleedPreventedBrl: 2500000.00,
    expectedOutcomeStatus: 'ISOLAMENTO_ATIVO',
    targetEntity: 'Servidor ERP Banco de Dados (Nó 04)',
    requiresMultiSig: false,
    triggerEventPayload: {
      ipOrigem: '192.168.10.144 (Estação Financeiro 03)',
      processoSuspeito: 'svchost_updater.exe',
      leiturasPorMinuto: 2400,
      tentativaAlteracaoPix: true
    }
  },
  {
    id: 'stress_treasury_liquidity_crisis',
    agentId: 'agent-treasury',
    agentName: 'Arbitragem de Tesouraria',
    scenarioTitle: 'Simulação de Estresse: Dreno de Liquidez Abaixo do Colchão R$ 2.0M',
    description: 'Solicitação de aporte/distribuição de R$ 600.000,00 quando o saldo real em caixa está em R$ 1.480.000,00, violando a invariante de colchão de segurança de R$ 2.000.000,00.',
    severity: 'Critical',
    valueBrl: 600000.00,
    expectedBleedPreventedBrl: 0,
    expectedOutcomeStatus: 'BLOQUEADO_COLCHAO_INSUFICIENTE',
    targetEntity: 'Conta Tesouraria Master 01',
    requiresMultiSig: true,
    simulatedCashBalanceBrl: 1480000.00,
    isCashOutflow: true,
    triggerEventPayload: {
      contaOrigem: 'MASTER_TESOURARIA_01',
      saldoDisponivelBrl: 1480000.00,
      colchaoSegurancaExigidoBrl: 2000000.00,
      valorSolicitadoBrl: 600000.00,
      tipoOperacao: 'DRENO_LIQUIDEZ_APORTE'
    }
  },
  {
    id: 'stress_supply_sla_breach',
    agentId: 'agent-supply-resilience',
    agentName: 'Resiliência de Supply Chain',
    scenarioTitle: 'Simulação de Estresse: Ruptura Crítica com Violação de SLA (< 98.0%)',
    description: 'Greve portuária em Santos sem fornecedor alternativo secundário disponível provoca paralisação e queda no SLA medido para 95.8%, violando a invariante de conformidade Tier-A (98.0%).',
    severity: 'Critical',
    valueBrl: 180000.00,
    expectedBleedPreventedBrl: 320000.00,
    expectedOutcomeStatus: 'ALERTA_VIOLACAO_SLA',
    targetEntity: 'Linha de Montagem Tier-A (SP-01)',
    requiresMultiSig: true,
    simulatedSlaCompliancePct: 95.8,
    triggerEventPayload: {
      localizacaoParada: 'Porto de Santos (Canal Vermelho Prolongado)',
      slaAtualPct: 95.8,
      slaMinimoExigidoPct: 98.0,
      tempoParadaPrevistoHoras: 96,
      clientesImpactados: ['Tier-A Montadoras Automotivas']
    }
  }
];

// 5. Dead Letter Queue initial state
export const INITIAL_DEAD_LETTER_QUEUE: DeadLetterQueueItem[] = [
  {
    id: 'dlq_item_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    agentId: 'agent-fiscal',
    agentName: 'Agente Fiscal & ICMS/ST',
    endpoint: '/api/v1/erp/nfe/validate-icms-st',
    payload: { chaveAcesso: '35260901234567000189550010000491901982348101', valor: 45000, recoverOnAttempt: 4 },
    errorReason: 'ERP TOTVS Protheus Timeout HTTP 504 (Gateway timeout durante fechamento fiscal)',
    retryCount: 2,
    maxRetries: 5,
    nextRetryDelayMs: 4000, // 4s backoff exponencial
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    status: 'WAITING_RETRY',
    ledgerHash: '0x3a9f24b81c4e7d9283e401b2a3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6'
  },
  {
    id: 'dlq_item_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    agentId: 'agent-treasury',
    agentName: 'Arbitragem de Tesouraria',
    endpoint: '/api/v1/erp/treasury/arbitrage-order',
    payload: { conta: 'BRADESCO_CORP_1102', valor: 120000, recoverOnAttempt: 3 },
    errorReason: 'API Open Finance Banco Central em manutenção programada (HTTP 503)',
    retryCount: 1,
    maxRetries: 5,
    nextRetryDelayMs: 2000,
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    status: 'WAITING_RETRY',
    ledgerHash: '0x7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4'
  }
];

// Execution Pipeline Engine
export interface PipelineExecutionResult {
  agentId: AutonomousAgentId;
  agentName: string;
  scenarioTitle: string;
  status: 'SUCCESS' | 'BLOCKED_HUMAN_IN_THE_LOOP' | 'FALLBACK_DLQ';
  currentPhase: PipelinePhase;
  liveLog: SwarmLiveLog;
  dlqItem?: DeadLetterQueueItem;
  invariantChecks: {
    invariantName: string;
    passed: boolean;
    details: string;
  }[];
  quorumResult: {
    requiresMultiSig: boolean;
    quorumCountRequired: number;
    budgetThresholdBrl: number;
    valueBrl: number;
    approvedAutonomously: boolean;
  };
  erpReceipt: string;
  ledgerHash: string;
  previousHash: string;
}

export async function runAutonomousPipeline(
  scenario: StressTestScenario,
  governanceSettings: GovernanceSettings,
  currentGraph: EnterpriseKnowledgeGraph,
  previousHeadHash: string = GENESIS_HASH,
  simulateNetworkFailure: boolean = false
): Promise<PipelineExecutionResult> {
  const timeFormatted = getCurrentTimeFormatted();
  const maxBudget = governanceSettings?.maxAutonomousBudgetBrl || 25000;
  const isBudgetBreached = (scenario.valueBrl > maxBudget) && scenario.requiresMultiSig;

  // 1. Invariante Real: Saldo_Caixa_Minimo (Colchão de Liquidez)
  const configuredMinCash = governanceSettings?.invariants?.find(
    i => i.id === 'inv_cash_min' || i.name.toLowerCase().includes('saldo_caixa') || i.name.toLowerCase().includes('caixa_minimo')
  )?.value;
  const minCashBufferBrl = typeof configuredMinCash === 'number' ? configuredMinCash : 2000000;

  let realCashBalanceBrl = 8420000;
  let cashSource = 'Nó 01 do Grafo Semântico [Reserva Emergencial & OPEX - TOTVS / Open Finance D+0]';

  if (scenario.simulatedCashBalanceBrl !== undefined) {
    realCashBalanceBrl = scenario.simulatedCashBalanceBrl;
    cashSource = `Cenário de Estresse [Simulação de Liquidez D+0: R$ ${realCashBalanceBrl.toLocaleString('pt-BR')}]`;
  } else if (scenario.triggerEventPayload?.saldoDisponivelBrl !== undefined) {
    realCashBalanceBrl = Number(scenario.triggerEventPayload.saldoDisponivelBrl);
    cashSource = `Evento de Gatilho ERP [Saldo em Conta: R$ ${realCashBalanceBrl.toLocaleString('pt-BR')}]`;
  } else if (currentGraph?.nodes && currentGraph.nodes.length > 0) {
    const cashNode = currentGraph.nodes.find(n => 
      n.id === 'node_01_reserva_emergencia' || 
      n.nodeCode === 'NO_01_RESERVA_EMERGENCIA' ||
      (n.category === 'treasury' && (n.label.toLowerCase().includes('reserva') || n.label.toLowerCase().includes('caixa')))
    );
    if (cashNode) {
      if (cashNode.telemetry?.currentVal) {
        const match = cashNode.telemetry.currentVal.replace(/\./g, '').match(/\d+/);
        if (match) {
          realCashBalanceBrl = parseFloat(match[0]);
          cashSource = `Grafo Semântico em Tempo Real (Nó: ${cashNode.label} - ${cashNode.telemetry.syncedSystem || 'Open Finance'})`;
        }
      } else if (cashNode.metricValue) {
        const match = cashNode.metricValue.replace(/\./g, '').match(/\d+/);
        if (match) {
          realCashBalanceBrl = parseFloat(match[0]);
          cashSource = `Grafo Semântico (Métrica do Nó: ${cashNode.label})`;
        }
      }
    }
  }

  const cashDrain = scenario.isCashOutflow ? scenario.valueBrl : 0;
  const projectedCashBrl = realCashBalanceBrl - cashDrain;
  const isCashBufferPreserved = projectedCashBrl >= minCashBufferBrl;

  // 2. Invariante Real: Teto Orçamentário Autônomo
  const isBudgetWithinTacticLimit = !isBudgetBreached;

  // 3. Invariante Real: Risco de Fraude
  let fraudRiskDetected = false;
  let fraudDetails = 'Validação de duplicidade de frete e integridade na linha digitável verificada.';
  if (scenario.agentId === 'agent-anti-fraud' || scenario.triggerEventPayload?.tentativaAlteracaoPix || scenario.triggerEventPayload?.divergenciaNome) {
    fraudRiskDetected = true;
    fraudDetails = scenario.expectedBleedPreventedBrl 
      ? `Inconsistência identificada com sangria evitada de R$ ${scenario.expectedBleedPreventedBrl.toLocaleString('pt-BR')}. Interceptação acionada.`
      : 'Risco de fraude identificado na linha digitável ou credenciais bancárias.';
  }
  const isFraudProtected = !fraudRiskDetected || scenario.expectedOutcomeStatus === 'PAGAMENTO_BLOQUEADO_PREVENTIVO';

  // 4. Invariante Real: SLA Compliance Tier-A
  const configuredMinSla = governanceSettings?.invariants?.find(
    i => i.id === 'inv_sla_min' || i.name.toLowerCase().includes('sla')
  )?.value;
  const minSlaThresholdPct = typeof configuredMinSla === 'number' ? configuredMinSla : 98.0;

  let realSlaMeasuredPct = 99.4;
  let slaSource = 'Nó 20 do Grafo [Radar Anti-Churn Clientes Tier-A - Retenção 99.4%]';

  if (scenario.simulatedSlaCompliancePct !== undefined) {
    realSlaMeasuredPct = scenario.simulatedSlaCompliancePct;
    slaSource = `Cenário de Estresse [SLA Medido: ${realSlaMeasuredPct.toFixed(1)}%]`;
  } else if (scenario.triggerEventPayload?.slaAtualPct !== undefined) {
    realSlaMeasuredPct = Number(scenario.triggerEventPayload.slaAtualPct);
    slaSource = `Telemetria Contratual ERP [SLA Atual: ${realSlaMeasuredPct.toFixed(1)}%]`;
  } else if (currentGraph?.nodes && currentGraph.nodes.length > 0) {
    const slaNode = currentGraph.nodes.find(n => 
      n.id === 'node_20_prevencao_churn_clientes' || 
      n.id === 'node_44_alertas_sla_contratual' || 
      n.label.toLowerCase().includes('sla') ||
      n.label.toLowerCase().includes('tier-a')
    );
    if (slaNode && slaNode.metricValue && slaNode.metricValue.includes('%')) {
      const match = slaNode.metricValue.match(/(\d+(\.\d+)?)/);
      if (match) {
        realSlaMeasuredPct = parseFloat(match[1]);
        slaSource = `Grafo Semântico em Tempo Real (Nó: ${slaNode.label} - ${slaNode.erpBridge || 'CRM'})`;
      }
    }
  }

  const isSlaPreserved = realSlaMeasuredPct >= minSlaThresholdPct;

  // Invariants verification list with dynamic values
  const invariantChecks = [
    {
      invariantName: `Saldo_Caixa_Minimo (Colchão Exigido: R$ ${minCashBufferBrl.toLocaleString('pt-BR')})`,
      passed: isCashBufferPreserved,
      details: isCashBufferPreserved
        ? `Saldo de caixa D+0 projetado (R$ ${projectedCashBrl.toLocaleString('pt-BR')}) atende o colchão estipulado pelo conselho. Origem: ${cashSource}.`
        : `VIOLAÇÃO DE INVARIANTE: Saldo projetado (R$ ${projectedCashBrl.toLocaleString('pt-BR')}) drena o caixa abaixo do piso mínimo de segurança de R$ ${minCashBufferBrl.toLocaleString('pt-BR')}. Origem: ${cashSource}.`
    },
    {
      invariantName: `Teto_Orcamentario_Autonomo (<= R$ ${maxBudget.toLocaleString('pt-BR')})`,
      passed: isBudgetWithinTacticLimit,
      details: isBudgetWithinTacticLimit 
        ? `Valor R$ ${scenario.valueBrl.toLocaleString('pt-BR')} está dentro do limite tático seguro.`
        : `Valor R$ ${scenario.valueBrl.toLocaleString('pt-BR')} excede o teto autônomo sem Multi-Sig humano.`
    },
    {
      invariantName: 'Risco_Fraude_Threshold (<= 5.0%)',
      passed: isFraudProtected,
      details: fraudDetails
    },
    {
      invariantName: `SLA_Compliance_TierA_Minimo (>= ${minSlaThresholdPct.toFixed(1)}%)`,
      passed: isSlaPreserved,
      details: isSlaPreserved
        ? `SLA medido em ${realSlaMeasuredPct.toFixed(1)}% atende o patamar mínimo contratual de ${minSlaThresholdPct.toFixed(1)}%. Origem: ${slaSource}.`
        : `VIOLAÇÃO DE SLA: Desempenho medido (${realSlaMeasuredPct.toFixed(1)}%) abaixo da meta contratual de ${minSlaThresholdPct.toFixed(1)}% para clientes estratégicos. Origem: ${slaSource}.`
    }
  ];

  // Multi-Sig Quorum Logic
  const quorumResult = {
    requiresMultiSig: isBudgetBreached,
    quorumCountRequired: governanceSettings?.multiSigQuorumCount || 2,
    budgetThresholdBrl: maxBudget,
    valueBrl: scenario.valueBrl,
    approvedAutonomously: !isBudgetBreached
  };

  // If simulate network failure or timeout => Dead Letter Queue
  if (simulateNetworkFailure) {
    const route = ERP_COMMUNICATION_ROUTES.find(r => r.agentId === scenario.agentId);
    const dlqItemId = `dlq_${Date.now()}_${secureId('', 4)}`;
    const dlqTimestamp = new Date().toISOString();

    const dlqHash = await hashCanonical({
      prevHash: previousHeadHash,
      type: 'DEAD_LETTER_QUEUE_ENTRY',
      id: dlqItemId,
      agentId: scenario.agentId,
      endpoint: route?.routePath || '/api/v1/erp/dispatch',
      payload: scenario.triggerEventPayload,
      timestamp: dlqTimestamp
    });

    const dlqItem: DeadLetterQueueItem = {
      id: dlqItemId,
      timestamp: dlqTimestamp,
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      endpoint: route?.routePath || '/api/v1/erp/dispatch',
      payload: scenario.triggerEventPayload,
      errorReason: 'Falha de conexão com Webhook do ERP (HTTP 504 Gateway Timeout - Host Unreachable)',
      retryCount: 0,
      maxRetries: 5,
      nextRetryDelayMs: 1000,
      lastAttemptAt: dlqTimestamp,
      status: 'WAITING_RETRY',
      ledgerHash: dlqHash
    };

    const dlqLog: SwarmLiveLog = {
      id: `log_dlq_${Date.now()}`,
      timestamp: dlqTimestamp,
      timeFormatted,
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      actionTitle: `Falha de Transmissão ERP ➔ Inserido na Dead Letter Queue (DLQ)`,
      resultSummary: `Evento colocado em fila para retentativa exponencial | Motivo: Timeout HTTP 504`,
      rawFormattedLog: `${timeFormatted} [${scenario.agentName}] Falha de conexão com ERP | Evento em Dead Letter Queue com retentativa exponencial`,
      severity: 'WARNING',
      status: 'DLQ_RETRY',
      targetEntity: scenario.targetEntity,
      ledgerHash: dlqHash,
      previousLedgerHash: previousHeadHash,
      erpResponseCode: 504,
      erpEndpoint: route?.routePath || '/api/v1/erp/dispatch'
    };

    return {
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      scenarioTitle: scenario.scenarioTitle,
      status: 'FALLBACK_DLQ',
      currentPhase: 'AUTONOMOUS_EXECUTION',
      liveLog: dlqLog,
      dlqItem,
      invariantChecks,
      quorumResult,
      erpReceipt: 'FALLBACK_DLQ_RETENTATIVA_EXPONENCIAL',
      ledgerHash: dlqHash,
      previousHash: previousHeadHash
    };
  }

  // If requires Multi-Sig approval
  if (isBudgetBreached) {
    const msTimestamp = new Date().toISOString();
    const msHash = await hashCanonical({
      prevHash: previousHeadHash,
      type: 'MULTISIG_CHALLENGE_PENDING',
      scenarioId: scenario.id,
      agentId: scenario.agentId,
      valueBrl: scenario.valueBrl,
      targetEntity: scenario.targetEntity,
      timestamp: msTimestamp
    });

    const multiSigLog: SwarmLiveLog = {
      id: `log_ms_${Date.now()}`,
      timestamp: msTimestamp,
      timeFormatted,
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      actionTitle: `Ação Pausada: Requer Aprovação Human-In-The-Loop (Multi-Sig)`,
      resultSummary: `Operação de R$ ${scenario.valueBrl.toLocaleString('pt-BR')} requer quórum de ${quorumResult.quorumCountRequired} assinaturas`,
      rawFormattedLog: `${timeFormatted} [${scenario.agentName}] Ação pausada por governança | Limiar de R$ ${maxBudget.toLocaleString('pt-BR')} excedido [AGUARDANDO_MULTI_SIG]`,
      severity: 'WARNING',
      status: 'HUMAN_APPROVAL_REQUIRED',
      targetEntity: scenario.targetEntity,
      ledgerHash: msHash,
      previousLedgerHash: previousHeadHash,
      erpResponseCode: 428,
      erpEndpoint: '/api/v1/governance/multi-sig/challenge',
      requiresMultiSig: true
    };

    return {
      agentId: scenario.agentId,
      agentName: scenario.agentName,
      scenarioTitle: scenario.scenarioTitle,
      status: 'BLOCKED_HUMAN_IN_THE_LOOP',
      currentPhase: 'DELIBERATION_QUORUM',
      liveLog: multiSigLog,
      invariantChecks,
      quorumResult,
      erpReceipt: 'AGUARDANDO_ASSINATURAS_MULTI_SIG',
      ledgerHash: msHash,
      previousHash: previousHeadHash
    };
  }

  // Autonomous Execution Success
  const successTimestamp = new Date().toISOString();
  const payloadToHash = {
    prevHash: previousHeadHash,
    agentId: scenario.agentId,
    scenarioId: scenario.id,
    timestamp: successTimestamp,
    targetEntity: scenario.targetEntity,
    valueBrl: scenario.valueBrl,
    status: scenario.expectedOutcomeStatus,
    erpReceipt: `ERP_STATUS_${scenario.expectedOutcomeStatus}_CONFIRMADO`
  };
  const newHash = await hashCanonical(payloadToHash);

  // Build standard format log: [HH:MM:SS] [NOME_DO_AGENTE] Ação realizada com sucesso | Resultado / Economia Gerada
  let resultPhrase = '';
  if (scenario.expectedEconomyBrl) {
    resultPhrase = `Ajuste efetuado no ERP com sucesso [ECONOMIA_GERADA: R$ ${scenario.expectedEconomyBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}]`;
  } else if (scenario.expectedBleedPreventedBrl) {
    resultPhrase = `Intervenção preventiva executada [SANGRIA_EVITADA: R$ ${scenario.expectedBleedPreventedBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}]`;
  } else {
    resultPhrase = `Comando executado no ERP com status ${scenario.expectedOutcomeStatus} | Grafo atualizado D+0`;
  }

  const rawFormattedLog = `${timeFormatted} [${scenario.agentName}] Ação realizada com sucesso | ${resultPhrase}`;

  const successLog: SwarmLiveLog = {
    id: `log_success_${Date.now()}`,
    timestamp: successTimestamp,
    timeFormatted,
    agentId: scenario.agentId,
    agentName: scenario.agentName,
    actionTitle: scenario.scenarioTitle,
    resultSummary: resultPhrase,
    rawFormattedLog,
    economyBrl: scenario.expectedEconomyBrl,
    bleedPreventedBrl: scenario.expectedBleedPreventedBrl,
    severity: scenario.expectedBleedPreventedBrl ? 'CRITICAL' : 'SUCCESS',
    status: scenario.expectedOutcomeStatus as any,
    targetEntity: scenario.targetEntity,
    ledgerHash: newHash,
    previousLedgerHash: previousHeadHash,
    erpResponseCode: 200,
    erpEndpoint: ERP_COMMUNICATION_ROUTES.find(r => r.agentId === scenario.agentId)?.routePath || '/api/v1/erp/success'
  };

  return {
    agentId: scenario.agentId,
    agentName: scenario.agentName,
    scenarioTitle: scenario.scenarioTitle,
    status: 'SUCCESS',
    currentPhase: 'IMMUTABLE_LEDGER',
    liveLog: successLog,
    invariantChecks,
    quorumResult,
    erpReceipt: `ERP_STATUS_${scenario.expectedOutcomeStatus}_CONFIRMADO`,
    ledgerHash: newHash,
    previousHash: previousHeadHash
  };
}

/**
 * Validates the cryptographic integrity of the Swarm Live Log Hash-Chain.
 * Ensures every record's previousLedgerHash matches the previous record's ledgerHash,
 * tracing all the way back to GENESIS_HASH.
 */
export function validateSwarmLogChain(logs: SwarmLiveLog[]): {
  isValid: boolean;
  totalBlocks: number;
  genesisHash: string;
  headHash: string;
  brokenAt?: number;
  reason?: string;
} {
  if (!logs || logs.length === 0) {
    return { isValid: true, totalBlocks: 0, genesisHash: GENESIS_HASH, headHash: GENESIS_HASH };
  }

  // Sort chronological ascending (oldest -> newest)
  const chronological = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  let expectedPrev = GENESIS_HASH;

  for (let i = 0; i < chronological.length; i++) {
    const item = chronological[i];
    if (item.previousLedgerHash && item.previousLedgerHash !== expectedPrev) {
      return {
        isValid: false,
        totalBlocks: chronological.length,
        genesisHash: GENESIS_HASH,
        headHash: item.ledgerHash,
        brokenAt: i + 1,
        reason: `Descontinuidade na Hash-Chain do Enxame: Bloco #${i + 1} (${item.agentName}) possui prevHash='${item.previousLedgerHash?.slice(0, 14)}...' diferente do hash esperado='${expectedPrev.slice(0, 14)}...'`
      };
    }

    if (!item.ledgerHash || !item.ledgerHash.startsWith('0x') || item.ledgerHash.length !== 66) {
      return {
        isValid: false,
        totalBlocks: chronological.length,
        genesisHash: GENESIS_HASH,
        headHash: item.ledgerHash || 'N/A',
        brokenAt: i + 1,
        reason: `Hash criptográfico inválido no Bloco #${i + 1} (${item.agentName}): '${item.ledgerHash}' não é SHA-256 canônico.`
      };
    }

    expectedPrev = item.ledgerHash;
  }

  return {
    isValid: true,
    totalBlocks: chronological.length,
    genesisHash: GENESIS_HASH,
    headHash: chronological[chronological.length - 1].ledgerHash
  };
}
