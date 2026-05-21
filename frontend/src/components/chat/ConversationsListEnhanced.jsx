import { useState, useMemo } from 'react';

/**
 * Enhanced ConversationsList Component
 * Professional conversations list with search, filtering, and status indicators
 */
export default function ConversationsListEnhanced({
  conversations,
  selectedConversation,
  onSelectConversation,
  onSearch,
  onDeleteConversation,
  currentUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, unread, archived, muted

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by type
    if (filterType === 'unread') {
      filtered = filtered.filter(conv => conv.unreadCount > 0);
    } else if (filterType === 'archived') {
      filtered = filtered.filter(conv => conv.archived);
    } else if (filterType === 'muted') {
      filtered = filtered.filter(conv => conv.muted);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv =>
        conv.name.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
      );
    }

    // Sort by last message time
    return filtered.sort((a, b) =>
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  }, [conversations, searchQuery, filterType]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes === 0 ? 'الآن' : `${diffInMinutes}د`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('ar-SA', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversationItem = (conversation) => {
    const isSelected = selectedConversation?.id === conversation.id;
    const isOnline = conversation.online;
    const hasUnread = conversation.unreadCount > 0;

    return (
      <div
        key={conversation.id}
        className={`conversation-item ${isSelected ? 'active' : ''}`}
        onClick={() => onSelectConversation(conversation)}
        style={{
          cursor: 'pointer',
          transition: 'all var(--transition-base)',
          opacity: conversation.archived ? 0.6 : 1,
        }}
      >
        {/* Avatar with Status */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div className={`conversation-avatar ${conversation.isGroup ? 'group' : ''}`}>
            {conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt={conversation.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'inherit',
                  objectFit: 'cover'
                }}
              />
            ) : (
              conversation.name.charAt(0).toUpperCase()
            )}
          </div>
          {isOnline && !conversation.isGroup && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: 'var(--color-success)',
              border: '2px solid var(--color-bg-secondary)',
              boxShadow: '0 0 0 2px var(--color-bg-secondary)'
            }} />
          )}
        </div>

        {/* Content */}
        <div className="conversation-content">
          <div className="conversation-header">
            <div className="conversation-name" style={{
              fontWeight: hasUnread ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
              color: hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
            }}>
              {conversation.name}
              {conversation.muted && ' 🔇'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div className="conversation-time">
                {formatTime(conversation.lastMessageTime)}
              </div>
              {hasUnread && (
                <div className="conversation-badge">
                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                </div>
              )}
            </div>
          </div>

          <div className="conversation-message" style={{
            fontWeight: hasUnread ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)',
            color: hasUnread ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-1)'
          }}>
            {conversation.lastMessageSender === currentUser && '👤'}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversation.lastMessage}
            </span>
          </div>
        </div>

        {/* Context Menu */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-1)',
          opacity: 0,
          transition: 'opacity var(--transition-base)',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation?.(conversation.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: 'var(--text-lg)',
              transition: 'color var(--transition-base)',
              padding: 'var(--space-1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
            title="حذف"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-4)',
        borderBottom: '1px solid var(--color-border-primary)',
        flexShrink: 0
      }}>
        <h2 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-text-primary)',
          margin: '0 0 var(--space-4) 0'
        }}>
          الرسائل
        </h2>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          background: 'var(--color-surface-tertiary)',
          border: '1px solid var(--color-border-secondary)',
          borderRadius: 'var(--radius-full)',
          transition: 'all var(--transition-base)'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        >
          <span style={{ fontSize: 'var(--text-lg)' }}>🔍</span>
          <input
            type="text"
            placeholder="ابحث عن محادثة..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--text-sm)',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        borderBottom: '1px solid var(--color-border-secondary)',
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {['all', 'unread', 'archived', 'muted'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              background: filterType === type ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: filterType === type ? '1px solid var(--color-primary)' : '1px solid var(--color-border-secondary)',
              color: filterType === type ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-weight-semibold)',
              transition: 'all var(--transition-base)',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (filterType !== type) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (filterType !== type) {
                e.currentTarget.style.borderColor = 'var(--color-border-secondary)';
              }
            }}
          >
            {type === 'all' && 'الكل'}
            {type === 'unread' && 'غير مقروءة'}
            {type === 'archived' && 'أرشيف'}
            {type === 'muted' && 'مكتومة'}
          </button>
        ))}
      </div>

      {/* Conversations List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {filteredConversations.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-8)',
            textAlign: 'center',
            flex: 1,
            color: 'var(--color-text-muted)'
          }}>
            <div style={{ fontSize: 'var(--text-5xl)' }}>💬</div>
            <div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                لا توجد محادثات
              </div>
              <div style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                ابدأ محادثة جديدة
              </div>
            </div>
          </div>
        ) : (
          filteredConversations.map(renderConversationItem)
        )}
      </div>
    </div>
  );
}
