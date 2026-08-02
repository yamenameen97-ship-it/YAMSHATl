// services/share/sharedIntake.js — v89.21 ROOT FIXES
// ---------------------------------------------------------------
// جسر (Bridge) بين Service Worker (share_target) والمكوّنات في الواجهة.
//
// ✅ v89.21 — إصلاحان جذريان:
// 1) فشل التنزيل (CORS): روابط YouTube/TikTok/… لا تسمح بـ fetch مباشر
//    للفيديو من المتصفح. الحل الجديد: نستخرج thumbnail حقيقي من CDN
//    عام (i.ytimg.com لليوتيوب) وهو مسموح CORS، ونستخدمه كـ "المحتوى
//    الجاهز" مع بيانات المصدر التي جلبناها من oEmbed.
// 2) عدم ظهور الكارت الغني: عند "مشاركة كرابط" نستدعي oEmbed (YouTube
//    الرسمي + noembed كـ fallback) لجلب: العنوان، الوصف، thumbnail
//    عالي الجودة، اسم القناة (author_name)، صورة القناة (author_url).
//    ثم نبني linkCard مكتمل يعرضه ExternalSourceCard كبطاقة غنية
//    مطابقة للصورة المرجعية.
// ---------------------------------------------------------------

const DB_NAME = 'yamshat-pwa-db';
const STORE_NAME = 'shared-content';
const SHARE_KEY = 'latest';
const PENDING_KEY = 'yamshat.pendingShare';

export const SHARE_TARGETS = ['reel', 'post', 'story', 'chat', 'groups'];

let _memoryPending = null;

