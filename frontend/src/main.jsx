import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageProvider.jsx';
import './styles/index.css';
import './styles/yamshat-rtl-fix-v32.css';
import './styles/smooth-touch-experience.css';
import { queryClient } from './lib/queryClient.js';
import { useAppStore } from './store/appStore.js';
import RealtimeProvider from './realtime/RealtimeProvider.jsx';
import { initializePerformanceToolkit } from './utils/performance.js';
import { initializeRuntimeErrorCapture } from './utils/runtimeErrors.js';
import notificationService from './services/notificationService.js';
import audioService from './services/audio/audioService.js';
import { activateMediaEventBridge } from './services/audio/mediaEventBridge.js';
import socketManager from './services/socketManager.js';
import { useNotificationStore } from './store/notificationStore.js';
import * as chatBus from './features/chat/chatEventBus.js';
import './styles/mobile-optimization.css';
import './styles/performance.css';
import './styles/unified-overrides.css';
import './styles/mobile-first.css';
import './styles/design-system.css';
import './styles/chat-premium.css';
import './styles/reels-premium.css';
import './styles/reels-fixes.css';
import './styles/design-system-enforce.css';
/* ⚠️ يجب أن يكون آخر استيراد CSS حتى يفوز في cascade ويصلح مشاكل الموبايل */
import './styles/mobile-fixes.css';
import './styles/brand-chat-notifications-refresh.css';
/* 🎨 إعادة تصميم الموبايل (مطابق للنموذج المرجعي) - يجب أن يكون الأخير */
import './styles/mobile-yamshat-redesign.css';
/* 🔧 إصلاح أزرار التفاعل في بطاقات المنشورات للجوال */
import './styles/mobile-post-actions-fix.css';
import './styles/mobile-app-experience.css';
/* ✨ v2.3.2 — Premium Neon polish (يجب أن تكون آخر ملفات CSS) */
import './styles/neon-theme-v2.css';
import './styles/animations-glow.css';
import './styles/badges-indicators.css';
import './styles/responsive-mobile-v2.css';
import './styles/performance-v2.css';
import './styles/feed-scrollbar-fix.css';
/* 🔧 إصلاح نهائي للسحب على الموبايل + تجربة كأنها تطبيق (يجب أن يكون الأخير) */
import './styles/mobile-scroll-fix.css';
/* 📱 hotfix نهائي لتثبيت PWA على الجوال ومعالجة الدردشة والبث */
import './styles/pwa-mobile-hotfix.css';
/* 🎯 v4 — طبقة التوحيد النهائية (أزرار، مسافات، خطوط، ألوان لكل المنصة) */
import './styles/platform-unified-v4.css';
/* 🧩 إصلاح بطاقة المنشور (MobilePostCard) — يحلّ التناثر ويُوحّد الشكل النهائي */
import './styles/mobile-post-card-unified-fix.css';
/* 🎯 v45 — إصلاحات ويب الجوال الحرجة (الفيديو + الهيدر + التخطيط) */
import './styles/mobile-fixes-v45.css';
/* 🎯 v46 — إصلاحات ويب الجوال (الإحصائيات + أيقونات المنشور + الهيدر + ضبط العرض) — يجب أن يكون الأخير */
import './styles/mobile-fixes-v46.css';
/* 🎯 v47.8 — pixel-perfect لمطابقة الصورة المرجعية + دعم الشاشات الصغيرة (Redmi Note 8 / 320px) */
import './styles/mobile-pixel-perfect-v47-8.css';
/* 🎯 v47.9 — تحسينات نهائية: PWA Banner + إصلاح subtext + شعار Y بسيط + توافق متصفحات قديمة */
import './styles/mobile-pixel-perfect-v47-9.css';
/* 🚀 v48.0 — إصلاح شامل لمشكلة اللمس الثقيل وعدم الاستجابة للسحب على Chrome Mobile / PWA */
import './styles/touch-responsiveness-fix.css';
/* 📱 v48.1 — تصغير الخطوط في صفحات الويب للجوال لتناسب الجوالات القديمة + منع تجاوز حدود الأزرار والصفحات */
import './styles/mobile-compact-fonts-v48.css';
/* 🎯 v49 — إصلاح نهائي وحازم لمشكلة السحب لا يعمل على ويب الجوال (يجب أن يكون آخر CSS) */
import './styles/mobile-touch-scroll-final-v49.css';
import { initializeViewportTracker } from './hooks/useViewportHeight.js';
import { pwaInitializer } from './services/pwaInitializer.js';
import { smoothTouchLayer } from './services/smoothTouchLayer.js';
import { legacyDeviceOptimizer } from './services/legacyDeviceOptimizer.js';

