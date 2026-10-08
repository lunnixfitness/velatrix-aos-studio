import { NavigationTab, UserRole } from './aos';

/**
 * Velatrix AOS Role-Based Access Control (RBAC) & Row-Level Security (RLS)
 * 
 * Diferença fundamental de escopo entre perfis de gestão/operação:
 * - tenant_admin: Acesso administrativo e operacional total a TODOS os dados, configurações,
 *   auditorias, conectores e membros do PRÓPRIO tenant (a empresa/indústria cliente final).
 * - parceiro_operacional: Acesso operacional aos módulos de trabalho e execução de serviços
 *   (diagnóstico express, recuperação fiscal, laboratório de teses, detecção déjà-vu, etc.),
 *   porém ESTRITAMENTE restrito aos CNPJs e clientes vinculados à sua própria carteira
 *   (accessScope: 'PARTNER_PORTFOLIO_ONLY'). Não possui acesso à governança interna do tenant,
 *   conectores ERP globais ou dados de outros clientes/tenants que não estejam sob sua responsabilidade.
 */

export type RbacRole = 
  | 'super_admin'        // Dono / Velatrix Global SecOps (Acesso irrestrito total a todos os tenants)
  | 'tenant_admin'       // Administrador / Gestor do Tenant (Acesso total às operações do seu Tenant via RLS)
  | 'c_level_approver'   // CEO / Diretoria C-Level do Tenant
  | 'cfo_executive'      // CFO / Diretoria Financeira do Tenant
  | 'operator'           // Operador / Analista Operacional do Tenant
  | 'parceiro_operacional' // Parceiro Operacional / Advogado / Contador (Acesso operacional restrito aos CNPJs da sua carteira: PARTNER_PORTFOLIO_ONLY)
  | 'parceiro_tributario'// Alias retrocompatível com parceiro_operacional (mantido para registros já existentes)
  | 'office_staff';      // Staff interno do Escritório Velatrix

export type RbacPermission =
  | 'GLOBAL_MULTI_TENANT_ACCESS'     // Visualizar e gerenciar todos os tenants da infraestrutura
  | 'MANAGE_TENANT_PLANS'            // Alterar planos, shadow mode e billing mestre
  | 'MANAGE_SYSTEM_SECURITY'         // Kill-switch global, chaves HSM e logs do super-admin
  | 'VIEW_TENANT_OPERATIONS'         // Visualizar dashboard operacional, telemetria, oráculo e construtor do tenant
  | 'EXECUTE_TAX_RECOVERY'           // Executar e retificar auditoria SPED, PGFN e NCMs do próprio tenant
  | 'EXPORT_LEGAL_DOSSIER'           // Exportar peças e relatórios periciais do tenant
  | 'MANAGE_TENANT_USERS'            // Convidar, alterar papel e revogar acessos de membros do tenant
  | 'ACCESS_PARTNER_PORTAL'          // Visualizar carteira de clientes indicados e comissões de split
  | 'MANAGE_PARTNER_PIX_SPLIT'       // Cadastrar chave PIX de recebimento e simular liquidação de split
  | 'VIEW_PARTNER_CLIENT_SENSITIVE'  // Acesso restrito a dados fiscais brutos (apenas se autorizado pelo tenant)
  | 'PARTNER_PORTFOLIO_ONLY'         // Restrição de escopo: acesso operacional restrito exclusivamente aos clientes da própria carteira
  | 'EXECUTE_PARTNER_OPERATIONS'     // Executar operações fiscais e diagnósticos para clientes da sua carteira
  | 'VIEW_LEGAL_TAX'                 // Visualizar defesas fiscais, teses e peças
  | 'EDIT_LEGAL_TAX'                 // Redigir, protocolar e assinar defesas fiscais
  | 'VIEW_ACCOUNTING_DRE'            // Visualizar DRE Waterfall, SPED e margens
  | 'EDIT_ACCOUNTING_DRE'            // Ajustar DRE, conciliação e retificações contábeis
  | 'VIEW_EXPERT_AUDIT'              // Visualizar laudos e memórias de cálculo periciais
  | 'EDIT_EXPERT_AUDIT'              // Emitir pareceres periciais, quesitos e assinar laudos
  | 'VIEW_INSS_OBRAS'                // Visualizar obras CNO e retenções de 11%/3,5%
  | 'EDIT_INSS_OBRAS';               // Cadastrar CNO, calcular deduções e gerar relatórios SERO

