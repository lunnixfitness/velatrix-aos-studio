import React, { useState } from 'react';
import { 
  Fingerprint, 
  ArrowLeft, 
  RotateCcw, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  SlidersHorizontal, 
  X, 
  Check, 
  Loader2, 
  ChevronUp, 
  ChevronDown, 
  Cpu, 
  Download, 
  MessageSquare, 
  Mail,
  Bot,
  FileText
} from 'lucide-react';
import { SectorRiskProfile } from './taxonomy';
import { ExecutiveKpiGrid, ExecutiveKpis } from './ExecutiveKpiGrid';
import { AgentActionPlanModal } from './AgentActionPlanModal';
import { formatCurrency } from '../../utils/i18n';
import { SupportedLanguage, SupportedCurrency, AuditRecord } from '../../types/aos';
import { secureId, secureInt } from '../../lib/demoMode';

interface StepDecisionProps {
  currentSector: SectorRiskProfile;
  displayCompany: {
    name: string;
    cnpj: string;
    annualRevenue: number;
    dailyVolume: string;
    ebitdaMargin: number;
  };
  zScore: number;
  cashFlowCoverage: number;
  scaledDowntimeCost: number;
  scalingFactor: number;
  scaledAnnualLoss: number;
  estimatedSavings: number;
  freeCashBalance: number;
  workingCapitalBuffer: number;
  singleIncidentLossManual: number;
  ebitdaGainPercent: number;
  onInjectScenario: (scenarioName: string) => void;
  onResetDiagnosis: () => void;
  onBack: () => void;
  onDownloadPdf: () => void;
  onShareWhatsApp: () => void;
  onShareEmail: () => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
  isGeneratingPdf: boolean;
  language: SupportedLanguage;
  currency: SupportedCurrency;
}

