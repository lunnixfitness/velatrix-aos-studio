import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { SEGURANCA_CIBER } from '../segments';

export const CYBERSPY_THREAT_SERVICE: ServiceDefinition = {
  serviceId: 'cyberspy_threat',
  serviceName: 'AOS CyberSpy & ZeroVision Threat Intelligence',
  version: '2.0.0',
  segment: SEGURANCA_CIBER,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CISSP', 'CREA'],
  allowedActorRoles: ['ANALISTA_SEGURANCA_CISSP', 'SISTEMA', 'PERITO'],
  legalBasis: [
    {
      law: 'Lei Geral de Proteção de Dados (Lei nº 13.709/2018)',
      article: 'Art. 46 a 50',
      description: 'Padrões de segurança e medidas técnicas para garantir a segurança da informação e prevenção a incidentes.'
    },
    {
      law: 'Marco Civil da Internet (Lei nº 12.965/2014)',
      article: 'Art. 10 e 11',
      description: 'Preservação de registros e inviolabilidade da intimidade e das comunicações.'
    },
    {
      law: 'Norma ABNT NBR ISO/IEC 27001:2022',
      article: 'Controles de Segurança',
      description: 'Sistemas de Gestão da Segurança da Informação e Resposta a Incidentes Cibernéticos.'
    }
  ],
  contract: {
    serviceId: 'cyberspy_threat',
    serviceName: 'AOS CyberSpy & ZeroVision Threat Intelligence',
    category: SEGURANCA_CIBER.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'threat_log_payload',
        label: 'Log / Assinatura Real da Ameaça ou Anomalia',
        description: 'Payload capturado pelos sensores de borda, honeypots ou webhooks bancários.',
        type: 'field'
      },
      {
        key: 'source_channel',
        label: 'Canal de Origem Monitorado',
        description: 'Ponto de telemetria (Tor Crawl, BACEN SPI, ERP Audit, Edge Gateway).',
        type: 'field'
      },
      {
        key: 'tenant_cnpj',
        label: 'CNPJ do Tenant Alvo',
        description: 'Identificação da organização protegida.',
        type: 'cnpj'
      }
    ],
    optionalInputs: [
      {
        key: 'memory_dump',
        label: 'Dump de Memória ou Pacotes PCAP',
        description: 'Arquivo forense para perícia aprofundada de engenharia reversa.',
        type: 'file',
        formats: ['.pcap', '.bin', '.log']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_TELEMETRY',
        description: 'Vedada a emissão de laudo de segurança com base em ataques não registrados nos logs oficiais.',
        errorReasonIfNotMet: 'Nenhuma assinatura de telemetria real vinculada ao evento de contenção.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'DETECCAO_EVENTO',
    terminalStageIds: ['LAUDO_SEGURANCA_EMITIDO'],
    stages: [
      {
        id: 'DETECCAO_EVENTO',
        label: 'Detecção e Triagem da Ameaça',
        kind: 'INTAKE',
        actorRole: 'ANALISTA_SEGURANCA_CISSP',
        slaHours: 1,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'threat_log_payload', label: 'Payload da Ameaça', type: 'field', required: true }
        ]
      },
      {
        id: 'BLOQUEIO_ZEROVISION',
        label: 'Intercepção e Contenção Automática ZeroVision',
        kind: 'PROCESS',
        actorRole: 'SISTEMA',
        slaHours: 1,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'regra_bloqueio_ativa', label: 'Regra de Bloqueio WAF/SPI', type: 'field', required: true }
        ]
      },
      {
        id: 'ANALISE_FORENSE',
        label: 'Análise Forense e Enriquecimento Threat Intel',
        kind: 'VALIDATE',
        actorRole: 'PERITO',
        slaHours: 12,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'relatorio_ioc', label: 'Indicadores de Comprometimento (IoC)', type: 'field', required: true }
        ]
      },
      {
        id: 'VALIDACAO_QUORUM',
        label: 'Validação por Quórum Técnico Multi-Sig',
        kind: 'REVIEW',
        actorRole: 'ANALISTA_SEGURANCA_CISSP',
        slaHours: 6,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'assinatura_quorum', label: 'Atestado de Quórum Digital', type: 'field', required: true }
        ]
      },
      {
        id: 'LAUDO_SEGURANCA_EMITIDO',
        label: 'Emissão do Laudo Oficial de Incidente & Mitigação',
        kind: 'EMIT',
        actorRole: 'PERITO',
        slaHours: 6,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'laudo_oficial_seguranca', label: 'Laudo Pericial de Segurança ICP-Brasil', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'DETECCAO_EVENTO', to: 'BLOQUEIO_ZEROVISION' },
      { from: 'BLOQUEIO_ZEROVISION', to: 'ANALISE_FORENSE' },
      { from: 'ANALISE_FORENSE', to: 'VALIDACAO_QUORUM' },
      { from: 'VALIDACAO_QUORUM', to: 'LAUDO_SEGURANCA_EMITIDO' }
    ]
  },
  reportSchema: {
    reportType: 'security_threat',
    reportTypeLabel: 'Laudo Oficial de Incidente de Segurança Cibernética',
    idPrefix: 'LDO-SEC-2026',
    sections: [
      { id: 'identificacao_ameaca', title: '1. Identificação da Ameaça e Assinatura de Anomalia', renderer: 'EvidenciasSection', required: true },
      { id: 'acoes_contencao', title: '2. Ações de Contenção e Intercepção ZeroVision', renderer: 'ConclusaoTecnicaSection', required: true },
      { id: 'fundamentacao_lgpd', title: '3. Conformidade Legal e Mitigação de Danos (LGPD Art. 46)', renderer: 'BaseLegalSection', required: true },
      { id: 'conclusao_pericial', title: '4. Conclusão Forense e Recomendações de Hardening', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(CYBERSPY_THREAT_SERVICE);
