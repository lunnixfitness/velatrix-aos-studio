import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { DIAGNOSTICO } from '../segments';

export const RISK_ROI_SERVICE: ServiceDefinition = {
  serviceId: 'risk_roi_diagnosis',
  serviceName: 'Diagnóstico & Proposta (Raio-X de Risco & ROI)',
  version: '2.0.0',
  segment: DIAGNOSTICO,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CRC'],
  allowedActorRoles: ['ANALISTA_FINANCEIRO', 'CONTADOR_CRC', 'AUDITOR_FISCAL', 'PERITO', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Normas Brasileiras de Contabilidade (NBC TG 26)',
      article: 'Demonstrações Contábeis',
      description: 'Apresentação das Demonstrações Contábeis e integridade dos saldos patrimoniais e de resultado.'
    },
    {
      law: 'Metodologia Edward Altman (1968/2000)',
      article: 'Z-Score Model for Emerging Markets',
      description: 'Modelo econométrico preditivo de solvência e risco de descontinuidade empresarial.'
    }
  ],
  contract: {
    serviceId: 'risk_roi_diagnosis',
    serviceName: 'Diagnóstico & Proposta (Raio-X de Risco & ROI)',
    category: DIAGNOSTICO.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'bank_statement',
        label: 'Extrato Bancário Real Conciliado (Mínimo 90 dias)',
        description: 'Arquivo bancário em formato .OFX ou extrato analítico em PDF oficial.',
        type: 'file',
        formats: ['.ofx', '.pdf']
      },
      {
        key: 'accounting_dre',
        label: 'DRE / Balancete Contábil Real Assinado',
        description: 'Demonstrativo de Resultado do Exercício recente extraído de ERP contábil.',
        type: 'file',
        formats: ['.xlsx', '.csv', '.pdf']
      },
      {
        key: 'tenant_cnpj',
        label: 'CNPJ do Tenant',
        description: 'Cadastro fiscal da entidade para validação cruzada.',
        type: 'cnpj'
      }
    ],
    optionalInputs: [
      {
        key: 'sped_fiscal',
        label: 'SPED Fiscal EFD ICMS/IPI',
        description: 'Arquivo SPED oficial para validação tributária complementar.',
        type: 'file',
        formats: ['.txt', '.zip']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_NO_ESTIMATES',
        description: 'Estimativas sem lastro em extrato bancário ou DRE são estritamente vedadas no laudo final.',
        errorReasonIfNotMet: 'Extrato bancário ou balancete real ausente. Impossível emitir Laudo de Risco com dados estimados.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'COLETA_DADOS',
    terminalStageIds: ['LAUDO_RISCO_EMITIDO'],
    stages: [
      {
        id: 'COLETA_DADOS',
        label: 'Coleta e Ingestão de Extratos e DRE',
        kind: 'INTAKE',
        actorRole: 'ANALISTA_FINANCEIRO',
        slaHours: 12,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'bank_statement', label: 'Extrato Bancário Real', type: 'file', required: true, formats: ['.ofx', '.pdf'] },
          { key: 'accounting_dre', label: 'DRE Contábil Real', type: 'file', required: true, formats: ['.xlsx', '.pdf'] }
        ]
      },
      {
        id: 'ANALISE_SOLVENCIA',
        label: 'Cálculo de Altman Z-Score & Working Capital',
        kind: 'PROCESS',
        actorRole: 'CONTADOR_CRC',
        slaHours: 24,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'z_score_matrix', label: 'Matriz Paramétrica Z-Score', type: 'field', required: true }
        ]
      },
      {
        id: 'VALIDACAO_SANGRIA',
        label: 'Identificação e Auditoria de Sangria de Caixa',
        kind: 'VALIDATE',
        actorRole: 'AUDITOR_FISCAL',
        slaHours: 12,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'relatorio_sangria', label: 'Relatório Analítico de Ineficiências', type: 'field', required: true }
        ]
      },
      {
        id: 'REVISAO_PERICIAL',
        label: 'Revisão Técnica e Assinatura Pericial',
        kind: 'REVIEW',
        actorRole: 'CONTADOR_CRC',
        slaHours: 12,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'minuta_laudo_risco', label: 'Minuta Atestada de Risco & ROI', type: 'file', required: true }
        ]
      },
      {
        id: 'LAUDO_RISCO_EMITIDO',
        label: 'Emissão do Laudo Oficial de Risco & ROI',
        kind: 'EMIT',
        actorRole: 'CONTADOR_CRC',
        slaHours: 6,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_oficial_risco_roi', label: 'Laudo de Risco Assinado ICP-Brasil', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'COLETA_DADOS', to: 'ANALISE_SOLVENCIA' },
      { from: 'ANALISE_SOLVENCIA', to: 'VALIDACAO_SANGRIA' },
      { from: 'VALIDACAO_SANGRIA', to: 'REVISAO_PERICIAL' },
      { from: 'REVISAO_PERICIAL', to: 'LAUDO_RISCO_EMITIDO' }
    ]
  },
  reportSchema: {
    reportType: 'risk_roi',
    reportTypeLabel: 'Laudo Pericial de Risco & ROI',
    idPrefix: 'LDO-RISK-2026',
    sections: [
      { id: 'indicadores_solvencia', title: '1. Diagnóstico de Solvência Altman Z-Score', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'sangria_caixa', title: '2. Mapeamento de Sangria de Caixa e Ineficiências', renderer: 'EvidenciasSection', required: true },
      { id: 'proposta_roi', title: '3. Proposta de Valor, Payback e ROI Multiplicador', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'conclusao_recomendacoes', title: '4. Recomendações Estratégicas e Assinatura Técnica', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(RISK_ROI_SERVICE);
