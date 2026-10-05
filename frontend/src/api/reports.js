import apiClient from './client';

export const createReportApi = async (formData) => {
  const response = await apiClient.post('/reports', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyReportsApi = async (page = 1, pageSize = 10) => {
  const response = await apiClient.get('/reports/me', {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

export const getReportDetailApi = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data;
};

export const getNearbyReportsApi = async (lat, lng, radius = 5.0) => {
  const response = await apiClient.get('/reports/nearby', {
    params: { lat, lng, radius },
  });
  return response.data;
};
