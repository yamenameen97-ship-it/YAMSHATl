export function filterAutoModeration(posts = []) {
  const blockedWords = ['spam', 'raid', 'abuse'];

  return posts.filter(
    (post) =>
      !blockedWords.some((word) =>
        String(post?.text || '').toLowerCase().includes(word)
      )
  );
}

export function buildGroupAnalytics(groups = []) {
  return groups.map((group) => ({
    id: group.id,
    members: group.members?.length || 0,
    engagement: group.engagement || 0,
  }));
}

export function generateInviteLink(groupId) {
  return `/groups/${groupId}/invite`;
}

export function buildScheduledEvents(events = []) {
  return events.map((event) => ({
    ...event,
    scheduled: true,
  }));
}