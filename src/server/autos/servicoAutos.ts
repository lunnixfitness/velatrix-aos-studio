/**
 * VELATRIX AOS · Leitura de Autos (P26) — serviço do servidor (sem Express).
 *
 * Fluxo: navegador (P25) separa peças e escolhe, pelo BM25, as páginas relevantes →
 *   POST /api/autos/ocr       só páginas escaneadas, 1 por chamada, atrás da FilaJusta
 *   POST /api/autos/extrair   1 peça por chamada, top-k páginas, atrás da FilaJusta
 *   POST /api/autos/relatorio consolida SÓ o que o servidor extraiu (cache) → HITL
 *
 * Garantias:
 * - tenant/usuário vêm da sessão; cache, dedupe e fila são escopados por tenant.
 * - o relatório é montado a partir do cache do servidor: o navegador não injeta fato.
 * - todo fato passa pelo Guardrail de citação; o que não confere não entra no relatório.
 * - LGPD: ledger guarda só hashes; o texto das páginas não é logado nem persistido.
 * - FilaCheia vira 429 + Retry-After (backpressure), nunca fallback silencioso.
 */
import { aplicarGuardrailCitacao, brlParaCentavos, type EscopoCitacao, type Fato } from '../../documents/autos/citacao.ts';
import {
  CAMPOS_NARRATIVOS, estimarTokens, extrairDeterministico, INSTRUCAO_SISTEMA, mesclarFatos, MODOS_EXTRACAO,
  montarConteudo, parsearResposta, precisaDeIa, type ModoExtracao, type PaginaEnviada, type PecaRef,
} from './extracaoPeca.ts';
import { montarRelatorio, payloadRevisaoAutos, type ExtracaoPeca, type PecaResumo, type RelatorioAutos } from './relatorioAutos.ts';
import { LruTtl } from './lru.ts';
import type { Esteira } from '../../enterprise/riskShield.ts';

// ───────────────────────── contratos ─────────────────────────

export interface ProvedorIa {
  readonly nome: string;
  /** tokens: uso informado pelo provedor (usageMetadata); ausente → estimado. */
  gerarJson(sistema: string, conteudo: string): Promise<{ texto: string; modelo: string; tokens?: { entrada: number; saida: number } }>;
  transcrever(imagemBase64: string, mime: string): Promise<{ texto: string; modelo: string; tokens?: { entrada: number; saida: number } }>;
}

export interface FilaLike {
  enfileirar<T>(tenantId: string, userId: string, tarefa: () => Promise<T>, chave?: string): Promise<T>;
  estatisticas(): { emExecucao: number; pendentes: number; porTenant: Record<string, { emExecucao: number; pendentes: number }>; esperaMediaMs: number };
}

export interface CtxAutos { tenantId: string; userId: string }

export interface NovoWorkItemAutos {
  esteira: Esteira;
  riscoFlag: 'GREEN' | 'YELLOW';
  valorEnvolvidoCentavos: number;
  payload: Record<string, unknown>;
  ref: string;
  idempotencyKey: string;
}

export interface DepsAutos {
  fila: FilaLike;
  provedor: ProvedorIa | null;
  modoDemo: boolean;
  /** Hash canônico (JCS + SHA-256) do servidor. */
  hash: (v: unknown) => string;
  sha256Hex: (s: string) => string;
  comRetentativa: <T>(fn: () => Promise<T>) => Promise<T>;
  ledger?: (tenantId: string, e: { tipo: string; refId: string; actorId: string; payloadHash: string }) => void;
  criarWorkItem?: (ctx: CtxAutos, n: NovoWorkItemAutos) => { id: string; ref?: string; status: string };
  agora?: () => Date;
  /**
   * Teto de memória das extrações aguardando a IA (bytes). Teste de carga P27: ~450 KB por
   * extração pendente; o limite por quantidade da fila (50 mil) estouraria a RAM antes do 429.
   * Padrão 512 MB (AUTOS_MAX_MB_PENDENTES).
   */
  maxBytesPendentes?: number;
  /** Modo quando a requisição não informa (AUTOS_MODO_PADRAO). Padrão: híbrido. */
  modoPadrao?: ModoExtracao;
  /** Força um modo para todos (AUTOS_MODO_FORCADO), ex.: 'economico' para teto de custo. */
  modoForcado?: ModoExtracao;
}

