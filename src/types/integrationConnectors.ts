/**
 * VELATRIX AOS V2 - ARQUITETURA DE INTEGRAÇÃO & APIS GOVERNAMENTAIS / BAAS
 * Tipos e interfaces formais para Vault A1, mTLS, e-CAC SERPRO, PGFN REGULARIZE,
 * DET Trabalhista, SEFAZ Estadual/Municipal, BaaS Split 50/50 e Auditoria LGPD.
 */

export type VaultProvider = 'AWS_KMS' | 'HASHICORP_VAULT' | 'AZURE_KEYVAULT';

export type CertificateOwnerType = 'CLIENT' | 'PARTNER_LAWYER' | 'PARTNER_ACCOUNTANT' | 'VELATRIX_MASTER';

export interface CertificateVaultRecord {
  id: string;
  alias: string;
  ownerType: CertificateOwnerType;
  ownerName: string;
  cnpjCpf: string;
  oabCrcNumber?: string;
  serialNumber: string;
  issuerCN: string; // ex: AC SERPRO RFB v5, AC Certisign Multipla v10
  thumbprintSha256: string;
  validFrom: string;
  validUntil: string;
  daysRemaining: number;
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  keyVaultProvider: VaultProvider;
  kmsKeyIdArn: string;
  encryptionAlgorithm: 'AES-256-GCM' | 'RSA-4096';
  mTLSActive: boolean;
  icpBrasilCompliant: boolean;
  lastUsedAt?: string;
  auditHash: string;
  isSimulated?: boolean;
}

export interface MtlsTestResult {
  targetPortal: 'RECEITA_FEDERAL_ECAC' | 'PGFN_REGULARIZE' | 'SEFAZ_NACIONAL_NFE' | 'MTE_DET';
  endpointUrl: string;
  status: 'SUCCESS' | 'FAILED';
  handshakeTimeMs: number;
  tlsVersion: 'TLSv1.3' | 'TLSv1.2';
  cipherSuite: string;
  certificateThumbprint: string;
  responseStatusCode: number;
  timestamp: string;
  caChainVerified: boolean;
  diagnosticMessage: string;
  isSimulated?: boolean;
}

export interface GovProxyAuthorization {
  id: string;
  outorganteCnpj: string;
  outorganteRazaoSocial: string;
  outorgadoCnpjCpf: string;
  outorgadoNome: string;
  outorgadoPapel: 'ADVOGADO_TRIBUTARIO' | 'PERITO_CONTABIL' | 'VELATRIX_GESTAO';
  procuracaoNumero: string;
  dataEmissao: string;
  dataValidade: string;
  status: 'ATIVA' | 'EXPIRANDO' | 'REVOGADA' | 'PENDENTE_VALIDACAO';
  poderesDelegados: {
    pgdasD: boolean;
    efdContribuicoes: boolean;
    efdReinf: boolean;
    perDcomp: boolean;
    dividaAtivaPgfn: boolean;
    dteMensagens: boolean;
    cndCertidoes: boolean;
  };
  hashSerpro: string;
}

export type EcacDeclarationType = 'PGDAS_D' | 'DASN_SIMEI' | 'EFD_CONTRIBUICOES' | 'EFD_REINF';

export interface EcacDeclarationSummary {
  tipo: EcacDeclarationType;
  periodoApuracao: string; // YYYY-MM
  dataTransmissao: string;
  reciboNumero: string;
  status: 'PROCESSADA' | 'RETIFICADA' | 'PENDENTE';
  receitaBrutaDeclarada: number;
  tributosApurados: {
    pis?: number;
    cofins?: number;
    icmsSt?: number;
    inssPatronal?: number;
    irpj?: number;
    csll?: number;
    simplesNacional?: number;
  };
  creditoIdentificadoAos: number;
  divergenciaDetectada: boolean;
  notaTecnica: string;
}

export interface EcacFiscalSituationReport {
  cnpj: string;
  razaoSocial: string;
  dataConsulta: string;
  situacaoCadastral: 'ATIVA' | 'SUSPENSA' | 'INAPTA';
  tipoCndDisponivel: 'CND_NEGATIVA' | 'CPEN_POSITIVA_COM_EFEITOS_NEGATIVA' | 'CPD_POSITIVA';
  pendenciasFiscais: {
    orgao: 'RECEITA_FEDERAL' | 'PGFN' | 'INSS';
    codigoReceita: string;
    descricao: string;
    periodoApuracao: string;
    saldoDevedorOriginal: number;
    saldoDevedorAtualizado: number;
    status: 'EXIGIBILIDADE_SUSPENSA' | 'EM_COBRANCA' | 'INSCRITO_DIVIDA_ATIVA';
  }[];
  totalDebitosExigiveis: number;
  totalDebitosSuspensos: number;
  hashProtocoloRfb: string;
}

