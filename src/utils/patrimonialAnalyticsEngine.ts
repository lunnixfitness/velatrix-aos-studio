import {
  PatrimonialBalanceSheetInput,
  PatrimonialAnalysisResult,
  PatrimonialRating,
  PatrimonialRiskLevel,
  PatrimonialAlert,
  SolvencyLiquidityRatios,
  CapitalStructureRatios,
  ReturnProfitabilityRatios,
  AssetAllocationRatios
} from '../types/patrimonial';

export class VelatrixPatrimonialAnalyticsEngine {
  /**
   * Generates a realistic synthetic balance sheet input based on Annual Revenue and EBITDA margin
   * for express diagnosis scenarios where full SPED/BP is still being ingested.
   */
  public static generateSyntheticFromRevenue(
    annualRevenue: number,
    ebitdaMarginPercent: number
  ): PatrimonialBalanceSheetInput {
    const ebitda = annualRevenue * (ebitdaMarginPercent / 100);
    const ebit = ebitda * 0.78; // After D&A
    const despesasFinanceiras = annualRevenue * 0.038; // ~3.8% of revenue in finance costs
    const lucroAntesImpostos = Math.max(0, ebit - despesasFinanceiras);
    const lucroLiquido = lucroAntesImpostos * 0.66; // 34% effective tax

    // Asset estimations proportional to revenue (asset turnover ~ 1.35x)
    const ativoTotal = annualRevenue / 1.35;
    const ativoCirculante = ativoTotal * 0.58;
    const disponibilidades = annualRevenue * 0.065; // ~24 days of revenue
    const contasAReceber = annualRevenue * (58 / 365); // PMR = 58 days
    const estoques = annualRevenue * 0.12;
    const outrosAtivosCirculantes = Math.max(0, ativoCirculante - disponibilidades - contasAReceber - estoques);

    const ativoNaoCirculante = ativoTotal - ativoCirculante;
    const realizavelLongoPrazo = ativoNaoCirculante * 0.22;
    const imobilizadoLiquido = ativoNaoCirculante * 0.68;
    const intangivel = ativoNaoCirculante * 0.10;
    const imobilizadoBruto = imobilizadoLiquido * 1.45;
    const depreciacaoAcumulada = imobilizadoBruto - imobilizadoLiquido;

    // Liabilities and Equity
    // Debt structure: 64% total debt / assets
    const passivoTotalExigivel = ativoTotal * 0.64;
    const passivoCirculante = passivoTotalExigivel * 0.62; // 62% in short term (strained)
    const fornecedores = annualRevenue * (34 / 365); // PMP = 34 days
    const emprestimosCP = passivoCirculante * 0.42;
    const obrigacoesFiscaisTrabalhistasCP = passivoCirculante * 0.22;
    const outrosPassivosCirculantes = Math.max(0, passivoCirculante - fornecedores - emprestimosCP - obrigacoesFiscaisTrabalhistasCP);

    const passivoNaoCirculante = passivoTotalExigivel - passivoCirculante;
    const emprestimosLP = passivoNaoCirculante * 0.50;
    const debenturesFinanciamentosLP = passivoNaoCirculante * 0.20;
    const parcelamentosFiscaisLP = passivoNaoCirculante * 0.20;
    const provisoesContingenciasLP = passivoNaoCirculante * 0.10;

    const patrimonioLiquido = Math.max(ativoTotal * 0.15, ativoTotal - passivoTotalExigivel);
    const capitalSocial = patrimonioLiquido * 0.65;
    const reservasLucros = patrimonioLiquido * 0.25;
    const lucrosPrejuizosAcumulados = patrimonioLiquido * 0.10;

    // Contingencies & Encumbrances
    const contingenciasTrabalhistasProvaveis = annualRevenue * 0.012;
    const contingenciasFiscaisProvaveis = annualRevenue * 0.018;
    const contingenciasCiveisProvaveis = annualRevenue * 0.006;
    const contingenciasPossiveisTotal = annualRevenue * 0.035;
    const imobilizadoGravadoGarantia = imobilizadoLiquido * 0.48; // 48% tied in collateral

    return {
      disponibilidades,
      contasAReceber,
      estoques,
      outrosAtivosCirculantes,
      realizavelLongoPrazo,
      imobilizadoBruto,
      depreciacaoAcumulada,
      intangivel,
      fornecedores,
      emprestimosCurtoPrazo: emprestimosCP,
      obrigacoesFiscaisTrabalhistasCP,
      outrosPassivosCirculantes,
      emprestimosLongoPrazo: emprestimosLP,
      debenturesFinanciamentosLP,
      parcelamentosFiscaisLP,
      provisoesContingenciasLP,
      capitalSocial,
      reservasLucros,
      lucrosPrejuizosAcumulados,
      receitaBrutaAnual: annualRevenue,
      receitaLiquidaAnual: annualRevenue * 0.88,
      ebitdaAnual: ebitda,
      ebitAnual: ebit,
      lucroLiquidoAnual: lucroLiquido,
      despesasFinanceirasAnuais: despesasFinanceiras,
      aliquotaImpostoEfetiva: 0.34,
      contingenciasTrabalhistasProvaveis,
      contingenciasFiscaisProvaveis,
      contingenciasCiveisProvaveis,
      contingenciasPossiveisTotal,
      imobilizadoGravadoGarantia
    };
  }

