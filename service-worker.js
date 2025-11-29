const CACHE_NAME = 'exam-time-manager-v2'; // Version बदलली आहे (cache update होण्यासाठी)

// अद्ययावत फाईल लिस्ट (New Image Names included)
const PRECACHE_URLS = [
  './',                  
  './index.html',
  './icon-192.png',      // Logo.png च्या जागी
  './icon-512.png',      // student1.png च्या जागी
  './student2.png'       // ही इमेज अजूनही वापरत आहोत
  // जर तुम्ही manifest.json बनवली असेल तर खालील ओळ अनकमेंट करा:
  // './manifest.json'
];

// 1. Install Event: फाइल्स कॅश (Cache) करा
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: जुनी कॅश (Old Cache) डिलीट करा
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: ऑफलाइन असताना कॅशमधील फाइल्स वापरा
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // फक्त आपल्याच साईटच्या रिक्वेस्ट हँडल करा
  if (req.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(req).then(cachedResponse => {
        // 1. कॅशमध्ये फाइल असेल तर तीच वापरा (Offline Support)
        if (cachedResponse) {
          return cachedResponse;
        }

        // 2. नसेल तर नेटवर्कवरून आणा आणि कॅशमध्ये ठेवा
        return fetch(req).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          // 3. नेटवर्क पण नाही आणि फाइल पण नाही (Offline fallback for HTML)
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});