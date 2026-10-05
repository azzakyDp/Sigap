import apiClient from './client';

/**
 * Mendapatkan atau memicu analisis AI tersimpan untuk laporan.
 * GET /api/v1/reports/{id}/ai-analysis
 */
export const getOrTriggerAnalysisApi = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}/ai-analysis`);
  return response.data;
};

/**
 * Memicu analisis AI baru secara eksplisit berdasarkan data laporan terkini.
 * POST /api/v1/reports/{id}/ai-analysis/reanalyze
 */
export const reanalyzeApi = async (reportId) => {
  const response = await apiClient.post(`/reports/${reportId}/ai-analysis/reanalyze`);
  return response.data;
};
