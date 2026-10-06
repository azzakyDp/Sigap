import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Hero() {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-light border border-primary/20 text-xs font-semibold text-primary">
              <span>Sistem Pengaduan Gangguan Lalu Lintas SIGAP</span>
            </div>

            <h1 className="text-2xl md:text-display font-bold text-ink tracking-tight">
              Laporkan Gangguan Jalan dengan <span className="text-primary">Cepat, Tepat, dan Transparan</span>
            </h1>

            <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
              Sampaikan pengaduan fasilitas jalan rusak, kemacetan, dan kejadian lalu lintas di sekitar Anda. Diproses oleh verifikator, direkomendasikan oleh bantuan AI, dan ditangani langsung oleh petugas lapangan dengan pemantauan status real-time.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/register')}
                className="font-semibold text-sm px-6 py-3"
              >
                Laporkan Gangguan
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={scrollToHowItWorks}
                className="font-semibold text-sm px-6 py-3"
              >
                Pelajari Cara Kerja
              </Button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-border/80 text-xs text-ink-soft">
              <div>
                <strong className="block text-ink text-sm font-semibold">Real-Time</strong>
                <span>Pelacakan status laporan</span>
              </div>
              <div>
                <strong className="block text-ink text-sm font-semibold">Verifikasi</strong>
                <span>Pemeriksaan staf resmi</span>
              </div>
              <div>
                <strong className="block text-ink text-sm font-semibold">Petugas</strong>
                <span>Penanganan di lokasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Showcase Card */}
          <div className="lg:col-span-5">
            <div className="bg-surface p-6 rounded-2xl border border-border shadow-md space-y-4">
              {/* Header Badge & Report ID */}
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded border border-primary/20">
                    SIGAP-2026-00042
                  </span>
                  <Badge type="status" value="IN_PROGRESS" audience="staff" />
                </div>
                <Badge type="priority" value="HIGH" />
              </div>

              {/* Category & Location */}
              <div>
                <h3 className="text-base font-semibold text-ink">
                  Jalan Berlubang di Dekat Alun-Alun
                </h3>
                <p className="text-xs text-ink-soft mt-1">
                  Alun-alun Kota Lamongan, Jawa Timur
                </p>
              </div>

              {/* AI Assistant Recommendation Badge */}
              <div className="p-3 bg-background rounded-lg border border-border/80 text-xs space-y-0.5">
                <span className="font-semibold text-ink block">Asisten AI · saran, bukan keputusan</span>
                <p className="text-ink-soft text-xs">
                  Rekomendasi prioritas Tinggi & kategori Jalan Berlubang untuk Verifikator.
                </p>
              </div>

              {/* Status Timeline Mini Preview */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold text-ink-soft block">
                  Progres Penanganan
                </span>
                <div className="space-y-2 pl-2 border-l-2 border-primary/30 text-xs">
                  <div className="flex items-center gap-2 text-ink">
                    <Icon icon={CheckCircle2} size="sm" className="text-status-green-text shrink-0" />
                    <span>Laporan diajukan oleh masyarakat</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink">
                    <Icon icon={CheckCircle2} size="sm" className="text-status-green-text shrink-0" />
                    <span>Diverifikasi oleh Verifikator</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Icon icon={Clock} size="sm" className="text-primary shrink-0" />
                    <span>Petugas berada di lokasi penanganan</span>
                  </div>
                </div>
              </div>

              {/* Bottom Officer Tag */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-ink-soft">
                <span>
                  Petugas: <span className="font-semibold text-ink">Tim Lapangan 1</span>
                </span>
                <span className="text-xs">Terbuka secara publik</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
