import API from './axios.js';

export const getUsers = async (params = {}) => {
  const normalizedParams = {
    limit: Math.max(Number(params?.limit) || 60, 1),
    page: Math.max(Number(params?.page) || 1, 1),
    ...params,
  };

  try {
    return await API.get('/users', {
      params: normalizedParams,
      cache: false,
      forceRefresh: true,
    });
  } catch (error) {
    if (error?.response?.status !== 500) throw error;

    const meResponse = await API.get('/users/me', { cache: false, forceRefresh: true }).catch(() => null);
    const me = meResponse?.data;
    return {
      data: me ? [me] : [],
      fallback: true,
    };
  }
};
export const getMe = () => API.get('/users/me');
// v71 ROOT FIX: تفعيل smart cache مع TTL قصير (30 ثانية) بدلاً من تعطيل الكاش بالكامل.
// هذا يجعل التنقل بين الصفحات فورياً ويتجنب cold start المتكرر للخادم.
export const getProfileBundle = (username) => API.get(`/users/profile/${encodeURIComponent(username)}`, { cache: true, cacheTtlMs: 30_000 });
export const getUserSessions = () => API.get('/users/sessions', { cache: false, forceRefresh: true });
export const revokeUserSession = (sessionId) => API.delete(`/users/sessions/${encodeURIComponent(sessionId)}`);
export const getLoginActivity = (limit = 20) => API.get('/users/login-activity', { params: { limit }, cache: false, forceRefresh: true });
export const getUserPreferences = () => API.get('/users/preferences');
export const updateUserPreferences = (payload) => API.put('/users/preferences', payload);
export const getFollowersSummary = (username) => API.get(`/users/followers/${encodeURIComponent(username)}`);
export const getRelationship = (username) => API.get(`/users/relationship/${encodeURIComponent(username)}`);
export const followUser = (username) => API.post('/users/follow', { following: username });
export const getUserPosts = (username) => API.get(`/users/user_posts/${encodeURIComponent(username)}`);
export const updateMyProfile = (payload) => API.patch('/users/me', payload);
export const getSavedPosts = () => API.get('/users/me/saved-posts', { cache: false, forceRefresh: true });
export const getLikedPosts = () => API.get('/users/me/liked-posts', { cache: false, forceRefresh: true });
export const getBlockList = () => API.get('/users/me/block-list', { cache: false, forceRefresh: true });
export const getMutedUsers = () => API.get('/users/me/muted-users', { cache: false, forceRefresh: true });
export const muteUser = (username) => API.post('/users/mute', { username });
export const unmuteUser = (username) => API.post('/users/unmute', { username });
export const getCloseFriends = () => API.get('/users/me/close-friends', { cache: false, forceRefresh: true });
export const addCloseFriend = (username) => API.post('/users/close-friends', { username });
export const removeCloseFriend = (username) => API.delete(`/users/close-friends/${encodeURIComponent(username)}`);
export const uploadAvatar = (formData) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
