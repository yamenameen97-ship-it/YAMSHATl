/**
 * 🌐 Live Stream API Layer — مجرد طبقة HTTP فوق backend/live.py.
 * =================================================================
 * المعمارية الجديدة (وفق متطلبات المالك):
 *   - لا يحتوي أي منطق Socket إطلاقاً.
 *   - فقط دوال HTTP تتطابق مع routes في backend/app/api/routes/live.py.
 */

import apiClient from './apiClient.js';

// ==================== Streams listing / details ====================
export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true });

export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true, retry: true });

// ==================== Lifecycle ====================
/**
 * إنشاء بث جديد — لا ينشئ غرفة LiveKit بعد، فقط سجل في DB.
 * يُرجع { id, livekit_room, livekit_url, ... }.
 */
export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', {
    title: streamData.title || '',
    description: streamData.description || '',
    thumbnail_url: streamData.thumbnail_url || streamData.thumbnailUrl || '',
    is_public: streamData.is_public !== false,
  }, { retry: true });

/**
 * طلب توكن LiveKit — هنا يتم إنشاء غرفة LiveKit فعلياً في الـ backend.
 * يُرجع { token, livekit_url, livekit_room, role, identity, room_id }.
 */
export const getLiveToken = (streamId, payload = {}) =>
  apiClient.post(`/live_room/${streamId}/token`, payload, { retry: true });

/**
 * بدء البث = طلب توكن host. (alias تاريخي)
 */
export const startLiveStream = (streamId, payload = {}) =>
  getLiveToken(streamId, { role: 'host', ...payload });

export const endLiveStream = (streamId) =>
  apiClient.post(`/end_live/${streamId}`, {}, { retry: true });

// ==================== Stats / analytics ====================
export const getStreamStats = (streamId) =>
  apiClient.get(`/live_room/${streamId}/analytics`, { cache: false, forceRefresh: true });

export const getLiveStreamStats = getStreamStats; // alias تاريخي

export const getLiveStreamViewers = (streamId) =>
  apiClient.get(`/live_room/${streamId}/viewers`, { cache: false, forceRefresh: true, retry: true });

// ==================== Comments ====================
export const sendLiveComment = (streamId, commentData = {}) => {
  const payload = typeof commentData === 'string'
    ? { content: commentData, text: commentData }
    : {
        content: commentData.content || commentData.text || '',
        text: commentData.text || commentData.content || '',
      };
  return apiClient.post(`/live_room/${streamId}/comment`, payload, { retry: true });
};

export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });

// ==================== Gifts ====================
export const sendLiveGift = (streamId, giftData = {}) => {
  const payload = typeof giftData === 'object' && giftData !== null
    ? giftData
    : { gift_id: String(giftData) };
  return apiClient.post(`/live_room/${streamId}/gift`, payload, { retry: true });
};

// ==================== Hearts / Likes ====================
/**
 * إرسال قلب (إعجاب) للبث المباشر.
 * يحاول endpoint مخصص أولاً، ويسقط بصمت إن لم يكن متاحاً (للتجربة في UI).
 */
export const sendLiveHeart = (streamId, payload = {}) => {
  return apiClient
    .post(`/live_room/${streamId}/heart`, payload, { retry: false })
    .catch(() => ({ success: true, data: { hearts_count: null } }));
};

// ==================== Viewers ====================
export const addViewer = (streamId, viewerData = {}) =>
  apiClient.post(`/live_room/${streamId}/add-viewer`, {
    platform: viewerData.platform || 'web',
  }, { retry: true });

export const removeViewer = (streamId, userId) =>
  apiClient.post(`/live_room/${streamId}/remove-viewer`, { user_id: userId }, { retry: true });

// ==================== Recording ====================
export const recordLiveStream = (streamId, recordingData = {}) => {
  const action = String(recordingData.action || 'start').trim().toLowerCase();
  return apiClient.post(`/live_room/${streamId}/recording/${action}`, recordingData, { retry: true });
};

export default {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  getLiveToken,
  startLiveStream,
  endLiveStream,
  getStreamStats,
  getLiveStreamStats,
  getLiveStreamViewers,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  addViewer,
  removeViewer,
  recordLiveStream,
};
