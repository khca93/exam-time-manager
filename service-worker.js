const CACHE_NAME = 'exam-time-manager-v1';
const PRECACHE_URLS = [
  '/exam-time-manager/',
  '/exam-time-manager/index.html',
  '/exam-time-manager/Logo.png',
  '/exam-time-manager/student1.png',
  '/exam-time-manager/student2.png',
  // add other assets you want cached
];

// Install: pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy for app shell; network fallback for others
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // only handle same-origin requests for this site
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          // cache fetched response for next time (optional)
          return caches.open(CACHE_NAME).then(cache => {
            // clone response because response is a stream
            cache.put(req, res.clone());
            return res;
          });
        }).catch(() => {
          // optional: return offline fallback (e.g., index.html) for navigations
          if (req.mode === 'navigate') {
            return caches.match('/exam-time-manager/index.html');
          }
        });
      })
    );
  }
});
