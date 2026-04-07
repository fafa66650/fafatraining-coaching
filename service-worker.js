
const CACHE='fafa-v10-elite';
const ASSETS=['./','./index.html','./style.css','./app.js','./assets/logo.jpg','./data/exercises.json','./data/meta.json','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); return res;
  }).catch(()=>caches.match('./index.html'))));
});
