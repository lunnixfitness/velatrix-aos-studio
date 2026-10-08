/**
 * Service for Notas Fiscais de Serviços (NFS-e) in Velatrix AOS
 * Implements business rules for:
 * - Recurring SaaS vs Tax Recovery Success Fee distinction
 * - Partner Split rule: Velatrix NFS-e tax base is ONLY Velatrix's net retained amount
 * - XML / PDF generation & Municipal SEFAZ/ABRASF response simulation
 */

import { NfseItem, NfseEventLog, NfseSummaryMetrics, NfseOperationType } from '../types/nfse';
import { secureId, secureInt } from '../lib/demoMode';

// Initial Mock Seed Data
export const INITIAL_MOCK_NFSE_ITEMS: NfseItem[] = [
  {
    id: 'OP-2026-9812',
    tenantId: 'tenant_nexus_01',
    clientName: 'Nexus Indústria & Manufatura S/A',
    cnpj: '18.492.301/0001-84',
    inscricaoMunicipal: '9.481.022-1',
    tomadorEmail: 'fiscal@nexusindustria.com.br',
    tomadorEndereco: 'Av. das Nações Unidas, 14200 - São Paulo, SP',
    tomadorCidadeUf: 'São Paulo/SP',
    operationType: 'SAAS_SUBSCRIPTION',
    operationDescription: 'Licenciamento mensal de software Velatrix AOS - Agentes Autônomos de Auditoria e Inteligência Operacional',
    cnae: '6203-1/00',
    itemListaServico: '01.05 - Licenciamento ou cessão de direito de uso de programas de computação',
    paymentDate: '2026-08-25',
    grossAmountBrl: 45000.00,
    partnerSplitPct: 0,
    partnerSplitAmountBrl: 0,
    velatrixRetainedAmountBrl: 45000.00,
    issRatePct: 2.0,
    issAmountBrl: 900.00,
    nfseNumber: 'NFS-e 2026/0009412',
    rpsNumber: 'RPS-8412',
    rpsSerie: 'VEL',
    verificationCode: '8F2A-9C3E-10D4',
    status: 'EMITIDA',
    emissionDate: '2026-08-25 10:14:22',
    municipalResponse: {
      protocolo: 'PROT-SP-20260825-9941284',
      codigoRetorno: '100 - Autorizado o uso da NFS-e',
      mensagemSEFAZ: 'Lote de RPS processado com sucesso. RPS convertido em NFS-e.',
      dataAutorizacao: '2026-08-25T10:14:22.410-03:00',
      linkVerificacaoPrefeitura: 'https://nfe.prefeitura.sp.gov.br/verificacao?cod=8F2A9C3E10D4',
      xmlDigestSha256: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d',
      ambienteEmissao: 'PRODUCAO',
      prefeitura: 'Prefeitura do Município de São Paulo / SP',
      dadosTributarios: {
        naturezaOperacao: 'Tributação no Município de São Paulo',
        regimeEspecialTributacao: 'Nenhum (Lucro Presumido / Real)',
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        baseCalculoVelatrixBrl: 45000.00,
        aliquotaIss: 0.02,
        issDevidoBrl: 900.00,
        pisRetidoBrl: 292.50,
        cofinsRetidoBrl: 1350.00,
        csllRetidoBrl: 450.00,
        irrfRetidoBrl: 675.00
      }
    }
  },
  {
    id: 'OP-2026-9815',
    tenantId: 'tenant_agro_02',
    clientName: 'Cerrado Grãos & Bioenergia Corp',
    cnpj: '03.882.119/0001-20',
    inscricaoMunicipal: '3.190.482-9',
    tomadorEmail: 'controladoria@cerradograos.agr.br',
    tomadorEndereco: 'Rodovia BR-163, Km 214 - Rondonópolis, MT',
    tomadorCidadeUf: 'Rondonópolis/MT',
    operationType: 'TAX_RECOVERY_SUCCESS_FEE',
    operationDescription: 'Honorários de êxito sobre compensação tributária retroativa de créditos PIS/COFINS (Tema 69 STF) - Período apurado D+0',
    cnae: '6920-6/02',
    itemListaServico: '17.01 - Assessoria ou consultoria de qualquer natureza',
    paymentDate: '2026-08-26',
    grossAmountBrl: 280000.00,
    partnerSplitPct: 40,
    partnerSplitAmountBrl: 112000.00,
    partnerName: 'Vasconcelos & Associados Advocacia Tributária',
    partnerCnpj: '22.901.442/0001-90',
    velatrixRetainedAmountBrl: 168000.00, // Regra de Negócio: NFS-e Velatrix incide APENAS sobre os 60% líquidos
    issRatePct: 5.0,
    issAmountBrl: 8400.00,
    nfseNumber: 'NFS-e 2026/0009413',
    rpsNumber: 'RPS-8413',
    rpsSerie: 'VEL',
    verificationCode: '4C91-7B22-88E1',
    status: 'EMITIDA',
    emissionDate: '2026-08-26 14:32:05',
    municipalResponse: {
      protocolo: 'PROT-SP-20260826-1184910',
      codigoRetorno: '100 - Autorizado o uso da NFS-e',
      mensagemSEFAZ: 'NFS-e emitida com sucesso sobre base líquida retida de co-participação contratual.',
      dataAutorizacao: '2026-08-26T14:32:05.105-03:00',
      linkVerificacaoPrefeitura: 'https://nfe.prefeitura.sp.gov.br/verificacao?cod=4C917B2288E1',
      xmlDigestSha256: '0x3d941829e0fa919421cae9310842bbda748201a019488bca7791240182910cbe',
      ambienteEmissao: 'PRODUCAO',
      prefeitura: 'Prefeitura do Município de São Paulo / SP',
      dadosTributarios: {
        naturezaOperacao: 'Tributação no Município de São Paulo',
        regimeEspecialTributacao: 'Nenhum (Lucro Presumido / Real)',
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        baseCalculoVelatrixBrl: 168000.00, // Exclusivamente a parcela líquida Velatrix
        aliquotaIss: 0.05,
        issDevidoBrl: 8400.00,
        pisRetidoBrl: 1092.00,
        cofinsRetidoBrl: 5040.00,
        csllRetidoBrl: 1680.00,
        irrfRetidoBrl: 2520.00
      }
    }
  },
  {
    id: 'OP-2026-9818',
    tenantId: 'tenant_pharma_03',
    clientName: 'Biolab Farma Distribuidora S/A',
    cnpj: '11.029.384/0001-95',
    inscricaoMunicipal: '4.881.019-8',
    tomadorEmail: 'nfe@biolabfarma.com.br',
    tomadorEndereco: 'Av. Dr. Chucri Zaidan, 1550 - São Paulo, SP',
    tomadorCidadeUf: 'São Paulo/SP',
    operationType: 'SAAS_SUBSCRIPTION',
    operationDescription: 'Licenciamento mensal de software Velatrix AOS - Monitoramento Contínuo SPED e Defesa Fiscal',
    cnae: '6203-1/00',
    itemListaServico: '01.05 - Licenciamento ou cessão de direito de uso de programas de computação',
    paymentDate: '2026-08-27',
    grossAmountBrl: 38000.00,
    partnerSplitPct: 0,
    partnerSplitAmountBrl: 0,
    velatrixRetainedAmountBrl: 38000.00,
    issRatePct: 2.0,
    issAmountBrl: 760.00,
    nfseNumber: 'NFS-e 2026/0009414',
    rpsNumber: 'RPS-8414',
    rpsSerie: 'VEL',
    verificationCode: '1A7F-990D-22CB',
    status: 'EMITIDA',
    emissionDate: '2026-08-27 09:40:18',
    municipalResponse: {
      protocolo: 'PROT-SP-20260827-0091842',
      codigoRetorno: '100 - Autorizado o uso da NFS-e',
      mensagemSEFAZ: 'Lote de RPS transmitido e homologado.',
      dataAutorizacao: '2026-08-27T09:40:18.820-03:00',
      linkVerificacaoPrefeitura: 'https://nfe.prefeitura.sp.gov.br/verificacao?cod=1A7F990D22CB',
      xmlDigestSha256: '0x1a7f990d22cb491829e0fa919421cae9310842bbda748201a019488bca779124',
      ambienteEmissao: 'PRODUCAO',
      prefeitura: 'Prefeitura do Município de São Paulo / SP',
      dadosTributarios: {
        naturezaOperacao: 'Tributação no Município de São Paulo',
        regimeEspecialTributacao: 'Nenhum',
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        baseCalculoVelatrixBrl: 38000.00,
        aliquotaIss: 0.02,
        issDevidoBrl: 760.00,
        pisRetidoBrl: 247.00,
        cofinsRetidoBrl: 1140.00,
        csllRetidoBrl: 380.00,
        irrfRetidoBrl: 570.00
      }
    }
  },
  {
    id: 'OP-2026-9820',
    tenantId: 'tenant_varejo_04',
    clientName: 'OmniVarejo Brasil Logística EIRELI',
    cnpj: '24.781.990/0001-43',
    inscricaoMunicipal: '8.190.220-4',
    tomadorEmail: 'financeiro@omnivarejo.com.br',
    tomadorEndereco: 'Rua Bela Cintra, 890 - São Paulo, SP',
    tomadorCidadeUf: 'São Paulo/SP',
    operationType: 'TAX_RECOVERY_SUCCESS_FEE',
    operationDescription: 'Success Fee sobre exclusão do ICMS da base de cálculo do PIS/COFINS e créditos de subvenção de investimento',
    cnae: '6920-6/02',
    itemListaServico: '17.01 - Assessoria ou consultoria de qualquer natureza',
    paymentDate: '2026-08-28',
    grossAmountBrl: 195000.00,
    partnerSplitPct: 30,
    partnerSplitAmountBrl: 58500.00,
    partnerName: 'Pinheiro & Machado Consultores Tributários',
    partnerCnpj: '08.771.902/0001-11',
    velatrixRetainedAmountBrl: 136500.00, // 70% retido Velatrix
    issRatePct: 5.0,
    issAmountBrl: 6825.00,
    nfseNumber: 'Em Fila SEFAZ',
    rpsNumber: 'RPS-8415',
    rpsSerie: 'VEL',
    verificationCode: 'PENDENTE',
    status: 'PROCESSANDO',
    emissionDate: '2026-08-28 16:10:00',
    municipalResponse: {
      protocolo: 'PROT-SP-20260828-881920',
      codigoRetorno: '102 - Lote em processamento no Webhook Municipal',
      mensagemSEFAZ: 'Aguardando validação assíncrona da SEFAZ Paulistana.',
      dataAutorizacao: '2026-08-28T16:10:00.000-03:00',
      linkVerificacaoPrefeitura: 'https://nfe.prefeitura.sp.gov.br/consulta-lote?prot=PROT-SP-20260828-881920',
      xmlDigestSha256: '0x992019488bca7791240182910cbe3d941829e0fa919421cae9310842bbda7482',
      ambienteEmissao: 'PRODUCAO',
      prefeitura: 'Prefeitura do Município de São Paulo / SP',
      dadosTributarios: {
        naturezaOperacao: 'Tributação no Município de São Paulo',
        regimeEspecialTributacao: 'Nenhum',
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        baseCalculoVelatrixBrl: 136500.00,
        aliquotaIss: 0.05,
        issDevidoBrl: 6825.00,
        pisRetidoBrl: 887.25,
        cofinsRetidoBrl: 4095.00,
        csllRetidoBrl: 1365.00,
        irrfRetidoBrl: 2047.50
      }
    }
  },
  {
    id: 'OP-2026-9822',
    tenantId: 'tenant_minera_05',
    clientName: 'Siderurgia & Mineração Vale Verde S.A.',
    cnpj: '07.319.482/0001-66',
    inscricaoMunicipal: 'DIVERGENTE_CCM',
    tomadorEmail: 'contabilidade@valeverdemin.com.br',
    tomadorEndereco: 'Av. Afonso Pena, 3100 - Belo Horizonte, MG',
    tomadorCidadeUf: 'Belo Horizonte/MG',
    operationType: 'TAX_RECOVERY_SUCCESS_FEE',
    operationDescription: 'Honorários de auditoria pericial e transação tributária extraordinária PGFN',
    cnae: '6920-6/02',
    itemListaServico: '17.01 - Assessoria ou consultoria de qualquer natureza',
    paymentDate: '2026-08-29',
    grossAmountBrl: 420000.00,
    partnerSplitPct: 40,
    partnerSplitAmountBrl: 168000.00,
    partnerName: 'Duarte & Advogados Associados',
    partnerCnpj: '19.481.002/0001-77',
    velatrixRetainedAmountBrl: 252000.00,
    issRatePct: 5.0,
    issAmountBrl: 12600.00,
    nfseNumber: 'Rejeitada SEFAZ',
    rpsNumber: 'RPS-8416',
    rpsSerie: 'VEL',
    verificationCode: 'FALHA-CCM',
    status: 'REJEITADA',
    rejectionReason: 'Erro E42: Inscrição Municipal do Tomador não informada ou divergente no cadastro de contribuintes de outro município (CPOM).',
    emissionDate: '2026-08-29 11:20:45',
    municipalResponse: {
      protocolo: 'PROT-ERR-20260829-00124',
      codigoRetorno: 'E42 - Inscrição Municipal / CPOM Inválido',
      mensagemSEFAZ: 'Rejeição: Código de prestação de serviços fora do município exige validação de retenção na fonte ou cadastro CPOM.',
      dataAutorizacao: '2026-08-29T11:20:45.000-03:00',
      linkVerificacaoPrefeitura: 'https://nfe.prefeitura.sp.gov.br/ajuda/erros#E42',
      xmlDigestSha256: '0x0000000000000000000000000000000000000000000000000000000000000000',
      ambienteEmissao: 'PRODUCAO',
      prefeitura: 'Prefeitura do Município de São Paulo / SP',
      dadosTributarios: {
        naturezaOperacao: 'Tributação com Retenção de ISS',
        regimeEspecialTributacao: 'Nenhum',
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        baseCalculoVelatrixBrl: 252000.00,
        aliquotaIss: 0.05,
        issDevidoBrl: 12600.00,
        pisRetidoBrl: 1638.00,
        cofinsRetidoBrl: 7560.00,
        csllRetidoBrl: 2520.00,
        irrfRetidoBrl: 3780.00
      }
    }
  }
];

