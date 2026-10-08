import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleHomeRedirect = () => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    switch (user?.role) {
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
        <Card className="p-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-4 font-mono text-lg font-semibold">
            404
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Halaman Tidak Ditemukan</h1>
          <p className="text-ink-soft text-sm mb-6">
            Maaf, alamat URL atau halaman SIGAP yang Anda tuju tidak ditemukan atau telah dipindahkan.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" fullWidth onClick={handleHomeRedirect}>
              {isAuthenticated ? 'Kembali ke Dashboard' : 'Kembali ke Beranda'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>
              Halaman Sebelumnya
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
