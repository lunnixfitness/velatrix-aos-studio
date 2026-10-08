/**
 * VELATRIX AOS · Enterprise · Conflict Check Engine (Ferramenta 7 · P17).
 *
 * Checagem de conflito de interesses antes do aceite de um caso / abertura de esteira.
 * Lógica pura e determinística: sem rede, sem LLM, relógio injetado. Mesma entrada → mesmo resultado.
 *
 * Camadas de correspondência (maior sinal vence):
 *   1. DOCUMENTO_EXATO  — CPF/CNPJ idêntico (dígitos verificadores validados)
 *   2. RAIZ_CNPJ        — mesma raiz de 8 dígitos (matriz × filial)
 *   3. GRUPO_ECONOMICO  — documento bate com sócio/controladora/coligada de uma entidade indexada
 *   4. NOME_*           — nome normalizado (sem S.A./LTDA/acentos) + fonética PT-BR + Jaro-Winkler
 *
 * O score de RISCO = similaridade × peso do cruzamento de papéis (ex.: novo cliente × parte contrária ativa = 1,0;
 * novo cliente × cliente ativo = 0,6 — é cliente da casa, não conflito per se).
 * Faixas: CRÍTICO ≥ 90 · ALTO 70–89 · MÉDIO 50–69 · BAIXO < 50.
 *
 * Performance: índice invertido (documento, raiz CNPJ, chave fonética) → só compara candidatos
 * que compartilham ao menos um sinal. O(alvos × candidatos), nunca O(alvos × base).
 */

export const MOTOR_CONFLITO_VERSAO = 'cc-1.0.0';

// ─────────────────────────── Tipos ───────────────────────────

export type TipoPessoa = 'PF' | 'PJ';

/** Papel da entidade JÁ existente na base do escritório/tenant. */
export type PapelEntidade =
  | 'CLIENTE_ATIVO'
  | 'CLIENTE_INATIVO'
  | 'PARTE_CONTRARIA'
  | 'TERCEIRO_INTERESSADO'
  | 'PROSPECT_DECLINADO';

/** Papel do alvo na NOVA solicitação. */
export type PapelConsulta = 'NOVO_CLIENTE' | 'PARTE_CONTRARIA' | 'SOCIO_ALVO' | 'PARTE_RELACIONADA';

export type PapelRelacionada = 'SOCIO' | 'ADMINISTRADOR' | 'CONTROLADORA' | 'CONTROLADA' | 'COLIGADA';

export interface ParteRelacionada {
  nome: string;
  documento?: string;
  papel: PapelRelacionada;
}

export interface MateriaRef {
  id: string;
  titulo: string;
  area: string;
  responsavel: string;
  status: 'ATIVA' | 'ENCERRADA';
  encerradaEm?: string; // ISO date
}

export interface EntidadeIndexada {
  id: string;
  tenantId: string;
  nome: string;
  documento?: string;
  tipo: TipoPessoa;
  papel: PapelEntidade;
  grupoEconomicoId?: string;
  inativoDesde?: string; // ISO date — relevante para quarentena de ex-cliente
  relacionadas: ParteRelacionada[];
  materias: MateriaRef[];
  barreiras: string[]; // Chinese Walls já vigentes
}

export interface AlvoConsulta {
  nome: string;
  documento?: string;
  papel: PapelConsulta;
}

export interface SolicitacaoConflito {
  id: string;
  tenantId: string;
  solicitanteId: string;
  area: string;
  descricao: string;
  alvos: AlvoConsulta[];
}

export type TipoMatch =
  | 'DOCUMENTO_EXATO'
  | 'RAIZ_CNPJ'
  | 'GRUPO_ECONOMICO'
  | 'NOME_EXATO'
  | 'NOME_FONETICO'
  | 'NOME_APROXIMADO';

export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export type StatusResultado = 'CLEAR' | 'CLEAR_WITH_NOTICE' | 'REQUIRES_APPROVAL';

export type AcaoExigida = 'LIBERAR' | 'CIENCIA_RESPONSAVEL' | 'APROVACAO_SOCIO_AREA' | 'COMITE_COMPLIANCE';

