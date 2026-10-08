import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { StoreIdempotencia, ErroIdempotencia } from '../idempotencia.ts';
import { MemoriaLoasRepository, ErroRepositorio, type RegistroCaso } from '../repositorio.ts';
import { GatewayProtocolo, DemoAdapter, CircuitBreaker, TokenBucket, ErroTribunal, type PedidoProtocolo, type TribunalAdapter } from '../tribunal.ts';
import { assinarWebhook, verificarWebhook, HubSse, DedupEventos } from '../webhookSse.ts';
import { ServicoLoas, type ItemLote } from '../servicoLoas.ts';
import { validarNovoCaso, ErroValidacao } from '../validacao.ts';
import { aprovar, hashAnexos } from '../../../loas/aprovacao.ts';
import { DemoSigner } from '../../../loas/assinatura.ts';
import { senioridadeDe } from '../servicoLoas.ts';
import { gerarMinuta } from '../../../loas/drafter.ts';
import type { CasoLoas, ResultadoCalculoLoas } from '../../../loas/tipos.ts';

const CPF = '52998224725';
const novoCaso = (id: string) => ({
  id, categoria: 'IDOSO', cadUnicoAtualizado: true, despesas: [],
  requerente: { id: 'r-' + id, nome: 'Fulano de Tal', cpf: CPF, dataNascimento: '1955-01-01' },
  grupo: [{ id: 'm1', nome: 'Fulano de Tal', parentesco: 'REQUERENTE', dataNascimento: '1955-01-01', mesmoTeto: true, rendaBrutaCentavos: 0 }],
  requerimentoAdministrativo: { numeroNB: '7123456789', dataIndeferimento: '2026-05-02', motivo: 'renda' },
});
const regCaso = (tenantId: string, id: string, em: string, adv = 'adv1'): RegistroCaso => ({
  caso: { id, tenantId, advogadoResponsavelId: adv } as CasoLoas, estagio: 'CAPTURA', criadoEm: em, atualizadoEm: em, versao: 1,
});
const ev = { tipo: 'x', advogadoId: 'adv1', dados: {} };
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function ate(cond: () => boolean, ms = 2000) { const t0 = Date.now(); while (!cond()) { if (Date.now() - t0 > ms) throw new Error('timeout'); await espera(5); } }

// ───────── idempotência ─────────
describe('idempotência', () => {
  test('replay devolve a mesma resposta e executa uma vez', async () => {
    const s = new StoreIdempotencia(); let n = 0;
    const fp = StoreIdempotencia.fingerprint('POST', '/x', { a: 1 });
    const a = await s.executar('t1', 'chave-123456', fp, async () => ({ status: 201, corpo: { n: ++n } }));
    const b = await s.executar('t1', 'chave-123456', fp, async () => ({ status: 201, corpo: { n: ++n } }));
    assert.deepEqual(b.corpo, a.corpo); assert.equal(b.replay, true); assert.equal(n, 1);
  });
  test('mesma chave com corpo diferente → 422; tenants isolados', async () => {
    const s = new StoreIdempotencia();
    await s.executar('t1', 'chave-123456', 'fp1', async () => ({ status: 200, corpo: 1 }));
    await assert.rejects(s.executar('t1', 'chave-123456', 'fp2', async () => ({ status: 200, corpo: 2 })), (e: unknown) => e instanceof ErroIdempotencia && e.httpStatus === 422);
    const r = await s.executar('t2', 'chave-123456', 'fp2', async () => ({ status: 200, corpo: 2 }));
    assert.equal(r.replay, false);
  });
  test('concorrente → 409; sem chave → 400; 5xx não memoriza', async () => {
    const s = new StoreIdempotencia();
    const lento = s.executar('t1', 'chave-abcdefg', 'fp', async () => { await espera(20); return { status: 200, corpo: 1 }; });
    await assert.rejects(s.executar('t1', 'chave-abcdefg', 'fp', async () => ({ status: 200, corpo: 1 })), (e: unknown) => (e as ErroIdempotencia).httpStatus === 409);
    await lento;
    await assert.rejects(s.executar('t1', undefined, 'fp', async () => ({ status: 200, corpo: 1 })), (e: unknown) => (e as ErroIdempotencia).httpStatus === 400);
    await s.executar('t1', 'chave-5xx-000', 'fp', async () => ({ status: 503, corpo: 'x' }));
    const ok = await s.executar('t1', 'chave-5xx-000', 'fp', async () => ({ status: 200, corpo: 'y' }));
    assert.equal(ok.corpo, 'y');
  });
});

