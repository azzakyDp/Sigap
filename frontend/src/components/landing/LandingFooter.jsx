import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border py-12 text-ink-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-ink">
                SIGAP
              </span>
            </Link>
            <p className="text-sm text-ink-soft max-w-sm leading-relaxed mb-4">
              Sistem Informasi & Gangguan Pelayanan Publik. Platform resmi pelaporan masalah jalan dan kelalulintasan untuk pelayanan masyarakat yang cepat, transparan, dan terukur.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm text-ink tracking-wider uppercase mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  Cara Kerja
                </a>
              </li>
              <li>
                <a href="#ai-explainer" className="hover:text-primary transition-colors">
                  Peran AI di SIGAP
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  Pertanyaan Umum (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-bold text-sm text-ink tracking-wider uppercase mb-4">Akses Warga</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Masuk Akun
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">
                  Daftar Akun Baru
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between text-xs text-ink-soft gap-4">
          <p>© {currentYear} SIGAP — Sistem Informasi & Gangguan Pelayanan Publik. Hak Cipta Dilindungi.</p>
          <p>Pelaporan Terpadu Lalu Lintas & Infrastruktur Jalan</p>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
