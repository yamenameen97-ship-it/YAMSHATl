/**
 * ChatSettingsPopover.jsx — v88.73 (Chat Settings Bubble)
 * =========================================================
 * فقاعة إعدادات الشات تُفتح عند الضغط على زر الترس بجانب البحث في صفحة المحادثات.
 *
 * الميزات:
 *  1) زر «المحظورون والمكتومون» — يفتح قائمة بأسماء المحظورين والمكتومين،
 *     الضغط على اسم يفتح فقاعة (Bubble) لرفع الحظر/الكتم أو الرجوع.
 *  2) زر «إخفاء حالة الاتصال» — Toggle تشغيل/إيقاف.
 *  3) زر «من يستطيع مشاهدة قصتي» — يفتح فقاعة (الأصدقاء / الكل / أنا فقط).
 *  4) زر «إخفاء صورة ملفي الشخصي» — Toggle تشغيل/إيقاف.
 *  5) زر «كتم صديق من المراسلة» — يفتح فقاعة بحث وقائمة أصدقاء لاختيار من يُكتم من الرسائل.
 *     عند إرسال المكتوم/المحظور رسالة تظهر له تنبيه: «أنت محظور ومكتوم من قبل الطرف الآخر».
 *  6) زر «اختيار خلفية الدردشة» — رفع صورة من الجهاز واستخدامها خلفية للنص.
 *  7) زر «تغيير نمط الخط» — فقاعة اختيار نمط خط للرسائل.
 *
 * الحالة تُحفظ في localStorage تحت مفتاح: yamshat.chat.settings
 * إضافة إلى مفاتيح مساعدة:
 *   - yamshat.chat.dmMuted (Array<username>)
 *   - yamshat.chat.wallpaper (dataURL أو null)
 *   - yamshat.chat.fontFamily (اسم الخط)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getBlockList, getMutedUsers, unmuteUser, getUsers } from '../../api/users.js';
import { unblockUserApi } from '../../api/chat.js';

// -----------------------------
// أدوات التخزين المحلي
// -----------------------------
export const CHAT_SETTINGS_KEY = 'yamshat.chat.settings';
export const CHAT_DM_MUTED_KEY = 'yamshat.chat.dmMuted';
export const CHAT_WALLPAPER_KEY = 'yamshat.chat.wallpaper';
export const CHAT_FONT_KEY = 'yamshat.chat.fontFamily';

const DEFAULT_SETTINGS = {
  hideOnline: false,
  hideAvatar: false,
  storyPrivacy: 'friends', // friends | all | only_me
};

const FONT_OPTIONS = [
  { key: 'default', label: 'الخط الافتراضي', family: "'Noto Sans Arabic','Tajawal',system-ui,sans-serif" },
  { key: 'cairo', label: 'خط Cairo', family: "'Cairo','Noto Sans Arabic',sans-serif" },
  { key: 'tajawal', label: 'خط Tajawal', family: "'Tajawal','Noto Sans Arabic',sans-serif" },
  { key: 'amiri', label: 'خط أميري (تراثي)', family: "'Amiri','Times New Roman',serif" },
  { key: 'scheherazade', label: 'شهرزاد الجديد', family: "'Scheherazade New','Amiri',serif" },
  { key: 'reem', label: 'ريم كوفي', family: "'Reem Kufi','Cairo',sans-serif" },
  { key: 'lateef', label: 'لطيف', family: "'Lateef','Amiri',serif" },
  { key: 'mono', label: 'خط ثابت (Mono)', family: "'Courier New',monospace" },
];

export function loadChatSettings() {
  try {
    const raw = localStorage.getItem(CHAT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveChatSettings(next) {
  try {
    localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('yamshat:chat-settings-changed', { detail: next }));
  } catch { /* ignore */ }
}

