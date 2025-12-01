// service-worker.js (robust, safe)
const CACHE_NAME = 'exam-time-manager-v1';
const PRECACHE_URLS = [
  '/exam-time-manager/',
  '/exam-time-manager/index.html',
  '/exam-time-manager/icon-192.png',
  '/exam-time-manager/icon-512.png',
  '/exam-time-manager/Logo.png',
  '/exam-time-manager/student1.png',
  '/exam-time-manager/student2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS).catch(err => {
        // अगर काही एरर आला तर install fail होऊ नये — warning log करा
        console.warn('Some resources failed to cache during install:', err);
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => (key !== CACHE_NAME) ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // फक्त आपल्या GitHub Pages path handle करतो (बाकी ब्राउझरहाच handle करेल)
  if (url.origin === location.origin && url.pathname.startsWith('/exam-time-manager')) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;

        return fetch(req).then(networkResponse => {
          // invalid response परत करू नका
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          // networkResponse cache मध्ये ठेवा (clone करुन)
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(req, copy); } catch(e) { console.warn('Cache put failed', e); }
          });
          return networkResponse;
        }).catch(() => {
          // network failure : navigation requests साठी index.html परत करा
          if (req.mode === 'navigate' || (req.headers && req.headers.get && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
            return caches.match('/exam-time-manager/index.html');
          }
          // अन्यथा cached fallback शोधा किंवा offline response द्या
          return caches.match(req).then(fallback => fallback || new Response('Offline', { status: 503, statusText: 'Offline' }));
        });
      }).catch(err => {
        console.error('SW fetch handler unexpected error:', err);
        return caches.match('/exam-time-manager/index.html');
      })
    );
  }
  // other origins: let browser handle
});
