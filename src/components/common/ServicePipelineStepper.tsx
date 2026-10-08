import React, { useState } from 'react';
import { 
  Inbox, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  AlertOctagon, 
  FileText, 
  Clock, 
  ArrowRight, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  UserCheck,
  AlertTriangle,
  Scale,
  Briefcase
} from 'lucide-react';
import { PipelineStage, ServiceInputContract, PipelineStageState } from '../../types/standardizedPipeline';
import { PipelineDefinition, PipelineStageDef, ActorRoleId, ACTOR_LABELS } from '../../types/serviceDefinition';
import { agruparEmMacroEtapas } from '../../services/registry/serviceRegistry';

interface ServicePipelineStepperProps {
  // Novo modelo dinâmico
  pipeline?: PipelineDefinition;
  state?: PipelineStageState;

  // Propriedades retrocompatíveis
  currentStage?: PipelineStage;
  serviceContract?: ServiceInputContract;
  blockedReason?: string;
  missingRequirements?: string[];
  progressPct?: number;
  stageTimestamps?: Record<string, string>;
  onResolveRequirements?: () => void;
  className?: string;
  compact?: boolean;
}

export const ServicePipelineStepper: React.FC<ServicePipelineStepperProps> = ({
  pipeline,
  state,
  currentStage: legacyCurrentStage,
  serviceContract,
  blockedReason: legacyBlockedReason,
  missingRequirements: legacyMissingRequirements = [],
  progressPct: legacyProgressPct = 0,
  stageTimestamps: legacyStageTimestamps = {},
  onResolveRequirements,
  className = '',
  compact = false
}) => {
  const [showContractDetails, setShowContractDetails] = useState<boolean>(false);

  // Consolidação de estado (prioriza novo modelo sobre legado)
  const currentStageId = state?.currentStageId || (legacyCurrentStage as string) || 'RECEBIDO';
  const progress = state?.progressPct ?? legacyProgressPct;
  const isBlocked = currentStageId === 'BLOQUEADO' || !!state?.blockedReason || !!legacyBlockedReason;
  const blockedMsg = state?.blockedReason || legacyBlockedReason;
  const missing = state?.missingRequirements || legacyMissingRequirements;
  const timestamps = state?.stageTimestamps || legacyStageTimestamps;

  // P30: esteiras com mais de 5 estágios técnicos são exibidas nas 5 macro-etapas padrão;
  // os estágios extras aparecem como checklist (sub-etapas) dentro de cada macro-etapa.
  if (pipeline && pipeline.stages.length > 5) {
    const idxAtual = Math.max(0, pipeline.stages.findIndex((s) => s.id === currentStageId));
    const macros = agruparEmMacroEtapas(pipeline.stages);
    return (
      <div className={`rounded-2xl bg-slate-900/90 border ${isBlocked ? 'border-rose-500/40' : 'border-slate-800'} p-4 sm:p-5 text-white shadow-xl ${className}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">Esteira padrão Velatrix · 5 etapas</div>
            <h4 className="text-sm font-bold text-slate-100">{serviceContract?.serviceName || 'Esteira de serviço'}</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {pipeline.stages.length} sub-etapas técnicas
          </span>
        </div>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {macros.map((m, mi) => {
            const idxs = m.stages.map((s) => pipeline.stages.findIndex((x) => x.id === s.id));
            const feita = idxs.length > 0 && idxs.every((i) => i < idxAtual || (pipeline.stages[i].isTerminal && i === idxAtual && !isBlocked));
            const atual = idxs.includes(idxAtual) && !feita;
            const cls = feita ? 'bg-emerald-950/15 border-emerald-800/40' : atual ? (isBlocked ? 'bg-rose-950/20 border-rose-800/50' : 'bg-cyan-950/25 border-cyan-800/50 ring-1 ring-cyan-500/30') : 'bg-slate-950/40 border-slate-800/80';
            return (
              <li key={m.id} className={`p-3 rounded-xl border ${cls}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 font-bold">#{mi + 1}</span>
                  <span className="text-[9px] font-mono font-bold text-slate-300">{feita ? 'OK' : atual ? (isBlocked ? 'BLOQUEADO' : 'EM ANDAMENTO') : 'PENDENTE'}</span>
                </div>
                <div className={`text-xs font-bold ${feita ? 'text-emerald-400' : atual ? 'text-cyan-300' : 'text-slate-300'}`}>{m.label}</div>
                {m.stages.length > 0 && (
                  <ul className="mt-2 pt-2 border-t border-slate-800/60 space-y-1">
                    {m.stages.map((s) => {
                      const i = pipeline.stages.findIndex((x) => x.id === s.id);
                      const ok = i < idxAtual;
                      const agora = i === idxAtual;
                      return (
                        <li key={s.id} className="flex items-start gap-1.5 text-[10px] leading-snug">
                          {ok ? <CheckCircle2 className="w-3 h-3 mt-px shrink-0 text-emerald-400" /> : <span className={`w-2 h-2 mt-1 shrink-0 rounded-full ${agora ? 'bg-cyan-400' : 'bg-slate-700'}`} />}
                          <span className={agora ? 'text-cyan-300 font-semibold' : ok ? 'text-slate-400' : 'text-slate-300'}>
                            {s.label}
                            <span className="block text-slate-500">{ACTOR_LABELS[s.actorRole] || s.actorRole}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
        {isBlocked && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 flex flex-wrap items-center justify-between gap-2">
            <span><AlertOctagon className="w-4 h-4 inline mr-1" />{blockedMsg || 'Há requisitos obrigatórios pendentes nesta etapa.'}{missing.length > 0 ? ' Pendente: ' + missing.join(', ') : ''}</span>
            {onResolveRequirements && <button type="button" onClick={onResolveRequirements} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold">Resolver pendências</button>}
          </div>
        )}
        {progress > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-xs font-mono text-cyan-300 mb-1"><span>Progresso na esteira:</span><span>{progress}%</span></div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>
    );
  }

  // Se tiver pipeline dinâmico configurado, renderiza os estágios do registry
  if (pipeline && pipeline.stages.length > 0) {
    const currentIdx = pipeline.stages.findIndex(s => s.id === currentStageId);
    const resolvedCurrentIdx = currentIdx >= 0 ? currentIdx : 0;

    return (
      <div className={`rounded-2xl bg-slate-900/90 border ${isBlocked ? 'border-rose-500/40 shadow-rose-950/20' : 'border-slate-800'} p-4 sm:p-5 text-white shadow-xl backdrop-blur-md transition-all ${className}`}>
        {/* Header do Pipeline */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isBlocked ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Esteira Oficial Multi-Segmento Velatrix AOS
              </div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                {serviceContract?.serviceName || 'Esteira de Execução Pericial & Tributária'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                  {pipeline.stages.length} Estágios Formais
                </span>
              </h4>
            </div>
          </div>

          {serviceContract && (
            <button
              type="button"
              onClick={() => setShowContractDetails(!showContractDetails)}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Contrato de Entrada: Dados 100% Reais</span>
              {showContractDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Detalhes do Contrato de Entrada */}
        {showContractDetails && serviceContract && (
          <div className="mb-5 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <FileText className="w-4 h-4" /> Requisitos Mandatórios do Contrato
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                Vedado Uso de Dados Estimados no Laudo Final
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Entradas Obrigatórias:</span>
                <ul className="space-y-1 list-disc list-inside">
                  {serviceContract.requiredInputs.map(r => (
                    <li key={r.key} className="text-slate-300">
                      <strong className="text-white">{r.label}</strong> {r.formats && `(${r.formats.join(', ')})`}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">Regra de Liberação:</span>
                <p className="text-slate-300 leading-relaxed">
                  Todo laudo técnico é assinado digitalmente e bloqueado preventivamente se houver ausência de artefatos reais comprobatórios.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Renderização Dinâmica dos Estágios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          {pipeline.stages.map((stageDef: PipelineStageDef, idx: number) => {
            const isCompleted = idx < resolvedCurrentIdx || (stageDef.isTerminal && idx === resolvedCurrentIdx && !isBlocked);
            const isCurrent = idx === resolvedCurrentIdx && !stageDef.isTerminal;
            const isTerminalStage = stageDef.isTerminal;

            // Checagem de dependência de estágio (CPC / Grafo)
            const predecessor = stageDef.dependeDe 
              ? pipeline.stages.find(s => s.id === stageDef.dependeDe) 
              : (idx > 0 ? pipeline.stages[idx - 1] : undefined);
            const predecessorIdx = predecessor ? pipeline.stages.findIndex(s => s.id === predecessor.id) : -1;
            const isAguardando = predecessorIdx >= 0 && predecessorIdx >= resolvedCurrentIdx;

            // FIX 1 (crítico): eliminar 'vence NaN/NaN NaN:NaN'. O cálculo de deadline
            // por estágio deve ser startedAt = anterior?.completedAt ? new Date(anterior.completedAt) : D0
            // com guard isNaN(startedAt.getTime()) que loga erro e usa D0 como fallback seguro.
            const slaHoras = stageDef.slaHoras || stageDef.slaHours || 24;
            const now = new Date();
            const d0 = new Date();

            let startedAtDate: Date;
            if (stageDef.startedAt) {
              const parsed = new Date(stageDef.startedAt);
              if (isNaN(parsed.getTime())) {
                console.error(`[ServicePipelineStepper] Data startedAt inválida no estágio ${stageDef.id}:`, stageDef.startedAt);
                startedAtDate = d0;
              } else {
                startedAtDate = parsed;
              }
            } else if (predecessor && timestamps[predecessor.id]) {
              const parsedPred = new Date(timestamps[predecessor.id]);
              if (isNaN(parsedPred.getTime())) {
                console.error(`[ServicePipelineStepper] Timestamp do predecessor ${predecessor.id} inválido:`, timestamps[predecessor.id]);
                startedAtDate = d0;
              } else {
                startedAtDate = parsedPred;
              }
            } else {
              startedAtDate = new Date(d0.getTime() - Math.max(0, resolvedCurrentIdx - idx) * 3600000);
            }

            if (isNaN(startedAtDate.getTime())) {
              console.error(`[ServicePipelineStepper] Fallback ativado para startedAtDate no estágio ${stageDef.id}`);
              startedAtDate = d0;
            }

            const deadlineDate = new Date(startedAtDate.getTime() + slaHoras * 3600000);
            const isEstourado = !isCompleted && !isAguardando && now.getTime() > deadlineDate.getTime();

            const dia = String(deadlineDate.getDate()).padStart(2, '0');
            const mes = String(deadlineDate.getMonth() + 1).padStart(2, '0');
            const hora = String(deadlineDate.getHours()).padStart(2, '0');
            const min = String(deadlineDate.getMinutes()).padStart(2, '0');
            const diasD = Math.max(1, Math.round(slaHoras / 24));

            let badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
            let cardBg = 'bg-slate-950/40 border-slate-800/80';
            let dotColor = 'bg-slate-700';
            let statusText = 'PENDENTE';

            if (isCompleted) {
              badgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
              cardBg = 'bg-emerald-950/15 border-emerald-800/40';
              dotColor = 'bg-emerald-400';
              statusText = 'OK';
            } else if (isAguardando) {
              // MUDANÇA 2: Estágio bloqueado por dependência renderiza "AGUARDANDO" em amarelo
              badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
              cardBg = 'bg-amber-950/15 border-amber-800/40';
              dotColor = 'bg-amber-400';
              statusText = 'AGUARDANDO';
            } else if (isEstourado) {
              // MUDANÇA 6: Se now > deadline, badge vira vermelho "SLA ESTOURADO"
              badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
              cardBg = 'bg-rose-950/20 border-rose-800/50';
              dotColor = 'bg-rose-500';
              statusText = 'SLA ESTOURADO';
            } else if (isCurrent) {
              if (isBlocked) {
                badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                cardBg = 'bg-rose-950/20 border-rose-800/50';
                dotColor = 'bg-rose-500';
                statusText = 'BLOQUEADO';
              } else {
                badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
                cardBg = 'bg-cyan-950/25 border-cyan-800/50 ring-1 ring-cyan-500/30';
                dotColor = 'bg-cyan-400';
                statusText = 'EM ANDAMENTO';
              }
            } else if (isTerminalStage && !isCompleted) {
              badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
              cardBg = 'bg-slate-950/30 border-slate-800';
              statusText = 'HOMOLOGAÇÃO';
            }

            return (
              <div 
                key={stageDef.id}
                className={`p-3 rounded-xl border ${cardBg} transition-all duration-200 flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400 font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {stageDef.numero || `#${idx + 1}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                        {statusText}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    </div>
                  </div>

                  <div className={`text-xs font-bold leading-tight ${isCurrent ? (isBlocked ? 'text-rose-300' : 'text-cyan-300') : isCompleted ? 'text-emerald-400' : isAguardando ? 'text-amber-300' : 'text-slate-300'}`}>
                    {stageDef.label}
                  </div>

                  {stageDef.badge && (
                    <div className="mt-1.5 text-[9px] font-mono font-medium text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                      {stageDef.badge}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{ACTOR_LABELS[stageDef.actorRole] || stageDef.actorRole}</span>
                  </div>

                  {/* Artefatos Obrigatórios do Estágio */}
                  {stageDef.requiredArtifacts.length > 0 && !compact && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 space-y-1">
                      {stageDef.requiredArtifacts.map(art => {
                        const isMissing = missing.includes(art.key) || missing.includes(art.label);
                        return (
                          <div 
                            key={art.key}
                            className={`text-[9px] font-mono flex items-center justify-between px-1.5 py-0.5 rounded ${
                              isMissing ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : 'bg-slate-900/60 text-slate-400'
                            }`}
                          >
                            <span className="truncate max-w-[100px]">{art.label}</span>
                            {art.required && (
                              <span className={isMissing ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                                {isMissing ? 'Falta' : 'OK'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/50 flex flex-col gap-0.5 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>SLA: {slaHoras}h → vence {dia}/{mes} {hora}:{min} (D+{diasD})</span>
                    </span>
                  </div>

                  {timestamps[stageDef.id] && (() => {
                    const rawTs = timestamps[stageDef.id];
                    let isoStr = rawTs;
                    const parsedTs = new Date(rawTs);
                    if (!isNaN(parsedTs.getTime())) {
                      isoStr = parsedTs.toISOString();
                    }
                    return (
                      <span className="text-cyan-400/80 text-[9px] font-mono truncate" title={`Concluído: ${isoStr}`}>
                        Concluído: {isoStr}
                      </span>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner de Bloqueio */}
        {isBlocked && (
          <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                  Execução Interrompida por Pendência Contratual
                </div>
                <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                  {blockedMsg || 'Existem artefatos mandatórios ou requisitos técnicos não atendidos nesta etapa.'}
                </p>
                {missing.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {missing.map((req, i) => (
                      <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-900/60 border border-rose-700/50 text-rose-100">
                        Pendente: {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {onResolveRequirements && (
              <button
                type="button"
                onClick={onResolveRequirements}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-rose-900/40 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Resolver Pendências</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Barra de Progresso */}
        {progress > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-xs font-mono text-cyan-300 mb-1">
              <span>Progresso na Esteira Oficial:</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback para os 4 passos clássicos caso pipeline estruturado não seja passado
  const classicStages: {
    key: PipelineStage;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { key: 'RECEBIDO', label: '1. Recebido', description: 'Ingestão de dados contratuais e fontes reais', icon: Inbox },
    { key: 'PROCESSANDO', label: '2. Processando', description: 'Varredura analítica, auditoria e correlações', icon: Cpu },
    { key: 'VALIDANDO', label: '3. Validando', description: 'Conformidade LGPD, integridade e checagem cruzada', icon: ShieldCheck },
    { 
      key: isBlocked ? 'BLOQUEADO' : 'PRONTO', 
      label: isBlocked ? '4. Bloqueado' : '4. Pronto', 
      description: isBlocked ? 'Requisitos contratuais ausentes' : 'Laudo oficial assinado e liberado', 
      icon: isBlocked ? AlertOctagon : CheckCircle2 
    }
  ];

  const getStageIndex = (stage: string): number => {
    switch (stage) {
      case 'RECEBIDO': return 0;
      case 'PROCESSANDO': return 1;
      case 'VALIDANDO': return 2;
      case 'PRONTO':
      case 'BLOQUEADO': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStageId);

  return (
    <div className={`rounded-2xl bg-slate-900/90 border ${isBlocked ? 'border-rose-500/40 shadow-rose-950/20' : 'border-slate-800'} p-4 sm:p-5 text-white shadow-xl backdrop-blur-md transition-all ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${isBlocked ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isBlocked ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-mono font-semibold tracking-wider text-slate-400 uppercase">
              Esteira Padronizada de Validação AOS
            </div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {serviceContract?.serviceName || 'Serviço Operacional Velatrix'}
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Protocolo Anti-Slop / Zero-Ficção
              </span>
            </h4>
          </div>
        </div>

        {serviceContract && (
          <button
            type="button"
            onClick={() => setShowContractDetails(!showContractDetails)}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-cyan-500/30 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Contrato de Entrada: Dados 100% Reais</span>
            {showContractDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
        {classicStages.map((st, idx) => {
          const Icon = st.icon;
          const isCompleted = idx < currentIndex || (currentStageId === 'PRONTO' && idx === 3);
          const isCurrent = idx === currentIndex && currentStageId !== 'PRONTO';
          const isBlockedStage = isBlocked && idx === 3;

          let badgeBg = 'bg-slate-800/90 text-slate-500 border-slate-700';
          let dotColor = 'bg-slate-700';
          let cardBg = 'bg-slate-950/40 border-slate-800/80';

          if (isCompleted) {
            badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
            dotColor = 'bg-emerald-500';
            cardBg = 'bg-emerald-950/10 border-emerald-800/30';
          } else if (isCurrent) {
            badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/10 animate-pulse';
            dotColor = 'bg-cyan-400';
            cardBg = 'bg-cyan-950/20 border-cyan-800/40';
          } else if (isBlockedStage) {
            badgeBg = 'bg-rose-500/20 text-rose-400 border-rose-500/50';
            dotColor = 'bg-rose-500';
            cardBg = 'bg-rose-950/20 border-rose-800/50';
          }

          return (
            <div 
              key={st.key}
              className={`p-3 rounded-xl border ${cardBg} transition-all duration-200 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badgeBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              </div>

              <div>
                <div className={`text-xs font-bold ${isBlockedStage ? 'text-rose-400' : isCurrent ? 'text-cyan-300' : isCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {st.label}
                </div>
                {!compact && (
                  <div className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {st.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isBlocked && (
        <div className="mt-4 p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                Execução Bloqueada por Não-Conformidade Contratual
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5 leading-relaxed">
                {blockedMsg || 'Requisitos mandatórios do contrato de entrada não foram atendidos.'}
              </p>
            </div>
          </div>

          {onResolveRequirements && (
            <button
              type="button"
              onClick={onResolveRequirements}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs tracking-wide transition-all shadow-lg shadow-rose-900/40 flex items-center gap-1.5 shrink-0"
            >
              <span>Resolver Pendências</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
