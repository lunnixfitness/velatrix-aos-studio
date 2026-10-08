import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairCadUnico, extrairIndeferimento, extrairCnis, cpfValido, dataBrParaIso,
  podeEnviarParaLlmExterno, LIMIAR_CONFIANCA,
} from '../intake/extratoresLoas.ts';
import { compararCadUnico } from '../intake/divergenciaCadUnico.ts';
import { gerarMinuta, verificarGuardrail, chaveCitacao } from '../drafter.ts';
import { planejarFracionamento, perfilPara, type DocAnexo } from '../fracionador.ts';
import { aprovar, aprovacaoValida, hashAnexos, ErroAprovacao, type Usuario } from '../aprovacao.ts';
import { DemoSigner, CloudPscSigner, HsmPkcs11Signer, ErroAssinatura, type SolicitacaoAssinatura } from '../assinatura.ts';
import type { CasoLoas, ResultadoCalculoLoas } from '../tipos.ts';
import type { TeseCurada } from '../regrasLoas.ts';

// ───────── fixtures fictícias ─────────
const CPF_OK = '52998224725'; // CPF de teste válido (dígitos verificadores)
const TXT_CADUNICO = `COMPROVANTE DE CADASTRAMENTO
Código Familiar: 1234567890-1
Data da última atualização: 15/03/2026
MARIA DA SILVA SOUZA CPF 529.982.247-25 Parentesco: RESPONSAVEL
JOAO DA SILVA SOUZA Parentesco: FILHO(A)`;
const TXT_INDEF = `COMUNICAÇÃO DE DECISÃO
NB: 712.345.678-9  Espécie: 87
Data da decisão: 02/05/2026
Motivo do indeferimento: renda per capita familiar igual ou superior a 1/4 do salário mínimo.`;
const TXT_CNIS = `CNIS - Cadastro Nacional de Informações Sociais
Vínculo EMPRESA X LTDA Início: 01/02/2015 Fim: 30/06/2019
Vínculo EMPRESA Y LTDA Início: 01/08/2022
NB 601.234.567-1 Espécie 41 DIB 01/01/2020 DCB 01/06/2020`;

const TESES: TeseCurada[] = [
  { id: 'STF_RE_567985', titulo: 'Critério de 1/4 do SM não é absoluto', fundamento: 'STF, RE 567.985 (Tema 27).', ativa: true, revisadoPor: 'adv-rev', revisadoEm: '2026-09-30' },
  { id: 'TESE_INATIVA', titulo: 'Tese antiga', fundamento: 'REsp 999.999', ativa: false, revisadoPor: 'x', revisadoEm: '2020-01-01' },
];

const CASO: CasoLoas = {
  id: 'caso-1', tenantId: 't1', advogadoResponsavelId: 'adv-jr', categoria: 'DEFICIENCIA',
  requerente: { id: 'r1', nome: 'JOAO DA SILVA SOUZA', cpf: CPF_OK, dataNascimento: '2012-04-10', laudoPcdImpedimentoLongoPrazo: true },
  grupo: [
    { id: 'm1', nome: 'Maria da Silva Souza', parentesco: 'MAE', dataNascimento: '1985-01-01', mesmoTeto: true, rendaBrutaCentavos: 162100 },
    { id: 'm2', nome: 'João da Silva Souza', parentesco: 'REQUERENTE', dataNascimento: '2012-04-10', mesmoTeto: true, rendaBrutaCentavos: 0 },
  ],
  despesas: [], cadUnicoAtualizado: true,
  requerimentoAdministrativo: { numeroNB: '7123456789', dataIndeferimento: '2026-05-02', motivo: 'renda per capita' },
  estagio: 'EXECUCAO', versaoRegras: '1.0.0',
};
const CALC = {
  competencia: '2026-09', salarioMinimoCentavos: 162100, rendaBrutaTotalCentavos: 162100, totalDeducoesAceitasCentavos: 59000,
  rendaLiquidaCentavos: 103100, perCapitaCentavos: 51550, limiteCentavos: 40525, elegivelCriterioObjetivo: false,
  elegivelPorFlexibilizacao: 'POSSIVEL', pendencias: [], versaoRegras: '1.0.0', hash: 'a'.repeat(64),
  membrosComputados: [], membrosExcluidos: [], deducoesAceitas: [], deducoesRecusadas: [], memoriaDeCalculo: [],
} as unknown as ResultadoCalculoLoas;

