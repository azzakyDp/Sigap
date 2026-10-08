import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, FileSearch, ArrowRight } from 'lucide-react';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import { getStaffStatusLabel, getCitizenStatusLabel } from '../../utils/statusColors';
import { formatDate } from '../../utils/formatters';

const getStatusIcon = (statusRaw) => {
  const status = (statusRaw || '').toUpperCase();
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return <Icon icon={CheckCircle2} size="sm" className="text-status-green-text" />;
    case 'REJECTED':
      return <Icon icon={XCircle} size="sm" className="text-status-red-text" />;
    case 'DUPLICATE':
      return <Icon icon={AlertCircle} size="sm" className="text-status-orange-text" />;
    case 'IN_PROGRESS':
    case 'ASSIGNED':
    case 'VERIFIED':
      return <Icon icon={Clock} size="sm" className="text-status-blue-text" />;
    case 'PENDING_VERIFICATION':
    case 'SUBMITTED':
    default:
      return <Icon icon={FileSearch} size="sm" className="text-status-amber-text" />;
  }
};

const getTimelineDotBg = (statusRaw) => {
  const status = (statusRaw || '').toUpperCase();
  switch (status) {
    case 'RESOLVED':
    case 'CLOSED':
      return 'bg-status-green-bg border-status-green-border';
    case 'REJECTED':
      return 'bg-status-red-bg border-status-red-border';
    case 'DUPLICATE':
      return 'bg-status-orange-bg border-status-orange-border';
    case 'IN_PROGRESS':
    case 'ASSIGNED':
    case 'VERIFIED':
      return 'bg-status-blue-bg border-status-blue-border';
    case 'PENDING_VERIFICATION':
    default:
      return 'bg-status-amber-bg border-status-amber-border';
  }
};

export default function StatusTimeline({ histories = [], audience = 'citizen', className = '' }) {
  if (!histories || histories.length === 0) {
    return (
      <div className="py-6 text-center text-ink-soft text-sm border border-dashed border-border rounded-lg bg-background">
        Belum ada riwayat status laporan.
      </div>
    );
  }

  // Ensure chronological order (oldest to newest) for vertical step flow
  const sortedHistories = [...histories].sort((a, b) => {
    const timeA = new Date(a.changed_at || a.created_at || 0).getTime();
    const timeB = new Date(b.changed_at || b.created_at || 0).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || 0) - (b.id || 0);
  });

  // Filter histories for citizen audience
  let displayHistories = sortedHistories;
  if (audience === 'citizen') {
    const filtered = [];
    let lastTrackingLabel = null;
    for (const item of sortedHistories) {
      const trackingLabel = item.status_to_tracking || getCitizenStatusLabel(item.status_to_raw || item.status_raw);
      if (filtered.length === 0 || trackingLabel !== lastTrackingLabel) {
        filtered.push(item);
        lastTrackingLabel = trackingLabel;
      }
    }
    displayHistories = filtered;
  }

  const totalSteps = displayHistories.length;

  return (
    <div className={`relative pl-1 ${className}`}>
      {displayHistories.map((item, index) => {
        const isLatest = index === totalSteps - 1;
        const statusRaw = item.status_to_raw || item.status_raw || 'PENDING_VERIFICATION';
        const isSameStatus = item.status_from_raw && item.status_from_raw === statusRaw;

        let labelText = '';
        if (audience === 'citizen') {
          labelText = item.status_to_tracking || getCitizenStatusLabel(statusRaw);
        } else {
          const staffLabel = getStaffStatusLabel(statusRaw);
          labelText = isSameStatus
            ? `Pembaruan (status tetap ${staffLabel})`
            : staffLabel;
        }

        return (
          <div key={item.id || index} className="relative flex items-start gap-3.5 pb-6 last:pb-1 group min-w-0">
            {/* Vertical Connecting Line */}
            {index !== totalSteps - 1 && (
              <div
                className="absolute left-[15px] top-7 -bottom-1 w-0.5 bg-border/80 group-hover:bg-primary/40 transition-colors"
                aria-hidden="true"
              />
            )}

            {/* Status Dot / Icon Indicator */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border shadow-2xs shrink-0 mt-0.5 transition-transform ${getTimelineDotBg(
                statusRaw
              )} ${isLatest ? 'ring-4 ring-primary/10 scale-105' : ''}`}
            >
              {getStatusIcon(statusRaw)}
            </div>

            {/* Content Container */}
            <div className="flex-1 min-w-0 bg-surface border border-border/70 rounded-lg p-3.5 shadow-2xs hover:border-primary/30 transition-all">
              {/* Primary Header Row */}
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="font-semibold text-ink text-sm break-words min-w-0">
                    {labelText}
                  </span>
                  {audience === 'staff' && (
                    <Badge type="status" value={statusRaw} />
                  )}
                  {isLatest && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                      Status Saat Ini
                    </span>
                  )}
                </div>

                <time className="text-xs text-ink-soft font-medium shrink-0">
                  {formatDate(item.changed_at)}
                </time>
              </div>

              {/* Secondary Metadata for Staff */}
              {audience === 'staff' && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft mt-1.5 pt-1.5 border-t border-border/40 min-w-0">
                  {item.status_from_raw && (
                    <span className="inline-flex items-center gap-1 font-mono text-xs text-ink-soft">
                      <span>{item.status_from_raw}</span>
                      <Icon icon={ArrowRight} size="sm" />
                      <span className="font-semibold text-ink">{statusRaw}</span>
                    </span>
                  )}
                  {item.changed_by_nama && (
                    <span className="truncate">
                      Oleh: <span className="font-semibold text-ink">{item.changed_by_nama}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Catatan / Note */}
              {item.catatan && (
                <div className="mt-2 text-xs text-ink bg-background/80 p-2.5 rounded border border-border/50 break-words overflow-wrap-anywhere">
                  <span className="font-semibold text-ink-soft">Catatan: </span>
                  <span className="italic">"{item.catatan}"</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
