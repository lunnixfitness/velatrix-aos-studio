import { ScoreComposition, DueDiligenceResult } from '../../types/precatorios';
import { PrecatorioLogger } from './precatorioLogger';

export interface ScoreInputData {
  enteDevedor: string;
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
  ufEnte?: string;
  natureza: 'ALIMENTAR' | 'COMUM';
  dataTransitoJulgado: string; // ISO date
  numeroRecursosAposTransito: number;
  adimplenciaEnteUltimos24m: 'TOTAL' | 'PARCIAL' | 'INADIMPLENTE';
  quantidadeCessoesAnteriores: number;
  dueDiligence: DueDiligenceResult;
  valorPrecatorio: number;
}

/**
 * Heurística auditável de pontuação do Ente Devedor (35%)
 */
export function calcularPontosEnteDevedor(esfera: string, ente: string, uf?: string): { pontos: number; detalhe: string } {
  const enteLower = ente.toLowerCase();
  const ufUpper = (uf || '').toUpperCase();

  if (esfera === 'FEDERAL' || enteLower.includes('união') || enteLower.includes('federal') || enteLower.includes('inss')) {
    return { pontos: 100, detalhe: 'União Federal / Autarquia Federal (Risco Soberano A+)' };
  }

  if (esfera === 'ESTADUAL') {
    if (['SP', 'RS', 'PR'].includes(ufUpper) || enteLower.includes('são paulo') || enteLower.includes('rio grande') || enteLower.includes('paraná')) {
      return { pontos: 85, detalhe: 'Estados Grupo A (SP, RS, PR - Alta liquidez e aportes constantes)' };
    }
    if (['MG', 'RJ', 'BA', 'GO'].includes(ufUpper) || enteLower.includes('minas') || enteLower.includes('rio de janeiro') || enteLower.includes('bahia') || enteLower.includes('goiás')) {
      return { pontos: 60, detalhe: 'Estados Grupo B (MG, RJ, BA, GO - Regime de recuperação / atraso moderado)' };
    }
    return { pontos: 35, detalhe: 'Estados Grupo C (Regime Especial Art. 101 ADCT com moratória estendida)' };
  }

  // MUNICIPAL
  if (enteLower.includes('capital') || ['são paulo', 'rio de janeiro', 'curitiba', 'belo horizonte', 'porto alegre', 'salvador'].some(cap => enteLower.includes(cap))) {
    return { pontos: 45, detalhe: 'Município Capital (Capacidade orçamentária média)' };
  }

  return { pontos: 20, detalhe: 'Município Interior / Pequeno Porte (Fila morosa, risco orçamentário)' };
}

/**
 * Heurística auditável de Estabilidade Processual (25%)
 * Fórmula:
 *   Pontuação Base = 100
 *   - Idade do Trânsito: se >= 2 anos (+0), se entre 1 e 2 anos (-10), se < 1 ano (-20)
 *   - Recursos pós-trânsito: cada recurso deduz 20 pontos
 *   - Limite mínimo: 0
 */
export function calcularPontosEstabilidadeProcessual(dataTransitoISO: string, numRecursos: number): { pontos: number; detalhe: string } {
  const transitoDate = new Date(dataTransitoISO);
  const now = new Date();
  const diffAnos = Math.max(0, (now.getTime() - transitoDate.getTime()) / (365.25 * 24 * 3600 * 1000));

  let pontos = 100;
  let detalhePartes: string[] = [];

  if (diffAnos >= 2) {
    detalhePartes.push(`Trânsito estável (${diffAnos.toFixed(1)} anos)`);
  } else if (diffAnos >= 1) {
    pontos -= 10;
    detalhePartes.push(`Trânsito recente (${diffAnos.toFixed(1)} anos, -10pts)`);
  } else {
    pontos -= 20;
    detalhePartes.push(`Trânsito inferior a 1 ano (-20pts)`);
  }

  if (numRecursos > 0) {
    const deducaoRecursos = Math.min(60, numRecursos * 20);
    pontos -= deducaoRecursos;
    detalhePartes.push(`${numRecursos} recurso(s) pós-trânsito (-${deducaoRecursos}pts)`);
  } else {
    detalhePartes.push('Sem recursos ou impugnações pendentes (+0)');
  }

  pontos = Math.max(0, Math.min(100, pontos));
  return { pontos, detalhe: detalhePartes.join(' | ') };
}