export interface HitConflito {
  alvoIndice: number;
  alvoNome: string;
  alvoPapel: PapelConsulta;
  entidadeId: string;
  nomeEncontrado: string;
  documentoEncontrado?: string;
  papelEncontrado: PapelEntidade;
  /** Se o match foi numa parte relacionada da entidade (sócio, controladora…). */
  via?: { nome: string; papel: PapelRelacionada };
  tipoMatch: TipoMatch;
  similaridade: number; // 0–100
  pesoPapel: number; // 0–1
  score: number; // 0–100
  nivel: NivelRisco;
  materia?: MateriaRef;
  barreiras: string[];
  motivo: string;
}

export interface ResultadoConflito {
  solicitacaoId: string;
  tenantId: string;
  status: StatusResultado;
  nivel: NivelRisco;
  scoreMax: number;
  acao: AcaoExigida;
  hits: HitConflito[];
  avisos: string[];
  candidatosAvaliados: number;
  motorVersao: string;
  geradoEm: string;
}

export class ConflitoInvalido extends Error {
  readonly httpStatus = 422;
}

// ─────────────────────────── Documentos ───────────────────────────

export const somenteDigitos = (s: string | undefined): string => (s ?? '').replace(/\D/g, '');

function dvMod11(base: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < base.length; i++) soma += Number(base[i]) * pesos[i];
  const r = soma % 11;
  return r < 2 ? 0 : 11 - r;
}

export function validarCPF(doc: string): boolean {
  const d = somenteDigitos(doc);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === Number(d[9]) && dv2 === Number(d[10]);
}

