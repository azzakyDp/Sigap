import apiClient from './client';

export const getCategoriesApi = async () => {
  const response = await apiClient.get('/categories');
  return response.data;
};
