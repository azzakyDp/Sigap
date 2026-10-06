import React from 'react';
import { Clock, CheckCircle2, AlertCircle, XCircle, FileSearch, ArrowRight } from 'lucide-react';
import Icon from '../ui/Icon';
import Badge from '../ui/Badge';
import { getStatusBadgeClass, getStaffStatusLabel, getCitizenStatusLabel } from '../../utils/statusColors';
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
    <div className={`space-y-0 relative pl-2 ${className}`}>
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
          <div key={item.id || index} className="relative flex gap-4 pb-8 last:pb-2 group">
            {/* Vertical Connecting Line */}
            {index !== totalSteps - 1 && (
              <div
                className="absolute left-4 top-8 -bottom-1 w-0.5 bg-border group-hover:bg-primary/40 transition-colors"
                aria-hidden="true"
              />
            )}

            {/* Status Dot / Icon Indicator */}
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border shadow-xs shrink-0 transition-transform ${getTimelineDotBg(
                statusRaw
              )} ${isLatest ? 'ring-4 ring-primary/10 scale-110' : ''}`}
            >
              {getStatusIcon(statusRaw)}
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-surface border border-border/80 rounded-lg p-4 shadow-xs hover:border-primary/30 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-sm">
                    {labelText}
                  </span>
                  {audience === 'staff' && (
                    <Badge type="status" value={statusRaw} />
                  )}
                  {isLatest && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary text-white">
                      Status Saat Ini
                    </span>
                  )}
                </div>

                <div className="flex items-center text-xs text-ink-soft font-medium">
                  <span>{formatDate(item.changed_at)}</span>
                </div>
              </div>

              {/* Status Transition & Actor Info for Staff */}
              {audience === 'staff' && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft mt-1">
                  {item.status_from_raw && (
                    <span className="flex items-center gap-1 font-mono text-xs text-ink-soft">
                      <span>{item.status_from_raw}</span>
                      <Icon icon={ArrowRight} size="sm" />
                      <span className="font-semibold text-ink">{statusRaw}</span>
                    </span>
                  )}
                  {item.changed_by_nama && (
                    <span className="flex items-center gap-1">
                      <span>Oleh: <span className="font-semibold text-ink">{item.changed_by_nama}</span></span>
                    </span>
                  )}
                </div>
              )}

              {/* Note / Catatan if exists */}
              {item.catatan && (
                <div className="mt-2.5 pt-2 border-t border-border/50 text-xs text-ink bg-background/60 p-2.5 rounded-md italic">
                  <span className="font-semibold not-italic text-ink-soft">Catatan: </span>
                  "{item.catatan}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
