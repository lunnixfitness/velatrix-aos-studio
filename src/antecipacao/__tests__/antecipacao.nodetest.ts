import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarNumeroCnj, digitoCnj, validarCpf, validarCnpj, divHalfEven, analisarCredito, estimarPrazo, precificar, gerarOfertas,
  calcularParcelas, hashProposta, canonico, podeTransicionar, exigirTransicao, TransicaoInvalida, cascataBaseCedivel,
} from '../motor.ts';
import { EXEMPLOS_DEMO } from '../../server/antecipacao/padrao.ts';
import { COMPRADORES_DEMO } from '../compradoresDemo.ts';
import type { Comprador, CreditoJudicial } from '../tipos.ts';

const HOJE = '2026-10-01';
const SM = 162_100; // centavos
const cnj = (n7 = '0001234', ano = '2023', j = '4', tr = '03', or = '6100') => `${n7}-${digitoCnj(n7, ano, j, tr, or)}.${ano}.${j}.${tr}.${or}`;

const base = (o: Partial<CreditoJudicial> = {}): CreditoJudicial => ({
  id: 'cr1', tenantId: 't1', advogadoId: 'adv1', tipo: 'PRECATORIO', numeroProcesso: cnj(), tribunal: 'TRF3', esfera: 'FEDERAL',
  enteDevedor: 'União', natureza: 'ALIMENTAR', credor: { nome: 'Maria', documento: '52998224725' },
  valorFaceCentavos: 50_000_000, dataBase: '2026-07-01', dataRequisicao: '2026-03-15', transitoEmJulgado: true,
  honorariosContratuaisBps: 3000, honorariosSucumbenciaisCentavos: 0, cessoesAnteriores: 0,
  declaracoes: { penhoraConhecida: false, herdeirosPendentes: false, acaoRescisoria: false, impugnacaoCalculosPendente: false },
  parcelasParaAntecipar: ['CREDOR', 'HONORARIOS_CONTRATUAIS'], ...o,
});
const analise = (c: CreditoJudicial) => analisarCredito({ credito: c, hoje: HOJE, salarioMinimoCentavos: SM });
const check = (a: ReturnType<typeof analise>, id: string) => a.triagem.find((t) => t.id === id)!.resultado.status;

describe('validadores', () => {
  test('CNJ: DV correto passa, DV errado e tamanho errado falham', () => {
    const ok = cnj();
    assert.equal(validarNumeroCnj(ok).valido, true);
    assert.equal(validarNumeroCnj(ok.replace(/\D/g, '')).valido, true, 'sem máscara');
    const errado = ok.replace(/-(\d\d)\./, (_m, dv) => `-${String((Number(dv) + 1) % 100).padStart(2, '0')}.`);
    assert.equal(validarNumeroCnj(errado).valido, false);
    assert.equal(validarNumeroCnj('123').valido, false);
  });
  test('CPF e CNPJ', () => {
    assert.equal(validarCpf('529.982.247-25'), true);
    assert.equal(validarCpf('52998224724'), false);
    assert.equal(validarCpf('11111111111'), false);
    assert.equal(validarCnpj('11.222.333/0001-81'), true);
    assert.equal(validarCnpj('11222333000180'), false);
  });
  test('half-even', () => {
    assert.equal(divHalfEven(5, 2), 2);
    assert.equal(divHalfEven(7, 2), 4);
    assert.equal(divHalfEven(-5, 2), -2);
    assert.equal(divHalfEven(10, 3), 3);
  });
});

describe('prazo constitucional', () => {
  test('precatório: até 2/abril → fim do exercício seguinte; depois → +2', () => {
    assert.equal(estimarPrazo(base({ dataRequisicao: '2026-04-02' }), HOJE).dataLimiteLegal, '2027-12-31');
    assert.equal(estimarPrazo(base({ dataRequisicao: '2026-04-03' }), HOJE).dataLimiteLegal, '2028-12-31');
  });
  test('regime especial empurra para 2029 e vira YELLOW', () => {
    const c = base({ esfera: 'ESTADUAL', enteDevedor: 'Estado de São Paulo', tribunal: 'TJSP' });
    const a = analise(c);
    assert.equal(a.prazo.dataLimiteLegal, '2029-12-31');
    assert.equal(a.prazo.regimeEspecial, true);
    assert.equal(a.flag, 'YELLOW');
  });
  test('ente em mora: prazo central curto e conservador maior', () => {
    const p = estimarPrazo(base({ dataRequisicao: '2023-03-01' }), HOJE);
    assert.equal(p.emMora, true);
    assert.equal(p.mesesCentral, 6);
    assert.ok(p.mesesConservador > p.mesesCentral);
  });
  test('RPV: 2 meses da requisição', () => {
    assert.equal(estimarPrazo(base({ tipo: 'RPV', dataRequisicao: '2026-09-15' }), HOJE).dataLimiteLegal, '2026-11-15');
  });
  test('preferência constitucional: idoso com crédito alimentar', () => {
    assert.equal(estimarPrazo(base({ credor: { nome: 'J', documento: '52998224725', dataNascimento: '1960-01-01' } }), HOJE).preferencial, true);
    assert.equal(estimarPrazo(base({ natureza: 'COMUM', credor: { nome: 'J', documento: '52998224725', dataNascimento: '1960-01-01' } }), HOJE).preferencial, false);
  });
});

