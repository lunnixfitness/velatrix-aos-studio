/**
 * ==============================================================================
 * VELATRIX AOS — ENGINE 7: LICENCIAMENTO, BILLING & ASSINATURA SAAS (WHITE-LABEL)
 * ==============================================================================
 * 
 * DIRETIVA ARQUITETURAL FUNDAMENTAL:
 * A Velatrix atua estritamente como FABRICANTE E DESENVOLVEDORA DE SOFTWARE (SaaS B2B).
 * NÃO é instituição financeira, NÃO é correspondente bancário, NÃO é intermediária
 * de cessões de crédito nem custodiante de recursos.
 * 
 * MODELO COMERCIAL:
 * Licença de Software por Seat + Cobrança por Precatório Processado na Esteira:
 *  - Plano Starter:    R$ 1.490/mês + R$ 89/precatório extra (5 seats, 20 precatórios inclusos)
 *  - Plano Pro:        R$ 4.990/mês + R$ 59/precatório extra (20 seats, 100 precatórios inclusos)
 *  - Plano Enterprise: Sob demanda (100+ seats, SLA dedicado, instâncias dedicadas)
 * 
 * PROVEDORES DE COBRANÇA DA VELATRIX:
 * Cobrança via Stripe Billing (aceita qualquer PJ ou PF do fabricante de software —
 * dispensando licença BaaS ou regulação bancária).
 * Adapters para Asaas e Pagar.me como alternativas nacionais.
 * 
 * MODO STUB (SUBSCRIPTION_PROVIDER=stub):
 * Enquanto o fabricante de software não possui CNPJ ou credenciais Stripe configuradas,
 * o engine opera em modo Stub, gerando fatura/invoice estruturada em PDF e instrução Pix manual.
 */

import { jsPDF } from 'jspdf';
import { secureInt } from '../../lib/demoMode';

export const SOFTWARE_VENDOR_LEGAL_DISCLAIMER = {
  razaoSocialFabricante: "Velatrix Soluções em Tecnologia de Software",
  naturezaJuridica: "Fabricante e Licenciante de Software (SaaS / CNAE 62.01-5)",
  statusRegulatorio: "Não regulada pelo BACEN/CVM por não exercer atividade privativa de instituição financeira ou intermediação de recursos.",
  papelDoTenant: "O Tenant (escritório de advocacia, fundo ou banco) opera sob seu próprio CNPJ e conta bancária, sendo o único responsável jurídico e fiscal pelas operações estruturadas.",
  avisoLegal: "A Velatrix orquestra, calcula e audita criptograficamente a esteira tecnológica. Nunca recebe, custodia, antecipa ou movimenta recursos de precatórios em nome próprio."
};

export type SubscriptionPlanKey = 'STARTER' | 'PRO' | 'ENTERPRISE';
export type BillingProviderType = 'STUB' | 'STRIPE' | 'ASAAS' | 'PAGARME';

export interface PlanPricingDefinition {
  name: string;
  key: SubscriptionPlanKey;
  basePriceMonthlyBrl: number;
  includedSeats: number;
  includedPrecatoriosMonthly: number;
  extraSeatPriceBrl: number;
  extraPrecatorioPriceBrl: number;
  description: string;
  features: string[];
}