export class ErroAutos extends Error {
  readonly httpStatus: number;
  readonly retryAfterSeg?: number;
  constructor(httpStatus: number, message: string, retryAfterSeg?: number) {
    super(message);
    this.httpStatus = httpStatus;
    this.retryAfterSeg = retryAfterSeg;
  }
}

// ───────────────────────── limites ─────────────────────────

export const LIMITES = {
  paginasPorExtracao: 30,
  charsPorPagina: 15_000,
  charsPorExtracao: 250_000,
  base64Max: 900_000, // ~650 KB de imagem; cabe no express.json de 1 MB
  pecasPorRelatorio: 2_000,
  paginasAutos: 20_000,
  textoOcrMax: 20_000,
} as const;

const ESTEIRAS_AUTOS: readonly Esteira[] = ['PERICIA_JUDICIAL', 'RECUPERACAO_TRIBUTARIA', 'INSS', 'INSS_OBRAS', 'PRECATORIA', 'DIAGNOSTICO'];

// ───────────────────────── validação ─────────────────────────

const obj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const bad = (msg: string) => new ErroAutos(400, msg);

function hex64(v: unknown, campo: string): string {
  if (typeof v !== 'string' || !/^[0-9a-f]{64}$/.test(v)) throw bad(`${campo} deve ser SHA-256 hex (64)`);
  return v;
}
function inteiro(v: unknown, campo: string, min: number, max: number): number {
  if (!Number.isSafeInteger(v) || (v as number) < min || (v as number) > max) throw bad(`${campo} deve ser inteiro entre ${min} e ${max}`);
  return v as number;
}
function texto(v: unknown, campo: string, max: number, obrigatorio = true): string | undefined {
  if (v === undefined && !obrigatorio) return undefined;
  if (typeof v !== 'string' || (obrigatorio && !v.trim())) throw bad(`${campo} obrigatório`);
  if (v.length > max) throw bad(`${campo} excede ${max} caracteres`);
  return v;
}

function pecaDe(v: unknown, campo = 'peca'): PecaResumo {
  if (!obj(v)) throw bad(`${campo} deve ser objeto`);
  const id = texto(v.id, `${campo}.id`, 40)!;
  if (!/^[\w-]{1,40}$/.test(id)) throw bad(`${campo}.id inválido`);
  const paginaInicial = inteiro(v.paginaInicial, `${campo}.paginaInicial`, 1, LIMITES.paginasAutos);
  const paginaFinal = inteiro(v.paginaFinal, `${campo}.paginaFinal`, paginaInicial, LIMITES.paginasAutos);
  return {
    id,
    tipo: texto(v.tipo, `${campo}.tipo`, 40)!,
    titulo: texto(v.titulo, `${campo}.titulo`, 200, false),
    paginaInicial,
    paginaFinal,
    assinadoEm: texto(v.assinadoEm, `${campo}.assinadoEm`, 20, false),
  };
}

function paginasDe(v: unknown, peca: PecaRef): PaginaEnviada[] {
  if (!Array.isArray(v) || !v.length) throw bad('paginas deve ser lista não vazia');
  if (v.length > LIMITES.paginasPorExtracao) throw bad(`máximo de ${LIMITES.paginasPorExtracao} páginas por extração (envie as top-k do BM25)`);
  const vistas = new Set<number>();
  let total = 0;
  return v.map((p, i) => {
    if (!obj(p)) throw bad(`paginas[${i}] deve ser objeto`);
    const n = inteiro(p.n, `paginas[${i}].n`, peca.paginaInicial, peca.paginaFinal);
    if (vistas.has(n)) throw bad(`página ${n} repetida`);
    vistas.add(n);
    const t = texto(p.texto, `paginas[${i}].texto`, LIMITES.charsPorPagina, false) ?? '';
    total += t.length;
    if (total > LIMITES.charsPorExtracao) throw bad(`texto total excede ${LIMITES.charsPorExtracao} caracteres`);
    return { n, texto: t };
  });
}

