import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, PlusCircle, ClipboardCheck, Wrench, Settings, MapPin, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const getNavLinks = (role) => {
    switch (role) {
      case 'VERIFIER':
        return [
          { name: 'Antrean Verifikasi', path: '/verifier', icon: ClipboardCheck },
          { name: 'Peta Sebaran', path: '/verifier?view=map', icon: MapPin },
        ];
      case 'OFFICER':
        return [
          { name: 'Tugas Saya', path: '/officer', icon: Wrench },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard Admin', path: '/admin', icon: Settings },
          { name: 'Antrean Verifikasi', path: '/verifier', icon: ClipboardCheck },
          { name: 'Peta Sebaran', path: '/verifier?view=map', icon: MapPin },
        ];
      case 'CITIZEN':
      default:
        return [
          { name: 'Dashboard Saya', path: '/dashboard', icon: Home },
          { name: 'Laporan Saya', path: '/reports/me', icon: FileText },
          { name: 'Buat Laporan', path: '/reports/create', icon: PlusCircle },
        ];
    }
  };

  const links = getNavLinks(user?.role);

  const isLinkActive = (linkPath) => {
    const [targetPathname, targetSearch] = linkPath.split('?');
    const currentPath = location.pathname;
    const currentParams = new URLSearchParams(location.search);
    const currentView = currentParams.get('view');

    // --- Parent-path matching for detail pages ---
    // /verifier/reports/:id  -> highlights "Antrean" (/verifier, no ?view=map)
    if (targetPathname === '/verifier' && !targetSearch) {
      if (currentPath.startsWith('/verifier/reports/')) return true;
      if (currentPath !== '/verifier') return false;
      return currentView !== 'map';
    }

    // /verifier?view=map  -> highlights "Peta Sebaran" only on /verifier?view=map
    if (targetPathname === '/verifier' && targetSearch) {
      if (currentPath !== '/verifier') return false;
      const targetParams = new URLSearchParams(targetSearch);
      return currentView === targetParams.get('view');
    }

    // /officer/reports/:id  -> highlights "Tugas Saya" (/officer)
    if (targetPathname === '/officer') {
      if (currentPath.startsWith('/officer/reports/')) return true;
      return currentPath === '/officer';
    }

    // /reports/:id (citizen)  -> highlights "Laporan Saya" (/reports/me)
    if (targetPathname === '/reports/me') {
      if (/^\/reports\/[^/]+$/.test(currentPath) && currentPath !== '/reports/create') return true;
      return currentPath === '/reports/me';
    }

    // Exact match for all other paths (/dashboard, /admin, /reports/create, etc.)
    return currentPath === targetPathname;
  };

  return (
    <>
      {/* Mobile Backdrop with Smooth Fade Animation */}
      <div
        className={`fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs lg:hidden transition-opacity duration-400 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Container: Full 100% Height on Mobile (No gaps), Left-pinned Column on Desktop */}
      <aside
        className={`fixed z-50 bg-surface border-r border-border p-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform
          /* Mobile view: full 100% height from top to bottom (inset-y-0 h-full) with smooth pop from left */
          top-0 left-0 bottom-0 h-full w-72 max-w-[85vw] shadow-2xl flex flex-col justify-between
          ${isOpen ? 'translate-x-0 opacity-100 scale-100 pointer-events-auto' : '-translate-x-full opacity-90 scale-[0.98] pointer-events-none'}
          /* Desktop view: fixed beneath navbar (top-16) */
          lg:top-16 lg:left-0 lg:bottom-0 lg:w-64 lg:h-auto lg:translate-x-0 lg:opacity-100 lg:scale-100 lg:shadow-none lg:pointer-events-auto
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Mobile-Only Header with Brand & Close Button */}
          <div className="flex lg:hidden items-center justify-between pb-4 border-b border-border mb-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-ink">SIGAP</span>
              <span className="text-2xs text-ink-soft bg-slate-100 px-2 py-0.5 rounded border border-border">
                {user?.role || 'User'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-ink-soft hover:text-ink hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5 text-current" strokeWidth={1.75} />
            </button>
          </div>

          <div className="text-xs font-semibold text-ink-soft mb-3 px-3">
            Menu utama
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 ${
                    active
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-ink-soft hover:text-ink hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0 text-current" strokeWidth={1.75} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer in Mobile view */}
        <div className="pt-4 border-t border-border/80 lg:hidden text-2xs text-ink-soft text-center">
          SIGAP Kabupaten Lamongan
        </div>
      </aside>
    </>
  );
}