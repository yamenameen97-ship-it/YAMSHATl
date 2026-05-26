import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import MainLayout from '../components/layout/MainLayout.jsx';
import { getChatThreads } from '../api/chat.js';
import { getCurrentUsername } from '../utils/auth.js';
import { getChatPreferences, toggleChatPreference } from '../utils/chatPreferences.js';
import { CHAT_NAV_ITEMS, buildContacts, getContactDetails } from '../features/chat/chatShellFixtures.js';
import { initialsFromName } from '../components/yamshat/YamshatDesign.js';

function Avatar({ contact, size = 52 }) {
  return contact.avatar ? (
    <img
      src={contact.avatar}
      alt={contact.username}
      style={{ width: size, height: size, borderRadius: size > 60 ? 24 : 18, objectFit: 'cover', flexShrink: 0 }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 60 ? 24 : 18,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        fontWeight: 900,
        fontSize: size * 0.34,
        background: contact.avatarGradient,
        boxShadow: '0 10px 24px rgba(11, 15, 26, 0.28)',
      }}
    >
      {initialsFromName(contact.username).slice(0, 1)}
    </div>
  );
}

function ContactStatus({ contact }) {
  return (
    <span className="yam-status-copy">
      <span className={`yam-status-dot ${contact.isOnline ? 'online' : ''}`} />
      {contact.statusText}
    </span>
  );
}