// ───────────────────────── serviço ─────────────────────────

export class ServicoAutos {
  /** tenant|autosHash|pecaId|paginasHash → extração (dedupe exato). */
  private readonly cacheExtracao = new LruTtl<ExtracaoPeca>(20_000, 24 * 3600_000);
  /** tenant|autosHash|pecaId → última extração (base do relatório). */
  private readonly ultimaPorPeca = new LruTtl<ExtracaoPeca>(50_000, 24 * 3600_000);
  /** tenant|imagemHash → OCR. */
  private readonly cacheOcr = new LruTtl<{ texto: string; modelo: string; tokens?: { entrada: number; saida: number } }>(50_000, 24 * 3600_000);

  private readonly d: DepsAutos;
  private bytesPendentes = 0;
  /** Duração média (EWMA) de uma chamada à IA, para estimar o Retry-After. */
  private duracaoIaMs = 2000;
  private readonly maxBytes: number;
  constructor(deps: DepsAutos) {
    this.d = deps;
    this.maxBytes = deps.maxBytesPendentes ?? 512 * 1024 * 1024;
  }

  /** Estimativa conservadora do que uma extração segura na memória até terminar (UTF-16 + prompt). */
  static custoBytes(paginas: PaginaEnviada[]): number {
    return paginas.reduce((s, p) => s + p.texto.length, 0) * 6 + 16 * 1024;
  }

  private agoraISO() { return (this.d.agora?.() ?? new Date()).toISOString(); }

  private naFila<T>(ctx: CtxAutos, tarefa: () => Promise<T>, chave: string): Promise<T> {
    try {
      return this.d.fila.enfileirar(ctx.tenantId, ctx.userId, tarefa, chave);
    } catch (e) {
      const fc = e as { httpStatus?: number; retryAfterSeg?: number; message?: string };
      if (fc.httpStatus === 429) throw new ErroAutos(429, fc.message ?? 'fila cheia', fc.retryAfterSeg);
      throw e;
    }
  }

  /**
   * Tempo estimado até a fila à frente escoar: pendentes ÷ chamadas em execução × duração média
   * da IA, entre 2 s e 60 s. Com valor fixo o cliente esgotava as tentativas antes (teste P27).
   */
  private retryAfterSeg(): number {
    const s = this.d.fila.estatisticas();
    const seg = (s.pendentes / Math.max(1, s.emExecucao)) * (this.duracaoIaMs / 1000);
    return Math.min(60, Math.max(2, Math.ceil(seg)));
  }

  /** Modo efetivo: forçado pelo servidor > pedido pelo cliente > padrão do servidor > híbrido. */
  private modoDe(v: unknown): ModoExtracao {
    if (this.d.modoForcado) return this.d.modoForcado;
    if (v === undefined) return this.d.modoPadrao ?? 'hibrido';
    if (!MODOS_EXTRACAO.includes(v as ModoExtracao)) throw bad('modo deve ser economico, hibrido ou completo');
    return v as ModoExtracao;
  }

  status(ctx: CtxAutos) {
    const s = this.d.fila.estatisticas();
    return {
      ia: this.d.provedor ? this.d.provedor.nome : this.d.modoDemo ? 'deterministico-demo' : 'indisponivel',
      ocr: !!this.d.provedor,
      plataforma: { emExecucao: s.emExecucao, pendentes: s.pendentes, esperaMediaMs: s.esperaMediaMs },
      escritorio: s.porTenant[ctx.tenantId] ?? { emExecucao: 0, pendentes: 0 },
      memoriaPendenteMB: Math.round(this.bytesPendentes / 1048576),
      modoPadrao: this.d.modoForcado ?? this.d.modoPadrao ?? 'hibrido',
      modoForcado: !!this.d.modoForcado,
    };
  }

