/**
 * VELATRIX AOS · Analytics de Uso · montagem padrão (server.ts)
 *
 * DEMO_MODE: semeia 30 dias de histórico sintético e mantém ~7 sessões simuladas "ao vivo",
 * todas marcadas demo=true (o painel mostra o selo "dados simulados"). Sessões reais aparecem
 * normalmente ao lado delas. Fora do DEMO_MODE nada é simulado.
 */
import type { Express } from 'express';
import { IS_DEMO_MODE } from '../../lib/demoMode.ts';
import { SERVER_USERS } from '../auth/serverAuth.ts';
import { TelemetriaStore, definirStoreTelemetria, type ResultadoDesfecho } from './telemetria.ts';
import { registerTelemetriaRoutes } from './routes.ts';

const HORA = 3_600_000;

/** PRNG determinístico (mulberry32) — o histórico demo é o mesmo a cada boot. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CIDADES: Array<[string, string, number]> = [
  ['São Paulo', 'SP', 30], ['Rio de Janeiro', 'RJ', 14], ['Belo Horizonte', 'MG', 10], ['Curitiba', 'PR', 8],
  ['Porto Alegre', 'RS', 7], ['Brasília', 'DF', 7], ['Recife', 'PE', 6], ['Salvador', 'BA', 5],
  ['Goiânia', 'GO', 4], ['Fortaleza', 'CE', 4], ['Campinas', 'SP', 5],
];
const TELAS: Array<[string, number]> = [
  ['operational_dashboard', 30], ['esteiras_laudos_hub', 18], ['inss', 14], ['leitura_autos', 12], ['central_laudos', 12],
  ['novo_laudo', 9], ['pericia', 8], ['precatoria', 6], ['ent_hitl', 8], ['ent_jurimetria', 5], ['legal_tax_recovery', 7], ['contract_lab', 4],
];
const MODELOS: Array<[string, number]> = [['gemini-3.8-flash', 70], ['gemini-3.1-flash-lite', 22], ['qwen-local', 8]];
const ESTEIRAS = ['loas', 'inss', 'pericia', 'precatorio', 'recuperacao_tributaria'];

/** Sorteio ponderado: o peso é o último elemento da tupla. */
function sortear<T extends readonly unknown[]>(r: () => number, itens: readonly T[]): T {
  const peso = (x: T) => x[x.length - 1] as number;
  const total = itens.reduce((s, x) => s + peso(x), 0);
  let alvo = r() * total;
  for (const x of itens) { alvo -= peso(x); if (alvo <= 0) return x; }
  return itens[itens.length - 1];
}

/** Curva de uso por hora (BRT) e dia da semana: pico 9–12h e 14–18h, fim de semana baixo. */
function intensidade(tsHora: number): number {
  const d = new Date(tsHora - 3 * HORA);
  const h = d.getUTCHours();
  const dow = d.getUTCDay();
  const base = h < 7 || h > 21 ? 0.05 : h < 9 ? 0.4 : h < 12 ? 1 : h < 14 ? 0.55 : h < 18 ? 0.95 : 0.35;
  return base * (dow === 0 ? 0.08 : dow === 6 ? 0.2 : 1);
}

