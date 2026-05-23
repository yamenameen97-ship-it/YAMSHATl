(function () {
  const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
  const toApiBase = (value) => {
    const cleaned = trim(value);
    if (!cleaned) return '';
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  };

  const FRONTEND_ORIGIN = trim(window.location.origin);
  const runtimeBackendOrigin = trim(window.__APP_BACKEND_ORIGIN__ || localStorage.getItem('backendOrigin'));
  const runtimeApiBase = trim(window.__APP_API_BASE__ || localStorage.getItem('apiBase'));
  const BACKEND_ORIGIN = runtimeBackendOrigin || trim(runtimeApiBase.replace(/\/api$/i, '')) || FRONTEND_ORIGIN;
  const API_BASE = toApiBase(runtimeApiBase || BACKEND_ORIGIN || FRONTEND_ORIGIN);
  const uploadBase = `${API_BASE}/upload`;

  try {
    if (BACKEND_ORIGIN) localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
    if (API_BASE) localStorage.setItem('apiBase', API_BASE);
  } catch (_) {}

  window.APP_BACKEND_ORIGIN = BACKEND_ORIGIN;
  window.APP_API_BASE = API_BASE;
  window.APP_CDN_BASE = window.APP_CDN_BASE || '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || uploadBase;
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || `${uploadBase}/resumable/start`;
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || `${uploadBase}/resumable`;
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || `${uploadBase}/resumable`;
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_API_BASE = API_BASE;
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = BACKEND_ORIGIN;
  window.YAMSHAT_BACKEND_ORIGIN = BACKEND_ORIGIN;
  window.YAMSHAT_FRONTEND_ORIGIN = FRONTEND_ORIGIN;
  window.YAMSHAT_DEPLOY_MODE = BACKEND_ORIGIN && FRONTEND_ORIGIN && BACKEND_ORIGIN !== FRONTEND_ORIGIN ? 'split-services' : 'same-origin';
})();
