/**
 * VELATRIX AOS · Leitura de Autos (P26) — rotas HTTP.
 *
 * GET  /api/autos/status     IA/OCR disponíveis + ocupação da fila (só do próprio escritório)
 * POST /api/autos/ocr        { n, mime, imagemBase64 }                      → texto da página
 * POST /api/autos/extrair    { autosHash, peca, paginas[{n,texto}] }         → fatos conferidos
 * POST /api/autos/relatorio  { autosHash, nomeArquivo, totalPaginas, pecas, enviarParaRevisao?, esteira? }
 *
 * Autenticação: multiTenantAuthMiddleware (global). tenant/usuário vêm SEMPRE da sessão.
 */
import type { Express, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/serverAuth';
import { IS_DEMO_MODE } from '../../lib/demoMode';
import { sha256HexSync } from '../../shared/crypto/sha256Sync';
import { hashCanonicalSync } from '../enterprise/hashSync';
import { enterpriseStore } from '../enterprise/store';
import { criarItem } from '../enterprise/routes';
import { FilaJusta, comRetentativa, opcoesFilaDoAmbiente } from './filaJusta';
import { criarProvedorGemini } from './provedorGemini';
import { ErroAutos, ServicoAutos, type CtxAutos } from './servicoAutos';
import { MODOS_EXTRACAO, type ModoExtracao } from './extracaoPeca';

/** AUTOS_MODO_PADRAO / AUTOS_MODO_FORCADO: economico | hibrido | completo. */
const modoDoAmbiente = (v: string | undefined): ModoExtracao | undefined =>
  v && MODOS_EXTRACAO.includes(v as ModoExtracao) ? (v as ModoExtracao) : undefined;

/**
 * Concorrência derivada da cota contratada (AUTOS_RPM × AUTOS_LATENCIA_MS) — teste de carga P27:
 * 64 fixo usava ~60% de 3.000 RPM; com 110 + empréstimo de capacidade ociosa, 99%.
 */
export const filaAutos = new FilaJusta(opcoesFilaDoAmbiente(process.env));
const maxMbPendentes = Number(process.env.AUTOS_MAX_MB_PENDENTES);

export function criarServicoAutosPadrao(): ServicoAutos {
  const provedor = criarProvedorGemini();
  console.log(`[autos] Leitura de Autos P26: IA=${provedor?.nome ?? (IS_DEMO_MODE ? 'deterministico-demo' : 'desligada')}`);
  return new ServicoAutos({
    fila: filaAutos,
    provedor,
    modoDemo: IS_DEMO_MODE,
    hash: hashCanonicalSync,
    sha256Hex: sha256HexSync,
    comRetentativa: (fn) => comRetentativa(fn),
    maxBytesPendentes: Number.isFinite(maxMbPendentes) && maxMbPendentes > 0 ? maxMbPendentes * 1048576 : undefined,
    modoPadrao: modoDoAmbiente(process.env.AUTOS_MODO_PADRAO),
    modoForcado: modoDoAmbiente(process.env.AUTOS_MODO_FORCADO),
    ledger: (tenantId, e) => { enterpriseStore.appendLedger(tenantId, e); },
    criarWorkItem: (ctx, n) => {
      // Mesma leitura enviada 2× → mesmo item (idempotência por conteúdo do relatório).
      const existente = enterpriseStore.findByIdempotencyKey(ctx.tenantId, n.idempotencyKey);
      if (existente) return { id: existente.item.id, ref: existente.ref, status: existente.item.status };
      const s = criarItem(ctx.tenantId, ctx.userId, {
        esteira: n.esteira,
        tipo: 'GERAR_LAUDO_FINAL',
        riscoFlag: n.riscoFlag,
        valorEnvolvidoCentavos: n.valorEnvolvidoCentavos,
        payload: n.payload,
        agente: 'Pericial',
        status: 'READY_FOR_REVIEW',
        ref: n.ref,
        idempotencyKey: n.idempotencyKey,
      });
      return { id: s.item.id, ref: s.ref, status: s.item.status };
    },
  });
}

function ctxOf(req: AuthenticatedRequest): CtxAutos {
  if (!req.tenantId || !req.userId) throw new ErroAutos(401, 'sessão inválida ou expirada');
  return { tenantId: req.tenantId, userId: req.userId };
}

function rota(fn: (req: AuthenticatedRequest, c: CtxAutos) => unknown) {
  return async (req: AuthenticatedRequest, res: Response) => {
    try {
      const out = await fn(req, ctxOf(req));
      res.setHeader('Cache-Control', 'no-store');
      res.json(out);
    } catch (e) {
      const err = e as { httpStatus?: number; retryAfterSeg?: number; message?: string };
      const status = typeof err.httpStatus === 'number' ? err.httpStatus : 500;
      if (status === 429 && err.retryAfterSeg) res.setHeader('Retry-After', String(err.retryAfterSeg));
      if (status >= 500) console.error('[autos]', status, err.message);
      res.status(status).json({ error: status >= 500 && status !== 502 && status !== 503 ? 'erro interno' : err.message });
    }
  };
}

export function registerAutosRoutes(app: Express, servico: ServicoAutos = criarServicoAutosPadrao()): void {
  const base = '/api/autos';
  app.get(`${base}/status`, rota((_req, c) => servico.status(c)));
  app.post(`${base}/ocr`, rota((req, c) => servico.ocr(c, req.body)));
  app.post(`${base}/extrair`, rota((req, c) => servico.extrair(c, req.body)));
  app.post(`${base}/relatorio`, rota((req, c) => servico.relatorio(c, req.body)));
}
