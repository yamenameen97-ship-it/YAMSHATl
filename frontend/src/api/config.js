const trim = (value) => String(value || '').trim().replace(/\/+$/, '');

const toApiBase = (value) => {
  const cleaned = trim(value);
  if (!cleaned) return '';
  return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
};

const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));
const currentOrigin = trim(window.location.origin);

const safeOrigin = (value) => {
  try {
    return trim(new URL(String(value || '').trim()).origin);
  } catch {
    return '';
  }
};

const deriveBackendOriginFromHost = () => {
  try {
    const host = new URL(currentOrigin).hostname;
    if (!host) return '';

    if (/\.onrender\.com$/i.test(host)) {
      const strippedNumeric = host.replace(/-\d+(?=\.onrender\.com$)/i, '');
      if (strippedNumeric !== host) return `https://${strippedNumeric}`;

      const strippedFrontendToken = host.replace(/-(frontend|front|web|site)(?=\.onrender\.com$)/i, '');
      if (strippedFrontendToken !== host) return `https://${strippedFrontendToken}`;
    }

    if (/\.vercel\.app$/i.test(host)) {
      const stripped = host.replace(/-(frontend|front|web|site)(?=\.vercel\.app$)/i, '');
      if (stripped !== host) return `https://${stripped}`;
    }

    if (/\.netlify\.app$/i.test(host)) {
      const stripped = host.replace(/-(frontend|front|web|site)(?=\.netlify\.app$)/i, '');
      if (stripped !== host) return `https://${stripped}`;
    }
  } catch {
    // ignore URL parsing failures
  }

  return '';
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

  return deriveBackendOriginFromHost() || '';
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
const runtimeApi = toApiBase(window.APP_API_BASE || '');
const runtimeBackendOrigin = trim(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);
const envApi = toApiBase(import.meta.env.VITE_API_BASE || '');
const envBackendOrigin = trim(import.meta.env.VITE_BACKEND_ORIGIN || apiToOrigin(envApi));
const envSocketUrl = trim(import.meta.env.VITE_SOCKET_URL || envBackendOrigin);
const envCdnBase = trim(import.meta.env.VITE_CDN_BASE || '');
const inferredBackendOrigin = inferBackendOrigin();
const derivedBackendOrigin = deriveBackendOriginFromHost();
const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : '';
const derivedApi = derivedBackendOrigin ? `${derivedBackendOrigin}/api` : '';
const SESSION_STORAGE_KEY = 'yamshat_user_session';
const CSRF_STORAGE_KEY = 'yamshat_csrf_token';

const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
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

const safeStoredBackend = originLooksCurrent(storedBackend) || !isRenderHost(storedBackend) ? storedBackend : '';
const safeStoredApi = apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi)) ? storedApi : '';
const runtimeBackendIsFrontendOrigin = Boolean(runtimeBackendOrigin && runtimeBackendOrigin === currentOrigin && inferredBackendOrigin !== currentOrigin);
const runtimeApiIsFrontendOrigin = Boolean(runtimeApi && runtimeApi === toApiBase(`${currentOrigin}/api`) && inferredBackendOrigin !== currentOrigin);
const safeRuntimeBackendOrigin = runtimeBackendIsFrontendOrigin ? '' : runtimeBackendOrigin;
const safeRuntimeApi = runtimeApiIsFrontendOrigin ? '' : runtimeApi;

export const BACKEND_ORIGIN = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    safeRuntimeBackendOrigin ||
    envBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeRuntimeApi || safeStoredApi) ||
    derivedBackendOrigin ||
    inferredBackendOrigin ||
    currentOrigin
);

export const API_BASE = toApiBase(
  queryApi ||
    safeRuntimeApi ||
    envApi ||
    safeStoredApi ||
    derivedApi ||
    (BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/api` : `${currentOrigin}/api`)
);

export const CDN_BASE = trim(window.YAMSHAT_CDN_BASE || window.APP_CDN_BASE || envCdnBase || '');

export const SOCKET_URL = trim(
  queryBackend ||
    apiToOrigin(queryApi) ||
    safeRuntimeBackendOrigin ||
    envSocketUrl ||
    window.YAMSHAT_SOCKET_URL ||
    safeStoredBackend ||
    BACKEND_ORIGIN ||
    currentOrigin
);

try {
  const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
  const backendOriginChanged = Boolean(previousBackendOrigin && previousBackendOrigin !== BACKEND_ORIGIN);
  if (backendOriginChanged) {
    localStorage.removeItem(CSRF_STORAGE_KEY);
    localStorage.removeItem('backendOrigin');
    localStorage.removeItem('apiBase');
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
  localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
  localStorage.setItem('apiBase', API_BASE);
  window.__YAMSHAT_RUNTIME_CONFIG__ = {
    currentOrigin,
    derivedBackendOrigin,
    inferredBackendOrigin,
    backendOrigin: BACKEND_ORIGIN,
    apiBase: API_BASE,
    socketUrl: SOCKET_URL,
  };
} catch {
  // ignore storage failures
}
