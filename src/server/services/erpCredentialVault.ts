import crypto from 'crypto';

/**
 * In-Memory runtime secret cache for tenant credentials.
 * Secrets are kept purely in memory or resolved from process.env,
 * NEVER persisted in plain text in the database.
 */
interface TenantSecretEntry {
  authSecret?: string;
  webhookSecret?: string;
  updatedAt: string;
}

const runtimeSecretVault: Map<string, TenantSecretEntry> = new Map();

export class ErpCredentialVault {
  /**
   * Securely saves the secret in runtime vault and returns the safe alias/ref and webhook hash.
   * Neither credential will be saved in plain text in the DB.
   */
  public static setTenantSecrets(
    tenantId: string,
    authSecret?: string,
    webhookSecret?: string,
    customRefAlias?: string
  ): { credentialRef: string; webhookSecretHash: string } {
    const existing = runtimeSecretVault.get(tenantId) || { updatedAt: new Date().toISOString() };
    
    if (authSecret && authSecret.trim() !== '') {
      existing.authSecret = authSecret.trim();
    }
    if (webhookSecret && webhookSecret.trim() !== '') {
      existing.webhookSecret = webhookSecret.trim();
    }
    existing.updatedAt = new Date().toISOString();
    runtimeSecretVault.set(tenantId, existing);

    const credentialRef = customRefAlias?.trim() || `ERP_SECRET_REF_${tenantId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    
    // Hash webhook secret with SHA-256 for integrity verification
    const webhookSecretToHash = existing.webhookSecret || '';
    const webhookSecretHash = webhookSecretToHash 
      ? crypto.createHash('sha256').update(webhookSecretToHash).digest('hex')
      : '';

    return { credentialRef, webhookSecretHash };
  }

  /**
   * Resolves the real auth credential value:
   * 1. Check environment variable matching credentialRef
   * 2. Check environment variable `ERP_AUTH_SECRET_${tenantId}`
   * 3. Check runtimeSecretVault
   */
  public static resolveAuthSecret(tenantId: string, credentialRef?: string): string | null {
    if (credentialRef && process.env[credentialRef]) {
      return process.env[credentialRef]!;
    }

    const envKeyTenant = `ERP_AUTH_SECRET_${tenantId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    if (process.env[envKeyTenant]) {
      return process.env[envKeyTenant]!;
    }

    const cached = runtimeSecretVault.get(tenantId);
    if (cached?.authSecret) {
      return cached.authSecret;
    }

    return null;
  }

  /**
   * Resolves the real webhook secret for HMAC verification:
   * 1. Check environment variable `ERP_WEBHOOK_SECRET_${tenantId}`
   * 2. Check runtimeSecretVault
   */
  public static resolveWebhookSecret(tenantId: string): string | null {
    const envKeyTenant = `ERP_WEBHOOK_SECRET_${tenantId.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
    if (process.env[envKeyTenant]) {
      return process.env[envKeyTenant]!;
    }

    const cached = runtimeSecretVault.get(tenantId);
    if (cached?.webhookSecret) {
      return cached.webhookSecret;
    }

    return null;
  }

  /**
   * Verifies an incoming payload's HMAC signature.
   * Returns true if signature matches the HMAC-SHA256 of rawBody using the tenant's webhook secret.
   */
  public static verifyHmac(
    tenantId: string,
    rawBody: string,
    signatureHeader: string | undefined,
    expectedWebhookSecretHash?: string
  ): { valid: boolean; reason?: string } {
    if (!signatureHeader || signatureHeader.trim() === '') {
      return { valid: false, reason: 'Assinatura HMAC ausente no cabeçalho (esperado: x-signature ou x-erp-signature).' };
    }

    const secret = this.resolveWebhookSecret(tenantId);
    if (!secret) {
      return { valid: false, reason: `Segredo de webhook não configurado para o tenant ${tenantId}.` };
    }

    // Optional sanity check against stored webhookSecretHash
    if (expectedWebhookSecretHash) {
      const computedSecretHash = crypto.createHash('sha256').update(secret).digest('hex');
      if (computedSecretHash !== expectedWebhookSecretHash) {
        return { valid: false, reason: 'Inconsistência de integridade no hash do segredo de webhook.' };
      }
    }

    // Normalize signature (remove sha256= prefix if present)
    const cleanSignature = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();

    // Compute expected HMAC SHA-256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')
      .toLowerCase();

    // Timing safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(cleanSignature, 'utf-8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

    if (sigBuffer.length !== expectedBuffer.length) {
      return { valid: false, reason: 'Assinatura HMAC com tamanho inválido.' };
    }

    const match = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    return { valid: match, reason: match ? undefined : 'Assinatura HMAC inválida para o payload recebido.' };
  }

  /**
   * Generates a valid HMAC signature for a payload (used by simulator or outbound client).
   */
  public static signPayload(secret: string, rawBody: string): string {
    return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  }
}
