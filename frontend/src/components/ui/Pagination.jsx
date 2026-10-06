import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Icon from './Icon';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize = 10,
  disabled = false,
}) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) {
    return null;
  }

  const handlePrev = () => {
    if (currentPage > 1 && !disabled && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !disabled && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border mt-4">
      <div className="text-xs text-ink-soft font-medium text-center sm:text-left">
        {totalItems ? (
          <span>
            Menampilkan <strong className="text-ink">{startItem}</strong> -{' '}
            <strong className="text-ink">{endItem}</strong> dari{' '}
            <strong className="text-ink">{totalItems}</strong> data
          </span>
        ) : (
          <span>
            Halaman <strong className="text-ink">{currentPage}</strong> dari{' '}
            <strong className="text-ink">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1 || disabled}
          className="inline-flex items-center justify-center h-9 px-3 text-xs font-semibold text-ink bg-surface border border-border rounded-md hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors gap-1 cursor-pointer"
          aria-label="Halaman sebelumnya"
        >
          <Icon icon={ChevronLeft} size="sm" />
          <span>Sebelumnya</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange && onPageChange(page)}
              disabled={disabled}
              className={`h-9 w-9 inline-flex items-center justify-center text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                page === currentPage
                  ? 'bg-primary text-white border-primary shadow-xs font-bold'
                  : 'bg-surface text-ink border-border hover:bg-background'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages || disabled}
          className="inline-flex items-center justify-center h-9 px-3 text-xs font-semibold text-ink bg-surface border border-border rounded-md hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed transition-colors gap-1 cursor-pointer"
          aria-label="Halaman selanjutnya"
        >
          <span>Selanjutnya</span>
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
    </div>
  );
}
