import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { getErrorMessage } from '../utils/errors';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    email: '',
    nomor_hp: '',
    password: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nama.trim() || formData.nama.length < 2) {
      errors.nama = 'Nama lengkap minimal 2 karakter.';
    }

    if (!/^\d{16}$/.test(formData.nik.trim())) {
      errors.nik = 'NIK harus 16 digit angka.';
    }

    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = 'Format email tidak valid.';
    }

    if (!/^\+?\d{10,15}$/.test(formData.nomor_hp.trim())) {
      errors.nomor_hp = 'Nomor HP harus 10-15 digit angka.';
    }

    if (formData.password.length < 8) {
      errors.password = 'Password minimal 8 karakter.';
    } else {
      if (!/[A-Z]/.test(formData.password)) {
        errors.password = 'Password harus mengandung minimal 1 huruf besar.';
      } else if (!/[a-z]/.test(formData.password)) {
        errors.password = 'Password harus mengandung minimal 1 huruf kecil.';
      } else if (!/\d/.test(formData.password)) {
        errors.password = 'Password harus mengandung minimal 1 digit angka.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await register({
        nama: formData.nama.trim(),
        nik: formData.nik.trim(),
        email: formData.email.trim(),
        nomor_hp: formData.nomor_hp.trim(),
        password: formData.password,
      });

      navigate('/login', {
        state: { message: 'Registrasi berhasil! Silakan masuk dengan akun baru Anda.' },
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Registrasi gagal. Periksa kembali data Anda.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Registrasi Akun SIGAP</h1>
          <p className="text-ink-soft text-xs mt-1">Daftarkan akun masyarakat (CITIZEN) untuk menyampaikan laporan</p>
        </div>

        <Card title="Buat Akun Baru" subtitle="Isi formulir pendaftaran di bawah ini">
          {error && (
            <div className="mb-4 p-3.5 bg-danger-light border border-danger/30 rounded-md text-sm text-danger font-medium flex items-center gap-2">
              <Icon icon={AlertCircle} size="sm" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              error={fieldErrors.nama}
              placeholder="Sesuai KTP"
              required
            />

            <Input
              label="NIK (Nomor Induk Kependudukan)"
              name="nik"
              value={formData.nik}
              onChange={handleChange}
              error={fieldErrors.nik}
              placeholder="16 digit angka KTP"
              maxLength={16}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
              placeholder="email@domain.com"
              required
            />

            <Input
              label="Nomor HP"
              type="tel"
              name="nomor_hp"
              value={formData.nomor_hp}
              onChange={handleChange}
              error={fieldErrors.nomor_hp}
              placeholder="08123456789"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              placeholder="Min. 8 karakter (huruf besar, kecil, angka)"
              helperText="Harus ada minimal 1 huruf besar, 1 huruf kecil, dan 1 angka."
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
              Daftar Sekarang
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/60 text-center text-sm text-ink-soft">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
