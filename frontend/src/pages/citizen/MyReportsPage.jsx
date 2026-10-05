import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Eye,
  MapPin,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getMyReportsApi } from '../../api/reports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ReportList from '../../components/report/ReportList';
import Alert from '../../components/ui/Alert';
import { getErrorMessage } from '../../utils/errors';

export default function MyReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchMyReports = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyReportsApi(currentPage, pageSize);
      setReports(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error('Gagal mengambil daftar laporan:', err);
      setError(getErrorMessage(err, 'Gagal memuat daftar laporan Anda.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports(page);
  }, [page]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            Laporan Saya
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            Pantau status dan perkembangan pengaduan gangguan lalu lintas yang telah Anda laporkan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            onClick={() => fetchMyReports(page)}
            loading={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate('/reports/create')}
            icon={PlusCircle}
          >
            Buat Laporan Baru
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <Card className="p-0 overflow-hidden">
        {/* Error Alert */}
        {error && (
          <Alert
            variant="error"
            className="m-4"
            action={
              <Button variant="danger" size="sm" onClick={() => fetchMyReports(page)}>
                Coba Lagi
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center text-ink-soft">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm font-medium">Memuat daftar laporan Anda...</p>
          </div>
        ) : reports.length === 0 ? (
          /* Empty State Verification */
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">
              Belum Ada Laporan Pengaduan
            </h3>
            <p className="text-ink-soft text-sm max-w-md mx-auto mb-6">
              Anda belum pernah mengajukan laporan gangguan lalu lintas. Laporkan masalah fasilitas atau kejadian di jalan sekitar Anda sekarang.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/reports/create')}
              icon={PlusCircle}
            >
              Buat Laporan Pertama
            </Button>
          </div>
        ) : (
          <div>
            <ReportList
              reports={reports}
              audience="citizen"
              onOpen={(id) => navigate(`/reports/${id}`)}
            />

            {/* Pagination Controls */}
            <div className="px-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(newPage) => setPage(newPage)}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
