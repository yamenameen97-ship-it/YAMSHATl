import { a5 as API } from "../index-DRmq1dbV.js";
const getAdminDashboardLive = () => API.get("/admin/dashboard/live", { cache: true, cacheTtlMs: 12e3 });
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
const getAdminLiveOverview = () => Promise.resolve({ data: { rooms: [], total: 0 } });
const featureAdminLiveRoom = () => Promise.resolve({ data: { ok: true } });
const pinLatestAdminLiveComment = () => Promise.resolve({ data: { ok: true } });
const endAdminLiveRoom = () => Promise.resolve({ data: { ok: true } });
const getAdminReportsSummary = () => API.get("/admin/reports/summary", { cache: true, cacheTtlMs: 2e4 });
const getAdminSettings = () => API.get("/admin/settings", { cache: true, cacheTtlMs: 3e4 });
const updateAdminSettings = (data) => API.put("/admin/settings", data);
const changeAdminPassword = (data) => API.post("/admin/settings/change-password", data);
const updateReportStatus = (reportId, status) => API.patch(`/reports/admin/${reportId}`, { status });
const escalateReport = (reportId) => API.post(`/reports/admin/${reportId}/action`, { action: "escalate" });
export {
  pinLatestAdminLiveComment as A,
  getAdminNotifications as a,
  banAdminUser as b,
  getAdminUsers as c,
  deleteAdminUser as d,
  getAdminBanHistory as e,
  getAdminUser as f,
  getAdminDashboardLive as g,
  getAdminPosts as h,
  updateAdminPost as i,
  createAdminPost as j,
  deleteAdminPost as k,
  bulkDeleteAdminPosts as l,
  broadcastAdminNotification as m,
  getAdminReportsSummary as n,
  updateReportStatus as o,
  escalateReport as p,
  getAdminSettings as q,
  updateAdminSettings as r,
  searchAdmin as s,
  toggleAdminShadowBan as t,
  updateAdminUser as u,
  changeAdminPassword as v,
  getAdminRbac as w,
  getAdminLiveOverview as x,
  endAdminLiveRoom as y,
  featureAdminLiveRoom as z
};
