const CACHE_NAME = 'tfhs-cache-v4';   // bumped: forces every device to drop the old cache (v2 could hold a wrong index.html)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './tfhs-192.png',
  './tfhs-512.png',
  './apple-touch-icon.png',
  './tfhs-maskable-512.png',
  './images/staff/photos.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(ASSETS_TO_CACHE.map((u) => cache.add(u).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 1) Audio / video and any Range request: let the browser talk to the network directly.
  //    (Cached full responses break seeking and playback of MP3 files.)
  const path = new URL(req.url).pathname;
  if (req.destination === 'audio' || req.destination === 'video' ||
      req.headers.has('range') || /\.(mp3|mp4|m4a|ogg|wav)$/i.test(path)) {
    return;
  }

  // 2) Pages: NETWORK FIRST, so a new upload shows up at once; the cached copy is used only when offline.
  //    FIXED: only the portal itself (site root / index.html) is stored as './index.html'.
  //    Any other page (e.g. routine.html) is stored under its OWN address, so it can never replace the portal's copy.
  if (req.mode === 'navigate') {
    const root = new URL('./', self.registration.scope).pathname;
    const isPortal = path === root || path === root + 'index.html';
    const key = isPortal ? './index.html' : req;
    event.respondWith(
      fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(key, copy));
        }
        return networkResponse;
      }).catch(() => caches.match(key).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  // 3) Everything else (icons, photos, ...): cache first, as before.
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(req).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
