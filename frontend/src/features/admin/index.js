// === Yamshat Admin Feature Index ===
// AdminDashboard now points to the upgraded "LiveStream" style dashboard
// (AdminLiveDashboard.jsx) which is the official admin home.
// The previous classic dashboard is preserved as AdminDashboardLegacy so
// it can be reached if ever needed without breaking the build.

export { default as AdminDashboard } from '../../pages/admin/AdminLiveDashboard.jsx';
export { default as AdminDashboardLegacy } from '../../pages/admin/AdminDashboard.jsx';
export { default as AdminUsers } from '../../pages/admin/AdminUsers.jsx';
export { default as AdminPosts } from '../../pages/admin/AdminPosts.jsx';
export { default as AdminNotifications } from '../../pages/admin/AdminNotifications.jsx';
export { default as AdminLive } from '../../pages/admin/AdminLive.jsx';
export { default as AdminReports } from '../../pages/admin/AdminReports.jsx';
export { default as AdminAudit } from '../../pages/admin/AdminAudit.jsx';
export { default as AdminSettings } from '../../pages/admin/AdminSettings.jsx';
export { default as AdminRbac } from '../../pages/admin/AdminRbac.jsx';
export { default as AdminChat } from '../../pages/admin/AdminChat.jsx';
export { default as AdminStories } from '../../pages/admin/AdminStories.jsx';
export { default as AdminReels } from '../../pages/admin/AdminReels.jsx';
export { default as AdminGroups } from '../../pages/admin/AdminGroups.jsx';
