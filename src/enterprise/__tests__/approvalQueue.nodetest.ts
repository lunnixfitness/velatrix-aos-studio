/**
 * P20 · A fila de aprovação agora roda no servidor (src/server/enterprise/routes.ts).
 * Aqui ficam os invariantes puros que servidor e UI compartilham: política por papel,
 * seed DEMO coerente com o guardrail e regras do hitl usadas pelas rotas.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_APPROVE, podeAprovarEsteira, ESTEIRAS } from '../approvalPolicy.ts';
import { DEMO_SEED, valorExposto } from '../demoSeed.ts';
import { verificarTexto } from '../guardrail.ts';
import { NormaRegistry, NORMAS_SEED } from '../normaRef.ts';
import { aprovar, criarPorAgente, registrarRevisao, aprovacoesNecessarias, POLITICA_PADRAO } from '../hitl.ts';
import { enterpriseStore } from '../../server/enterprise/store.ts';

const normas = new NormaRegistry(NORMAS_SEED);
const hoje = '2026-09-28';
const guard = (p: (typeof DEMO_SEED)[number]['payload']) =>
  verificarTexto(p.textoLaudo, { centavos: p.memoriaCalculo.map((l) => l.valorCentavos) }, normas, hoje);

test('super_admin (fabricante) não aprova laudo de tenant', () => {
  for (const e of ESTEIRAS) assert.equal(podeAprovarEsteira('super_admin', e), false);
  assert.equal(podeAprovarEsteira(undefined, 'INSS'), false);
  assert.equal(podeAprovarEsteira('operator', 'INSS'), false);
  assert.equal(podeAprovarEsteira('tenant_admin', 'PRECATORIA'), true);
  assert.equal(podeAprovarEsteira('cfo_executive', 'PERICIA_JUDICIAL'), false);
  for (const lista of Object.values(ROLE_APPROVE)) for (const e of lista) assert.ok(ESTEIRAS.includes(e));
});

test('seed DEMO: guardrail aprova os laudos coerentes e bloqueia o INSS proposital', () => {
  const byRef = Object.fromEntries(DEMO_SEED.map((d) => [d.ref, d]));
  assert.equal(guard(byRef['WI-RT-0192'].payload).status, 'APROVADO');
  assert.equal(guard(byRef['WI-PR-0077'].payload).status, 'APROVADO');
  assert.equal(guard(byRef['WI-PJ-0310'].payloadAposRevisao!).status, 'APROVADO');
  const inss = guard(byRef['WI-IN-0045'].payload);
  assert.equal(inss.status, 'BLOQUEADO');
  assert.ok(inss.citacoesDesconhecidas.length > 0 && inss.percentuaisNaoRastreados.includes('12%'));
});

test('seed DEMO: precatório RED de R$ 1,25 mi exige 4 olhos', () => {
  const pr = DEMO_SEED.find((d) => d.ref === 'WI-PR-0077')!;
  const item = criarPorAgente(pr.agente, {
    id: 'x', tenantId: 't', esteira: pr.esteira, tipo: pr.tipo, payloadHash: 'h'.repeat(64), riscoFlag: pr.riscoFlag,
    valorEnvolvidoCentavos: valorExposto(pr.payload), idempotencyKey: 'k', status: 'READY_FOR_REVIEW',
  });
  assert.equal(aprovacoesNecessarias(item, POLITICA_PADRAO), 2);
});

test('aprovação exige o hash exibido igual ao atual e aprovadores distintos', () => {
  const agora = new Date('2026-09-28T12:00:00Z');
  const base = criarPorAgente('Fiscal', {
    id: 'y', tenantId: 't', esteira: 'PRECATORIA', tipo: 'GERAR_LAUDO_FINAL', payloadHash: 'a'.repeat(64), riscoFlag: 'RED',
    valorEnvolvidoCentavos: 1, idempotencyKey: 'k2', status: 'READY_FOR_REVIEW',
  });
  const revisado = registrarRevisao(base, 'u1', base.payloadHash);
  const ap = (userId: string) => ({ userId, permissoes: ['approve:PRECATORIA'], registroProfissional: { conselho: 'OAB' as const, numero: '1' }, ultimoStepUpEm: agora.toISOString() });
  assert.throws(() => aprovar(revisado, ap('u1'), 'b'.repeat(64), agora), /alterado/);
  const um = aprovar(revisado, ap('u1'), base.payloadHash, agora);
  assert.equal(um.status, 'READY_FOR_REVIEW');
  assert.throws(() => aprovar(um, ap('u1'), base.payloadHash, agora), /outra pessoa/);
  assert.equal(aprovar(um, ap('u2'), base.payloadHash, agora).status, 'APPROVED');
});

test('isolamento de tenant: trocar tenant ativo omite e bloqueia entidades de outro tenant', () => {
  const agora = new Date().toISOString();
  const runId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const idBio = `wi-bio-${runId}`;
  const idMet = `wi-met-${runId}`;

  // Server: WorkItems isolados por tenant
  enterpriseStore.putWorkItem('tenant_biohospitalis', {
    item: {
      id: idBio,
      tenantId: 'tenant_biohospitalis',
      esteira: 'RECUPERACAO_TRIBUTARIA',
      tipo: 'GERAR_LAUDO_FINAL',
      status: 'READY_FOR_REVIEW',
      payloadHash: 'a'.repeat(64),
      riscoFlag: 'GREEN',
      valorEnvolvidoCentavos: 100000,
      aprovacoes: [],
      idempotencyKey: `idem-bio-${runId}`,
    },
    payload: { titulo: 'Laudo BioHospitalis' },
    criadoEm: agora,
    atualizadoEm: agora,
  });

  enterpriseStore.putWorkItem('tenant_metalurgica', {
    item: {
      id: idMet,
      tenantId: 'tenant_metalurgica',
      esteira: 'RECUPERACAO_TRIBUTARIA',
      tipo: 'GERAR_LAUDO_FINAL',
      status: 'READY_FOR_REVIEW',
      payloadHash: 'b'.repeat(64),
      riscoFlag: 'GREEN',
      valorEnvolvidoCentavos: 200000,
      aprovacoes: [],
      idempotencyKey: `idem-met-${runId}`,
    },
    payload: { titulo: 'Laudo Metalúrgica São Bento' },
    criadoEm: agora,
    atualizadoEm: agora,
  });

  // BioHospitalis lista apenas seus work items
  const itemsBio = enterpriseStore.listWorkItems('tenant_biohospitalis');
  assert.ok(itemsBio.some((w) => w.item.id === idBio));
  assert.ok(!itemsBio.some((w) => w.item.id === idMet));

  // Acesso direto ao item da Metalúrgica a partir do contexto BioHospitalis é nulo no store
  assert.equal(enterpriseStore.getWorkItem('tenant_biohospitalis', idMet), undefined);
  // O item existe em outro tenant (dispara 403 no HTTP)
  assert.equal(enterpriseStore.hasWorkItemAnyTenant(idMet), true);

  // Server: Laudos isolados por tenant
  const laudoBioId = `LDO-BIO-${runId}`;
  const laudoMetId = `LDO-MET-${runId}`;

  enterpriseStore.putLaudo('tenant_biohospitalis', {
    reportId: laudoBioId,
    serviceId: 'tax_recovery',
    auditHash: '0x' + 'c'.repeat(64),
    emitidoPor: 'user-bio',
    registradoEmUTC: agora,
    report: { reportId: laudoBioId, tenantId: 'tenant_biohospitalis', tenantName: 'BioHospitalis S.A.' },
  });

  enterpriseStore.putLaudo('tenant_metalurgica', {
    reportId: laudoMetId,
    serviceId: 'tax_recovery',
    auditHash: '0x' + 'd'.repeat(64),
    emitidoPor: 'user-met',
    registradoEmUTC: agora,
    report: { reportId: laudoMetId, tenantId: 'tenant_metalurgica', tenantName: 'Metalúrgica São Bento S.A.' },
  });

  const laudosBio = enterpriseStore.listLaudos('tenant_biohospitalis');
  assert.ok(laudosBio.itens.some((l) => l.reportId === laudoBioId));
  assert.ok(!laudosBio.itens.some((l) => l.reportId === laudoMetId));
  assert.equal(enterpriseStore.getLaudo('tenant_biohospitalis', laudoMetId), undefined);
  assert.equal(enterpriseStore.hasLaudoAnyTenant(laudoMetId), true);

  // Client: validação da regra de filtragem por tenant ativo (ex.: BioHospitalis nunca exibe Metalúrgica)
  const clientReportsPool = [
    { reportId: 'LDO-CLIENT-BIO', tenantId: 'tenant_biohospitalis', tenantName: 'BioHospitalis S.A.' },
    { reportId: 'LDO-CLIENT-MET', tenantId: 'tenant_metalurgica', tenantName: 'Metalúrgica São Bento S.A.' },
    { reportId: 'LDO-CLIENT-MV', tenantId: 'tenant_vanguarda', tenantName: 'Monteiro & Vasconcelos' },
  ];

  const filterByTenant = (tenantId: string) => clientReportsPool.filter((r) => r.tenantId === tenantId);

  // Ao trocar tenant ativo para BioHospitalis, laudos de Metalúrgica e Monteiro & Vasconcelos são omitidos
  const bioFiltered = filterByTenant('tenant_biohospitalis');
  assert.equal(bioFiltered.length, 1);
  assert.equal(bioFiltered[0].tenantName, 'BioHospitalis S.A.');
  assert.ok(!bioFiltered.some((r) => r.tenantName === 'Metalúrgica São Bento S.A.'));
  assert.ok(!bioFiltered.some((r) => r.tenantName === 'Monteiro & Vasconcelos'));

  // Trocar tenant para Metalúrgica → apenas Metalúrgica
  const metFiltered = filterByTenant('tenant_metalurgica');
  assert.equal(metFiltered.length, 1);
  assert.equal(metFiltered[0].tenantName, 'Metalúrgica São Bento S.A.');
});

