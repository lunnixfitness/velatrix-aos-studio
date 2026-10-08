/**
 * VELATRIX AOS — PRECATÓRIOS & LIQUIDEZ JUDICIAL
 * ENGINE 6: COMPLIANCE, CADEIA DE CESSÕES & ADAPTERS PLUGÁVEIS
 * 
 * Regra Arquitetural: A Velatrix NÃO opera financeiramente e NÃO custodia recursos.
 * Fornece orquestração, auditoria e custódia documental criptográfica.
 * O cliente (escritório/fundo/banco tenant) pluga seus provedores de KYC e BaaS
 * com as próprias credenciais, ou utiliza o modo de Instrução Manual.
 */

// ============================================================================
// 1. INTERFACES DE KYC (Know Your Customer & Prevenção à Lavagem de Dinheiro)
// ============================================================================

export type ProvaDeVidaStatus = 'VALIDADO' | 'PENDENTE' | 'REJEITADO' | 'FALHA_BIOMETRICA';

export interface ProvaDeVidaResult {
  status: ProvaDeVidaStatus;
  scoreBiometrico?: number; // 0 a 100
  provider: string;
  /** true quando veio de adapter não conectado (modo demonstração) */
  simulado?: boolean;
  protocolo: string;
  timestamp: string;
  detalhes?: string;
  livenessConfidence?: number;
  hashEvidencia?: string;
}

export interface PEPResult {
  isPep: boolean;
  cargo?: string;
  orgao?: string;
  dataFimMandato?: string;
  parentesPep?: Array<{
    nome: string;
    parentesco: string;
    cpfMascarado?: string;
  }>;
  provider: string;
  /** true quando veio de adapter não conectado (modo demonstração) */
  simulado?: boolean;
  consultadoEm: string;
  protocolo: string;
}

export interface ListaResult {
  irregular: boolean;
  fontesConsultadas: {
    ofac: boolean;
    onu: boolean;
    coaf: boolean;
    bndesCaged: boolean;
    cguCeisCnep?: boolean;
    tcuInabilitados?: boolean;
  };
  ocorrencias: Array<{
    fonte: string;
    motivo: string;
    dataInclusao?: string;
  }>;
  provider: string;
  /** true quando veio de adapter não conectado (modo demonstração) */
  simulado?: boolean;
  consultadoEm: string;
  protocolo: string;
}

/**
 * Interface padronizada que qualquer provedor de KYC deve implementar.
 */
export interface KycProvider {
  readonly providerId: string;
  readonly providerName: string;
  verificarProvaDeVida(cpf: string, fotoBase64?: string): Promise<ProvaDeVidaResult>;
  consultarPEP(cpfCnpj: string): Promise<PEPResult>;
  consultarListasRestritivas(cpfCnpj: string): Promise<ListaResult>;
}

// ============================================================================
// 2. INTERFACES DE BAAS (Banking as a Service & Split de Liquidação)
// ============================================================================

export interface DestinatarioSplit {
  papel: 'CREDOR_ORIGINAL' | 'FUNDO_CESSIONARIO' | 'ADVOGADO' | 'VELATRIX_PLATAFORMA';
  nome: string;
  cpfCnpj: string;
  chavePix: string;
  bancoDestino?: string;
  agenciaConta?: string;
  percentual: number;
  valorNominal: number;
}

export interface OrdemSplit {
  ordemId: string;
  cessaoId: string;
  valorTotal: number;
  destinatarios: DestinatarioSplit[];
  metadata?: Record<string, any>;
  dataAgendamento?: string;
}

export interface LogDestinatarioSplit {
  chavePix: string;
  endToEndId: string;
  status: 'EFETIVADO' | 'PENDENTE' | 'FALHA';
  valor: number;
  mensagemErro?: string;
}

export interface ComprovanteSplit {
  ordemId: string;
  provider: string;
  /** true quando veio de adapter não conectado (modo demonstração) */
  simulado?: boolean;
  status: 'LIQUIDADO' | 'PROCESSANDO' | 'FALHA';
  endToEndIdPix: string;
  dataLiquidacao: string;
  autenticacaoBancaria: string;
  comprovanteSha256: string;
  comprovanteUrlOuTexto: string;
  logsDestinatarios: LogDestinatarioSplit[];
}

