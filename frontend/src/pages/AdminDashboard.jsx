import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, ClipboardCheck, Info } from 'lucide-react';
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
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Dashboard Administrator</h1>
        <p className="text-ink-soft text-sm mt-1">Portal manajemen sistem SIGAP & verifikasi operasional.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={`Halo, ${user?.nama || 'Admin'}`} subtitle="Informasi Administrator" className="lg:col-span-1">
          <div className="space-y-3 text-ink text-sm">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" /> Nama:
              </span>
              <span className="font-bold">{user?.nama}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-medium flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" /> Email:
              </span>
              <span className="font-semibold text-xs text-ink">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-ink-soft font-medium flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" /> Role:
              </span>
              <Badge variant="blue">{user?.role}</Badge>
            </div>
          </div>
        </Card>

        <Card title="Operasional & Pengaduan Sistem" subtitle="Akses penuh verifikasi & manajemen laporan" className="lg:col-span-2">
          <div className="py-8 px-4 text-center">
            <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <ClipboardCheck className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">
              Verifikasi & Manajemen Laporan
            </h3>
            <p className="text-ink-soft text-sm max-w-md mx-auto mb-6">
              Sebagai Administrator, Anda memiliki akses penuh untuk melakukan verifikasi, penugasan petugas, serta pemantauan sebaran laporan pada antrean verifikator.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/verifier')}
              icon={ClipboardCheck}
            >
              Buka Antrean Verifikasi Laporan
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
