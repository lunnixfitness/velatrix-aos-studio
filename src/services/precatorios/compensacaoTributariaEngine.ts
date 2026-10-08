import {
  CompensacaoSimulacaoInput,
  CompensacaoSimulacaoResult
} from '../../types/precatorios';
import { PrecatorioLogger } from './precatorioLogger';

export class CompensacaoTributariaEngine {
  private logger: PrecatorioLogger;

  constructor(correlationId?: string) {
    this.logger = new PrecatorioLogger('CompensacaoTributariaEngine', correlationId);
  }

  /**
   * Simulação de Compensação Tributária Federal sob as regras da Lei nº 14.973/2024 (Art. 5º a 8º)
   * Restrição vinculante: Limite de compensação de até 75% do débito consolidado por competência mensal.
   */
  public simularCompensacao(input: CompensacaoSimulacaoInput): CompensacaoSimulacaoResult {
    this.logger.info(`Simulando compensação federal para Cessionário ${input.cessionarioCnpj}`, {
      precatorioId: input.precatorioId,
      valorPrecatorio: input.valorAtualizadoPrecatorio,
      debitoMensal: input.debitoTributarioProjetadoMensal
    });

    const creditoDisponivel = input.valorAtualizadoPrecatorio * 1.0; // 100% valor de face
    const debitoMensal = Math.max(1, input.debitoTributarioProjetadoMensal);

    // Lei 14.973/2024 Art. 5º: O contribuinte pode compensar até 75% do débito da competência
    const limite75Percentual = debitoMensal * 0.75;
    const abatimentoMensalPermitido = Math.min(creditoDisponivel, limite75Percentual);

    // Tempo estimado de esgotamento do crédito em meses
    const tempoEsgotamentoMeses = Math.max(1, Math.ceil(creditoDisponivel / limite75Percentual));

    // Cálculo do Valor Presente do Fluxo de Compensação (desconto mensal da SELIC média de 0.85% a.m.)
    const taxaDescontoMensal = 0.0085;
    let vplFluxoCompensacao = 0;
    let saldoCreditoRestante = creditoDisponivel;

    for (let mes = 1; mes <= tempoEsgotamentoMeses; mes++) {
      const parcela = Math.min(saldoCreditoRestante, limite75Percentual);
      saldoCreditoRestante -= parcela;
      const fatorDesconto = 1 / Math.pow(1 + taxaDescontoMensal, mes);
      vplFluxoCompensacao += parcela * fatorDesconto;
      if (saldoCreditoRestante <= 0) break;
    }

    // Economia tributária gerada (considerando aquisição com deságio médio de mercado de ~30%)
    const custoAquisicaoEstimado = creditoDisponivel * 0.70;
    const economiaTributariaEfetiva = Math.max(0, creditoDisponivel - custoAquisicaoEstimado);

    // Atratividade: viável se esgotamento for inferior a 36 meses
    const atrativo = tempoEsgotamentoMeses <= 36 && creditoDisponivel > 0;

    const parecerLegal = [
      `OPERAÇÃO DE COMPENSAÇÃO TRIBUTÁRIA FEDERAL HOMOLOGADA.`,
      `Base Legal: Art. 100 § 11 da Constituição Federal c/c Art. 5º a 8º da Lei nº 14.973/2024 e Portaria Conjunta PGFN/RFB.`,
      `Limite de Compensação: Respeitado o teto de 75% do valor dos tributos federais devidos por competência mensal (R$ ${limite75Percentual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês).`,
      `Tempo de Amortização Projetado: ${tempoEsgotamentoMeses} competências mensais.`,
      `Habilitação Requerida: Homologação no juízo da execução e posterior peticionamento no Portal REGULARIZE / PER/DCOMP Web.`
    ].join(' ');

    return {
      creditoTributarioDisponivel: Number(creditoDisponivel.toFixed(2)),
      debitoTributarioProjetadoMensal: Number(debitoMensal.toFixed(2)),
      limite75PorCentoCompetencia: Number(limite75Percentual.toFixed(2)),
      abatimentoMensalPermitido: Number(abatimentoMensalPermitido.toFixed(2)),
      tempoEsgotamentoMeses,
      vplFluxoCompensacao: Number(vplFluxoCompensacao.toFixed(2)),
      economiaTributariaEfetiva: Number(economiaTributariaEfetiva.toFixed(2)),
      atrativo,
      parecerLegal
    };
  }

  /**
   * Simulação de consulta ao SERPRO / PGFN Regularize para débito tributário consolidado
   */
  public async consultarDebitosPGFN(cnpj: string): Promise<{
    cnpj: string;
    razaoSocial: string;
    debitoConsolidado: number;
    debitoCorrenteMensalEstimado: number;
    certidaoNegativaStatus: 'POSITIVA_COM_EFEITO_DE_NEGATIVA' | 'POSITIVA' | 'NEGATIVA';
    procuracaoEletronicaAtiva: boolean;
  }> {
    this.logger.info(`Consultando saldo devedor consolidado PGFN para CNPJ ${cnpj}`);

    return {
      cnpj,
      razaoSocial: 'EMPRESA INDUSTRIAL CESSIONÁRIA S/A',
      debitoConsolidado: 1850000.00,
      debitoCorrenteMensalEstimado: 65000.00,
      certidaoNegativaStatus: 'POSITIVA',
      procuracaoEletronicaAtiva: true
    };
  }
}

export const compensacaoTributariaEngine = new CompensacaoTributariaEngine();
