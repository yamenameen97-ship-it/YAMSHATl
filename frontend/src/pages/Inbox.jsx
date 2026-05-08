import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getChatThreads, updateOnline } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { selectSortedThreads, selectUnreadTotal, useChatStore } from '../store/chatStore.js';
import {
  getChatPrefs,
  isArchivedChat,
  isPinnedChat,
  toggleArchivedChat,
  togglePinnedChat,
} from '../utils/chatEnhancements.js';

async function fetchThreads(currentUser) {
  await updateOnline(true);
  const { data } = await getChatThreads();
  return (Array.isArray(data) ? data : []).filter((item) => (item?.username || item?.name) !== currentUser);
}

function threadReceiptLabel(thread, currentUser) {
  if (thread?.last_message_sender !== currentUser) return '';
  if (thread?.last_message_status === 'seen') return '✔✔ مقروءة';
  if (thread?.last_message_status === 'delivered') return '✔✔ وصلت';
  return '✔ تم الإرسال';
}

export default function Inbox() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [prefsVersion, setPrefsVersion] = useState(0);
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);
  const threads = useChatStore(selectSortedThreads);
  const unreadTotal = useChatStore(selectUnreadTotal);
  const hydrateThreads = useChatStore((state) => state.hydrateThreads);

  const { isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: async () => {
      const nextThreads = await fetchThreads(currentUser);
      hydrateThreads(nextThreads, { replace: true });
      return nextThreads;
    },
    enabled: Boolean(currentUser),
  });

  useEffect(() => {
    const syncPrefs = () => setPrefsVersion((value) => value + 1);
    window.addEventListener('storage', syncPrefs);
    return () => window.removeEventListener('storage', syncPrefs);
  }, []);

  const prefs = useMemo(() => getChatPrefs(), [prefsVersion]);

  const filteredThreads = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      const matchesQuery = !normalizedQuery || thread.username.toLowerCase().includes(normalizedQuery) || String(thread.last_message || '').toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (filter === 'pinned') return Boolean(prefs.pinned?.[thread.username]);
      if (filter === 'archived') return Boolean(prefs.archived?.[thread.username]);
      if (filter === 'unread') return Number(thread.unread_count || 0) > 0;
      if (filter === 'online') return Boolean(thread.presence?.is_online);
      return filter !== 'active' ? !prefs.archived?.[thread.username] : true;
    });
  }, [debouncedQuery, filter, prefs.archived, prefs.pinned, threads]);

  const stats = useMemo(() => ([
    { label: 'إجمالي المحادثات', value: threads.length },
    { label: 'Pinned', value: Object.keys(prefs.pinned || {}).filter((key) => prefs.pinned[key]).length },
    { label: 'Archived', value: Object.keys(prefs.archived || {}).filter((key) => prefs.archived[key]).length },
    { label: 'غير مقروءة', value: unreadTotal },
  ]), [prefs.archived, prefs.pinned, threads.length, unreadTotal]);

  const quickFilters = [
    { key: 'all', label: 'النشطة' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'archived', label: 'Archived' },
    { key: 'unread', label: 'Unread' },
    { key: 'online', label: 'Online' },
  ];

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Inbox Pro</h3>
          <p className="muted">تمت إضافة Pin Chat، Archive Chat، فلاتر متقدمة، معاينة القراءة، Presence، وفرز أسرع للمحادثات المهمة.</p>
        </div>
      </div>

      <div className="stories-stats-grid notification-stats-grid-4" style={{ marginBottom: 16 }}>
        {stats.map((item) => (
          <div key={item.label} className="mini-stat stories-stat-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <Card className="search-panel-card">
        <div className="search-shell large enabled-search-shell">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث داخل المحادثات أو آخر رسالة..." />
        </div>
        <div className="chat-filter-chips" style={{ marginTop: 14 }}>
          {quickFilters.map((item) => (
            <button key={item.key} type="button" className={`mini-action ${filter === item.key ? 'active' : ''}`} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
          <Button variant="secondary" onClick={refetch}>{isFetching ? 'جارٍ التحديث...' : 'تحديث'}</Button>
        </div>
      </Card>

      {isLoading ? <ListSkeleton count={6} /> : null}
      {isError ? <ErrorState title="تعذر تحميل المحادثات" description={error?.response?.data?.message || error?.message} onRetry={refetch} /> : null}
      {!isLoading && !isError && filteredThreads.length === 0 ? (
        <EmptyState icon="💬" title="لا توجد محادثات مطابقة" description="غيّر البحث أو الفلتر أو افتح صفحة المستخدمين وابدأ أول شات." actionLabel="تحديث" onAction={refetch} />
      ) : null}

      <div className="thread-list">
        {filteredThreads.map((thread) => {
          const time = thread.last_message_at || thread.created_at
            ? new Date(thread.last_message_at || thread.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : '—';
          const preview = thread.last_message || 'ابدأ المحادثة الآن';
          const receipt = threadReceiptLabel(thread, currentUser);
          const pinned = isPinnedChat(thread.username);
          const archived = isArchivedChat(thread.username);

          return (
            <Card key={thread.username} className={`thread-row thread-row-pro ${pinned ? 'pinned' : ''} ${archived ? 'archived' : ''}`}>
              <div className="thread-row-main" onClick={() => navigate(`/chat/${encodeURIComponent(thread.username)}`)}>
                {thread.avatar ? (
                  <img src={thread.avatar} alt={thread.username} className="avatar-circle large avatar-image" />
                ) : (
                  <div className="avatar-circle large">{thread.username.slice(0, 1).toUpperCase()}</div>
                )}
                <div className="thread-copy">
                  <div className="thread-headline">
                    <strong>{thread.username}</strong>
                    <div className="thread-head-meta">
                      {pinned ? <span className="glass-chip">📌 Pinned</span> : null}
                      {archived ? <span className="glass-chip">🗂️ Archived</span> : null}
                      {thread.unread_count ? <span className="unread-badge">{thread.unread_count}</span> : null}
                      <span className={`presence-badge ${thread.presence?.is_online ? 'online' : 'offline'}`}>
                        {thread.presence?.is_online ? '🟢 متصل' : thread.presence?.last_seen ? `آخر ظهور ${new Date(thread.presence.last_seen).toLocaleTimeString('ar-EG')}` : '⚫ غير متصل'}
                      </span>
                    </div>
                  </div>
                  <div className="muted truncate">{preview}</div>
                  {receipt ? <div className="muted" style={{ marginTop: 6 }}>{receipt}</div> : null}
                </div>
                <div className="thread-time">{time}</div>
              </div>
              <div className="thread-inline-actions">
                <button
                  type="button"
                  className="mini-action"
                  onClick={() => {
                    togglePinnedChat(thread.username);
                    setPrefsVersion((value) => value + 1);
                  }}
                >
                  {pinned ? 'إلغاء التثبيت' : '📌 تثبيت'}
                </button>
                <button
                  type="button"
                  className="mini-action"
                  onClick={() => {
                    toggleArchivedChat(thread.username);
                    setPrefsVersion((value) => value + 1);
                  }}
                >
                  {archived ? 'إلغاء الأرشفة' : '🗂️ أرشفة'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
