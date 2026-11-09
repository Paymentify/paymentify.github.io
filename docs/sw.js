const CACHE = 'paymentify-v6';
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

// Own files: network first (so updates show right away), cache as the offline fallback.
// Firebase library files: cache first.
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  var same = u.origin === self.location.origin;
  if (req.method !== 'GET' || !(same || u.hostname === 'www.gstatic.com') || u.pathname.indexOf('/__/') === 0) return;
  if (same) {
    var net = fetch(req.url, { cache: 'no-cache' }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
    var wait = new Promise(function (_, reject) { setTimeout(reject, 4000); });
    e.respondWith(
      Promise.race([net, wait]).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || net.catch(function () { return caches.match('index.html'); }); });
      })
    );
  } else {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
          return res;
        });
      })
    );
  }
});
