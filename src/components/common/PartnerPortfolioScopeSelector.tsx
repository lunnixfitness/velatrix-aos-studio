// src/components/common/PartnerPortfolioScopeSelector.tsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  ChevronDown, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isPartnerPortfolioScope } from '../../types/rbac';
import { 
  PartnerPortfolioService, 
  PartnerPortfolioClient 
} from '../../services/partnerPortfolioService';
import { formatCurrency } from '../../utils/i18n';

interface PartnerPortfolioScopeSelectorProps {
  currentCnpj?: string;
  onClientSelect?: (client: PartnerPortfolioClient) => void;
  moduleName?: string;
  compact?: boolean;
}

export const PartnerPortfolioScopeSelector: React.FC<PartnerPortfolioScopeSelectorProps> = ({
  currentCnpj,
  onClientSelect,
  moduleName = 'Módulo Operacional',
  compact = false
}) => {
  const { currentUserRole, currentUser } = useAuth();
  const isPartner = isPartnerPortfolioScope(currentUserRole);

  const [portfolioClients, setPortfolioClients] = useState<PartnerPortfolioClient[]>(() => 
    PartnerPortfolioService.getPortfolioClients()
  );
  const [activeClient, setActiveClient] = useState<PartnerPortfolioClient>(() => 
    PartnerPortfolioService.getActiveClient()
  );

  useEffect(() => {
    const handlePortfolioChange = () => {
      setPortfolioClients(PartnerPortfolioService.getPortfolioClients());
      setActiveClient(PartnerPortfolioService.getActiveClient());
    };

    window.addEventListener('velatrix:partner_active_client_changed', handlePortfolioChange);
    return () => {
      window.removeEventListener('velatrix:partner_active_client_changed', handlePortfolioChange);
    };
  }, []);

  // Se o CNPJ externo mudar e corresponder a um cliente da carteira, sincroniza
  useEffect(() => {
    if (currentCnpj) {
      const match = portfolioClients.find(c => c.cnpj === currentCnpj || c.cleanCnpj === currentCnpj.replace(/\D/g, ''));
      if (match && match.id !== activeClient.id) {
        setActiveClient(match);
      }
    }
  }, [currentCnpj, portfolioClients]);

  // Se não for perfil com restrição de carteira, não renderiza nada
  if (!isPartner) {
    return null;
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const client = PartnerPortfolioService.setActiveClient(selectedId);
    setActiveClient(client);
    if (onClientSelect) {
      onClientSelect(client);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs">
        <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Carteira RLS:
        </span>
        <select
          value={activeClient.id}
          onChange={handleSelectChange}
          className="bg-slate-900 border border-emerald-600/50 rounded-lg px-2.5 py-1 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-400 cursor-pointer"
        >
          {portfolioClients.map(c => (
            <option key={c.id} value={c.id}>
              {c.companyName} ({c.cnpj})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/40 shadow-lg relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Partner RLS Identification */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                RLS Ativo — Carteira de Clientes do Parceiro
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                {portfolioClients.length} Empresas Vinculadas
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Você está operando o <strong className="text-white">{moduleName}</strong> estritamente sobre a sua carteira credenciada. Registros externos ao seu escritório estão isolados.
            </p>
          </div>
        </div>

        {/* Right: Client Switcher Dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Cliente Selecionado para Execução:</div>
            <div className="text-xs font-bold text-slate-200">{activeClient.tradeName || activeClient.companyName}</div>
          </div>

          <div className="relative">
            <select
              value={activeClient.id}
              onChange={handleSelectChange}
              id="partner-portfolio-client-selector"
              className="appearance-none bg-slate-950 text-slate-100 font-mono text-xs font-semibold border border-emerald-500/60 rounded-xl pl-3.5 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-inner"
            >
              {portfolioClients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName} — {c.cnpj}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Active Client Sub-bar with details */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-slate-500 text-[10px] block">CNPJ Titular:</span>
          <span className="text-slate-200 font-semibold">{activeClient.cnpj}</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">Regime Tributário:</span>
          <span className="text-cyan-400 font-semibold capitalize">{activeClient.taxRegime.replace('_', ' ')}</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">Créditos Mapeados (60M):</span>
          <span className="text-emerald-400 font-bold">{formatCurrency(activeClient.estimatedCredits, 'BRL')}</span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] block">Split do Parceiro (70%):</span>
          <span className="text-white font-bold">{formatCurrency(activeClient.partnerShareAmount, 'BRL')}</span>
        </div>
      </div>
    </div>
  );
};
