import { A as API } from "../index-DuXBJv5q.js";
function normalizePost(post = {}) {
  const mediaUrl = post.media_url || post.media || post.image_url || (Array.isArray(post.media_urls) ? post.media_urls[0] : "");
  return {
    ...post,
    media_url: mediaUrl || "",
    image_url: post.image_url || mediaUrl || "",
    media_urls: Array.isArray(post.media_urls) ? post.media_urls : mediaUrl ? [mediaUrl] : [],
    likes_count: Number(post.likes_count ?? post.like_count ?? post.likes ?? 0),
    comments_count: Number(post.comments_count ?? post.comment_count ?? 0),
    saved_count: Number(post.saved_count ?? post.save_count ?? 0),
    share_count: Number(post.share_count ?? post.shares ?? 0),
    is_liked: Boolean(post.is_liked ?? post.liked_by_me),
    is_saved: Boolean(post.is_saved ?? post.saved_by_me),
    user_avatar: post.user_avatar || post.avatar || ""
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
    filter_type: filterType ?? tab ?? filter ?? "all",
    sort_by: sortBy ?? sort ?? "recent"
  };
  if (includeDrafts !== void 0) normalized.include_drafts = includeDrafts;
  return normalized;
}
const getPosts = async (params = {}) => {
  const normalizedParams = normalizeFeedParams(params);
  const response = await API.get("/posts", { params: normalizedParams });
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
    data: rawItems.map(normalizePost),
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
  delete payload.media_url;
  return API.post("/posts", payload);
};
const likePost = (postId) => API.post(`/posts/${postId}/like`);
const savePost = (postId) => API.post(`/posts/${postId}/save`);
const sharePost = (postId, platform = "copy") => API.post(`/posts/${postId}/share`, { platform });
const addComment = (postId, content, parentId = null) => API.post(`/posts/${postId}/comment`, { content, parent_id: parentId });
const getComments = (postId, params = {}) => API.get(`/comments/${postId}/comments`, { params, cache: false, forceRefresh: true });
const deletePost = (postId) => API.delete(`/posts/${postId}`);
export {
  addComment as a,
  sharePost as b,
  getComments as c,
  deletePost as d,
  createPost as e,
  getPosts as g,
  likePost as l,
  savePost as s
};
