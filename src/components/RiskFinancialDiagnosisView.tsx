import React from 'react';
import { SupportedLanguage, SupportedCurrency, NavigationTab, AuditRecord } from '../types/aos';
import { UnifiedDiagnosisView } from './diagnosis/UnifiedDiagnosisView';

interface RiskFinancialDiagnosisViewProps {
  onInjectScenario: (scenarioName: string) => void;
  language: SupportedLanguage;
  currency: SupportedCurrency;
  onBackToDashboard: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
}

export const RiskFinancialDiagnosisView: React.FC<RiskFinancialDiagnosisViewProps> = ({
  onInjectScenario,
  language,
  currency,
  onBackToDashboard,
  onNavigateTab,
  onAddAuditRecord
}) => {
  return (
    <UnifiedDiagnosisView
      language={language}
      currency={currency}
      onBackToDashboard={onBackToDashboard}
      onNavigateTab={onNavigateTab}
      onAddAuditRecord={onAddAuditRecord}
      onInjectScenario={onInjectScenario}
    />
  );
};
