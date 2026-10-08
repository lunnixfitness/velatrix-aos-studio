/**
 * VELATRIX AOS · Antecipação · Regras versionadas (tabela, nunca valor vindo do cliente)
 *
 * Valores marcados PREENCHER_E_VALIDAR precisam de conferência jurídica antes de produção.
 */
import type { Esfera } from './tipos.ts';

export interface FonteRegra { fonte: 'LEI' | 'PREENCHER_E_VALIDAR'; norma: string; }

export interface RegrasAntecipacao {
  versao: string;
  vigenciaInicio: string;
  /** Teto de RPV em salários mínimos, por esfera, na ausência de lei local. */
  tetoRpvSm: Record<Esfera, { sm: number } & FonteRegra>;
  /** Lei local do ente que fixa outro teto (chave: ente normalizado). */
  tetoRpvPorEnte: Record<string, { sm: number } & FonteRegra>;
  /** Prazo de pagamento da RPV após a requisição. */
  prazoRpvMeses: number;
  prazoRpvFundamento: string;
  /** Precatório apresentado até este dia/mês entra no orçamento do exercício seguinte. */
  corteApresentacao: { mes: number; dia: number; norma: string };
  /** Entes em regime especial de pagamento (EC 94/2016, EC 109/2021). */
  entesRegimeEspecial: Record<string, FonteRegra>;
  fimRegimeEspecial: string;
  /** Atraso adicional no cenário conservador. */
  atrasoConservadorMeses: { normal: number; regimeEspecial: number; emMora: number };
  idadePreferencia: number;
}

export const REGRAS_ANTECIPACAO_V1: RegrasAntecipacao = Object.freeze({
  versao: '1.0.0',
  vigenciaInicio: '2026-01-01',
  tetoRpvSm: {
    FEDERAL: { sm: 60, fonte: 'LEI', norma: 'Lei nº 10.259/2001, art. 17, §1º c/c art. 3º' },
    ESTADUAL: { sm: 40, fonte: 'LEI', norma: 'ADCT art. 87, I (na ausência de lei estadual — CF art. 100 §§3º-4º)' },
    MUNICIPAL: { sm: 30, fonte: 'LEI', norma: 'ADCT art. 87, II (na ausência de lei municipal — CF art. 100 §§3º-4º)' },
  },
  tetoRpvPorEnte: {
    // Ex.: 'estado de sao paulo': { sm: ?, fonte: 'PREENCHER_E_VALIDAR', norma: 'Lei estadual nº …' },
  },
  prazoRpvMeses: 2,
  prazoRpvFundamento: 'CPC art. 535, §3º, II (2 meses); Lei 10.259/2001 art. 17 (60 dias) na esfera federal',
  corteApresentacao: { mes: 4, dia: 2, norma: 'CF art. 100, §5º (redação da EC 114/2021): apresentados até 2 de abril, pagos até o fim do exercício seguinte' },
  entesRegimeEspecial: {
    // Seed ilustrativo — a lista oficial vem do CNJ/tribunais e muda: validar antes de produção.
    'estado de sao paulo': { fonte: 'PREENCHER_E_VALIDAR', norma: 'ADCT art. 101 (EC 94/2016, EC 99/2017, EC 109/2021)' },
    'municipio de sao paulo': { fonte: 'PREENCHER_E_VALIDAR', norma: 'ADCT art. 101 (EC 94/2016, EC 99/2017, EC 109/2021)' },
    'estado do rio de janeiro': { fonte: 'PREENCHER_E_VALIDAR', norma: 'ADCT art. 101 (EC 94/2016, EC 99/2017, EC 109/2021)' },
  },
  fimRegimeEspecial: '2029-12-31',
  atrasoConservadorMeses: { normal: 6, regimeEspecial: 24, emMora: 18 },
  idadePreferencia: 60,
}) as RegrasAntecipacao;

/** Normaliza nome de ente para busca em tabela (sem acento, minúsculas, espaço simples). */
export function normalizarEnte(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
