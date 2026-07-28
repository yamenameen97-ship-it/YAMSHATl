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
// ✅ v88.89: رفع الإصدار لإضافة stores جديدة (feed, groups, group_msgs, settings, story_items)
const DB_VERSION = 2;

const STORES = {
  STORIES: 'stories',       // key: groupId, value: { group, viewedAt }
  THREADS: 'threads',       // key: 'snapshot', value: { list, updatedAt }
  MESSAGES: 'messages',     // key: peer, value: { items, updatedAt }
  REELS: 'reels',           // key: reelId, value: { reel, viewedAt }
  PROFILE: 'profile',       // key: username, value: { data, updatedAt }
  PAGES: 'pages',           // key: pathname, value: { title, visitedAt, hash }
  // ✅ v88.89: تخزين متخصص للنواقص الأربعة
  FEED: 'feed',             // key: 'latest', value: { posts, updatedAt } — آخر 10 منشورات
  GROUPS: 'groups',         // key: 'list' | groupId, value: قائمة المجموعات أو تفاصيل مجموعة
  GROUP_MSGS: 'group_msgs', // key: groupId, value: { items, updatedAt } — رسائل المجموعة
  SETTINGS: 'settings',     // key: 'account', value: { data, updatedAt } — إعدادات + ملف حسابي
  STORY_ITEMS: 'story_items', // key: storyId, value: { story, viewedAt } — ستوري فردي
};

const LIMITS = {
  STORIES: 10,
  MESSAGES_PER_PEER: 60,
  PEERS: 20,
  REELS: 5,
  PROFILES: 20,
  PAGES: 40,
  // ✅ v88.89
  FEED_POSTS: 10,           // آخر 10 منشورات في الرئيسية
  GROUPS_LIST: 30,          // حتى 30 مجموعة
  GROUP_MSGS_PER_GROUP: 60, // آخر 60 رسالة لكل مجموعة
  GROUPS_ACTIVE: 15,        // حتى 15 مجموعة نشطة لها رسائل محفوظة
  STORY_ITEMS: 20,          // حتى 20 ستوري فردي مفتوح
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

/* ----------------------------- Feed (آخر 10 منشورات) ----------------------------- */
// ✅ v88.89

export async function cacheFeedPosts(posts) {
  if (!Array.isArray(posts)) return;
  const trimmed = posts.slice(0, LIMITS.FEED_POSTS);
  await tx(STORES.FEED, 'readwrite', (store) => {
    store.put({ posts: trimmed, updatedAt: Date.now() }, 'latest');
  });
}

export async function getCachedFeedPosts() {
  const row = await tx(STORES.FEED, 'readonly', (store) => reqToPromise(store.get('latest')));
  return row?.posts || [];
}

/* ----------------------------- Groups (القائمة + تفاصيل كل مجموعة) ----------------------------- */
// ✅ v88.89

export async function cacheGroupsList(list) {
  if (!Array.isArray(list)) return;
  const trimmed = list.slice(0, LIMITS.GROUPS_LIST);
  await tx(STORES.GROUPS, 'readwrite', (store) => {
    store.put({ list: trimmed, updatedAt: Date.now() }, 'list');
  });
}

export async function getCachedGroupsList() {
  const row = await tx(STORES.GROUPS, 'readonly', (store) => reqToPromise(store.get('list')));
  return row?.list || [];
}

export async function cacheGroupDetails(groupId, details) {
  if (!groupId || !details) return;
  await tx(STORES.GROUPS, 'readwrite', (store) => {
    store.put({ details, updatedAt: Date.now() }, `g:${groupId}`);
  });
}

export async function getCachedGroupDetails(groupId) {
  if (!groupId) return null;
  const row = await tx(STORES.GROUPS, 'readonly',
    (store) => reqToPromise(store.get(`g:${groupId}`)));
  return row?.details || null;
}

/* ----------------------------- Group Messages ----------------------------- */
// ✅ v88.89

export async function cacheGroupMessages(groupId, items) {
  if (!groupId || !Array.isArray(items)) return;
  const trimmed = items.slice(-LIMITS.GROUP_MSGS_PER_GROUP);
  await tx(STORES.GROUP_MSGS, 'readwrite', async (store) => {
    store.put({ items: trimmed, updatedAt: Date.now() }, String(groupId));
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.GROUPS_ACTIVE && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.updatedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      paired.slice(0, keys.length - LIMITS.GROUPS_ACTIVE).forEach((p) => store.delete(p.k));
    }
  });
}

export async function getCachedGroupMessages(groupId) {
  if (!groupId) return null;
  const row = await tx(STORES.GROUP_MSGS, 'readonly',
    (store) => reqToPromise(store.get(String(groupId))));
  return row?.items || null;
}

/* ----------------------------- Settings & Account (ملف حسابي) ----------------------------- */
// ✅ v88.89

export async function cacheAccountSettings(data) {
  if (!data) return;
  await tx(STORES.SETTINGS, 'readwrite', (store) => {
    store.put({ data, updatedAt: Date.now() }, 'account');
  });
}

export async function getCachedAccountSettings() {
  const row = await tx(STORES.SETTINGS, 'readonly',
    (store) => reqToPromise(store.get('account')));
  return row?.data || null;
}

/* ----------------------------- Individual Story Items ----------------------------- */
// ✅ v88.89: ستوريات مفتوحة فردياً

export async function cacheStoryItem(storyId, story) {
  if (!storyId || !story) return;
  await tx(STORES.STORY_ITEMS, 'readwrite', async (store) => {
    store.put({ story, viewedAt: Date.now() }, String(storyId));
    const keys = await reqToPromise(store.getAllKeys());
    const entries = await reqToPromise(store.getAll());
    if (Array.isArray(keys) && keys.length > LIMITS.STORY_ITEMS && Array.isArray(entries)) {
      const paired = keys.map((k, i) => ({ k, at: entries[i]?.viewedAt || 0 }));
      paired.sort((a, b) => a.at - b.at);
      paired.slice(0, keys.length - LIMITS.STORY_ITEMS).forEach((p) => store.delete(p.k));
    }
  });
}

export async function getCachedStoryItem(storyId) {
  if (!storyId) return null;
  const row = await tx(STORES.STORY_ITEMS, 'readonly',
    (store) => reqToPromise(store.get(String(storyId))));
  return row?.story || null;
}

export async function getAllCachedStoryItems() {
  const rows = await tx(STORES.STORY_ITEMS, 'readonly', (store) => reqToPromise(store.getAll()));
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows
    .sort((a, b) => (b?.viewedAt || 0) - (a?.viewedAt || 0))
    .map((r) => r.story)
    .filter(Boolean);
}

export const OFFLINE_LIMITS = LIMITS;
export const OFFLINE_STORES = STORES;

export default {
  cacheStoryGroup, getCachedStoryGroups,
  cacheThreadsSnapshot, getCachedThreadsSnapshot,
  cacheMessagesForPeer, getCachedMessagesForPeer,
  cacheProfile, getCachedProfile,
  markPageVisited, isPageCached, getCachedPages,
  // ✅ v88.89 — النواقص الأربعة
  cacheFeedPosts, getCachedFeedPosts,
  cacheGroupsList, getCachedGroupsList,
  cacheGroupDetails, getCachedGroupDetails,
  cacheGroupMessages, getCachedGroupMessages,
  cacheAccountSettings, getCachedAccountSettings,
  cacheStoryItem, getCachedStoryItem, getAllCachedStoryItems,
  isStandalonePWA, isOnline, clearAllOfflineCache,
};
