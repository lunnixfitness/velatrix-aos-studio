import { secureId, secureInt } from '../lib/demoMode';
// src/services/revenueShieldService.ts
// Motor de Blindagem de Receita, Gate de Pagamento de Split, Prova de Anterioridade e Monitoramento Anti-Circunvenção - Velatrix AOS

export type SplitPaymentStatus = 'PENDENTE_PAGAMENTO' | 'PAGAMENTO_CONFIRMADO' | 'CIRCUNVENCAO_DETECTADA';

export interface ExclusivityAcceptanceRecord {
  id: string;
  cnpj: string;
  companyName: string;
  signatoryName: string;
  signatoryCpf: string;
  signatoryRole: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  exclusivityClauseHash: string;
  status: 'ATIVO_REGISTRADO' | 'REVOGADO';
  legalDraftNote: string;
}

export interface AntiCircumventionCase {
  id: string;
  cnpj: string;
  companyName: string;
  sector: string;
  identifiedCreditAmount: number;
  rfbStatus: 'EM_ANALISE' | 'PROTOCOLADO_ECAC' | 'HOMOLOGADO_RFB' | 'COMPENSADO_DCTFWEB';
  rfbStatusLabel: string;
  splitPaymentStatus: SplitPaymentStatus;
  velatrixSplitAmount: number;
  partnerSplitAmount: number;
  detectionTimestamp: string;
  originProofId: string;
  riskSeverity: 'BAIXO' | 'MEDIO' | 'ALTO_CIRCUNVENCAO';
  alertsHistory: string[];
}

export interface RevenueShieldState {
  isSplitConfirmed: boolean;
  paymentMethod: 'PIX_GATEWAY' | 'BOLETO_ESCROW' | 'CARTAO_CORPORATIVO' | null;
  transactionId: string | null;
  confirmedAt: string | null;
  amountDueVelatrix: number;
  amountDuePartner: number;
  originProofId: string;
  originProofTimestamp: string;
  originProofHash: string;
  exclusivityAccepted: boolean;
  acceptanceRecord: ExclusivityAcceptanceRecord | null;
  antiCircumventionCases: AntiCircumventionCase[];
}

const STORAGE_KEY = 'velatrix_revenue_shield_state_v1';

export const EXCLUSIVITY_CLAUSE_DRAFT_TEXT = `CLÁUSULA DE EXCLUSIVIDADE DE CANAL, ANTERIORIDADE E NÃO-CIRCUNVENÇÃO:

"O Cliente/Parceiro reconhece que os créditos tributários, teses jurídicas e cálculos periciais apresentados através da plataforma Velatrix AOS constituem produto de propriedade intelectual da Velatrix Tecnologia Ltda, identificados e documentados com registro técnico de anterioridade (hash criptográfico e data de geração). Fica estabelecido que qualquer aproveitamento administrativo ou judicial desses créditos, ainda que formalizado ou pago fora dos mecanismos de cobrança da plataforma, gera para a Velatrix o direito à taxa de êxito contratualmente prevista, sujeitando a parte infratora, em caso de comprovada circunvenção de pagamento, à multa compensatória equivalente a 30% (trinta por cento) sobre o valor do crédito homologado, sem prejuízo da cobrança judicial dos valores originalmente devidos."`;

export const EXCLUSIVITY_LEGAL_DISCLAIMER = `(Nota de Governança: Rascunho de cláusula para revisão jurídica especializada em contratos B2B/SaaS e propriedade intelectual, garantindo plena adequação ao termo de uso e à legislação de concorrência).`;

export const PARTNER_SPLIT_AND_LICENSING_CLAUSE_TEXT = `CLÁUSULA DE REMUNERAÇÃO POR ÊXITO, REPARTIÇÃO DE HONORÁRIOS E LICENCIAMENTO DE SOFTWARE:

"1. DOS HONORÁRIOS DE ÊXITO POR RECUPERAÇÃO TRIBUTÁRIA PONTUAL:
Sobre o benefício econômico efetivamente auferido pelo cliente final em virtude da compensação, restituição, transação tributária ou habilitação de créditos homologados perante a Receita Federal do Brasil (RFB) e Procuradoria-Geral da Fazenda Nacional (PGFN), incidirão honorários de êxito ('success fee') que serão partilhados automaticamente na proporção irrevogável de:
   a) 70% (setenta por cento) do valor líquido dos honorários destinados ao PARCEIRO CREDENCIADO (Escritório de Advocacia ou Consultoria Tributária de Originação);
   b) 30% (trinta por cento) do valor líquido dos honorários destinados à VELATRIX TECNOLOGIA LTDA, a título de auditoria pericial algorítmica D+0 e infraestrutura de inteligência fiscal.

2. DO LICENCIAMENTO DE SOFTWARE E ASSINATURA RECORRENTE (SAAS):
Os valores pagos a título de assinatura periódica, mensalidade, anuidade ou licenciamento contínuo da plataforma Velatrix AOS (incluindo módulos de Governança, Escudo Preventivo, Monitoramento de NCMs e Compliance) constituem remuneração exclusiva e integral da VELATRIX TECNOLOGIA LTDA, sendo retidos em 100% (cem por cento) por esta, sem qualquer repasse, comissionamento ou coparticipação devida ao parceiro de originação.

3. DA LIQUIDAÇÃO E REGRAS DE RETENÇÃO:
A liquidação do split de 70%/30% relativo aos honorários de êxito ocorrerá automaticamente via Gateway Bancário integrado após a comprovação de compensação/pagamento pelo cliente final, sendo emitidas as respectivas notas fiscais de serviços de forma individualizada sobre a parcela retida por cada pessoa jurídica."`;

