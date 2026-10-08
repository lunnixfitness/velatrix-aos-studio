/**
 * VELATRIX AOS · Enterprise · Hash síncrono (SOMENTE servidor) — P18.
 *
 * Mesmo algoritmo de hashCanonical() em src/shared/crypto/hash.ts:
 * SHA-256 sobre o UTF-8 do JSON canônico (RFC 8785 / JCS).
 * Existe para caminhos síncronos do servidor (ledger, store) sem propagar async.
 * Nunca importar no bundle do browser (usa node:crypto).
 */
import { createHash } from 'node:crypto';
import { canonicalize } from '../../shared/crypto/canonical.ts';

export const GENESIS_HEX = '0'.repeat(64);

export function sha256HexSync(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

export function hashCanonicalSync(value: unknown): string {
  return sha256HexSync(canonicalize(value));
}
