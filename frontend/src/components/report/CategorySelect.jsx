import React, { useEffect, useState } from 'react';
import { getCategoriesApi } from '../../api/categories';
import { Tag, Loader2 } from 'lucide-react';

export default function CategorySelect({ value, onChange, error, disabled = false }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategoriesApi();
        setCategories(data || []);
      } catch (err) {
        setFetchError('Gagal memuat kategori pengaduan.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSelectChange = (e) => {
    const selectedId = Number(e.target.value);
    const categoryObj = categories.find((cat) => cat.id === selectedId) || null;
    if (onChange) {
      onChange(categoryObj);
    }
  };

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
        <Tag className="w-4 h-4 text-primary" /> Kategori Pengaduan <span className="text-danger">*</span>
      </label>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-ink-soft p-2.5 border border-border rounded-md bg-background">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span>Memuat daftar kategori...</span>
        </div>
      ) : fetchError ? (
        <div className="text-xs text-danger p-2.5 border border-danger/30 bg-danger-light rounded-md">
          {fetchError}
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={handleSelectChange}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 bg-surface border rounded-md text-ink text-sm focus:outline-none focus:ring-1 transition-colors ${
            error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary'
          } ${disabled ? 'bg-background opacity-60 cursor-not-allowed' : ''}`}
        >
          <option value="">-- Pilih Kategori Gangguan --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nama_kategori} (Prioritas Default: {cat.default_priority})
            </option>
          ))}
        </select>
      )}

      {error && <p className="mt-1 text-xs text-danger font-medium">{error}</p>}
    </div>
  );
}