const ESTAG: Usuario = { id: 'adv-jr', tenantId: 't1', senioridade: 'JUNIOR' };
const SENIOR: Usuario = { id: 'adv-sr', tenantId: 't1', senioridade: 'SENIOR' };

const minutaBase = () => gerarMinuta({
  caso: CASO, calculo: CALC, teses: TESES, tesesSelecionadas: ['STF_RE_567985'],
  juizo: { orgao: 'Juizado Especial Federal', subsecao: 'Subseção Judiciária de Teste' },
  advogado: { nome: 'Dra. Teste Sênior', oab: 'SP 000000' },
}, new Date('2026-10-01T12:00:00Z'));

// ───────── utilitários ─────────
describe('utilitários', () => {
  test('CPF válido e inválido', () => {
    assert.equal(cpfValido(CPF_OK), true);
    assert.equal(cpfValido('52998224724'), false);
    assert.equal(cpfValido('11111111111'), false);
  });
  test('data BR → ISO rejeita data impossível', () => {
    assert.equal(dataBrParaIso('29/02/2024'), '2024-02-29');
    assert.equal(dataBrParaIso('31/02/2026'), null);
  });
});

// ───────── intake ─────────
describe('extratores', () => {
  test('CadÚnico extrai data, código e membros', () => {
    const r = extrairCadUnico(TXT_CADUNICO);
    assert.equal(r.dados.dataAtualizacao.valor, '2026-03-15');
    assert.equal(r.dados.codigoFamiliar.valor, '12345678901');
    assert.equal(r.dados.membros.valor?.length, 2);
    assert.equal(r.dados.membros.valor?.[0].cpf, CPF_OK);
    assert.equal(r.pendencias.length, 0);
  });
  test('CadÚnico com OCR ruim gera pendência, não assume valor', () => {
    const r = extrairCadUnico(TXT_CADUNICO, 0.3);
    assert.ok(r.dados.dataAtualizacao.confianca < LIMIAR_CONFIANCA);
    assert.ok(r.pendencias.some((p) => p.motivo === 'BAIXA_CONFIANCA'));
    assert.ok(r.pendencias.some((p) => p.motivo === 'OCR_BAIXA_QUALIDADE'));
  });
  test('Indeferimento extrai NB, data, espécie e motivo', () => {
    const r = extrairIndeferimento(TXT_INDEF);
    assert.equal(r.dados.numeroNB.valor, '7123456789');
    assert.equal(r.dados.dataDecisao.valor, '2026-05-02');
    assert.equal(r.dados.especie.valor, '87');
    assert.match(r.dados.motivo.valor ?? '', /renda per capita/);
    assert.equal(r.pendencias.length, 0);
  });
  test('Indeferimento sem NB vira pendência', () => {
    const r = extrairIndeferimento('Documento ilegível');
    assert.ok(r.pendencias.some((p) => p.campo === 'numeroNB' && p.motivo === 'NAO_ENCONTRADO'));
  });
  test('CNIS conta vínculo ativo e benefícios', () => {
    const r = extrairCnis(TXT_CNIS);
    assert.equal(r.dados.vinculosAtivos.valor, 1);
    assert.equal(r.dados.beneficios.valor?.[0].especie, '41');
    assert.equal(r.dados.beneficios.valor?.[0].fim, '2020-06-01');
  });
  test('Laudo médico só vai a LLM externo com ZDR', () => {
    assert.equal(podeEnviarParaLlmExterno('LAUDO_MEDICO', undefined), false);
    assert.equal(podeEnviarParaLlmExterno('LAUDO_MEDICO', { zdrHabilitado: true }), true);
    assert.equal(podeEnviarParaLlmExterno('CADUNICO', undefined), true);
  });
});

describe('divergência CadÚnico', () => {
  test('casa por CPF e por nome; acusa membro não declarado', () => {
    const cad = extrairCadUnico(TXT_CADUNICO).dados.membros.valor!;
    const decl = [
      { ...CASO.grupo[0], cpf: CPF_OK },
      { ...CASO.grupo[1] },
    ];
    const r1 = compararCadUnico(decl, cad);
    assert.equal(r1.consistente, true);
    const r2 = compararCadUnico([decl[0]], cad);
    assert.equal(r2.consistente, false);
    assert.ok(r2.divergencias.some((d) => d.tipo === 'CADUNICO_SEM_DECLARACAO'));
  });
});

