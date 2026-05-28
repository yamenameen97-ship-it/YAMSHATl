const trim = (value) => String(value || '').trim().replace(/\/+$/, '');

const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));
const currentOrigin = trim(window.location.origin);
const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
const isLocalNetworkHost = (value) => {
  try {
    const hostname = new URL(String(value || '').trim()).hostname.toLowerCase();
    return ['0.0.0.0', '127.0.0.1', 'localhost', '::1'].includes(hostname);
  } catch {
    return false;
  }
};
const rejectInvalidRemoteHost = (value) => isLocalNetworkHost(value) && !isLocalNetworkHost(currentOrigin);
const sanitizeOriginCandidate = (value) => {
  const normalized = safeOrigin(value) || trim(value);
  return rejectInvalidRemoteHost(normalized) ? '' : trim(normalized);
};
const sanitizeApiCandidate = (value) => {
  const normalized = toApiBase(value);
  return rejectInvalidRemoteHost(apiToOrigin(normalized)) ? '' : normalized;
};

const safeOrigin = (value) => {
  try {
    return trim(new URL(String(value || '').trim()).origin);
  } catch {
    return '';
  }
};

const inferBackendOrigin = () => {
  try {
    const links = Array.from(document.querySelectorAll('link[rel="preconnect"][href], link[rel="dns-prefetch"][href]'));
    for (const link of links) {
      const origin = safeOrigin(link.getAttribute('href'));
      if (origin && origin !== currentOrigin) return origin;
    }
  } catch {
    // ignore DOM parsing failures
  }

  return currentOrigin;
};

const readStored = (key) => {
  try {
    return localStorage.getItem(key) || '';
  } catch {
    return '';
  }
};

const renderOriginMismatch = (candidate, expected) => {
  const normalizedCandidate = trim(candidate);
  const normalizedExpected = trim(expected);
  if (!normalizedCandidate || !normalizedExpected) return false;
  if (!isRenderHost(normalizedCandidate) || !isRenderHost(normalizedExpected)) return false;
  return normalizedCandidate !== normalizedExpected;
};

const renderApiMismatch = (candidate, expected) => renderOriginMismatch(apiToOrigin(candidate), apiToOrigin(expected));

const params = new URLSearchParams(window.location.search);
const queryApi = sanitizeApiCandidate(params.get('api'));
const queryBackend = sanitizeOriginCandidate(params.get('backend'));
const storedApi = sanitizeApiCandidate(readStored('apiBase'));
const storedBackend = sanitizeOriginCandidate(readStored('backendOrigin'));
const runtimeApi = sanitizeApiCandidate(window.APP_API_BASE || '');
const runtimeBackendOrigin = sanitizeOriginCandidate(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);
const envApi = sanitizeApiCandidate(import.meta.env.VITE_API_BASE || '');
const envBackendOrigin = sanitizeOriginCandidate(import.meta.env.VITE_BACKEND_ORIGIN || apiToOrigin(envApi));
const frontendOrigin = currentOrigin;

const envSocketUrl = sanitizeOriginCandidate(import.meta.env.VITE_SOCKET_URL || envBackendOrigin);
const envCdnBase = trim(import.meta.env.VITE_CDN_BASE || '');
const inferredBackendOrigin = inferBackendOrigin();
const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : '';
const sameOriginApi = `${frontendOrigin}/api`;
const SESSION_STORAGE_KEY = 'yamshat_user_session';
const CSRF_STORAGE_KEY = 'yamshat_csrf_token';

const originLooksCurrent = (value) => {
  const candidate = trim(value);
  if (!candidate || !inferredBackendOrigin) return false;
  return candidate === inferredBackendOrigin || candidate === currentOrigin;
};

const apiLooksCurrent = (value) => {
  const candidate = toApiBase(value);
  if (!candidate) return false;
  return candidate === toApiBase(inferredApi) || candidate === toApiBase(`${currentOrigin}/api`);
};

const storedBackendConflictsWithEnv = renderOriginMismatch(storedBackend, envBackendOrigin);
const storedApiConflictsWithEnv = renderApiMismatch(storedApi, envApi);
const safeStoredBackend = (originLooksCurrent(storedBackend) || !isRenderHost(storedBackend)) && !storedBackendConflictsWithEnv ? storedBackend : '';
const safeStoredApi = (apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi))) && !storedApiConflictsWithEnv ? storedApi : '';
const runtimeBackendIsFrontendOrigin = Boolean(runtimeBackendOrigin && runtimeBackendOrigin === currentOrigin && inferredBackendOrigin !== currentOrigin);
const runtimeApiIsFrontendOrigin = Boolean(runtimeApi && runtimeApi === toApiBase(`${currentOrigin}/api`) && inferredBackendOrigin !== currentOrigin);
const runtimeBackendConflictsWithEnv = renderOriginMismatch(runtimeBackendOrigin, envBackendOrigin);
const runtimeApiConflictsWithEnv = renderApiMismatch(runtimeApi, envApi);
const safeRuntimeBackendOrigin = runtimeBackendIsFrontendOrigin || runtimeBackendConflictsWithEnv ? '' : runtimeBackendOrigin;
const runtimeApiMatchesRuntimeBackend = Boolean(!safeRuntimeBackendOrigin || !runtimeApi || apiToOrigin(runtimeApi) === safeRuntimeBackendOrigin);
const safeRuntimeApi = runtimeApiIsFrontendOrigin || !runtimeApiMatchesRuntimeBackend || runtimeApiConflictsWithEnv ? '' : runtimeApi;
const queryBackendApi = queryBackend ? `${queryBackend}/api` : '';
const runtimeBackendApi = safeRuntimeBackendOrigin ? `${safeRuntimeBackendOrigin}/api` : '';

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    envBackendOrigin ||
    safeRuntimeBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeRuntimeApi || safeStoredApi) ||
    inferredBackendOrigin ||
    currentOrigin
);

export const API_BASE = toApiBase(
  queryApi ||
    queryBackendApi ||
    envApi ||
    safeRuntimeApi ||
    runtimeBackendApi ||
    safeStoredApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : sameOriginApi)
);

export const CDN_BASE = trim(window.YAMSHAT_CDN_BASE || window.APP_CDN_BASE || envCdnBase || '');

export const SOCKET_URL = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    envSocketUrl ||
    safeRuntimeBackendOrigin ||
    sanitizeOriginCandidate(window.YAMSHAT_SOCKET_URL || '') ||
    safeStoredBackend ||
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
