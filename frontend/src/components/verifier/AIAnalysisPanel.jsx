import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  FileText,
  Clock,
} from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Alert from '../ui/Alert';
import Button from '../ui/Button';
import { getOrTriggerAnalysisApi, reanalyzeApi } from '../../api/aiAnalysis';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errors';

export default function AIAnalysisPanel({ reportId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const pollingIntervalRef = useRef(null);
  const pollCountRef = useRef(0);
  const maxPollCount = 20; // Maximum 20 cycles (approx 60 seconds at 3s interval)

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchAnalysisData = async (isInitial = false) => {
    if (!reportId) return;
    if (isInitial) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await getOrTriggerAnalysisApi(reportId);
      setAnalysis(data);
      setError(null);

      const status = data?.status?.toUpperCase();

      if (status === 'PENDING' || status === 'PROCESSING') {
        startPolling();
      } else {
        stopPolling();
      }
    } catch (err) {
      console.warn('Gagal mengambil analisis AI:', err);
      stopPolling();
      if (isInitial) {
        setError(getErrorMessage(err, 'Gagal terhubung ke layanan AI analysis.'));
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const startPolling = () => {
    if (pollingIntervalRef.current) return;

    pollCountRef.current = 0;
    pollingIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current > maxPollCount) {
        stopPolling();
        return;
      }

      try {
        const data = await getOrTriggerAnalysisApi(reportId);
        setAnalysis(data);
        const status = data?.status?.toUpperCase();
        if (status === 'COMPLETED' || status === 'FAILED') {
          stopPolling();
        }
      } catch (err) {
        console.warn('Polling AI analysis gagal:', err);
        stopPolling();
      }
    }, 3000);
  };

  useEffect(() => {
    fetchAnalysisData(true);

    return () => {
      stopPolling();
    };
  }, [reportId]);

  const handleReanalyze = async () => {
    if (!reportId || isReanalyzing) return;
    setIsReanalyzing(true);
    stopPolling();

    try {
      const newAnalysis = await reanalyzeApi(reportId);
      setAnalysis(newAnalysis);
      setError(null);
      const status = newAnalysis?.status?.toUpperCase();
      if (status === 'PENDING' || status === 'PROCESSING') {
        startPolling();
      }
    } catch (err) {
      console.error('Gagal memicu analisis ulang AI:', err);
      setError(getErrorMessage(err, 'Gagal memicu analisis ulang AI.'));
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleRetryFetch = () => {
    fetchAnalysisData(true);
  };

  // 1. Loading Initial State
  if (loading) {
    return (
      <Card className="p-4 border-border/80">
        <div className="flex items-center gap-2.5 text-xs text-ink-soft">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary shrink-0"></div>
          <span className="font-semibold">Memuat rekomendasi AI...</span>
        </div>
      </Card>
    );
  }

  // 2. Initial Network/Server Error
  if (error && !analysis) {
    return (
      <Card className="p-4 border-border/80">
        <Alert variant="error" title="Gagal Memuat AI" message={error} />
        <div className="mt-3 text-right">
          <Button variant="secondary" size="sm" onClick={handleRetryFetch} icon={RefreshCw}>
            Coba Lagi
          </Button>
        </div>
      </Card>
    );
  }

  const status = (analysis?.status || 'PENDING').toUpperCase();

  // 3. PENDING / PROCESSING State
  if (status === 'PENDING' || status === 'PROCESSING') {
    return (
      <Card className="p-4 space-y-3 border-border/80">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <Cpu className="w-4 h-4 text-primary shrink-0" />
            <span>Rekomendasi AI — bukan keputusan final</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 bg-status-blue-bg/40 border border-status-blue-border rounded-lg text-xs text-status-blue-text font-medium">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary shrink-0"></div>
          <span>AI sedang menganalisis laporan ini...</span>
        </div>
      </Card>
    );
  }

  // 4. FAILED State
  if (status === 'FAILED') {
    return (
      <Card className="p-4 space-y-3 border-border/80">
        <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <Cpu className="w-4 h-4 text-ink-soft shrink-0" />
            <span>Rekomendasi AI — bukan keputusan final</span>
          </div>
        </div>

        <Alert variant="info" title="Analisis AI Belum Tersedia">
          Analisis AI belum tersedia untuk laporan ini. Anda tetap dapat melakukan verifikasi manual secara penuh.
        </Alert>

        <div className="flex items-center justify-between pt-1">
          <Button variant="secondary" size="sm" onClick={handleRetryFetch} icon={RefreshCw}>
            Coba lagi
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReanalyze}
            loading={isReanalyzing}
            icon={RefreshCw}
          >
            Analisis Ulang
          </Button>
        </div>
      </Card>
    );
  }

  // 5. COMPLETED State
  const confidenceValue = typeof analysis?.confidence === 'number' ? analysis.confidence : 0;
  const confidencePercent = (confidenceValue * 100).toFixed(0);

  let confidenceText = 'Tinggi';
  if (confidenceValue < 0.6) {
    confidenceText = 'Rendah';
  } else if (confidenceValue < 0.8) {
    confidenceText = 'Sedang';
  }

  return (
    <Card className="p-4 space-y-3.5 border-border/80 shadow-xs">
      {/* Non-intrusive Disclaimer Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
          <Cpu className="w-4 h-4 text-primary shrink-0" />
          <span>Rekomendasi AI — bukan keputusan final</span>
        </div>
        {analysis?.needs_human_review && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-status-amber-bg text-status-amber-text border border-status-amber-border">
            Tinjau Manual
          </span>
        )}
      </div>

      {/* Prominent Human Review Alert if needed */}
      {analysis?.needs_human_review && (
        <Alert variant="warning" title="Perhatian Verifikator">
          AI tidak yakin dengan rekomendasi ini — tinjau manual dengan cermat.
        </Alert>
      )}

      {/* Suggested Category & Priority Badges */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {analysis?.suggested_category && (
          <div className="flex items-center gap-1 text-ink-soft bg-background px-2.5 py-1 rounded border border-border">
            <span className="font-semibold text-ink-soft">Kategori:</span>
            <span className="font-bold text-ink">{analysis.suggested_category}</span>
          </div>
        )}
        {analysis?.suggested_priority && (
          <div className="flex items-center gap-1">
            <span className="text-ink-soft font-semibold">Prioritas:</span>
            <Badge type="priority" value={analysis.suggested_priority} />
          </div>
        )}
      </div>

      {/* Summary (1-2 line clamped) */}
      {analysis?.summary && (
        <p className="text-xs text-ink leading-relaxed line-clamp-2 bg-background p-2.5 rounded border border-border/60">
          {analysis.summary}
        </p>
      )}

      {/* Toggle Expand Details */}
      <div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover transition-colors cursor-pointer"
        >
          {isExpanded ? (
            <>
              <span>Sembunyikan detail</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Lihat selengkapnya</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Expanded Details Panel */}
      {isExpanded && (
        <div className="pt-2 border-t border-border/50 space-y-3 text-xs">
          {/* Confidence */}
          <div className="p-2.5 bg-background rounded border border-border/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink-soft flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Tingkat Keyakinan Model:
              </span>
              <span className="font-extrabold text-primary">
                Keyakinan {confidenceText} ({confidencePercent}%)
              </span>
            </div>
            <p className="text-[10px] text-ink-soft">
              Keyakinan internal model AI — bukan skor kebenaran laporan.
            </p>
          </div>

          {/* Warnings List */}
          {analysis?.warnings && analysis.warnings.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold text-status-amber-text flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Peringatan / Catatan Perhatian:
              </span>
              <ul className="list-disc list-inside space-y-1 p-2.5 bg-status-amber-bg/40 border border-status-amber-border rounded text-ink">
                {analysis.warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Evidence List */}
          {analysis?.evidence && analysis.evidence.length > 0 && (
            <div className="space-y-1">
              <span className="font-bold text-ink-soft flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Poin Bukti Pendukung:
              </span>
              <ul className="list-disc list-inside space-y-1 p-2.5 bg-background border border-border/60 rounded text-ink">
                {analysis.evidence.map((ev, idx) => (
                  <li key={idx}>{ev}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Timestamp */}
          {analysis?.created_at && (
            <div className="flex items-center gap-1 text-[11px] text-ink-soft pt-1">
              <Clock className="w-3 h-3 text-ink-soft" />
              <span>Dianalisis pada: {formatDate(analysis.created_at)}</span>
            </div>
          )}
        </div>
      )}

      {/* Explicit Re-analyze Action */}
      <div className="pt-2 border-t border-border/60 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReanalyze}
            loading={isReanalyzing}
            icon={RefreshCw}
          >
            Minta AI Analisis Ulang
          </Button>
        </div>
        <p className="text-[10px] text-ink-soft">
          Analisis baru akan dibuat berdasarkan data laporan saat ini.
        </p>
      </div>
    </Card>
  );
}
