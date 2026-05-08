function getSafeStorage(type = 'localStorage') {
  if (typeof window === 'undefined') return null;
  try {
    return window[type] || null;
  } catch {
    return null;
  }
}

export function secureGet(key) {
  const normalizedKey = String(key);
  const sessionStorageRef = getSafeStorage('sessionStorage');
  const localStorageRef = getSafeStorage('localStorage');
  return sessionStorageRef?.getItem(normalizedKey) || localStorageRef?.getItem(normalizedKey) || '';
}

export function secureSet(key, value, options = {}) {
  const normalizedKey = String(key);
  const persist = Boolean(options?.persist);
  const sessionStorageRef = getSafeStorage('sessionStorage');
  const localStorageRef = getSafeStorage('localStorage');
  const rawValue = String(value ?? '');

  try {
    sessionStorageRef?.removeItem(normalizedKey);
    localStorageRef?.removeItem(normalizedKey);
    if (persist) localStorageRef?.setItem(normalizedKey, rawValue);
    else sessionStorageRef?.setItem(normalizedKey, rawValue);
  } catch {
    // ignore storage failures
  }
}

export function secureRemove(key) {
  const normalizedKey = String(key);
  try {
    getSafeStorage('sessionStorage')?.removeItem(normalizedKey);
    getSafeStorage('localStorage')?.removeItem(normalizedKey);
  } catch {
    // ignore storage failures
  }
}
