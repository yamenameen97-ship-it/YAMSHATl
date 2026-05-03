import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser, hasPermission } from '../utils/auth.js';

export default function ProtectedRoute({ children, requiredPermission = '' }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user?.token && !user?.access_token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
