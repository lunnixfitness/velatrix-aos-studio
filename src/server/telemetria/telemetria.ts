/**
 * VELATRIX AOS · Analytics de Uso (Super Admin) — núcleo puro do servidor
 *
 * COLETA (allowlist): início/fim de sessão, tela/módulo aberto, heartbeat de presença,
 * ação nomeada (id técnico), tokens de IA (medidos no servidor) e desfechos registrados
 * pelo servidor. Cidade/UF vêm de headers de geolocalização do balanceador — IP nunca é guardado.
 *
 * NÃO COLETA: conteúdo de tela, digitação, campos de formulário, documentos, nomes de partes
 * ou números de processo. Sigilo profissional (EAOAB art. 7º, II) e minimização (LGPD art. 6º, III).
 *
 * Escala (~2.000 advogados simultâneos): ingestão O(1) em buckets horários pré-agregados
 * por tenant (OLAP-lite em memória); heartbeat só atualiza presença, não vira linha.
 * Consulta = O(buckets da janela × tenants), independente do volume bruto de eventos.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

export type TipoEventoCliente = 'sessao_inicio' | 'tela' | 'heartbeat' | 'sessao_fim' | 'acao';
export type TipoEvento = TipoEventoCliente | 'tokens' | 'desfecho';
export type ResultadoDesfecho = 'ganha' | 'perdida' | 'acordo' | 'arquivada';
export type Dispositivo = 'desktop' | 'mobile';

export interface EventoTelemetria {
  ts: number;
  tenantId: string;
  userId: string;
  sessaoId: string;
  tipo: TipoEvento;
  papel?: string;
  tela?: string;
  acao?: string;
  cidade?: string;
  uf?: string;
  dispositivo?: Dispositivo;
  modelo?: string;
  tokensEntrada?: number;
  tokensSaida?: number;
  resultado?: ResultadoDesfecho;
  esteira?: string;
  demo?: boolean;
}

export interface SessaoAoVivo {
  sessaoId: string;
  tenantId: string;
  userId: string;
  papel?: string;
  telaAtual: string | null;
  telaDesde: number;
  inicio: number;
  ultimoSinal: number;
  cidade: string;
  uf: string;
  dispositivo?: Dispositivo;
  telasVisitadas: number;
  demo?: boolean;
}

export interface ItemFeed {
  ts: number;
  tenantId: string;
  userId: string;
  tipo: TipoEvento;
  tela?: string;
  acao?: string;
  resultado?: ResultadoDesfecho;
  esteira?: string;
  cidade?: string;
  demo?: boolean;
}

interface Agg {
  sessoes: number;
  aberturasTela: number;
  minutosAtivos: number;
  usuarios: Set<string>;
  telas: Map<string, number>;
  cidades: Map<string, number>;
  modelos: Map<string, number>;
  tokensEntrada: number;
  tokensSaida: number;
  desfechos: Record<ResultadoDesfecho, number>;
  demo: boolean;
}

export interface ResumoTelemetria {
  geradoEm: number;
  janelaMs: number;
  granularidade: 'hora' | 'dia';
  contemDadosDemo: boolean;
  kpis: {
    usuariosAgora: number;
    sessoesAgora: number;
    tenantsAtivosAgora: number;
    usuariosUnicos: number;
    sessoes: number;
    minutosAtivos: number;
    tokensEntrada: number;
    tokensSaida: number;
    desfechos: Record<ResultadoDesfecho, number>;
    /** ganhas / (ganhas + perdidas); null sem desfechos decididos. */
    taxaExito: number | null;
  };
  /** Aberturas de tela por hora do dia (0–23, horário de Brasília). */
  porHoraDoDia: number[];
  serie: Array<{ t: number; sessoes: number; usuarios: number; tokens: number }>;
  cidades: Array<{ cidade: string; uf: string; sessoes: number }>;
  telas: Array<{ tela: string; aberturas: number }>;
  modelos: Array<{ modelo: string; tokens: number }>;
  tenants: Array<{ tenantId: string; usuarios: number; sessoes: number; minutosAtivos: number; tokens: number; ganhas: number }>;
}

