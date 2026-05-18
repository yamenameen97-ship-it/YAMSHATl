import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../../components/layout/MainLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { ListSkeleton } from '../../components/feedback/Skeleton.jsx';
import { getChatThreads } from '../../api/chat.js';
import { getCurrentUsername } from '../../utils/auth.js';
import { motion, AnimatePresence } from 'framer-motion';

export default function InboxPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const [activeTab, setActiveTab] = useState('all'); // all, archived, unread
  const [searchQuery, setSearchQuery] = useState('');
  
  const [pinnedChats, setPinnedChats] = useState(new Set());
  const [archivedChats, setArchivedChats] = useState(new Set());
  const [mutedChats, setMutedChats] = useState(new Set());

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return data || [];
    }
  });

  const filteredThreads = useMemo(() => {
    return threads.filter(thread => {
      const isArchived = archivedChats.has(thread.username);
      const isUnread = thread.unread_count > 0;
      const matchesSearch = thread.username.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === 'archived') return isArchived && matchesSearch;
      if (activeTab === 'unread') return isUnread && matchesSearch && !isArchived;
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

  return (
    <MainLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>الدردشة</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setActiveTab('all')} style={{ background: activeTab === 'all' ? 'var(--primary)' : '' }}>الكل</Button>
            <Button variant="secondary" onClick={() => setActiveTab('unread')} style={{ background: activeTab === 'unread' ? 'var(--primary)' : '' }}>غير مقروء</Button>
            <Button variant="secondary" onClick={() => setActiveTab('archived')} style={{ background: activeTab === 'archived' ? 'var(--primary)' : '' }}>📦 مؤرشف</Button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <input 
            type="text" 
            placeholder="بحث في المحادثات..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', padding: '12px 16px', borderRadius: 12, color: 'white', outline: 'none' }}
          />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence>
              {filteredThreads.map((thread, index) => (
                <motion.div
                  key={thread.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Unread Separator Logic */}
                  {activeTab === 'all' && index > 0 && !filteredThreads[index-1].unread_count && thread.unread_count && (
                    <div style={{ textAlign: 'center', margin: '10px 0', fontSize: 12, color: 'var(--primary)' }}>رسائل جديدة</div>
                  )}
                  
                  <Card 
                    onClick={() => navigate(`/chat/${thread.username}`)}
                    style={{ 
                      padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      border: pinnedChats.has(thread.username) ? '1px solid var(--primary)' : '1px solid transparent',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'relative' }}>
                      <img src={`https://ui-avatars.com/api/?name=${thread.username}`} style={{ width: 50, height: 50, borderRadius: '50%' }} alt="" />
                      {thread.is_typing && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#44ff44', padding: '2px 6px', borderRadius: 10, fontSize: 8, color: 'black', fontWeight: 'bold' }}>يكتب...</div>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {pinnedChats.has(thread.username) && '📌 '}{thread.username}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>{new Date(thread.last_message_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {thread.last_message}
                        </div>
                        {thread.unread_count > 0 && (
                          <div style={{ background: 'var(--primary)', color: 'white', fontSize: 10, padding: '2px 6px', borderRadius: 10 }}>{thread.unread_count}</div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