// ───────── repositório ─────────
describe('repositório', () => {
  test('isolamento: sem tenant bloqueia; tenant B não vê A', () => {
    const r = new MemoriaLoasRepository();
    r.criar('A', regCaso('A', 'c1', '2026-10-01T00:00:00Z'), ev);
    assert.equal(r.obter('B', 'c1'), undefined);
    assert.throws(() => r.obter('', 'c1'), (e: unknown) => e instanceof ErroRepositorio);
    assert.throws(() => r.criar('B', regCaso('A', 'c2', '2026-10-01T00:00:00Z'), ev), (e: unknown) => (e as ErroRepositorio).httpStatus === 403);
  });
  test('cursor percorre tudo sem repetir nem pular (empates de timestamp)', () => {
    const r = new MemoriaLoasRepository();
    for (let i = 0; i < 237; i++) r.criar('A', regCaso('A', `c${String(i).padStart(3, '0')}`, `2026-10-01T00:00:0${i % 3}Z`), ev);
    const ids: string[] = []; let cursor: string | null = null;
    do { const p = r.listar('A', { limite: 50, cursor }); ids.push(...p.itens.map((x) => x.caso.id)); cursor = p.proximoCursor; } while (cursor);
    assert.equal(ids.length, 237); assert.equal(new Set(ids).size, 237);
    assert.equal(r.listar('A', { limite: 999 }).itens.length, 100); // teto
  });
  test('versão otimista, nº de processo único e agregados', () => {
    const r = new MemoriaLoasRepository();
    r.criar('A', regCaso('A', 'c1', '2026-10-01T00:00:00Z'), ev);
    r.criar('A', regCaso('A', 'c2', '2026-10-01T00:00:00Z', 'adv2'), ev);
    r.atualizar('A', 'c1', 1, { numeroProcesso: 'P1', estagio: 'ENTREGA' });
    assert.throws(() => r.atualizar('A', 'c1', 1, {}), (e: unknown) => (e as ErroRepositorio).httpStatus === 409);
    assert.throws(() => r.atualizar('A', 'c2', 1, { numeroProcesso: 'P1' }), /já vinculado/);
    const p = r.painel('A');
    assert.equal(p.total, 2); assert.equal(p.porEstagio.ENTREGA, 1); assert.equal(p.porEstagio.CAPTURA, 1);
    assert.equal(p.protocolados, 1); assert.equal(p.porAdvogado.adv2, 1);
    assert.equal(r.drenarOutbox(10).length, 2); // 2 criações; atualização sem evento não publica
  });
});

