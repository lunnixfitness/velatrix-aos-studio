/**
 * Testes da Leitura de documentos (P26a). Rodam sem npm:
 *   node --experimental-strip-types --test src/documents/extracao/__tests__/extracao.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarCPF, validarCNPJ, mod10, dvGeralBancario, lerBoletoBancario, lerBoletoArrecadacao, lerChaveNFe,
  dvChaveNFe, lerProcessoCNJ, dvCNJ, crc16Ccitt, lerPixCopiaCola, dataDoFator, resto11,
} from '../validadores.ts';
import { extrairDocumento } from '../extratores.ts';

// ── geradores de números VÁLIDOS (fictícios) ──
export function gerarCNPJ(base12: string) {
  const v = (c: string) => c.charCodeAt(0) - 48;
  const dv = (s: string, pesos: number[]) => { const r = [...s].reduce((a, c, i) => a + v(c) * pesos[i], 0) % 11; return r < 2 ? 0 : 11 - r; };
  const d1 = dv(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return `${base12}${d1}${d2}`;
}
export function gerarLinhaBancaria(banco: string, fator: number, valorCentavos: number, livre25: string) {
  const fv = String(fator).padStart(4, '0') + String(valorCentavos).padStart(10, '0');
  const semDv = `${banco}9` + '0' + fv + livre25;
  const dv = dvGeralBancario(semDv);
  const c1 = `${banco}9${livre25.slice(0, 5)}`;
  const c2 = livre25.slice(5, 15);
  const c3 = livre25.slice(15, 25);
  return `${c1}${mod10(c1)}${c2}${mod10(c2)}${c3}${mod10(c3)}${dv}${fv}`;
}
export function gerarArrecadacao(valorCentavos: number, resto29: string) {
  const semDv = '826' + String(valorCentavos).padStart(11, '0') + resto29; // 8=arrecadação, 2=saneamento, 6=valor efetivo mod10
  const barras = semDv.slice(0, 3) + mod10(semDv) + semDv.slice(3);
  let l = '';
  for (let i = 0; i < 4; i++) { const b = barras.slice(i * 11, i * 11 + 11); l += b + mod10(b); }
  return l;
}
export function gerarChaveNFe(cnpj: string) {
  const c43 = `352409${cnpj}55001000001234112345678`;
  return c43 + dvChaveNFe(c43);
}
export function gerarPix(chave: string, valor: string, nome: string, cidade: string, txid: string) {
  const f = (id: string, v: string) => `${id}${String(v.length).padStart(2, '0')}${v}`;
  const conta = f('00', 'br.gov.bcb.pix') + f('01', chave);
  const base = f('00', '01') + f('26', conta) + f('52', '0000') + f('53', '986') + f('54', valor) + f('58', 'BR') + f('59', nome) + f('60', cidade) + f('62', f('05', txid)) + '6304';
  return base + crc16Ccitt(base);
}

const REF = Date.UTC(2026, 8, 29);
const CNPJ_OK = gerarCNPJ('112223330001');

describe('validadores', () => {
  test('CPF e CNPJ clássicos', () => {
    assert.equal(validarCPF('529.982.247-25'), true);
    assert.equal(validarCPF('529.982.247-24'), false);
    assert.equal(validarCPF('111.111.111-11'), false);
    assert.equal(validarCNPJ('11.222.333/0001-81'), true);
    assert.equal(validarCNPJ('11.222.333/0001-82'), false);
  });
  test('CNPJ alfanumérico (exemplo oficial da Receita)', () => {
    assert.equal(validarCNPJ('12.ABC.345/01DE-35'), true);
    assert.equal(validarCNPJ('12.ABC.345/01DE-36'), false);
  });
  test('boleto bancário: DVs, valor e vencimento (ciclo de fator 2025)', () => {
    const l = gerarLinhaBancaria('001', 1000 + 600, 1234567, '1234567890123456789012345');
    const b = lerBoletoBancario(l, REF);
    assert.equal(b.valido, true, b.falhas.join(' '));
    assert.equal(b.valor, 12345.67);
    assert.equal(b.banco, '001');
    assert.equal(b.vencimento, '2026-10-15'); // 22/02/2025 + 600 dias
    const adulterada = l.slice(0, 40) + ((Number(l[40]) + 1) % 10) + l.slice(41); // muda 1 dígito do valor
    assert.equal(lerBoletoBancario(adulterada, REF).valido, false);
  });
  test('fator de vencimento: base antiga ainda resolvida perto da referência', () => {
    assert.equal(dataDoFator(9000, Date.UTC(2022, 0, 1)), '2022-05-29');
  });
  test('guia de arrecadação (48 dígitos)', () => {
    const l = gerarArrecadacao(15890, '00010203040506070809101112131');
    const g = lerBoletoArrecadacao(l);
    assert.equal(g.valido, true, g.falhas.join(' '));
    assert.equal(g.valor, 158.9);
  });
  test('chave NF-e', () => {
    const ch = gerarChaveNFe(CNPJ_OK);
    const n = lerChaveNFe(ch);
    assert.equal(n.valido, true, n.falhas.join(' '));
    assert.equal(n.uf, 'SP');
    assert.equal(n.modelo, 'NF-e');
    assert.equal(n.numero, '1234');
    assert.equal(lerChaveNFe(ch.slice(0, 43) + ((Number(ch[43]) + 1) % 10)).valido, false);
    assert.ok(resto11('0') === 0);
  });
  test('processo CNJ (mod 97)', () => {
    const dd = dvCNJ('5001234', '2024', '4', '03', '6100');
    const p = lerProcessoCNJ(`5001234-${dd}.2024.4.03.6100`);
    assert.equal(p.valido, true);
    assert.equal(p.segmento, 'Justiça Federal');
    assert.equal(lerProcessoCNJ(`5001234-${dd === '00' ? '01' : '00'}.2024.4.03.6100`).valido, false);
  });
  test('PIX copia e cola (CRC16)', () => {
    const p = gerarPix('financeiro@mv-advogados.demo', '1500.00', 'MONTEIRO VASCONCELOS', 'SAO PAULO', 'HON2026A1');
    const r = lerPixCopiaCola(p);
    assert.equal(r.valido, true);
    assert.equal(r.valor, 1500);
    assert.equal(r.chave, 'financeiro@mv-advogados.demo');
    assert.equal(lerPixCopiaCola(p.replace('1500.00', '9500.00')).valido, false);
  });
});

describe('extração de documento', () => {
  test('boleto: classifica, valida e cruza valor impresso', () => {
    const l = gerarLinhaBancaria('341', 1600, 250000, '1098765432101234567890123');
    const fmt = `${l.slice(0, 5)}.${l.slice(5, 10)} ${l.slice(10, 15)}.${l.slice(15, 21)} ${l.slice(21, 26)}.${l.slice(26, 32)} ${l[32]} ${l.slice(33)}`;
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: `BANCO ITAÚ\nBeneficiário: Monteiro & Vasconcelos Advogados CNPJ 11.222.333/0001-81\nVencimento 15/10/2026 Valor do documento R$ 2.500,00\n${fmt}` }], REF);
    assert.equal(r.tipo, 'boleto');
    const b = r.campos.find((c) => c.tipo === 'boleto')!;
    assert.equal(b.valido, true);
    assert.equal(b.detalhes?.valor, 'R$ 2.500,00');
    assert.equal(r.alertas.filter((a) => a.severidade === 'alta').length, 0);
  });
  test('boleto adulterado: valor impresso diferente do código de barras gera alerta', () => {
    const l = gerarLinhaBancaria('341', 1600, 250000, '1098765432101234567890123');
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: `Beneficiário CNPJ 11.222.333/0001-81 Valor do documento R$ 25.000,00\n${l}` }], REF);
    assert.ok(r.alertas.some((a) => a.severidade === 'alta' && /não aparece impresso/.test(a.mensagem)));
  });
  test('DANFE: chave válida + emitente', () => {
    const ch = gerarChaveNFe(CNPJ_OK);
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: `DANFE - Documento Auxiliar da Nota Fiscal Eletrônica\nCHAVE DE ACESSO\n${ch.replace(/(\d{4})(?=\d)/g, '$1 ')}\nEmitente CNPJ 11.222.333/0001-81\nValor total R$ 1.200,00` }], REF);
    assert.equal(r.tipo, 'nfe');
    assert.equal(r.campos.find((c) => c.tipo === 'chave_nfe')?.valido, true);
  });
  test('procuração com OAB, CNJ e CPF inválido', () => {
    const dd = dvCNJ('5001234', '2024', '4', '03', '6100');
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: `PROCURAÇÃO AD JUDICIA\nOutorgante: João da Silva, CPF 529.982.247-24\nOutorgada: Dra. Helena Monteiro, OAB/SP 118.204\nProcesso nº 5001234-${dd}.2024.4.03.6100` }], REF);
    assert.equal(r.tipo, 'procuracao');
    assert.equal(r.campos.find((c) => c.tipo === 'oab')?.valor, 'OAB/SP 118.204');
    assert.equal(r.campos.find((c) => c.tipo === 'processo_cnj')?.valido, true);
    assert.ok(r.alertas.some((a) => /CPF 529\.982\.247-24/.test(a.mensagem)));
  });
  test('comprovante PIX', () => {
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: 'Comprovante de transferência PIX\nID da transação: E60701190202609291432AbCdEfGhIjK\nValor R$ 1.500,00\nData 29/09/2026' }], REF);
    assert.equal(r.tipo, 'comprovante_pix');
    assert.equal(r.campos.find((c) => c.tipo === 'pix_e2e')?.detalhes?.dataHora, '29/09/2026 14:32');
  });
  test('sem campos: alerta informativo', () => {
    const r = extrairDocumento([{ n: 1, hash: 'a', texto: '' }], REF);
    assert.equal(r.tipo, 'documento');
    assert.ok(r.alertas.some((a) => a.severidade === 'info'));
  });
});
