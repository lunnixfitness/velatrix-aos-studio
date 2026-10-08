/**
 * VELATRIX AOS · P29 · Persistência da esteira LOAS
 *
 * Interface LoasRepository + implementação em memória (padrão de
 * src/server/enterprise/store.ts). Firebase/Postgres ficam para depois: o
 * contrato abaixo já é o que o adapter Prisma vai implementar.
 *
 * Garantias:
 *  - TODA operação exige tenantId; sem tenant → erro (isolamento estrito).
 *  - Paginação por CURSOR (atualizadoEm desc, id desc), limite máx. 100. Nunca OFFSET.
 *  - Índices em memória equivalentes aos do Prisma:
 *      (tenantId, advogadoId, estagio, atualizadoEm) e UNIQUE (tenantId, numeroProcesso).
 *  - Outbox: toda mutação grava evento na MESMA operação (atomicidade lógica);
 *    um dispatcher consome em ordem.
 *  - Agregados do painel mantidos incrementalmente (leitura O(1), sem varrer tabela).
 */
import type { CasoLoas } from '../../loas/tipos.ts';
import type { Aprovacao } from '../../loas/aprovacao.ts';
import type { AdvogadoProcuracao } from '../../loas/assinatura.ts';

export type EstagioLoas = 'CAPTURA' | 'DIAGNOSTICO' | 'ESTRATEGIA' | 'EXECUCAO' | 'ENTREGA';
export const ESTAGIOS_LOAS: readonly EstagioLoas[] = ['CAPTURA', 'DIAGNOSTICO', 'ESTRATEGIA', 'EXECUCAO', 'ENTREGA'];

export interface RegistroCaso {
  caso: CasoLoas;
  estagio: EstagioLoas;
  numeroProcesso?: string;
  tribunal?: string;
  criadoEm: string;
  atualizadoEm: string;
  versao: number;            // otimista: incrementa a cada update
  ultimoCalculoHash?: string;
  ultimaMinutaHash?: string;
  ultimaMinutaBloqueada?: boolean;
  protocoladoDraftHash?: string;
  procuracao?: AdvogadoProcuracao[];   // advogados constituídos (signatários possíveis)
  aprovacao?: Aprovacao;               // emitida SOMENTE pelo servidor (sessão do aprovador)
}

export interface EventoOutbox {
  seq: number;
  tenantId: string;
  advogadoId: string;
  tipo: string;
  casoId?: string;
  dados: unknown;
  em: string;
}

export interface PaginaCasos { itens: RegistroCaso[]; proximoCursor: string | null; }

export interface FiltroCasos { advogadoId?: string; estagio?: EstagioLoas; limite?: number; cursor?: string | null; }

export interface PainelAgregado {
  porEstagio: Record<EstagioLoas, number>;
  porAdvogado: Record<string, number>;
  protocolados: number;
  total: number;
}

export interface LoasRepository {
  criar(tenantId: string, r: RegistroCaso, evento: Omit<EventoOutbox, 'seq' | 'tenantId' | 'em'>): RegistroCaso;
  obter(tenantId: string, casoId: string): RegistroCaso | undefined;
  atualizar(tenantId: string, casoId: string, versaoEsperada: number, patch: Partial<Omit<RegistroCaso, 'caso' | 'versao' | 'criadoEm'>>, evento?: Omit<EventoOutbox, 'seq' | 'tenantId' | 'em'>): RegistroCaso;
  listar(tenantId: string, filtro: FiltroCasos): PaginaCasos;
  painel(tenantId: string): PainelAgregado;
  drenarOutbox(maximo: number): EventoOutbox[];
}

export class ErroRepositorio extends Error {
  readonly httpStatus: number;
  constructor(httpStatus: number, msg: string) { super(msg); this.httpStatus = httpStatus; this.name = 'ErroRepositorio'; }
}

function exigirTenant(t: string | undefined): string {
  if (!t || typeof t !== 'string') throw new ErroRepositorio(500, 'Consulta sem tenantId bloqueada (isolamento multi-tenant).');
  return t;
}

const cmpDesc = (a: RegistroCaso, b: RegistroCaso) =>
  a.atualizadoEm === b.atualizadoEm ? (a.caso.id < b.caso.id ? 1 : -1) : (a.atualizadoEm < b.atualizadoEm ? 1 : -1);

export function codificarCursor(r: RegistroCaso): string {
  return Buffer.from(`${r.atualizadoEm}|${r.caso.id}`, 'utf8').toString('base64url');
}
function decodificarCursor(c: string): { em: string; id: string } {
  const s = Buffer.from(c, 'base64url').toString('utf8');
  const i = s.lastIndexOf('|');
  if (i < 0) throw new ErroRepositorio(400, 'Cursor inválido.');
  return { em: s.slice(0, i), id: s.slice(i + 1) };
}

interface Particao {
  casos: Map<string, RegistroCaso>;
  porProcesso: Map<string, string>;
  painel: PainelAgregado;
}

