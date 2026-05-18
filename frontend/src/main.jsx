import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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

if (typeof window !== 'undefined') {
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
    window.addEventListener('load', () => {
      window.__YAMSHAT_SW_READY__ = navigator.serviceWorker.getRegistrations()
        .then(async (registrations) => {
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ('caches' in window) {
            const cacheKeys = await window.caches.keys();
            await Promise.all(
              cacheKeys
                .filter((key) => /yamshat|:shell|:static|:media|:api|:offline/i.test(key))
                .map((key) => window.caches.delete(key))
            );
          }
          initializePerformanceToolkit({ registration: null });
          notificationService.initialize().catch(() => null);
          return null;
        })
        .catch(() => null);
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
