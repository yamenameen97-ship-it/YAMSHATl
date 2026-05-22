
const DB_NAME = 'yamshat-background-sync-db';
const STORE_NAME = 'outbox';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

async function storeRequest(request) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.add({
    url: request.url,
    method: request.method,
    headers: Array.from(request.headers.entries()),
    body: await request.text(),
    timestamp: Date.now(),
  });
  return tx.complete;
}

async function getRequests() {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return store.getAll();
}

async function deleteRequest(id) {
  const db = await openDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return tx.complete;
}

async function replayRequests() {
  const requests = await getRequests();
  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: req.method,
        headers: new Headers(req.headers),
        body: req.body,
      });
      if (response.ok) {
        await deleteRequest(req.id);
        console.log('Replayed request successfully:', req.url);
      } else {
        console.error('Failed to replay request, status:', response.status, req.url);
      }
    } catch (error) {
      console.error('Error replaying request:', error, req.url);
    }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'yamshat-background-sync') {
    event.waitUntil(replayRequests());
  }
});

