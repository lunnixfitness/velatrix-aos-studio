import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CreditCard,
  Check,
  X,
  KeyRound,
  Building2,
  Info
} from 'lucide-react';
import {
  TenantComplianceConfig,
  KycProviderChoice,
  BaasProviderChoice
} from '../../services/precatorios/adapters/types';
import { complianceEngine } from '../../services/precatorios/complianceClient';

interface TenantProviderConfigModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (config: TenantComplianceConfig) => void;
}

export const TenantProviderConfigModal: React.FC<TenantProviderConfigModalProps> = ({
  tenantId,
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const currentConfig = complianceEngine.getTenantConfig(tenantId);

  const [kycChoice, setKycChoice] = useState<KycProviderChoice>(currentConfig.kycProviderType);
  const [baasChoice, setBaasChoice] = useState<BaasProviderChoice>(currentConfig.baasProviderType);
  const [kycApiKey, setKycApiKey] = useState(currentConfig.kycCredentials?.apiKey || '');
  const [baasClientId, setBaasClientId] = useState(currentConfig.baasCredentials?.clientId || '');
  const [baasClientSecret, setBaasClientSecret] = useState(currentConfig.baasCredentials?.clientSecret || '');
  const [chavePixEscrow, setChavePixEscrow] = useState(currentConfig.baasCredentials?.chavePixEscrow || '');

  if (!isOpen) return null;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: TenantComplianceConfig = {
      tenantId,
      tenantName: currentConfig.tenantName || 'Tenant Ativo',
      kycProviderType: kycChoice,
      kycCredentials: {
        apiKey: kycApiKey,
        ambiente: 'PRODUCAO'
      },
      baasProviderType: baasChoice,
      baasCredentials: {
        clientId: baasClientId,
        clientSecret: baasClientSecret,
        chavePixEscrow,
        ambiente: 'PRODUCAO'
      }
    };

    complianceEngine.configurarTenant(newConfig);
    onConfigSaved(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Configuração de Provedores Plugáveis (Tenant)
              </h3>
              <p className="text-[11px] text-slate-400">
                A Velatrix não opera financeiramente. Conecte os provedores com as credenciais do seu escritório ou fundo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Legal */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-[11px] text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            A plataforma provê apenas a esteira técnica e a cadeia de custódia imutável (Merkle-like SHA-256). Caso não queira plugar provedores de API, selecione <strong>Modo Instrução Manual</strong> para emitir PDFs e liquidar via Internet Banking próprio.
          </span>
        </div>

        <form onSubmit={handleSalvar} className="space-y-5">
          {/* Seletor de KYC */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <label className="font-bold uppercase text-slate-200">
                1. Provedor de KYC / PLD (Biometria & Listas Restritivas)
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'SERPRO_DATAVALID', label: 'Serpro Datavalid', desc: 'Base Oficial CNH' },
                { id: 'UNICO_CHECK', label: 'Único Check', desc: 'Score Biométrico' },
                { id: 'IDWALL', label: 'Idwall', desc: 'Background Check' },
                { id: 'MANUAL', label: 'Instrução Manual', desc: 'Auditoria Externa' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setKycChoice(opt.id as KycProviderChoice)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    kycChoice === opt.id
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">{opt.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {kycChoice !== 'MANUAL' && (
              <div className="pt-2">
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  API Key / Token de Acesso ({kycChoice})
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Cole a chave de API fornecida pelo seu provedor..."
                    value={kycApiKey}
                    onChange={e => setKycApiKey(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Seletor de BaaS */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <label className="font-bold uppercase text-slate-200">
                2. Provedor de BaaS / Split Pix de Liquidação
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'CELCOIN', label: 'Celcoin', desc: 'Split Pix Direto' },
                { id: 'DOCK', label: 'Dock BaaS', desc: 'Subcontas' },
                { id: 'SWAP', label: 'Swap Tech', desc: 'Fundos BaaS' },
                { id: 'BS2', label: 'Banco BS2', desc: 'Corporate Pix' },
                { id: 'MANUAL', label: 'Instrução Manual', desc: 'Internet Banking' }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setBaasChoice(opt.id as BaasProviderChoice)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    baasChoice === opt.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-[11px]">{opt.label}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>

            {baasChoice !== 'MANUAL' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Client ID / Credencial ({baasChoice})
                  </label>
                  <input
                    type="text"
                    placeholder="Client ID..."
                    value={baasClientId}
                    onChange={e => setBaasClientId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Client Secret / Chave Privada
                  </label>
                  <input
                    type="password"
                    placeholder="Client Secret..."
                    value={baasClientSecret}
                    onChange={e => setBaasClientSecret(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Chave Pix da Conta Escrow do Tenant (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: financeiro@fundocreditos.com.br"
                    value={chavePixEscrow}
                    onChange={e => setChavePixEscrow(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer de Ações */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-lg shadow-cyan-900/30"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações do Tenant</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
