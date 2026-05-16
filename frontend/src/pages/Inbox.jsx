import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import { getChatThreads } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';

function formatThreadTime(value) {
  if (!value) return 'الآن';
  try {
    return new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'الآن';
  }
}

export default function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedChats, setPinnedChats] = useState(() => new Set());
  const [archivedChats, setArchivedChats] = useState(() => new Set());
  const [mutedChats, setMutedChats] = useState(() => new Set());

  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    },
  });

  const filteredThreads = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return threads
      .filter((thread) => {
        const username = String(thread.username || '').toLowerCase();
        const isArchived = archivedChats.has(thread.username);
        const isPinned = pinnedChats.has(thread.username);
        const isUnread = Number(thread.unread_count || 0) > 0;
        const matchesSearch = !normalizedSearch || username.includes(normalizedSearch);

        if (!matchesSearch) return false;
        if (activeTab === 'archived') return isArchived;
        if (activeTab === 'pinned') return isPinned && !isArchived;
        if (activeTab === 'unread') return isUnread && !isArchived;
        return !isArchived;
      })
      .sort((a, b) => {
        const aPinned = pinnedChats.has(a.username);
        const bPinned = pinnedChats.has(b.username);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0);
      });
  }, [threads, searchQuery, activeTab, pinnedChats, archivedChats]);

  const totalUnread = useMemo(() => threads.reduce((sum, thread) => sum + Number(thread.unread_count || 0), 0), [threads]);

  const toggleSetMember = (setter, currentSet, username) => {
    const next = new Set(currentSet);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setter(next);
  };

  return (
    <MainLayout>
      <div className="yam-page yam-page-wide">
        <div className="yam-hero" style={{ marginBottom: 22 }}>
          <div className="yam-toolbar" style={{ marginBottom: 0 }}>
            <div>
              <div className="yam-badge primary" style={{ marginBottom: 12 }}>💬 الرسائل</div>
              <h1 className="yam-section-title">الإنبوكس الجديد</h1>
              <p className="yam-section-note" style={{ margin: '10px 0 0' }}>
                تم تحديث شاشة الرسائل إلى تصميم أقرب للواجهة الجديدة، مع بقاء جلب المحادثات والانتقال للدردشة كما هو.
              </p>
            </div>
            <div className="yam-action-row">
              <Button variant="secondary" onClick={() => refetch()} loading={isLoading}>تحديث</Button>
              <Button variant="secondary" onClick={() => navigate('/users')}>رسالة جديدة</Button>
            </div>
          </div>
        </div>

        <div className="yam-grid-main">
          <div className="yam-card">
            <div className="yam-toolbar">
              <div className="yam-tabs">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'unread', label: 'غير مقروء' },
                  { id: 'pinned', label: 'المثبتة' },
                  { id: 'archived', label: 'المؤرشفة' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`yam-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <span className="yam-badge">{filteredThreads.length}</span>
            </div>

            <input
              className="yam-search"
              placeholder="ابحث عن محادثة..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{ marginBottom: 18 }}
            />

            {isLoading ? (
              <div className="yam-empty-state">جارٍ تحميل المحادثات...</div>
            ) : filteredThreads.length ? (
              <div className="yam-list">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.username}
                    className="yam-thread"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/chat/${encodeURIComponent(thread.username)}`)}
                  >
                    <div style={{ position: 'relative' }}>
                      <div className="yam-avatar">{thread.username?.slice(0, 1)?.toUpperCase() || 'U'}</div>
                      {thread.presence?.is_online ? (
                        <span style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: '#22c55e', bottom: 2, insetInlineEnd: 2, border: '2px solid #08111f' }} />
                      ) : null}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{thread.username}</strong>
                          {mutedChats.has(thread.username) ? <span title="مكتوم">🔇</span> : null}
                          {pinnedChats.has(thread.username) ? <span title="مثبت">📌</span> : null}
                        </div>
                        <span className="yam-meta" style={{ fontSize: 12 }}>{formatThreadTime(thread.last_message_at)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                        <div className="yam-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {thread.last_message || 'ابدأ المحادثة الآن'}
                        </div>
                        {Number(thread.unread_count || 0) > 0 ? <span className="yam-pill-count">{thread.unread_count}</span> : null}
                      </div>
                    </div>

                    <div className="yam-action-row" onClick={(event) => event.stopPropagation()}>
                      <button type="button" className="yam-tab" onClick={() => toggleSetMember(setPinnedChats, pinnedChats, thread.username)}>
                        {pinnedChats.has(thread.username) ? 'إلغاء التثبيت' : 'تثبيت'}
                      </button>
                      <button type="button" className="yam-tab" onClick={() => toggleSetMember(setMutedChats, mutedChats, thread.username)}>
                        {mutedChats.has(thread.username) ? 'إلغاء الكتم' : 'كتم'}
                      </button>
                      <button type="button" className="yam-tab" onClick={() => toggleSetMember(setArchivedChats, archivedChats, thread.username)}>
                        {archivedChats.has(thread.username) ? 'إلغاء الأرشفة' : 'أرشفة'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="yam-empty-state">
                <div style={{ fontSize: 42, marginBottom: 10 }}>📭</div>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>لا توجد محادثات في هذا التبويب</div>
                <div className="yam-empty-copy">ابدأ محادثة جديدة أو غيّر الفلتر الحالي.</div>
              </div>
            )}
          </div>

          <aside className="yam-sidebar-stack">
            <div className="yam-card">
              <div className="yam-stat-grid">
                <div className="yam-stat"><strong>{threads.length}</strong><span className="yam-meta">كل المحادثات</span></div>
                <div className="yam-stat"><strong>{totalUnread}</strong><span className="yam-meta">الرسائل غير المقروءة</span></div>
                <div className="yam-stat"><strong>{pinnedChats.size}</strong><span className="yam-meta">المثبتة</span></div>
                <div className="yam-stat"><strong>{archivedChats.size}</strong><span className="yam-meta">المؤرشفة</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
