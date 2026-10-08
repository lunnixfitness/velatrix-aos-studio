import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { PRECATORIO } from '../segments';

export const PRECATORIO_SERVICE: ServiceDefinition = {
  serviceId: 'precatorio_management',
  serviceName: 'Gestão, Liquidação & Compensação de Precatórios e RPV',
  version: '2.0.0',
  segment: PRECATORIO,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['OAB', 'CRC'],
  allowedActorRoles: ['ADVOGADO_OAB', 'CONTADOR_CRC', 'SISTEMA', 'JUIZ_EXTERNO'],
  legalBasis: [
    {
      law: 'Constituição Federal de 1988',
      article: 'Art. 100 e parágrafos',
      description: 'Regime de pagamentos de débitos fazendários decorrentes de sentença judicial transitada em julgado.'
    },
    {
      law: 'Emenda Constitucional nº 113/2021 e EC nº 114/2021',
      article: 'Art. 100, § 11',
      description: 'Autoriza a utilização de precatórios para quitação de débitos tributários inscritos em dívida ativa da União, Estados e Municípios.'
    },
    {
      law: 'Lei nº 14.057/2020',
      article: 'Art. 2º e 3º',
      description: 'Disciplina a realização de acordos diretos com credores de precatórios federais com aplicação de deságio legal.'
    }
  ],
  contract: {
    serviceId: 'precatorio_management',
    serviceName: 'Gestão, Liquidação & Compensação de Precatórios e RPV',
    category: PRECATORIO.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'oficio_requisitorio',
        label: 'Ofício Requisitório / Numeração Única do Tribunal (TRF/TJ/TRT)',
        description: 'Ofício expedido pelo juízo da execução com a ordem cronológica e valor homologado.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'decisao_transitada_julgado',
        label: 'Certidão de Trânsito em Julgado da Execução',
        description: 'Certidão formal comprovando a inexistência de recursos pendentes.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'cpf_ou_cnpj_credor',
        label: 'CPF ou CNPJ do Credor Originário / Cessionário',
        description: 'Documento fiscal do titular do crédito requisitório.',
        type: 'field'
      },
      {
        key: 'calculo_liquidacao',
        label: 'Planilha Oficial de Liquidação e Atualização Monetária (IPCA-E / SELIC)',
        description: 'Demonstrativo de cálculo com índices oficiais de juros e correção monetária.',
        type: 'file',
        formats: ['.pdf', '.xlsx']
      }
    ],
    optionalInputs: [
      {
        key: 'contrato_cessao',
        label: 'Escritura Pública ou Contrato de Cessão de Crédito',
        description: 'Instrumento de cessão parcial ou total de direitos creditórios.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'procuracao',
        label: 'Procuração Ad Judicia et Extra com Poderes Específicos',
        description: 'Mandato para representação perante o tribunal e órgão fazendário.',
        type: 'file',
        formats: ['.pdf']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_NO_PENDING_EMBARGOS',
        description: 'O crédito precatório não pode possuir embargos à execução ou impugnação fazendária pendente.',
        errorReasonIfNotMet: 'Certidão de objeto e pé aponta impugnação ainda não julgada sobre o quantum debeatur.'
      },
      {
        ruleId: 'RULE_OFFICIAL_INDEXATION',
        description: 'A atualização monetária deve obedecer estritamente aos índices da EC 113/2021 (SELIC unificada).',
        errorReasonIfNotMet: 'Memória de cálculo utiliza índices expurgados ou em desacordo com o Tema 810 STF.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'RECEP_REQUISICAO',
    terminalStageIds: ['LIQUIDACAO_OU_COMPENSACAO_TRIBUTARIA'],
    stages: [
      {
        id: 'RECEP_REQUISICAO',
        label: 'Recepção do Ofício Requisitório & Certidão',
        kind: 'INTAKE',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'oficio_requisitorio', label: 'Ofício Requisitório', type: 'file', required: true, formats: ['.pdf'] },
          { key: 'decisao_transitada_julgado', label: 'Trânsito em Julgado', type: 'file', required: true, formats: ['.pdf'] }
        ]
      },
      {
        id: 'CADASTRO_TRIBUNAL',
        label: 'Validação na Fila Cronológica do Tribunal',
        kind: 'PROCESS',
        actorRole: 'SISTEMA',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'posicao_cronologica_tribunal', label: 'Certidão de Ordem Cronológica', type: 'field', required: true }
        ]
      },
      {
        id: 'CESSAO_CREDITO_OPCIONAL',
        label: 'Due Diligence & Registro de Cessão (Opcional)',
        kind: 'PROCESS',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 48,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'parecer_due_diligence', label: 'Relatório de Homologação de Cessão', type: 'field', required: true }
        ]
      },
      {
        id: 'CALCULO_DESAGIO',
        label: 'Cálculo Paramétrico de Atualização & Deságio',
        kind: 'VALIDATE',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'memoria_selic_desagio', label: 'Planilha Financeira com Taxa SELIC e Deságio', type: 'file', required: true }
        ]
      },
      {
        id: 'LIQUIDACAO_OU_COMPENSACAO_TRIBUTARIA',
        label: 'Liquidação Financeira ou Compensação em Dívida Ativa',
        kind: 'EMIT',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_liquidacao_precatorio', label: 'Laudo Pericial de Liquidação e Compensação', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'RECEP_REQUISICAO', to: 'CADASTRO_TRIBUNAL' },
      { from: 'CADASTRO_TRIBUNAL', to: 'CESSAO_CREDITO_OPCIONAL' },
      { from: 'CESSAO_CREDITO_OPCIONAL', to: 'CALCULO_DESAGIO' },
      { from: 'CALCULO_DESAGIO', to: 'LIQUIDACAO_OU_COMPENSACAO_TRIBUTARIA' }
    ]
  },
  reportSchema: {
    reportType: 'precatorio_management',
    reportTypeLabel: 'Laudo Técnico de Liquidação e Compensação de Precatório',
    idPrefix: 'LDO-PRE-2026',
    sections: [
      { id: 'identificacao_credito', title: '1. Identificação do Crédito, Tribunal de Origem e Ordem Cronológica', renderer: 'EvidenciasSection', required: true },
      { id: 'memoria_calculo_atualizacao', title: '2. Memória Analítica de Atualização pela SELIC (EC 113/2021)', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'base_legal_aplicada', title: '3. Enquadramento Constitucional e Precedentes Vinculantes', renderer: 'BaseLegalSection', required: true },
      { id: 'cenario_cessao', title: '4. Cenário de Cessão com Deságio de Mercado vs Pagamento Integral', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'cenario_liquidacao', title: '5. Compensação Administrativa com Dívida Ativa Fazendária (PGFN/PGE)', renderer: 'ConclusaoTecnicaSection', required: true },
      { id: 'recomendacao_estrategica', title: '6. Parecer Jurídico-Econômico Conclusivo e Roteiro de Execução', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(PRECATORIO_SERVICE);
