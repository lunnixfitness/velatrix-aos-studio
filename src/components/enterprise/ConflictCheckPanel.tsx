import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Users, Plus, Trash2, Play, ShieldAlert, ShieldCheck, Info, Fingerprint, Lock, Send, RefreshCw } from 'lucide-react';
import {
  criarIndice, executarConflictCheck, payloadSelo, tipoDocumento, ConflitoInvalido,
  ROTULO_ACAO, ROTULO_MATCH, ROTULO_NIVEL, MOTOR_CONFLITO_VERSAO,
  type AlvoConsulta, type PapelConsulta, type NivelRisco, type ResultadoConflito, type SolicitacaoConflito,
} from '../../enterprise/conflictCheck.ts';
import { hashCanonical } from '../../enterprise/canonicalJson.ts';
import { BASE_CONFLITOS_DEMO, CENARIOS_CONFLITO, TENANT_DEMO } from '../../services/conflictCheckDemo.ts';
import { SubTabBar } from '../console/SubTabBar';
import { useAuth } from '../../context/AuthContext';
import type { CasoConflito } from '../../enterprise/conflictApproval.ts';
import { subscribe, getSnapshot, enviar, reexecutarCaso } from '../../services/conflictCaseStore.ts';
import { ConflictQueuePanel, contarPendentes } from './ConflictQueuePanel';
import { ChineseWallPanel } from './ChineseWallPanel';
import { barreirasVigentes, membroDoUsuario, type MembroRef } from '../../enterprise/chineseWall.ts';

/**
 * Central Enterprise · Conflict Check (P17 motor · P18 Painel do Sócio).
 * Motor determinístico no cliente sobre base DEMO; em produção roda no servidor contra conflict_entities do tenant.
 * Todo resultado vira caso auditável: liberado, ciência (médio) ou decisão do sócio/comitê (alto/crítico).
 */

const NIVEL_UI: Record<NivelRisco, { cls: string; Icon: React.FC<{ className?: string }> }> = {
  CRITICO: { cls: 'bg-crit-soft text-crit border-crit/25', Icon: ShieldAlert },
  ALTO: { cls: 'bg-warn-soft text-warn border-warn/25', Icon: ShieldAlert },
  MEDIO: { cls: 'bg-accent-soft text-accent border-accent/25', Icon: Info },
  BAIXO: { cls: 'bg-good-soft text-good border-good/25', Icon: ShieldCheck },
};

const PAPEIS: { id: PapelConsulta; label: string }[] = [
  { id: 'NOVO_CLIENTE', label: 'Novo cliente' },
  { id: 'PARTE_CONTRARIA', label: 'Parte contrária' },
  { id: 'SOCIO_ALVO', label: 'Sócio do cliente' },
  { id: 'PARTE_RELACIONADA', label: 'Parte relacionada' },
];
const ROTULO_PAPEL_ENT: Record<string, string> = {
  CLIENTE_ATIVO: 'Cliente ativo', CLIENTE_INATIVO: 'Ex-cliente', PARTE_CONTRARIA: 'Parte contrária',
  TERCEIRO_INTERESSADO: 'Terceiro interessado', PROSPECT_DECLINADO: 'Prospect recusado',
};
const ROTULO_STATUS: Record<ResultadoConflito['status'], string> = {
  CLEAR: 'Liberado', CLEAR_WITH_NOTICE: 'Liberado com ciência', REQUIRES_APPROVAL: 'Requer aprovação',
};

const input = 'h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal';
const vazio = (): AlvoConsulta => ({ nome: '', documento: '', papel: 'PARTE_CONTRARIA' });

