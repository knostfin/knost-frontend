import React from 'react';
import Button from './Button';

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'Add your first entry to get started.',
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col items-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
        {icon || (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m6-6H6" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
