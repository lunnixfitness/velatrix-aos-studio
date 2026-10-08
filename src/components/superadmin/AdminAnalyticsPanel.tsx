/**
 * VELATRIX AOS · Super Admin · Analytics de uso ao vivo
 *
 * Quem está usando agora, em qual tela, de onde, em que horário; consumo de IA e desfechos.
 * Só super_admin (rota /api/v1/super-admin/* + aba restrita no RBAC).
 * Mostra metadados de navegação — nunca o conteúdo da tela do cliente.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, Building2, Clock, Cpu, Download, Gavel, MapPin, Monitor, Radio, RefreshCw, ShieldCheck, Smartphone, Users,
} from 'lucide-react';
import { authFetch } from '../../services/authClient';
import type { ResumoTelemetria, SessaoAoVivo, ItemFeed, JanelaId, ResultadoDesfecho } from '../../types/telemetriaUso';

// ───────────────────────── tipos da API ─────────────────────────

type Resumo = Omit<ResumoTelemetria, 'tenants'> & {
  tenants: Array<ResumoTelemetria['tenants'][number] & { tenantNome: string }>;
  tenantsConhecidos: Array<{ id: string; nome: string }>;
};
type SessaoView = SessaoAoVivo & { nome: string; tenantNome: string };
type FeedView = ItemFeed & { nome: string; tenantNome: string };
interface AoVivo { sessoes: SessaoView[]; feed: FeedView[]; }

const API = '/api/v1/super-admin/telemetria';
const JANELAS: Array<{ id: JanelaId; label: string }> = [
  { id: '1h', label: '1 h' }, { id: '24h', label: '24 h' }, { id: '7d', label: '7 dias' }, { id: '30d', label: '30 dias' },
];

// ───────────────────────── rótulos ─────────────────────────

const TELA_LABEL: Record<string, string> = {
  operational_dashboard: 'Início', novo_laudo: 'Novo Laudo', esteiras_laudos_hub: 'Central de Esteiras', central_laudos: 'Central de Laudos',
  ent_hub: 'Central Enterprise', ent_hitl: 'Fila de aprovação (HITL)', ent_jurimetria: 'Jurimetria', ent_guardrail: 'Guardrail', ent_risk_shield: 'Shield de Risco',
  ent_connect: 'Velatrix Connect', ent_zdr: 'ZDR', ent_verify_seal: 'Verificar selo', ent_conflict: 'Conflict Check', ent_packages: 'Pacotes enterprise',
  inss: 'Especialista INSS', inss_obras: 'INSS Obras', pericia: 'Perícia Judicial', precatoria: 'Precatórios', legal_tax_recovery: 'Recuperação Tributária',
  leitura_autos: 'Leitura de Autos', motor_pericial: 'Motor Pericial', contract_lab: 'Contract Lab', oraculo_liquidez: 'Oráculo de Liquidez',
  partner_portal: 'Correspondentes & Parcerias', audit_ledger_view: 'Auditoria', governance_settings: 'Configurações', erp_connector_config: 'Integrações',
  webhooks: 'Webhooks', split_api: 'Pagamentos & Gov', onboarding_wizard: 'Primeiros passos', express_diagnosis: 'Diagnóstico expresso',
  super_admin: 'Super Admin', admin_analytics: 'Analytics (admin)', llm_engine: 'IA · LLM', observability: 'Observability',
};
const telaLabel = (t?: string | null) => (t ? TELA_LABEL[t] ?? t.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—');

const PAPEL_LABEL: Record<string, string> = {
  tenant_admin: 'Admin do escritório', c_level_approver: 'Sócio aprovador', operator: 'Operador', super_admin: 'Velatrix',
  office_staff: 'Equipe', cfo_executive: 'Financeiro', parceiro_tributario: 'Parceiro tributário', parceiro_operacional: 'Parceiro operacional',
  advogado_tributarista: 'Advogado', contador_fiscal: 'Contador', perito_judicial: 'Perito',
};

const DESFECHO: Record<ResultadoDesfecho, { label: string; cor: string }> = {
  ganha: { label: 'Ganhas', cor: 'var(--accent)' },
  acordo: { label: 'Acordo', cor: '#0E7490' },
  perdida: { label: 'Perdidas', cor: '#B42318' },
  arquivada: { label: 'Arquivadas', cor: '#98A2B3' },
};

// ───────────────────────── formatação ─────────────────────────

const nf = new Intl.NumberFormat('pt-BR');
const compacto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const pct = (x: number | null) => (x === null ? '—' : `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`);
const hhmm = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
function ha(t: number, agora: number): string {
  const s = Math.max(0, Math.round((agora - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
function horas(min: number): string {
  if (min < 60) return `${nf.format(min)} min`;
  return `${nf.format(Math.round(min / 60))} h`;
}

// ───────────────────────── gráficos (SVG puro) ─────────────────────────

function GraficoArea({ pontos, granularidade }: { pontos: ResumoTelemetria['serie']; granularidade: 'hora' | 'dia' }) {
  const W = 640, H = 200, P = { l: 36, r: 8, t: 10, b: 24 };
  if (!pontos.length) return <Vazio texto="Sem dados no período." />;
  const max = Math.max(1, ...pontos.map((p) => p.sessoes));
  const x = (i: number) => P.l + (pontos.length === 1 ? 0 : (i / (pontos.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.sessoes).toFixed(1)}`).join(' ');
  const area = `${linha} L${x(pontos.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const passoX = Math.max(1, Math.ceil(pontos.length / 6));
  const rotulo = (t: number) =>
    granularidade === 'dia'
      ? new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
      : hhmm(t);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full text-accent" role="img" aria-label="Sessões no período">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="var(--hairline)" strokeDasharray={v ? '3 3' : undefined} />
          <text x={P.l - 6} y={y(v) + 3} textAnchor="end" fontSize="10" fill="var(--ink-mute)">{nf.format(v)}</text>
        </g>
      ))}
      <path d={area} fill="currentColor" opacity={0.1} />
      <path d={linha} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
      {pontos.map((p, i) => (
        <g key={p.t}>
          <circle cx={x(i)} cy={y(p.sessoes)} r={8} fill="transparent">
            <title>{`${rotulo(p.t)} · ${nf.format(p.sessoes)} sessões · ${nf.format(p.usuarios)} usuários · ${compacto.format(p.tokens)} tokens`}</title>
          </circle>
          {i % passoX === 0 && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--ink-mute)">{rotulo(p.t)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

function GraficoHoras({ valores, horaAtual }: { valores: number[]; horaAtual: number }) {
  const W = 480, H = 170, P = { l: 4, r: 4, t: 18, b: 20 };
  const max = Math.max(1, ...valores);
  const pico = valores.indexOf(Math.max(...valores));
  const bw = (W - P.l - P.r) / 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full text-accent" role="img" aria-label="Aberturas de tela por hora do dia">
      {valores.map((v, h) => {
        const alt = (v / max) * (H - P.t - P.b);
        const x = P.l + h * bw + 2;
        return (
          <g key={h}>
            <rect x={x} y={H - P.b - alt} width={bw - 4} height={Math.max(alt, v ? 1 : 0)} rx={2}
              fill="currentColor" opacity={h === pico ? 1 : h === horaAtual ? 0.75 : 0.35}>
              <title>{`${String(h).padStart(2, '0')}h · ${nf.format(v)} aberturas`}</title>
            </rect>
            {h === pico && v > 0 && (
              <text x={x + (bw - 4) / 2} y={H - P.b - alt - 5} textAnchor="middle" fontSize="10" fontWeight={600} fill="var(--ink)">pico</text>
            )}
            {h % 3 === 0 && (
              <text x={x + (bw - 4) / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--ink-mute)">{String(h).padStart(2, '0')}h</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function Rosca({ desfechos, taxa }: { desfechos: Record<ResultadoDesfecho, number>; taxa: number | null }) {
  const total = (Object.values(desfechos) as number[]).reduce((a, b) => a + b, 0);
  const R = 52, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Desfechos de causas">
        <circle cx={70} cy={70} r={R} fill="none" stroke="var(--hairline)" strokeWidth={16} />
        {total > 0 && (Object.keys(DESFECHO) as ResultadoDesfecho[]).map((k) => {
          const v = desfechos[k];
          if (!v) return null;
          const len = (v / total) * C;
          const el = (
            <circle key={k} cx={70} cy={70} r={R} fill="none" stroke={DESFECHO[k].cor} strokeWidth={16}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)">
              <title>{`${DESFECHO[k].label}: ${v}`}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
        <text x={70} y={68} textAnchor="middle" fontSize="20" fontWeight={600} fill="var(--ink)">{pct(taxa)}</text>
        <text x={70} y={86} textAnchor="middle" fontSize="10" fill="var(--ink-mute)">taxa de êxito</text>
      </svg>
      <ul className="space-y-1.5 text-[13px]">
        {(Object.keys(DESFECHO) as ResultadoDesfecho[]).map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: DESFECHO[k].cor }} />
            <span className="text-ink-2">{DESFECHO[k].label}</span>
            <span className="ml-auto pl-4 font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{nf.format(desfechos[k])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Barras({ itens }: { itens: Array<{ rotulo: string; sub?: string; valor: number }> }) {
  if (!itens.length) return <Vazio texto="Sem dados no período." />;
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <ul className="space-y-2.5">
      {itens.map((i) => (
        <li key={i.rotulo + (i.sub ?? '')}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-ink-2">{i.rotulo}{i.sub ? <span className="text-ink-mute"> · {i.sub}</span> : null}</span>
            <span className="shrink-0 font-medium text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{nf.format(i.valor)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface">
            <div className="h-1.5 rounded-full bg-accent" style={{ width: `${Math.max(2, (i.valor / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ───────────────────────── blocos ─────────────────────────

function Vazio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-[13px] text-ink-mute">{texto}</p>;
}

function Card({ titulo, icone, acao, children, className = '' }: { titulo: string; icone?: React.ReactNode; acao?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={'rounded-xl border border-hairline bg-canvas ' + className}>
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 className="flex items-center gap-2 text-[14px] font-semibold text-ink">{icone}{titulo}</h2>
        {acao}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Kpi({ rotulo, valor, dica, icone, vivo }: { rotulo: string; valor: string; dica?: string; icone: React.ReactNode; vivo?: boolean }) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas p-4">
      <div className="flex items-center justify-between text-[12px] text-ink-mute">
        <span className="flex items-center gap-1.5">{icone}{rotulo}</span>
        {vivo && <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-label="ao vivo" />}
      </div>
      <div className="mt-1.5 text-[24px] font-semibold text-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
      {dica && <div className="mt-0.5 text-[12px] text-ink-soft">{dica}</div>}
    </div>
  );
}

function SeloDemo() {
  return (
    <span className="rounded-md border border-[#F1D9A8] bg-[#FFF8EA] px-1.5 py-0.5 text-[11px] font-medium text-[#7A4F00]">simulado</span>
  );
}

// ───────────────────────── dados ─────────────────────────

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** SSE via fetch autenticado (EventSource não envia Authorization); fallback para polling. */
function useAoVivo(tenantId: string): { dados: AoVivo; conectado: boolean } {
  const [dados, setDados] = useState<AoVivo>({ sessoes: [], feed: [] });
  const [conectado, setConectado] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
    (async () => {
      for (let tentativa = 0; !ac.signal.aborted; tentativa++) {
        try {
          const res = await authFetch(`${API}/stream${q}`, { headers: { Accept: 'text/event-stream' }, signal: ac.signal });
          if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);
          setConectado(true);
          tentativa = 0;
          const leitor = res.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          for (;;) {
            const { value, done } = await leitor.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            let corte: number;
            while ((corte = buf.indexOf('\n\n')) >= 0) {
              const bloco = buf.slice(0, corte);
              buf = buf.slice(corte + 2);
              const linhas = bloco.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6));
              if (linhas.length) { try { setDados(JSON.parse(linhas.join('\n'))); } catch { /* bloco malformado */ } }
            }
          }
        } catch {
          if (ac.signal.aborted) return;
          setConectado(false);
          // Fallback: um poll enquanto espera reconectar.
          try { const r = await authFetch(`${API}/ao-vivo${q}`, { signal: ac.signal }); if (r.ok) setDados(await r.json()); } catch { /* offline */ }
        }
        await dormir(Math.min(30_000, 1000 * 2 ** Math.min(tentativa, 5)));
      }
    })();
    return () => ac.abort();
  }, [tenantId]);
  return { dados, conectado };
}

