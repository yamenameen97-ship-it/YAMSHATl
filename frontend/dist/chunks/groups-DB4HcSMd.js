import { A as API } from "../index-BtxTC4_g.js";
const getGroups = () => API.get("/groups");
const createGroup = (payload) => API.post("/groups", payload);
const getGroupDetails = (groupId) => API.get(`/groups/${groupId}`);
const updateGroup = (groupId, payload) => API.put(`/groups/${groupId}`, payload);
const deleteGroup = (groupId) => API.delete(`/groups/${groupId}`);
const joinGroup = (groupId) => API.post(`/groups/${groupId}/join`);
const getGroupMembers = (groupId) => API.get(`/groups/${groupId}/members`);
const updateMemberRole = (groupId, username, role) => API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/role`, { role });
const removeMember = (groupId, username) => API.post(`/groups/${groupId}/members/${encodeURIComponent(username)}/remove`);
const updateGroupSettings = (groupId, payload) => API.put(`/groups/${groupId}/settings`, payload).catch(() => ({ data: null }));
const generateGroupInvite = (groupId) => API.post(`/groups/${groupId}/invite`).catch(() => ({ data: { link: `${window.location.origin}/g/${groupId}` } }));
export {
  getGroupDetails as a,
  getGroupMembers as b,
  createGroup as c,
  deleteGroup as d,
  getGroups as e,
  updateGroupSettings as f,
  generateGroupInvite as g,
  updateMemberRole as h,
  joinGroup as j,
  removeMember as r,
  updateGroup as u
};
