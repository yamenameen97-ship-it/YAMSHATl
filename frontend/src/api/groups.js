import API from './axios.js';

// =================== المسارات الأساسية ===================
export const getGroups = () => API.get('/groups');
export const createGroup = (payload) => API.post('/groups', payload);
export const getGroupDetails = (groupId) => API.get(`/groups/${groupId}`);
export const updateGroup = (groupId, payload) => API.put(`/groups/${groupId}`, payload);
export const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);

// =================== الأعضاء ===================
export const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
export const leaveGroup = (groupId) => API.post(`/groups/${groupId}/leave`);
export const getGroupMembers = (groupId) => API.get(`/groups/${groupId}/members`);
export const updateMemberRole = (groupId, username, role) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, { role });
export const removeMember = (groupId, username) =>
  API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/remove`);

// =================== الرسائل (عبر مسارات المجموعات المخصصة) ===================
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

// =================== رفع الملفات ===================
export const uploadGroupMedia = (formData, onUploadProgress) =>
  API.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

// =================== الإعدادات والصلاحيات ===================
export const getGroupSettings = (groupId) => API.get(`/groups/${groupId}/settings`).catch(() => ({ data: null }));
export const updateGroupSettings = (groupId, payload) =>
  API.put(`/groups/${groupId}/settings`, payload).catch(() => ({ data: null }));
export const updateGroupPrivacy = (groupId, privacy) =>
  API.put(`/groups/${groupId}`, { privacy });
export const generateGroupInvite = (groupId) =>
  API.post(`/groups/${groupId}/invite`).catch(() => ({ data: { link: `${window.location.origin}/g/${groupId}` } }));
