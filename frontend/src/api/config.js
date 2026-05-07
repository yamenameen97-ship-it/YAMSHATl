const trim = (value) => String(value || '').trim().replace(/\/+$/, '');

const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));

const inferBackendOrigin = () => {
  const origin = trim(window.location.origin);
  const host = window.location.hostname || '';
  if (/-\d+\.onrender\.com$/i.test(host)) {
    return `${window.location.protocol}//${host.replace(/-\d+(?=\.onrender\.com$)/i, '')}`;
  }
  return origin;
};

const readStored = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const params = new URLSearchParams(window.location.search);
const queryApi = toApiBase(params.get('api'));
const queryBackend = trim(params.get('backend'));
const storedApi = toApiBase(readStored('apiBase'));
const storedBackend = trim(readStored('backendOrigin'));
const runtimeBackendOrigin = trim(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);
const envApi = toApiBase(import.meta.env.VITE_API_BASE || '');
const envBackendOrigin = trim(import.meta.env.VITE_BACKEND_ORIGIN || apiToOrigin(envApi));
const envSocketUrl = trim(import.meta.env.VITE_SOCKET_URL || envBackendOrigin);
const inferredBackendOrigin = inferBackendOrigin();
const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : '';
const SESSION_STORAGE_KEY = 'yamshat_user_session';
const CSRF_STORAGE_KEY = 'yamshat_csrf_token';

const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
const originLooksCurrent = (value) => {
  const candidate = trim(value);
  if (!candidate || !inferredBackendOrigin) return false;
  return candidate === inferredBackendOrigin || candidate === trim(window.location.origin);
};

const apiLooksCurrent = (value) => {
  const candidate = toApiBase(value);
  if (!candidate) return false;
  return candidate === toApiBase(inferredApi) || candidate === toApiBase(`${window.location.origin}/api`);
};

const safeStoredBackend = originLooksCurrent(storedBackend) || !isRenderHost(storedBackend) ? storedBackend : '';
const safeStoredApi = apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi)) ? storedApi : '';

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    runtimeBackendOrigin ||
    envBackendOrigin ||
    inferredBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeStoredApi) ||
    window.location.origin
);

export const API_BASE = toApiBase(
  queryApi ||
    window.APP_API_BASE ||
    envApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${window.location.origin}/api`) ||
    safeStoredApi
);

export const SOCKET_URL = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    runtimeBackendOrigin ||
    envSocketUrl ||
    window.YAMSHAT_SOCKET_URL ||
    BACKEND_ORIGIN ||
    safeStoredBackend ||
    window.location.origin
);

try {
  const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
  const backendOriginChanged = Boolean(previousBackendOrigin && previousBackendOrigin !== BACKEND_ORIGIN);
  if (backendOriginChanged) {
    localStorage.removeItem(CSRF_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
  localStorage.setItem('apiBase', API_BASE);
} catch {
  // ignore storage failures
}
