/**
 * VELATRIX AOS · Teste de carga local da Leitura de Autos (P27, instância única).
 *
 * Sobe o ServicoAutos REAL (FilaJusta, guardrail de citação, parser, hash) num processo
 * filho com node:http e dispara advogados virtuais de outro processo, para o gerador
 * não disputar o event loop com o servidor. O Gemini é simulado: latência log-normal
 * e cota por minuto (token bucket) que devolve 429 como o provedor real.
 *
 *   node --experimental-strip-types --no-warnings scripts/carga/cargaAutos.ts            # cenário pico
 *   CENARIO=cpu node --experimental-strip-types --no-warnings scripts/carga/cargaAutos.ts # teto de CPU
 *
 * Variáveis: USUARIOS, ESCRITORIOS, TAREFAS, RAMPA_S, LAT_MS, RPM, PAGINAS, CONC_GLOBAL.
 * Mede: latência ponta a ponta (com retentativas), 429/5xx, justiça entre escritórios,
 * atraso do event loop (p99), CPU e memória do servidor. Resultado também em JSON.
 */
import http from 'node:http';
import { fork } from 'node:child_process';
import { createHash } from 'node:crypto';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ServicoAutos, ErroAutos, type ProvedorIa } from '../../src/server/autos/servicoAutos.ts';
import { FilaJusta, comRetentativa } from '../../src/server/autos/filaJusta.ts';

const env = (k: string, d: number) => (process.env[k] !== undefined ? Number(process.env[k]) : d);
const CENARIO = process.env.CENARIO === 'cpu' ? 'cpu' : 'pico';
const CFG = CENARIO === 'cpu'
  ? { USUARIOS: env('USUARIOS', 200), ESCRITORIOS: env('ESCRITORIOS', 20), TAREFAS: env('TAREFAS', 40), RAMPA_S: env('RAMPA_S', 1), LAT_MS: env('LAT_MS', 0), RPM: env('RPM', 0), PAGINAS: env('PAGINAS', 20), CONC_GLOBAL: env('CONC_GLOBAL', 64) }
  : { USUARIOS: env('USUARIOS', 2000), ESCRITORIOS: env('ESCRITORIOS', 40), TAREFAS: env('TAREFAS', 2), RAMPA_S: env('RAMPA_S', 10), LAT_MS: env('LAT_MS', 2000), RPM: env('RPM', 3000), PAGINAS: env('PAGINAS', 20), CONC_GLOBAL: env('CONC_GLOBAL', 64) };

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const pct = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const o = [...xs].sort((a, b) => a - b);
  return o[Math.min(o.length - 1, Math.floor((p / 100) * o.length))];
};

// ─────────────────────────── servidor (processo filho) ───────────────────────────

