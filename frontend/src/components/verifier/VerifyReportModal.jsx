import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Copy, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { verifyReportApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';
import { useToast } from '../../context/ToastContext';

export default function VerifyReportModal({ isOpen, onClose, report, onSuccess }) {
  const { addToast } = useToast();
  const [decision, setDecision] = useState('VERIFIED');
  const [catatan, setCatatan] = useState('');
  const [duplicateId, setDuplicateId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDecision('VERIFIED');
      setCatatan('');
      setDuplicateId('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if ((decision === 'REJECTED' || decision === 'DUPLICATE') && !catatan.trim()) {
      setError('Catatan wajib diisi untuk verifikasi REJECTED atau DUPLICATE.');
      return;
    }

    if (decision === 'DUPLICATE') {
      const parsedId = parseInt(duplicateId, 10);
      if (!duplicateId || isNaN(parsedId) || parsedId <= 0) {
        setError('ID laporan rujukan wajib berupa angka positif.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        decision,
        catatan: catatan.trim(),
        duplicate_of_report_id: decision === 'DUPLICATE' ? parseInt(duplicateId, 10) : null,
      };

      const updatedReport = await verifyReportApi(report.id, payload);
      addToast({
        type: 'success',
        title: 'Verifikasi Berhasil',
        message: `Laporan #${report.nomor_laporan} berhasil diverifikasi (${decision}).`,
      });
      if (onSuccess) onSuccess(updatedReport);
      onClose();
    } catch (err) {
      console.error('Gagal verifikasi laporan:', err);
      setError(getErrorMessage(err, 'Gagal memproses verifikasi laporan.'));
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Verifikasi Laporan #${report.nomor_laporan}`}
      subtitle="Tentukan hasil verifikasi pengaduan laporan ini"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="p-3 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keputusan Selection */}
        <div>
          <label className="block text-xs font-bold text-ink mb-2">
            Keputusan Verifikasi <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('VERIFIED')}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'VERIFIED'
                  ? 'border-primary bg-primary-light text-primary ring-2 ring-primary/20'
                  : 'border-border bg-surface text-ink hover:bg-background'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>VERIFIED</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REJECTED')}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'REJECTED'
                  ? 'border-danger bg-status-red-bg text-danger ring-2 ring-danger/20'
                  : 'border-border bg-surface text-ink hover:bg-background'
              }`}
            >
              <XCircle className="w-5 h-5 text-danger" />
              <span>REJECTED</span>
            </button>

            <button
              type="button"
              onClick={() => setDecision('DUPLICATE')}
              className={`p-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                decision === 'DUPLICATE'
                  ? 'border-status-orange-border bg-status-orange-bg text-status-orange-text ring-2 ring-status-orange-border/30'
                  : 'border-border bg-surface text-ink hover:bg-background'
              }`}
            >
              <Copy className="w-5 h-5 text-status-orange-text" />
              <span>DUPLICATE</span>
            </button>
          </div>
        </div>

        {/* ID Rujukan if DUPLICATE */}
        {decision === 'DUPLICATE' && (
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              ID Laporan Rujukan <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={duplicateId}
              onChange={(e) => setDuplicateId(e.target.value)}
              placeholder="Contoh: 12"
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
              required
            />
            <p className="text-[11px] text-ink-soft mt-1">
              ID laporan rujukan dapat ditemukan di header detail laporan yang dirujuk (misalnya ID: 12).
            </p>
          </div>
        )}

        {/* Catatan / Alasan */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Catatan / Alasan Verifikasi {(decision === 'REJECTED' || decision === 'DUPLICATE') && <span className="text-danger">*</span>}
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder={
              decision === 'VERIFIED'
                ? 'Catatan verifikasi (opsional)...'
                : 'Berikan penjelasan alasan penolakan/duplikat...'
            }
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            required={decision === 'REJECTED' || decision === 'DUPLICATE'}
          />
          <p className="text-[11px] font-medium text-primary mt-1">
            Catatan ini terlihat oleh pelapor di timeline publik.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button
            type="submit"
            variant={decision === 'REJECTED' ? 'danger' : 'primary'}
            loading={loading}
          >
            {decision === 'VERIFIED' ? 'Setujui Verifikasi' : decision === 'REJECTED' ? 'Tolak Laporan' : 'Tandai Duplikat'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
