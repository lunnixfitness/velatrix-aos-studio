import {
  DetailedDreWaterfallInput,
  DetailedDreCalculatedResults,
  NonRecurringLegalCompliance,
  HospitalEquiparationCompliance
} from '../types/patrimonial';

export interface RecurrentVsAdjustedAnalysis {
  ebitdaRecorrente: number;
  margemEbitdaRecorrente: number;
  ebitdaAjustado: number;
  margemEbitdaAjustada: number;
  deltaEbitda: number;
  deltaMargemEbitda: number;

  lucroLiquidoRecorrente: number;
  margemLiquidaRecorrente: number;
  lucroLiquidoAjustado: number;
  margemLiquidaAjustada: number;
  deltaLucroLiquido: number;
  deltaMargemLiquida: number;

  totalAjustesExtraordinariosBruto: number;
  totalAjustesExtraordinariosLiquido: number;
  percentualExtraordinarioSobreReceita: number;
  percentualExtraordinarioSobreEbitda: number;

  zScoreRecorrente: number;
  zScoreAjustado: number;
  deltaZScore: number;
  classificacaoZScoreRecorrente: 'Zona de Estresse' | 'Zona de Alerta' | 'Zona Segura';
  classificacaoZScoreAjustado: 'Zona de Estresse' | 'Zona de Alerta' | 'Zona Segura';

  grauDependenciaFiscal: 'BAIXA' | 'MODERADA' | 'ELEVADA' | 'CRÍTICA';
  diagnosticoOperacional: string;
  recomendacaoPropostaAos: string;
}

