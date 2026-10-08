// src/services/splitPaymentSimulationService.ts
// Módulo de Integração de Pagamento com Split Automático e Escrow (Simulação / Protótipo)

import { AuditRecord } from '../types/aos';
import { 
  fetchSplitDeals, 
  saveSplitDeal, 
  savePayout, 
  saveNfseRecord 
} from './dataService';
import { secureInt } from '../lib/demoMode';


export type SplitPaymentStatus = 'PENDENTE' | 'PAGO' | 'SPLIT_PROCESSADO';
export type SplitPaymentMethod = 'PIX' | 'BOLETO';

export interface DualNfseRecord {
  number: string;
  verificationCode: string;
  emissionDate: string;
  emissorName: string;
  emissorCnpj: string;
  tomadorName: string;
  tomadorCnpj: string;
  description: string;
  serviceCode: string;
  grossValue: number;
  issWithheld: number;
  netValue: number;
  status: 'EMITIDA';
  protocoloRfb: string;
}

export interface SplitWebhookPayload {
  event: 'escrow.split.settled';
  timestamp: string;
  chargeId: string;
  escrowTransactionId: string;
  totalSettledAmount: number;
  escrowAccount: string;
  partnerDistribution: {
    recipientName: string;
    recipientCnpj: string;
    percentage: number;
    amount: number;
    payoutChannel: 'PIX_INSTANTANEO';
    pixKey: string;
    settlementStatus: 'CONCLUIDO';
    nfseNumber: string;
  };
  velatrixDistribution: {
    recipientName: string;
    recipientCnpj: string;
    percentage: number;
    amount: number;
    payoutChannel: 'TED_CONTA_JURIDICA';
    bankAccount: string;
    settlementStatus: 'CONCLUIDO';
    nfseNumber: string;
  };
  complianceHash: string;
}

export interface SplitPaymentCharge {
  id: string;
  clientCnpj: string;
  clientCompanyName: string;
  dealTitle: string;
  totalAmount: number;
  partnerSplitPct: number;
  partnerSplitAmount: number;
  velatrixSplitPct: number;
  velatrixSplitAmount: number;
  status: SplitPaymentStatus;
  paymentMethod: SplitPaymentMethod;
  paymentUrl: string;
  pixQrCode: string;
  pixCopiaECola: string;
  boletoBarcode: string;
  boletoLinhaDigitavel: string;
  createdAt: string;
  paidAt?: string;
  splitProcessedAt?: string;
  escrowAccountId: string;
  partnerPayoutAccount: string;
  velatrixPayoutAccount: string;
  webhookTriggered: boolean;
  webhookPayload?: SplitWebhookPayload;
  partnerNfse?: DualNfseRecord;
  velatrixNfse?: DualNfseRecord;
  auditHash: string;
  simulatedNotes?: string;
}

export interface CreateSplitChargeParams {
  clientCnpj: string;
  clientCompanyName: string;
  dealTitle: string;
  totalAmount: number;
  partnerSplitPct?: number; // default 70
  paymentMethod?: SplitPaymentMethod;
  partnerPayoutAccount?: string;
}

const STORAGE_KEY = 'velatrix_simulated_split_charges_v1';

