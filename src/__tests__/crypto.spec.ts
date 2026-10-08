import { describe, it, expect } from 'vitest';
import { canonicalize } from '../shared/crypto/canonical';
import { sha256Hex, hashCanonical } from '../shared/crypto/hash';
import { createHash } from 'node:crypto';

describe('P17 · Selo Criptográfico Real · Canonical e Hash', () => {
  it("sha256Hex('') matches empty string digest", async () => {
    const hash = await sha256Hex('');
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it("sha256Hex('abc') matches NIST vector", async () => {
    const hash = await sha256Hex('abc');
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it("sha256Hex('ação') produces correct UTF-8 hash (same as node:crypto UTF-8)", async () => {
    const hash = await sha256Hex('ação');
    const expected = createHash('sha256').update(Buffer.from('ação', 'utf8')).digest('hex');
    expect(hash).toBe(expected);
  });

  it('canonicalize({b:1,a:[2,{d:1,c:2}]}) formats keys in UTF-16 order', () => {
    const result = canonicalize({ b: 1, a: [2, { d: 1, c: 2 }] });
    expect(result).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });

  it('hashCanonical with keys in different order produces the identical hash', async () => {
    const obj1 = {
      tenantId: 'tenant_01',
      valorCentavos: 150000,
      detalhes: { z: 'fim', a: 'inicio' },
    };
    const obj2 = {
      detalhes: { a: 'inicio', z: 'fim' },
      valorCentavos: 150000,
      tenantId: 'tenant_01',
    };

    const hash1 = await hashCanonical(obj1);
    const hash2 = await hashCanonical(obj2);
    expect(hash1).toBe(hash2);
  });

  it('altering 1 cent in payload produces a completely different hash', async () => {
    const payloadA = {
      tenantId: 'tenant_01',
      valorCentavos: 150000,
    };
    const payloadB = {
      tenantId: 'tenant_01',
      valorCentavos: 150001,
    };

    const hashA = await hashCanonical(payloadA);
    const hashB = await hashCanonical(payloadB);
    expect(hashA).not.toBe(hashB);
  });
});
