import { Suspense, lazy, useEffect } from 'react';
import StaticContentPage from './pages/StaticContentPage.jsx';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import GlobalPageBackButton from './components/ui/GlobalPageBackButton.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/admin/ToastProvider.jsx';
import AppStatusBanner from './components/system/AppStatusBanner.jsx';
import AppErrorBoundary from './components/system/AppErrorBoundary.jsx';
import InstallPrompt from './components/feedback/InstallPrompt.jsx';
import OfflineExperience from './components/feedback/OfflineExperience.jsx';
import AppUpdatePrompt from './components/feedback/AppUpdatePrompt.jsx';
import IncomingCallOverlay from './components/chat/IncomingCallOverlay.jsx';
import NewChatDialog from './components/chat/NewChatDialog.jsx';
import GlobalNotificationListener from './components/notifications/GlobalNotificationListener.jsx';
import { RoutePageSkeleton } from './components/feedback/Skeleton.jsx';
import useNetworkStatus from './hooks/useNetworkStatus.js';
import useOfflineQueue from './hooks/useOfflineQueue.js';
import useSessionGuard from './hooks/useSessionGuard.js';
import usePageAnalytics from './hooks/usePageAnalytics.js';
import useChatRealtime from './hooks/useChatRealtime.js';
import useTactileFeedback from './hooks/useTactileFeedback.js';
import { useAppStore } from './store/appStore.js';
import './styles/theme.css';

