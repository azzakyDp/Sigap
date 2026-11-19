import React from 'react';

export default function TableSkeleton({ rows = 10, cols = 5 }) {
  return (
    <div className="w-full animate-pulse min-h-[520px]">
      {/* Table Header Skeleton */}
      <div className="bg-slate-50 border-b border-border px-4 py-3 flex items-center gap-4">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-4 w-36 bg-slate-200 rounded hidden sm:block"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
        <div className="h-4 w-24 bg-slate-200 rounded hidden md:block"></div>
        <div className="h-4 w-16 bg-slate-200 rounded ml-auto"></div>
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-center gap-4">
            <div className="h-4 w-24 bg-slate-200 rounded"></div>
            <div className="space-y-1.5 flex-1 hidden sm:block">
              <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
            </div>
            <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
            <div className="h-4 w-20 bg-slate-100 rounded hidden md:block"></div>
            <div className="h-8 w-16 bg-slate-200 rounded ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
