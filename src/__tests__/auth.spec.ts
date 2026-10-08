import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';
import crypto from 'crypto';
import { createApp } from '../../server';
import {
  initSeedUsers,
  generateSessionToken,
  SERVER_USERS,
  base64UrlEncode
} from '../server/auth/serverAuth';

describe('VELATRIX AOS · P6 · Autenticação Real no Servidor', () => {
  let server: http.Server;
  let baseUrl: string;

  const TEST_SESSION_SECRET = 'test_secret_session_key_with_at_least_32_characters_long_12345';
  const TEST_SEED_PASSWORD = 'Velatrix@SecurePassword2026!';
  const TEST_ERP_SECRET = 'test_erp_webhook_secret_key_987654';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.SESSION_SECRET = TEST_SESSION_SECRET;
    process.env.SEED_ADMIN_PASSWORD = TEST_SEED_PASSWORD;
    process.env.ERP_WEBHOOK_SECRET = TEST_ERP_SECRET;
    process.env.ERP_WEBHOOK_TENANT_ID = 'tenant_nexus_01';
    process.env.ALLOW_DEV_HEADERS = 'false';

    // Re-initialize seed user hashes with test password
    initSeedUsers();

    const app = await createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server) {
        server.close(() => resolve());
      } else {
        resolve();
      }
    });
  });

  describe('1. Senha e Login', () => {
    it('deve retornar 401 CREDENCIAIS_INVALIDAS para login com senha errada', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ceo@velatrix.ai',
          password: 'senha_completamente_incorreta'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('CREDENCIAIS_INVALIDAS');
    });

    it('deve retornar 401 CREDENCIAIS_INVALIDAS para login com e-mail desconhecido (sem criar usuário)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'usuario.fantasma@desconhecido.com.br',
          password: TEST_SEED_PASSWORD,
          tenantId: 'tenant_nexus_01'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('CREDENCIAIS_INVALIDAS');

      // Confirma que nenhum usuário dinâmico foi criado no registro
      const found = SERVER_USERS.find(u => u.email === 'usuario.fantasma@desconhecido.com.br');
      expect(found).toBeUndefined();
    });

    it('deve retornar 429 após 5 tentativas consecutivas com falha', async () => {
      const attackEmail = 'ratelimit.test@velatrix.ai';

      // Executa 5 tentativas inválidas (1 a 5 devem retornar 401)
      for (let i = 1; i <= 5; i++) {
        const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: attackEmail,
            password: `wrong_pass_${i}`
          })
        });
        expect(res.status).toBe(401);
      }

      // 6ª tentativa deve ser bloqueada pelo rate limiter com 429
      const blockedRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: attackEmail,
          password: 'any_password'
        })
      });

      expect(blockedRes.status).toBe(429);
      const data = await blockedRes.json();
      expect(data.erro).toBe('MUITAS_TENTATIVAS');
    });

    it('deve autenticar com sucesso com credenciais válidas e retornar token assinado', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'ceo@velatrix.ai',
          password: TEST_SEED_PASSWORD
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token.split('.')).toHaveLength(3);
      expect(data.user.email).toBe('ceo@velatrix.ai');
    });
  });

  describe('2. Proteção de Rotas e Verificação de Token', () => {
    it('deve retornar 401 para rota protegida sem token', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('NAO_AUTORIZADO');
    });

    it('deve retornar 401 para token forjado com assinatura inválida', async () => {
      const fakeHeader = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const fakePayload = base64UrlEncode(JSON.stringify({
        sub: 'usr_hacker',
        email: 'hacker@malicious.com',
        role: 'super_admin',
        tenantId: 'tenant_nexus_01',
        isSuperAdmin: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const fakeSignature = 'invalidsignaturehex1234567890abcdef';
      const forgedToken = `${fakeHeader}.${fakePayload}.${fakeSignature}`;

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${forgedToken}` }
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('NAO_AUTORIZADO');
    });

    it('deve retornar 401 para token expirado', async () => {
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const expiredPayload = base64UrlEncode(JSON.stringify({
        sub: 'usr_roberto_ceo',
        email: 'ceo@velatrix.ai',
        role: 'c_level_approver',
        tenantId: 'tenant_nexus_01',
        isSuperAdmin: false,
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600 // Expirado há 1 hora
      }));
      const validSigOnExpired = crypto
        .createHmac('sha256', TEST_SESSION_SECRET)
        .update(`${header}.${expiredPayload}`)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

      const expiredToken = `${header}.${expiredPayload}.${validSigOnExpired}`;

      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('NAO_AUTORIZADO');
    });
  });

  describe('3. Webhook ERP e Assinatura HMAC', () => {
    it('deve retornar 401 para webhook ERP sem assinatura X-Velatrix-Signature', async () => {
      const res = await fetch(`${baseUrl}/api/v1/integrations/erp-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erpType: 'SAP_S4HANA', eventType: 'SYNC' })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('ASSINATURA_AUSENTE');
    });

    it('deve retornar 401 para webhook ERP com assinatura HMAC inválida', async () => {
      const res = await fetch(`${baseUrl}/api/v1/integrations/erp-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Velatrix-Signature': 'deadbeef00112233445566778899aabbccddeeff'
        },
        body: JSON.stringify({ erpType: 'SAP_S4HANA', eventType: 'SYNC' })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.erro).toBe('ASSINATURA_INVALIDA');
    });

    it('deve retornar 200 e mapear tenant do segredo (nunca do body) quando assinatura HMAC estiver correta', async () => {
      const payloadObj = {
        erpType: 'TOTVS_PROTHEUS',
        eventType: 'INVOICE_GENERATED',
        tenantId: 'tentativa_de_spoofing_do_tenant_pelo_body',
        payload: { docNum: 'NF-10029', value: 15400.00 }
      };
      const rawBody = JSON.stringify(payloadObj);
      const signature = crypto
        .createHmac('sha256', TEST_ERP_SECRET)
        .update(rawBody)
        .digest('hex');

      const res = await fetch(`${baseUrl}/api/v1/integrations/erp-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Velatrix-Signature': signature
        },
        body: rawBody
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Confirma que tenantId veio do mapeamento do segredo ('tenant_nexus_01'), NUNCA do body!
      expect(data.tenantId).toBe('tenant_nexus_01');
      expect(data.tenantId).not.toBe('tentativa_de_spoofing_do_tenant_pelo_body');
    });
  });

  describe('4. RBAC e Rota Super-Admin', () => {
    it('deve retornar 403 para tenant comum tentando acessar rota restrita de super-admin', async () => {
      // 1. Gera token de usuário comum (c_level_approver / não super_admin)
      const user = SERVER_USERS.find(u => u.email === 'ceo@velatrix.ai')!;
      const userToken = generateSessionToken(user);

      const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.erro).toBe('ACESSO_NEGADO');
    });

    it('deve permitir super_admin acessar rota restrita de super-admin com sucesso', async () => {
      // 1. Gera token para super_admin legítimo
      const superAdminUser = SERVER_USERS.find(u => u.email === 'admin@velatrix.ai')!;
      const adminToken = generateSessionToken(superAdminUser);

      const res = await fetch(`${baseUrl}/api/v1/super-admin/tenants`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });
  });
});
