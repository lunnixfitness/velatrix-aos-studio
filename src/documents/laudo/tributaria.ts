/**
 * Emissão do laudo de Recuperação Tributária (P28).
 * O crédito só entra no laudo se a competência estiver dentro do prazo do CTN art. 168, I,
 * e a memória de cálculo tiver origem declarada. Função pura.
 */
import { validarCNPJ } from '../extracao/validadores.ts';
import {
  type BaseEmissao, type Conselho, type ResponsavelTecnico,
  pendenciasBase, pendenciasResponsavel, pendenciasTexto, lerDataIso, mesAbsoluto,
} from './comum.ts';

export const CONSELHOS_TRIBUTARIA: readonly Conselho[] = ['CRC', 'OAB'];

export interface EstadoTributario extends BaseEmissao {
  cnpj: string;
  /** Competências 'AAAA-MM' presentes na memória de cálculo. */
  competencias: string[];
  /** Data do pedido (PER/DCOMP ou ajuizamento), AAAA-MM-DD — marco da prescrição. */
  dataReferencia: string;
  teses: string[];
}

export interface ConteudoTributario {
  responsavel: ResponsavelTecnico;
  fundamentacao: string;
  conclusao: string;
}

/**
 * Competências fora do prazo quinquenal. Considera o recolhimento no mês seguinte à competência e,
 * por granularidade mensal, trata o mês-limite como prescrito (lado conservador: não afirma crédito duvidoso).
 */
export function competenciasPrescritas(competencias: string[], dataReferencia: string): string[] {
  const ref = lerDataIso(dataReferencia);
  if (!ref) return [];
  const refMes = ref.getUTCFullYear() * 12 + ref.getUTCMonth();
  return competencias.filter((c) => {
    const m = mesAbsoluto(c);
    return m !== null && m + 1 <= refMes - 60;
  });
}

export function pendenciasLaudoTributario(e: EstadoTributario, c: ConteudoTributario): string[] {
  const p = pendenciasBase(e);

  if (!validarCNPJ(e.cnpj)) p.push('CNPJ do contribuinte ausente ou com dígito verificador inválido.');

  const ref = lerDataIso(e.dataReferencia);
  if (!ref) p.push('Informe a data de referência do pedido (PER/DCOMP ou ajuizamento) em AAAA-MM-DD.');

  if (!e.competencias.length) {
    p.push('Memória de cálculo sem competências apuradas.');
  } else {
    const invalidas = e.competencias.filter((x) => mesAbsoluto(x) === null);
    if (invalidas.length) p.push(`${invalidas.length} competência(s) em formato inválido (esperado AAAA-MM).`);
    if (ref) {
      const refMes = ref.getUTCFullYear() * 12 + ref.getUTCMonth();
      const futuras = e.competencias.filter((x) => { const m = mesAbsoluto(x); return m !== null && m > refMes; });
      if (futuras.length) p.push(`${futuras.length} competência(s) posteriores à data de referência.`);
      const prescritas = competenciasPrescritas(e.competencias, e.dataReferencia);
      if (prescritas.length) {
        p.push(`${prescritas.length} competência(s) fora do prazo quinquenal (CTN art. 168, I): ${prescritas.slice(0, 3).join(', ')}${prescritas.length > 3 ? '…' : ''}. Remova-as da memória de cálculo.`);
      }
    }
  }

  if (!e.teses.filter((t) => t.trim()).length) p.push('Vincule ao menos uma tese/fundamento ao crédito.');

  p.push(...pendenciasResponsavel(c.responsavel, CONSELHOS_TRIBUTARIA));
  p.push(...pendenciasTexto('a fundamentação técnica do crédito', c.fundamentacao, 40));
  p.push(...pendenciasTexto('a conclusão do laudo', c.conclusao, 40));
  return p;
}
