/**
 * VELATRIX AOS · P29 · Carga da esteira LOAS — 2.000 advogados virtuais
 *
 * Executa IN-PROCESS contra o ServicoLoas real (repositório, fila, gateway Demo,
 * drafter), medindo o custo do servidor sem ruído de rede.
 *
 *   node --experimental-strip-types scripts/carga/cargaLoas.ts
 *   ENV: ADVOGADOS=2000 TENANTS=20 DURACAO_SEG=1800 PENSAR_MS=3000 CASOS_POR_ADV=25
 *
 * Mix: 80% leitura (lista/obter/painel) · 15% cálculo/minuta · 5% lote de protocolo.
 * Aceite: p95 leitura < 300 ms · p95 escrita 202 < 150 ms · event-loop p99 < 50 ms
 *         · 0 protocolos duplicados · nenhum advogado > 5% da vazão de protocolo.
 */
import { performance, monitorEventLoopDelay } from 'node:perf_hooks';
import { MemoriaLoasRepository } from '../../src/server/loas/repositorio.ts';
import { GatewayProtocolo, DemoAdapter } from '../../src/server/loas/tribunal.ts';
import { HubSse } from '../../src/server/loas/webhookSse.ts';
import { ServicoLoas, type CtxLoas, type ItemLote } from '../../src/server/loas/servicoLoas.ts';
import { FilaJusta } from '../../src/server/autos/filaJusta.ts';
import { calcularLoas } from '../../src/loas/calcLoas.ts';
import { REGRAS_LOAS_V1 } from '../../src/loas/regrasLoas.ts';
import { gerarMinuta } from '../../src/loas/drafter.ts';
import { hashAnexos } from '../../src/loas/aprovacao.ts';
import { DemoSigner } from '../../src/loas/assinatura.ts';

const env = (k: string, d: number) => Number(process.env[k] ?? d);
const ADVOGADOS = env('ADVOGADOS', 2000);
const TENANTS = env('TENANTS', 20);
const DURACAO_SEG = env('DURACAO_SEG', 1800);
const PENSAR_MS = env('PENSAR_MS', 3000);
const CASOS_POR_ADV = env('CASOS_POR_ADV', 25);
const COMPETENCIA = process.env.COMPETENCIA ?? '2026-09';

const TESE = { id: 'STF_RE_567985', titulo: 'Critério de 1/4 do SM não é absoluto', fundamento: 'STF, RE 567.985.', ativa: true, revisadoPor: 'carga', revisadoEm: '2026-10-01' };

const hub = new HubSse(0);
const repo = new MemoriaLoasRepository();
const fila = new FilaJusta({ concorrenciaGlobal: 64, concorrenciaPorTenant: 16, concorrenciaPorUsuario: 2, maxPendentesPorTenant: 5000, maxPendentesGlobal: 50000 });
const gateway = new GatewayProtocolo(new DemoAdapter({ latenciaMs: 150 }), { rps: 50, rajada: 100 });
const servico = new ServicoLoas({
  repo, fila, gateway, hub, signer: new DemoSigner(true),
  calcular: (c, comp) => calcularLoas(c, REGRAS_LOAS_V1, comp),
  gerarMinuta, versaoRegras: REGRAS_LOAS_V1.versao,
  tesesAtivas: () => [TESE, ...REGRAS_LOAS_V1.teses.filter((t) => t.ativa && t.id !== TESE.id)],
  retentativa: (fn) => fn(),
});

const lat: Record<'leitura' | 'escrita' | 'lote', number[]> = { leitura: [], escrita: [], lote: [] };
let erros = 0, ops = 0;
const motivos = new Map<string, number>();
const protocolosPorAdv = new Map<string, number>();
const pct = (a: number[], p: number) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]; };

function caso(id: string, i: number) {
  return {
    id, categoria: i % 2 ? 'IDOSO' : 'DEFICIENCIA', cadUnicoAtualizado: true, despesas: [],
    requerente: { id: 'r' + id, nome: 'Requerente Ficticio ' + i, cpf: '52998224725', dataNascimento: '1956-03-10' },
    grupo: [{ id: 'm1', nome: 'Requerente Ficticio', parentesco: 'REQUERENTE', dataNascimento: '1956-03-10', mesmoTeto: true, rendaBrutaCentavos: (i % 5) * 20000 }],
    requerimentoAdministrativo: { numeroNB: '7123456789', dataIndeferimento: '2026-05-02', motivo: 'renda' },
  };
}

interface Adv { ctx: CtxLoas; casos: string[]; prontos: ItemLote[]; }
const advs: Adv[] = [];

function semear(): void {
  for (let a = 0; a < ADVOGADOS; a++) {
    const ctx = { tenantId: `T${a % TENANTS}`, userId: `adv${a}`, papel: 'operator' };
    const casos: string[] = [];
    for (let c = 0; c < CASOS_POR_ADV; c++) { const id = `a${a}c${c}`; servico.criarCaso(ctx, caso(id, c)); casos.push(id); }
    advs.push({ ctx, casos, prontos: [] });
  }
  servico.despacharOutbox(1e9);
}

function medir(tipo: keyof typeof lat, fn: () => unknown): void {
  const t0 = performance.now();
  try { fn(); } catch (e) { erros++; const m = String((e as Error).message).replace(/a\d+c\d+/g, "<id>"); motivos.set(m, (motivos.get(m) ?? 0) + 1); }
  lat[tipo].push(performance.now() - t0); ops++;
}

