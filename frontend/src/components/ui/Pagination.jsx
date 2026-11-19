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

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border mt-4">
      {/* Sisi Kiri: Informasi Rentang Data */}
      <div className="text-xs text-ink-soft font-normal text-center sm:text-left">
        {totalItems ? (
          <span>
            <span className="font-semibold text-ink">{startItem} - {endItem}</span> dari{' '}
            <span className="font-semibold text-ink">{totalItems}</span> data
          </span>
        ) : (
          <span>Halaman {currentPage} dari {totalPages}</span>
        )}
      </div>

      {/* Sisi Kanan: [Prev] [Input Angka / Total] [Next] */}
      <div className="flex items-center gap-2">
        {/* Tombol Prev */}
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

        {/* Input Angka Halaman / Total */}
        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1.5 px-1">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={handleInputChange}
            onBlur={handlePageInputSubmit}
            disabled={disabled}
            title={`Ketik halaman (1 - ${totalPages}) lalu tekan Enter`}
            className="w-12 h-8 text-center text-xs font-bold text-primary bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-2xs cursor-pointer hover:border-primary"
          />
          <span className="text-xs text-ink-soft font-medium">/ {totalPages}</span>
        </form>

        {/* Tombol Next */}
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
