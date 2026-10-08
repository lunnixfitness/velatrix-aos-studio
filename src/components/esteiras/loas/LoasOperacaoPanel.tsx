/**
 * VELATRIX AOS · Painel "Operação no servidor" da esteira LOAS (P28 + P29)
 *
 * Liga a LoasRunnerView ao backend: sincroniza o caso, calcula e gera minuta
 * no servidor (guardrail de citações), define procuração, planeja anexos por
 * tribunal, pede aprovação (alçada pela SESSÃO), envia o lote de protocolo e
 * acompanha tudo em tempo real via SSE.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Server, ShieldCheck, ShieldAlert, FileText, Users, Send, CheckCircle2, AlertTriangle, Plus, Trash2, Lock } from 'lucide-react';
import type { CasoLoas } from '../../../loas/tipos';
import { REGRAS_LOAS_V1 } from '../../../loas/regrasLoas';
import { planejarFracionamento, perfilPara, ORDEM_GRUPOS, type DocAnexo, type GrupoDoc, type SistemaProcessual } from '../../../loas/fracionador';
import { hashAnexos } from '../../../loas/aprovacao';
import type { AdvogadoProcuracao } from '../../../loas/assinatura';
import type { Minuta } from '../../../loas/drafter';
import { loasApi, assinarEventosLoas, ErroLoasApi, type RegistroComCalculo, type EventoLoas } from '../../../services/loasApiClient';
import type { EstadoLote } from '../../../types/loasEsteira';
import { useAuth } from '../../../context/AuthContext';

interface Props { caso: CasoLoas; competencia: string; }

const MB = 1024 * 1024;
const card = 'bg-canvas border border-hairline rounded-xl p-5 space-y-4';
const titulo = 'text-sm font-semibold text-ink flex items-center gap-2 border-b border-hairline pb-3';
const input = 'w-full border border-hairline rounded-lg px-3 py-2 text-xs text-ink bg-canvas';
const botao = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-ink text-canvas disabled:opacity-40';
const botao2 = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-hairline text-ink disabled:opacity-40';

function msgErro(e: unknown): string {
  if (e instanceof ErroLoasApi) return e.campos.length ? `${e.message}: ${e.campos.map((c) => `${c.campo} (${c.msg})`).join('; ')}` : e.message;
  return (e as Error)?.message ?? 'erro';
}

export const LoasOperacaoPanel: React.FC<Props> = ({ caso, competencia }) => {
  const [registro, setRegistro] = useState<RegistroComCalculo | null>(null);
  const [minuta, setMinuta] = useState<Minuta | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [eventos, setEventos] = useState<EventoLoas[]>([]);
  const [lote, setLote] = useState<EstadoLote | null>(null);

  const tesesAtivas = useMemo(() => REGRAS_LOAS_V1.teses.filter((t) => t.ativa), []);
  const [teses, setTeses] = useState<string[]>(() => tesesAtivas.map((t) => t.id));
  const [juizo, setJuizo] = useState({ orgao: 'Juizado Especial Federal', subsecao: '' });
  const [advogado, setAdvogado] = useState({ nome: '', oab: '' });
  // P30: advogados vêm do cadastro do tenant (OAB obrigatória) — nada de ID/nome digitado à mão.
  const { tenantMembers, activeTenant } = useAuth();
  const advogadosTenant = useMemo(
    () => (tenantMembers || [])
      .filter((m) => m.tenantId === activeTenant?.id && m.status === 'ACTIVE' && /^OAB\//i.test(m.professionalRegistry || ''))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [tenantMembers, activeTenant?.id],
  );
  const nomeAdvogado = (id: string) => advogadosTenant.find((m) => m.id === id)?.name ?? id;
  const [procuracao, setProcuracao] = useState<AdvogadoProcuracao[]>([{ id: '', oab: '', cpf: '' }]);
  const [signatarioId, setSignatarioId] = useState('');
  const [sistema, setSistema] = useState<SistemaProcessual>('PJE');
  const [tribunal, setTribunal] = useState('TRF3');
  const [docs, setDocs] = useState<DocAnexo[]>([
    { id: 'd1', grupo: 'PESSOAIS', nome: 'RG e CPF', mime: 'application/pdf', bytes: 1 * MB, paginas: 2 },
    { id: 'd2', grupo: 'CADUNICO', nome: 'Comprovante CadÚnico', mime: 'application/pdf', bytes: 1 * MB, paginas: 3 },
    { id: 'd3', grupo: 'INSS_CNIS', nome: 'Indeferimento + CNIS', mime: 'application/pdf', bytes: 2 * MB, paginas: 8 },
    { id: 'd4', grupo: 'LAUDOS', nome: 'Laudos médicos', mime: 'application/pdf', bytes: 9 * MB, paginas: 60 },
  ]);

  const plano = useMemo(() => {
    try { return planejarFracionamento(docs, perfilPara(sistema, tribunal)); } catch { return null; }
  }, [docs, sistema, tribunal]);
  const anexosHash = useMemo(() => (plano ? hashAnexos(plano.arquivos) : ''), [plano]);

  // SSE: eventos do próprio advogado em tempo real.
  const casoIdRef = useRef(caso.id);
  casoIdRef.current = caso.id;
  useEffect(() => {
    const ac = new AbortController();
    assinarEventosLoas((e) => {
      if ((e.dados as { casoId?: string }).casoId !== casoIdRef.current) return;
      setEventos((xs) => [e, ...xs].slice(0, 30));
      loasApi.obterCaso(casoIdRef.current).then(setRegistro).catch(() => {});
    }, ac.signal);
    return () => ac.abort();
  }, []);

  // Acompanha o lote enquanto houver item pendente.
  useEffect(() => {
    if (!lote || lote.itens.every((i) => i.status !== 'PENDENTE')) return;
    const t = setTimeout(() => loasApi.obterLote(lote.loteId).then(setLote).catch(() => {}), 1500);
    return () => clearTimeout(t);
  }, [lote]);

  async function executar(rotulo: string, fn: () => Promise<void>) {
    setOcupado(rotulo); setErro(null);
    try { await fn(); } catch (e) { setErro(msgErro(e)); } finally { setOcupado(null); }
  }

  const sincronizar = () => executar('sincronizar', async () => {
    try { await loasApi.criarCaso(caso); }
    catch (e) { if (!(e instanceof ErroLoasApi && e.status === 409)) throw e; }
    setRegistro(await loasApi.obterCaso(caso.id));
  });
  const calcular = () => executar('calcular', async () => { await loasApi.calcular(caso.id, competencia); setRegistro(await loasApi.obterCaso(caso.id)); });
  const gerarMinuta = () => executar('minuta', async () => {
    setMinuta(await loasApi.minuta(caso.id, { tesesSelecionadas: teses, juizo, advogado }));
    setRegistro(await loasApi.obterCaso(caso.id));
  });
  const salvarProcuracao = () => executar('procuracao', async () => {
    setRegistro({ ...(await loasApi.procuracao(caso.id, procuracao.map((a) => ({ ...a, cpf: a.cpf.replace(/\D/g, '') })))) });
    if (!signatarioId && procuracao[0]?.id) setSignatarioId(procuracao[0].id);
  });
  const aprovar = () => executar('aprovar', async () => { await loasApi.aprovar(caso.id, anexosHash); setRegistro(await loasApi.obterCaso(caso.id)); });
  const protocolar = () => executar('lote', async () => {
    if (!plano) throw new Error('Plano de anexos inválido.');
    setLote(await loasApi.criarLote([{
      casoId: caso.id, anexosHash, tribunal, sistema, signatarioId,
      arquivos: plano.arquivos.map((a) => ({ nome: a.nome, bytes: a.bytesEstimados })),
    }]));
  });

  const aprovadoParaEstesAnexos = !!registro?.aprovacao && registro.aprovacao.anexosHash === anexosHash && registro.aprovacao.minutaHash === registro.ultimaMinutaHash;
  const sincronizado = !!registro;
  const calculado = !!registro?.ultimoCalculoHash;
  const temMinuta = !!registro?.ultimaMinutaHash && !registro.ultimaMinutaBloqueada;
  const procuracaoOk = (registro?.procuracao?.length ?? 0) > 0;
  const protocolado = !!registro?.numeroProcesso;

  const Passo: React.FC<{ ok: boolean; n: number; children: React.ReactNode }> = ({ ok, n, children }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border ${ok ? 'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]' : 'bg-surface border-hairline text-ink-mute'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 text-center">{n}</span>} {children}
    </span>
  );

  return (
    <div className={card}>
      <h3 className={titulo}><Server className="w-4 h-4 text-accent" /> Operação no servidor · protocolo em lote</h3>

      <div className="flex flex-wrap gap-2">
        <Passo n={1} ok={sincronizado}>Caso no servidor</Passo>
        <Passo n={2} ok={calculado}>Cálculo selado</Passo>
        <Passo n={3} ok={temMinuta}>Minuta sem violação</Passo>
        <Passo n={4} ok={procuracaoOk}>Procuração</Passo>
        <Passo n={5} ok={aprovadoParaEstesAnexos}>Aprovação sênior</Passo>
        <Passo n={6} ok={protocolado}>Protocolado</Passo>
      </div>

      {erro && <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF3F2] border border-[#F4C7C3] text-[#B42318] text-xs"><AlertTriangle className="w-4 h-4 shrink-0" />{erro}</div>}

      {/* 1–2 */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className={botao} disabled={!!ocupado} onClick={sincronizar}>{ocupado === 'sincronizar' ? 'Enviando…' : 'Enviar caso ao servidor'}</button>
        <button className={botao2} disabled={!sincronizado || !!ocupado} onClick={calcular}>Calcular no servidor ({competencia})</button>
        {registro && <span className="text-[11px] text-ink-mute">Estágio: <b className="text-ink">{registro.estagio}</b> · versão {registro.versao}</span>}
      </div>
      {registro?.ultimoCalculo && (
        <div className="text-[11px] text-ink-2 bg-surface/50 border border-hairline rounded-lg p-3">
          Per capita {(registro.ultimoCalculo.perCapitaCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · limite {(registro.ultimoCalculo.limiteCentavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·{' '}
          {registro.ultimoCalculo.elegivelCriterioObjetivo ? <b className="text-[#067647]">critério objetivo atendido</b> : <b className="text-[#7A4F00]">acima do critério objetivo</b>}
          {registro.ultimoCalculo.pendencias.length > 0 && <> · <span className="text-[#7A4F00]">{registro.ultimoCalculo.pendencias.length} pendência(s)</span></>}
          <div className="font-mono mt-1 break-all">SHA-256 {registro.ultimoCalculo.hash}</div>
        </div>
      )}

      {/* 3 — minuta */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-ink flex items-center gap-1"><FileText className="w-3 h-3" /> Teses (tabela curada)</div>
          {tesesAtivas.map((t) => (
            <label key={t.id} className="flex gap-2 text-[11px] text-ink-2">
              <input type="checkbox" checked={teses.includes(t.id)} onChange={(e) => setTeses((xs) => e.target.checked ? [...xs, t.id] : xs.filter((x) => x !== t.id))} />
              <span><b>{t.titulo}</b> — {t.fundamento}</span>
            </label>
          ))}
        </div>
        <div className="space-y-2">
          <input className={input} placeholder="Órgão (ex.: Juizado Especial Federal)" value={juizo.orgao} onChange={(e) => setJuizo({ ...juizo, orgao: e.target.value })} />
          <input className={input} placeholder="Subseção judiciária" value={juizo.subsecao} onChange={(e) => setJuizo({ ...juizo, subsecao: e.target.value })} />
          <select className={input} aria-label="Advogado(a) subscritor(a)" value={signatarioId}
            disabled={!procuracaoOk}
            onChange={(e) => {
              const a = (registro?.procuracao ?? []).find((x) => x.id === e.target.value);
              setSignatarioId(e.target.value);
              setAdvogado(a ? { nome: nomeAdvogado(a.id), oab: a.oab } : { nome: '', oab: '' });
            }}>
            <option value="">{procuracaoOk ? 'Subscritor(a): escolha entre os advogados da procuração' : 'Salve a procuração para escolher o subscritor'}</option>
            {(registro?.procuracao ?? []).map((a) => <option key={a.id} value={a.id}>{nomeAdvogado(a.id)} · {a.oab}</option>)}
          </select>
          <button className={botao2} disabled={!calculado || !!ocupado || !juizo.subsecao || !advogado.nome || !advogado.oab} onClick={gerarMinuta}>Gerar minuta (guardrail)</button>
        </div>
      </div>
      {minuta && (
        <div className={`text-[11px] rounded-lg p-3 border ${minuta.bloqueada ? 'bg-[#FEF3F2] border-[#F4C7C3] text-[#B42318]' : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647]'}`}>
          {minuta.bloqueada
            ? <><ShieldAlert className="w-3 h-3 inline" /> Minuta bloqueada: {minuta.violacoes.map((v) => `${v.referencia} (${v.motivo})`).join('; ')}</>
            : <><ShieldCheck className="w-3 h-3 inline" /> Minuta liberada · SHA-256 <span className="font-mono">{minuta.hash.slice(0, 24)}…</span></>}
          <details className="mt-2"><summary className="cursor-pointer">Ver texto</summary><pre className="whitespace-pre-wrap text-ink-2 mt-2 max-h-64 overflow-auto">{minuta.texto}</pre></details>
        </div>
      )}

      {/* 4 — procuração */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-ink flex items-center gap-1"><Users className="w-3 h-3" /> Advogados constituídos (procuração)</div>
        {procuracao.map((a, i) => (
          <div key={i} className="grid grid-cols-[1.4fr_0.8fr_1fr_auto] gap-2">
            <select className={input} aria-label="Advogado constituído" value={a.id}
              onChange={(e) => {
                const m = advogadosTenant.find((x) => x.id === e.target.value);
                setProcuracao((xs) => xs.map((x, j) => j === i ? { ...x, id: m?.id ?? '', oab: (m?.professionalRegistry ?? '').replace(/^OAB\/?\s*/i, '') } : x));
              }}>
              <option value="">Advogado do escritório…</option>
              {advogadosTenant.map((m) => (
                <option key={m.id} value={m.id} disabled={procuracao.some((p, j) => j !== i && p.id === m.id)}>{m.name} · {m.professionalRegistry}</option>
              ))}
            </select>
            <input className={input + ' bg-surface'} placeholder="OAB" value={a.oab} readOnly aria-readonly="true" title="Vem do cadastro do usuário" />
            <input className={input} placeholder="CPF" value={a.cpf} onChange={(e) => setProcuracao((xs) => xs.map((x, j) => j === i ? { ...x, cpf: e.target.value } : x))} />
            <button className={botao2} onClick={() => setProcuracao((xs) => xs.filter((_, j) => j !== i))} disabled={procuracao.length === 1}><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <button className={botao2} onClick={() => setProcuracao((xs) => [...xs, { id: '', oab: '', cpf: '' }])}><Plus className="w-3 h-3" /> Advogado</button>
          <button className={botao2} disabled={!sincronizado || !!ocupado || procuracao.some((p) => !p.id || p.cpf.replace(/\D/g, '').length !== 11)} onClick={salvarProcuracao}>Salvar procuração</button>
          </div>
          {advogadosTenant.length === 0 && (
            <div className="text-[11px] text-[#7A4F00]">Nenhum advogado com OAB cadastrado neste escritório. Cadastre em Configurações → Usuários para constituir a procuração.</div>
          )}
          <div className="text-[11px] text-ink-mute">Só advogados do cadastro do escritório (com OAB) podem ser constituídos. O servidor recusa (403) assinatura de quem não está na procuração.</div>
      </div>

      {/* anexos */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-ink">Anexos e fracionamento por tribunal</div>
        <div className="grid grid-cols-3 gap-2">
          <select className={input} value={sistema} onChange={(e) => setSistema(e.target.value as SistemaProcessual)}>
            <option value="PJE">PJe</option><option value="EPROC">eproc</option><option value="PROJUDI">Projudi</option>
          </select>
          <input className={input} value={tribunal} onChange={(e) => setTribunal(e.target.value.toUpperCase())} placeholder="Tribunal (ex.: TRF3)" />
          <span className="text-[11px] text-[#7A4F00] self-center">Limites de upload: PREENCHER_E_VALIDAR</span>
        </div>
        {docs.map((d, i) => (
          <div key={d.id} className="grid grid-cols-[1.2fr_1fr_0.6fr_0.6fr_auto] gap-2">
            <input className={input} value={d.nome} onChange={(e) => setDocs((xs) => xs.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))} />
            <select className={input} value={d.grupo} onChange={(e) => setDocs((xs) => xs.map((x, j) => j === i ? { ...x, grupo: e.target.value as GrupoDoc } : x))}>
              {ORDEM_GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input className={input} type="number" min={0.1} step={0.1} value={+(d.bytes / MB).toFixed(1)} onChange={(e) => setDocs((xs) => xs.map((x, j) => j === i ? { ...x, bytes: Math.round(Number(e.target.value) * MB) } : x))} title="MB" />
            <input className={input} type="number" min={1} value={d.paginas} onChange={(e) => setDocs((xs) => xs.map((x, j) => j === i ? { ...x, paginas: Math.max(1, Number(e.target.value)) } : x))} title="páginas" />
            <button className={botao2} onClick={() => setDocs((xs) => xs.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
        <button className={botao2} onClick={() => setDocs((xs) => [...xs, { id: `d${Date.now()}`, grupo: 'OUTROS', nome: 'Documento', mime: 'application/pdf', bytes: MB, paginas: 1 }])}><Plus className="w-3 h-3" /> Documento</button>
        {plano && (
          <div className="text-[11px] text-ink-2 bg-surface/50 border border-hairline rounded-lg p-3 space-y-1">
            {plano.arquivos.map((a) => <div key={a.nome}>{a.nome} — {(a.bytesEstimados / MB).toFixed(2)} MB · {a.fatias.map((f) => `${docs.find((d) => d.id === f.docId)?.nome ?? f.docId} p.${f.paginaInicial}-${f.paginaFinal}`).join(', ')}</div>)}
            {plano.rejeitados.length > 0 && <div className="text-[#B42318]">Rejeitados: {plano.rejeitados.map((r) => `${r.docId} (${r.motivo})`).join(', ')}</div>}
            <div className="font-mono break-all">anexos SHA-256 {anexosHash}</div>
          </div>
        )}
      </div>

      {/* 5–6 */}
      <div className="flex flex-wrap gap-2 items-center border-t border-hairline pt-4">
        <button className={botao2} disabled={!temMinuta || !anexosHash || !!ocupado} onClick={aprovar} title="Exige perfil sênior/sócio e que não seja quem preparou o caso">
          <Lock className="w-3 h-3" /> Aprovar (sessão sênior)
        </button>
        <select className={input + ' max-w-[260px]'} aria-label="Signatário" value={signatarioId}
            onChange={(e) => {
              const a = (registro?.procuracao ?? []).find((x) => x.id === e.target.value);
              setSignatarioId(e.target.value);
              if (a) setAdvogado({ nome: nomeAdvogado(a.id), oab: a.oab });
            }}>
          <option value="">Signatário…</option>
          {(registro?.procuracao ?? []).map((a) => <option key={a.id} value={a.id}>{nomeAdvogado(a.id)} · {a.oab}</option>)}
          </select>
          <button className={botao} disabled={!aprovadoParaEstesAnexos || !signatarioId || protocolado || !!ocupado} onClick={protocolar}><Send className="w-3 h-3" /> Assinar e protocolar</button>
        {registro?.aprovacao && !aprovadoParaEstesAnexos && <span className="text-[11px] text-[#7A4F00]">Aprovação existente não cobre a minuta/anexos atuais — aprovar novamente.</span>}
      </div>

      {lote && (
        <div className="text-[11px] bg-surface/50 border border-hairline rounded-lg p-3">
          <b>{lote.loteId}</b> · {lote.itens.map((i) => `${i.casoId}: ${i.status}${i.numeroProcesso ? ` (${i.numeroProcesso})` : ''}${i.erro ? ` — ${i.erro}` : ''}`).join(' · ')}
        </div>
      )}
      {registro?.numeroProcesso && (
        <div className="text-xs p-3 rounded-lg bg-[#ECFDF3] border border-[#ABEFC6] text-[#067647]">
          <CheckCircle2 className="w-4 h-4 inline" /> Processo {registro.numeroProcesso} · {registro.tribunal}
        </div>
      )}

      {eventos.length > 0 && (
        <div className="text-[11px] text-ink-2 space-y-1">
          <div className="font-semibold text-ink">Tempo real</div>
          {eventos.map((e, i) => <div key={i} className="font-mono">{String(e.dados.em ?? '').slice(11, 19)} {e.tipo}</div>)}
        </div>
      )}
    </div>
  );
};

export default LoasOperacaoPanel;