  async extrair(ctx: CtxAutos, body: unknown): Promise<ExtracaoPeca & { cache: boolean }> {
    if (!obj(body)) throw bad('corpo deve ser objeto');
    const autosHash = hex64(body.autosHash, 'autosHash');
    const peca = pecaDe(body.peca);
    const paginas = paginasDe(body.paginas, peca);
    const paginasHash = this.d.hash({
      pecaId: peca.id,
      paginas: [...paginas].sort((a, b) => a.n - b.n).map((p) => ({ n: p.n, h: this.d.sha256Hex(p.texto) })),
    });

    const modo = this.modoDe(body.modo);
    const kExato = `${ctx.tenantId}|${autosHash}|${peca.id}|${modo}|${paginasHash}`;
    const kPeca = `${ctx.tenantId}|${autosHash}|${peca.id}`;
    const emCache = this.cacheExtracao.get(kExato);
    if (emCache) {
      this.ultimaPorPeca.set(kPeca, emCache);
      return { ...emCache, cache: true };
    }

    const escopo: EscopoCitacao = { paginas: new Map(paginas.map((p) => [p.n, p.texto])) };
    // Regras primeiro, sempre: custo zero de token e piso de qualidade para qualquer modo.
    const deterministico = extrairDeterministico(paginas);
    const gRegras = aplicarGuardrailCitacao(deterministico, escopo);
    const provedor = this.d.provedor;
    const usarIa = modo === 'completo' || (modo === 'hibrido' && precisaDeIa(peca.tipo, gRegras.conferidos));

    let fatos: Fato[] = deterministico;
    let descartados = 0;
    let origem: ExtracaoPeca['origem'] = 'deterministico';
    let modelo: string | undefined;
    let iaIndisponivel = false;
    const consumo = { tokensEntrada: 0, tokensSaida: 0, tokensEvitados: 0, chamadasIa: 0, estimado: false };

    if (usarIa && !provedor) {
      // Completo sem IA é erro de configuração; híbrido degrada para as regras (sem custo) e avisa.
      if (modo === 'completo' && !this.d.modoDemo) throw new ErroAutos(503, 'IA não configurada para Leitura de Autos (chave de IA / AUTOS_ZDR_CONFIRMADO)');
      iaIndisponivel = true;
    } else if (usarIa && provedor) {
      const conteudo = modo === 'hibrido'
        ? montarConteudo(peca, paginas, { campos: [...CAMPOS_NARRATIVOS], jaExtraidos: gRegras.fatos.filter((f) => f.status === 'CONFERE') })
        : montarConteudo(peca, paginas);
      const custo = ServicoAutos.custoBytes(paginas);
      if (this.bytesPendentes + custo > this.maxBytes) {
        // Backpressure por memória: responde 429 em vez de acumular até o OOM.
        throw new ErroAutos(429, 'Plataforma no limite de memória para leitura de autos; tente novamente em instantes.', this.retryAfterSeg());
      }
      this.bytesPendentes += custo;
      try {
        const r = await this.naFila(
          ctx,
          async () => {
            const t0 = Date.now();
            try {
              return await this.d.comRetentativa(() => provedor.gerarJson(INSTRUCAO_SISTEMA, conteudo));
            } finally {
              this.duracaoIaMs = 0.9 * this.duracaoIaMs + 0.1 * (Date.now() - t0);
            }
          },
          `extrair:${modo}:${paginasHash}`,
        );
        const ia = parsearResposta(r.texto);
        descartados = ia.descartados;
        fatos = modo === 'hibrido' ? mesclarFatos(deterministico, ia.fatos) : ia.fatos;
        origem = modo === 'hibrido' ? 'hibrido' : 'ia';
        modelo = r.modelo;
        consumo.chamadasIa = 1;
        consumo.tokensEntrada = r.tokens?.entrada ?? estimarTokens(INSTRUCAO_SISTEMA + conteudo);
        consumo.tokensSaida = r.tokens?.saida ?? estimarTokens(r.texto);
        consumo.estimado = !r.tokens;
      } catch (e) {
        if (e instanceof ErroAutos && e.httpStatus === 429) throw e; // backpressure da fila: o cliente espera
        // Provedor fora/resposta inválida: fica com as regras (também passam pelo guardrail), marcado como tal.
        console.warn(`[autos] extração IA falhou (tenant=${ctx.tenantId} peca=${peca.id}): ${(e as Error).message}`);
      } finally {
        this.bytesPendentes -= custo;
      }
    }
    if (!consumo.chamadasIa) {
      // O que a extração completa desta peça teria custado (entrada + ~15% de saída) — e não custou.
      const entrada = estimarTokens(INSTRUCAO_SISTEMA + montarConteudo(peca, paginas));
      consumo.tokensEvitados = Math.round(entrada * 1.15);
      consumo.estimado = true;
    }

    const g = origem === 'deterministico' ? gRegras : aplicarGuardrailCitacao(fatos, escopo);
    const extracao: ExtracaoPeca = {
      autosHash,
      peca: { id: peca.id, tipo: peca.tipo, titulo: peca.titulo, paginaInicial: peca.paginaInicial, paginaFinal: peca.paginaFinal },
      paginasHash,
      fatos: g.fatos,
      guardrail: g.status,
      conferidos: g.conferidos,
      rejeitados: g.rejeitados,
      descartados,
      origem,
      modo,
      modelo,
      consumo,
      ...(iaIndisponivel ? { iaIndisponivel } : {}),
      emUTC: this.agoraISO(),
    };
    this.cacheExtracao.set(kExato, extracao);
    this.ultimaPorPeca.set(kPeca, extracao);
    this.d.ledger?.(ctx.tenantId, {
      tipo: 'AUTOS_EXTRACAO',
      refId: `${autosHash.slice(0, 16)}:${peca.id}`,
      actorId: ctx.userId,
      payloadHash: this.d.hash({ autosHash, pecaId: peca.id, paginasHash, modo, origem, conferidos: g.conferidos, rejeitados: g.rejeitados, tokens: consumo.tokensEntrada + consumo.tokensSaida }),
    });
    return { ...extracao, cache: false };
  }

