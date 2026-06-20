import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getChatThreads, markMessagesSeen } from '../api/chat.js';
import { getNotifications, markNotificationRead, markNotificationsRead } from '../api/notifications.js';
import { getGroups, createGroup } from '../api/groups.js';
import { getMe, getUsers } from '../api/users.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import useIsMobile from '../hooks/useIsMobile.js';

/**
 * Inbox (v36) — الصفحة الرئيسية للشات
 * --------------------------------------------------------------
 * أُعيد تصميم الصفحة بالكامل لتطابق المرجع المُعتمد:
 *   • هيدر التطبيق العلوي والشريط السفلي يأتيان من MainLayout (مُوحَّدان).
 *   • شريط بحث مدمج بأيقونة العدسة في اليمين.
 *   • 3 تبويبات فقط: الكل (نشط افتراضياً) / الرسائل / الطلبات (بشارة عدد).
 *   • صفوف محادثة: صورة دائرية + نقطة خضراء (متصل)، اسم بالأبيض،
 *     آخر رسالة تحتها بلون رمادي مع علامة ✓✓ بنفسجية للمقروء/المُرسل،
 *     الوقت يسار الصف، وشارة عدد غير مقروء بنفسجي تحت الوقت.
 *   • البيانات حقيقية من الباك إند (getChatThreads / getNotifications / getGroups / getMe).
 *
 * ملاحظة: لا أعرض التبويب "المجموعات" داخل الشريط لأن الصورة المرجعية
 * تعرض 3 تبويبات فقط؛ والوصول للمجموعات متاح من الزر في الهيدر العلوي
 * (MobileTopBar يحتوي زر «مجموعات» بالفعل). ومع ذلك، تظهر المجموعات
 * كصفوف داخل تبويبَي «الكل» و«الطلبات/الإشعارات» إذا وُجدت.
 */

const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'messages', label: 'الرسائل' },
  { key: 'requests', label: 'الطلبات' },
];

