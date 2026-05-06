import { Navigate, useLocation } from 'react-router-dom';
import PageLoader from './feedback/PageLoader.jsx';
import { hasPermission } from '../utils/auth.js';
import { isPrimaryAdminSession } from '../utils/access.js';
import { useAppStore } from '../store/appStore.js';

export default function ProtectedRoute({ children, requiredPermission = '' }) {
  const location = useLocation();
  const user = useAppStore((state) => state.session);
  const authHydrated = useAppStore((state) => state.authHydrated);
  const authLoading = useAppStore((state) => state.authLoading);

  if (!authHydrated || authLoading) {
    return <PageLoader label="جارٍ التحقق من الجلسة..." />;
  }

  if (!user?.username && !user?.user && !user?.email) {
    const loginPath = location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (location.pathname.startsWith('/admin') && !isPrimaryAdminSession(user)) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
