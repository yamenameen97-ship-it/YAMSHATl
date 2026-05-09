const CSRF_COOKIE_NAME = 'yamshat_csrf_token';
const CSRF_STORAGE_KEY = 'yamshat_csrf_token';

function canUseDocument() {
  return typeof document !== 'undefined';
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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

function readStoredToken() {
  if (!canUseStorage()) return '';
  try {
    return String(window.localStorage.getItem(CSRF_STORAGE_KEY) || window.sessionStorage.getItem(CSRF_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

export function getCsrfToken() {
  return readStoredToken() || readCookie(CSRF_COOKIE_NAME);
}

export function setCsrfToken(value = '') {
  if (!canUseStorage()) return;
  const token = String(value || '').trim();
  try {
    if (token) {
      window.localStorage.setItem(CSRF_STORAGE_KEY, token);
      window.sessionStorage.setItem(CSRF_STORAGE_KEY, token);
      return;
    }
    window.localStorage.removeItem(CSRF_STORAGE_KEY);
    window.sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

export function clearCsrfToken() {
  setCsrfToken('');
}

export const csrfCookieName = CSRF_COOKIE_NAME;
export const csrfStorageKey = CSRF_STORAGE_KEY;
