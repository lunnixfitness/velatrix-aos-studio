/**
 * VELATRIX AOS · Fila justa para chamadas caras (OCR/LLM) — P25.
 *
 * Problema: 2 mil advogados enviando autos ao mesmo tempo. Sem controle,
 * um escritório com 300 uploads monopoliza a cota do Gemini e todos travam.
 *
 * Garantias:
 *  - Concorrência global limitada (protege a cota do provedor).
 *  - Concorrência por tenant e por usuário limitadas (ninguém monopoliza).
 *  - Despacho round-robin entre tenants com trabalho pendente (justiça).
 *  - Backpressure: fila cheia → erro 429 com Retry-After (o cliente espera e
 *    tenta de novo, em vez de derrubar o servidor).
 *  - Dedupe em voo: mesma chave (ex.: hash da página) → mesma Promise; a
 *    mesma página enviada por 2 advogados é processada uma vez.
 *
 * Implementação em memória (1 instância). Em produção multi-instância, o mesmo
 * contrato roda sobre Cloud Tasks / Pub/Sub + Redis — a interface não muda.
 */

export interface OpcoesFila {
  concorrenciaGlobal: number;
  concorrenciaPorTenant: number;
  concorrenciaPorUsuario: number;
  maxPendentesPorTenant: number;
  maxPendentesGlobal: number;
  /** Estimativa usada no Retry-After (ms por tarefa). */
  duracaoMediaMs: number;
  /** P27: sem disputa, um escritório pode usar vagas ociosas acima do seu teto (work-conserving). */
  emprestimoOcioso: boolean;
  /** P27: vagas globais nunca emprestadas — quem chegar depois é atendido na hora. */
  reservaParaNovos: number;
}

export const OPCOES_PADRAO: OpcoesFila = {
  concorrenciaGlobal: 64,
  concorrenciaPorTenant: 16,
  concorrenciaPorUsuario: 4,
  maxPendentesPorTenant: 5000,
  maxPendentesGlobal: 50000,
  duracaoMediaMs: 1500,
  emprestimoOcioso: true,
  reservaParaNovos: 4,
};

export class FilaCheia extends Error {
  readonly httpStatus = 429;
  readonly retryAfterSeg: number;
  constructor(motivo: string, retryAfterSeg: number) {
    super(motivo);
    this.retryAfterSeg = retryAfterSeg;
  }
}

interface Item {
  tenantId: string;
  userId: string;
  chave?: string;
  tarefa: () => Promise<unknown>;
  resolver: (v: unknown) => void;
  rejeitar: (e: unknown) => void;
  enfileiradoEm: number;
}

export interface EstatisticasFila {
  emExecucao: number;
  pendentes: number;
  porTenant: Record<string, { emExecucao: number; pendentes: number }>;
  concluidas: number;
  falhas: number;
  deduplicadas: number;
  rejeitadas: number;
  esperaMediaMs: number;
  /** Despachos que usaram capacidade ociosa acima do teto do escritório. */
  emprestadas: number;
}

export class FilaJusta {
  private readonly op: OpcoesFila;
  private readonly filas = new Map<string, Item[]>(); // por tenant
  private readonly rodizio: string[] = []; // ordem round-robin de tenants
  private readonly ativosTenant = new Map<string, number>();
  private readonly ativosUsuario = new Map<string, number>();
  private readonly emVoo = new Map<string, Promise<unknown>>();
  private ativos = 0;
  private pendentes = 0;
  private cursor = 0;
  private concluidas = 0;
  private falhas = 0;
  private deduplicadas = 0;
  private rejeitadas = 0;
  private somaEspera = 0;
  private emprestadas = 0;
  private relogio: () => number;

  constructor(opcoes: Partial<OpcoesFila> = {}, relogio: () => number = () => Date.now()) {
    this.op = { ...OPCOES_PADRAO, ...opcoes };
    this.relogio = relogio;
  }

