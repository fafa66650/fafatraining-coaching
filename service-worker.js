const CACHE='fafatraining-v93-cachefix-1';
const ASSETS=["./","./index.html","./404.html","./manifest.json","./styles/fafatraining-v93.css","./src/fafatraining-coach-v93.js","./data/exercises-v93.json","./data/templates-v93.json","./assets/logo/logo-fafatraining.jpg","./assets/logo/logo-fafatraining-full.jpg","./assets/logo/logo-fafatraining-header.jpg","./assets/icons/icon-192.png","./assets/icons/icon-512.png","./assets/visuals/avatar-action.jpeg","./assets/visuals/avatar-coach.jpeg","./assets/visuals/avatar-recovery.jpeg","./assets/visuals/battlerope.jpeg","./assets/visuals/boxing.jpeg","./assets/visuals/cardio.jpeg","./assets/visuals/coaching.jpeg","./assets/visuals/fullbody.jpeg","./assets/visuals/hiit.jpeg","./assets/visuals/hyrox.jpeg","./assets/visuals/mental.jpeg","./assets/visuals/mobility.jpeg","./assets/visuals/strength-dumbbells.jpeg"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  const same=u.origin===self.location.origin;
  if(!same)return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r && r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}
      return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  const fresh=/\/(data|src)\//.test(u.pathname)||u.pathname.endsWith('.html')||u.pathname.endsWith('service-worker.js');
  if(fresh){
    e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{
      if(r && r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
      return r;
    }).catch(()=>caches.match(e.request,{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(cached=>cached||fetch(e.request).then(r=>{
    if(r && r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));}
    return r;
  })));
});
