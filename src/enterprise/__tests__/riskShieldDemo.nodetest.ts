import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rodarShield, casosDaEsteira } from '../../services/riskShieldDemo.ts';

test('Shield DEMO: resultados calculados, nunca verde sem dados', () => {
  assert.equal(rodarShield('RECUPERACAO_TRIBUTARIA', 'completo').flag, 'YELLOW');
  assert.equal(rodarShield('RECUPERACAO_TRIBUTARIA', 'riscos').flag, 'RED');
  assert.equal(rodarShield('RECUPERACAO_TRIBUTARIA', 'vazio').flag, 'NAO_AVALIADO');
  assert.equal(rodarShield('PRECATORIA', 'cessao').flag, 'RED');
  assert.equal(rodarShield('PRECATORIA', 'semFonte').flag, 'NAO_AVALIADO');
  const p = rodarShield('PERICIA_JUDICIAL', '');
  assert.equal(p.flag, 'NAO_AVALIADO'); assert.equal(p.catalogoCadastrado, false);
  assert.equal(casosDaEsteira('INSS').length, 0);
  const e = rodarShield('RECUPERACAO_TRIBUTARIA', 'completo').exposicao!;
  assert.equal(e.pct, 75); assert.equal(e.multaCentavos, Math.round(e.baseCentavos * 0.75));
});
