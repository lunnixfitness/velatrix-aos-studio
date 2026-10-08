/**
 * VELATRIX AOS · Enterprise · Pacotes LegalOps (P21)
 *
 * Camada comercial para escritórios de advocacia / contabilidade / perícia.
 * Independe dos tiers legados de planFeatures.ts (orientados a indústria/ERP):
 * o pacote LegalOps decide QUAIS ferramentas da Central Enterprise o tenant
 * pode usar e com QUAIS limites. Módulo puro (sem React/IO) — testável em Node.
 *
 * Preços são INDICATIVOS: ajuste em LEGALOPS_PACKAGES antes de ir a mercado.
 */

export type LegalOpsPackageId = 'ESSENCIAL' | 'ESCRITORIO' | 'GRANDE_ESCRITORIO' | 'CORPORATIVO';

export type LegalOpsFeature =
  | 'conflict_check'
  | 'aprovacao_multinivel'
  | 'chinese_wall'
  | 'hitl'
  | 'verify_seal'
  | 'risk_shield'
  | 'guardrail'
  | 'jurimetria'
  | 'connect'
  | 'zdr'
  | 'sso_scim'
  | 'tenant_dedicado';

export type LegalOpsLimit =
  | 'assentos'
  | 'conflictChecksMes'
  | 'barreirasAtivas'
  | 'laudosSeladosMes'
  | 'retencaoAuditoriaAnos';

/** -1 = ilimitado */
export type Limites = Record<LegalOpsLimit, number>;
export type Recursos = Record<LegalOpsFeature, boolean>;

export interface LegalOpsPackage {
  id: LegalOpsPackageId;
  nome: string;
  publico: string;
  resumo: string;
  precoMensalBrl: number | null; // null = sob consulta
  precoLabel: string;
  recursos: Recursos;
  limites: Limites;
  sla: { respostaMin: number; disponibilidade: string; suporte: string };
}

export const PACOTE_ORDEM: LegalOpsPackageId[] = ['ESSENCIAL', 'ESCRITORIO', 'GRANDE_ESCRITORIO', 'CORPORATIVO'];

export const RECURSO_LABEL: Record<LegalOpsFeature, string> = {
  conflict_check: 'Conflict Check',
  aprovacao_multinivel: 'Aprovação multinível de conflitos',
  chinese_wall: 'Chinese Wall',
  hitl: 'Aprovação Humana (HITL)',
  verify_seal: 'Verificação de selo SHA-256',
  risk_shield: 'Shield de Risco',
  guardrail: 'Guardrail anti-alucinação',
  jurimetria: 'Jurimetria · Decision Score',
  connect: 'Velatrix Connect',
  zdr: 'ZDR & Criptografia',
  sso_scim: 'SSO (SAML/OIDC) + SCIM',
  tenant_dedicado: 'Tenant dedicado / on-premise',
};

export const LIMITE_LABEL: Record<LegalOpsLimit, string> = {
  assentos: 'Assentos (usuários)',
  conflictChecksMes: 'Conflict checks / mês',
  barreirasAtivas: 'Chinese Walls ativas',
  laudosSeladosMes: 'Laudos selados / mês',
  retencaoAuditoriaAnos: 'Retenção de auditoria (anos)',
};

const R = (on: LegalOpsFeature[]): Recursos => {
  const all = Object.keys(RECURSO_LABEL) as LegalOpsFeature[];
  return Object.fromEntries(all.map((f) => [f, on.includes(f)])) as Recursos;
};

const BASE: LegalOpsFeature[] = ['conflict_check', 'hitl', 'verify_seal'];
const ESCR: LegalOpsFeature[] = [...BASE, 'aprovacao_multinivel', 'chinese_wall', 'risk_shield', 'guardrail'];
const GRANDE: LegalOpsFeature[] = [...ESCR, 'jurimetria', 'connect', 'zdr', 'sso_scim'];
const CORP: LegalOpsFeature[] = [...GRANDE, 'tenant_dedicado'];

