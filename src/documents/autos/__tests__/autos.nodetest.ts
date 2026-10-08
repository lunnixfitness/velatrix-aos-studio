/**
 * Testes da Leitura de Autos (P25). Rodam sem npm:
 *   node --experimental-strip-types --test src/documents/autos/__tests__/autos.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { triarPaginas, segmentarPecas, gerarBlocos, classificarPeca, paginasLimpas, type PaginaTexto } from '../autosCore.ts';
import { IndiceBm25, tokenizar, partesDestacadas } from '../indiceBm25.ts';

const pg = (n: number, texto: string, hash = `h${n}`): PaginaTexto => ({ n, texto, hash });
const pje = (id: string, k: number) => `\nNum. ${id} - Pág. ${k}\nAssinado eletronicamente por: FULANO DE TAL - 10/03/2025 14:22`;
const corpo = (s: string) => `${s} ${'Lorem ipsum dolor sit amet consectetur. '.repeat(3)}`;

const AUTOS: PaginaTexto[] = [
  pg(1, corpo('EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO. ALPHA CONSTRUÇÕES LTDA vem, respeitosamente, propor ação de repetição de indébito do PIS/COFINS no valor de R$ 1.250.000,00.') + pje('1111111', 1)),
  pg(2, corpo('Dos pedidos: restituição dos valores recolhidos a maior nos últimos 60 meses.') + pje('1111111', 2)),
  pg(3, corpo('PROCURAÇÃO AD JUDICIA. Outorgante ALPHA CONSTRUÇÕES LTDA.') + pje('2222222', 1)),
  pg(4, corpo('CONTESTAÇÃO. A UNIÃO FEDERAL apresenta defesa alegando prescrição quinquenal.') + pje('3333333', 1)),
  pg(5, '   ', 'hbranco'),
  pg(6, corpo('SENTENÇA. Ante o exposto, JULGO PROCEDENTE o pedido e condeno a ré em honorários de 10% sobre o valor da condenação.') + pje('4444444', 1)),
  pg(7, corpo('SENTENÇA. Ante o exposto, JULGO PROCEDENTE o pedido e condeno a ré em honorários de 10% sobre o valor da condenação.') + pje('4444444', 2), 'h6'),
  pg(8, 'Documento digitalizado'),
];

describe('triagem', () => {
  test('branco, escaneada, duplicada e texto', () => {
    const t = triarPaginas(AUTOS);
    assert.equal(t[4].tipo, 'branco');
    assert.equal(t[7].tipo, 'escaneada');
    assert.equal(t[6].tipo, 'duplicada');
    assert.equal(t[6].duplicadaDe, 6);
    assert.equal(t[0].tipo, 'texto');
  });
});

describe('peças', () => {
  const pecas = segmentarPecas(AUTOS);
  test('separa pelo Id do PJe e classifica', () => {
    assert.deepEqual(pecas.slice(0, 4).map((p) => p.tipo), ['peticao_inicial', 'procuracao', 'contestacao', 'sentenca']);
    assert.equal(pecas[0].paginaInicial, 1);
    assert.equal(pecas[0].paginaFinal, 2);
    assert.equal(pecas[0].idPje, '1111111');
    assert.equal(pecas[0].assinadoPor, 'FULANO DE TAL');
  });
  test('páginas sem marca PJe seguem na peça anterior', () => {
    const contest = pecas.find((p) => p.tipo === 'contestacao')!;
    assert.equal(contest.paginaFinal, 5);
  });
  test('sem PJe: cabeçalho abre nova peça', () => {
    const p = segmentarPecas([pg(1, corpo('EXCELENTÍSSIMO SENHOR JUIZ, vem respeitosamente...')), pg(2, corpo('continuação dos fatos')), pg(3, corpo('DECISÃO. Defiro a tutela de urgência.'))]);
    assert.deepEqual(p.map((x) => [x.tipo, x.paginaInicial, x.paginaFinal]), [['peticao_inicial', 1, 2], ['decisao', 3, 3]]);
  });
  test('regressões do teste com 496 páginas', () => {
    assert.equal(classificarPeca('ACÓRDÃO\nACORDAM os Desembargadores, por unanimidade, negar provimento à apelação'), 'acordao');
    assert.equal(classificarPeca('APELAÇÃO\nA União requer a reforma da sentença'), 'recurso');
    assert.equal(classificarPeca('CONTRARRAZÕES DE APELAÇÃO\nA apelada pugna pela manutenção da sentença'), 'recurso');
    assert.equal(classificarPeca('RÉPLICA - IMPUGNAÇÃO À CONTESTAÇÃO'), 'replica');
    assert.equal(classificarPeca('MANIFESTAÇÃO SOBRE O LAUDO\nA autora concorda'), 'peticao');
    assert.equal(classificarPeca('CERTIDÃO DE TRÂNSITO EM JULGADO\nCertifico o trânsito do acórdão'), 'certidao');
  });
  test('limpeza remove só cabeçalho/rodapé repetido, não conteúdo repetido', () => {
    const corpoPg = (i: number) => Array.from({ length: 20 }, (_, k) => (k === 10 ? 'DARF código 8109 PIS período de apuração' : `linha ${k} da página ${i}`)).join('\n');
    const ps = Array.from({ length: 10 }, (_, i) => pg(i + 1, `Tribunal Regional Federal - PJe\n${corpoPg(i)}\nNum. 1234567 - Pág. ${i + 1}`));
    const l = paginasLimpas(ps)[3].texto;
    assert.ok(!/Tribunal Regional/.test(l));
    assert.ok(/DARF código 8109/.test(l));
    assert.ok(!/Num\. 1234567/.test(l));
  });
  test('sem texto + com imagem = escaneada', () => {
    const t = triarPaginas([{ n: 1, texto: '', hash: 'a', temImagem: true }, { n: 2, texto: '', hash: 'b' }]);
    assert.deepEqual(t.map((x) => x.tipo), ['escaneada', 'branco']);
  });
  test('classificador', () => {
    assert.equal(classificarPeca('ACÓRDÃO. Vistos, relatados e discutidos'), 'acordao');
    assert.equal(classificarPeca('LAUDO PERICIAL CONTÁBIL'), 'laudo');
    assert.equal(classificarPeca('texto qualquer'), 'documento');
  });
});

describe('blocos e busca', () => {
  const pecas = segmentarPecas(AUTOS);
  const blocos = gerarBlocos(AUTOS, pecas, 60);
  test('blocos não atravessam peças e têm páginas', () => {
    for (const b of blocos) {
      const p = pecas.find((x) => x.id === b.pecaId)!;
      assert.ok(b.paginaInicial >= p.paginaInicial && b.paginaFinal <= p.paginaFinal);
    }
    assert.ok(blocos.length >= pecas.length - 1);
  });
  test('busca acha a página certa (acentos, plural, número)', () => {
    const idx = new IndiceBm25(blocos);
    const r = idx.buscar('houve condenação em honorários?');
    assert.ok(r.length > 0);
    assert.equal(r[0].bloco.paginaInicial, 6);
    const v = idx.buscar('1.250.000');
    assert.equal(v[0].bloco.paginaInicial, 1);
    assert.ok(idx.buscar('prescricao')[0].bloco.pecaId === pecas.find((p) => p.tipo === 'contestacao')!.id);
    assert.deepEqual(idx.buscar('xyzabc'), []);
  });
  test('tokenização e destaque', () => {
    assert.deepEqual(tokenizar('Condenação em R$ 1.250.000,00'), ['condenacao', 'r', '1250000', '00'].filter((w) => w.length > 1));
    const partes = partesDestacadas('Honorários de 10%', ['honorarios']);
    assert.ok(partes.some((p) => p.hit && /Honor/.test(p.t)));
  });
  test('500 páginas indexam rápido', () => {
    const muitas = Array.from({ length: 500 }, (_, i) => pg(i + 1, corpo(`Página ${i + 1} trata de ${i % 7 === 0 ? 'prescrição intercorrente' : 'crédito tributário'} e honorários.`) + pje(String(1000000 + Math.floor(i / 10)), (i % 10) + 1)));
    const t0 = performance.now();
    const ps = segmentarPecas(muitas);
    const idx = new IndiceBm25(gerarBlocos(muitas, ps));
    const r = idx.buscar('prescrição intercorrente');
    const ms = performance.now() - t0;
    assert.equal(ps.length, 50);
    assert.ok(r.length > 0);
    assert.ok(ms < 1500, `levou ${ms.toFixed(0)} ms`);
  });
});
