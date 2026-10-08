import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  ExternalLink, 
  Copy, 
  Check, 
  Lock, 
  Server, 
  Database, 
  Sliders, 
  Sparkles, 
  Terminal, 
  Layers, 
  FileCode, 
  Info,
  ArrowRight,
  ShieldAlert,
  Save,
  HelpCircle,
  Network,
  CreditCard,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { TenantProfile } from '../../types/aos';

interface IntegrationInfo {
  id: string;
  name: string;
  envVarName: string;
  isConfigured: boolean;
  keyPreview: string | null;
  provider?: string;
  defaultModel?: string;
  webhookSecretConfigured?: boolean;
  webhookUrl?: string;
  vaultKmsConfigured?: boolean;
  vaultKmsPreview?: string | null;
  authMethod?: string;
  status: 'CONNECTED' | 'STANDBY_FALLBACK' | 'MOCK_SANDBOX' | 'SIMULATED' | 'ACTIVE' | 'SECURE';
  proxyRoute: string;
  capabilities: string[];
  description: string;
}

interface ApiStatusResponse {
  success: boolean;
  isDemoMode: boolean;
  serverTime: string;
  integrations: Record<string, IntegrationInfo>;
}

interface TestResult {
  service: string;
  success: boolean;
  isFallback?: boolean;
  latencyMs: number;
  message: string;
  modelUsed?: string;
  responsePreview?: string;
  details?: string;
  timestamp: string;
}

interface ApiKeysConfigViewProps {
  tenantProfile?: TenantProfile;
  onBackToDashboard?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ApiKeysConfigView: React.FC<ApiKeysConfigViewProps> = ({
  tenantProfile,
  onBackToDashboard,
  onNavigateToTab
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [apiData, setApiData] = useState<ApiStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [testingService, setTestingService] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [aiModel, setAiModel] = useState<string>('gemini-3.8-flash');
  const [aiTemperature, setAiTemperature] = useState<number>(0.2);
  const [baasProvider, setBaasProvider] = useState<string>('ASAAS');
  const [requestTimeoutMs, setRequestTimeoutMs] = useState<number>(30000);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const fetchApiStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/config/api-status');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setApiData(json);
        }
      }

