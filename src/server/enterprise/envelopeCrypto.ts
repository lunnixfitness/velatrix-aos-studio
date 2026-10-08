/**
 * VELATRIX AOS · Enterprise · Criptografia em repouso com chave por cliente (P13).
 *
 * Envelope encryption: DEK (32 bytes) por tenant, cifrada pela KEK do KMS
 * (VAULT_KMS_KEY_ID). Campos com AES-256-GCM, nonce aleatório de 12 bytes, tag de 16.
 * Formato: v1.<dekVersao>.<nonce b64url>.<tag b64url>.<cifra b64url>
 * AAD = tenantId → um campo copiado para outro tenant não decifra.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export interface KeyWrapper { // produção: KMS (wrap/unwrap remotos). Dev: LocalKeyWrapper.
  wrap(dek: Buffer): Promise<string>;
  unwrap(wrapped: string): Promise<Buffer>;
}

/** Somente dev/teste: KEK local em memória. Produção deve usar o KMS. */
export class LocalKeyWrapper implements KeyWrapper {
  private kek: Buffer;
  constructor(kek: Buffer = randomBytes(32)) { if (kek.length !== 32) throw new Error('KEK deve ter 32 bytes'); this.kek = kek; }
  async wrap(dek: Buffer): Promise<string> { return encryptRaw(this.kek, dek, Buffer.from('kek')); }
  async unwrap(wrapped: string): Promise<Buffer> { return decryptRaw(this.kek, wrapped, Buffer.from('kek')); }
}

const b64 = (b: Buffer) => b.toString('base64url');

function encryptRaw(key: Buffer, plain: Buffer, aad: Buffer): string {
  const nonce = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, nonce);
  c.setAAD(aad);
  const ct = Buffer.concat([c.update(plain), c.final()]);
  return `${b64(nonce)}.${b64(c.getAuthTag())}.${b64(ct)}`;
}

function decryptRaw(key: Buffer, packed: string, aad: Buffer): Buffer {
  const [n, t, ct] = packed.split('.');
  const d = createDecipheriv('aes-256-gcm', key, Buffer.from(n, 'base64url'));
  d.setAAD(aad);
  d.setAuthTag(Buffer.from(t, 'base64url'));
  return Buffer.concat([d.update(Buffer.from(ct, 'base64url')), d.final()]);
}

export interface TenantKeyRecord { tenantId: string; versao: number; wrappedDek: string; ativa: boolean; }

export class TenantKeyring {
  private cache = new Map<string, Buffer>();
  private wrapper: KeyWrapper;
  private records: TenantKeyRecord[];
  constructor(wrapper: KeyWrapper, records: TenantKeyRecord[] = []) { this.wrapper = wrapper; this.records = records; }

  async criarDek(tenantId: string): Promise<TenantKeyRecord> {
    const versao = Math.max(0, ...this.records.filter((r) => r.tenantId === tenantId).map((r) => r.versao)) + 1;
    for (const r of this.records) if (r.tenantId === tenantId) r.ativa = false;
    const rec = { tenantId, versao, wrappedDek: await this.wrapper.wrap(randomBytes(32)), ativa: true };
    this.records.push(rec);
    return rec;
  }

  private async dek(tenantId: string, versao: number): Promise<Buffer> {
    const k = `${tenantId}:${versao}`;
    const hit = this.cache.get(k);
    if (hit) return hit;
    const rec = this.records.find((r) => r.tenantId === tenantId && r.versao === versao);
    if (!rec) throw new Error(`DEK ${k} inexistente`);
    const d = await this.wrapper.unwrap(rec.wrappedDek);
    this.cache.set(k, d);
    return d;
  }

  async encrypt(tenantId: string, plain: string): Promise<string> {
    const rec = this.records.find((r) => r.tenantId === tenantId && r.ativa) ?? await this.criarDek(tenantId);
    return `v1.${rec.versao}.${encryptRaw(await this.dek(tenantId, rec.versao), Buffer.from(plain, 'utf8'), Buffer.from(tenantId))}`;
  }

  async decrypt(tenantId: string, packed: string): Promise<string> {
    const [v, versao, ...rest] = packed.split('.');
    if (v !== 'v1') throw new Error('formato desconhecido');
    return decryptRaw(await this.dek(tenantId, Number(versao)), rest.join('.'), Buffer.from(tenantId)).toString('utf8');
  }

  versaoDe(packed: string): number { return Number(packed.split('.')[1]); }

  /** Rotação sem downtime: nova DEK ativa; leituras antigas seguem válidas; re-encrypt em background. */
  async rotacionar(tenantId: string, campos: string[]): Promise<string[]> {
    const nova = await this.criarDek(tenantId);
    const out: string[] = [];
    for (const c of campos) out.push(this.versaoDe(c) === nova.versao ? c : await this.encrypt(tenantId, await this.decrypt(tenantId, c)));
    return out;
  }
}
