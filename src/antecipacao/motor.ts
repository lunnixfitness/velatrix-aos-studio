/**
 * VELATRIX AOS · Antecipação de Precatórios & RPVs — motor puro
 *
 * Sem I/O, sem relógio implícito (hoje é injetado), determinístico. Mesma entrada → mesmo hash.
 *  1. Triagem: checagens com base legal; flag = pior severidade entre as que FALHARAM.
 *  2. Prazo: limite constitucional (CF 100 §5º) / legal (RPV) + cenário conservador.
 *  3. Precificação por comprador: VP = face / (1 + taxa)^(meses/12), limitado pelo deságio mínimo.
 *  4. Ofertas ranqueadas pelo maior valor ao cedente; compradores fora do apetite com motivo.
 */
import { sha256HexSync } from '../shared/crypto/sha256Sync.ts';
import { REGRAS_ANTECIPACAO_V1, normalizarEnte, type RegrasAntecipacao } from './regras.ts';
import type {
  AnaliseCredito, Comprador, CompradorExcluido, CreditoJudicial, Flag, ItemTriagem, ItemFormalizacao, LinhaMemoria,
  Oferta, OfertaParcela, Parcela, ParcelaId, PrazoEstimado, ResultadoOfertas, Severidade, StatusCredito,
} from './tipos.ts';

