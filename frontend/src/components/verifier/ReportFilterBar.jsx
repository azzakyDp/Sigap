import React, { useState, useEffect } from 'react';

import Button from '../ui/Button';
import { getCategoriesApi } from '../../api/categories';
import { getStaffStatusLabel } from '../../utils/statusColors';

export default function ReportFilterBar({ filters = {}, onFilterChange, onReset }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const data = await getCategoriesApi();
        setCategories(data || []);
      } catch (err) {
        console.error('Gagal mengambil daftar kategori untuk filter:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [key]: value || undefined,
      });
    }
  };

  const statusOptions = [
    'PENDING_VERIFICATION',
    'VERIFIED',
    'ASSIGNED',
    'IN_PROGRESS',
    'UNRESOLVED',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
    'DUPLICATE',
  ];

  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.category_id) ||
    Boolean(filters.start_date) ||
    Boolean(filters.end_date);

  return (
    <div className="bg-surface p-4 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-bold text-ink text-sm">
          <span>Filter & Pencarian Laporan</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onReset}
            className="text-xs py-1"
          >
            Reset Filter
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Status Filter */}
        <div>
          <label className="block text-ink-soft font-semibold mb-1">
            Status Laporan
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          >
            <option value="">-- Semua Status --</option>
            {statusOptions.map((st) => (
              <option key={st} value={st}>
                {getStaffStatusLabel(st)} ({st})
              </option>
            ))}
          </select>
        </div>

        {/* Kategori Filter */}
        <div>
          <label className="block text-ink-soft font-semibold mb-1">
            Kategori Pengaduan
          </label>
          <select
            value={filters.category_id || ''}
            onChange={(e) => handleChange('category_id', e.target.value ? parseInt(e.target.value, 10) : '')}
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-ink"
            disabled={loadingCategories}
          >
            <option value="">-- Semua Kategori --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nama_kategori}
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal Awal Filter */}
        <div>
          <label className="block text-ink-soft font-semibold mb-1">
            Tanggal Awal
          </label>
          <input
            type="date"
            value={filters.start_date ? filters.start_date.split('T')[0] : ''}
            onChange={(e) =>
              handleChange(
                'start_date',
                e.target.value ? `${e.target.value}T00:00:00` : ''
              )
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          />
        </div>

        {/* Tanggal Akhir Filter */}
        <div>
          <label className="block text-ink-soft font-semibold mb-1">
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={filters.end_date ? filters.end_date.split('T')[0] : ''}
            onChange={(e) =>
              handleChange(
                'end_date',
                e.target.value ? `${e.target.value}T23:59:59` : ''
              )
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-ink"
          />
        </div>
      </div>
    </div>
  );
}
