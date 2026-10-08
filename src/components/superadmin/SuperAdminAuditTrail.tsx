import React, { useState } from 'react';
import { 
  History, 
  ShieldCheck, 
  Key, 
  Search, 
  Filter, 
  CheckCircle2, 
  Lock, 
  FileCode, 
  AlertTriangle,
  UserCheck,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuperAdminAuditTrail: React.FC = () => {
  const { auditLogs } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredLogs = auditLogs.filter(log => 
    log.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.immutableHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'KILL_SWITCH_ENGAGED':
        return { label: 'KILL-SWITCH ENGAGED', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'KILL_SWITCH_DISENGAGED':
        return { label: 'KILL-SWITCH REVOKED', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'CHANGE_PLAN':
        return { label: 'ALTERAÇÃO DE PLANO', bg: 'bg-[var(--vx-neon)]/20 text-[var(--vx-neon)] border-[var(--vx-neon)]/40' };
      case 'ACTIVATE_SHADOW_MODE':
        return { label: 'SHADOW MODE (14D)', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'TOGGLE_FEATURE_FLAG':
        return { label: 'OVERRIDE FEATURE FLAG', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'PROVISION_TENANT':
        return { label: 'NOVO PROVISIONAMENTO', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      default:
        return { label: action, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--vx-deep)] p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por Tenant, Ator, Ação ou Hash Criptográfico..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 text-slate-200 pl-9 pr-3 py-2 text-xs rounded-lg focus:outline-none focus:border-[var(--vx-neon)]/50"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{filteredLogs.length} Registros Imutáveis</span>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="space-y-3">
        {filteredLogs.map(log => {
          const actionBadge = getActionBadge(log.action);
          const isKillSwitch = log.action === 'KILL_SWITCH_ENGAGED';

          return (
            <div 
              key={log.id} 
              className={`p-4 rounded-xl bg-[var(--vx-deep)] border transition-colors shadow-lg space-y-3 ${
                isKillSwitch ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${actionBadge.bg}`}>
                    {actionBadge.label}
                  </span>
                  <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.tenantName}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                  <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                  <span>·</span>
                  <span className="text-slate-300 font-semibold">{log.actor}</span>
                </div>
              </div>

              {/* Action Details */}
              <div className="text-xs text-slate-300">
                {log.details}
              </div>

              {/* Justification & Co-Approver if present */}
              {log.reason && (
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-400 font-semibold">Justificativa Registrada: </span>
                    <span>{log.reason}</span>
                  </div>
                  {log.secondApprover && (
                    <div className="flex items-center gap-1.5 text-rose-300 font-mono text-[10px]">
                      <UserCheck className="w-3.5 h-3.5 text-rose-400" />
                      <span>Co-Aprovador Multi-Sig: <strong>{log.secondApprover}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Cryptographic Hash Badge */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5 truncate max-w-xl">
                  <Lock className="w-3 h-3 text-[var(--vx-neon)]" />
                  <span className="text-slate-400">Ledger Hash:</span>
                  <span className="text-[var(--vx-neon)] truncate font-semibold">{log.immutableHash}</span>
                </div>

                <button
                  onClick={() => handleCopyHash(log.immutableHash)}
                  className="flex items-center gap-1 text-slate-400 hover:text-[var(--vx-neon)] transition-colors cursor-pointer shrink-0 ml-2"
                >
                  {copiedHash === log.immutableHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Hash</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