const HORA = 3_600_000;
const DIA = 24 * HORA;
/** Brasil sem horário de verão desde 2019: UTC−3 fixo. */
const OFFSET_BRT_H = -3;
export const JANELAS = { '1h': HORA, '24h': DIA, '7d': 7 * DIA, '30d': 30 * DIA } as const;
export type JanelaId = keyof typeof JANELAS;

const novoAgg = (): Agg => ({
  sessoes: 0, aberturasTela: 0, minutosAtivos: 0, usuarios: new Set(), telas: new Map(), cidades: new Map(),
  modelos: new Map(), tokensEntrada: 0, tokensSaida: 0, desfechos: { ganha: 0, perdida: 0, acordo: 0, arquivada: 0 }, demo: false,
});
const inc = (m: Map<string, number>, k: string, v = 1) => m.set(k, (m.get(k) ?? 0) + v);
const topN = <T>(arr: T[], n: number, by: (x: T) => number) => arr.sort((a, b) => by(b) - by(a)).slice(0, n);
export const chaveCidade = (cidade?: string, uf?: string) => `${cidade || 'Não identificada'}|${uf || '—'}`;

export interface OpcoesStore {
  /** Retenção dos buckets horários (padrão 31 dias). */
  retencaoMs?: number;
  /** Sem heartbeat por este tempo → sessão sai do "ao vivo" (padrão 90 s). */
  sessaoTimeoutMs?: number;
  /** Intervalo de heartbeat do cliente, para converter em minutos ativos (padrão 30 s). */
  heartbeatMs?: number;
  feedMax?: number;
  agora?: () => number;
}

export const TENANT_FABRICANTE = 'VELATRIX';

export interface OpcoesResumoTelemetria {
  incluirEquipeVelatrix?: boolean;
}

export class TelemetriaStore {
  /** hora (epoch/HORA) → tenantId → agregado */
  private readonly buckets = new Map<number, Map<string, Agg>>();
  private readonly sessoes = new Map<string, SessaoAoVivo>();
  private readonly feed: ItemFeed[] = [];
  private readonly ouvintes = new Set<() => void>();
  private readonly retencaoMs: number;
  private readonly timeoutMs: number;
  private readonly hbMin: number;
  private readonly feedMax: number;
  readonly agora: () => number;

  constructor(o: OpcoesStore = {}) {
    this.retencaoMs = o.retencaoMs ?? 31 * DIA;
    this.timeoutMs = o.sessaoTimeoutMs ?? 90_000;
    this.hbMin = (o.heartbeatMs ?? 30_000) / 60_000;
    this.feedMax = o.feedMax ?? 200;
    this.agora = o.agora ?? Date.now;
  }

  private agg(ts: number, tenantId: string): Agg {
    const h = Math.floor(ts / HORA);
    let porTenant = this.buckets.get(h);
    if (!porTenant) {
      porTenant = new Map();
      this.buckets.set(h, porTenant);
      this.podar();
    }
    let a = porTenant.get(tenantId);
    if (!a) { a = novoAgg(); porTenant.set(tenantId, a); }
    return a;
  }

  private podar(): void {
    const limite = Math.floor((this.agora() - this.retencaoMs) / HORA);
    for (const h of this.buckets.keys()) if (h < limite) this.buckets.delete(h);
  }

