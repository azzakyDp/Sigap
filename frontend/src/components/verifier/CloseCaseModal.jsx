import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { closeReportApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';

export default function CloseCaseModal({ isOpen, onClose, report, onSuccess }) {
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setCatatan('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        catatan: catatan.trim() || undefined,
      };

      const updatedReport = await closeReportApi(report.id, payload);
      if (onSuccess) onSuccess(updatedReport);
      onClose();
    } catch (err) {
      console.error('Gagal menutup kasus:', err);
      setError(getErrorMessage(err, 'Gagal menutup kasus pengaduan laporan.'));
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tutup Kasus Laporan #${report.nomor_laporan}`}
      subtitle="Konfirmasi penutupan akhir kasus pengaduan"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-background rounded-lg border border-border text-xs text-ink space-y-2">
          <p className="font-bold flex items-center gap-1.5 text-primary">
            <Lock className="w-4 h-4" />
            Konfirmasi Penutupan Kasus
          </p>
          <p className="text-ink-soft">
            Kasus pengaduan ini akan ditutup secara permanen (berstatus <strong>CLOSED</strong>). Pastikan seluruh tindakan penanganan dan evaluasi telah selesai dilakukan.
          </p>
        </div>

        {/* Catatan Penutupan */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Catatan Penutupan Kasus (Opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Berikan ringkasan evaluasi atau catatan penutupan kasus..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon={Lock}>
            Tutup Kasus
          </Button>
        </div>
      </form>
    </Modal>
  );
}
