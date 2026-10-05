import React from 'react';

export default function Card({ title, subtitle, children, className = '', headerAction }) {
  return (
    <div className={`bg-surface border border-border rounded-lg p-6 shadow-xs ${className}`}>
      {(title || subtitle) && (
        <div className="mb-5 pb-4 border-b border-border/60 flex items-start justify-between">
          <div>
            {title && <h3 className="text-lg font-bold text-ink tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
