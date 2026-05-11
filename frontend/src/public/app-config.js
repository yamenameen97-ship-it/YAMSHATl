(function () {
  const DEPLOY_BACKEND_ORIGIN = '';
  const DEPLOY_API_BASE = '';

  const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
  const toApiBase = (value) => {
    const cleaned = trim(value);
    if (!cleaned) return '';
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  };
  const apiToOrigin = (value) => trim(toApiBase(value).replace(/\/api$/, ''));

  const params = new URLSearchParams(window.location.search);
  const queryApi = toApiBase(params.get('api'));
  const queryBackend = trim(params.get('backend'));

  let storedApi = '';
  let storedBackend = '';
  try {
    storedApi = toApiBase(localStorage.getItem('apiBase'));
    storedBackend = trim(localStorage.getItem('backendOrigin'));
  } catch (_) {}

  const inferBackendOrigin = () => trim(window.location.origin);

  const inferredBackendOrigin = inferBackendOrigin();
  const inferredApi = inferredBackendOrigin ? `${inferredBackendOrigin}/api` : '';
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

  const backendOrigin =
    trim(queryBackend) ||
    apiToOrigin(queryApi) ||
    trim(DEPLOY_BACKEND_ORIGIN) ||
    safeStoredBackend ||
    apiToOrigin(safeStoredApi) ||
    inferredBackendOrigin ||
    trim(window.location.origin);

  const apiBase =
    toApiBase(queryApi) ||
    toApiBase(DEPLOY_API_BASE) ||
    safeStoredApi ||
    toApiBase(inferredApi) ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(`${window.location.origin}/api`);

  try {
    localStorage.setItem('backendOrigin', backendOrigin);
    localStorage.setItem('apiBase', apiBase);
  } catch (_) {}

  window.APP_API_BASE = apiBase;
  window.APP_CDN_BASE = '';
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = trim(window.location.origin);
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === trim(window.location.origin) ? 'single-service' : 'split-services';
})();
