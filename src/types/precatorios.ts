import { z } from 'zod';

// ============================================================================
// KIND BIFURCATION (DISCRIMINATED UNION)
// ============================================================================

export type PrecatorioKind =
  | 'originacao_para_cessao'    // fluxo tradicional de originação para venda/cessão com deságio
  | 'compensacao_tributaria'    // cessionário quer usar como crédito para abater débitos federais (Lei 14.973/2024)
  | 'compra_para_carteira'      // fundo ou instituição financeira adquire para carregar até a liquidação
  | 'marketplace_p2p';          // oferta direta em ambiente de leilão/investidores parceiros

export const PRECATORIO_KIND_LABELS: Record<PrecatorioKind, string> = {
  originacao_para_cessao: 'Originação para Cessão Imediata (Deságio)',
  compensacao_tributaria: 'Compensação Tributária Federal (Lei 14.973/24)',
  compra_para_carteira: 'Aquisição para Carteira Institucional (Hold)',
  marketplace_p2p: 'Marketplace P2P & Balcão de Investidores'
};

export const PRECATORIO_KIND_DESCRIPTIONS: Record<PrecatorioKind, string> = {
  originacao_para_cessao: 'Triagem, due diligence, precificação de mercado e assinatura de escritura pública para cessão de crédito.',
  compensacao_tributaria: 'Estruturação de compensação contra dívida ativa federal com limite legal de 75% por competência mensal.',
  compra_para_carteira: 'Auditoria de estabilidade jurídica, fila orçamentária LOA e análise de risco para fundos e family offices.',
  marketplace_p2p: 'Distribuição direta do precatório entre múltiplos investidores credenciados com split automático via BaaS.'
};

// ============================================================================
// ENGINE 1 — DUE DILIGENCE & AUDITORIA DE RISCO
// ============================================================================

export interface PenhoraAtiva {
  id: string;
  origem: string;              // ex: "BacenJud / SisbaJud / TRF3 0001234-56..."
  dataRegistro: string;
  valorPenhora: number;
  orgaoDeterminante: string;
  status: 'VIGENTE' | 'LEVANTADA';
}

export interface CessaoHistorica {
  id: string;
  cartorio: string;
  numeroEscritura: string;
  dataLavratura: string;
  cedenteAnterior: string;
  cessionarioAnterior: string;
  percentual: number;
  registradoCNJ: boolean;
}

export interface Habilitacao {
  id: string;
  tipo: 'HERDEIRO' | 'SUCESSOR' | 'CESSIONARIO';
  nome: string;
  cpfCnpj: string;
  inventarioProcesso?: string;
  statusHabilitacao: 'HABILITADO' | 'PENDENTE_INVENTARIO' | 'IMPUGNADO';
}

export interface Execucao {
  id: string;
  numeroProcesso: string;
  tribunal: string;
  exequente: string;
  valorExecutado: number;
  proporcaoSobrePrecatorio: number; // percentual (ex: 0.60 para 60%)
}

export interface FonteConsultada {
  tribunalOuOrgao: string;
  endpoint: string;
  consultadoEm: string;
  hashResposta: string;
  status: 'SUCESSO' | 'INDISPONIVEL' | 'CIRCUIT_BREAKER_ABERTO';
}

export interface DueDiligenceResult {
  autentico: boolean;
  oficioRequisitorioHash: string;
  penhoras: PenhoraAtiva[];
  cessoesAnteriores: CessaoHistorica[];
  herdeirosHabilitados: Habilitacao[];
  execucoesContraCedente: Execucao[];
  litispendencia: boolean;
  coisaJulgadaRescisoria: boolean;
  fontesConsultadas: FonteConsultada[];
  scoreSegurancaJuridica: number;
  bloqueioAutomatico: boolean;
  motivoBloqueio?: string;
}

