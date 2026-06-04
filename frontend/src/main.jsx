import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './styles/index.css';
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
import { initializeViewportTracker } from './hooks/useViewportHeight.js';
import { pwaInitializer } from './services/pwaInitializer.js';
import { smoothTouchLayer } from './services/smoothTouchLayer.js';
import { legacyDeviceOptimizer } from './services/legacyDeviceOptimizer.js';

const BUILD_ID = 'yamshat-pwa-neon-v2.3.2-fixed-final';
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

  // تفعيل تحسينات PWA وتجربة المستخدم
  try {
    // تفعيل طبقة اللمس السلس
    smoothTouchLayer.attachToElement(document.documentElement);
    console.log('[Yamshat] Smooth touch layer activated');

    // تفعيل محسّن الأجهزة القديمة
    const deviceState = legacyDeviceOptimizer.getState();
    if (deviceState.isLegacyDevice) {
      console.log('[Yamshat] Legacy device optimizations applied');
    }

    // تفعيل PWA
    pwaInitializer.init().then(() => {
      console.log('[Yamshat] PWA initialized successfully');
    }).catch(err => {
      console.warn('[Yamshat] PWA initialization error:', err);
    });
  } catch (err) {
    console.warn('[Yamshat] Enhancement initialization error:', err);
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

      window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
        .then((registration) => {
          const watchedRegistration = watchServiceWorkerUpdates(registration);
          initializePerformanceToolkit({ registration: watchedRegistration });
          notificationService.initialize().catch(() => null);
          return watchedRegistration;
        })
        .catch(() => null);
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
