/**
 * VELATRIX AOS · P29 · Webhook de retorno (HMAC) + hub SSE por advogado
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

// ───────────────────────── webhook HMAC ─────────────────────────

export interface ResultadoWebhook { valido: boolean; motivo?: string; }

/**
 * Assinatura: hex(HMAC-SHA256(secret, `${timestamp}.${rawBody}`)).
 * Headers: X-Velatrix-Signature (sha256=<hex>) e X-Velatrix-Timestamp (epoch s).
 * Janela de 5 min contra replay; comparação em tempo constante.
 */
export function assinarWebhook(secret: string, timestampSeg: number, rawBody: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(`${timestampSeg}.${rawBody}`, 'utf8').digest('hex');
}

export function verificarWebhook(params: {
  secret: string | undefined;
  assinatura: string | undefined;
  timestamp: string | undefined;
  rawBody: string;
  agoraSeg?: number;
  janelaSeg?: number;
}): ResultadoWebhook {
  const { secret, assinatura, timestamp, rawBody } = params;
  if (!secret || secret.length < 32) return { valido: false, motivo: 'secret ausente ou fraco' };
  if (!assinatura || !timestamp) return { valido: false, motivo: 'headers ausentes' };
  const ts = Number(timestamp);
  if (!Number.isInteger(ts)) return { valido: false, motivo: 'timestamp inválido' };
  const agora = params.agoraSeg ?? Math.floor(Date.now() / 1000);
  if (Math.abs(agora - ts) > (params.janelaSeg ?? 300)) return { valido: false, motivo: 'fora da janela (replay?)' };
  const esperado = Buffer.from(assinarWebhook(secret, ts, rawBody), 'utf8');
  const recebido = Buffer.from(assinatura, 'utf8');
  if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return { valido: false, motivo: 'assinatura não confere' };
  return { valido: true };
}

/** Dedup de eventos por eventId (TTL). */
export class DedupEventos {
  private readonly vistos = new Map<string, number>();
  private readonly ttlMs: number;
  constructor(ttlMs = 24 * 3600_000) { this.ttlMs = ttlMs; }
  /** true se é a primeira vez. */
  registrar(eventId: string, agora = Date.now()): boolean {
    const exp = this.vistos.get(eventId);
    if (exp && exp > agora) return false;
    this.vistos.set(eventId, agora + this.ttlMs);
    if (this.vistos.size > 200_000) for (const [k, v] of this.vistos) if (v <= agora) this.vistos.delete(k);
    return true;
  }
}

// ───────────────────────── SSE ─────────────────────────

export interface ConexaoSse {
  write(chunk: string): boolean;
  end(): void;
}

/**
 * Uma conexão por (tenant, usuário): nova conexão substitui a antiga
 * (aba duplicada não dobra o custo). Heartbeat a cada 25s para proxies.
 * Publicação é O(conexões do destinatário).
 */
export class HubSse {
  private readonly conexoes = new Map<string, ConexaoSse>();
  private seq = 0;
  private hb: ReturnType<typeof setInterval> | undefined;

  constructor(heartbeatMs = 25_000) {
    if (heartbeatMs > 0) {
      this.hb = setInterval(() => this.broadcastBruto(': hb\n\n'), heartbeatMs);
      (this.hb as unknown as { unref?: () => void }).unref?.();
    }
  }

  private chave(tenantId: string, userId: string): string { return `${tenantId}\u0000${userId}`; }

  conectar(tenantId: string, userId: string, c: ConexaoSse): () => void {
    const k = this.chave(tenantId, userId);
    this.conexoes.get(k)?.end();
    this.conexoes.set(k, c);
    c.write('retry: 5000\n\n');
    return () => { if (this.conexoes.get(k) === c) this.conexoes.delete(k); };
  }

  publicar(tenantId: string, userId: string, tipo: string, dados: unknown): boolean {
    const c = this.conexoes.get(this.chave(tenantId, userId));
    if (!c) return false;
    c.write(`id: ${++this.seq}\nevent: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`);
    return true;
  }

  get total(): number { return this.conexoes.size; }

  private broadcastBruto(s: string): void { for (const c of this.conexoes.values()) c.write(s); }

  fechar(): void { if (this.hb) clearInterval(this.hb); for (const c of this.conexoes.values()) c.end(); this.conexoes.clear(); }
}
