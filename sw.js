/* service worker.
   ★ CACHE 값은 app_template.html 의 APP.slug 와 반드시 맞출 것 (앱마다 달라야 함).
     예) shooong-v001 / vitamin-v001 / flash-v001 / frac-v001
   ★ 릴리스마다 뒤 번호를 올릴 것 (v001 → v002 …). 안 올리면 구버전이 캐시로 남는다. */
var CACHE = 'shooong-v034'; /* v033: 난이도2 내장 교체 — 설문1 반영 덧·뺄·다항 상향 (20260902 15:00 공지) */
var ASSETS = ['./', './index.html', './icon.png', './bgm.mp3']; /* v030: 인트로·엔딩 mp4 제거(영상 삭제) → 캐시 공간 확보 / bgm.mp3 추가(키없는 유저 배경음악). 추후 원복 시 mp4 2개 되살리고 bgm 제거 */

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

/* Range 요청(동영상) 대응 (2026-08-14).
   캐시는 200 전체 응답만 갖고 있어서, 그대로 돌려주면 iOS Safari 가 <video> 재생을 거부한다.
   Range 헤더가 오면 캐시본을 잘라 206 Partial Content 로 만들어 돌려준다. */
function rangeFromCache(req) {
  var url = req.url.split('?')[0];
  return caches.match(url).then(function (res) {
    if (!res) return fetch(req);
    return res.arrayBuffer().then(function (ab) {
      var total = ab.byteLength;
      var m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
      var start = (m && m[1]) ? parseInt(m[1], 10) : 0;
      var end = (m && m[2]) ? parseInt(m[2], 10) : total - 1;
      if (isNaN(start) || start < 0) start = 0;
      if (isNaN(end) || end >= total) end = total - 1;
      if (start > end) start = 0;
      var body = ab.slice(start, end + 1);
      return new Response(body, {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Length': String(body.byteLength),
          'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
          'Accept-Ranges': 'bytes'
        }
      });
    });
  }).catch(function () { return fetch(req); });
}

self.addEventListener('fetch', function (e) {
  if (e.request.headers.get('range')) { e.respondWith(rangeFromCache(e.request)); return; }
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request);
    })
  );
});
