import React, { useState, useEffect } from 'react';
import { 
  Cable, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  Copy, 
  Check, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw, 
  ExternalLink, 
  Terminal, 
  Layers, 
  Cpu, 
  Building2,
  Sliders,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authFetch as fetch } from '../../services/authClient';

export interface ErpConnectionData {
  id: string;
  tenantId: string;
  provider: 'TOTVS' | 'SAP' | 'CUSTOM';
  baseUrl: string;
  authType: 'API_KEY' | 'OAUTH2' | 'HMAC_SIGNATURE';
  credentialRef: string;
  webhookSecretHash: string;
  status: 'ATIVO' | 'PENDENTE' | 'ERRO';
  lastSyncAt: string | null;
  hasCredential?: boolean;
  hasWebhookSecret?: boolean;
}

export interface ErpEventLogItem {
  id: string;
  tenantId: string;
  provider: string;
  direction: 'INBOUND' | 'OUTBOUND';
  eventType?: string | null;
  rawPayload: any;
  normalizedPayload?: any | null;
  status: 'RECEBIDO' | 'PROCESSADO' | 'ERRO';
  errorMessage?: string | null;
  attempts: number;
  lastAttemptAt: string;
  ledgerHash?: string | null;
  createdAt: string;
}

export const ErpConnectionManagerPanel: React.FC = () => {
  const { tenantsList, activeTenant } = useAuth();

  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenant.id);
  const [connection, setConnection] = useState<ErpConnectionData | null>(null);
  const [eventLogs, setEventLogs] = useState<ErpEventLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Form inputs
  const [provider, setProvider] = useState<'TOTVS' | 'SAP' | 'CUSTOM'>('TOTVS');
  const [baseUrl, setBaseUrl] = useState<string>('https://protheus.empresa.com.br/api/v1');
  const [authType, setAuthType] = useState<'API_KEY' | 'OAUTH2' | 'HMAC_SIGNATURE'>('HMAC_SIGNATURE');
  const [credentialRefAlias, setCredentialRefAlias] = useState<string>('');
  const [authSecretInput, setAuthSecretInput] = useState<string>('');
  const [webhookSecretInput, setWebhookSecretInput] = useState<string>('');
  const [connStatus, setConnStatus] = useState<'ATIVO' | 'PENDENTE' | 'ERRO'>('ATIVO');

  // Test states
  const [testingInbound, setTestingInbound] = useState<boolean>(false);
  const [testingInvalidHmac, setTestingInvalidHmac] = useState<boolean>(false);
  const [testingOutbound, setTestingOutbound] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'ERRO'>('ALL');

  const selectedTenantObj = tenantsList.find(t => t.id === selectedTenantId) || activeTenant;

  const fetchConnectionAndLogs = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      // 1. Fetch connection for tenant
      const connRes = await fetch(`/api/v1/erp/connections/${selectedTenantId}`);
      if (connRes.ok) {
        const connJson = await connRes.json();
        if (connJson.data) {
          const c: ErpConnectionData = connJson.data;
          setConnection(c);
          setProvider(c.provider);
          setBaseUrl(c.baseUrl);
          setAuthType(c.authType);
          setCredentialRefAlias(c.credentialRef);
          setConnStatus(c.status);
          // Notice: authSecretInput and webhookSecretInput are never populated from server (security mandate)
          setAuthSecretInput('');
          setWebhookSecretInput('');
        } else {
          setConnection(null);
          setBaseUrl(selectedTenantObj.connectedErp.includes('SAP') 
            ? 'https://s4hana.empresa.com.br/sap/bc/rest' 
            : 'https://protheus.empresa.com.br/api/v1');
          setProvider(selectedTenantObj.connectedErp.includes('SAP') ? 'SAP' : 'TOTVS');
          setConnStatus('PENDENTE');
        }
      }

      // 2. Fetch event logs
      const logsRes = await fetch(`/api/v1/erp/events/logs?tenantId=${selectedTenantId}&limit=50`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setEventLogs(logsJson.data || []);
      }
    } catch (err: any) {
      console.error('Falha ao carregar conexão ERP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectionAndLogs();
  }, [selectedTenantId]);

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/v1/erp/connections/${selectedTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          baseUrl,
          authType,
          credentialRefAlias: credentialRefAlias || undefined,
          authSecret: authSecretInput || undefined,
          webhookSecret: webhookSecretInput || undefined,
          status: connStatus,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: 'success',
          text: 'Conexão ERP salva com sucesso! O segredo foi armazenado em cofre seguro e hash criptográfico gerado.'
        });
        setAuthSecretInput('');
        setWebhookSecretInput('');
        await fetchConnectionAndLogs();
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Falha ao salvar configuração ERP.'
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Erro de comunicação ao salvar conexão ERP.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Helper for computing HMAC client-side for test simulation
  async function computeClientHmac(key: string, message: string): Promise<string> {
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const msgData = enc.encode(message);
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // 1. Test Inbound Webhook with Valid HMAC
  const handleTestValidInbound = async () => {
    setTestingInbound(true);
    setTestResult(null);

    try {
      const testPayload = {
        evento: 'DIVERGENCIA_ICMS_ST_TEST',
        numDoc: `NF-${Date.now().toString().slice(-5)}`,
        filial: '0101',
        ufOrigem: 'SP',
        ufDestino: 'MG',
        valorTotal: 65400.00,
        categoria: 'Fiscal',
        descricao: 'Teste Inbound Webhook validado por assinatura HMAC-SHA256',
        timestamp: new Date().toISOString(),
      };

      const rawBody = JSON.stringify(testPayload);
      
      // If user typed secret in the input, use it; otherwise compute against runtime test key
      const secretToUse = webhookSecretInput || 'velatrix-secret-hmac-test-key';
      
      // First ensure the server has the test secret saved if not already configured
      if (!connection?.hasWebhookSecret && !webhookSecretInput) {
        await fetch(`/api/v1/erp/connections/${selectedTenantId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            baseUrl,
            authType,
            webhookSecret: secretToUse,
            status: 'ATIVO'
          })
        });
      }

      const hmacSignature = await computeClientHmac(secretToUse, rawBody);

      const res = await fetch(`/api/v1/erp/events/ingest/${selectedTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': hmacSignature,
          'x-erp-signature': `sha256=${hmacSignature}`
        },
        body: rawBody
      });

      const data = await res.json();
      setTestResult({
        type: 'INBOUND_VALID',
        status: res.status,
        ok: res.ok,
        data,
      });

      // Refresh event logs
      const logsRes = await fetch(`/api/v1/erp/events/logs?tenantId=${selectedTenantId}&limit=50`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setEventLogs(logsJson.data || []);
      }
    } catch (err: any) {
      setTestResult({
        type: 'INBOUND_VALID',
        status: 500,
        ok: false,
        error: err?.message
      });
    } finally {
      setTestingInbound(false);
    }
  };

  // 2. Test Inbound Webhook with Invalid HMAC (Expect 401)
  const handleTestInvalidHmac = async () => {
    setTestingInvalidHmac(true);
    setTestResult(null);

    try {
      const testPayload = {
        evento: 'TENTATIVA_FORJADA_INVALIDA',
        numDoc: 'FRAUD-001',
        valorTotal: 999999.00,
      };

      const res = await fetch(`/api/v1/erp/events/ingest/${selectedTenantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': '0000000000000000000000000000000000000000000000000000000000000000', // Invalid fake hash
        },
        body: JSON.stringify(testPayload)
      });

      const data = await res.json();
      setTestResult({
        type: 'INBOUND_INVALID',
        status: res.status,
        expected401: res.status === 401,
        ok: res.status === 401,
        data,
      });

      // Refresh event logs
      const logsRes = await fetch(`/api/v1/erp/events/logs?tenantId=${selectedTenantId}&limit=50`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setEventLogs(logsJson.data || []);
      }
    } catch (err: any) {
      setTestResult({
        type: 'INBOUND_INVALID',
        status: 500,
        ok: false,
        error: err?.message
      });
    } finally {
      setTestingInvalidHmac(false);
    }
  };

  // 3. Test Outbound Dispatch
  const handleTestOutbound = async () => {
    setTestingOutbound(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/v1/erp/outbound/test/${selectedTenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: {
            evento: 'TESTE_SINC_STATUS_VELATRIX',
            status: 'CONFORME',
            economiaGeradaBrl: 45200.50,
            timestamp: new Date().toISOString()
          },
          endpointPath: '/status'
        })
      });

      const data = await res.json();
      setTestResult({
        type: 'OUTBOUND',
        status: res.status,
        ok: res.ok && data.success,
        data,
      });

      // Refresh logs
      const logsRes = await fetch(`/api/v1/erp/events/logs?tenantId=${selectedTenantId}&limit=50`);
      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setEventLogs(logsJson.data || []);
      }
    } catch (err: any) {
      setTestResult({
        type: 'OUTBOUND',
        status: 500,
        ok: false,
        error: err?.message
      });
    } finally {
      setTestingOutbound(false);
    }
  };

  // 4. Retry Dead-Letter Event
  const handleRetryEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/v1/erp/events/${eventId}/retry`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({
          type: 'success',
          text: `Evento '${eventId}' reprocessado com sucesso! Atualizado no Ledger com novo bloco SHA-256.`
        });
        // Refresh event logs
        const logsRes = await fetch(`/api/v1/erp/events/logs?tenantId=${selectedTenantId}&limit=50`);
        if (logsRes.ok) {
          const logsJson = await logsRes.json();
          setEventLogs(logsJson.data || []);
        }
      } else {
        setActionMessage({
          type: 'error',
          text: data.error || 'Falha ao reprocessar evento.'
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Erro de comunicação ao reprocessar evento.'
      });
    }
  };

  const inboundWebhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/v1/erp/events/ingest/${selectedTenantId}`
    : `/api/v1/erp/events/ingest/${selectedTenantId}`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(inboundWebhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const filteredLogs = eventLogs.filter(log => {
    if (logFilter === 'INBOUND') return log.direction === 'INBOUND';
    if (logFilter === 'OUTBOUND') return log.direction === 'OUTBOUND';
    if (logFilter === 'ERRO') return log.status === 'ERRO';
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner & Multi-Tenant Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
            <Cable className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Conectores ERP & Webhooks Multi-Tenant
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PRODUÇÃO
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie integrações bidirecionais com TOTVS Protheus, SAP S/4HANA e REST Customizado com validação HMAC.
            </p>
          </div>
        </div>

        {/* Tenant Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            Tenant:
          </span>
          <select
            value={selectedTenantId}
            onChange={(e) => setSelectedTenantId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
          >
            {tenantsList.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.cnpj})
              </option>
            ))}
          </select>

          <button
            onClick={fetchConnectionAndLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Recarregar dados do tenant"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Security Disclaimer */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200 space-y-1">
          <p className="font-semibold text-emerald-300">
            Segurança de Credenciais por Alçada (Secret Vault & Variáveis de Ambiente)
          </p>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            As credenciais reais (API keys, client secrets, tokens) <span className="text-emerald-300 font-bold">NUNCA são persistidas em texto puro no banco</span> de dados. 
            O banco retém apenas referências seguras e o hash SHA-256 do segredo de webhook para conferência HMAC. 
            O preenchimento é de responsabilidade exclusiva do administrador do tenant.
          </p>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
          actionMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Form & Live Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Connection Form (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">
                Configuração do Conector ERP
              </h3>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                connection?.status === 'ATIVO' ? 'bg-emerald-400 animate-pulse' :
                connection?.status === 'ERRO' ? 'bg-rose-400' : 'bg-amber-400'
              }`} />
              <span className={`text-[11px] font-mono font-bold ${
                connection?.status === 'ATIVO' ? 'text-emerald-400' :
                connection?.status === 'ERRO' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {connection?.status || 'PENDENTE'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveConnection} className="space-y-4">
            {/* Provider & AuthType */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Provedor ERP
                </label>
                <select
                  value={provider}
                  onChange={(e: any) => setProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="TOTVS">TOTVS (Protheus / RM / Datasul)</option>
                  <option value="SAP">SAP (S/4HANA / ECC / B1)</option>
                  <option value="CUSTOM">Custom REST (Senior / Sankhya / Outro)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tipo de Autenticação
                </label>
                <select
                  value={authType}
                  onChange={(e: any) => setAuthType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="HMAC_SIGNATURE">Assinatura HMAC-SHA256 (Recomendado)</option>
                  <option value="API_KEY">API Key / Token de Cabeçalho</option>
                  <option value="OAUTH2">OAuth2 Bearer Token</option>
                </select>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Base URL do ERP (Endpoint de Chamada Outbound)
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://erp.empresa.com.br/api/v1"
                required
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Credential Alias / Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Alias de Referência no Cofre (CredentialRef)</span>
                <span className="text-[10px] text-slate-500 font-normal">Nunca o valor puro</span>
              </label>
              <input
                type="text"
                value={credentialRefAlias}
                onChange={(e) => setCredentialRefAlias(e.target.value)}
                placeholder={`ERP_SECRET_REF_${selectedTenantId.toUpperCase()}`}
                className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-xs font-mono rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Auth Secret (Input Password - Never displayed back) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Chave de Autenticação / API Key / Client Secret</span>
                {connection?.hasCredential && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Credencial configurada no cofre
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={authSecretInput}
                  onChange={(e) => setAuthSecretInput(e.target.value)}
                  placeholder={connection?.hasCredential 
                    ? "•••••••••••••••••••••••• (Preencha apenas para alterar)" 
                    : "Insira a chave/token da API do ERP"}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-cyan-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Webhook Secret (HMAC SHA-256) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Segredo Compartilhado Webhook (Assinatura HMAC-SHA256)</span>
                {connection?.webhookSecretHash && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Hash: {connection.webhookSecretHash.slice(0, 12)}...
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={webhookSecretInput}
                  onChange={(e) => setWebhookSecretInput(e.target.value)}
                  placeholder={connection?.hasWebhookSecret 
                    ? "•••••••••••••••••••••••• (Preencha apenas para alterar)" 
                    : "Insira o segredo compartilhado para validação HMAC"}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono rounded-xl px-3 py-2.5 pr-10 focus:outline-none focus:border-cyan-500"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Status Selector */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status Operacional da Conexão
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ATIVO', 'PENDENTE', 'ERRO'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setConnStatus(st)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      connStatus === st
                        ? st === 'ATIVO' 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : st === 'PENDENTE'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gravando no Cofre...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Salvar Conexão ERP com Cofre Seguro</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Inbound Webhook Specs & Live Test Bench (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Inbound Webhook URL Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Inbound Webhook (Entrada ERP)</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Configure o webhook de saída no seu Protheus ou SAP para disparar eventos para este endpoint:
            </p>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-cyan-300 break-all select-all">
                {inboundWebhookUrl}
              </code>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 cursor-pointer"
                title="Copiar URL do Webhook"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-slate-300 font-bold">Cabeçalhos Obrigatórios:</div>
              <div><span className="text-cyan-400">Content-Type:</span> application/json</div>
              <div><span className="text-cyan-400">x-signature:</span> &lt;HMAC-SHA256(body, secret)&gt;</div>
            </div>
          </div>

          {/* Interactive Test Suite */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Bateria de Testes em Tempo Real</span>
            </div>

            <div className="space-y-2">
              {/* Button 1: Valid Inbound */}
              <button
                type="button"
                onClick={handleTestValidInbound}
                disabled={testingInbound}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 text-xs font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>1. Testar Ingest HMAC Válido</div>
                    <div className="text-[10px] text-slate-400 font-normal">Valida assinatura e grava no Ledger</div>
                  </div>
                </div>
                <Send className={`w-4 h-4 text-emerald-400 ${testingInbound ? 'animate-pulse' : 'group-hover:translate-x-0.5 transition-transform'}`} />
              </button>

              {/* Button 2: Invalid Inbound (Expect 401) */}
              <button
                type="button"
                onClick={handleTestInvalidHmac}
                disabled={testingInvalidHmac}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-rose-500/30 hover:border-rose-500/60 text-slate-200 text-xs font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>2. Testar Rejeição HMAC Inválido</div>
                    <div className="text-[10px] text-slate-400 font-normal">Confirma rejeição estrita com HTTP 401</div>
                  </div>
                </div>
                <Send className={`w-4 h-4 text-rose-400 ${testingInvalidHmac ? 'animate-pulse' : 'group-hover:translate-x-0.5 transition-transform'}`} />
              </button>

              {/* Button 3: Outbound Client Test */}
              <button
                type="button"
                onClick={handleTestOutbound}
                disabled={testingOutbound}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/60 text-slate-200 text-xs font-semibold transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div>3. Testar Despacho Outbound (3 Retries)</div>
                    <div className="text-[10px] text-slate-400 font-normal">Backoff exponencial & timeout de 10s</div>
                  </div>
                </div>
                <Send className={`w-4 h-4 text-cyan-400 ${testingOutbound ? 'animate-pulse' : 'group-hover:translate-x-0.5 transition-transform'}`} />
              </button>
            </div>

            {/* Test Results Output */}
            {testResult && (
              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">
                    Resultado: {testResult.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    testResult.ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    HTTP {testResult.status} {testResult.ok ? 'SUCCESS' : 'FAIL'}
                  </span>
                </div>
                <pre className="text-slate-400 overflow-x-auto max-h-40 p-2 bg-black/40 rounded">
                  {JSON.stringify(testResult.data || testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dead-Letter Queue & ERP Event Audit Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Trilha de Auditoria ERP & Dead-Letter Queue (DLQ)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
              {filteredLogs.length} eventos
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'INBOUND', 'OUTBOUND', 'ERRO'] as const).map(f => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  logFilter === f
                    ? f === 'ERRO'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
                }`}
              >
                {f === 'ALL' ? 'Todos' : f === 'INBOUND' ? 'Inbound' : f === 'OUTBOUND' ? 'Outbound' : 'Dead-Letter (Erros)'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <th className="pb-3 px-3">Data / Hora</th>
                <th className="pb-3 px-3">Direção</th>
                <th className="pb-3 px-3">Provedor</th>
                <th className="pb-3 px-3">Evento / Título</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Tentativas</th>
                <th className="pb-3 px-3">Ledger Hash</th>
                <th className="pb-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans text-xs">
                    Nenhum evento registrado com o filtro selecionado. Realize um teste de ingest ou outbound acima.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.direction === 'INBOUND'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                          : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                      }`}>
                        {log.direction === 'INBOUND' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {log.direction}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-semibold">
                      {log.provider}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200 max-w-[220px] truncate">
                      {log.eventType || log.rawPayload?.title || log.rawPayload?.evento || 'Transação ERP'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === 'PROCESSADO'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : log.status === 'RECEBIDO'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.status === 'PROCESSADO' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === 'ERRO' && <AlertTriangle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {log.attempts}x
                    </td>
                    <td className="py-3 px-3 text-[10px] text-slate-400 truncate max-w-[120px]">
                      {log.ledgerHash ? log.ledgerHash.slice(0, 10) + '...' : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      {log.status === 'ERRO' ? (
                        <button
                          type="button"
                          onClick={() => handleRetryEvent(log.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Reprocessar evento através da Dead-Letter Queue"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry DLQ</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">Conforme</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
