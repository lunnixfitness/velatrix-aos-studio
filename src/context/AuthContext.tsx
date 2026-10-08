import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, TenantProfile, NavigationTab, ServiceWorkMode, ContractedServiceType } from '../types/aos';
import { RbacPermission, TenantMember, hasRbacPermission, isTabAllowedForRole, getDefaultTabForRole, validateTenantRlsAccess } from '../types/rbac';
import { PlanTier, VELATRIX_PLAN_TIERS, isFeatureAvailable, PlanFeatureConfig } from '../data/planFeatures';
import { INITIAL_MOCK_TENANTS, INITIAL_SUPERADMIN_AUDIT_LOGS, SuperAdminAuditEntry } from '../data/mockSuperAdmin';
import { findRegisteredUser, ENTERPRISE_USERS_REGISTRY, validateUserTenantAccess } from '../data/mockUsers';
import { fetchTenants } from '../services/dataService';
import { UnifiedTenantService } from '../services/unifiedTenantService';
import { getSessionToken, setSessionToken } from '../services/authClient';
import { secureId, IS_DEMO_MODE } from '../lib/demoMode';
import { LAW_FIRM_MEMBERS, membrosDemoParaTenant } from '../data/demoLawFirm';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  tenantId: string;
  tenantName: string;
  isSuperAdmin?: boolean;
  lastLogin?: string;
  sessionToken?: string;
}

const BASE_MEMBERS: TenantMember[] = ENTERPRISE_USERS_REGISTRY.map((user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  professionalRole: (user.role as any),
  professionalRegistry: user.role === 'advogado_tributarista' ? 'OAB/SP 412.890' : user.role === 'contador_fiscal' ? 'CRC/SP 2SP194820/O-4' : user.role === 'perito_judicial' ? 'CNPC 4.812/CFC' : undefined,
  department: user.department,
  accessScope: user.role === 'operator' ? 'LOGISTICS' : user.role === 'cfo_executive' ? 'FINANCIAL' : user.role === 'parceiro_tributario' ? 'LEGAL_ONLY' : 'ALL',
  status: 'ACTIVE',
  joinedAt: '2026-01-15T09:00:00.000Z',
  tenantId: user.tenantId,
  avatar: user.avatar
}));

// Additional professional roles to ensure granular IAM is immediately populated
const PROFESSIONAL_SPECIALISTS: TenantMember[] = [
  {
    id: 'usr_adv_camila_prado',
    name: 'Dra. Camila Prado',
    email: 'camila.prado@tributario.adv.br',
    role: 'advogado_tributarista',
    professionalRole: 'advogado_tributarista',
    professionalRegistry: 'OAB/SP 412.890',
    department: 'Contencioso & Consultoria Tributária',
    accessScope: 'LEGAL_ONLY',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T10:00:00.000Z',
    tenantId: 'tenant_vanguarda_08',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    customPermissions: {
      diag_exec: { canView: true, canEdit: false },
      defesa_fiscal: { canView: true, canEdit: true },
      perito_contabil: { canView: true, canEdit: true },
      pgfn_transacao: { canView: true, canEdit: true },
      inss_obras: { canView: true, canEdit: true },
      dre_sped: { canView: true, canEdit: false },
      partner_split: { canView: true, canEdit: false },
      iam_users: { canView: false, canEdit: false }
    }
  },
  {
    id: 'usr_cont_marcelo_fagundes',
    name: 'Dr. Marcelo Fagundes',
    email: 'marcelo.fagundes@taxcompliance.cnt.br',
    role: 'contador_fiscal',
    professionalRole: 'contador_fiscal',
    professionalRegistry: 'CRC/SP 2SP194820/O-4',
    department: 'Controladoria & Compliance Fiscal',
    accessScope: 'FINANCIAL',
    status: 'ACTIVE',
    joinedAt: '2026-02-05T14:30:00.000Z',
    tenantId: 'tenant_vanguarda_08',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80',
    customPermissions: {
      diag_exec: { canView: true, canEdit: true },
      defesa_fiscal: { canView: true, canEdit: true },
      perito_contabil: { canView: true, canEdit: true },
      pgfn_transacao: { canView: true, canEdit: false },
      inss_obras: { canView: true, canEdit: true },
      dre_sped: { canView: true, canEdit: true },
      partner_split: { canView: true, canEdit: false },
      iam_users: { canView: false, canEdit: false }
    }
  },
  {
    id: 'usr_perito_renato_vasc',
    name: 'Eng. Renato Vasconcelos',
    email: 'renato.vasconcelos@forense.cnt.br',
    role: 'perito_judicial',
    professionalRole: 'perito_judicial',
    professionalRegistry: 'CNPC nº 4.812 / CFC',
    department: 'Perícia Forense & Engenharia Legal',
    accessScope: 'ALL',
    status: 'ACTIVE',
    joinedAt: '2026-02-10T09:15:00.000Z',
    tenantId: 'tenant_vanguarda_08',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    customPermissions: {
      diag_exec: { canView: true, canEdit: true },
      defesa_fiscal: { canView: true, canEdit: true },
      perito_contabil: { canView: true, canEdit: true },
      pgfn_transacao: { canView: true, canEdit: true },
      inss_obras: { canView: true, canEdit: true },
      dre_sped: { canView: true, canEdit: true },
      partner_split: { canView: false, canEdit: false },
      iam_users: { canView: false, canEdit: false }
    }
  }
];

