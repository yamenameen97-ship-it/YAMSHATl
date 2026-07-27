import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getChatThreads, markMessagesSeen, deleteThreadApi, deleteAndBlockThreadApi, sendMessageApi } from '../api/chat.js';
import { getNotifications, markNotificationRead, markNotificationsRead } from '../api/notifications.js';
import { getGroups, createGroup } from '../api/groups.js';
import { getMe, getUsers } from '../api/users.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import useIsMobile from '../hooks/useIsMobile.js';
// v59.1 — شريط الستوريات الدائري تحت هيدر الشات (أصدقاء فقط)
import StoriesBar from '../components/stories/StoriesBar.jsx';
// v88.73 — فقاعة إعدادات الشات (بجانب البحث)
import ChatSettingsPopover from '../components/chat/ChatSettingsPopover.jsx';
// ✅ v88.76 — كاش الجلسات للتصفح بلا نت (Offline PWA)
import offlineCache from '../offline/offlineSessionCache.js';
// ✅ v88.82 — استهلاك مشاركة خارجية موجّهة للشات (Chat) + رفع الملف
import { consumePendingShare } from '../services/share/sharedIntake.js';
import mediaUploadService from '../services/media/mediaUploadService.js';

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

  // ✅ v59.13.9 FIX #5 (جزء أ): منع setUsers/setSearching بعد إغلاق المودال أو
  // بعد بحث أحدث (race condition أثناء الكتابة السريعة)
  useEffect(() => {
    if (!open || tab !== 'chat') return undefined;
    let cancelled = false;
    const handle = setTimeout(async () => {
      if (cancelled) return;
      setSearching(true);
      try {
        const resp = await getUsers({ q: query, limit: 20 });
        if (cancelled) return;
        const list = Array.isArray(resp?.data) ? resp.data : resp?.data?.users || [];
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
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

  // ✅ v59.13.9 FIX #5 (جزء أ): حماية setCreatingGroup عند إغلاق المودال
  // أثناء إنشاء مجموعة (الطلب قد يأخذ عدة ثوانٍ)
  const composeMountedRef = useRef(true);
  useEffect(() => {
    composeMountedRef.current = true;
    return () => { composeMountedRef.current = false; };
  }, []);

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
      if (!composeMountedRef.current) return;
      pushToast?.({ type: 'success', title: 'تم إنشاء المجموعة', description: name });
      onClose?.();
      if (group?.id) {
        navigate(`/groups`);
      }
    } catch {
      if (composeMountedRef.current) {
        pushToast?.({
          type: 'warning',
          title: 'تعذر إنشاء المجموعة',
          description: 'تحقق من الاتصال وحاول مجدداً.',
        });
      }
    } finally {
      if (composeMountedRef.current) setCreatingGroup(false);
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
  // ✅ v88.73: زر إعدادات الشات + فقاعة الإعدادات
  const settingsBtnRef = useRef(null);
  const [chatSettingsOpen, setChatSettingsOpen] = useState(false);
  const [settingsAnchorRect, setSettingsAnchorRect] = useState(null);
  const handleOpenChatSettings = useCallback(() => {
    try {
      const rect = settingsBtnRef.current?.getBoundingClientRect?.();
      if (rect) setSettingsAnchorRect({ top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left });
    } catch { /* ignore */ }
    setChatSettingsOpen(true);
  }, []);
  // ✅ v88.72: قائمة سياقية (فقاعة) عند الضغط المطوّل على محادثة
  const [threadActionSheet, setThreadActionSheet] = useState(null); // { username, title }
  const [threadActionLoading, setThreadActionLoading] = useState(false);
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);

  // ✅ v88.82 — فقاعة اختيار محادثة لاستقبال المحتوى المُشارَك خارجياً
  //   sharePicker = { pending, previewUrl } | null
  //   pending: الحمولة القادمة من consumePendingShare('chat')
  //   previewUrl: blob URL لعرض معاينة الملف داخل الفقاعة
  const [sharePicker, setSharePicker] = useState(null);
  const [shareUploading, setShareUploading] = useState(false);
  const [shareUploadPercent, setShareUploadPercent] = useState(0);
  const [shareUploadStage, setShareUploadStage] = useState('idle');
  const [shareError, setShareError] = useState('');
  const shareConsumedRef = useRef(false);

  // حارس الضغط المطوّل — إذا استمر 550مس نفتح الفقاعة
  const startLongPress = useCallback((thread) => {
    if (!thread?.username) return;
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setThreadActionSheet({ username: thread.username, title: thread.title || thread.username });
      // اهتزاز خفيف للتغذية الراجعة (إن دعمه الجهاز)
      try { if (navigator.vibrate) navigator.vibrate(35); } catch { /* ignore */ }
    }, 550);
  }, []);
  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);
  const closeThreadSheet = useCallback(() => {
    if (!threadActionLoading) setThreadActionSheet(null);
  }, [threadActionLoading]);

  const confirmDeleteThread = useCallback(async () => {
    if (!threadActionSheet?.username) return;
    if (!window.confirm(`هل تريد حذف دردشتك مع ${threadActionSheet.title}؟`)) return;
    const username = threadActionSheet.username;
    setThreadActionLoading(true);
    try {
      await deleteThreadApi(username);
      setThreads((prev) => prev.filter((t) => (t.username || '').toLowerCase() !== username.toLowerCase()));
      setThreadActionSheet(null);
      pushToast?.({ type: 'success', title: 'تم حذف الدردشة' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر حذف الدردشة', description: error?.response?.data?.detail || error?.message });
    } finally {
      setThreadActionLoading(false);
    }
  }, [threadActionSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmDeleteAndBlock = useCallback(async () => {
    if (!threadActionSheet?.username) return;
    if (!window.confirm(`سيتم حذف الدردشة وحظر ${threadActionSheet.title}. هل تريد المتابعة؟`)) return;
    const username = threadActionSheet.username;
    setThreadActionLoading(true);
    try {
      await deleteAndBlockThreadApi(username);
      setThreads((prev) => prev.filter((t) => (t.username || '').toLowerCase() !== username.toLowerCase()));
      setThreadActionSheet(null);
      pushToast?.({ type: 'success', title: 'تم الحذف والحظر' });
    } catch (error) {
      pushToast?.({ type: 'error', title: 'تعذر الحذف والحظر', description: error?.response?.data?.detail || error?.message });
    } finally {
      setThreadActionLoading(false);
    }
  }, [threadActionSheet]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ v59.13.9 FIX #5 (جزء ب): حماية setState الـ 8+ في loadData عند الخروج
  // من صفحة الشات (المستخدم غالباً يضغط تجريدة/مجموعة قبل انتهاء التحميل)
  const inboxMountedRef = useRef(true);
  useEffect(() => {
    inboxMountedRef.current = true;
    return () => { inboxMountedRef.current = false; };
  }, []);

  // ✅ v88.82 — استهلاك المشاركة الخارجية عند تركيب صفحة الشات
  //   الوجهة المُتوقّعة هنا 'chat'. إذا وُجدت حمولة نفتح فقاعة اختيار المحادثة.
  //   الحمولة تُستهلك مرّة واحدة فقط بحماية shareConsumedRef.
  useEffect(() => {
    if (shareConsumedRef.current) return;
    const pending = consumePendingShare('chat');
    if (!pending) return;
    shareConsumedRef.current = true;
    let previewUrl = '';
    try {
      if (pending.file) previewUrl = URL.createObjectURL(pending.file);
    } catch { /* ignore */ }
    setSharePicker({ pending, previewUrl });
    setShareUploadPercent(0);
    setShareUploadStage('idle');
    setShareError('');
    return () => {
      // تنظيف عند إعادة التحميل
      if (previewUrl) {
        try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
      }
    };
  }, []);

  const closeSharePicker = useCallback(() => {
    if (shareUploading) return; // لا نغلق أثناء الرفع
    setSharePicker((prev) => {
      if (prev?.previewUrl) {
        try { URL.revokeObjectURL(prev.previewUrl); } catch { /* ignore */ }
      }
      return null;
    });
    setShareUploadPercent(0);
    setShareUploadStage('idle');
    setShareError('');
  }, [shareUploading]);

  // ✅ v88.82 — عند اختيار محادثة كوجهة نهائية: نرفع الملف (إن وجد)
  //   ثم نستدعي sendMessageApi ثم ننتقل إلى /chat/<username>.
  const handlePickThreadForShare = useCallback(async (thread) => {
    if (!sharePicker?.pending || shareUploading) return;
    const peer = thread?.username;
    if (!peer) return;
    const pending = sharePicker.pending;

    setShareUploading(true);
    setShareError('');
    setShareUploadPercent(0);
    setShareUploadStage('preparing');

    try {
      let mediaUrl = '';
      let attachments = [];
      let type = 'text';

      // (أ) إذا لدينا ملف Blob → لُفّه في File صحيح ثم ارفعه
      if (pending.file) {
        const meta = pending.fileMeta || {};
        const asFile = pending.file instanceof File
          ? pending.file
          : new File([pending.file], meta.name || 'shared', {
              type: meta.type || pending.file?.type || 'application/octet-stream',
            });
        const uploadResult = await mediaUploadService.uploadFile(asFile, {
          onProgress: (payload) => {
            const pct = typeof payload === 'number' ? payload : Number(payload?.percent || 0);
            setShareUploadPercent(Math.max(0, Math.min(100, Math.round(pct))));
            if (payload?.stage) setShareUploadStage(payload.stage);
          },
        });
        mediaUrl = uploadResult?.mediaUrl || uploadResult?.url || uploadResult?.cdnUrl || '';
        const mime = String(meta.type || asFile.type || '').toLowerCase();
        if (mime.startsWith('image/')) type = 'image';
        else if (mime.startsWith('video/')) type = 'video';
        else if (mime.startsWith('audio/')) type = 'audio';
        else type = 'media';
        attachments = [{
          url: mediaUrl,
          media_url: mediaUrl,
          kind: type,
          mime_type: mime,
          file_name: meta.name || asFile.name,
          file_size: Number(meta.size || asFile.size || 0),
        }];
      }

      // (ب) رسالة نصية: نص الوصف/الرابط المُشارَك
      const messageText = String(pending.description || '').trim();

      setShareUploadStage('sending');
      const clientId = `share-${Date.now()}`;
      const requestPayload = {
        receiver: peer,
        message: messageText,
        media_url: mediaUrl,
        media_urls: mediaUrl ? [mediaUrl] : [],
        type: mediaUrl ? type : 'text',
        attachments,
        client_id: clientId,
      };
      await sendMessageApi(requestPayload).catch((err) => {
        // في حال فشل الإرسال، ننتقل للمحادثة على أي حال ليعيد المستخدم المحاولة يدوياً
        console.warn('[share→chat] send failed:', err?.message || err);
      });

      setShareUploadPercent(100);
      setShareUploadStage('done');

      pushToast?.({
        type: 'success',
        title: 'تمت المشاركة',
        description: `تم إرسال المحتوى إلى ${thread.title || peer}.`,
      });

      // نظّف حالة الفقاعة قبل الانتقال
      if (sharePicker.previewUrl) {
        try { URL.revokeObjectURL(sharePicker.previewUrl); } catch { /* ignore */ }
      }
      setSharePicker(null);
      setShareUploading(false);
      // انتقل إلى المحادثة نفسها
      navigate(`/chat/${encodeURIComponent(peer)}`);
    } catch (error) {
      setShareUploading(false);
      setShareUploadStage('failed');
      setShareError(error?.message || 'تعذّر إرسال المحتوى. حاول مرة أخرى.');
      pushToast?.({
        type: 'error',
        title: 'فشل المشاركة إلى الشات',
        description: error?.message || 'حاول مجدداً بعد قليل.',
      });
    }
  }, [sharePicker, shareUploading, navigate, pushToast]);

  // ✅ v88.76 Offline PWA: تحميل قائمة الدردشات من IndexedDB فوراً عند البدء
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cachedThreads = await offlineCache.getCachedThreadsSnapshot();
        if (!cancelled && Array.isArray(cachedThreads) && cachedThreads.length) {
          setThreads(cachedThreads);
          setLoading(false);
        }
      } catch (_) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

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

      // ✅ فحص واحد بعد انتهاء await — إذا المستخدم غادر الصفحة حدث setState
      if (!inboxMountedRef.current) return;

      const [threadsRes, notificationsRes, groupsRes, meRes] = results;

      if (threadsRes.status === 'fulfilled') {
        const nextThreads = Array.isArray(threadsRes.value?.data) ? threadsRes.value.data : [];
        const normalized = nextThreads.map(normalizeThread).filter((item) => item.username);
        setThreads(normalized);
        // ✅ v88.76: تخزين سناب-شوت لعرض الدردشات بلا نت
        offlineCache.cacheThreadsSnapshot(normalized).catch(() => {});
      } else {
        // ⚠️ v88.76: لا نمسح الدردشات المُخزّنة إن فشل الطلب — نبقي كاش IndexedDB
        setThreads((prev) => prev && prev.length ? prev : []);
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
   *  - "الكل": المحادثات الفردية فقط (المجموعات لها صفحتها المستقلة في /groups)
   *  - "الرسائل": المحادثات الفردية فقط
   *  - "الطلبات": الإشعارات/الطلبات غير المقروءة
   *
   * v59.13: تم حذف دمج المجموعات في تبويب "الكل" — المجموعات تبقى حصريًا
   * في قسم المجموعات (/groups) ولا تظهر في الشات.
   */
  const unifiedItems = useMemo(() => {
    if (activeTab === 'requests') return filteredRequests;
    // v59.13: "الكل" و"الرسائل" كلاهما يعرضان المحادثات الفردية فقط
    return filteredThreads;
  }, [activeTab, filteredRequests, filteredThreads]);

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

          {/* ============== شريط الستوريات الدائري (أصدقاء فقط) ============== */}
          <StoriesBar
            currentUser={profile}
            onOpenComposer={() => navigate('/stories')}
          />

          {/* ============== شريط البحث + زر إعدادات الشات ============== */}
          <div className="yam-search-row">
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
            <button
              type="button"
              ref={settingsBtnRef}
              className="yam-cs-open-btn"
              onClick={handleOpenChatSettings}
              aria-label="إعدادات الشات"
              title="إعدادات الشات"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path
                  d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7.4-2.1c.06-.45.1-.9.1-1.4s-.04-.95-.1-1.4l2-1.55a.5.5 0 0 0 .12-.63l-1.9-3.3a.5.5 0 0 0-.6-.22l-2.35.95a7.3 7.3 0 0 0-2.42-1.4l-.35-2.5a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.35 2.5a7.3 7.3 0 0 0-2.42 1.4l-2.35-.95a.5.5 0 0 0-.6.22l-1.9 3.3a.5.5 0 0 0 .12.63l2 1.55c-.06.45-.1.9-.1 1.4s.04.95.1 1.4l-2 1.55a.5.5 0 0 0-.12.63l1.9 3.3a.5.5 0 0 0 .6.22l2.35-.95a7.3 7.3 0 0 0 2.42 1.4l.35 2.5a.5.5 0 0 0 .5.42h3.8a.5.5 0 0 0 .5-.42l.35-2.5a7.3 7.3 0 0 0 2.42-1.4l2.35.95a.5.5 0 0 0 .6-.22l1.9-3.3a.5.5 0 0 0-.12-.63l-2-1.55Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <ChatSettingsPopover
            open={chatSettingsOpen}
            onClose={() => setChatSettingsOpen(false)}
            anchorRect={settingsAnchorRect}
          />

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
                    onClick={(e) => {
                      // ✅ v88.72: تجاهل النقر إذا تم الضغط المطوّل لإظهار الفقاعة
                      if (longPressFiredRef.current) {
                        longPressFiredRef.current = false;
                        e.preventDefault();
                        return;
                      }
                      handleOpenThread(item);
                    }}
                    onPointerDown={() => startLongPress(item)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    onPointerCancel={cancelLongPress}
                    onContextMenu={(e) => {
                      // ✅ v88.72: دعم النقر بالزر الأيمن على الدسكتوب
                      e.preventDefault();
                      cancelLongPress();
                      longPressFiredRef.current = true;
                      setThreadActionSheet({ username: item.username, title: item.title || item.username });
                    }}
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

        {/* ✅ v88.82 — فقاعة اختيار محادثة لاستقبال محتوى مُشارَك خارجياً */}
        {sharePicker && (
          <div
            className="yam-share-picker-layer"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="اختر محادثة للمشاركة"
          >
            <button
              type="button"
              className="yam-share-picker-backdrop"
              onClick={closeSharePicker}
              aria-label="إغلاق"
              disabled={shareUploading}
            />
            <div className="yam-share-picker">
              <div className="yam-share-picker-head">
                <div>
                  <strong>📥 محتوى مُشارك خارجي</strong>
                  <span>اختر المحادثة التي تريد إرسال المحتوى إليها</span>
                </div>
                <button
                  type="button"
                  onClick={closeSharePicker}
                  disabled={shareUploading}
                  aria-label="إغلاق"
                >✕</button>
              </div>

              {/* معاينة المحتوى المُشارَك */}
              <div className="yam-share-picker-preview">
                {sharePicker.previewUrl && sharePicker.pending?.fileMeta?.type?.startsWith('image/') ? (
                  <img src={sharePicker.previewUrl} alt="معاينة" />
                ) : sharePicker.previewUrl && sharePicker.pending?.fileMeta?.type?.startsWith('video/') ? (
                  <video src={sharePicker.previewUrl} controls preload="metadata" />
                ) : sharePicker.pending?.fileMeta ? (
                  <div className="yam-share-picker-file">
                    <span aria-hidden="true">📎</span>
                    <div>
                      <strong>{sharePicker.pending.fileMeta.name || 'ملف مُشارك'}</strong>
                      <small>{Math.max(1, Math.round((sharePicker.pending.fileMeta.size || 0) / 1024))} KB</small>
                    </div>
                  </div>
                ) : (
                  <div className="yam-share-picker-link">
                    <span aria-hidden="true">🔗</span>
                    <div>
                      <strong>{sharePicker.pending?.sourceTitle || 'رابط/نص مُشارَك'}</strong>
                      <small>{sharePicker.pending?.sourceUrl || sharePicker.pending?.description || ''}</small>
                    </div>
                  </div>
                )}
              </div>

              {/* عدّاد الرفع */}
              {shareUploading || shareUploadStage === 'done' ? (
                <div className="yam-share-picker-progress">
                  <div className="yam-share-picker-progress-head">
                    <span>
                      {shareUploadStage === 'done'
                        ? '✅ تمت المشاركة بنجاح'
                        : shareUploadStage === 'sending'
                          ? 'جارٍ إرسال الرسالة…'
                          : 'جارٍ تحضير/رفع الملف…'}
                    </span>
                    <strong>{shareUploadPercent}%</strong>
                  </div>
                  <div className="yam-share-picker-progress-track">
                    <div
                      className="yam-share-picker-progress-bar"
                      style={{ width: `${Math.max(4, shareUploadPercent)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {shareError ? (
                <div className="yam-share-picker-error" role="alert">{shareError}</div>
              ) : null}

              {/* قائمة المحادثات المتاحة */}
              <div className="yam-share-picker-list">
                {threads.length === 0 ? (
                  <div className="yam-share-picker-empty">
                    لا توجد محادثات بعد. ابدأ محادثة جديدة ثم أعد المشاركة.
                  </div>
                ) : (
                  threads.map((thread) => (
                    <button
                      key={thread.id || thread.username}
                      type="button"
                      className="yam-share-picker-thread"
                      onClick={() => handlePickThreadForShare(thread)}
                      disabled={shareUploading}
                    >
                      <Avatar
                        name={thread.title}
                        avatar={thread.avatar}
                        size={42}
                        online={thread.isOnline}
                      />
                      <div className="yam-share-picker-thread-body">
                        <strong>{thread.title || thread.username}</strong>
                        <span>{thread.preview || 'محادثة فردية'}</span>
                      </div>
                      <span className="yam-share-picker-send" aria-hidden="true">➤</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ✅ v88.72: فقاعة الخيارات عند الضغط المطوّل على محادثة */}
        {threadActionSheet && (
          <div className="yam-thread-sheet-layer" dir="rtl" role="dialog" aria-modal="true" aria-label="خيارات الدردشة">
            <button type="button" className="yam-thread-sheet-backdrop" onClick={closeThreadSheet} aria-label="إغلاق" />
            <div className="yam-thread-sheet">
              <div className="yam-thread-sheet-head">
                <strong>{threadActionSheet.title}</strong>
                <button type="button" onClick={closeThreadSheet} disabled={threadActionLoading} aria-label="إغلاق">✕</button>
              </div>
              <button
                type="button"
                className="yam-thread-sheet-btn yam-thread-sheet-delete"
                onClick={confirmDeleteThread}
                disabled={threadActionLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                <span>حذف الدردشة</span>
              </button>
              <button
                type="button"
                className="yam-thread-sheet-btn yam-thread-sheet-block"
                onClick={confirmDeleteAndBlock}
                disabled={threadActionLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                <span>الحذف والحظر</span>
              </button>
              {threadActionLoading ? (
                <div className="yam-thread-sheet-loading">جارٍ التنفيذ…</div>
              ) : null}
            </div>
          </div>
        )}

        {/* ============== الأنماط (CSS) ============== */}
        <style>{`
          /* ✅ v88.82: فقاعة اختيار محادثة لمحتوى مُشارَك خارجياً */
          .yam-share-picker-layer { position:fixed; inset:0; z-index:170; display:flex; align-items:center; justify-content:center; }
          .yam-share-picker-backdrop { position:absolute; inset:0; border:0; background:rgba(2,6,23,.72); backdrop-filter: blur(3px); }
          .yam-share-picker-backdrop:disabled { cursor:not-allowed; }
          .yam-share-picker {
            position:relative; width:min(94vw, 520px); max-height: 86vh; overflow:auto;
            padding:18px 16px 16px; border-radius:22px;
            background:#0f172a; color:#fff;
            border:1px solid rgba(139,92,246,.35);
            box-shadow:0 30px 60px rgba(2,6,23,.55);
            animation: yam-share-in .2s ease-out;
          }
          @keyframes yam-share-in { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .yam-share-picker-head { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; margin-bottom:12px; }
          .yam-share-picker-head strong { display:block; font-size:15px; color:#f5f3ff; font-weight:900; margin-bottom:4px; }
          .yam-share-picker-head span { display:block; font-size:12.5px; color:#94a3b8; line-height:1.6; }
          .yam-share-picker-head button { border:0; background:transparent; color:#fff; font-size:20px; cursor:pointer; padding:4px 10px; border-radius:8px; }
          .yam-share-picker-head button:hover:not(:disabled) { background:rgba(255,255,255,.08); }
          .yam-share-picker-head button:disabled { opacity:.5; cursor:wait; }

          .yam-share-picker-preview { border-radius:14px; overflow:hidden; background:rgba(255,255,255,.04); border:1px solid rgba(148,163,184,.14); margin-bottom:12px; }
          .yam-share-picker-preview img,
          .yam-share-picker-preview video { display:block; width:100%; max-height:220px; object-fit:cover; background:#020617; }
          .yam-share-picker-file, .yam-share-picker-link { display:flex; gap:12px; padding:14px; align-items:center; }
          .yam-share-picker-file span, .yam-share-picker-link span { width:44px; height:44px; border-radius:12px; background:rgba(139,92,246,.16); display:grid; place-items:center; font-size:22px; flex-shrink:0; }
          .yam-share-picker-file strong, .yam-share-picker-link strong { display:block; font-size:14px; }
          .yam-share-picker-file small, .yam-share-picker-link small { display:block; color:#94a3b8; font-size:12px; margin-top:2px; direction:ltr; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

          .yam-share-picker-progress { margin:6px 0 10px; padding:10px 12px; border-radius:12px; background:linear-gradient(180deg, rgba(139,92,246,.14), rgba(99,102,241,.08)); border:1px solid rgba(167,139,250,.28); }
          .yam-share-picker-progress-head { display:flex; justify-content:space-between; font-size:12.5px; color:#c4b5fd; margin-bottom:6px; }
          .yam-share-picker-progress-head strong { color:#f5f3ff; font-weight:900; }
          .yam-share-picker-progress-track { height:8px; border-radius:999px; background:rgba(255,255,255,.08); overflow:hidden; }
          .yam-share-picker-progress-bar { height:100%; background:linear-gradient(90deg, #8b5cf6, #ec4899); border-radius:999px; transition: width .3s ease; }
          .yam-share-picker-error { margin-bottom:10px; padding:10px 12px; border-radius:12px; background:rgba(239,68,68,.14); border:1px solid rgba(248,113,113,.35); color:#fecaca; font-size:13px; }

          .yam-share-picker-list { display:flex; flex-direction:column; gap:6px; margin-top:4px; }
          .yam-share-picker-empty { padding:20px; text-align:center; color:#94a3b8; font-size:14px; }
          .yam-share-picker-thread { display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid rgba(148,163,184,.12); border-radius:14px; background:rgba(255,255,255,.03); color:#fff; cursor:pointer; font-family:inherit; text-align:right; transition: background .15s ease, border-color .15s ease, transform .12s ease; }
          .yam-share-picker-thread:hover:not(:disabled) { background:rgba(139,92,246,.14); border-color:rgba(167,139,250,.55); transform: translateY(-1px); }
          .yam-share-picker-thread:disabled { opacity:.55; cursor:wait; }
          .yam-share-picker-thread-body { flex:1; min-width:0; }
          .yam-share-picker-thread-body strong { display:block; font-size:14px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .yam-share-picker-thread-body span { display:block; font-size:12px; color:#94a3b8; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
          .yam-share-picker-send { color:#a78bfa; font-size:18px; font-weight:900; }

          /* ✅ v88.72: فقاعة خيارات الدردشة */
          .yam-thread-sheet-layer { position:fixed; inset:0; z-index:150; display:flex; align-items:flex-end; justify-content:center; }
          .yam-thread-sheet-backdrop { position:absolute; inset:0; border:0; background:rgba(0,0,0,.55); }
          .yam-thread-sheet {
            position:relative; width:min(100%, 480px); margin:0 12px 18px 12px;
            padding:18px; border-radius:22px;
            background:#121222; color:#fff; box-shadow:0 -8px 30px rgba(0,0,0,.55);
            animation: yam-sheet-in .18s ease-out;
          }
          @keyframes yam-sheet-in { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @media (min-width: 768px) {
            .yam-thread-sheet-layer { align-items:center; }
            .yam-thread-sheet { margin:0; }
          }
          .yam-thread-sheet-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; font-size:16px; }
          .yam-thread-sheet-head button { border:0; background:transparent; color:#fff; font-size:20px; cursor:pointer; padding:4px 8px; border-radius:8px; }
          .yam-thread-sheet-head button:hover { background:rgba(255,255,255,.08); }
          .yam-thread-sheet-btn {
            display:flex; align-items:center; justify-content:center; gap:10px;
            width:100%; border:0; border-radius:13px; padding:14px;
            margin-top:10px; color:#fff; font:inherit; font-weight:800;
            cursor:pointer; transition: all .15s ease;
          }
          .yam-thread-sheet-btn:disabled { opacity:.6; cursor:wait; }
          .yam-thread-sheet-delete { background:rgba(239,68,68,.18); color:#ff8585; }
          .yam-thread-sheet-delete:hover:not(:disabled) { background:rgba(239,68,68,.28); }
          .yam-thread-sheet-block { background:linear-gradient(135deg,#7c2d12,#b91c1c); color:#fff; }
          .yam-thread-sheet-block:hover:not(:disabled) { background:linear-gradient(135deg,#991b1b,#dc2626); }
          .yam-thread-sheet-loading { text-align:center; margin-top:12px; color:rgba(255,255,255,.72); font-size:14px; }

          /* ✅ v88.72: تعطيل تحديد النص أثناء الضغط المطوّل على المحادثات */
          .yam-row {
            -webkit-user-select: none;
            -webkit-touch-callout: none;
            user-select: none;
          }

          /* ⭐ v59.13.31 — .yam-inbox-page هي scroll container بصمة .yam-groups-page تماماً
             height ثابت + overflow-y:auto + momentum scroll + touch-action:pan-y
             هذا يحلّ مشكلة عدم استجابة السحب من منتصف الشاشة. */
          .yam-inbox-page {
            /* ✅ height ثابت — أبعاد معروفة مسبقاً تُفعّل momentum scroll على iOS Safari */
            height: 100vh;
            height: 100dvh;
            max-height: 100dvh;
            overflow-y: auto;
            overflow-x: hidden;
            background:
              radial-gradient(circle at top right, rgba(130, 73, 255, 0.14), transparent 22%),
              radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 20%),
              #060818;
            color: #fff;
            /* ✅ السر: momentum scroll حقيقي (iOS) */
            -webkit-overflow-scrolling: touch;
            /* ✅ اللمس: pan-y نقي (السحب العمودي) */
            touch-action: pan-y;
            -ms-touch-action: pan-y;
            /* ✅ لا انعكاس bounce يبتلع التمرير */
            overscroll-behavior-y: contain;
            overscroll-behavior-x: none;
            /* ✅ لا transform/filter يكسر momentum على iOS */
            transform: none;
            -webkit-transform: none;
            filter: none;
            -webkit-filter: none;
            perspective: none;
            pointer-events: auto;
            overflow-anchor: none;
            will-change: scroll-position;
            scrollbar-width: none;
            box-sizing: border-box;
          }
          .yam-inbox-page::-webkit-scrollbar {
            display: none;
            width: 0;
            height: 0;
          }
          .yam-inbox-screen {
            max-width: 520px;
            margin: 0 auto;
            /* مسافة علوية تكفي للهيدر الموحَّد (60px) + مسافة سفلية تكفي للـ BottomNav */
            padding:
              calc(76px + env(safe-area-inset-top, 0px))
              14px
              calc(120px + env(safe-area-inset-bottom, 0px));
            /* ✅ لا overflow ذاتي — تتدفّق طبيعياً داخل .yam-inbox-page */
            min-height: auto;
            height: auto;
            max-height: none;
            overflow: visible;
            touch-action: pan-y;
            pointer-events: auto;
          }

          /* ============== شريط البحث + زر الإعدادات ============== */
          .yam-search-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 16px;
          }
          .yam-search-row .yam-search-box {
            flex: 1;
            margin-bottom: 0;
          }
          .yam-cs-open-btn {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: #0E1530;
            border: 1px solid rgba(255,255,255,0.05);
            color: #A78BFA;
            display: inline-grid;
            place-items: center;
            cursor: pointer;
            transition: background 0.18s ease, transform 0.15s ease, color 0.18s ease;
            flex-shrink: 0;
          }
          .yam-cs-open-btn:hover {
            background: rgba(139, 92, 246, 0.15);
            color: #C4B5FD;
            transform: rotate(30deg);
          }
          .yam-cs-open-btn:active {
            transform: rotate(60deg) scale(0.95);
          }

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