function preparar(adv: Adv, id: string): void {
  servico.calcular(adv.ctx, id, { competencia: COMPETENCIA });
  const m = servico.minuta(adv.ctx, id, { tesesSelecionadas: [TESE.id], juizo: { orgao: 'JEF', subsecao: 'Carga' }, advogado: { nome: 'Adv Carga', oab: 'SP 000' } });
  if (m.bloqueada) return;
  const sr = 'sr-' + adv.ctx.tenantId;
  servico.definirProcuracao(adv.ctx, id, { advogados: [{ id: sr, oab: 'SP 000', cpf: '52998224725' }] });
  const anexosHash = hashAnexos({ id });
  servico.aprovar({ tenantId: adv.ctx.tenantId, userId: sr, papel: 'tenant_admin' }, id, { anexosHash });
  adv.prontos = adv.prontos.filter((x) => x.casoId !== id);
  adv.prontos.push({ casoId: id, anexosHash, tribunal: `TRF${(adv.casos.indexOf(id) % 6) + 1}`, sistema: 'PJE', arquivos: [], signatarioId: sr });
}

function acao(adv: Adv): void {
  const r = Math.random();
  const id = adv.casos[Math.floor(Math.random() * adv.casos.length)];
  if (r < 0.80) {
    const q = Math.random();
    medir('leitura', () => q < 0.6 ? servico.listar(adv.ctx, { advogadoId: adv.ctx.userId, limite: 50 }) : q < 0.9 ? servico.obter(adv.ctx, id) : servico.painel(adv.ctx));
  } else if (r < 0.95) {
    medir('escrita', () => preparar(adv, id));
  } else if (adv.prontos.length) {
    const itens = adv.prontos.splice(0, 5).filter((i) => { const r = servico.obter(adv.ctx, i.casoId); return !!r.aprovacao && r.protocoladoDraftHash !== r.ultimaMinutaHash; });
    if (itens.length) {
      medir('lote', () => servico.criarLote(adv.ctx, { itens }));
      protocolosPorAdv.set(adv.ctx.userId, (protocolosPorAdv.get(adv.ctx.userId) ?? 0) + itens.length);
    }
  }
}

async function main(): Promise<void> {
  const t0 = performance.now();
  semear();
  console.log(`[carga] semeado: ${ADVOGADOS} advogados, ${TENANTS} tenants, ${ADVOGADOS * CASOS_POR_ADV} casos em ${((performance.now() - t0) / 1000).toFixed(1)}s`);
  const h = monitorEventLoopDelay({ resolution: 10 }); h.enable();
  servico.iniciarDispatcher(100);
  const fim = Date.now() + DURACAO_SEG * 1000;
  const timers: Array<ReturnType<typeof setTimeout>> = [];
  const agendar = (adv: Adv) => {
    if (Date.now() >= fim) return;
    timers.push(setTimeout(() => { acao(adv); agendar(adv); }, PENSAR_MS * (0.5 + Math.random())));
  };
  advs.forEach(agendar);
  const rel = setInterval(() => console.log(`[carga] ops=${ops} erros=${erros} p95 leitura=${pct(lat.leitura, 95).toFixed(1)}ms heap=${(process.memoryUsage().heapUsed / 2 ** 20).toFixed(0)}MB`), 10_000);
  await new Promise((r) => setTimeout(r, DURACAO_SEG * 1000 + 2000));
  clearInterval(rel); h.disable(); servico.parar();

  const totalProt = [...protocolosPorAdv.values()].reduce((s, n) => s + n, 0);
  const maxAdv = Math.max(0, ...protocolosPorAdv.values());
  const painel = Array.from({ length: TENANTS }, (_, i) => servico.painel({ tenantId: `T${i}`, userId: 'x' }));
  const protocolados = painel.reduce((s, p) => s + p.protocolados, 0);
  const res = {
    duracaoSeg: DURACAO_SEG, advogados: ADVOGADOS, ops, opsPorSeg: +(ops / DURACAO_SEG).toFixed(1), erros,
    leitura: { p50: +pct(lat.leitura, 50).toFixed(2), p95: +pct(lat.leitura, 95).toFixed(2), p99: +pct(lat.leitura, 99).toFixed(2) },
    escrita: { p50: +pct(lat.escrita, 50).toFixed(2), p95: +pct(lat.escrita, 95).toFixed(2), p99: +pct(lat.escrita, 99).toFixed(2) },
    lote202: { p50: +pct(lat.lote, 50).toFixed(2), p95: +pct(lat.lote, 95).toFixed(2), p99: +pct(lat.lote, 99).toFixed(2) },
    eventLoopMs: { p50: +(h.percentile(50) / 1e6).toFixed(1), p99: +(h.percentile(99) / 1e6).toFixed(1), max: +(h.max / 1e6).toFixed(1) },
    protocolosEnviados: totalProt, protocoladosNoRepo: protocolados,
    maiorFatiaAdvogadoPct: totalProt ? +((100 * maxAdv) / totalProt).toFixed(2) : 0,
    heapMB: +(process.memoryUsage().heapUsed / 2 ** 20).toFixed(0), rssMB: +(process.memoryUsage().rss / 2 ** 20).toFixed(0),
    tribunais: gateway.saudeTribunais(),
  };
  const ok = res.leitura.p95 < 300 && res.lote202.p95 < 150 && res.eventLoopMs.p99 < 50 && protocolados <= totalProt && res.maiorFatiaAdvogadoPct <= 5;
  console.log("[carga] motivos de erro:", Object.fromEntries(motivos));
  console.log(JSON.stringify({ ...res, aceite: ok ? 'APROVADO' : 'REPROVADO' }, null, 2));
  timers.forEach(clearTimeout);
  hub.fechar();
}

main();
