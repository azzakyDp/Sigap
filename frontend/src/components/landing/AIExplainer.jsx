import React from 'react';

export function AIExplainer() {
  return (
    <section id="ai-explainer" className="py-16 md:py-24 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            Teknologi Pendukung
          </span>
          <h2 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">
            Peran Kecerdasan Buatan (AI) di SIGAP
          </h2>
          <p className="mt-4 text-sm md:text-base text-ink-soft leading-relaxed">
            SIGAP memanfaatkan modul AI sebagai asisten verifikator untuk mempercepat analisis laporan tanpa mengorbankan ketepatan dan kendali manusia.
          </p>
        </div>

        {/* Human in the Loop Prominent Banner */}
        <div className="mb-12 p-6 md:p-8 rounded-2xl bg-surface border border-border text-ink">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 font-semibold text-ink text-base mb-1">
                Prinsip Utama: Keputusan Akhir Selalu di Tangan Manusia
              </div>
              <p className="text-sm md:text-base text-ink-soft leading-relaxed">
                Modul AI di SIGAP <strong>tidak pernah menyetujui, menolak, atau menutup laporan secara otomatis</strong>. AI hanya memberikan masukan rekomendasi. Seluruh keputusan verifikasi dan penugasan dilakukan penuh secara manual oleh petugas Verifikator resmi.
              </p>
            </div>
          </div>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          
          {/* Card 1: Automatic Summarization */}
          <div className="bg-surface p-8 rounded-2xl border border-border flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-primary">Fitur Rekomendasi</span>
              <h3 className="text-base font-semibold text-ink mt-1 mb-3">
                Ringkasan Otomatis Laporan
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Saat warga mengirimkan uraian masalah, AI membantu menyarikan rincian penting menjadi intisari yang padat agar Verifikator dapat dengan cepat memahami akar masalah lalu lintas atau kerusakan fasilitas.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-ink-soft">
              <span>Status Fitur:</span>
              <span className="font-semibold text-primary">Siap Beroperasi</span>
            </div>
          </div>

          {/* Card 2: Category & Priority Recommendation */}
          <div className="bg-surface p-8 rounded-2xl border border-border flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-primary">Fitur Analisis</span>
              <h3 className="text-base font-semibold text-ink mt-1 mb-3">
                Rekomendasi Kategori & Prioritas
              </h3>
              <p className="text-sm text-ink-soft leading-relaxed">
                Sistem memberikan usulan estimasi urgensi (Rendah, Sedang, Tinggi, Darurat) dan pengelompokan jenis masalah berdasarkan konten teks serta foto pendukung untuk mempercepat antrean pengesahan.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-ink-soft">
              <span>Status Fitur:</span>
              <span className="font-semibold text-primary">Asisten Verifikator</span>
            </div>
          </div>

        </div>

        {/* Clarification Box */}
        <div className="p-6 rounded-2xl bg-surface border border-border text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink mb-1">
            Transparansi Penggunaan Data
          </div>
          <p className="text-xs md:text-sm text-ink-soft">
            Kecerdasan buatan hanya digunakan untuk menganalisis isi laporan publik demi efisiensi tindak lanjut. AI tidak digunakan untuk validasi identitas NIK warga atau pemrosesan keputusan administratif hukum.
          </p>
        </div>

      </div>
    </section>
  );
}

export default AIExplainer;
