/**
 * Testes da aprovação de conflito (P18). Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/conflictApproval.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { criarIndice, executarConflictCheck, type SolicitacaoConflito } from '../conflictCheck.ts';
import {
  abrirCaso, decidir, registrarCiencia, reexecutar, cancelar, motivoBloqueio, etapaAtual, podeAbrirEsteira,
  exigeChineseWall, barreiraBloqueia, TransicaoCasoInvalida, DecisaoNegada, type Decisor,
} from '../conflictApproval.ts';
import { BASE_CONFLITOS_DEMO, CENARIOS_CONFLITO, TENANT_DEMO } from '../../services/conflictCheckDemo.ts';

const T0 = new Date('2026-09-29T12:00:00Z');
const SELO = 'a'.repeat(64);
const SELO2 = 'b'.repeat(64);
const idx = criarIndice(TENANT_DEMO, BASE_CONFLITOS_DEMO);
const sol = (id: string, solicitanteId = 'intake-1'): SolicitacaoConflito => {
  const c = CENARIOS_CONFLITO.find((x) => x.id === id)!;
  return { id: `CHK-${id}`, tenantId: TENANT_DEMO, solicitanteId, ...c.solicitacao };
};
const caso = (id: string) => { const s = sol(id); return abrirCaso(s, executarConflictCheck(s, idx, T0), SELO, 'Ana Intake', T0); };

const socio: Decisor = { userId: 'u-socio', nome: 'Dra. Paula', role: 'advogado_tributarista', registroProfissional: { conselho: 'OAB', numero: 'DEMO-1' } };
const comite: Decisor = { userId: 'u-comite', nome: 'Dr. Roberto', role: 'c_level_approver', registroProfissional: { conselho: 'OAB', numero: 'DEMO-2' } };
const just = 'Analisado: equipes distintas, sem acesso cruzado a documentos.';

describe('Abertura', () => {
  test('status e etapas por nível', () => {
    const crit = caso('alpha');
    assert.equal(crit.status, 'REQUIRES_APPROVAL');
    assert.deepEqual(crit.etapas, ['SOCIO_AREA', 'COMITE_COMPLIANCE']);
    assert.equal(caso('fonetico').status, 'AGUARDANDO_CIENCIA');
    const limpo = caso('limpo');
    assert.equal(limpo.status, 'CLEAR');
    assert.ok(podeAbrirEsteira(limpo));
    assert.equal(crit.eventos[0].tipo, 'CASO_ABERTO');
  });
  test('selo inválido é recusado', () => {
    const s = sol('alpha');
    assert.throws(() => abrirCaso(s, executarConflictCheck(s, idx, T0), 'xyz', 'A', T0), TransicaoCasoInvalida);
  });
});

describe('Quatro olhos no CRÍTICO', () => {
  test('sócio aprova etapa 1, comitê aprova etapa 2 → APPROVED', () => {
    let c = caso('alpha');
    c = decidir(c, socio, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.equal(c.status, 'REQUIRES_APPROVAL');
    assert.equal(etapaAtual(c), 'COMITE_COMPLIANCE');
    assert.ok(!podeAbrirEsteira(c));
    c = decidir(c, comite, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.equal(c.status, 'APPROVED');
    assert.ok(podeAbrirEsteira(c));
    assert.deepEqual(c.eventos.map((e) => e.tipo), ['CASO_ABERTO', 'ETAPA_APROVADA', 'ETAPA_APROVADA', 'CASO_APROVADO']);
  });
  test('mesma pessoa não aprova as duas etapas', () => {
    const admin: Decisor = { ...comite, userId: 'u-x' };
    const c = decidir(caso('alpha'), admin, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.match(motivoBloqueio(c, admin)!, /outra pessoa/);
    assert.throws(() => decidir(c, admin, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0), DecisaoNegada);
  });
  test('perfil sem alçada não decide a etapa do comitê', () => {
    const c = decidir(caso('alpha'), comite, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.match(motivoBloqueio(c, socio)!, /não decide a etapa Comitê/);
  });
});

describe('Guardas', () => {
  test('super_admin (fabricante) não decide', () => {
    const sa: Decisor = { userId: 'sa', nome: 'SA', role: 'super_admin', registroProfissional: { conselho: 'OAB', numero: '1' } };
    assert.match(motivoBloqueio(caso('alpha'), sa)!, /não decide/);
  });
  test('sem registro profissional não decide', () => {
    assert.match(motivoBloqueio(caso('alpha'), { ...socio, registroProfissional: undefined })!, /registro profissional/);
  });
  test('solicitante não decide o próprio caso', () => {
    assert.match(motivoBloqueio(caso('alpha'), { ...socio, userId: 'intake-1' })!, /próprio caso/);
  });
  test('hash revisado diferente do selo atual é negado', () => {
    assert.throws(() => decidir(caso('alpha'), socio, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO2 }, T0), /mudou/);
  });
  test('justificativa curta é negada', () => {
    assert.throws(() => decidir(caso('alpha'), socio, { tipo: 'APROVAR', justificativa: 'ok', hashExibido: SELO }, T0), /justificativa/);
  });
});

describe('Chinese Wall', () => {
  test('atuar contra cliente ativo exige barreira', () => {
    const c = caso('contra-cliente');
    assert.ok(exigeChineseWall(c.resultado));
    assert.throws(() => decidir(c, socio, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0), /Chinese Wall/);
  });
  test('barreira sem equipe/usuário é negada', () => {
    assert.throws(() => decidir(caso('contra-cliente'), socio, {
      tipo: 'APROVAR_COM_CW', justificativa: just, hashExibido: SELO,
      chineseWall: { id: 'CW-1', descricao: 'Isolar', equipesBloqueadas: [], usuariosBloqueados: [], materiasIsoladas: [] },
    }, T0), /ao menos uma equipe/);
  });
  test('aprovar com barreira em duas etapas → APPROVED_WITH_CHINESE_WALL e barreira bloqueia equipe', () => {
    let c = caso('contra-cliente');
    c = decidir(c, socio, {
      tipo: 'APROVAR_COM_CW', justificativa: just, hashExibido: SELO,
      chineseWall: { id: 'CW-1', descricao: 'Isolar equipe tributária da Nexa', equipesBloqueadas: ['Tributário'], usuariosBloqueados: [], materiasIsoladas: ['MAT-2025-201'] },
    }, T0);
    c = decidir(c, comite, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.equal(c.status, 'APPROVED_WITH_CHINESE_WALL');
    assert.ok(barreiraBloqueia(c.chineseWall, { id: 'qualquer', equipe: 'tributário' }));
    assert.ok(!barreiraBloqueia(c.chineseWall, { id: 'qualquer', equipe: 'Consumidor' }));
    assert.ok(c.eventos.some((e) => e.tipo === 'CHINESE_WALL_APLICADA'));
  });
});

describe('Recusa, informação, ciência, cancelamento', () => {
  test('recusar é terminal', () => {
    const c = decidir(caso('alpha'), socio, { tipo: 'RECUSAR', justificativa: just, hashExibido: SELO }, T0);
    assert.equal(c.status, 'REJECTED');
    assert.throws(() => cancelar(c, 'intake-1', 'Ana', 'desistiu', T0), TransicaoCasoInvalida);
  });
  test('pedir info → reexecutar zera decisões e troca o selo', () => {
    let c = decidir(caso('alpha'), socio, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    c = decidir(c, comite, { tipo: 'PEDIR_INFO', justificativa: 'Informar CNPJ do sócio João Carlos da Silva.', hashExibido: SELO }, T0);
    assert.equal(c.status, 'INFO_REQUESTED');
    assert.throws(() => reexecutar(c, c.solicitacao, c.resultado, SELO2, 'outro', 'X', T0), DecisaoNegada);
    const s2 = { ...c.solicitacao, alvos: c.solicitacao.alvos.map((a) => (a.papel === 'SOCIO_ALVO' ? { ...a, documento: '563.490.217-70' } : a)) };
    const r2 = executarConflictCheck(s2, idx, T0);
    c = reexecutar(c, s2, r2, SELO2, 'intake-1', 'Ana', T0);
    assert.equal(c.versao, 2);
    assert.equal(c.decisoes.length, 0);
    assert.equal(c.seloResultado, SELO2);
    assert.equal(c.status, 'REQUIRES_APPROVAL');
  });
  test('ciência só pelo solicitante', () => {
    const c = caso('fonetico');
    assert.throws(() => registrarCiencia(c, 'outro', 'X', T0), DecisaoNegada);
    const ok = registrarCiencia(c, 'intake-1', 'Ana', T0);
    assert.equal(ok.status, 'CLEAR_WITH_NOTICE');
    assert.ok(podeAbrirEsteira(ok));
  });
  test('cancelar exige motivo e solicitante', () => {
    const c = caso('alpha');
    assert.throws(() => cancelar(c, 'intake-1', 'Ana', '  ', T0), DecisaoNegada);
    assert.equal(cancelar(c, 'intake-1', 'Ana', 'Cliente desistiu', T0).status, 'CANCELLED');
  });
  test('imutabilidade: operações não alteram o caso original', () => {
    const c = caso('alpha');
    const antes = JSON.stringify(c);
    decidir(c, socio, { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
    assert.equal(JSON.stringify(c), antes);
  });
});
