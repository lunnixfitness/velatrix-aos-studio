/**
 * VELATRIX AOS · P29 · Gateway de protocolo em tribunais
 *
 * TribunalAdapter é a interface; implementações:
 *   - DemoAdapter  : nº de processo fictício marcado DEMO (DEMO_MODE).
 *   - MniAdapter   : stub do contrato MNI (SOAP/CNJ). Credenciamento por tribunal.
 *   - PdpjAdapter  : stub — alvo futuro (PDPJ-Br, Res. CNJ 335/2020).
 * PROIBIDO: automação de captcha ou scraping de tela de tribunal.
 *
 * Por tribunal, o gateway aplica:
 *   - Token bucket (rate limit)            → nunca martelar um tribunal.
 *   - Circuit breaker (5 falhas/60s; half-open após 30s) → tribunal fora do ar não trava os demais.
 *   - Timeout de 30s por chamada.
 *   - Dedup (casoId + draftHash)           → jamais protocolar duas vezes o mesmo caso (litispendência).
 */

export interface PedidoProtocolo {
  tenantId: string;
  casoId: string;
  draftHash: string;
  tribunal: string;           // ex.: 'TRF3'
  sistema: 'PJE' | 'EPROC' | 'PROJUDI';
  arquivos: Array<{ nome: string; bytes: number }>;
  assinaturaEnvelope: string;
  valorJuridico: boolean;     // false em DEMO
}

export interface ReciboProtocolo {
  numeroProcesso: string;
  protocoladoEm: string;
  orgao: string;
  demo: boolean;
}

export interface TribunalAdapter {
  readonly id: string;
  protocolar(p: PedidoProtocolo, sinal: AbortSignal): Promise<ReciboProtocolo>;
  saude(): Promise<boolean>;
}

export class ErroTribunal extends Error {
  readonly httpStatus: number;
  readonly transitorio: boolean;
  readonly retryAfterSeg?: number;
  constructor(httpStatus: number, msg: string, transitorio: boolean, retryAfterSeg?: number) {
    super(msg); this.httpStatus = httpStatus; this.transitorio = transitorio; this.retryAfterSeg = retryAfterSeg; this.name = 'ErroTribunal';
  }
}

// ───────────────────────── adapters ─────────────────────────

export class DemoAdapter implements TribunalAdapter {
  readonly id = 'DEMO';
  private n = 0;
  private readonly latenciaMs: number;
  private readonly taxaFalha: number;
  private readonly rnd: () => number;
  constructor(opts: { latenciaMs?: number; taxaFalha?: number; rnd?: () => number } = {}) {
    this.latenciaMs = opts.latenciaMs ?? 50; this.taxaFalha = opts.taxaFalha ?? 0; this.rnd = opts.rnd ?? Math.random;
  }
  async protocolar(p: PedidoProtocolo, sinal: AbortSignal): Promise<ReciboProtocolo> {
    await new Promise<void>((res, rej) => {
      const t = setTimeout(res, this.latenciaMs);
      sinal.addEventListener('abort', () => { clearTimeout(t); rej(new ErroTribunal(504, 'timeout', true)); }, { once: true });
    });
    if (this.rnd() < this.taxaFalha) throw new ErroTribunal(503, `Tribunal ${p.tribunal} indisponível (simulado)`, true);
    const seq = String(++this.n).padStart(7, '0');
    return {
      numeroProcesso: `${seq}-00.2026.4.99.9999`, // segmento 99.9999 = fictício
      protocoladoEm: new Date().toISOString(),
      orgao: `DEMO · ${p.tribunal}`,
      demo: true,
    };
  }
  async saude(): Promise<boolean> { return true; }
}

export class MniAdapter implements TribunalAdapter {
  readonly id = 'MNI';
  async protocolar(): Promise<ReciboProtocolo> {
    throw new ErroTribunal(501, 'MNI não configurado: requer credenciamento do escritório no tribunal.', false);
  }
  async saude(): Promise<boolean> { return false; }
}

export class PdpjAdapter implements TribunalAdapter {
  readonly id = 'PDPJ';
  async protocolar(): Promise<ReciboProtocolo> {
    throw new ErroTribunal(501, 'PDPJ-Br ainda não integrado.', false);
  }
  async saude(): Promise<boolean> { return false; }
}

// ───────────────────────── controle de fluxo ─────────────────────────

export class TokenBucket {
  private tokens: number;
  private ultimo: number;
  private readonly capacidade: number;
  private readonly porSeg: number;
  private readonly relogio: () => number;
  constructor(capacidade: number, porSeg: number, relogio: () => number = Date.now) {
    this.capacidade = capacidade; this.porSeg = porSeg; this.relogio = relogio;
    this.tokens = capacidade; this.ultimo = relogio();
  }
  /** Retorna 0 se consumiu; senão ms até haver token. */
  tentar(): number {
    const agora = this.relogio();
    this.tokens = Math.min(this.capacidade, this.tokens + ((agora - this.ultimo) / 1000) * this.porSeg);
    this.ultimo = agora;
    if (this.tokens >= 1) { this.tokens -= 1; return 0; }
    return Math.ceil(((1 - this.tokens) / this.porSeg) * 1000);
  }
}

export type EstadoCircuito = 'FECHADO' | 'ABERTO' | 'MEIO_ABERTO';