export function validarCNPJ(doc: string): boolean {
  const d = somenteDigitos(doc);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv1 = dvMod11(d.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dv2 = dvMod11(d.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv1 === Number(d[12]) && dv2 === Number(d[13]);
}

export type TipoDocumento = 'CPF' | 'CNPJ' | 'INVALIDO' | 'AUSENTE';

export function tipoDocumento(doc: string | undefined): TipoDocumento {
  const d = somenteDigitos(doc);
  if (!d) return 'AUSENTE';
  if (d.length === 11) return validarCPF(d) ? 'CPF' : 'INVALIDO';
  if (d.length === 14) return validarCNPJ(d) ? 'CNPJ' : 'INVALIDO';
  return 'INVALIDO';
}

/** Raiz do CNPJ (8 primeiros dígitos) identifica a empresa; o restante é a filial. */
export const raizCNPJ = (doc: string | undefined): string | undefined => {
  const d = somenteDigitos(doc);
  return d.length === 14 ? d.slice(0, 8) : undefined;
};

// ─────────────────────────── Normalização de nomes ───────────────────────────

/** Sufixos societários e conectivos que não carregam identidade. */
const STOPWORDS = new Set([
  'sa', 's', 'a', 'ltda', 'limitada', 'eireli', 'me', 'epp', 'mei', 'slu', 'cia', 'companhia',
  'holding', 'holdings', 'participacoes', 'participacao', 'part', 'grupo', 'group', 'brasil', 'brazil',
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'the', 'of', 'and', 'inc', 'llc', 'ltd', 'corp', 'co',
]);

/** Descritores de atividade: contam, mas pesam pouco (evita "Construtora X" ≈ "Construtora Y"). */
const GENERICOS = new Set([
  'construtora', 'construcoes', 'construcao', 'incorporadora', 'engenharia', 'comercio', 'comercial',
  'industria', 'industrial', 'servicos', 'servico', 'transportes', 'transporte', 'logistica', 'alimentos',
  'tecnologia', 'telecomunicacoes', 'consultoria', 'empreendimentos', 'imobiliaria', 'agropecuaria',
  'distribuidora', 'importacao', 'exportacao', 'banco', 'bank', 'financeira', 'seguros', 'civis', 'civil',
]);

/**
 * Tokens normalizados (sem acento, caixa baixa, sem sufixo societário).
 * `cedilhaComoS`: usado só para a chave fonética ("Gonçalves" soa "Gonsalves"); os tokens de
 * comparação mantêm ç → c, porque é assim que a maioria dos cadastros digita sem acento.
 */
export function normalizarNome(nome: string, cedilhaComoS = false): string[] {
  const base = (cedilhaComoS ? nome.replace(/[çÇ]/g, 's') : nome)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/\bs\s*[./]\s*a\b\.?/g, ' sa ')
    .replace(/[^a-z0-9\s]/g, ' ');
  return base.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
}

/**
 * Chave fonética PT-BR (inspirada no BuscaBR). Resolve os erros clássicos de cadastro:
 * Gonçalves/Gonsalves, Xavier/Chavier, Philippe/Felipe, Thiago/Tiago, Souza/Sousa, Luiz/Luis.
 */
export function chaveFonetica(token: string): string {
  if (!token) return '';
  if (/^\d+$/.test(token)) return token;
  let s = token;
  s = s.replace(/ph/g, 'f').replace(/th/g, 't').replace(/lh/g, 'l').replace(/nh/g, 'n');
  s = s.replace(/ch|sh/g, 'x');
  s = s.replace(/sc(?=[ei])/g, 's').replace(/ss/g, 's').replace(/rr/g, 'r');
  s = s.replace(/qu(?=[ei])/g, 'k').replace(/gu(?=[ei])/g, 'g').replace(/q/g, 'k');
  s = s.replace(/c(?=[ei])/g, 's').replace(/c/g, 'k');
  s = s.replace(/g(?=[ei])/g, 'j');
  s = s.replace(/y/g, 'i').replace(/w/g, 'v').replace(/z/g, 's').replace(/h/g, '');
  s = s.replace(/[mn]$/g, 'n').replace(/s$/g, '');
  if (!s) return token[0];
  const primeira = s[0];
  const resto = s.slice(1).replace(/[aeiou]/g, '');
  return (primeira + resto).replace(/(.)\1+/g, '$1');
}

/** Jaro-Winkler (0–1). Bom para nomes curtos com erro de digitação/transposição. */
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const la = a.length, lb = b.length;
  if (!la || !lb) return 0;
  const janela = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const ma = new Array<boolean>(la).fill(false);
  const mb = new Array<boolean>(lb).fill(false);
  let matches = 0;
  for (let i = 0; i < la; i++) {
    const ini = Math.max(0, i - janela), fim = Math.min(i + janela + 1, lb);
    for (let j = ini; j < fim; j++) {
      if (mb[j] || a[i] !== b[j]) continue;
      ma[i] = mb[j] = true;
      matches++;
      break;
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < la; i++) {
    if (!ma[i]) continue;
    while (!mb[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (matches / la + matches / lb + (matches - t / 2) / matches) / 3;
  let prefixo = 0;
  while (prefixo < Math.min(4, la, lb) && a[prefixo] === b[prefixo]) prefixo++;
  return jaro + prefixo * 0.1 * (1 - jaro);
}

interface NomeProcessado {
  tokens: string[];
  foneticos: string[];
  chave: string; // tokens ordenados — igualdade independe da ordem
}

export function processarNome(nome: string): NomeProcessado {
  const tokens = normalizarNome(nome);
  const fon = normalizarNome(nome, true); // mesmo split: ç→s não altera fronteiras de token
  return { tokens, foneticos: tokens.map((t, i) => chaveFonetica(fon[i] ?? t)), chave: [...tokens].sort().join(' ') };
}

const pesoToken = (t: string) => (GENERICOS.has(t) ? 0.3 : 1);

/** Melhor correspondência de um token contra uma lista. Iniciais ("c.") casam com o token que começa pela letra. */
function melhorToken(t: string, f: string, outros: NomeProcessado): { sim: number; fonetico: boolean } {
  let melhor = 0, fonetico = false;
  for (let i = 0; i < outros.tokens.length; i++) {
    const o = outros.tokens[i];
    let s: number;
    let fon = false;
    if (t === o) s = 1;
    else if ((t.length === 1 && o.startsWith(t)) || (o.length === 1 && t.startsWith(o))) s = 0.85;
    else if (f && f === outros.foneticos[i] && Math.min(t.length, o.length) > 2) { s = 0.93; fon = true; }
    else s = jaroWinkler(t, o);
    if (s > melhor) { melhor = s; fonetico = fon; }
  }
  return { sim: melhor, fonetico };
}

function cobertura(a: NomeProcessado, b: NomeProcessado): { valor: number; fonetico: boolean } {
  let soma = 0, pesos = 0, fonetico = false;
  a.tokens.forEach((t, i) => {
    const w = pesoToken(t);
    const m = melhorToken(t, a.foneticos[i], b);
    const sim = m.sim >= 0.8 ? m.sim : 0; // abaixo de 0,8 um token não conta como correspondência
    if (m.fonetico && sim) fonetico = true;
    soma += sim * w;
    pesos += w;
  });
  return { valor: pesos ? soma / pesos : 0, fonetico };
}

/** Similaridade entre dois nomes (0–100) e o tipo de correspondência. Simétrica. */
export function similaridadeNomes(a: string | NomeProcessado, b: string | NomeProcessado): { sim: number; tipo: TipoMatch } {
  const pa = typeof a === 'string' ? processarNome(a) : a;
  const pb = typeof b === 'string' ? processarNome(b) : b;
  if (!pa.tokens.length || !pb.tokens.length) return { sim: 0, tipo: 'NOME_APROXIMADO' };
  if (pa.chave === pb.chave) return { sim: 100, tipo: 'NOME_EXATO' };
  const [curto, longo] = pa.tokens.length <= pb.tokens.length ? [pa, pb] : [pb, pa];
  const c1 = cobertura(curto, longo);
  const c2 = cobertura(longo, curto);
  let sim = 0.8 * c1.valor + 0.2 * c2.valor;
  // Nome de um só token distintivo (ex.: "Silva") contra nome composto: sinal fraco, limita o teto.
  const distintivos = curto.tokens.filter((t) => !GENERICOS.has(t)).length;
  if (distintivos <= 1 && longo.tokens.length > 1) sim = Math.min(sim, 0.72);
  // Só descritores genéricos em comum: não é o mesmo nome.
  if (distintivos === 0) sim = Math.min(sim, 0.4);
  const tipo: TipoMatch = c1.fonetico || c2.fonetico ? 'NOME_FONETICO' : 'NOME_APROXIMADO';
  return { sim: Math.round(sim * 100), tipo };
}

// ─────────────────────────── Matriz de papéis ───────────────────────────

const DIA_MS = 86_400_000;

/**
 * Peso do cruzamento (papel do alvo na nova causa × papel da entidade na base).
 * 1,0 = conflito direto (ex.: aceitar como cliente quem é parte contrária em causa ativa).
 */
export function pesoPapel(alvo: PapelConsulta, ent: EntidadeIndexada, materia: MateriaRef | undefined, agora: Date): { peso: number; motivo: string } {
  const lado: 'CLIENTE' | 'ADVERSO' = alvo === 'PARTE_CONTRARIA' ? 'ADVERSO' : 'CLIENTE';
  const fator = alvo === 'SOCIO_ALVO' || alvo === 'PARTE_RELACIONADA' ? 0.9 : 1;
  const ativa = materia?.status === 'ATIVA';
  let peso: number, motivo: string;
  switch (ent.papel) {
    case 'PARTE_CONTRARIA':
      if (lado === 'CLIENTE') {
        peso = ativa ? 1 : 0.7;
        motivo = ativa ? 'Parte contrária em causa ATIVA do escritório' : 'Foi parte contrária em causa encerrada';
      } else { peso = 0.3; motivo = 'Já é parte adversa em outra causa (mesmo lado)'; }
      break;
    case 'CLIENTE_ATIVO':
      if (lado === 'ADVERSO') { peso = 1; motivo = 'Atuar CONTRA cliente ativo do escritório'; }
      else { peso = 0.6; motivo = 'Já é cliente ativo — verificar partes e escopo da nova matéria'; }
      break;
    case 'CLIENTE_INATIVO': {
      const dias = ent.inativoDesde ? (agora.getTime() - Date.parse(ent.inativoDesde)) / DIA_MS : Infinity;
      const quarentena = dias < 730;
      if (lado === 'ADVERSO') {
        peso = quarentena ? 0.85 : 0.6;
        motivo = quarentena ? 'Ex-cliente há menos de 2 anos — risco de uso de informação confidencial' : 'Ex-cliente (> 2 anos)';
      } else { peso = 0.35; motivo = 'Ex-cliente retornando'; }
      break;
    }
    case 'PROSPECT_DECLINADO':
      peso = 0.75; motivo = 'Prospect recusado anteriormente por conflito/compliance';
      break;
    case 'TERCEIRO_INTERESSADO':
    default:
      peso = 0.4; motivo = 'Terceiro interessado em causa do escritório';
  }
  return { peso: Math.min(1, peso * fator), motivo };
}

export function nivelPorScore(score: number): NivelRisco {
  if (score >= 90) return 'CRITICO';
  if (score >= 70) return 'ALTO';
  if (score >= 50) return 'MEDIO';
  return 'BAIXO';
}

const ACAO: Record<NivelRisco, AcaoExigida> = {
  CRITICO: 'COMITE_COMPLIANCE',
  ALTO: 'APROVACAO_SOCIO_AREA',
  MEDIO: 'CIENCIA_RESPONSAVEL',
  BAIXO: 'LIBERAR',
};

// ─────────────────────────── Índice ───────────────────────────

export interface IndiceConflitos {
  tenantId: string;
  entidades: Map<string, EntidadeIndexada>;
  nomes: Map<string, NomeProcessado>; // entidadeId → nome processado
  porDocumento: Map<string, Set<string>>;
  porRaiz: Map<string, Set<string>>;
  porFonetica: Map<string, Set<string>>;
  porGrupo: Map<string, Set<string>>;
}

function add(m: Map<string, Set<string>>, k: string | undefined, id: string) {
  if (!k) return;
  let s = m.get(k);
  if (!s) m.set(k, (s = new Set()));
  s.add(id);
}

/** Índice por tenant. Entidades de outro tenant são descartadas (isolamento). */
export function criarIndice(tenantId: string, base: EntidadeIndexada[]): IndiceConflitos {
  const idx: IndiceConflitos = {
    tenantId,
    entidades: new Map(), nomes: new Map(), porDocumento: new Map(), porRaiz: new Map(), porFonetica: new Map(), porGrupo: new Map(),
  };
  for (const e of base) {
    if (e.tenantId !== tenantId) continue;
    idx.entidades.set(e.id, e);
    const np = processarNome(e.nome);
    idx.nomes.set(e.id, np);
    add(idx.porDocumento, somenteDigitos(e.documento), e.id);
    add(idx.porRaiz, raizCNPJ(e.documento), e.id);
    add(idx.porGrupo, e.grupoEconomicoId, e.id);
    np.tokens.forEach((t, i) => { if (!GENERICOS.has(t)) add(idx.porFonetica, np.foneticos[i], e.id); });
    for (const r of e.relacionadas) {
      add(idx.porDocumento, somenteDigitos(r.documento), e.id);
      const rp = processarNome(r.nome);
      rp.tokens.forEach((t, i) => { if (!GENERICOS.has(t)) add(idx.porFonetica, rp.foneticos[i], e.id); });
    }
  }
  return idx;
}

// ─────────────────────────── Motor ───────────────────────────

export const LIMIAR_NOME = 70; // similaridade mínima para registrar hit por nome

function materiaRelevante(e: EntidadeIndexada): MateriaRef | undefined {
  return e.materias.find((m) => m.status === 'ATIVA') ?? e.materias[0];
}

interface Candidato { sim: number; tipo: TipoMatch; via?: { nome: string; papel: PapelRelacionada } }

function avaliarEntidade(alvo: AlvoConsulta, alvoNome: NomeProcessado, e: EntidadeIndexada, nomeE: NomeProcessado): Candidato | null {
  const doc = somenteDigitos(alvo.documento);
  const docE = somenteDigitos(e.documento);
  if (doc && docE && doc === docE) return { sim: 100, tipo: 'DOCUMENTO_EXATO' };
  const raiz = raizCNPJ(doc);
  if (raiz && raiz === raizCNPJ(docE)) return { sim: 95, tipo: 'RAIZ_CNPJ' };
  let melhor: Candidato | null = null;
  for (const r of e.relacionadas) {
    const dr = somenteDigitos(r.documento);
    if (doc && dr && (dr === doc || (raiz && raiz === raizCNPJ(dr)))) {
      return { sim: 90, tipo: 'GRUPO_ECONOMICO', via: { nome: r.nome, papel: r.papel } };
    }
    const s = similaridadeNomes(alvoNome, processarNome(r.nome));
    if (s.sim >= LIMIAR_NOME && (!melhor || s.sim * 0.9 > melhor.sim)) {
      melhor = { sim: Math.round(s.sim * 0.9), tipo: s.tipo, via: { nome: r.nome, papel: r.papel } };
    }
  }
  const s = similaridadeNomes(alvoNome, nomeE);
  if (s.sim >= LIMIAR_NOME && (!melhor || s.sim >= melhor.sim)) melhor = { sim: s.sim, tipo: s.tipo };
  return melhor;
}

export function executarConflictCheck(sol: SolicitacaoConflito, idx: IndiceConflitos, agora: Date): ResultadoConflito {
  if (sol.tenantId !== idx.tenantId) throw new ConflitoInvalido('índice de outro tenant');
  if (!sol.alvos.length) throw new ConflitoInvalido('informe ao menos um alvo (cliente ou parte contrária)');
  if (!sol.alvos.some((a) => a.papel === 'NOVO_CLIENTE')) throw new ConflitoInvalido('a solicitação precisa de um NOVO_CLIENTE');

  const avisos: string[] = [];
  const hits: HitConflito[] = [];
  let avaliados = 0;

  sol.alvos.forEach((alvo, alvoIndice) => {
    if (!alvo.nome.trim() && !somenteDigitos(alvo.documento)) {
      avisos.push(`Alvo #${alvoIndice + 1} sem nome e sem documento — ignorado.`);
      return;
    }
    const td = tipoDocumento(alvo.documento);
    if (td === 'INVALIDO') avisos.push(`Documento de "${alvo.nome}" inválido (dígito verificador) — checado só por nome.`);
    if (td === 'AUSENTE') avisos.push(`"${alvo.nome}" sem CPF/CNPJ — checagem apenas por nome (menor confiança).`);
    const docValido = td === 'CPF' || td === 'CNPJ' ? somenteDigitos(alvo.documento) : undefined;
    const alvoEf: AlvoConsulta = { ...alvo, documento: docValido };
    const alvoNome = processarNome(alvo.nome);

    // Candidatos pelo índice (blocking): documento, raiz, grupo, fonética de tokens distintivos.
    const cand = new Set<string>();
    const juntar = (s?: Set<string>) => s?.forEach((id) => cand.add(id));
    if (docValido) {
      juntar(idx.porDocumento.get(docValido));
      const r = raizCNPJ(docValido);
      if (r) juntar(idx.porRaiz.get(r));
    }
    alvoNome.tokens.forEach((t, i) => { if (!GENERICOS.has(t)) juntar(idx.porFonetica.get(alvoNome.foneticos[i])); });
    // Expansão por grupo econômico declarado.
    for (const id of [...cand]) {
      const g = idx.entidades.get(id)?.grupoEconomicoId;
      if (g) juntar(idx.porGrupo.get(g));
    }

    const porEntidade = new Map<string, HitConflito>();
    const registrar = (e: EntidadeIndexada, c: Candidato, sufixoMotivo = '') => {
      const materia = materiaRelevante(e);
      const { peso, motivo } = pesoPapel(alvo.papel, e, materia, agora);
      const score = Math.round(c.sim * peso);
      const prev = porEntidade.get(e.id);
      if (prev && prev.score >= score) return;
      porEntidade.set(e.id, {
        alvoIndice, alvoNome: alvo.nome, alvoPapel: alvo.papel,
        entidadeId: e.id, nomeEncontrado: e.nome, documentoEncontrado: e.documento, papelEncontrado: e.papel,
        via: c.via, tipoMatch: c.tipo, similaridade: c.sim, pesoPapel: peso, score, nivel: nivelPorScore(score),
        materia, barreiras: e.barreiras, motivo: motivo + sufixoMotivo,
      });
    };
    for (const id of cand) {
      avaliados++;
      const e = idx.entidades.get(id)!;
      const c = avaliarEntidade(alvoEf, alvoNome, e, idx.nomes.get(id)!);
      if (c) registrar(e, c);
    }
    // Coligadas (mesmo grupoEconomicoId) de um match forte entram como GRUPO_ECONOMICO.
    for (const h of [...porEntidade.values()]) {
      if (h.similaridade < 90 || h.tipoMatch === 'GRUPO_ECONOMICO') continue;
      const g = idx.entidades.get(h.entidadeId)?.grupoEconomicoId;
      if (!g) continue;
      for (const id of idx.porGrupo.get(g) ?? []) {
        if (id === h.entidadeId) continue;
        registrar(idx.entidades.get(id)!, { sim: 85, tipo: 'GRUPO_ECONOMICO', via: { nome: h.nomeEncontrado, papel: 'COLIGADA' } }, ' (mesmo grupo econômico)');
      }
    }
    hits.push(...porEntidade.values());
  });

  hits.sort((a, b) => b.score - a.score || b.similaridade - a.similaridade || a.entidadeId.localeCompare(b.entidadeId));
  const scoreMax = hits[0]?.score ?? 0;
  const nivel = nivelPorScore(scoreMax);
  const status: StatusResultado = nivel === 'BAIXO' ? 'CLEAR' : nivel === 'MEDIO' ? 'CLEAR_WITH_NOTICE' : 'REQUIRES_APPROVAL';

  return {
    solicitacaoId: sol.id,
    tenantId: sol.tenantId,
    status,
    nivel,
    scoreMax,
    acao: ACAO[nivel],
    hits,
    avisos,
    candidatosAvaliados: avaliados,
    motorVersao: MOTOR_CONFLITO_VERSAO,
    geradoEm: agora.toISOString(),
  };
}

/** Payload estável para selo SHA-256 (hashCanonical) — o relatório selado é prova de checagem prévia. */
export function payloadSelo(sol: SolicitacaoConflito, r: ResultadoConflito) {
  return {
    tipo: 'conflict_check.resultado',
    motor: r.motorVersao,
    solicitacao: { id: sol.id, tenantId: sol.tenantId, solicitanteId: sol.solicitanteId, area: sol.area, descricao: sol.descricao, alvos: sol.alvos },
    resultado: {
      status: r.status, nivel: r.nivel, scoreMax: r.scoreMax, acao: r.acao, geradoEm: r.geradoEm,
      hits: r.hits.map((h) => ({ alvo: h.alvoIndice, entidade: h.entidadeId, tipo: h.tipoMatch, sim: h.similaridade, score: h.score })),
    },
  };
}

export const ROTULO_NIVEL: Record<NivelRisco, string> = { CRITICO: 'Crítico', ALTO: 'Alto', MEDIO: 'Médio', BAIXO: 'Baixo' };
export const ROTULO_ACAO: Record<AcaoExigida, string> = {
  COMITE_COMPLIANCE: 'Bloqueio · parecer do Comitê de Compliance',
  APROVACAO_SOCIO_AREA: 'Aprovação do sócio da área afetada',
  CIENCIA_RESPONSAVEL: 'Ciência do responsável pelo intake',
  LIBERAR: 'Liberado para proposta/contrato',
};
export const ROTULO_MATCH: Record<TipoMatch, string> = {
  DOCUMENTO_EXATO: 'CPF/CNPJ idêntico',
  RAIZ_CNPJ: 'Mesma raiz de CNPJ',
  GRUPO_ECONOMICO: 'Grupo econômico',
  NOME_EXATO: 'Nome idêntico',
  NOME_FONETICO: 'Nome fonético',
  NOME_APROXIMADO: 'Nome aproximado',
};
