const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

export const FRONTEND_ORIGIN = 'https://yamshatl-1-yg1o.onrender.com';
export const BACKEND_ORIGIN = 'https://yamshatl-ahj8.onrender.com';
export const API_BASE = 'https://yamshatl-ahj8.onrender.com/api';
export const SOCKET_URL = BACKEND_ORIGIN;
export const CDN_BASE = trim(import.meta.env.VITE_CDN_BASE || window.APP_CDN_BASE || window.YAMSHAT_CDN_BASE || '');
export const DEPLOY_MODE = 'split-services';

try {
  const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
  if (previousBackendOrigin && previousBackendOrigin !== BACKEND_ORIGIN) {
    localStorage.removeItem('yamshat_csrf_token');
    localStorage.removeItem('yamshat_user_session');
    localStorage.removeItem('yamshatAuth');
    localStorage.removeItem('user');
    sessionStorage.removeItem('yamshat_csrf_token');
    sessionStorage.removeItem('yamshat_user_session');
    sessionStorage.removeItem('yamshatAuth');
    sessionStorage.removeItem('user');
  }

  localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
  localStorage.setItem('apiBase', toApiBase(API_BASE));
} catch {
  // ignore storage failures
}
