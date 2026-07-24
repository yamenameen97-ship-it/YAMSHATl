import API from './axios.js';

// v88.53 — طبقة API لطلبات المراجعة على القيود الإدارية
// ===========================================================
// كل قيد من نوع (comment_mute / post_ban / reels_ban / groups_join_ban /
// story_ban / dm_strangers_ban) يُخزَّن في جدول user_restrictions وله إشعار
// مرتبط عند المستخدم. هذه الوظائف توفّر:
//   - جلب القيود السارية على المستخدم الحالي.
//   - إرسال طلب مراجعة على قيد محدّد (زر "طلب مراجعه" في بطاقة الإشعار).
//   - (للإدارة) الردّ على طلبات المراجعة.

export const getMyRestrictions = () => API.get('/restrictions/me', {
  cache: true,
  cacheTtlMs: 15_000,
});

export const submitRestrictionAppeal = (restrictionId, message) =>
  API.post(
    `/restrictions/${encodeURIComponent(restrictionId)}/appeal`,
    { message },
  );

// ---- Admin only ----
export const adminApplyRestriction = ({ user_id, restriction_type, reason, duration_minutes, related_report_ids }) =>
  API.post('/admin/restrictions', {
    user_id,
    restriction_type,
    reason,
    duration_minutes,
    related_report_ids,
  });

export const adminLiftRestriction = (restrictionId) =>
  API.delete(`/admin/restrictions/${encodeURIComponent(restrictionId)}`);

export const adminResolveAppeal = (restrictionId, { response, accept }) =>
  API.post(
    `/admin/restrictions/${encodeURIComponent(restrictionId)}/resolve`,
    { response, accept: Boolean(accept) },
  );

export const adminListRestrictions = ({ only_active = true } = {}) =>
  API.get('/admin/restrictions', { params: { only_active } });
