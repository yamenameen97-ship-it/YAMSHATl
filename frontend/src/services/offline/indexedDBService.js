
export class IndexedDBService {
  constructor(dbName = "yamshat_offline_db", version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("offline_queue")) {
          db.createObjectStore("offline_queue", {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        if (!db.objectStoreNames.contains("messages")) {
          db.createObjectStore("messages", {
            keyPath: "id",
          });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async add(store, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readwrite");
      tx.objectStore(store).add(data);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAll(store) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, "readonly");
      const request = tx.objectStore(store).getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const indexedDBService = new IndexedDBService();
