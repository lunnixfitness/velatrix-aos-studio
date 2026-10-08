/**
 * VELATRIX AOS · Enterprise · Aprovação de Conflito de Interesses (Ferramenta 7 · P18).
 *
 * Máquina de estados do caso de conflito aberto a partir de um resultado do Conflict Check (P17).
 * Mesmos princípios do HITL (P12): o motor recomenda, o profissional habilitado decide; quatro olhos
 * no risco CRÍTICO; o aprovador precisa ter visto EXATAMENTE o relatório selado (hash revisado).
 * Lógica pura: relógio injetado, sem rede. O servidor é a autoridade; a UI só usa para habilitar botões.
 *
 *   AGUARDANDO_CIENCIA ─ciência─▶ CLEAR_WITH_NOTICE
 *   REQUIRES_APPROVAL ─aprovar─▶ (próxima etapa) ─▶ APPROVED | APPROVED_WITH_CHINESE_WALL
 *                     ─recusar─▶ REJECTED
 *                     ─pedir info─▶ INFO_REQUESTED ─reexecutar─▶ (novo resultado, decisões zeradas)
 *   qualquer não-terminal ─cancelar─▶ CANCELLED
 */
import type { ResultadoConflito, SolicitacaoConflito, NivelRisco } from './conflictCheck.ts';

export type StatusCaso =
  | 'CLEAR'
  | 'AGUARDANDO_CIENCIA'
  | 'CLEAR_WITH_NOTICE'
  | 'REQUIRES_APPROVAL'
  | 'INFO_REQUESTED'
  | 'APPROVED'
  | 'APPROVED_WITH_CHINESE_WALL'
  | 'REJECTED'
  | 'CANCELLED';

export type EtapaAprovacao = 'SOCIO_AREA' | 'COMITE_COMPLIANCE';
export type TipoDecisao = 'APROVAR' | 'APROVAR_COM_CW' | 'RECUSAR' | 'PEDIR_INFO';

export const TRANSICOES_CASO: Record<StatusCaso, StatusCaso[]> = {
  CLEAR: [],
  AGUARDANDO_CIENCIA: ['CLEAR_WITH_NOTICE', 'CANCELLED'],
  CLEAR_WITH_NOTICE: [],
  REQUIRES_APPROVAL: ['REQUIRES_APPROVAL', 'APPROVED', 'APPROVED_WITH_CHINESE_WALL', 'REJECTED', 'INFO_REQUESTED', 'CANCELLED'],
  INFO_REQUESTED: ['REQUIRES_APPROVAL', 'AGUARDANDO_CIENCIA', 'CLEAR', 'CANCELLED'],
  APPROVED: [],
  APPROVED_WITH_CHINESE_WALL: [],
  REJECTED: [],
  CANCELLED: [],
};

/** Estados que liberam a abertura da esteira / emissão de proposta e contrato. */
export const STATUS_LIBERADOS: readonly StatusCaso[] = ['CLEAR', 'CLEAR_WITH_NOTICE', 'APPROVED', 'APPROVED_WITH_CHINESE_WALL'];

export const ETAPAS_POR_NIVEL: Record<NivelRisco, EtapaAprovacao[]> = {
  CRITICO: ['SOCIO_AREA', 'COMITE_COMPLIANCE'],
  ALTO: ['SOCIO_AREA'],
  MEDIO: [],
  BAIXO: [],
};

/**
 * Quem decide cada etapa. super_admin (fabricante Velatrix) fica de fora de propósito:
 * decidir conflito é ato do profissional habilitado do tenant (mesma regra do approvalPolicy).
 */
export const ROLE_DECIDE_CONFLITO: Readonly<Record<string, readonly EtapaAprovacao[]>> = {
  tenant_admin: ['SOCIO_AREA', 'COMITE_COMPLIANCE'],
  c_level_approver: ['SOCIO_AREA', 'COMITE_COMPLIANCE'],
  advogado_tributarista: ['SOCIO_AREA'],
  perito_judicial: ['SOCIO_AREA'],
  contador_fiscal: ['SOCIO_AREA'],
};

