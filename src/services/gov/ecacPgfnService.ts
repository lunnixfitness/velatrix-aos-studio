/**
 * VELATRIX AOS V2 - SERVIÇO DE CONEXÃO RECEITA FEDERAL (e-CAC / SERPRO) & PGFN (REGULARIZE)
 * Gestão de cruzamento fiscal SPED, DCTFWeb, PER/DCOMP e Dívida Ativa da União.
 */

import { sha256Hex } from '../../shared/crypto/hash';
import {
  EcacDeclarationSummary,
  EcacFiscalSituationReport,
  PerDcompTransmissionPayload,
  PerDcompReceipt,
  PgfnActiveDebtItem,
  PgfnCapagHistoryRecord,
  DetNotificationItem,
  SefazXmlScanBatch,
} from '../../types/integrationConnectors';
import {
  savePerDcompReceipt,
  getPerDcompReceiptsSync,
  listPerDcompReceipts,
} from '../../server/repositories/taxCalculationRepository';
import { AuditLedgerService } from './auditLedgerService';
import { secureRandomUUID } from './cryptoUtils';

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
    ],
    tempoProcessamentoMs: 412,
    status: 'CONCLUIDO'
  }
];

export class EcacPgfnService {
  /**
   * [MODO SIMULADO - EMULADOR DE TRANSMISSÃO PER/DCOMP RFB]
   * Transmite declaração de compensação perante a Receita Federal.
   */
  static async transmitPerDcomp(payload: PerDcompTransmissionPayload, clientIp?: string): Promise<PerDcompReceipt> {
    const rawUuid = secureRandomUUID().replace(/-/g, '');
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const controlNumberInt = (parseInt(rawUuid.substring(0, 6), 16) % 9000) + 1000;
    const numeroControle = `DCOMP-${new Date().getFullYear()}.${(new Date().getMonth() + 1).toString().padStart(2, '0')}.${new Date().getDate()}-${controlNumberInt}-BR`;
    const reciboInt = (parseInt(rawUuid.substring(6, 14), 16) % 90000000) + 10000000;
    const reciboNum = `REC-RFB-DCOMP-${reciboInt}`;
    const protocoloInt = (parseInt(rawUuid.substring(14, 22), 16) % 900000000) + 100000000;
    const protocolo = `SERPRO-RFB-WS-${new Date().getFullYear()}-${protocoloInt}`;
    const timeStampHash = await sha256Hex(`${numeroControle}:${reciboNum}:${timestampStr}:${payload.valorTotalCreditoAtualizado}`);

    const cnpjFinal = payload.cnpjContribuinte || '18.492.301/0001-84';
    const razaoFinal = payload.razaoSocial || 'Nexus Indústria & Manufatura S/A';

    const newReceipt: PerDcompReceipt = {
      id: `perdcomp_${Date.now()}_${rawUuid.substring(22, 26)}`,
      numeroControlePerDcomp: numeroControle,
      reciboEntregaNumero: reciboNum,
      dataHoraTransmissao: timestampStr,
      cnpjContribuinte: cnpjFinal,
      razaoSocial: razaoFinal,
      tipoDocumento: 'DECLARACAO_COMPENSACAO',
      valorTotalCompensado: payload.valorCompensadoDctfWebAtual,
      statusHomologacao: 'HOMOLOGADO_EXPRESSO',
      protocoloSerpro: protocolo,
      carimboDoTempoSha256: `0x${timeStampHash}`,
      isSimulated: true
    };

    // Salva no repositório persistente com salvaguarda
    try {
      savePerDcompReceipt(newReceipt).catch(err => {
        console.warn('[EcacPgfnService.transmitPerDcomp] Persist warning:', err);
      });
    } catch (err) {
      console.warn('[EcacPgfnService.transmitPerDcomp] Save catch:', err);
    }

    try {
      AuditLedgerService.createAuditEntry({
        portalGoverno: 'RECEITA_FEDERAL_ECAC',
        endpoint: '/api/v1/perdcomp/transmitir',
        metodoHttp: 'POST',
        cnpjConsultado: cnpjFinal,
        certificadoA1Thumbprint: payload.certificadoThumbprint || '9f82c4b8e21a0d3f8c5b6a719283e401b2a3c4d5e6f708192a3b4c5d6e7f8091',
        httpStatus: 200,
        tempoRespostaMs: 290,
        clientIp
      });
    } catch (err) {
      console.warn('[EcacPgfnService.transmitPerDcomp] Audit catch:', err);
    }

    return newReceipt;
  }

  static getPerDcomps(): PerDcompReceipt[] {
    return getPerDcompReceiptsSync();
  }

  static async listPerDcomps(): Promise<PerDcompReceipt[]> {
    return listPerDcompReceipts();
  }
}

export const transmitPerDcomp = EcacPgfnService.transmitPerDcomp;
export const getPerDcomps = EcacPgfnService.getPerDcomps;
export const listPerDcomps = EcacPgfnService.listPerDcomps;
