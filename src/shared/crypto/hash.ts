/**
 * Isomorphic Cryptographic Hashing module using Web Crypto API.
 * Compatible with modern browsers and Node.js 20+. Zero external dependencies.
 */
import { canonicalize } from './canonical.ts';

export async function sha256Hex(input: string | Uint8Array): Promise<string> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const digestBuffer = await globalThis.crypto.subtle.digest(
    'SHA-256',
    bytes as Uint8Array<ArrayBuffer>
  );
  return Array.from(new Uint8Array(digestBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashCanonical(value: unknown): Promise<string> {
  const canonicalString = canonicalize(value);
  return sha256Hex(canonicalString);
}