export class VelatrixDreCascadeEngine {
  /**
   * Generates detailed DRE inputs based on annual revenue, sector, and optional target EBITDA margin from slider
   */
  public static generateDefaultDreInput(
    annualRevenue: number = 18400000,
    sectorKey: string = 'manufacturing',
    ebitdaMarginTarget?: number,
    existingCompliance?: {
      complianceEstornoPisCofins?: NonRecurringLegalCompliance;
      complianceInssPatronal?: NonRecurringLegalCompliance;
      complianceAtualizacaoSelic?: NonRecurringLegalCompliance;
      complianceHospitalar?: HospitalEquiparationCompliance;
    }
  ): DetailedDreWaterfallInput {
    // 1. Proporções por setor econômico
    let splitTributadas = 0.72;
    let splitMonofasicas = 0.28;
    let taxaDeducoes = 0.125;
    let taxaCpvBase = 0.52;
    let taxaSgaBase = 0.16;

    switch (sectorKey) {
      case 'health':
        splitTributadas = 0.82;
        splitMonofasicas = 0.18;
        taxaDeducoes = 0.095;
        taxaCpvBase = 0.45;
        taxaSgaBase = 0.28;
        break;
      case 'retail':
        splitTributadas = 0.55;
        splitMonofasicas = 0.45;
        taxaDeducoes = 0.11;
        taxaCpvBase = 0.64;
        taxaSgaBase = 0.15;
        break;
      case 'services':
      case 'fintech':
        splitTributadas = 0.92;
        splitMonofasicas = 0.08;
        taxaDeducoes = 0.118;
        taxaCpvBase = 0.35;
        taxaSgaBase = 0.36;
        break;
      case 'agribusiness':
        splitTributadas = 0.70;
        splitMonofasicas = 0.30;
        taxaDeducoes = 0.075;
        taxaCpvBase = 0.66;
        taxaSgaBase = 0.13;
        break;
      case 'logistics':
        splitTributadas = 0.85;
        splitMonofasicas = 0.15;
        taxaDeducoes = 0.115;
        taxaCpvBase = 0.58;
        taxaSgaBase = 0.16;
        break;
      case 'construction':
        splitTributadas = 0.80;
        splitMonofasicas = 0.20;
        taxaDeducoes = 0.09;
        taxaCpvBase = 0.62;
        taxaSgaBase = 0.15;
        break;
      default: // manufacturing
        splitTributadas = 0.72;
        splitMonofasicas = 0.28;
        taxaDeducoes = 0.125;
        taxaCpvBase = 0.52;
        taxaSgaBase = 0.16;
        break;
    }

    const vendasTributadasServicos = annualRevenue * splitTributadas;
    const vendasMonofasicasSt = annualRevenue * splitMonofasicas;
    const impostosDeclarados = annualRevenue * taxaDeducoes;
    const receitaLiquidaEstimada = annualRevenue - impostosDeclarados;

    // Se o usuário especificou uma margem EBITDA alvo (slider da Etapa 1)
    let custosCpvCmv: number;
    let despesasAdministrativasPessoal: number;
    const assinaturaSaasErp = Math.min(240000, Math.max(72000, annualRevenue * 0.01));

    if (ebitdaMarginTarget !== undefined && ebitdaMarginTarget > 0 && ebitdaMarginTarget < 85) {
      // EBITDA Target = Margem% * Receita Líquida
      const targetEbitdaValue = receitaLiquidaEstimada * (ebitdaMarginTarget / 100);
      const targetTotalOperatingCost = Math.max(0, receitaLiquidaEstimada - targetEbitdaValue);
      
      // Divide entre CPV e SG&A conforme peso relativo do setor
      const totalRatio = taxaCpvBase + taxaSgaBase;
      const cpvShare = taxaCpvBase / totalRatio;
      custosCpvCmv = targetTotalOperatingCost * cpvShare;
      despesasAdministrativasPessoal = Math.max(0, (targetTotalOperatingCost * (1 - cpvShare)) - assinaturaSaasErp);
    } else {
      custosCpvCmv = annualRevenue * taxaCpvBase;
      despesasAdministrativasPessoal = Math.max(0, (annualRevenue * taxaSgaBase) - assinaturaSaasErp);
    }

    // Créditos não recorrentes auditados segregados
    const estornoPisCofinsIcmsStIndevidos = annualRevenue * 0.036;
    const ajusteEsocialInssPatronalRevertido = annualRevenue * 0.014;
    const depreciacaoAmortizacao = annualRevenue * 0.032;
    const despesasFinanceiras = annualRevenue * 0.035;
    const receitasFinanceirasOrdinarias = annualRevenue * 0.008;
    const atualizacaoSelicIndebitosRecuperados = annualRevenue * 0.018;

    return {
      vendasTributadasServicos,
      vendasMonofasicasSt,
      impostosDeclarados,
      estornoPisCofinsIcmsStIndevidos,
      complianceEstornoPisCofins: existingCompliance?.complianceEstornoPisCofins || {
        numeroProcessoOuPerDcomp: 'PER-DCOMP 08314.92182/2024-11',
        hasTransitoEmJulgadoOuHomologacao: true,
        orgaoJulgadorOuFiscal: 'TRF-3 / RFB Delegacia de Julgamento',
        dataHomologacao: '18/11/2024',
        observacaoConformidade: 'Tema 69 STF - Exclusão ICMS destacado da base de PIS/COFINS com trânsito em julgado certificado.'
      },
      custosCpvCmv,
      despesasAdministrativasPessoal,
      ajusteEsocialInssPatronalRevertido,
      complianceInssPatronal: existingCompliance?.complianceInssPatronal || {
        numeroProcessoOuPerDcomp: 'Processo Judicial nº 5002148-77.2023.4.03.6100',
        hasTransitoEmJulgadoOuHomologacao: true,
        orgaoJulgadorOuFiscal: 'Vara Federal Cível SP',
        dataHomologacao: '05/03/2025',
        observacaoConformidade: 'Tema 163 STF - Não incidência de contribuição previdenciária patronal sobre terço constitucional de férias indenizadas.'
      },
      assinaturaSaasErp,
      depreciacaoAmortizacao,
      despesasFinanceiras,
      receitasFinanceirasOrdinarias,
      atualizacaoSelicIndebitosRecuperados,
      complianceAtualizacaoSelic: existingCompliance?.complianceAtualizacaoSelic || {
        numeroProcessoOuPerDcomp: 'PER-DCOMP 08314.92182/2024-11 (Gizat SELIC)',
        hasTransitoEmJulgadoOuHomologacao: true,
        orgaoJulgadorOuFiscal: 'RFB / SELIC Acumulada 2019-2024',
        dataHomologacao: '18/11/2024',
        observacaoConformidade: 'Tema 962 STF - Não incidência de IRPJ e CSLL sobre juros SELIC na repetição de indébito tributário.'
      },
      aliquotaIrpjCsllEfetiva: 0.34,
      complianceHospitalar: existingCompliance?.complianceHospitalar || {
        habilitadoManualmente: false, // CRÍTICO: Por padrão desabilitado
        registroAnvisaAtivo: false,
        estruturaInternacaoCirurgicaComprovada: false,
        sociedadeEmpresariaComprovada: false,
        custosHospitalaresIndividualizados: false,
        termoResponsabilidadeAceito: false,
        aliquotaIrpjPresumidaReduzida: 0.08,
        aliquotaCsllPresumidaReduzida: 0.12
      }
    };
  }

