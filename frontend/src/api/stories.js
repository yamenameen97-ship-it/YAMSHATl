import API from './axios.js';

/* ============================================================
 * Stories API — v59.1
 *  - getStoriesGrouped: للشريط الدائري تحت هيدر الشات (أصدقاء فقط).
 *  - السياسة الجديدة: لا قصص عامة — تظهر فقط للأصدقاء.
 * ============================================================ */

export const getStories = () => API.get('/stories');
export const getStoriesGrouped = () => API.get('/stories/grouped');
export const getStoryHighlights = () => API.get('/stories/highlights');
export const getStoryArchive = () => API.get('/stories/archive');
export const getStoryAnalyticsSummary = () => API.get('/stories/analytics/summary');
export const viewStory = (storyId) => API.post(`/stories/${storyId}/view`);
export const reactToStory = (storyId, emoji) => API.post(`/stories/${storyId}/react`, { emoji });
export const replyToStory = (storyId, text) => API.post(`/stories/${storyId}/reply`, { text });
export const toggleStoryHighlight = (storyId) => API.post(`/stories/${storyId}/highlight`);
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
  // privacy افتراضيًا friends (السياسة الجديدة)
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
