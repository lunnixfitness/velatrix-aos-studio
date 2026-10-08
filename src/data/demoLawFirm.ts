/**
 * VELATRIX AOS · Tenant de demonstração jurídico (P22)
 *
 * Banca full-service fictícia usada como tenant padrão das demos para
 * grandes escritórios. Nomes, e-mails e registros OAB/CRC são FICTÍCIOS
 * (domínio .demo) — não correspondem a pessoas ou inscrições reais.
 */
import type { TenantMember } from '../types/rbac';

export const DEMO_LAW_FIRM_TENANT_ID = 'tenant_monteiro_law';

/** Marca a migração única que leva navegadores antigos para o tenant jurídico. */
export const DEMO_LAW_FIRM_MIGRATION_KEY = 'velatrix_demo_law_firm_v1';

const DOM = 'mv-advogados.demo';

type Seed = Pick<TenantMember, 'id' | 'name' | 'role' | 'department' | 'accessScope'> & {
  user: string;
  registro?: string;
  profissional?: string;
  status?: TenantMember['status'];
};

const SEEDS: Seed[] = [
  { id: 'mv_socio_helena', user: 'helena.monteiro', name: 'Dra. Helena Monteiro', role: 'tenant_admin', profissional: 'tenant_admin', registro: 'OAB/SP 118.204', department: 'Sócia-gestora · Comitê Executivo', accessScope: 'ALL' },
  { id: 'mv_socio_ricardo', user: 'ricardo.vasconcelos', name: 'Dr. Ricardo Vasconcelos', role: 'c_level_approver', registro: 'OAB/SP 132.977', department: 'Sócio · Societário & M&A', accessScope: 'ALL' },
  { id: 'mv_socia_beatriz', user: 'beatriz.araujo', name: 'Dra. Beatriz Araújo', role: 'advogado_tributarista', profissional: 'advogado_tributarista', registro: 'OAB/SP 201.566', department: 'Sócia · Tributário', accessScope: 'LEGAL_ONLY' },
  { id: 'mv_adv_felipe', user: 'felipe.nogueira', name: 'Dr. Felipe Nogueira', role: 'advogado_tributarista', profissional: 'advogado_tributarista', registro: 'OAB/SP 389.410', department: 'Tributário · Contencioso Administrativo', accessScope: 'LEGAL_ONLY' },
  { id: 'mv_adv_larissa', user: 'larissa.campos', name: 'Dra. Larissa Campos', role: 'advogado_tributarista', profissional: 'advogado_tributarista', registro: 'OAB/SP 412.337', department: 'Societário & M&A', accessScope: 'LEGAL_ONLY' },
  { id: 'mv_adv_thiago', user: 'thiago.rezende', name: 'Dr. Thiago Rezende', role: 'advogado_tributarista', profissional: 'advogado_tributarista', registro: 'OAB/RJ 245.118', department: 'Contencioso Cível & Arbitragem', accessScope: 'LEGAL_ONLY' },
  { id: 'mv_adv_marina', user: 'marina.lopes', name: 'Dra. Marina Lopes', role: 'advogado_tributarista', profissional: 'advogado_tributarista', registro: 'OAB/SP 437.902', department: 'Trabalhista Empresarial', accessScope: 'LEGAL_ONLY', status: 'PENDING' },
  { id: 'mv_cont_andre', user: 'andre.pacheco', name: 'André Pacheco', role: 'contador_fiscal', profissional: 'contador_fiscal', registro: 'CRC/SP 1SP301442/O-7', department: 'Controladoria Tributária', accessScope: 'FINANCIAL' },
  { id: 'mv_perito_sergio', user: 'sergio.duarte', name: 'Sérgio Duarte', role: 'perito_judicial', profissional: 'perito_judicial', registro: 'CRC/SP 1SP244810/O-2', department: 'Perícia Contábil', accessScope: 'LEGAL_ONLY' },
  { id: 'mv_ops_juliana', user: 'juliana.reis', name: 'Juliana Reis', role: 'operator', department: 'LegalOps · Intake & Conflitos', accessScope: 'ALL' },
  { id: 'mv_ops_caio', user: 'caio.menezes', name: 'Caio Menezes', role: 'office_staff', department: 'Controladoria Jurídica', accessScope: 'LEGAL_ONLY' },
];

export const LAW_FIRM_MEMBERS: TenantMember[] = SEEDS.map((s, i) => ({
  id: s.id,
  name: s.name,
  email: `${s.user}@${DOM}`,
  role: s.role,
  professionalRole: s.profissional,
  professionalRegistry: s.registro,
  department: s.department,
  accessScope: s.accessScope,
  status: s.status ?? 'ACTIVE',
  joinedAt: new Date(Date.UTC(2026, 0, 12 + i * 3, 12)).toISOString(),
  invitedBy: i === 0 ? undefined : 'Dra. Helena Monteiro',
  tenantId: DEMO_LAW_FIRM_TENANT_ID,
}));

/**
 * P30 · DEMO_MODE: tenants sem membros cadastrados ganham uma equipe FICTÍCIA mínima
 * (sócio aprovador, 2 advogados com OAB, operador, financeiro) para "Ver como" e para
 * a procuração da esteira LOAS. Ids determinísticos por tenant; domínio .demo; OABs fictícias.
 */
export function membrosDemoParaTenant(tenantId: string, tenantName: string): TenantMember[] {
  const slug = tenantId.replace(/^tenant_/, '').replace(/[^a-z0-9]/gi, '').slice(0, 12).toLowerCase() || 'tenant';
  const dom = `${slug}.demo`;
  const base: Array<Pick<TenantMember, 'name' | 'role' | 'department' | 'accessScope'> & { k: string; registro?: string; profissional?: string }> = [
    { k: 'socio', name: 'Dra. Ana Ribeiro (demo)', role: 'c_level_approver', department: 'Sócia · Aprovação', accessScope: 'ALL', registro: 'OAB/SP 900.101' },
    { k: 'adv1', name: 'Dr. Bruno Teixeira (demo)', role: 'advogado_tributarista', profissional: 'advogado_tributarista', department: 'Previdenciário', accessScope: 'LEGAL_ONLY', registro: 'OAB/SP 900.202' },
    { k: 'adv2', name: 'Dra. Carla Mendes (demo)', role: 'advogado_tributarista', profissional: 'advogado_tributarista', department: 'Contencioso', accessScope: 'LEGAL_ONLY', registro: 'OAB/SP 900.303' },
    { k: 'oper', name: 'Diego Santos (demo)', role: 'operator', department: 'Operações', accessScope: 'LOGISTICS' },
    { k: 'fin', name: 'Elisa Costa (demo)', role: 'cfo_executive', department: 'Financeiro', accessScope: 'FINANCIAL' },
  ];
  return base.map((s, i) => ({
    id: `demo_${slug}_${s.k}`,
    name: s.name,
    email: `${s.k}@${dom}`,
    role: s.role,
    professionalRole: s.profissional,
    professionalRegistry: s.registro,
    department: `${s.department} · ${tenantName}`.slice(0, 80),
    accessScope: s.accessScope,
    status: 'ACTIVE',
    joinedAt: new Date(Date.UTC(2026, 0, 5 + i, 12)).toISOString(),
    tenantId,
  }));
}
