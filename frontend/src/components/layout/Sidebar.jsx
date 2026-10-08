import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, PlusCircle, ClipboardCheck, Wrench, Settings, MapPin } from 'lucide-react';
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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-30 w-64 bg-surface border-r border-border p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="text-xs font-semibold text-ink-soft mb-3 px-3">
          Menu utama ({user?.role})
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
      </aside>
    </>
  );
}
