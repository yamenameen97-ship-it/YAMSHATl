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
  if (/-1\.onrender\.com$/i.test(host)) {
    return `${window.location.protocol}//${host.replace(/-1(?=\.onrender\.com$)/i, '')}`;
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

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    runtimeBackendOrigin ||
    storedBackend ||
    apiToOrigin(storedApi) ||
    inferBackendOrigin() ||
    window.location.origin
);

export const API_BASE = toApiBase(
  window.APP_API_BASE ||
    queryApi ||
    storedApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${window.location.origin}/api`)
);

export const SOCKET_URL = trim(
  window.YAMSHAT_SOCKET_URL ||
    queryBackend ||
    apiToOrigin(queryApi) ||
    BACKEND_ORIGIN ||
    window.location.origin
);