// ───────── drafter / guardrail ─────────
describe('drafter + guardrail', () => {
  test('minuta com tese curada passa e é determinística', () => {
    const a = minutaBase(), b = minutaBase();
    assert.equal(a.bloqueada, false, JSON.stringify(a.violacoes));
    assert.equal(a.hash, b.hash);
    assert.match(a.texto, /RE 567\.985/);
  });
  test('citação inventada em trecho livre BLOQUEIA', () => {
    const m = gerarMinuta({
      caso: CASO, calculo: CALC, teses: TESES, tesesSelecionadas: ['STF_RE_567985'],
      juizo: { orgao: 'JEF', subsecao: 'X' }, advogado: { nome: 'A', oab: 'SP 1' },
      trechosLivres: ['Conforme o REsp 1.735.312/SP e a Súmula 999, a dedução é devida.'],
    });
    assert.equal(m.bloqueada, true);
    assert.deepEqual(m.violacoes.map((v) => v.referencia).sort(), ['REsp 1.735.312/SP', 'Súmula 999'].sort());
  });
  test('tese inativa não pode ser usada', () => {
    const m = gerarMinuta({
      caso: CASO, calculo: CALC, teses: TESES, tesesSelecionadas: ['TESE_INATIVA'],
      juizo: { orgao: 'JEF', subsecao: 'X' }, advogado: { nome: 'A', oab: 'SP 1' },
    });
    assert.equal(m.bloqueada, true);
    assert.ok(m.violacoes.some((v) => v.motivo === 'TESE_INATIVA_OU_INEXISTENTE'));
  });
  test('formatos equivalentes de citação têm a mesma chave', () => {
    assert.equal(chaveCitacao('RE 567.985'), chaveCitacao('RE nº 567985'));
    assert.equal(verificarGuardrail('Nº 5001234-56.2024.8.26.0100', TESES).length, 1);
  });
});

// ───────── fracionador ─────────
describe('fracionador', () => {
  const MB = 1024 * 1024;
  const perfil = perfilPara('PJE', 'TRF3'); // cai no '*' (5 MB)
  test('respeita limite com margem e ordem de juntada', () => {
    const docs: DocAnexo[] = [
      { id: 'laudo', grupo: 'LAUDOS', nome: 'laudo.pdf', mime: 'application/pdf', bytes: 12 * MB, paginas: 200 },
      { id: 'rg', grupo: 'PESSOAIS', nome: 'rg.pdf', mime: 'application/pdf', bytes: 1 * MB, paginas: 2 },
      { id: 'cad', grupo: 'CADUNICO', nome: 'cad.pdf', mime: 'application/pdf', bytes: 2 * MB, paginas: 4 },
    ];
    const p = planejarFracionamento(docs, perfil);
    assert.equal(p.rejeitados.length, 0);
    assert.deepEqual(p.arquivos.map((a) => a.grupo).slice(0, 2), ['PESSOAIS', 'CADUNICO']);
    for (const a of p.arquivos) assert.ok(a.bytesEstimados <= perfil.maxBytesPorArquivo * 0.9);
    const laudo = p.arquivos.filter((a) => a.grupo === 'LAUDOS');
    assert.ok(laudo.length >= 3);
    const paginas = laudo.flatMap((a) => a.fatias).reduce((s, f) => s + f.paginaFinal - f.paginaInicial + 1, 0);
    assert.equal(paginas, 200); // nenhuma página perdida ou duplicada
    assert.match(laudo[0].nome, /_LAUDOS_parte1\.pdf$/);
  });
  test('rejeita formato e página maior que o limite', () => {
    const p = planejarFracionamento([
      { id: 'img', grupo: 'OUTROS', nome: 'a.jpg', mime: 'image/jpeg', bytes: 100, paginas: 1 },
      { id: 'gig', grupo: 'OUTROS', nome: 'g.pdf', mime: 'application/pdf', bytes: 9 * MB, paginas: 1 },
    ], perfil);
    assert.deepEqual(p.rejeitados.map((r) => r.motivo).sort(), ['FORMATO_NAO_ACEITO', 'PAGINA_ACIMA_DO_LIMITE']);
  });
});

