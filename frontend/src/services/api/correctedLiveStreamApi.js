import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

/**
 * واجهات API محدثة للبث المباشر
 * تطابق المسارات الحقيقية في الخادم
 */

// ==================== Stream Management ====================

/**
 * إنشاء بث مباشر جديد
 * POST /api/create_live
 */
export const createLiveStream = (streamData = {}) =>
  apiClient.post('/create_live', {
    title: streamData.title || 'بث مباشر جديد',
    description: streamData.description || '',
    category: streamData.category || 'أخرى',
    quality: streamData.quality || '720p',
    is_public: streamData.isPublic !== false,
    allow_comments: streamData.allowComments !== false,
    allow_gifts: streamData.allowGifts !== false,
    allow_recording: streamData.allowRecording || false,
    gift_goal: streamData.giftGoal || 0,
    minimum_gift_amount: streamData.minimumGiftAmount || 0,
  });

/**
 * الحصول على توكن البث
 * POST /api/live_room/{room_id}/token
 */
export const getLiveToken = (roomId, payload = {}) =>
  apiClient.post(`/live_room/${roomId}/token`, {
    role: payload.role || 'host',
    quality: payload.quality || '720p',
    enable_recording: payload.enableRecording || false,
  });

/**
 * إنهاء البث المباشر
 * POST /api/end_live/{room_id}
 */
export const endLiveStream = (roomId) =>
  apiClient.post(`/end_live/${roomId}`);

/**
 * الحصول على تفاصيل البث
 * GET /api/live_room/{room_id}
 */
export const getLiveStreamDetails = (roomId) =>
  apiClient.get(`/live_room/${roomId}`, { cache: false, forceRefresh: true });

/**
 * تحديث عنوان البث
 * POST /api/live_room/{room_id}/title
 */
export const updateStreamTitle = (roomId, title) =>
  apiClient.post(`/live_room/${roomId}/title`, {
    title: title.trim(),
  });

// ==================== Viewer Management ====================

export const getStreamViewers = (roomId) =>
  apiClient.get(`/live_room/${roomId}/viewers`, { cache: false, forceRefresh: true });

export const addViewer = (roomId, viewerData = {}) =>
  apiClient.post(`/live_room/${roomId}/add-viewer`, {
    user_id: viewerData.userId,
    username: viewerData.username,
    user_avatar: viewerData.userAvatar,
  });

export const removeViewer = (roomId, userId) =>
  apiClient.post(`/live_room/${roomId}/remove-viewer`, { user_id: userId });

// ==================== Moderation ====================

export const muteUser = (roomId, userId, moderatorId, reason = '', durationMinutes = 5) =>
  apiClient.post(`/live_room/${roomId}/mute`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration_minutes: durationMinutes,
  });

export const unmuteUser = (roomId, userId) =>
  apiClient.post(`/live_room/${roomId}/unmute`, { user_id: userId });

export const banUser = (roomId, userId, moderatorId, reason = '', duration = 'temporary') =>
  apiClient.post(`/live_room/${roomId}/ban`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration: duration,
  });

export const unbanUser = (roomId, userId) =>
  apiClient.post(`/live_room/${roomId}/unban`, { user_id: userId });

// ==================== Recording ====================

/**
 * إدارة التسجيل
 * POST /api/live_room/{room_id}/recording/{action}
 */
export const manageRecording = (roomId, action) => {
  if (!['start', 'stop'].includes(action)) {
    throw new Error('Invalid recording action. Use "start" or "stop"');
  }
  return apiClient.post(`/live_room/${roomId}/recording/${action}`);
};

export const startRecording = (roomId) => manageRecording(roomId, 'start');
export const stopRecording = (roomId) => manageRecording(roomId, 'stop');

// ==================== Comments & Gifts ====================

/**
 * الحصول على التعليقات
 * GET /api/live_comments/{room_id}
 */
export const getLiveComments = (roomId, limit = 50) =>
  apiClient.get(`/live_comments/${roomId}`, { params: { limit }, cache: false, forceRefresh: true });

/**
 * إرسال تعليق
 * POST /api/live_room/{room_id}/comment
 */
export const sendLiveComment = (roomId, commentData = {}) =>
  apiClient.post(`/live_room/${roomId}/comment`, {
    text: commentData.text || '',
  });

