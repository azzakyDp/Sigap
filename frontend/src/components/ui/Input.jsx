import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full mb-4">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full px-3.5 py-2 bg-surface border rounded-md text-ink placeholder-muted text-sm focus:outline-none focus:ring-1 transition-colors duration-150 ${
            isPassword ? 'pr-10' : ''
          } ${
            error
              ? 'border-danger focus:ring-danger focus:border-danger'
              : 'border-border focus:ring-primary focus:border-primary'
          } ${disabled ? 'bg-background opacity-60 cursor-not-allowed' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-soft hover:text-ink focus:outline-none cursor-pointer transition-colors"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-ink-soft">{helperText}</p>}
    </div>
  );
}