export const JUSTIFICATIVA_MIN = 20;

export interface RegistroProfissional { conselho: 'OAB' | 'CRC' | 'CREA' | 'CORECON' | 'CNPC'; numero: string }

export interface Decisor {
  userId: string;
  nome: string;
  role: string;
  registroProfissional?: RegistroProfissional;
  /** Equipe/departamento do decisor — quem está do lado bloqueado da barreira não decide (P19). */
  equipe?: string;
}

export interface ChineseWall {
  id: string;
  descricao: string;
  /** Áreas/equipes que ficam sem acesso à matéria (ex.: "Trabalhista"). */
  equipesBloqueadas: string[];
  /** Usuários individualmente bloqueados. */
  usuariosBloqueados: string[];
  /** Matérias/processos isolados pela barreira. */
  materiasIsoladas: string[];
  criadaPor: string;
  em: string;
}

export interface Decisao {
  etapa: EtapaAprovacao;
  tipo: TipoDecisao;
  userId: string;
  nome: string;
  role: string;
  registroProfissional?: RegistroProfissional;
  justificativa: string;
  hashRevisado: string;
  em: string;
}

export type TipoEvento =
  | 'CASO_ABERTO' | 'CIENCIA_REGISTRADA' | 'ETAPA_APROVADA' | 'CASO_APROVADO' | 'CHINESE_WALL_APLICADA'
  | 'CASO_RECUSADO' | 'INFO_SOLICITADA' | 'CHECAGEM_REEXECUTADA' | 'CASO_CANCELADO';

export interface EventoCaso {
  seq: number;
  tipo: TipoEvento;
  por: string;
  em: string;
  detalhe: string;
  /** Preenchidos pelo store (cadeia SHA-256): hash = sha256(prevHash ‖ JCS(evento sem hash)). */
  prevHash?: string;
  hash?: string;
}

export interface CasoConflito {
  id: string;
  tenantId: string;
  solicitanteId: string;
  solicitanteNome: string;
  solicitacao: SolicitacaoConflito;
  resultado: ResultadoConflito;
  /** SHA-256 do payloadSelo(solicitacao, resultado) — o que o decisor precisa ter visto. */
  seloResultado: string;
  status: StatusCaso;
  etapas: EtapaAprovacao[];
  decisoes: Decisao[];
  chineseWall?: ChineseWall;
  infoSolicitada?: { por: string; pergunta: string; em: string };
  versao: number;
  criadoEm: string;
  atualizadoEm: string;
  eventos: EventoCaso[];
}

export class TransicaoCasoInvalida extends Error { readonly httpStatus = 409; }
export class DecisaoNegada extends Error { readonly httpStatus = 403; }

// ─────────────────────────── helpers ───────────────────────────

function statusInicial(r: ResultadoConflito): StatusCaso {
  if (r.status === 'CLEAR') return 'CLEAR';
  if (r.status === 'CLEAR_WITH_NOTICE') return 'AGUARDANDO_CIENCIA';
  return 'REQUIRES_APPROVAL';
}

function transicionar(c: CasoConflito, para: StatusCaso): CasoConflito {
  if (!TRANSICOES_CASO[c.status].includes(para)) throw new TransicaoCasoInvalida(`${c.status} → ${para} não permitido`);
  return { ...c, status: para };
}

function evento(c: CasoConflito, tipo: TipoEvento, por: string, agora: Date, detalhe: string): CasoConflito {
  const ev: EventoCaso = { seq: c.eventos.length + 1, tipo, por, em: agora.toISOString(), detalhe };
  return { ...c, eventos: [...c.eventos, ev], atualizadoEm: ev.em };
}

export const ehTerminal = (s: StatusCaso) => TRANSICOES_CASO[s].length === 0;
export const podeAbrirEsteira = (c: Pick<CasoConflito, 'status'>) => STATUS_LIBERADOS.includes(c.status);

