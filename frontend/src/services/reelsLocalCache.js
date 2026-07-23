/**
 * reelsLocalCache.js — v88.41
 * =================================================================
 * كاش محلي ذكي لآخر 10 ريلز تم مشاهدتها فقط، مبني على IndexedDB.
 *
 * السياسة الجديدة:
 *   ‣ التخزين الدائم دائماً على قاعدة بيانات Render + Cloudinary.
 *   ‣ محلياً نحتفظ فقط بميتاداتا آخر 10 ريلز مُشاهدة (بدون الفيديو نفسه).
 *   ‣ عند العودة إلى صفحة الريلز نُظهر هذه العشرة فوراً من IndexedDB
 *     ثم نحدّث القائمة الكاملة من الشبكة في الخلفية.
 *
 * لماذا IndexedDB بدل localStorage؟
 *   ‣ حجم localStorage محدود (~5MB) ويُمسح مع أي زيارة بوضع تصفح خاص.
 *   ‣ IndexedDB يعمل بشكل غير متزامن ولا يقفل الـ UI.
 *   ‣ يسمح بتخزين ملفات الفيديو ذاتها (Blob) لاحقاً لو أردنا.
 *
 * الحد الأقصى: 10 ريلز. أي ريل جديد يُدفع للأول ويُطرد الأقدم.
 * =================================================================
 */

const DB_NAME = 'yamshat_reels_v88_41';
const DB_VERSION = 1;
const STORE_RECENT = 'recent_reels'; // آخر 10 ريلز مُشاهدة (ميتاداتا)
const STORE_BLOBS = 'reel_blobs';     // اختياري: Blob الفيديو للتشغيل الفوري
const MAX_RECENT = 10;

let _dbPromise = null;

function _canUseIDB() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function _openDB() {
  if (!_canUseIDB()) return Promise.resolve(null);
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_RECENT)) {
          const store = db.createObjectStore(STORE_RECENT, { keyPath: 'reelId' });
          store.createIndex('watchedAt', 'watchedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'reelId' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch (_e) {
      resolve(null);
    }
  });
  return _dbPromise;
}

function _tx(db, storeName, mode = 'readonly') {
  return db.transaction(storeName, mode).objectStore(storeName);
}

/**
 * سجّل ريلاً في قائمة آخر 10 مُشاهدة.
 * @param {object} reel - بيانات الريل الكاملة كما جاءت من الشبكة (يجب أن تحتوي id + video_url).
 */
export async function markReelWatched(reel) {
  if (!reel || (!reel.id && !reel.reel_id)) return;
  const db = await _openDB();
  if (!db) return;
  try {
    const reelId = String(reel.id || reel.reel_id);
    const now = Date.now();

    // نُنظّف قبل الإضافة: نجلب كل السجلات، نضيف الجديد، نُبقي أحدث 10 فقط.
    await new Promise((resolve) => {
      const store = _tx(db, STORE_RECENT, 'readwrite');
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const rows = Array.isArray(getAllReq.result) ? getAllReq.result : [];
        const filtered = rows.filter((r) => String(r.reelId) !== reelId);
        filtered.push({
          reelId,
          watchedAt: now,
          data: _stripHeavyFields(reel),
        });
        // احتفظ بأحدث MAX_RECENT
        filtered.sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
        const keep = filtered.slice(0, MAX_RECENT);
        const dropIds = filtered.slice(MAX_RECENT).map((r) => r.reelId);

        // امسح كل شيء وأعد الكتابة
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          keep.forEach((row) => store.put(row));
          resolve();
        };
        clearReq.onerror = () => resolve();

        // امسح Blobs للريلز المطرودة أيضاً (لو موجودة)
        if (dropIds.length) {
          try {
            const blobStore = db.transaction(STORE_BLOBS, 'readwrite').objectStore(STORE_BLOBS);
            dropIds.forEach((id) => blobStore.delete(id));
          } catch (_e) { /* ignore */ }
        }
      };
      getAllReq.onerror = () => resolve();
    });
  } catch (_e) { /* ignore */ }
}

/**
 * يُرجع آخر 10 ريلز مُشاهدة، مرتبة من الأحدث للأقدم.
 * @returns {Promise<object[]>} قائمة كائنات الريل الكاملة.
 */
export async function getRecentReels() {
  const db = await _openDB();
  if (!db) return [];
  try {
    return await new Promise((resolve) => {
      const store = _tx(db, STORE_RECENT, 'readonly');
      const req = store.getAll();
      req.onsuccess = () => {
        const rows = Array.isArray(req.result) ? req.result : [];
        rows.sort((a, b) => (b.watchedAt || 0) - (a.watchedAt || 0));
        resolve(rows.slice(0, MAX_RECENT).map((r) => r.data).filter(Boolean));
      };
      req.onerror = () => resolve([]);
    });
  } catch (_e) {
    return [];
  }
}

/**
 * إزالة ريل معيّن من الكاش المحلي (بعد الحذف السحابي مثلاً).
 */
export async function forgetReel(reelId) {
  if (!reelId) return;
  const db = await _openDB();
  if (!db) return;
  try {
    const id = String(reelId);
    await new Promise((resolve) => {
      const store = _tx(db, STORE_RECENT, 'readwrite');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
    try {
      const blobStore = db.transaction(STORE_BLOBS, 'readwrite').objectStore(STORE_BLOBS);
      blobStore.delete(id);
    } catch (_e) { /* ignore */ }
  } catch (_e) { /* ignore */ }
}

/**
 * تنظيف كامل — يُستخدم عند تسجيل الخروج.
 */
export async function clearRecentReels() {
  const db = await _openDB();
  if (!db) return;
  try {
    await new Promise((resolve) => {
      const store = _tx(db, STORE_RECENT, 'readwrite');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
    try {
      const blobStore = db.transaction(STORE_BLOBS, 'readwrite').objectStore(STORE_BLOBS);
      blobStore.clear();
    } catch (_e) { /* ignore */ }
  } catch (_e) { /* ignore */ }
}

/**
 * ميتاداتا خفيفة: نُبقي كل الحقول المفيدة للعرض السريع (رابط Cloudinary، الصورة المصغّرة،
 * التعليق، اسم الناشر، العدّادات) ونستبعد أي حقول ثقيلة/داخلية.
 */
function _stripHeavyFields(reel) {
  const {
    id, _id, reel_id,
    user_id, username, is_verified,
    created_at, content, caption, description,
    hashtags,
    media_url, video_url, url, file_url, media,
    poster, thumbnail_url, image_url, preview_url, thumbnail,
    likes_count, comments_count, share_count, shares_count, views_count,
    is_liked, is_saved, is_following,
    avatar, user_avatar, user,
    display_name, full_name, author_name,
    duration, category,
  } = reel || {};
  return {
    id, _id, reel_id,
    user_id, username, is_verified,
    created_at, content, caption, description,
    hashtags,
    media_url, video_url, url, file_url, media,
    poster, thumbnail_url, image_url, preview_url, thumbnail,
    likes_count, comments_count, share_count, shares_count, views_count,
    is_liked, is_saved, is_following,
    avatar, user_avatar, user,
    display_name, full_name, author_name,
    duration, category,
  };
}

export const REELS_LOCAL_CACHE_LIMIT = MAX_RECENT;
