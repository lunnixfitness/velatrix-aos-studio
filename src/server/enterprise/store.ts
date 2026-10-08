/**
 * VELATRIX AOS · Enterprise · Store do servidor (P18).
 *
 * Fonte de verdade server-side para WorkItems (HITL), Audit Ledger encadeado,
 * selos de laudo e chaves de idempotência. Isolamento por tenant em TODA leitura/escrita.
 *
 * Persistência: journal append-only NDJSON (event sourcing simples), reaplicado no boot.
 *   - ENTERPRISE_DATA_DIR   (padrão: ./.data/enterprise)
 *   - ENTERPRISE_PERSIST=false  → só memória (testes)
 * Quando o banco (Postgres/Firebase) entrar, troca-se esta implementação mantendo a interface.
 *
 * Escrita síncrona (appendFileSync) de propósito: volume baixo, e a ordem do journal
 * precisa ser a mesma da cadeia do ledger. Node é single-thread: não há await entre
 * leitura e escrita dentro destes métodos, então não há corrida intra-processo.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { WorkItem, WorkItemStatus } from '../../enterprise/hitl';
import type { Esteira } from '../../enterprise/riskShield';
import type { GuardrailResultado } from '../../enterprise/guardrail';
import { GENESIS_HEX, hashCanonicalSync } from './hashSync.ts';

export interface LedgerEntry {
  seq: number;
  tenantId: string;
  tipo: string;
  refId: string;
  actorId: string;
  payloadHash: string;
  prevHash: string;
  em: string;
  hash: string;
}

export interface StoredWorkItem {
  item: WorkItem;
  /** Código legível exibido na UI (ex.: WI-RT-0192). O id real é UUID. */
  ref?: string;
  payload: Record<string, unknown>;
  memoriaCalculo?: Record<string, unknown>;
  /** Snapshot do payload no momento da revisão — base do diff "mudou depois da revisão". */
  payloadRevisado?: Record<string, unknown>;
  /** Resultado do guardrail calculado NO SERVIDOR (o do browser é só exibição). */
  guardrail?: GuardrailResultado;
  resultado?: unknown;
  criadoEm: string;
  atualizadoEm: string;
}

export interface LaudoSealRecord {
  tenantId: string;
  laudoId: string;
  versao: number;
  workItemId: string;
  esteira: Esteira;
  payloadHash: string;
  emitidoEmUTC: string;
  signatario: { userId: string; nome: string; registroClasse: string };
  selo: string;
}

/**
 * P29 — Registro central de laudos. Fonte de verdade do escritório inteiro (antes cada laudo
 * existia só no IndexedDB do navegador de quem emitiu). Imutável: correção = novo laudo.
 */
export interface StoredLaudo {
  reportId: string;
  serviceId: string;
  /** Recalculado NO SERVIDOR a partir do conteúdo; o valor enviado pelo cliente só é comparado. */
  auditHash: string;
  /** userId da sessão autenticada — nunca o que o corpo da requisição declara. */
  emitidoPor: string;
  registradoEmUTC: string;
  report: Record<string, unknown>;
}

export interface PaginaLaudos {
  itens: StoredLaudo[];
  /** Cursor para a próxima página (reportId do último item), ou null no fim. */
  proximo: string | null;
  total: number;
}

type JournalEvent =
  | { v: 1; k: 'laudo'; tenantId: string; data: StoredLaudo }
  | { v: 1; k: 'wi'; tenantId: string; data: StoredWorkItem }
  | { v: 1; k: 'ledger'; tenantId: string; data: LedgerEntry }
  | { v: 1; k: 'seal'; tenantId: string; data: LaudoSealRecord }
  | { v: 1; k: 'idem'; tenantId: string; key: string; value: unknown };

const SEP = '\u0000';
const key = (...parts: (string | number)[]) => parts.join(SEP);

/** Campos cobertos pelo hash de uma entrada do ledger (tudo exceto o próprio hash). */
export function ledgerHashOf(e: Omit<LedgerEntry, 'hash'>): string {
  const { seq, tenantId, tipo, refId, actorId, payloadHash, prevHash, em } = e;
  return hashCanonicalSync({ seq, tenantId, tipo, refId, actorId, payloadHash, prevHash, em });
}

