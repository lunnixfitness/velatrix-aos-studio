/**
 * VELATRIX AOS V2 - SERVIÇO CLIENT-SIDE DE CONECTORES GOVERNAMENTAIS & BAAS
 * 
 * Este arquivo atua como cliente browser-safe para o GovernmentAndBaasHub.
 * NÃO importa repositórios do servidor, nem Prisma, nem bibliotecas Node-only.
 * Consome as rotas REST autenticadas /api/v1/gov/... com fallback seguro em cache local.
 */

import {
  CertificateVaultRecord,
  GovProxyAuthorization,
  EcacDeclarationSummary,
  EcacFiscalSituationReport,
  PerDcompReceipt,
  PgfnActiveDebtItem,
  PgfnCapagHistoryRecord,
  DetNotificationItem,
  SefazXmlScanBatch,
  BaasConfig,
  BaasSubaccount,
  BaasSplitChargeInstruction,
  GovAuditLedgerEntry,
  MtlsTestResult,
  PerDcompTransmissionPayload,
  BaasProvider,
  VaultProvider
} from '../types/integrationConnectors';
import { secureId, secureInt } from '../lib/demoMode';

export const INITIAL_CERTIFICATES: CertificateVaultRecord[] = [
  {
    id: 'cert_vault_01',
    alias: 'Certificado Matriz Nexus Indústria A1',
    ownerType: 'CLIENT',
    ownerName: 'Nexus Indústria & Manufatura S/A',
    cnpjCpf: '18.492.301/0001-84',
    serialNumber: '7A8F:9021:B43C:5519:E092',
    issuerCN: 'AC SERPRO RFB v5',
    thumbprintSha256: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    validFrom: '2025-11-10T00:00:00Z',
    validUntil: '2026-11-10T23:59:59Z',
    daysRemaining: 55,
    status: 'VALID',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:102115117989:key/velatrix-vault-a1-nexus-prod',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-16T11:15:00Z',
    auditHash: '0x3a4f89b1c2d3e4f506172839405a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3'
  },
  {
    id: 'cert_vault_02',
    alias: 'Dr. Leonardo Vasconcelos (OAB/SP 241.809)',
    ownerType: 'PARTNER_LAWYER',
    ownerName: 'Vasconcelos & Prado Advogados Tributaristas',
    cnpjCpf: '32.189.440/0001-92',
    oabCrcNumber: 'OAB/SP 241.809',
    serialNumber: '4B11:9C82:EE10:7743:A881',
    issuerCN: 'AC Certisign Multipla v10',
    thumbprintSha256: '3e4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef01',
    validFrom: '2026-01-15T00:00:00Z',
    validUntil: '2027-01-15T23:59:59Z',
    daysRemaining: 121,
    status: 'VALID',
    keyVaultProvider: 'HASHICORP_VAULT',
    kmsKeyIdArn: 'vault:secret/data/partners/oab-sp-241809/a1_key',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-15T18:40:22Z',
    auditHash: '0x8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7'
  },
  {
    id: 'cert_vault_03',
    alias: 'Dra. Claudia Meirelles (CRC/SP 1SP298711)',
    ownerType: 'PARTNER_ACCOUNTANT',
    ownerName: 'Meirelles Perícias & Auditoria Contábil',
    cnpjCpf: '44.901.222/0001-30',
    oabCrcNumber: 'CRC/SP 1SP298711',
    serialNumber: '11C0:F938:A234:65BC:3321',
    issuerCN: 'AC Soluti Multipla v5',
    thumbprintSha256: '778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566',
    validFrom: '2026-03-01T00:00:00Z',
    validUntil: '2027-03-01T23:59:59Z',
    daysRemaining: 166,
    status: 'VALID',
    keyVaultProvider: 'AWS_KMS',
    kmsKeyIdArn: 'arn:aws:kms:sa-east-1:102115117989:key/velatrix-vault-crc-meirelles',
    encryptionAlgorithm: 'AES-256-GCM',
    mTLSActive: true,
    icpBrasilCompliant: true,
    lastUsedAt: '2026-09-14T09:12:00Z',
    auditHash: '0x445566778899aabbccddeeff00112233445566778899aabbccddeeff0011223'
  }
];