export interface Saldo {
  provider: string;
  /** true quando veio de adapter não conectado (modo demonstração) */
  simulado?: boolean;
  conta: string;
  saldoDisponivel: number;
  saldoBloqueado: number;
  moeda: string;
  consultadoEm: string;
}

/**
 * Interface padronizada que qualquer provedor de BaaS deve implementar.
 */
export interface BaasProvider {
  readonly providerId: string;
  readonly providerName: string;
  executarSplit(ordem: OrdemSplit): Promise<ComprovanteSplit>;
  consultarSaldo(conta: string): Promise<Saldo>;
}

// ============================================================================
// 3. CONFIGURAÇÃO DE PROVIDERS POR TENANT & MODO MANUAL
// ============================================================================

export type KycProviderChoice = 'SERPRO_DATAVALID' | 'UNICO_CHECK' | 'IDWALL' | 'MANUAL';
export type BaasProviderChoice = 'CELCOIN' | 'DOCK' | 'SWAP' | 'BS2' | 'MANUAL';

export interface TenantComplianceConfig {
  tenantId: string;
  tenantName: string;
  kycProviderType: KycProviderChoice;
  kycCredentials?: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    ambiente?: 'SANDBOX' | 'PRODUCAO';
  };
  baasProviderType: BaasProviderChoice;
  baasCredentials?: {
    clientId?: string;
    clientSecret?: string;
    token?: string;
    conta?: string;
    chavePixEscrow?: string;
    ambiente?: 'SANDBOX' | 'PRODUCAO';
  };
}

export interface ItemPixCopiaECola {
  destinatario: string;
  papel: string;
  chavePix: string;
  valor: number;
  codigoCopiaECola: string;
}

export interface InstrucaoManualSplit {
  instrucaoId: string;
  cessaoId: string;
  dataGeracao: string;
  valorTotalOperacao: number;
  itensPix: ItemPixCopiaECola[];
  orientacoesBancarias: string[];
  minutaEscrituraNotarialResumo: string;
  hashInstrucaoSha256: string;
}

export interface ComprovanteManualUpload {
  comprovanteId: string;
  cessaoId: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  sha256Arquivo: string;
  anexadoPor: string;
  dataUpload: string;
  bancoOrigem: string;
  autenticacaoBancaria: string;
  status: 'EM_CONFERENCIA' | 'VALIDADO' | 'REJEITADO';
}

// ============================================================================
// 4. ASSINATURA DIGITAL ICP-BRASIL A1 (Lacuna Web PKI)
// ============================================================================

export interface CertificadoDigitalInfo {
  subjectName: string;
  cpfCnpj: string;
  emissorAC: string;
  validadeDe: string;
  validadeAte: string;
  serialNumber: string;
  tipo: 'A1' | 'A3';
}

export interface AssinaturaDigitalPkiResult {
  documentoId: string;
  hashDocumentoOriginal: string;
  hashAssinaturaSha256: string;
  certificado: CertificadoDigitalInfo;
  algoritmoAssinatura: string; // ex: 'SHA256withRSA'
  carimboDoTempoIcpBrasil: string;
  pacotePadesCadesHash: string;
  assinadoEm: string;
}

// ============================================================================
// 5. PUBLICAÇÃO & PROTOCOLO NO DJEN
// ============================================================================

export interface PeticaoHabilitacaoDjen {
  precatorioId: string;
  numeroProcesso: string;
  tribunal: string;
  varaJuizo: string;
  cedenteNome: string;
  cedenteDocumento: string;
  cessionarioNome: string;
  cessionarioCnpj: string;
  valorCessao: number;
  fundamentoLegal: string; // Art. 100 § 14 CF/88 + Art. 778 CPC
  textoPeticaoCompleto: string;
  sha256Minuta: string;
  geradoEm: string;
}

export interface ProtocoloDjenResult {
  protocoloId: string;
  precatorioId: string;
  numeroProtocoloJudicial: string;
  numeroProcesso: string;
  advogadoResponsavel: string;
  oabAdvogado: string;
  dataProtocolo: string;
  comprovanteReciboHash: string;
  status: 'PROTOCOLO_REALIZADO' | 'PENDENTE_ANALISE_JUIZ' | 'HABILITACAO_DEFERIDA';
}
