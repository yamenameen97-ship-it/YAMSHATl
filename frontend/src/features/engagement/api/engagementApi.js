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
// v88.3.4 — API للغرف الصوتية مع Fallback ذكي
// ------------------------------------------------------------
// السبب: بعض عمليات النشر (Render/الإنتاج) قد يفشل فيها راوتر
// voice_rooms الأساسي على البادئة /api/voice، بينما يبقى الـalias
// الاحتياطي على /api شغّالاً. كنا سابقاً نتحقق فقط من /api/voice/rooms
// فتظهر رسالة "Not Found" رغم أن السيرفر يعمل. الآن نجرّب المسار
// الأساسي أولاً، ثم نتراجع تلقائياً إلى الـalias عند 404.
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
      // 404/405 → جرّب المسار التالي. أي خطأ آخر يعني السيرفر موجود، لا فائدة من تكرار.
      if (s !== 404 && s !== 405) throw e;
    }
  }
  throw lastErr;
};

export const voiceRoomsApi = {
  list: (category) => tryPaths('get', ['/api/voice/rooms', '/api/rooms'], { params: { category } }),
  get: (id) => tryPaths('get', [`/api/voice/rooms/${id}`, `/api/rooms/${id}`]),
  create: (payload) => tryPaths('post', ['/api/voice/rooms', '/api/rooms'], payload),
  join: (id, password) =>
    tryPaths('post', [`/api/voice/rooms/${id}/join`, `/api/rooms/${id}/join`], null, { params: { password } }),
  leave: (id) => tryPaths('post', [`/api/voice/rooms/${id}/leave`, `/api/rooms/${id}/leave`], null),
  takeSeat: (id, seatIndex) =>
    tryPaths('post', [`/api/voice/rooms/${id}/seats/take`, `/api/rooms/${id}/seats/take`], { seat_index: seatIndex }),
  leaveSeat: (id) =>
    tryPaths('post', [`/api/voice/rooms/${id}/seats/leave`, `/api/rooms/${id}/seats/leave`], null),
  toggleMute: (id, targetUserId, mute) =>
    tryPaths('post', [`/api/voice/rooms/${id}/mute`, `/api/rooms/${id}/mute`], null,
      { params: { target_user_id: targetUserId, mute } }),
  close: (id) => tryPaths('post', [`/api/voice/rooms/${id}/close`, `/api/rooms/${id}/close`], null),
  sendMessage: (id, content) =>
    tryPaths('post', [`/api/voice/rooms/${id}/messages`, `/api/rooms/${id}/messages`], { content }),
  getMessages: (id, limit = 50) =>
    tryPaths('get', [`/api/voice/rooms/${id}/messages`, `/api/rooms/${id}/messages`], { params: { limit } }),
};
