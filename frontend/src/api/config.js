const trim = (value) => String(value || '').replace(/\/$/, '');

const runtimeBackendOrigin = trim(window.YAMSHAT_BACKEND_ORIGIN || window.APP_BACKEND_ORIGIN);

export const API_BASE = trim(
  window.APP_API_BASE ||
    import.meta.env.VITE_API_BASE ||
    (runtimeBackendOrigin ? `${runtimeBackendOrigin}/api` : `${window.location.origin}/api`)
);

export const SOCKET_URL = trim(
  window.YAMSHAT_SOCKET_URL ||
    import.meta.env.VITE_SOCKET_URL ||
    runtimeBackendOrigin ||
    window.location.origin
);
