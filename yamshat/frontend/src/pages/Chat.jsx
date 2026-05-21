import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import ChatInput from '../components/chat/ChatInput.jsx';
import AudioWaveform from '../components/chat/AudioWaveform.jsx';
import CallExperience from '../components/chat/CallExperience.jsx';
import { useToast } from '../components/admin/ToastProvider.jsx';
import { deleteMessageApi, getMessages, markMessagesSeen, sendMessageApi } from '../api/chat.js';
import socketManager from '../services/socketManager.js';
import signalProtocolService from '../services/chat/signalProtocol.js';
import { currentMediaProviderLabel, resolveMediaUrl } from '../config/mediaConfig.js';
import { getCurrentUsername } from '../utils/auth.js';
import { useChatStore } from '../store/appStore.js';
import { FixedSizeList as List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

const MessageRow = ({ index, style, data }) => {
  const { messages, currentUser } = data;
  const message = messages[index];
  if (!message) return null;

  const isMe = message.sender === currentUser;

  return (
    <div style={{ ...style, display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', padding: '5px 15px' }}>
      <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
        <p className="text-sm">{message.content || message.message}</p>
        <div className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
          {new Date(message.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default function Chat() {
  const { userId } = useParams();
  const peer = decodeURIComponent(userId || '').trim();
  const currentUser = getCurrentUsername();
  const { pushToast } = useToast();
  const listRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(peer));
  const [presence, setPresence] = useState({ is_online: false, is_typing: false });
  const setActivePeer = useChatStore((state) => state.setActivePeer);

  const loadMessages = useCallback(async () => {
    if (!peer) return;
    setLoading(true);
    try {
      const { data } = await getMessages(peer, 50);
      setMessages(data?.items || []);
      await markMessagesSeen(peer);
    } catch (err) {
      pushToast({ type: 'error', title: 'خطأ', description: 'تعذر تحميل الرسائل' });
    } finally {
      setLoading(false);
    }
  }, [peer, pushToast]);

  useEffect(() => {
    loadMessages();
    setActivePeer(peer);
    
    const unsubscribe = socketManager.on('new_private_message', (msg) => {
      if (msg.sender === peer || msg.receiver === peer) {
        setMessages(prev => [...prev, msg]);
        if (msg.sender === peer) markMessagesSeen(peer);
      }
    });

    return () => {
      unsubscribe();
      setActivePeer(null);
    };
  }, [peer, loadMessages, setActivePeer]);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      listRef.current.scrollToItem(messages.length - 1);
    }
  }, [messages.length]);

  const handleSend = async (content) => {
    const tempId = Date.now();
    const newMsg = { id: tempId, sender: currentUser, content, created_at: new Date().toISOString(), status: 'sending' };
    setMessages(prev => [...prev, newMsg]);

    try {
      await sendMessageApi(peer, { content });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
    } catch (e) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      pushToast({ type: 'error', title: 'خطأ', description: 'فشل إرسال الرسالة' });
    }
  };

  const listData = useMemo(() => ({
    messages,
    currentUser
  }), [messages, currentUser]);

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-70px)] bg-white">
        {/* Chat Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            <div>
              <div className="font-bold">@{peer}</div>
              <div className="text-xs text-green-500">{presence.is_online ? 'متصل الآن' : 'غير متصل'}</div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">جارٍ التحميل...</div>
          ) : (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  width={width}
                  itemCount={messages.length}
                  itemSize={70}
                  itemData={listData}
                  className="no-scrollbar"
                >
                  {MessageRow}
                </List>
              )}
            </AutoSizer>
          )}
        </div>

        {/* Input Area */}
        <ChatInput onSend={handleSend} />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </MainLayout>
  );
}