  /**
   * Generates or merges DRE input from a parsed financial document (PDF/XLSX)
   */
  public static generateDreFromParsedDocument(
    parsed: {
      grossRevenue?: number;
      ebitdaMargin?: number;
      ebitdaValue?: number;
      netIncome?: number;
    },
    fallbackRevenue: number = 18400000,
    sectorKey: string = 'manufacturing',
    existingInput?: DetailedDreWaterfallInput
  ): DetailedDreWaterfallInput {
    const revenue = parsed.grossRevenue && parsed.grossRevenue > 0 ? parsed.grossRevenue : fallbackRevenue;
    const ebitdaMargin = parsed.ebitdaMargin && parsed.ebitdaMargin > 0 ? parsed.ebitdaMargin : undefined;
    
    return VelatrixDreCascadeEngine.generateDefaultDreInput(
      revenue,
      sectorKey,
      ebitdaMargin,
      existingInput ? {
        complianceEstornoPisCofins: existingInput.complianceEstornoPisCofins,
        complianceInssPatronal: existingInput.complianceInssPatronal,
        complianceAtualizacaoSelic: existingInput.complianceAtualizacaoSelic,
        complianceHospitalar: existingInput.complianceHospitalar
      } : undefined
    );
  }

  /**
   * Executes the full waterfall DRE calculation with strict legal compliance separation
   */
  public static computeCascade(input: DetailedDreWaterfallInput): DetailedDreCalculatedResults {
    // 1. RECEITA BRUTA (100% AV)
    const receitaBrutaTotal = input.vendasTributadasServicos + input.vendasMonofasicasSt;
    const avReceitaBruta = 100.0;

    // 2. DEDUÇÕES E IMPOSTOS SOBRE VENDAS
    const deducoesRecorrentes = input.impostosDeclarados;
    const avDeducoesRecorrentes = receitaBrutaTotal > 0 ? (deducoesRecorrentes / receitaBrutaTotal) * 100 : 0;

    // Validação de Conformidade do Estorno PIS/COFINS e ICMS-ST
    const isEstornoValido = Boolean(
      input.complianceEstornoPisCofins.hasTransitoEmJulgadoOuHomologacao &&
      input.complianceEstornoPisCofins.numeroProcessoOuPerDcomp.trim().length > 3
    );
    const estornoExtraordinarioDeducoes = isEstornoValido ? input.estornoPisCofinsIcmsStIndevidos : 0;

    // 3. RECEITA LÍQUIDA
    const receitaLiquidaRecorrente = Math.max(0, receitaBrutaTotal - deducoesRecorrentes);
    const avReceitaLiquidaRecorrente = receitaBrutaTotal > 0 ? (receitaLiquidaRecorrente / receitaBrutaTotal) * 100 : 0;

    const receitaLiquidaAjustada = receitaLiquidaRecorrente + estornoExtraordinarioDeducoes;
    const avReceitaLiquidaAjustada = receitaBrutaTotal > 0 ? (receitaLiquidaAjustada / receitaBrutaTotal) * 100 : 0;

    // 4. TOTAL DE CUSTOS (CPV/CMV) & LUCRO BRUTO
    const custosCpvCmv = input.custosCpvCmv;
    const avCustosCpvCmv = receitaBrutaTotal > 0 ? (custosCpvCmv / receitaBrutaTotal) * 100 : 0;

    const lucroBrutoRecorrente = receitaLiquidaRecorrente - custosCpvCmv;
    const margemBrutaRecorrente = receitaLiquidaRecorrente > 0 ? (lucroBrutoRecorrente / receitaLiquidaRecorrente) * 100 : 0;

    const lucroBrutoAjustado = receitaLiquidaAjustada - custosCpvCmv;
    const margemBrutaAjustada = receitaLiquidaAjustada > 0 ? (lucroBrutoAjustado / receitaLiquidaAjustada) * 100 : 0;

    // 5. DESPESAS OPERACIONAIS (SG&A)
    const sgaRecorrenteTotal = input.despesasAdministrativasPessoal + input.assinaturaSaasErp;
    const avSgaRecorrente = receitaBrutaTotal > 0 ? (sgaRecorrenteTotal / receitaBrutaTotal) * 100 : 0;

    // Validação de Conformidade do Ajuste eSocial INSS Patronal
    const isInssValido = Boolean(
      input.complianceInssPatronal.hasTransitoEmJulgadoOuHomologacao &&
      input.complianceInssPatronal.numeroProcessoOuPerDcomp.trim().length > 3
    );
    const reversaoExtraordinariaInss = isInssValido ? input.ajusteEsocialInssPatronalRevertido : 0;
    const sgaAjustadoTotal = Math.max(0, sgaRecorrenteTotal - reversaoExtraordinariaInss);

    // 6. EBITDA
    const ebitdaRecorrente = lucroBrutoRecorrente - sgaRecorrenteTotal;
    const margemEbitdaRecorrente = receitaLiquidaRecorrente > 0 ? (ebitdaRecorrente / receitaLiquidaRecorrente) * 100 : 0;

    const ebitdaAjustado = lucroBrutoAjustado - sgaAjustadoTotal;
    const margemEbitdaAjustada = receitaLiquidaAjustada > 0 ? (ebitdaAjustado / receitaLiquidaAjustada) * 100 : 0;

    // 7. EBIT
    const depreciacaoAmortizacao = input.depreciacaoAmortizacao;
    const ebitRecorrente = ebitdaRecorrente - depreciacaoAmortizacao;
    const ebitAjustado = ebitdaAjustado - depreciacaoAmortizacao;

    // 8. RESULTADO FINANCEIRO & SELIC EXTRAORDINÁRIA
    const despesasFinanceiras = input.despesasFinanceiras;
    const receitasFinanceiras = input.receitasFinanceirasOrdinarias || 0;
    const resultadoFinanceiroRecorrente = receitasFinanceiras - despesasFinanceiras;

    // Validação SELIC sobre Indébitos
    const isSelicValida = Boolean(
      input.complianceAtualizacaoSelic.hasTransitoEmJulgadoOuHomologacao &&
      input.complianceAtualizacaoSelic.numeroProcessoOuPerDcomp.trim().length > 3
    );
    const atualizacaoSelicExtraordinaria = isSelicValida ? input.atualizacaoSelicIndebitosRecuperados : 0;

    // 9. EBT (LAIR - Lucro Antes dos Tributos)
    const ebtRecorrente = ebitRecorrente + resultadoFinanceiroRecorrente;
    const ebtAjustado = ebitAjustado + resultadoFinanceiroRecorrente + atualizacaoSelicExtraordinaria;

    // 10. IMPOSTOS SOBRE O LUCRO (IRPJ / CSLL) & REGRA EQUIPARAÇÃO HOSPITALAR
    const isEquiparacaoHospitalarAtiva = Boolean(
      input.complianceHospitalar.habilitadoManualmente &&
      input.complianceHospitalar.registroAnvisaAtivo &&
      input.complianceHospitalar.estruturaInternacaoCirurgicaComprovada &&
      input.complianceHospitalar.sociedadeEmpresariaComprovada &&
      input.complianceHospitalar.custosHospitalaresIndividualizados &&
      input.complianceHospitalar.termoResponsabilidadeAceito
    );

    // Alíquota padrão vs. Equiparação Hospitalar
    let aliquotaEfetivaAplicada = input.aliquotaIrpjCsllEfetiva || 0.34;
    let impostosLucroRecorrente = 0;
    let impostosLucroAjustado = 0;

    if (isEquiparacaoHospitalarAtiva) {
      // No regime de equiparação hospitalar (Lei 9.249/95 art. 15 §1º III "a"):
      // Base presunção IRPJ = 8% * 15% (+10% adicional) = ~2.0% da receita de serviços hospitalares
      // Base presunção CSLL = 12% * 9% = 1.08% da receita de serviços hospitalares
      // Alíquota efetiva global equivalente aproximada a 14.5% sobre o lucro contábil
      aliquotaEfetivaAplicada = 0.145;
      impostosLucroRecorrente = Math.max(0, ebtRecorrente * aliquotaEfetivaAplicada);
      impostosLucroAjustado = Math.max(0, ebtAjustado * aliquotaEfetivaAplicada);
    } else {
      impostosLucroRecorrente = Math.max(0, ebtRecorrente * aliquotaEfetivaAplicada);
      impostosLucroAjustado = Math.max(0, ebtAjustado * aliquotaEfetivaAplicada);
    }

    // 11. RESULTADO LÍQUIDO & MARGEM LÍQUIDA
    const resultadoLiquidoRecorrente = ebtRecorrente - impostosLucroRecorrente;
    const margemLiquidaRecorrente = receitaLiquidaRecorrente > 0 ? (resultadoLiquidoRecorrente / receitaLiquidaRecorrente) * 100 : 0;

    const resultadoLiquidoAjustado = ebtAjustado - impostosLucroAjustado;
    const margemLiquidaAjustada = receitaLiquidaAjustada > 0 ? (resultadoLiquidoAjustado / receitaLiquidaAjustada) * 100 : 0;

    // 12. NOPAT (Net Operating Profit After Taxes = EBIT * (1 - t))
    const nopatRecorrente = ebitRecorrente * (1 - aliquotaEfetivaAplicada);
    const nopatAjustado = ebitAjustado * (1 - aliquotaEfetivaAplicada);

    // 13. SUBTOTAL CONSOLIDADO DE AJUSTES TRIBUTÁRIOS EXTRAORDINÁRIOS
    const impactoTotalBruto = estornoExtraordinarioDeducoes + reversaoExtraordinariaInss + atualizacaoSelicExtraordinaria;
    
    // O Tema 962 STF isenta a SELIC de IRPJ/CSLL, enquanto estornos de PIS/COFINS e reversões de despesas podem ter reflexo tributário
    const impactoTotalLiquidoAposIr = 
      (estornoExtraordinarioDeducoes * (1 - aliquotaEfetivaAplicada)) +
      (reversaoExtraordinariaInss * (1 - aliquotaEfetivaAplicada)) +
      atualizacaoSelicExtraordinaria; // 100% livre de IRPJ/CSLL conforme STF

    let itensHomologadosCount = 0;
    if (isEstornoValido) itensHomologadosCount++;
    if (isInssValido) itensHomologadosCount++;
    if (isSelicValida) itensHomologadosCount++;

    return {
      receitaBrutaTotal,
      avReceitaBruta,
      deducoesRecorrentes,
      avDeducoesRecorrentes,
      estornoExtraordinarioDeducoes,
      isEstornoValido,
      receitaLiquidaRecorrente,
      avReceitaLiquidaRecorrente,
      receitaLiquidaAjustada,
      avReceitaLiquidaAjustada,
      custosCpvCmv,
      avCustosCpvCmv,
      lucroBrutoRecorrente,
      margemBrutaRecorrente,
      lucroBrutoAjustado,
      margemBrutaAjustada,
      sgaRecorrenteTotal,
      avSgaRecorrente,
      reversaoExtraordinariaInss,
      isInssValido,
      sgaAjustadoTotal,
      ebitdaRecorrente,
      margemEbitdaRecorrente,
      ebitdaAjustado,
      margemEbitdaAjustada,
      depreciacaoAmortizacao,
      ebitRecorrente,
      ebitAjustado,
      despesasFinanceiras,
      receitasFinanceiras,
      resultadoFinanceiroRecorrente,
      atualizacaoSelicExtraordinaria,
      isSelicValida,
      ebtRecorrente,
      ebtAjustado,
      impostosLucroRecorrente,
      impostosLucroAjustado,
      isEquiparacaoHospitalarAtiva,
      aliquotaEfetivaAplicada,
      resultadoLiquidoRecorrente,
      margemLiquidaRecorrente,
      resultadoLiquidoAjustado,
      margemLiquidaAjustada,
      nopatRecorrente,
      nopatAjustado,
      subtotalAjustesTributariosExtraordinarios: {
        estornoPisCofinsIcmsSt: estornoExtraordinarioDeducoes,
        reversaoInssPatronal: reversaoExtraordinariaInss,
        atualizacaoSelic: atualizacaoSelicExtraordinaria,
        impactoTotalBruto,
        impactoTotalLiquidoAposIr,
        itensHomologadosCount,
        itensPendentesCount: 3 - itensHomologadosCount
      }
    };
  }

