import API from './axios.js';

export const getAdminOverview = () => API.get('/admin/overview', { cache: true, cacheTtlMs: 15_000 });
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
export const updateReportStatus = (reportId, status) => API.post(`/admin/reports/${reportId}/status`, { status });
export const escalateReport = (reportId) => API.post(`/admin/reports/${reportId}/escalate`);
