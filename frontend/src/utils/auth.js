function normalizeUserShape(user) {
  if (!user || typeof user !== 'object') return null;
  const token = user.token || user.access_token || user?.profile?.token || '';
  const username = user.username || user.user || user?.profile?.username || '';
  return {
    ...user,
    token,
    access_token: token || user.access_token || '',
    username,
    user: username,
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
  localStorage.setItem('user', JSON.stringify(normalizeUserShape(user)));
}

export function clearStoredUser() {
  localStorage.removeItem('user');
}

export function getAuthToken() {
  const user = getStoredUser();
  return user?.token || user?.access_token || '';
}

export function getCurrentUsername() {
  const user = getStoredUser();
  return user?.user || user?.username || '';
}
