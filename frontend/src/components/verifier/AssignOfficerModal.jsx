import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { getOfficersApi, assignReportApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';

export default function AssignOfficerModal({ isOpen, onClose, report, onSuccess }) {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedOfficerId('');
      setCatatan('');
      setError(null);
      fetchOfficers();
    }
  }, [isOpen]);

  const fetchOfficers = async () => {
    setLoadingOfficers(true);
    try {
      const data = await getOfficersApi();
      setOfficers(data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar petugas:', err);
      setError(getErrorMessage(err, 'Gagal memuat daftar petugas lapangan.'));
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedOfficerId) {
      setError('Silakan pilih petugas lapangan terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        officer_id: parseInt(selectedOfficerId, 10),
        catatan: catatan.trim() || undefined,
      };

      const updatedReport = await assignReportApi(report.id, payload);
      if (onSuccess) onSuccess(updatedReport);
      onClose();
    } catch (err) {
      console.error('Gagal penugasan laporan:', err);
      setError(getErrorMessage(err, 'Gagal menugaskan laporan.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!report) return null;

  const currentOfficer = report.current_assignment?.officer_nama;
  const isReassign = !!currentOfficer;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReassign ? `Tugaskan Ulang Laporan #${report.nomor_laporan}` : `Tugaskan Laporan #${report.nomor_laporan}`}
      subtitle={isReassign ? `Petugas saat ini: ${currentOfficer}` : 'Pilih petugas lapangan yang akan menangani laporan ini'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <Icon icon={AlertCircle} size="sm" />
            <span>{error}</span>
          </div>
        )}

        {isReassign && (
          <div className="p-3 bg-status-blue-bg border border-status-blue-border rounded-lg text-status-blue-text text-xs">
            Laporan ini saat ini ditugaskan kepada <strong>{currentOfficer}</strong>. Menugaskan ulang akan mengalihkan laporan ke petugas baru.
          </div>
        )}

        {/* Officer Selection */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Pilih Petugas Lapangan (Officer) <span className="text-danger">*</span>
          </label>
          {loadingOfficers ? (
            <div className="py-4 text-center text-ink-soft text-xs flex items-center justify-center gap-2">
              <Icon icon={Loader2} size="sm" className="animate-spin" />
              <span>Memuat daftar petugas...</span>
            </div>
          ) : (
            <select
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
              required
            >
              <option value="">-- Pilih Petugas --</option>
              {officers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.nama} ({officer.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Catatan Penugasan */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">
            Instruksi / Catatan Penugasan (Opsional)
          </label>
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            rows={3}
            placeholder="Tambahkan petunjuk lokasi atau instruksi khusus untuk petugas..."
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
          />
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={loadingOfficers}
          >
            {isReassign ? 'Tugaskan Ulang' : 'Tugaskan Petugas'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
