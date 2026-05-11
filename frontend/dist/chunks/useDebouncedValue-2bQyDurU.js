import { a as __toESM } from "./rolldown-runtime-DuU1KJyR.js";
import { it as require_react } from "./vendor-9lSzsY2K.js";
import { o as API } from "../index-dyGfSAus.js";
//#region src/api/admin.js
var getAdminOverview = () => API.get("/admin/overview", {
	cache: true,
	cacheTtlMs: 15e3
});
var searchAdmin = (q) => API.get("/admin/search", { params: { q } });
var getAdminUsers = (params) => API.get("/admin/users", { params });
var updateAdminUser = (userId, data) => API.patch(`/admin/users/${userId}`, data);
var banAdminUser = (userId, restore = false) => API.post(`/admin/users/${userId}/ban`, null, { params: { restore } });
var deleteAdminUser = (userId) => API.delete(`/admin/users/${userId}`);
var getAdminPosts = (params) => API.get("/admin/posts", { params });
var getAdminRbac = () => API.get("/admin/rbac", {
	cache: true,
	cacheTtlMs: 3e4
});
var getAdminNotifications = (limit = 40) => API.get("/admin/notifications", {
	params: { limit },
	cache: true,
	cacheTtlMs: 1e4
});
var broadcastAdminNotification = (data) => API.post("/admin/notifications/broadcast", data);
var getAdminLiveOverview = () => API.get("/admin/live/overview", {
	cache: true,
	cacheTtlMs: 1e4
});
var endAdminLiveRoom = (roomId) => API.post(`/admin/live/${roomId}/end`);
var getAdminSettings = () => API.get("/admin/settings", {
	cache: true,
	cacheTtlMs: 3e4
});
var updateAdminSettings = (data) => API.put("/admin/settings", data);
var changeAdminPassword = (data) => API.post("/admin/settings/change-password", data);
var moderatePostAI = (postId) => API.post(`/admin/posts/${postId}/moderate-ai`);
var bulkUpdatePostStatus = (ids, status) => API.post("/admin/posts/bulk-update-status", {
	ids,
	status
});
var toggleShadowBan = (userId, enabled = true) => API.post(`/admin/users/${userId}/shadow-ban`, null, { params: { enabled } });
//#endregion
//#region src/hooks/useDebouncedValue.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useDebouncedValue(value, delay = 400) {
	const [debouncedValue, setDebouncedValue] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => {
		const timer = window.setTimeout(() => setDebouncedValue(value), delay);
		return () => window.clearTimeout(timer);
	}, [value, delay]);
	return debouncedValue;
}
//#endregion
export { toggleShadowBan as _, changeAdminPassword as a, getAdminLiveOverview as c, getAdminPosts as d, getAdminRbac as f, searchAdmin as g, moderatePostAI as h, bulkUpdatePostStatus as i, getAdminNotifications as l, getAdminUsers as m, banAdminUser as n, deleteAdminUser as o, getAdminSettings as p, broadcastAdminNotification as r, endAdminLiveRoom as s, useDebouncedValue as t, getAdminOverview as u, updateAdminSettings as v, updateAdminUser as y };
