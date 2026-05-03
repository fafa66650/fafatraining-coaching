const CACHE='fafatraining-v47-clean-fix-ecran-noir-v2';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./data/exercises.json','./data/programs.json','./data/quick_goals.json','./data/program_families.json','./data/muscle_groups.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))))});