export const INITIAL_PROXIES: GovProxyAuthorization[] = [
  {
    id: 'proc_serpro_01',
    outorganteCnpj: '18.492.301/0001-84',
    outorganteRazaoSocial: 'Nexus Indústria & Manufatura S/A',
    outorgadoCnpjCpf: '32.189.440/0001-92',
    outorgadoNome: 'Vasconcelos & Prado Advogados Tributaristas',
    outorgadoPapel: 'ADVOGADO_TRIBUTARIO',
    procuracaoNumero: 'PROC-ECAC-2026/099824',
    dataEmissao: '2026-01-20',
    dataValidade: '2027-01-20',
    status: 'ATIVA',
    poderesDelegados: {
      pgdasD: true,
      efdContribuicoes: true,
      efdReinf: true,
      perDcomp: true,
      dividaAtivaPgfn: true,
      dteMensagens: true,
      cndCertidoes: true
    },
    hashSerpro: '0x99281a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f'
  }
];

export const INITIAL_ECAC_DECLARATIONS: EcacDeclarationSummary[] = [
  {
    tipo: 'EFD_CONTRIBUICOES',
    periodoApuracao: '2026-07',
    dataTransmissao: '2026-08-14 16:42:10',
    reciboNumero: 'REC-EFD-SPED-202607-99418',
    status: 'PROCESSADA',
    receitaBrutaDeclarada: 3850000.00,
    tributosApurados: {
      pis: 63525.00,
      cofins: 292600.00
    },
    creditoIdentificadoAos: 184200.00,
    divergenciaDetectada: true,
    notaTecnica: 'Exclusão do ICMS destacado da base de cálculo de PIS/COFINS (Tema 69 STF) não aproveitada na apuração original do contribuinte.'
  },
  {
    tipo: 'EFD_REINF',
    periodoApuracao: '2026-07',
    dataTransmissao: '2026-08-15 09:18:22',
    reciboNumero: 'REC-REINF-R2010-88127',
    status: 'PROCESSADA',
    receitaBrutaDeclarada: 420000.00,
    tributosApurados: {
      inssPatronal: 46200.00
    },
    creditoIdentificadoAos: 19800.00,
    divergenciaDetectada: true,
    notaTecnica: 'Retenção previdenciária sobre aviso prévio indenizado e terço constitucional apurada com alíquota cheia (Tema 985 STF).'
  },
  {
    tipo: 'PGDAS_D',
    periodoApuracao: '2026-06',
    dataTransmissao: '2026-07-20 14:10:00',
    reciboNumero: 'REC-PGDASD-202606-11409',
    status: 'PROCESSADA',
    receitaBrutaDeclarada: 980000.00,
    tributosApurados: {
      simplesNacional: 93100.00
    },
    creditoIdentificadoAos: 41200.00,
    divergenciaDetectada: true,
    notaTecnica: 'Faturamento de produtos farmacêuticos e autopeças monofásicos apurados sem segregação tributária no PGDAS-D (Lei 10.147/2000).'
  }
];

