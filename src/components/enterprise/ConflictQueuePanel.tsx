import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { ShieldAlert, ShieldCheck, Lock, CheckCircle2, XCircle, HelpCircle, RefreshCw, Fingerprint, History, Ban, ArrowLeft, Circle } from 'lucide-react';
import { SubTabBar } from '../console/SubTabBar';
import { useAuth } from '../../context/AuthContext';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { ROTULO_NIVEL, ROTULO_MATCH, ROTULO_ACAO, type NivelRisco } from '../../enterprise/conflictCheck.ts';
import {
  motivoBloqueio, etapaAtual, ehTerminal, exigeChineseWall, podeAbrirEsteira, JUSTIFICATIVA_MIN, ROLE_DECIDE_CONFLITO,
  ROTULO_ETAPA, ROTULO_STATUS_CASO, type CasoConflito, type Decisor, type StatusCaso, type TipoDecisao,
} from '../../enterprise/conflictApproval.ts';
import { subscribe, getSnapshot, decidirCaso, cienciaCaso, cancelarCaso, verificarCadeia, registrarAcessoNegado } from '../../services/conflictCaseStore.ts';
import { barreirasVigentes, avaliarAcesso, decisorDeMembro, type MembroRef } from '../../enterprise/chineseWall.ts';

/**
 * Central Enterprise · Conflict Check · Painel do Sócio (P18).
 * Fila de casos de conflito: decisão por etapa (sócio da área → comitê no CRÍTICO), Chinese Wall,
 * pedido de informação, ciência de risco médio e trilha de eventos encadeada em SHA-256.
 */

const PENDENTES: StatusCaso[] = ['REQUIRES_APPROVAL', 'INFO_REQUESTED', 'AGUARDANDO_CIENCIA'];

/**
 * Só na demo: o cadastro demo não tem sócio-diretor/comitê com registro profissional,
 * então estas duas personas fictícias cobrem a etapa do Comitê. As demais opções são membros REAIS do tenant.
 */
const PERSONAS_DEMO: Decisor[] = [
  { userId: 'demo-socio-dir', nome: 'Dr. Roberto Alves · sócio-diretor', role: 'c_level_approver', registroProfissional: { conselho: 'OAB', numero: 'DEMO-0002' }, equipe: 'Diretoria' },
  { userId: 'demo-compliance', nome: 'Helena Prado · Comitê de Compliance', role: 'tenant_admin', registroProfissional: { conselho: 'OAB', numero: 'DEMO-0003' }, equipe: 'Compliance' },
];

const NIVEL_CLS: Record<NivelRisco, string> = {
  CRITICO: 'bg-crit-soft text-crit border-crit/25', ALTO: 'bg-warn-soft text-warn border-warn/25',
  MEDIO: 'bg-accent-soft text-accent border-accent/25', BAIXO: 'bg-good-soft text-good border-good/25',
};
const STATUS_CLS: Record<StatusCaso, string> = {
  CLEAR: 'bg-good-soft text-good', CLEAR_WITH_NOTICE: 'bg-good-soft text-good', APPROVED: 'bg-good-soft text-good',
  APPROVED_WITH_CHINESE_WALL: 'bg-good-soft text-good', AGUARDANDO_CIENCIA: 'bg-accent-soft text-accent',
  REQUIRES_APPROVAL: 'bg-warn-soft text-warn', INFO_REQUESTED: 'bg-accent-soft text-accent',
  REJECTED: 'bg-crit-soft text-crit', CANCELLED: 'bg-surface text-ink-mute',
};

const input = 'h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal';
const curto = (h?: string) => (h ? `${h.slice(0, 10)}…${h.slice(-6)}` : '—');
const dataBR = (iso: string) => new Date(iso).toLocaleString('pt-BR');

export const contarPendentes = (casos: CasoConflito[]) => casos.filter((c) => PENDENTES.includes(c.status)).length;

interface Props { onRetomar: (c: CasoConflito) => void; abrirId?: string | null; membros: MembroRef[]; membroAtual?: MembroRef }

