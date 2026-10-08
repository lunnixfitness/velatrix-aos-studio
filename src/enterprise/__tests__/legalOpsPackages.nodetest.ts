/**
 * Testes dos Pacotes LegalOps (P21). Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/legalOpsPackages.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGALOPS_PACKAGES, PACOTE_ORDEM, RECURSO_LABEL, LIMITE_LABEL, RECURSO_POR_FERRAMENTA,
  pacotePadraoDoPlano, resolverDireitos, temRecurso, podeUsarFerramenta, avaliarUso,
  podeConsumir, pacoteMinimoPara, compararPacotes, bloqueiosDowngrade, isPacoteId,
  type LegalOpsFeature, type LegalOpsLimit,
} from '../legalOpsPackages.ts';

const FS = Object.keys(RECURSO_LABEL) as LegalOpsFeature[];
const LS = Object.keys(LIMITE_LABEL) as LegalOpsLimit[];
const ge = (a: number, b: number) => a === -1 || (b !== -1 && a >= b);

describe('catálogo', () => {
  test('pacotes são monotônicos: recursos e limites nunca regridem', () => {
    for (let i = 1; i < PACOTE_ORDEM.length; i++) {
      const a = LEGALOPS_PACKAGES[PACOTE_ORDEM[i - 1]];
      const b = LEGALOPS_PACKAGES[PACOTE_ORDEM[i]];
      for (const f of FS) if (a.recursos[f]) assert.ok(b.recursos[f], `${b.id} perdeu ${f}`);
      for (const l of LS) assert.ok(ge(b.limites[l], a.limites[l]), `${b.id} regrediu ${l}`);
      assert.ok(b.sla.respostaMin <= a.sla.respostaMin);
    }
  });
  test('todo recurso mapeado por ferramenta existe', () => {
    for (const f of Object.values(RECURSO_POR_FERRAMENTA)) assert.ok(FS.includes(f));
  });
  test('Chinese Wall fora do Essencial ⇒ barreirasAtivas = 0', () => {
    const e = LEGALOPS_PACKAGES.ESSENCIAL;
    assert.equal(e.recursos.chinese_wall, false);
    assert.equal(e.limites.barreirasAtivas, 0);
  });
});

describe('resolução de direitos', () => {
  test('mapeia tier legado', () => {
    assert.equal(pacotePadraoDoPlano('STARTER'), 'ESSENCIAL');
    assert.equal(pacotePadraoDoPlano('PRO'), 'ESCRITORIO');
    assert.equal(pacotePadraoDoPlano('ENTERPRISE'), 'GRANDE_ESCRITORIO');
    assert.equal(pacotePadraoDoPlano('REGULATED'), 'CORPORATIVO');
    assert.equal(pacotePadraoDoPlano(undefined), 'ESSENCIAL');
  });
  test('overrides vencem, entradas inválidas são ignoradas', () => {
    const d = resolverDireitos('ESSENCIAL', {
      recursos: { jurimetria: true, inexistente: true } as never,
      limites: { assentos: 12, laudosSeladosMes: -5, conflictChecksMes: 1.5 },
    });
    assert.equal(temRecurso(d, 'jurimetria'), true);
    assert.equal(d.limites.assentos, 12);
    assert.equal(d.limites.laudosSeladosMes, 50);
    assert.equal(d.limites.conflictChecksMes, 100);
    assert.equal('inexistente' in d.recursos, false);
  });
  test('não muta o catálogo', () => {
    resolverDireitos('ESSENCIAL', { recursos: { zdr: true }, limites: { assentos: 99 } });
    assert.equal(LEGALOPS_PACKAGES.ESSENCIAL.recursos.zdr, false);
    assert.equal(LEGALOPS_PACKAGES.ESSENCIAL.limites.assentos, 5);
  });
  test('pacote inválido lança', () => {
    assert.throws(() => resolverDireitos('XPTO' as never));
    assert.equal(isPacoteId('XPTO'), false);
    assert.equal(isPacoteId('ESCRITORIO'), true);
  });
  test('gate por ferramenta', () => {
    const d = resolverDireitos('ESSENCIAL');
    assert.equal(podeUsarFerramenta(d, 'ent_conflict'), true);
    assert.equal(podeUsarFerramenta(d, 'ent_jurimetria'), false);
    assert.equal(podeUsarFerramenta(d, 'ent_packages'), true);
  });
});

describe('uso e limites', () => {
  const d = resolverDireitos('ESCRITORIO');
  test('faixas ok / alerta / excedido', () => {
    assert.equal(avaliarUso(d, 'assentos', 10).estado, 'ok');
    assert.equal(avaliarUso(d, 'assentos', 20).estado, 'alerta');
    assert.equal(avaliarUso(d, 'assentos', 25).estado, 'excedido');
    assert.equal(avaliarUso(d, 'assentos', 20).restante, 5);
  });
  test('ilimitado e indisponível', () => {
    const g = resolverDireitos('GRANDE_ESCRITORIO');
    assert.equal(avaliarUso(g, 'conflictChecksMes', 1e6).estado, 'ilimitado');
    const e = resolverDireitos('ESSENCIAL');
    assert.equal(avaliarUso(e, 'barreirasAtivas', 0).estado, 'indisponivel');
    assert.equal(avaliarUso(e, 'barreirasAtivas', 1).estado, 'excedido');
  });
  test('uso negativo/NaN normaliza para 0', () => {
    assert.equal(avaliarUso(d, 'assentos', -3).usado, 0);
    assert.equal(avaliarUso(d, 'assentos', NaN).usado, 0);
  });
  test('hard cap', () => {
    assert.equal(podeConsumir(d, 'barreirasAtivas', 9), true);
    assert.equal(podeConsumir(d, 'barreirasAtivas', 10), false);
    assert.equal(podeConsumir(resolverDireitos('CORPORATIVO'), 'assentos', 1e9), true);
  });
});

describe('upgrade / downgrade', () => {
  test('pacote mínimo por recurso', () => {
    assert.equal(pacoteMinimoPara('conflict_check'), 'ESSENCIAL');
    assert.equal(pacoteMinimoPara('chinese_wall'), 'ESCRITORIO');
    assert.equal(pacoteMinimoPara('jurimetria'), 'GRANDE_ESCRITORIO');
    assert.equal(pacoteMinimoPara('tenant_dedicado'), 'CORPORATIVO');
  });
  test('diff de upgrade', () => {
    const x = compararPacotes('ESSENCIAL', 'ESCRITORIO');
    assert.equal(x.direcao, 'upgrade');
    assert.ok(x.recursosGanhos.includes('chinese_wall'));
    assert.deepEqual(x.recursosPerdidos, []);
    assert.equal(x.deltaMensalBrl, 6900);
    assert.equal(compararPacotes('GRANDE_ESCRITORIO', 'CORPORATIVO').deltaMensalBrl, null);
    assert.equal(compararPacotes('ESCRITORIO', 'ESCRITORIO').direcao, 'igual');
  });
  test('downgrade bloqueado pelo uso', () => {
    const b = bloqueiosDowngrade('ESSENCIAL', { assentos: 18, barreirasAtivas: 2, conflictChecksMes: 40 });
    assert.equal(b.length, 2);
    assert.deepEqual(bloqueiosDowngrade('GRANDE_ESCRITORIO', { conflictChecksMes: 5000 }), []);
  });
});
