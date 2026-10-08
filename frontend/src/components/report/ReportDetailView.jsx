import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Icon from '../ui/Icon';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import MapPicker from '../ui/MapPicker';
import StatusTimeline from './StatusTimeline';
import { formatDate } from '../../utils/formatters';
import { getImageUrl } from '../../utils/url';
import { getCitizenStatusLabel, getStaffStatusLabel } from '../../utils/statusColors';

export default function ReportDetailView({
  report,
  audience = 'citizen',
  backTo = '/reports/me',
  backLabel = 'Kembali ke Daftar Laporan',
  actions = null,
  aiPanel = null,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  if (!report) return null;

  const handleImageError = (id) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  const statusLabel =
    audience === 'citizen'
      ? report.status_tracking || getCitizenStatusLabel(report.status_raw)
      : getStaffStatusLabel(report.status_raw);

  const reporterName = report.citizen_nama || report.pelapor_nama || 'Masyarakat';

  return (
    <div className="space-y-6">
      {/* Top Header & Back Nav */}
      <div className="space-y-3">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-primary transition-colors cursor-pointer"
          >
            {backLabel}
          </button>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-5 rounded-lg border border-border shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-sm font-semibold text-primary bg-primary-light px-2.5 py-0.5 rounded border border-primary/20">
                {report.nomor_laporan}
              </span>
              {audience === 'staff' && (
                <span className="font-mono text-xs font-semibold text-ink-soft bg-background px-2 py-0.5 rounded border border-border flex items-center gap-1">
                  ID: {report.id}
                </span>
              )}
              <Badge type="status" value={report.status_raw}>
                {statusLabel}
              </Badge>
              <Badge type="priority" value={report.priority} />
            </div>

            <h1 className="text-xl font-bold text-ink tracking-tight mt-1 break-words overflow-wrap-anywhere">
              {report.category_name}
            </h1>

            <p className="text-xs text-ink-soft mt-1 flex flex-wrap items-center gap-2">
              <span>Dilaporkan pada {formatDate(report.created_at)}</span>
              {audience === 'staff' && (
                <>
                  <span>•</span>
                  <span className="break-words overflow-wrap-anywhere">Oleh <span className="font-semibold text-ink">{reporterName}</span></span>
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {onRefresh && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onRefresh}
              >
                Perbarui Data
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Evidences, Location, Officer Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Details */}
          <Card title="Detail Pengaduan Laporan">
            <div className="space-y-4 text-sm text-ink">
              {/* Category & Event Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-background rounded-lg border border-border/60">
                <div>
                  <span className="text-xs font-normal text-ink-soft block mb-1">
                    Kategori Pengaduan
                  </span>
                  <span className="font-normal text-ink break-words overflow-wrap-anywhere">{report.category_name}</span>
                </div>
                <div>
                  <span className="text-xs font-normal text-ink-soft block mb-1">
                    Waktu Kejadian
                  </span>
                  <span className="font-normal text-ink block">
                    {formatDate(report.waktu_kejadian)}
                  </span>
                </div>
              </div>

              {/* Dynamic Fields */}
              {report.field_values && report.field_values.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-ink-soft">
                    Informasi Spesifik Kategori
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.field_values.map((fv, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface rounded-md border border-border/80 flex flex-col justify-between break-words overflow-wrap-anywhere"
                      >
                        <span className="text-xs text-ink-soft font-normal capitalize">
                          {fv.field_name?.replace(/_/g, ' ')}
                        </span>
                        <span className="font-normal text-ink mt-0.5">{fv.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5 pt-2">
                <h4 className="text-xs font-semibold text-ink-soft">
                  Deskripsi Lengkap Kejadian
                </h4>
                <div className="p-4 bg-background rounded-lg border border-border/60 text-ink whitespace-pre-line leading-relaxed break-words overflow-wrap-anywhere">
                  {report.deskripsi}
                </div>
              </div>
            </div>
          </Card>

          {/* Photo Gallery / Evidences */}
          <Card title={`Foto Bukti (${report.evidences?.length || 0})`} subtitle="Klik foto untuk memperbesar">
            {report.evidences && report.evidences.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {report.evidences.map((ev) => {
                  const fullUrl = getImageUrl(ev.url);
                  const isFailed = failedImages[ev.id];
                  return (
                    <div
                      key={ev.id}
                      onClick={() => !isFailed && setSelectedPhoto(fullUrl)}
                      className={`group relative aspect-square rounded-lg border border-border overflow-hidden bg-background ${
                        !isFailed ? 'cursor-pointer hover:border-primary' : ''
                      } transition-all shadow-xs`}
                    >
                      {isFailed ? (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-ink-soft bg-background">
                          <span className="text-xs">Foto tidak tersedia</span>
                        </div>
                      ) : (
                        <>
                          <img
                            src={fullUrl}
                            alt="Bukti Pengaduan"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={() => handleImageError(ev.id)}
                          />
                          <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-xs gap-1">
                            <span>Perbesar</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-ink-soft text-sm border border-dashed border-border rounded-lg bg-background">
                Tidak ada foto bukti yang dilampirkan.
              </div>
            )}
          </Card>

          {/* Location */}
          <Card title="Lokasi Kejadian">
            <div className="space-y-3">
              <div className="p-3 bg-background rounded-lg border border-border/60">
                <span className="text-xs font-normal text-ink-soft block">
                  Alamat / Keterangan Lokasi
                </span>
                <p className="text-sm font-normal text-ink mt-0.5">{report.alamat_lokasi}</p>
                <p className="text-xs text-ink-soft font-mono mt-1">
                  Koordinat: {report.latitude}, {report.longitude}
                </p>
              </div>

              <MapPicker
                readOnly={true}
                marker={{ lat: report.latitude, lng: report.longitude }}
                height="h-80"
              />
            </div>
          </Card>

          {/* Officer Action Reports */}
          {report.action_reports && report.action_reports.length > 0 && (
            <Card
              title="Laporan Penanganan Petugas Lapangan"
              subtitle="Tindakan progresif yang dicatat oleh petugas di lokasi"
            >
              <div className="space-y-4">
                {report.action_reports.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 bg-surface rounded-lg border border-border/80 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="blue">{act.jenis_tindakan}</Badge>
                        <span className="text-xs text-ink-soft font-normal">
                          Petugas: <span className="font-semibold text-ink">{act.officer_nama}</span>
                        </span>
                      </div>
                      <span className="text-xs text-ink-soft">
                        {formatDate(act.created_at)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-background rounded border border-border/50">
                        <span className="text-ink-soft block font-normal">Waktu Kedatangan:</span>
                        <span className="font-normal text-ink">{formatDate(act.waktu_kedatangan)}</span>
                      </div>
                      <div className="p-2.5 bg-background rounded border border-border/50">
                        <span className="text-ink-soft block font-normal">Waktu Selesai:</span>
                        <span className="font-normal text-ink">
                          {act.waktu_selesai ? formatDate(act.waktu_selesai) : 'Masih Berlangsung'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-ink-soft block">
                        Deskripsi Tindakan:
                      </span>
                      <p className="text-xs text-ink bg-background p-3 rounded border border-border/60">
                        {act.deskripsi}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-ink-soft block">
                        Hasil Akhir:
                      </span>
                      <p className="text-xs font-semibold text-status-green-text bg-status-green-bg p-3 rounded border border-status-green-border flex items-start gap-1.5">
                        <Icon icon={CheckCircle2} size="sm" />
                        <span>{act.hasil}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Status Timeline */}
        <div className="lg:col-span-1 space-y-6">
          {aiPanel}
          <Card
            title="Timeline Status Laporan"
            subtitle="Riwayat perubahan status dari awal hingga saat ini"
            className="sticky top-20"
          >
            <StatusTimeline histories={report.status_histories} audience={audience} />
          </Card>
        </div>
      </div>

      {/* Lightbox / Enlarged Photo Modal */}
      <Modal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Foto Bukti Pengaduan"
        maxWidth="max-w-4xl"
        footer={
          <Button variant="secondary" onClick={() => setSelectedPhoto(null)}>
            Tutup
          </Button>
        }
      >
        {selectedPhoto && (
          <div className="flex items-center justify-center p-2 bg-ink rounded-lg overflow-hidden min-h-[300px]">
            <img
              src={selectedPhoto}
              alt="Foto Bukti Diperbesar"
              className="max-h-[75vh] w-auto object-contain rounded"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
