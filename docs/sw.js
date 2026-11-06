const CACHE = 'paymentify-v3';
const FILES = ['./', 'index.html', 'cloud.js', 'firebase-config.js', 'manifest.webmanifest', 'favicon.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'paymentify-icon.PNG'];
const SDK = ['app', 'auth', 'firestore'].map(function (n) { return 'https://www.gstatic.com/firebasejs/10.14.1/firebase-' + n + '.js'; });

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES).then(function () {
      return Promise.all(SDK.map(function (u) { return c.add(new Request(u, { mode: 'cors' })).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Cache first (works offline); refresh in the background when online.
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  var ok = u.origin === self.location.origin || u.hostname === 'www.gstatic.com';
  if (req.method !== 'GET' || !ok || u.pathname.indexOf('/__/') === 0) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit || caches.match('index.html'); });
      return hit || net;
    })
  );
});