/** Gemini simulado: latência log-normal (mediana LAT_MS) + cota por minuto com 429. */
function provedorSimulado(latMs: number, rpm: number): ProvedorIa {
  let tokens = rpm, ultimo = Date.now();
  const pegarToken = () => {
    if (!rpm) return true;
    const agora = Date.now();
    tokens = Math.min(rpm, tokens + ((agora - ultimo) / 60_000) * rpm);
    ultimo = agora;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const latencia = () => (latMs ? latMs * Math.exp(0.35 * Math.sqrt(-2 * Math.log(Math.random() || 1e-9)) * Math.cos(2 * Math.PI * Math.random())) : 0);
  return {
    nome: 'simulado',
    async gerarJson(_s, conteudo) {
      if (!pegarToken()) { await dormir(40); throw Object.assign(new Error('quota'), { status: 429 }); }
      await dormir(latencia());
      // Responde como um LLM bem-comportado: cita linhas literais das páginas recebidas.
      const fatos: unknown[] = [];
      for (const bloco of conteudo.split(/\n(?=\[p\. \d+\]\n)/)) {
        const m = bloco.match(/^\[p\. (\d+)\]\n([\s\S]*)/);
        if (!m) continue;
        for (const linha of m[2].split('\n')) {
          const v = linha.match(/R\$ [\d.]+,\d{2}/);
          if (v && fatos.length < 30) fatos.push({ campo: 'valor', valor: v[0], pagina: Number(m[1]), trecho: linha.trim() });
        }
      }
      return { texto: JSON.stringify({ fatos }), modelo: 'simulado' };
    },
    async transcrever() { await dormir(latencia()); return { texto: '', modelo: 'simulado' }; },
  };
}

async function servidor() {
  const eld = monitorEventLoopDelay({ resolution: 10 });
  eld.enable();
  const fila = new FilaJusta({ concorrenciaGlobal: CFG.CONC_GLOBAL, duracaoMediaMs: Math.max(200, CFG.LAT_MS) });
  const servico = new ServicoAutos({
    fila,
    provedor: provedorSimulado(CFG.LAT_MS, CFG.RPM),
    modoDemo: false,
    hash: (v) => sha(JSON.stringify(v)),
    sha256Hex: sha,
    comRetentativa: (fn) => comRetentativa(fn),
    ledger: (_t, e) => { sha(JSON.stringify(e)); }, // custo equivalente ao append do ledger (sem disco)
    maxBytesPendentes: process.env.MAX_MB ? Number(process.env.MAX_MB) * 1048576 : undefined,
  });
  let rssPico = 0;
  const latServidor: number[] = []; // do fim do corpo até a resposta (inclui espera na fila)
  const amostra = setInterval(() => { rssPico = Math.max(rssPico, process.memoryUsage().rss); }, 250);
  const cpu0 = process.cpuUsage();

  const srv = http.createServer((req, res) => {
    const responder = (status: number, corpo: unknown, headers: Record<string, string> = {}) => {
      res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
      res.end(JSON.stringify(corpo));
    };
    if (req.url === '/__metricas') {
      const cpu = process.cpuUsage(cpu0);
      const s = fila.estatisticas();
      return responder(200, {
        eventLoopP50ms: eld.percentile(50) / 1e6, eventLoopP99ms: eld.percentile(99) / 1e6, eventLoopMaxMs: eld.max / 1e6,
        latenciaServidorMs: { p50: Math.round(pct(latServidor, 50)), p95: Math.round(pct(latServidor, 95)), p99: Math.round(pct(latServidor, 99)), max: Math.round(Math.max(0, ...latServidor)) },
        rssPicoMB: Math.round(rssPico / 1048576), cpuUserS: cpu.user / 1e6, cpuSysS: cpu.system / 1e6,
        fila: { concluidas: s.concluidas, falhas: s.falhas, rejeitadas: s.rejeitadas, deduplicadas: s.deduplicadas, esperaMediaMs: s.esperaMediaMs },
      });
    }
    if (req.method !== 'POST' || req.url !== '/api/autos/extrair') return responder(404, { error: 'nf' });
    const partes: Buffer[] = [];
    let tam = 0;
    req.on('data', (c: Buffer) => { tam += c.length; if (tam > 1_048_576) req.destroy(); else partes.push(c); });
    req.on('end', async () => {
      const ctx = { tenantId: String(req.headers['x-tenant']), userId: String(req.headers['x-user']) };
      const t = performance.now();
      res.on('finish', () => { if (res.statusCode === 200) latServidor.push(performance.now() - t); });
      try {
        const out = await servico.extrair(ctx, JSON.parse(Buffer.concat(partes).toString('utf8')));
        responder(200, { guardrail: out.guardrail, conferidos: out.conferidos, rejeitados: out.rejeitados, origem: out.origem });
      } catch (e) {
        const er = e as ErroAutos;
        const st = typeof er.httpStatus === 'number' ? er.httpStatus : 500;
        responder(st, { error: er.message }, st === 429 && er.retryAfterSeg ? { 'Retry-After': String(er.retryAfterSeg) } : {});
      }
    });
  });
  srv.keepAliveTimeout = 65_000;
  srv.requestTimeout = 0; // a espera na fila é o próprio objeto do teste
  srv.listen(0, '127.0.0.1', () => process.send?.({ porta: (srv.address() as { port: number }).port }));
  process.on('message', (m) => { if (m === 'sair') { clearInterval(amostra); srv.close(); process.exit(0); } });
}

// ─────────────────────────── gerador de carga (processo pai) ───────────────────────────

function corpoPeca(autosHash: string, paginas: number) {
  const pags = Array.from({ length: paginas }, (_, i) => {
    const n = i + 1;
    const linhas = [
      `Processo nº 0801234-56.2024.8.26.0100 · folha ${n} · autos ${autosHash.slice(0, 16)}`,
      `AUTORA: Construtora Horizonte Ltda. em face de Banco Meridional S/A`,
      ...(n % 4 === 1 ? [`Requer a condenação ao pagamento de R$ ${(1000 + n * 37).toLocaleString('pt-BR')}.250,00 acrescido de juros.`] : []),
      `O contrato foi assinado em 12/03/2024, com vencimento em 15/04/2024.`,
      ...Array.from({ length: 28 }, (_, k) => `Parágrafo ${k + 1} da página ${n}: fundamentação jurídica com texto corrido para simular uma petição real de autos judiciais.`),
    ];
    return { n, texto: linhas.join('\n') };
  });
  return JSON.stringify({ autosHash, peca: { id: 'PC-001', tipo: 'peticao_inicial', paginaInicial: 1, paginaFinal: paginas }, paginas: pags });
}

interface Registro { tenant: string; ms: number; tentativas: number; status: number; origem?: string; }

async function gerador() {
  const filho = fork(fileURLToPath(import.meta.url), ['--servidor'], {
    execArgv: ['--experimental-strip-types', '--no-warnings', ...(process.env.PERFIL ? ['--cpu-prof', '--cpu-prof-dir=prof'] : [])],
    env: process.env,
  });
  const porta: number = await new Promise((ok) => filho.once('message', (m: { porta: number }) => ok(m.porta)));
  const base = `http://127.0.0.1:${porta}`;

  // Escritórios com tamanho em lei de potência: poucos grandes, muitos pequenos.
  const pesos = Array.from({ length: CFG.ESCRITORIOS }, (_, i) => 1 / (i + 1) ** 0.9);
  const soma = pesos.reduce((a, b) => a + b, 0);
  const tamanhos = pesos.map((p) => Math.max(1, Math.round((p / soma) * CFG.USUARIOS)));
  const usuarios: { tenant: string; user: string }[] = [];
  tamanhos.forEach((t, i) => { for (let u = 0; u < t; u++) usuarios.push({ tenant: `esc-${String(i + 1).padStart(2, '0')}`, user: `adv-${u}` }); });

  const registros: Registro[] = [];
  const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const t0 = performance.now();
  let emVoo = 0, picoEmVoo = 0, feitas = 0;
  const totalTarefas = usuarios.length * CFG.TAREFAS;
  const progresso = setInterval(() => {
    process.stdout.write(`\r  ${feitas}/${totalTarefas} concluídas · ${emVoo} requisições abertas · ${((performance.now() - t0) / 1000).toFixed(0)} s   `);
  }, 1000);

  await Promise.all(usuarios.map(async ({ tenant, user }, idx) => {
    await dormir(Math.random() * CFG.RAMPA_S * 1000);
    for (let t = 0; t < CFG.TAREFAS; t++) {
      const corpo = corpoPeca(sha(`${idx}:${t}`), CFG.PAGINAS); // autos distintos: sem cache, pior caso
      const ini = performance.now();
      let tentativas = 0, status = 0, origem: string | undefined;
      while (performance.now() - ini < 300_000) { // mesmo prazo do autosIaClient (5 min)
        tentativas++;
        emVoo++; picoEmVoo = Math.max(picoEmVoo, emVoo);
        try {
          const r = await fetch(`${base}/api/autos/extrair`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-tenant': tenant, 'x-user': user }, body: corpo });
          status = r.status;
          const j = (await r.json().catch(() => ({}))) as { origem?: string };
          origem = j.origem;
          if (r.status !== 429) break;
          const seg = Math.min(60, Number(r.headers.get('retry-after')) || 2 ** Math.min(tentativas, 5));
          emVoo--;
          await dormir(seg * 1000 * (0.8 + Math.random() * 0.4));
          emVoo++;
        } catch {
          status = -1;
          break;
        } finally {
          emVoo--;
        }
      }
      registros.push({ tenant, ms: performance.now() - ini, tentativas, status, origem });
      feitas++;
    }
  }));
  clearInterval(progresso);
  const duracaoS = (performance.now() - t0) / 1000;
  const metricas = await (await fetch(`${base}/__metricas`)).json();
  filho.send('sair');

  // ── relatório ──
  const ok = registros.filter((r) => r.status === 200);
  const lat = ok.map((r) => r.ms);
  const porTenant = new Map<string, number[]>();
  for (const r of ok) porTenant.set(r.tenant, [...(porTenant.get(r.tenant) ?? []), r.ms]);
  const tenants = [...porTenant.keys()].sort();
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const grandes = tenants.slice(0, 3), pequenos = tenants.slice(-10);
  const resultado = {
    cenario: CENARIO, config: CFG, escritorios: { maior: Math.max(...tamanhos), menor: Math.min(...tamanhos) },
    duracaoS: Number(duracaoS.toFixed(1)),
    tarefas: { total: registros.length, ok: ok.length, http429Final: registros.filter((r) => r.status === 429).length, http5xx: registros.filter((r) => r.status >= 500).length, falhaRede: registros.filter((r) => r.status === -1).length },
    vazaoPorS: Number((ok.length / duracaoS).toFixed(1)),
    latenciaMs: { p50: Math.round(pct(lat, 50)), p95: Math.round(pct(lat, 95)), p99: Math.round(pct(lat, 99)), max: Math.round(Math.max(0, ...lat)) },
    origem: { ia: ok.filter((r) => r.origem === 'ia').length, deterministicoPorCotaEsgotada: ok.filter((r) => r.origem === 'deterministico').length },
    tentativasMedias: Number(media(registros.map((r) => r.tentativas)).toFixed(2)),
    justica: {
      mediaMs3Maiores: Math.round(media(grandes.flatMap((t) => porTenant.get(t)!))),
      mediaMs10Menores: Math.round(media(pequenos.flatMap((t) => porTenant.get(t)!))),
    },
    conexoesAbertasPico: picoEmVoo,
    servidor: metricas,
  };
  const arq = `scripts/carga/resultado-${CENARIO}.json`;
  writeFileSync(arq, JSON.stringify(resultado, null, 2));
  console.log(`\n\n${JSON.stringify(resultado, null, 2)}\n\nSalvo em ${arq}`);
}

if (process.argv.includes('--servidor')) void servidor();
else void gerador();
