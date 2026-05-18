/**
 * Offline Queue Manager
 * Features: Retry Priority, Persistence (IndexedDB), Conflict Resolution
 */

import { openDB } from 'idb';

const DB_NAME = 'yamshat-offline';
const STORE_NAME = 'request-queue';

class OfflineQueue {
  constructor() {
    this.dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('priority', 'priority');
          store.createIndex('timestamp', 'timestamp');
        }
      },
    });
  }

  /**
   * Add a request to the offline queue
   * @param {Object} requestData - { url, method, body, headers, priority }
   */
  async enqueue(requestData, priority = 1) {
    const db = await this.dbPromise;
    const entry = {
      ...requestData,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };
    return db.add(STORE_NAME, entry);
  }

  /**
   * Process the queue based on priority and timestamp
   */
  async processQueue() {
    if (!navigator.onLine) return;

    const db = await this.dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Get all pending requests
    let requests = await store.getAll();
    
    // Sort by priority (higher first) then timestamp
    requests.sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body ? JSON.stringify(req.body) : null
        });

        if (response.ok) {
          await store.delete(req.id);
          console.log(`[OfflineQueue] Successfully processed: ${req.url}`);
        } else if (response.status === 409) {
          // Conflict Resolution
          await this.handleConflict(req, response);
        } else {
          await this.handleRetry(req, store);
        }
      } catch (error) {
        await this.handleRetry(req, store);
      }
    }
    await tx.done;
  }

  async handleRetry(req, store) {
    if (req.retryCount < 5) {
      req.retryCount++;
      req.status = 'retrying';
      await store.put(req);
    } else {
      req.status = 'failed';
      await store.put(req);
      console.error(`[OfflineQueue] Max retries reached for: ${req.url}`);
    }
  }

  async handleConflict(req, response) {
    console.warn(`[OfflineQueue] Conflict detected for: ${req.url}`);
    // Custom conflict resolution logic (e.g., keep server version, or prompt user)
    // For now, we'll mark it as conflict and keep it in DB
    const db = await this.dbPromise;
    req.status = 'conflict';
    await db.put(STORE_NAME, req);
  }

  async clearQueue() {
    const db = await this.dbPromise;
    return db.clear(STORE_NAME);
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    offlineQueue.processQueue();
  });
}