export class CircuitBreaker {
  private falhas: number[] = [];
  private abertoEm: number | null = null;
  private sondando = false;
  private readonly limiar: number;
  private readonly janelaMs: number;
  private readonly resfriamentoMs: number;
  private readonly relogio: () => number;
  constructor(o: { limiar?: number; janelaMs?: number; resfriamentoMs?: number; relogio?: () => number } = {}) {
    this.limiar = o.limiar ?? 5; this.janelaMs = o.janelaMs ?? 60_000; this.resfriamentoMs = o.resfriamentoMs ?? 30_000; this.relogio = o.relogio ?? Date.now;
  }
  get estado(): EstadoCircuito {
    if (this.abertoEm === null) return 'FECHADO';
    return this.relogio() - this.abertoEm >= this.resfriamentoMs ? 'MEIO_ABERTO' : 'ABERTO';
  }
  /** true se pode tentar agora. Em MEIO_ABERTO deixa passar só uma sonda. */
  permitir(): boolean {
    const e = this.estado;
    if (e === 'FECHADO') return true;
    if (e === 'MEIO_ABERTO' && !this.sondando) { this.sondando = true; return true; }
    return false;
  }
  sucesso(): void { this.falhas = []; this.abertoEm = null; this.sondando = false; }
  falha(): void {
    const agora = this.relogio();
    if (this.estado === 'MEIO_ABERTO') { this.abertoEm = agora; this.sondando = false; return; }
    this.falhas = this.falhas.filter((t) => agora - t < this.janelaMs);
    this.falhas.push(agora);
    if (this.falhas.length >= this.limiar) { this.abertoEm = agora; this.sondando = false; }
  }
  retryAfterSeg(): number {
    return this.abertoEm === null ? 0 : Math.max(1, Math.ceil((this.resfriamentoMs - (this.relogio() - this.abertoEm)) / 1000));
  }
}

// ───────────────────────── gateway ─────────────────────────

export interface OpcoesGateway {
  rps?: number;            // por tribunal
  rajada?: number;
  timeoutMs?: number;
  breaker?: { limiar?: number; janelaMs?: number; resfriamentoMs?: number };
  relogio?: () => number;
}

export class GatewayProtocolo {
  private readonly adapter: TribunalAdapter;
  private readonly buckets = new Map<string, TokenBucket>();
  private readonly circuitos = new Map<string, CircuitBreaker>();
  private readonly protocolados = new Map<string, ReciboProtocolo>();   // dedup concluídos
  private readonly emVoo = new Map<string, Promise<ReciboProtocolo>>(); // dedup concorrente
  private readonly o: Required<Omit<OpcoesGateway, 'breaker' | 'relogio'>> & Pick<OpcoesGateway, 'breaker'>;
  private readonly relogio: () => number;

  constructor(adapter: TribunalAdapter, o: OpcoesGateway = {}) {
    this.adapter = adapter;
    this.relogio = o.relogio ?? Date.now;
    this.o = { rps: o.rps ?? 5, rajada: o.rajada ?? 10, timeoutMs: o.timeoutMs ?? 30_000, breaker: o.breaker };
  }

  private chaveDedup(p: PedidoProtocolo): string { return `${p.tenantId}|${p.casoId}|${p.draftHash}`; }

  circuito(tribunal: string): CircuitBreaker {
    let c = this.circuitos.get(tribunal);
    if (!c) { c = new CircuitBreaker({ ...this.o.breaker, relogio: this.relogio }); this.circuitos.set(tribunal, c); }
    return c;
  }

  private bucket(tribunal: string): TokenBucket {
    let b = this.buckets.get(tribunal);
    if (!b) { b = new TokenBucket(this.o.rajada, this.o.rps, this.relogio); this.buckets.set(tribunal, b); }
    return b;
  }

  /** Estado dos circuitos para o painel do gestor. */
  saudeTribunais(): Record<string, EstadoCircuito> {
    return Object.fromEntries([...this.circuitos].map(([t, c]) => [t, c.estado]));
  }

  async protocolar(p: PedidoProtocolo): Promise<ReciboProtocolo & { duplicado: boolean }> {
    const k = this.chaveDedup(p);
    const ja = this.protocolados.get(k);
    if (ja) return { ...ja, duplicado: true };
    const voando = this.emVoo.get(k);
    if (voando) return { ...(await voando), duplicado: true };

    const circ = this.circuito(p.tribunal);
    if (!circ.permitir()) {
      throw new ErroTribunal(503, `Circuito aberto para ${p.tribunal}.`, true, circ.retryAfterSeg());
    }
    const espera = this.bucket(p.tribunal).tentar();
    if (espera > 0) {
      if (circ.estado === 'MEIO_ABERTO') circ.falha(); // devolve a sonda
      throw new ErroTribunal(429, `Rate limit do tribunal ${p.tribunal}.`, true, Math.ceil(espera / 1000));
    }

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), this.o.timeoutMs);
    const exec = this.adapter.protocolar(p, ac.signal);
    this.emVoo.set(k, exec);
    try {
      const recibo = await exec;
      circ.sucesso();
      this.protocolados.set(k, recibo);
      return { ...recibo, duplicado: false };
    } catch (e) {
      const transitorio = e instanceof ErroTribunal ? e.transitorio : true;
      if (transitorio) circ.falha();
      throw e;
    } finally {
      clearTimeout(timer);
      this.emVoo.delete(k);
    }
  }
}
