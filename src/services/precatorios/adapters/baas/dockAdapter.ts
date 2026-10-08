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
 * Adapter de Referência: DOCK BaaS
 * Infraestrutura de Banking as a Service da Dock para emissão de Pix e subcontas de pagamento.
 */
export class DockBaaSAdapter implements BaasProvider {
  readonly providerId = 'DOCK';
  readonly providerName = 'Dock Banking as a Service';

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
      saldoDisponivel: 2100000.00,
      saldoBloqueado: 0.00,
      moeda: 'BRL',
      consultadoEm: new Date().toISOString()
    };
  }

  async executarSplit(ordem: OrdemSplit): Promise<ComprovanteSplit> {

    assertSimulatedAllowed(this.providerName);
    const endToEndBase = `E26980590${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    const logsDestinatarios: LogDestinatarioSplit[] = ordem.destinatarios.map((d, idx) => ({
      chavePix: d.chavePix,
      endToEndId: `${endToEndBase}${secureInt(10000000, 99999999)}${idx}`,
      status: 'EFETIVADO',
      valor: d.valorNominal
    }));

    const autenticacaoBancaria = `DOCK-PIX-${secureId('', 4).toUpperCase()}-${Date.now()}`;
    const textoComprovante = [
      `================================================================================`,
      `           COMPROVANTE DE LIQUIDAÇÃO DE PRECATÓRIO — DOCK BAAS SPLIT            `,
      `                       INSTITUIÇÃO: DOCK INSTITUIÇÃO DE PAGAMENTO S.A.          `,
      `================================================================================`,
      `ORDEM ID: ${ordem.ordemId}`,
      `CESSÃO VINCULADA: ${ordem.cessaoId}`,
      `DATA/HORA DA LIQUIDAÇÃO: ${timestamp}`,
      `AUTENTICAÇÃO DOCK: ${autenticacaoBancaria}`,
      `VALOR TOTAL: R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      `TRANSFERÊNCIAS PIX DIRETAS:`,
      ...ordem.destinatarios.map((d, i) =>
        ` [${i + 1}] (${d.papel}) ${d.nome} - CPF/CNPJ: ${d.cpfCnpj}\n` +
        `     Pix: ${d.chavePix} | R$ ${d.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${d.percentual}%)\n` +
        `     ID BACEN: ${logsDestinatarios[i].endToEndId}`
      ),
      `================================================================================`,
      `Status: LIQUIDADO COM SUCESSO VIA DOCK OPEN FINANCIAL CORE`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(textoComprovante);
    const custodia = await registrarCustodiaArquivo(
      `comprovante_split_dock_${ordem.ordemId}.txt`,
      bytes.buffer as ArrayBuffer,
      'Dock BaaS Gateway'
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