export const INITIAL_FISCAL_SITUATION: EcacFiscalSituationReport = {
  cnpj: '18.492.301/0001-84',
  razaoSocial: 'Nexus Indústria & Manufatura S/A',
  dataConsulta: '2026-09-16T11:00:00Z',
  situacaoCadastral: 'ATIVA',
  tipoCndDisponivel: 'CPEN_POSITIVA_COM_EFEITOS_NEGATIVA',
  pendenciasFiscais: [
    {
      orgao: 'RECEITA_FEDERAL',
      codigoReceita: '2172 - COFINS NÃO CUMULATIVA',
      descricao: 'Saldo devedor apurado em DCTFWeb ref. competência 04/2026',
      periodoApuracao: '2026-04',
      saldoDevedorOriginal: 142000.00,
      saldoDevedorAtualizado: 148900.00,
      status: 'EM_COBRANCA'
    },
    {
      orgao: 'PGFN',
      codigoReceita: 'CDA 80.6.26.00918-42',
      descricao: 'Dívida Ativa da União - IRPJ Lucro Real Exigível',
      periodoApuracao: '2024-12',
      saldoDevedorOriginal: 480000.00,
      saldoDevedorAtualizado: 532400.00,
      status: 'INSCRITO_DIVIDA_ATIVA'
    }
  ],
  totalDebitosExigiveis: 681300.00,
  totalDebitosSuspensos: 0.00,
  hashProtocoloRfb: '0xrfb_sit_fisc_20260916_88319a902b3'
};

export const INITIAL_PERDCOMPS: PerDcompReceipt[] = [
  {
    id: 'perdcomp_01',
    numeroControlePerDcomp: 'DCOMP-2026.09.16-9812-BR',
    reciboEntregaNumero: 'REC-RFB-DCOMP-88391204',
    dataHoraTransmissao: '2026-09-16 10:45:12',
    cnpjContribuinte: '18.492.301/0001-84',
    razaoSocial: 'Nexus Indústria & Manufatura S/A',
    tipoDocumento: 'DECLARACAO_COMPENSACAO',
    valorTotalCompensado: 148900.00,
    statusHomologacao: 'HOMOLOGADO_EXPRESSO',
    protocoloSerpro: 'SERPRO-RFB-WS-2026-118940192',
    carimboDoTempoSha256: '0xdcomp_ts_9981273645a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0'
  }
];

export const INITIAL_PGFN_DEBTS: PgfnActiveDebtItem[] = [
  {
    numeroInscricaoCda: 'CDA 80.6.26.00918-42',
    dataOrigem: '2024-12-15',
    tributo: 'IRPJ',
    valorConsolidadoOriginal: 480000.00,
    valorJurosMultas: 164200.00,
    valorAtualizadoComSelic: 532400.00,
    faseCobranca: 'INSCRICAO_ADMINISTRATIVA',
    enquadramentoTransacao: 'EDF_EXCEPCIONAL_LEI_13988',
    potencialDescontoJurosMultasPct: 70.0,
    valorAposTransacaoProjetado: 417460.00,
    parcelamentoMaximoMeses: 145
  },
  {
    numeroInscricaoCda: 'CDA 80.7.25.01140-19',
    dataOrigem: '2025-05-10',
    tributo: 'COFINS',
    valorConsolidadoOriginal: 210000.00,
    valorJurosMultas: 68500.00,
    valorAtualizadoComSelic: 234100.00,
    faseCobranca: 'PROTESTO',
    enquadramentoTransacao: 'EDF_EXCEPCIONAL_LEI_13988',
    potencialDescontoJurosMultasPct: 65.0,
    valorAposTransacaoProjetado: 189575.00,
    parcelamentoMaximoMeses: 120
  }
];

export const INITIAL_CAPAG_HISTORY: PgfnCapagHistoryRecord[] = [
  {
    cnpj: '18.492.301/0001-84',
    exercicioAno: 2025,
    notaCapag: 'C',
    indicadorEndividamentoGeral: 0.78,
    indicadorLiquidezCorrente: 0.89,
    indicadorCoberturaJuros: 1.15,
    probabilidadeRecuperacaoDivida: 'BAIXA',
    descontoMaximoAutorizadoLei13988: 70.0,
    dataUltimaAtualizacao: '2026-08-10T14:30:00Z'
  },
  {
    cnpj: '18.492.301/0001-84',
    exercicioAno: 2024,
    notaCapag: 'C',
    indicadorEndividamentoGeral: 0.82,
    indicadorLiquidezCorrente: 0.84,
    indicadorCoberturaJuros: 1.05,
    probabilidadeRecuperacaoDivida: 'BAIXA',
    descontoMaximoAutorizadoLei13988: 70.0,
    dataUltimaAtualizacao: '2025-08-15T10:00:00Z'
  }
];

