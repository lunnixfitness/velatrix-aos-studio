/**
 * VELATRIX AOS · Enterprise · Human-in-the-Loop Orchestrator (Ferramenta 6 · P12).
 *
 * Os agentes preparam; o profissional habilitado decide. Nenhuma ação externa
 * (protocolo, transmissão, pagamento, emissão) sem aprovação humana registrada.
 * Lógica pura: o servidor injeta relógio, RBAC, ledger e executores.
 */
import type { Esteira, Flag } from './riskShield.ts';

export type WorkItemStatus = 'DRAFT' | 'READY_FOR_REVIEW' | 'APPROVED' | 'EXECUTING' | 'DONE' | 'REJECTED' | 'FAILED';

export interface Aprovacao { userId: string; em: string; hashRevisado: string; }

export interface WorkItem {
  id: string;
  tenantId: string;
  esteira: Esteira;
  tipo: 'GERAR_LAUDO_FINAL' | 'EXPORTAR_PACOTE_PROTOCOLO';
  status: WorkItemStatus;
  payloadHash: string;
  memoriaCalculoHash?: string;
  riscoFlag: Flag;
  valorEnvolvidoCentavos: number;
  criadoPorAgente?: string;
  revisadoPor?: string;
  hashRevisado?: string;
  aprovacoes: Aprovacao[];
  motivoRejeicao?: string;
  idempotencyKey: string;
}

export const TRANSICOES: Record<WorkItemStatus, WorkItemStatus[]> = {
  DRAFT: ['READY_FOR_REVIEW', 'REJECTED'],
  READY_FOR_REVIEW: ['APPROVED', 'DRAFT', 'REJECTED'], // DRAFT = devolver com comentário
  APPROVED: ['EXECUTING', 'READY_FOR_REVIEW'],
  EXECUTING: ['DONE', 'FAILED'],
  DONE: [],
  REJECTED: [],
  FAILED: ['READY_FOR_REVIEW'],
};

export class TransicaoInvalida extends Error {
  readonly httpStatus = 409;
}
export class AprovacaoNegada extends Error {
  readonly httpStatus = 403;
}

export function transicionar(item: WorkItem, para: WorkItemStatus): WorkItem {
  if (!TRANSICOES[item.status].includes(para)) throw new TransicaoInvalida(`${item.status} → ${para} não permitido`);
  return { ...item, status: para };
}

/** Agentes do enxame só criam WorkItem em DRAFT ou READY_FOR_REVIEW — nunca executam. */
export const AGENTES_ENXAME = ['Fiscal', 'Pericial', 'Previdenciário', 'Liquidez', 'Compliance', 'Diagnóstico'] as const;

export function criarPorAgente(agente: string, dados: Omit<WorkItem, 'status' | 'aprovacoes' | 'criadoPorAgente'> & { status?: WorkItemStatus }): WorkItem {
  const status = dados.status ?? 'DRAFT';
  if (status !== 'DRAFT' && status !== 'READY_FOR_REVIEW') throw new AprovacaoNegada(`agente ${agente} não pode criar item em ${status}`);
  return { ...dados, status, aprovacoes: [], criadoPorAgente: agente };
}

export interface Aprovador {
  userId: string;
  permissoes: string[];            // RBAC existente, ex.: 'approve:PRECATORIA'
  registroProfissional?: { conselho: 'OAB' | 'CRC' | 'CREA' | 'CORECON' | 'CNPC'; numero: string };
  ultimoStepUpEm?: string;         // ISO: reconfirmação de senha/TOTP
  isAgente?: boolean;
}

export interface PoliticaTenant {
  quatroOlhos: boolean;
  limiteQuatroOlhosCentavos: number;
  stepUpJanelaMs: number;          // P12: 5 minutos
}

export const POLITICA_PADRAO: PoliticaTenant = { quatroOlhos: true, limiteQuatroOlhosCentavos: 100_000_00, stepUpJanelaMs: 5 * 60 * 1000 };

export function aprovacoesNecessarias(item: WorkItem, pol: PoliticaTenant): number {
  return pol.quatroOlhos && (item.riscoFlag === 'RED' || item.valorEnvolvidoCentavos > pol.limiteQuatroOlhosCentavos) ? 2 : 1;
}

