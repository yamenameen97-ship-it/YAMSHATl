import API from './axios.js';

export const getPosts = (params = {}) => API.get('/posts', { params });
export const getDraftPosts = () => API.get('/posts/drafts', { cache: false, forceRefresh: true });
export const createPost = (data) => API.post('/posts', data);
export const updatePost = (postId, data) => API.patch(`/posts/${postId}`, data);
export const getPostHistory = (postId) => API.get(`/posts/${postId}/history`, { cache: false, forceRefresh: true });

export const uploadPostMedia = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const savePost = (postId) => API.post(`/posts/${postId}/save`);
export const sharePost = (postId, platform = 'copy') => API.post(`/posts/${postId}/share`, { platform });
export const votePoll = (postId, optionKey) => API.post(`/posts/${postId}/poll-vote`, { option_key: optionKey });
export const addComment = (postId, text, parentId = null) => API.post(`/posts/${postId}/comment`, { text, parent_id: parentId });
export const getComments = (postId) => API.get(`/posts/${postId}/comments`);
export const getPostInsights = (postId) => API.get(`/posts/${postId}/insights`, { cache: false, forceRefresh: true });
export const getScheduledPosts = () => API.get('/posts/scheduled', { cache: false, forceRefresh: true });
export const getPostAnalytics = (postId) => API.get(`/posts/${postId}/analytics`, { cache: false, forceRefresh: true });
export const getRecommendedPosts = (params = {}) => API.get('/posts/recommended', { params });
export const deletePost = (postId) => API.delete(`/posts/${postId}`);