// Seed demo charges
const INITIAL_CHARGES: SplitPaymentCharge[] = [
  {
    id: 'CHG-SPLIT-98124',
    clientCnpj: '33.041.260/0001-88',
    clientCompanyName: 'Vortex Logística & Manufatura S.A.',
    dealTitle: 'Honorários de Êxito - Exclusão ICMS da Base PIS/COFINS (60 Meses)',
    totalAmount: 189000.00,
    partnerSplitPct: 70,
    partnerSplitAmount: 132300.00,
    velatrixSplitPct: 30,
    velatrixSplitAmount: 56700.00,
    status: 'SPLIT_PROCESSADO',
    paymentMethod: 'PIX',
    paymentUrl: 'https://pay.velatrix.app/escrow/chg_98124_vortex',
    pixQrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a"/><path d="M10,10 h30 v30 h-30 z M60,10 h30 v30 h-30 z M10,60 h30 v30 h-30 z M20,20 h10 v10 h-10 z M70,20 h10 v10 h-10 z M20,70 h10 v10 h-10 z M50,15 h5 v30 h-5 z M45,60 h20 v10 h-20 z M70,60 h20 v30 h-20 z" fill="%2310b981"/></svg>',
    pixCopiaECola: '00020126830014br.gov.bcb.pix0136escrow-split-98124@velatrix.ai5204000053039865408189000.005802BR5925VELATRIX ESCROW SPLIT LTDA6009SAO PAULO62140510CHG981246304D1B4',
    boletoBarcode: '34191.79001 01043.510047 91020.150008 5 99990018900000',
    boletoLinhaDigitavel: '34191.79001 01043.510047 91020.150008 5 99990018900000',
    createdAt: '11/09/2026 14:20:00',
    paidAt: '12/09/2026 09:15:32',
    splitProcessedAt: '12/09/2026 09:15:33',
    escrowAccountId: 'ESCROW-BCB-ISPB-09941-SPLIT-98',
    partnerPayoutAccount: 'Chave PIX CNPJ 12.345.678/0001-90 (BTG Pactual)',
    velatrixPayoutAccount: 'Conta Corrente Ag 0001 / CC 99281-4 (Itaú Unibanco)',
    webhookTriggered: true,
    webhookPayload: {
      event: 'escrow.split.settled',
      timestamp: '2026-09-12T09:15:33.000Z',
      chargeId: 'CHG-SPLIT-98124',
      escrowTransactionId: 'TX-ESCROW-20260912-98124-LIQ',
      totalSettledAmount: 189000.00,
      escrowAccount: 'ESCROW-BCB-ISPB-09941-SPLIT-98',
      partnerDistribution: {
        recipientName: 'Dr. Patrono & Consultores Associados',
        recipientCnpj: '12.345.678/0001-90',
        percentage: 70,
        amount: 132300.00,
        payoutChannel: 'PIX_INSTANTANEO',
        pixKey: '12.345.678/0001-90',
        settlementStatus: 'CONCLUIDO',
        nfseNumber: 'NFS-e 2026/000841'
      },
      velatrixDistribution: {
        recipientName: 'Velatrix Tecnologia e Governança Tributária Ltda',
        recipientCnpj: '44.892.120/0001-09',
        percentage: 30,
        amount: 56700.00,
        payoutChannel: 'TED_CONTA_JURIDICA',
        bankAccount: 'Banco Itaú 341 Ag 0001 CC 99281-4',
        settlementStatus: 'CONCLUIDO',
        nfseNumber: 'NFS-e 2026/019244'
      },
      complianceHash: '0x9a8f21bc9e440182a933f78912d09e1a8b3401ef92c14092b34a179e00184fa9'
    },
    partnerNfse: {
      number: '2026/000841',
      verificationCode: 'VRF-PTR-84192',
      emissionDate: '12/09/2026 09:15',
      emissorName: 'Dr. Patrono & Consultores Associados',
      emissorCnpj: '12.345.678/0001-90',
      tomadorName: 'Vortex Logística & Manufatura S.A.',
      tomadorCnpj: '33.041.260/0001-88',
      description: 'Prestação de serviços de consultoria e patrocínio jurídico tributário em repetição de indébito (Recuperação PIS/COFINS) - Parcela do Patrono 70% conforme Contrato de Êxito Digital.',
      serviceCode: '17.01 - Assessoria ou consultoria de qualquer natureza',
      grossValue: 132300.00,
      issWithheld: 2646.00,
      netValue: 129654.00,
      status: 'EMITIDA',
      protocoloRfb: 'PROT-NFSE-SP-20260912-000841-AOS'
    },
    velatrixNfse: {
      number: '2026/019244',
      verificationCode: 'VRF-VLX-19244',
      emissionDate: '12/09/2026 09:15',
      emissorName: 'Velatrix Tecnologia e Governança Tributária Ltda',
      emissorCnpj: '44.892.120/0001-09',
      tomadorName: 'Vortex Logística & Manufatura S.A.',
      tomadorCnpj: '33.041.260/0001-88',
      description: 'Licenciamento de plataforma tecnológica autônoma AOS, motor de inteligência artificial fiscal e processamento pericial de arquivos SPED - Cota de Tecnologia 30% em Split de Gateway.',
      serviceCode: '01.01 - Análise e desenvolvimento de sistemas / SaaS',
      grossValue: 56700.00,
      issWithheld: 1134.00,
      netValue: 55566.00,
      status: 'EMITIDA',
      protocoloRfb: 'PROT-NFSE-SP-20260912-019244-VLX'
    },
    auditHash: '0x9a8f21bc9e440182a933f78912d09e1a8b3401ef92c14092b34a179e00184fa9',
    simulatedNotes: 'Split liquidado com sucesso pela Conta Escrow. Ambas as NFS-e emitidas de forma autônoma.'
  },
  {
    id: 'CHG-SPLIT-98125',
    clientCnpj: '08.123.456/0001-99',
    clientCompanyName: 'Supermercados Alvorada Ltda.',
    dealTitle: 'Honorários de Êxito - Monofásico PIS/COFINS Farmácia & Bebidas (60M)',
    totalAmount: 96800.00,
    partnerSplitPct: 70,
    partnerSplitAmount: 67760.00,
    velatrixSplitPct: 30,
    velatrixSplitAmount: 29040.00,
    status: 'PENDENTE',
    paymentMethod: 'PIX',
    paymentUrl: 'https://pay.velatrix.app/escrow/chg_98125_alvorada',
    pixQrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a"/><path d="M10,10 h30 v30 h-30 z M60,10 h30 v30 h-30 z M10,60 h30 v30 h-30 z M20,20 h10 v10 h-10 z M70,20 h10 v10 h-10 z M20,70 h10 v10 h-10 z M50,15 h5 v30 h-5 z M45,60 h20 v10 h-20 z M70,60 h20 v30 h-20 z" fill="%2306b6d4"/></svg>',
    pixCopiaECola: '00020126830014br.gov.bcb.pix0136escrow-split-98125@velatrix.ai520400005303986540896800.005802BR5925VELATRIX ESCROW SPLIT LTDA6009SAO PAULO62140510CHG981256304E9F2',
    boletoBarcode: '34191.79001 01043.510047 91020.150008 5 99990009680000',
    boletoLinhaDigitavel: '34191.79001 01043.510047 91020.150008 5 99990009680000',
    createdAt: '12/09/2026 08:30:00',
    escrowAccountId: 'ESCROW-BCB-ISPB-09941-SPLIT-98',
    partnerPayoutAccount: 'Chave PIX CNPJ 12.345.678/0001-90 (BTG Pactual)',
    velatrixPayoutAccount: 'Conta Corrente Ag 0001 / CC 99281-4 (Itaú Unibanco)',
    webhookTriggered: false,
    auditHash: '0x17b4c892e01fa4981d02c9182ab304918e90218bca418721c4091a781290bb41',
    simulatedNotes: 'Aguardando liquidação pelo cliente. Ao confirmar recebimento, o split será efetuado automaticamente.'
  }
];

