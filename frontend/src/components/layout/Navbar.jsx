import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden text-ink hover:bg-background p-1.5 rounded-md border border-border transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5 text-current" strokeWidth={1.75} />
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
