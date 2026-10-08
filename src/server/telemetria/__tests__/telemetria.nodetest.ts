import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TelemetriaStore, validarLote, LimitadorTelemetria, geoDeHeaders, ErroTelemetria, ctxTelemetria, definirStoreTelemetria, registrarConsumoTokens, registrarDesfecho } from '../telemetria.ts';

const H = 3_600_000;
const T0 = Date.UTC(2026, 9, 1, 15, 0, 0); // 12h BRT
const relogio = (t = T0) => { let agora = t; return { agora: () => agora, avancar: (ms: number) => { agora += ms; } }; };
const ev = (o: Record<string, unknown>) => ({ tenantId: 't1', userId: 'u1', sessaoId: 's1', ts: T0, tipo: 'tela', ...o }) as never;

describe('presença ao vivo', () => {
  test('sessão aparece, troca de tela e expira sem heartbeat', () => {
    const r = relogio();
    const s = new TelemetriaStore({ agora: r.agora, sessaoTimeoutMs: 90_000 });
    s.registrar(ev({ tipo: 'sessao_inicio' }));
    s.registrar(ev({ tipo: 'tela', tela: 'inss' }));
    assert.equal(s.aoVivo().length, 1);
    assert.equal(s.aoVivo()[0].telaAtual, 'inss');
    r.avancar(60_000); s.registrar(ev({ tipo: 'heartbeat', ts: r.agora() }));
    r.avancar(80_000); assert.equal(s.aoVivo().length, 1, 'heartbeat renova');
    r.avancar(20_000); assert.equal(s.aoVivo().length, 0, 'expira após timeout');
  });
  test('sessao_fim remove na hora; sessão conta 1x mesmo com vários eventos', () => {
    const r = relogio();
    const s = new TelemetriaStore({ agora: r.agora });
    s.registrar(ev({ tipo: 'sessao_inicio' })); s.registrar(ev({ tela: 'a' })); s.registrar(ev({ tela: 'b' }));
    assert.equal(s.resumo(H).kpis.sessoes, 1);
    s.registrar(ev({ tipo: 'sessao_fim' }));
    assert.equal(s.aoVivo().length, 0);
  });
  test('sessaoId de outro usuário não sequestra a presença', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    s.registrar(ev({ tela: 'inss' }));
    s.registrar(ev({ userId: 'intruso', tela: 'super_admin' }));
    assert.equal(s.aoVivo()[0].telaAtual, 'inss');
  });
  test('filtro por tenant', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    s.registrar(ev({ tela: 'x' })); s.registrar(ev({ tenantId: 't2', userId: 'u2', sessaoId: 's2', tela: 'y' }));
    assert.equal(s.aoVivo('t2').length, 1);
    assert.equal(s.resumo(H, 't2').kpis.sessoes, 1);
  });
  test('equipe Velatrix (fabricante) fica fora de TODAS as métricas de cliente por padrão', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    s.registrar(ev({ tenantId: 'nexus', userId: 'adv1', sessaoId: 'n1', tela: 'inss', cidade: 'Recife', uf: 'PE' }));
    s.registrar(ev({ tenantId: 'VELATRIX', userId: 'secops', sessaoId: 'v1', tela: 'admin_analytics', cidade: 'São Paulo', uf: 'SP' }));
    s.registrar(ev({ tenantId: 'VELATRIX', userId: 'secops', sessaoId: 'v1', tipo: 'heartbeat' }));
    const r = s.resumo(H);
    assert.equal(r.kpis.usuariosUnicos, 1);
    assert.equal(r.kpis.sessoes, 1, 'sessão da Velatrix não soma');
    assert.equal(r.kpis.usuariosAgora, 1);
    assert.equal(r.kpis.tenantsAtivosAgora, 1);
    assert.deepEqual(r.tenants.map((t) => t.tenantId), ['nexus']);
    assert.equal(r.cidades.some((c) => c.cidade === 'São Paulo'), false);
    assert.equal(r.telas.some((t) => t.tela === 'admin_analytics'), false);
    const comEquipe = s.resumo(H, undefined, { incluirEquipeVelatrix: true });
    assert.equal(comEquipe.kpis.usuariosUnicos, 2);
    assert.equal(comEquipe.kpis.sessoes, 2);
    assert.equal(comEquipe.kpis.tenantsAtivosAgora, 2);
    assert.equal(s.resumo(H, 'VELATRIX').kpis.sessoes, 1, 'filtrar pelo fabricante mostra a equipe');
  });
});

