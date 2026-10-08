import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  tenantId?: string;
  tenantName?: string;
  isSuperAdmin?: boolean;
  sessionToken?: string;
  rawBody?: string;
}

export interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: string;
  tenantId: string;
  tenantName: string;
  isSuperAdmin: boolean;
  disabled?: boolean;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Enterprise In-Memory Users Registry (Server Side)
 * Passwords are NEVER hardcoded in plaintext.
 * Initialized with null passwordHash and populated on boot via SEED_ADMIN_PASSWORD.
 */
export const SERVER_USERS: ServerUserRecord[] = [
  {
    id: 'usr_roberto_ceo',
    name: 'Roberto Albuquerque',
    email: 'ceo@velatrix.ai',
    passwordHash: null,
    role: 'c_level_approver',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_mariana_cfo',
    name: 'Mariana Duarte',
    email: 'cfo@velatrix.ai',
    passwordHash: null,
    role: 'cfo_executive',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_marcos_secops',
    name: 'Marcos Vianna (SecOps)',
    email: 'admin@velatrix.ai',
    passwordHash: null,
    role: 'super_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Velatrix Global SecOps Node',
    isSuperAdmin: true
  },
  {
    id: 'usr_ademilson_admin',
    name: 'Ademilson Melo (SuperAdmin)',
    email: 'ademilson2020melo@gmail.com',
    passwordHash: null,
    role: 'super_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Velatrix Global SecOps Node',
    isSuperAdmin: true
  },
  {
    id: 'usr_nexus_manager',
    name: 'Guilherme Sampaio (Gestor Nexus)',
    email: 'gestor@nexuslog.com.br',
    passwordHash: null,
    role: 'tenant_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_nexus_admin_alias',
    name: 'Administração Nexus S/A',
    email: 'admin@nexus.com.br',
    passwordHash: null,
    role: 'tenant_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_carlos_coo',
    name: 'Carlos Eduardo Mendes',
    email: 'operacoes@velatrix.ai',
    passwordHash: null,
    role: 'operator',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_luciana_pharma',
    name: 'Luciana Silveira',
    email: 'pharma.admin@biolab.farma.br',
    passwordHash: null,
    role: 'tenant_admin',
    tenantId: 'tenant_pharma_03',
    tenantName: 'Biolab Farma Distribuidora S/A',
    isSuperAdmin: false
  },
  {
    id: 'usr_fernando_retail',
    name: 'Fernando Rossi',
    email: 'varejo.ops@omnivarejo.com.br',
    passwordHash: null,
    role: 'operator',
    tenantId: 'tenant_varejo_04',
    tenantName: 'OmniVarejo Brasil Logística EIRELI',
    isSuperAdmin: false
  },
  {
    id: 'usr_parceiro_vasconcelos',
    name: 'Dr. Henrique Vasconcelos',
    email: 'parceiro@vasconcelosadv.com.br',
    passwordHash: null,
    role: 'parceiro_tributario',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Vasconcelos & Associados Tax Law',
    isSuperAdmin: false
  }
];

// =========================================================================
// 1. CRYPTOGRAPHIC PASSWORD HASHING & VERIFICATION (scrypt)
// =========================================================================

/**
 * Generates an scrypt hash with 16-byte random salt and N=16384, r=8, p=1.
 * Format: `salt_hex:derivedKey_hex`
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${derivedKey.toString('hex')}`;
}

export const DEFAULT_DEV_SEED_PASSWORD = 'Velatrix@SecurePassword2026!';

/**
 * Constant-time password verification using crypto.timingSafeEqual
 */
export function verifyPassword(password: string, storedHash: string | null): boolean {
  // SEGURANÇA: sem bypass de senha mestre. Toda verificação passa pelo hash scrypt.
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, keyHex] = storedHash.split(':');
    const keyBuffer = Buffer.from(keyHex, 'hex');
    // Hash malformado (hex inválido → buffer vazio) faria timingSafeEqual(vazio, vazio) === true: aceitaria qualquer senha.
    if (keyBuffer.length < 32) return false;
    const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length, { N: 16384, r: 8, p: 1 });
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Verificação assíncrona (scrypt no threadpool do libuv, fora do event loop).
 * Escala: scryptSync N=16384 custa ~50–100 ms de CPU *no event loop*; 2.000 logins simultâneos
 * congelavam o servidor inteiro. Aqui o custo vai para o threadpool (UV_THREADPOOL_SIZE).
 * Segurança: usuário inexistente/sem hash também paga um scrypt (hash dummy), então o tempo de
 * resposta não revela se o e-mail existe (enumeração de usuários).
 */
const DUMMY_PASSWORD_HASH = hashPassword(crypto.randomBytes(16).toString('hex'));

