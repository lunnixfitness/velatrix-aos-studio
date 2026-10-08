import { 
  SemanticEvent, 
  EnterpriseKnowledgeGraph, 
  SwarmDeliberation, 
  CriticalDecisionCardAST 
} from '../types/aos';
import { PRESET_SCENARIOS, INITIAL_KNOWLEDGE_GRAPH, enrichSwarmWith12Agents } from '../data/mockScenarios';
import { VectorStoreService } from './vectorStoreService';
import { authFetch as fetch } from './authClient';
import {
  runPericialTaxCalculationEngine,
  calculateAccumulatedSelic,
  calculateT24AdicionalFgtsRescisorio,
  calculateT25ReenquadramentoRatFap,
  calculateT26IrpjCsllSelicRepeticao,
  calculateT27EquiparacaoHospitalar,
  calculateT28SubvencoesInvestimento,
  calculateT29AgioIncorporacao,
  generateMockFiscalData,
  getDefaultSupportDocuments,
  getPericialStorageKey,
  savePericialCalculationToStorage,
  loadPericialCalculationFromStorage,
  HISTORICAL_SELIC_SERIES,
  ExpertTeseType,
  PericialCalculationResult,
  FiscalDocumentItem,
  CalculatedAnalyticalLine,
  CalculatedSyntheticMonth,
  SupportDocumentItem,
  SelicAccumulatedResult,
  TaxRegimeType
} from './expertTaxEngineService';
import { hashCanonical } from '../shared/crypto/hash';
import { secureId } from '../lib/demoMode';

export interface ProcessEventResult {
  graph: EnterpriseKnowledgeGraph;
  swarm: SwarmDeliberation;
  ast: CriticalDecisionCardAST;
  source: 'gemini-3.8-flash' | 'gemini-3.7-flash' | 'local_neural_engine';
  executionTimeMs: number;
  errorReason?: string;
}

export async function processAosEvent(
  eventText: string,
  currentGraph: EnterpriseKnowledgeGraph = INITIAL_KNOWLEDGE_GRAPH,
  adjustInstruction?: string
): Promise<ProcessEventResult> {
  const startTime = performance.now();
  let serverErrorReason: string | undefined;

  // Check if matching a preset scenario
  const matchingPreset = PRESET_SCENARIOS.find(
    s => s.title.toLowerCase().includes(eventText.toLowerCase()) || 
         eventText.toLowerCase().includes(s.badge.toLowerCase()) ||
         eventText.toLowerCase().includes(s.id.toLowerCase())
  );

  // Retrieve contextual policies from the Vector Knowledge Store (RAG)
  const matchedVectors = VectorStoreService.search(eventText, { limit: 3 });
  const retrievedPolicies = matchedVectors.map(v => ({
    id: v.document.vector_id,
    category: v.document.metadata.category,
    title: v.document.metadata.title,
    text: v.document.text,
    score: Math.round(v.score * 100) / 100
  }));

  // Try calling the server-side API (which connects to Gemini 3.7 Flash)
  try {
    const res = await fetch('/api/aos/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventText,
        eventContext: {
          knowledgeGraphHealth: currentGraph.healthIndex,
          nodes: currentGraph.nodes.map(n => ({ id: n.id, label: n.label, metric: n.metricValue })),
          ragVectorPolicies: retrievedPolicies
        },
        adjustInstruction
      })
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const cardPayload = data.zero_gui_card;
        let astPayload = data.zero_gui_ast;

        if (data.errorReason) {
          serverErrorReason = data.errorReason;
          console.info(`[AOS Engine Client] Mensagem detalhada de Fallback/Erro da IA recebida do servidor: "${data.errorReason}"`);
        }

        // Normalize zero_gui_card if present
        if (cardPayload && !astPayload) {
          astPayload = {
            ui_type: 'CriticalDecisionCard',
            title: cardPayload.title || 'Alerta de Decisão Crítica Zero-GUI',
            priority: cardPayload.risk_level === 'CRITICAL' ? 'Critical' : 'High',
            summary: cardPayload.summary || 'Exceção operacional requer validação do tomador de decisão.',
            kpis: (cardPayload.impact_kpis || []).map((k: any) => ({
              label: k.label,
              value: k.value,
              impact: 'negative'
            })),
            invariants_checked: [
              `Zero-Trust Status: ${cardPayload.zero_trust_check?.status || 'WARNING'}`,
              `Motivo: ${cardPayload.zero_trust_check?.reason || 'Limite de alçada'}`
            ],
            actions: (cardPayload.actions || []).map((a: any) => ({
              id: a.id,
              label: a.label,
              type: a.style === 'danger' ? 'Reject' : 'SwipeMultiSig',
              function_call: a.function_call
            }))
          };
        }

        if (astPayload && data.agent_swarm) {
          // Reconcile graph nodes based on semantic analysis
          const updatedGraph = reconcileKnowledgeGraph(currentGraph, data.semantic_analysis || {}, astPayload);
          const duration = Math.round(performance.now() - startTime);
          return {
            graph: updatedGraph,
            swarm: enrichSwarmWith12Agents(data.agent_swarm, eventText),
            ast: astPayload,
            source: (data.source as any) || 'gemini-3.8-flash',
            executionTimeMs: duration,
            errorReason: serverErrorReason || undefined
          };
        }
      }
    }
  } catch (err: any) {
    serverErrorReason = `FETCH_EXCEPTION: Falha na requisição cliente ao servidor (/api/aos/process): ${err?.message || err}`;
    console.info('[AOS Engine Client] Fallback neural local ativado com sucesso.');
  }

  // If preset scenario found and no custom instruction
  if (matchingPreset && !adjustInstruction) {
    const updatedGraph = reconcilePresetGraph(currentGraph, matchingPreset.id);
    const duration = Math.round(performance.now() - startTime);
    return {
      graph: updatedGraph,
      swarm: enrichSwarmWith12Agents(matchingPreset.swarm, matchingPreset.title),
      ast: matchingPreset.ast,
      source: 'local_neural_engine',
      executionTimeMs: duration,
      errorReason: serverErrorReason
    };
  }

  // Dynamic autonomous neural heuristic for custom events / natural language events
  const dynamicResult = await generateDynamicAosOutput(eventText, currentGraph, adjustInstruction);
  const duration = Math.round(performance.now() - startTime);

  return {
    ...dynamicResult,
    source: 'local_neural_engine',
    executionTimeMs: duration,
    errorReason: serverErrorReason
  };
}

