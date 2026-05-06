import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAdminNotifications } from '../../api/admin.js';
import socket from '../../api/socket.js';
import { getAuthToken, getStoredUser } from '../../utils/auth.js';
import Breadcrumbs from './Breadcrumbs.jsx';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';
import { useToast } from './ToastProvider.jsx';

const routeMeta = {
  '/admin/dashboard': { title: 'نظرة عامة لحظية', breadcrumb: ['الإدارة', 'النظرة العامة'] },
  '/admin/users': { title: 'إدارة المستخدمين', breadcrumb: ['الإدارة', 'المستخدمون'] },
  '/admin/rbac': { title: 'الأدوار والصلاحيات', breadcrumb: ['الإدارة', 'الصلاحيات'] },
  '/admin/content': { title: 'إدارة المحتوى', breadcrumb: ['الإدارة', 'المحتوى'] },
  '/admin/notifications': { title: 'مركز الإشعارات', breadcrumb: ['الإدارة', 'الإشعارات'] },
  '/admin/live': { title: 'مركز تحكم البث المباشر', breadcrumb: ['الإدارة', 'البث المباشر'] },
  '/admin/reports': { title: 'التقارير والتحليلات', breadcrumb: ['الإدارة', 'التقارير'] },
  '/admin/settings': { title: 'الإعدادات', breadcrumb: ['الإدارة', 'الإعدادات'] },
};

export default function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { pushToast } = useToast();
  const user = getStoredUser();
  const token = getAuthToken();

  const meta = routeMeta[location.pathname] || routeMeta['/admin/dashboard'];
  const breadcrumbs = useMemo(
    () => meta.breadcrumb.map((label, index) => ({ label, to: index === meta.breadcrumb.length - 1 ? '' : '/admin/dashboard' })),
    [meta]
  );

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
      socket.off('admin:notification', onAdminNotification);
      syncEvents.forEach((eventName) => socket.off(eventName, loadNotifications));
    };
  }, [pushToast, token, user?.username]);

  return (
    <div className="admin-app-shell">
      <AdminSidebar collapsed={collapsed} permissions={user?.permissions || []} role={user?.role || 'user'} />
      <div className="admin-main-shell">
        <AdminTopbar title={meta.title} onToggleSidebar={() => setCollapsed((prev) => !prev)} notifications={notifications} />
        <main className="admin-page-shell">
          <Breadcrumbs items={breadcrumbs} />
          {children}
        </main>
      </div>
    </div>
  );
}
