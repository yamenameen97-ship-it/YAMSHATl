import apiClient from './api/apiClient';

export const chatApi = {
  conversations: () => apiClient.get('/api/chat/conversations'),
  messages: (chatId) =>
    apiClient.get(`/api/chat/${chatId}/messages`),
  sendMessage: (chatId, payload) =>
    apiClient.post(`/api/chat/${chatId}/messages`, payload),
  typing: (chatId) =>
    apiClient.post(`/api/chat/${chatId}/typing`, {}),
  read: (chatId, messageId) =>
    apiClient.post(`/api/chat/${chatId}/read`, {
      messageId,
    }),
};

export default chatApi;