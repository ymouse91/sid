/* Simple cache-first service worker for Solitaire Dice PWA */

const CACHE_VERSION = 'v1.0.1';
const APP_CACHE = `sid-${CACHE_VERSION}`;

const APP_SHELL = [
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  '.icons/icon-192.png',
  '.icons/icon-512.png',
  './apple-touch-icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // Put a copy in cache (ignore opaque/cross-origin)
      try {
        const copy = res.clone();
        if (req.method === 'GET' && copy.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
      } catch(_) {}
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});