import React, { useMemo, useState } from 'react';
import { ShieldCheck, ShieldAlert, ShieldQuestion, Scale, Info } from 'lucide-react';
import { SubTabBar } from '../console/SubTabBar';
import { formatBRL } from '../../enterprise/deterministicEngine.ts';
import type { Esteira, Achado, Flag } from '../../enterprise/riskShield.ts';
import { casosDaEsteira, rodarShield, normasShield } from '../../services/riskShieldDemo';

const FLAG_UI: Record<Flag, { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
  GREEN: { label: 'Verde', cls: 'bg-good-soft text-good border-good/25', Icon: ShieldCheck },
  YELLOW: { label: 'Amarelo', cls: 'bg-warn-soft text-warn border-warn/25', Icon: ShieldAlert },
  RED: { label: 'Vermelho', cls: 'bg-crit-soft text-crit border-crit/25', Icon: ShieldAlert },
  NAO_AVALIADO: { label: 'Não avaliado', cls: 'bg-surface text-ink-mute border-hairline-strong', Icon: ShieldQuestion },
};
const SEV_UI: Record<string, string> = { RED: 'bg-crit-soft text-crit', YELLOW: 'bg-warn-soft text-warn', INFO: 'bg-accent-soft text-accent' };
const SEV_LABEL: Record<string, string> = { RED: 'Vermelho', YELLOW: 'Amarelo', INFO: 'Informativo' };

type Filtro = 'todas' | 'RED' | 'YELLOW' | 'nao_verificado' | 'ok';

function classeResultado(a: Achado): Filtro {
  if (a.resultado.status === 'NAO_VERIFICADO') return 'nao_verificado';
  if (a.resultado.status === 'OK') return 'ok';
  return a.severidade === 'RED' ? 'RED' : 'YELLOW';
}

export interface RiskShieldPanelProps { esteira: Esteira; }

