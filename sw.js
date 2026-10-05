// SWEET HOME service worker v2
// يتجاهل طلبات Firebase وGoogle ويعدّي أي طلب خارجي مباشرة
const CACHE = 'sweet-home-v2';

self.addEventListener('install', () => self.skipWaiting());

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

  // لا نتدخل في أي طلب غير GET أو خارج موقعنا (Firebase, Google, ...)
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // الشبكة أولاً، ولو مفيش نت نرجع للنسخة المخزنة
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
