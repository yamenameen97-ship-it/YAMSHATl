import { isPrimaryAdminSession } from './access.js';

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

export function getStoredUser() {
  try {
    return normalizeUserShape(JSON.parse(localStorage.getItem('user') || 'null'));
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  const normalized = normalizeUserShape(user);
  if (!normalized) {
    localStorage.removeItem('user');
    return;
  }
  localStorage.setItem('user', JSON.stringify(normalized));
}

export function mergeStoredUser(nextValues) {
  const current = getStoredUser() || {};
  setStoredUser({ ...current, ...nextValues, profile: { ...(current.profile || {}), ...(nextValues?.profile || {}) } });
}

export function clearStoredUser() {
  localStorage.removeItem('user');
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

export function hasPermission(permission) {
  const user = getStoredUser();
  if (!user) return false;
  if (isPrimaryAdminSession(user)) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}
