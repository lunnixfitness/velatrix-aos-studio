/**
 * Testes do Conflict Check Engine (P17). Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/conflictCheck.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validarCPF, validarCNPJ, raizCNPJ, normalizarNome, chaveFonetica, jaroWinkler, similaridadeNomes,
  criarIndice, executarConflictCheck, nivelPorScore, ConflitoInvalido, type SolicitacaoConflito, type EntidadeIndexada,
} from '../conflictCheck.ts';
import { BASE_CONFLITOS_DEMO, CENARIOS_CONFLITO, TENANT_DEMO } from '../../services/conflictCheckDemo.ts';

const AGORA = new Date('2026-09-29T12:00:00Z');
const idx = criarIndice(TENANT_DEMO, BASE_CONFLITOS_DEMO);
const sol = (id: string): SolicitacaoConflito => {
  const c = CENARIOS_CONFLITO.find((x) => x.id === id)!;
  return { id: `CHK-${id}`, tenantId: TENANT_DEMO, solicitanteId: 'u1', ...c.solicitacao };
};

describe('Documentos', () => {
  test('CPF/CNPJ com dígito verificador', () => {
    assert.ok(validarCPF('111.444.777-35'));
    assert.ok(!validarCPF('111.444.777-36'));
    assert.ok(!validarCPF('111.111.111-11'));
    assert.ok(validarCNPJ('12.345.678/0001-95'));
    assert.ok(!validarCNPJ('12.345.678/0001-96'));
    assert.equal(raizCNPJ('12.345.678/0002-76'), '12345678');
    assert.equal(raizCNPJ('111.444.777-35'), undefined);
  });
  test('toda a base demo tem documentos válidos', () => {
    for (const e of BASE_CONFLITOS_DEMO) {
      const docs = [e.documento, ...e.relacionadas.map((r) => r.documento)].filter(Boolean) as string[];
      for (const d of docs) assert.ok(d.replace(/\D/g, '').length === 11 ? validarCPF(d) : validarCNPJ(d), `${e.id}: ${d}`);
    }
  });
});

describe('Normalização e fonética PT-BR', () => {
  test('remove sufixos societários, acentos e conectivos', () => {
    assert.deepEqual(normalizarNome('Empresa Exemplo de Telecomunicações S.A.'), ['empresa', 'exemplo', 'telecomunicacoes']);
    assert.deepEqual(normalizarNome('JBS S/A'), ['jbs']);
    assert.deepEqual(normalizarNome('Silva & Filhos Ltda.'), ['silva', 'filhos']);
  });
  test('pares fonéticos clássicos colidem', () => {
    const k = (n: string) => chaveFonetica(normalizarNome(n, true)[0]);
    for (const [a, b] of [['Gonçalves', 'Gonsalves'], ['Xavier', 'Chavier'], ['Philippe', 'Felipe'], ['Thiago', 'Tiago'], ['Souza', 'Sousa'], ['Luiz', 'Luis'], ['Cecília', 'Sesília']]) {
      assert.equal(k(a), k(b), `${a} × ${b}`);
    }
    assert.notEqual(chaveFonetica('silva'), chaveFonetica('santos'));
  });
  test('Jaro-Winkler: vetor de referência', () => {
    assert.ok(Math.abs(jaroWinkler('martha', 'marhta') - 0.961) < 0.001);
    assert.equal(jaroWinkler('abc', 'abc'), 1);
    assert.equal(jaroWinkler('', 'abc'), 0);
  });
});

describe('Similaridade de nomes', () => {
  test('ordem dos tokens não importa', () => {
    assert.equal(similaridadeNomes('Construtora Silva Ramos', 'Ramos Silva Construtora LTDA').tipo, 'NOME_EXATO');
  });
  test('nome contido com descritor extra continua alto', () => {
    assert.ok(similaridadeNomes('Silva Ramos Construtora', 'Silva Ramos Construtora e Incorporadora S.A.').sim >= 85);
  });
  test('inicial abreviada casa com o nome completo', () => {
    assert.ok(similaridadeNomes('João Carlos da Silva', 'João C. Silva').sim >= 85);
  });
  test('um sobrenome comum sozinho não vira match forte', () => {
    assert.ok(similaridadeNomes('Silva', 'João Carlos da Silva').sim <= 72);
  });
  test('só descritores genéricos em comum não é o mesmo nome', () => {
    assert.ok(similaridadeNomes('Construtora Alfa', 'Construtora Beta').sim < 70);
  });
  test('simétrica', () => {
    const a = similaridadeNomes('Marcos Chavier Gonsalves', 'Marcos Xavier Gonçalves');
    const b = similaridadeNomes('Marcos Xavier Gonçalves', 'Marcos Chavier Gonsalves');
    assert.equal(a.sim, b.sim);
    assert.ok(a.sim >= 90);
    assert.equal(a.tipo, 'NOME_FONETICO');
  });
});

describe('Motor', () => {
  test('faixas de risco', () => {
    assert.equal(nivelPorScore(90), 'CRITICO');
    assert.equal(nivelPorScore(89), 'ALTO');
    assert.equal(nivelPorScore(70), 'ALTO');
    assert.equal(nivelPorScore(69), 'MEDIO');
    assert.equal(nivelPorScore(50), 'MEDIO');
    assert.equal(nivelPorScore(49), 'BAIXO');
  });

  test('Alpha: raiz de CNPJ contra parte contrária ativa = CRÍTICO, grupo econômico puxa a coligada', () => {
    const r = executarConflictCheck(sol('alpha'), idx, AGORA);
    assert.equal(r.status, 'REQUIRES_APPROVAL');
    assert.equal(r.nivel, 'CRITICO');
    assert.equal(r.acao, 'COMITE_COMPLIANCE');
    const top = r.hits[0];
    assert.equal(top.entidadeId, 'ENT-0001');
    assert.equal(top.tipoMatch, 'RAIZ_CNPJ');
    assert.ok(r.hits.some((h) => h.entidadeId === 'ENT-0002' && h.tipoMatch === 'GRUPO_ECONOMICO'));
    const socio = r.hits.find((h) => h.entidadeId === 'ENT-0003');
    assert.ok(socio && socio.similaridade >= 85, 'sócio João C. Silva encontrado por nome');
  });

  test('atuar contra cliente ativo: documento exato = 100 e barreira reportada', () => {
    const r = executarConflictCheck(sol('contra-cliente'), idx, AGORA);
    assert.equal(r.scoreMax, 100);
    assert.equal(r.hits[0].tipoMatch, 'DOCUMENTO_EXATO');
    assert.deepEqual(r.hits[0].barreiras, ['CW-TRIB-01']);
  });

  test('grafia divergente encontra sócio de cliente via parte relacionada', () => {
    const r = executarConflictCheck(sol('fonetico'), idx, AGORA);
    const h = r.hits.find((x) => x.entidadeId === 'ENT-0004');
    assert.ok(h, 'hit na Nexa via sócio');
    assert.equal(h!.via?.papel, 'SOCIO');
    assert.equal(h!.tipoMatch, 'NOME_FONETICO');
    const banco = r.hits.find((x) => x.entidadeId === 'ENT-0009');
    assert.ok(banco && banco.nivel === 'BAIXO', 'parte contrária × parte contrária não é conflito');
  });

  test('sem conflito = CLEAR e liberado', () => {
    const r = executarConflictCheck(sol('limpo'), idx, AGORA);
    assert.equal(r.status, 'CLEAR');
    assert.equal(r.acao, 'LIBERAR');
  });

  test('ex-cliente em quarentena (< 2 anos) como adverso pesa mais que após 2 anos', () => {
    const s: SolicitacaoConflito = { id: 'q', tenantId: TENANT_DEMO, solicitanteId: 'u', area: 'x', descricao: 'x', alvos: [
      { nome: 'Cliente Novo Ltda', papel: 'NOVO_CLIENTE' },
      { nome: 'Distribuidora Solaris', documento: '41.887.233/0001-35', papel: 'PARTE_CONTRARIA' },
    ] };
    const dentro = executarConflictCheck(s, idx, AGORA).hits.find((h) => h.entidadeId === 'ENT-0005')!;
    const fora = executarConflictCheck(s, idx, new Date('2028-01-01T00:00:00Z')).hits.find((h) => h.entidadeId === 'ENT-0005')!;
    assert.ok(dentro.score > fora.score);
    assert.equal(dentro.nivel, 'ALTO');
  });

  test('documento inválido gera aviso e cai para nome', () => {
    const s: SolicitacaoConflito = { id: 'd', tenantId: TENANT_DEMO, solicitanteId: 'u', area: 'x', descricao: 'x', alvos: [
      { nome: 'Veloz Transportes', documento: '66.024.117/0001-99', papel: 'NOVO_CLIENTE' },
    ] };
    const r = executarConflictCheck(s, idx, AGORA);
    assert.ok(r.avisos.some((a) => a.includes('inválido')));
    assert.equal(r.hits[0]?.entidadeId, 'ENT-0006');
    assert.notEqual(r.hits[0]?.tipoMatch, 'DOCUMENTO_EXATO');
  });

  test('isolamento de tenant: entidade de outro tenant nunca aparece', () => {
    const intrusa: EntidadeIndexada = { ...BASE_CONFLITOS_DEMO[0], id: 'X-1', tenantId: 'outro', documento: '12.345.678/0001-95' };
    const i2 = criarIndice(TENANT_DEMO, [...BASE_CONFLITOS_DEMO, intrusa]);
    const r = executarConflictCheck(sol('alpha'), i2, AGORA);
    assert.ok(!r.hits.some((h) => h.entidadeId === 'X-1'));
    assert.throws(() => executarConflictCheck({ ...sol('alpha'), tenantId: 'outro' }, idx, AGORA), ConflitoInvalido);
  });

  test('validações de entrada', () => {
    assert.throws(() => executarConflictCheck({ ...sol('alpha'), alvos: [] }, idx, AGORA), ConflitoInvalido);
    assert.throws(() => executarConflictCheck({ ...sol('alpha'), alvos: [{ nome: 'X', papel: 'PARTE_CONTRARIA' }] }, idx, AGORA), ConflitoInvalido);
  });

  test('determinístico: mesma entrada → mesmo resultado', () => {
    assert.deepEqual(executarConflictCheck(sol('alpha'), idx, AGORA), executarConflictCheck(sol('alpha'), idx, AGORA));
  });

  test('blocking: não avalia a base inteira', () => {
    const r = executarConflictCheck(sol('limpo'), idx, AGORA);
    assert.ok(r.candidatosAvaliados < BASE_CONFLITOS_DEMO.length);
  });
});
