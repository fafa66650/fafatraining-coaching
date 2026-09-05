const CACHE="fafatraining-v84";
const CORE=["./","./index.html","./styles/app.css?v=84","./src/app.bundle.js?v=84","./assets/logo/logo-fafatraining.jpg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 e.respondWith(fetch(e.request).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(e.request,c));}return r;})
 .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});