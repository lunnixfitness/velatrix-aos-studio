import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  Plus, 
  Terminal, 
  CheckCircle2, 
  Play, 
  Pause, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  AlertTriangle, 
  Code2, 
  Layers, 
  ArrowRight, 
  Server, 
  Sliders, 
  Clock,
  Eye,
  Check,
  Smartphone
} from 'lucide-react';
import { TenantProfile, AuditRecord } from '../../types/aos';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { PartnerPortfolioService } from '../../services/partnerPortfolioService';
import { PartnerPortfolioScopeSelector } from '../common/PartnerPortfolioScopeSelector';
import { secureId } from '../../lib/demoMode';

export interface CustomAgentRule {
  id: string;
  name: string;
  naturalLanguagePrompt: string;
  domain: 'TESOURARIA' | 'FISCAL' | 'LOGISTICA' | 'COMERCIAL' | 'SUPRIMENTOS';
  actionType: 'BLOCK_ERP' | 'WHATSAPP_ALERT' | 'MULTISIG_QUORUM' | 'AUTO_CORRECTION';
  compiledInvariant: string;
  status: 'ACTIVE' | 'PAUSED';
  latencyMs: number;
  triggerCount: number;
  createdAt: string;
}

const INITIAL_CUSTOM_AGENTS: CustomAgentRule[] = [
  {
    id: 'agent_pix_unapproved',
    name: 'Guardião de PIX Não Homologado',
    naturalLanguagePrompt: 'Bloquear transações PIX acima de R$ 10.000 se a chave PIX ou CNPJ de destino não constar no cadastro de fornecedores aprovados do SAP S/4HANA.',
    domain: 'TESOURARIA',
    actionType: 'BLOCK_ERP',
    compiledInvariant: 'ASSERT (tx.amount <= 10000.00 OR isHomologatedVendor(tx.pixKey, erp.vendor_master)) ELSE TRIGGER_QUARANTINE',
    status: 'ACTIVE',
    latencyMs: 14,
    triggerCount: 8,
    createdAt: 'Hoje às 09:15'
  },
  {
    id: 'agent_overdue_invoicing',
    name: 'Trava de Faturamento por Inadimplência',
    naturalLanguagePrompt: 'Suspender emissão de novos pedidos e faturamento de clientes com títulos em aberto vencidos há mais de 15 dias ou limite Serasa estourado.',
    domain: 'COMERCIAL',
    actionType: 'BLOCK_ERP',
    compiledInvariant: 'ASSERT (customer.overdueDays <= 15 AND customer.creditUsed <= customer.creditLimit) ELSE HOLD_SALES_ORDER',
    status: 'ACTIVE',
    latencyMs: 18,
    triggerCount: 23,
    createdAt: 'Ontem às 16:40'
  },
  {
    id: 'agent_discount_multisig',
    name: 'Inspetor de Margem & Alçada de Desconto',
    naturalLanguagePrompt: 'Exigir aprovação de 2 diretores via WhatsApp se o desconto comercial concedido em tabela for superior a 18% para clientes da Curva B/C.',
    domain: 'COMERCIAL',
    actionType: 'MULTISIG_QUORUM',
    compiledInvariant: 'IF (order.discountPct > 18.0 AND customer.tier IN ["B", "C"]) REQUIRE_QUORUM(directors, 2)',
    status: 'ACTIVE',
    latencyMs: 22,
    triggerCount: 5,
    createdAt: '2026-08-20'
  }
];

const SUGGESTED_TEMPLATES = [
  {
    title: 'Bloqueio de PIX Suspeito',
    prompt: 'Bloquear transferências PIX acima de R$ 15.000 fora do horário comercial (18h às 06h) sem confirmação biométrica do CFO.',
    domain: 'TESOURARIA' as const,
    action: 'MULTISIG_QUORUM' as const
  },
  {
    title: 'Conferência de Canhoto e GPS',
    prompt: 'Rejeitar baixa de entrega se a coordenada GPS do caminhão no momento da assinatura do canhoto divergir mais de 500m do endereço da NF-e.',
    domain: 'LOGISTICA' as const,
    action: 'BLOCK_ERP' as const
  },
  {
    title: 'Duplicidade de Notas em D+0',
    prompt: 'Alertar imediatamente se duas notas fiscais de serviços com o mesmo valor e descrição forem emitidas no mesmo dia para CNPJs distintos.',
    domain: 'FISCAL' as const,
    action: 'WHATSAPP_ALERT' as const
  }
];

