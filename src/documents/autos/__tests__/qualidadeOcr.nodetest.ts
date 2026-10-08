/**
 * P28 · qualidade do OCR local.
 *   node --experimental-strip-types --no-warnings --test src/documents/autos/__tests__/qualidadeOcr.nodetest.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avaliarOcr, tokensOcrGeminiEstimados } from '../qualidadeOcr.ts';

const CERTIDAO = `CERTIDÃO
Certifico que o prazo para recurso decorreu em 25/09/2025 sem manifestação das partes.
Trânsito em julgado certificado nesta data. Escrevente: Maria Souza — R$ 1.250.000,00 (art. 1º).`;

test('página digitada, boa confiança → aceita (zero token)', () => {
  const a = avaliarOcr(CERTIDAO, 91);
  assert.equal(a.aceito, true);
  assert.ok(a.palavrasValidas > 0.9);
});

test('confiança baixa → Gemini', () => {
  assert.equal(avaliarOcr(CERTIDAO, 55).motivo, 'confianca_baixa');
});

test('quase sem texto (carimbo, página em branco escaneada) → Gemini', () => {
  assert.equal(avaliarOcr('  ~ | .  ', 95).motivo, 'pouco_texto');
});

test('lixo de OCR (manuscrito/borrado) com confiança inflada → Gemini', () => {
  const lixo = 'Wx|l ;;jjk rtpq ~~ bcdfg ll1l %% zxcv mnbv qwrt hjkl ptkr ssddf vbnm ,,, xzq wrtp';
  const a = avaliarOcr(lixo, 82);
  assert.equal(a.motivo, 'texto_ruidoso');
  assert.ok(a.palavrasValidas < 0.6);
});

test('estimativa de tokens evitados cresce com o texto', () => {
  assert.equal(tokensOcrGeminiEstimados(''), 1550);
  assert.equal(tokensOcrGeminiEstimados('x'.repeat(400)), 1650);
});
