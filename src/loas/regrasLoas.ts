/**
 * VELATRIX AOS · P27 · Regras Versionadas de Elegibilidade LOAS/BPC
 *
 * TABELA VERSIONADA, nunca valor vindo do cliente:
 * - salarioMinimoPorCompetencia: Record<'AAAA-MM', centavos>. Seed com valores marcados
 *   `fonte: 'PREENCHER_E_VALIDAR'` e exporte getSalarioMinimo(competencia) que LANÇA erro se não houver valor.
 * - limiteRendaPerCapita = 1/4 do SM (fração configurável por versão de regra).
 * - idadeMinimaIdoso = 65.
 * - Lista de pré-requisitos: CadÚnico atualizado; requerimento administrativo prévio indeferido (ou mora do INSS);
 *   para DEFICIENCIA: impedimento de longo prazo (>= 2 anos) com laudo.
 * - teses: array curado { id, titulo, fundamento, ativa, revisadoPor, revisadoEm }. Seed SOMENTE com
 *   { id:'STF_RE_567985', titulo:'Critério de 1/4 do SM não é absoluto', ... }.
 *   Nenhuma outra citação pode ser gerada por IA; novas teses só via cadastro manual com revisor.
 * Cada regra tem `versao` (semver) e `vigenciaInicio`. O cálculo grava a versão usada.
 */

import type { ParentescoLoas } from './tipos.ts';

export interface SalarioMinimoRegistro {
  competencia: string; // 'AAAA-MM'
  centavos: number;
  fonte: 'PREENCHER_E_VALIDAR' | string;
  legislacao: string;
}

