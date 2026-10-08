import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ServicoAntecipacao, ErroAntecipacao, type CtxAntecipacao } from '../servico.ts';
import { EXEMPLOS_DEMO } from '../padrao.ts';
import { ErroValidacao } from '../../loas/validacao.ts';
import { COMPRADORES_DEMO } from '../../../antecipacao/compradoresDemo.ts';
import { CHECKLIST_FORMALIZACAO, validarCpf, validarCnpj, validarNumeroCnj } from '../../../antecipacao/motor.ts';

const HOJE = new Date('2026-10-01T12:00:00Z');
const sm = (c: string) => { if (c.startsWith('2026')) return 162_100; throw new Error('sem SM'); };
const novo = (o: Partial<ConstructorParameters<typeof ServicoAntecipacao>[0]> = {}) =>
  new ServicoAntecipacao({ compradores: () => COMPRADORES_DEMO, salarioMinimo: sm, agora: () => HOJE, permitirPagamentoManual: true, ...o });
const adv: CtxAntecipacao = { tenantId: 't1', userId: 'adv1', papel: 'operator' };
const socio: CtxAntecipacao = { tenantId: 't1', userId: 'socio1', papel: 'tenant_admin' };
const ex = () => EXEMPLOS_DEMO('2026-10-01') as Array<Record<string, unknown>>;

function ateAceite(s: ServicoAntecipacao, idx = 0) {
  let r = s.cadastrar(adv, ex()[idx]);
  r = s.escolherOferta(adv, r.credito.id, r.ofertas.melhorOfertaId);
  r = s.aprovar(socio, r.credito.id, r.propostaHash);
  return s.registrarAceite(adv, r.credito.id, { canal: 'ASSINATURA_ELETRONICA', hashApresentado: r.propostaHash });
}

describe('exemplos demo', () => {
  test('dados fictícios válidos e com flags variadas (GREEN, YELLOW, RED)', () => {
    for (const e of ex()) {
      assert.equal(validarNumeroCnj(e.numeroProcesso as string).valido, true);
      const d = (e.credor as { documento: string }).documento;
      assert.ok(d.length === 11 ? validarCpf(d) : validarCnpj(d), d);
    }
    const s = novo();
    const flags = ex().map((e) => s.cadastrar(adv, e).analise.flag);
    assert.deepEqual(flags, ['GREEN', 'GREEN', 'YELLOW', 'RED']);
  });
});

describe('ciclo completo', () => {
  test('cadastro → escolha → aprovação → aceite → checklist → pagamento', () => {
    const s = novo();
    let r = ateAceite(s);
    assert.equal(r.status, 'ACEITO_CLIENTE');
    for (const it of CHECKLIST_FORMALIZACAO) r = s.marcarChecklist(adv, r.credito.id, { item: it.id, evidencia: 'protocolo 123' });
    assert.equal(r.status, 'FORMALIZACAO');
    const total = r.ofertas.ofertas.find((o) => o.id === r.ofertaEscolhidaId)!.totalOfertaCentavos;
    r = s.confirmarPagamento('t1', r.credito.id, { comprovante: 'pix:E123456', valorCentavos: total }, 'DEMO', 'adv1');
    assert.equal(r.status, 'PAGO');
    assert.deepEqual(r.eventos.map((e) => e.tipo).filter((t) => t !== 'CHECKLIST'), ['CADASTRADO', 'OFERTA_ESCOLHIDA', 'APROVADO_INTERNO', 'ACEITE_CLIENTE', 'PAGO']);
    // reentrega do webhook com o mesmo comprovante é idempotente
    assert.equal(s.confirmarPagamento('t1', r.credito.id, { comprovante: 'pix:E123456', valorCentavos: total }, 'COMPRADOR', 'x').status, 'PAGO');
    assert.equal(s.painel(adv).pagoCentavos, total);
  });
  test('pagamento exige checklist completo e valor exato da oferta', () => {
    const s = novo();
    let r = ateAceite(s);
    r = s.marcarChecklist(adv, r.credito.id, { item: 'KYC_CEDENTE', evidencia: 'kyc ok' });
    assert.throws(() => s.confirmarPagamento('t1', r.credito.id, { comprovante: 'pix:1', valorCentavos: 1 }, 'DEMO', 'a'), /COMUNICACAO_TRIBUNAL/);
    for (const it of CHECKLIST_FORMALIZACAO) s.marcarChecklist(adv, r.credito.id, { item: it.id, evidencia: 'ok ok' });
    assert.throws(() => s.confirmarPagamento('t1', r.credito.id, { comprovante: 'pix:1', valorCentavos: 1 }, 'DEMO', 'a'), (e: unknown) => (e as ErroAntecipacao).httpStatus === 422);
  });
  test('pagamento manual bloqueado fora do DEMO', () => {
    const s = novo({ permitirPagamentoManual: false });
    const r = ateAceite(s);
    assert.throws(() => s.confirmarPagamento('t1', r.credito.id, {}, 'DEMO', 'a'), (e: unknown) => (e as ErroAntecipacao).httpStatus === 403);
  });
});

