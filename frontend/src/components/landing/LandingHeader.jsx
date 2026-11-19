import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Icon from '../ui/Icon';
import Button from '../ui/Button';

const navItems = [
  { id: 'how-it-works', label: 'Cara Kerja' },
  { id: 'ai-explainer', label: 'Peran AI' },
  { id: 'faq', label: 'FAQ' },
];

export default function LandingHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const sectionIds = ['how-it-works', 'ai-explainer', 'faq'];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerOffset = 100; // 64px header + buffer
      const currentScroll = scrollY + headerOffset;

      let found = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (currentScroll >= top && currentScroll < top + height) {
            found = id;
            break;
          }
        }
      }

      setActiveSection(found);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div className="flex flex-col">
            <span className="font-semibold text-base text-ink">SIGAP</span>
            <span className="text-xs text-ink-soft font-semibold -mt-0.5">Sistem Pengaduan Lalu Lintas</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-xs">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/25 shadow-2xs font-bold'
                    : 'text-ink-soft hover:text-ink hover:bg-black/5 border border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
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
          >
            Buat Laporan
          </Button>
        </div>

        {/* Mobile Menu Button with Smooth Rotate Transition */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-ink-soft hover:text-ink active:scale-95 rounded-md hover:bg-background transition-all duration-300 ease-in-out relative w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
          aria-label={mobileMenuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        >
          {/* Hamburger Icon: Berputar 180° perlahan & memudar */}
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
              mobileMenuOpen ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'
            }`}
          >
            <Menu className="w-5 h-5 text-current" strokeWidth={1.75} />
          </span>

          {/* X (Close) Icon: Berputar masuk dari -180° perlahan & membesar */}
          <span
            className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
              mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'
            }`}
          >
            <X className="w-5 h-5 text-current" strokeWidth={1.75} />
          </span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay (below header) */}
      <div
        className={`fixed inset-0 top-16 z-30 bg-ink/40 backdrop-blur-xs md:hidden transition-opacity duration-500 ease-in-out ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Dropdown Navbar: Smooth Slide Down from Top */}
      <div
        className={`md:hidden absolute top-full left-0 right-0 bg-surface border-b border-border shadow-2xl transition-all duration-500 ease-in-out will-change-transform z-40 ${
          mobileMenuOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-6 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-5 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col gap-1.5 text-sm">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left py-2.5 px-3.5 rounded-lg border text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-xs font-bold'
                      : 'border-transparent text-ink hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-col gap-2.5 pt-3 border-t border-border/80">
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
            >
              Buat Laporan
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
