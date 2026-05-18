(function () {
  const DEPLOY_BACKEND_ORIGIN = 'https://yamshatl.onrender.com';
  const DEPLOY_API_BASE = 'https://yamshatl.onrender.com/api';

  const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
  const ensureApiPath = (value) => {
    const cleaned = trim(value);
    if (!cleaned) return '';
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  };

  const backendOrigin = trim(DEPLOY_BACKEND_ORIGIN);
  const apiBase = ensureApiPath(DEPLOY_API_BASE);
  const currentOrigin = trim(window.location.origin);

  try {
    localStorage.setItem('backendOrigin', backendOrigin);
    localStorage.setItem('apiBase', apiBase);
  } catch (_) {}

  window.APP_BACKEND_ORIGIN = backendOrigin;
  window.APP_API_BASE = apiBase;
  window.APP_CDN_BASE = window.APP_CDN_BASE || '';
  window.APP_MEDIA_PROVIDER = window.APP_MEDIA_PROVIDER || 'cloudflare-r2';
  window.APP_MEDIA_UPLOAD_URL = window.APP_MEDIA_UPLOAD_URL || '/upload';
  window.APP_MEDIA_RESUMABLE_START_URL = window.APP_MEDIA_RESUMABLE_START_URL || '/upload/resumable/start';
  window.APP_MEDIA_RESUMABLE_STATUS_URL = window.APP_MEDIA_RESUMABLE_STATUS_URL || '/upload/resumable';
  window.APP_MEDIA_RESUMABLE_CHUNK_URL = window.APP_MEDIA_RESUMABLE_CHUNK_URL || '/upload/resumable';
  window.APP_MEDIA_RESUMABLE_COMPLETE_URL = window.APP_MEDIA_RESUMABLE_COMPLETE_URL || '/upload/resumable';
  window.APP_SIGNAL_SERVER_SUPPORT = Boolean(window.APP_SIGNAL_SERVER_SUPPORT || false);
  window.YAMSHAT_API_BASE = apiBase;
  window.YAMSHAT_CDN_BASE = window.APP_CDN_BASE;
  window.YAMSHAT_SOCKET_URL = backendOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = backendOrigin === currentOrigin ? 'single-service' : 'split-services';
})();
