const CACHE='fafatraining-v58-programmes-premium';
const ASSETS=[
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./data/programs.json",
  "./data/exercises.json",
  "./data/quick_goals.json",
  "./data/muscle_groups.json",
  "./data/program_styles.json",
  "./data/style_labels.json",
  "./data/avatar_map.json",
  "./data/menu_map.json",
  "./data/filters.json",
  "./data/coach_engine.json",
  "./data/ui_config.json",
  "./assets/placeholders/avatar-placeholder.svg",
  "./assets/placeholders/exercise-placeholder.svg",
  "./assets/placeholders/menu-placeholder.svg"
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>null));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>{if(e.request.method==='GET')c.put(e.request,copy)});return res}).catch(()=>caches.match('./index.html'))))});
