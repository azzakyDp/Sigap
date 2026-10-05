import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Send } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { resolveReportApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';

export default function ResolveReportModal({ isOpen, onClose, report, onSuccess }) {
  const [decision, setDecision] = useState('RESOLVED');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDecision('RESOLVED');
      setCatatan('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!catatan.trim() || catatan.trim().length < 5) {
      setError('Catatan penyelesaian wajib diisi minimal 5 karakter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        decision,
        catatan: catatan.trim(),
      };

      const updatedReport = await resolveReportApi(report.id, payload);
      if (onSuccess) onSuccess(updatedReport);
      onClose();
    } catch (err) {
      console.error('Gagal menyelesaikannya penanganan:', err);
      setError(getErrorMessage(err, 'Gagal menyelesaikan penanganan laporan.'));
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Selesaikan Penanganan Laporan #${report.nomor_laporan}`}
      subtitle="Tentukan hasil akhir penanganan lapangan"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-ink">
        {error && (
          <div className="p-3.5 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Decision Selection */}
        <div>
          <label className="block text-xs font-bold text-ink mb-2">
            Pilih Status Akhir Penanganan <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('RESOLVED')}
              className={`p-3.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                decision === 'RESOLVED'
                  ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20'
                  : 'border-border bg-surface text-ink hover:bg-background'
              }`}
            >
              <CheckCircle2 className="w-6 h-6 text-primary" />
              <span>RESOLVED (Selesai)</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('UNRESOLVED')}
              className={`p-3.5 rounded-lg border text-xs font-bold flex flex-col items-center gap-2 transition-all cursor-pointer ${
                decision === 'UNRESOLVED'
                  ? 'border-status-amber-border bg-status-amber-bg text-status-amber-text ring-2 ring-status-amber-border/30'
                  : 'border-border bg-surface text-ink hover:bg-background'
              }`}
            >
              <AlertTriangle className="w-6 h-6 text-status-amber-text" />
              <span>UNRESOLVED (Belum Selesai)</span>
            </button>
          </div>
        </div>

        {/* UNRESOLVED Info Banner */}
        {decision === 'UNRESOLVED' && (
          <div className="p-3 bg-status-amber-bg border border-status-amber-border rounded-lg text-status-amber-text text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Penanganan Belum Selesai (UNRESOLVED)
            </p>
            <p className="text-status-amber-text/90">
              Jika ditandai UNRESOLVED, Verifikator masih dapat menugaskan kembali laporan ini kepada petugas lain atau tim pendukung tambahan.
            </p>
          </div>
        )}

        {/* Catatan / Ringkasan Penyelesaian */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Catatan Ringkasan Penyelesaian <span className="text-danger">*</span>
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder={
              decision === 'RESOLVED'
                ? 'Berikan ulasan singkat mengenai penyelesaian masalah di lokasi...'
                : 'Jelaskan kendala atau alasan penanganan belum dapat diselesaikan...'
            }
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            required
            minLength={5}
          />
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            fullWidth={true}
            className="sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={Send}
            fullWidth={true}
            className="sm:w-auto"
          >
            Kirim Hasil Penanganan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