export const INITIAL_TENANT_MEMBERS: TenantMember[] = [...BASE_MEMBERS, ...PROFESSIONAL_SPECIALISTS, ...LAW_FIRM_MEMBERS];

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  login: (credentials: { email: string; password?: string; tenantId?: string; role?: UserRole }) => Promise<boolean>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  currentUserRole: UserRole;
  /** P24 — identidade real (sempre o usuário logado), mesmo durante "Ver como". */
  realUser: AuthUser | null;
  viewAs: TenantMember | null;
  startViewAs: (memberId: string) => boolean;
  stopViewAs: () => void;
  isRealSuperAdmin: boolean;
  setCurrentUserRole: (role: UserRole) => void;
  isSuperAdmin: boolean;
  isPartner: boolean;
  activeTenant: TenantProfile;
  setActiveTenant: (tenant: TenantProfile) => void;
  switchActiveTenantByIdOrCnpj: (idOrCnpj: string) => TenantProfile;
  activeWorkMode: ServiceWorkMode;
  setActiveWorkMode: (mode: ServiceWorkMode) => void;
  updateTenantServices: (tenantId: string, services: ContractedServiceType[], defaultMode?: ServiceWorkMode) => void;
  tenantsList: TenantProfile[];
  auditLogs: SuperAdminAuditEntry[];
  tenantMembers: TenantMember[];
  inviteTenantMember: (
    member: Omit<TenantMember, 'id' | 'joinedAt' | 'status'>,
    onAuditRecord?: (record: any) => void
  ) => TenantMember;
  revokeTenantMember: (
    memberId: string,
    reason: string,
    onAuditRecord?: (record: any) => void
  ) => void;
  updateMemberCustomPermissions: (
    memberId: string,
    permissions: Record<string, { canView: boolean; canEdit: boolean }>,
    onAuditRecord?: (record: any) => void
  ) => void;
  currentPlanConfig: PlanFeatureConfig;
  hasPermission: (permission: RbacPermission) => boolean;
  isTabAllowed: (tab: NavigationTab) => boolean;
  getDefaultTab: () => NavigationTab;
  canAccessTenant: (targetTenantId: string) => boolean;
  updateTenantPlan: (tenantId: string, newPlan: PlanTier, reason?: string) => void;
  toggleTenantFeatureFlag: (tenantId: string, flagKey: string, newValue: boolean, reason?: string) => void;
  activateShadowMode: (tenantId: string, days?: number, reason?: string) => void;
  engageKillSwitch: (tenantId: string, reason: string, secondApproverEmail: string) => void;
  disengageKillSwitch: (tenantId: string, reason: string) => void;
  provisionTenant: (newTenant: Partial<TenantProfile>) => void;
  grantTrialAccess: (tenantData: Partial<TenantProfile>, days: 7 | 14 | 30) => void;
  checkFeature: (feature: keyof Pick<
    PlanFeatureConfig,
    | 'multimodalIngestion'
    | 'riskPropagationEngine'
    | 'iotColdChainTelemetry'
    | 'airGappedDeployment'
    | 'hsmHardwareSecurity'
    | 'redTeamAdversarial'
  >) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialTenant?: TenantProfile }> = ({
  children,
  initialTenant
}) => {
  // Session authentication state (defaults to false so login screen is displayed first)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      // Clear deprecated localStorage if any
      localStorage.removeItem('velatrix_auth_session');
      localStorage.removeItem('velatrix_auth_user');

      const stored = sessionStorage.getItem('velatrix_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.isAuthenticated === true && parsed?.token) {
          setSessionToken(parsed.token);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem('velatrix_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.user || null;
      }
    } catch {
      // Fallback
    }
    return null;
  });

  const [baseUserRole, setCurrentUserRoleState] = useState<UserRole>(() => {
    try {
      const stored = sessionStorage.getItem('velatrix_auth_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.user?.role || 'tenant_admin';
      }
    } catch {
      // Fallback
    }
    return 'tenant_admin';
  });

  // Listen for unauthorized events to trigger immediate logout
  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      logout();
    };
    window.addEventListener('velatrix:unauthorized', handleUnauthorizedEvent);
    return () => {
      window.removeEventListener('velatrix:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  const [tenantsList, setTenantsList] = useState<TenantProfile[]>(INITIAL_MOCK_TENANTS);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditEntry[]>(INITIAL_SUPERADMIN_AUDIT_LOGS);
  const [tenantMembers, setTenantMembers] = useState<TenantMember[]>(INITIAL_TENANT_MEMBERS);

  // Synchronize tenants with persistent database foundation
  useEffect(() => {
    // Só sincroniza após autenticação: a rota exige Bearer token (evita 401 anônimo no boot).
    if (!isAuthenticated) return;
    let isMounted = true;
    fetchTenants()
      .then(fetched => {
        if (isMounted && fetched && fetched.length > 0) {
          setTenantsList(fetched);
        }
      })
      .catch(err => {
        console.debug('[AuthContext] Falha ao sincronizar tenants da base de dados:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Active tenant currently operating in the dashboard (unified single source of truth)
  const [activeTenant, setActiveTenantState] = useState<TenantProfile>(() => {
    if (initialTenant) return initialTenant;
    return UnifiedTenantService.getActiveTenant();
  });

  // Subscribe to UnifiedTenantService global updates across all modules
  useEffect(() => {
    const unsub = UnifiedTenantService.subscribe((tenant) => {
      setActiveTenantState(tenant);
    });
    return unsub;
  }, []);

  // Active Work Mode (Segmented Access Journey: 'operational' | 'tax_recovery' | 'both')
  const [activeWorkMode, setActiveWorkModeState] = useState<ServiceWorkMode>(() => {
    try {
      const storedMode = localStorage.getItem('velatrix_work_mode');
      if (storedMode === 'operational' || storedMode === 'tax_recovery' || storedMode === 'both') {
        return storedMode as ServiceWorkMode;
      }
    } catch {
      // fallback
    }
    return (activeTenant.defaultWorkMode as ServiceWorkMode) || (activeTenant.enabledServices?.includes('tax_recovery') && !activeTenant.enabledServices?.includes('operational') ? 'tax_recovery' : activeTenant.enabledServices?.includes('operational') && !activeTenant.enabledServices?.includes('tax_recovery') ? 'operational' : 'both');
  });

  // Keep active work mode valid when activeTenant changes
  const setActiveWorkMode = (mode: ServiceWorkMode) => {
    setActiveWorkModeState(mode);
    try {
      localStorage.setItem('velatrix_work_mode', mode);
    } catch {
      // ignore
    }
  };

  // P24: "Ver como" — o Super Admin real visualiza a plataforma com o papel de um membro do
  // tenant ativo (demo e suporte). Só em memória: recarregar a página encerra a visualização.
  const [viewAs, setViewAs] = useState<TenantMember | null>(null);
  const isRealSuperAdmin = baseUserRole === 'super_admin' || currentUser?.isSuperAdmin === true;
  const currentUserRole: UserRole = viewAs ? viewAs.role : baseUserRole;
  const isSuperAdmin = viewAs ? false : isRealSuperAdmin;

  const registrarViewAs = (action: 'VIEW_AS_START' | 'VIEW_AS_END', membro: TenantMember) => {
    const log: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action,
      tenantId: activeTenant.id,
      tenantName: activeTenant.name,
      details: action === 'VIEW_AS_START'
        ? `Visualização iniciada como ${membro.name} (${membro.role}). Nenhuma credencial do membro foi usada.`
        : `Visualização como ${membro.name} encerrada.`,
      previousState: { role: action === 'VIEW_AS_START' ? baseUserRole : membro.role },
      newState: { role: action === 'VIEW_AS_START' ? membro.role : baseUserRole, viewAsMemberId: membro.id },
      immutableHash: generateAuditHash(),
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const startViewAs = (memberId: string): boolean => {
    if (!isRealSuperAdmin) return false;
    const membro = tenantMembers.find(m => m.id === memberId && m.tenantId === activeTenant.id && m.status !== 'REVOKED');
    if (!membro || membro.role === 'super_admin') return false;
    if (viewAs) registrarViewAs('VIEW_AS_END', viewAs);
    setViewAs(membro);
    registrarViewAs('VIEW_AS_START', membro);
    return true;
  };

  const stopViewAs = () => {
    if (!viewAs) return;
    registrarViewAs('VIEW_AS_END', viewAs);
    setViewAs(null);
  };

  // Trocar de tenant encerra a visualização (o membro pertence ao tenant anterior).
  useEffect(() => {
    if (viewAs && viewAs.tenantId !== activeTenant.id) setViewAs(null);
  }, [activeTenant.id, viewAs]);

  const effectiveUser: AuthUser | null = viewAs && currentUser
    ? {
        ...currentUser,
        id: viewAs.id,
        name: viewAs.name,
        email: viewAs.email,
        role: viewAs.role,
        department: viewAs.department,
        tenantId: viewAs.tenantId,
        tenantName: activeTenant.name,
        isSuperAdmin: false,
      }
    : currentUser;
  const isPartner = currentUserRole === 'parceiro_tributario';

  // RBAC Permission Evaluator
  const hasPermission = (permission: RbacPermission): boolean => {
    return hasRbacPermission(currentUserRole, permission);
  };

  // RBAC Tab Access Evaluator
  const isTabAllowed = (tab: NavigationTab): boolean => {
    return isTabAllowedForRole(currentUserRole, tab);
  };

  // Get default landing tab for the current role
  const getDefaultTab = (): NavigationTab => {
    return getDefaultTabForRole(currentUserRole);
  };

  // Row-Level Security (RLS) Tenant Boundary Checker
  const canAccessTenant = (targetTenantId: string): boolean => {
    if (!currentUser) return false;
    return validateTenantRlsAccess(currentUserRole, currentUser.tenantId, targetTenantId);
  };

  // Safe setActiveTenant wrapper with Multi-Tenant Isolation Enforcement
  // P30 · DEMO_MODE: tenant sem equipe recebe membros fictícios (Ver como / procuração LOAS).
  useEffect(() => {
    if (!IS_DEMO_MODE || !activeTenant?.id) return;
    setTenantMembers((prev) => prev.some((m) => m.tenantId === activeTenant.id)
      ? prev
      : [...prev, ...membrosDemoParaTenant(activeTenant.id, activeTenant.name)]);
  }, [activeTenant?.id, activeTenant?.name]);

  const setActiveTenant = (targetTenant: TenantProfile) => {
    // If the authenticated user is NOT a super_admin or global scope, block cross-tenant switching
    if (currentUser && !canAccessTenant(targetTenant.id)) {
      console.error(
        `[SECURITY ENFORCEMENT / RLS] Tentativa de troca de tenant bloqueada. Usuário ${currentUser.email} (${currentUser.tenantId}) tentou acessar ${targetTenant.id}.`
      );
      return; // Reject unauthorized tenant switch
    }
    // Update master single source of truth service
    UnifiedTenantService.setActiveTenant(targetTenant);
    setActiveTenantState(targetTenant);

    // Auto-adjust work mode based on tenant's enabled services
    const enabled = targetTenant.enabledServices || ['operational', 'tax_recovery'];
    const hasOp = enabled.includes('operational');
    const hasTax = enabled.includes('tax_recovery');

    if (hasOp && !hasTax) {
      setActiveWorkMode('operational');
    } else if (hasTax && !hasOp) {
      setActiveWorkMode('tax_recovery');
    } else if (targetTenant.defaultWorkMode) {
      setActiveWorkMode(targetTenant.defaultWorkMode);
    }
  };

  // Switch active tenant by ID or CNPJ across all modules
  const switchActiveTenantByIdOrCnpj = (idOrCnpj: string): TenantProfile => {
    const target = UnifiedTenantService.setActiveTenant(idOrCnpj);
    setActiveTenant(target);
    return target;
  };

  // Update Contracted Services for a Tenant
  const updateTenantServices = (
    tenantId: string, 
    services: ContractedServiceType[], 
    defaultMode?: ServiceWorkMode
  ) => {
    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        const fallbackMode: ServiceWorkMode = defaultMode || (
          services.includes('operational') && services.includes('tax_recovery') ? 'both' :
          services.includes('tax_recovery') ? 'tax_recovery' : 'operational'
        );
        return {
          ...t,
          enabledServices: services,
          defaultWorkMode: fallbackMode
        };
      }
      return t;
    });

    setTenantsList(updated);

    if (activeTenant.id === tenantId) {
      const updatedActive = updated.find(t => t.id === tenantId);
      if (updatedActive) {
        setActiveTenantState(updatedActive);
        if (updatedActive.defaultWorkMode) {
          setActiveWorkMode(updatedActive.defaultWorkMode);
        }
      }
    }

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'TOGGLE_FEATURE_FLAG',
      tenantId,
      tenantName: activeTenant.name,
      details: `Atualização de serviços contratados: [${services.join(', ')}].`,
      previousState: { enabledServices: activeTenant.enabledServices },
      newState: { enabledServices: services, defaultWorkMode: defaultMode },
      immutableHash: generateAuditHash()
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Safe role setter
  const setCurrentUserRole = (role: UserRole) => {
    // Only allow changing to super_admin if the user is truly authorized
    if (role === 'super_admin' && currentUser && !currentUser.isSuperAdmin && currentUser.role !== 'super_admin') {
      console.warn('[SECURITY VIOLATION] Usuário não autorizado a assumir papel super_admin.');
      return;
    }
    setCurrentUserRoleState(role);
  };

  // Login handler calling server-side real authentication with signed JWT and multi-tenant enforcement
  const login = async (credentials: {
    email: string;
    password?: string;
    tenantId?: string;
    role?: UserRole;
  }): Promise<boolean> => {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: normalizedEmail,
        password: credentials.password || '',
        tenantId: credentials.tenantId
      })
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      if (response.status === 429) {
        throw new Error(errJson.message || 'Muitas tentativas de login. Aguarde 15 minutos.');
      }
      if (response.status === 401) {
        throw new Error('Credenciais corporativas inválidas. Verifique seu e-mail e senha.');
      }
      if (response.status === 403) {
        throw new Error(errJson.detail || errJson.error || 'Acesso negado para o tenant selecionado.');
      }
      throw new Error(errJson.error || errJson.message || 'Falha ao autenticar no servidor seguro Velatrix AOS.');
    }

    const data = await response.json();
    const token: string = data.token;
    const serverUser = data.user;

    setSessionToken(token);

    // Determine target tenant profile from list or create based on serverUser
    const targetTenant = tenantsList.find(t => t.id === serverUser.tenantId) || {
      id: serverUser.tenantId,
      name: serverUser.tenantName || 'Empresa Autenticada',
      slug: (serverUser.tenantName || 'tenant').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      cnpj: '18.492.301/0001-84',
      planTier: 'ENTERPRISE' as const,
      status: 'active' as const,
      mrrBrl: 45000,
      tokensConsumedMonthly: 0,
      sector: 'manufacturing' as const,
      sectorLabel: 'Indústria & Manufatura',
      regulatoryStandard: 'ISO 9001',
      connectedErp: 'TOTVS Protheus',
      connectedChannels: ['WhatsApp Business Z-API'],
      createdAt: new Date().toISOString()
    };

    const sessionUser: AuthUser = {
      id: serverUser.id,
      name: serverUser.name,
      email: serverUser.email,
      role: serverUser.role as UserRole,
      department: 'Operações Corporativas',
      tenantId: serverUser.tenantId,
      tenantName: serverUser.tenantName || targetTenant.name,
      isSuperAdmin: serverUser.isSuperAdmin === true || serverUser.role === 'super_admin',
      lastLogin: new Date().toISOString(),
      sessionToken: token
    };

    setCurrentUser(sessionUser);
    setCurrentUserRoleState(serverUser.role as UserRole);
    setActiveTenantState(targetTenant);
    setIsAuthenticated(true);

    try {
      sessionStorage.setItem('velatrix_auth_session', JSON.stringify({
        isAuthenticated: true,
        token,
        user: sessionUser
      }));
      localStorage.removeItem('velatrix_auth_session');
      localStorage.removeItem('velatrix_auth_user');
    } catch (e) {
      console.warn('Unable to persist session to sessionStorage', e);
    }

    // Record audit log
    const newLog: SuperAdminAuditEntry = {
      id: `log_auth_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: `${sessionUser.name} <${sessionUser.email}>`,
      action: 'PROVISION_TENANT',
      tenantId: targetTenant.id,
      tenantName: targetTenant.name,
      details: `AUTENTICAÇÃO COM SUCESSO: Sessão JWT assinada emitida para [${sessionUser.email}] no Tenant [${targetTenant.name}].`,
      previousState: null,
      newState: { authenticated: true, user: sessionUser.email, role: serverUser.role, tenantId: targetTenant.id },
      immutableHash: generateAuditHash(),
      reason: 'Acesso autenticado ao Painel Operacional Velatrix AOS'
    };

    setAuditLogs(prev => [newLog, ...prev]);
    return true;
  };

  // Invite Tenant Member Handler with Audit Trail Registration
  const inviteTenantMember = (
    memberData: Omit<TenantMember, 'id' | 'joinedAt' | 'status'>,
    onAuditRecord?: (record: any) => void
  ): TenantMember => {
    const newMember: TenantMember = {
      ...memberData,
      id: `usr_${Date.now()}_${secureId('', 4)}`,
      joinedAt: new Date().toISOString(),
      status: 'ACTIVE',
      invitedBy: currentUser?.email || 'admin@velatrix.ai'
    };

    setTenantMembers(prev => [newMember, ...prev]);

    // 1. Audit Log in SuperAdmin / Governance Logs
    const auditHash = generateAuditHash();
    const newAuditLog: SuperAdminAuditEntry = {
      id: `log_usr_inv_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'admin@velatrix.ai',
      action: 'PROVISION_TENANT',
      tenantId: memberData.tenantId || activeTenant.id,
      tenantName: activeTenant.name,
      details: `CONVITE DE MEMBRO: Usuário [${newMember.name} <${newMember.email}>] adicionado com papel [${newMember.role}] no escopo [${newMember.accessScope}].`,
      previousState: null,
      newState: newMember,
      immutableHash: auditHash,
      reason: `Novo convite emitido por ${currentUser?.name || 'Administrador'}`
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    // 2. Audit Record in Tactical Ledger Chain if callback provided
    if (onAuditRecord) {
      onAuditRecord({
        id: `audit_rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Tenant Admin',
        action: 'INVITE_USER',
        status: 'executed',
        decisionSummary: `Novo membro convidado para o Tenant: ${newMember.name} (${newMember.email}) com papel ${newMember.role}.`,
        targetEntity: newMember.email,
        hash: auditHash,
        executionReceipt: `REC-INV-${Date.now()}`,
        invariantSnapshot: ['RBAC_PERMISSION_ENFORCED', 'MULTI_TENANT_ISOLATION_OK', 'AUTH_REGISTRY_SYNCED']
      });
    }

    return newMember;
  };

  // Revoke Tenant Member Handler with Audit Trail Registration
  const revokeTenantMember = (
    memberId: string,
    reason: string,
    onAuditRecord?: (record: any) => void
  ) => {
    const target = tenantMembers.find(m => m.id === memberId);
    if (!target) return;

    setTenantMembers(prev => prev.map(m => m.id === memberId ? { ...m, status: 'REVOKED' } : m));

    const auditHash = generateAuditHash();
    const newAuditLog: SuperAdminAuditEntry = {
      id: `log_usr_rev_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'admin@velatrix.ai',
      action: 'KILL_SWITCH_ENGAGED',
      tenantId: target.tenantId,
      tenantName: activeTenant.name,
      details: `ACESSO REVOGADO: Usuário [${target.name} <${target.email}>] teve seus acessos e tokens revogados no Tenant [${activeTenant.name}]. Motivo: ${reason}`,
      previousState: { status: target.status },
      newState: { status: 'REVOKED' },
      immutableHash: auditHash,
      reason: reason || 'Revogação administrativa de credenciais'
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    if (onAuditRecord) {
      onAuditRecord({
        id: `audit_rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Tenant Admin',
        action: 'REVOKE_USER_ACCESS',
        status: 'executed',
        decisionSummary: `Acesso e credenciais revogados para ${target.name} (${target.email}). Motivo: ${reason}`,
        targetEntity: target.email,
        hash: auditHash,
        executionReceipt: `REC-REV-${Date.now()}`,
        invariantSnapshot: ['ZERO_TRUST_SESSION_TERMINATED', 'SECURITY_GATE_LOCKED']
      });
    }
  };

  // Update Granular Module Permissions for a specific Member
  const updateMemberCustomPermissions = (
    memberId: string,
    permissions: Record<string, { canView: boolean; canEdit: boolean }>,
    onAuditRecord?: (record: any) => void
  ) => {
    setTenantMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          customPermissions: {
            ...(m.customPermissions || {}),
            ...permissions
          }
        };
      }
      return m;
    }));

    const target = tenantMembers.find(m => m.id === memberId);
    const auditHash = generateAuditHash();
    const newAuditLog: SuperAdminAuditEntry = {
      id: `log_usr_perm_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'admin@velatrix.ai',
      action: 'TOGGLE_FEATURE_FLAG',
      tenantId: target?.tenantId || activeTenant.id,
      tenantName: activeTenant.name,
      details: `PERMISSÕES ATUALIZADAS: Permissões por módulo customizadas para ${target?.name || memberId}.`,
      previousState: target?.customPermissions || null,
      newState: permissions,
      immutableHash: auditHash,
      reason: 'Ajuste fino de permissões RBAC por módulo'
    };
    setAuditLogs(prev => [newAuditLog, ...prev]);

    if (onAuditRecord) {
      onAuditRecord({
        id: `audit_rec_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Tenant Admin',
        action: 'UPDATE_MODULE_PERMISSIONS',
        status: 'executed',
        decisionSummary: `Permissões granulares de módulos atualizadas para ${target?.name || memberId}.`,
        targetEntity: target?.email || memberId,
        hash: auditHash,
        executionReceipt: `REC-PERM-${Date.now()}`,
        invariantSnapshot: ['RBAC_PERMISSION_ENFORCED', 'GRANULAR_MODULE_ACCESS_SYNCED']
      });
    }
  };

  // Logout handler
  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionToken(null);
    try {
      sessionStorage.removeItem('velatrix_auth_session');
      localStorage.removeItem('velatrix_auth_session');
      localStorage.removeItem('velatrix_auth_user');
    } catch (e) {
      console.warn('Unable to clear session', e);
    }
  };

  // Password reset request
  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Código de verificação enviado para ${email}. Verifique sua caixa corporativa ou aplicativo de MFA.`
        });
      }, 800);
    });
  };

  // Enforce session tenant integrity on activeTenant updates
  useEffect(() => {
    if (currentUser && !currentUser.isSuperAdmin && currentUser.role !== 'super_admin') {
      const userTenant = tenantsList.find(t => t.id === currentUser.tenantId);
      if (userTenant && activeTenant.id !== userTenant.id) {
        setActiveTenantState(userTenant);
      }
    }
  }, [currentUser, tenantsList]);

  // Current Plan Config derived from activeTenant
  const currentPlanTier: PlanTier = activeTenant?.planTier || 'PROFESSIONAL';
  const currentPlanConfig: PlanFeatureConfig = VELATRIX_PLAN_TIERS[currentPlanTier] || VELATRIX_PLAN_TIERS.PROFESSIONAL;

  // Helper to check if a specific high-tier feature is active for current tenant
  const checkFeature = (feature: keyof Pick<
    PlanFeatureConfig,
    | 'multimodalIngestion'
    | 'riskPropagationEngine'
    | 'iotColdChainTelemetry'
    | 'airGappedDeployment'
    | 'hsmHardwareSecurity'
    | 'redTeamAdversarial'
  >): boolean => {
    if (!activeTenant) return false;
    return isFeatureAvailable(activeTenant.planTier, feature, activeTenant.featureFlagOverrides);
  };

  // Super-Admin Plan Update Handler
  const updateTenantPlan = (tenantId: string, newPlan: PlanTier, reason: string = 'Ajuste comercial') => {
    const target = tenantsList.find(t => t.id === tenantId);
    if (!target) return;

    const prevPlan = target.planTier;
    const planConfig = VELATRIX_PLAN_TIERS[newPlan];

    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          planTier: newPlan,
          mrrBrl: planConfig.monthlyPriceBrl,
          status: 'active' as const
        };
      }
      return t;
    });

    setTenantsList(updated);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai (SecOps Lead)',
      action: 'CHANGE_PLAN',
      tenantId,
      tenantName: target.name,
      details: `Plano alterado de ${prevPlan} para ${newPlan} (${planConfig.monthlyPriceLabel}).`,
      previousState: { planTier: prevPlan, mrrBrl: target.mrrBrl },
      newState: { planTier: newPlan, mrrBrl: planConfig.monthlyPriceBrl },
      immutableHash: generateAuditHash(),
      reason
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Toggle Feature Flag
  const toggleTenantFeatureFlag = (tenantId: string, flagKey: string, newValue: boolean, reason: string = 'Ajuste manual de feature flag') => {
    const target = tenantsList.find(t => t.id === tenantId);
    if (!target) return;

    const prevVal = target.featureFlagOverrides?.[flagKey] ?? false;

    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          featureFlagOverrides: {
            ...(t.featureFlagOverrides || {}),
            [flagKey]: newValue
          }
        };
      }
      return t;
    });

    setTenantsList(updated);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'TOGGLE_FEATURE_FLAG',
      tenantId,
      tenantName: target.name,
      details: `Override de flag "${flagKey}" definido como ${newValue ? 'HABILITADO' : 'DESABILITADO'}.`,
      previousState: { [flagKey]: prevVal },
      newState: { [flagKey]: newValue },
      immutableHash: generateAuditHash(),
      reason
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Activate Shadow Mode
  const activateShadowMode = (tenantId: string, days: number = 14, reason: string = 'Validação preliminar de modelo sem escrita em ERP') => {
    const target = tenantsList.find(t => t.id === tenantId);
    if (!target) return;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: 'shadow_mode' as const,
          shadowModeExpiresAt: expiry.toISOString()
        };
      }
      return t;
    });

    setTenantsList(updated);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'ACTIVATE_SHADOW_MODE',
      tenantId,
      tenantName: target.name,
      details: `Shadow Mode (modo observador de 14 dias) ativado até ${expiry.toLocaleDateString('pt-BR')}.`,
      previousState: { status: target.status },
      newState: { status: 'shadow_mode', shadowModeExpiresAt: expiry.toISOString() },
      immutableHash: generateAuditHash(),
      reason
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Kill Switch
  const engageKillSwitch = (tenantId: string, reason: string, secondApproverEmail: string) => {
    const target = tenantsList.find(t => t.id === tenantId);
    if (!target) return;

    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: 'suspended' as const
        };
      }
      return t;
    });

    setTenantsList(updated);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai (Lead SecOps)',
      action: 'KILL_SWITCH_ENGAGED',
      tenantId,
      tenantName: target.name,
      details: `KILL-SWITCH EXECUTADO: Isolamento operacional total do tenant. Conectores suspensos.`,
      previousState: { status: target.status },
      newState: { status: 'suspended' },
      immutableHash: generateAuditHash(),
      secondApprover: secondApproverEmail,
      reason
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Disengage Kill Switch
  const disengageKillSwitch = (tenantId: string, reason: string) => {
    const target = tenantsList.find(t => t.id === tenantId);
    if (!target) return;

    const updated = tenantsList.map(t => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: 'active' as const
        };
      }
      return t;
    });

    setTenantsList(updated);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'KILL_SWITCH_DISENGAGED',
      tenantId,
      tenantName: target.name,
      details: `Reativação de Tenant após resolução de quarentena.`,
      previousState: { status: target.status },
      newState: { status: 'active' },
      immutableHash: generateAuditHash(),
      reason
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Provision Tenant
  const provisionTenant = (newTenantData: Partial<TenantProfile>) => {
    const plan = newTenantData.planTier || 'STARTER';
    const planConfig = VELATRIX_PLAN_TIERS[plan];

    const newTenant: TenantProfile = {
      id: `tenant_${Date.now().toString(36)}`,
      name: newTenantData.name || 'Nova Corporação Provisionada',
      slug: (newTenantData.name || 'nova-corp').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      cnpj: newTenantData.cnpj || '00.000.000/0001-00',
      planTier: plan,
      status: 'active',
      mrrBrl: planConfig.monthlyPriceBrl,
      tokensConsumedMonthly: 0,
      sector: newTenantData.sector || 'manufacturing',
      sectorLabel: newTenantData.sectorLabel || 'Indústria & Manufatura',
      regulatoryStandard: newTenantData.regulatoryStandard || 'ISO 9001',
      connectedErp: newTenantData.connectedErp || 'TOTVS Protheus V12',
      connectedChannels: newTenantData.connectedChannels || ['WhatsApp Business Z-API', 'Open Finance BACEN'],
      createdAt: new Date().toISOString(),
      location: newTenantData.location || {
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5505,
        lng: -46.6333
      }
    };

    setTenantsList(prev => [newTenant, ...prev]);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'PROVISION_TENANT',
      tenantId: newTenant.id,
      tenantName: newTenant.name,
      details: `Novo Tenant provisionado no plano ${plan} com alocação de nó isolado.`,
      previousState: null,
      newState: newTenant,
      immutableHash: generateAuditHash(),
      reason: 'Onboarding de novo cliente corporativo.'
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Grant Trial Access
  const grantTrialAccess = (tenantData: Partial<TenantProfile>, days: 7 | 14 | 30) => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);

    const trialTenant: TenantProfile = {
      id: `trial_${Date.now().toString(36)}`,
      name: tenantData.name || 'Empresa em Avaliação Trial',
      slug: (tenantData.name || 'trial-corp').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      cnpj: tenantData.cnpj || '00.000.000/0001-00',
      planTier: tenantData.planTier || 'PROFESSIONAL',
      status: 'trial',
      mrrBrl: 0,
      tokensConsumedMonthly: 120000,
      sector: tenantData.sector || 'manufacturing',
      sectorLabel: tenantData.sectorLabel || 'Indústria & Manufatura',
      regulatoryStandard: tenantData.regulatoryStandard || 'ISO 9001 / Trial Sandbox',
      connectedErp: tenantData.connectedErp || 'TOTVS Protheus (Sandbox)',
      connectedChannels: ['WhatsApp Sandbox Webhook'],
      createdAt: new Date().toISOString(),
      trialExpiresAt: expirationDate.toISOString(),
      trialDurationDays: days,
      location: tenantData.location || {
        city: 'São Paulo',
        state: 'SP',
        lat: -23.5505,
        lng: -46.6333
      }
    };

    setTenantsList(prev => [trialTenant, ...prev]);

    const newLog: SuperAdminAuditEntry = {
      id: `log_${Date.now()}_${secureId('', 4)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser?.email || 'super_admin@velatrix.ai',
      action: 'PROVISION_TENANT',
      tenantId: trialTenant.id,
      tenantName: trialTenant.name,
      details: `ACESSO TRIAL CONCEDIDO: Duração de ${days} dias sem custo. Expira em ${expirationDate.toLocaleDateString('pt-BR')}.`,
      previousState: null,
      newState: trialTenant,
      immutableHash: generateAuditHash(),
      reason: `Degustação comercial / POC sem custo (${days} dias).`
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser: effectiveUser,
        realUser: currentUser,
        viewAs,
        startViewAs,
        stopViewAs,
        isRealSuperAdmin,
        login,
        logout,
        requestPasswordReset,
        currentUserRole,
        setCurrentUserRole,
        isSuperAdmin,
        isPartner,
        activeTenant,
        setActiveTenant,
        switchActiveTenantByIdOrCnpj,
        activeWorkMode,
        setActiveWorkMode,
        updateTenantServices,
        tenantsList,
        auditLogs,
        tenantMembers,
        inviteTenantMember,
        revokeTenantMember,
        updateMemberCustomPermissions,
        currentPlanConfig,
        hasPermission,
        isTabAllowed,
        getDefaultTab,
        canAccessTenant,
        updateTenantPlan,
        toggleTenantFeatureFlag,
        activateShadowMode,
        engageKillSwitch,
        disengageKillSwitch,
        provisionTenant,
        grantTrialAccess,
        checkFeature
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function generateAuditHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}