/* ============================================================ */
/* أيقونات SVG داخلية                                            */
/* ============================================================ */
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DoubleCheckIcon() {
  // علامة قراءة مزدوجة ✓✓ بنفسجية (كما في الصورة)
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M2 13l4 4 8-10M9 17l1.2 1.2L22 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.2c0 .9-.3 1.8-.9 2.5l-1.1 1.3h13l-1.1-1.3c-.6-.7-.9-1.6-.9-2.5V9A4.5 4.5 0 0 0 12 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.8 18.2a2.5 2.5 0 0 0 4.4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="16.5" cy="8" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 18c.8-2.4 2.7-3.8 4.8-3.8s4 1.4 4.8 3.8M14.3 17.7c.4-1.8 1.7-2.9 3.5-2.9 1 0 2 .4 2.7 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function YamshatMark() {
  // شعار Y الخاص بـ Yamshat — يُستخدم كصورة افتراضية لصفوف فريق العمل
  return (
    <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true">
      <defs>
        <linearGradient id="yam-row-y" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <path d="M20 22 L50 60 L80 22 L70 22 L50 47 L30 22 Z" fill="url(#yam-row-y)" />
      <path d="M45 60 L55 60 L55 84 L45 84 Z" fill="url(#yam-row-y)" />
    </svg>
  );
}

/* ============================================================ */
/* أدوات مساعدة                                                  */
/* ============================================================ */
function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const sameDay = today.toDateString() === date.toDateString();
  if (sameDay) {
    // مثل: 8:42 م
    return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (yesterday.toDateString() === date.toDateString()) return 'أمس';
  return date.toLocaleDateString('ar-EG', { month: 'numeric', day: 'numeric' });
}

function initials(value = '') {
  return (
    String(value || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'Y'
  );
}

function gradientFromSeed(seed = '') {
  const value = Array.from(String(seed || 'YAMSHAT')).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0,
  );
  const hue = value % 360;
  return `linear-gradient(135deg, hsl(${hue} 78% 58%), hsl(${(hue + 42) % 360} 88% 62%))`;
}

function threadPreview(thread) {
  const content = String(thread?.last_message || '').trim();
  const type = String(thread?.last_message_type || 'text').toLowerCase();
  if (content) {
    if (type === 'voice') return `🎤 ${content}`;
    if (type === 'image' || type === 'photo') return `🖼️ ${content}`;
    if (type === 'video') return `🎬 ${content}`;
    if (type === 'file' || type === 'document') return `📎 ${content}`;
    return content;
  }
  if (type === 'voice') return '🎤 رسالة صوتية';
  if (type === 'image' || type === 'photo') return '🖼️ صورة';
  if (type === 'video') return '🎬 فيديو';
  if (type === 'file' || type === 'document') return '📎 ملف';
  return 'ابدأ المحادثة';
}

function normalizeThread(item = {}) {
  const username = String(item.username || item.name || '').trim();
  return {
    type: 'thread',
    id: `thread:${username}`,
    username,
    title: username,
    avatar: item.avatar || '',
    preview: threadPreview(item),
    unreadCount: Number(item.unread_count || 0),
    isOnline: Boolean(item?.presence?.is_online),
    lastSeen: item?.presence?.last_seen || item?.last_seen || null,
    timestamp: item.created_at || null,
    // إذا كانت آخر رسالة من المستخدم الحالي وقد قُرئت → نعرض ✓✓
    // نضع علامة افتراضية عند غياب unread_count كي يطابق المرجع
    seen: Number(item.unread_count || 0) === 0,
    raw: item,
  };
}

function normalizeNotificationItem(item = {}) {
  const title = String(item.title || 'إشعار جديد').trim() || 'إشعار جديد';
  const body = String(item.body || item.message || item.text || '').trim() || 'لديك تحديث جديد';
  return {
    type: 'notification',
    id: `notification:${item.id}`,
    notificationId: item.id,
    title,
    preview: body,
    unreadCount: item.is_read || item.seen ? 0 : 1,
    timestamp: item.created_at || null,
    path: item.path || item?.data?.path || '/notifications',
    raw: item,
  };
}

function normalizeGroupItem(item = {}, currentUsername = '') {
  const members = Array.isArray(item.members) ? item.members : [];
  const isMember = members.some((member) => member?.username === currentUsername);
  return {
    type: 'group',
    id: `group:${item.id}`,
    groupId: item.id,
    title: String(item.name || 'مجموعة').trim() || 'مجموعة',
    preview: item.description || `${Number(item.members_count || members.length || 0)} عضو`,
    unreadCount: Number(item.unread_count || 0),
    timestamp: item.created_at || null,
    isMember,
    raw: item,
  };
}

/* ============================================================ */
/* مكونات صغيرة                                                  */
/* ============================================================ */
function Avatar({ name, avatar, size = 56, online = false, fallback = null }) {
  const hasAvatar = Boolean(avatar);
  return (
    <div className="yam-avatar" style={{ width: size, height: size }}>
      <div
        className="yam-avatar-inner"
        style={{
          width: size,
          height: size,
          backgroundImage: hasAvatar ? `url(${avatar})` : gradientFromSeed(name),
        }}
        aria-hidden="true"
      >
        {!hasAvatar ? (fallback || <span>{initials(name)}</span>) : null}
      </div>
      {online ? <span className="yam-online-dot" aria-label="متصل" /> : null}
    </div>
  );
}

/* ============================================================ */
/* مودال إنشاء جديد (مُحتفظ به دون تغيير وظيفي)                  */
/* ============================================================ */
function ComposeModal({ open, onClose, navigate, pushToast }) {
  const [tab, setTab] = useState('chat');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setUsers([]);
      setGroupName('');
      setGroupDesc('');
      setTab('chat');
    }
  }, [open]);

  useEffect(() => {
    if (!open || tab !== 'chat') return undefined;
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const resp = await getUsers({ q: query, limit: 20 });
        const list = Array.isArray(resp?.data) ? resp.data : resp?.data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        setUsers([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [open, tab, query]);

  const handleOpenChat = useCallback(
    (user) => {
      if (!user) return;
      const username = user.username || user.user_name || user.handle;
      onClose?.();
      if (username) {
        navigate(`/chat/${encodeURIComponent(username)}`);
      } else if (user.id) {
        navigate(`/chat/${encodeURIComponent(user.id)}`);
      }
    },
    [navigate, onClose],
  );

  const handleCreateGroup = useCallback(async () => {
    const name = groupName.trim();
    if (!name) {
      pushToast?.({ type: 'info', title: 'أدخل اسم المجموعة' });
      return;
    }
    setCreatingGroup(true);
    try {
      const resp = await createGroup({ name, description: groupDesc.trim() });
      const group = resp?.data || resp;
      pushToast?.({ type: 'success', title: 'تم إنشاء المجموعة', description: name });
      onClose?.();
      if (group?.id) {
        navigate(`/groups`);
      }
    } catch {
      pushToast?.({
        type: 'warning',
        title: 'تعذر إنشاء المجموعة',
        description: 'تحقق من الاتصال وحاول مجدداً.',
      });
    } finally {
      setCreatingGroup(false);
    }
  }, [groupName, groupDesc, pushToast, onClose, navigate]);

  if (!open) return null;

  return (
    <div
      className="yam-compose-overlay"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="إنشاء جديد"
      onClick={onClose}
    >
      <div
        className="yam-compose-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <header className="yam-compose-head">
          <strong>إنشاء جديد</strong>
          <button type="button" className="yam-compose-close" onClick={onClose} aria-label="إغلاق">
            ✕
          </button>
        </header>

        <div className="yam-compose-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'chat'}
            className={`yam-compose-tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
          >
            دردشة جديدة
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'group'}
            className={`yam-compose-tab ${tab === 'group' ? 'active' : ''}`}
            onClick={() => setTab('group')}
          >
            مجموعة جديدة
          </button>
        </div>

        {tab === 'chat' ? (
          <div className="yam-compose-body">
            <input
              type="search"
              className="yam-compose-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن شخص للمحادثة..."
              aria-label="البحث عن مستخدم"
              autoFocus
            />
            <div className="yam-compose-users-list">
              {searching ? (
                <p className="yam-compose-hint">جارٍ البحث…</p>
              ) : users.length === 0 ? (
                <p className="yam-compose-hint">
                  {query ? `لا توجد نتائج لـ "${query}".` : 'ابدأ بكتابة اسم المستخدم.'}
                </p>
              ) : (
                users.map((u) => {
                  const name = u.full_name || u.name || u.username || 'مستخدم';
                  const handle = u.username || u.user_name || u.handle || '';
                  return (
                    <button
                      key={u.id || handle || name}
                      type="button"
                      className="yam-compose-user-row"
                      onClick={() => handleOpenChat(u)}
                    >
                      <span className="yam-compose-user-avatar" aria-hidden="true">
                        {(name || '?').slice(0, 1)}
                      </span>
                      <span className="yam-compose-user-meta">
                        <strong>{name}</strong>
                        {handle ? <small>@{handle}</small> : null}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="yam-compose-body">
            <label className="yam-compose-label" htmlFor="yam-group-name">
              اسم المجموعة
            </label>
            <input
              id="yam-group-name"
              type="text"
              className="yam-compose-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="مثال: عائلة تواصل"
              maxLength={80}
              autoFocus
            />
            <label className="yam-compose-label" htmlFor="yam-group-desc">
              وصف (اختياري)
            </label>
            <textarea
              id="yam-group-desc"
              className="yam-compose-input yam-compose-textarea"
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="وصف قصير للمجموعة"
              rows={3}
              maxLength={200}
            />
            <button
              type="button"
              className="yam-compose-primary"
              onClick={handleCreateGroup}
              disabled={creatingGroup || !groupName.trim()}
            >
              {creatingGroup ? 'جارٍ الإنشاء…' : 'إنشاء المجموعة'}
            </button>
          </div>
        )}

        <style>{`
          .yam-compose-overlay {
            position: fixed; inset: 0; z-index: 1200;
            background: rgba(2, 4, 12, 0.72);
            backdrop-filter: blur(6px);
            display: grid; place-items: center; padding: 16px;
          }
          .yam-compose-modal {
            width: 100%; max-width: 460px;
            background: #0B1024;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 22px; padding: 18px;
            box-shadow: 0 30px 80px rgba(0,0,0,0.55);
            color: #fff;
          }
          .yam-compose-head {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 14px;
          }
          .yam-compose-head strong { font-size: 17px; }
          .yam-compose-close {
            width: 34px; height: 34px; border-radius: 50%;
            background: rgba(255,255,255,0.06); border: 0; color: #fff;
            cursor: pointer; font-size: 14px;
          }
          .yam-compose-tabs {
            display: flex; gap: 8px; margin-bottom: 14px;
            padding: 4px; background: rgba(255,255,255,0.04);
            border-radius: 14px;
          }
          .yam-compose-tab {
            flex: 1; padding: 10px; border: 0; background: transparent;
            color: #b9bee0; font-weight: 700; border-radius: 10px;
            cursor: pointer; font-size: 14px;
          }
          .yam-compose-tab.active {
            background: linear-gradient(135deg, #8b5cf6, #6320d9);
            color: #fff;
          }
          .yam-compose-body { display: grid; gap: 10px; }
          .yam-compose-label { font-size: 13px; color: #aab0d6; }
          .yam-compose-input {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            color: #fff; padding: 12px 14px;
            border-radius: 12px; font-size: 14px;
            font-family: inherit;
          }
          .yam-compose-textarea { resize: vertical; min-height: 80px; }
          .yam-compose-users-list { display: grid; gap: 4px; max-height: 320px; overflow-y: auto; }
          .yam-compose-hint { color: #8b90b7; text-align: center; font-size: 13px; padding: 18px 8px; margin: 0; }
          .yam-compose-user-row {
            display: flex; gap: 10px; align-items: center; padding: 10px;
            border-radius: 12px; border: 1px solid transparent;
            background: transparent; color: #fff; cursor: pointer; text-align: start;
          }
          .yam-compose-user-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
          .yam-compose-user-avatar {
            width: 38px; height: 38px; border-radius: 50%;
            display: grid; place-items: center;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white; font-weight: 800; flex-shrink: 0;
          }
          .yam-compose-user-meta { display: grid; gap: 2px; }
          .yam-compose-user-meta small { color: #8b90b7; font-size: 12px; }
          .yam-compose-primary {
            margin-top: 6px; min-height: 46px; border-radius: 12px; border: none;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white; font-weight: 700; cursor: pointer; font-size: 15px;
          }
          .yam-compose-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>
      </div>
    </div>
  );
}

/* ============================================================ */
/* الصفحة الرئيسية للشات                                         */
/* ============================================================ */
export default function Inbox() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  // الـ hook مُحتفَظ به للتوافق مع باقي التطبيق
  // (يُستخدم في الإصدارات السابقة لتغيير سلوك ثانوي)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [groups, setGroups] = useState([]);
  const [profile, setProfile] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const loadData = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const results = await Promise.allSettled([
        getChatThreads(),
        getNotifications(40),
        getGroups(),
        getMe(),
      ]);

      const [threadsRes, notificationsRes, groupsRes, meRes] = results;

      if (threadsRes.status === 'fulfilled') {
        const nextThreads = Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [];
        setThreads(nextThreads.map(normalizeThread).filter((item) => item.username));
      } else {
        setThreads([]);
      }

      if (notificationsRes.status === 'fulfilled') {
        const nextNotifications = Array.isArray(notificationsRes.value?.data)
          ? notificationsRes.value.data
          : [];
        setNotifications(nextNotifications.map(normalizeNotificationItem));
      } else {
        setNotifications([]);
      }

      if (groupsRes.status === 'fulfilled') {
        setGroups(Array.isArray(groupsRes.value?.data) ? groupsRes.value.data : []);
      } else {
        setGroups([]);
      }

      if (meRes.status === 'fulfilled') {
        setProfile(meRes.value?.data || null);
      } else {
        setProfile(null);
      }

      if (results.every((entry) => entry.status === 'rejected')) {
        pushToast({
          type: 'error',
          title: 'تعذر تحميل الصفحة',
          description: 'راجع الاتصال بالخادم ثم حاول مرة أخرى.',
        });
      }

      setLoading(false);
      setRefreshing(false);
    },
    [pushToast],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // الاستماع إلى زر "+" الموحَّد في BottomNav لفتح مودال الإنشاء
  useEffect(() => {
    const handler = () => setComposeOpen(true);
    window.addEventListener('yamshat:open-compose', handler);
    return () => window.removeEventListener('yamshat:open-compose', handler);
  }, []);

  const currentUsername = useMemo(
    () => String(profile?.username || profile?.name || '').trim(),
    [profile],
  );

  const unreadMessagesCount = useMemo(
    () => threads.reduce((sum, item) => sum + Number(item.unreadCount || 0), 0),
    [threads],
  );

  const requestItems = useMemo(
    () => notifications.filter((item) => item.unreadCount > 0),
    [notifications],
  );

  const groupItems = useMemo(
    () => groups.map((item) => normalizeGroupItem(item, currentUsername)),
    [currentUsername, groups],
  );

  const requestCount = requestItems.length;

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((item) =>
      [item.title, item.preview].some((field) =>
        String(field || '').toLowerCase().includes(query),
      ),
    );
  }, [searchQuery, threads]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groupItems;
    return groupItems.filter((item) =>
      [item.title, item.preview].some((field) =>
        String(field || '').toLowerCase().includes(query),
      ),
    );
  }, [groupItems, searchQuery]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requestItems;
    return requestItems.filter((item) =>
      [item.title, item.preview].some((field) =>
        String(field || '').toLowerCase().includes(query),
      ),
    );
  }, [requestItems, searchQuery]);

  /**
   * تجميع العناصر المعروضة حسب التبويب النشط:
   *  - "الكل": المحادثات + المجموعات (مدمجة بالترتيب الزمني)
   *  - "الرسائل": المحادثات الفردية فقط
   *  - "الطلبات": الإشعارات/الطلبات غير المقروءة
   */
  const unifiedItems = useMemo(() => {
    if (activeTab === 'requests') return filteredRequests;
    if (activeTab === 'messages') return filteredThreads;
    // الكل: ندمج المحادثات + المجموعات ونرتّب حسب الوقت
    const merged = [...filteredThreads, ...filteredGroups];
    return merged.sort(
      (left, right) =>
        new Date(right.timestamp || 0).getTime() - new Date(left.timestamp || 0).getTime(),
    );
  }, [activeTab, filteredGroups, filteredRequests, filteredThreads]);

  /* -------- معالجات الأحداث -------- */
  const handleOpenThread = useCallback(
    async (thread) => {
      if (!thread?.username) return;
      try {
        if (thread.unreadCount > 0) {
          await markMessagesSeen(thread.username);
          setThreads((prev) =>
            prev.map((item) =>
              item.username === thread.username ? { ...item, unreadCount: 0, seen: true } : item,
            ),
          );
        }
      } catch {
        /* لا نمنع الانتقال */
      }
      navigate(`/chat/${encodeURIComponent(thread.username)}`);
    },
    [navigate],
  );

  const handleOpenRequest = useCallback(
    async (item) => {
      if (!item?.notificationId) return;
      try {
        await markNotificationRead(item.notificationId);
        setNotifications((prev) =>
          prev.map((entry) =>
            entry.notificationId === item.notificationId ? { ...entry, unreadCount: 0 } : entry,
          ),
        );
      } catch {
        /* ignore */
      }
      navigate(item.path || '/notifications');
    },
    [navigate],
  );

  const handleOpenGroup = useCallback(
    (group) => {
      if (!group) return;
      navigate('/groups');
    },
    [navigate],
  );

  const markAllRequestsAsRead = useCallback(async () => {
    if (!requestCount) return;
    try {
      await markNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, unreadCount: 0 })));
      pushToast({
        type: 'success',
        title: 'تم تحديث الطلبات',
        description: 'تم تعليم كل الطلبات كمقروءة.',
      });
    } catch {
      pushToast({
        type: 'warning',
        title: 'تعذر تحديث الطلبات',
        description: 'حاول مرة أخرى بعد قليل.',
      });
    }
  }, [pushToast, requestCount]);

  /* ============================================================
   *                         العرض (Render)
   * ============================================================ */
  return (
    <MainLayout>
      <section
        className="yam-inbox-page"
        dir="rtl"
        style={{ fontFamily: "'Noto Sans Arabic', 'Tajawal', system-ui, sans-serif" }}
      >
        <div className="yam-inbox-screen">
          <ComposeModal
            open={composeOpen}
            onClose={() => setComposeOpen(false)}
            navigate={navigate}
            pushToast={pushToast}
          />

          {/* ============== شريط البحث ============== */}
          <div className="yam-search-box" role="search">
            <SearchIcon />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="البحث في المحادثات"
              aria-label="البحث في المحادثات"
            />
            {refreshing ? <span className="yam-refresh-spinner" aria-hidden="true" /> : null}
          </div>

          {/* ============== التبويبات الثلاثة ============== */}
          <div className="yam-tabs" role="tablist">
            {TABS.map((tab) => {
              // عداد التبويب
              let count = 0;
              if (tab.key === 'messages') count = unreadMessagesCount;
              else if (tab.key === 'requests') count = requestCount;
              // الترتيب البصري: الطلبات يسار، الرسائل وسط، الكل يمين
              // لأن dir=rtl سيعكسها تلقائياً عند العرض
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`yam-tab ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  onDoubleClick={() => loadData(true)}
                >
                  {/* الشارة قبل النص في الـ RTL تظهر يسار النص */}
                  {count > 0 ? <strong className="yam-tab-badge">{count}</strong> : null}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ============== قائمة المحادثات ============== */}
          <div className="yam-list" role="list">
            {loading ? (
              <div className="yam-loading">جارٍ تحميل المحادثات…</div>
            ) : unifiedItems.length === 0 ? (
              <div className="yam-empty">
                <div className="yam-empty-icon">💬</div>
                <strong>
                  {activeTab === 'requests'
                    ? 'لا توجد طلبات جديدة'
                    : activeTab === 'messages'
                      ? 'لا توجد محادثات بعد'
                      : 'ابدأ محادثتك الأولى'}
                </strong>
                <span>
                  {activeTab === 'requests'
                    ? 'أي طلب جديد سيظهر فوراً في هذه المساحة.'
                    : 'اضغط زر "+" في الأسفل لبدء محادثة جديدة.'}
                </span>
                {activeTab === 'requests' && requestCount > 0 ? (
                  <button type="button" className="yam-empty-cta" onClick={markAllRequestsAsRead}>
                    تعليم الكل كمقروء
                  </button>
                ) : null}
              </div>
            ) : (
              unifiedItems.map((item) => {
                /* ----- صف إشعار / طلب ----- */
                if (item.type === 'notification') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="yam-row"
                      role="listitem"
                      onClick={() => handleOpenRequest(item)}
                    >
                      <div className="yam-row-side">
                        <span className="yam-row-time">{formatTime(item.timestamp)}</span>
                        {item.unreadCount > 0 ? (
                          <strong className="yam-row-unread">{item.unreadCount}</strong>
                        ) : null}
                      </div>
                      <div className="yam-row-main">
                        <div className="yam-row-text">
                          <strong className="yam-row-title">{item.title}</strong>
                          <div className="yam-row-preview">
                            <span className="yam-row-tick" aria-hidden="true">
                              <DoubleCheckIcon />
                            </span>
                            <p>{item.preview}</p>
                          </div>
                        </div>
                        <div className="yam-row-avatar">
                          <div className="yam-avatar" style={{ width: 56, height: 56 }}>
                            <div
                              className="yam-avatar-inner yam-avatar-system"
                              style={{ width: 56, height: 56 }}
                            >
                              <BellIcon />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }

                /* ----- صف مجموعة ----- */
                if (item.type === 'group') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="yam-row"
                      role="listitem"
                      onClick={() => handleOpenGroup(item)}
                    >
                      <div className="yam-row-side">
                        <span className="yam-row-time">{formatTime(item.timestamp)}</span>
                        {item.unreadCount > 0 ? (
                          <strong className="yam-row-unread">{item.unreadCount}</strong>
                        ) : null}
                      </div>
                      <div className="yam-row-main">
                        <div className="yam-row-text">
                          <strong className="yam-row-title">{item.title}</strong>
                          <div className="yam-row-preview">
                            <span className="yam-row-tick" aria-hidden="true">
                              <DoubleCheckIcon />
                            </span>
                            <p>{item.preview}</p>
                          </div>
                        </div>
                        <div className="yam-row-avatar">
                          <div className="yam-avatar" style={{ width: 56, height: 56 }}>
                            <div
                              className="yam-avatar-inner yam-avatar-yamshat"
                              style={{ width: 56, height: 56 }}
                            >
                              {/* استخدام شعار Y عند عدم وجود صورة مجموعة */}
                              {item.raw?.avatar ? (
                                <span
                                  className="yam-avatar-bg"
                                  style={{ backgroundImage: `url(${item.raw.avatar})` }}
                                />
                              ) : (
                                <YamshatMark />
                              )}
                            </div>
                            {/* نقطة خضراء عند نشاط حديث (المجموعات النشطة فقط) */}
                            <span className="yam-online-dot" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                }

                /* ----- صف محادثة فردية ----- */
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="yam-row"
                    role="listitem"
                    onClick={() => handleOpenThread(item)}
                  >
                    <div className="yam-row-side">
                      <span className="yam-row-time">{formatTime(item.timestamp)}</span>
                      {item.unreadCount > 0 ? (
                        <strong className="yam-row-unread">{item.unreadCount}</strong>
                      ) : null}
                    </div>
                    <div className="yam-row-main">
                      <div className="yam-row-text">
                        <strong className="yam-row-title">{item.title}</strong>
                        <div className="yam-row-preview">
                          {/* علامة ✓✓ بنفسجية فقط للمحادثات التي قرأها الطرف الآخر
                              (أي عدد غير المقروء = 0). نُخفيها عند وجود رسائل جديدة. */}
                          {item.unreadCount === 0 ? (
                            <span className="yam-row-tick" aria-hidden="true">
                              <DoubleCheckIcon />
                            </span>
                          ) : null}
                          <p>{item.preview}</p>
                        </div>
                      </div>
                      <div className="yam-row-avatar">
                        <Avatar
                          name={item.title}
                          avatar={item.avatar}
                          size={56}
                          online={item.isOnline}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ============== الأنماط (CSS) ============== */}
        <style>{`
          .yam-inbox-page {
            min-height: 100vh;
            min-height: 100dvh;
            background:
              radial-gradient(circle at top right, rgba(130, 73, 255, 0.14), transparent 22%),
              radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 20%),
              #060818;
            color: #fff;
          }
          .yam-inbox-screen {
            max-width: 520px;
            margin: 0 auto;
            /* مسافة علوية تكفي للهيدر الموحَّد (60px) + مسافة سفلية تكفي للـ BottomNav */
            padding:
              calc(76px + env(safe-area-inset-top, 0px))
              14px
              calc(120px + env(safe-area-inset-bottom, 0px));
          }

          /* ============== شريط البحث ============== */
          .yam-search-box {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #0E1530;
            border: 1px solid rgba(255,255,255,0.04);
            border-radius: 16px;
            padding: 13px 16px;
            margin-bottom: 16px;
            color: #6E73A6;
          }
          .yam-search-box svg {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
          }
          .yam-search-box input {
            flex: 1;
            background: transparent;
            border: 0;
            outline: 0;
            color: #fff;
            font-size: 14px;
            font-family: inherit;
            text-align: right;
          }
          .yam-search-box input::placeholder {
            color: #6E73A6;
            font-size: 14px;
          }
          .yam-refresh-spinner {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(139,92,246,0.25);
            border-top-color: #A78BFA;
            animation: yam-spin 0.9s linear infinite;
            flex-shrink: 0;
          }
          @keyframes yam-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          /* ============== التبويبات ============== */
          .yam-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 18px;
            /* dir=rtl سيجعل العنصر الأول (الكل) يظهر على اليمين */
          }
          .yam-tab {
            flex: 1;
            min-height: 48px;
            border: 0;
            border-radius: 999px;
            background: #0E1530;
            color: #B8BCE3;
            font-family: inherit;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: background 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease;
          }
          .yam-tab:hover {
            background: #131A3A;
          }
          .yam-tab.active {
            background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
            color: #fff;
            box-shadow: 0 10px 26px rgba(124, 58, 237, 0.42);
          }
          .yam-tab-badge {
            min-width: 22px;
            height: 22px;
            padding: 0 6px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            background: #8B5CF6;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
          }
          .yam-tab.active .yam-tab-badge {
            background: rgba(255,255,255,0.22);
            color: #fff;
          }

          /* ============== قائمة الصفوف ============== */
          .yam-list {
            display: flex;
            flex-direction: column;
          }
          .yam-row {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 16px 4px;
            background: transparent;
            border: 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            color: inherit;
            cursor: pointer;
            font-family: inherit;
            text-align: right;
            transition: background 0.18s ease;
          }
          .yam-row:hover,
          .yam-row:focus-visible {
            background: rgba(139, 92, 246, 0.04);
            outline: none;
          }
          .yam-row:last-child {
            border-bottom: 0;
          }

          /* العمود الجانبي (الوقت + شارة العدد) — يظهر على اليسار في RTL */
          .yam-row-side {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            flex-shrink: 0;
            min-width: 48px;
          }
          .yam-row-time {
            font-size: 12px;
            color: #8085AC;
            white-space: nowrap;
            font-weight: 500;
          }
          .yam-row-unread {
            min-width: 22px;
            height: 22px;
            padding: 0 7px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            background: #8B5CF6;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            line-height: 1;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          }

          /* الجزء الرئيسي (النص + الصورة) */
          .yam-row-main {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }
          .yam-row-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 6px;
            /* النص محاذٍ لليمين بسبب dir=rtl، والصورة ستكون على يمينه */
          }
          .yam-row-title {
            font-size: 17px;
            font-weight: 700;
            color: #FFFFFF;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: right;
          }
          .yam-row-preview {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #8085AC;
            font-size: 14px;
            min-width: 0;
            /* dir=rtl: العلامة ✓✓ تظهر يسار النص (بعد النص في تدفق RTL) */
            flex-direction: row;
          }
          .yam-row-preview p {
            margin: 0;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            text-align: right;
          }
          .yam-row-tick {
            display: inline-flex;
            align-items: center;
            color: #A78BFA;
            flex-shrink: 0;
          }

          /* الصورة الدائرية */
          .yam-row-avatar {
            flex-shrink: 0;
          }
          .yam-avatar {
            position: relative;
            border-radius: 50%;
            overflow: visible;
          }
          .yam-avatar-inner {
            position: relative;
            border-radius: 50%;
            background-size: cover;
            background-position: center;
            display: grid;
            place-items: center;
            color: #fff;
            font-weight: 800;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(0,0,0,0.25);
          }
          .yam-avatar-inner span {
            font-size: 18px;
            letter-spacing: 0.04em;
          }
          .yam-avatar-system {
            background: linear-gradient(135deg, rgba(139,92,246,0.32), rgba(87,28,221,0.55));
            color: #EFE6FF;
          }
          .yam-avatar-system svg {
            width: 24px;
            height: 24px;
          }
          .yam-avatar-yamshat {
            background: #0E1530;
            border: 1px solid rgba(139, 92, 246, 0.25);
          }
          .yam-avatar-bg {
            position: absolute;
            inset: 0;
            background-size: cover;
            background-position: center;
            border-radius: 50%;
          }

          .yam-online-dot {
            position: absolute;
            right: 2px;
            bottom: 2px;
            width: 13px;
            height: 13px;
            border-radius: 50%;
            background: #22C55E;
            border: 2.5px solid #060818;
            box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.45);
          }

          /* ============== حالات (تحميل/فارغ) ============== */
          .yam-loading {
            padding: 40px 16px;
            text-align: center;
            color: #8085AC;
            font-size: 14px;
          }
          .yam-empty {
            padding: 60px 20px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
          }
          .yam-empty-icon {
            font-size: 44px;
            margin-bottom: 6px;
          }
          .yam-empty strong {
            font-size: 17px;
            color: #fff;
          }
          .yam-empty span {
            color: #8085AC;
            font-size: 13px;
            max-width: 280px;
            line-height: 1.6;
          }
          .yam-empty-cta {
            margin-top: 14px;
            padding: 10px 18px;
            border-radius: 12px;
            border: 0;
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
            color: #fff;
            font-weight: 700;
            font-size: 13px;
            cursor: pointer;
            font-family: inherit;
          }

          /* استجابة شاشة أعرض (تابلت/ديسكتوب) */
          @media (min-width: 720px) {
            .yam-row-title { font-size: 18px; }
            .yam-row-preview { font-size: 14px; }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}
