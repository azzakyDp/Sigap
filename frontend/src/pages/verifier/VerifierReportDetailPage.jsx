import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { getReportDetailApi } from '../../api/reports';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Button from '../../components/ui/Button';
import ReportDetailView from '../../components/report/ReportDetailView';
import VerifyReportModal from '../../components/verifier/VerifyReportModal';
import UpdatePriorityModal from '../../components/verifier/UpdatePriorityModal';
import AssignOfficerModal from '../../components/verifier/AssignOfficerModal';
import CloseCaseModal from '../../components/verifier/CloseCaseModal';
import AIAnalysisPanel from '../../components/verifier/AIAnalysisPanel';
import { getErrorMessage } from '../../utils/errors';

export default function VerifierReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal visibility states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

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

  const handleActionSuccess = (updatedReport) => {
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
          <p className="text-sm font-medium">Memuat detail laporan verifikasi #{id}...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !report) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="w-16 h-16 bg-status-amber-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-status-amber-border text-status-amber-text">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Laporan Tidak Ditemukan</h2>
          <p className="text-ink-soft text-sm mb-6 max-w-md mx-auto">
            {error || 'Laporan pengaduan yang Anda cari tidak ditemukan atau Anda tidak memiliki hak akses untuk membukanya.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/verifier')} icon={ArrowLeft}>
              Kembali ke Antrean Verifikasi
            </Button>
            <Button variant="primary" onClick={fetchDetail} icon={RefreshCw}>
              Coba Lagi
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusRaw = report.status_raw;
  const isPendingVerification = statusRaw === 'PENDING_VERIFICATION';
  const isAssignable = ['VERIFIED', 'ASSIGNED', 'UNRESOLVED'].includes(statusRaw);
  const isClosable = ['RESOLVED', 'UNRESOLVED'].includes(statusRaw);
  const isPriorityModifiable = !['REJECTED', 'DUPLICATE', 'CLOSED'].includes(statusRaw);

  const hasAssignment = !!report.current_assignment;
  const assignButtonLabel = hasAssignment ? 'Tugaskan Ulang' : 'Tugaskan';

  return (
    <DashboardLayout>
      <ReportDetailView
        report={report}
        audience="staff"
        backTo="/verifier"
        backLabel="Kembali ke Antrean Verifikasi"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Verifikasi */}
            {isPendingVerification && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setShowVerifyModal(true)}
              >
                Verifikasi
              </Button>
            )}

            {/* 2. Tugaskan / Tugaskan Ulang */}
            {isAssignable && (
              <Button
                variant="primary"
                size="sm"
                icon={UserCheck}
                onClick={() => setShowAssignModal(true)}
              >
                {assignButtonLabel}
              </Button>
            )}

            {/* 3. Ubah Prioritas */}
            {isPriorityModifiable && (
              <Button
                variant="secondary"
                size="sm"
                icon={ShieldAlert}
                onClick={() => setShowPriorityModal(true)}
              >
                Ubah Prioritas
              </Button>
            )}

            {/* 4. Tutup Kasus */}
            {isClosable && (
              <Button
                variant="secondary"
                size="sm"
                icon={Lock}
                onClick={() => setShowCloseModal(true)}
              >
                Tutup Kasus
              </Button>
            )}
          </div>
        }
        aiPanel={<AIAnalysisPanel reportId={report.id} />}
        onRefresh={() => {
          fetchDetail();
        }}
      />

      {/* Action Modals */}
      <VerifyReportModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        report={report}
        onSuccess={handleActionSuccess}
      />

      <UpdatePriorityModal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        report={report}
        onSuccess={handleActionSuccess}
      />

      <AssignOfficerModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        report={report}
        onSuccess={handleActionSuccess}
      />

      <CloseCaseModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        report={report}
        onSuccess={handleActionSuccess}
      />
    </DashboardLayout>
  );
}
