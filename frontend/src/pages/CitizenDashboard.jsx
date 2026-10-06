import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Dashboard Masyarakat (Citizen)</h1>
          <p className="text-ink-soft text-sm mt-1">Selamat datang kembali di portal layanan pengaduan SIGAP.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={() => navigate('/reports/create')}>
            Buat Laporan Baru
          </Button>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
            Info Sistem
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={`Halo, ${user?.nama || 'User'}`} subtitle="Informasi Akun Terdaftar" className="lg:col-span-1">
          <div className="space-y-3 text-ink text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-normal">Nama:</span>
              <span className="font-normal text-ink">{user?.nama}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-normal">Email:</span>
              <span className="font-normal text-xs text-ink">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-normal">HP:</span>
              <span className="font-normal text-ink">{user?.nomor_hp}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-normal">Role:</span>
              <Badge variant="blue">{user?.role}</Badge>
            </div>
          </div>
        </Card>

        <Card
          title="Laporan Saya"
          subtitle="Pantau status dan tracking laporan pengaduan Anda"
          className="lg:col-span-2"
        >
          <div className="p-6 text-center space-y-3">
            <p className="text-ink-soft text-sm">
              Akses daftar lengkap laporan pengaduan beserta timeline tracking status secara real-time.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="primary" onClick={() => navigate('/reports/me')}>
                Buka Tracking Dashboard Laporan Saya
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Informasi Sistem SIGAP"
        footer={<Button variant="secondary" onClick={() => setIsModalOpen(false)}>Tutup</Button>}
      >
        <p className="text-ink">
          Pada Phase 1 & 2 ini, fondasi autentikasi, manajemen token, protected routes, komponen UI primitif, serta alur pengajuan laporan masyarakat telah aktif.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
