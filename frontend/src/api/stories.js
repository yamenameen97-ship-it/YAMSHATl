import API from './axios.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';

/* ============================================================
 * Stories API — v59.13.27 (FIX: Broken Stories Media)
 *  - getStoriesGrouped: للشريط الدائري تحت هيدر الشات (أصدقاء فقط).
 *  - السياسة الجديدة: لا قصص عامة — تظهر فقط للأصدقاء.
 *  - v59.10: إضافة getStoryViewers, voteStoryPoll, renameHighlight,
 *            downloadStoryMedia (تنزيل محلي على الجهاز).
 *
 *  ✅ v59.13.27 FIX:
 *   - الباك إند يرجع media_url كمسار نسبي (/uploads/xxx) بدون origin.
 *   - عند عرضه في <img src> أو <video src> يحاول المتصفح تحميله من
 *     نطاق الفرونت إند بدلاً من نطاق الباك إند → 404 → "تعذّر تحميل الوسائط".
 *   - الحل: تمرير كل media_url عبر resolveMediaUrl() قبل إعادتها للواجهة،
 *     لتحويلها لرابط مطلق على BACKEND_ORIGIN أو CDN_BASE.
 *   - نفس المعالجة تُطبَّق على نتيجة uploadStory حتى يستخدم
 *     الـoptimistic update الرابط المطلق فوراً ولا يظهر مكسوراً.
 * ============================================================ */

/**
 * تطبيع قصة واحدة: تحويل media_url إلى رابط مطلق + الحقول المساعدة.
 * يحفظ كل الحقول الأصلية + يطبق resolveMediaUrl على الحقول الإعلامية.
 */
function normalizeStoryObject(story) {
  if (!story || typeof story !== 'object') return story;
  // الحفاظ على blob: و data: كما هي (لـ optimistic local previews)
  const raw = String(story.media_url || story.media || story.url || '').trim();
  const absoluteMedia = resolveMediaUrl(raw);
  const thumb = resolveMediaUrl(story.thumbnail_url || story.thumb_url || story.preview_url || '');
  const avatar = resolveMediaUrl(story.user_avatar || story.avatar || story.author_avatar || '');
  return {
    ...story,
    media_url: absoluteMedia || raw,
    media: absoluteMedia || raw,
    thumbnail_url: thumb || '',
    preview_url: thumb || absoluteMedia || '',
    user_avatar: avatar || '',
  };
}

/**
 * تطبيع مجموعة قصص (group في /stories/grouped):
 * - يطبق normalizeStoryObject على كل قصة داخل المجموعة.
 * - يطبق resolveMediaUrl على أفاتار المستخدم.
 */
function normalizeStoryGroup(group) {
  if (!group || typeof group !== 'object') return group;
  const stories = Array.isArray(group.stories) ? group.stories.map(normalizeStoryObject) : [];
  return {
    ...group,
    user_avatar: resolveMediaUrl(group.user_avatar || group.avatar || ''),
    stories,
  };
}

/** يطبق التطبيع على الـ response (data قد تكون مصفوفة أو كائن أو مغلّفة) */
function normalizeStoriesResponse(res, mode = 'list') {
  if (!res) return res;
  const data = res.data;
  if (mode === 'group' && Array.isArray(data)) {
    return { ...res, data: data.map(normalizeStoryGroup) };
  }
  if (mode === 'list' && Array.isArray(data)) {
    return { ...res, data: data.map(normalizeStoryObject) };
  }
  if (mode === 'single' && data && typeof data === 'object') {
    return { ...res, data: normalizeStoryObject(data) };
  }
  return res;
}

export const getStories = async () => {
  const res = await API.get('/stories');
  return normalizeStoriesResponse(res, 'list');
};

// v83.9 — جلب قصة واحدة (كان endpoint مفقود)
export const getStoryById = async (storyId) => {
  const res = await API.get(`/stories/${storyId}`);
  return normalizeStoriesResponse(res, 'single');
};

export const getStoriesGrouped = async () => {
  const res = await API.get('/stories/grouped');
  return normalizeStoriesResponse(res, 'group');
};

export const getStoryHighlights = async () => {
  const res = await API.get('/stories/highlights');
  return normalizeStoriesResponse(res, 'list');
};

export const getStoryArchive = async () => {
  const res = await API.get('/stories/archive');
  return normalizeStoriesResponse(res, 'list');
};

export const getStoryAnalyticsSummary = () => API.get('/stories/analytics/summary');

export const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
export const reactToStory = (storyId, emoji) =>
  API.post(`/stories/${storyId}/react`, { emoji });
export const replyToStory = (storyId, text) =>
  API.post(`/stories/${storyId}/reply`, { text });

// v59.10 — التصويت على استطلاع داخل القصة
export const voteStoryPoll = (storyId, optionIndex) =>
  API.post(`/stories/${storyId}/poll/vote`, { option_index: optionIndex });

// v59.10 — قائمة المشاهدين (للمالك فقط)
export const getStoryViewers = (storyId) =>
  API.get(`/stories/${storyId}/viewers`);

// Highlights
export const toggleStoryHighlight = (storyId, title = '') =>
  API.post(`/stories/${storyId}/highlight`, title ? { title } : {});
export const renameStoryHighlight = (storyId, title) =>
  API.post(`/stories/${storyId}/highlight/title`, { title });

export const deleteStory = (storyId) => API.delete(`/stories/${storyId}`);

/**
 * رفع قصة جديدة مع كل ميتاداتاها.
 * @param {File} file - ملف الصورة/الفيديو
 * @param {Object} meta - { caption, privacy, music, stickers, mentions, poll_question,
 *                          poll_options, countdown_at, filter_name, drawing_data,
 *                          is_close_friends, auto_delete_hours }
 * @param {(evt: ProgressEvent) => void} onProgress
 *
 * ✅ v59.13.27: التطبيع يضمن أن media_url يصبح رابطاً مطلقاً قبل تمريره
 * إلى buildOptimisticSelfGroup في StoriesBar، فلا يظهر مكسوراً.
 */
export const uploadStory = async (file, meta = {}, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  // privacy افتراضياً friends (السياسة الجديدة)
  if (!meta.privacy) meta.privacy = meta.is_close_friends ? 'close_friends' : 'friends';

  Object.entries(meta || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false');
      return;
    }
    formData.append(key, Array.isArray(value) ? value.join(',') : value);
  });
  const res = await API.post('/add_story', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: typeof onProgress === 'function' ? onProgress : undefined,
  });
  return normalizeStoriesResponse(res, 'single');
};

/**
 * v59.10 — تنزيل وسائط قصة وحفظها في الجهاز.
 * يستخدم fetch مع blob لتفادي مشاكل CORS عند التنزيل المباشر.
 * @param {string} url - رابط الوسائط
 * @param {string} filename - اسم الملف عند الحفظ
 */
export const downloadStoryMedia = async (url, filename = 'story') => {
  if (!url) return false;
  try {
    // ✅ v59.13.27: حوّل المسار النسبي إلى مطلق قبل الـfetch
    const absoluteUrl = resolveMediaUrl(url) || url;
    const res = await fetch(absoluteUrl, { credentials: 'omit' });
    if (!res.ok) throw new Error(`download failed: ${res.status}`);
    const blob = await res.blob();
    const ext = (blob.type.split('/')[1] || 'jpg').split(';')[0];
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    return true;
  } catch (err) {
    console.warn('[stories.downloadStoryMedia]', err);
    return false;
  }
};