describe('triagem', () => {
  test('crédito limpo = GREEN', () => {
    const a = analise(base());
    assert.equal(a.flag, 'GREEN', JSON.stringify(a.triagem.filter((t) => t.resultado.status !== 'OK')));
  });
  test('RPV acima do teto federal (60 SM) = RED', () => {
    const a = analise(base({ tipo: 'RPV', valorFaceCentavos: 60 * SM + 1 }));
    assert.equal(check(a, 'TETO_RPV'), 'FALHA');
    assert.equal(a.flag, 'RED');
    assert.equal(analise(base({ tipo: 'RPV', valorFaceCentavos: 60 * SM, dataRequisicao: '2026-09-20' })).flag, 'GREEN', 'no teto e dentro do prazo');
  });
  test('teto municipal padrão 30 SM (ADCT 87)', () => {
    assert.equal(analise(base({ tipo: 'RPV', esfera: 'MUNICIPAL', enteDevedor: 'Município de Campinas', valorFaceCentavos: 31 * SM })).flag, 'RED');
  });
  test('penhora, herdeiros, rescisória, sem trânsito, CNJ inválido → RED', () => {
    const d = base().declaracoes;
    for (const c of [
      base({ declaracoes: { ...d, penhoraConhecida: true } }),
      base({ declaracoes: { ...d, herdeirosPendentes: true } }),
      base({ declaracoes: { ...d, acaoRescisoria: true } }),
      base({ transitoEmJulgado: false }),
      base({ numeroProcesso: '0001234-00.2023.4.03.6100' }),
      base({ credor: { nome: 'x', documento: '12345678900' } }),
    ]) assert.equal(analise(c).flag, 'RED');
  });
  test('impugnação pendente e 2 cessões → YELLOW', () => {
    assert.equal(analise(base({ declaracoes: { ...base().declaracoes, impugnacaoCalculosPendente: true } })).flag, 'YELLOW');
    assert.equal(analise(base({ cessoesAnteriores: 2 })).flag, 'YELLOW');
  });
  test('parcelas: honorários destacados (30%) separados do crédito do cliente', () => {
    const p = calcularParcelas(base());
    assert.deepEqual(p.map((x) => [x.id, x.valorCentavos]), [['CREDOR', 35_000_000], ['HONORARIOS_CONTRATUAIS', 15_000_000]]);
    assert.equal(calcularParcelas(base({ parcelasParaAntecipar: ['HONORARIOS_CONTRATUAIS'] })).length, 1);
  });
});

describe('precificação e ofertas', () => {
  test('VP com taxa anual e deságio mínimo', () => {
    assert.equal(precificar(10_000_000, 2000, 12, 1500), 8_333_333);
    assert.equal(precificar(10_000_000, 2000, 1, 1500), 8_500_000, 'limitado pelo deságio mínimo');
  });
  test('ofertas ranqueadas pelo maior valor; excluídos com motivo; sem float no dinheiro', () => {
    const c = base();
    const r = gerarOfertas(c, analise(c), COMPRADORES_DEMO);
    assert.ok(r.ofertas.length >= 2);
    for (let i = 1; i < r.ofertas.length; i++) assert.ok(r.ofertas[i - 1].totalOfertaCentavos >= r.ofertas[i].totalOfertaCentavos);
    assert.equal(r.melhorOfertaId, r.ofertas[0].id);
    for (const o of r.ofertas) {
      assert.ok(Number.isSafeInteger(o.totalOfertaCentavos) && Number.isSafeInteger(o.desagioBps) && Number.isSafeInteger(o.taxaOriginacaoCentavos));
      assert.ok(o.totalOfertaCentavos < o.totalFaceCentavos);
      assert.equal(o.totalFaceCentavos, 50_000_000);
    }
    assert.ok(r.excluidos.every((e) => e.motivos.length > 0));
  });
  test('RED não recebe oferta nenhuma', () => {
    const c = base({ transitoEmJulgado: false });
    const r = gerarOfertas(c, analise(c), COMPRADORES_DEMO);
    assert.equal(r.ofertas.length, 0);
    assert.equal(r.melhorOfertaId, null);
  });
  test('apetite: comprador só-federal não oferta para municipal', () => {
    const so: Comprador = { ...COMPRADORES_DEMO[0], id: 'k-fed', politica: { ...COMPRADORES_DEMO[0].politica, esferas: ['FEDERAL'] } };
    const c = base({ esfera: 'MUNICIPAL', enteDevedor: 'Município de Campinas', tribunal: 'TJSP' });
    const r = gerarOfertas(c, analise(c), [so]);
    assert.equal(r.ofertas.length, 0);
    assert.match(r.excluidos[0].motivos.join(), /esfera MUNICIPAL/);
  });
  test('maior risco ou prazo → oferta menor', () => {
    const k = COMPRADORES_DEMO.find((x) => x.politica.flagsAceitas.includes('YELLOW') && x.politica.esferas.includes('FEDERAL'))!;
    const limpo = base(), imp = base({ declaracoes: { ...base().declaracoes, impugnacaoCalculosPendente: true } });
    const oLimpo = gerarOfertas(limpo, analise(limpo), [k]).ofertas[0];
    const oImp = gerarOfertas(imp, analise(imp), [k]).ofertas[0];
    assert.ok(oImp.totalOfertaCentavos < oLimpo.totalOfertaCentavos);
    const longe = base({ dataRequisicao: '2026-08-01' });
    assert.ok(gerarOfertas(longe, analise(longe), [k]).ofertas[0].totalOfertaCentavos < oLimpo.totalOfertaCentavos);
  });
});

