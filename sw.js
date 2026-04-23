const CACHE = 'aurum-v1';
const SHELL = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// Beim Install: App-Shell cachen
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

// Beim Activate: alte Caches löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch-Strategie
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Externe APIs: immer vom Netz (kein Caching)
  if (
    url.includes('coinbase.com') ||
    url.includes('ecb.europa.eu') ||
    url.includes('frankfurter.app') ||
    url.includes('freegoldapi.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // App-Shell: Cache-first, bei Miss vom Netz nachladen und cachen
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
