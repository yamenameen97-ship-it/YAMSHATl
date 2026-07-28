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


// إجراءات مالك الريل: تعديل الوصف أو حذف الريل.
export const updateReel = (reelId, payload) =>
  API.put(`/reels/${encodeURIComponent(reelId)}`, payload);

export const deleteReel = (reelId) =>
  API.delete(`/reels/${encodeURIComponent(reelId)}`);

// ✅ v88.82: إعادة نشر ريل (Repost) — endpoint مخصّص مع سقوط أنيق إلى /share.
// السلوك:
//   1) نحاول أولاً POST /reels/{reel_id}/repost (المسار المخصّص).
//   2) إن رجع 404/405 نسقط إلى POST /reels/{reel_id}/share بحمولة { platform: 'repost' }
//      (نفس النهج المستخدم في posts.js عبر sharePost).
// ملاحظة: الاستدعاء لا يرمي — نُعيد كائناً بحقلي { ok, data } حتى يتعامل معه الاستهلاك بأمان.
export const shareReelRepost = async (reelId) => {
  const rid = encodeURIComponent(reelId);
  try {
    const res = await API.post(`/reels/${rid}/repost`);
    return { ok: true, data: res?.data ?? null, path: 'repost' };
  } catch (err) {
    const status = err?.response?.status;
    // 404 = المسار غير موجود على الخادم / 405 = طريقة غير مسموحة → نسقط لـ /share
    if (status === 404 || status === 405) {
      try {
        const res = await API.post(`/reels/${rid}/share`, { platform: 'repost' });
        return { ok: true, data: res?.data ?? null, path: 'share-fallback' };
      } catch (err2) {
        return { ok: false, error: err2, path: 'share-fallback' };
      }
    }
    return { ok: false, error: err, path: 'repost' };
  }
};
