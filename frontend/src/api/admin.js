import API from './axios.js';

export const getAdminOverview = () => API.get('/admin/overview', { cache: true, cacheTtlMs: 15_000 });
// 📊 إحصائيات حية للوحة المدير العام (AdminDashboard.jsx) — أرقام حقيقية من DB
export const getAdminDashboardLive = () => API.get('/admin/dashboard/live', { cache: true, cacheTtlMs: 12_000 });
export const searchAdmin = (q) => API.get('/admin/search', { params: { q } });
export const getAdminUsers = (params) => API.get('/admin/users', { params });
export const getAdminUser = (userId) => API.get(`/admin/users/${userId}`, { cache: false, forceRefresh: true });
export const createAdminUser = (data) => API.post('/admin/users', data);
export const getAdminBanHistory = (limit = 30) => API.get('/admin/users/ban-history', { params: { limit }, cache: true, cacheTtlMs: 10_000 });
export const updateAdminUser = (userId, data) => API.patch(`/admin/users/${userId}`, data);
export const banAdminUser = (userId, restore = false) => API.post(`/admin/users/${userId}/ban`, null, { params: { restore } });
export const toggleAdminShadowBan = (userId, enabled = true) => API.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });
export const deleteAdminUser = (userId) => API.delete(`/admin/users/${userId}`);
export const getAdminPosts = (params) => API.get('/admin/posts', { params });
export const createAdminPost = (data) => API.post('/admin/posts', data);
export const updateAdminPost = (postId, data) => API.put(`/admin/posts/${postId}`, data);
export const deleteAdminPost = (postId) => API.delete(`/admin/posts/${postId}`);
export const bulkDeleteAdminPosts = (ids) => API.post('/admin/posts/bulk-delete', { ids });
export const getAdminRbac = () => API.get('/admin/rbac', { cache: true, cacheTtlMs: 30_000 });
export const getAdminNotifications = (limit = 40) => API.get('/admin/notifications', { params: { limit }, cache: true, cacheTtlMs: 10_000 });
export const markAdminNotificationRead = (notificationId) => API.post(`/admin/notifications/${notificationId}/read`);
export const broadcastAdminNotification = (data) => API.post('/admin/notifications/broadcast', data);
// ⛔ تم حذف جميع دوال إدارة غرف البث (live_room) — نظام البث ملغى نهائياً.
// إذا احتاجت أي مكوّنة قديمة لهذه الدوال ترجع بمصفوفات/كائنات فارغة تجنّباً للأخطاء.
export const getAdminLiveOverview = () => Promise.resolve({ data: { rooms: [], total: 0 } });
export const featureAdminLiveRoom = () => Promise.resolve({ data: { ok: true } });
export const pinLatestAdminLiveComment = () => Promise.resolve({ data: { ok: true } });
export const endAdminLiveRoom = () => Promise.resolve({ data: { ok: true } });
export const getAdminReportsSummary = () => API.get('/admin/reports/summary', { cache: true, cacheTtlMs: 20_000 });
export const exportAdminReport = (format) => API.get('/admin/reports/export', { params: { format }, responseType: 'blob' });
export const getAdminSettings = () => API.get('/admin/settings', { cache: true, cacheTtlMs: 30_000 });
export const updateAdminSettings = (data) => API.put('/admin/settings', data);
export const changeAdminPassword = (data) => API.post('/admin/settings/change-password', data);
export const moderatePostAI = (postId) => API.post(`/admin/posts/${postId}/moderate-ai`);
export const bulkUpdatePostStatus = (ids, status) => API.post('/admin/posts/bulk-update-status', { ids, status });
export const toggleShadowBan = (userId, enabled = true) => API.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });

// ============================================================
// v88.44 — Comment Management (Admin Panel)
// ============================================================
// GET    /admin/comments                → قائمة كل التعليقات (مع فلاتر)
// GET    /admin/posts/{postId}/comments → تعليقات منشور محدد
// DELETE /admin/comments/{commentId}    → حذف تعليق (مع ردوده)
// POST   /admin/comments/{commentId}/hide → إخفاء/إظهار تعليق
export const getAdminComments = (params) => API.get('/admin/comments', { params });
export const getAdminPostComments = (postId, params) => API.get(`/admin/posts/${postId}/comments`, { params });
export const deleteAdminComment = (commentId) => API.delete(`/admin/comments/${commentId}`);
export const toggleHideAdminComment = (commentId, hidden = true) => API.post(`/admin/comments/${commentId}/hide`, { hidden });

// ============================================================
// v88.44 — Reports Management (actual reports from Report system)
// ============================================================
// GET  /admin/reports                → قائمة البلاغات الفعلية (مع فلاتر)
// GET  /admin/reports/{reportId}/details → تفاصيل بلاغ + تاريخ الأحداث
// POST /admin/reports/{reportId}/action   → اتخاذ إجراء على بلاغ
// PATCH /api/reports/admin/{id}  → تحديث الحالة (legacy endpoint)
// POST  /api/reports/admin/{id}/action  → تنفيذ إجراء (legacy endpoint)
export const getAdminReports = (params) => API.get('/admin/reports', { params });
export const getAdminReportDetails = (reportId) => API.get(`/admin/reports/${reportId}/details`, { cache: false, forceRefresh: true });
export const takeReportAction = (reportId, action, notes = null, durationHours = null) =>
  API.post(`/admin/reports/${reportId}/action`, { action, notes, duration_hours: durationHours });