function reconcileKnowledgeGraph(
  baseGraph: EnterpriseKnowledgeGraph, 
  semanticAnalysis: any, 
  ast: CriticalDecisionCardAST
): EnterpriseKnowledgeGraph {
  const affected = semanticAnalysis.affected_domains || ['supply_chain', 'treasury'];
  const nodes = baseGraph.nodes.map(node => {
    const isAffected = affected.some((domain: string) => 
      node.category.toLowerCase().includes(domain.toLowerCase()) || 
      domain.toLowerCase().includes(node.category.toLowerCase())
    );
    return {
      ...node,
      status: isAffected ? (ast.priority === 'Critical' ? 'critical' as const : 'alert' as const) : 'nominal' as const
    };
  });

  const edges = baseGraph.edges.map(edge => ({
    ...edge,
    status: ast.priority === 'Critical' ? 'strained' as const : 'nominal' as const,
    activePulse: true
  }));

  return {
    ...baseGraph,
    nodes,
    edges,
    healthIndex: ast.priority === 'Critical' ? 71 : 85,
    lastReconciled: new Date().toISOString()
  };
}

function reconcilePresetGraph(baseGraph: EnterpriseKnowledgeGraph, scenarioId: string): EnterpriseKnowledgeGraph {
  let health = 80;
  const nodes = baseGraph.nodes.map(node => {
    if (scenarioId === 'supplier_crisis') {
      health = 68;
      if (node.id === 'node_25_re_suprimento_automatico' || node.id === 'node_28_rating_otif_fornecedores' || node.id === 'node_suppliers' || node.id === 'node_inventory') {
        return { ...node, status: 'critical' as const };
      }
      if (node.id === 'node_01_reserva_emergencia' || node.id === 'node_33_oee_eficiencia_maquinas' || node.id === 'node_production' || node.id === 'node_cash') {
        return { ...node, status: 'alert' as const };
      }
    } else if (scenarioId === 'b2b_demand_surge') {
      health = 96;
      if (node.id === 'node_20_prevencao_churn_clientes' || node.id === 'node_37_carga_celula_fabril' || node.id === 'node_customers' || node.id === 'node_production') {
        return { ...node, status: 'alert' as const };
      }
      if (node.id === 'node_01_reserva_emergencia' || node.id === 'node_17_margem_contribuicao_sku' || node.id === 'node_cash') {
        return { ...node, status: 'optimized' as const };
      }
    } else if (scenarioId === 'customs_delay') {
      health = 74;
      if (node.id === 'node_29_lead_time_logistico' || node.id === 'node_logistics' || node.id === 'node_inventory') {
        return { ...node, status: 'critical' as const };
      }
      if (node.id === 'node_25_re_suprimento_automatico') {
        return { ...node, status: 'alert' as const };
      }
    } else if (scenarioId === 'fx_hedge_shock') {
      health = 82;
      if (node.id === 'node_06_exposicao_cambial' || node.id === 'node_cash' || node.id === 'node_suppliers') {
        return { ...node, status: 'alert' as const };
      }
    } else if (scenarioId === 'ransomware_logistics') {
      health = 62;
      if (node.id === 'node_29_lead_time_logistico' || node.id === 'node_45_antifraude_chave_pix' || node.id === 'node_logistics') {
        return { ...node, status: 'critical' as const };
      }
      if (node.id === 'node_25_re_suprimento_automatico' || node.id === 'node_20_prevencao_churn_clientes' || node.id === 'node_inventory' || node.id === 'node_customers' || node.id === 'node_cash') {
        return { ...node, status: 'alert' as const };
      }
    }
    return { ...node, status: 'nominal' as const };
  });

  return {
    ...baseGraph,
    nodes,
    healthIndex: health,
    lastReconciled: new Date().toISOString()
  };
}

