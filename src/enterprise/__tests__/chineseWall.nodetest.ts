/**
 * Testes da Chinese Wall (P19). Rodam sem npm:
 *   node --experimental-strip-types --test src/enterprise/__tests__/chineseWall.nodetest.ts
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { criarIndice, executarConflictCheck, type SolicitacaoConflito } from '../conflictCheck.ts';
import { abrirCaso, decidir, motivoBloqueio, equipeCorresponde, type Decisor } from '../conflictApproval.ts';
import { parseRegistro, decisorDeMembro, membroDoUsuario, barreirasVigentes, avaliarAcesso, membrosBloqueados, type MembroRef } from '../chineseWall.ts';
import { BASE_CONFLITOS_DEMO, CENARIOS_CONFLITO, TENANT_DEMO } from '../../services/conflictCheckDemo.ts';

const T0 = new Date('2026-09-29T12:00:00Z');
const SELO = 'c'.repeat(64);
const idx = criarIndice(TENANT_DEMO, BASE_CONFLITOS_DEMO);
const sol = (id: string): SolicitacaoConflito => {
  const c = CENARIOS_CONFLITO.find((x) => x.id === id)!;
  return { id: `CHK-${id}`, tenantId: TENANT_DEMO, solicitanteId: 'intake-1', ...c.solicitacao };
};
const just = 'Barreira isolando a equipe que atende o cliente atual.';

const MEMBROS: MembroRef[] = [
  { id: 'usr_adv', name: 'Dra. Camila Prado', role: 'advogado_tributarista', department: 'Contencioso & Consultoria Tributária', professionalRegistry: 'OAB/SP 412.890', email: 'camila@x.adv.br' },
  { id: 'usr_cont', name: 'Dr. Marcelo Fagundes', role: 'contador_fiscal', department: 'Controladoria & Compliance Fiscal', professionalRegistry: 'CRC/SP 2SP194820/O-4' },
  { id: 'usr_perito', name: 'Eng. Renato', role: 'perito_judicial', department: 'Perícia Forense & Engenharia Legal', professionalRegistry: 'CNPC nº 4.812 / CFC' },
  { id: 'usr_ceo', name: 'Diretora', role: 'c_level_approver', department: 'Diretoria', professionalRegistry: 'OAB/RJ 100.200' },
];

function casoComBarreira() {
  const s = sol('contra-cliente');
  let c = abrirCaso(s, executarConflictCheck(s, idx, T0), SELO, 'Intake', T0);
  c = decidir(c, decisorDeMembro(MEMBROS[1]), {
    tipo: 'APROVAR_COM_CW', justificativa: just, hashExibido: SELO,
    chineseWall: { id: 'CW-1', descricao: 'Isolar Tributário', equipesBloqueadas: ['Tributário'], usuariosBloqueados: ['usr_perito'], materiasIsoladas: ['MAT-2025-201'] },
  }, T0);
  return decidir(c, decisorDeMembro(MEMBROS[3]), { tipo: 'APROVAR', justificativa: just, hashExibido: SELO }, T0);
}

describe('Registro profissional e membro', () => {
  test('parse dos formatos do cadastro', () => {
    assert.deepEqual(parseRegistro('OAB/SP 412.890'), { conselho: 'OAB', numero: 'SP 412.890' });
    assert.deepEqual(parseRegistro('CRC/SP 2SP194820/O-4'), { conselho: 'CRC', numero: 'SP 2SP194820/O-4' });
    assert.deepEqual(parseRegistro('CNPC nº 4.812 / CFC'), { conselho: 'CNPC', numero: '4.812 / CFC' });
    assert.equal(parseRegistro(undefined), undefined);
    assert.equal(parseRegistro('Matrícula 123'), undefined);
  });
  test('decisor herda registro e equipe do membro', () => {
    const d = decisorDeMembro(MEMBROS[0]);
    assert.equal(d.registroProfissional?.conselho, 'OAB');
    assert.equal(d.equipe, 'Contencioso & Consultoria Tributária');
  });
  test('membro do usuário por id ou e-mail', () => {
    assert.equal(membroDoUsuario(MEMBROS, { id: 'usr_cont' })?.name, 'Dr. Marcelo Fagundes');
    assert.equal(membroDoUsuario(MEMBROS, { id: 'outro', email: 'CAMILA@x.adv.br' })?.id, 'usr_adv');
    assert.equal(membroDoUsuario(MEMBROS, null), undefined);
  });
});

describe('Correspondência de equipe', () => {
  test('radical ignora acento, gênero e plural', () => {
    assert.ok(equipeCorresponde('Tributário', 'Contencioso & Consultoria Tributária'));
    assert.ok(equipeCorresponde('trabalhista', 'Equipe Trabalhistas'));
    assert.ok(!equipeCorresponde('Tributário', 'Controladoria & Compliance Fiscal'));
    assert.ok(!equipeCorresponde('Perícia Judicial', 'Perícia Forense & Engenharia Legal'), 'exige todos os radicais');
    assert.ok(!equipeCorresponde('Tributário', undefined));
  });
});

describe('Barreiras vigentes e acesso', () => {
  const c = casoComBarreira();
  const barreiras = barreirasVigentes([c]);

  test('só casos aprovados com CW geram barreira', () => {
    assert.equal(c.status, 'APPROVED_WITH_CHINESE_WALL');
    assert.equal(barreiras.length, 1);
    assert.equal(barreiras[0].casoId, c.id);
    const s = sol('alpha');
    assert.equal(barreirasVigentes([abrirCaso(s, executarConflictCheck(s, idx, T0), SELO, 'I', T0)]).length, 0);
  });

  test('equipe bloqueada não acessa caso, matéria isolada nem cliente (doc e raiz)', () => {
    const adv = { id: 'usr_adv', equipe: MEMBROS[0].department };
    assert.equal(avaliarAcesso(adv, { casoId: c.id }, barreiras).permitido, false);
    assert.equal(avaliarAcesso(adv, { materiaId: 'MAT-2025-201' }, barreiras).permitido, false);
    assert.equal(avaliarAcesso(adv, { documento: '90.712.045/0001-81' }, barreiras).permitido, false);
    assert.equal(avaliarAcesso(adv, { documento: '90.712.045/0002-62' }, barreiras).permitido, false, 'filial pela raiz');
    assert.equal(avaliarAcesso(adv, { materiaId: 'OUTRA' }, barreiras).permitido, true);
  });

  test('usuário bloqueado individualmente; demais equipes passam', () => {
    assert.equal(avaliarAcesso({ id: 'usr_perito', equipe: MEMBROS[2].department }, { casoId: c.id }, barreiras).permitido, false);
    const r = avaliarAcesso({ id: 'usr_cont', equipe: MEMBROS[1].department }, { casoId: c.id }, barreiras);
    assert.equal(r.permitido, true);
  });

  test('lista de membros bloqueados', () => {
    assert.deepEqual(membrosBloqueados(barreiras[0], MEMBROS).map((m) => m.id).sort(), ['usr_adv', 'usr_perito']);
  });
});

describe('Decisão respeita a barreira', () => {
  test('quem está do lado bloqueado não decide a etapa seguinte', () => {
    const s = sol('contra-cliente');
    let c = abrirCaso(s, executarConflictCheck(s, idx, T0), SELO, 'Intake', T0);
    c = decidir(c, decisorDeMembro(MEMBROS[1]), {
      tipo: 'APROVAR_COM_CW', justificativa: just, hashExibido: SELO,
      chineseWall: { id: 'CW-2', descricao: 'Isolar Diretoria', equipesBloqueadas: ['Diretoria'], usuariosBloqueados: [], materiasIsoladas: [] },
    }, T0);
    const ceo: Decisor = decisorDeMembro(MEMBROS[3]);
    assert.match(motivoBloqueio(c, ceo)!, /lado bloqueado/);
  });
});