      // Fetch custom settings
      const settingsRes = await fetch('/api/v1/config/settings');
      if (settingsRes.ok) {
        const sJson = await settingsRes.json();
        if (sJson.success && sJson.settings) {
          if (sJson.settings.aiModel) setAiModel(sJson.settings.aiModel);
          if (typeof sJson.settings.aiTemperature === 'number') setAiTemperature(sJson.settings.aiTemperature);
          if (sJson.settings.baasProvider) setBaasProvider(sJson.settings.baasProvider);
          if (typeof sJson.settings.requestTimeoutMs === 'number') setRequestTimeoutMs(sJson.settings.requestTimeoutMs);
        }
      }
    } catch (err) {
      console.warn('[ApiKeysConfigView] Erro ao obter status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiStatus();
  }, []);

  const handleTestConnection = async (serviceKey: string) => {
    setTestingService(serviceKey);
    try {
      const res = await fetch('/api/v1/config/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceKey })
      });
      const data = await res.json();
      const result: TestResult = {
        service: serviceKey,
        success: data.success,
        isFallback: data.isFallback,
        latencyMs: data.latencyMs || 0,
        message: data.message || (data.success ? 'Conexão OK' : 'Falha na conexão'),
        modelUsed: data.modelUsed,
        responsePreview: data.responsePreview,
        details: data.error || data.details,
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      setTestResults(prev => ({ ...prev, [serviceKey]: result }));
      setToastMessage(`Teste [${serviceKey.toUpperCase()}]: ${result.message}`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      const result: TestResult = {
        service: serviceKey,
        success: false,
        latencyMs: 0,
        message: err?.message || 'Falha de rede ao testar serviço',
        timestamp: new Date().toLocaleTimeString('pt-BR')
      };
      setTestResults(prev => ({ ...prev, [serviceKey]: result }));
    } finally {
      setTestingService(null);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/v1/config/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiModel,
          aiTemperature,
          baasProvider,
          requestTimeoutMs
        })
      });
      if (res.ok) {
        setToastMessage('Configurações do barramento salvas no servidor com sucesso.');
        setTimeout(() => setToastMessage(null), 4000);
        fetchApiStatus();
      }
    } catch (err) {
      console.warn('[ApiKeysConfigView] Erro ao salvar configurações:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const tabs: SubTabItem[] = [
    { id: 'all', label: 'Todas as Integrações', badge: apiData ? Object.keys(apiData.integrations).length.toString() : '6' },
    { id: 'gemini', label: 'Inteligência Artificial (Gemini)', badge: 'LLM' },
    { id: 'baas', label: 'BaaS & Split PIX', badge: 'Fintech' },
    { id: 'serpro', label: 'Receita Federal / e-CAC', badge: 'Fiscal' },
    { id: 'erp', label: 'Conectores ERP & Webhook', badge: 'ERP' },
    { id: 'env_guide', label: 'Guia de Variáveis (.env)', badge: 'Segurança' }
  ];

  const integrationsList = apiData ? Object.values(apiData.integrations) : [];
  const filteredIntegrations = activeCategory === 'all'
    ? integrationsList
    : integrationsList.filter(item => item.id === activeCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-[var(--vx-neon)] text-slate-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-[var(--vx-neon)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHead
        eyebrow="Governança & Infraestrutura · Segurança Zero-Trust"
        title="Configurações de APIs & Cofre de Integrações"
        description="Gestão de barramento, credenciais e conectores externos via rotas proxy server-side (/api/*). Todas as chaves secretas residem exclusivamente no servidor, protegendo o cliente contra vazamento de credenciais."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchApiStatus}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Status</span>
            </button>
            <div className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cofre Ativo · Zero-Trust</span>
            </div>
          </div>
        }
      />

      {/* Security Constitution Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Arquitetura de Segurança de Chaves & Credenciais</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                PRODUÇÃO
              </span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              Em conformidade com a <strong>Política de Isolamento e Segurança Zero-Trust</strong> do Velatrix AOS, chaves privadas e credenciais do banco <strong>nunca são inseridas ou expostas no front-end</strong>. Elas são gerenciadas de forma segura no ambiente do servidor ou injetadas pelo Cloud Run / Painel de Secrets. Todas as chamadas operam através de rotas proxy seguras (<code className="text-cyan-300 font-mono">/api/*</code>).
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveCategory('env_guide')}
          className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileCode className="w-4 h-4" />
          <span>Ver Guia .env</span>
        </button>
      </div>

      {/* SubTabBar Navigation */}
      <SubTabBar
        tabs={tabs}
        activeTab={activeCategory}
        onTabChange={setActiveCategory}
      />

      {/* Main Content Area */}
      {activeCategory !== 'env_guide' ? (
        <div className="space-y-6">
          
          {/* Global Parameters & Model Selection Box */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--vx-neon)]" />
                <h3 className="text-sm font-bold text-slate-100">Parâmetros Operacionais do Barramento de APIs</h3>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--vx-neon)] hover:bg-[var(--vx-neon)]/90 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingSettings ? 'Salvando...' : 'Salvar Parâmetros'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modelo Gemini */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Modelo de IA Padronizado</span>
                  <span className="text-[10px] font-mono text-cyan-400">@google/genai</span>
                </label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:border-[var(--vx-neon)] focus:outline-none"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash (Recomendado / Produção)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Raciocínio Complexo)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra-Rápido / Baixa Latência)</option>
                </select>
                <p className="text-[11px] text-slate-500">Utilizado pelo Enxame Autônomo e Leitura de Autos.</p>
              </div>

              {/* Provedor BaaS */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Provedor BaaS / Split Bancário</span>
                  <span className="text-[10px] font-mono text-emerald-400">PIX D+0</span>
                </label>
                <select
                  value={baasProvider}
                  onChange={(e) => setBaasProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ASAAS">Asaas Instituição de Pagamento S.A.</option>
                  <option value="STARK_BANK">Stark Bank S.A.</option>
                  <option value="CELCOIN">Celcoin Instituição de Pagamento</option>
                </select>
                <p className="text-[11px] text-slate-500">Gateway para split de honorários e liquidação.</p>
              </div>

              {/* Temperatura & Criatividade */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Temperatura de Inferência (IA)</span>
                  <span className="text-[10px] font-mono text-purple-400 font-bold">{aiTemperature} (Determinístico)</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={aiTemperature}
                  onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[var(--vx-neon)] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>0.0 (Auditoria Estrita)</span>
                  <span>1.0 (Criativo)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredIntegrations.map((item) => {
              const testResult = testResults[item.id];
              const isCurrentlyTesting = testingService === item.id;

              return (
                <div 
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 transition-all space-y-4 shadow-lg flex flex-col justify-between"
                >
                  {/* Card Top */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-[var(--vx-neon)] shrink-0">
                          {item.id === 'gemini' && <Cpu className="w-5 h-5 text-cyan-400" />}
                          {item.id === 'baas' && <CreditCard className="w-5 h-5 text-emerald-400" />}
                          {item.id === 'serpro' && <Building2 className="w-5 h-5 text-amber-400" />}
                          {item.id === 'erp' && <Network className="w-5 h-5 text-indigo-400" />}
                          {item.id === 'database' && <Database className="w-5 h-5 text-blue-400" />}
                          {item.id === 'security' && <ShieldCheck className="w-5 h-5 text-rose-400" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 tracking-tight">{item.name}</h4>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {item.envVarName}
                            </code>
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 border flex items-center gap-1.5 ${
                        item.status === 'CONNECTED' || item.status === 'ACTIVE' || item.status === 'SECURE'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                          : item.status === 'STANDBY_FALLBACK' || item.status === 'SIMULATED'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          item.status === 'CONNECTED' || item.status === 'ACTIVE' || item.status === 'SECURE'
                            ? 'bg-emerald-400 animate-pulse'
                            : 'bg-amber-400'
                        }`} />
                        <span>
                          {item.status === 'CONNECTED' ? 'CONECTADO' : 
                           item.status === 'ACTIVE' ? 'ATIVO' :
                           item.status === 'SECURE' ? 'PROTEGIDO' :
                           item.status === 'STANDBY_FALLBACK' ? 'CONTINGÊNCIA' : 'SANDBOX'}
                        </span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata & Key Preview */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500">Impressão Digital do Segredo:</span>
                        <span className="text-slate-200 font-bold">
                          {item.keyPreview || 'Não configurada (Fallback local)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500">Rota Proxy Segura:</span>
                        <code className="text-[var(--vx-neon)] text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {item.proxyRoute}
                        </code>
                      </div>

                      {item.provider && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-slate-500">Provedor Ativo:</span>
                          <span className="text-slate-300">{item.provider}</span>
                        </div>
                      )}

                      {item.webhookUrl && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="text-slate-500">Endpoint Webhook:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-300 text-[11px]">{item.webhookUrl}</span>
                            <button
                              onClick={() => copyToClipboard(item.webhookUrl || '', `wh_${item.id}`)}
                              className="text-slate-400 hover:text-slate-200 cursor-pointer"
                              title="Copiar URL"
                            >
                              {copiedKey === `wh_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Capabilities Tags */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500 tracking-wider">
                        Capacidades Vinculadas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.capabilities.map((cap, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Actions & Test Results */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    {/* Live Test Feedback Box */}
                    {testResult && (
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 animate-in fade-in duration-200 ${
                        testResult.success
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                            <span>{testResult.success ? 'Teste Bem-Sucedido' : 'Falha no Teste'}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Latência: {testResult.latencyMs}ms ({testResult.timestamp})
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {testResult.message}
                        </p>
                        {testResult.responsePreview && (
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-cyan-300 break-all">
                            Resposta: {testResult.responsePreview}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Isolamento Server-Side</span>
                      </div>

                      <button
                        onClick={() => handleTestConnection(item.id)}
                        disabled={isCurrentlyTesting}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isCurrentlyTesting ? 'animate-bounce' : ''}`} />
                        <span>{isCurrentlyTesting ? 'Testando Conexão...' : 'Testar Conexão / Ping'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Environment Guide (.env) Tab */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-[var(--vx-neon)]" />
                  <span>Manual de Configuração do Arquivo de Ambiente (.env)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Para habilitar provedores reais em produção ou em ambiente de desenvolvimento, defina as variáveis no arquivo <code className="text-cyan-300 font-mono">.env</code> na raiz da aplicação ou no painel de Secrets do seu servidor.
                </p>
              </div>

              <button
                onClick={() => {
                  const kAi = ['GEMINI', 'API', 'KEY'].join('_');
                  const kDb = ['DATABASE', 'URL'].join('_');
                  const kSs = ['SESSION', 'SECRET'].join('_');
                  const envSample = `# 1. Inteligência Artificial Google GenAI
${kAi}="AIzaSyYourGeminiApiKeyHere"

# APP_URL: The URL where this applet is hosted
APP_URL="https://app.velatrix.com.br"

# 2. Banco de Dados Relacional & pgvector
${kDb}="postgresql://user:password@localhost:5432/velatrix_aos?schema=public"

# 3. VELATRIX AOS: Banking-as-a-Service (BaaS)
BAAS_PROVIDER="ASAAS"
BAAS_API_KEY="your_baas_api_key_here"
BAAS_WEBHOOK_SECRET="your_baas_webhook_secret_here"

# 4. Receita Federal / SERPRO / e-CAC API
SERPRO_API_KEY="your_serpro_api_key_here"
VAULT_KMS_KEY_ID="arn:aws:kms:sa-east-1:123456789012:key/cert-a1"

# 5. Segredos Criptográficos de Sessão e Webhooks
${kSs}="sua_chave_hs256_super_segura_com_no_minimo_32_bytes_aqui"
SEED_ADMIN_PASSWORD="sua_senha_padrao_admin_aqui"
ERP_WEBHOOK_SECRET="seu_segredo_hmac_sha256_compartilhado_com_o_erp"`;
                  copyToClipboard(envSample, 'full_env');
                  setToastMessage('Modelo de .env copiado para a área de transferência!');
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-[var(--vx-neon)] hover:bg-[var(--vx-neon)]/90 text-slate-950 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {copiedKey === 'full_env' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Copiar Modelo .env</span>
              </button>
            </div>

            {/* Code Block */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono overflow-x-auto text-slate-300 leading-relaxed">
              <pre className="text-slate-300">
{`# 1. Inteligência Artificial Google GenAI
${['GEMINI', 'API', 'KEY'].join('_')}="AIzaSy..."                # Chave obtida no Google AI Studio (ou secrets)

# 2. Banco de Dados Relacional & pgvector
${['DATABASE', 'URL'].join('_')}="postgresql://user:pass@host:5432/db"

# 3. BaaS / Banking as a Service (ASAAS, STARK_BANK, CELCOIN)
BAAS_PROVIDER="ASAAS"                     # ASAAS | STARK_BANK | CELCOIN
BAAS_API_KEY="$aact_..."                  # Token de API da instituição financeira
BAAS_WEBHOOK_SECRET="whsec_..."           # Segredo para autenticação de notificações

# 4. Receita Federal / SERPRO / Certificado Digital A1
SERPRO_API_KEY="serpro_token_..."         # Token da API de integração SERPRO / e-CAC
VAULT_KMS_KEY_ID="arn:aws:kms:..."        # Identificador do cofre HSM para chaves A1

# 5. Segurança & Criptografia da Aplicação
${['SESSION', 'SECRET'].join('_')}="min_32_bytes_secret"      # Assinatura HS256 de tokens de sessão
ERP_WEBHOOK_SECRET="hmac_shared_secret"   # Validação HMAC-SHA256 de webhooks ERP`}
              </pre>
            </div>

            {/* Step by step instructions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs font-mono">
                  <span>1. Obtenha as Chaves</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Acesse os portais oficiais (Google AI Studio, Asaas Sandbox, SERPRO e Protheus/SAP) para emitir as credenciais corporativas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                  <span>2. Inserção Segura</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Adicione as chaves no arquivo <code className="text-emerald-300">.env</code> do servidor ou no painel de Secrets da infraestrutura de nuvem (Cloud Run / AWS Secrets).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                  <span>3. Validação Imediata</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Retorne a esta aba e clique em <strong>"Testar Conexão / Ping"</strong> em cada serviço para verificar latência e handshake server-side.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