  registrar(e: EventoTelemetria): void {
    const a = this.agg(e.ts, e.tenantId);
    if (e.demo) a.demo = true;

    if (e.tipo === 'tokens') {
      const ent = Math.max(0, Math.trunc(e.tokensEntrada ?? 0));
      const sai = Math.max(0, Math.trunc(e.tokensSaida ?? 0));
      a.tokensEntrada += ent; a.tokensSaida += sai;
      inc(a.modelos, e.modelo || 'desconhecido', ent + sai);
      this.notificar();
      return;
    }
    if (e.tipo === 'desfecho' && e.resultado) {
      a.desfechos[e.resultado] += 1;
      this.pushFeed(e);
      this.notificar();
      return;
    }

    a.usuarios.add(e.userId);
    const agora = e.ts;
    let s = this.sessoes.get(e.sessaoId);

    if (e.tipo === 'sessao_fim') {
      if (s) this.sessoes.delete(e.sessaoId);
      this.notificar();
      return;
    }

    if (!s) {
      // Sessão nova (ou retomada após timeout) conta uma vez, qualquer que seja o 1º evento.
      s = {
        sessaoId: e.sessaoId, tenantId: e.tenantId, userId: e.userId, papel: e.papel, telaAtual: null, telaDesde: agora,
        inicio: agora, ultimoSinal: agora, cidade: e.cidade || 'Não identificada', uf: e.uf || '—',
        dispositivo: e.dispositivo, telasVisitadas: 0, demo: e.demo,
      };
      this.sessoes.set(e.sessaoId, s);
      a.sessoes += 1;
      inc(a.cidades, chaveCidade(s.cidade, s.uf));
      this.pushFeed({ ...e, tipo: 'sessao_inicio', cidade: s.cidade });
    } else if (s.tenantId !== e.tenantId || s.userId !== e.userId) {
      return; // sessaoId reaproveitado por outro usuário: ignora (não sequestra presença alheia)
    }

    s.ultimoSinal = Math.max(s.ultimoSinal, agora);
    if (e.dispositivo) s.dispositivo = e.dispositivo;

    if (e.tipo === 'heartbeat') {
      a.minutosAtivos += this.hbMin;
      if (e.tela && e.tela !== s.telaAtual) { s.telaAtual = e.tela; s.telaDesde = agora; }
    } else if (e.tipo === 'tela' && e.tela) {
      a.aberturasTela += 1;
      inc(a.telas, e.tela);
      if (e.tela !== s.telaAtual) { s.telaAtual = e.tela; s.telaDesde = agora; s.telasVisitadas += 1; }
      this.pushFeed(e);
    } else if (e.tipo === 'acao') {
      this.pushFeed(e);
    }
    this.notificar();
  }

  private pushFeed(e: EventoTelemetria): void {
    this.feed.push({ ts: e.ts, tenantId: e.tenantId, userId: e.userId, tipo: e.tipo, tela: e.tela, acao: e.acao, resultado: e.resultado, esteira: e.esteira, cidade: e.cidade, demo: e.demo });
    if (this.feed.length > this.feedMax) this.feed.splice(0, this.feed.length - this.feedMax);
  }

  aoVivo(filtroTenant?: string): SessaoAoVivo[] {
    const limite = this.agora() - this.timeoutMs;
    const out: SessaoAoVivo[] = [];
    for (const [id, s] of this.sessoes) {
      if (s.ultimoSinal < limite) { this.sessoes.delete(id); continue; }
      if (!filtroTenant || s.tenantId === filtroTenant) out.push({ ...s });
    }
    return out.sort((x, y) => y.ultimoSinal - x.ultimoSinal);
  }

  ultimosEventos(n = 40, filtroTenant?: string): ItemFeed[] {
    const out: ItemFeed[] = [];
    for (let i = this.feed.length - 1; i >= 0 && out.length < n; i--) {
      const f = this.feed[i];
      if (!filtroTenant || f.tenantId === filtroTenant) out.push(f);
    }
    return out;
  }