export interface TenantMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  professionalRole?: 'advogado_tributarista' | 'contador_fiscal' | 'perito_judicial' | 'tenant_admin' | string;
  professionalRegistry?: string; // OAB/SP 412.890, CRC/SP 2SP194820/O-4, CNPC 4.812
  department: string;
  accessScope: 'ALL' | 'LOGISTICS' | 'FINANCIAL' | 'LEGAL_ONLY' | 'PARTNER_PORTFOLIO_ONLY';
  status: 'ACTIVE' | 'PENDING' | 'REVOKED';
  joinedAt: string;
  invitedBy?: string;
  tenantId: string;
  avatar?: string;
  customModulePermissions?: Record<string, { canView: boolean; canEdit: boolean }>;
  customPermissions?: Record<string, { canView: boolean; canEdit: boolean }>;
}

export interface RoleDefinition {
  role: UserRole;
  label: string;
  description: string;
  badgeColor: string;
  permissions: RbacPermission[];
  allowedTabs: NavigationTab[];
  defaultTab: NavigationTab;
  isGlobalScope: boolean; // true = vê todos os tenants; false = restrito ao tenantId do usuário (RLS)
  accessScope?: 'ALL' | 'LOGISTICS' | 'FINANCIAL' | 'LEGAL_ONLY' | 'PARTNER_PORTFOLIO_ONLY';
}

