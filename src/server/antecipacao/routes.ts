/**
 * VELATRIX AOS · Antecipação de Precatórios & RPVs · rotas /api/v1/antecipacao
 *
 * Padrão LOAS/P29: tenant/usuário da sessão, mutações com Idempotency-Key, erros RFC 7807.
 * Webhook do comprador é público na sessão e autenticado por HMAC (X-Velatrix-Signature/-Timestamp).
 */
import type { Express, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/serverAuth.ts';
import { StoreIdempotencia, ErroIdempotencia } from '../loas/idempotencia.ts';
import { problema } from '../loas/validacao.ts';
import { verificarWebhook } from '../loas/webhookSse.ts';
import { CHECKLIST_FORMALIZACAO } from '../../antecipacao/motor.ts';
import { REGRAS_ANTECIPACAO_V1 } from '../../antecipacao/regras.ts';
import type { Comprador } from '../../antecipacao/tipos.ts';
import { ErroAntecipacao, type CtxAntecipacao, type ServicoAntecipacao } from './servico.ts';

export const BASE_ANTECIPACAO = '/api/v1/antecipacao';
export const ROTA_WEBHOOK_COMPRADOR = `${BASE_ANTECIPACAO}/webhooks/comprador`;

function ctxOf(req: AuthenticatedRequest): CtxAntecipacao {
  if (!req.tenantId || !req.userId) throw new ErroAntecipacao(401, 'sessão inválida ou expirada');
  return { tenantId: req.tenantId, userId: req.userId, papel: req.userRole };
}

function enviarErro(res: Response, e: unknown): void {
  const p = problema(e);
  if (p.status >= 500) console.error('[antecipacao]', p.status, (e as Error)?.message);
  res.status(p.status).type('application/problem+json').send(JSON.stringify(p));
}

export interface OpcoesRotasAntecipacao {
  idem?: StoreIdempotencia;
  /** Segredo HMAC por comprador (um vazado não permite confirmar pagamento de outro comprador). */
  webhookSecret?: (compradorId: string) => string | undefined;
  compradores: () => Comprador[];
  demo?: boolean;
  semearDemo?: (c: CtxAntecipacao) => number;
}

export function registerAntecipacaoRoutes(app: Express, servico: ServicoAntecipacao, opts: OpcoesRotasAntecipacao): void {
  const idem = opts.idem ?? new StoreIdempotencia();
  const secret = opts.webhookSecret ?? ((id: string) => process.env[`ANTECIPACAO_WEBHOOK_SECRET_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`]);

  const leitura = (fn: (req: AuthenticatedRequest, c: CtxAntecipacao) => unknown) => async (req: AuthenticatedRequest, res: Response) => {
    try { const out = await fn(req, ctxOf(req)); res.setHeader('Cache-Control', 'no-store'); res.json(out); }
    catch (e) { enviarErro(res, e); }
  };
  const mutacao = (status: number, fn: (req: AuthenticatedRequest, c: CtxAntecipacao) => unknown) => async (req: AuthenticatedRequest, res: Response) => {
    try {
      const c = ctxOf(req);
      const h = req.headers['idempotency-key'];
      const fp = StoreIdempotencia.fingerprint(req.method, req.path, req.body);
      const r = await idem.executar(c.tenantId, Array.isArray(h) ? h[0] : h, fp, async () => ({ status, corpo: await fn(req, c) }));
      if (r.replay) res.setHeader('Idempotent-Replayed', 'true');
      res.setHeader('Cache-Control', 'no-store');
      res.status(r.status).json(r.corpo);
    } catch (e) {
      if (e instanceof ErroIdempotencia && e.httpStatus === 409) res.setHeader('Retry-After', '2');
      enviarErro(res, e);
    }
  };
  const B = BASE_ANTECIPACAO;
  const q = (req: AuthenticatedRequest) => req.query as Record<string, string | undefined>;

  app.get(`${B}/creditos`, leitura((req, c) => servico.listar(c, { status: q(req).status, limite: q(req).limite ? Number(q(req).limite) : undefined })));
  app.get(`${B}/creditos/:id`, leitura((req, c) => servico.obter(c, req.params.id)));
  app.get(`${B}/painel`, leitura((_req, c) => servico.painel(c)));
  app.get(`${B}/regras`, leitura(() => ({ regras: REGRAS_ANTECIPACAO_V1, checklist: CHECKLIST_FORMALIZACAO, demo: !!opts.demo })));
  app.get(`${B}/compradores`, leitura(() => opts.compradores().filter((k) => k.ativo).map((k) => ({
    id: k.id, nome: k.nome, tipoEntidade: k.tipoEntidade, demo: k.demo,
    apetite: { tipos: k.politica.tipos, esferas: k.politica.esferas, naturezas: k.politica.naturezas, flagsAceitas: k.politica.flagsAceitas,
      aceitaRegimeEspecial: k.politica.aceitaRegimeEspecial, aceitaHonorarios: k.politica.aceitaHonorarios,
      ticketMinCentavos: k.politica.ticketMinCentavos, ticketMaxCentavos: k.politica.ticketMaxCentavos, validadeOfertaDias: k.politica.validadeOfertaDias },
  }))));

  app.post(`${B}/creditos`, mutacao(201, (req, c) => servico.cadastrar(c, req.body)));
  app.post(`${B}/creditos/:id/reanalisar`, mutacao(200, (req, c) => servico.reanalisar(c, req.params.id, req.body && Object.keys(req.body).length ? req.body : undefined)));
  app.post(`${B}/creditos/:id/escolher`, mutacao(200, (req, c) => servico.escolherOferta(c, req.params.id, (req.body as { ofertaId?: unknown })?.ofertaId)));
  app.post(`${B}/creditos/:id/aprovar`, mutacao(200, (req, c) => servico.aprovar(c, req.params.id, (req.body as { hashExibido?: unknown })?.hashExibido)));
  app.post(`${B}/creditos/:id/aceite`, mutacao(200, (req, c) => servico.registrarAceite(c, req.params.id, req.body)));
  app.post(`${B}/creditos/:id/checklist`, mutacao(200, (req, c) => servico.marcarChecklist(c, req.params.id, req.body)));
  app.post(`${B}/creditos/:id/cancelar`, mutacao(200, (req, c) => servico.cancelar(c, req.params.id, (req.body as { motivo?: unknown })?.motivo)));
  // Só DEMO: simula a confirmação do comprador. Em produção o pagamento chega pelo webhook.
  app.post(`${B}/creditos/:id/pagamento-demo`, mutacao(200, (req, c) => servico.confirmarPagamento(c.tenantId, req.params.id, req.body, 'DEMO', c.userId)));
  app.post(`${B}/demo/seed`, mutacao(200, (_req, c) => {
    if (!opts.demo || !opts.semearDemo) throw new ErroAntecipacao(404, 'indisponível fora do modo demonstração');
    return { criados: opts.semearDemo(c) };
  }));

  // Webhook do comprador: pagamento confirmado.
  app.post(ROTA_WEBHOOK_COMPRADOR, (req: AuthenticatedRequest, res: Response) => {
    try {
      const h = (n: string) => { const v = req.headers[n]; return Array.isArray(v) ? v[0] : v; };
      const b = (req.body ?? {}) as { evento?: unknown; compradorId?: unknown; ofertaId?: unknown; comprovante?: unknown; valorCentavos?: unknown };
      if (typeof b.compradorId !== 'string' || !/^[\w-]{3,64}$/.test(b.compradorId)) throw new ErroAntecipacao(401, 'webhook rejeitado: compradorId ausente');
      // compradorId (não verificado) só escolhe QUAL segredo usar; a assinatura cobre o corpo inteiro.
      const v = verificarWebhook({ secret: secret(b.compradorId), assinatura: h('x-velatrix-signature'), timestamp: h('x-velatrix-timestamp'), rawBody: req.rawBody ?? '' });
      if (!v.valido) throw new ErroAntecipacao(401, `webhook rejeitado: ${v.motivo}`);
      if (b.evento !== 'pagamento.confirmado') throw new ErroAntecipacao(400, 'evento não suportado');
      if (typeof b.ofertaId !== 'string') throw new ErroAntecipacao(400, 'ofertaId obrigatório');
      const loc = servico.localizarPorOferta(b.ofertaId, b.compradorId);
      if (!loc) throw new ErroAntecipacao(404, 'oferta não encontrada');
      const r = servico.confirmarPagamento(loc.tenantId, loc.id, { comprovante: b.comprovante, valorCentavos: b.valorCentavos }, 'COMPRADOR', `comprador:${b.compradorId}`);
      res.status(200).json({ id: r.credito.id, status: r.status });
    } catch (e) { enviarErro(res, e); }
  });
}