  enfileirar<T>(tenantId: string, userId: string, tarefa: () => Promise<T>, chave?: string): Promise<T> {
    if (chave) {
      const existente = this.emVoo.get(`${tenantId}::${chave}`);
      if (existente) {
        this.deduplicadas++;
        return existente as Promise<T>;
      }
    }
    const fila = this.filas.get(tenantId) || [];
    if (this.pendentes >= this.op.maxPendentesGlobal) {
      this.rejeitadas++;
      throw new FilaCheia('Plataforma no limite de processamento; tente novamente em instantes.', this.retryAfter(this.pendentes));
    }
    if (fila.length >= this.op.maxPendentesPorTenant) {
      this.rejeitadas++;
      throw new FilaCheia('Fila do escritório cheia; tente novamente em instantes.', this.retryAfter(fila.length, this.op.concorrenciaPorTenant));
    }

    const p = new Promise<T>((resolver, rejeitar) => {
      fila.push({ tenantId, userId, chave, tarefa, resolver: resolver as (v: unknown) => void, rejeitar, enfileiradoEm: this.relogio() });
    });
    if (!this.filas.has(tenantId)) {
      this.filas.set(tenantId, fila);
      this.rodizio.push(tenantId);
    }
    this.pendentes++;
    if (chave) {
      const k = `${tenantId}::${chave}`;
      this.emVoo.set(k, p);
      const limpar = () => { if (this.emVoo.get(k) === p) this.emVoo.delete(k); };
      p.then(limpar, limpar);
    }
    this.despachar();
    return p;
  }

  estatisticas(): EstatisticasFila {
    const porTenant: EstatisticasFila['porTenant'] = {};
    for (const t of new Set([...this.filas.keys(), ...this.ativosTenant.keys()])) {
      porTenant[t] = { emExecucao: this.ativosTenant.get(t) || 0, pendentes: this.filas.get(t)?.length || 0 };
    }
    const iniciadas = this.concluidas + this.falhas + this.ativos;
    return {
      emExecucao: this.ativos,
      pendentes: this.pendentes,
      porTenant,
      concluidas: this.concluidas,
      falhas: this.falhas,
      deduplicadas: this.deduplicadas,
      rejeitadas: this.rejeitadas,
      esperaMediaMs: iniciadas ? Math.round(this.somaEspera / iniciadas) : 0,
      emprestadas: this.emprestadas,
    };
  }

  private retryAfter(naFrente: number, vazao = this.op.concorrenciaGlobal) {
    return Math.max(1, Math.ceil((naFrente / Math.max(1, vazao)) * (this.op.duracaoMediaMs / 1000)));
  }

  private podeRodar(it: Item, ignorarTeto = false) {
    return (ignorarTeto || (this.ativosTenant.get(it.tenantId) || 0) < this.op.concorrenciaPorTenant)
      && (this.ativosUsuario.get(`${it.tenantId}::${it.userId}`) || 0) < this.op.concorrenciaPorUsuario;
  }

  private despachar() {
    while (this.ativos < this.op.concorrenciaGlobal && this.pendentes > 0) {
      let escolhido: Item | undefined;
      // Round-robin: percorre tenants a partir do cursor, pega o 1º item elegível.
      for (let k = 0; k < this.rodizio.length && !escolhido; k++) {
        const idx = (this.cursor + k) % this.rodizio.length;
        const fila = this.filas.get(this.rodizio[idx]);
        if (!fila?.length) continue;
        const pos = fila.findIndex((it) => this.podeRodar(it));
        if (pos >= 0) {
          escolhido = fila.splice(pos, 1)[0];
          this.cursor = (idx + 1) % this.rodizio.length;
        }
      }
      if (!escolhido) escolhido = this.emprestarOcioso(); // P27: capacidade ociosa
      if (!escolhido) return; // tudo pendente está bloqueado por limite de tenant/usuário
      this.executar(escolhido);
    }
    this.compactar();
  }

  private executar(it: Item) {
    this.pendentes--;
    this.ativos++;
    const kU = `${it.tenantId}::${it.userId}`;
    this.ativosTenant.set(it.tenantId, (this.ativosTenant.get(it.tenantId) || 0) + 1);
    this.ativosUsuario.set(kU, (this.ativosUsuario.get(kU) || 0) + 1);
    this.somaEspera += this.relogio() - it.enfileiradoEm;
    Promise.resolve()
      .then(it.tarefa)
      .then(
        (v) => { this.concluidas++; it.resolver(v); },
        (e) => { this.falhas++; it.rejeitar(e); },
      )
      .finally(() => {
        this.ativos--;
        this.decrementar(this.ativosTenant, it.tenantId);
        this.decrementar(this.ativosUsuario, kU);
        this.despachar();
      });
  }

