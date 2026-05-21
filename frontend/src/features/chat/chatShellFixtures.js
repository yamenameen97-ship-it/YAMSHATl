import { avatarGradient } from '../../components/yamshat/YamshatDesign.js';

export const CHAT_NAV_ITEMS = [
  { key: 'chats', label: 'الدردشات', icon: '💬' },
  { key: 'groups', label: 'المجموعات', icon: '👥' },
  { key: 'friends', label: 'الأصدقاء', icon: '👤' },
  { key: 'notifications', label: 'الإشعارات', icon: '🔔' },
  { key: 'settings', label: 'الإعدادات', icon: '⚙️' },
];

export const CHAT_FIXTURE_CONTACTS = [
  {
    username: 'سارة أحمد',
    preview: 'هل وصلت للملف الذي أرسلته لك؟',
    unreadCount: 2,
    statusText: 'متصل الآن',
    timeLabel: '10:45',
    lastSeenLabel: 'متصل الآن',
    handle: '@sara_ahmed',
    email: 'sara.a@example.com',
    phone: '+966 50 456 1100',
  },
  {
    username: 'محمد علي',
    preview: 'تم إرسال التقرير، يرجى مراجعته.',
    unreadCount: 1,
    statusText: 'متصل الآن',
    timeLabel: '09:30',
    lastSeenLabel: 'متصل الآن',
    handle: '@mohamed_ali',
    email: 'm.ali@example.com',
    phone: '+966 50 456 1101',
  },
  {
    username: 'فاطمة خالد',
    preview: 'يمكنني مراجعة الملف حالاً.',
    unreadCount: 0,
    statusText: 'آخر ظهور منذ دقيقة',
    timeLabel: '10:34',
    lastSeenLabel: 'آخر ظهور منذ دقيقة',
    handle: '@fatima_khaled',
    email: 'fatima.k@example.com',
    phone: '+966 50 123 4567',
  },
  {
    username: 'أحمد وليد',
    preview: 'شكراً على المتابعة 🙏',
    unreadCount: 0,
    statusText: 'آخر ظهور منذ 10 دقائق',
    timeLabel: 'أمس',
    lastSeenLabel: 'آخر ظهور منذ 10 دقائق',
    handle: '@ahmed_waleed',
    email: 'ahmed.w@example.com',
    phone: '+966 50 456 1102',
  },
  {
    username: 'نور ياسر',
    preview: 'تمام، سأواصل مع الفريق وأخبرك',
    unreadCount: 0,
    statusText: 'آخر ظهور منذ ساعة',
    timeLabel: 'أمس',
    lastSeenLabel: 'آخر ظهور منذ ساعة',
    handle: '@nour_yasser',
    email: 'nour.y@example.com',
    phone: '+966 50 456 1103',
  },
  {
    username: 'علي حسن',
    preview: 'متى موعد الاجتماع القادم؟',
    unreadCount: 0,
    statusText: 'آخر ظهور منذ ساعتين',
    timeLabel: 'أمس',
    lastSeenLabel: 'آخر ظهور منذ ساعتين',
    handle: '@ali_hassan',
    email: 'ali.h@example.com',
    phone: '+966 50 456 1104',
  },
  {
    username: 'مريم عبد الله',
    preview: 'تم استلام الطلب، شكراً لك!',
    unreadCount: 0,
    statusText: 'آخر ظهور السبت',
    timeLabel: 'السبت',
    lastSeenLabel: 'آخر ظهور السبت',
    handle: '@maryam_abdullah',
    email: 'maryam.a@example.com',
    phone: '+966 50 456 1105',
  },
  {
    username: 'خالد السعيد',
    preview: 'يمكنك مشاركة الملفات هنا.',
    unreadCount: 0,
    statusText: 'آخر ظهور السبت',
    timeLabel: 'السبت',
    lastSeenLabel: 'آخر ظهور السبت',
    handle: '@khaled_saeed',
    email: 'khaled.s@example.com',
    phone: '+966 50 456 1106',
  },
  {
    username: 'منال فهد',
    preview: 'أتمنى لك يوماً سعيداً 🙂',
    unreadCount: 0,
    statusText: 'آخر ظهور الجمعة',
    timeLabel: 'الجمعة',
    lastSeenLabel: 'آخر ظهور الجمعة',
    handle: '@manal_fahad',
    email: 'manal.f@example.com',
    phone: '+966 50 456 1107',
  },
  {
    username: 'فهد أحمد',
    preview: 'سأرسل لك التفاصيل قريباً.',
    unreadCount: 0,
    statusText: 'آخر ظهور الخميس',
    timeLabel: 'الخميس',
    lastSeenLabel: 'آخر ظهور الخميس',
    handle: '@fahad_ahmed',
    email: 'fahad.a@example.com',
    phone: '+966 50 456 1108',
  },
  {
    username: 'إيمان صالح',
    preview: 'تم التحديث بنجاح.',
    unreadCount: 0,
    statusText: 'آخر ظهور الخميس',
    timeLabel: 'الخميس',
    lastSeenLabel: 'آخر ظهور الخميس',
    handle: '@eman_saleh',
    email: 'eman.s@example.com',
    phone: '+966 50 456 1109',
  },
];

