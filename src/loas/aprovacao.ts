/**
 * VELATRIX AOS · P28 · Gatekeeper de aprovação da esteira LOAS
 *
 * - Estagiário/júnior/pleno PREPARAM; só SÊNIOR ou SÓCIO aprovam.
 * - Segregação de funções: quem preparou não aprova.
 * - A aprovação é amarrada ao hash da minuta e ao hash do plano de anexos.
 *   Qualquer edição posterior muda o hash e INVALIDA a aprovação.
 *
 * Integração: o item é publicado na Approval Queue existente
 * (src/services/approvalQueueService.ts) com `payloadHash = hashAprovavel(...)`.
 */
import { sha256HexSync } from '../shared/crypto/sha256Sync.ts';

export type Senioridade = 'ESTAGIARIO' | 'JUNIOR' | 'PLENO' | 'SENIOR' | 'SOCIO';
const PODE_APROVAR: ReadonlySet<Senioridade> = new Set(['SENIOR', 'SOCIO']);

export interface Usuario { id: string; tenantId: string; senioridade: Senioridade; }

export interface Aprovacao {
  casoId: string;
  tenantId: string;
  preparadoPor: string;
  aprovadoPor: string;
  aprovadoEm: string;     // ISO
  minutaHash: string;
  anexosHash: string;
  hashAprovacao: string;  // SHA-256 de tudo acima — vai para a trilha de auditoria
}

export class ErroAprovacao extends Error {
  readonly codigo: 'SEM_ALCADA' | 'MESMO_PREPARADOR' | 'TENANT_DIVERGENTE' | 'MINUTA_BLOQUEADA';
  constructor(codigo: ErroAprovacao['codigo'], msg: string) { super(msg); this.codigo = codigo; this.name = 'ErroAprovacao'; }
}

/** Hash estável do plano de anexos (ordem + fatias). */
export function hashAnexos(plano: unknown): string {
  return sha256HexSync(JSON.stringify(plano));
}

export function aprovar(params: {
  casoId: string;
  tenantId: string;
  preparadoPor: Usuario;
  aprovador: Usuario;
  minuta: { hash: string; bloqueada: boolean };
  anexosHash: string;
  agora?: Date;
}): Aprovacao {
  const { aprovador, preparadoPor, minuta } = params;
  if (aprovador.tenantId !== params.tenantId || preparadoPor.tenantId !== params.tenantId) {
    throw new ErroAprovacao('TENANT_DIVERGENTE', 'Usuário de outro tenant.');
  }
  if (!PODE_APROVAR.has(aprovador.senioridade)) {
    throw new ErroAprovacao('SEM_ALCADA', `Senioridade ${aprovador.senioridade} não aprova peças.`);
  }
  if (aprovador.id === preparadoPor.id) {
    throw new ErroAprovacao('MESMO_PREPARADOR', 'Quem preparou a peça não pode aprová-la.');
  }
  if (minuta.bloqueada) {
    throw new ErroAprovacao('MINUTA_BLOQUEADA', 'Minuta bloqueada pelo guardrail — corrigir antes de aprovar.');
  }
  const base = {
    casoId: params.casoId,
    tenantId: params.tenantId,
    preparadoPor: preparadoPor.id,
    aprovadoPor: aprovador.id,
    aprovadoEm: (params.agora ?? new Date()).toISOString(),
    minutaHash: minuta.hash,
    anexosHash: params.anexosHash,
  };
  return { ...base, hashAprovacao: sha256HexSync(JSON.stringify(base)) };
}

/** A aprovação só vale para exatamente a minuta/anexos aprovados. */
export function aprovacaoValida(a: Aprovacao | undefined, minutaHashAtual: string, anexosHashAtual: string): boolean {
  if (!a) return false;
  const { hashAprovacao, ...base } = a;
  if (sha256HexSync(JSON.stringify(base)) !== hashAprovacao) return false; // registro adulterado
  return a.minutaHash === minutaHashAtual && a.anexosHash === anexosHashAtual;
}
