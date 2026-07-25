// services/share/sharedIntake.js — v88.71
// ---------------------------------------------------------------
// جسر (Bridge) بين Service Worker (share_target) والمكوّنات في الواجهة.
// عندما يقوم المستخدم بمشاركة محتوى من تطبيق آخر (YouTube، Instagram،
// المعرض، متصفح آخر… إلخ) إلى منصة يام شات:
//   1) SW يستقبل الطلب POST /share-target ويحفظ الحمولة في IndexedDB.
//   2) SW يوجّه إلى /#/share-target?shared=1 (ShareTargetLanding).
//   3) ShareTargetLanding يستدعي readSharedPayload() لعرض الخيارين
//      (ريلز / منشور) — بناءً على حجم الملف يعرض توصية ذكية.
//   4) عند الاختيار، نُخزّن الحمولة في sessionStorage (كـ blob URL + meta)
//      ونحوّل المستخدم إلى PostComposer أو ReelComposer.
//   5) الكومبوزر المستهدف يقرأ consumePendingShare() تلقائياً عند التركيب،
//      يبدأ الرفع مع شريط تقدم، ويضع الرابط الأصلي (YouTube …) في الوصف.
// ---------------------------------------------------------------

const DB_NAME = 'yamshat-pwa-db';
const STORE_NAME = 'shared-content';
const SHARE_KEY = 'latest';

// مفتاح in-memory + sessionStorage لتمرير الحمولة إلى الكومبوزر
const PENDING_KEY = 'yamshat.pendingShare';

// ---- في الذاكرة (للـ Blob الأصلي — لا يُسلسل في sessionStorage) ----
let _memoryPending = null;

// ---------- IndexedDB helpers ----------
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readSharedPayload() {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(SHARE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function clearSharedPayload() {
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(SHARE_KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

// ---------- التصنيف الذكي: ريلز أو منشور؟ ----------
// معايير التوصية:
//   - لا يوجد ملف (رابط فقط مثل YouTube link)  → post  (منشور مع رابط في الوصف)
//   - ملف صورة                                 → post  (المنشور يدعم الصور)
//   - فيديو ≤ 90 ثانية أو ≤ 60MB               → reel  (ريلز)
//   - فيديو أطول أو أكبر                       → post  (منشور فيديو طويل)
// نُرجع فقط توصية — القرار النهائي للمستخدم عبر الأزرار.
export function recommendTarget(payload) {
  if (!payload) return { target: 'post', reason: 'no-payload' };

  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files[0];

  // رابط فقط بلا ملف (مثل مشاركة رابط يوتيوب)
  if (!firstFile) {
    return {
      target: 'post',
      reason: 'link-only',
      hint: 'المحتوى المُشارك هو رابط (مثل يوتيوب). سيُنشر كمنشور مع الرابط في الوصف.',
    };
  }

  const type = String(firstFile.type || '').toLowerCase();
  const sizeMB = Number(firstFile.size || 0) / (1024 * 1024);

  if (type.startsWith('image/')) {
    return {
      target: 'post',
      reason: 'image',
      hint: 'الصور تُنشر عبر بوست رفع المنشور.',
    };
  }

  if (type.startsWith('video/')) {
    // الحد الحاسم: 60MB. الفيديوهات الأصغر عادةً قصيرة (ريلز).
    // الأكبر منها تُوجّه كمنشور طويل.
    if (sizeMB <= 60) {
      return {
        target: 'reel',
        reason: 'short-video',
        hint: 'المقطع قصير — الأنسب رفعه كريلز.',
      };
    }
    return {
      target: 'post',
      reason: 'long-video',
      hint: `المحتوى أكبر من الحدّ الموصى به للريلز (~${Math.round(sizeMB)}MB). ننصح بنشره كمنشور فيديو.`,
    };
  }

  // أي نوع آخر — منشور
  return { target: 'post', reason: 'generic' };
}

// ---------- تجهيز حمولة الاستهلاك (Consumption) ----------
// نبني payload مبسّط قابل للحفظ في sessionStorage (بلا Blob) + Blob في الذاكرة.
export function stagePendingShare(payload, chosenTarget) {
  if (!payload) {
    _memoryPending = null;
    try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    return null;
  }

  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files[0] || null;

  // الرابط الأصلي — يوضع في وصف المنشور. نبحث في url أولاً، ثم في text.
  const url = String(payload.url || '').trim();
  const text = String(payload.text || '').trim();
  const title = String(payload.title || '').trim();
  const description = buildDescription({ title, text, url });

  // نضع Blob في الذاكرة، وميتاداتا في sessionStorage
  _memoryPending = {
    target: chosenTarget, // 'reel' | 'post'
    file: firstFile ? firstFile.blob : null,
    fileMeta: firstFile ? {
      name: firstFile.name || 'shared',
      type: firstFile.type || 'application/octet-stream',
      size: Number(firstFile.size || 0),
    } : null,
    description,
    sourceUrl: url,
    sourceTitle: title,
    sourceText: text,
    receivedAt: payload.receivedAt || new Date().toISOString(),
  };

  // نسخة قابلة للتسلسل (بدون Blob) — تعمل كسجل احتياطي إذا فُقدت الذاكرة
  // (مثل reload بعد الاختيار قبل استهلاك الحمولة).
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      target: chosenTarget,
      fileMeta: _memoryPending.fileMeta,
      description,
      sourceUrl: url,
      sourceTitle: title,
      sourceText: text,
      receivedAt: _memoryPending.receivedAt,
    }));
  } catch { /* ignore */ }

  return _memoryPending;
}

// يستدعيها الكومبوزر (Post أو Reel) عند التركيب. تُرجع الحمولة إن وُجدت،
// وتمسحها فوراً حتى لا تُعاد قراءتها في تنقل لاحق.
export function consumePendingShare(expectedTarget) {
  const pending = _memoryPending;
  if (!pending) return null;
  if (expectedTarget && pending.target && pending.target !== expectedTarget) {
    return null;
  }
  // امسح من الذاكرة + sessionStorage + IndexedDB
  _memoryPending = null;
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  clearSharedPayload().catch(() => null);
  return pending;
}

// كشف بسيط للاستعلام "هل لدينا مشاركة معلّقة؟" — دون استهلاك.
export function peekPendingShare() {
  if (_memoryPending) return { hasFile: Boolean(_memoryPending.file), target: _memoryPending.target };
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { hasFile: Boolean(parsed?.fileMeta), target: parsed?.target || null };
  } catch {
    return null;
  }
}

// ---------- بناء وصف افتراضي من العنوان + النص + الرابط ----------
function buildDescription({ title, text, url }) {
  const parts = [];
  if (title) parts.push(title);
  if (text && text !== title) parts.push(text);
  if (url) {
    // نضيف الرابط في سطر جديد ليكون واضحاً وقابلاً للنقر
    parts.push(url);
  }
  return parts.join('\n').trim();
}

export const SHARE_INTAKE_INTERNAL = { _memoryRef: () => _memoryPending };
