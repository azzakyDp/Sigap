import React from 'react';
import Input from '../ui/Input';
import { Sliders } from 'lucide-react';

export default function DynamicFieldsForm({ fields = [], values = {}, onChange, errors = {} }) {
  if (!fields || fields.length === 0) {
    return null;
  }

  const handleFieldChange = (fieldName, val) => {
    if (onChange) {
      onChange(fieldName, val);
    }
  };

  return (
    <div className="mb-6 p-4 bg-background border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/60 text-ink font-bold text-sm">
        <Sliders className="w-4 h-4 text-primary" />
        <span>Informasi Tambahan Kategori</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const fieldValue = values[field.field_name] || '';
          const fieldError = errors[field.field_name];
          const isRequired = field.is_required;

          if (field.field_type === 'textarea') {
            return (
              <div key={field.id} className="sm:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {field.field_name} {isRequired && <span className="text-danger">*</span>}
                </label>
                <textarea
                  value={fieldValue}
                  onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
                  placeholder={`Isi ${field.field_name}`}
                  rows={3}
                  className={`w-full px-3.5 py-2.5 bg-surface border rounded-md text-ink placeholder-muted text-sm focus:outline-none focus:ring-1 transition-colors ${
                    fieldError ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary'
                  }`}
                />
                {fieldError && <p className="mt-1 text-xs text-danger font-medium">{fieldError}</p>}
              </div>
            );
          }

          return (
            <Input
              key={field.id}
              label={field.field_name}
              type={field.field_type === 'number' ? 'number' : 'text'}
              name={field.field_name}
              value={fieldValue}
              onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
              error={fieldError}
              required={isRequired}
              placeholder={`Isi ${field.field_name}`}
            />
          );
        })}
      </div>
    </div>
  );
}