describe('integridade e ciclo de vida', () => {
  test('análise determinística e hash de proposta estável; mudar valor muda hash', () => {
    const c = base();
    assert.equal(canonico(analise(c)), canonico(analise(c)));
    const o = gerarOfertas(c, analise(c), COMPRADORES_DEMO).ofertas[0];
    assert.equal(hashProposta(c, o, '1.0.0'), hashProposta({ ...c }, o, '1.0.0'));
    assert.notEqual(hashProposta(c, o, '1.0.0'), hashProposta({ ...c, valorFaceCentavos: c.valorFaceCentavos + 1 }, o, '1.0.0'));
    assert.equal(hashProposta(c, o, '1.0.0'), hashProposta({ ...c, advogadoId: 'outro' }, o, '1.0.0'));
  });
  test('máquina de estados: não pula aprovação nem volta de PAGO', () => {
    assert.equal(podeTransicionar('OFERTA_ESCOLHIDA', 'ACEITO_CLIENTE'), false);
    assert.equal(podeTransicionar('APROVADO_INTERNO', 'ACEITO_CLIENTE'), true);
    assert.throws(() => exigirTransicao('PAGO', 'CANCELADO'), TransicaoInvalida);
    assert.throws(() => exigirTransicao('BLOQUEADO', 'OFERTA_ESCOLHIDA'), TransicaoInvalida);
  });
});

describe('base cedível (P30)', () => {
  const exs = (EXEMPLOS_DEMO(HOJE) as Array<Omit<CreditoJudicial, 'id' | 'tenantId' | 'advogadoId'>>)
    .map((e, i) => ({ ...e, id: 'ex' + i, tenantId: 't1', advogadoId: 'adv1' }) as CreditoJudicial);
  test('4 exemplos demo: cascata fecha na base cedível e o deságio é sempre sobre ela', () => {
    // face − honorários contratuais destacados (− retenções) → parcelas cedidas → base
    const basesEsperadas = [48_500_000, 5_440_000, 113_600_000, 15_750_000];
    exs.forEach((c, i) => {
      const cas = cascataBaseCedivel(c);
      assert.equal(cas.baseCedivelCentavos, basesEsperadas[i], 'base do exemplo ' + i);
      assert.equal(cas.linhas[cas.linhas.length - 1].id, 'BASE_CEDIVEL');
      assert.equal(cas.linhas.filter((l) => l.sinal === '+').reduce((s, l) => s + l.centavos, 0), cas.baseCedivelCentavos);
      const a = analise(c);
      const r = gerarOfertas(c, a, COMPRADORES_DEMO);
      for (const o of r.ofertas) {
        assert.equal(o.totalFaceCentavos, cas.baseCedivelCentavos);
        assert.equal(o.desagioBps, divHalfEven((cas.baseCedivelCentavos - o.totalOfertaCentavos) * 10_000, cas.baseCedivelCentavos));
      }
    });
    assert.equal(analise(exs[3]).flag, 'RED', 'exemplo D (penhora) segue bloqueado');
  });
  test('RPV do INSS: deságio de 6% é sobre R$ 54.400 (face − 20% honorários), não sobre R$ 68.000', () => {
    const c = exs[1];
    assert.equal(cascataBaseCedivel(c).baseCedivelCentavos, 5_440_000);
    assert.equal(calcularParcelas(c).length, 1);
  });
});
