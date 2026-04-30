(() => {
  const STORAGE_KEY = 'apiBase';

  function normalizeOrigin(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function normalizeApiBase(value) {
    const safe = normalizeOrigin(value);
    if (!safe) return '';
    return /\/api$/i.test(safe) ? safe : `${safe}/api`;
  }

  function inferSiblingBackendOrigin(currentOrigin) {
    try {
      const url = new URL(currentOrigin);
      if (!/\.onrender\.com$/i.test(url.hostname)) return '';
      const hostLabel = url.hostname.replace(/\.onrender\.com$/i, '');
      if (!/-1$/i.test(hostLabel)) return '';
      return `https://${hostLabel.replace(/-1$/i, '')}.onrender.com`;
    } catch (_) {
      return '';
    }
  }

  function queryValue(name) {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(name) || '';
    } catch (_) {
      return '';
    }
  }

  const currentOrigin = normalizeOrigin(window.location.origin);
  const existingApiBase = normalizeApiBase(window.APP_API_BASE || window.YAMSHAT_API_BASE);
  const savedApiBase = normalizeApiBase(localStorage.getItem(STORAGE_KEY));
  const metaBackend = normalizeOrigin(document.querySelector('meta[name="yamshat-backend-origin"]')?.content || '');
  const queryBackend = normalizeOrigin(
    queryValue('backend') || queryValue('backend_origin') || queryValue('api_origin')
  );
  const queryApiBase = normalizeApiBase(queryValue('api') || queryValue('apiBase'));
  const explicitBackend = normalizeOrigin(
    window.YAMSHAT_BACKEND_ORIGIN ||
    window.__YAMSHAT_BACKEND_ORIGIN__ ||
    metaBackend
  );
  const inferredSiblingBackend = inferSiblingBackendOrigin(currentOrigin);

  let finalApiBase = existingApiBase || queryApiBase || savedApiBase;

  if (!finalApiBase) {
    const backendOrigin = queryBackend || explicitBackend || inferredSiblingBackend || currentOrigin;
    finalApiBase = normalizeApiBase(backendOrigin);
  }

  const backendOrigin = normalizeOrigin(finalApiBase.replace(/\/api$/i, ''));

  if (queryApiBase || queryBackend) {
    try {
      localStorage.setItem(STORAGE_KEY, finalApiBase);
    } catch (_) {}
  }

  window.APP_API_BASE = finalApiBase || '/api';
  window.API_BASE = window.APP_API_BASE;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin || currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin && backendOrigin !== currentOrigin ? 'split-services' : 'single-service';
})();
