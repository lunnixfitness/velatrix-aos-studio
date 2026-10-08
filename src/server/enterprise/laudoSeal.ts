/**
 * VELATRIX AOS · Enterprise · Selo do laudo (Ferramenta 5 · P13/P17).
 *
 * Reexporta e utiliza a implementação isomórfica única de src/shared/crypto/*.
 * PDF/A-2b final → SHA-256 → ledger → carimbo RFC 3161 (ACT ICP-Brasil)
 * → assinatura PAdES do PROFISSIONAL.
 */
export { canonicalize } from '../../shared/crypto/canonical.ts';
export { sha256Hex, hashCanonical } from '../../shared/crypto/hash.ts';
import { sha256Hex, hashCanonical } from '../../shared/crypto/hash.ts';
import { verifyDocumentHash } from './hash.ts';

export interface TimestampProvider { nome: string; carimbar(hashHex: string): Promise<{ token: Uint8Array; emitidoEm: string; act: string }>; }
export interface PadesSigner { assinar(pdf: Uint8Array, signatario: Signatario): Promise<Uint8Array>; }
export interface Signatario { nome: string; conselho: 'OAB' | 'CRC' | 'CREA' | 'CORECON' | 'CNPC'; registro: string; certificado: 'A1_COFRE' | 'A3_NUVEM'; }

export interface SeloLaudo {
  hashSha256: string;
  carimbo: { status: 'CARIMBADO'; act: string; emitidoEm: string } | { status: 'SEM_CARIMBO_DO_TEMPO' };
  signatario: { nome: string; conselho: string; registro: string } | null;
  assinado: boolean;
  urlVerificacao: string;
}

export interface LaudoPayloadParaSelo {
  tenantId: string;
  laudoId: string;
  versao: number | string;
  payload: unknown;
  emitidoEmUTC: string;
  signatario: {
    nome: string;
    registroClasse: string;
  };
}

/**
 * Calcula o selo do laudo de forma canônica e determinística:
 * hashCanonical({ tenantId, laudoId, versao, payload, emitidoEmUTC, signatario: { nome, registroClasse } })
 */
export async function calcularSeloLaudo(dados: LaudoPayloadParaSelo): Promise<string> {
  return hashCanonical({
    tenantId: dados.tenantId,
    laudoId: dados.laudoId,
    versao: dados.versao,
    payload: dados.payload,
    emitidoEmUTC: dados.emitidoEmUTC,
    signatario: {
      nome: dados.signatario.nome,
      registroClasse: dados.signatario.registroClasse,
    },
  });
}

export async function selarLaudo(
  pdfFinal: Uint8Array,
  opts: { signatario?: Signatario; signer?: PadesSigner; timestamp?: TimestampProvider; baseUrl: string },
): Promise<{ pdf: Uint8Array; selo: SeloLaudo }> {
  let pdf = pdfFinal;
  let assinado = false;
  if (opts.signatario && opts.signer) { pdf = await opts.signer.assinar(pdf, opts.signatario); assinado = true; }
  const hashSha256 = await sha256Hex(pdf);
  let carimbo: SeloLaudo['carimbo'] = { status: 'SEM_CARIMBO_DO_TEMPO' };
  if (opts.timestamp) { const t = await opts.timestamp.carimbar(hashSha256); carimbo = { status: 'CARIMBADO', act: t.act, emitidoEm: t.emitidoEm }; }
  return {
    pdf,
    selo: {
      hashSha256, carimbo, assinado,
      signatario: opts.signatario ? { nome: opts.signatario.nome, conselho: opts.signatario.conselho, registro: opts.signatario.registro } : null,
      urlVerificacao: `${opts.baseUrl.replace(/\/$/, '')}/verificar/${hashSha256}`,
    },
  };
}

/** /verificar/<hash>: só metadados públicos — nunca o conteúdo do laudo. */
export async function respostaVerificacao(selo: SeloLaudo | undefined, pdfApresentado?: Uint8Array) {
  if (!selo) return { status: 'NAO_ENCONTRADO' as const };
  const integro = pdfApresentado ? await verifyDocumentHash(pdfApresentado, selo.hashSha256) : undefined;
  return { status: 'ENCONTRADO' as const, hash: selo.hashSha256, carimbo: selo.carimbo, signatario: selo.signatario, assinado: selo.assinado, integro };
}

