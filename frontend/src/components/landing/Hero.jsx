import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = (e) => {
    if (isReducedMotion || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotateY = (x / (rect.width / 2)) * 7;
    const rotateX = -(y / (rect.height / 2)) * 7;

    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-background">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none opacity-30 blur-3xl bg-primary-light/40 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light border border-primary/20 text-xs font-bold text-primary">
              <ShieldAlert className="w-4 h-4 text-primary" />
              <span>Sistem Pengaduan Gangguan Lalu Lintas SIGAP</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
              Laporkan Gangguan Jalan dengan <span className="text-primary">Cepat, Tepat, dan Transparan</span>
            </h1>

            <p className="text-sm sm:text-base text-ink-soft leading-relaxed max-w-2xl">
              Sampaikan pengaduan fasilitas jalan rusak, kemacetan, dan kejadian lalu lintas di sekitar Anda. Diproses oleh verifikator, direkomendasikan oleh bantuan AI, dan ditangani langsung oleh petugas lapangan dengan pemantauan status real-time.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/register')}
                icon={ArrowRight}
                className="font-bold text-base px-6 py-3 rounded-full sm:rounded-md shadow-md"
              >
                Laporkan Gangguan
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={scrollToHowItWorks}
                icon={ChevronRight}
                className="font-semibold text-sm px-6 py-3"
              >
                Pelajari Cara Kerja
              </Button>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-border/80 text-xs text-ink-soft">
              <div>
                <strong className="block text-ink text-base font-extrabold">Real-Time</strong>
                <span>Pelacakan status laporan</span>
              </div>
              <div>
                <strong className="block text-ink text-base font-extrabold">Verifikasi</strong>
                <span>Pemeriksaan staf resmi</span>
              </div>
              <div>
                <strong className="block text-ink text-base font-extrabold">Petugas</strong>
                <span>Penanganan di lokasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Option A Interactive CSS 3D Showcase Card */}
          <div
            ref={heroRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="lg:col-span-5 perspective-1000"
          >
            <div
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transition: tilt.x === 0 && tilt.y === 0 ? 'transform 0.5s ease-out' : 'none',
                transformStyle: 'preserve-3d',
              }}
              className="bg-surface p-6 rounded-2xl border border-border shadow-xl space-y-4 relative"
            >
              {/* Header Badge & Report ID */}
              <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-primary bg-primary-light px-2.5 py-1 rounded border border-primary/20">
                    SIGAP-2026-00042
                  </span>
                  <Badge type="status" value="IN_PROGRESS" audience="staff" />
                </div>
                <Badge type="priority" value="HIGH" />
              </div>

              {/* Category & Location */}
              <div>
                <h3 className="text-base font-bold text-ink">
                  Jalan Berlubang di Dekat Alun-Alun
                </h3>
                <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Alun-alun Kota Lamongan, Jawa Timur</span>
                </p>
              </div>

              {/* AI Assistant Recommendation Badge */}
              <div className="p-3 bg-background rounded-lg border border-border/80 flex items-start gap-2 text-xs">
                <Cpu className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-ink block">Bantuan Analisis AI</span>
                  <p className="text-ink-soft text-[11px]">
                    Rekomendasi prioritas Tinggi & kategori Jalan Berlubang untuk Verifikator.
                  </p>
                </div>
              </div>

              {/* Status Timeline Mini Preview */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-ink-soft block">
                  Progres Penanganan
                </span>
                <div className="space-y-2 pl-2 border-l-2 border-primary/30 text-xs">
                  <div className="flex items-center gap-2 text-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green-text shrink-0" />
                    <span>Laporan diajukan oleh masyarakat</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-green-text shrink-0" />
                    <span>Diverifikasi oleh Verifikator</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink font-semibold">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                    <span>Petugas berada di lokasi penanganan</span>
                  </div>
                </div>
              </div>

              {/* Bottom Officer Tag */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Petugas: <strong className="text-ink">Tim Lapangan 1</strong>
                </span>
                <span className="text-[11px]">Terbuka secara publik</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
