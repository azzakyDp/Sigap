import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, PlusCircle, ClipboardCheck, Wrench, Settings, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const getNavLinks = (role) => {
    switch (role) {
      case 'VERIFIER':
        return [
          { name: 'Antrean Verifikasi', path: '/verifier', icon: ClipboardCheck },
          { name: 'Peta Sebaran', path: '/verifier/map', icon: MapPin },
        ];
      case 'OFFICER':
        return [
          { name: 'Tugas Saya', path: '/officer', icon: Wrench },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard Admin', path: '/admin', icon: Settings },
          { name: 'Antrean Verifikasi', path: '/verifier', icon: ClipboardCheck },
          { name: 'Peta Sebaran', path: '/verifier/map', icon: MapPin },
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
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary-light text-primary border border-primary/20'
                      : 'text-ink hover:bg-background hover:text-primary'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
