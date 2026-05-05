import API from './axios.js';

export const getNotifications = () => API.get('/notifications');
export const markNotificationsRead = () => API.put('/notifications/read');