export const RBAC_ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super-Admin Velatrix (Dono)',
    description: 'Acesso global e irrestrito a todos os clusters, tenants, governança, billing e inteligência.',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
    permissions: [
      'GLOBAL_MULTI_TENANT_ACCESS',
      'MANAGE_TENANT_PLANS',
      'MANAGE_SYSTEM_SECURITY',
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'MANAGE_TENANT_USERS',
      'ACCESS_PARTNER_PORTAL',
      'MANAGE_PARTNER_PIX_SPLIT',
      'VIEW_PARTNER_CLIENT_SENSITIVE'
    ],
    allowedTabs: [
      'legacy_dashboard',
      'admin_analytics',
      'ent_hub', 'ent_connect', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_zdr', 'ent_hitl', 'ent_verify_seal', 'ent_conflict', 'ent_packages',
      'operational_dashboard',
      'dre_waterfall',
      'autonomous_swarm_brain',
      'super_admin',
      'velatrix_office',
      'partner_portal',
      'legal_tax_recovery',
      'counterfactual_oracle',
      'construct_lab',
      'deja_vu_detection',
      'gps_telemetry',
      'graph_health_workspace',
      'risk_engine_diagnosis',
      'express_diagnosis',
      'roadmap_rollout_hub',
      'audit_ledger_view',
      'erp_connector_config',
      'vector_knowledge_store',
      'architecture_engineering',
      'governance_settings',
      'onboarding_wizard',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'motor_pericial',
      'oraculo_liquidez',
      'contract_lab',
      'pericia',
      'inss',
      'precatoria',
      'escudo_edge',
      'split_api',
      'webhooks',
      'ast_json',
      'llm_engine',
      'observability',
      'neural_core',
      'leitura_autos',
      'api_keys_config'
    ],
    defaultTab: 'operational_dashboard',
    isGlobalScope: true
  },

  tenant_admin: {
    role: 'tenant_admin',
    label: 'Gestor do Tenant (Tenant Manager)',
    description: 'Acesso completo e exclusivo aos dados operacionais, fiscais e auditorias da própria empresa.',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'MANAGE_TENANT_USERS'
    ],
    allowedTabs: [
      'ent_hub', 'ent_connect', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_zdr', 'ent_hitl', 'ent_verify_seal', 'ent_conflict', 'ent_packages',
      'operational_dashboard',
      'dre_waterfall',
      'autonomous_swarm_brain',
      'legal_tax_recovery',
      'construct_lab',
      'deja_vu_detection',
      'graph_health_workspace',
      'risk_engine_diagnosis',
      'express_diagnosis',
      'roadmap_rollout_hub',
      'audit_ledger_view',
      'erp_connector_config',
      'vector_knowledge_store',
      'architecture_engineering',
      'governance_settings',
      'onboarding_wizard',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'motor_pericial',
      'contract_lab',
      'pericia',
      'inss',
      'precatoria',
      'escudo_edge',
      'split_api',
      'webhooks',
      'ast_json',
      'llm_engine',
      'observability',
      'neural_core',
      'partner_portal',
      'leitura_autos',
      'api_keys_config'
    ],
    defaultTab: 'operational_dashboard',
    isGlobalScope: false
  },

  c_level_approver: {
    role: 'c_level_approver',
    label: 'CEO / Diretoria Executiva',
    description: 'Autorização e governança multi-sig de despachos táticos e visualização de caixa no tenant.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER'
    ],
    allowedTabs: [
      'ent_hub', 'ent_connect', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_zdr', 'ent_hitl', 'ent_verify_seal', 'ent_conflict', 'ent_packages',
      'operational_dashboard',
      'dre_waterfall',
      'autonomous_swarm_brain',
      'legal_tax_recovery',
      'construct_lab',
      'deja_vu_detection',
      'graph_health_workspace',
      'risk_engine_diagnosis',
      'express_diagnosis',
      'roadmap_rollout_hub',
      'audit_ledger_view',
      'architecture_engineering',
      'motor_pericial',
      'contract_lab',
      'pericia',
      'precatoria',
      'escudo_edge',
      'ast_json',
      'llm_engine',
      'observability',
      'neural_core',
      'partner_portal',
      'leitura_autos',
      'api_keys_config'
    ],
    defaultTab: 'operational_dashboard',
    isGlobalScope: false
  },

  cfo_executive: {
    role: 'cfo_executive',
    label: 'CFO / Diretoria Financeira & Fiscal',
    description: 'Gestão de tesouraria, fluxo de caixa, recuperação fiscal PGFN e auditoria do tenant.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'ACCESS_PARTNER_PORTAL',
      'MANAGE_PARTNER_PIX_SPLIT'
    ],
    allowedTabs: [
      'ent_hub', 'ent_risk_shield', 'ent_jurimetria', 'ent_hitl', 'ent_verify_seal',
      'operational_dashboard',
      'dre_waterfall',
      'autonomous_swarm_brain',
      'legal_tax_recovery',
      'partner_portal',
      'construct_lab',
      'deja_vu_detection',
      'graph_health_workspace',
      'risk_engine_diagnosis',
      'express_diagnosis',
      'roadmap_rollout_hub',
      'audit_ledger_view',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'motor_pericial',
      'oraculo_liquidez',
      'contract_lab',
      'pericia',
      'precatoria',
      'escudo_edge',
      'split_api',
      'llm_engine',
      'observability',
      'neural_core'
    ],
    defaultTab: 'legal_tax_recovery',
    isGlobalScope: false
  },

  operator: {
    role: 'operator',
    label: 'Operador / Analista de Operações',
    description: 'Monitoramento diário de eventos, telemetria logística e saúde do grafo do tenant.',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS'
    ],
    allowedTabs: [
      'ent_hub', 'ent_hitl', 'ent_verify_seal', 'ent_conflict',
      'operational_dashboard',
      'dre_waterfall',
      'autonomous_swarm_brain',
      'graph_health_workspace',
      'risk_engine_diagnosis',
      'roadmap_rollout_hub',
      'audit_ledger_view',
      'central_laudos',
      'novo_laudo',
      'llm_engine',
      'observability',
      'neural_core',
      'leitura_autos'
    ],
    defaultTab: 'operational_dashboard',
    isGlobalScope: false
  },

  parceiro_operacional: {
    role: 'parceiro_operacional',
    label: 'Parceiro Operacional (Advogado / Contador)',
    description: 'Acesso operacional aos módulos fiscais e de diagnóstico, estritamente restrito aos CNPJs da sua carteira vinculada (PARTNER_PORTFOLIO_ONLY).',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: [
      'ACCESS_PARTNER_PORTAL',
      'MANAGE_PARTNER_PIX_SPLIT',
      'VIEW_PARTNER_CLIENT_SENSITIVE',
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'PARTNER_PORTFOLIO_ONLY',
      'EXECUTE_PARTNER_OPERATIONS'
    ],
    allowedTabs: [
      'ent_hub', 'ent_verify_seal',
      'express_diagnosis',
      'partner_portal',
      'legal_tax_recovery',
      'construct_lab',
      'deja_vu_detection',
      'audit_ledger_view',
      'roadmap_rollout_hub',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'motor_pericial',
      'contract_lab',
      'pericia',
      'precatoria',
      'escudo_edge',
      'split_api',
      'observability',
      'leitura_autos'
    ],
    defaultTab: 'express_diagnosis',
    isGlobalScope: false,
    accessScope: 'PARTNER_PORTFOLIO_ONLY'
  },

  parceiro_tributario: {
    role: 'parceiro_tributario',
    label: 'Parceiro Tributário / Operacional (Legado)',
    description: 'Compatibilidade com registros existentes: acesso operacional aos clientes de sua carteira (PARTNER_PORTFOLIO_ONLY).',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: [
      'ACCESS_PARTNER_PORTAL',
      'MANAGE_PARTNER_PIX_SPLIT',
      'VIEW_PARTNER_CLIENT_SENSITIVE',
      'VIEW_TENANT_OPERATIONS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'PARTNER_PORTFOLIO_ONLY',
      'EXECUTE_PARTNER_OPERATIONS'
    ],
    allowedTabs: [
      'ent_hub', 'ent_verify_seal', 'ent_jurimetria',
      'express_diagnosis',
      'partner_portal',
      'legal_tax_recovery',
      'construct_lab',
      'deja_vu_detection',
      'audit_ledger_view',
      'roadmap_rollout_hub',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'motor_pericial',
      'contract_lab',
      'pericia',
      'precatoria',
      'escudo_edge',
      'split_api',
      'observability',
      'leitura_autos'
    ],
    defaultTab: 'express_diagnosis',
    isGlobalScope: false,
    accessScope: 'PARTNER_PORTFOLIO_ONLY'
  },

  office_staff: {
    role: 'office_staff',
    label: 'Staff Velatrix Office',
    description: 'Gestão interna de suporte, esteira de clientes e operações internas Velatrix.',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'ACCESS_PARTNER_PORTAL'
    ],
    allowedTabs: [
      'ent_hub', 'ent_verify_seal', 'ent_conflict',
      'velatrix_office',
      'partner_portal',
      'operational_dashboard',
      'central_laudos',
      'esteiras_laudos_hub',
      'novo_laudo',
      'pericia',
      'precatoria',
      'split_api',
      'llm_engine',
      'leitura_autos'
    ],
    defaultTab: 'velatrix_office',
    isGlobalScope: true
  },

  advogado_tributarista: {
    role: 'advogado_tributarista',
    label: 'Advogado Tributarista',
    description: 'Gestão jurídica, peças processuais, teses tributárias, PGFN, defesas administrativas e contratos de êxito.',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'VIEW_LEGAL_TAX',
      'EDIT_LEGAL_TAX',
      'VIEW_EXPERT_AUDIT',
      'VIEW_ACCOUNTING_DRE',
      'VIEW_INSS_OBRAS',
      'EDIT_INSS_OBRAS',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER',
      'ACCESS_PARTNER_PORTAL'
    ],
    allowedTabs: [
      'ent_hub', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_hitl', 'ent_verify_seal', 'ent_conflict',
      'legal_tax_recovery',
      'inss_obras',
      'express_diagnosis',
      'partner_portal',
      'dre_waterfall',
      'audit_ledger_view',
      'construct_lab',
      'deja_vu_detection',
      'novo_laudo',
      'motor_pericial',
      'contract_lab',
      'pericia',
      'inss',
      'precatoria',
      'escudo_edge',
      'split_api',
      'observability',
      'leitura_autos'
    ],
    defaultTab: 'legal_tax_recovery',
    isGlobalScope: false,
    accessScope: 'LEGAL_ONLY'
  },

  contador_fiscal: {
    role: 'contador_fiscal',
    label: 'Contador / Contábil & Fiscal',
    description: 'Conciliação contábil, DRE Waterfall, cruzamentos SPED/EFD, retenções de INSS-Obras e parametrização fiscal.',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    permissions: [
      'VIEW_TENANT_OPERATIONS',
      'VIEW_ACCOUNTING_DRE',
      'EDIT_ACCOUNTING_DRE',
      'VIEW_INSS_OBRAS',
      'EDIT_INSS_OBRAS',
      'VIEW_LEGAL_TAX',
      'VIEW_EXPERT_AUDIT',
      'EDIT_EXPERT_AUDIT',
      'EXECUTE_TAX_RECOVERY',
      'EXPORT_LEGAL_DOSSIER'
    ],
    allowedTabs: [
      'ent_hub', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_hitl', 'ent_verify_seal', 'ent_conflict',
      'dre_waterfall',
      'inss_obras',
      'express_diagnosis',
      'legal_tax_recovery',
      'audit_ledger_view',
      'operational_dashboard',
      'motor_pericial',
      'inss',
      'observability',
      'llm_engine',
      'partner_portal',
      'leitura_autos'
    ],
    defaultTab: 'dre_waterfall',
    isGlobalScope: false,
    accessScope: 'FINANCIAL'
  },

  perito_judicial: {
    role: 'perito_judicial',
    label: 'Perito Judicial / Contábil',
    description: 'Memórias de cálculo periciais judiciais, índices oficiais (Selic/IPCA-E), quesitos técnicos e laudos periciais.',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    permissions: [
      'VIEW_EXPERT_AUDIT',
      'EDIT_EXPERT_AUDIT',
      'VIEW_INSS_OBRAS',
      'EDIT_INSS_OBRAS',
      'VIEW_LEGAL_TAX',
      'VIEW_ACCOUNTING_DRE',
      'EXPORT_LEGAL_DOSSIER'
    ],
    allowedTabs: [
      'ent_hub', 'ent_guardrail', 'ent_risk_shield', 'ent_jurimetria', 'ent_hitl', 'ent_verify_seal', 'ent_conflict',
      'legal_tax_recovery',
      'inss_obras',
      'express_diagnosis',
      'dre_waterfall',
      'audit_ledger_view',
      'novo_laudo',
      'motor_pericial',
      'pericia',
      'inss',
      'observability',
      'partner_portal',
      'leitura_autos'
    ],
    defaultTab: 'legal_tax_recovery',
    isGlobalScope: false,
    accessScope: 'ALL'
  }
};

