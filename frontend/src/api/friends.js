// واجهة برمجة الأصدقاء - نظام طلبات الصداقة الكامل.
// يبقى نظام Follow القديم متاحاً عبر api/users.js كما هو.

import API from './axios.js';

const noCache = { cache: false, forceRefresh: true };

/** قائمة الأصدقاء المقبولين. */
export const getFriends = (params = {}) =>
  API.get('/friends', {
    params: { limit: 50, page: 1, ...params },
    ...noCache,
  });

/** الطلبات الواردة (تحتاج تأكيد/حذف). */
export const getReceivedRequests = () => API.get('/friends/requests/received', noCache);

/** الطلبات المرسلة (يمكن إلغاؤها). */
export const getSentRequests = () => API.get('/friends/requests/sent', noCache);

/** اقتراحات: أشخاص قد تعرفهم. */
export const getFriendSuggestions = (limit = 20) =>
  API.get('/friends/suggestions', { params: { limit }, ...noCache });

/** بحث عن مستخدمين بالاسم. */
export const searchFriendsCandidates = (q, limit = 30) =>
  API.get('/friends/search', { params: { q, limit }, ...noCache });

/** إرسال طلب صداقة (بالـ username أو user_id). */
export const sendFriendRequest = (target) =>
  API.post('/friends/request', typeof target === 'string' ? { username: target } : target);

/** قبول طلب صداقة وارد. */
export const acceptFriendRequest = (friendshipId) =>
  API.post(`/friends/${friendshipId}/accept`);

/** رفض/إلغاء/إزالة صداقة (نفس الإجراء على الخادم). */
export const removeFriendship = (friendshipId) =>
  API.delete(`/friends/${friendshipId}`);

/** إخفاء مستخدم من الاقتراحات. */
export const dismissSuggestion = (target) =>
  API.post('/friends/dismiss', typeof target === 'string' ? { username: target } : target);

/** فحص حالة الصداقة مع مستخدم معيّن. */
export const getRelationshipWith = (username) =>
  API.get(`/friends/relationship/${encodeURIComponent(username)}`, noCache);

/** إحصائيات الأصدقاء (إجمالي/واردة/مرسلة) لاستخدامها في الأعلى أو الـ badges. */
export const getFriendsStats = () => API.get('/friends/stats', noCache);
