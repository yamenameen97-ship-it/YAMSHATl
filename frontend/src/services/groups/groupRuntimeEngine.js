/**
 * groupRuntimeEngine — محرك حالة محلي للمجموعات (Cache + Optimistic UI)
 *
 * - يحتفظ بحالة المجموعات في الذاكرة لتسريع الرسم بين الصفحات.
 * - يدعم اشتراكات (subscribe) ليُعاد رسم الـ UI عند التغيير.
 * - يكمّل API الحقيقي ولا يستبدله؛ يستخدم لـ optimistic updates.
 */

const groupState = {
  groups: {},
  requests: {},
  moderationQueue: [],
  analytics: {},
};

const subscribers = new Set();

function notify() {
  for (const cb of subscribers) {
    try { cb({ ...groupState }); } catch { /* تجاهل */ }
  }
}

export function subscribe(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export function getSnapshot() {
  return {
    groups: { ...groupState.groups },
    requests: { ...groupState.requests },
    moderationQueue: [...groupState.moderationQueue],
    analytics: { ...groupState.analytics },
  };
}

export function createGroup(groupId, payload = {}) {
  groupState.groups[groupId] = {
    id: groupId,
    ...payload,
    members: payload.members || [],
    roles: payload.roles || {},
    rules: payload.rules || [],
    pinnedPosts: [],
    banned: [],
    muted: [],
    createdAt: Date.now(),
  };
  notify();
  return groupState.groups[groupId];
}

export function updateGroup(groupId, updates = {}) {
  if (!groupState.groups[groupId]) return null;
  groupState.groups[groupId] = { ...groupState.groups[groupId], ...updates };
  notify();
  return groupState.groups[groupId];
}

export function removeGroup(groupId) {
  if (!groupState.groups[groupId]) return false;
  delete groupState.groups[groupId];
  delete groupState.requests[groupId];
  delete groupState.analytics[groupId];
  notify();
  return true;
}

export function assignRole(groupId, userId, role = 'member') {
  groupState.groups[groupId] ??= { roles: {} };
  groupState.groups[groupId].roles ??= {};
  groupState.groups[groupId].roles[userId] = role;
  notify();
  return role;
}

export function submitJoinRequest(groupId, userId) {
  groupState.requests[groupId] ??= [];
  if (groupState.requests[groupId].some((r) => r.userId === userId)) return false;
  groupState.requests[groupId].push({ userId, createdAt: Date.now(), status: 'pending' });
  notify();
  return true;
}

export function approveJoinRequest(groupId, userId) {
  groupState.groups[groupId] ??= { members: [] };
  groupState.groups[groupId].members ??= [];
  if (!groupState.groups[groupId].members.includes(userId)) {
    groupState.groups[groupId].members.push(userId);
  }
  groupState.requests[groupId] = (groupState.requests[groupId] || [])
    .map((r) => (r.userId === userId ? { ...r, status: 'approved' } : r));
  notify();
  return true;
}

export function rejectJoinRequest(groupId, userId) {
  groupState.requests[groupId] = (groupState.requests[groupId] || [])
    .map((r) => (r.userId === userId ? { ...r, status: 'rejected' } : r));
  notify();
  return true;
}

export function banMember(groupId, userId) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].banned ??= [];
  if (!groupState.groups[groupId].banned.includes(userId)) {
    groupState.groups[groupId].banned.push(userId);
  }
  // أزله من قائمة الأعضاء النشطين
  if (Array.isArray(groupState.groups[groupId].members)) {
    groupState.groups[groupId].members = groupState.groups[groupId].members.filter((m) => m !== userId);
  }
  notify();
  return true;
}

export function unbanMember(groupId, userId) {
  if (!groupState.groups[groupId]?.banned) return false;
  groupState.groups[groupId].banned = groupState.groups[groupId].banned.filter((u) => u !== userId);
  notify();
  return true;
}

export function muteMember(groupId, userId) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].muted ??= [];
  if (!groupState.groups[groupId].muted.includes(userId)) {
    groupState.groups[groupId].muted.push(userId);
  }
  notify();
  return true;
}

export function unmuteMember(groupId, userId) {
  if (!groupState.groups[groupId]?.muted) return false;
  groupState.groups[groupId].muted = groupState.groups[groupId].muted.filter((u) => u !== userId);
  notify();
  return true;
}

export function addPinnedPost(groupId, post) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].pinnedPosts ??= [];
  groupState.groups[groupId].pinnedPosts.push(post);
  notify();
  return true;
}

export function removePinnedPost(groupId, postId) {
  if (!groupState.groups[groupId]?.pinnedPosts) return false;
  groupState.groups[groupId].pinnedPosts = groupState.groups[groupId].pinnedPosts
    .filter((p) => String(p.id) !== String(postId));
  notify();
  return true;
}

export function queueModeration(item) {
  groupState.moderationQueue.push({ ...item, queuedAt: Date.now() });
  notify();
  return groupState.moderationQueue.length;
}

export function resolveModeration(itemId, action = 'approved') {
  groupState.moderationQueue = groupState.moderationQueue.filter((m) => String(m.id) !== String(itemId));
  notify();
  return action;
}

export function trackAnalytics(groupId, metric, value) {
  groupState.analytics[groupId] ??= {};
  groupState.analytics[groupId][metric] = value;
  notify();
  return groupState.analytics[groupId];
}

export default {
  subscribe,
  getSnapshot,
  createGroup,
  updateGroup,
  removeGroup,
  assignRole,
  submitJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  banMember,
  unbanMember,
  muteMember,
  unmuteMember,
  addPinnedPost,
  removePinnedPost,
  queueModeration,
  resolveModeration,
  trackAnalytics,
};
