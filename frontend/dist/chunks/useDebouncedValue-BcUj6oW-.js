import { A as API, r as reactExports } from "../index-D6u1FUhW.js";
const getAdminOverview = () => API.get("/admin/overview", { cache: true, cacheTtlMs: 15e3 });
const searchAdmin = (q) => API.get("/admin/search", { params: { q } });
const getAdminUsers = (params) => API.get("/admin/users", { params });
const updateAdminUser = (userId, data) => API.patch(`/admin/users/${userId}`, data);
const banAdminUser = (userId, restore = false) => API.post(`/admin/users/${userId}/ban`, null, { params: { restore } });
const deleteAdminUser = (userId) => API.delete(`/admin/users/${userId}`);
const getAdminPosts = (params) => API.get("/admin/posts", { params });
const getAdminRbac = () => API.get("/admin/rbac", { cache: true, cacheTtlMs: 3e4 });
const getAdminNotifications = (limit = 40) => API.get("/admin/notifications", { params: { limit }, cache: true, cacheTtlMs: 1e4 });
const broadcastAdminNotification = (data) => API.post("/admin/notifications/broadcast", data);
const getAdminLiveOverview = () => API.get("/admin/live/overview", { cache: true, cacheTtlMs: 1e4 });
const endAdminLiveRoom = (roomId) => API.post(`/admin/live/${roomId}/end`);
const getAdminReportsSummary = () => API.get("/admin/reports/summary", { cache: true, cacheTtlMs: 2e4 });
const getAdminSettings = () => API.get("/admin/settings", { cache: true, cacheTtlMs: 3e4 });
const updateAdminSettings = (data) => API.put("/admin/settings", data);
const changeAdminPassword = (data) => API.post("/admin/settings/change-password", data);
const moderatePostAI = (postId) => API.post(`/admin/posts/${postId}/moderate-ai`);
const bulkUpdatePostStatus = (ids, status) => API.post("/admin/posts/bulk-update-status", { ids, status });
const toggleShadowBan = (userId, enabled = true) => API.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });
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
  updateAdminUser as a,
  banAdminUser as b,
  getAdminOverview as c,
  deleteAdminUser as d,
  getAdminPosts as e,
  bulkUpdatePostStatus as f,
  getAdminNotifications as g,
  broadcastAdminNotification as h,
  getAdminLiveOverview as i,
  endAdminLiveRoom as j,
  getAdminReportsSummary as k,
  updateReportStatus as l,
  moderatePostAI as m,
  escalateReport as n,
  getAdminSettings as o,
  updateAdminSettings as p,
  changeAdminPassword as q,
  getAdminRbac as r,
  searchAdmin as s,
  toggleShadowBan as t,
  useDebouncedValue as u,
  getAdminUsers as v
};