// ───────── aprovação + assinatura ─────────
describe('aprovação', () => {
  const plano = { a: 1 };
  test('júnior não aprova; preparador não aprova a própria peça', () => {
    const m = minutaBase();
    assert.throws(() => aprovar({ casoId: 'caso-1', tenantId: 't1', preparadoPor: SENIOR, aprovador: ESTAG, minuta: m, anexosHash: hashAnexos(plano) }),
      (e: unknown) => e instanceof ErroAprovacao && e.codigo === 'SEM_ALCADA');
    assert.throws(() => aprovar({ casoId: 'caso-1', tenantId: 't1', preparadoPor: SENIOR, aprovador: SENIOR, minuta: m, anexosHash: hashAnexos(plano) }),
      (e: unknown) => e instanceof ErroAprovacao && e.codigo === 'MESMO_PREPARADOR');
  });
  test('edição após aprovação invalida', () => {
    const m = minutaBase();
    const ap = aprovar({ casoId: 'caso-1', tenantId: 't1', preparadoPor: ESTAG, aprovador: SENIOR, minuta: m, anexosHash: hashAnexos(plano) });
    assert.equal(aprovacaoValida(ap, m.hash, hashAnexos(plano)), true);
    assert.equal(aprovacaoValida(ap, 'b'.repeat(64), hashAnexos(plano)), false);
    assert.equal(aprovacaoValida(ap, m.hash, hashAnexos({ a: 2 })), false);
    assert.equal(aprovacaoValida({ ...ap, aprovadoPor: 'hacker' }, m.hash, hashAnexos(plano)), false);
  });
  test('minuta bloqueada não é aprovável', () => {
    assert.throws(() => aprovar({ casoId: 'c', tenantId: 't1', preparadoPor: ESTAG, aprovador: SENIOR, minuta: { hash: 'x', bloqueada: true }, anexosHash: 'y' }),
      (e: unknown) => e instanceof ErroAprovacao && e.codigo === 'MINUTA_BLOQUEADA');
  });
});

describe('assinatura', () => {
  const m = minutaBase();
  const anexosHash = hashAnexos({ a: 1 });
  const ap = aprovar({ casoId: 'caso-1', tenantId: 't1', preparadoPor: ESTAG, aprovador: SENIOR, minuta: m, anexosHash });
  const req = (over: Partial<SolicitacaoAssinatura> = {}): SolicitacaoAssinatura => ({
    casoId: 'caso-1', tenantId: 't1', documentoHash: m.hash, anexosHash, signatarioId: 'adv-sr',
    procuracao: { advogados: [{ id: 'adv-sr', oab: 'SP 000000', cpf: CPF_OK }] }, aprovacao: ap, ...over,
  });

  test('advogado fora da procuração → 403', async () => {
    await assert.rejects(new DemoSigner(true).assinar(req({ signatarioId: 'escritorio' })),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'NAO_CONSTITUIDO' && e.httpStatus === 403);
  });
  test('documento alterado após aprovação → 409', async () => {
    await assert.rejects(new DemoSigner(true).assinar(req({ documentoHash: 'c'.repeat(64) })),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'SEM_APROVACAO_VALIDA' && e.httpStatus === 409);
  });
  test('DemoSigner assina sem valor jurídico e só em DEMO_MODE', async () => {
    const a = await new DemoSigner(true).assinar(req());
    assert.equal(a.valorJuridico, false);
    assert.match(a.envelope, /^DEMO-SEM-VALIDADE/);
    await assert.rejects(new DemoSigner(false).assinar(req()), (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'DEMO_DESLIGADO');
  });
  test('CloudPsc exige autenticação do próprio titular', async () => {
    const s = new CloudPscSigner({ endpoint: 'x', clientId: 'y' });
    await assert.rejects(s.assinar(req({ autenticacaoLote: { titularId: 'outro', expiraEm: '2999-01-01T00:00:00Z' } })),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'TITULAR_DIVERGENTE');
    await assert.rejects(s.assinar(req({ autenticacaoLote: { titularId: 'adv-sr', expiraEm: '2000-01-01T00:00:00Z' } })),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'AUTENTICACAO_EXPIRADA');
  });
  test('HSM recusa certificado de terceiro e exige consentimento', async () => {
    await assert.rejects(new HsmPkcs11Signer([{ alias: 'CERT_PLATAFORMA', titularId: 'plataforma' }]).assinar(req()),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'TITULAR_DIVERGENTE');
    await assert.rejects(new HsmPkcs11Signer([{ alias: 'a1', titularId: 'adv-sr' }]).assinar(req()),
      (e: unknown) => e instanceof ErroAssinatura && e.codigo === 'SEM_CONSENTIMENTO');
  });
});