// ───────── tribunal ─────────
describe('gateway de protocolo', () => {
  const pedido = (casoId: string, tribunal = 'TRF3'): PedidoProtocolo => ({ tenantId: 'A', casoId, draftHash: 'h-' + casoId, tribunal, sistema: 'PJE', arquivos: [], assinaturaEnvelope: 'x', valorJuridico: false });
  test('dedup: mesmo caso+minuta nunca protocola duas vezes (inclusive concorrente)', async () => {
    let chamadas = 0;
    const ad: TribunalAdapter = { id: 'X', saude: async () => true, protocolar: async () => { chamadas++; await espera(10); return { numeroProcesso: 'N1', protocoladoEm: '', orgao: '', demo: true }; } };
    const g = new GatewayProtocolo(ad, { rps: 100, rajada: 100 });
    const [a, b] = await Promise.all([g.protocolar(pedido('c1')), g.protocolar(pedido('c1'))]);
    const c = await g.protocolar(pedido('c1'));
    assert.equal(chamadas, 1); assert.equal([a, b].filter((x) => x.duplicado).length, 1); assert.equal(c.duplicado, true);
  });
  test('circuit breaker abre após 5 falhas e isola só aquele tribunal', async () => {
    let t = 0;
    const g = new GatewayProtocolo(new DemoAdapter({ latenciaMs: 0, taxaFalha: 1 }), { rps: 100, rajada: 100, relogio: () => t, breaker: { limiar: 5, resfriamentoMs: 30_000 } });
    for (let i = 0; i < 5; i++) await assert.rejects(g.protocolar(pedido('f' + i)));
    await assert.rejects(g.protocolar(pedido('f9')), (e: unknown) => e instanceof ErroTribunal && /Circuito aberto/.test(e.message) && (e.retryAfterSeg ?? 0) > 0);
    assert.equal(g.saudeTribunais().TRF3, 'ABERTO');
    const ok = new GatewayProtocolo(new DemoAdapter({ latenciaMs: 0 }), { rps: 100, rajada: 100 });
    assert.ok((await ok.protocolar(pedido('z', 'TRF1'))).numeroProcesso);
    t += 30_000; assert.equal(g.saudeTribunais().TRF3, 'MEIO_ABERTO');
  });
  test('breaker: meio-aberto deixa 1 sonda; sucesso fecha', () => {
    let t = 0; const c = new CircuitBreaker({ limiar: 2, resfriamentoMs: 10, relogio: () => t });
    c.falha(); c.falha(); assert.equal(c.permitir(), false);
    t = 10; assert.equal(c.permitir(), true); assert.equal(c.permitir(), false);
    c.sucesso(); assert.equal(c.estado, 'FECHADO');
  });
  test('token bucket limita rajada e informa espera', () => {
    let t = 0; const b = new TokenBucket(2, 1, () => t);
    assert.equal(b.tentar(), 0); assert.equal(b.tentar(), 0); assert.ok(b.tentar() > 0);
    t = 1000; assert.equal(b.tentar(), 0);
  });
  test('timeout aborta chamada presa', async () => {
    const g = new GatewayProtocolo(new DemoAdapter({ latenciaMs: 1000 }), { timeoutMs: 20, rps: 100, rajada: 100 });
    await assert.rejects(g.protocolar(pedido('lento')), (e: unknown) => (e as ErroTribunal).httpStatus === 504);
  });
});

// ───────── webhook / SSE ─────────
describe('webhook e SSE', () => {
  const secret = 's'.repeat(40);
  test('HMAC válido, adulterado, fora da janela e secret fraco', () => {
    const body = '{"a":1}'; const ts = 1_800_000_000;
    const sig = assinarWebhook(secret, ts, body);
    assert.equal(verificarWebhook({ secret, assinatura: sig, timestamp: String(ts), rawBody: body, agoraSeg: ts }).valido, true);
    assert.equal(verificarWebhook({ secret, assinatura: sig, timestamp: String(ts), rawBody: '{"a":2}', agoraSeg: ts }).valido, false);
    assert.equal(verificarWebhook({ secret, assinatura: sig, timestamp: String(ts), rawBody: body, agoraSeg: ts + 301 }).valido, false);
    assert.equal(verificarWebhook({ secret: 'curto', assinatura: sig, timestamp: String(ts), rawBody: body, agoraSeg: ts }).valido, false);
  });
  test('dedup de eventId', () => {
    const d = new DedupEventos(); assert.equal(d.registrar('e1'), true); assert.equal(d.registrar('e1'), false);
  });
  test('SSE: nova conexão substitui a antiga', () => {
    const h = new HubSse(0); const out: string[] = []; let fechou = false;
    h.conectar('A', 'u', { write: () => true, end: () => { fechou = true; } });
    h.conectar('A', 'u', { write: (s) => { out.push(s); return true; }, end: () => {} });
    assert.equal(fechou, true); assert.equal(h.total, 1);
    assert.equal(h.publicar('A', 'u', 'caso.criado', { id: 1 }), true);
    assert.match(out.join(''), /event: caso\.criado/);
    assert.equal(h.publicar('B', 'u', 'x', {}), false);
  });
});

// ───────── validação ─────────
describe('validação', () => {
  test('aceita caso válido; rejeita float monetário e parentesco fora do rol', () => {
    assert.ok(validarNovoCaso(novoCaso('c1')));
    const ruim = novoCaso('c2'); (ruim.grupo[0] as Record<string, unknown>).rendaBrutaCentavos = 10.5; (ruim.grupo[0] as Record<string, unknown>).parentesco = 'PRIMO';
    assert.throws(() => validarNovoCaso(ruim), (e: unknown) => e instanceof ErroValidacao && e.errors.length === 2);
  });
});

