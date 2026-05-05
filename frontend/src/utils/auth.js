import { isPrimaryAdminSession } from './access.js';
import { secureGet, secureRemove, secureSet } from './secureStorage.js';
import { useAppStore } from '../store/appStore.js';

const STORAGE_KEY = 'yamshat_user_session';
const EXPIRY_LEEWAY_SECONDS = 30;

function normalizeUserShape(user) {
  if (!user || typeof user !== 'object') return null;
  const token = user.token || user.access_token || user?.profile?.token || '';
  const refreshToken = user.refresh_token || user?.profile?.refresh_token || '';
  const username = user.username || user.user || user?.profile?.username || '';
  const role = user.role || user?.profile?.role || 'user';
  const permissions = Array.isArray(user.permissions)
    ? user.permissions
    : Array.isArray(user?.profile?.permissions)
      ? user.profile.permissions
      : [];

  return {
    ...user,
    token,
    access_token: token || user.access_token || '',
    refresh_token: refreshToken,
    username,
    user: username,
    role,
    permissions,
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

function syncStore(user) {
  const state = useAppStore.getState();
  if (user) state.setSession?.(user);
  else state.clearSession?.();
}

export function getStoredUser() {
  try {
    const raw = secureGet(STORAGE_KEY);
    const parsed = normalizeUserShape(raw ? JSON.parse(raw) : null);
    if (parsed?.access_token && isTokenExpired(parsed.access_token)) {
      clearStoredUser();
      return null;
    }
    syncStore(parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  const normalized = normalizeUserShape(user);
  if (!normalized) {
    secureRemove(STORAGE_KEY);
    syncStore(null);
    return;
  }
  secureSet(STORAGE_KEY, JSON.stringify(normalized));
  syncStore(normalized);
}

export function mergeStoredUser(nextValues) {
  const current = getStoredUser() || {};
  setStoredUser({ ...current, ...nextValues, profile: { ...(current.profile || {}), ...(nextValues?.profile || {}) } });
}

export function clearStoredUser() {
  secureRemove(STORAGE_KEY);
  syncStore(null);
}

export function getAuthToken() {
  const user = getStoredUser();
  return user?.token || user?.access_token || '';
}

export function getRefreshToken() {
  const user = getStoredUser();
  return user?.refresh_token || '';
}

export function getCurrentUsername() {
  const user = getStoredUser();
  return user?.user || user?.username || '';
}

export function getSessionTtlMs() {
  const token = getAuthToken();
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return null;
  return Math.max(expiryMs - Date.now(), 0);
}

export function hasPermission(permission) {
  const user = getStoredUser();
  if (!user) return false;
  if (isPrimaryAdminSession(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
