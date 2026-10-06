import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Icon from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { getReportDetailApi } from '../../api/reports';
import { startHandlingApi } from '../../api/workflow';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import ReportDetailView from '../../components/report/ReportDetailView';
import ActionReportForm from '../../components/officer/ActionReportForm';
import ResolveReportModal from '../../components/officer/ResolveReportModal';
import { getErrorMessage } from '../../utils/errors';

export default function OfficerReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startingHandling, setStartingHandling] = useState(false);

  // Modal visibility states
  const [showActionForm, setShowActionForm] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);

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

  const handleStartHandling = async () => {
    setStartingHandling(true);
    setError(null);
    try {
      const updatedReport = await startHandlingApi(id);
      setReport(updatedReport);
    } catch (err) {
      console.error('Gagal mulai penanganan:', err);
      setError(getErrorMessage(err, 'Gagal mengubah status menjadi Dalam Penanganan.'));
    } finally {
      setStartingHandling(false);
    }
  };

  const handleActionSuccess = (newActionReport) => {
    if (newActionReport && report) {
      // Append new action report and refetch to sync all histories
      const updatedActions = [newActionReport, ...(report.action_reports || [])];
      setReport((prev) => ({
        ...prev,
        action_reports: updatedActions,
      }));
      fetchDetail();
    } else {
      fetchDetail();
    }
  };

  const handleResolveSuccess = (updatedReport) => {
    if (updatedReport) {
      setReport(updatedReport);
    } else {
      fetchDetail();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-ink-soft">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-sm font-medium">Memuat detail tugas penanganan #{id}...</p>
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
          <h2 className="text-xl font-bold text-ink mb-2">Laporan Tidak Ditemukan</h2>
          <p className="text-ink-soft text-sm mb-6 max-w-md mx-auto">
            {error || 'Laporan pengaduan yang Anda cari tidak ditemukan atau Anda tidak memiliki hak akses untuk membukanya.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/officer')}>
              Kembali ke Tugas Saya
            </Button>
            <Button variant="primary" onClick={fetchDetail}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isAssignedOfficer = report.current_assignment?.officer_id === user?.id;
  const statusRaw = report.status_raw;

  const isAssigned = statusRaw === 'ASSIGNED';
  const isInProgress = statusRaw === 'IN_PROGRESS';

  const actionButtons = isAssignedOfficer ? (
    <div className="flex flex-wrap items-center gap-2">
      {/* ASSIGNED -> Mulai Tangani */}
      {isAssigned && (
        <Button
          variant="primary"
          size="sm"
          loading={startingHandling}
          onClick={handleStartHandling}
        >
          Mulai Tangani
        </Button>
      )}

      {/* IN_PROGRESS -> Catat Tindakan & Selesaikan */}
      {isInProgress && (
        <>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowActionForm(true)}
          >
            Catat Tindakan
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowResolveModal(true)}
          >
            Selesaikan
          </Button>
        </>
      )}
    </div>
  ) : null;

  return (
    <DashboardLayout>
      <ReportDetailView
        report={report}
        audience="staff"
        backTo="/officer"
        backLabel="Kembali ke Tugas Saya"
        actions={actionButtons}
        onRefresh={fetchDetail}
      />

      {/* Officer Action Form Modal */}
      <ActionReportForm
        isOpen={showActionForm}
        onClose={() => setShowActionForm(false)}
        report={report}
        onSuccess={handleActionSuccess}
      />

      {/* Officer Resolve Modal */}
      <ResolveReportModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        report={report}
        onSuccess={handleResolveSuccess}
      />
    </DashboardLayout>
  );
}