/** Selo do laudo = hashCanonical({ tenantId, laudoId, versao, payload, emitidoEmUTC, signatario:{nome, registroClasse} }) — contrato P17. */
export function computeLaudoSeal(p: {
  tenantId: string;
  laudoId: string;
  versao: number;
  payload: unknown;
  emitidoEmUTC: string;
  signatario: { nome: string; registroClasse: string };
}): string {
  return hashCanonicalSync({
    tenantId: p.tenantId,
    laudoId: p.laudoId,
    versao: p.versao,
    payload: p.payload,
    emitidoEmUTC: p.emitidoEmUTC,
    signatario: { nome: p.signatario.nome, registroClasse: p.signatario.registroClasse },
  });
}

export interface LedgerVerification {
  ok: boolean;
  total: number;
  quebraEmSeq?: number;
  motivo?: string;
}

export class EnterpriseStore {
  private readonly workItems = new Map<string, StoredWorkItem>(); // tenant|id
  private readonly byIdemKey = new Map<string, string>(); // tenant|idempotencyKey → id
  private readonly ledgers = new Map<string, LedgerEntry[]>(); // tenant → cadeia
  private readonly seals = new Map<string, LaudoSealRecord[]>(); // tenant|laudoId → versões
  private readonly idem = new Map<string, unknown>(); // tenant|key → resultado
  // ── Índices de escala (P29): nenhuma leitura varre dados de outros tenants ──
  private readonly wiByTenant = new Map<string, Map<string, StoredWorkItem>>(); // tenant → id → item
  private readonly sealByHash = new Map<string, LaudoSealRecord>(); // tenant|selo → registro (O(1))
  private readonly laudos = new Map<string, Map<string, StoredLaudo>>(); // tenant → reportId → laudo (ordem de registro)
  /** Verificação incremental do ledger: /health não recalcula a cadeia inteira a cada chamada. */
  private readonly ledgerVerificado = new Map<string, { ate: number; prev: string }>();
  private readonly file: string | null;
  readonly modo: 'arquivo' | 'memoria';

  constructor(opts: { dir?: string | null } = {}) {
    let file: string | null = null;
    if (opts.dir) {
      try {
        fs.mkdirSync(opts.dir, { recursive: true, mode: 0o700 });
        file = path.join(opts.dir, 'journal.ndjson');
        this.replay(file);
      } catch (e) {
        console.error('[enterprise-store] persistência em arquivo indisponível, usando memória:', (e as Error).message);
        file = null;
      }
    }
    this.file = file;
    this.modo = file ? 'arquivo' : 'memoria';
  }

  // ───────── journal ─────────