/** Revisão: grava o hash que o revisor viu. */
export function registrarRevisao(item: WorkItem, revisorId: string, hashExibido: string): WorkItem {
  if (item.status !== 'READY_FOR_REVIEW') throw new TransicaoInvalida('item não está em revisão');
  return { ...item, revisadoPor: revisorId, hashRevisado: hashExibido };
}

/**
 * "Aprovar e Executar". Exige: permissão approve:<esteira>, registro profissional,
 * step-up recente, hash exibido == payloadHash atual, aprovador distinto no 4 olhos.
 * Retorna o item APPROVED quando todas as aprovações necessárias foram coletadas.
 */
export function aprovar(item: WorkItem, ap: Aprovador, hashExibido: string, agora: Date, pol: PoliticaTenant = POLITICA_PADRAO): WorkItem {
  if (ap.isAgente) throw new AprovacaoNegada('agente não aprova');
  if (item.status !== 'READY_FOR_REVIEW') throw new TransicaoInvalida(`aprovação exige READY_FOR_REVIEW (atual: ${item.status})`);
  if (!ap.permissoes.includes(`approve:${item.esteira}`)) throw new AprovacaoNegada(`sem permissão approve:${item.esteira}`);
  if (!ap.registroProfissional?.numero) throw new AprovacaoNegada('registro profissional (OAB/CRC/CREA) não cadastrado');
  if (!ap.ultimoStepUpEm || agora.getTime() - new Date(ap.ultimoStepUpEm).getTime() > pol.stepUpJanelaMs) throw new AprovacaoNegada('step-up expirado: reconfirme senha ou TOTP');
  if (hashExibido !== item.payloadHash) throw new AprovacaoNegada('payload alterado após a revisão: revise novamente');
  if (item.aprovacoes.some((a) => a.userId === ap.userId)) throw new AprovacaoNegada('segundo aprovador precisa ser outra pessoa');

  const aprovacoes = [...item.aprovacoes, { userId: ap.userId, em: agora.toISOString(), hashRevisado: hashExibido }];
  const next = { ...item, aprovacoes };
  return aprovacoes.length >= aprovacoesNecessarias(item, pol) ? transicionar(next, 'APPROVED') : next;
}

/** Aprovação em lote nunca inclui itens RED. */
export function elegivelLote(item: WorkItem): boolean {
  return item.riscoFlag !== 'RED' && item.status === 'READY_FOR_REVIEW';
}

export function devolver(item: WorkItem, comentario: string): WorkItem {
  if (!comentario.trim()) throw new AprovacaoNegada('comentário obrigatório');
  return { ...transicionar(item, 'DRAFT'), motivoRejeicao: comentario, aprovacoes: [], hashRevisado: undefined };
}

export function rejeitar(item: WorkItem, motivo: string): WorkItem {
  if (!motivo.trim()) throw new AprovacaoNegada('motivo obrigatório');
  return { ...transicionar(item, 'REJECTED'), motivoRejeicao: motivo };
}

// ───────── Execução idempotente ─────────

export interface ExternalAction<R> {
  tipo: WorkItem['tipo'];
  validate(item: WorkItem): void;
  execute(item: WorkItem): Promise<R>;
  compensate?(item: WorkItem, erro: unknown): Promise<void>;
}

export interface IdempotencyStore { get(key: string): unknown | undefined; set(key: string, value: unknown): void; }

export async function executar<R>(item: WorkItem, action: ExternalAction<R>, store: IdempotencyStore): Promise<{ item: WorkItem; resultado: R; reutilizado: boolean }> {
  const prev = store.get(item.idempotencyKey);
  if (prev !== undefined) return { item: { ...item, status: 'DONE' }, resultado: prev as R, reutilizado: true };
  if (action.tipo !== item.tipo) throw new TransicaoInvalida('executor incompatível');
  action.validate(item);
  let cur = transicionar(item, 'EXECUTING');
  try {
    const resultado = await action.execute(cur);
    store.set(item.idempotencyKey, resultado);
    cur = transicionar(cur, 'DONE');
    return { item: cur, resultado, reutilizado: false };
  } catch (e) {
    if (action.compensate) await action.compensate(cur, e);
    throw Object.assign(new Error('execução falhou: ' + (e as Error).message), { item: transicionar(cur, 'FAILED') });
  }
}
