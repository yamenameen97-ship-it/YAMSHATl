/**
 * groupHelpers — أدوات مساعدة لنظام المجموعات
 * يدعم: تصفية تلقائية، تحليلات، روابط دعوة، أحداث مجدولة، تنسيق التواريخ، التحقق من الصلاحيات.
 */

// قائمة كلمات الإشراف التلقائي (يمكن توسيعها أو جلبها من API لاحقاً)
const DEFAULT_BLOCKED_WORDS = [
  'spam', 'raid', 'abuse', 'scam', 'phishing',
  'سبام', 'احتيال', 'إساءة', 'إعلان مزعج',
];

export function filterAutoModeration(posts = [], extraBlockedWords = []) {
  const blocked = [...DEFAULT_BLOCKED_WORDS, ...extraBlockedWords].map((w) =>
    String(w || '').toLowerCase()
  );
  return posts.filter((post) => {
    const text = String(post?.text || post?.content || '').toLowerCase();
    return !blocked.some((word) => word && text.includes(word));
  });
}

export function buildGroupAnalytics(groups = []) {
  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    members: group.members?.length || group.members_count || 0,
    posts: group.posts_count || group.posts?.length || 0,
    engagement: group.engagement || 0,
    activityScore:
      (group.posts_count || 0) * 2 +
      (group.members_count || 0) +
      (group.engagement || 0),
  }));
}

export function generateInviteLink(groupId, origin = '') {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/g/${encodeURIComponent(groupId)}`;
}

export function buildScheduledEvents(events = []) {
  const now = Date.now();
  return events.map((event) => {
    const start = event.start_time ? new Date(event.start_time).getTime() : now;
    return {
      ...event,
      scheduled: start > now,
      isLive: event.start_time && event.end_time
        ? (start <= now && new Date(event.end_time).getTime() >= now)
        : false,
      countdown: Math.max(0, start - now),
    };
  });
}

export function formatGroupDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

// التحقق من صلاحية محددة لعضو
export function memberHasPermission(member, permission) {
  if (!member) return false;
  if (member.role === 'owner') return true;
  const perms = member.permissions || [];
  return perms.includes(permission);
}

// ترتيب الأعضاء: المالك ثم المشرفين ثم المراقبين ثم الأعضاء
const ROLE_ORDER = { owner: 0, admin: 1, moderator: 2, mod: 2, member: 3 };
export function sortMembersByRole(members = []) {
  return [...members].sort((a, b) => {
    const ra = ROLE_ORDER[a.role] ?? 99;
    const rb = ROLE_ORDER[b.role] ?? 99;
    if (ra !== rb) return ra - rb;
    return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
  });
}