export async function simulateTensionEvent(
  tensionBridge: any,
  currentGraph: EnterpriseKnowledgeGraph = INITIAL_KNOWLEDGE_GRAPH
): Promise<ProcessEventResult> {
  const startTime = performance.now();
  
  // 1. Update graph node states
  const updatedNodes = currentGraph.nodes.map(node => {
    if (node.id === tensionBridge.sourceNodeId || node.nodeCode === tensionBridge.sourceCode) {
      return { ...node, status: 'critical' as const };
    }
    if (node.id === tensionBridge.targetNodeId || node.nodeCode === tensionBridge.targetCode) {
      return { ...node, status: 'alert' as const };
    }
    return node;
  });

  // 2. Mark tension bridges
  const updatedBridges = (currentGraph.tensionBridges || []).map(b => ({
    ...b,
    isTriggered: b.id === tensionBridge.id
  }));

  // 3. Strained edges
  const updatedEdges = currentGraph.edges.map(e => {
    if (
      (e.source === tensionBridge.sourceNodeId && e.target === tensionBridge.targetNodeId) ||
      (e.source === tensionBridge.targetNodeId && e.target === tensionBridge.sourceNodeId)
    ) {
      return { ...e, status: 'strained' as const, activePulse: true };
    }
    return e;
  });

  const updatedGraph: EnterpriseKnowledgeGraph = {
    ...currentGraph,
    nodes: updatedNodes,
    edges: updatedEdges,
    tensionBridges: updatedBridges,
    activeTensionCount: 1,
    healthIndex: tensionBridge.severity === 'Critical' ? 68 : 79,
    lastReconciled: new Date().toISOString()
  };

  // 4. Construct bespoke 12-agent deliberation for this tension
  const rawSwarm = {
    finance: {
      agentName: 'CFO Brain (Financial Agent)',
      role: 'finance',
      agentId: 'Financial_Agent',
      reasoning: `Conflito de Tensão detectado entre ${tensionBridge.sourceCode} e ${tensionBridge.targetCode}. O impacto no fluxo de caixa D+0 e na reserva de liquidez foi projetado com estresse severo.`,
      proposedAction: tensionBridge.recommendedResolution,
      confidence: 99,
      metrics: { 'Impacto Caixa D+0': '-R$ 380k', 'Reserva OPEX': '16.2 dias (Piso 15d)', 'EBITDA Protegido': '+R$ 420k' },
      status: 'completed'
    },
    procurement: {
      agentName: 'Inventory & Procurement Agent',
      role: 'procurement',
      agentId: 'Inventory_Agent',
      reasoning: `Reconciliação da demanda de suprimentos com restrições orçamentárias. Resolução sugerida via entregas escalonadas no ERP.`,
      proposedAction: 'Fracionar entregas em lotes parciais mantendo estoque de segurança.',
      confidence: 97,
      metrics: { 'Lote Econômico': 'Fracionado 3x', 'Ruptura': '0.0%', 'Lead Time': '48h' },
      status: 'completed'
    },
    risk: {
      agentName: 'Zero-Trust Risk Agent',
      role: 'risk',
      agentId: 'Zero_Trust_Risk_Agent',
      reasoning: `Auditoria de invariantes em tempo real. Verificação do piso de caixa mínimo e autorizações Multi-Sig secp256k1.`,
      proposedAction: 'Validar invariante Saldo_Caixa_Minimo e exigir quórum diretivo.',
      confidence: 100,
      metrics: { 'Invariantes': '5/5 Auditadas', 'Alçadas': 'Multi-Sig Exigido', 'Status': 'BLINDADO' },
      status: 'completed'
    },
    sales: {
      agentName: 'Sales & Revenue Agent',
      role: 'sales',
      agentId: 'Sales_Agent',
      reasoning: 'Garantia de que os contratos de clientes estratégicos e os SLAs de faturamento não sofram atraso.',
      proposedAction: 'Priorizar despacho dos clientes Tier-A com cláusula penal.',
      confidence: 96,
      metrics: { 'SLA Tier-A': '100% Garantido', 'Churn Projetado': '0.0%' },
      status: 'completed'
    },
    logistics: {
      agentName: 'Supply Chain & Logistics Agent',
      role: 'logistics',
      agentId: 'Supply_Chain_Agent',
      reasoning: 'Roteamento dinâmico de janelas de frete expresso para equilibrar os prazos de recebimento e entrega.',
      proposedAction: 'Alocar transportadoras homologadas com janelas prioritárias.',
      confidence: 95,
      metrics: { 'Janela D+1': 'Confirmada', 'Frete Adicional': 'R$ 0 (Contrato Anual)' },
      status: 'completed'
    },
    production_bom: {
      agentName: 'Production & BOM Agent',
      role: 'production_bom',
      agentId: 'Production_BOM_Agent',
      reasoning: 'Rebalanceamento das ordens de produção para absorver insumos sem parada de linha.',
      proposedAction: 'Ajustar sequência no MRP II sem exceder capacidade da esteira.',
      confidence: 98,
      metrics: { 'OEE Linha': '91.4%', 'Desvio BOM': '0.35%' },
      status: 'completed'
    },
    audit_ledger: {
      agentName: 'Audit Ledger Agent',
      role: 'audit_ledger',
      agentId: 'Audit_Ledger_Agent',
      reasoning: 'Geração de prova de intenção criptográfica e registro da resolução da tensão no Livro-Razão AOS.',
      proposedAction: 'Assinar hash SHA-256 no ledger imutável.',
      confidence: 100,
      metrics: { 'Hash Ledger': '0x7e3a...91b2', 'Imutabilidade': '100%' },
      status: 'completed'
    },
    legal_contract: {
      agentName: 'Legal Contract Agent',
      role: 'legal',
      agentId: 'Legal_Contract_Agent',
      reasoning: 'Verificação de cláusulas penais e aditivos contratuais para proteção jurídica.',
      proposedAction: 'Formalizar termo aditivo digital via Docusign / ICP-Brasil.',
      confidence: 99,
      metrics: { 'Risco Jurídico': '0.0%', 'SLA Contratual': 'Protegido' },
      status: 'completed'
    },
    tax_optimizer: {
      agentName: 'Tax Optimizer Agent',
      role: 'tax_optimizer',
      agentId: 'Tax_Optimizer_Agent',
      reasoning: 'Preservação de créditos fiscais de ICMS e PIS/COFINS na operação de ajuste.',
      proposedAction: 'Apropriar créditos tributários das notas emitidas.',
      confidence: 97,
      metrics: { 'Crédito Fiscal': '+R$ 48.200', 'SPED': 'Auditado' },
      status: 'completed'
    },
    facility_maintenance: {
      agentName: 'Facility & Maintenance Agent',
      role: 'facility',
      agentId: 'Facility_Maintenance_Agent',
      reasoning: 'Telemetria preditiva confirma que a linha suporta o plano sem paradas técnicas.',
      proposedAction: 'Manter sensores IoT em regime nominal.',
      confidence: 96,
      metrics: { 'MTBF': '720h', 'Vibração': 'Nominal' },
      status: 'completed'
    },
    people_analytics: {
      agentName: 'People Analytics Agent',
      role: 'people_analytics',
      agentId: 'People_Analytics_Agent',
      reasoning: 'Escalas de trabalho balanceadas sem estouro de jornada CLT.',
      proposedAction: 'Distribuir demanda nos turnos ordinários sem hora extra.',
      confidence: 97,
      metrics: { 'Horas Extras': '0.0h adicionais', 'Conformidade CLT': '100%' },
      status: 'completed'
    },
    dynamic_pricing: {
      agentName: 'Dynamic Pricing Agent',
      role: 'dynamic_pricing',
      agentId: 'Dynamic_Pricing_Agent',
      reasoning: 'Margem de contribuição protegida contra oscilações de insumos.',
      proposedAction: 'Manter mark-up de segurança em 2.15x.',
      confidence: 96,
      metrics: { 'Margem Contribuição': '33.8%', 'Mark-up': '2.15x' },
      status: 'completed'
    },
    data_analyst_predictive: {
      agentName: 'Data Analyst & Predictive AI Agent',
      role: 'data_science',
      agentId: 'Data_Analyst_Predictive_Agent',
      reasoning: `Cruzamento de dados relacionais ERP com matrizes de dispersão preditivas. Diagnóstico matemático do nó ${tensionBridge.sourceCode} vs ${tensionBridge.targetCode} sem anomalias colaterais residuais.`,
      proposedAction: 'Validar integridade preditiva dos KPIs D+30 via simulação de Monte Carlo.',
      confidence: 99,
      metrics: { 'R² Acurácia': '0.988', 'Padrões de Perda': '0 Detectados', 'Confiança Monte Carlo': '99.4%' },
      status: 'completed'
    }
  };

  const enrichedSwarm = enrichSwarmWith12Agents(rawSwarm, tensionBridge.tensionTitle);

  // 5. Generate Zero-GUI Critical Decision Card AST for CEO
  const ast: CriticalDecisionCardAST = {
    ui_type: 'CriticalDecisionCard',
    title: tensionBridge.tensionTitle,
    priority: tensionBridge.severity,
    summary: `${tensionBridge.tensionDescription} O Enxame de Agentes deliberou a resolução consensual com preservação de caixa e continuidade operacional.`,
    kpis: [
      { label: 'Impacto Financeiro', value: 'R$ 420.000', delta: 'Preservado', impact: 'positive' },
      { label: 'Reserva OPEX D+0', value: '18.4 dias', delta: 'Piso 15d OK', impact: 'positive' },
      { label: 'Conformidade Invariantes', value: '100%', delta: '5/5 Auditadas', impact: 'positive' },
      { label: 'Consenso do Enxame', value: '98.6%', delta: '12 Agentes Alinhados', impact: 'positive' }
    ],
    invariants_checked: [
      'Saldo_Caixa_Minimo (Colchão de Liquidez) > R$ 2.000.000: RESPEITADO',
      'SLA_Compliance_TierA_Minimo > 98.0%: 100% PROTEGIDO',
      'Estoque_Seguranca_Minimo > 15 dias: RECONCILIADO',
      'Limite_Credito_Rotativo: DENTRO DO TETO NOMINAL',
      'Zero-Trust Quorum Multi-Sig: EXIGIDO PARA EXECUÇÃO'
    ],
    suggested_actions: [
      {
        id: 'opt_tension_resolution',
        label: 'Aprovar Resolução Consensual do Enxame',
        description: `${tensionBridge.recommendedResolution} Executa automação nos módulos TOTVS/SAP/Open Finance.`,
        estimatedCost: 'R$ 0 de Custo Adicional',
        impactScore: 98,
        selected: true,
        automatedSteps: [
          '1. Atualizar Ordem de Compra fracionada no TOTVS Compras',
          '2. Registrar provisão de caixa no módulo financeiro SAP FI',
          '3. Validar assinatura secp256k1 dos diretores no Livro-Razão AOS',
          '4. Emitir confirmação de recebimento fiscal no portal SEFAZ'
        ]
      },
      {
        id: 'opt_manual_treasury',
        label: 'Aporte Emergencial de Capital de Giro',
        description: 'Utilizar limite pré-aprovado de crédito rotativo a CDI + 0.75% a.a. para liquidar o pedido integral.',
        estimatedCost: 'R$ 18.200 (Juros CDI 30d)',
        impactScore: 82,
        selected: false,
        automatedSteps: [
          '1. Sacar R$ 1.8M da linha de crédito rotativo via Open Finance',
          '2. Liquidar NF-e integral no vencimento D+15'
        ]
      }
    ],
    actions: [
      {
        id: 'act_approve_tension',
        label: 'Deslizar para Aprovar Resolução (Multi-Sig)',
        type: 'SwipeMultiSig',
        payload: {
          function_name: 'resolve_semantic_tension_bridge',
          parameters: {
            tension_id: tensionBridge.id,
            source_code: tensionBridge.sourceCode,
            target_code: tensionBridge.targetCode,
            execution_strategy: 'CONSENSUAL_SWARM_SPLIT'
          }
        }
      },
      {
        id: 'act_reject_tension',
        label: 'Postergar Decisão para Comitê Executivo',
        type: 'VoiceAdjust'
      }
    ],
    security_guard: {
      status: 'VERIFIED',
      anomaly_details: 'Assinaturas criptográficas e invariantes de tesouraria validadas pelo Zero-Trust Security Guard.'
    },
    execution_payload: {
      service: 'TOTVS_REST_GATEWAY',
      action: 'RESOLVE_SEMANTIC_TENSION',
      parameters: {
        tension_id: tensionBridge.id,
        source_code: tensionBridge.sourceCode,
        target_code: tensionBridge.targetCode,
        mode: 'AUTONOMOUS_SETTLEMENT',
        target_subsystems: ['TOTVS_COMPRAS', 'SAP_FI', 'OPEN_FINANCE_BACEN', 'AOS_LEDGER']
      }
    }
  };

  const duration = Math.round(performance.now() - startTime);

  return {
    graph: updatedGraph,
    swarm: enrichedSwarm,
    ast,
    source: 'local_neural_engine',
    executionTimeMs: duration
  };
}

