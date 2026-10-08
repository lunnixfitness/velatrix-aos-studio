/**
 * VELATRIX AOS · LRU com TTL e teto de entradas (P26).
 * Map preserva ordem de inserção: reinserir no get() = "mais recente"; o primeiro é o mais antigo.
 * Em multi-instância (P27) a mesma interface vai para Redis.
 */
export class LruTtl<V> {
  private readonly m = new Map<string, { v: V; exp: number }>();
  private readonly max: number;
  private readonly ttlMs: number;
  private readonly agora: () => number;
  constructor(max: number, ttlMs: number, agora: () => number = Date.now) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.agora = agora;
  }

  get(k: string): V | undefined {
    const e = this.m.get(k);
    if (!e) return undefined;
    if (e.exp <= this.agora()) { this.m.delete(k); return undefined; }
    this.m.delete(k);
    this.m.set(k, e);
    return e.v;
  }

  set(k: string, v: V): void {
    this.m.delete(k);
    this.m.set(k, { v, exp: this.agora() + this.ttlMs });
    while (this.m.size > this.max) {
      const velho = this.m.keys().next().value;
      if (velho === undefined) break;
      this.m.delete(velho);
    }
  }

  get tamanho(): number { return this.m.size; }
}
