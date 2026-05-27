
import { indexedDBService } from "./indexedDBService";

class OfflineSyncEngine {
  constructor() {
    this.isSyncing = false;
  }

  async syncQueue(apiHandler) {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      const queue = await indexedDBService.getAll("offline_queue");

      for (const item of queue) {
        try {
          await apiHandler(item);
        } catch (error) {
          console.error("Sync failed:", error);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

export const offlineSyncEngine = new OfflineSyncEngine();
