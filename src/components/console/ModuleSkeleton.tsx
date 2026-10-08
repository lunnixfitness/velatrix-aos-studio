import React from 'react';

export const ModuleSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-3 w-32 bg-surface rounded" />
        <div className="h-8 w-72 bg-surface rounded" />
        <div className="h-4 w-96 max-w-full bg-surface rounded" />
      </div>

      {/* Tabs / filters skeleton */}
      <div className="h-10 w-full bg-surface/50 rounded-lg border border-hairline" />

      {/* Grid cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-surface rounded-xl border border-hairline p-4 space-y-3">
          <div className="h-4 w-24 bg-canvas rounded" />
          <div className="h-8 w-36 bg-canvas rounded" />
          <div className="h-3 w-48 bg-canvas rounded" />
        </div>
        <div className="h-32 bg-surface rounded-xl border border-hairline p-4 space-y-3">
          <div className="h-4 w-24 bg-canvas rounded" />
          <div className="h-8 w-36 bg-canvas rounded" />
          <div className="h-3 w-48 bg-canvas rounded" />
        </div>
        <div className="h-32 bg-surface rounded-xl border border-hairline p-4 space-y-3">
          <div className="h-4 w-24 bg-canvas rounded" />
          <div className="h-8 w-36 bg-canvas rounded" />
          <div className="h-3 w-48 bg-canvas rounded" />
        </div>
      </div>

      {/* Large content area skeleton */}
      <div className="h-80 bg-surface rounded-xl border border-hairline p-6" />
    </div>
  );
};

export default ModuleSkeleton;