export const ConflictQueuePanel: React.FC<Props> = ({ onRetomar, abrirId, membros, membroAtual }) => {
  const casos = useSyncExternalStore(subscribe, getSnapshot);
  const { currentUser } = useAuth();
  const barreiras = useMemo(() => barreirasVigentes(casos), [casos]);
  const quem = { id: currentUser?.id ?? 'anon', equipe: membroAtual?.department };
  const [negado, setNegado] = useState<string | null>(null);
  const abrir = (id: string) => {
    const a = avaliarAcesso(quem, { casoId: id }, barreiras);
    if (a.permitido) { setNegado(null); setAberto(id); return; }
    registrarAcessoNegado({ userId: quem.id, nome: currentUser?.name ?? '—', casoId: id, barreiraId: a.barreiraId, motivo: a.motivo });
    setNegado(`${id}: acesso negado — ${a.motivo}. A tentativa foi registrada na auditoria.`);
  };
  const [tab, setTab] = useState<'pendentes' | 'decididos'>('pendentes');
  const [aberto, setAberto] = useState<string | null>(abrirId ?? null);

  const pend = casos.filter((c) => PENDENTES.includes(c.status));
  const dec = casos.filter((c) => !PENDENTES.includes(c.status));
  const lista = tab === 'pendentes' ? pend : dec;
  const caso = aberto ? casos.find((c) => c.id === aberto) : undefined;
  const casoLiberado = caso && avaliarAcesso(quem, { casoId: caso.id }, barreiras).permitido;

  if (caso && casoLiberado) return <CasoDetalhe caso={caso} voltar={() => setAberto(null)} onRetomar={onRetomar} membros={membros} membroAtual={membroAtual} />;

  return (
    <div className="space-y-4">
      <SubTabBar
        tabs={[{ id: 'pendentes', label: 'Pendentes', count: pend.length }, { id: 'decididos', label: 'Decididos / liberados', count: dec.length }]}
        activeTab={tab}
        onTabChange={(id) => setTab(id as 'pendentes' | 'decididos')}
      />
      {negado && <div className="rounded-lg bg-crit-soft text-crit px-3 py-2 text-[12.5px] inline-flex items-center gap-1.5"><Lock className="w-4 h-4" /> {negado}</div>}
      <div className="border border-hairline rounded-xl overflow-hidden bg-canvas">
        <div className="hidden md:grid grid-cols-[150px_minmax(0,2fr)_110px_minmax(0,1.2fr)_150px] gap-4 px-5 py-2.5 bg-surface border-b border-hairline text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
          <span>Caso</span><span>Matéria</span><span>Risco</span><span>Situação</span><span>Atualizado</span>
        </div>
        {lista.length === 0 && (
          <div className="px-5 py-8 text-center text-[13px] text-ink-mute">
            {tab === 'pendentes' ? 'Nada aguardando decisão. Rode uma checagem e envie para o Painel do Sócio.' : 'Nenhum caso decidido ainda.'}
          </div>
        )}
        {lista.map((c) => {
          const et = etapaAtual(c);
          const acesso = avaliarAcesso(quem, { casoId: c.id }, barreiras);
          if (!acesso.permitido) return (
            <button key={c.id} onClick={() => abrir(c.id)}
              className="w-full text-left grid md:grid-cols-[150px_minmax(0,2fr)_minmax(0,1.5fr)] gap-2 md:gap-4 px-5 py-3.5 border-b border-hairline last:border-b-0 text-[13px] bg-surface">
              <span className="font-mono text-[12px] text-ink-mute">{c.id}</span>
              <span className="text-ink-mute inline-flex items-center gap-1.5"><Lock className="w-4 h-4 text-warn" /> Conteúdo restrito por Chinese Wall</span>
              <span className="text-[11.5px] text-ink-mute">{acesso.barreiraId}</span>
            </button>
          );
          return (
            <button key={c.id} onClick={() => abrir(c.id)}
              className="w-full text-left grid md:grid-cols-[150px_minmax(0,2fr)_110px_minmax(0,1.2fr)_150px] gap-2 md:gap-4 px-5 py-3.5 border-b border-hairline last:border-b-0 text-[13px] hover:bg-surface">
              <span className="font-mono text-[12px] text-ink">{c.id}{c.versao > 1 ? ` · v${c.versao}` : ''}</span>
              <span className="min-w-0">
                <span className="block text-ink font-medium truncate">{c.solicitacao.descricao}</span>
                <span className="block text-[11.5px] text-ink-mute truncate">{c.solicitacao.area} · {c.solicitacao.alvos.map((a) => a.nome).join(' × ')}</span>
              </span>
              <span><span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${NIVEL_CLS[c.resultado.nivel]}`}>{ROTULO_NIVEL[c.resultado.nivel]} · {c.resultado.scoreMax}</span></span>
              <span className="min-w-0">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STATUS_CLS[c.status]}`}>{ROTULO_STATUS_CASO[c.status]}</span>
                {c.status === 'REQUIRES_APPROVAL' && et && <span className="block text-[11.5px] text-ink-mute mt-1">Etapa: {ROTULO_ETAPA[et]}</span>}
              </span>
              <span className="text-[12px] text-ink-2">{dataBR(c.atualizadoEm)}</span>
            </button>
          );
        })}
      </div>
      <p className="text-[11.5px] text-ink-mute">Casos guardados neste navegador até o backend entrar. Cada evento é encadeado em SHA-256.</p>
    </div>
  );
};

