import API from './axios.js';

export const getGroups = () => API.get('/groups');
export const getGroupDetails = (groupId) => API.get(`/groups/${groupId}`, { cache: false, forceRefresh: true });
export const createGroup = (payload) => API.post('/groups', payload);
export const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
export const requestJoinGroup = (groupId, payload = {}) => API.post(`/groups/${groupId}/join-request`, payload);
export const getGroupJoinRequests = (groupId) => API.get(`/groups/${groupId}/join-requests`, { cache: false, forceRefresh: true });
export const reviewGroupJoinRequest = (groupId, requestId, payload) => API.post(`/groups/${groupId}/join-requests/${requestId}`, payload);
export const updateGroupMemberRole = (groupId, username, payload) => API.patch(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, payload);
export const updateGroupMemberPermissions = (groupId, username, payload) => API.patch(`/groups/${groupId}/members/${encodeURIComponent(username)}/permissions`, payload);
export const moderateGroupUser = (groupId, payload) => API.post(`/groups/${groupId}/moderate`, payload);
export const inviteToGroup = (groupId, payload) => API.post(`/groups/${groupId}/invite`, payload);
export const getGroupInvites = (groupId) => API.get(`/groups/${groupId}/invites`, { cache: false, forceRefresh: true });
export const getGroupAuditLogs = (groupId) => API.get(`/groups/${groupId}/audit-logs`, { cache: false, forceRefresh: true });
export const getPinnedGroupMessages = (groupId) => API.get(`/groups/${groupId}/pinned-messages`, { cache: false, forceRefresh: true });
export const createPinnedGroupMessage = (groupId, payload) => API.post(`/groups/${groupId}/pinned-messages`, payload);
