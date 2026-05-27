import { Suspense, lazy, useEffect } from 'react';
import StaticContentPage from './pages/StaticContentPage.jsx';
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
const Feed = lazy(() => import('./pages/FeedEnhanced.jsx'));
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
    const autoBusyTimers = new WeakMap();
    const holdTimers = new WeakMap();
    const clickableSelector = 'button, a.btn, .mini-action, .ghost-btn, .reaction-btn, .table-link, .story-user-card, .reel-action-btn, .yam-reaction-chip, .yam-bubble-toolbar button';

    const resolveTarget = (event) => (event.target instanceof Element ? event.target.closest(clickableSelector) : null);

    const clearHoldTimer = (target) => {
      const timer = holdTimers.get(target);
      if (timer) {
        window.clearTimeout(timer);
        holdTimers.delete(target);
      }
    };

    const releaseTarget = (target) => {
      if (!target) return;
      clearHoldTimer(target);
      target.classList.remove('is-pressing');
      target.classList.remove('is-holding');
    };

    const handlePointerDown = (event) => {
      const target = resolveTarget(event);
      if (!target) return;
      const isDisabled = target.matches?.(':disabled') || target.getAttribute('aria-disabled') === 'true';
      if (isDisabled || target.getAttribute('aria-busy') === 'true' || target.dataset.busy === 'true') return;
      target.classList.add('is-pressing');
      clearHoldTimer(target);
      holdTimers.set(target, window.setTimeout(() => {
        target.classList.add('is-holding');
      }, 170));
    };

    const handlePointerRelease = (event) => {
      releaseTarget(resolveTarget(event));
    };

    const handlePointerFeedback = (event) => {
      const target = resolveTarget(event);
      if (!target) return;
      const isDisabled = target.matches?.(':disabled') || target.getAttribute('aria-disabled') === 'true';
      if (isDisabled || target.getAttribute('aria-busy') === 'true' || target.dataset.busy === 'true') return;

      target.dataset.autoBusy = 'true';
      const activeTimer = autoBusyTimers.get(target);
      if (activeTimer) window.clearTimeout(activeTimer);
      const nextTimer = window.setTimeout(() => {
        delete target.dataset.autoBusy;
      }, 650);
      autoBusyTimers.set(target, nextTimer);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointerup', handlePointerRelease, true);
    document.addEventListener('pointercancel', handlePointerRelease, true);
    document.addEventListener('pointerleave', handlePointerRelease, true);
    document.addEventListener('click', handlePointerFeedback, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('pointerup', handlePointerRelease, true);
      document.removeEventListener('pointercancel', handlePointerRelease, true);
      document.removeEventListener('pointerleave', handlePointerRelease, true);
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
            <Route path="/terms" element={<StaticContentPage title="شروط الاستخدام" subtitle="هذه الصفحة تضيف مساراً فعلياً لروابط الشروط داخل الواجهة حتى لا ينكسر التنقل أثناء النشر أو التسجيل." sections={[{ heading: 'الاستخدام المقبول', items: ['يُمنع نشر المحتوى المخالف أو المسيء أو المنتحل للهوية.', 'يجب احترام خصوصية المستخدمين وعدم مشاركة بياناتهم دون إذن.', 'يمكن تعليق الحسابات التي تكرر إساءة الاستخدام أو السبام.'] }, { heading: 'المحتوى والوسائط', items: ['أنت مسؤول عن الصور والفيديوهات والريلز والستوري التي ترفعها.', 'يجب أن تملك حق استخدام المحتوى قبل نشره.', 'قد تتم إزالة المحتويات التي تخالف السياسات أو القوانين المحلية.'] }]} ctaLabel="العودة للتسجيل" ctaTo="/register" />} />
            <Route path="/privacy" element={<StaticContentPage title="سياسة الخصوصية" subtitle="تمت إضافة هذه الصفحة لربط زر سياسة الخصوصية داخل الواجهة بشكل صحيح وتحسين الجاهزية قبل النشر." sections={[{ heading: 'البيانات التي قد تُستخدم', items: ['بيانات الحساب الأساسية مثل الاسم واسم المستخدم والبريد الإلكتروني.', 'بيانات التفاعل مثل الإعجابات والتعليقات والمشاركات والمشاهدات.', 'بيانات تقنية لتحسين الأمان والأداء مثل نوع الجهاز وسجلات الجلسة.'] }, { heading: 'كيفية الاستخدام', items: ['تحسين تجربة العرض والتوصيات والتنبيهات.', 'تأمين الحسابات ومنع إساءة الاستخدام.', 'تشغيل مزايا التواصل مثل الرسائل والبث والتعليقات.'] }]} ctaLabel="العودة للتسجيل" ctaTo="/register" />} />
            <Route path="/support" element={<StaticContentPage title="الدعم الفني" subtitle="تم تفعيل مسار الدعم الفني داخل الفرونت إند حتى لا تظهر صفحة فارغة عند الضغط على الرابط." sections={[{ heading: 'طرق المساعدة', items: ['راجع صفحة الإعدادات لتحديث بيانات الحساب والأمان.', 'تأكد من إعداد عنوان الـ API الصحيح في بيئة النشر.', 'إذا تعطل الرفع أو البث فتأكد من أذونات الكاميرا والمايك والاتصال بالخادم.'] }, { heading: 'مشكلات شائعة', items: ['تعذر رفع ملف: افحص حجم الملف وصيغة الوسائط.', 'تعذر إنشاء بث: تأكد من توفر توكنات وخدمة LiveKit في الخادم.', 'تعذر تسجيل الدخول: افحص الجلسة وملفات الكوكيز وCSRF.'] }]} ctaLabel="العودة لتسجيل الدخول" ctaTo="/login" />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<Navigate to="/register" replace />} />

            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/livestream-dashboard" element={<ProtectedRoute><LiveStreamDashboard /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
            <Route path="/messages" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
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
