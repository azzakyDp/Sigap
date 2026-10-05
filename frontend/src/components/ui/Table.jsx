import React from 'react';

export default function Table({ headers = [], data = [], renderRow, emptyMessage = 'Belum ada data.' }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm text-ink">
        <thead className="bg-background text-xs font-semibold text-ink-soft border-b border-border">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3.5">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {data && data.length > 0 ? (
            data.map((item, idx) => (renderRow ? renderRow(item, idx) : null))
          ) : (
            <tr>
              <td colSpan={headers.length || 1} className="px-4 py-8 text-center text-ink-soft text-sm">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
