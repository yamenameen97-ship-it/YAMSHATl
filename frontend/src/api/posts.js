import API from './axios.js';

export const getPosts = () => API.get('/posts');
export const createPost = (data) => API.post('/posts', data);

export const uploadPostMedia = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const addComment = (postId, text) => API.post(`/posts/${postId}/comment`, { text });
export const getComments = (postId) => API.get(`/posts/${postId}/comments`);
