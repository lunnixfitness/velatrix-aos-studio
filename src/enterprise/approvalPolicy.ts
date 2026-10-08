/**
 * VELATRIX AOS · Enterprise · Política de aprovação por papel (P19/P20).
 *
 * Fonte única usada pelo servidor (autoridade) e pela UI (só para habilitar botões).
 * super_admin (fabricante Velatrix) fica DE FORA de propósito: aprovar laudo é ato do
 * profissional habilitado do tenant, não do licenciante.
 */
import type { Esteira } from './riskShield';

export const ESTEIRAS: readonly Esteira[] = ['RECUPERACAO_TRIBUTARIA', 'PERICIA_JUDICIAL', 'INSS', 'INSS_OBRAS', 'PRECATORIA', 'DIAGNOSTICO'];

export const ROLE_APPROVE: Readonly<Record<string, readonly Esteira[]>> = {
  tenant_admin: ESTEIRAS,
  c_level_approver: ESTEIRAS,
  cfo_executive: ['PRECATORIA', 'RECUPERACAO_TRIBUTARIA', 'DIAGNOSTICO'],
  parceiro_tributario: ['RECUPERACAO_TRIBUTARIA', 'PERICIA_JUDICIAL', 'INSS', 'INSS_OBRAS', 'PRECATORIA'],
};

export function podeAprovarEsteira(role: string | undefined, esteira: Esteira): boolean {
  return !!role && (ROLE_APPROVE[role] ?? []).includes(esteira);
}