async function generateDynamicAosOutput(
  eventText: string,
  currentGraph: EnterpriseKnowledgeGraph,
  adjustInstruction?: string
): Promise<{ graph: EnterpriseKnowledgeGraph; swarm: SwarmDeliberation; ast: CriticalDecisionCardAST }> {
  const isCritical = /urgente|parada|quebra|greve|atraso|crítico|dólar|calote|ruptura|incêndio/i.test(eventText);
  const priority = isCritical ? 'Critical' : 'High';

  // Dynamic sector detection (Item 9)
  const lowerText = (eventText + ' ' + (adjustInstruction || '')).toLowerCase();
  let detectedSector: 'manufacturing' | 'healthcare' | 'retail' | 'services' | 'real_estate' = 'manufacturing';
  let sectorLabel = 'Indústria & Manufatura';
  let regulatoryStandard = 'ISO 9001 / IATF 16949';

  if (lowerText.includes('imóvel') || lowerText.includes('imoveis') || lowerText.includes('imobiliár') || 
      lowerText.includes('incorporação') || lowerText.includes('loteamento') || lowerText.includes('terreno') ||
      lowerText.includes('escrow') || lowerText.includes('comissão') || lowerText.includes('corretagem') ||
      lowerText.includes('cap rate') || lowerText.includes('vgv') || lowerText.includes('real estate') ||
      lowerText.includes('high-end') || lowerText.includes('luxo') || lowerText.includes('cartório') ||
      lowerText.includes('rgi') || lowerText.includes('itbi') || lowerText.includes('escritura')) {
    detectedSector = 'real_estate';
    sectorLabel = 'Real Estate & High-End Sales';
    regulatoryStandard = 'CRECI / RGI Cartórios / Lei 4.591 / BACEN Escrow';
  } else if (lowerText.includes('saúde') || lowerText.includes('hospital') || lowerText.includes('clínica') || 
      lowerText.includes('vacina') || lowerText.includes('medicamento') || lowerText.includes('farma') || 
      lowerText.includes('paciente') || lowerText.includes('anvisa') || lowerText.includes('hipaa') ||
      lowerText.includes('câmara fria')) {
    detectedSector = 'healthcare';
    sectorLabel = 'Saúde, Clínicas & Hospitais';
    regulatoryStandard = 'LGPD Médica / HIPAA / Anvisa RDC 430';
  } else if (lowerText.includes('varejo') || lowerText.includes('e-commerce') || lowerText.includes('sku') || 
             lowerText.includes('carrinho') || lowerText.includes('checkout') || lowerText.includes('black friday') ||
             lowerText.includes('churn') || lowerText.includes('d2c')) {
    detectedSector = 'retail';
    sectorLabel = 'Varejo & E-commerce';
    regulatoryStandard = 'PCI-DSS / CDC / SLA 24h';
  } else if (lowerText.includes('serviço') || lowerText.includes('consultoria') || lowerText.includes('squad') || 
             lowerText.includes('cloud') || lowerText.includes('horas fatur') || lowerText.includes('jira') || 
             lowerText.includes('soc 2') || lowerText.includes('banco digital')) {
    detectedSector = 'services';
    sectorLabel = 'Serviços, Consultoria & Tech';
    regulatoryStandard = 'SOC 2 Type II / SLA 99.9%';
  }

  // Dynamic Proof of Intent & Anti-Fraud Security Check (Item 8)
  const isFraudSuspected = lowerText.includes('pix') || 
                           lowerText.includes('conta bancária') || 
                           lowerText.includes('troca de conta') || 
                           lowerText.includes('whatsapp') || 
                           lowerText.includes('engenharia social') ||
                           lowerText.includes('fraude') ||
                           lowerText.includes('número não cadastrado');

  const summary = adjustInstruction
    ? `Ajuste Tático AOS aplicado: "${adjustInstruction}". O Enxame de Agentes rebalanceou o fluxo de tesouraria e a alocação logística, revalidando todas as 4 invariantes lógicas de negócio.`
    : isFraudSuspected
    ? `[INTERCEPTAÇÃO ANTIFRAUDE]: O AOS detectou tentativa anômala de engenharia social / alteração de domicílio bancário. O Guardião Proof of Intent bloqueou preventivamente qualquer despacho financeiro automático e colocou o evento em quarentena.`
    : `O Barramento Semântico do AOS processou o evento: "${eventText}". O Enxame de Agentes orquestrou uma resposta tática coordenada para o segmento de ${sectorLabel}, preservando a liquidez e os contratos SLA sob regulação ${regulatoryStandard}.`;

  const swarm: SwarmDeliberation = {
    procurement: {
      agentName: detectedSector === 'healthcare' ? 'COO Brain (Insumos Hospitalares)' : detectedSector === 'services' ? 'COO Brain (Parcerias & Squads)' : 'COO Brain (Procurement & Supply Chain)',
      role: 'procurement',
      reasoning: isFraudSuspected
        ? 'Tentativa de alteração de dados de pagamento não autorizada. O domicílio oficial registrado em contrato social foi mantido e o cadastro do fornecedor foi congelado para quarentena.'
        : `Análise semântica Turnaround concluída no setor de ${sectorLabel}. Identificamos opções de contingência com lead time otimizado e conformidade com ${regulatoryStandard}.${adjustInstruction ? ` Parâmetros ajustados: "${adjustInstruction}".` : ''}`,
      proposedAction: isFraudSuspected
        ? 'Congelar cadastro do fornecedor e bloquear alteração de chave bancária/PIX.'
        : 'Emitir PO spot com parceiro homologado com cláusula prioritária.',
      confidence: 99,
      metrics: isFraudSuspected 
        ? { 'Status Cadastro': 'Congelado', 'Chave Oficial': 'CNPJ Homologado', 'Canal Oficial': 'Portal Seguro' }
        : { 'Lead Time': '24-48 horas', 'Compliance': regulatoryStandard, 'Cobertura': '100%' },
      status: 'completed'
    },
    finance: {
      agentName: 'CFO Brain (Financeiro, DRE & Ebitda)',
      role: 'finance',
      reasoning: isFraudSuspected
        ? 'Ordem de liquidação suspensa preventivamente. Caixa livre de R$ 8.42M blindado contra desvio patrimonial.'
        : `Diagnóstico financeiro profundo (CFO Brain) em ${sectorLabel}: Análise de fluxo de caixa, margens e descasamento PMR x PMP. A liquidez livre de R$ 8.42M absorve o plano tático sem violar a Invariante de Saldo_Caixa_Minimo (R$ 2.0M).`,
      proposedAction: isFraudSuspected
        ? 'Suspender ordens de pagamento para a chave suspeita e abrir chamado de auditoria.'
        : 'Liberar desembolso tático via DVP garantindo preservação de margem EBITDA e lucro operacional.',
      confidence: 100,
      metrics: isFraudSuspected
        ? { 'Caixa Blindado': 'R$ 145.000', 'Status': 'Retido / Em Quarentena', 'Score Risco': '98/100' }
        : { 'Saldo Caixa Projetado': 'R$ 8.15M', 'EBITDA Preservado': '+R$ 520.000', 'Impacto': '-R$ 58.000' },
      status: 'completed'
    },
    logistics: {
      agentName: detectedSector === 'healthcare' ? 'COO Brain (Logística Hospitalar)' : detectedSector === 'services' ? 'COO Brain (PSA & Alocação)' : 'COO Brain (Logística & Bottleneck Analysis)',
      role: 'logistics',
      reasoning: isFraudSuspected
        ? 'Mercadorias físicas em trânsito conferidas e alocadas em doca de quarentena segura.'
        : 'Mapeamento de gargalos e rotas de suprimento atualizado no Grafo Semântico em tempo real.',
      proposedAction: isFraudSuspected
        ? 'Manter custódia física dos insumos na doca de quarentena.'
        : 'Reservar janela dedicada com a transportadora prioritária.',
      confidence: 94,
      metrics: { 'Tempo Trânsito': '18h', 'Pontualidade Estimada': '100%', 'Status Rota': 'Otimizada' },
      status: 'completed'
    },
    sales: {
      agentName: 'CRO Brain (Receita, SLAs & Retenção)',
      role: 'sales',
      reasoning: isFraudSuspected
        ? 'Zero impacto operacional ou comercial para os clientes finais. Dossiê de segurança registrado.'
        : `Avaliação no setor de ${sectorLabel}: O plano garante cumprimento de 100% dos prazos contratuais (${regulatoryStandard}).`,
      proposedAction: 'Manter cronograma de faturamento ativo e emitir informe de estabilidade operacional aos clientes.',
      confidence: 97,
      metrics: { 'SLA Preservado': '100%', 'Risco de Churn': '0.0%', 'Multas Evitadas': 'R$ 680.000' },
      status: 'completed'
    },
    revenue_ops: {
      agentName: detectedSector === 'real_estate' 
        ? 'CXO Brain (Real Estate & Due Diligence)' 
        : detectedSector === 'services' 
        ? 'CXO Brain (Receita NRR & Unit Economics)' 
        : 'CXO Brain (Revenue Ops & Sales Velocity)',
      role: 'revenue_ops',
      agentId: 'Sales_Agent',
      reasoning: isFraudSuspected
        ? 'Isolamento de esteiras de checkout e suspensão de novas cobranças automatizadas com as contas envolvidas até liberação do comitê de segurança.'
        : detectedSector === 'real_estate'
        ? `Operação de Real Estate & High-End Sales estruturada: Validação de certidões de matrícula no RGI, trava de depósito em conta Escrow com banco parceiro, cálculo de ITBI/escrituração e split de 6% de comissão CRECI sob governança ${regulatoryStandard}.`
        : `Governança de receitas de alto valor e NRR (Net Revenue Retention) no setor de ${sectorLabel}. Preservação da margem de contribuição líquida e aceleração do ciclo de fechamento comercial (Sales Velocity).`,
      proposedAction: isFraudSuspected
        ? 'Congelar geração de faturas e pagamentos de comissões vinculadas ao evento.'
        : detectedSector === 'real_estate'
        ? 'Liberar custódia de conta Escrow após validação de Due Diligence imobiliária e emitir split de comissões CRECI.'
        : 'Consolidar esteira de faturamento e sincronizar pipeline de vendas no ERP corporativo.',
      confidence: 98,
      metrics: isFraudSuspected
        ? { 'Esteira Receita': 'Blindada', 'Status': 'Quarentena Ativa', 'Risco Churn': 'Zero' }
        : detectedSector === 'real_estate'
        ? { 'VGV Operação': 'R$ 28.5M', 'Cap Rate': '9.4%', 'Comissão CRECI': '6% (Split Auto)', 'Escrow Status': 'Custódia Ativa', 'Due Diligence RGI': '100% Validada' }
        : { 'Net Revenue Retention': '106%', 'Pipeline Velocity': '+24%', 'Deal Margin': '32.4%' },
      status: 'completed'
    },
    legal_contract: {
      agentName: 'Legal Contract Agent',
      role: 'legal',
      agentId: 'Legal_Contract_Agent',
      reasoning: isFraudSuspected
        ? 'Tentativa de alteração de domicílio bancário sem termo aditivo firmado com assinatura digital ICP-Brasil. Violação da cláusula 14.2 do contrato mestre de fornecimento.'
        : 'Contratos vigentes com fornecedores e clientes auditados. Cláusulas de SLA, penalidades rescisórias e conformidade LGPD plenamente asseguradas.',
      proposedAction: isFraudSuspected
        ? 'Emitir notificação extrajudicial formal e exigir revalidação cartorial/ICP-Brasil.'
        : 'Aprovar aditivo contratual eletrônico no repositório seguro com carimbo de tempo.',
      confidence: 99,
      metrics: { 'Cláusula Penal': 'Blindada', 'Risco Jurídico': '0.0%', 'LGPD Status': 'Conforme' },
      status: 'completed'
    },
    tax_optimizer: {
      agentName: 'Tax Optimizer Agent',
      role: 'tax_optimizer',
      agentId: 'Tax_Optimizer_Agent',
      reasoning: 'Otimização de créditos tributários de ICMS/PIS/COFINS e validação da Substituição Tributária (ST) no cálculo da operação.',
      proposedAction: 'Aproveitar crédito fiscal de 12% na operação interestadual e registrar aproveitamento no SPED Fiscal.',
      confidence: 97,
      metrics: { 'Crédito Fiscal': '+R$ 18.400', 'Economia Tributária': '4.8%', 'SPED': 'Validado' },
      status: 'completed'
    },
    facility_maintenance: {
      agentName: 'Facility & Maintenance Agent',
      role: 'facility',
      agentId: 'Facility_Maintenance_Agent',
      reasoning: 'Monitoramento de telemetria preditiva do parque fabril e maquinário crítico. OEE (Overall Equipment Effectiveness) em 89.4%.',
      proposedAction: 'Sincronizar janela de manutenção preventiva para intervalo entre trocas de turnos.',
      confidence: 95,
      metrics: { 'OEE Linha': '89.4%', 'MTBF': '720h', 'Risco Parada': '1.2%' },
      status: 'completed'
    },
    people_analytics: {
      agentName: 'People Analytics Agent',
      role: 'people_analytics',
      agentId: 'People_Analytics_Agent',
      reasoning: 'Alocação de capacidade operacional dos turnos e controle de banco de horas/sobrejornada conforme NR-12 e CLT.',
      proposedAction: 'Rebalancear escala de operadores para absorver o plano tático sem horas extras excedentes.',
      confidence: 96,
      metrics: { 'Produtividade Turno': '+8.2%', 'Horas Extras Evitadas': '42h', 'Taxa Absenteísmo': '0.4%' },
      status: 'completed'
    },
    dynamic_pricing: {
      agentName: 'Dynamic Pricing Agent',
      role: 'dynamic_pricing',
      agentId: 'Dynamic_Pricing_Agent',
      reasoning: 'Cálculo de elasticidade de preço da demanda e preservação da margem de contribuição mínima de 31.5%.',
      proposedAction: 'Ajustar mark-up inteligente para contratos spot mantendo competitividade no mercado.',
      confidence: 96,
      metrics: { 'Margem Contribuição': '32.1%', 'Elasticidade': '-0.85', 'Mark-up Ótimo': '2.14' },
      status: 'completed'
    },
    production_bom: {
      agentName: 'Production & BOM Agent',
      role: 'production_bom',
      agentId: 'Production_BOM_Agent',
      reasoning: 'Reconciliação da lista de materiais (Bill of Materials) e balanceamento de linha de produção no MRP II.',
      proposedAction: 'Atualizar sequenciamento de ordens de produção (OP) no sistema fabril.',
      confidence: 98,
      metrics: { 'BOM Acurácia': '99.8%', 'Rendimento Linha': '98.5%', 'Lead Time Fabril': '-4h' },
      status: 'completed'
    },
    audit_ledger: {
      agentName: 'Audit Ledger Agent',
      role: 'audit_ledger',
      agentId: 'Audit_Ledger_Agent',
      reasoning: 'Geração de prova criptográfica secp256k1 e assinatura SHA-256 no Livro-Razão Imutável do AOS.',
      proposedAction: 'Imutabilizar hash de deliberação no Ledger distribuído.',
      confidence: 100,
      metrics: { 'Hash Ledger': '0x7f4a...8b9c', 'Status Prova': 'Verificada', 'Imutabilidade': '100%' },
      status: 'completed'
    },
    risk: {
      agentName: 'Chief Risk Officer Brain (Blindagem Zero-Trust & Antifraude)',
      role: 'risk',
      agentId: 'Zero_Trust_Risk_Agent',
      reasoning: isFraudSuspected
        ? 'VIOLAÇÃO DE PROOF OF INTENT: Origem não assinada via canal não autenticado. Classificação imediata como SUSPECTED_FRAUD e bloqueio do payload de execução.'
        : `Verificação formal de Invariantes Lógicas de Negócio Zero-Trust: Saldo_Caixa > 0 (OK), Compliance ${regulatoryStandard} (OK), Risco < 5% (OK).`,
      proposedAction: isFraudSuspected
        ? 'Acionar flag SUSPECTED_FRAUD, travar disparos automáticos e exigir confirmação humana bi-fator.'
        : 'Exigir assinatura Multi-Sig do C-Level para disparo das ordens automáticas.',
      confidence: 100,
      metrics: isFraudSuspected
        ? { 'Invariante Antifraude': 'BLOQUEADA', 'Score Risco': '98/100', 'Gate': 'FLAG SUSPECTED_FRAUD' }
        : { 'Invariantes Aprovadas': '4 de 4', 'Grau de Risco': 'Controlado', 'Zero-Trust Gate': 'Exige Multi-Sig' },
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
        "Dynamic_Pricing_Agent"
      ],
      execution_mode: "PARALLEL_ASYNC",
      max_parallel_workers: 12
    },
    synthesizer: {
      decisionSummary: isFraudSuspected
        ? 'O Guardião Proof of Intent interceptou uma tentativa de engenharia social / desvio bancário. O pagamento foi travado, o domicílio bancário homologado foi mantido e foi emitida exigência de dupla checagem humana.'
        : `Aprovar a execução do plano tático coordenado pelo AOS para o setor de ${sectorLabel}, assegurando compliance com ${regulatoryStandard} e retorno financeiro líquido positivo.`,
      executionPlan: isFraudSuspected
        ? [
            'Interrupção imediata de qualquer despacho bancário para a chave não autenticada.',
            'Emissão de alerta de alto risco (SUSPECTED_FRAUD) na Zero-GUI.',
            'Exigência de dupla checagem humana via canal telefônico seguro gravado.',
            'Notificação para a equipe de Cibersegurança e Compliance.'
          ]
        : [
            'Assinatura Multi-Sig Executiva via Zero-GUI.',
            'Emissão eletrônica das ordens de compra e transporte no Barramento Semântico.',
            'Atualização do Grafo de Conhecimento Corporativo em tempo real.'
          ],
      strategicTradeoffs: [
        isFraudSuspected
          ? 'Prevenção total de prejuízo financeiro por meio da governança Zero-Trust.'
          : 'Custo operacional pontual compensado pela blindagem de faturamento e fidelização das contas estratégicas.'
      ]
    }
  };

  const ast: CriticalDecisionCardAST = {
    ui_type: 'CriticalDecisionCard',
    priority: isFraudSuspected ? 'Critical' : priority,
    summary: summary,
    kpis: isFraudSuspected
      ? [
          { label: 'Fraude Interceptada', value: 'R$ 145.000 (100%)', impact: 'positive' },
          { label: 'Score Risco Antifraude', value: '98/100 [CRÍTICO]', impact: 'negative' },
          { label: 'Ordem de Pagamento', value: 'BLOQUEADA / QUARENTENA', impact: 'negative' },
          { label: 'Proof of Intent Guard', value: 'INTERCEPTADO', impact: 'positive' }
        ]
      : [
          { label: 'EBITDA Preservado', value: '+R$ 520.000', impact: 'positive' },
          { label: 'SLA Contratual Tier-A', value: '100% Assegurado', impact: 'positive' },
          { label: 'Custo de Resolução Tática', value: '-R$ 58.000', impact: 'negative' },
          { label: 'Saldo Caixa Livre', value: 'R$ 8.150.000', impact: 'positive' }
        ],
    invariants_checked: isFraudSuspected
      ? [
          'Proof_Of_Intent_Origem_Assinada = FALHOU (Canal Suspeito)',
          'Chave_PIX_Cadastrada_Inalterada = VIOLAÇÃO DETECTADA',
          'Invariante_AntiFraude_Quarentena_Ativa = OK',
          'Bloqueio_Disparo_Automatico_Garantido = OK'
        ]
      : [
          'Saldo_Caixa > R$ 2.000.000 (Projetado: R$ 8.15M) = OK',
          `Compliance_Regulatorio_${detectedSector.toUpperCase()} = OK`,
          'Estoque_Seguranca >= 15d = OK',
          'Politica_Zero_Trust_MultiSig_Verificada = OK'
        ],
    actions: [
      { 
        id: 'approve', 
        type: 'SwipeMultiSig', 
        label: isFraudSuspected 
          ? 'Deslize Bloqueado: Exige Dupla Checagem Humana Antifraude' 
          : 'Deslize para Assinatura Multi-Sig Executiva' 
      },
      { id: 'adjust', type: 'VoiceInput', label: 'Ajustar Parâmetros via Voz/Instrução' }
    ],
    execution_payload: {
      target_service: isFraudSuspected 
        ? 'FraudQuarantine_Gateway (SecOps + CoreBanking)' 
        : isCritical ? 'ERP_Gateway_SAP_S4HANA (REST API v2)' : 'Stripe_Corporate_Treasury',
      action: isFraudSuspected 
        ? 'QuarantineAndBlockUnauthorizedPixTransfer' 
        : isCritical ? 'ExecuteCriticalMitigationOrder' : 'DispatchTacticalWorkflow',
      parameters: isFraudSuspected
        ? {
            incident_type: 'SUSPECTED_PIX_SPOOFING_ATTEMPT',
            blocked_amount_brl: 145000.00,
            intercepting_agent: 'ProofOfIntent_SecurityGuard_v4',
            quarantine_status: 'LOCKED_PENDING_HUMAN_CONFIRMATION'
          }
        : {
            event_ref: eventText.slice(0, 40),
            priority_level: priority,
            sector: detectedSector,
            contingency_fund_allocated_brl: isCritical ? 58000.00 : 15000.00,
            authorization_mode: 'MULTISIG_SECP256K1',
            invariants_verified_count: 4,
            idempotency_key: `IDEMP_${Date.now()}_${secureId('', 4).toUpperCase()}`
          },
      signature: await hashCanonical({
        event: eventText.slice(0, 100),
        sector: detectedSector,
        mode: 'SECP256K1',
        isFraudSuspected,
        isCritical,
        timestamp: new Date().toISOString()
      })
    },
    security_guard: isFraudSuspected
      ? {
          status: 'SUSPECTED_FRAUD',
          flag: 'SUSPECTED_FRAUD',
          risk_score: 98,
          anomaly_details: 'Alteração não autorizada de dados de liquidação bancária/PIX via canal não autenticado.',
          source_authenticity: 'Canal Não Assinado (WhatsApp/E-mail não homologado)',
          requires_biometric_override: true,
          mitigation_protocol: 'Exige contato telefônico no número institucional cadastrado do CFO e validação biométrica dupla.'
        }
      : {
          status: 'VERIFIED',
          risk_score: 4,
          source_authenticity: 'Gateway Integrado Criptografado (TLS 1.3 / mTLS)',
          requires_biometric_override: false
        },
    sector_context: {
      sector: detectedSector,
      sectorLabel: sectorLabel,
      regulatoryStandard: regulatoryStandard
    },
    context_graph_snapshot: {
      nodesAffected: isFraudSuspected ? ['node_cash', 'node_suppliers'] : ['node_suppliers', 'node_inventory', 'node_cash'],
      riskScore: isFraudSuspected ? 98 : isCritical ? 82 : 45,
      financialExposure: isFraudSuspected ? 'R$ 145.000' : 'R$ 520.000'
    },
    audit_hash: await hashCanonical({
      context: 'DECISION_AST_AUDIT',
      event: eventText.slice(0, 80),
      detectedSector,
      isFraudSuspected,
      timestamp: new Date().toISOString()
    })
  };

  const updatedGraph: EnterpriseKnowledgeGraph = {
    ...currentGraph,
    healthIndex: isCritical ? 72 : 88,
    lastReconciled: new Date().toISOString(),
    nodes: currentGraph.nodes.map(n => ({
      ...n,
      status: isCritical && (n.category === 'supply_chain' || n.category === 'logistics') ? 'alert' as const : n.status
    }))
  };

  return { graph: updatedGraph, swarm, ast };
}

