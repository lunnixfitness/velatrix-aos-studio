import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Search, 
  Filter, 
  Sparkles, 
  UserX, 
  Building2, 
  Mail, 
  FileText,
  Clock,
  ChevronRight,
  Fingerprint,
  ExternalLink,
  Sliders,
  Scale,
  Briefcase,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/aos';
import { TenantMember, RBAC_ROLE_DEFINITIONS } from '../../types/rbac';

const RBAC_MODULES_LIST = [
  { key: 'diag_exec', name: 'Diagnóstico & Proposta D+0', desc: 'Acesso a relatórios periciais de créditos e viabilidade' },
  { key: 'defesa_fiscal', name: 'Defesa & Recuperação Fiscal', desc: 'Dupla defesa, contingenciamento e teses tributárias' },
  { key: 'perito_contabil', name: 'Perícia Contábil & SPED', desc: 'Análise forense de EFD/ECD e cruzamento de livros fiscais' },
  { key: 'pgfn_transacao', name: 'PGFN & Dívida Ativa', desc: 'Simulação de transação tributária e abatimento de juros' },
  { key: 'inss_obras', name: 'INSS-Obras (Construção Civil)', desc: 'Matrículas CNO, retenção 11%/3.5% e conformidade SERO' },
  { key: 'dre_sped', name: 'Cascata DRE & Valuation', desc: 'Modelagem patrimonial e conciliação de margem EBITDA' },
  { key: 'partner_split', name: 'Portal de Parceiros & Split', desc: 'Gestão de carteira de clientes e comissões de honorários' },
  { key: 'iam_users', name: 'Gestão de Usuários & IAM', desc: 'Controle de acessos, emissão e revogação de credenciais' }
];

interface TenantUserManagementPanelProps {
  onAddAuditRecord?: (record: any) => void;
  onNavigateTab?: (tab: any) => void;
}

