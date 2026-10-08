import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { InssPrevidenciarioRunnerView } from './InssPrevidenciarioRunnerView';
import { InssObrasPanel } from '../legal/InssObrasPanel';
import { LoasRunnerView } from './LoasRunnerView';
import { getInssServiceDefinitionForBeneficio } from '../../services/registry/definitions/inssExpertiseService';
import { NavigationTab, TenantProfile } from '../../types/aos';

interface InssHubViewProps {
  tenantProfile: TenantProfile;
  onNavigateTab?: (tab: NavigationTab) => void;
  initialSubTab?: 'previdenciario' | 'loas' | 'obras';
}

export const InssHubView: React.FC<InssHubViewProps> = ({
  tenantProfile,
  onNavigateTab,
  initialSubTab = 'previdenciario'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  const tabs: SubTabItem[] = [
    { id: 'previdenciario', label: 'Especialista Previdenciário (CNIS / CTC / RGPS)', badge: '23 Regras' },
    { id: 'loas', label: 'LOAS / BPC (Lei nº 8.742/93)', badge: 'Idoso & PcD' },
    { id: 'obras', label: 'INSS-Obras & CNO (Lei 8.212/91 & SERO)', badge: 'Engenharia & CNO' }
  ];

  const defaultService = getInssServiceDefinitionForBeneficio('programado');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Esteiras Especializadas de Atuação"
        title="Especialista INSS · Previdenciário, LOAS/BPC & Obras CNO"
        description="Esteira híbrida de perícia previdenciária com cruzamento estrito CNIS vs CTC, cálculo per capita de BPC/LOAS com divisão Half-Even e apuração de retenções de obras civis."
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'previdenciario' && (
        <div className="mt-4">
          <InssPrevidenciarioRunnerView
            initialService={defaultService}
            tenantId={tenantProfile.id}
            tenantName={tenantProfile.name}
            tenantCnpj={tenantProfile.cnpj}
            onBack={() => onNavigateTab ? onNavigateTab('operational_dashboard') : undefined}
          />
        </div>
      )}

      {activeTab === 'loas' && (
        <div className="mt-4">
          <LoasRunnerView
            tenantId={tenantProfile.id}
            tenantName={tenantProfile.name}
            tenantCnpj={tenantProfile.cnpj}
            onBack={() => onNavigateTab ? onNavigateTab('operational_dashboard') : undefined}
          />
        </div>
      )}

      {activeTab === 'obras' && (
        <div className="mt-4">
          <InssObrasPanel
            onBackToDashboard={() => onNavigateTab ? onNavigateTab('operational_dashboard') : undefined}
            onNavigateTab={onNavigateTab}
          />
        </div>
      )}
    </div>
  );
};

export default InssHubView;