export interface SystemModulePermissionMeta {
  id: string;
  name: string;
  description: string;
  category: 'JURIDICO' | 'CONTABIL' | 'PERICIAL' | 'GESTAO';
  tab: NavigationTab;
  defaultPermissionsByRole: Record<string, { canView: boolean; canEdit: boolean }>;
}

export const SYSTEM_MODULES_PERMISSION_METAS: SystemModulePermissionMeta[] = [
  {
    id: 'mod_express_diagnosis',
    name: 'Diagnóstico Integral D+0',
    description: 'Raio-X de risco tributário, ROI e proposta executiva',
    category: 'JURIDICO',
    tab: 'express_diagnosis',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: true },
      contador_fiscal: { canView: true, canEdit: true },
      perito_judicial: { canView: true, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_legal_tax_recovery',
    name: 'Defesa & Recuperação Fiscal',
    description: 'Laboratório de teses, impugnações, PER/DCOMP e PGFN',
    category: 'JURIDICO',
    tab: 'legal_tax_recovery',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: true },
      contador_fiscal: { canView: true, canEdit: true },
      perito_judicial: { canView: true, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_inss_obras',
    name: 'INSS-Obras (CNO/SERO)',
    description: 'Matrículas CNO, retenções 11%/3,5%, deduções e DCTFWeb',
    category: 'PERICIAL',
    tab: 'inss_obras',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: true },
      contador_fiscal: { canView: true, canEdit: true },
      perito_judicial: { canView: true, canEdit: true },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_expert_accountant',
    name: 'Perito Contábil & Laudos',
    description: 'Memórias de cálculo periciais, Selic, IPCA-E e laudos com assinatura',
    category: 'PERICIAL',
    tab: 'legal_tax_recovery',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: false },
      contador_fiscal: { canView: true, canEdit: true },
      perito_judicial: { canView: true, canEdit: true },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_dre_waterfall',
    name: 'Cascata DRE & SPED',
    description: 'Demonstração de resultados contábil e conciliação de margem EBITDA',
    category: 'CONTABIL',
    tab: 'dre_waterfall',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: false },
      contador_fiscal: { canView: true, canEdit: true },
      perito_judicial: { canView: true, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_pgfn_capag',
    name: 'PGFN / Transação Tributária',
    description: 'Rating CAPAG, análise de dívida ativa da União e descontos de edital',
    category: 'JURIDICO',
    tab: 'legal_tax_recovery',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: true },
      contador_fiscal: { canView: true, canEdit: false },
      perito_judicial: { canView: true, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_partner_portal',
    name: 'Portal de Parceiros & Split',
    description: 'Carteira de clientes, deals e divisão de comissões',
    category: 'GESTAO',
    tab: 'partner_portal',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: true, canEdit: true },
      contador_fiscal: { canView: true, canEdit: false },
      perito_judicial: { canView: false, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  },
  {
    id: 'mod_iam_users',
    name: 'Gestão de Usuários & IAM',
    description: 'Administração de acessos, alçadas e membros do tenant',
    category: 'GESTAO',
    tab: 'governance_settings',
    defaultPermissionsByRole: {
      advogado_tributarista: { canView: false, canEdit: false },
      contador_fiscal: { canView: false, canEdit: false },
      perito_judicial: { canView: false, canEdit: false },
      tenant_admin: { canView: true, canEdit: true },
      super_admin: { canView: true, canEdit: true }
    }
  }
];

