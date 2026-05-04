import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, hasPermission } from '../utils/auth.js';
import { isPrimaryAdminSession } from '../utils/access.js';

export default function ProtectedRoute({ children, requiredPermission = '' }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user?.token && !user?.access_token) {
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
