/* service worker.
   ★ CACHE 값은 app_template.html 의 APP.slug 와 반드시 맞출 것 (앱마다 달라야 함).
     예) shooong-v001 / vitamin-v001 / flash-v001 / frac-v001
   ★ 릴리스마다 뒤 번호를 올릴 것 (v001 → v002 …). 안 올리면 구버전이 캐시로 남는다. */
var CACHE = 'shooong-v002';
var ASSETS = ['./', './index.html', './icon.png', './praxis_ending.mp4']; /* 엔딩 비디오 (20260811) */

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request);
    })
  );
});