/** Atuar contra cliente ativo (documento/raiz idênticos) nunca é aprovado sem barreira. */
export function exigeChineseWall(r: ResultadoConflito): boolean {
  return r.hits.some((h) => h.alvoPapel === 'PARTE_CONTRARIA' && h.papelEncontrado === 'CLIENTE_ATIVO' && h.score >= 90);
}

export function etapaAtual(c: CasoConflito): EtapaAprovacao | undefined {
  const aprovadas = new Set(c.decisoes.filter((d) => d.tipo === 'APROVAR' || d.tipo === 'APROVAR_COM_CW').map((d) => d.etapa));
  return c.etapas.find((e) => !aprovadas.has(e));
}

// ─────────────────────────── operações ───────────────────────────

export function abrirCaso(
  sol: SolicitacaoConflito,
  r: ResultadoConflito,
  selo: string,
  solicitanteNome: string,
  agora: Date,
): CasoConflito {
  if (r.solicitacaoId !== sol.id || r.tenantId !== sol.tenantId) throw new TransicaoCasoInvalida('resultado não pertence à solicitação');
  if (!/^[0-9a-f]{64}$/.test(selo)) throw new TransicaoCasoInvalida('selo SHA-256 inválido');
  const status = statusInicial(r);
  const base: CasoConflito = {
    id: sol.id, tenantId: sol.tenantId, solicitanteId: sol.solicitanteId, solicitanteNome,
    solicitacao: sol, resultado: r, seloResultado: selo, status,
    etapas: status === 'REQUIRES_APPROVAL' ? ETAPAS_POR_NIVEL[r.nivel] : [],
    decisoes: [], versao: 1, criadoEm: agora.toISOString(), atualizadoEm: agora.toISOString(), eventos: [],
  };
  return evento(base, 'CASO_ABERTO', solicitanteNome, agora, `Risco ${r.nivel} (${r.scoreMax}) · ${status}`);
}

/** Motivo pelo qual o decisor NÃO pode decidir agora, ou null. Usado pela UI e reaplicado em decidir(). */
export function motivoBloqueio(c: CasoConflito, d: Decisor): string | null {
  if (c.status !== 'REQUIRES_APPROVAL') return 'caso não está aguardando decisão';
  const etapa = etapaAtual(c);
  if (!etapa) return 'nenhuma etapa pendente';
  if (!(ROLE_DECIDE_CONFLITO[d.role] ?? []).includes(etapa)) return `perfil ${d.role} não decide a etapa ${ROTULO_ETAPA[etapa]}`;
  if (!d.registroProfissional?.numero) return 'registro profissional (OAB/CRC/CREA) não cadastrado';
  if (d.userId === c.solicitanteId) return 'quem solicitou a checagem não pode decidir o próprio caso';
  if (c.decisoes.some((x) => x.userId === d.userId)) return 'você já decidiu uma etapa — a próxima precisa de outra pessoa';
  if (barreiraBloqueia(c.chineseWall, { id: d.userId, equipe: d.equipe })) return 'você está do lado bloqueado da Chinese Wall deste caso';
  return null;
}

export interface EntradaDecisao {
  tipo: TipoDecisao;
  justificativa: string;
  hashExibido: string;
  chineseWall?: Omit<ChineseWall, 'criadaPor' | 'em'>;
}

