/**
 * P26b · seleção de páginas enviadas à IA.
 *   node --experimental-strip-types --no-warnings --test src/documents/autos/__tests__/selecaoPaginas.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { selecionarPaginas, SELECAO_PADRAO } from '../selecaoPaginas.ts';

const textos = (ini: number, fim: number, tam = 1000) => new Map(Array.from({ length: fim - ini + 1 }, (_, i) => [ini + i, `pagina ${ini + i} `.padEnd(tam, 'x')]));
const semRank = () => [];

describe('seleção de páginas', () => {
  test('peça pequena vai inteira, sem páginas em branco', () => {
    const t = textos(10, 14);
    t.set(12, '   ');
    const r = selecionarPaginas({ id: 'PC-1', tipo: 'sentenca', paginaInicial: 10, paginaFinal: 14 }, t, semRank);
    assert.equal(r.completa, true);
    assert.deepEqual(r.paginas.map((p) => p.n), [10, 11, 13, 14]);
  });

  test('peça grande: 1ª + 2 últimas + melhores do BM25, dentro do teto', () => {
    const t = textos(1, 120);
    const rank = () => [
      { bloco: { paginaInicial: 77, paginaFinal: 77 }, score: 9 },
      { bloco: { paginaInicial: 40, paginaFinal: 41 }, score: 5 },
      { bloco: { paginaInicial: 200, paginaFinal: 200 }, score: 99 }, // fora da peça: ignorado
    ];
    const r = selecionarPaginas({ id: 'PC-2', tipo: 'laudo', paginaInicial: 1, paginaFinal: 120 }, t, rank, { ...SELECAO_PADRAO, maxPaginas: 6 });
    assert.equal(r.completa, false);
    assert.deepEqual(r.paginas.map((p) => p.n), [1, 40, 41, 77, 119, 120]);
  });

  test('respeita o teto de caracteres e corta página gigante', () => {
    const t = textos(1, 50, 20_000);
    const r = selecionarPaginas({ id: 'PC-3', tipo: 'documento', paginaInicial: 1, paginaFinal: 50 }, t, semRank);
    assert.ok(r.paginas.every((p) => p.texto.length <= SELECAO_PADRAO.maxCharsPagina));
    assert.ok(r.paginas.reduce((s, p) => s + p.texto.length, 0) <= SELECAO_PADRAO.maxChars);
    assert.ok(r.paginas.length <= SELECAO_PADRAO.maxPaginas);
    assert.deepEqual(r.paginas.slice(0, 1).map((p) => p.n), [1]);
  });
});