// Zod Schema Boundary
export const DueDiligenceResultSchema = z.object({
  autentico: z.boolean(),
  oficioRequisitorioHash: z.string(),
  penhoras: z.array(z.object({
    id: z.string(),
    origem: z.string(),
    dataRegistro: z.string(),
    valorPenhora: z.number(),
    orgaoDeterminante: z.string(),
    status: z.enum(['VIGENTE', 'LEVANTADA'])
  })),
  cessoesAnteriores: z.array(z.object({
    id: z.string(),
    cartorio: z.string(),
    numeroEscritura: z.string(),
    dataLavratura: z.string(),
    cedenteAnterior: z.string(),
    cessionarioAnterior: z.string(),
    percentual: z.number(),
    registradoCNJ: z.boolean()
  })),
  herdeirosHabilitados: z.array(z.object({
    id: z.string(),
    tipo: z.enum(['HERDEIRO', 'SUCESSOR', 'CESSIONARIO']),
    nome: z.string(),
    cpfCnpj: z.string(),
    inventarioProcesso: z.string().optional(),
    statusHabilitacao: z.enum(['HABILITADO', 'PENDENTE_INVENTARIO', 'IMPUGNADO'])
  })),
  execucoesContraCedente: z.array(z.object({
    id: z.string(),
    numeroProcesso: z.string(),
    tribunal: z.string(),
    exequente: z.string(),
    valorExecutado: z.number(),
    proporcaoSobrePrecatorio: z.number()
  })),
  litispendencia: z.boolean(),
  coisaJulgadaRescisoria: z.boolean(),
  fontesConsultadas: z.array(z.object({
    tribunalOuOrgao: z.string(),
    endpoint: z.string(),
    consultadoEm: z.string(),
    hashResposta: z.string(),
    status: z.enum(['SUCESSO', 'INDISPONIVEL', 'CIRCUIT_BREAKER_ABERTO'])
  })),
  scoreSegurancaJuridica: z.number().min(0).max(100),
  bloqueioAutomatico: z.boolean(),
  motivoBloqueio: z.string().optional()
});

// ============================================================================
// ENGINE 1b — SCORE DE SEGURANÇA JURÍDICA (0-100)
// ============================================================================

export interface ScoreComposition {
  scoreTotal: number;
  bloqueadoAutomatico: boolean;
  motivoBloqueio?: string;
  pesos: {
    enteDevedor: { peso: number; pontuacao: number; ponderado: number; detalhe: string };
    estabilidadeProcessual: { peso: number; pontuacao: number; ponderado: number; detalhe: string };
    historicoPagamento: { peso: number; pontuacao: number; ponderado: number; detalhe: string };
    naturezaCredito: { peso: number; pontuacao: number; ponderado: number; detalhe: string };
    cadeiaCessoes: { peso: number; pontuacao: number; ponderado: number; detalhe: string };
  };
  classificacao: 'TRIPLE_A' | 'DOUBLE_A' | 'RISCO_MODERADO' | 'ALTO_RISCO' | 'BLOQUEADO';
}

// ============================================================================
// ENGINE 2 — ORIGINAÇÃO & TRIAGEM
// ============================================================================

export interface OriginacaoFiltros {
  enteDevedor?: 'federal' | 'estadual' | 'municipal';
  entesUF?: string[];
  natureza?: 'alimentar' | 'comum' | 'ambas';
  tribunalOrigem?: string[];
  anoInscricaoLOA?: { min?: number; max?: number };
  faixaValor?: { min?: number; max?: number };
  scoreMinimo?: number;
  apenasSemCessao?: boolean;
}

export interface PrecatorioOriginado {
  id: string;
  numeroOficio: string;
  numeroProcesso: string;
  tribunal: string;
  enteDevedor: string;
  ufEnte?: string;
  natureza: 'ALIMENTAR' | 'COMUM';
  esfera: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL';
  anoLOA: number;
  valorOriginal: number;
  valorEstimadoAtual: number;
  dataExpedicao: string;
  score: number;
  fonteCaptura: 'FILA_TRIBUNAL' | 'VELATRIX_INBOX' | 'MARKETPLACE';
  cedenteMascarado: string;
  cedenteDocumento: string;
}

// ============================================================================
// ENGINE 3 — DESÁGIO, VPL & PROPOSTA
// ============================================================================

export interface SegmentoAtualizacao {
  periodoRotulo: string;
  dataInicio: string;
  dataFim: string;
  indiceAplicado: string;
  baseLegal: string;
  fatorAcumulado: number;
  valorInicialSegmento: number;
  valorFinalSegmento: number;
}

export interface MemoriaAtualizacaoSegmentada {
  valorOriginal: number;
  dataBase: string;
  dataLiquidacao: string;
  segmentos: SegmentoAtualizacao[];
  valorTotalAtualizado: number;
  fatorMultiplicadorTotal: number;
  resumoRegulatorio: string;
}

