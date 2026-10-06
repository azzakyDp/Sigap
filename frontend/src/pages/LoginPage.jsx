import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Info, AlertCircle } from 'lucide-react';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getErrorMessage } from '../utils/errors';

export default function LoginPage() {
  const location = useLocation();
  const successMessage = location.state?.message || '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (role) => {
    switch (role) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Silakan isi email/nomor HP dan password Anda.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(identifier, password);
      handleRedirect(user.role);
    } catch (err) {
      const backendMessage = getErrorMessage(
        err,
        'Gagal terhubung ke server. Periksa koneksi internet Anda.'
      );
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">SIGAP</h1>
          <p className="text-ink-soft text-sm mt-1">Sistem Informasi Pengaduan Gangguan Lalu Lintas</p>
        </div>

        <Card title="Masuk ke Akun Anda" subtitle="Masukkan kredensial yang sudah terdaftar">
          {successMessage && (
            <div className="mb-4 p-3.5 bg-status-green-bg border border-status-green-border rounded-md text-sm text-status-green-text font-medium flex items-center gap-2">
              <Icon icon={Info} size="sm" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 bg-danger-light border border-danger/30 rounded-md text-sm text-danger font-medium flex items-center gap-2">
              <Icon icon={AlertCircle} size="sm" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email atau Nomor HP"
              type="text"
              name="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Contoh: user@domain.com atau 08123456789"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password Anda"
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
              Masuk
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/60 text-center text-sm text-ink-soft">
            Belum punya akun?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
