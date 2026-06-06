import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

/**
 * واجهات API متقدمة للبث المباشر
 * تتضمن إدارة المشتركين والحظر والكتم والكاميرا
 */

// ==================== Stream Management ====================

export const createLiveStream = (streamData = {}) =>
  apiClient.post('/live/create', {
    title: streamData.title || '',
    description: streamData.description || '',
    category: streamData.category || 'أخرى',
    quality: streamData.quality || '720p',
    is_public: streamData.isPublic !== false,
    allow_comments: streamData.allowComments !== false,
    allow_gifts: streamData.allowGifts !== false,
    allow_recording: streamData.allowRecording || false,
  });

export const startLiveStream = (streamId, payload = {}) =>
  apiClient.post(`/live/${streamId}/start`, {
    quality: payload.quality || '720p',
    enable_recording: payload.enableRecording || false,
  });

export const endLiveStream = (streamId) =>
  apiClient.post(`/live/${streamId}/end`);

export const getLiveStreamDetails = (streamId) =>
  apiClient.get(`/live/${streamId}`, { cache: false, forceRefresh: true });

// ==================== Viewer Management ====================

export const addViewer = (streamId, viewerData = {}) =>
  apiClient.post(`/live/${streamId}/add-viewer`, {
    user_id: viewerData.userId,
    username: viewerData.username,
    user_avatar: viewerData.userAvatar,
  });

export const removeViewer = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/remove-viewer`, { user_id: userId });

export const getStreamViewers = (streamId) =>
  apiClient.get(`/live/${streamId}/viewers`, { cache: false, forceRefresh: true });

// ==================== Moderation - Mute ====================

export const muteUser = (streamId, userId, moderatorId, reason = '', durationMinutes = 5) =>
  apiClient.post(`/live/${streamId}/mute`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration_minutes: durationMinutes,
  });

export const unmuteUser = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/unmute`, { user_id: userId });

// ==================== Moderation - Ban ====================

export const banUser = (streamId, userId, moderatorId, reason = '', duration = 'temporary') =>
  apiClient.post(`/live/${streamId}/ban`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration: duration, // temporary, long_term, permanent
  });

export const unbanUser = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/unban`, { user_id: userId });

// ==================== Camera Management ====================

export const updateCameraState = (streamId, cameraData = {}) =>
  apiClient.put(`/live/${streamId}/camera`, {
    camera_enabled: cameraData.cameraEnabled,
    microphone_enabled: cameraData.microphoneEnabled,
    screen_share_enabled: cameraData.screenShareEnabled,
    video_bitrate: cameraData.videoBitrate,
    audio_bitrate: cameraData.audioBitrate,
  });

export const closeCameraStream = (streamId) =>
  apiClient.post(`/live/${streamId}/close-camera`);

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

export const getStreamStats = (streamId) =>
  apiClient.get(`/live/${streamId}/stats`, { cache: false, forceRefresh: true });

export const getLiveStreamAnalytics = (streamId) =>
  apiClient.get(`/live/${streamId}/stats`, { cache: false, forceRefresh: true });

// ==================== Comments & Gifts ====================

export const sendLiveComment = (streamId, commentData = {}) =>
  apiClient.post(`/live/${streamId}/comment`, {
    text: commentData.text || '',
  });

export const getLiveComments = (streamId, limit = 50) =>
  apiClient.get(`/live_comments/${streamId}`, { params: { limit }, cache: false, forceRefresh: true });

export const sendLiveGift = (streamId, giftData = {}) =>
  apiClient.post(`/live/${streamId}/gift`, {
    gift_id: giftData.giftId,
    name: giftData.name,
    price: giftData.price,
  });

export const sendLiveHeart = async (streamId) => {
  socketManager.emit('send_heart', { room_id: streamId }, { queue: false });
  return { data: { status: 'queued', room_id: streamId } };
};

// ==================== Recording ====================

export const startRecording = (streamId) =>
  apiClient.post(`/live/${streamId}/recording/start`);

export const stopRecording = (streamId) =>
  apiClient.post(`/live/${streamId}/recording/stop`);

export const recordLiveStream = (streamId, recordingData = {}) => {
  const action = recordingData.action || 'start';
  return apiClient.post(`/live/${streamId}/recording/${action}`);
};

// ==================== Multi-Host ====================

export const addCoHost = (streamId, coHostData = {}) =>
  apiClient.post(`/live/${streamId}/multi-host`, {
    action: 'add',
    username: coHostData.username || coHostData.coHostId,
  });

export const removeCoHost = (streamId, coHostId) =>
  apiClient.post(`/live/${streamId}/multi-host`, {
    action: 'remove',
    username: coHostId,
  });

// ==================== Stream List ====================

export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true });

export const getActiveStreams = (limit = 50) =>
  apiClient.get('/live', { params: { limit }, cache: false, forceRefresh: true });

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
  getLiveComments,
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
};