  resumo(janelaMs: number, filtroTenant?: string, opcoes: OpcoesResumoTelemetria = {}): ResumoTelemetria {
    const agora = this.agora();
    const hIni = Math.floor((agora - janelaMs) / HORA) + 1;
    const hFim = Math.floor(agora / HORA);
    const granularidade: 'hora' | 'dia' = janelaMs > 2 * DIA ? 'dia' : 'hora';
    const passo = granularidade === 'dia' ? 24 : 1;
    const incluirVelatrix = opcoes.incluirEquipeVelatrix ?? false;

    const usuarios = new Set<string>();
    const telas = new Map<string, number>();
    const cidades = new Map<string, number>();
    const modelos = new Map<string, number>();
    const porHora = new Array<number>(24).fill(0);
    const desfechos: Record<ResultadoDesfecho, number> = { ganha: 0, perdida: 0, acordo: 0, arquivada: 0 };
    const tenants = new Map<string, { usuarios: Set<string>; sessoes: number; minutosAtivos: number; tokens: number; ganhas: number }>();
    const serieMap = new Map<number, { sessoes: number; usuarios: Set<string>; tokens: number }>();
    let sessoes = 0, minutos = 0, tEnt = 0, tSai = 0, demo = false;

    // Eixo contínuo (sem buracos) para o gráfico.
    const alinhar = (h: number) => (granularidade === 'dia' ? Math.floor((h + OFFSET_BRT_H) / 24) * 24 - OFFSET_BRT_H : h);
    for (let h = alinhar(hIni); h <= hFim; h += passo) serieMap.set(h, { sessoes: 0, usuarios: new Set(), tokens: 0 });

    for (let h = hIni; h <= hFim; h++) {
      const porTenant = this.buckets.get(h);
      if (!porTenant) continue;
      const hDia = (((h + OFFSET_BRT_H) % 24) + 24) % 24;
      const ponto = serieMap.get(alinhar(h));
      for (const [tid, a] of porTenant) {
        if (filtroTenant && tid !== filtroTenant) continue;
        // Equipe Velatrix (fabricante) não entra em NENHUMA métrica de cliente por padrão.
        if (!incluirVelatrix && tid === TENANT_FABRICANTE && filtroTenant !== TENANT_FABRICANTE) continue;
        if (a.demo) demo = true;
        sessoes += a.sessoes; minutos += a.minutosAtivos; tEnt += a.tokensEntrada; tSai += a.tokensSaida;
        porHora[hDia] += a.aberturasTela;
        const eFabricante = tid === TENANT_FABRICANTE;
        const contarUsuario = incluirVelatrix || !eFabricante || filtroTenant === TENANT_FABRICANTE;
        if (contarUsuario) {
          for (const u of a.usuarios) usuarios.add(`${tid}\u0000${u}`);
        }
        for (const [k, v] of a.telas) inc(telas, k, v);
        for (const [k, v] of a.cidades) inc(cidades, k, v);
        for (const [k, v] of a.modelos) inc(modelos, k, v);
        (Object.keys(desfechos) as ResultadoDesfecho[]).forEach((r) => (desfechos[r] += a.desfechos[r]));
        
        // Uso por escritório exclui fabricante por padrão
        if (contarUsuario) {
          let t = tenants.get(tid);
          if (!t) { t = { usuarios: new Set(), sessoes: 0, minutosAtivos: 0, tokens: 0, ganhas: 0 }; tenants.set(tid, t); }
          for (const u of a.usuarios) t.usuarios.add(u);
          t.sessoes += a.sessoes; t.minutosAtivos += a.minutosAtivos; t.tokens += a.tokensEntrada + a.tokensSaida; t.ganhas += a.desfechos.ganha;
        }
        if (ponto) {
          ponto.sessoes += a.sessoes;
          ponto.tokens += a.tokensEntrada + a.tokensSaida;
          if (contarUsuario) {
            for (const u of a.usuarios) ponto.usuarios.add(`${tid}\u0000${u}`);
          }
        }
      }
    }

    const vivos = this.aoVivo(filtroTenant);
    const vivosParaContagem = (incluirVelatrix || filtroTenant === TENANT_FABRICANTE)
      ? vivos
      : vivos.filter((s) => s.tenantId !== TENANT_FABRICANTE);
    const decididos = desfechos.ganha + desfechos.perdida;
    return {
      geradoEm: agora,
      janelaMs,
      granularidade,
      contemDadosDemo: demo || vivos.some((s) => s.demo),
      kpis: {
        usuariosAgora: new Set(vivosParaContagem.map((s) => `${s.tenantId}\u0000${s.userId}`)).size,
        sessoesAgora: vivosParaContagem.length,
        tenantsAtivosAgora: new Set(vivosParaContagem.map((s) => s.tenantId)).size,
        usuariosUnicos: usuarios.size,
        sessoes,
        minutosAtivos: Math.round(minutos),
        tokensEntrada: tEnt,
        tokensSaida: tSai,
        desfechos,
        taxaExito: decididos ? desfechos.ganha / decididos : null,
      },
      porHoraDoDia: porHora,
      serie: [...serieMap.entries()].sort((x, y) => x[0] - y[0]).map(([h, p]) => ({ t: h * HORA, sessoes: p.sessoes, usuarios: p.usuarios.size, tokens: p.tokens })),
      cidades: topN([...cidades.entries()].map(([k, v]) => { const [cidade, uf] = k.split('|'); return { cidade, uf, sessoes: v }; }), 10, (x) => x.sessoes),
      telas: topN([...telas.entries()].map(([tela, aberturas]) => ({ tela, aberturas })), 12, (x) => x.aberturas),
      modelos: topN([...modelos.entries()].map(([modelo, tokens]) => ({ modelo, tokens })), 8, (x) => x.tokens),
      tenants: topN([...tenants.entries()].map(([tenantId, t]) => ({ tenantId, usuarios: t.usuarios.size, sessoes: t.sessoes, minutosAtivos: Math.round(t.minutosAtivos), tokens: t.tokens, ganhas: t.ganhas })), 50, (x) => x.sessoes),
    };
  }