const gradientMedia = ['purple', 'blue', 'pink', 'teal', 'amber'];

function fallbackHandle(name = '') {
  return `@${String(name || 'user')
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()}`;
}

function fallbackEmail(name = '') {
  return `${String(name || 'user')
    .trim()
    .replace(/\s+/g, '.')
    .toLowerCase()}@example.com`;
}

function fallbackPhone(index = 0) {
  return `+966 50 ${String(120 + index).padStart(3, '0')} ${String(4000 + index).padStart(4, '0')}`;
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

  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 1) return 'أمس';
  return date.toLocaleDateString('ar-EG', { weekday: 'long' });
}

export function normalizeContact(source, index = 0) {
  const fixture = CHAT_FIXTURE_CONTACTS.find((item) => item.username === source?.username) || {};
  const username = source?.username || fixture.username || `مستخدم ${index + 1}`;
  const preview = source?.last_message || source?.preview || fixture.preview || 'ابدأ المحادثة الآن';
  const unreadCount = Number(source?.unread_count ?? source?.unreadCount ?? fixture.unreadCount ?? 0);
  const avatar = source?.avatar || fixture.avatar || '';
  const timeLabel = formatThreadTime(source?.last_message_at || source?.created_at) || source?.timeLabel || fixture.timeLabel || '';
  const isOnline = Boolean(source?.is_online ?? source?.isOnline ?? /متصل الآن/.test(fixture.statusText || ''));

  return {
    id: username,
    username,
    avatar,
    preview,
    unreadCount,
    timeLabel,
    isOnline,
    statusText: source?.statusText || fixture.statusText || (isOnline ? 'متصل الآن' : 'آخر ظهور مؤخراً'),
    lastSeenLabel: source?.lastSeenLabel || fixture.lastSeenLabel || (isOnline ? 'متصل الآن' : 'آخر ظهور مؤخراً'),
    handle: source?.handle || fixture.handle || fallbackHandle(username),
    email: source?.email || fixture.email || fallbackEmail(username),
    phone: source?.phone || fixture.phone || fallbackPhone(index),
    sharedMedia: Array.from({ length: 4 }).map((_, mediaIndex) => ({
      id: `${username}-media-${mediaIndex}`,
      tone: gradientMedia[(index + mediaIndex) % gradientMedia.length],
      label: mediaIndex % 2 === 0 ? 'صورة' : 'ملف',
    })),
    avatarGradient: avatarGradient(username),
  };
}

export function buildContacts(threads = [], activeUsername = '') {
  const normalizedThreads = Array.isArray(threads)
    ? threads.map((thread, index) => normalizeContact(thread, index))
    : [];

  const seen = new Set(normalizedThreads.map((item) => item.username));
  const merged = [...normalizedThreads];

  CHAT_FIXTURE_CONTACTS.forEach((item, index) => {
    if (!seen.has(item.username)) {
      merged.push(normalizeContact(item, normalizedThreads.length + index));
    }
  });

  if (activeUsername && !merged.find((item) => item.username === activeUsername)) {
    merged.unshift(normalizeContact({ username: activeUsername }, merged.length));
  }

  return merged;
}

export function getContactDetails(threads = [], username = '') {
  return buildContacts(threads, username).find((item) => item.username === username) || normalizeContact({ username }, 0);
}
