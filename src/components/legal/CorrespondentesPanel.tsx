import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Handshake, Plus, Trash2, ShieldCheck, Lock, FileSignature, Calculator, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  CLASSE_LABEL,
  calcularDivisao,
  validarAcordo,
  validarCiencia,
  AcordoInvalido,
  type AcordoParceria,
  type CienciaCliente,
  type ClasseProfissional,
  type Participante,
} from '../../enterprise/correspondentes';
import * as store from '../../services/correspondentesStore';

/**
 * Correspondentes & Parcerias (P23) — substitui o split 50/50.
 * Divisão de honorários apenas entre profissionais da mesma classe,
 * com ciência do cliente e selo SHA-256. A Velatrix não participa.
 */

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const card = 'rounded-2xl border border-hairline bg-surface';
const label = 'text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute';
const input = 'h-9 w-full rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink';
const btnPri = 'inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 h-9 text-[13px] font-semibold text-[#FFFFFF] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed';
const btnSec = 'inline-flex items-center gap-1.5 rounded-lg border border-hairline px-3 h-9 text-[13px] text-ink-2 hover:border-hairline-strong';

const STATUS: Record<AcordoParceria['status'], string> = {
  rascunho: 'bg-warn-soft text-warn',
  vigente: 'bg-good-soft text-good',
  encerrado: 'bg-canvas text-ink-mute',
};

const classeDoRegistro = (r?: string): ClasseProfissional | null =>
  !r ? null : /^OAB\//i.test(r) ? 'OAB' : /^CRC\//i.test(r) ? 'CRC' : /CNPC|PERIT/i.test(r) ? 'PERITO' : null;

type Linha = Participante;

