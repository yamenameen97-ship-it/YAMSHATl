import { avatarGradient } from '../../components/yamshat/YamshatDesign.js';

export const CHAT_NAV_ITEMS = [
  { key: 'chats', label: 'الدردشات', icon: '💬', to: '/inbox' },
  { key: 'groups', label: 'المجموعات', icon: '👥', to: '/groups' },
  { key: 'friends', label: 'الأصدقاء', icon: '👤', to: '/users' },
  { key: 'notifications', label: 'الإشعارات', icon: '🔔', to: '/notifications' },
  { key: 'settings', label: 'الإعدادات', icon: '⚙️', to: '/settings' },
];

// تم إفراغ الـ fixtures التجريبية حتى تظهر فقط المحادثات الحقيقية القادمة من
// الخادم أو المخزنة محلياً عبر حالة التطبيق/التخزين المحلي.
export const CHAT_FIXTURE_CONTACTS = [];

function fallbackHandle(name = '') {
  const value = String(name || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/^@+/, '')
    .toLowerCase();
  return value ? `@${value}` : '';
}

function formatThreadTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const sameDay = today.toDateString() === date.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  if (diffDays === 1) return 'أمس';
  return date.toLocaleDateString('ar-EG', { weekday: 'long' });
}

function getPreviewByType(source = {}) {
  const messageType = String(source?.last_message_type || source?.type || '').toLowerCase();
  const content = source?.last_message || source?.preview || source?.message || '';

  if (content && String(content).trim()) {
    if (messageType === 'voice') return `🎤 ${content}`;
    if (['image', 'photo'].includes(messageType)) return `🖼️ ${content}`;
    if (['video'].includes(messageType)) return `🎬 ${content}`;
    if (['file', 'document'].includes(messageType)) return `📎 ${content}`;
    return content;
  }

  if (messageType === 'voice') return '🎤 رسالة صوتية';
  if (['image', 'photo'].includes(messageType)) return '🖼️ صورة';
  if (['video'].includes(messageType)) return '🎬 فيديو';
  if (['file', 'document'].includes(messageType)) return '📎 ملف';
  return 'ابدأ المحادثة الآن';
}

function buildPresenceLabels(source = {}) {
  const presence = source?.presence || {};
  const isOnline = Boolean(source?.is_online ?? source?.isOnline ?? presence?.is_online ?? false);
  const lastSeenValue = source?.last_seen || presence?.last_seen || source?.updated_at || source?.created_at || null;
  const lastSeenLabel = isOnline
    ? 'متصل الآن'
    : (lastSeenValue ? `آخر ظهور ${formatThreadTime(lastSeenValue)}` : 'آخر ظهور مؤخراً');

  return {
    isOnline,
    statusText: source?.statusText || lastSeenLabel,
    lastSeenLabel: source?.lastSeenLabel || lastSeenLabel,
  };
}

function normalizeUsername(source = {}, index = 0) {
  return String(
    source?.username
      || source?.user
      || source?.peer_username
      || source?.participant_username
      || source?.name
      || `محادثة ${index + 1}`,
  ).trim();
}

export function normalizeContact(source, index = 0) {
  const username = normalizeUsername(source, index);
  const preview = getPreviewByType(source);
  const unreadCount = Number(source?.unread_count ?? source?.unreadCount ?? 0);
  const avatar = source?.avatar || source?.avatar_url || source?.image || '';
  const timeLabel = formatThreadTime(source?.last_message_at || source?.updated_at || source?.created_at) || source?.timeLabel || '';
  const presenceLabels = buildPresenceLabels(source);

  return {
    id: String(source?.id || username || `contact-${index + 1}`),
    username,
    avatar,
    preview,
    unreadCount,
    timeLabel,
    isOnline: presenceLabels.isOnline,
    statusText: presenceLabels.statusText,
    lastSeenLabel: presenceLabels.lastSeenLabel,
    handle: source?.handle || fallbackHandle(username),
    email: source?.email || '',
    phone: source?.phone || '',
    sharedMedia: Array.isArray(source?.sharedMedia) ? source.sharedMedia : [],
    avatarGradient: avatarGradient(username),
    raw: source || {},
  };
}

function dedupeContacts(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.username || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildContacts(threads = [], activeUsername = '') {
  const normalizedThreads = Array.isArray(threads)
    ? dedupeContacts(threads.map((thread, index) => normalizeContact(thread, index)))
    : [];

  if (activeUsername && !normalizedThreads.find((item) => item.username === activeUsername)) {
    normalizedThreads.unshift(normalizeContact({ username: activeUsername }, normalizedThreads.length));
  }

  return normalizedThreads.sort(
    (left, right) => Number(right.unreadCount || 0) - Number(left.unreadCount || 0)
      || String(right.timeLabel || '').localeCompare(String(left.timeLabel || '')),
  );
}

export function getContactDetails(threads = [], username = '') {
  if (!username) {
    return normalizeContact({
      username: '',
      preview: '',
      handle: '',
      email: '',
      phone: '',
      statusText: 'لا توجد محادثة محددة',
      lastSeenLabel: 'لا توجد بيانات',
    }, 0);
  }

  const contacts = buildContacts(threads, username);
  return contacts.find((item) => item.username === username) || normalizeContact({ username }, 0);
}