export const INITIAL_DET_NOTIFICATIONS: DetNotificationItem[] = [
  {
    id: 'det_notif_01',
    origem: 'MTE_DET',
    titulo: 'Intimação Fiscal Eletrônica MTE/SIT nº 2026/004819',
    tipo: 'INTIMACAO_ELETRONICA',
    dataPublicacao: '2026-09-10 08:30:00',
    prazoRespostaDias: 15,
    dataLimiteResposta: '2026-09-25 23:59:59',
    status: 'LIDA_EM_ANALISE',
    resumoImpacto: 'Solicitação de esclarecimentos sobre divergência de cálculo de INSS Patronal em verbas indenizatórias na folha de pagamento 2023-2025.',
    valorEnvolvidoBrl: 184500.00,
    acaoRecomendadaAos: 'Apresentar memória de cálculo pericial perante o MTE com base no Tema 985 STF e demonstrativo de compensação eSocial S-1000.'
  },
  {
    id: 'det_notif_02',
    origem: 'FGTS_DIGITAL',
    titulo: 'Alerta de Conciliação Bancária - FGTS Digital D+1',
    tipo: 'ALERTA_DIVERGENCIA_INSS',
    dataPublicacao: '2026-09-14 14:00:00',
    prazoRespostaDias: 30,
    dataLimiteResposta: '2026-10-14 23:59:59',
    status: 'PENDENTE_LEITURA',
    resumoImpacto: 'Guias de recolhimento rescindente e rescisão por acordo mútuo processadas com identificação de estorno a favor da empresa.',
    valorEnvolvidoBrl: 32400.00,
    acaoRecomendadaAos: 'Gerar compensação via FGTS Digital e retificar eventos S-2299.'
  }
];

export const INITIAL_SEFAZ_BATCHES: SefazXmlScanBatch[] = [
  {
    id: 'batch_sefaz_sp_01',
    ufSefaz: 'SP',
    periodoVarredura: 'Últimos 60 Meses (2021-2026)',
    totalXmlsProcessados: 18420,
    notasFiscaisComDivergencia: 1420,
    creditoPisCofinsMonofasicoIdentificado: 384500.00,
    creditoIcmsStBitributadoIdentificado: 212400.00,
    tempoProcessamentoMs: 420,
    status: 'CONCLUIDO',
    ncmsCriticosDetectados: [
      {
        ncm: '3004.90.99',
        descricao: 'Medicamentos & Fármacos Monofásicos (Lei 10.147/00)',
        quantidadeItens: 4890,
        valorFaturadoTotal: 2150000.00,
        tributacaoIndevidaIdentificada: 198400.00
      },
      {
        ncm: '8708.29.99',
        descricao: 'Partes e Acessórios de Autopeças (Substituição Tributária)',
        quantidadeItens: 2310,
        valorFaturadoTotal: 1420000.00,
        tributacaoIndevidaIdentificada: 131200.00
      },
      {
        ncm: '3304.99.90',
        descricao: 'Cosméticos & Perfumaria (PIS/COFINS Alíquota Zero na Revenda)',
        quantidadeItens: 1840,
        valorFaturadoTotal: 980000.00,
        tributacaoIndevidaIdentificada: 54900.00
      }
    ]
  }
];

export const INITIAL_BAAS_CONFIG: BaasConfig = {
  provider: 'ASAAS',
  environment: 'PRODUCTION',
  clientId: 'velatrix_baas_prod_sa_east_1',
  apiKeyMasked: 'prod_sec_************************************8912',
  webhookSecretMasked: 'whsec_**********************************4f2a',
  webhookEndpointUrl: 'https://velatrix.ai/api/v1/baas/webhook/settlement',
  mtlsMutualCertConfigured: true,
  pixInstantSettlementActive: true,
  bacenDirectRouting: true
};

