/**
 * Yamshat PWA & Offline Support Configuration
 * ميزات PWA والـ Offline Support
 * Version 2.0.0
 */

// ============ Service Worker Configuration ============

export const serviceWorkerConfig = {
  // Service worker file
  swFile: '/service-worker.js',

  // Cache names
  cacheNames: {
    runtime: 'yamshat-runtime-v1',
    images: 'yamshat-images-v1',
    fonts: 'yamshat-fonts-v1',
    api: 'yamshat-api-v1',
    pages: 'yamshat-pages-v1',
  },

  // Cache strategies
  strategies: {
    // Network first
    networkFirst: {
      cacheName: 'yamshat-runtime-v1',
      networkTimeoutSeconds: 3,
      routes: [
        '/api/',
        '/messages',
        '/calls',
        '/live',
      ],
    },

    // Cache first
    cacheFirst: {
      cacheName: 'yamshat-cache-v1',
      routes: [
        '/images/',
        '/fonts/',
        '/css/',
        '/js/',
        '.woff2',
        '.png',
        '.jpg',
        '.svg',
      ],
    },

    // Stale while revalidate
    staleWhileRevalidate: {
      cacheName: 'yamshat-swr-v1',
      routes: [
        '/profile',
        '/groups',
        '/reels',
      ],
    },
  },

  // Precache
  precache: [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/css/main.css',
    '/js/main.js',
    '/images/logo.svg',
  ],

  // Skip waiting
  skipWaiting: true,

  // Claim clients
  clientsClaim: true,
};

// ============ Manifest Configuration ============