interface ConstructLabPanelProps {
  tenantProfile: TenantProfile;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const ConstructLabPanel: React.FC<ConstructLabPanelProps> = ({
  tenantProfile,
  onAddAuditRecord
}) => {
  const [agentsList, setAgentsList] = useState<CustomAgentRule[]>(INITIAL_CUSTOM_AGENTS);
  const [promptInput, setPromptInput] = useState<string>('');
  const [agentNameInput, setAgentNameInput] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<'TESOURARIA' | 'FISCAL' | 'LOGISTICA' | 'COMERCIAL' | 'SUPRIMENTOS'>('TESOURARIA');
  const [selectedAction, setSelectedAction] = useState<'BLOCK_ERP' | 'WHATSAPP_ALERT' | 'MULTISIG_QUORUM' | 'AUTO_CORRECTION'>('BLOCK_ERP');
  
  // Compilation multi-stage state
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [compilationStage, setCompilationStage] = useState<number>(0);
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const compilationSteps = [
    '1. Interpretando Intenção em Linguagem Natural (NLP & Semantic AST)',
    '2. Validando Invariantes Matemáticas & Regras de Conformidade BACEN/ERP',
    '3. Compilando Bytecode Seguro de Verificação em Tempo Real (WASM/Rust)',
    '4. Implantando Agente Autônomo no Enxame Mesh (300 Nós Ativos)'
  ];

  const handleTrainAgent = () => {
    if (!promptInput.trim()) return;

    const finalName = agentNameInput.trim() || `Agente ${selectedDomain} #${Math.floor(Math.random() * 900 + 100)}`;
    setIsCompiling(true);
    setCompilationStage(1);

    setTimeout(() => setCompilationStage(2), 600);
    setTimeout(() => setCompilationStage(3), 1200);
    setTimeout(() => setCompilationStage(4), 1800);

    setTimeout(() => {
      const newAgent: CustomAgentRule = {
        id: `agent_${Date.now()}`,
        name: finalName,
        naturalLanguagePrompt: promptInput,
        domain: selectedDomain,
        actionType: selectedAction,
        compiledInvariant: `ASSERT (evalRule('${promptInput.substring(0, 35)}...')) ELSE EXECUTE_${selectedAction}`,
        status: 'ACTIVE',
        latencyMs: Math.floor(Math.random() * 10 + 12),
        triggerCount: 0,
        createdAt: 'Agora mesmo'
      };

      setAgentsList(prev => [newAgent, ...prev]);

      if (onAddAuditRecord) {
        const auditHash = `0x${secureId('', 4)}${secureId('', 4)}`;
        onAddAuditRecord({
          id: `rec_construct_deploy_${newAgent.id}_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_construct_${newAgent.id}`,
          eventTitle: `[CONSTRUCT LAB] Novo Agente Treinado: ${finalName}`,
          sector: tenantProfile.sector,
          jurisdiction: 'BR',
          agentsInvolved: ['Construct Lab AST Compiler', 'Enxame Orchestrator', finalName, 'WASM Bytecode Runtime'],
          decisionSummary: `Novo agente autônomo compilado via No-Code Studio. Regra em linguagem natural: "${promptInput.slice(0, 140)}...". Compilação WASM verificada e implantada nos 300 nós do Enxame.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Implantação do agente ${finalName} no domínio ${selectedDomain} com ação ${selectedAction}.`,
            kpis: [
              { label: 'Latência Bytecode', value: `${newAgent.latencyMs}ms`, impact: 'positive' },
              { label: 'Nós do Enxame', value: '300 Ativos', impact: 'positive' }
            ],
            invariants_checked: [
              'NLP_AST_Validation = OK',
              'Mathematical_Invariants_Sanity = OK',
              'Bytecode_WASM_Compiled = OK'
            ],
            audit_hash: auditHash
          },
          status: 'executed',
          requiredSignatures: 1,
          signatures: [
            { role: 'Construct Lab Compiler', keyId: 'secp256k1::0xCONSTRUCT_LAB_WASM', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-CONSTRUCT-DEPLOY-${newAgent.id.toUpperCase()}`,
          invariantSnapshot: ['NLP_AST_Validation', 'Mathematical_Invariants_Sanity', 'WASM_Runtime_Deploy']
        });
      }

      setIsCompiling(false);
      setCompilationStage(0);
      setPromptInput('');
      setAgentNameInput('');
      setTestNotification(`✓ Agente "${finalName}" treinado e implantado com sucesso no Enxame!`);

      // Dispara Gatilho Automático de Split por Entrega de Agente Operacional
      const activeClient = PartnerPortfolioService.getActiveClient();
      PartnerPortfolioService.triggerAutomatedSplitEvent({
        milestoneKey: 'AUDITORIA_CRUZADA',
        cnpj: activeClient.cnpj,
        companyName: activeClient.companyName,
        creditAmount: 480000,
        caseId: `CONST-${newAgent.id.toUpperCase().slice(-6)}`,
        caseTitle: `Construct Lab: ${finalName} (${activeClient.companyName})`,
        triggerSourceModule: 'Construct Lab (Agent Training Lab)',
        notes: `Agente operacional autônomo treinado no domínio ${selectedDomain} com ação ${selectedAction} implantado no Enxame.`
      });

      setTimeout(() => setTestNotification(null), 4000);
    }, 2400);
  };

  const handleToggleAgentStatus = (id: string) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
      }
      return a;
    }));
  };

  const handleDeleteAgent = (id: string) => {
    setAgentsList(prev => prev.filter(a => a.id !== id));
  };

  const handleSimulateTestRun = (agent: CustomAgentRule) => {
    setAgentsList(prev => prev.map(a => {
      if (a.id === agent.id) {
        return { ...a, triggerCount: a.triggerCount + 1 };
      }
      return a;
    }));

    if (onAddAuditRecord) {
      const hash = `0x${secureId('', 4)}${secureId('', 4)}`;
      const isBlock = agent.actionType === 'BLOCK_ERP';
      onAddAuditRecord({
        id: `rec_agent_trigger_${agent.id}_${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventId: `evt_trigger_${agent.id}`,
        eventTitle: `[DISPARO DE AGENTE] Execução do Agente "${agent.name}"`,
        sector: tenantProfile.sector,
        jurisdiction: 'BR',
        agentsInvolved: [agent.name, 'Enxame Orchestrator', 'ERP Gateway'],
        decisionSummary: `Agente "${agent.name}" interceptou evento operacional e executou "${agent.actionType}" em ${agent.latencyMs}ms. Regra acionada: "${agent.naturalLanguagePrompt}".`,
        decisionAst: {
          ui_type: 'CriticalDecisionCard',
          priority: isBlock ? 'Critical' : 'Medium',
          summary: `Disparo autônomo do agente ${agent.name} no domínio ${agent.domain}.`,
          kpis: [
            { label: 'Tempo de Resposta', value: `${agent.latencyMs}ms`, impact: 'positive' },
            { label: 'Disparos Acumulados', value: `${agent.triggerCount + 1}`, impact: 'positive' }
          ],
          invariants_checked: ['Regra_Agente_Construct = EXECUTADA', 'ERP_Dispatched = OK'],
          audit_hash: hash
        },
        status: isBlock ? 'blocked_fraud' : 'executed',
        requiredSignatures: 1,
        signatures: [
          { role: `${agent.name} Node`, keyId: `secp256k1::0xAGENT_${agent.id.slice(-4)}`, signedAt: new Date().toISOString(), verified: true }
        ],
        executionReceipt: `TX-TRIGGER-${agent.id.toUpperCase()}-${Date.now().toString().slice(-4)}`,
        invariantSnapshot: ['Regra_Agente_Construct', 'ERP_Dispatched']
      });
    }

    setTestNotification(`⚡ [Simulação de Teste] Agente "${agent.name}" interceptou evento e executou ${agent.actionType} em ${agent.latencyMs}ms!`);
    setTimeout(() => setTestNotification(null), 4000);
  };

  const handleUseTemplate = (tpl: typeof SUGGESTED_TEMPLATES[0]) => {
    setPromptInput(tpl.prompt);
    setAgentNameInput(`Guardião: ${tpl.title}`);
    setSelectedDomain(tpl.domain);
    setSelectedAction(tpl.action);
  };

  return (
    <div id="construct-lab-panel" className="space-y-6 animate-in fade-in duration-300">
      
      {/* Scope Selector com RLS por Carteira de Parceiro */}
      <PartnerPortfolioScopeSelector 
        moduleName="Construct Lab (Agent Training Studio)"
        currentCnpj={tenantProfile.cnpj}
      />

      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-[var(--vx-deep)] to-slate-950 border border-purple-500/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
              No-Code Agent Training Studio
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Zero-Shot Compiler
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-purple-400 animate-pulse" />
            <span>Construct Lab (Agent Training Lab)</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-3xl">
            Crie e treine novos agentes de defesa operacional descrevendo regras de negócio em português natural. O compilador converte seu texto em invariantes determinísticas e as implanta no Enxame em tempo real.
          </p>
        </div>
      </div>

      {/* Notification Banner */}
      {testNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testNotification}</span>
          </div>
          <button onClick={() => setTestNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Two Column Layout: Agent Builder Form (Left) & Active Trained Agents (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: TRAINING STUDIO FORM (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[var(--vx-deep)] border border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Treinar Novo Agente Autônomo</span>
              </h2>
              <span className="text-[10px] font-mono text-purple-400">NL ➔ AST</span>
            </div>

            {/* Quick Templates */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                Templates de Regras Prontas (1-Clique):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleUseTemplate(tpl)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-slate-300 transition-all cursor-pointer"
                  >
                    + {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Agent Name Input */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Nome do Agente
              </label>
              <input
                type="text"
                value={agentNameInput}
                onChange={(e) => setAgentNameInput(e.target.value)}
                placeholder="Ex: Guardião de PIX Não Homologado..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Domain & Action Selectors */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Domínio / Área
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="TESOURARIA">Tesouraria & PIX</option>
                  <option value="FISCAL">Fiscal & NF-e</option>
                  <option value="LOGISTICA">Logística & Frota</option>
                  <option value="COMERCIAL">Comercial & Vendas</option>
                  <option value="SUPRIMENTOS">Suprimentos & Compras</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                  Ação ao Violar
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="BLOCK_ERP">Bloqueio Preventivo ERP</option>
                  <option value="WHATSAPP_ALERT">Alerta Push WhatsApp</option>
                  <option value="MULTISIG_QUORUM">Quórum Multi-Sig C-Level</option>
                  <option value="AUTO_CORRECTION">Auto-Correção Autônoma</option>
                </select>
              </div>
            </div>

            {/* Natural Language Prompt Textarea */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block flex items-center justify-between">
                <span>Regra em Linguagem Natural</span>
                <span className="text-purple-400">Prompt Direto</span>
              </label>
              <textarea
                rows={4}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Descreva exatamente a condição de bloqueio ou monitoramento. Exemplo: Bloquear PIX se valor maior que R$ 10.000 e favorecido não homologado no ERP..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-400 resize-none font-sans"
              />
            </div>

            {/* Compilation Pipeline Steps Indicator */}
            {isCompiling && (
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/50 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Compilando Invariante...</span>
                  </span>
                  <span>Etapa {compilationStage}/4</span>
                </div>
                <div className="space-y-1 text-[11px] font-mono">
                  {compilationSteps.map((step, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-center gap-2 ${
                        compilationStage > idx 
                          ? 'text-emerald-400' 
                          : compilationStage === idx + 1 
                          ? 'text-purple-300 font-bold animate-pulse' 
                          : 'text-slate-600'
                      }`}
                    >
                      {compilationStage > idx ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">{idx + 1}</div>}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Train Button */}
            <button
              type="button"
              disabled={isCompiling || !promptInput.trim()}
              onClick={handleTrainAgent}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>{isCompiling ? 'Compilando no Enxame...' : 'Treinar & Implantar Agente'}</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CUSTOM AGENTS LIST & MANAGEMENT (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--vx-neon)]" />
                  <span>Agentes Customizados em Produção</span>
                </h2>
                <span className="text-[11px] text-slate-400">
                  {agentsList.length} agentes ativos operando no barramento com latência média de 16ms
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                Swarm Mesh Ativo
              </span>
            </div>

            {/* Agents List Cards */}
            <div className="space-y-3">
              {agentsList.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    agent.status === 'ACTIVE'
                      ? 'bg-slate-950/80 border-slate-800 hover:border-purple-500/50'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        {agent.domain}
                      </span>
                      <strong className="text-xs font-bold text-slate-100">
                        {agent.name}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        agent.status === 'ACTIVE' 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}>
                        {agent.status === 'ACTIVE' ? '● ATIVO' : 'PAUSADO'}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {agent.latencyMs}ms
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans mb-2.5">
                    "{agent.naturalLanguagePrompt}"
                  </p>

                  {/* Compiled Invariant Box */}
                  <div className="p-2.5 rounded-xl bg-black/60 border border-slate-900 font-mono text-[10px] text-purple-300 flex items-center justify-between mb-3">
                    <div className="truncate flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{agent.compiledInvariant}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 ml-2 shrink-0">{agent.triggerCount} disparos</span>
                  </div>

                  {/* Controls & Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                    <span className="text-[10px] font-mono text-slate-500">
                      Criado {agent.createdAt}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSimulateTestRun(agent)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Simular disparo de evento de teste"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span>Testar Disparo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAgentStatus(agent.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title={agent.status === 'ACTIVE' ? 'Pausar Agente' : 'Ativar Agente'}
                      >
                        {agent.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAgent(agent.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                        title="Remover Agente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
