import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNotifications } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../../utils/auth.js';
import { useAppStore } from '../../store/appStore.js';
import { getUiText } from '../../utils/i18n.js';
import { selectUnreadNotificationsCount, useNotificationStore } from '../../store/notificationStore.js';
import { maybeShowBrowserNotification } from '../../utils/notificationCenter.js';
import { selectUnreadTotal, useChatStore } from '../../store/chatStore.js';

export default function Topbar() {
  const location = useLocation();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const language = useAppStore((state) => state.language);
  const ui = getUiText(language);
  const unreadCount = useNotificationStore(selectUnreadNotificationsCount);
  const notificationsInitialized = useNotificationStore((state) => state.initialized);
  const hydrateNotifications = useNotificationStore((state) => state.hydrateNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const unreadInboxCount = useChatStore(selectUnreadTotal);

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/chat/')) {
      return language === 'en'
        ? { title: 'Conversation', note: 'Private chat with live status, translation, and call shortcuts.' }
        : { title: 'المحادثة', note: 'دردشة خاصة مع حالة اتصال وترجمة ومكالمات سريعة.' };
    }

    if (location.pathname.startsWith('/profile/')) {
      return language === 'en'
        ? { title: 'User profile', note: 'View account details and connected posts in a separate page.' }
        : { title: 'ملف المستخدم', note: 'استعراض الحساب ومنشوراته في صفحة مستقلة.' };
    }

    return ui.routeMeta[location.pathname] || ui.topbarFallback;
  }, [language, location.pathname, ui]);

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
      upsertNotification(incoming);
      maybeShowBrowserNotification(incoming).catch(() => null);
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername, hydrateNotifications, notificationsInitialized, token, upsertNotification]);

  return (
    <header className="topbar yamshat-topbar compact-topbar topbar-app-like topbar-professional-shell">
      <div className="topbar-brand-wrap">
        <Link to="/" className="topbar-brand-link">
          <span className="topbar-brand-mark">
            <img src="/brand/yamshat-logo.jpg" alt="Yamshat" className="brand-logo-img" />
          </span>
          <span className="topbar-brand-copy">
            <span className="page-eyebrow">YAMSHAT</span>
            <strong>{pageMeta.title}</strong>
          </span>
        </Link>
        <p className="muted no-margin topbar-page-note">{pageMeta.note}</p>
      </div>

      <div className="topbar-route-actions topbar-actions-rich topbar-actions-equal">
        <Link to="/notifications" className="topbar-icon-link topbar-badge-link">
          <span aria-hidden="true">🔔</span>
          <span>{ui.nav.notifications}</span>
          {unreadCount > 0 ? <strong className="topbar-badge">{unreadCount}</strong> : null}
        </Link>

        <Link to="/reels" className="topbar-icon-link">
          <span aria-hidden="true">🎬</span>
          <span>{ui.nav.reels}</span>
        </Link>

        <Link to="/live" className="topbar-icon-link topbar-primary-action">
          <span aria-hidden="true">🔴</span>
          <span>{ui.nav.live}</span>
        </Link>

        <Link to="/inbox" className="topbar-icon-link topbar-badge-link">
          <span aria-hidden="true">💬</span>
          <span>{ui.nav.inbox}</span>
          {unreadInboxCount > 0 ? <strong className="topbar-badge">{unreadInboxCount}</strong> : null}
        </Link>

        <Link to="/dashboard" className="topbar-icon-link">
          <span aria-hidden="true">☰</span>
          <span>{ui.nav.dashboard}</span>
        </Link>
      </div>
    </header>
  );
}