export const updateReportStatus = (reportId, status) => API.patch(`/reports/admin/${reportId}`, { status });
export const escalateReport = (reportId) => API.post(`/reports/admin/${reportId}/action`, { action: 'escalate' });

// ============================================================
// v88.45 — Reels Management (Admin Panel)
// ============================================================
// GET    /admin/reels                       → قائمة الريلز (مع فلاتر)
// GET    /admin/reels/{reelId}              → تفاصيل ريل
// DELETE /admin/reels/{reelId}?hard=false   → حذف/إخفاء ريل
// POST   /admin/reels/{reelId}/restore      → استعادة ريل محذوف
// GET    /admin/reels/{reelId}/comments     → تعليقات ريل (شامل المخفية)
// DELETE /admin/reels/comments/{cid}        → حذف تعليق ريل
// POST   /admin/reels/comments/{cid}/hide   → إخفاء/إظهار تعليق ريل
// GET    /admin/reels/{reelId}/reports      → بلاغات ريل معيّن
export const getAdminReels = (params) => API.get('/admin/reels', { params, cache: false, forceRefresh: true });
export const getAdminReelDetail = (reelId) => API.get(`/admin/reels/${reelId}`, { cache: false, forceRefresh: true });
export const deleteAdminReel = (reelId, hard = false) => API.delete(`/admin/reels/${reelId}`, { params: { hard } });
export const restoreAdminReel = (reelId) => API.post(`/admin/reels/${reelId}/restore`);
export const getAdminReelComments = (reelId, params) => API.get(`/admin/reels/${reelId}/comments`, { params, cache: false, forceRefresh: true });
export const deleteAdminReelComment = (commentId) => API.delete(`/admin/reels/comments/${commentId}`);
export const toggleHideAdminReelComment = (commentId, hidden = true) => API.post(`/admin/reels/comments/${commentId}/hide`, { hidden });
export const getAdminReelReports = (reelId, params) => API.get(`/admin/reels/${reelId}/reports`, { params, cache: false, forceRefresh: true });

// ============================================================
// v88.46 — Admin Chat & Group Super-Control API (Stage 2)
// ============================================================
// GET    /admin/chat/threads                             → قائمة المحادثات
// GET    /admin/chat/threads/{tid}/messages              → رسائل محادثة
// POST   /admin/chat/messages/{mid}/delete               → حذف رسالة شات
// POST   /admin/chat/users/{uid}/mute                    → كتم مستخدم عن الشات
// POST   /admin/chat/users/{uid}/ban                     → حظر كامل
// POST   /admin/chat/scan-nsfw                           → فحص NSFW
// GET    /admin/groups                                   → قائمة المجموعات (شامل المُجمَّدة)
// POST   /admin/groups/{gid}/freeze                      → تجميد/فك تجميد
// DELETE /admin/groups/{gid}                             → حذف مجموعة
// GET    /admin/groups/{gid}/messages                    → رسائل مجموعة
// POST   /admin/groups/{gid}/messages/{mid}/delete       → حذف رسالة مجموعة
// POST   /admin/groups/{gid}/members/mute                → كتم/فك كتم عضو
// DELETE /admin/groups/{gid}/members/{username}          → طرد عضو

export const getAdminChatThreads = (params) =>
  API.get('/admin/chat/threads', { params, cache: false, forceRefresh: true });
export const getAdminChatThreadMessages = (threadId, params) =>
  API.get(`/admin/chat/threads/${encodeURIComponent(threadId)}/messages`, { params, cache: false, forceRefresh: true });
export const deleteAdminChatMessage = (messageId, reason = '') =>
  API.post(`/admin/chat/messages/${messageId}/delete`, { reason });
export const restoreAdminChatMessage = (messageId, reason = '') =>
  API.post(`/admin/chat/messages/${messageId}/restore`, { reason });
export const muteAdminChatUser = (userId, { muted = true, duration_minutes = null, reason = '' } = {}) =>
  API.post(`/admin/chat/users/${userId}/mute`, { muted, duration_minutes, reason });
export const banAdminChatUser = (userId, reason = '') =>
  API.post(`/admin/chat/users/${userId}/ban`, { reason });
export const scanAdminChatNsfw = (payload) =>
  API.post('/admin/chat/scan-nsfw', payload);
export const scanAdminContent = (payload) =>
  API.post('/admin/content/scan', payload);

export const getAdminGroups = (params) =>
  API.get('/admin/groups', { params, cache: false, forceRefresh: true });
export const freezeAdminGroup = (groupId, frozen = true, reason = '') =>
  API.post(`/admin/groups/${encodeURIComponent(groupId)}/freeze`, { frozen, reason });
export const deleteAdminGroup = (groupId, reason = '') =>
  API.delete(`/admin/groups/${encodeURIComponent(groupId)}`, { params: { reason } });
export const getAdminGroupMessages = (groupId, params) =>
  API.get(`/admin/groups/${encodeURIComponent(groupId)}/messages`, { params, cache: false, forceRefresh: true });
export const deleteAdminGroupMessage = (groupId, messageId, reason = '') =>
  API.post(`/admin/groups/${encodeURIComponent(groupId)}/messages/${encodeURIComponent(messageId)}/delete`, { reason });
export const muteAdminGroupMember = (groupId, username, { muted = true, reason = '' } = {}) =>
  API.post(`/admin/groups/${encodeURIComponent(groupId)}/members/mute`, { username, muted, reason });
export const removeAdminGroupMember = (groupId, username, reason = '') =>
  API.delete(`/admin/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(username)}`, { params: { reason } });
