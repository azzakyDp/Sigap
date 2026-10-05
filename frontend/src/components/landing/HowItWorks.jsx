import React from 'react';
import { FileEdit, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: FileEdit,
    title: 'Buat Laporan',
    description: 'Ambil foto, tentukan titik lokasi presisi di peta, dan jelaskan kendala fasilitas jalan atau lalu lintas yang kamu temui.',
  },
  {
    step: '02',
    icon: ShieldCheck,
    title: 'Diverifikasi',
    description: 'Tim verifikator mengecek kelayakan laporan, mengonfirmasi kategori, serta menentukan skala prioritas penanganan.',
  },
  {
    step: '03',
    icon: UserCheck,
    title: 'Ditugaskan ke Petugas',
    description: 'Laporan diteruskan langsung ke unit petugas lapangan terdekat untuk pemeliharaan atau tindakan perbaikan.',
  },
  {
    step: '04',
    icon: CheckCircle2,
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
          <h2 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">
            Bagaimana SIGAP Bekerja?
          </h2>
          <p className="mt-4 text-base md:text-lg text-ink-soft leading-relaxed">
            Setiap laporan jalan atau kelalulintasan diproses melalui 4 tahapan jelas yang dapat kamu pantau secara real-time.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((item) => {
            const IconComponent = item.icon;
            return (
              <div
                key={item.step}
                className="relative bg-background p-6 rounded-2xl border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step badge & icon */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-ink-soft/40 group-hover:text-primary transition-colors">
                      {item.step}
                    </span>
                    <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <IconComponent className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-ink-soft leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Pantau di aplikasi</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
