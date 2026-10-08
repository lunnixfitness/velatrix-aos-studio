/**
 * VELATRIX AOS · P29 · Validação de payloads (sem dependência externa)
 * Erros no formato RFC 7807 (application/problem+json).
 */
import type { CasoLoas } from '../../loas/tipos.ts';

export interface Problema { title: string; status: number; detail?: string; errors?: Array<{ campo: string; msg: string }>; }

export class ErroValidacao extends Error {
  readonly httpStatus = 400;
  readonly errors: Array<{ campo: string; msg: string }>;
  constructor(errors: Array<{ campo: string; msg: string }>) { super('Payload inválido'); this.errors = errors; this.name = 'ErroValidacao'; }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isData = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isCentavos = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const str = (v: unknown, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const PARENTESCOS = new Set(['REQUERENTE', 'CONJUGE', 'COMPANHEIRO', 'PAI', 'MAE', 'PADRASTO', 'MADRASTA', 'IRMAO_SOLTEIRO', 'FILHO_SOLTEIRO', 'ENTEADO_SOLTEIRO', 'MENOR_TUTELADO', 'OUTRO']);
const CAT_DESPESA = new Set(['MEDICAMENTO', 'TRATAMENTO', 'FRALDA', 'ALIMENTACAO_ESPECIAL', 'CONSULTA']);

export const LIMITES = { membros: 30, despesas: 100 } as const;

/**
 * Valida a entrada de criação de caso. tenantId e advogadoResponsavelId NUNCA
 * vêm do corpo — são injetados a partir da sessão.
 */
export function validarNovoCaso(body: unknown): Omit<CasoLoas, 'tenantId' | 'advogadoResponsavelId' | 'estagio' | 'versaoRegras'> {
  const e: Array<{ campo: string; msg: string }> = [];
  if (!isObj(body)) throw new ErroValidacao([{ campo: '$', msg: 'objeto esperado' }]);
  if (!str(body.id, 64) || !/^[\w-]+$/.test(String(body.id))) e.push({ campo: 'id', msg: 'id alfanumérico até 64' });
  if (body.categoria !== 'IDOSO' && body.categoria !== 'DEFICIENCIA') e.push({ campo: 'categoria', msg: 'IDOSO | DEFICIENCIA' });
  const r = body.requerente;
  if (!isObj(r)) e.push({ campo: 'requerente', msg: 'obrigatório' });
  else {
    if (!str(r.nome)) e.push({ campo: 'requerente.nome', msg: 'obrigatório' });
    if (typeof r.cpf !== 'string' || !/^\d{11}$/.test(r.cpf)) e.push({ campo: 'requerente.cpf', msg: '11 dígitos' });
    if (!isData(r.dataNascimento)) e.push({ campo: 'requerente.dataNascimento', msg: 'AAAA-MM-DD' });
  }
  if (!Array.isArray(body.grupo) || body.grupo.length > LIMITES.membros) e.push({ campo: 'grupo', msg: `array até ${LIMITES.membros}` });
  else body.grupo.forEach((m, i) => {
    if (!isObj(m)) { e.push({ campo: `grupo[${i}]`, msg: 'objeto' }); return; }
    if (!str(m.id, 64)) e.push({ campo: `grupo[${i}].id`, msg: 'obrigatório' });
    if (!str(m.nome)) e.push({ campo: `grupo[${i}].nome`, msg: 'obrigatório' });
    if (!PARENTESCOS.has(String(m.parentesco))) e.push({ campo: `grupo[${i}].parentesco`, msg: 'fora do rol' });
    if (!isData(m.dataNascimento)) e.push({ campo: `grupo[${i}].dataNascimento`, msg: 'AAAA-MM-DD' });
    if (typeof m.mesmoTeto !== 'boolean') e.push({ campo: `grupo[${i}].mesmoTeto`, msg: 'boolean' });
    if (!isCentavos(m.rendaBrutaCentavos)) e.push({ campo: `grupo[${i}].rendaBrutaCentavos`, msg: 'inteiro ≥ 0 (centavos)' });
  });
  if (!Array.isArray(body.despesas) || body.despesas.length > LIMITES.despesas) e.push({ campo: 'despesas', msg: `array até ${LIMITES.despesas}` });
  else body.despesas.forEach((d, i) => {
    if (!isObj(d)) { e.push({ campo: `despesas[${i}]`, msg: 'objeto' }); return; }
    if (!CAT_DESPESA.has(String(d.categoria))) e.push({ campo: `despesas[${i}].categoria`, msg: 'inválida' });
    if (!isCentavos(d.valorMensalCentavos)) e.push({ campo: `despesas[${i}].valorMensalCentavos`, msg: 'inteiro ≥ 0 (centavos)' });
    if (typeof d.disponivelNoSUS !== 'boolean') e.push({ campo: `despesas[${i}].disponivelNoSUS`, msg: 'boolean' });
  });
  if (typeof body.cadUnicoAtualizado !== 'boolean') e.push({ campo: 'cadUnicoAtualizado', msg: 'boolean' });
  if (!isObj(body.requerimentoAdministrativo)) e.push({ campo: 'requerimentoAdministrativo', msg: 'obrigatório' });
  if (e.length) throw new ErroValidacao(e);
  return body as unknown as Omit<CasoLoas, 'tenantId' | 'advogadoResponsavelId' | 'estagio' | 'versaoRegras'>;
}

export function validarCompetencia(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new ErroValidacao([{ campo: 'competencia', msg: 'AAAA-MM' }]);
  return v;
}

export function problema(e: unknown): Problema {
  if (e instanceof ErroValidacao) return { title: e.message, status: 400, errors: e.errors };
  const st = (e as { httpStatus?: number }).httpStatus;
  const status = typeof st === 'number' ? st : 500;
  return { title: status >= 500 && status !== 501 && status !== 503 ? 'erro interno' : (e as Error).message ?? 'erro', status };
}