export interface PerDcompTransmissionPayload {
  id: string;
  tipoCredito: 'PIS_COFINS_MONOFASICO' | 'PIS_COFINS_BASE_EXCLUSAO_ICMS' | 'INSS_PATRONAL_VERBAS_INDENIZATORIAS' | 'IRPJ_CSLL_PAGAMENTO_INDEVIDO';
  origemCredito: string; // ex: 'Art. 3º Lei 10.833 / Decisão STF Tema 69'
  periodoCreditoInicio: string; // YYYY-MM
  periodoCreditoFim: string; // YYYY-MM
  valorPrincipalCredito: number;
  taxaSelicAcumuladaPct: number;
  valorJurosSelic: number;
  valorTotalCreditoAtualizado: number;
  valorCompensadoDctfWebAtual: number;
  saldoRestitivelRemanescente: number;
  debitoCompensadoDescricao: string;
  periodoDebitoCompensado: string;
  certificadoThumbprint: string;
  responsavelNome: string;
  responsavelCpf: string;
  cnpjContribuinte?: string;
  razaoSocial?: string;
}

export interface PerDcompReceipt {
  id: string;
  numeroControlePerDcomp: string;
  reciboEntregaNumero: string;
  dataHoraTransmissao: string;
  cnpjContribuinte: string;
  razaoSocial: string;
  tipoDocumento: 'DECLARACAO_COMPENSACAO' | 'PEDIDO_RESTITUICAO';
  valorTotalCompensado: number;
  statusHomologacao: 'HOMOLOGADO_TACITO' | 'EM_ANALISE_DCOMP' | 'HOMOLOGADO_EXPRESSO';
  protocoloSerpro: string;
  carimboDoTempoSha256: string;
  xmlReciboAssinadoUrl?: string;
  isSimulated?: boolean;
}

export interface PgfnActiveDebtItem {
  numeroInscricaoCda: string;
  dataOrigem: string;
  tributo: 'PIS' | 'COFINS' | 'INSS_PREVIDENCIARIO' | 'IRPJ' | 'MULTA_ISOLADA';
  valorConsolidadoOriginal: number;
  valorJurosMultas: number;
  valorAtualizadoComSelic: number;
  faseCobranca: 'PROTESTO' | 'EXECUCAO_FISCAL_AJUIZADA' | 'INSCRICAO_ADMINISTRATIVA';
  enquadramentoTransacao: 'EDF_EXCEPCIONAL_LEI_13988' | 'INDIVIDUAL' | 'NAO_ELEGIVEL';
  potencialDescontoJurosMultasPct: number; // até 70%
  valorAposTransacaoProjetado: number;
  parcelamentoMaximoMeses: number; // até 145 meses
}

export interface PgfnCapagHistoryRecord {
  cnpj: string;
  exercicioAno: number;
  notaCapag: 'A' | 'B' | 'C' | 'D';
  indicadorEndividamentoGeral: number; // Dívida / Ativo
  indicadorLiquidezCorrente: number; // Ativo Circ / Passivo Circ
  indicadorCoberturaJuros: number; // EBITDA / Juros
  probabilidadeRecuperacaoDivida: 'MUITO_ALTA' | 'ALTA' | 'MEDIA' | 'BAIXA' | 'REMOTE';
  descontoMaximoAutorizadoLei13988: number; // em %
  dataUltimaAtualizacao: string;
}

export interface DetNotificationItem {
  id: string;
  origem: 'MTE_DET' | 'ESOCIAL_S5011' | 'FGTS_DIGITAL';
  titulo: string;
  tipo: 'INTIMACAO_ELETRONICA' | 'NOTIFICACAO_FISCAL' | 'ALERTA_DIVERGENCIA_INSS';
  dataPublicacao: string;
  prazoRespostaDias: number;
  dataLimiteResposta: string;
  status: 'PENDENTE_LEITURA' | 'LIDA_EM_ANALISE' | 'DEFESA_PROTOCOLADA' | 'RESOLVIDA';
  resumoImpacto: string;
  valorEnvolvidoBrl: number;
  acaoRecomendadaAos: string;
}

