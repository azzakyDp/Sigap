import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
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
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px] gap-1.5',
    md: 'text-sm px-4 py-2 min-h-[40px] gap-2',
    lg: 'text-base px-6 py-2.5 min-h-[44px] gap-2.5',
  };

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-white active:bg-primary-hover shadow-xs',
    secondary:
      'bg-surface border border-border-strong text-ink hover:bg-slate-100 hover:border-slate-300 active:bg-slate-200 shadow-xs',
    ghost:
      'bg-transparent text-ink-soft hover:bg-slate-100 hover:text-ink',
    danger:
      'bg-danger hover:bg-danger-hover text-white active:bg-danger-hover shadow-xs',
    pill:
      'bg-primary hover:bg-primary-hover text-white !rounded-full active:bg-primary-hover shadow-xs',
  };

  const widthStyle = fullWidth ? 'w-full' : '';
  const sizeStyle = sizes[size] || sizes.md;
  const variantStyle = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyle} ${variantStyle} ${widthStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin text-current`} strokeWidth={1.75} />
          <span>Memproses...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-current shrink-0`} strokeWidth={1.75} />}
          {children}
        </>
      )}
    </button>
  );
}
