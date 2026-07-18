/**
 * Engagement API client
 * يلتف على fetch مع credentials للمصادقة عبر الكوكيز.
 */
import { apiClient } from "@/api/client";

const E = "/api/engagement";

export const engagementApi = {
  // المهام اليومية
  getTasks: () => apiClient.get(`${E}/tasks`).then(r => r.data),
  claimTask: (taskId) => apiClient.post(`${E}/tasks/${taskId}/claim`).then(r => r.data),

  // المستويات
  getMyLevel: () => apiClient.get(`${E}/level`).then(r => r.data),
  getMyHostLevel: () => apiClient.get(`${E}/host-level`).then(r => r.data),

  // الشارات
  getAchievements: () => apiClient.get(`${E}/achievements`).then(r => r.data),
  pinAchievement: (id, pinned = true) =>
    apiClient.post(`${E}/achievements/${id}/pin`, null, { params: { pinned } }).then(r => r.data),

  // عجلة الحظ
  getWheelState: () => apiClient.get(`${E}/wheel`).then(r => r.data),
  spinWheel: (paid = false) =>
    apiClient.post(`${E}/wheel/spin`, null, { params: { paid } }).then(r => r.data),

  // الإحالة
  getReferral: () => apiClient.get(`${E}/referral`).then(r => r.data),
  applyReferral: (code) =>
    apiClient.post(`${E}/referral/apply`, null, { params: { code } }).then(r => r.data),

  // المتجر والمخزون
  getShop: (params = {}) => apiClient.get(`${E}/shop`, { params }).then(r => r.data),
  buyItem: (id) => apiClient.post(`${E}/shop/${id}/buy`).then(r => r.data),
  getInventory: () => apiClient.get(`${E}/inventory`).then(r => r.data),
  equipItem: (id) => apiClient.post(`${E}/inventory/${id}/equip`).then(r => r.data),
};

// ============================================================
// v88.3.5 — API للغرف الصوتية مع Fallback ذكي محسّن
// ------------------------------------------------------------
// الباك اند (v88.3.5) يسجّل الراوتر على ثلاث بوادئ:
//   1) /api/voice/rooms        → الرئيسي
//   2) /api/voice-rooms/rooms  → alias جديد أوضح
//   3) /api/rooms              → alias قديم متوافق
// وكل endpoint يقبل slash وبدونه (redirect_slashes=False + مزدوج decorator).
// هنا نجرّب المسارات بالترتيب، وفقط عند 404/405 ننتقل للتالي.
// ============================================================

const tryPaths = async (method, paths, dataOrOpts, opts) => {
  let lastErr = null;
  for (const p of paths) {
    try {
      let res;
      if (method === 'get') {
        res = await apiClient.get(p, dataOrOpts);
      } else if (method === 'post') {
        res = await apiClient.post(p, dataOrOpts, opts);
      }
      return res.data;
    } catch (e) {
      lastErr = e;
      const s = e?.response?.status;
      // 404/405 → جرّب المسار التالي. أي خطأ آخر يعني السيرفر موجود، لا فائدة من التكرار.
      if (s !== 404 && s !== 405) throw e;
    }
  }
  throw lastErr;
};

// v88.3.5: مولّد مسارات — يولّد كل الأشكال الممكنة (3 بوادئ)
// suffix يجب أن يبدأ بـ / مثل "/123/join" أو "" للجذر.
const vrPaths = (suffix = '') => [
  `/api/voice/rooms${suffix}`,
  `/api/voice-rooms/rooms${suffix}`,
  `/api/rooms${suffix}`,
];

export const voiceRoomsApi = {
  // v88.3.5: دالة تشخيصية تتحقق فيما إذا كان راوتر الغرف الصوتية محمّلاً على السيرفر
  // ترجع { available: bool, path?: string, error?: string }
  ping: async () => {
    for (const p of vrPaths('/_ping')) {
      try {
        const r = await apiClient.get(p);
        if (r?.data?.ok) return { available: true, path: p, ...r.data };
      } catch (_) { /* جرّب التالي */ }
    }
    return { available: false, error: 'voice_rooms router not mounted on server' };
  },
  list: (category) => tryPaths('get', vrPaths(), { params: { category } }),
  get: (id) => tryPaths('get', vrPaths(`/${id}`)),
  create: (payload) => tryPaths('post', vrPaths(), payload),
  join: (id, password) =>
    tryPaths('post', vrPaths(`/${id}/join`), null, { params: { password } }),
  leave: (id) => tryPaths('post', vrPaths(`/${id}/leave`), null),
  takeSeat: (id, seatIndex) =>
    tryPaths('post', vrPaths(`/${id}/seats/take`), { seat_index: seatIndex }),
  leaveSeat: (id) =>
    tryPaths('post', vrPaths(`/${id}/seats/leave`), null),
  toggleMute: (id, targetUserId, mute) =>
    tryPaths('post', vrPaths(`/${id}/mute`), null,
      { params: { target_user_id: targetUserId, mute } }),
  close: (id) => tryPaths('post', vrPaths(`/${id}/close`), null),
  sendMessage: (id, content) =>
    tryPaths('post', vrPaths(`/${id}/messages`), { content }),
  getMessages: (id, limit = 50) =>
    tryPaths('get', vrPaths(`/${id}/messages`), { params: { limit } }),
};
