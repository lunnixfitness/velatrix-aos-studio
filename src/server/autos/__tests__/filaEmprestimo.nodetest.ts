/**
 * P27 · empréstimo de capacidade ociosa e concorrência derivada da cota.
 *   node --experimental-strip-types --no-warnings --test src/server/autos/__tests__/filaEmprestimo.nodetest.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FilaJusta, opcoesFilaDoAmbiente } from '../filaJusta.ts';
const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
test('sem disputa, escritório único usa a capacidade ociosa (menos a reserva)', async () => {
  const f = new FilaJusta({ concorrenciaGlobal: 20, concorrenciaPorTenant: 4, concorrenciaPorUsuario: 1, reservaParaNovos: 4 });
  let ativos = 0, pico = 0;
  const job = async () => { ativos++; pico = Math.max(pico, ativos); await dormir(5); ativos--; };
  await Promise.all(Array.from({ length: 60 }, (_, i) => f.enfileirar('grande', `u${i}`, job)));
  assert.equal(pico, 16);
  assert.ok(f.estatisticas().emprestadas > 0);
});
test('empréstimo desligado mantém o teto rígido', async () => {
  const f = new FilaJusta({ concorrenciaGlobal: 20, concorrenciaPorTenant: 4, concorrenciaPorUsuario: 1, emprestimoOcioso: false });
  let ativos = 0, pico = 0;
  const job = async () => { ativos++; pico = Math.max(pico, ativos); await dormir(5); ativos--; };
  await Promise.all(Array.from({ length: 30 }, (_, i) => f.enfileirar('grande', `u${i}`, job)));
  assert.equal(pico, 4);
});
test('quem chega depois entra na hora pela reserva, mesmo com o grande emprestando', async () => {
  const f = new FilaJusta({ concorrenciaGlobal: 10, concorrenciaPorTenant: 2, concorrenciaPorUsuario: 1, reservaParaNovos: 2 });
  const ps = Array.from({ length: 40 }, (_, i) => f.enfileirar('grande', `u${i}`, () => dormir(30)));
  await dormir(5); // grande já ocupou 8 vagas (10 − reserva 2)
  const t0 = Date.now();
  let inicio = 0;
  const p = f.enfileirar('pequeno', 'x', async () => { inicio = Date.now() - t0; });
  await p;
  assert.ok(inicio < 10, `pequeno esperou ${inicio} ms`);
  await Promise.all(ps);
});
test('concorrência derivada da cota', () => {
  assert.equal(opcoesFilaDoAmbiente({ AUTOS_RPM: '3000', AUTOS_LATENCIA_MS: '2000' }).concorrenciaGlobal, 110);
  assert.equal(opcoesFilaDoAmbiente({ AUTOS_CONCORRENCIA_GLOBAL: '80', AUTOS_RPM: '3000' }).concorrenciaGlobal, 80);
  assert.equal(opcoesFilaDoAmbiente({}).concorrenciaGlobal, undefined);
});
