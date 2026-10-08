/**
 * Emissão do laudo de Diagnóstico de Risco & ROI (P28).
 * Z-Score e ineficiências só valem sobre demonstrações do exercício declarado,
 * custodiadas (DRE + extrato). Função pura.
 */
import { validarCNPJ } from '../extracao/validadores.ts';
import {
  type BaseEmissao, type Conselho, type ResponsavelTecnico,
  pendenciasBase, pendenciasResponsavel, pendenciasTexto,
} from './comum.ts';

export const CONSELHOS_DIAGNOSTICO: readonly Conselho[] = ['CRC'];

export interface EstadoDiagnostico extends BaseEmissao {
  cnpj: string;
  /** Exercício das demonstrações, AAAA. */
  exercicio: string;
  dreCustodiada: boolean;
  extratoCustodiado: boolean;
  /** Ano corrente, injetado para manter a função pura. */
  anoAtual: number;
}

export interface ConteudoDiagnostico {
  responsavel: ResponsavelTecnico;
  conclusao: string;
}

export function pendenciasLaudoDiagnostico(e: EstadoDiagnostico, c: ConteudoDiagnostico): string[] {
  const p = pendenciasBase(e);
  if (!validarCNPJ(e.cnpj)) p.push('CNPJ da empresa ausente ou com dígito verificador inválido.');
  const ano = /^\d{4}$/.test(e.exercicio.trim()) ? Number(e.exercicio) : NaN;
  if (!Number.isFinite(ano)) p.push('Informe o exercício das demonstrações (AAAA).');
  else if (ano > e.anoAtual) p.push('Exercício posterior ao ano corrente.');
  if (!e.dreCustodiada) p.push('Anexe a DRE do exercício à cadeia de custódia.');
  if (!e.extratoCustodiado) p.push('Anexe o extrato bancário à cadeia de custódia.');
  p.push(...pendenciasResponsavel(c.responsavel, CONSELHOS_DIAGNOSTICO));
  p.push(...pendenciasTexto('a conclusão do diagnóstico', c.conclusao, 40));
  return p;
}
