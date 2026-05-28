
const CACHE_NAME = "yamshat-offline-v1";

const urlsToCache = [
  "/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          return new Response("أنت غير متصل بالإنترنت حالياً", {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
      );
    })
  );
});
