import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function UnauthorizedPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardRedirect = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    switch (user.role) {
      case 'VERIFIER':
        navigate('/verifier');
        break;
      case 'OFFICER':
        navigate('/officer');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'CITIZEN':
      default:
        navigate('/dashboard');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md text-center">
        <Card>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-light border border-danger/30 rounded-full text-danger mb-4">
            <ShieldX className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink mb-2">403 - Akses Ditolak</h1>
          <p className="text-ink-soft text-sm mb-6">
            Anda tidak memiliki hak akses (role: <span className="font-bold text-ink">{user?.role || 'Guest'}</span>) untuk membuka halaman ini.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" fullWidth onClick={handleDashboardRedirect} icon={Home}>
              Kembali ke Dashboard
            </Button>
            <Button variant="secondary" fullWidth onClick={logout} icon={LogOut}>
              Keluar Sesi
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
