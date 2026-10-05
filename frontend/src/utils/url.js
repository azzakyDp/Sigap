/**
 * URL utilities
 */

export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  const backendHost = baseUrl.replace(/\/api\/v1\/?$/, '');
  return `${backendHost}${url.startsWith('/') ? '' : '/'}${url}`;
};