export const INITIAL_MOCK_NFSE_EVENT_LOGS: NfseEventLog[] = [
  {
    id: 'evt_101',
    nfseId: 'OP-2026-9812',
    timestamp: '2026-08-25 10:14:10',
    eventType: 'PAYMENT_LIQUIDATED',
    description: 'Liquidação bancária confirmada via PIX Gateway (R$ 45.000,00 - Nexus Indústria).',
    source: 'BANKING_GATEWAY_PIX',
    status: 'SUCCESS'
  },
  {
    id: 'evt_102',
    nfseId: 'OP-2026-9812',
    timestamp: '2026-08-25 10:14:15',
    eventType: 'SPLIT_CALCULATED',
    description: 'Operação de Licenciamento SaaS (100% Velatrix - sem split de comissão). Base NFS-e: R$ 45.000,00.',
    source: 'VELATRIX_SPLIT_CALCULATOR',
    status: 'SUCCESS'
  },
  {
    id: 'evt_103',
    nfseId: 'OP-2026-9812',
    timestamp: '2026-08-25 10:14:22',
    eventType: 'SEFAZ_AUTHORIZED',
    description: 'NFS-e 2026/0009412 emitida e autorizada pela Prefeitura de SP. Código: 8F2A-9C3E-10D4.',
    source: 'PREFEITURA_SP_SEFAZ',
    status: 'SUCCESS'
  },
  {
    id: 'evt_201',
    nfseId: 'OP-2026-9815',
    timestamp: '2026-08-26 14:31:50',
    eventType: 'PAYMENT_LIQUIDATED',
    description: 'Liquidação de Success Fee recebida (R$ 280.000,00 - Cerrado Grãos Corp).',
    source: 'ESCROW_SETTLEMENT_HUB',
    status: 'SUCCESS'
  },
  {
    id: 'evt_202',
    nfseId: 'OP-2026-9815',
    timestamp: '2026-08-26 14:31:55',
    eventType: 'SPLIT_CALCULATED',
    description: 'Regra de Split de Parceiro: 40% (R$ 112.000) repassado a Vasconcelos Advogados. Base NFS-e Velatrix: R$ 168.000,00 (60%).',
    source: 'VELATRIX_SPLIT_CALCULATOR',
    status: 'SUCCESS'
  },
  {
    id: 'evt_203',
    nfseId: 'OP-2026-9815',
    timestamp: '2026-08-26 14:32:05',
    eventType: 'SEFAZ_AUTHORIZED',
    description: 'NFS-e 2026/0009413 autorizada com sucesso. ISS apurado R$ 8.400,00 (5%).',
    source: 'PREFEITURA_SP_SEFAZ',
    status: 'SUCCESS'
  },
  {
    id: 'evt_301',
    nfseId: 'OP-2026-9822',
    timestamp: '2026-08-29 11:20:45',
    eventType: 'REJECTION_ERROR',
    description: 'Falha na autorização: Erro E42 (CPOM / Inscrição Municipal divergente). Retransmissão pendente de saneamento.',
    source: 'PREFEITURA_SP_SEFAZ',
    status: 'ERROR'
  }
];

