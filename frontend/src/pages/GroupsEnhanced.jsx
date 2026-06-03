import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../admin/ToastProvider.jsx';

export default function GroupsEnhanced() {
  const { pushToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, joined, created
  const [searchQuery, setSearchQuery] = useState('');

  // تحميل المجموعات
  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      // محاكاة جلب المجموعات من الخادم
      const mockGroups = [
        {
          id: '1',
          name: 'مجموعة التطوير',
          description: 'نقاشات حول تطوير الويب والتطبيقات',
          avatar: '👨‍💻',
          members_count: 245,
          messages_count: 1203,
          is_joined: true,
          created_at: '2024-01-15',
          last_message: 'آخر رسالة في المجموعة',
          last_message_time: '2 ساعات',
        },
        {
          id: '2',
          name: 'مجموعة التصميم',
          description: 'تبادل الأفكار والتصاميم الإبداعية',
          avatar: '🎨',
          members_count: 189,
          messages_count: 856,
          is_joined: true,
          created_at: '2024-02-20',
          last_message: 'نقاش حول أحدث الاتجاهات',
          last_message_time: '1 ساعة',
        },
        {
          id: '3',
          name: 'مجموعة التسويق',
          description: 'استراتيجيات التسويق الرقمي',
          avatar: '📱',
          members_count: 312,
          messages_count: 2145,
          is_joined: false,
          created_at: '2024-03-10',
          last_message: 'نصائح للتسويق الفعال',
          last_message_time: '30 دقيقة',
        },
      ];
      
      setGroups(mockGroups);
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'خطأ في تحميل المجموعات',
        description: error?.message || 'حاول مرة أخرى'
      });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  // تحميل رسائل المجموعة
  const loadGroupMessages = useCallback(async (groupId) => {
    if (!groupId) return;
    
    try {
      // محاكاة جلب الرسائل
      const mockMessages = [
        {
          id: '1',
          sender_name: 'أحمد محمد',
          sender_avatar: '👨',
          content: 'مرحباً بالجميع! كيفكم؟',
          timestamp: '10:30',
          is_pinned: false,
        },
        {
          id: '2',
          sender_name: 'فاطمة علي',
          sender_avatar: '👩',
          content: 'أهلاً! أنا بخير، شكراً للسؤال',
          timestamp: '10:35',
          is_pinned: false,
        },
        {
          id: '3',
          sender_name: 'محمود حسن',
          sender_avatar: '👨',
          content: 'هل لديكم أفكار جديدة للمشروع؟',
          timestamp: '10:40',
          is_pinned: true,
        },
      ];
      
      setGroupMessages(mockMessages);
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'خطأ في تحميل الرسائل',
        description: error?.message || 'حاول مرة أخرى'
      });
    }
  }, [pushToast]);

  // إرسال رسالة
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !selectedGroup) return;

    try {
      const newMessage = {
        id: String(Date.now()),
        sender_name: 'أنت',
        sender_avatar: '👤',
        content: messageText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        is_pinned: false,
      };

      setGroupMessages(prev => [...prev, newMessage]);
      setMessageText('');

      pushToast?.({
        type: 'success',
        title: 'تم إرسال الرسالة',
      });
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'خطأ في إرسال الرسالة',
        description: error?.message || 'حاول مرة أخرى'
      });
    }
  }, [messageText, selectedGroup, pushToast]);

  // الانضمام للمجموعة
  const handleJoinGroup = useCallback(async (groupId) => {
    try {
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, is_joined: true } : g
      ));

      pushToast?.({
        type: 'success',
        title: 'تم الانضمام للمجموعة',
      });
    } catch (error) {
      pushToast?.({
        type: 'error',
        title: 'خطأ في الانضمام',
        description: error?.message || 'حاول مرة أخرى'
      });
    }
  }, [pushToast]);

  // تصفية المجموعات
  const filteredGroups = groups.filter(group => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'joined' && group.is_joined) ||
      (filter === 'created' && !group.is_joined);
    
    const matchesSearch = 
      group.name.includes(searchQuery) ||
      group.description.includes(searchQuery);
    
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    if (selectedGroup) {
      loadGroupMessages(selectedGroup.id);
    }
  }, [selectedGroup, loadGroupMessages]);

  return (
    <div className="groups-enhanced-container">
      <div className="groups-layout">
        {/* قائمة المجموعات */}
        <div className="groups-list-section">
          <div className="groups-header">
            <h2>المجموعات</h2>
            <button className="btn-create-group" title="إنشاء مجموعة جديدة">
              ➕ جديدة
            </button>
          </div>

          {/* شريط البحث والتصفية */}
          <div className="groups-controls">
            <input
              type="text"
              className="search-input"
              placeholder="ابحث عن مجموعة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="filter-buttons">
              {['all', 'joined', 'created'].map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' && 'الكل'}
                  {f === 'joined' && 'المنضمة'}
                  {f === 'created' && 'المنشأة'}
                </button>
              ))}
            </div>
          </div>

          {/* قائمة المجموعات */}
          <div className="groups-items">
            {loading ? (
              <div className="loading-state">جاري التحميل...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="empty-state">لا توجد مجموعات</div>
            ) : (
              filteredGroups.map(group => (
                <div
                  key={group.id}
                  className={`group-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="group-avatar">{group.avatar}</div>
                  
                  <div className="group-info">
                    <h3 className="group-name">{group.name}</h3>
                    <p className="group-last-message">{group.last_message}</p>
                    <div className="group-meta">
                      <span className="members-count">👥 {group.members_count}</span>
                      <span className="last-message-time">{group.last_message_time}</span>
                    </div>
                  </div>

                  {!group.is_joined && (
                    <button
                      className="btn-join"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinGroup(group.id);
                      }}
                    >
                      انضم
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* منطقة الدردشة */}
        <div className="group-chat-section">
          {selectedGroup ? (
            <>
              {/* رأس الدردشة */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <h2>{selectedGroup.name}</h2>
                  <p className="chat-members">👥 {selectedGroup.members_count} عضو</p>
                </div>
                <button className="btn-group-settings" title="إعدادات المجموعة">
                  ⚙️
                </button>
              </div>

              {/* منطقة الرسائل */}
              <div className="messages-container">
                {groupMessages.length === 0 ? (
                  <div className="empty-messages">
                    <p>لا توجد رسائل حتى الآن</p>
                    <p className="text-muted">كن أول من يرسل رسالة!</p>
                  </div>
                ) : (
                  groupMessages.map(message => (
                    <div key={message.id} className="message-item">
                      <div className="message-avatar">{message.sender_avatar}</div>
                      
                      <div className="message-content">
                        <div className="message-header">
                          <span className="sender-name">{message.sender_name}</span>
                          <span className="message-time">{message.timestamp}</span>
                          {message.is_pinned && <span className="pinned-badge">📌 مثبتة</span>}
                        </div>
                        <p className="message-text">{message.content}</p>
                      </div>

                      <div className="message-actions">
                        <button className="action-btn" title="رد">↩️</button>
                        <button className="action-btn" title="تفاعل">😊</button>
                        <button className="action-btn" title="المزيد">⋮</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* حقل الإدخال */}
              <div className="message-input-area">
                <div className="input-actions">
                  <button className="action-btn" title="إرسال صورة">🖼️</button>
                  <button className="action-btn" title="إرسال ملف">📎</button>
                  <button className="action-btn" title="الرموز التعبيرية">😊</button>
                </div>

                <input
                  type="text"
                  className="message-input"
                  placeholder="اكتب رسالتك هنا..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />

                <button
                  className="btn-send"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  title="إرسال"
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="no-group-selected">
              <p>اختر مجموعة للبدء في الدردشة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
