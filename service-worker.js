const CACHE='fafatraining-v65-ultra-pro';
const ASSETS=['./','./index.html','./style.css','./app.js','./js/engine.js','./data/exercises.json','./data/programs.json','./assets/logo/logo-fafa.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim())});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