export class NfseService {
  private static items: NfseItem[] = [...INITIAL_MOCK_NFSE_ITEMS];
  private static eventLogs: NfseEventLog[] = [...INITIAL_MOCK_NFSE_EVENT_LOGS];

  /**
   * Returns current list of NFS-e
   */
  public static getAllNfse(): NfseItem[] {
    return [...this.items];
  }

  /**
   * Returns event logs
   */
  public static getEventLogs(): NfseEventLog[] {
    return [...this.eventLogs];
  }

  /**
   * Calculate summary metrics
   */
  public static getSummaryMetrics(): NfseSummaryMetrics {
    const totalGrossBilledBrl = this.items.reduce((sum, item) => sum + item.grossAmountBrl, 0);
    const totalVelatrixNetBrl = this.items.reduce((sum, item) => sum + item.velatrixRetainedAmountBrl, 0);
    const emittedItems = this.items.filter(i => i.status === 'EMITIDA');
    const totalEmittedCount = emittedItems.length;
    const totalEmittedValueBrl = emittedItems.reduce((sum, i) => sum + i.velatrixRetainedAmountBrl, 0);
    const pendingCount = this.items.filter(i => i.status === 'PROCESSANDO').length;
    const rejectedCount = this.items.filter(i => i.status === 'REJEITADA').length;

    return {
      totalGrossBilledBrl,
      totalVelatrixNetBrl,
      totalEmittedCount,
      totalEmittedValueBrl,
      pendingCount,
      rejectedCount,
      nextClosingBatchDate: '05/09/2026',
      nextClosingBatchName: 'Lote Mensal D+5 SEFAZ Paulistana / ABRASF'
    };
  }

