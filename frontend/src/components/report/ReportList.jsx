import React from 'react';
import { Eye, MapPin, Calendar } from 'lucide-react';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatDate } from '../../utils/formatters';

export default function ReportList({ reports = [], audience = 'citizen', onOpen }) {
  const handleOpen = (id) => {
    if (onOpen) {
      onOpen(id);
    }
  };

  return (
    <div>
      {/* Desktop View */}
      <div className="hidden md:block">
        <Table
          headers={[
            'Nomor Laporan',
            'Kategori',
            'Lokasi Kejadian',
            'Waktu Kejadian',
            'Status',
            'Prioritas',
            'Aksi',
          ]}
          data={reports}
          renderRow={(row) => (
            <tr
              key={row.id}
              onClick={() => handleOpen(row.id)}
              className="hover:bg-background/80 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary-hover">
                {row.nomor_laporan}
              </td>
              <td className="px-4 py-3.5 text-xs font-semibold text-ink">
                {row.category_name}
              </td>
              <td className="px-4 py-3.5 text-xs text-ink max-w-[200px] truncate" title={row.alamat_lokasi}>
                {row.alamat_lokasi}
              </td>
              <td className="px-4 py-3.5 text-xs text-ink-soft">
                {formatDate(row.waktu_kejadian)}
              </td>
              <td className="px-4 py-3.5">
                <Badge type="status" value={row.status_raw} audience={audience} />
              </td>
              <td className="px-4 py-3.5">
                <Badge type="priority" value={row.priority} />
              </td>
              <td className="px-4 py-3.5">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(row.id);
                  }}
                >
                  Detail
                </Button>
              </td>
            </tr>
          )}
        />
      </div>

      {/* Mobile View */}
      <div className="block md:hidden divide-y divide-border">
        {reports.map((row) => (
          <div
            key={row.id}
            onClick={() => handleOpen(row.id)}
            className="p-4 hover:bg-background/80 active:bg-background transition-colors cursor-pointer space-y-3"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-extrabold text-primary bg-primary-light px-2 py-0.5 rounded border border-primary/20">
                {row.nomor_laporan}
              </span>
              <Badge type="status" value={row.status_raw} audience={audience} />
            </div>

            {/* Category & Priority */}
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-ink text-sm">
                {row.category_name}
              </h4>
              <Badge type="priority" value={row.priority} />
            </div>

            {/* Meta Details */}
            <div className="space-y-1 text-xs text-ink-soft">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2 text-ink">{row.alamat_lokasi}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-ink-soft shrink-0" />
                <span>{formatDate(row.waktu_kejadian)}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-1 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                icon={Eye}
                className="w-full sm:w-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpen(row.id);
                }}
              >
                Lihat Detail
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
