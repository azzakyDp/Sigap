import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import Icon from '../../components/ui/Icon';

import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import MapPicker from '../../components/ui/MapPicker';
import CategorySelect from '../../components/report/CategorySelect';
import DynamicFieldsForm from '../../components/report/DynamicFieldsForm';
import { createReportApi } from '../../api/reports';
import { toApiDateTime } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errors';
import { useToast } from '../../context/ToastContext';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Helper for datetime-local default value
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  // Form State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [waktuKejadian, setWaktuKejadian] = useState(getCurrentDateTimeLocal());
  const [location, setLocation] = useState({
    latitude: -6.9175,
    longitude: 107.6191,
    alamat_lokasi: '',
  });
  const [dynamicValues, setDynamicValues] = useState({});
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  // Errors & UI Loading State
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successReport, setSuccessReport] = useState(null);

  // Handle Category Change
  const handleCategoryChange = (categoryObj) => {
    setSelectedCategory(categoryObj);
    // Reset dynamic fields when category changes to prevent stale data
    setDynamicValues({});
    if (fieldErrors.category_id) {
      setFieldErrors((prev) => ({ ...prev, category_id: '' }));
    }
  };

  // Handle Map Pin Selection
  const handleLocationSelect = (lat, lng) => {
    setLocation((prev) => ({
      ...prev,
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));
    if (fieldErrors.location) {
      setFieldErrors((prev) => ({ ...prev, location: '' }));
    }
  };

  // Handle Photo Selection with Client-Side File Extension & Limit Validation
  const handlePhotoSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Client-side MIME type validation for instant UX feedback
    const invalidFile = selectedFiles.find(
      (file) => !['image/jpeg', 'image/jpg', 'image/png'].includes(file.type.toLowerCase())
    );
    if (invalidFile) {
      setServerError(`File '${invalidFile.name}' bukan format foto yang diizinkan (hanya JPG, JPEG, PNG).`);
      return;
    }

    if (photos.length + selectedFiles.length > 5) {
      setServerError('Maksimal 5 foto bukti per laporan.');
      return;
    }

    setServerError('');
    const updatedPhotos = [...photos, ...selectedFiles];
    setPhotos(updatedPhotos);

    // Create preview Object URLs
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  // Handle Remove Photo
  const handleRemovePhoto = (index) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);

    // Revoke object URL memory
    URL.revokeObjectURL(photoPreviews[index]);

    setPhotos(updatedPhotos);
    setPhotoPreviews(updatedPreviews);
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};

    if (!selectedCategory || !selectedCategory.id) {
      errors.category_id = 'Pilih kategori pengaduan.';
    }

    if (!deskripsi.trim() || deskripsi.length < 10) {
      errors.deskripsi = 'Deskripsi kejadian minimal 10 karakter.';
    }

    if (!waktuKejadian) {
      errors.waktu_kejadian = 'Waktu kejadian wajib diisi.';
    }

    if (!location.alamat_lokasi.trim() || location.alamat_lokasi.length < 5) {
      errors.alamat_lokasi = 'Alamat / keterangan lokasi minimal 5 karakter.';
    }

    if (photos.length === 0) {
      errors.photos = 'Minimal 1 foto bukti wajib diunggah.';
    }

    // Dynamic fields required check
    if (selectedCategory && selectedCategory.fields) {
      const dynamicErrs = {};
      selectedCategory.fields.forEach((field) => {
        if (field.is_required) {
          const val = dynamicValues[field.field_name];
          if (!val || !String(val).trim()) {
            dynamicErrs[field.field_name] = `Field '${field.field_name}' wajib diisi.`;
          }
        }
      });
      if (Object.keys(dynamicErrs).length > 0) {
        errors.dynamic_fields = dynamicErrs;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('category_id', selectedCategory.id);
      formData.append('deskripsi', deskripsi.trim());
      formData.append('waktu_kejadian', toApiDateTime(waktuKejadian));
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('alamat_lokasi', location.alamat_lokasi.trim());
      formData.append('dynamic_fields', JSON.stringify(dynamicValues));

      // Append files
      photos.forEach((file) => {
        formData.append('files', file);
      });

      const response = await createReportApi(formData);
      addToast({
        type: 'success',
        title: 'Pengaduan Berhasil Dikirim',
        message: `Laporan pengaduan #${response.nomor_laporan} berhasil dibuat.`,
      });
      setSuccessReport(response);
    } catch (err) {
      setServerError(
        getErrorMessage(err, 'Gagal mengirim laporan. Periksa kembali seluruh data Anda.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2 cursor-pointer"
          >
            Kembali ke Dashboard
          </button>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Buat Pengaduan Laporan Baru</h1>
          <p className="text-muted text-sm mt-1">Sampaikan laporan gangguan lalu lintas di sekitar Anda.</p>
        </div>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-danger-light border border-danger/30 rounded-lg text-sm text-danger font-semibold flex items-center gap-3">
          <Icon icon={AlertCircle} size="sm" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-0">
        <Card title="1. Kategori & Deskripsi Pengaduan" subtitle="Pilih jenis gangguan dan tuliskan rincian kejadian">
          <CategorySelect
            value={selectedCategory?.id || ''}
            onChange={handleCategoryChange}
            error={fieldErrors.category_id}
          />

          {selectedCategory && (
            <DynamicFieldsForm
              fields={selectedCategory.fields}
              values={dynamicValues}
              onChange={(key, val) => {
                setDynamicValues((prev) => ({ ...prev, [key]: val }));
              }}
              errors={fieldErrors.dynamic_fields || {}}
            />
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Deskripsi Kejadian <span className="text-danger">*</span>
            </label>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Ceritakan detail kejadian gangguan lalu lintas yang terjadi (minimal 10 karakter)..."
              rows={4}
              className={`w-full px-3.5 py-2.5 bg-surface border rounded-md text-ink placeholder-muted text-sm focus:outline-none focus:ring-1 transition-colors ${
                fieldErrors.deskripsi ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary'
              }`}
              required
            />
            {fieldErrors.deskripsi && <p className="mt-1 text-xs text-danger font-medium">{fieldErrors.deskripsi}</p>}
          </div>

          <Input
            label="Waktu Kejadian"
            type="datetime-local"
            name="waktu_kejadian"
            value={waktuKejadian}
            onChange={(e) => setWaktuKejadian(e.target.value)}
            error={fieldErrors.waktu_kejadian}
            required
          />
        </Card>

        <Card title="2. Lokasi Kejadian" subtitle="Pilih titik koordinat di peta dan isi rincian alamat">
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-1.5">
              Titik Peta Koordinat <span className="text-danger">*</span>
            </label>
            <MapPicker
              marker={{ lat: location.latitude, lng: location.longitude }}
              onLocationSelect={handleLocationSelect}
              height="h-80"
            />
            <div className="mt-2 text-xs font-mono text-muted flex items-center gap-4">
              <span>Latitude: <strong className="text-ink">{location.latitude}</strong></span>
              <span>Longitude: <strong className="text-ink">{location.longitude}</strong></span>
            </div>
          </div>

          <Input
            label="Alamat / Keterangan Lokasi Detail"
            name="alamat_lokasi"
            value={location.alamat_lokasi}
            onChange={(e) => setLocation((prev) => ({ ...prev, alamat_lokasi: e.target.value }))}
            error={fieldErrors.alamat_lokasi}
            placeholder="Contoh: Jl. Asia Afrika No. 10 (Depan Gedung Merdeka)"
            required
          />
        </Card>

        <Card title="3. Foto Bukti Kejadian" subtitle="Unggah minimal 1 foto bukti (maksimal 5 foto, format JPG/PNG)">
          <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-2">
              Unggah Foto <span className="text-danger">*</span>
            </label>

            {photos.length < 5 && (
              <label className="border-2 border-dashed border-border hover:border-primary bg-background rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center mb-4">
                <span className="text-sm font-semibold text-ink">Klik untuk memilih foto</span>
                <span className="text-xs text-muted mt-1">Format JPG, JPEG, atau PNG (Maks 5MB per file)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}

            {fieldErrors.photos && <p className="mb-3 text-xs text-danger font-medium">{fieldErrors.photos}</p>}

            {/* Thumbnail Preview Grid */}
            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {photoPreviews.map((previewUrl, idx) => (
                  <div key={idx} className="relative group rounded-md overflow-hidden border border-border aspect-square bg-background">
                    <img src={previewUrl} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-danger text-white p-1 rounded-md shadow-md opacity-90 hover:opacity-100 transition-opacity cursor-pointer inline-flex items-center justify-center"
                      title="Hapus foto ini"
                      aria-label="Hapus foto"
                    >
                      <Icon icon={Trash2} size="sm" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-ink/70 text-white text-xs px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Desktop Submit Button */}
        <div className="hidden lg:flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Batal
          </Button>
          <Button type="submit" variant="primary" loading={submitting} className="min-w-[160px]">
            Kirim Laporan
          </Button>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-surface border-t border-border shadow-lg z-30 flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => navigate('/dashboard')}>
            Batal
          </Button>
          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            Kirim Laporan
          </Button>
        </div>
      </form>

      {/* Success Modal using Reusable Modal.jsx */}
      <Modal
        isOpen={!!successReport}
        onClose={() => {
          setSuccessReport(null);
          navigate('/dashboard');
        }}
        title="Pengaduan Laporan Berhasil Dibuat!"
      >
        <div className="text-center py-4">
          <div className="flex justify-center mb-3">
            <Icon icon={CheckCircle2} size="nav" className="text-status-green-text" />
          </div>
          <h4 className="text-ink font-semibold text-base mb-1">Terima Kasih Atas Laporan Anda</h4>
          <p className="text-xs text-muted mb-4">Laporan Anda telah tercatat ke dalam sistem SIGAP.</p>

          <div className="p-3 bg-background border border-border rounded-md font-mono text-sm mb-4">
            Nomor Laporan: <span className="font-semibold text-primary text-sm">{successReport?.nomor_laporan}</span>
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              setSuccessReport(null);
              navigate('/dashboard');
            }}
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </Modal>
    </>
  );
}