export const LEGALOPS_PACKAGES: Record<LegalOpsPackageId, LegalOpsPackage> = {
  ESSENCIAL: {
    id: 'ESSENCIAL',
    nome: 'Essencial',
    publico: 'Boutiques e profissionais solo',
    resumo: 'Conflict check selado, fila de aprovação humana e verificação de laudos.',
    precoMensalBrl: 2900,
    precoLabel: 'R$ 2.900/mês',
    recursos: R(BASE),
    limites: { assentos: 5, conflictChecksMes: 100, barreirasAtivas: 0, laudosSeladosMes: 50, retencaoAuditoriaAnos: 1 },
    sla: { respostaMin: 480, disponibilidade: '99,5%', suporte: 'E-mail em horário comercial' },
  },
  ESCRITORIO: {
    id: 'ESCRITORIO',
    nome: 'Escritório',
    publico: 'Escritórios médios (até ~25 advogados)',
    resumo: 'Aprovação multinível, Chinese Walls, Shield de Risco e Guardrail anti-alucinação.',
    precoMensalBrl: 9800,
    precoLabel: 'R$ 9.800/mês',
    recursos: R(ESCR),
    limites: { assentos: 25, conflictChecksMes: 1000, barreirasAtivas: 10, laudosSeladosMes: 500, retencaoAuditoriaAnos: 5 },
    sla: { respostaMin: 120, disponibilidade: '99,8%', suporte: 'Chat + e-mail, 8x5' },
  },
  GRANDE_ESCRITORIO: {
    id: 'GRANDE_ESCRITORIO',
    nome: 'Grande Escritório',
    publico: 'Full-service e bancas com múltiplas áreas',
    resumo: 'Jurimetria, Velatrix Connect, ZDR e SSO/SCIM, conflitos e barreiras ilimitados.',
    precoMensalBrl: 34000,
    precoLabel: 'R$ 34.000/mês',
    recursos: R(GRANDE),
    limites: { assentos: 150, conflictChecksMes: -1, barreirasAtivas: -1, laudosSeladosMes: 5000, retencaoAuditoriaAnos: 10 },
    sla: { respostaMin: 30, disponibilidade: '99,9%', suporte: 'CSM dedicado, 24x7 para Sev1' },
  },
  CORPORATIVO: {
    id: 'CORPORATIVO',
    nome: 'Corporativo',
    publico: 'Departamentos jurídicos e bancas top-tier',
    resumo: 'Tudo ilimitado, tenant dedicado/on-premise e retenção regulatória estendida.',
    precoMensalBrl: null,
    precoLabel: 'Sob consulta',
    recursos: R(CORP),
    limites: { assentos: -1, conflictChecksMes: -1, barreirasAtivas: -1, laudosSeladosMes: -1, retencaoAuditoriaAnos: 20 },
    sla: { respostaMin: 15, disponibilidade: '99,95%', suporte: 'Engenheiro dedicado, 24x7' },
  },
};

/** Ferramentas da Central Enterprise → recurso exigido. */
export const RECURSO_POR_FERRAMENTA: Record<string, LegalOpsFeature> = {
  ent_hitl: 'hitl',
  ent_risk_shield: 'risk_shield',
  ent_guardrail: 'guardrail',
  ent_jurimetria: 'jurimetria',
  ent_connect: 'connect',
  ent_zdr: 'zdr',
  ent_verify_seal: 'verify_seal',
  ent_conflict: 'conflict_check',
};

export const isPacoteId = (v: unknown): v is LegalOpsPackageId =>
  typeof v === 'string' && (PACOTE_ORDEM as string[]).includes(v);

/** Pacote padrão derivado do tier legado quando o tenant ainda não tem pacote LegalOps. */
export function pacotePadraoDoPlano(planTier?: string | null): LegalOpsPackageId {
  switch ((planTier || '').toUpperCase()) {
    case 'REGULATED': return 'CORPORATIVO';
    case 'ENTERPRISE': return 'GRANDE_ESCRITORIO';
    case 'PROFESSIONAL':
    case 'PRO': return 'ESCRITORIO';
    default: return 'ESSENCIAL';
  }
}

export interface OverridesDireitos {
  recursos?: Partial<Recursos>;
  limites?: Partial<Limites>;
}

export interface Direitos {
  pacote: LegalOpsPackage;
  recursos: Recursos;
  limites: Limites;
}

/** Pacote + overrides negociados em contrato (overrides vencem). Valida entradas. */
export function resolverDireitos(id: LegalOpsPackageId, ov: OverridesDireitos = {}): Direitos {
  const pacote = LEGALOPS_PACKAGES[id];
  if (!pacote) throw new Error(`Pacote LegalOps desconhecido: ${id}`);
  const recursos = { ...pacote.recursos };
  for (const [k, v] of Object.entries(ov.recursos || {})) {
    if (k in recursos && typeof v === 'boolean') recursos[k as LegalOpsFeature] = v;
  }
  const limites = { ...pacote.limites };
  for (const [k, v] of Object.entries(ov.limites || {})) {
    if (!(k in limites) || typeof v !== 'number' || !Number.isInteger(v) || v < -1) continue;
    limites[k as LegalOpsLimit] = v;
  }
  return { pacote, recursos, limites };
}

