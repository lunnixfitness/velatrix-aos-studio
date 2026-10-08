import { SharedTenantTaxData } from './tenantTaxRecoveryBridge';
import { computeSha256Sync } from './expertTaxEngineService';

export interface PartnerProfile {
  partnerId: string;
  firmName: string;
  lawyerName: string;
  oabOrCrc: string;
  email: string;
  phone: string;
  brandPrimaryColor: string; // Hex color for white-label reports (default: #4F46E5)
  brandSecondaryColor: string;
  pixKeyType: 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  pixKey: string; // Kept as empty/mocked configuration field
  isVerified: boolean;
  onboardingCompletedAt: string;
}

export interface PartnerAuditedClient {
  id: string;
  cnpj: string;
  companyName: string;
  tradeName?: string;
  sector: string;
  taxRegime: 'Lucro Real' | 'Lucro Presumido' | 'Simples Nacional';
  estimatedRecovery60Months: number;
  successFeeEstimated: number; // 20% do benefício
  partnerShare70Pct: number; // 70% do success fee
  velatrixShare30Pct: number; // 30% do success fee
  status: 'AUDITADO_D0' | 'DOSSIE_GERADO' | 'CONTRATO_ENVIADO' | 'PROTOCOLADO' | 'HOMOLOGADO' | 'LIQUIDADO';
  statusLabel: string;
  lastAuditDate: string;
  opportunitySummary: string;
  proofHash: string;
}

export interface AcademyModule {
  id: string;
  title: string;
  category: 'ABORDAGEM' | 'LEITURA_RELATORIO' | 'FECHAMENTO_CONTRATO';
  durationMinutes: number;
  description: string;
  objectives: string[];
  tips: string[];
  isCompleted?: boolean;
}

export interface SalesScriptCopy {
  id: string;
  title: string;
  channel: 'WHATSAPP' | 'EMAIL' | 'REUNIAO';
  targetAudience: string;
  hook: string;
  templateText: string;
}

const STORAGE_KEY_PROFILE = 'velatrix_partner_growth_profile_v1';
const STORAGE_KEY_CLIENTS = 'velatrix_partner_growth_clients_v1';

export const DEFAULT_PARTNER_PROFILE: PartnerProfile = {
  partnerId: 'partner_adv_vasconcelos',
  firmName: 'Vasconcelos & Associados Advocacia Tributária',
  lawyerName: 'Dr. Marcelo Vasconcelos Ribeiro',
  oabOrCrc: 'OAB/SP 284.910',
  email: 'marcelo@vasconcelosadv.com.br',
  phone: '(11) 98412-4400',
  brandPrimaryColor: '#4F46E5', // Indigo padrão
  brandSecondaryColor: '#06B6D4', // Cyan
  pixKeyType: 'CNPJ',
  pixKey: '', // Campo de configuração seguro vazio/mockado
  isVerified: true,
  onboardingCompletedAt: '2026-08-15T10:00:00.000Z'
};

