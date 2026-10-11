import React from 'react';
import { Link } from 'react-router-dom';


export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border py-12 text-ink-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <span className="font-semibold text-base text-ink">
                SIGAP
              </span>
            </Link>
            <p className="text-sm text-ink-soft max-w-sm leading-relaxed mb-4">
              Sistem Informasi & Gangguan Pelayanan Publik. Platform resmi pelaporan masalah jalan dan kelalulintasan untuk pelayanan masyarakat yang cepat, transparan, dan terukur.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm text-ink mb-4">Navigasi</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-primary transition-colors cursor-pointer text-left"
                >
                  Cara Kerja
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('ai-explainer');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-primary transition-colors cursor-pointer text-left"
                >
                  Peran AI di SIGAP
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('faq');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="hover:text-primary transition-colors cursor-pointer text-left"
                >
                  Pertanyaan Umum (FAQ)
                </button>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 className="font-semibold text-sm text-ink mb-4">Akses Warga</h4>
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
