import { Navigate, useLocation } from 'react-router-dom';
import { getStoredUser } from '../utils/auth.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user?.token && !user?.access_token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
