/**
 * PWA Registration and Update Management
 */

class PWAManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
  }

  /**
   * Initialize PWA
   */
  async init() {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    try {
      console.log('[PWA] Registering Service Worker...');
      this.registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('[PWA] Service Worker registered:', this.registration);

      // Listen for updates
      this.registration.addEventListener('updatefound', () => this.onUpdateFound());

      // Check for updates periodically
      setInterval(() => this.checkForUpdates(), 60000); // Every minute

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.onControllerChange();
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.onMessage(event.data);
      });

      // Request notification permission
      this.requestNotificationPermission();

      // Request persistent storage
      this.requestPersistentStorage();

      return this.registration;
    } catch (error) {
      console.error('[PWA] Registration failed:', error);
    }
  }

  /**
   * Check for updates
   */
  async checkForUpdates() {
    if (!this.registration) return;

    try {
      console.log('[PWA] Checking for updates...');
      await this.registration.update();
    } catch (error) {
      console.error('[PWA] Update check failed:', error);
    }
  }

  /**
   * Handle update found
   */
  onUpdateFound() {
    const newWorker = this.registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is ready
        this.updateAvailable = true;
        this.showUpdatePrompt();
      }
    });
  }

  /**
   * Show update prompt
   */
  showUpdatePrompt() {
    console.log('[PWA] Update available');

    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pwa-update-available', {
      detail: {
        registration: this.registration
      }
    }));

    // Show in-app notification
    this.showNotification(
      'تحديث جديد متاح',
      'تم توفر نسخة جديدة من التطبيق. هل تريد التحديث الآن؟',
      [
        {
          text: 'لاحقاً',
          action: () => this.dismissUpdate()
        },
        {
          text: 'تحديث الآن',
          action: () => this.applyUpdate(),
          primary: true
        }
      ]
    );
  }

  /**
   * Apply update
   */
  applyUpdate() {
    if (!this.registration || !this.registration.waiting) {
      return;
    }

    // Tell service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload page when new service worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }

  /**
   * Dismiss update
   */
  dismissUpdate() {
    this.updateAvailable = false;
    console.log('[PWA] Update dismissed');
  }

  /**
   * Handle controller change
   */
  onControllerChange() {
    console.log('[PWA] Service Worker controller changed');
    window.dispatchEvent(new CustomEvent('pwa-controller-changed'));
  }

  /**
   * Handle messages from service worker
   */
  onMessage(data) {
    console.log('[PWA] Message from Service Worker:', data);

    if (data.type === 'OFFLINE') {
      this.showOfflineNotification();
    } else if (data.type === 'ONLINE') {
      this.showOnlineNotification();
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      console.log('[PWA] Notification permission granted');
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        console.log('[PWA] Notification permission:', permission);
      } catch (error) {
        console.error('[PWA] Notification permission request failed:', error);
      }
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage() {
    if (!navigator.storage || !navigator.storage.persist) {
      console.log('[PWA] Persistent storage not supported');
      return;
    }

    try {
      const persistent = await navigator.storage.persist();
      console.log('[PWA] Persistent storage:', persistent ? 'granted' : 'denied');
    } catch (error) {
      console.error('[PWA] Persistent storage request failed:', error);
    }
  }

  /**
   * Show notification
   */
  showNotification(title, message, actions = []) {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('pwa-notification', {
      detail: { title, message, actions }
    }));

    // Fallback to alert
    if (!actions.length) {
      alert(`${title}\n${message}`);
    }
  }

  /**
   * Show offline notification
   */
  showOfflineNotification() {
    this.showNotification(
      'أنت غير متصل',
      'تم فقدان الاتصال بالإنترنت. بعض الميزات قد لا تكون متاحة.'
    );
  }

  /**
   * Show online notification
   */
  showOnlineNotification() {
    this.showNotification(
      'متصل بالإنترنت',
      'تم استعادة الاتصال بالإنترنت.'
    );
  }

  /**
   * Enable offline mode
   */
  async enableOfflineMode() {
    if (!this.registration) {
      console.error('[PWA] Service Worker not registered');
      return;
    }

    console.log('[PWA] Enabling offline mode');
    // Implementation for offline mode
  }

  /**
   * Disable offline mode
   */
  async disableOfflineMode() {
    if (!this.registration) {
      console.error('[PWA] Service Worker not registered');
      return;
    }

    console.log('[PWA] Disabling offline mode');
    // Implementation for disabling offline mode
  }

  /**
   * Get offline status
   */
  isOffline() {
    return !navigator.onLine;
  }

  /**
   * Clear cache
   */
  async clearCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      );
      console.log('[PWA] Cache cleared');
    } catch (error) {
      console.error('[PWA] Cache clear failed:', error);
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) {
        return null;
      }

      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: (estimate.usage / estimate.quota) * 100
      };
    } catch (error) {
      console.error('[PWA] Cache size estimation failed:', error);
      return null;
    }
  }

  /**
   * Install prompt handling
   */
  handleInstallPrompt() {
    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;

      // Show install button
      window.dispatchEvent(new CustomEvent('pwa-install-prompt', {
        detail: { prompt: deferredPrompt }
      }));
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    });

    return {
      prompt: () => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted install prompt');
            } else {
              console.log('[PWA] User dismissed install prompt');
            }
            deferredPrompt = null;
          });
        }
      }
    };
  }
}

// Initialize PWA when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
    window.pwaManager.init();
    window.pwaManager.handleInstallPrompt();
  });
} else {
  window.pwaManager = new PWAManager();
  window.pwaManager.init();
  window.pwaManager.handleInstallPrompt();
}

// Handle online/offline events
window.addEventListener('online', () => {
  console.log('[PWA] Online');
  if (window.pwaManager) {
    window.pwaManager.showOnlineNotification();
  }
});

window.addEventListener('offline', () => {
  console.log('[PWA] Offline');
  if (window.pwaManager) {
    window.pwaManager.showOfflineNotification();
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}
