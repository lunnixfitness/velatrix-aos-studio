import React from 'react';
import { SupportedLanguage, SupportedCurrency, NavigationTab, AuditRecord } from '../../types/aos';
import { UnifiedDiagnosisView } from './UnifiedDiagnosisView';

interface ExpressDiagnosisViewProps {
  language: SupportedLanguage;
  currency: SupportedCurrency;
  onBackToDashboard: () => void;
  onNavigateToFullSimulator?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onAddAuditRecord?: (record: AuditRecord) => void;
  onInjectScenario?: (scenarioName: string) => void;
}

export const ExpressDiagnosisView: React.FC<ExpressDiagnosisViewProps> = ({
  language,
  currency,
  onBackToDashboard,
  onNavigateTab,
  onAddAuditRecord,
  onInjectScenario
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