export function hasMemberModuleAccess(
  member: TenantMember | null | undefined, 
  moduleId: string, 
  action: 'view' | 'edit'
): boolean {
  if (!member) return false;
  // Super admin has full access
  if (member.role === 'super_admin' || member.role === 'tenant_admin') {
    return true;
  }
  // Check custom override if present
  if (member.customModulePermissions && member.customModulePermissions[moduleId]) {
    const perm = member.customModulePermissions[moduleId];
    return action === 'view' ? perm.canView : perm.canEdit;
  }
  // Check default role permissions
  const meta = SYSTEM_MODULES_PERMISSION_METAS.find(m => m.id === moduleId);
  if (!meta) return true;
  const roleKey = member.professionalRole || member.role;
  const roleDefaults = meta.defaultPermissionsByRole[roleKey];
  if (!roleDefaults) return true;
  return action === 'view' ? roleDefaults.canView : roleDefaults.canEdit;
}

/**
 * Validação de permissões RBAC
 */
export function hasRbacPermission(role: UserRole, permission: RbacPermission): boolean {
  const def = RBAC_ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.permissions.includes(permission);
}

/**
 * Validação de rota de tela permitida por perfil
 */
export function isTabAllowedForRole(role: UserRole, tab: NavigationTab): boolean {
  if (tab === 'central_laudos') return true;
  const def = RBAC_ROLE_DEFINITIONS[role];
  if (!def) return false;
  return def.allowedTabs.includes(tab);
}

