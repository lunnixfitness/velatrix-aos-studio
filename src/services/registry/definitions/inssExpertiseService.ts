import { ServiceDefinition, ProfessionalClass } from '../../../types/serviceDefinition';
import { TipoBeneficio, BENEFICIO_CONSELHOS_MAP, BENEFICIO_LABELS } from '../../../types/standardizedPipeline';
import { registerService } from '../serviceRegistry';
import { PREVIDENCIARIO } from '../segments';

export function getInssServiceDefinitionForBeneficio(tipoBeneficio: TipoBeneficio = 'programado'): ServiceDefinition {
  const baseClasses: ProfessionalClass[] = (BENEFICIO_CONSELHOS_MAP[tipoBeneficio] || ['OAB', 'CRC']) as ProfessionalClass[];
  
  // Requisitos dinâmicos específicos conforme o tipo de benefício
  const dynamicRequiredInputs = [
    {
      key: 'cnis',
      label: 'Extrato Previdenciário CNIS Completo',
      description: 'Cadastro Nacional de Informações Sociais atualizado via Meu INSS (com remunerações e indicadores).',
      type: 'file' as const,
      formats: ['.pdf']
    },
    {
      key: 'ctc_vinculos',
      label: 'Certidão de Tempo de Contribuição (CTC) ou Carteiras',
      description: 'Documento comprobatório de averbação de serviço público ou privado.',
      type: 'file' as const,
      formats: ['.pdf']
    },
    {
      key: 'simulacao_meu_inss',
      label: 'Simulação Oficial Meu INSS',
      description: 'Demonstrativo e simulação oficial em PDF exportado do portal Meu INSS.',
      type: 'file' as const,
      formats: ['.pdf']
    },
    {
      key: 'cpf',
      label: 'CPF do Segurado / Requerente',
      description: 'Cadastro de Pessoa Física regularizado perante a Receita Federal.',
      type: 'field' as const
    },
    {
      key: 'data_nascimento',
      label: 'Data de Nascimento do Segurado',
      description: 'Data oficial para cálculo exato de idade e tempo decorrido nas datas de corte das reformas.',
      type: 'field' as const
    },
    {
      key: 'der',
      label: 'DER — Data de Entrada do Requerimento',
      description: 'Data oficial de protocolo administrativo perante a Autarquia Previdenciária.',
      type: 'field' as const
    }
  ];

  // Adições dinâmicas específicas por benefício
  if (tipoBeneficio === 'incapacidade') {
    dynamicRequiredInputs.push({
      key: 'atestado_laudo_medico_incapacidade',
      label: 'Laudo Médico / Atestado com CID e DII',
      description: 'Comprovação clínica pericial da Data de Início da Incapacidade (DII) e prognóstico laboral.',
      type: 'file' as const,
      formats: ['.pdf']
    });
  } else if (tipoBeneficio === 'isencao_ir_doenca') {
    dynamicRequiredInputs.push({
      key: 'laudo_pericial_molestia_grave',
      label: 'Laudo Pericial Oficial de Moléstia Grave (Lei 7.713/88)',
      description: 'Laudo médico oficial emitido por serviço médico oficial da União, Estados ou Municípios.',
      type: 'file' as const,
      formats: ['.pdf']
    });
  } else if (tipoBeneficio === 'pensao_morte') {
    dynamicRequiredInputs.push({
      key: 'certidao_obito_e_qualificacao_dependentes',
      label: 'Certidão de Óbito do Instituidor e Rol de Dependentes',
      description: 'Certidão de óbito e comprovação de dependência econômica (cônjuge/filhos/pais).',
      type: 'file' as const,
      formats: ['.pdf']
    });
  }

  // Base legal dinâmica
  const dynamicLegalBasis = [
    {
      law: 'Lei nº 8.213/1991',
      article: 'Art. 28 a 35 e Art. 57',
      description: 'Planos de Benefícios da Previdência Social, cálculo do salário de benefício e aposentadoria especial.'
    },
    {
      law: 'Emenda Constitucional nº 103/2019',
      article: 'Art. 15 a 26',
      description: 'Reforma da Previdência: novas idades mínimas, pedágio 50% e 100%, divisor mínimo e regras de transição.'
    },
    {
      law: 'Instrução Normativa INSS/PRES nº 128/2022',
      article: 'Geral',
      description: 'Normas procedimentais relativas ao reconhecimento de direitos dos segurados da Previdência Social.'
    }
  ];

  if (tipoBeneficio === 'isencao_ir_doenca') {
    dynamicLegalBasis.push({
      law: 'Lei nº 7.713/1988',
      article: 'Art. 6º, XIV e XXI',
      description: 'Isenção de Imposto de Renda sobre proventos de aposentadoria para portadores de moléstia grave.'
    });
  }

  return {
    ...INSS_EXPERTISE_SERVICE,
    serviceName: `Especialista INSS — ${BENEFICIO_LABELS[tipoBeneficio]}`,
    responsibleClass: baseClasses,
    legalBasis: dynamicLegalBasis,
    contract: {
      ...INSS_EXPERTISE_SERVICE.contract,
      serviceName: `Especialista INSS — ${BENEFICIO_LABELS[tipoBeneficio]}`,
      requiredInputs: dynamicRequiredInputs
    }
  };
}