export const ConflictCheckPanel: React.FC = () => {
  const indice = useMemo(() => criarIndice(TENANT_DEMO, BASE_CONFLITOS_DEMO), []);
  const [descricao, setDescricao] = useState('');
  const [area, setArea] = useState('Tributário');
  const [alvos, setAlvos] = useState<AlvoConsulta[]>([{ nome: '', documento: '', papel: 'NOVO_CLIENTE' }, vazio()]);
  const [res, setRes] = useState<{ sol: SolicitacaoConflito; r: ResultadoConflito; selo: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { currentUser, tenantMembers } = useAuth();
  const casos = useSyncExternalStore(subscribe, getSnapshot);
  const [aba, setAba] = useState<'nova' | 'fila' | 'walls'>('nova');
  const membros: MembroRef[] = useMemo(() => (tenantMembers ?? []).map((m) => ({
    id: m.id, name: m.name, role: String(m.role), email: m.email, department: m.department, professionalRegistry: m.professionalRegistry,
  })), [tenantMembers]);
  const membroAtual = membroDoUsuario(membros, currentUser);
  const [abrirId, setAbrirId] = useState<string | null>(null);
  const [retomando, setRetomando] = useState<CasoConflito | null>(null);
  const [enviado, setEnviado] = useState(false);
  const solicitante = { id: currentUser?.id ?? 'usuario-demo', nome: currentUser?.name ?? 'Usuário demo' };

  const irParaCaso = (id: string) => { setAbrirId(id); setAba('fila'); };

  const retomar = (c: CasoConflito) => {
    setRetomando(c);
    setDescricao(c.solicitacao.descricao);
    setArea(c.solicitacao.area);
    setAlvos(c.solicitacao.alvos.map((a) => ({ ...a, documento: a.documento ?? '' })));
    setRes(null); setErro(null); setEnviado(false); setAbrirId(null); setAba('nova');
  };

  const registrar = async () => {
    if (!res) return;
    setErro(null);
    try {
      if (retomando) await reexecutarCaso(retomando.id, res.sol, res.r, res.selo, solicitante.id, solicitante.nome);
      else await enviar(res.sol, res.r, res.selo, solicitante.nome);
      setEnviado(true);
      const id = res.sol.id;
      setRetomando(null);
      irParaCaso(id);
    } catch (e) { setErro((e as Error).message); }
  };

  const setAlvo = (i: number, p: Partial<AlvoConsulta>) => setAlvos((xs) => xs.map((a, j) => (j === i ? { ...a, ...p } : a)));

  const carregar = (id: string) => {
    const c = CENARIOS_CONFLITO.find((x) => x.id === id)!;
    setDescricao(c.solicitacao.descricao);
    setArea(c.solicitacao.area);
    setAlvos(c.solicitacao.alvos.map((a) => ({ ...a, documento: a.documento ?? '' })));
    setRes(null);
    setErro(null);
    setEnviado(false);
    setRetomando(null);
  };

  const rodar = async () => {
    setErro(null);
    const sol: SolicitacaoConflito = {
      id: retomando?.id ?? `CHK-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      tenantId: TENANT_DEMO,
      solicitanteId: retomando?.solicitanteId ?? solicitante.id,
      area,
      descricao: descricao.trim() || '(sem descrição)',
      alvos: alvos.filter((a) => a.nome.trim() || a.documento?.trim()),
    };
    try {
      const r = executarConflictCheck(sol, indice, new Date());
      const selo = await hashCanonical(payloadSelo(sol, r));
      setRes({ sol, r, selo });
      setEnviado(false);
    } catch (e) {
      setRes(null);
      setErro(e instanceof ConflitoInvalido ? e.message : 'Falha inesperada no motor: ' + (e as Error).message);
    }
  };

  const r = res?.r;
  const ui = r ? NIVEL_UI[r.nivel] : null;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-semibold text-ink tracking-tight">Conflict Check</h2>
        <p className="text-[13.5px] text-ink-mute max-w-3xl">
          Checagem de conflito de interesses antes do aceite do caso: CPF/CNPJ, raiz de CNPJ, grupo econômico e nome
          (fonética PT-BR + similaridade). Determinístico e selado em SHA-256 — prova de checagem prévia.
        </p>
      </div>

      <SubTabBar
        tabs={[
          { id: 'nova', label: retomando ? `Reexecutar ${retomando.id}` : 'Nova checagem' },
          { id: 'fila', label: 'Painel do Sócio', count: contarPendentes(casos) },
          { id: 'walls', label: 'Chinese Walls', count: barreirasVigentes(casos).length },
        ]}
        activeTab={aba}
        onTabChange={(id) => { setAba(id as 'nova' | 'fila' | 'walls'); if (id === 'fila') setAbrirId(null); }}
      />

      {aba === 'walls' ? <ChineseWallPanel membros={membros} /> :
       aba === 'fila' ? <ConflictQueuePanel key={abrirId ?? 'lista'} abrirId={abrirId} onRetomar={retomar} membros={membros} membroAtual={membroAtual} /> : <>
      {retomando?.infoSolicitada && (
        <div className="rounded-xl border border-accent/25 bg-accent-soft px-5 py-3 text-[12.5px] text-ink space-y-1">
          <div className="font-semibold text-accent">{retomando.infoSolicitada.por} pediu: {retomando.infoSolicitada.pergunta}</div>
          <div className="text-ink-2">Complete as partes abaixo e rode a checagem de novo — o caso volta para decisão com o novo relatório selado.</div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!retomando && CENARIOS_CONFLITO.map((c) => (
          <button key={c.id} onClick={() => carregar(c.id)}
            className="px-3 py-1.5 rounded-lg border border-hairline bg-canvas text-[12.5px] text-ink-2 hover:bg-surface">
            {c.rotulo}
          </button>
        ))}
        <span className="text-[11.5px] text-ink-mute self-center">Cenários DEMO · dados fictícios</span>
      </div>

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-ink"><Users className="w-4 h-4 text-accent" /> Solicitação</div>
        <div className="grid md:grid-cols-[1fr_220px] gap-3">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Caso / matéria
            <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Recuperação de PIS/COFINS da empresa X" className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink-2">Área
            <input value={area} onChange={(e) => setArea(e.target.value)} className={input} />
          </label>
        </div>

        <div className="space-y-2">
          {alvos.map((a, i) => {
            const td = tipoDocumento(a.documento);
            return (
              <div key={i} className="grid md:grid-cols-[180px_1fr_200px_36px] gap-2 items-start">
                <select value={a.papel} onChange={(e) => setAlvo(i, { papel: e.target.value as PapelConsulta })} className={input}>
                  {PAPEIS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <input value={a.nome} onChange={(e) => setAlvo(i, { nome: e.target.value })} placeholder="Nome / razão social" className={input} />
                <div className="flex flex-col gap-1">
                  <input value={a.documento ?? ''} onChange={(e) => setAlvo(i, { documento: e.target.value })} placeholder="CPF ou CNPJ" className={input + ' font-mono'} />
                  {td === 'INVALIDO' && <span className="text-[11px] text-crit">Dígito verificador inválido</span>}
                </div>
                <button onClick={() => setAlvos((xs) => xs.filter((_, j) => j !== i))} disabled={alvos.length <= 1}
                  className="h-10 w-9 grid place-items-center rounded-lg border border-hairline text-ink-mute hover:text-crit disabled:opacity-40" title="Remover">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <button onClick={() => setAlvos((xs) => [...xs, vazio()])}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-hairline text-[12.5px] text-ink-2 hover:bg-surface">
            <Plus className="w-4 h-4" /> Adicionar parte
          </button>
          <button onClick={rodar}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-accent text-[#FFFFFF] text-[13px] font-semibold hover:opacity-90">
            <Play className="w-4 h-4" /> Rodar checagem
          </button>
        </div>
        {erro && <div className="rounded-lg bg-crit-soft text-crit text-[12.5px] px-3 py-2">{erro}</div>}
      </div>

      {r && ui && res && (
        <div className="space-y-4">
          <div className={`rounded-xl border px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${ui.cls}`}>
            <div className="flex items-start gap-3">
              <ui.Icon className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <div className="text-[15px] font-semibold">{ROTULO_STATUS[r.status]} · Risco {ROTULO_NIVEL[r.nivel]}</div>
                <div className="text-[12.5px] opacity-90">{ROTULO_ACAO[r.acao]}</div>
              </div>
            </div>
            <div className="font-mono text-[26px] font-semibold">{r.scoreMax}<span className="text-[13px] opacity-70">/100</span></div>
          </div>

          {r.avisos.length > 0 && (
            <ul className="rounded-lg border border-hairline bg-surface px-4 py-2 text-[12px] text-ink-2 space-y-0.5">
              {r.avisos.map((a, i) => <li key={i}>· {a}</li>)}
            </ul>
          )}

          <div className="border border-hairline rounded-xl overflow-hidden bg-canvas">
            <div className="hidden md:grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_minmax(0,1fr)_90px_90px] gap-4 px-5 py-2.5 bg-surface border-b border-hairline text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
              <span>Consultado</span><span>Encontrado na base</span><span>Correspondência</span><span>Similar.</span><span>Risco</span>
            </div>
            {r.hits.length === 0 && <div className="px-5 py-8 text-center text-[13px] text-ink-mute">Nenhuma correspondência significativa na base do escritório.</div>}
            {r.hits.map((h) => (
              <div key={`${h.alvoIndice}-${h.entidadeId}`} className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.6fr)_minmax(0,1fr)_90px_90px] gap-2 md:gap-4 px-5 py-3.5 border-b border-hairline last:border-b-0 text-[13px]">
                <div>
                  <div className="text-ink font-medium">{h.alvoNome}</div>
                  <div className="text-[11.5px] text-ink-mute">{PAPEIS.find((p) => p.id === h.alvoPapel)?.label}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-ink font-medium">{h.nomeEncontrado}</div>
                  <div className="text-[11.5px] text-ink-2">{ROTULO_PAPEL_ENT[h.papelEncontrado]}{h.documentoEncontrado ? ` · ${h.documentoEncontrado}` : ''}</div>
                  {h.via && <div className="text-[11.5px] text-ink-mute">via {h.via.nome} ({h.via.papel.toLowerCase()})</div>}
                  {h.materia && <div className="text-[11.5px] text-ink-mute">{h.materia.id} · {h.materia.titulo} · {h.materia.area} · {h.materia.responsavel} · {h.materia.status === 'ATIVA' ? 'ativa' : 'encerrada'}</div>}
                  <div className="text-[11.5px] text-ink-2">{h.motivo}</div>
                  {h.barreiras.length > 0 && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-warn"><Lock className="w-3 h-3" /> Chinese Wall vigente: {h.barreiras.join(', ')}</div>
                  )}
                </div>
                <div className="text-[12.5px] text-ink-2">{ROTULO_MATCH[h.tipoMatch]}</div>
                <div className="font-mono text-[13px] text-ink">{h.similaridade}%</div>
                <div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${NIVEL_UI[h.nivel].cls}`}>{ROTULO_NIVEL[h.nivel]} · {h.score}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-hairline bg-surface px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <Fingerprint className="w-4 h-4 text-accent" />
              <span>{res.sol.id} · motor {MOTOR_CONFLITO_VERSAO} · {r.candidatosAvaliados} candidatos avaliados · {new Date(r.geradoEm).toLocaleString('pt-BR')}</span>
            </div>
            <code className="font-mono text-[11px] text-ink-mute break-all" title="SHA-256 do payload canônico (JCS)">sha256:{res.selo}</code>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-xl border border-hairline bg-canvas px-5 py-3.5">
            <p className="text-[12.5px] text-ink-2">
              {retomando ? `Reenviar o novo relatório ao caso ${retomando.id} (decisões anteriores são zeradas).`
                : r.status === 'REQUIRES_APPROVAL' ? 'Enviar ao Painel do Sócio: aprovar, aprovar com Chinese Wall, pedir informações ou recusar.'
                : r.status === 'CLEAR_WITH_NOTICE' ? 'Registrar o caso: o responsável pelo intake dá ciência dos avisos e a esteira é liberada.'
                : 'Registrar a liberação: fica a prova selada de que a checagem foi feita antes do contrato.'}
            </p>
            <button onClick={registrar} disabled={enviado || !!casos.find((c) => c.id === res.sol.id && !retomando)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-accent text-[#FFFFFF] text-[13px] font-semibold hover:opacity-90 disabled:opacity-40 shrink-0">
              {retomando ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {retomando ? 'Reenviar ao caso' : r.status === 'REQUIRES_APPROVAL' ? 'Enviar ao Painel do Sócio' : 'Registrar caso'}
            </button>
          </div>
        </div>
      )}
      </>}
    </div>
  );
};

export default ConflictCheckPanel;
