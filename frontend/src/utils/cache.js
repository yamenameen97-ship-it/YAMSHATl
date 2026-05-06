const fallbackStore = new Map();

function resolveSessionStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function makeKey(scope, key) {
  return `yamshat:${scope}:${key}`;
}

export function readJsonCache(scope, key, fallback = null) {
  const storageKey = makeKey(scope, key);
  const storage = resolveSessionStorage();
  try {
    const raw = storage?.getItem(storageKey) ?? fallbackStore.get(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJsonCache(scope, key, value) {
  const storageKey = makeKey(scope, key);
  const serialized = JSON.stringify(value ?? null);
  fallbackStore.set(storageKey, serialized);
  const storage = resolveSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey, serialized);
  } catch {
    // ignore storage quota failures
  }
}

export function removeJsonCache(scope, key) {
  const storageKey = makeKey(scope, key);
  fallbackStore.delete(storageKey);
  const storage = resolveSessionStorage();
  if (!storage) return;
  try {
    storage.removeItem(storageKey);
  } catch {
    // ignore storage failures
  }
}

export function getConversationCache(currentUser, otherUser) {
  if (!currentUser || !otherUser) return null;
  return readJsonCache('chat', `${currentUser}:${otherUser}`, null);
}

export function setConversationCache(currentUser, otherUser, value) {
  if (!currentUser || !otherUser) return;
  writeJsonCache('chat', `${currentUser}:${otherUser}`, {
    updatedAt: new Date().toISOString(),
    ...(value || {}),
  });
}

export function getThreadListCache(currentUser) {
  if (!currentUser) return [];
  return readJsonCache('threads', currentUser, []);
}

export function setThreadListCache(currentUser, threads) {
  if (!currentUser) return;
  writeJsonCache('threads', currentUser, Array.isArray(threads) ? threads : []);
}
