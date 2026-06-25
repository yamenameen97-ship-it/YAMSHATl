import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import {
  acceptFriendRequest,
  dismissSuggestion,
  getFriendSuggestions,
  getFriends,
  getFriendsStats,
  getReceivedRequests,
  getSentRequests,
  removeFriendship,
  searchFriendsCandidates,
  sendFriendRequest,
} from '../api/friends.js';

/* ============================================================
   صفحة الأصدقاء الرئيسية
   - تبويبتان: "أصدقاؤك" / "الاقتراحات"
   - قسم "طلبات الصداقة" مع زرَّي تأكيد/حذف
   - قسم "أشخاص قد تعرفهم" مع إضافة/إلغاء/إزالة
   - بحث instant بالاسم في الأعلى
   - رابط "عرض الكل"
   ============================================================ */

const TABS = [
  { key: 'friends', label: 'أصدقاؤك' },
  { key: 'suggestions', label: 'الاقتراحات' },
];

function Avatar({ user, size = 56 }) {
  if (user?.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid rgba(167,139,250,0.18)',
        }}
      />
    );
  }
  const letter = (user?.username || '?').slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
        color: '#f5f3ff',
        display: 'grid',
        placeItems: 'center',
        fontWeight: 800,
        fontSize: size * 0.4,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

/** بطاقة طلب صداقة (وارد): تأكيد / حذف */
function RequestRow({ user, busy, onAccept, onDecline }) {
  const friendshipId = user?.friendship?.friendship_id;
  const isBusyAccept = busy === `accept-${friendshipId}`;
  const isBusyDecline = busy === `decline-${friendshipId}`;
  return (
    <Card className="friend-row">
      <Avatar user={user} />
      <div className="friend-row-meta">
        <Link to={`/profile/${encodeURIComponent(user.username)}`} className="friend-row-name">
          {user.username}
        </Link>
        {user.mutual_friends ? (
          <span className="friend-row-sub">{user.mutual_friends} صديق مشترك</span>
        ) : (
          <span className="friend-row-sub">طلب صداقة جديد</span>
        )}
      </div>
      <div className="friend-row-actions">
        <Button onClick={() => onAccept(friendshipId)} loading={isBusyAccept} disabled={isBusyAccept || isBusyDecline}>
          تأكيد
        </Button>
        <Button variant="secondary" onClick={() => onDecline(friendshipId)} loading={isBusyDecline} disabled={isBusyAccept || isBusyDecline}>
          حذف
        </Button>
      </div>
    </Card>
  );
}

/** بطاقة شخص في الاقتراحات: إضافة / إلغاء الطلب + إزالة */
function SuggestionRow({ user, busy, onSend, onCancel, onDismiss }) {
  const status = user?.friendship?.status || 'none';
  const direction = user?.friendship?.direction;
  const friendshipId = user?.friendship?.friendship_id;

  const isBusyAdd = busy === `add-${user.username}`;
  const isBusyCancel = busy === `cancel-${friendshipId}`;
  const isBusyDismiss = busy === `dismiss-${user.username}`;

  const pendingOutgoing = status === 'pending' && direction === 'outgoing';
  const accepted = status === 'accepted';

  return (
    <Card className="friend-row">
      <Avatar user={user} />
      <div className="friend-row-meta">
        <Link to={`/profile/${encodeURIComponent(user.username)}`} className="friend-row-name">
          {user.username}
        </Link>
        <span className="friend-row-sub">
          {pendingOutgoing
            ? 'تم إرسال الطلب'
            : accepted
              ? 'صديق بالفعل'
              : user.reason || (user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : 'مقترح لك')}
        </span>
      </div>
      <div className="friend-row-actions">
        {accepted ? (
          <Button variant="secondary" disabled>
            صديقك
          </Button>
        ) : pendingOutgoing ? (
          <Button variant="secondary" onClick={() => onCancel(friendshipId)} loading={isBusyCancel} disabled={isBusyCancel}>
            إلغاء الطلب
          </Button>
        ) : (
          <Button onClick={() => onSend(user.username)} loading={isBusyAdd} disabled={isBusyAdd}>
            إضافة صديق
          </Button>
        )}
        <Button variant="secondary" onClick={() => onDismiss(user.username)} loading={isBusyDismiss} disabled={isBusyDismiss}>
          إزالة
        </Button>
      </div>
    </Card>
  );
}