// ───────── fluxo ponta a ponta ─────────
function montar(opts: { taxaFalha?: number } = {}) {
  const hub = new HubSse(0);
  const eventos: string[] = [];
  hub.conectar('A', 'adv-jr', { write: (s) => { eventos.push(s); return true; }, end: () => {} });
  const repo = new MemoriaLoasRepository();
  const filaFake = { enfileirar: <T>(_t: string, _u: string, f: () => Promise<T>) => f() };
  const servico = new ServicoLoas({
    repo, fila: filaFake, hub, signer: new DemoSigner(true),
    gateway: new GatewayProtocolo(new DemoAdapter({ latenciaMs: 1, taxaFalha: opts.taxaFalha ?? 0 }), { rps: 1000, rajada: 1000 }),
    calcular: (caso, competencia) => ({ competencia, hash: 'calc-' + caso.id, versaoRegras: '1.0.0', elegivelCriterioObjetivo: true, pendencias: [],
      salarioMinimoCentavos: 162100, rendaBrutaTotalCentavos: 0, totalDeducoesAceitasCentavos: 0, perCapitaCentavos: 0, limiteCentavos: 40525 }) as unknown as ResultadoCalculoLoas,
    gerarMinuta, versaoRegras: '1.0.0',
    tesesAtivas: () => [{ id: 'STF_RE_567985', titulo: 'Critério de 1/4 não é absoluto', fundamento: 'STF, RE 567.985.', ativa: true, revisadoPor: 'r', revisadoEm: '2026-09-30' }],
    retentativa: (fn) => fn(),
  });
  return { servico, repo, eventos };
}

