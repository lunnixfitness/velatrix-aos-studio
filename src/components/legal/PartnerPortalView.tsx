import React from 'react';
import { CorrespondentesPanel } from './CorrespondentesPanel';
import { AuditRecord, NavigationTab } from '../../types/aos';

/**
 * P23 — "Parceiros & Repasses" virou "Correspondentes & Parcerias".
 * O antigo PartnerNetworkSplitPanel (split Velatrix × parceiro sobre honorários)
 * saiu da navegação: a Velatrix não participa de honorários (Estatuto da
 * Advocacia, art. 34, III/IV; Código de Ética). O arquivo legado permanece
 * no repositório apenas como referência histórica.
 */
interface PartnerPortalViewProps {
  onBackToDashboard?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const PartnerPortalView: React.FC<PartnerPortalViewProps> = () => (
  <div className="mx-auto w-full max-w-6xl p-4 lg:p-8">
    <CorrespondentesPanel />
  </div>
);
