import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

const asResponse = (data) => ({ data });

/**
 * الحصول على تفاصيل البث المباشر
 */
export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true });

/**
 * إرسال تعليق في البث المباشر
 */
export const sendLiveComment = (streamId, commentData = {}) =>
  apiClient.post(`/live/${streamId}/comment`, commentData);

/**
 * الحصول على تعليقات البث المباشر
 */
export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });

/**
 * إرسال هدية في البث المباشر
 */
export const sendLiveGift = (streamId, giftData = {}) =>
  apiClient.post(`/live/${streamId}/gift`, giftData);

/**
 * إرسال قلب في البث المباشر
 */
export const sendLiveHeart = async (streamId) => {
  socketManager.emit('send_heart', { room_id: streamId }, { queue: false });
  return asResponse({ status: 'queued', room_id: streamId });
};

/**
 * الحصول على إحصائيات البث (المشاهدات، القلوب، إلخ)
 */
export const getStreamStats = (streamId) =>
  apiClient.get(`/live/${streamId}/analytics`, { cache: false, forceRefresh: true });

/**
 * الحصول على إحصائيات البث (اسم بديل للتوافق)
 */
export const getLiveStreamStats = getStreamStats;

/**
 * إنشاء بث مباشر جديد
 */
export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', streamData);

/**
 * بدء البث المباشر (الحصول على التوكن)
 */
export const startLiveStream = (streamId, payload = {}) =>
  apiClient.post(`/live/${streamId}/token`, { role: 'host', ...payload });

/**
 * إنهاء البث المباشر
 */
export const endLiveStream = (streamId) =>
  apiClient.post(`/end_live/${streamId}`);

/**
 * تسجيل البث المباشر
 */
export const recordLiveStream = (streamId, recordingData = {}) => {
  const action = String(recordingData.action || 'start').trim().toLowerCase();
  return apiClient.post(`/live/${streamId}/recording/${action}`);
};

/**
 * تحديث حالة الكاميرا (وهمي للتوافق)
 */
export const updateCameraState = (streamId, state) => 
  asResponse({ status: 'ok', stream_id: streamId, state });

/**
 * إغلاق تدفق الكاميرا (وهمي للتوافق)
 */
export const closeCameraStream = (streamId) => 
  asResponse({ status: 'ok', stream_id: streamId });

/**
 * تبديل الكاميرا
 */
export const toggleCamera = (streamId, enabled) =>
  apiClient.post(`/live/${streamId}/camera`, { enabled });

/**
 * تبديل الميكروفون
 */
export const toggleMicrophone = (streamId, enabled) =>
  apiClient.post(`/live/${streamId}/microphone`, { enabled });

/**
 * الحصول على المشاهدين
 */
export const getStreamViewers = (streamId) =>
  apiClient.get(`/live/${streamId}/viewers`);

/**
 * كتم مستخدم
 */
export const muteUser = (streamId, userId, hostId, reason, duration) =>
  apiClient.post(`/live/${streamId}/mute`, { user_id: userId, host_id: hostId, reason, duration });

/**
 * رفع الكتم عن مستخدم
 */
export const unmuteUser = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/unmute`, { user_id: userId });

/**
 * حظر مستخدم
 */
export const banUser = (streamId, userId, hostId, reason, type) =>
  apiClient.post(`/live/${streamId}/ban`, { user_id: userId, host_id: hostId, reason, type });

/**
 * رفع الحظر عن مستخدم
 */
export const unbanUser = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/unban`, { user_id: userId });

/**
 * إزالة مشاهد من البث
 */
export const removeViewer = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/remove`, { user_id: userId });

/**
 * ربط البث المباشر بمنشور في الخلاصة
 */
export const linkLiveStreamToPost = (streamId, postData = {}) =>
  apiClient.post('/v1/feed/live/create', { stream_id: streamId, ...postData });

/**
 * تحديث حالة منشور البث (إنهاء، أرشفة، إلخ)
 */
export const updateStreamPostStatus = (streamId, statusData = {}) =>
  apiClient.post(`/v1/feed/live/${streamId}/end`, statusData);

export default {
  getLiveStreamDetails,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getStreamStats,
  getLiveStreamStats,
  createLiveStream,
  startLiveStream,
  endLiveStream,
  recordLiveStream,
  updateCameraState,
  closeCameraStream,
  toggleCamera,
  toggleMicrophone,
  getStreamViewers,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  removeViewer,
  linkLiveStreamToPost,
  updateStreamPostStatus,
};
