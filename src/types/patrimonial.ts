export type PatrimonialRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'D';
export type PatrimonialRiskLevel = 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';

export interface PatrimonialBalanceSheetInput {
  // Ativo Circulante
  disponibilidades: number; // Caixa e equivalentes
  contasAReceber: number; // Clientes / duplicatas a receber
  estoques: number; // Estoque de matérias-primas e produtos
  outrosAtivosCirculantes: number;

  // Ativo Não Circulante
  realizavelLongoPrazo: number; // Depósitos judiciais, créditos LP
  imobilizadoBruto: number; // Máquinas, frotas, galpões
  depreciacaoAcumulada: number; // (-) Depreciação acumulada
  intangivel: number; // Softwares, patentes, marcas

  // Passivo Circulante (Curto Prazo)
  fornecedores: number;
  emprestimosCurtoPrazo: number; // Financiamentos bancários < 12 meses
  obrigacoesFiscaisTrabalhistasCP: number; // Tributos e folha CP
  outrosPassivosCirculantes: number;

  // Passivo Não Circulante (Longo Prazo)
  emprestimosLongoPrazo: number; // Financiamentos bancários > 12 meses
  debenturesFinanciamentosLP: number;
  parcelamentosFiscaisLP: number; // Refis / Transação Tributária
  provisoesContingenciasLP: number; // Provisões contábeis constituídas

  // Patrimônio Líquido
  capitalSocial: number;
  reservasLucros: number;
  lucrosPrejuizosAcumulados: number;

  // DRE & Dados Operacionais Complementares (Compatibilidade Retroativa & Detalhada)
  receitaBrutaAnual: number;
  receitaLiquidaAnual: number;
  ebitdaAnual: number;
  ebitAnual: number;
  lucroLiquidoAnual: number;
  despesasFinanceirasAnuais: number;
  aliquotaImpostoEfetiva?: number; // default 0.34
  dreCascataDetalhada?: DetailedDreWaterfallInput;

  // Contingências Fora de Balanço / Relatório Jurídico
  contingenciasTrabalhistasProvaveis: number;
  contingenciasFiscaisProvaveis: number;
  contingenciasCiveisProvaveis: number;
  contingenciasPossiveisTotal: number; // Risco possível (off-balance)

  // Gravames e Garantias
  imobilizadoGravadoGarantia: number; // Alienação fiduciária / penhoras
}

export interface SolvencyLiquidityRatios {
  liquidezCorrente: number; // AC / PC
  liquidezSeca: number; // (AC - Estoques) / PC
  liquidezGeral: number; // (AC + RLP) / (PC + PNC)
  capitalGiroLiquido: number; // AC - PC
  necessidadeCapitalGiro: number; // NCG Operacional
}

export interface CapitalStructureRatios {
  endividamentoGeral: number; // (PC + PNC) / Ativo Total (0 a 1+)
  composicaoEndividamentoCP: number; // PC / (PC + PNC) [% curto prazo]
  passivoOnerosoTotal: number; // Dívida Bancária CP + LP
  dividaLiquida: number; // Passivo Oneroso - Caixa
  dividaLiquidaSobreEbitda: number; // Dívida Líquida / EBITDA
  coberturaJurosICJ: number; // EBIT / Despesas Financeiras
  alavancagemPatrimonial: number; // Ativo Total / Patrimônio Líquido
}

export interface ReturnProfitabilityRatios {
  roe: number; // Return on Equity (%) -> Lucro Líquido / PL
  roic: number; // Return on Invested Capital (%) -> NOPAT / Capital Investido
  roa: number; // Return on Assets (%) -> Lucro Líquido / Ativo Total
  margemLiquida: number; // Lucro Líquido / Receita Líquida (%)
  margemEbitda: number; // EBITDA / Receita Líquida (%)
}

export interface AssetAllocationRatios {
  ativoTotal: number;
  passivoTotal: number;
  patrimonioLiquidoContabil: number;
  patrimonioLiquidoAjustadoNAV: number; // PL Ajustado deduzido intangíveis e contingências possíveis
  indiceImobilizacaoPL: number; // Imobilizado Líquido / PL
  indiceAtivosGravados: number; // Imobilizado com Gravame / Imobilizado Líquido
  exposicaoContingenciasSobrePL: number; // Total Contingências / PL
  totalContingenciasMapeadas: number;
}

export interface PatrimonialAlert {
  id: string;
  category: 'SOLVENCIA' | 'ESTRUTURA_CAPITAL' | 'GARANTIAS' | 'CONTINGENCIAS' | 'RENTABILIDADE';
  severity: 'CRÍTICO' | 'ALERTA' | 'MODERADO' | 'NOMINAL';
  title: string;
  metric: string;
  currentValue: string;
  benchmark: string;
  riskDescription: string;
  aosRemediation: string;
}

export interface PatrimonialAnalysisResult {
  rating: PatrimonialRating;
  ratingScore: number; // 0 - 100
  riskLevel: PatrimonialRiskLevel;
  solvency: SolvencyLiquidityRatios;
  capitalStructure: CapitalStructureRatios;
  profitability: ReturnProfitabilityRatios;
  assetAllocation: AssetAllocationRatios;
  alerts: PatrimonialAlert[];
  executiveSummary: string;
  aosDirectives: string[];
}

/**
 * Requisitos de Conformidade Legal para Lançamentos Não Recorrentes / Extraordinários
 */
