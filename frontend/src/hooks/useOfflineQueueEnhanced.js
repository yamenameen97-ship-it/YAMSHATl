import { useState, useCallback, useRef, useEffect } from 'react';
import { useMemoryCleanup } from './useMemoryCleanup.js';

/**
 * useOfflineQueueEnhanced Hook
 * 
 * إدارة الـ Offline Queue مع:
 * - Sync retry logic
 * - Conflict resolution
 * - Priority handling
 * - Persistence
 * - Status tracking
 */
export function useOfflineQueueEnhanced() {
  const [queue, setQueue] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error
  const [conflicts, setConflicts] = useState([]);
  const queueRef = useRef([]);
  const { registerInterval, registerCleanup } = useMemoryCleanup();

  // Load queue from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('offlineQueue');
      if (saved) {
        const parsed = JSON.parse(saved);
        queueRef.current = parsed;
        setQueue(parsed);
      }
    } catch (e) {
      console.warn('Failed to load offline queue:', e);
    }
  }, []);

  // Save queue to localStorage
  const saveQueue = useCallback((newQueue) => {
    try {
      localStorage.setItem('offlineQueue', JSON.stringify(newQueue));
      queueRef.current = newQueue;
      setQueue(newQueue);
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }, []);

  // Add item to queue
  const enqueue = useCallback((item) => {
    const newItem = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      priority: item.priority || 'normal',
      retries: 0,
      maxRetries: item.maxRetries || 3,
      ...item,
    };

    const newQueue = [...queueRef.current, newItem];
    // Sort by priority
    newQueue.sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    saveQueue(newQueue);
    return newItem.id;
  }, [saveQueue]);

  // Remove item from queue
  const dequeue = useCallback((itemId) => {
    const newQueue = queueRef.current.filter(item => item.id !== itemId);
    saveQueue(newQueue);
  }, [saveQueue]);

  // Update item in queue
  const updateItem = useCallback((itemId, updates) => {
    const newQueue = queueRef.current.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    saveQueue(newQueue);
  }, [saveQueue]);

  // Handle conflict resolution
  const resolveConflict = useCallback((conflictId, resolution) => {
    const newConflicts = conflicts.filter(c => c.id !== conflictId);
    setConflicts(newConflicts);

    // Apply resolution
    if (resolution.action === 'keep_local') {
      // Keep local version, retry sync
      const item = queueRef.current.find(i => i.id === resolution.itemId);
      if (item) {
        updateItem(resolution.itemId, { retries: 0 });
      }
    } else if (resolution.action === 'keep_remote') {
      // Discard local version
      dequeue(resolution.itemId);
    } else if (resolution.action === 'merge') {
      // Merge versions
      updateItem(resolution.itemId, resolution.mergedData);
    }
  }, [conflicts, updateItem, dequeue]);

  // Sync queue with server
  const sync = useCallback(async () => {
    if (queueRef.current.length === 0) {
      setSyncStatus('idle');
      return;
    }

    setSyncStatus('syncing');

    try {
      for (const item of queueRef.current) {
        try {
          // Call the sync function provided in the item
          if (item.syncFn) {
            const result = await item.syncFn(item.data);

            // Check for conflicts
            if (result.conflict) {
              setConflicts(prev => [...prev, {
                id: `conflict-${item.id}`,
                itemId: item.id,
                localData: item.data,
                remoteData: result.remoteData,
                conflictType: result.conflictType,
              }]);
            } else {
              // Success - remove from queue
              dequeue(item.id);
            }
          }
        } catch (error) {
          // Retry logic
          if (item.retries < item.maxRetries) {
            updateItem(item.id, { retries: item.retries + 1 });
          } else {
            // Max retries exceeded
            updateItem(item.id, { status: 'failed', error: error.message });
          }
        }
      }

      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  }, [dequeue, updateItem]);

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      sync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [sync]);

  // Periodic sync
  useEffect(() => {
    if (navigator.onLine) {
      registerInterval(() => {
        sync();
      }, 30000); // Sync every 30 seconds
    }
  }, [sync, registerInterval]);

  // Cleanup
  registerCleanup(() => {
    // Save queue before unmount
    localStorage.setItem('offlineQueue', JSON.stringify(queueRef.current));
  });

  return {
    queue,
    syncStatus,
    conflicts,
    enqueue,
    dequeue,
    updateItem,
    sync,
    resolveConflict,
    queueSize: queue.length,
    pendingCount: queue.filter(i => !i.status || i.status === 'pending').length,
  };
}

/**
 * Offline Queue UI Component
 * 
 * مكون لعرض حالة الـ Offline Queue
 */
export function OfflineQueueUI({ queue, syncStatus, onSync }) {
  if (navigator.onLine && syncStatus === 'idle' && queue.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: 'var(--bg-card)',
      border: '1px solid var(--line)',
      borderRadius: '8px',
      padding: '16px',
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        {!navigator.onLine && <span>🔴</span>}
        {navigator.onLine && syncStatus === 'syncing' && <span className="spinner">⏳</span>}
        {navigator.onLine && syncStatus === 'idle' && <span>🟢</span>}

        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          {!navigator.onLine ? 'بلا اتصال' : syncStatus === 'syncing' ? 'جاري المزامنة...' : 'متصل'}
        </span>
      </div>

      {queue.length > 0 && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          {queue.length} عنصر في الانتظار
        </div>
      )}

      {navigator.onLine && queue.length > 0 && (
        <button
          onClick={onSync}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          مزامنة الآن
        </button>
      )}

      <style>{`
        .spinner {
          display: 'inline-block';
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * Conflict Resolution UI Component
 * 
 * مكون لحل التعارضات
 */
export function ConflictResolutionUI({ conflict, onResolve }) {
  return (
    <div style={{
      padding: '16px',
      background: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: '8px',
      marginBottom: '12px',
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '12px', color: '#92400e' }}>
        ⚠️ تعارض في البيانات
      </div>

      <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '12px' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>النسخة المحلية:</strong>
          <pre style={{
            background: 'rgba(0,0,0,0.1)',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '11px',
          }}>
            {JSON.stringify(conflict.localData, null, 2)}
          </pre>
        </div>

        <div>
          <strong>النسخة البعيدة:</strong>
          <pre style={{
            background: 'rgba(0,0,0,0.1)',
            padding: '8px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '11px',
          }}>
            {JSON.stringify(conflict.remoteData, null, 2)}
          </pre>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onResolve({ action: 'keep_local' })}
          style={{
            flex: 1,
            padding: '8px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          احتفظ بالمحلية
        </button>
        <button
          onClick={() => onResolve({ action: 'keep_remote' })}
          style={{
            flex: 1,
            padding: '8px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          احتفظ بالبعيدة
        </button>
      </div>
    </div>
  );
}
