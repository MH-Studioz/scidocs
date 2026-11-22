/* SciDocs offline shell. Bump CACHE when app.js, styles.css or the shell changes. */
const CACHE = 'scidocs-v1.3.4';
const CORE = [
  './',
  './index.html',
  './styles.css?v=1.3.4',
  './app.js?v=1.3.4',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

const CDN = [
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/hint/show-hint.min.css',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/dialog/dialog.min.css',
  'https://cdn.jsdelivr.net/npm/lucide@0.469.0/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/lib/codemirror.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/mode/stex/stex.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/matchbrackets.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/edit/closebrackets.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/selection/active-line.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/hint/show-hint.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/dialog/dialog.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/search/searchcursor.min.js',
  'https://cdn.jsdelivr.net/npm/codemirror@5.65.16/addon/search/search.min.js',
  'https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then(async (cache) => {
        await cache.addAll(CORE);
        await Promise.allSettled(CDN.map((url) => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(CACHE).then((cache) => cache.put('./index.html', response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  const sameOrigin = url.origin === self.location.origin;
  const runtimeCdn = /(^|\.)jsdelivr\.net$/.test(url.hostname) ||
    /(^|\.)googleapis\.com$/.test(url.hostname) ||
    /(^|\.)gstatic\.com$/.test(url.hostname);
  if (!sameOrigin && !runtimeCdn) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && (response.ok || response.type === 'opaque')) {
          caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
        }
        return response;
      });
    })
  );
});
