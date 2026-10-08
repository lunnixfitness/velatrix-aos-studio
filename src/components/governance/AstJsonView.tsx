import React, { useState } from 'react';
import { PageHead } from '../console/PageHead';
import { SubTabBar, SubTabItem } from '../console/SubTabBar';
import { AstJsonInspector } from '../AstJsonInspector';
import { ZeroGuiCardRenderer } from '../ZeroGuiCardRenderer';
import { CriticalDecisionCardAST } from '../../types/aos';

interface AstJsonViewProps {
  ast: CriticalDecisionCardAST | null;
  onApproveMultiSig?: () => void;
  onAdjustParameters?: (params: any) => void;
  isProcessing?: boolean;
}

export const AstJsonView: React.FC<AstJsonViewProps> = ({
  ast,
  onApproveMultiSig,
  onAdjustParameters,
  isProcessing
}) => {
  const [activeTab, setActiveTab] = useState<string>('card_renderer');

  const tabs: SubTabItem[] = [
    { id: 'card_renderer', label: 'Zero-GUI Decision Card', badge: 'HUD Visual' },
    { id: 'ast_json_tree', label: 'Árvore Sintática Abstrata (AST JSON)', badge: 'Auditável' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6">
      <PageHead
        eyebrow="Integrações · Arquitetura Zero-GUI"
        title="AST JSON · Árvore Sintática de Decisão Autônoma"
        description="Representação intermediária estrita emitida pelo enxame neural para cada deliberação operacional, contendo invariantes validadas, análise de tensão e hashes de assinatura multi-sig."
      />

      <SubTabBar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'card_renderer' && (
        <div className="mt-4">
          <ZeroGuiCardRenderer
            ast={ast}
            onApproveMultiSig={onApproveMultiSig || (() => {})}
            onAdjustParameters={onAdjustParameters || (() => {})}
            isProcessing={isProcessing}
          />
        </div>
      )}

      {activeTab === 'ast_json_tree' && (
        <div className="mt-4">
          <AstJsonInspector
            ast={ast}
            onClose={() => {}}
          />
        </div>
      )}
    </div>
  );
};

export default AstJsonView;
