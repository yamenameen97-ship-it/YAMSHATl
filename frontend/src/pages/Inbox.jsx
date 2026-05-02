import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { getChatThreads, getMessages, getPresence, updateOnline } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';

export default function Inbox() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        await updateOnline(true);
        const { data } = await getChatThreads();
        const names = (Array.isArray(data) ? data : [])
          .map((item) => item?.name)
          .filter(Boolean)
          .filter((name) => name !== currentUser);

        const hydrated = await Promise.all(
          names.map(async (name) => {
            try {
              const [messagesRes, presenceRes] = await Promise.all([
                getMessages(name, 1),
                getPresence(name),
              ]);
              const lastMessage = Array.isArray(messagesRes.data) ? messagesRes.data.at(-1) : null;
              return {
                username: name,
                lastMessage,
                presence: presenceRes.data,
              };
            } catch {
              return {
                username: name,
                lastMessage: null,
                presence: { is_online: false },
              };
            }
          })
        );

        if (!mounted) return;
        setThreads(hydrated);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'تعذر تحميل المحادثات.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  return (
    <MainLayout>
      <div className="section-head">
        <div>
          <h3 className="section-title">Inbox</h3>
          <p className="muted">قائمة المحادثات الخاصة مع آخر رسالة وحالة الطرف الآخر.</p>
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="empty-state">جارٍ تحميل المحادثات...</div> : null}
      {!loading && threads.length === 0 ? (
        <div className="empty-state">لا توجد محادثات بعد. افتح صفحة المستخدمين وابدأ أول شات.</div>
      ) : null}

      <div className="thread-list">
        {threads.map((thread) => {
          const preview = thread.lastMessage?.deleted
            ? 'تم حذف هذه الرسالة'
            : thread.lastMessage?.message || thread.lastMessage?.content || 'ابدأ المحادثة الآن';
          const time = thread.lastMessage?.created_at
            ? new Date(thread.lastMessage.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
            : '—';

          return (
            <Card
              key={thread.username}
              className="thread-row"
              onClick={() => navigate(`/chat/${encodeURIComponent(thread.username)}`)}
            >
              <div className="avatar-circle large">{thread.username.slice(0, 1).toUpperCase()}</div>
              <div className="thread-copy">
                <div className="thread-headline">
                  <strong>{thread.username}</strong>
                  <span className={`presence-badge ${thread.presence?.is_online ? 'online' : 'offline'}`}>
                    {thread.presence?.is_online ? '🟢 متصل' : '⚫ غير متصل'}
                  </span>
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
