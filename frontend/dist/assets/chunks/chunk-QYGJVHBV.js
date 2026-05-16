import {
  axios_default
} from "./chunk-FJN4GIYV.js";
import {
  init_define_import_meta_env
} from "./chunk-SOYW6UE7.js";

// src/api/posts.js
init_define_import_meta_env();
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
var getPosts = async (params = {}) => {
  const response = await axios_default.get("/posts", { params });
  const payload = response?.data;
  const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.posts) ? payload.posts : Array.isArray(payload?.items) ? payload.items : [];
  return {
    ...response,
    data: rawItems.map(normalizePost),
    meta: payload && !Array.isArray(payload) ? payload : {}
  };
};
var createPost = (data = {}) => {
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
  return axios_default.post("/posts", payload);
};
var uploadPostMedia = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios_default.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress
  });
};
var likePost = (postId) => axios_default.post(`/posts/${postId}/like`);
var savePost = (postId) => axios_default.post(`/posts/${postId}/save`);
var sharePost = (postId, platform = "copy") => axios_default.post(`/posts/${postId}/share`, { platform });
var addComment = (postId, text, parentId = null) => axios_default.post(`/posts/${postId}/comment`, { text, parent_id: parentId });
var getComments = (postId) => axios_default.get(`/posts/${postId}/comments`);

export {
  getPosts,
  createPost,
  uploadPostMedia,
  likePost,
  savePost,
  sharePost,
  addComment,
  getComments
};
