/**
 * VELATRIX AOS · P29 · Idempotency-Key para mutações da esteira LOAS
 *
 * - Escopo: (tenantId, chave). Duas tenants nunca colidem.
 * - Mesma chave + mesmo corpo  → devolve a resposta original (replay seguro).
 * - Mesma chave + corpo diferente → 422 (uso indevido da chave).
 * - Mesma chave ainda em execução → 409 (cliente deve aguardar).
 * - TTL padrão 24h; varredura preguiçosa a cada N operações (O(1) amortizado).
 *
 * Implementação em memória (instância única). Para N réplicas, trocar por
 * Redis SET NX PX ou tabela Postgres com UNIQUE(tenant_id, chave).
 */
import { sha256HexSync } from '../../shared/crypto/sha256Sync.ts';

export interface RespostaGuardada { status: number; corpo: unknown; }

interface Registro {
  fingerprint: string;
  expiraEm: number;
  estado: 'EM_EXECUCAO' | 'CONCLUIDO';
  resposta?: RespostaGuardada;
}

export class ErroIdempotencia extends Error {
  readonly httpStatus: number;
  constructor(httpStatus: number, msg: string) { super(msg); this.httpStatus = httpStatus; this.name = 'ErroIdempotencia'; }
}

export class StoreIdempotencia {
  private readonly mapa = new Map<string, Registro>();
  private readonly ttlMs: number;
  private readonly relogio: () => number;
  private readonly maxEntradas: number;
  private ops = 0;

  constructor(opts: { ttlMs?: number; maxEntradas?: number; relogio?: () => number } = {}) {
    this.ttlMs = opts.ttlMs ?? 24 * 3600_000;
    this.maxEntradas = opts.maxEntradas ?? 500_000;
    this.relogio = opts.relogio ?? Date.now;
  }

  static fingerprint(metodo: string, rota: string, corpo: unknown): string {
    return sha256HexSync(`${metodo} ${rota} ${JSON.stringify(corpo ?? null)}`);
  }

  /**
   * Executa `fn` no máximo uma vez por (tenant, chave).
   */
  async executar(
    tenantId: string,
    chave: string | undefined,
    fingerprint: string,
    fn: () => Promise<RespostaGuardada>,
  ): Promise<RespostaGuardada & { replay: boolean }> {
    if (!chave || chave.length < 8 || chave.length > 200) {
      throw new ErroIdempotencia(400, 'Header Idempotency-Key obrigatório (8–200 caracteres).');
    }
    this.varrer();
    const k = `${tenantId}\u0000${chave}`;
    const agora = this.relogio();
    const r = this.mapa.get(k);
    if (r && r.expiraEm > agora) {
      if (r.fingerprint !== fingerprint) throw new ErroIdempotencia(422, 'Idempotency-Key reutilizada com outro corpo.');
      if (r.estado === 'EM_EXECUCAO') throw new ErroIdempotencia(409, 'Requisição com esta Idempotency-Key ainda em execução.');
      return { ...r.resposta!, replay: true };
    }
    if (this.mapa.size >= this.maxEntradas) throw new ErroIdempotencia(503, 'Store de idempotência saturado.');

    const reg: Registro = { fingerprint, expiraEm: agora + this.ttlMs, estado: 'EM_EXECUCAO' };
    this.mapa.set(k, reg);
    try {
      const resposta = await fn();
      // Erros 5xx não são memorizados: o cliente pode tentar de novo com a mesma chave.
      if (resposta.status >= 500) { this.mapa.delete(k); return { ...resposta, replay: false }; }
      reg.estado = 'CONCLUIDO';
      reg.resposta = resposta;
      return { ...resposta, replay: false };
    } catch (e) {
      const st = (e as { httpStatus?: number }).httpStatus;
      if (typeof st === 'number' && st >= 400 && st < 500) {
        reg.estado = 'CONCLUIDO';
        reg.resposta = { status: st, corpo: { title: (e as Error).message } };
      } else {
        this.mapa.delete(k);
      }
      throw e;
    }
  }

  get tamanho(): number { return this.mapa.size; }

  private varrer(): void {
    if (++this.ops % 1000 !== 0) return;
    const agora = this.relogio();
    for (const [k, r] of this.mapa) if (r.expiraEm <= agora && r.estado === 'CONCLUIDO') this.mapa.delete(k);
  }
}
