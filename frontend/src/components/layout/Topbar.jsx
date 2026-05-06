import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getNotifications } from '../../api/notifications.js';
import socket from '../../api/socket.js';
import { getAuthToken, getCurrentUsername } from '../../utils/auth.js';
import { normalizeNotification } from '../../utils/notificationCenter.js';

const routeMeta = {
  '/': { title: 'الرئيسية', note: 'الهوم للمنشورات والقصص مع أزرار أوضح أعلى وأسفل الشاشة.' },
  '/dashboard': { title: 'القائمة والإعدادات', note: 'اختبارات جاهزية، إعدادات سريعة، وروابط الخدمات.' },
  '/users': { title: 'المستخدمون', note: 'ابحث عن مستخدمين وابدأ متابعة أو تواصل مباشر.' },
  '/profile': { title: 'الملف الشخصي', note: 'إحصائياتك ومنشوراتك وتخصيص الحساب.' },
  '/inbox': { title: 'الدردشة', note: 'قائمة محادثات أوضح بنفس طابع الجوال.' },
  '/stories': { title: 'الستوري', note: 'شاشة مستقلة للقصص ورفع ستوري جديد.' },
  '/reels': { title: 'الريلز', note: 'مشاهدة عمودية وفصل كامل عن صفحة المنشورات.' },
  '/groups': { title: 'المجموعات', note: 'المجتمعات والنقاشات في شاشة مستقلة.' },
  '/live': { title: 'البث المباشر', note: 'البث والتفاعل المباشر مع عدادات واضحة.' },
  '/notifications': { title: 'الإشعارات', note: 'تجميع الإشعارات حسب النوع والزمن.' },
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
      note: 'منصة اجتماعية عربية بستايل داكن موحّد بين الويب والجوال.',
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
    <header className="topbar yamshat-topbar compact-topbar topbar-app-like">
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

      <div className="topbar-route-actions topbar-actions-rich">
        <Link to="/notifications" className="topbar-icon-link topbar-badge-link">
          <span aria-hidden="true">🔔</span>
          <span>الإشعارات</span>
          {unreadCount > 0 ? <strong className="topbar-badge">{unreadCount}</strong> : null}
        </Link>

        <Link to="/reels" className="topbar-icon-link">
          <span aria-hidden="true">🎬</span>
          <span>الريلز</span>
        </Link>

        <Link to="/live" className="topbar-icon-link topbar-primary-action">
          <span aria-hidden="true">🔴</span>
          <span>مباشر</span>
        </Link>

        <Link to="/inbox" className="topbar-icon-link">
          <span aria-hidden="true">💬</span>
          <span>الدردشة</span>
        </Link>

        <Link to="/dashboard" className="topbar-icon-link">
          <span aria-hidden="true">☰</span>
          <span>القائمة</span>
        </Link>
      </div>
    </header>
  );
}
