import React from 'react';

/**
 * Shared Icon component enforcing SIGAP Design System rules:
 * - 16px inline (size="sm"), 20px navigation (size="nav")
 * - Uniform strokeWidth = 1.75
 * - Color follows text (currentColor)
 * - Flexbox centered container, no text-align dependency
 */
export default function Icon({
  icon: Component,
  size = 'sm',
  className = '',
  strokeWidth = 1.75,
  ...props
}) {
  if (!Component) return null;

  const pixelSize = typeof size === 'number' ? size : size === 'nav' ? 20 : 16;
  const sizeClass = pixelSize === 20 ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <Component
        className={`${sizeClass} text-current shrink-0`}
        strokeWidth={strokeWidth}
        {...props}
      />
    </span>
  );
}
