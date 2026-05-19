import { registerServiceWorker } from './service-worker-manager';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import './styles/global.css';
import './styles/responsive.css';
import { queryClient } from './lib/queryClient.js';
import { useAppStore } from './store/appStore.js';
import RealtimeProvider from './realtime/RealtimeProvider.jsx';
import { initializePerformanceToolkit } from './utils/performance.js';
import { initializeRuntimeErrorCapture } from './utils/runtimeErrors.js';
import notificationService from './services/notificationService.js';

const BUILD_ID = 'yamshat-hotfix-20260519-r1';
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

    try {
      sessionStorage.removeItem('yamshat_user_session');
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
  // ✅ أضف هذا بعد root.render()
window.addEventListener('load', async () => {
  // تسجيل Service Worker المحسّن
  await registerServiceWorker();
  
});


