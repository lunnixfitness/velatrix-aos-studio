/**
 * VELATRIX AOS · Enterprise · Chinese Wall — barreiras de informação vigentes (Ferramenta 7 · P19).
 *
 * Uma barreira nasce quando um caso de conflito é aprovado com Chinese Wall (P18). A partir daí,
 * as equipes/usuários do lado bloqueado não acessam: o caso novo, as matérias isoladas e qualquer
 * recurso do mesmo cliente (por CPF/CNPJ ou raiz de CNPJ). Deny-by-match: basta UMA barreira bloquear.
 * Lógica pura; o servidor aplica a mesma regra no RLS quando o backend entrar.
 */
import { barreiraBloqueia, type CasoConflito, type ChineseWall, type Decisor, type RegistroProfissional } from './conflictApproval.ts';
import { somenteDigitos, raizCNPJ } from './conflictCheck.ts';

/** Membro do tenant como o AuthContext expõe (TenantMember) — só os campos usados aqui. */
export interface MembroRef {
  id: string;
  name: string;
  role: string;
  email?: string;
  department?: string;
  professionalRegistry?: string;
}

export interface BarreiraVigente extends ChineseWall {
  casoId: string;
  tenantId: string;
  descricaoCaso: string;
  clientes: { nome: string; documento?: string }[];
  ativadaEm: string;
}

export interface RecursoProtegido {
  casoId?: string;
  materiaId?: string;
  documento?: string;
}

export interface DecisaoAcesso {
  permitido: boolean;
  barreiraId?: string;
  casoId?: string;
  motivo: string;
}

const CONSELHOS = ['OAB', 'CRC', 'CREA', 'CORECON', 'CNPC'] as const;

/** "OAB/SP 412.890" → { OAB, "SP 412.890" }; "CNPC nº 4.812 / CFC" → { CNPC, "4.812 / CFC" }. */
export function parseRegistro(s: string | undefined): RegistroProfissional | undefined {
  if (!s?.trim()) return undefined;
  const m = s.trim().match(/^(OAB|CRC|CREA|CORECON|CNPC)\b[\s/:-]*(?:n[ºo°.]?\s*)?(.+)$/i);
  if (!m) return undefined;
  const conselho = m[1].toUpperCase() as (typeof CONSELHOS)[number];
  const numero = m[2].trim();
  return numero ? { conselho, numero } : undefined;
}

/** Decisor a partir do membro real do tenant (registro profissional e equipe vêm do cadastro). */
export function decisorDeMembro(m: MembroRef): Decisor {
  return { userId: m.id, nome: m.name, role: m.role, registroProfissional: parseRegistro(m.professionalRegistry), equipe: m.department };
}

/** Membro correspondente ao usuário logado (por id, depois e-mail). */
export function membroDoUsuario<M extends MembroRef>(membros: M[], u: { id: string; email?: string } | null | undefined): M | undefined {
  if (!u) return undefined;
  return membros.find((m) => m.id === u.id) ?? (u.email ? membros.find((m) => m.email?.toLowerCase() === u.email!.toLowerCase()) : undefined);
}

export function barreirasVigentes(casos: CasoConflito[]): BarreiraVigente[] {
  return casos
    .filter((c) => c.status === 'APPROVED_WITH_CHINESE_WALL' && c.chineseWall)
    .map((c) => ({
      ...c.chineseWall!,
      casoId: c.id,
      tenantId: c.tenantId,
      descricaoCaso: c.solicitacao.descricao,
      clientes: c.solicitacao.alvos.map((a) => ({ nome: a.nome, documento: a.documento })),
      ativadaEm: c.atualizadoEm,
    }))
    .sort((a, b) => a.ativadaEm.localeCompare(b.ativadaEm));
}

function cobre(b: BarreiraVigente, r: RecursoProtegido): string | null {
  if (r.casoId && r.casoId === b.casoId) return `caso ${b.casoId}`;
  if (r.materiaId && b.materiasIsoladas.includes(r.materiaId)) return `matéria ${r.materiaId}`;
  const doc = somenteDigitos(r.documento);
  if (doc) {
    for (const c of b.clientes) {
      const d = somenteDigitos(c.documento);
      if (!d) continue;
      if (d === doc) return `cliente ${c.nome}`;
      const ra = raizCNPJ(doc);
      if (ra && ra === raizCNPJ(d)) return `grupo de ${c.nome}`;
    }
  }
  return null;
}

export function avaliarAcesso(u: { id: string; equipe?: string }, r: RecursoProtegido, barreiras: BarreiraVigente[]): DecisaoAcesso {
  for (const b of barreiras) {
    if (!barreiraBloqueia(b, u)) continue;
    const alvo = cobre(b, r);
    if (alvo) return { permitido: false, barreiraId: b.id, casoId: b.casoId, motivo: `Chinese Wall ${b.id} isola ${alvo}` };
  }
  return { permitido: true, motivo: 'sem barreira aplicável' };
}

/** Quem cada barreira bloqueia dentre os membros do tenant (para o painel e para auditoria). */
export function membrosBloqueados<M extends MembroRef>(b: ChineseWall, membros: M[]): M[] {
  return membros.filter((m) => barreiraBloqueia(b, { id: m.id, equipe: m.department }));
}
