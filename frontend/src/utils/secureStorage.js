function encode(value) {
  return btoa(JSON.stringify(value));
}

function decode(raw) {
  return JSON.parse(atob(raw));
}

export function secureSet(key, value, options = {}) {
  const persist = Boolean(options?.persist);
  const storage = persist ? localStorage : sessionStorage;
  const fallbackStorage = persist ? sessionStorage : localStorage;
  const encoded = encode(value);
  storage.setItem(key, encoded);
  fallbackStorage.removeItem(key);
}

export function secureGet(key) {
  const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
  if (!raw) return null;
  return decode(raw);
}

export function secureRemove(key) {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export const secureStorage = {
  set: secureSet,
  get: secureGet,
  remove: secureRemove,
};