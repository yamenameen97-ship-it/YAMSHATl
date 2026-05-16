import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import { ListSkeleton } from '../components/feedback/Skeleton.jsx';
import { getChatThreads } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';

export default function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = useState('all'); // all, archived, pinned
  const [searchQuery, setSearchQuery] = useState('');
  
  // Local state for UI enhancements (in real app, these would be synced with backend)
  const [pinnedChats, setPinnedChats] = useState(new Set());
  const [archivedChats, setArchivedChats] = useState(new Set());
  const [mutedChats, setMutedChats] = useState(new Set());

  const { data: threads = [], isLoading, refetch } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    }
  });

  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      const isArchived = archivedChats.has(thread.username);
      const isPinned = pinnedChats.has(thread.username);
      const matchesSearch = thread.username.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === 'archived') return isArchived && matchesSearch;
      if (activeTab === 'pinned') return isPinned && matchesSearch;
      return !isArchived && matchesSearch;
    }).sort((a, b) => {
      const aPinned = pinnedChats.has(a.username);
      const bPinned = pinnedChats.has(b.username);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return new Date(b.last_message_at) - new Date(a.last_message_at);
    });
  }, [threads, activeTab, searchQuery, archivedChats, pinnedChats]);

  const togglePin = (username, e) => {
    e.stopPropagation();
    const next = new Set(pinnedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setPinnedChats(next);
  };

  const toggleArchive = (username, e) => {
    e.stopPropagation();
    const next = new Set(archivedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setArchivedChats(next);
  };

  const toggleMute = (username, e) => {
    e.stopPropagation();
    const next = new Set(mutedChats);
    if (next.has(username)) next.delete(username);
    else next.add(username);
    setMutedChats(next);
  };

  return (
    <MainLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>الرسائل</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setActiveTab('all')} style={{ background: activeTab === 'all' ? 'var(--primary)' : '' }}>الكل</Button>
            <Button variant="secondary" onClick={() => setActiveTab('pinned')} style={{ background: activeTab === 'pinned' ? 'var(--primary)' : '' }}>📌 المثبتة</Button>
            <Button variant="secondary" onClick={() => setActiveTab('archived')} style={{ background: activeTab === 'archived' ? 'var(--primary)' : '' }}>📦 مؤرشف</Button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input 
            type="text" 
            placeholder="ابحث في المحادثات..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', padding: '12px 16px', borderRadius: 12, color: 'white' }}
          />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : filteredThreads.length === 0 ? (
          <EmptyState title="لا توجد محادثات" description="ابدأ دردشة جديدة مع أصدقائك الآن." />
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {filteredThreads.map(thread => (
              <Card 
                key={thread.username} 
                onClick={() => navigate(`/chat/${thread.username}`)}
                style={{ 
                  padding: 16, 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 16,
                  border: pinnedChats.has(thread.username) ? '1px solid var(--primary)' : '1px solid transparent',
                  background: thread.unread_count > 0 ? 'rgba(139, 92, 246, 0.05)' : ''
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 20 }}>
                    {thread.username[0].toUpperCase()}
                  </div>
                  {thread.presence?.is_online && (
                    <div style={{ position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, background: '#44ff44', borderRadius: '50%', border: '2px solid #111' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {thread.username}
                      {mutedChats.has(thread.username) && <span style={{ fontSize: 12 }}>🔇</span>}
                      {pinnedChats.has(thread.username) && <span style={{ fontSize: 12 }}>📌</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 11 }}>{new Date(thread.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="muted" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.last_message || 'لا توجد رسائل بعد'}
                    </div>
                    {thread.unread_count > 0 && (
                      <div style={{ background: 'var(--primary)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' }}>
                        {thread.unread_count}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions Menu (Visible on hover or long press in real app) */}
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={(e) => togglePin(thread.username, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="تثبيت">
                    {pinnedChats.has(thread.username) ? '📍' : '📌'}
                  </button>
                  <button onClick={(e) => toggleMute(thread.username, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="كتم">
                    {mutedChats.has(thread.username) ? '🔊' : '🔇'}
                  </button>
                  <button onClick={(e) => toggleArchive(thread.username, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }} title="أرشفة">
                    {archivedChats.has(thread.username) ? '📤' : '📦'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