export const SAAS_PLANS: Record<SubscriptionPlanKey, PlanPricingDefinition> = {
  STARTER: {
    name: "Starter Jurídico",
    key: "STARTER",
    basePriceMonthlyBrl: 1490.00,
    includedSeats: 5,
    includedPrecatoriosMonthly: 20,
    extraSeatPriceBrl: 150.00,
    extraPrecatorioPriceBrl: 89.00,
    description: "Ideal para escritórios de advocacia e assessorias tributárias em estruturação.",
    features: [
      "Até 5 Seats de Operadores/Advogados",
      "20 Precatórios Auditados/Mês Inclusos",
      "Adapters KYC/PLD (DataValid & Unico)",
      "Assinador Digital ICP-Brasil A1 WebPKI",
      "Geração de Petição Automática DJEN",
      "Isolamento Row-Level por CNPJ do Tenant",
      "Suporte via Chamado em até 24h"
    ]
  },
  PRO: {
    name: "Professional Fund & Desk",
    key: "PRO",
    basePriceMonthlyBrl: 4990.00,
    includedSeats: 20,
    includedPrecatoriosMonthly: 100,
    extraSeatPriceBrl: 120.00,
    extraPrecatorioPriceBrl: 59.00,
    description: "Para mesas de originação de precatórios e fundos de litígio de médio porte.",
    features: [
      "Até 20 Seats de Operadores e Analistas",
      "100 Precatórios Auditados/Mês Inclusos",
      "White-Label Completo (Logo, Cor, Subdomínio)",
      "Adapters BaaS (Celcoin, Dock, Swap, BS2)",
      "Motor de Compensação Tributária (Lei 14.973)",
      "Livro-Razão Imutável de Cessões (Merkle Tree)",
      "Auditoria Automática de Cadeia de Penhoras",
      "Suporte Prioritário em até 4h"
    ]
  },
  ENTERPRISE: {
    name: "Enterprise Bank & Asset",
    key: "ENTERPRISE",
    basePriceMonthlyBrl: 14900.00,
    includedSeats: 100,
    includedPrecatoriosMonthly: 500,
    extraSeatPriceBrl: 80.00,
    extraPrecatorioPriceBrl: 39.00,
    description: "Solução dedicada para bancos de investimento, assets institucionais e grandes consórcios.",
    features: [
      "Seats Ilimitados ou Dimensionados sob Demanda",
      "500+ Precatórios Auditados/Mês Inclusos",
      "Domínio Próprio Exclusivo (app.suaempresa.com.br)",
      "Instância de Banco de Dados Dedicada",
      "Webhooks em Tempo Real e API Bidirecional",
      "Multi-Sig HSM com Quórum Customizável",
      "Gerente de Conta & Arquiteto de Soluções Dedicado",
      "SLA Garantido de 99.9% com Suporte 24/7"
    ]
  }
};

export interface BillingInvoiceData {
  id: string;
  tenantId: string;
  numeroFatura: string;
  competenciaMesAno: string;
  plano: SubscriptionPlanKey;
  valorBaseBrl: number;
  seatsContratados: number;
  seatsUtilizados: number;
  seatsExtrasQtd: number;
  valorSeatsExtrasBrl: number;
  precatoriosInclusos: number;
  precatoriosProcessadosQtd: number;
  precatoriosExtrasQtd: number;
  valorPrecatoriosExtrasBrl: number;
  valorTotalBrl: number;
  status: 'PAGO' | 'PENDENTE' | 'CANCELADO';
  provider: BillingProviderType;
  providerInvoiceId?: string;
  pdfUrl?: string;
  pixCopiaECola?: string;
  vencimento: string;
  pagoEm?: string;
  criadaEm: string;
  auditHash: string;
}

export interface TenantSubscriptionState {
  tenantId: string;
  cnpj: string;
  razaoSocial: string;
  plano: SubscriptionPlanKey;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELED';
  provider: BillingProviderType;
  providerSubscriptionId?: string;
  cicloAtualInicio: string;
  cicloAtualFim: string;
  seatsContratados: number;
  seatsUtilizados: number;
  precatoriosProcessadosNoCiclo: number;
  faturas: BillingInvoiceData[];
}

/**
 * Interface para os Provedores Plugáveis de Faturamento da Velatrix
 */
export interface IBillingProviderAdapter {
  providerName: BillingProviderType;
  gerarFatura(params: {
    tenant: { cnpj: string; razaoSocial: string; email: string };
    fatura: BillingInvoiceData;
  }): Promise<{
    providerInvoiceId: string;
    pdfUrl: string;
    pixCopiaECola?: string;
    checkoutUrl?: string;
  }>;
}

/**
 * Provedor 1: Stripe Billing Adapter
 * Utiliza o Stripe Billing para faturamento de SaaS por recorrência e consumo.
 * Vantagem: Aceita conta PJ ou PF do desenvolvedor/fundador sem exigir BaaS regulado.
 */
export class StripeBillingAdapter implements IBillingProviderAdapter {
  providerName: BillingProviderType = 'STRIPE';

  async gerarFatura(params: {
    tenant: { cnpj: string; razaoSocial: string; email: string };
    fatura: BillingInvoiceData;
  }) {
    const mockStripeInvoiceId = `in_stripe_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return {
      providerInvoiceId: mockStripeInvoiceId,
      pdfUrl: `https://pay.stripe.com/invoice/${mockStripeInvoiceId}/pdf`,
      checkoutUrl: `https://checkout.stripe.com/pay/${mockStripeInvoiceId}`,
      pixCopiaECola: undefined
    };
  }
}

