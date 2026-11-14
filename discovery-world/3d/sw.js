// Offline helper for the home-screen app: keeps a copy of the game on the device.
// The game page is fetched fresh when online (so updates arrive) and from the copy when offline.
// (build 28) 'no-cache': always ask GitHub whether the page changed (a quick check that downloads nothing when it
// hasn't), so a new version arrives the next time the app is opened instead of after the 10-minute web cache.
const CACHE = 'dawsons-world-v42';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/index.html') || req.url.endsWith('/');
  if (isPage) e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r; }).catch(() => caches.match('./index.html')));
  else e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
