/**
 * Testes das 6 ferramentas enterprise. Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/*.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';

import { canonicalize } from '../canonicalJson.ts';
import { sha256Hex, hashCanonical, chainEntry, verifyChain, rehashChain, verifyDocumentHash } from '../../server/enterprise/hash.ts';
import { NormaRegistry, NORMAS_SEED, extrairCitacoes } from '../normaRef.ts';
import { atualizarIndebitoSelic, atualizarJudicialEc113, ncmMonofasico, formatBRL, type TaxaMensalTabela } from '../deterministicEngine.ts';
import { verificarTexto, parseBRLToCentavos } from '../guardrail.ts';
import { executar as executarChecks, CHECKS_RECUPERACAO, CHECKS_PRECATORIO, exposicaoMulta, classificar } from '../riskShield.ts';
import { aprovar, criarPorAgente, registrarRevisao, transicionar, executar as executarWork, elegivelLote, devolver, TransicaoInvalida, AprovacaoNegada, type WorkItem, type Aprovador } from '../hitl.ts';
import { scoreLiquidacao, backtest, precificarCessao, estatisticaAgregada, taxaNaCurva } from '../jurimetria.ts';
import { redigir, reidratar, validarPoliticaBoot, provedorPermitido } from '../zdr.ts';
import { TenantKeyring, LocalKeyWrapper } from '../../server/enterprise/envelopeCrypto.ts';
import { CATALOGO_CONECTORES, saudeConector, proximaTentativa, jobKey, TokenBucket } from '../connect.ts';
import { selarLaudo, respostaVerificacao } from '../../server/enterprise/laudoSeal.ts';

const normas = new NormaRegistry(NORMAS_SEED);
const nodeSha = (s: string | Buffer) => createHash('sha256').update(s).digest('hex');

// ───────── P10 · hash UTF-8 + JCS ─────────
describe('Hash SHA-256 (P10)', () => {
  test('vetores NIST', async () => {
    assert.equal(await sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.equal(await sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });
  test('UTF-8 (ç ã é — emoji) igual ao node:crypto', async () => {
    for (const s of ['Recuperação tributária — ICMS', 'Perícia judicial nº 123 · São João', 'ação 💼📄', 'ÀÉÎÕÜ ñ ß 中文']) {
      assert.equal(await sha256Hex(s), nodeSha(Buffer.from(s, 'utf8')));
    }
  });
  test('JCS: ordem de chaves não altera hash', async () => {
    assert.equal(canonicalize({ b: 1, a: [true, null, 'ç'] }), '{"a":[true,null,"ç"],"b":1}');
    assert.equal(await hashCanonical({ x: 1, y: { b: 2, a: 1 } }), await hashCanonical({ y: { a: 1, b: 2 }, x: 1 }));
    assert.throws(() => canonicalize(NaN));
  });
  test('cadeia do ledger detecta adulteração e rehash gera mapa antigo→novo', async () => {
    const e0 = await chainEntry(null, { tenantId: 't1', tipo: 'laudo.emitido', ator: 'u1', payload: { v: 1 }, criadoEm: '2026-09-01T00:00:00Z' });
    const e1 = await chainEntry(e0, { tenantId: 't1', tipo: 'split.executado', ator: 'sys', payload: { v: 2 }, criadoEm: '2026-09-02T00:00:00Z' });
    assert.deepEqual(await verifyChain([e0, e1]), { ok: true });
    assert.deepEqual(await verifyChain([e0, { ...e1, payload: { v: 3 } }]), { ok: false, brokenAt: 1 });
    const { entries, mapping } = await rehashChain([{ ...e0, hash: '0xlegado0' }, { ...e1, hash: '0xlegado1' }]);
    assert.equal(mapping[0].oldHash, '0xlegado0');
    assert.equal(mapping[1].newHash, e1.hash);
    assert.deepEqual(await verifyChain(entries), { ok: true });
  });
});

// ───────── Ferramenta 2 · motor determinístico + guardrail ─────────
const selic: TaxaMensalTabela = { fonte: 'TESTE (valores fictícios)', versao: 't1', taxas: { '2024-01': 0.97, '2024-02': 0.80, '2024-03': 0.83, '2024-04': 0.89, '2024-05': 0.83, '2024-06': 0.79 } };

describe('Motor determinístico', () => {
  test('indébito: SELIC do mês seguinte ao pagamento até o anterior à compensação + 1%', () => {
    const r = atualizarIndebitoSelic(1_000_000, '2024-01', '2024-05', selic);
    assert.deepEqual(r.memoria.map((m) => m.competencia), ['2024-02', '2024-03', '2024-04', '2024-05']);
    assert.equal(r.fatorPct, 0.80 + 0.83 + 0.89 + 1);
    assert.equal(r.jurosCentavos, Math.round(1_000_000 * 3.52 / 100));
    assert.equal(r.totalCentavos, 1_035_200);
  });
  test('taxa ausente → erro explícito (nunca inventa)', () => {
    assert.throws(() => atualizarIndebitoSelic(100, '2024-01', '2024-09', selic), /Taxa ausente/);
  });
  test('EC 113: período antes de 12/2021 exige fator do regime anterior', () => {
    assert.throws(() => atualizarJudicialEc113(100_000, '2021-06', '2024-02', selic), /regime anterior/);
    const r = atualizarJudicialEc113(100_000, '2024-01', '2024-02', selic);
    assert.equal(r.fatorPct, 1.77);
  });
  test('NCM monofásico por vigência', () => {
    const regras = [{ ncmPrefixo: '3303', vigenciaInicio: '2020-01-01', normaId: 'LEI:10147:2000' }];
    assert.ok(ncmMonofasico('3303.00.10', '2023-05-01', regras));
    assert.equal(ncmMonofasico('3303.00.10', '2019-05-01', regras), null);
    assert.equal(formatBRL(1_035_200), 'R$ 10.352,00');
  });
});

describe('Guardrail anti-alucinação', () => {
  test('texto com valores e citações rastreáveis → APROVADO', () => {
    const txt = 'Com base na Lei nº 9.250/1995 e no CTN, o crédito atualizado é de R$ 10.352,00, com multa de ofício de 75% (Lei 9.430/96).';
    const r = verificarTexto(txt, { centavos: [1_035_200] }, normas, '2026-09-27');
    assert.equal(r.status, 'APROVADO', JSON.stringify(r));
  });
  test('valor inventado pelo LLM, norma inexistente e multa de 50% → BLOQUEADO', () => {
    const txt = 'Crédito de R$ 12.000,00 conforme Solução de Consulta COSIT nº 999/2025, com multa isolada de 50%.';
    const r = verificarTexto(txt, { centavos: [1_035_200] }, normas, '2026-09-27');
    assert.equal(r.status, 'BLOQUEADO');
    assert.deepEqual(r.valoresNaoRastreados, ['R$ 12.000,00']);
    assert.equal(r.citacoesDesconhecidas.length, 1);
    assert.deepEqual(r.percentuaisNaoRastreados, ['50%']);
  });
  test('extração de citações', () => {
    const keys = extrairCitacoes('Tema 736 do STF; IN RFB nº 2.055/2021; EC 113/2021; Lei Complementar 123/2006').map((c) => c.key);
    assert.deepEqual(keys.sort(), ['EC:113:2021', 'IN_RFB:2055:2021', 'LC:123:2006', 'TEMA_STF:736'].sort());
    assert.equal(parseBRLToCentavos('R$ 1.234,5'), 123_450);
  });
});

// ───────── Ferramenta 3 · Shield de risco ─────────
describe('Shield de Risco (P14)', () => {
  const ctx = { normas, hoje: '2026-09-27' };
  test('sem dados → NAO_AVALIADO, nunca GREEN', () => {
    const r = executarChecks(CHECKS_RECUPERACAO, { creditos: [{ id: 'c1', tributo: 'PIS', competencia: '2024-01', valorCentavos: 100 }], dataPedido: '2026-09-27' }, ctx);
    assert.equal(r.flag, 'NAO_AVALIADO');
    assert.ok(r.achados.every((a) => a.resultado.status === 'NAO_VERIFICADO'));
  });
  test('prescrição (CTN art. 168) → RED', () => {
    const r = executarChecks(CHECKS_RECUPERACAO, { creditos: [{ id: 'c1', tributo: 'PIS', competencia: '2020-01', dataPagamento: '2020-02-20', valorCentavos: 100 }], dataPedido: '2026-09-27' }, ctx);
    assert.equal(r.flag, 'RED');
    assert.equal(r.achados.find((a) => a.checkId === 'RT-001-prescricao')!.resultado.status, 'FALHA');
  });
  test('divergência SPED × DCTF → YELLOW; conciliado → GREEN', () => {
    const base = { id: 'c1', tributo: 'COFINS', competencia: '2025-03', dataPagamento: '2025-04-20', valorCentavos: 500 };
    assert.equal(executarChecks(CHECKS_RECUPERACAO, { creditos: [{ ...base, spedValorCentavos: 500, dctfValorCentavos: 450 }], dataPedido: '2026-09-27' }, ctx).flag, 'YELLOW');
    assert.equal(executarChecks(CHECKS_RECUPERACAO, { creditos: [{ ...base, spedValorCentavos: 500, dctfValorCentavos: 500 }], dataPedido: '2026-09-27' }, ctx).flag, 'GREEN');
  });
  test('duplicidade PER/DCOMP, NCM fora da lista, débito vedado, tese sem norma → RED', () => {
    const c = { id: 'c9', tributo: 'PIS', competencia: '2025-01', dataPagamento: '2025-02-20', valorCentavos: 1 };
    const run = (extra: object, extraCtx: object = {}) => executarChecks(CHECKS_RECUPERACAO, { creditos: [{ ...c, ...extra }], dataPedido: '2026-09-27', ...extraCtx }, ctx).flag;
    assert.equal(run({ perdcompAnteriores: [{ numero: 'PD-1', creditoId: 'c9' }] }), 'RED');
    assert.equal(run({ ncm: '2202.10.00', dataFatoGerador: '2025-01-10' }, { regrasMonofasico: [{ ncmPrefixo: '3303', vigenciaInicio: '2020-01-01', normaId: 'x' }] }), 'RED');
    assert.equal(run({ debitoCompensar: { codigoReceita: '1234' } }, { codigosReceitaVedados: ['1234'] }), 'RED');
    assert.equal(run({ tese: { normaRefId: 'TEMA_STF:99999' } }), 'RED');
  });
  test('multas vêm da NormaRef; Tema 736 excluído', () => {
    const m = exposicaoMulta(100_000, normas);
    assert.equal(m.pct, 75);
    assert.equal(m.multaCentavos, 75_000);
    assert.equal(exposicaoMulta(100_000, normas, true, true).pct, 150);
    assert.match(m.excluidas[0], /Tema 736/);
  });
  test('precatório: fonte indisponível → não verificado; cessão anterior → RED', () => {
    assert.equal(executarChecks(CHECKS_PRECATORIO, {}, ctx).flag, 'NAO_AVALIADO');
    assert.equal(executarChecks(CHECKS_PRECATORIO, { cessoesRegistradas: [{ cessionario: 'X', data: '2024-01-01' }], penhoras: [] }, ctx).flag, 'RED');
    assert.equal(classificar([]), 'NAO_AVALIADO');
  });
});

// ───────── Ferramenta 6 · HITL ─────────
describe('Human-in-the-Loop (P12)', () => {
  const agora = new Date('2026-09-27T12:00:00Z');
  const base = (over: Partial<WorkItem> = {}): WorkItem => ({
    ...criarPorAgente('Fiscal', { id: 'w1', tenantId: 't1', esteira: 'RECUPERACAO_TRIBUTARIA', tipo: 'GERAR_LAUDO_FINAL', payloadHash: 'h1', riscoFlag: 'GREEN', valorEnvolvidoCentavos: 10_000, idempotencyKey: 'k1', status: 'READY_FOR_REVIEW' }),
    ...over,
  });
  const ap = (id: string, over: Partial<Aprovador> = {}): Aprovador => ({ userId: id, permissoes: ['approve:RECUPERACAO_TRIBUTARIA'], registroProfissional: { conselho: 'OAB', numero: 'SP123' }, ultimoStepUpEm: '2026-09-27T11:58:00Z', ...over });

  test('agente não cria item APPROVED nem aprova', () => {
    assert.throws(() => criarPorAgente('Liquidez', { id: 'x', tenantId: 't', esteira: 'PRECATORIA', tipo: 'GERAR_LAUDO_FINAL', payloadHash: 'h', riscoFlag: 'GREEN', valorEnvolvidoCentavos: 1, idempotencyKey: 'k', status: 'APPROVED' }), AprovacaoNegada);
    assert.throws(() => aprovar(base(), ap('bot', { isAgente: true }), 'h1', agora), AprovacaoNegada);
  });
  test('máquina de estados: transição inválida → 409', () => {
    try { transicionar(base({ status: 'DRAFT' }), 'DONE'); assert.fail(); } catch (e) { assert.ok(e instanceof TransicaoInvalida); assert.equal((e as TransicaoInvalida).httpStatus, 409); }
  });
  test('aprovação simples OK', () => {
    assert.equal(aprovar(registrarRevisao(base(), 'u1', 'h1'), ap('u1'), 'h1', agora).status, 'APPROVED');
  });
  test('step-up expirado, sem registro, sem permissão, payload alterado → negado', () => {
    assert.throws(() => aprovar(base(), ap('u1', { ultimoStepUpEm: '2026-09-27T11:50:00Z' }), 'h1', agora), /step-up/);
    assert.throws(() => aprovar(base(), ap('u1', { registroProfissional: undefined }), 'h1', agora), /registro/);
    assert.throws(() => aprovar(base(), ap('u1', { permissoes: [] }), 'h1', agora), /permissão/);
    assert.throws(() => aprovar(base({ payloadHash: 'h2' }), ap('u1'), 'h1', agora), /payload alterado/);
  });
  test('4 olhos: RED exige segunda pessoa', () => {
    const w1 = aprovar(base({ riscoFlag: 'RED' }), ap('u1'), 'h1', agora);
    assert.equal(w1.status, 'READY_FOR_REVIEW');
    assert.throws(() => aprovar(w1, ap('u1'), 'h1', agora), /outra pessoa/);
    assert.equal(aprovar(w1, ap('u2'), 'h1', agora).status, 'APPROVED');
    assert.equal(elegivelLote(base({ riscoFlag: 'RED' })), false);
  });
  test('execução idempotente: mesma chave não executa duas vezes', async () => {
    const store = new Map<string, unknown>();
    let chamadas = 0;
    const action = { tipo: 'GERAR_LAUDO_FINAL' as const, validate() {}, async execute() { chamadas++; return { ok: true }; } };
    const approved = aprovar(base(), ap('u1'), 'h1', agora);
    const r1 = await executarWork(approved, action, store);
    const r2 = await executarWork(approved, action, store);
    assert.equal(r1.item.status, 'DONE');
    assert.equal(r2.reutilizado, true);
    assert.equal(chamadas, 1);
  });
  test('devolver exige comentário e limpa aprovações', () => {
    assert.throws(() => devolver(base(), '  '));
    assert.equal(devolver(base(), 'rever competência 03/2025').status, 'DRAFT');
  });
});

// ───────── Ferramenta 4 · Jurimetria ─────────
describe('Jurimetria (P16)', () => {
  const hist = (n: number) => Array.from({ length: n }, (_, i) => ({ inscricao: '2020-07-01', pagamento: new Date(Date.parse('2021-06-01') + i * 10 * 86_400_000).toISOString().slice(0, 10) }));
  test('n < 30 → dados insuficientes', () => {
    const r = scoreLiquidacao(hist(29), '2026-07-01', '2026-09-27');
    assert.equal(r.status, 'DADOS_INSUFICIENTES');
    assert.equal(r.n, 29);
  });
  test('n ≥ 30 → P10 ≤ P50 ≤ P90, reprodutível', () => {
    const r = scoreLiquidacao(hist(60), '2026-07-01', '2026-09-27');
    assert.equal(r.status, 'OK');
    if (r.status === 'OK') {
      assert.ok(r.valor.p10 <= r.valor.p50 && r.valor.p50 <= r.valor.p90);
      assert.deepEqual(r, scoreLiquidacao(hist(60), '2026-07-01', '2026-09-27'));
    }
  });
  test('backtest roda e reporta MAE', () => {
    const b = backtest([...hist(40), { inscricao: '2021-01-01', pagamento: '2026-01-01' }], '2025-12-31');
    assert.equal(b.n, 1);
    assert.equal(typeof b.maeDias, 'number');
  });
  test('VPL: prazo maior → valor menor; proposta é rascunho', () => {
    const curva = { fonte: 'ETTJ ANBIMA (teste)', data: '2026-09-26', pontos: [{ anos: 0.5, taxaAa: 10 }, { anos: 5, taxaAa: 12 }] };
    assert.equal(taxaNaCurva(curva, 2.75), 11);
    const p = precificarCessao(100_000_00, { p10: '2027-06-01', p50: '2028-06-01', p90: '2029-06-01' }, '2026-09-27', curva, { desagioPct: 10, premioRiscoPct: 2 });
    assert.ok(p.faixa.otimista > p.faixa.central && p.faixa.central > p.faixa.conservador);
    assert.equal(p.status, 'RASCUNHO');
  });
  test('estatística agregada exige n ≥ 30 e traz aviso', () => {
    const r = estatisticaAgregada([{ vara: 'V1', classe: 'C', assunto: 'A', duracaoDias: 100 }], { vara: 'V1' }, '2026-09-27');
    assert.equal(r.status, 'DADOS_INSUFICIENTES');
    assert.match(r.aviso, /não é previsão/);
  });
});

// ───────── Ferramenta 5 · ZDR, criptografia, selo ─────────
describe('ZDR & segurança (P13)', () => {
  test('produção sem LLM_TIER pago → não sobe', () => {
    assert.throws(() => validarPoliticaBoot({ NODE_ENV: 'production' }));
    assert.throws(() => validarPoliticaBoot({ NODE_ENV: 'production', LLM_TIER: 'free' }));
    assert.doesNotThrow(() => validarPoliticaBoot({ NODE_ENV: 'production', LLM_TIER: 'vertex' }));
    assert.equal(provedorPermitido({ nodeEnv: 'development', llmTier: 'free', tenantSomenteLocal: false }).alegacaoZdrPermitida, false);
    assert.equal(provedorPermitido({ nodeEnv: 'production', llmTier: 'free', tenantSomenteLocal: true }).provedor, 'local');
  });
  test('redação de PII reversível; CPF inválido não é redigido', () => {
    const src = 'Cliente Maria Souza, CPF 529.982.247-25, CNPJ 11.222.333/0001-81, e-mail maria@ex.com.br, processo 0001234-56.2024.8.26.0100. Ref 111.111.111-11.';
    const r = redigir(src, ['Maria Souza']);
    for (const pii of ['529.982.247-25', '11.222.333/0001-81', 'maria@ex.com.br', '0001234-56.2024.8.26.0100', 'Maria Souza']) assert.ok(!r.texto.includes(pii), pii);
    assert.ok(r.texto.includes('111.111.111-11'));
    assert.equal(reidratar(r.texto, r.mapa), src);
  });
  test('AES-256-GCM por tenant: cross-tenant falha; rotação preserva dados', async () => {
    const kr = new TenantKeyring(new LocalKeyWrapper());
    const c = await kr.encrypt('t1', 'senha-erp-ç');
    assert.equal(await kr.decrypt('t1', c), 'senha-erp-ç');
    await assert.rejects(kr.decrypt('t2', c));
    const c2 = await kr.encrypt('t1', 'outro');
    assert.notEqual(c.split('.')[2], c2.split('.')[2]); // nonce único
    const [r1] = await kr.rotacionar('t1', [c]);
    assert.equal(kr.versaoDe(r1), 2);
    assert.equal(await kr.decrypt('t1', r1), 'senha-erp-ç');
    assert.equal(await kr.decrypt('t1', c), 'senha-erp-ç'); // versão antiga ainda legível durante re-encrypt
  });
  test('selo: sem ACT → sem carimbo; 1 byte alterado → verificação falha', async () => {
    const pdf = randomBytes(2048);
    const { selo } = await selarLaudo(pdf, { baseUrl: 'https://app.velatrix/' });
    assert.equal(selo.carimbo.status, 'SEM_CARIMBO_DO_TEMPO');
    assert.equal(selo.hashSha256, nodeSha(pdf));
    assert.equal((await respostaVerificacao(selo, pdf)).integro, true);
    const adulterado = Buffer.from(pdf); adulterado[100] ^= 0x01;
    assert.equal(await verifyDocumentHash(adulterado, selo.hashSha256), false);
    assert.equal((await respostaVerificacao(selo, adulterado)).integro, false);
  });
});

// ───────── Ferramenta 1 · Connect ─────────
describe('Velatrix Connect (P15)', () => {
  test('sem credencial → Não configurado; PER/DCOMP e DET → não suportado', () => {
    const serpro = CATALOGO_CONECTORES.find((c) => c.id === 'serpro-integra-contador')!;
    assert.equal(saudeConector(serpro, { temCredencial: false }).detalhe, 'Não configurado');
    assert.equal(saudeConector(CATALOGO_CONECTORES.find((c) => c.id === 'perdcomp')!, { temCredencial: true }).status, 'NAO_SUPORTADO');
    assert.equal(saudeConector(CATALOGO_CONECTORES.find((c) => c.id === 'datajud')!, { temCredencial: false }).status, 'OK');
    assert.ok(CATALOGO_CONECTORES.filter((c) => c.fase === 'A' && c.suporte !== 'NAO_SUPORTADO').every((c) => c.modo === 'POLLING'));
  });
  test('retry exponencial até DLQ; idempotência; rate limit', () => {
    assert.deepEqual(proximaTentativa(0), { acao: 'RETRY', atrasoMs: 1000 });
    assert.deepEqual(proximaTentativa(3), { acao: 'RETRY', atrasoMs: 8000 });
    assert.deepEqual(proximaTentativa(8), { acao: 'DLQ' });
    assert.equal(jobKey('t1', 'nfe', '123'), jobKey('t1', 'nfe', '123'));
    const b = new TokenBucket(2, 1, 0);
    assert.equal(b.tentar(0), true); assert.equal(b.tentar(0), true); assert.equal(b.tentar(0), false); assert.equal(b.tentar(1000), true);
  });
});
