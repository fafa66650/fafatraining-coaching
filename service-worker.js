const CACHE='fafatraining-v44-top-app';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./data/exercises.json','./data/programs.json','./data/visual_map.json','./data/level_rules.json','./data/progression.json','./data/injury_groups.json','./data/equipment_groups.json','./data/scales.json','./data/quick_goals.json','./data/places.json','./data/ultra_rules.json','./data/style_colors.json','./data/sport_categories.json','./data/immersion.json','./data/muscle_groups.json','./data/program_families.json','./data/ui_config.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html'))))});