export interface NonRecurringLegalCompliance {
  numeroProcessoOuPerDcomp: string;
  hasTransitoEmJulgadoOuHomologacao: boolean;
  orgaoJulgadorOuFiscal?: string; // ex: TRF-3, RFB, STJ, STF
  dataHomologacao?: string;
  observacaoConformidade?: string;
}

/**
 * Checklist de Elegibilidade Documentada para Equiparação Hospitalar (IRPJ/CSLL)
 * REGRA CRÍTICA: Não pode ser aplicado automaticamente; exige comprovação rigorosa.
 */
export interface HospitalEquiparationCompliance {
  habilitadoManualmente: boolean;
  registroAnvisaAtivo: boolean;
  estruturaInternacaoCirurgicaComprovada: boolean;
  sociedadeEmpresariaComprovada: boolean;
  custosHospitalaresIndividualizados: boolean;
  termoResponsabilidadeAceito: boolean;
  aliquotaIrpjPresumidaReduzida: number; // 8% de presunção (vs 32% padrão serviços)
  aliquotaCsllPresumidaReduzida: number; // 12% de presunção (vs 32% padrão serviços)
}

/**
 * Estrutura da Nova DRE em Cascata (Waterfall) com Sub-itens
 */
export interface DetailedDreWaterfallInput {
  // (+) RECEITA BRUTA DE VENDAS E SERVIÇOS [100% AV]
  vendasTributadasServicos: number;
  vendasMonofasicasSt: number;

  // (-) DEDUÇÕES E IMPOSTOS SOBRE VENDAS
  impostosDeclarados: number; // Simples / PIS / COFINS / ISS
  estornoPisCofinsIcmsStIndevidos: number; // NÃO RECORRENTE / EXTRAORDINÁRIO
  complianceEstornoPisCofins: NonRecurringLegalCompliance;

  // (-) TOTAL DE CUSTOS (CPV/CMV)
  custosCpvCmv: number;

  // (-) DESPESAS OPERACIONAIS (SG&A)
  despesasAdministrativasPessoal: number;
  ajusteEsocialInssPatronalRevertido: number; // NÃO RECORRENTE / EXTRAORDINÁRIO
  complianceInssPatronal: NonRecurringLegalCompliance;
  assinaturaSaasErp: number;

  // (-) Depreciação & Amortização
  depreciacaoAmortizacao: number;

  // (-) Despesas Financeiras
  despesasFinanceiras: number;
  receitasFinanceirasOrdinarias?: number;

  // (+) Atualização SELIC: Rendimento Monetário sobre Indébitos Recuperados [NÃO RECORRENTE / EXTRAORDINÁRIO]
  atualizacaoSelicIndebitosRecuperados: number;
  complianceAtualizacaoSelic: NonRecurringLegalCompliance;

  // (-) Impostos sobre o Lucro (IRPJ/CSLL)
  aliquotaIrpjCsllEfetiva: number; // ex: 0.34
  complianceHospitalar: HospitalEquiparationCompliance;
}

/**
 * Resultados Calculados da DRE em Cascata (Recorrente vs. Ajustado)
 */
export interface DetailedDreCalculatedResults {
  // Receita Bruta
  receitaBrutaTotal: number;
  avReceitaBruta: number; // Sempre 100%

  // Deduções
  deducoesRecorrentes: number;
  avDeducoesRecorrentes: number;
  estornoExtraordinarioDeducoes: number; // Isolado
  isEstornoValido: boolean;

  // Receita Líquida
  receitaLiquidaRecorrente: number;
  avReceitaLiquidaRecorrente: number;
  receitaLiquidaAjustada: number;
  avReceitaLiquidaAjustada: number;

  // Custos & Lucro Bruto
  custosCpvCmv: number;
  avCustosCpvCmv: number;
  lucroBrutoRecorrente: number;
  margemBrutaRecorrente: number;
  lucroBrutoAjustado: number;
  margemBrutaAjustada: number;

  // SG&A
  sgaRecorrenteTotal: number;
  avSgaRecorrente: number;
  reversaoExtraordinariaInss: number; // Isolado
  isInssValido: boolean;
  sgaAjustadoTotal: number;

  // EBITDA
  ebitdaRecorrente: number;
  margemEbitdaRecorrente: number;
  ebitdaAjustado: number;
  margemEbitdaAjustada: number;

  // EBIT
  depreciacaoAmortizacao: number;
  ebitRecorrente: number;
  ebitAjustado: number;

  // Resultado Financeiro & SELIC
  despesasFinanceiras: number;
  receitasFinanceiras: number;
  resultadoFinanceiroRecorrente: number;
  atualizacaoSelicExtraordinaria: number; // Isolado
  isSelicValida: boolean;

  // EBT (LAIR)
  ebtRecorrente: number;
  ebtAjustado: number;

  // Impostos IRPJ/CSLL
  impostosLucroRecorrente: number;
  impostosLucroAjustado: number;
  isEquiparacaoHospitalarAtiva: boolean;
  aliquotaEfetivaAplicada: number;

  // Resultado Líquido
  resultadoLiquidoRecorrente: number;
  margemLiquidaRecorrente: number;
  resultadoLiquidoAjustado: number;
  margemLiquidaAjustada: number;

  // NOPAT
  nopatRecorrente: number;
  nopatAjustado: number;

  // Subtotal Consolidado: Ajustes Tributários Extraordinários
  subtotalAjustesTributariosExtraordinarios: {
    estornoPisCofinsIcmsSt: number;
    reversaoInssPatronal: number;
    atualizacaoSelic: number;
    impactoTotalBruto: number;
    impactoTotalLiquidoAposIr: number;
    itensHomologadosCount: number;
    itensPendentesCount: number;
  };
}
