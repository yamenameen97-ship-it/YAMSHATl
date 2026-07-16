import API from './axios.js';

// =================== المسارات الأساسية ===================
export const getGroups = () => API.get('/groups');
export const createGroup = (payload) => API.post('/groups', payload);
export const getGroupDetails = (groupId) => API.get(`/groups/${groupId}`);
export const updateGroup = (groupId, payload) => API.put(`/groups/${groupId}`, payload);
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
export const searchGroups = (query, limit = 50) =>
  API.get('/groups/search', { params: { query, limit } });

// =================== الأعضاء ===================
export const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
export const leaveGroup = (groupId) => API.post(`/groups/${groupId}/leave`);
export const getGroupMembers = (groupId) => API.get(`/groups/${groupId}/members`);
export const addMember = (groupId, payload) =>
  API.post(`/groups/${groupId}/members`, null, { params: payload });
export const updateMemberRole = (groupId, username, role) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, { role });
export const removeMember = (groupId, username) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/remove`);
export const muteMember = (groupId, userId, isMuted) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(userId)}/mute`, null, {
    params: { is_muted: isMuted },
  });
export const banMember = (groupId, userId, isBanned) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(userId)}/ban`, null, {
    params: { is_banned: isBanned },
  });
export const transferOwnership = (groupId, newOwnerUsername) =>
  API.post(`/groups/${groupId}/transfer-ownership`, { new_owner: newOwnerUsername })
    .catch(() => ({ data: null }));

// =================== الدعوات وطلبات الانضمام ===================
export const sendInvitation = (groupId, payload) =>
  API.post(`/groups/${groupId}/invitations`, null, { params: payload });
export const acceptInvitation = (groupId, invitationId, payload) =>
  API.post(`/groups/${groupId}/invitations/${invitationId}/accept`, null, { params: payload });
export const createJoinRequest = (groupId, payload) =>
  API.post(`/groups/${groupId}/join-requests`, null, { params: payload });
export const approveJoinRequest = (groupId, requestId) =>
  API.post(`/groups/${groupId}/join-requests/${requestId}/approve`);
export const rejectJoinRequest = (groupId, requestId) =>
  API.post(`/groups/${groupId}/join-requests/${requestId}/reject`);

// =================== الرسائل ===================
export const getGroupMessages = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/messages`, { params });
export const sendGroupMessage = (groupId, payload) =>
  API.post(`/groups/${groupId}/messages`, payload);
export const deleteGroupMessage = (groupId, messageId) =>
  API.delete(`/groups/${groupId}/messages/${messageId}`);
export const editGroupMessage = (groupId, messageId, payload) =>
  API.put(`/groups/${groupId}/messages/${messageId}`, payload);
export const reactToGroupMessage = (groupId, messageId, emoji) =>
  API.post(`/groups/${groupId}/messages/${messageId}/reactions`, { emoji });
export const pinGroupMessage = (groupId, messageId, isPinned = true) =>
  API.post(`/groups/${groupId}/messages/${messageId}/pin`, null, { params: { is_pinned: isPinned } })
    .catch(() => ({ data: null }));
export const forwardGroupMessage = (groupId, messageId, targets = []) =>
  API.post(`/groups/${groupId}/messages/${messageId}/forward`, { targets })
    .catch(() => ({ data: null }));
export const reportGroupMessage = (groupId, messageId, reason = '') =>
  API.post(`/groups/${groupId}/messages/${messageId}/report`, { reason })
    .catch(() => ({ data: null }));