const NovoAcordo: React.FC<{ onFechar: () => void }> = ({ onFechar }) => {
  const { activeTenant, tenantMembers, currentUser } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [classe, setClasse] = useState<ClasseProfissional>('OAB');
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [ext, setExt] = useState({ nome: '', registro: '' });
  const [erroSalvar, setErroSalvar] = useState<string[]>([]);

  const internos = useMemo(
    () => (tenantMembers || []).filter(
      (m) => m.tenantId === activeTenant.id && m.status !== 'REVOKED' && classeDoRegistro(m.professionalRegistry) === classe,
    ),
    [tenantMembers, activeTenant.id, classe],
  );

  const add = (p: Omit<Linha, 'percentual' | 'papel'>) => {
    if (linhas.some((l) => l.id === p.id)) return;
    setLinhas((ls) => [...ls, { ...p, papel: ls.length === 0 ? 'titular' : 'correspondente', percentual: 0 }]);
  };
  const upd = (id: string, patch: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const erros = linhas.length ? validarAcordo({ titulo, classe, participantes: linhas }) : [];

  const salvar = () => {
    try {
      store.criarRascunho(activeTenant.id, { titulo, classe, participantes: linhas }, currentUser?.name || 'Usuário');
      onFechar();
    } catch (e) {
      setErroSalvar(e instanceof AcordoInvalido ? e.erros : [String(e)]);
    }
  };

  return (
    <div className={`${card} p-5 space-y-4`}>
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-ink">Novo acordo de parceria</div>
        <button type="button" onClick={onFechar} className="text-ink-mute hover:text-ink"><X className="h-4 w-4" /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div><div className={label}>Título</div><input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Correspondência TRF1 · Cliente Alpha" /></div>
        <div>
          <div className={label}>Classe profissional</div>
          <select className={input} value={classe} onChange={(e) => { setClasse(e.target.value as ClasseProfissional); setLinhas([]); }}>
            {(Object.keys(CLASSE_LABEL) as ClasseProfissional[]).map((c) => <option key={c} value={c}>{CLASSE_LABEL[c]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <div className={label}>Profissionais do escritório</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {internos.length === 0 && <span className="text-[12px] text-ink-mute">Nenhum membro com registro {classe}.</span>}
            {internos.map((m) => (
              <button key={m.id} type="button" onClick={() => add({ id: m.id, nome: m.name, registro: m.professionalRegistry || '', classe, interno: true })}
                className="rounded-md border border-hairline bg-canvas px-2 py-1 text-[12px] text-ink-2 hover:border-hairline-strong">
                + {m.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className={label}>Profissional externo (correspondente)</div>
          <div className="mt-1.5 flex gap-1.5">
            <input className={input} placeholder="Nome" value={ext.nome} onChange={(e) => setExt({ ...ext, nome: e.target.value })} />
            <input className={input} placeholder={classe === 'OAB' ? 'OAB/UF 000.000' : classe === 'CRC' ? 'CRC/UF ...' : 'Registro'} value={ext.registro} onChange={(e) => setExt({ ...ext, registro: e.target.value })} />
            <button type="button" className={btnSec} disabled={!ext.nome.trim() || !ext.registro.trim()}
              onClick={() => { add({ id: `ext_${Date.now().toString(36)}`, nome: ext.nome.trim(), registro: ext.registro.trim(), classe, interno: false }); setExt({ nome: '', registro: '' }); }}>
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {linhas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-hairline">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead><tr className="border-b border-hairline text-left">
              <th className="px-3 py-2 font-medium text-ink-mute">Profissional</th>
              <th className="px-3 py-2 font-medium text-ink-mute">Papel</th>
              <th className="px-3 py-2 font-medium text-ink-mute">%</th><th />
            </tr></thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id} className="border-b border-hairline last:border-0">
                  <td className="px-3 py-2 text-ink">{l.nome}<div className="text-[12px] text-ink-mute">{l.registro} · {l.interno ? 'interno' : 'externo'}</div></td>
                  <td className="px-3 py-2">
                    <select className={input} value={l.papel} onChange={(e) => upd(l.id, { papel: e.target.value as Linha['papel'] })}>
                      <option value="titular">Titular</option><option value="correspondente">Correspondente</option><option value="coautor">Coautor</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 w-28"><input type="number" min={0} max={100} step={0.01} className={input} value={l.percentual}
                    onChange={(e) => upd(l.id, { percentual: Number(e.target.value) })} /></td>
                  <td className="px-3 py-2 text-right"><button type="button" onClick={() => setLinhas((ls) => ls.filter((x) => x.id !== l.id))} className="text-ink-mute hover:text-crit"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(erros.length > 0 || erroSalvar.length > 0) && (
        <ul className="rounded-xl bg-warn-soft px-4 py-3 text-[12.5px] text-warn space-y-0.5">
          {[...new Set([...erros, ...erroSalvar])].map((e) => <li key={e}>• {e}</li>)}
        </ul>
      )}
      <div className="flex gap-2">
        <button type="button" className={btnPri} disabled={!linhas.length || erros.length > 0} onClick={salvar}>Salvar rascunho</button>
        <button type="button" className={btnSec} onClick={onFechar}>Cancelar</button>
      </div>
    </div>
  );
};

const Ciencia: React.FC<{ acordo: AcordoParceria; onFechar: () => void }> = ({ acordo, onFechar }) => {
  const [c, setC] = useState<CienciaCliente>({ cliente: '', documento: '', meio: 'aditivo', em: new Date().toISOString().slice(0, 10) });
  const [erro, setErro] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const cIso = { ...c, em: c.em.length === 10 ? `${c.em}T12:00:00.000Z` : c.em };
  const erros = validarCiencia(cIso);
  const confirmar = async () => {
    setSalvando(true);
    try { await store.ativar(acordo.id, cIso); onFechar(); }
    catch (e) { setErro(e instanceof AcordoInvalido ? e.erros : [String(e)]); }
    finally { setSalvando(false); }
  };
  return (
    <div className="mt-3 rounded-xl border border-hairline bg-canvas p-4 space-y-3">
      <div className="text-[13px] font-semibold text-ink">Ciência do cliente sobre a divisão</div>
      <div className="grid gap-2 md:grid-cols-4">
        <input className={input} placeholder="Cliente" value={c.cliente} onChange={(e) => setC({ ...c, cliente: e.target.value })} />
        <input className={input} placeholder="CPF/CNPJ" value={c.documento} onChange={(e) => setC({ ...c, documento: e.target.value })} />
        <select className={input} value={c.meio} onChange={(e) => setC({ ...c, meio: e.target.value as CienciaCliente['meio'] })}>
          <option value="contrato">Contrato de honorários</option><option value="aditivo">Aditivo</option>
          <option value="assinatura_digital">Assinatura digital</option><option value="email">E-mail</option>
        </select>
        <input type="date" className={input} value={c.em.slice(0, 10)} onChange={(e) => setC({ ...c, em: e.target.value })} />
      </div>
      {[...erros, ...erro].length > 0 && c.cliente && <div className="text-[12px] text-warn">{[...erros, ...erro].join(' ')}</div>}
      <div className="flex gap-2">
        <button type="button" className={btnPri} disabled={erros.length > 0 || salvando} onClick={confirmar}><Lock className="h-4 w-4" /> Ativar e selar</button>
        <button type="button" className={btnSec} onClick={onFechar}>Cancelar</button>
      </div>
    </div>
  );
};

const CardAcordo: React.FC<{ a: AcordoParceria }> = ({ a }) => {
  const [aba, setAba] = useState<'nada' | 'ciencia' | 'simular'>('nada');
  const [valor, setValor] = useState(100000);
  const [integro, setIntegro] = useState<boolean | null>(null);
  const div = aba === 'simular' ? calcularDivisao(a.participantes, valor) : [];
  return (
    <div className={`${card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS[a.status]}`}>{a.status}</span>
            <span className="text-[12px] text-ink-mute">{a.id} · {CLASSE_LABEL[a.classe]}</span>
          </div>
          <div className="mt-1 text-[15px] font-semibold text-ink">{a.titulo}</div>
          <div className="text-[12px] text-ink-mute">Criado por {a.criadoPor} em {new Date(a.criadoEm).toLocaleDateString('pt-BR')}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnSec} onClick={() => setAba(aba === 'simular' ? 'nada' : 'simular')}><Calculator className="h-4 w-4" /> Simular divisão</button>
          {a.status === 'rascunho' && <button type="button" className={btnPri} onClick={() => setAba('ciencia')}><FileSignature className="h-4 w-4" /> Registrar ciência</button>}
          {a.status === 'rascunho' && <button type="button" className={btnSec} onClick={() => store.excluirRascunho(a.id)}><Trash2 className="h-4 w-4" /></button>}
          {a.status === 'vigente' && <button type="button" className={btnSec} onClick={() => store.encerrar(a.id)}>Encerrar</button>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {a.participantes.map((p) => (
          <span key={p.id} className="rounded-lg border border-hairline bg-canvas px-2.5 py-1 text-[12px] text-ink-2">
            <b className="text-ink">{p.percentual}%</b> · {p.nome} <span className="text-ink-mute">({p.registro} · {p.papel})</span>
          </span>
        ))}
      </div>

      {a.ciencia && (
        <div className="mt-3 text-[12px] text-ink-2">
          Ciência: <b>{a.ciencia.cliente}</b> ({a.ciencia.documento}) via {a.ciencia.meio.replace('_', ' ')} em {new Date(a.ciencia.em).toLocaleDateString('pt-BR')}
        </div>
      )}
      {a.selo && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
          <ShieldCheck className="h-4 w-4 text-good" />
          <code className="text-ink-2">SHA-256 {a.selo.slice(0, 16)}…{a.selo.slice(-8)}</code>
          <button type="button" className="text-accent underline" onClick={async () => setIntegro(await store.verificarSelo(a))}>verificar</button>
          {integro === true && <span className="text-good">íntegro</span>}
          {integro === false && <span className="text-crit">divergente — acordo alterado após o selo</span>}
        </div>
      )}

      {aba === 'ciencia' && <Ciencia acordo={a} onFechar={() => setAba('nada')} />}
      {aba === 'simular' && (
        <div className="mt-3 rounded-xl border border-hairline bg-canvas p-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-2">Honorários recebidos (R$)</span>
            <input type="number" min={0} className={`${input} w-40`} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
          <ul className="mt-2 space-y-0.5 text-[13px] text-ink">
            {div.map((d) => <li key={d.id}>• {d.nome}: <b>{brl(d.valorBrl)}</b></li>)}
            <li className="text-ink-mute">• Velatrix: R$ 0,00 (a plataforma não participa de honorários)</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export const CorrespondentesPanel: React.FC = () => {
  const { activeTenant } = useAuth();
  const todos = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const [novo, setNovo] = useState(false);
  const acordos = todos.filter((a) => a.tenantId === activeTenant.id);
  const vigentes = acordos.filter((a) => a.status === 'vigente').length;

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-canvas text-accent"><Handshake className="h-5 w-5" /></span>
            <div>
              <div className={label}>Escritório · {activeTenant.name}</div>
              <div className="text-[20px] font-semibold text-ink">Correspondentes & Parcerias</div>
              <div className="max-w-2xl text-[13px] text-ink-2">
                Divisão de honorários entre profissionais da mesma classe — correspondentes, coautoria e parcerias entre bancas — com ciência do cliente registrada e acordo selado em SHA-256.
              </div>
            </div>
          </div>
          <button type="button" className={btnPri} onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Novo acordo</button>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent-tint px-4 py-3 text-[12.5px] text-ink-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            A Velatrix é fornecedora de software: <b>não participa de honorários</b> nem recebe percentual sobre resultado do cliente.
            A cobrança da plataforma é feita pelo pacote contratado (licença + uso). Divisões entre classes diferentes (ex.: advogado × contador) não são permitidas aqui.
          </span>
        </div>
        <div className="mt-3 text-[12px] text-ink-mute">{acordos.length} acordo(s) · {vigentes} vigente(s)</div>
      </div>

      {novo && <NovoAcordo onFechar={() => setNovo(false)} />}
      {acordos.length === 0 && !novo && (
        <div className={`${card} px-5 py-10 text-center text-[13px] text-ink-mute`}>Nenhum acordo de parceria registrado.</div>
      )}
      {acordos.map((a) => <CardAcordo key={a.id} a={a} />)}
    </div>
  );
};
