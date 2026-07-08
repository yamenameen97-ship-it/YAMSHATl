/**
 * reels.js — v85.5
 * ----------------------------------------------------------------
 * API خاصة بتعليقات الريلز.
 *
 * قبل: كانت صفحة الريلز تستخدم addComment/getComments من posts.js التي
 * تستدعي /posts/{id}/comment و/comments/{id}/comments — لكن الـ id هنا
 * هو reel.id، فكان الطلب إما يُنشئ التعليق على منشور خاطئ (نفس رقم الـ id)
 * أو يفشل بصمت 404، فيختفي التعليق بعد إعادة فتح الشيت.
 *
 * الآن: نستخدم /reels/{reel_id}/comments كصمود رئيسي، مع fallback أنيق
 * على المسار القديم للريلز إن وُجد.
 */
import API from './axios.js';

export const addReelComment = (reelId, content, parentId = null) =>
  API.post(`/reels/${encodeURIComponent(reelId)}/comments`, {
    content,
    parent_id: parentId,
  });

export const getReelComments = (reelId, params = {}) =>
  API.get(`/reels/${encodeURIComponent(reelId)}/comments`, {
    params,
    cache: false,
    forceRefresh: true,
  });

export const likeReelComment = (commentId) =>
  API.post(`/reels/comments/${encodeURIComponent(commentId)}/like`);

export const deleteReelComment = (commentId) =>
  API.delete(`/reels/comments/${encodeURIComponent(commentId)}`);