// =================== المنشورات ===================
export const getGroupPosts = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/posts`, { params }).catch(() => ({ data: [] }));
export const createGroupPost = (groupId, payload) =>
  API.post(`/groups/${groupId}/posts`, null, { params: payload });
export const deleteGroupPost = (groupId, postId) =>
  API.delete(`/groups/${groupId}/posts/${postId}`);
export const pinGroupPost = (groupId, postId, isPinned = true) =>
  API.post(`/groups/${groupId}/posts/${postId}/pin`, null, { params: { is_pinned: isPinned } });

// =================== القواعد / الأحداث / الاستطلاعات / الإعلانات ===================
export const createGroupRule = (groupId, payload) =>
  API.post(`/groups/${groupId}/rules`, null, { params: payload });
export const createGroupEvent = (groupId, payload) =>
  API.post(`/groups/${groupId}/events`, null, { params: payload });
export const createGroupPoll = (groupId, payload) =>
  API.post(`/groups/${groupId}/polls`, payload, {
    timeout: 45000,
    retryable: true,
  });
export const voteInPoll = (groupId, pollId, option) =>
  API.post(`/groups/${groupId}/polls/${pollId}/vote`, null, { params: { option } });
export const createGroupAnnouncement = (groupId, payload) =>
  API.post(`/groups/${groupId}/announcements`, null, { params: payload });

// =================== رفع الملفات ===================
// ملاحظة: لا نعيّن Content-Type يدويًا — المتصفح يضيف boundary تلقائيًا.
// تعيينه يدويًا يكسر رفع الملفات على بعض متصفحات الجوال (Safari iOS / Chrome Android).
export const uploadGroupMedia = (formData, onUploadProgress) =>
  API.post('/upload', formData, {
    onUploadProgress,
    // timeout أعلى للرفع على شبكات الجوال البطيئة
    timeout: 120000,
    // اسمح بـ retry على 502/503/504 من Render cold start
    retryable: true,
  });

// رفع صورة/غلاف مجموعة وتحديث المجموعة مباشرة
export const uploadGroupImage = async (groupId, file, kind = 'avatar', onUploadProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  const res = await API.post('/upload', fd, { onUploadProgress, timeout: 120000, retryable: true });
  const url = res?.data?.url || res?.data?.media_url || res?.data?.cdn_url;
  if (!url) throw new Error('لم يتم استلام رابط الصورة من الخادم');
  const patch = kind === 'cover' ? { cover_image_url: url } : { image_url: url };
  await API.put(`/groups/${groupId}`, patch);
  return url;
};

// =================== الإعدادات والصلاحيات ===================
export const getGroupSettings = (groupId) => API.get(`/groups/${groupId}/settings`).catch(() => ({ data: null }));
export const updateGroupSettings = (groupId, payload) =>
  API.put(`/groups/${groupId}/settings`, payload).catch(() => ({ data: null }));
export const updateGroupPrivacy = (groupId, privacy) =>
  API.put(`/groups/${groupId}`, { privacy });
export const generateGroupInvite = (groupId) =>
  API.post(`/groups/${groupId}/invite`).catch(() => ({ data: { link: `${window.location.origin}/g/${groupId}` } }));

// =================== الإحصائيات ===================
export const getGroupAnalytics = (groupId) =>
  API.get(`/groups/${groupId}/analytics`).catch(() => ({ data: null }));

// =================== أحداث / استطلاعات / منشورات — قوائم ===================
export const listGroupEvents = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/events`, { params }).catch(() => ({ data: [] }));
export const listGroupPolls = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/polls`, { params }).catch(() => ({ data: [] }));
export const listGroupAnnouncements = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/announcements`, { params }).catch(() => ({ data: [] }));
export const listGroupRules = (groupId) =>
  API.get(`/groups/${groupId}/rules`).catch(() => ({ data: [] }));
export const listPinnedMessages = (groupId) =>
  API.get(`/groups/${groupId}/pinned`).catch(() => ({ data: [] }));

// =================== الإشارات (mentions) ===================
export const listGroupMentions = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/mentions`, { params }).catch(() => ({ data: [] }));
export const markMentionRead = (groupId, mentionId) =>
  API.post(`/groups/${groupId}/mentions/${mentionId}/read`).catch(() => ({ data: null }));

// =================== معرض الوسائط ===================
export const listGroupMedia = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/media`, { params }).catch(() => ({ data: [] }));

// =================== سجل التدقيق (audit) ===================
export const getGroupAuditLog = (groupId, params = {}) =>
  API.get(`/groups/${groupId}/audit`, { params }).catch(() => ({ data: [] }));

// =================== استكشاف المجموعات ===================
export const discoverGroups = (params = {}) =>
  API.get('/groups/discover', { params }).catch(() => ({ data: [] }));
export const getTrendingGroups = (limit = 20) =>
  API.get('/groups/trending', { params: { limit } }).catch(() => ({ data: [] }));

// =================== إعدادات الإشعارات لكل مجموعة ===================
export const getGroupNotificationSettings = (groupId) =>
  API.get(`/groups/${groupId}/notifications/settings`).catch(() => ({
    data: { mode: 'all', mute_until: null, mute_mentions: false, sound: 'default', vibrate: true, preview: true },
  }));
export const updateGroupNotificationSettings = (groupId, payload) =>
  API.put(`/groups/${groupId}/notifications/settings`, payload).catch(() => ({ data: payload }));

// =================== WebSocket ===================
export const buildGroupWsUrl = (groupId, userId) => {
  const base = (API.defaults?.baseURL || window.location.origin)
    .replace(/^http/, 'ws')
    .replace(/\/$/, '');
  return `${base}/ws/groups/${encodeURIComponent(groupId)}/${encodeURIComponent(userId)}`;
};
