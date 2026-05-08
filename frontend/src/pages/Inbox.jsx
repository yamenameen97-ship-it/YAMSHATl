import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getChatThreads, updateOnline } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { selectSortedThreads, selectUnreadTotal, useChatStore } from '../store/chatStore.js';

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

  const filteredThreads = useMemo(() => {
    if (!debouncedQuery) return threads;
    return threads.filter((thread) => thread.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [debouncedQuery, threads]);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Inbox</h3>
          <p className="muted">عدادات غير المقروء تعمل لحظياً على مستوى التطبيق كله، مع حالة آخر رسالة وقراءة المحادثات مباشرة من نفس القائمة.</p>
        </div>
      </div>

      <div className="stories-stats-grid notification-stats-grid-4" style={{ marginBottom: 16 }}>
        <div className="mini-stat stories-stat-card">
          <strong>{threads.length}</strong>
          <span>إجمالي المحادثات</span>
        </div>
        <div className="mini-stat stories-stat-card">
          <strong>{unreadTotal}</strong>
          <span>غير مقروءة الآن</span>
        </div>
        <div className="mini-stat stories-stat-card">
          <strong>{threads.filter((item) => item.presence?.is_online).length}</strong>
          <span>متصلين الآن</span>
        </div>
        <div className="mini-stat stories-stat-card">
          <strong>{isFetching ? '...' : '✓'}</strong>
          <span>{isFetching ? 'جارٍ التحديث' : 'مُحدّث لحظياً'}</span>
        </div>
      </div>

      <Card className="search-panel-card">
        <div className="search-shell large enabled-search-shell">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث داخل المحادثات..." />
        </div>
      </Card>

      {isLoading ? <ListSkeleton count={6} /> : null}
      {isError ? <ErrorState title="تعذر تحميل المحادثات" description={error?.response?.data?.message || error?.message} onRetry={refetch} /> : null}
      {!isLoading && !isError && filteredThreads.length === 0 ? (
        <EmptyState icon="💬" title="لا توجد محادثات بعد" description="افتح صفحة المستخدمين وابدأ أول شات." actionLabel="تحديث" onAction={refetch} />
      ) : null}

      <div className="thread-list">
        {filteredThreads.map((thread) => {
          const time = thread.last_message_at || thread.created_at
            ? new Date(thread.last_message_at || thread.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : '—';
          const preview = thread.last_message || 'ابدأ المحادثة الآن';
          const receipt = threadReceiptLabel(thread, currentUser);

          return (
            <Card key={thread.username} className="thread-row" onClick={() => navigate(`/chat/${encodeURIComponent(thread.username)}`)}>
              {thread.avatar ? (
                <img src={thread.avatar} alt={thread.username} className="avatar-circle large avatar-image" />
              ) : (
                <div className="avatar-circle large">{thread.username.slice(0, 1).toUpperCase()}</div>
              )}
              <div className="thread-copy">
                <div className="thread-headline">
                  <strong>{thread.username}</strong>
                  <div className="thread-head-meta">
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
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
