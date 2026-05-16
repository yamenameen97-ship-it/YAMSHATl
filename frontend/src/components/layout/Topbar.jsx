import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNotifications } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../../utils/auth.js';
import { useAppStore } from '../../store/appStore.js';
import { getUiText } from '../../utils/i18n.js';
import { selectUnreadNotificationsCount, useNotificationStore } from '../../store/notificationStore.js';
import { maybeShowBrowserNotification, normalizeNotification } from '../../utils/notificationCenter.js';
import { selectUnreadTotal, useChatStore } from '../../store/appStore.js';
import { getPrefetchHandlers } from '../../utils/navigation.js';

function emitToast(detail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('yamshat:toast', { detail }));
}

export default function Topbar() {
  const location = useLocation();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const language = useAppStore((state) => state.language);
  const isOnline = useAppStore((state) => state.isOnline);
  const ui = getUiText(language);
  const unreadCount = useNotificationStore(selectUnreadNotificationsCount);
  const notificationsInitialized = useNotificationStore((state) => state.initialized);
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const notificationItems = useNotificationStore((state) => state.items);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/chat/')) {
      return language === 'en'
        ? { title: 'Conversation', note: 'Private chat with live status, calls, encrypted media, and smoother navigation.' }
        : { title: 'المحادثة', note: 'دردشة خاصة بحالة فورية ومكالمات ووسائط وتنقل أنعم.' };
    }

    if (location.pathname.startsWith('/profile/')) {
      return language === 'en'
        ? { title: 'User profile', note: 'View account details and connected posts in a separate page.' }
        : { title: 'ملف المستخدم', note: 'استعراض الحساب ومنشوراته في صفحة مستقلة.' };
    }

    return ui.routeMeta[location.pathname] || ui.topbarFallback;
  }, [language, location.pathname, ui]);

  const liveNotificationSummary = useMemo(() => {
    const items = notificationItems.map(normalizeNotification);
    const mentions = items.filter((item) => item.type === 'mention' || item.category === 'mention').length;
    const liveItems = items.filter((item) => item.type === 'live' || item.category === 'live').length;
    return { mentions, liveItems };
  }, [notificationItems]);

  useEffect(() => {
    if (!currentUsername) return undefined;

    let active = true;

    const loadNotifications = async () => {
      if (notificationsInitialized) return;
      try {
        const { data } = await getNotifications();
        if (!active) return;
        hydrateNotifications(Array.isArray(data) ? data : [], { replace: true });
      } catch {
        if (active) hydrateNotifications([], { replace: true });
      }
    };

    loadNotifications();

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUsername });

    const handleNotification = (incoming) => {
      if (!active) return;
      const normalized = normalizeNotification(incoming);
      upsertNotification(normalized);
      if (document.visibilityState === 'visible') {
        emitToast({
          type: normalized.type === 'mention' ? 'success' : 'info',
          title: normalized.title,
          description: normalized.body,
          duration: 4600,
          actionLabel: 'فتح',
          onAction: () => { window.location.hash = `#${normalized.path}`; },
        });
      }
      maybeShowBrowserNotification(normalized).catch(() => null);
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername, hydrateNotifications, notificationsInitialized, token, upsertNotification]);

  const badges = [
    { label: isOnline ? 'Live' : 'Offline', tone: isOnline ? '#22c55e' : '#f97316' },
    { label: `${unreadCount} إشعار`, tone: unreadCount > 0 ? '#8b5cf6' : '#64748b' },
    { label: `${unreadInboxCount} رسائل`, tone: unreadInboxCount > 0 ? '#06b6d4' : '#64748b' },
    liveNotificationSummary.mentions > 0 ? { label: `${liveNotificationSummary.mentions} منشن`, tone: '#f59e0b' } : null,
  ].filter(Boolean);

  const quickLinks = [
    { to: '/notifications', label: ui.nav.notifications, icon: '🔔', badge: unreadCount, live: liveNotificationSummary.liveItems > 0 ? 'حي' : '' },
    { to: '/reels', label: ui.nav.reels, icon: '🎬' },
    { to: '/stories', label: ui.nav.stories, icon: '📖', live: liveNotificationSummary.mentions > 0 ? '@' : '' },
    { to: '/groups', label: ui.nav.groups, icon: '👥' },
    { to: '/inbox', label: ui.nav.inbox, icon: '💬', badge: unreadInboxCount },
    { to: '/dashboard', label: ui.nav.dashboard, icon: '☰' },
  ];

  return (
    <header className="topbar yamshat-topbar compact-topbar topbar-app-like topbar-professional-shell topbar-reference-shell">
      <div className="topbar-brand-wrap topbar-brand-reference">
        <Link to="/" className="topbar-brand-link" {...getPrefetchHandlers('/')}>
          <span className="topbar-brand-mark">
            <img src="/brand/yamshat-logo.jpg" alt="Yamshat" className="brand-logo-img" />
          </span>
          <span className="topbar-brand-copy">
            <span className="page-eyebrow">YAMSHAT</span>
            <strong>{pageMeta.title}</strong>
          </span>
        </Link>
        <p className="muted no-margin topbar-page-note">{pageMeta.note}</p>
        <div className="topbar-live-strip">
          {badges.map((item) => (
            <span key={item.label} className="topbar-live-pill" style={{ '--pill-tone': item.tone }}>
              <span className="topbar-live-dot" />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="topbar-route-actions topbar-actions-rich topbar-actions-equal topbar-actions-responsive-scroll">
        {quickLinks.map((item) => (
          <Link key={item.to} to={item.to} className="topbar-icon-link topbar-badge-link" {...getPrefetchHandlers(item.to)}>
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
            {item.badge > 0 ? <strong className="topbar-badge">{item.badge}</strong> : null}
            {item.live ? <span className={`topbar-link-live ${item.live === '@' ? 'accent' : ''}`}>{item.live}</span> : null}
          </Link>
        ))}
      </div>

      <style>{`
        .topbar-reference-shell {
          border-radius: 0 0 26px 26px;
          margin: 0 10px;
        }

        .topbar-brand-reference {
          min-width: 0;
        }

        .topbar-live-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }

        .topbar-live-pill {
          --pill-tone: #22c55e;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          color: #e2e8f0;
          background: color-mix(in srgb, var(--pill-tone) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--pill-tone) 40%, transparent);
        }

        .topbar-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--pill-tone);
          box-shadow: 0 0 0 6px color-mix(in srgb, var(--pill-tone) 18%, transparent);
          animation: topbar-live-pulse 1.8s infinite;
        }

        .topbar-link-live {
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(34,197,94,0.16);
          color: #bbf7d0;
          font-size: 11px;
          font-weight: 800;
        }

        .topbar-link-live.accent {
          background: rgba(245,158,11,0.16);
          color: #fcd34d;
        }

        @media (max-width: 1080px) {
          .topbar-reference-shell {
            margin: 0;
            border-radius: 0;
          }

          .topbar-actions-responsive-scroll {
            display: flex;
            align-items: stretch;
            gap: 10px;
            overflow-x: auto;
            flex-wrap: nowrap;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .topbar-actions-responsive-scroll::-webkit-scrollbar {
            display: none;
          }

          .topbar-actions-responsive-scroll .topbar-icon-link {
            flex: 0 0 auto;
            min-width: 110px;
          }
        }

        @media (max-width: 720px) {
          .topbar-page-note {
            font-size: 13px;
            line-height: 1.7;
          }

          .topbar-live-strip {
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: none;
          }

          .topbar-live-strip::-webkit-scrollbar {
            display: none;
          }
        }

        @keyframes topbar-live-pulse {
          0% { transform: scale(0.95); opacity: 0.85; }
          70% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.85; }
        }
      `}</style>
    </header>
  );
}