  /**
   * Computes comparative metrics between Recurrent Operational performance and Adjusted performance
   * with Extraordinary Tax Credits, preventing artificial inflation of solvency and Altman Z-Score.
   */
  public static computeRecurrentVsAdjustedMetrics(
    results: DetailedDreCalculatedResults,
    patrimonial?: {
      totalAtivo?: number;
      passivoTotal?: number;
      capitalGiro?: number;
      patrimonioLiquido?: number;
    }
  ): RecurrentVsAdjustedAnalysis {
    const ebitdaRecorrente = results.ebitdaRecorrente;
    const margemEbitdaRecorrente = results.margemEbitdaRecorrente;
    const ebitdaAjustado = results.ebitdaAjustado;
    const margemEbitdaAjustada = results.margemEbitdaAjustada;
    const deltaEbitda = ebitdaAjustado - ebitdaRecorrente;
    const deltaMargemEbitda = margemEbitdaAjustada - margemEbitdaRecorrente;

    const lucroLiquidoRecorrente = results.resultadoLiquidoRecorrente;
    const margemLiquidaRecorrente = results.margemLiquidaRecorrente;
    const lucroLiquidoAjustado = results.resultadoLiquidoAjustado;
    const margemLiquidaAjustada = results.margemLiquidaAjustada;
    const deltaLucroLiquido = lucroLiquidoAjustado - lucroLiquidoRecorrente;
    const deltaMargemLiquida = margemLiquidaAjustada - margemLiquidaRecorrente;

    const totalAjustesExtraordinariosBruto = results.subtotalAjustesTributariosExtraordinarios.impactoTotalBruto;
    const totalAjustesExtraordinariosLiquido = results.subtotalAjustesTributariosExtraordinarios.impactoTotalLiquidoAposIr;

    const percentualExtraordinarioSobreReceita = results.receitaBrutaTotal > 0
      ? (totalAjustesExtraordinariosBruto / results.receitaBrutaTotal) * 100
      : 0;

    const percentualExtraordinarioSobreEbitda = ebitdaAjustado > 0
      ? (deltaEbitda / ebitdaAjustado) * 100
      : 0;

    // Altman Z-Score Modeling (Standard weights)
    // Factor X3 = EBIT / Ativo Total (weighted 3.3)
    const totalAtivo = patrimonial?.totalAtivo && patrimonial.totalAtivo > 0
      ? patrimonial.totalAtivo
      : results.receitaBrutaTotal * 0.75;
    const passivoTotal = patrimonial?.passivoTotal && patrimonial.passivoTotal > 0
      ? patrimonial.passivoTotal
      : totalAtivo * 0.55;
    const capitalGiro = patrimonial?.capitalGiro !== undefined
      ? patrimonial.capitalGiro
      : totalAtivo * 0.20;
    const pl = patrimonial?.patrimonioLiquido && patrimonial.patrimonioLiquido > 0
      ? patrimonial.patrimonioLiquido
      : totalAtivo * 0.45;

    const x1 = capitalGiro / totalAtivo;
    const x2 = (pl * 0.4) / totalAtivo;
    const x4 = pl / Math.max(1, passivoTotal);
    const x5 = results.receitaBrutaTotal / totalAtivo;

    const x3Recorrente = results.ebitRecorrente / totalAtivo;
    const x3Ajustado = results.ebitAjustado / totalAtivo;

    const baseZWithoutX3 = (1.2 * x1) + (1.4 * x2) + (0.6 * x4) + (0.99 * x5);
    const zScoreRecorrente = Number(Math.max(0.6, Math.min(5.0, baseZWithoutX3 + (3.3 * x3Recorrente))).toFixed(2));
    const zScoreAjustado = Number(Math.max(0.6, Math.min(5.0, baseZWithoutX3 + (3.3 * x3Ajustado))).toFixed(2));
    const deltaZScore = Number((zScoreAjustado - zScoreRecorrente).toFixed(2));

    const getClassification = (z: number): 'Zona de Estresse' | 'Zona de Alerta' | 'Zona Segura' => {
      if (z >= 2.9) return 'Zona Segura';
      if (z >= 1.8) return 'Zona de Alerta';
      return 'Zona de Estresse';
    };

    const classificacaoZScoreRecorrente = getClassification(zScoreRecorrente);
    const classificacaoZScoreAjustado = getClassification(zScoreAjustado);

    // Grau de dependência de créditos fiscais
    let grauDependenciaFiscal: 'BAIXA' | 'MODERADA' | 'ELEVADA' | 'CRÍTICA' = 'BAIXA';
    if (deltaEbitda > 0) {
      if (percentualExtraordinarioSobreEbitda > 40 || deltaZScore >= 0.6 || (zScoreRecorrente < 1.8 && zScoreAjustado >= 1.8)) {
        grauDependenciaFiscal = 'CRÍTICA';
      } else if (percentualExtraordinarioSobreEbitda > 20 || deltaZScore >= 0.3) {
        grauDependenciaFiscal = 'ELEVADA';
      } else if (percentualExtraordinarioSobreEbitda > 8 || deltaZScore >= 0.15) {
        grauDependenciaFiscal = 'MODERADA';
      }
    }

    let diagnosticoOperacional = '';
    if (grauDependenciaFiscal === 'CRÍTICA') {
      diagnosticoOperacional = `Alerta de Fragilidade Operacional: A empresa apresenta Z-Score aparente de ${zScoreAjustado.toFixed(2)} impulsionado por R$ ${deltaEbitda.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} em créditos tributários extraordinários não repetíveis. A saúde operacional recorrente real situa-se em Z = ${zScoreRecorrente.toFixed(2)} (${classificacaoZScoreRecorrente}), evidenciando que a rentabilidade contábil esconde sangria operacional na rotina.`;
    } else if (grauDependenciaFiscal === 'ELEVADA') {
      diagnosticoOperacional = `Dependência Tributária Relevante: Os créditos tributários extraordinários explicam ${percentualExtraordinarioSobreEbitda.toFixed(1)}% do EBITDA Ajustado. A operação recorrente entrega margem de ${margemEbitdaRecorrente.toFixed(1)}%, exigindo reforço autônomo na gestão de custos e prazos.`;
    } else {
      diagnosticoOperacional = `Solvência Recorrente Equilibrada: A operação recorrente sustenta margem EBITDA de ${margemEbitdaRecorrente.toFixed(1)}% e Z-Score de ${zScoreRecorrente.toFixed(2)}, com os créditos tributários atuando como reserva de caixa de aceleração, sem mascarar a saúde do negócio.`;
    }

    const recomendacaoPropostaAos = `O dimensionamento da Proposta AOS deve basear-se no EBITDA Operacional Recorrente de R$ ${ebitdaRecorrente.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (Margem de ${margemEbitdaRecorrente.toFixed(1)}%), garantindo que a redução autônoma de sangrias operacionais e descasamento de prazos gere ROI estrutural e permanente, sem depender do esgotamento futuro dos indébitos fiscais.`;

    return {
      ebitdaRecorrente,
      margemEbitdaRecorrente,
      ebitdaAjustado,
      margemEbitdaAjustada,
      deltaEbitda,
      deltaMargemEbitda,
      lucroLiquidoRecorrente,
      margemLiquidaRecorrente,
      lucroLiquidoAjustado,
      margemLiquidaAjustada,
      deltaLucroLiquido,
      deltaMargemLiquida,
      totalAjustesExtraordinariosBruto,
      totalAjustesExtraordinariosLiquido,
      percentualExtraordinarioSobreReceita,
      percentualExtraordinarioSobreEbitda,
      zScoreRecorrente,
      zScoreAjustado,
      deltaZScore,
      classificacaoZScoreRecorrente,
      classificacaoZScoreAjustado,
      grauDependenciaFiscal,
      diagnosticoOperacional,
      recomendacaoPropostaAos
    };
  }
}