describe('controles', () => {
  test('aprovação: só perfil aprovador e sobre o hash atual', () => {
    const s = novo();
    let r = s.cadastrar(adv, ex()[0]);
    r = s.escolherOferta(adv, r.credito.id, r.ofertas.melhorOfertaId);
    assert.throws(() => s.aprovar(adv, r.credito.id, r.propostaHash), (e: unknown) => (e as ErroAntecipacao).httpStatus === 403);
    assert.throws(() => s.aprovar(socio, r.credito.id, 'x'.repeat(64)), (e: unknown) => (e as ErroAntecipacao).httpStatus === 409);
  });
  test('quatro olhos acima do limite: quem escolheu não aprova', () => {
    const s = novo({ quatroOlhos: true, limiteQuatroOlhosCentavos: 1 });
    let r = s.cadastrar(socio, ex()[0]);
    r = s.escolherOferta(socio, r.credito.id, r.ofertas.melhorOfertaId);
    assert.throws(() => s.aprovar(socio, r.credito.id, r.propostaHash), /quatro olhos/);
    assert.equal(s.aprovar({ ...socio, userId: 'socio2' }, r.credito.id, r.propostaHash).status, 'APROVADO_INTERNO');
  });
  test('aceite de versão diferente é recusado; reanálise invalida aprovação', () => {
    const s = novo();
    let r = s.cadastrar(adv, ex()[0]);
    r = s.escolherOferta(adv, r.credito.id, r.ofertas.melhorOfertaId);
    r = s.aprovar(socio, r.credito.id, r.propostaHash);
    assert.throws(() => s.registrarAceite(adv, r.credito.id, { canal: 'EMAIL', hashApresentado: 'outro' }), /versão diferente/);
    r = s.reanalisar(adv, r.credito.id, { valorFaceCentavos: 40_000_000 });
    assert.equal(r.status, 'ANALISADO');
    assert.equal(r.propostaHash, undefined);
    assert.throws(() => s.registrarAceite(adv, r.credito.id, { canal: 'EMAIL', hashApresentado: 'x' }), /ANALISADO → ACEITO_CLIENTE/);
  });
  test('crédito RED fica BLOQUEADO sem ofertas; não dá para escolher', () => {
    const s = novo();
    const r = s.cadastrar(adv, ex()[3]);
    assert.equal(r.status, 'BLOQUEADO');
    assert.equal(r.ofertas.ofertas.length, 0);
    assert.throws(() => s.escolherOferta(adv, r.credito.id, 'qualquer'), /BLOQUEADO → OFERTA_ESCOLHIDA/);
  });
  test('oferta expirada → 410', () => {
    let agora = HOJE;
    const s = novo({ agora: () => agora });
    const r = s.cadastrar(adv, ex()[0]);
    agora = new Date('2026-12-01T00:00:00Z');
    assert.throws(() => s.escolherOferta(adv, r.credito.id, r.ofertas.melhorOfertaId), (e: unknown) => (e as ErroAntecipacao).httpStatus === 410);
  });
  test('isolamento por escritório e duplicidade', () => {
    const s = novo();
    const r = s.cadastrar(adv, ex()[0]);
    assert.throws(() => s.obter({ tenantId: 't2', userId: 'x' }, r.credito.id), (e: unknown) => (e as ErroAntecipacao).httpStatus === 404);
    assert.throws(() => s.cadastrar(adv, ex()[0]), (e: unknown) => (e as ErroAntecipacao).httpStatus === 409);
    assert.equal(s.cadastrar({ tenantId: 't2', userId: 'y' }, ex()[0]).status, 'ANALISADO');
  });
  test('validação: dinheiro em float, CNJ curto e parcelas vazias são recusados', () => {
    const s = novo();
    assert.throws(() => s.cadastrar(adv, { ...ex()[0], valorFaceCentavos: 1234.5, numeroProcesso: '123', parcelasParaAntecipar: [] }), (e: unknown) => {
      const campos = (e as ErroValidacao).errors.map((x) => x.campo);
      return e instanceof ErroValidacao && ['valorFaceCentavos', 'numeroProcesso', 'parcelasParaAntecipar'].every((c) => campos.includes(c));
    });
  });
  test('tenantId do corpo é ignorado (vem da sessão)', () => {
    const s = novo();
    const r = s.cadastrar(adv, { ...ex()[1], tenantId: 'invasor', advogadoId: 'x' });
    assert.equal(r.credito.tenantId, 't1');
    assert.equal(r.credito.advogadoId, 'adv1');
  });
  test('data-base sem salário mínimo cadastrado → 422 claro', () => {
    const s = novo();
    assert.throws(() => s.cadastrar(adv, { ...ex()[0], dataBase: '2019-01-01' }), (e: unknown) => (e as ErroAntecipacao).httpStatus === 422);
  });
});
