/**
 * offlineSessionCache.js — طبقة موحّدة لحفظ آخر الجلسات المُتصفَّحة
 * (Stories / Threads / Messages / Profile / Pages)
 *
 * الاستراتيجية: IndexedDB مع سياسة "الأحدث فقط":
 *   - stories:  آخر 10 مجموعات ستوري مُشاهَدة
 *   - threads:  قائمة الدردشات كاملة (سناب-شوت أخير)
 *   - messages: آخر 60 رسالة لكل peer (يحتفظ بحتى 20 peer نشط)
 *   - reels:    آخر 5 مقاطع (يُدار بواسطة كود الريلز الحالي)
 *   - profile:  ملفات المستخدمين المُتصفَّحة (حد 20)
 *   - pages:    ميتاداتا الصفحات المفتوحة (لعرض SPA بلا نت)
 *
 * لا يعتمد على أي مكتبة خارجية — IndexedDB خام لتقليل الحجم.
 * كل الدوال آمنة (لا ترمي استثناءات) — تفشل بصمت لعدم كسر الواجهة.
 */

const DB_NAME = 'yamshat-offline-session';
const DB_VERSION = 1;

const STORES = {
  STORIES: 'stories',       // key: groupId, value: { group, viewedAt }
  THREADS: 'threads',       // key: 'snapshot', value: { list, updatedAt }
  MESSAGES: 'messages',     // key: peer, value: { items, updatedAt }
  REELS: 'reels',           // key: reelId, value: { reel, viewedAt }
  PROFILE: 'profile',       // key: username, value: { data, updatedAt }
  PAGES: 'pages',           // key: pathname, value: { title, visitedAt, hash }
};

const LIMITS = {
  STORIES: 10,
  MESSAGES_PER_PEER: 60,
  PEERS: 20,
  REELS: 5,
  PROFILES: 20,
  PAGES: 40,
};

let _dbPromise = null;

function isSupported() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB() {
  if (!isSupported()) return Promise.resolve(null);
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        Object.values(STORES).forEach((name) => {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
  return _dbPromise;
}

async function tx(storeName, mode, fn) {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const t = db.transaction(storeName, mode);
      const store = t.objectStore(storeName);
      let result = null;
      Promise.resolve(fn(store)).then((r) => { result = r; }).catch(() => {});
      t.oncomplete = () => resolve(result);
      t.onerror = () => resolve(null);
      t.onabort = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

function reqToPromise(req) {
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

/* ----------------------------- Stories ----------------------------- */

export async function cacheStoryGroup(groupId, group) {
  if (!groupId || !group) return;
  await tx(STORES.STORIES, 'readwrite', async (store) => {
    store.put({ group, viewedAt: Date.now() }, String(groupId));
    // تقليم للحد
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.STORIES && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.viewedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      const toDelete = paired.slice(0, keys.length - LIMITS.STORIES);
      toDelete.forEach((p) => store.delete(p.k));
    }
  });
}

export async function getCachedStoryGroups() {
  const rows = await tx(STORES.STORIES, 'readonly', (store) => reqToPromise(store.getAll()));
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows
    .sort((a, b) => (b?.viewedAt || 0) - (a?.viewedAt || 0))
    .map((r) => r.group)
    .filter(Boolean);
}

/* ----------------------------- Threads (Inbox) ----------------------------- */

export async function cacheThreadsSnapshot(list) {
  if (!Array.isArray(list)) return;
  await tx(STORES.THREADS, 'readwrite', (store) => {
    store.put({ list, updatedAt: Date.now() }, 'snapshot');
  });
}

export async function getCachedThreadsSnapshot() {
  const snap = await tx(STORES.THREADS, 'readonly', (store) => reqToPromise(store.get('snapshot')));
  return snap?.list || null;
}

/* ----------------------------- Messages (Chat) ----------------------------- */

export async function cacheMessagesForPeer(peer, items) {
  if (!peer || !Array.isArray(items)) return;
  const trimmed = items.slice(-LIMITS.MESSAGES_PER_PEER);
  await tx(STORES.MESSAGES, 'readwrite', async (store) => {
    store.put({ items: trimmed, updatedAt: Date.now() }, String(peer));
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.PEERS && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.updatedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      paired.slice(0, keys.length - LIMITS.PEERS).forEach((p) => store.delete(p.k));
    }
  });
}

export async function getCachedMessagesForPeer(peer) {
  if (!peer) return null;
  const row = await tx(STORES.MESSAGES, 'readonly', (store) => reqToPromise(store.get(String(peer))));
  return row?.items || null;
}

/* ----------------------------- Profile ----------------------------- */

export async function cacheProfile(username, data) {
  if (!username || !data) return;
  await tx(STORES.PROFILE, 'readwrite', async (store) => {
    store.put({ data, updatedAt: Date.now() }, String(username).toLowerCase());
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.PROFILES && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.updatedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      paired.slice(0, keys.length - LIMITS.PROFILES).forEach((p) => store.delete(p.k));
    }
  });
}

export async function getCachedProfile(username) {
  if (!username) return null;
  const row = await tx(STORES.PROFILE, 'readonly',
    (store) => reqToPromise(store.get(String(username).toLowerCase())));
  return row?.data || null;
}

/* ----------------------------- Pages (SPA routes) ----------------------------- */

export async function markPageVisited(pathname, meta = {}) {
  if (!pathname) return;
  await tx(STORES.PAGES, 'readwrite', async (store) => {
    store.put({
      title: meta.title || document?.title || '',
      hash: meta.hash || window?.location?.hash || '',
      visitedAt: Date.now(),
    }, String(pathname));
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.PAGES && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.visitedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      paired.slice(0, keys.length - LIMITS.PAGES).forEach((p) => store.delete(p.k));
    }
  });
}

export async function isPageCached(pathname) {
  if (!pathname) return false;
  const row = await tx(STORES.PAGES, 'readonly', (store) => reqToPromise(store.get(String(pathname))));
  return !!row;
}

export async function getCachedPages() {
  const rows = await tx(STORES.PAGES, 'readonly', (store) => reqToPromise(store.getAll()));
  return Array.isArray(rows) ? rows : [];
}

/* ----------------------------- Utility ----------------------------- */

export function isStandalonePWA() {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator?.standalone === true
      || document.referrer?.startsWith('android-app://');
  } catch (_) { return false; }
}

export function isOnline() {
  return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
}

export async function clearAllOfflineCache() {
  const db = await openDB();
  if (!db) return;
  Object.values(STORES).forEach((name) => {
    try {
      const t = db.transaction(name, 'readwrite');
      t.objectStore(name).clear();
    } catch (_) {}
  });
}

export const OFFLINE_LIMITS = LIMITS;
export const OFFLINE_STORES = STORES;

export default {
  cacheStoryGroup, getCachedStoryGroups,
  cacheThreadsSnapshot, getCachedThreadsSnapshot,
  cacheMessagesForPeer, getCachedMessagesForPeer,
  cacheProfile, getCachedProfile,
  markPageVisited, isPageCached, getCachedPages,
  isStandalonePWA, isOnline, clearAllOfflineCache,
};
