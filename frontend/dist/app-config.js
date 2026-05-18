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
  const safeOrigin = (value) => {
    try {
      return trim(new URL(String(value || '').trim()).origin);
    } catch (_) {
      return '';
    }
  };
  const currentOrigin = trim(window.location.origin);

  const readStorage = (key) => {
    try {
      return trim(localStorage.getItem(key));
    } catch (_) {
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
  const storedApi = toApiBase(readStorage('apiBase'));
  const storedBackend = trim(readStorage('backendOrigin'));
  const deployBackend = trim(DEPLOY_BACKEND_ORIGIN);
  const deployApi = toApiBase(DEPLOY_API_BASE);
  const siblingBackend = inferSiblingBackend();
  const siblingApi = toApiBase(siblingBackend);

  const isRenderHost = (value) => /\.onrender\.com$/i.test(trim(value));
  const sameOrigin = (value) => trim(value) === currentOrigin;
  const sameApiOrigin = (value) => apiToOrigin(value) === currentOrigin;

  const safeStoredBackend = (() => {
    if (!storedBackend) return '';
    if (!isRenderHost(storedBackend)) return storedBackend;
    if (sameOrigin(storedBackend)) return storedBackend;
    if (deployBackend && storedBackend === deployBackend) return storedBackend;
    if (siblingBackend && storedBackend === siblingBackend) return storedBackend;
    return '';
  })();

  const safeStoredApi = (() => {
    if (!storedApi) return '';
    const storedApiOrigin = apiToOrigin(storedApi);
    if (!isRenderHost(storedApiOrigin)) return storedApi;
    if (sameApiOrigin(storedApi)) return storedApi;
    if (deployApi && storedApi === deployApi) return storedApi;
    if (siblingApi && storedApi === siblingApi) return storedApi;
    return '';
  })();

  const backendOrigin =
    queryBackend ||
    apiToOrigin(queryApi) ||
    deployBackend ||
    apiToOrigin(deployApi) ||
    safeStoredBackend ||
    apiToOrigin(safeStoredApi) ||
    siblingBackend ||
    currentOrigin;

  const apiBase =
    queryApi ||
    toApiBase(queryBackend) ||
    deployApi ||
    safeStoredApi ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(`${currentOrigin}/api`);

  try {
    const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
    if (previousBackendOrigin && previousBackendOrigin !== backendOrigin) {
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
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || '/upload';
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || '/upload/resumable/start';
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || '/upload/resumable';
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || '/upload/resumable';
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || '/upload/resumable';
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === currentOrigin ? 'single-service' : 'split-services';
})();
