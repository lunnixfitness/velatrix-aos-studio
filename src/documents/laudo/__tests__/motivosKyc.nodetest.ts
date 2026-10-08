import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { motivosKycPendente, motivoDocumentoCedente, detalharPendencias, PENDENCIA_KYC_GENERICA, PENDENCIA_DOC_GENERICA } from '../motivosKyc.ts';

const HOJE = '2026-10-01';
const base = { kyc: null, declaracaoAnexada: true, comprovanteAnexado: true, comprovanteEmissao: '2026-09-15', hoje: HOJE };
const reprovado = { aprovado: false, pepIdentificado: false, provaDeVidaStatus: 'VERIFICADO_SERPRO' as const };

describe('motivos do KYC', () => {
  test('comprovante com mais de 90 dias diz a data e a idade', () => {
    const m = motivosKycPendente({ ...base, comprovanteEmissao: '2022-02-12', kyc: reprovado });
    assert.equal(m.length, 1);
    assert.match(m[0], /12\/02\/2022/);
    assert.match(m[0], /1692 dias/);
    assert.match(m[0], /limite é 90 dias/);
  });
  test('exatamente 90 dias ainda vale', () => {
    assert.deepEqual(motivosKycPendente({ ...base, comprovanteEmissao: '2026-07-03', kyc: { ...reprovado, pepIdentificado: true } }).length, 1);
    assert.doesNotMatch(motivosKycPendente({ ...base, comprovanteEmissao: '2026-07-03', kyc: { ...reprovado, pepIdentificado: true } })[0], /comprovante/);
  });
  test('documentos faltando vêm antes, um por linha', () => {
    const m = motivosKycPendente({ ...base, declaracaoAnexada: false, comprovanteAnexado: false });
    assert.deepEqual(m, ['KYC: anexe a declaração de origem lícita assinada pelo cedente.', 'KYC: anexe o comprovante de endereço do cedente.']);
    assert.match(motivosKycPendente({ ...base, comprovanteEmissao: '' })[0], /data de emissão/);
    assert.match(motivosKycPendente({ ...base, comprovanteEmissao: '2027-01-01' })[0], /no futuro/);
  });
  test('documentos ok e reprovado: motivo do provedor (PEP, prova de vida) ou genérico', () => {
    assert.match(motivosKycPendente({ ...base, kyc: { ...reprovado, pepIdentificado: true } })[0], /PEP/);
    assert.match(motivosKycPendente({ ...base, kyc: { ...reprovado, provaDeVidaStatus: 'FALHA' } })[0], /prova de vida falhou/);
    assert.match(motivosKycPendente({ ...base, kyc: reprovado })[0], /relatório de compliance/);
  });
  test('aprovado → nenhum motivo; KYC ainda não rodou e docs ok → nada a inventar', () => {
    assert.deepEqual(motivosKycPendente({ ...base, kyc: { ...reprovado, aprovado: true }, comprovanteEmissao: '2020-01-01' }), []);
    assert.deepEqual(motivosKycPendente(base), []);
  });
});

describe('documento do cedente', () => {
  test('vazio, tamanho errado, DV inválido, válido', () => {
    assert.match(motivoDocumentoCedente('', '123.***.***-00')!, /máscara 123\.\*\*\*/);
    assert.match(motivoDocumentoCedente('1234', 'x')!, /4 dígitos/);
    assert.match(motivoDocumentoCedente('123.456.789-00', 'x')!, /CPF 12345678900 com dígito verificador inválido/);
    assert.equal(motivoDocumentoCedente('123.000.024-00', 'x'), null);
    assert.equal(motivoDocumentoCedente('11.222.333/0001-81', 'x'), null);
  });
});

describe('detalharPendencias', () => {
  test('substitui as genéricas no lugar e preserva as demais', () => {
    const p = ['A', PENDENCIA_DOC_GENERICA, PENDENCIA_KYC_GENERICA, 'B'];
    assert.deepEqual(detalharPendencias(p, ['k1', 'k2'], 'doc'), ['A', 'doc', 'k1', 'k2', 'B']);
    assert.deepEqual(detalharPendencias(p, [], null), p, 'sem detalhe: mantém a genérica');
    assert.deepEqual(detalharPendencias(['A'], ['k1'], null), ['A', 'k1']);
  });
});
