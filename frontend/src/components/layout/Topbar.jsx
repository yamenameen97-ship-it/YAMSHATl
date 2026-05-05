import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNotifications } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../../utils/auth.js';
import { normalizeNotification } from '../../utils/notificationCenter.js';

const routeMeta = {
  '/': {
    title: 'الرئيسية',
    note: 'منشورات وقصص بترتيب واضح من غير تراكب للشاشات.',
  },
  '/dashboard': {
    title: 'القائمة',
    note: 'مركز سريع للحساب، الإعدادات، والأقسام الثانوية.',
  },
  '/users': {
    title: 'الأصدقاء',
    note: 'ابحث عن الأصدقاء وابدأ محادثة مباشرة.',
  },
  '/profile': {
    title: 'الملف الشخصي',
    note: 'إحصائياتك ومنشوراتك وتعديلات الحساب.',
  },
  '/inbox': {
    title: 'الدردشة',
    note: 'قائمة المحادثات في شاشة مستقلة وواضحة.',
  },
  '/stories': {
    title: 'الستوري',
    note: 'عرض القصص ورفع قصة جديدة من صفحة مخصصة.',
  },
  '/reels': {
    title: 'الريلز',
    note: 'فيديوهات قصيرة بصفحة منفصلة مثل التصميم المرجعي.',
  },
  '/groups': {
    title: 'المجموعات',
    note: 'إنشاء ومتابعة المجموعات بعيدًا عن الصفحة الرئيسية.',
  },
  '/live': {
    title: 'البث المباشر',
    note: 'صفحة مستقلة للبث والتفاعل اللحظي.',
  },
  '/notifications': {
    title: 'الإشعارات',
    note: 'كل التنبيهات في مركز واحد بدون تكدس في الهوم.',
  },
};

export default function Topbar() {
  const location = useLocation();
  const token = getAuthToken();
  const currentUsername = getCurrentUsername();
  const [notifications, setNotifications] = useState([]);

  const pageMeta = useMemo(() => {
    if (location.pathname.startsWith('/chat/')) {
      return {
        title: 'المحادثة',
        note: 'شاشة دردشة خاصة مستقلة عن قائمة المحادثات.',
      };
    }

    if (location.pathname.startsWith('/profile/')) {
      return {
        title: 'ملف المستخدم',
        note: 'استعراض ملف المستخدم ومنشوراته في صفحة منفصلة.',
      };
    }

    return routeMeta[location.pathname] || {
      title: 'YAMSHAT',
      note: 'واجهة اجتماعية داكنة بتقسيم منطقي بين الشاشات.',
    };
  }, [location.pathname]);

  const unreadCount = notifications.filter((item) => !item?.seen).length;

  useEffect(() => {
    if (!currentUsername) return undefined;

    let active = true;

    const loadNotifications = async () => {
      try {
        const { data } = await getNotifications();
        if (!active) return;
        setNotifications((Array.isArray(data) ? data : []).map(normalizeNotification));
      } catch {
        if (active) setNotifications([]);
      }
    };

    loadNotifications();

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: currentUsername });

    const handleNotification = (incoming) => {
      if (!active) return;
      setNotifications((prev) => [normalizeNotification(incoming), ...prev]);
    };

    socket.on('new_notification', handleNotification);

    return () => {
      active = false;
      socket.off('new_notification', handleNotification);
    };
  }, [currentUsername, token]);

  return (
    <header className="topbar yamshat-topbar compact-topbar">
      <div className="topbar-title-block">
        <div className="page-eyebrow">YAMSHAT unified mobile layout</div>
        <h2 className="page-title">{pageMeta.title}</h2>
        <p className="muted no-margin topbar-page-note">{pageMeta.note}</p>
      </div>

      <div className="topbar-route-actions">
        {location.pathname !== '/live' ? (
          <Link to="/live" className="topbar-icon-link topbar-primary-action">
            <span aria-hidden="true">🔴</span>
            <span>البث</span>
          </Link>
        ) : null}

        {location.pathname !== '/inbox' ? (
          <Link to="/inbox" className="topbar-icon-link">
            <span aria-hidden="true">💬</span>
            <span>الدردشة</span>
          </Link>
        ) : null}

        {location.pathname !== '/notifications' ? (
          <Link to="/notifications" className="topbar-icon-link topbar-badge-link">
            <span aria-hidden="true">🔔</span>
            <span>الإشعارات</span>
            {unreadCount > 0 ? <strong className="topbar-badge">{unreadCount}</strong> : null}
          </Link>
        ) : null}

        <Link to="/dashboard" className="topbar-icon-link">
          <span aria-hidden="true">☰</span>
          <span>القائمة</span>
        </Link>
      </div>
    </header>
  );
}
