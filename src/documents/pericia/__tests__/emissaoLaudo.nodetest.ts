/**
 *   node --experimental-strip-types --test src/documents/pericia/__tests__/emissaoLaudo.nodetest.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendenciasEmissaoLaudo, textoHonorarios, CONTEUDO_VAZIO, type EstadoEsteiraLaudo, type ConteudoPerito } from '../emissaoLaudo.ts';

const ESTADO_OK: EstadoEsteiraLaudo = {
  kind: 'judicial', cnj: '5001234-15.2026.8.26.0100', juizo: '2ª Vara Cível', camara: '', procedimento: '', clausula: '',
  estagiosPendentes: [], impugnacao: 'sem_impugnacao', depositoRegistradoEm: '2026-09-29T10:00:00Z', arquivosCustodia: 2,
};
const CONTEUDO_OK: ConteudoPerito = {
  peritoNome: 'Fulana de Tal', peritoRegistro: 'CRC-SP 123456/O-7',
  objeto: 'Apuração de haveres do sócio retirante na data-base.',
  metodologia: 'Exame do balanço especial e dos razões analíticos de 2024.',
  quesitos: [{ id: '1', origem: 'Juízo', pergunta: 'Qual o valor dos haveres?', resposta: 'R$ 100.000,00, conforme anexo 2.' }],
  conclusao: 'Os haveres do sócio retirante somam R$ 100.000,00 na data-base.',
};

test('tudo preenchido: sem pendências', () => {
  assert.deepEqual(pendenciasEmissaoLaudo(ESTADO_OK, CONTEUDO_OK), []);
});

test('conteúdo vazio bloqueia (nada é presumido)', () => {
  const p = pendenciasEmissaoLaudo(ESTADO_OK, CONTEUDO_VAZIO);
  assert.ok(p.some((x) => /nome completo/.test(x)));
  assert.ok(p.some((x) => /quesito/.test(x)));
  assert.ok(p.some((x) => /conclusão/.test(x)));
});

test('estágios pendentes, CNJ inválido, sem depósito e impugnação bloqueiam', () => {
  const p = pendenciasEmissaoLaudo(
    { ...ESTADO_OK, estagiosPendentes: ['#3 Vistoria'], cnj: '5001234-88.2026.8.26.0100', depositoRegistradoEm: null, impugnacao: 'em_impugnacao' },
    CONTEUDO_OK,
  );
  assert.ok(p.some((x) => /#3 Vistoria/.test(x)));
  assert.ok(p.some((x) => /dígito verificador/.test(x)));
  assert.ok(p.some((x) => /depósito/.test(x)));
  assert.ok(p.some((x) => /impugnação/.test(x)));
});

test('quesito sem resposta e sem custódia bloqueiam', () => {
  const p = pendenciasEmissaoLaudo({ ...ESTADO_OK, arquivosCustodia: 0 }, { ...CONTEUDO_OK, quesitos: [{ id: '1', origem: 'Autor', pergunta: 'X?', resposta: ' ' }] });
  assert.ok(p.some((x) => /1 quesito\(s\) sem resposta/.test(x)));
  assert.ok(p.some((x) => /custódia/.test(x)));
});

test('arbitral exige câmara e procedimento, não CNJ', () => {
  const p = pendenciasEmissaoLaudo({ ...ESTADO_OK, kind: 'arbitral', cnj: '', depositoRegistradoEm: null }, CONTEUDO_OK);
  assert.deepEqual(p, ['Informe a câmara arbitral.', 'Informe o número do procedimento arbitral.']);
});

test('texto de honorários não afirma prazo decorrido', () => {
  assert.equal(textoHonorarios('sem_impugnacao'), 'Nenhuma impugnação registrada na esteira');
});