export const TenantUserManagementPanel: React.FC<TenantUserManagementPanelProps> = ({
  onAddAuditRecord,
  onNavigateTab
}) => {
  const { 
    currentUser, 
    currentUserRole, 
    activeTenant, 
    tenantMembers, 
    inviteTenantMember, 
    revokeTenantMember,
    updateMemberCustomPermissions,
    hasPermission
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [revokingMember, setRevokingMember] = useState<TenantMember | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Granular Permissions Modal State
  const [editingPermissionsMember, setEditingPermissionsMember] = useState<TenantMember | null>(null);
  const [permissionsForm, setPermissionsForm] = useState<Record<string, { canView: boolean; canEdit: boolean }>>({});

  // Invite Form State
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('operator');
  const [inviteProfessionalRole, setInviteProfessionalRole] = useState<string>('');
  const [inviteProfessionalRegistry, setInviteProfessionalRegistry] = useState<string>('');
  const [inviteDepartment, setInviteDepartment] = useState('Operações Táticas');
  const [inviteScope, setInviteScope] = useState<'ALL' | 'FINANCIAL' | 'LOGISTICS' | 'LEGAL_ONLY'>('LOGISTICS');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const canManage = hasPermission('MANAGE_TENANT_USERS');

  // Filter members based on active tenant, search and role filter
  const filteredMembers = tenantMembers.filter(m => {
    // If user is super_admin, they can view all, otherwise only their tenant
    if (currentUserRole !== 'super_admin' && m.tenantId && m.tenantId !== activeTenant.id) {
      return false;
    }
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.professionalRegistry && m.professionalRegistry.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesRole = true;
    if (roleFilter !== 'ALL') {
      if (roleFilter === 'advogado') {
        matchesRole = m.role === 'advogado_tributarista' || m.professionalRole === 'advogado_tributarista';
      } else if (roleFilter === 'contador') {
        matchesRole = m.role === 'contador_fiscal' || m.professionalRole === 'contador_fiscal';
      } else if (roleFilter === 'perito') {
        matchesRole = m.role === 'perito_judicial' || m.professionalRole === 'perito_judicial';
      } else {
        matchesRole = m.role === roleFilter;
      }
    }

    return matchesSearch && matchesRole;
  });

  const handleOpenPermissionsModal = (member: TenantMember) => {
    setEditingPermissionsMember(member);
    // Initialize permissionsForm with existing custom permissions or defaults
    const initial: Record<string, { canView: boolean; canEdit: boolean }> = {};
    RBAC_MODULES_LIST.forEach(mod => {
      const existing = (member.customPermissions as any)?.[mod.key] || (member.customModulePermissions as any)?.[mod.key];
      initial[mod.key] = {
        canView: existing?.canView ?? true,
        canEdit: existing?.canEdit ?? (member.role === 'tenant_admin' || member.role === 'super_admin')
      };
    });
    setPermissionsForm(initial);
  };

  const handleSavePermissions = () => {
    if (!editingPermissionsMember) return;
    updateMemberCustomPermissions(editingPermissionsMember.id, permissionsForm, onAddAuditRecord);
    setActionSuccessMessage(`Permissões do membro ${editingPermissionsMember.name} atualizadas com sucesso.`);
    setEditingPermissionsMember(null);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  // Handle Invite Submission
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);

    if (!inviteName.trim()) {
      setInviteError('Informe o nome completo do colaborador ou parceiro.');
      return;
    }

    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setInviteError('Informe um endereço de e-mail corporativo válido.');
      return;
    }

    // Check if email already exists in members
    if (tenantMembers.some(m => m.email.toLowerCase() === inviteEmail.trim().toLowerCase() && m.status === 'ACTIVE')) {
      setInviteError(`O e-mail "${inviteEmail}" já possui uma credencial ativa neste tenant.`);
      return;
    }

    try {
      inviteTenantMember(
        {
          name: inviteName.trim(),
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          department: inviteDepartment.trim(),
          accessScope: inviteScope,
          tenantId: activeTenant.id,
          professionalRole: (inviteProfessionalRole ? inviteProfessionalRole : undefined) as any,
          professionalRegistry: inviteProfessionalRegistry.trim() || undefined,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`
        },
        onAddAuditRecord
      );

      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteRole('operator');
      setInviteProfessionalRole('');
      setInviteProfessionalRegistry('');
      setInviteDepartment('Operações Táticas');
      setInviteScope('LOGISTICS');
      
      setActionSuccessMessage(`✓ Convite corporativo e credenciais emitidos para ${inviteEmail}. Hash registrado no Ledger.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      setInviteError(err.message || 'Erro ao emitir credencial de usuário.');
    }
  };

  // Handle Revoke Submission
  const handleConfirmRevoke = () => {
    if (!revokingMember) return;
    if (!revokeReason.trim()) {
      alert('Por favor, informe a justificativa de conformidade para a revogação.');
      return;
    }

    revokeTenantMember(revokingMember.id, revokeReason.trim(), onAddAuditRecord);
    setActionSuccessMessage(`⚠️ Credencial de ${revokingMember.email} revogada e sessões canceladas com sucesso.`);
    setRevokingMember(null);
    setRevokeReason('');
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  return (
    <div className="bg-[var(--vx-deep)] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold uppercase">
              RBAC & IAM Security Gate
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Tenant: <span className="text-slate-200 font-bold">{activeTenant.name}</span>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Gestão de Membros & Controle de Acesso (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Provisionamento de credenciais com isolamento estrito de papéis (CFO, Operador, Auditor, Parceiro Tributário) e auditoria de cada emissão/revogação.
          </p>
        </div>

        {canManage && (
          <button
            id="btn-open-invite-user"
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-[0.99] self-start md:self-auto shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Convidar Novo Membro</span>
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou área..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/60 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Filtrar:</span>
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'tenant_admin', label: 'Admin' },
            { id: 'cfo_executive', label: 'CFO' },
            { id: 'advogado', label: 'Advogados (OAB)' },
            { id: 'contador', label: 'Contadores (CRC)' },
            { id: 'perito', label: 'Peritos (CNPC)' },
            { id: 'operator', label: 'Operador' },
            { id: 'parceiro_tributario', label: 'Parceiro' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setRoleFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === f.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Members Directory Grid / Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Membro / Usuário</th>
                <th className="py-3 px-4">Papel RBAC</th>
                <th className="py-3 px-4">Departamento / Escopo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Data de Inclusão</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    Nenhum membro encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const roleDef = RBAC_ROLE_DEFINITIONS[member.role];
                  const isRevoked = member.status === 'REVOKED';

                  return (
                    <tr key={member.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-300">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              member.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-100 block">{member.name}</span>
                              {member.professionalRole && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[9px] font-mono font-bold">
                                  <Award className="w-2.5 h-2.5" />
                                  {member.professionalRole === 'advogado_tributarista' ? 'ADV' : member.professionalRole === 'contador_fiscal' ? 'CONT' : 'PERITO'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                {member.email}
                              </span>
                              {member.professionalRegistry && (
                                <span className="text-emerald-400 text-[10px] font-semibold">
                                  • {member.professionalRegistry}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold font-mono border ${
                          member.role === 'super_admin'
                            ? 'bg-violet-950/60 border-violet-500/40 text-violet-300'
                            : member.role === 'tenant_admin'
                            ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                            : member.role === 'cfo_executive'
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                            : member.role === 'parceiro_tributario' || member.role === 'advogado_tributarista' || member.role === 'contador_fiscal' || member.role === 'perito_judicial'
                            ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                            : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                        }`}>
                          <KeyRound className="w-3 h-3" />
                          <span>{roleDef?.label || member.role}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="text-slate-200 font-medium block">{member.department}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Escopo: <strong className="text-slate-300">{member.accessScope}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[10px] font-mono font-bold">
                            <Lock className="w-3 h-3" />
                            REVOGADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            ATIVO
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage && !isRevoked && (
                            <button
                              type="button"
                              onClick={() => handleOpenPermissionsModal(member)}
                              className="px-2 py-1 rounded-lg bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Configurar permissões de acesso por módulo"
                            >
                              <Sliders className="w-3 h-3" />
                              <span className="hidden sm:inline">Permissões</span>
                            </button>
                          )}
                          {canManage && !isRevoked && member.email !== currentUser?.email && (
                            <button
                              type="button"
                              onClick={() => setRevokingMember(member)}
                              className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-rose-200 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserX className="w-3 h-3" />
                              <span className="hidden sm:inline">Revogar</span>
                            </button>
                          )}
                          {isRevoked && (
                            <span className="text-[11px] text-slate-500 font-mono">Sem Acesso</span>
                          )}
                          {member.email === currentUser?.email && (
                            <span className="text-[11px] text-blue-400 font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/40 border border-blue-500/20">Você</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE USER MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--vx-deep)] border border-blue-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-950 border border-blue-500/30 text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Convidar Membro / Emitir Credencial</h3>
                  <span className="text-[11px] text-slate-400 font-mono">Registro auditável em blockchain D+0</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{inviteError}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Dra. Camila Rocha"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">E-mail Corporativo</label>
                <input
                  type="email"
                  placeholder="Ex: camila.rocha@empresa.com.br"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Papel RBAC</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="operator">Operador Tático (Logística/Vendas)</option>
                    <option value="cfo_executive">CFO Executivo (Tesouraria/Risco)</option>
                    <option value="auditor_compliance">Auditor de Compliance / DPO</option>
                    <option value="c_level_approver">C-Level Aprovador (CEO/COO)</option>
                    <option value="tenant_admin">Administrador do Tenant</option>
                    <option value="parceiro_tributario">Parceiro Tributário (Portal Isolado)</option>
                    <option value="advogado_tributarista">Advogado Tributarista (Defesa Fiscal)</option>
                    <option value="contador_fiscal">Contador Fiscal (SPED & DRE)</option>
                    <option value="perito_judicial">Perito Judicial (Laudo & Evidências)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Escopo de Acesso</label>
                  <select
                    value={inviteScope}
                    onChange={(e) => setInviteScope(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOGISTICS">LOGISTICS (Apenas Operacional)</option>
                    <option value="FINANCIAL">FINANCIAL (Apenas Tesouraria)</option>
                    <option value="LEGAL_ONLY">LEGAL_ONLY (Restrito Parceiro/Jurídico)</option>
                    <option value="ALL">ALL (Geral Corporativo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Papel Profissional Específico</label>
                  <select
                    value={inviteProfessionalRole}
                    onChange={(e) => setInviteProfessionalRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Nenhum / Padrão Corporativo</option>
                    <option value="advogado_tributarista">Advogado Tributarista</option>
                    <option value="contador_fiscal">Contador Fiscal</option>
                    <option value="perito_judicial">Perito Judicial</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Registro / Conselho (OAB, CRC, CNPC)</label>
                  <input
                    type="text"
                    placeholder="Ex: OAB/SP 412.981 ou CRC 1SP298311"
                    value={inviteProfessionalRegistry}
                    onChange={(e) => setInviteProfessionalRegistry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Área / Departamento</label>
                <input
                  type="text"
                  placeholder="Ex: Controladoria & Tributário"
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-invite"
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Confirmar e Registrar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRANULAR MODULE PERMISSIONS MODAL */}
      {editingPermissionsMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--vx-deep)] border border-blue-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-950 border border-blue-500/30 text-blue-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>Permissões Granulares por Módulo</span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30">
                      {editingPermissionsMember.name}
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {editingPermissionsMember.email} • {editingPermissionsMember.department}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPermissionsMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Personalize o acesso individual deste membro para cada frente do sistema. Usuários com <strong>Visualizar</strong> podem consultar dashboards e laudos; com <strong>Editar/Operar</strong> podem submeter petições, recalcular teses e exportar dossiês.
              </span>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
              {RBAC_MODULES_LIST.map((mod) => {
                const currentPerm = permissionsForm[mod.key] || { canView: true, canEdit: false };
                return (
                  <div
                    key={mod.key}
                    className="p-3 bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-200 block">{mod.name}</span>
                      <span className="text-[11px] text-slate-400 block">{mod.desc}</span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={currentPerm.canView}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPermissionsForm(prev => ({
                              ...prev,
                              [mod.key]: {
                                canView: val,
                                canEdit: val ? (prev[mod.key]?.canEdit ?? false) : false
                              }
                            }));
                          }}
                          className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-medium">Visualizar</span>
                      </label>

                      <label className={`flex items-center gap-2 select-none ${currentPerm.canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
                        <input
                          type="checkbox"
                          disabled={!currentPerm.canView}
                          checked={currentPerm.canEdit}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setPermissionsForm(prev => ({
                              ...prev,
                              [mod.key]: {
                                canView: true,
                                canEdit: val
                              }
                            }));
                          }}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 h-4 w-4 bg-slate-900 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-medium">Editar / Operar</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditingPermissionsMember(null)}
                className="px-4 py-2 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Salvar Permissões no Ledger</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* REVOKE MEMBER CONFIRMATION MODAL */}
      {revokingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--vx-deep)] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Revogar Acesso Corporativo</h3>
                <span className="text-[11px] text-slate-400 font-mono">{revokingMember.name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tem certeza que deseja revogar o acesso do usuário <strong className="text-slate-100">{revokingMember.email}</strong>? Todas as sessões ativas serão invalidadas imediatamente e o evento será registrado no Ledger com hash imutável.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Justificativa de Conformidade (Obrigatória):
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Desligamento de colaborador / Troca de função"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRevokingMember(null);
                  setRevokeReason('');
                }}
                className="px-4 py-2 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Confirmar Revogação Imediata
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
