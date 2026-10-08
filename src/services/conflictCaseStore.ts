/**
 * VELATRIX AOS · Conflict Check · store de casos (P18).
 * Enquanto o backend (Firebase/Postgres) não entra, os casos vivem no navegador (localStorage por tenant)
 * — mesmo contrato subscribe/getSnapshot do approvalQueueService, para trocar pela API sem mexer na UI.
 * Cada evento do caso é encadeado em SHA-256 (prevHash → hash), como o ledger do P10.
 */
import {
  abrirCaso, decidir, registrarCiencia, reexecutar, cancelar, payloadEvento,
  type CasoConflito, type Decisor, type EntradaDecisao,
} from '../enterprise/conflictApproval.ts';
import type { ResultadoConflito, SolicitacaoConflito } from '../enterprise/conflictCheck.ts';
import { hashCanonical } from '../enterprise/canonicalJson.ts';
import { TENANT_DEMO } from './conflictCheckDemo.ts';

const CHAVE = (tenant: string) => `velatrix.conflictCases.v1.${tenant}`;
let tenant = TENANT_DEMO;
let casos: CasoConflito[] = carregar();
const ouvintes = new Set<() => void>();

function carregar(): CasoConflito[] {
  try {
    const raw = localStorage.getItem(CHAVE(tenant));
    return raw ? (JSON.parse(raw) as CasoConflito[]) : [];
  } catch { return []; }
}
function persistir() {
  try { localStorage.setItem(CHAVE(tenant), JSON.stringify(casos)); } catch { /* modo privado: segue só em memória */ }
}
function emitir() { ouvintes.forEach((f) => f()); }

export const subscribe = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
export const getSnapshot = () => casos;
export const getCaso = (id: string) => casos.find((c) => c.id === id);

/** Sela os eventos ainda sem hash, encadeando no último hash conhecido. */
async function selarEventos(c: CasoConflito): Promise<CasoConflito> {
  const eventos = [...c.eventos];
  for (let i = 0; i < eventos.length; i++) {
    if (eventos[i].hash) continue;
    const prevHash = i > 0 ? eventos[i - 1].hash : undefined;
    const ev = { ...eventos[i], prevHash };
    eventos[i] = { ...ev, hash: await hashCanonical(payloadEvento(c.id, ev)) };
  }
  return { ...c, eventos };
}

async function gravar(c: CasoConflito): Promise<CasoConflito> {
  const selado = await selarEventos(c);
  const i = casos.findIndex((x) => x.id === selado.id);
  casos = i >= 0 ? casos.map((x, j) => (j === i ? selado : x)) : [selado, ...casos];
  persistir();
  emitir();
  return selado;
}

function exigir(id: string): CasoConflito {
  const c = getCaso(id);
  if (!c) throw new Error(`caso ${id} não encontrado`);
  return c;
}

export const enviar = (sol: SolicitacaoConflito, r: ResultadoConflito, selo: string, solicitanteNome: string) => {
  if (getCaso(sol.id)) throw new Error(`caso ${sol.id} já existe`);
  return gravar(abrirCaso(sol, r, selo, solicitanteNome, new Date()));
};
export const decidirCaso = (id: string, d: Decisor, e: EntradaDecisao) => gravar(decidir(exigir(id), d, e, new Date()));
export const cienciaCaso = (id: string, userId: string, nome: string) => gravar(registrarCiencia(exigir(id), userId, nome, new Date()));
export const reexecutarCaso = (id: string, sol: SolicitacaoConflito, r: ResultadoConflito, selo: string, userId: string, nome: string) =>
  gravar(reexecutar(exigir(id), sol, r, selo, userId, nome, new Date()));
export const cancelarCaso = (id: string, userId: string, nome: string, motivo: string) => gravar(cancelar(exigir(id), userId, nome, motivo, new Date()));

/** Verifica a cadeia de eventos de um caso (integridade do histórico). */
export async function verificarCadeia(c: CasoConflito): Promise<boolean> {
  for (let i = 0; i < c.eventos.length; i++) {
    const ev = c.eventos[i];
    const prev = i > 0 ? c.eventos[i - 1].hash : undefined;
    if (ev.prevHash !== prev) return false;
    if (ev.hash !== (await hashCanonical(payloadEvento(c.id, ev)))) return false;
  }
  return true;
}

// ─── P19 · auditoria de acessos negados pela Chinese Wall ───
export interface AcessoNegado { em: string; userId: string; nome: string; casoId?: string; barreiraId?: string; motivo: string }
const CHAVE_NEGADOS = (t: string) => `velatrix.chineseWallDenied.v1.${t}`;
let negados: AcessoNegado[] = carregarNegados();
function carregarNegados(): AcessoNegado[] {
  try { const raw = localStorage.getItem(CHAVE_NEGADOS(tenant)); return raw ? (JSON.parse(raw) as AcessoNegado[]) : []; } catch { return []; }
}
export const getAcessosNegados = () => negados;
export function registrarAcessoNegado(a: Omit<AcessoNegado, 'em'>) {
  negados = [{ ...a, em: new Date().toISOString() }, ...negados].slice(0, 200);
  try { localStorage.setItem(CHAVE_NEGADOS(tenant), JSON.stringify(negados)); } catch { /* memória */ }
  emitir();
}

/** Só para a demo: limpa os casos do tenant. */
export function limparDemo() { casos = []; negados = []; persistir(); try { localStorage.removeItem(CHAVE_NEGADOS(tenant)); } catch { /* */ } emitir(); }
export function usarTenant(t: string) { if (t !== tenant) { tenant = t; casos = carregar(); negados = carregarNegados(); emitir(); } }