export interface SefazXmlScanBatch {
  id: string;
  ufSefaz: 'SP' | 'RJ' | 'MG' | 'RS' | 'PR' | 'SC' | 'GO' | 'BA' | 'PE';
  periodoVarredura: string;
  totalXmlsProcessados: number;
  notasFiscaisComDivergencia: number;
  creditoPisCofinsMonofasicoIdentificado: number;
  creditoIcmsStBitributadoIdentificado: number;
  ncmsCriticosDetectados: {
    ncm: string;
    descricao: string;
    quantidadeItens: number;
    valorFaturadoTotal: number;
    tributacaoIndevidaIdentificada: number;
  }[];
  tempoProcessamentoMs: number;
  status: 'CONCLUIDO' | 'PROCESSANDO' | 'FALHA_CONEXAO_SEFAZ';
}

export type BaasProvider = 'ASAAS' | 'STARK_BANK' | 'CELCOIN';

export interface BaasConfig {
  provider: BaasProvider;
  environment: 'SANDBOX' | 'PRODUCTION';
  clientId?: string;
  apiKeyMasked: string;
  webhookSecretMasked: string;
  webhookEndpointUrl: string;
  mtlsMutualCertConfigured: boolean;
  pixInstantSettlementActive: boolean;
  bacenDirectRouting: boolean;
}

export interface BaasSubaccount {
  id: string;
  provider: BaasProvider;
  subaccountIdOnProvider: string;
  holderName: string;
  holderCnpjCpf: string;
  holderType: 'ADVOGADO_PARCEIRO' | 'PERITO_CONTABIL' | 'CLIENTE_EMPRESA';
  registrationCode: string; // OAB/SP 123456 ou CRC/SP 987654
  walletBalanceBrl: number;
  pixKey: string;
  bankAccount: {
    bankCode: string;
    bankName: string;
    agency: string;
    accountNumber: string;
  };
  kycStatus: 'APROVADO_BACEN' | 'EM_ANALISE' | 'PENDENCIA_DOCUMENTAL';
  createdAt: string;
  isSimulated?: boolean;
}

export interface BaasSplitChargeInstruction {
  chargeId: string;
  tenantId: string;
  taxCaseId: string;
  valorTotalHonorariosBrl: number;
  metodoPagamento: 'PIX_DINAMICO' | 'BOLETO_HIBRIDO';
  clienteDevedor: {
    razaoSocial: string;
    cnpj: string;
    email: string;
  };
  splitRules: {
    partnerSubaccountId: string;
    partnerName: string;
    partnerPercentage: number;
    partnerAmountBrl: number;
    partnerPixKey: string;
    partnerNfseStatus: 'PENDENTE' | 'EMITIDA';
    velatrixSubaccountId: string;
    velatrixPercentage: number;
    velatrixAmountBrl: number;
    velatrixNfseStatus: 'PENDENTE' | 'EMITIDA';
  };
  status: 'PENDENTE_PAGAMENTO' | 'PAGO_EM_LIQUIDACAO' | 'SPLIT_CONCLUIDO';
  pixPayloadQrCode?: string;
  boletoLinhaDigitavel?: string;
  dataCriacao: string;
  dataVencimento: string;
  dataLiquidacao?: string;
  endToEndBacenId?: string;
  isSimulated?: boolean;
}

export interface GovAuditLedgerEntry {
  id: string;
  timestamp: string;
  clientIp: string;
  cnpjConsultado: string;
  portalGoverno: 'RECEITA_FEDERAL_ECAC' | 'PGFN_REGULARIZE' | 'SEFAZ_NACIONAL_NFE' | 'SEFAZ_ESTADUAL' | 'MTE_DET' | 'ADN_NFSE_NACIONAL' | 'BAAS_BACEN';
  endpoint: string;
  metodoHttp: 'GET' | 'POST';
  certificadoA1Thumbprint: string;
  httpStatus: number;
  tempoRespostaMs: number;
  payloadDigestSha256: string;
  lgpdCompliance: {
    dadosAnonimizados: boolean;
    baseLegalLgpd: 'ART_7_II_CUMPRIMENTO_OBRIGACAO_LEGAL' | 'ART_7_VI_EXERCICIO_REGULAR_DIREITO';
    dpoAuditorId: string;
  };
  imutabilidadeHash: string;
}
