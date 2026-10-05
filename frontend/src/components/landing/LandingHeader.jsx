import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Menu, X, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

export default function LandingHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs group-hover:bg-primary-hover transition-colors">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-ink">SIGAP</span>
            <span className="text-[10px] text-ink-soft font-semibold -mt-1">Sistem Pengaduan Lalu Lintas</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-ink-soft">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Cara Kerja
          </button>
          <button
            onClick={() => scrollToSection('ai-explainer')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Peran AI
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Masuk
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/register')}
            icon={ArrowRight}
          >
            Buat Laporan
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-ink-soft hover:text-ink rounded-md hover:bg-background transition-colors cursor-pointer"
          aria-label="Buka menu navigasi"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-border px-4 pt-3 pb-6 space-y-4 shadow-lg animate-fade-in">
          <nav className="flex flex-col gap-3 text-sm font-semibold text-ink">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 border-b border-border/50 hover:text-primary transition-colors"
            >
              Cara Kerja
            </button>
            <button
              onClick={() => scrollToSection('ai-explainer')}
              className="text-left py-2 border-b border-border/50 hover:text-primary transition-colors"
            >
              Peran AI
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-left py-2 border-b border-border/50 hover:text-primary transition-colors"
            >
              FAQ
            </button>
          </nav>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="secondary"
              fullWidth={true}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
            >
              Masuk
            </Button>
            <Button
              variant="primary"
              fullWidth={true}
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/register');
              }}
              icon={ArrowRight}
            >
              Buat Laporan
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
