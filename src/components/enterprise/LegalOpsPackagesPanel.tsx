import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Package, Check, Minus, ArrowUpRight, ArrowDownRight, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  LEGALOPS_PACKAGES,
  PACOTE_ORDEM,
  RECURSO_LABEL,
  LIMITE_LABEL,
  avaliarUso,
  compararPacotes,
  bloqueiosDowngrade,
  formatLimite,
  type LegalOpsFeature,
  type LegalOpsLimit,
  type LegalOpsPackageId,
  type AvaliacaoUso,
} from '../../enterprise/legalOpsPackages';
import { barreirasVigentes } from '../../enterprise/chineseWall';
import * as casoStore from '../../services/conflictCaseStore';
import * as pacoteStore from '../../services/legalOpsPackageStore';
import { usePacoteLegalOps } from './usePacoteLegalOps';

/**
 * Central Enterprise · Pacotes LegalOps (P21)
 * Pacote vigente do tenant, consumo vs. limites, matriz comparativa e
 * simulação de upgrade/downgrade. Super Admin aplica; o tenant solicita.
 */

const FEATURES = Object.keys(RECURSO_LABEL) as LegalOpsFeature[];
const LIMITES = Object.keys(LIMITE_LABEL) as LegalOpsLimit[];
const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const TOM: Record<AvaliacaoUso['estado'], { bar: string; txt: string; label: string }> = {
  ok: { bar: 'bg-good', txt: 'text-good', label: 'Dentro do limite' },
  alerta: { bar: 'bg-warn', txt: 'text-warn', label: 'Acima de 80%' },
  excedido: { bar: 'bg-crit', txt: 'text-crit', label: 'Limite atingido' },
  ilimitado: { bar: 'bg-accent', txt: 'text-accent', label: 'Ilimitado' },
  indisponivel: { bar: 'bg-hairline', txt: 'text-ink-mute', label: 'Fora do pacote' },
};