const BUILD_ID = 'yamshat-mobile-touch-scroll-fix-v49-0';
const BUILD_STORAGE_KEY = 'yamshat_build_id';

async function hardResetIfBuildChanged() {
  if (typeof window === 'undefined') return false;

  try {
    const previousBuild = localStorage.getItem(BUILD_STORAGE_KEY);
    if (previousBuild === BUILD_ID) return false;

    localStorage.setItem(BUILD_STORAGE_KEY, BUILD_ID);
    localStorage.removeItem('backendOrigin');
    localStorage.removeItem('apiBase');
    localStorage.removeItem('yamshat_post_draft');
    localStorage.removeItem('yamshat_quote_draft');

    const reloadFlag = `yamshat_build_reload:${BUILD_ID}`;
    if (!sessionStorage.getItem(reloadFlag)) {
      sessionStorage.setItem(reloadFlag, '1');
      window.location.replace(window.location.href);
      return true;
    }
  } catch {
    // ignore reset failures to avoid blocking startup
  }

  return false;
}

function normalizeStandaloneDeepLink() {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  if (hash && hash.startsWith('#/')) return;
  if (pathname === '/' || pathname === '/index.html') return;
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  window.location.replace(`/#${normalizedPath}${search}${hash || ''}`);
}

function announceUpdateReady(registration) {
  window.dispatchEvent(new CustomEvent('yamshat:update-ready', {
    detail: { registration },
  }));
}

function watchServiceWorkerUpdates(registration) {
  if (!registration) return registration;

  if (registration.waiting) {
    announceUpdateReady(registration);
  }

  registration.addEventListener('updatefound', () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener('statechange', () => {
      if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
        announceUpdateReady(registration);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  return registration;
}

if (typeof window !== 'undefined') {
  normalizeStandaloneDeepLink();
  window.__YAMSHAT_BUILD__ = BUILD_ID;
  window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
  initializePerformanceToolkit();
  initializeRuntimeErrorCapture();
  initializeViewportTracker();

  // تفعيل تحسينات PWA وتجربة المستخدم بشكل مؤجل لضمان سرعة ظهور الصفحة الأولى
  const initializeEnhancements = () => {
    try {
      // 🔧 v49: تعطيل smoothTouchLayer على document.documentElement لأنه
      // كان يُلصق 4 معالجات touch على <html> وتتسبب في تعليق السحب على بعض أجهزة
      // Android القديمة (Redmi/Honor/Galaxy A). نستخدمه فقط عند الحاجة عبر عناصر محددة.
      // smoothTouchLayer.attachToElement(document.documentElement);
      console.log('[Yamshat] Smooth touch layer deferred (v49 fix: avoid global touch listeners)');

      // تفعيل محسّن الأجهزة القديمة
      const deviceState = legacyDeviceOptimizer.getState();
      if (deviceState.isLegacyDevice) {
        console.log('[Yamshat] Legacy device optimizations applied');
      }

      // تفعيل PWA - نستخدم sw.js الرئيسي الموحد
      pwaInitializer.init({ swPath: '/sw.js' }).then(() => {
        console.log('[Yamshat] PWA initialized successfully');
      }).catch(err => {
        console.warn('[Yamshat] PWA initialization error:', err);
      });
    } catch (err) {
      console.warn('[Yamshat] Enhancement initialization error:', err);
    }
  };

  // تأجيل التهيئة قليلاً للسماح للمتصفح برسم الواجهة أولاً
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => initializeEnhancements());
  } else {
    setTimeout(initializeEnhancements, 1000);
  }

  try {
    activateMediaEventBridge({
      notificationStore: useNotificationStore,
      socketManager,
      chatBus,
    });
    audioService.preload();
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[audio] bridge init failed', err);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    useAppStore.getState().setInstallPrompt(event);
  });

  window.addEventListener('appinstalled', () => {
    useAppStore.getState().clearInstallPrompt();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      const resetTriggeredReload = await hardResetIfBuildChanged();
      if (resetTriggeredReload) return;
      
      // ملاحظة: pwaInitializer.init() يتولى الآن تسجيل sw.js بشكل موحد
      // لضمان عدم وجود تعارضات وسرعة في التحميل
      console.log('[Yamshat] Service Worker registration deferred to PWA Initializer');
    });
  }
}

// 🔄 إتاحة queryClient عالمياً لاستخدامه في ميزة "اسحب للتحديث" من الـ Layouts
if (typeof window !== 'undefined') {
  window.__yamshatQueryClient = queryClient;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <HashRouter>
          <RealtimeProvider>
            <App />
          </RealtimeProvider>
        </HashRouter>
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