  /**
   * Trigger payment liquidation and automatic emission
   */
  public static triggerPaymentLiquidation(params: {
    clientName: string;
    cnpj: string;
    grossAmountBrl: number;
    operationType: NfseOperationType;
    partnerSplitPct?: number;
    partnerName?: string;
    partnerCnpj?: string;
  }): NfseItem {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const opId = `OP-2026-${secureInt(1000, 9999)}`;

    const isSaaS = params.operationType === 'SAAS_SUBSCRIPTION';
    const partnerPct = isSaaS ? 0 : (params.partnerSplitPct ?? 40);
    const partnerSplitAmount = (params.grossAmountBrl * partnerPct) / 100;
    
    // BUSINESS RULE: Velatrix NFS-e is issued ONLY on Velatrix's net share
    const velatrixRetainedAmount = params.grossAmountBrl - partnerSplitAmount;
    
    const issRatePct = isSaaS ? 2.0 : 5.0;
    const issAmountBrl = (velatrixRetainedAmount * issRatePct) / 100;
    
    const nextNfseNum = 9415 + this.items.length;
    const nfseNumber = `NFS-e 2026/000${nextNfseNum}`;
    const rpsNumber = `RPS-${8415 + this.items.length}`;
    const verificationCode = `${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}`;
    const hash = `0x${Array.from({ length: 64 }, () => secureInt(0, 15).toString(16)).join('')}`;

    const newItem: NfseItem = {
      id: opId,
      tenantId: 'tenant_custom',
      clientName: params.clientName,
      cnpj: params.cnpj,
      inscricaoMunicipal: '7.891.204-0',
      tomadorEmail: `financeiro@${params.clientName.toLowerCase().replace(/\s+/g, '')}.com.br`,
      tomadorEndereco: 'Av. Paulista, 1000 - São Paulo, SP',
      tomadorCidadeUf: 'São Paulo/SP',
      operationType: params.operationType,
      operationDescription: isSaaS
        ? 'Licenciamento mensal de software Velatrix AOS - Agentes Autônomos de Auditoria e Inteligência Operacional'
        : 'Honorários de êxito sobre apuração e compensação tributária 60 meses (Tema 69 / PGFN)',
      cnae: isSaaS ? '6203-1/00' : '6920-6/02',
      itemListaServico: isSaaS
        ? '01.05 - Licenciamento ou cessão de direito de uso de programas de computação'
        : '17.01 - Assessoria ou consultoria de qualquer natureza',
      paymentDate: now.toISOString().slice(0, 10),
      grossAmountBrl: params.grossAmountBrl,
      partnerSplitPct: partnerPct,
      partnerSplitAmountBrl: partnerSplitAmount,
      partnerName: isSaaS ? undefined : (params.partnerName || 'Escritório Parceiro Homologado'),
      partnerCnpj: isSaaS ? undefined : (params.partnerCnpj || '19.481.002/0001-77'),
      velatrixRetainedAmountBrl: velatrixRetainedAmount,
      issRatePct,
      issAmountBrl,
      nfseNumber,
      rpsNumber,
      rpsSerie: 'VEL',
      verificationCode,
      status: 'EMITIDA',
      emissionDate: timestamp,
      municipalResponse: {
        protocolo: `PROT-SP-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${secureInt(100000, 999999)}`,
        codigoRetorno: '100 - Autorizado o uso da NFS-e',
        mensagemSEFAZ: isSaaS
          ? 'NFS-e de Licenciamento SaaS emitida com sucesso na Prefeitura de São Paulo.'
          : `NFS-e de Success Fee autorizada sobre a parcela líquida Velatrix (R$ ${velatrixRetainedAmount.toLocaleString('pt-BR')}) com split de ${partnerPct}% registrado.`,
        dataAutorizacao: now.toISOString(),
        linkVerificacaoPrefeitura: `https://nfe.prefeitura.sp.gov.br/verificacao?cod=${verificationCode.replace(/-/g, '')}`,
        xmlDigestSha256: hash,
        ambienteEmissao: 'PRODUCAO',
        prefeitura: 'Prefeitura do Município de São Paulo / SP',
        dadosTributarios: {
          naturezaOperacao: 'Tributação no Município de São Paulo',
          regimeEspecialTributacao: 'Nenhum (Lucro Presumido / Real)',
          optanteSimplesNacional: false,
          incentivadorCultural: false,
          baseCalculoVelatrixBrl: velatrixRetainedAmount,
          aliquotaIss: issRatePct / 100,
          issDevidoBrl: issAmountBrl,
          pisRetidoBrl: (velatrixRetainedAmount * 0.0065),
          cofinsRetidoBrl: (velatrixRetainedAmount * 0.03),
          csllRetidoBrl: (velatrixRetainedAmount * 0.01),
          irrfRetidoBrl: (velatrixRetainedAmount * 0.015)
        }
      }
    };

    // Add to items list
    this.items = [newItem, ...this.items];

    // Log events
    this.eventLogs = [
      {
        id: `evt_${Date.now()}_1`,
        nfseId: opId,
        timestamp,
        eventType: 'PAYMENT_LIQUIDATED',
        description: `Liquidação bancária de R$ ${params.grossAmountBrl.toLocaleString('pt-BR')} confirmada para "${params.clientName}".`,
        source: 'BANKING_GATEWAY_PIX',
        status: 'SUCCESS'
      },
      {
        id: `evt_${Date.now()}_2`,
        nfseId: opId,
        timestamp,
        eventType: 'SPLIT_CALCULATED',
        description: isSaaS 
          ? `Operação SaaS Integral: Base de Cálculo NFS-e Velatrix R$ ${velatrixRetainedAmount.toLocaleString('pt-BR')} (Alíquota ISS 2%).`
          : `Split Aplicado: Parceiro recebe ${partnerPct}% (R$ ${partnerSplitAmount.toLocaleString('pt-BR')}) | Base NFS-e Velatrix R$ ${velatrixRetainedAmount.toLocaleString('pt-BR')} (Alíquota ISS 5%).`,
        source: 'VELATRIX_SPLIT_CALCULATOR',
        status: 'SUCCESS'
      },
      {
        id: `evt_${Date.now()}_3`,
        nfseId: opId,
        timestamp,
        eventType: 'SEFAZ_AUTHORIZED',
        description: `NFS-e ${nfseNumber} autorizada pela Prefeitura de SP com código de autenticidade ${verificationCode}.`,
        source: 'PREFEITURA_SP_SEFAZ',
        status: 'SUCCESS'
      },
      ...this.eventLogs
    ];

    return newItem;
  }

