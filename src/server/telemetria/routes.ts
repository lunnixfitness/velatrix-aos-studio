/**
 * VELATRIX AOS · Analytics de Uso · rotas
 *
 *   POST /api/v1/telemetria/eventos                 qualquer sessão autenticada (tenant/usuário vêm do JWT)
 *   GET  /api/v1/super-admin/telemetria/resumo      ?janela=1h|24h|7d|30d&tenantId=
 *   GET  /api/v1/super-admin/telemetria/ao-vivo     ?tenantId=
 *   GET  /api/v1/super-admin/telemetria/stream      SSE (fetch autenticado; EventSource não manda Authorization)
 *
 * /api/v1/super-admin/* já é barrado para não-super_admin no multiTenantAuthMiddleware;
 * aqui há uma 2ª checagem (defesa em profundidade).
 */
import type { Express, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../auth/serverAuth.ts';
import {
  TelemetriaStore, LimitadorTelemetria, ErroTelemetria, validarLote, geoDeHeaders, ctxTelemetria,
  JANELAS, type JanelaId, type SessaoAoVivo, type ItemFeed,
} from './telemetria.ts';

export const BASE_TELEMETRIA = '/api/v1/telemetria';
export const BASE_ADMIN_TELEMETRIA = '/api/v1/super-admin/telemetria';

export interface PessoaResolvida { nome: string; papel?: string; tenantNome?: string; }

export interface OpcoesRotasTelemetria {
  /** Nome/papel para exibição no painel (só o super_admin vê). */
  resolverUsuario?: (userId: string) => PessoaResolvida | undefined;
  resolverTenant?: (tenantId: string) => string | undefined;
  /** Contar a navegação da própria equipe Velatrix (super_admin)? Padrão: não. */
  incluirSuperAdmin?: boolean;
  limitador?: LimitadorTelemetria;
}

/** Coloca tenant/usuário da sessão no AsyncLocalStorage (usado por registrarConsumoTokens). */
export function middlewareContextoTelemetria(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (req.tenantId && req.userId) ctxTelemetria.run({ tenantId: req.tenantId, userId: req.userId }, next);
  else next();
}

function exigirSuperAdmin(req: AuthenticatedRequest, res: Response): boolean {
  if (req.isSuperAdmin || req.userRole === 'super_admin') return true;
  res.status(403).json({ erro: 'ACESSO_NEGADO', error: 'Acesso restrito ao perfil super_admin.' });
  return false;
}

function erro(res: Response, e: unknown): void {
  const status = e instanceof ErroTelemetria ? e.status : 500;
  if (status >= 500) console.error('[telemetria]', (e as Error)?.message);
  res.status(status).type('application/problem+json').send(JSON.stringify({ title: (e as Error)?.message ?? 'erro', status }));
}

export function registerTelemetriaRoutes(app: Express, store: TelemetriaStore, opts: OpcoesRotasTelemetria = {}): void {
  const limitador = opts.limitador ?? new LimitadorTelemetria();
  const pessoa = (id: string) => opts.resolverUsuario?.(id);
  const tenantNome = (id: string) => (id === 'VELATRIX' ? 'VELATRIX (Fabricante)' : (opts.resolverTenant?.(id) ?? id));

  const enriquecerSessao = (s: SessaoAoVivo) => {
    const p = pessoa(s.userId);
    return { ...s, nome: p?.nome ?? `Usuário ${s.userId.slice(-6)}`, papel: s.papel ?? p?.papel, tenantNome: tenantNome(s.tenantId) };
  };
  const enriquecerFeed = (f: ItemFeed) => ({ ...f, nome: pessoa(f.userId)?.nome ?? (f.userId === 'sistema' ? 'Sistema' : `Usuário ${f.userId.slice(-6)}`), tenantNome: tenantNome(f.tenantId) });
  const filtroTenant = (q: unknown) => {
    const t = (q as Record<string, unknown>)?.tenantId;
    return typeof t === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(t) ? t : undefined;
  };

  // ── ingestão (todo usuário autenticado) ──
  app.post(`${BASE_TELEMETRIA}/eventos`, (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.tenantId || !req.userId) throw new ErroTelemetria(401, 'sessão inválida');
      const agora = store.agora();
      const { sessaoId, eventos } = validarLote(req.body, agora);
      const isVelatrixStaff = req.isSuperAdmin || req.userRole === 'super_admin' || req.userRole === 'velatrix_staff';
      const effectiveTenantId = isVelatrixStaff ? 'VELATRIX' : req.tenantId;

      if (!limitador.permitir(`${effectiveTenantId}\u0000${req.userId}`, eventos.length, agora)) {
        res.setHeader('Retry-After', '60');
        throw new ErroTelemetria(429, 'limite de eventos por minuto excedido');
      }
      const geo = geoDeHeaders(req.headers as Record<string, string | string[] | undefined>);
      // sessaoId é escopado ao usuário: um cliente não consegue escrever na sessão de outro.
      const sid = `${req.userId}:${sessaoId}`;
      for (const ev of eventos) {
        store.registrar({ ...ev, tenantId: effectiveTenantId, userId: req.userId, sessaoId: sid, papel: req.userRole, cidade: geo.cidade, uf: geo.uf });
      }
      res.status(204).end();
    } catch (e) { erro(res, e); }
  });

  // ── leitura (super_admin) ──
  app.get(`${BASE_ADMIN_TELEMETRIA}/resumo`, (req: AuthenticatedRequest, res: Response) => {
    if (!exigirSuperAdmin(req, res)) return;
    try {
      const j = String((req.query as Record<string, unknown>).janela ?? '24h') as JanelaId;
      const janelaMs = JANELAS[j] ?? JANELAS['24h'];
      const t = filtroTenant(req.query);
      const incluirEquipeVelatrix = req.query.incluirEquipeVelatrix === 'true' || req.query.incluirVelatrix === 'true';
      const r = store.resumo(janelaMs, t, { incluirEquipeVelatrix });
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        ...r,
        tenants: r.tenants.map((x) => ({ ...x, tenantNome: tenantNome(x.tenantId) })),
        tenantsConhecidos: [...new Set(r.tenants.map((x) => x.tenantId))].map((id) => ({ id, nome: tenantNome(id) })),
      });
    } catch (e) { erro(res, e); }
  });

  app.get(`${BASE_ADMIN_TELEMETRIA}/ao-vivo`, (req: AuthenticatedRequest, res: Response) => {
    if (!exigirSuperAdmin(req, res)) return;
    const t = filtroTenant(req.query);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ sessoes: store.aoVivo(t).map(enriquecerSessao), feed: store.ultimosEventos(40, t).map(enriquecerFeed) });
  });

  app.get(`${BASE_ADMIN_TELEMETRIA}/stream`, (req: AuthenticatedRequest, res: Response) => {
    if (!exigirSuperAdmin(req, res)) return;
    const t = filtroTenant(req.query);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    res.write('retry: 5000\n\n');

    let seq = 0;
    const enviar = () => {
      const dados = { sessoes: store.aoVivo(t).map(enriquecerSessao), feed: store.ultimosEventos(40, t).map(enriquecerFeed) };
      res.write(`id: ${++seq}\nevent: ao_vivo\ndata: ${JSON.stringify(dados)}\n\n`);
    };
    enviar();
    // Coalesce: no máximo 1 envio/s por painel, mesmo com milhares de eventos/s.
    let sujo = false;
    const cancelar = store.inscrever(() => { sujo = true; });
    const tick = setInterval(() => { if (sujo) { sujo = false; enviar(); } }, 1000);
    // Expiração de sessões não gera evento: reenvia a cada 15 s; comentário mantém proxies vivos.
    const hb = setInterval(() => { sujo = true; res.write(': hb\n\n'); }, 15_000);
    req.on('close', () => { cancelar(); clearInterval(tick); clearInterval(hb); });
  });
}
