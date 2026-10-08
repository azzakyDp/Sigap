import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Buat Laporan Pengaduan',
    description: 'Unggah foto bukti, tentukan titik lokasi presisi pada peta, dan berikan rincian kendala jalan atau fasilitas lalu lintas.',
  },
  {
    step: '02',
    title: 'Pemeriksaan Verifikator',
    description: 'Tim Verifikator memeriksa kelayakan laporan, mengonfirmasi kategori, serta menentukan skala prioritas dengan bantuan rekomendasi AI.',
  },
  {
    step: '03',
    title: 'Penugasan Petugas Lapangan',
    description: 'Laporan yang telah terverifikasi ditugaskan secara resmi kepada unit petugas lapangan untuk tindak lanjut.',
  },
  {
    step: '04',
    title: 'Penanganan & Penyelesaian',
    description: 'Petugas melakukan tindakan perbaikan di lokasi dan mencatat hasil akhir penanganan. Perkembangan dapat dipantau pada linimasa status.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-surface border-t border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            Alur Transparan
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-ink tracking-tight">
            Bagaimana SIGAP Memproses Laporan Anda?
          </h2>
          <p className="mt-3 text-sm md:text-base text-ink-soft leading-relaxed">
            Setiap pengaduan diproses melalui 4 tahapan jelas yang dapat Anda pantau secara berkala.
          </p>
        </div>

        {/* Steps Linear Open Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((item, index) => {
            return (
              <div
                key={item.step}
                className="relative flex flex-col justify-between text-left space-y-3"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl md:text-3xl font-extrabold text-primary/80 font-mono">
                      {item.step}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block flex-1 h-0.5 bg-border/60 mt-1" aria-hidden="true" />
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-ink mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