  /**
   * Manual re-emission for rejected or processing NFS-e
   */
  public static manualReemit(nfseId: string): { success: boolean; item?: NfseItem; message: string } {
    const itemIndex = this.items.findIndex(i => i.id === nfseId);
    if (itemIndex === -1) {
      return { success: false, message: 'Operação NFS-e não localizada.' };
    }

    const item = this.items[itemIndex];
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;
    const newVerificationCode = `${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}-${secureId('', 4).toUpperCase()}`;
    const nextNfseNum = 9420 + secureInt(0, 99);

    const updatedItem: NfseItem = {
      ...item,
      status: 'EMITIDA',
      nfseNumber: item.nfseNumber.includes('NFS-e') ? item.nfseNumber : `NFS-e 2026/000${nextNfseNum}`,
      verificationCode: newVerificationCode,
      emissionDate: timestamp,
      rejectionReason: undefined,
      inscricaoMunicipal: item.inscricaoMunicipal === 'DIVERGENTE_CCM' ? '5.918.204-1' : item.inscricaoMunicipal,
      municipalResponse: {
        ...item.municipalResponse,
        protocolo: `PROT-REEMIT-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${secureInt(100000, 999999)}`,
        codigoRetorno: '100 - Autorizado o uso da NFS-e após saneamento cadastral',
        mensagemSEFAZ: 'Reemissão manual aprovada. Retenção e dados cadastrais validados com a base municipal.',
        dataAutorizacao: now.toISOString(),
        linkVerificacaoPrefeitura: `https://nfe.prefeitura.sp.gov.br/verificacao?cod=${newVerificationCode.replace(/-/g, '')}`
      }
    };

    this.items[itemIndex] = updatedItem;

    this.eventLogs = [
      {
        id: `evt_reemit_${Date.now()}`,
        nfseId,
        timestamp,
        eventType: 'MANUAL_REEMISSION',
        description: `Reemissão manual executada com sucesso para ${item.clientName}. Novo código: ${newVerificationCode}.`,
        source: 'AOS_ADMIN_CONTADOR',
        status: 'SUCCESS'
      },
      ...this.eventLogs
    ];

    return {
      success: true,
      item: updatedItem,
      message: `NFS-e ${updatedItem.nfseNumber} reemitida e autorizada com sucesso na SEFAZ Municipal!`
    };
  }

