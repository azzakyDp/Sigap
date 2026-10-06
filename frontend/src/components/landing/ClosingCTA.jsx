import React from 'react';
import { Link } from 'react-router-dom';

export function ClosingCTA() {
  return (
    <section className="py-16 md:py-24 bg-background border-t border-border relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary text-white p-8 md:p-14 overflow-hidden shadow-xl">
          {/* Subtle background decoration patterns */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-black/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-6">
              Mari Wujudkan Fasilitas Publik Yang Lebih Baik
            </div>

            <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight">
              Menemukan Jalan Rusak atau Gangguan Lalu Lintas?
            </h2>

            <p className="mt-4 text-sm md:text-base text-white/90 font-normal leading-relaxed">
              Jangan biarkan membahayakan pengguna jalan lain. Laporkan segera melalui SIGAP dan pantau proses penanganannya secara transparan.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-white text-primary hover:bg-slate-100 hover:shadow-lg transition-all text-base group"
              >
                <span>Buat Akun & Laporkan</span>
              </Link>
              
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/30 transition-all text-base"
              >
                <span>Sudah Punya Akun? Masuk</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClosingCTA;
