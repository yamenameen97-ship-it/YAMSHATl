/**
 * Unified Router Configuration for Yamshat
 * 
 * This module provides a centralized routing system using React Router v6
 * with support for:
 * - Protected routes with authentication
 * - Lazy loading of components
 * - Error boundaries
 * - Offline support
 * - Route analytics
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../infrastructure/middleware/ProtectedRoute.jsx';
import RoutePageSkeleton from '../../presentation/components/feedback/RoutePageSkeleton.jsx';
import ErrorBoundary from '../../infrastructure/middleware/ErrorBoundary.jsx';

// ============================================
// Lazy Load Components
// ============================================

// Authentication Pages
const LoginPage = lazy(() => import('../../presentation/pages/auth/Login.jsx'));
const RegisterPage = lazy(() => import('../../presentation/pages/auth/Register.jsx'));
const VerifyEmailPage = lazy(() => import('../../presentation/pages/auth/VerifyEmail.jsx'));
const ForgotPasswordPage = lazy(() => import('../../presentation/pages/auth/ForgotPassword.jsx'));
const ResetPasswordPage = lazy(() => import('../../presentation/pages/auth/ResetPassword.jsx'));
const AdminLoginPage = lazy(() => import('../../presentation/pages/auth/AdminLogin.jsx'));

// Main Application Pages
const DashboardPage = lazy(() => import('../../presentation/pages/Dashboard.jsx'));
const FeedPage = lazy(() => import('../../presentation/pages/Feed.jsx'));
const StoriesPage = lazy(() => import('../../presentation/pages/Stories.jsx'));
const ReelsPage = lazy(() => import('../../presentation/pages/Reels.jsx'));
const GroupsPage = lazy(() => import('../../presentation/pages/Groups.jsx'));
const LivePage = lazy(() => import('../../presentation/pages/Live.jsx'));
const LiveStreamDashboardPage = lazy(() => import('../../presentation/pages/LiveStreamDashboard.jsx'));
const UsersPage = lazy(() => import('../../presentation/pages/Users.jsx'));
const ProfilePage = lazy(() => import('../../presentation/pages/Profile.jsx'));
const SearchPage = lazy(() => import('../../presentation/pages/Search.jsx'));
const SettingsPage = lazy(() => import('../../presentation/pages/Settings.jsx'));

// Chat Pages
const InboxPage = lazy(() => import('../../presentation/pages/chat/Inbox.jsx'));
const ChatPage = lazy(() => import('../../presentation/pages/chat/Chat.jsx'));

// Notifications
const NotificationsPage = lazy(() => import('../../presentation/pages/notifications/Notifications.jsx'));

// Admin Pages
const AdminDashboardPage = lazy(() => import('../../presentation/pages/admin/Dashboard.jsx'));
const AdminUsersPage = lazy(() => import('../../presentation/pages/admin/Users.jsx'));
const AdminPostsPage = lazy(() => import('../../presentation/pages/admin/Posts.jsx'));
const AdminNotificationsPage = lazy(() => import('../../presentation/pages/admin/Notifications.jsx'));
const AdminLivePage = lazy(() => import('../../presentation/pages/admin/Live.jsx'));
const AdminReportsPage = lazy(() => import('../../presentation/pages/admin/Reports.jsx'));
const AdminAuditPage = lazy(() => import('../../presentation/pages/admin/Audit.jsx'));
const AdminSettingsPage = lazy(() => import('../../presentation/pages/admin/Settings.jsx'));
const AdminRbacPage = lazy(() => import('../../presentation/pages/admin/Rbac.jsx'));
const AdminChatPage = lazy(() => import('../../presentation/pages/admin/Chat.jsx'));
const AdminStoriesPage = lazy(() => import('../../presentation/pages/admin/Stories.jsx'));
const AdminReelsPage = lazy(() => import('../../presentation/pages/admin/Reels.jsx'));
const AdminGroupsPage = lazy(() => import('../../presentation/pages/admin/Groups.jsx'));

// Error Pages
const NotFoundPage = lazy(() => import('../../presentation/pages/errors/NotFound.jsx'));
const ErrorPage = lazy(() => import('../../presentation/pages/errors/Error.jsx'));

// ============================================
// Route Definitions
// ============================================

/**
 * Public routes accessible without authentication
 */
export const PUBLIC_ROUTES = [
  { path: '/login', element: LoginPage, label: 'Login' },
  { path: '/register', element: RegisterPage, label: 'Register' },
  { path: '/verify-email', element: VerifyEmailPage, label: 'Verify Email' },
  { path: '/forgot-password', element: ForgotPasswordPage, label: 'Forgot Password' },
  { path: '/reset-password/:token', element: ResetPasswordPage, label: 'Reset Password' },
  { path: '/admin/login', element: AdminLoginPage, label: 'Admin Login' },
];

