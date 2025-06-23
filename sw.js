const CACHE_NAME = 'tile_crawler_cache_v1';
const ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/style.css'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
