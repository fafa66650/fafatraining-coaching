const CACHE='fafatraining-v59-3-clean-pro';
const ASSETS=[
 './',
 './index.html',
 './style.css',
 './app.js',
 './manifest.json',
 './data/exercises.json',
 './data/programs.json',
 './data/filters.json',
 './data/muscle_groups.json',
 './assets/logo/logo-fafa.jpg',
 './assets/logo/logo-fafa.svg'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
