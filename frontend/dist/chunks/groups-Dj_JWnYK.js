import { A as API } from "../index-TztUfWYS.js";
const getGroups = () => API.get("/groups");
const createGroup = (payload) => API.post("/groups", payload);
const getGroupDetails = (groupId) => API.get(`/groups/${groupId}`);
const updateGroup = (groupId, payload) => API.put(`/groups/${groupId}`, payload);
const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
const searchGroups = (query, limit = 50) => API.get("/groups/search", { params: { query, limit } });
const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
const getGroupMembers = (groupId) => API.get(`/groups/${groupId}/members`);
const addMember = (groupId, payload) => API.post(`/groups/${groupId}/members`, null, { params: payload });
const updateMemberRole = (groupId, username, role) => API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, { role });
const removeMember = (groupId, username) => API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/remove`);
const transferOwnership = (groupId, newOwnerUsername) => API.post(`/groups/${groupId}/transfer-ownership`, { new_owner: newOwnerUsername }).catch(() => ({ data: null }));
const createJoinRequest = (groupId, payload) => API.post(`/groups/${groupId}/join-requests`, null, { params: payload });
const getGroupMessages = (groupId, params = {}) => API.get(`/groups/${groupId}/messages`, { params });
const sendGroupMessage = (groupId, payload) => API.post(`/groups/${groupId}/messages`, payload);
const deleteGroupMessage = (groupId, messageId) => API.delete(`/groups/${groupId}/messages/${messageId}`);
const reactToGroupMessage = (groupId, messageId, emoji) => API.post(`/groups/${groupId}/messages/${messageId}/reactions`, { emoji });
const pinGroupMessage = (groupId, messageId, isPinned = true) => API.post(`/groups/${groupId}/messages/${messageId}/pin`, null, { params: { is_pinned: isPinned } }).catch(() => ({ data: null }));
const forwardGroupMessage = (groupId, messageId, targets = []) => API.post(`/groups/${groupId}/messages/${messageId}/forward`, { targets }).catch(() => ({ data: null }));
const getGroupPosts = (groupId, params = {}) => API.get(`/groups/${groupId}/posts`, { params }).catch(() => ({ data: [] }));
const createGroupPost = (groupId, payload) => API.post(`/groups/${groupId}/posts`, null, { params: payload });
const deleteGroupPost = (groupId, postId) => API.delete(`/groups/${groupId}/posts/${postId}`);
const pinGroupPost = (groupId, postId, isPinned = true) => API.post(`/groups/${groupId}/posts/${postId}/pin`, null, { params: { is_pinned: isPinned } });
const createGroupRule = (groupId, payload) => API.post(`/groups/${groupId}/rules`, null, { params: payload });
const createGroupEvent = (groupId, payload) => API.post(`/groups/${groupId}/events`, null, { params: payload });
const createGroupPoll = (groupId, payload) => API.post(`/groups/${groupId}/polls`, null, { params: payload });
const voteInPoll = (groupId, pollId, option) => API.post(`/groups/${groupId}/polls/${pollId}/vote`, null, { params: { option } });
const uploadGroupMedia = (formData, onUploadProgress) => API.post("/upload", formData, {
  onUploadProgress,
  // timeout أعلى للرفع على شبكات الجوال البطيئة
  timeout: 12e4,
  // اسمح بـ retry على 502/503/504 من Render cold start
  retryable: true
});
const uploadGroupImage = async (groupId, file, kind = "avatar", onUploadProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  const res = await API.post("/upload", fd, { onUploadProgress, timeout: 12e4, retryable: true });
  const url = res?.data?.url || res?.data?.media_url || res?.data?.cdn_url;
  if (!url) throw new Error("لم يتم استلام رابط الصورة من الخادم");
  const patch = kind === "cover" ? { cover_image_url: url } : { image_url: url };
  await API.put(`/groups/${groupId}`, patch);
  return url;
};
const updateGroupSettings = (groupId, payload) => API.put(`/groups/${groupId}/settings`, payload).catch(() => ({ data: null }));
const generateGroupInvite = (groupId) => API.post(`/groups/${groupId}/invite`).catch(() => ({ data: { link: `${window.location.origin}/g/${groupId}` } }));
const getGroupAnalytics = (groupId) => API.get(`/groups/${groupId}/analytics`).catch(() => ({ data: null }));
const listGroupEvents = (groupId, params = {}) => API.get(`/groups/${groupId}/events`, { params }).catch(() => ({ data: [] }));
const listGroupPolls = (groupId, params = {}) => API.get(`/groups/${groupId}/polls`, { params }).catch(() => ({ data: [] }));
const listPinnedMessages = (groupId) => API.get(`/groups/${groupId}/pinned`).catch(() => ({ data: [] }));
const listGroupMentions = (groupId, params = {}) => API.get(`/groups/${groupId}/mentions`, { params }).catch(() => ({ data: [] }));
const markMentionRead = (groupId, mentionId) => API.post(`/groups/${groupId}/mentions/${mentionId}/read`).catch(() => ({ data: null }));
const listGroupMedia = (groupId, params = {}) => API.get(`/groups/${groupId}/media`, { params }).catch(() => ({ data: [] }));
const getGroupAuditLog = (groupId, params = {}) => API.get(`/groups/${groupId}/audit`, { params }).catch(() => ({ data: [] }));
const discoverGroups = (params = {}) => API.get("/groups/discover", { params }).catch(() => ({ data: [] }));
const getTrendingGroups = (limit = 20) => API.get("/groups/trending", { params: { limit } }).catch(() => ({ data: [] }));
const getGroupNotificationSettings = (groupId) => API.get(`/groups/${groupId}/notifications/settings`).catch(() => ({
  data: { mode: "all", mute_until: null, mute_mentions: false, sound: "default", vibrate: true, preview: true }
}));
const updateGroupNotificationSettings = (groupId, payload) => API.put(`/groups/${groupId}/notifications/settings`, payload).catch(() => ({ data: payload }));
export {
  listGroupPolls as A,
  listPinnedMessages as B,
  markMentionRead as C,
  pinGroupMessage as D,
  pinGroupPost as E,
  reactToGroupMessage as F,
  removeMember as G,
  searchGroups as H,
  sendGroupMessage as I,
  transferOwnership as J,
  updateGroup as K,
  updateGroupNotificationSettings as L,
  updateGroupSettings as M,
  updateMemberRole as N,
  uploadGroupImage as O,
  uploadGroupMedia as P,
  voteInPoll as Q,
  addMember as a,
  createGroupEvent as b,
  createGroup as c,
  createGroupPoll as d,
  createGroupPost as e,
  createGroupRule as f,
  createJoinRequest as g,
  deleteGroup as h,
  deleteGroupMessage as i,
  deleteGroupPost as j,
  discoverGroups as k,
  forwardGroupMessage as l,
  generateGroupInvite as m,
  getGroupAnalytics as n,
  getGroupAuditLog as o,
  getGroupDetails as p,
  getGroupMembers as q,
  getGroupMessages as r,
  getGroupNotificationSettings as s,
  getGroupPosts as t,
  getGroups as u,
  getTrendingGroups as v,
  joinGroup as w,
  listGroupEvents as x,
  listGroupMedia as y,
  listGroupMentions as z
};