export const INSS_EXPERTISE_SERVICE: ServiceDefinition = {
  serviceId: 'inss_expertise',
  serviceName: 'Especialista INSS — Auditoria & Cálculo Previdenciário',
  version: '2.0.0',
  segment: PREVIDENCIARIO,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['OAB', 'CRC'],
  allowedActorRoles: ['ANALISTA_PREVIDENCIARIO', 'ADVOGADO_OAB', 'CONTADOR_CRC', 'PERITO', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Lei nº 8.213/1991',
      article: 'Art. 28 a 35 e Art. 57',
      description: 'Planos de Benefícios da Previdência Social, cálculo do salário de benefício e aposentadoria especial.'
    },
    {
      law: 'Emenda Constitucional nº 103/2019',
      article: 'Art. 15 a 26',
      description: 'Reforma da Previdência: novas idades mínimas, pedágio 50% e 100%, pontos e regra de transição.'
    },
    {
      law: 'Instrução Normativa INSS/PRES nº 128/2022',
      article: 'Geral',
      description: 'Normas procedimentais relativas ao reconhecimento de direitos dos segurados da Previdência Social.'
    }
  ],
  contract: {
    serviceId: 'inss_expertise',
    serviceName: 'Especialista INSS — Auditoria & Cálculo Previdenciário',
    category: PREVIDENCIARIO.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'cnis',
        label: 'Extrato Previdenciário CNIS Completo',
        description: 'Cadastro Nacional de Informações Sociais atualizado via Meu INSS (com remunerações e indicadores).',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'ctc_vinculos',
        label: 'Certidão de Tempo de Contribuição (CTC) ou Carteiras',
        description: 'Documento comprobatório de averbação de serviço público ou privado.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'simulacao_meu_inss',
        label: 'Simulação Oficial Meu INSS',
        description: 'Demonstrativo e simulação oficial em PDF exportado do portal Meu INSS.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'cpf',
        label: 'CPF do Segurado / Requerente',
        description: 'Cadastro de Pessoa Física regularizado perante a Receita Federal.',
        type: 'field'
      },
      {
        key: 'data_nascimento',
        label: 'Data de Nascimento do Segurado',
        description: 'Data oficial para cálculo exato de idade e tempo decorrido nas datas de corte das reformas.',
        type: 'field'
      },
      {
        key: 'der',
        label: 'DER — Data de Entrada do Requerimento',
        description: 'Data oficial de protocolo administrativo perante a Autarquia Previdenciária.',
        type: 'field'
      }
    ],
    optionalInputs: [
      {
        key: 'ppp',
        label: 'Perfil Profissiográfico Previdenciário (PPP)',
        description: 'Laudo de insalubridade/periculosidade para conversão de tempo especial em comum.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'ltcat',
        label: 'Laudo Técnico das Condições Ambientais de Trabalho (LTCAT)',
        description: 'Documento expedido por médico do trabalho ou engenheiro de segurança.',
        type: 'file',
        formats: ['.pdf']
      },
      {
        key: 'ctps_digitalizada',
        label: 'CTPS Digitalizada (Termos de Abertura, Contratos e Anotações)',
        description: 'Comprovação de vínculos extemporâneos ou com pendência no CNIS.',
        type: 'file',
        formats: ['.pdf']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_CNIS_PDF',
        description: 'O arquivo do CNIS deve conter código de autenticidade emitido pelo portal Meu INSS.',
        errorReasonIfNotMet: 'Extrato CNIS informado sem código verificador de autenticidade do INSS.'
      },
      {
        ruleId: 'RULE_EXACT_DIVERGENCE_INDICATORS',
        description: 'Todos os indicadores de pendência (ex: PEXT, PREM-RET, IRECF) devem ser tratados individualmente.',
        errorReasonIfNotMet: 'Não são aceitas simulações de aposentadoria com descarte sumário de indicadores CNIS.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'RECEP_CNIS',
    terminalStageIds: ['LAUDO_PREVIDENCIARIO'],
    stages: [
      {
        id: 'RECEP_CNIS',
        numero: '#1',
        label: 'Recepção e Auditoria do CNIS',
        kind: 'INTAKE',
        actorRole: 'ANALISTA_PREVIDENCIARIO',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'cnis', label: 'Extrato CNIS Original', type: 'file', required: true, formats: ['.pdf'] },
          { key: 'cpf', label: 'CPF Segurado', type: 'field', required: true }
        ]
      },
      {
        id: 'VALIDACAO_TEMPO_CONTRIBUICAO',
        numero: '#2',
        label: 'Validação Analítica de Tempo de Contribuição',
        kind: 'PROCESS',
        actorRole: 'ANALISTA_PREVIDENCIARIO',
        slaHours: 48,
        dependeDe: 'RECEP_CNIS',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'mapa_vinculos_convalidados', label: 'Mapa Cronológico de Vínculos', type: 'field', required: true }
        ]
      },
      {
        id: 'APURACAO_ATIVIDADE_ESPECIAL',
        numero: '#3',
        label: 'Auditoria de Atividades Especiais (PPP/LTCAT)',
        kind: 'PROCESS',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 48,
        dependeDe: 'VALIDACAO_TEMPO_CONTRIBUICAO',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'parecer_tempo_especial', label: 'Tabela de Fator de Conversão', type: 'field', required: true }
        ]
      },
      {
        id: 'CALCULO_RMI',
        numero: '#4',
        label: 'Cálculo da Renda Mensal Inicial (RMI)',
        kind: 'VALIDATE',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        dependeDe: 'APURACAO_ATIVIDADE_ESPECIAL',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'memoria_salarios_contribuicao', label: 'Memória de Cálculo de Salários Atualizados', type: 'file', required: true }
        ]
      },
      {
        id: 'DIVISOR_MINIMO_BASE_100',
        numero: '#4.5',
        badge: 'EC 103/2019 §2º: Base 100% obrigatória',
        label: 'Aplicação do Divisor Mínimo & Base 100% CNIS (EC 103/2019)',
        kind: 'VALIDATE',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        dependeDe: 'CALCULO_RMI',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'apuracao_divisor_minimo', label: 'Demonstrativo Divisor Mínimo & Descarte de Contribuições', type: 'field', required: true }
        ]
      },
      {
        id: 'SIMULACAO_REGRAS_TRANSICAO',
        numero: '#5',
        label: 'Confronto de Regras de Transição (EC 103/2019)',
        kind: 'REVIEW',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        dependeDe: 'DIVISOR_MINIMO_BASE_100',
        isTerminal: false,
        requiredArtifacts: [
          { key: 'matriz_cenarios_aposentadoria', label: 'Matriz Comparativa de Benefícios', type: 'field', required: true }
        ]
      },
      {
        id: 'LAUDO_PREVIDENCIARIO',
        numero: '#6',
        label: 'Emissão do Laudo Previdenciário Oficial',
        kind: 'EMIT',
        actorRole: 'ADVOGADO_OAB',
        slaHours: 24,
        dependeDe: 'SIMULACAO_REGRAS_TRANSICAO',
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_previdenciario_oficial', label: 'Laudo Previdenciário Homologado', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'RECEP_CNIS', to: 'VALIDACAO_TEMPO_CONTRIBUICAO' },
      { from: 'VALIDACAO_TEMPO_CONTRIBUICAO', to: 'APURACAO_ATIVIDADE_ESPECIAL' },
      { from: 'APURACAO_ATIVIDADE_ESPECIAL', to: 'CALCULO_RMI' },
      { from: 'CALCULO_RMI', to: 'DIVISOR_MINIMO_BASE_100' },
      { from: 'DIVISOR_MINIMO_BASE_100', to: 'SIMULACAO_REGRAS_TRANSICAO' },
      { from: 'SIMULACAO_REGRAS_TRANSICAO', to: 'LAUDO_PREVIDENCIARIO' }
    ]
  },
  reportSchema: {
    reportType: 'inss_expertise',
    reportTypeLabel: 'Laudo Pericial Previdenciário & Planejamento RMI',
    idPrefix: 'LDO-INS-2026',
    sections: [
      { id: 'tempo_contribuicao_apurado', title: '1. Tempo de Contribuição e Carência Efetivamente Apurados', renderer: 'EvidenciasSection', required: true },
      { id: 'atividades_especiais', title: '2. Enquadramento de Atividades Especiais e Fatores de Conversão', renderer: 'BaseLegalSection', required: true },
      { id: 'calculo_rmi', title: '3. Memória de Cálculo da Renda Mensal Inicial (RMI)', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'comparativo_regras_transicao', title: '4. Comparativo Exaustivo das Regras de Transição (EC 103/2019)', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'melhor_beneficio', title: '5. Diagnóstico Jurídico do Melhor Benefício e Data de Requerimento (DER)', renderer: 'ConclusaoTecnicaSection', required: true },
      { id: 'base_legal_aplicada', title: '6. Fundamentação Legal e Precedentes dos Tribunais Superiores', renderer: 'BaseLegalSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(INSS_EXPERTISE_SERVICE);
