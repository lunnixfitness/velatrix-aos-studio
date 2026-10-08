import {
  PeticaoHabilitacaoDjen,
  ProtocoloDjenResult
} from '../adapters/types';
import { registrarCustodiaArquivo } from '../../../shared/upload/sha256Store';

export class DjenPeticionamentoService {
  private static instance: DjenPeticionamentoService;

  public static getInstance(): DjenPeticionamentoService {
    if (!DjenPeticionamentoService.instance) {
      DjenPeticionamentoService.instance = new DjenPeticionamentoService();
    }
    return DjenPeticionamentoService.instance;
  }

  /**
   * Gera a petição formal de comunicação e habilitação de cessão de crédito (Art. 100 § 14 CF/88 c/c Art. 778 § 1º III CPC)
   */
  public async gerarPeticaoHabilitacao(params: {
    precatorioId: string;
    numeroProcesso: string;
    tribunal: string;
    varaJuizo?: string;
    numeroOficio: string;
    cedenteNome: string;
    cedenteDocumento: string;
    cessionarioNome: string;
    cessionarioCnpj: string;
    valorCessao: number;
    escrituraNotarialHash?: string;
  }): Promise<PeticaoHabilitacaoDjen> {
    const agora = new Date().toISOString();
    const vara = params.varaJuizo || `Vara Federal de Execuções Fiscais e Precatórios do ${params.tribunal}`;

    const textoPeticao = [
      `EXCELENTÍSSIMO(A) SENHOR(A) DOUTOR(A) JUIZ(A) FEDERAL DA ${vara.toUpperCase()}`,
      ``,
      `Autos do Processo de Cumprimento de Sentença nº: ${params.numeroProcesso}`,
      `Ofício Requisitório Precatório nº: ${params.numeroOficio}`,
      ``,
      `${params.cessionarioNome.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${params.cessionarioCnpj}, por seus advogados constituídos, vem, respeitosamente, perante Vossa Excelência, expor e requerer o que segue:`,
      ``,
      `1. DA CESSÃO DE CRÉDITO REALIZADA (ART. 100, §§ 13 E 14 DA CONSTITUIÇÃO FEDERAL)`,
      `O titular originário do crédito, ${params.cedenteNome} (inscrito no CPF/CNPJ sob o nº ${params.cedenteDocumento}), celebrou instrumento público de cessão total/parcial de seus direitos creditórios decorrentes do precatório em epígrafe em favor do peticionante.`,
      ``,
      `2. DO CUMPRIMENTO DOS REQUISITOS NORMATIVOS (RESOLUÇÃO CNJ Nº 303/2019)`,
      `A cessão foi formalizada por Escritura Pública Notarial (ou instrumento equivalente com assinatura qualificada ICP-Brasil), devidamente averbada na cadeia de custódia criptográfica sob o hash SHA-256: ${params.escrituraNotarialHash || 'PENDENTE_AVERBACAO'}.`,
      `O valor objeto da presente cessão totaliza R$ ${params.valorCessao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      ``,
      `3. DOS PEDIDOS`,
      `Diante do exposto, com fulcro no Art. 100, § 14 da Constituição Federal c/c Art. 778, § 1º, inciso III do Código de Processo Civil, requer-se:`,
      `a) A juntada do presente instrumento e a devida publicação no DJEN (Diário de Justiça Eletrônico Nacional) para ciência da Fazenda Pública devedora;`,
      `b) A anotação da sub-rogação do cessionário na titularidade do precatório no sistema de precatórios deste Egrégio Tribunal;`,
      `c) Que qualquer ordem de pagamento ou levantamento futuro seja expedida diretamente em nome do cessionário e de sua conta fiduciária indicada.`,
      ``,
      `Termos em que,`,
      `Pede Deferimento.`,
      ``,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `ADVOGADO CONSTITUÍDO — OAB REGULAR`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(textoPeticao);
    const custodia = await registrarCustodiaArquivo(
      `peticao_habilitacao_${params.precatorioId}.txt`,
      bytes.buffer as ArrayBuffer,
      'Velatrix DJEN Peticionamento Automático'
    );

    return {
      precatorioId: params.precatorioId,
      numeroProcesso: params.numeroProcesso,
      tribunal: params.tribunal,
      varaJuizo: vara,
      cedenteNome: params.cedenteNome,
      cedenteDocumento: params.cedenteDocumento,
      cessionarioNome: params.cessionarioNome,
      cessionarioCnpj: params.cessionarioCnpj,
      valorCessao: params.valorCessao,
      fundamentoLegal: 'Art. 100, § 14, CF/88 c/c Art. 778, § 1º, III do CPC e Resolução CNJ 303/2019',
      textoPeticaoCompleto: textoPeticao,
      sha256Minuta: custodia.sha256,
      geradoEm: agora
    };
  }

  /**
   * Registra o protocolo manual realizado pelo advogado no PJe/DJEN
   */
  public async registrarProtocoloManual(params: {
    precatorioId: string;
    numeroProcesso: string;
    numeroProtocoloJudicial: string;
    advogadoResponsavel: string;
    oabAdvogado: string;
    reciboTextoOuHash?: string;
  }): Promise<ProtocoloDjenResult> {
    const agora = new Date().toISOString();
    const protocoloId = `PROT-DJEN-${Date.now().toString(36).toUpperCase()}`;

    const reciboConteudo = [
      `CERTIDÃO DE PROTOCOLO MANUAL PJE/DJEN`,
      `ID REGISTRO: ${protocoloId}`,
      `PROCESSO: ${params.numeroProcesso}`,
      `NÚMERO DO PROTOCOLO ELETRÔNICO: ${params.numeroProtocoloJudicial}`,
      `ADVOGADO: ${params.advogadoResponsavel} (OAB: ${params.oabAdvogado})`,
      `DATA/HORA: ${agora}`,
      `STATUS: JUNTADA REALIZADA COM SUCESSO NO SISTEMA DO TRIBUNAL`
    ].join('\n');

    const encoder = new TextEncoder();
    const bytes = encoder.encode(reciboConteudo);
    const custodia = await registrarCustodiaArquivo(
      `recibo_djen_${protocoloId}.txt`,
      bytes.buffer as ArrayBuffer,
      'DJEN Protocolo Auditoria'
    );

    return {
      protocoloId,
      precatorioId: params.precatorioId,
      numeroProtocoloJudicial: params.numeroProtocoloJudicial,
      numeroProcesso: params.numeroProcesso,
      advogadoResponsavel: params.advogadoResponsavel,
      oabAdvogado: params.oabAdvogado,
      dataProtocolo: agora,
      comprovanteReciboHash: custodia.sha256,
      status: 'PROTOCOLO_REALIZADO'
    };
  }
}

export const djenPeticionamentoService = DjenPeticionamentoService.getInstance();