export function semearHistoricoDemo(store: TelemetriaStore, dias = 30): void {
  const r = prng(20261001);
  const pessoas = SERVER_USERS.filter((u) => !u.isSuperAdmin);
  const agora = store.agora();
  const hAgora = Math.floor(agora / HORA);
  let n = 0;
  for (let h = hAgora - dias * 24; h < hAgora; h++) {
    const ts0 = h * HORA;
    const k = intensidade(ts0);
    const sessoes = Math.round(k * (6 + r() * 10));
    for (let i = 0; i < sessoes; i++) {
      const p = pessoas[Math.floor(r() * pessoas.length)];
      const [cidade, uf] = sortear(r, CIDADES);
      const sid = `demo-hist-${n++}`;
      const base = { tenantId: p.tenantId, userId: p.id, sessaoId: sid, papel: p.role, cidade, uf, dispositivo: (r() < 0.18 ? 'mobile' : 'desktop') as 'mobile' | 'desktop', demo: true };
      let ts = ts0 + Math.floor(r() * 50 * 60_000);
      store.registrar({ ...base, ts, tipo: 'sessao_inicio' });
      const nTelas = 2 + Math.floor(r() * 6);
      for (let j = 0; j < nTelas; j++) {
        ts += 60_000 + Math.floor(r() * 6 * 60_000);
        store.registrar({ ...base, ts, tipo: 'tela', tela: sortear(r, TELAS)[0] });
        const hbs = 2 + Math.floor(r() * 8);
        for (let b = 0; b < hbs; b++) store.registrar({ ...base, ts: ts + b * 30_000, tipo: 'heartbeat' });
      }
      store.registrar({ ...base, ts: ts + 60_000, tipo: 'sessao_fim' });
    }
    // Consumo de IA proporcional ao uso.
    if (sessoes > 0) {
      const p = pessoas[Math.floor(r() * pessoas.length)];
      const chamadas = Math.round(sessoes * (1 + r() * 3));
      for (let c = 0; c < chamadas; c++) {
        const ent = 1500 + Math.floor(r() * 9000);
        store.registrar({ ts: ts0 + Math.floor(r() * HORA), tenantId: p.tenantId, userId: p.id, sessaoId: 'srv', tipo: 'tokens', modelo: sortear(r, MODELOS)[0], tokensEntrada: ent, tokensSaida: Math.floor(ent * (0.15 + r() * 0.3)), demo: true });
      }
    }
    // Desfechos: ~1 a cada 6 h úteis.
    if (r() < k * 0.18) {
      const p = pessoas[Math.floor(r() * pessoas.length)];
      const x = r();
      const resultado: ResultadoDesfecho = x < 0.62 ? 'ganha' : x < 0.82 ? 'perdida' : x < 0.93 ? 'acordo' : 'arquivada';
      store.registrar({ ts: ts0 + Math.floor(r() * HORA), tenantId: p.tenantId, userId: 'sistema', sessaoId: 'srv', tipo: 'desfecho', resultado, esteira: ESTEIRAS[Math.floor(r() * ESTEIRAS.length)], demo: true });
    }
  }
}

/** Mantém sessões simuladas "ao vivo" navegando entre telas. */
export function iniciarSimulacaoAoVivoDemo(store: TelemetriaStore, qtd = 7): () => void {
  const r = prng(Date.now() & 0xffff);
  const pessoas = SERVER_USERS.filter((u) => !u.isSuperAdmin);
  const sims = Array.from({ length: qtd }, (_, i) => {
    const p = pessoas[i % pessoas.length];
    const c = CIDADES[i % CIDADES.length];
    return { tenantId: p.tenantId, userId: p.id, sessaoId: `demo-live-${i}`, papel: p.role, cidade: c[0], uf: c[1], dispositivo: (i === 3 ? 'mobile' : 'desktop') as 'mobile' | 'desktop', demo: true };
  });
  const passo = () => {
    const ts = store.agora();
    for (const s of sims) {
      if (r() < 0.3) store.registrar({ ...s, ts, tipo: 'tela', tela: sortear(r, TELAS)[0] });
      else store.registrar({ ...s, ts, tipo: 'heartbeat' });
    }
  };
  passo();
  const t = setInterval(passo, 15_000);
  (t as unknown as { unref?: () => void }).unref?.();
  return () => clearInterval(t);
}

export function registerTelemetriaRoutesPadrao(app: Express): TelemetriaStore {
  const store = new TelemetriaStore();
  definirStoreTelemetria(store);
  const porId = new Map(SERVER_USERS.map((u) => [u.id, u]));
  const tenants = new Map<string, string>();
  for (const u of SERVER_USERS) if (!u.isSuperAdmin && !tenants.has(u.tenantId)) tenants.set(u.tenantId, u.tenantName);

  registerTelemetriaRoutes(app, store, {
    resolverUsuario: (id) => { const u = porId.get(id); return u ? { nome: u.name, papel: u.role, tenantNome: u.tenantName } : undefined; },
    resolverTenant: (id) => tenants.get(id),
    incluirSuperAdmin: IS_DEMO_MODE || process.env.TELEMETRIA_INCLUIR_SUPERADMIN === 'true',
  });

  if (IS_DEMO_MODE) {
    const t0 = Date.now();
    semearHistoricoDemo(store);
    iniciarSimulacaoAoVivoDemo(store);
    console.log(`[telemetria] DEMO_MODE: histórico sintético de 30 dias semeado em ${Date.now() - t0} ms.`);
  }
  return store;
}
