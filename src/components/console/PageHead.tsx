import React from 'react';

export interface PageHeadProps {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHead: React.FC<PageHeadProps> = ({
  eyebrow,
  title,
  description,
  actions,
  className = ''
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 mb-1">
        <div>
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft mb-1 font-sans">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif font-normal text-2xl sm:text-3xl text-ink leading-tight tracking-tight">
            {title}
          </h1>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {description && (
        <div className="text-[13.5px] text-ink-mute leading-relaxed">
          {description}
        </div>
      )}
    </div>
  );
};