// ---------- IndexedDB helpers ----------
function openDatabase() {
  return new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME);
    } catch (err) {
      reject(err);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        try { db.createObjectStore(STORE_NAME); } catch (_) { /* ignore */ }
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const nextVersion = (db.version || 1) + 1;
        db.close();
        let upgradeReq;
        try {
          upgradeReq = indexedDB.open(DB_NAME, nextVersion);
        } catch (err) {
          reject(err);
          return;
        }
        upgradeReq.onupgradeneeded = () => {
          const udb = upgradeReq.result;
          if (!udb.objectStoreNames.contains(STORE_NAME)) {
            try { udb.createObjectStore(STORE_NAME); } catch (_) { /* ignore */ }
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
        upgradeReq.onblocked = () => reject(new Error('IDB upgrade blocked'));
      } else {
        resolve(db);
      }
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IDB open blocked'));
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

// ---------- التقاط لقطة صورة من فيديو ----------
export async function captureVideoThumbnail(fileOrBlob) {
  if (!fileOrBlob) return null;
  try {
    const url = URL.createObjectURL(fileOrBlob);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;
    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve;
      video.onerror = reject;
      setTimeout(() => resolve(), 5000);
    });
    const seekTime = Math.min(1, Math.max(0.1, (video.duration || 10) * 0.1));
    await new Promise((resolve) => {
      video.onseeked = resolve;
      video.currentTime = seekTime;
      setTimeout(resolve, 3000);
    });
    const canvas = document.createElement('canvas');
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 360;
    const scale = Math.min(1, 800 / w);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    try { video.pause(); video.src = ''; } catch { /* ignore */ }
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch (err) {
    console.warn('[sharedIntake] captureVideoThumbnail failed:', err);
    return null;
  }
}

// ---------- ✅ v89.21: كشف منصة المصدر من URL ----------
export function detectSourcePlatform(url = '') {
  const u = String(url || '').toLowerCase();
  if (!u) return { platform: 'unknown', displayName: 'مصدر خارجي', supportsBrowser: false };

  if (/youtube\.com|youtu\.be/.test(u))     return { platform: 'youtube',    displayName: 'YouTube',      supportsBrowser: true,  scheme: 'vnd.youtube:',  androidPackage: 'com.google.android.youtube',  iosScheme: 'youtube://' };
  if (/tiktok\.com/.test(u))                return { platform: 'tiktok',     displayName: 'TikTok',       supportsBrowser: true,  scheme: 'snssdk1233://', androidPackage: 'com.zhiliaoapp.musically',    iosScheme: 'snssdk1233://' };
  if (/twitter\.com|x\.com/.test(u))        return { platform: 'twitter',    displayName: 'X (Twitter)',  supportsBrowser: true,  scheme: 'twitter://',    androidPackage: 'com.twitter.android',         iosScheme: 'twitter://' };
  if (/instagram\.com/.test(u))             return { platform: 'instagram',  displayName: 'Instagram',    supportsBrowser: true,  scheme: 'instagram://',  androidPackage: 'com.instagram.android',       iosScheme: 'instagram://' };
  if (/facebook\.com|fb\.watch/.test(u))    return { platform: 'facebook',   displayName: 'Facebook',     supportsBrowser: true,  scheme: 'fb://',         androidPackage: 'com.facebook.katana',         iosScheme: 'fb://' };
  if (/snapchat\.com/.test(u))              return { platform: 'snapchat',   displayName: 'Snapchat',     supportsBrowser: true,  scheme: 'snapchat://',   androidPackage: 'com.snapchat.android',        iosScheme: 'snapchat://' };
  if (/reddit\.com/.test(u))                return { platform: 'reddit',     displayName: 'Reddit',       supportsBrowser: true,  scheme: 'reddit://',     androidPackage: 'com.reddit.frontpage',        iosScheme: 'reddit://' };
  if (/whatsapp\.com|wa\.me/.test(u))       return { platform: 'whatsapp',   displayName: 'WhatsApp',     supportsBrowser: false, scheme: 'whatsapp://',   androidPackage: 'com.whatsapp',                iosScheme: 'whatsapp://' };
  if (/telegram\.me|t\.me|telegram\.org/.test(u))return { platform: 'telegram', displayName: 'Telegram',  supportsBrowser: true,  scheme: 'tg://',         androidPackage: 'org.telegram.messenger',      iosScheme: 'tg://' };

  return { platform: 'web', displayName: 'موقع ويب', supportsBrowser: true, scheme: null, androidPackage: null, iosScheme: null };
}

// ---------- ✅ v89.21 ROOT FIX #1: استخراج YouTube video ID ----------
export function extractYouTubeId(url = '') {
  const u = String(url || '');
  if (!u) return null;
  try {
    // youtu.be/<id>
    let m = u.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
    if (m) return m[1];
    // /watch?v=<id>
    m = u.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
    if (m) return m[1];
    // /shorts/<id>
    m = u.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
    if (m) return m[1];
    // /embed/<id>
    m = u.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
    if (m) return m[1];
    // /live/<id>
    m = u.match(/youtube\.com\/live\/([A-Za-z0-9_-]{6,})/i);
    if (m) return m[1];
  } catch { /* ignore */ }
  return null;
}

// ---------- ✅ v89.21 ROOT FIX #1: بناء رابط thumbnail من YouTube CDN ----------
// i.ytimg.com يسمح CORS ولا يحتاج مفاتيح، نجرّب أعلى جودة أولاً.
export function buildYouTubeThumbnailUrl(videoId, quality = 'maxres') {
  if (!videoId) return null;
  const map = {
    maxres:  'maxresdefault.jpg',
    hq:      'hqdefault.jpg',
    mq:      'mqdefault.jpg',
    sd:      'sddefault.jpg',
    default: 'default.jpg',
  };
  const file = map[quality] || map.hq;
  return `https://i.ytimg.com/vi/${videoId}/${file}`;
}

// ---------- ✅ v89.21 ROOT FIX #2: جلب oEmbed metadata ----------
// نستخدم YouTube oEmbed الرسمي أولاً (يدعم CORS)، ثم noembed.com كـ fallback
// لبقية المنصات (TikTok، Twitter، Reddit، Instagram…).
export async function fetchOEmbedMetadata(url) {
  if (!url) return null;
  const info = detectSourcePlatform(url);

  // 1) YouTube: oEmbed الرسمي
  if (info.platform === 'youtube') {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const res = await fetch(oembedUrl, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        return {
          title:        data.title || null,
          description: null,
          thumbnail:    data.thumbnail_url || null,
          authorName:   data.author_name || null,
          authorUrl:    data.author_url || null,
          providerName: data.provider_name || 'YouTube',
          html:         data.html || null,
          width:        data.width || null,
          height:       data.height || null,
        };
      }
    } catch (err) {
      console.warn('[sharedIntake] YouTube oEmbed failed:', err);
    }
  }

  // 2) noembed.com — يدعم TikTok/Twitter/Reddit/Instagram/… ويسمح CORS
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const res = await fetch(noembedUrl, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        return {
          title:        data.title || null,
          description: null,
          thumbnail:    data.thumbnail_url || null,
          authorName:   data.author_name || null,
          authorUrl:    data.author_url || null,
          providerName: data.provider_name || info.displayName,
          html:         data.html || null,
          width:        data.width || null,
          height:       data.height || null,
        };
      }
    }
  } catch (err) {
    console.warn('[sharedIntake] noembed failed:', err);
  }

  return null;
}

