import React, { useState, useEffect } from 'react';
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
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

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

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const target = parseInt(inputPage, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages && target !== currentPage) {
      if (onPageChange && !disabled) {
        onPageChange(target);
      }
    } else {
      setInputPage(currentPage);
    }
  };

  const handleInputChange = (e) => {
    setInputPage(e.target.value);
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
      {/* Left Area: Jump-to-Page Input & Data Range Counter */}
      <div className="flex items-center gap-2.5 text-xs text-ink-soft font-normal">
        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5">
          <span className="text-ink-soft">Halaman</span>
          <div className="relative">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={inputPage}
              onChange={handleInputChange}
              onBlur={handlePageInputSubmit}
              disabled={disabled}
              title={`Ketik nomor halaman (1 - ${totalPages}) lalu tekan Enter`}
              className="w-12 h-8 text-center text-xs font-semibold text-primary bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs"
            />
          </div>
          <span className="text-ink-soft font-medium">/ {totalPages}</span>
        </form>

        <span className="text-border">|</span>

        <div>
          {totalItems ? (
            <span>
              <span className="font-semibold text-ink">{startItem} - {endItem}</span> dari{' '}
              <span className="font-semibold text-ink">{totalItems}</span> data
            </span>
          ) : (
            <span>Total {totalPages} halaman</span>
          )}
        </div>
      </div>

      {/* Right Area: Pagination Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage === 1 || disabled}
          className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-semibold text-ink bg-surface border border-border rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 gap-1 cursor-pointer"
          aria-label="Halaman sebelumnya"
        >
          <Icon icon={ChevronLeft} size="sm" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange && onPageChange(page)}
              disabled={disabled}
              className={`h-8 w-8 inline-flex items-center justify-center text-xs font-semibold rounded-md border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 cursor-pointer ${
                page === currentPage
                  ? 'bg-primary text-white border-primary shadow-xs font-semibold'
                  : 'bg-surface text-ink border-border hover:bg-slate-100'
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
          className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-semibold text-ink bg-surface border border-border rounded-md hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 gap-1 cursor-pointer"
          aria-label="Halaman selanjutnya"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <Icon icon={ChevronRight} size="sm" />
        </button>
      </div>
    </div>
  );
}
