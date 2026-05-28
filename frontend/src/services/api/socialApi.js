import apiClient from './api/apiClient';

export const socialApi = {
  feed: () => apiClient.get('/api/feed'),
  stories: () => apiClient.get('/api/stories'),
  follow: (userId) =>
    apiClient.post(`/api/users/${userId}/follow`, {}),
  unfollow: (userId) =>
    apiClient.post(`/api/users/${userId}/unfollow`, {}),
  react: (postId, reaction) =>
    apiClient.post(`/api/posts/${postId}/react`, {
      reaction,
    }),
  savePost: (postId) =>
    apiClient.post(`/api/posts/${postId}/save`, {}),
};

export default socialApi;