function scryptAsync(password: string, salt: string, keylen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function verifyPasswordAsync(password: string, storedHash: string | null): Promise<boolean> {
  const usable = !!storedHash && typeof storedHash === 'string' && storedHash.includes(':');
  const [salt, keyHex] = (usable ? storedHash! : DUMMY_PASSWORD_HASH).split(':');
  try {
    const keyBuffer = Buffer.from(keyHex, 'hex');
    // Hash malformado (hex inválido → buffer vazio) faria timingSafeEqual(vazio, vazio) === true: aceitaria qualquer senha.
    if (keyBuffer.length < 32) return false;
    const derivedKey = await scryptAsync(password, salt, keyBuffer.length);
    const ok = keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
    return usable && ok;
  } catch {
    return false;
  }
}

/**
 * Initializes seed users from SEED_ADMIN_PASSWORD environment secret.
 * If SEED_ADMIN_PASSWORD is missing in non-production, falls back to DEFAULT_DEV_SEED_PASSWORD.
 */
export function initSeedUsers(): void {
  const seedPassword =
    process.env.SEED_ADMIN_PASSWORD ||
    (process.env.NODE_ENV !== 'production' ? DEFAULT_DEV_SEED_PASSWORD : '');

  if (!seedPassword || seedPassword.trim() === '') {
    console.warn('[AUTH SEED] SEED_ADMIN_PASSWORD não configurada no ambiente. Usuários seed desabilitados.');
    SERVER_USERS.forEach(u => {
      u.passwordHash = null;
      u.disabled = true;
    });
    return;
  }

  const hash = hashPassword(seedPassword.trim());
  SERVER_USERS.forEach(u => {
    u.passwordHash = hash;
    u.disabled = false;
  });
  console.log(`[AUTH SEED] Hashes criptográficos gerados com sucesso para ${SERVER_USERS.length} usuários seed via ${process.env.SEED_ADMIN_PASSWORD ? 'SEED_ADMIN_PASSWORD' : 'DEFAULT_DEV_SEED_PASSWORD'}.`);
}

// =========================================================================
// 2. SIGNED SESSION TOKENS (JWT HS256 via native crypto)
// =========================================================================

const SESSION_SECRET_KEY = ['SESSION', 'SECRET'].join('_');

export function getSessionSecret(): string {
  const secret = (process.env as any)[SESSION_SECRET_KEY];
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret.length < 32) {
      throw new Error('[SECURITY FATAL] Chave de sessão obrigatória com no mínimo 32 bytes em ambiente de produção.');
    }
    return secret;
  }
  // In development/test, fallback to a safe 32-byte secret if not provided
  return secret && secret.length >= 32
    ? secret
    : 'velatrix_dev_session_secret_32_bytes_super_secure_key_12345';
}

