/**
 *   node --experimental-strip-types --no-warnings --test src/documents/laudo/__tests__/emissao.nodetest.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pendenciasBase, pendenciasResponsavel, signerPendente, integridadeDasFontes, RESPONSAVEL_VAZIO,
  type BaseEmissao, type ResponsavelTecnico,
} from '../comum.ts';
import { pendenciasLaudoTributario, competenciasPrescritas, type EstadoTributario, type ConteudoTributario } from '../tributaria.ts';
import { pendenciasLaudoInss, type EstadoInss, type ConteudoInss } from '../inss.ts';
import { pendenciasLaudoPrecatorio, type EstadoPrecatorio, type ConteudoPrecatorio } from '../precatorio.ts';
import { pendenciasLaudoDiagnostico, type EstadoDiagnostico, type ConteudoDiagnostico } from '../diagnostico.ts';

const CNPJ_OK = '11.222.333/0001-81';
const CPF_OK = '529.982.247-25';
const TEXTO = 'Texto técnico redigido pelo responsável com mais de quarenta caracteres.';
const BASE: BaseEmissao = { estagiosPendentes: [], arquivosCustodia: 2, origemDados: 'documentos_custodiados', modoDemonstracao: false };
const CRC: ResponsavelTecnico = { nome: 'Fulana de Tal', conselho: 'CRC', registro: 'CRC-SP 123456/O-7' };
const OAB: ResponsavelTecnico = { nome: 'Beltrano Souza', conselho: 'OAB', registro: 'OAB/SP 123.456' };

// ───────────── comum ─────────────

test('comum: gerador de demonstração bloqueia fora do DEMO_MODE e passa dentro', () => {
  const fora = pendenciasBase({ ...BASE, origemDados: 'gerador_demonstracao' });
  assert.ok(fora.some((x) => /gerador de demonstração/.test(x)));
  assert.deepEqual(pendenciasBase({ ...BASE, origemDados: 'gerador_demonstracao', modoDemonstracao: true }), []);
});

test('comum: origem não informada, estágio pendente e sem custódia bloqueiam', () => {
  const p = pendenciasBase({ ...BASE, origemDados: 'nao_informada', estagiosPendentes: ['#3 Cruzamento'], arquivosCustodia: 0 });
  assert.equal(p.length, 3);
});

test('comum: responsável vazio, nome sem sobrenome e conselho não habilitado', () => {
  assert.equal(pendenciasResponsavel(RESPONSAVEL_VAZIO, ['CRC']).length, 3);
  assert.ok(pendenciasResponsavel({ ...CRC, nome: 'Fulana' }, ['CRC']).some((x) => /nome completo/.test(x)));
  assert.deepEqual(pendenciasResponsavel(CRC, ['OAB']), ['Conselho CRC não habilita este laudo (aceitos: OAB).']);
});

test('comum: signatário nunca afirma ICP-Brasil na emissão', () => {
  const s = signerPendente(CRC, 'Perito Contábil');
  assert.equal(s.signatureType, 'PENDENTE_ASSINATURA_ICP');
  assert.equal(s.credentialNumber, 'CRC-SP 123456/O-7');
  assert.equal(s.role, 'Perito Contábil (CRC)');
});

test('comum: integridade só afirma o que a origem sustenta', () => {
  assert.equal(integridadeDasFontes('documentos_custodiados'), 'ARQUIVOS_AUDITADOS');
  assert.equal(integridadeDasFontes('gerador_demonstracao'), 'DEMONSTRACAO_SEM_VALIDADE');
  assert.throws(() => integridadeDasFontes('nao_informada'));
});

// ───────────── tributária ─────────────

const TRIB: EstadoTributario = {
  ...BASE, cnpj: CNPJ_OK, competencias: ['2022-01', '2023-06', '2026-08'], dataReferencia: '2026-09-30', teses: ['Tema 69 STF'],
};
const TRIB_C: ConteudoTributario = { responsavel: CRC, fundamentacao: TEXTO, conclusao: TEXTO };

test('tributária: tudo certo, sem pendências', () => {
  assert.deepEqual(pendenciasLaudoTributario(TRIB, TRIB_C), []);
});

test('tributária: prescrição quinquenal (CTN 168, I) — mês-limite tratado como prescrito', () => {
  // ref 2026-09 → recolhimento em 2021-09 ou antes está fora
  assert.deepEqual(competenciasPrescritas(['2021-07', '2021-08', '2021-09', '2021-10'], '2026-09-30'), ['2021-07', '2021-08']);
  const p = pendenciasLaudoTributario({ ...TRIB, competencias: ['2020-01', '2024-01'] }, TRIB_C);
  assert.ok(p.some((x) => /prazo quinquenal/.test(x) && /2020-01/.test(x)));
});

test('tributária: CNPJ inválido, competência futura/ inválida, sem tese e OAB aceito', () => {
  const p = pendenciasLaudoTributario({ ...TRIB, cnpj: '11.222.333/0001-80', competencias: ['2027-01', '2026-13'], teses: [' '] }, { ...TRIB_C, responsavel: OAB });
  assert.ok(p.some((x) => /CNPJ/.test(x)));
  assert.ok(p.some((x) => /posteriores/.test(x)));
  assert.ok(p.some((x) => /formato inválido/.test(x)));
  assert.ok(p.some((x) => /tese/.test(x)));
  assert.ok(!p.some((x) => /Conselho/.test(x)));
});

// ───────────── INSS ─────────────

const INSS: EstadoInss = {
  ...BASE, cpf: CPF_OK, dataNascimento: '1968-05-14', der: '2026-09-01', cnisCustodiado: true,
  crossCheck: 'sem_divergencia', conselhosAceitos: ['OAB', 'CRC'], hoje: '2026-09-30',
};
const INSS_C: ConteudoInss = { responsavel: OAB, analise: TEXTO, conclusao: TEXTO };

test('INSS: tudo certo, sem pendências', () => {
  assert.deepEqual(pendenciasLaudoInss(INSS, INSS_C), []);
});

test('INSS: cross-check simulado bloqueia fora do demo; divergência bloqueia sempre', () => {
  assert.ok(pendenciasLaudoInss({ ...INSS, crossCheck: 'dados_simulados' }, INSS_C).some((x) => /simulados/.test(x)));
  assert.deepEqual(pendenciasLaudoInss({ ...INSS, crossCheck: 'dados_simulados', modoDemonstracao: true }, INSS_C), []);
  assert.ok(pendenciasLaudoInss({ ...INSS, crossCheck: 'divergencia', modoDemonstracao: true }, INSS_C).some((x) => /divergência/.test(x)));
});

test('INSS: CPF inválido, DER futura, sem CNIS e CRM não habilitado', () => {
  const p = pendenciasLaudoInss({ ...INSS, cpf: '123.456.789-00', der: '2026-10-15', cnisCustodiado: false },
    { ...INSS_C, responsavel: { ...OAB, conselho: 'CRM' } });
  assert.ok(p.some((x) => /CPF/.test(x)));
  assert.ok(p.some((x) => /DER no futuro/.test(x)));
  assert.ok(p.some((x) => /CNIS/.test(x)));
  assert.ok(p.some((x) => /CRM não habilita/.test(x)));
});

// ───────────── precatório ─────────────

const PREC: EstadoPrecatorio = {
  ...BASE, cnjOrigem: '5001234-15.2026.8.26.0100', numeroPrecatorio: '2026.00123', enteDevedor: 'Estado de São Paulo',
  natureza: 'alimentar', valorFace: 250000, credorDocumento: CPF_OK, dueDiligence: 'concluida', kyc: 'concluida',
  dataTransitoJulgado: '2023-04-10', hoje: '2026-09-30',
};
const PREC_C: ConteudoPrecatorio = { responsavel: OAB, parecer: TEXTO };

test('precatório: tudo certo, sem pendências', () => {
  assert.deepEqual(pendenciasLaudoPrecatorio(PREC, PREC_C), []);
});

test('precatório: KYC simulado, due diligence reprovada, valor zero e CNJ inválido', () => {
  const p = pendenciasLaudoPrecatorio({ ...PREC, kyc: 'simulada', dueDiligence: 'reprovada', valorFace: 0, cnjOrigem: '5001234-88.2026.8.26.0100' }, PREC_C);
  assert.ok(p.some((x) => /KYC do credor foi simulada/.test(x)));
  assert.ok(p.some((x) => /due diligence reprovada/i.test(x)));
  assert.ok(p.some((x) => /valor de face/.test(x)));
  assert.ok(p.some((x) => /dígito verificador/.test(x)));
});

test('precatório: trânsito em julgado ausente ou futuro bloqueia (nunca presumido)', () => {
  assert.ok(pendenciasLaudoPrecatorio({ ...PREC, dataTransitoJulgado: '' }, PREC_C).some((x) => /trânsito em julgado/.test(x)));
  assert.ok(pendenciasLaudoPrecatorio({ ...PREC, dataTransitoJulgado: '2027-01-01' }, PREC_C).some((x) => /no futuro/.test(x)));
});

// ───────────── diagnóstico ─────────────

const DIAG: EstadoDiagnostico = { ...BASE, cnpj: CNPJ_OK, exercicio: '2025', dreCustodiada: true, extratoCustodiado: true, anoAtual: 2026 };
const DIAG_C: ConteudoDiagnostico = { responsavel: CRC, conclusao: TEXTO };

test('diagnóstico: tudo certo, sem pendências', () => {
  assert.deepEqual(pendenciasLaudoDiagnostico(DIAG, DIAG_C), []);
});

test('diagnóstico: exercício futuro, sem DRE e OAB não habilitado', () => {
  const p = pendenciasLaudoDiagnostico({ ...DIAG, exercicio: '2027', dreCustodiada: false }, { ...DIAG_C, responsavel: OAB });
  assert.ok(p.some((x) => /posterior/.test(x)));
  assert.ok(p.some((x) => /DRE/.test(x)));
  assert.ok(p.some((x) => /OAB não habilita/.test(x)));
});
