import { A as API } from "../index-D_Nx8mZz.js";
const getNotifications = (limit = 50) => API.get("/notifications", {
  params: { limit },
  cache: true,
  cacheTtlMs: 2e4
});
const markNotificationRead = (notificationId) => API.post(`/notifications/${encodeURIComponent(notificationId)}/read`);
const markNotificationsRead = (notificationIds) => {
  const hasIds = Array.isArray(notificationIds) && notificationIds.length > 0;
  if (!hasIds) {
    return API.put("/notifications/read");
  }
  const ids = notificationIds.map((id) => id === void 0 || id === null ? "" : String(id)).filter(Boolean);
  return API.put("/notifications/read", { ids }, {
    params: { ids: ids.join(",") }
  });
};
export {
  markNotificationsRead as a,
  getNotifications as g,
  markNotificationRead as m
};