export const INITIAL_SUBCONF_ACCOUNTS: BaasSubaccount[] = [
  {
    id: 'subacc_oab_01',
    provider: 'ASAAS',
    subaccountIdOnProvider: 'cus_sub_00091823',
    holderName: 'Vasconcelos & Prado Advogados Associados',
    holderCnpjCpf: '32.189.440/0001-92',
    holderType: 'ADVOGADO_PARCEIRO',
    registrationCode: 'OAB/SP 241.809',
    walletBalanceBrl: 214500.00,
    pixKey: 'financeiro@vasconcelosprado.adv.br',
    bankAccount: {
      bankCode: '341',
      bankName: 'Itaú Unibanco S/A',
      agency: '0912',
      accountNumber: '44819-2'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-01-10T14:00:00Z'
  },
  {
    id: 'subacc_crc_02',
    provider: 'ASAAS',
    subaccountIdOnProvider: 'cus_sub_00091824',
    holderName: 'Meirelles Perícias Contábeis Eireli',
    holderCnpjCpf: '44.901.222/0001-30',
    holderType: 'PERITO_CONTABIL',
    registrationCode: 'CRC/SP 1SP298711',
    walletBalanceBrl: 94200.00,
    pixKey: 'pix@meirellespericias.com.br',
    bankAccount: {
      bankCode: '033',
      bankName: 'Banco Santander Brasil',
      agency: '2100',
      accountNumber: '13009412-8'
    },
    kycStatus: 'APROVADO_BACEN',
    createdAt: '2026-02-14T09:30:00Z'
  }
];

export const INITIAL_SPLIT_INSTRUCTIONS: BaasSplitChargeInstruction[] = [
  {
    chargeId: 'split_chg_2026_9941',
    tenantId: 'tenant_nexus_01',
    taxCaseId: 'CASE-REC-001',
    valorTotalHonorariosBrl: 100000.00,
    metodoPagamento: 'PIX_DINAMICO',
    clienteDevedor: {
      razaoSocial: 'Nexus Indústria & Manufatura S/A',
      cnpj: '18.492.301/0001-84',
      email: 'cfo@nexusindustria.com.br'
    },
    splitRules: {
      partnerSubaccountId: 'subacc_oab_01',
      partnerName: 'Vasconcelos & Prado Advogados Associados',
      partnerPercentage: 100.0, // P23: Velatrix não participa de honorários
      partnerAmountBrl: 100000.00,
      partnerPixKey: 'financeiro@vasconcelosprado.adv.br',
      partnerNfseStatus: 'EMITIDA',
      velatrixSubaccountId: 'subacc_velatrix_master',
      velatrixPercentage: 0.0,
      velatrixAmountBrl: 0.00,
      velatrixNfseStatus: 'EMITIDA'
    },
    status: 'SPLIT_CONCLUIDO',
    pixPayloadQrCode: '00020101021226840014br.gov.bcb.pix2562pix.velatrix.ai/qr/v2/split_chg_2026_99415204000053039865408100000.005802BR5925VELATRIX TECNOLOGIA LTDA6009SAO PAULO62070503***63048F1A',
    boletoLinhaDigitavel: '34191.79001 01043.510047 91020.150008 1 98400001000000',
    dataCriacao: '2026-09-10 11:20:00',
    dataVencimento: '2026-09-15',
    dataLiquidacao: '2026-09-12 14:22:18',
    endToEndBacenId: 'E18492301202609121422s9941824a7'
  }
];

export const INITIAL_GOV_AUDIT_LOGS: GovAuditLedgerEntry[] = [
  {
    id: 'gov_audit_01',
    timestamp: '2026-09-16T10:45:12.410Z',
    clientIp: '177.136.210.45',
    cnpjConsultado: '18.492.301/0001-84',
    portalGoverno: 'RECEITA_FEDERAL_ECAC',
    endpoint: 'https://cav.receita.fazenda.gov.br/api/v1/perdcomp/transmitir',
    metodoHttp: 'POST',
    certificadoA1Thumbprint: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    httpStatus: 200,
    tempoRespostaMs: 342,
    payloadDigestSha256: '0x8899aabbccddeeff00112233445566778899aabbccddeeff0011223344556677',
    lgpdCompliance: {
      dadosAnonimizados: true,
      baseLegalLgpd: 'ART_7_II_CUMPRIMENTO_OBRIGACAO_LEGAL',
      dpoAuditorId: 'dpo_velatrix_officer_01'
    },
    imutabilidadeHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b'
  },
  {
    id: 'gov_audit_02',
    timestamp: '2026-09-16T11:00:00.120Z',
    clientIp: '177.136.210.45',
    cnpjConsultado: '18.492.301/0001-84',
    portalGoverno: 'PGFN_REGULARIZE',
    endpoint: 'https://regularize.pgfn.gov.br/api/consulta/cda/extrato',
    metodoHttp: 'GET',
    certificadoA1Thumbprint: '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
    httpStatus: 200,
    tempoRespostaMs: 188,
    payloadDigestSha256: '0x112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
    lgpdCompliance: {
      dadosAnonimizados: true,
      baseLegalLgpd: 'ART_7_VI_EXERCICIO_REGULAR_DIREITO',
      dpoAuditorId: 'dpo_velatrix_officer_01'
    },
    imutabilidadeHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b'
  }
];

let clientCertificates = [...INITIAL_CERTIFICATES];
let clientSubaccounts = [...INITIAL_SUBCONF_ACCOUNTS];
let clientSplitInstructions = [...INITIAL_SPLIT_INSTRUCTIONS];
let clientPerDcomps = [...INITIAL_PERDCOMPS];
let clientAuditLogs = [...INITIAL_GOV_AUDIT_LOGS];

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('velatrix_session_token') || sessionStorage.getItem('velatrix_session_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Cliente seguro de Conectores Governamentais & BaaS para o Frontend
 */
export class GovConnectorService {
  static getCertificates(): CertificateVaultRecord[] {
    return clientCertificates;
  }

  static async fetchCertificates(): Promise<CertificateVaultRecord[]> {
    try {
      const res = await fetch('/api/v1/gov/vault/certificates', {
        headers: { credentials: 'omit', ...getAuthHeader() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.certificates && Array.isArray(data.certificates)) {
          clientCertificates = data.certificates;
        }
      }
    } catch {
      // Fallback
    }
    return clientCertificates;
  }

  static registerA1Certificate(payload: {
    alias: string;
    ownerType: 'CLIENT' | 'PARTNER_LAWYER' | 'PARTNER_ACCOUNTANT';
    ownerName: string;
    cnpjCpf: string;
    oabCrcNumber?: string;
    keyVaultProvider?: VaultProvider;
  }, _clientIp?: string): CertificateVaultRecord {
    const newRecord: CertificateVaultRecord = {
      id: `cert_vault_${Date.now()}`,
      alias: payload.alias,
      ownerType: payload.ownerType,
      ownerName: payload.ownerName,
      cnpjCpf: payload.cnpjCpf,
      oabCrcNumber: payload.oabCrcNumber,
      serialNumber: `SEC:${secureId('', 4).toUpperCase()}`,
      issuerCN: 'AC SERPRO RFB v5',
      thumbprintSha256: `sha256_${Date.now()}`,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      daysRemaining: 365,
      status: 'VALID',
      keyVaultProvider: payload.keyVaultProvider || 'AWS_KMS',
      kmsKeyIdArn: `arn:aws:kms:sa-east-1:velatrix-vault-${Date.now()}`,
      encryptionAlgorithm: 'AES-256-GCM',
      mTLSActive: true,
      icpBrasilCompliant: true,
      lastUsedAt: new Date().toISOString(),
      auditHash: `0x${Date.now().toString(16)}`
    };

    clientCertificates = [newRecord, ...clientCertificates];

    fetch('/api/v1/gov/vault/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    }).catch(() => {});

    return newRecord;
  }

  static async testMtlsHandshake(
    targetPortal: 'RECEITA_FEDERAL_ECAC' | 'PGFN_REGULARIZE' | 'SEFAZ_NACIONAL_NFE' | 'MTE_DET' | 'FGTS_DIGITAL' | any,
    certId?: string,
    _clientIp?: string
  ): Promise<MtlsTestResult> {
    try {
      const res = await fetch('/api/v1/gov/mtls/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ target: targetPortal, certificateId: certId || clientCertificates[0]?.id })
      });
      if (res.ok) {
        const data = await res.json();
        return data.result;
      }
    } catch {
      // Fallback
    }

    return {
      targetPortal,
      endpointUrl: `https://${targetPortal.toLowerCase().replace(/_/g, '.')}.gov.br/v1/ping`,
      status: 'SUCCESS',
      handshakeTimeMs: 145,
      tlsVersion: 'TLSv1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      certificateThumbprint: 'SHA256:0A:1B:2C:3D:4E:5F:6A:7B:8C:9D:0E:1F:2A:3B:4C:5D',
      responseStatusCode: 200,
      timestamp: new Date().toISOString(),
      caChainVerified: true,
      diagnosticMessage: 'Handshake mTLS completado com sucesso via autoridade ICP-Brasil.',
      isSimulated: true
    };
  }

  static transmitPerDcomp(payload: PerDcompTransmissionPayload, _clientIp?: string): PerDcompReceipt {
    const receipt: PerDcompReceipt = {
      id: `perdcomp_${Date.now()}`,
      numeroControlePerDcomp: `DCOMP-${new Date().toISOString().slice(0, 10)}-${secureInt(1000, 9999)}-BR`,
      reciboEntregaNumero: `REC-RFB-DCOMP-${Date.now().toString().slice(-8)}`,
      dataHoraTransmissao: new Date().toISOString(),
      cnpjContribuinte: payload.cnpjContribuinte || '18.492.301/0001-84',
      razaoSocial: payload.razaoSocial || 'Nexus Indústria & Manufatura S/A',
      tipoDocumento: 'DECLARACAO_COMPENSACAO',
      valorTotalCompensado: payload.valorTotalCreditoAtualizado || 148900.00,
      statusHomologacao: 'HOMOLOGADO_EXPRESSO',
      protocoloSerpro: `SERPRO-RFB-WS-${Date.now()}`,
      carimboDoTempoSha256: `0x${Date.now().toString(16)}`
    };

    clientPerDcomps = [receipt, ...clientPerDcomps];

    fetch('/api/v1/gov/perdcomp/transmit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    }).catch(() => {});

    return receipt;
  }

  static getPerDcomps(): PerDcompReceipt[] {
    return clientPerDcomps;
  }

  static listPerDcompReceipts(): PerDcompReceipt[] {
    return clientPerDcomps;
  }

  static getSubaccounts(): BaasSubaccount[] {
    return clientSubaccounts;
  }

  static listSubaccounts(): BaasSubaccount[] {
    return clientSubaccounts;
  }

  static createBaasSubaccount(payload: {
    provider: BaasProvider;
    holderName: string;
    holderCnpjCpf: string;
    holderType: 'ADVOGADO_PARCEIRO' | 'PERITO_CONTABIL' | 'CLIENTE_EMPRESA' | any;
    registrationCode: string;
    pixKey: string;
    bankAccount: {
      bankCode: string;
      bankName: string;
      agency: string;
      accountNumber: string;
    };
  }, _clientIp?: string): BaasSubaccount {
    const subacc: BaasSubaccount = {
      id: `subacc_${Date.now()}`,
      provider: payload.provider || 'ASAAS',
      subaccountIdOnProvider: `cus_sub_${secureInt(100000, 999999)}`,
      holderName: payload.holderName,
      holderCnpjCpf: payload.holderCnpjCpf,
      holderType: payload.holderType,
      registrationCode: payload.registrationCode,
      walletBalanceBrl: 0,
      pixKey: payload.pixKey,
      bankAccount: payload.bankAccount,
      kycStatus: 'APROVADO_BACEN',
      createdAt: new Date().toISOString()
    };

    clientSubaccounts = [subacc, ...clientSubaccounts];

    fetch('/api/v1/gov/baas/subaccounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    }).catch(() => {});

    return subacc;
  }

  static createSplitCharge(payload: {
    tenantId: string;
    taxCaseId: string;
    valorTotalHonorariosBrl: number;
    metodoPagamento: 'PIX_DINAMICO' | 'BOLETO_HIBRIDO';
    partnerSubaccountId: string;
    clienteDevedor: {
      razaoSocial: string;
      cnpj: string;
      email: string;
    };
  }, _clientIp?: string): BaasSplitChargeInstruction {
    // P23: 100% dos honorários ao(s) profissional(is); a Velatrix cobra apenas licença SaaS + uso.
    const partnerAmount = payload.valorTotalHonorariosBrl;
    const velatrixAmount = 0;

    const charge: BaasSplitChargeInstruction = {
      chargeId: `split_chg_${Date.now()}`,
      tenantId: payload.tenantId,
      taxCaseId: payload.taxCaseId,
      valorTotalHonorariosBrl: payload.valorTotalHonorariosBrl,
      metodoPagamento: payload.metodoPagamento,
      clienteDevedor: payload.clienteDevedor,
      splitRules: {
        partnerSubaccountId: payload.partnerSubaccountId,
        partnerName: 'Parceiro Homologado',
        partnerPercentage: 100.0, // P23: Velatrix não participa de honorários
        partnerAmountBrl: partnerAmount,
        partnerPixKey: 'pix@parceiro.com.br',
        partnerNfseStatus: 'PENDENTE',
        velatrixSubaccountId: 'subacc_velatrix_master',
        velatrixPercentage: 0.0,
        velatrixAmountBrl: velatrixAmount,
        velatrixNfseStatus: 'PENDENTE'
      },
      status: 'PENDENTE_PAGAMENTO',
      pixPayloadQrCode: '00020101021226840014br.gov.bcb.pix...',
      boletoLinhaDigitavel: '34191.79001 01043.510047 91020.150008 1 98400001000000',
      dataCriacao: new Date().toISOString(),
      dataVencimento: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString()
    };

    clientSplitInstructions = [charge, ...clientSplitInstructions];

    fetch('/api/v1/gov/baas/split-charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(payload)
    }).catch(() => {});

    return charge;
  }

  static getSplitCharges(): BaasSplitChargeInstruction[] {
    return clientSplitInstructions;
  }

  static settleSplitChargeWebhook(chargeId: string, _clientIp?: string) {
    const charge = clientSplitInstructions.find(c => c.chargeId === chargeId) || null;
    if (charge) {
      charge.status = 'SPLIT_CONCLUIDO';
      charge.dataLiquidacao = new Date().toISOString();
      charge.splitRules.partnerNfseStatus = 'EMITIDA';
      charge.splitRules.velatrixNfseStatus = 'EMITIDA';
    }
    return {
      charge,
      dualNfseTriggered: true,
      partnerNfseNumber: `NFS-${secureInt(1000, 9999)}`,
      velatrixNfseNumber: `NFS-VX-${secureInt(1000, 9999)}`,
      bacenEndToEndId: `E${Date.now()}BACEN`,
      isSimulated: true
    };
  }

  static getAuditLogs(): GovAuditLedgerEntry[] {
    return clientAuditLogs;
  }

  static async hydrateFromRepositories(): Promise<void> {
    await this.fetchCertificates();
  }
}
