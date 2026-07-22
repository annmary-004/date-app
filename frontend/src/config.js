const envApiUrl = process.env.REACT_APP_API_URL?.trim();
const localApiUrl = typeof window !== 'undefined' && window.location?.hostname?.includes('localhost')
  ? 'http://localhost:5000'
  : 'https://date-app-backend-stum.onrender.com';

export const API_BASE_URL = (envApiUrl || localApiUrl).replace(/\/$/, '');

export function absoluteApiUrl(path = '') {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