const CasoDetalhe: React.FC<{ caso: CasoConflito; voltar: () => void; onRetomar: (c: CasoConflito) => void; membros: MembroRef[]; membroAtual?: MembroRef }> = ({ caso: c, voltar, onRetomar, membros, membroAtual }) => {
  const { currentUser } = useAuth();
  // Identidade real: registro profissional e equipe vêm do cadastro do membro (P19).
  const eu: Decisor = membroAtual
    ? decisorDeMembro({ ...membroAtual, id: currentUser?.id ?? membroAtual.id, name: currentUser?.name ?? membroAtual.name, role: String(currentUser?.role ?? membroAtual.role) })
    : { userId: currentUser?.id ?? 'anon', nome: currentUser?.name ?? '—', role: String(currentUser?.role ?? '') };
  const membrosDecisores = membros
    .filter((m) => m.id !== eu.userId && (ROLE_DECIDE_CONFLITO[m.role] ?? []).length > 0)
    .map(decisorDeMembro);
  const opcoes = IS_DEMO_MODE ? [eu, ...membrosDecisores, ...PERSONAS_DEMO] : [eu];
  const demoIds = new Set(PERSONAS_DEMO.map((p) => p.userId));
  const [decisorId, setDecisorId] = useState((opcoes.find((o) => !motivoBloqueio(c, o)) ?? opcoes[0]).userId);
  const decisor = opcoes.find((o) => o.userId === decisorId) ?? eu;
  const souSolicitante = eu.userId === c.solicitanteId;

  const [just, setJust] = useState('');
  const [revisei, setRevisei] = useState(false);
  const [usarCW, setUsarCW] = useState(false);
  const [cwDesc, setCwDesc] = useState('');
  const areasHits = useMemo(() => [...new Set(c.resultado.hits.map((h) => h.materia?.area).filter(Boolean) as string[])], [c]);
  const [cwEquipes, setCwEquipes] = useState<string[]>([]);
  const [cwUsuarios, setCwUsuarios] = useState('');
  const [motivoCancel, setMotivoCancel] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; t: string } | null>(null);
  const [cadeia, setCadeia] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const bloqueio = motivoBloqueio(c, decisor);
  const et = etapaAtual(c);
  const precisaCW = exigeChineseWall(c.resultado) && !c.chineseWall;

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true); setMsg(null);
    try { await fn(); setMsg({ tipo: 'ok', t: ok }); setJust(''); setRevisei(false); setUsarCW(false); }
    catch (e) { setMsg({ tipo: 'erro', t: (e as Error).message }); }
    finally { setOcupado(false); }
  };

  const decidirTipo = (tipo: TipoDecisao) => {
    const t: TipoDecisao = tipo === 'APROVAR' && usarCW ? 'APROVAR_COM_CW' : tipo;
    const rotulo = { APROVAR: 'Etapa aprovada.', APROVAR_COM_CW: 'Chinese Wall registrada e etapa aprovada.', RECUSAR: 'Intake recusado.', PEDIR_INFO: 'Informação solicitada ao responsável.' }[t];
    return run(() => decidirCaso(c.id, decisor, {
      tipo: t, justificativa: just, hashExibido: revisei ? c.seloResultado : '',
      chineseWall: t === 'APROVAR_COM_CW' ? {
        id: `CW-${c.id}`, descricao: cwDesc, equipesBloqueadas: cwEquipes,
        usuariosBloqueados: cwUsuarios.split(',').map((s) => s.trim()).filter(Boolean),
        materiasIsoladas: [...new Set(c.resultado.hits.map((h) => h.materia?.id).filter(Boolean) as string[])],
      } : undefined,
    }), rotulo);
  };

  return (
    <div className="space-y-4">
      <button onClick={voltar} className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-ink"><ArrowLeft className="w-4 h-4" /> Voltar à fila</button>

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[13px] text-ink font-semibold">{c.id}</span>
              {c.versao > 1 && <span className="text-[11px] font-mono text-ink-mute">v{c.versao}</span>}
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STATUS_CLS[c.status]}`}>{ROTULO_STATUS_CASO[c.status]}</span>
              {podeAbrirEsteira(c) && <span className="text-[11px] font-semibold text-good inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Esteira liberada</span>}
            </div>
            <div className="text-[15px] font-semibold text-ink">{c.solicitacao.descricao}</div>
            <div className="text-[12px] text-ink-mute">Solicitante: {c.solicitanteNome} · {c.solicitacao.area} · aberto em {dataBR(c.criadoEm)}</div>
          </div>
          <div className={`rounded-lg border px-4 py-2 text-right ${NIVEL_CLS[c.resultado.nivel]}`}>
            <div className="text-[11px] font-semibold uppercase">Risco {ROTULO_NIVEL[c.resultado.nivel]}</div>
            <div className="font-mono text-[22px] font-semibold">{c.resultado.scoreMax}</div>
          </div>
        </div>

        {c.etapas.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {c.etapas.map((e, i) => {
              const d = c.decisoes.find((x) => x.etapa === e && (x.tipo === 'APROVAR' || x.tipo === 'APROVAR_COM_CW'));
              const atual = e === et && c.status === 'REQUIRES_APPROVAL';
              return (
                <React.Fragment key={e}>
                  {i > 0 && <span className="text-ink-mute">→</span>}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[12px] ${d ? 'border-good/25 bg-good-soft text-good' : atual ? 'border-warn/25 bg-warn-soft text-warn' : 'border-hairline text-ink-mute'}`}>
                    {d ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                    {ROTULO_ETAPA[e]}{d ? ` · ${d.nome.split('·')[0].trim()}` : atual ? ' · aguardando' : ''}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        )}
        <div className="text-[12px] text-ink-2">{ROTULO_ACAO[c.resultado.acao]}</div>
      </div>

      {/* Correspondências */}
      <div className="border border-hairline rounded-xl overflow-hidden bg-canvas">
        <div className="px-5 py-2.5 bg-surface border-b border-hairline text-[11px] font-semibold uppercase tracking-wide text-ink-mute">Conflitos encontrados ({c.resultado.hits.length})</div>
        {c.resultado.hits.length === 0 && <div className="px-5 py-5 text-[13px] text-ink-mute">Nenhuma correspondência significativa.</div>}
        {c.resultado.hits.map((h, i) => (
          <div key={i} className="px-5 py-3 border-b border-hairline last:border-b-0 text-[12.5px] grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_120px] gap-2">
            <div><div className="text-ink font-medium">{h.alvoNome}</div><div className="text-ink-mute text-[11.5px]">{ROTULO_MATCH[h.tipoMatch]} · {h.similaridade}%</div></div>
            <div>
              <div className="text-ink">{h.nomeEncontrado}{h.via ? <span className="text-ink-mute"> · via {h.via.nome}</span> : null}</div>
              <div className="text-ink-mute text-[11.5px]">{h.materia ? `${h.materia.id} · ${h.materia.area} · ${h.materia.responsavel}` : ''} {h.motivo}</div>
              {h.barreiras.length > 0 && <div className="text-[11px] font-semibold text-warn inline-flex items-center gap-1"><Lock className="w-3 h-3" /> {h.barreiras.join(', ')}</div>}
            </div>
            <div><span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${NIVEL_CLS[h.nivel]}`}>{ROTULO_NIVEL[h.nivel]} · {h.score}</span></div>
          </div>
        ))}
      </div>

      {c.chineseWall && (
        <div className="rounded-xl border border-warn/25 bg-warn-soft px-5 py-3 text-[12.5px] text-warn space-y-0.5">
          <div className="font-semibold inline-flex items-center gap-1.5"><Lock className="w-4 h-4" /> Chinese Wall {c.chineseWall.id}</div>
          <div>{c.chineseWall.descricao}</div>
          <div>Bloqueia: {[...c.chineseWall.equipesBloqueadas, ...c.chineseWall.usuariosBloqueados].join(', ')} · Matérias: {c.chineseWall.materiasIsoladas.join(', ') || '—'}</div>
        </div>
      )}

      {c.status === 'INFO_REQUESTED' && c.infoSolicitada && (
        <div className="rounded-xl border border-accent/25 bg-accent-soft px-5 py-4 space-y-2">
          <div className="text-[13px] font-semibold text-accent inline-flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> {c.infoSolicitada.por} pediu:</div>
          <div className="text-[13px] text-ink">{c.infoSolicitada.pergunta}</div>
          <button onClick={() => onRetomar(c)} disabled={!souSolicitante}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-accent text-[#FFFFFF] text-[12.5px] font-semibold disabled:opacity-40">
            <RefreshCw className="w-4 h-4" /> Complementar e reexecutar a checagem
          </button>
        </div>
      )}

      {c.status === 'AGUARDANDO_CIENCIA' && (
        <div className="rounded-xl border border-accent/25 bg-accent-soft px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="text-[13px] text-ink">Risco médio: o responsável pelo intake precisa registrar ciência dos avisos para liberar a esteira.</div>
          <button disabled={ocupado || !souSolicitante} onClick={() => run(() => cienciaCaso(c.id, eu.userId, eu.nome), 'Ciência registrada — esteira liberada.')}
            className="px-4 h-9 rounded-lg bg-accent text-[#FFFFFF] text-[12.5px] font-semibold disabled:opacity-40">Registrar ciência</button>
        </div>
      )}

      {c.status === 'REQUIRES_APPROVAL' && (
        <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-accent" /> Decisão · {et ? ROTULO_ETAPA[et] : ''}</div>
            <label className="flex items-center gap-2 text-[12.5px] text-ink-2">Decidir como
              <select value={decisorId} onChange={(e) => setDecisorId(e.target.value)} className={input + ' h-9'}>
                {opcoes.map((o) => <option key={o.userId} value={o.userId}>{o.userId === eu.userId ? `Você · ${o.nome}` : demoIds.has(o.userId) ? `${o.nome} (persona demo)` : `${o.nome} · ${o.registroProfissional ? `${o.registroProfissional.conselho} ${o.registroProfissional.numero}` : 'sem registro'}`}</option>)}
              </select>
            </label>
          </div>
          {bloqueio && <div className="rounded-lg bg-surface border border-hairline px-3 py-2 text-[12.5px] text-ink-2">Não pode decidir: {bloqueio}.</div>}
          {precisaCW && <div className="rounded-lg bg-warn-soft text-warn px-3 py-2 text-[12.5px]">Atuar contra cliente ativo: a aprovação exige Chinese Wall.</div>}

          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Justificativa do parecer *
            <textarea value={just} onChange={(e) => setJust(e.target.value)} rows={3}
              placeholder="Ex.: Aprovado mediante Chinese Wall isolando a equipe Trabalhista; sem acesso cruzado a documentos."
              className="px-3 py-2 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal" />
            <span className={`text-[11px] ${just.trim().length >= JUSTIFICATIVA_MIN ? 'text-ink-mute' : 'text-warn'}`}>{just.trim().length}/{JUSTIFICATIVA_MIN} caracteres mínimos</span>
          </label>

          <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
            <input type="checkbox" checked={usarCW} onChange={(e) => setUsarCW(e.target.checked)} /> Aplicar Muralha da China (Chinese Wall)
          </label>
          {usarCW && (
            <div className="grid md:grid-cols-2 gap-3 rounded-lg border border-hairline bg-surface p-3">
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2 md:col-span-2">Descrição da barreira
                <input value={cwDesc} onChange={(e) => setCwDesc(e.target.value)} placeholder="Ex.: Isolar equipe Trabalhista dos documentos da nova matéria" className={input} />
              </label>
              <div className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Equipes bloqueadas
                <div className="flex flex-wrap gap-2">
                  {[...new Set([...areasHits, ...cwEquipes])].map((a) => (
                    <label key={a} className="inline-flex items-center gap-1.5 text-[12.5px] font-normal">
                      <input type="checkbox" checked={cwEquipes.includes(a)} onChange={(e) => setCwEquipes((xs) => e.target.checked ? [...xs, a] : xs.filter((x) => x !== a))} /> {a}
                    </label>
                  ))}
                  {areasHits.length === 0 && <span className="text-ink-mute font-normal">Nenhuma área nas correspondências</span>}
                </div>
              </div>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Usuários bloqueados (IDs, separados por vírgula)
                <input value={cwUsuarios} onChange={(e) => setCwUsuarios(e.target.value)} placeholder="ex.: u-123, u-456" className={input} />
              </label>
            </div>
          )}

          <label className="flex items-start gap-2 text-[12.5px] text-ink-2">
            <input type="checkbox" className="mt-0.5" checked={revisei} onChange={(e) => setRevisei(e.target.checked)} />
            <span>Revisei o relatório selado <code className="font-mono text-[11px]">sha256:{curto(c.seloResultado)}</code> e decido com base nele.</span>
          </label>

          <div className="flex flex-wrap gap-2 justify-end">
            <button disabled={ocupado || !!bloqueio} onClick={() => decidirTipo('RECUSAR')}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-crit/25 bg-crit-soft text-crit text-[12.5px] font-semibold disabled:opacity-40"><XCircle className="w-4 h-4" /> Recusar intake</button>
            <button disabled={ocupado || !!bloqueio} onClick={() => decidirTipo('PEDIR_INFO')}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-warn/25 bg-warn-soft text-warn text-[12.5px] font-semibold disabled:opacity-40"><HelpCircle className="w-4 h-4" /> Solicitar + info</button>
            <button disabled={ocupado || !!bloqueio} onClick={() => decidirTipo('APROVAR')}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-accent text-[#FFFFFF] text-[12.5px] font-semibold disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> {usarCW ? 'Aprovar com conflito + Chinese Wall' : 'Aprovar'}</button>
          </div>
        </div>
      )}

      {msg && <div className={`rounded-lg px-3 py-2 text-[12.5px] ${msg.tipo === 'ok' ? 'bg-good-soft text-good' : 'bg-crit-soft text-crit'}`}>{msg.t}</div>}

      {/* Trilha */}
      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><History className="w-4 h-4 text-accent" /> Trilha do caso</div>
          <button onClick={async () => setCadeia(await verificarCadeia(c))} className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-hairline text-[12px] text-ink-2 hover:bg-surface">
            <Fingerprint className="w-4 h-4" /> Verificar cadeia
          </button>
        </div>
        {cadeia !== null && (
          <div className={`text-[12px] font-semibold ${cadeia ? 'text-good' : 'text-crit'}`}>{cadeia ? 'Cadeia íntegra: nenhum evento foi alterado.' : 'Cadeia QUEBRADA: histórico adulterado.'}</div>
        )}
        <ol className="space-y-2">
          {c.eventos.map((e) => (
            <li key={e.seq} className="grid md:grid-cols-[150px_170px_minmax(0,1fr)_150px] gap-2 text-[12px]">
              <span className="text-ink-mute">{dataBR(e.em)}</span>
              <span className="text-ink font-medium">{e.tipo.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="text-ink-2">{e.por} · {e.detalhe}</span>
              <code className="font-mono text-[10.5px] text-ink-mute" title={e.hash}>{curto(e.hash)}</code>
            </li>
          ))}
        </ol>
        {c.decisoes.length > 0 && (
          <div className="pt-2 border-t border-hairline space-y-1.5">
            {c.decisoes.map((d, i) => (
              <div key={i} className="text-[12px] text-ink-2">
                <span className="font-semibold text-ink">{ROTULO_ETAPA[d.etapa]} · {d.tipo.replace(/_/g, ' ').toLowerCase()}</span> — {d.nome}
                {d.registroProfissional ? ` (${d.registroProfissional.conselho} ${d.registroProfissional.numero})` : ''}: “{d.justificativa}”
                <span className="text-ink-mute"> · revisou sha256:{curto(d.hashRevisado)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!ehTerminal(c.status) && souSolicitante && (
        <div className="flex flex-col md:flex-row gap-2 md:items-center justify-end">
          <input value={motivoCancel} onChange={(e) => setMotivoCancel(e.target.value)} placeholder="Motivo do cancelamento" className={input + ' md:w-80'} />
          <button disabled={ocupado || !motivoCancel.trim()} onClick={() => run(() => cancelarCaso(c.id, eu.userId, eu.nome, motivoCancel), 'Solicitação cancelada.')}
            className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-hairline text-[12.5px] text-ink-2 disabled:opacity-40"><Ban className="w-4 h-4" /> Cancelar solicitação</button>
        </div>
      )}
    </div>
  );
};

export default ConflictQueuePanel;