const Medidor: React.FC<{ a: AvaliacaoUso }> = ({ a }) => {
  const t = TOM[a.estado];
  const w = a.estado === 'ilimitado' ? 100 : Math.min(100, a.pct);
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">{LIMITE_LABEL[a.limite]}</div>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="text-[22px] font-semibold text-ink">{a.usado.toLocaleString('pt-BR')}</span>
        <span className="text-[13px] text-ink-mute">/ {formatLimite(a.max)}</span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${t.bar} ${a.estado === 'ilimitado' ? 'opacity-30' : ''}`} style={{ width: `${w}%` }} />
      </div>
      <div className={`mt-2 text-[12px] font-medium ${t.txt}`}>
        {t.label}
        {a.restante != null && a.estado !== 'indisponivel' ? ` · restam ${a.restante.toLocaleString('pt-BR')}` : ''}
      </div>
    </div>
  );
};

export const LegalOpsPackagesPanel: React.FC = () => {
  const { activeTenant, tenantMembers, isSuperAdmin, currentUser } = useAuth();
  const { contrato, direitos } = usePacoteLegalOps();
  const casos = useSyncExternalStore(casoStore.subscribe, casoStore.getSnapshot);
  const { solicitacoes } = useSyncExternalStore(pacoteStore.subscribe, pacoteStore.getSnapshot);
  const [alvo, setAlvo] = useState<LegalOpsPackageId | null>(null);
  const [motivo, setMotivo] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const uso = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    const doTenant = casos.filter((c) => c.tenantId === activeTenant.id);
    return {
      assentos: (tenantMembers || []).filter((m) => m.tenantId === activeTenant.id && m.status !== 'REVOKED').length,
      conflictChecksMes: doTenant.filter((c) => (c.criadoEm || '').slice(0, 7) === mes).length,
      barreirasAtivas: barreirasVigentes(doTenant).length,
    } satisfies Partial<Record<LegalOpsLimit, number>>;
  }, [casos, tenantMembers, activeTenant.id]);

  const medidores = (Object.keys(uso) as (keyof typeof uso)[]).map((l) => avaliarUso(direitos, l, uso[l]));
  const atual = direitos.pacote;
  const diff = alvo && alvo !== atual.id ? compararPacotes(atual.id, alvo) : null;
  const bloqueios = diff?.direcao === 'downgrade' ? bloqueiosDowngrade(diff.para, uso) : [];
  const abertas = solicitacoes.filter((s) => s.tenantId === activeTenant.id && s.status === 'aberta');
  const nomeUsuario = currentUser?.name || 'Usuário';

  const aplicar = () => {
    if (!diff || bloqueios.length) return;
    pacoteStore.definirPacote(activeTenant.id, diff.para, nomeUsuario);
    setAviso(`Pacote ${LEGALOPS_PACKAGES[diff.para].nome} aplicado ao tenant ${activeTenant.name}.`);
    setAlvo(null);
  };
  const solicitar = () => {
    if (!diff) return;
    const s = pacoteStore.solicitarUpgrade({
      tenantId: activeTenant.id, de: atual.id, para: diff.para, solicitanteNome: nomeUsuario, motivo: motivo.trim(),
    });
    setAviso(`Solicitação ${s.id} registrada. O time Velatrix entra em contato para formalizar o aditivo.`);
    setMotivo('');
    setAlvo(null);
  };

  return (
    <div className="space-y-5">
      {/* Pacote vigente */}
      <div className="rounded-2xl border border-hairline bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-hairline bg-canvas text-accent">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Pacote vigente · {activeTenant.name}</div>
              <div className="text-[20px] font-semibold text-ink">{atual.nome}</div>
              <div className="text-[13px] text-ink-2">{atual.publico} — {atual.resumo}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-semibold text-ink">{atual.precoLabel}</div>
            <div className="text-[12px] text-ink-mute">
              {contrato.origem === 'contratado'
                ? `Contratado · ${new Date(contrato.atualizadoEm).toLocaleDateString('pt-BR')}`
                : 'Derivado do plano atual (sem contrato LegalOps)'}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-ink-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-2.5 py-1"><Clock className="h-3.5 w-3.5" /> 1ª resposta ≤ {atual.sla.respostaMin} min</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-2.5 py-1"><ShieldCheck className="h-3.5 w-3.5" /> Disponibilidade {atual.sla.disponibilidade}</span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-2.5 py-1">{atual.sla.suporte}</span>
        </div>
      </div>

      {aviso && (
        <div className="rounded-xl border border-hairline bg-accent-tint px-4 py-3 text-[13px] text-ink">{aviso}</div>
      )}

      {/* Consumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        {medidores.map((a) => <Medidor key={a.limite} a={a} />)}
      </div>

      {/* Matriz */}
      <div className="overflow-x-auto rounded-2xl border border-hairline bg-surface">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Recurso</th>
              {PACOTE_ORDEM.map((id) => {
                const p = LEGALOPS_PACKAGES[id];
                const vig = id === atual.id;
                return (
                  <th key={id} className={`px-4 py-3 text-left align-top ${vig ? 'bg-accent-tint' : ''}`}>
                    <div className="font-semibold text-ink">{p.nome}{vig && <span className="ml-1.5 text-[11px] font-medium text-accent">· vigente</span>}</div>
                    <div className="text-[12px] font-normal text-ink-mute">{p.precoLabel}</div>
                    {!vig && (
                      <button
                        type="button"
                        onClick={() => { setAlvo(id); setAviso(null); }}
                        className={`mt-2 rounded-md border px-2 py-1 text-[12px] font-medium ${alvo === id ? 'border-accent text-accent' : 'border-hairline text-ink-2 hover:border-hairline-strong'}`}
                      >
                        Simular
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f) => (
              <tr key={f} className="border-b border-hairline last:border-0">
                <td className="px-4 py-2.5 text-ink-2">{RECURSO_LABEL[f]}</td>
                {PACOTE_ORDEM.map((id) => (
                  <td key={id} className={`px-4 py-2.5 ${id === atual.id ? 'bg-accent-tint' : ''}`}>
                    {LEGALOPS_PACKAGES[id].recursos[f]
                      ? <Check className="h-4 w-4 text-good" />
                      : <Minus className="h-4 w-4 text-ink-soft" />}
                  </td>
                ))}
              </tr>
            ))}
            {LIMITES.map((l) => (
              <tr key={l} className="border-b border-hairline last:border-0">
                <td className="px-4 py-2.5 text-ink-2">{LIMITE_LABEL[l]}</td>
                {PACOTE_ORDEM.map((id) => (
                  <td key={id} className={`px-4 py-2.5 font-medium text-ink ${id === atual.id ? 'bg-accent-tint' : ''}`}>
                    {formatLimite(LEGALOPS_PACKAGES[id].limites[l])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simulação */}
      {diff && (
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            {diff.direcao === 'upgrade' ? <ArrowUpRight className="h-4 w-4 text-good" /> : <ArrowDownRight className="h-4 w-4 text-warn" />}
            {diff.direcao === 'upgrade' ? 'Upgrade' : 'Downgrade'}: {atual.nome} → {LEGALOPS_PACKAGES[diff.para].nome}
          </div>
          <div className="mt-1 text-[13px] text-ink-2">
            Impacto mensal:{' '}
            <b className="text-ink">
              {diff.deltaMensalBrl == null ? 'sob consulta' : `${diff.deltaMensalBrl >= 0 ? '+' : '−'}${brl(Math.abs(diff.deltaMensalBrl))}`}
            </b>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">
                {diff.direcao === 'upgrade' ? 'Recursos liberados' : 'Recursos removidos'}
              </div>
              <ul className="mt-2 space-y-1 text-[13px] text-ink">
                {(diff.direcao === 'upgrade' ? diff.recursosGanhos : diff.recursosPerdidos).map((f) => <li key={f}>• {RECURSO_LABEL[f]}</li>)}
                {!(diff.direcao === 'upgrade' ? diff.recursosGanhos : diff.recursosPerdidos).length && <li className="text-ink-mute">Nenhum</li>}
              </ul>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Limites</div>
              <ul className="mt-2 space-y-1 text-[13px] text-ink">
                {diff.limitesAlterados.map((x) => (
                  <li key={x.limite}>• {LIMITE_LABEL[x.limite]}: {formatLimite(x.de)} → <b>{formatLimite(x.para)}</b></li>
                ))}
              </ul>
            </div>
          </div>

          {bloqueios.length > 0 && (
            <div className="mt-4 rounded-xl border border-hairline bg-crit-soft px-4 py-3 text-[13px] text-crit">
              <div className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-4 w-4" /> Downgrade bloqueado pelo uso atual</div>
              <ul className="mt-1 space-y-0.5">{bloqueios.map((b) => <li key={b}>• {b}</li>)}</ul>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {isSuperAdmin ? (
              <button
                type="button"
                disabled={bloqueios.length > 0}
                onClick={aplicar}
                className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aplicar pacote ao tenant
              </button>
            ) : diff.direcao === 'upgrade' ? (
              <>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  maxLength={500}
                  placeholder="Motivo (opcional) — ex.: nova área de M&A, +40 advogados"
                  className="h-9 min-w-[280px] flex-1 rounded-lg border border-hairline bg-canvas px-3 text-[13px] text-ink"
                />
                <button type="button" onClick={solicitar} className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90">
                  Solicitar upgrade
                </button>
              </>
            ) : (
              <span className="text-[13px] text-ink-mute">Downgrades são tratados pelo time comercial Velatrix.</span>
            )}
            <button type="button" onClick={() => setAlvo(null)} className="rounded-lg border border-hairline px-3 py-2 text-[13px] text-ink-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Solicitações */}
      {abertas.length > 0 && (
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Solicitações em aberto</div>
          <ul className="mt-3 divide-y divide-hairline">
            {abertas.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-[13px]">
                <div className="text-ink">
                  <b>{s.id}</b> · {LEGALOPS_PACKAGES[s.de].nome} → {LEGALOPS_PACKAGES[s.para].nome}
                  <span className="text-ink-mute"> · {s.solicitanteNome} · {new Date(s.em).toLocaleString('pt-BR')}</span>
                  {s.motivo && <div className="text-ink-2">{s.motivo}</div>}
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => pacoteStore.definirPacote(s.tenantId, s.para, nomeUsuario)} className="rounded-md bg-accent px-2.5 py-1 text-[12px] font-semibold text-white">Aplicar</button>
                    <button type="button" onClick={() => pacoteStore.recusarSolicitacao(s.id)} className="rounded-md border border-hairline px-2.5 py-1 text-[12px] text-ink-2">Recusar</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[12px] text-ink-mute">
        Valores indicativos. O gate desta tela é de interface; o enforcement definitivo de recursos e limites deve ocorrer no backend (rotas + RLS) quando a persistência Firebase entrar.
      </p>
    </div>
  );
};
