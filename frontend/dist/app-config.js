(function () {
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

  const inferBackendOrigin = () => {
    const origin = trim(window.location.origin);
    const host = window.location.hostname || '';
    if (/-\d+\.onrender\.com$/i.test(host)) {
      return `${window.location.protocol}//${host.replace(/-\d+(?=\.onrender\.com$)/i, '')}`;
    }
    return origin;
  };

  const backendOrigin =
    trim(queryBackend) ||
    apiToOrigin(queryApi) ||
    trim(storedBackend) ||
    apiToOrigin(storedApi) ||
    inferBackendOrigin() ||
    trim(window.location.origin);

  const apiBase =
    toApiBase(queryApi) ||
    toApiBase(storedApi) ||
    toApiBase(`${backendOrigin}/api`) ||
    toApiBase(`${window.location.origin}/api`);

  try {
    if (queryApi) {
      localStorage.setItem('apiBase', apiBase);
      localStorage.setItem('backendOrigin', apiToOrigin(apiBase));
    } else if (queryBackend) {
      localStorage.setItem('backendOrigin', backendOrigin);
      localStorage.setItem('apiBase', apiBase);
    } else if (!storedApi || !storedBackend) {
      localStorage.setItem('backendOrigin', backendOrigin);
      localStorage.setItem('apiBase', apiBase);
    }
  } catch (_) {}

  window.APP_API_BASE = apiBase;
  window.YAMSHAT_SOCKET_URL = backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = trim(window.location.origin);
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === trim(window.location.origin) ? 'single-service' : 'split-services';
})();