function useResumo(janela: JanelaId, tenantId: string, incluirVelatrix = false): { resumo: Resumo | null; erro: string | null; carregando: boolean; recarregar: () => void } {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [n, setN] = useState(0);
  const recarregar = useCallback(() => setN((x) => x + 1), []);
  useEffect(() => {
    const ac = new AbortController();
    const buscar = async () => {
      setCarregando(true);
      try {
        const q = new URLSearchParams({ janela });
        if (tenantId) q.set('tenantId', tenantId);
        if (incluirVelatrix) q.set('incluirEquipeVelatrix', 'true');
        const r = await authFetch(`${API}/resumo?${q}`, { signal: ac.signal });
        if (r.status === 403) throw new Error('Acesso restrito ao perfil super_admin.');
        if (!r.ok) throw new Error(`Falha ao carregar (HTTP ${r.status}).`);
        setResumo(await r.json());
        setErro(null);
      } catch (e) {
        if (!ac.signal.aborted) setErro((e as Error).message);
      } finally {
        if (!ac.signal.aborted) setCarregando(false);
      }
    };
    void buscar();
    const t = setInterval(buscar, 30_000);
    return () => { ac.abort(); clearInterval(t); };
  }, [janela, tenantId, incluirVelatrix, n]);
  return { resumo, erro, carregando, recarregar };
}

