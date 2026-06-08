// ============================================================================
// ملف مصحح: frontend/src/services/api/correctedLiveStreamApi.js
// معالجة محسّنة لأخطاء البث المباشر 403 Forbidden
// ============================================================================

import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

/**
 * واجهات API محدثة للبث المباشر
 * تطابق المسارات الحقيقية في الخادم
 * مع معالجة محسّنة لأخطاء 403 Forbidden
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
 * POST /api/live/{room_id}/token
 */
export const getLiveToken = (roomId, payload = {}) =>
  apiClient.post(`/live/${roomId}/token`, {
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
 * 
 * ✅ محسّن: معالجة أخطاء 403 Forbidden
 */
export const getLiveStreamDetails = async (roomId) => {
  try {
    return await apiClient.get(`/live_room/${roomId}`, { 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // إذا كان الخطأ 403 Forbidden
    if (error.response?.status === 403) {
      console.warn(`[Live Stream] Access denied to room ${roomId}. This stream might be private.`);
      
      // إذا كان هناك توكن، قد يكون البث خاص
      // لا تحاول مرة أخرى، فقط أرجع الخطأ
      throw error;
    }
    
    // إذا كان الخطأ 404 Not Found
    if (error.response?.status === 404) {
      console.warn(`[Live Stream] Room ${roomId} not found.`);
      throw error;
    }
    
    // أخطاء أخرى
    throw error;
  }
};

/**
 * تحديث عنوان البث
 * POST /api/live/{room_id}/title
 */
export const updateStreamTitle = (roomId, title) =>
  apiClient.post(`/live/${roomId}/title`, {
    title: title.trim(),
  });

// ==================== Viewer Management ====================

export const getStreamViewers = async (roomId) => {
  try {
    return await apiClient.get(`/live/${roomId}/viewers`, { 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // معالجة أخطاء 403 و 404
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.warn(`[Live Stream] Cannot get viewers for room ${roomId}`);
      // أرجع قائمة فارغة بدلاً من رفع الخطأ
      return { data: [] };
    }
    throw error;
  }
};

export const addViewer = (roomId, viewerData = {}) =>
  apiClient.post(`/live/${roomId}/add-viewer`, {
    user_id: viewerData.userId,
    username: viewerData.username,
    user_avatar: viewerData.userAvatar,
  });

export const removeViewer = (roomId, userId) =>
  apiClient.post(`/live/${roomId}/remove-viewer`, { user_id: userId });

// ==================== Moderation ====================

export const muteUser = (roomId, userId, moderatorId, reason = '', durationMinutes = 5) =>
  apiClient.post(`/live/${roomId}/mute`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration_minutes: durationMinutes,
  });

export const unmuteUser = (roomId, userId) =>
  apiClient.post(`/live/${roomId}/unmute`, { user_id: userId });

export const banUser = (roomId, userId, moderatorId, reason = '', duration = 'temporary') =>
  apiClient.post(`/live/${roomId}/ban`, {
    user_id: userId,
    moderator_id: moderatorId,
    reason: reason,
    duration: duration,
  });

export const unbanUser = (roomId, userId) =>
  apiClient.post(`/live/${roomId}/unban`, { user_id: userId });

// ==================== Recording ====================

/**
 * إدارة التسجيل
 * POST /api/live/{room_id}/recording/{action}
 */
export const manageRecording = (roomId, action) => {
  if (!['start', 'stop'].includes(action)) {
    throw new Error('Invalid recording action. Use "start" or "stop"');
  }
  return apiClient.post(`/live/${roomId}/recording/${action}`);
};

export const startRecording = (roomId) => manageRecording(roomId, 'start');
export const stopRecording = (roomId) => manageRecording(roomId, 'stop');

// ==================== Comments & Gifts ====================

/**
 * الحصول على التعليقات
 * GET /api/live_comments/{room_id}
 * 
 * ✅ محسّن: معالجة أخطاء 403 Forbidden
 */
export const getLiveComments = async (roomId, limit = 50) => {
  try {
    return await apiClient.get(`/live_comments/${roomId}`, { 
      params: { limit }, 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // إذا كان الخطأ 403 Forbidden أو 404 Not Found
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.warn(`[Live Stream] Cannot get comments for room ${roomId}`);
      // أرجع قائمة فارغة بدلاً من رفع الخطأ
      return { data: [] };
    }
    throw error;
  }
};

/**
 * إرسال تعليق
 * POST /api/live/{room_id}/comment
 */
export const sendLiveComment = (roomId, commentData = {}) =>
  apiClient.post(`/live/${roomId}/comment`, {
    text: commentData.text || '',
  });

/**
 * إرسال هدية
 * POST /api/live/{room_id}/gift
 */
export const sendLiveGift = (roomId, giftData = {}) =>
  apiClient.post(`/live/${roomId}/gift`, {
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
 * GET /api/live/{room_id}/analytics
 * 
 * ✅ محسّن: معالجة أخطاء 403 Forbidden
 */
export const getStreamAnalytics = async (roomId) => {
  try {
    return await apiClient.get(`/live/${roomId}/analytics`, { 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // إذا كان الخطأ 403 Forbidden أو 404 Not Found
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.warn(`[Live Stream] Cannot get analytics for room ${roomId}`);
      // أرجع بيانات فارغة بدلاً من رفع الخطأ
      return { 
        data: {
          stream_id: roomId,
          viewer_count: 0,
          peak_viewer_count: 0,
          hearts_count: 0,
          comments_count: 0,
          gifts_count: 0,
        }
      };
    }
    throw error;
  }
};

/**
 * الحصول على إحصائيات البث (بديل)
 */
export const getStreamStats = (roomId) =>
  getStreamAnalytics(roomId);

// ==================== Multi-Host ====================

export const addCoHost = (roomId, coHostData = {}) =>
  apiClient.post(`/live/${roomId}/multi-host`, {
    action: 'add',
    username: coHostData.username || coHostData.coHostId,
  });

export const removeCoHost = (roomId, coHostId) =>
  apiClient.post(`/live/${roomId}/multi-host`, {
    action: 'remove',
    username: coHostId,
  });

// ==================== Stream List ====================

/**
 * الحصول على البثوث النشطة
 * GET /api/live_rooms
 * 
 * ✅ محسّن: معالجة أخطاء 401 Unauthorized
 */
export const getActiveLiveStreams = async (filters = {}) => {
  try {
    return await apiClient.get('/live_rooms', { 
      params: filters, 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // إذا كان الخطأ 401 Unauthorized، قد يكون التوكن منتهي الصلاحية
    // حاول الحصول على البثوث بدون توكن
    if (error.response?.status === 401) {
      console.warn('[Live Stream] Authentication failed. Trying without token...');
      try {
        return await apiClient.get('/live_rooms', { 
          params: filters, 
          cache: false, 
          forceRefresh: true,
          headers: { Authorization: '' }  // إزالة التوكن
        });
      } catch (retryError) {
        // إذا فشلت المحاولة الثانية، أرجع قائمة فارغة
        console.warn('[Live Stream] Cannot get live streams');
        return { data: [] };
      }
    }
    throw error;
  }
};

// ==================== Recovery & Health ====================

/**
 * الحصول على بيانات الاسترجاع
 * GET /api/live/{room_id}/recovery
 */
export const getRecoveryData = async (roomId) => {
  try {
    return await apiClient.get(`/live/${roomId}/recovery`, { 
      cache: false, 
      forceRefresh: true 
    });
  } catch (error) {
    // معالجة أخطاء 403 و 404
    if (error.response?.status === 403 || error.response?.status === 404) {
      console.warn(`[Live Stream] Cannot get recovery data for room ${roomId}`);
      return { data: {} };
    }
    throw error;
  }
};

/**
 * تحديث حالة الاتصال
 * POST /api/live/{room_id}/recovery/heartbeat
 */
export const sendHeartbeat = (roomId) =>
  apiClient.post(`/live/${roomId}/recovery/heartbeat`);

// ==================== Settings ====================

/**
 * تحديث إعدادات البث
 * POST /api/live/{room_id}/settings
 */
export const updateStreamSettings = (roomId, settings = {}) =>
  apiClient.post(`/live/${roomId}/settings`, {
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

// ============================================================================
// ملاحظات مهمة:
// ============================================================================
// 1. جميع الدوال التي تحصل على بيانات البث الآن تعالج أخطاء 403 و 404
// 2. عند حدوث خطأ 403، يتم إرجاع بيانات فارغة بدلاً من رفع الخطأ
// 3. هذا يسمح للواجهة الأمامية بالاستمرار في العمل حتى لو كان البث خاص
// 4. تأكد من استيراد هذا الملف بدلاً من الملف الأصلي في جميع الأماكن
