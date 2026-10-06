import React from 'react';
import { useNavigate } from 'react-router-dom';
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
          <h1 className="text-2xl font-bold text-ink mb-2">403 - Akses Ditolak</h1>
          <p className="text-ink-soft text-sm mb-6">
            Anda tidak memiliki hak akses (role: <span className="font-semibold text-ink">{user?.role || 'Guest'}</span>) untuk membuka halaman ini.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" fullWidth onClick={handleDashboardRedirect}>
              Kembali ke Dashboard
            </Button>
            <Button variant="ghost" fullWidth onClick={logout}>
              Keluar Sesi
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
