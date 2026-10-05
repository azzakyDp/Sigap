import React from 'react';

export default function Input({
  label,
  error,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  helperText,
  ...props
}) {
  const inputId = id || name;

  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-2 bg-surface border rounded-md text-ink placeholder-muted text-sm focus:outline-none focus:ring-1 transition-colors duration-150 ${
          error
            ? 'border-danger focus:ring-danger focus:border-danger'
            : 'border-border focus:ring-primary focus:border-primary'
        } ${disabled ? 'bg-background opacity-60 cursor-not-allowed' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-ink-soft">{helperText}</p>}
    </div>
  );
}