/**
 * Protected routes requiring authentication
 */
export const PROTECTED_ROUTES = [
  { path: '/', element: DashboardPage, label: 'Dashboard' },
  { path: '/feed', element: FeedPage, label: 'Feed' },
  { path: '/stories', element: StoriesPage, label: 'Stories' },
  { path: '/reels', element: ReelsPage, label: 'Reels' },
  { path: '/groups', element: GroupsPage, label: 'Groups' },
  { path: '/live', element: LivePage, label: 'Live' },
  { path: '/live-stream-dashboard', element: LiveStreamDashboardPage, label: 'Live Stream Dashboard' },
  { path: '/users', element: UsersPage, label: 'Users' },
  { path: '/profile/:userId', element: ProfilePage, label: 'Profile' },
  { path: '/search', element: SearchPage, label: 'Search' },
  { path: '/settings', element: SettingsPage, label: 'Settings' },
  { path: '/inbox', element: InboxPage, label: 'Inbox' },
  { path: '/chat/:conversationId', element: ChatPage, label: 'Chat' },
  { path: '/notifications', element: NotificationsPage, label: 'Notifications' },
];

/**
 * Admin routes requiring admin authentication and permissions
 */
export const ADMIN_ROUTES = [
  { path: '/admin', element: AdminDashboardPage, label: 'Admin Dashboard' },
  { path: '/admin/users', element: AdminUsersPage, label: 'Users Management' },
  { path: '/admin/posts', element: AdminPostsPage, label: 'Posts Management' },
  { path: '/admin/notifications', element: AdminNotificationsPage, label: 'Notifications Management' },
  { path: '/admin/live', element: AdminLivePage, label: 'Live Management' },
  { path: '/admin/reports', element: AdminReportsPage, label: 'Reports' },
  { path: '/admin/audit', element: AdminAuditPage, label: 'Audit Logs' },
  { path: '/admin/settings', element: AdminSettingsPage, label: 'Admin Settings' },
  { path: '/admin/rbac', element: AdminRbacPage, label: 'RBAC Management' },
  { path: '/admin/chat', element: AdminChatPage, label: 'Chat Management' },
  { path: '/admin/stories', element: AdminStoriesPage, label: 'Stories Management' },
  { path: '/admin/reels', element: AdminReelsPage, label: 'Reels Management' },
  { path: '/admin/groups', element: AdminGroupsPage, label: 'Groups Management' },
];

// ============================================
// Route Configuration Component
// ============================================

/**
 * Main router configuration component
 * Renders all routes with proper error boundaries and loading states
 */
export function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RoutePageSkeleton />}>
        <Routes>
          {/* Public Routes */}
          {PUBLIC_ROUTES.map(({ path, element: Element }) => (
            <Route key={path} path={path} element={<Element />} />
          ))}

          {/* Protected Routes */}
          {PROTECTED_ROUTES.map(({ path, element: Element }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Element />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Admin Routes */}
          {ADMIN_ROUTES.map(({ path, element: Element }) => (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute requireAdmin>
                  <Element />
                </ProtectedRoute>
              }
            />
          ))}

          {/* Error Routes */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

// ============================================
// Route Utilities
// ============================================

/**
 * Get all routes (public, protected, and admin)
 */
export function getAllRoutes() {
  return [...PUBLIC_ROUTES, ...PROTECTED_ROUTES, ...ADMIN_ROUTES];
}

/**
 * Find a route by path
 */
export function findRouteByPath(path) {
  return getAllRoutes().find(route => route.path === path);
}

/**
 * Get route label by path
 */
export function getRouteLabel(path) {
  const route = findRouteByPath(path);
  return route?.label || path;
}

/**
 * Check if a route is public
 */
export function isPublicRoute(path) {
  return PUBLIC_ROUTES.some(route => route.path === path);
}

/**
 * Check if a route is protected
 */
export function isProtectedRoute(path) {
  return PROTECTED_ROUTES.some(route => route.path === path);
}

/**
 * Check if a route is admin
 */
export function isAdminRoute(path) {
  return ADMIN_ROUTES.some(route => route.path === path);
}

/**
 * Get all route paths
 */
export function getAllRoutePaths() {
  return getAllRoutes().map(route => route.path);
}

/**
 * Generate breadcrumb from path
 */
export function generateBreadcrumb(path) {
  const segments = path.split('/').filter(Boolean);
  const breadcrumb = [];

  segments.forEach((segment, index) => {
    const currentPath = '/' + segments.slice(0, index + 1).join('/');
    const label = getRouteLabel(currentPath) || segment;
    breadcrumb.push({ path: currentPath, label });
  });

  return breadcrumb;
}

export default AppRouter;
