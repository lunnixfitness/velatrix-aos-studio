/**
 * Testes unitários do Motor de Cálculo LOAS/BPC (P27).
 * Executados diretamente via Node.js:
 *   node --experimental-strip-types --no-warnings --test src/loas/__tests__/calcLoas.nodetest.ts
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calcularLoas, divideHalfEven, calcularIdadeEmAnos } from '../calcLoas.ts';
import { REGRAS_LOAS_V1, getSalarioMinimo } from '../regrasLoas.ts';
import type { CasoLoas } from '../tipos.ts';

// Competência padrão para testes: 2024-01 -> Salário Mínimo = R$ 1.412,00 (141.200 centavos)
// Limite 1/4 SM = R$ 353,00 (35.300 centavos)
const COMP_2024 = '2024-01';

function baseCaso(override: Partial<CasoLoas> = {}): CasoLoas {
  return {
    id: 'caso-loas-test-01',
    tenantId: 'tenant-demo',
    advogadoResponsavelId: 'adv-01',
    categoria: 'IDOSO',
    requerente: {
      id: 'req-01',
      nome: 'José da Silva',
      cpf: '123.456.789-00',
      dataNascimento: '1955-05-10', // 68 anos em 2024
      laudoPcdImpedimentoLongoPrazo: false
    },
    grupo: [
      {
        id: 'req-01',
        nome: 'José da Silva',
        parentesco: 'REQUERENTE',
        dataNascimento: '1955-05-10',
        mesmoTeto: true,
        rendaBrutaCentavos: 0
      },
      {
        id: 'mem-02',
        nome: 'Maria da Silva',
        parentesco: 'CONJUGE',
        dataNascimento: '1958-03-12',
        mesmoTeto: true,
        rendaBrutaCentavos: 50000 // R$ 500,00
      }
    ],
    despesas: [],
    cadUnicoAtualizado: true,
    requerimentoAdministrativo: {
      numeroNB: '198.765.432-1',
      dataIndeferimento: '2024-01-15',
      motivo: 'Superação da renda per capita'
    },
    estagio: 'DIAGNOSTICO',
    versaoRegras: REGRAS_LOAS_V1.versao,
    ...override
  };
}

describe('Motor de Cálculo LOAS / BPC (Lei 8.742/93)', () => {
  test('1. Idoso elegível: per capita <= 1/4 SM com idade >= 65 anos e pré-requisitos atendidos', () => {
    // 2 membros, renda R$ 500,00 (50.000 centavos) -> per capita = R$ 250,00 (25.000 centavos) <= 35.300 centavos
    const caso = baseCaso();
    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.salarioMinimoCentavos, 141200);
    assert.equal(resultado.limiteCentavos, 35300);
    assert.equal(resultado.membrosComputados.length, 2);
    assert.equal(resultado.rendaBrutaTotalCentavos, 50000);
    assert.equal(resultado.perCapitaCentavos, 25000);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
    assert.equal(resultado.elegivelPorFlexibilizacao, 'NAO_AVALIADO');
    assert.equal(resultado.pendencias.length, 0);
  });

  test('2. PcD elegível só após deduções médicas aprovadas', () => {
    // Categoria DEFICIENCIA com laudo de impedimento de longo prazo
    // 2 membros: renda bruta = R$ 800,00 (80.000 centavos) -> sem deduções: 40.000 centavos per capita (> 35.300)
    // Despesa de saúde comprovada e não-SUS = R$ 200,00 (20.000 centavos)
    // Renda líquida = 60.000 centavos -> per capita = 30.000 centavos (<= 35.300) -> ELEGÍVEL!
    const caso = baseCaso({
      categoria: 'DEFICIENCIA',
      requerente: {
        id: 'req-pcd',
        nome: 'Lucas Oliveira',
        cpf: '222.333.444-55',
        dataNascimento: '1998-07-20',
        laudoPcdImpedimentoLongoPrazo: true
      },
      grupo: [
        {
          id: 'req-pcd',
          nome: 'Lucas Oliveira',
          parentesco: 'REQUERENTE',
          dataNascimento: '1998-07-20',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'mae-01',
          nome: 'Ana Oliveira',
          parentesco: 'MAE',
          dataNascimento: '1975-04-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 80000
        }
      ],
      despesas: [
        {
          id: 'desp-01',
          categoria: 'MEDICAMENTO',
          descricao: 'Canabidiol e anticonvulsivante de alto custo',
          valorMensalCentavos: 20000,
          disponivelNoSUS: false,
          comprovanteDocId: 'DOC-RECEITA-LAUDO-991'
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.rendaBrutaTotalCentavos, 80000);
    assert.equal(resultado.deducoesAceitas.length, 1);
    assert.equal(resultado.totalDeducoesAceitasCentavos, 20000);
    assert.equal(resultado.rendaLiquidaCentavos, 60000);
    assert.equal(resultado.perCapitaCentavos, 30000);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
  });

  test('3. Dedução recusada por estar disponível no SUS', () => {
    const caso = baseCaso({
      despesas: [
        {
          id: 'desp-sus',
          categoria: 'MEDICAMENTO',
          descricao: 'Losartana Potássica e Metformina',
          valorMensalCentavos: 15000,
          disponivelNoSUS: true, // Fornecido pelo SUS
          comprovanteDocId: 'DOC-RECEITA-123'
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.deducoesAceitas.length, 0);
    assert.equal(resultado.deducoesRecusadas.length, 1);
    assert.match(resultado.deducoesRecusadas[0].motivo, /SUS/i);
    assert.equal(resultado.totalDeducoesAceitasCentavos, 0);
  });

  test('4. Dedução recusada por ausência de comprovante documental', () => {
    const caso = baseCaso({
      despesas: [
        {
          id: 'desp-sem-doc',
          categoria: 'FRALDA',
          descricao: 'Fraldas geriátricas sem receita anexada',
          valorMensalCentavos: 18000,
          disponivelNoSUS: false,
          comprovanteDocId: '' // Sem comprovante
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.deducoesAceitas.length, 0);
    assert.equal(resultado.deducoesRecusadas.length, 1);
    assert.ok(resultado.deducoesRecusadas[0].motivo.toLowerCase().includes('comprobat'));
  });

  test('5. Membro familiar excluído por não residir sob o mesmo teto', () => {
    // Filho que mora em outro endereço com renda alta não contamina o grupo
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-01',
          nome: 'José da Silva',
          parentesco: 'REQUERENTE',
          dataNascimento: '1955-05-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'filho-fora',
          nome: 'Carlos da Silva',
          parentesco: 'FILHO_SOLTEIRO',
          dataNascimento: '1988-01-10',
          mesmoTeto: false, // Mora fora
          rendaBrutaCentavos: 400000 // R$ 4.000,00
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.membrosComputados.length, 1);
    assert.equal(resultado.membrosExcluidos.length, 1);
    assert.equal(resultado.membrosExcluidos[0].membro.nome, 'Carlos da Silva');
    assert.match(resultado.membrosExcluidos[0].motivo, /mesmo teto/i);
    assert.equal(resultado.rendaBrutaTotalCentavos, 0);
    assert.equal(resultado.perCapitaCentavos, 0);
  });

  test('6. BPC de outro membro do grupo familiar é legalmente excluído', () => {
    // Dois idosos na mesma casa: cônjuge já recebe BPC (1 SM). Pelo art. 20 §14 Lei 8.742/93, essa renda é desconsiderada
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-01',
          nome: 'José da Silva',
          parentesco: 'REQUERENTE',
          dataNascimento: '1955-05-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'conj-01',
          nome: 'Maria da Silva',
          parentesco: 'CONJUGE',
          dataNascimento: '1956-02-15',
          mesmoTeto: true,
          rendaBrutaCentavos: 141200, // R$ 1.412,00 de BPC
          rendaExcluida: {
            motivo: 'BPC_OUTRO_MEMBRO'
          }
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.membrosComputados.length, 2);
    const conjugeComputado = resultado.membrosComputados.find(m => m.id === 'conj-01');
    assert.ok(conjugeComputado);
    assert.equal(conjugeComputado.rendaConsideradaCentavos, 0);
    assert.equal(resultado.rendaBrutaTotalCentavos, 0);
    assert.equal(resultado.perCapitaCentavos, 0);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
  });

  test('7. Requerente com 64 anos e 364 dias é inelegível por idade (gera pendência)', () => {
    // Data de referência: 2024-01-15.
    // Nascido em 1959-01-16 -> em 2024-01-15 tem exatamente 64 anos e 364 dias (completa 65 no dia seguinte)
    const caso = baseCaso({
      requerente: {
        id: 'req-quase-65',
        nome: 'Antônio Quase Idoso',
        cpf: '444.555.666-77',
        dataNascimento: '1959-01-16'
      },
      requerimentoAdministrativo: {
        numeroNB: '111.222.333-4',
        dataIndeferimento: '2024-01-15'
      }
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.ok(resultado.pendencias.some(p => p.includes('65 anos')));
  });

  test('8. CadÚnico desatualizado gera pendência obrigatória', () => {
    const caso = baseCaso({
      cadUnicoAtualizado: false
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.ok(resultado.pendencias.some(p => p.includes('CadÚnico')));
  });

  test('9. Competência sem salário mínimo cadastrado lança erro explícito', () => {
    const caso = baseCaso();
    assert.throws(
      () => calcularLoas(caso, REGRAS_LOAS_V1, '1985-01'),
      /Salário mínimo não cadastrado para a competência/
    );
  });

  test('10. Hash determinístico: mesma entrada gera exatamente o mesmo hash SHA-256', () => {
    const caso = baseCaso();
    const res1 = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);
    const res2 = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(res1.hash, res2.hash);
    assert.match(res1.hash, /^[a-f0-9]{64}$/);
  });

  test('11. Grupo familiar de 1 pessoa (requerente vivendo sozinho)', () => {
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-sozinho',
          nome: 'Joaquim Solitário',
          parentesco: 'REQUERENTE',
          dataNascimento: '1950-01-01',
          mesmoTeto: true,
          rendaBrutaCentavos: 20000 // R$ 200,00
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.membrosComputados.length, 1);
    assert.equal(resultado.perCapitaCentavos, 20000);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
  });

  test('12. Renda zero em todo o grupo familiar', () => {
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-01',
          nome: 'José da Silva',
          parentesco: 'REQUERENTE',
          dataNascimento: '1955-05-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'conj-01',
          nome: 'Maria da Silva',
          parentesco: 'CONJUGE',
          dataNascimento: '1958-03-12',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.rendaBrutaTotalCentavos, 0);
    assert.equal(resultado.rendaLiquidaCentavos, 0);
    assert.equal(resultado.perCapitaCentavos, 0);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
  });

  test('13. Exclusão de aposentadoria de até 1 SM auferida por idoso (Estatuto do Idoso & RE 580.963)', () => {
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-01',
          nome: 'José da Silva',
          parentesco: 'REQUERENTE',
          dataNascimento: '1955-05-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'conj-idosa',
          nome: 'Maria da Silva',
          parentesco: 'CONJUGE',
          dataNascimento: '1952-01-01',
          mesmoTeto: true,
          rendaBrutaCentavos: 141200, // Aposentadoria de 1 SM
          rendaExcluida: {
            motivo: 'BENEFICIO_ATE_1SM_IDOSO_OU_PCD'
          }
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.rendaBrutaTotalCentavos, 0);
    assert.equal(resultado.perCapitaCentavos, 0);
    assert.equal(resultado.elegivelCriterioObjetivo, true);
  });

  test('14. Parentesco fora do rol legal (ex: PRIMO/OUTRO) é descartado do cômputo', () => {
    const caso = baseCaso({
      grupo: [
        {
          id: 'req-01',
          nome: 'José da Silva',
          parentesco: 'REQUERENTE',
          dataNascimento: '1955-05-10',
          mesmoTeto: true,
          rendaBrutaCentavos: 0
        },
        {
          id: 'primo-01',
          nome: 'Primo Distante',
          parentesco: 'OUTRO',
          dataNascimento: '1990-08-15',
          mesmoTeto: true,
          rendaBrutaCentavos: 300000 // R$ 3.000,00
        }
      ]
    });

    const resultado = calcularLoas(caso, REGRAS_LOAS_V1, COMP_2024);

    assert.equal(resultado.membrosComputados.length, 1);
    assert.equal(resultado.membrosExcluidos.length, 1);
    assert.match(resultado.membrosExcluidos[0].motivo, /rol legal/i);
    assert.equal(resultado.rendaBrutaTotalCentavos, 0);
  });

  test('15. Arredondamento Half-Even bancário determinístico em centavos', () => {
    // 102 centavos dividido por 4 = 25.5 -> 25 é ímpar, então arredonda para o par 26
    assert.equal(divideHalfEven(102, 4), 26);
    // 106 centavos dividido por 4 = 26.5 -> 26 é par, então arredonda para o par 26
    assert.equal(divideHalfEven(106, 4), 26);
    // 100 dividido por 4 = 25 exato
    assert.equal(divideHalfEven(100, 4), 25);
    // 101 dividido por 4 = 25.25 -> 25
    assert.equal(divideHalfEven(101, 4), 25);
    // 103 dividido por 4 = 25.75 -> 26
    assert.equal(divideHalfEven(103, 4), 26);
  });
});
