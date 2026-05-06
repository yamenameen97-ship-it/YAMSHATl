const CSRF_STORAGE_KEY = 'yamshat_csrf_token';
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
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(CSRF_STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // ignore storage failures
    }
  }
  return readCookie(CSRF_COOKIE_NAME);
}

export function setCsrfToken(token) {
  const safe = String(token || '').trim();
  if (typeof window !== 'undefined') {
    try {
      if (safe) window.localStorage.setItem(CSRF_STORAGE_KEY, safe);
      else window.localStorage.removeItem(CSRF_STORAGE_KEY);
    } catch {
      // ignore storage failures
    }
  }
}

export function clearCsrfToken() {
  setCsrfToken('');
}

export const csrfCookieName = CSRF_COOKIE_NAME;
export const csrfStorageKey = CSRF_STORAGE_KEY;