/**
 * إرسال هدية
 * POST /api/live_room/{room_id}/gift
 */
export const sendLiveGift = (roomId, giftData = {}) =>
  apiClient.post(`/live_room/${roomId}/gift`, {
    gift_id: giftData.giftId || giftData.id,
    name: giftData.name,
    price: giftData.price,
  });

/**
 * إرسال قلب
 */
export const sendLiveHeart = async (roomId) => {
  socketManager.emit('send_heart', { room_id: roomId }, { queue: false });
  return { data: { status: 'queued', room_id: roomId } };
};

// ==================== Analytics ====================

/**
 * الحصول على إحصائيات البث
 * GET /api/live_room/{room_id}/analytics
 */
export const getStreamAnalytics = (roomId) =>
  apiClient.get(`/live_room/${roomId}/analytics`, { cache: false, forceRefresh: true });

/**
 * الحصول على إحصائيات البث (بديل)
 */
export const getStreamStats = (roomId) =>
  getStreamAnalytics(roomId);

// ==================== Multi-Host ====================

export const addCoHost = (roomId, coHostData = {}) =>
  apiClient.post(`/live_room/${roomId}/multi-host`, {
    action: 'add',
    username: coHostData.username || coHostData.coHostId,
  });

export const removeCoHost = (roomId, coHostId) =>
  apiClient.post(`/live_room/${roomId}/multi-host`, {
    action: 'remove',
    username: coHostId,
  });

// ==================== Stream List ====================

export const getActiveLiveStreams = (filters = {}) =>
  apiClient.get('/live_rooms', { params: filters, cache: false, forceRefresh: true });

// ==================== Recovery & Health ====================

/**
 * الحصول على بيانات الاسترجاع
 * GET /api/live_room/{room_id}/recovery
 */
export const getRecoveryData = (roomId) =>
  apiClient.get(`/live_room/${roomId}/recovery`, { cache: false, forceRefresh: true });

/**
 * تحديث حالة الاتصال
 * POST /api/live_room/{room_id}/recovery/heartbeat
 */
export const sendHeartbeat = (roomId) =>
  apiClient.post(`/live_room/${roomId}/recovery/heartbeat`);

// ==================== Settings ====================

/**
 * تحديث إعدادات البث
 * POST /api/live_room/{room_id}/settings
 */
export const updateStreamSettings = (roomId, settings = {}) =>
  apiClient.post(`/live_room/${roomId}/settings`, {
    is_public: settings.isPublic,
    allow_comments: settings.allowComments,
    allow_gifts: settings.allowGifts,
    require_comment_approval: settings.requireCommentApproval,
    chat_speed_limit: settings.chatSpeedLimit,
    minimum_gift_amount: settings.minimumGiftAmount,
    gift_goal: settings.giftGoal,
  });

// ==================== Helper Functions ====================

export const applyModerationAction = async (roomId, actionData = {}) => {
  const { action, userId, moderatorId, reason, duration } = actionData;

  switch (action) {
    case 'mute':
      return muteUser(roomId, userId, moderatorId, reason, duration || 5);
    case 'unmute':
      return unmuteUser(roomId, userId);
    case 'ban':
      return banUser(roomId, userId, moderatorId, reason, duration || 'temporary');
    case 'unban':
      return unbanUser(roomId, userId);
    case 'kick':
      return removeViewer(roomId, userId);
    default:
      throw new Error(`Unknown moderation action: ${action}`);
  }
};

export const getUserStreamStatus = async (roomId, userId) => {
  try {
    const viewers = await getStreamViewers(roomId);
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

export default {
  createLiveStream,
  getLiveToken,
  endLiveStream,
  getLiveStreamDetails,
  updateStreamTitle,
  getStreamViewers,
  addViewer,
  removeViewer,
  muteUser,
  unmuteUser,
  banUser,
  unbanUser,
  manageRecording,
  startRecording,
  stopRecording,
  getLiveComments,
  sendLiveComment,
  sendLiveGift,
  sendLiveHeart,
  getStreamAnalytics,
  getStreamStats,
  addCoHost,
  removeCoHost,
  getActiveLiveStreams,
  getRecoveryData,
  sendHeartbeat,
  updateStreamSettings,
  applyModerationAction,
  getUserStreamStatus,
};
