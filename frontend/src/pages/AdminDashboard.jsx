import React from 'react';
import { User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Table from '../components/ui/Table';

export default function AdminDashboard() {
  const { user } = useAuth();

  const allReportsSample = [
    { id: 1, title: 'Lampu Lalu Lintas Padam di Jl. Sudirman', status: 'PENDING_VERIFICATION', priority: 'MEDIUM', date: '2026-09-26' },
    { id: 2, title: 'Kemacetan akibat Kecelakaan Ganda', status: 'VERIFIED', priority: 'URGENT', date: '2026-09-26' },
    { id: 3, title: 'Pohon Tumbang Menutup Jalur', status: 'IN_PROGRESS', priority: 'HIGH', date: '2026-09-26' },
    { id: 4, title: 'Banjir Genangan Air', status: 'RESOLVED', priority: 'MEDIUM', date: '2026-09-25' },
    { id: 5, title: 'Laporan Pengaduan Palsu', status: 'REJECTED', priority: 'LOW', date: '2026-09-24' },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-ink tracking-tight">Dashboard Administrator</h1>
        <p className="text-ink-soft text-sm mt-1">Portal manajemen sistem SIGAP & pemantauan global.</p>
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

        <Card title="Monitoring Seluruh Pengaduan Sistem" subtitle="Pengujian visual warna status terpusat" className="lg:col-span-2">
          <Table
            headers={['ID', 'Judul Pengaduan', 'Status', 'Prioritas', 'Tanggal']}
            data={allReportsSample}
            renderRow={(row) => (
              <tr key={row.id} className="hover:bg-background transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">#{row.id}</td>
                <td className="px-4 py-3 font-semibold text-ink">{row.title}</td>
                <td className="px-4 py-3">
                  <Badge type="status" value={row.status} />
                </td>
                <td className="px-4 py-3">
                  <Badge type="priority" value={row.priority} />
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">{row.date}</td>
              </tr>
            )}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
