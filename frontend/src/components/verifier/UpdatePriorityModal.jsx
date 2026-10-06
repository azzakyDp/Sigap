import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { updatePriorityApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';

export default function UpdatePriorityModal({ isOpen, onClose, report, onSuccess }) {
  const [priority, setPriority] = useState('MEDIUM');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && report) {
      setPriority(report.priority || 'MEDIUM');
      setCatatan('');
      setError(null);
    }
  }, [isOpen, report]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        priority,
        catatan: catatan.trim() || undefined,
      };

      const updatedReport = await updatePriorityApi(report.id, payload);
      if (onSuccess) onSuccess(updatedReport);
      onClose();
    } catch (err) {
      console.error('Gagal memperbarui prioritas:', err);
      setError(getErrorMessage(err, 'Gagal mengubah prioritas laporan.'));
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  const priorities = [
    { value: 'LOW', label: 'Low (Rendah)' },
    { value: 'MEDIUM', label: 'Medium (Sedang)' },
    { value: 'HIGH', label: 'High (Tinggi)' },
    { value: 'URGENT', label: 'Urgent (Darurat)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ubah Prioritas Laporan #${report.nomor_laporan}`}
      subtitle="Sesuaikan prioritas penanganan pengaduan laporan ini"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <Icon icon={AlertCircle} size="sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Priority Selection */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-2">
            Pilih Prioritas Baru <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {priorities.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPriority(item.value)}
                className={`p-3 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  priority === item.value
                    ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20'
                    : 'border-border bg-surface text-ink hover:bg-background'
                }`}
              >
                <span>{item.label}</span>
                <Badge type="priority" value={item.value} />
              </button>
            ))}
          </div>
        </div>

        {/* Catatan (Internal) */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">
            Catatan Internal (Opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Berikan alasan perubahan prioritas untuk rekaman internal..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
          />
          <p className="text-xs text-ink-soft mt-1">
            Catatan ini hanya tersimpan untuk keperluan internal staf.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Simpan Prioritas
          </Button>
        </div>
      </form>
    </Modal>
  );
}