export default function Inbox() {
  const navigate = useNavigate();
  const currentUser = getCurrentUsername();
  const initialPrefs = useMemo(() => getChatPreferences(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all');
  const [pinnedChats, setPinnedChats] = useState(initialPrefs.pinned);
  const [mutedChats, setMutedChats] = useState(initialPrefs.muted);
  const [selectedUsername, setSelectedUsername] = useState('فاطمة خالد');

  const { data: threads = [] } = useQuery({
    queryKey: ['chat-threads', currentUser],
    queryFn: async () => {
      const { data } = await getChatThreads();
      return Array.isArray(data) ? data : [];
    },
    retry: 1,
  });

  const contacts = useMemo(() => buildContacts(threads, selectedUsername), [selectedUsername, threads]);

  useEffect(() => {
    if (!contacts.length) return;
    if (!contacts.find((contact) => contact.username === selectedUsername)) {
      setSelectedUsername(contacts[0].username);
    }
  }, [contacts, selectedUsername]);

  const filteredContacts = useMemo(() => {
    const lowered = searchQuery.trim().toLowerCase();
    return contacts
      .filter((contact) => {
        const matchesSearch = !lowered
          || String(contact.username).toLowerCase().includes(lowered)
          || String(contact.preview).toLowerCase().includes(lowered);
        if (!matchesSearch) return false;
        if (filterKey === 'unread') return contact.unreadCount > 0;
        if (filterKey === 'pinned') return pinnedChats.has(contact.username);
        if (filterKey === 'muted') return mutedChats.has(contact.username);
        return true;
      })
      .sort((a, b) => {
        const aPinned = pinnedChats.has(a.username);
        const bPinned = pinnedChats.has(b.username);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      });
  }, [contacts, filterKey, mutedChats, pinnedChats, searchQuery]);

  const selectedContact = useMemo(
    () => getContactDetails(filteredContacts.length ? filteredContacts : contacts, selectedUsername),
    [contacts, filteredContacts, selectedUsername],
  );

  const favoriteContacts = useMemo(() => contacts.slice(0, 5), [contacts]);

  const handleTogglePinned = (username, event) => {
    event?.stopPropagation?.();
    const next = toggleChatPreference('pinned', username);
    setPinnedChats(next);
  };

  const handleToggleMuted = (username, event) => {
    event?.stopPropagation?.();
    const next = toggleChatPreference('muted', username);
    setMutedChats(next);
  };

  return (
    <MainLayout hideNav lockScroll>
      <section className="yam-shell-page" dir="rtl">
        <div className="yam-chat-shell yam-chat-shell--inbox">
          <aside className="yam-left-rail">
            <div className="yam-brand-block">
              <div className="yam-brand-mark">Y</div>
              <div>
                <div className="yam-brand-name">YAMSHAT</div>
              </div>
            </div>

            <nav className="yam-primary-nav">
              {CHAT_NAV_ITEMS.map((item, index) => (
                <button key={item.key} type="button" className={`yam-nav-item ${index === 0 ? 'active' : ''}`}>
                  <span className="yam-nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="yam-section-head">
              <span>جهات الاتصال</span>
              <button type="button" className="yam-icon-button">＋</button>
            </div>

            <div className="yam-favorite-list">
              {favoriteContacts.map((contact) => (
                <button
                  key={contact.username}
                  type="button"
                  className={`yam-favorite-row ${selectedUsername === contact.username ? 'active' : ''}`}
                  onClick={() => setSelectedUsername(contact.username)}
                >
                  <div className="yam-avatar-wrap">
                    <Avatar contact={contact} size={54} />
                    <span className={`yam-floating-status ${contact.isOnline ? 'online' : ''}`} />
                  </div>
                  <div className="yam-favorite-copy">
                    <strong>{contact.username}</strong>
                    <span>{contact.statusText}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="yam-user-footer">
              <div className="yam-avatar-wrap">
                <div className="yam-user-avatar">{initialsFromName(currentUser || 'يوسف').slice(0, 1)}</div>
                <span className="yam-floating-status online" />
              </div>
              <div className="yam-user-copy">
                <strong>{currentUser || 'يوسف محمد'}</strong>
                <span>متصل الآن</span>
              </div>
              <button type="button" className="yam-icon-button subtle">⋮</button>
            </div>
          </aside>

          <main className="yam-center-stage">
            <div className="yam-top-search-bar">
              <span>⌕</span>
              <input
                type="search"
                placeholder="بحث في المحادثات..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <div className="yam-stage-card">
              <div className="yam-stage-header-row">
                <h1>الدردشات</h1>
                <select value={filterKey} onChange={(event) => setFilterKey(event.target.value)} className="yam-filter-select">
                  <option value="all">الكل</option>
                  <option value="unread">غير المقروءة</option>
                  <option value="pinned">المثبتة</option>
                  <option value="muted">المكتومة</option>
                </select>
              </div>

              <div className="yam-thread-list">
                {filteredContacts.map((contact) => {
                  const isPinned = pinnedChats.has(contact.username);
                  const isMuted = mutedChats.has(contact.username);
                  const isSelected = selectedUsername === contact.username;

                  return (
                    <button
                      key={contact.username}
                      type="button"
                      className={`yam-thread-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedUsername(contact.username)}
                      onDoubleClick={() => navigate(`/chat/${encodeURIComponent(contact.username)}`)}
                    >
                      <div className="yam-thread-avatar-slot">
                        <Avatar contact={contact} size={58} />
                        <span className={`yam-floating-status ${contact.isOnline ? 'online' : ''}`} />
                      </div>

                      <div className="yam-thread-content">
                        <div className="yam-thread-header-line">
                          <strong>{contact.username}</strong>
                          <span>{contact.timeLabel}</span>
                        </div>
                        <div className="yam-thread-preview-line">
                          <p>{contact.preview}</p>
                          <div className="yam-thread-badges">
                            {isMuted ? <span className="yam-mini-chip">🔕</span> : null}
                            {isPinned ? <span className="yam-mini-chip">📌</span> : null}
                            {contact.unreadCount > 0 ? <span className="yam-unread-pill">{contact.unreadCount}</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="yam-thread-actions" onClick={(event) => event.stopPropagation()}>
                        <button type="button" className="yam-mini-action" onClick={(event) => handleTogglePinned(contact.username, event)}>
                          {isPinned ? '📍' : '📌'}
                        </button>
                        <button type="button" className="yam-mini-action" onClick={(event) => handleToggleMuted(contact.username, event)}>
                          {isMuted ? '🔊' : '🔇'}
                        </button>
                      </div>
                    </button>
                  );
                })}

                {!filteredContacts.length ? (
                  <div className="yam-empty-block">
                    <strong>لا توجد نتائج</strong>
                    <span>جرّب تغيير الفلتر أو البحث باسم مختلف.</span>
                  </div>
                ) : null}
              </div>
            </div>
          </main>

          <aside className="yam-profile-panel">
            <div className="yam-profile-hero">
              <div className="yam-avatar-wrap large">
                <Avatar contact={selectedContact} size={116} />
                <span className={`yam-floating-status large ${selectedContact.isOnline ? 'online' : ''}`} />
              </div>
              <div className="yam-profile-copy">
                <h2>{selectedContact.username}</h2>
                <p>{selectedContact.lastSeenLabel}</p>
              </div>
            </div>

            <div className="yam-quick-actions">
              {[
                { key: 'call', label: 'اتصال', icon: '📞', onClick: () => navigate(`/chat/${encodeURIComponent(selectedContact.username)}`) },
                { key: 'video', label: 'فيديو', icon: '🎥', onClick: () => navigate(`/chat/${encodeURIComponent(selectedContact.username)}`) },
                { key: 'search', label: 'بحث', icon: '⌕', onClick: () => setSearchQuery(selectedContact.username) },
                { key: 'more', label: 'المزيد', icon: '⋯', onClick: () => {} },
              ].map((action) => (
                <button key={action.key} type="button" className="yam-quick-card" onClick={action.onClick}>
                  <span>{action.icon}</span>
                  <small>{action.label}</small>
                </button>
              ))}
            </div>

            <div className="yam-info-card">
              <div className="yam-info-title">معلومات</div>
              <div className="yam-info-row"><span>اسم المستخدم</span><strong>{selectedContact.handle}</strong></div>
              <div className="yam-info-row"><span>البريد الإلكتروني</span><strong>{selectedContact.email}</strong></div>
              <div className="yam-info-row"><span>الهاتف</span><strong>{selectedContact.phone}</strong></div>
            </div>

            <div className="yam-info-card compact">
              {[
                { label: 'الوسائط المشتركة', icon: '🖼️' },
                { label: 'الملفات', icon: '📁' },
                { label: 'الروابط', icon: '🔗' },
                { label: 'المحادثات المثبتة', icon: '📌' },
              ].map((item) => (
                <button key={item.label} type="button" className="yam-list-link" onClick={() => navigate(`/chat/${encodeURIComponent(selectedContact.username)}`)}>
                  <div>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span>‹</span>
                </button>
              ))}
            </div>

            <button type="button" className="yam-danger-btn">حظر المستخدم</button>
            <button type="button" className="yam-open-chat-btn" onClick={() => navigate(`/chat/${encodeURIComponent(selectedContact.username)}`)}>فتح الدردشة</button>
          </aside>
        </div>

        <style>{`
          .yam-shell-page {
            min-height: 100vh;
            height: 100vh;
            overflow: hidden;
            background:
              radial-gradient(circle at top right, rgba(124, 58, 237, 0.14), transparent 26%),
              radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 22%),
              #040714;
          }

          .yam-chat-shell {
            min-height: 100vh;
            height: 100vh;
            display: grid;
            grid-template-columns: 300px minmax(0, 1fr) 320px;
            background: rgba(4, 7, 20, 0.98);
            color: #fff;
            overflow: hidden;
          }

          .yam-left-rail,
          .yam-profile-panel {
            background: linear-gradient(180deg, rgba(7, 10, 24, 0.98), rgba(5, 8, 18, 0.98));
            border-color: rgba(255,255,255,0.05);
            border-style: solid;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .yam-left-rail {
            border-inline-end-width: 1px;
            padding: 22px 16px 18px;
            gap: 18px;
            overflow: auto;
          }

          .yam-profile-panel {
            border-inline-start-width: 1px;
            padding: 28px 20px 20px;
            gap: 18px;
            overflow: auto;
          }

          .yam-brand-block {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 4px 6px 14px;
          }

          .yam-brand-mark {
            width: 42px;
            height: 42px;
            border-radius: 16px;
            display: grid;
            place-items: center;
            font-weight: 900;
            font-size: 20px;
            color: white;
            background: linear-gradient(135deg, #8b5cf6, #4f46e5);
            box-shadow: 0 18px 30px rgba(91, 33, 182, 0.35);
          }

          .yam-brand-name {
            letter-spacing: 0.36em;
            font-size: 20px;
            font-weight: 900;
          }

          .yam-primary-nav {
            display: grid;
            gap: 10px;
          }

          .yam-nav-item {
            min-height: 58px;
            padding: 0 16px;
            border-radius: 18px;
            border: 1px solid transparent;
            background: transparent;
            color: #cbd5e1;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 800;
            text-align: right;
          }

          .yam-nav-item.active {
            color: #fff;
            background: linear-gradient(135deg, rgba(124,58,237,0.3), rgba(67,56,202,0.22));
            border-color: rgba(167,139,250,0.24);
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(76, 29, 149, 0.18);
          }

          .yam-nav-icon {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            display: grid;
            place-items: center;
            background: rgba(255,255,255,0.04);
            flex-shrink: 0;
          }

          .yam-section-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 6px;
            color: #f8fafc;
            font-weight: 800;
          }

          .yam-icon-button {
            width: 34px;
            height: 34px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: white;
          }

          .yam-icon-button.subtle {
            width: 38px;
            height: 38px;
          }

          .yam-favorite-list {
            display: grid;
            gap: 10px;
            overflow: auto;
            min-height: 0;
          }

          .yam-favorite-row {
            padding: 10px 12px;
            border-radius: 18px;
            background: transparent;
            border: 1px solid transparent;
            display: flex;
            align-items: center;
            gap: 12px;
            color: white;
            text-align: right;
          }

          .yam-favorite-row.active {
            background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(124,58,237,0.1));
            border-color: rgba(167,139,250,0.2);
          }

          .yam-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }

          .yam-avatar-wrap.large {
            margin-inline: auto;
          }

          .yam-floating-status {
            position: absolute;
            right: -2px;
            bottom: -2px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 3px solid #090d1d;
            background: #64748b;
          }

          .yam-floating-status.large {
            width: 18px;
            height: 18px;
          }

          .yam-floating-status.online,
          .yam-status-dot.online {
            background: #22c55e;
            box-shadow: 0 0 0 4px rgba(34,197,94,0.18);
          }

          .yam-favorite-copy,
          .yam-user-copy {
            min-width: 0;
            display: grid;
            gap: 4px;
          }

          .yam-favorite-copy strong,
          .yam-user-copy strong,
          .yam-thread-header-line strong {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-favorite-copy span,
          .yam-user-copy span {
            color: #94a3b8;
            font-size: 13px;
          }

          .yam-user-footer {
            margin-top: auto;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 10px 0;
            border-top: 1px solid rgba(255,255,255,0.05);
          }

          .yam-user-avatar {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            background: linear-gradient(135deg, #4338ca, #8b5cf6);
            font-weight: 900;
          }

          .yam-center-stage {
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            padding: 20px 22px 18px;
            gap: 16px;
            overflow: hidden;
          }

          .yam-top-search-bar {
            min-height: 64px;
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(10, 15, 30, 0.92);
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 0 20px;
            color: #94a3b8;
            box-shadow: var(--shadow-inset-soft);
          }

          .yam-top-search-bar input {
            flex: 1;
            border: none;
            background: transparent;
            color: white;
            outline: none;
            font-size: 16px;
          }

          .yam-stage-card {
            flex: 1;
            min-height: 0;
            border-radius: 28px;
            border: 1px solid rgba(255,255,255,0.06);
            background: linear-gradient(180deg, rgba(7, 10, 24, 0.95), rgba(4, 7, 18, 0.98));
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .yam-stage-header-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 24px 24px 18px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }

          .yam-stage-header-row h1,
          .yam-profile-copy h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 900;
          }

          .yam-filter-select {
            min-height: 42px;
            border-radius: 14px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.02);
            color: #a78bfa;
            padding: 0 14px;
            outline: none;
          }

          .yam-thread-list {
            overflow: auto;
            min-height: 0;
            padding-bottom: 18px;
          }

          .yam-thread-row {
            width: 100%;
            padding: 18px 22px;
            border: none;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            background: transparent;
            color: white;
            display: grid;
            grid-template-columns: 72px minmax(0, 1fr) auto;
            align-items: center;
            gap: 14px;
            text-align: right;
            transition: background 0.18s ease;
          }

          .yam-thread-row:hover,
          .yam-thread-row.selected {
            background: rgba(255,255,255,0.03);
          }

          .yam-thread-avatar-slot {
            position: relative;
            width: 72px;
          }

          .yam-thread-content {
            min-width: 0;
            display: grid;
            gap: 8px;
          }

          .yam-thread-header-line,
          .yam-thread-preview-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .yam-thread-header-line span {
            color: #94a3b8;
            font-size: 13px;
            flex-shrink: 0;
          }

          .yam-thread-preview-line p {
            margin: 0;
            color: #cbd5e1;
            font-size: 14px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .yam-thread-badges,
          .yam-thread-actions {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
          }

          .yam-mini-chip,
          .yam-mini-action,
          .yam-unread-pill {
            min-width: 28px;
            height: 28px;
            padding: 0 8px;
            border-radius: 999px;
            display: inline-grid;
            place-items: center;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.04);
            color: white;
            font-size: 12px;
          }

          .yam-unread-pill {
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            border-color: transparent;
            font-weight: 900;
          }

          .yam-empty-block {
            padding: 48px 24px;
            display: grid;
            gap: 8px;
            text-align: center;
            color: #94a3b8;
          }

          .yam-profile-hero {
            display: grid;
            gap: 18px;
            justify-items: center;
          }

          .yam-profile-copy {
            text-align: center;
          }

          .yam-profile-copy p {
            margin: 6px 0 0;
            color: #94a3b8;
          }

          .yam-quick-actions {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
          }

          .yam-quick-card {
            min-height: 82px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            color: white;
            display: grid;
            place-items: center;
            gap: 6px;
          }

          .yam-quick-card small {
            color: #cbd5e1;
            font-size: 12px;
          }

          .yam-info-card {
            border-radius: 22px;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.03);
            padding: 18px;
            display: grid;
            gap: 14px;
          }

          .yam-info-card.compact {
            padding: 10px;
            gap: 8px;
          }

          .yam-info-title {
            font-size: 18px;
            font-weight: 900;
          }

          .yam-info-row {
            display: grid;
            gap: 6px;
          }

          .yam-info-row span {
            color: #94a3b8;
            font-size: 12px;
          }

          .yam-info-row strong {
            color: #a78bfa;
            font-size: 15px;
            word-break: break-word;
          }

          .yam-list-link {
            min-height: 48px;
            padding: 0 10px;
            border-radius: 16px;
            border: none;
            background: transparent;
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .yam-list-link > div {
            display: inline-flex;
            align-items: center;
            gap: 10px;
          }

          .yam-danger-btn,
          .yam-open-chat-btn {
            min-height: 52px;
            border-radius: 18px;
            border: 1px solid transparent;
            font-weight: 900;
          }

          .yam-danger-btn {
            background: rgba(239,68,68,0.1);
            color: #f87171;
            border-color: rgba(239,68,68,0.2);
          }

          .yam-open-chat-btn {
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: white;
            box-shadow: 0 18px 28px rgba(91, 33, 182, 0.28);
          }

          .yam-status-copy {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #94a3b8;
            font-size: 13px;
          }

          .yam-status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #64748b;
            flex-shrink: 0;
          }

          @media (max-width: 1200px) {
            .yam-chat-shell {
              grid-template-columns: 280px minmax(0, 1fr);
            }

            .yam-profile-panel {
              display: none;
            }
          }

          @media (max-width: 820px) {
            .yam-chat-shell {
              grid-template-columns: 1fr;
            }

            .yam-left-rail {
              display: none;
            }

            .yam-center-stage {
              padding: 14px;
            }

            .yam-thread-row {
              grid-template-columns: 64px minmax(0, 1fr);
            }

            .yam-thread-actions {
              display: none;
            }
          }
        `}</style>
      </section>
    </MainLayout>
  );
}
