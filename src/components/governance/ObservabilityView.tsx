import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { EventStreamBar } from '../EventStreamBar';
import { FeedbackLoopManager } from '../FeedbackLoopManager';
import { SemanticEvent, BusinessPreferenceLearned, SupportedLanguage, SupportedCurrency } from '../../types/aos';
import { ScenarioDefinition } from '../../data/mockScenarios';

interface ObservabilityViewProps {
  currentEvent?: SemanticEvent | null;
  onSelectScenario?: (scenario: ScenarioDefinition) => void;
  onSubmitCustomEvent?: (eventText: string, rawPayload?: Record<string, any>) => void;
  isProcessing?: boolean;
  language?: SupportedLanguage;
  currency?: SupportedCurrency;
  onOpenDiagnosisSimulator?: () => void;
  learnedPreferences?: BusinessPreferenceLearned[];
  onResetPreferences?: () => void;
}

export const ObservabilityView: React.FC<ObservabilityViewProps> = ({
  currentEvent = null,
  onSelectScenario = () => {},
  onSubmitCustomEvent = () => {},
  isProcessing = false,
  language = 'pt',
  currency = 'BRL',
  onOpenDiagnosisSimulator = () => {},
  learnedPreferences = [],
  onResetPreferences = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<string>('stream');

  const tabs: SubTabItem[] = [
    { id: 'stream', label: 'Event Stream Bar & Telemetria', badge: 'Ao Vivo' },
    { id: 'feedback_loop', label: 'Feedback Loop & Aprendizado', badge: `${learnedPreferences.length} Regras` }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Governança · Monitoramento de Borda"
        title="Observabilidade & Telemetria em Tempo Real"
        description="Monitoramento contínuo do barramento semântico, eventos operacionais de alta frequência e motor de aprendizado por preferências contínuas de negócio."
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'stream' && (
        <div className="space-y-4">
          <EventStreamBar
            currentEvent={currentEvent}
            onSelectScenario={onSelectScenario}
            onSubmitCustomEvent={onSubmitCustomEvent}
            isProcessing={isProcessing}
            language={language}
            currency={currency}
            onOpenDiagnosisSimulator={onOpenDiagnosisSimulator}
          />
        </div>
      )}

      {activeTab === 'feedback_loop' && (
        <div className="mt-4">
          <FeedbackLoopManager
            preferences={learnedPreferences}
            onResetPreferences={onResetPreferences}
          />
        </div>
      )}
    </div>
  );
};

export default ObservabilityView;
