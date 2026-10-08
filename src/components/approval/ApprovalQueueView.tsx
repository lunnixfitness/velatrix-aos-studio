import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, Undo2, XCircle, Eye, Lock, FileSearch, History, AlertTriangle, UserCheck, RefreshCw } from 'lucide-react';
import { SubTabBar } from '../console/SubTabBar';
import { useAuth } from '../../context/AuthContext';
import { formatBRL } from '../../enterprise/deterministicEngine.ts';
import { podeAprovarEsteira } from '../../enterprise/approvalPolicy.ts';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import {
  subscribe, getSnapshot, inicializar, isReady, getErro, recarregar, carregarTrilha, revisar, aprovarEExecutar, devolverItem, rejeitarItem,
  reenviarParaRevisao, diffDesdeRevisao, necessarias, type QueueEntry,
} from '../../services/approvalQueueService';

const ESTEIRA_LABEL: Record<string, string> = {
  RECUPERACAO_TRIBUTARIA: 'Recuperação Tributária', PERICIA_JUDICIAL: 'Perícia Judicial', INSS: 'Especialista INSS',
  INSS_OBRAS: 'INSS-Obras', PRECATORIA: 'Precatória', DIAGNOSTICO: 'Diagnóstico',
};
const TIPO_LABEL: Record<string, string> = { GERAR_LAUDO_FINAL: 'Gerar laudo final', EXPORTAR_PACOTE_PROTOCOLO: 'Exportar pacote de protocolo' };
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Devolvido ao agente', READY_FOR_REVIEW: 'Pronto para revisão', APPROVED: 'Aprovado', EXECUTING: 'Executando',
  DONE: 'Executado', REJECTED: 'Rejeitado', FAILED: 'Falhou',
};
const EVENTO_LABEL: Record<string, string> = {
  WI_CRIADO: 'Criado', WI_SUBMETIDO: 'Enviado para revisão', WI_REVISADO: 'Revisado', WI_PAYLOAD_ALTERADO: 'Conteúdo recalculado',
  WI_APROVACAO_PARCIAL: 'Aprovação (1ª de 2)', WI_APROVADO: 'Aprovado', WI_DEVOLVIDO: 'Devolvido', WI_REJEITADO: 'Rejeitado',
  WI_EXECUTANDO: 'Execução iniciada', WI_EXECUTADO: 'Executado', WI_FALHOU: 'Falhou', WI_INTEGRIDADE_VIOLADA: 'Integridade violada',
  SELO_EMITIDO: 'Selo emitido',
};

