/**
 * VELATRIX AOS · P28 · Drafter LOAS (estágio Execução)
 *
 * Minuta montada por TEMPLATE determinístico + blocos de tese vindos da tabela
 * curada (regrasLoas.TESES_CURADAS_LOAS). Nenhum LLM gera jurisprudência.
 *
 * Guardrail: qualquer referência jurisprudencial (RE, REsp, ARE, AgRg, Tema,
 * Súmula, nº CNJ) presente no texto final que NÃO esteja na allowlist derivada
 * das teses ativas BLOQUEIA a minuta. Vale também para trechos editados à mão
 * ou sugeridos por IA (passe-os em `trechosLivres`).
 */
import type { CasoLoas, ResultadoCalculoLoas } from './tipos.ts';
import type { TeseCurada } from './regrasLoas.ts';
import { sha256HexSync } from '../shared/crypto/sha256Sync.ts';

export interface DadosJuizo {
  orgao: string;        // ex.: "Juizado Especial Federal"
  subsecao: string;     // ex.: "Subseção Judiciária de ..."
}

export interface EntradaMinuta {
  caso: CasoLoas;
  calculo: ResultadoCalculoLoas;
  teses: readonly TeseCurada[];
  tesesSelecionadas: string[]; // ids
  juizo: DadosJuizo;
  advogado: { nome: string; oab: string };
  trechosLivres?: string[];    // texto editado/IA — passa pelo guardrail
}

export interface ViolacaoGuardrail {
  referencia: string;
  motivo: 'CITACAO_FORA_DA_TABELA' | 'TESE_INATIVA_OU_INEXISTENTE';
}

export interface Minuta {
  texto: string;
  hash: string;           // SHA-256 do texto — base da aprovação
  tesesUsadas: string[];
  bloqueada: boolean;
  violacoes: ViolacaoGuardrail[];
}

// ───────────────────────── guardrail ─────────────────────────

const RE_CITACAO =
  /\b(?:(?:RE|REsp|ARE|AgRg|AgInt|EREsp|RCL|ADI|ADPF|PEDILEF|HC|MS)\s*(?:n[ºo°.]?\s*)?\d[\d.]*(?:\/[A-Z]{2})?|Tema\s+(?:n[ºo°.]?\s*)?\d+|S[uú]mula\s+(?:Vinculante\s+)?(?:n[ºo°.]?\s*)?\d+|\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})/gi;

/** Chave canônica: tipo + dígitos ("RE 567.985" ≡ "RE567985"). */
export function chaveCitacao(ref: string): string {
  const tipo = (ref.match(/^[A-Za-zúÚ ]+/)?.[0] ?? '').replace(/\s+|n[ºo°.]?$/gi, '').toUpperCase().replace('Ú', 'U');
  const num = ref.replace(/\D/g, '');
  return `${tipo}:${num}`;
}

export function extrairCitacoes(texto: string): string[] {
  return [...texto.matchAll(RE_CITACAO)].map((m) => m[0].trim());
}

export function allowlistDasTeses(teses: readonly TeseCurada[]): Set<string> {
  const s = new Set<string>();
  for (const t of teses.filter((x) => x.ativa)) {
    for (const c of extrairCitacoes(`${t.titulo} ${t.fundamento}`)) s.add(chaveCitacao(c));
  }
  return s;
}

export function verificarGuardrail(texto: string, teses: readonly TeseCurada[]): ViolacaoGuardrail[] {
  const allow = allowlistDasTeses(teses);
  const vistos = new Set<string>();
  const out: ViolacaoGuardrail[] = [];
  for (const ref of extrairCitacoes(texto)) {
    const k = chaveCitacao(ref);
    if (vistos.has(k)) continue;
    vistos.add(k);
    if (!allow.has(k)) out.push({ referencia: ref, motivo: 'CITACAO_FORA_DA_TABELA' });
  }
  return out;
}

// ───────────────────────── template ─────────────────────────