export const temRecurso = (d: Direitos, f: LegalOpsFeature): boolean => d.recursos[f] === true;

export function podeUsarFerramenta(d: Direitos, toolId: string): boolean {
  const f = RECURSO_POR_FERRAMENTA[toolId];
  return f ? temRecurso(d, f) : true; // ferramenta sem mapeamento = liberada
}

export type EstadoUso = 'ok' | 'alerta' | 'excedido' | 'ilimitado' | 'indisponivel';

export interface AvaliacaoUso {
  limite: LegalOpsLimit;
  usado: number;
  max: number;
  pct: number; // 0..100+ (0 quando ilimitado/indisponível)
  estado: EstadoUso;
  restante: number | null; // null = ilimitado
}

/** ok < 80% ≤ alerta < 100% ≤ excedido. max 0 = recurso fora do pacote. */
export function avaliarUso(d: Direitos, limite: LegalOpsLimit, usado: number): AvaliacaoUso {
  const u = Math.max(0, Math.floor(usado || 0));
  const max = d.limites[limite];
  if (max === -1) return { limite, usado: u, max, pct: 0, estado: 'ilimitado', restante: null };
  if (max === 0) return { limite, usado: u, max, pct: 0, estado: u > 0 ? 'excedido' : 'indisponivel', restante: 0 };
  const pct = Math.round((u / max) * 100);
  const estado: EstadoUso = u >= max ? 'excedido' : pct >= 80 ? 'alerta' : 'ok';
  return { limite, usado: u, max, pct, estado, restante: Math.max(0, max - u) };
}

/** Consome 1 unidade? Bloqueia no limite (hard cap) — o upsell é mostrado pela UI. */
export const podeConsumir = (d: Direitos, limite: LegalOpsLimit, usado: number, qtd = 1): boolean => {
  const max = d.limites[limite];
  return max === -1 || usado + qtd <= max;
};

export function pacoteMinimoPara(f: LegalOpsFeature): LegalOpsPackageId {
  const id = PACOTE_ORDEM.find((p) => LEGALOPS_PACKAGES[p].recursos[f]);
  return id ?? 'CORPORATIVO';
}

export interface DiffUpgrade {
  de: LegalOpsPackageId;
  para: LegalOpsPackageId;
  direcao: 'upgrade' | 'downgrade' | 'igual';
  recursosGanhos: LegalOpsFeature[];
  recursosPerdidos: LegalOpsFeature[];
  limitesAlterados: { limite: LegalOpsLimit; de: number; para: number }[];
  deltaMensalBrl: number | null; // null se algum lado é sob consulta
}

export function compararPacotes(de: LegalOpsPackageId, para: LegalOpsPackageId): DiffUpgrade {
  const a = LEGALOPS_PACKAGES[de];
  const b = LEGALOPS_PACKAGES[para];
  const fs = Object.keys(RECURSO_LABEL) as LegalOpsFeature[];
  const ls = Object.keys(LIMITE_LABEL) as LegalOpsLimit[];
  const ia = PACOTE_ORDEM.indexOf(de);
  const ib = PACOTE_ORDEM.indexOf(para);
  return {
    de,
    para,
    direcao: ib > ia ? 'upgrade' : ib < ia ? 'downgrade' : 'igual',
    recursosGanhos: fs.filter((f) => !a.recursos[f] && b.recursos[f]),
    recursosPerdidos: fs.filter((f) => a.recursos[f] && !b.recursos[f]),
    limitesAlterados: ls
      .filter((l) => a.limites[l] !== b.limites[l])
      .map((l) => ({ limite: l, de: a.limites[l], para: b.limites[l] })),
    deltaMensalBrl: a.precoMensalBrl == null || b.precoMensalBrl == null ? null : b.precoMensalBrl - a.precoMensalBrl,
  };
}

/** Downgrade seguro? Lista os bloqueios dado o uso atual. */
export function bloqueiosDowngrade(para: LegalOpsPackageId, uso: Partial<Record<LegalOpsLimit, number>>): string[] {
  const d = resolverDireitos(para);
  const out: string[] = [];
  for (const [k, v] of Object.entries(uso)) {
    const l = k as LegalOpsLimit;
    const max = d.limites[l];
    if (max !== -1 && (v ?? 0) > max) out.push(`${LIMITE_LABEL[l]}: uso ${v} > limite ${max}`);
  }
  return out;
}

export const formatLimite = (n: number): string => (n === -1 ? 'Ilimitado' : n === 0 ? '—' : n.toLocaleString('pt-BR'));