  /**
   * P27 · Capacidade ociosa: todo pendente está barrado pelo teto do PRÓPRIO escritório e sobram
   * vagas globais → empresta, mantendo `reservaParaNovos` livres para quem chegar (atendido na hora,
   * depois pelo rodízio normal). O teto por usuário nunca é emprestado.
   * Teste de carga: o maior escritório ficava preso em 16 com 94 vagas paradas no fim do pico.
   */
  private emprestarOcioso(): Item | undefined {
    if (!this.op.emprestimoOcioso || this.ativos >= this.op.concorrenciaGlobal - this.op.reservaParaNovos) return undefined;
    for (let k = 0; k < this.rodizio.length; k++) {
      const idx = (this.cursor + k) % this.rodizio.length;
      const fila = this.filas.get(this.rodizio[idx]);
      if (!fila?.length) continue;
      const pos = fila.findIndex((it) => this.podeRodar(it, true));
      if (pos >= 0) {
        this.cursor = (idx + 1) % this.rodizio.length;
        this.emprestadas++;
        return fila.splice(pos, 1)[0];
      }
    }
    return undefined;
  }

  private decrementar(m: Map<string, number>, k: string) {
    const v = (m.get(k) || 1) - 1;
    if (v <= 0) m.delete(k); else m.set(k, v);
  }

  /** Remove tenants sem trabalho do rodízio (evita crescer sem limite). */
  private compactar() {
    for (let i = this.rodizio.length - 1; i >= 0; i--) {
      const t = this.rodizio[i];
      if (!this.filas.get(t)?.length && !this.ativosTenant.get(t)) {
        this.filas.delete(t);
        this.rodizio.splice(i, 1);
        if (this.cursor > i) this.cursor--;
      }
    }
    if (this.cursor >= this.rodizio.length) this.cursor = 0;
  }
}

/** Retentativa com backoff exponencial + jitter para 429/5xx do provedor. */
export async function comRetentativa<T>(
  fn: () => Promise<T>,
  { tentativas = 4, baseMs = 400, maxMs = 8000, ehTransitorio = (e: unknown) => {
    const s = (e as { status?: number; httpStatus?: number })?.status ?? (e as { httpStatus?: number })?.httpStatus;
    return s === 429 || (typeof s === 'number' && s >= 500);
  }, esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms)) } = {},
): Promise<T> {
  let ultimo: unknown;
  for (let i = 0; i < tentativas; i++) {
    try { return await fn(); } catch (e) {
      ultimo = e;
      if (!ehTransitorio(e) || i === tentativas - 1) break;
      const atraso = Math.min(maxMs, baseMs * 2 ** i);
      await esperar(atraso / 2 + Math.random() * (atraso / 2));
    }
  }
  throw ultimo;
}

/**
 * P27 · Concorrência global a partir da cota contratada do provedor (Lei de Little):
 * chamadas simultâneas ≈ requisições/s × latência. 64 fixo usava ~60% de 3.000 RPM a 2 s.
 * AUTOS_CONCORRENCIA_GLOBAL força um valor; senão AUTOS_RPM × AUTOS_LATENCIA_MS (+10% de folga).
 */
export function opcoesFilaDoAmbiente(env: Record<string, string | undefined>): Partial<OpcoesFila> {
  const n = (k: string) => { const x = Number(env[k]); return Number.isFinite(x) && x > 0 ? x : undefined; };
  const forcada = n('AUTOS_CONCORRENCIA_GLOBAL');
  const rpm = n('AUTOS_RPM');
  const latMs = n('AUTOS_LATENCIA_MS') ?? 2000;
  const global = forcada ?? (rpm ? Math.ceil((rpm / 60) * (latMs / 1000) * 1.1 - 1e-9) : undefined);
  const op: Partial<OpcoesFila> = { duracaoMediaMs: latMs };
  if (global) op.concorrenciaGlobal = Math.min(1000, Math.max(4, Math.round(global)));
  const porTenant = n('AUTOS_CONCORRENCIA_POR_ESCRITORIO');
  if (porTenant) op.concorrenciaPorTenant = porTenant;
  return op;
}