/**
 * Heurística auditável de Histórico de Pagamento do Ente (20%)
 */
export function calcularPontosHistoricoPagamento(adimplencia: 'TOTAL' | 'PARCIAL' | 'INADIMPLENTE'): { pontos: number; detalhe: string } {
  switch (adimplencia) {
    case 'TOTAL':
      return { pontos: 100, detalhe: 'Ente adimplente com aportes regulares na conta especial do Tribunal (últimos 24m)' };
    case 'PARCIAL':
      return { pontos: 50, detalhe: 'Aportes irregulares ou com atrasos pontuais de até 90 dias' };
    case 'INADIMPLENTE':
    default:
      return { pontos: 15, detalhe: 'Ente inadimplente perante a Fila Única do Tribunal (Risco de sequestro de rendas)' };
  }
}

/**
 * Heurística auditável da Natureza do Crédito (10%)
 */
export function calcularPontosNatureza(natureza: 'ALIMENTAR' | 'COMUM'): { pontos: number; detalhe: string } {
  if (natureza === 'ALIMENTAR') {
    return { pontos: 100, detalhe: 'Crédito Alimentar (Superpreferência Constitucional Art. 100, § 1º da CF)' };
  }
  return { pontos: 80, detalhe: 'Crédito Comum (Ordem cronológica ordinária de pagamento)' };
}

/**
 * Heurística auditável da Cadeia Limpa de Cessões (10%)
 * 0 cessões anteriores = 100; cada cessão deduz 20pts
 */
export function calcularPontosCadeiaCessoes(numCessoesAnteriores: number): { pontos: number; detalhe: string } {
  const pontos = Math.max(0, 100 - numCessoesAnteriores * 20);
  const detalhe = numCessoesAnteriores === 0
    ? 'Crédito originário direto do titular (Cadeia limpa 100%)'
    : `${numCessoesAnteriores} cessão(ões) preexistente(s) (-${numCessoesAnteriores * 20}pts)`;
  return { pontos, detalhe };
}

/**
 * ENGINE 1b: Cálculo completo do Score de Segurança Jurídica (0-100)
 */
