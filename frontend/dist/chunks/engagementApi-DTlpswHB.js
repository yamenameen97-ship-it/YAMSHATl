import { t as axios, a as API_BASE, $ as getAuthToken, a6 as getCsrfToken, z as clearStoredUser, bg as sessionManager, b2 as redirectToAppPath } from "../index-D_Nx8mZz.js";
const API_ORIGIN = String(API_BASE || "").replace(/\/api\/?$/, "");
const apiClient = axios.create({
  baseURL: API_ORIGIN,
  timeout: 45e3,
  withCredentials: true,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json"
  }
});
apiClient.interceptors.request.use((config) => {
  try {
    const token = getAuthToken?.();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
  }
  try {
    const method = String(config.method || "get").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      const csrf = getCsrfToken?.();
      if (csrf) {
        config.headers = config.headers || {};
        config.headers["X-CSRF-Token"] = csrf;
      }
    }
  } catch (_) {
  }
  return config;
});
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        clearStoredUser?.();
        sessionManager?.clearSession?.();
      } catch (_) {
      }
      try {
        if (typeof window !== "undefined" && !/^\/(login|register|forgot-password|reset-password|verify-email)/.test(window.location.pathname)) {
          redirectToAppPath?.("/login");
        }
      } catch (_) {
      }
    }
    return Promise.reject(error);
  }
);
const E = "/api/engagement";
const engagementApi = {
  // المهام اليومية
  getTasks: () => apiClient.get(`${E}/tasks`).then((r) => r.data),
  claimTask: (taskId) => apiClient.post(`${E}/tasks/${taskId}/claim`).then((r) => r.data),
  // المستويات
  getMyLevel: () => apiClient.get(`${E}/level`).then((r) => r.data),
  getMyHostLevel: () => apiClient.get(`${E}/host-level`).then((r) => r.data),
  // الشارات
  getAchievements: () => apiClient.get(`${E}/achievements`).then((r) => r.data),
  pinAchievement: (id, pinned = true) => apiClient.post(`${E}/achievements/${id}/pin`, null, { params: { pinned } }).then((r) => r.data),
  // عجلة الحظ
  getWheelState: () => apiClient.get(`${E}/wheel`).then((r) => r.data),
  spinWheel: (paid = false) => apiClient.post(`${E}/wheel/spin`, null, { params: { paid } }).then((r) => r.data),
  // الإحالة
  getReferral: () => apiClient.get(`${E}/referral`).then((r) => r.data),
  applyReferral: (code) => apiClient.post(`${E}/referral/apply`, null, { params: { code } }).then((r) => r.data),
  // المتجر والمخزون
  getShop: (params = {}) => apiClient.get(`${E}/shop`, { params }).then((r) => r.data),
  buyItem: (id) => apiClient.post(`${E}/shop/${id}/buy`).then((r) => r.data),
  getInventory: () => apiClient.get(`${E}/inventory`).then((r) => r.data),
  equipItem: (id) => apiClient.post(`${E}/inventory/${id}/equip`).then((r) => r.data)
};
const voiceRoomsApi = {
  list: (category) => apiClient.get(`/api/voice/rooms`, { params: { category } }).then((r) => r.data),
  get: (id) => apiClient.get(`/api/voice/rooms/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post(`/api/voice/rooms`, payload).then((r) => r.data),
  join: (id, password) => apiClient.post(`/api/voice/rooms/${id}/join`, null, { params: { password } }).then((r) => r.data),
  leave: (id) => apiClient.post(`/api/voice/rooms/${id}/leave`).then((r) => r.data),
  takeSeat: (id, seatIndex) => apiClient.post(`/api/voice/rooms/${id}/seats/take`, { seat_index: seatIndex }).then((r) => r.data),
  leaveSeat: (id) => apiClient.post(`/api/voice/rooms/${id}/seats/leave`).then((r) => r.data),
  toggleMute: (id, targetUserId, mute) => apiClient.post(`/api/voice/rooms/${id}/mute`, null, { params: { target_user_id: targetUserId, mute } }).then((r) => r.data),
  close: (id) => apiClient.post(`/api/voice/rooms/${id}/close`).then((r) => r.data),
  sendMessage: (id, content) => apiClient.post(`/api/voice/rooms/${id}/messages`, { content }).then((r) => r.data),
  getMessages: (id, limit = 50) => apiClient.get(`/api/voice/rooms/${id}/messages`, { params: { limit } }).then((r) => r.data)
};
export {
  engagementApi as e,
  voiceRoomsApi as v
};