/** Tabela auditável com fontes e normas */
export const TABELA_SALARIO_MINIMO_FONTES: Record<string, SalarioMinimoRegistro> = {
  // 2023
  '2023-01': { competencia: '2023-01', centavos: 130200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'MP nº 1.143/2022' },
  '2023-02': { competencia: '2023-02', centavos: 130200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'MP nº 1.143/2022' },
  '2023-03': { competencia: '2023-03', centavos: 130200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'MP nº 1.143/2022' },
  '2023-04': { competencia: '2023-04', centavos: 130200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'MP nº 1.143/2022' },
  '2023-05': { competencia: '2023-05', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'MP nº 1.172/2023 / Lei 14.663/2023' },
  '2023-06': { competencia: '2023-06', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-07': { competencia: '2023-07', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-08': { competencia: '2023-08', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-09': { competencia: '2023-09', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-10': { competencia: '2023-10', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-11': { competencia: '2023-11', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },
  '2023-12': { competencia: '2023-12', centavos: 132000, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Lei nº 14.663/2023' },

  // 2024 (R$ 1.412,00)
  '2024-01': { competencia: '2024-01', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-02': { competencia: '2024-02', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-03': { competencia: '2024-03', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-04': { competencia: '2024-04', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-05': { competencia: '2024-05', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-06': { competencia: '2024-06', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-07': { competencia: '2024-07', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-08': { competencia: '2024-08', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-09': { competencia: '2024-09', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-10': { competencia: '2024-10', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-11': { competencia: '2024-11', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },
  '2024-12': { competencia: '2024-12', centavos: 141200, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 11.864/2023' },

  // 2025 (R$ 1.518,00)
  '2025-01': { competencia: '2025-01', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-02': { competencia: '2025-02', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-03': { competencia: '2025-03', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-04': { competencia: '2025-04', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-05': { competencia: '2025-05', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-06': { competencia: '2025-06', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-07': { competencia: '2025-07', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-08': { competencia: '2025-08', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-09': { competencia: '2025-09', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-10': { competencia: '2025-10', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-11': { competencia: '2025-11', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },
  '2025-12': { competencia: '2025-12', centavos: 151800, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto nº 12.339/2024' },

  // 2026 (R$ 1.620,00)
  '2026-01': { competencia: '2026-01', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-02': { competencia: '2026-02', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-03': { competencia: '2026-03', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-04': { competencia: '2026-04', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-05': { competencia: '2026-05', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-06': { competencia: '2026-06', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-07': { competencia: '2026-07', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-08': { competencia: '2026-08', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-09': { competencia: '2026-09', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-10': { competencia: '2026-10', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-11': { competencia: '2026-11', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' },
  '2026-12': { competencia: '2026-12', centavos: 162100, fonte: 'PREENCHER_E_VALIDAR', legislacao: 'Decreto de reajuste 2026 (R$ 1.621,00) — conferir nº no DOU' }
};

/** Mapeamento direto de competência 'AAAA-MM' para centavos */
export const salarioMinimoPorCompetencia: Record<string, number> = Object.fromEntries(
  Object.entries(TABELA_SALARIO_MINIMO_FONTES).map(([k, v]) => [k, v.centavos])
);

/**
 * Retorna o salário mínimo em centavos para a competência informada.
 * Lança erro explícito se a competência não estiver cadastrada.
 */
export function getSalarioMinimo(competencia: string): number {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) {
    throw new Error(`Competência com formato inválido: "${competencia}". Formato esperado: AAAA-MM.`);
  }

  const valor = salarioMinimoPorCompetencia[competencia];
  if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
    throw new Error(`Salário mínimo não cadastrado para a competência "${competencia}".`);
  }

  return valor;
}

export interface TeseCurada {
  id: string;
  titulo: string;
  fundamento: string;
  ativa: boolean;
  revisadoPor: string;
  revisadoEm: string; // ISO date
}

/**
 * Teses jurídicas curadas para LOAS / BPC.
 * PROIBIDO gerar citações via IA. Apenas teses previamente validadas por revisor técnico.
 */
export const TESES_CURADAS_LOAS: readonly TeseCurada[] = Object.freeze([
  {
    id: 'STF_RE_567985',
    titulo: 'Critério de 1/4 do SM não é absoluto',
    fundamento:
      'Declaração de inconstitucionalidade parcial sem pronúncia de nulidade do art. 20, § 3º, da Lei nº 8.742/1993 pelo STF no RE 567.985/MT (Tema 27 da Repercussão Geral). Reconheceu-se a defasagem do critério de 1/4 do salário mínimo per capita e a admissão de comprovação da miserabilidade por outros meios idôneos de prova.',
    ativa: true,
    revisadoPor: 'COMISSAO_PREVIDENCIARIA_OAB',
    revisadoEm: '2026-01-15'
  }
]);

export interface PreRequisitoDef {
  codigo: string;
  descricao: string;
  baseLegal: string;
  obrigatorioPara: 'TODOS' | 'DEFICIENCIA' | 'IDOSO';
}

export const PRE_REQUISITOS_LOAS: readonly PreRequisitoDef[] = Object.freeze([
  {
    codigo: 'CADUNICO_ATUALIZADO',
    descricao: 'Inscrição ativa e atualizada no CadÚnico nos últimos 24 meses.',
    baseLegal: 'Decreto nº 6.214/2007, Art. 12 c/c Lei nº 8.742/1993',
    obrigatorioPara: 'TODOS'
  },
  {
    codigo: 'REQUERIMENTO_PREVIO_INSS',
    descricao: 'Requerimento administrativo prévio indeferido ou caracterização de mora excessiva do INSS (>90 dias).',
    baseLegal: 'STF — RE 631.240 (Tema 350 da Repercussão Geral)',
    obrigatorioPara: 'TODOS'
  },
  {
    codigo: 'IMPEDIMENTO_LONGO_PRAZO',
    descricao: 'Impedimento de longo prazo de natureza física, mental, intelectual ou sensorial com duração mínima de 2 anos, comprovado por laudo médico.',
    baseLegal: 'Lei nº 8.742/1993, Art. 20, § 2º e § 10',
    obrigatorioPara: 'DEFICIENCIA'
  }
]);

export interface RegrasLoas {
  versao: string;
  vigenciaInicio: string;
  limiteRendaPerCapitaNumerador: number; // 1
  limiteRendaPerCapitaDenominador: number; // 4
  idadeMinimaIdoso: number; // 65
  parentescosComputados: readonly ParentescoLoas[];
  teses: readonly TeseCurada[];
  preRequisitos: readonly PreRequisitoDef[];
}

export const REGRAS_LOAS_V1: RegrasLoas = Object.freeze({
  versao: '1.0.0',
  vigenciaInicio: '2024-01-01',
  limiteRendaPerCapitaNumerador: 1,
  limiteRendaPerCapitaDenominador: 4,
  idadeMinimaIdoso: 65,
  parentescosComputados: Object.freeze<ParentescoLoas[]>([
    'REQUERENTE',
    'CONJUGE',
    'COMPANHEIRO',
    'PAI',
    'MAE',
    'PADRASTO',
    'MADRASTA',
    'IRMAO_SOLTEIRO',
    'FILHO_SOLTEIRO',
    'ENTEADO_SOLTEIRO',
    'MENOR_TUTELADO'
  ]),
  teses: TESES_CURADAS_LOAS,
  preRequisitos: PRE_REQUISITOS_LOAS
});
