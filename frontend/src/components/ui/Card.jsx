import React from 'react';

export default function Card({
  title,
  subtitle,
  children,
  variant = 'bordered',
  headerBordered = false,
  className = '',
  headerAction,
}) {
  const variants = {
    bordered: 'bg-surface border border-border rounded-lg p-6',
    flat: 'bg-surface border border-border/50 rounded-lg p-6',
    dense: 'bg-surface border border-border rounded-lg p-4',
  };

  const cardStyle = variants[variant] || variants.bordered;
  const headerBorderClass = headerBordered ? 'border-b border-border/60 pb-4 mb-5' : 'mb-4';

  return (
    <div className={`${cardStyle} ${className}`}>
      {(title || subtitle || headerAction) && (
        <div className={`flex items-start justify-between ${headerBorderClass}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