export const INITIAL_AUDITED_CLIENTS: PartnerAuditedClient[] = [
  {
    id: 'cli-01',
    cnpj: '33.041.260/0001-88',
    companyName: 'Vortex Logística & Manufatura S.A.',
    sector: 'Manufatura & Indústria Metalmecânica',
    taxRegime: 'Lucro Real',
    estimatedRecovery60Months: 2485000.00,
    successFeeEstimated: 497000.00,
    partnerShare70Pct: 347900.00,
    velatrixShare30Pct: 149100.00,
    status: 'HOMOLOGADO',
    statusLabel: 'Homologado RFB (DCOMP Pronto)',
    lastAuditDate: '2026-08-30 14:20',
    opportunitySummary: 'Tema 69 STF (Exclusão do ICMS da base do PIS/COFINS) e créditos sobre fretes de insumos.',
    proofHash: computeSha256Sync(JSON.stringify({
      schema: 'PARTNER_AUDITED_CLIENT_V1',
      cnpj: '33041260000188',
      companyName: 'VORTEX LOGÍSTICA & MANUFATURA S.A.',
      credits: 2485000.00
    }))
  },
  {
    id: 'cli-02',
    cnpj: '12.840.119/0001-44',
    companyName: 'Rede Farma Mais Distribuição Ltda',
    sector: 'Varejo Farmacêutico & Higiene',
    taxRegime: 'Simples Nacional',
    estimatedRecovery60Months: 390000.00,
    successFeeEstimated: 78000.00,
    partnerShare70Pct: 54600.00,
    velatrixShare30Pct: 23400.00,
    status: 'LIQUIDADO',
    statusLabel: 'Crédito Compensado / Liquidado',
    lastAuditDate: '2026-08-28 09:15',
    opportunitySummary: 'Segregação de receitas monofásicas PIS/COFINS (Lei 10.147/00) recolhidas indevidamente no PGDAS-D.',
    proofHash: computeSha256Sync(JSON.stringify({
      schema: 'PARTNER_AUDITED_CLIENT_V1',
      cnpj: '12840119000144',
      companyName: 'REDE FARMA MAIS DISTRIBUIÇÃO LTDA',
      credits: 390000.00
    }))
  },
  {
    id: 'cli-03',
    cnpj: '04.112.980/0001-02',
    companyName: 'Clínica Santa Helena Diagnósticos',
    sector: 'Serviços Médicos & Diagnóstico por Imagem',
    taxRegime: 'Lucro Presumido',
    estimatedRecovery60Months: 820000.00,
    successFeeEstimated: 164000.00,
    partnerShare70Pct: 114800.00,
    velatrixShare30Pct: 49200.00,
    status: 'CONTRATO_ENVIADO',
    statusLabel: 'Contrato de Êxito Enviado',
    lastAuditDate: '2026-08-29 17:40',
    opportunitySummary: 'Redução da base presumida de IRPJ (32% para 8%) e CSLL (32% para 12%) conforme Lei 9.249/95 e RDC 50 Anvisa.',
    proofHash: computeSha256Sync(JSON.stringify({
      schema: 'PARTNER_AUDITED_CLIENT_V1',
      cnpj: '04112980000102',
      companyName: 'CLÍNICA SANTA HELENA DIAGNÓSTICOS',
      credits: 820000.00
    }))
  },
  {
    id: 'cli-04',
    cnpj: '45.992.301/0001-77',
    companyName: 'TransGlobal Transportes & Frota S.A.',
    sector: 'Transporte Rodoviário de Cargas',
    taxRegime: 'Lucro Real',
    estimatedRecovery60Months: 3120000.00,
    successFeeEstimated: 624000.00,
    partnerShare70Pct: 436800.00,
    velatrixShare30Pct: 187200.00,
    status: 'AUDITADO_D0',
    statusLabel: 'Auditado em D+0 (Pronto p/ Dossiê)',
    lastAuditDate: '2026-08-31 08:30',
    opportunitySummary: 'Créditos extemporâneos de PIS/COFINS sobre óleo diesel, lubrificantes, pedágios e leasing mercantil de frotas pesadas.',
    proofHash: computeSha256Sync(JSON.stringify({
      schema: 'PARTNER_AUDITED_CLIENT_V1',
      cnpj: '45992301000177',
      companyName: 'TRANSGLOBAL TRANSPORTES & FROTA S.A.',
      credits: 3120000.00
    }))
  },
  {
    id: 'cli-vanguarda',
    cnpj: '25.369.321/0001-23',
    companyName: 'Grupo Vanguarda Alimentos S/A',
    sector: 'Alimentos & Agroindústria',
    taxRegime: 'Lucro Real',
    estimatedRecovery60Months: 2940000.00,
    successFeeEstimated: 588000.00,
    partnerShare70Pct: 411600.00,
    velatrixShare30Pct: 176400.00,
    status: 'AUDITADO_D0',
    statusLabel: 'Auditado em D+0 (Pronto p/ Dossiê)',
    lastAuditDate: '2026-09-01 09:30',
    opportunitySummary: 'Subvenções para Investimento (Tema 1182 STJ) e créditos extemporâneos de insumos agroindustriais.',
    proofHash: computeSha256Sync(JSON.stringify({
      schema: 'PARTNER_AUDITED_CLIENT_V1',
      cnpj: '25369321000123',
      companyName: 'GRUPO VANGUARDA ALIMENTOS S/A',
      credits: 2940000.00
    }))
  }
];

