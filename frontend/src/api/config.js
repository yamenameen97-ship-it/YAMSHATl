const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const currentOrigin = typeof window !== 'undefined' ? trim(window.location.origin) : '';
const envBackendOrigin = trim(import.meta.env.VITE_BACKEND_ORIGIN || '');
const envApiBase = trim(import.meta.env.VITE_API_BASE || '');
const isLocalOrigin = /^(https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/i.test(currentOrigin);
const injectedApiBase = typeof window !== 'undefined' ? trim(window.__APP_API_BASE__ || '') : '';
const injectedBackendOrigin = typeof window !== 'undefined' ? trim(window.__APP_BACKEND_ORIGIN__ || '') : '';
const storedApiBase = typeof window !== 'undefined' ? trim(localStorage.getItem('apiBase')) : '';
const storedBackendOrigin = typeof window !== 'undefined' ? trim(localStorage.getItem('backendOrigin')) : '';
const runtimeApiBase = injectedApiBase || ((!envApiBase && isLocalOrigin) ? storedApiBase : '');
const runtimeBackendOrigin = injectedBackendOrigin || ((!envBackendOrigin && isLocalOrigin) ? storedBackendOrigin : '');
const preferredBackendOrigin = envBackendOrigin || runtimeBackendOrigin;
const preferredApiBase = envApiBase || runtimeApiBase;
const prefersSplitServices = Boolean(preferredBackendOrigin && currentOrigin && preferredBackendOrigin !== currentOrigin);
const poisonedRuntimeOrigin = prefersSplitServices && runtimeBackendOrigin && runtimeBackendOrigin === currentOrigin;
const poisonedRuntimeApiBase = prefersSplitServices && runtimeApiBase && trim(runtimeApiBase.replace(/\/api$/i, '')) === currentOrigin;
const resolvedRuntimeBackendOrigin = poisonedRuntimeOrigin ? '' : runtimeBackendOrigin;
const resolvedRuntimeApiBase = poisonedRuntimeApiBase ? '' : runtimeApiBase;

export const FRONTEND_ORIGIN = currentOrigin || trim(import.meta.env.VITE_FRONTEND_ORIGIN || '');
export const BACKEND_ORIGIN = envBackendOrigin || resolvedRuntimeBackendOrigin || trim(envApiBase.replace(/\/api$/i, '')) || trim(resolvedRuntimeApiBase.replace(/\/api$/i, '')) || FRONTEND_ORIGIN;
export const API_BASE = toApiBase(envApiBase || resolvedRuntimeApiBase || BACKEND_ORIGIN || FRONTEND_ORIGIN);
export const SOCKET_URL = BACKEND_ORIGIN || FRONTEND_ORIGIN;
export const CDN_BASE = trim(import.meta.env.VITE_CDN_BASE || window.APP_CDN_BASE || window.YAMSHAT_CDN_BASE || '');
export const DEPLOY_MODE = BACKEND_ORIGIN && FRONTEND_ORIGIN && BACKEND_ORIGIN !== FRONTEND_ORIGIN ? 'split-services' : 'same-origin';
export const buildApiUrl = (path = '') => {
  const value = String(path || '').trim();
  if (!value) return API_BASE;
  if (/^https?:\/\//i.test(value)) return value;
  if (value === '/api') return API_BASE;
  if (value.startsWith('/api/')) return `${BACKEND_ORIGIN}${value}`;
  if (value.startsWith('/')) return `${API_BASE}${value}`;
  return `${API_BASE}/${value}`;
};

try {
  const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
  if (previousBackendOrigin && BACKEND_ORIGIN && previousBackendOrigin !== BACKEND_ORIGIN) {
    localStorage.removeItem('yamshat_csrf_token');
    localStorage.removeItem('yamshat_user_session');
    localStorage.removeItem('yamshatAuth');
    localStorage.removeItem('user');
    sessionStorage.removeItem('yamshat_csrf_token');
    sessionStorage.removeItem('yamshat_user_session');
    sessionStorage.removeItem('yamshatAuth');
    sessionStorage.removeItem('user');
  }

  if (BACKEND_ORIGIN) localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
  if (API_BASE) localStorage.setItem('apiBase', toApiBase(API_BASE));
} catch {
  // ignore storage failures
}