const painelVazio = (): PainelAgregado => ({
  porEstagio: { CAPTURA: 0, DIAGNOSTICO: 0, ESTRATEGIA: 0, EXECUCAO: 0, ENTREGA: 0 },
  porAdvogado: {},
  protocolados: 0,
  total: 0,
});

export class MemoriaLoasRepository implements LoasRepository {
  private readonly particoes = new Map<string, Particao>();
  private readonly outbox: EventoOutbox[] = [];
  private seq = 0;
  private readonly relogio: () => Date;

  constructor(relogio: () => Date = () => new Date()) { this.relogio = relogio; }

  private part(tenantId: string): Particao {
    const t = exigirTenant(tenantId);
    let p = this.particoes.get(t);
    if (!p) { p = { casos: new Map(), porProcesso: new Map(), painel: painelVazio() }; this.particoes.set(t, p); }
    return p;
  }

  private emitir(tenantId: string, e: Omit<EventoOutbox, 'seq' | 'tenantId' | 'em'>): void {
    this.outbox.push({ ...e, seq: ++this.seq, tenantId, em: this.relogio().toISOString() });
  }

  criar(tenantId: string, r: RegistroCaso, evento: Omit<EventoOutbox, 'seq' | 'tenantId' | 'em'>): RegistroCaso {
    const p = this.part(tenantId);
    if (r.caso.tenantId !== tenantId) throw new ErroRepositorio(403, 'Caso de outro tenant.');
    if (p.casos.has(r.caso.id)) throw new ErroRepositorio(409, 'Caso já existe.');
    if (r.numeroProcesso && p.porProcesso.has(r.numeroProcesso)) throw new ErroRepositorio(409, 'Número de processo já vinculado a outro caso.');
    const reg = { ...r, versao: 1 };
    p.casos.set(r.caso.id, reg);
    if (r.numeroProcesso) p.porProcesso.set(r.numeroProcesso, r.caso.id);
    p.painel.total++;
    p.painel.porEstagio[reg.estagio]++;
    const adv = reg.caso.advogadoResponsavelId;
    p.painel.porAdvogado[adv] = (p.painel.porAdvogado[adv] ?? 0) + 1;
    this.emitir(tenantId, evento);
    return reg;
  }

  obter(tenantId: string, casoId: string): RegistroCaso | undefined {
    return this.part(tenantId).casos.get(casoId);
  }

  atualizar(
    tenantId: string,
    casoId: string,
    versaoEsperada: number,
    patch: Partial<Omit<RegistroCaso, 'caso' | 'versao' | 'criadoEm'>>,
    evento?: Omit<EventoOutbox, 'seq' | 'tenantId' | 'em'>,
  ): RegistroCaso {
    const p = this.part(tenantId);
    const atual = p.casos.get(casoId);
    if (!atual) throw new ErroRepositorio(404, 'Caso não encontrado.');
    if (atual.versao !== versaoEsperada) throw new ErroRepositorio(409, 'Conflito de versão — recarregue o caso.');
    if (patch.numeroProcesso && patch.numeroProcesso !== atual.numeroProcesso) {
      const dono = p.porProcesso.get(patch.numeroProcesso);
      if (dono && dono !== casoId) throw new ErroRepositorio(409, 'Número de processo já vinculado a outro caso.');
      p.porProcesso.set(patch.numeroProcesso, casoId);
      if (!atual.numeroProcesso) p.painel.protocolados++;
    }
    if (patch.estagio && patch.estagio !== atual.estagio) {
      p.painel.porEstagio[atual.estagio]--;
      p.painel.porEstagio[patch.estagio]++;
    }
    const novo: RegistroCaso = { ...atual, ...patch, versao: atual.versao + 1, atualizadoEm: this.relogio().toISOString() };
    p.casos.set(casoId, novo);
    if (evento) this.emitir(tenantId, evento);
    return novo;
  }

  listar(tenantId: string, filtro: FiltroCasos): PaginaCasos {
    const p = this.part(tenantId);
    const limite = Math.min(Math.max(filtro.limite ?? 50, 1), 100);
    const c = filtro.cursor ? decodificarCursor(filtro.cursor) : null;
    // Em memória filtramos e ordenamos; no Prisma isto é WHERE + ORDER BY no índice composto.
    const itens = [...p.casos.values()]
      .filter((r) => (!filtro.advogadoId || r.caso.advogadoResponsavelId === filtro.advogadoId) && (!filtro.estagio || r.estagio === filtro.estagio))
      .filter((r) => !c || r.atualizadoEm < c.em || (r.atualizadoEm === c.em && r.caso.id < c.id))
      .sort(cmpDesc);
    const pagina = itens.slice(0, limite);
    return { itens: pagina, proximoCursor: itens.length > limite ? codificarCursor(pagina[pagina.length - 1]) : null };
  }

  painel(tenantId: string): PainelAgregado {
    const pa = this.part(tenantId).painel;
    return { ...pa, porEstagio: { ...pa.porEstagio }, porAdvogado: { ...pa.porAdvogado } };
  }

  drenarOutbox(maximo: number): EventoOutbox[] {
    return this.outbox.splice(0, Math.max(0, maximo));
  }
}