export const StepDecision: React.FC<StepDecisionProps> = ({
  currentSector,
  displayCompany,
  zScore,
  cashFlowCoverage,
  scaledDowntimeCost,
  scalingFactor,
  scaledAnnualLoss,
  estimatedSavings,
  freeCashBalance,
  workingCapitalBuffer,
  singleIncidentLossManual,
  ebitdaGainPercent,
  onInjectScenario,
  onResetDiagnosis,
  onBack,
  onDownloadPdf,
  onShareWhatsApp,
  onShareEmail,
  onAddAuditRecord,
  isGeneratingPdf,
  language,
  currency
}) => {
  const [multiSigState, setMultiSigState] = useState<'idle' | 'executing' | 'approved'>('idle');
  const [multiSigTxHash, setMultiSigTxHash] = useState<string>('');
  const [isParamAdjustOpen, setIsParamAdjustOpen] = useState<boolean>(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState<boolean>(false);
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState<boolean>(false);
  
  const initialCap = Math.round((currentSector.lossMath.tacticalCostRate || 0.085) * 100);
  const [customTacticalCapPercent, setCustomTacticalCapPercent] = useState<number>(initialCap);
  const [customMinEbitdaMargin, setCustomMinEbitdaMargin] = useState<number>(Math.round(displayCompany.ebitdaMargin));
  const [customQuorumThreshold, setCustomQuorumThreshold] = useState<string>('7/7 Especialistas');

  // Dynamic Financial impact calculation based on inputs, sector lossMath and slider
  const manualLossImpact = singleIncidentLossManual;
  const autonomousTacticalCost = Math.round(manualLossImpact * (customTacticalCapPercent / 100));
  const netPreservedDelta = manualLossImpact - autonomousTacticalCost;
  const marginPreservedPercent = Math.round((netPreservedDelta / manualLossImpact) * 100);

  const kpis: ExecutiveKpis = {
    ebitdaPreservedBrl: estimatedSavings,
    ebitdaGainPercent: ebitdaGainPercent,
    slaTierAGuarantee: currentSector.lossMath.slaTierGuarantee || '99.8% Assegurado',
    tacticalResolutionCostBrl: autonomousTacticalCost,
    tacticalCostRatePercent: customTacticalCapPercent,
    freeCashBalanceBrl: freeCashBalance,
    cashFlowCoverage: cashFlowCoverage
  };

  const handleApproveExecuteMultiSig = () => {
    setMultiSigState('executing');
    setTimeout(() => {
      const generatedHash = `0x${Array.from({ length: 32 }, () => secureInt(0, 15).toString(16)).join('')}`;
      setMultiSigTxHash(generatedHash);
      setMultiSigState('approved');

      if (onAddAuditRecord) {
        const newRecord: AuditRecord = {
          id: `rec_decision_${Date.now()}`,
          timestamp: new Date().toISOString(),
          eventId: `evt_sim_${Date.now()}`,
          eventTitle: `Aprovação & Execução Multi-Sig: ${currentSector.name}`,
          sector: currentSector.sectorKey as any,
          agentsInvolved: currentSector.predictiveResolution.agentsOrchestrated || ['Autonomous Swarm', 'Ledger Orchestrator'],
          decisionSummary: `Aprovação autônoma de custo tático (${formatCurrency(autonomousTacticalCost, currency, language)}) com proteção líquida de EBITDA estimada em ${formatCurrency(netPreservedDelta, currency, language)} (${marginPreservedPercent}% preservado). Quórum: ${customQuorumThreshold}.`,
          decisionAst: {
            ui_type: 'CriticalDecisionCard',
            priority: 'High',
            summary: `Alocação de Custo Tático aprovada para mitigação operacional em ${displayCompany.name}.`,
            kpis: [
              { label: 'EBITDA Preservado', value: `+${formatCurrency(netPreservedDelta, currency, language)}`, impact: 'positive' },
              { label: 'Custo Tático', value: formatCurrency(autonomousTacticalCost, currency, language), impact: 'neutral' },
              { label: 'SLA Tier-A', value: currentSector.lossMath.slaTierGuarantee || '99.8%', impact: 'positive' }
            ],
            invariants_checked: [
              `Margem EBITDA >= ${customMinEbitdaMargin}%`,
              `Teto Custo Tático <= ${customTacticalCapPercent}%`,
              `Working Capital Buffer >= ${formatCurrency(workingCapitalBuffer, currency, language)}`
            ],
            audit_hash: generatedHash
          },
          status: 'executed',
          requiredSignatures: 3,
          signatures: [
            { role: 'CEO Executive Key', keyId: '0x19A4...C31B', signedAt: new Date().toISOString(), verified: true },
            { role: 'CFO Treasury Key', keyId: '0x7F2B...88F1', signedAt: new Date().toISOString(), verified: true },
            { role: 'AOS Consensus Swarm', keyId: '0x9A8F...66C2', signedAt: new Date().toISOString(), verified: true }
          ],
          executionReceipt: `TX-AOS-MULTI-${secureId('', 4).toUpperCase()}`,
          invariantSnapshot: [
            `Margem EBITDA Mínima: ${customMinEbitdaMargin}%`,
            `Teto Custo Tático: ${customTacticalCapPercent}%`,
            `Quórum Exigido: ${customQuorumThreshold}`
          ],
          recordHash: generatedHash
        };
        onAddAuditRecord(newRecord);
      }
    }, 650);
  };

  const handleRejectAdjustParameters = () => {
    setIsParamAdjustOpen(prev => !prev);
    if (multiSigState === 'approved') {
      setMultiSigState('idle');
    }
  };

  const getAgentSwarmAuditLogs = () => {
    const agents = currentSector.predictiveResolution.agentsOrchestrated;
    
    return [
      {
        id: 'agent-1',
        name: agents[0] || 'Agente de Hedge & Pricing',
        role: 'Proteção de Margem & Trava Volatilidade',
        vote: 'APROVADO',
        confidence: '99.4%',
        rationale: 'Detectou oscilação de paridade spot. Executou trava de derivativo cambial/spot D+0 garantindo proteção integral da margem contra volatilidade sem spread negativo.',
        invariant: 'Spread Slippage <= 0.35%',
        hash: 'secp256k1::0x4F19A8...C31B'
      },
      {
        id: 'agent-2',
        name: agents[1] || 'Agente de Logística & Roteirização',
        role: 'Orquestração de Frotas & Roteirização',
        vote: 'APROVADO',
        confidence: '99.1%',
        rationale: 'Mapeou rotas alternativas via telemetria IoT ativa e remanejou frotas e ordens de entrega para terminais sem fila, reduzindo tempo de trânsito em 84%.',
        invariant: 'SLA Lead-Time <= 45min',
        hash: 'secp256k1::0x8B71E4...A102'
      },
      {
        id: 'agent-3',
        name: agents[2] || 'Agente de Tesouraria',
        role: 'Liquidez Imediata & Capital de Giro',
        vote: 'APROVADO',
        confidence: '99.8%',
        rationale: `Verificou saldo D+0 livre de ${formatCurrency(freeCashBalance, currency, language)} e autorizou a alocação do custo tático de ${formatCurrency(autonomousTacticalCost, currency, language)} sem violar covenants bancários de liquidez corrente.`,
        invariant: `Working Capital Buffer >= ${formatCurrency(workingCapitalBuffer, currency, language)}`,
        hash: 'secp256k1::0x3D92A0...FE44'
      },
      {
        id: 'agent-4',
        name: agents[3] || 'Agente de Risco Regulatório',
        role: 'Invariantes de Compliance & Auditoria',
        vote: 'APROVADO',
        confidence: '100.0%',
        rationale: 'Confrontou a matriz de risco operacional com a Invariante de Sobrevivência do AOS, atestando conformidade plena com normas regulatórias ISO 31000, BACEN e CVM.',
        invariant: 'Regulatory Risk Score = ZERO_TOLERANCE',
        hash: 'secp256k1::0x62B9C8...195F'
      },
      {
        id: 'agent-5',
        name: agents[4] || 'Agente de Tax & Compliance Fiscal',
        role: 'Inteligência Tributária & SEFAZ',
        vote: 'APROVADO',
        confidence: '98.9%',
        rationale: 'Auditou regras de ICMS-ST, PIS/COFINS e emitiu documentos fiscais contingenciais com validação instantânea de chaves SEFAZ e assinatura criptográfica Secp256k1.',
        invariant: 'Tax Divergence Delta = R$ 0.00',
        hash: 'secp256k1::0x9A48F1...66C2'
      },
      {
        id: 'agent-6',
        name: agents[5] || 'Agente de Procurement & Leilão Reverso',
        role: 'Negociação Autônoma Spot',
        vote: 'APROVADO',
        confidence: '98.7%',
        rationale: 'Disparou leilão reverso automatizado entre fornecedores homologados Tier-1 em 650ms, obtendo desconto médio de 14.2% no custo de execução tática.',
        invariant: 'Max Premium Spot <= 12%',
        hash: 'secp256k1::0x1E59C7...DD89'
      },
      {
        id: 'agent-7',
        name: agents[6] || 'Agente de Continuity & Disaster Recovery',
        role: 'Resiliência Cibernética & Alta Disponibilidade',
        vote: 'APROVADO',
        confidence: '99.6%',
        rationale: 'Ativou failover automático para cluster redundante sem parada operacional (zero downtime), salvando snapshot imutável de integridade no Grafo de Conhecimento do AOS.',
        invariant: 'RTO < 60s • RPO = 0',
        hash: 'secp256k1::0x7C04E3...9A15'
      }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30">
            <Fingerprint className="w-4 h-4 text-[var(--vx-neon)]" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
            Passo 5: Decisão Executiva &amp; Governança Human-in-the-Loop (Zero-GUI)
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Painel de governança de aprovação de alocação de capital e orquestração do Enxame Multi-Sig. O AOS preserva o capital da empresa operando em quarentena com consenso dos 7 especialistas.
        </p>
      </div>

      {/* Top Executive KPI Bar: EBITDA Preservado, SLA Tier-A, Custo de Resolução, Saldo Caixa Livre */}
      <ExecutiveKpiGrid 
        kpis={kpis}
        language={language}
        currency={currency}
        contextTitle="Métricas Executivas de Preservação &amp; Liquidez D+0"
      />

      {/* Top Info Card: Ação no Grafo de Conhecimento */}
      <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl">
        <div className="flex items-start gap-3">
          <Cpu className="w-5 h-5 text-[var(--vx-neon)] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-[var(--vx-neon)] tracking-wider block">
              Ação Autônoma no Grafo de Conhecimento:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {currentSector.predictiveResolution.graphAction}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">TEMPO MÉDIO DE RESOLUÇÃO</span>
            <strong className="text-teal-300 font-mono font-bold">{currentSector.predictiveResolution.recoveryHours}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">IMPACTO NO EBITDA</span>
            <strong className="text-[var(--vx-neon)] font-mono font-bold">{currentSector.predictiveResolution.ebitdaProtectionPercent}</strong>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">AGENTES ORQUESTRADOS</span>
            <strong className="text-slate-200 font-semibold">{currentSector.predictiveResolution.agentsOrchestrated.length} Especialistas</strong>
          </div>
        </div>
      </div>

      {/* Decision Module Card */}
      <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/40 flex items-center justify-center">
              <Fingerprint className="w-4 h-4 text-[var(--vx-neon)]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2 font-mono">
                Painel de Decisão Executiva (Human-in-the-Loop)
              </h3>
              <p className="text-[10px] text-slate-400">
                Comparativo financeiro auditado e governança de aprovação com assinatura Secp256k1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-teal-400 flex items-center gap-1">
              <KeyRound className="w-2.5 h-2.5" />
              {customQuorumThreshold}
            </span>
            <span className="px-2 py-0.5 rounded bg-[var(--vx-neon)]/10 border border-[var(--vx-neon)]/30 text-[10px] font-mono text-[var(--vx-neon)]">
              Zero-GUI Ready
            </span>
          </div>
        </div>

        {/* Financial Impact Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Scenario 1: Sem AOS */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-rose-900/40 space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/90 font-mono">
                Cenário Sem AOS (Manual)
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-lg font-black font-mono text-rose-400">
              -{formatCurrency(manualLossImpact, currency, language)}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Prejuízo estimado por atraso em deliberação manual e lentidão de resposta
            </p>
            <div className="text-[9px] font-mono text-rose-400/80 pt-1 border-t border-rose-950/60">
              Custo da Inação Crítica
            </div>
          </div>

          {/* Scenario 2: Com AOS */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-900/40 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90 font-mono">
                Cenário Com AOS (Autônomo)
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <div className="text-lg font-black font-mono text-amber-300">
              -{formatCurrency(autonomousTacticalCost, currency, language)}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Custo Tático Operacional ({customTacticalCapPercent}% alocação spot &amp; hedging)
            </p>
            <div className="text-[9px] font-mono text-amber-400/80 pt-1 border-t border-amber-950/60">
              Custo Tático Otimizado
            </div>
          </div>

          {/* Scenario 3: Líquido Preservado */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/40 space-y-1 relative shadow-lg shadow-emerald-950/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Resultado Líquido Preservado
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-black font-mono text-[var(--vx-neon-green)] drop-shadow-[0_0_12px_rgba(0,230,118,0.35)]">
              +{formatCurrency(netPreservedDelta, currency, language)}
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-tight">
              Delta de capital corporativo protegido instantaneamente
            </p>
            <div className="text-[9px] font-mono text-emerald-400 font-bold pt-1 border-t border-emerald-900/50 flex items-center justify-between">
              <span>Margem Preservada</span>
              <span>+{((netPreservedDelta / manualLossImpact) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Approved Multi-Sig Receipt Banner */}
        {multiSigState === 'approved' && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ordem Aprovada &amp; Executada com Quórum Multi-Sig (7/7)!</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Hash: <span className="text-emerald-400">{multiSigTxHash}</span>
              </p>
              <p className="text-[10px] text-slate-400">
                Signatários: CEO (0x19A4) • CFO (0x7F2B) • Enxame AOS Swarm v4.8 (Consenso 98.6%)
              </p>
            </div>
            <button
              id="btn-inject-scenario-approved"
              onClick={() => onInjectScenario(currentSector.predictiveResolution.scenarioToInject)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ver Ação no Dashboard</span>
            </button>
          </div>
        )}

        {/* Parameter Adjustment Drawer */}
        {isParamAdjustOpen && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
                <span>Ajuste de Parâmetros Executivos &amp; Invariantes</span>
              </div>
              <button
                onClick={() => setIsParamAdjustOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                  Teto Custo Tático: <span className="font-mono text-amber-300 font-bold">{customTacticalCapPercent}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={customTacticalCapPercent}
                  onChange={(e) => setCustomTacticalCapPercent(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">
                  Invariante Margem EBITDA: <span className="font-mono text-[var(--vx-neon)] font-bold">{customMinEbitdaMargin}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={customMinEbitdaMargin}
                  onChange={(e) => setCustomMinEbitdaMargin(Number(e.target.value))}
                  className="w-full accent-[var(--vx-neon)] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-mono">Quórum Multi-Sig</label>
                <select
                  value={customQuorumThreshold}
                  onChange={(e) => setCustomQuorumThreshold(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs font-mono"
                >
                  <option value="7/7 Especialistas">7/7 Especialistas (Consenso Pleno)</option>
                  <option value="5/7 Especialistas">5/7 Especialistas (Quórum Qualificado)</option>
                  <option value="3/7 Especialistas">3/7 Especialistas (Modo Urgência)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Toolbar */}
        <div className="pt-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Button: Approve & Execute */}
            <button
              id="btn-approve-multisig-decision"
              onClick={handleApproveExecuteMultiSig}
              disabled={multiSigState === 'executing'}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon-green)] via-teal-400 to-[var(--vx-neon)] hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {multiSigState === 'executing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Coletando Assinaturas Multi-Sig...</span>
                </>
              ) : multiSigState === 'approved' ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Approve &amp; Execute (Multi-Sig) ✓</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 text-slate-950" />
                  <span>Approve &amp; Execute (Multi-Sig)</span>
                </>
              )}
            </button>

            {/* Secondary Button: Reject & Adjust */}
            <button
              id="btn-reject-adjust-decision"
              onClick={handleRejectAdjustParameters}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
              <span>Reject &amp; Adjust Parameters</span>
            </button>
          </div>

          {/* Test Scenario Action */}
          <button
            id="btn-inject-scenario-decision-main"
            onClick={() => onInjectScenario(currentSector.predictiveResolution.scenarioToInject)}
            className="px-4 py-2.5 rounded-xl bg-[var(--vx-neon)]/15 hover:bg-[var(--vx-neon)]/25 border border-[var(--vx-neon)]/50 text-[var(--vx-neon)] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Testar Resolução: "{currentSector.predictiveResolution.scenarioToInject}"</span>
          </button>
        </div>
      </div>

      {/* Swarm of 7 Agents Badges */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
              Enxame de Agentes em Paralelo ({currentSector.predictiveResolution.agentsOrchestrated.length} Especialistas):
            </span>
            <span className="text-[10px] font-mono text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded border border-teal-800/40">
              Consenso 98.6% Aprovado
            </span>
          </div>

          {/* Action Plan Button */}
          <button
            id="btn-open-agent-action-plan"
            onClick={() => setIsActionPlanModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[var(--vx-neon)]/20 via-teal-500/20 to-emerald-500/20 hover:from-[var(--vx-neon)]/30 hover:to-emerald-500/30 border border-[var(--vx-neon)]/60 text-[var(--vx-neon)] hover:text-white text-xs font-bold transition-all shadow-md shadow-cyan-950/40 flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Bot className="w-3.5 h-3.5 text-[var(--vx-neon)]" />
            <span>Ver Plano de Ação dos Agentes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {currentSector.predictiveResolution.agentsOrchestrated.map((agentName, idx) => (
            <div
              key={idx}
              className="px-2.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-1.5 text-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-4 h-4 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-[9px] font-mono text-[var(--vx-neon)] shrink-0 font-bold">
                  {idx + 1}
                </span>
                <span className="text-[11px] text-slate-200 font-medium truncate" title={agentName}>
                  {agentName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Swarm Audit Log Accordion */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/90 shadow-xl">
        <button
          id="btn-toggle-agent-audit-log-step5"
          onClick={() => setIsAuditLogOpen(prev => !prev)}
          className="w-full px-5 py-4 bg-slate-900/90 hover:bg-slate-900 transition-colors flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {isAuditLogOpen ? (
              <ChevronUp className="w-4 h-4 text-[var(--vx-neon)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--vx-neon)]" />
            )}
            <span className="text-xs font-bold text-slate-200 font-mono">
              {isAuditLogOpen ? 'Ocultar Raciocínio Consensual do Enxame (Audit Log)' : 'Ver Raciocínio Consensual do Enxame (Audit Log)'}
            </span>
          </div>

          <span className="text-[10px] font-mono text-[var(--vx-neon-green)] flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3 text-[var(--vx-neon-green)]" />
            7/7 Auditados
          </span>
        </button>

        {isAuditLogOpen && (
          <div className="p-4 space-y-3 border-t border-slate-800 text-xs">
            <div className="space-y-2">
              {getAgentSwarmAuditLogs().map((agentLog, logIdx) => (
                <div
                  key={agentLog.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-slate-950 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] font-mono text-[10px] font-bold flex items-center justify-center">
                        0{logIdx + 1}
                      </span>
                      <span className="font-bold text-slate-200 text-xs">{agentLog.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {agentLog.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-[var(--vx-neon-green)] border border-emerald-800/40 font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        {agentLog.vote} ({agentLog.confidence})
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 pl-7 leading-relaxed font-sans">
                    {agentLog.rationale}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60 pl-7 font-mono text-[9px] text-slate-500">
                    <span>INVARIANTE: <strong className="text-teal-300">{agentLog.invariant}</strong></span>
                    <span>HASH: <strong className="text-slate-400">{agentLog.hash}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons Toolbar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
        <button
          id="btn-back-to-results"
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Resultado</span>
        </button>

        <button
          id="btn-start-fresh-diagnosis"
          onClick={onResetDiagnosis}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-[var(--vx-neon)]/40 text-[var(--vx-neon)] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Novo Diagnóstico</span>
        </button>
      </div>

      {/* Agent Action Plan & Financial Inaction Risk Modal */}
      <AgentActionPlanModal
        isOpen={isActionPlanModalOpen}
        onClose={() => setIsActionPlanModalOpen(false)}
        currentSector={currentSector}
        displayCompany={displayCompany}
        scaledAnnualLoss={scaledAnnualLoss}
        scaledDowntimeCost={scaledDowntimeCost}
        singleIncidentLossManual={singleIncidentLossManual}
        estimatedSavings={estimatedSavings}
        ebitdaGainPercent={ebitdaGainPercent}
        language={language}
        currency={currency}
      />
    </div>
  );
};
