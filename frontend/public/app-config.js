(function () {
  const readMeta = (name) => {
    try {
      return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
    } catch (_) {
      return '';
    }
  };

  const trim = (value) => {
    const normalized = String(value || '').trim();
    if (/^%VITE_[A-Z0-9_]+%$/i.test(normalized)) return '';
    return normalized.replace(/\/+$/, '');
  };
  const toApiBase = (value) => {
    const cleaned = trim(value);
    if (!cleaned) return '';
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  };

  const FRONTEND_ORIGIN = trim(window.location.origin);
  const host = String(window.location.hostname || '').trim().toLowerCase();
  const isLocalFrontend = host === 'localhost' || host === '127.0.0.1';
  const defaultBackendOrigin = trim(readMeta('yamshat-backend-origin') || window.__YAMSHAT_DEFAULT_BACKEND_ORIGIN__ || '');
  const defaultApiBase = trim(readMeta('yamshat-api-base') || window.__YAMSHAT_DEFAULT_API_BASE__ || '');
  const injectedBackendOrigin = trim(window.__APP_BACKEND_ORIGIN__ || defaultBackendOrigin || '');
  const injectedApiBase = trim(window.__APP_API_BASE__ || defaultApiBase || '');
  const storedBackendOrigin = trim(localStorage.getItem('backendOrigin'));
  const storedApiBase = trim(localStorage.getItem('apiBase'));
  const runtimeBackendOrigin = injectedBackendOrigin || (isLocalFrontend ? storedBackendOrigin : '') || defaultBackendOrigin;
  const runtimeApiBase = injectedApiBase || (isLocalFrontend ? storedApiBase : '') || defaultApiBase;
  const fallbackOrigin = isLocalFrontend ? FRONTEND_ORIGIN : defaultBackendOrigin;
  const BACKEND_ORIGIN = runtimeBackendOrigin || trim(runtimeApiBase.replace(/\/api$/i, '')) || fallbackOrigin;
  const API_BASE = toApiBase(runtimeApiBase || BACKEND_ORIGIN || fallbackOrigin);
  const uploadBase = API_BASE ? `${API_BASE}/upload` : '';

  try {
    const previousBackendOrigin = trim(localStorage.getItem('backendOrigin'));
    if (previousBackendOrigin && BACKEND_ORIGIN && previousBackendOrigin !== BACKEND_ORIGIN) {
      localStorage.removeItem('yamshat_csrf_token');
      localStorage.removeItem('yamshat_user_session');
      localStorage.removeItem('yamshatAuth');
      localStorage.removeItem('user');
      sessionStorage.removeItem('yamshat_csrf_token');
      sessionStorage.removeItem('yamshat_user_session');
      sessionStorage.removeItem('yamshatAuth');
      sessionStorage.removeItem('user');
    }

    if (BACKEND_ORIGIN) localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
    if (API_BASE) localStorage.setItem('apiBase', API_BASE);
  } catch (_) {}

  if (BACKEND_ORIGIN) window.APP_BACKEND_ORIGIN = BACKEND_ORIGIN;
  if (API_BASE) window.APP_API_BASE = API_BASE;
  window.APP_CDN_BASE = window.__APP_CDN_BASE__ || window.APP_CDN_BASE || '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || (uploadBase ? uploadBase : '');
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || (uploadBase ? `${uploadBase}/resumable/start` : '');
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || (uploadBase ? `${uploadBase}/resumable` : '');
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || (uploadBase ? `${uploadBase}/resumable` : '');
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || (uploadBase ? `${uploadBase}/resumable` : '');
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_API_BASE = API_BASE;
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = BACKEND_ORIGIN;
  window.YAMSHAT_BACKEND_ORIGIN = BACKEND_ORIGIN;
  window.YAMSHAT_FRONTEND_ORIGIN = FRONTEND_ORIGIN;
  window.YAMSHAT_DEPLOY_MODE = BACKEND_ORIGIN && FRONTEND_ORIGIN && BACKEND_ORIGIN !== FRONTEND_ORIGIN ? 'split-services' : 'same-origin';
})();
