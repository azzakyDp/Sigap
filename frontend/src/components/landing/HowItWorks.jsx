import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Buat Laporan',
    description: 'Ambil foto, tentukan titik lokasi presisi di peta, dan jelaskan kendala fasilitas jalan atau lalu lintas yang kamu temui.',
  },
  {
    step: '02',
    title: 'Diverifikasi',
    description: 'Tim verifikator mengecek kelayakan laporan, mengonfirmasi kategori, serta menentukan skala prioritas penanganan.',
  },
  {
    step: '03',
    title: 'Ditugaskan ke Petugas',
    description: 'Laporan diteruskan langsung ke unit petugas lapangan terdekat untuk pemeliharaan atau tindakan perbaikan.',
  },
  {
    step: '04',
    title: 'Selesai Ditangani',
    description: 'Petugas memperbarui status penanganan dengan foto hasil perbaikan. Warga dapat memantau linimasa hingga tuntas.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
            Alur Transparan
          </span>
          <h2 className="text-xl md:text-2xl font-semibold text-ink tracking-tight">
            Bagaimana SIGAP Bekerja?
          </h2>
          <p className="mt-4 text-sm md:text-base text-ink-soft leading-relaxed">
            Setiap laporan jalan atau kelalulintasan diproses melalui 4 tahapan jelas yang dapat kamu pantau secara real-time.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((item) => {
            return (
              <div
                key={item.step}
                className="relative bg-background p-6 rounded-2xl border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step badge */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-base font-semibold text-ink-soft/40 group-hover:text-primary transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-ink mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
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
