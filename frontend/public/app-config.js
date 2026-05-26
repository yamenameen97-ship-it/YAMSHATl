(function () {
  const CONFIG_BUILD = 'yamshat-config-20260526-r5-captcha-cors-fix';
  const CONFIG_BUILD_KEY = 'yamshat_config_build';
  const DEPLOY_BACKEND_ORIGIN = 'https://yamshat1-ahj8.onrender.com';
  const DEPLOY_API_BASE = 'https://yamshat1-ahj8.onrender.com/api';

  const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
  const toApiBase = (value) => {
    const cleaned = trim(value);
    if (!cleaned) return '';
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  };
  const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));
  const safeOrigin = (value) => {
    try {
      return trim(new URL(String(value || '').trim()).origin);
    } catch (_) {
      return '';
    }
  };
  const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
  const currentOrigin = trim(window.location.origin);
  const expectedBackendOrigin = trim(DEPLOY_BACKEND_ORIGIN) || apiToOrigin(DEPLOY_API_BASE);
  const expectedApiBase = toApiBase(DEPLOY_API_BASE) || (expectedBackendOrigin ? `${expectedBackendOrigin}/api` : '');

  const inferBackendFromHints = () => {
    const host = trim(window.location.hostname).toLowerCase();

    if (/\.onrender\.com$/i.test(host) && expectedBackendOrigin) {
      return expectedBackendOrigin;
    }

    try {
      const links = Array.from(document.querySelectorAll('link[rel="preconnect"][href], link[rel="dns-prefetch"][href]'));
      for (const link of links) {
        const origin = safeOrigin(link.getAttribute('href'));
        if (origin && origin !== currentOrigin) return origin;
      }
    } catch (_) {}

    return currentOrigin;
  };

  const renderOriginMismatch = (candidate, expected) => {
    const normalizedCandidate = trim(candidate);
    const normalizedExpected = trim(expected);
    if (!normalizedCandidate || !normalizedExpected) return false;
    if (!isRenderHost(normalizedCandidate) || !isRenderHost(normalizedExpected)) return false;
    return normalizedCandidate !== normalizedExpected;
  };

  const renderApiMismatch = (candidate, expected) => {
    const candidateOrigin = apiToOrigin(candidate);
    const expectedOrigin = apiToOrigin(expected);
    return renderOriginMismatch(candidateOrigin, expectedOrigin);
  };

  const params = new URLSearchParams(window.location.search);
  const queryApi = toApiBase(params.get('api'));
  const queryBackend = trim(params.get('backend'));

  let storedApi = '';
  let storedBackend = '';
  let buildChanged = false;
  try {
    storedApi = toApiBase(localStorage.getItem('apiBase'));
    storedBackend = trim(localStorage.getItem('backendOrigin'));
    const previousBuild = trim(localStorage.getItem(CONFIG_BUILD_KEY));
    buildChanged = Boolean(previousBuild && previousBuild !== CONFIG_BUILD);
  } catch (_) {}

  const inferredBackendOrigin = inferBackendFromHints();
  const legacyBackendDetected = renderOriginMismatch(storedBackend, expectedBackendOrigin);
  const legacyApiDetected = renderApiMismatch(storedApi, expectedApiBase);
  const safeStoredBackend = legacyBackendDetected ? '' : storedBackend;
  const safeStoredApi = legacyApiDetected ? '' : storedApi;
  const queryBackendApi = queryBackend ? toApiBase(queryBackend) : '';

  const backendOrigin =
    trim(queryBackend) ||
    apiToOrigin(queryApi) ||
    expectedBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeStoredApi) ||
    inferredBackendOrigin ||
    currentOrigin;

  const apiBase =
    toApiBase(queryApi) ||
    queryBackendApi ||
    expectedApiBase ||
    safeStoredApi ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(`${currentOrigin}/api`);

  try {
    const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
    const backendChanged = Boolean(previousBackendOrigin && previousBackendOrigin !== backendOrigin);

    if (buildChanged || backendChanged || legacyBackendDetected || legacyApiDetected) {
      localStorage.removeItem('backendOrigin');
      localStorage.removeItem('apiBase');
      localStorage.removeItem('yamshat_csrf_token');
      localStorage.removeItem('yamshatAuth');
      localStorage.removeItem('user');
      localStorage.removeItem('yamshat_user_session');
      try {
        sessionStorage.removeItem('yamshat_csrf_token');
        sessionStorage.removeItem('yamshatAuth');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('yamshat_user_session');
      } catch (_) {}
    }

    localStorage.setItem(CONFIG_BUILD_KEY, CONFIG_BUILD);
    localStorage.setItem('backendOrigin', backendOrigin);
    localStorage.setItem('apiBase', apiBase);
  } catch (_) {}

  const uploadBase = `${apiBase}/upload`;

  window.APP_BACKEND_ORIGIN = backendOrigin;
  window.APP_API_BASE = apiBase;
  window.APP_CDN_BASE = '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || uploadBase;
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || `${uploadBase}/resumable/start`;
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || `${uploadBase}/resumable`;
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === currentOrigin ? 'single-service' : 'split-services';
  window.__YAMSHAT_CONFIG_BUILD__ = CONFIG_BUILD;
})();