export function decidir(c: CasoConflito, d: Decisor, e: EntradaDecisao, agora: Date): CasoConflito {
  const bloqueio = motivoBloqueio(c, d);
  if (bloqueio) throw c.status !== 'REQUIRES_APPROVAL' ? new TransicaoCasoInvalida(bloqueio) : new DecisaoNegada(bloqueio);
  if (e.hashExibido !== c.seloResultado) throw new DecisaoNegada('o relatório mudou depois da sua revisão — revise novamente');
  const just = e.justificativa.trim();
  if (just.length < JUSTIFICATIVA_MIN) throw new DecisaoNegada(`justificativa obrigatória (mínimo ${JUSTIFICATIVA_MIN} caracteres)`);

  const etapa = etapaAtual(c)!;
  const dec: Decisao = {
    etapa, tipo: e.tipo, userId: d.userId, nome: d.nome, role: d.role, registroProfissional: d.registroProfissional,
    justificativa: just, hashRevisado: e.hashExibido, em: agora.toISOString(),
  };

  if (e.tipo === 'RECUSAR') {
    const n = transicionar({ ...c, decisoes: [...c.decisoes, dec] }, 'REJECTED');
    return evento(n, 'CASO_RECUSADO', d.nome, agora, just);
  }
  if (e.tipo === 'PEDIR_INFO') {
    const n = transicionar({ ...c, decisoes: [...c.decisoes, dec], infoSolicitada: { por: d.nome, pergunta: just, em: dec.em } }, 'INFO_REQUESTED');
    return evento(n, 'INFO_SOLICITADA', d.nome, agora, just);
  }

  // APROVAR / APROVAR_COM_CW
  let cw = c.chineseWall;
  if (e.tipo === 'APROVAR_COM_CW') {
    const w = e.chineseWall;
    if (!w || !w.descricao.trim() || (w.equipesBloqueadas.length + w.usuariosBloqueados.length) === 0) {
      throw new DecisaoNegada('Chinese Wall exige descrição e ao menos uma equipe ou usuário bloqueado');
    }
    cw = {
      id: w.id,
      descricao: w.descricao.trim(),
      equipesBloqueadas: [...new Set([...(cw?.equipesBloqueadas ?? []), ...w.equipesBloqueadas.map((s) => s.trim()).filter(Boolean)])],
      usuariosBloqueados: [...new Set([...(cw?.usuariosBloqueados ?? []), ...w.usuariosBloqueados.map((s) => s.trim()).filter(Boolean)])],
      materiasIsoladas: [...new Set([...(cw?.materiasIsoladas ?? []), ...w.materiasIsoladas])],
      criadaPor: cw?.criadaPor ?? d.nome,
      em: cw?.em ?? dec.em,
    };
  } else if (exigeChineseWall(c.resultado) && !cw) {
    throw new DecisaoNegada('atuar contra cliente ativo só pode ser aprovado com Chinese Wall');
  }

  let n: CasoConflito = { ...c, decisoes: [...c.decisoes, dec], chineseWall: cw };
  if (e.tipo === 'APROVAR_COM_CW') n = evento(n, 'CHINESE_WALL_APLICADA', d.nome, agora, `${cw!.descricao} · bloqueia: ${[...cw!.equipesBloqueadas, ...cw!.usuariosBloqueados].join(', ')}`);
  n = evento(n, 'ETAPA_APROVADA', d.nome, agora, `${ROTULO_ETAPA[etapa]} · ${just}`);
  if (!etapaAtual(n)) {
    n = transicionar(n, n.chineseWall ? 'APPROVED_WITH_CHINESE_WALL' : 'APPROVED');
    n = evento(n, 'CASO_APROVADO', d.nome, agora, n.chineseWall ? 'Aprovado com Chinese Wall' : 'Aprovado');
  } else {
    n = transicionar(n, 'REQUIRES_APPROVAL');
  }
  return n;
}

export function registrarCiencia(c: CasoConflito, userId: string, nome: string, agora: Date): CasoConflito {
  if (c.status !== 'AGUARDANDO_CIENCIA') throw new TransicaoCasoInvalida('caso não está aguardando ciência');
  if (userId !== c.solicitanteId) throw new DecisaoNegada('a ciência é do responsável pelo intake (quem solicitou)');
  return evento(transicionar(c, 'CLEAR_WITH_NOTICE'), 'CIENCIA_REGISTRADA', nome, agora, 'Ciência dos avisos de risco médio');
}