  /** Assina mudanças (SSE). Retorna o cancelamento. */
  inscrever(fn: () => void): () => void {
    this.ouvintes.add(fn);
    return () => this.ouvintes.delete(fn);
  }

  private notificar(): void { for (const f of this.ouvintes) f(); }

  get totalSessoes(): number { return this.sessoes.size; }
}

// ───────────────────────── validação do lote vindo do navegador ─────────────────────────

const RE_SESSAO = /^[A-Za-z0-9_-]{8,64}$/;
const RE_TELA = /^[a-z0-9_]{1,48}$/;
const RE_ACAO = /^[a-z0-9_.:-]{1,64}$/;
const TIPOS_CLIENTE: ReadonlySet<string> = new Set<TipoEventoCliente>(['sessao_inicio', 'tela', 'heartbeat', 'sessao_fim', 'acao']);
export const MAX_EVENTOS_LOTE = 50;

export class ErroTelemetria extends Error {
  readonly status: number;
  constructor(status: number, msg: string) { super(msg); this.status = status; this.name = 'ErroTelemetria'; }
}

export interface EventoClienteValido { tipo: TipoEventoCliente; ts: number; tela?: string; acao?: string; dispositivo?: Dispositivo; }

/**
 * Allowlist estrita: só id de sessão, tipo, id técnico de tela/ação e dispositivo.
 * Qualquer outro campo é descartado — o cliente não consegue enviar conteúdo, tokens nem desfechos.
 * ts do cliente é aceito só dentro de ±5 min do relógio do servidor (senão vira "agora").
 */
export function validarLote(corpo: unknown, agora: number): { sessaoId: string; eventos: EventoClienteValido[] } {
  const b = corpo as { sessaoId?: unknown; eventos?: unknown };
  if (!b || typeof b !== 'object') throw new ErroTelemetria(400, 'corpo inválido');
  if (typeof b.sessaoId !== 'string' || !RE_SESSAO.test(b.sessaoId)) throw new ErroTelemetria(400, 'sessaoId inválido');
  if (!Array.isArray(b.eventos) || b.eventos.length === 0) throw new ErroTelemetria(400, 'eventos vazio');
  if (b.eventos.length > MAX_EVENTOS_LOTE) throw new ErroTelemetria(413, `máximo de ${MAX_EVENTOS_LOTE} eventos por lote`);
  const eventos: EventoClienteValido[] = [];
  for (const raw of b.eventos as Array<Record<string, unknown>>) {
    if (!raw || typeof raw !== 'object' || typeof raw.tipo !== 'string' || !TIPOS_CLIENTE.has(raw.tipo)) continue;
    const ts = typeof raw.ts === 'number' && Math.abs(raw.ts - agora) <= 300_000 ? Math.trunc(raw.ts) : agora;
    const ev: EventoClienteValido = { tipo: raw.tipo as TipoEventoCliente, ts };
    if (typeof raw.tela === 'string' && RE_TELA.test(raw.tela)) ev.tela = raw.tela;
    if (typeof raw.acao === 'string' && RE_ACAO.test(raw.acao)) ev.acao = raw.acao;
    if (raw.dispositivo === 'desktop' || raw.dispositivo === 'mobile') ev.dispositivo = raw.dispositivo;
    if (ev.tipo === 'tela' && !ev.tela) continue;
    if (ev.tipo === 'acao' && !ev.acao) continue;
    eventos.push(ev);
  }
  return { sessaoId: b.sessaoId, eventos };
}

