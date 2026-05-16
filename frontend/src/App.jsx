import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/admin/ToastProvider.jsx';
import AppStatusBanner from './components/system/AppStatusBanner.jsx';
import AppErrorBoundary from './components/system/AppErrorBoundary.jsx';
import InstallPrompt from './components/feedback/InstallPrompt.jsx';
import OfflineExperience from './components/feedback/OfflineExperience.jsx';
import { RoutePageSkeleton } from './components/feedback/Skeleton.jsx';
import useNetworkStatus from './hooks/useNetworkStatus.js';
import useOfflineQueue from './hooks/useOfflineQueue.js';
import useSessionGuard from './hooks/useSessionGuard.js';
import usePageAnalytics from './hooks/usePageAnalytics.js';
import useChatRealtime from './hooks/useChatRealtime.js';
import { useAppStore } from './store/appStore.js';
import './styles/theme.css';

const AdminDashboard = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminDashboard })));
const AdminUsers = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminUsers })));
const AdminPosts = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminPosts })));
const AdminNotifications = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminNotifications })));
const AdminLive = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminLive })));
const AdminReports = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminReports })));
const AdminAudit = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminAudit })));
const AdminSettings = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminSettings })));
const AdminRbac = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminRbac })));
const AdminChat = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminChat })));
const AdminStories = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminStories })));
const AdminReels = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminReels })));
const AdminGroups = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminGroups })));
const Login = lazy(() => import('./pages/Login.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const LiveStreamDashboard = lazy(() => import('./pages/LiveStreamDashboard.jsx'));
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
const Search = lazy(() => import('./pages/Search.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

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

  useEffect(() => {
    const timers = new WeakMap();
    const clickableSelector = 'button, a.btn, .mini-action, .ghost-btn, .reaction-btn, .table-link, .story-user-card';

    const handlePointerFeedback = (event) => {
      const target = event.target instanceof Element ? event.target.closest(clickableSelector) : null;
      if (!target) return;
      const isDisabled = target.matches?.(':disabled') || target.getAttribute('aria-disabled') === 'true';
      if (isDisabled || target.getAttribute('aria-busy') === 'true' || target.dataset.busy === 'true') return;

      target.dataset.autoBusy = 'true';
      const activeTimer = timers.get(target);
      if (activeTimer) window.clearTimeout(activeTimer);
      const nextTimer = window.setTimeout(() => {
        delete target.dataset.autoBusy;
      }, 650);
      timers.set(target, nextTimer);
    };

    document.addEventListener('click', handlePointerFeedback, true);
    return () => {
      document.removeEventListener('click', handlePointerFeedback, true);
    };
  }, []);

  return (
    <>
      <AppStatusBanner />
      <InstallPrompt />
      <OfflineExperience />
      {activeRequests > 0 ? <div className="global-progress-bar" /> : null}
    </>
  );
}

function RouteFallback() {
  return <RoutePageSkeleton />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppErrorBoundary>
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

            <Route path="/" element={<Feed />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/livestream-dashboard" element={<ProtectedRoute><LiveStreamDashboard /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute requiredPermission="dashboard.view"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredPermission="users.view"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/rbac" element={<ProtectedRoute requiredPermission="rbac.view"><AdminRbac /></ProtectedRoute>} />
            <Route path="/admin/posts" element={<ProtectedRoute requiredPermission="posts.view"><AdminPosts /></ProtectedRoute>} />
            <Route path="/admin/content" element={<Navigate to="/admin/posts" replace />} />
            <Route path="/admin/notifications" element={<ProtectedRoute requiredPermission="notifications.manage"><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/live" element={<ProtectedRoute requiredPermission="live.manage"><AdminLive /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredPermission="reports.view"><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute requiredPermission="dashboard.view"><AdminAudit /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="settings.manage"><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/stories" element={<ProtectedRoute><AdminStories /></ProtectedRoute>} />
            <Route path="/admin/reels" element={<ProtectedRoute><AdminReels /></ProtectedRoute>} />
            <Route path="/admin/groups" element={<ProtectedRoute><AdminGroups /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </ToastProvider>
  );
}