const FlagChip: React.FC<{ flag: string }> = ({ flag }) => {
  const map: Record<string, string> = {
    GREEN: 'bg-good-soft text-good', YELLOW: 'bg-warn-soft text-warn', RED: 'bg-crit-soft text-crit', NAO_AVALIADO: 'bg-surface text-ink-mute border border-hairline',
  };
  const label: Record<string, string> = { GREEN: 'Risco verde', YELLOW: 'Risco amarelo', RED: 'Risco vermelho', NAO_AVALIADO: 'Não avaliado' };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[flag]}`}>{label[flag]}</span>;
};

const Hash: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[11px] text-ink-mute">{label}</span>
    <code className="font-mono text-[11.5px] text-ink-2 truncate" title={value}>{value ? `${value.slice(0, 16)}…${value.slice(-6)}` : '—'}</code>
  </div>
);

type Modal =
  | { kind: 'stepup'; id: string }
  | { kind: 'devolver'; id: string }
  | { kind: 'rejeitar'; id: string }
  | null;

export interface ApprovalQueueViewProps {
  /** Quando informado, mostra só os itens desta esteira */
  esteira?: string;
  activeSubTab?: string;
  onSubTabChange?: (id: string) => void;
}

export const ApprovalQueueView: React.FC<ApprovalQueueViewProps> = ({ esteira, activeSubTab, onSubTabChange }) => {
  const todos = useSyncExternalStore(subscribe, getSnapshot);
  const entries = useMemo(() => (esteira ? todos.filter((e) => e.item.esteira === esteira) : todos), [todos, esteira]);
  const { currentUser } = useAuth();
  const [localTab, setLocalTab] = useState('prontos');
  const tab = activeSubTab ?? localTab;
  const setTab = onSubTabChange ?? setLocalTab;
  const [modal, setModal] = useState<Modal>(null);
  const [texto, setTexto] = useState('');
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => { if (!isReady()) void inicializar(); }, []);

  const grupos = useMemo(() => ({
    prontos: entries.filter((e) => e.item.status === 'READY_FOR_REVIEW' && e.item.aprovacoes.length === 0),
    segundo: entries.filter((e) => e.item.status === 'READY_FOR_REVIEW' && e.item.aprovacoes.length > 0),
    concluidos: entries.filter((e) => ['APPROVED', 'EXECUTING', 'DONE'].includes(e.item.status)),
    devolvidos: entries.filter((e) => ['DRAFT', 'REJECTED', 'FAILED'].includes(e.item.status)),
  }), [entries]);
  const lista = grupos[tab as keyof typeof grupos] ?? grupos.prontos;

  const run = async (fn: () => Promise<unknown>, okMsg?: string) => {
    setOcupado(true); setAviso(null);
    try { const r = await fn(); setAviso({ tipo: 'ok', msg: okMsg ?? (r as { mensagem?: string })?.mensagem ?? 'Feito.' }); return true; }
    catch (e) {
      setAviso({ tipo: 'erro', msg: (e as Error).message });
      // Estado pode ter mudado no servidor (ex.: outra pessoa aprovou): ressincroniza.
      void recarregar().catch(() => undefined);
      return false;
    }
    finally { setOcupado(false); }
  };

  const confirmarModal = async () => {
    if (!modal) return;
    if (!texto.trim()) {
      setAviso({ tipo: 'erro', msg: modal.kind === 'stepup' ? 'Informe sua senha.' : 'Escreva o comentário.' });
      return;
    }
    const ok = modal.kind === 'stepup'
      ? await run(() => aprovarEExecutar(modal.id, texto))
      : modal.kind === 'devolver'
        ? await run(() => devolverItem(modal.id, texto), 'Item devolvido ao agente com comentário.')
        : await run(() => rejeitarItem(modal.id, texto), 'Item rejeitado.');
    if (ok) { setModal(null); setTexto(''); }
  };

  /** Só para habilitar botões — quem decide é o servidor. */
  const podeAprovar = (e: QueueEntry) => {
    if (!currentUser) return 'Sessão expirada';
    if (!podeAprovarEsteira(currentUser.role, e.item.esteira)) return `Seu perfil não aprova ${ESTEIRA_LABEL[e.item.esteira] ?? e.item.esteira}`;
    if (e.item.aprovacoes.some((a) => a.userId === currentUser.id)) return 'Você já aprovou — falta outra pessoa';
    return null;
  };

  const abrirTrilha = (id: string) => {
    const abrir = aberto !== id;
    setAberto(abrir ? id : null);
    if (abrir) void carregarTrilha(id).catch((err) => setAviso({ tipo: 'erro', msg: (err as Error).message }));
  };

  const erroCarga = getErro();

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-semibold text-ink tracking-tight">Fila de Aprovação</h2>
            {IS_DEMO_MODE && <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded bg-warn-soft text-warn" title="Itens de exemplo. As regras e o registro rodam no servidor.">DEMO</span>}
          </div>
          <p className="text-[13.5px] text-ink-mute max-w-3xl">Os agentes preparam; o profissional habilitado decide. Nada é protocolado, transmitido, pago ou emitido sem aprovação registrada.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-hairline bg-surface text-[12.5px] text-ink-2" title="A aprovação usa a sua sessão. Para o 4 olhos, a segunda aprovação precisa de outro login.">
            <UserCheck className="w-4 h-4 text-ink-mute" />
            <span>Aprovando como <span className="font-semibold text-ink">{currentUser?.name ?? '—'}</span></span>
          </div>
          <button type="button" onClick={() => run(() => recarregar(), 'Fila atualizada.')} disabled={ocupado}
            className="h-10 w-10 rounded-lg border border-hairline-strong bg-canvas text-ink-mute hover:text-ink flex items-center justify-center disabled:opacity-50" aria-label="Atualizar fila">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SubTabBar
        tabs={[
          { id: 'prontos', label: 'Prontos para revisão', count: grupos.prontos.length },
          { id: 'segundo', label: 'Aguardando 2º aprovador', count: grupos.segundo.length },
          { id: 'concluidos', label: 'Aprovados e executados', count: grupos.concluidos.length },
          { id: 'devolvidos', label: 'Devolvidos e rejeitados', count: grupos.devolvidos.length },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      {aviso && (
        <div role="status" className={`flex items-start gap-2 px-4 py-3 rounded-lg text-[13px] border ${aviso.tipo === 'ok' ? 'bg-good-soft border-good/20 text-good' : 'bg-crit-soft border-crit/20 text-crit'}`}>
          {aviso.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{aviso.msg}</span>
        </div>
      )}
      {erroCarga && (
        <div role="alert" className="flex items-start gap-2 px-4 py-3 rounded-lg text-[13px] border bg-crit-soft border-crit/20 text-crit">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>Não foi possível carregar a fila do servidor: {erroCarga}</span>
        </div>
      )}

      {!isReady() && <div className="text-[13px] text-ink-mute">Carregando fila do servidor…</div>}
      {isReady() && lista.length === 0 && (
        <div className="py-14 text-center border border-dashed border-hairline-strong rounded-xl text-[13px] text-ink-mute">Nenhum item nesta etapa.</div>
      )}

      <div className="grid gap-4">
        {lista.map((e) => {
          const diff = diffDesdeRevisao(e);
          const hashMudou = !!e.item.hashRevisado && e.item.hashRevisado !== e.item.payloadHash;
          const bloqueio = podeAprovar(e);
          const req = necessarias(e.item);
          const emRevisao = e.item.status === 'READY_FOR_REVIEW';
          const g = e.guardrail;
          const bloqueadoGuardrail = g?.status === 'BLOQUEADO';
          return (
            <article key={e.item.id} className="bg-canvas border border-hairline rounded-xl p-5 space-y-4">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-mute">
                    <code className="font-mono text-ink-2" title={e.item.id}>{e.ref ?? e.item.id.slice(0, 8)}</code>
                    <span>·</span><span>{ESTEIRA_LABEL[e.item.esteira]}</span>
                    <span>·</span><span>{TIPO_LABEL[e.item.tipo]}</span>
                    {e.item.criadoPorAgente && <><span>·</span><span>Agente {e.item.criadoPorAgente}</span></>}
                  </div>
                  <h3 className="text-[16px] font-semibold text-ink">{e.payload.titulo ?? 'Item sem título'}</h3>
                  <div className="text-[12.5px] text-ink-mute">{e.payload.cliente}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <FlagChip flag={e.item.riscoFlag} />
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent-soft text-accent">{STATUS_LABEL[e.item.status]}</span>
                  </div>
                  <span className="font-mono text-[18px] font-semibold text-ink">{formatBRL(e.item.valorEnvolvidoCentavos)}</span>
                  {emRevisao && <span className="text-[11.5px] text-ink-mute">{e.item.aprovacoes.length}/{req} aprovação(ões){req === 2 ? ' · 4 olhos' : ''}</span>}
                </div>
              </header>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(e.payload.metricas ?? []).map((m) => (
                  <div key={m.rotulo} className="bg-surface rounded-lg px-3 py-2.5">
                    <div className="text-[11px] text-ink-mute">{m.rotulo}</div>
                    <div className="text-[14px] font-semibold text-ink">{m.valor}</div>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <Hash label="Hash do payload (SHA-256)" value={e.item.payloadHash} />
                <Hash label="Hash da memória de cálculo" value={e.item.memoriaCalculoHash} />
                <Hash label="Hash revisado" value={e.item.hashRevisado} />
              </div>

              {g && (
                <div className={`rounded-lg border px-4 py-3 space-y-1.5 ${!bloqueadoGuardrail ? 'border-good/25 bg-good-soft/50' : 'border-crit/25 bg-crit-soft/60'}`}>
                  <div className={`flex items-center gap-2 text-[12.5px] font-semibold ${!bloqueadoGuardrail ? 'text-good' : 'text-crit'}`}>
                    {!bloqueadoGuardrail ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    Guardrail: {!bloqueadoGuardrail ? 'valores e citações rastreáveis' : 'texto bloqueado'}
                  </div>
                  {g.valoresNaoRastreados.length > 0 && <div className="text-[12px] text-ink-2">Valores sem origem no cálculo: {g.valoresNaoRastreados.join(', ')}</div>}
                  {g.percentuaisNaoRastreados.length > 0 && <div className="text-[12px] text-ink-2">Percentuais sem origem: {g.percentuaisNaoRastreados.join(', ')}</div>}
                  {g.citacoesDesconhecidas.length > 0 && <div className="text-[12px] text-ink-2">Citações fora da base normativa: {g.citacoesDesconhecidas.join(', ')}</div>}
                  {g.citacoesNaoVigentes.length > 0 && <div className="text-[12px] text-ink-2">Citações fora de vigência: {g.citacoesNaoVigentes.join(', ')}</div>}
                </div>
              )}

              {hashMudou && (
                <div className="rounded-lg border border-warn/30 bg-warn-soft/60 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-warn"><AlertTriangle className="w-4 h-4" /> O conteúdo mudou depois da revisão</div>
                  <table className="w-full text-[12px]">
                    <thead><tr className="text-ink-mute text-left"><th className="font-medium py-1">Campo</th><th className="font-medium">Antes</th><th className="font-medium">Agora</th></tr></thead>
                    <tbody>{diff.map((d) => <tr key={d.campo} className="border-t border-warn/15"><td className="py-1 text-ink-2">{d.campo}</td><td className="font-mono text-ink-mute">{d.antes}</td><td className="font-mono text-ink">{d.depois}</td></tr>)}</tbody>
                  </table>
                </div>
              )}

              {e.resultadoExecucao && (
                <div className="rounded-lg border border-hairline bg-surface px-4 py-3 text-[12.5px] text-ink-2 space-y-1">
                  <div className="font-semibold text-ink">{e.resultadoExecucao.resumo}</div>
                  {e.resultadoExecucao.hash && <div>Selo / hash: <code className="font-mono break-all">{e.resultadoExecucao.hash}</code></div>}
                  <div>Carimbo do tempo: {e.resultadoExecucao.carimbo}</div>
                </div>
              )}
              {e.item.motivoRejeicao && <div className="text-[12.5px] text-ink-2"><span className="text-ink-mute">Comentário: </span>{e.item.motivoRejeicao}</div>}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {emRevisao && (
                  <>
                    {(!e.item.hashRevisado || hashMudou) && (
                      <button type="button" disabled={ocupado || !!bloqueio && !bloqueio.startsWith('Você já')} onClick={() => run(() => revisar(e.item.id), 'Revisão registrada com o hash atual.')}
                        className="h-10 px-4 rounded-lg border border-accent text-accent text-[13px] font-semibold bg-canvas hover:bg-accent-tint disabled:opacity-50 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> {hashMudou ? 'Revisar novamente' : 'Marcar como revisado'}
                      </button>
                    )}
                    <button type="button" disabled={ocupado || !!bloqueio || bloqueadoGuardrail || !e.item.hashRevisado || hashMudou}
                      title={bloqueio ?? (bloqueadoGuardrail ? 'Guardrail bloqueou o texto' : !e.item.hashRevisado ? 'Revise antes de aprovar' : hashMudou ? 'Revise a nova versão' : '')}
                      onClick={() => { setTexto(''); setModal({ kind: 'stepup', id: e.item.id }); }}
                      className="h-10 px-4 rounded-lg bg-accent text-[#FFFFFF] text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Aprovar e Executar
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => { setTexto(''); setModal({ kind: 'devolver', id: e.item.id }); }}
                      className="h-10 px-4 rounded-lg border border-hairline-strong text-ink-2 text-[13px] font-medium bg-canvas hover:bg-surface flex items-center gap-2">
                      <Undo2 className="w-4 h-4" /> Devolver com comentário
                    </button>
                    <button type="button" disabled={ocupado} onClick={() => { setTexto(''); setModal({ kind: 'rejeitar', id: e.item.id }); }}
                      className="h-10 px-4 rounded-lg border border-hairline-strong text-crit text-[13px] font-medium bg-canvas hover:bg-crit-soft flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </button>
                    {bloqueio && <span className="text-[12px] text-ink-mute">{bloqueio}</span>}
                  </>
                )}
                {e.item.status === 'DRAFT' && (
                  <button type="button" disabled={ocupado} onClick={() => run(() => reenviarParaRevisao(e.item.id), 'Rascunho reenviado para revisão.')}
                    className="h-10 px-4 rounded-lg border border-hairline-strong text-ink-2 text-[13px] font-medium bg-canvas hover:bg-surface">Reenviar para revisão</button>
                )}
                <button type="button" onClick={() => abrirTrilha(e.item.id)}
                  className="h-10 px-3 rounded-lg text-ink-mute text-[12.5px] hover:text-ink flex items-center gap-1.5 ml-auto">
                  <History className="w-4 h-4" /> Trilha e memória
                </button>
              </div>

              {aberto === e.item.id && (
                <div className="grid md:grid-cols-2 gap-4 border-t border-hairline pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"><FileSearch className="w-3.5 h-3.5" /> Memória de cálculo</div>
                    {(e.payload.memoriaCalculo ?? []).map((l) => <div key={l.linha} className="flex justify-between text-[12.5px]"><span className="text-ink-2">{l.linha}</span><span className="font-mono text-ink">{formatBRL(l.valorCentavos)}</span></div>)}
                    <div className="text-[12px] text-ink-mute pt-2">Texto do laudo (LLM, validado pelo guardrail no servidor):</div>
                    <p className="text-[12.5px] text-ink-2 bg-surface rounded-lg p-3">{e.payload.textoLaudo ?? ''}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-ink"><History className="w-3.5 h-3.5" /> Trilha encadeada (servidor)</div>
                    {!e.trilha && <div className="text-[12px] text-ink-mute">Carregando…</div>}
                    <ol className="space-y-1.5">
                      {e.trilha?.map((t) => (
                        <li key={t.hash} className="text-[12px]">
                          <div className="text-ink-2"><span className="font-semibold">{EVENTO_LABEL[t.tipo] ?? t.tipo}</span> · {t.ator} · {new Date(t.em).toLocaleString('pt-BR')}</div>
                          <code className="font-mono text-[10.5px] text-ink-soft">#{t.seq} {t.hash.slice(0, 20)}…</code>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 bg-ink/30 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-canvas rounded-xl border border-hairline shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-semibold text-ink">
              {modal.kind === 'stepup' ? 'Confirme sua identidade' : modal.kind === 'devolver' ? 'Devolver com comentário' : 'Rejeitar item'}
            </h3>
            {modal.kind === 'stepup' ? (
              <>
                <p className="text-[13px] text-ink-mute">Para aprovar e executar, digite sua senha de acesso. A confirmação é validada no servidor e vale por 5 minutos.</p>
                <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">Senha
                  <input type="password" autoComplete="current-password" autoFocus value={texto} onChange={(ev) => setTexto(ev.target.value)}
                    onKeyDown={(ev) => { if (ev.key === 'Enter') void confirmarModal(); }}
                    className="h-11 px-3 rounded-lg border border-hairline-strong bg-canvas text-[14px] font-normal" />
                </label>
              </>
            ) : (
              <label className="flex flex-col gap-1 text-[12.5px] font-medium text-ink-2">{modal.kind === 'devolver' ? 'Comentário para o agente' : 'Motivo da rejeição'}
                <textarea autoFocus rows={4} value={texto} onChange={(ev) => setTexto(ev.target.value)} className="px-3 py-2 rounded-lg border border-hairline-strong bg-canvas text-[13.5px] font-normal" />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setModal(null); setTexto(''); }} className="h-10 px-4 rounded-lg border border-hairline-strong text-[13px] text-ink-2">Cancelar</button>
              <button type="button" disabled={ocupado} onClick={confirmarModal} className={`h-10 px-4 rounded-lg text-[#FFFFFF] text-[13px] font-semibold disabled:opacity-50 ${modal.kind === 'rejeitar' ? 'bg-crit' : 'bg-accent'}`}>
                {modal.kind === 'stepup' ? 'Confirmar e executar' : modal.kind === 'devolver' ? 'Devolver' : 'Rejeitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueueView;