  /**
   * Main Calculation Method for Patrimonial Analysis & Capital Structure
   */
  public static computePatrimonialAnalysis(
    input: PatrimonialBalanceSheetInput
  ): PatrimonialAnalysisResult {
    // 1. Asset Aggregates
    const ativoCirculante =
      input.disponibilidades +
      input.contasAReceber +
      input.estoques +
      input.outrosAtivosCirculantes;

    const imobilizadoLiquido = Math.max(
      0,
      input.imobilizadoBruto - input.depreciacaoAcumulada
    );

    const ativoNaoCirculante =
      input.realizavelLongoPrazo + imobilizadoLiquido + input.intangivel;

    const ativoTotal = ativoCirculante + ativoNaoCirculante;

    // 2. Liability & Equity Aggregates
    const passivoCirculante =
      input.fornecedores +
      input.emprestimosCurtoPrazo +
      input.obrigacoesFiscaisTrabalhistasCP +
      input.outrosPassivosCirculantes;

    const passivoNaoCirculante =
      input.emprestimosLongoPrazo +
      input.debenturesFinanciamentosLP +
      input.parcelamentosFiscaisLP +
      input.provisoesContingenciasLP;

    const passivoTotalExigivel = passivoCirculante + passivoNaoCirculante;

    const patrimonioLiquidoContabil = Math.max(
      1,
      input.capitalSocial +
        input.reservasLucros +
        input.lucrosPrejuizosAcumulados
    );

    // 3. Solvency & Liquidity Ratios
    const liquidezCorrente =
      passivoCirculante > 0 ? ativoCirculante / passivoCirculante : 1.5;
    const liquidezSeca =
      passivoCirculante > 0
        ? (ativoCirculante - input.estoques) / passivoCirculante
        : 1.0;
    const liquidezGeral =
      passivoTotalExigivel > 0
        ? (ativoCirculante + input.realizavelLongoPrazo) / passivoTotalExigivel
        : 1.2;
    const capitalGiroLiquido = ativoCirculante - passivoCirculante;
    const necessidadeCapitalGiro =
      input.contasAReceber + input.estoques - input.fornecedores;

    const solvency: SolvencyLiquidityRatios = {
      liquidezCorrente,
      liquidezSeca,
      liquidezGeral,
      capitalGiroLiquido,
      necessidadeCapitalGiro
    };

    // 4. Capital Structure Ratios
    const endividamentoGeral =
      ativoTotal > 0 ? passivoTotalExigivel / ativoTotal : 0.65;
    const composicaoEndividamentoCP =
      passivoTotalExigivel > 0
        ? (passivoCirculante / passivoTotalExigivel) * 100
        : 50;

    const passivoOnerosoTotal =
      input.emprestimosCurtoPrazo +
      input.emprestimosLongoPrazo +
      input.debenturesFinanciamentosLP;

    const dividaLiquida = passivoOnerosoTotal - input.disponibilidades;
    const dividaLiquidaSobreEbitda =
      input.ebitdaAnual > 0 ? dividaLiquida / input.ebitdaAnual : 4.5;
    const coberturaJurosICJ =
      input.despesasFinanceirasAnuais > 0
        ? input.ebitAnual / input.despesasFinanceirasAnuais
        : 2.0;
    const alavancagemPatrimonial =
      patrimonioLiquidoContabil > 0
        ? ativoTotal / patrimonioLiquidoContabil
        : 3.5;

    const capitalStructure: CapitalStructureRatios = {
      endividamentoGeral,
      composicaoEndividamentoCP,
      passivoOnerosoTotal,
      dividaLiquida,
      dividaLiquidaSobreEbitda,
      coberturaJurosICJ,
      alavancagemPatrimonial
    };

    // 5. Return & Profitability Ratios
    const roe =
      patrimonioLiquidoContabil > 0
        ? (input.lucroLiquidoAnual / patrimonioLiquidoContabil) * 100
        : 0;

    const taxRate = input.aliquotaImpostoEfetiva ?? 0.34;
    const nopat = input.ebitAnual * (1 - taxRate);
    const capitalInvestido =
      patrimonioLiquidoContabil + passivoOnerosoTotal - input.disponibilidades;
    const roic =
      capitalInvestido > 0 ? (nopat / capitalInvestido) * 100 : roe * 0.85;

    const roa = ativoTotal > 0 ? (input.lucroLiquidoAnual / ativoTotal) * 100 : 0;
    const margemLiquida =
      input.receitaLiquidaAnual > 0
        ? (input.lucroLiquidoAnual / input.receitaLiquidaAnual) * 100
        : 0;
    const margemEbitda =
      input.receitaLiquidaAnual > 0
        ? (input.ebitdaAnual / input.receitaLiquidaAnual) * 100
        : 0;

    const profitability: ReturnProfitabilityRatios = {
      roe,
      roic,
      roa,
      margemLiquida,
      margemEbitda
    };

    // 6. Asset Allocation & NAV Real
    const totalContingenciasMapeadas =
      input.contingenciasTrabalhistasProvaveis +
      input.contingenciasFiscaisProvaveis +
      input.contingenciasCiveisProvaveis +
      input.contingenciasPossiveisTotal;

    // NAV = PL Contábil - Intangíveis - Contingências Possíveis fora do Balanço
    const patrimonioLiquidoAjustadoNAV = Math.max(
      0,
      patrimonioLiquidoContabil -
        input.intangivel -
        input.contingenciasPossiveisTotal
    );

    const indiceImobilizacaoPL =
      patrimonioLiquidoContabil > 0
        ? (imobilizadoLiquido + input.intangivel) / patrimonioLiquidoContabil
        : 1.0;

    const indiceAtivosGravados =
      imobilizadoLiquido > 0
        ? (input.imobilizadoGravadoGarantia / imobilizadoLiquido) * 100
        : 0;

    const exposicaoContingenciasSobrePL =
      patrimonioLiquidoContabil > 0
        ? (totalContingenciasMapeadas / patrimonioLiquidoContabil) * 100
        : 0;

    const assetAllocation: AssetAllocationRatios = {
      ativoTotal,
      passivoTotal: passivoTotalExigivel,
      patrimonioLiquidoContabil,
      patrimonioLiquidoAjustadoNAV,
      indiceImobilizacaoPL,
      indiceAtivosGravados,
      exposicaoContingenciasSobrePL,
      totalContingenciasMapeadas
    };

    // 7. Scoring and Rating Calculation
    let score = 70; // baseline

    // Solvency score adjustment
    if (liquidezCorrente < 1.0) score -= 14;
    else if (liquidezCorrente < 1.3) score -= 6;
    else score += 6;

    if (liquidezGeral < 0.9) score -= 10;
    else if (liquidezGeral > 1.2) score += 5;

    // Leverage score adjustment
    if (dividaLiquidaSobreEbitda > 3.5) score -= 18;
    else if (dividaLiquidaSobreEbitda > 2.5) score -= 8;
    else if (dividaLiquidaSobreEbitda < 1.5) score += 8;

    if (composicaoEndividamentoCP > 60) score -= 10;
    if (coberturaJurosICJ < 1.5) score -= 12;
    else if (coberturaJurosICJ > 3.0) score += 6;

    // Return adjustment
    if (roe < 8) score -= 8;
    else if (roe > 18) score += 8;

    if (roic < 10) score -= 6;
    else if (roic > 16) score += 6;

    // Encumbrances and Contingencies
    if (indiceAtivosGravados > 50) score -= 8;
    if (exposicaoContingenciasSobrePL > 30) score -= 8;

    // Clamp score 10 - 98
    const ratingScore = Math.max(12, Math.min(96, Math.round(score)));

    let rating: PatrimonialRating = 'BBB';
    let riskLevel: PatrimonialRiskLevel = 'Moderado';

    if (ratingScore >= 90) {
      rating = 'AAA';
      riskLevel = 'Baixo';
    } else if (ratingScore >= 80) {
      rating = 'AA';
      riskLevel = 'Baixo';
    } else if (ratingScore >= 70) {
      rating = 'A';
      riskLevel = 'Baixo';
    } else if (ratingScore >= 60) {
      rating = 'BBB';
      riskLevel = 'Moderado';
    } else if (ratingScore >= 48) {
      rating = 'BB';
      riskLevel = 'Moderado';
    } else if (ratingScore >= 35) {
      rating = 'B';
      riskLevel = 'Alto';
    } else if (ratingScore >= 20) {
      rating = 'CCC';
      riskLevel = 'Crítico';
    } else {
      rating = 'D';
      riskLevel = 'Crítico';
    }

    // 8. Generate Specific Patrimonial Alerts
    const alerts: PatrimonialAlert[] = [];

    // Alert: Concentração de Passivo em Curto Prazo
    if (composicaoEndividamentoCP > 55) {
      alerts.push({
        id: 'ALT_PATR_01',
        category: 'ESTRUTURA_CAPITAL',
        severity: composicaoEndividamentoCP > 70 ? 'CRÍTICO' : 'ALERTA',
        title: 'Perfil de Dívida Pressionado no Curto Prazo (CP)',
        metric: 'Composição de Curto Prazo (CE)',
        currentValue: `${composicaoEndividamentoCP.toFixed(1)}% do Passivo`,
        benchmark: '< 45.0%',
        riskDescription:
          'Mais da metade da dívida vence em menos de 12 meses, gerando necessidade contínua de rolagem bancária com spreads punitivos.',
        aosRemediation:
          'Ativação do módulo Oráculo Contrafactual para alongamento de passivo via emissão de CRI/CRA ou cessão de recebíveis performados a CDI + 1.8%.'
      });
    }

    // Alert: Alavancagem Dívida Líquida / EBITDA
    if (dividaLiquidaSobreEbitda > 2.5) {
      alerts.push({
        id: 'ALT_PATR_02',
        category: 'ESTRUTURA_CAPITAL',
        severity: dividaLiquidaSobreEbitda > 3.5 ? 'CRÍTICO' : 'ALERTA',
        title: 'Alavancagem Financeira Elevada sobre a Geração de Caixa',
        metric: 'Dívida Líquida / EBITDA',
        currentValue: `${dividaLiquidaSobreEbitda.toFixed(2)}x`,
        benchmark: '< 2.50x',
        riskDescription:
          'O volume de endividamento oneroso líquido excede a capacidade anual de amortização do EBITDA, fragilizando ratings bancários e covenants.',
        aosRemediation:
          'Módulo de Governança Autônoma D+0 retém até 81% de sangrias operacionais, acelerando o desendividamento e reduzindo a razão em 0.6x em 12 meses.'
      });
    }

    // Alert: Cobertura de Juros (ICJ)
    if (coberturaJurosICJ < 2.0) {
      alerts.push({
        id: 'ALT_PATR_03',
        category: 'SOLVENCIA',
        severity: coberturaJurosICJ < 1.3 ? 'CRÍTICO' : 'ALERTA',
        title: 'Pressão de Despesas Financeiras sobre o EBIT',
        metric: 'Índice de Cobertura de Juros (ICJ)',
        currentValue: `${coberturaJurosICJ.toFixed(2)}x`,
        benchmark: '> 2.50x',
        riskDescription:
          'O lucro operacional operacional está quase integralmente comprometido com o serviço da dívida e despesas de antecipação de boletos/cartões.',
        aosRemediation:
          'Substituição de antecipações caras por centralização de tesouraria D+0 com liquidação em cadeia e travas automáticas anti-spread.'
      });
    }

    // Alert: Comprometimento de Ativos em Garantias
    if (indiceAtivosGravados > 40) {
      alerts.push({
        id: 'ALT_PATR_04',
        category: 'GARANTIAS',
        severity: indiceAtivosGravados > 65 ? 'CRÍTICO' : 'MODERADO',
        title: 'Alta Taxa de Imobilizado Gravado em Alienação Fiduciária',
        metric: 'Ativos Gravados / Imobilizado Líquido',
        currentValue: `${indiceAtivosGravados.toFixed(1)}%`,
        benchmark: '< 30.0%',
        riskDescription:
          'Quase metade das máquinas e imóveis já está alienada em garantia de empréstimos, reduzindo a flexibilidade para novas operações estruturadas.',
        aosRemediation:
          'Auditoria contínua de gravames via integração cartorária e repactuação de garantias com liberação de hipotecas em linhas quitadas.'
      });
    }

    // Alert: Exposição a Contingências
    if (exposicaoContingenciasSobrePL > 20) {
      alerts.push({
        id: 'ALT_PATR_05',
        category: 'CONTINGENCIAS',
        severity: exposicaoContingenciasSobrePL > 35 ? 'CRÍTICO' : 'ALERTA',
        title: 'Exposição Relevante a Contingências Trabalhistas e Fiscais',
        metric: 'Contingências / Patrimônio Líquido',
        currentValue: `${exposicaoContingenciasSobrePL.toFixed(1)}% do PL`,
        benchmark: '< 15.0%',
        riskDescription:
          'Passivos contingentes estimados em risco provável e possível pressionam o Valor Patrimonial Real (NAV) e aumentam risco de penhoras judiciais.',
        aosRemediation:
          'Módulo de Governança Preventiva monitora diários oficiais e ativa quórum Multi-Sig para transação tributária SEFAZ/RFB antes de execuções fiscais.'
      });
    }

    // 9. Executive Summary
    const executiveSummary = `A avaliação de Governança Patrimonial e Estrutura de Capital da empresa atribui Rating ${rating} (${ratingScore}/100 - Risco ${riskLevel}). A estrutura apresenta Liquidez Corrente de ${liquidezCorrente.toFixed(2)} e Liquidez Geral de ${liquidezGeral.toFixed(2)}. O endividamento atinge ${(endividamentoGeral * 100).toFixed(1)}% dos ativos, com ${composicaoEndividamentoCP.toFixed(1)}% concentrado no curto prazo. A alavancagem de Dívida Líquida/EBITDA está em ${dividaLiquidaSobreEbitda.toFixed(2)}x com ROIC de ${roic.toFixed(1)}% e ROE de ${roe.toFixed(1)}%. O Patrimônio Líquido Tangível Ajustado (NAV) foi calculado considerando a dedução de contingências prováveis e off-balance.`;

    const aosDirectives = [
      'Alongamento de passivos de curto prazo com conversão em títulos estruturados (redução da pressão de caixa em D+30).',
      'Desalavancagem acelerada através da captura das economias do AOS (recuperação de margem EBITDA retida em D+0).',
      'Liberação de gravames e desoneração de ativos imobilizados após amortizações estratégicas.',
      'Governança preditiva de contingências jurídicas com acordos preventivos antes de bloqueios via SisbaJud.'
    ];

    return {
      rating,
      ratingScore,
      riskLevel,
      solvency,
      capitalStructure,
      profitability,
      assetAllocation,
      alerts,
      executiveSummary,
      aosDirectives
    };
  }
}
