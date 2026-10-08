/**
 * VELATRIX AOS · Enterprise · JSON canônico (RFC 8785 / JCS).
 * Reexporta a implementação canônica central de src/shared/crypto/*.
 */
export { canonicalize } from '../shared/crypto/canonical.ts';
export { sha256Hex as sha256HexBrowser, hashCanonical as hashCanonicalBrowser, sha256Hex, hashCanonical } from '../shared/crypto/hash.ts';
