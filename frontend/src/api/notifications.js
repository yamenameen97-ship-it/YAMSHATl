import API from './axios.js';

export const getNotifications = () => API.get('/notifications', { cache: true, cacheTtlMs: 20_000 });
export const markNotificationsRead = () => API.put('/notifications/read');
