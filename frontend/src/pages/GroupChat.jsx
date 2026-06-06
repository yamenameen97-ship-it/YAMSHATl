import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMessages, sendMessageApi, uploadMedia } from '../api/chat.js';
import { getGroupDetails } from '../api/groups.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';
import '../styles/group-chat.css';

const GroupChat = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const currentUser = getCurrentUsername();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // جلب معلومات المجموعة (الاسم، الصورة، الأعضاء، الخ.)
  useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const res = await getGroupDetails(groupId);
        if (!cancelled) {
          setGroupInfo(res.data || res);
        }
      } catch (err) {
        console.warn('Could not load group info:', err?.message);
        if (!cancelled) {
          setGroupInfo({ name: 'المجموعة', members_count: 0, icon: '👥' });
        }
      }
    };
    fetchGroup();
    return () => { cancelled = true; };
  }, [groupId]);

  // جلب الرسائل + الاشتراك بالسوكيت
  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const response = await getMessages(`group:${groupId}`);
        const history = Array.isArray(response.data) ? response.data : (response.data?.items || []);

        const formattedMessages = history.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.content || msg.text || msg.message,
          mediaUrl: msg.media_url || null,
          mediaType: msg.message_type || 'text',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: msg.sender === currentUser,
          avatar: msg.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`
        }));

        // الرسائل تأتي من الأقدم للأحدث بعد reverse
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Error fetching group messages:', err);
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 100);
      }
    };

    fetchChatData();

    // الاتصال بالسوكيت
    socketManager.connect();

    // الانضمام لغرفة المجموعة
    try {
      socketManager.emit('join_group', { group_id: groupId, room: `group:${groupId}` });
    } catch (e) { /* تجاهل */ }

    const handleNewMessage = (payload) => {
      if (payload.receiver === `group:${groupId}`) {
        const newMsg = {
          id: payload.id || Date.now(),
          sender: payload.sender,
          text: payload.content || payload.text || payload.message,
          mediaUrl: payload.media_url || null,
          mediaType: payload.message_type || 'text',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: payload.sender === currentUser,
          avatar: payload.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.sender}`
        };
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      }
    };

    socketManager.on('new_message', handleNewMessage);

    return () => {
      socketManager.off('new_message', handleNewMessage);
      try {
        socketManager.emit('leave_group', { group_id: groupId, room: `group:${groupId}` });
      } catch (e) { /* تجاهل */ }
    };
  }, [groupId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    // إضافة الرسالة محلياً فوراً (Optimistic UI)
    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: currentUser,
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`
    };
    setMessages(prev => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const payload = {
        receiver: `group:${groupId}`,
        content: content,
        message: content,
        type: 'text'
      };

      const response = await sendMessageApi(payload);
      const serverMsg = response.data || {};

      // استبدال الرسالة المؤقتة بالرسالة من الخادم
      setMessages(prev => prev.map(m =>
        m.id === tempId
          ? {
              ...m,
              id: serverMsg.id || tempId,
              pending: false,
            }
          : m
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      // إزالة الرسالة المؤقتة وإعادة النص للحقل
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessage(content);
      alert('فشل إرسال الرسالة. حاول مرة أخرى.');
    }
  };

  const handleFileUpload = async (e, mediaType = 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAttachMenu(false);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await uploadMedia(formData);
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.media_url;

      if (!mediaUrl) throw new Error('No URL returned from upload');

      // إرسال رسالة وسائط للمجموعة
      const payload = {
        receiver: `group:${groupId}`,
        content: '',
        media_url: mediaUrl,
        type: mediaType
      };

      await sendMessageApi(payload);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('فشل رفع الملف. حاول مرة أخرى.');
    } finally {
      setUploading(false);
      // إعادة تعيين الـ input
      if (e.target) e.target.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const openSettings = useCallback(() => {
    navigate(`/groups/${groupId}/settings`);
  }, [groupId, navigate]);

  // اسم المجموعة الفعلي مع fallback
  const groupName = groupInfo?.name || groupInfo?.title || 'دردشة المجموعة';
  const groupIcon = groupInfo?.icon || groupInfo?.image_url || null;
  const membersCount = groupInfo?.members_count || groupInfo?.members?.length || 0;

  return (
    <div className="yam-group-chat-container">
      {/* الهيدر العلوي */}
      <header className="yam-group-header">
        {/* زر الرجوع */}
        <button
          className="yam-back-arrow-btn"
          onClick={() => navigate('/groups')}
          aria-label="رجوع"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '22px',
            cursor: 'pointer',
            padding: '4px 8px',
            marginInlineEnd: '4px'
          }}
        >
          ←
        </button>

        {/* النقر على معلومات المجموعة يفتح الإعدادات */}
        <div className="yam-group-info" onClick={openSettings} style={{cursor: 'pointer', flex: 1}}>
          <div className="yam-group-icon-wrap">
            {groupIcon && groupIcon.startsWith('http') ? (
              <img src={groupIcon} alt={groupName} style={{width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover'}} />
            ) : (
              <span style={{fontSize: '24px'}}>{groupIcon || '👥'}</span>
            )}
          </div>
          <div className="yam-group-details">
            <h2>{groupName} <span className="yam-verified-badge">✔️</span></h2>
            <div className="yam-group-status">
              <span className="yam-status-dot"></span>
              {membersCount > 0 ? `${membersCount} عضو` : 'متصل الآن'}
            </div>
          </div>
        </div>
        <div className="yam-header-actions">
          <button type="button" className="yam-action-btn" title="مكالمة صوتية" aria-label="مكالمة صوتية">📞</button>
          <button type="button" className="yam-action-btn" title="مكالمة فيديو" aria-label="مكالمة فيديو">🎥</button>
          <button type="button" className="yam-action-btn" onClick={openSettings} title="إعدادات المجموعة" aria-label="إعدادات المجموعة">ℹ️</button>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <main className="yam-group-messages">
        {loading ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>جاري تحميل الرسائل...</div>
        ) : messages.length === 0 ? (
          <div style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>لا توجد رسائل بعد. ابدأ المحادثة!</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`yam-message-group ${msg.isMe ? 'me' : ''} ${msg.pending ? 'pending' : ''}`}>
              <div className="yam-user-avatar-wrap">
                <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
              </div>
              <div className="yam-message-content-wrap">
                {!msg.isMe && <span className="yam-sender-name">{msg.sender}</span>}
                <div className="yam-message-bubble">
                  {msg.mediaUrl ? (
                    msg.mediaType === 'image' ? (
                      <img src={msg.mediaUrl} alt="media" style={{maxWidth: '240px', borderRadius: '8px', display: 'block'}} />
                    ) : (
                      <a href={msg.mediaUrl} target="_blank" rel="noreferrer" style={{color: '#a78bfa'}}>📎 {msg.text || 'ملف مرفق'}</a>
                    )
                  ) : (
                    msg.text
                  )}
                </div>
                <div className="yam-message-time">
                  {msg.time}
                  {msg.isMe && (
                    <span className="yam-read-receipt">
                      {msg.pending ? '🕓' : '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* قائمة المرفقات المنبثقة */}
      {showAttachMenu && (
        <div
          className="yam-attach-menu"
          style={{
            position: 'absolute',
            bottom: '80px',
            insetInlineStart: '12px',
            background: '#1e293b',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 50,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <button
            className="yam-attach-option"
            onClick={() => imageInputRef.current?.click()}
            style={{background: 'transparent', border: 'none', color: '#fff', padding: '10px', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            🖼️ صورة
          </button>
          <button
            className="yam-attach-option"
            onClick={() => fileInputRef.current?.click()}
            style={{background: 'transparent', border: 'none', color: '#fff', padding: '10px', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px'}}
          >
            📄 ملف
          </button>
          <button
            className="yam-attach-option"
            onClick={() => setShowAttachMenu(false)}
            style={{background: 'transparent', border: 'none', color: '#94a3b8', padding: '8px', cursor: 'pointer', textAlign: 'center'}}
          >
            إلغاء
          </button>
        </div>
      )}

      {/* inputs مخفية لرفع الملفات */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{display: 'none'}}
        onChange={(e) => handleFileUpload(e, 'file')}
      />

      {/* منطقة الإدخال */}
      <footer className="yam-group-input-area">
        <button
          className="yam-plus-btn"
          onClick={() => setShowAttachMenu(prev => !prev)}
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
          disabled={uploading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}
        >
          {/* أيقونة مشبك ورق احترافية (SVG) */}
          {uploading ? (
            <span style={{fontSize: '14px'}}>⏳</span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          )}
        </button>
        <div className="yam-input-wrapper">
          <input
            type="text"
            className="yam-chat-input"
            placeholder="اكتب رسالة..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <span className="yam-input-icon">😊</span>
        </div>
        <button className="yam-send-btn" onClick={handleSendMessage} aria-label="إرسال">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default GroupChat;
