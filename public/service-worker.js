const CACHE_VERSION = 'v2';
const STATIC_CACHE = `knost-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `knost-runtime-${CACHE_VERSION}`;

// Static shell assets to precache (add hashed bundle paths during build if desired)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/manifest.json',
  '/welcome-illustration.png',
  '/social-preview.png',
  '/logo192.png',
  '/logo512.png',
  '/logo192-maskable.png',
  '/logo512-maskable.png',
  '/screenshots/dashboard-mobile.png',
  '/screenshots/dashboard-desktop.png'
];

const isSameOrigin = (url) => url.origin === self.location.origin;
const isApiRequest = (url) => url.pathname.startsWith('/api/');
const isStaticRequest = (request, url) => {
  if (url.pathname.startsWith('/assets/')) return true; // Vite hashed assets
  return ['style', 'script', 'image', 'font'].includes(request.destination);
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          const isOldKnostCache = key.startsWith('knost-') && !key.includes(CACHE_VERSION);
          if (isOldKnostCache) {
            return caches.delete(key);
          }
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  // Network-first for API to avoid stale financial data
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Offline', message: 'Data unavailable while offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      )
    );
    return;
  }

  // Navigation: network-first, fallback to cached shell
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => (response && response.ok ? response : caches.match('/index.html')))
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first with runtime fill
  if (isStaticRequest(request, url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (!response || !response.ok) return response;
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => caches.match('/welcome-illustration.png'));
      })
    );
    return;
  }
});

// Allow clients to trigger skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