// ---------- ✅ v89.21 ROOT FIX #2: بناء linkCard غني بعد إثراء oEmbed ----------
export async function enrichLinkCardFromOEmbed({ url, fallbackTitle, fallbackText, capturedThumbnail }) {
  const info = detectSourcePlatform(url);
  const meta = await fetchOEmbedMetadata(url).catch(() => null);

  // تحديد thumbnail الأنسب:
  // 1) capturedThumbnail (لقطة من الفيديو المحلي)
  // 2) thumbnail من oEmbed
  // 3) YouTube CDN مباشر (maxres)
  let thumbnail = capturedThumbnail || meta?.thumbnail || null;
  if (!thumbnail && info.platform === 'youtube') {
    const vid = extractYouTubeId(url);
    if (vid) thumbnail = buildYouTubeThumbnailUrl(vid, 'maxres');
  }

  return {
    title:            meta?.title || fallbackTitle || 'رابط خارجي',
    description:      fallbackText || '',
    thumbnail,
    sourceName:       meta?.providerName || info.displayName,
    sourceLogo:       info.platform,
    sourceUrl:        url,
    platform:         info.platform,
    supportsBrowser:  info.supportsBrowser,
    // ✅ v89.21: بيانات المؤلف/القناة
    authorName:       meta?.authorName || null,
    authorUrl:        meta?.authorUrl || null,
    authorAvatar:     null, // youtube oEmbed لا يعطي صورة القناة، نتركها null
    publishedAt:      null,
    viewsCount:       null,
    subscribersCount: null,
    duration:         null,
  };
}

// ---------- ✅ v89.21 ROOT FIX #1: تنزيل ملف مع معالجة CORS ----------
// يحاول fetch عادي أولاً؛ إن فشل بسبب CORS نرمي خطأً واضحاً للمستدعي كي
// يعيد التوجيه لـ downloadPlatformThumbnail بدلاً من الفيديو الأصلي.
export async function downloadSharedFile(url, onProgress) {
  if (!url) throw new Error('لا يوجد رابط للتنزيل');

  let response;
  try {
    response = await fetch(url, { mode: 'cors' });
  } catch (err) {
    // فشل شبكة أو CORS
    const e = new Error('CORS_BLOCKED');
    e.code = 'CORS_BLOCKED';
    e.original = err;
    throw e;
  }
  if (!response.ok) {
    const e = new Error(`فشل التنزيل: ${response.status}`);
    e.code = 'HTTP_' + response.status;
    throw e;
  }

  const total = Number(response.headers.get('content-length') || 0);
  const reader = response.body?.getReader();
  if (!reader) {
    const blob = await response.blob();
    if (onProgress) onProgress(100);
    return blob;
  }

  const chunks = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (onProgress && total > 0) {
      const pct = Math.min(100, Math.round((received / total) * 100));
      onProgress(pct);
    } else if (onProgress && total === 0) {
      const estimated = Math.min(95, Math.round((received / (5 * 1024 * 1024)) * 100));
      onProgress(estimated);
    }
  }
  if (onProgress) onProgress(100);
  const mimeType = response.headers.get('content-type') || 'application/octet-stream';
  return new Blob(chunks, { type: mimeType });
}