class SplitPaymentSimulationService {
  private charges: SplitPaymentCharge[] = [];
  private listeners: Array<(charges: SplitPaymentCharge[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.charges = JSON.parse(stored);
      } else {
        this.charges = [...INITIAL_CHARGES];
        this.saveToStorage();
      }
    } catch {
      this.charges = [...INITIAL_CHARGES];
    }

    // Carrega do backend Postgres / Prisma e sincroniza
    fetchSplitDeals().then(serverDeals => {
      if (Array.isArray(serverDeals) && serverDeals.length > 0) {
        let changed = false;
        serverDeals.forEach((sd: any) => {
          const exists = this.charges.some(c => c.id === sd.id);
          if (!exists) {
            this.charges.push({
              id: sd.id,
              clientCnpj: sd.clientCnpj || '33.041.260/0001-88',
              clientCompanyName: sd.clientName || 'Cliente Corporativo',
              dealTitle: sd.title || 'Contrato de Split',
              totalAmount: Number(sd.grossAmount || 0),
              partnerSplitPct: Number(sd.partnerPct || 70),
              partnerSplitAmount: Number(sd.partnerAmount || 0),
              velatrixSplitPct: Number(sd.velatrixPct || 30),
              velatrixSplitAmount: Number(sd.velatrixAmount || 0),
              status: sd.status as any || 'PENDENTE',
              paymentMethod: (sd.paymentMethod as any) || 'PIX',
              paymentUrl: sd.paymentUrl || `https://pay.velatrix.app/escrow/${sd.id}`,
              pixQrCode: sd.pixQrCode || '',
              pixCopiaECola: sd.pixCopiaECola || '',
              boletoBarcode: '',
              boletoLinhaDigitavel: '',
              createdAt: sd.createdAt ? new Date(sd.createdAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
              escrowAccountId: 'ESCROW-BCB-ISPB-09941-SPLIT-98',
              partnerPayoutAccount: 'Chave PIX Oficial',
              velatrixPayoutAccount: 'Conta Corrente Ag 0001 / CC 99281-4 (Itaú)',
              webhookTriggered: sd.status === 'SPLIT_PROCESSADO',
              auditHash: sd.auditHash || '0x0'
            });
            changed = true;
          }
        });
        if (changed) {
          this.notify();
        }
      }
    }).catch(err => {
      console.debug('[SplitPaymentSimulationService] Backend sync fallback:', err);
    });
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.charges));
    } catch (e) {
      console.warn('Failed to persist simulated split charges', e);
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(cb => cb([...this.charges]));
  }

  public subscribe(listener: (charges: SplitPaymentCharge[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.charges]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getCharges(): SplitPaymentCharge[] {
    return [...this.charges];
  }

  public getChargesByCnpj(cnpj: string): SplitPaymentCharge[] {
    const clean = cnpj.replace(/\D/g, '');
    return this.charges.filter(c => c.clientCnpj.replace(/\D/g, '') === clean);
  }

  public getChargeById(id: string): SplitPaymentCharge | undefined {
    return this.charges.find(c => c.id === id);
  }

  public createCharge(params: CreateSplitChargeParams): SplitPaymentCharge {
    const randomSuffix = secureInt(10000, 99999);
    const chargeId = `CHG-SPLIT-${randomSuffix}`;
    const partnerPct = params.partnerSplitPct ?? 70;
    const velatrixPct = 100 - partnerPct;

    const partnerAmount = Number(((params.totalAmount * partnerPct) / 100).toFixed(2));
    const velatrixAmount = Number((params.totalAmount - partnerAmount).toFixed(2));

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    const cleanCnpj = params.clientCnpj.replace(/\D/g, '');

    const newCharge: SplitPaymentCharge = {
      id: chargeId,
      clientCnpj: params.clientCnpj,
      clientCompanyName: params.clientCompanyName,
      dealTitle: params.dealTitle,
      totalAmount: params.totalAmount,
      partnerSplitPct: partnerPct,
      partnerSplitAmount: partnerAmount,
      velatrixSplitPct: velatrixPct,
      velatrixSplitAmount: velatrixAmount,
      status: 'PENDENTE',
      paymentMethod: params.paymentMethod || 'PIX',
      paymentUrl: `https://pay.velatrix.app/escrow/chg_${randomSuffix}_${cleanCnpj.slice(0, 4)}`,
      pixQrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230f172a"/><path d="M10,10 h30 v30 h-30 z M60,10 h30 v30 h-30 z M10,60 h30 v30 h-30 z M20,20 h10 v10 h-10 z M70,20 h10 v10 h-10 z M20,70 h10 v10 h-10 z M50,15 h5 v30 h-5 z M45,60 h20 v10 h-20 z M70,60 h20 v30 h-20 z" fill="%2310b981"/></svg>',
      pixCopiaECola: `00020126830014br.gov.bcb.pix0136escrow-split-${randomSuffix}@velatrix.ai5204000053039865408${params.totalAmount.toFixed(2)}5802BR5925VELATRIX ESCROW SPLIT LTDA6009SAO PAULO62140510CHG${randomSuffix}6304A1F9`,
      boletoBarcode: `34191.79001 01043.510047 91020.150008 5 9999000${Math.floor(params.totalAmount * 100)}`,
      boletoLinhaDigitavel: `34191.79001 01043.510047 91020.150008 5 9999000${Math.floor(params.totalAmount * 100)}`,
      createdAt: formattedDate,
      escrowAccountId: 'ESCROW-BCB-ISPB-09941-SPLIT-98',
      partnerPayoutAccount: params.partnerPayoutAccount || 'Chave PIX CNPJ 12.345.678/0001-90 (BTG Pactual)',
      velatrixPayoutAccount: 'Conta Corrente Ag 0001 / CC 99281-4 (Itaú Unibanco)',
      webhookTriggered: false,
      auditHash: `0x${Array.from({ length: 64 }, () => secureInt(0, 15).toString(16)).join('')}`,
      simulatedNotes: 'Link de cobrança gerado em ambiente de simulação. Aguardando recebimento na Conta Escrow D+0.'
    };

    this.charges.unshift(newCharge);
    this.saveToStorage();

    // Persistência no backend Postgres / Prisma
    saveSplitDeal({
      id: newCharge.id,
      title: newCharge.dealTitle,
      clientName: newCharge.clientCompanyName,
      clientCnpj: newCharge.clientCnpj,
      partnerPct: newCharge.partnerSplitPct,
      velatrixPct: newCharge.velatrixSplitPct,
      grossAmount: newCharge.totalAmount,
      partnerAmount: newCharge.partnerSplitAmount,
      velatrixAmount: newCharge.velatrixSplitAmount,
      status: newCharge.status,
      paymentMethod: newCharge.paymentMethod,
      paymentUrl: newCharge.paymentUrl,
      pixQrCode: newCharge.pixQrCode,
      pixCopiaECola: newCharge.pixCopiaECola,
      auditHash: newCharge.auditHash,
    }).catch(e => console.debug('[splitPaymentSimulationService] saveSplitDeal fallback:', e));

    window.dispatchEvent(new CustomEvent('velatrix:split_charge_created', { detail: newCharge }));
    return newCharge;

  }

  public simulatePaymentSettlement(chargeId: string): { 
    charge: SplitPaymentCharge; 
    auditRecord: AuditRecord;
    webhookPayload: SplitWebhookPayload;
  } {
    const index = this.charges.findIndex(c => c.id === chargeId);
    if (index === -1) {
      throw new Error(`Cobrança ${chargeId} não encontrada.`);
    }

    const current = this.charges[index];
    const now = new Date();
    const timestampFormatted = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    const isoString = now.toISOString();

    const escrowTxId = `TX-ESCROW-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${current.id.replace('CHG-', '')}-LIQ`;

    const partnerNfseNum = `2026/00${secureInt(1000, 9999)}`;
    const velatrixNfseNum = `2026/01${secureInt(10000, 99999)}`;
    const complianceHash = `0x${Array.from({ length: 64 }, () => secureInt(0, 15).toString(16)).join('')}`;

    const webhookPayload: SplitWebhookPayload = {
      event: 'escrow.split.settled',
      timestamp: isoString,
      chargeId: current.id,
      escrowTransactionId: escrowTxId,
      totalSettledAmount: current.totalAmount,
      escrowAccount: current.escrowAccountId,
      partnerDistribution: {
        recipientName: 'Dr. Patrono & Consultores Associados',
        recipientCnpj: '12.345.678/0001-90',
        percentage: current.partnerSplitPct,
        amount: current.partnerSplitAmount,
        payoutChannel: 'PIX_INSTANTANEO',
        pixKey: '12.345.678/0001-90',
        settlementStatus: 'CONCLUIDO',
        nfseNumber: `NFS-e ${partnerNfseNum}`
      },
      velatrixDistribution: {
        recipientName: 'Velatrix Tecnologia e Governança Tributária Ltda',
        recipientCnpj: '44.892.120/0001-09',
        percentage: current.velatrixSplitPct,
        amount: current.velatrixSplitAmount,
        payoutChannel: 'TED_CONTA_JURIDICA',
        bankAccount: 'Banco Itaú 341 Ag 0001 CC 99281-4',
        settlementStatus: 'CONCLUIDO',
        nfseNumber: `NFS-e ${velatrixNfseNum}`
      },
      complianceHash
    };

    const partnerNfse: DualNfseRecord = {
      number: partnerNfseNum,
      verificationCode: `VRF-PTR-${secureInt(10000, 99999)}`,
      emissionDate: timestampFormatted,
      emissorName: 'Dr. Patrono & Consultores Associados',
      emissorCnpj: '12.345.678/0001-90',
      tomadorName: current.clientCompanyName,
      tomadorCnpj: current.clientCnpj,
      description: `Serviços especializados de consultoria jurídica e patrocínio em repetição de indébito tributário (${current.dealTitle}) - Cota do Patrono (${current.partnerSplitPct}%) via Split Automático Escrow.`,
      serviceCode: '17.01 - Assessoria ou consultoria jurídica e contábil',
      grossValue: current.partnerSplitAmount,
      issWithheld: Number((current.partnerSplitAmount * 0.02).toFixed(2)),
      netValue: Number((current.partnerSplitAmount * 0.98).toFixed(2)),
      status: 'EMITIDA',
      protocoloRfb: `PROT-NFSE-${current.id}-PTR`
    };

    const velatrixNfse: DualNfseRecord = {
      number: velatrixNfseNum,
      verificationCode: `VRF-VLX-${secureInt(10000, 99999)}`,
      emissionDate: timestampFormatted,
      emissorName: 'Velatrix Tecnologia e Governança Tributária Ltda',
      emissorCnpj: '44.892.120/0001-09',
      tomadorName: current.clientCompanyName,
      tomadorCnpj: current.clientCnpj,
      description: `Licenciamento de tecnologia autônoma AOS, auditoria computacional SPED e infraestrutura de automação fiscal - Cota Velatrix (${current.velatrixSplitPct}%) via Split de Gateway.`,
      serviceCode: '01.01 - Análise e desenvolvimento de sistemas / Plataforma SaaS',
      grossValue: current.velatrixSplitAmount,
      issWithheld: Number((current.velatrixSplitAmount * 0.02).toFixed(2)),
      netValue: Number((current.velatrixSplitAmount * 0.98).toFixed(2)),
      status: 'EMITIDA',
      protocoloRfb: `PROT-NFSE-${current.id}-VLX`
    };

    const updatedCharge: SplitPaymentCharge = {
      ...current,
      status: 'SPLIT_PROCESSADO',
      paidAt: timestampFormatted,
      splitProcessedAt: timestampFormatted,
      webhookTriggered: true,
      webhookPayload,
      partnerNfse,
      velatrixNfse,
      auditHash: complianceHash,
      simulatedNotes: `Pagamento liquidado via Conta Escrow. Split efetuado: R$ ${current.partnerSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para o Parceiro + R$ ${current.velatrixSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para Velatrix. NFS-e #${partnerNfseNum} e #${velatrixNfseNum} emitidas.`
    };

    this.charges[index] = updatedCharge;
    this.saveToStorage();

    // Sincroniza Liquidação do Deal no Backend
    saveSplitDeal({
      id: updatedCharge.id,
      title: updatedCharge.dealTitle,
      clientName: updatedCharge.clientCompanyName,
      clientCnpj: updatedCharge.clientCnpj,
      partnerPct: updatedCharge.partnerSplitPct,
      velatrixPct: updatedCharge.velatrixSplitPct,
      grossAmount: updatedCharge.totalAmount,
      partnerAmount: updatedCharge.partnerSplitAmount,
      velatrixAmount: updatedCharge.velatrixSplitAmount,
      status: 'SPLIT_PROCESSADO',
      paidAt: isoString,
      splitProcessedAt: isoString,
      auditHash: complianceHash,
    }).catch(e => console.debug('[SplitPaymentSimulationService] saveSplitDeal settlement fallback:', e));

    // Persiste Payout do Parceiro (PIX Instantâneo)
    savePayout({
      recipientType: 'PARTNER',
      recipientName: webhookPayload.partnerDistribution.recipientName,
      recipientDoc: webhookPayload.partnerDistribution.recipientCnpj,
      amount: current.partnerSplitAmount,
      payoutMethod: 'PIX',
      pixKey: webhookPayload.partnerDistribution.pixKey,
      status: 'SETTLED',
      transactionId: escrowTxId,
      proofHashSha256: complianceHash,
      settledAt: isoString,
    }).catch(e => console.debug('[SplitPaymentSimulationService] savePayout partner fallback:', e));

    // Persiste Payout da Velatrix (TED / Conta Jurídica)
    savePayout({
      recipientType: 'VELATRIX',
      recipientName: webhookPayload.velatrixDistribution.recipientName,
      recipientDoc: webhookPayload.velatrixDistribution.recipientCnpj,
      amount: current.velatrixSplitAmount,
      payoutMethod: 'TED',
      bankAccount: webhookPayload.velatrixDistribution.bankAccount,
      status: 'SETTLED',
      transactionId: escrowTxId,
      proofHashSha256: complianceHash,
      settledAt: isoString,
    }).catch(e => console.debug('[SplitPaymentSimulationService] savePayout velatrix fallback:', e));

    // Persiste NFS-e Dupla (1/2 Parceiro)
    saveNfseRecord({
      number: partnerNfse.number,
      verificationCode: partnerNfse.verificationCode,
      emissorType: 'PARTNER',
      emissorName: partnerNfse.emissorName,
      emissorCnpj: partnerNfse.emissorCnpj,
      tomadorName: partnerNfse.tomadorName,
      tomadorCnpj: partnerNfse.tomadorCnpj,
      description: partnerNfse.description,
      grossValue: partnerNfse.grossValue,
      issWithheld: partnerNfse.issWithheld,
      netValue: partnerNfse.netValue,
      protocoloRfb: partnerNfse.protocoloRfb,
      status: 'EMITIDA'
    }).catch(e => console.debug('[SplitPaymentSimulationService] saveNfseRecord partner fallback:', e));

    // Persiste NFS-e Dupla (2/2 Velatrix)
    saveNfseRecord({
      number: velatrixNfse.number,
      verificationCode: velatrixNfse.verificationCode,
      emissorType: 'VELATRIX',
      emissorName: velatrixNfse.emissorName,
      emissorCnpj: velatrixNfse.emissorCnpj,
      tomadorName: velatrixNfse.tomadorName,
      tomadorCnpj: velatrixNfse.tomadorCnpj,
      description: velatrixNfse.description,
      grossValue: velatrixNfse.grossValue,
      issWithheld: velatrixNfse.issWithheld,
      netValue: velatrixNfse.netValue,
      protocoloRfb: velatrixNfse.protocoloRfb,
      status: 'EMITIDA'
    }).catch(e => console.debug('[SplitPaymentSimulationService] saveNfseRecord velatrix fallback:', e));


    // Create Audit Trail Record
    const auditRecord: AuditRecord = {
      id: `AUD-ESCROW-SPLIT-${Date.now()}`,
      timestamp: timestampFormatted,
      eventId: `evt-webhook-split-${current.id}`,
      eventTitle: `Webhook de Liquidação: Split Automático Escrow & Emissão Dual NFS-e [${current.id}]`,
      sector: 'Manufatura & Indústria' as any,
      jurisdiction: 'BR',
      agentsInvolved: ['Escrow_Gateway_Agent', 'Tax_Nfse_Issuer_Agent', 'Split_Contract_Agent', 'Audit_Ledger_Agent'],
      decisionSummary: `Cobrança ${current.id} de R$ ${current.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} liquidada na Conta Escrow sem trânsito unilateral. Repasse imediato: R$ ${current.partnerSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${current.partnerSplitPct}%) via PIX para o Parceiro e R$ ${current.velatrixSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${current.velatrixSplitPct}%) para Velatrix. NFS-e #${partnerNfseNum} e #${velatrixNfseNum} geradas.`,
      decisionAst: {
        ui_type: 'CriticalDecisionCard',
        priority: 'High',
        summary: `Split bancário executado pelo Gateway Escrow com emissão dual de notas fiscais de serviço`,
        kpis: [
          { label: 'Valor Total Escrow', value: `R$ ${current.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, impact: 'positive' },
          { label: `Split Parceiro (${current.partnerSplitPct}%)`, value: `R$ ${current.partnerSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, impact: 'positive' },
          { label: `Split Velatrix (${current.velatrixSplitPct}%)`, value: `R$ ${current.velatrixSplitAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, impact: 'neutral' },
          { label: 'Status Webhook', value: 'DELIVERED_200_OK', impact: 'positive' }
        ],
        invariants_checked: [
          'INVARIANT_NO_UNILATERAL_TRANSIT',
          'INVARIANT_INSTANT_PIX_SPLIT',
          'INVARIANT_DUAL_NFSE_SYNC',
          'INVARIANT_TAX_NON_DOUBLE_ASSESSMENT'
        ]
      },
      signatures: [
        {
          role: 'Gateway Escrow Virtual',
          keyId: 'BACEN_ISPB_09941_SIMULATED',
          signedAt: isoString,
          verified: true
        },
        {
          role: 'SEFAZ / Prefeitura NFS-e Webhook',
          keyId: `PROT-NFSE-${partnerNfseNum}`,
          signedAt: isoString,
          verified: true
        }
      ],
      status: 'executed',
      executionReceipt: escrowTxId,
      invariantSnapshot: [
        'INV_ESCROW_SEGREGATION_D0',
        'INV_PARTNER_70_30_RULE',
        'INV_NFSE_EMISSION_AUTOMATION',
        'INV_WEBHOOK_DELIVERY_CONFIRMED'
      ],
      recordHash: complianceHash
    };

    // Notify listeners and window events
    window.dispatchEvent(new CustomEvent('velatrix:split_charge_updated', { detail: updatedCharge }));
    window.dispatchEvent(new CustomEvent('velatrix:audit_record_created', { detail: auditRecord }));

    return {
      charge: updatedCharge,
      auditRecord,
      webhookPayload
    };
  }
}

export const SplitPaymentSimulationServiceInstance = new SplitPaymentSimulationService();
export { SplitPaymentSimulationServiceInstance as SplitPaymentSimulationService };
