export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
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
