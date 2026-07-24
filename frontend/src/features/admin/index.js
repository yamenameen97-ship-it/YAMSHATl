// === Yamshat Admin Feature Index (v88.51) ===

export { default as AdminDashboard } from '../../pages/admin/AdminDashboard.jsx';
export { default as AdminUsers } from '../../pages/admin/AdminUsers.jsx';
export { default as AdminPosts } from '../../pages/admin/AdminPosts.jsx';
export { default as AdminNotifications } from '../../pages/admin/AdminNotifications.jsx';
export { default as AdminReports } from '../../pages/admin/AdminReports.jsx';
export { default as AdminAudit } from '../../pages/admin/AdminAudit.jsx';
export { default as AdminSettings } from '../../pages/admin/AdminSettings.jsx';
export { default as AdminRbac } from '../../pages/admin/AdminRbac.jsx';
export { default as AdminChat } from '../../pages/admin/AdminChat.jsx';
export { default as AdminStories } from '../../pages/admin/AdminStories.jsx';
export { default as AdminReels } from '../../pages/admin/AdminReels.jsx';
export { default as AdminGroups } from '../../pages/admin/AdminGroups.jsx';

// 🔥 v88.51 — استبدال AdminLive (نظام البث الملغى) بـ AdminTrending.
// نُبقي اسم AdminLive كـ alias لتوافق أي راوت قديم يشير إلى /admin/live.
export { default as AdminTrending } from '../../pages/admin/AdminTrending.jsx';
export { default as AdminLive } from '../../pages/admin/AdminTrending.jsx';