export const RiskShieldPanel: React.FC<RiskShieldPanelProps> = ({ esteira }) => {
  const casos = useMemo(() => casosDaEsteira(esteira), [esteira]);
  const [casoId, setCasoId] = useState<string>(casos[0]?.id ?? '');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const r = useMemo(() => rodarShield(esteira, casoId), [esteira, casoId]);
  const ui = FLAG_UI[r.flag];

  const cont = useMemo(() => {
    const c = { RED: 0, YELLOW: 0, nao_verificado: 0, ok: 0 } as Record<Exclude<Filtro, 'todas'>, number>;
    r.achados.forEach((a) => { c[classeResultado(a) as Exclude<Filtro, 'todas'>]++; });
    return c;
  }, [r]);
  const lista = r.achados.filter((a) => filtro === 'todas' || classeResultado(a) === filtro);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-[22px] font-semibold text-ink tracking-tight">Shield de Risco</h2>
            <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded bg-warn-soft text-warn" title="Checagens reais sobre dados de demonstração">DEMO</span>
          </div>
          <p className="text-[13.5px] text-ink-mute max-w-3xl">Cada checagem é uma regra determinística com norma e evidência. A classificação final é a pior severidade entre as checagens que falharam. Sem dados, o resultado é “não avaliado” — nunca verde.</p>
        </div>
        {casos.length > 0 && (
          <label className="flex flex-col gap-1 text-[12px] text-ink-mute min-w-[280px]">
            <span>Caso analisado <span className="font-mono text-[10px] text-warn">DEMO</span></span>
            <select value={casoId} onChange={(e) => setCasoId(e.target.value)} className="h-10 px-3 rounded-lg border border-hairline-strong bg-canvas text-[13px] text-ink">
              {casos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${ui.cls}`}>
          <ui.Icon className="w-10 h-10 shrink-0" />
          <div>
            <div className="text-[12px] font-medium opacity-80">Classificação de risco</div>
            <div className="text-[24px] font-semibold leading-tight">{ui.label}</div>
            {casos.length > 0 && <div className="text-[12px] opacity-80 mt-0.5">{casos.find((c) => c.id === casoId)?.descricao}</div>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([['Falhas vermelhas', cont.RED, 'text-crit'], ['Falhas amarelas', cont.YELLOW, 'text-warn'], ['Não verificadas', cont.nao_verificado, 'text-ink-mute'], ['Aprovadas', cont.ok, 'text-good']] as const).map(([l, v, c]) => (
            <div key={l} className="bg-canvas border border-hairline rounded-xl px-4 py-3">
              <div className="text-[12px] text-ink-mute">{l}</div>
              <div className={`font-mono text-[24px] font-semibold ${c}`}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {!r.catalogoCadastrado && (
        <div className="flex items-start gap-3 rounded-xl border border-hairline bg-surface px-5 py-4 text-[13px] text-ink-2">
          <Info className="w-4 h-4 mt-0.5 text-ink-mute shrink-0" />
          <span>O catálogo de checagens desta esteira ainda não foi cadastrado. Até lá, todo caso aparece como <strong>não avaliado</strong>. As checagens são adicionadas por esteira e versão, cada uma com a norma de referência.</span>
        </div>
      )}

      {r.exposicao && (
        <div className="rounded-xl border border-hairline bg-canvas px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div className="text-[13px] text-ink-2">
              <div className="font-semibold text-ink">Exposição a multa de ofício em caso de lançamento</div>
              <div>{r.exposicao.pct}% sobre {formatBRL(r.exposicao.baseCentavos)} · {normasShield.get(r.exposicao.normaRefId)?.ementa.split(';')[0]}</div>
              <div className="text-[12px] text-ink-mute">Fora do cálculo: {r.exposicao.excluidas.join('; ')}</div>
            </div>
          </div>
          <div className="font-mono text-[20px] font-semibold text-ink">{formatBRL(r.exposicao.multaCentavos)}</div>
        </div>
      )}

      {r.achados.length > 0 && (
        <>
          <SubTabBar
            tabs={[
              { id: 'todas', label: 'Todas', count: r.achados.length },
              { id: 'RED', label: 'Vermelho', count: cont.RED },
              { id: 'YELLOW', label: 'Amarelo', count: cont.YELLOW },
              { id: 'nao_verificado', label: 'Não verificado', count: cont.nao_verificado },
              { id: 'ok', label: 'Aprovadas', count: cont.ok },
            ]}
            activeTab={filtro}
            onTabChange={(id) => setFiltro(id as Filtro)}
          />
          <div className="border border-hairline rounded-xl overflow-hidden bg-canvas">
            <div className="hidden md:grid grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,2.4fr)] gap-4 px-5 py-2.5 bg-surface border-b border-hairline text-[11px] font-semibold uppercase tracking-wide text-ink-mute">
              <span>Checagem</span><span>Norma</span><span>Resultado</span><span>Evidência</span>
            </div>
            {lista.length === 0 && <div className="px-5 py-8 text-center text-[13px] text-ink-mute">Nenhuma checagem neste filtro.</div>}
            {lista.map((a) => {
              const cls = classeResultado(a);
              const norma = a.normaRefId ? normasShield.get(a.normaRefId) : undefined;
              return (
                <div key={a.checkId} className="grid md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,2.4fr)] gap-2 md:gap-4 px-5 py-3.5 border-b border-hairline last:border-b-0 text-[13px]">
                  <div className="space-y-1">
                    <div className="text-ink font-medium">{a.descricao}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${SEV_UI[a.severidade]}`} title="Severidade caso a checagem falhe">Se falhar: {SEV_LABEL[a.severidade]}</span>
                      <code className="font-mono text-[11px] text-ink-soft">{a.checkId}</code>
                    </div>
                  </div>
                  <div className="text-ink-2 text-[12.5px]" title={norma?.ementa}>{norma ? `${a.normaRefId}` : <span className="text-ink-mute">—</span>}</div>
                  <div>
                    {cls === 'ok' && <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-good-soft text-good">OK</span>}
                    {(cls === 'RED' || cls === 'YELLOW') && <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${SEV_UI[cls]}`}>Falhou</span>}
                    {cls === 'nao_verificado' && <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full bg-surface text-ink-mute border border-hairline">Não verificado</span>}
                  </div>
                  <div className="text-ink-2 text-[12.5px] break-words">{a.resultado.status === 'NAO_VERIFICADO' ? a.resultado.motivo : a.resultado.evidencia}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RiskShieldPanel;
