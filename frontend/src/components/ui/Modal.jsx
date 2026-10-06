import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';

    // Focus first focusable element inside modal
    const focusModal = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = Array.from(
          modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusModal);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);

      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = title ? 'modal-title' : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in"
      onClick={() => onClose && onClose()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-surface border border-border rounded-lg shadow-xl w-full ${maxWidth} flex flex-col overflow-hidden max-h-[90vh] outline-none`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between shrink-0">
          <div>
            {title && (
              <h3 id={titleId} className="text-base font-semibold text-ink">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-ink-soft hover:text-ink p-1.5 rounded-md hover:bg-background transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5 text-current" strokeWidth={1.75} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 text-ink text-sm">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-background border-t border-border/60 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
