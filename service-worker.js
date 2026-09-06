const CACHE="fafatraining-v94-2";
const CORE=["./","./index.html","./styles/fafatraining-v94.css","./src/fafatraining-coach-v94.js","./data/exercises-v94.json","./data/templates-v94.json","./manifest.json"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener("activate",e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;const u=new URL(e.request.url);if(e.request.mode==="navigate"||/index\.html$/.test(u.pathname)){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match("./index.html")));return;}e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))})
