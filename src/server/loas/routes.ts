/**
 * VELATRIX AOS · P29 · Rotas /api/v1/loas
 *
 * Padrão de src/server/autos/routes.ts: tenantId/userId vêm SEMPRE da sessão
 * (multiTenantAuthMiddleware), nunca do corpo. Erros em RFC 7807.
 * Mutações exigem Idempotency-Key.
 *
 * Registro em server.ts (ao lado de registerAutosRoutes):
 *     import { registerLoasRoutes } from './src/server/loas/routes';
 *     registerLoasRoutes(app);
 * E em isPublicRoute (serverAuth.ts) liberar SOMENTE:
 *     POST /api/v1/loas/webhooks/tribunal   (autenticado por HMAC, não por sessão)
 */
import type { Express, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/serverAuth.ts';
import type { ServicoLoas, CtxLoas } from './servicoLoas.ts';
import { ErroLoas } from './servicoLoas.ts';
import { StoreIdempotencia, ErroIdempotencia } from './idempotencia.ts';
import { verificarWebhook, type HubSse } from './webhookSse.ts';
import { problema } from './validacao.ts';
import type { EstagioLoas } from './repositorio.ts';
import { ESTAGIOS_LOAS } from './repositorio.ts';

export const BASE_LOAS = '/api/v1/loas';
export const ROTA_WEBHOOK_LOAS = `${BASE_LOAS}/webhooks/tribunal`;

function ctxOf(req: AuthenticatedRequest): CtxLoas {
  if (!req.tenantId || !req.userId) throw new ErroLoas(401, 'sessão inválida ou expirada');
  return { tenantId: req.tenantId, userId: req.userId, papel: req.userRole };
}

function enviarErro(res: Response, e: unknown): void {
  const p = problema(e);
  const ra = (e as { retryAfterSeg?: number }).retryAfterSeg;
  if ((p.status === 429 || p.status === 503) && ra) res.setHeader('Retry-After', String(ra));
  if (p.status >= 500) console.error('[loas]', p.status, (e as Error)?.message);
  res.status(p.status).type('application/problem+json').send(JSON.stringify(p));
}

function leitura(fn: (req: AuthenticatedRequest, c: CtxLoas) => unknown) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try { const out = await fn(req, ctxOf(req)); res.setHeader('Cache-Control', 'no-store'); res.json(out); }
    catch (e) { enviarErro(res, e); }
  };
}

function mutacao(idem: StoreIdempotencia, status: number, fn: (req: AuthenticatedRequest, c: CtxLoas) => unknown) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const c = ctxOf(req);
      const chave = req.headers['idempotency-key'];
      const fp = StoreIdempotencia.fingerprint(req.method, req.path, req.body);
      const r = await idem.executar(c.tenantId, Array.isArray(chave) ? chave[0] : chave, fp, async () => ({ status, corpo: await fn(req, c) }));
      if (r.replay) res.setHeader('Idempotent-Replayed', 'true');
      res.setHeader('Cache-Control', 'no-store');
      res.status(r.status).json(r.corpo);
    } catch (e) {
      if (e instanceof ErroIdempotencia && e.httpStatus === 409) res.setHeader('Retry-After', '2');
      enviarErro(res, e);
    }
  };
}

export function registerLoasRoutes(app: Express, servico: ServicoLoas, opts: { hub?: HubSse; idem?: StoreIdempotencia; webhookSecret?: () => string | undefined } = {}): void {
  const idem = opts.idem ?? new StoreIdempotencia();
  const secret = opts.webhookSecret ?? (() => process.env.LOAS_WEBHOOK_SECRET);

  app.get(`${BASE_LOAS}/casos`, leitura((req, c) => {
    const q = req.query as Record<string, string | undefined>;
    const estagio = q.estagio && (ESTAGIOS_LOAS as readonly string[]).includes(q.estagio) ? (q.estagio as EstagioLoas) : undefined;
    return servico.listar(c, { advogadoId: q.advogadoId, estagio, cursor: q.cursor ?? null, limite: q.limite ? Number(q.limite) : undefined });
  }));
  app.get(`${BASE_LOAS}/casos/:id`, leitura((req, c) => servico.obter(c, req.params.id)));
  app.get(`${BASE_LOAS}/lotes/:id`, leitura((req, c) => servico.obterLote(c, req.params.id)));
  app.get(`${BASE_LOAS}/painel`, leitura((_req, c) => servico.painel(c)));

  app.post(`${BASE_LOAS}/casos`, mutacao(idem, 201, (req, c) => servico.criarCaso(c, req.body)));
  app.post(`${BASE_LOAS}/casos/:id/calcular`, mutacao(idem, 200, (req, c) => servico.calcular(c, req.params.id, req.body)));
  app.post(`${BASE_LOAS}/casos/:id/minuta`, mutacao(idem, 200, (req, c) => servico.minuta(c, req.params.id, req.body)));
  app.post(`${BASE_LOAS}/casos/:id/procuracao`, mutacao(idem, 200, (req, c) => servico.definirProcuracao(c, req.params.id, req.body)));
  app.post(`${BASE_LOAS}/casos/:id/aprovar`, mutacao(idem, 200, (req, c) => servico.aprovar(c, req.params.id, req.body)));
  app.post(`${BASE_LOAS}/lotes`, mutacao(idem, 202, (req, c) => servico.criarLote(c, req.body)));

  // SSE: 1 conexão por advogado; substitui a anterior.
  app.get(`${BASE_LOAS}/eventos`, (req: AuthenticatedRequest, res: Response) => {
    try {
      const c = ctxOf(req);
      if (!opts.hub) throw new ErroLoas(501, 'SSE desabilitado.');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      const sair = opts.hub.conectar(c.tenantId, c.userId, { write: (s) => res.write(s), end: () => res.end() });
      req.on('close', sair);
    } catch (e) { enviarErro(res, e); }
  });

  // Webhook do tribunal/integrador — público na sessão, protegido por HMAC.
  app.post(ROTA_WEBHOOK_LOAS, (req: AuthenticatedRequest, res: Response) => {
    try {
      const h = (n: string) => { const v = req.headers[n]; return Array.isArray(v) ? v[0] : v; };
      const v = verificarWebhook({ secret: secret(), assinatura: h('x-velatrix-signature'), timestamp: h('x-velatrix-timestamp'), rawBody: req.rawBody ?? '' });
      if (!v.valido) throw new ErroLoas(401, `webhook rejeitado: ${v.motivo}`);
      res.status(202).json(servico.receberEventoTribunal(req.body));
    } catch (e) { enviarErro(res, e); }
  });
}
