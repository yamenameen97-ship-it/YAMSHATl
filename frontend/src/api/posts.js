import API from './axios.js';

function normalizePost(post = {}) {
  const mediaUrl = post.media_url || post.media || post.image_url || (Array.isArray(post.media_urls) ? post.media_urls[0] : '');
  return {
    ...post,
    media_url: mediaUrl || '',
    image_url: post.image_url || mediaUrl || '',
    media_urls: Array.isArray(post.media_urls) ? post.media_urls : mediaUrl ? [mediaUrl] : [],
    likes_count: Number(post.likes_count ?? post.like_count ?? post.likes ?? 0),
    comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
    saved_count: Number(post.saved_count ?? post.save_count ?? 0),
    share_count: Number(post.share_count ?? post.shares ?? 0),
    is_liked: Boolean(post.is_liked ?? post.liked_by_me),
    is_saved: Boolean(post.is_saved ?? post.saved_by_me),
    user_avatar: post.user_avatar || post.avatar || '',
  };
}

function normalizeFeedParams(params = {}) {
  const {
    page,
    limit,
    filterType,
    sortBy,
    tab,
    filter,
    sort,
    includeDrafts,
    ...rest
  } = params;

  const resolvedLimit = Math.max(Number(limit) || 10, 1);
  const normalized = {
    ...rest,
    limit: resolvedLimit,
    page: Math.max(Number(page) || 1, 1),
    filter_type: filterType ?? tab ?? filter ?? 'all',
    sort_by: sortBy ?? sort ?? 'recent',
  };

  if (includeDrafts !== undefined) normalized.include_drafts = includeDrafts;
  return normalized;
}

export const getPosts = async (params = {}) => {
  const normalizedParams = normalizeFeedParams(params);
  const response = await API.get('/posts/', { params: normalizedParams });
  const payload = response?.data;
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.posts)
      ? payload.posts
      : Array.isArray(payload?.items)
        ? payload.items
        : [];
  const pagination = {
    ...(payload?.pagination || {}),
    has_more: Boolean(payload?.pagination?.has_more ?? (rawItems.length === normalizedParams.limit)),
    page: Number(payload?.pagination?.page || normalizedParams.page || 1),
    limit: Number(payload?.pagination?.limit || normalizedParams.limit),
  };
  return {
    ...response,
    data: rawItems.map(normalizePost),
    meta: {
      ...(payload && !Array.isArray(payload) ? payload : {}),
      pagination,
    },
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
  return API.post('/posts/', payload);
};
export const updatePost = (postId, data) => API.patch(`/posts/${postId}`, data);
export const getPostHistory = (postId) => API.get(`/posts/${postId}/history`, { cache: false, forceRefresh: true });

export const uploadPostMedia = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

export const likePost = (postId) => API.post(`/posts/${postId}/like`);
export const savePost = (postId) => API.post(`/posts/${postId}/save`);
export const sharePost = (postId, platform = 'copy') => API.post(`/posts/${postId}/share`, { platform });
export const votePoll = (postId, optionKey) => API.post(`/posts/${postId}/poll-vote`, { option_key: optionKey });
export const addComment = (postId, content, parentId = null) => API.post(`/posts/${postId}/comment`, { content, parent_id: parentId });
export const getComments = (postId, params = {}) => API.get(`/comments/${postId}/comments`, { params, cache: false, forceRefresh: true });
export const updateComment = (commentId, content) => API.patch(`/comments/item/${commentId}`, { content });
export const deleteComment = (commentId) => API.delete(`/comments/item/${commentId}`);
export const likeComment = (commentId) => API.post(`/comments/item/${commentId}/like`);
export const pinComment = (commentId, pinned = true) => API.post(`/comments/item/${commentId}/pin`, { pinned });
export const hideComment = (commentId, hidden = true) => API.post(`/comments/item/${commentId}/hide`, { hidden });
export const reportComment = (commentId, reason = 'abuse') => API.post(`/comments/item/${commentId}/report`, { reason });
export const getPostInsights = (postId) => API.get(`/posts/${postId}/insights`, { cache: false, forceRefresh: true });
export const getScheduledPosts = () => API.get('/posts/scheduled', { cache: false, forceRefresh: true });
export const getPostAnalytics = (postId) => API.get(`/posts/${postId}/analytics`, { cache: false, forceRefresh: true });
export const getRecommendedPosts = (params = {}) => API.get('/posts/recommended', { params });
export const deletePost = (postId) => API.delete(`/posts/${postId}`);
