import { ServiceInputContract } from '../types/standardizedPipeline';

/**
 * Catálogo Padronizado de Contratos de Entrada para Serviços do Velatrix AOS.
 * REGRA RIGOROSA: Nenhum serviço pode emitir laudo final com dados estimados
 * ou fictícios — apenas com dados reais enviados ou conectados via API/ERP.
 */
export const SERVICE_INPUT_CONTRACTS: Record<string, ServiceInputContract> = {
  risk_roi_diagnosis: {
    serviceId: 'risk_roi_diagnosis',
    serviceName: 'Diagnóstico & Proposta (Raio-X de Risco & ROI)',
    category: 'DIAGNOSTICO_RISCO',
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'bank_statement',
        label: 'Extrato Bancário Real (Mínimo 90 dias)',
        description: 'Arquivo OFX ou PDF bancário contendo conciliação líquida e saldo de tesouraria.',
        type: 'file',
        formats: ['.ofx', '.pdf', '.csv']
      },
      {
        key: 'dre_balancete',
        label: 'DRE / Balancete Analítico Real ou SPED Fiscal',
        description: 'DRE completa auditada, balancete contábil ou arquivo SPED EFD ICMS/IPI e Contribuições.',
        type: 'file',
        formats: ['.xlsx', '.xls', '.pdf', '.csv', '.txt']
      },
      {
        key: 'cnpj',
        label: 'CNPJ do Contribuinte / Matriz',
        description: 'Cadastro Nacional da Pessoa Jurídica ativo perante a Receita Federal do Brasil.',
        type: 'cnpj'
      }
    ],
    optionalInputs: [
      {
        key: 'erp_live_connection',
        label: 'Conector ERP Ativo (mTLS/OAuth2)',
        description: 'Sincronização direta com TOTVS, SAP, Oracle ou Senior para leitura de títulos e notas.',
        type: 'api_connection'
      },
      {
        key: 'pgfn_ecac_certificate',
        label: 'Certificado Digital ICP-Brasil A1',
        description: 'Permite consulta imediata de Certidão Negativa e Dívida Ativa da União perante a PGFN.',
        type: 'file',
        formats: ['.pfx', '.p12']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_REAL_DATA_MANDATORY',
        description: 'Obrigatório envio de arquivos reais (Extrato Bancário e DRE/Balancete/SPED)',
        errorReasonIfNotMet: 'Bloqueio Contratual: A geração de Laudo de Risco & ROI exige Extrato Bancário e DRE/Balancete reais. Estimativas e simulações fictícias são vedadas pelo protocolo Velatrix AOS.'
      },
      {
        ruleId: 'RULE_VALID_CNPJ',
        description: 'CNPJ válido com 14 dígitos e matriz cadastrada',
        errorReasonIfNotMet: 'O CNPJ informado é inválido ou não possui conformidade com o cadastro da RFB.'
      }
    ]
  },

  cyberspy_threat: {
    serviceId: 'cyberspy_threat',
    serviceName: 'AOS CyberSpy & ZeroVision Threat Intelligence',
    category: 'SEGURANCA_CYBER',
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'threat_event_id',
        label: 'Identificador do Evento / Alvo de Ingestão',
        description: 'ID canônico do incidente interceptado (Dark Web, Anomalia PIX ou ERP Rogue Script).',
        type: 'field'
      },
      {
        key: 'target_entity',
        label: 'Entidade / Ativo Afetado',
        description: 'Conta bancária, credencial de acesso, token mTLS ou módulo ERP impactado.',
        type: 'field'
      }
    ],
    optionalInputs: [
      {
        key: 'pcap_raw_log',
        label: 'Dump Criptográfico / Trilha de Rede',
        description: 'Registro bruto com payload de ataque ou vazamento coletado pelo crawler.',
        type: 'file',
        formats: ['.json', '.log', '.pcap']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_THREAT_SIGNATURE_VERIFIED',
        description: 'Assinatura criptográfica da anomalia identificada pelo ZeroVision',
        errorReasonIfNotMet: 'Bloqueio de Segurança: Não é possível emitir laudo de ameaça sem evidência auditável do evento de intrusão.'
      }
    ]
  },

  erp_connector: {
    serviceId: 'erp_connector',
    serviceName: 'Conector ERP & Webhook Gateway',
    category: 'CONECTOR_ERP',
    forbidEstimatedDataInFinalReport: true,
    requiredInputs: [
      {
        key: 'erp_endpoint',
        label: 'URL Base do ERP / Gateway API',
        description: 'Endpoint HTTPS seguro homologado para ingestão de eventos de produção/financeiro.',
        type: 'field'
      },
      {
        key: 'auth_credentials',
        label: 'Credenciais de Autenticação (OAuth2 / mTLS / API Key)',
        description: 'Chaves ativas e validadas perante o servidor do ERP.',
        type: 'field'
      }
    ],
    optionalInputs: [
      {
        key: 'a1_vault_cert',
        label: 'Certificado A1 do Cofre mTLS',
        description: 'Certificado ICP-Brasil para autenticação mTLS mútua na porta 8443.',
        type: 'file',
        formats: ['.pfx', '.p12']
      }
    ],
    validationRules: [
      {
        ruleId: 'RULE_HANDSHAKE_VALIDATED',
        description: 'Handshake mTLS ou teste de conectividade HTTP 200 concluído com sucesso',
        errorReasonIfNotMet: 'Bloqueio de Integração: Não é possível validar o conector sem handshake de comunicação ativo e certificado verificado.'
      }
    ]
  }
};