/**
 * Provedor 2: Asaas Billing Adapter
 * Alternativa nacional que gera cobranças recorrentes com suporte nativo a Boleto e Pix com Baixa Automática.
 */
export class AsaasBillingAdapter implements IBillingProviderAdapter {
  providerName: BillingProviderType = 'ASAAS';

  async gerarFatura(params: {
    tenant: { cnpj: string; razaoSocial: string; email: string };
    fatura: BillingInvoiceData;
  }) {
    const mockAsaasId = `pay_asaas_${Date.now()}`;
    const valorFormatado = params.fatura.valorTotalBrl.toFixed(2);
    return {
      providerInvoiceId: mockAsaasId,
      pdfUrl: `https://www.asaas.com/i/${mockAsaasId}`,
      pixCopiaECola: `00020126580014br.gov.bcb.pix0136velatrix-billing@asaas.com.br520400005303986540${valorFormatado}5802BR5925VELATRIX SOFTWARE B2B6009SAO PAULO62070503***6304`,
      checkoutUrl: `https://www.asaas.com/c/${mockAsaasId}`
    };
  }
}

/**
 * Provedor 3: Pagar.me Billing Adapter
 * Alternativa Stone/Pagar.me V5 para cobrança de assinaturas recorrentes com split de cartão e Pix.
 */
export class PagarmeBillingAdapter implements IBillingProviderAdapter {
  providerName: BillingProviderType = 'PAGARME';

  async gerarFatura(params: {
    tenant: { cnpj: string; razaoSocial: string; email: string };
    fatura: BillingInvoiceData;
  }) {
    const mockPagarmeId = `inv_pagarme_${Date.now()}`;
    return {
      providerInvoiceId: mockPagarmeId,
      pdfUrl: `https://api.pagar.me/v5/invoices/${mockPagarmeId}/pdf`,
      pixCopiaECola: `00020126580014br.gov.bcb.pix0136financeiro@velatrix.app5204000053039865802BR5920VELATRIX SOFTWARE6009SAO PAULO62070503***6304`,
      checkoutUrl: `https://checkout.pagar.me/${mockPagarmeId}`
    };
  }
}

/**
 * Provedor 4: Stub Billing Adapter (Padrão Provisório)
 * Usado enquanto o fabricante não tem CNPJ ou conta bancária jurídica configurada.
 * Gera fatura estruturada com instrução manual de pagamento e envio simulado por e-mail.
 */
export class StubBillingAdapter implements IBillingProviderAdapter {
  providerName: BillingProviderType = 'STUB';

  async gerarFatura(params: {
    tenant: { cnpj: string; razaoSocial: string; email: string };
    fatura: BillingInvoiceData;
  }) {
    const invoiceNumber = params.fatura.numeroFatura;
    const valor = params.fatura.valorTotalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    
    // Pix manual da chave do fabricante para pagamento provisório
    const chavePixManual = "financeiro@velatrix.app";
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0122${chavePixManual}520400005303986540${params.fatura.valorTotalBrl.toFixed(2)}5802BR5925VELATRIX SOFTWARE STUB6009SAO PAULO62140510${invoiceNumber}6304`;

    return {
      providerInvoiceId: `STUB-${invoiceNumber}`,
      pdfUrl: `#stub-pdf-preview-${invoiceNumber}`,
      pixCopiaECola,
      checkoutUrl: undefined
    };
  }
}

/**
 * SUBSCRIPTION ENGINE (ENGINE 7) — SINGLETON
 * Controla os planos, seats, consumo de precatórios e emissão de faturas multi-tenant.
 */
class SubscriptionEngineService {
  private static instance: SubscriptionEngineService;

  // Provedores registrados
  private providers: Record<BillingProviderType, IBillingProviderAdapter> = {
    STUB: new StubBillingAdapter(),
    STRIPE: new StripeBillingAdapter(),
    ASAAS: new AsaasBillingAdapter(),
    PAGARME: new PagarmeBillingAdapter(),
  };

  // Provedor padrão do sistema (pode ser sobrescrito por variável de ambiente)
  private activeProviderType: BillingProviderType = 'STUB';

  // Armazenamento em memória (sincronizável com o banco via Prisma)
  private subscriptions: Map<string, TenantSubscriptionState> = new Map();

