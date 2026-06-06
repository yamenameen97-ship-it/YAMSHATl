import apiClient from './apiClient.js';
import socketManager from '../socketManager.js';

const asResponse = (data) => ({ data });

/**
 * وظائف متقدمة للتحكم بالبث المباشر
 */

// ============================================
// وظائف التحكم الأساسية بالبث
// ============================================

/**
 * إنهاء البث المباشر
 */
export const endLiveStream = (streamId) =>
  apiClient.post(`/live/${streamId}/end`, {});

/**
 * إغلاق الكاميرا
 */
export const toggleCamera = (streamId, enabled) =>
  apiClient.post(`/live/${streamId}/camera`, { enabled });

/**
 * كتم الصوت
 */
export const toggleMicrophone = (streamId, enabled) =>
  apiClient.post(`/live/${streamId}/microphone`, { enabled });

// ============================================
// وظائف التسجيل
// ============================================

/**
 * بدء تسجيل البث
 */
export const startRecording = (streamId, options = {}) =>
  apiClient.post(`/live/${streamId}/recording/start`, {
    quality: options.quality || 'hd',
    format: options.format || 'mp4',
    ...options,
  });

/**
 * إيقاف تسجيل البث
 */
export const stopRecording = (streamId) =>
  apiClient.post(`/live/${streamId}/recording/stop`, {});

/**
 * الحصول على حالة التسجيل
 */
export const getRecordingStatus = (streamId) =>
  apiClient.get(`/live/${streamId}/recording/status`);

/**
 * الحصول على قائمة التسجيلات السابقة
 */
export const getRecordings = (streamId) =>
  apiClient.get(`/live/${streamId}/recordings`);

/**
 * حذف تسجيل
 */
export const deleteRecording = (streamId, recordingId) =>
  apiClient.delete(`/live/${streamId}/recordings/${recordingId}`);

// ============================================
// وظائف الفلاتر الاحترافية
// ============================================

/**
 * تطبيق فلتر على البث
 */
export const applyFilter = (streamId, filterId, options = {}) =>
  apiClient.post(`/live/${streamId}/filters/apply`, {
    filter_id: filterId,
    intensity: options.intensity || 1.0,
    ...options,
  });

/**
 * إزالة الفلتر الحالي
 */
export const removeFilter = (streamId) =>
  apiClient.post(`/live/${streamId}/filters/remove`, {});

/**
 * الحصول على قائمة الفلاتر المتاحة
 */
export const getAvailableFilters = () =>
  apiClient.get('/live/filters/available');

/**
 * إنشاء فلتر مخصص
 */
export const createCustomFilter = (filterData = {}) =>
  apiClient.post('/live/filters/custom', filterData);

// ============================================
// وظائف الإشراف والتحكم بالمشاركين
// ============================================

/**
 * كتم صوت مشترك
 */
export const muteParticipant = (streamId, userId, options = {}) =>
  apiClient.post(`/live/${streamId}/participants/${userId}/mute`, {
    duration: options.duration || null,
    reason: options.reason || '',
  });

/**
 * فتح صوت مشترك
 */
export const unmuteParticipant = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/participants/${userId}/unmute`, {});

/**
 * إخراج مشترك من البث
 */
export const kickParticipant = (streamId, userId, reason = '') =>
  apiClient.post(`/live/${streamId}/participants/${userId}/kick`, { reason });

/**
 * حظر مستخدم من البث
 */
export const banViewer = (streamId, userId, options = {}) =>
  apiClient.post(`/live/${streamId}/viewers/${userId}/ban`, {
    duration: options.duration || null,
    reason: options.reason || '',
    permanent: options.permanent || false,
  });

/**
 * إلغاء حظر مستخدم
 */
export const unbanViewer = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/viewers/${userId}/unban`, {});

/**
 * الحصول على قائمة المستخدمين المحظورين
 */
export const getBannedUsers = (streamId) =>
  apiClient.get(`/live/${streamId}/banned-users`);

// ============================================
// وظائف التحكم بالتعليقات
// ============================================

/**
 * كتم مشترك من التعليق
 */
export const muteCommentFromUser = (streamId, userId, options = {}) =>
  apiClient.post(`/live/${streamId}/comments/mute-user`, {
    user_id: userId,
    duration: options.duration || null,
    reason: options.reason || '',
  });

/**
 * فتح التعليقات للمشترك
 */
export const unmuteCommentFromUser = (streamId, userId) =>
  apiClient.post(`/live/${streamId}/comments/unmute-user`, { user_id: userId });

/**
 * حذف تعليق
 */
export const deleteComment = (streamId, commentId, reason = '') =>
  apiClient.delete(`/live/${streamId}/comments/${commentId}`, { data: { reason } });

/**
 * الموافقة على تعليق معلق
 */
export const approveComment = (streamId, commentId) =>
  apiClient.post(`/live/${streamId}/comments/${commentId}/approve`, {});

/**
 * رفض تعليق معلق
 */
