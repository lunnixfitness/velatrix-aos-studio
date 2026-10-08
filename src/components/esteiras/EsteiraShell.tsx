import React, { useState } from 'react';
import { SubTabBar } from '../console/SubTabBar';
import { RiskShieldPanel } from '../risk/RiskShieldPanel';
import { ApprovalQueueView } from '../approval/ApprovalQueueView';
import { JurimetriaPanel } from '../enterprise/JurimetriaPanel';
import type { Esteira } from '../../enterprise/riskShield.ts';

// Antecipação (precatórios & RPVs) — carregada sob demanda, só na esteira Precatória.
const AntecipacaoView = React.lazy(() => import('../antecipacao/AntecipacaoView').then((m) => ({ default: m.AntecipacaoView })));

/**
 * Envolve a tela existente de cada esteira com as sub-abas enterprise
 * (Shield de Risco · Fila de Aprovação) sem alterar o componente original.
 */
export interface EsteiraShellProps {
  esteira: Esteira;
  children: React.ReactNode;
  activeSubTab?: string;
  onSubTabChange?: (id: string) => void;
}

export const EsteiraShell: React.FC<EsteiraShellProps> = ({ esteira, children, activeSubTab, onSubTabChange }) => {
  const [local, setLocal] = useState('esteira');
  const tab = activeSubTab ?? local;
  const setTab = onSubTabChange ?? setLocal;
  return (
    <div>
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8">
        <SubTabBar
          tabs={[
            { id: 'esteira', label: 'Esteira' },
            { id: 'shield', label: 'Shield de Risco' },
            ...(esteira === 'PRECATORIA' ? [{ id: 'score', label: 'Score & VPL' }] : []),
            ...(esteira === 'PRECATORIA' ? [{ id: 'antecipacao', label: 'Antecipação' }] : []),
            { id: 'fila', label: 'Fila de Aprovação' },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        />
      </div>
      {tab === 'esteira' && children}
      {tab !== 'esteira' && (
        <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
          {tab === 'shield' && <RiskShieldPanel esteira={esteira} />}
          {tab === 'score' && <JurimetriaPanel />}
          {tab === 'antecipacao' && (
            <React.Suspense fallback={<div className="py-10 text-center text-[13px] text-ink-mute">Carregando…</div>}>
              <AntecipacaoView />
            </React.Suspense>
          )}
          {tab === 'fila' && <ApprovalQueueView esteira={esteira} />}
        </div>
      )}
    </div>
  );
};

export default EsteiraShell;