export interface PropostaCessaoTerm {
  propostaId: string;
  precatorioId: string;
  numeroOficio: string;
  credorNome: string;
  credorCpfCnpj: string;
  valorFaceAtualizado: number;
  desagioPercentual: number;        // ex: 35.00 (%)
  valorLiquidoCredor: number;       // valor que o credor recebe na conta
  expectativaMeses: number;
  taxaDescontoAplicadaAa: number;   // taxa livre de risco + prêmio
  vplCalculado: number;
  validadeData: string;
  hashSha256Termo: string;
  assinaturaDigitalRequerida: 'ICP_BRASIL_A1';
}

// ============================================================================
// ENGINE 4 — MONITORAMENTO REAL-TIME
// ============================================================================

export type TriggerEvento =
  | 'ORDEM_PAGAMENTO_EXPEDIDA'
  | 'SEQUESTRO_VERBA_ART100_CF'
  | 'IMPUGNACAO_FAZENDA_PROTOCOLADA'
  | 'JULGAMENTO_EMBARGOS'
  | 'HABILITACAO_NOVO_CREDOR'
  | 'INSCRICAO_EXCLUSAO_LOA';

export type CanalAlerta = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'IN_APP';

export interface PrecatorioMonitorSubscription {
  id: string;
  precatorioId: string;
  numeroProcesso: string;
  tribunal: string;
  canaisAlerta: CanalAlerta[];
  triggers: TriggerEvento[];
  webhookUrl?: string;
  userId?: string;
  ativo: boolean;
  criadoEm: string;
  ultimoDisparoAt?: string;
  ultimoHashDiff?: string;
}

export interface EventoProcessualDetectado {
  id: string;
  precatorioId: string;
  trigger: TriggerEvento;
  descricao: string;
  dataOcorrencia: string;
  documentoHash: string;
  tribunalOrigem: string;
  notificadoEm: string;
}

// ============================================================================
// ENGINE 5 — COMPENSAÇÃO TRIBUTÁRIA (Lei 14.973/2024)
// ============================================================================

export interface CompensacaoSimulacaoInput {
  precatorioId: string;
  valorAtualizadoPrecatorio: number;
  cessionarioCnpj: string;
  cessionarioRazaoSocial: string;
  debitoTributarioProjetadoMensal: number;
  debitoConsolidadoTotal: number;
}

export interface CompensacaoSimulacaoResult {
  creditoTributarioDisponivel: number;
  debitoTributarioProjetadoMensal: number;
  limite75PorCentoCompetencia: number; // Lei 14.973/2024 art. 5º
  abatimentoMensalPermitido: number;
  tempoEsgotamentoMeses: number;
  vplFluxoCompensacao: number;
  economiaTributariaEfetiva: number;
  atrativo: boolean;
  parecerLegal: string;
}

// ============================================================================
// ENGINE 6 — KYC/PLD + CADEIA DE CESSÕES MERKLE & BAAS SPLIT
// ============================================================================

export interface KycCedenteResult {
  aprovado: boolean;
  cpfCnpj: string;
  nome: string;
  pepIdentificado: boolean;
  listasRestritivasConsultadas: {
    ofac: boolean;
    onu: boolean;
    coaf: boolean;
    bndesCaged: boolean;
  };
  provaDeVidaStatus: 'VERIFICADO_SERPRO' | 'PENDENTE' | 'FALHA';
  comprovanteEnderecoValido: boolean;
  declaracaoOrigemLicitaAssinada: boolean;
  kycAuditHash: string;
  dataAnalise: string;
}

export interface CessaoLedgerNode {
  sequencia: number;
  previousHash: string;
  currentHash: string;
  cessaoId: string;
  documentoPayload: Record<string, any>;
  assinadoPor: string;
  timestamp: string;
}

export interface BaaSSplitDestinatario {
  papel: 'CREDOR_ORIGINAL' | 'FUNDO_CESSIONARIO' | 'ADVOGADO' | 'VELATRIX_PLATAFORMA';
  nome: string;
  cpfCnpj: string;
  chavePix: string;
  percentual: number;
  valorNominal: number;
}

export interface BaaSSplitOrder {
  ordemId: string;
  cessaoId: string;
  provedorBaaS: 'CELCOIN' | 'ASAAS' | 'STARK_BANK';
  valorTotalOperacao: number;
  destinatarios: BaaSSplitDestinatario[];
  status: 'PENDENTE' | 'PROCESSANDO' | 'LIQUIDADO' | 'FALHA';
  endToEndIdPix?: string;
  liquidadoEm?: string;
  comprovanteSha256?: string;
}
