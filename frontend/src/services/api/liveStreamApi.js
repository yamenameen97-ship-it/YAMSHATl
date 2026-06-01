import apiClient from './apiClient.js';

/**
 * خدمة API لإدارة البث المباشر والمنشورات
 */

/**
 * الحصول على قائمة البثوث المباشرة النشطة
 */
export const getActiveLiveStreams = async (filters = {}) => {
  try {
    const response = await apiClient.get('/live/active', { params: filters });
    return response;
  } catch (error) {
    console.error('Error fetching active live streams:', error);
    throw error;
  }
};

/**
 * الحصول على تفاصيل بث مباشر محدد
 */
export const getLiveStreamDetails = async (streamId) => {
  try {
    const response = await apiClient.get(`/live/${streamId}`);
    return response;
  } catch (error) {
    console.error('Error fetching live stream details:', error);
    throw error;
  }
};

/**
 * إنشاء بث مباشر جديد
 */
export const createLiveStream = async (streamData) => {
  try {
    const response = await apiClient.post('/live/create', streamData);
    return response;
  } catch (error) {
    console.error('Error creating live stream:', error);
    throw error;
  }
};

/**
 * بدء البث المباشر
 */
export const startLiveStream = async (streamId) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/start`);
    return response;
  } catch (error) {
    console.error('Error starting live stream:', error);
    throw error;
  }
};

/**
 * إنهاء البث المباشر
 */
export const endLiveStream = async (streamId) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/end`);
    return response;
  } catch (error) {
    console.error('Error ending live stream:', error);
    throw error;
  }
};

/**
 * إرسال تعليق على البث المباشر
 */
export const sendLiveComment = async (streamId, commentData) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/comment`, commentData);
    return response;
  } catch (error) {
    console.error('Error sending live comment:', error);
    throw error;
  }
};

/**
 * الحصول على تعليقات البث المباشر
 */
export const getLiveComments = async (streamId, limit = 50) => {
  try {
    const response = await apiClient.get(`/live/${streamId}/comments`, {
      params: { limit }
    });
    return response;
  } catch (error) {
    console.error('Error fetching live comments:', error);
    throw error;
  }
};

/**
 * إرسال هدية على البث المباشر
 */
export const sendLiveGift = async (streamId, giftData) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/gift`, giftData);
    return response;
  } catch (error) {
    console.error('Error sending live gift:', error);
    throw error;
  }
};

/**
 * إرسال قلب على البث المباشر
 */
export const sendLiveHeart = async (streamId) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/heart`);
    return response;
  } catch (error) {
    console.error('Error sending live heart:', error);
    throw error;
  }
};

/**
 * الحصول على إحصائيات البث المباشر
 */
export const getLiveStreamStats = async (streamId) => {
  try {
    const response = await apiClient.get(`/live/${streamId}/stats`);
    return response;
  } catch (error) {
    console.error('Error fetching live stream stats:', error);
    throw error;
  }
};

/**
 * تحديث حالة البث المباشر
 */
export const updateLiveStreamStatus = async (streamId, statusData) => {
  try {
    const response = await apiClient.put(`/live/${streamId}/status`, statusData);
    return response;
  } catch (error) {
    console.error('Error updating live stream status:', error);
    throw error;
  }
};

/**
 * ربط البث المباشر بمنشور
 */
export const linkLiveStreamToPost = async (streamId, postId) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/link-post`, { post_id: postId });
    return response;
  } catch (error) {
    console.error('Error linking live stream to post:', error);
    throw error;
  }
};

/**
 * الحصول على المنشورات التي تحتوي على بثوث مباشرة
 */
export const getPostsWithLiveStreams = async (filters = {}) => {
  try {
    const response = await apiClient.get('/posts/with-live-streams', { params: filters });
    return response;
  } catch (error) {
    console.error('Error fetching posts with live streams:', error);
    throw error;
  }
};

/**
 * تحديث معلومات البث المباشر
 */
export const updateLiveStreamInfo = async (streamId, updateData) => {
  try {
    const response = await apiClient.put(`/live/${streamId}`, updateData);
    return response;
  } catch (error) {
    console.error('Error updating live stream info:', error);
    throw error;
  }
};

/**
 * الحصول على قائمة المشاهدين للبث المباشر
 */
export const getLiveStreamViewers = async (streamId) => {
  try {
    const response = await apiClient.get(`/live/${streamId}/viewers`);
    return response;
  } catch (error) {
    console.error('Error fetching live stream viewers:', error);
    throw error;
  }
};

/**
 * إضافة مضيف مشارك للبث المباشر
 */
export const addCoHost = async (streamId, coHostData) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/cohost`, coHostData);
    return response;
  } catch (error) {
    console.error('Error adding co-host:', error);
    throw error;
  }
};

/**
 * إزالة مضيف مشارك من البث المباشر
 */
export const removeCoHost = async (streamId, coHostId) => {
  try {
    const response = await apiClient.delete(`/live/${streamId}/cohost/${coHostId}`);
    return response;
  } catch (error) {
    console.error('Error removing co-host:', error);
    throw error;
  }
};

/**
 * تطبيق إجراء إشراف على البث المباشر
 */
export const applyModerationAction = async (streamId, actionData) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/moderation`, actionData);
    return response;
  } catch (error) {
    console.error('Error applying moderation action:', error);
    throw error;
  }
};

/**
 * الحصول على إحصائيات الهدايا للبث المباشر
 */
export const getLiveStreamGiftStats = async (streamId) => {
  try {
    const response = await apiClient.get(`/live/${streamId}/gifts`);
    return response;
  } catch (error) {
    console.error('Error fetching gift stats:', error);
    throw error;
  }
};

/**
 * تسجيل البث المباشر
 */
export const recordLiveStream = async (streamId, recordingData = {}) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/record`, recordingData);
    return response;
  } catch (error) {
    console.error('Error recording live stream:', error);
    throw error;
  }
};

/**
 * إيقاف تسجيل البث المباشر
 */
export const stopRecordingLiveStream = async (streamId) => {
  try {
    const response = await apiClient.post(`/live/${streamId}/stop-record`);
    return response;
  } catch (error) {
    console.error('Error stopping live stream recording:', error);
    throw error;
  }
};

export default {
  getActiveLiveStreams,
  getLiveStreamDetails,
  createLiveStream,
  startLiveStream,
  endLiveStream,
  sendLiveComment,
  getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  getLiveStreamStats,
  updateLiveStreamStatus,
  linkLiveStreamToPost,
  getPostsWithLiveStreams,
  updateLiveStreamInfo,
  getLiveStreamViewers,
  addCoHost,
  removeCoHost,
  applyModerationAction,
  getLiveStreamGiftStats,
  recordLiveStream,
  stopRecordingLiveStream,
};
