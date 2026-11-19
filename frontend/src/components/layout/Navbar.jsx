import React from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Navbar({ isOpen = false, onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40 shadow-xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden text-ink hover:bg-background active:scale-95 p-1.5 rounded-md border border-border transition-all duration-300 ease-in-out relative w-9 h-9 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden shadow-2xs"
              aria-label={isOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            >
              {/* Hamburger Icon: Berputar 180° perlahan & memudar halus */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isOpen ? 'opacity-0 rotate-180 scale-50' : 'opacity-100 rotate-0 scale-100'
                }`}
              >
                <Menu className="w-5 h-5 text-current" strokeWidth={1.75} />
              </span>

              {/* X (Close) Icon: Berputar masuk dari -180° perlahan & membesar */}
              <span
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-50'
                }`}
              >
                <X className="w-5 h-5 text-current" strokeWidth={1.75} />
              </span>
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold text-ink">
              SIGAP
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-ink">
                {user.nama}
              </div>
              <div className="text-xs text-ink-soft">{user.email}</div>
            </div>
            <Badge variant="blue">{user.role}</Badge>
            <Button variant="ghost" size="sm" onClick={logout}>
              Keluar
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