// ───────────────────────── utilidades ─────────────────────────

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (bps: number) => `${(bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

/** Divisão inteira com arredondamento bancário (half-even). */
export function divHalfEven(num: number, den: number): number {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) throw new Error('divHalfEven: inteiros e den ≠ 0');
  const q = Math.trunc(num / den);
  const r = num - q * den;
  const dobro = Math.abs(r) * 2, d = Math.abs(den);
  if (dobro < d) return q;
  const sinal = (num < 0) !== (den < 0) ? -1 : 1;
  if (dobro > d) return q + sinal;
  return q % 2 === 0 ? q : q + sinal;
}

/** JSON canônico (chaves ordenadas) para hash estável. */
export function canonico(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonico).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonico(o[k])}`).join(',')}}`;
}
export const hashCanonico = (v: unknown) => sha256HexSync(canonico(v));

const somenteDigitos = (s: string) => s.replace(/\D/g, '');

function mod97(digitos: string): number {
  let r = 0;
  for (let i = 0; i < digitos.length; i += 7) r = Number(String(r) + digitos.slice(i, i + 7)) % 97;
  return r;
}

/** Numeração única CNJ (Res. 65/2008): NNNNNNN-DD.AAAA.J.TR.OOOO, DV ISO 7064 mod 97-10. */
export function validarNumeroCnj(numero: string): { valido: boolean; normalizado: string; motivo?: string } {
  const d = somenteDigitos(numero);
  if (d.length !== 20) return { valido: false, normalizado: d, motivo: 'deve ter 20 dígitos' };
  const n = d.slice(0, 7), dv = d.slice(7, 9), resto = d.slice(9);
  const ok = mod97(n + resto + dv) === 1;
  const fmt = `${n}-${dv}.${resto.slice(0, 4)}.${resto[4]}.${resto.slice(5, 7)}.${resto.slice(7)}`;
  return ok ? { valido: true, normalizado: fmt } : { valido: false, normalizado: fmt, motivo: 'dígito verificador não confere' };
}

/** Calcula o DV CNJ (útil para testes e para sugerir correção). */
export function digitoCnj(n7: string, ano: string, j: string, tr: string, origem: string): string {
  const dv = 98 - mod97(n7 + ano + j + tr + origem + '00');
  return String(dv).padStart(2, '0');
}

export function validarCpf(cpf: string): boolean {
  const d = somenteDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(d[9]) && calc(10) === Number(d[10]);
}

export function validarCnpj(cnpj: string): boolean {
  const d = somenteDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = pesos.reduce((acc, p, i) => acc + Number(d[i]) * p, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

const dataValida = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
function mesesEntre(de: string, ate: string): number {
  const ms = Date.parse(ate + 'T00:00:00Z') - Date.parse(de + 'T00:00:00Z');
  return Math.max(0, Math.ceil(ms / (30.4375 * 86_400_000)));
}
function somarMeses(data: string, m: number): string {
  const d = new Date(data + 'T00:00:00Z');
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
}
function somarDias(data: string, n: number): string {
  return new Date(Date.parse(data + 'T00:00:00Z') + n * 86_400_000).toISOString().slice(0, 10);
}
function idade(nasc: string, hoje: string): number {
  const [a, m, d] = nasc.split('-').map(Number);
  const [ha, hm, hd] = hoje.split('-').map(Number);
  return ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0);
}

const PESO: Record<Severidade, number> = { INFO: 0, YELLOW: 1, RED: 2 };

// ───────────────────────── análise ─────────────────────────

export interface EntradaAnalise {
  credito: CreditoJudicial;
  hoje: string;
  /** Salário mínimo vigente na data-base (centavos) — resolvido pelo chamador a partir da tabela oficial. */
  salarioMinimoCentavos: number;
  regras?: RegrasAntecipacao;
}

export function tetoRpv(c: Pick<CreditoJudicial, 'esfera' | 'enteDevedor'>, salarioMinimoCentavos: number, regras = REGRAS_ANTECIPACAO_V1) {
  const local = regras.tetoRpvPorEnte[normalizarEnte(c.enteDevedor)];
  const r = local ?? regras.tetoRpvSm[c.esfera];
  return { centavos: r.sm * salarioMinimoCentavos, sm: r.sm, norma: r.norma, fonte: r.fonte };
}

export function calcularParcelas(c: CreditoJudicial): Parcela[] {
  const contratuais = divHalfEven(c.valorFaceCentavos * c.honorariosContratuaisBps, 10_000);
  const todas: Parcela[] = [
    { id: 'CREDOR', cedente: 'CLIENTE', valorCentavos: c.valorFaceCentavos - contratuais },
    { id: 'HONORARIOS_CONTRATUAIS', cedente: 'ADVOGADO', valorCentavos: contratuais },
    { id: 'HONORARIOS_SUCUMBENCIAIS', cedente: 'ADVOGADO', valorCentavos: c.honorariosSucumbenciaisCentavos },
  ];
  return todas.filter((p) => p.valorCentavos > 0 && c.parcelasParaAntecipar.includes(p.id));
}

export interface LinhaCascata {
  id: 'FACE' | 'HON_CONTRATUAIS' | 'RETENCOES' | 'PARCELA_CREDOR' | ParcelaId | 'BASE_CEDIVEL';
  rotulo: string;
  sinal: '=' | '-' | '+';
  centavos: number;
  fundamento?: string;
}
export interface CascataBaseCedivel { linhas: LinhaCascata[]; baseCedivelCentavos: number; }

const ROTULO_PARCELA: Record<ParcelaId, string> = {
  CREDOR: 'Parcela do cliente (credor)',
  HONORARIOS_CONTRATUAIS: 'Honorários contratuais (cedidos pelo advogado)',
  HONORARIOS_SUCUMBENCIAIS: 'Honorários sucumbenciais (requisição própria)',
};

/**
 * Base cedível = soma das parcelas efetivamente cedidas (calcularParcelas). Deságio e taxa são SEMPRE
 * calculados sobre ela — nunca sobre o valor de face bruto. Centavos inteiros, half-even.
 */
export function cascataBaseCedivel(c: CreditoJudicial): CascataBaseCedivel {
  const contratuais = divHalfEven(c.valorFaceCentavos * c.honorariosContratuaisBps, 10_000);
  const parcelas = calcularParcelas(c);
  const base = parcelas.reduce((s, p) => s + p.valorCentavos, 0);
  const linhas: LinhaCascata[] = [
    { id: 'FACE', rotulo: 'Valor de face requisitado', sinal: '=', centavos: c.valorFaceCentavos },
    { id: 'HON_CONTRATUAIS', rotulo: `(−) Honorários contratuais destacados (${pct(c.honorariosContratuaisBps)})`, sinal: '-', centavos: contratuais, fundamento: 'EAOAB art. 22, §4º' },
    { id: 'RETENCOES', rotulo: '(−) Retenções na fonte (IR/PSS)', sinal: '-', centavos: 0, fundamento: 'Não informadas no cadastro: valores brutos. Retenção é feita pelo tribunal no pagamento (PREENCHER_E_VALIDAR).' },
    { id: 'PARCELA_CREDOR', rotulo: '= Parcela do cliente', sinal: '=', centavos: c.valorFaceCentavos - contratuais },
    ...parcelas.map((p): LinhaCascata => ({ id: p.id, rotulo: `(+) Cedido: ${ROTULO_PARCELA[p.id]}`, sinal: '+', centavos: p.valorCentavos })),
    { id: 'BASE_CEDIVEL', rotulo: '= Base cedível (base do deságio)', sinal: '=', centavos: base },
  ];
  return { linhas, baseCedivelCentavos: base };
}

export function estimarPrazo(c: CreditoJudicial, hoje: string, regras = REGRAS_ANTECIPACAO_V1): PrazoEstimado {
  const regimeEspecial = c.tipo === 'PRECATORIO' && !!regras.entesRegimeEspecial[normalizarEnte(c.enteDevedor)];
  const preferencial =
    c.natureza === 'ALIMENTAR' &&
    ((!!c.credor.dataNascimento && dataValida(c.credor.dataNascimento) && idade(c.credor.dataNascimento, hoje) >= regras.idadePreferencia) ||
      !!c.credor.doencaGrave || !!c.credor.deficiencia);

  let dataLimiteLegal: string | null = null;
  let fundamento: string;
  if (c.tipo === 'RPV') {
    const base = dataValida(c.dataRequisicao) ? c.dataRequisicao! : hoje;
    dataLimiteLegal = somarMeses(base, regras.prazoRpvMeses);
    fundamento = regras.prazoRpvFundamento + (dataValida(c.dataRequisicao) ? '' : ' — RPV ainda não expedida: contado a partir de hoje');
  } else if (dataValida(c.dataRequisicao)) {
    const [ano, mes, dia] = c.dataRequisicao!.split('-').map(Number);
    const noPrazo = mes < regras.corteApresentacao.mes || (mes === regras.corteApresentacao.mes && dia <= regras.corteApresentacao.dia);
    dataLimiteLegal = `${ano + (noPrazo ? 1 : 2)}-12-31`;
    fundamento = regras.corteApresentacao.norma;
    if (regimeEspecial && dataLimiteLegal < regras.fimRegimeEspecial) {
      dataLimiteLegal = regras.fimRegimeEspecial;
      fundamento += `; ente em regime especial — limite até ${regras.fimRegimeEspecial} (ADCT art. 101)`;
    }
  } else {
    fundamento = 'Data de apresentação do precatório não informada — prazo estimado de forma conservadora';
  }

  const emMora = !!dataLimiteLegal && dataLimiteLegal < hoje;
  let mesesCentral: number;
  if (!dataLimiteLegal) mesesCentral = 24;
  else if (emMora) mesesCentral = 6;
  else mesesCentral = Math.max(1, mesesEntre(hoje, dataLimiteLegal));
  const extra = emMora ? regras.atrasoConservadorMeses.emMora : regimeEspecial ? regras.atrasoConservadorMeses.regimeEspecial : regras.atrasoConservadorMeses.normal;
  return { dataLimiteLegal, mesesCentral, mesesConservador: mesesCentral + extra, fundamento, emMora, regimeEspecial, preferencial };
}

export function analisarCredito({ credito: c, hoje, salarioMinimoCentavos, regras = REGRAS_ANTECIPACAO_V1 }: EntradaAnalise): AnaliseCredito {
  if (!Number.isSafeInteger(salarioMinimoCentavos) || salarioMinimoCentavos <= 0) throw new Error('salário mínimo inválido');
  const teto = tetoRpv(c, salarioMinimoCentavos, regras);
  const prazo = estimarPrazo(c, hoje, regras);
  const parcelas = calcularParcelas(c);
  const t: ItemTriagem[] = [];
  const add = (id: string, descricao: string, severidade: Severidade, ok: boolean | null, evidencia: string, baseLegal?: string) =>
    t.push({ id, descricao, severidade, baseLegal, resultado: ok === null ? { status: 'NAO_VERIFICADO', motivo: evidencia } : ok ? { status: 'OK', evidencia } : { status: 'FALHA', evidencia } });

  const cnj = validarNumeroCnj(c.numeroProcesso);
  add('CNJ_VALIDO', 'Número do processo no padrão CNJ', 'RED', cnj.valido, cnj.valido ? cnj.normalizado : `${cnj.normalizado}: ${cnj.motivo}`, 'Resolução CNJ nº 65/2008');
  const doc = somenteDigitos(c.credor.documento);
  const docOk = doc.length === 11 ? validarCpf(doc) : doc.length === 14 ? validarCnpj(doc) : false;
  add('DOC_CREDOR', 'CPF/CNPJ do credor válido', 'RED', docOk, docOk ? (doc.length === 11 ? 'CPF válido' : 'CNPJ válido') : 'documento inválido');
  add('TRANSITO', 'Trânsito em julgado', 'RED', c.transitoEmJulgado, c.transitoEmJulgado ? 'declarado pelo advogado' : 'sem trânsito em julgado: não há requisição exigível', 'CF art. 100, §5º; CPC art. 535, §3º');
  if (c.tipo === 'RPV') {
    const ok = c.valorFaceCentavos <= teto.centavos;
    add('TETO_RPV', `Valor dentro do teto de RPV (${teto.sm} SM = ${brl(teto.centavos)})`, 'RED', ok,
      ok ? `${brl(c.valorFaceCentavos)} ≤ ${brl(teto.centavos)}` : `${brl(c.valorFaceCentavos)} excede o teto: o pagamento seria por precatório (ou com renúncia ao excedente)`, `${teto.norma}; CF art. 100, §3º`);
  } else {
    const abaixo = c.valorFaceCentavos <= teto.centavos;
    add('TETO_PRECATORIO', 'Valor acima do teto de RPV (coerente com precatório)', 'INFO', !abaixo,
      abaixo ? `valor ≤ ${brl(teto.centavos)}: confirme se não cabe RPV (pagamento mais rápido)` : 'ok', teto.norma);
  }
  add('PENHORA', 'Sem penhora/bloqueio conhecido sobre o crédito', 'RED', !c.declaracoes.penhoraConhecida, c.declaracoes.penhoraConhecida ? 'penhora declarada pelo advogado' : 'nenhuma declarada');
  add('HERDEIROS', 'Sem sucessão/herdeiros pendentes de habilitação', 'RED', !c.declaracoes.herdeirosPendentes, c.declaracoes.herdeirosPendentes ? 'habilitação pendente' : 'nenhuma declarada', 'CPC arts. 687-692');
  add('RESCISORIA', 'Sem ação rescisória contra o título', 'RED', !c.declaracoes.acaoRescisoria, c.declaracoes.acaoRescisoria ? 'rescisória declarada' : 'nenhuma declarada', 'CPC art. 966');
  add('IMPUGNACAO', 'Sem impugnação de cálculos pendente', 'YELLOW', !c.declaracoes.impugnacaoCalculosPendente, c.declaracoes.impugnacaoCalculosPendente ? 'valor ainda pode mudar' : 'nenhuma declarada', 'CPC art. 535');
  add('CESSOES', 'Cadeia de cessões curta', c.cessoesAnteriores >= 2 ? 'YELLOW' : 'INFO', c.cessoesAnteriores === 0, c.cessoesAnteriores === 0 ? 'sem cessões anteriores' : `${c.cessoesAnteriores} cessão(ões) anterior(es): exigir cadeia completa`, 'CF art. 100, §§13-14');
  if (c.tipo === 'PRECATORIO') {
    add('DATA_APRESENTACAO', 'Data de apresentação do precatório informada', 'YELLOW', dataValida(c.dataRequisicao) ? true : null,
      dataValida(c.dataRequisicao) ? c.dataRequisicao! : 'sem a data, o prazo é estimado de forma conservadora', 'CF art. 100, §5º');
    add('REGIME_ESPECIAL', 'Ente fora do regime especial de pagamento', 'YELLOW', !prazo.regimeEspecial, prazo.regimeEspecial ? `pagamento até ${REGRAS_ANTECIPACAO_V1.fimRegimeEspecial} pelo regime especial` : 'regime geral', 'ADCT art. 101');
  }
  add('MORA', 'Ente dentro do prazo de pagamento', 'YELLOW', !prazo.emMora, prazo.emMora ? `prazo vencido em ${prazo.dataLimiteLegal}: ente em mora` : prazo.dataLimiteLegal ? `limite ${prazo.dataLimiteLegal}` : 'sem data-limite');
  add('PARCELAS', 'Há parcela selecionada para antecipar', 'RED', parcelas.length > 0, parcelas.length ? parcelas.map((p) => `${p.id}: ${brl(p.valorCentavos)}`).join(' · ') : 'nenhuma parcela com valor');
  if (prazo.preferencial) add('PREFERENCIA', 'Credor com preferência constitucional', 'INFO', true, 'idoso, doença grave ou deficiência: parcela superpreferencial pode ser paga antes', 'CF art. 100, §2º');

  const falhas = t.filter((i) => i.resultado.status === 'FALHA');
  const naoVerificados = t.filter((i) => i.resultado.status === 'NAO_VERIFICADO' && i.severidade !== 'INFO');
  const pior = falhas.reduce((m, i) => Math.max(m, PESO[i.severidade]), 0);
  const flag: Flag = pior === 2 ? 'RED' : pior === 1 || naoVerificados.length ? 'YELLOW' : 'GREEN';

  const memoria: LinhaMemoria[] = [
    { passo: 'Valor de face (data-base ' + c.dataBase + ')', valor: brl(c.valorFaceCentavos) },
    { passo: 'Honorários contratuais destacados', valor: `${pct(c.honorariosContratuaisBps)} = ${brl(divHalfEven(c.valorFaceCentavos * c.honorariosContratuaisBps, 10_000))}`, fundamento: 'EAOAB art. 22, §4º' },
    { passo: 'Honorários sucumbenciais (requisição própria)', valor: brl(c.honorariosSucumbenciaisCentavos), fundamento: 'EAOAB art. 23' },
    { passo: `Teto de RPV (${teto.sm} SM)`, valor: brl(teto.centavos), fundamento: teto.norma },
    { passo: 'Data-limite de pagamento', valor: prazo.dataLimiteLegal ?? 'não determinada', fundamento: prazo.fundamento },
    { passo: 'Prazo central / conservador', valor: `${prazo.mesesCentral} / ${prazo.mesesConservador} meses` },
    { passo: 'Base cedível (parcelas cedidas) — base do deságio', valor: brl(parcelas.reduce((s, p) => s + p.valorCentavos, 0)) },
  ];
  return { versaoRegras: regras.versao, hoje, flag, triagem: t, parcelas, prazo, tetoRpvCentavos: teto.centavos, memoria };
}

// ───────────────────────── precificação & ofertas ─────────────────────────

/** VP de um valor de face descontado à taxa anual (bps) por `meses`, com deságio mínimo. */
export function precificar(faceCentavos: number, taxaAaBps: number, meses: number, desagioMinBps: number): number {
  const fator = Math.pow(1 + taxaAaBps / 10_000, meses / 12);
  const vp = Math.floor(faceCentavos / fator); // floor: nunca oferta acima do VP
  const teto = faceCentavos - divHalfEven(faceCentavos * desagioMinBps, 10_000);
  return Math.max(0, Math.min(vp, teto));
}

export function motivosInelegibilidade(c: CreditoJudicial, a: AnaliseCredito, k: Comprador): string[] {
  const p = k.politica, m: string[] = [];
  if (!k.ativo) m.push('comprador inativo');
  if (!p.tipos.includes(c.tipo)) m.push(`não compra ${c.tipo}`);
  if (!p.esferas.includes(c.esfera)) m.push(`não atua na esfera ${c.esfera}`);
  if (!p.naturezas.includes(c.natureza)) m.push(`não compra crédito ${c.natureza.toLowerCase()}`);
  if (p.tribunais.length && !p.tribunais.includes(c.tribunal.toUpperCase())) m.push(`não atua no ${c.tribunal}`);
  if (!p.flagsAceitas.includes(a.flag)) m.push(`não aceita risco ${a.flag}`);
  if (a.prazo.regimeEspecial && !p.aceitaRegimeEspecial) m.push('não compra ente em regime especial');
  if (!p.aceitaHonorarios && a.parcelas.some((x) => x.cedente === 'ADVOGADO')) m.push('não antecipa honorários');
  const total = a.parcelas.reduce((s, x) => s + x.valorCentavos, 0);
  if (total < p.ticketMinCentavos) m.push(`ticket abaixo do mínimo (${brl(p.ticketMinCentavos)})`);
  if (total > p.ticketMaxCentavos) m.push(`ticket acima do máximo (${brl(p.ticketMaxCentavos)})`);
  return m;
}

/**
 * Gera uma oferta por comprador elegível (lances "fechados", calculados pela política de cada um).
 * Ranking: maior valor total ao cedente; empate → menor taxa efetiva → id do comprador.
 */
export function gerarOfertas(c: CreditoJudicial, a: AnaliseCredito, compradores: Comprador[]): ResultadoOfertas {
  const ofertas: Oferta[] = [];
  const excluidos: CompradorExcluido[] = [];
  if (a.flag === 'RED') {
    return { ofertas, excluidos: compradores.map((k) => ({ compradorId: k.id, compradorNome: k.nome, motivos: ['crédito bloqueado na triagem (risco RED)'] })), melhorOfertaId: null };
  }
  for (const k of compradores) {
    const motivos = motivosInelegibilidade(c, a, k);
    if (motivos.length) { excluidos.push({ compradorId: k.id, compradorNome: k.nome, motivos }); continue; }
    const taxa = k.politica.taxaAlvoAaBps + k.politica.premioRiscoBps[a.flag];
    const meses = a.prazo.mesesCentral;
    const parcelas: OfertaParcela[] = a.parcelas.map((x) => ({ parcelaId: x.id, valorFaceCentavos: x.valorCentavos, ofertaCentavos: precificar(x.valorCentavos, taxa, meses, k.politica.desagioMinBps) }));
    const totalFace = parcelas.reduce((s, x) => s + x.valorFaceCentavos, 0);
    const totalOferta = parcelas.reduce((s, x) => s + x.ofertaCentavos, 0);
    if (totalOferta <= 0) { excluidos.push({ compradorId: k.id, compradorNome: k.nome, motivos: ['oferta resultante nula'] }); continue; }
    const taxaEfetiva = Math.round((Math.pow(totalFace / totalOferta, 12 / Math.max(1, meses)) - 1) * 10_000);
    const corpo = { compradorId: k.id, parcelas, totalFace, totalOferta, meses, versao: a.versaoRegras, hoje: a.hoje, credito: c.id };
    ofertas.push({
      id: 'of_' + hashCanonico(corpo).slice(0, 16),
      compradorId: k.id,
      compradorNome: k.nome,
      parcelas,
      totalFaceCentavos: totalFace,
      totalOfertaCentavos: totalOferta,
      desagioBps: divHalfEven((totalFace - totalOferta) * 10_000, totalFace),
      taxaEfetivaAaBps: taxaEfetiva,
      prazoMesesConsiderado: meses,
      taxaOriginacaoCentavos: divHalfEven(totalOferta * k.taxaOriginacaoBps, 10_000),
      validaAte: somarDias(a.hoje, k.politica.validadeOfertaDias),
      demo: k.demo,
    });
  }
  ofertas.sort((x, y) => y.totalOfertaCentavos - x.totalOfertaCentavos || x.taxaEfetivaAaBps - y.taxaEfetivaAaBps || x.compradorId.localeCompare(y.compradorId));
  return { ofertas, excluidos, melhorOfertaId: ofertas[0]?.id ?? null };
}

// ───────────────────────── ciclo de vida ─────────────────────────

export const TRANSICOES: Record<StatusCredito, StatusCredito[]> = {
  ANALISADO: ['OFERTA_ESCOLHIDA', 'ANALISADO', 'CANCELADO'],
  BLOQUEADO: ['ANALISADO', 'BLOQUEADO', 'CANCELADO'],
  OFERTA_ESCOLHIDA: ['APROVADO_INTERNO', 'ANALISADO', 'CANCELADO'],
  APROVADO_INTERNO: ['ACEITO_CLIENTE', 'ANALISADO', 'CANCELADO'],
  ACEITO_CLIENTE: ['FORMALIZACAO', 'CANCELADO'],
  FORMALIZACAO: ['PAGO', 'CANCELADO'],
  PAGO: [],
  CANCELADO: [],
};

export class TransicaoInvalida extends Error {
  readonly httpStatus = 409;
  constructor(de: StatusCredito, para: StatusCredito) { super(`transição ${de} → ${para} não permitida`); this.name = 'TransicaoInvalida'; }
}
export function podeTransicionar(de: StatusCredito, para: StatusCredito): boolean { return TRANSICOES[de].includes(para); }
export function exigirTransicao(de: StatusCredito, para: StatusCredito): void { if (!podeTransicionar(de, para)) throw new TransicaoInvalida(de, para); }

export const CHECKLIST_FORMALIZACAO: ReadonlyArray<{ id: ItemFormalizacao; descricao: string; baseLegal?: string }> = Object.freeze([
  { id: 'KYC_CEDENTE', descricao: 'Identidade do cedente validada (KYC) e PLD/FT do comprador concluído', baseLegal: 'Lei 9.613/1998' },
  { id: 'CONTRATO_CESSAO_ASSINADO', descricao: 'Instrumento de cessão assinado pelo cedente e pelo cessionário', baseLegal: 'CC arts. 286-298' },
  { id: 'COMUNICACAO_TRIBUNAL', descricao: 'Cessão comunicada por petição ao tribunal de origem', baseLegal: 'CF art. 100, §14' },
  { id: 'COMUNICACAO_ENTE_DEVEDOR', descricao: 'Cessão comunicada à entidade devedora', baseLegal: 'CF art. 100, §14' },
  { id: 'HONORARIOS_PRESERVADOS', descricao: 'Honorários destacados preservados (ou cedidos pelo próprio advogado)', baseLegal: 'EAOAB art. 22, §4º' },
]);

/** Hash da proposta apresentada: crédito (dados relevantes) + oferta escolhida + versão das regras. */
export function hashProposta(c: CreditoJudicial, oferta: Oferta, versaoRegras: string): string {
  // advogadoId fica fora: trocar o responsável não muda o que foi apresentado ao cliente.
  const { advogadoId: _adv, ...dados } = c;
  return hashCanonico({ credito: dados, oferta, versaoRegras });
}
