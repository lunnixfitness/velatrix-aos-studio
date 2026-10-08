import {
  BaasProvider,
  OrdemSplit,
  ComprovanteSplit,
  Saldo,
  LogDestinatarioSplit
} from '../types';
import { registrarCustodiaArquivo } from '../../../../shared/upload/sha256Store';
import { secureId, secureInt } from '../../../../lib/demoMode';
import { assertSimulatedAllowed, SIMULATED_PREFIX } from '../../../../lib/demoMode';

/**
 * Adapter de Referência: BANCO BS2 EMPRESAS
 * API Pix Corporate de instituição financeira bancária tradicional (ISPB 35870237).
 */
export class BS2BaaSAdapter implements BaasProvider {
  readonly providerId = 'BS2';
  readonly providerName = 'Banco BS2 Empresas';

  private clientId?: string;
  private clientSecret?: string;

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async consultarSaldo(conta: string): Promise<Saldo> {

    assertSimulatedAllowed(this.providerName);
    return {
      provider: this.providerName,
      simulado: true,
      conta,
      saldoDisponivel: 4500000.00,
      saldoBloqueado: 0.00,
      moeda: 'BRL',
      consultadoEm: new Date().toISOString()
    };
  }

  async executarSplit(ordem: OrdemSplit): Promise<ComprovanteSplit> {

    assertSimulatedAllowed(this.providerName);
    const endToEndBase = `E35870237${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    const logsDestinatarios: LogDestinatarioSplit[] = ordem.destinatarios.map((d, idx) => ({
      chavePix: d.chavePix,
      endToEndId: `${endToEndBase}${secureInt(10000000, 99999999)}${idx}`,
      status: 'EFETIVADO',
      valor: d.valorNominal
    }));

    const autenticacaoBancaria = `BS2-BACEN-${secureId('', 4).toUpperCase()}-${Date.now()}`;
    const textoComprovante = [
      `================================================================================`,
      `           COMPROVANTE DE LIQUIDAÇÃO DE PRECATÓRIO — BANCO BS2 S.A.             `,
      `                       CÓDIGO DE COMPENSAÇÃO: 218 | ISPB: 35870237              `,
      `================================================================================`,
      `ORDEM ID: ${ordem.ordemId}`,
      `CESSÃO VINCULADA: ${ordem.cessaoId}`,
      `DATA/HORA DA LIQUIDAÇÃO: ${timestamp}`,
      `AUTENTICAÇÃO BACEN: ${autenticacaoBancaria}`,
      `VALOR TOTAL DA OPERAÇÃO: R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      `TRANSFERÊNCIAS PIX PJ LIQUIDADAS:`,
      ...ordem.destinatarios.map((d, i) =>
        ` [${i + 1}] (${d.papel}) ${d.nome} - CNPJ/CPF: ${d.cpfCnpj}\n` +
        `     Chave: ${d.chavePix} | R$ ${d.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${d.percentual}%)\n` +
        `     End-to-End: ${logsDestinatarios[i].endToEndId}`
      ),
      `================================================================================`,
      `Status: LIQUIDADO PELO SISTEMA DE PAGAMENTOS INSTANTÂNEOS (SPI/BACEN)`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(textoComprovante);
    const custodia = await registrarCustodiaArquivo(
      `comprovante_split_bs2_${ordem.ordemId}.txt`,
      bytes.buffer as ArrayBuffer,
      'Banco BS2 API Corporate Gateway'
    );

    return {
      ordemId: ordem.ordemId,
      provider: this.providerName,
      simulado: true,
      status: 'LIQUIDADO',
      endToEndIdPix: logsDestinatarios[0]?.endToEndId || `E00000000${Date.now()}`,
      dataLiquidacao: timestamp,
      autenticacaoBancaria,
      comprovanteSha256: custodia.sha256,
      comprovanteUrlOuTexto: textoComprovante,
      logsDestinatarios
    };
  }
}
