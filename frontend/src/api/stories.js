import API from './axios.js';

/* ============================================================
 * Stories API — v59.10
 *  - getStoriesGrouped: للشريط الدائري تحت هيدر الشات (أصدقاء فقط).
 *  - السياسة الجديدة: لا قصص عامة — تظهر فقط للأصدقاء.
 *  - v59.10: إضافة getStoryViewers, voteStoryPoll, renameHighlight,
 *            downloadStoryMedia (تنزيل محلي على الجهاز).
 * ============================================================ */

export const getStories = () => API.get('/stories');
export const getStoriesGrouped = () => API.get('/stories/grouped');
export const getStoryHighlights = () => API.get('/stories/highlights');
export const getStoryArchive = () => API.get('/stories/archive');
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
 */
export const uploadStory = (file, meta = {}, onProgress) => {
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
  return API.post('/add_story', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: typeof onProgress === 'function' ? onProgress : undefined,
  });
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
    const res = await fetch(url, { credentials: 'omit' });
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
