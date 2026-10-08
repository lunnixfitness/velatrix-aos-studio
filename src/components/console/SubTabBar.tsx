import React from 'react';

export interface SubTabItem {
  id: string;
  label: string;
  count?: string | number;
  badge?: string;
  disabled?: boolean;
}

export interface SubTabBarProps {
  tabs: SubTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const SubTabBar: React.FC<SubTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`border-b border-hairline flex items-center gap-1 sm:gap-4 overflow-x-auto scrollbar-none ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
            className={`py-2.5 px-3 text-[13px] font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-ink-mute hover:text-ink hover:border-hairline-strong'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10.5px] font-mono px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-accent-soft text-accent font-bold'
                    : 'bg-surface text-ink-soft'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface text-ink-soft border border-hairline">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
