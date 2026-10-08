import { PreliminaryTaxTeseEstimate, TaxRegime } from './tenantTaxRecoveryBridge';

export interface SectorThesisTemplate {
  id: string;
  code: string;
  title: string;
  court: string;
  shareOfTotal: number; // Proporção estimada do crédito total do setor
  docsMultiplier: number; // Multiplicador para cálculo de documentos analisados
  riskLevel: 'BAIXO' | 'MEDIO' | 'ALTO';
  riskScore: 'VERDE' | 'AMARELO' | 'VERMELHO';
  riskScoreLabel: string;
  eligibleRegimes: TaxRegime[];
  status: 'PRE_ANALISADO' | 'HABILITADO_RFB' | 'EM_COMPENSACAO' | 'PROVA_CALCULADA' | 'LAUDO_PRONTO' | 'EM_ANALISE_RISCO';
  statusLabel: string;
  jurisprudence: string;
  description: string;
  category: 'FEDERAL' | 'ESTADUAL' | 'MUNICIPAL' | 'PREVIDENCIARIO' | 'INSUMOS_PIS_COFINS' | 'SIMPLES_SEGREGACAO';
  actionProtocol: string;
}

// Catálogo de Teses Especializadas por Setor Econômico
const SECTOR_THESES_CATALOG: Record<string, SectorThesisTemplate[]> = {
  // 1. AUTOPEÇAS & MOTOPEÇAS (Tributação Concentrada Monofásica / Bifásica - Lei 10.485/2002)
  auto_parts: [
    {
      id: 'tese_bifasico_autopeças',
      code: 'Lei nº 10.485/2002 (Art. 3º)',
      title: 'PIS/COFINS Monofásico/Bifásico sobre Autopeças & Motopeças',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.36,
      docsMultiplier: 38000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Tributação Monofásica Expressa em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido', 'simples_nacional'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Tributação concentrada incidente na indústria/importador com alíquota zero nas saídas de distribuidores, atacadistas e varejistas (Art. 3º, § 2º). Repetição de indébito de CST 01/51 indevidamente tributados.',
      description: 'Auditoria pericial de peças automotivas e componentes de reposição (NCMs dos Anexos I e II da Lei 10.485/02) vendidos com CST 01/51 em vez de CST 04 (Alíquota Zero).',
      category: 'FEDERAL',
      actionProtocol: 'Segregação no Bloco M/C + Pedido de Restituição PER/DCOMP'
    },
    {
      id: 'tese_tema_69_autopeças',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base de Cálculo do PIS/COFINS (Autopeças)',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.28,
      docsMultiplier: 42000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Tese do Século. O ICMS destacado nas notas fiscais de venda não compõe o faturamento para fins de incidência das contribuições federais.',
      description: 'Varredura de 60 meses expurgando o ICMS destacado da base de cálculo das notas fiscais de componentes automotivos.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_tema_1125_autopeças',
      code: 'Tema 1125 STJ (REsp 1.896.678)',
      title: 'Exclusão do ICMS-ST da Base do PIS/COFINS na Distribuição Automotiva',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.16,
      docsMultiplier: 21000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Recurso Repetitivo STJ',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'EM_COMPENSACAO',
      statusLabel: 'Em Compensação',
      jurisprudence: 'O ICMS recolhido por substituição tributária (ICMS-ST) para frente na cadeia automotiva não integra a receita bruta da adquirente.',
      description: 'Apuração do ICMS-ST retido nas operações de distribuição de peças e acessórios para restituição extemporânea.',
      category: 'FEDERAL',
      actionProtocol: 'Compensação Administrativa DCOMP'
    },
    {
      id: 'tese_insumos_autopeças',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Créditos Ampliados s/ Fluidos de Usinagem, Ferramental & Moldes',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.10,
      docsMultiplier: 13500,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Critério de Essencialidade Produtiva',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Crédito da não-cumulatividade sobre fluidos de corte, pastilhas de usinagem, matrizes e embalagens industriais protetivas de transporte de peças.',
      description: 'Levantamento de materiais de desgaste e ferramentaria de manufatura mecânica com laudo técnico de essencialidade.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial Mecânico + PER/DCOMP'
    },
    {
      id: 'tese_ipi_insumos_autopeças',
      code: 'Tema 322 STF (RE 562.980)',
      title: 'Crédito de IPI na Aquisição de Insumos Automotivos Isentos/Alíquota Zero',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.05,
      docsMultiplier: 6200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STF / Princípio da Não-Cumulatividade',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Direito ao creditamento de IPI na entrada de matérias-primas e produtos intermediários aplicados na montagem de peças.',
      description: 'Auditoria de notas de aquisição de matérias-primas metalúrgicas sem destaque de IPI ou sob regimes especiais.',
      category: 'FEDERAL',
      actionProtocol: 'Habilitação de IPI via DCOMP'
    },
    {
      id: 'tese_inss_autopeças',
      code: 'Tema 985 STF / REsp 1.230.957',
      title: 'Não Incidência Previdenciária s/ Verbas Indenizatórias da Metalurgia',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Exclusão da cota patronal de 20% + RAT sobre terço constitucional de férias, aviso prévio indenizado e primeiros 15 dias de atestado médico.',
      description: 'Auditoria da folha metalúrgica e confronto de recolhimentos GPS/DCTFWeb dos últimos 60 meses.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 2. SAÚDE, HOSPITAIS, CLÍNICAS & FARMACÊUTICA
  healthcare: [
    {
      id: 'tese_monofasico_farmaceutico',
      code: 'Lei nº 10.147/2000 (Art. 1º & 2º)',
      title: 'PIS/COFINS Monofásico sobre Medicamentos & Produtos Farmacêuticos',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.35,
      docsMultiplier: 45000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Regime Monofásico Farmacêutico',
      eligibleRegimes: ['lucro_real', 'lucro_presumido', 'simples_nacional'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Alíquota zero de PIS/COFINS na revenda de produtos farmacêuticos, medicamentos e itens de perfumaria/higiene pelas distribuidoras, farmácias e clínicas.',
      description: 'Auditoria de notas e cupons fiscais identificando fármacos tributados com CST 01 em duplicidade com a indústria de medicamentos.',
      category: 'FEDERAL',
      actionProtocol: 'Segregação de Itens Farmacêuticos + PER/DCOMP Direto'
    },
    {
      id: 'tese_tema_310_hospitalar',
      code: 'Tema 310 STJ (REsp 1.116.399) & Lei 9.249/95',
      title: 'Equiparação a Serviços Hospitalares para Clínicas & Laboratórios',
      court: 'Superior Tribunal de Justiça (Repetitivo)',
      shareOfTotal: 0.28,
      docsMultiplier: 15000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Repetitivo STJ / Laudo de Conformidade RDC 50',
      eligibleRegimes: ['lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Redução da base de presunção do IRPJ de 32% para 8% e da CSLL de 32% para 12% para clínicas médicas que realizam procedimentos e exames nos termos da RDC 50 da Anvisa.',
      description: 'Recálculo do IRPJ e CSLL pagos a maior nos últimos 60 meses com base na segregação de receitas cirúrgicas, diagnósticas e ambulatoriais.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação ECF/DCTF + PER/DCOMP com Laudo Médico-Sanitário'
    },
    {
      id: 'tese_opme_insumos',
      code: 'Lei 10.637/02 e Lei 10.833/03 (Art. 3º, II)',
      title: 'Crédito Presumido e Isenção de PIS/COFINS sobre Órteses, Próteses e OPME',
      court: 'STJ / CARF',
      shareOfTotal: 0.16,
      docsMultiplier: 12000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Desoneração OPME em Lei',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Crédito da não-cumulatividade e alíquota zero nas aquisições hospitalares de materiais especiais, próteses cardíacas, órteses ortopédicas e insumos cirúrgicos.',
      description: 'Varredura de contas médicas e relatórios de centro cirúrgico cruzados com notas de entrada de materiais OPME.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'PER/DCOMP Web com Vinculação ao Bloco M'
    },
    {
      id: 'tese_tema_118_saude',
      code: 'Tema 118 STF (RE 592.616)',
      title: 'Exclusão do ISS da Base de Cálculo do PIS/COFINS em Serviços Médicos',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.10,
      docsMultiplier: 4200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STF Vinculante',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'O ISS municipal incidente sobre honorários médicos e exames diagnósticos não compõe a receita bruta para apuração de PIS/COFINS.',
      description: 'Expurgo do ISS destacado nas notas fiscais de serviços de saúde municipais nos últimos 60 meses.',
      category: 'MUNICIPAL',
      actionProtocol: 'Habilitação de Crédito via PER/DCOMP'
    },
    {
      id: 'tese_tema_69_saude',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base do PIS/COFINS em Medicamentos & Suprimentos',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.06,
      docsMultiplier: 18000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'ICMS destacado em saídas e compras com diferimento ou substituição não integra a base do faturamento.',
      description: 'Auditoria de ICMS sobre materiais médico-hospitalares e fármacos comercializados.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_inss_saude',
      code: 'Tema 985 STF / REsp 1.230.957',
      title: 'Não Incidência Previdenciária s/ Plantões Médicos e Verbas Indenizatórias',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Não incidência de contribuição previdenciária sobre adicionais de sobreaviso, 1/3 de férias e verbas indenizatórias do corpo de enfermagem e médicos CLT.',
      description: 'Auditoria de eSocial e DCTFWeb de equipes hospitalares e clínicas.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 3. DISTRIBUIÇÃO, VAREJO, SUPERMERCADOS & BEBIDAS
  retail: [
    {
      id: 'tese_monofasico_bebidas_cosmeticos',
      code: 'Lei nº 13.097/2015 & Lei nº 10.147/2000',
      title: 'PIS/COFINS Monofásico sobre Bebidas Frias, Perfumaria & Higiene',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.34,
      docsMultiplier: 55000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Monofásico Varejista Expressa em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido', 'simples_nacional'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Tributação monofásica concentrada nos fabricantes de bebidas (cervejas, refrigerantes, água mineral) e cosméticos, com alíquota zero nas saídas varejistas e atacadistas.',
      description: 'Varredura de cupons fiscais e NF-e identificando produtos monofásicos tributados indevidamente com alíquota cheia (CST 01) na revenda.',
      category: 'FEDERAL',
      actionProtocol: 'Segregação de Monofásicos + Restituição PER/DCOMP'
    },
    {
      id: 'tese_tema_1125_varejo',
      code: 'Tema 1125 STJ (REsp 1.896.678)',
      title: 'Exclusão do ICMS-ST da Base de Cálculo do PIS/COFINS no Varejo',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.24,
      docsMultiplier: 38000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Recurso Repetitivo STJ',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'EM_COMPENSACAO',
      statusLabel: 'Em Compensação',
      jurisprudence: 'O ICMS recolhido por substituição tributária estadual não compõe a receita bruta para incidência do PIS e da COFINS.',
      description: 'Extrapolação pericial para operações interestaduais e locais de mercadorias sujeitas ao regime de substituição tributária.',
      category: 'FEDERAL',
      actionProtocol: 'Compensação Administrativa DCOMP'
    },
    {
      id: 'tese_tema_69_varejo',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base do PIS/COFINS nas Vendas Comerciais',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.20,
      docsMultiplier: 46000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Tese do Século. ICMS destacado nos cupons fiscais e NF-e não compõe a base de incidência não-cumulativa.',
      description: 'Varredura de 60 meses de saídas comerciais eliminando o ICMS próprio da base das contribuições.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_credito_aluguel_cartao',
      code: 'Lei nº 10.833/2003 (Art. 3º) & Tema 1022 STJ',
      title: 'Crédito de PIS/COFINS s/ Taxas de Cartão & Aluguéis de Lojas e CDs',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.12,
      docsMultiplier: 16000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Jurisprudência STJ / Custos Comerciais Inerentes',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Direito ao creditamento de PIS/COFINS sobre taxas cobradas por credenciadoras de cartão de crédito/débito e aluguéis prediais de centros de distribuição.',
      description: 'Auditoria de extratos de adquirência Cielo/Rede/Stone e contratos de locação imobiliária de lojas físicas.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial Financeiro + PER/DCOMP'
    },
    {
      id: 'tese_restituicao_icms_st_tema_201',
      code: 'Tema 201 STF (RE 593.849)',
      title: 'Restituição de ICMS-ST Pago a Maior (Base Efetiva < Presumida)',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.05,
      docsMultiplier: 12000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Repercussão Geral STF (Tema 201)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Direito à restituição da diferença do ICMS-ST quando a base de cálculo efetiva da operação for inferior à presumida na pauta fiscal.',
      description: 'Confronto entre a margem de valor agregado (MVA) presumida pela SEFAZ e o preço de venda praticado no PDV.',
      category: 'ESTADUAL',
      actionProtocol: 'Pedido de Ressarcimento Administrativo SEFAZ (CAT 42/e-Ressarcimento)'
    },
    {
      id: 'tese_inss_varejo',
      code: 'Tema 985 STF / REsp 1.230.957',
      title: 'Não Incidência Previdenciária s/ Verbas Indenizatórias do Varejo',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Não incidência patronal sobre 1/3 de férias, aviso prévio indenizado e afastamentos de colaboradores do varejo.',
      description: 'Auditoria de folha de pagamento de caixas, estoquistas e vendedores em 60 competências.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 4. LOGÍSTICA, TRANSPORTE DE CARGA & COMBUSTÍVEIS
  logistics: [
    {
      id: 'tese_monofasico_combustiveis',
      code: 'Lei nº 9.718/1998 (Art. 4º) & Lei nº 10.833/2003',
      title: 'PIS/COFINS Monofásico sobre Combustíveis & Lubrificantes de Frotas',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.32,
      docsMultiplier: 34000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Crédito Presumido de Combustíveis em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido', 'simples_nacional'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Crédito presumido de PIS/COFINS na aquisição de óleo diesel, biodiesel e lubrificantes utilizados diretamente como insumo na prestação de serviço de transporte rodoviário.',
      description: 'Auditoria de notas de abastecimento e telemetria de frotas pesadas segregando o crédito não-cumulativo essencial.',
      category: 'FEDERAL',
      actionProtocol: 'Habilitação no Bloco M do SPED + PER/DCOMP'
    },
    {
      id: 'tese_insumos_transporte',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Créditos Ampliados s/ Pneus, Peças de Frotas & Arla 32',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.26,
      docsMultiplier: 28000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Critério de Essencialidade do Transporte Rodoviário',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Créditos da não-cumulatividade sobre pneus novos, recapagens, fluído Arla 32 e peças de manutenção preventiva e corretiva de caminhões.',
      description: 'Varredura de ordens de serviço de mecânica de frotas e compras de recapagem com laudo técnico de rodagem.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial de Frotas + PER/DCOMP'
    },
    {
      id: 'tese_tema_69_transporte',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base do PIS/COFINS no Frete Rodoviário',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.20,
      docsMultiplier: 32000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'O ICMS destacado nos Conhecimentos de Transporte Eletrônico (CT-e) não integra a base de cálculo de PIS/COFINS.',
      description: 'Expurgo do ICMS de 60 meses de CT-e de transporte interestadual e intermunicipal de cargas.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_pedagios_subcontratacao',
      code: 'Lei nº 10.833/2003 (Art. 3º, II e VI)',
      title: 'Créditos de PIS/COFINS s/ Vale-Pedágio & Subcontratação de Transporte',
      court: 'Receita Federal / CARF',
      shareOfTotal: 0.10,
      docsMultiplier: 14000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Previsão Legal Não-Cumulativa',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Crédito sobre despesas de vale-pedágio obrigatório e pagamentos a transportadores autônomos ou transportadoras subcontratadas.',
      description: 'Confronto entre Conhecimentos de Transporte e recibos de pagamento a autônomos (RPA/CIOT).',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_tema_1182_subvencoes_transporte',
      code: 'Tema 1182 STJ (REsp 1.945.110)',
      title: 'Exclusão do Crédito Presumido de ICMS de Transporte do IRPJ/CSLL',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.07,
      docsMultiplier: 3600,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STJ (Tema 1182)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Os créditos presumidos de ICMS outorgados pelos Estados às transportadoras não configuram receita tributável pelo IRPJ e CSLL.',
      description: 'Recálculo das apurações de IRPJ/CSLL excluindo os incentivos fiscais estaduais de transporte.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação de ECF/DCTF + PER/DCOMP'
    },
    {
      id: 'tese_inss_motoristas',
      code: 'Tema 985 STF / REsp 1.230.957',
      title: 'Não Incidência de INSS s/ Diárias de Viagem & Verbas Indenizatórias',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Diárias de viagem pagas aos motoristas de caminhão e terço constitucional sem incidência patronal de INSS.',
      description: 'Auditoria de folhas de pagamento e relatórios de diárias de pernoite e refeição de motoristas.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 5. INDÚSTRIA & MANUFATURA
  manufacturing: [
    {
      id: 'tese_tema_69_industria',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base de Cálculo do PIS/COFINS Fabril',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.38,
      docsMultiplier: 48000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Tese do Século pacificada. O ICMS destacado nas notas fiscais de venda fabril não integra o faturamento.',
      description: 'Varredura de 60 meses identificando todas as notas fiscais industriais emitidas com ICMS na base de PIS/COFINS.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_tema_779_industria',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Créditos Ampliados de PIS/COFINS s/ Insumos Industriais Essenciais',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.24,
      docsMultiplier: 22000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Critério de Essencialidade / Relevância (STJ)',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Créditos sobre energia elétrica consumida no processo produtivo, manutenção fabril, EPIs, tratamento de efluentes e fretes intercompany.',
      description: 'Auditoria pericial de insumos operacionais industriais não creditados no Bloco M do SPED EFD-Contribuições.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial de Engenharia Tributária + PER/DCOMP'
    },
    {
      id: 'tese_tema_1182_subvencoes',
      code: 'Tema 1182 STJ (REsp 1.945.110)',
      title: 'Exclusão de Benefícios Fiscais Estaduais (Subvenções) do IRPJ/CSLL',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.14,
      docsMultiplier: 4500,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente Vinculante STJ',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Exclusão de benefícios fiscais estaduais (redução de base, diferimento, crédito presumido) do lucro real tributável.',
      description: 'Revisão das apurações do LALUR/LACS expurgando os incentivos fiscais estaduais da base do IRPJ e da CSLL.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação ECF + PER/DCOMP'
    },
    {
      id: 'tese_tema_322_ipi',
      code: 'Tema 322 STF (RE 562.980)',
      title: 'Crédito de IPI na Aquisição de Insumos Isentos ou com Alíquota Zero',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.10,
      docsMultiplier: 9500,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STF / Não-Cumulatividade Constitucional',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Direito à apropriação de créditos de IPI nas aquisições de matérias-primas e produtos intermediários isentos ou tributados à alíquota zero.',
      description: 'Varredura das notas fiscais de entrada de fornecedores incentivados da Zona Franca ou de produtos desonerados.',
      category: 'FEDERAL',
      actionProtocol: 'Habilitação de IPI via DCOMP'
    },
    {
      id: 'tese_tema_1125_industria',
      code: 'Tema 1125 STJ (REsp 1.896.678)',
      title: 'Exclusão do ICMS-ST e Difal da Base de Cálculo do PIS/COFINS',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.08,
      docsMultiplier: 18000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Recurso Repetitivo STJ',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'EM_COMPENSACAO',
      statusLabel: 'Em Compensação',
      jurisprudence: 'O ICMS-ST recolhido pela indústria ou distribuidor não integra o faturamento tributável.',
      description: 'Extrapolação pericial para operações interestaduais sujeitas a substituição tributária.',
      category: 'FEDERAL',
      actionProtocol: 'Compensação Administrativa no DCOMP'
    },
    {
      id: 'tese_inss_chao_fabrica',
      code: 'Tema 985 STF / REsp 1.230.957',
      title: 'Não Incidência Previdenciária s/ Verbas Indenizatórias do Chão de Fábrica',
      court: 'STF & STJ',
      shareOfTotal: 0.06,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Terço constitucional de férias, aviso prévio indenizado e auxílio-doença sem cota patronal.',
      description: 'Confronto entre GFIP/eSocial e guias GPS recolhidas nos últimos 60 meses.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 6. AGRONEGÓCIO & AGROINDÚSTRIA
  agribusiness: [
    {
      id: 'tese_credito_presumido_agro',
      code: 'Lei nº 10.925/2004 & Lei nº 12.350/2010',
      title: 'Crédito Presumido de PIS/COFINS da Agroindústria (Carnes, Grãos & Leite)',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.35,
      docsMultiplier: 36000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Crédito Presumido Agroindustrial em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Apropriação de crédito presumido de PIS/COFINS na aquisição de insumos agropecuários (gado, aves, soja, milho, leite) de produtor pessoa física ou cooperativa.',
      description: 'Auditoria pericial de notas fiscais de entrada de produtores rurais integrados e cálculo dos créditos presumidos extemporâneos.',
      category: 'FEDERAL',
      actionProtocol: 'Ressarcimento em Dinheiro via PER/DCOMP ou Compensação'
    },
    {
      id: 'tese_funrural_exportacao',
      code: 'Tema 670 STF (RE 718.874)',
      title: 'Não Incidência de Funrural sobre Receitas de Exportação Indireta',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.24,
      docsMultiplier: 8500,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Repercussão Geral STF (Tema 670)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Imunidade constitucional de contribuição previdenciária (Funrural) nas vendas de commodities destinadas à exportação por meio de tradings e cooperativas.',
      description: 'Confronto entre notas de venda com fim específico de exportação e notas de remessa alfandegária.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Habilitação de Crédito de Funrural + PER/DCOMP'
    },
    {
      id: 'tese_insumos_agro',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Créditos s/ Defensivos, Fertilizantes, Sementes & Diesel Agrícola',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.18,
      docsMultiplier: 24000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Essencialidade Agropecuária',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Crédito não-cumulativo sobre fertilizantes, defensivos agrícolas, mudas, sementes e combustíveis de maquinários agrícolas de colheita.',
      description: 'Auditoria de notas fiscais de insumos agrícolas e alocação aos centros de custos de lavouras e silos.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Agronômico-Tributário + PER/DCOMP'
    },
    {
      id: 'tese_subvencoes_credito_rural',
      code: 'Tema 1182 STJ (REsp 1.945.110)',
      title: 'Exclusão de Subvenções do Crédito Rural e Bônus de Adimplência do IRPJ/CSLL',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.10,
      docsMultiplier: 3200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STJ (Tema 1182)',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Exclusão de subvenções de equalização de taxas do Plano Safra e bônus de crédito rural da apuração do IRPJ e da CSLL.',
      description: 'Mapeamento de contratos de financiamento rural e deduções na apuração do lucro real.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação ECF + PER/DCOMP'
    },
    {
      id: 'tese_tema_69_agro',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base do PIS/COFINS na Agroindústria',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.08,
      docsMultiplier: 30000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada STF (Tema 69)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Expurgo do ICMS destacado nas saídas de produtos processados e carnes abatidas.',
      description: 'Auditoria de vendas agroindustriais com ICMS próprio destacado.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_inss_trabalhador_rural',
      code: 'Tema 985 STF',
      title: 'Não Incidência Previdenciária s/ Verbas Rescisórias do Trabalho Rural',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Exclusão de 1/3 de férias, aviso prévio e quebra de caixa sobre safristas e trabalhadores rurais.',
      description: 'Auditoria da folha rural de safristas e colhedores.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 7. SAAS, SERVIÇOS B2B & FINTECHS
  services: [
    {
      id: 'tese_tema_118_servicos',
      code: 'Tema 118 STF (RE 592.616)',
      title: 'Exclusão do ISS da Base de Cálculo do PIS/COFINS em Software & B2B',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.35,
      docsMultiplier: 36000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STF Vinculante',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'O ISS municipal retido ou destacado nas notas de prestação de serviços e licenças de software não integra a receita bruta para PIS/COFINS.',
      description: 'Auditoria de 60 meses de NFS-e emitidas de licenciamento SaaS e serviços tecnológicos.',
      category: 'MUNICIPAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_cloud_saas_insumos',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Crédito de PIS/COFINS s/ Nuvem (AWS/GCP/Azure) & Licenças Essenciais',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.26,
      docsMultiplier: 12000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Essencialidade Tecnológica (STJ)',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Servidores de nuvem, data centers e ferramentas de desenvolvimento são insumos operacionais essenciais para empresas de tecnologia.',
      description: 'Levantamento de invoices de cloud computing e faturas de infraestrutura não creditadas no SPED.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial de Engenharia de Software + PER/DCOMP'
    },
    {
      id: 'tese_retencoes_fonte_csrf',
      code: 'Lei nº 10.833/2003 (Art. 30) & IN RFB 2.110',
      title: 'Recuperação de Retenções Federais na Fonte Não Compensadas (CSRF & IRRF)',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.18,
      docsMultiplier: 18000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Direito Expresso em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Saldos credores acumulados de CSRF (4,65%) e IRRF (1,5%) retidos na fonte pelos clientes corporativos que não foram abatidos na DCTF.',
      description: 'Conciliação automática de DIRF/informes de rendimento com as guias de recolhimento dos últimos 5 anos.',
      category: 'FEDERAL',
      actionProtocol: 'Pedido Eletrônico de Restituição/Compensação PER/DCOMP'
    },
    {
      id: 'tese_tema_1067_espelho_servicos',
      code: 'Tema 1067 STJ / RE 1.233.096',
      title: 'Exclusão do PIS/COFINS de Sua Própria Base (Tese do Espelho)',
      court: 'STJ & STF',
      shareOfTotal: 0.10,
      docsMultiplier: 2800,
      riskLevel: 'ALTO',
      riskScore: 'VERMELHO',
      riskScoreLabel: 'Tese Estratégica Judicial',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'EM_ANALISE_RISCO',
      statusLabel: 'Em Análise de Risco',
      jurisprudence: 'Inconstitucionalidade da cobrança em cascata (cálculo por dentro das contribuições).',
      description: 'Mapeamento para ajuizamento de Mandado de Segurança com pedido de depósito preventivo.',
      category: 'FEDERAL',
      actionProtocol: 'Ajuizamento de Ação Judicial com Depósito'
    },
    {
      id: 'tese_previdenciario_plr_stock_options',
      code: 'Lei nº 10.101/2000 & STJ REsp 1.834.789',
      title: 'Não Incidência Previdenciária s/ PLR e Planos de Stock Options',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.06,
      docsMultiplier: 1200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STJ Favorável',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Stock options de executivos e desenvolvedores possuem natureza mercantil, afastando a incidência de cota patronal do INSS.',
      description: 'Auditoria dos acordos coletivos de PLR e planos de opção de compra de ações corporativas.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    },
    {
      id: 'tese_inss_corporativo',
      code: 'Tema 985 STF',
      title: 'Não Incidência Previdenciária sobre Verbas Indenizatórias Corporativas',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Terço constitucional de férias e aviso prévio indenizado de colaboradores de tecnologia.',
      description: 'Auditoria de folhas de pagamento eSocial corporativas.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 8. CONSTRUÇÃO CIVIL, OBRAS PESADAS & REAL ESTATE
  construction: [
    {
      id: 'tese_inss_obras_afericao_indireta',
      code: 'IN RFB 2.021/21 & Súm. Vinc. 8 STF',
      title: 'INSS-Obras: Dedução de Materiais/Subempreitada e Decadência no SERO/CNO',
      court: 'Receita Federal do Brasil (SERO)',
      shareOfTotal: 0.30,
      docsMultiplier: 16500,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Direito em Lei & Súmula Vinculante 8 STF',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Na aferição indireta da construção civil (SERO/DISO), é direito líquido da construtora abater até 50% da mão de obra mediante notas fiscais de materiais/equipamentos incorporados, além de expurgar períodos decaídos (>5 anos) no cálculo do ARO.',
      description: 'Auditoria de ARO (Aviso de Regularização de Obra), CNOs e notas fiscais de cimento, aço, concreto usinado e locação de maquinário pesado para estorno de recolhimentos indevidos de INSS-Obras.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Impugnação de ARO no SERO + Retificação DCTFWeb Aferição + PER/DCOMP'
    },
    {
      id: 'tese_ret_exclusao_financeira',
      code: 'Lei nº 10.931/2004 (Art. 4º)',
      title: 'Exclusão de Receitas Financeiras e Mútuos da Base do RET (4%)',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.25,
      docsMultiplier: 14000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Administrativa CARF',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Apenas as receitas decorrentes da comercialização de unidades imobiliárias compõem a base da alíquota unificada de 4% do Regime Especial de Tributação (RET).',
      description: 'Revisão das DARFs 4095 recolhidas expurgando rendimentos de aplicações financeiras e juros de mora.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação de DCTF + PER/DCOMP Web'
    },
    {
      id: 'tese_tema_118_construcao',
      code: 'Tema 118 STF (RE 592.616)',
      title: 'Exclusão do ISS da Base de Cálculo do PIS/COFINS em Obras Civis',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.20,
      docsMultiplier: 18000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'O ISS incidente sobre contratos de empreitada global e execução de obras de engenharia não integra a receita bruta.',
      description: 'Expurgo do ISS destacado nas medições e faturas de serviços de construção civil dos últimos 5 anos.',
      category: 'MUNICIPAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_permuta_imoveis_stj',
      code: 'Tema 1098 STJ (REsp 1.733.560)',
      title: 'Não Incidência de PIS/COFINS e IRPJ s/ Operações de Permuta de Imóveis',
      court: 'Superior Tribunal de Justiça (Repetitivo)',
      shareOfTotal: 0.10,
      docsMultiplier: 4200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Recurso Repetitivo STJ',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'O contrato de permuta de imóveis sem torna financeira não gera faturamento nem receita bruta para incidência de tributos federais.',
      description: 'Auditoria de escrituras de dação em pagamento e permuta imobiliária tributadas indevidamente como venda.',
      category: 'FEDERAL',
      actionProtocol: 'Pedido de Repetição de Indébito via PER/DCOMP'
    },
    {
      id: 'tese_inss_cessao_mao_obra',
      code: 'Lei nº 12.546/2011 & IN RFB 2.110',
      title: 'Restituição de Retenção de 11% de INSS s/ Mão de Obra e CPRB',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.07,
      docsMultiplier: 8400,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Direito Expresso em Lei',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Restituição do excesso de retenção de 11% de INSS retido na fonte pelos tomadores de serviço em medições de empreitada.',
      description: 'Conciliação entre notas fiscais de serviços com retenção na fonte e valores declarados na EFD-Reinf.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Pedido de Restituição Eletrônica no e-CAC'
    },
    {
      id: 'tese_tema_69_materiais_construcao',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS de Materiais da Base do PIS/COFINS',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.04,
      docsMultiplier: 15000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada STF (Tema 69)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'Expurgo do ICMS destacado nas saídas de materiais de construção pré-moldados e argamassas.',
      description: 'Varredura de 60 meses de notas fiscais de materiais fornecidos em obras.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_inss_operarios_construcao',
      code: 'Tema 985 STF',
      title: 'Não Incidência Previdenciária sobre Verbas Indenizatórias de Canteiro de Obras',
      court: 'STF & STJ',
      shareOfTotal: 0.04,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Não incidência de cota patronal previdenciária sobre aviso prévio indenizado e 1/3 de férias de operários.',
      description: 'Auditoria das folhas de pagamento de canteiros de obras dos últimos 5 anos.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ],

  // 9. ENERGIA, UTILITIES & MERCADO LIVRE CCEE
  energy: [
    {
      id: 'tese_tema_986_tusd_tust',
      code: 'Tema 986 STJ (REsp 1.163.020)',
      title: 'Exclusão da TUSD e TUST da Base de Cálculo do ICMS e PIS/COFINS',
      court: 'Superior Tribunal de Justiça (Repetitivo)',
      shareOfTotal: 0.38,
      docsMultiplier: 14000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Recurso Repetitivo STJ (Tema 986)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'As tarifas de uso dos sistemas de distribuição (TUSD) e transmissão (TUST) não configuram fornecimento de energia elétrica nem base de incidência.',
      description: 'Auditoria de contas de energia de alta tensão e contratos bilaterais no Ambiente de Contratação Livre (ACL).',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web com Laudo Energético'
    },
    {
      id: 'tese_tema_69_energia',
      code: 'Tema 69 STF (RE 574.706)',
      title: 'Exclusão do ICMS da Base do PIS/COFINS na Comercialização Livre (CCEE)',
      court: 'Supremo Tribunal Federal',
      shareOfTotal: 0.26,
      docsMultiplier: 21000,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Pacificada em Repercussão Geral (STF)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'HABILITADO_RFB',
      statusLabel: 'Habilitado RFB',
      jurisprudence: 'O ICMS destacado nas notas fiscais de venda de energia elétrica na CCEE não compõe o faturamento tributável.',
      description: 'Expurgo do ICMS das notas fiscais eletrônicas de comercialização de energia nos últimos 60 meses.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_insumos_redes_energia',
      code: 'Tema 779 STJ (REsp 1.221.170)',
      title: 'Crédito de PIS/COFINS s/ Insumos de Usinas, Subestações & Redes',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.16,
      docsMultiplier: 11000,
      riskLevel: 'MEDIO',
      riskScore: 'AMARELO',
      riskScoreLabel: 'Essencialidade Operacional em Energia',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Créditos sobre manutenção de transformadores, óleo isolante, baterias de subestações e manutenção de parques solares/eólicos.',
      description: 'Auditoria de ordens de manutenção de infraestrutura elétrica e laudo de engenharia de geração.',
      category: 'INSUMOS_PIS_COFINS',
      actionProtocol: 'Laudo Pericial Elétrico + PER/DCOMP'
    },
    {
      id: 'tese_geracao_distribuida_solar',
      code: 'Lei nº 13.169/2015 & Lei nº 14.300/2022',
      title: 'Isenção e Alíquota Zero de PIS/COFINS na Geração Distribuída Solar',
      court: 'Receita Federal do Brasil (Administrativo)',
      shareOfTotal: 0.10,
      docsMultiplier: 6500,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Marco Legal da Microgeração Solar',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Compensação da energia injetada na rede da distribuidora sob o regime de alíquota zero de PIS/COFINS.',
      description: 'Revisão dos créditos de energia compensados com as concessionárias de energia nos últimos 5 anos.',
      category: 'FEDERAL',
      actionProtocol: 'PER/DCOMP Web Direto'
    },
    {
      id: 'tese_tema_1182_cde_energia',
      code: 'Tema 1182 STJ',
      title: 'Exclusão de Subvenções da CDE da Base de Cálculo do IRPJ e CSLL',
      court: 'Superior Tribunal de Justiça',
      shareOfTotal: 0.05,
      docsMultiplier: 1200,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Precedente STJ (Tema 1182)',
      eligibleRegimes: ['lucro_real'],
      status: 'PROVA_CALCULADA',
      statusLabel: 'Prova Calculada',
      jurisprudence: 'Os recursos recebidos da Conta de Desenvolvimento Energético (CDE) para modicidade tarifária não configuram receita tributável pelo IRPJ.',
      description: 'Exclusão dos repasses setoriais da CDE na apuração do lucro real.',
      category: 'FEDERAL',
      actionProtocol: 'Retificação de ECF + PER/DCOMP'
    },
    {
      id: 'tese_inss_periculosidade_energia',
      code: 'Tema 985 STF',
      title: 'Não Incidência Previdenciária sobre Adicional de Periculosidade e Verbas',
      court: 'STF & STJ',
      shareOfTotal: 0.05,
      docsMultiplier: 60,
      riskLevel: 'BAIXO',
      riskScore: 'VERDE',
      riskScoreLabel: 'Jurisprudência Pacificada (STF/STJ)',
      eligibleRegimes: ['lucro_real', 'lucro_presumido'],
      status: 'LAUDO_PRONTO',
      statusLabel: 'Laudo Pronto',
      jurisprudence: 'Exclusão da cota patronal previdenciária sobre aviso prévio indenizado e terço de férias de eletricistas e operadores.',
      description: 'Auditoria de folhas de pagamento do setor elétrico em 60 competências.',
      category: 'PREVIDENCIARIO',
      actionProtocol: 'Retificação DCTFWeb + PER/DCOMP'
    }
  ]
};

// Aliases para cobrir variações de chaves de setor
SECTOR_THESES_CATALOG.real_estate = SECTOR_THESES_CATALOG.construction;

/**
 * Gera teses tributárias altamente customizadas de acordo com o setor informado,
 * faturamento anual e regime tributário.
 */
export function generateSectorSpecificTheses(
  sectorKey: string,
  annualRevenue: number,
  taxRegime: TaxRegime,
  ratio: number,
  docsCountRatio: number
): { teses: PreliminaryTaxTeseEstimate[]; totalEstimated: number; totalDocs: number } {
  // Simples Nacional possui segregação própria que varia conforme o setor
  if (taxRegime === 'simples_nacional') {
    const monofasicoRate = sectorKey === 'auto_parts' || sectorKey === 'retail' || sectorKey === 'healthcare' || sectorKey === 'logistics'
      ? 0.028 // Setores com alta incidência de produtos monofásicos
      : 0.016;

    const monofasicoCredit = Math.round(annualRevenue * monofasicoRate * 5);
    const icmsStCredit = Math.round(annualRevenue * 0.016 * 5);
    const docsMono = Math.round(38000 * docsCountRatio);
    const docsSt = Math.round(24000 * docsCountRatio);

    const totalEstimated = monofasicoCredit + icmsStCredit;
    const totalDocs = docsMono + docsSt;

    const sectorMonofasicoLabels: Record<string, { title: string; desc: string }> = {
      auto_parts: {
        title: 'Segregação de Autopeças Monofásicas (Lei 10.485/02) no Simples Nacional',
        desc: 'Auditoria de NFC-e e NF-e de autopeças e motopeças segregando a receita monofásica para abater PIS/COFINS no PGDAS-D.'
      },
      healthcare: {
        title: 'Segregação de Medicamentos & Fármacos Monofásicos no Simples Nacional',
        desc: 'Identificação de produtos farmacêuticos e cosméticos vendidos por farmácias e clínicas com abatimento de PIS/COFINS no PGDAS-D.'
      },
      retail: {
        title: 'Segregação de Bebidas Frias & Perfumaria Monofásica no Simples Nacional',
        desc: 'Varredura por código de barras (GTIN/EAN) e NCM de bebidas, higiene e perfumaria para exclusão de PIS/COFINS no PGDAS-D.'
      },
      logistics: {
        title: 'Segregação de Combustíveis & Lubrificantes Monofásicos no Simples Nacional',
        desc: 'Segregação de receitas derivadas de derivados de petróleo e combustíveis para restituição via Portal do Simples.'
      }
    };

    const specificLabel = sectorMonofasicoLabels[sectorKey] || {
      title: 'Segregação de Produtos Monofásicos PIS/COFINS no Simples Nacional',
      desc: 'Auditoria de cupom fiscal (NFC-e/CF-e) e NF-e dos últimos 60 meses segregando receitas monofásicas para restituição automática via Portal do Simples.'
    };

    const teses: PreliminaryTaxTeseEstimate[] = [
      {
        id: `tese_simples_monofasico_${sectorKey}`,
        code: 'LC 123/2006 Art. 18 §4º-A & Res. CGSN 140',
        title: specificLabel.title,
        court: 'Receita Federal do Brasil (Administrativo)',
        estimatedCredit: monofasicoCredit,
        documentsAnalyzed: docsMono,
        percentageOfTotal: Number(((monofasicoCredit / totalEstimated) * 100).toFixed(1)),
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Direito Expresso em Lei (Restituição em 60 dias no e-CAC)',
        eligibleRegimes: ['simples_nacional'],
        status: 'HABILITADO_RFB',
        statusLabel: 'Restituição Direta e-CAC',
        jurisprudence: 'Revenda de mercadorias com tributação concentrada (bebidas, autopeças, combustíveis, fármacos) desonera PIS/COFINS no cálculo do DAS.',
        description: specificLabel.desc,
        category: 'SIMPLES_SEGREGACAO',
        actionProtocol: 'Retificação PGDAS-D + Pedido de Restituição Eletrônica e-CAC'
      },
      {
        id: `tese_simples_icms_st_${sectorKey}`,
        code: 'LC 123/2006 Art. 18 §4º-A, I & Convênio ICMS 142',
        title: 'Segregação de ICMS-ST e Antecipação no PGDAS-D',
        court: 'SEFAZ / CGSN',
        estimatedCredit: icmsStCredit,
        documentsAnalyzed: docsSt,
        percentageOfTotal: Number(((icmsStCredit / totalEstimated) * 100).toFixed(1)),
        riskLevel: 'BAIXO',
        riskScore: 'VERDE',
        riskScoreLabel: 'Pacificado na Legislação Complementar',
        eligibleRegimes: ['simples_nacional'],
        status: 'PROVA_CALCULADA',
        statusLabel: 'Prova Calculada',
        jurisprudence: 'O contribuinte optante pelo Simples Nacional que revende mercadorias com ICMS retido por substituição tributária não recolhe a parcela de ICMS no DAS.',
        description: 'Varredura por CFOP (5.405/5.403) e CEST em todos os XMLs emitidos e recebidos nos últimos 5 anos.',
        category: 'SIMPLES_SEGREGACAO',
        actionProtocol: 'Retificação PGDAS-D + Compensação no DAS futuro'
      }
    ];

    return { teses, totalEstimated, totalDocs };
  }

  // Obter catálogo do setor ou fallback para manufacturing
  const templates = SECTOR_THESES_CATALOG[sectorKey] || SECTOR_THESES_CATALOG.manufacturing;

  // Base de crédito calibrada por faturamento anual e regime
  // Lucro Real tem base não-cumulativa cheia (~4.6% da receita anual ao longo de 5 anos)
  // Lucro Presumido tem base cumulativa (~3.4% da receita anual)
  const recoveryFactor = taxRegime === 'lucro_presumido' ? 0.034 : 0.046;
  const targetTotalCredit = Math.round(annualRevenue * recoveryFactor);

  const teses: PreliminaryTaxTeseEstimate[] = [];
  let calculatedTotal = 0;
  let totalDocs = 0;

  // Calcular créditos proporcionais por tese setorial
  templates.forEach((tpl) => {
    // Ajustar elegibilidade de regime
    if (taxRegime === 'lucro_presumido' && tpl.category === 'INSUMOS_PIS_COFINS' && tpl.eligibleRegimes.length === 1 && tpl.eligibleRegimes[0] === 'lucro_real') {
      // Insumos não se aplicam ao Presumido, converter proporcionalmente para tese de base de faturamento
      return;
    }

    const estimatedCredit = Math.round(targetTotalCredit * tpl.shareOfTotal);
    const documentsAnalyzed = Math.max(1, Math.round(tpl.docsMultiplier * docsCountRatio));

    calculatedTotal += estimatedCredit;
    totalDocs += documentsAnalyzed;

    teses.push({
      id: `${tpl.id}_${sectorKey}`,
      code: tpl.code,
      title: tpl.title,
      court: tpl.court,
      estimatedCredit,
      documentsAnalyzed,
      percentageOfTotal: 0, // Recalculado abaixo
      riskLevel: tpl.riskLevel,
      riskScore: tpl.riskScore,
      riskScoreLabel: tpl.riskScoreLabel,
      eligibleRegimes: tpl.eligibleRegimes,
      status: tpl.status,
      statusLabel: tpl.statusLabel,
      jurisprudence: tpl.jurisprudence,
      description: tpl.description,
      category: tpl.category,
      actionProtocol: tpl.actionProtocol
    });
  });

  // Recalcular percentuais sobre o total efetivo
  teses.forEach((t) => {
    t.percentageOfTotal = calculatedTotal > 0
      ? Number(((t.estimatedCredit / calculatedTotal) * 100).toFixed(1))
      : 0;
  });

  return { teses, totalEstimated: calculatedTotal, totalDocs };
}
