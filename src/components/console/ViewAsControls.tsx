import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RBAC_ROLE_DEFINITIONS, getDefaultTabForRole } from '../../types/rbac';
import type { NavigationTab, UserRole } from '../../types/aos';

/**
 * P24 · "Ver como" — só para o Super Admin real. Mostra a plataforma com o papel
 * de um membro do tenant ativo, sem usar credenciais do membro. Início e fim
 * ficam na trilha de auditoria do Super Admin.
 */

const roleLabel = (r: UserRole) => RBAC_ROLE_DEFINITIONS[r]?.label || r;

export const ViewAsSelector: React.FC<{ onSelectTab: (tab: NavigationTab) => void }> = ({ onSelectTab }) => {
  const { isRealSuperAdmin, viewAs, startViewAs, stopViewAs, tenantMembers, activeTenant, realUser } = useAuth();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fechar);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fechar); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  const membros = useMemo(
    () => (tenantMembers || [])
      .filter((m) => m.tenantId === activeTenant.id && m.status !== 'REVOKED' && m.role !== 'super_admin')
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [tenantMembers, activeTenant.id],
  );

  if (!isRealSuperAdmin) return null;

  const entrar = (id: string, role: UserRole) => {
    if (startViewAs(id)) onSelectTab(getDefaultTabForRole(role));
    setAberto(false);
  };
  const sair = () => {
    stopViewAs();
    onSelectTab(getDefaultTabForRole((realUser?.role as UserRole) || 'super_admin'));
    setAberto(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[12.5px] font-medium ${
          viewAs ? 'border-accent bg-accent-tint text-accent' : 'border-hairline bg-surface text-ink-2 hover:border-hairline-strong'
        }`}
        title="Visualizar a plataforma com o papel de um membro do escritório"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:inline">{viewAs ? `Vendo como ${viewAs.name.split(' ').slice(0, 2).join(' ')}` : 'Ver como'}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {aberto && (
        <div role="listbox" className="absolute right-0 z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-hairline bg-surface shadow-lg">
          <div className="border-b border-hairline px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-mute">Ver como · {activeTenant.name}</div>
            <div className="text-[11.5px] text-ink-mute">Sem senha do membro · registrado na auditoria</div>
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {membros.length === 0 && <div className="px-3 py-3 text-[12.5px] text-ink-mute">Nenhum membro neste tenant.</div>}
            {membros.map((m) => (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={viewAs?.id === m.id}
                onClick={() => entrar(m.id, m.role)}
                className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left hover:bg-surface-hover"
              >
                <span>
                  <span className="block text-[13px] text-ink">{m.name}</span>
                  <span className="block text-[11.5px] text-ink-mute">{roleLabel(m.role)} · {m.department}</span>
                </span>
                {viewAs?.id === m.id && <Check className="mt-0.5 h-4 w-4 text-accent" />}
              </button>
            ))}
          </div>
          {viewAs && (
            <button type="button" onClick={sair} className="flex w-full items-center gap-2 border-t border-hairline px-3 py-2.5 text-[12.5px] font-medium text-ink hover:bg-surface-hover">
              <EyeOff className="h-4 w-4" /> Voltar ao Super Admin
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const ViewAsBanner: React.FC<{ onSelectTab: (tab: NavigationTab) => void }> = ({ onSelectTab }) => {
  const { viewAs, stopViewAs, realUser } = useAuth();
  if (!viewAs) return null;
  return (
    <div role="status" className="sticky top-0 z-30 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline bg-accent px-4 py-2 text-[12.5px] text-[#FFFFFF]">
      <Eye className="h-4 w-4 shrink-0" />
      <span>
        Visualizando como <b>{viewAs.name}</b> · {roleLabel(viewAs.role)}
        <span className="opacity-80"> — sessão real: {realUser?.name || 'Super Admin'}</span>
      </span>
      <button
        type="button"
        onClick={() => { stopViewAs(); onSelectTab(getDefaultTabForRole((realUser?.role as UserRole) || 'super_admin')); }}
        className="ml-auto rounded-md border border-[#FFFFFF]/40 px-2.5 py-1 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#FFFFFF]/10"
      >
        Voltar ao Super Admin
      </button>
    </div>
  );
};
