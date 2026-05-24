const STORAGE_PREFIX = 'yamshat.feed.cache.v2';
const STORAGE_INDEX_KEY = `${STORAGE_PREFIX}:index`;
const DEFAULT_TTL_MS = 3 * 60_000;
const DEFAULT_MAX_ENTRIES = 40;
const memoryCache = new Map();

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function now() {
  return Date.now();
}

function toStorageKey(key) {
  return `${STORAGE_PREFIX}:${key}`;
}

function readIndex() {
  if (!isBrowser()) return [];
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_INDEX_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeIndex(keys = []) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(Array.from(new Set(keys)).slice(-DEFAULT_MAX_ENTRIES * 2)));
  } catch {
    // ignore storage write failures
  }
}

function isExpired(entry, maxAgeMs) {
  if (!entry) return true;
  const ttlMs = Number(entry.ttlMs || maxAgeMs || DEFAULT_TTL_MS);
  return now() - Number(entry.updatedAt || 0) > ttlMs;
}

function removeEntry(key) {
  memoryCache.delete(key);
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(toStorageKey(key));
    writeIndex(readIndex().filter((item) => item !== key));
  } catch {
    // ignore storage removal failures
  }
}

function readStorageEntry(key) {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(toStorageKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function pruneStorage(maxEntries = DEFAULT_MAX_ENTRIES) {
  if (!isBrowser()) return;
  const keys = readIndex();
  const alive = [];

  keys.forEach((key) => {
    const entry = readStorageEntry(key);
    if (!entry || isExpired(entry, entry?.ttlMs)) {
      try {
        window.localStorage.removeItem(toStorageKey(key));
      } catch {
        // ignore
      }
      return;
    }
    alive.push({ key, updatedAt: Number(entry.updatedAt || 0) });
  });

  alive.sort((a, b) => a.updatedAt - b.updatedAt);
  const overflow = Math.max(0, alive.length - maxEntries);
  alive.slice(0, overflow).forEach(({ key }) => {
    try {
      window.localStorage.removeItem(toStorageKey(key));
    } catch {
      // ignore
    }
  });

  writeIndex(alive.slice(overflow).map((item) => item.key));
}

export function getFeedCache(key, options = {}) {
  const maxAgeMs = Number(options.maxAgeMs || options.ttlMs || DEFAULT_TTL_MS);
  const allowStale = Boolean(options.allowStale);

  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    if (!isExpired(memoryEntry, maxAgeMs) || allowStale) return memoryEntry.value;
    memoryCache.delete(key);
  }

  const storageEntry = readStorageEntry(key);
  if (!storageEntry) return null;
  if (isExpired(storageEntry, maxAgeMs) && !allowStale) {
    removeEntry(key);
    return null;
  }

  memoryCache.set(key, storageEntry);
  return storageEntry.value;
}

export function setFeedCache(key, value, options = {}) {
  const ttlMs = Number(options.ttlMs || options.maxAgeMs || DEFAULT_TTL_MS);
  const maxEntries = Number(options.maxEntries || DEFAULT_MAX_ENTRIES);
  const entry = {
    value,
    ttlMs,
    updatedAt: now(),
  };

  memoryCache.set(key, entry);

  if (isBrowser()) {
    try {
      window.localStorage.setItem(toStorageKey(key), JSON.stringify(entry));
      writeIndex([...readIndex(), key]);
      pruneStorage(maxEntries);
    } catch {
      // ignore storage quota failures
    }
  }

  return value;
}

export function getOrSetFeedCache(key, loader, options = {}) {
  const cached = getFeedCache(key, options);
  if (cached !== null && cached !== undefined) return Promise.resolve(cached);
  return Promise.resolve(loader()).then((value) => setFeedCache(key, value, options));
}

export function invalidateFeedCache(prefix = '') {
  const targetPrefix = String(prefix || '');
  Array.from(memoryCache.keys()).forEach((key) => {
    if (!targetPrefix || key.startsWith(targetPrefix)) memoryCache.delete(key);
  });

  if (!isBrowser()) return;
  const keys = readIndex();
  keys.forEach((key) => {
    if (!targetPrefix || key.startsWith(targetPrefix)) {
      try {
        window.localStorage.removeItem(toStorageKey(key));
      } catch {
        // ignore
      }
    }
  });
  writeIndex(keys.filter((key) => targetPrefix && !key.startsWith(targetPrefix)));
}

export function getFeedCacheStats() {
  const storageKeys = readIndex();
  return {
    memoryEntries: memoryCache.size,
    storageEntries: storageKeys.length,
    keys: storageKeys,
  };
}
