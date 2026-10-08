import { ServiceDefinition, PipelineDefinition } from '../../../types/serviceDefinition';
import { PericiaKind } from '../../../types/standardizedPipeline';
import { registerService } from '../serviceRegistry';
import { PERICIA } from '../segments';

export const JUDICIAL_EXPERTISE_SERVICE: ServiceDefinition = {
  serviceId: 'judicial_expertise',
  serviceName: 'Perícia Judicial & Extrajudicial Oficial',
  version: '2.0.0',
  segment: PERICIA,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CRC', 'CREA', 'CRM'],
  allowedActorRoles: ['PERITO', 'CONTADOR_CRC', 'JUIZ_EXTERNO', 'ADVOGADO_OAB', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Código de Processo Civil (Lei nº 13.105/2015)',
      article: 'Art. 464 a 480',
      description: 'Prova pericial, nomeação do perito, indicação de assistentes técnicos e resposta conclusiva aos quesitos.'
    },
    {
      law: 'Código de Processo Civil (Lei nº 13.105/2015)',
      article: 'Art. 156 a 158',
      description: 'Deveres, impedimentos e responsabilidades do Perito Judicial perante o juízo.'
    },
    {
      law: 'Normas Brasileiras de Contabilidade (NBC TP 01 / NBC PP 01)',
      article: 'Item Perícia Contábil',
      description: 'Procedimentos e estrutura obrigatória de laudos e pareceres periciais contábeis.'
    }
  ],
  contract: {
    serviceId: 'judicial_expertise',
    serviceName: 'Perícia Judicial & Extrajudicial Oficial',
    category: PERICIA.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'numero_cnj',
        label: 'Número Único do Processo (CNJ)',
        description: 'Numeração única padrão CNJ no formato NNNNNNN-DD.AAAA.J.TR.OOOO.',
        type: 'field'
      },
      {
        key: 'termo_nomeacao',
        label: 'Termo / Despacho de Nomeação Pericial',
        description: 'Decisão judicial que deferiu a perícia e nomeou o perito do juízo.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'quesitos_partes',
        label: 'Quesitos das Partes e do Juízo',
        description: 'Petições contendo os quesitos apresentados pelo autor, réu e Ministério Público/Juízo.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'documentos_periciais',
        label: 'Autos do Processo e Documentos Probatórios',
        description: 'Contratos, livros contábeis (Diário/Razão), notas fiscais ou prontuários objetos da lide.',
        type: 'file',
        formats: ['.pdf', '.zip']
      },
      {
        key: 'cnpj_ou_cpf_partes',
        label: 'CPF / CNPJ das Partes Contendentes',
        description: 'Qualificação civil e fiscal completa de autor e réu.',
        type: 'field'
      }
    ],
    optionalInputs: [
      {
        key: 'art_perito',
        label: 'ART / RRT / Termo de Responsabilidade Técnica',
        description: 'Anotação de responsabilidade técnica perante o conselho de classe respectivo.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'proposta_honorarios',
        label: 'Proposta / Estimativa de Honorários Homologada',
        description: 'Petição de honorários periciais com horas técnicas estimadas.',
        type: 'file',
        formats: ['.pdf']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_CNJ_VALID_FORMAT',
        description: 'O número do processo deve seguir rigorosamente a máscara e dígitos verificadores do CNJ.',
        errorReasonIfNotMet: 'Número de processo judicial inválido segundo a Resolução CNJ nº 65/2008.'
      },
      {
        ruleId: 'RULE_OFFICIAL_QUESITOS',
        description: 'O laudo pericial final exige resposta expressa e fundamentada a todos os quesitos juntados aos autos.',
        errorReasonIfNotMet: 'Não é permitida a omissão ou resposta meramente evasiva a qualquer quesito homologado.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'NOMEACAO',
    terminalStageIds: ['LAUDO_PERICIAL_FINAL'],
    stages: [
      {
        id: 'NOMEACAO',
        label: 'Nomeação & Aceite do Encargo',
        kind: 'INTAKE',
        actorRole: 'PERITO',
        slaHours: 48,
        slaHoras: 48,
        isTerminal: false,
        description: 'Despacho de nomeação pelo juízo com fixação de prazo de aceite.',
        requiredArtifacts: [
          { key: 'termo_nomeacao', label: 'Despacho de Nomeação', type: 'file', required: true, formats: ['.pdf'] },
          { key: 'numero_cnj', label: 'Número CNJ', type: 'field', required: true }
        ]
      },
      {
        id: 'PROPOSTA_HONORARIOS',
        label: 'Proposta de Honorários & Cronograma',
        kind: 'PROCESS',
        actorRole: 'PERITO',
        slaHours: 72,
        slaHoras: 72,
        dependeDe: 'NOMEACAO',
        isTerminal: false,
        description: 'Apresentação da proposta de honorários e plano de trabalho pericial.',
        requiredArtifacts: [
          { key: 'peticao_honorarios', label: 'Petição de Honorários', type: 'file', required: true, formats: ['.pdf'] }
        ]
      },
      {
        id: 'IMPUGNACAO_HONORARIOS',
        label: 'Impugnação de Honorários',
        kind: 'EXTERNAL_WAIT',
        actorRole: 'PERITO',
        slaHours: 120,
        slaHoras: 120,
        dependeDe: 'PROPOSTA_HONORARIOS',
        isTerminal: false,
        description: 'Prazo comum de 5 dias úteis (120h) para manifestação das partes (CPC Art. 465 §3º). Bloqueia #3 se status="em_impugnacao".',
        requiredArtifacts: [
          { key: 'manifestacao_honorarios', label: 'Certidão de Decurso / Manifestação Partes', type: 'file', required: false }
        ]
      },
      {
        id: 'DEPOSITO_PREVIO_HONORARIOS',
        label: 'Depósito Prévio de Honorários',
        kind: 'PROCESS',
        actorRole: 'JUIZ_EXTERNO',
        slaHours: 240,
        slaHoras: 240,
        dependeDe: 'IMPUGNACAO_HONORARIOS',
        isTerminal: false,
        description: 'Comprovação nos autos do depósito judicial dos honorários (CPC Art. 465 §4º). Marco temporal: reinicia relógio dos estágios #3-#7.',
        requiredArtifacts: [
          { key: 'comprovante_deposito_judicial', label: 'Guia de Depósito Judicial Vinculada', type: 'file', required: true }
        ]
      },
      {
        id: 'VISTORIA_DILIGENCIA',
        label: 'Vistoria, Diligência & Notificação das Partes',
        kind: 'PROCESS',
        actorRole: 'PERITO',
        slaHours: 120,
        slaHoras: 120,
        dependeDe: 'DEPOSITO_PREVIO_HONORARIOS',
        isTerminal: false,
        description: 'Comunicação prévia aos assistentes técnicos e realização de diligências periciais.',
        requiredArtifacts: [
          { key: 'termo_diligencia', label: 'Ata de Diligência / Notificação dos Assistentes', type: 'file', required: true }
        ]
      },
      {
        id: 'COLETA_QUESITOS',
        label: 'Confronto & Análise dos Quesitos',
        kind: 'VALIDATE',
        actorRole: 'PERITO',
        slaHours: 96,
        slaHoras: 96,
        dependeDe: 'VISTORIA_DILIGENCIA',
        isTerminal: false,
        description: 'Mapeamento analítico e individualizado de cada quesito judicial formulado.',
        requiredArtifacts: [
          { key: 'matriz_quesitos', label: 'Matriz de Confronto Técnico', type: 'field', required: true }
        ]
      },
      {
        id: 'LAUDO_PRELIMINAR',
        label: 'Emissão da Minuta do Laudo Preliminar',
        kind: 'REVIEW',
        actorRole: 'CONTADOR_CRC',
        slaHours: 48,
        slaHoras: 48,
        dependeDe: 'COLETA_QUESITOS',
        isTerminal: false,
        description: 'Minuta técnica para conferência de consistência contábil e documental.',
        requiredArtifacts: [
          { key: 'minuta_laudo', label: 'Minuta Estruturada do Laudo', type: 'file', required: true }
        ]
      },
      {
        id: 'IMPUGNACAO_MANIFESTACAO',
        label: 'Manifestação sobre Pareceres dos Assistentes',
        kind: 'EXTERNAL_WAIT',
        actorRole: 'PERITO',
        slaHours: 72,
        slaHoras: 72,
        dependeDe: 'LAUDO_PRELIMINAR',
        isTerminal: false,
        description: 'Apreciação das manifestações e divergências dos assistentes técnicos.',
        requiredArtifacts: [
          { key: 'resposta_assistentes', label: 'Esclarecimentos Técnicos', type: 'file', required: false }
        ]
      },
      {
        id: 'LAUDO_PERICIAL_FINAL',
        label: 'Protocolo do Laudo Pericial Final Homologado',
        kind: 'EMIT',
        actorRole: 'PERITO',
        slaHours: 24,
        slaHoras: 24,
        dependeDe: 'IMPUGNACAO_MANIFESTACAO',
        isTerminal: true,
        description: 'Protocolo oficial do laudo pericial final homologado com assinatura ICP-Brasil.',
        requiredArtifacts: [
          { key: 'laudo_final_assinado_icp', label: 'Laudo Pericial Conclusivo Assinado ICP-Brasil', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'NOMEACAO', to: 'PROPOSTA_HONORARIOS' },
      { from: 'PROPOSTA_HONORARIOS', to: 'IMPUGNACAO_HONORARIOS' },
      { from: 'IMPUGNACAO_HONORARIOS', to: 'DEPOSITO_PREVIO_HONORARIOS' },
      { from: 'DEPOSITO_PREVIO_HONORARIOS', to: 'VISTORIA_DILIGENCIA' },
      { from: 'VISTORIA_DILIGENCIA', to: 'COLETA_QUESITOS' },
      { from: 'COLETA_QUESITOS', to: 'LAUDO_PRELIMINAR' },
      { from: 'LAUDO_PRELIMINAR', to: 'IMPUGNACAO_MANIFESTACAO' },
      { from: 'IMPUGNACAO_MANIFESTACAO', to: 'LAUDO_PERICIAL_FINAL' }
    ]
  },
  reportSchema: {
    reportType: 'judicial_expertise',
    reportTypeLabel: 'Laudo Pericial Judicial Conclusivo',
    idPrefix: 'LDO-PER-2026',
    sections: [
      { id: 'objeto_pericia', title: '1. Objeto da Perícia & Histórico da Lide', renderer: 'EvidenciasSection', required: true },
      { id: 'metodologia', title: '2. Metodologia Científica e Normas Técnicas Empregadas', renderer: 'BaseLegalSection', required: true },
      { id: 'quesitos_respondidos', title: '3. Resposta Circunstanciada aos Quesitos Judiciais', renderer: 'ConclusaoTecnicaSection', required: true },
      { id: 'evidencias_examinadas', title: '4. Evidências Documentais e Inspeções Realizadas', renderer: 'EvidenciasSection', required: true },
      { id: 'conclusao_pericial', title: '5. Conclusão Pericial & Parecer Técnico do Perito do Juízo', renderer: 'ConclusaoTecnicaSection', required: true },
      { id: 'anexos_tecnicos', title: '6. Anexos Probatórios e Memória Contábil/Gráfica', renderer: 'MemoriaCalculoSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(JUDICIAL_EXPERTISE_SERVICE);

export function getPericiaPipelineDefinition(kind: PericiaKind = 'judicial'): PipelineDefinition {
  if (kind === 'judicial') {
    return JUDICIAL_EXPERTISE_SERVICE.pipeline;
  }

  // Para 'arbitral' ou 'contratual': exclui estágios CPC 465 (#2.5 e #2.75) e altera o estágio terminal (#7)
  const nonJudicialStages = JUDICIAL_EXPERTISE_SERVICE.pipeline.stages
    .filter(s => s.id !== 'IMPUGNACAO_HONORARIOS' && s.id !== 'DEPOSITO_PREVIO_HONORARIOS')
    .map(s => {
      if (s.id === 'VISTORIA_DILIGENCIA') {
        return { ...s, dependeDe: 'PROPOSTA_HONORARIOS' };
      }
      if (s.id === 'LAUDO_PERICIAL_FINAL') {
        return {
          ...s,
          id: 'ENTREGA_FORMAL_LAUDO',
          label: 'Entrega Formal ao Contratante/Câmara',
          description: 'Transmissão formal do parecer pericial conclusivo com protocolo de entrega e assinatura ICP-Brasil.'
        };
      }
      return s;
    });

  return {
    initialStageId: 'NOMEACAO',
    terminalStageIds: ['ENTREGA_FORMAL_LAUDO'],
    stages: nonJudicialStages,
    transitions: [
      { from: 'NOMEACAO', to: 'PROPOSTA_HONORARIOS' },
      { from: 'PROPOSTA_HONORARIOS', to: 'VISTORIA_DILIGENCIA' },
      { from: 'VISTORIA_DILIGENCIA', to: 'COLETA_QUESITOS' },
      { from: 'COLETA_QUESITOS', to: 'LAUDO_PRELIMINAR' },
      { from: 'LAUDO_PRELIMINAR', to: 'IMPUGNACAO_MANIFESTACAO' },
      { from: 'IMPUGNACAO_MANIFESTACAO', to: 'ENTREGA_FORMAL_LAUDO' }
    ]
  };
}
