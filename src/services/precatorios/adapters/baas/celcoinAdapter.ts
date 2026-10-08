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
 * Adapter de Referência: CELCOIN BaaS
 * APIs de Split Pix Automático, Contas Escrow e Liquidação Instantânea.
 */
export class CelcoinBaaSAdapter implements BaasProvider {
  readonly providerId = 'CELCOIN';
  readonly providerName = 'Celcoin Banking as a Service';

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
      saldoDisponivel: 1450000.00,
      saldoBloqueado: 0.00,
      moeda: 'BRL',
      consultadoEm: new Date().toISOString()
    };
  }

  async executarSplit(ordem: OrdemSplit): Promise<ComprovanteSplit> {

    assertSimulatedAllowed(this.providerName);
    const endToEndBase = `E13935893${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    const logsDestinatarios: LogDestinatarioSplit[] = ordem.destinatarios.map((d, idx) => ({
      chavePix: d.chavePix,
      endToEndId: `${endToEndBase}${secureInt(10000000, 99999999)}${idx}`,
      status: 'EFETIVADO',
      valor: d.valorNominal
    }));

    const autenticacaoBancaria = `CELCOIN-AUTH-${secureId('', 4).toUpperCase()}-${Date.now()}`;
    const textoComprovante = [
      `================================================================================`,
      `           COMPROVANTE DE LIQUIDAÇÃO DE PRECATÓRIO — SPLIT PIX BAAS             `,
      `                       INSTITUIÇÃO: CELCOIN PARTICIPAÇÕES S.A.                  `,
      `================================================================================`,
      `ORDEM ID: ${ordem.ordemId}`,
      `CESSÃO VINCULADA: ${ordem.cessaoId}`,
      `DATA/HORA DA LIQUIDAÇÃO: ${timestamp}`,
      `AUTENTICAÇÃO BANCÁRIA: ${autenticacaoBancaria}`,
      `VALOR TOTAL DISPARADO: R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      `DESTINATÁRIOS EFETIVADOS:`,
      ...ordem.destinatarios.map((d, i) =>
        ` [${i + 1}] (${d.papel}) ${d.nome} - Doc: ${d.cpfCnpj}\n` +
        `     Chave Pix: ${d.chavePix} | Valor: R$ ${d.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${d.percentual}%)\n` +
        `     EndToEnd: ${logsDestinatarios[i].endToEndId}`
      ),
      `================================================================================`,
      `Status: LIQUIDADO NA CONTA ESCROW VIA MOTOR CELCOIN PIX DIRECT`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(textoComprovante);
    const custodia = await registrarCustodiaArquivo(
      `comprovante_split_celcoin_${ordem.ordemId}.txt`,
      bytes.buffer as ArrayBuffer,
      'Celcoin BaaS API Gateway'
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
