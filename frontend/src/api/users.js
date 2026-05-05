import API from './axios.js';

export const getUsers = () => API.get('/users');
export const getFollowersSummary = (username) => API.get(`/followers/${encodeURIComponent(username)}`);
export const getRelationship = (username) => API.get(`/relationship/${encodeURIComponent(username)}`);
export const followUser = (username) => API.post('/follow', { following: username });
export const getUserPosts = (username) => API.get(`/user_posts/${encodeURIComponent(username)}`);
export const updateMyProfile = (payload) => API.patch('/users/me', payload);
export const uploadAvatar = (formData) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
