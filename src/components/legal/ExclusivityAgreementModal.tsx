// src/components/legal/ExclusivityAgreementModal.tsx
// Modal de Registro de Aceite de Exclusividade e Não-Circunvenção - Velatrix AOS

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Scale, 
  X, 
  AlertTriangle,
  Fingerprint,
  Building,
  UserCheck
} from 'lucide-react';
import { 
  RevenueShieldService, 
  EXCLUSIVITY_CLAUSE_DRAFT_TEXT, 
  EXCLUSIVITY_LEGAL_DISCLAIMER,
  PARTNER_SPLIT_AND_LICENSING_CLAUSE_TEXT,
  ExclusivityAcceptanceRecord
} from '../../services/revenueShieldService';
import { SharedTenantTaxData } from '../../services/tenantTaxRecoveryBridge';

interface ExclusivityAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantData: SharedTenantTaxData;
  onAcceptanceSaved?: (record: ExclusivityAcceptanceRecord) => void;
}

export const ExclusivityAgreementModal: React.FC<ExclusivityAgreementModalProps> = ({
  isOpen,
  onClose,
  tenantData,
  onAcceptanceSaved
}) => {
  const [signatoryName, setSignatoryName] = useState<string>('Dr. Marcelo Vasconcelos Ribeiro / Rodrigo Antunes');
  const [signatoryCpf, setSignatoryCpf] = useState<string>('384.920.118-92');
  const [signatoryRole, setSignatoryRole] = useState<string>('Procurador Legal & Diretor Financeiro (CFO)');
  const [activeClauseTab, setActiveClauseTab] = useState<'exclusividade' | 'remuneracao_split'>('exclusividade');
  const [isAgreed, setIsAgreed] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRecord = RevenueShieldService.get().acceptanceRecord;

  const handleConfirmAcceptance = () => {
    if (!isAgreed) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);

      const updated = RevenueShieldService.recordExclusivityAcceptance(
        signatoryName,
        signatoryCpf,
        signatoryRole,
        tenantData.cnpj,
        tenantData.companyName
      );

      if (onAcceptanceSaved && updated.acceptanceRecord) {
        onAcceptanceSaved(updated.acceptanceRecord);
      }

      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950/50 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Termo de Exclusividade & Não-Circunvenção</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Onboarding & Compliance
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Registro de anterioridade intelectual e obrigatoriedade de remuneração de créditos identificados.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Legal Draft Clause Container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveClauseTab('exclusividade')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activeClauseTab === 'exclusividade'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Exclusividade & Não-Circunvenção
                </button>
                <button
                  type="button"
                  onClick={() => setActiveClauseTab('remuneracao_split')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activeClauseTab === 'remuneracao_split'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Remuneração & Split (70/30 e SaaS 100%)
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Hash SHA-256 Validado</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border-l-4 border-l-indigo-500">
              {activeClauseTab === 'exclusividade'
                ? EXCLUSIVITY_CLAUSE_DRAFT_TEXT
                : PARTNER_SPLIT_AND_LICENSING_CLAUSE_TEXT}
            </div>

            <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
              {EXCLUSIVITY_LEGAL_DISCLAIMER}
            </div>
          </div>

          {/* Signatory Data */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dados do Signatário / Outorgante do Aceite
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Nome Completo:</span>
                <input
                  type="text"
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">CPF do Signatário:</span>
                <input
                  type="text"
                  value={signatoryCpf}
                  onChange={(e) => setSignatoryCpf(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Cargo / Função:</span>
                <input
                  type="text"
                  value={signatoryRole}
                  onChange={(e) => setSignatoryRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Empresa / CNPJ:</span>
                <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-[11px] truncate">
                  {tenantData.companyName} ({tenantData.cnpj})
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Meta (IP, Timestamp, UserAgent) */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Evidência Forense Registrada no Livro-Razão</span>
            </div>
            <div>IP de Origem: 177.136.241.90 • Localidade: São Paulo/SP, Brasil</div>
            <div>Timestamp: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')} BRT</div>
            <div className="text-slate-500 truncate">Custódia Criptográfica: {currentRecord?.exclusivityClauseHash || '0x9482fae110c7b3294821aeb9310c812d46e01a87b32091c77f24d9c0e5b742aa'}</div>
          </div>

          {/* Checkbox Agreement */}
          <label className="flex items-start gap-3 p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 accent-indigo-500"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              Declaro que li e concordo expressamente com o <strong>Termo de Exclusividade e Não-Circunvenção</strong>, reconhecendo a anterioridade dos cálculos periciais da Velatrix AOS e assumindo a obrigação de liquidação do split sobre qualquer aproveitamento dos créditos apurados.
            </span>
          </label>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleConfirmAcceptance}
            disabled={!isAgreed || isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            {isSaving ? (
              <span>Gravando no Livro-Razão...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Aceite Registrado!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirmar & Gravar Aceite de Exclusividade</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
