// SWEET HOME service worker v4
// الشبكة أولاً عشان التحديثات توصل فوراً، ولو مفيش نت نرجع للنسخة المخزنة.
// طلبات Firebase وGoogle (خارج موقعنا) بنسيبها تعدّي مباشرة.
const CACHE = 'sweet-home-v5';
const CORE = ['./', 'index.html', 'app.js', 'manifest.json', 'data.json', 'logo.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'privacy.html', 'delete-account.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)
        )
      )
  );
});
