(function () {
  const trim = (value) => String(value || '').trim().replace(/\/+$/, '');
  const currentOrigin = trim(window.location.origin);
  const apiBase = `${currentOrigin}/api`;

  try {
    localStorage.setItem('backendOrigin', currentOrigin);
    localStorage.setItem('apiBase', apiBase);
  } catch (_) {}

  const uploadBase = `${apiBase}/upload`;

  window.APP_BACKEND_ORIGIN = currentOrigin;
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
  window.YAMSHAT_SOCKET_URL = currentOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = currentOrigin;
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_DEPLOY_MODE = 'same-origin-proxy';
})();
