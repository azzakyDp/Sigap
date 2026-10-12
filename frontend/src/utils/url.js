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

export const getThumbnailUrl = (url, maxWidth = 600) => {
  if (!url) return '';
  const fullUrl = getImageUrl(url);
  if (fullUrl.includes('res.cloudinary.com') && fullUrl.includes('/image/upload/')) {
    const parts = fullUrl.split('/image/upload/', 2);
    if (!parts[1].startsWith('c_') && !parts[1].startsWith('w_')) {
      return `${parts[0]}/image/upload/c_limit,w_${maxWidth},q_auto,f_auto/${parts[1]}`;
    }
  }
  return fullUrl;
};
