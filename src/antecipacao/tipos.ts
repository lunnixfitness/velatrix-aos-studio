/**
 * VELATRIX AOS · Antecipação de Créditos Judiciais (Precatórios & RPVs) — tipos de domínio
 *
 * Modelo: o advogado cadastra o crédito do cliente (e/ou seus honorários destacados), a Velatrix
 * faz triagem + precificação e compradores parceiros (FIDCs/securitizadoras) fazem ofertas.
 * A Velatrix NÃO compra crédito nem custodia dinheiro: origina, analisa e formaliza.
 *
 * REGRA ABSOLUTA: dinheiro em CENTAVOS (inteiro); taxas e percentuais em BASIS POINTS (inteiro,
 * 100 bps = 1%). Float só em intermediários de desconto (pow), sempre arredondado no fim.
 */

export type TipoCredito = 'PRECATORIO' | 'RPV';
export type Esfera = 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
export type Natureza = 'ALIMENTAR' | 'COMUM';
export type Flag = 'GREEN' | 'YELLOW' | 'RED' | 'NAO_AVALIADO';
export type Severidade = 'INFO' | 'YELLOW' | 'RED';

/** Quem é o cedente de cada parcela: o cliente (credor) ou o próprio advogado (honorários). */
export type ParcelaId = 'CREDOR' | 'HONORARIOS_CONTRATUAIS' | 'HONORARIOS_SUCUMBENCIAIS';

export interface Credor {
  nome: string;
  /** CPF (11) ou CNPJ (14), só dígitos. */
  documento: string;
  /** Para preferência constitucional (CF art. 100 §2º). */
  dataNascimento?: string;
  doencaGrave?: boolean;
  deficiencia?: boolean;
}

export interface DeclaracoesAdvogado {
  penhoraConhecida: boolean;
  herdeirosPendentes: boolean;
  acaoRescisoria: boolean;
  impugnacaoCalculosPendente: boolean;
}

export interface CreditoJudicial {
  id: string;
  tenantId: string;
  advogadoId: string;
  tipo: TipoCredito;
  /** Numeração única CNJ (Res. 65/2008), com ou sem máscara. */
  numeroProcesso: string;
  tribunal: string;
  esfera: Esfera;
  enteDevedor: string;
  ufEnte?: string;
  natureza: Natureza;
  credor: Credor;
  /** Valor requisitado (face) na data-base, incluindo honorários contratuais destacados. */
  valorFaceCentavos: number;
  dataBase: string;
  /** Apresentação do precatório ao tribunal / expedição da RPV. */
  dataRequisicao?: string;
  transitoEmJulgado: boolean;
  /** Honorários contratuais destacados no ofício (EAOAB art. 22 §4º), em bps do valor de face. */
  honorariosContratuaisBps: number;
  /** Requisição autônoma de sucumbência (titularidade do advogado). */
  honorariosSucumbenciaisCentavos: number;
  cessoesAnteriores: number;
  declaracoes: DeclaracoesAdvogado;
  parcelasParaAntecipar: ParcelaId[];
}

export type ResultadoCheck =
  | { status: 'OK'; evidencia: string }
  | { status: 'FALHA'; evidencia: string }
  | { status: 'NAO_VERIFICADO'; motivo: string };

export interface ItemTriagem {
  id: string;
  descricao: string;
  severidade: Severidade;
  baseLegal?: string;
  resultado: ResultadoCheck;
}

export interface Parcela {
  id: ParcelaId;
  cedente: 'CLIENTE' | 'ADVOGADO';
  valorCentavos: number;
}

export interface PrazoEstimado {
  /** Data-limite constitucional/legal de pagamento (quando aplicável). */
  dataLimiteLegal: string | null;
  /** Cenário central e conservador usados na precificação. */
  mesesCentral: number;
  mesesConservador: number;
  fundamento: string;
  emMora: boolean;
  regimeEspecial: boolean;
  preferencial: boolean;
}

export interface LinhaMemoria { passo: string; valor: string; fundamento?: string; }

export interface AnaliseCredito {
  versaoRegras: string;
  hoje: string;
  flag: Flag;
  triagem: ItemTriagem[];
  parcelas: Parcela[];
  prazo: PrazoEstimado;
  tetoRpvCentavos: number;
  memoria: LinhaMemoria[];
}

// ───────── marketplace ─────────

export interface PoliticaComprador {
  tipos: TipoCredito[];
  esferas: Esfera[];
  naturezas: Natureza[];
  /** Vazio = qualquer tribunal. */
  tribunais: string[];
  flagsAceitas: Flag[];
  aceitaRegimeEspecial: boolean;
  aceitaHonorarios: boolean;
  ticketMinCentavos: number;
  ticketMaxCentavos: number;
  /** Taxa de desconto anual-alvo do comprador (ex.: 2200 = 22% a.a.). */
  taxaAlvoAaBps: number;
  /** Prêmio adicional por flag. */
  premioRiscoBps: { GREEN: number; YELLOW: number; RED: number; NAO_AVALIADO: number };
  /** Deságio mínimo exigido pelo comprador. */
  desagioMinBps: number;
  validadeOfertaDias: number;
}

export interface Comprador {
  id: string;
  nome: string;
  tipoEntidade: 'FIDC' | 'SECURITIZADORA' | 'FUNDO' | 'OUTRO';
  cnpj: string;
  ativo: boolean;
  politica: PoliticaComprador;
  /** Fee de originação da Velatrix, pago PELO COMPRADOR (não reduz o valor do cedente). */
  taxaOriginacaoBps: number;
  demo?: boolean;
}

export interface OfertaParcela { parcelaId: ParcelaId; valorFaceCentavos: number; ofertaCentavos: number; }

export interface Oferta {
  id: string;
  compradorId: string;
  compradorNome: string;
  parcelas: OfertaParcela[];
  totalFaceCentavos: number;
  totalOfertaCentavos: number;
  desagioBps: number;
  taxaEfetivaAaBps: number;
  prazoMesesConsiderado: number;
  taxaOriginacaoCentavos: number;
  validaAte: string;
  demo?: boolean;
}

export interface CompradorExcluido { compradorId: string; compradorNome: string; motivos: string[]; }

export interface ResultadoOfertas {
  ofertas: Oferta[];
  excluidos: CompradorExcluido[];
  melhorOfertaId: string | null;
}

// ───────── ciclo de vida ─────────

export type StatusCredito =
  | 'ANALISADO'
  | 'BLOQUEADO'
  | 'OFERTA_ESCOLHIDA'
  | 'APROVADO_INTERNO'
  | 'ACEITO_CLIENTE'
  | 'FORMALIZACAO'
  | 'PAGO'
  | 'CANCELADO';

export type ItemFormalizacao = 'KYC_CEDENTE' | 'CONTRATO_CESSAO_ASSINADO' | 'COMUNICACAO_TRIBUNAL' | 'COMUNICACAO_ENTE_DEVEDOR' | 'HONORARIOS_PRESERVADOS';

export interface EventoCredito { em: string; por: string; tipo: string; detalhe?: string; hash?: string; }
