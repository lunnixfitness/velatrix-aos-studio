/**  node --experimental-strip-types --test src/shared/crypto/__tests__/sha256Sync.nodetest.ts */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sha256HexSync } from '../sha256Sync.ts';

test('igual ao node:crypto em tamanhos de borda e UTF-8', () => {
  const casos = ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(63), 'a'.repeat(64), 'a'.repeat(119), 'laudo pericial ✓ ação '.repeat(500)];
  for (const s of casos) assert.equal(sha256HexSync(s), createHash('sha256').update(s).digest('hex'), `len ${s.length}`);
});

test('vetor NIST "abc"', () => {
  assert.equal(sha256HexSync('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('bytes', () => {
  const b = new Uint8Array(1000).map((_, i) => i % 256);
  assert.equal(sha256HexSync(b), createHash('sha256').update(b).digest('hex'));
});
