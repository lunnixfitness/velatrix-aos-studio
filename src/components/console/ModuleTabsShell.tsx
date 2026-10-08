import React, { useState } from 'react';
import { SubTabBar } from './SubTabBar';

/** Acrescenta sub-abas a um módulo existente sem alterar o componente original. */
export interface ModuleTab { id: string; label: string; badge?: string; render: () => React.ReactNode; }

export interface ModuleTabsShellProps {
  baseLabel: string;
  tabs: ModuleTab[];
  children: React.ReactNode;
  activeSubTab?: string;
  onSubTabChange?: (id: string) => void;
}

export const ModuleTabsShell: React.FC<ModuleTabsShellProps> = ({ baseLabel, tabs, children, activeSubTab, onSubTabChange }) => {
  const [local, setLocal] = useState('base');
  const tab = activeSubTab ?? local;
  const setTab = onSubTabChange ?? setLocal;
  const extra = tabs.find((t) => t.id === tab);
  return (
    <div>
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-8">
        <SubTabBar tabs={[{ id: 'base', label: baseLabel }, ...tabs.map((t) => ({ id: t.id, label: t.label, badge: t.badge }))]} activeTab={tab} onTabChange={setTab} />
      </div>
      {!extra && children}
      {extra && <div className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">{extra.render()}</div>}
    </div>
  );
};

export default ModuleTabsShell;