export const PARTNER_SPLIT_AND_LICENSING_SUMMARY = {
  successFeePartnerPct: 70,
  successFeeVelatrixPct: 30,
  saasSubscriptionPartnerPct: 0,
  saasSubscriptionVelatrixPct: 100
};

const DEFAULT_STATE: RevenueShieldState = {
  isSplitConfirmed: false,
  paymentMethod: null,
  transactionId: null,
  confirmedAt: null,
  amountDueVelatrix: 149100.00, // 30% do success fee de 20% sobre R$ 2.485.000
  amountDuePartner: 347900.00,  // 70% do success fee
  originProofId: 'VELATRIX-ORIGIN-PROOF-33041260000188-D0-77492',
  originProofTimestamp: '2026-08-28T10:14:00.000Z',
  originProofHash: '0x8f2a91c0e5b742aa39f9411dc8219c44b931fae812d46e01a87b32091c77f24d',
  exclusivityAccepted: true,
  acceptanceRecord: {
    id: 'ACC-EXCL-77492',
    cnpj: '33.041.260/0001-88',
    companyName: 'Vortex Logística & Manufatura S.A.',
    signatoryName: 'Dr. Marcelo Vasconcelos Ribeiro / Rodrigo Antunes (CFO)',
    signatoryCpf: '***.482.908-**',
    signatoryRole: 'Procurador Legal & Diretor Financeiro',
    ipAddress: '177.136.241.90 (São Paulo/SP)',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Velatrix-AOS-SecureClient/4.2',
    timestamp: '28/08/2026 09:30:15 BRT',
    exclusivityClauseHash: '0x9482fae110c7b3294821aeb9310c812d46e01a87b32091c77f24d9c0e5b742aa',
    status: 'ATIVO_REGISTRADO',
    legalDraftNote: 'Aceite gravado em Livro-Razão Criptográfico com Prova de Anterioridade'
  },
  antiCircumventionCases: [
    {
      id: 'CASE-01',
      cnpj: '33.041.260/0001-88',
      companyName: 'Vortex Logística & Manufatura S.A.',
      sector: 'Manufatura & Indústria',
      identifiedCreditAmount: 2485000,
      rfbStatus: 'HOMOLOGADO_RFB',
      rfbStatusLabel: 'Homologado RFB (DCOMP Protocolado)',
      splitPaymentStatus: 'PENDENTE_PAGAMENTO',
      velatrixSplitAmount: 149100,
      partnerSplitAmount: 347900,
      detectionTimestamp: 'Hoje, 10:14',
      originProofId: 'VELATRIX-ORIGIN-PROOF-33041260000188-D0-77492',
      riskSeverity: 'ALTO_CIRCUNVENCAO',
      alertsHistory: [
        'Homologação de R$ 2.485.000 detectada no e-CAC sem confirmação de liquidação do Split Velatrix.',
        'Bloqueio de download de peças limpas e certificadas ativado pelo Gate de Receita.',
        'Alerta emitido para equipe comercial e jurídica Velatrix.'
      ]
    },
    {
      id: 'CASE-02',
      cnpj: '12.840.119/0001-44',
      companyName: 'Rede Farma Mais Distribuição Ltda',
      sector: 'Varejo & Farmácia',
      identifiedCreditAmount: 390000,
      rfbStatus: 'COMPENSADO_DCTFWEB',
      rfbStatusLabel: 'Crédito Compensado em DCTFWeb',
      splitPaymentStatus: 'PAGAMENTO_CONFIRMADO',
      velatrixSplitAmount: 23400,
      partnerSplitAmount: 54600,
      detectionTimestamp: 'Ontem, 16:30',
      originProofId: 'VELATRIX-ORIGIN-PROOF-12840119000144-D0-88120',
      riskSeverity: 'BAIXO',
      alertsHistory: [
        'Compensação confirmada e Split liquidado via PIX Gateway com sucesso.'
      ]
    },
    {
      id: 'CASE-03',
      cnpj: '45.992.301/0001-77',
      companyName: 'TransGlobal Transportes & Frota S.A.',
      sector: 'Transporte Rodoviário',
      identifiedCreditAmount: 3120000,
      rfbStatus: 'PROTOCOLADO_ECAC',
      rfbStatusLabel: 'Em Perícia / Protocolado e-CAC',
      splitPaymentStatus: 'PENDENTE_PAGAMENTO',
      velatrixSplitAmount: 187200,
      partnerSplitAmount: 436800,
      detectionTimestamp: 'Hoje, 08:00',
      originProofId: 'VELATRIX-ORIGIN-PROOF-45992301000177-D0-99214',
      riskSeverity: 'MEDIO',
      alertsHistory: [
        'Aguardando homologação formal do DCOMP para emissão da guia de split.'
      ]
    }
  ]
};

