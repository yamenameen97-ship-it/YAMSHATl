import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/admin/ToastProvider.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminPosts from './pages/admin/AdminPosts.jsx';
import AdminNotifications from './pages/admin/AdminNotifications.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminRbac from './pages/admin/AdminRbac.jsx';
import Login from './pages/Login.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import Register from './pages/Register.jsx';
import VerifyEmail from './pages/VerifyEmail.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Feed from './pages/Feed.jsx';
import Stories from './pages/Stories.jsx';
import Reels from './pages/Reels.jsx';
import Groups from './pages/Groups.jsx';
import Live from './pages/Live.jsx';
import Inbox from './pages/Inbox.jsx';
import Users from './pages/Users.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
import Notifications from './pages/Notifications.jsx';

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<Navigate to="/register" replace />} />

        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
        <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute requiredPermission="dashboard.view"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredPermission="users.view"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/rbac" element={<ProtectedRoute requiredPermission="rbac.view"><AdminRbac /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute requiredPermission="posts.view"><AdminPosts /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute requiredPermission="notifications.manage"><AdminNotifications /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredPermission="reports.view"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="settings.manage"><AdminSettings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
