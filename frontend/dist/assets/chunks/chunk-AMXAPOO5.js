import {
  axios_default
} from "./chunk-FJN4GIYV.js";
import {
  __toESM,
  init_define_import_meta_env,
  require_react
} from "./chunk-SOYW6UE7.js";

// src/api/admin.js
init_define_import_meta_env();
var getAdminOverview = () => axios_default.get("/admin/overview", { cache: true, cacheTtlMs: 15e3 });
var searchAdmin = (q) => axios_default.get("/admin/search", { params: { q } });
var getAdminUsers = (params) => axios_default.get("/admin/users", { params });
var updateAdminUser = (userId, data) => axios_default.patch(`/admin/users/${userId}`, data);
var banAdminUser = (userId, restore = false) => axios_default.post(`/admin/users/${userId}/ban`, null, { params: { restore } });
var deleteAdminUser = (userId) => axios_default.delete(`/admin/users/${userId}`);
var getAdminPosts = (params) => axios_default.get("/admin/posts", { params });
var getAdminRbac = () => axios_default.get("/admin/rbac", { cache: true, cacheTtlMs: 3e4 });
var getAdminNotifications = (limit = 40) => axios_default.get("/admin/notifications", { params: { limit }, cache: true, cacheTtlMs: 1e4 });
var broadcastAdminNotification = (data) => axios_default.post("/admin/notifications/broadcast", data);
var getAdminLiveOverview = () => axios_default.get("/admin/live/overview", { cache: true, cacheTtlMs: 1e4 });
var endAdminLiveRoom = (roomId) => axios_default.post(`/admin/live/${roomId}/end`);
var getAdminReportsSummary = () => axios_default.get("/admin/reports/summary", { cache: true, cacheTtlMs: 2e4 });
var getAdminSettings = () => axios_default.get("/admin/settings", { cache: true, cacheTtlMs: 3e4 });
var updateAdminSettings = (data) => axios_default.put("/admin/settings", data);
var changeAdminPassword = (data) => axios_default.post("/admin/settings/change-password", data);
var moderatePostAI = (postId) => axios_default.post(`/admin/posts/${postId}/moderate-ai`);
var bulkUpdatePostStatus = (ids, status) => axios_default.post("/admin/posts/bulk-update-status", { ids, status });
var toggleShadowBan = (userId, enabled = true) => axios_default.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });
var updateReportStatus = (reportId, status) => axios_default.post(`/admin/reports/${reportId}/status`, { status });
var escalateReport = (reportId) => axios_default.post(`/admin/reports/${reportId}/escalate`);

// src/hooks/useDebouncedValue.js
init_define_import_meta_env();
var import_react = __toESM(require_react(), 1);
function useDebouncedValue(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = (0, import_react.useState)(value);
  (0, import_react.useEffect)(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export {
  getAdminOverview,
  searchAdmin,
  getAdminUsers,
  updateAdminUser,
  banAdminUser,
  deleteAdminUser,
  getAdminPosts,
  getAdminRbac,
  getAdminNotifications,
  broadcastAdminNotification,
  getAdminLiveOverview,
  endAdminLiveRoom,
  getAdminReportsSummary,
  getAdminSettings,
  updateAdminSettings,
  changeAdminPassword,
  moderatePostAI,
  bulkUpdatePostStatus,
  toggleShadowBan,
  updateReportStatus,
  escalateReport,
  useDebouncedValue
};
