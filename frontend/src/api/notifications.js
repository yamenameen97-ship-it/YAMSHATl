import API from './axios.js';

export const getNotifications = (limit = 50) => API.get('/notifications', {
  params: { limit },
  cache: true,
  cacheTtlMs: 20_000,
});

export const markNotificationRead = (notificationId) =>
  API.post(`/notifications/${encodeURIComponent(notificationId)}/read`);

// ✅ v83.5 FIX #2: كان التوقيع `markNotificationsRead()` بلا معاملات، لكن
// `pages/notifications/NotificationsPage.jsx` يستدعيها بـ `markNotificationsRead(unreadIds)`
// حيث `unreadIds` مصفوفة معرّفات. النتيجة السابقة: المصفوفة تُتجاهل صامتاً، وطلب
// PUT /notifications/read يصل بلا body → الخادم يمرّ بحلقة "علِّم كل الإشعارات"
// (بدلاً من IDs محدّدة) → في المستأجرين متعدّدي الأجهزة يحدث over-mark لإشعارات
// وصلت في نفس اللحظة على جهاز آخر ولم تُرَ بعد.
//
// الحل: قبول `notificationIds` اختيارية. إذا مُرِّرت → نرسلها في body و/أو
// كـ query param `ids`. إذا لم تُمرَّر → السلوك القديم "علِّم الكل".
export const markNotificationsRead = (notificationIds) => {
  const hasIds = Array.isArray(notificationIds) && notificationIds.length > 0;
  if (!hasIds) {
    return API.put('/notifications/read');
  }
  const ids = notificationIds
    .map((id) => (id === undefined || id === null ? '' : String(id)))
    .filter(Boolean);
  return API.put('/notifications/read', { ids }, {
    params: { ids: ids.join(',') },
  });
};
