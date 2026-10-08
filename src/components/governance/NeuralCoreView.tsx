import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { VelatrixAosHeroCyberBrain } from '../operations/VelatrixAosHeroCyberBrain';
import { AutonomousSwarmHub } from '../operations/AutonomousSwarmHub';
import { NavigationTab, TenantProfile, GovernanceSettings, EnterpriseKnowledgeGraph, AuditRecord } from '../../types/aos';

interface NeuralCoreViewProps {
  tenantProfile: TenantProfile;
  governanceSettings: GovernanceSettings;
  knowledgeGraph: EnterpriseKnowledgeGraph;
  onAddAuditRecord?: (record: AuditRecord) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const NeuralCoreView: React.FC<NeuralCoreViewProps> = ({
  tenantProfile,
  governanceSettings,
  knowledgeGraph,
  onAddAuditRecord,
  onNavigateTab
}) => {
  const [activeTab, setActiveTab] = useState<string>('swarm_hub');

  const tabs: SubTabItem[] = [
    { id: 'swarm_hub', label: 'Cérebro do Enxame de Agentes (Swarm)', badge: '6 Núcleos' },
    { id: 'cyber_brain', label: 'Visor Holográfico 3D & Telemetria Neural', badge: 'HUD 3D' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Governança · Núcleo Cibernético"
        title="Neural Core · Arquitetura do Enxame Autônomo"
        description="Centro nervoso de deliberação paralela de agentes inteligentes com árvore de consenso determinística, verificação formal de invariantes e sincronização de estado com o Grafo Semântico."
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'swarm_hub' && (
        <div className="mt-4">
          <AutonomousSwarmHub
            tenantProfile={tenantProfile}
            governanceSettings={governanceSettings}
            knowledgeGraph={knowledgeGraph}
            onAddAuditRecord={onAddAuditRecord}
            onBackToDashboard={() => onNavigateTab ? onNavigateTab('operational_dashboard') : undefined}
          />
        </div>
      )}

      {activeTab === 'cyber_brain' && (
        <div className="mt-4">
          <VelatrixAosHeroCyberBrain
            onNavigate={(tab) => onNavigateTab ? onNavigateTab(tab) : undefined}
            activeTab="neural_core"
          />
        </div>
      )}
    </div>
  );
};

export default NeuralCoreView;
