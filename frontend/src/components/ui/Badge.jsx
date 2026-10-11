import React from 'react';
import {
  getStatusBadgeClass,
  getStatusLabel,
  getPriorityBadgeClass,
  getPriorityLabel,
} from '../../utils/statusColors';

export default function Badge({
  children,
  type = 'default', // 'status' | 'priority' | 'default'
  value,
  audience = 'staff', // 'staff' | 'citizen'
  variant = 'default',
  className = '',
}) {
  let badgeStyles =
    'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border transition-colors';
  let content = children;

  if (type === 'status' && value) {
    badgeStyles += ` ${getStatusBadgeClass(value)}`;
    if (!content) {
      content = getStatusLabel(value, audience === 'citizen' ? 'CITIZEN' : 'STAFF');
    }
  } else if (type === 'priority' && value) {
    badgeStyles += ` ${getPriorityBadgeClass(value)}`;
    if (!content) {
      content = getPriorityLabel(value);
    }
  } else {
    const variants = {
      default: 'bg-status-gray-bg text-ink border-status-gray-border',
      blue: 'bg-status-blue-bg text-ink border-status-blue-border',
      emerald: 'bg-status-green-bg text-ink border-status-green-border',
      amber: 'bg-status-amber-bg text-ink border-status-amber-border',
      red: 'bg-status-red-bg text-ink border-status-red-border',
    };
    badgeStyles += ` ${variants[variant] || variants.default}`;
  }

  return <span className={`${badgeStyles} ${className}`}>{content}</span>;
}