export const rejectComment = (streamId, commentId, reason = '') =>
  apiClient.post(`/live/${streamId}/comments/${commentId}/reject`, { reason });

/**
 * الحصول على التعليقات المعلقة
 */
export const getPendingComments = (streamId) =>
  apiClient.get(`/live/${streamId}/comments/pending`);

/**
 * تفعيل/تعطيل الوضع البطيء (Slow Mode)
 */
export const toggleSlowMode = (streamId, enabled, interval = 5) =>
  apiClient.post(`/live/${streamId}/slow-mode`, {
    enabled,
    interval_seconds: interval,
  });

// ============================================
// وظائف الإحصائيات والتحليلات
// ============================================

/**
 * الحصول على إحصائيات البث المتقدمة
 */
export const getAdvancedStats = (streamId) =>
  apiClient.get(`/live/${streamId}/advanced-stats`);

/**
 * الحصول على معلومات جودة البث
 */
export const getStreamQuality = (streamId) =>
  apiClient.get(`/live/${streamId}/quality`);

/**
 * الحصول على معلومات المشاهدين
 */
export const getViewerAnalytics = (streamId) =>
  apiClient.get(`/live/${streamId}/viewers/analytics`);

/**
 * الحصول على معلومات الأداء
 */
export const getPerformanceMetrics = (streamId) =>
  apiClient.get(`/live/${streamId}/performance`);

// ============================================
// وظائف الإجراءات الفورية (Socket-based)
// ============================================

/**
 * تطبيق إجراء إشراف فوري عبر Socket
 */
export const applyModerationActionSocket = (streamId, action, data = {}) => {
  socketManager.emit('moderation_action', {
    room_id: streamId,
    action,
    ...data,
  }, { queue: false });
  return asResponse({ status: 'queued', action, ...data });
};

/**
 * إرسال إشعار للمشاركين
 */
export const sendNotificationToParticipants = (streamId, notification) => {
  socketManager.emit('broadcast_notification', {
    room_id: streamId,
    ...notification,
  }, { queue: false });
  return asResponse({ status: 'queued', ...notification });
};

// ============================================
// وظائف الترجمة الفورية
// ============================================

/**
 * ترجمة نص فوري
 */
export const translateText = (text, targetLanguage, sourceLanguage = 'auto') =>
  apiClient.post('/translate', {
    text,
    target_language: targetLanguage,
    source_language: sourceLanguage,
  });

/**
 * الحصول على اللغات المدعومة
 */
export const getSupportedLanguages = () =>
  apiClient.get('/languages');

/**
 * ترجمة رسالة في الدردشة
 */
export const translateMessage = (messageId, targetLanguage) =>
  apiClient.post(`/messages/${messageId}/translate`, {
    target_language: targetLanguage,
  });

// ============================================
// وظائف متقدمة أخرى
// ============================================

/**
 * تفعيل/تعطيل الوضع الآمن
 */
export const toggleSafeMode = (streamId, enabled) =>
  apiClient.post(`/live/${streamId}/safe-mode`, { enabled });

/**
 * الحصول على إعدادات البث
 */
export const getStreamSettings = (streamId) =>
  apiClient.get(`/live/${streamId}/settings`);

/**
 * تحديث إعدادات البث
 */
export const updateStreamSettings = (streamId, settings = {}) =>
  apiClient.put(`/live/${streamId}/settings`, settings);

/**
 * إنشاء نقطة تفتيش (Checkpoint) للبث
 */
export const createStreamCheckpoint = (streamId, name = '') =>
  apiClient.post(`/live/${streamId}/checkpoints`, { name });

/**
 * استعادة نقطة تفتيش
 */
export const restoreStreamCheckpoint = (streamId, checkpointId) =>
  apiClient.post(`/live/${streamId}/checkpoints/${checkpointId}/restore`, {});

export default {
  // التحكم الأساسي
  endLiveStream,
  toggleCamera,
  toggleMicrophone,
  
  // التسجيل
  startRecording,
  stopRecording,
  getRecordingStatus,
  getRecordings,
  deleteRecording,
  
  // الفلاتر
  applyFilter,
  removeFilter,
  getAvailableFilters,
  createCustomFilter,
  
  // الإشراف
  muteParticipant,
  unmuteParticipant,
  kickParticipant,
  banViewer,
  unbanViewer,
  getBannedUsers,
  
  // التعليقات
  muteCommentFromUser,
  unmuteCommentFromUser,
  deleteComment,
  approveComment,
  rejectComment,
  getPendingComments,
  toggleSlowMode,
  
  // الإحصائيات
  getAdvancedStats,
  getStreamQuality,
  getViewerAnalytics,
  getPerformanceMetrics,
  
  // Socket
  applyModerationActionSocket,
  sendNotificationToParticipants,
  
  // الترجمة
  translateText,
  getSupportedLanguages,
  translateMessage,
  
  // متقدم
  toggleSafeMode,
  getStreamSettings,
  updateStreamSettings,
  createStreamCheckpoint,
  restoreStreamCheckpoint,
};
