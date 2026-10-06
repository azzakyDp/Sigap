import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import Icon from '../ui/Icon';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createActionReportApi } from '../../api/workflow';
import { getErrorMessage } from '../../utils/errors';
import { toApiDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

const getCurrentLocalDatetime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function ActionReportForm({ isOpen, onClose, report, onSuccess }) {
  const { addToast } = useToast();
  const [jenisTindakan, setJenisTindakan] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [waktuKedatangan, setWaktuKedatangan] = useState(getCurrentLocalDatetime());
  const [waktuSelesai, setWaktuSelesai] = useState('');
  const [hasil, setHasil] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setJenisTindakan('');
      setDeskripsi('');
      setWaktuKedatangan(getCurrentLocalDatetime());
      setWaktuSelesai('');
      setHasil('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Mobile-first form validations
    if (!jenisTindakan.trim() || jenisTindakan.trim().length < 2) {
      setError('Jenis tindakan minimal 2 karakter.');
      return;
    }
    if (!deskripsi.trim() || deskripsi.trim().length < 5) {
      setError('Deskripsi tindakan minimal 5 karakter.');
      return;
    }
    if (!waktuKedatangan) {
      setError('Waktu kedatangan petugas wajib diisi.');
      return;
    }
    if (!hasil.trim() || hasil.trim().length < 3) {
      setError('Hasil akhir penanganan minimal 3 karakter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        jenis_tindakan: jenisTindakan.trim(),
        deskripsi: deskripsi.trim(),
        waktu_kedatangan: toApiDateTime(waktuKedatangan),
        waktu_selesai: waktuSelesai ? toApiDateTime(waktuSelesai) : null,
        hasil: hasil.trim(),
      };

      const newAction = await createActionReportApi(report.id, payload);
      addToast({
        type: 'success',
        title: 'Tindakan Dicatat',
        message: `Laporan tindakan '${jenisTindakan.trim()}' berhasil tersimpan.`,
      });
      if (onSuccess) onSuccess(newAction);
      onClose();
    } catch (err) {
      console.error('Gagal mencatat tindakan petugas:', err);
      setError(getErrorMessage(err, 'Gagal mencatat laporan tindakan penanganan.'));
    } finally {
      setLoading(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Catat Tindakan Lapangan #${report.nomor_laporan}`}
      subtitle="Dokumentasikan tindakan progresif yang diambil di lokasi"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-ink">
        {error && (
          <div className="p-3.5 bg-status-red-bg border border-status-red-border rounded-lg text-status-red-text text-xs flex items-center gap-2">
            <Icon icon={AlertCircle} size="sm" />
            <span>{error}</span>
          </div>
        )}

        {/* Jenis Tindakan */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">
            Jenis Tindakan <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={jenisTindakan}
            onChange={(e) => setJenisTindakan(e.target.value)}
            placeholder="Contoh: Pemasangan Barikade / Penambalan Aspal / Pengaturan Lalu Lintas"
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            required
            minLength={2}
          />
        </div>

        {/* Waktu Kedatangan & Waktu Selesai (Responsive Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">
              Waktu Kedatangan <span className="text-danger">*</span>
            </label>
            <input
              type="datetime-local"
              value={waktuKedatangan}
              onChange={(e) => setWaktuKedatangan(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-soft mb-1">
              Waktu Selesai <span className="text-ink-soft font-normal">(Opsional)</span>
            </label>
            <input
              type="datetime-local"
              value={waktuSelesai}
              onChange={(e) => setWaktuSelesai(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            />
            <p className="text-xs text-ink-soft mt-1">
              Biarkan kosong jika penanganan masih berlangsung di lokasi.
            </p>
          </div>
        </div>

        {/* Deskripsi Rinci */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">
            Deskripsi Tindakan <span className="text-danger">*</span>
          </label>
          <textarea
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            rows={3}
            placeholder="Jelaskan langkah teknis penanganan yang dilaksanakan petugas di lapangan..."
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            required
            minLength={5}
          />
        </div>

        {/* Hasil Penanganan */}
        <div>
          <label className="block text-xs font-medium text-ink-soft mb-1">
            Hasil Akhir Tindakan <span className="text-danger">*</span>
          </label>
          <textarea
            value={hasil}
            onChange={(e) => setHasil(e.target.value)}
            rows={2}
            placeholder="Contoh: Lokasi telah kondusif dan arus lalu lintas kembali lancar."
            className="w-full px-3.5 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-ink"
            required
            minLength={3}
          />
        </div>

        {/* Form Actions (Mobile-friendly touch target buttons) */}
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
            fullWidth={true}
            className="sm:w-auto"
          >
            Simpan Tindakan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