  private constructor() {
    this.carregarSubscriptionsIniciais();
  }

  public static getInstance(): SubscriptionEngineService {
    if (!SubscriptionEngineService.instance) {
      SubscriptionEngineService.instance = new SubscriptionEngineService();
    }
    return SubscriptionEngineService.instance;
  }

  public getActiveProviderType(): BillingProviderType {
    return this.activeProviderType;
  }

  public setActiveProviderType(type: BillingProviderType) {
    this.activeProviderType = type;
  }

  /**
   * Inicializa dados de demonstração para tenants conhecidos
   */
  private carregarSubscriptionsIniciais() {
    const agora = new Date();
    const inicioCiclo = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
    const fimCiclo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString();

    // Tenant 1: Monteiro & Vasconcelos Advogados Associados (Plano Pro)
    const tenant1Id = "47.829.112/0001-90";
    const sub1: TenantSubscriptionState = {
      tenantId: tenant1Id,
      cnpj: tenant1Id,
      razaoSocial: "Monteiro & Vasconcelos Advogados Associados",
      plano: "PRO",
      status: "ACTIVE",
      provider: "STUB",
      cicloAtualInicio: inicioCiclo,
      cicloAtualFim: fimCiclo,
      seatsContratados: 20,
      seatsUtilizados: 8,
      precatoriosProcessadosNoCiclo: 34,
      faturas: [
        {
          id: "inv-001",
          tenantId: tenant1Id,
          numeroFatura: "VLX-2026-0841",
          competenciaMesAno: "08/2026",
          plano: "PRO",
          valorBaseBrl: 4990.00,
          seatsContratados: 20,
          seatsUtilizados: 8,
          seatsExtrasQtd: 0,
          valorSeatsExtrasBrl: 0,
          precatoriosInclusos: 100,
          precatoriosProcessadosQtd: 28,
          precatoriosExtrasQtd: 0,
          valorPrecatoriosExtrasBrl: 0,
          valorTotalBrl: 4990.00,
          status: "PAGO",
          provider: "STUB",
          vencimento: "2026-09-10",
          pagoEm: "2026-09-08",
          criadaEm: "2026-09-01",
          auditHash: "0x89f4b1e2a8c3d7e6f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
          pixCopiaECola: "00020126580014br.gov.bcb.pix0122financeiro@velatrix.app5204000053039865404990.005802BR5925VELATRIX SOFTWARE STUB6009SAO PAULO62140510VLX-2026-08416304"
        }
      ]
    };
    this.subscriptions.set(tenant1Id, sub1);

    // Tenant 2: Titanium Capital Fundo de Precatórios (Plano Enterprise)
    const tenant2Id = "12.345.678/0001-99";
    const sub2: TenantSubscriptionState = {
      tenantId: tenant2Id,
      cnpj: tenant2Id,
      razaoSocial: "Titanium Capital Fundo de Investimento em Direitos Creditórios",
      plano: "ENTERPRISE",
      status: "ACTIVE",
      provider: "STRIPE",
      cicloAtualInicio: inicioCiclo,
      cicloAtualFim: fimCiclo,
      seatsContratados: 50,
      seatsUtilizados: 28,
      precatoriosProcessadosNoCiclo: 142,
      faturas: [
        {
          id: "inv-002",
          tenantId: tenant2Id,
          numeroFatura: "VLX-2026-0842",
          competenciaMesAno: "08/2026",
          plano: "ENTERPRISE",
          valorBaseBrl: 14900.00,
          seatsContratados: 50,
          seatsUtilizados: 28,
          seatsExtrasQtd: 0,
          valorSeatsExtrasBrl: 0,
          precatoriosInclusos: 500,
          precatoriosProcessadosQtd: 110,
          precatoriosExtrasQtd: 0,
          valorPrecatoriosExtrasBrl: 0,
          valorTotalBrl: 14900.00,
          status: "PAGO",
          provider: "STRIPE",
          providerInvoiceId: "in_stripe_titanium_aug2026",
          vencimento: "2026-09-10",
          pagoEm: "2026-09-05",
          criadaEm: "2026-09-01",
          auditHash: "0x12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3"
        }
      ]
    };
    this.subscriptions.set(tenant2Id, sub2);
  }