/** Solicitante complementa e reexecuta a checagem: novo resultado/selo, decisões zeradas, barreira mantida. */
export function reexecutar(
  c: CasoConflito, sol: SolicitacaoConflito, r: ResultadoConflito, selo: string, userId: string, nome: string, agora: Date,
): CasoConflito {
  if (c.status !== 'INFO_REQUESTED') throw new TransicaoCasoInvalida('reexecução só após pedido de informação');
  if (userId !== c.solicitanteId) throw new DecisaoNegada('só o solicitante reexecuta a checagem');
  if (sol.id !== c.id || r.solicitacaoId !== c.id) throw new TransicaoCasoInvalida('a reexecução deve manter o id do caso');
  const status = statusInicial(r);
  const n: CasoConflito = transicionar(
    { ...c, solicitacao: sol, resultado: r, seloResultado: selo, decisoes: [], infoSolicitada: undefined, versao: c.versao + 1,
      etapas: status === 'REQUIRES_APPROVAL' ? ETAPAS_POR_NIVEL[r.nivel] : [] },
    status,
  );
  return evento(n, 'CHECAGEM_REEXECUTADA', nome, agora, `v${n.versao} · Risco ${r.nivel} (${r.scoreMax}) · ${status}`);
}

export function cancelar(c: CasoConflito, userId: string, nome: string, motivo: string, agora: Date): CasoConflito {
  if (userId !== c.solicitanteId) throw new DecisaoNegada('só o solicitante cancela a solicitação');
  if (!motivo.trim()) throw new DecisaoNegada('motivo obrigatório');
  return evento(transicionar(c, 'CANCELLED'), 'CASO_CANCELADO', nome, agora, motivo.trim());
}

/** Barreira ativa bloqueia este usuário/equipe? (consumido pelo RBAC de esteiras no P19). */
/** Radicais de um nome de equipe: sem acento, sem conectivos, sem vogal/plural final ("Tributário" ≈ "Tributária"). */
function radicais(s: string): string[] {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !['das', 'dos', 'para', 'com'].includes(w))
    .map((w) => w.replace(/(es|s)$/, '').replace(/[aeo]$/, ''));
}

/** A equipe bloqueada corresponde ao departamento do usuário? Todos os radicais da equipe precisam aparecer. */
export function equipeCorresponde(equipeBloqueada: string, departamento: string | undefined): boolean {
  if (!departamento) return false;
  const alvo = radicais(equipeBloqueada);
  const dep = new Set(radicais(departamento));
  return alvo.length > 0 && alvo.every((r) => dep.has(r));
}

export function barreiraBloqueia(cw: ChineseWall | undefined, u: { id: string; equipe?: string }): boolean {
  if (!cw) return false;
  return cw.usuariosBloqueados.includes(u.id) || cw.equipesBloqueadas.some((e) => equipeCorresponde(e, u.equipe));
}

/** Payload canônico de um evento para a cadeia de hash (sem os campos de hash). */
export const payloadEvento = (casoId: string, ev: EventoCaso) =>
  ({ caso: casoId, seq: ev.seq, tipo: ev.tipo, por: ev.por, em: ev.em, detalhe: ev.detalhe, prevHash: ev.prevHash ?? null });

export const ROTULO_ETAPA: Record<EtapaAprovacao, string> = { SOCIO_AREA: 'Sócio da área', COMITE_COMPLIANCE: 'Comitê de Compliance' };
export const ROTULO_STATUS_CASO: Record<StatusCaso, string> = {
  CLEAR: 'Liberado', AGUARDANDO_CIENCIA: 'Aguardando ciência', CLEAR_WITH_NOTICE: 'Liberado com ciência',
  REQUIRES_APPROVAL: 'Aguardando decisão', INFO_REQUESTED: 'Informação solicitada', APPROVED: 'Aprovado',
  APPROVED_WITH_CHINESE_WALL: 'Aprovado com Chinese Wall', REJECTED: 'Recusado', CANCELLED: 'Cancelado',
};
