import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Icon from '../../components/ui/Icon';
import { getReportDetailApi } from '../../api/reports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import ReportDetailView from '../../components/report/ReportDetailView';
import { getErrorMessage } from '../../utils/errors';

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportDetailApi(id);
      setReport(data);
    } catch (err) {
      console.error('Gagal mengambil detail laporan:', err);
      setError(
        getErrorMessage(
          err,
          'Laporan tidak ditemukan atau Anda tidak memiliki akses untuk melihat laporan ini.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-ink-soft">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-sm font-medium">Memuat detail pengaduan laporan #{id}...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="flex justify-center mb-4">
            <Icon icon={AlertCircle} size="nav" className="text-status-amber-text" />
          </div>
          <h2 className="text-base font-semibold text-ink mb-2">Laporan Tidak Ditemukan</h2>
          <p className="text-ink-soft text-sm mb-6 max-w-md mx-auto">
            {error || 'Laporan pengaduan yang Anda cari tidak ditemukan atau Anda tidak memiliki hak akses untuk membukanya.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/reports/me')}>
              Kembali ke Daftar Laporan Saya
            </Button>
            <Button variant="primary" onClick={fetchDetail}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ReportDetailView
        report={report}
        audience="citizen"
        backTo="/reports/me"
        backLabel="Kembali ke Daftar Laporan"
        onRefresh={fetchDetail}
      />
    </DashboardLayout>
  );
}
