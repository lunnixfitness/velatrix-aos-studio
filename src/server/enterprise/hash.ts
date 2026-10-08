/**
 * VELATRIX AOS · Enterprise · Hash no servidor (P10/P13/P17).
 * Reexporta e utiliza a implementação isomórfica única de src/shared/crypto/*.
 */
export { canonicalize } from '../../shared/crypto/canonical.ts';
export { sha256Hex, hashCanonical } from '../../shared/crypto/hash.ts';
import { sha256Hex, hashCanonical } from '../../shared/crypto/hash.ts';

/** Verifica um entregável (ex.: PDF do laudo) contra o hash registrado. 1 byte alterado → false. */
export async function verifyDocumentHash(document: Uint8Array, expectedHex: string): Promise<boolean> {
  const actual = await sha256Hex(document);
  return actual.toLowerCase() === expectedHex.toLowerCase().replace(/^0x/, '');
}

export interface LedgerEntryInput {
  tenantId: string;
  tipo: string;
  ator: string;
  payload: unknown;
  criadoEm: string; // ISO-8601
}

export interface LedgerEntry extends LedgerEntryInput {
  seq: number;
  prevHash: string;
  hash: string;
}

export const GENESIS = '0'.repeat(64);

/** Encadeia uma entrada: hash = SHA-256(JCS({...entrada, prevHash, seq})). */
export async function chainEntry(prev: LedgerEntry | null, input: LedgerEntryInput): Promise<LedgerEntry> {
  const seq = prev ? prev.seq + 1 : 0;
  const prevHash = prev ? prev.hash : GENESIS;
  const hash = await hashCanonical({ ...input, seq, prevHash });
  return { ...input, seq, prevHash, hash };
}

export async function verifyChain(entries: LedgerEntry[]): Promise<{ ok: true } | { ok: false; brokenAt: number }> {
  let prev: LedgerEntry | null = null;
  for (const e of entries) {
    const { seq: _s, prevHash: _p, hash: _h, ...input } = e;
    const expected = await chainEntry(prev, input);
    if (expected.hash !== e.hash || expected.prevHash !== e.prevHash || expected.seq !== e.seq) {
      return { ok: false, brokenAt: e.seq };
    }
    prev = e;
  }
  return { ok: true };
}

/**
 * Migração P10: recalcula a cadeia com o hash correto e devolve, para cada entrada,
 * o par (hash antigo → novo) para registrar o evento de "rehash" no ledger.
 */
export async function rehashChain(
  legacy: Array<LedgerEntryInput & { hash: string }>,
): Promise<{ entries: LedgerEntry[]; mapping: Array<{ seq: number; oldHash: string; newHash: string }> }> {
  const entries: LedgerEntry[] = [];
  const mapping: Array<{ seq: number; oldHash: string; newHash: string }> = [];
  let prev: LedgerEntry | null = null;
  for (const old of legacy) {
    const { hash: oldHash, ...rest } = old;
    const input: LedgerEntryInput = {
      tenantId: rest.tenantId, tipo: rest.tipo, ator: rest.ator, payload: rest.payload, criadoEm: rest.criadoEm,
    };
    const e = await chainEntry(prev, input);
    entries.push(e);
    mapping.push({ seq: e.seq, oldHash, newHash: e.hash });
    prev = e;
  }
  return { entries, mapping };
}

