const CACHE="fafatraining-v82";
const CORE=["./","./index.html","./styles/app.css","./src/app.js","./src/storage.js","./src/coach-engine.js","./data/exercises.json","./data/programs.json","./data/master-movements.json","./assets/logo/logo-fafatraining.jpg","./assets/visuals/battlerope.jpeg","./assets/visuals/mental.jpeg","./assets/visuals/avatar-recovery.jpeg","./assets/visuals/hiit.jpeg","./assets/visuals/fullbody.jpeg","./assets/visuals/boxing.jpeg","./assets/visuals/hyrox.jpeg","./assets/visuals/avatar-coach.jpeg","./assets/visuals/strength-dumbbells.jpeg","./assets/visuals/kettlebell.jpeg","./assets/visuals/avatar-action.jpeg","./assets/visuals/mobility.jpeg","./assets/visuals/cardio.jpeg","./assets/visuals/coaching.jpeg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET") return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});