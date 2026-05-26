(function () {
  const CONFIG_BUILD = 'yamshat-config-20260526-r9-ui-fixes';
  const CONFIG_BUILD_KEY = 'yamshat_config_build';

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
  const isLocalNetworkHost = (value) => {
    try {
      const hostname = new URL(String(value || '').trim()).hostname.toLowerCase();
      return ['0.0.0.0', '127.0.0.1', 'localhost', '::1'].includes(hostname);
    } catch (_) {
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

  const runtimeConfig = window.__YAMSHAT_RUNTIME_CONFIG__ || window.__APP_CONFIG__ || {};
  const scriptEl = document.currentScript || Array.from(document.scripts || []).find((script) => /app-config\.js/i.test(script?.src || ''));
  const scriptBackendOrigin = trim(scriptEl?.dataset?.backendOrigin || scriptEl?.getAttribute('data-backend-origin') || '');
  const scriptApiBase = toApiBase(scriptEl?.dataset?.apiBase || scriptEl?.getAttribute('data-api-base') || '');
  const scriptSocketUrl = trim(scriptEl?.dataset?.socketUrl || scriptEl?.getAttribute('data-socket-url') || '');

  const expectedBackendOrigin = sanitizeOriginCandidate(
    runtimeConfig.backendOrigin ||
      runtimeConfig.backend_origin ||
      scriptBackendOrigin ||
      apiToOrigin(scriptApiBase) ||
      window.APP_BACKEND_ORIGIN ||
      window.YAMSHAT_BACKEND_ORIGIN ||
      ''
  );
  const expectedApiBase = sanitizeApiCandidate(
    runtimeConfig.apiBase ||
      runtimeConfig.api_base ||
      scriptApiBase ||
      window.APP_API_BASE ||
      window.YAMSHAT_API_BASE ||
      (expectedBackendOrigin ? `${expectedBackendOrigin}/api` : '')
  );
  const expectedSocketUrl = sanitizeOriginCandidate(
    runtimeConfig.socketUrl ||
      runtimeConfig.socket_url ||
      scriptSocketUrl ||
      window.YAMSHAT_SOCKET_URL ||
      expectedBackendOrigin
  );

  const inferBackendFromHints = () => {
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
  const queryApi = sanitizeApiCandidate(params.get('api'));
  const queryBackend = sanitizeOriginCandidate(params.get('backend'));

  let storedApi = '';
  let storedBackend = '';
  let buildChanged = false;
  try {
    storedApi = sanitizeApiCandidate(localStorage.getItem('apiBase'));
    storedBackend = sanitizeOriginCandidate(localStorage.getItem('backendOrigin'));
    const previousBuild = trim(localStorage.getItem(CONFIG_BUILD_KEY));
    buildChanged = Boolean(previousBuild && previousBuild !== CONFIG_BUILD);
  } catch (_) {}

  const inferredBackendOrigin = inferBackendFromHints();
  const legacyBackendDetected = Boolean(expectedBackendOrigin) && renderOriginMismatch(storedBackend, expectedBackendOrigin);
  const legacyApiDetected = Boolean(expectedApiBase) && renderApiMismatch(storedApi, expectedApiBase);
  const safeStoredBackend = legacyBackendDetected ? '' : storedBackend;
  const safeStoredApi = legacyApiDetected ? '' : storedApi;
  const queryBackendApi = queryBackend ? toApiBase(queryBackend) : '';

  const backendOrigin = trim(
    queryBackend ||
      apiToOrigin(queryApi) ||
      expectedBackendOrigin ||
      safeStoredBackend ||
      apiToOrigin(expectedApiBase || safeStoredApi) ||
      inferredBackendOrigin ||
      currentOrigin
  );

  const apiBase = toApiBase(
    queryApi ||
      queryBackendApi ||
      expectedApiBase ||
      safeStoredApi ||
      (backendOrigin ? `${backendOrigin}/api` : '') ||
      `${currentOrigin}/api`
  );

  const socketUrl = trim(
    queryBackend ||
      apiToOrigin(queryApi) ||
      expectedSocketUrl ||
      backendOrigin ||
      currentOrigin
  );

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
  window.APP_CDN_BASE = window.APP_CDN_BASE || '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || uploadBase;
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || `${uploadBase}/resumable/start`;
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || `${uploadBase}/resumable`;
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_API_BASE = apiBase;
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = socketUrl;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === currentOrigin ? 'single-service' : 'split-services';
  window.__YAMSHAT_CONFIG_BUILD__ = CONFIG_BUILD;
})();

