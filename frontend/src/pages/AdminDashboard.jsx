import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Dashboard Administrator</h1>
        <p className="text-ink-soft text-sm mt-1">Portal manajemen sistem SIGAP & verifikasi operasional.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={`Halo, ${user?.nama || 'Admin'}`} subtitle="Informasi Administrator" className="lg:col-span-1">
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
              <span className="text-ink-soft font-normal">Role:</span>
              <Badge variant="blue">{user?.role}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Operasional & Pengaduan Sistem" subtitle="Akses penuh verifikasi & manajemen laporan" className="lg:col-span-2">
          <div className="py-8 px-4 text-center">
            <h3 className="text-base font-semibold text-ink mb-1">
              Verifikasi & Manajemen Laporan
            </h3>
            <p className="text-ink-soft text-sm max-w-md mx-auto mb-6">
              Sebagai Administrator, Anda memiliki akses penuh untuk melakukan verifikasi, penugasan petugas, serta pemantauan sebaran laporan pada antrean verifikator.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/verifier')}
            >
              Buka Antrean Verifikasi Laporan
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
