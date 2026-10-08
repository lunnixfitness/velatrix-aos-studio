/**
 * @deprecated - DEPRECATED: VELATRIX AOS Data Foundation Migration.
 * Usuários agora são gerenciados pela entidade User do Prisma / PostgreSQL
 * e pelas funções assíncronas do `userRepository` / `dataService`.
 */
import { UserRole } from '../types/aos';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  department: string;
  avatar: string;
  isSuperAdmin: boolean;
  allowedTenants?: string[]; // Empty for single-tenant, or list for multi-tenant admins
}

export const ENTERPRISE_USERS_REGISTRY: RegisteredUser[] = [
  {
    id: 'usr_marcos_secops',
    name: 'Marcos Vianna (SecOps)',
    email: 'admin@velatrix.ai',
    passwordHash: 'Velatrix@2026',
    role: 'super_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Velatrix Global SecOps Node',
    department: 'Segurança & Infraestrutura Global (AOS)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: true,
    allowedTenants: ['*']
  },
  {
    id: 'usr_ademilson_admin',
    name: 'Ademilson Melo (SuperAdmin)',
    email: 'ademilson2020melo@gmail.com',
    passwordHash: 'Velatrix@2026',
    role: 'super_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Velatrix Global SecOps Node',
    department: 'Diretoria de Tecnologia & Engenharia Global',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: true,
    allowedTenants: ['*']
  },
  {
    id: 'usr_nexus_manager',
    name: 'Guilherme Sampaio (Gestor Nexus)',
    email: 'gestor@nexuslog.com.br',
    passwordHash: 'Velatrix@2026',
    role: 'tenant_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    department: 'Gestão Geral & Controladoria',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_nexus_admin_alias',
    name: 'Administração Nexus S/A',
    email: 'admin@nexus.com.br',
    passwordHash: 'Velatrix@2026',
    role: 'tenant_admin',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    department: 'Administração & Controladoria de Tenant',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_roberto_ceo',
    name: 'Roberto Albuquerque',
    email: 'ceo@velatrix.ai',
    passwordHash: 'Velatrix@2026',
    role: 'c_level_approver',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    department: 'Presidência (CEO)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_mariana_cfo',
    name: 'Mariana Duarte',
    email: 'cfo@velatrix.ai',
    passwordHash: 'Velatrix@2026',
    role: 'cfo_executive',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    department: 'Diretoria Financeira (CFO)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_carlos_coo',
    name: 'Carlos Eduardo Mendes',
    email: 'operacoes@velatrix.ai',
    passwordHash: 'Velatrix@2026',
    role: 'operator',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Nexus Indústria & Manufatura S/A',
    department: 'Operações & Logística Tática',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_luciana_pharma',
    name: 'Luciana Silveira',
    email: 'pharma.admin@biolab.farma.br',
    passwordHash: 'Velatrix@2026',
    role: 'tenant_admin',
    tenantId: 'tenant_pharma_03',
    tenantName: 'Biolab Farma Distribuidora S/A',
    department: 'Operações Regulatórias Farma (ANVISA)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_fernando_retail',
    name: 'Fernando Rossi',
    email: 'varejo.ops@omnivarejo.com.br',
    passwordHash: 'Velatrix@2026',
    role: 'operator',
    tenantId: 'tenant_varejo_04',
    tenantName: 'OmniVarejo Brasil Logística EIRELI',
    department: 'Centro de Distribuição & Omnichannel',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  },
  {
    id: 'usr_vasconcelos_partner',
    name: 'Dr. Henrique Vasconcelos',
    email: 'parceiro@vasconcelosadv.com.br',
    passwordHash: 'Velatrix@2026',
    role: 'parceiro_tributario',
    tenantId: 'tenant_nexus_01',
    tenantName: 'Vasconcelos & Associados Tributário',
    department: 'Advocacia Tributária Parceira / Canal Afiliado',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    isSuperAdmin: false
  }
];

export function findRegisteredUser(email: string): RegisteredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return ENTERPRISE_USERS_REGISTRY.find(u => u.email.toLowerCase() === normalized);
}

export function validateUserTenantAccess(user: RegisteredUser, targetTenantId: string): boolean {
  if (user.isSuperAdmin || user.role === 'super_admin') {
    return true;
  }
  return user.tenantId === targetTenantId;
}
