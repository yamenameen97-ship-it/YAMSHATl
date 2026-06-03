import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroups } from '../api/groups.js';
import { useToast } from '../components/admin/ToastProvider.jsx';
import '../styles/group-chat.css';

const FALLBACK_GROUPS = [
  { id: 'future-leaders', name: 'رواد المستقبل', membersCount: 128, icon: '🚀', verified: true },
  { id: 'arab-devs', name: 'مطورين العرب', membersCount: 256, icon: '</>', verified: true },
  { id: 'gaming-hub', name: 'عشاق الألعاب', membersCount: 312, icon: '🎮', verified: true },
];

const DEFAULT_MESSAGES = [
  { id: 1, sender: 'أحمد', text: 'أهلًا يا شباب، تم نقل فتح المجموعات للصفحة الجديدة بنجاح.', time: '10:30', isMe: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed' },
  { id: 2, sender: 'سارة', text: 'ممتاز، كده التنقل بقى أوضح ومافيش تعارض بين الشاشات القديمة والجديدة.', time: '10:32', isMe: true, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara', read: true },
  { id: 3, sender: 'محمد', text: 'ولو حد ضغط من صفحة الرسائل أو من زر إنشاء مجموعة هيتفتح هنا مباشرة.', time: '10:35', isMe: false, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed' },
];

function normalizeGroup(raw = {}, index = 0) {
  return {
    id: String(raw.id || raw.group_id || raw.slug || `fallback-${index + 1}`),
    name: raw.name || raw.title || raw.group_name || `مجموعة ${index + 1}`,
    membersCount: Number(raw.members_count ?? raw.membersCount ?? raw.members?.length ?? 128),
    icon: raw.icon || ['👥', '🚀', '🎮', '📚'][index % 4],
    verified: Boolean(raw.verified ?? raw.is_verified ?? true),
  };
}

export default function GroupChat() {
  const navigate = useNavigate();
  const { groupId = '' } = useParams();
  const { pushToast } = useToast();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [groupMeta, setGroupMeta] = useState(normalizeGroup(FALLBACK_GROUPS[0], 0));

  useEffect(() => {
    let mounted = true;
    getGroups()
      .then((response) => {
        if (!mounted) return;
        const payload = response?.data?.groups || response?.data || [];
        const list = (Array.isArray(payload) && payload.length ? payload : FALLBACK_GROUPS).map(normalizeGroup);
        const matched = list.find((entry) => entry.id === String(groupId)) || list[0] || normalizeGroup({ id: groupId || 'group', name: 'مجموعة يام شات' }, 0);
        setGroupMeta(matched);
      })
      .catch(() => {
        if (!mounted) return;
        const list = FALLBACK_GROUPS.map(normalizeGroup);
        const matched = list.find((entry) => entry.id === String(groupId)) || normalizeGroup({ id: groupId || 'group', name: 'مجموعة يام شات' }, 0);
        setGroupMeta(matched);
      });
    return () => {
      mounted = false;
    };
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onlineCount = useMemo(() => Math.max(12, Math.min(groupMeta.membersCount || 128, 128)), [groupMeta.membersCount]);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    setMessages((prev) => ([
      ...prev,
      {
        id: Date.now(),
        sender: 'أنت',
        text,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
        read: true,
      },
    ]));
    setMessage('');
  };

  return (
    <div className="yam-group-chat-container" dir="rtl">
      <header className="yam-group-header">
        <div className="yam-group-info">
          <button type="button" className="yam-action-btn" onClick={() => navigate('/groups')} aria-label="رجوع">←</button>
          <div className="yam-group-icon-wrap">
            <span style={{ fontSize: 24 }}>{groupMeta.icon}</span>
          </div>
          <div className="yam-group-details">
            <h2>
              {groupMeta.name}
              {groupMeta.verified ? <span className="yam-verified-badge">✔️</span> : null}
            </h2>
            <div className="yam-group-status">
              <span className="yam-status-dot" />
              {onlineCount} عضواً متصلون الآن
            </div>
          </div>
        </div>
        <div className="yam-header-actions">
          <button type="button" className="yam-action-btn" onClick={() => pushToast?.({ type: 'info', title: 'تم فتح صفحة المجموعات الحديثة', description: 'كل الأزرار أصبحت موحّدة على نفس المسار.' })}>ℹ️</button>
          <button type="button" className="yam-action-btn" onClick={() => navigate('/groups')}>👥</button>
        </div>
      </header>

      <main className="yam-group-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`yam-message-group ${msg.isMe ? 'me' : ''}`}>
            <div className="yam-user-avatar-wrap">
              <img src={msg.avatar} alt={msg.sender} className="yam-user-avatar" />
              <div className="yam-user-status-indicator" />
            </div>
            <div className="yam-message-content-wrap">
              {!msg.isMe ? <span className="yam-sender-name">{msg.sender}</span> : null}
              <div className="yam-message-bubble">{msg.text}</div>
              <div className="yam-message-time">
                {msg.time}
                {msg.isMe && msg.read ? <span className="yam-read-receipt">✓✓</span> : null}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="yam-group-input-area">
        <button type="button" className="yam-plus-btn" onClick={() => navigate('/groups?create=1')}>+</button>
        <div className="yam-input-wrapper">
          <input
            type="text"
            className="yam-chat-input"
            placeholder="اكتب رسالة..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSend();
            }}
          />
          <span className="yam-input-icon">😊</span>
        </div>
        <button type="button" className="yam-send-btn" onClick={handleSend}>
          <span style={{ transform: 'rotate(-45deg)', display: 'inline-block', marginLeft: 4 }}>✈️</span>
        </button>
      </footer>
    </div>
  );
}
