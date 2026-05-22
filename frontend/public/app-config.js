(function () {
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
  const currentOrigin = trim(window.location.origin);
  const deployBackendOrigin = trim(DEPLOY_BACKEND_ORIGIN || apiToOrigin(DEPLOY_API_BASE));
  const deployApiBase = toApiBase(DEPLOY_API_BASE || deployBackendOrigin);
  const renderSplitService = /\.onrender\.com$/i.test(currentOrigin) && Boolean(deployBackendOrigin && deployBackendOrigin !== currentOrigin);

  const inferBackendFromHints = () => {
    const host = trim(window.location.hostname).toLowerCase();

    // لا نحاول اشتقاق الـ backend من اسم خدمة Render الأمامية، لأن suffix
    // المتغيّر قد يوجّه الواجهة إلى نفس خدمة الـ frontend وبالتالي يعيد 404 للكابتشا.
    if (/\.onrender\.com$/i.test(host) && deployBackendOrigin) {
      return deployBackendOrigin;
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

  const params = new URLSearchParams(window.location.search);
  const queryApi = toApiBase(params.get('api'));
  const queryBackend = trim(params.get('backend'));

  let storedApi = '';
  let storedBackend = '';
  try {
    storedApi = toApiBase(localStorage.getItem('apiBase'));
    storedBackend = trim(localStorage.getItem('backendOrigin'));
  } catch (_) {}

  const inferredBackendOrigin = inferBackendFromHints();
  const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : '';
  const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
  const isCurrentRenderOrigin = (value) => trim(value) === currentOrigin && isRenderHost(currentOrigin);
  const isCurrentRenderApi = (value) => toApiBase(value) === toApiBase(`${currentOrigin}/api`) && isRenderHost(currentOrigin);
  const originLooksCurrent = (value) => {
    const candidate = trim(value);
    if (!candidate || !inferredBackendOrigin) return false;
    if (renderSplitService && candidate === currentOrigin) return false;
    return candidate === deployBackendOrigin || candidate === inferredBackendOrigin || candidate === currentOrigin;
  };
  const apiLooksCurrent = (value) => {
    const candidate = toApiBase(value);
    if (!candidate) return false;
    if (renderSplitService && candidate === toApiBase(`${currentOrigin}/api`)) return false;
    return candidate === deployApiBase || candidate === toApiBase(inferredApi) || candidate === toApiBase(`${currentOrigin}/api`);
  };

  const storedBackendIsLegacyCurrentOrigin = renderSplitService && isCurrentRenderOrigin(storedBackend);
  const storedApiIsLegacyCurrentOrigin = renderSplitService && isCurrentRenderApi(storedApi);
  const safeStoredBackend = storedBackendIsLegacyCurrentOrigin ? '' : (originLooksCurrent(storedBackend) || !isRenderHost(storedBackend) ? storedBackend : '');
  const safeStoredApi = storedApiIsLegacyCurrentOrigin ? '' : (apiLooksCurrent(storedApi) || !isRenderHost(apiToOrigin(storedApi)) ? storedApi : '');
  const legacyBackendDetected = storedBackendIsLegacyCurrentOrigin || (isRenderHost(storedBackend) && !originLooksCurrent(storedBackend));
  const legacyApiDetected = storedApiIsLegacyCurrentOrigin || (isRenderHost(apiToOrigin(storedApi)) && !apiLooksCurrent(storedApi));
  const queryBackendApi = queryBackend ? toApiBase(queryBackend) : '';

  const backendOrigin =
    trim(queryBackend) ||
    apiToOrigin(queryApi) ||
    deployBackendOrigin ||
    safeStoredBackend ||
    apiToOrigin(safeStoredApi) ||
    inferredBackendOrigin ||
    currentOrigin;

  const apiBase =
    toApiBase(queryApi) ||
    queryBackendApi ||
    deployApiBase ||
    safeStoredApi ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(inferredApi) ||
    toApiBase(`${currentOrigin}/api`);

  try {
    const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
    if (previousBackendOrigin && previousBackendOrigin !== backendOrigin) {
      localStorage.removeItem('yamshat_csrf_token');
      sessionStorage.removeItem('yamshat_user_session');
    }
    if (legacyBackendDetected || legacyApiDetected) {
      localStorage.removeItem('backendOrigin');
      localStorage.removeItem('apiBase');
      localStorage.removeItem('yamshat_csrf_token');
      sessionStorage.removeItem('yamshat_user_session');
    }
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
  window.YAMSHAT_DEPLOY_BACKEND_ORIGIN = deployBackendOrigin;
  window.YAMSHAT_DEPLOY_API_BASE = deployApiBase;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === currentOrigin ? 'single-service' : 'split-services';
})();
