import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

// ✅ FIX: تحسين معالجة الأخطاء والتوكين في جميع طلبات البث المباشر

/**
 * واجهات API متقدمة للبث المباشر
 * تتضمن إدارة المشتركين والحظر والكتم والكاميرا
 * ✅ تم إصلاح: إرسال البيانات الصحيحة، إعادة المحاولة عند الفشل، دعم Socket
 */

// ==================== Stream Management ====================

export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', {
    title: streamData.title || '',
    description: streamData.description || '',
    category: streamData.category || 'أخرى',
    quality: streamData.quality || '720p',
    is_public: streamData.isPublic !== false,
    allow_comments: streamData.allowComments !== false,
    allow_gifts: streamData.allowGifts !== false,
    allow_recording: streamData.allowRecording || false,
    // ✅ FIX: إرسال صورة الغلاف (thumbnail_url) عند إنشاء البث
    thumbnail_url: streamData.thumbnail_url || '',
  });

export const startLiveStream = (streamId, payload = {}) =>
  apiClient.post(`/live_room/${streamId}/token`, {
    quality: payload.quality || '720p',
    enable_recording: payload.enableRecording || false,
  }, { retry: true });

export const endLiveStream = (streamId) =>
  apiClient.post(`/end_live/${streamId}`, {}, { retry: true });

