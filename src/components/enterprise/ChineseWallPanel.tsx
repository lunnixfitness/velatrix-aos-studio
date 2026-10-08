import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Lock, ShieldCheck, ShieldAlert, UserX, Eye } from 'lucide-react';
import { barreirasVigentes, avaliarAcesso, membrosBloqueados, type MembroRef } from '../../enterprise/chineseWall.ts';
import { subscribe, getSnapshot, getAcessosNegados } from '../../services/conflictCaseStore.ts';

/**
 * Central Enterprise · Conflict Check · Chinese Walls vigentes (P19).
 * Mostra cada barreira ativa, quem ela bloqueia entre os membros reais do tenant, um simulador de acesso
 * ("o que esta pessoa consegue abrir?") e a auditoria de tentativas negadas.
 */

const dataBR = (iso: string) => new Date(iso).toLocaleString('pt-BR');
const input = 'h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] font-normal';

export const ChineseWallPanel: React.FC<{ membros: MembroRef[] }> = ({ membros }) => {
  const casos = useSyncExternalStore(subscribe, getSnapshot);
  const negados = useSyncExternalStore(subscribe, getAcessosNegados);
  const barreiras = useMemo(() => barreirasVigentes(casos), [casos]);
  const [simId, setSimId] = useState(membros[0]?.id ?? '');
  const sim = membros.find((m) => m.id === simId);

  return (
    <div className="space-y-4">
      {barreiras.length === 0 ? (
        <div className="rounded-xl border border-hairline bg-canvas px-5 py-8 text-center text-[13px] text-ink-mute">
          Nenhuma Chinese Wall vigente. Ela nasce quando um caso é aprovado com barreira no Painel do Sócio.
        </div>
      ) : barreiras.map((b) => {
        const bloqueados = membrosBloqueados(b, membros);
        return (
          <div key={b.id} className="rounded-xl border border-warn/25 bg-canvas overflow-hidden">
            <div className="px-5 py-3 bg-warn-soft text-warn flex flex-col md:flex-row md:items-center justify-between gap-1">
              <div className="font-semibold text-[13.5px] inline-flex items-center gap-1.5"><Lock className="w-4 h-4" /> {b.id}</div>
              <div className="text-[12px]">Caso {b.casoId} · ativa desde {dataBR(b.ativadaEm)}</div>
            </div>
            <div className="px-5 py-4 grid md:grid-cols-2 gap-4 text-[12.5px]">
              <div className="space-y-1.5">
                <div className="text-ink font-medium">{b.descricao}</div>
                <div className="text-ink-2">Matéria nova: {b.descricaoCaso}</div>
                <div className="text-ink-2">Clientes/partes: {b.clientes.map((c) => c.nome + (c.documento ? ` (${c.documento})` : '')).join(' · ')}</div>
                <div className="text-ink-2">Matérias isoladas: {b.materiasIsoladas.join(', ') || '—'}</div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-mute">Lado bloqueado</div>
                <div className="text-ink-2">Equipes: {b.equipesBloqueadas.join(', ') || '—'} · Usuários: {b.usuariosBloqueados.join(', ') || '—'}</div>
                <div className="flex flex-wrap gap-1.5">
                  {bloqueados.length === 0 && <span className="text-ink-mute">Nenhum membro atual corresponde.</span>}
                  {bloqueados.map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface border border-hairline text-[11.5px] text-ink-2">
                      <UserX className="w-3 h-3 text-warn" /> {m.name}{m.department ? ` · ${m.department}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="text-[14px] font-semibold text-ink inline-flex items-center gap-2"><Eye className="w-4 h-4 text-accent" /> Simular acesso</div>
          <select value={simId} onChange={(e) => setSimId(e.target.value)} className={input + ' md:w-96'}>
            {membros.map((m) => <option key={m.id} value={m.id}>{m.name}{m.department ? ` · ${m.department}` : ''}</option>)}
          </select>
        </div>
        {sim && (
          <div className="border border-hairline rounded-lg overflow-hidden">
            {casos.length === 0 && <div className="px-4 py-4 text-[12.5px] text-ink-mute">Nenhum caso registrado ainda.</div>}
            {casos.map((c) => {
              const a = avaliarAcesso({ id: sim.id, equipe: sim.department }, { casoId: c.id }, barreiras);
              return (
                <div key={c.id} className="grid md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] gap-2 px-4 py-2.5 border-b border-hairline last:border-b-0 text-[12.5px]">
                  <span className="font-mono text-[12px] text-ink">{c.id}</span>
                  <span className="text-ink-2 truncate">{c.solicitacao.descricao}</span>
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${a.permitido ? 'text-good' : 'text-crit'}`}>
                    {a.permitido ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {a.permitido ? 'Acesso permitido' : a.motivo}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-hairline bg-canvas p-5 space-y-2">
        <div className="text-[14px] font-semibold text-ink">Tentativas de acesso negadas ({negados.length})</div>
        {negados.length === 0 && <div className="text-[12.5px] text-ink-mute">Nenhuma tentativa bloqueada registrada.</div>}
        {negados.slice(0, 30).map((n, i) => (
          <div key={i} className="grid md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1.4fr)] gap-2 text-[12px]">
            <span className="text-ink-mute">{dataBR(n.em)}</span>
            <span className="text-ink">{n.nome}</span>
            <span className="text-ink-2">{n.casoId} · {n.motivo}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChineseWallPanel;
