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

  const currentOrigin = trim(window.location.origin);
  const currentHost = trim(window.location.hostname).toLowerCase();
  const isLocalHost = ['localhost', '127.0.0.1'].includes(currentHost);

  const params = new URLSearchParams(window.location.search);
  const queryApi = toApiBase(params.get('api'));
  const queryBackend = trim(params.get('backend'));
  const forceDirectBackend = params.get('directBackend') === '1';
  const preferSameOriginProxy = !isLocalHost && !forceDirectBackend;

  let storedApi = '';
  let storedBackend = '';
  try {
    storedApi = toApiBase(localStorage.getItem('apiBase'));
    storedBackend = trim(localStorage.getItem('backendOrigin'));
  } catch (_) {}

  const proxyBackendOrigin = preferSameOriginProxy ? currentOrigin : '';
  const proxyApiBase = preferSameOriginProxy ? `${currentOrigin}/api` : '';
  const queryBackendApi = queryBackend ? toApiBase(queryBackend) : '';
  const directBackendOrigin = trim(DEPLOY_BACKEND_ORIGIN);
  const directApiBase = toApiBase(DEPLOY_API_BASE);

  const backendOrigin =
    trim(queryBackend) ||
    apiToOrigin(queryApi) ||
    proxyBackendOrigin ||
    trim(storedBackend) ||
    directBackendOrigin ||
    apiToOrigin(storedApi) ||
    currentOrigin;

  const apiBase =
    toApiBase(queryApi) ||
    queryBackendApi ||
    proxyApiBase ||
    toApiBase(storedApi) ||
    directApiBase ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(`${currentOrigin}/api`);

  try {
    const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
    const previousApiBase = toApiBase(localStorage.getItem('apiBase'));
    if ((previousBackendOrigin && previousBackendOrigin !== backendOrigin) || (previousApiBase && previousApiBase !== apiBase)) {
      localStorage.removeItem('yamshat_csrf_token');
      sessionStorage.removeItem('yamshat_user_session');
    }
    localStorage.setItem('backendOrigin', backendOrigin);
    localStorage.setItem('apiBase', apiBase);
  } catch (_) {}

  window.APP_BACKEND_ORIGIN = backendOrigin;
  window.APP_API_BASE = apiBase;
  window.APP_CDN_BASE = '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || `${apiBase}/upload`;
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || `${apiBase}/upload/resumable/start`;
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || `${apiBase}/upload/resumable`;
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || `${apiBase}/upload/resumable`;
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || `${apiBase}/upload/resumable`;
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = preferSameOriginProxy ? currentOrigin : backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_REAL_BACKEND_ORIGIN = directBackendOrigin || backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = preferSameOriginProxy ? 'same-origin-proxy' : (backendOrigin === currentOrigin ? 'single-service' : 'split-services');
})();