export const manifestConfig = {
  name: 'Yamshat - منصة اجتماعية متقدمة',
  shortName: 'Yamshat',
  description: 'منصة اجتماعية متقدمة مع مكالمات فيديو وبث مباشر',
  startUrl: '/',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#1890ff',
  background_color: '#ffffff',

  // Icons
  icons: [
    {
      src: '/images/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/images/icon-maskable-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/images/icon-maskable-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],

  // Screenshots
  screenshots: [
    {
      src: '/images/screenshot-540x720.png',
      sizes: '540x720',
      type: 'image/png',
      form_factor: 'narrow',
    },
    {
      src: '/images/screenshot-1280x720.png',
      sizes: '1280x720',
      type: 'image/png',
      form_factor: 'wide',
    },
  ],

  // App shortcuts
  shortcuts: [
    {
      name: 'الرسائل',
      shortName: 'رسائل',
      description: 'فتح الرسائل',
      url: '/messages',
      icons: [
        {
          src: '/images/icon-message-96x96.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'المكالمات',
      shortName: 'مكالمات',
      description: 'فتح المكالمات',
      url: '/calls',
      icons: [
        {
          src: '/images/icon-call-96x96.png',
          sizes: '96x96',
        },
      ],
    },
    {
      name: 'البث المباشر',
      shortName: 'بث',
      description: 'فتح البث المباشر',
      url: '/live',
      icons: [
        {
          src: '/images/icon-live-96x96.png',
          sizes: '96x96',
        },
      ],
    },
  ],

  // Categories
  categories: ['social', 'communication', 'productivity'],

  // Prefer related applications
  preferRelatedApplications: false,
};

// ============ Install Prompt Configuration ============

export const installPromptConfig = {
  // Show install prompt
  showPrompt: true,

  // Prompt timing (in milliseconds)
  promptDelay: 5000,

  // Prompt conditions
  conditions: {
    minVisits: 2,
    minTimeOnSite: 30000, // 30 seconds
    notInstalledYet: true,
  },

  // Custom install prompt
  customPrompt: {
    enabled: true,
    title: 'تثبيت Yamshat',
    description: 'ثبت التطبيق على جهازك للوصول السريع والعمل بدون إنترنت',
    installButton: 'تثبيت',
    cancelButton: 'لاحقاً',
  },

  // Deferral strategy
  deferralStrategy: {
    maxDeferrals: 3,
    deferralDelay: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// ============ Offline Mode Configuration ============

export const offlineModeConfig = {
  // Offline detection
  offlineDetection: {
    enabled: true,
    checkInterval: 5000,
  },

  // Offline UI
  offlineUI: {
    showBanner: true,
    bannerPosition: 'top',
    bannerMessage: 'أنت غير متصل بالإنترنت. بعض الميزات قد تكون محدودة.',
  },

  // Offline storage
  offlineStorage: {
    enabled: true,
    type: 'indexeddb',
    dbName: 'yamshat-offline',
    version: 1,
    stores: [
      'messages',
      'posts',
      'reels',
      'profiles',
      'groups',
    ],
  },

  // Offline data sync
  offlineSync: {
    enabled: true,
    syncInterval: 30000,
    maxRetries: 3,
    retryDelay: 5000,
  },
};

// ============ Background Sync Configuration ============

export const backgroundSyncConfig = {
  // Background sync enabled
  enabled: true,

  // Sync tags
  syncTags: [
    'send-message',
    'upload-post',
    'upload-reel',
    'create-group',
    'update-profile',
  ],

  // Sync retry
  syncRetry: {
    enabled: true,
    maxRetries: 5,
    retryDelay: 5000,
    backoffMultiplier: 2,
  },

  // Sync notification
  syncNotification: {
    enabled: true,
    title: 'جاري المزامنة',
    message: 'جاري مزامنة البيانات...',
  },
};

// ============ Offline Uploads Configuration ============

export const offlineUploadsConfig = {
  // Offline upload queue
  uploadQueue: {
    enabled: true,
    maxQueueSize: 100,
    storageType: 'indexeddb',
  },

  // Offline upload retry
  uploadRetry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 5000,
  },

  // Offline upload notification
  uploadNotification: {
    enabled: true,
    showProgress: true,
  },

  // Supported offline uploads
  supportedUploads: [
    'messages',
    'posts',
    'reels',
    'stories',
    'profile-picture',
  ],
};

// ============ Cache Versioning ============

export const cacheVersioning = {
  // Cache version
  version: 'v1',

  // Cache update strategy
  updateStrategy: 'auto', // 'auto' or 'manual'

  // Cache expiration
  expiration: {
    enabled: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 1000,
  },

  // Cache cleanup
  cleanup: {
    enabled: true,
    interval: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Cache versioning strategy
  versioningStrategy: 'hash', // 'hash' or 'timestamp'
};

// ============ Push Notifications Configuration ============

export const pushNotificationsConfig = {
  // Push enabled
  enabled: true,

  // Push server
  pushServer: 'https://api.yamshat.com/push',

  // Push tags
  pushTags: [
    'messages',
    'calls',
    'live',
    'groups',
    'mentions',
  ],

  // Push notification options
  notificationOptions: {
    badge: '/images/badge-72x72.png',
    icon: '/images/icon-192x192.png',
    tag: 'yamshat-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  },

  // Push notification actions
  notificationActions: [
    {
      action: 'open',
      title: 'فتح',
      icon: '/images/icon-open.png',
    },
    {
      action: 'close',
      title: 'إغلاق',
      icon: '/images/icon-close.png',
    },
  ],
};

// ============ Splash Screen Configuration ============

export const splashScreenConfig = {
  // Splash screen enabled
  enabled: true,

  // Splash screen image
  image: '/images/splash-screen.png',

  // Splash screen background color
  backgroundColor: '#ffffff',

  // Splash screen duration
  duration: 3000,

  // Splash screen animation
  animation: {
    type: 'fade',
    duration: 500,
  },
};

// ============ App Shortcuts Configuration ============

export const appShortcutsConfig = {
  // Shortcuts enabled
  enabled: true,

  // Shortcuts
  shortcuts: [
    {
      id: 'messages',
      name: 'الرسائل',
      shortName: 'رسائل',
      description: 'فتح الرسائل',
      url: '/messages',
      icon: '/images/icon-message.png',
    },
    {
      id: 'calls',
      name: 'المكالمات',
      shortName: 'مكالمات',
      description: 'فتح المكالمات',
      url: '/calls',
      icon: '/images/icon-call.png',
    },
    {
      id: 'live',
      name: 'البث المباشر',
      shortName: 'بث',
      description: 'فتح البث المباشر',
      url: '/live',
      icon: '/images/icon-live.png',
    },
    {
      id: 'profile',
      name: 'الملف الشخصي',
      shortName: 'ملف',
      description: 'فتح الملف الشخصي',
      url: '/profile',
      icon: '/images/icon-profile.png',
    },
  ],
};

// ============ Update Handling Configuration ============

export const updateHandlingConfig = {
  // Auto update
  autoUpdate: true,

  // Update check interval
  updateCheckInterval: 60 * 60 * 1000, // 1 hour

  // Update notification
  updateNotification: {
    enabled: true,
    title: 'تحديث جديد متاح',
    message: 'هناك نسخة جديدة من التطبيق. يرجى تحديث التطبيق.',
    updateButton: 'تحديث',
    dismissButton: 'لاحقاً',
  },

  // Update strategy
  updateStrategy: 'prompt', // 'auto' or 'prompt'

  // Update retry
  updateRetry: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 5000,
  },
};

// ============ Manifest Optimization ============

export const manifestOptimization = {
  // Manifest caching
  caching: {
    enabled: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Manifest validation
  validation: {
    enabled: true,
    validateIcons: true,
    validateScreenshots: true,
  },

  // Manifest compression
  compression: {
    enabled: true,
    algorithm: 'gzip',
  },
};

export default {
  serviceWorkerConfig,
  manifestConfig,
  installPromptConfig,
  offlineModeConfig,
  backgroundSyncConfig,
  offlineUploadsConfig,
  cacheVersioning,
  pushNotificationsConfig,
  splashScreenConfig,
  appShortcutsConfig,
  updateHandlingConfig,
  manifestOptimization,
};
