import React, { useState } from 'react';
import { 
  MessageSquare, 
  ShieldAlert, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Lock, 
  KeyRound, 
  BellRing, 
  Activity, 
  RefreshCw, 
  Plus, 
  Trash2, 
  ExternalLink,
  Zap,
  Radio,
  Sliders,
  Check,
  X,
  QrCode,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { 
  WhatsAppGovernanceConfig, 
  WhatsAppRecipient, 
  WhatsAppDispatchLog,
  SupportedLanguage 
} from '../../types/aos';
import { secureId, secureInt } from '../../lib/demoMode';

interface WhatsAppGovernanceCardProps {
  config: WhatsAppGovernanceConfig;
  onChangeConfig: (newConfig: WhatsAppGovernanceConfig) => void;
  language?: SupportedLanguage;
}

export const INITIAL_DEFAULT_WHATSAPP_CONFIG: WhatsAppGovernanceConfig = {
  enabled: true,
  provider: 'meta_cloud_api',
  phoneNumberId: 'PHONE_ID_5511988220011_META',
  businessAccountId: 'WABA_948201_VELATRIX_PROD',
  webhookStatus: 'CONNECTED',
  hsmTemplateId: 'aos_zerotrust_lockdown_v1',
  requireTwoFactorHsmAuth: true,
  instantLockdownAutoDispatch: true,
  notifyOnPixChange: true,
  notifyOnCashBreach: true,
  notifyOnTaxGlitch: true,
  recipients: [
    {
      id: 'wa_c_01',
      name: 'Roberto Albuquerque',
      role: 'CEO (Chief Executive Officer)',
      phone: '+55 11 98822-0011',
      active: true,
      receiveZeroTrustLockdown: true,
      receiveCashAnomalyAlerts: true,
      receivePixTamperAlerts: true,
      secp256k1KeyId: 'secp256k1::0x7F4A...E19B'
    },
    {
      id: 'wa_c_02',
      name: 'Mariana Duarte',
      role: 'CFO (Chief Financial Officer)',
      phone: '+55 11 99744-8833',
      active: true,
      receiveZeroTrustLockdown: true,
      receiveCashAnomalyAlerts: true,
      receivePixTamperAlerts: true,
      secp256k1KeyId: 'secp256k1::0x2C9B...884A'
    },
    {
      id: 'wa_c_03',
      name: 'Helena Fontes',
      role: 'DPO & Security Officer',
      phone: '+55 11 99133-4422',
      active: true,
      receiveZeroTrustLockdown: true,
      receiveCashAnomalyAlerts: false,
      receivePixTamperAlerts: true,
      secp256k1KeyId: 'secp256k1::0x4E11...33F0'
    },
    {
      id: 'wa_c_04',
      name: 'Carlos Eduardo Mendes',
      role: 'COO (Diretor de Operações)',
      phone: '+55 11 98322-1100',
      active: true,
      receiveZeroTrustLockdown: false,
      receiveCashAnomalyAlerts: true,
      receivePixTamperAlerts: false,
      secp256k1KeyId: 'secp256k1::0x9A8F...6A12'
    }
  ],
  recentDispatches: [
    {
      id: 'dsp_8819',
      timestamp: '2026-08-26 12:44:18',
      recipientName: 'Roberto Albuquerque (CEO)',
      phone: '+55 11 98822-0011',
      alertType: 'PIX_TAMPER_BLOCKED',
      status: 'CONFIRMED_LOCKDOWN',
      payloadSnippet: 'Tentativa de alteração de chave PIX de fornecedor TechCore SP (R$ 84.500) bloqueada.',
      latencyMs: 840
    },
    {
      id: 'dsp_8820',
      timestamp: '2026-08-26 12:44:19',
      recipientName: 'Mariana Duarte (CFO)',
      phone: '+55 11 99744-8833',
      alertType: 'PIX_TAMPER_BLOCKED',
      status: 'READ',
      payloadSnippet: 'Tentativa de alteração de chave PIX de fornecedor TechCore SP (R$ 84.500) bloqueada.',
      latencyMs: 910
    },
    {
      id: 'dsp_8792',
      timestamp: '2026-08-25 16:10:02',
      recipientName: 'Mariana Duarte (CFO)',
      phone: '+55 11 99744-8833',
      alertType: 'TAX_GLITCH_CRITICAL',
      status: 'APPROVED_HSM',
      payloadSnippet: 'Divergência de ICMS-ST R$ 16.340 na NF-e 9482 estornada com assinatura HSM.',
      latencyMs: 1120
    }
  ]
};

export const WhatsAppGovernanceCard: React.FC<WhatsAppGovernanceCardProps> = ({
  config,
  onChangeConfig,
  language = 'pt'
}) => {
  const currentConfig = config || INITIAL_DEFAULT_WHATSAPP_CONFIG;

  const [activeTab, setActiveTab] = useState<'recipients' | 'triggers' | 'simulator' | 'logs'>('recipients');
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [simulatorActionTaken, setSimulatorActionTaken] = useState<string | null>(null);

  // New recipient modal/form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Diretor Executivo');
  const [newPhone, setNewPhone] = useState('+55 11 9');
  const [newKey, setNewKey] = useState('secp256k1::0x' + secureId('', 4).toUpperCase() + '...HSM');

  const handleToggleEnabled = () => {
    onChangeConfig({
      ...currentConfig,
      enabled: !currentConfig.enabled
    });
  };

  const handleToggleRecipient = (id: string) => {
    const updated = currentConfig.recipients.map(r => 
      r.id === id ? { ...r, active: !r.active } : r
    );
    onChangeConfig({ ...currentConfig, recipients: updated });
  };

  const handleToggleRecipientSetting = (id: string, field: 'receiveZeroTrustLockdown' | 'receiveCashAnomalyAlerts' | 'receivePixTamperAlerts') => {
    const updated = currentConfig.recipients.map(r => 
      r.id === id ? { ...r, [field]: !r[field] } : r
    );
    onChangeConfig({ ...currentConfig, recipients: updated });
  };

  const handleUpdatePhone = (id: string, phone: string) => {
    const updated = currentConfig.recipients.map(r => 
      r.id === id ? { ...r, phone } : r
    );
    onChangeConfig({ ...currentConfig, recipients: updated });
  };

  const handleDeleteRecipient = (id: string) => {
    const updated = currentConfig.recipients.filter(r => r.id !== id);
    onChangeConfig({ ...currentConfig, recipients: updated });
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newRec: WhatsAppRecipient = {
      id: 'wa_c_' + Date.now().toString().slice(-4),
      name: newName.trim(),
      role: newRole.trim(),
      phone: newPhone.trim(),
      active: true,
      receiveZeroTrustLockdown: true,
      receiveCashAnomalyAlerts: true,
      receivePixTamperAlerts: true,
      secp256k1KeyId: newKey
    };

    onChangeConfig({
      ...currentConfig,
      recipients: [...currentConfig.recipients, newRec]
    });

    setShowAddModal(false);
    setNewName('');
    setNewPhone('+55 11 9');
  };

  const handleTriggerTestAlert = () => {
    setTestSending(true);
    setTestSuccess(false);
    setSimulatorActionTaken(null);

    setTimeout(() => {
      setTestSending(false);
      setTestSuccess(true);

      const newLog: WhatsAppDispatchLog = {
        id: 'dsp_' + secureInt(1000, 9999),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        recipientName: currentConfig.recipients[0]?.name || 'C-Level Executive',
        phone: currentConfig.recipients[0]?.phone || '+55 11 98822-0011',
        alertType: 'ZERO_TRUST_LOCKDOWN',
        status: 'DELIVERED',
        payloadSnippet: '🚨 [DISPARO TESTE]: Alerta de Zero-Trust Lockdown emitido via Meta Cloud API v20.0 com assinatura Secp256k1.',
        latencyMs: 940
      };

      onChangeConfig({
        ...currentConfig,
        recentDispatches: [newLog, ...(currentConfig.recentDispatches || [])]
      });

      setTimeout(() => setTestSuccess(false), 4500);
    }, 1200);
  };

  const handleSimulatorAction = (action: 'LOCKDOWN' | 'APPROVE_HSM') => {
    setSimulatorActionTaken(action);

    const statusMap = action === 'LOCKDOWN' ? 'CONFIRMED_LOCKDOWN' as const : 'APPROVED_HSM' as const;
    const actionText = action === 'LOCKDOWN' ? '🔒 Lockdown confirmado via WhatsApp' : '🛡️ Assinatura HSM autorizada via WhatsApp';

    const updatedLogs = (currentConfig.recentDispatches || []).map((log, idx) => {
      if (idx === 0) {
        return {
          ...log,
          status: statusMap,
          payloadSnippet: `${log.payloadSnippet} • [${actionText}]`
        };
      }
      return log;
    });

    onChangeConfig({
      ...currentConfig,
      recentDispatches: updatedLogs
    });
  };

  return (
    <div id="card-whatsapp-governance-integration" className="bg-[var(--vx-deep)] border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
      
      {/* Header with Title & Master Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-emerald-400" />
              WhatsApp Business API • Zero-Trust Mobile Sentinel
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              Meta Cloud API v20.0 • 200 OK
            </span>
          </div>
          <h2 className="text-lg font-black text-slate-100 tracking-tight flex items-center gap-2">
            <span>Alertas Móveis de Zero-Trust Lockdown & Quarentena C-Level</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Encaminha instantaneamente alertas críticos de sabotagem, tentativas de desvio de chave PIX e quebras de invariantes de liquidez direto para o WhatsApp criptografado dos diretores autorizados.
          </p>
        </div>

        {/* Master Active Switch & Live Test Button */}
        <div className="flex items-center gap-3">
          <button
            id="btn-test-whatsapp-push"
            type="button"
            onClick={handleTriggerTestAlert}
            disabled={testSending || !currentConfig.enabled}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              testSuccess 
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-900 hover:bg-slate-850 text-emerald-400 border-emerald-500/40 hover:border-emerald-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {testSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Transmitindo via Meta API...</span>
              </>
            ) : testSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Alerta Enviado para C-Level!</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Simular Alerta no WhatsApp</span>
              </>
            )}
          </button>

          <button
            id="btn-toggle-whatsapp-enabled"
            type="button"
            onClick={handleToggleEnabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              currentConfig.enabled 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-600 shadow-md shadow-emerald-950/50' 
                : 'bg-slate-900 text-slate-500 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${currentConfig.enabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span>{currentConfig.enabled ? 'CANAL ATIVO' : 'CANAL PAUSADO'}</span>
          </button>
        </div>
      </div>

      {/* Gateway Telemetry & Sub-navigation Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Provedor Homologado</div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Meta Cloud Platform (Graph API)
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate">ID: {currentConfig.phoneNumberId}</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Template HSM de Emergência</div>
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            aos_zerotrust_lockdown_v1
          </div>
          <div className="text-[10px] font-mono text-slate-400">Assinatura Digital HSM Ativa</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase">SLA de Entrega no Dispositivo</div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <Zap className="w-3 h-3 text-amber-400" />
            &lt; 1.2s (Latência P99)
          </div>
          <div className="text-[10px] font-mono text-emerald-400">99.98% Taxa de Entrega Estimada</div>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-500 font-mono uppercase">Destinatários C-Level</div>
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
            <Smartphone className="w-3 h-3 text-[var(--vx-neon)]" />
            {currentConfig.recipients.filter(r => r.active).length} de {currentConfig.recipients.length} Conectados
          </div>
          <div className="text-[10px] font-mono text-slate-400">Criptografia E2E + 2FA</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('recipients')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'recipients'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Diretoria & Telefones ({currentConfig.recipients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('triggers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'triggers'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Gatilhos de Lockdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'simulator'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Simulador Visual WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Histórico de Disparos ({currentConfig.recentDispatches?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: C-Level Recipients Matrix */}
      {activeTab === 'recipients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Dispositivos móveis homologados para receber comandos de interrupção e quarentena de capital:
            </span>
            <button
              id="btn-open-add-recipient-modal"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Executivo C-Level</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentConfig.recipients.map((rec) => (
              <div 
                key={rec.id}
                className={`p-4 rounded-xl border transition-all ${
                  rec.active 
                    ? 'bg-slate-950 border-slate-800 hover:border-emerald-500/40' 
                    : 'bg-slate-950/40 border-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{rec.name}</span>
                      <span className="text-[9px] font-mono uppercase bg-slate-900 text-slate-300 border border-slate-700 px-1.5 py-0.2 rounded">
                        {rec.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <input
                        type="text"
                        value={rec.phone}
                        onChange={(e) => handleUpdatePhone(rec.id, e.target.value)}
                        className="text-xs font-mono font-bold text-emerald-400 bg-slate-900/90 border border-slate-700 rounded px-2 py-0.5 w-44 focus:outline-none focus:border-emerald-400"
                        title="Telefone com DDD para WhatsApp"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleRecipient(rec.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold transition-colors cursor-pointer ${
                        rec.active 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {rec.active ? 'ATIVO' : 'PAUSADO'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecipient(rec.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remover destinatário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Granular alert subscriptions */}
                <div className="mt-3 pt-2.5 border-t border-slate-900 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Zero-Trust Lockdown:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRecipientSetting(rec.id, 'receiveZeroTrustLockdown')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                        rec.receiveZeroTrustLockdown ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {rec.receiveZeroTrustLockdown ? 'RECEBE' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Zap className="w-3 h-3 text-amber-400" />
                      Fraude PIX / Domicílio:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRecipientSetting(rec.id, 'receivePixTamperAlerts')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                        rec.receivePixTamperAlerts ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {rec.receivePixTamperAlerts ? 'RECEBE' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Activity className="w-3 h-3 text-cyan-400" />
                      Quebra de Caixa (Oráculo):
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRecipientSetting(rec.id, 'receiveCashAnomalyAlerts')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer ${
                        rec.receiveCashAnomalyAlerts ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800' : 'bg-slate-900 text-slate-600'
                      }`}
                    >
                      {rec.receiveCashAnomalyAlerts ? 'RECEBE' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* HSM key identifier */}
                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-400" />
                    {rec.secp256k1KeyId}
                  </span>
                  <span className="text-emerald-400">HSM Vinculado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Triggers Config */}
      {activeTab === 'triggers' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Defina quais anomalias críticas do motor ativam a transmissão de emergência via WhatsApp Business:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-slate-200">Fraude de Chave PIX</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentConfig.notifyOnPixChange}
                  onChange={(e) => onChangeConfig({ ...currentConfig, notifyOnPixChange: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Dispara quarentena e notificação instantânea quando uma alteração de domicílio bancário é recebida por canal não assinado.
              </p>
              <div className="text-[10px] font-mono text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/50">
                Ação: TRAVAMENTO IMEDIATO NO ERP
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Quebra de Caixa (Oráculo)</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentConfig.notifyOnCashBreach}
                  onChange={(e) => onChangeConfig({ ...currentConfig, notifyOnCashBreach: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Avisa o C-Level com antecedência quando as 10.000 simulações do Oráculo detectarem risco de saldo &lt; Colchão de Liquidez.
              </p>
              <div className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 p-1.5 rounded border border-cyan-900/50">
                Ação: PROPOSTA DE REPACTUAÇÃO
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Glitch Fiscal / ICMS-ST</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentConfig.notifyOnTaxGlitch}
                  onChange={(e) => onChangeConfig({ ...currentConfig, notifyOnTaxGlitch: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Notifica o CFO quando o Glitch Detector interceptar cobrança duplicada ou erro de substituição tributária &gt; R$ 10.000.
              </p>
              <div className="text-[10px] font-mono text-amber-400 bg-amber-950/40 p-1.5 rounded border border-amber-900/50">
                Ação: ESTORNO PRÉ-PAGAMENTO
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-bold text-slate-200 block">Exigir Autenticação Criptográfica HSM no Mobile</span>
                <span className="text-[10px] text-slate-400">Os botões interativos do WhatsApp exigem assinatura Secp256k1 para destravar pagamentos em quarentena.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={currentConfig.requireTwoFactorHsmAuth}
              onChange={(e) => onChangeConfig({ ...currentConfig, requireTwoFactorHsmAuth: e.target.checked })}
              className="w-4 h-4 rounded accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Tab 3: Interactive WhatsApp Simulator Preview */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Left: Explanation */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Visualização C-Level Mobile (Zero-Touch GUI)
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Experiência de Intervenção em 1 Toque via WhatsApp
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Quando uma anomalia severa é travada pelo AOS, os diretores autorizados recebem um card interativo com os detalhes do montante em risco, o hash da evidência e botões de ação instantânea sem precisar logar em nenhum portal complexo.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-300">Certificado Oficial Meta Enterprise com Green Checkmark.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--vx-neon)] shrink-0" />
                <span className="text-slate-300">Confirmação de comando vinculada à chave Secp256k1 do executivo.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerTestAlert}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Simular Envio Deste Card Agora</span>
              </button>
            </div>
          </div>

          {/* Right: Smartphone WhatsApp Preview Screen */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-slate-950 rounded-3xl border-4 border-slate-800 p-4 shadow-2xl space-y-3 font-sans">
              
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                    V
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1">
                      <span>AOS Velatrix Sentinel</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400 text-slate-950" />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">Conta Comercial Verificada</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">12:44</span>
              </div>

              {/* WhatsApp Message Bubble */}
              <div className="bg-[#1F2C34] text-slate-200 p-3.5 rounded-2xl rounded-tl-none space-y-2.5 text-xs shadow-md border border-emerald-500/30">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold font-mono text-[11px] pb-1 border-b border-slate-700/60">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>🚨 [ZERO-TRUST LOCKDOWN ATIVADO]</span>
                </div>

                <div className="space-y-1 text-[11px] leading-relaxed text-slate-300">
                  <div><strong>Empresa:</strong> Nexus Indústria & Manufatura S/A</div>
                  <div><strong>Incidente:</strong> Alteração Não Homologada de Chave PIX</div>
                  <div><strong>Fornecedor:</strong> TechCore Componentes Eletrônicos</div>
                  <div className="text-amber-300"><strong>Montante em Risco:</strong> R$ 84.500,00</div>
                  <div className="text-emerald-400 font-mono"><strong>Status do AOS:</strong> TRAVADO EM QUARENTENA (14ms)</div>
                </div>

                <div className="p-2 bg-slate-900/90 rounded-lg text-[10px] font-mono text-slate-400 space-y-0.5 border border-slate-700">
                  <div>Origem: WhatsApp Não Assinado (+55 11 99123-XXXX)</div>
                  <div>Evidência SHA: 0x3f7a1c9e8b...2c3</div>
                </div>

                {/* WhatsApp Interactive Action Buttons */}
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSimulatorAction('LOCKDOWN')}
                    className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                      simulatorActionTaken === 'LOCKDOWN'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>{simulatorActionTaken === 'LOCKDOWN' ? '✓ LOCKDOWN CONFIRMADO' : '🔒 Confirmar Lockdown & Quarentena'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatorAction('APPROVE_HSM')}
                    className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                      simulatorActionTaken === 'APPROVE_HSM'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>{simulatorActionTaken === 'APPROVE_HSM' ? '✓ ASSINADO COM HSM TOKEN' : '🛡️ Aprovar Transação com HSM'}</span>
                  </button>
                </div>

                <div className="text-[9px] text-slate-400 text-right font-mono flex items-center justify-end gap-1">
                  <span>12:44</span>
                  <span className="text-emerald-400 font-bold">✓✓</span>
                </div>
              </div>

              {/* Feedback toast inside mockup */}
              {simulatorActionTaken && (
                <div className="p-2 bg-emerald-950 border border-emerald-500/40 rounded-xl text-[10px] text-emerald-300 font-mono text-center animate-in fade-in">
                  ✓ Ação gravada no Ledger de Auditoria Imutável do AOS.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Dispatch Audit Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Registro imutável dos últimos alertas disparados para a diretoria:</span>
            <span className="font-mono text-emerald-400 text-[11px]">Webhook Latency Avg: 940ms</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Destinatário</th>
                  <th className="py-2.5 px-3">Alerta</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Latência</th>
                  <th className="py-2.5 px-3">Detalhes do Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {(currentConfig.recentDispatches || []).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 font-mono">
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                      {log.recipientName}
                      <span className="block text-[10px] text-slate-500 font-normal">{log.phone}</span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                        log.alertType === 'PIX_TAMPER_BLOCKED' || log.alertType === 'ZERO_TRUST_LOCKDOWN'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : log.alertType === 'TAX_GLITCH_CRITICAL'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                      }`}>
                        {log.alertType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded border uppercase font-bold ${
                        log.status === 'CONFIRMED_LOCKDOWN'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : log.status === 'APPROVED_HSM'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">{log.latencyMs}ms</td>
                    <td className="py-2.5 px-3 text-slate-300 text-[11px] max-w-xs truncate font-sans" title={log.payloadSnippet}>
                      {log.payloadSnippet}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add New C-Level Recipient */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[var(--vx-deep)] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">Cadastrar Novo Executivo C-Level</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRecipient} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Dra. Ana Paula Silveira"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Cargo / Papel Executivo</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-400"
                >
                  <option value="CEO (Chief Executive Officer)">CEO (Chief Executive Officer)</option>
                  <option value="CFO (Chief Financial Officer)">CFO (Chief Financial Officer)</option>
                  <option value="COO (Diretor de Operações)">COO (Diretor de Operações)</option>
                  <option value="Head de Tesouraria & Risco">Head de Tesouraria & Risco</option>
                  <option value="DPO & Compliance Officer">DPO & Compliance Officer</option>
                  <option value="Conselheiro de Governança">Conselheiro de Governança</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Número WhatsApp (com DDI/DDD)</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono text-[10px] uppercase">Chave Criptográfica HSM Secp256k1</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-400 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 font-mono hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono cursor-pointer"
                >
                  Salvar Destinatário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
