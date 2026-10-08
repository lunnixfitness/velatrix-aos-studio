import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { TRIBUTARIO } from '../segments';
import { 
  TaxRecoverySectionsPayload,
  CreditoTributarioApurado,
  EvidenciaCruzamento,
  BaseLegalRef,
  MemoriaCalculoCompetencia,
  ParecerTecnico,
  ProximosPassos,
  TributoFiscal,
  OrigemEvidencia
} from '../../../types/reportDtos';

export const TAX_RECOVERY_SERVICE: ServiceDefinition = {
  serviceId: 'tax_recovery',
  serviceName: 'Recuperação Tributária Federal & Estadual',
  version: '2.0.0',
  segment: TRIBUTARIO,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CRC', 'OAB'],
  allowedActorRoles: ['ANALISTA_TRIBUTARIO', 'AUDITOR_FISCAL', 'CONTADOR_CRC', 'ADVOGADO_OAB', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Código Tributário Nacional (Lei 5.172/1966)',
      article: 'Art. 165 a 169',
      description: 'Direito à restituição e repetição de indébito tributário recolhido a maior ou indevidamente.'
    },
    {
      law: 'Instrução Normativa RFB nº 2.055/2021',
      article: 'Geral',
      description: 'Disciplina a restituição, compensação, ressarcimento e reembolso no âmbito da Receita Federal.'
    },
    {
      law: 'Lei nº 9.430/1996',
      article: 'Art. 74',
      description: 'Regulamentação da compensação de tributos federais administrados pela RFB via PER/DCOMP.'
    },
    {
      law: 'Lei Complementar nº 118/2005',
      article: 'Art. 3º',
      description: 'Prazo prescricional quinquenal (5 anos) para repetição de indébito tributário.'
    }
  ],
  contract: {
    serviceId: 'tax_recovery',
    serviceName: 'Recuperação Tributária Federal & Estadual',
    category: TRIBUTARIO.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'sped_efd_contribuicoes',
        label: 'SPED EFD Contribuições ou Fiscal',
        description: 'Arquivos SPED EFD-ICMS/IPI e EFD-Contribuições dos últimos 60 meses.',
        type: 'file',
        formats: ['.txt', '.zip', '.rfb']
      },
      {
        key: 'pgdas_d',
        label: 'Extratos PGDAS-D ou DCTF/ECF',
        description: 'Declarações mensais transmitidas à RFB comprobatórias da apuração.',
        type: 'file',
        formats: ['.pdf', '.xlsx', '.xml']
      },
      {
        key: 'dctfweb',
        label: 'Recibos DCTFWeb',
        description: 'Guias de recolhimento previdenciário e fazendário transmitidas.',
        type: 'file',
        formats: ['.pdf', '.xml']
      },
      {
        key: 'cnpj',
        label: 'CNPJ Matriz e Filiais',
        description: 'Inscrição cadastral regular perante a Receita Federal.',
        type: 'cnpj'
      },
      {
        key: 'procuracao_ecac',
        label: 'Procuração Eletrônica e-CAC / Certificado A1',
        description: 'Procuração eletrônica específica para consulta de situação fiscal e PER/DCOMP.',
        type: 'file',
        formats: ['.p12', '.pdf']
      }
    ],
    optionalInputs: [
      {
        key: 'xml_nfe_entrada_saida',
        label: 'Lote de XMLs de NF-e (Entradas e Saídas)',
        description: 'Notas fiscais eletrônicas para checagem item-a-item de PIS/COFINS monofásico e ICMS-ST.',
        type: 'file',
        formats: ['.zip', '.xml']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_SPED_CHECKSUM',
        description: 'Obrigatório validação de hash e bloco 0000 do SPED com data de transmissão válida.',
        errorReasonIfNotMet: 'O arquivo SPED informado não possui assinatura de transmissão válida pela RFB.'
      },
      {
        ruleId: 'RULE_NO_ESTIMATES',
        description: 'Vedada qualquer estimativa amostral sem confronto analítico item-a-item.',
        errorReasonIfNotMet: 'Laudo rejeitado: memória de cálculo contém projeção estimada em desacordo com a IN RFB 2.055.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'RECEP_DOCUMENTOS',
    terminalStageIds: ['COMPENSACAO_RESTITUICAO'],
    stages: [
      {
        id: 'RECEP_DOCUMENTOS',
        label: 'Recepção de Documentos Fiscais',
        kind: 'INTAKE',
        actorRole: 'ANALISTA_TRIBUTARIO',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'sped_efd_contribuicoes', label: 'SPED EFD', type: 'file', required: true, formats: ['.txt', '.zip'] },
          { key: 'pgdas_d', label: 'PGDAS-D / DCTF', type: 'file', required: true, formats: ['.pdf', '.xlsx'] }
        ]
      },
      {
        id: 'APURACAO_INDEBITO',
        label: 'Apuração Analítica de Indébito',
        kind: 'PROCESS',
        actorRole: 'ANALISTA_TRIBUTARIO',
        slaHours: 48,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'memoria_analitica_itens', label: 'Planilha Analítica de Itens', type: 'file', required: true }
        ]
      },
      {
        id: 'CRUZAMENTO_SPED_PGDAS',
        label: 'Cruzamento Cruzado SPED x PGDAS',
        kind: 'VALIDATE',
        actorRole: 'AUDITOR_FISCAL',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'relatorio_cruzamento', label: 'Matriz de Divergências Fiscais', type: 'field', required: true }
        ]
      },
      {
        id: 'PARECER_TECNICO_CRC',
        label: 'Parecer Técnico Conclusivo (CRC/OAB)',
        kind: 'REVIEW',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'parecer_assinado', label: 'Parecer Pericial Assinado', type: 'file', required: true, formats: ['.pdf'] }
        ]
      },
      {
        id: 'PETICAO_ECAC',
        label: 'Protocolo de PER/DCOMP e-CAC',
        kind: 'EXTERNAL_WAIT',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 72,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'recibo_transmissao_perdcomp', label: 'Recibo PER/DCOMP RFB', type: 'file', required: true, formats: ['.pdf'] }
        ]
      },
      {
        id: 'HOMOLOGACAO_RFB',
        label: 'Acompanhamento & Homologação RFB',
        kind: 'EXTERNAL_WAIT',
        actorRole: 'SISTEMA',
        slaHours: 120,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'despacho_homologatorio', label: 'Despacho Decisório RFB', type: 'external_process', required: false }
        ]
      },
      {
        id: 'COMPENSACAO_RESTITUICAO',
        label: 'Compensação ou Restituição Concluída',
        kind: 'EMIT',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_oficial_recuperacao', label: 'Laudo Pericial Oficial de Indébito', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'RECEP_DOCUMENTOS', to: 'APURACAO_INDEBITO' },
      { from: 'APURACAO_INDEBITO', to: 'CRUZAMENTO_SPED_PGDAS' },
      { from: 'CRUZAMENTO_SPED_PGDAS', to: 'PARECER_TECNICO_CRC' },
      { from: 'PARECER_TECNICO_CRC', to: 'PETICAO_ECAC' },
      { from: 'PETICAO_ECAC', to: 'HOMOLOGACAO_RFB' },
      { from: 'HOMOLOGACAO_RFB', to: 'COMPENSACAO_RESTITUICAO' }
    ]
  },
  reportSchema: {
    reportType: 'fiscal_recovery',
    reportTypeLabel: 'Laudo Pericial de Recuperação Tributária',
    idPrefix: 'LDO-REC-2026',
    sections: [
      { id: 'credito_apurado', title: '1. Crédito Tributário Efetivamente Apurado', renderer: 'CreditoApuradoSection', required: true },
      { id: 'cruzamento_evidencias', title: '2. Evidências de Cruzamento (SPED vs PGDAS)', renderer: 'EvidenciasCruzamentoSection', required: true },
      { id: 'base_legal_aplicada', title: '3. Fundamentação Legal e Teses Jurídicas Vinculantes', renderer: 'BaseLegalSection', required: true },
      { id: 'memoria_calculo', title: '4. Memória de Cálculo Mês a Mês', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'parecer_tecnico', title: '5. Parecer Técnico Conclusivo & Responsabilidade Técnica', renderer: 'ParecerTecnicoSection', required: true },
      { id: 'proximos_passos', title: '6. Próximos Passos', renderer: 'ProximosPassosSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

/**
 * Gerador canônico de payload desestruturado para Recuperação Tributária.
 * Garante que cada uma das 6 seções atenda rigorosamente ao respectivo DTO Zod,
 * sem campos nulos, sem placeholders e sem serialização '[object Object]'.
 */
export function generateTaxRecoveryPayload(options?: {
  monthsCount?: number;
  tenantCnpj?: string;
  tenantName?: string;
  /** Conteúdo do responsável técnico (P28). Sem ele o parecer sai PENDENTE. */
  parecer?: {
    conclusao: string;
    responsavelTecnico: string;
    registroProfissional: string;
    orgaoClasse: string;
    parecerFavoravel: boolean;
    fundamentoResumido?: string;
    observacoes?: string[];
  };
}): TaxRecoverySectionsPayload {
  const count = options?.monthsCount ?? 60;
  const clampedCount = Math.max(1, Math.min(60, count));

  // Geração das competências do período quinquenal (ex: até 2026-08)
  const competences: string[] = [];
  const baseYear = 2026;
  const baseMonth = 8;

  for (let i = clampedCount - 1; i >= 0; i--) {
    let m = baseMonth - i;
    let y = baseYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }
    competences.push(`${y}-${String(m).padStart(2, '0')}`);
  }

  // 1. Crédito Tributário Efetivamente Apurado
  const credito_apurado: CreditoTributarioApurado[] = competences.map((comp, idx) => {
    const baseP = 14200 + ((idx * 431) % 6500);
    const selic = +(27.8 - (idx * 0.41)).toFixed(2);
    const atualizado = +(baseP * (1 + selic / 100)).toFixed(2);
    const tributos: TributoFiscal[] = ['PIS', 'COFINS', 'ICMS'];
    const trib = tributos[idx % tributos.length];
    return {
      competencia: comp,
      tributo: trib,
      valorPrincipal: baseP,
      selicAcumulada: selic,
      valorAtualizado: atualizado,
      fonteSped: `SPED EFD-Contribuições Bloco C170 Linha ${1420 + idx * 12}`
    };
  });

  // 2. Evidências de Cruzamento (SPED vs PGDAS vs DCTFWeb)
  // Conforme exigência técnica: EvidenciaCruzamento NÃO É base legal!
  const divergencias = [
    'Exclusão de ICMS destacado na saída da base de cálculo PIS/COFINS (Tema 69 STF)',
    'Insumos essenciais de transporte e colheita glosados na apuração monofásica',
    'Crédito presumido de subvenção de investimento (Lei 12.973/14)',
    'Alíquota majorada recolhida indevidamente em duplicidade na DCTFWeb',
    'Divergência entre receita escriturada na EFD e débito apurado no PGDAS-D'
  ];
  const origens: OrigemEvidencia[] = ['SPED_EFD', 'PGDAS-D', 'DCTFWEB'];

  const cruzamento_evidencias: EvidenciaCruzamento[] = competences.slice(-12).map((comp, idx) => {
    const valSped = 52400 + (idx * 1350);
    const valDecl = 58200 + (idx * 1480);
    return {
      origem: origens[idx % origens.length],
      divergenciaTipo: divergencias[idx % divergencias.length],
      valorSped: valSped,
      valorDeclarado: valDecl,
      delta: +(valDecl - valSped).toFixed(2),
      competencia: comp
    };
  });

  // 3. Fundamentação Legal e Teses Jurídicas Vinculantes
  const base_legal_aplicada: BaseLegalRef[] = TAX_RECOVERY_SERVICE.legalBasis.map(lb => ({
    law: lb.law,
    article: lb.article,
    description: lb.description
  }));

  // 4. Memória de Cálculo Mês a Mês (exatamente N competências)
  const memoria_calculo: MemoriaCalculoCompetencia[] = competences.map((comp, idx) => {
    const baseCalc = 185000 + ((idx * 3120) % 55000);
    const aliq = 0.0925; // 9.25% PIS/COFINS não-cumulativo
    const recolhido = +(baseCalc * aliq).toFixed(2);
    const devido = +(baseCalc * (aliq - 0.024)).toFixed(2);
    const indebito = +(recolhido - devido).toFixed(2);
    return {
      competencia: comp,
      baseCalculo: baseCalc,
      aliquotaAplicada: aliq,
      valorDevido: devido,
      valorRecolhido: recolhido,
      indebito,
      evidenciaSpedLinha: 1100 + idx * 8
    };
  });

  // 5. Parecer Técnico — P28: redigido e assinado pelo responsável técnico, nunca pelo gerador.
  //    Sem options.parecer o bloco sai explicitamente PENDENTE e o guard de emissão barra o laudo.
  const parecer_tecnico: ParecerTecnico = options?.parecer
    ? {
        conclusao: options.parecer.conclusao,
        responsavelTecnico: options.parecer.responsavelTecnico,
        registroProfissional: options.parecer.registroProfissional,
        orgaoClasse: options.parecer.orgaoClasse,
        dataAssinatura: 'Pendente de assinatura ICP-Brasil',
        parecerFavoravel: options.parecer.parecerFavoravel,
        fundamentoResumido: options.parecer.fundamentoResumido,
        observacoes: options.parecer.observacoes,
      }
    : {
        conclusao: 'PENDENTE — conclusão a ser redigida pelo responsável técnico.',
        responsavelTecnico: 'PENDENTE de identificação',
        registroProfissional: 'PENDENTE',
        orgaoClasse: 'PENDENTE',
        dataAssinatura: 'Pendente de assinatura ICP-Brasil',
        parecerFavoravel: false,
        observacoes: ['Memória de cálculo produzida pelo gerador de demonstração: sem validade oficial.'],
      };

  // 6. Próximos Passos
  const proximos_passos: ProximosPassos = {
    etapas: [
      {
        ordem: 1,
        titulo: "Retificação das Declarações Acessórias (EFD-Contribuições)",
        descricao: "Transmitir as EFD-Contribuições retificadoras contemplando o expurgo do ICMS das bases de cálculo e apropriação dos créditos reconhecidos.",
        prazoEstimadoDias: 7,
        responsavel: "Equipe Fiscal / Contador Responsável",
        sistemaDestino: "SPED / ReceitaNet"
      },
      {
        ordem: 2,
        titulo: "Retificação da DCTFWeb e Ajuste de Saldos a Pagar",
        descricao: "Ajustar as confissões de débito na DCTFWeb para vincular as deduções apuradas aos períodos subsequentes.",
        prazoEstimadoDias: 5,
        responsavel: "Analista Tributário Sênior",
        sistemaDestino: "Portal e-CAC / DCTFWeb"
      },
      {
        ordem: 3,
        titulo: "Transmissão da PER/DCOMP Web com Assinatura A1",
        descricao: "Formalizar o pedido eletrônico de restituição e declaração de compensação no sistema PER/DCOMP Web perante a Receita Federal do Brasil.",
        prazoEstimadoDias: 3,
        responsavel: "Procurador Tributário / Advogado OAB",
        sistemaDestino: "PER/DCOMP Web"
      },
      {
        ordem: 4,
        titulo: "Acompanhamento da Homologação (Prazo Quinquenal)",
        descricao: "Monitorar despachos decisórios da RFB no Dossiê Digital de Atendimento até a homologação tácita ou expressa (Art. 74 § 5º Lei 9.430/1996).",
        prazoEstimadoDias: 1825,
        responsavel: "Velatrix AOS Autonomous Watchdog",
        sistemaDestino: "Caixa Postal e-CAC"
      }
    ],
    recomendacaoFinal: "Priorizar a formalização das primeiras 12 competências do período para mitigar o risco de decadência quinquenal nos termos da LC 118/2005."
  };

  return {
    credito_apurado,
    cruzamento_evidencias,
    base_legal_aplicada,
    memoria_calculo,
    parecer_tecnico,
    proximos_passos
  };
}

registerService(TAX_RECOVERY_SERVICE);