describe('agregação', () => {
  test('hora do dia em BRT, telas, cidades, minutos, usuários únicos', () => {
    const s = new TelemetriaStore({ agora: () => T0 + 1000, heartbeatMs: 30_000 });
    s.registrar(ev({ tela: 'inss', cidade: 'Recife', uf: 'PE' }));
    s.registrar(ev({ tela: 'inss' }));
    s.registrar(ev({ tipo: 'heartbeat' })); s.registrar(ev({ tipo: 'heartbeat' }));
    s.registrar(ev({ userId: 'u2', sessaoId: 's2', tela: 'pericia' }));
    const r = s.resumo(24 * H);
    assert.equal(r.porHoraDoDia[12], 3);
    assert.equal(r.kpis.usuariosUnicos, 2);
    assert.equal(r.kpis.minutosAtivos, 1);
    assert.deepEqual(r.telas[0], { tela: 'inss', aberturas: 2 });
    assert.equal(r.cidades.find((c) => c.cidade === 'Recife')?.sessoes, 1);
    assert.equal(r.serie.length, 24);
  });
  test('janela > 48h agrega por dia; dados fora da janela não entram', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    s.registrar(ev({ ts: T0 - 10 * 24 * H, tela: 'antigo', sessaoId: 'old' }));
    s.registrar(ev({ tela: 'novo' }));
    const r7 = s.resumo(7 * 24 * H);
    assert.equal(r7.granularidade, 'dia');
    assert.equal(r7.kpis.sessoes, 1);
    assert.equal(s.resumo(30 * 24 * H).kpis.sessoes, 2);
  });
  test('retenção poda buckets antigos', () => {
    const r = relogio();
    const s = new TelemetriaStore({ agora: r.agora, retencaoMs: 2 * H });
    s.registrar(ev({ tela: 'x', sessaoId: 'a' }));
    r.avancar(5 * H);
    s.registrar(ev({ ts: r.agora(), tela: 'y', sessaoId: 'b' }));
    assert.equal(s.resumo(30 * 24 * H).kpis.sessoes, 1);
  });
  test('tokens e desfechos só via servidor, com contexto da requisição', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    definirStoreTelemetria(s);
    ctxTelemetria.run({ tenantId: 't9', userId: 'u9' }, () => registrarConsumoTokens('gemini-x', 1000, 200));
    registrarDesfecho('t9', 'ganha', 'loas'); registrarDesfecho('t9', 'ganha', 'loas'); registrarDesfecho('t9', 'perdida', 'inss');
    const r = s.resumo(H);
    assert.equal(r.kpis.tokensEntrada, 1000);
    assert.equal(r.modelos[0].tokens, 1200);
    assert.equal(r.tenants.find((t) => t.tenantId === 't9')?.ganhas, 2);
    assert.ok(Math.abs((r.kpis.taxaExito ?? 0) - 2 / 3) < 1e-9);
    definirStoreTelemetria(null);
  });
  test('sem desfechos decididos → taxaExito null (não inventa 0%)', () => {
    assert.equal(new TelemetriaStore({ agora: () => T0 }).resumo(H).kpis.taxaExito, null);
  });
  test('carga: 2.000 usuários × 120 heartbeats em O(1) por evento', () => {
    const s = new TelemetriaStore({ agora: () => T0 });
    const t = performance.now();
    for (let u = 0; u < 2000; u++) for (let i = 0; i < 120; i++) s.registrar(ev({ userId: 'u' + u, sessaoId: 's' + u, tipo: i ? 'heartbeat' : 'tela', tela: 'inss', ts: T0 - 60_000 + i * 100 }));
    const ms = performance.now() - t;
    assert.equal(s.aoVivo().length, 2000);
    const q = performance.now(); s.resumo(30 * 24 * H); const qms = performance.now() - q;
    assert.ok(ms < 1500, `ingestão 240k eventos em ${ms.toFixed(0)}ms`);
    assert.ok(qms < 200, `resumo em ${qms.toFixed(0)}ms`);
  });
});

describe('ingestão do navegador', () => {
  test('allowlist: descarta campos extras, tipos de servidor e ids fora do padrão', () => {
    const { eventos } = validarLote({
      sessaoId: 'abc12345',
      eventos: [
        { tipo: 'tela', tela: 'inss', conteudo: 'CPF 123', html: '<div>' },
        { tipo: 'tokens', tokensEntrada: 999999 },
        { tipo: 'desfecho', resultado: 'ganha' },
        { tipo: 'tela', tela: 'DROP TABLE;' },
        { tipo: 'acao', acao: 'loas.calcular' },
      ],
    }, T0);
    assert.equal(eventos.length, 2);
    assert.deepEqual(Object.keys(eventos[0]).sort(), ['tela', 'tipo', 'ts']);
  });
  test('ts fora de ±5 min vira o relógio do servidor', () => {
    const { eventos } = validarLote({ sessaoId: 'abc12345', eventos: [{ tipo: 'heartbeat', ts: T0 + 3600_000 }] }, T0);
    assert.equal(eventos[0].ts, T0);
  });
  test('lote grande → 413; sessaoId inválido → 400', () => {
    assert.throws(() => validarLote({ sessaoId: 'abc12345', eventos: Array(51).fill({ tipo: 'heartbeat' }) }, T0), (e: unknown) => e instanceof ErroTelemetria && e.status === 413);
    assert.throws(() => validarLote({ sessaoId: '../x', eventos: [{ tipo: 'heartbeat' }] }, T0), (e: unknown) => e instanceof ErroTelemetria && e.status === 400);
  });
  test('limitador por usuário/minuto', () => {
    const l = new LimitadorTelemetria(10);
    assert.equal(l.permitir('u', 8, T0), true);
    assert.equal(l.permitir('u', 3, T0 + 1), false);
    assert.equal(l.permitir('u', 3, T0 + 60_000), true);
  });
  test('geo por header do balanceador, sanitizado, sem IP', () => {
    assert.deepEqual(geoDeHeaders({ 'x-client-geo-city': 's%C3%A3o%20paulo', 'x-client-geo-subdivision': 'BR-SP', 'x-forwarded-for': '1.2.3.4' }), { cidade: 'São Paulo', uf: 'SP' });
    assert.deepEqual(geoDeHeaders({ 'x-appengine-city': '<script>x' }), { cidade: 'Scriptx', uf: undefined });
    assert.deepEqual(geoDeHeaders({}), { cidade: undefined, uf: undefined });
  });
});
