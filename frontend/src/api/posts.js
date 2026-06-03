import API from './axios.js';
import { resolveMediaUrl } from '../config/mediaConfig.js';

function looksLikeVideo(post = {}, mediaUrls = []) {
  const typeHint = String(post.media_type || post.type || post.kind || post.mime_type || post.content_type || '').toLowerCase();
  const candidates = [post.media_url, post.media, post.image_url, post.video_url, post.thumbnail_url, ...mediaUrls]
    .map((value) => String(value || '').toLowerCase())
    .filter(Boolean);

  const hasVideoCandidate = candidates.some((value) => (
    /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(value)
    || /(^data:video\/)|([?&](resource_type|content_type|mime_type)=video)/i.test(value)
    || /\/video\/upload\//i.test(value)
    || /\b(video|reel|stream|playlist)\b/i.test(value)
  ));

  return Boolean(
    post.is_reel
    || post.has_video
    || typeHint === 'video'
    || typeHint.startsWith('video/')
    || hasVideoCandidate
  );
}

function normalizePost(post = {}) {
  const rawMediaUrls = Array.isArray(post.media_urls)
    ? post.media_urls
    : [post.media_url || post.media || post.image_url].filter(Boolean);

  const normalizedMediaUrls = Array.from(new Set(rawMediaUrls.map((url) => resolveMediaUrl(url)).filter(Boolean)));
  const hasVideo = looksLikeVideo(post, rawMediaUrls);
  const mediaUrl = resolveMediaUrl(post.media_url || post.media || normalizedMediaUrls[0] || post.image_url || '');
  const imageUrl = resolveMediaUrl(
    post.thumbnail_url
    || (hasVideo ? '' : post.image_url)
    || normalizedMediaUrls.find((url) => !/\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(String(url || '').toLowerCase()))
    || mediaUrl
    || '',
  );

  return {
    ...post,
    media: mediaUrl || '',
    media_url: mediaUrl || '',
    image_url: imageUrl || '',
    thumbnail_url: imageUrl || '',
    preview_url: resolveMediaUrl(post.preview_url || imageUrl || mediaUrl || ''),
    media_urls: normalizedMediaUrls.length ? normalizedMediaUrls : mediaUrl ? [mediaUrl] : [],
    media_type: hasVideo ? 'video' : String(post.media_type || post.type || 'image').toLowerCase(),
    likes_count: Number(post.likes_count ?? post.like_count ?? post.likes ?? 0),
    comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
    saved_count: Number(post.saved_count ?? post.save_count ?? 0),
    share_count: Number(post.share_count ?? post.shares ?? 0),
    is_liked: Boolean(post.is_liked ?? post.liked_by_me),
    is_saved: Boolean(post.is_saved ?? post.saved_by_me),
    user_avatar: resolveMediaUrl(post.user_avatar || post.avatar || ''),
    has_video: hasVideo,
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

  const resolvedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
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
  let response;

  try {
    response = await API.get('/posts/', { params: normalizedParams });
  } catch (error) {
    const status = Number(error?.response?.status || 0);
    const canFallback = [400, 422, 500, 502, 503, 504].includes(status);
    const hadAdvancedParams = (
      normalizedParams.filter_type !== undefined
      || normalizedParams.sort_by !== undefined
      || normalizedParams.include_drafts !== undefined
    );
    if (!canFallback || !hadAdvancedParams) throw error;

    const fallbackParams = {
      page: normalizedParams.page,
      limit: normalizedParams.limit,
    };

    if (normalizedParams.include_drafts !== undefined) {
      fallbackParams.include_drafts = normalizedParams.include_drafts;
    }

    response = await API.get('/posts/', { params: fallbackParams });
  }

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
