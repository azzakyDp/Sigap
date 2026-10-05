import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  fullWidth = false,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md text-sm px-4 py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs gap-2';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-white focus:ring-primary active:bg-primary-hover',
    secondary:
      'bg-surface border border-border text-ink hover:bg-background focus:ring-primary active:bg-border/30',
    danger:
      'bg-danger hover:bg-danger-hover text-white focus:ring-danger active:bg-danger-hover',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 text-current shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
}