describe('ServicoLoas ponta a ponta', () => {
  const op = { tenantId: 'A', userId: 'adv-jr', papel: 'operator' };
  const socio = { tenantId: 'A', userId: 'adv-sr', papel: 'tenant_admin' };
  const PROC = { advogados: [{ id: 'adv-sr', oab: 'SP 000001', cpf: CPF }] };
  const ANEXOS = hashAnexos({ arquivos: ['01_PESSOAIS.pdf'] });
  const minutaReq = { tesesSelecionadas: ['STF_RE_567985'], juizo: { orgao: 'JEF', subsecao: 'X' }, advogado: { nome: 'Dra. S', oab: 'SP 000001' } };
  const preparar = (servico: ServicoLoas, id: string): ItemLote => {
    servico.criarCaso(op, novoCaso(id));
    servico.calcular(op, id, { competencia: '2026-09' });
    assert.equal(servico.minuta(op, id, minutaReq).bloqueada, false);
    servico.definirProcuracao(op, id, PROC);
    servico.aprovar(socio, id, { anexosHash: ANEXOS });
    return { casoId: id, anexosHash: ANEXOS, tribunal: 'TRF3', sistema: 'PJE', arquivos: [], signatarioId: 'adv-sr' };
  };

  test('papel da sessão define alçada', () => {
    assert.equal(senioridadeDe('tenant_admin'), 'SOCIO');
    assert.equal(senioridadeDe('operator'), 'JUNIOR');
    assert.equal(senioridadeDe(undefined), 'ESTAGIARIO');
  });

  test('captura → cálculo → minuta → procuração → aprovação → lote → protocolo → SSE → webhook', async () => {
    const { servico, repo, eventos } = montar();
    const item = preparar(servico, 'c1');
    const lote = servico.criarLote(op, { itens: [item] });
    await ate(() => servico.obterLote(op, lote.loteId).itens[0].status !== 'PENDENTE');
    const st = servico.obterLote(op, lote.loteId).itens[0];
    assert.equal(st.status, 'PROTOCOLADO', st.erro);
    const reg = servico.obter(op, 'c1');
    assert.equal(reg.estagio, 'ENTREGA'); assert.equal(reg.numeroProcesso, st.numeroProcesso);
    servico.despacharOutbox();
    assert.match(eventos.join(''), /event: protocolo\.concluido/);
    assert.equal(repo.painel('A').protocolados, 1);
    const evt = { eventId: 'e-1', tipo: 'pericia.agendada', numeroProcesso: st.numeroProcesso, dados: { data: '2026-11-10' } };
    assert.deepEqual(servico.receberEventoTribunal(evt), { aceito: true });
    assert.deepEqual(servico.receberEventoTribunal(evt), { aceito: true, duplicado: true });
    assert.throws(() => servico.criarLote(op, { itens: [item] }), /já protocolado/);
  });

  test('júnior não aprova; responsável não aprova o próprio caso', () => {
    const { servico } = montar();
    servico.criarCaso(socio, novoCaso('c5'));
    servico.calcular(socio, 'c5', { competencia: '2026-09' });
    servico.minuta(socio, 'c5', minutaReq);
    assert.throws(() => servico.aprovar(op, 'c5', { anexosHash: ANEXOS }), (e: unknown) => (e as { httpStatus: number }).httpStatus === 403);
    assert.throws(() => servico.aprovar(socio, 'c5', { anexosHash: ANEXOS }), /Quem preparou/);
  });

  test('aprovação enviada pelo cliente é ignorada: sem aprovação do servidor o lote é recusado', () => {
    const { servico } = montar();
    servico.criarCaso(op, novoCaso('c6'));
    servico.calcular(op, 'c6', { competencia: '2026-09' });
    const m = servico.minuta(op, 'c6', minutaReq);
    servico.definirProcuracao(op, 'c6', PROC);
    const forjada = aprovar({ casoId: 'c6', tenantId: 'A', preparadoPor: { id: 'adv-jr', tenantId: 'A', senioridade: 'JUNIOR' }, aprovador: { id: 'fake', tenantId: 'A', senioridade: 'SOCIO' }, minuta: m, anexosHash: ANEXOS });
    assert.throws(() => servico.criarLote(op, { itens: [{ casoId: 'c6', anexosHash: ANEXOS, tribunal: 'TRF3', sistema: 'PJE', arquivos: [], signatarioId: 'adv-sr', aprovacao: forjada } as unknown as ItemLote] }), /sem aprovação válida/);
  });

  test('lote recusa: anexos diferentes do aprovado, signatário fora da procuração, outro tenant, repetido; nova minuta invalida aprovação', () => {
    const { servico } = montar();
    const item = preparar(servico, 'c2');
    assert.throws(() => servico.criarLote(op, { itens: [{ ...item, anexosHash: 'f'.repeat(64) }] }), /sem aprovação válida/);
    assert.throws(() => servico.criarLote(op, { itens: [{ ...item, signatarioId: 'escritorio' }] }), /procuração/);
    assert.throws(() => servico.criarLote({ tenantId: 'B', userId: 'x' }, { itens: [item] }), /não encontrado/);
    assert.throws(() => servico.criarLote(op, { itens: [item, item] }), /repetido/);
    assert.throws(() => servico.criarLote(op, { itens: [] }), (e: unknown) => e instanceof ErroValidacao);
    servico.minuta(op, 'c2', { ...minutaReq, trechosLivres: ['Texto novo sem citação.'] });
    assert.throws(() => servico.criarLote(op, { itens: [item] }), /sem aprovação válida/);
  });

  test('procuração: só responsável ou sócio; CPF validado', () => {
    const { servico } = montar();
    servico.criarCaso(op, novoCaso('c7'));
    assert.throws(() => servico.definirProcuracao({ tenantId: 'A', userId: 'outro', papel: 'operator' }, 'c7', PROC), /responsável/);
    assert.throws(() => servico.definirProcuracao(op, 'c7', { advogados: [{ id: 'x', oab: 'y', cpf: '123' }] }), (e: unknown) => e instanceof ErroValidacao);
  });

  test('minuta exige cálculo; falha do tribunal marca FALHA sem travar', async () => {
    const { servico } = montar({ taxaFalha: 1 });
    servico.criarCaso(op, novoCaso('c3'));
    assert.throws(() => servico.minuta(op, 'c3', minutaReq), /Calcule/);
    const item = preparar(servico, 'c4');
    const lote = servico.criarLote(op, { itens: [item] });
    await ate(() => lote.itens[0].status !== 'PENDENTE');
    assert.equal(lote.itens[0].status, 'FALHA');
  });
});
