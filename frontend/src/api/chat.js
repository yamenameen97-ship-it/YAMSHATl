import API from './axios.js';

export const getMessages = (receiver, limit = 40, before_id) =>
  API.get('/messages', { params: { receiver, limit, before_id } });

export const sendMessageApi = (payload) => API.post('/send_message', payload);
export const markMessagesSeen = (sender) => API.post('/message_seen', { sender });
export const getChatThreads = () => API.get('/chat_threads');
export const getPresence = (username) => API.get(`/presence/${encodeURIComponent(username)}`);
export const updateOnline = (online) => API.post('/update_online', { online });
export const uploadMedia = (formData, onUploadProgress) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
export const deleteMessageApi = (message_id) => API.post('/delete_message', { message_id });
