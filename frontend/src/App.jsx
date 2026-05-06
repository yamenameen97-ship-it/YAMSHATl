import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/admin/ToastProvider.jsx';
import AppStatusBanner from './components/system/AppStatusBanner.jsx';
import InstallPrompt from './components/feedback/InstallPrompt.jsx';
import PageLoader from './components/feedback/PageLoader.jsx';
import useNetworkStatus from './hooks/useNetworkStatus.js';
import useOfflineQueue from './hooks/useOfflineQueue.js';
import useSessionGuard from './hooks/useSessionGuard.js';
import usePageAnalytics from './hooks/usePageAnalytics.js';
import useChatRealtime from './hooks/useChatRealtime.js';
import { useAppStore } from './store/appStore.js';

const AdminDashboard = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminDashboard })));
const AdminUsers = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminUsers })));
const AdminPosts = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminPosts })));
const AdminNotifications = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminNotifications })));
const AdminLive = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminLive })));
const AdminReports = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminReports })));
const AdminSettings = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminSettings })));
const AdminRbac = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminRbac })));
const Login = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.Login })));
const AdminLogin = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.AdminLogin })));
const Register = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.Register })));
const VerifyEmail = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.VerifyEmail })));
const ForgotPassword = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.ForgotPassword })));
const ResetPassword = lazy(() => import('./features/auth/index.js').then((mod) => ({ default: mod.ResetPassword })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Feed = lazy(() => import('./pages/Feed.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const Reels = lazy(() => import('./pages/Reels.jsx'));
const Groups = lazy(() => import('./pages/Groups.jsx'));
const Live = lazy(() => import('./pages/Live.jsx'));
const Inbox = lazy(() => import('./features/chat/index.js').then((mod) => ({ default: mod.Inbox })));
const Users = lazy(() => import('./pages/Users.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Chat = lazy(() => import('./features/chat/index.js').then((mod) => ({ default: mod.Chat })));
const Notifications = lazy(() => import('./features/notifications/index.js').then((mod) => ({ default: mod.Notifications })));

function AppGuards() {
  useNetworkStatus();
  useSessionGuard();
  useOfflineQueue();
  usePageAnalytics();
  useChatRealtime();
  const theme = useAppStore((state) => state.theme);
  const language = useAppStore((state) => state.language);
  const activeRequests = useAppStore((state) => state.activeRequests);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  return (
    <>
      <AppStatusBanner />
      <InstallPrompt />
      {activeRequests > 0 ? <div className="global-progress-bar" /> : null}
    </>
  );
}

function RouteFallback() {
  return <PageLoader label="جارٍ تحميل الصفحة..." />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppGuards />
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="/admin/live" element={<ProtectedRoute requiredPermission="live.manage"><AdminLive /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requiredPermission="reports.view"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="settings.manage"><AdminSettings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ToastProvider>
  );
}