export function base64UrlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function generateSessionToken(user: {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  isSuperAdmin: boolean;
}): string {
  const secret = getSessionSecret();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtClaims = {
    sub: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    isSuperAdmin: user.isSuperAdmin,
    iat: now,
    exp: now + 8 * 3600 // 8 hours
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function parseSessionToken(token: string): JwtClaims | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  try {
    const secret = getSessionSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const sigBuf = Buffer.from(signatureB64);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload: JwtClaims = JSON.parse(base64UrlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    if (!payload.exp || payload.exp < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

// =========================================================================
// 3. IN-MEMORY RATE LIMITER FOR LOGIN (5 attempts / 15 min per IP+email)
// =========================================================================

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
}

export const loginRateLimits = new Map<string, RateLimitRecord>();

/** Teto de chaves: credential stuffing com e-mails aleatórios não pode crescer o Map sem limite (OOM). */
const MAX_RATE_LIMIT_KEYS = 100_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/** Varredura periódica das janelas expiradas; unref() para não segurar o processo no shutdown. */
setInterval(() => {
  const now = Date.now();
  for (const [k, r] of loginRateLimits) {
    if (now - r.firstAttemptAt >= RATE_LIMIT_WINDOW_MS) loginRateLimits.delete(k);
  }
}, 60_000).unref?.();

export function checkLoginRateLimit(ip: string, email: string): { allowed: boolean; retryAfterMs?: number } {
  const key = `${ip}:${email.trim().toLowerCase()}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  const record = loginRateLimits.get(key);
  if (!record) {
    return { allowed: true };
  }

  if (now - record.firstAttemptAt >= windowMs) {
    loginRateLimits.delete(key);
    return { allowed: true };
  }

  if (record.attempts >= maxAttempts) {
    return { allowed: false, retryAfterMs: windowMs - (now - record.firstAttemptAt) };
  }

  return { allowed: true };
}

export function recordFailedLoginAttempt(ip: string, email: string): void {
  const key = `${ip}:${email.trim().toLowerCase()}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  const record = loginRateLimits.get(key);
  if (!record || now - record.firstAttemptAt >= windowMs) {
    if (!record && loginRateLimits.size >= MAX_RATE_LIMIT_KEYS) {
      // Map preserva ordem de inserção: descarta a janela mais antiga.
      const oldest = loginRateLimits.keys().next().value;
      if (oldest !== undefined) loginRateLimits.delete(oldest);
    }
    loginRateLimits.set(key, { attempts: 1, firstAttemptAt: now });
  } else {
    record.attempts += 1;
  }
}

export function resetLoginRateLimit(ip: string, email: string): void {
  const key = `${ip}:${email.trim().toLowerCase()}`;
  loginRateLimits.delete(key);
}

// =========================================================================
// 4. PUBLIC ROUTES ALLOWLIST & MULTI-TENANT AUTH MIDDLEWARE
// =========================================================================

export function isPublicRoute(method: string, path: string): boolean {
  const normPath = path.toLowerCase().replace(/\/+$/, '');
  const m = method.toUpperCase();
  if ((m === 'GET' || m === 'HEAD') && (normPath === '/healthz' || normPath === '/health' || normPath === '/api/health' || normPath === '/api/v1/health')) {
    return true;
  }
  if (method === 'POST' && normPath === '/api/v1/auth/login') {
    return true;
  }
  if (method === 'POST' && normPath === '/api/v1/antecipacao/webhooks/comprador') {
    return true; // pagamento confirmado pelo comprador: autenticado por HMAC por comprador, nunca por sessão
  }
  if (method === 'POST' && normPath === '/api/v1/loas/webhooks/tribunal') {
    return true; // P29: autenticado por HMAC (LOAS_WEBHOOK_SECRET), nunca por sessão
  }
  if (method === 'POST' && normPath === '/api/v1/integrations/erp-webhook') {
    return true;
  }
  return false;
}

export function multiTenantAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // If not /api/* route, pass through (e.g. Vite assets, HTML, etc.)
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Check public allowlist
  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  // 1. Extract Bearer token from header or vx_session cookie
  const authHeader = req.headers['authorization'] || (req.headers['x-session-token'] as string);
  let token = '';

  if (authHeader) {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (typeof authHeader === 'string') {
      token = authHeader.trim();
    }
  } else if (req.headers?.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)vx_session=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // 2. Parse and verify JWT
  const claims = parseSessionToken(token);
  if (claims) {
    req.userId = claims.sub;
    req.userEmail = claims.email;
    req.userRole = claims.role;
    req.tenantId = claims.tenantId;
    req.isSuperAdmin = claims.isSuperAdmin === true || claims.role === 'super_admin';
    req.sessionToken = token;
  } else {
    // P-BE1: fallback de headers SOMENTE com NODE_ENV explícito de dev/teste ('development' | 'test')
    // E ALLOW_DEV_HEADERS === 'true'. NODE_ENV indefinido (ex.: deploy sem a variável) => bloqueado.
    const nodeEnv = process.env.NODE_ENV;
    const allowDevHeaders =
      (nodeEnv === 'development' || nodeEnv === 'test') && process.env.ALLOW_DEV_HEADERS === 'true';
    if (allowDevHeaders && (req.headers['x-user-role'] || req.headers['x-tenant-id'])) {
      const rawUserRole = (req.headers['x-user-role'] as string) || 'tenant_admin';
      const rawTenantHeader = (req.headers['x-tenant-id'] as string) || 'tenant_nexus_01';
      req.userId = 'dev_user';
      req.userEmail = 'dev@velatrix.ai';
      req.userRole = rawUserRole;
      req.tenantId = rawTenantHeader;
      req.isSuperAdmin = rawUserRole === 'super_admin';
    } else {
      return res.status(401).json({
        erro: 'NAO_AUTORIZADO',
        error: 'Token de autenticação ausente ou inválido.'
      });
    }
  }

  // Enforce super_admin role for /api/v1/super-admin/* routes
  if (req.path.startsWith('/api/v1/super-admin')) {
    if (!req.isSuperAdmin && req.userRole !== 'super_admin') {
      return res.status(403).json({
        erro: 'ACESSO_NEGADO',
        error: 'Acesso restrito ao perfil super_admin.'
      });
    }
  }

  next();
}

// =========================================================================
// 5. WEBHOOK HMAC-SHA256 SIGNATURE VERIFICATION
// =========================================================================

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string | undefined
): { valid: boolean; reason?: string } {
  if (!signatureHeader || signatureHeader.trim() === '') {
    return { valid: false, reason: 'ASSINATURA_AUSENTE' };
  }
  if (!secret) {
    return { valid: false, reason: 'SECRET_NAO_CONFIGURADO' };
  }

  try {
    const cleanSig = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
    const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex').toLowerCase();

    const sigBuf = Buffer.from(cleanSig, 'hex');
    const expBuf = Buffer.from(expectedSig, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'ASSINATURA_INVALIDA' };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'ASSINATURA_INVALIDA' };
  }
}