/* =================================================================
   ✅ v59.13.15 FIX #3 — حوار تأكيد مخصص (بديل window.confirm)
   - role="dialog" + aria-modal="true" + ESC يغلق
   - ركّز تلقائياً على زر الإلغاء لأمان المدخل
   - focus trap داخل الحوار
   - غير blocking — لا يجمّد خيط JS على الموبايل
   ================================================================= */
function ConfirmDialog({ dialog, onClose }) {
  const cancelRef = useRef(null);
  const cardRef = useRef(null);
  useEffect(() => {
    if (!dialog) return undefined;
    const t = window.setTimeout(() => { try { cancelRef.current?.focus(); } catch { /* ignore */ } }, 30);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key === 'Tab') {
        const root = cardRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll('button:not([disabled])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) { e.preventDefault(); try { last.focus(); } catch { /* ignore */ } }
        else if (!e.shiftKey && active === last) { e.preventDefault(); try { first.focus(); } catch { /* ignore */ } }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [dialog, onClose]);
  if (!dialog) return null;
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="yam-confirm-msg"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(180deg,#1e1b3a,#14122a)',
          borderRadius: 16, padding: '20px 18px',
          border: '1px solid rgba(124,58,237,0.35)',
          color: '#fff', fontFamily: '"Noto Sans Arabic","Cairo",system-ui,sans-serif',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        }}
      >
        <p id="yam-confirm-msg" style={{ margin: '0 0 18px', fontSize: 15, lineHeight: 1.7 }}>
          {dialog.message}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >إلغاء</button>
          <button
            type="button"
            onClick={() => dialog.onConfirm?.()}
            style={{
              flex: 1.2, padding: '10px 14px', borderRadius: 10,
              background: dialog.danger
                ? 'linear-gradient(90deg,#ef4444,#b91c1c)'
                : 'linear-gradient(90deg,#7c3aed,#a855f7)',
              color: '#fff', border: 'none',
              fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >{dialog.confirmLabel || 'موافق'}</button>
        </div>
      </div>
    </div>
  );
}

/** بطاقة صديق حالي: فتح الملف الشخصي / إزالة */
function FriendRow({ user, busy, onUnfriend, onMessage }) {
  const friendshipId = user?.friendship?.friendship_id;
  const isBusyRemove = busy === `unfriend-${friendshipId}`;
  return (
    <Card className="friend-row">
      <Avatar user={user} />
      <div className="friend-row-meta">
        <Link to={`/profile/${encodeURIComponent(user.username)}`} className="friend-row-name">
          {user.username}
        </Link>
        <span className="friend-row-sub">
          {user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : 'صديق'}
        </span>
      </div>
      <div className="friend-row-actions">
        <Button variant="secondary" onClick={() => onMessage(user.username)}>
          رسالة
        </Button>
        <Button variant="secondary" onClick={() => onUnfriend(friendshipId)} loading={isBusyRemove} disabled={isBusyRemove}>
          إزالة من الأصدقاء
        </Button>
      </div>
    </Card>
  );
}

export default function Friends() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'friends';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 280);

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState({ friends: 0, requests_received: 0, requests_sent: 0 });
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');
  // ✅ v59.13.15 FIX #3: بدل window.confirm المتزامن (تجربة سيئة على الموبايل + يحجبه بعض المتصفحات)
  // نستخدم حوار تأكيد مخصصاً RTL + a11y كامل (role=dialog/aria-modal/ESC)
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }

  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  const safeSet = useCallback((setter) => (value) => {
    if (mountedRef.current) setter(value);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [friendsRes, requestsRes, sentRes, suggestionsRes, statsRes] = await Promise.all([
        getFriends({ limit: 50, page: 1 }).catch(() => ({ data: { items: [] } })),
        getReceivedRequests().catch(() => ({ data: { items: [] } })),
        getSentRequests().catch(() => ({ data: { items: [] } })),
        getFriendSuggestions(20).catch(() => ({ data: { items: [] } })),
        getFriendsStats().catch(() => ({ data: { friends: 0, requests_received: 0, requests_sent: 0 } })),
      ]);
      if (!mountedRef.current) return;
      setFriends(friendsRes?.data?.items || []);
      setRequests(requestsRes?.data?.items || []);
      setSentRequests(sentRes?.data?.items || []);
      setSuggestions(suggestionsRes?.data?.items || []);
      setStats(statsRes?.data || { friends: 0, requests_received: 0, requests_sent: 0 });
    } catch (err) {
      safeSet(setError)(err?.response?.data?.detail || err?.message || 'تعذر تحميل بيانات الأصدقاء.');
    } finally {
      safeSet(setLoading)(false);
    }
  }, [safeSet]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // البحث Instant
  useEffect(() => {
    let cancelled = false;
    const q = (debouncedSearch || '').trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }
    setSearchLoading(true);
    searchFriendsCandidates(q, 25)
      .then((res) => {
        if (cancelled || !mountedRef.current) return;
        setSearchResults(res?.data?.items || []);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setSearchResults([]);
      })
      .finally(() => {
        if (!cancelled && mountedRef.current) setSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, [debouncedSearch]);

  const switchTab = (key) => {
    setActiveTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  // ---------------- الإجراءات ----------------

  // ✅ v59.13.9 FIX #4: جميع معالجات إجراءات الصداقة تفحص mountedRef
  // قبل أي setState بعد await — لتجنّب تحذيرات React لو المستخدم
  // ضغط "تأكيد/حذف/إضافة" ثم غادر الصفحة فوراً.
  // ✅ v59.13.13 FIX #3: عند قبول طلب صداقة، حدِّث البطاقة في نتائج البحث/الاقتراحات أيضاً
  //                       الخلل السابق: لو كان الشخص في لائحة البحث، البطاقة تبقى تعرض "إضافة،حذف"
  //                       بدلاً من "صديقك".
  const handleAccept = async (friendshipId) => {
    try {
      setBusy(`accept-${friendshipId}`);
      setActionError('');
      await acceptFriendRequest(friendshipId);
      if (!mountedRef.current) return;
      const accepted = requests.find((u) => u.friendship?.friendship_id === friendshipId);
      setRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      if (accepted) {
        setFriends((prev) => [
          { ...accepted, friendship: { ...accepted.friendship, status: 'accepted' } },
          ...prev.filter((u) => u.id !== accepted.id),
        ]);
        // حدِّث حالة بطاقة الشخص في الاقتراحات/البحث إلى accepted حتى تظهر "صديقك"
        const markAccepted = (list) => list.map((u) => (
          u.username === accepted.username
            ? { ...u, friendship: { status: 'accepted', friendship_id: friendshipId, direction: null } }
            : u
        ));
        setSuggestions(markAccepted);
        setSearchResults(markAccepted);
      }
      setStats((s) => ({ ...s, friends: s.friends + 1, requests_received: Math.max(0, s.requests_received - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر قبول الطلب.');
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  const handleDeclineIncoming = async (friendshipId) => {
    try {
      setBusy(`decline-${friendshipId}`);
      setActionError('');
      await removeFriendship(friendshipId);
      if (!mountedRef.current) return;
      setRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      setStats((s) => ({ ...s, requests_received: Math.max(0, s.requests_received - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر حذف الطلب.');
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  const handleSendRequest = async (username) => {
    try {
      setBusy(`add-${username}`);
      setActionError('');
      const { data } = await sendFriendRequest(username);
      if (!mountedRef.current) return;
      const friendship = data?.friendship;
      const updater = (list) => list.map((u) => (
        u.username === username
          ? { ...u, friendship: { status: friendship?.status || 'pending', friendship_id: friendship?.id, direction: friendship?.direction || 'outgoing' } }
          : u
      ));
      setSuggestions(updater);
      setSearchResults(updater);
      if (friendship?.status === 'pending') {
        setStats((s) => ({ ...s, requests_sent: s.requests_sent + 1 }));
      } else if (friendship?.status === 'accepted') {
        setStats((s) => ({ ...s, friends: s.friends + 1 }));
      }
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر إرسال الطلب.');
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  const handleCancelOutgoing = async (friendshipId) => {
    try {
      setBusy(`cancel-${friendshipId}`);
      setActionError('');
      await removeFriendship(friendshipId);
      if (!mountedRef.current) return;
      const updater = (list) => list.map((u) => (
        u.friendship?.friendship_id === friendshipId
          ? { ...u, friendship: { status: 'none', friendship_id: null, direction: null } }
          : u
      ));
      setSuggestions(updater);
      setSearchResults(updater);
      setSentRequests((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
      setStats((s) => ({ ...s, requests_sent: Math.max(0, s.requests_sent - 1) }));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر إلغاء الطلب.');
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  // ✅ v59.13.13 FIX #3: إزالة المستخدم من نتائج البحث أيضاً عند rejection
  //                       الخلل السابق: دغط المستخدم "إزالة" أثناء البحث → الشخص يختفي من الاقتراحات
  //                       لكنه يبقى في لائحة نتائج البحث والمستخدم يستطيع الضغط "إزالة" مرة ثانية → خطأ API
  const handleDismiss = async (username) => {
    try {
      setBusy(`dismiss-${username}`);
      setActionError('');
      await dismissSuggestion(username);
      if (!mountedRef.current) return;
      setSuggestions((prev) => prev.filter((u) => u.username !== username));
      setSearchResults((prev) => prev.filter((u) => u.username !== username));
    } catch (err) {
      if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر إزالة المقترح.');
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  // ✅ v59.13.15 FIX #3: حوار إزالة صديق تفاعلي (غير blocking)
  const handleUnfriend = (friendshipId) => {
    setConfirmDialog({
      message: 'هل تريد إزالة هذا الصديق من قائمتك؟',
      confirmLabel: 'إزالة',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          setBusy(`unfriend-${friendshipId}`);
          setActionError('');
          await removeFriendship(friendshipId);
          if (!mountedRef.current) return;
          setFriends((prev) => prev.filter((u) => u.friendship?.friendship_id !== friendshipId));
          setStats((s) => ({ ...s, friends: Math.max(0, s.friends - 1) }));
        } catch (err) {
          if (mountedRef.current) setActionError(err?.response?.data?.detail || 'تعذر إزالة الصديق.');
        } finally {
          if (mountedRef.current) setBusy('');
        }
      },
    });
  };

  const handleMessage = (username) => navigate(`/chat/${encodeURIComponent(username)}`);

  // ---------------- العرض ----------------

  const visibleFriends = useMemo(() => {
    if (!debouncedSearch || activeTab !== 'friends') return friends.slice(0, 6);
    const term = debouncedSearch.toLowerCase();
    return friends.filter((u) => (u.username || '').toLowerCase().includes(term));
  }, [friends, debouncedSearch, activeTab]);

  const previewSuggestions = useMemo(() => suggestions.slice(0, 8), [suggestions]);

  const hasSearch = (debouncedSearch || '').trim().length > 0;

  return (
    <MainLayout>
      <div className="friends-page" dir="rtl">
        {/* الرأس */}
        <div className="friends-header">
          <div className="friends-header-row">
            <button type="button" className="friends-back" onClick={() => navigate(-1)} aria-label="رجوع">‹</button>
            <h1 className="friends-title">الأصدقاء</h1>
            <div className="friends-stats">
              <span className="stat-pill"><strong>{stats.friends}</strong> صديق</span>
              {stats.requests_received > 0 ? (
                <span className="stat-pill warn"><strong>{stats.requests_received}</strong> طلب جديد</span>
              ) : null}
            </div>
          </div>

          {/* البحث */}
          <div className="friends-search">
            <span aria-hidden="true">🔍</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن صديق بالاسم..."
              aria-label="بحث عن صديق"
            />
            {searchQuery ? (
              <button type="button" className="friends-search-clear" onClick={() => setSearchQuery('')} aria-label="مسح البحث">×</button>
            ) : null}
          </div>

          {/* التبويبات */}
          <div className="friends-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={`friends-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => switchTab(tab.key)}
              >
                {tab.label}
                {tab.key === 'friends' ? <span className="tab-count">{stats.friends}</span> : null}
              </button>
            ))}
          </div>
        </div>

        {actionError ? <div className="alert error" role="alert">{actionError}</div> : null}
        {error ? (
          <ErrorState title="تعذر تحميل البيانات" description={error} onRetry={loadAll} />
        ) : null}

        {/* نتائج البحث */}
        {hasSearch ? (
          <section className="friends-section">
            <div className="section-head-row">
              <h2 className="section-h">نتائج البحث</h2>
              {searchLoading ? <span className="muted small">جارٍ البحث...</span> : <span className="muted small">{searchResults.length} نتيجة</span>}
            </div>
            {searchLoading && !searchResults.length ? (
              <ListSkeleton count={3} />
            ) : searchResults.length === 0 ? (
              <EmptyState icon="🔎" title="لا توجد نتائج" description={`لم نعثر على مستخدمين باسم "${debouncedSearch}".`} />
            ) : (
              <div className="friends-list">
                {searchResults.map((user) => (
                  <SuggestionRow
                    key={`search-${user.id}`}
                    user={user}
                    busy={busy}
                    onSend={handleSendRequest}
                    onCancel={handleCancelOutgoing}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* التبويب: أصدقاؤك */}
        {activeTab === 'friends' && !hasSearch ? (
          <>
            {/* طلبات الصداقة */}
            <section className="friends-section">
              <div className="section-head-row">
                <h2 className="section-h">
                  طلبات الصداقة {requests.length ? <span className="badge">{requests.length}</span> : null}
                </h2>
                {requests.length > 3 ? (
                  <Link to="/friends/all?tab=requests" className="see-all">عرض الكل</Link>
                ) : null}
              </div>
              {loading ? (
                <ListSkeleton count={2} />
              ) : requests.length === 0 ? (
                <EmptyState icon="📭" title="لا توجد طلبات جديدة" description="عندما يرسل لك شخص طلب صداقة سيظهر هنا." />
              ) : (
                <div className="friends-list">
                  {requests.slice(0, 3).map((user) => (
                    <RequestRow
                      key={user.friendship.friendship_id}
                      user={user}
                      busy={busy}
                      onAccept={handleAccept}
                      onDecline={handleDeclineIncoming}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* الطلبات المرسلة */}
            {sentRequests.length > 0 ? (
              <section className="friends-section">
                <div className="section-head-row">
                  <h2 className="section-h">الطلبات المرسلة <span className="badge muted">{sentRequests.length}</span></h2>
                  {sentRequests.length > 3 ? (
                    <Link to="/friends/all?tab=sent" className="see-all">عرض الكل</Link>
                  ) : null}
                </div>
                <div className="friends-list">
                  {sentRequests.slice(0, 3).map((user) => (
                    <Card key={user.friendship.friendship_id} className="friend-row">
                      <Avatar user={user} />
                      <div className="friend-row-meta">
                        <Link to={`/profile/${encodeURIComponent(user.username)}`} className="friend-row-name">{user.username}</Link>
                        <span className="friend-row-sub">في انتظار الموافقة</span>
                      </div>
                      <div className="friend-row-actions">
                        <Button
                          variant="secondary"
                          onClick={() => handleCancelOutgoing(user.friendship.friendship_id)}
                          loading={busy === `cancel-${user.friendship.friendship_id}`}
                          disabled={busy === `cancel-${user.friendship.friendship_id}`}
                        >
                          إلغاء الطلب
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* أشخاص قد تعرفهم */}
            <section className="friends-section">
              <div className="section-head-row">
                <h2 className="section-h">أشخاص قد تعرفهم</h2>
                {suggestions.length > 8 ? (
                  <Link to="/friends/all?tab=suggestions" className="see-all">عرض الكل</Link>
                ) : null}
              </div>
              {loading ? (
                <ListSkeleton count={4} />
              ) : previewSuggestions.length === 0 ? (
                <EmptyState icon="✨" title="لا توجد اقتراحات حالياً" description="جرّب لاحقاً أو ابحث عن صديق بالاسم." />
              ) : (
                <div className="friends-list">
                  {previewSuggestions.map((user) => (
                    <SuggestionRow
                      key={`sug-${user.id}`}
                      user={user}
                      busy={busy}
                      onSend={handleSendRequest}
                      onCancel={handleCancelOutgoing}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* الأصدقاء الحاليين preview */}
            <section className="friends-section">
              <div className="section-head-row">
                <h2 className="section-h">أصدقاؤك <span className="badge muted">{friends.length}</span></h2>
                {friends.length > 6 ? (
                  <Link to="/friends/all?tab=friends" className="see-all">عرض الكل</Link>
                ) : null}
              </div>
              {loading ? (
                <ListSkeleton count={3} />
              ) : visibleFriends.length === 0 ? (
                <EmptyState
                  icon="🧑‍🤝‍🧑"
                  title="لا أصدقاء بعد"
                  description="ابدأ بإضافة أصدقاء من قسم الاقتراحات أو ابحث بالاسم."
                  actionLabel="استعراض الاقتراحات"
                  onAction={() => switchTab('suggestions')}
                />
              ) : (
                <div className="friends-list">
                  {visibleFriends.map((user) => (
                    <FriendRow
                      key={user.friendship?.friendship_id || user.id}
                      user={user}
                      busy={busy}
                      onUnfriend={handleUnfriend}
                      onMessage={handleMessage}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}

        {/* التبويب: الاقتراحات */}
        {activeTab === 'suggestions' && !hasSearch ? (
          <section className="friends-section">
            <div className="section-head-row">
              <h2 className="section-h">جميع الاقتراحات</h2>
              <span className="muted small">{suggestions.length} مقترح</span>
            </div>
            {loading ? (
              <ListSkeleton count={6} />
            ) : suggestions.length === 0 ? (
              <EmptyState icon="✨" title="لا توجد اقتراحات حالياً" description="عاود الزيارة لاحقاً أو ابحث عن صديق بالاسم." />
            ) : (
              <div className="friends-list">
                {suggestions.map((user) => (
                  <SuggestionRow
                    key={`s-${user.id}`}
                    user={user}
                    busy={busy}
                    onSend={handleSendRequest}
                    onCancel={handleCancelOutgoing}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}

        {/* ✅ v59.13.15 FIX #3: حوار تأكيد داخل التطبيق بدل window.confirm المتزامن */}
        <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      </div>

      <style>{`
        .friends-page { padding: 12px 4px 28px; max-width: 760px; margin: 0 auto; }
        .friends-header {
          position: sticky; top: 0; z-index: 30;
          background: linear-gradient(180deg, rgba(8,10,22,0.96), rgba(8,10,22,0.86));
          backdrop-filter: blur(8px);
          padding: 10px 8px 6px; margin-bottom: 14px;
          border-bottom: 1px solid rgba(148,163,184,0.12);
          border-radius: 0 0 18px 18px;
        }
        .friends-header-row {
          display: flex; align-items: center; gap: 10px; padding: 4px 4px 8px;
        }
        .friends-back {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          font-size: 1.4rem; line-height: 1; cursor: pointer;
        }
        .friends-title {
          margin: 0; font-size: 1.18rem; color: #f8fafc; font-weight: 800; flex: 1;
        }
        .friends-stats { display: flex; gap: 6px; flex-wrap: wrap; }
        .stat-pill {
          padding: 4px 10px; border-radius: 999px;
          background: rgba(124,58,237,0.18);
          color: #ddd6fe; font-size: 0.78rem; border: 1px solid rgba(167,139,250,0.25);
        }
        .stat-pill strong { color: #fff; margin-left: 4px; }
        .stat-pill.warn {
          background: rgba(248,113,113,0.16); color: #fecaca;
          border-color: rgba(248,113,113,0.32);
        }
        .friends-search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; margin: 6px 4px 10px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 14px;
        }
        .friends-search input {
          flex: 1; background: transparent; border: 0; outline: none;
          color: #e2e8f0; font-size: 0.95rem;
        }
        .friends-search input::placeholder { color: #64748b; }
        .friends-search-clear {
          border: 0; background: rgba(148,163,184,0.18); color: #e2e8f0;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          font-size: 1rem; line-height: 1;
        }
        .friends-tabs {
          display: flex; gap: 8px; padding: 0 4px 4px;
        }
        .friends-tab {
          flex: 1; padding: 10px 14px; border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.62); color: #cbd5e1;
          font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: all .18s ease;
        }
        .friends-tab.active {
          background: linear-gradient(135deg, #7c3aed, #4c1d95);
          color: #f5f3ff; border-color: rgba(167,139,250,0.55);
          box-shadow: 0 4px 16px rgba(124,58,237,0.32);
        }
        .friends-tab .tab-count {
          background: rgba(255,255,255,0.18); color: #fff;
          padding: 1px 8px; border-radius: 999px; font-size: 0.75rem;
        }
        .friends-section { padding: 6px 6px 18px; }
        .section-head-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 6px 4px 10px;
        }
        .section-h {
          margin: 0; font-size: 1rem; color: #f8fafc; font-weight: 800;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .badge {
          background: #7c3aed; color: #fff; padding: 2px 8px;
          border-radius: 999px; font-size: 0.78rem;
        }
        .badge.muted {
          background: rgba(148,163,184,0.22); color: #cbd5e1;
        }
        .see-all {
          color: #60a5fa; font-size: 0.86rem; font-weight: 700;
          text-decoration: none;
        }
        .see-all:hover { text-decoration: underline; }
        .muted.small { color: #94a3b8; font-size: 0.82rem; }
        .friends-list { display: grid; gap: 10px; }
        .friend-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 16px;
        }
        .friend-row-meta {
          flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;
        }
        .friend-row-name {
          color: #f8fafc; font-weight: 800; text-decoration: none;
          font-size: 0.98rem; max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .friend-row-name:hover { color: #c4b5fd; }
        .friend-row-sub { color: #94a3b8; font-size: 0.8rem; }
        .friend-row-actions {
          display: flex; gap: 6px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end;
        }
        .friend-row-actions button { padding: 7px 14px !important; font-size: 0.85rem !important; }
        .alert.error {
          padding: 10px 14px; border-radius: 12px; margin: 0 4px 12px;
          background: rgba(248,113,113,0.14); color: #fecaca;
          border: 1px solid rgba(248,113,113,0.32);
        }
        @media (max-width: 560px) {
          .friend-row { flex-wrap: wrap; }
          .friend-row-actions { width: 100%; justify-content: stretch; }
          .friend-row-actions button { flex: 1; }
        }
      `}</style>
    </MainLayout>
  );
}