/** Janela fixa por usuário: protege a ingestão de cliente malicioso/bugado. */
export class LimitadorTelemetria {
  private readonly janelas = new Map<string, { ini: number; n: number }>();
  private readonly maxPorMin: number;
  constructor(maxPorMin = 240) { this.maxPorMin = maxPorMin; }
  permitir(chave: string, qtd: number, agora: number): boolean {
    let j = this.janelas.get(chave);
    if (!j || agora - j.ini >= 60_000) {
      if (this.janelas.size > 50_000) for (const [k, v] of this.janelas) if (agora - v.ini >= 60_000) this.janelas.delete(k);
      j = { ini: agora, n: 0 };
      this.janelas.set(chave, j);
    }
    if (j.n + qtd > this.maxPorMin) return false;
    j.n += qtd;
    return true;
  }
}

/** Geolocalização do balanceador (Cloud LB / App Engine / Cloudflare). IP não é lido nem guardado. */
export function geoDeHeaders(h: Record<string, string | string[] | undefined>): { cidade?: string; uf?: string } {
  const pega = (...nomes: string[]) => {
    for (const n of nomes) { const v = h[n]; const s = Array.isArray(v) ? v[0] : v; if (s && s.trim()) return s.trim(); }
    return undefined;
  };
  const limpa = (s?: string) => {
    if (!s) return undefined;
    let t = s;
    try { t = decodeURIComponent(s); } catch { /* mantém bruto */ }
    t = t.replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 48);
    // Title case por palavra (\b do JS é ASCII: quebraria em "são").
    return t ? t.toLowerCase().split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(' ') : undefined;
  };
  const cidade = limpa(pega('x-client-geo-city', 'x-appengine-city', 'cf-ipcity'));
  const regiao = pega('x-client-geo-subdivision', 'x-appengine-region', 'cf-region-code');
  const uf = regiao ? regiao.replace(/^BR-/i, '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || undefined : undefined;
  return { cidade, uf };
}

// ───────────────────────── contexto por requisição (tokens de IA) ─────────────────────────

export const ctxTelemetria = new AsyncLocalStorage<{ tenantId: string; userId: string }>();
let storeGlobal: TelemetriaStore | null = null;

export function definirStoreTelemetria(s: TelemetriaStore | null): void { storeGlobal = s; }

/**
 * Chamado pelos provedores de IA com o uso real (usageMetadata). Tenant/usuário vêm do
 * AsyncLocalStorage da requisição — o provedor não precisa conhecer a sessão.
 */
export function registrarConsumoTokens(modelo: string, entrada: number, saida: number): void {
  if (!storeGlobal) return;
  const c = ctxTelemetria.getStore();
  storeGlobal.registrar({
    ts: storeGlobal.agora(), tenantId: c?.tenantId ?? 'sistema', userId: c?.userId ?? 'sistema', sessaoId: 'srv',
    tipo: 'tokens', modelo, tokensEntrada: entrada, tokensSaida: saida,
  });
}

/** Desfecho de causa — só o servidor registra (ex.: webhook de sentença do tribunal). */
export function registrarDesfecho(tenantId: string, resultado: ResultadoDesfecho, esteira: string): void {
  if (!storeGlobal) return;
  storeGlobal.registrar({ ts: storeGlobal.agora(), tenantId, userId: 'sistema', sessaoId: 'srv', tipo: 'desfecho', resultado, esteira });
}
