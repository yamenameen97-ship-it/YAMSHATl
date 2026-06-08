import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getGroupDetails,
  getGroupMessages,
  sendGroupMessage,
  uploadGroupMedia,
} from '../api/groups.js';
import socketManager from '../services/socketManager.js';
import { getCurrentUsername } from '../utils/auth.js';
import '../styles/group-chat.css';

/**
 * صفحة دردشة مجموعة واحدة.
 *
 * ⚠️ ملاحظة هامة بشأن العزل بين المجموعات:
 *  - كل مجموعة لها id فريد في الباك اند ولها رسائلها الخاصة في
 *    /api/groups/{group_id}/messages (مخزّن منفصل في group_store_enhanced).
 *  - نستخدم في الـ Router مفتاح key={groupId} (في App.jsx) لإجبار React
 *    على إعادة mount كاملة للمكوّن عند تغيّر المجموعة، حتى لا تتسرّب
 *    رسائل من مجموعة لأخرى عبر state قديم.
 *  - بالإضافة لذلك نمسح state يدويًا عند تغيّر groupId كحارس إضافي،
 *    ونغادر غرفة السوكيت السابقة قبل الانضمام للجديدة.
 */
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

  // نحتفظ بمعرّف المجموعة الحالية في ref حتى يستطيع socket handler
  // التحقّق منه بدقّة (ويمنع استقبال رسائل قديمة من مجموعة سابقة).
  const activeGroupIdRef = useRef(groupId);
  useEffect(() => {
    activeGroupIdRef.current = groupId;
  }, [groupId]);

  const currentUser = getCurrentUsername();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 🧹 مسح state فوريّ عند تغيّر المجموعة (حارس ضد تسرّب الرسائل).
  useEffect(() => {
    setMessages([]);
    setGroupInfo(null);
    setLoading(true);
    setMessage('');
    setShowAttachMenu(false);
  }, [groupId]);

  // 📥 جلب معلومات المجموعة
  useEffect(() => {
    let cancelled = false;
    const fetchGroup = async () => {
      try {
        const res = await getGroupDetails(groupId);
        if (cancelled) return;
        // الباك اند يعيد serialize_group(...) مباشرة (وليس داخل group:)
        const data = res.data || res;
        setGroupInfo(data);
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

  // 📥 جلب رسائل المجموعة + الاشتراك بسوكيت الغرفة الخاصة بها فقط.
  useEffect(() => {
    let cancelled = false;
    const room = `group:${groupId}`;

    const fetchChatData = async () => {
      try {
        setLoading(true);
        // استخدام endpoint مخصّص للمجموعة (عزل تام عن الشات الخاص)
        const response = await getGroupMessages(groupId, { limit: 50, offset: 0 });
        if (cancelled) return;

        // الباك اند يعيد قائمة الرسائل مباشرة (أحدث→أقدم)، نقلبها لتصير أقدم→أحدث.
        const raw = Array.isArray(response.data)
          ? response.data
          : (response.data?.items || []);

        const formattedMessages = raw.map((msg) => ({
          id: msg.id,
          // تأكيد ربط الرسالة بمجموعتها (للفلترة الدفاعية)
          group_id: String(msg.group_id || groupId),
          sender: msg.sender_username || msg.sender,
          text: msg.content || msg.text || msg.message || '',
          mediaUrl:
            msg.media_url ||
            (Array.isArray(msg.attachments) && msg.attachments[0]?.url) ||
            null,
          mediaType: msg.message_type || 'text',
          time: new Date(msg.created_at || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isMe: (msg.sender_username || msg.sender) === currentUser,
          avatar:
            msg.sender_avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender_username || msg.sender}`,
        }));

        // ترتيب أقدم → أحدث
        formattedMessages.sort((a, b) => String(a.id).localeCompare(String(b.id)));
        setMessages(formattedMessages);
      } catch (err) {
        console.error('Error fetching group messages:', err);
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(scrollToBottom, 100);
        }
      }
    };

    fetchChatData();

    // 🔌 الاتصال بالسوكيت + الانضمام لغرفة هذه المجموعة فقط.
    socketManager.connect();
    try {
      socketManager.emit('join_group', { group_id: groupId, room });
    } catch { /* تجاهل */ }

    // 🛡️ فلتر دفاعي: نقبل فقط الرسائل التي تنتمي صراحةً لهذه المجموعة.
    const handleNewMessage = (payload) => {
      const currentGid = activeGroupIdRef.current;
      const payloadGid =
        String(payload.group_id || '') ||
        (typeof payload.receiver === 'string' && payload.receiver.startsWith('group:')
          ? payload.receiver.slice('group:'.length)
          : '');

      // إذا لم يكن للرسالة أي ارتباط بهذه المجموعة → تجاهل.
      if (String(payloadGid) !== String(currentGid)) return;

      const newMsg = {
        id: payload.id || `srv_${Date.now()}`,
        group_id: String(currentGid),
        sender: payload.sender_username || payload.sender,
        text: payload.content || payload.text || payload.message || '',
        mediaUrl:
          payload.media_url ||
          (Array.isArray(payload.attachments) && payload.attachments[0]?.url) ||
          null,
        mediaType: payload.message_type || 'text',
        time: new Date(payload.created_at || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isMe: (payload.sender_username || payload.sender) === currentUser,
        avatar:
          payload.sender_avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.sender_username || payload.sender}`,
      };

      setMessages((prev) => {
        if (prev.find((m) => String(m.id) === String(newMsg.id))) return prev;
        return [...prev, newMsg];
      });
      scrollToBottom();
    };

    socketManager.on('new_message', handleNewMessage);
    socketManager.on('group_message', handleNewMessage);

    return () => {
      cancelled = true;
      socketManager.off('new_message', handleNewMessage);
      socketManager.off('group_message', handleNewMessage);
      try {
        socketManager.emit('leave_group', { group_id: groupId, room });
      } catch { /* تجاهل */ }
    };
  }, [groupId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const content = message.trim();
    setMessage('');

    // Optimistic UI: نضيف الرسالة محليًا مع تمييزها بمجموعتها.
    const tempId = `tmp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      group_id: String(groupId),
      sender: currentUser,
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      pending: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser}`,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      // ✅ استخدام endpoint مخصّص للمجموعة (عزل تام عن /send_message العام).
      const response = await sendGroupMessage(groupId, {
        content,
        message_type: 'text',
      });

      const body = response.data || {};
      const serverMsg = body.message || body; // الباك اند يعيد {status, message: {...}}

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: serverMsg.id || tempId,
                pending: false,
              }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
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

      const uploadRes = await uploadGroupMedia(formData);
      const mediaUrl = uploadRes.data?.url || uploadRes.data?.media_url;
      if (!mediaUrl) throw new Error('No URL returned from upload');

      // إرسال رسالة وسائط للمجموعة عبر endpoint المجموعة المخصّص.
      await sendGroupMessage(groupId, {
        content: '',
        message_type: mediaType,
        attachments: [
          {
            url: mediaUrl,
            kind: mediaType,
          },
        ],
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('فشل رفع الملف. حاول مرة أخرى.');
    } finally {
      setUploading(false);
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
  const membersCount =
    groupInfo?.members_count ||
    (Array.isArray(groupInfo?.members) ? groupInfo.members.length : 0) ||
    0;

  return (
    <div className="yam-group-chat-container">
      {/* الهيدر */}
      <header className="yam-group-header">
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
            marginInlineEnd: '4px',
          }}
        >
          ←
        </button>

        <div
          className="yam-group-info"
          onClick={openSettings}
          style={{ cursor: 'pointer', flex: 1 }}
        >
          <div className="yam-group-icon-wrap">
            {groupIcon && String(groupIcon).startsWith('http') ? (
              <img
                src={groupIcon}
                alt={groupName}
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '24px' }}>{groupIcon || '👥'}</span>
            )}
          </div>
          <div className="yam-group-details">
            <h2>
              {groupName} <span className="yam-verified-badge">✔️</span>
            </h2>
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
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            جاري تحميل الرسائل...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            لا توجد رسائل بعد. ابدأ المحادثة!
          </div>
        ) : (
          messages
            // فلتر دفاعي إضافي: لا تعرض إلا الرسائل المنتمية لهذه المجموعة
            .filter((m) => !m.group_id || String(m.group_id) === String(groupId))
            .map((msg) => (
              <div
                key={msg.id}
                className={`yam-message-group ${msg.isMe ? 'me' : ''} ${msg.pending ? 'pending' : ''}`}
              >
                <div className="yam-user-avatar-wrap">
                  <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
                </div>
                <div className="yam-message-content-wrap">
                  {!msg.isMe && <span className="yam-sender-name">{msg.sender}</span>}
                  <div className="yam-message-bubble">
                    {msg.mediaUrl ? (
                      msg.mediaType === 'image' ? (
                        <img
                          src={msg.mediaUrl}
                          alt="media"
                          style={{ maxWidth: '240px', borderRadius: '8px', display: 'block' }}
                        />
                      ) : (
                        <a
                          href={msg.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#a78bfa' }}
                        >
                          📎 {msg.text || 'ملف مرفق'}
                        </a>
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

      {/* قائمة المرفقات */}
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
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            className="yam-attach-option"
            onClick={() => imageInputRef.current?.click()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            🖼️ صورة
          </button>
          <button
            className="yam-attach-option"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              padding: '10px',
              cursor: 'pointer',
              textAlign: 'right',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            📄 ملف
          </button>
          <button
            className="yam-attach-option"
            onClick={() => setShowAttachMenu(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '8px',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            إلغاء
          </button>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'image')}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => handleFileUpload(e, 'file')}
      />

      <footer className="yam-group-input-area">
        <button
          className="yam-plus-btn"
          onClick={() => setShowAttachMenu((prev) => !prev)}
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
          disabled={uploading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          {uploading ? (
            <span style={{ fontSize: '14px' }}>⏳</span>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </footer>
    </div>
  );
};

export default GroupChat;