  async ocr(ctx: CtxAutos, body: unknown) {
    if (!obj(body)) throw bad('corpo deve ser objeto');
    const n = inteiro(body.n, 'n', 1, LIMITES.paginasAutos);
    const mime = body.mime;
    if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') throw bad('mime deve ser image/jpeg, image/png ou image/webp');
    const b64 = texto(body.imagemBase64, 'imagemBase64', LIMITES.base64Max)!;
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) throw bad('imagemBase64 inválida');
    const provedor = this.d.provedor;
    if (!provedor) throw new ErroAutos(503, 'OCR indisponível: configure credenciais de IA (e AUTOS_ZDR_CONFIRMADO em produção)');

    const imagemHash = this.d.sha256Hex(b64);
    const k = `${ctx.tenantId}|${imagemHash}`;
    let r = this.cacheOcr.get(k);
    const cache = !!r;
    if (!r) {
      r = await this.naFila(ctx, () => this.d.comRetentativa(() => provedor.transcrever(b64, mime)), `ocr:${imagemHash}`);
      r = { texto: r.texto.slice(0, LIMITES.textoOcrMax), modelo: r.modelo, tokens: r.tokens };
      this.cacheOcr.set(k, r);
      this.d.ledger?.(ctx.tenantId, { tipo: 'AUTOS_OCR', refId: `p${n}`, actorId: ctx.userId, payloadHash: imagemHash });
    }
    // Cache não custa nada; senão, uso real do provedor (ou estimativa, marcada como tal).
    const tokens = cache ? { entrada: 0, saida: 0, estimado: false }
      : r.tokens ? { ...r.tokens, estimado: false }
      : { entrada: 1550, saida: estimarTokens(r.texto), estimado: true };
    return { n, texto: r.texto, textoHash: this.d.sha256Hex(r.texto), imagemHash, modelo: r.modelo, cache, tokens };
  }

  relatorio(ctx: CtxAutos, body: unknown): { relatorio: RelatorioAutos; workItem?: { id: string; ref?: string; status: string } } {
    if (!obj(body)) throw bad('corpo deve ser objeto');
    const autosHash = hex64(body.autosHash, 'autosHash');
    const nomeArquivo = texto(body.nomeArquivo, 'nomeArquivo', 200)!;
    const totalPaginas = inteiro(body.totalPaginas, 'totalPaginas', 1, LIMITES.paginasAutos);
    if (!Array.isArray(body.pecas) || !body.pecas.length) throw bad('pecas deve ser lista não vazia');
    if (body.pecas.length > LIMITES.pecasPorRelatorio) throw bad(`máximo de ${LIMITES.pecasPorRelatorio} peças`);
    const pecas = body.pecas.map((p, i) => pecaDe(p, `pecas[${i}]`));
    if (new Set(pecas.map((p) => p.id)).size !== pecas.length) throw bad('ids de peça repetidos');

    // Só o que ESTE servidor extraiu para ESTE tenant entra — o navegador não fornece fatos.
    const extracoes = pecas
      .map((p) => this.ultimaPorPeca.get(`${ctx.tenantId}|${autosHash}|${p.id}`))
      .filter((e): e is ExtracaoPeca => !!e);

    const relatorio = montarRelatorio({ autosHash, nomeArquivo, totalPaginas, pecas, extracoes, agoraUTC: this.agoraISO() }, this.d.hash);
    this.d.ledger?.(ctx.tenantId, { tipo: 'AUTOS_RELATORIO', refId: autosHash.slice(0, 16), actorId: ctx.userId, payloadHash: relatorio.conteudoHash });

    if (body.enviarParaRevisao !== true) return { relatorio };
    if (!this.d.criarWorkItem) throw new ErroAutos(501, 'fila de revisão indisponível');
    if (relatorio.guardrail === 'BLOQUEADO') throw new ErroAutos(422, 'nenhum fato conferido com a página de origem — nada a revisar');
    const esteira = body.esteira === undefined ? 'PERICIA_JUDICIAL' : body.esteira;
    if (!ESTEIRAS_AUTOS.includes(esteira as Esteira)) throw bad('esteira inválida');

    const valores = (relatorio.fatos.valor ?? []).map((f) => brlParaCentavos(f.valor) ?? 0).filter((v) => v > 0);
    // geradoEmUTC fora do payload: mesma leitura → mesmo payloadHash → a revisão não "muda sozinha".
    const { geradoEmUTC: _gerado, ...relatorioEstavel } = relatorio;
    const workItem = this.d.criarWorkItem(ctx, {
      esteira: esteira as Esteira,
      riscoFlag: relatorio.guardrail === 'APROVADO' ? 'GREEN' : 'YELLOW',
      valorEnvolvidoCentavos: valores.length ? Math.max(...valores) : 0,
      // Formato da Fila de Aprovação (titulo/cliente/metricas/memoriaCalculo/textoLaudo) + relatório completo.
      payload: {
        laudoId: `AUTOS-${autosHash.slice(0, 16)}`,
        ...payloadRevisaoAutos(relatorioEstavel, brlParaCentavos),
        relatorio: relatorioEstavel as unknown as Record<string, unknown>,
      },
      ref: `WI-AU-${autosHash.slice(0, 6).toUpperCase()}`,
      idempotencyKey: `autos:v2:${relatorio.conteudoHash.slice(0, 48)}`, // v2 = payload no formato da Fila
    });
    return { relatorio, workItem };
  }
}