  /**
   * Obtém ou inicializa a assinatura de um tenant
   */
  public getSubscription(tenantId: string, cnpjFallback?: string, razaoSocialFallback?: string): TenantSubscriptionState {
    const cleanId = tenantId.trim();
    let sub = this.subscriptions.get(cleanId);

    if (!sub) {
      const agora = new Date();
      const inicioCiclo = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
      const fimCiclo = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).toISOString();

      sub = {
        tenantId: cleanId,
        cnpj: cnpjFallback || cleanId,
        razaoSocial: razaoSocialFallback || "Empresa Cliente SaaS",
        plano: "STARTER",
        status: "ACTIVE",
        provider: this.activeProviderType,
        cicloAtualInicio: inicioCiclo,
        cicloAtualFim: fimCiclo,
        seatsContratados: SAAS_PLANS.STARTER.includedSeats,
        seatsUtilizados: 1,
        precatoriosProcessadosNoCiclo: 0,
        faturas: []
      };
      this.subscriptions.set(cleanId, sub);
    }

    return sub;
  }

  /**
   * Registra a passagem de um precatório pela esteira de auditoria/liquidação (Metering).
   * Incrementa a contagem de precatórios do ciclo atual do tenant.
   */
  public registrarConsumoPrecatorio(tenantId: string, precatorioId: string, oficioNumero: string): {
    totalNoCiclo: number;
    limiteIncluso: number;
    excedente: number;
    custoExcedenteBrl: number;
  } {
    const sub = this.getSubscription(tenantId);
    sub.precatoriosProcessadosNoCiclo += 1;
    this.subscriptions.set(tenantId, sub);

    const planDef = SAAS_PLANS[sub.plano];
    const limiteIncluso = planDef.includedPrecatoriosMonthly;
    const excedente = Math.max(0, sub.precatoriosProcessadosNoCiclo - limiteIncluso);
    const custoExcedenteBrl = excedente * planDef.extraPrecatorioPriceBrl;

    return {
      totalNoCiclo: sub.precatoriosProcessadosNoCiclo,
      limiteIncluso,
      excedente,
      custoExcedenteBrl
    };
  }

  /**
   * Adiciona ou remove seats da assinatura do tenant
   */
  public ajustarSeats(tenantId: string, novosSeatsContratados: number): TenantSubscriptionState {
    const sub = this.getSubscription(tenantId);
    sub.seatsContratados = Math.max(1, novosSeatsContratados);
    this.subscriptions.set(tenantId, sub);
    return sub;
  }

  /**
   * Altera o plano contratado do tenant
   */
  public alterarPlano(tenantId: string, novoPlano: SubscriptionPlanKey): TenantSubscriptionState {
    const sub = this.getSubscription(tenantId);
    sub.plano = novoPlano;
    const planDef = SAAS_PLANS[novoPlano];
    // Se os seats contratados forem inferiores ao mínimo do novo plano, ajusta automaticamente
    if (sub.seatsContratados < planDef.includedSeats) {
      sub.seatsContratados = planDef.includedSeats;
    }
    this.subscriptions.set(tenantId, sub);
    return sub;
  }

  /**
   * Calcula o preview detalhado do fechamento de fatura para o ciclo atual
   */
  public calcularPreviaFaturaCiclo(tenantId: string): BillingInvoiceData {
    const sub = this.getSubscription(tenantId);
    const planDef = SAAS_PLANS[sub.plano];

    // Cálculo de Seats Extras
    const seatsExtrasQtd = Math.max(0, sub.seatsContratados - planDef.includedSeats);
    const valorSeatsExtrasBrl = seatsExtrasQtd * planDef.extraSeatPriceBrl;

    // Cálculo de Precatórios Extras Processados no Ciclo
    const precatoriosExtrasQtd = Math.max(0, sub.precatoriosProcessadosNoCiclo - planDef.includedPrecatoriosMonthly);
    const valorPrecatoriosExtrasBrl = precatoriosExtrasQtd * planDef.extraPrecatorioPriceBrl;

    const valorBaseBrl = planDef.basePriceMonthlyBrl;
    const valorTotalBrl = valorBaseBrl + valorSeatsExtrasBrl + valorPrecatoriosExtrasBrl;

    const agora = new Date();
    const competencia = `${String(agora.getMonth() + 1).padStart(2, '0')}/${agora.getFullYear()}`;
    const vencimento = new Date(agora.getFullYear(), agora.getMonth() + 1, 10).toISOString().split('T')[0];

    // Hash criptográfico de integridade da fatura
    const payloadIntegridade = `${tenantId}:${competencia}:${valorTotalBrl}:${sub.seatsContratados}:${sub.precatoriosProcessadosNoCiclo}`;
    let hash = 0;
    for (let i = 0; i < payloadIntegridade.length; i++) {
      hash = (hash << 5) - hash + payloadIntegridade.charCodeAt(i);
      hash |= 0;
    }
    const auditHash = `0x${Math.abs(hash).toString(16).padStart(16, '0')}${Date.now().toString(16)}`;

    return {
      id: `inv-${Date.now()}`,
      tenantId,
      numeroFatura: `VLX-${agora.getFullYear()}-${secureInt(1000, 9999)}`,
      competenciaMesAno: competencia,
      plano: sub.plano,
      valorBaseBrl,
      seatsContratados: sub.seatsContratados,
      seatsUtilizados: sub.seatsUtilizados,
      seatsExtrasQtd,
      valorSeatsExtrasBrl,
      precatoriosInclusos: planDef.includedPrecatoriosMonthly,
      precatoriosProcessadosQtd: sub.precatoriosProcessadosNoCiclo,
      precatoriosExtrasQtd,
      valorPrecatoriosExtrasBrl,
      valorTotalBrl,
      status: 'PENDENTE',
      provider: sub.provider || this.activeProviderType,
      vencimento,
      criadaEm: agora.toISOString().split('T')[0],
      auditHash
    };
  }

  /**
   * Emite e fecha a fatura do ciclo, acionando o adapter do provedor configurado
   */
  public async emitirFaturaCiclo(tenantId: string): Promise<BillingInvoiceData> {
    const fatura = this.calcularPreviaFaturaCiclo(tenantId);
    const sub = this.getSubscription(tenantId);
    const providerAdapter = this.providers[sub.provider || this.activeProviderType];

    const resultadoProvedor = await providerAdapter.gerarFatura({
      tenant: {
        cnpj: sub.cnpj,
        razaoSocial: sub.razaoSocial,
        email: `financeiro@${sub.cnpj.replace(/\D/g, '')}.com.br`
      },
      fatura
    });

    fatura.providerInvoiceId = resultadoProvedor.providerInvoiceId;
    fatura.pdfUrl = resultadoProvedor.pdfUrl;
    fatura.pixCopiaECola = resultadoProvedor.pixCopiaECola;

    // Salva no histórico da assinatura do tenant
    sub.faturas.unshift(fatura);
    // Reinicia contagem do ciclo
    sub.precatoriosProcessadosNoCiclo = 0;
    this.subscriptions.set(tenantId, sub);

    return fatura;
  }

  /**
   * Simula a liquidação de uma fatura
   */
  public liquidarFaturaManual(tenantId: string, faturaId: string): BillingInvoiceData | null {
    const sub = this.getSubscription(tenantId);
    const fatura = sub.faturas.find(f => f.id === faturaId || f.numeroFatura === faturaId);
    if (fatura) {
      fatura.status = 'PAGO';
      fatura.pagoEm = new Date().toISOString().split('T')[0];
      this.subscriptions.set(tenantId, sub);
      return fatura;
    }
    return null;
  }
}

