// Extremely safe pass-through Service Worker to enable PWA installation
// without caching stale index.html or chunk files which causes loading errors on updates.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Empty fetch listener. By not calling event.respondWith(), the browser handles
  // all requests natively over the network. This fulfills PWA requirements without any risk
  // of caching, CORS, or mobile proxy errors.
});
