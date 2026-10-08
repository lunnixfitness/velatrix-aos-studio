/**
 * VELATRIX AOS · P28 · Divergência CadÚnico × grupo familiar declarado.
 * Casa membros por CPF (forte) e, na falta, por nome normalizado (fraco).
 */
import type { MembroFamiliar } from '../tipos.ts';
import type { MembroCadUnico } from './extratoresLoas.ts';

export type TipoDivergencia =
  | 'DECLARADO_SEM_CADUNICO'   // declarado na esteira mas ausente no CadÚnico
  | 'CADUNICO_SEM_DECLARACAO'  // consta no CadÚnico mas não foi declarado
  | 'CASADO_POR_NOME';         // casou só por nome (sem CPF) — conferir

export interface Divergencia {
  tipo: TipoDivergencia;
  nome: string;
  membroId?: string;
}

export function normalizarNome(n: string): string {
  return n
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\b(DA|DE|DO|DAS|DOS|E)\b/g, ' ')
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function compararCadUnico(
  declarados: Array<MembroFamiliar & { cpf?: string }>,
  cadUnico: MembroCadUnico[],
): { divergencias: Divergencia[]; consistente: boolean } {
  const divergencias: Divergencia[] = [];
  const usados = new Set<number>();
  const porCpf = new Map<string, number>();
  cadUnico.forEach((m, i) => { if (m.cpf) porCpf.set(m.cpf, i); });

  for (const d of declarados.filter((x) => x.mesmoTeto)) {
    const cpf = d.cpf?.replace(/\D/g, '');
    if (cpf && porCpf.has(cpf) && !usados.has(porCpf.get(cpf)!)) {
      usados.add(porCpf.get(cpf)!);
      continue;
    }
    const alvo = normalizarNome(d.nome);
    const idx = cadUnico.findIndex((m, i) => !usados.has(i) && normalizarNome(m.nome) === alvo);
    if (idx >= 0) {
      usados.add(idx);
      divergencias.push({ tipo: 'CASADO_POR_NOME', nome: d.nome, membroId: d.id });
    } else {
      divergencias.push({ tipo: 'DECLARADO_SEM_CADUNICO', nome: d.nome, membroId: d.id });
    }
  }
  cadUnico.forEach((m, i) => {
    if (!usados.has(i)) divergencias.push({ tipo: 'CADUNICO_SEM_DECLARACAO', nome: m.nome });
  });

  return {
    divergencias,
    consistente: divergencias.every((x) => x.tipo === 'CASADO_POR_NOME'),
  };
}
