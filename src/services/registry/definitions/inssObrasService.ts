import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { OBRAS_ENGENHARIA } from '../segments';

export const INSS_OBRAS_SERVICE: ServiceDefinition = {
  serviceId: 'inss_obras',
  serviceName: 'INSS-Obras — Aferição Indireta da Construção Civil (11%)',
  version: '2.0.0',
  segment: OBRAS_ENGENHARIA,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CREA', 'CRC'],
  allowedActorRoles: ['ENGENHEIRO_CIVIL_CREA', 'CONTADOR_CRC', 'AUDITOR_FISCAL', 'ENGENHEIRO_CREA', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Lei nº 8.212/1991',
      article: 'Art. 31 e Art. 33, § 4º',
      description: 'Retenção previdenciária de 11% sobre o valor bruto da nota fiscal de prestação de serviços de construção civil e aferição indireta.'
    },
    {
      law: 'Instrução Normativa RFB nº 971/2009 e IN RFB nº 2.021/2021 (SERO)',
      article: 'Capítulo Obras de Construção Civil',
      description: 'Normas de tributação previdenciária, aferição indireta pelo CUB e expedição da CND de obra.'
    },
    {
      law: 'Decreto nº 3.048/1999 (RPS)',
      article: 'Art. 219 e seguintes',
      description: 'Regulamento da Previdência Social no tocante à responsabilidade solidária de proprietários e construtoras.'
    }
  ],
  contract: {
    serviceId: 'inss_obras',
    serviceName: 'INSS-Obras — Aferição Indireta da Construção Civil (11%)',
    category: OBRAS_ENGENHARIA.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'matricula_cei_cno',
        label: 'Matrícula CEI ou Número CNO da Obra',
        description: 'Cadastro Nacional de Obras vinculado à Receita Federal.',
        type: 'field'
      },
      {
        key: 'art_engenheiro',
        label: 'ART / RRT de Execução da Obra (CREA/CAU)',
        description: 'Anotação de Responsabilidade Técnica com a metragem quadrada e tipologia da construção.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'planilhas_medicao',
        label: 'Planilhas de Medição e Notas Fiscais de Empreitada',
        description: 'Notas fiscais de serviços com destaque de retenção e planilhas de evolução física.',
        type: 'file',
        formats: ['.xlsx', '.pdf']
      },
      {
        key: 'gfip_sefip',
        label: 'Guias GFIP / SEFIP / DCTFWeb com Código de Obra',
        description: 'Comprovações de recolhimento de folha de pagamento alocada à matrícula CEI/CNO.',
        type: 'file',
        formats: ['.xml', '.pdf']
      },
      {
        key: 'cnpj_construtora',
        label: 'CNPJ da Construtora ou Empreiteira Principal',
        description: 'Identificação fiscal do responsável tributário pela execução.',
        type: 'cnpj'
      },
      {
        key: 'memorial_descritivo',
        label: 'Memorial Descritivo e Alvará de Construção',
        description: 'Documento contendo destinação do imóvel, padrão de acabamento e habite-se.',
        type: 'file',
        formats: ['.pdf']
      }
    ],
    optionalInputs: [
      {
        key: 'notas_pre_moldados',
        label: 'Notas de Concreto Usinado e Pré-Moldados',
        description: 'Comprovantes para dedução de percentual de mão de obra na aferição indireta.',
        type: 'file',
        formats: ['.pdf', '.zip']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_CNO_AUTHENTICITY',
        description: 'O número de CNO deve ser validado na base cadastral da Receita Federal.',
        errorReasonIfNotMet: 'Cadastro CNO da obra não localizado ou em situação cancelada na Receita Federal.'
      },
      {
        ruleId: 'RULE_CREA_ENGINEER_MATCH',
        description: 'A ART apresentada deve estar devidamente quitada perante o conselho regional de engenharia.',
        errorReasonIfNotMet: 'ART não quitada ou divergente da área construída declarada no alvará.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'CADASTRO_CEI_CNO',
    terminalStageIds: ['PETICAO_RESTITUICAO'],
    stages: [
      {
        id: 'CADASTRO_CEI_CNO',
        label: 'Validação Cadastral CEI / CNO & Alvará',
        kind: 'INTAKE',
        actorRole: 'ENGENHEIRO_CIVIL_CREA',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'matricula_cei_cno', label: 'CNO / CEI Ativo', type: 'field', required: true },
          { key: 'art_engenheiro', label: 'ART de Execução', type: 'file', required: true, formats: ['.pdf'] }
        ]
      },
      {
        id: 'APURACAO_GFIP',
        label: 'Apuração das Folhas Alocadas (GFIP/DCTFWeb)',
        kind: 'PROCESS',
        actorRole: 'CONTADOR_CRC',
        slaHours: 48,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'relatorio_gfip_cno', label: 'Conciliação de Guias Recolhidas na Matrícula', type: 'field', required: true }
        ]
      },
      {
        id: 'ANALISE_MEDICOES_ART',
        label: 'Análise de Medições, CUB e Deduções Legais',
        kind: 'PROCESS',
        actorRole: 'ENGENHEIRO_CIVIL_CREA',
        slaHours: 48,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'laudo_metragem_cub', label: 'Planilha Paramétrica CUB por m²', type: 'file', required: true }
        ]
      },
      {
        id: 'AFERICAO_INDIRETA_CALCULO',
        label: 'Cálculo de Aferição Indireta (SERO/DISO)',
        kind: 'VALIDATE',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'memoria_afericao_indireta', label: 'Memória Analítica de Custo da Mão de Obra', type: 'field', required: true }
        ]
      },
      {
        id: 'CONFRONTO_RECOLHIDO_DEVIDO',
        label: 'Confronto entre Recolhido e Devido Efetivo',
        kind: 'REVIEW',
        actorRole: 'AUDITOR_FISCAL',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'balanco_debito_credito_obra', label: 'Balanço Diferencial de Tributo de Obra', type: 'field', required: true }
        ]
      },
      {
        id: 'PETICAO_RESTITUICAO',
        label: 'Emissão de Laudo e Petição de Restituição / CND',
        kind: 'EMIT',
        actorRole: 'ENGENHEIRO_CIVIL_CREA',
        slaHours: 24,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_oficial_obra', label: 'Laudo Pericial de Engenharia e Contabilidade de Obra', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'CADASTRO_CEI_CNO', to: 'APURACAO_GFIP' },
      { from: 'APURACAO_GFIP', to: 'ANALISE_MEDICOES_ART' },
      { from: 'ANALISE_MEDICOES_ART', to: 'AFERICAO_INDIRETA_CALCULO' },
      { from: 'AFERICAO_INDIRETA_CALCULO', to: 'CONFRONTO_RECOLHIDO_DEVIDO' },
      { from: 'CONFRONTO_RECOLHIDO_DEVIDO', to: 'PETICAO_RESTITUICAO' }
    ]
  },
  reportSchema: {
    reportType: 'inss_obras',
    reportTypeLabel: 'Laudo Técnico de Aferição Indireta e Regularização de Obra',
    idPrefix: 'LDO-OBR-2026',
    sections: [
      { id: 'identificacao_obra', title: '1. Identificação Cadastral da Obra, CNO e Responsáveis Técnicos', renderer: 'EvidenciasSection', required: true },
      { id: 'base_calculo_aferida', title: '2. Enquadramento e Base de Cálculo Aferida pelo CUB Regional', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'valor_indevido_apurado', title: '3. Apuração do Indébito Previdenciário e Retenções de 11%', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'memoria_calculo_11pct', title: '4. Memória Demonstrativa Mês a Mês das Deduções de Materiais', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'art_responsavel_tecnico', title: '5. Termo de Responsabilidade Técnica (ART/CREA e CRC)', renderer: 'BaseLegalSection', required: true },
      { id: 'pedido_restituicao', title: '6. Conclusão Pericial, Requerimento de Restituição e Expedição de CND', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 2 }
    ]
  }
};

registerService(INSS_OBRAS_SERVICE);
