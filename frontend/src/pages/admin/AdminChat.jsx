import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { getChatThreads, getMessages, restoreMessage } from '../../api/chat.js';
import socket from '../../api/socket.js';
import { useToast } from '../../components/admin/ToastProvider.jsx';

export default function AdminChat() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const loadThreads = async () => {
    try {
      const { data } = await getChatThreads();
      setThreads(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    socket.on('abuse_detected', (payload) => {
      pushToast({ title: 'Abuse Detected', description: `In chat with ${payload.user}`, type: 'warning' });
      loadThreads();
    });
    return () => socket.off('abuse_detected');
  }, []);

  const handleRestore = async (messageId) => {
    try {
      await restoreMessage(messageId);
      pushToast({ title: 'Message Restored', type: 'success' });
      if (activeThread) loadMessages(activeThread.id);
    } catch (err) {
      pushToast({ title: 'Restore Failed', type: 'error' });
    }
  };

  const loadMessages = async (threadId) => {
    const { data } = await getMessages(threadId);
    setMessages(data.items || []);
  };

  return (
    <AdminLayout>
      <div className="admin-chat-layout">
        <aside className="chat-sidebar">
          <Card title="Active Conversations">
            <div className="thread-list">
              {threads.map(thread => (
                <div 
                  key={thread.id} 
                  className={`thread-item ${activeThread?.id === thread.id ? 'active' : ''} ${thread.flagged ? 'flagged' : ''}`}
                  onClick={() => { setActiveThread(thread); loadMessages(thread.id); }}
                >
                  <div className="thread-meta">
                    <strong>{thread.username}</strong>
                    {thread.abuse_score > 50 && <span className="abuse-indicator">!</span>}
                  </div>
                  <p className="last-msg">{thread.last_message?.slice(0, 30)}...</p>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="chat-monitor-area">
          {activeThread ? (
            <Card title={`Monitoring: ${activeThread.username}`}>
              <div className="messages-scroller">
                {messages.map(msg => (
                  <div key={msg.id} className={`msg-bubble ${msg.deleted ? 'deleted' : ''}`}>
                    <div className="msg-content">
                      {msg.type === 'media' ? (
                        <div className="media-placeholder">
                          [Media Moderation Pending]
                          <button className="text-link" onClick={() => window.open(msg.media_url)}>View Original</button>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                      {msg.deleted && <button className="restore-btn" onClick={() => handleRestore(msg.id)}>Restore Message</button>}
                    </div>
                    <div className="msg-meta">
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                      {msg.ai_score && <span className="ai-score">AI: {msg.ai_score}%</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <div className="chat-empty-state">
              <h3>Select a conversation to monitor</h3>
              <p>Real-time abuse detection and media moderation are active.</p>
            </div>
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
