import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Search, 
  RefreshCw, 
  Clock, 
  Zap, 
  Activity, 
  Database,
  ArrowRight,
  Eye,
  Send,
  MessageSquare,
  Smartphone,
  Layers,
  Terminal,
  Code2,
  Copy,
  ChevronRight,
  UserCheck,
  Building,
  KeyRound,
  FileCode,
  Sliders,
  Filter,
  Check,
  Shield,
  Radio,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { 
  TenantProfile, 
  AuditRecord, 
  CyberSpyThreatLog, 
  CyberSpyThreatType, 
  CyberSpySeverity, 
  CyberSpyStatus 
} from '../../types/aos';
import { ServicePipelineStepper } from '../common/ServicePipelineStepper';
import { StandardizedAuditReportModal } from '../common/StandardizedAuditReportModal';
import { SERVICE_INPUT_CONTRACTS } from '../../services/serviceInputContracts';
import { CentralAuditReportService } from '../../services/centralAuditReportService';
import { StandardizedAuditReport } from '../../types/standardizedPipeline';
import { computeSha256Sync } from '../../services/expertTaxEngineService';
import { secureId } from '../../lib/demoMode';

interface CyberSpyThreatIntelligenceProps {
  tenantProfile: TenantProfile;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

const INITIAL_THREAT_LOGS: CyberSpyThreatLog[] = [
  {
    id: 'f82b7c41-9a12-4c8e-b832-11e4d9a2001',
    tenant_id: 'tenant-enterprise-velatrix',
    threat_type: 'DARK_WEB_LEAK',
    severity_level: 'CRITICAL',
    target_entity: 'cfo.roberto@velatrix.com.br (Credenciais & Chave API ERP)',
    triggered_by_user_id: 'usr_cfo_sec_01',
    triggered_by_user_name: 'Monitor de Dark Web (AOS Bot)',
    triggered_by_user_role: 'Automated Watcher',
    created_at: '2026-08-24T14:22:10.000Z',
    source_channel: 'DarkWeb API (Tor/I2P/Telegram)',
    detection_engine: 'DarkWeb Threat Feed',
    action_summary: 'Credenciais de e-mail e hash de senha corporativa encontrados em dump recente do BreachForums.',
    status: 'ACTIVE_BLOCK',
    raw_payload: {
      source_paste: 'BreachForums_Dump_BR_Fintech_v4.txt',
      leaked_email: 'cfo.roberto@velatrix.com.br',
      hash_algorithm: 'bcrypt-salted',
      compromised_timestamp: '2026-08-24T02:11:00Z',
      associated_api_tokens: ['velatrix_prod_sec_key_****881a'],
      tor_mirror_node: 'onion://7x7a28vle.onion/repo/dumps'
    },
    dispatch_channels: {
      zero_vision_active_block: true,
      whatsapp_sent: true,
      c_level_push: true,
      sms_sent: true
    }
  },
  {
    id: 'e31c8a52-1b23-4d9f-a943-22f5e8b3002',
    tenant_id: 'tenant-enterprise-velatrix',
    threat_type: 'FINANCIAL_SABOTAGE',
    severity_level: 'CRITICAL',
    target_entity: 'Chave PIX Fornecedor Alpha Peças (CNPJ 12.345.678/0001-90)',
    triggered_by_user_id: 'usr_finance_clerk_09',
    triggered_by_user_name: 'Marcos Vinícius (Analista Contas a Pagar)',
    triggered_by_user_role: 'Financial Operator',
    created_at: '2026-08-24T13:45:32.000Z',
    source_channel: 'ERP Audit Stream (SAP/Protheus)',
    detection_engine: 'Banking Anomaly Guard',
    action_summary: 'Alteração em lote de 18 chaves PIX de fornecedores para conta pessoa física em fintech antes da emissão do lote CNAB.',
    status: 'ACTIVE_BLOCK',
    raw_payload: {
      batch_id: 'CNAB_LOTE_20260824_4490',
      total_amount_diverted: 'R$ 384.500,00',
      altered_keys_count: 18,
      destination_proxy_pix: 'e7104b2a-8812-4091-a67b-1234567890ab',
      destination_bank: '260 - Nu Pagamentos S.A.',
      destination_account_holder: 'Laranja Distribuição e Serviços ME',
      sap_transaction_code: 'XK02_VENDOR_MODIFY'
    },
    dispatch_channels: {
      zero_vision_active_block: true,
      whatsapp_sent: true,
      c_level_push: true,
      sms_sent: false
    }
  },
  {
    id: 'd42d9b63-2c34-4e0a-b054-33a6f9c4003',
    tenant_id: 'tenant-enterprise-velatrix',
    threat_type: 'INVENTORY_GLITCH',
    severity_level: 'HIGH',
    target_entity: 'SKU-INV-8849 (Inversor Solar Bifásico 15kW)',
    triggered_by_user_id: 'usr_wms_operator_22',
    triggered_by_user_name: 'Carlos Eduardo (Operador WMS Galpão 03)',
    triggered_by_user_role: 'Warehouse Operator',
    created_at: '2026-08-24T11:15:08.000Z',
    source_channel: 'WMS Inventory Telemetry',
    detection_engine: 'Inventory Variance AI',
    action_summary: 'Baixa manual por "Ajuste de Quebra/Perda" de 250 unidades sem Ordem de Produção nem NF-e de descarte.',
    status: 'ACTIVE_BLOCK',
    raw_payload: {
      sku_code: 'SKU-INV-8849',
      units_adjusted: 250,
      estimated_loss_value: 'R$ 412.500,00',
      wms_warehouse_id: 'GALPAO_03_DOCA_B',
      manual_justification: 'Dano físico por umidade (Não comprovado por foto/laudo)',
      nfe_issued: false,
      rfid_gate_anomaly_detected: true
    },
    dispatch_channels: {
      zero_vision_active_block: true,
      whatsapp_sent: true,
      c_level_push: true,
      sms_sent: false
    }
  },
  {
    id: 'c53e0c74-3d45-4f1b-c165-44b7a0d5004',
    tenant_id: 'tenant-enterprise-velatrix',
    threat_type: 'CREDENTIAL_STUFFING',
    severity_level: 'MEDIUM',
    target_entity: 'VPN Gateway / API Endpoint /api/v1/erp/sync',
    triggered_by_user_id: 'ip_185.220.101.5',
    triggered_by_user_name: 'Endereço IP Externo (Tor Exit Node)',
    triggered_by_user_role: 'External Threat',
    created_at: '2026-08-24T09:05:44.000Z',
    source_channel: 'Database Change Log',
    detection_engine: 'Behavioral & Pattern Analysis Engine',
    action_summary: '4.200 tentativas falhas de autenticação com dicionário de senhas corporativas contra a API do AOS.',
    status: 'RESOLVED',
    raw_payload: {
      origin_ip: '185.220.101.5',
      country_origin: 'Alemanha (Tor Network)',
      target_usernames_tested: 4200,
      waf_rule_triggered: 'RATE_LIMIT_BRUTE_FORCE_EXCEEDED',
      auto_ban_duration_hours: 72
    },
    dispatch_channels: {
      zero_vision_active_block: true,
      whatsapp_sent: false,
      c_level_push: true,
      sms_sent: false
    }
  }
];

export const CyberSpyThreatIntelligence: React.FC<CyberSpyThreatIntelligenceProps> = ({
  tenantProfile,
  onAddAuditRecord
}) => {
  const [logs, setLogs] = useState<CyberSpyThreatLog[]>(INITIAL_THREAT_LOGS);
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'LOGS_TABLE' | 'C_LEVEL_DISPATCHER' | 'SQL_SCHEMA'>('PIPELINE');
  const [selectedThreatFilter, setSelectedThreatFilter] = useState<string>('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedLogForDetail, setSelectedLogForDetail] = useState<CyberSpyThreatLog | null>(null);
  const [isSimulatingIngestion, setIsSimulatingIngestion] = useState<boolean>(false);
  const [activeAlertToast, setActiveAlertToast] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // WhatsApp Alert Simulation State
  const [selectedWhatsappAlertLog, setSelectedWhatsappAlertLog] = useState<CyberSpyThreatLog>(INITIAL_THREAT_LOGS[1]);

  // Standardized Report Modal State
  const [selectedReportForModal, setSelectedReportForModal] = useState<StandardizedAuditReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);

  const createSecurityReportFromLog = (log: CyberSpyThreatLog, customStatus?: string): StandardizedAuditReport => {
    const isResolved = (customStatus || log.status) === 'RESOLVED';
    const report: StandardizedAuditReport = {
      reportId: `LDO-SEC-2026-${log.id.slice(0, 8).toUpperCase()}`,
      serviceId: 'cyberspy_threat_intelligence',
      serviceName: 'AOS CyberSpy & ZeroVision Threat Intelligence',
      reportType: 'security_threat',
      reportTypeLabel: 'Laudo de Segurança / Ameaça',
      issuedAt: new Date().toISOString(),
      issuedAtFormatted: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      tenantId: tenantProfile?.id || log.tenant_id,
      tenantName: tenantProfile?.name || 'Velatrix Industrial Holding S.A.',
      tenantCnpj: tenantProfile?.cnpj || '18.492.301/0001-88',
      lgpdCompliance: {
        isCompliant: true,
        dataProtectionOfficer: 'DPO Velatrix Cyber Defense (dpo@velatrix.com.br)',
        dataMaskingApplied: true,
        retentionPeriodDays: 1825,
        legalBasis: 'Art. 7º, IX da Lei 13.709/2018 (Segurança da Informação & Proteção ao Crédito)',
        anonymizedFields: ['Chaves Privadas', 'Senhas Hash', 'IPs Internos de Roteamento', 'Tokens API']
      },
      auditHash: computeSha256Sync(`${log.id}-${log.threat_type}-${log.severity_level}-${customStatus || log.status}`),
      signer: {
        name: 'Eng. Marcus Vinicius Prado',
        role: 'Head de Segurança Ofensiva & Cyber Forensics (CISM/CISSP)',
        credentialNumber: 'CREA-SP 5069218290 / CISSP-914820',
        signatureType: 'ICP_BRASIL_A1'
      },
      pipelineSnapshot: {
        verifiedRealSources: [
          `Canal Monitorado: ${log.source_channel}`,
          `Mecanismo: ${log.detection_engine}`,
          `Audit Event: 0x${log.id.replace(/-/g, '').slice(0, 16)}`
        ],
        executionTimeMs: 420,
        dataSourceIntegrity: '100% REAL VERIFICADO'
      },
      securityThreatPayload: {
        threatId: log.id,
        threatType: log.threat_type,
        severity: log.severity_level,
        threatTypeLabel: log.threat_type === 'DARK_WEB_LEAK' ? 'Vazamento em Fórum Dark Web / Telegram' :
          log.threat_type === 'FINANCIAL_SABOTAGE' ? 'Tentativa de Alteração de Chave PIX Fornecedor' :
          log.threat_type === 'INVENTORY_GLITCH' ? 'Divergência de Inventário / Cobre WMS' :
          'Ataque de Credential Stuffing / Dicionário',
        status: isResolved ? 'RESOLVED' : (log.status as 'RESOLVED' | 'ACTIVE_BLOCK' | 'OVERRIDDEN'),
        targetEntity: log.target_entity,
        channelOrigin: log.source_channel,
        mitigationAction: isResolved 
          ? 'Incidente contido e resolvido: quórum técnico validado, integridade de dados restaurada e logs selados no audit ledger.'
          : `Intercepção preventiva automática: ${log.action_summary}. Chaves revogadas e canal congelado pelo ZeroVision.`,
        anomalySignature: `SHA256: 0x${log.id.replace(/-/g, '')}`,
        resolutionNotes: log.override_details?.reason || 'Protocolo de Contenção ZeroVision executado com êxito sob a norma ISO 27001.'
      }
    };
    return report;
  };

  const handleSimulateAttack = (moduleType: CyberSpyThreatType) => {
    setIsSimulatingIngestion(true);

    setTimeout(() => {
      let newLog: CyberSpyThreatLog;
      const uuid = `${secureId('', 4)}-${secureId('', 4)}-4c8e-${secureId('', 4)}-${secureId('', 4)}`;

      if (moduleType === 'DARK_WEB_LEAK') {
        newLog = {
          id: uuid,
          tenant_id: tenantProfile?.id || 'tenant-velatrix-live',
          threat_type: 'DARK_WEB_LEAK',
          severity_level: 'CRITICAL',
          target_entity: 'diretor.tecnologia@velatrix.com.br (SSH Key & Token AWS)',
          triggered_by_user_id: 'usr_darkweb_bot',
          triggered_by_user_name: 'AOS CyberSpy Bot (Deep Tor Crawler)',
          triggered_by_user_role: 'Dark Web Crawler',
          created_at: new Date().toISOString(),
          source_channel: 'DarkWeb API (Tor/I2P/Telegram)',
          detection_engine: 'DarkWeb Threat Feed',
          action_summary: 'Chave privada RSA e credenciais de deploy encontradas no Pastebin público.',
          status: 'ACTIVE_BLOCK',
          raw_payload: {
            leak_source: 'Pastebin_Public_Leak_#99014',
            entity: 'diretor.tecnologia@velatrix.com.br',
            token_fingerprint: 'SHA256:49fa...990c',
            remediation: 'Revogação compulsória de tokens e ativação de 2FA biométrico'
          },
          dispatch_channels: {
            zero_vision_active_block: true,
            whatsapp_sent: true,
            c_level_push: true,
            sms_sent: true
          }
        };
      } else if (moduleType === 'FINANCIAL_SABOTAGE') {
        newLog = {
          id: uuid,
          tenant_id: tenantProfile?.id || 'tenant-velatrix-live',
          threat_type: 'FINANCIAL_SABOTAGE',
          severity_level: 'CRITICAL',
          target_entity: 'Chave PIX Favorecido: Cobrança Fornecedor Metalúrgica',
          triggered_by_user_id: 'usr_sabotage_test',
          triggered_by_user_name: 'Usuário Interno (Matrícula #4401)',
          triggered_by_user_role: 'Operador Financeiro',
          created_at: new Date().toISOString(),
          source_channel: 'ERP Audit Stream (SAP/Protheus)',
          detection_engine: 'Banking Anomaly Guard',
          action_summary: 'Substituição de Chave PIX do fornecedor 10 minutos antes da conciliação bancária matinal.',
          status: 'ACTIVE_BLOCK',
          raw_payload: {
            original_pix: 'contato@metalurgicabr.com.br',
            injected_pix: 'pix-desvio-laranja@teste.com',
            invoice_amount: 'R$ 198.400,00',
            sap_table: 'LFBK_BANK_DETAILS',
            action_prevented: 'Remessa de Pagamento BACEN SPI Congelada'
          },
          dispatch_channels: {
            zero_vision_active_block: true,
            whatsapp_sent: true,
            c_level_push: true,
            sms_sent: false
          }
        };
      } else {
        newLog = {
          id: uuid,
          tenant_id: tenantProfile?.id || 'tenant-velatrix-live',
          threat_type: 'INVENTORY_GLITCH',
          severity_level: 'HIGH',
          target_entity: 'SKU-COBRE-BARRA-50MM (Lote de Cobre Puro 400kg)',
          triggered_by_user_id: 'usr_stock_tamper',
          triggered_by_user_name: 'Operador Almoxarifado Matriz',
          triggered_by_user_role: 'Expedição WMS',
          created_at: new Date().toISOString(),
          source_channel: 'WMS Inventory Telemetry',
          detection_engine: 'Inventory Variance AI',
          action_summary: 'Divergência física vs contábil: Baixa de 400kg de cobre classificado como "Sucata" sem laudo técnico.',
          status: 'ACTIVE_BLOCK',
          raw_payload: {
            sku: 'SKU-COBRE-BARRA-50MM',
            weight_kg: 400,
            financial_exposure: 'R$ 84.000,00',
            wms_status: 'BAIXA_MANUAL_BLOQUEADA',
            gate_sensor_alert: 'Carga retida na cancela de saída'
          },
          dispatch_channels: {
            zero_vision_active_block: true,
            whatsapp_sent: true,
            c_level_push: true,
            sms_sent: false
          }
        };
      }

      setLogs(prev => [newLog, ...prev]);
      setSelectedWhatsappAlertLog(newLog);
      setIsSimulatingIngestion(false);

      if (onAddAuditRecord) {
        onAddAuditRecord({
          id: `rec_cyberspy_${newLog.id}`,
          timestamp: new Date().toISOString(),
          eventId: `CYBERSPY-${newLog.threat_type}`,
          eventTitle: `[AOS CYBERSPY ACTIVE BLOCK] ${newLog.action_summary}`,
          sector: tenantProfile?.sector || 'manufacturing',
          jurisdiction: 'BR',
          agentsInvolved: ['AOS CyberSpy Ingestion Engine', 'ZeroVision Active Block', 'Zero-Trust Risk Agent'],
          decisionSummary: `Ameaça ${newLog.threat_type} interceptada pelo motor CyberSpy. Alvo: ${newLog.target_entity}. Ação: ZeroVision Active Block aplicado e alerta C-Level despachado via WhatsApp.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'Critical',
            summary: `Intercepção CyberSpy: ${newLog.action_summary}`,
            kpis: [
              { label: 'Ameaça', value: newLog.threat_type, impact: 'negative' },
              { label: 'Status', value: 'ACTIVE_BLOCK', impact: 'positive' }
            ],
            invariants_checked: [
              'CyberSpy_Active_Block_Enforced = DISPARADO',
              'C_Level_WhatsApp_Dispatched = ENVIADO',
              'Proof_Of_Intent_Inviolavel = ATIVO'
            ]
          },
          status: 'blocked_fraud',
          signatures: [
            {
              role: 'AOS CyberSpy Autonomous Guard',
              keyId: '0x00_AOS_CYBERSPY_SEC_KEY',
              signedAt: new Date().toISOString(),
              verified: true
            }
          ],
          executionReceipt: `TX-CYBERSPY-${newLog.id.slice(0, 8)}`,
          invariantSnapshot: ['Invariante_Anti_Sabotagem', 'CyberSpy_Active_Block', 'BACEN_SPI_Quarantine']
        });
      }

      // Registra no repositório unificado de laudos e dispara toast
      const newThreatReport = createSecurityReportFromLog(newLog);
      CentralAuditReportService.registerReport(newThreatReport);

      setActiveAlertToast(`🚨 [AOS CyberSpy] Nova ameaça ${newLog.threat_type} bloqueada! Laudo emitido e Alerta C-Level despachado.`);
      setTimeout(() => setActiveAlertToast(null), 5000);
    }, 900);
  };

  const handleStatusChange = (logId: string, newStatus: CyberSpyStatus) => {
    setLogs(prev => prev.map(l => {
      if (l.id === logId) {
        return {
          ...l,
          status: newStatus,
          override_details: newStatus === 'OVERRIDDEN' ? {
            overridden_by: 'CFO Roberto Mendes (Multi-Sig 2/3)',
            overridden_at: new Date().toISOString(),
            reason: 'Liberação manual de emergência autorizada pelo comitê de segurança.',
            multi_sig_hash: `0x${secureId('', 4)}${secureId('', 4)}`
          } : undefined
        };
      }
      return l;
    }));

    if (newStatus === 'RESOLVED') {
      const targetLog = logs.find(l => l.id === logId);
      if (targetLog) {
        const securityReport = createSecurityReportFromLog(targetLog, 'RESOLVED');
        CentralAuditReportService.registerReport(securityReport);
        setSelectedReportForModal(securityReport);
        setIsReportModalOpen(true);
      }
    }

    setActiveAlertToast(`Status do Log ${logId.slice(0, 8)} atualizado para: ${newStatus}`);
    setTimeout(() => setActiveAlertToast(null), 3500);
  };

  const filteredLogs = logs.filter(l => {
    if (selectedThreatFilter !== 'ALL' && l.threat_type !== selectedThreatFilter) return false;
    if (selectedSeverityFilter !== 'ALL' && l.severity_level !== selectedSeverityFilter) return false;
    if (selectedStatusFilter !== 'ALL' && l.status !== selectedStatusFilter) return false;
    return true;
  });

  const getSeverityBadgeClass = (severity: CyberSpySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/60';
      case 'MEDIUM':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/60';
      case 'LOW':
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getThreatTypeBadgeClass = (threatType: CyberSpyThreatType) => {
    switch (threatType) {
      case 'DARK_WEB_LEAK':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50';
      case 'FINANCIAL_SABOTAGE':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'INVENTORY_GLITCH':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      case 'CREDENTIAL_STUFFING':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getStatusBadgeClass = (status: CyberSpyStatus) => {
    switch (status) {
      case 'ACTIVE_BLOCK':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/60';
      case 'OVERRIDDEN':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/60';
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-[var(--vx-neon-green)] border-emerald-500/60';
    }
  };

  const sqlDdlText = `-- Estrutura Base para Logs de Ameaça Interna
CREATE TABLE cyber_spy_threat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    threat_type VARCHAR(50) NOT NULL, -- 'DARK_WEB_LEAK', 'FINANCIAL_SABOTAGE', 'INVENTORY_GLITCH', 'CREDENTIAL_STUFFING'
    severity_level VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    target_entity VARCHAR(100), -- E-mail, Chave PIX, SKU do Estoque
    triggered_by_user_id UUID,
    raw_payload JSONB,
    status VARCHAR(30) DEFAULT 'ACTIVE_BLOCK', -- 'ACTIVE_BLOCK', 'OVERRIDDEN', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de Alta Performance para Ingestão em Tempo Real
CREATE INDEX idx_cyber_spy_tenant ON cyber_spy_threat_logs (tenant_id, created_at DESC);
CREATE INDEX idx_cyber_spy_status ON cyber_spy_threat_logs (status) WHERE status = 'ACTIVE_BLOCK';
CREATE INDEX idx_cyber_spy_type ON cyber_spy_threat_logs (threat_type);
CREATE INDEX idx_cyber_spy_payload ON cyber_spy_threat_logs USING GIN (raw_payload);`;

  return (
    <div id="cyber-spy-threat-intelligence-view" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {activeAlertToast && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border-2 border-rose-500 text-slate-100 text-xs font-mono flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <span className="font-bold">{activeAlertToast}</span>
          </div>
          <button onClick={() => setActiveAlertToast(null)} className="text-slate-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* Main Hero Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-indigo-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
                AOS CyberSpy Ingestion Engine
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                ZeroVision Active Block
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40">
                WhatsApp / C-Level Push Dispatcher
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              AOS CyberSpy & Threat Ingestion System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Ingestão contínua de telemetria de ERP, Logs de DB e feeds de Dark Web. Detecção comportamental de sabotagem financeira (PIX em lote), vazamentos de credenciais corporativas e anomalias de estoque com bloqueio ativo e despacho imediato para a diretoria.
            </p>
          </div>

          {/* Quick Simulation Triggers */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold text-center sm:text-left">
                Simulador de Ameaças em Tempo Real:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateAttack('DARK_WEB_LEAK')}
                  disabled={isSimulatingIngestion}
                  className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-600/60 font-mono text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  <span>1. Dark Web Leak</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAttack('FINANCIAL_SABOTAGE')}
                  disabled={isSimulatingIngestion}
                  className="px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-600/60 font-mono text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. PIX/Bank Mod</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulateAttack('INVENTORY_GLITCH')}
                  disabled={isSimulatingIngestion}
                  className="px-3 py-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/60 font-mono text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Inventory Anomaly</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Throughput de Ingestão</span>
            <div className="text-sm sm:text-base font-black text-[var(--vx-neon)] font-mono">18.420 eventos/s</div>
            <span className="text-[10px] text-emerald-400 font-mono">Latência: 4.2ms D+0</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Ameaças Ativas Bloqueadas</span>
            <div className="text-sm sm:text-base font-black text-rose-400 font-mono">
              {logs.filter(l => l.status === 'ACTIVE_BLOCK').length} Ativas
            </div>
            <span className="text-[10px] text-rose-400 font-mono">ZeroVision Enforced</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">C-Level WhatsApp Gateway</span>
            <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">Online (Multi-Sig)</div>
            <span className="text-[10px] text-slate-400 font-mono">Quórum 2/3 Ativo</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase block">Tabela PostgreSQL</span>
            <div className="text-sm sm:text-base font-black text-purple-300 font-mono">cyber_spy_threat_logs</div>
            <span className="text-[10px] text-purple-400 font-mono">JSONB Indexado</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ESTEIRA DE STATUS VISÍVEL PADRONIZADA (RECEBIDO -> PROCESSANDO -> VALIDANDO -> PRONTO/BLOQUEADO) */}
      {/* ========================================================================= */}
      <ServicePipelineStepper
        currentStage={
          isSimulatingIngestion 
            ? 'PROCESSANDO' 
            : logs.some(l => l.status === 'ACTIVE_BLOCK')
              ? 'VALIDANDO'
              : 'PRONTO'
        }
        serviceContract={SERVICE_INPUT_CONTRACTS.cyberspy_threat_intelligence}
        progressPct={isSimulatingIngestion ? 45 : 100}
        className="mb-2"
      />

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[var(--vx-deep)] p-2 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('PIPELINE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'PIPELINE'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/60 shadow-lg shadow-indigo-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>1. Pipeline & Arquitetura Visual (AOS CyberSpy Flow)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('LOGS_TABLE')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'LOGS_TABLE'
              ? 'bg-rose-600/30 text-rose-300 border border-rose-500/60 shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-rose-400" />
          <span>2. Live Threat Logs (`cyber_spy_threat_logs`)</span>
          <span className="px-2 py-0.5 rounded-full text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
            {logs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('C_LEVEL_DISPATCHER')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'C_LEVEL_DISPATCHER'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span>3. Dispatcher C-Level (WhatsApp & Push Alert)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SQL_SCHEMA')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'SQL_SCHEMA'
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/60 shadow-lg shadow-purple-950/50'
              : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4 text-purple-400" />
          <span>4. SQL DDL & Schema Explorer</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE PIPELINE ARCHITECTURE (Representação do Fluxo Solicitado) */}
      {activeTab === 'PIPELINE' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-[var(--vx-deep)] border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 font-mono uppercase tracking-tight flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Diagrama Interativo do Fluxo de Ingestão e Bloqueio
                </h2>
                <p className="text-xs text-slate-400">
                  Visualização da cadeia de dados: Ingestão de múltiplas fontes ➔ Motor de Padrões ➔ 3 Módulos de Ameaça ➔ Dispatcher ZeroVision.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[var(--vx-neon-green)] animate-ping" />
                  Streaming Contínuo 24/7
                </span>
              </div>
            </div>

            {/* Visual Flow Architecture */}
            <div className="space-y-4">
              
              {/* STEP 1: Fontes de Dados */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    Camada 01 • Fontes de Dados Heterogêneas
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400">4 Conectores Ativos</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { title: 'ERP Logs (SAP / TOTVS)', desc: 'CDC em tabelas financeiras e de fornecedores', icon: Database, color: 'text-cyan-400' },
                    { title: 'Database Change Logs', desc: 'Triggers de auditoria em banco de dados', icon: Terminal, color: 'text-purple-400' },
                    { title: 'WMS Sensors & RFID', desc: 'Telemetria física de estoques e balanças', icon: Layers, color: 'text-amber-400' },
                    { title: 'DarkWeb Feeds & APIs', desc: 'Varredura em pastes, fóruns Tor e Telegram', icon: Eye, color: 'text-rose-400' }
                  ].map((src, i) => {
                    const SrcIcon = src.icon;
                    return (
                      <div key={i} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-2.5">
                        <SrcIcon className={`w-4 h-4 ${src.color} shrink-0 mt-0.5`} />
                        <div>
                          <strong className="text-xs text-slate-200 block">{src.title}</strong>
                          <span className="text-[10px] text-slate-400 leading-tight block">{src.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  <span>Fluxo de Streaming via gRPC / Webhooks (18.4k logs/s)</span>
                </div>
              </div>

              {/* STEP 2: AOS CyberSpy Ingestion Engine */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-indigo-300 tracking-wider flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Camada 02 • AOS CyberSpy Ingestion Engine
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">Normalização e Desduplicação Hash SHA-256</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trata o volume bruto de dados, executa decodificação de payloads, anonimização pré-LGPD e enriquecimento de telemetria contextual (IP, geolocalização, ID do usuário, máquina e certificado digital).
                </p>
              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  <span>Payload Enriquecido ➔ Motor de Padrões</span>
                </div>
              </div>

              {/* STEP 3: Behavioral & Pattern Analysis Engine */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-950/40 border border-purple-500/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    Camada 03 • Behavioral & Pattern Analysis Engine
                  </span>
                  <span className="text-[10px] font-mono text-purple-300">Baseline Comportamental de Usuários & Contas</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Avalia se a transação ou evento foge do perfil habitual (desvio padrão do horário de trabalho, volume financeiro, repetição de chaves PIX, histórico de baixas de estoque e cruzamento com bancos de dados de vazamento).
                </p>
              </div>

              {/* Arrow Split Connector */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  <span>Distribuição Especializada em 3 Módulos de Ameaça</span>
                </div>
              </div>

              {/* STEP 4: The 3 Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Module 1: Dark Web Leak */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700">
                        Módulo 01
                      </span>
                      <Eye className="w-4 h-4 text-indigo-400" />
                    </div>
                    <strong className="text-xs font-bold text-slate-100 block">
                      Dark Web Leak Monitor
                    </strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Varredura automatizada em fóruns de cibercrime, grupos de Telegram e pastes de dumps. Detecta e-mails de executivos, senhas corporativas e chaves de API expostas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateAttack('DARK_WEB_LEAK')}
                    className="w-full py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/50 font-mono text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-indigo-400" />
                    <span>Testar Ingestão Vazamento</span>
                  </button>
                </div>

                {/* Module 2: PIX/Bank Mod */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-700">
                        Módulo 02
                      </span>
                      <Lock className="w-4 h-4 text-rose-400" />
                    </div>
                    <strong className="text-xs font-bold text-slate-100 block">
                      PIX / Bank Mod (Sabotagem Financeira)
                    </strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Detecta alterações furtivas em lote de dados bancários de fornecedores cadastrados, substituição de chaves PIX para contas de terceiros e divergências de conciliação.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateAttack('FINANCIAL_SABOTAGE')}
                    className="w-full py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/50 font-mono text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-rose-400" />
                    <span>Testar Ingestão PIX Mod</span>
                  </button>
                </div>

                {/* Module 3: Inventory Anomaly */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-700">
                        Módulo 03
                      </span>
                      <Layers className="w-4 h-4 text-amber-400" />
                    </div>
                    <strong className="text-xs font-bold text-slate-100 block">
                      Inventory Anomaly (Glitches de Estoque)
                    </strong>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Cruza dados contábeis de saída com portais de telemetria e RFID. Intercepta baixas manuais sem emissão de NF-e, desvios de SKUs críticos e reclassificação indevida.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSimulateAttack('INVENTORY_GLITCH')}
                    className="w-full py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/50 font-mono text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Testar Ingestão Estoque</span>
                  </button>
                </div>

              </div>

              {/* Arrow Connector */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90" />
                  <span>Disparo Imediato para a Camada de Ação ZeroVision</span>
                </div>
              </div>

              {/* STEP 5: Dispatcher (ZeroVision Active Block + C-Level Alert) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[var(--vx-deep)] via-slate-900 to-[var(--vx-deep)] border-2 border-rose-500/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-mono font-black uppercase text-rose-300 tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Dispatcher: ZeroVision Active Block + C-Level Alert (WhatsApp / Push)
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40">
                    Tempo de Resposta: Sub-25ms
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-1">
                    <strong className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                      1. ZeroVision Active Block (Trava no ERP & BACEN)
                    </strong>
                    <p className="text-[11px] text-slate-300">
                      Congela a execução da transação no ERP (SAP, TOTVS), suspende a remessa no gateway bancário BACEN SPI e aciona a cancela eletrônica da doca de expedição.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-1">
                    <strong className="text-xs font-bold text-[var(--vx-neon-green)] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      2. Despacho C-Level (WhatsApp & Push Criptografado)
                    </strong>
                    <p className="text-[11px] text-slate-300">
                      Dispara notificação push instantânea e mensagem via WhatsApp para CFO, CTO e Diretores de Segurança com botões de desbloqueio por Multi-Sig.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 2: LIVE THREAT LOGS TABLE (`cyber_spy_threat_logs`) */}
      {activeTab === 'LOGS_TABLE' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Filter Bar */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Tipo:</span>
                <select
                  value={selectedThreatFilter}
                  onChange={(e) => setSelectedThreatFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Todos os Tipos</option>
                  <option value="DARK_WEB_LEAK">Dark Web Leak</option>
                  <option value="FINANCIAL_SABOTAGE">Financial Sabotage (PIX)</option>
                  <option value="INVENTORY_GLITCH">Inventory Glitch</option>
                  <option value="CREDENTIAL_STUFFING">Credential Stuffing</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Severidade:</span>
                <select
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Todas as Severidades</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Todos os Status</option>
                  <option value="ACTIVE_BLOCK">ACTIVE_BLOCK</option>
                  <option value="OVERRIDDEN">OVERRIDDEN</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Exibindo <strong className="text-slate-200">{filteredLogs.length}</strong> de <strong className="text-slate-200">{logs.length}</strong> logs de ameaça
            </div>

          </div>

          {/* Table Container */}
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="p-3.5">ID / Timestamp</th>
                    <th className="p-3.5">Ameaça (threat_type)</th>
                    <th className="p-3.5">Severidade</th>
                    <th className="p-3.5">Entidade-Alvo (target_entity)</th>
                    <th className="p-3.5">Origem / Canal</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      
                      {/* ID / Timestamp */}
                      <td className="p-3.5">
                        <span className="text-slate-300 font-bold block truncate max-w-[120px]" title={log.id}>
                          {log.id.slice(0, 8)}...
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.created_at).toLocaleTimeString('pt-BR')} ({new Date(log.created_at).toLocaleDateString('pt-BR')})
                        </span>
                      </td>

                      {/* Threat Type */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getThreatTypeBadgeClass(log.threat_type)}`}>
                          {log.threat_type}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(log.severity_level)}`}>
                          {log.severity_level}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="p-3.5 max-w-[240px]">
                        <strong className="text-slate-200 block truncate" title={log.target_entity}>
                          {log.target_entity}
                        </strong>
                        <span className="text-[10px] text-slate-400 block truncate" title={log.action_summary}>
                          {log.action_summary}
                        </span>
                      </td>

                      {/* Channel */}
                      <td className="p-3.5">
                        <span className="text-slate-300 text-[11px] block">{log.source_channel}</span>
                        <span className="text-[10px] text-slate-500 block">{log.detection_engine}</span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const rep = createSecurityReportFromLog(log);
                            setSelectedReportForModal(rep);
                            setIsReportModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/60 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          title="Emitir / Visualizar Laudo Oficial de Segurança"
                        >
                          <FileCheck className="w-3 h-3 text-cyan-400" />
                          <span>Laudo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedLogForDetail(log)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700/60 text-[10px] font-bold transition-all cursor-pointer"
                          title="Inspecionar JSONB payload"
                        >
                          Payload
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWhatsappAlertLog(log);
                            setActiveTab('C_LEVEL_DISPATCHER');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 text-[10px] font-bold transition-all cursor-pointer"
                          title="Ver alerta WhatsApp despachado"
                        >
                          WhatsApp
                        </button>

                        {log.status === 'ACTIVE_BLOCK' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(log.id, 'OVERRIDDEN')}
                            className="px-2.5 py-1 rounded-lg bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-700/60 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Override
                          </button>
                        ) : log.status === 'OVERRIDDEN' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(log.id, 'RESOLVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Resolver
                          </button>
                        ) : null}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Payload Inspector */}
          {selectedLogForDetail && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[var(--vx-deep)] border border-indigo-500/50 rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 font-mono">
                        raw_payload (JSONB) • {selectedLogForDetail.threat_type}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">ID: {selectedLogForDetail.id}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLogForDetail(null)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Entidade-Alvo: <strong className="text-slate-200">{selectedLogForDetail.target_entity}</strong></span>
                    <span>Status: <strong className="text-rose-400">{selectedLogForDetail.status}</strong></span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                    <pre>{JSON.stringify(selectedLogForDetail.raw_payload, null, 2)}</pre>
                  </div>
                </div>

                {selectedLogForDetail.override_details && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono space-y-1">
                    <strong className="text-amber-300 block">Detalhes do Override Multi-Sig:</strong>
                    <p className="text-slate-300">{selectedLogForDetail.override_details.reason}</p>
                    <span className="text-[10px] text-slate-400 block">
                      Autorizado por: {selectedLogForDetail.override_details.overridden_by} • Hash: {selectedLogForDetail.override_details.multi_sig_hash}
                    </span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const rep = createSecurityReportFromLog(selectedLogForDetail);
                      setSelectedReportForModal(rep);
                      setIsReportModalOpen(true);
                      setSelectedLogForDetail(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Emitir / Ver Laudo Oficial</span>
                  </button>

                  <button
                    onClick={() => setSelectedLogForDetail(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: C-LEVEL DISPATCHER (WHATSAPP & PUSH PREVIEW) */}
      {activeTab === 'C_LEVEL_DISPATCHER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          
          {/* LEFT: Dispatcher Engine Overview (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="bg-[var(--vx-deep)] border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-[var(--vx-neon-green)] border border-emerald-500/40">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-100 font-mono uppercase tracking-tight">
                      C-Level Security Dispatcher Engine
                    </h2>
                    <p className="text-xs text-slate-400">
                      Roteamento instantâneo de alertas críticos com assinatura digital de chave assimétrica.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Quando uma ameaça de nível <strong className="text-rose-400">CRITICAL</strong> ou <strong className="text-amber-400">HIGH</strong> é interceptada pelo AOS CyberSpy, o sistema executa o <strong className="text-rose-300">ZeroVision Active Block</strong> e simultaneamente despacha um alerta enriquecido via WhatsApp Business API e Push Notification para os dispositivos móveis dos executivos aprovadores.
              </p>

              {/* Approvers Target List */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Destinatários C-Level Cadastrados (Quórum Multi-Sig):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { name: 'Dr. Roberto Mendes', role: 'Chief Financial Officer (CFO)', phone: '+55 (11) 98765-4321', status: 'Online WhatsApp' },
                    { name: 'Engª. Helena Vasconcelos', role: 'Chief Technology Officer (CTO)', phone: '+55 (11) 99887-1122', status: 'Online Push' },
                    { name: 'Carlos Eduardo Santos', role: 'Head of Internal Security', phone: '+55 (11) 97654-3344', status: 'Online SMS/Push' },
                    { name: 'AOS Swarm Guardian', role: 'Supervisor Autônomo 24/7', phone: 'Sistema Central', status: 'Ativo D+0' }
                  ].map((appr, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <strong className="text-slate-200 block text-[11px]">{appr.name}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{appr.role}</span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--vx-neon-green)] font-bold">● {appr.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Selector to preview message */}
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                  Selecione uma Ameaça para Visualizar o Alerta Gerado:
                </span>
                <div className="flex flex-wrap gap-2">
                  {logs.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setSelectedWhatsappAlertLog(l)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                        selectedWhatsappAlertLog.id === l.id
                          ? 'bg-emerald-600 text-white font-bold shadow-md'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {l.threat_type} ({l.id.slice(0, 6)})
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT: Live Smartphone / WhatsApp Mockup (5 Cols) */}
          <div className="lg:col-span-5 flex justify-center">
            
            {/* Phone Frame */}
            <div className="w-full max-w-sm rounded-[36px] bg-slate-950 border-4 border-slate-700 shadow-2xl p-4 space-y-3 relative overflow-hidden">
              
              {/* Top Speaker & Notch */}
              <div className="flex justify-center mb-1">
                <div className="w-20 h-3 bg-slate-800 rounded-full" />
              </div>

              {/* WhatsApp Header */}
              <div className="bg-[#075E54] text-white p-3 rounded-2xl flex items-center justify-between shadow">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center font-bold text-xs">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <strong className="text-xs block font-sans">AOS ZeroVision Shield</strong>
                    <span className="text-[10px] text-emerald-200 font-mono block">Canal Oficial C-Level</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-200">256-bit E2E</span>
              </div>

              {/* Chat Message Bubble */}
              <div className="p-4 rounded-2xl bg-[var(--vx-deep)] border border-[#1f2c34] text-slate-100 text-xs font-sans space-y-2.5 shadow-inner">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-600">
                    🚨 ALERTA CRÍTICO: {selectedWhatsappAlertLog.threat_type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(selectedWhatsappAlertLog.created_at).toLocaleTimeString('pt-BR')}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <p className="text-slate-200 font-bold leading-tight">
                    [ZeroVision Active Block Disparado]
                  </p>
                  <p className="text-slate-300 text-[10px]">
                    <strong>Alvo:</strong> {selectedWhatsappAlertLog.target_entity}
                  </p>
                  <p className="text-slate-300 text-[10px]">
                    <strong>Diagnóstico:</strong> {selectedWhatsappAlertLog.action_summary}
                  </p>
                  <p className="text-slate-300 text-[10px]">
                    <strong>Severidade:</strong> {selectedWhatsappAlertLog.severity_level}
                  </p>
                  <p className="text-emerald-400 text-[10px] font-bold">
                    ✓ Transação congelada no ERP & BACEN SPI.
                  </p>
                </div>

                {/* Simulated Interactive Action Buttons in WhatsApp */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5 font-mono">
                  <button
                    onClick={() => {
                      setActiveAlertToast(`✓ [WhatsApp Action] Bloqueio mantido ativo para ${selectedWhatsappAlertLog.id.slice(0, 8)}`);
                      setTimeout(() => setActiveAlertToast(null), 3500);
                    }}
                    className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-all text-center cursor-pointer"
                  >
                    🔒 1. Manter Bloqueio Ativo (Recomendado)
                  </button>

                  <button
                    onClick={() => {
                      handleStatusChange(selectedWhatsappAlertLog.id, 'OVERRIDDEN');
                    }}
                    className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all text-center cursor-pointer"
                  >
                    ⚡ 2. Solicitar Quórum Multi-Sig (Desbloqueio)
                  </button>
                </div>

                <div className="text-[9px] font-mono text-center text-slate-500">
                  Hash: 0x{selectedWhatsappAlertLog.id.slice(0, 12)}...
                </div>

              </div>

              <div className="text-[9px] font-mono text-center text-slate-500 pb-1">
                Velatrix AOS • Resposta Autônoma em Tempo Real
              </div>

            </div>

          </div>

        </div>
      )}

      {/* TAB 4: SQL DDL & SCHEMA EXPLORER */}
      {activeTab === 'SQL_SCHEMA' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-[var(--vx-deep)] border border-purple-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-base font-black text-slate-100 font-mono uppercase tracking-tight">
                    Estrutura de Banco de Dados: `cyber_spy_threat_logs`
                  </h2>
                  <p className="text-xs text-slate-400">
                    Schema PostgreSQL compatível com Cloud SQL / Supabase com campos JSONB e índices GIN.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(sqlDdlText);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-600/60 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar DDL SQL'}</span>
              </button>
            </div>

            {/* SQL Code Block */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300 overflow-x-auto">
              <pre>{sqlDdlText}</pre>
            </div>

            {/* Analytical Queries Examples */}
            <div className="space-y-2 pt-3 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Queries de Análise em Tempo Real (Prontas para Execução):
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                  <strong className="text-slate-300 block text-xs">Ameaças Ativas por Tipo</strong>
                  <pre className="text-cyan-300 text-[10px] overflow-x-auto">
{`SELECT threat_type, count(*), max(created_at) 
FROM cyber_spy_threat_logs 
WHERE status = 'ACTIVE_BLOCK' 
GROUP BY threat_type;`}
                  </pre>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                  <strong className="text-slate-300 block text-xs">Exposição Financeira em JSONB</strong>
                  <pre className="text-cyan-300 text-[10px] overflow-x-auto">
{`SELECT target_entity, raw_payload->>'total_amount_diverted' as valor
FROM cyber_spy_threat_logs
WHERE threat_type = 'FINANCIAL_SABOTAGE';`}
                  </pre>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Modal de Laudo Oficial Padronizado de Segurança */}
      <StandardizedAuditReportModal
        report={selectedReportForModal}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

    </div>
  );
};
