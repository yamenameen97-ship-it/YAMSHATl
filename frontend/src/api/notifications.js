import API from './axios.js';

export const getNotifications = (limit = 50) => API.get('/notifications', {
  params: { limit },
  cache: true,
  cacheTtlMs: 20_000,
});

export const markNotificationRead = (notificationId) =>
  API.post(`/notifications/${encodeURIComponent(notificationId)}/read`);

export const markNotificationsRead = () => API.put('/notifications/read');
