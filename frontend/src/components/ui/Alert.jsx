import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import Icon from './Icon';

export default function Alert({
  variant = 'error', // 'error' | 'success' | 'warning' | 'info'
  title,
  message,
  children,
  action,
  onClose,
  className = '',
}) {
  const styles = {
    error: {
      container: 'bg-status-red-bg border-status-red-border text-status-red-text',
      icon: AlertCircle,
    },
    success: {
      container: 'bg-status-green-bg border-status-green-border text-status-green-text',
      icon: CheckCircle2,
    },
    warning: {
      container: 'bg-status-amber-bg border-status-amber-border text-status-amber-text',
      icon: AlertTriangle,
    },
    info: {
      container: 'bg-status-blue-bg border-status-blue-border text-status-blue-text',
      icon: Info,
    },
  };

  const config = styles[variant] || styles.error;
  const IconComponent = config.icon;

  const content = message || children;

  return (
    <div
      className={`p-4 rounded-lg border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs ${config.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <Icon icon={IconComponent} size="sm" className="mt-0.5" />
        <div className="space-y-1 flex-1 min-w-0">
          {title && <h4 className="font-semibold text-ink leading-snug">{title}</h4>}
          {content && <div className="leading-relaxed break-words">{content}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer inline-flex items-center justify-center shrink-0"
            aria-label="Tutup alert"
          >
            <Icon icon={X} size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}
