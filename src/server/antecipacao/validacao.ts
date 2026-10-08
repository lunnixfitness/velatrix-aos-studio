/**
 * VELATRIX AOS · Antecipação · validação de entrada (sem dependência externa, erros RFC 7807).
 * tenantId/advogadoId/id NUNCA vêm do corpo.
 */
import { ErroValidacao } from '../loas/validacao.ts';
import type { CreditoJudicial, ParcelaId } from '../../antecipacao/tipos.ts';

export type EntradaCredito = Omit<CreditoJudicial, 'id' | 'tenantId' | 'advogadoId'>;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isData = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00Z'));
const isCentavos = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0;
const str = (v: unknown, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const PARCELAS: ParcelaId[] = ['CREDOR', 'HONORARIOS_CONTRATUAIS', 'HONORARIOS_SUCUMBENCIAIS'];
export const VALOR_MAX_CENTAVOS = 10_000_000_000_00; // R$ 10 bi: barra erro de digitação/overflow

export function validarEntradaCredito(body: unknown): EntradaCredito {
  const e: Array<{ campo: string; msg: string }> = [];
  if (!isObj(body)) throw new ErroValidacao([{ campo: '$', msg: 'objeto esperado' }]);
  const b = body;
  if (b.tipo !== 'PRECATORIO' && b.tipo !== 'RPV') e.push({ campo: 'tipo', msg: 'PRECATORIO | RPV' });
  if (typeof b.numeroProcesso !== 'string' || b.numeroProcesso.replace(/\D/g, '').length !== 20) e.push({ campo: 'numeroProcesso', msg: '20 dígitos (padrão CNJ)' });
  if (!str(b.tribunal, 12) || !/^[A-Za-z0-9]{2,12}$/.test(String(b.tribunal))) e.push({ campo: 'tribunal', msg: 'sigla do tribunal (ex.: TRF3, TJSP)' });
  if (b.esfera !== 'FEDERAL' && b.esfera !== 'ESTADUAL' && b.esfera !== 'MUNICIPAL') e.push({ campo: 'esfera', msg: 'FEDERAL | ESTADUAL | MUNICIPAL' });
  if (!str(b.enteDevedor, 120)) e.push({ campo: 'enteDevedor', msg: 'obrigatório' });
  if (b.ufEnte !== undefined && (typeof b.ufEnte !== 'string' || !/^[A-Z]{2}$/.test(b.ufEnte))) e.push({ campo: 'ufEnte', msg: 'UF com 2 letras' });
  if (b.natureza !== 'ALIMENTAR' && b.natureza !== 'COMUM') e.push({ campo: 'natureza', msg: 'ALIMENTAR | COMUM' });
  const cr = b.credor;
  if (!isObj(cr)) e.push({ campo: 'credor', msg: 'obrigatório' });
  else {
    if (!str(cr.nome, 160)) e.push({ campo: 'credor.nome', msg: 'obrigatório' });
    if (typeof cr.documento !== 'string' || !/^(\d{11}|\d{14})$/.test(cr.documento.replace(/\D/g, ''))) e.push({ campo: 'credor.documento', msg: 'CPF (11) ou CNPJ (14)' });
    if (cr.dataNascimento !== undefined && !isData(cr.dataNascimento)) e.push({ campo: 'credor.dataNascimento', msg: 'AAAA-MM-DD' });
  }
  if (!isCentavos(b.valorFaceCentavos) || (b.valorFaceCentavos as number) <= 0 || (b.valorFaceCentavos as number) > VALOR_MAX_CENTAVOS) e.push({ campo: 'valorFaceCentavos', msg: 'inteiro em centavos, > 0' });
  if (!isData(b.dataBase)) e.push({ campo: 'dataBase', msg: 'AAAA-MM-DD' });
  if (b.dataRequisicao !== undefined && b.dataRequisicao !== null && !isData(b.dataRequisicao)) e.push({ campo: 'dataRequisicao', msg: 'AAAA-MM-DD' });
  if (typeof b.transitoEmJulgado !== 'boolean') e.push({ campo: 'transitoEmJulgado', msg: 'booleano' });
  const hc = b.honorariosContratuaisBps ?? 0;
  if (!Number.isSafeInteger(hc) || (hc as number) < 0 || (hc as number) > 5000) e.push({ campo: 'honorariosContratuaisBps', msg: '0–5000 bps (até 50%)' });
  const hs = b.honorariosSucumbenciaisCentavos ?? 0;
  if (!isCentavos(hs) || (hs as number) > VALOR_MAX_CENTAVOS) e.push({ campo: 'honorariosSucumbenciaisCentavos', msg: 'inteiro em centavos ≥ 0' });
  const ces = b.cessoesAnteriores ?? 0;
  if (!Number.isSafeInteger(ces) || (ces as number) < 0 || (ces as number) > 50) e.push({ campo: 'cessoesAnteriores', msg: '0–50' });
  const d = isObj(b.declaracoes) ? b.declaracoes : {};
  for (const k of ['penhoraConhecida', 'herdeirosPendentes', 'acaoRescisoria', 'impugnacaoCalculosPendente']) {
    if (typeof d[k] !== 'boolean') e.push({ campo: `declaracoes.${k}`, msg: 'booleano obrigatório (declaração do advogado)' });
  }
  const parc = b.parcelasParaAntecipar;
  if (!Array.isArray(parc) || parc.length === 0 || parc.some((p) => !PARCELAS.includes(p as ParcelaId)) || new Set(parc).size !== parc.length) {
    e.push({ campo: 'parcelasParaAntecipar', msg: 'lista não vazia de CREDOR | HONORARIOS_CONTRATUAIS | HONORARIOS_SUCUMBENCIAIS' });
  }
  if (e.length) throw new ErroValidacao(e);

  const c = cr as Obj;
  return {
    tipo: b.tipo as EntradaCredito['tipo'],
    numeroProcesso: String(b.numeroProcesso),
    tribunal: String(b.tribunal).toUpperCase(),
    esfera: b.esfera as EntradaCredito['esfera'],
    enteDevedor: String(b.enteDevedor).trim(),
    ufEnte: b.ufEnte as string | undefined,
    natureza: b.natureza as EntradaCredito['natureza'],
    credor: {
      nome: String(c.nome).trim(),
      documento: String(c.documento).replace(/\D/g, ''),
      dataNascimento: c.dataNascimento as string | undefined,
      doencaGrave: c.doencaGrave === true,
      deficiencia: c.deficiencia === true,
    },
    valorFaceCentavos: b.valorFaceCentavos as number,
    dataBase: b.dataBase as string,
    dataRequisicao: (b.dataRequisicao ?? undefined) as string | undefined,
    transitoEmJulgado: b.transitoEmJulgado as boolean,
    honorariosContratuaisBps: hc as number,
    honorariosSucumbenciaisCentavos: hs as number,
    cessoesAnteriores: ces as number,
    declaracoes: {
      penhoraConhecida: d.penhoraConhecida as boolean,
      herdeirosPendentes: d.herdeirosPendentes as boolean,
      acaoRescisoria: d.acaoRescisoria as boolean,
      impugnacaoCalculosPendente: d.impugnacaoCalculosPendente as boolean,
    },
    parcelasParaAntecipar: parc as ParcelaId[],
  };
}
