(() => {
  const normalizeOrigin = value => String(value || '').trim().replace(/\/+$/, '');
  const saved = normalizeOrigin(localStorage.getItem('apiBase'));
  const currentOrigin = normalizeOrigin(window.location.origin);
  const backendOrigin = saved
    ? saved.replace(/\/api$/i, '')
    : currentOrigin;

  window.APP_API_BASE = backendOrigin ? `${backendOrigin}/api` : '/api';
  window.YAMSHAT_FRONTEND_ORIGIN = currentOrigin;
  window.YAMSHAT_BACKEND_ORIGIN = backendOrigin;
})();