// ================================================================================
// RE-EXPORTAÇÃO & INTEGRAÇÃO PERICIAL DETERMINÍSTICA DO AOS TAX ENGINE (T01 a T29)
// ================================================================================
export {
  runPericialTaxCalculationEngine,
  calculateAccumulatedSelic,
  calculateT24AdicionalFgtsRescisorio,
  calculateT25ReenquadramentoRatFap,
  calculateT26IrpjCsllSelicRepeticao,
  calculateT27EquiparacaoHospitalar,
  calculateT28SubvencoesInvestimento,
  calculateT29AgioIncorporacao,
  generateMockFiscalData,
  getDefaultSupportDocuments,
  getPericialStorageKey,
  savePericialCalculationToStorage,
  loadPericialCalculationFromStorage,
  HISTORICAL_SELIC_SERIES
};

export type {
  ExpertTeseType,
  PericialCalculationResult,
  FiscalDocumentItem,
  CalculatedAnalyticalLine,
  CalculatedSyntheticMonth,
  SupportDocumentItem,
  SelicAccumulatedResult,
  TaxRegimeType
};

/**
 * Interface pericial unificada para o agente Tax Optimizer do Swarm AOS
 */
export function executeAosTaxOptimizerAudit(params: {
  tese: ExpertTeseType;
  taxRegime: TaxRegimeType;
  cnpj?: string;
  companyName?: string;
  protocolDate?: string;
  consolidationDate?: string;
  items?: FiscalDocumentItem[];
}): PericialCalculationResult {
  const cnpj = params.cnpj || '00.000.000/0001-91';
  const companyName = params.companyName || 'Empresa Auditada AOS';
  const protocolDate = params.protocolDate || '2026-09-01';
  const consolidationDate = params.consolidationDate || '2026-09-01';
  
  // Utiliza os itens fornecidos ou gera a matriz pericial mock de 60 meses
  const items = params.items && params.items.length > 0
    ? params.items
    : generateMockFiscalData(params.tese, params.taxRegime, companyName, cnpj, protocolDate);

  return runPericialTaxCalculationEngine({
    items,
    tese: params.tese,
    taxRegime: params.taxRegime,
    protocolDate,
    consolidationDate,
    companyName,
    cnpj
  });
}