  private replay(file: string): void {
    if (!fs.existsSync(file)) return;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    let aplicados = 0;
    const boas: string[] = [];
    let truncada = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      try {
        this.apply(JSON.parse(line) as JournalEvent);
        boas.push(line);
        aplicados++;
      } catch {
        // Última linha truncada (crash no meio do append) é tolerada; no meio do arquivo é corrupção.
        if (i < lines.length - 2) throw new Error(`journal corrompido na linha ${i + 1}`);
        console.warn(`[enterprise-store] linha final truncada descartada (${i + 1})`);
        truncada = true;
      }
    }
    // Sem reparo, o próximo append seria colado na linha truncada e corromperia o journal.
    if (truncada) fs.writeFileSync(file, boas.length ? boas.join('\n') + '\n' : '', { encoding: 'utf8', mode: 0o600 });
    for (const tenantId of this.ledgers.keys()) {
      const v = this.verifyLedger(tenantId, { completo: true });
      if (!v.ok) console.error(`[enterprise-store] LEDGER VIOLADO tenant=${tenantId} seq=${v.quebraEmSeq}: ${v.motivo}`);
    }
    console.log(`[enterprise-store] journal reaplicado: ${aplicados} eventos`);
  }

  private persist(ev: JournalEvent): void {
    if (this.file) fs.appendFileSync(this.file, JSON.stringify(ev) + '\n', { encoding: 'utf8', mode: 0o600 });
    this.apply(ev);
  }

  private apply(ev: JournalEvent): void {
    switch (ev.k) {
      case 'wi': {
        this.workItems.set(key(ev.tenantId, ev.data.item.id), ev.data);
        this.byIdemKey.set(key(ev.tenantId, ev.data.item.idempotencyKey), ev.data.item.id);
        const porTenant = this.wiByTenant.get(ev.tenantId) ?? new Map<string, StoredWorkItem>();
        porTenant.set(ev.data.item.id, ev.data);
        this.wiByTenant.set(ev.tenantId, porTenant);
        return;
      }
      case 'laudo': {
        const porTenant = this.laudos.get(ev.tenantId) ?? new Map<string, StoredLaudo>();
        porTenant.set(ev.data.reportId, ev.data);
        this.laudos.set(ev.tenantId, porTenant);
        return;
      }
      case 'ledger': {
        const chain = this.ledgers.get(ev.tenantId) ?? [];
        chain.push(ev.data);
        this.ledgers.set(ev.tenantId, chain);
        return;
      }
      case 'seal': {
        const k = key(ev.tenantId, ev.data.laudoId);
        const list = this.seals.get(k) ?? [];
        list.push(ev.data);
        this.seals.set(k, list);
        this.sealByHash.set(key(ev.tenantId, ev.data.selo), ev.data);
        return;
      }
      case 'idem':
        this.idem.set(key(ev.tenantId, ev.key), ev.value);
        return;
    }
  }

  // ───────── WorkItems ─────────

  getWorkItem(tenantId: string, id: string): StoredWorkItem | undefined {
    return this.workItems.get(key(tenantId, id));
  }

  hasWorkItemAnyTenant(id: string): boolean {
    for (const k of this.workItems.keys()) {
      if (k.endsWith(`${SEP}${id}`)) return true;
    }
    return false;
  }

  findByIdempotencyKey(tenantId: string, idemKey: string): StoredWorkItem | undefined {
    const id = this.byIdemKey.get(key(tenantId, idemKey));
    return id ? this.getWorkItem(tenantId, id) : undefined;
  }

  listWorkItems(tenantId: string, f: { status?: WorkItemStatus; esteira?: Esteira; limit?: number } = {}): StoredWorkItem[] {
    const out: StoredWorkItem[] = [];
    for (const v of (this.wiByTenant.get(tenantId) ?? new Map<string, StoredWorkItem>()).values()) {
      if (f.status && v.item.status !== f.status) continue;
      if (f.esteira && v.item.esteira !== f.esteira) continue;
      out.push(v);
    }
    out.sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1));
    return out.slice(0, Math.min(Math.max(f.limit ?? 100, 1), 500));
  }

  putWorkItem(tenantId: string, stored: StoredWorkItem): StoredWorkItem {
    if (stored.item.tenantId !== tenantId) throw new Error('tenant do item não confere com o contexto');
    const next = { ...stored, atualizadoEm: new Date().toISOString() };
    this.persist({ v: 1, k: 'wi', tenantId, data: next });
    return next;
  }

  // ───────── Ledger ─────────

  appendLedger(tenantId: string, e: { tipo: string; refId: string; actorId: string; payloadHash: string }): LedgerEntry {
    const chain = this.ledgers.get(tenantId) ?? [];
    const base = {
      seq: chain.length + 1,
      tenantId,
      tipo: e.tipo,
      refId: e.refId,
      actorId: e.actorId,
      payloadHash: e.payloadHash,
      prevHash: chain.length ? chain[chain.length - 1].hash : GENESIS_HEX,
      em: new Date().toISOString(),
    };
    const entry: LedgerEntry = { ...base, hash: ledgerHashOf(base) };
    this.persist({ v: 1, k: 'ledger', tenantId, data: entry });
    return entry;
  }

  listLedger(tenantId: string, opts: { refId?: string; limit?: number } = {}): LedgerEntry[] {
    const chain = this.ledgers.get(tenantId) ?? [];
    const filtered = opts.refId ? chain.filter((e) => e.refId === opts.refId) : chain;
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 1000);
    return filtered.slice(-limit).reverse();
  }

  /**
   * Verifica a cadeia. Padrão incremental: só as entradas novas desde a última verificação OK
   * (a cadeia é append-only em memória). `completo: true` recalcula tudo — boot e auditoria explícita.
   */
  verifyLedger(tenantId: string, opts: { completo?: boolean } = {}): LedgerVerification {
    const chain = this.ledgers.get(tenantId) ?? [];
    const cache = opts.completo ? undefined : this.ledgerVerificado.get(tenantId);
    const inicio = cache && cache.ate <= chain.length ? cache.ate : 0;
    let prev = inicio ? cache!.prev : GENESIS_HEX;
    for (let i = inicio; i < chain.length; i++) {
      const e = chain[i];
      if (e.seq !== i + 1) return { ok: false, total: chain.length, quebraEmSeq: e.seq, motivo: 'sequência fora de ordem' };
      if (e.tenantId !== tenantId) return { ok: false, total: chain.length, quebraEmSeq: e.seq, motivo: 'entrada de outro tenant' };
      if (e.prevHash !== prev) return { ok: false, total: chain.length, quebraEmSeq: e.seq, motivo: 'prevHash não encadeia' };
      const { hash, ...base } = e;
      if (ledgerHashOf(base) !== hash) return { ok: false, total: chain.length, quebraEmSeq: e.seq, motivo: 'hash não confere com o conteúdo' };
      prev = hash;
    }
    this.ledgerVerificado.set(tenantId, { ate: chain.length, prev });
    return { ok: true, total: chain.length };
  }

  // ───────── Selos ─────────

  nextSealVersion(tenantId: string, laudoId: string): number {
    return (this.seals.get(key(tenantId, laudoId))?.length ?? 0) + 1;
  }

  putSeal(rec: LaudoSealRecord): LaudoSealRecord {
    const expected = this.nextSealVersion(rec.tenantId, rec.laudoId);
    if (rec.versao !== expected) throw new Error(`versão de selo fora de ordem (esperada ${expected})`);
    this.persist({ v: 1, k: 'seal', tenantId: rec.tenantId, data: rec });
    return rec;
  }

  getSeals(tenantId: string, laudoId: string): LaudoSealRecord[] {
    return [...(this.seals.get(key(tenantId, laudoId)) ?? [])];
  }

  findSealByHash(tenantId: string, selo: string): LaudoSealRecord | undefined {
    return this.sealByHash.get(key(tenantId, selo));
  }

  // ───────── Laudos (P29) ─────────

  getLaudo(tenantId: string, reportId: string): StoredLaudo | undefined {
    return this.laudos.get(tenantId)?.get(reportId);
  }

  hasLaudoAnyTenant(reportId: string): boolean {
    for (const map of this.laudos.values()) {
      if (map.has(reportId)) return true;
    }
    return false;
  }

  putLaudo(tenantId: string, data: StoredLaudo): StoredLaudo {
    if (this.getLaudo(tenantId, data.reportId)) throw new Error('laudo já registrado (imutável)');
    this.persist({ v: 1, k: 'laudo', tenantId, data });
    return data;
  }

  /** Mais recentes primeiro, paginado por cursor (reportId do último item da página anterior). */
  listLaudos(tenantId: string, f: { limit?: number; serviceId?: string; antes?: string } = {}): PaginaLaudos {
    const todos = [...(this.laudos.get(tenantId) ?? new Map<string, StoredLaudo>()).values()].reverse();
    const filtrados = f.serviceId ? todos.filter((l) => l.serviceId === f.serviceId) : todos;
    const limit = Math.min(Math.max(f.limit ?? 50, 1), 200);
    const ini = f.antes ? filtrados.findIndex((l) => l.reportId === f.antes) + 1 : 0;
    const itens = filtrados.slice(ini, ini + limit);
    const fim = ini + itens.length >= filtrados.length;
    return { itens, proximo: fim || !itens.length ? null : itens[itens.length - 1].reportId, total: filtrados.length };
  }

  // ───────── Idempotência (IdempotencyStore do hitl.ts, escopado por tenant) ─────────

  idempotencyFor(tenantId: string): { get(k: string): unknown | undefined; set(k: string, v: unknown): void } {
    return {
      get: (k) => this.idem.get(key(tenantId, k)),
      set: (k, v) => this.persist({ v: 1, k: 'idem', tenantId, key: k, value: v }),
    };
  }

  stats(tenantId: string) {
    return {
      modo: this.modo,
      workItems: this.wiByTenant.get(tenantId)?.size ?? 0,
      laudos: this.laudos.get(tenantId)?.size ?? 0,
      ledger: this.verifyLedger(tenantId),
    };
  }
}

function resolveDir(): string | null {
  if (process.env.ENTERPRISE_PERSIST === 'false') return null;
  return path.resolve(process.cwd(), process.env.ENTERPRISE_DATA_DIR || '.data/enterprise');
}

export const enterpriseStore = new EnterpriseStore({ dir: resolveDir() });
