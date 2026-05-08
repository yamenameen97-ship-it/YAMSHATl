import { isPrimaryAdminSession } from './access.js';
import { secureGet, secureRemove, secureSet } from './secureStorage.js';
import { clearCsrfToken, setCsrfToken } from './csrf.js';
import { useAppStore } from '../store/appStore.js';

const STORAGE_KEY = 'yamshat_user_session';
const EXPIRY_LEEWAY_SECONDS = 30;

function normalizeUserShape(user) {
  if (!user || typeof user !== 'object') return null;
  const token = user.token || user.access_token || user?.profile?.token || '';
  const username = user.username || user.user || user?.profile?.username || '';
  const role = user.role || user?.profile?.role || 'user';
  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : Array.isArray(user?.profile?.permissions)
      ? user.profile.permissions
      : [];
  const csrf_token = user.csrf_token || user?.profile?.csrf_token || '';

  return {
    ...user,
    token,
    access_token: token || user.access_token || '',
    refresh_token: '',
    username,
    user: username,
    role,
    permissions,
    csrf_token,
    email_verified: Boolean(user.email_verified ?? user?.profile?.email_verified),
    profile: user.profile || null,
  };
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(normalized)
      : Buffer.from(normalized, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function syncStore(user) {
  const state = useAppStore.getState();
  if (user) state.setSession?.(user);
  else state.clearSession?.();
}

function readStoredSession() {
  try {
    const raw = secureGet(STORAGE_KEY);
    return normalizeUserShape(raw ? JSON.parse(raw) : null);
  } catch {
    return null;
  }
}

export function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  const exp = Number(payload.exp);
  return Number.isFinite(exp) ? exp * 1000 : null;
}

export function isTokenExpired(token, leewaySeconds = EXPIRY_LEEWAY_SECONDS) {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return false;
  return expiryMs <= Date.now() + leewaySeconds * 1000;
}

export function getStoredUser() {
  const parsed = readStoredSession();
  syncStore(parsed);
  return parsed;
}

export function getStoredUserSnapshot() {
  return readStoredSession();
}

export function hasStoredSession() {
  const user = readStoredSession();
  return Boolean(user?.id || user?.username || user?.user || user?.email);
}

export function setStoredUser(user) {
  const normalized = normalizeUserShape(user);
  if (!normalized) {
    secureRemove(STORAGE_KEY);
    clearCsrfToken();
    syncStore(null);
    return;
  }
  secureSet(STORAGE_KEY, JSON.stringify(normalized));
  setCsrfToken(normalized.csrf_token || '');
  syncStore(normalized);
}

export function mergeStoredUser(nextValues) {
  const current = readStoredSession() || {};
  const merged = {
    ...current,
    ...nextValues,
    refresh_token: '',
    profile: {
      ...(current.profile || {}),
      ...(nextValues?.profile || {}),
    },
  };
  setStoredUser(merged);
}

export function clearStoredUser() {
  secureRemove(STORAGE_KEY);
  clearCsrfToken();
  syncStore(null);
}

export function getAuthToken() {
  const user = readStoredSession();
  const token = user?.token || user?.access_token || '';
  if (!token || isTokenExpired(token)) return '';
  return token;
}

export function getRefreshToken() {
  return '';
}

export function getCurrentUsername() {
  const user = readStoredSession();
  return user?.user || user?.username || '';
}

export function getSessionTtlMs() {
  const user = readStoredSession();
  const token = user?.token || user?.access_token || '';
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return null;
  return Math.max(expiryMs - Date.now(), 0);
}

export function shouldRefreshSessionSoon(windowMs = 60_000) {
  const ttl = getSessionTtlMs();
  return ttl !== null && ttl <= windowMs;
}

export function hasPermission(permission) {
  const user = readStoredSession();
  if (!user) return false;
  if (isPrimaryAdminSession(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