export function computeJuridicalRiskScore(input: ScoreInputData, logger?: PrecatorioLogger): ScoreComposition {
  const log = logger || new PrecatorioLogger('RiskScoreEngine');
  log.info('Calculando Score de Segurança Jurídica do Precatório', { ente: input.enteDevedor, valor: input.valorPrecatorio });

  // 1. CHECAGEM DE BLOQUEIOS AUTOMÁTICOS (Score -> 0)
  const penhorasAtivas = input.dueDiligence.penhoras.filter(p => p.status === 'VIGENTE');
  if (penhorasAtivas.length > 0) {
    const motivo = `BLOQUEIO CRÍTICO: Consta ${penhorasAtivas.length} penhora(s) ativa(s) (BacenJud/SisbaJud) sobre o precatório.`;
    log.warn(motivo);
    return createBlockedScoreResult(motivo);
  }

  // Execução contra cedente > 50% do valor do precatório
  const somaExecucoes = input.dueDiligence.execucoesContraCedente.reduce((acc, curr) => acc + curr.valorExecutado, 0);
  if (input.valorPrecatorio > 0 && somaExecucoes / input.valorPrecatorio > 0.50) {
    const pct = ((somaExecucoes / input.valorPrecatorio) * 100).toFixed(1);
    const motivo = `BLOQUEIO CRÍTICO: Execuções ativas contra o cedente somam R$ ${somaExecucoes.toLocaleString('pt-BR')} (${pct}% do valor de face, superior ao limite de 50%).`;
    log.warn(motivo);
    return createBlockedScoreResult(motivo);
  }

  // Herdeiro não habilitado em inventário
  const herdeirosNaoHabilitados = input.dueDiligence.herdeirosHabilitados.filter(h => h.statusHabilitacao === 'PENDENTE_INVENTARIO' || h.statusHabilitacao === 'IMPUGNADO');
  if (herdeirosNaoHabilitados.length > 0) {
    const motivo = `BLOQUEIO CRÍTICO: Foram detectados ${herdeirosNaoHabilitados.length} herdeiro(s)/sucessor(es) pendentes de regularização de inventário formal.`;
    log.warn(motivo);
    return createBlockedScoreResult(motivo);
  }

  // Litispendência ou Coisa Julgada Rescisória
  if (input.dueDiligence.litispendencia || input.dueDiligence.coisaJulgadaRescisoria) {
    const motivo = `BLOQUEIO CRÍTICO: Identificada ação rescisória ou litispendência ativa no Tribunal de origem.`;
    log.warn(motivo);
    return createBlockedScoreResult(motivo);
  }

  // 2. CÁLCULO PONDERADO POR HEURÍSTICA
  const ente = calcularPontosEnteDevedor(input.esfera, input.enteDevedor, input.ufEnte);
  const estabilidade = calcularPontosEstabilidadeProcessual(input.dataTransitoJulgado, input.numeroRecursosAposTransito);
  const historico = calcularPontosHistoricoPagamento(input.adimplenciaEnteUltimos24m);
  const natureza = calcularPontosNatureza(input.natureza);
  const cadeia = calcularPontosCadeiaCessoes(input.quantidadeCessoesAnteriores);

  // Pesos: Ente 35%, Estabilidade 25%, Histórico 20%, Natureza 10%, Cadeia 10%
  const ponderadoEnte = ente.pontos * 0.35;
  const ponderadoEstabilidade = estabilidade.pontos * 0.25;
  const ponderadoHistorico = historico.pontos * 0.20;
  const ponderadoNatureza = natureza.pontos * 0.10;
  const ponderadoCadeia = cadeia.pontos * 0.10;

  const scoreTotal = Math.round(ponderadoEnte + ponderadoEstabilidade + ponderadoHistorico + ponderadoNatureza + ponderadoCadeia);

  let classificacao: ScoreComposition['classificacao'] = 'RISCO_MODERADO';
  if (scoreTotal >= 90) classificacao = 'TRIPLE_A';
  else if (scoreTotal >= 75) classificacao = 'DOUBLE_A';
  else if (scoreTotal < 50) classificacao = 'ALTO_RISCO';

  log.info(`Score calculado com sucesso: ${scoreTotal}/100 (${classificacao})`);

  return {
    scoreTotal,
    bloqueadoAutomatico: false,
    pesos: {
      enteDevedor: { peso: 0.35, pontuacao: ente.pontos, ponderado: ponderadoEnte, detalhe: ente.detalhe },
      estabilidadeProcessual: { peso: 0.25, pontuacao: estabilidade.pontos, ponderado: ponderadoEstabilidade, detalhe: estabilidade.detalhe },
      historicoPagamento: { peso: 0.20, pontuacao: historico.pontos, ponderado: ponderadoHistorico, detalhe: historico.detalhe },
      naturezaCredito: { peso: 0.10, pontuacao: natureza.pontos, ponderado: ponderadoNatureza, detalhe: natureza.detalhe },
      cadeiaCessoes: { peso: 0.10, pontuacao: cadeia.pontos, ponderado: ponderadoCadeia, detalhe: cadeia.detalhe }
    },
    classificacao
  };
}

function createBlockedScoreResult(motivo: string): ScoreComposition {
  return {
    scoreTotal: 0,
    bloqueadoAutomatico: true,
    motivoBloqueio: motivo,
    pesos: {
      enteDevedor: { peso: 0.35, pontuacao: 0, ponderado: 0, detalhe: 'Bloqueado preventivamente' },
      estabilidadeProcessual: { peso: 0.25, pontuacao: 0, ponderado: 0, detalhe: 'Bloqueado preventivamente' },
      historicoPagamento: { peso: 0.20, pontuacao: 0, ponderado: 0, detalhe: 'Bloqueado preventivamente' },
      naturezaCredito: { peso: 0.10, pontuacao: 0, ponderado: 0, detalhe: 'Bloqueado preventivamente' },
      cadeiaCessoes: { peso: 0.10, pontuacao: 0, ponderado: 0, detalhe: 'Bloqueado preventivamente' }
    },
    classificacao: 'BLOQUEADO'
  };
}
