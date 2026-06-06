import { A as API, aT as resolveMediaUrl } from "../index-T8PSkq5D.js";
const FEED_CACHE_PREFIX = "yamshat:feed:cache:";
function toTimestamp(post = {}) {
  const rawValue = post?.published_at || post?.created_at || post?.updated_at || 0;
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
function sortPostsNewestFirst(posts = []) {
  const seen = /* @__PURE__ */ new Set();
  return [...posts].filter(Boolean).sort((left, right) => {
    const timeDelta = toTimestamp(right) - toTimestamp(left);
    if (timeDelta !== 0) return timeDelta;
    return Number(right?.id || 0) - Number(left?.id || 0);
  }).filter((post) => {
    const key = String(post?.id ?? `${post?.published_at || post?.created_at || ""}:${post?.content || ""}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function clearLocalFeedCaches() {
  if (typeof window === "undefined" || !window.localStorage) return;
  Object.keys(window.localStorage).filter((key) => key.startsWith(FEED_CACHE_PREFIX)).forEach((key) => window.localStorage.removeItem(key));
}
function injectPostIntoFeedCache(queryClient, post) {
  if (!queryClient || !post) return;
  queryClient.setQueriesData({ queryKey: ["feed-data"] }, (current) => {
    if (!current?.pages?.length) return current;
    return {
      ...current,
      pages: current.pages.map((page, index) => {
        if (index !== 0) return page;
        return {
          ...page,
          items: sortPostsNewestFirst([post, ...Array.isArray(page?.items) ? page.items : []])
        };
      })
    };
  });
  clearLocalFeedCaches();
}
function looksLikeVideo(post = {}, mediaUrls = []) {
  const typeHint = String(post.media_type || post.type || post.kind || post.mime_type || post.content_type || "").toLowerCase();
  const candidates = [post.media_url, post.media, post.image_url, post.video_url, post.thumbnail_url, ...mediaUrls].map((value) => String(value || "").toLowerCase()).filter(Boolean);
  const hasVideoCandidate = candidates.some((value) => /\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(value) || /(^data:video\/)|([?&](resource_type|content_type|mime_type)=video)/i.test(value) || /\/video\/upload\//i.test(value) || /\b(video|reel|stream|playlist)\b/i.test(value));
  return Boolean(
    post.is_reel || post.has_video || typeHint === "video" || typeHint.startsWith("video/") || hasVideoCandidate
  );
}
function normalizePost(post = {}) {
  const rawMediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [post.media_url || post.media || post.image_url].filter(Boolean);
  const normalizedMediaUrls = Array.from(new Set(rawMediaUrls.map((url) => resolveMediaUrl(url)).filter(Boolean)));
  const hasVideo = looksLikeVideo(post, rawMediaUrls);
  const mediaUrl = resolveMediaUrl(post.media_url || post.media || normalizedMediaUrls[0] || post.image_url || "");
  const imageUrl = resolveMediaUrl(
    post.thumbnail_url || (hasVideo ? "" : post.image_url) || normalizedMediaUrls.find((url) => !/\.(mp4|webm|mov|m4v|m3u8|mkv|avi)(\?.*)?$/i.test(String(url || "").toLowerCase())) || mediaUrl || ""
  );
  return {
    ...post,
    media: mediaUrl || "",
    media_url: mediaUrl || "",
    image_url: imageUrl || "",
    thumbnail_url: imageUrl || "",
    preview_url: resolveMediaUrl(post.preview_url || imageUrl || mediaUrl || ""),
    media_urls: normalizedMediaUrls.length ? normalizedMediaUrls : mediaUrl ? [mediaUrl] : [],
    media_type: hasVideo ? "video" : String(post.media_type || post.type || "image").toLowerCase(),
    likes_count: Number(post.likes_count ?? post.like_count ?? post.likes ?? 0),
    comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
    saved_count: Number(post.saved_count ?? post.save_count ?? 0),
    share_count: Number(post.share_count ?? post.shares ?? 0),
    is_liked: Boolean(post.is_liked ?? post.liked_by_me),
    is_saved: Boolean(post.is_saved ?? post.saved_by_me),
    user_avatar: resolveMediaUrl(post.user_avatar || post.avatar || ""),
    has_video: hasVideo
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
    filter_type: legacyFilterType,
    sort_by: legacySortBy,
    include_drafts: legacyIncludeDrafts,
    ...rest
  } = params;
  const resolvedLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const resolvedFilter = String(filterType ?? legacyFilterType ?? tab ?? filter ?? "all").trim().toLowerCase();
  const resolvedSort = String(sortBy ?? legacySortBy ?? sort ?? "recent").trim().toLowerCase();
  const resolvedIncludeDrafts = includeDrafts ?? legacyIncludeDrafts;
  const normalized = {
    ...rest,
    limit: resolvedLimit,
    page: Math.max(Number(page) || 1, 1)
  };
  if (resolvedFilter && resolvedFilter !== "all") normalized.filter_type = resolvedFilter;
  if (resolvedSort && resolvedSort !== "recent") normalized.sort_by = resolvedSort;
  if (resolvedIncludeDrafts === true) normalized.include_drafts = true;
  return normalized;
}
const getPosts = async (params = {}) => {
  const normalizedParams = normalizeFeedParams(params);
  let response;
  try {
    response = await API.get("/posts/", { params: normalizedParams });
  } catch (error) {
    const status = Number(error?.response?.status || 0);
    const canFallback = [400, 422, 500, 502, 503, 504].includes(status);
    const hadAdvancedParams = normalizedParams.filter_type !== void 0 || normalizedParams.sort_by !== void 0 || normalizedParams.include_drafts !== void 0;
    if (!canFallback || !hadAdvancedParams) throw error;
    const fallbackParams = {
      page: normalizedParams.page,
      limit: normalizedParams.limit
    };
    response = await API.get("/posts/", { params: fallbackParams });
  }
  const payload = response?.data;
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.posts) ? payload.posts : Array.isArray(payload?.items) ? payload.items : [];
  const pagination = {
    ...payload?.pagination || {},
    has_more: Boolean(payload?.pagination?.has_more ?? rawItems.length === normalizedParams.limit),
    page: Number(payload?.pagination?.page || normalizedParams.page || 1),
    limit: Number(payload?.pagination?.limit || normalizedParams.limit)
  };
  return {
    ...response,
    data: sortPostsNewestFirst(rawItems.map(normalizePost)),
    meta: {
      ...payload && !Array.isArray(payload) ? payload : {},
      pagination
    }
  };
};
const createPost = (data = {}) => {
  const mediaUrl = data.media_url || data.image_url || data.media || "";
  const status = data.status || "published";
  const payload = {
    ...data,
    image_url: data.image_url || mediaUrl || void 0,
    media: mediaUrl || void 0,
    media_urls: Array.isArray(data.media_urls) ? data.media_urls : mediaUrl ? [mediaUrl] : void 0,
    is_draft: data.is_draft ?? status === "draft"
  };
  return API.post("/posts/", payload);
};
const updatePost = (postId, data) => API.patch(`/posts/${postId}`, data);
const uploadPostMedia = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return API.post("/upload/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress
  });
};
const likePost = (postId) => API.post(`/posts/${postId}/like`);
const savePost = (postId) => API.post(`/posts/${postId}/save`);
const sharePost = (postId, platform = "copy") => API.post(`/posts/${postId}/share`, { platform });
const addComment = (postId, content, parentId = null) => API.post(`/posts/${postId}/comment`, { content, parent_id: parentId });
const getComments = (postId, params = {}) => API.get(`/comments/${postId}/comments`, { params, cache: false, forceRefresh: true });
const deletePost = (postId) => API.delete(`/posts/${postId}`);
export {
  addComment as a,
  createPost as b,
  clearLocalFeedCaches as c,
  deletePost as d,
  getPosts as e,
  sharePost as f,
  getComments as g,
  sortPostsNewestFirst as h,
  injectPostIntoFeedCache as i,
  uploadPostMedia as j,
  likePost as l,
  savePost as s,
  updatePost as u
};
