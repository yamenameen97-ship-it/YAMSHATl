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
  getReceivedRequests,
  getSentRequests,
  removeFriendship,
  sendFriendRequest,
} from '../api/friends.js';

/**
 * صفحة "عرض الكل" - تعرض كل عناصر تبويب واحد بصفحات ودعم البحث/الترتيب.
 * Tabs المدعومة: friends, requests, sent, suggestions.
 */

const SUB_TABS = [
  { key: 'friends', label: 'الأصدقاء' },
  { key: 'requests', label: 'الطلبات الواردة' },
  { key: 'sent', label: 'الطلبات المرسلة' },
  { key: 'suggestions', label: 'الاقتراحات' },
];

function Avatar({ user, size = 52 }) {
  if (user?.avatar) {
    return (
      <img src={user.avatar} alt={user.username}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(167,139,250,0.18)' }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
      color: '#f5f3ff', display: 'grid', placeItems: 'center',
      fontWeight: 800, fontSize: size * 0.4, flexShrink: 0,
    }}>{(user?.username || '?').slice(0, 1).toUpperCase()}</div>
  );
}

export default function FriendsAll() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = SUB_TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'friends';
  const [tab, setTab] = useState(initialTab);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  // ✅ v59.13.17 FIX #4: حوار تأكيد داخلي لإزالة صديق بدلاً من window.confirm المتزامن
  // (يحجب الواجهة وتجربة سيئة على الموبايل + بعض المتصفّحات تحجبه الآن)
  const [confirmUnfriend, setConfirmUnfriend] = useState(null); // friendshipId | null

  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 280);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const load = useCallback(async (nextPage = 1, append = false) => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (tab === 'friends') {
        res = await getFriends({ limit: 30, page: nextPage, q: debounced || undefined });
        const total = res?.data?.total || 0;
        setHasMore(nextPage * 30 < total);
      } else if (tab === 'requests') {
        res = await getReceivedRequests();
        setHasMore(false);
      } else if (tab === 'sent') {
        res = await getSentRequests();
        setHasMore(false);
      } else {
        res = await getFriendSuggestions(60);
        setHasMore(false);
      }
      if (!mountedRef.current) return;
      const next = res?.data?.items || [];
      setItems((prev) => (append ? [...prev, ...next] : next));
      setPage(nextPage);
    } catch (err) {
      if (mountedRef.current) setError(err?.response?.data?.detail || err?.message || 'تعذر تحميل القائمة.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [tab, debounced]);

  useEffect(() => { load(1, false); }, [load]);

  const switchTab = (key) => {
    setTab(key);
    setItems([]);
    setPage(1);
    setQuery('');
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  // ✅ FIX v59.13.10: handleAction محصّن ضد ثلاث عيوب جوهريّة:
  //   1) confirm() لـ unfriend كان يأتي بعد setBusy(…) فإذا ألغى المستخدم
  //      المربّع يخرج عبر return وبدون تصفير busy → الزر يبقى في حالة
  //      loading دائماً ولا يمكن إعادة المحاولة إلا بإعادة تحميل الصفحة. إصلاح:
  //      ندعو confirm قبل setBusy.
  //   2) بعد await لا يتم فحص mountedRef.current → إذا خرج المستخدم
  //      من الصفحة أثناء الطلب يحدث setState على مكوّن مُزال → تحذيرات React.
  //   3) actionError السابق لا يُمسح إذا أغلق confirm() مبكراً
  //      → رسالة خطأ قديمة تبقى معروضة للمستخدم.
  const handleAction = async (type, target) => {
    // ✅ v59.13.17 FIX #4: بدلاً من window.confirm المتزامن، نفتح حوار تأكيد داخلي،
    // ثم نعيد استدعاء handleAction بـ type='unfriend-confirmed' بعد موافقة المستخدم.
    if (type === 'unfriend') {
      setConfirmUnfriend(target);
      return;
    }
    // (3) مسح خطأ أي عملية سابقة.
    setActionError('');
    try {
      if (type === 'accept') {
        setBusy(`accept-${target}`);
        await acceptFriendRequest(target);
        if (!mountedRef.current) return; // (2)
        setItems((p) => p.filter((u) => u.friendship?.friendship_id !== target));
      } else if (type === 'decline' || type === 'cancel' || type === 'unfriend-confirmed') {
        // ✅ v59.13.17 FIX #4: نستخدم المفتاح المجدد 'unfriend-confirmed' حتى نتفادى حلقة confirm أعلاه
        const busyKey = type === 'unfriend-confirmed' ? 'unfriend' : type;
        setBusy(`${busyKey}-${target}`);
        await removeFriendship(target);
        if (!mountedRef.current) return; // (2)
        setItems((p) => p.filter((u) => u.friendship?.friendship_id !== target));
      } else if (type === 'add') {
        setBusy(`add-${target}`);
        const { data } = await sendFriendRequest(target);
        if (!mountedRef.current) return; // (2)
        const fr = data?.friendship;
        setItems((p) => p.map((u) => u.username === target
          ? { ...u, friendship: { status: fr?.status, friendship_id: fr?.id, direction: fr?.direction || 'outgoing' } }
          : u));
      } else if (type === 'dismiss') {
        setBusy(`dismiss-${target}`);
        await dismissSuggestion(target);
        if (!mountedRef.current) return; // (2)
        setItems((p) => p.filter((u) => u.username !== target));
      }
    } catch (err) {
      if (mountedRef.current) {
        setActionError(err?.response?.data?.detail || 'فشلت العملية.');
      }
    } finally {
      if (mountedRef.current) setBusy('');
    }
  };

  const filtered = useMemo(() => {
    if (!debounced) return items;
    const term = debounced.toLowerCase();
    return items.filter((u) => (u.username || '').toLowerCase().includes(term));
  }, [items, debounced]);

  const renderCardActions = (user) => {
    const fid = user?.friendship?.friendship_id;
    const status = user?.friendship?.status;
    const direction = user?.friendship?.direction;
    if (tab === 'requests') {
      return (
        <>
          <Button onClick={() => handleAction('accept', fid)} loading={busy === `accept-${fid}`} disabled={busy === `accept-${fid}`}>تأكيد</Button>
          <Button variant="secondary" onClick={() => handleAction('decline', fid)} loading={busy === `decline-${fid}`} disabled={busy === `decline-${fid}`}>حذف</Button>
        </>
      );
    }
    if (tab === 'sent') {
      return (
        <Button variant="secondary" onClick={() => handleAction('cancel', fid)} loading={busy === `cancel-${fid}`} disabled={busy === `cancel-${fid}`}>إلغاء الطلب</Button>
      );
    }
    if (tab === 'friends') {
      return (
        <>
          <Button variant="secondary" onClick={() => navigate(`/chat/${encodeURIComponent(user.username)}`)}>رسالة</Button>
          <Button variant="secondary" onClick={() => handleAction('unfriend', fid)} loading={busy === `unfriend-${fid}`} disabled={busy === `unfriend-${fid}`}>إزالة</Button>
        </>
      );
    }
    // suggestions
    const pendingOut = status === 'pending' && direction === 'outgoing';
    return (
      <>
        {pendingOut ? (
          <Button variant="secondary" onClick={() => handleAction('cancel', fid)} loading={busy === `cancel-${fid}`} disabled={busy === `cancel-${fid}`}>إلغاء الطلب</Button>
        ) : (
          <Button onClick={() => handleAction('add', user.username)} loading={busy === `add-${user.username}`} disabled={busy === `add-${user.username}`}>إضافة صديق</Button>
        )}
        <Button variant="secondary" onClick={() => handleAction('dismiss', user.username)} loading={busy === `dismiss-${user.username}`} disabled={busy === `dismiss-${user.username}`}>إزالة</Button>
      </>
    );
  };

  return (
    <MainLayout>
      <div className="friends-all-page" dir="rtl">
        <div className="fa-header">
          <button type="button" className="fa-back" onClick={() => navigate('/friends')} aria-label="رجوع">‹</button>
          <h1 className="fa-title">الكل · {SUB_TABS.find((t) => t.key === tab)?.label}</h1>
          <Link to="/friends" className="fa-link">العودة</Link>
        </div>

        <div className="fa-search">
          <span>🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث ضمن القائمة..."
          />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="مسح" className="fa-clear">×</button> : null}
        </div>

        <div className="fa-tabs" role="tablist">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              aria-selected={tab === t.key}
              className={`fa-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => switchTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {actionError ? <div className="alert error">{actionError}</div> : null}

        {error ? (
          <ErrorState title="تعذر تحميل القائمة" description={error} onRetry={() => load(1, false)} />
        ) : loading && items.length === 0 ? (
          <ListSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🪶"
            title="القائمة فارغة"
            description={query ? `لا توجد نتائج لكلمة "${query}".` : 'لا توجد عناصر لعرضها هنا حالياً.'}
          />
        ) : (
          <div className="fa-list">
            {filtered.map((user) => (
              <Card key={`${tab}-${user.friendship?.friendship_id || user.id}`} className="fa-row">
                <Avatar user={user} />
                <div className="fa-meta">
                  <Link to={`/profile/${encodeURIComponent(user.username)}`} className="fa-name">{user.username}</Link>
                  <span className="fa-sub">
                    {user.mutual_friends ? `${user.mutual_friends} صديق مشترك` : user.reason || ''}
                  </span>
                </div>
                <div className="fa-actions">{renderCardActions(user)}</div>
              </Card>
            ))}
          </div>
        )}

        {tab === 'friends' && hasMore && !loading ? (
          <div className="fa-load-more">
            <Button variant="secondary" onClick={() => load(page + 1, true)}>تحميل المزيد</Button>
          </div>
        ) : null}
      </div>

      <style>{`
        .friends-all-page { padding: 12px 4px 28px; max-width: 760px; margin: 0 auto; }
        .fa-header { display: flex; align-items: center; gap: 10px; padding: 6px 4px 10px; }
        .fa-back {
          width: 36px; height: 36px; border-radius: 50%;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.7); color: #e2e8f0;
          font-size: 1.4rem; line-height: 1; cursor: pointer;
        }
        .fa-title { margin: 0; font-size: 1.1rem; color: #f8fafc; font-weight: 800; flex: 1; }
        .fa-link { color: #60a5fa; font-size: 0.85rem; text-decoration: none; font-weight: 700; }
        .fa-search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; margin: 6px 4px 10px;
          background: rgba(15,23,42,0.72);
          border: 1px solid rgba(148,163,184,0.16);
          border-radius: 14px;
        }
        .fa-search input { flex: 1; background: transparent; border: 0; outline: none; color: #e2e8f0; }
        .fa-search input::placeholder { color: #64748b; }
        .fa-clear { border: 0; background: rgba(148,163,184,0.18); color: #e2e8f0;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer; }
        .fa-tabs { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 4px 10px; }
        .fa-tab {
          padding: 8px 12px; border-radius: 999px;
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.62); color: #cbd5e1;
          font-weight: 700; cursor: pointer; font-size: 0.85rem;
        }
        .fa-tab.active {
          background: linear-gradient(135deg, #7c3aed, #4c1d95);
          color: #f5f3ff; border-color: rgba(167,139,250,0.55);
        }
        .fa-list { display: grid; gap: 10px; padding: 0 4px; }
        .fa-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 16px;
        }
        .fa-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .fa-name {
          color: #f8fafc; font-weight: 800; text-decoration: none;
          font-size: 0.98rem; max-width: 100%; overflow: hidden;
          text-overflow: ellipsis; white-space: nowrap;
        }
        .fa-name:hover { color: #c4b5fd; }
        .fa-sub { color: #94a3b8; font-size: 0.8rem; }
        .fa-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .fa-actions button { padding: 7px 14px !important; font-size: 0.85rem !important; }
        .fa-load-more { display: grid; place-items: center; padding: 14px; }
        .alert.error {
          padding: 10px 14px; border-radius: 12px; margin: 0 4px 12px;
          background: rgba(248,113,113,0.14); color: #fecaca;
          border: 1px solid rgba(248,113,113,0.32);
        }
        @media (max-width: 560px) {
          .fa-row { flex-wrap: wrap; }
          .fa-actions { width: 100%; justify-content: stretch; }
          .fa-actions button { flex: 1; }
        }
      `}</style>

      {/* ✅ v59.13.17 FIX #4: حوار تأكيد داخلي بدلاً من window.confirm */}
      {confirmUnfriend ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="yam-unfriend-title"
          dir="rtl"
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
            fontFamily: "'Noto Sans Arabic','Cairo','Tahoma',sans-serif",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmUnfriend(null); }}
        >
          <div style={{
            background: '#1f2233', color: '#f8fafc',
            borderRadius: 14, width: '100%', maxWidth: 380,
            padding: 20, boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <h3 id="yam-unfriend-title" style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>
              ❌ إزالة صديق
            </h3>
            <p style={{ margin: '0 0 18px', color: '#cbd5e1', fontSize: 14, lineHeight: 1.6 }}>
              هل تريد إزالة هذا الصديق؟ يمكنك إعادة إرسال طلب صداقة لاحقاً.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setConfirmUnfriend(null)}
                style={{
                  padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
                  background: 'transparent', color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.16)', fontWeight: 600,
                }}
              >إلغاء</button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  const t = confirmUnfriend;
                  setConfirmUnfriend(null);
                  handleAction('unfriend-confirmed', t);
                }}
                style={{
                  padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
                  background: '#dc2626', color: '#fff',
                  border: 'none', fontWeight: 700,
                }}
              >نعم، أزل</button>
            </div>
          </div>
        </div>
      ) : null}
    </MainLayout>
  );
}