// ---------- ✅ v89.21 ROOT FIX #1: تنزيل thumbnail المنصة كـ fallback ----------
// عندما يفشل تنزيل الفيديو الأصلي (CORS)، نُنزّل thumbnail عالي الجودة من CDN
// المنصة (مسموح CORS) ونعتبره "المحتوى الجاهز للنشر". هكذا لا يفشل التدفق
// وينشر المستخدم بطاقة صورة مع بيانات المصدر بدلاً من رسالة الخطأ.
export async function downloadPlatformThumbnail(url, onProgress) {
  const info = detectSourcePlatform(url);

  // 1) YouTube: جرّب maxres ثم hq ثم sd (i.ytimg.com يدعم CORS)
  if (info.platform === 'youtube') {
    const vid = extractYouTubeId(url);
    if (vid) {
      const qualities = ['maxres', 'sd', 'hq', 'mq'];
      for (const q of qualities) {
        const thumbUrl = buildYouTubeThumbnailUrl(vid, q);
        try {
          const blob = await downloadSharedFile(thumbUrl, onProgress);
          // maxresdefault قد يعود 120x90 لو غير موجود؛ اقبل >5KB
          if (blob && blob.size > 5 * 1024) {
            return { blob, thumbUrl, quality: q, videoId: vid };
          }
        } catch (_) { /* جرّب الجودة التالية */ }
      }
    }
  }

  // 2) بقية المنصات: نحاول جلب thumbnail من oEmbed ثم تنزيله (قد ينجح CORS من CDN المنصة)
  const meta = await fetchOEmbedMetadata(url).catch(() => null);
  if (meta?.thumbnail) {
    try {
      const blob = await downloadSharedFile(meta.thumbnail, onProgress);
      if (blob && blob.size > 3 * 1024) {
        return { blob, thumbUrl: meta.thumbnail, quality: 'oembed', videoId: null };
      }
    } catch (_) { /* ignore */ }
  }

  return null;
}

// ---------- التصنيف الذكي ----------
export function recommendTarget(payload) {
  if (!payload) return { target: 'post', reason: 'no-payload' };
  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files[0];
  if (!firstFile) {
    return {
      target: 'post',
      reason: 'link-only',
      hint: 'المحتوى المُشارك رابط. سيُنشر ككارت غني مع زر "فتح المصدر".',
    };
  }
  const type = String(firstFile.type || '').toLowerCase();
  const sizeMB = Number(firstFile.size || 0) / (1024 * 1024);

  if (type.startsWith('image/')) {
    if (sizeMB <= 5)  return { target: 'story', reason: 'small-image', hint: 'صورة صغيرة مناسبة لستوري 24 ساعة.' };
    return { target: 'post', reason: 'image', hint: 'الصور تُنشر عبر بوست رفع المنشور.' };
  }

  if (type.startsWith('video/')) {
    if (sizeMB <= 30) return { target: 'story', reason: 'micro-video', hint: 'مقطع قصير جداً — الأنسب لستوري 24 ساعة.' };
    if (sizeMB <= 60) return { target: 'reel',  reason: 'short-video', hint: 'المقطع قصير — الأنسب رفعه كريلز.' };
    return { target: 'post', reason: 'long-video', hint: `المحتوى ~${Math.round(sizeMB)}MB. ننصح بنشره كمنشور فيديو.` };
  }

  return { target: 'post', reason: 'generic' };
}

// ---------- ✅ v89.21: تجهيز حمولة الاستهلاك ----------
export function stagePendingShare(payload, chosenTarget, options = {}) {
  if (!payload) {
    _memoryPending = null;
    try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
    return null;
  }
  const target = SHARE_TARGETS.includes(chosenTarget) ? chosenTarget : 'post';
  const mode = options.mode === 'download' ? 'download' : 'link';

  const files = Array.isArray(payload.files) ? payload.files : [];
  const firstFile = files[0] || null;
  const url = String(payload.url || '').trim();
  const text = String(payload.text || '').trim();
  const title = String(payload.title || '').trim();

  const description = options.customDescription != null
    ? options.customDescription.trim()
    : buildDescription({ title, text, url, includeUrl: false });

  const usedFile = mode === 'download'
    ? (options.downloadedFile || firstFile?.blob || null)
    : (firstFile?.blob || null);

  const usedFileMeta = mode === 'download'
    ? (options.downloadedFileMeta || (firstFile ? {
        name: firstFile.name || 'shared',
        type: firstFile.type || 'application/octet-stream',
        size: Number(firstFile.size || 0),
      } : null))
    : (firstFile ? {
        name: firstFile.name || 'shared',
        type: firstFile.type || 'application/octet-stream',
        size: Number(firstFile.size || 0),
      } : null);

  // ✅ v89.21: إن لم يُمرَّر linkCard صراحةً، نبني افتراضياً (بدون oEmbed).
  //            المستحسن أن يمرّره ShareTargetLanding بعد await enrichLinkCardFromOEmbed
  const linkCard = mode === 'link'
    ? (options.linkCard || buildDefaultLinkCard({ title, text, url, thumbnailDataUrl: options.thumbnailDataUrl }))
    : null;

  const adminSource = options.adminSource || buildAdminSource({ url, title, text, mode, fileMeta: usedFileMeta });

  _memoryPending = {
    target,
    mode,
    file: usedFile,
    fileMeta: usedFileMeta,
    description,
    sourceUrl: url,
    sourceTitle: title,
    sourceText: text,
    thumbnailDataUrl: options.thumbnailDataUrl || null,
    linkCard,
    adminSource,
    verifiedByYamshat: mode === 'download',
    receivedAt: payload.receivedAt || new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({
      target,
      mode,
      fileMeta: _memoryPending.fileMeta,
      description,
      sourceUrl: url,
      sourceTitle: title,
      sourceText: text,
      thumbnailDataUrl: options.thumbnailDataUrl || null,
      linkCard,
      adminSource,
      verifiedByYamshat: _memoryPending.verifiedByYamshat,
      receivedAt: _memoryPending.receivedAt,
    }));
  } catch { /* ignore */ }

  return _memoryPending;
}