const brl = (c: number) =>
  (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function idadeEm(dataNasc: string, ref: Date): number {
  const [a, m, d] = dataNasc.split('-').map(Number);
  let idade = ref.getUTCFullYear() - a;
  if (ref.getUTCMonth() + 1 < m || (ref.getUTCMonth() + 1 === m && ref.getUTCDate() < d)) idade--;
  return idade;
}

export function gerarMinuta(e: EntradaMinuta, agora = new Date()): Minuta {
  const { caso, calculo } = e;
  const violacoes: ViolacaoGuardrail[] = [];

  const tesesAtivas = new Map(e.teses.filter((t) => t.ativa).map((t) => [t.id, t]));
  const tesesUsadas: TeseCurada[] = [];
  for (const id of e.tesesSelecionadas) {
    const t = tesesAtivas.get(id);
    if (t) tesesUsadas.push(t);
    else violacoes.push({ referencia: id, motivo: 'TESE_INATIVA_OU_INEXISTENTE' });
  }

  const r = caso.requerente;
  const ra = caso.requerimentoAdministrativo;
  const categoriaTxt = caso.categoria === 'IDOSO'
    ? `pessoa idosa, com ${idadeEm(r.dataNascimento, agora)} anos de idade`
    : 'pessoa com deficiência, com impedimento de longo prazo atestado em laudo';

  const secoes: string[] = [
    `EXCELENTÍSSIMO(A) SENHOR(A) JUIZ(A) FEDERAL DO ${e.juizo.orgao.toUpperCase()} — ${e.juizo.subsecao.toUpperCase()}`,
    '',
    `${r.nome}, CPF ${r.cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}, ${categoriaTxt}, por seu advogado ` +
      `${e.advogado.nome} (OAB ${e.advogado.oab}), vem propor AÇÃO DE CONCESSÃO DE BENEFÍCIO ASSISTENCIAL (BPC/LOAS) ` +
      'em face do INSTITUTO NACIONAL DO SEGURO SOCIAL – INSS, pelos fatos e fundamentos a seguir.',
    '',
    'I — DO REQUERIMENTO ADMINISTRATIVO',
    ra.moraInss
      ? 'O requerimento administrativo não foi apreciado no prazo, caracterizando mora da autarquia.'
      : `O benefício foi requerido administrativamente (NB ${ra.numeroNB ?? '[PREENCHER]'}) e indeferido em ` +
        `${ra.dataIndeferimento ?? '[PREENCHER]'}, sob o fundamento: "${ra.motivo ?? '[PREENCHER]'}".`,
    '',
    'II — DA HIPOSSUFICIÊNCIA (MEMÓRIA DE CÁLCULO ANEXA)',
    `Competência de referência: ${calculo.competencia}. Salário mínimo: ${brl(calculo.salarioMinimoCentavos)}.`,
    `Renda bruta do grupo familiar: ${brl(calculo.rendaBrutaTotalCentavos)}. ` +
      `Deduções de saúde comprovadas e não fornecidas pelo SUS: ${brl(calculo.totalDeducoesAceitasCentavos)}.`,
    `Renda per capita apurada: ${brl(calculo.perCapitaCentavos)} — limite de referência ${brl(calculo.limiteCentavos)}.`,
    calculo.elegivelCriterioObjetivo
      ? 'O critério objetivo de renda está atendido.'
      : 'Ainda que superado o critério objetivo, a miserabilidade pode ser demonstrada por outros meios de prova, conforme fundamentos abaixo.',
    `Memória de cálculo selada: SHA-256 ${calculo.hash} (regras v${calculo.versaoRegras}).`,
    '',
    'III — DO DIREITO',
    ...(tesesUsadas.length
      ? tesesUsadas.map((t, i) => `${i + 1}. ${t.titulo}. ${t.fundamento}`)
      : ['[NENHUMA TESE SELECIONADA — selecionar da tabela curada]']),
    ...(e.trechosLivres?.length ? ['', ...e.trechosLivres] : []),
    '',
    'IV — DOS PEDIDOS',
    'a) a citação do INSS; b) a realização de perícia médica e avaliação social, se necessárias; ' +
      'c) a procedência do pedido para conceder o benefício assistencial desde o requerimento administrativo, ' +
      'com pagamento das parcelas vencidas corrigidas; d) os benefícios da justiça gratuita.',
    '',
    'Dá-se à causa o valor de [PREENCHER — calcular parcelas vencidas + 12 vincendas].',
    '',
    `${e.advogado.nome} — OAB ${e.advogado.oab}`,
  ];

  const texto = secoes.join('\n');
  violacoes.push(...verificarGuardrail(texto, e.teses));

  return {
    texto,
    hash: sha256HexSync(texto),
    tesesUsadas: tesesUsadas.map((t) => t.id),
    bloqueada: violacoes.length > 0,
    violacoes,
  };
}
