const CACHE='fafatraining-v50-github-1777817026';
const ASSETS=[
 './',
 './index.html',
 './style.css',
 './app.js',
 './manifest.json',
 './data/exercises.json',
 './data/programs.json',
 './data/quick_goals.json',
 './data/muscle_groups.json',
 './data/program_styles.json',
 './data/style_labels.json',
 './data/avatar_map.json',
 './assets/logo/logo-fafatraining.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => {
          if (event.request.method === 'GET') cache.put(event.request, copy);
        });
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
