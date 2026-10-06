import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import Icon from '../components/ui/Icon';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', message, title, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastIcons = {
    success: <Icon icon={CheckCircle2} size="sm" className="text-status-green-text shrink-0" />,
    error: <Icon icon={AlertCircle} size="sm" className="text-danger shrink-0" />,
    warning: <Icon icon={AlertTriangle} size="sm" className="text-status-amber-text shrink-0" />,
    info: <Icon icon={Info} size="sm" className="text-primary shrink-0" />,
  };

  const toastBorders = {
    success: 'border-status-green-border bg-surface text-ink',
    error: 'border-status-red-border bg-surface text-ink',
    warning: 'border-status-amber-border bg-surface text-ink',
    info: 'border-status-blue-border bg-surface text-ink',
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-lg border shadow-lg flex items-start justify-between gap-3 transition-all ${
              toastBorders[t.type] || toastBorders.info
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {toastIcons[t.type] || toastIcons.info}
              <div className="space-y-0.5 text-xs sm:text-sm">
                {t.title && <h5 className="font-semibold text-ink">{t.title}</h5>}
                <p className="text-ink text-xs leading-relaxed">{t.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="p-1 text-ink-soft hover:text-ink rounded-md transition-colors shrink-0 cursor-pointer inline-flex items-center justify-center"
              aria-label="Tutup notifikasi"
            >
              <Icon icon={X} size="sm" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      addToast: () => {},
      removeToast: () => {},
    };
  }
  return context;
}