export function loadDmMuted() {
  try {
    const raw = localStorage.getItem(CHAT_DM_MUTED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveDmMuted(list) {
  try {
    localStorage.setItem(CHAT_DM_MUTED_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('yamshat:dm-muted-changed', { detail: list }));
  } catch { /* ignore */ }
}

export function isDmMuted(username) {
  if (!username) return false;
  const u = String(username).toLowerCase();
  return loadDmMuted().map((x) => String(x).toLowerCase()).includes(u);
}

export function loadWallpaper() {
  try {
    return localStorage.getItem(CHAT_WALLPAPER_KEY) || null;
  } catch {
    return null;
  }
}

export function saveWallpaper(dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(CHAT_WALLPAPER_KEY, dataUrl);
    else localStorage.removeItem(CHAT_WALLPAPER_KEY);
    window.dispatchEvent(new CustomEvent('yamshat:wallpaper-changed', { detail: dataUrl }));
  } catch { /* ignore */ }
}

export function loadFontFamily() {
  try {
    return localStorage.getItem(CHAT_FONT_KEY) || FONT_OPTIONS[0].family;
  } catch {
    return FONT_OPTIONS[0].family;
  }
}

export function saveFontFamily(family) {
  try {
    localStorage.setItem(CHAT_FONT_KEY, family);
    window.dispatchEvent(new CustomEvent('yamshat:font-changed', { detail: family }));
  } catch { /* ignore */ }
}

// -----------------------------
// أيقونات SVG داخلية
// -----------------------------
function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M6 6l12 12M18 6l-12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// -----------------------------
// المكوّن الرئيسي
// -----------------------------
export default function ChatSettingsPopover({ open, onClose, anchorRect }) {
  const [settings, setSettings] = useState(loadChatSettings);
  const [view, setView] = useState('main'); // main | blocked | story | mute | wallpaper | font
  const [subBubble, setSubBubble] = useState(null); // { type, user }
  const [blocked, setBlocked] = useState([]);
  const [muted, setMuted] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [dmMuted, setDmMuted] = useState(loadDmMuted);
  const [friendsQuery, setFriendsQuery] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [searchingFriends, setSearchingFriends] = useState(false);
  const [fontFamily, setFontFamily] = useState(loadFontFamily);
  const [wallpaper, setWallpaper] = useState(loadWallpaper);
  const [toast, setToast] = useState(null);

  const fileInputRef = useRef(null);

  // إعادة التعيين عند الإغلاق
  useEffect(() => {
    if (!open) {
      setView('main');
      setSubBubble(null);
      setFriendsQuery('');
    }
  }, [open]);

  // تحميل المحظورين والمكتومين عند فتح تلك اللوحة
  useEffect(() => {
    if (!open || view !== 'blocked') return;
    let cancelled = false;
    setLoadingLists(true);
    Promise.all([
      getBlockList().catch(() => ({ data: [] })),
      getMutedUsers().catch(() => ({ data: [] })),
    ]).then(([b, m]) => {
      if (cancelled) return;
      const bl = Array.isArray(b?.data) ? b.data : (b?.data?.users || []);
      const ml = Array.isArray(m?.data) ? m.data : (m?.data?.users || []);
      setBlocked(bl);
      setMuted(ml);
    }).finally(() => {
      if (!cancelled) setLoadingLists(false);
    });
    return () => { cancelled = true; };
  }, [open, view]);

  // بحث الأصدقاء (لكتم من الرسائل)
  useEffect(() => {
    if (!open || view !== 'mute') return undefined;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setSearchingFriends(true);
      try {
        const resp = await getUsers({ q: friendsQuery, limit: 25 });
        if (cancelled) return;
        const list = Array.isArray(resp?.data) ? resp.data : resp?.data?.users || [];
        setFriendsList(list);
      } catch {
        if (!cancelled) setFriendsList([]);
      } finally {
        if (!cancelled) setSearchingFriends(false);
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [open, view, friendsQuery]);

  const notify = useCallback((msg) => {
    setToast(msg);
    window.clearTimeout(notify._t);
    notify._t = window.setTimeout(() => setToast(null), 2200);
  }, []);

  const persistSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveChatSettings(next);
      return next;
    });
  }, []);

  const handleToggleHideOnline = useCallback(() => {
    persistSettings({ hideOnline: !settings.hideOnline });
    notify(settings.hideOnline ? 'تم إظهار حالة الاتصال' : 'تم إخفاء حالة الاتصال');
  }, [settings.hideOnline, persistSettings, notify]);

  const handleToggleHideAvatar = useCallback(() => {
    persistSettings({ hideAvatar: !settings.hideAvatar });
    notify(settings.hideAvatar ? 'تم إظهار صورة الملف' : 'تم إخفاء صورة الملف');
  }, [settings.hideAvatar, persistSettings, notify]);

  const handleStoryPrivacy = useCallback((value) => {
    persistSettings({ storyPrivacy: value });
    const map = { friends: 'الأصدقاء', all: 'الكل', only_me: 'أنا فقط' };
    notify(`خصوصية القصة: ${map[value]}`);
  }, [persistSettings, notify]);

  const handleUnblock = useCallback(async (username) => {
    try {
      await unblockUserApi(username);
      setBlocked((prev) => prev.filter((u) => (u.username || u) !== username));
      notify(`تم رفع الحظر عن ${username}`);
    } catch {
      notify('تعذر رفع الحظر');
    } finally {
      setSubBubble(null);
    }
  }, [notify]);

  const handleUnmute = useCallback(async (username) => {
    try {
      await unmuteUser(username);
      setMuted((prev) => prev.filter((u) => (u.username || u) !== username));
      notify(`تم رفع الكتم عن ${username}`);
    } catch {
      notify('تعذر رفع الكتم');
    } finally {
      setSubBubble(null);
    }
  }, [notify]);

  const handleToggleDmMute = useCallback((user) => {
    const uname = user.username || user.user_name || user.handle;
    if (!uname) return;
    const key = String(uname).toLowerCase();
    const current = loadDmMuted();
    const exists = current.map((x) => String(x).toLowerCase()).includes(key);
    let next;
    if (exists) {
      next = current.filter((x) => String(x).toLowerCase() !== key);
      notify(`تم رفع الكتم عن ${uname}`);
    } else {
      next = [...current, uname];
      notify(`تم كتم ${uname} من الرسائل`);
    }
    saveDmMuted(next);
    setDmMuted(next);
  }, [notify]);

  const handleWallpaperFile = useCallback((event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('الرجاء اختيار ملف صورة');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      notify('الحجم كبير جدًا (الحد الأقصى 4MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      saveWallpaper(dataUrl);
      setWallpaper(dataUrl);
      notify('تم تعيين خلفية الدردشة');
    };
    reader.readAsDataURL(file);
  }, [notify]);

  const handleClearWallpaper = useCallback(() => {
    saveWallpaper(null);
    setWallpaper(null);
    notify('تم إزالة الخلفية');
  }, [notify]);

  const handlePickFont = useCallback((family, label) => {
    saveFontFamily(family);
    setFontFamily(family);
    notify(`تم تغيير الخط إلى: ${label}`);
  }, [notify]);

  const currentFontLabel = useMemo(
    () => FONT_OPTIONS.find((f) => f.family === fontFamily)?.label || 'مخصص',
    [fontFamily],
  );

  const combinedLocked = useMemo(() => {
    const items = [];
    blocked.forEach((u) => items.push({ ...u, kind: 'blocked' }));
    muted.forEach((u) => items.push({ ...u, kind: 'muted' }));
    return items;
  }, [blocked, muted]);

  if (!open) return null;

  // موقع الفقاعة بجانب زر الترس
  const popStyle = anchorRect
    ? {
        top: Math.min(anchorRect.bottom + 8, window.innerHeight - 480),
        left: Math.max(8, Math.min(anchorRect.right - 320, window.innerWidth - 340)),
      }
    : { top: 80, left: 20 };

  return (
    <>
      <div className="yam-cs-backdrop" onClick={onClose} role="presentation" />
      <div className="yam-cs-popover" style={popStyle} dir="rtl" role="dialog" aria-label="إعدادات الشات">
        {/* ============ الرأس ============ */}
        <div className="yam-cs-head">
          {view !== 'main' ? (
            <button type="button" className="yam-cs-icon-btn" onClick={() => setView('main')} aria-label="رجوع">
              <BackIcon />
            </button>
          ) : <span style={{ width: 28 }} />}
          <strong className="yam-cs-title">
            {view === 'main' && 'إعدادات الشات'}
            {view === 'blocked' && 'المحظورون والمكتومون'}
            {view === 'story' && 'من يستطيع مشاهدة قصتي'}
            {view === 'mute' && 'كتم صديق من المراسلة'}
            {view === 'wallpaper' && 'خلفية الدردشة'}
            {view === 'font' && 'نمط الخط'}
          </strong>
          <button type="button" className="yam-cs-icon-btn" onClick={onClose} aria-label="إغلاق">
            <CloseIcon />
          </button>
        </div>

        {/* ============ الجسم ============ */}
        <div className="yam-cs-body">
          {view === 'main' && (
            <>
              <button type="button" className="yam-cs-row" onClick={() => setView('blocked')}>
                <span className="yam-cs-row-ico">🚫</span>
                <span className="yam-cs-row-label">المحظورون والمكتومون</span>
                <span className="yam-cs-row-chev"><ChevronIcon /></span>
              </button>

              <div className="yam-cs-row yam-cs-row-toggle">
                <span className="yam-cs-row-ico">👁️‍🗨️</span>
                <span className="yam-cs-row-label">إخفاء حالة الاتصال</span>
                <button
                  type="button"
                  className={`yam-cs-toggle ${settings.hideOnline ? 'on' : ''}`}
                  onClick={handleToggleHideOnline}
                  aria-pressed={settings.hideOnline}
                  aria-label="إخفاء حالة الاتصال"
                >
                  <span className="yam-cs-toggle-dot" />
                </button>
              </div>

              <button type="button" className="yam-cs-row" onClick={() => setView('story')}>
                <span className="yam-cs-row-ico">📖</span>
                <span className="yam-cs-row-label">من يستطيع مشاهدة قصتي</span>
                <span className="yam-cs-row-hint">
                  {settings.storyPrivacy === 'friends' && 'الأصدقاء'}
                  {settings.storyPrivacy === 'all' && 'الكل'}
                  {settings.storyPrivacy === 'only_me' && 'أنا فقط'}
                </span>
                <span className="yam-cs-row-chev"><ChevronIcon /></span>
              </button>

              <div className="yam-cs-row yam-cs-row-toggle">
                <span className="yam-cs-row-ico">🖼️</span>
                <span className="yam-cs-row-label">إخفاء صورة ملفي الشخصي</span>
                <button
                  type="button"
                  className={`yam-cs-toggle ${settings.hideAvatar ? 'on' : ''}`}
                  onClick={handleToggleHideAvatar}
                  aria-pressed={settings.hideAvatar}
                  aria-label="إخفاء صورة الملف"
                >
                  <span className="yam-cs-toggle-dot" />
                </button>
              </div>

              <button type="button" className="yam-cs-row" onClick={() => setView('mute')}>
                <span className="yam-cs-row-ico">🔇</span>
                <span className="yam-cs-row-label">كتم صديق من المراسلة</span>
                <span className="yam-cs-row-hint">{dmMuted.length ? `${dmMuted.length} مكتوم` : ''}</span>
                <span className="yam-cs-row-chev"><ChevronIcon /></span>
              </button>

              <button type="button" className="yam-cs-row" onClick={() => setView('wallpaper')}>
                <span className="yam-cs-row-ico">🎨</span>
                <span className="yam-cs-row-label">خلفية الدردشة</span>
                <span className="yam-cs-row-hint">{wallpaper ? 'مخصصة' : 'افتراضية'}</span>
                <span className="yam-cs-row-chev"><ChevronIcon /></span>
              </button>

              <button type="button" className="yam-cs-row" onClick={() => setView('font')}>
                <span className="yam-cs-row-ico">🔤</span>
                <span className="yam-cs-row-label">تغيير نمط الخط</span>
                <span className="yam-cs-row-hint">{currentFontLabel}</span>
                <span className="yam-cs-row-chev"><ChevronIcon /></span>
              </button>
            </>
          )}

          {/* ---------- المحظورون والمكتومون ---------- */}
          {view === 'blocked' && (
            <div className="yam-cs-panel">
              {loadingLists ? (
                <div className="yam-cs-empty">جارٍ التحميل…</div>
              ) : combinedLocked.length === 0 ? (
                <div className="yam-cs-empty">لا يوجد محظورون أو مكتومون</div>
              ) : combinedLocked.map((u, idx) => {
                const uname = u.username || u.user_name || (typeof u === 'string' ? u : '') || `user-${idx}`;
                return (
                  <button
                    key={`${u.kind}-${uname}-${idx}`}
                    type="button"
                    className="yam-cs-user-row"
                    onClick={() => setSubBubble({ type: u.kind, user: { ...u, username: uname } })}
                  >
                    <span className="yam-cs-avatar">
                      {u.avatar_url || u.avatar ? (
                        <img src={u.avatar_url || u.avatar} alt="" />
                      ) : (
                        <span>{String(uname).charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="yam-cs-user-info">
                      <strong>{u.full_name || uname}</strong>
                      <small>@{uname}</small>
                    </span>
                    <span className={`yam-cs-tag ${u.kind}`}>
                      {u.kind === 'blocked' ? 'محظور' : 'مكتوم'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ---------- خصوصية القصة ---------- */}
          {view === 'story' && (
            <div className="yam-cs-panel">
              {[
                { key: 'friends', label: 'الأصدقاء', desc: 'الأصدقاء فقط سيرون قصتك' },
                { key: 'all', label: 'الكل', desc: 'أي شخص يستطيع مشاهدة قصتك' },
                { key: 'only_me', label: 'أنا فقط', desc: 'قصتك ستكون خاصة بك فقط' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  className={`yam-cs-choice ${settings.storyPrivacy === opt.key ? 'selected' : ''}`}
                  onClick={() => handleStoryPrivacy(opt.key)}
                >
                  <span className="yam-cs-choice-info">
                    <strong>{opt.label}</strong>
                    <small>{opt.desc}</small>
                  </span>
                  {settings.storyPrivacy === opt.key ? <CheckIcon /> : null}
                </button>
              ))}
            </div>
          )}

          {/* ---------- كتم صديق من المراسلة ---------- */}
          {view === 'mute' && (
            <div className="yam-cs-panel">
              <div className="yam-cs-search">
                <input
                  type="search"
                  value={friendsQuery}
                  onChange={(e) => setFriendsQuery(e.target.value)}
                  placeholder="ابحث عن صديق لكتمه…"
                  aria-label="بحث عن صديق"
                />
              </div>
              {searchingFriends ? (
                <div className="yam-cs-empty">جارٍ البحث…</div>
              ) : friendsList.length === 0 ? (
                <div className="yam-cs-empty">لا نتائج</div>
              ) : friendsList.map((u, idx) => {
                const uname = u.username || u.user_name || u.handle;
                if (!uname) return null;
                const isMuted = dmMuted.map((x) => String(x).toLowerCase()).includes(String(uname).toLowerCase());
                return (
                  <button
                    key={`${uname}-${idx}`}
                    type="button"
                    className={`yam-cs-user-row ${isMuted ? 'muted' : ''}`}
                    onClick={() => handleToggleDmMute(u)}
                  >
                    <span className="yam-cs-avatar">
                      {u.avatar_url || u.avatar ? (
                        <img src={u.avatar_url || u.avatar} alt="" />
                      ) : (
                        <span>{String(uname).charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="yam-cs-user-info">
                      <strong>{u.full_name || uname}</strong>
                      <small>@{uname}</small>
                    </span>
                    <span className={`yam-cs-tag ${isMuted ? 'muted' : ''}`}>
                      {isMuted ? 'اضغط لرفع الكتم' : 'كتم'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ---------- خلفية الدردشة ---------- */}
          {view === 'wallpaper' && (
            <div className="yam-cs-panel">
              <div className="yam-cs-wp-preview" style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}>
                {!wallpaper && <span>معاينة الخلفية</span>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleWallpaperFile}
              />
              <button type="button" className="yam-cs-primary" onClick={() => fileInputRef.current?.click()}>
                📤 رفع صورة من الجهاز
              </button>
              {wallpaper && (
                <button type="button" className="yam-cs-secondary" onClick={handleClearWallpaper}>
                  🗑️ إزالة الخلفية
                </button>
              )}
              <p className="yam-cs-note">
                الصورة تُستخدم كخلفية داخل الدردشة بين شخصين، ورسائلك تظهر فوقها.
              </p>
            </div>
          )}

          {/* ---------- نمط الخط ---------- */}
          {view === 'font' && (
            <div className="yam-cs-panel">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`yam-cs-choice ${fontFamily === f.family ? 'selected' : ''}`}
                  onClick={() => handlePickFont(f.family, f.label)}
                  style={{ fontFamily: f.family }}
                >
                  <span className="yam-cs-choice-info">
                    <strong>{f.label}</strong>
                    <small>مرحباً — نمط الرسائل سيصبح بهذا الشكل</small>
                  </span>
                  {fontFamily === f.family ? <CheckIcon /> : null}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============ فقاعة رفع الحظر/الكتم ============ */}
        {subBubble && (
          <>
            <div className="yam-cs-sub-backdrop" onClick={() => setSubBubble(null)} />
            <div className="yam-cs-sub-bubble" role="dialog">
              <div className="yam-cs-sub-head">
                <strong>{subBubble.user.full_name || subBubble.user.username}</strong>
                <small>@{subBubble.user.username}</small>
              </div>
              <div className="yam-cs-sub-actions">
                {subBubble.type === 'blocked' ? (
                  <button type="button" className="yam-cs-primary" onClick={() => handleUnblock(subBubble.user.username)}>
                    🔓 رفع الحظر
                  </button>
                ) : (
                  <button type="button" className="yam-cs-primary" onClick={() => handleUnmute(subBubble.user.username)}>
                    🔊 رفع الكتم
                  </button>
                )}
                <button type="button" className="yam-cs-secondary" onClick={() => setSubBubble(null)}>
                  إلغاء الرفع والرجوع
                </button>
              </div>
            </div>
          </>
        )}

        {toast && <div className="yam-cs-toast">{toast}</div>}

        {/* ============ الأنماط ============ */}
        <style>{`
          .yam-cs-backdrop {
            position: fixed; inset: 0;
            background: rgba(3, 6, 20, 0.55);
            backdrop-filter: blur(2px);
            z-index: 9998;
          }
          .yam-cs-popover {
            position: fixed;
            width: 340px;
            max-width: calc(100vw - 24px);
            max-height: 78vh;
            background: linear-gradient(180deg, #101635 0%, #0B1128 100%);
            border: 1px solid rgba(139, 92, 246, 0.25);
            border-radius: 18px;
            box-shadow: 0 22px 60px rgba(0,0,0,0.55);
            z-index: 9999;
            display: flex; flex-direction: column;
            overflow: hidden;
            color: #fff;
            font-family: 'Noto Sans Arabic','Tajawal',system-ui,sans-serif;
          }
          .yam-cs-head {
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            background: rgba(139, 92, 246, 0.06);
          }
          .yam-cs-title { font-size: 15px; font-weight: 900; color: #fff; }
          .yam-cs-icon-btn {
            width: 28px; height: 28px; border-radius: 8px;
            display: inline-grid; place-items: center;
            border: 0; background: transparent; color: #B8BCE3; cursor: pointer;
          }
          .yam-cs-icon-btn:hover { background: rgba(255,255,255,0.06); color: #fff; }
          .yam-cs-body { flex: 1; overflow-y: auto; padding: 8px; }
          .yam-cs-row, .yam-cs-user-row, .yam-cs-choice {
            display: flex; align-items: center; gap: 10px;
            width: 100%; padding: 12px 12px;
            background: transparent; border: 0; border-radius: 12px;
            color: #E7EAF8; font-family: inherit; text-align: right;
            cursor: pointer; transition: background 0.15s ease;
          }
          .yam-cs-row:hover, .yam-cs-user-row:hover, .yam-cs-choice:hover {
            background: rgba(139, 92, 246, 0.08);
          }
          .yam-cs-row-ico { font-size: 18px; width: 24px; text-align: center; }
          .yam-cs-row-label { flex: 1; font-weight: 700; font-size: 14px; }
          .yam-cs-row-hint { font-size: 11.5px; color: #8B90B8; font-weight: 600; }
          .yam-cs-row-chev { color: #6E73A6; display: inline-grid; place-items: center; }
          .yam-cs-row-toggle { cursor: default; }
          .yam-cs-row-toggle:hover { background: transparent; }
          .yam-cs-toggle {
            width: 44px; height: 24px; border-radius: 999px;
            background: #232A55; border: 0; cursor: pointer;
            position: relative; transition: background 0.2s ease;
            flex-shrink: 0;
          }
          .yam-cs-toggle-dot {
            position: absolute; top: 3px; right: 3px;
            width: 18px; height: 18px; border-radius: 50%;
            background: #fff; transition: transform 0.2s ease;
          }
          .yam-cs-toggle.on { background: linear-gradient(135deg,#8B5CF6,#7C3AED); }
          .yam-cs-toggle.on .yam-cs-toggle-dot { transform: translateX(-20px); }

          .yam-cs-panel { display: flex; flex-direction: column; gap: 6px; padding: 4px 4px 12px; }
          .yam-cs-empty {
            padding: 24px 12px; text-align: center; color: #8B90B8; font-size: 13px;
          }
          .yam-cs-avatar {
            width: 40px; height: 40px; border-radius: 50%;
            background: linear-gradient(135deg,#8B5CF6,#7C3AED);
            display: inline-grid; place-items: center;
            color: #fff; font-weight: 900; overflow: hidden; flex-shrink: 0;
          }
          .yam-cs-avatar img { width: 100%; height: 100%; object-fit: cover; }
          .yam-cs-user-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
          .yam-cs-user-info strong { font-size: 13.5px; font-weight: 800; color: #fff; }
          .yam-cs-user-info small { font-size: 11.5px; color: #8B90B8; }
          .yam-cs-tag {
            font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 999px;
            background: rgba(139, 92, 246, 0.15); color: #A78BFA;
          }
          .yam-cs-tag.blocked { background: rgba(239,68,68,0.15); color: #F87171; }
          .yam-cs-tag.muted { background: rgba(245,158,11,0.15); color: #FBBF24; }

          .yam-cs-choice {
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.02);
          }
          .yam-cs-choice.selected {
            border-color: rgba(139, 92, 246, 0.5);
            background: rgba(139, 92, 246, 0.10);
            color: #fff;
          }
          .yam-cs-choice-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
          .yam-cs-choice-info strong { font-size: 14px; font-weight: 800; }
          .yam-cs-choice-info small { font-size: 11.5px; color: #8B90B8; }

          .yam-cs-search {
            padding: 4px 4px 10px;
          }
          .yam-cs-search input {
            width: 100%; padding: 10px 12px; border-radius: 12px;
            background: #0E1530; border: 1px solid rgba(255,255,255,0.05);
            color: #fff; font-family: inherit; text-align: right; outline: none;
            font-size: 13.5px;
          }
          .yam-cs-search input:focus { border-color: rgba(139, 92, 246, 0.5); }

          .yam-cs-primary, .yam-cs-secondary {
            width: 100%; padding: 12px; border-radius: 12px;
            border: 0; cursor: pointer; font-weight: 800; font-family: inherit;
            font-size: 13.5px; margin-top: 8px;
          }
          .yam-cs-primary {
            background: linear-gradient(135deg,#8B5CF6,#7C3AED); color: #fff;
            box-shadow: 0 6px 18px rgba(124,58,237,0.35);
          }
          .yam-cs-secondary {
            background: rgba(255,255,255,0.06); color: #E7EAF8;
          }

          .yam-cs-wp-preview {
            width: 100%; height: 120px; border-radius: 12px;
            background: #0E1530 center/cover no-repeat;
            border: 1px dashed rgba(139, 92, 246, 0.35);
            display: grid; place-items: center;
            color: #6E73A6; font-size: 12px;
            margin-bottom: 8px;
          }
          .yam-cs-note {
            margin: 12px 4px 0; font-size: 11.5px; color: #8B90B8; line-height: 1.7;
          }

          .yam-cs-sub-backdrop {
            position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 10000;
          }
          .yam-cs-sub-bubble {
            position: fixed; top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 300px; max-width: calc(100vw - 32px);
            background: #121A3D; border-radius: 16px;
            border: 1px solid rgba(139, 92, 246, 0.35);
            padding: 16px; z-index: 10001; color: #fff;
            box-shadow: 0 22px 60px rgba(0,0,0,0.55);
          }
          .yam-cs-sub-head { text-align: center; margin-bottom: 14px; }
          .yam-cs-sub-head strong { display: block; font-size: 15px; font-weight: 900; }
          .yam-cs-sub-head small { color: #8B90B8; font-size: 12px; }
          .yam-cs-sub-actions { display: flex; flex-direction: column; gap: 6px; }

          .yam-cs-toast {
            position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
            padding: 10px 18px; background: #1a2450; color: #fff;
            border-radius: 999px; font-size: 13px; font-weight: 700;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            border: 1px solid rgba(139,92,246,0.4);
            z-index: 10002; animation: yam-cs-fade 0.25s ease;
          }
          @keyframes yam-cs-fade {
            from { opacity: 0; transform: translate(-50%, 10px); }
            to { opacity: 1; transform: translate(-50%, 0); }
          }
        `}</style>
      </div>
    </>
  );
}

export { FONT_OPTIONS };
