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
import { initializeViewportTracker } from './hooks/useViewportHeight.js';

const BUILD_ID = 'yamshat-mobile-fixed-20260530-r2';
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
    localStorage.removeItem('yamshat_user_session');
    localStorage.removeItem('yamshatAuth');
    localStorage.removeItem('user');
    localStorage.removeItem('yamshat_csrf_token');

    try {
      sessionStorage.removeItem('yamshat_user_session');
      sessionStorage.removeItem('yamshatAuth');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('yamshat_csrf_token');
    } catch {
      // ignore storage failures
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister().catch(() => false)));
    }

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key).catch(() => false)));
    }

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

if (typeof window !== 'undefined') {
  window.__YAMSHAT_BUILD__ = BUILD_ID;
  window.__YAMSHAT_SW_READY__ = Promise.resolve(null);
  initializePerformanceToolkit();
  initializeRuntimeErrorCapture();
  initializeViewportTracker();

  // تفعيل نظام الوسائط المركزي: ربط الأصوات بأحداث التطبيق
  try {
    activateMediaEventBridge({
      notificationStore: useNotificationStore,
      socketManager,
      chatBus,
    });
    // إعلام المحرك أن يبدأ بالتحميل المسبق (سينتظر تفاعل المستخدم الأول)
    audioService.preload();
  } catch (err) {
    // لا نريد أن تفشل التطبيق بسبب مشاكل في الصوت
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

      window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          initializePerformanceToolkit({ registration });
          notificationService.initialize().catch(() => null);
          return registration;
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
