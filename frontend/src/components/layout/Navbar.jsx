import React from 'react';
import { ShieldAlert, Menu, LogOut, User } from 'lucide-react';
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
              className="lg:hidden text-ink hover:bg-background p-1.5 rounded-md border border-border transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-ink">
              SIGAP <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-md border border-primary/20">Phase 1</span>
            </span>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-ink flex items-center justify-end gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                {user.nama}
              </div>
              <div className="text-xs text-ink-soft">{user.email}</div>
            </div>
            <Badge variant="blue">{user.role}</Badge>
            <Button variant="danger" className="py-1.5 px-3 text-xs" onClick={logout} icon={LogOut}>
              Keluar
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