export const AOS_ACADEMY_MODULES: AcademyModule[] = [
  {
    id: 'mod-1',
    title: 'Módulo 1: Abordagem de Carteira & Pitch Consultivo',
    category: 'ABORDAGEM',
    durationMinutes: 18,
    description: 'Como apresentar a auditoria pericial sem custo inicial ("Zero Pro-Labore") e despertar o interesse do CFO ou Diretor Jurídico.',
    objectives: [
      'Identificar rapidamente regimes tributários com maior volume oculto (Lucro Real e Presumido).',
      'Posicionar a auditoria algorítmica D+0 como um raio-X pericial sem risco financeiro para a empresa.',
      'Superar a objeção clássica de "nosso contador já cuida de tudo" utilizando a blindagem pericial cruzada SPED/EFD.'
    ],
    tips: [
      'Nunca prometa valores antes do diagnóstico algorítmico rodar.',
      'Utilize o link individual de diagnóstico para envio direto ao cliente.',
      'Destaque que o trabalho respeita estritamente a jurisprudência pacificada do STF/STJ.'
    ]
  },
  {
    id: 'mod-2',
    title: 'Módulo 2: Leitura e Apresentação do Dossiê Pericial',
    category: 'LEITURA_RELATORIO',
    durationMinutes: 24,
    description: 'Interpretação técnica dos relatórios D+0, gráficos de conciliação 60 meses e fundamentação de teses pacíficas.',
    objectives: [
      'Explicar ao empresário a decomposição entre créditos não contestáveis (PIS/COFINS Tema 69) e oportunidades setoriais.',
      'Demonstrar a prova de anterioridade criptográfica (Hash SHA-256) como garantia de higidez jurídica.',
      'Orientar o cliente sobre os prazos regulamentares da Receita Federal (DCOMP) e compensações administrativas.'
    ],
    tips: [
      'Mostre a primeira página do Dossiê White-Label com o logotipo e OAB do seu escritório.',
      'Foque no benefício líquido que entra no fluxo de caixa da empresa nos próximos 30 a 90 dias.',
      'Reforce que todo o cálculo foi conciliado linha a linha contra a EFD-Contribuições original.'
    ]
  },
  {
    id: 'mod-3',
    title: 'Módulo 3: Fechamento de Contrato de Êxito & Split 70/30',
    category: 'FECHAMENTO_CONTRATO',
    durationMinutes: 20,
    description: 'Assinatura digital do contrato de honorários de êxito, termo de não-circunvenção e governança de repasse financeiro.',
    objectives: [
      'Apresentar o Contrato Digital de Honorários gerado automaticamente pelo sistema.',
      'Explicar com clareza o modelo de Success Fee (remuneração condicionada à efetiva compensação/homologação).',
      'Formalizar a regra contratual de split transparente (70% Parceiro / 30% Velatrix) com liquidação direta.'
    ],
    tips: [
      'Colete a assinatura digital via plataforma para travamento imediato de anterioridade.',
      'Esclareça que a contratação de software contínuo SaaS (se houver) é 100% Velatrix e independente dos honorários de êxito.',
      'Mantenha o cliente informado das etapas pelo painel compartilhado.'
    ]
  }
];

