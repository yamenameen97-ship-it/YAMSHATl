const groupState = {
  groups: {},
  requests: {},
  moderationQueue: [],
  analytics: {},
};

export function createGroup(groupId, payload = {}) {
  groupState.groups[groupId] = {
    id: groupId,
    ...payload,
    members: [],
    roles: {},
    rules: [],
    createdAt: Date.now(),
  };

  return groupState.groups[groupId];
}

export function updateGroup(groupId, updates = {}) {
  if (!groupState.groups[groupId]) return null;

  groupState.groups[groupId] = {
    ...groupState.groups[groupId],
    ...updates,
  };

  return groupState.groups[groupId];
}

export function assignRole(groupId, userId, role = 'member') {
  groupState.groups[groupId] ??= { roles: {} };
  groupState.groups[groupId].roles[userId] = role;

  return role;
}

export function submitJoinRequest(groupId, userId) {
  groupState.requests[groupId] ??= [];

  groupState.requests[groupId].push({
    userId,
    createdAt: Date.now(),
  });

  return true;
}

export function approveJoinRequest(groupId, userId) {
  groupState.groups[groupId] ??= { members: [] };
  groupState.groups[groupId].members.push(userId);

  return true;
}

export function banMember(groupId, userId) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].banned ??= [];

  groupState.groups[groupId].banned.push(userId);

  return true;
}

export function muteMember(groupId, userId) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].muted ??= [];

  groupState.groups[groupId].muted.push(userId);

  return true;
}

export function addPinnedPost(groupId, post) {
  groupState.groups[groupId] ??= {};
  groupState.groups[groupId].pinnedPosts ??= [];

  groupState.groups[groupId].pinnedPosts.push(post);

  return true;
}

export function queueModeration(item) {
  groupState.moderationQueue.push({
    ...item,
    queuedAt: Date.now(),
  });

  return groupState.moderationQueue.length;
}

export function trackAnalytics(groupId, metric, value) {
  groupState.analytics[groupId] ??= {};
  groupState.analytics[groupId][metric] = value;

  return groupState.analytics[groupId];
}

export default {
  createGroup,
  updateGroup,
  assignRole,
  submitJoinRequest,
  approveJoinRequest,
  banMember,
  muteMember,
  addPinnedPost,
  queueModeration,
  trackAnalytics,
};