/**
 * Retorna a aba padrão para onde o usuário deve ser redirecionado caso acesse uma rota restrita
 */
export function getDefaultTabForRole(role: UserRole): NavigationTab {
  const def = RBAC_ROLE_DEFINITIONS[role];
  return def ? def.defaultTab : 'operational_dashboard';
}

/**
 * Row-Level Security (RLS): Valida se o usuário autenticado pode acessar os dados do tenant solicitado
 */
export function validateTenantRlsAccess(userRole: UserRole, userTenantId: string, targetTenantId: string): boolean {
  // SuperAdmin e perfis globais têm acesso irrestrito
  const def = RBAC_ROLE_DEFINITIONS[userRole];
  if (def && def.isGlobalScope) {
    return true;
  }
  // Demais perfis só podem acessar seu próprio tenantId
  return userTenantId === targetTenantId;
}

/**
 * Escopo de Parceiro (RLS por Carteira): Valida se o papel do usuário é restrito exclusivamente
 * aos clientes e CNPJs pertencentes à sua própria carteira vinculada (PARTNER_PORTFOLIO_ONLY).
 */
export function isPartnerPortfolioScope(role: UserRole): boolean {
  const def = RBAC_ROLE_DEFINITIONS[role];
  return def?.accessScope === 'PARTNER_PORTFOLIO_ONLY' || def?.permissions.includes('PARTNER_PORTFOLIO_ONLY') || false;
}

