/**
 * VELATRIX AOS · P27 · Definição da Esteira de Serviço LOAS/BPC (Lei nº 8.742/1993)
 *
 * Padrão arquitetural unificado:
 * 5 Estágios padronizados: Captura → Diagnóstico → Estratégia → Execução → Entrega.
 * Requisitos obrigatórios por estágio, registro técnico profissional OAB.
 */

import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { PREVIDENCIARIO } from '../segments';

export const LOAS_BPC_SERVICE: ServiceDefinition = {
  serviceId: 'loas_bpc',
  serviceName: 'LOAS / BPC — Benefício de Prestação Continuada (Lei nº 8.742/93)',
  version: '1.0.0',
  segment: PREVIDENCIARIO,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['OAB'],
  allowedActorRoles: ['ADVOGADO_OAB', 'ANALISTA_PREVIDENCIARIO', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Lei Orgânica da Assistência Social — LOAS (Lei nº 8.742/1993)',
      article: 'Art. 20, 20-A e 20-B',
      description: 'Garantia de 1 salário mínimo mensal à pessoa com deficiência e ao idoso com 65 anos ou mais sem meios de prover a própria manutenção.'
    },
    {
      law: 'Decreto Federal nº 6.214/2007',
      article: 'Art. 4º, 8º e 12',
      description: 'Regulamenta o Benefício de Prestação Continuada, os critérios de aferição da renda familiar e a obrigatoriedade do CadÚnico.'
    },
    {
      law: 'STF — RE nº 567.985/MT (Tema 27 da Repercussão Geral)',
      article: 'Geral',
      description: 'Inconstitucionalidade parcial sem pronúncia de nulidade do critério objetivo de 1/4 do salário mínimo, admitindo flexibilização judicial.'
    },
    {
      law: 'STF — RE nº 580.963/PR c/c STJ Tema 644',
      article: 'Estatuto do Idoso Art. 34',
      description: 'Exclusão do benefício previdenciário ou assistencial de valor de até 1 salário mínimo percebido por idoso ou PcD do cálculo da renda familiar.'
    },
    {
      law: 'TNU — Tema 173',
      article: 'Deduções Essenciais',
      description: 'Dedução de despesas essenciais com medicamentos, fraldas, alimentação especial e tratamentos não fornecidos pelo SUS.'
    },
    {
      law: 'STF — RE nº 631.240/MG (Tema 350 da Repercussão Geral)',
      article: 'Interesse de Agir',
      description: 'Exigência de prévio requerimento administrativo perante o INSS com indeferimento ou mora injustificada da Autarquia.'
    }
  ],
  contract: {
    serviceId: 'loas_bpc',
    serviceName: 'LOAS / BPC — Benefício de Prestação Continuada (Lei nº 8.742/93)',
    category: PREVIDENCIARIO.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'cadunico',
        label: 'Extrato do CadÚnico Atualizado (V7)',
        description: 'Comprovante oficial de inscrição e atualização cadastral do CadÚnico nos últimos 24 meses.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'documentos_grupo_familiar',
        label: 'Documentos do Grupo Familiar e Renda',
        description: 'RG, CPF, certidões e comprovantes de rendimentos (ou declaração de ausência de renda) de quem vive sob o mesmo teto.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'indeferimento_inss',
        label: 'Comunicação de Decisão do INSS (Indeferimento)',
        description: 'Documento comprobatório do indeferimento administrativo prévio do pedido de BPC no INSS ou mora (>90 dias).',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'cpf_requerente',
        label: 'CPF do Requerente',
        description: 'Cadastro de Pessoa Física regular perante a Receita Federal.',
        type: 'field'
      },
      {
        key: 'data_nascimento_requerente',
        label: 'Data de Nascimento do Requerente',
        description: 'Data de nascimento oficial para verificação etária e enquadramento.',
        type: 'field'
      }
    ],
    optionalInputs: [
      {
        key: 'laudo_medico_pcd',
        label: 'Laudo Médico Pericial de Impedimento de Longo Prazo (PcD)',
        description: 'Laudo médico circunstanciado com CID-10/CID-11 comprovando impedimento de mínimo 2 anos para categoria DEFICIENCIA.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'comprovantes_despesas_saude',
        label: 'Receitas Médicas e Comprovantes de Despesas de Saúde Não-SUS',
        description: 'Prescrições médicas, notas fiscais e negativas do SUS para dedução legal de despesas essenciais de saúde.',
        type: 'file',
        formats: ['.pdf']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_CADUNICO',
        description: 'Inscrição ativa no CadÚnico é condição sine qua non para acesso ao benefício assistencial.',
        errorReasonIfNotMet: 'CadÚnico desatualizado ou inexistente: regularização prévia obrigatória perante o CRAS.'
      },
      {
        ruleId: 'RULE_PREVIO_REQUERIMENTO_INSS',
        description: 'Prévio requerimento administrativo indeferido é requisito de interesse de agir (Tema 350 STF).',
        errorReasonIfNotMet: 'Necessário protocolo prévio perante o INSS antes de ajuizamento ou expedição de laudo pericial contencioso.'
      },
      {
        ruleId: 'RULE_EXACT_CENTAVOS_NO_FLOAT',
        description: 'Todos os cômputos monetários devem ser estritamente auditados em centavos inteiros com arredondamento Half-Even.',
        errorReasonIfNotMet: 'Laudo rejeitado: divergência de arredondamento monetário detectada.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'CAPTURA',
    terminalStageIds: ['ENTREGA'],
    stages: [
      {
        id: 'CAPTURA',
        numero: '#1',
        label: 'Captura & Intake do Grupo Familiar',
        kind: 'INTAKE',
        actorRole: 'ANALISTA_PREVIDENCIARIO',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'cadunico', label: 'CadÚnico Atualizado', type: 'file', required: true, formats: ['.pdf'] },
          { key: 'documentos_grupo_familiar', label: 'Documentação do Grupo', type: 'file', required: true, formats: ['.pdf'] },
          { key: 'cpf_requerente', label: 'CPF do Requerente', type: 'field', required: true }
        ],
        description: 'Recepção, triagem documental e validação do rol legal de parentesco sob o mesmo teto.'
      },
      {
        id: 'DIAGNOSTICO',
        numero: '#2',
        label: 'Diagnóstico de Miserabilidade & Cômputo Per Capita',
        kind: 'PROCESS',
        actorRole: 'ANALISTA_PREVIDENCIARIO',
        slaHours: 24,
        dependeDe: 'CAPTURA',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'memoria_calculo_per_capita', label: 'Memória de Cálculo Half-Even', type: 'field', required: true }
        ],
        description: 'Cálculo analítico da renda bruta, exclusão de outros BPCs e benefícios de 1 SM, deduções médicas e divisão Half-Even.'
      },
      {
        id: 'ESTRATEGIA',
        numero: '#3',
        label: 'Estratégia Jurídica & Teses de Flexibilização',
        kind: 'VALIDATE',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        dependeDe: 'DIAGNOSTICO',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'teses_flexibilizacao', label: 'Matriz de Teses Jurisprudenciais', type: 'field', required: true }
        ],
        description: 'Aplicação das teses curadas (STF RE 567.985 / Tema 173 TNU) quando a renda superar 1/4 do SM.'
      },
      {
        id: 'EXECUCAO',
        numero: '#4',
        label: 'Execução & Parecer Técnico OAB',
        kind: 'REVIEW',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 48,
        dependeDe: 'ESTRATEGIA',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'parecer_oab_assinado', label: 'Parecer Jurídico Conclusivo', type: 'file', required: true, formats: ['.pdf'] }
        ],
        description: 'Revisão técnica por advogado habilitado com elaboração de parecer conclusivo e petição inicial.'
      },
      {
        id: 'ENTREGA',
        numero: '#5',
        label: 'Entrega da Petição/Dossiê Selado (SHA-256)',
        kind: 'EMIT',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        dependeDe: 'EXECUCAO',
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_loas_oficial', label: 'Petição inicial + dossiê de provas LOAS/BPC (selado)', type: 'file', required: true }
        ],
        description: 'Emissão oficial do Laudo Pericial de Elegibilidade LOAS com selo criptográfico de autenticidade.'
      }
    ],
    transitions: [
      { from: 'CAPTURA', to: 'DIAGNOSTICO' },
      { from: 'DIAGNOSTICO', to: 'ESTRATEGIA' },
      { from: 'ESTRATEGIA', to: 'EXECUCAO' },
      { from: 'EXECUCAO', to: 'ENTREGA' }
    ]
  },
  reportSchema: {
    reportType: 'loas_bpc',
    reportTypeLabel: 'Dossiê de Elegibilidade LOAS/BPC & Diagnóstico de Miserabilidade',
    idPrefix: 'LDO-BPC-2026',
    sections: [
      { id: 'qualificacao_requerente', title: '1. Qualificação do Requerente e Categoria (Idoso ou PcD)', renderer: 'EvidenciasSection', required: true },
      { id: 'composicao_grupo_familiar', title: '2. Rol da Família e Residência Sob o Mesmo Teto (Art. 20 §1º)', renderer: 'BaseLegalSection', required: true },
      { id: 'memoria_calculo_per_capita', title: '3. Memória de Cálculo da Renda Per Capita (Arredondamento Half-Even)', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'deducoes_saude', title: '4. Apuração das Deduções de Medicamentos e Saúde Não-SUS (Tema 173 TNU)', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'enquadramento_juridico', title: '5. Fundamentação Legal e Precedentes dos Tribunais (STF RE 567.985)', renderer: 'BaseLegalSection', required: true },
      { id: 'conclusao_tecnica_oab', title: '6. Parecer Técnico Conclusivo e Estratégia de Atuação', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(LOAS_BPC_SERVICE);
