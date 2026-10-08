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
 * Adapter de Referência: SWAP Tech BaaS
 * Plataforma corporativa de Banking-as-a-Service com foco em fundos e estruturas fiduciárias.
 */
export class SwapBaaSAdapter implements BaasProvider {
  readonly providerId = 'SWAP';
  readonly providerName = 'Swap Financial Technologies';

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
      saldoDisponivel: 3200000.00,
      saldoBloqueado: 0.00,
      moeda: 'BRL',
      consultadoEm: new Date().toISOString()
    };
  }

  async executarSplit(ordem: OrdemSplit): Promise<ComprovanteSplit> {

    assertSimulatedAllowed(this.providerName);
    const endToEndBase = `E38217983${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const timestamp = new Date().toISOString();

    const logsDestinatarios: LogDestinatarioSplit[] = ordem.destinatarios.map((d, idx) => ({
      chavePix: d.chavePix,
      endToEndId: `${endToEndBase}${secureInt(10000000, 99999999)}${idx}`,
      status: 'EFETIVADO',
      valor: d.valorNominal
    }));

    const autenticacaoBancaria = `SWAP-TX-${secureId('', 4).toUpperCase()}-${Date.now()}`;
    const textoComprovante = [
      `================================================================================`,
      `           COMPROVANTE DE LIQUIDAÇÃO DE PRECATÓRIO — SWAP SPLIT                 `,
      `                       INSTITUIÇÃO: SWAP TECH MEIOS DE PAGAMENTO                `,
      `================================================================================`,
      `ORDEM ID: ${ordem.ordemId}`,
      `CESSÃO VINCULADA: ${ordem.cessaoId}`,
      `DATA/HORA DA LIQUIDAÇÃO: ${timestamp}`,
      `AUTENTICAÇÃO SWAP: ${autenticacaoBancaria}`,
      `VALOR TOTAL: R$ ${ordem.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      ``,
      `SPLIT FIDUCIÁRIO:`,
      ...ordem.destinatarios.map((d, i) =>
        ` [${i + 1}] (${d.papel}) ${d.nome} - Doc: ${d.cpfCnpj}\n` +
        `     Pix: ${d.chavePix} | R$ ${d.valorNominal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${d.percentual}%)\n` +
        `     EndToEnd: ${logsDestinatarios[i].endToEndId}`
      ),
      `================================================================================`,
      `Status: LIQUIDAÇÃO INSTANTÂNEA CONCLUÍDA VIA SWAP LEDGER`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(textoComprovante);
    const custodia = await registrarCustodiaArquivo(
      `comprovante_split_swap_${ordem.ordemId}.txt`,
      bytes.buffer as ArrayBuffer,
      'Swap Tech BaaS Infrastructure'
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