  /**
   * Resend NFS-e by Email
   */
  public static resendNfseEmail(nfseId: string): { success: boolean; message: string } {
    const item = this.items.find(i => i.id === nfseId);
    if (!item) return { success: false, message: 'NFS-e não encontrada' };

    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 8)}`;

    this.eventLogs = [
      {
        id: `evt_email_${Date.now()}`,
        nfseId,
        timestamp,
        eventType: 'EMAIL_DISPATCHED',
        description: `DANFSE (PDF) e XML ABRASF reenviados com sucesso para o tomador: ${item.tomadorEmail}`,
        source: 'AOS_NOTIFICATION_SMTP',
        status: 'SUCCESS'
      },
      ...this.eventLogs
    ];

    return {
      success: true,
      message: `Documento fiscal (${item.nfseNumber}) e XML ABRASF despachados com sucesso para ${item.tomadorEmail}.`
    };
  }

  /**
   * Generates ABRASF-compliant XML string for download
   */
  public static generateNfseXmlString(item: NfseItem): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CompNfse xmlns="http://www.abrasf.org.br/nfse.xsd">
  <Nfse versao="2.04">
    <InfNfse Id="NFS${item.verificationCode.replace(/-/g, '')}">
      <Numero>${item.nfseNumber.replace(/\D/g, '') || '9412'}</Numero>
      <CodigoVerificacao>${item.verificationCode}</CodigoVerificacao>
      <DataEmissao>${item.emissionDate.replace(' ', 'T')}</DataEmissao>
      <IdentificacaoRps>
        <Numero>${item.rpsNumber.replace(/\D/g, '') || '8412'}</Numero>
        <Serie>${item.rpsSerie}</Serie>
        <Tipo>1</Tipo>
      </IdentificacaoRps>
      <NaturezaOperacao>1</NaturezaOperacao>
      <RegimeEspecialTributacao>0</RegimeEspecialTributacao>
      <OptanteSimplesNacional>2</OptanteSimplesNacional>
      <IncentivadorCultural>2</IncentivadorCultural>
      <Competencia>${item.paymentDate}</Competencia>
      
      <!-- DADOS DO PRESTADOR DO SERVICO (VELATRIX AOS) -->
      <PrestadorServico>
        <IdentificacaoPrestador>
          <CpfCnpj>
            <Cnpj>44182901000152</Cnpj>
          </CpfCnpj>
          <InscricaoMunicipal>78421903</InscricaoMunicipal>
        </IdentificacaoPrestador>
        <RazaoSocial>VELATRIX TECNOLOGIA E SISTEMAS AUTONOMOS S.A.</RazaoSocial>
        <NomeFantasia>VELATRIX AOS</NomeFantasia>
        <Endereco>
          <Endereco>AV BRIGADEIRO FARIA LIMA</Endereco>
          <Numero>4221</Numero>
          <Complemento>ANDAR 18 CONJ 181</Complemento>
          <Bairro>ITAIN BIBI</Bairro>
          <CodigoMunicipio>3550308</CodigoMunicipio>
          <Uf>SP</Uf>
          <Cep>04538133</Cep>
        </Endereco>
        <Contato>
          <Telefone>1130498800</Telefone>
          <Email>fiscal@velatrix.ai</Email>
        </Contato>
      </PrestadorServico>
      
      <!-- DADOS DO TOMADOR DE SERVICOS (CLIENTE) -->
      <TomadorServico>
        <IdentificacaoTomador>
          <CpfCnpj>
            <Cnpj>${item.cnpj.replace(/\D/g, '')}</Cnpj>
          </CpfCnpj>
          <InscricaoMunicipal>${item.inscricaoMunicipal?.replace(/\D/g, '') || '00000000'}</InscricaoMunicipal>
        </IdentificacaoTomador>
        <RazaoSocial>${item.clientName}</RazaoSocial>
        <Endereco>
          <Endereco>${item.tomadorEndereco}</Endereco>
          <Uf>SP</Uf>
        </Endereco>
        <Contato>
          <Email>${item.tomadorEmail}</Email>
        </Contato>
      </TomadorServico>
      
      <!-- DISCRIMINACAO DO SERVICO E VALORES TRIBUTARIOS -->
      <DeclaracaoPrestacaoServico>
        <InfDeclaracaoPrestacaoServico>
          <Servico>
            <Valores>
              <ValorServicos>${item.velatrixRetainedAmountBrl.toFixed(2)}</ValorServicos>
              <ValorDeducoes>0.00</ValorDeducoes>
              <ValorPis>${(item.velatrixRetainedAmountBrl * 0.0065).toFixed(2)}</ValorPis>
              <ValorCofins>${(item.velatrixRetainedAmountBrl * 0.03).toFixed(2)}</ValorCofins>
              <ValorInss>0.00</ValorInss>
              <ValorIr>${(item.velatrixRetainedAmountBrl * 0.015).toFixed(2)}</ValorIr>
              <ValorCsll>${(item.velatrixRetainedAmountBrl * 0.01).toFixed(2)}</ValorCsll>
              <IssRetido>2</IssRetido>
              <ValorIss>${item.issAmountBrl.toFixed(2)}</ValorIss>
              <BaseCalculo>${item.velatrixRetainedAmountBrl.toFixed(2)}</BaseCalculo>
              <Aliquota>${(item.issRatePct / 100).toFixed(4)}</Aliquota>
              <ValorLiquidoNfse>${(item.velatrixRetainedAmountBrl - item.issAmountBrl).toFixed(2)}</ValorLiquidoNfse>
            </Valores>
            <ItemListaServico>${item.itemListaServico.substring(0, 5)}</ItemListaServico>
            <CodigoCnae>${item.cnae.replace(/\D/g, '')}</CodigoCnae>
            <CodigoTributacaoMunicipio>010500100</CodigoTributacaoMunicipio>
            <Discriminacao>${item.operationDescription}
[REGRA DE SPLIT CONTRATUAL]: Valor Bruto da Operação: R$ ${item.grossAmountBrl.toFixed(2)} | Split Parceiro: ${item.partnerSplitPct}% (R$ ${item.partnerSplitAmountBrl.toFixed(2)}) | Parcela Líquida Velatrix Tributada nesta NFS-e: R$ ${item.velatrixRetainedAmountBrl.toFixed(2)}
Protocolo SEFAZ: ${item.municipalResponse.protocolo} | Hash: ${item.municipalResponse.xmlDigestSha256}</Discriminacao>
            <CodigoMunicipio>3550308</CodigoMunicipio>
          </Servico>
        </InfDeclaracaoPrestacaoServico>
      </DeclaracaoPrestacaoServico>
    </InfNfse>
  </Nfse>
</CompNfse>`;
  }

  /**
   * Downloads XML directly in the browser
   */
  public static downloadNfseXml(item: NfseItem): void {
    const xmlContent = this.generateNfseXmlString(item);
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanNum = item.nfseNumber.replace(/\D/g, '') || item.id;
    link.download = `NFSE_${cleanNum}_${item.cnpj.replace(/\D/g, '')}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
