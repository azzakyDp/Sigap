import apiClient from './client';

export const loginApi = async (identifier, password) => {
  const response = await apiClient.post('/auth/login', {
    identifier,
    password,
  });
  return response.data;
};

export const registerApi = async (payload) => {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
};

export const getMeApi = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
