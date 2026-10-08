import { ServiceDefinition } from '../../../types/serviceDefinition';
import { registerService } from '../serviceRegistry';
import { CONECTIVIDADE_ERP } from '../segments';

export const ERP_CONNECTOR_SERVICE: ServiceDefinition = {
  serviceId: 'erp_connector',
  serviceName: 'Conector Seguro & Enclave mTLS ERP',
  version: '2.0.0',
  segment: CONECTIVIDADE_ERP,
  forbidEstimatedDataInFinalReport: true,
  responsibleClass: ['CISSP', 'CREA'],
  allowedActorRoles: ['ENGENHEIRO_INFRA_REDES', 'ANALISTA_TRIBUTARIO', 'AUDITOR_FISCAL', 'SISTEMA'],
  legalBasis: [
    {
      law: 'Padrão RFC 8446 (Transport Layer Security 1.3)',
      article: 'Mutual TLS Authentication',
      description: 'Autenticação mútua de cliente e servidor via certificados criptográficos X.509.'
    },
    {
      law: 'Norma ABNT NBR ISO/IEC 27002:2022',
      article: 'Controle 8.24',
      description: 'Uso de criptografia e gerenciamento seguro de chaves de infraestrutura.'
    }
  ],
  contract: {
    serviceId: 'erp_connector',
    serviceName: 'Conector Seguro & Enclave mTLS ERP',
    category: CONECTIVIDADE_ERP.id,
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'erp_endpoint_url',
        label: 'Endpoint Seguro da API do ERP',
        description: 'URL HTTPS interna ou gateway mTLS do SAP/Totvs/Protheus.',
        type: 'field'
      },
      {
        key: 'client_certificate_p12',
        label: 'Certificado de Cliente mTLS (.p12 / .pem)',
        description: 'Certificado criptográfico para handshake mútuo seguro.',
        type: 'file',
        formats: ['.p12', '.pem', '.crt']
      },
      {
        key: 'tenant_cnpj',
        label: 'CNPJ do Tenant',
        description: 'Inscrição fiscal correspondente ao ERP.',
        type: 'cnpj'
      }
    ],
    optionalInputs: [
      {
        key: 'custom_ca_bundle',
        label: 'Certificado Raiz da Autoridade Certificadora Privada',
        description: 'Bundle CA para redes corporativas fechadas.',
        type: 'file',
        formats: ['.pem', '.crt']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_MTLS_HANDSHAKE',
        description: 'O handshake mútuo deve ser concluído com sucesso e validação de revogação OCSP.',
        errorReasonIfNotMet: 'Falha no handshake mTLS: certificado rejeitado ou endpoint inacessível.'
      }
    ]
  },
  pipeline: {
    initialStageId: 'CONFIGURACAO_CONEXAO',
    terminalStageIds: ['CONEXAO_HOMOLOGADA'],
    stages: [
      {
        id: 'CONFIGURACAO_CONEXAO',
        label: 'Configuração de Endpoint e Certificados',
        kind: 'INTAKE',
        actorRole: 'ENGENHEIRO_INFRA_REDES',
        slaHours: 4,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'erp_endpoint_url', label: 'Endpoint ERP', type: 'field', required: true },
          { key: 'client_certificate_p12', label: 'Certificado mTLS', type: 'file', required: true, formats: ['.p12', '.pem'] }
        ]
      },
      {
        id: 'HANDSHAKE_TEST',
        label: 'Teste de Handshake Criptográfico & OCSP',
        kind: 'PROCESS',
        actorRole: 'ENGENHEIRO_INFRA_REDES',
        slaHours: 2,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'log_handshake', label: 'Log de Handshake TLS', type: 'field', required: true }
        ]
      },
      {
        id: 'VALIDACAO_SCHEMA',
        label: 'Validação de Schemas e Tabelas Contábeis',
        kind: 'VALIDATE',
        actorRole: 'ANALISTA_TRIBUTARIO',
        slaHours: 12,
        isTerminal: false,
        requiredArtifacts: [
          { key: 'schema_mapping', label: 'Mapeamento de Tabelas Contábeis/Fiscais', type: 'field', required: true }
        ]
      },
      {
        id: 'CONEXAO_HOMOLOGADA',
        label: 'Conexão Homologada com Selo de Integridade',
        kind: 'EMIT',
        actorRole: 'ENGENHEIRO_INFRA_REDES',
        slaHours: 4,
        isTerminal: true,
        requiredArtifacts: [
          { key: 'certificado_homologacao_erp', label: 'Atestado de Conectividade Segura', type: 'file', required: true }
        ]
      }
    ],
    transitions: [
      { from: 'CONFIGURACAO_CONEXAO', to: 'HANDSHAKE_TEST' },
      { from: 'HANDSHAKE_TEST', to: 'VALIDACAO_SCHEMA' },
      { from: 'VALIDACAO_SCHEMA', to: 'CONEXAO_HOMOLOGADA' }
    ]
  },
  reportSchema: {
    reportType: 'erp_connector_report',
    reportTypeLabel: 'Laudo de Auditoria e Conectividade mTLS ERP',
    idPrefix: 'LDO-ERP-2026',
    sections: [
      { id: 'topologia_conexao', title: '1. Topologia de Conexão e Parâmetros Criptográficos', renderer: 'EvidenciasSection', required: true },
      { id: 'auditoria_certificados', title: '2. Auditoria dos Certificados X.509 e Cadeia CA', renderer: 'BaseLegalSection', required: true },
      { id: 'schemas_validados', title: '3. Integridade dos Schemas de Dados Extraídos', renderer: 'MemoriaCalculoSection', required: true },
      { id: 'conclusao_homologacao', title: '4. Parecer Conclusivo de Conformidade e Segurança', renderer: 'ConclusaoTecnicaSection', required: true }
    ],
    signatureRequirements: [
      { type: 'ICP_A1', required: true, minSignatories: 1 }
    ]
  }
};

registerService(ERP_CONNECTOR_SERVICE);
