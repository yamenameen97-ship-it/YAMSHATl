(function () {
  const FRONTEND_ORIGIN = 'https://yamshatl-1-yg1o.onrender.com';
  const BACKEND_ORIGIN = 'https://yamshatl-ahj8.onrender.com';
  const API_BASE = 'https://yamshatl-ahj8.onrender.com/api';
  const uploadBase = `${API_BASE}/upload`;

  try {
    localStorage.setItem('backendOrigin', BACKEND_ORIGIN);
    localStorage.setItem('apiBase', API_BASE);
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
  window.YAMSHAT_DEPLOY_MODE = 'split-services';
})();
