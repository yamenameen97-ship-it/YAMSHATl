const CSRF_COOKIE_NAME = 'yamshat_csrf_token';

function canUseDocument() {
  return typeof document !== 'undefined';
}

function readCookie(name) {
  if (!canUseDocument()) return '';
  const prefix = `${name}=`;
  const raw = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return raw ? decodeURIComponent(raw.slice(prefix.length)) : '';
}

export function getCsrfToken() {
  return readCookie(CSRF_COOKIE_NAME);
}

export function setCsrfToken() {
  // CSRF token is delivered and rotated by secure cookies only.
}

export function clearCsrfToken() {
  // Cookie lifecycle is controlled by the backend.
}

export const csrfCookieName = CSRF_COOKIE_NAME;
export const csrfStorageKey = '';