export const SALES_SCRIPTS_COLLECTION: SalesScriptCopy[] = [
  {
    id: 'script-wpp-1',
    title: 'Abordagem Inicial WhatsApp (CFO / Diretor Financeiro)',
    channel: 'WHATSAPP',
    targetAudience: 'CFOs, Controllers e Diretores de Empresas Médias/Grandes',
    hook: 'Diagnóstico Tributário Pericial D+0 sem custo prévio',
    templateText: `Olá, [NOME_CONTATO], tudo bem? Aqui é o [SEU_NOME], do escritório [SEU_ESCRITORIO].

Estamos conduzindo uma auditoria pericial especializada com tecnologia de cruzamento de dados fiscais (SPED/EFD) e identificamos oportunidades tributárias expressivas decorrentes de teses pacificadas nos tribunais superiores (como a exclusão do ICMS do PIS/COFINS e créditos extemporâneos) para o setor da [NOME_EMPRESA].

Realizamos um diagnóstico prévio sem qualquer custo inicial ("Zero Pro-Labore") para quantificar o valor recuperável dos últimos 60 meses. 

Você teria 15 minutos nesta semana para eu lhe apresentar esse dossiê preliminar com os números da sua empresa?`
  },
  {
    id: 'script-email-1',
    title: 'E-mail Formal de Apresentação de Dossiê Pericial',
    channel: 'EMAIL',
    targetAudience: 'Diretoria Jurídica e Financeira',
    hook: 'Envio de laudo técnico com valores dos últimos 60 meses',
    templateText: `Assunto: Dossiê Pericial Tributário D+0 — Oportunidades de Recuperação Fiscal para a [NOME_EMPRESA]

Prezado(a) [NOME_CONTATO],

Espero que este e-mail o(a) encontre bem.

Nosso escritório, [SEU_ESCRITORIO] ([SEU_REGISTRO_OAB]), em parceria com a infraestrutura pericial Velatrix AOS, concluiu um levantamento analítico sobre o potencial de créditos tributários extemporâneos e compensações administrativas aplicáveis à [NOME_EMPRESA] (CNPJ [CNPJ_EMPRESA]).

Principais destaques identificados:
• Período Auditado: Últimos 60 meses de operações fiscais
• Potencial Estimado de Recuperação: [VALOR_ESTIMADO]
• Fundamentação: Jurisprudência pacificada STF/STJ e normas da RFB
• Modelo de Atuação: 100% no êxito ("Success Fee" vinculado à homologação)

Anexo a esta mensagem, enviamos o Dossiê Técnico Confidencial contendo a metodologia e a prova de higidez digital (Hash de anterioridade).

Podemos agendar uma breve videoconferência de 20 minutos para detalhar o plano de ação e o cronograma de habilitação?

Atenciosamente,

[SEU_NOME]
[SEU_ESCRITORIO] — OAB [SEU_REGISTRO_OAB]
Telefone: [SEU_TELEFONE] | E-mail: [SEU_EMAIL]`
  },
  {
    id: 'script-reuniao-1',
    title: 'Pitch de Reunião de Fechamento de Contrato de Êxito',
    channel: 'REUNIAO',
    targetAudience: 'Mesa de Decisão (CFO, Jurídico e Sócio)',
    hook: 'Segurança jurídica, ausência de desembolso e split automatizado',
    templateText: `"Prezados diretores, nosso modelo de trabalho é construído sobre três pilares inegociáveis:

1. Risco Financeiro Zero: A [NOME_EMPRESA] não desembolsa nenhum valor antecipado. Nossos honorários são estritamente devidos sobre o êxito financeiro após a efetiva compensação/homologação pela Receita Federal.
2. Rigor Pericial Linha a Linha: Todos os valores foram cruzados contra os arquivos EFD-Contribuições e SPED Fiscal, amparados por hash criptográfico de anterioridade.
3. Agilidade Administrativa: A habilitação ocorre via procedimento administrativo célere (PER/DCOMP), sem necessidade de litígios demorados.

Podemos assinar digitalmente o instrumento de honorários de êxito agora para iniciarmos o protocolo pericial formal?"`
  }
];

export const PartnerGrowthService = {
  getProfile(): PartnerProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        return { ...DEFAULT_PARTNER_PROFILE, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PARTNER_PROFILE;
  },

  saveProfile(profile: Partial<PartnerProfile>): PartnerProfile {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(updated));
    return updated;
  },

  getClients(): PartnerAuditedClient[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLIENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return INITIAL_AUDITED_CLIENTS;
  },

  addClientFromOnboarding(cnpj: string, companyName?: string, sector?: string): PartnerAuditedClient {
    const currentClients = this.getClients();
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    // Simulate smart D+0 audit diagnosis based on known mock profiles
    const estimated60m = Math.floor(180000 + (parseInt(cleanCnpj.slice(-4) || '500', 10) * 1200));
    const successFee = Math.round(estimated60m * 0.20);
    const partnerCut = Math.round(successFee * 0.70);
    const velatrixCut = Math.round(successFee * 0.30);

    const newClient: PartnerAuditedClient = {
      id: `cli-onb-${Date.now()}`,
      cnpj: cnpj.length === 14 
        ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
        : cnpj,
      companyName: companyName || `Empresa Cliente ${cleanCnpj.slice(0, 4)} S.A.`,
      sector: sector || 'Indústria & Distribuição',
      taxRegime: 'Lucro Real',
      estimatedRecovery60Months: estimated60m,
      successFeeEstimated: successFee,
      partnerShare70Pct: partnerCut,
      velatrixShare30Pct: velatrixCut,
      status: 'AUDITADO_D0',
      statusLabel: 'Auditado em D+0 (Pronto p/ Dossiê)',
      lastAuditDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      opportunitySummary: 'Varredura automática D+0: PIS/COFINS monofásicos, exclusão ICMS da base de cálculo e créditos de insumos 60 meses.',
      proofHash: computeSha256Sync(JSON.stringify({
        schema: 'PARTNER_AUDITED_CLIENT_V1',
        cnpj: cleanCnpj,
        companyName: companyName || `Empresa Cliente ${cleanCnpj.slice(0, 4)} S.A.`,
        credits: estimated60m,
        timestamp: Date.now()
      }))
    };

    const updated = [newClient, ...currentClients];
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(updated));
    return newClient;
  }
};
