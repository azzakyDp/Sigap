import React from 'react';
import { MapPin, Info } from 'lucide-react';
import MultiMarkerMap from '../../components/ui/MultiMarkerMap';

export default function ReportsMapPage({
  reports = [],
  totalItems = 0,
  loading = false,
  onSelectReport,
}) {
  if (loading) {
    return (
      <div className="py-20 text-center text-ink-soft bg-surface border border-border rounded-lg">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
        <p className="text-sm font-medium">Membuat sebaran marker peta laporan...</p>
      </div>
    );
  }

  const fetchedCount = reports.length;
  const isTruncated = totalItems > fetchedCount;

  return (
    <div className="space-y-3">
      {/* Map Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-surface p-3 rounded-lg border border-border text-xs">
        <div className="flex items-center gap-2 font-bold text-ink">
          <MapPin className="w-4 h-4 text-primary" />
          <span>Sebaran Pengaduan Laporan di Peta</span>
        </div>

        <div className="flex items-center gap-1.5 text-ink-soft">
          <Info className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>
            Menampilkan <strong>{fetchedCount}</strong> dari <strong>{totalItems}</strong> laporan
            {isTruncated && ' (dibatasi 200 laporan terbaru untuk performa)'}.
          </span>
        </div>
      </div>

      {/* Map View */}
      {reports.length === 0 ? (
        <div className="py-16 px-4 text-center bg-surface border border-border rounded-lg">
          <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">
            Tidak Ada Laporan Berkoordinat
          </h3>
          <p className="text-ink-soft text-sm max-w-md mx-auto">
            Tidak ada pengaduan laporan dengan lokasi koordinat valid yang sesuai kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <MultiMarkerMap
          items={reports}
          onSelect={onSelectReport}
          height="h-[550px] sm:h-[620px]"
        />
      )}
    </div>
  );
}
