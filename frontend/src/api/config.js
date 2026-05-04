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

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    runtimeBackendOrigin ||
    storedBackend ||
    apiToOrigin(storedApi) ||
    envBackendOrigin ||
    inferBackendOrigin() ||
    window.location.origin
);

export const API_BASE = toApiBase(
  queryApi ||
    storedApi ||
    window.APP_API_BASE ||
    envApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${window.location.origin}/api`)
);

export const SOCKET_URL = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    runtimeBackendOrigin ||
    envSocketUrl ||
    window.YAMSHAT_SOCKET_URL ||
    BACKEND_ORIGIN ||
    window.location.origin
);
