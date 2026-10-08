import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  ShieldCheck, 
  Briefcase, 
  Receipt, 
  AlertCircle, 
  Clock, 
  UserCheck,
  History
} from 'lucide-react';
import { 
  ProspectLead, 
  TaxProfessional 
} from '../../data/mockOfficeData';
import { reassignLead } from '../../services/leadDistributionEngine';

interface LeadReassignmentModalProps {
  isOpen: boolean;
  lead: ProspectLead | null;
  professionals: TaxProfessional[];
  onClose: () => void;
  onSuccess: (
    updatedLead: ProspectLead, 
    updatedProfessionals: TaxProfessional[], 
    reason: string
  ) => void;
  currentUserName?: string;
}

export const LeadReassignmentModal: React.FC<LeadReassignmentModalProps> = ({
  isOpen,
  lead,
  professionals,
  onClose,
  onSuccess,
  currentUserName = 'Gestor Tributário'
}) => {
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const currentProf = professionals.find(p => p.id === lead.assignedProfessionalId);
  const eligibleProfessionals = professionals.filter(p => p.id !== lead.assignedProfessionalId);

  const quickReasonTemplates = [
    'Especialista na tese fiscal aplicável',
    'Profissional anterior ausente ou em férias',
    'Balanceamento de capacidade operacional',
    'Redirecionamento para perícia contábil',
    'Adequação ao perfil setorial do cliente'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessionalId) {
      setErrorMsg('Por favor, selecione o novo profissional de destino.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('A justificativa da reatribuição é obrigatória para fins de governança e rastreabilidade.');
      return;
    }

    try {
      const result = reassignLead(
        lead,
        selectedProfessionalId,
        professionals,
        reason.trim(),
        currentUserName
      );

      onSuccess(result.updatedLead, result.updatedProfessionals, reason.trim());
      setErrorMsg(null);
      setReason('');
      setSelectedProfessionalId('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar reatribuição.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--vx-deep)] border border-cyan-800/70 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 font-mono flex items-center gap-2">
                Reatribuição Manual de Lead
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste operacional de responsabilidade com registro de auditoria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Lead Summary Card */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Empresa Selecionada:</span>
              <strong className="text-slate-100 font-mono truncate max-w-[240px]" title={lead.name}>
                {lead.name}
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">CNPJ:</span>
              <span className="text-slate-300 font-mono">{lead.cnpj}</span>
            </div>
            {lead.cnae && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">CNAE:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[240px]" title={lead.cnae}>
                  {lead.cnae}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
              <span className="text-slate-400">Responsável Atual:</span>
              <div className="flex items-center gap-1.5">
                {currentProf ? (
                  <>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                      currentProf.role === 'Advogado' 
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {currentProf.role}
                    </span>
                    <strong className="text-slate-200 font-mono text-xs">{currentProf.name}</strong>
                  </>
                ) : (
                  <span className="text-amber-400 font-mono font-bold text-xs">
                    {lead.responsibleName || 'Fila de Espera'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Target Professional Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 font-mono block">
              Selecione o Novo Responsável Tributário *
            </label>
            <select
              value={selectedProfessionalId}
              onChange={e => {
                setSelectedProfessionalId(e.target.value);
                setErrorMsg(null);
              }}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="">-- Escolha um profissional da equipe --</option>
              {eligibleProfessionals.map(prof => {
                const loadPercent = Math.round((prof.activeLeadsCount / prof.maxCapacity) * 100);
                const isFull = prof.activeLeadsCount >= prof.maxCapacity;
                const isAbsent = prof.status === 'Ausente';
                return (
                  <option 
                    key={prof.id} 
                    value={prof.id}
                    disabled={isAbsent}
                  >
                    {prof.name} ({prof.role}) — Carga: {prof.activeLeadsCount}/{prof.maxCapacity} ({loadPercent}%) {isAbsent ? '[AUSENTE]' : isFull ? '[CAPACIDADE MÁXIMA]' : `[${prof.status}]`}
                  </option>
                );
              })}
            </select>
            <span className="text-[10px] text-slate-400 block">
              Profissionais disponíveis com menor ocupação de carteira são recomendados para evitar sobrecarga.
            </span>
          </div>

          {/* Quick Reason Suggestions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 font-mono block">
              Modelos Rápidos de Justificativa
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickReasonTemplates.map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReason(template)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  + {template}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 font-mono block">
              Justificativa Detalhada da Reatribuição *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setErrorMsg(null);
              }}
              required
              placeholder="Descreva o motivo da alteração de responsabilidade para auditoria..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {/* Previous Reassignment History if any */}
          {lead.reassignmentHistory && lead.reassignmentHistory.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                <History className="w-3 h-3 text-cyan-400" />
                Histórico de Reatribuições Anteriores ({lead.reassignmentHistory.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto divide-y divide-slate-800/60">
                {lead.reassignmentHistory.map((item, i) => (
                  <div key={i} className="pt-1.5 first:pt-0 text-[10px] font-mono space-y-0.5">
                    <div className="flex justify-between text-slate-300">
                      <span>{item.previousProfessionalName} → <strong className="text-cyan-300">{item.newProfessionalName}</strong></span>
                      <span className="text-slate-400 text-[9px]">{item.timestamp}</span>
                    </div>
                    <div className="text-slate-400 italic">"{item.reason}"</div>
                    <div className="text-[9px] text-slate-400">Por: {item.reassignedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance notice */}
          <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-[10px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              A reatribuição atualiza em tempo real as quotas de capacidade de ambos os profissionais e registra um evento imutável na trilha de auditoria interna.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-950/50 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirmar Reatribuição</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
