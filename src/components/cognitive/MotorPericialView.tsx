import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { FiscalChronologicalTimeline60M } from '../legal/FiscalChronologicalTimeline60M';
import { ExpertTaxCalculationEngine } from '../legal/ExpertTaxCalculationEngine';
import { NavigationTab, TenantProfile, SupportedCurrency } from '../../types/aos';

interface MotorPericialViewProps {
  tenantProfile: TenantProfile;
  currency?: SupportedCurrency;
  onNavigateTab?: (tab: NavigationTab) => void;
  initialSubTab?: 'timeline' | 'calculo';
}

export const MotorPericialView: React.FC<MotorPericialViewProps> = ({
  tenantProfile,
  currency = 'BRL',
  onNavigateTab,
  initialSubTab = 'timeline'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  const tabs: SubTabItem[] = [
    { id: 'timeline', label: 'Linha Cronológica 60 Meses (D+0 / XMLs)', badge: '60 Competências' },
    { id: 'calculo', label: 'Motor de Cálculo Pericial (SELIC & Indébito)', badge: 'Auditoria Judicial' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Motores Cognitivos de Alta Frequência"
        title="Motor Pericial 60 Meses · Reconstituição & Liquidação"
        description="Reconstituição contábil pericial retroativa de 60 meses com segregação monofásica (Lei 10.147/00), Tema 69 STF, atualização monetária por taxa SELIC e memórias analíticas exportáveis."
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'timeline' && (
        <div className="mt-4">
          <FiscalChronologicalTimeline60M
            onNavigateToCalculoPericial={() => setActiveTab('calculo')}
            onNavigateToSpedEditor={() => onNavigateTab && onNavigateTab('legal_tax_recovery')}
          />
        </div>
      )}

      {activeTab === 'calculo' && (
        <div className="mt-4">
          <ExpertTaxCalculationEngine
            companyName={tenantProfile?.name}
            cnpj={tenantProfile?.cnpj}
          />
        </div>
      )}
    </div>
  );
};

export default MotorPericialView;
