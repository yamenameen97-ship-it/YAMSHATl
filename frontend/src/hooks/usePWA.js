/**
 * Hooks لتحسين تجربة PWA
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { pwaEnhancer } from '../services/pwaEnhancer';

/**
 * Hook لمراقبة حالة الاتصال
 */
export const useConnectionStatus = () => {
  const [status, setStatus] = useState(pwaEnhancer.getConnectionStatus());

  useEffect(() => {
    const unsubscribeOnline = pwaEnhancer.on('online', () => {
      setStatus(pwaEnhancer.getConnectionStatus());
    });

    const unsubscribeOffline = pwaEnhancer.on('offline', () => {
      setStatus(pwaEnhancer.getConnectionStatus());
    });

    const unsubscribeSyncStatus = pwaEnhancer.on('syncStatusChanged', () => {
      setStatus(pwaEnhancer.getConnectionStatus());
    });

    const unsubscribeQueueUpdated = pwaEnhancer.on('queueUpdated', () => {
      setStatus(pwaEnhancer.getConnectionStatus());
    });

    return () => {
      unsubscribeOnline?.();
      unsubscribeOffline?.();
      unsubscribeSyncStatus?.();
      unsubscribeQueueUpdated?.();
    };
  }, []);

  return status;
};

/**
 * Hook لإدارة قائمة الانتظار الأوفلاين
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState(pwaEnhancer.offlineQueue);

  useEffect(() => {
    const unsubscribe = pwaEnhancer.on('queueUpdated', () => {
      setQueue([...pwaEnhancer.offlineQueue]);
    });

    return () => unsubscribe?.();
  }, []);

  const addToQueue = useCallback((action, data) => {
    return pwaEnhancer.queueOfflineAction(action, data);
  }, []);

  const processQueue = useCallback(() => {
    return pwaEnhancer.processOfflineQueue();
  }, []);

  return {
    queue,
    addToQueue,
    processQueue,
    queueSize: queue.length
  };
};

/**
 * Hook لإدارة تثبيت التطبيق
 */
export const useInstallPrompt = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(pwaEnhancer.isInstalled);

  useEffect(() => {
    const unsubscribeReady = pwaEnhancer.on('installPromptReady', () => {
      setCanInstall(true);
    });

    const unsubscribeInstalled = pwaEnhancer.on('appInstalled', () => {
      setIsInstalled(true);
      setCanInstall(false);
    });

    return () => {
      unsubscribeReady?.();
      unsubscribeInstalled?.();
    };
  }, []);

  const promptInstall = useCallback(async () => {
    return pwaEnhancer.promptInstall();
  }, []);

  return {
    canInstall,
    isInstalled,
    promptInstall
  };
};

/**
 * Hook لعرض شعار الأوفلاين
 */
export const useOfflineBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('warning');

  useEffect(() => {
    const unsubscribeOffline = pwaEnhancer.on('offline', () => {
      setShowBanner(true);
      setBannerMessage('أنت غير متصل بالإنترنت');
      setBannerType('warning');
    });

    const unsubscribeOnline = pwaEnhancer.on('online', () => {
      setShowBanner(true);
      setBannerMessage('تم استعادة الاتصال');
      setBannerType('success');
      setTimeout(() => setShowBanner(false), 3000);
    });

    const unsubscribeBanner = pwaEnhancer.on('showOfflineBanner', (data) => {
      setShowBanner(true);
      setBannerMessage(data.message);
      setBannerType(data.type);
    });

    return () => {
      unsubscribeOffline?.();
      unsubscribeOnline?.();
      unsubscribeBanner?.();
    };
  }, []);

  const closeBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  return {
    showBanner,
    bannerMessage,
    bannerType,
    closeBanner
  };
};

/**
 * Hook لمراقبة حالة المزامنة
 */
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState(pwaEnhancer.syncStatus);
  const [remainingItems, setRemainingItems] = useState(0);

  useEffect(() => {
    const unsubscribe = pwaEnhancer.on('syncStatusChanged', (data) => {
      setSyncStatus(data.status);
      setRemainingItems(data.remainingItems || 0);
    });

    return () => unsubscribe?.();
  }, []);

  return {
    syncStatus,
    remainingItems,
    isSyncing: syncStatus === 'syncing',
    isSynced: syncStatus === 'synced'
  };
};

/**
 * Hook شامل لإدارة PWA
 */
export const usePWA = () => {
  const connectionStatus = useConnectionStatus();
  const offlineQueue = useOfflineQueue();
  const installPrompt = useInstallPrompt();
  const offlineBanner = useOfflineBanner();
  const syncStatus = useSyncStatus();

  return {
    connectionStatus,
    offlineQueue,
    installPrompt,
    offlineBanner,
    syncStatus,
    isOnline: connectionStatus.isOnline,
    isOffline: !connectionStatus.isOnline,
    canInstall: installPrompt.canInstall,
    isInstalled: installPrompt.isInstalled
  };
};

/**
 * Hook لتخزين البيانات محلياً
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook لتخزين البيانات في IndexedDB
 */
export const useIndexedDB = (dbName, storeName, key) => {
  const [value, setValue] = useState(null);
  const dbRef = useRef(null);

  useEffect(() => {
    const initDB = async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          dbRef.current = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        };
      });
    };

    initDB().catch(error => console.warn('IndexedDB not available:', error));
  }, [dbName, storeName]);

  const getValue = useCallback(async () => {
    if (!dbRef.current) return null;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }, [storeName, key]);

  const setValue_DB = useCallback(async (data) => {
    if (!dbRef.current) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ id: key, ...data });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        setValue(data);
        resolve();
      };
    });
  }, [storeName, key]);

  const deleteValue = useCallback(async () => {
    if (!dbRef.current) return;

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        setValue(null);
        resolve();
      };
    });
  }, [storeName, key]);

  return {
    value,
    getValue,
    setValue: setValue_DB,
    deleteValue
  };
};
