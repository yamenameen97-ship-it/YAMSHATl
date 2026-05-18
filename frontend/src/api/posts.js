import API from './axios.js';

function normalizePost(post = {}) {
  const mediaUrl = post.media_url || post.media || post.image_url || (Array.isArray(post.media_urls) ? post.media_urls[0] : '');
  return {
    ...post,
    media_url: mediaUrl || '',
    image_url: post.image_url || mediaUrl || '',
    media_urls: Array.isArray(post.media_urls) ? post.media_urls : mediaUrl ? [mediaUrl] : [],
    avatar: post.avatar || post.user_avatar || post.user_avatar_url || '',
    user_avatar: post.user_avatar || post.avatar || post.user_avatar_url || '',
    username: post.username || post.user?.username || post.author_username || post.author || '',
    likes_count: Number(post.likes_count ?? post.like_count ?? post.likes ?? 0),
    comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
    saved_count: Number(post.saved_count ?? post.save_count ?? 0),
    share_count: Number(post.share_count ?? post.shares ?? 0),
    is_liked: Boolean(post.is_liked ?? post.liked_by_me),
    is_saved: Boolean(post.is_saved ?? post.saved_by_me),
  };
}

export const getPosts = async (params = {}) => {
  const response = await API.get('/posts', { params });
  const payload = response?.data;
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.posts)
      ? payload.posts
      : Array.isArray(payload?.items)
        ? payload.items
        : [];
  return {
    ...response,
    data: rawItems.map(normalizePost),
    meta: payload && !Array.isArray(payload) ? payload : {},
  };
};
export const getDraftPosts = () => API.get('/posts/drafts', { cache: false, forceRefresh: true });
export const createPost = (data = {}) => {
  const mediaUrl = data.media_url || data.image_url || data.media || '';
  const status = data.status || 'published';
  const payload = {
    ...data,
    image_url: data.image_url || mediaUrl || undefined,
    media: mediaUrl || undefined,
    media_urls: Array.isArray(data.media_urls) ? data.media_urls : mediaUrl ? [mediaUrl] : undefined,
    is_draft: data.is_draft ?? status === 'draft',
  };
  delete payload.media_url;
  return API.post('/posts', payload);
};
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