function exportarCsv(r: Resumo, janela: JanelaId): void {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas: string[] = [];
  const bloco = (titulo: string, cab: string[], rows: unknown[][]) => {
    linhas.push(esc(titulo), cab.map(esc).join(';'), ...rows.map((x) => x.map(esc).join(';')), '');
  };
  bloco(`Velatrix · Analytics de uso · janela ${janela} · gerado ${new Date(r.geradoEm).toLocaleString('pt-BR')}${r.contemDadosDemo ? ' · CONTÉM DADOS SIMULADOS' : ''}`, [], []);
  bloco('Escritórios', ['Escritório', 'Usuários', 'Sessões', 'Minutos ativos', 'Tokens IA', 'Causas ganhas'],
    r.tenants.map((t) => [t.tenantNome, t.usuarios, t.sessoes, t.minutosAtivos, t.tokens, t.ganhas]));
  bloco('Cidades', ['Cidade', 'UF', 'Sessões'], r.cidades.map((c) => [c.cidade, c.uf, c.sessoes]));
  bloco('Telas', ['Tela', 'Aberturas'], r.telas.map((t) => [telaLabel(t.tela), t.aberturas]));
  bloco('Hora do dia (BRT)', ['Hora', 'Aberturas'], r.porHoraDoDia.map((v, h) => [`${String(h).padStart(2, '0')}h`, v]));
  bloco('Modelos de IA', ['Modelo', 'Tokens'], r.modelos.map((m) => [m.modelo, m.tokens]));
  const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `velatrix-analytics-${janela}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ───────────────────────── painel ─────────────────────────

export const AdminAnalyticsPanel: React.FC = () => {
  const [janela, setJanela] = useState<JanelaId>('24h');
  const [tenantId, setTenantId] = useState('');
  const [incluirVelatrix, setIncluirVelatrix] = useState(false);
  const { resumo, erro, carregando, recarregar } = useResumo(janela, tenantId, incluirVelatrix);
  const { dados: vivoBruto, conectado } = useAoVivo(tenantId);
  // Equipe Velatrix (tenant fabricante) fica fora do "ao vivo" por padrão, igual ao resumo.
  const vivo = useMemo<AoVivo>(() => (incluirVelatrix || tenantId === 'VELATRIX')
    ? vivoBruto
    : { sessoes: vivoBruto.sessoes.filter((s) => s.tenantId !== 'VELATRIX'), feed: vivoBruto.feed.filter((f) => f.tenantId !== 'VELATRIX') },
  [vivoBruto, incluirVelatrix, tenantId]);
  const [agora, setAgora] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setAgora(Date.now()), 5000); return () => clearInterval(t); }, []);

  // Lista de escritórios estável entre janelas (não some ao filtrar).
  const tenantsRef = useRef(new Map<string, string>());
  resumo?.tenantsConhecidos.forEach((t) => tenantsRef.current.set(t.id, t.nome));
  vivo.sessoes.forEach((s) => tenantsRef.current.set(s.tenantId, s.tenantNome));
  const opcoesTenant = [...tenantsRef.current.entries()].sort((a, b) => a[1].localeCompare(b[1]));

  const horaAtualBrt = Number(new Date(agora).toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Sao_Paulo' })) % 24;
  const k = resumo?.kpis;
  const usuariosAgora = useMemo(() => new Set(vivo.sessoes.map((s) => s.tenantId + '|' + s.userId)).size, [vivo.sessoes]);
  const tenantsAgora = useMemo(() => new Set(vivo.sessoes.map((s) => s.tenantId)).size, [vivo.sessoes]);
  const temDemo = !!resumo?.contemDadosDemo || vivo.sessoes.some((s) => s.demo);

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:px-6">
      {/* Cabeçalho + filtros */}
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ink-mute">
            <ShieldCheck className="h-3.5 w-3.5" /> Super Admin · somente Velatrix
          </div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-ink">Analytics de uso</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-ink-mute">
            Quem está usando a plataforma agora, em qual módulo, de onde e em que horário. Registra apenas a tela aberta e o horário —
            nunca o conteúdo da tela, documentos ou digitação dos clientes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-hairline bg-canvas p-0.5" role="tablist" aria-label="Período">
            {JANELAS.map((j) => (
              <button key={j.id} type="button" role="tab" aria-selected={janela === j.id} onClick={() => setJanela(j.id)}
                className={'rounded-md px-3 py-1.5 text-[13px] font-medium ' + (janela === j.id ? 'bg-accent text-[#FFFFFF]' : 'text-ink-2 hover:bg-surface')}>
                {j.label}
              </button>
            ))}
          </div>
          <select value={tenantId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTenantId(e.target.value)} aria-label="Escritório"
            className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] text-ink">
            <option value="">Todos os escritórios</option>
            {opcoesTenant.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
          </select>
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[13px] text-ink select-none px-2.5 py-1.5 rounded-lg border border-hairline bg-canvas hover:border-hairline-strong">
            <input
              type="checkbox"
              checked={incluirVelatrix}
              onChange={(e) => setIncluirVelatrix(e.target.checked)}
              className="rounded border-hairline text-accent focus:ring-0"
            />
            <span>Incluir equipe Velatrix</span>
          </label>
          <button type="button" onClick={recarregar} title="Atualizar"
            className="inline-flex items-center rounded-lg border border-hairline bg-canvas p-2 text-ink-2 hover:border-hairline-strong">
            <RefreshCw className={'h-4 w-4 ' + (carregando ? 'animate-spin' : '')} />
          </button>
          <button type="button" disabled={!resumo} onClick={() => resumo && exportarCsv(resumo, janela)}
            className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] font-medium text-ink hover:border-hairline-strong disabled:opacity-50">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </section>

      {temDemo && (
        <div role="note" className="flex items-center gap-2 rounded-lg border border-[#F1D9A8] bg-[#FFF8EA] px-3 py-2 text-[12px] text-[#7A4F00]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D08A00]" />
          Contém dados simulados (DEMO_MODE): histórico de 30 dias e sessões marcadas como “simulado”. Sessões reais aparecem sem o selo.
        </div>
      )}
      {erro && <div role="alert" className="rounded-lg border border-[#F4C7C3] bg-[#FEF3F2] px-3 py-2 text-[13px] text-[#B42318]">{erro}</div>}

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Indicadores">
        <Kpi rotulo="Online agora" valor={nf.format(usuariosAgora)} dica={`${nf.format(vivo.sessoes.length)} sessões abertas`} icone={<Radio className="h-3.5 w-3.5" />} vivo={conectado} />
        <Kpi rotulo="Escritórios ativos" valor={nf.format(tenantsAgora)} dica="com alguém online agora" icone={<Building2 className="h-3.5 w-3.5" />} />
        <Kpi rotulo="Usuários únicos" valor={k ? nf.format(k.usuariosUnicos) : '—'} dica={k ? `${nf.format(k.sessoes)} sessões no período` : undefined} icone={<Users className="h-3.5 w-3.5" />} />
        <Kpi rotulo="Tempo de uso" valor={k ? horas(k.minutosAtivos) : '—'} dica="com a aba em primeiro plano" icone={<Clock className="h-3.5 w-3.5" />} />
        <Kpi rotulo="Tokens de IA" valor={k ? compacto.format(k.tokensEntrada + k.tokensSaida) : '—'} dica={k ? `${compacto.format(k.tokensEntrada)} entrada · ${compacto.format(k.tokensSaida)} saída` : undefined} icone={<Cpu className="h-3.5 w-3.5" />} />
        <Kpi rotulo="Causas ganhas" valor={k ? nf.format(k.desfechos.ganha) : '—'} dica={k ? `taxa de êxito ${pct(k.taxaExito)}` : undefined} icone={<Gavel className="h-3.5 w-3.5" />} />
      </section>

      {/* Ao vivo + feed */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" titulo="Quem está usando agora" icone={<Activity className="h-4 w-4 text-accent" />}
          acao={<span className={'inline-flex items-center gap-1.5 text-[12px] ' + (conectado ? 'text-emerald-700' : 'text-ink-mute')}>
            <span className={'h-2 w-2 rounded-full ' + (conectado ? 'animate-pulse bg-emerald-500' : 'bg-ink-soft')} />{conectado ? 'Ao vivo' : 'Reconectando…'}</span>}>
          {vivo.sessoes.length === 0 ? (
            <Vazio texto="Ninguém online neste momento." />
          ) : (
            <div className="-mx-4 -my-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="border-b border-hairline text-[12px] text-ink-mute">
                  <tr>
                    <th className="px-4 py-2 font-medium">Usuário</th>
                    <th className="px-2 py-2 font-medium">Escritório</th>
                    <th className="px-2 py-2 font-medium">Tela atual</th>
                    <th className="px-2 py-2 font-medium">Nesta tela</th>
                    <th className="px-2 py-2 font-medium">Local</th>
                    <th className="px-4 py-2 text-right font-medium">Sessão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {vivo.sessoes.map((s) => (
                    <tr key={s.sessaoId} className="hover:bg-surface">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          {s.dispositivo === 'mobile' ? <Smartphone className="h-3.5 w-3.5 text-ink-mute" /> : <Monitor className="h-3.5 w-3.5 text-ink-mute" />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-medium text-ink">{s.nome}{s.demo && <SeloDemo />}</div>
                            <div className="truncate text-[12px] text-ink-mute">{PAPEL_LABEL[s.papel ?? ''] ?? s.papel ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[180px] truncate px-2 py-2.5 text-ink-2">{s.tenantNome}</td>
                      <td className="px-2 py-2.5"><span className="rounded-md bg-accent-tint px-2 py-0.5 text-[12px] font-medium text-accent">{telaLabel(s.telaAtual)}</span></td>
                      <td className="px-2 py-2.5 text-ink-2" style={{ fontVariantNumeric: 'tabular-nums' }}>{ha(s.telaDesde, agora)}</td>
                      <td className="px-2 py-2.5 text-ink-2">{s.cidade}{s.uf !== '—' ? `/${s.uf}` : ''}</td>
                      <td className="px-4 py-2.5 text-right text-ink-mute" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {ha(s.inicio, agora)} · {s.telasVisitadas} telas
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2" titulo="Atividade recente" icone={<Clock className="h-4 w-4 text-accent" />}>
          {vivo.feed.length === 0 ? <Vazio texto="Sem atividade recente." /> : (
            <ul className="-my-1 max-h-[340px] space-y-0.5 overflow-y-auto pr-1">
              {vivo.feed.map((f, i) => (
                <li key={`${f.ts}-${i}`} className="flex gap-3 rounded-md px-1 py-1.5 text-[13px] hover:bg-surface">
                  <span className="w-11 shrink-0 text-ink-mute" style={{ fontVariantNumeric: 'tabular-nums' }}>{hhmm(f.ts)}</span>
                  <span className="min-w-0 text-ink-2">
                    <span className="font-medium text-ink">{f.nome}</span>
                    {f.tipo === 'sessao_inicio' && <> entrou{f.cidade ? <> de <span className="text-ink">{f.cidade}</span></> : null}</>}
                    {f.tipo === 'tela' && <> abriu <span className="text-ink">{telaLabel(f.tela)}</span></>}
                    {f.tipo === 'acao' && <> executou <span className="font-mono text-[12px] text-ink">{f.acao}</span></>}
                    {f.tipo === 'desfecho' && <> · desfecho <span className="text-ink">{DESFECHO[f.resultado as ResultadoDesfecho]?.label ?? f.resultado}</span> ({f.esteira})</>}
                    <span className="text-ink-mute"> · {f.tenantNome}</span>
                    {f.demo && <> <SeloDemo /></>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Tendência + horário de pico */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3" titulo={`Sessões por ${resumo?.granularidade === 'dia' ? 'dia' : 'hora'}`} icone={<Activity className="h-4 w-4 text-accent" />}>
          {resumo ? <GraficoArea pontos={resumo.serie} granularidade={resumo.granularidade} /> : <Vazio texto="Carregando…" />}
        </Card>
        <Card className="xl:col-span-2" titulo="Horário de pico (Brasília)" icone={<Clock className="h-4 w-4 text-accent" />}>
          {resumo ? <GraficoHoras valores={resumo.porHoraDoDia} horaAtual={horaAtualBrt} /> : <Vazio texto="Carregando…" />}
        </Card>
      </div>

      {/* Cidades · telas · desfechos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card titulo="Cidades" icone={<MapPin className="h-4 w-4 text-accent" />}>
          <Barras itens={(resumo?.cidades ?? []).map((c) => ({ rotulo: c.cidade, sub: c.uf !== '—' ? c.uf : undefined, valor: c.sessoes }))} />
        </Card>
        <Card titulo="Módulos mais usados" icone={<Monitor className="h-4 w-4 text-accent" />}>
          <Barras itens={(resumo?.telas ?? []).slice(0, 8).map((t) => ({ rotulo: telaLabel(t.tela), valor: t.aberturas }))} />
        </Card>
        <Card titulo="Desfechos de causas" icone={<Gavel className="h-4 w-4 text-accent" />}>
          {k ? <Rosca desfechos={k.desfechos} taxa={k.taxaExito} /> : <Vazio texto="Carregando…" />}
          <p className="mt-3 text-[12px] text-ink-mute">Registrados pelo servidor a partir do retorno do tribunal — o navegador do cliente não informa desfechos.</p>
        </Card>
      </div>

      {/* Escritórios + IA */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" titulo="Uso por escritório" icone={<Building2 className="h-4 w-4 text-accent" />}>
          {!resumo || resumo.tenants.length === 0 ? <Vazio texto="Sem uso no período." /> : (
            <div className="-mx-4 -my-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="border-b border-hairline text-[12px] text-ink-mute">
                  <tr>
                    <th className="px-4 py-2 font-medium">Escritório</th>
                    <th className="px-2 py-2 text-right font-medium">Usuários</th>
                    <th className="px-2 py-2 text-right font-medium">Sessões</th>
                    <th className="px-2 py-2 text-right font-medium">Tempo de uso</th>
                    <th className="px-2 py-2 text-right font-medium">Tokens IA</th>
                    <th className="px-4 py-2 text-right font-medium">Ganhas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {resumo.tenants.map((t) => (
                    <tr key={t.tenantId} className="cursor-pointer hover:bg-surface" onClick={() => setTenantId(t.tenantId === tenantId ? '' : t.tenantId)}
                      title="Filtrar o painel por este escritório">
                      <td className="max-w-[260px] truncate px-4 py-2.5 font-medium text-ink">{t.tenantNome}</td>
                      <td className="px-2 py-2.5 text-right text-ink-2">{nf.format(t.usuarios)}</td>
                      <td className="px-2 py-2.5 text-right text-ink-2">{nf.format(t.sessoes)}</td>
                      <td className="px-2 py-2.5 text-right text-ink-2">{horas(t.minutosAtivos)}</td>
                      <td className="px-2 py-2.5 text-right text-ink-2">{compacto.format(t.tokens)}</td>
                      <td className="px-4 py-2.5 text-right text-ink-2">{nf.format(t.ganhas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card titulo="Consumo de IA por modelo" icone={<Cpu className="h-4 w-4 text-accent" />}>
          <Barras itens={(resumo?.modelos ?? []).map((m) => ({ rotulo: m.modelo, valor: m.tokens }))} />
          <p className="mt-3 text-[12px] text-ink-mute">Uso real informado pelo provedor (usageMetadata), atribuído ao escritório da requisição.</p>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalyticsPanel;
