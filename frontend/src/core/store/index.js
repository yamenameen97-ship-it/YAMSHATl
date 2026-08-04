import { useAppStore } from '../../store/appStore.js';
import { selectUnreadTotal, useChatStore as useCanonicalChatStore } from '../../stores/chatStore.js';
import {
  useNotificationStore as useCanonicalNotificationStore,
  selectUnreadNotificationsCount,
  selectUnreadNotifications,
  selectNotificationsByType,
  selectRecentNotifications,
} from '../../store/notificationStore.js';

/**
 * Compatibility bridge (v89.33 — STATE MANAGEMENT SINGLE SOURCE OF TRUTH):
 * --------------------------------------------------------------------------
 * كانت لدينا مشكلة "التزامن اللحظي لإدارة الحالة (State Management)":
 * مكتبة إدارة الحالة المركزية في الواجهة الأمامية كانت تحوي **متجرين مختلفين**
 * لنفس البيانات (الإشعارات):
 *
 *   1) store/notificationStore.js  →  متجر Zustand حقيقي بحقل `items` + دوال
 *       upsertNotification / hydrateNotifications / markRead / removeNotification …
 *       تستخدمه صفحة الإشعارات + Topbar + MobileTopBar + GlobalListener +
 *       notificationService + main.jsx مباشرةً.
 *
 *   2) core/store/index.js         →  bridge قديم كان يُعيد تعريف
 *       useNotificationStore كشريحة من useAppStore! هذا المتجر لا يحوي
 *       `items` ولا أيًا من دوال الإشعارات → أي كود قديم يستورد من
 *       core/store كان يقرأ حالة "شبح" فارغة.
 *
 * النتيجة: تأخير/عدم تزامن لحظي بين فتح الإشعار وتحديث عدّاد الجرس في
 * القائمة العلوية (Navbar). مصدرا الحقيقة يعيشان بالتوازي ولا يتحدث أحدهما
 * الآخر → الاشتراك على متجر بينما التحديث يذهب إلى الآخر → لا re-render.
 *
 * الحل الجذري: توحيد المصدر — bridge أصبح مجرد **إعادة تصدير** للمتجر
 * الرسمي. لا يوجد متجر ثانٍ للإشعارات، ولا تعريف تسريبات (state fragments)
 * تعيد اختراع API الإشعار. جميع الاستيرادات القديمة (`core/store`) وجميع
 * الاستيرادات الحديثة (`store/notificationStore.js`) تشير الآن إلى نفس
 * مثيل Zustand → أي `set()` ينشر إشعاراته الفورية إلى كل subscriber في
 * التطبيق (Topbar, MobileTopBar, صفحة الإشعارات, Bridge السمعي…).
 */

export { useAppStore, selectUnreadTotal };

// ✅ إعادة تصدير الـ selectors الرسمية للإشعارات — لضمان أن أي مكوّن
//    يستوردها عبر core/store يحصل على نفس المرجع الذي تستخدمه الملفات
//    الحديثة (store/notificationStore.js).
export {
  selectUnreadNotificationsCount,
  selectUnreadNotifications,
  selectNotificationsByType,
  selectRecentNotifications,
};

export const useAuthStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    session: state.session,
    authHydrated: state.authHydrated,
    authLoading: state.authLoading,
    setSession: state.setSession,
    clearSession: state.clearSession,
    setAuthHydrated: state.setAuthHydrated,
    setAuthLoading: state.setAuthLoading,
  }));

export const useAppStateStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    theme: state.theme,
    language: state.language,
    isOnline: state.isOnline,
    isReconnecting: state.isReconnecting,
    lastOfflineAt: state.lastOfflineAt,
    activeRequests: state.activeRequests,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    setOnlineStatus: state.setOnlineStatus,
    startRequest: state.startRequest,
    finishRequest: state.finishRequest,
  }));

export const useChatStore = (selector = (state) => state) =>
  useCanonicalChatStore((state) => selector(state));

// ✅ v89.33 ROOT FIX (State Management single source of truth):
//    كان هذا الـ hook يعيد لفّ useAppStore — بينما useAppStore لا يحمل
//    حالة الإشعارات إطلاقاً. النتيجة: مشتركو core/store لا يستقبلون
//    تحديثات upsertNotification/markRead/hydrateNotifications أبداً، حتى
//    لو أُطلقت على المتجر الحقيقي في نفس اللحظة → عدم تزامن الجرس مع
//    صفحة الإشعارات (المشكلة الموصوفة بالضبط).
//
//    الآن نعيد تصدير المتجر الرسمي 1:1. يُبقي التوقيع (selector اختياري)
//    متوافقاً مع كل الاستدعاءات الموجودة:
//        useNotificationStore()                → الحالة كاملة
//        useNotificationStore(s => s.items)    → شريحة items
//        useNotificationStore(selectUnreadNotificationsCount) → عدّاد
//    كما يُبقي واجهات الحلقات (getState / setState / subscribe / destroy)
//    كما هي عبر نفس المرجع (تُستخدم في notificationService و mediaEventBridge).
export const useNotificationStore = Object.assign(
  (selector, equalityFn) => useCanonicalNotificationStore(selector, equalityFn),
  {
    getState: () => useCanonicalNotificationStore.getState(),
    setState: (...args) => useCanonicalNotificationStore.setState(...args),
    subscribe: (...args) => useCanonicalNotificationStore.subscribe(...args),
    destroy: () => useCanonicalNotificationStore.destroy?.(),
  },
);

export const useUIStore = (selector = (state) => state) =>
  useAppStore((state) => selector({
    theme: state.theme,
    language: state.language,
    installPrompt: state.installPrompt,
    uploadProgress: state.uploadProgress,
    setTheme: state.setTheme,
    toggleTheme: state.toggleTheme,
    setLanguage: state.setLanguage,
    setInstallPrompt: state.setInstallPrompt,
    clearInstallPrompt: state.clearInstallPrompt,
    setUploadProgress: state.setUploadProgress,
    clearUploadProgress: state.clearUploadProgress,
  }));

export function resetStore() {
  useCanonicalChatStore.getState().invalidateCache?.();
  // ✅ v89.33: تصفير متجر الإشعارات الحقيقي أيضاً — سابقاً كان يبقى ممتلئاً
  //    بعد logout لأن bridge كان يشير إلى متجر مختلف.
  try {
    useCanonicalNotificationStore.getState().clearAll?.();
  } catch { /* ignore */ }
  useAppStore.setState({
    session: null,
    authHydrated: true,
    authLoading: false,
    activeRequests: 0,
    uploadProgress: {},
    queuedActions: [],
  });
}

export function clearPersistedStore() {
  try {
    window.localStorage.removeItem('yamshat_app_store');
    window.localStorage.removeItem('yamshat_notifications');
    resetStore();
  } catch {
    resetStore();
  }
}

export function subscribeToStore(selector, callback) {
  return useAppStore.subscribe((state) => selector(state), callback);
}

export function getStoreState() {
  return {
    app: useAppStore.getState(),
    chat: useCanonicalChatStore.getState(),
    notifications: useCanonicalNotificationStore.getState(),
  };
}

export function updateStoreState(updates = {}) {
  if (updates?.app) useAppStore.setState(updates.app);
  if (updates?.chat) useCanonicalChatStore.setState(updates.chat);
  if (updates?.notifications) useCanonicalNotificationStore.setState(updates.notifications);
}
