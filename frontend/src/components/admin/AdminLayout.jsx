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
  '/admin/dashboard': { title: 'Dashboard', breadcrumb: ['Admin', 'Dashboard'] },
  '/admin/users': { title: 'Users Management', breadcrumb: ['Admin', 'Users'] },
  '/admin/rbac': { title: 'RBAC & Permissions', breadcrumb: ['Admin', 'RBAC'] },
  '/admin/content': { title: 'Content Management', breadcrumb: ['Admin', 'Content'] },
  '/admin/notifications': { title: 'Notifications Center', breadcrumb: ['Admin', 'Notifications'] },
  '/admin/reports': { title: 'Reports', breadcrumb: ['Admin', 'Reports'] },
  '/admin/settings': { title: 'Settings', breadcrumb: ['Admin', 'Settings'] },
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
    getAdminNotifications(20)
      .then(({ data }) => {
        if (active) setNotifications(data?.items || []);
      })
      .catch(() => {
        if (active) setNotifications([]);
      });

    if (!socket.connected) socket.connect();
    socket.emit('register_user', { token, user: user?.username });

    const onAdminNotification = (payload) => {
      pushToast({ title: payload?.title || 'إشعار مباشر', description: payload?.body || 'تم وصول تحديث جديد.', type: 'info' });
      setNotifications((prev) => [{ id: `${Date.now()}`, ...payload, is_read: false }, ...prev]);
    };

    socket.on('admin:notification', onAdminNotification);
    return () => {
      active = false;
      socket.off('admin:notification', onAdminNotification);
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
