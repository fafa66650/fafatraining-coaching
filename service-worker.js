const CACHE='fafatraining-v51-linked-files';
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
  "./data/ui_config.json",
  "./assets/placeholders/avatar-placeholder.svg",
  "./assets/placeholders/exercise-placeholder.svg",
  "./assets/placeholders/menu-placeholder.svg",
  "./assets/logo/logo-fafatraining.jpg"
];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).catch(()=>null));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));self.clients.claim();});
self.addEventListener('fetch',event=>{event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>{if(event.request.method==='GET')cache.put(event.request,copy)});return response;}).catch(()=>caches.match('./index.html'))));});
