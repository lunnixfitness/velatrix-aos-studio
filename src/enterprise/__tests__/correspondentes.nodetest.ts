/**
 * Testes de Correspondentes & Parcerias (P23). Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/correspondentes.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarAcordo, validarCiencia, calcularDivisao, payloadSelo, ativarAcordo, encerrarAcordo, AcordoInvalido,
  type AcordoParceria, type Participante,
} from '../correspondentes.ts';

const P = (o: Partial<Participante>): Participante => ({
  id: 'p', nome: 'Dr. X', registro: 'OAB/SP 118.204', classe: 'OAB', papel: 'correspondente', percentual: 50, interno: false, ...o,
});
const base = (o: Partial<AcordoParceria> = {}): AcordoParceria => ({
  id: 'ACP-1', tenantId: 't1', titulo: 'Correspondência em Brasília', classe: 'OAB',
  participantes: [
    P({ id: 'a', nome: 'Dra. Helena', registro: 'OAB/SP 118.204', papel: 'titular', percentual: 70, interno: true }),
    P({ id: 'b', nome: 'Dr. Paulo', registro: 'OAB/DF 52.310', percentual: 30 }),
  ],
  ciencia: null, status: 'rascunho', criadoEm: '2026-09-29T12:00:00Z', criadoPor: 'Helena', selo: null, ...o,
});
const CI = { cliente: 'Alpha Construções', documento: '12.345.678/0001-95', meio: 'aditivo' as const, em: '2026-09-29T12:00:00Z' };
const SELO = 'a'.repeat(64);

describe('validação', () => {
  test('acordo válido entre advogados', () => assert.deepEqual(validarAcordo(base()), []));
  test('Velatrix nunca participa', () => {
    const a = base({ participantes: [base().participantes[0], P({ id: 'velatrix', nome: 'Velatrix Tecnologia', registro: 'OAB/SP 1.000', percentual: 30 })] });
    assert.ok(validarAcordo(a).some((e) => /Velatrix não participa/.test(e)));
  });
  test('classes não se misturam (OAB × CRC)', () => {
    const a = base({ participantes: [base().participantes[0], P({ id: 'c', nome: 'André', classe: 'CRC', registro: 'CRC/SP 1SP301442/O-7', percentual: 30 })] });
    assert.ok(validarAcordo(a).some((e) => /só é permitida entre profissionais/.test(e)));
  });
  test('soma ≠ 100, mínimo 2, titular obrigatório, registro inválido', () => {
    assert.ok(validarAcordo(base({ participantes: [base().participantes[0]] })).some((e) => /pelo menos 2/.test(e)));
    const x = base({ participantes: [P({ id: 'a', percentual: 60, registro: 'OAB/SP 1' }), P({ id: 'b', percentual: 30, registro: 'xx' })] });
    const e = validarAcordo(x);
    assert.ok(e.some((m) => /soma/.test(m)));
    assert.ok(e.some((m) => /titular/.test(m)));
    assert.ok(e.some((m) => /Registro inválido/.test(m)));
  });
  test('registro duplicado', () => {
    const a = base({ participantes: [base().participantes[0], P({ id: 'b', registro: 'oab/sp 118.204', percentual: 30 })] });
    assert.ok(validarAcordo(a).some((e) => /repetido/.test(e)));
  });
  test('ciência do cliente', () => {
    assert.equal(validarCiencia(null).length, 1);
    assert.deepEqual(validarCiencia(CI), []);
    assert.ok(validarCiencia({ ...CI, documento: '123' }).length > 0);
  });
});

describe('divisão', () => {
  test('centavos exatos e soma preservada', () => {
    const ps = [P({ id: 'a', percentual: 33.33 }), P({ id: 'b', percentual: 33.33 }), P({ id: 'c', percentual: 33.34 })];
    const d = calcularDivisao(ps, 1000.01);
    assert.equal(Math.round(d.reduce((s, x) => s + x.valorBrl, 0) * 100), 100001);
  });
  test('70/30', () => {
    assert.deepEqual(calcularDivisao(base().participantes, 10000).map((x) => x.valorBrl), [7000, 3000]);
  });
});

describe('ciclo de vida e selo', () => {
  test('payload ignora ordem e declara plataforma fora', () => {
    const a = base();
    const b = base({ participantes: [...a.participantes].reverse() });
    assert.deepEqual(payloadSelo(a), payloadSelo(b));
    assert.equal(payloadSelo(a).plataformaParticipa, false);
  });
  test('ativar exige ciência e selo; encerrar só vigente', () => {
    assert.throws(() => ativarAcordo(base(), { ...CI, documento: '1' }, SELO), AcordoInvalido);
    assert.throws(() => ativarAcordo(base(), CI, 'x'), AcordoInvalido);
    const v = ativarAcordo(base(), CI, SELO);
    assert.equal(v.status, 'vigente');
    assert.throws(() => ativarAcordo(v, CI, SELO), AcordoInvalido);
    assert.equal(encerrarAcordo(v).status, 'encerrado');
    assert.throws(() => encerrarAcordo(base()), AcordoInvalido);
  });
});