const AdminDashboard = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminDashboard })));
const AdminUsers = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminUsers })));
const AdminPosts = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminPosts })));
const AdminNotifications = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminNotifications })));
const AdminReports = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminReports })));
const AdminAudit = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminAudit })));
const AdminSettings = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminSettings })));
const AdminRbac = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminRbac })));
const AdminChat = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminChat })));
const AdminStories = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminStories })));
const AdminReels = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminReels })));
const AdminGroups = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminGroups })));
const AdminLive = lazy(() => import('./features/admin/index.js').then((mod) => ({ default: mod.AdminLive })));
const Login = lazy(() => import('./pages/Login.jsx'));
const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Feed = lazy(() => import('./pages/FeedEnhanced.jsx'));
const Stories = lazy(() => import('./pages/Stories.jsx'));
const Reels = lazy(() => import('./pages/Reels.jsx'));
// v50 — صفحة الرفع/الإنشاء الموحّدة (ReelComposer) المعتمدة لكل سياقات الإنشاء
const ReelComposer = lazy(() => import('./pages/ReelComposer.jsx'));
// v59.13.27 — موجّه ذكي لـ/compose: tab=post → PostComposerPage، غيره → ReelComposer
const ComposerRouter = lazy(() => import('./pages/ComposerRouter.jsx'));
const Groups = lazy(() => import('./pages/GroupsHome.jsx'));
const CreateGroup = lazy(() => import('./pages/CreateGroup.jsx'));
const GroupChatPageInner = lazy(() => import('./pages/GroupChat.jsx'));
// 🔑 لفافة تربط key={groupId} حتى يُعاد mount المكوّن بالكامل عند
// الانتقال بين المجموعات (الحل الجوهري لتسرّب الرسائل بين المجموعات).
function GroupChatPage() {
  const { groupId } = useParams();
  return <GroupChatPageInner key={`group-chat-${groupId}`} />;
}
const Inbox = lazy(() => import('./features/chat/index.js').then((mod) => ({ default: mod.Inbox })));
const Users = lazy(() => import('./pages/Users.jsx'));
const Friends = lazy(() => import('./pages/Friends.jsx'));
const FriendsAll = lazy(() => import('./pages/FriendsAll.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Chat = lazy(() => import('./features/chat/index.js').then((mod) => ({ default: mod.Chat })));
const Notifications = lazy(() => import('./features/notifications/index.js').then((mod) => ({ default: mod.Notifications })));
const Search = lazy(() => import('./pages/Search.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const ChatSettings = lazy(() => import('./pages/ChatSettings.jsx'));
const GroupSettings = lazy(() => import('./pages/GroupSettings.jsx'));
// v59.3 — شاشات المجموعات العشرة الجديدة (منشورات، أحداث، استطلاعات، إشارات، وسائط، سجل، معالج، اكتشاف، إشعارات)
const GroupPostsFeed = lazy(() => import('./pages/groups/GroupPostsFeed.jsx'));
const GroupEvents = lazy(() => import('./pages/groups/GroupEvents.jsx'));
const GroupPolls = lazy(() => import('./pages/groups/GroupPolls.jsx'));
const GroupMentions = lazy(() => import('./pages/groups/GroupMentions.jsx'));
const GroupMediaGallery = lazy(() => import('./pages/groups/GroupMediaGallery.jsx'));
const GroupAuditLog = lazy(() => import('./pages/groups/GroupAuditLog.jsx'));
const GroupCreateWizard = lazy(() => import('./pages/groups/GroupCreateWizard.jsx'));
const GroupDiscover = lazy(() => import('./pages/groups/GroupDiscover.jsx'));
const GroupNotificationSettings = lazy(() => import('./pages/groups/GroupNotificationSettings.jsx'));
const ShareTargetLanding = lazy(() => import('./pages/ShareTargetLanding.jsx'));
// 🎮 ميزات التفاعل والتلعيب + الغرف الصوتية
const EngagementHub = lazy(() => import('./pages/EngagementHub.jsx'));
const VoiceRoomsPage = lazy(() => import('./pages/VoiceRoomsPage.jsx'));
// ⚙️ صفحات الإعدادات الفرعية الجديدة
const ProfileSettingsPage = lazy(() => import('./pages/settings/ProfileSettingsPage.jsx'));
const ReelsSettingsPage = lazy(() => import('./pages/settings/ReelsSettingsPage.jsx'));
const StoriesSettingsPage = lazy(() => import('./pages/settings/StoriesSettingsPage.jsx'));
const CloseFriendsManagerPage = lazy(() => import('./pages/settings/CloseFriendsManagerPage.jsx'));
const HideStoryFromPage = lazy(() => import('./pages/settings/HideStoryFromPage.jsx'));
const MutedStoriesPage = lazy(() => import('./pages/settings/MutedStoriesPage.jsx'));
const FeedSettingsPage = lazy(() => import('./pages/settings/FeedSettingsPage.jsx'));
const NotificationsSettingsPage = lazy(() => import('./pages/settings/NotificationsSettingsPage.jsx'));
const WalletSettingsPage = lazy(() => import('./pages/settings/WalletSettingsPage.jsx'));
const VoiceRoomsSettingsPage = lazy(() => import('./pages/settings/VoiceRoomsSettingsPage.jsx'));
const EngagementSettingsPage = lazy(() => import('./pages/settings/EngagementSettingsPage.jsx'));
const InboxSettingsPage = lazy(() => import('./pages/settings/InboxSettingsPage.jsx'));

function AppGuards() {
  useNetworkStatus();
  useSessionGuard();
  useOfflineQueue();
  usePageAnalytics();
  useChatRealtime();
  useTactileFeedback();
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
      // منع التأثيرات عند استخدام الماوس على اللابتوب لتجنب الاهتزاز
      if (event.pointerType === 'mouse') return;
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
      // منع التأثيرات عند استخدام الماوس على اللابتوب
      if (event.pointerType === 'mouse') return;
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
      <AppUpdatePrompt />
      <GlobalNotificationListener />
      <IncomingCallOverlay />
      <NewChatDialog />
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
        <GlobalPageBackButton />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<StaticContentPage title="شروط الاستخدام" subtitle="هذه الصفحة تضيف مساراً فعلياً لروابط الشروط داخل الواجهة حتى لا ينكسر التنقل أثناء النشر أو التسجيل." sections={[{ heading: 'الاستخدام المقبول', items: ['يُمنع نشر المحتوى المخالف أو المسيء أو المنتحل للهوية.', 'يجب احترام خصوصية المستخدمين وعدم مشاركة بياناتهم دون إذن.', 'يمكن تعليق الحسابات التي تكرر إساءة الاستخدام أو السبام.'] }, { heading: 'المحتوى والوسائط', items: ['أنت مسؤول عن الصور والفيديوهات والريلز والستوري التي ترفعها.', 'يجب أن تملك حق استخدام المحتوى قبل نشره.', 'قد تتم إزالة المحتويات التي تخالف السياسات أو القوانين المحلية.'] }]} ctaLabel="العودة للتسجيل" ctaTo="/register" />} />
            <Route path="/privacy" element={<StaticContentPage title="سياسة الخصوصية" subtitle="تمت إضافة هذه الصفحة لربط زر سياسة الخصوصية داخل الواجهة بشكل صحيح وتحسين الجاهزية قبل النشر." sections={[{ heading: 'البيانات التي قد تُستخدم', items: ['بيانات الحساب الأساسية مثل الاسم واسم المستخدم والبريد الإلكتروني.', 'بيانات التفاعل مثل الإعجابات والتعليقات والمشاركات والمشاهدات.', 'بيانات تقنية لتحسين الأمان والأداء مثل نوع الجهاز وسجلات الجلسة.'] }, { heading: 'كيفية الاستخدام', items: ['تحسين تجربة العرض والتوصيات والتنبيهات.', 'تأمين الحسابات ومنع إساءة الاستخدام.', 'تشغيل مزايا التواصل مثل الرسائل والبث والتعليقات.'] }]} ctaLabel="العودة للتسجيل" ctaTo="/register" />} />
            <Route path="/support" element={<StaticContentPage title="الدعم الفني" subtitle="تم تفعيل مسار الدعم الفني داخل الفرونت إند حتى لا تظهر صفحة فارغة عند الضغط على الرابط." sections={[{ heading: 'طرق المساعدة', items: ['راجع صفحة الإعدادات لتحديث بيانات الحساب والأمان.', 'تأكد من إعداد عنوان الـ API الصحيح في بيئة النشر.', 'إذا تعطل الرفع فتأكد من أذونات الكاميرا والمايك والاتصال بالخادم.'] }, { heading: 'مشكلات شائعة', items: ['تعذر رفع ملف: افحص حجم الملف وصيغة الوسائط.', 'تعذر تسجيل الدخول: افحص الجلسة وملفات الكوكيز وCSRF.'] }]} ctaLabel="العودة لتسجيل الدخول" ctaTo="/login" />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<Navigate to="/register" replace />} />

            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><Stories /></ProtectedRoute>} />
            <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
            {/* v50 — صفحة الإنشاء الموحّدة (تستبدل MobileComposeModal القديمة)
                v59.13.27 — الآن عبر ComposerRouter لدعم tab=post → PostComposerPage */}
            <Route path="/compose" element={<ProtectedRoute><ComposerRouter /></ProtectedRoute>} />
            <Route path="/reels/compose" element={<ProtectedRoute><ReelComposer /></ProtectedRoute>} />
            <Route path="/reels/new" element={<ProtectedRoute><ReelComposer /></ProtectedRoute>} />
            <Route path="/post/compose" element={<ProtectedRoute><ComposerRouter /></ProtectedRoute>} />
            <Route path="/post/new" element={<ProtectedRoute><ComposerRouter /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/groups/create" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
            <Route path="/groups/:groupId/chat" element={<ProtectedRoute><GroupChatPage /></ProtectedRoute>} />
            <Route path="/groups/:groupId/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
            {/* v59.3 — الشاشات العشرة الجديدة للمجموعات */}
            <Route path="/groups/discover" element={<ProtectedRoute><GroupDiscover /></ProtectedRoute>} />
            <Route path="/groups/wizard" element={<ProtectedRoute><GroupCreateWizard /></ProtectedRoute>} />
            <Route path="/groups/:groupId/posts" element={<ProtectedRoute><GroupPostsFeed /></ProtectedRoute>} />
            <Route path="/groups/:groupId/events" element={<ProtectedRoute><GroupEvents /></ProtectedRoute>} />
            <Route path="/groups/:groupId/polls" element={<ProtectedRoute><GroupPolls /></ProtectedRoute>} />
            <Route path="/groups/:groupId/mentions" element={<ProtectedRoute><GroupMentions /></ProtectedRoute>} />
            <Route path="/groups/:groupId/media" element={<ProtectedRoute><GroupMediaGallery /></ProtectedRoute>} />
            <Route path="/groups/:groupId/audit" element={<ProtectedRoute><GroupAuditLog /></ProtectedRoute>} />
            <Route path="/groups/:groupId/notifications" element={<ProtectedRoute><GroupNotificationSettings /></ProtectedRoute>} />
            <Route path="/messages" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
            <Route path="/friends/all" element={<ProtectedRoute><FriendsAll /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/reels" element={<ProtectedRoute><ReelsSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/stories" element={<ProtectedRoute><StoriesSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/stories/close-friends" element={<ProtectedRoute><CloseFriendsManagerPage /></ProtectedRoute>} />
            <Route path="/settings/stories/hide-from" element={<ProtectedRoute><HideStoryFromPage /></ProtectedRoute>} />
            <Route path="/settings/stories/muted" element={<ProtectedRoute><MutedStoriesPage /></ProtectedRoute>} />
            <Route path="/settings/feed" element={<ProtectedRoute><FeedSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/wallet" element={<ProtectedRoute><WalletSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/voice" element={<ProtectedRoute><VoiceRoomsSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/engagement" element={<ProtectedRoute><EngagementSettingsPage /></ProtectedRoute>} />
            <Route path="/settings/inbox" element={<ProtectedRoute><InboxSettingsPage /></ProtectedRoute>} />
            <Route path="/groups/settings" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
            <Route path="/groups/settings/:groupId" element={<ProtectedRoute><GroupSettings /></ProtectedRoute>} />
            <Route path="/share-target" element={<ShareTargetLanding />} />
            {/* 🎮 مركز التفاعل والتلعيب */}
            <Route path="/engagement" element={<ProtectedRoute><EngagementHub /></ProtectedRoute>} />
            <Route path="/engagement/:tab" element={<ProtectedRoute><EngagementHub /></ProtectedRoute>} />
            {/* 🔊 الغرف الصوتية الجماعية */}
            <Route path="/voice" element={<ProtectedRoute><VoiceRoomsPage /></ProtectedRoute>} />
            <Route path="/voice/:roomId" element={<ProtectedRoute><VoiceRoomsPage /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:userId/settings" element={<ProtectedRoute><ChatSettings /></ProtectedRoute>} />

            <Route path="/admin/dashboard" element={<ProtectedRoute requiredPermission="dashboard.view"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredPermission="users.view"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/rbac" element={<ProtectedRoute requiredPermission="rbac.view"><AdminRbac /></ProtectedRoute>} />
            <Route path="/admin/posts" element={<ProtectedRoute requiredPermission="posts.view"><AdminPosts /></ProtectedRoute>} />
            <Route path="/admin/content" element={<Navigate to="/admin/posts" replace />} />
            <Route path="/admin/notifications" element={<ProtectedRoute requiredPermission="notifications.manage"><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requiredPermission="reports.view"><AdminReports /></ProtectedRoute>} />
            <Route path="/admin/audit" element={<ProtectedRoute requiredPermission="dashboard.view"><AdminAudit /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredPermission="settings.manage"><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/chat" element={<ProtectedRoute><AdminChat /></ProtectedRoute>} />
            <Route path="/admin/stories" element={<ProtectedRoute><AdminStories /></ProtectedRoute>} />
            <Route path="/admin/reels" element={<ProtectedRoute><AdminReels /></ProtectedRoute>} />
            <Route path="/admin/groups" element={<ProtectedRoute><AdminGroups /></ProtectedRoute>} />
            <Route path="/admin/live" element={<ProtectedRoute><AdminLive /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </ToastProvider>
  );
}
