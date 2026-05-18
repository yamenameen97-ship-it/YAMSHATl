import API from './axios.js';

export const getGroups = (options = {}) => API.get('/groups', {
  cache: options.cache ?? true,
  cacheTtlMs: options.cacheTtlMs ?? 15_000,
  forceRefresh: options.forceRefresh ?? false,
  signal: options.signal,
});

export const getGroupDetails = (groupId, options = {}) => API.get(`/groups/${groupId}`, {
  cache: options.cache ?? false,
  forceRefresh: options.forceRefresh ?? true,
  signal: options.signal,
});

export const createGroup = (payload) => API.post('/groups', payload);
export const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
export const inviteGroupMember = (groupId, username) => API.post(`/groups/${groupId}/invite`, { username });
export const updateGroupMemberRole = (groupId, username, role) => API.patch(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, { role });
export const getGroupAuditLogs = (groupId, options = {}) => API.get(`/groups/${groupId}/audit-logs`, {
  cache: options.cache ?? false,
  forceRefresh: options.forceRefresh ?? true,
  signal: options.signal,
});
export const moderateGroupMember = (groupId, payload) => API.post(`/groups/${groupId}/moderate`, payload);
