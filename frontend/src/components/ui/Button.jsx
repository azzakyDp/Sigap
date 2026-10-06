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
    'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0';

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
    md: 'text-sm px-4 py-2 h-10 gap-2',
  };

  const variants = {
    primary:
      'bg-primary hover:bg-primary-hover text-white focus:ring-primary active:bg-primary-hover shadow-xs',
    secondary:
      'bg-surface border border-border-strong text-ink hover:bg-background focus:ring-primary active:bg-border/30 shadow-xs',
    ghost:
      'bg-transparent text-ink-soft hover:bg-background hover:text-ink focus:ring-primary',
    danger:
      'bg-danger hover:bg-danger-hover text-white focus:ring-danger active:bg-danger-hover shadow-xs',
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
