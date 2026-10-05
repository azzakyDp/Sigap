import apiClient from './client';

export const getReportsQueueApi = async (params = {}) => {
  const response = await apiClient.get('/reports', { params });
  return response.data;
};

export const getOfficersApi = async () => {
  const response = await apiClient.get('/officers');
  return response.data;
};

export const verifyReportApi = async (id, payload) => {
  const response = await apiClient.patch(`/reports/${id}/verify`, payload);
  return response.data;
};

export const updatePriorityApi = async (id, payload) => {
  const response = await apiClient.patch(`/reports/${id}/priority`, payload);
  return response.data;
};

export const assignReportApi = async (id, payload) => {
  const response = await apiClient.post(`/reports/${id}/assign`, payload);
  return response.data;
};

export const closeReportApi = async (id, payload) => {
  const response = await apiClient.patch(`/reports/${id}/close`, payload);
  return response.data;
};

export const getAssignedToMeApi = async (page = 1, pageSize = 10) => {
  const response = await apiClient.get('/reports/assigned-to-me', {
    params: { page, page_size: pageSize },
  });
  return response.data;
};

export const startHandlingApi = async (id) => {
  const response = await apiClient.patch(`/reports/${id}/start-handling`);
  return response.data;
};

export const createActionReportApi = async (id, payload) => {
  const response = await apiClient.post(`/reports/${id}/action-reports`, payload);
  return response.data;
};

export const resolveReportApi = async (id, payload) => {
  const response = await apiClient.patch(`/reports/${id}/resolve`, payload);
  return response.data;
};

