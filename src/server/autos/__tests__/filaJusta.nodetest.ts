/**
 * Testes da fila justa (P25). Rodam sem npm:
 *   node --experimental-strip-types --test src/server/autos/__tests__/filaJusta.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { FilaJusta, FilaCheia, comRetentativa } from '../filaJusta.ts';

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('fila justa', () => {
  test('respeita a concorrência global', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 3, concorrenciaPorTenant: 10, concorrenciaPorUsuario: 10 });
    let ativos = 0, pico = 0;
    const job = async () => { ativos++; pico = Math.max(pico, ativos); await dormir(5); ativos--; };
    await Promise.all(Array.from({ length: 20 }, (_, i) => f.enfileirar('t1', `u${i}`, job)));
    assert.equal(pico, 3);
    assert.equal(f.estatisticas().concluidas, 20);
  });

  test('escritório grande não monopoliza: round-robin entre tenants', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 2, concorrenciaPorTenant: 2, concorrenciaPorUsuario: 2 });
    const ordem: string[] = [];
    const job = (t: string) => async () => { ordem.push(t); await dormir(2); };
    const ps: Promise<unknown>[] = [];
    for (let i = 0; i < 30; i++) ps.push(f.enfileirar('grande', `u${i}`, job('grande')));
    for (let i = 0; i < 3; i++) ps.push(f.enfileirar('pequeno', 'u1', job('pequeno')));
    await Promise.all(ps);
    const ultimaPequeno = ordem.lastIndexOf('pequeno');
    assert.ok(ultimaPequeno < 10, `o pequeno terminou na posição ${ultimaPequeno}; não deveria esperar os 30 do grande`);
  });

  test('limite por usuário', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 10, concorrenciaPorTenant: 10, concorrenciaPorUsuario: 2 });
    let ativos = 0, pico = 0;
    const job = async () => { ativos++; pico = Math.max(pico, ativos); await dormir(3); ativos--; };
    await Promise.all(Array.from({ length: 8 }, () => f.enfileirar('t', 'mesmo', job)));
    assert.equal(pico, 2);
  });

  test('dedupe em voo pela chave (mesma página)', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 1 });
    let execucoes = 0;
    const job = async () => { execucoes++; await dormir(5); return 'ocr'; };
    const [a, b, c] = await Promise.all([f.enfileirar('t', 'u1', job, 'hashP1'), f.enfileirar('t', 'u2', job, 'hashP1'), f.enfileirar('t', 'u3', job, 'hashP2')]);
    assert.deepEqual([a, b, c], ['ocr', 'ocr', 'ocr']);
    assert.equal(execucoes, 2);
    assert.equal(f.estatisticas().deduplicadas, 1);
  });

  test('backpressure: 429 com Retry-After quando a fila enche', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 1, maxPendentesPorTenant: 2, duracaoMediaMs: 2000 });
    const lento = () => dormir(20);
    const ps = [f.enfileirar('t', 'u', lento), f.enfileirar('t', 'u', lento), f.enfileirar('t', 'u', lento)];
    assert.throws(() => f.enfileirar('t', 'u', lento), (e: unknown) => e instanceof FilaCheia && e.httpStatus === 429 && e.retryAfterSeg >= 1);
    await Promise.all(ps);
    assert.equal(f.estatisticas().rejeitadas, 1);
  });

  test('falha de uma tarefa não trava a fila', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 1 });
    const r = await Promise.allSettled([f.enfileirar('t', 'u', async () => { throw new Error('x'); }), f.enfileirar('t', 'u', async () => 1)]);
    assert.equal(r[0].status, 'rejected');
    assert.deepEqual(r[1], { status: 'fulfilled', value: 1 });
    assert.equal(f.estatisticas().emExecucao, 0);
  });

  test('carga: 2.000 advogados × 5 páginas, 40 escritórios', async () => {
    const f = new FilaJusta({ concorrenciaGlobal: 64, concorrenciaPorTenant: 16, concorrenciaPorUsuario: 4 });
    let pico = 0, ativos = 0;
    const job = async () => { ativos++; pico = Math.max(pico, ativos); await dormir(1); ativos--; };
    const ps: Promise<unknown>[] = [];
    for (let u = 0; u < 2000; u++) for (let p = 0; p < 5; p++) ps.push(f.enfileirar(`esc${u % 40}`, `adv${u}`, job));
    await Promise.all(ps);
    const s = f.estatisticas();
    assert.equal(s.concluidas, 10000);
    assert.ok(pico <= 64);
    assert.equal(s.pendentes, 0);
    assert.deepEqual(s.porTenant, {});
  });
});

describe('retentativa', () => {
  test('repete 429/5xx e desiste em erro permanente', async () => {
    let n = 0;
    const v = await comRetentativa(async () => { if (++n < 3) throw { status: 429 }; return 'ok'; }, { esperar: async () => {} });
    assert.equal(v, 'ok');
    let m = 0;
    await assert.rejects(comRetentativa(async () => { m++; throw { status: 400 }; }, { esperar: async () => {} }));
    assert.equal(m, 1);
  });
});
