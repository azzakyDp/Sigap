import React from 'react';

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
        <div className="font-semibold text-ink">
          <span>Sebaran Pengaduan Laporan di Peta</span>
        </div>

        <div className="text-ink-soft">
          <span>
            Menampilkan <strong>{fetchedCount}</strong> dari <strong>{totalItems}</strong> laporan
            {isTruncated && ' (dibatasi 200 laporan terbaru untuk performa)'}.
          </span>
        </div>
      </div>

      {/* Map View */}
      {reports.length === 0 ? (
        <div className="py-16 px-4 text-center bg-surface border border-border rounded-lg">
          <h3 className="text-base font-semibold text-ink mb-1">
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
