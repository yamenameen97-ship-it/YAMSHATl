import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import ErrorState from '../components/feedback/ErrorState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getChatThreads, getMessages, getPresence, updateOnline } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';

async function fetchThreads(currentUser) {
  await updateOnline(true);
  const { data } = await getChatThreads();
  const threads = Array.isArray(data) ? data : [];
  const names = threads
    .map((item) => ({
      username: item?.username || item?.name,
      unread_count: Number(item?.unread_count || 0),
      avatar: item?.avatar || '',
      created_at: item?.created_at || null,
      last_message: item?.last_message || '',
    }))
    .filter((item) => Boolean(item.username))
    .filter((item) => item.username !== currentUser);

  const hydrated = await Promise.all(
    names.map(async (thread) => {
      try {
        const [messagesRes, presenceRes] = await Promise.all([
          getMessages(thread.username, 1),
          getPresence(thread.username),
        ]);
        const lastMessage = Array.isArray(messagesRes.data) ? messagesRes.data.at(-1) : null;
        return {
          ...thread,
          lastMessage,
          presence: presenceRes.data,
        };
      } catch {
        return {
          ...thread,
          lastMessage: null,
          presence: { is_online: false, last_seen: null },
        };
      }
    })
  );

  return hydrated.sort((a, b) => {
    const aUnread = Number(a.unread_count || 0);
    const bUnread = Number(b.unread_count || 0);
    if (aUnread !== bUnread) return bUnread - aUnread;
    return new Date(b.lastMessage?.created_at || b.created_at || 0) - new Date(a.lastMessage?.created_at || a.created_at || 0);
  });
}

export default function Inbox() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const debouncedQuery = useDebouncedValue(query, 250);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: () => fetchThreads(currentUser),
  });

  const threads = useMemo(() => {
    const items = data || [];
    if (!debouncedQuery) return items;
    return items.filter((thread) => thread.username.toLowerCase().includes(debouncedQuery.toLowerCase()));
  }, [data, debouncedQuery]);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Inbox</h3>
          <p className="muted">قائمة المحادثات بترتيب الأهم، مع إبراز الرسائل غير المقروءة وحالة التواجد وآخر رسالة في كل محادثة.</p>
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
      {!isLoading && !isError && threads.length === 0 ? (
        <EmptyState icon="💬" title="لا توجد محادثات بعد" description="افتح صفحة المستخدمين وابدأ أول شات." actionLabel="تحديث" onAction={refetch} />
      ) : null}

      <div className="thread-list">
        {threads.map((thread) => {
          const preview = thread.lastMessage?.deleted
            ? 'تم حذف هذه الرسالة'
            : thread.lastMessage?.message || thread.lastMessage?.content || thread.last_message || (thread.lastMessage?.media_url ? '📎 مرفق' : 'ابدأ المحادثة الآن');
          const time = thread.lastMessage?.created_at || thread.created_at
            ? new Date(thread.lastMessage?.created_at || thread.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : '—';

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
              </div>
              <div className="thread-time">{time}</div>
            </Card>
          );
        })}
      </div>
    </MainLayout>
  );
}
