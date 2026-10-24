/* PML Console — service worker сборки 2026.10.24-437ab5 (пишет build.py, 24.10). Файлы сборки — в кеш при установке,
   дальше из кеша, без сети. Новая сборка ставится рядом и ждёт 'skip' — кнопку «Обновить» на странице. */
const V = 'pmlc-2026.10.24-437ab5', FILES = ["./", "index.html", "app.js", "app.css", "theme.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'}))))));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(K => Promise.all(K.filter(k => k.startsWith('pmlc-') && k !== V).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(r.mode === 'navigate' ? './' : r, {ignoreSearch: true}).then(h => h || fetch(r))));
});