export function consumePendingShare(expectedTarget) {
  const pending = _memoryPending;
  if (!pending) {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (expectedTarget && parsed.target && parsed.target !== expectedTarget) {
          return null;
        }
        _memoryPending = {
          target: parsed.target,
          mode: parsed.mode || 'link',
          file: null,
          fileMeta: parsed.fileMeta || null,
          description: parsed.description || '',
          sourceUrl: parsed.sourceUrl || '',
          sourceTitle: parsed.sourceTitle || '',
          sourceText: parsed.sourceText || '',
          thumbnailDataUrl: parsed.thumbnailDataUrl || null,
          linkCard: parsed.linkCard || null,
          adminSource: parsed.adminSource || null,
          verifiedByYamshat: Boolean(parsed.verifiedByYamshat),
          receivedAt: parsed.receivedAt || new Date().toISOString(),
        };
        sessionStorage.removeItem(PENDING_KEY);
        clearSharedPayload().catch(() => null);
        return _memoryPending;
      }
    } catch { /* ignore */ }
    return null;
  }
  if (expectedTarget && pending.target && pending.target !== expectedTarget) {
    return null;
  }
  _memoryPending = null;
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
  clearSharedPayload().catch(() => null);
  return pending;
}

export function peekPendingShare() {
  if (_memoryPending) return { hasFile: Boolean(_memoryPending.file), target: _memoryPending.target, mode: _memoryPending.mode };
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { hasFile: Boolean(parsed?.fileMeta), target: parsed?.target || null, mode: parsed?.mode || null };
  } catch { return null; }
}

function buildDescription({ title, text, url, includeUrl = true }) {
  const parts = [];
  if (title) parts.push(title);
  if (text && text !== title) parts.push(text);
  if (url && includeUrl) parts.push(url);
  return parts.join('\n').trim();
}

function buildDefaultLinkCard({ title, text, url, thumbnailDataUrl }) {
  const info = detectSourcePlatform(url);
  // ✅ v89.21: حتى في حالة الـ fallback نحاول thumbnail من YouTube CDN
  let thumbnail = thumbnailDataUrl || null;
  if (!thumbnail && info.platform === 'youtube') {
    const vid = extractYouTubeId(url);
    if (vid) thumbnail = buildYouTubeThumbnailUrl(vid, 'hq');
  }
  return {
    title: title || 'رابط خارجي',
    description: text || '',
    thumbnail,
    sourceName: info.displayName,
    sourceLogo: info.platform,
    sourceUrl: url,
    platform: info.platform,
    supportsBrowser: info.supportsBrowser,
    authorName: null,
    authorUrl: null,
    authorAvatar: null,
    publishedAt: null,
    viewsCount: null,
    subscribersCount: null,
    duration: null,
  };
}

function buildAdminSource({ url, title, text, mode, fileMeta }) {
  const info = detectSourcePlatform(url);
  return {
    source_platform: info.platform,
    source_platform_name: info.displayName,
    source_url: url || null,
    source_title: title || null,
    source_text: text || null,
    source_author: null,
    source_channel: null,
    captured_at: new Date().toISOString(),
    share_mode: mode,
    download_size: mode === 'download' ? Number(fileMeta?.size || 0) : null,
    download_mime: mode === 'download' ? (fileMeta?.type || null) : null,
    verified_by_yamshat: mode === 'download',
  };
}

export function dataUrlToBlob(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  try {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  } catch { return null; }
}

export const SHARE_INTAKE_INTERNAL = { _memoryRef: () => _memoryPending };
