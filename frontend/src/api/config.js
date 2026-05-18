const trim = (value) => String(value || '').trim().replace(/\/+$/, '');

const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));
const currentOrigin = trim(window.location.origin);
const SESSION_STORAGE_KEY = 'yamshat_user_session';
const CSRF_STORAGE_KEY = 'yamshat_csrf_token';

const safeOrigin = (value) => {
  try {
    return trim(new URL(String(value || '').trim()).origin);
  } catch {
    return '';
  }
};

const readStored = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const inferSiblingBackend = () => {
  const host = trim(window.location.hostname).toLowerCase();
  const protocol = window.location.protocol;

  if (/\.onrender\.com$/i.test(host)) {
    if (host.includes('-web.')) return `${protocol}//${host.replace('-web.', '-api.')}`;
    if (host.includes('-frontend.')) return `${protocol}//${host.replace('-frontend.', '-api.')}`;
    const numbered = host.match(/^(.*)-web-(\w+)\.onrender\.com$/i);
    if (numbered?.[1] && numbered?.[2]) {
      return `${protocol}//${numbered[1]}-api-${numbered[2]}.onrender.com`;
    }
  }

  return '';
};

const params = new URLSearchParams(window.location.search);
const queryApi = toApiBase(params.get('api'));
const queryBackend = trim(params.get('backend'));
const storedApi = toApiBase(readStored('apiBase'));
const storedBackend = trim(readStored('backendOrigin'));
const runtimeApi = toApiBase(window.APP_API_BASE || '');
const runtimeBackendOrigin = trim(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN || '');
const envApi = toApiBase(import.meta.env.VITE_API_BASE || '');
const envBackendOrigin = trim(import.meta.env.VITE_BACKEND_ORIGIN || apiToOrigin(envApi));
const envSocketUrl = trim(import.meta.env.VITE_SOCKET_URL || envBackendOrigin);
const envCdnBase = trim(import.meta.env.VITE_CDN_BASE || '');
const siblingBackend = inferSiblingBackend();
const siblingApi = toApiBase(siblingBackend);

const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));

const keepRenderOrigin = (value) => {
  const candidate = trim(value);
  if (!candidate) return false;
  if (!isRenderHost(candidate)) return true;
  return candidate === currentOrigin || candidate === runtimeBackendOrigin || candidate === envBackendOrigin || candidate === siblingBackend;
};

const keepRenderApi = (value) => {
  const candidate = toApiBase(value);
  if (!candidate) return false;
  const candidateOrigin = apiToOrigin(candidate);
  if (!isRenderHost(candidateOrigin)) return true;
  return candidate === runtimeApi || candidate === envApi || candidate === siblingApi || candidateOrigin === currentOrigin;
};

const safeStoredBackend = keepRenderOrigin(storedBackend) ? storedBackend : '';
const safeStoredApi = keepRenderApi(storedApi) ? storedApi : '';
const safeRuntimeBackendOrigin = keepRenderOrigin(runtimeBackendOrigin) ? runtimeBackendOrigin : '';
const safeRuntimeApi = keepRenderApi(runtimeApi) ? runtimeApi : '';
const queryBackendApi = queryBackend ? `${queryBackend}/api` : '';
const runtimeBackendApi = safeRuntimeBackendOrigin ? `${safeRuntimeBackendOrigin}/api` : '';

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    safeRuntimeBackendOrigin ||
    envBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeRuntimeApi || safeStoredApi) ||
    siblingBackend ||
    currentOrigin
);

export const API_BASE = toApiBase(
  queryApi ||
    queryBackendApi ||
    safeRuntimeApi ||
    runtimeBackendApi ||
    envApi ||
    safeStoredApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${currentOrigin}/api`)
);

export const CDN_BASE = trim(window.YAMSHAT_CDN_BASE || window.APP_CDN_BASE || envCdnBase || '');

export const SOCKET_URL = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    safeRuntimeBackendOrigin ||
    envSocketUrl ||
    safeStoredBackend ||
    siblingBackend ||
    BACKEND_ORIGIN ||
    currentOrigin
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
