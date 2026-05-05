const memoryStore = new Map();

function resolveSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function secureGet(key) {
  const sessionStorage = resolveSessionStorage();
  if (sessionStorage) {
    try {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        memoryStore.set(key, value);
        return value;
      }
    } catch {
      // ignore storage failures
    }
  }
  return memoryStore.get(key) || '';
}

export function secureSet(key, value) {
  const stringValue = String(value ?? '');
  memoryStore.set(key, stringValue);
  const sessionStorage = resolveSessionStorage();
  if (!sessionStorage) return;
  try {
    sessionStorage.setItem(key, stringValue);
  } catch {
    // ignore storage failures
  }
}

export function secureRemove(key) {
  memoryStore.delete(key);
  const sessionStorage = resolveSessionStorage();
  if (!sessionStorage) return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}
