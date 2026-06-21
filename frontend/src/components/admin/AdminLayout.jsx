import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getAdminNotifications, getAdminDashboardLive } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { getAuthToken, getStoredUser } from '../../utils/auth.js';
import '../../styles/admin-modern.css';
import Breadcrumbs from './Breadcrumbs.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';
import { useToast } from './ToastProvider.jsx';

const routeMeta = {
  '/admin/dashboard': { title: 'لوحة التحكم', subtitle: 'نظرة عامة على المنصة', breadcrumb: ['الإدارة', 'الرئيسية'] },
  '/admin/posts': { title: 'إدارة المنشورات', breadcrumb: ['الإدارة', 'المنشورات'] },
  '/admin/content': { title: 'إدارة المنشورات', breadcrumb: ['الإدارة', 'المنشورات'] },
  '/admin/chat': { title: 'إدارة الشات', subtitle: 'مراقبة المحادثات والإشراف الفوري', breadcrumb: ['الإدارة', 'الشات'] },
  '/admin/stories': { title: 'إدارة الستوري', breadcrumb: ['الإدارة', 'الستوري'] },
  '/admin/reels': { title: 'إدارة الريلز', breadcrumb: ['الإدارة', 'الريلز'] },
  '/admin/live': { title: 'إدارة البثوث', breadcrumb: ['الإدارة', 'البثوث'] },
  '/admin/groups': { title: 'إدارة المجموعات', breadcrumb: ['الإدارة', 'المجموعات'] },
  '/admin/users': { title: 'إدارة المستخدمين', breadcrumb: ['الإدارة', 'المستخدمون'] },
  '/admin/rbac': { title: 'الأدوار والصلاحيات', breadcrumb: ['الإدارة', 'الصلاحيات'] },
  '/admin/notifications': { title: 'الإشعارات', breadcrumb: ['الإدارة', 'الإشعارات'] },
  '/admin/reports': { title: 'مركز البلاغات والإشراف', breadcrumb: ['الإدارة', 'مركز البلاغات'] },
  '/admin/audit': { title: 'سجل نشاط الأدمن', breadcrumb: ['الإدارة', 'سجل الأدمن'] },
  '/admin/settings': { title: 'الإعدادات العامة', breadcrumb: ['الإدارة', 'الإعدادات'] },
};

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [serverStatus, setServerStatus] = useState({ state: 'checking', text: 'جاري الفحص...' });
  const { pushToast } = useToast();
  const user = getStoredUser();
  const token = getAuthToken();

  const meta = routeMeta[location.pathname] || routeMeta['/admin/dashboard'];
  const breadcrumbs = useMemo(
    () => meta.breadcrumb.map((label, index) => ({ label, to: index === meta.breadcrumb.length - 1 ? '' : '/admin/dashboard' })),
    [meta]
  );

  // ✅ v55: فحص حالة السيرفر بشكل خفيف بدون إظهار شريط أحمر على كامل الصفحة
  const checkServerStatus = useCallback(async () => {
    try {
      await getAdminDashboardLive();
      setServerStatus({ state: 'online', text: 'متصل' });
    } catch (err) {
      const code = err?.response?.status;
      if (!code) {
        setServerStatus({ state: 'offline', text: 'بلا اتصال' });
      } else if (code >= 500) {
        setServerStatus({ state: 'error', text: 'خطأ بالخادم' });
      } else {
        setServerStatus({ state: 'warning', text: 'اتصال ضعيف' });
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const { data } = await getAdminNotifications(20);
        if (active) setNotifications(data?.items || []);
      } catch {
        if (active) setNotifications([]);
      }
    };

    loadNotifications();
    checkServerStatus();
    const statusInterval = setInterval(() => {
      if (active) checkServerStatus();
    }, 30_000);

    // الاستماع لأحداث socket لتحديث حالة السيرفر فوراً
    const onConnect = () => active && setServerStatus({ state: 'online', text: 'متصل' });
    const onDisconnect = () => active && setServerStatus({ state: 'offline', text: 'بلا اتصال' });
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: user?.username });

    const onAdminNotification = (payload) => {
      pushToast({ title: payload?.title || 'إشعار مباشر', description: payload?.body || 'تم وصول تحديث جديد.', type: 'info' });
      setNotifications((prev) => [{ id: `${Date.now()}`, ...payload, is_read: false }, ...prev].slice(0, 20));
    };

    const syncEvents = ['admin:user_updated', 'admin:user_status_changed', 'admin:user_deleted', 'admin:post_created', 'admin:post_updated', 'admin:post_deleted', 'admin:posts_bulk_deleted', 'admin:live_updated'];
    socket.on('admin:notification', onAdminNotification);
    syncEvents.forEach((eventName) => socket.on(eventName, loadNotifications));

    return () => {
      active = false;
      clearInterval(statusInterval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('admin:notification', onAdminNotification);
      syncEvents.forEach((eventName) => socket.off(eventName, loadNotifications));
    };
  }, [pushToast, token, user?.username, checkServerStatus]);

  return (
    <div className="admin-app-shell admin-reference-shell admin-shell-modern">
      <AdminSidebar collapsed={collapsed} permissions={user?.permissions || []} role={user?.role || 'user'} />
      <div className="admin-main-shell admin-main-shell-modern">
        <AdminTopbar
          title={meta.title}
          subtitle={meta.subtitle}
          onToggleSidebar={() => setCollapsed((prev) => !prev)}
          notifications={notifications}
          serverStatus={serverStatus}
        />
        <main className="admin-page-shell admin-reference-page-shell admin-page-shell-modern">
          {children}
        </main>
      </div>
    </div>
  );
}
