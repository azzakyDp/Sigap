import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import ReportList from '../../components/report/ReportList';
import { getAssignedToMeApi } from '../../api/workflow';
import Alert from '../../components/ui/Alert';
import { getErrorMessage } from '../../utils/errors';

export default function AssignedReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchAssignedReports = async (currentPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssignedToMeApi(currentPage, pageSize);
      setReports(data.items || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error('Gagal mengambil daftar tugas:', err);
      setError(getErrorMessage(err, 'Gagal memuat daftar tugas laporan Anda.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedReports(page);
  }, [page]);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Tugas Saya
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            Daftar pengaduan laporan yang ditugaskan kepada Anda secara aktif untuk penanganan lapangan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            onClick={() => fetchAssignedReports(page)}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Container */}
      <Card className="p-0 overflow-hidden">
        {error && (
          <Alert
            variant="error"
            className="m-4"
            action={
              <Button variant="danger" size="sm" onClick={() => fetchAssignedReports(page)}>
                Coba Lagi
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="py-16 text-center text-ink-soft">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
            <p className="text-sm font-medium">Memuat daftar tugas penanganan Anda...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <h3 className="text-base font-semibold text-ink mb-1">
              Tidak Ada Tugas Penanganan
            </h3>
            <p className="text-ink-soft text-sm max-w-md mx-auto">
              Saat ini belum ada pengaduan laporan yang di-assign secara aktif kepada Anda.
            </p>
          </div>
        ) : (
          <div>
            <ReportList
              reports={reports}
              audience="staff"
              onOpen={(id) => navigate(`/officer/reports/${id}`)}
            />

            <div className="px-4 py-2">
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