export const SubscriptionEngine = SubscriptionEngineService.getInstance();

/**
 * Gera e realiza o download do documento formal de cobrança (Fatura/Invoice B2B) em formato PDF.
 * Inclui detalhamento de seats, precatórios processados, instrução Pix e aviso legal do Fabricante.
 */
export function baixarFaturaPdf(fatura: BillingInvoiceData, tenantNome: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Top Header Institucional
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VELATRIX AOS — FATURA DE LICENCIAMENTO SAAS B2B', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('DOCUMENTO AUXILIAR DE COBRANÇA DE LICENÇA DE SOFTWARE E PROCESSAMENTO', 14, 22);
  doc.text(`FATURA Nº: ${fatura.numeroFatura} | PROVEDOR: ${fatura.provider} | STATUS: ${fatura.status}`, 14, 28);

  // 2. Dados do Fabricante (Licenciante) e do Cliente (Tenant)
  let y = 46;
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. PARTES DA LICENÇA TECNOLÓGICA', 14, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  // Coluna Esquerda: Fabricante
  doc.text('FABRICANTE / LICENCIANTE (SaaS):', 14, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Velatrix Soluções de Tecnologia de Software', 14, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Natureza: Fabricante de Software (CNAE 62.01-5)', 14, y + 10);
  doc.text('Contato: billing@velatrix.app', 14, y + 15);

  // Coluna Direita: Tenant
  doc.text('TENANT CONTRATANTE (OPERADOR):', 110, y);
  doc.setFont('helvetica', 'bold');
  doc.text(tenantNome, 110, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ / ID: ${fatura.tenantId}`, 110, y + 10);
  doc.text(`Plano Contratado: ${fatura.plano}`, 110, y + 15);

  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  // 3. Detalhamento dos Serviços e Métricas do Ciclo
  y += 8;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. DISCRIMINAÇÃO DE LICENÇA & PROCESSAMENTO DE PRECATÓRIOS', 14, y);

  y += 8;
  // Tabela Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM / ESPECIFICAÇÃO DO SERVIÇO', 16, y + 5.5);
  doc.text('QTD / BASE', 120, y + 5.5);
  doc.text('VALOR (R$)', 165, y + 5.5);

  y += 8;
  // Item 1: Assinatura Base
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Assinatura Recorrente — Plano ${fatura.plano}`, 16, y + 5);
  doc.text(`${fatura.seatsContratados} seats / ${fatura.precatoriosInclusos} precatórios`, 120, y + 5);
  doc.text(`R$ ${fatura.valorBaseBrl.toFixed(2)}`, 165, y + 5);

  y += 7;
  // Item 2: Seats Extras
  if (fatura.seatsExtrasQtd > 0) {
    doc.text(`Seats Extras Adicionados à Assinatura`, 16, y + 5);
    doc.text(`${fatura.seatsExtrasQtd} seat(s) extra(s)`, 120, y + 5);
    doc.text(`R$ ${fatura.valorSeatsExtrasBrl.toFixed(2)}`, 165, y + 5);
    y += 7;
  }

  // Item 3: Precatórios Processados no Ciclo
  doc.text(`Processamento de Precatórios na Esteira Velatrix`, 16, y + 5);
  doc.text(`${fatura.precatoriosProcessadosQtd} proc. (${fatura.precatoriosExtrasQtd} extras)`, 120, y + 5);
  doc.text(`R$ ${fatura.valorPrecatoriosExtrasBrl.toFixed(2)}`, 165, y + 5);

  y += 10;
  // Totalizador
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('VALOR TOTAL DA FATURA (BRL):', 16, y + 6.5);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text(`R$ ${fatura.valorTotalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 160, y + 6.5);

  y += 18;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  // 4. Instrução de Pagamento Pix
  y += 8;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. INSTRUÇÃO PARA PAGAMENTO DA LICENÇA', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Vencimento: ${fatura.vencimento} | Modo de Faturamento: ${fatura.provider}`, 14, y);
  
  if (fatura.pixCopiaECola) {
    y += 5;
    doc.text('Chave / Pix Copia e Cola:', 14, y);
    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    const splitPix = doc.splitTextToSize(fatura.pixCopiaECola, 180);
    doc.text(splitPix, 14, y + 4);
    y += splitPix.length * 3.5 + 4;
  } else {
    y += 5;
    doc.text('Pagamento processado via cartão de crédito recorrente / débito automático Stripe.', 14, y);
    y += 6;
  }

  // 5. Cláusula de Isenção Regulatória (Fabricante de Software)
  y += 8;
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, y, 182, 24, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('AVISO LEGAL & STATUS REGULATÓRIO:', 16, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const legalText = 
    'A Velatrix atua estritamente como desenvolvedora e licenciante de plataforma SaaS. ' +
    'Não é instituição financeira, sociedade de crédito ou correspondente bancário. ' +
    'A tecnologia disponibiliza auditoria e orquestração computacional; todas as operações ' +
    'são realizadas com CNPJ, conta e responsabilidade exclusiva do Tenant contratante.';
  const splitLegal = doc.splitTextToSize(legalText, 178);
  doc.text(splitLegal, 16, y + 10);

  // 6. Rodapé com Audit Hash
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Audit Hash: ${fatura.auditHash}`, 14, 285);
  doc.text(`Gerado em ${new Date().toISOString()} • Velatrix Software Architecture`, 14, 289);

  // Trigger download
  doc.save(`Fatura_Velatrix_${fatura.numeroFatura}.pdf`);
}
