/**
 * VELATRIX AOS · Pacote LegalOps contratado por tenant (P21).
 * Enquanto o backend (Firebase) não entra, persiste em localStorage por tenant,
 * no mesmo contrato subscribe/getSnapshot dos demais stores enterprise.
 * Só o Super Admin (fabricante) altera o pacote; o tenant registra solicitações.
 */
import {
  isPacoteId,
  pacotePadraoDoPlano,
  type LegalOpsPackageId,
  type OverridesDireitos,
} from '../enterprise/legalOpsPackages';

export interface ContratoPacote {
  tenantId: string;
  pacote: LegalOpsPackageId;
  overrides: OverridesDireitos;
  origem: 'derivado_do_plano' | 'contratado';
  atualizadoEm: string;
  atualizadoPor: string | null;
}

export interface SolicitacaoUpgrade {
  id: string;
  tenantId: string;
  de: LegalOpsPackageId;
  para: LegalOpsPackageId;
  solicitanteNome: string;
  motivo: string;
  em: string;
  status: 'aberta' | 'aplicada' | 'recusada';
}

interface Estado {
  contratos: Record<string, ContratoPacote>;
  solicitacoes: SolicitacaoUpgrade[];
}

const CHAVE = 'velatrix.legalOpsPackages.v1';
const ouvintes = new Set<() => void>();

function carregar(): Estado {
  try {
    const raw = localStorage.getItem(CHAVE);
    const e = raw ? (JSON.parse(raw) as Estado) : null;
    if (e && typeof e === 'object' && e.contratos && Array.isArray(e.solicitacoes)) return e;
  } catch { /* storage indisponível: segue em memória */ }
  return { contratos: {}, solicitacoes: [] };
}

let estado: Estado = carregar();

function gravar(novo: Estado) {
  estado = novo; // nova referência a cada mutação (useSyncExternalStore)
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch { /* memória */ }
  ouvintes.forEach((f) => f());
}

export const subscribe = (f: () => void) => { ouvintes.add(f); return () => { ouvintes.delete(f); }; };
export const getSnapshot = (): Estado => estado;

/** Contrato vigente; sem registro, deriva do tier legado (sem gravar). */
export function contratoDoTenant(tenantId: string, planTier?: string | null): ContratoPacote {
  const c = estado.contratos[tenantId];
  if (c && isPacoteId(c.pacote)) return c;
  return {
    tenantId,
    pacote: pacotePadraoDoPlano(planTier),
    overrides: {},
    origem: 'derivado_do_plano',
    atualizadoEm: '',
    atualizadoPor: null,
  };
}

export function definirPacote(tenantId: string, pacote: LegalOpsPackageId, por: string, overrides: OverridesDireitos = {}) {
  if (!isPacoteId(pacote)) throw new Error(`Pacote inválido: ${String(pacote)}`);
  const agora = new Date().toISOString();
  gravar({
    contratos: {
      ...estado.contratos,
      [tenantId]: { tenantId, pacote, overrides, origem: 'contratado', atualizadoEm: agora, atualizadoPor: por },
    },
    solicitacoes: estado.solicitacoes.map((s) =>
      s.tenantId === tenantId && s.status === 'aberta' && s.para === pacote ? { ...s, status: 'aplicada' } : s,
    ),
  });
}

export function solicitarUpgrade(s: Omit<SolicitacaoUpgrade, 'id' | 'em' | 'status'>): SolicitacaoUpgrade {
  const jaAberta = estado.solicitacoes.find((x) => x.tenantId === s.tenantId && x.para === s.para && x.status === 'aberta');
  if (jaAberta) return jaAberta; // idempotente
  const nova: SolicitacaoUpgrade = {
    ...s,
    motivo: s.motivo.slice(0, 500),
    id: `UPG-${Date.now().toString(36).toUpperCase()}`,
    em: new Date().toISOString(),
    status: 'aberta',
  };
  gravar({ ...estado, solicitacoes: [nova, ...estado.solicitacoes].slice(0, 200) });
  return nova;
}

export function recusarSolicitacao(id: string) {
  gravar({ ...estado, solicitacoes: estado.solicitacoes.map((s) => (s.id === id ? { ...s, status: 'recusada' } : s)) });
}