export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live_room/${streamId}`, { cache: false, forceRefresh: true, retry: true });

// ==================== Viewer Management ====================

export const addViewer = (streamId, viewerData = {}) =>
  apiClient.post(`/live_room/${streamId}/add-viewer`, {
    user_id: viewerData.userId,
    username: viewerData.username,
    platform: viewerData.platform || 'web',
  }, { retry: true });

export const removeViewer = (streamId, userId) =>
  apiClient.post(`/live_room/${streamId}/remove-viewer`, { user_id: userId }, { retry: true });

export const getStreamViewers = (streamId) =>
  apiClient.get(`/live_room/${streamId}/viewers`, { cache: false, forceRefresh: true, retry: true });

// ==================== Moderation ====================

export const muteUser = (streamId, userId, moderatorId, reason, duration) =>
  apiClient.post(`/live_room/${streamId}/mute`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason,
    duration_minutes: duration || 5,
  }, { retry: true });

export const unmuteUser = (streamId, userId) =>
  apiClient.post(`/live_room/${streamId}/unmute`, { user_id: userId }, { retry: true });

export const banUser = (streamId, userId, moderatorId, reason, type) =>
  apiClient.post(`/live_room/${streamId}/ban`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason,
    ban_type: type || 'temporary',
  }, { retry: true });

export const unbanUser = (streamId, userId) =>
  apiClient.post(`/live_room/${streamId}/unban`, { user_id: userId }, { retry: true });

// ==================== Camera Management ====================

export const updateCameraState = (streamId, cameraData = {}) =>
  apiClient.post(`/live_room/${streamId}/settings`, {
    camera_enabled: cameraData.cameraEnabled,
    microphone_enabled: cameraData.microphoneEnabled,
    video_bitrate: cameraData.videoBitrate,
    audio_bitrate: cameraData.audioBitrate,
  }, { retry: true });

export const closeCameraStream = (streamId) =>
  apiClient.post(`/live_room/${streamId}/settings`, { camera_enabled: false }, { retry: true });

export const toggleCamera = async (streamId, enabled) => {
  return updateCameraState(streamId, {
    cameraEnabled: enabled,
  });
};

export const toggleMicrophone = async (streamId, enabled) => {
  return updateCameraState(streamId, {
    microphoneEnabled: enabled,
  });
};

// ==================== Statistics ====================

// ✅ FIX: تعطيل إعادة المحاولة (retry) لتجنب إغراق الكونسول بـ 403 عند عدم صلاحية المشاهد
export const getStreamStats = (streamId) =>
  apiClient.get(`/live_room/${streamId}/analytics`, { cache: false, forceRefresh: true, retry: false });

export const getLiveStreamAnalytics = (streamId) =>
  apiClient.get(`/live_room/${streamId}/analytics`, { cache: false, forceRefresh: true, retry: false });

// ==================== Comments & Gifts ====================

export const sendLiveComment = (streamId, commentData = {}) =>
  apiClient.post(`/live_room/${streamId}/comment`, {
    text: commentData.text || '',
  }, { retry: true });

export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true, retry: true });

export const sendLiveGift = (streamId, giftData = {}) =>
  apiClient.post(`/live_room/${streamId}/gift`, {
    gift_id: giftData.gift_id || giftData.giftId,
    name: giftData.name,
    price: giftData.price,
  });

export const sendLiveHeart = async (streamId) => {
  // ✅ FIX: إرسال القلب عبر Socket مع التوكين والتوقيع
  socketManager.emit('send_heart', { room_id: streamId }, { queue: false });
  return { data: { status: 'queued', room_id: streamId } };
};

// ==================== Recording ====================

export const startRecording = (streamId) =>
  apiClient.post(`/live_room/${streamId}/recording/start`, {}, { retry: true });

export const stopRecording = (streamId) =>
  apiClient.post(`/live_room/${streamId}/recording/stop`, {}, { retry: true });

export const recordLiveStream = (streamId, recordingData = {}) => {
  const action = recordingData.action || 'start';
  return apiClient.post(`/live_room/${streamId}/recording/${action}`, {}, { retry: true });
};

// ==================== Multi-Host ====================

export const addCoHost = (streamId, coHostData = {}) =>
  apiClient.post(`/live_room/${streamId}/multi-host`, {
    action: 'add',
    username: coHostData.username || coHostData.coHostId,
  }, { retry: true });

export const removeCoHost = (streamId, coHostId) =>
  apiClient.post(`/live_room/${streamId}/multi-host`, {
    action: 'remove',
    username: coHostId,
  }, { retry: true });

// ✅ FIX: إضافة دوال للانضمام والمغادرة من غرفة البث
export const joinLiveRoom = (streamId, role = 'viewer') => {
  // يتم الانضمام عبر Socket في الصفحات
  return Promise.resolve({ data: { status: 'joined', room_id: streamId, role } });
};

export const leaveLiveRoom = (streamId) => {
  // يتم المغادرة عبر Socket في الصفحات
  return Promise.resolve({ data: { status: 'left', room_id: streamId } });
};

// ==================== Stream List ====================

export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true, retry: true });

export const getActiveStreams = (limit = 50) =>
  apiClient.get('/live_rooms', { params: { limit }, cache: false, forceRefresh: true, retry: true });

// ==================== Helper Functions ====================

/**
 * تطبيق إجراء اعتدال على مستخدم
 */
export const applyModerationAction = async (streamId, actionData = {}) => {
  const { action, userId, moderatorId, reason, duration } = actionData;
  switch (action) {
    case 'mute':
      return muteUser(streamId, userId, moderatorId, reason, duration || 5);
    case 'unmute':
      return unmuteUser(streamId, userId);
    case 'ban':
      return banUser(streamId, userId, moderatorId, reason, duration || 'temporary');
    case 'unban':
      return unbanUser(streamId, userId);
    case 'close_camera':
      return closeCameraStream(streamId);
    case 'kick':
      return removeViewer(streamId, userId);
    default:
      throw new Error(`Unknown moderation action: ${action}`);
  }
};

/**
 * الحصول على حالة المستخدم في البث
 */
export const getUserStreamStatus = async (streamId, userId) => {
  try {
    const viewers = await getStreamViewers(streamId);
    const viewer = viewers?.data?.find(v => v.user_id === userId);
    return {
      is_banned: viewer?.is_banned || false,
      is_muted: viewer?.is_muted || false,
      is_active: viewer?.is_active !== false,
    };
  } catch (error) {
    console.error('Error getting user stream status:', error);
    return {
      is_banned: false,
      is_muted: false,
      is_active: true,
    };
  }
};

/**
 * تحديث إحصائيات البث
 */
export const updateStreamStats = async (streamId) => {
  try {
    const stats = await getStreamStats(streamId);
    return stats?.data || {};
  } catch (error) {
    console.error('Error updating stream stats:', error);
    return {};
  }
};

// ✅ FIX: إضافة دالة للتحقق من حالة الاتصال بالبث
export const checkStreamConnection = async (streamId) => {
  try {
    const response = await getLiveStreamDetails(streamId);
    return {
      connected: response?.data?.is_active === true,
      data: response?.data || {},
    };
  } catch (error) {
    console.error('Error checking stream connection:', error);
    return { connected: false, data: {} };
  }
};

export default {
  createLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveStreamDetails,
  addViewer,
  removeViewer,
  getStreamViewers,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  updateCameraState,
  closeCameraStream,
  toggleCamera,
  toggleMicrophone,
  getStreamStats,
  getLiveStreamAnalytics,
  sendLiveComment,
  getLive_comments: getLiveComments,
  sendLiveGift,
  sendLiveHeart,
  startRecording,
  stopRecording,
  recordLiveStream,
  addCoHost,
  removeCoHost,
  getActiveLiveStreams,
  getActiveStreams,
  applyModerationAction,
  getUserStreamStatus,
  updateStreamStats,
  joinLiveRoom,
  leaveLiveRoom,
  checkStreamConnection,
};