let currentShieldState: RevenueShieldState = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        return {
          ...DEFAULT_STATE,
          ...parsed
        };
      }
    }
  } catch (e) {
    // ignore
  }
  return { ...DEFAULT_STATE };
})();

type ShieldListener = (state: RevenueShieldState) => void;
const listeners = new Set<ShieldListener>();

export const RevenueShieldService = {
  get(): RevenueShieldState {
    return currentShieldState;
  },

  update(partial: Partial<RevenueShieldState>): RevenueShieldState {
    currentShieldState = {
      ...currentShieldState,
      ...partial
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentShieldState));
    } catch (e) {
      // ignore
    }

    listeners.forEach((listener) => {
      try {
        listener(currentShieldState);
      } catch (err) {
        console.error('Error notifying revenue shield listener', err);
      }
    });

    return currentShieldState;
  },

  subscribe(listener: ShieldListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // Confirm Split Payment (Simulated Gateway/PIX unlock)
  confirmSplitPayment(
    method: 'PIX_GATEWAY' | 'BOLETO_ESCROW' | 'CARTAO_CORPORATIVO' = 'PIX_GATEWAY',
    txId: string = `PIX-SPLIT-${secureInt(100000, 999999)}`
  ): RevenueShieldState {
    const updatedCases = currentShieldState.antiCircumventionCases.map(c => {
      if (c.cnpj === '33.041.260/0001-88') {
        return {
          ...c,
          splitPaymentStatus: 'PAGAMENTO_CONFIRMADO' as SplitPaymentStatus,
          riskSeverity: 'BAIXO' as const,
          alertsHistory: [
            ...c.alertsHistory,
            `Pagamento do Split confirmado via ${method} (TxID: ${txId}) em ${new Date().toLocaleTimeString('pt-BR')}. Documentos liberados.`
          ]
        };
      }
      return c;
    });

    return this.update({
      isSplitConfirmed: true,
      paymentMethod: method,
      transactionId: txId,
      confirmedAt: new Date().toISOString(),
      antiCircumventionCases: updatedCases
    });
  },

  // Lock Split Payment (Re-lock for test simulation)
  lockSplitPayment(): RevenueShieldState {
    const updatedCases = currentShieldState.antiCircumventionCases.map(c => {
      if (c.cnpj === '33.041.260/0001-88') {
        return {
          ...c,
          splitPaymentStatus: 'PENDENTE_PAGAMENTO' as SplitPaymentStatus,
          riskSeverity: 'ALTO_CIRCUNVENCAO' as const
        };
      }
      return c;
    });

    return this.update({
      isSplitConfirmed: false,
      paymentMethod: null,
      transactionId: null,
      confirmedAt: null,
      antiCircumventionCases: updatedCases
    });
  },

  // Record Exclusivity Acceptance
  recordExclusivityAcceptance(
    signatoryName: string,
    signatoryCpf: string,
    signatoryRole: string,
    cnpj: string,
    companyName: string
  ): RevenueShieldState {
    const hex = secureId('', 4);
    const newRecord: ExclusivityAcceptanceRecord = {
      id: `ACC-EXCL-${secureInt(10000, 99999)}`,
      cnpj,
      companyName,
      signatoryName,
      signatoryCpf,
      signatoryRole,
      ipAddress: '177.136.241.90 (São Paulo/SP)',
      userAgent: navigator?.userAgent || 'Velatrix-AOS-Client/4.0',
      timestamp: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'),
      exclusivityClauseHash: `0x${hex}ae110c7b3294821aeb9310c812d46e01a87b32091c77f24d9c0e5b742aa`,
      status: 'ATIVO_REGISTRADO',
      legalDraftNote: 'Aceite gravado em Livro-Razão Criptográfico com Prova de Anterioridade'
    };

    return this.update({
      exclusivityAccepted: true,
      acceptanceRecord: newRecord
    });
  },

  // Generate cryptographic origin proof header string
  getOriginProofBadgeString(cnpj: string, hashSha256: string): string {
    return `[PROVA DE ORIGEM & ANTERIORIDADE REGISTRADA • VELATRIX AOS • CNPJ: ${cnpj} • HASH: ${hashSha256.slice(0, 18)}... • EXCLUSIVIDADE ASSEGURADA]`;
  }
};
