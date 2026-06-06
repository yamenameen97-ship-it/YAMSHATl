import { A as API, aP as reactExports } from "../index-T8PSkq5D.js";
const getAdminOverview = () => API.get("/admin/overview", { cache: true, cacheTtlMs: 15e3 });
const searchAdmin = (q) => API.get("/admin/search", { params: { q } });
const getAdminUsers = (params) => API.get("/admin/users", { params });
const getAdminUser = (userId) => API.get(`/admin/users/${userId}`, { cache: false, forceRefresh: true });
const getAdminBanHistory = (limit = 30) => API.get("/admin/users/ban-history", { params: { limit }, cache: true, cacheTtlMs: 1e4 });
const updateAdminUser = (userId, data) => API.patch(`/admin/users/${userId}`, data);
const banAdminUser = (userId, restore = false) => API.post(`/admin/users/${userId}/ban`, null, { params: { restore } });
const toggleAdminShadowBan = (userId, enabled = true) => API.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });
const deleteAdminUser = (userId) => API.delete(`/admin/users/${userId}`);
const getAdminPosts = (params) => API.get("/admin/posts", { params });
const createAdminPost = (data) => API.post("/admin/posts", data);
const updateAdminPost = (postId, data) => API.put(`/admin/posts/${postId}`, data);
const deleteAdminPost = (postId) => API.delete(`/admin/posts/${postId}`);
const bulkDeleteAdminPosts = (ids) => API.post("/admin/posts/bulk-delete", { ids });
const getAdminRbac = () => API.get("/admin/rbac", { cache: true, cacheTtlMs: 3e4 });
const getAdminNotifications = (limit = 40) => API.get("/admin/notifications", { params: { limit }, cache: true, cacheTtlMs: 1e4 });
const broadcastAdminNotification = (data) => API.post("/admin/notifications/broadcast", data);
const getAdminLiveOverview = () => API.get("/admin/live/overview", { cache: true, cacheTtlMs: 1e4 });
const featureAdminLiveRoom = (roomId, featured) => API.post(`/admin/live/${roomId}/feature`, { featured });
const pinLatestAdminLiveComment = (roomId) => API.post(`/admin/live/${roomId}/pin-latest`);
const endAdminLiveRoom = (roomId) => API.post(`/admin/live/${roomId}/end`);
const getAdminReportsSummary = () => API.get("/admin/reports/summary", { cache: true, cacheTtlMs: 2e4 });
const getAdminSettings = () => API.get("/admin/settings", { cache: true, cacheTtlMs: 3e4 });
const updateAdminSettings = (data) => API.put("/admin/settings", data);
const changeAdminPassword = (data) => API.post("/admin/settings/change-password", data);
const updateReportStatus = (reportId, status) => API.post(`/admin/reports/${reportId}/status`, { status });
const escalateReport = (reportId) => API.post(`/admin/reports/${reportId}/escalate`);
function useDebouncedValue(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = reactExports.useState(value);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
export {
  updateReportStatus as A,
  useDebouncedValue as B,
  broadcastAdminNotification as a,
  banAdminUser as b,
  bulkDeleteAdminPosts as c,
  changeAdminPassword as d,
  createAdminPost as e,
  deleteAdminPost as f,
  deleteAdminUser as g,
  endAdminLiveRoom as h,
  escalateReport as i,
  featureAdminLiveRoom as j,
  getAdminBanHistory as k,
  getAdminLiveOverview as l,
  getAdminNotifications as m,
  getAdminOverview as n,
  getAdminPosts as o,
  getAdminRbac as p,
  getAdminReportsSummary as q,
  getAdminSettings as r,
  getAdminUser as s,
  getAdminUsers as t,
  pinLatestAdminLiveComment as u,
  searchAdmin as v,
  toggleAdminShadowBan as w,
  updateAdminPost as x,
  updateAdminSettings as y,
  updateAdminUser as z
};
