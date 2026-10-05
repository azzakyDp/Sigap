import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

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
      iconColor: 'text-danger',
    },
    success: {
      container: 'bg-status-green-bg border-status-green-border text-status-green-text',
      icon: CheckCircle2,
      iconColor: 'text-status-green-text',
    },
    warning: {
      container: 'bg-status-amber-bg border-status-amber-border text-status-amber-text',
      icon: AlertTriangle,
      iconColor: 'text-status-amber-text',
    },
    info: {
      container: 'bg-status-blue-bg border-status-blue-border text-status-blue-text',
      icon: Info,
      iconColor: 'text-primary',
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
        <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div className="space-y-1 flex-1 min-w-0">
          {title && <h4 className="font-bold text-ink leading-snug">{title}</h4>}
          {content && <div className="leading-relaxed break-words">{content}</div>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Tutup alert"
          >
            <X className="w-4 h-4 text-current" />
          </button>
        )}
      </div>
    </div>
  );
}
